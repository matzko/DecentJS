var DecentStickyContainer = function(message, options) {
	this._options = options || {};
	this._id = 'sticky_container_' + (Math.floor((Math.random() * 100) + 1)) + new Date().getTime();
	this._message = message;
	this._active = false;
	this.build();
};
DecentStickyContainer.prototype = {
	build: function() {
		var body = this.wc.getBodyElement(),
		doc = document,
		wrapper = doc.createElement('div'),
		innerContainer = doc.createElement('div');
		arrow = doc.createElement('span'),
		button = doc.createElement('button');

		arrow.className = 'sticky-orientation-arrow';

		innerContainer.innerHTML = this.getMessage();
		wrapper.appendChild(arrow);
		wrapper.appendChild(innerContainer);

		wrapper.style.display = 'block';
		wrapper.style.position = 'absolute';
		wrapper.style.visibility = 'hidden';
		wrapper.className = 'sticky-container';
		wrapper.id = this.getId();
		body.appendChild(wrapper);
		this.setHeight(wrapper.offsetHeight);
		this.setWidth(wrapper.offsetWidth);
		wrapper.style.display = 'none';
		wrapper.style.visibility = 'visible';

		button.className = 'close';
		button.title = this.wc.t('close_modal');
		button.innerHTML = 'x';
		button.onclick = (function(wrapper, container) {
			return function() {
				if (wrapper) {
					try {
							container.d(wrapper).fade(-1, function() {
								wrapper.parentNode.removeChild(wrapper);
							});
					} catch (e) {}
				}
				return false;
			}
		})(wrapper, this);
		wrapper.appendChild(button);

		this.wrapper = wrapper;
		return this;
	},

	/**
	 * Get the Id of the container.
	 *
	 * @return [String]
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Get the message of the container.
	 *
	 * @return [String]
	 */
	getMessage:function() {
		return this._message;
	},

	/**
	 * Set the associated element.
	 *
	 * @param [DOMElement] el
	 */
	setElement:function(el) {
		this._element = el;
		return this;
	},

	/**
	 * Get the associated element.
	 *
	 * @return [DOMElement]
	 */
	getElement:function() {
		return this._element;
	},

	/**
	 * Set the height of the container element.
	 *
	 * @param [Integer] height The height in pixels of the container.
	 */
	setHeight: function(height) {
		this._height = height;
		return this;
	},

	/**
	 * Get the height of the container element.
	 *
	 * @return [Integer] The height in pixels of the container.
	 */
	getHeight: function() {
		return this._height;
	},

	/**
	 * Set the width of the container element.
	 *
	 * @param [Integer] width The width in pixels of the container.
	 */
	setWidth: function(width) {
		this._width = width;
		return this;
	},

	/**
	 * Get the width of the container element.
	 *
	 * @return [Integer]
	 */
	getWidth: function() {
		return this._width;
	},

	/**
	 * Get the amount in pixels that the viewport has scrolled from the top of the document.
	 *
	 * @return [Integer]
	 */
	getVerticalScrollAmount: function() {
		var d = document,
		browserTop = 0;
		if ( d.documentElement && d.documentElement.scrollTop ) {
			browserTop = d.documentElement.scrollTop;
		} else if ( d.body && d.body.scrollTop ) {
			browserTop = d.body.scrollTop;
		} else if ( d.getElementsByTagName('body') ) {
			browserTop = d.getElementsByTagName('body')[0].scrollTop;
		}
		return browserTop;
	},

	/**
	 * Position the sticky container near the associated DOM Element.
	 */
	positionNearElement: function() {
		if (this.getElement() && document.body.contains(this.getElement())) {
			var coords = this.getElement().getBoundingClientRect(),
			potentialLocations = [], i,
			viewPortDimens = DecentSticky.viewPortDimensions(),
			scrollAmount = this.getVerticalScrollAmount(),
			elTop, elBottom;

			if (coords && ('undefined' != typeof coords.top)) {
				elTop = coords.top + scrollAmount;
				elBottom = coords.bottom + scrollAmount;
				potentialLocations = DecentSticky.getPotentialLocations(elTop, coords.right, elBottom, coords.left, this.getHeight(), this.getWidth());
				for (i = 0; i < potentialLocations.length; i++) {
					// set ranking as a factor of the word density
					potentialLocations[i].setRanking(potentialLocations[i].getRanking() + (DecentSticky.getTextDensity(
						potentialLocations[i].top,
						potentialLocations[i].right,
						potentialLocations[i].bottom,
						potentialLocations[i].left
					)));

					// if any part of the location is off the page, penalize it
					if (0 > potentialLocations[i].top || 0 > potentialLocations[i].left) {
						potentialLocations[i].setRanking(potentialLocations[i].getRanking() + 500);
					} else if (
						viewPortDimens.width && viewPortDimens.height && (
							potentialLocations[i].right > viewPortDimens.width ||
							potentialLocations[i].bottom > (scrollAmount + viewPortDimens.height) ||
							potentialLocations[i].top < scrollAmount
						)
					) {
						potentialLocations[i].setRanking(potentialLocations[i].getRanking() + 500);
					}
				}
				potentialLocations.sort(DecentSticky.sortByRanking);
			}
			if (potentialLocations && potentialLocations[0] && potentialLocations[0].getPosition()) {
				switch(potentialLocations[0].getPosition()) {
					case 'top' :
						this.setOrientation('down');
						break;
					case 'right' :
						this.setOrientation('left');
						break;
					case 'bottom' :
						this.setOrientation('up');
						break;
					case 'left' :
						this.setOrientation('right');
						break;
				}
				this.wrapper.style.top = potentialLocations[0].top + 'px';
				this.wrapper.style.left = potentialLocations[0].left + 'px';
			} else {
				this.setOrientation('down');
				this.wrapper.style.top = elTop ? (elTop - this.getHeight() - 10): 0;
				this.wrapper.style.left = coords.left ? coords.left - (this.getWidth() / 2) : 0;
			}
		}
		return this;
	},

	/**
	 * Set the orientation of the sticky.
	 * I.e. whether pointing up or down.
	 *
	 * @param [String] direction The direction that the sticky is pointing.
	 */
	setOrientation: function(direction) {
		if ('up' == direction) {
			this.d.removeClass(this.wrapper, 'orientation-down');
			this.d.removeClass(this.wrapper, 'orientation-left');
			this.d.removeClass(this.wrapper, 'orientation-right');
			this.d.addClass(this.wrapper, 'orientation-up');
		} else if ('down' == direction) {
			this.d.removeClass(this.wrapper, 'orientation-left');
			this.d.removeClass(this.wrapper, 'orientation-right');
			this.d.removeClass(this.wrapper, 'orientation-up');
			this.d.addClass(this.wrapper, 'orientation-down');
		} else if ('left' == direction) {
			this.d.removeClass(this.wrapper, 'orientation-down');
			this.d.removeClass(this.wrapper, 'orientation-right');
			this.d.removeClass(this.wrapper, 'orientation-up');
			this.d.addClass(this.wrapper, 'orientation-left');
		} else if ('right' == direction) {
			this.d.removeClass(this.wrapper, 'orientation-down');
			this.d.removeClass(this.wrapper, 'orientation-left');
			this.d.removeClass(this.wrapper, 'orientation-up');
			this.d.addClass(this.wrapper, 'orientation-right');
		}
		return this;
	},

	/**
	 * Clear the container from the DOM.
	 */
	clear: function() {
		if (this.wrapper) {
			var wrapper = this.wrapper;
			DecentJS(wrapper).fade(-1, function() {
				wrapper.parentNode.removeChild(wrapper);
			});
		}
	},

	/**
	 * Hide the container.
	 *
	 * @param [Function] callback Optional.  Invoke the function once hiding is done.
	 * @param [Boolean]  now      Optional.  Hide immediately instead of fading out.
	 */
	hide: function(callback, now) {
		now = !! now;
		callback = callback || function() {};
		if (this.wrapper) {
			if (now) {
				this.wrapper.style.display = 'none';
				callback.call(this);
				this._active = false;
			} else {
				this.d(this.wrapper).fade(-1, (function(container, callback) {
					return function() {
						if (container.wrapper) {
							container.wrapper.style.display = 'none';
							this._active = false;
						}
						callback.call(container);
					};
				})(this, callback));
			}
		}
		return this;
	},

	/**
	 * Show the container.
	 *
	 * @param [Function] callback Optional.  Invoke the function once showing is done.
	 * @param [Boolean]  now      Optional.  Show immediately instead of fading in.
	 */
	show: function(callback, now) {
		now = !! now;
		callback = callback || function() {};
		if (this.wrapper) {
			if (now) {
				this.wrapper.style.display = 'block';
				callback.call(this);
				this._active = true;
			} else {
				this.d(this.wrapper).fade(1, (function(container, callback) {
					return function() {
						if (container.wrapper) {
							container.wrapper.style.display = 'block';
						}
						callback.call(container);
						this._active = true;
					};
				})(this, callback));
			}
		}
		return this;
	},

	isActive:function() {
		return !! this._active;
	},

	d:DecentJS,
	wc:WeCounsel
};
/**
 * Constructor for the sticky location.
 */
var DecentStickyLocation = function(top, right, bottom, left) {
	this._prefRanking = 0;
	this.pos = '';
	this.top = top;
	this.right = right;
	this.bottom = bottom;
	this.left = left;
};
DecentStickyLocation.prototype = {
	/**
	 * Set the position of the location.
	 *
	 * @param [String] name
	 */
	setPosition: function(name) {
		this.pos = name;
		return this;
	},

	/**
	 * Get the position of the location.
	 *
	 * @return [String]
	 */
	getPosition: function() {
		return this.pos;
	},

	/**
	 * Set the preference ranking of this location.
	 *
	 * @param [Integer] pref
	 */
	setRanking: function(pref) {
		this._prefRanking = pref;
		return this;
	},

	/**
	 * Get the preference ranking of this location.
	 *
	 * @return [Integer]
	 */
	getRanking: function() {
		return this._prefRanking;
	}
};
/**
 * Create sticky notes.
 */
var DecentSticky = (function() {

	var wc = WeCounsel,
	decent = DecentJS,
	doc = document,
	w = window,
	containers = {},

	/**
	 * Clear all the stickies.
	 */
	clearStickies = function() {
		for (var i in containers) {
			if (containers[i]) {
				containers[i].clear();
			}
		}
		containers = {};
	},

	/**
	 * Get potential location areas.
	 *
	 * @param [Integer] targetTop
	 * @param [Integer] targetRight
	 * @param [Integer] targetBottom
	 * @param [Integer] targetLeft
	 * @param [Integer] stickyHeight
	 * @param [Integer] stickyWidth
	 *
	 * @return [Array<DecentStickyLocation>] An array of DecentStickyLocation objects.
	 */
	getPotentialLocations = function(targetTop, targetRight, targetBottom, targetLeft, stickyHeight, stickyWidth) {
		var bufferAmount = 10,
		options = [], x, y;

		/** The top area **/
		x = (((targetRight - targetLeft) / 2) + targetLeft) - (stickyWidth / 2);
		y = targetTop - (bufferAmount + stickyHeight);
		options[options.length] = (new DecentStickyLocation(y, x + stickyWidth, y + stickyHeight, x)).setPosition('top');
		/** 10 pixels higher **/
		options[options.length] = (new DecentStickyLocation(y - 10, x + stickyWidth, y + stickyHeight - 10, x)).setPosition('top');
		/** 20 pixels higher **/
		options[options.length] = (new DecentStickyLocation(y - 20, x + stickyWidth, y + stickyHeight - 20, x)).setPosition('top');

		/** The right area **/
		x = targetRight + bufferAmount;
		y = (((targetBottom - targetTop) / 2) + targetTop) - (stickyHeight / 2);
		options[options.length] = (new DecentStickyLocation(y, x + stickyWidth, y + stickyHeight, x)).setPosition('right');
		/** 10 pixels farther to the right **/
		options[options.length] = (new DecentStickyLocation(y, x + stickyWidth + 10, y + stickyHeight, x + 10)).setPosition('right');
		/** 20 pixels farther to the right **/
		options[options.length] = (new DecentStickyLocation(y, x + stickyWidth + 20, y + stickyHeight, x + 20)).setPosition('right');

		/** The bottom area **/
		x = (((targetRight - targetLeft) / 2) + targetLeft) - (stickyWidth / 2);
		y = targetBottom + bufferAmount;
		options[options.length] = (new DecentStickyLocation(y, x + stickyWidth, y + stickyHeight, x)).setPosition('bottom');

		/** The left area **/
		x = targetLeft - (stickyWidth + bufferAmount);
		y = (((targetBottom - targetTop) / 2) + targetTop) - (stickyHeight / 2);
		options[options.length] = (new DecentStickyLocation(y, (x + stickyWidth), (y + stickyHeight), x)).setPosition('left');
		/** 10 pixels farther to the left **/
		options[options.length] = (new DecentStickyLocation(y, (x + stickyWidth - 10), (y + stickyHeight), x - 10)).setPosition('left');
		/** 20 pixels farther to the left **/
		options[options.length] = (new DecentStickyLocation(y, (x + stickyWidth - 20), (y + stickyHeight), x - 20)).setPosition('left');

		return options;
	},

	/**
	 * Get an element's text density.
	 *
	 * @param [DOMElement] el The element.
	 *
	 * @return [Float] The ratio of word characters to pixel area.
	 */
	getElementWordDensity = function(el) {
		var area = el.offsetWidth * el.offsetHeight, theText;
		if ((0 < area) && el) {
			if ('undefined' != typeof el.textContent) {
				theText = el.textContent;
			} else if ('undefined' != typeof el.innerText) {
				theText = el.innerText;
			} else {
				theText = '';
			}

			return (theText.replace(/[\W]/g, '').length / area);
		} else {
			return 0;
		}
	},

	/**
	 * Reposition all the stickies.
	 */
	repositionStickies = function() {
		for (var i in containers) {
			(function(container) {
				container.hide(function() {
					this.positionNearElement().show();
				}, ! container.isActive());
			})(containers[i]);
		}
	},

	/**
	 * Reposition all of the stickies, but not too often.
	 */
	repositionStickiesDebouncedCallback = (function() {
		return decent.debounce(repositionStickies, 500);
	})(),

	/**
	 * Calculate the density of text in a given area.
	 *
	 * @param [Integer] top    The left top coordinate.
	 * @param [Integer] right  The right top coordinate.
	 * @param [Integer] bottom The right bottom coordinate.
	 * @param [Integer] left   The left top coordinate.
	 */
	getTextDensity = function(top, right, bottom, left) {
		/** Want to get the average text density from four spots 25% inside the area. **/
		var samples = [], x, y, element,
		samplePercs = [[.25, .25], [.75, .25], [.75, .75], [.25, .75], [.5, 0], [1, .5], [.5, .5], [0, .5], [0, 1]],
		i = samplePercs.length, sum = 0,
		density;

		while(i--) {
			x = left + ((right - left) * samplePercs[i][0]);
			y = top + ((bottom - top) * samplePercs[i][1]);
			element = doc.elementFromPoint(x, y);
			if (element) {
				density = (10000 * getElementWordDensity(element));
				/** Increase the density if the element is a UI element. **/
				if (wc.arrayContains(['INPUT', 'LABEL', 'SELECT', 'TH'], element.nodeName)) {
					density += 50;
				}
				samples[samples.length] = density;
			}
		}

		i = samples.length;
		if (0 < i) {
			while(i--) {
				sum += samples[i];
			}
			return (sum / samples.length);
		} else {
			return 0;
		}
	},

	/**
	 * Show a sticky message for a given DOM element.
	 *
	 * @param [DOMElement] el      The element for which to show a sticky message.
	 * @param [String]     message The message to show.
	 */
	showStickyForElement = function(el, message) {
		if (el) {
			var container = new DecentStickyContainer(message);
			containers[container.getId()] = container;
			container.setElement(el);
			repositionStickiesDebouncedCallback();
			return container;
		}
	},

	/**
	 * Show a sticky message for a given Id.
	 *
	 * @param [String] id      The Id of the item to show a message for.
	 * @param [String] message The message to show.
	 */
	showStickyForId = function(id, message) {
		var el = decent.gebid(id);
		if (el) {
			return showStickyForElement(el, message);
		}
	},

	/**
	 * Sort the given locations by their ranking.
	 *
	 * @param [DecentStickyLocation] a The first location to compare.
	 * @param [DecentStickyLocation] b The second location to compare.
	 *
	 * @return [Integer] -1 if a before b, 1 if b before a, 0 if equal.
	 */
	sortByRanking = function(a, b) {
		if (a.getRanking() == b.getRanking()) {
			return 0;
		} else if (a.getRanking() < b.getRanking()) {
			return -1;
		} else {
			return 1;
		}
	},

	viewPortDimensions = function() {
		var e = w, a = 'inner';
		if (!( 'innerWidth' in w)) {
			a = 'client';
			e = doc.documentElement || doc.body;
		}
		return {width: e[ a+'Width' ], height: e[ a+'Height' ]}
	};

	return {
		clearStickies:clearStickies,
		getElementWordDensity:getElementWordDensity,
		getPotentialLocations:getPotentialLocations,
		getTextDensity:getTextDensity,
		repositionStickiesDebouncedCallback:repositionStickiesDebouncedCallback,
		repositionStickies:repositionStickies,
		showStickyForElement:showStickyForElement,
		showStickyForId:showStickyForId,
		sortByRanking:sortByRanking,
		viewPortDimensions:viewPortDimensions
	};
})();
