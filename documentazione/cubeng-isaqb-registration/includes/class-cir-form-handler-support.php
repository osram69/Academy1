<?php
/**
 * Support trait per CIR_Form_Handler.
 *
 * @package cubeng-isaqb-registration
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait CIR_Form_Handler_Support {

	/**
	 * Cache delle colonne disponibili per tabella.
	 *
	 * @var array
	 */
	private $cir_table_columns_cache = [];

	private function sanitize_recursive( $value ) {
		if ( is_array( $value ) ) {
			foreach ( $value as $key => $item ) {
				$value[ $key ] = $this->sanitize_recursive( $item );
			}
			return $value;
		}

		return sanitize_text_field( $value );
	}

	private function hydrate_submission_data( $post_id ) {
		$data = [];
		$meta = get_post_meta( $post_id );
		if ( empty( $meta ) ) {
			return $data;
		}

		foreach ( $meta as $key => $values ) {
			if ( isset( $values[0] ) ) {
				$data[ $key ] = maybe_unserialize( $values[0] );
			}
		}

		return $data;
	}

	private function get_payment_description( $data ) {
		$organization = sanitize_text_field( $data['organization'] ?? '' );
		if ( empty( $organization ) ) {
			$organization = __( 'Soggetto non specificato', 'cubeng-isaqb-registration' );
		}

		$event_date = sanitize_text_field( $data['event_date'] ?? '' );

		$description = $event_date
			? sprintf( 'Corso CPSA-F %s - %s', $event_date, $organization )
			: sprintf( 'Corso CPSA-F - %s', $organization );

		return function_exists( 'mb_substr' )
			? mb_substr( $description, 0, 120 )
			: substr( $description, 0, 120 );
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

	private function persist_registration_record( $post_id, $data, $totals ) {
		global $wpdb;

		if ( empty( $wpdb ) ) {
			return 0;
		}

		$table = $wpdb->prefix . 'event_registrations';

		if ( ! $this->table_exists( $table ) ) {
			error_log( 'CIR persist_registration_record: tabella mancante ' . $table );
			return 0;
		}

		$registration_code = strtoupper( wp_generate_password( 16, false, false ) );

		$insert = [
			'registration_post_id'     => $post_id,
			'wp_user_id'               => get_current_user_id() ?: null,
			'event_id'                 => sanitize_text_field( $data['event_id'] ?? 'cpsa_f' ),
			'event_title'              => sanitize_text_field( $data['course_title'] ?? 'Certified Professional for Software Architecture – CPSA-F' ),
			'event_date'               => sanitize_text_field( $data['event_date'] ?? '' ),
			'registration_code'        => $registration_code,
			'invoice_type'             => sanitize_text_field( $data['invoicing_type'] ?? 'privato' ),
			'billing_first_name'       => sanitize_text_field( $data['first_name_ref'] ?? '' ),
			'billing_last_name'        => sanitize_text_field( $data['last_name_ref'] ?? '' ),
			'billing_company_name'     => sanitize_text_field( $data['organization'] ?? '' ),
			'billing_tax_code'         => sanitize_text_field( $data['fiscalcode'] ?? '' ),
			'billing_vat_number'       => sanitize_text_field( $data['vat'] ?? '' ),
			'billing_sdi_code'         => sanitize_text_field( $data['fatt_elettronica_codice'] ?? '' ),
			'billing_pec_email'        => sanitize_email( $data['fatt_elettronica_PEC'] ?? '' ),
			'billing_address'          => sanitize_text_field( $data['address'] ?? '' ),
			'billing_address_2'        => sanitize_text_field( $data['address2'] ?? '' ),
			'billing_city'             => sanitize_text_field( $data['city'] ?? '' ),
			'billing_province'         => sanitize_text_field( $data['state'] ?? '' ),
			'billing_postal_code'      => sanitize_text_field( $data['zip'] ?? '' ),
			'billing_country'          => sanitize_text_field( $data['country'] ?? '' ),
			'billing_notes'           => sanitize_textarea_field( $data['billing_notes'] ?? '' ),
			'contact_email'            => sanitize_email( $data['email'] ?? '' ),
			'contact_email_secondary'  => sanitize_email( $data['email_2'] ?? '' ),
			'contact_phone'            => sanitize_text_field( $data['phone'] ?? '' ),
			'learn_about_event'        => sanitize_text_field( $data['learn_about_event'] ?? '' ),
			'learn_about_event_other'  => sanitize_text_field( $data['learn_about_event_other'] ?? '' ),
			'consent_privacy'          => (int) ( $data['consent_privacy'] ?? 0 ),
			'consent_marketing'        => (int) ( $data['consent_marketing'] ?? 0 ),
			'consent_av'               => sanitize_text_field( $data['consent_av'] ?? 'non_acconsento' ),
			'payment_method'           => sanitize_text_field( $data['payment_method'] ?? 'bank_transfer' ),
			'payment_status'           => 'pending',
			'payment_total'            => (float) ( $totals['total'] ?? 0 ),
			'payment_tax_amount'       => (float) ( $totals['tax'] ?? 0 ),
			'payment_net_amount'       => (float) ( $totals['amount'] ?? 0 ),
			'payment_discount'         => (float) ( $totals['discount'] ?? 0 ),
			'total_people'             => (int) ( $totals['people'] ?? 1 ),
			'created_at'               => current_time( 'mysql', true ),
			'updated_at'               => current_time( 'mysql', true ),
		];

		$format = [
			'%d',
			'%d',
			'%s', '%s', '%s', '%s', '%s', '%s',
			'%s', '%s', '%s', '%s', '%s', '%s',
			'%s', '%s', '%s', '%s', '%s', '%s','%s',
			'%s', '%s', '%s', '%s', '%d', '%d', '%s',
			'%s', '%s', '%s', '%f', '%f', '%f', '%f', '%d', '%s', '%s',
		];

		$result = $wpdb->insert( $table, $insert, $format );

		if ( false === $result ) {
			error_log( 'CIR persist_registration_record: errore SQL ' . $wpdb->last_error );
			return 0;
		}

		return (int) $wpdb->insert_id;
	}

	private function persist_participants_rows( $registration_row_id, $members, $consents ) {
		global $wpdb;

		if ( empty( $wpdb ) || empty( $registration_row_id ) || empty( $members ) || ! is_array( $members ) ) {
			return;
		}

		$table = $wpdb->prefix . 'event_participants';

		if ( ! $this->table_exists( $table ) ) {
			error_log( 'CIR persist_participants_rows: tabella mancante ' . $table );
			return;
		}

		$columns = $this->get_table_columns( $table );
		if ( empty( $columns ) ) {
			error_log( 'CIR persist_participants_rows: impossibile leggere le colonne di ' . $table );
			return;
		}

		$column_lookup = array_flip( $columns );

		$format_map = [
			'registration_id'        => '%d',
			'participant_index'      => '%d',
			'profile'                => '%s',
			'first_name'             => '%s',
			'last_name'              => '%s',
			'gender'                 => '%s',
			'tax_code'               => '%s',
			'birth_date'             => '%s',
			'birth_city'             => '%s',
			'birth_country'          => '%s',
			'email'                  => '%s',
			'phone'                  => '%s',
			'role'                   => '%s',
			'company'                => '%s',
			'notes'                  => '%s',
			'consent_privacy'        => '%d',
			'consent_marketing'      => '%d',
			'consent_av'             => '%s',
			'privacy_consent'        => '%s',
			'privacy_consent_at'     => '%s',
			'audio_video_consent'    => '%s',
			'audio_video_consent_at' => '%s',
			'marketing_consent'      => '%s',
			'marketing_consent_at'   => '%s',
			'created_at'             => '%s',
			'updated_at'             => '%s',
		];

		$allowed_profiles = [ 'studente', 'docente', 'professionista', 'azienda', 'altro' ];
		$allowed_genders  = [ 'f', 'm', 'altro', 'non_specificato' ];

		foreach ( $members as $index => $member ) {
			if ( empty( $member['first_name'] ) && empty( $member['last_name'] ) ) {
				continue;
			}

			$privacy_flag   = isset( $member['consent_privacy'] ) ? (int) $member['consent_privacy'] : (int) ( $consents['privacy'] ?? 0 );
			$marketing_flag = isset( $member['consent_marketing'] ) ? (int) $member['consent_marketing'] : (int) ( $consents['marketing'] ?? 0 );
			$av_choice      = $member['consent_av'] ?? ( $consents['av'] ?? 'non_acconsento' );

			$privacy_enum   = $privacy_flag ? 'acconsento' : 'non_acconsento';
			$marketing_enum = $marketing_flag ? 'acconsento' : 'non_acconsento';
			$av_enum        = $this->normalize_binary_choice( $av_choice );
			$now_mysql      = current_time( 'mysql', true );

			$insert = [
				'registration_id'        => (int) $registration_row_id,
				'participant_index'      => (int) ( $index + 1 ),
				'profile'                => $this->normalize_enum( $member['profile'] ?? '', $allowed_profiles, 'altro' ),
				'first_name'             => sanitize_text_field( $member['first_name'] ?? '' ),
				'last_name'              => sanitize_text_field( $member['last_name'] ?? '' ),
				'gender'                 => $this->normalize_enum( $member['gender'] ?? '', $allowed_genders, 'non_specificato' ),
				'tax_code'               => sanitize_text_field( $member['tax_code'] ?? '' ),
				'birth_date'             => $this->sanitize_date_value( $member['birth_date'] ?? '' ),
				'birth_city'             => sanitize_text_field( $member['birth_city'] ?? '' ),
				'birth_country'          => sanitize_text_field( $member['birth_country'] ?? '' ),
				'email'                  => sanitize_email( $member['email'] ?? '' ),
				'phone'                  => sanitize_text_field( $member['phone'] ?? '' ),
				'role'                   => sanitize_text_field( $member['role'] ?? '' ),
				'company'                => sanitize_text_field( $member['company'] ?? '' ),
				'notes'                  => sanitize_textarea_field( $member['notes'] ?? '' ),
				'consent_privacy'        => $privacy_flag,
				'consent_marketing'      => $marketing_flag,
				'consent_av'             => $av_enum,
				'privacy_consent'        => $privacy_enum,
				'privacy_consent_at'     => $privacy_flag ? $now_mysql : null,
				'audio_video_consent'    => $av_enum,
				'audio_video_consent_at' => ( 'acconsento' === $av_enum ) ? $now_mysql : null,
				'marketing_consent'      => $marketing_enum,
				'marketing_consent_at'   => $marketing_flag ? $now_mysql : null,
				'created_at'             => $now_mysql,
				'updated_at'             => $now_mysql,
			];

			$insert = array_intersect_key( $insert, $column_lookup );

			if ( empty( $insert ) ) {
				continue;
			}

			$formats = [];
			foreach ( array_keys( $insert ) as $column ) {
				$formats[] = $format_map[ $column ] ?? '%s';
			}

			$result = $wpdb->insert( $table, $insert, $formats );

			if ( false === $result ) {
				error_log( 'CIR persist_participants_rows: errore SQL ' . $wpdb->last_error );
			}
		}
	}

	public function update_registration_payment_status( $post_id, $status = 'pending' ) {
		global $wpdb;

		if ( empty( $wpdb ) || empty( $post_id ) ) {
			return;
		}

		$table = $wpdb->prefix . 'event_registrations';

		if ( ! $this->table_exists( $table ) ) {
			error_log( 'CIR update_registration_payment_status: tabella mancante ' . $table );
			return;
		}

		$wpdb->update(
			$table,
			[
				'payment_status' => sanitize_text_field( $status ),
				'updated_at'     => current_time( 'mysql', true ),
			],
			[
				'registration_post_id' => (int) $post_id,
			],
			[ '%s', '%s' ],
			[ '%d' ]
		);
	}

	private function sanitize_learn_about_event( $value ) {
		if ( empty( $value ) ) {
			return '';
		}

		if ( is_array( $value ) ) {
			$value = array_map( 'sanitize_text_field', $value );
			$value = array_intersect( $value, $this->learn_about_event_options );
			return implode( ',', $value );
		}

		$value = sanitize_text_field( $value );
		return in_array( $value, $this->learn_about_event_options, true ) ? $value : '';
	}

	private function normalize_binary_choice( $value ) {
		$value = sanitize_text_field( $value );
		return in_array( $value, [ 'acconsento', 'non_acconsento' ], true ) ? $value : 'non_acconsento';
	}

	private function table_exists( $table_name ) {
		global $wpdb;

		if ( empty( $wpdb ) || empty( $table_name ) ) {
			return false;
		}

		$result = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name ) );
		return ( $result === $table_name );
	}

	/**
	 * Recupera e memoizza l’elenco delle colonne di una tabella.
	 */
	private function get_table_columns( $table_name ) {
		global $wpdb;

		if ( empty( $wpdb ) || empty( $table_name ) ) {
			return [];
		}

		if ( isset( $this->cir_table_columns_cache[ $table_name ] ) ) {
			return $this->cir_table_columns_cache[ $table_name ];
		}

		$table_escaped = esc_sql( $table_name );
		$columns       = $wpdb->get_col( "SHOW COLUMNS FROM {$table_escaped}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

		if ( empty( $columns ) ) {
			return [];
		}

		$this->cir_table_columns_cache[ $table_name ] = $columns;

		return $columns;
	}

	/**
	 * Normalizza un valore enum su base lista consentita.
	 */
	private function normalize_enum( $value, array $allowed, $default ) {
		$value = sanitize_text_field( $value );
		return in_array( $value, $allowed, true ) ? $value : $default;
	}

	/**
	 * Sanitizza una data in formato YYYY-MM-DD (o restituisce null).
	 */
	private function sanitize_date_value( $value ) {
		if ( empty( $value ) ) {
			return null;
		}

		$timestamp = strtotime( $value );
		if ( ! $timestamp ) {
			return null;
		}

		return gmdate( 'Y-m-d', $timestamp );
	}
}