<?php
/**
 * Plugin Name: Cubeng iSAQB Course Registration
 * Plugin URI:  https://academy.cubeng.eu
 * Description: Replica il modulo Joomla per l'iscrizione aziendale agli esami iSAQB sul sito WordPress con pagamenti PayPal, Stripe e bonifico.
 * Version:     1.1.0
 * Author:      Cube Engineering S.r.l.
 * Author URI:  https://www.cubeng.it
 * License:     GPL-2.0-or-later
 * Text Domain: cubeng-isaqb-registration
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CIR_PLUGIN_FILE', __FILE__ );
define( 'CIR_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CIR_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once CIR_PLUGIN_DIR . 'includes/class-cir-assets.php';
require_once CIR_PLUGIN_DIR . 'includes/class-cir-settings.php';
require_once CIR_PLUGIN_DIR . 'includes/class-cir-shortcode.php';
require_once CIR_PLUGIN_DIR . 'includes/class-cir-form-handler.php';
require_once CIR_PLUGIN_DIR . 'includes/class-cir-rest.php';
require_once CIR_PLUGIN_DIR . 'includes/class-cir-gateway-paypal.php';
require_once CIR_PLUGIN_DIR . 'includes/class-cir-gateway-stripe.php';
require_once CIR_PLUGIN_DIR . 'includes/class-cir-gateway-sumup.php'; // <— nuovo gateway

add_action( 'plugins_loaded', function () {
	load_plugin_textdomain(
		'cubeng-isaqb-registration',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
} );

add_action( 'before_delete_post', function( $post_id ) {
 	if ( 'isaqb_registration' !== get_post_type( $post_id ) ) {
 		return;
 	}

 	global $wpdb;

 	$participants_table = $wpdb->prefix . 'event_participants';
 	$registrations_table = $wpdb->prefix . 'event_registrations';
 	$row_id = (int) get_post_meta( $post_id, 'cir_event_registration_row_id', true );

 	if ( ! $row_id ) {

		// Anche se manca l’ID, puliamo comunque la tabella principale usando il post ID.
		$wpdb->delete(
			$registrations_table,
			[ 'registration_post_id' => $post_id ],
			[ '%d' ]
		);
		return;
 	}


	// Cancella i partecipanti collegati.
	$wpdb->delete(
		$participants_table,
		[ 'registration_id' => $row_id ],
		[ '%d' ]
	);

	// Cancella il record principale.
	$wpdb->delete(
		$registrations_table,
		[ 'id' => $row_id ],
		[ '%d' ]
	);

	// Per sicurezza rimuovi anche eventuali righe “orfane” basate sul post ID.
	$wpdb->delete(
		$registrations_table,
		[ 'registration_post_id' => $post_id ],
		[ '%d' ]
	);
 } );

final class Cubeng_ISAQB_Registration {
	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', [ $this, 'register_post_type' ] );
		add_action( 'plugins_loaded', [ $this, 'init' ] );

		if ( is_admin() ) {
			add_filter( 'manage_edit-isaqb_registration_columns', [ $this, 'filter_admin_columns' ] );
			add_action( 'manage_isaqb_registration_posts_custom_column', [ $this, 'render_admin_columns' ], 10, 2 );
			add_action( 'admin_head', [ $this, 'output_admin_styles' ] );
		}
	}

	public function init() {
		CIR_Assets::get_instance();
		CIR_Settings::get_instance();
		CIR_Shortcode::get_instance();
		CIR_Form_Handler::get_instance();
		CIR_REST::get_instance();
		CIR_Gateway_PayPal::get_instance();
		CIR_Gateway_Stripe::get_instance();
		CIR_Gateway_SumUp::get_instance(); // <— inizializzazione SumUp
	}

	public function register_post_type() {
		$labels = [
			'name'               => __( 'Iscrizioni corso iSAQB CPSA-F', 'cubeng-isaqb-registration' ),
			'singular_name'      => __( 'Iscrizione corso iSAQB CPSA-F', 'cubeng-isaqb-registration' ),
			'menu_name'          => __( 'Iscrizioni corso iSAQB CPSA-F', 'cubeng-isaqb-registration' ),
			'name_admin_bar'     => __( 'Iscrizione corso iSAQB CPSA-F', 'cubeng-isaqb-registration' ),
			'add_new'            => __( 'Aggiungi nuova', 'cubeng-isaqb-registration' ),
			'add_new_item'       => __( 'Nuova iscrizione', 'cubeng-isaqb-registration' ),
			'new_item'           => __( 'Nuova iscrizione', 'cubeng-isaqb-registration' ),
			'edit_item'          => __( 'Modifica iscrizione', 'cubeng-isaqb-registration' ),
			'view_item'          => __( 'Visualizza iscrizione', 'cubeng-isaqb-registration' ),
			'all_items'          => __( 'Tutte le iscrizioni', 'cubeng-isaqb-registration' ),
			'search_items'       => __( 'Cerca iscrizioni', 'cubeng-isaqb-registration' ),
		];

		$args = [
			'labels'             => $labels,
			'public'             => false,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'menu_icon'          => 'dashicons-forms',
			'supports'           => [ 'title', 'editor', 'custom-fields' ],
		];

		register_post_type( 'isaqb_registration', $args );
	}

	public function filter_admin_columns( $columns ) {
		$new_columns = [
			'cb'           => $columns['cb'] ?? '<input type="checkbox" />',
			'title'        => __( 'Registrante', 'cubeng-isaqb-registration' ),
			'organization' => __( 'Società / Ente', 'cubeng-isaqb-registration' ),
			'event_date'   => __( 'Data corso', 'cubeng-isaqb-registration' ),
			'participants' => __( 'Partecipanti', 'cubeng-isaqb-registration' ),
			'payment'      => __( 'Pagamento', 'cubeng-isaqb-registration' ),
			'payment_link' => __( 'Link pagamento', 'cubeng-isaqb-registration' ),
			'date'         => $columns['date'] ?? __( 'Data', 'cubeng-isaqb-registration' ),
		];

		return $new_columns;
	}

	public function render_admin_columns( $column, $post_id ) {
		global $wpdb;

		$organization = get_post_meta( $post_id, 'organization', true );
		$event_date   = get_post_meta( $post_id, 'event_date', true );
		$status       = get_post_meta( $post_id, 'payment_status', true ) ?: 'pending';
		$row_id       = (int) get_post_meta( $post_id, 'cir_event_registration_row_id', true );

		switch ( $column ) {
			case 'organization':
				echo $organization ? esc_html( $organization ) : '<em>' . esc_html__( 'Non specificata', 'cubeng-isaqb-registration' ) . '</em>';
				break;

			case 'event_date':
				echo $event_date ? esc_html( $event_date ) : '<em>' . esc_html__( 'N/D', 'cubeng-isaqb-registration' ) . '</em>';
				break;

			case 'payment':
				$labels = [
					'paid'      => __( 'Pagata', 'cubeng-isaqb-registration' ),
					'pending'   => __( 'In attesa', 'cubeng-isaqb-registration' ),
					'failed'    => __( 'Fallita', 'cubeng-isaqb-registration' ),
					'cancelled' => __( 'Annullata', 'cubeng-isaqb-registration' ),
				];
				$label = $labels[ $status ] ?? ucfirst( $status );
				printf(
					'<span class="cir-status cir-status-%1$s">%2$s</span>',
					esc_attr( $status ),
					esc_html( $label )
				);
				break;
			case 'payment_link':
			     $method = get_post_meta( $post_id, 'payment_method', true );
			     $map = [
			         'sumup'  => get_post_meta( $post_id, 'sumup_checkout_url', true ),
			         'paypal' => get_post_meta( $post_id, 'paypal_checkout_url', true ),
			         'stripe' => get_post_meta( $post_id, 'stripe_checkout_url', true ),
			     ];
			     $link = $map[ $method ] ?? '';

			     if ( ! $link ) {
			         echo '<em>' . esc_html__( 'Nessun link', 'cubeng-isaqb-registration' ) . '</em>';
			         break;
			     }

			     if ( 'paid' === $status ) {
			         echo '<em>' . esc_html__( 'Pagamento completato', 'cubeng-isaqb-registration' ) . '</em>';
			         break;
			     }

			     printf(
			         '<a href="%1$s" target="_blank" rel="noopener noreferrer">%2$s</a>',
			         esc_url( $link ),
			         esc_html__( 'Apri checkout', 'cubeng-isaqb-registration' )
			     );
			     break;
			case 'participants':
				if ( ! $row_id ) {
					echo '<em>' . esc_html__( 'Nessun ID registrazione DB', 'cubeng-isaqb-registration' ) . '</em>';
					break;
				}

				$table = $wpdb->prefix . 'event_participants';
				$exists = $wpdb->get_var(
					$wpdb->prepare( 'SHOW TABLES LIKE %s', $table )
				);

				if ( $exists !== $table ) {
					echo '<em>' . esc_html__( 'Tabella partecipanti non disponibile', 'cubeng-isaqb-registration' ) . '</em>';
					break;
				}

				$participants = $wpdb->get_results(
					$wpdb->prepare(
						"SELECT first_name, last_name, email FROM {$table} WHERE registration_id = %d ORDER BY id ASC",
						$row_id
					),
					ARRAY_A
				);

				if ( empty( $participants ) ) {
					echo '<em>' . esc_html__( 'Nessun partecipante trovato', 'cubeng-isaqb-registration' ) . '</em>';
					break;
				}

				$count_label = sprintf(
					_n( '%d partecipante', '%d partecipanti', count( $participants ), 'cubeng-isaqb-registration' ),
					count( $participants )
				);

				echo '<details class="cir-participants-toggle">';
				echo '<summary>' . esc_html( $count_label ) . '</summary>';
				echo '<ul class="cir-participants-list">';
				foreach ( $participants as $index => $participant ) {
					printf(
						'<li><strong>%1$d.</strong> %2$s %3$s<br><small>%4$s</small></li>',
						$index + 1,
						esc_html( $participant['first_name'] ?? '' ),
						esc_html( $participant['last_name'] ?? '' ),
						esc_html( $participant['email'] ?? '' )
					);
				}
				echo '</ul>';
				echo '</details>';
				break;
		}
	}

	public function output_admin_styles() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || 'edit-isaqb_registration' !== $screen->id ) {
			return;
		}
		?>
		<style>
			.cir-status {
				display: inline-block;
				padding: 2px 10px;
				border-radius: 999px;
				font-size: 11px;
				font-weight: 600;
				text-transform: uppercase;
			}
			.cir-status-paid {
				background: #c6f6d5;
				color: #22543d;
			}
			.cir-status-pending {
				background: #feebc8;
				color: #744210;
			}
			.cir-status-failed {
				background: #fed7d7;
				color: #742a2a;
			}
			.cir-status-cancelled {
				background: #e2e8f0;
				color: #2d3748;
			}
			.cir-participants-toggle summary {
				cursor: pointer;
				font-weight: 600;
			}
			.cir-participants-list {
				margin: 8px 0 0 16px;
				list-style: disc;
			}
			.cir-participants-list li {
				margin-bottom: 4px;
			}
		</style>
		<?php
	}
}

Cubeng_ISAQB_Registration::get_instance();