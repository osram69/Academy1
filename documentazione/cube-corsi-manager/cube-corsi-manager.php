<?php
/**
 * Plugin Name: Cube Academy - Gestione Corsi
 * Description: Pagina di amministrazione per gestire i corsi nella tabella wp_corsi (usata dagli shortcode lista_corsi_IT/EN/FR/DE) senza passare da phpMyAdmin.
 * Version: 1.0.0
 * Author: Cube Academy
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// -----------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------

// Se vuoi un pulsante di scorciatoia verso phpMyAdmin nella pagina elenco,
// incolla qui l'URL diretto (lo trovi in Hostinger hPanel > Database > phpMyAdmin).
// Lascialo vuoto ('') se non vuoi mostrare il pulsante.
define( 'CUBE_CORSI_PHPMYADMIN_URL', '' );

define( 'CUBE_CORSI_CAP', 'manage_options' ); // solo amministratori

// -----------------------------------------------------------------------
// Helpers: lingue, stati, nomi colonne
// -----------------------------------------------------------------------

function cube_corsi_table() {
    global $wpdb;
    return $wpdb->prefix . 'corsi';
}

function cube_corsi_langs() {
    return array(
        'IT' => 'Italiano',
        'EN' => 'English',
        'FR' => 'Français',
        'DE' => 'Deutsch',
    );
}

function cube_corsi_stati() {
    return array(
        0 => 'In Programma',
        1 => 'Confermato',
        2 => 'Non visualizzato',
        3 => 'Non Confermato',
        4 => 'In corso',
        5 => 'Completato',
    );
}

// Colonne che nel DB usano il trattino (es. "Data-IT") invece del underscore.
function cube_corsi_dash_fields() {
    return array( 'Data', 'Luogo', 'Lingua', 'Note' );
}

function cube_corsi_lang_field( $base, $lang ) {
    if ( in_array( $base, cube_corsi_dash_fields(), true ) ) {
        return $base . '-' . $lang;
    }
    return $base . '_' . $lang;
}

// -----------------------------------------------------------------------
// SQL builder sicuro (gestisce colonne con trattino e valori NULL)
// -----------------------------------------------------------------------

function cube_corsi_build_insert( $data ) {
    global $wpdb;
    $cols  = array();
    $ph    = array();
    $vals  = array();
    foreach ( $data as $col => $val ) {
        $cols[] = "`" . $col . "`";
        if ( null === $val ) {
            $ph[] = 'NULL';
        } else {
            $ph[]   = '%s';
            $vals[] = $val;
        }
    }
    $sql = 'INSERT INTO `' . cube_corsi_table() . '` (' . implode( ',', $cols ) . ') VALUES (' . implode( ',', $ph ) . ')';
    return $vals ? $wpdb->prepare( $sql, $vals ) : $sql;
}

function cube_corsi_build_update( $data, $id ) {
    global $wpdb;
    $set  = array();
    $vals = array();
    foreach ( $data as $col => $val ) {
        if ( null === $val ) {
            $set[] = "`" . $col . "` = NULL";
        } else {
            $set[]  = "`" . $col . "` = %s";
            $vals[] = $val;
        }
    }
    $sql    = 'UPDATE `' . cube_corsi_table() . '` SET ' . implode( ', ', $set ) . ' WHERE `id_corso` = %d';
    $vals[] = $id;
    return $wpdb->prepare( $sql, $vals );
}

// -----------------------------------------------------------------------
// Sanitizzazione dati dal form
// -----------------------------------------------------------------------

function cube_corsi_empty_to_null( $val ) {
    $val = trim( (string) $val );
    return ( '' === $val ) ? null : $val;
}

function cube_corsi_sanitize_datetime( $val ) {
    $val = trim( (string) $val );
    if ( '' === $val ) {
        return null;
    }
    // input type="datetime-local" produce "YYYY-MM-DDTHH:MM"
    $val = str_replace( 'T', ' ', $val );
    if ( preg_match( '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $val ) ) {
        $val .= ':00';
    }
    if ( ! preg_match( '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $val ) ) {
        return null;
    }
    return $val;
}

function cube_corsi_collect_post_data() {
    $data = array();

    // Campi comuni
    $data['Titolo']           = wp_kses_post( wp_unslash( $_POST['Titolo'] ?? '' ) );
    $data['Livello']          = sanitize_text_field( wp_unslash( $_POST['Livello'] ?? '' ) );
    $data['stato']             = isset( $_POST['stato'] ) ? intval( $_POST['stato'] ) : 0;
    $data['in_evidenza']       = isset( $_POST['in_evidenza'] ) ? 1 : 0;
    $data['iscrizioni_aperte'] = isset( $_POST['iscrizioni_aperte'] ) ? 1 : 0;

    $data['standard_price']   = ( '' === trim( (string) ( $_POST['standard_price'] ?? '' ) ) ) ? null : intval( $_POST['standard_price'] );
    $data['early_bird_price'] = ( '' === trim( (string) ( $_POST['early_bird_price'] ?? '' ) ) ) ? null : intval( $_POST['early_bird_price'] );

    $eb_start = cube_corsi_sanitize_datetime( $_POST['early_bird_start'] ?? '' );
    $eb_end   = cube_corsi_sanitize_datetime( $_POST['early_bird_end'] ?? '' );
    $data['early_bird_start']       = $eb_start ? $eb_start : '0000-00-00 00:00:00'; // colonna NOT NULL
    $data['early_bird_end']         = $eb_end ? $eb_end : '0000-00-00 00:00:00';     // colonna NOT NULL
    $data['early_bird_percentuale'] = ( '' === trim( (string) ( $_POST['early_bird_percentuale'] ?? '' ) ) ) ? 0 : floatval( str_replace( ',', '.', $_POST['early_bird_percentuale'] ) );

    for ( $i = 1; $i <= 3; $i++ ) {
        $data[ "codice_sconto_$i" ]              = cube_corsi_empty_to_null( sanitize_text_field( wp_unslash( $_POST[ "codice_sconto_$i" ] ?? '' ) ) );
        $data[ "codice_sconto_{$i}_data_inizio" ] = cube_corsi_sanitize_datetime( $_POST[ "codice_sconto_{$i}_data_inizio" ] ?? '' );
        $data[ "codice_sconto_{$i}_data_fine" ]   = cube_corsi_sanitize_datetime( $_POST[ "codice_sconto_{$i}_data_fine" ] ?? '' );
        $pct = trim( (string) ( $_POST[ "codice_sconto_{$i}_percentuale" ] ?? '' ) );
        $data[ "codice_sconto_{$i}_percentuale" ] = ( '' === $pct ) ? null : floatval( str_replace( ',', '.', $pct ) );
    }

    $data['codice_sconto_privati'] = cube_corsi_empty_to_null( sanitize_text_field( wp_unslash( $_POST['codice_sconto_privati'] ?? '' ) ) );

    // Campi per lingua
    foreach ( array_keys( cube_corsi_langs() ) as $lang ) {
        $data[ cube_corsi_lang_field( 'Data', $lang ) ]   = cube_corsi_empty_to_null( sanitize_text_field( wp_unslash( $_POST[ "Data_$lang" ] ?? '' ) ) );
        $data[ cube_corsi_lang_field( 'Luogo', $lang ) ]  = cube_corsi_empty_to_null( sanitize_text_field( wp_unslash( $_POST[ "Luogo_$lang" ] ?? '' ) ) );
        $data[ cube_corsi_lang_field( 'Lingua', $lang ) ] = cube_corsi_empty_to_null( sanitize_text_field( wp_unslash( $_POST[ "Lingua_$lang" ] ?? '' ) ) );
        $data[ cube_corsi_lang_field( 'Note', $lang ) ]   = cube_corsi_empty_to_null( sanitize_text_field( wp_unslash( $_POST[ "Note_$lang" ] ?? '' ) ) );

        // colonne NOT NULL -> fallback stringa vuota
        $data[ "link_readmore_$lang" ] = esc_url_raw( wp_unslash( $_POST[ "link_readmore_$lang" ] ?? '' ) );
        $data[ "link_booking_$lang" ]  = esc_url_raw( wp_unslash( $_POST[ "link_booking_$lang" ] ?? '' ) );
        $data[ "home_subtitle_$lang" ] = wp_kses_post( wp_unslash( $_POST[ "home_subtitle_$lang" ] ?? '' ) );

        // read_more_* arriva già come HTML dall'editor WYSIWYG
        $data[ "read_more_$lang" ] = wp_kses_post( wp_unslash( $_POST[ "read_more_$lang" ] ?? '' ) );
    }

    return $data;
}

// -----------------------------------------------------------------------
// Gestione azioni (save / delete / toggle / duplicate)
// -----------------------------------------------------------------------

add_action( 'admin_init', 'cube_corsi_handle_actions' );

function cube_corsi_handle_actions() {
    if ( ! current_user_can( CUBE_CORSI_CAP ) ) {
        return;
    }

    // Salvataggio (create/update)
    if ( isset( $_POST['cube_corsi_action'] ) && 'save' === $_POST['cube_corsi_action'] ) {
        check_admin_referer( 'cube_corsi_save' );

        $id   = isset( $_POST['id_corso'] ) ? intval( $_POST['id_corso'] ) : 0;
        $data = cube_corsi_collect_post_data();

        global $wpdb;
        if ( $id > 0 ) {
            $wpdb->query( cube_corsi_build_update( $data, $id ) );
            $msg = 'updated';
        } else {
            $wpdb->query( cube_corsi_build_insert( $data ) );
            $id  = $wpdb->insert_id;
            $msg = 'created';
        }

        wp_safe_redirect( admin_url( 'admin.php?page=cube-corsi&action=edit&id=' . $id . '&msg=' . $msg ) );
        exit;
    }

    // Elimina
    if ( isset( $_GET['page'], $_GET['cube_action'], $_GET['id'] ) && 'cube-corsi' === $_GET['page'] && 'delete' === $_GET['cube_action'] ) {
        check_admin_referer( 'cube_corsi_delete_' . intval( $_GET['id'] ) );
        global $wpdb;
        $wpdb->delete( cube_corsi_table(), array( 'id_corso' => intval( $_GET['id'] ) ), array( '%d' ) );
        wp_safe_redirect( admin_url( 'admin.php?page=cube-corsi&msg=deleted' ) );
        exit;
    }

    // Toggle iscrizioni aperte (rapido dalla lista)
    if ( isset( $_GET['page'], $_GET['cube_action'], $_GET['id'] ) && 'cube-corsi' === $_GET['page'] && 'toggle' === $_GET['cube_action'] ) {
        check_admin_referer( 'cube_corsi_toggle_' . intval( $_GET['id'] ) );
        global $wpdb;
        $id     = intval( $_GET['id'] );
        $table  = cube_corsi_table();
        $current = $wpdb->get_var( $wpdb->prepare( "SELECT iscrizioni_aperte FROM `$table` WHERE id_corso = %d", $id ) );
        $wpdb->update( $table, array( 'iscrizioni_aperte' => $current ? 0 : 1 ), array( 'id_corso' => $id ), array( '%d' ), array( '%d' ) );
        wp_safe_redirect( admin_url( 'admin.php?page=cube-corsi&msg=toggled' ) );
        exit;
    }

    // Duplica corso (utile per creare una nuova data partendo da un corso esistente)
    if ( isset( $_GET['page'], $_GET['cube_action'], $_GET['id'] ) && 'cube-corsi' === $_GET['page'] && 'duplicate' === $_GET['cube_action'] ) {
        check_admin_referer( 'cube_corsi_duplicate_' . intval( $_GET['id'] ) );
        global $wpdb;
        $table = cube_corsi_table();
        $row   = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM `$table` WHERE id_corso = %d", intval( $_GET['id'] ) ), ARRAY_A );
        if ( $row ) {
            unset( $row['id_corso'] );
            $wpdb->query( cube_corsi_build_insert( $row ) );
            $new_id = $wpdb->insert_id;
            wp_safe_redirect( admin_url( 'admin.php?page=cube-corsi&action=edit&id=' . $new_id . '&msg=duplicated' ) );
            exit;
        }
    }
}

// -----------------------------------------------------------------------
// Menu admin
// -----------------------------------------------------------------------

add_action( 'admin_menu', 'cube_corsi_admin_menu' );

function cube_corsi_admin_menu() {
    add_menu_page(
        'Gestione Corsi',
        'Corsi Academy',
        CUBE_CORSI_CAP,
        'cube-corsi',
        'cube_corsi_render_page',
        'dashicons-welcome-learn-more',
        26
    );
}

function cube_corsi_render_page() {
    if ( ! current_user_can( CUBE_CORSI_CAP ) ) {
        wp_die( 'Non hai i permessi per accedere a questa pagina.' );
    }

    $action = isset( $_GET['action'] ) ? sanitize_key( $_GET['action'] ) : 'list';

    if ( 'edit' === $action ) {
        cube_corsi_render_edit_page();
    } else {
        cube_corsi_render_list_page();
    }
}

// -----------------------------------------------------------------------
// Pagina elenco
// -----------------------------------------------------------------------

function cube_corsi_render_list_page() {
    global $wpdb;
    $table = cube_corsi_table();
    $corsi = $wpdb->get_results( "SELECT * FROM `$table` ORDER BY id_corso DESC" );
    $stati = cube_corsi_stati();

    $msg = isset( $_GET['msg'] ) ? sanitize_key( $_GET['msg'] ) : '';
    $messages = array(
        'created'    => 'Corso creato.',
        'updated'    => 'Corso aggiornato.',
        'deleted'    => 'Corso eliminato.',
        'toggled'    => 'Stato iscrizioni aggiornato.',
        'duplicated' => 'Corso duplicato. Modifica i dettagli e salva.',
    );
    ?>
    <div class="wrap">
        <h1 class="wp-heading-inline">Gestione Corsi Academy</h1>
        <a href="<?php echo esc_url( admin_url( 'admin.php?page=cube-corsi&action=edit&id=0' ) ); ?>" class="page-title-action">Aggiungi nuovo corso</a>
        <?php if ( CUBE_CORSI_PHPMYADMIN_URL ) : ?>
            <a href="<?php echo esc_url( CUBE_CORSI_PHPMYADMIN_URL ); ?>" target="_blank" rel="noopener" class="page-title-action">Apri phpMyAdmin</a>
        <?php endif; ?>
        <hr class="wp-header-end">

        <?php if ( $msg && isset( $messages[ $msg ] ) ) : ?>
            <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $messages[ $msg ] ); ?></p></div>
        <?php endif; ?>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width:40px;">ID</th>
                    <th>Titolo</th>
                    <th style="width:110px;">Livello</th>
                    <th style="width:130px;">Stato</th>
                    <th style="width:110px;">Iscrizioni</th>
                    <th style="width:130px;">Data (IT)</th>
                    <th style="width:90px;">In evidenza</th>
                    <th style="width:220px;">Azioni</th>
                </tr>
            </thead>
            <tbody>
            <?php if ( $corsi ) : ?>
                <?php foreach ( $corsi as $c ) : ?>
                    <tr>
                        <td><?php echo (int) $c->id_corso; ?></td>
                        <td><?php echo wp_kses_post( $c->Titolo ); ?></td>
                        <td><?php echo esc_html( $c->Livello ); ?></td>
                        <td><?php echo esc_html( $stati[ (int) $c->stato ] ?? 'Sconosciuto' ); ?></td>
                        <td>
                            <?php
                            $toggle_url = wp_nonce_url(
                                admin_url( 'admin.php?page=cube-corsi&cube_action=toggle&id=' . $c->id_corso ),
                                'cube_corsi_toggle_' . $c->id_corso
                            );
                            ?>
                            <a href="<?php echo esc_url( $toggle_url ); ?>" class="button button-small" style="<?php echo $c->iscrizioni_aperte ? 'background:#d4edda;' : 'background:#f8d7da;'; ?>">
                                <?php echo $c->iscrizioni_aperte ? 'Aperte' : 'Chiuse'; ?>
                            </a>
                        </td>
                        <td><?php echo esc_html( $c->{'Data-IT'} ); ?></td>
                        <td><?php echo $c->in_evidenza ? '✓' : ''; ?></td>
                        <td>
                            <a href="<?php echo esc_url( admin_url( 'admin.php?page=cube-corsi&action=edit&id=' . $c->id_corso ) ); ?>" class="button button-small">Modifica</a>
                            <?php
                            $dup_url = wp_nonce_url(
                                admin_url( 'admin.php?page=cube-corsi&cube_action=duplicate&id=' . $c->id_corso ),
                                'cube_corsi_duplicate_' . $c->id_corso
                            );
                            $del_url = wp_nonce_url(
                                admin_url( 'admin.php?page=cube-corsi&cube_action=delete&id=' . $c->id_corso ),
                                'cube_corsi_delete_' . $c->id_corso
                            );
                            ?>
                            <a href="<?php echo esc_url( $dup_url ); ?>" class="button button-small">Duplica</a>
                            <a href="<?php echo esc_url( $del_url ); ?>" class="button button-small" style="color:#a00;" onclick="return confirm('Eliminare definitivamente questo corso? L\'operazione non è reversibile.');">Elimina</a>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php else : ?>
                <tr><td colspan="8">Nessun corso presente.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}

// -----------------------------------------------------------------------
// Pagina modifica / nuovo
// -----------------------------------------------------------------------

function cube_corsi_render_edit_page() {
    global $wpdb;
    $table = cube_corsi_table();
    $id    = isset( $_GET['id'] ) ? intval( $_GET['id'] ) : 0;
    $corso = $id > 0 ? $wpdb->get_row( $wpdb->prepare( "SELECT * FROM `$table` WHERE id_corso = %d", $id ) ) : null;

    $get = function ( $field ) use ( $corso ) {
        if ( ! $corso ) {
            return '';
        }
        return $corso->$field ?? '';
    };
    $getl = function ( $base, $lang ) use ( $corso ) {
        if ( ! $corso ) {
            return '';
        }
        $field = cube_corsi_lang_field( $base, $lang );
        return $corso->$field ?? '';
    };

    $stati = cube_corsi_stati();
    $langs = cube_corsi_langs();

    $to_datetime_local = function ( $val ) {
        $val = trim( (string) $val );
        if ( '' === $val || '0000-00-00 00:00:00' === $val ) {
            return '';
        }
        return str_replace( ' ', 'T', substr( $val, 0, 16 ) );
    };
    ?>
    <div class="wrap">
        <h1><?php echo $id ? 'Modifica corso #' . $id : 'Nuovo corso'; ?></h1>
        <a href="<?php echo esc_url( admin_url( 'admin.php?page=cube-corsi' ) ); ?>">&larr; Torna all'elenco</a>

        <form method="post" action="<?php echo esc_url( admin_url( 'admin.php?page=cube-corsi&action=edit&id=' . $id ) ); ?>" style="margin-top:20px;max-width:1000px;">
            <?php wp_nonce_field( 'cube_corsi_save' ); ?>
            <input type="hidden" name="cube_corsi_action" value="save">
            <input type="hidden" name="id_corso" value="<?php echo (int) $id; ?>">

            <h2>Dati generali</h2>
            <table class="form-table">
                <tr>
                    <th><label for="Titolo">Titolo</label></th>
                    <td><input type="text" id="Titolo" name="Titolo" class="large-text" value="<?php echo esc_attr( $get( 'Titolo' ) ); ?>"></td>
                </tr>
                <tr>
                    <th><label for="Livello">Livello</label></th>
                    <td><input type="text" id="Livello" name="Livello" value="<?php echo esc_attr( $get( 'Livello' ) ); ?>"></td>
                </tr>
                <tr>
                    <th><label for="stato">Stato</label></th>
                    <td>
                        <select id="stato" name="stato">
                            <?php foreach ( $stati as $val => $label ) : ?>
                                <option value="<?php echo (int) $val; ?>" <?php selected( (int) $get( 'stato' ), $val ); ?>><?php echo esc_html( $label ); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>Opzioni</th>
                    <td>
                        <label><input type="checkbox" name="in_evidenza" <?php checked( (int) $get( 'in_evidenza' ), 1 ); ?>> In evidenza</label>
                        &nbsp;&nbsp;
                        <label><input type="checkbox" name="iscrizioni_aperte" <?php checked( (int) $get( 'iscrizioni_aperte' ), 1 ); ?>> Iscrizioni aperte</label>
                    </td>
                </tr>
                <tr>
                    <th>Prezzi</th>
                    <td>
                        Standard: € <input type="number" name="standard_price" value="<?php echo esc_attr( $get( 'standard_price' ) ); ?>" style="width:100px;">
                        &nbsp;&nbsp;
                        Early bird: € <input type="number" name="early_bird_price" value="<?php echo esc_attr( $get( 'early_bird_price' ) ); ?>" style="width:100px;">
                    </td>
                </tr>
                <tr>
                    <th>Finestra early bird</th>
                    <td>
                        Dal <input type="datetime-local" name="early_bird_start" value="<?php echo esc_attr( $to_datetime_local( $get( 'early_bird_start' ) ) ); ?>">
                        al <input type="datetime-local" name="early_bird_end" value="<?php echo esc_attr( $to_datetime_local( $get( 'early_bird_end' ) ) ); ?>">
                        &nbsp; Sconto: <input type="number" step="0.01" name="early_bird_percentuale" value="<?php echo esc_attr( $get( 'early_bird_percentuale' ) ); ?>" style="width:80px;"> %
                    </td>
                </tr>
            </table>

            <h2>Codici sconto</h2>
            <table class="form-table">
                <?php for ( $i = 1; $i <= 3; $i++ ) : ?>
                    <tr>
                        <th>Codice sconto <?php echo $i; ?></th>
                        <td>
                            Codice: <input type="text" name="codice_sconto_<?php echo $i; ?>" value="<?php echo esc_attr( $get( "codice_sconto_$i" ) ); ?>" style="width:140px;">
                            &nbsp; Dal <input type="datetime-local" name="codice_sconto_<?php echo $i; ?>_data_inizio" value="<?php echo esc_attr( $to_datetime_local( $get( "codice_sconto_{$i}_data_inizio" ) ) ); ?>">
                            al <input type="datetime-local" name="codice_sconto_<?php echo $i; ?>_data_fine" value="<?php echo esc_attr( $to_datetime_local( $get( "codice_sconto_{$i}_data_fine" ) ) ); ?>">
                            &nbsp; Sconto: <input type="number" step="0.01" name="codice_sconto_<?php echo $i; ?>_percentuale" value="<?php echo esc_attr( $get( "codice_sconto_{$i}_percentuale" ) ); ?>" style="width:80px;"> %
                        </td>
                    </tr>
                <?php endfor; ?>
                <tr>
                    <th>Codice sconto privati</th>
                    <td><input type="text" name="codice_sconto_privati" value="<?php echo esc_attr( $get( 'codice_sconto_privati' ) ); ?>" style="width:140px;"></td>
                </tr>
            </table>

            <h2>Contenuti per lingua</h2>
            <div class="cube-corsi-tabs">
                <h2 class="nav-tab-wrapper">
                    <?php $first = true; ?>
                    <?php foreach ( $langs as $code => $label ) : ?>
                        <a href="#lang-<?php echo esc_attr( $code ); ?>" class="nav-tab cube-corsi-tab<?php echo $first ? ' nav-tab-active' : ''; ?>" data-lang="<?php echo esc_attr( $code ); ?>"><?php echo esc_html( $label ); ?></a>
                        <?php $first = false; ?>
                    <?php endforeach; ?>
                </h2>

                <?php $first = true; ?>
                <?php foreach ( $langs as $code => $label ) : ?>
                    <div id="lang-<?php echo esc_attr( $code ); ?>" class="cube-corsi-tab-panel" style="<?php echo $first ? '' : 'display:none;'; ?> border:1px solid #ccd0d4; border-top:none; padding:15px;">
                        <table class="form-table">
                            <tr>
                                <th>Data</th>
                                <td><input type="text" name="Data_<?php echo $code; ?>" value="<?php echo esc_attr( $getl( 'Data', $code ) ); ?>" class="regular-text"></td>
                            </tr>
                            <tr>
                                <th>Luogo</th>
                                <td><input type="text" name="Luogo_<?php echo $code; ?>" value="<?php echo esc_attr( $getl( 'Luogo', $code ) ); ?>" class="regular-text"></td>
                            </tr>
                            <tr>
                                <th>Lingua del corso</th>
                                <td><input type="text" name="Lingua_<?php echo $code; ?>" value="<?php echo esc_attr( $getl( 'Lingua', $code ) ); ?>" class="regular-text"></td>
                            </tr>
                            <tr>
                                <th>Note</th>
                                <td><input type="text" name="Note_<?php echo $code; ?>" maxlength="10" value="<?php echo esc_attr( $getl( 'Note', $code ) ); ?>" style="width:100px;"></td>
                            </tr>
                            <tr>
                                <th>Link "Scopri di più"</th>
                                <td><input type="url" name="link_readmore_<?php echo $code; ?>" value="<?php echo esc_attr( $get( "link_readmore_$code" ) ); ?>" class="large-text"></td>
                            </tr>
                            <tr>
                                <th>Link iscrizione (booking)</th>
                                <td><input type="url" name="link_booking_<?php echo $code; ?>" value="<?php echo esc_attr( $get( "link_booking_$code" ) ); ?>" class="large-text"></td>
                            </tr>
                            <tr>
                                <th>Sottotitolo home (HTML libero)</th>
                                <td><textarea name="home_subtitle_<?php echo $code; ?>" rows="4" class="large-text code"><?php echo esc_textarea( $get( "home_subtitle_$code" ) ); ?></textarea>
                                <p class="description">Campo HTML grezzo (usato per banner con stili personalizzati): non viene passato dall'editor visuale.</p></td>
                            </tr>
                            <tr>
                                <th>Descrizione corso (read more)</th>
                                <td>
                                    <?php
                                    // wp_editor() richiede un id in minuscolo; il nome del campo
                                    // (che deve combaciare con $_POST["read_more_$lang"] in fase di salvataggio) resta con la lingua in maiuscolo.
                                    wp_editor(
                                        $get( "read_more_$code" ),
                                        'read_more_' . strtolower( $code ),
                                        array(
                                            'textarea_name' => 'read_more_' . $code,
                                            'media_buttons' => false,
                                            'textarea_rows' => 15,
                                        )
                                    );
                                    ?>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <?php $first = false; ?>
                <?php endforeach; ?>
            </div>

            <p class="submit">
                <button type="submit" class="button button-primary button-large">Salva corso</button>
            </p>
        </form>
    </div>

    <script>
    (function () {
        var tabs = document.querySelectorAll('.cube-corsi-tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelectorAll('.cube-corsi-tab').forEach(function (t) { t.classList.remove('nav-tab-active'); });
                document.querySelectorAll('.cube-corsi-tab-panel').forEach(function (p) { p.style.display = 'none'; });
                tab.classList.add('nav-tab-active');
                document.getElementById('lang-' + tab.dataset.lang).style.display = '';
            });
        });
    })();
    </script>
    <?php
}
