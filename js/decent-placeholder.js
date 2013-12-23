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
				ghost.style.cursor = 'text';
				ghost.value = placeholderValue;

				subject.parentNode.insertBefore(ghost, subject);
				ghost.style.position = subject.style.position = 'absolute';
				ghost.style.top = subject.style.top = '0px';
				ghost.style.left = subject.style.left = '0px';
				ghost.style.backgroundColor =subject.style.backgroundColor = 'transparent';

				djs.attachListener('keydown', function(evt) {
					var characterCode = evt.keyCode, theLetter, text = subject.value;
					if (characterCode) {
						// backspace
						if (8 == characterCode) {
							text = text.substring(0,(text.length-1));
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
}
}
})(this);
