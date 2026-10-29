<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CIR_Settings {
	private static $instance = null;

	/**
	 * Valori di default per tutte le impostazioni.
	 *
	 * @var array
	 */
	private $defaults = [
		'paypal_mode'            => 'sandbox',
		'paypal_client_id'       => '',
		'paypal_secret'          => '',
		'paypal_currency'        => 'EUR',
		'stripe_publishable_key' => '',
		'stripe_secret_key'      => '',
		'sumup_api_key'          => '',
		'sumup_merchant_code'    => '',
		'bank_message'           => "Effettua il bonifico intestato a Cube Engineering S.r.l.\nIBAN: IT67 Y 05034 03262 0000 00001286\nCausale: Iscrizione corso iSAQB + Nome Azienda",
		'enable_paypal'          => 1,
		'enable_stripe'          => 1,
		'enable_sumup'           => 1,
		'enable_bank'            => 1,
		'discount_rules'         => [],
	];

	/**
	 * Default per la configurazione coupon (Early Bird rimosso).
	 *
	 * @var array
	 */
	private $discount_defaults = [
		'coupons' => [],
	];

	/**
	 * Scope ammessi per i coupon.
	 *
	 * @var string[]
	 */
	private $discount_scopes = [ 'privato', 'libero_prof', 'azienda', 'azienda_estero' ];

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->discount_defaults['coupons'] = array_fill( 0, 6, [
			'code'    => '',
			'label'   => '',
			'start'   => '',
			'end'     => '',
			'percent' => 0,
			'scopes'  => $this->discount_scopes,
		] );

		add_action( 'admin_menu', [ $this, 'register_menu' ] );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
	}

	public function register_menu() {
		add_options_page(
			'iSAQB Payments',
			'iSAQB Payments',
			'manage_options',
			'cir-settings',
			[ $this, 'render_page' ]
		);
	}

	public function register_settings() {
		register_setting( 'cir_payment_settings', 'cir_payment_settings', [ $this, 'sanitize' ] );

		add_settings_section(
			'cir_methods_section',
			__( 'Metodi disponibili', 'cubeng-isaqb-registration' ),
			function () {
				echo '<p>' . esc_html__( 'Abilita o disabilita i metodi che vuoi mostrare sul form.', 'cubeng-isaqb-registration' ) . '</p>';
			},
			'cir-payment'
		);

		$method_flags = [
			'enable_paypal' => __( 'PayPal', 'cubeng-isaqb-registration' ),
			'enable_stripe' => __( 'Carta (Stripe)', 'cubeng-isaqb-registration' ),
			'enable_sumup'  => __( 'Carta (SumUp)', 'cubeng-isaqb-registration' ),
			'enable_bank'   => __( 'Bonifico bancario', 'cubeng-isaqb-registration' ),
		];

		foreach ( $method_flags as $field => $label ) {
			add_settings_field(
				$field,
				$label,
				[ $this, 'render_checkbox' ],
				'cir-payment',
				'cir_methods_section',
				[ 'id' => $field ]
			);
		}

		add_settings_section(
			'cir_paypal_section',
			__( 'PayPal', 'cubeng-isaqb-registration' ),
			function () {
				echo '<p>' . esc_html__( 'Configura le credenziali PayPal.', 'cubeng-isaqb-registration' ) . '</p>';
			},
			'cir-payment'
		);

		$paypal_fields = [
			'paypal_mode'      => __( 'Modalità', 'cubeng-isaqb-registration' ),
			'paypal_client_id' => __( 'Client ID', 'cubeng-isaqb-registration' ),
			'paypal_secret'    => __( 'Secret', 'cubeng-isaqb-registration' ),
			'paypal_currency'  => __( 'Valuta (ISO)', 'cubeng-isaqb-registration' ),
		];

		foreach ( $paypal_fields as $field => $label ) {
			add_settings_field(
				$field,
				$label,
				[ $this, 'render_field' ],
				'cir-payment',
				'cir_paypal_section',
				[ 'id' => $field ]
			);
		}

		add_settings_section(
			'cir_stripe_section',
			__( 'Stripe', 'cubeng-isaqb-registration' ),
			function () {
				echo '<p>' . esc_html__( 'Configura le API Stripe.', 'cubeng-isaqb-registration' ) . '</p>';
			},
			'cir-payment'
		);

		$stripe_fields = [
			'stripe_publishable_key' => __( 'Publishable key', 'cubeng-isaqb-registration' ),
			'stripe_secret_key'      => __( 'Secret key', 'cubeng-isaqb-registration' ),
		];

		foreach ( $stripe_fields as $field => $label ) {
			add_settings_field(
				$field,
				$label,
				[ $this, 'render_field' ],
				'cir-payment',
				'cir_stripe_section',
				[ 'id' => $field ]
			);
		}

		add_settings_section(
			'cir_sumup_section',
			__( 'SumUp', 'cubeng-isaqb-registration' ),
			function () {
				echo '<p>' . esc_html__( 'Configura le API SumUp.', 'cubeng-isaqb-registration' ) . '</p>';
			},
			'cir-payment'
		);

		$sumup_fields = [
			'sumup_api_key'       => __( 'API key (sk_test_/sk_live_)', 'cubeng-isaqb-registration' ),
			'sumup_merchant_code' => __( 'Merchant code', 'cubeng-isaqb-registration' ),
		];

		foreach ( $sumup_fields as $field => $label ) {
			add_settings_field(
				$field,
				$label,
				[ $this, 'render_field' ],
				'cir-payment',
				'cir_sumup_section',
				[ 'id' => $field ]
			);
		}

		add_settings_section(
			'cir_bank_section',
			__( 'Bonifico bancario', 'cubeng-isaqb-registration' ),
			function () {
				echo '<p>' . esc_html__( 'Testo mostrato all’utente con le istruzioni di pagamento via bonifico.', 'cubeng-isaqb-registration' ) . '</p>';
			},
			'cir-payment'
		);

		add_settings_field(
			'bank_message',
			__( 'Istruzioni', 'cubeng-isaqb-registration' ),
			[ $this, 'render_textarea' ],
			'cir-payment',
			'cir_bank_section',
			[ 'id' => 'bank_message' ]
		);

		add_settings_section(
			'cir_discount_section',
			__( 'Coupon personalizzati', 'cubeng-isaqb-registration' ),
			function () {
				echo '<p>' . esc_html__( 'Configura fino a 6 coupon differenziati per tipologia di fatturazione.', 'cubeng-isaqb-registration' ) . '</p>';
			},
			'cir-payment'
		);

		add_settings_field(
			'discount_rules_coupons',
			__( 'Coupon', 'cubeng-isaqb-registration' ),
			[ $this, 'render_discount_coupons' ],
			'cir-payment',
			'cir_discount_section'
		);
	}

	public function sanitize( $input ) {
		$input    = is_array( $input ) ? $input : [];
		$stored   = get_option( 'cir_payment_settings', [] );
		$base     = wp_parse_args( $stored, $this->defaults );
		$data     = wp_parse_args( $input, $base );

		$data['paypal_mode']      = in_array( $data['paypal_mode'], [ 'sandbox', 'live' ], true ) ? $data['paypal_mode'] : 'sandbox';
		$data['paypal_client_id'] = sanitize_text_field( $data['paypal_client_id'] ?? '' );
		$data['paypal_secret']    = sanitize_text_field( $data['paypal_secret'] ?? '' );
		$data['paypal_currency']  = strtoupper( sanitize_text_field( $data['paypal_currency'] ?? 'EUR' ) );

		$data['stripe_publishable_key'] = sanitize_text_field( $data['stripe_publishable_key'] ?? '' );
		$data['stripe_secret_key']      = sanitize_text_field( $data['stripe_secret_key'] ?? '' );

		$data['sumup_api_key']       = sanitize_text_field( $data['sumup_api_key'] ?? '' );
		$data['sumup_merchant_code'] = strtoupper( sanitize_text_field( $data['sumup_merchant_code'] ?? '' ) );

		$data['bank_message'] = wp_kses_post( $data['bank_message'] ?? '' );

		$checkboxes = [ 'enable_paypal', 'enable_stripe', 'enable_sumup', 'enable_bank' ];
		foreach ( $checkboxes as $flag ) {
			$data[ $flag ] = array_key_exists( $flag, $input ) ? 1 : 0;
		}

		$data['discount_rules'] = $this->sanitize_discount_rules( $input['discount_rules'] ?? [] );

		return $data;
	}

	private function sanitize_discount_rules( $rules ) {
		$rules    = is_array( $rules ) ? $rules : [];
		$defaults = $this->discount_defaults;

		$coupons_input = is_array( $rules['coupons'] ?? null ) ? $rules['coupons'] : [];
		$coupons       = [];

		for ( $i = 0; $i < 6; $i++ ) {
			$row     = $coupons_input[ $i ] ?? [];
			$code    = strtoupper( sanitize_text_field( $row['code'] ?? '' ) );
			$label   = sanitize_text_field( $row['label'] ?? '' );
			$start   = $this->sanitize_date( $row['start'] ?? '' );
			$end     = $this->sanitize_date( $row['end'] ?? '' );
			$percent = (float) ( $row['percent'] ?? 0 );
			$scopes  = array_filter( (array) ( $row['scopes'] ?? [] ), function ( $scope ) {
				return in_array( $scope, $this->discount_scopes, true );
			} );

			if ( empty( $scopes ) ) {
				$scopes = $this->discount_scopes;
			}

			if ( empty( $code ) || $percent <= 0 ) {
				$coupons[] = $defaults['coupons'][ $i ];
				continue;
			}

			$coupons[] = [
				'code'    => $code,
				'label'   => $label ?: $code,
				'start'   => $start,
				'end'     => $end,
				'percent' => min( 100, max( 0, $percent ) ),
				'scopes'  => array_values( $scopes ),
			];
		}

		return [
			'coupons' => $coupons,
		];
	}

	private function sanitize_date( $value ) {
		$value = sanitize_text_field( $value );
		return preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value ) ? $value : '';
	}

	private function get_options_with_defaults() {
		$options = get_option( 'cir_payment_settings', [] );
		$options = wp_parse_args( $options, $this->defaults );

		if ( empty( $options['discount_rules'] ) || ! is_array( $options['discount_rules'] ) ) {
			$options['discount_rules'] = $this->discount_defaults;
		} else {
			$options['discount_rules'] = wp_parse_args( $options['discount_rules'], $this->discount_defaults );
			if ( empty( $options['discount_rules']['coupons'] ) || ! is_array( $options['discount_rules']['coupons'] ) ) {
				$options['discount_rules']['coupons'] = $this->discount_defaults['coupons'];
			} else {
				$options['discount_rules']['coupons'] = array_values( $options['discount_rules']['coupons'] );
				$options['discount_rules']['coupons'] = array_pad( $options['discount_rules']['coupons'], 6, $this->discount_defaults['coupons'][0] );
			}
		}

		return $options;
	}

	public function render_field( $args ) {
		$options = $this->get_options_with_defaults();
		$id      = $args['id'];
		$value   = $options[ $id ] ?? '';

		if ( 'paypal_mode' === $id ) {
			?>
			<select name="cir_payment_settings[paypal_mode]">
				<option value="sandbox" <?php selected( $value, 'sandbox' ); ?>>Sandbox</option>
				<option value="live" <?php selected( $value, 'live' ); ?>>Live</option>
			</select>
			<?php
			return;
		}

		printf(
			'<input type="text" class="regular-text" name="cir_payment_settings[%1$s]" value="%2$s" autocomplete="off">',
			esc_attr( $id ),
			esc_attr( $value )
		);
	}

	public function render_textarea( $args ) {
		$options = $this->get_options_with_defaults();
		$id      = $args['id'];
		$value   = $options[ $id ] ?? '';

		printf(
			'<textarea class="large-text" rows="5" name="cir_payment_settings[%1$s]">%2$s</textarea>',
			esc_attr( $id ),
			esc_textarea( $value )
		);
	}

	public function render_checkbox( $args ) {
		$options = $this->get_options_with_defaults();
		$id      = $args['id'];
		$checked = ! empty( $options[ $id ] );

		printf(
			'<label><input type="checkbox" name="cir_payment_settings[%1$s]" value="1" %2$s> %3$s</label>',
			esc_attr( $id ),
			checked( $checked, true, false ),
			esc_html__( 'Abilita', 'cubeng-isaqb-registration' )
		);
	}

	public function render_discount_coupons() {
		$options = $this->get_options_with_defaults();
		$rules   = $options['discount_rules']['coupons'];
		?>
		<table class="widefat striped">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Codice', 'cubeng-isaqb-registration' ); ?></th>
					<th><?php esc_html_e( 'Etichetta', 'cubeng-isaqb-registration' ); ?></th>
					<th><?php esc_html_e( 'Data inizio', 'cubeng-isaqb-registration' ); ?></th>
					<th><?php esc_html_e( 'Data fine', 'cubeng-isaqb-registration' ); ?></th>
					<th><?php esc_html_e( 'Percentuale', 'cubeng-isaqb-registration' ); ?></th>
					<th><?php esc_html_e( 'Ambiti', 'cubeng-isaqb-registration' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $rules as $index => $rule ) : ?>
					<tr>
						<td>
							<input type="text" name="cir_payment_settings[discount_rules][coupons][<?php echo esc_attr( $index ); ?>][code]" value="<?php echo esc_attr( $rule['code'] ); ?>" maxlength="50">
						</td>
						<td>
							<input type="text" name="cir_payment_settings[discount_rules][coupons][<?php echo esc_attr( $index ); ?>][label]" value="<?php echo esc_attr( $rule['label'] ); ?>" maxlength="100">
						</td>
						<td>
							<input type="date" name="cir_payment_settings[discount_rules][coupons][<?php echo esc_attr( $index ); ?>][start]" value="<?php echo esc_attr( $rule['start'] ); ?>">
						</td>
						<td>
							<input type="date" name="cir_payment_settings[discount_rules][coupons][<?php echo esc_attr( $index ); ?>][end]" value="<?php echo esc_attr( $rule['end'] ); ?>">
						</td>
						<td>
							<input type="number" step="0.1" min="0" max="100" name="cir_payment_settings[discount_rules][coupons][<?php echo esc_attr( $index ); ?>][percent]" value="<?php echo esc_attr( $rule['percent'] ); ?>"> %
						</td>
						<td>
							<?php foreach ( $this->discount_scopes as $scope ) : ?>
								<label style="display:block;">
									<input
										type="checkbox"
										name="cir_payment_settings[discount_rules][coupons][<?php echo esc_attr( $index ); ?>][scopes][]"
										value="<?php echo esc_attr( $scope ); ?>"
										<?php checked( in_array( $scope, $rule['scopes'], true ), true ); ?>
									>
									<?php echo esc_html( ucfirst( str_replace( '_', ' ', $scope ) ) ); ?>
								</label>
							<?php endforeach; ?>
						</td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
		<p class="description"><?php esc_html_e( 'Lascia vuoto il codice per disattivare lo slot. La percentuale si applica solo se la tipologia di fatturazione dell’utente è inclusa negli ambiti selezionati.', 'cubeng-isaqb-registration' ); ?></p>
		<?php
	}

	public function render_page() {
		?>
		<div class="wrap">
			<h1>iSAQB Payments</h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( 'cir_payment_settings' );
				do_settings_sections( 'cir-payment' );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	public static function get_option( $key, $default = '' ) {
		$instance = self::get_instance();
		$options  = wp_parse_args(
			get_option( 'cir_payment_settings', [] ),
			$instance->defaults
		);

		if ( array_key_exists( $key, $options ) ) {
			return $options[ $key ];
		}

		return $default;
	}

	public static function get_discount_rules() {
		$instance = self::get_instance();
		$options  = $instance->get_options_with_defaults();
		return $options['discount_rules'];
	}
}