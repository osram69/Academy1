<?php
/**
 * Gestore del form iSAQB (file principale).
 *
 * @package cubeng-isaqb-registration
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-cir-form-handler-support.php';
require_once __DIR__ . '/class-cir-form-handler-helpers.php';
require_once __DIR__ . '/class-cir-discount-service.php';
require_once __DIR__ . '/class-cir-settings.php';

class CIR_Form_Handler {
	use CIR_Form_Handler_Support;
	use CIR_Form_Handler_Helpers;

	/**
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * Opzioni consentite per il campo "Come hai saputo dell'evento".
	 *
	 * @var string[]
	 */
	private $learn_about_event_options = [
		'social_media',
		'newsletter',
		'passaparola',
		'sito_web',
		'partner',
		'stampa',
		'ricerca_google',
		'altro',
	];

	/**
	 * Singleton.
	 *
	 * @return self
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'admin_post_nopriv_cir_submit_registration', [ $this, 'handle_submission' ] );
		add_action( 'admin_post_cir_submit_registration', [ $this, 'handle_submission' ] );
		add_filter( 'gettext', [ $this, 'filter_reference_label' ], 10, 3 );
		add_action( 'cir_payment_link_created', [ $this, 'send_pending_payment_email' ], 10, 4 );
	}

	/**
	 * Gestisce il submit del form pubblico.
	 *
	 * @return void
	 */
	public function handle_submission() {
		$nonce = isset( $_POST['cir_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['cir_nonce'] ) ) : '';
		
		

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'cir_submit_registration' ) ) {
			wp_die( __( 'Nonce non valido.', 'cubeng-isaqb-registration' ) );
		}

		$raw_members_json = isset( $_POST['cir_members_json'] ) ? wp_unslash( $_POST['cir_members_json'] ) : '';
		$data             = $this->sanitize_recursive( wp_unslash( $_POST ) );
		
		$submission_uid = sanitize_text_field( $data['cir_submission_uid'] ?? '' );
		if ( empty( $submission_uid ) || get_transient( 'cir_submission_' . $submission_uid ) ) {
			wp_die( __( 'Invio già elaborato. Aggiorna la pagina e riprova.', 'cubeng-isaqb-registration' ) );
		}
		set_transient( 'cir_submission_' . $submission_uid, 1, MINUTE_IN_SECONDS * 10 );

		$event_date_param = isset( $_REQUEST['event_date'] )
			? sanitize_text_field( wp_unslash( $_REQUEST['event_date'] ) )
			: '';

		if ( $event_date_param ) {
			$data['event_date'] = $event_date_param;
		}

		$data['course_id'] = isset( $_REQUEST['course_id'] )
			? absint( $_REQUEST['course_id'] )
			: 0;

		$raw_people = isset( $data['number_registrants'] ) ? (int) $data['number_registrants'] : 1;
		$people     = max( 1, min( 50, $raw_people ) );
		$data['number_registrants'] = $people;

		$decoded_members = $raw_members_json ? json_decode( $raw_members_json, true ) : null;

		if ( is_array( $decoded_members ) ) {
			$data['members'] = array_map(
				function ( $member ) {
					return $this->sanitize_recursive( $member );
				},
				$decoded_members
			);
		} elseif ( ! empty( $data['members'] ) && is_array( $data['members'] ) ) {
			$data['members'] = array_map(
				function ( $member ) {
					return $this->sanitize_recursive( $member );
				},
				$data['members']
			);
		} else {
			$data['members'] = [];
		}

		if ( ! empty( $data['members'] ) ) {
			$data['members'] = array_values( $data['members'] );
		}

		$data['cir_members_json']     = wp_json_encode( $data['members'] );
		$data['allow_auto_earlybird'] = ! empty( $data['allow_auto_earlybird'] ) ? 1 : 0;

		$valid_invoice_types  = [ 'privato', 'libero_prof', 'azienda', 'azienda_estero' ];
		$current_invoice_type = $data['invoicing_type'] ?? 'privato';
		if ( ! in_array( $current_invoice_type, $valid_invoice_types, true ) ) {
			$current_invoice_type = 'privato';
		}
		$data['invoicing_type'] = $current_invoice_type;

		$data['learn_about_event']       = $this->sanitize_learn_about_event( $data['learn_about_event'] ?? '' );
		$data['learn_about_event_other'] = sanitize_text_field( $data['learn_about_event_other'] ?? '' );
		$data['consent_privacy']         = ! empty( $data['consent_privacy'] ) ? 1 : 0;
		$data['consent_av']              = $this->normalize_binary_choice( $data['consent_av'] ?? 'non_acconsento' );
		$data['consent_marketing']       = $this->normalize_binary_choice( $data['consent_marketing'] ?? 'non_acconsento' );
		$data['privacy_terms_url']       = esc_url_raw( $data['privacy_terms_url'] ?? 'https://ecomm.ita-stqb.org/index.php/it/privacy-policy' );
		$data['av_terms_url']            = esc_url_raw( $data['av_terms_url'] ?? '' );
		$data['marketing_terms_url']     = esc_url_raw( $data['marketing_terms_url'] ?? '' );
		$data['event_date']              = sanitize_text_field( $data['event_date'] ?? '' );
		$data['coupon_code']             = $this->normalize_coupon_code( $data['coupon_code'] ?? '' );

		$totals = $this->calculate_totals(
			$people,
			$data['coupon_code'],
			$data['event_date'] ?? '',
			$current_invoice_type,
			(bool) $data['allow_auto_earlybird'],
			(int) $data['course_id']
		);

		if ( ! empty( $totals['coupon_error'] ) ) {
			wp_die( $totals['coupon_message'] ?: __( 'Codice sconto non valido o scaduto.', 'cubeng-isaqb-registration' ) );
		}

		$data['total_amount'] = $totals['total'];

		$context = [
			'description' => $this->get_payment_description( $data ),
		];

		$post_id = wp_insert_post( [
			'post_type'   => 'isaqb_registration',
			'post_status' => 'publish',
			'post_title'  => sprintf(
				'%s %s - %s',
				$data['first_name_ref'] ?? '',
				$data['last_name_ref'] ?? '',
				current_time( 'mysql' )
			),
			'post_content'=> wp_json_encode( $data ),
		] );

		if ( $post_id && ! is_wp_error( $post_id ) ) {
			foreach ( $data as $key => $value ) {
				update_post_meta( $post_id, $key, $value );
			}
			update_post_meta( $post_id, 'payment_status', 'pending' );
			update_post_meta( $post_id, 'payment_method', $data['payment_method'] ?? 'bank_transfer' );
			update_post_meta( $post_id, 'totals', $totals );
			update_post_meta( $post_id, 'payment_description', $context['description'] );
		} else {
			wp_die( __( 'Impossibile salvare la registrazione.', 'cubeng-isaqb-registration' ) );
		}

		$registration_row_id = $this->persist_registration_record( $post_id, $data, $totals );

		if ( $registration_row_id ) {
			update_post_meta( $post_id, 'cir_event_registration_row_id', $registration_row_id );

			$this->persist_participants_rows(
				$registration_row_id,
				$data['members'] ?? [],
				[
					'privacy'   => $data['consent_privacy'],
					'av'        => $data['consent_av'],
					'marketing' => $data['consent_marketing'],
				]
			);
		}

		$method  = $data['payment_method'] ?? 'bank_transfer';
		$options = [
			'paypal'        => CIR_Settings::get_option( 'enable_paypal', 1 ),
			'stripe'        => CIR_Settings::get_option( 'enable_stripe', 1 ),
			'sumup'         => CIR_Settings::get_option( 'enable_sumup', 1 ),
			'bank_transfer' => CIR_Settings::get_option( 'enable_bank', 1 ),
		];

		if ( empty( $options[ $method ] ) ) {
			wp_die( __( 'Metodo di pagamento non disponibile.', 'cubeng-isaqb-registration' ) );
		}

		switch ( $method ) {
			case 'paypal':
				$paypal   = CIR_Gateway_PayPal::get_instance();
				$redirect = $paypal->create_order( $post_id, $totals, $context );

				if ( $redirect ) {
					wp_redirect( esc_url_raw( $redirect ) );
					exit;
				}

				wp_die( __( 'Errore PayPal, riprova.', 'cubeng-isaqb-registration' ) );

			case 'stripe':
				$stripe   = CIR_Gateway_Stripe::get_instance();
				$redirect = $stripe->create_checkout_session( $post_id, $totals, $context );

				if ( $redirect ) {
					wp_redirect( esc_url_raw( $redirect ) );
					exit;
				}

				wp_die( __( 'Errore Stripe, riprova.', 'cubeng-isaqb-registration' ) );

			case 'sumup':
				$sumup    = CIR_Gateway_SumUp::get_instance();
				$redirect = $sumup->create_checkout( $post_id, $totals, $context );

				if ( $redirect ) {
					wp_redirect( esc_url_raw( $redirect ) );
					exit;
				}

				wp_die( __( 'Errore SumUp, riprova.', 'cubeng-isaqb-registration' ) );

			default:
				$message = CIR_Settings::get_option(
					'bank_message',
					__( 'Riceverai le istruzioni di pagamento via email.', 'cubeng-isaqb-registration' )
				);

				$this->send_confirmation_emails( $post_id, $data, $totals );

				wp_safe_redirect(
					add_query_arg(
						[
							'cir_payment' => 'bank_transfer',
							'status'      => 'bank',
							'bank_msg'    => rawurlencode( $message ),
							'order_id'    => $post_id,
						],
						$this->get_thankyou_page_url()
					)
				);
				exit;
		}
	}

	/**
	 * Personalizza un’etichetta tradotta per il referente (compatibilità con alcune versioni del form).
	 *
	 * @param string $translated_text Testo tradotto.
	 * @param string $untranslated_text Testo originale.
	 * @param string $domain Dominio di traduzione.
	 *
	 * @return string
	 */
	public function filter_reference_label( $translated_text, $untranslated_text, $domain ) {
		if ( 'cubeng-isaqb-registration' === $domain && 'Reference person' === $untranslated_text ) {
			return __( 'Referente', 'cubeng-isaqb-registration' );
		}

		return $translated_text;
	}
	
	/**
	 * Gestisce il link di pagamento Sumup se l'utente non completa il pagamento'
	 *
	 *
	 * 
	 */
	public function send_pending_payment_email( $post_id, $gateway, $checkout_url, $totals = [], $context = [] ) {
		$meta_key = sprintf( '%s_checkout_email_sent', $gateway );
		if ( get_post_meta( $post_id, $meta_key, true ) ) {
			return;
		}

		$data = $this->hydrate_submission_data( $post_id );
		if ( empty( $data ) ) {
			return;
		}

		$billing_email  = sanitize_email( $data['email'] ?? '' );
		$referent_email = sanitize_email( $data['email_ref'] ?? '' );

		if ( ! $billing_email && $referent_email ) {
			$billing_email = $referent_email;
		}

		if ( ! $billing_email ) {
			return;
		}

		$labels = [
			'sumup'  => __( 'Completa il pagamento con SumUp', 'cubeng-isaqb-registration' ),
			'paypal' => __( 'Completa il pagamento con PayPal', 'cubeng-isaqb-registration' ),
			'stripe' => __( 'Completa il pagamento con carta (Stripe)', 'cubeng-isaqb-registration' ),
		];

		$gateway_label = $labels[ $gateway ] ?? __( 'Completa il pagamento', 'cubeng-isaqb-registration' );

		$site_name  = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
		$from_email = sanitize_email( get_option( 'admin_email' ) );

		$subject = __( 'Completa il pagamento della registrazione', 'cubeng-isaqb-registration' );

		$body  = '<p>' . sprintf(
			__( 'Hai iniziato la registrazione al corso CPSA-F ma il pagamento via %s risulta ancora incompleto.', 'cubeng-isaqb-registration' ),
			$gateway_label
		) . '</p>';
		$body .= '<p><a style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;" href="' . esc_url( $checkout_url ) . '" target="_blank" rel="noopener">' . esc_html( $gateway_label ) . '</a></p>';
		$body .= '<p>' . __( 'Se il pulsante non funziona copia e incolla il link seguente nel browser:', 'cubeng-isaqb-registration' ) . '<br>' . esc_html( $checkout_url ) . '</p>';
		$body .= '<p>' . __( 'Una volta concluso il pagamento riceverai la conferma definitiva via email.', 'cubeng-isaqb-registration' ) . '</p>';

		wp_mail(
			$billing_email,
			$subject,
			$body,
			[
				'Content-Type: text/html; charset=UTF-8',
				sprintf( 'From: %s <%s>', $site_name, $from_email ?: 'noreply@' . wp_parse_url( home_url(), PHP_URL_HOST ) ),
			]
		);

		if ( $referent_email && $referent_email !== $billing_email ) {
			wp_mail( $referent_email, $subject, $body );
		}

		update_post_meta( $post_id, $meta_key, current_time( 'mysql' ) );
	}
}