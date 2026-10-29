<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CIR_Gateway_Stripe {
	private static $instance = null;
	private $publishable;
	private $secret;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->publishable = CIR_Settings::get_option( 'stripe_publishable_key', '' );
		$this->secret      = CIR_Settings::get_option( 'stripe_secret_key', '' );

		add_filter( 'query_vars', [ $this, 'register_query_vars' ] );
		add_action( 'template_redirect', [ $this, 'maybe_handle_return' ] );
	}

	public function register_query_vars( $vars ) {
		$vars[] = 'cir_stripe';
		$vars[] = 'registration_id';
		$vars[] = 'session_id';
		return $vars;
	}

	public function create_checkout_session( $post_id, $totals, $context = [] ) {
		if ( empty( $this->secret ) ) {
			return false;
		}

		$description = $this->get_payment_description_from_context( $context );

		$success_url = add_query_arg(
			[
				'cir_stripe'      => 'success',
				'registration_id' => $post_id,
				'session_id'      => '{CHECKOUT_SESSION_ID}',
			],
			$this->get_thankyou_page_url()
		);

		$cancel_url = add_query_arg(
			[
				'cir_stripe'      => 'cancel',
				'registration_id' => $post_id,
			],
			$this->get_thankyou_page_url()
		);

		$body = [
			'mode'                                           => 'payment',
			'success_url'                                    => $success_url,
			'cancel_url'                                     => $cancel_url,
			'payment_method_types[]'                         => 'card',
			'line_items[0][price_data][currency]'            => 'eur',
			'line_items[0][price_data][unit_amount]'         => (int) round( $totals['total'] * 100 ),
			'line_items[0][price_data][product_data][name]'  => $description,
			'line_items[0][quantity]'                        => 1,
			'metadata[registration_id]'                      => $post_id,
		];

		$response = wp_remote_post(
			'https://api.stripe.com/v1/checkout/sessions',
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $this->secret,
				],
				'body'    => $body,
				'timeout' => 30,
			]
		);

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $data['url'] ) ) {
			return false;
		}

		update_post_meta( $post_id, 'stripe_session_id', $data['id'] );

		$redirect_url = esc_url_raw( $data['url'] );
		update_post_meta( $post_id, 'stripe_checkout_url', $redirect_url );
		do_action( 'cir_payment_link_created', $post_id, 'stripe', $redirect_url, $totals, $context );

		return $redirect_url;
	}

	public function maybe_handle_return() {
		$action = get_query_var( 'cir_stripe' );
		if ( empty( $action ) && isset( $_GET['cir_stripe'] ) ) {
			$action = sanitize_text_field( wp_unslash( $_GET['cir_stripe'] ) );
		}

		if ( ! $action ) {
			return;
		}

		$post_id    = absint( get_query_var( 'registration_id' ) ?: ( $_GET['registration_id'] ?? 0 ) );
		$session_id = sanitize_text_field( get_query_var( 'session_id' ) ?: ( $_GET['session_id'] ?? '' ) );

		if ( ! $post_id ) {
			wp_safe_redirect( $this->build_status_url( 'error', 0 ) );
			exit;
		}

		if ( 'cancel' === $action ) {
			update_post_meta( $post_id, 'payment_status', 'cancelled' );
			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'cancelled' );
			wp_safe_redirect( $this->build_status_url( 'canceled', $post_id ) );
			exit;
		}

		if ( empty( $session_id ) || empty( $this->secret ) ) {
			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );
			wp_safe_redirect( $this->build_status_url( 'error', $post_id ) );
			exit;
		}

		$response = wp_remote_get(
			'https://api.stripe.com/v1/checkout/sessions/' . $session_id,
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $this->secret,
				],
				'timeout' => 30,
			]
		);

		if ( is_wp_error( $response ) ) {
			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );
			wp_safe_redirect( $this->build_status_url( 'error', $post_id ) );
			exit;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $data['payment_status'] ) && 'paid' === $data['payment_status'] ) {
			update_post_meta( $post_id, 'payment_status', 'paid' );
			update_post_meta( $post_id, 'stripe_session', $data );

			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'paid' );
			CIR_Form_Handler::get_instance()->send_confirmation_emails( $post_id );

			wp_safe_redirect(
				$this->build_status_url(
					'success',
					$post_id,
					[
						'stripe_session' => $session_id,
					]
				)
			);
			exit;
		}

		update_post_meta( $post_id, 'payment_status', 'failed' );
		update_post_meta( $post_id, 'stripe_session', $data );
		CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );

		wp_safe_redirect( $this->build_status_url( 'error', $post_id ) );
		exit;
	}

	private function get_thankyou_page_url() {
		$page_id = (int) apply_filters( 'cir_payment_thankyou_page_id', 0 );

		if ( ! $page_id ) {
			$page_id = (int) CIR_Settings::get_option( 'payment_thankyou_page_id', 0 );
		}

		if ( $page_id && 'publish' === get_post_status( $page_id ) ) {
			$url = get_permalink( $page_id );
			if ( $url ) {
				return $url;
			}
		}

		$page = get_page_by_path( 'esito-pagamento' );
		if ( $page ) {
			$url = get_permalink( $page );
			if ( $url ) {
			 return $url;
			}
		}

		return home_url( '/' );
	}

	private function build_status_url( $status, $post_id, $extra = [] ) {
		$args = array_merge(
			[
				'cir_payment' => 'stripe',
				'status'      => $status,
				'order_id'    => $post_id,
			],
			$extra
		);

		return add_query_arg( $args, $this->get_thankyou_page_url() );
	}

	private function get_payment_description_from_context( $context ) {
		$description = $context['description'] ?? 'Corso CPSA-F';
		$description = wp_strip_all_tags( $description );

		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $description, 0, 120 );
		}

		return substr( $description, 0, 120 );
	}
}