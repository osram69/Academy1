(function ($) {
	'use strict';

	const state = {
		people: 1,
		couponTimer: null,
		$form: null,
		autoEarlyBirdInjected: false,
		couponManuallyEdited: false,
		settingCouponProgrammatically: false,
		currentInvoiceType: 'privato',
		$memberTemplate: null,
		formSubmitted: false,
	};

	const selectors = {
		form: '#cir-form',
		peopleInput: '#number_registrants',
		couponInput: '#coupon_code',
		couponApply: '#cir-coupon-apply',
		couponFeedback: '#cir-coupon-feedback',
		summaryLoading: '.cir-summary-loading',
		membersContainer: '#cir-members-container',
		allowAutoEarlyBird: '#allow_auto_earlybird',
	};

	const MEMBER_SELECTOR = '.cir-member';
	const ALL_FATT_OPTIONS = ['codice_destinatario', 'pec', 'na'];

	const INVOICE_RULES = {
		privato: {
			allowedFattOptions: [],
			defaultFattOption: null,
			pecOptional: true,
		},
		libero_prof: {
			allowedFattOptions: ALL_FATT_OPTIONS,
			defaultFattOption: 'codice_destinatario',
			pecOptional: false,
		},
		azienda: {
			allowedFattOptions: ALL_FATT_OPTIONS,
			defaultFattOption: 'codice_destinatario',
			pecOptional: false,
		},
		azienda_estero: {
			allowedFattOptions: [],
			defaultFattOption: null,
			pecOptional: false,
		},
	};

	const IT_FISCAL_CODE_REGEX = /^[A-Z]{6}\d{2}[A-Z]{1}\d{2}[A-Z]{1}\d{3}[A-Z]{1}$/;
	const GENERIC_FOREIGN_CODE_REGEX = /^[A-Z0-9]{6,}$/;
	const GENERIC_FOREIGN_VAT_REGEX = /^[A-Z0-9]{6,20}$/;
	const ITALY_VALUES = ['italy', 'italia', 'it'];

	const validationMessages = Object.assign(
		{
			required: 'Campo obbligatorio.',
			email: 'Inserisci un indirizzo email valido.',
		},
		(window.CIRForm && window.CIRForm.validation) || {}
	);

	function getForm() {
		if (!state.$form) {
			state.$form = $(selectors.form);
		}
		return state.$form;
	}

	function clampPeople(value) {
		const parsed = parseInt(value, 10);
		if (Number.isNaN(parsed) || parsed < 1) {
			return 1;
		}
		if (parsed > 50) {
			return 50;
		}
		return parsed;
	}

	function formatEuro(amount) {
		return new Intl.NumberFormat('it-IT', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2,
		}).format(amount || 0);
	}

	function cacheFieldMetadata($scope) {
		const $context = $scope ? $scope.find('input, select, textarea') : $('input, select, textarea');
		$context.each(function () {
			const $field = $(this);
			if (typeof $field.data('original-name') === 'undefined') {
				$field.data('original-name', $field.attr('name') || '');
			}
			if ($field.prop('required') && !$field.data('was-required')) {
				$field.data('was-required', true);
			}
		});
	}

	function clearFieldInputs($scope) {
		$scope.find('input, select, textarea').each(function () {
			const $field = $(this);
			if ($field.is('[type="hidden"]')) {
				return;
			}
			if ($field.is(':checkbox') || $field.is(':radio')) {
				$field.prop('checked', false);
			} else if ($field.is('select')) {
				$field.prop('selectedIndex', 0);
			} else {
				$field.val('');
			}
		});
	}

	function setFieldsEnabled($scope, enable) {
		$scope.find('input, select, textarea').each(function () {
			const $field = $(this);
			if ($field.is('[type="hidden"]')) {
				return;
			}
			if (enable) {
				$field.prop('disabled', false);
				if ($field.data('was-required')) {
					$field.prop('required', true);
				}
			} else {
				if ($field.prop('required')) {
					$field.data('was-required', true);
				}
				$field.prop('required', false);
				$field.prop('disabled', true);
			}
		});
	}

	 function clearFieldErrors($scope) {
        $scope.find('.cir-field').each(function () {
            $(this).removeClass('has-error').find('.cir-field-error').remove();
        });
    }

    function toggleSectionVisibility($el, shouldShow) {
         const isHidden = $el.hasClass('cir-hidden');
         if (shouldShow && isHidden) {
             $el.removeClass('cir-hidden').attr('aria-hidden', 'false');
         } else if (!shouldShow && !isHidden) {
             $el.addClass('cir-hidden').attr('aria-hidden', 'true');
             if ($el.data('clear-on-hide')) {
                 clearFieldInputs($el);
             }
           clearFieldErrors($el);
         }
         setFieldsEnabled($el, shouldShow);
     }

	function evaluateInvoiceVisibility($el) {
		const raw = ($el.data('invoice-visible') || '').toString().trim();
		if (!raw.length) {
			return true;
		}
		const allowed = raw
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
		if (!allowed.length) {
			return true;
		}
		return allowed.includes(state.currentInvoiceType);
	}

	function evaluateConditionVisibility($el) {
		const raw = ($el.data('condition') || '').toString();
		if (!raw.length || !raw.includes(':')) {
			return true;
		}
		const [fieldName, expected] = raw.split(':');
		if (!fieldName) {
			return true;
		}
		const $inputs = $(`[name="${fieldName}"]`);
		if (!$inputs.length) {
			return false;
		}
		if ($inputs.first().is(':radio') || $inputs.first().is(':checkbox')) {
			return $inputs.filter(':checked').val() === expected;
		}
		return ($inputs.val() || '') === expected;
	}

	function refreshDynamicSections() {
		$('[data-invoice-visible], [data-condition]').each(function () {
			const $el = $(this);
			const invoiceOk = evaluateInvoiceVisibility($el);
			const conditionOk = evaluateConditionVisibility($el);
			toggleSectionVisibility($el, invoiceOk && conditionOk);
		});
	}

	function enforceFattOptions(type) {
		const rules = INVOICE_RULES[type] || INVOICE_RULES.privato;
		const $options = $('[data-fatt-option]');
		if (!$options.length || !rules.allowedFattOptions.length) {
			return;
		}
		$options.each(function () {
			const $label = $(this);
			const value = $label.data('fatt-option');
			const allowed = rules.allowedFattOptions.includes(value);
			$label.toggle(allowed);
			const $radio = $label.find('input[type="radio"]');
			if (!allowed) {
				$radio.prop('checked', false);
			}
		});
		const current = $('input[name="fatt_elettronica"]:checked').val();
		if (!current || !rules.allowedFattOptions.includes(current)) {
			const fallback = rules.defaultFattOption || rules.allowedFattOptions[0];
			if (fallback) {
				$(`input[name="fatt_elettronica"][value="${fallback}"]`)
					.prop('checked', true)
					.trigger('change');
			}
		}
	}

	function applyPecRequirement() {
		const rules = INVOICE_RULES[state.currentInvoiceType] || INVOICE_RULES.privato;
		const selected = $('input[name="fatt_elettronica"]:checked').val();
		const $pec = $('#fatt_elettronica_PEC');
		if (!$pec.length) {
			return;
		}
		const shouldRequire = selected === 'pec' && !rules.pecOptional;
		if (shouldRequire) {
			$pec.prop('disabled', false).prop('required', true);
		} else {
			$pec.prop('required', false);
		}
	}

	function enforceTaxFieldRequirements(type) {
		const $cf = $('#cir-fiscalcode');
	}
	function toggleBillingFields(type) {
		state.currentInvoiceType = type || 'privato';
		enforceFattOptions(state.currentInvoiceType);
		refreshDynamicSections();
		applyPecRequirement();
		enforceTaxFieldRequirements(state.currentInvoiceType);
		handleFiscalCodeValidation();
		handleVatValidation();
		state.autoEarlyBirdInjected = false;

		// reset del coupon quando cambia la tipologia
		const $coupon = $(selectors.couponInput);
		state.settingCouponProgrammatically = true;
		if (
		    state.autoEarlyBirdInjected &&
		    !state.couponManuallyEdited &&
		    coupon === 'EARLYBIRD'
		) {
		    coupon = '';
		}
		state.settingCouponProgrammatically = false;
		state.couponManuallyEdited = false;
		state.autoEarlyBirdInjected = false;
		const $feedback = $(selectors.couponFeedback);
		$feedback.removeClass('is-error is-success').text('').hide();

		fetchTotals(false);
	}

	function cacheMemberPatterns($card) {
		$card.find('[name]').each(function () {
			const $field = $(this);
			const name = $field.attr('name') || '';
			if (name.includes('members[')) {
				const pattern = name.replace(/members\[\d+\]/, 'members[__index__]');
				$field.data('name-pattern', pattern);
			}
		});
		const $heading = $card.find('h3').first();
		if ($heading.length && !$heading.data('base-label')) {
			$heading.data('base-label', $heading.text().replace(/\d+$/, '').trim());
		}
	}

	function prepareMemberTemplate() {
		const $container = $(selectors.membersContainer);
		if (!$container.length) {
			return;
		}
		const $first = $container.find(MEMBER_SELECTOR).first();
		if (!$first.length) {
			return;
		}
		cacheFieldMetadata($first);
		const $template = $first.clone(false, false);
		cacheMemberPatterns($template);
		clearFieldInputs($template);
		state.$memberTemplate = $template;
	}

	function applyMemberIndex($card, index, options = {}) {
		const resetValues = !!options.reset;
		$card.attr('data-index', index);
		const $heading = $card.find('h3').first();
		if ($heading.length) {
			const base = $heading.data('base-label') || $heading.text().replace(/\d+$/, '').trim();
			$heading.data('base-label', base);
			$heading.text(`${base} ${index}`);
		}
		$card.find('[data-name-pattern]').each(function () {
			const $field = $(this);
			const pattern = $field.data('name-pattern');
			if (pattern) {
				$field.attr('name', pattern.replace('__index__', index));
			}
			if (resetValues) {
				if ($field.is(':checkbox') || $field.is(':radio')) {
					$field.prop('checked', false);
				} else if (!$field.is('[type="hidden"]')) {
					$field.val('');
				}
			}
		});
	}

	function syncMemberBlocks(count) {
		const $container = $(selectors.membersContainer);
		if (!$container.length || !state.$memberTemplate) {
			return;
		}
		const $existing = $container.find(MEMBER_SELECTOR);
		const current = $existing.length;

		if (count > current) {
			for (let i = current + 1; i <= count; i += 1) {
				const $clone = state.$memberTemplate.clone(false, false);
				applyMemberIndex($clone, i, { reset: true });
				cacheFieldMetadata($clone);
				$container.append($clone);
			}
		} else if (count < current) {
			$existing.slice(count).remove();
		}

		$container.find(MEMBER_SELECTOR).each(function (idx) {
			applyMemberIndex($(this), idx + 1, { reset: false });
		});
	}

	function serializeMembers() {
		const members = [];
		$(MEMBER_SELECTOR).each(function () {
			const $card = $(this);
			members.push({
				first_name: $card.find('[name^="members"][name$="[first_name]"]').val() || '',
				last_name: $card.find('[name^="members"][name$="[last_name]"]').val() || '',
				email: $card.find('[name^="members"][name$="[email]"]').val() || '',
				phone: $card.find('[name^="members"][name$="[phone]"]').val() || '',
				role: $card.find('[name^="members"][name$="[role]"]').val() || '',
				company: $card.find('[name^="members"][name$="[company]"]').val() || '',
			});
		});
		return members;
	}

	function validateFiscalCode(value, country, type) {
		if (!value) {
			return true;
		}
		const normalized = value.toUpperCase().trim();
		const countryKey = (country || '').toLowerCase();
		if (type === 'privato' || type === 'libero_prof') {
			if (ITALY_VALUES.includes(countryKey)) {
				return IT_FISCAL_CODE_REGEX.test(normalized);
			}
			return GENERIC_FOREIGN_CODE_REGEX.test(normalized);
		}
		return true;
	}

	function validateVat(value, country) {
		if (!value) {
			return true;
		}
		const countryKey = (country || '').toLowerCase();
		if (ITALY_VALUES.includes(countryKey)) {
			return /^[A-Z0-9]{11}$/.test(value.replace(/\s+/g, '').toUpperCase());
		}
		return GENERIC_FOREIGN_VAT_REGEX.test(value.toUpperCase());
	}

	function showFieldError($field, message) {
		const $group = $field.closest('.cir-field');
		$group.find('.cir-field-error').remove();
		if (message) {
			$group
				.addClass('has-error')
				.append('<p class="cir-field-error">' + message + '</p>');
		}
	}

	function clearFieldError($field) {
		$field.closest('.cir-field').removeClass('has-error').find('.cir-field-error').remove();
	}

	function isFieldVisible($field) {
		if ($field.prop('disabled')) {
			return false;
		}
		if ($field.closest('.cir-hidden').length) {
			return false;
		}
		if ($field.is(':hidden') && !$field.is(':radio, :checkbox')) {
			return false;
		}
		return true;
	}

	function isValidEmail(value) {
		if (!value) {
			return true;
		}
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
	}

	function markFieldTouched($field) {
		$field.data('touched', true);
	}

	function shouldShowRequiredError($field) {
		return $field.data('touched') || state.formSubmitted;
	}

	function validateRequiredFields() {
	const $form = getForm();
	const invalidFields = [];
	const processedNames = new Set();

	const getWrapper = ($group) =>
		$group.closest('.cir-field, .cir-consent-block, .cir-radio-group');

	$form.find('[required]').each(function () {
		const $field = $(this);

		if (!isFieldVisible($field)) {
			return;
		}

		if ($field.is(':radio')) {
			const name = $field.attr('name');
			if (processedNames.has(name)) {
				return;
			}
			processedNames.add(name);
			const $group = $form.find(`[name="${name}"]`);
			const $wrapper = getWrapper($group);
			if (!$group.filter(':checked').length) {
				$wrapper.addClass('has-error');
				$wrapper.find('.cir-field-error').remove();
				$wrapper.append('<p class="cir-field-error">' + validationMessages.required + '</p>');
				invalidFields.push($wrapper);
			} else {
				$wrapper.removeClass('has-error').find('.cir-field-error').remove();
			}
			return;
		}

		if ($field.is(':checkbox')) {
			const name = $field.attr('name');
			if (processedNames.has(name)) {
				return;
			}
			processedNames.add(name);
			const $group = $form.find(`[name="${name}"]`);
			const $wrapper = getWrapper($group);
			if (!$group.filter(':checked').length) {
				$wrapper.addClass('has-error');
				$wrapper.find('.cir-field-error').remove();
				$wrapper.append('<p class="cir-field-error">' + validationMessages.required + '</p>');
				invalidFields.push($wrapper);
			} else {
				$wrapper.removeClass('has-error').find('.cir-field-error').remove();
			}
			return;
		}

		const value = ($field.val() || '').trim();
		if (!value) {
			showFieldError($field, validationMessages.required);
			invalidFields.push($field);
		} else {
			clearFieldError($field);
			if ($field.attr('type') === 'email' && !isValidEmail(value)) {
				showFieldError($field, validationMessages.email);
				invalidFields.push($field);
			}
		}
	});

	return invalidFields;
}

	function focusAndScrollTo($field) {
		if (!$field || !$field.length) {
			return;
		}
		$field.focus();
		const offsetTop = $field.offset().top - 120;
		$('html, body').animate({ scrollTop: offsetTop }, 400);
	}

	function handleFiscalCodeValidation() {
		const $field = $('#cir-fiscalcode');
		if (!$field.length || $field.is(':disabled')) {
			return;
		}
		const value = ($field.val() || '').trim();
		const country = $('select[name="country"]').val();
		const type = $('input[name="invoicing_type"]:checked').val() || state.currentInvoiceType;

		if (!value) {
			if ($field.prop('required') && shouldShowRequiredError($field)) {
				showFieldError($field, validationMessages.required);
			} else {
				clearFieldError($field);
			}
			return;
		}

		if (!validateFiscalCode(value, country, type)) {
			showFieldError($field, $field.data('error') || 'Formato non valido.');
		} else {
			clearFieldError($field);
		}
	}

	function handleVatValidation() {
		const $field = $('#cir-vat');
		if (!$field.length || $field.is(':disabled')) {
			return;
		}
		const value = ($field.val() || '').trim();
		const country = $('select[name="country"]').val();

		if (!value) {
			if ($field.prop('required') && shouldShowRequiredError($field)) {
				showFieldError($field, validationMessages.required);
			} else {
				clearFieldError($field);
			}
			return;
		}

		if (!validateVat(value, country)) {
			showFieldError($field, $field.data('error') || 'Partita IVA non valida.');
		} else {
			clearFieldError($field);
		}
	}

	function getAllowAutoEarlyBird() {
		const $field = $(selectors.allowAutoEarlyBird);
		if (!$field.length) {
			return true;
		}
		if ($field.is(':checkbox')) {
			return $field.is(':checked');
		}
		const value = ($field.val() || '').trim().toLowerCase();
		if (!value.length) {
			return true;
		}
		return value === '1' || value === 'true';
	}

	function maybeAutoApplyEarlyBird(totals) {
		if (
			!totals ||
			state.couponManuallyEdited ||
			state.autoEarlyBirdInjected ||
			!getAllowAutoEarlyBird()
		) {
		 return;
		}
		const $coupon = $(selectors.couponInput);
		if (
			$coupon.length &&
			totals.auto_applied &&
			totals.applied_code === 'EARLYBIRD' &&
			!$coupon.val()
		) {
			state.settingCouponProgrammatically = true;
			$coupon.val('EARLYBIRD');
			state.settingCouponProgrammatically = false;
			state.autoEarlyBirdInjected = true;
		}
	}

	function getCouponFeedbackEl() {
		return $(selectors.couponFeedback);
	}

	function updateTotalsDisplay(totals) {
		if (!totals) {
			return;
		}
		$('.cir-summary-amount').text(formatEuro(totals.amount_raw || 0));
		$('.cir-summary-discount').text('- ' + formatEuro(totals.discount_raw || 0));
		$('.cir-summary-tax').text(formatEuro(totals.tax_raw || 0));
		$('.cir-summary-total').text(formatEuro(totals.total_raw || 0));

		const $feedback = getCouponFeedbackEl();
		if ($feedback.length) {
			if (totals.coupon_message) {
				$feedback
					.text(totals.coupon_message)
					.removeClass('is-error is-success')
					.addClass(totals.coupon_error ? 'is-error' : 'is-success')
					.show();
			} else {
				$feedback.removeClass('is-error is-success').hide().text('');
			}
		}

		if (totals.coupon_error) {
			$(selectors.couponInput).addClass('has-error');
		} else {
			$(selectors.couponInput).removeClass('has-error');
		}

		maybeAutoApplyEarlyBird(totals);
	}

	function getEventDate() {
		const $form = getForm();
		if ($form && $form.length) {
			const dataValue = $form.data('event-date');
			if (dataValue) {
				return dataValue;
			}
			const inputValue = $form.find('input[name="event_date"]').val();
			if (inputValue) {
				return inputValue;
			}
		}
		return '';
	}
	
	function getCourseId() {
		const $form = getForm();
		return $form && $form.length ? $form.data('course-id') || '' : '';
	}
	function getRestFeeEndpoint() {
		const config = window.CIRForm || window.cirFrontend || {};
		if (config.restFeeEndpoint) {
			return String(config.restFeeEndpoint).replace(/\/$/, '');
		}
		if (config.restUrl) {
			return String(config.restUrl).replace(/\/$/, '') + '/fee';
		}
		return '';
	}

	function showSummaryLoading(visible) {
		const $loader = $(selectors.summaryLoading);
		if ($loader.length) {
			$loader.toggleClass('is-visible', !!visible);
		}
	}

	function fetchTotals(debounced = true) {
		const restEndpoint = getRestFeeEndpoint();
		if (!restEndpoint) {
			console.warn('CIR Frontend: endpoint REST non disponibile.');
			return;
		}

		if (debounced && state.couponTimer) {
			clearTimeout(state.couponTimer);
		}

		const schedule = () => {
		const $peopleInput = $(selectors.peopleInput);
		const people = clampPeople($peopleInput.val());
		let coupon = ($(selectors.couponInput).val() || '').trim().toUpperCase();
		const eventDate = getEventDate();
		const allowEarlyBird = getAllowAutoEarlyBird() ? 1 : 0;

		// Se il codice è stato iniettato automaticamente e l’utente non lo ha toccato,
		// non lo inviamo all’endpoint: lasciamo che l’Early Bird venga ricalcolato in automatico.
		if (state.autoEarlyBirdInjected && !state.couponManuallyEdited) {
			coupon = '';
		}

		const params = $.param({
			people,
			coupon_code: coupon,
			event_date: eventDate,
			invoice_type: state.currentInvoiceType,
			allow_auto_earlybird: allowEarlyBird,
			course_id: getCourseId(),
		});

			showSummaryLoading(true);

			$.ajax({
				url: `${restEndpoint}?${params}`,
				method: 'GET',
				dataType: 'json',
			})
				.done((response) => {
					updateTotalsDisplay(response);
				})
				.fail(() => {
					const $feedback = getCouponFeedbackEl();
					if ($feedback.length) {
						$feedback
							.text('Impossibile calcolare il totale. Riprova.')
							.removeClass('is-success')
							.addClass('is-error')
							.show();
					}
				})
				.always(() => {
					showSummaryLoading(false);
				});
		};

		if (debounced) {
			state.couponTimer = setTimeout(schedule, 400);
		} else {
			schedule();
		}
	}

	function initCouponField() {
		const $coupon = $(selectors.couponInput);
		if (!$coupon.length) {
			return;
		}

		$coupon.on('input', function () {
		    const upper = this.value.toUpperCase();
		    if (this.value !== upper) {
		        this.value = upper;
		    }

		    if (!state.settingCouponProgrammatically) {
		        state.couponManuallyEdited = upper.trim().length > 0;
		        if (state.couponManuallyEdited && upper !== 'EARLYBIRD') {
		            state.autoEarlyBirdInjected = false;
		            $('#allow_auto_earlybird').val('0'); // niente Early Bird automatico
		        }
		        if (!state.couponManuallyEdited) {
		            state.autoEarlyBirdInjected = false;
		            $('#allow_auto_earlybird').val('1');
		        }
		    }

		    fetchTotals();
		});

		$(selectors.couponApply).on('click', function (e) {
			e.preventDefault();
			state.couponManuallyEdited = ($(selectors.couponInput).val() || '').trim().length > 0;
			fetchTotals(false);
		});
	}

	function initPeopleField() {
		const $input = $(selectors.peopleInput);
		if (!$input.length) {
			return;
		}

		const commitPeople = (value) => {
			const people = clampPeople(value);
			$input.val(people);
			state.people = people;
			syncMemberBlocks(people);
			fetchTotals(false);
		};

		// stato iniziale
		commitPeople($input.val());

		// durante la digitazione non forziamo il valore
		$input.on('input', () => {
			const raw = $input.val();

			// permettiamo di cancellare tutto per digitare da zero
			if (raw === '') {
				return;
			}

			const parsed = parseInt(raw, 10);
			if (!Number.isNaN(parsed)) {
				state.people = clampPeople(parsed);
			}
		});

		// quando l'utente conferma (blur/change) allora clampiamo
		$input.on('blur change', () => {
			const raw = $input.val();
			if (raw === '') {
				commitPeople(1);
				return;
			}
			commitPeople(raw);
		});
	}

	function initInvoiceTypeField() {
		const $radios = $('input[name="invoicing_type"]');
		if (!$radios.length) {
			return;
		}
		$radios.on('change', function () {
			toggleBillingFields($(this).val());
		});
		const initial = $radios.filter(':checked').val() || 'privato';
		toggleBillingFields(initial);
	}

	function initAutoEarlyBirdToggle() {
		const $field = $(selectors.allowAutoEarlyBird);
		if (!$field.length) {
			return;
		}

		const handler = () => {
			const allow = getAllowAutoEarlyBird();
			if (!allow && state.autoEarlyBirdInjected) {
				const $coupon = $(selectors.couponInput);
				state.settingCouponProgrammatically = true;
				$coupon.val('');
				state.settingCouponProgrammatically = false;
				state.autoEarlyBirdInjected = false;
				state.couponManuallyEdited = false;
			}
			fetchTotals(false);
		};

		if ($field.is(':checkbox')) {
			$field.on('change', handler);
		} else {
			$field.on('input change', handler);
		}
	}

	function initFattElettronicaWatcher() {
		$('input[name="fatt_elettronica"]').on('change', () => {
			refreshDynamicSections();
			applyPecRequirement();
		});
	}

	function initCountryField() {
		$('select[name="country"]').on('change', function () {
			handleFiscalCodeValidation();
			handleVatValidation();
		});
	}

	function initValidations() {
		const $cf = $('#cir-fiscalcode');
		const $vat = $('#cir-vat');

		if ($cf.length) {
			$cf.on('blur', function () {
				markFieldTouched($cf);
				handleFiscalCodeValidation();
			});
			$cf.on('input', function () {
				markFieldTouched($cf);
				handleFiscalCodeValidation();
			});
		}

		if ($vat.length) {
			$vat.on('blur', function () {
				markFieldTouched($vat);
				handleVatValidation();
			});
			$vat.on('input', function () {
				markFieldTouched($vat);
				handleVatValidation();
			});
		}

		getForm().on('input change', '[required]', function () {
			const $field = $(this);
			if ($field.is(':radio') || $field.is(':checkbox')) {
				const name = $field.attr('name');
				const $group = $(`[name="${name}"]`);
				if ($group.filter(':checked').length) {
					clearFieldError($group.last());
				}
			} else if (($field.val() || '').trim().length) {
				clearFieldError($field);
			}
		});
	}

	function initLearnAbout() {
		const $select = $('#learn_about_event');
		const $other = $('#learn_about_event_other');
		if (!$select.length || !$other.length) {
			return;
		}
		const toggleOther = () => {
		 if ($select.val() === 'altro') {
				$other.closest('.cir-field').removeClass('cir-hidden');
			} else {
				$other.closest('.cir-field').addClass('cir-hidden');
				$other.val('');
			}
		};
		$select.on('change', toggleOther);
		toggleOther();
	}

	function initConsentMirroring() {
		const mirrors = [
			{ master: '#consent_privacy', field: 'member_consent_privacy[]' },
			{ master: '#consent_marketing', field: 'member_consent_marketing[]' },
		];

		mirrors.forEach(function (mirror) {
			const $master = $(mirror.master);
			if (!$master.length) {
				return;
			}
			const sync = function () {
				const checked = $master.is(':checked');
				$(MEMBER_SELECTOR).each(function () {
					$(this).find('[name="' + mirror.field + '"]').prop('checked', checked);
				});
			};
			sync();
			$master.on('change', sync);
		});

		$('#consent_av').on('change', function () {
			const value = $(this).val();
			$(MEMBER_SELECTOR).each(function () {
				$(this)
					.find('[name^="member_consent_av"]')
					.filter('[value="' + value + '"]')
					.prop('checked', true);
			});
		});
	}

	function initFormSubmission() {
	const $form = getForm();
	if (!$form || !$form.length) {
		return;
	}

	$form.on('keydown', function (event) {
		if (event.key === 'Escape') {
			event.preventDefault();
		}
	});

	$form.on('submit', function (event) {
		if (state.formLocked) {
			event.preventDefault();
			return false;
		}
		state.formSubmitted = true;

		const membersJSON = JSON.stringify(serializeMembers());
		$('#cir_members_json').val(membersJSON);

		const invalidRequired = validateRequiredFields();
		handleFiscalCodeValidation();
		handleVatValidation();

		const otherErrors = $form.find('.has-error');
		if (invalidRequired.length || otherErrors.length) {
			event.preventDefault();
			state.formLocked = false;
			$form.find('button[type="submit"]').prop('disabled', false).removeClass('is-disabled');

			const focusTarget =
				invalidRequired[0] || otherErrors.first().find('input, select, textarea').first();
			focusAndScrollTo(focusTarget);
			return false;
		}

		state.formLocked = true;
		$form.find('button[type="submit"]').prop('disabled', true).addClass('is-disabled');

		return true;
	});
}

	function init() {
		cacheFieldMetadata();
		prepareMemberTemplate();
		initPeopleField();
		initCouponField();
		initInvoiceTypeField();
		initAutoEarlyBirdToggle();
		initFattElettronicaWatcher();
		initCountryField();
		initValidations();
		initLearnAbout();
		initConsentMirroring();
		initFormSubmission();
		fetchTotals(false);
	}

	$(document).ready(init);
})(jQuery);