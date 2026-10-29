<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$course_id = '';
if ( isset( $_GET['course_id'] ) ) {
	$course_id = absint( $_GET['course_id'] );
}
$event_date = '';
if ( isset( $_GET['event_date'] ) ) {
	$event_date = sanitize_text_field( wp_unslash( $_GET['event_date'] ) );
}

$provinces = [
	"Agrigento","Alessandria","Ancona","Aosta","Arezzo","Ascoli Piceno","Asti","Avellino","Bari","Belluno",
	"Benevento","Bergamo","Biella","Bologna","Bolzano","Brescia","Brindisi","Cagliari","Caltanissetta","Campobasso",
	"Caserta","Catania","Catanzaro","Chieti","Como","Cosenza","Cremona","Crotone","Cuneo","Enna",
	"Ferrara","Firenze","Foggia","Forlì-Cesena","Frosinone","Genova","Gorizia","Grosseto","Imperia","Isernia",
	"L'Aquila","La Spezia","Latina","Lecce","Lecco","Livorno","Lodi","Lucca","Macerata","Mantova",
	"Massa-Carrara","Matera","Messina","Milano","Modena","Monza-Brianza","Napoli","Novara","Nuoro","Oristano",
	"Padova","Palermo","Parma","Pavia","Perugia","Pesaro e Urbino","Pescara","Piacenza","Pisa","Pistoia",
	"Pordenone","Potenza","Prato","Ragusa","Ravenna","Reggio Calabria","Reggio Emilia","Rieti","Rimini","Roma",
	"Rovigo","Salerno","Sassari","Savona","Siena","Siracusa","Sondrio","Taranto","Teramo","Terni",
	"Torino","Trapani","Trento","Treviso","Trieste","Udine","Varese","Venezia","Verbano Cusio Ossola","Vercelli",
	"Verona","Vibo Valentia","Vicenza","Viterbo"
];

$countries = include CIR_PLUGIN_DIR . 'includes/countries.php';

$learn_about_options = [
	'social_media'    => __( 'Social media', 'cubeng-isaqb-registration' ),
	'newsletter'      => __( 'Newsletter', 'cubeng-isaqb-registration' ),
	'passaparola'     => __( 'Passaparola', 'cubeng-isaqb-registration' ),
	'sito_web'        => __( 'Sito web ITA-STQB / Cube Academy', 'cubeng-isaqb-registration' ),
	'partner'         => __( 'Partner / Sponsor', 'cubeng-isaqb-registration' ),
	'stampa'          => __( 'Articolo o stampa', 'cubeng-isaqb-registration' ),
	'ricerca_google'  => __( 'Ricerca Google / motori di ricerca', 'cubeng-isaqb-registration' ),
	'altro'           => __( 'Altro', 'cubeng-isaqb-registration' ),
];

$privacy_terms_url   = 'https://academy.cubeng.eu/privacy-policy/';
$av_terms_url        = '#audio_video_it';
$marketing_terms_url = '';

$success     = isset( $_GET['cir_status'] ) && 'success' === $_GET['cir_status'];
$bank_notice = ( isset( $_GET['cir_status'] ) && 'bank' === $_GET['cir_status'] )
	? urldecode( wp_unslash( $_GET['cir_msg'] ?? '' ) )
	: '';

$heading_text = $event_date
	? sprintf( __( 'Corso del %s', 'cubeng-isaqb-registration' ), $event_date )
	: $atts['title'];

$payment_options = [
	'paypal'        => [
		'enabled' => (bool) CIR_Settings::get_option( 'enable_paypal', 1 ),
		'label'   => 'PayPal',
		'badge'   => 'paypal',
	],
	'stripe'        => [
		'enabled' => (bool) CIR_Settings::get_option( 'enable_stripe', 1 ),
		'label'   => __( 'Stripe', 'cubeng-isaqb-registration' ),
		'badge'   => 'stripe',
	],
	'sumup'         => [
		'enabled' => (bool) CIR_Settings::get_option( 'enable_sumup', 1 ),
		'label'   => __( 'Carta di credito', 'cubeng-isaqb-registration' ),
		'badge'   => 'sumup',
	],
	'bank_transfer' => [
		'enabled' => (bool) CIR_Settings::get_option( 'enable_bank', 1 ),
		'label'   => __( 'Bonifico bancario', 'cubeng-isaqb-registration' ),
		'badge'   => 'bank',
	],
];

$enabled_methods = array_filter(
	$payment_options,
	static function ( $option ) {
		return ! empty( $option['enabled'] );
	}
);

if ( empty( $enabled_methods ) ) {
	$payment_options['bank_transfer']['enabled'] = true;
	$enabled_methods = [
		'bank_transfer' => $payment_options['bank_transfer'],
	];
}

reset( $enabled_methods );
$default_method = key( $enabled_methods );
if ( null === $default_method ) {
	$enabled_keys   = array_keys( $enabled_methods );
	$default_method = $enabled_keys[0] ?? 'bank_transfer';
}
?>
<div class="cir-wrapper">
	<header class="cir-progress">
		<h2 class="cir-progress__title"><?php echo esc_html( $heading_text ); ?></h2>
		<p class="cir-progress__subtitle">
			<?php printf(
				esc_html__( 'Modulo registrazione al corso %s.', 'cubeng-isaqb-registration' ),
				'<strong>' . esc_html( $atts['exam_name'] ) . '</strong>'
			); ?>
		</p>
	</header>

	<?php if ( $success ) : ?>
		<div class="cir-alert cir-alert-success">
			<?php esc_html_e( 'Iscrizione inviata con successo. Riceverai una conferma via email.', 'cubeng-isaqb-registration' ); ?>
		</div>
	<?php endif; ?>

	<?php if ( $bank_notice ) : ?>
		<div class="cir-alert cir-alert-info">
			<?php echo nl2br( esc_html( $bank_notice ) ); ?>
		</div>
	<?php endif; ?>

	<form
		id="cir-form"
		class="cir-form"
		method="post"
		action="<?php echo esc_url( add_query_arg( 'nocache', '1', admin_url( 'admin-post.php' ) ) ); ?>"
		novalidate
		data-event-date="<?php echo esc_attr( $event_date ); ?>"
		data-course-id="<?php echo esc_attr( $course_id ); ?>"
	>
		<input type="hidden" name="action" value="cir_submit_registration">
		<input type="hidden" name="course_id" value="<?php echo esc_attr( $course_id ); ?>">
		<?php wp_nonce_field( 'cir_submit_registration', 'cir_nonce' ); ?>

		<input type="hidden" name="privacy_terms_url" value="<?php echo esc_url( $privacy_terms_url ); ?>">
		<input type="hidden" name="av_terms_url" value="<?php echo esc_url( $av_terms_url ); ?>">
		<input type="hidden" name="marketing_terms_url" value="<?php echo esc_url( $marketing_terms_url ); ?>">
		<input type="hidden" name="event_date" value="<?php echo esc_attr( $event_date ); ?>">
		<input type="hidden" id="cir_members_json" name="cir_members_json" value="">
		<input type="hidden" id="allow_auto_earlybird" name="allow_auto_earlybird" value="1">
		<input type="hidden" name="cir_submission_uid" value="<?php echo esc_attr( wp_generate_uuid4() ); ?>">

		<section class="cir-step" data-step="1">
			<h2><?php esc_html_e( 'Numero persone da iscrivere', 'cubeng-isaqb-registration' ); ?></h2>
			<div class="cir-field">
				<label for="number_registrants"><?php esc_html_e( 'Persone', 'cubeng-isaqb-registration' ); ?> <span class="cir-required">*</span></label>
				<input type="number" id="number_registrants" name="number_registrants" value="1" min="1" max="50" required>
				<small><?php esc_html_e( 'Inserisci il numero di partecipanti (max 50 per registrazione).', 'cubeng-isaqb-registration' ); ?></small>
			</div>
		</section>

		<section class="cir-step" data-step="2">
			<h2><?php esc_html_e( 'Informazioni partecipanti', 'cubeng-isaqb-registration' ); ?></h2>
			<div id="cir-members-container">
				<div class="cir-member" data-index="1">
					<h3><?php esc_html_e( 'Partecipante 1', 'cubeng-isaqb-registration' ); ?></h3>
					<div class="cir-grid">
						<div class="cir-field">
							<label><?php esc_html_e( 'Nome', 'cubeng-isaqb-registration' ); ?> *</label>
							<input type="text" name="members[1][first_name]" required>
						</div>
						<div class="cir-field">
							<label><?php esc_html_e( 'Cognome', 'cubeng-isaqb-registration' ); ?> *</label>
							<input type="text" name="members[1][last_name]" required>
						</div>
						<div class="cir-field">
							<label><?php esc_html_e( 'Email', 'cubeng-isaqb-registration' ); ?> *</label>
							<input type="email" name="members[1][email]" required>
						</div>
						<div class="cir-field">
							    <label><?php esc_html_e( 'Telefono', 'cubeng-isaqb-registration' ); ?></label>
							    <input type="text" name="members[1][phone]">
							</div>
					</div>
				</div>
				<!-- I blocchi successivi vengono clonati via JS -->
			</div>
		</section>

		<section class="cir-step" data-step="3">
			<h2><?php esc_html_e( 'Informazioni per la fatturazione', 'cubeng-isaqb-registration' ); ?></h2>

			<h3><?php esc_html_e( 'Tipologia soggetto', 'cubeng-isaqb-registration' ); ?></h3>
			<div class="cir-field">
				<label><?php esc_html_e( 'Seleziona la tipologia del soggetto intestatario', 'cubeng-isaqb-registration' ); ?> <span class="cir-required">*</span></label>
				<div class="cir-radio-group">
					<label><input type="radio" name="invoicing_type" value="privato" required> <?php esc_html_e( 'Privato', 'cubeng-isaqb-registration' ); ?></label>
					<label><input type="radio" name="invoicing_type" value="libero_prof"> <?php esc_html_e( 'Libero professionista', 'cubeng-isaqb-registration' ); ?></label>
					<label><input type="radio" name="invoicing_type" value="azienda" checked> <?php esc_html_e( 'Società / Azienda', 'cubeng-isaqb-registration' ); ?></label>
					<label><input type="radio" name="invoicing_type" value="azienda_estero"> <?php esc_html_e( 'Società estera', 'cubeng-isaqb-registration' ); ?></label>
				</div>
			</div>

			<h3><?php esc_html_e( 'Dati personali', 'cubeng-isaqb-registration' ); ?></h3>
			<div class="cir-grid">
				<div class="cir-field">
					<label><?php esc_html_e( 'Nome Referente', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" name="first_name_ref" required>
				</div>
				<div class="cir-field">
					<label><?php esc_html_e( 'Cognome Referente', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" name="last_name_ref" required>
				</div>
				<div class="cir-field">
					<label><?php esc_html_e( 'Email principale', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="email" name="email" required>
				</div>

				<div class="cir-field">
					<label><?php esc_html_e( 'Telefono cellulare', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" name="phone" required>
				</div>
			</div>

			<h3><?php esc_html_e( 'Dati per la fatturazione', 'cubeng-isaqb-registration' ); ?></h3>

			<div class="cir-field">
				<label><?php esc_html_e( 'Ragione sociale / Intestatario', 'cubeng-isaqb-registration' ); ?> *</label>
				<input type="text" name="organization" required>
			</div>

			<div class="cir-field" id="cir-fatt-field" data-invoice-visible="libero_prof,azienda">
				<label><?php esc_html_e( 'Applicazione fatturazione elettronica', 'cubeng-isaqb-registration' ); ?> *</label>
				<div class="cir-radio-group">
					<label data-fatt-option="codice_destinatario"><input type="radio" name="fatt_elettronica" value="codice_destinatario" checked> <?php esc_html_e( 'Codice Destinatario', 'cubeng-isaqb-registration' ); ?></label>
					<label data-fatt-option="pec"><input type="radio" name="fatt_elettronica" value="pec"> PEC</label>
					<label data-fatt-option="na"><input type="radio" name="fatt_elettronica" value="na"> <?php esc_html_e( 'Non applicabile', 'cubeng-isaqb-registration' ); ?></label>
				</div>
			</div>

			<div class="cir-grid cir-conditional" data-condition="fatt_elettronica:codice_destinatario" data-invoice-visible="libero_prof,azienda" data-clear-on-hide="true">
				<div class="cir-field">
					<label><?php esc_html_e( 'Codice Destinatario (SDI)', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" name="fatt_elettronica_codice" maxlength="7">
				</div>
			</div>

			<div class="cir-grid cir-conditional" id="cir-pec-field" data-condition="fatt_elettronica:pec" data-invoice-visible="libero_prof,azienda" data-clear-on-hide="true">
				<div class="cir-field">
					<label><?php esc_html_e( 'Indirizzo PEC', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="email" id="fatt_elettronica_PEC" name="fatt_elettronica_PEC">
				</div>
			</div>

			<div class="cir-field" data-invoice-visible="libero_prof,azienda" data-clear-on-hide="true">
				<label><?php esc_html_e( 'Tipologia applicazione IVA', 'cubeng-isaqb-registration' ); ?> *</label>
				<div class="cir-radio-group">
					<label><input type="radio" name="applicazioneiva" value="standard" required> <?php esc_html_e( 'IVA standard', 'cubeng-isaqb-registration' ); ?></label>
					<label><input type="radio" name="applicazioneiva" value="split"> <?php esc_html_e( 'Split payment', 'cubeng-isaqb-registration' ); ?></label>
				</div>
			</div>

			<div class="cir-grid">
				<div class="cir-field" data-invoice-visible="privato,libero_prof,azienda" data-clear-on-hide="true">
					<label for="cir-fiscalcode"><?php esc_html_e( 'Codice Fiscale', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" id="cir-fiscalcode" name="fiscalcode" required>
				</div>
				<div class="cir-field" data-invoice-visible="libero_prof,azienda,azienda_estero">
					<label for="cir-vat"><?php esc_html_e( 'Partita IVA / VAT', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" id="cir-vat" name="vat" required>
				</div>
			</div>

			<h3><?php esc_html_e( 'Indirizzo di fatturazione', 'cubeng-isaqb-registration' ); ?></h3>
			<div class="cir-grid">
				<div class="cir-field">
					<label><?php esc_html_e( 'Indirizzo', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" name="address" required>
				</div>
				<div class="cir-field">
					<label><?php esc_html_e( 'Indirizzo (riga 2)', 'cubeng-isaqb-registration' ); ?></label>
					<input type="text" name="address2">
				</div>
				<div class="cir-field">
					<label><?php esc_html_e( 'Città', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" name="city" required>
				</div>
				<div class="cir-field">
					<label><?php esc_html_e( 'CAP', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" name="zip" required>
				</div>
				<div class="cir-field" id="cir-province-select-wrapper" data-invoice-visible="privato,libero_prof,azienda" data-clear-on-hide="true">
					<label for="cir-province-select"><?php esc_html_e( 'Provincia', 'cubeng-isaqb-registration' ); ?> *</label>
					<select name="state" id="cir-province-select" data-field-name="state" required>
						<option value=""><?php esc_html_e( 'Seleziona la Provincia', 'cubeng-isaqb-registration' ); ?></option>
						<?php foreach ( $provinces as $province ) : ?>
							<option value="<?php echo esc_attr( $province ); ?>"><?php echo esc_html( $province ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>
				<div class="cir-field cir-hidden" id="cir-province-text-wrapper" data-invoice-visible="azienda_estero" data-clear-on-hide="true">
					<label for="cir-province-text"><?php esc_html_e( 'Provincia / Stato', 'cubeng-isaqb-registration' ); ?> *</label>
					<input type="text" id="cir-province-text" data-field-name="state" required>
				</div>
				<div class="cir-field">
					<label><?php esc_html_e( 'Paese', 'cubeng-isaqb-registration' ); ?> *</label>
					<select name="country" required>
						<option value=""><?php esc_html_e( 'Seleziona la nazione', 'cubeng-isaqb-registration' ); ?></option>
						<?php foreach ( $countries as $country ) : ?>
							<option value="<?php echo esc_attr( $country ); ?>" <?php selected( 'Italy', $country ); ?>><?php echo esc_html( $country ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>
				<div class="cir-field cir-field--full">
						<label for="billing_notes"><?php esc_html_e( 'Note per la fatturazione', 'cubeng-isaqb-registration' ); ?></label>
						<textarea id="billing_notes" name="billing_notes" rows="3" placeholder="<?php esc_attr_e( 'Indicazioni aggiuntive per la fattura', 'cubeng-isaqb-registration' ); ?>"></textarea>
					</div>
			</div>
		</section>

		<section class="cir-step" data-step="4">
			<h2><?php esc_html_e( 'Privacy, pagamento e riepilogo', 'cubeng-isaqb-registration' ); ?></h2>

			<div class="cir-field">
				<label><?php esc_html_e( 'Come hai saputo di questo evento?', 'cubeng-isaqb-registration' ); ?> <span class="cir-required">*</span></label>
				<select name="learn_about_event" id="learn_about_event" required>
					<option value=""><?php esc_html_e( 'Seleziona un’opzione', 'cubeng-isaqb-registration' ); ?></option>
					<?php foreach ( $learn_about_options as $value => $label ) : ?>
						<option value="<?php echo esc_attr( $value ); ?>"><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</div>

			<div class="cir-field cir-hidden" id="learn_about_event_other_field">
				<label for="learn_about_event_other"><?php esc_html_e( 'Specificare', 'cubeng-isaqb-registration' ); ?></label>
				<input type="text" id="learn_about_event_other" name="learn_about_event_other">
			</div>

			<div class="cir-field cir-field--coupon">
				<label for="coupon_code"><?php esc_html_e( 'Codice sconto', 'cubeng-isaqb-registration' ); ?></label>
				<div class="cir-coupon-group">
					<input type="text" name="coupon_code" id="coupon_code" maxlength="50">
					<button type="button" id="cir-coupon-apply"><?php esc_html_e( 'Applica', 'cubeng-isaqb-registration' ); ?></button>
				</div>
				<p id="cir-coupon-feedback" class="cir-coupon-feedback" role="alert" aria-live="assertive"></p>
			</div>

			<div class="cir-summary" aria-live="polite">
				<div>
					<span><?php esc_html_e( 'Quota d’iscrizione', 'cubeng-isaqb-registration' ); ?></span>
					<strong class="cir-summary-amount">€ 1.500,00</strong>
				</div>
				<div>
					<span><?php esc_html_e( 'Importo dello sconto', 'cubeng-isaqb-registration' ); ?></span>
					<strong class="cir-summary-discount">€ 0,00</strong>
				</div>
				<div>
					<span><?php esc_html_e( 'IVA', 'cubeng-isaqb-registration' ); ?></span>
					<strong class="cir-summary-tax">€ 330,00</strong>
				</div>
				<div>
					<span><?php esc_html_e( 'Totale lordo', 'cubeng-isaqb-registration' ); ?></span>
					<strong class="cir-summary-total">€ 1.830,00</strong>
				</div>
			</div>
			<div class="cir-summary-loading" aria-live="polite"><?php esc_html_e( 'Ricalcolo del totale in corso…', 'cubeng-isaqb-registration' ); ?></div>

			<div class="cir-payment-options">
				<?php foreach ( $enabled_methods as $key => $meta ) : ?>
					<label class="cir-payment-card cir-payment-<?php echo esc_attr( $meta['badge'] ); ?>">
						<input
							type="radio"
							name="payment_method"
							value="<?php echo esc_attr( $key ); ?>"
							<?php checked( $default_method, $key ); ?>
							required
						>
						<span class="cir-payment-content">
							<span class="cir-payment-title"><?php echo esc_html( $meta['label'] ); ?></span>
						</span>
					</label>
				<?php endforeach; ?>
			</div>

			<div class="cir-consent-block">
				<h4><?php esc_html_e( 'Politica sulla Privacy', 'cubeng-isaqb-registration' ); ?></h4>
				<?php if ( $privacy_terms_url ) : ?>
					<p>
						<a href="<?php echo esc_url( $privacy_terms_url ); ?>" target="_blank" rel="noopener">
							<?php esc_html_e( 'Leggi i Termini per la Politica sulla Privacy', 'cubeng-isaqb-registration' ); ?>
						</a>
					</p>
				<?php endif; ?>
				<label>
					<input type="checkbox" name="consent_privacy" value="1" required id="consent_privacy">
					<?php esc_html_e( 'Ho letto e accetto le condizioni della Politica sulla Privacy.', 'cubeng-isaqb-registration' ); ?>
				</label>
			</div>

			<div class="cir-consent-block">
				<h4><?php esc_html_e( 'Registrazioni audio/video e pubblicazioni', 'cubeng-isaqb-registration' ); ?></h4>
				<?php if ( $av_terms_url ) : ?>
					<p>
						<a href="<?php echo esc_url( $av_terms_url ); ?>">
							<?php esc_html_e( 'Leggi i Termini per registrazioni audio e video e pubblicazioni', 'cubeng-isaqb-registration' ); ?>
						</a>
					</p>
				<?php endif; ?>
				<div class="cir-consent-options">
					<label><input type="radio" name="consent_av" value="acconsento" required id="consent_av"> <?php esc_html_e( 'Acconsento', 'cubeng-isaqb-registration' ); ?></label>
					<label><input type="radio" name="consent_av" value="non_acconsento"> <?php esc_html_e( 'Non Acconsento', 'cubeng-isaqb-registration' ); ?></label>
				</div>
			</div>

			<div class="cir-consent-block">
				<h4><?php esc_html_e( 'Informazioni e materiale promozionale', 'cubeng-isaqb-registration' ); ?></h4>
				<?php if ( $marketing_terms_url ) : ?>
					<p>
						<a href="<?php echo esc_url( $marketing_terms_url ); ?>" target="_blank" rel="noopener">
							<?php esc_html_e( 'Leggi i Termini per il materiale promozionale', 'cubeng-isaqb-registration' ); ?>
						</a>
					</p>
				<?php endif; ?>
				<div class="cir-consent-options">
					<label><input type="radio" name="consent_marketing" value="acconsento" required id="consent_marketing"> <?php esc_html_e( 'Acconsento', 'cubeng-isaqb-registration' ); ?></label>
					<label><input type="radio" name="consent_marketing" value="non_acconsento"> <?php esc_html_e( 'Non Acconsento', 'cubeng-isaqb-registration' ); ?></label>
				</div>
			</div>

			<div class="cir-actions">
				<button type="submit" class="cir-btn cir-btn-primary"><?php esc_html_e( 'Esegui iscrizione', 'cubeng-isaqb-registration' ); ?></button>
			</div>
		</section>
	</form>
</div>