<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CIR_Shortcode {
	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_shortcode( 'cubeng_isaqb_group_form', [ $this, 'render_form' ] );
	}

	public function render_form( $atts ) {
		// Carica sempre gli asset necessari (anche se non erano stati ancora registrati).
		CIR_Assets::get_instance()->enqueue_frontend();

		$atts = shortcode_atts(
			[
				'title'     => __( 'Iscrizione aziendale', 'cubeng-isaqb-registration' ),
				'exam_name' => __( 'Corso certificazione iSAQB® - Certified Professional for Software Architecture Foundation Level', 'cubeng-isaqb-registration' ),
			],
			$atts
		);

		ob_start();
		include CIR_PLUGIN_DIR . 'templates/form.php';
		return ob_get_clean();
	}
}