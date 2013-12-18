(function(scope) {
	/**
	 * Attach an event listener to the given DOM element.
	 *
	 * @param [DOMElement] obj  The DOM object to which we attach the event listener.
	 * @param [string]     type The event for which we will listen.
	 * @param [function]   fn   The callback invoked when the event occurs.  The callback receives the Event object as its parameter.
	 */
	var attachListener = function( obj, type, fn ) {
		if (obj.addEventListener)
			obj.addEventListener(type, fn, false);
		else if (obj.attachEvent)
			obj.attachEvent('on' + type, function() { return fn.call(obj, w.event);});
	},

	/**
	 * Set a JavaScript object to be the current subject of DecentJS
	 *
	 * @param [Object] subject The JavaScript that is the subject of our activity.
	 */
	DecentJS = function(subject) {
		return new core(subject);
	},

	d = document,
	w = window,

	XHR = (function() { 
		var i, 
		fs = [
		function() { // for legacy eg. IE 5 
			return new scope.ActiveXObject("Microsoft.XMLHTTP"); 
		}, 
		function() { // for fully patched Win2k SP4 and up 
			return new scope.ActiveXObject("Msxml2.XMLHTTP.3.0"); 
		}, 
		function() { // IE 6 users that have updated their msxml dll files. 
			return new scope.ActiveXObject("Msxml2.XMLHTTP.6.0"); 
		}, 
		function() { // IE7, Safari, Mozilla, Opera, etc (NOTE: IE7 native version does not support overrideMimeType or local file requests)
			return new XMLHttpRequest();
		}]; 

		// Loop through the possible factories to try and find one that
		// can instantiate an XMLHttpRequest object that works.

		for ( i = fs.length; i--; ) { 
			try { 
				if ( fs[i]() ) { 
					return fs[i]; 
				} 
			} catch (e) {} 
		}
	})(),

	/**
	 * Post a xhr request
	 * @param [String]   url      The url to which to post
	 * @param [object]   data     The associative array of data to post, or a string of already-encoded data.
	 * @param [function] callback The function to call upon success.
	 * @param [String]   method   Optional. The type of request to make, such as GET, PUT, POST or DELETE. Default is "POST"
	 * @param [object]   headers  Optional. Headers to send with the request. 
	 */
	ajax = function(url, data, callback, method, headers) {
		url = url || '';
		data = data || {};
		method = method || 'POST';
		headers = headers || {};
		var baseHeaders = {'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest'},
		dataString = serialize(data),
		i,
		request = new XHR;

		for (i in headers)
			baseHeaders[i] = headers[i];

		try {
			if ( 'undefined' == typeof callback ) {
				callback = function() {};
			}
			request.open(method, url, true);
			for (i in baseHeaders) {
				request.setRequestHeader(i,baseHeaders[i]);
			}
			request.onreadystatechange = function() {
				if ( 4 == request.readyState ) {
					request.onreadystatechange = function() {};
					if ( 200 <= request.status && 300 > request.status || ( 'undefined' == typeof request.status ) ) {
						if (request.getResponseHeader && (new RegExp('^application/json','i')).exec(request.getResponseHeader('content-type'))) {
							if (scope.JSON) {
								callback(scope.JSON.parse(request.responseText));
							} else {
								// Not a great way to parse JSON, but better than nothing in older browsers
								callback(eval('(' + request.responseText + ')'));
							}
						} else {
							callback(request.responseText);
						}
					}
				}
			}
			request.send(dataString);
		} catch(e) {};
	},
	
	/** 
	 * Whether the property is of this particular object's
	 * @param obj The object whose property we're interested in.
	 * @param property The property which we're interested in.
	 * @return true if The property does not originate higher in the prototype chain.
	 */
	isObjProp = function(obj, property) {
		var p = obj.constructor.prototype[property];
		return ( 'undefined' == typeof p || property !== obj[p] );
	},

	/**
	 * Serialize an associative array
	 * @param array a The associative array to serialize.
	 * @uses urlencode, isObjProp
	 * @return string The serialized string.
	 */
	serialize = function(a) {
		var i, j, s = [];
		for( i in a ) {
			if ( isObjProp(a, i) ) {
				// if the object is an array itself
				if ( '[]' == i.substr(i.length - 2, i.length) ) {
					for ( j = 0; j < a[i].length; j++ ) {
						s[s.length] = urlencode(i) + '=' + urlencode(a[i][j]);
					}
				} else {
					s[s.length] = urlencode(i) + '=' + urlencode(a[i]);
				}
			}
		}
		return s.join('&');
	},

	urlencode = (function() {
		var f = function(s) {
			return encodeURIComponent(s).replace(/%20/,'+').replace(/(.{0,3})(%0A)/g,
				function(m, a, b) {return a+(a=='%0D'?'':'%0D')+b;}).replace(/(%0D)(.{0,3})/g,
				function(m, a, b) {return a+(b=='%0A'?'':'%0A')+b;});
		};

		if (typeof encodeURIComponent != 'undefined' && String.prototype.replace && f('\n \r') == '%0D%0A+%0D%0A') {
			return f;
		}
	})(),

	/**
	 * Get the object that was the target of an event
	 * @param object e The event object (or null for ie)
	 * @return object The target object.
	 */
	getEventTarget = function(e) {
		e = e || w.event;
		return e.target || e.srcElement;
	},

	/**
	 * Set the input value, even if that means a multi-dimensional object.
	 */
	_setValueFromInputName = function( name, value ) {
		var match = /([^\[]*)\[([^\]]*)\]/.exec( name );	
		if ( match && match[0] && match[1] && match[2] ) {
			if ( ! this[match[1]] )
				this[match[1]] = {};
			this[match[1]][match[2]] = value;

		// checkboxes with attributes like: name="myname[]"
		} else if ( match && match[0] && match[1] && '' === match[2] ) {
			if ( ! this[match[1]] || ! this[match[1]][0] ) {
				this[match[1]] = [];
			}
			
			this[match[1]][this[match[1]].length] = value;
		} else {
			this[name] = value;
		}
	},

	/**
	 * Get the form data.
	 *
	 * @todo better handling of different elements
	 *
	 * @param [DOMElement] form The form for which to get the data.
	 * @param [DOMElement] clickTarget The item whose click submitted the form, if any.
	 */
	getFormData = function(form, clickTarget) {
		clickTarget = clickTarget || getDefaultSubmitButton(form);
		if ( ! form )
			return {};
		var elTypes = ['input', 'select', 'textarea'],
		i, j = elTypes.length, k = 0,
		objType, 
		data  = {},
		fields,
		fieldValue;

		if (clickTarget) {
			if (clickTarget.type && clickTarget.name && clickTarget.value && ('submit' == (clickTarget.type + '' ).toLowerCase())) {
				_setValueFromInputName.call(data, clickTarget.name, clickTarget.value);
			} else if (('button' == clickTarget.nodeName.toLowerCase()) && clickTarget.name) {
				if ( clickTarget.getAttribute('value') ) {
					_setValueFromInputName.call(data, clickTarget.name, clickTarget.getAttribute('value'));
				} else if ( clickTarget.value ) {
					_setValueFromInputName.call(data, clickTarget.name, clickTarget.value);
				} else if ( clickTarget.innerText || clickTarget.textContent ) {
					_setValueFromInputName.call(data, clickTarget.name, ( clickTarget.innerText || clickTarget.textContent ) );
				}
			}
		}
		while ( j-- ) {
			fields = form.getElementsByTagName( elTypes[j] );
			i = fields.length;
			while ( i-- ) {
				if ( fields[i] && fields[i].name ) {
					objType = ( fields[i].type + '' ).toLowerCase();
					if ( 'select-multiple' == objType ) {
						k = fields[i].options.length;
						if ( -1 < fields[i].selectedIndex ) {
							data[fields[i].name] = [];
							fieldValue = [];
							while ( k-- ) {
								if ( fields[i].options[k].selected ) {
									fieldValue[fieldValue.length] = fields[i].options[k].value;
								}
							}
							_setValueFromInputName.call(data, fields[i].name, fieldValue);
						}
					} else if ( 'select' == fields[i].name ) {
						if ( fields[i].options && fields[i].options[fields[i].selectedIndex] ) {
							_setValueFromInputName.call(data, fields[i].name, fields[i].options[fields[i].selectedIndex]);
						} else if ( fields[i].value ) {
							_setValueFromInputName.call(data, fields[i].name, fields[i].value);
						}
					} else if ( 'checkbox' == objType ) {
						if ( fields[i].checked ) {
							_setValueFromInputName.call(data, fields[i].name, fields[i].value);
						}
					} else if (
						! objType || 
						(('submit' != objType) && ('radio' != objType)) ||
						( 
							'radio' == objType &&
							fields[i].checked 
						)
					) {
						_setValueFromInputName.call(data, fields[i].name, fields[i].value);
					}
				}
			}
		}
		return data;
	},


	/**
	 * Create a cookie
	 * @param name The name of the cookie
	 * @param value The value of the cookie
	 * @param days How many days the cookie will last
	 */
	setCookie = function( name, value, days ) {
		var date = new Date(),
		expires = '';

		if ( days ) {
			date.setTime( date.getTime() + ( days * 24 * 60 * 60 * 1000 ) );
			expires = "; expires=" + ( date.toUTCString ? date.toUTCString() : date.toGMTString() );
		}

		d.cookie = name+"=" + urlencode(value) + expires + "; path=/";
	},

	/**
	 * Get a cookie's value
	 * @param name The name of the cookie to get
	 * @return string The value of the cookie
	 */
	getCookie = function( name ) {
		var nameEQ = name + "=",
		ca = d.cookie.split(';'),
		i;

		for(i = 0; i < ca.length; i++ ) {
			while( ca[i].charAt(0) == ' ' ) 
				ca[i] = ca[i].substring( 1, ca[i].length );
			if (ca[i].indexOf( nameEQ ) == 0 ) 
				return decodeURIComponent( ca[i].substring( nameEQ.length, ca[i].length ) );
		}
		return null;
	},


	/**
	 * Animation methods
	 */
	lerp = function(start, end, value) {
		return ( ( 1 - value ) * start ) + ( value * end );
	},

	hermite = function(start, end, value) {
		var i = lerp(start, end, value * value * ( 3 - 2 * value ));
		return i;
	},
	
	/*
	berp = function( start, end, value ) {
		value = 0 > value ? 0 : value;
		value = 1 < value ? 1 : value;
		value = ( Math.sin( value * Math.PI * (0.2 + 2.5 * value * value * value)) * Math.pow(1 - value, 2.2) + value) * (1 + (1.2 * (1 - value)));
		return start + (end - start) * value;
	},
	/**/

	inProgress = false,
	/**
	 * Scroll to the given element.
	 *
	 * @uses hermite
	 * @uses inProgress
	 */
	scrollToElement = function(el) {
		if ( inProgress )
			return;

		var elCopy = el,
		elTop = 0,
		browserTop = 0,
		rate = 25,
		time = 400,
		steps = time / rate,
		distance, inc, i;
		// assign element's position from the top to elTop
		while ( elCopy.offsetParent && elCopy != d.dElement ) {
			elTop += elCopy.offsetTop;
			elCopy = elCopy.offsetParent;
		}

		elTop = elTop - 30;
		elTop = 0 > elTop ? 0 : elTop;

		// assign browser's position from the top to browserTop
		if ( d.documentElement && d.documentElement.scrollTop ) {
			browserTop = d.documentElement.scrollTop;
		} else if ( d.body && d.body.scrollTop ) {
			browserTop = d.body.scrollTop;
		} else if ( d.getElementsByTagName('body') ) {
			browserTop = d.getElementsByTagName('body')[0].scrollTop;
		}

		// distance = Math.abs(browserTop - elTop);
		distance = browserTop - elTop;
		inc = distance / steps;
		for ( i = 0; i < steps; i++ ) {
			(function() {
				var pos = Math.ceil(browserTop - (hermite(0, 1, (i / steps)) * distance)),
				k = i,
				last = ( i + 1 ) < steps ? false : true;

				setTimeout(function() {
					if ( last ) {
						inProgress = false;
					}
					scrollTo(0, pos);
				}, k * rate);
			})();
		}
	},

	Animation = function(diff, callback) {
		return {
			animate:function() {
				if ( this.inProgress )
					return;
				this.inProgress = true;
					
				callback = callback || function() {};

				var steps = this.time / this.rate,
				i,
				last = false,
				state,
				that = this;
				

				for ( i = 0; i < steps; i++ ) {
					last = ( i + 1 ) < steps ? false : true;
					state = this.easing(0, 1, (i / steps)) * diff;
					(function(cb) {
						var k = i,
						l = last,
						curDiff = state;
						setTimeout(function() {
							if ( l )
								that.inProgress = false;
							cb.apply(that, [curDiff, l]);
						}, k * that.rate);
					})(callback);
				}
			},
			easing:hermite,
			rate:20,
			time:500
		}
	},

	fade = function(obj, dir, callback) {
		if ( ! obj )
			return;
		dir = dir || -1;
		callback = callback || function(){};
		if ( -1 === dir ) {
			obj.style.opacity = 1;
			obj.style.filter = 'alpha(opacity=100)';
		} else if ( 1 === dir ) {
			obj.style.opacity = 0;
			obj.style.filter = 'alpha(opacity=0)';
			obj.style.display = 'block';	
		}


		var fadeCallback = function(curDiff, isLast) {
			// var o = 100 + curDiff * dir;
			var o = -1 === dir ? 100 + curDiff : curDiff;
			obj.style.opacity = o / 100;
			obj.style.filter = 'alpha(opacity=' + o + ')';
			if ( isLast ) {
				callback.call(obj);
				if ( -1 === dir ) {
					obj.style.opacity = 0;
					obj.style.filter = 'alpha(opacity=0)';
					obj.style.display = 'none';
				} else {	
					obj.style.opacity = 1;
					obj.style.filter = 'alpha(opacity=100)';
					obj.style.display = 'block';
				}
			}
		},
		animator;

		if ( obj ) {
			if ( -1 === dir ) {
				animator = new Animation(-100, fadeCallback),
				animator.animate();
			} else {
				animator = new Animation(100, fadeCallback);
				animator.animate();
			}
		}
	},

	/**
	 * End animation
	 */

	/**
	 * Start custom event handlers
	 */

	/**
	 * Assign the callback to be triggered when an element of that class
	 * 	or one of its descendents is clicked.
	 * @param string className The name of the class to check for.
	 * @param function callback The callback to call.
	 * 	The first argument passed to callback is the event object.
	 * 	The value of -this- within the callback is the element with the given class.
	 * @param DOMElement parentEl Optional. The element to which to attach the delegated event listener.
	 * 	Default is document
	 */
	attachClassClickListener = function( className, callback, parentEl ) {
		if ( ! parentEl )
			parentEl = d;
		if ( ! className || ! callback )
			return false;

		(function(className, callback, parentEl) {
			attachListener( parentEl, 'click', function(e) {
				var result = true, 
				target = getEventTarget(e);
				do {
					if ( target.className && hasClass(target, className) ) {
						result = callback.call( target, e );	
						if ( ! result ) {
							eventHalt(e)
							return false;
						} else {
							return true;
						}
					} else {
						target = target.parentNode;
					}
				} while ( target && target != parentEl );
			});
		})(className, callback, parentEl);
	},

	/**
	 * Capture the values of the given form when submitted; stop its submission, and pass the values to the given callback.
	 *
	 * @param [DOMElement] form The form to capture.
	 * @param [function]   fn   The callback, which recieves the format data as its first parameter, the event object as the second, and the form DOMElement as -this-.
	 */
	attachFormListener = function(form, callback) {
		var clickedEl = null,
		listener = function(e) {
			stopDefault(e);
			callback.call(form, getFormData(form,clickedEl), e);
		}
		attachListener(form, 'submit', listener);
		attachListener(form, 'click', function(e) {
			clickedEl = getEventTarget(e);
		});
	},

	/**
	 * Get the default button for the given form.
	 *
	 * According to the HTML5 spec, a form's default button is 
	 * "is the first submit button in tree order whose form owner is that form element."
	 * <http://dev.w3.org/html5/spec-preview/constraints.html>
	 * And "The term tree order means a pre-order, depth-first traversal of DOM nodes involved (through the parentNode/childNodes relationship)."
	 * <http://dev.w3.org/html5/spec-preview/infrastructure.html#tree-order>
	 *
	 * @param [form] form The form for which to get the default button.
	 * @return [DOMElement] The default submit button, or null if none.
	 **/
	getDefaultSubmitButton = function(form) {
		var getTreeOrder = function(el, parentEl) {
			var x = 0, y = 0;
			while(el && el.parentNode !== null && el.parentNode !== false && el.parentNode != parentEl) {
				while(el && el.previousSibling !== null && el.previousSibling !== false && el.previousSibling != parentEl) {
					x++;
					el = el.previousSibling;
				}
				if (el) {
					y++;
					el = el.parentNode;
				}
			}
			return {x:x,y:y};
		},
		buttons = form.getElementsByTagName('button'),
		inputs = form.getElementsByTagName('input'),
		i = inputs.length, j = buttons.length, 
		submits = [],
		defaultButtonOrder, candidateOrder,
		defaultButton = null;
		
		while (i--) {
			if (inputs[i]) {
				if ('submit' == ( inputs[i].type + '' ).toLowerCase()) {
					submits[submits.length] = inputs[i];
				}
			}
		}
		while (j--) {
			if (buttons[j]) {
				submits[submits.length] = buttons[j];
			}
		}
		i = submits.length;
		while(i--) {
			if (null === defaultButton) {
				defaultButton = submits[i];
			} else if (defaultButton != submits[i]) {
				if (!defaultButtonOrder) {
					defaultButtonOrder = getTreeOrder(defaultButton,form);
				}
				candidateOrder = getTreeOrder(submits[i],form);
				if (
					(candidateOrder.y < defaultButtonOrder.y)
					|| (
						(candidateOrder.y == defaultButtonOrder.y)
						&& (candidateOrder.x < defaultButtonOrder.x)
					)
				) {
					defaultButton = submits[i];
				}
			}
		}
		return defaultButton;
	},

	/**
	 * Stop event propagation and default behavior for the given event.
	 *
	 * @param [Event] evt The event to halt.
	 */
	eventHalt = function(evt) {
		if ( evt.stopPropagation )
			evt.stopPropagation();
		evt.cancelBubble = true;
		stopDefault(evt);
	},

	stopDefault = function(evt) {
		if ( evt.preventDefault )
			evt.preventDefault();
		evt.returnValue = false;
	},
	/**
	 * End custom event handlers
	 */

	/**
	 * Add a class to a DOMElement
	 *
	 * @param [DOMElement] el        The DOM element to modify.
	 * @param [String]     className The class to add.
	 */
	addClass = function(el, className) {
		removeClass(el, className);
		el.className += ' ' + className;
	},

	/**
	 * Whether the element has the given class.
	 *
	 * @param [DOMElement] el        The DOM element in question.
	 * @param [String]     className The class to check for.
	 *
	 * @return [boolean] Whether the given element has that class.
	 */
	hasClass = function(el, className) {
		var re = new RegExp('\\b' + className + '\\b');
		return !! re.exec('' + el.className);
	},

	/**
	 * Remove a class from a DOMElement.
	 *
	 * @param [DOMElement] el
	 * @param [String]     className
	 */
	removeClass = function(el, className) {
		var re = new RegExp('(\\s+)?\\b' + className + '\\b(\\s+)?','g');
		el.className = (el.className + '').replace(re,' ').replace(new RegExp('^\\s+'),'').replace(new RegExp('\\s+$'), '');
	},

	/**
	 * Ready a callback for whichever occurs first: DOMContentLoaded or window.onload
	 *
	 * @param function callback The callback to call at that event.
	 */
	ready = function( callback ) {
		if ( callback )
			loadedCallbacks[loadedCallbacks.length] = callback;
		attachListener(d, 'DOMContentLoaded', eventDOMLoaded );
		attachListener(w, 'load', eventDOMLoaded );
	},
	
	initialized = false,
	loadedCallbacks = [function() {}],
	eventDOMLoaded = function() {
		var i;
		if ( initialized ) {
			return false;
		}
		initialized = true;

		for (i = 0; i < loadedCallbacks.length; i++) {
			loadedCallbacks[i].call(this,DecentJS);
		}
	},

	core = function(subject) {
		this.actionSubject = subject;
	};
	core.prototype.log = scope.console && scope.console.log ? console.log : function() {};
	core.prototype.doc = d;
	core.prototype.win = w;
	core.prototype.ajax = ajax;
	core.prototype.gebid = function(id) {
		return d.getElementById(id)
	}
	core.prototype.addClass = function(className) {
		addClass(this.actionSubject, className);
		return this;
	}
	core.prototype.hasClass = function(className) {
		return hasClass(this.actionSubject, className);
	}
	core.prototype.removeClass = function(className) {
		removeClass(this.actionSubject, className);
		return this;
	}
	/**
	 * Pass the action subject to a callback.
	 *
	 * @param [function] callback The callback to which we pass the action subject.
	 */
	core.prototype.invoke = function(callback,args) {
		args = args || [];
		return callback.apply(this.actionSubject, args);
	}
	core.prototype.getCookie = getCookie;
	core.prototype.setCookie = function(name, value, days) {
		setCookie(name, value, days);
		return this;
	}
	core.prototype.doWhenReady = ready;
	core.prototype.eventHalt = eventHalt;
	core.prototype.stopDefault = stopDefault;
	core.prototype.getEventTarget = getEventTarget;
	core.prototype.isObjProperty = isObjProp;

	core.prototype.attachClassClickListener = function(className, callback) {
		attachClassClickListener(className, callback, this.actionSubject);
		return this;
	}
	core.prototype.attachListener = function(type, fn) {
		attachListener(this.actionSubject, type, fn);
		return this;
	}
	core.prototype.attachFormListener = function(callback) {
		attachFormListener(this.actionSubject, callback);
		return this;
	}
	core.prototype.fade = function(dir, callback) {
		fade(this.actionSubject, dir, callback);
		return this;
	}
	core.prototype.getFormData = function(clickTarget) {
		return getFormData(this.actionSubject, clickTarget);
	}
	core.prototype.scrollTo = function() {
		scrollToElement(this.actionSubject);
		return this;
	}

	DecentJS.ajax = ajax;
	DecentJS.attachListener = attachListener;
	DecentJS.attachClassClickListener = attachClassClickListener;
	DecentJS.gebid = core.prototype.gebid;
	DecentJS.core = core;
	DecentJS.addClass = addClass;
	DecentJS.hasClass = hasClass;
	DecentJS.removeClass = removeClass;
	DecentJS.getCookie = getCookie;
	DecentJS.setCookie = function(name, value, days) {
		setCookie(name, value, days);
		return DecentJS;
	}
	DecentJS.doWhenReady = ready;
	DecentJS.eventHalt = eventHalt;
	DecentJS.stopDefault = stopDefault;
	DecentJS.getEventTarget = getEventTarget;
	DecentJS.isObjProperty = isObjProp;
	DecentJS.Animation = Animation;

	scope.DecentJS = DecentJS;
})(this);
