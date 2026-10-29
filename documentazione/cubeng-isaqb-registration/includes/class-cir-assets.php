<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CIR_Assets {
	private static $instance = null;

	/**
	 * Tiene traccia del fatto che gli asset siano già stati registrati.
	 *
	 * @var bool
	 */
	private $frontend_registered = false;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'wp_enqueue_scripts', [ $this, 'register_frontend_assets' ] );
	}

	/**
	 * Registra (una sola volta) CSS e JS del form.
	 */
	public function register_frontend_assets() {
		if ( $this->frontend_registered ) {
			return;
		}

		$css_path    = CIR_PLUGIN_DIR . 'assets/css/cir-frontend.css';
		$css_url     = CIR_PLUGIN_URL . 'assets/css/cir-frontend.css';
		$css_version = file_exists( $css_path ) ? filemtime( $css_path ) : '1.0.0';

		$js_path    = CIR_PLUGIN_DIR . 'assets/js/cir-frontend.js';
		$js_url     = CIR_PLUGIN_URL . 'assets/js/cir-frontend.js';
		$js_version = file_exists( $js_path ) ? filemtime( $js_path ) : '1.0.0';

		wp_register_style(
			'cir-frontend',
			$css_url,
			[],
			$css_version
		);

		wp_register_script(
			'cir-frontend',
			$js_url,
			[ 'jquery' ],
			$js_version,
			true
		);

		wp_localize_script(
			'cir-frontend',
			'CIRForm',
			[
				'ajaxUrl'         => admin_url( 'admin-ajax.php' ),
				'restUrl'         => rest_url( 'cir/v1' ),
				'restFeeEndpoint' => rest_url( 'cir/v1/fee' ),
				'nonce'           => wp_create_nonce( 'wp_rest' ),
				'validation'      => [
					'required' => __( 'Campo obbligatorio', 'cubeng-isaqb-registration' ),
					'email'    => __( 'Inserisci un indirizzo email valido', 'cubeng-isaqb-registration' ),
				],
			]
		);

		$this->frontend_registered = true;
	}

	/**
	 * Garantisce che gli asset siano registrati e li mette in coda.
	 */
	public function enqueue_frontend() {
		if ( ! $this->frontend_registered ) {
			$this->register_frontend_assets();
		}

		wp_enqueue_style( 'cir-frontend' );
		wp_enqueue_script( 'cir-frontend' );
	}
}