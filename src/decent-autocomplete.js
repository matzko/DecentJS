(function(scope) {
if ('undefined' != typeof scope.DecentJS) {
DecentJS.core.prototype.autocomplete = function(callback,options) {
	options = options || {};
	var d = DecentJS, djs = this, i, container,
	create = function(t) { return djs.doc.createElement(t)},
	ghost = create('input'),
	ghostMatch = 0,
	subject = djs.actionSubject,
	/**
	 * Set the value for the subject.
	 *
	 * @param [Object] value The value to set.
	 */
	setSubjectValue = function(value) {
		if (subject) {
			subject.value = value;
			subject.setAttribute('data-autocomplete-value', value);
			if (subject.contentEditable) {
				subject.innerHTML = value;
			}
		}
	},

	/**
	 * Get the value for the subject.
	 *
	 * @return [Object] The value of the subject.
	 */
	getSubjectValue = function() {
		var theValue = '';
		if (subject) {
			if (subject.value) {
				theValue = subject.value;
			} else if (subject.getAttribute('data-autocomplete-value')) {
				theValue = subject.getAttribute('data-autocomplete-value');
			}
			if (!theValue && subject.contentEditable && subject.innerHTML) {
				theValue = subject.innerHTML + '';
			}
		}
		return theValue;
	},

	subjectText = getSubjectValue(),
	originalText = null,
	generatedText = null,
	lastKeyPressed,
	selections = [],
	selectionLinks = {},
	activeSelection = 0,
	canFetchList = true,
	requestCache = {},
	requestListData = function(subject, callback) {
		callback.call(djs, getSubjectValue(),
			(function(queryText) {
				return function(data) {
					setListData(queryText, data);
					if (queryText.length >= coreOptions['minChars']) {
						buildMatchingListFromData(queryText, data);
					}
				}
			})(getSubjectValue())
		);
	},
	listIsHidden = false,
	hideList = function() {
		list.style.display = 'none';
		listIsHidden = true;
		if (subject && subject.parentNode) {
			subject.parentNode.style.zIndex = 90;
		}
	},
	showList = function() {
		list.style.display = 'block';
		listIsHidden = false;
		if (subject && subject.parentNode) {
			subject.parentNode.style.zIndex = 100;
		}
	},
	list = create('ul'),
	listData = {},

	/**
	 * Sort the giving selection items.  -this- contains the relevant search term to consider.
	 *
	 * @param [SelectionItem] a One item to compare.
	 * @param [SelectionItem] b Another item to compare.
	 *
	 * @return [integer] The sorting result: -1 if a should be first; 1 if b; 0 if equal.
	 */
	matchingItemsSort = function(a, b) {
		var searchTerm = this,
		/**
		 * Get the matching level for the given selection item.
		 *
		 * @param [SelectionItem] item       The selection item to match.
		 * @param [String]        searchTerm The search term to match.
		 *
		 * @return [integer] The matching level of the selection item.
		 */
		getMatchLevel = function(item, searchTerm) {
			var level = 0;
			// Best: beginning with the same word
			if (item.matches(new RegExp('^' + searchTerm, 'i'))) {
				level = 3;
			// Better: containing the actual word
			} else if (item.matches(new RegExp(searchTerm,'i'))) {
				level = 2;
			// Somewhat preferred: shared characters
			} else if (item.matches(new RegExp(searchTerm.split('').join('\\w*').replace(/\W/, ""), 'i'))) {
				level = 1;
			}
			return level;
		},
		matchLevelA = getMatchLevel(a, searchTerm),
		matchLevelB = getMatchLevel(b, searchTerm);

		if (matchLevelA > matchLevelB) {
			return -1;
		} else if (matchLevelA < matchLevelB) {
			return 1;
		// if the same, sort alphabetically
		} else {
			return a.getPlainText() < b.getPlainText() ? -1 : 1;
		}
	},
	coreOptions = {
		cache:1,
		delay:800,
		ghostFill:1,
		maxShow:10,
		minChars:3,
		matchingItemsSort:matchingItemsSort
	},

	/**
	 * Create a subset of the data that matched the given word.
	 *
	 * @param [String] word The word to match.
	 * @param [Object] data The matching SelectionItems associated by their Ids.
	 */
	buildMatchingListFromData = function(word, data) {
		var i,
		j = list.children.length,
		matchingData = [],
		item;
		linkId = '',
		selections = [];
		activeSelection = 0;
		while(j--) {
			list.removeChild(list.children[j]);
		}

		for(i in data) {
			if (
				data[i]
				&& (data[i] instanceof djs.autocomplete.SelectionItem)
				&& (
					data[i].matches(word) ||
					data[i].matches(new RegExp(('' + word.replace(/\W/g,'')).split('').join('\\w*').replace(/\W/, ""), 'i'))
				)
			) {
				data[i].setMatchingWord(word);
				matchingData[matchingData.length] = data[i];
			}
		}
		matchingData = matchingData.sort(function(a, b) {
			return coreOptions['matchingItemsSort'].call(word, a, b);
		}).slice(0,coreOptions['maxShow']);
		for (i = 0; i < matchingData.length; i++) {
			linkId = 'autocomplete-item-link-' + (i+1);
			item = makeListItem(matchingData[i].getDisplayMarkup(), linkId);
			matchingData[i].setListItemNode(item);

			// selection index 0 is nothing
			selections[i + 1] = matchingData[i];
			selectionLinks[linkId] = (i + 1);
			list.appendChild(item);
		}
		if (0 < matchingData.length) {
			showList();
		}
	},

	/**
	 * Make a list item from the given markup.
	 *
	 * @param [string] markupValue The markup for the content of the item.
	 * @param [string] id          The id of the list item.
	 *
	 * @return [DOMElement] The <li> list item.
	 */
	makeListItem = function(markupValue, id) {
		var listItem = create('li'),
		link = create('a');
		link.id = id;
		link.className = 'autocomplete-item-link';
		link.innerHTML = markupValue;
		listItem.appendChild(link);
		listItem.className = 'autocomplete-item';
		return listItem;
	},

	/**
	 * Add the response data for the given query.
	 *
	 * @param [String] queryText The text query that resulted in the given data.
	 * @param [Array]  data      The data from the response.
	 *  data can be an array of either Strings or SelectionItems
	 */
	setListData = function(queryText, data) {
		data = data || [];
		var i;
		for (i = 0; i < data.length; i++) {
			if (data[i] && data[i] instanceof djs.autocomplete.SelectionItem) {
				listData[data[i].getId()] = data[i];
				requestCache[data[i].getPlainText()] = 1;
			} else if (data[i] && 'string' == (typeof data[i]).toLowerCase()) {
				listData[data[i]] = new djs.autocomplete.SelectionItem({id:data[i],text:data[i]});
				requestCache[data[i]] = 1;
			}
		}
		if (0 < data.length) {
			requestCache[queryText] = 1;
		}
	},

	/**
	 * Determine whether the current text matches a selection item, for the ghost fill.
	 *
	 * @param [string] text The text to match.
	 * @param [Array]  selections The selection items in which to identify matching text.
	 */
	determineGhostMatch = function(text) {
		if (coreOptions['ghostFill']) {
			ghost.value = '';
			ghostMatch = 0;
			if (text && 0 < selections.length) {
				index = findFirstMatchingSelectionItem(text, selections);
				if (index && selections[index]) {
					ghost.value = selections[index].getPlainText();
				}
				ghostMatch = index;
			}
		}
	},

	/**
	 * Get the index of the selection item that matches the given text.
	 *
	 * @param [String] text       The text to match.
	 * @param [Array]  selections The selection items in which to identify matching text.
	 *
	 * @return [Integer] The index of the first matching selection.
	 **/
	findFirstMatchingSelectionItem = function(text, selections) {
		var firstTextMatch = null, i,
		re = new RegExp('^(' + text + ')');
		for(i = 1; i < selections.length; i++) {
			if (selections[i] && re.exec(selections[i].getPlainText())) {
				firstTextMatch = i;
			}
		}
		return firstTextMatch;
	},

	/**
	 * Make the current selection to be the choice.
	 */
	chooseSelection = function(index) {
		if (selections[index]) {
			selections[index].trigger('chosen');
		}
	},
	setSelection = function(nextPosition) {
		if (selections[activeSelection] && selections[activeSelection].getListItemNode()) {
			d.removeClass(selections[activeSelection].getListItemNode(), 'state-focus');
		}
		activeSelection = ((nextPosition >= selections.length) || (1 > nextPosition) ? 0 : nextPosition);
		if (selections[activeSelection] && selections[activeSelection].getListItemNode()) {
			d.addClass(selections[activeSelection].getListItemNode(), 'state-focus');
		}
		if (null === originalText && null === generatedText) {
			originalText = getSubjectValue() + '';
		}
		if (activeSelection && selections[activeSelection]) {
			selections[activeSelection].trigger('selected');
			generatedText = selections[activeSelection].getPlainText();
			setSubjectValue(generatedText);
			if (coreOptions['ghostFill']) {
				ghost.value = selections[activeSelection].getPlainText();
			}
		} else {
			setSubjectValue(null === originalText ? '' : originalText);
			originalText = null;
			generatedText = null;
			ghost.value = getSubjectValue();
		}
	},
	importantEvents = {
		// up arrow
		38:function(e) {
			setSelection(0 < activeSelection ? activeSelection - 1 : (selections.length ? selections.length - 1 : 0));
			djs.stopDefault(e);
		},
		// down arrow
		40:function(e) {
			setSelection(activeSelection + 1);
			djs.stopDefault(e);
		},
		// tab
		9:function(e) {
			var text = getSubjectValue() ? getSubjectValue() : '';
			if (coreOptions['ghostFill'] && ghostMatch) {
				// re-calculate ghost match on the current text
				determineGhostMatch(text, selections);
				setSelection(ghostMatch);
				ghostMatch = 0;
				djs.stopDefault(e);
			} else if (!activeSelection && selections[1] && !listIsHidden) {
				setSelection(1);
				djs.stopDefault(e);
			} else {
				if (activeSelection) {
					chooseSelection(activeSelection);
				}
			}
		},
		// enter
		13:function(e) {
			if (selections[activeSelection]) {
				chooseSelection(activeSelection);
			} else {
				(new djs.autocomplete.SelectionItem({})).trigger('nothingChosen', [{text:getSubjectValue()}]);
			}
			hideList();
			djs.stopDefault(e);
		}
	},
	eventClickListItem = function(e) {
		var target = d.getEventTarget(e);
		if (target && d.hasClass(target, 'autocomplete-item-link')) {
			if (target.id && selectionLinks[target.id] && selections[selectionLinks[target.id]]) {
				setSelection(selectionLinks[target.id]);
				chooseSelection(activeSelection);
				hideList();
			}
			d.stopDefault(e);
		}
	},
	eventBlur = function(e) {
		hideList();
		ghost.value = '';
	},
	eventKeydown = function(e) {
		lastKeyPressed = e.keyCode;
		if (importantEvents[lastKeyPressed]) {
			importantEvents[lastKeyPressed].call(this, e);
		}
	},
	eventKeypress = function(e) {
		var characterCode = e.which || e.keyCode,
		index,
		text = getSubjectValue(),
		theLetter;
		if (characterCode) {
			theLetter = String.fromCharCode(characterCode);
			if (theLetter && /[a-zA-Z]/.exec(theLetter)) {
				text += theLetter;
			}
		}
		if (text != subjectText) {
			if (text.length >= coreOptions['minChars'] && !importantEvents[e.keyCode]) {
				buildMatchingListFromData(text, listData);
			}
			determineGhostMatch(text, selections);
		}
	},
	eventKeyup = function(e) {
		var subjectText = text = getSubjectValue();
		if (text.length >= coreOptions['minChars'] && canFetchList) {
			if (!coreOptions['cache'] || !requestCache[getSubjectValue()]) {
				requestListData(subject, callback);
			}
			canFetchList = false;
			setTimeout(function() {
				canFetchList = true;
			}, coreOptions['delay']);

		} else if ('' == subjectText) {
			ghost.value = subjectText;
			hideList();
		}
		if (!(new RegExp('^' + subjectText)).exec(ghost.value)) {
			ghost.value = subjectText;
		}
	};

	list.className = 'autocomplete-items';
	for (i in options) {
		coreOptions[i] = options[i];
	}
	if (subject) {
		container = subject.parentNode;
		djs.attachListener('blur',eventBlur);
		djs.attachListener('keydown',eventKeydown);
		djs.attachListener('keypress',eventKeypress);
		djs.attachListener('keyup',eventKeyup);
		// using mousedown instead of click, because it fires before the blur of the input
		d.attachListener(container, 'mousedown',eventClickListItem);
		if (coreOptions['ghostFill']) {
			ghost.disabled = true;
			ghost.type = subject.type ? subject.type : 'text';
			ghost.className = (subject.className ? subject.className : '') + ' ghost-fill';
			container.insertBefore(ghost, subject);

			subject.parentNode.style.zIndex = 90;
			subject.parentNode.style.zoom = 1;
			ghost.style.zIndex = 200;
			subject.style.zIndex = 500;

			/**
			 * IE8 seems to position the ghost on top of the subject input
			 * no matter what, so let's give the subject the focus if the ghost gets clicked.
			 */
			d.attachListener(ghost.parentNode, 'click', function(ev) {
				var target = d.getEventTarget(ev);
				if (target == ghost) {
					if (subject && subject.focus) {
						subject.focus();
					}
				}
			});
		}
		hideList();
		container.appendChild(list);
	}
	return this;
}
DecentJS.core.prototype.autocomplete.SelectionItem = function(args) {
	var priorText, plainText, displayText, id,
	matchingWord, associatedNode,
	events = {},
	staticSelectionItem = DecentJS.core.prototype.autocomplete.SelectionItem,
	values = {};

	/**
	 * Construct the values.
	 *
	 * @param [Object] The initializer.
	 */
	this.init = function(args) {
		args = args || {};
		priorText = plainText = args['text'] || '';
		displayText = args['displayText'] || null;
		id = args['id'] || null;
		for(var i in args) {
			if (DecentJS.isObjProperty(args, i)) {
				values[i] = args[i];
			}
		}
	}

	/**
	 * Add an event listener.
	 *
	 * @param [String]   eventName The name of the event.
	 * @param [function] callback  The callback listener,
	 * which receives the event name as its first parameter
	 * and the SelectionItem as -this-.
	 *
	 * @return [String] The Id of the callback.
	 */
	this.attachListener = function(eventName, callback) {
		if (!events[eventName]) {
			events[eventName] = [];
		}
		events[eventName][events[eventName].length] = callback;
		return eventName + '_' + (events[eventName].length - 1);
	}

	/**
	 * Trigger a selection item event.
	 *
	 * @param [String] eventName       The name of the event.
	 * @param [Array]  inputParameters Optional parameters to pass to the callback.
	 *
	 * @return [SelectionItem] The selection item.
	 */
	this.trigger = function(eventName, inputParameters) {
		inputParameters = inputParameters || [];
		var callbackCount = events[eventName] ? events[eventName].length : 0,
		generalCallbackCount = staticSelectionItem._events && staticSelectionItem._events[eventName] ? staticSelectionItem._events[eventName].length : 0,
		parameters = [eventName],
		i;
		for(i = 0; i < inputParameters.length; i++) {
			parameters[parameters.length] = inputParameters[i];
		}
		for(i = 0; i < callbackCount; i++) {
			if (events[eventName][i]) {
				events[eventName][i].apply(this, parameters);
			}
		}
		for(i = 0; i < generalCallbackCount; i++) {
			if (staticSelectionItem._events[eventName][i]) {
				staticSelectionItem._events[eventName][i].apply(this, parameters);
			}
		}
		return this;
	}

	/**
	 * Set the Id of the selection item.
	 *
	 * @param [String] value The Id of the selection item.
	 * @return [SelectionItem] The selection item.
	 */
	this.setId = function(value) {
		id = value;
		return this;
	}

	/**
	 * Get the Id of the selection item.
	 *
	 * @return [String] The Id.
	 */
	this.getId = function() {
		return id;
	}

	/**
	 * Set the plain text value of the selection item.
	 *
	 * @param [String] value The value of the plain text.
	 * @return [SelectionItem] The selection item.
	 */
	this.setPlainText = function(value) {
		plainText = value;
		return this;
	}

	/**
	 * Get the plain text form of the item value,
	 * which can be used, e.g., in the input
	 * element's value attribute.
	 *
	 * @return [String] The plain text item value.
	 */
	this.getPlainText = function() {
		return plainText;
	}

	/**
	 * Set the display markup.
	 *
	 * @param [String] value The HTML text value of the display markup.
	 * @return [SelectionItem] The selection item.
	 */
	this.setDisplayMarkup = function(value) {
		displayText = value;
		return this;
	}

	/**
	 * Get the display markup, used in the autocomplete dropdown.
	 * Defaults to the plain text value.
	 *
	 * @return [String] The markup for the dropdown value of the item.
	 */
	this.getDisplayMarkup = function() {
	/*
				if (selections[i]['node'] && selections[i]['node'].firstChild) {
					selections[i]['node'].firstChild.innerHTML = selections[i]['text'];
				}
				/**/
		return null === displayText ? this.getPlainText() : displayText;
	}

	/**
	 * Set the word that matches the selection item.
	 *
	 * @param [string] word The word that matches.
	 *
	 * @return [SelectionItem] The selection item.
	 */
	this.setMatchingWord = function(word) {
		matchingWord = word;
		return this;
	}

	/**
	 * Get the word that matches the selection item.
	 *
	 * @return [string] The word that matches the selection item.
	 */
	this.getMatchingWord = function() {
		return matchingWord;
	}

	/**
	 * Set the DOMElement list item node that is associated with this selection item.
	 *
	 * @param [DOMElement] node The DOM element that is associated with the selection item.
	 *
	 * @return [SelectionItem] The selection item.
	 */
	this.setListItemNode = function(node) {
		associatedNode = node;
		return this;
	}

	/**
	 * Get the DOMElement list item node that is associated with this selection item.
	 *
	 * @return [DOMElement] The associated <li> item.
	 */
	this.getListItemNode = function() {
		return associatedNode;
	}

	/**
	 * Get the core values of the selection item.
	 *
	 * @return [Object] The values.
	 */
	this.getValues = function() {
		return values;
	}

	/**
	 * Determine whether the selection item matches.
	 *
	 * @param [Object] matcher The String, RegExp, or callback that determines whether the selection item matches.
	 *
	 * @return [boolean] Whether the selection item matches.
	 */
	this.matches = function(matcher) {
		switch((typeof matcher).toLowerCase()) {
			case "string" :
				return !! ((this.getPlainText().indexOf(matcher) > -1) || this.getPlainText().match(new RegExp(matcher)));
				break;
			case "function" :
				return !! matcher.call(this, this.getPlainText());
				break;
			case "object" :
				if (matcher instanceof RegExp) {
					return !! this.getPlainText().match(matcher);
				}
				break;
		}
	}

	/**
	 * If the item matches the given text, trigger the "matched" event.
	 *
	 * @param [String] matcher The matcher to match.
	 *
	 * @return [boolean] Whether the given matcher matches the selection item.
	 */
	this.reactIfMatch = function(matcher) {
		if (this.matches(matcher)) {
			this.trigger('matched', matcher);
			return true;
		}
		return false;
	}

	this.init(args);
}

	/**
	 * Add an event listener globally.
	 *
	 * @param [String]   eventName The name of the event.
	 * @param [function] callback  The callback listener,
	 * which receives the event name as its first parameter
	 * and the SelectionItem as -this-.
	 */
DecentJS.core.prototype.autocomplete.SelectionItem.attachListener = function(eventName, callback) {
	if (!this._events) {
		this._events = {};
	}
	if (!this._events[eventName]) {
		this._events[eventName] = [];
	}
	this._events[eventName][this._events[eventName].length] = callback;
}
}
})(this);
