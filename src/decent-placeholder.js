(function(scope) {
if ('undefined' != typeof scope.DecentJS) {
DecentJS.core.prototype.placeholder = function(options) {
	options = options || {};
	var d = DecentJS, djs = this, i, subject = djs.actionSubject,
	coreOptions = {
		wrapper:false
	},
	create = function(t) { return djs.doc.createElement(t)},
	supportsInputPlaceholder = !! ('placeholder' in create('input')),
	supportsTextareaPlaceholder = !! ('placeholder' in create('textarea')),

	buildPlaceholderInput = function() {
	},

	init = function() {
		if (!supportsInputPlaceholder && subject && subject.tagName && ('input' == subject.tagName.toLowerCase())) {
			var placeholderValue = subject.getAttribute('placeholder'),
			ghost = create('input'),
			wrapper;
			if (placeholderValue) {
				if (coreOptions['wrapper']) {
					wrapper = coreOptions['wrapper'];
				} else {
					wrapper = create('span');
					wrapper.className = 'decent-placeholder-wrapper';
					wrapper.style.position = 'relative';
					wrapper.style.display = 'block';
					wrapper.style.height = subject.offsetHeight + 'px';
					wrapper.style.width = subject.offsetWidth + 'px';
					subject.parentNode.insertBefore(wrapper, subject);
				}
				wrapper.appendChild(subject);

				ghost.disabled = true;
				ghost.type = (subject.type && 'password' != subject.type.toLowerCase()) ? subject.type : 'text';
				ghost.className = (subject.className ? subject.className : '') + ' ghost-fill';
				ghost.style.zoom = 1;
				if (!subject.value) {
					ghost.value = placeholderValue;
				}

				subject.style.zoom = 1;
				subject.parentNode.insertBefore(ghost, subject);

				subject.style.display = ghost.style.display = 'block';
				subject.style.position = ghost.style.position = 'absolute';
				subject.style.top = ghost.style.top = '0px';
				subject.style.left = ghost.style.left = '0px';
				subject.style.backgroundColor = ghost.style.backgroundColor = 'transparent';
				subject.style.cursor = ghost.style.cursor = 'text';

				subject.parentNode.style.zIndex = 100;
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

				djs.attachListener('change', function(evt) {
					if (!this.subject && !ghost.value && placeholderValue) {
						ghost.value = placeholderValue;
					}
				});

				djs.attachListener('keydown', function(evt) {
					var characterCode = evt.keyCode, theLetter, text = subject.value;
					if (characterCode) {
						// backspace
						if (8 == characterCode) {
							text = text.substring(0,(text.length-1));
						} else if (13 == characterCode) {
							// submit the form the subject is in
							(function(el) {
								var parentEl = el;
								while(el) {
									if (el && el.nodeName && 'FORM' == el.nodeName) {
										el.submit();
									}
									el = el.parentNode;
								}
							})(subject);

						} else {
							theLetter = String.fromCharCode(characterCode);
							if (theLetter && /[a-zA-Z]/.exec(theLetter)) {
								text += theLetter;
							}
						}
						if ('' != text) {
							ghost.style.visibility = 'hidden';
						} else {
							ghost.style.visibility = 'visible';
						}
					}
				});
			}
		}
	};
	for (i in options) {
		coreOptions[i] = options[i];
	}
	init();
	return {
		supportsInput:supportsInputPlaceholder,
		supportText:supportsTextareaPlaceholder
	}
}
}
})(this);
