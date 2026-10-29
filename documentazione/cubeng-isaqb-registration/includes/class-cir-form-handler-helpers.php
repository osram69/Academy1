<?php
/**
 * Trait con funzioni di supporto alla classe CIR_Form_Handler.
 *
 * @package cubeng-isaqb-registration
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-cir-discount-service.php';
require_once __DIR__ . '/class-cir-settings.php';

trait CIR_Form_Handler_Helpers {

	/**
	 * Wrapper centralizzato per il calcolo dei totali.
	 *
	 * @param int    $people
	 * @param string $coupon_code
	 * @param string $event_date
	 * @param string $invoice_type
	 * @param bool   $allow_auto_earlybird
	 * @param int    $course_id
	 *
	 * @return array
	 */
	protected function calculate_totals( $people, $coupon_code = '', $event_date = '', $invoice_type = 'privato', $allow_auto_earlybird = true, $course_id = 0 ) {
		$service = CIR_Discount_Service::get_instance();

		return $service->compute_totals( [
			'people'                => $people,
			'coupon_code'           => $coupon_code,
			'event_date'            => $event_date,
			'invoice_type'          => $invoice_type,
			'allow_auto_earlybird'  => $allow_auto_earlybird,
			'course_id'             => (int) $course_id,
		] );
	}

	/**
	 * Normalizza il codice coupon prima di salvarlo.
	 *
	 * @param string $code Codice coupon.
	 *
	 * @return string
	 */
	protected function normalize_coupon_code( $code ) {
		$code = sanitize_text_field( (string) $code );
		return strtoupper( trim( $code ) );
	}

	/**
	 * Invia le email di conferma (cliente + staff) dopo il salvataggio.
	 *
	 * @param int   $registration_id ID del post di registrazione.
	 * @param array $data            Dati del form (opzionale).
	 * @param array $totals          Totali già calcolati (opzionale).
	 *
	 * @return void
	 */
	public function send_confirmation_emails( $registration_id, $data = null, $totals = null ) {
		if ( ! $registration_id || get_post_meta( $registration_id, 'cir_confirmation_email_sent', true ) ) {
			return;
		}

		$stored_data = $this->hydrate_submission_data( $registration_id );
		if ( is_array( $data ) && ! empty( $data ) ) {
			$stored_data = array_merge( $stored_data, $data );
		}

		$stored_data['sumup_checkout_url']  = get_post_meta( $registration_id, 'sumup_checkout_url', true );
		$stored_data['paypal_checkout_url'] = get_post_meta( $registration_id, 'paypal_checkout_url', true );
		$stored_data['stripe_checkout_url'] = get_post_meta( $registration_id, 'stripe_checkout_url', true );
		$stored_data['payment_status']      = get_post_meta( $registration_id, 'payment_status', true ) ?: 'pending';
		$stored_data['registration_id'] = $registration_id;


		if ( empty( $stored_data ) ) {
			return;
		}

		if ( ! is_array( $totals ) || empty( $totals ) ) {
			$totals = $this->calculate_totals(
				$stored_data['number_registrants'] ?? 1,
				$stored_data['coupon_code'] ?? '',
				$stored_data['event_date'] ?? '',
				$stored_data['invoicing_type'] ?? 'privato',
				(bool) ( $stored_data['allow_auto_earlybird'] ?? 1 ),
				(int) ( $stored_data['course_id'] ?? 0 )
			);
		}

		$site_name   = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
		$from_email  = sanitize_email( get_option( 'admin_email' ) );
		if ( ! $from_email ) {
			$domain     = wp_parse_url( home_url(), PHP_URL_HOST );
			$from_email = 'noreply@' . ( $domain ?: 'example.com' );
		}
        $admin_email = sanitize_email( get_option( 'admin_email' ) );
		$billing_email  = sanitize_email( $stored_data['email'] ?? '' );
		$referent_email = sanitize_email( $stored_data['email_ref'] ?? '' );

		if ( ! $billing_email && $referent_email ) {
			$billing_email = $referent_email;
		}

		if ( ! $billing_email ) {
			return;
		}

		$headers = [
			'Content-Type: text/html; charset=UTF-8',
			sprintf( 'From: %s <%s>', $site_name, $from_email ),
		];

		$locale_data = $this->get_email_dictionary();
		$locale      = $stored_data['language'] ?? get_locale();
		$lang_key    = ( 0 === strpos( strtolower( $locale ), 'it' ) ) ? 'it' : 'en';
		$texts       = $locale_data[ $lang_key ];

		$course_label = $stored_data['course_name'] ?? 'CPSA-F';
		$date_label   = $stored_data['event_date_label'] ?? ( $stored_data['event_date'] ?? '' );

		$subject_suffix = '';
		if ( $date_label ) {
			$subject_suffix = sprintf( $texts['subject_date_suffix'], $date_label );
		}

		$subject = sprintf(
			$texts['subject_full'],
			$subject_suffix
		);

		$body = $this->build_email_body( $texts, $stored_data, $totals, $course_label, $date_label, $site_name );

		$sent = wp_mail( $billing_email, $subject, $body, $headers );

		if ( ! $sent ) {
		    error_log( sprintf(
		        'CIR mail fallita per ordine %d -> %s',
		        $registration_id,
		        $billing_email
		    ) );
		} else {
		    error_log( sprintf(
		        'CIR mail OK per ordine %d -> %s',
		        $registration_id,
		        $billing_email
		    ) );
		}

		if ( $referent_email && $referent_email !== $billing_email ) {
			wp_mail( $referent_email, $subject, $body, $headers );
		}
		
		
        $cc_email = 'registrazioni@cubeng.eu';
        if ( $cc_email && $cc_email !== $billing_email && $cc_email !== $referent_email ) {
            wp_mail( $cc_email, $subject, $body, $headers );
        }
    

		/*if ( $admin_email && $admin_email !== $billing_email && $admin_email !== $referent_email ) {
            wp_mail( $admin_email, $subject, $body, $headers );
        }*/

        $this->send_internal_summary_email( $registration_id, $stored_data, $totals, $texts, $site_name, $from_email );

        update_post_meta( $registration_id, 'cir_confirmation_email_sent', current_time( 'mysql' ) );
    }

	/**
	 * Invia il riepilogo interno completo (testo + JSON) all’Academy.
	 *
	 * @param int    $registration_id
	 * @param array  $data
	 * @param array  $totals
	 * @param array  $texts
	 * @param string $site_name
	 * @param string $from_email
	 *
	 * @return void
	 */
	protected function send_internal_summary_email( $registration_id, $data, $totals, $texts, $site_name, $from_email ) {
	    $recipient = 'academy@cubeng.eu';
	    if ( ! $recipient ) {
	        return;
	    }

	    $people_count = (int) ( $totals['people'] ?? 1 );
	    $amount       = $this->format_currency_value( (float) ( $totals['amount'] ?? 0 ) );
	    $tax          = $this->format_currency_value( (float) ( $totals['tax'] ?? 0 ) );
	    $discount     = $this->format_currency_value( (float) ( $totals['discount'] ?? 0 ) );
	    $total_due    = $this->format_currency_value( (float) ( $totals['total'] ?? 0 ) );
	    $applied_code = $totals['applied_code'] ?? '';

	    $referent_name = trim( ( $data['first_name_ref'] ?? '' ) . ' ' . ( $data['last_name_ref'] ?? '' ) );
	    $organization  = $data['organization'] ?? $data['business_name'] ?? '';
	    $course_title  = $data['course_name'] ?? $data['course_title'] ?? 'CPSA-F';
	    $course_dates  = $data['event_date_label'] ?? $data['event_date'] ?? ( $data['course_dates'] ?? '' );
	    $course_place  = $data['event_location'] ?? $data['course_location'] ?? '';
	    $method_label  = $data['payment_method'] ?? 'bank_transfer';

	    $invoice_type_labels = $texts['billing_labels']['subject_type'] ?? [];
	    $invoicing_type      = $data['invoicing_type'] ?? 'privato';
	    $invoicing_label     = $invoice_type_labels[ $invoicing_type ] ?? ucfirst( str_replace( '_', ' ', $invoicing_type ) );

	    $address_parts = array_filter( [
	        $data['billing_address'] ?? $data['address'] ?? '',
	        $data['billing_address2'] ?? $data['address2'] ?? '',
	        trim( implode( ' ', array_filter( [ $data['billing_zip'] ?? $data['zip'] ?? '', $data['billing_city'] ?? $data['city'] ?? '' ] ) ) ),
	        trim( implode( ' ', array_filter( [ $data['billing_state'] ?? $data['state'] ?? '', $data['billing_country'] ?? $data['country'] ?? '' ] ) ) ),
	    ] );
	    $full_billing_address = implode( ', ', $address_parts );

	    $consent_privacy   = ! empty( $data['consent_privacy'] ) ? $texts['consent_yes'] : $texts['consent_no'];
	    $consent_marketing = ( 'acconsento' === ( $data['consent_marketing'] ?? '' ) ) ? $texts['consent_yes'] : $texts['consent_no'];
	    $consent_av        = ( 'acconsento' === ( $data['consent_av'] ?? '' ) ) ? $texts['consent_yes'] : $texts['consent_no'];

	    $discount_label = __( 'Sconto', 'cubeng-isaqb-registration' );
	    if ( $applied_code ) {
	        $discount_label .= sprintf( ' (%s)', $applied_code );
	    }

	    $sections = [
	        __( 'Dettagli referente', 'cubeng-isaqb-registration' ) => [
	            'ID ordine'             => $registration_id,
	            'Nome referente'        => $referent_name ?: '-',
	            'Email fatturazione'    => sanitize_email( $data['email'] ?? '' ) ?: '-',
	            'Email referente'       => sanitize_email( $data['email_ref'] ?? '' ) ?: '-',
	            'Email CC'              => sanitize_email( $data['email_2'] ?? '' ) ?: '-',
	            'Telefono'              => $data['phone'] ?? '-',
	            'Metodo pagamento'      => $method_label,
	            'Numero partecipanti'   => $people_count,
	            'Codice sconto'         => $data['coupon_code'] ?? '-',
	            'Provenienza lead'      => $data['learn_about_event'] ?? '-',
	            'Dettaglio opzione'     => $data['learn_about_event_other'] ?? '-',
	        ],
	        __( 'Dati fatturazione', 'cubeng-isaqb-registration' ) => [
	            'Tipologia soggetto' => $invoicing_label ?: '-',
	            'Intestatario'       => $organization ?: '-',
	            'Codice fiscale'     => $data['tax_code'] ?? $data['fiscalcode'] ?? '-',
	            'Partita IVA / VAT'  => $data['vat_number'] ?? $data['vat'] ?? '-',
	            'Codice SDI'         => $data['sdi_code'] ?? $data['fatt_elettronica_codice'] ?? '-',
	            'PEC'                => $data['pec_email'] ?? $data['fatt_elettronica_PEC'] ?? '-',
	            'Indirizzo'          => $full_billing_address ?: '-',
	        ],
	        __( 'Dettagli corso', 'cubeng-isaqb-registration' ) => [
	            'Corso'                 => $course_title,
	            'Date'                  => $course_dates ?: '-',
	            'Luogo / modalità'      => $course_place ?: '-',
	            'Descrizione pagamento' => $data['payment_description'] ?? '-',
	        ],
	        __( 'Importi', 'cubeng-isaqb-registration' ) => [
	            'Quota imponibile' => '€ ' . $amount,
	            'IVA (22%)'        => '€ ' . $tax,
	            $discount_label    => '€ ' . $discount,
	            'Totale'           => '€ ' . $total_due,
	        ],
	        __( 'Consensi', 'cubeng-isaqb-registration' ) => [
	            'Privacy'     => $consent_privacy,
	            'Marketing'   => $consent_marketing,
	            'Audio/Video' => $consent_av,
	        ],
	    ];

	    $body_lines = [];
	    foreach ( $sections as $title => $rows ) {
	        $body_lines[] = '=== ' . $title . ' ===';
	        foreach ( $rows as $label => $value ) {
	            $body_lines[] = sprintf( '%s: %s', $label, ( '' !== trim( (string) $value ) ) ? $value : '-' );
	        }
	        $body_lines[] = '';
	    }

	    $body_lines[] = '=== Partecipanti ===';
	    if ( ! empty( $data['members'] ) && is_array( $data['members'] ) ) {
	        foreach ( $data['members'] as $index => $member ) {
	            if ( empty( $member['first_name'] ) && empty( $member['last_name'] ) ) {
	                continue;
	            }
	            $body_lines[] = sprintf(
	                '%d) %s %s | Email: %s | Telefono: %s | Ruolo: %s | Azienda: %s | Privacy: %s | Marketing: %s | AV: %s',
	                $index + 1,
	                $member['first_name'] ?? '',
	                $member['last_name'] ?? '',
	                $member['email'] ?? '-',
	                $member['phone'] ?? '-',
	                $member['role'] ?? '-',
	                $member['company'] ?? '-',
	                ( ! empty( $member['consent_privacy'] ) ? $texts['consent_yes'] : $texts['consent_no'] ),
	                ( ! empty( $member['consent_marketing'] ) ? $texts['consent_yes'] : $texts['consent_no'] ),
	                ( 'acconsento' === ( $member['consent_av'] ?? 'non_acconsento' ) ? $texts['consent_yes'] : $texts['consent_no'] )
	            );
	        }
	    } else {
	        $body_lines[] = __( 'Nessun partecipante specificato.', 'cubeng-isaqb-registration' );
	    }
	    $body_lines[] = '';

	    $body_lines[] = 'ID ordine: ' . $registration_id;
	    $body_lines[] = 'URL registrazione: ' . admin_url( sprintf( 'post.php?post=%d&action=edit', $registration_id ) );
	    $body_lines[] = '';

	    $body_lines[] = '=== JSON completo della registrazione ===';
	    $body_lines[] = wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );

	    $subject = sprintf(
	        __( 'Nuova iscrizione iSAQB – %s', 'cubeng-isaqb-registration' ),
	        $organization ?: ( $referent_name ?: __( 'Soggetto non specificato', 'cubeng-isaqb-registration' ) )
	    );

	    wp_mail(
	        $recipient,
	        $subject,
	        implode( "\n", $body_lines ),
	        [
	            'Content-Type: text/plain; charset=UTF-8',
	            sprintf( 'From: %s <%s>', $site_name, $from_email ),
	        ]
	    );
	}

	/**
	 * Dizionario minimale IT/EN per le email.
	 *
	 * @return array
	 */
	protected function get_email_dictionary() {
		return [
			'it' => [
				'subject_full'        => 'Conferma registrazione corso CPSA-F%s - Cube Academy',
				'subject_date_suffix' => ' del %s',
				'title'               => 'Conferma registrazione',
				'greeting'            => 'Gentile <strong>%s</strong>,',
				'intro'               => 'Grazie per la registrazione al corso Certified Professional for Software Architecture – CPSA-F.',
				'next_steps'          => 'Passaggi successivi',
				'steps'               => [
					'Se hai scelto il pagamento tramite bonifico bancario, completa il pagamento seguendo le istruzioni riportate di seguito.',
					'Invia eventuale documentazione richiesta dal nostro team.',
					'Riceverai conferma definitiva dopo la verifica del pagamento.',
				],
				'summary_title'       => 'Riepilogo registrazione',
				'labels'              => [
					'order_id'       => 'ID ordine',
					'participant'    => 'Referente',
					'organization'   => 'Intestatario fattura',
					'course'         => 'Corso',
					'dates'          => 'Date',
					'location'       => 'Luogo / Modalità',
					'amount'         => 'Totale dovuto',
					'payment_method' => 'Metodo di pagamento',
				],
				'participants'        => 'Partecipanti',
				'closing'             => 'Per qualsiasi necessità puoi rispondere a questa email o contattarci dai riferimenti sul sito.',
				'signature'           => 'Cordiali saluti,<br>%s',
				'bank_title'          => 'Istruzioni per il bonifico',
				'people_count'        => 'Numero partecipanti: %d',
				'financial'           => 'Riepilogo economico',
				'financial_rows'      => [
					'quota'    => 'Quota imponibile',
					'vat'      => 'IVA (22%)',
					'discount' => 'Sconto applicato',
					'total'    => 'Totale da corrispondere',
				],
				'billing_title'       => 'Dati fatturazione',
				'billing_labels'      => [
					'subject_type' => 'Tipologia soggetto',
					'tax_code'     => 'Codice fiscale',
					'vat'          => 'Partita IVA / VAT',
					'sdi'          => 'Codice SDI',
					'pec'          => 'Indirizzo PEC',
					'address'      => 'Indirizzo completo',
				],
				'no_participants'     => 'Nessun partecipante aggiuntivo indicato.',
			],
			'en' => [
				'subject_full'        => 'Course registration confirmed%s - Cube Academy',
				'subject_date_suffix' => ' for %s',
				'title'               => 'Registration confirmation',
				'greeting'            => 'Dear <strong>%s</strong>,',
				'intro'               => 'Thank you for registering for the Certified Professional for Software Architecture – CPSA-F course.',
				'next_steps'          => 'Next steps',
				'steps'               => [
					'If you selected bank transfer, please complete the payment following the instructions below.',
					'Send any requested documents to our team.',
					'You will receive the final confirmation after we verify the payment.',
				],
				'summary_title'       => 'Registration summary',
				'labels'              => [
					'order_id'       => 'Order ID',
					'participant'    => 'Main contact',
					'organization'   => 'Billing entity',
					'course'         => 'Course',
					'dates'          => 'Dates',
					'location'       => 'Location / Modality',
					'amount'         => 'Total due',
					'payment_method' => 'Payment method',
				],
				'participants'        => 'Participants',
				'closing'             => 'If you need anything feel free to reply to this email or reach us via the contacts on our website.',
				'signature'           => 'Best regards,<br>%s',
				'bank_title'          => 'Bank transfer instructions',
				'people_count'        => 'Number of attendees: %d',
				'financial'           => 'Financial recap',
				'financial_rows'      => [
					'quota'    => 'Net fee',
					'vat'      => 'VAT (22%)',
					'discount' => 'Discount applied',
					'total'    => 'Total due',
				],
				'billing_title'       => 'Billing details',
				'billing_labels'      => [
					'subject_type' => 'Entity type',
					'tax_code'     => 'Tax code',
					'vat'          => 'VAT number',
					'sdi'          => 'SDI code',
					'pec'          => 'PEC address',
					'address'      => 'Full address',
				],
				'no_participants'     => 'No additional participants provided.',
			],
		];
	}

	// ... (resto del trait invariato rispetto alle versioni precedenti)

	/**
	 * Compone l'HTML dell'email usando il dizionario.
	 *
	 * @param array  $texts        Dizionario lingua.
	 * @param array  $data         Dati della registrazione.
	 * @param array  $totals       Totali economici.
	 * @param string $course_label Nome corso.
	 * @param string $date_label   Date corso.
	 * @param string $site_name    Nome sito per la firma.
	 *
	 * @return string
	 */
	protected function build_email_body( $texts, $data, $totals, $course_label, $date_label, $site_name ) {
		$people_count    = (int) ( $totals['people'] ?? 1 );
		$amount          = $this->format_currency_value( (float) ( $totals['amount'] ?? 0 ) );
		$tax             = $this->format_currency_value( (float) ( $totals['tax'] ?? 0 ) );
		$discount        = $this->format_currency_value( (float) ( $totals['discount'] ?? 0 ) );
		$total_due       = $this->format_currency_value( (float) ( $totals['total'] ?? 0 ) );
		$applied_code    = $totals['applied_code'] ?? '';
		$organization    = $data['organization'] ?? ( $data['business_name'] ?? '' );
		$registration_id = $data['order_id'] ?? $data['registration_id'] ?? '';

		$payment_labels = [
			'paypal'        => 'PayPal',
			'stripe'        => __( 'Carta (Stripe)', 'cubeng-isaqb-registration' ),
			'sumup'         => __( 'Carta (SumUp)', 'cubeng-isaqb-registration' ),
			'bank_transfer' => __( 'Bonifico bancario', 'cubeng-isaqb-registration' ),
		];
		$method_key   = $data['payment_method'] ?? 'bank_transfer';
		$method_label = $payment_labels[ $method_key ] ?? ucfirst( $method_key );

		$order_rows = [
			$texts['labels']['order_id']       => $registration_id,
			$texts['labels']['participant']    => trim( ( $data['first_name_ref'] ?? '' ) . ' ' . ( $data['last_name_ref'] ?? '' ) ),
			$texts['labels']['organization']   => $organization ?: ( $data['business_name'] ?? $data['invoicing_name'] ?? '' ),
			$texts['labels']['course']         => $course_label,
			$texts['labels']['dates']          => $date_label,
			$texts['labels']['location']       => $data['event_location'] ?? '',
			$texts['labels']['amount']         => $total_due,
			$texts['labels']['payment_method'] => $method_label,
		];

		$table_style  = 'width:100%;border:1px solid #e5e5e5;border-collapse:collapse;font-size:12px;';
		$cell_style   = 'padding:4px 8px;border:1px solid #e5e5e5;';
		$header_style = $cell_style . 'background:#f7f7f7;text-align:left;';

		$order_table = '<table cellspacing="0" cellpadding="3" style="' . $table_style . '">';
		foreach ( $order_rows as $label => $value ) {
			if ( '' === trim( (string) $value ) ) {
				continue;
			}
			$order_table .= sprintf(
				'<tr><th style="%1$swidth:52%%;">%2$s</th><td style="%3$stext-align:right;">%4$s</td></tr>',
				$header_style,
				esc_html( $label ),
				$cell_style,
				wp_kses_post( nl2br( esc_html( $value ) ) )
			);
		}
		if ( $applied_code ) {
			$order_table .= sprintf(
				'<tr><th style="%1$s">Coupon</th><td style="%2$s">%3$s</td></tr>',
				$header_style,
				$cell_style,
				esc_html( $applied_code )
			);
		}
		$order_table .= '</table>';

		$financial_rows = [
			$texts['financial_rows']['quota']    => $amount,
			$texts['financial_rows']['discount'] => $discount,
			$texts['financial_rows']['vat']      => $tax,
			$texts['financial_rows']['total']    => $total_due,
		];
		$financial_table = '<table cellspacing="0" cellpadding="3" style="' . $table_style . 'margin-top:10px;">';
		foreach ( $financial_rows as $label => $value ) {
			$financial_table .= sprintf(
				'<tr><th style="%1$swidth:52%%;">%2$s</th><td style="%3$stext-align:right;">%4$s</td></tr>',
				$header_style,
				esc_html( $label ),
				$cell_style,
				esc_html( $value )
			);
		}
		$financial_table .= '</table>';

		$participants_html = $this->build_participants_html( $texts, $data );
		$billing_block     = $this->build_billing_block( $texts, $data );

		$bank_block = '';
		if ( 'bank_transfer' === $method_key ) {
			$bank_message_raw = CIR_Settings::get_option(
				'bank_message',
				"Effettua il bonifico intestato a Cube Engineering S.r.l.\nIBAN: IT67 Y 05034 03262 0000 00001286\nCausale: Iscrizione corso iSAQB + Nome Azienda"
			);
			$bank_message = strtr( $bank_message_raw, [
				'{{organization}}' => $organization ?: ( $data['business_name'] ?? $texts['labels']['organization'] ),
				'{{order_id}}'     => $registration_id,
				'{{amount}}'       => '€ ' . $total_due,
			] );
			$bank_block = sprintf(
				'<h3 style="margin:16px 0 6px;font-size:15px;">%s</h3><div style="border:1px solid #e5e5e5;border-radius:6px;padding:8px 10px;background:#fff;font-size:12px;">%s</div>',
				esc_html( $texts['bank_title'] ),
				wp_kses_post( wpautop( $bank_message ) )
			);
		}

		$steps_list = '<ol style="margin:6px 0 10px;padding-left:18px;">';
		foreach ( $texts['steps'] as $step ) {
			$steps_list .= '<li>' . esc_html( $step ) . '</li>';
		}
		$steps_list .= '</ol>';

		$body  = '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:14px;color:#1f1f1f;line-height:1.45;">';
		$body .= sprintf( '<h2 style="margin:0 0 8px;font-size:18px;">%s</h2>', esc_html( $texts['title'] ) );
		$body .= sprintf( '<p style="margin:0 0 10px;">%s</p>', sprintf( $texts['greeting'], esc_html( trim( ( $data['first_name_ref'] ?? '' ) . ' ' . ( $data['last_name_ref'] ?? '' ) ) ) ) );
		$body .= sprintf( '<p style="margin:0 0 12px;">%s</p>', esc_html( $texts['intro'] ) );
		$body .= sprintf( '<h3 style="margin:16px 0 6px;font-size:15px;">%s</h3>', esc_html( $texts['next_steps'] ) );
		$body .= $steps_list;
		$body .= sprintf( '<p style="margin:6px 0 10px;"><strong>%s</strong></p>', sprintf( esc_html( $texts['people_count'] ), $people_count ) );
		$body .= sprintf( '<h3 style="margin:16px 0 6px;font-size:15px;">%s</h3>', esc_html( $texts['summary_title'] ) );
		$body .= $order_table;
		$body .= sprintf( '<h3 style="margin:16px 0 6px;font-size:15px;">%s</h3>', esc_html( $texts['financial'] ) );
		$body .= $financial_table;
		$body .= $participants_html;
		$body .= $billing_block;
		if ( $bank_block ) {
			$body .= $bank_block;
		}

		$pending_links = [
			'sumup'  => $data['sumup_checkout_url'] ?? '',
			'paypal' => $data['paypal_checkout_url'] ?? '',
			'stripe' => $data['stripe_checkout_url'] ?? '',
		];
		if (
			isset( $pending_links[ $method_key ] ) &&
			$pending_links[ $method_key ] &&
			'paid' !== ( $data['payment_status'] ?? '' )
		) {
			$cta_labels = [
				'sumup'  => __( 'Completa il pagamento con SumUp', 'cubeng-isaqb-registration' ),
				'paypal' => __( 'Completa il pagamento con PayPal', 'cubeng-isaqb-registration' ),
				'stripe' => __( 'Completa il pagamento con carta (Stripe)', 'cubeng-isaqb-registration' ),
			];
			$cta = $cta_labels[ $method_key ] ?? __( 'Completa il pagamento', 'cubeng-isaqb-registration' );

			$body .= '<h3 style="margin:16px 0 6px;font-size:15px;">' . esc_html( $cta ) . '</h3>';
			$body .= '<p style="margin:4px 0;"><a style="display:inline-block;padding:8px 14px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;" href="' . esc_url( $pending_links[ $method_key ] ) . '" target="_blank" rel="noopener">' . esc_html__( 'Paga ora', 'cubeng-isaqb-registration' ) . '</a></p>';
			$body .= '<p style="font-size:12px;color:#555;margin:2px 0 10px;">' . esc_html__( 'Se il pulsante non funziona copia e incolla il link nel browser:', 'cubeng-isaqb-registration' ) . '<br>' . esc_html( $pending_links[ $method_key ] ) . '</p>';
		}

		$body .= sprintf( '<p style="margin:14px 0 6px;">%s</p>', esc_html( $texts['closing'] ) );
		$body .= sprintf( '<p style="margin:0;">%s</p>', sprintf( $texts['signature'], esc_html( $site_name ) ) );
		$body .= '</div>';

		return $body;
	}
	
	/**
	 * Genera il blocco HTML dei partecipanti.
	 *
	 * @param array $texts Dizionario lingua.
	 * @param array $data  Dati registrazione.
	 *
	 * @return string
	 */
	protected function build_participants_html( $texts, $data ) {
		$members = $data['members'] ?? [];

		$html  = sprintf( '<h3 style="margin-top:24px;">%s</h3>', esc_html( $texts['participants'] ) );

		if ( empty( $members ) ) {
			$html .= sprintf( '<p>%s</p>', esc_html( $texts['no_participants'] ) );
			return $html;
		}

		$html .= '<table cellspacing="0" cellpadding="6" style="width:100%;border:1px solid #e5e5e5;border-collapse:collapse;">';
		$html .= '<tr>';
		$html .= '<th style="border:1px solid #e5e5e5;background:#f7f7f7;">#</th>';
		$html .= '<th style="border:1px solid #e5e5e5;background:#f7f7f7;">' . esc_html__( 'Nome', 'cubeng-isaqb-registration' ) . '</th>';
		$html .= '<th style="border:1px solid #e5e5e5;background:#f7f7f7;">' . esc_html__( 'Email', 'cubeng-isaqb-registration' ) . '</th>';
		$html .= '<th style="border:1px solid #e5e5e5;background:#f7f7f7;">' . esc_html__( 'Telefono', 'cubeng-isaqb-registration' ) . '</th>';
		$html .= '</tr>';

		foreach ( $members as $index => $member ) {
			$full_name = trim( ( $member['first_name'] ?? '' ) . ' ' . ( $member['last_name'] ?? '' ) );
			$email     = $member['email'] ?? '';
			$phone     = $member['phone'] ?? '';

			$html .= sprintf(
				'<tr><td style="border:1px solid #e5e5e5;">%d</td><td style="border:1px solid #e5e5e5;">%s</td><td style="border:1px solid #e5e5e5;">%s</td><td style="border:1px solid #e5e5e5;">%s</td></tr>',
				$index + 1,
				esc_html( $full_name ),
				esc_html( $email ),
				esc_html( $phone )
			);
		}

		$html .= '</table>';
		return $html;
	}

	/**
	 * Genera il blocco dei dati di fatturazione.
	 *
	 * @param array $texts Dizionario lingua.
	 * @param array $data  Dati registrazione.
	 *
	 * @return string
	 */
	protected function build_billing_block( $texts, $data ) {
		$labels = $texts['billing_labels'];

		$rows = [
			$labels['subject_type'] => ucfirst( str_replace( '_', ' ', $data['invoicing_type'] ?? '' ) ),
			$labels['tax_code']     => $data['tax_code'] ?? '',
			$labels['vat']          => $data['vat_number'] ?? '',
			$labels['sdi']          => $data['sdi_code'] ?? '',
			$labels['pec']          => $data['pec_email'] ?? '',
			$labels['address']      => $this->format_address_block( $data ),
		];

		$html = sprintf( '<h3 style="margin-top:24px;">%s</h3>', esc_html( $texts['billing_title'] ) );
		$html .= '<table cellspacing="0" cellpadding="6" style="width:100%;border:1px solid #e5e5e5;border-collapse:collapse;">';

		foreach ( $rows as $label => $value ) {
			if ( '' === trim( (string) $value ) ) {
				continue;
			}
			$html .= sprintf(
				'<tr><th align="left" style="text-align:left;border:1px solid #e5e5e5;background:#f7f7f7;">%s</th><td style="border:1px solid #e5e5e5;">%s</td></tr>',
				esc_html( $label ),
				wp_kses_post( nl2br( esc_html( $value ) ) )
			);
		}

		$html .= '</table>';
		return $html;
	}

	/**
	 * Format helper per i valori monetari.
	 *
	 * @param float $value Valore numerico.
	 *
	 * @return string
	 */
	protected function format_currency_value( $value ) {
		return number_format_i18n( (float) $value, 2 );
	}

	/**
	 * Compone l'indirizzo di fatturazione.
	 *
	 * @param array $data Dati registrazione.
	 *
	 * @return string
	 */
	protected function format_address_block( $data ) {
		$parts = [
			$data['billing_address'] ?? '',
			trim( ( $data['billing_zip'] ?? '' ) . ' ' . ( $data['billing_city'] ?? '' ) ),
			$data['billing_state'] ?? '',
			$data['billing_country'] ?? '',
		];

		$parts = array_filter( array_map( 'trim', $parts ) );
		return implode( "\n", $parts );
	}
}