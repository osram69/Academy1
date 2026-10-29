<?php
/**
 * Gestione centralizzata di early bird (DB) e coupon (impostazioni WP).
 *
 * @package cubeng-isaqb-registration
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CIR_Discount_Service {
	private static $instance = null;

	private $base_fee        = 1500.00;
	private $tax_rate        = 0.22;
	private $early_bird_code = 'EARLYBIRD';

	/**
	 * Regole coupon configurate da backend (max 6, con scope e percentuali).
	 *
	 * @var array
	 */
	private $discount_rules = [];

	/**
	 * Tipologie di fatturazione ammesse.
	 *
	 * @var string[]
	 */
	private $invoice_scopes = [ 'privato', 'libero_prof', 'azienda', 'azienda_estero' ];

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct() {
		$this->discount_rules = CIR_Settings::get_discount_rules();
	}

	public function compute_totals( $args = [] ) {
		$people                = isset( $args['people'] ) ? (int) $args['people'] : 1;
		$coupon_code           = isset( $args['coupon_code'] ) ? $this->normalize_code( $args['coupon_code'] ) : '';
		$event_date            = isset( $args['event_date'] ) ? sanitize_text_field( $args['event_date'] ) : '';
		$invoice_type          = isset( $args['invoice_type'] ) ? sanitize_key( $args['invoice_type'] ) : 'privato';
		$allow_auto_early_bird = array_key_exists( 'allow_auto_earlybird', $args ) ? (bool) $args['allow_auto_earlybird'] : true;
		$course_id             = isset( $args['course_id'] ) ? (int) $args['course_id'] : 0;

		if ( ! in_array( $invoice_type, $this->invoice_scopes, true ) ) {
			$invoice_type = 'privato';
		}

		$people = max( 1, min( 50, $people ) );
		$result = [
			'people'                => $people,
			'amount'                => 0.0,
			'tax'                   => 0.0,
			'discount'              => 0.0,
			'total'                 => 0.0,
			'discount_percent'      => 0.0,
			'applied_code'          => '',
			'auto_applied'          => false,
			'coupon_error'          => false,
			'coupon_message'        => '',
			'course_id'             => (int) $course_id,
			'invoice_type'          => $invoice_type,
			'base_price_per_person' => 0.0,
			'base_price_type'       => 'standard',
			'base_price_reference'  => 0.0,
		];

		$course = $this->get_course_row( $course_id, $event_date );
		if ( $course ) {
			$result['course_id'] = (int) ( $course->id_corso ?? $course_id );
		}

		$now = current_time( 'timestamp' );

		/**
		 * Se l’intervallo Early Bird è effettivamente attivo e c’è un prezzo agevolato valido,
		 * forziamo in modo definitivo la tariffa ridotta ignorando il flag proveniente dal browser.
		 */
		$early_window_active = false;
		if ( $course ) {
			$early_price_candidate = $this->normalize_price_value( $course->early_bird_price ?? null );
			if (
				$early_price_candidate > 0
				&& $this->is_within_range( $course->early_bird_start ?? '', $course->early_bird_end ?? '', $now )
			) {
				$early_window_active = true;
			}
		}

		if ( $early_window_active ) {
			$allow_auto_early_bird = true;
		}

#if earlybird active always allow
		$pricing_context = $this->resolve_base_price( $course, $allow_auto_early_bird, $now );
		$amount          = $pricing_context['price'] * $people;

		$result['amount']                = $amount;
		$result['base_price_per_person'] = $pricing_context['price'];
		$result['base_price_type']       = $pricing_context['is_early_bird'] ? 'early_bird' : 'standard';
		$result['base_price_reference']  = $pricing_context['standard_price'];

		$discount_data = $this->resolve_discount(
			$course,
			$coupon_code,
			$invoice_type,
			$now,
			$pricing_context
		);

		$result['discount_percent'] = (float) $discount_data['percent'];
		$result['applied_code']     = $discount_data['applied_code'];
		$result['auto_applied']     = $discount_data['auto_applied'];
		$result['coupon_error']     = $discount_data['coupon_error'];

		if ( $discount_data['coupon_message'] ) {
			$result['coupon_message'] = $discount_data['coupon_message'];
		} elseif ( $pricing_context['is_early_bird'] ) {
			$result['coupon_message'] = sprintf(
				__( 'Tariffa Early Bird attiva (%s a partecipante).', 'cubeng-isaqb-registration' ),
				$this->format_currency( $pricing_context['price'] )
			);
		}

		if ( $result['discount_percent'] > 0 ) {
			$result['discount'] = min(
				$amount,
				round( $amount * ( $result['discount_percent'] / 100 ), 2 )
			);
		}

		$taxable         = max( 0, $amount - $result['discount'] );
		$result['tax']   = round( $taxable * $this->tax_rate, 2 );
		$result['total'] = max( 0, round( $taxable + $result['tax'], 2 ) );

		return $result;
	}

	private function resolve_discount( $course, $coupon_code, $invoice_type, $now, $pricing_context ) {
		$defaults = [
			'percent'        => 0.0,
			'applied_code'   => '',
			'auto_applied'   => false,
			'coupon_error'   => false,
			'coupon_message' => '',
		];

		if ( $coupon_code === $this->early_bird_code ) {
			if ( ! empty( $pricing_context['is_early_bird'] ) ) {
				return [
					'percent'        => 0.0,
					'applied_code'   => '',
					'auto_applied'   => false,
					'coupon_error'   => true,
					'coupon_message' => __( 'La tariffa Early Bird è già applicata automaticamente.', 'cubeng-isaqb-registration' ),
				];
			}

			$standard = $pricing_context['standard_price'] ?? 0.0;
			$early    = $this->normalize_price_value( $course->early_bird_price ?? null );

			if (
				$standard > 0
				&& $early > 0
				&& $early < $standard
				&& $this->is_within_range( $course->early_bird_start ?? '', $course->early_bird_end ?? '', $now )
			) {
				$percent = ( 1 - ( $early / $standard ) ) * 100;

				return [
					'percent'        => $percent,
					'applied_code'   => $this->early_bird_code,
					'auto_applied'   => false,
					'coupon_error'   => false,
					'coupon_message' => sprintf(
						__( 'Codice Early Bird applicato (-%s%%).', 'cubeng-isaqb-registration' ),
						$this->format_percent( $percent )
					),
				];
			}

			return [
				'percent'        => 0.0,
				'applied_code'   => '',
				'auto_applied'   => false,
				'coupon_error'   => true,
				'coupon_message' => __( 'Codice Early Bird non più valido.', 'cubeng-isaqb-registration' ),
			];
		}

		if ( $coupon_code ) {
			$match = $this->match_configured_coupon( $coupon_code, $invoice_type, $now );

			if ( $match ) {
				return [
					'percent'        => $match['percent'],
					'applied_code'   => $match['code'],
					'auto_applied'   => false,
					'coupon_error'   => false,
					'coupon_message' => sprintf(
						__( 'Codice applicato: %s (-%s%%).', 'cubeng-isaqb-registration' ),
						$match['label'],
						$this->format_percent( $match['percent'] )
					),
				];
			}

			return [
				'percent'        => 0.0,
				'applied_code'   => '',
				'auto_applied'   => false,
				'coupon_error'   => true,
				'coupon_message' => __( 'Codice sconto non valido o scaduto.', 'cubeng-isaqb-registration' ),
			];
		}

		return $defaults;
	}

	private function resolve_base_price( $course, $allow_auto_early_bird, $now ) {
		$standard = $this->base_fee;

		if ( $course ) {
			$db_standard = $this->normalize_price_value( $course->standard_price ?? null );
			if ( $db_standard > 0 ) {
				$standard = $db_standard;
			}
		}

		$price      = $standard;
		$is_early   = false;
		$early_slot = (
			$allow_auto_early_bird
			&& $course
			&& $this->is_within_range( $course->early_bird_start ?? '', $course->early_bird_end ?? '', $now )
		);

		if ( $early_slot ) {
			$candidate = $this->normalize_price_value( $course->early_bird_price ?? null );
			if ( $candidate > 0 && $candidate < $price ) {
				$price    = $candidate;
				$is_early = true;
			}
		}

		return [
			'price'          => $price,
			'standard_price' => $standard,
			'is_early_bird'  => $is_early,
		];
	}

	private function match_configured_coupon( $coupon_code, $invoice_type, $now ) {
		$rules = $this->discount_rules['coupons'] ?? [];

		foreach ( $rules as $rule ) {
			if ( empty( $rule['code'] ) || strtoupper( $rule['code'] ) !== $coupon_code ) {
				continue;
			}

			if ( (float) ( $rule['percent'] ?? 0 ) <= 0 ) {
				continue;
			}

			$scopes = (array) ( $rule['scopes'] ?? [] );
			if ( ! in_array( $invoice_type, $scopes, true ) ) {
				return null;
			}

			if ( ! $this->is_within_range( $rule['start'] ?? '', $rule['end'] ?? '', $now ) ) {
				return null;
			}

			return [
				'code'    => $rule['code'],
				'label'   => $rule['label'] ?: $rule['code'],
				'percent' => (float) $rule['percent'],
			];
		}

		return null;
	}

	private function get_course_row( $course_id, $event_date ) {
		global $wpdb;

		if ( empty( $wpdb ) ) {
		 return null;
		}

		$table = $wpdb->prefix . 'corsi';

		if ( ! $this->table_exists( $table ) ) {
			return null;
		}

		$course = null;

		if ( $course_id > 0 ) {
			$course = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$wpdb->prepare(
					"SELECT * FROM {$table} WHERE id_corso = %d LIMIT 1",
					$course_id
				)
			);
			if ( $course ) {
			 return $course;
			}
		}

		if ( $event_date ) {
			$course = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$wpdb->prepare(
					"SELECT * FROM {$table} WHERE `Data-IT` = %s OR `Data-EN` = %s ORDER BY id_corso DESC LIMIT 1",
					$event_date,
					$event_date
				)
			);
		}

		if ( ! $course ) {
			$course = $wpdb->get_row( "SELECT * FROM {$table} WHERE iscrizioni_aperte = 1 ORDER BY early_bird_start DESC, id_corso DESC LIMIT 1" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		}

		return $course;
	}

	private function is_within_range( $start, $end, $now ) {
		$start_ts = $this->parse_datetime( $start );
		$end_ts   = $this->parse_datetime( $end );

		if ( $start_ts && $now < $start_ts ) {
			return false;
		}

		if ( $end_ts && $now > $end_ts ) {
			return false;
		}

		return true;
	}

	private function parse_datetime( $value ) {
		if ( empty( $value ) ) {
			return 0;
		}

		$timestamp = strtotime( $value );
		return $timestamp ? $timestamp : 0;
	}

	private function normalize_code( $code ) {
		$code = sanitize_text_field( (string) $code );
	 return strtoupper( trim( $code ) );
	}

	private function format_percent( $value ) {
		$formatted = number_format( (float) $value, 2, ',', '' );
		return rtrim( rtrim( $formatted, '0' ), ',' );
	}

	private function format_currency( $value ) {
		return number_format_i18n( (float) $value, 2 );
	}

	private function normalize_price_value( $value ) {
		if ( null === $value ) {
			return 0.0;
		}

		$float = (float) $value;
		return $float > 0 ? $float : 0.0;
	}

	private function table_exists( $table_name ) {
		global $wpdb;

		if ( empty( $wpdb ) || empty( $table_name ) ) {
			return false;
		}

		$exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return ( $exists === $table_name );
	}
}