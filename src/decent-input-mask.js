/**
 * A container for holding the input and mask.
 *
 * @param [DOMElement] subject The input to be contained.
 * @param [DecentMask] mask    The mask to associate with the container.
 */
var DecentInputMaskContainer = function(subject, mask) {
	this._id = 'mask_container_' + (Math.floor((Math.random() * 100) + 1)) + new Date().getTime();
	this._subject = subject;
	this._mask = mask || (new DecentMask(
		new RegExp('', 'g'),
		'',
		null
	));
	this._state = new DecentInputMaskState(subject.value, 0);
};
DecentInputMaskContainer.prototype = {
	/**
	 * Get the Id of the container.
	 *
	 * @return [String]
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Get the subject of the container.
	 *
	 * @return [DOMElement]
	 */
	getSubject:function() {
		return this._subject;
	},

	/**
	 * Set the mask for the container.
	 *
	 * @param [DecentMask] mask
	 */
	setMask:function(mask) {
		this._mask = mask;
		return this;
	},

	/**
	 * Get the mask for the container.
	 *
	 * @return [DecentMask]
	 */
	getMask:function() {
		return this._mask;
	},

	/**
	 * Get the last set state.
	 *
	 * @return [DecentInputMaskState]
	 */
	getLastSetState:function() {
		return this._state;
	},

	/**
	 * Set the current subject's state.
	 *
	 * @param [DecentInputMaskState] state
	 */
	setSubjectState:function(state) {
		this._state = state;
		this.getSubject().value = state.getTextValue();
		if (null !== state.getCursorPosition()) {
			DecentInputMaskManager.positionCursor(this.getSubject(), state.getCursorPosition());
		}
	},

	/**
	 * Get the current actual subject state.
	 *
	 * @return [DecentInputMaskState]
	 */
	getSubjectState:function() {
		return new DecentInputMaskState(this.getSubject().value, DecentInputMaskManager.determineCursorPosition(this.getSubject()));
	}
};

/**
 * The handler of input masks.
 */
var DecentInputMaskManager = (function() {
	/**
	 * @var [DOMElement] The document element.
	 */
	var d = document,

	/**
	 * @var [Object] The window object.
	 */
	w = window,

	/**
	 * Attach DOM event listeners to the given DOM element subject of the container.
	 *
	 * @param [DecentInputMaskContainer] container The container in question.
	 */
	attachDomEventListeners = function(container) {
		attachListener(container.getSubject(), 'keyup', (function(container) {
			return function(event) {
				whenKeyRises(event, container);
			};
		})(container));
		attachListener(container.getSubject(), 'paste', (function(container) {
			return function(event) {
				whenPasting(event, container);
			};
		})(container));
	},

	/**
	 * Attach a DOM event listener to a DOM element.
	 *
	 * @param [DOMElement] obj  The DOM element
	 * @param [String]     type The type of event to listen for.
	 * @param [Function]   fn   The callback to be fired upon the event's occurring.
	 */
	attachListener = function(obj, type, fn) {
		if (obj.addEventListener) {
			obj.addEventListener(type, fn, false);
		} else if (obj.attachEvent) {
			obj.attachEvent('on' + type, function() { return fn.call(obj, w.event);});
		}
	},

	/**
	 * Build a phone mask for the given input element and mask.
	 *
	 * @param [DOMElement] input The DOM element for which to build the mask.
	 * @param [DecentMask] mask  The mask to use for the element.
	 *
	 * @return [DecentInputMaskContainer]
	 */
	buildPhoneMask = function(input, mask) {
		var container = findContainerByElement(input);
		if (container) {
			container.setMask(mask);
		} else {
			container = new DecentInputMaskContainer(input, mask);
			containers[container.getId()] = container;
			attachDomEventListeners(container);
		}
		return container;
	},

	/**
	 * Determine the masked state from the given state.
	 *
	 * @param [DecentInputMaskState] state The state from which to determine the masked state.
	 * @param [DecentMask]           mask  The mask to use in determining the state.
	 *
	 * @return [DecentInputMaskState] The state as it should be, masked.
	 */
	determineMaskedState = function(state, mask) {
		var currentText = state.getTextValue(),
		currentPos = state.getCursorPosition(),
		maskedText,
		subText = currentText.substr(0, currentPos),
		diff = subText.length - mask.applyMask(mask.filter(subText), true).length,
		newPosition = currentPos - diff;

		maskedText = mask.applyMask(mask.filter(currentText));
		if (0 > newPosition) {
			newPosition = 0;
		} else if (newPosition > maskedText.length) {
			newPosition = maskedText.length;
		}
		return new DecentInputMaskState(maskedText, newPosition);
	},

	/**
	 * Act on any change in state of the given container.
	 *
	 * @param [DecentInputMaskContainer] container
	 */
	handleStateChange = function(container) {
		var priorState = container.getLastSetState(),
		currentState = container.getSubjectState(),
		newState;
		if (priorState.differs(currentState)) {
			newState = determineMaskedState(currentState, container.getMask());
			if (newState.differs(currentState)) {
				container.setSubjectState(newState);
			}
		}
	},

	/**
	 * Find a container by input element.
	 *
	 * @param [DOMElement] subject The input element.
	 *
	 * @return [DecentInputMaskContainer]
	 */
	findContainerByElement = function(subject) {
		for (var i in containers) {
			if (containers[i].getSubject() == subject) {
				return containers[i];
			}
		}
		return null;
	},

	/**
	 * Get the cursor position for the given element.
	 *
	 * @param [DOMElement] input The input for which we are going to get the cursor position.
	 *
	 * @return [Integer] The cursor position.
	 */
	determineCursorPosition = function(input) {
		var pos = 0, selection;
		if (input.selectionStart || input.selectionStart == '0') {
			pos = input.selectionStart;
		} else if (d.selection) {
			input.focus();
			selection = d.selection.createRange();
			selection.moveStart('character', -input.value.length);
			pos = selection.text.length;
		}
		return pos;
	},

	/**
	 * Position the cursor in the subject.
	 *
	 * @param [DOMElement] input The input in which to position the cursor.
	 * @param [Integer]    pos   The position at which to position the cursor.
	 */
	positionCursor = function(input, pos) {
		var range;
		if (input) {
			input.value = input.value;

			if (input.createTextRange) {
				range = input.createTextRange();
				range.move('character', pos);
				range.select();
			} else {
				if ('undefined' != typeof input.selectionStart) {
					input.focus();
					input.setSelectionRange(pos, pos);
				} else {
					input.focus();
				}
			}
		}
	},

	/**
	 * Set a mask for all containers.
	 *
	 * @param [DecentMask] mask   The mask to set for all containers.
	 * @param [Function]   filter Optional.  A callback applied to each container which when returning true sets the given mask to that container.
	 *
	 * @return [Array<DecentInputMaskContainer>] The containers for which the masks were set.
	 */
	setMaskForContainers = function(mask, filter) {
		filter = filter || function() { return true; };
		var i, processed = [];
		for (i in containers) {
			if (filter.call(mask, containers[i])) {
				containers[i].setMask(mask);
				processed[processed.length] = containers[i];
			}
		}
		return processed;
	},

	/**
	 * Get the null mask.
	 *
	 * @return [DecentMask]
	 */
	getNullMask = (function() {
		var nullMask = null;
		return function() {
			if (null === nullMask) {
				nullMask = new DecentMask(
					new RegExp('', 'g'),
					'',
					null
				);
			}
			return nullMask;
		};
	})(),

	/**
	 * Get the U.S. phone number mask.
	 *
	 * @return [DecentMask]
	 */
	getUsPhoneMask = (function() {
		var usPhoneMask = null;
		return function() {
			if (null === usPhoneMask) {
				usPhoneMask = new DecentMask(
					new RegExp('[^0-9]', 'g'),
					'',
					'(###) ###-####'
				);
			}
			return usPhoneMask;
		};
	})(),

	/**
	 * The callback for the scenario in which a key on the subject goes up.
	 *
	 * @param [Event] event The JavaScript event.
	 * @param [DecentInputMaskContainer] container The container in question.
	 */
	whenKeyRises = function(event, container) {
		handleStateChange(container);
	},

	/**
	 * The callback for the scenario in which someone pastes content.
	 *
	 * @param [Event] event The JavaScript event.
	 * @param [DecentInputMaskContainer] container The container in question.
	 */
	whenPasting = function(event, container) {
		(function(container) {
			setTimeout(function() {
				handleStateChange(container);
			}, 2);
		})(container);
	},

	/**
	 * @var [Object<String:DecentInputMaskContainer>]
	 */
	containers = {};

	return {
		buildPhoneMask:buildPhoneMask,
		determineCursorPosition:determineCursorPosition,
		determineMaskedState:determineMaskedState,
		findContainerByElement:findContainerByElement,
		getNullMask:getNullMask,
		getUsPhoneMask:getUsPhoneMask,
		handleStateChange:handleStateChange,
		positionCursor:positionCursor,
		setMaskForContainers:setMaskForContainers,
		whenKeyRises:whenKeyRises
	};
})();
/**
 * A state representing the input.
 *
 * @param [String]  textValue      The text value of the state.
 * @param [Integer] cursorPosition The position of the cursor.
 */
var DecentInputMaskState = function(textValue, cursorPosition) {
	this._textValue = textValue + '';
	this._cursorPosition = 'undefined' == typeof cursorPosition ? null : parseInt(cursorPosition, 10);
};
DecentInputMaskState.prototype = {
	/**
	 * Determine whether the states differ.
	 *
	 * @param [DecentInputMaskState] other The other state to compare.
	 *
	 * @return [Boolean] Whether the other state differs with this one.
	 */
	differs:function(other) {
		return (this.getTextValue() != other.getTextValue());
	},

	/**
	 * Get the cursor position of the state.
	 *
	 * @return [Integer]
	 */
	getCursorPosition:function() {
		return this._cursorPosition;
	},

	/**
	 * Get the text value of the state.
	 *
	 * @return [String] The text value of the state.
	 */
	getTextValue:function() {
		return this._textValue;
	}
};

/**
 * The mask constructor.
 *
 * @param [RegExp] filterMatcher  The regular expression to be used in filtering the subject content.
 * @param [String] filterReplacer The string identifying what should be used to replace the matched filter content.
 * @param [RegExp] mask           The regular expression to be used in placing the subject content within the mask text.
 */
function DecentMask(filterMatcher, filterReplacer, mask) {
	this._contentCharPosition = 0;
	this._filterMatcher = filterMatcher;
	this._filterReplacer = filterReplacer;
	this._mask = mask;
}
DecentMask.prototype = {
	/**
	 * Set the position of the last content (non-mask) character.
	 *
	 * @param [Integer] pos
	 */
	setLastContentPosition: function(pos) {
		this._contentCharPosition = parseInt(pos, 10);
		return this;
	},

	/**
	 * Get the position of the last content (non-mask) character.
	 *
	 * @return [Integer]
	 */
	getLastContentPosition: function() {
		return this._contentCharPosition;
	},

	/**
	 * Apply the mask to the given content.
	 *
	 * @param [String]  content  The content to which we will apply the mask.
	 * @param [Boolean] truncate Optional: default -false- Whether to stop the mask at the end of the content instead of returning the entire mask.
	 *
	 * @return [String] The masked content.
	 */
	applyMask: function(content, truncate) {
		truncate = !! truncate;
		var mask = this._mask ? this._mask : '',
		value = ((mask && mask.length) ? '' : content),
		text = content + '';
		// don't let the text be any longer than that allowed by the mask
		if (-1 < mask.indexOf('#')) {
			text = text.substr(0, mask.replace(new RegExp('[^#]', 'g'), '').length);
		}
		while(mask.length) {
			if ('#' == mask.substr(0,1)) {
				if (text.length) {
					value += text.substr(0,1);
					text = text.substr(1);
				} else {
					value += ' ';
				}
			} else {
				value += mask.substr(0,1);
			}
			mask = mask.substr(1);
			if (truncate && 1 > text.length) {
				return value;
			}
		}
		return value;
	},

	/**
	 * Filter the text.
	 *
	 * @param [String] text The text to filter.
	 *
	 * @return [String] The text with all disallowed characters filtered out of it.
	 */
	filter: function(text) {
		return (text + '').replace(this._filterMatcher, this._filterReplacer);
	},

	/**
	 * Apply the mask to the given content and return the masked content.
	 *
	 * @param [String]  inputText      The text to filter and mask.
	 *
	 * @return [String] The masked content.
	 */
	mask: function(inputText) {
		return this.applyMask(this.filter(inputText));
	}
}
