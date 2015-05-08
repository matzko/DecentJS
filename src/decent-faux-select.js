(function(scope) {
if ('undefined' != typeof scope.DecentJS) {
DecentJS.core.prototype.fauxSelect = function(options) {
	options = options || {};
	if (options.comboBox && ('undefined' == typeof DecentJS.core.prototype.autocomplete)) {
		options.comboBox = false;
	} else {
		options.comboBox = !! options.comboBox;
	}
	var decent = DecentJS, djs = this,
	create = function(t) { return djs.doc.createElement(t)},
	selectWrapper = create('div'),
	fauxSelectionIndicator = ((options.comboBox && options.inputCallback) ? create('input') : create('span')),
	fauxSelect = create('ul'),
	subject = djs.actionSubject,

	/**
	 * Fire an event on the original select elemnt.
	 *
	 * Adapted from <http://stackoverflow.com/questions/2381572/how-can-i-trigger-a-javascript-event-click>
	 *
	 * @param [DOMElement] el        The DOM element on which to fire the event.
	 * @param [String]     eventName The name of the event to fire.
	 */
	fireEvent = function(el, eventName) {
		var doc, event, eventClass = "HTMLEvents";
		// Make sure we use the ownerDocument from the provided node to avoid cross-window problems
		if (el.ownerDocument) {
			doc = el.ownerDocument;
		} else if (el.nodeType == 9){
			doc = node;
		}

		if (el.dispatchEvent) {
			switch (eventName) {
				case "click":
				case "mousedown":
				case "mouseup":
					eventClass = "MouseEvents";
					break;
			}
			event = doc.createEvent(eventClass);

			event.initEvent(eventName, (eventName != "change"), true); // All events created as bubbling and cancelable.

			// allow detection of synthetic events
			event.synthetic = true;
			event.syntheticSource = 'decent-faux-select';
			el.dispatchEvent(event, true);

		// IE
		} else if (el.fireEvent) {
			event = doc.createEventObject();

			// allow detection of synthetic events
			event.synthetic = true;
			event.syntheticSource = 'decent-faux-select';
			el.fireEvent("on" + eventName, event);
		}
	},

	/**
	 * Callback for significant keydown events on the faux select.
	 *
	 * @param [Event]      e      The DOM element keydown event.
	 * @param [DOMElement] select The faux select element.
	 */
	actOnKeydownEvents = function(e, select) {
		var newlySelectedIndex = -1,
		/**
		 * Select an option based on the next matching first character.
		 *
		 * @param [String] character The character.
		 *
		 * @return [boolean] Whether an options was successfully selected.
		 */
		selectAccordingToContent = function(character) {
			if (!options.comboBox) {
				var totalOptions = select.fauxOptions.length,
				startPoint = -1 < select.fauxFocusedOption && totalOptions > (select.fauxFocusedOption + 1) ?
					select.fauxFocusedOption + 1 : 0,
				i, matched = false,

				maybeSelectOption = function(i) {
					var firstChar;
					if (select.fauxOptions[i] && select.fauxOptions[i].innerHTML) {
						firstChar = select.fauxOptions[i].innerHTML.substr(0,1);
						if (firstChar.toLowerCase() == character.toLowerCase()) {
							focusOnOption(select, i);
							matched = true;
						}
					}
					return matched;
				};
				for (i = startPoint; i < totalOptions; i++) {
					if (maybeSelectOption(i)) {
						break;
					}
				}
				if (!matched) {
					for (i = 0; i < startPoint; i++) {
						if (maybeSelectOption(i)) {
							break;
						}
					}
				}
				return matched;
			}
		},

		/**
		 * Select either up or down, where "up" means +1 and "down" means -1
		 *
		 * @param [integer] direction The direction to make the selection.
		 */
		selectAccordingToDirection = function(direction) {
			if (-1 < select.fauxFocusedOption && select.fauxOptions[select.fauxFocusedOption + direction]) {
				newlySelectedIndex = (select.fauxFocusedOption + direction) % select.fauxOptions.length;
			} else {
				newlySelectedIndex = 0 < direction ? 0 : select.fauxOptions.length - 1;
			}
			if (select.fauxOptions[newlySelectedIndex]) {
				focusOnOption(select, newlySelectedIndex);
			}
		};

		if (
			// if a number
			(e.keyCode >= 48 && e.keyCode <= 557) ||
			// if a letter
			(e.keyCode >= 65 && e.keyCode <= 90)
		) {
			if (selectAccordingToContent(String.fromCharCode(e.keyCode))) {
				decent.stopDefault(e);
			}
		} else if (!options.comboBox || select.fauxOpened) {
			switch(e.keyCode) {

				// up arrow
				case 38 :
					selectAccordingToDirection(-1);
					decent.stopDefault(e);
					break;

				// down arrow
				case 40 :
					selectAccordingToDirection(1);
					decent.stopDefault(e);
					break;

				// enter
				case 13 :
					decent.stopDefault(e);
					select.fauxOpen(false);
					break;

				// tab
				case 9 :
					select.fauxOpen(false);
					select.fauxFocus(false);
					break;
			}
		}
	},

	/**
	 * Focus on the option corresponding to the given index.
	 *
	 * @param [DOMElement] select      The faux select element.
	 * @param [integer]    optionIndex The index of the option on which to focus.
	 */
	focusOnOption = function(select, optionIndex) {
		if (select.fauxOptions[optionIndex]) {
			var i = select.fauxSelectedOptions.length,
			amongSelected = false,
			origValue;

			// allow a callback to affect the focusing
			if (!options.preFocusOptionCallback || options.preFocusOptionCallback.call(this, select, optionIndex)) {
				// if the focused-on faux option is not among the
				// already-selected options, then we will select
				// and trigger a change event.
				while(i--) {
					if (select.fauxSelectedOptions[i] == optionIndex) {
						amongSelected = true;
						break;
					}
				}
				if (!amongSelected) {
					if (!select.fauxMultiSelect) {
						select.fauxSelectedOptions = [];
						i = select.fauxOptions.length;
						while(i--) {
							if (i != optionIndex) {
								select.fauxOptions[i].fauxSelected = false;
								decent.removeClass(select.fauxOptions[i], 'faux-selected');
							}
						}
						if (select.fauxOptions[optionIndex].fauxOriginal) {
							origValue = select.fauxOriginal.value;
							select.fauxOriginal.value = select.fauxOptions[optionIndex].fauxOriginal.value;
							if (origValue != select.fauxOriginal.value) {
								fireEvent(select.fauxOriginal, 'change');
							}
						}
					}
					select.fauxFocusedOption = optionIndex;
					select.fauxOptions[optionIndex].fauxSelected = true;
					select.fauxOptions[optionIndex].fauxOriginal.selected = true;
					select.fauxShowSelection(select.fauxOptions[optionIndex].innerHTML);
					decent.addClass(select.fauxOptions[optionIndex],'faux-selected');
					select.fauxSelectedOptions[select.fauxSelectedOptions.length] = optionIndex;
				}
			}
		}
	},

	/**
	 * Initialize the faux select element,
	 * giving it default attributes and properties.
	 *
	 * @param [DOMElement] select     The faux select element.
	 * @param [DOMElement] origSelect The actual select element that is being imitated.
	 */
	initializeSelect = function(select, origSelect) {
		if (origSelect.id) {
			select.id = 'faux-select-' + origSelect.id;
		}
		select.fauxOriginal = origSelect;
		select.fauxMultiSelect = ('select-multiple' == (origSelect.type + ''));
		select.fauxOptions = [];
		select.fauxFocusedOption = -1;
		select.fauxSelectedOptions = [];

		select.fauxFocused = false;
		select.fauxFocus = function(doFocus) {
			if (doFocus) {
				decent.removeClass(select, 'faux-unfocused');
				decent.addClass(select, 'faux-focused');
				select.fauxFocused = true;
			} else {
				decent.removeClass(select, 'faux-focused');
				decent.addClass(select, 'faux-unfocused');
				select.fauxFocused = false;
			}
		}

		select.fauxOpened = false;
		select.fauxOpen = function(doOpen) {
			if (doOpen) {
				decent.removeClass(select, 'faux-unopened');
				decent.addClass(select, 'faux-opened');
				decent.removeClass(selectWrapper, 'faux-contents-unopened');
				decent.addClass(selectWrapper, 'faux-contents-opened');
				if (options.comboBox) {
					selectWrapper.style.zIndex = 100;
				}
				select.fauxOpened = true;
			} else {
				decent.removeClass(select, 'faux-opened');
				decent.addClass(select, 'faux-unopened');
				decent.removeClass(selectWrapper, 'faux-contents-opened');
				decent.addClass(selectWrapper, 'faux-contents-unopened');
				if (options.comboBox) {
					selectWrapper.style.zIndex = 90;
				}
				select.fauxOpened = false;
			}
		}
		/**
		 * Show the given value as the selected text value.
		 *
		 * @param [string] selectedValue The value to show as the selected value.
		 */
		select.fauxShowSelection = function(selectedValue) {
			if (options.comboBox) {
				fauxSelectionIndicator.value = selectedValue;
			} else {
				fauxSelectionIndicator.innerHTML = selectedValue;
			}
		}
		decent.addClass(select, 'faux-select faux-unopened faux-unfocused');
		decent.addClass(origSelect, 'faux-select-original');

		decent.attachListener(djs.doc, 'mousedown', function(e) {
			var onWrapper = false,
			target = decent.getEventTarget(e);
			do {
				if (target && target == selectWrapper) {
					onWrapper = true;
					break;
				}
				target = target.parentNode;
			} while(target && target != djs.doc);
			if (!onWrapper) {
				select.fauxFocus(false);
				select.fauxOpen(false);
			}
		});

		decent.attachListener(selectWrapper, 'mousedown', (function(select) {
			return function(e) {
				var target, originalTarget,
				i = select.fauxOptions.length,
				okToChangeState = true,
				doActOnOpening = false,
				preventDefaultEventBehavior = true;

				// don't do anything if the real select is disabled
				if (subject && subject.disabled) {
					okToChangeState = false;
				} else {
					if (select.fauxOpened) {
						doActOnOpening = true;
						originalTarget = target = decent.getEventTarget(e);

						// get ancestor that's a faux option
						while(target && target.parentNode && !decent.hasClass(target, 'faux-option')) {
							target = target.parentNode;
						}
						if (decent.hasClass(target, 'faux-option')) {
							while(i--) {
								if (target == select.fauxOptions[i]) {
									focusOnOption(select, i);
									break;
								}
							}
						}
						// Don't change the state if we're just clicking on the scrollbar of the list.
						if (originalTarget && decent.hasClass(originalTarget, 'faux-select')) {
							okToChangeState = false;
						}
					} else if (okToChangeState && options.comboBox && (target = decent.getEventTarget(e)) && decent.hasClass(target, 'faux-selection-arrow')) {
						doActOnOpening = true;
					}
					if (target && ('INPUT' == target.nodeName) && decent.hasClass(target, 'faux-selection-indicator')) {
						preventDefaultEventBehavior = false;
					}
					if (preventDefaultEventBehavior) {
						decent.stopDefault(e);
					}
					if (okToChangeState) {
						if (doActOnOpening || !options.comboBox || select.fauxOpened) {
							select.fauxOpen(!select.fauxOpened);
						}
					}
					select.fauxFocus(true);
				}
			};
		})(select));

		decent.attachListener(selectWrapper, 'focus', function(e) {
			select.fauxFocus(true);
		});
		decent.attachListener(selectWrapper, 'blur', function(e) {
			select.fauxFocus(false);
			select.fauxOpen(false);
		});
		decent.attachListener(djs.doc, 'keydown', function(e) {
			if (select.fauxFocused) {
				select.fauxFocus(true);
				return actOnKeydownEvents(e, select);
			}
		});
		decent.attachListener(subject, 'change', function(evt) {
			if (!evt.syntheticSource || ('decent-faux-select' != evt.syntheticSource)) {
				if ('undefined' != typeof subject.selectedIndex) {
					focusOnOption(select, subject.selectedIndex);
				}
			}
		});
	},

	init = function() {
		var i, option,
		opts = subject.getElementsByTagName('option'),
		arrowHolder;

		initializeSelect(fauxSelect, subject);

		for(i = 0; i < opts.length; i++) {
			option = create('li');
			option.setAttribute('data-value', opts[i].value);
			option.innerHTML = opts[i].innerHTML;
			option.className = opts[i].className ? opts[i].className : '';
			option.fauxOriginal = opts[i];
			decent.addClass(option, 'faux-option');
			if (opts[i].id) {
				option.id = 'faux-option-' + opts[i].id;
			}
			decent.addClass(option, 'faux-option');
			fauxSelect.appendChild(option);
			fauxSelect.fauxOptions[i] = option;
			if (opts[i].selected) {
				fauxSelect.fauxFocusedOption = i;
			}
		}
		i = 0 < fauxSelect.fauxFocusedOption ? fauxSelect.fauxFocusedOption : 0;
		fauxSelect.fauxShowSelection(fauxSelect.fauxOptions[i] ? fauxSelect.fauxOptions[i].innerHTML : '');
		decent.addClass(selectWrapper, 'faux-select-wrapper');
		if (subject.getAttribute('tabindex')) {
			selectWrapper.setAttribute('tabindex', subject.getAttribute('tabindex'));
		} else {
			selectWrapper.setAttribute('tabindex', 0);
		}
		decent.addClass(fauxSelectionIndicator, 'faux-selection-indicator');
		selectWrapper.appendChild(fauxSelect);
		selectWrapper.appendChild(fauxSelectionIndicator);
		subject.parentNode.insertBefore(selectWrapper, subject);
		subject.parentNode.insertBefore(subject, selectWrapper);

		if (options.comboBox && options.inputCallback) {
			arrowHolder = djs.doc.createElement('span');
			arrowHolder.className = 'faux-selection-arrow';
			arrowHolder.style.zIndex = 220;
			decent.addClass(selectWrapper, 'faux-combo-box');
			selectWrapper.appendChild(arrowHolder);
			decent.attachListener(fauxSelectionIndicator, 'click', function(ev) {
				this.focus();
			});
			decent(fauxSelectionIndicator).autocomplete((function(callback, djs) {
				return function(inputValue, outputCallback) {
					return callback.call(djs, inputValue, outputCallback, this);
				};
			})(options.inputCallback, djs), {ghostFill:false});
		}
	};

	// Don't double-up the faux selections, if called multiple times for the same subject.
	if (subject && !decent.hasClass(subject, 'faux-select-original')) {
		init();
	}
}
}
})(this);
