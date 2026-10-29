<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CIR_Gateway_SumUp {
	private static $instance = null;
	private $api_key;
	private $merchant_code;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->api_key       = CIR_Settings::get_option( 'sumup_api_key', '' );
		$this->merchant_code = CIR_Settings::get_option( 'sumup_merchant_code', '' );

		add_filter( 'query_vars', [ $this, 'register_query_vars' ] );
		add_action( 'template_redirect', [ $this, 'maybe_handle_return' ] );
	}

	public function create_checkout( $post_id, $totals, $context = [] ) {
		if ( empty( $this->api_key ) ) {
			error_log( 'CIR SumUp: API key mancante.' );
			return false;
		}

		if ( empty( $this->merchant_code ) ) {
			error_log( 'CIR SumUp: merchant_code mancante.' );
			return false;
		}

		$description = $this->get_payment_description_from_context( $context );

		$success_url = add_query_arg(
			[
				'cir_sumup'       => 'success',
				'registration_id' => $post_id,
			],
			$this->get_thankyou_page_url()
		);

		$cancel_url = add_query_arg(
			[
				'cir_sumup'       => 'cancel',
				'registration_id' => $post_id,
			],
			$this->get_thankyou_page_url()
		);

		$body = [
			'checkout_reference' => 'reg-' . $post_id,
			'amount'             => number_format( $totals['total'], 2, '.', '' ),
			'currency'           => 'EUR',
			'merchant_code'      => $this->merchant_code,
			'description'        => $description,
			'return_url'         => $success_url,
			'cancel_url'         => $cancel_url,
			'redirect_url'       => $success_url,
			'hosted_checkout'    => [
				'enabled' => true,
			],
		];

		$response = wp_remote_post(
			'https://api.sumup.com/v0.1/checkouts',
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $this->api_key,
					'Content-Type'  => 'application/json',
				],
				'body'    => wp_json_encode( $body ),
				'timeout' => 30,
			]
		);

		if ( is_wp_error( $response ) ) {
			error_log( 'CIR SumUp: errore HTTP create_checkout - ' . $response->get_error_message() );
			return false;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$raw_body    = wp_remote_retrieve_body( $response );

		if ( $status_code < 200 || $status_code >= 300 ) {
			error_log( sprintf( 'CIR SumUp: risposta non valida (%d) - %s', $status_code, $raw_body ) );
			return false;
		}

		$data = json_decode( $raw_body, true );

		if ( empty( $data['id'] ) ) {
			error_log( 'CIR SumUp: nessun ID restituito - ' . $raw_body );
			return false;
		}

		update_post_meta( $post_id, 'sumup_checkout_id', $data['id'] );

		$redirect_url = $data['hosted_checkout_url']
			?? $data['checkout_url']
			?? $data['redirect_url']
			?? '';

		if ( ! $redirect_url ) {
			$redirect_url = sprintf( 'https://checkout.sumup.com/%s', $data['id'] );
			error_log( 'CIR SumUp: uso fallback checkout_url - ' . $redirect_url );
		} else {
			error_log( 'CIR SumUp: hosted checkout attivo - ' . $redirect_url );
		}

		
		$redirect_url = esc_url_raw( $redirect_url );

		update_post_meta( $post_id, 'sumup_checkout_url', $redirect_url );

		/**
		 * Permette di reagire alla creazione del checkout (es. inviare email di promemoria).
		 */
		do_action( 'cir_payment_link_created', $post_id, 'sumup', $redirect_url, $totals, $context );

		return $redirect_url;
	}

	public function register_query_vars( $vars ) {
		$vars[] = 'cir_sumup';
		$vars[] = 'registration_id';
		return $vars;
	}

	public function maybe_handle_return() {
		$action = get_query_var( 'cir_sumup' );
		if ( empty( $action ) && isset( $_GET['cir_sumup'] ) ) {
			$action = sanitize_text_field( wp_unslash( $_GET['cir_sumup'] ) );
		}

		if ( ! $action ) {
			return;
		}

		$post_id     = absint( get_query_var( 'registration_id' ) ?: ( $_GET['registration_id'] ?? 0 ) );
		$checkout_id = get_post_meta( $post_id, 'sumup_checkout_id', true );

		if ( ! $post_id || ! $checkout_id ) {
			error_log( 'CIR SumUp: ritorno senza post_id o checkout_id.' );
			if ( $post_id ) {
				CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );
			}
			wp_safe_redirect( $this->build_status_url( 'error', $post_id ) );
			exit;
		}

		if ( 'cancel' === $action ) {
			update_post_meta( $post_id, 'payment_status', 'cancelled' );
			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'cancelled' );
			wp_safe_redirect( $this->build_status_url( 'canceled', $post_id ) );
			exit;
		}

		$response = wp_remote_get(
			'https://api.sumup.com/v0.1/checkouts/' . $checkout_id,
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $this->api_key,
				],
				'timeout' => 30,
			]
		);

		if ( is_wp_error( $response ) ) {
			error_log( 'CIR SumUp: errore HTTP status checkout - ' . $response->get_error_message() );
			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'failed' );
			wp_safe_redirect( $this->build_status_url( 'error', $post_id ) );
			exit;
		}

		$data   = json_decode( wp_remote_retrieve_body( $response ), true );
		error_log( 'CIR SumUp response keys: ' . implode( ', ', array_keys( $data ) ) );
		$status = strtoupper( $data['status'] ?? '' );

if ( 'PAID' === $status ) {
			update_post_meta( $post_id, 'payment_status', 'paid' );
			update_post_meta( $post_id, 'sumup_checkout', $data );

			CIR_Form_Handler::get_instance()->update_registration_payment_status( $post_id, 'paid' );
			CIR_Form_Handler::get_instance()->send_confirmation_emails( $post_id );

			wp_safe_redirect( $this->build_status_url( 'success', $post_id ) );
			exit;
		}

		update_post_meta( $post_id, 'payment_status', 'failed' );
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
				'cir_payment' => 'sumup',
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