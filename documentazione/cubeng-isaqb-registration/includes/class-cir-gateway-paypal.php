<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CIR_Gateway_PayPal {
	private static $instance = null;
	private $mode;
	private $client_id;
	private $secret;
	private $currency;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->mode      = CIR_Settings::get_option( 'paypal_mode', 'sandbox' );
		$this->client_id = CIR_Settings::get_option( 'paypal_client_id', '' );
		$this->secret    = CIR_Settings::get_option( 'paypal_secret', '' );
		$this->currency  = CIR_Settings::get_option( 'paypal_currency', 'EUR' );

		add_filter( 'query_vars', [ $this, 'register_query_vars' ] );
		add_action( 'template_redirect', [ $this, 'maybe_handle_return' ] );
	}

	public function register_query_vars( $vars ) {
		$vars[] = 'cir_paypal';
		$vars[] = 'registration_id';
		return $vars;
	}

	private function get_api_base() {
		return ( 'live' === $this->mode ) ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
	}

	private function get_access_token() {
		if ( empty( $this->client_id ) || empty( $this->secret ) ) {
			error_log( 'CIR PayPal: client_id o secret mancanti.' );
			return false;
		}

		$response = wp_remote_post( $this->get_api_base() . '/v1/oauth2/token', [
			'headers' => [
				'Authorization' => 'Basic ' . base64_encode( $this->client_id . ':' . $this->secret ),
				'Content-Type'  => 'application/x-www-form-urlencoded',
			],
			'body'    => 'grant_type=client_credentials',
			'timeout' => 30,
		] );

		if ( is_wp_error( $response ) ) {
			error_log( 'CIR PayPal: errore HTTP nel recupero token - ' . $response->get_error_message() );
			return false;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( empty( $data['access_token'] ) ) {
			error_log( 'CIR PayPal: risposta token non valida - ' . $body );
			return false;
		}

		return $data['access_token'];
	}

	public function create_order( $post_id, $totals, $context = [] ) {
		$token = $this->get_access_token();
		if ( ! $token ) {
			error_log( 'CIR PayPal: impossibile generare il token.' );
			return false;
		}

		$amount_value = number_format( $totals['total'], 2, '.', '' );
		$description  = $this->get_payment_description_from_context( $context );

		$body = [
			'intent'         => 'CAPTURE',
			'purchase_units' => [
				[
					'reference_id' => (string) $post_id,
					'amount'       => [
						'currency_code' => $this->currency,
						'value'         => $amount_value,
					],
					'description'  => $description,
				],
			],
			'application_context' => [
				'return_url' => $this->get_return_url( $post_id ),
				'cancel_url' => $this->get_cancel_url( $post_id ),
				'brand_name' => 'ITA-STQB',
				'user_action'=> 'PAY_NOW',
			],
		];

		$response = wp_remote_post( $this->get_api_base() . '/v2/checkout/orders', [
			'headers' => [
				'Authorization' => 'Bearer ' . $token,
				'Content-Type'  => 'application/json',
			],
			'body'    => wp_json_encode( $body ),
			'timeout' => 30,
		] );

		if ( is_wp_error( $response ) ) {
			error_log( 'CIR PayPal: errore HTTP create_order - ' . $response->get_error_message() );
			return false;
		}

		$response_body = wp_remote_retrieve_body( $response );
		error_log( 'CIR PayPal order response: ' . $response_body );
		$data = json_decode( $response_body, true );

		if ( empty( $data['links'] ) || empty( $data['id'] ) ) {
			error_log( 'CIR PayPal: ordine senza link di approvazione.' );
			return false;
		}

		update_post_meta( $post_id, 'paypal_order_id', $data['id'] );

		foreach ( $data['links'] as $link ) {
			if ( 'approve' === $link['rel'] && ! empty( $link['href'] ) ) {
				$redirect_url = esc_url_raw( $link['href'] );
				update_post_meta( $post_id, 'paypal_checkout_url', $redirect_url );
				do_action( 'cir_payment_link_created', $post_id, 'paypal', $redirect_url, $totals, $context );
				return $redirect_url;
			}
		}

		error_log( 'CIR PayPal: link di approvazione non trovato.' );
		return false;
	}

	private function get_return_url( $post_id ) {
		return add_query_arg(
			[
				'cir_paypal'      => 'return',
				'registration_id' => $post_id,
			],
			$this->get_thankyou_page_url()
		);
	}

	private function get_cancel_url( $post_id ) {
		return add_query_arg(
			[
				'cir_paypal'      => 'cancel',
				'registration_id' => $post_id,
			],
			$this->get_thankyou_page_url()
		);
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
				'cir_payment' => 'paypal',
				'status'      => $status,
				'order_id'    => $post_id,
			],
			$extra
		);

		return add_query_arg( $args, $this->get_thankyou_page_url() );
	}

	public function maybe_handle_return() {
		$action = get_query_var( 'cir_paypal' );
		if ( empty( $action ) && isset( $_GET['cir_paypal'] ) ) {
			$action = sanitize_text_field( wp_unslash( $_GET['cir_paypal'] ) );
		}

		if ( ! $action ) {
			return;
		}

		$post_id  = absint( get_query_var( 'registration_id' ) ?: ( $_GET['registration_id'] ?? 0 ) );
		$order_id = sanitize_text_field( wp_unslash( $_GET['token'] ?? '' ) );

		if ( ! $post_id || empty( $order_id ) ) {
			error_log( 'CIR PayPal: ritorno senza post_id o token.' );
			if ( $post_id ) {
				CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );
			}
			wp_safe_redirect( $this->build_status_url( 'error', max( 0, $post_id ) ) );
			exit;
		}

		if ( 'cancel' === $action ) {
			update_post_meta( $post_id, 'payment_status', 'cancelled' );
			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'cancelled' );
			wp_safe_redirect( $this->build_status_url( 'canceled', $post_id ) );
			exit;
		}

		$token = $this->get_access_token();

		if ( ! $token ) {
			error_log( 'CIR PayPal: impossibile ottenere token per capture.' );
			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );
			wp_safe_redirect( $this->build_status_url( 'error', $post_id ) );
			exit;
		}

		$response = wp_remote_post(
			sprintf( '%s/v2/checkout/orders/%s/capture', $this->get_api_base(), $order_id ),
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $token,
					'Content-Type'  => 'application/json',
				],
				'timeout' => 30,
			]
		);

		if ( is_wp_error( $response ) ) {
			error_log( 'CIR PayPal: errore HTTP capture - ' . $response->get_error_message() );
			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );
			wp_safe_redirect( $this->build_status_url( 'error', $post_id ) );
			exit;
		}

		$body = wp_remote_retrieve_body( $response );
		error_log( 'CIR PayPal capture response: ' . $body );
		$data = json_decode( $body, true );

		if ( isset( $data['status'] ) && in_array( $data['status'], [ 'COMPLETED', 'APPROVED' ], true ) ) {
			update_post_meta( $post_id, 'payment_status', 'paid' );
			update_post_meta( $post_id, 'paypal_capture', $data );

			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'paid' );
			CIR_Form_Handler::get_instance()->send_confirmation_emails( $post_id );

			wp_safe_redirect( $this->build_status_url( 'success', $post_id, [ 'paypal_order' => $order_id ] ) );
			exit;
		}

		update_post_meta( $post_id, 'payment_status', 'failed' );
		update_post_meta( $post_id, 'paypal_capture', $data );
		CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );

		wp_safe_redirect( $this->build_status_url( 'error', $post_id ) );
		exit;
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

