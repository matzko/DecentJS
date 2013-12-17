(function(scope) {
if ('undefined' != typeof scope.DecentJS) {
DecentJS.core.prototype.autocomplete = function(callback,options) {
	options = options || {};
	var d = DecentJS, djs = this, i, container,
	create = function(t) { return djs.doc.createElement(t)},
	ghost = create('input'),
	ghostMatch = 0,
	subject = djs.actionSubject,
	subjectText = subject ? subject.value + '' : '',
	originalText = null,
	generatedText = null,
	lastKeyPressed,
	selections = [],
	selectionLinks = {},
	activeSelection = 0,
	canFetchList = true,
	requestCache = {},
	requestListData = function(subject, callback) {
		callback.call(subject, subject.value, 
			(function(queryText) {
				return function(data) {
					setListData(queryText, data);
				}
			})(subject.value)
		);
	},
	listIsHidden = false,
	hideList = function() {
		list.style.display = 'none';
		listIsHidden = true;
	},
	showList = function() {
		list.style.display = 'block';
		listIsHidden = false;
	},
	list = create('ul'),
	listData = {},
	/**
	 * Determine whether the given word matches the given text.
	 *
	 * @param [string] word        The word to match.
	 * @param [string] operandText The text to find the match in.
	 * @return [boolean] Whether the word matches.
	 **/
	wordMatches = function(word, operandText) {
		word = word + '';
		var re = new RegExp(word.split('').join('\\w*').replace(/\W/, ""), 'i');
		return !! operandText.match(re);
	},
	matchingListSort = function(a, b) {
		var searchTerm = this,
		getMatchLevel = function(searchResult, searchTerm) {
			var level = 0;
			// Best: beginning with the same word
			if (!!searchResult.match(new RegExp('^' + searchTerm, 'i'))) {
				level = 3;
			// Better: containing the actual word
			} else if (!!searchResult.match(new RegExp(searchTerm,'i'))) {
				level = 2;
			// Somewhat preferred: shared characters
			} else if (!!searchResult.match(new RegExp(searchTerm.split('').join('\\w*').replace(/\W/, ""), 'i'))) {
				level = 1;
			}
			return level;
		},
		matchLevelA = getMatchLevel(a.text, searchTerm),
		matchLevelB = getMatchLevel(b.text, searchTerm);

		if (matchLevelA > matchLevelB) {
			return -1;
		} else if (matchLevelA < matchLevelB) {
			return 1;
		// if the same, sort alphabetically
		} else {
			return a.text < b.text ? -1 : 1;
		}
	},
	coreOptions = {
		cache:1,
		delay:800,
		ghostFill:1,
		maxShow:10,
		minChars:3,
		resultSort:matchingListSort
	},
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
			if (data[i] && data[i].text && wordMatches(word, data[i].text)) {
				matchingData[matchingData.length] = data[i];
			}
		}
		matchingData = matchingData.sort(function(a, b) {
			return coreOptions['resultSort'].call(word, a, b);
		}).slice(0,coreOptions['maxShow']);
		for (i = 0; i < matchingData.length; i++) {
			linkId = 'autocomplete-item-link-' + (i+1);
			item = makeListItem(matchingData[i].text, linkId);
			// selection index 0 is nothing
			selections[i + 1] = {
				id:matchingData[i].id,
				origText:matchingData[i].text,
				text:matchingData[i].text,
				datum:matchingData[i],
				node:item
			};
			selectionLinks[linkId] = (i + 1);
			list.appendChild(item);
		}
		if (0 < matchingData.length) {
			showList();
		}
	},
	makeListItem = function(textValue, id) {
		var content = djs.doc.createTextNode(textValue),
		listItem = create('li'),
		link = create('a');
		link.id = id;
		link.className = 'autocomplete-item-link';
		link.appendChild(content);
		listItem.appendChild(link);
		listItem.className = 'autocomplete-item';
		return listItem;
	},
	setListData = function(queryText, data) {
		data = data || [];
		var i, id, text, callback;
		for (i = 0; i < data.length; i++) {
			if (data[i]) {
				text = ('object' == (typeof data[i])) && data[i].text ? data[i].text : '' + data[i];
				id = ('object' == (typeof data[i])) && data[i].id ? data[i].id : text;
				callback = ('object' == (typeof data[i])) && ('function' == (typeof data[i].callback)) ? data[i].callback : function(){};
				listData[id] = {id:id,text:text,callback:callback};
				requestCache[text] = 1;
			}
		} 
		if (0 < data.length) {
			requestCache[queryText] = 1;
		}
	},
	matchCurrentText = function(text, selections) {
		var firstTextMatch = null, i,
		re = new RegExp('^(' + text + ')'),
		match = null;
		for(i = 1; i < selections.length; i++) {
			if (selections[i] && selections[i]['origText']) {
				match = re.exec(selections[i]['origText']);
				if (match) {
					if (null === firstTextMatch) {
						firstTextMatch = i;
					}
					selections[i]['text'] = selections[i]['origText'].replace(re, '<strong class="matched-text">$1</strong>');
				} else {
					selections[i]['text'] = selections[i]['origText'];
				}
				if (selections[i]['node'] && selections[i]['node'].firstChild) {
					selections[i]['node'].firstChild.innerHTML = selections[i]['text']; 
				}
			}
		}
		return firstTextMatch;
	},
	/**
	 * Make the current selection to be the choice.
	 */
	chooseSelection = function(index) {
		if (selections[index] && selections[index].datum && selections[index].datum) {
			selections[index].datum.callback.call(selections[index].datum, 'choice');
		}
	},
	setSelection = function(nextPosition) {
		if (selections[activeSelection] && selections[activeSelection]['node']) {
			d.removeClass(selections[activeSelection]['node'], 'state-focus');
		}
		activeSelection = ((nextPosition >= selections.length) || (1 > nextPosition) ? 0 : nextPosition);
		if (selections[activeSelection] && selections[activeSelection]['node']) {
			d.addClass(selections[activeSelection]['node'], 'state-focus');
		}
		if (null === originalText && null === generatedText) {
			originalText = subject.value + '';
		}
		if (activeSelection && selections[activeSelection] && selections[activeSelection]['origText']) {
			if (selections[activeSelection].datum && selections[activeSelection].datum.callback) {
				selections[activeSelection].datum.callback.call(selections[activeSelection].datum, 'selection');
			}
			subject.value = generatedText = selections[activeSelection]['origText'];
			if (coreOptions['ghostFill']) {
				if (selections[activeSelection] && selections[activeSelection]['origText']) {
					ghost.value = selections[activeSelection]['origText'];
				} else {
					ghost.value = '';
				}
			}
		} else {
			subject.value = null === originalText ? '' : originalText;
			originalText = null;
			generatedText = null;
			ghost.value = subject.value;
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
			if (coreOptions['ghostFill'] && ghostMatch) {
				setSelection(ghostMatch);
				ghostMatch = 0;
				djs.stopDefault(e);
			} else if (!activeSelection && selections[1] && !listIsHidden) {
				setSelection(1);
				djs.stopDefault(e);
			}
		},
		// enter
		13:function(e) {
			chooseSelection(activeSelection); 
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
		text = subject.value ? subject.value : '',
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
			if (coreOptions['ghostFill']) {
				ghost.value = '';
				ghostMatch = 0;
				if (text && 0 < selections.length) {
					index = matchCurrentText(text, selections);
					if (index && selections[index] && selections[index]['text']) {
						ghost.value = selections[index]['origText'];
					}
					ghostMatch = index;
				}
			}
		}
	},
	eventKeyup = function(e) {
		var subjectText = text = subject.value ? subject.value : '';
		if (text.length >= coreOptions['minChars'] && canFetchList) {
			if (!coreOptions['cache'] || !requestCache[subject.value]) {
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
		d.attachListener(container, 'click',eventClickListItem);
		if (coreOptions['ghostFill']) {
			ghost.disabled = true;
			ghost.type = subject.type ? subject.type : 'text';
			ghost.className = (subject.className ? subject.className : '') + ' ghost-fill';
			container.insertBefore(ghost, subject);
		}
		hideList();
		container.appendChild(list);
	}
}
}
})(this);
