# File: README.md

## Cubeng iSAQB Group Registration

Questo plugin replica su WordPress il modulo Joomla per l'iscrizione aziendale agli esami iSAQB CPSA-F.

### Funzionalità principali
- Shortcode `[cubeng_isaqb_group_form]`.
- Salvataggio iscrizioni in un Custom Post Type (`isaqb_registration`).
- Gestione multi-step lato frontend con JS dedicato.
- Calcolo dinamico delle quote via REST API (`/wp-json/cir/v1/fee`).
- Convalida server-side con nonce WordPress e admin_post.

### Installazione
1. Copia la cartella `cubeng-isaqb-registration` in `wp-content/plugins/`.
2. Attiva il plugin da **Plugin → Plugin installati**.
3. Inserisci lo shortcode in una pagina.

### Personalizzazione
- Modifica importi/aliquote nel metodo `calculate_fee()` (`includes/class-cir-rest.php`).
- Aggiorna testi/descrizioni nel template `templates/form.php`.
- Aggiungi logiche di integrazione (es. CRM) dentro `CIR_Form_Handler::handle_submission`.

### Supporto
Contatta il team Cubeng o ITA-STQB per esigenze specifiche di integrazione.