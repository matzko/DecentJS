var DecentStickyContainer = function(message) {
	this._id = 'sticky_container_' + (Math.floor((Math.random() * 100) + 1)) + new Date().getTime();
	this._message = message;
	this.build();
};
DecentStickyContainer.prototype = {
	build: function() {
		var body = this.wc.getBodyElement(),
		doc = document,
		wrapper = doc.createElement('div'),
		innerContainer = doc.createElement('div');
		topArrow = doc.createElement('span'),
		bottomArrow = doc.createElement('span'),
		button = doc.createElement('button');

		topArrow.className = 'sticky-top-orientation-arrow sticky-orientation-arrow';
		bottomArrow.className = 'sticky-bottom-orientation-arrow sticky-orientation-arrow';

		innerContainer.innerHTML = this.getMessage();
		wrapper.appendChild(topArrow);
		wrapper.appendChild(innerContainer);
		wrapper.appendChild(bottomArrow);

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
	 * Position the sticky container near the given DOM Element.
	 *
	 * @param [DOMElement] el The element near which to position the sticky container.
	 */
	positionNearElement: function(el) {
		var coords = el.getBoundingClientRect(),
		aboveEl = !! (coords.top && (coords.top > (this.getHeight() + 10))),
		leftPos = coords.left ? coords.left - (this.getWidth() / 2) : 0,
		topPos = 0;
		if (aboveEl) {
			topPos = coords.top ? (coords.top - this.getHeight() - 10): 0;
			this.setOrientation('down');
		} else {
			if ('undefined' != typeof coords.bottom) {
				topPos = coords.bottom + 10;
			} else {
				topPos = el.offsetHeight + 10;
			}
			this.setOrientation('up');
		}
		this.wrapper.style.top = topPos + 'px';
		this.wrapper.style.left = leftPos + 'px';
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
			this.d.addClass(this.wrapper, 'orientation-up');
		} else if ('down' == direction) {
			this.d.removeClass(this.wrapper, 'orientation-up');
			this.d.addClass(this.wrapper, 'orientation-down');
		}
		return this;
	},

	/**
	 * Hide the container.
	 */
	hide: function() {
		if (this.wrapper) {
			this.wrapper.style.display = 'none';
		}
		return this;
	},

	/**
	 * Show the container.
	 */
	show: function() {
		if (this.wrapper) {
			this.wrapper.style.display = 'block';
		}
		return this;
	},

	d:DecentJS,
	wc:WeCounsel
};
/**
 * Create sticky notes.
 */
var DecentSticky = (function() {

	var wc = WeCounsel,
	decent = DecentJS,

	/**
	 * Show a sticky message for a given DOM element.
	 *
	 * @param [DOMElement] el      The element for which to show a sticky message.
	 * @param [String]     message The message to show.
	 */
	showStickyForElement = function(el, message) {
		if (el) {
			var container = new DecentStickyContainer(message);
			container.positionNearElement(el).show();
			return container;
		}
	};

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
	};

	return {
		showStickyForElement:showStickyForElement,
		showStickyForId:showStickyForId
	};
})();
