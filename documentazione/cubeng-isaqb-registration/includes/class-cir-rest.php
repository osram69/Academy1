<?php
/**
 * Endpoint REST per il calcolo dinamico delle quote.
 *
 * @package cubeng-isaqb-registration
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-cir-discount-service.php';

class CIR_REST {
	/**
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * Tipologie di fatturazione ammesse.
	 *
	 * @var string[]
	 */
	private $invoice_types = [ 'privato', 'libero_prof', 'azienda', 'azienda_estero' ];

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
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	/**
	 * Registra le rotte pubbliche.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			'cir/v1',
			'/fee',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'calculate_fee' ],
				'permission_callback' => '__return_true',
			]
		);
	}

	/**
	 * Calcola totali e messaggi relativi a coupon/Early Bird.
	 *
	 * @param WP_REST_Request $request Request.
	 *
	 * @return WP_REST_Response
	 */
	public function calculate_fee( WP_REST_Request $request ) {
    $people = max( 1, min( 50, (int) $request->get_param( 'people' ) ) );

    $coupon_code = sanitize_text_field( $request->get_param( 'coupon_code' ) ?? '' );
    $event_date  = sanitize_text_field( $request->get_param( 'event_date' ) ?? '' );
    $course_id   = absint( $request->get_param( 'course_id' ) );

    $invoice_type = sanitize_key( $request->get_param( 'invoice_type' ) ?? 'privato' );
    if ( ! in_array( $invoice_type, $this->invoice_types, true ) ) {
        $invoice_type = 'privato';
    }

    $allow_auto = $request->get_param( 'allow_auto_earlybird' );
    if ( null === $allow_auto ) {
        $allow_auto = true;
    } else {
        $allow_auto = (bool) (int) $allow_auto;
    }

    $service = CIR_Discount_Service::get_instance();

    $totals = $service->compute_totals(
        [
            'people'               => $people,
            'coupon_code'          => $coupon_code,
            'event_date'           => $event_date,
            'invoice_type'         => $invoice_type,
            'allow_auto_earlybird' => $allow_auto,
            'course_id'            => $course_id,
        ]
    );

    $response = [
        'people'               => (int) $totals['people'],
        'amount_raw'           => (float) $totals['amount'],
        'discount_raw'         => (float) $totals['discount'],
        'tax_raw'              => (float) $totals['tax'],
        'total_raw'            => (float) $totals['total'],
        'discount_percent'     => (float) $totals['discount_percent'],
        'applied_code'         => $totals['applied_code'],
        'auto_applied'         => (bool) $totals['auto_applied'],
        'coupon_error'         => (bool) $totals['coupon_error'],
        'coupon_message'       => $totals['coupon_message'],
        'invoice_type'         => $invoice_type,
        'allow_auto_earlybird' => $allow_auto ? 1 : 0,
    ];

    return rest_ensure_response( $response );
}
}

CIR_REST::get_instance();