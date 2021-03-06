var DecentStickyContainer = function(message, options) {
  this._options = options || {};
  this._id = 'sticky_container_' + (Math.floor((Math.random() * 100) + 1)) + new Date().getTime();
  this._message = message;
  this._active = false;
  this._elementsToAvoid = [];
  this._classes = [];
  this.build();
};
DecentStickyContainer.isChrome = (function() {
  var determination = null;
  return function() {
    if (null === determination) {
      var isChromium = window.chrome, vendorName = window.navigator.vendor;
      if(isChromium !== null && isChromium !== undefined && vendorName === "Google Inc.") {
        determination = true;
      } else {
        determination = false;
      }
    }
    return determination;
  };
})();
DecentStickyContainer.prototype = {
  build: function() {
    var doc = document,
    body = doc.getElementsByTagName('body')[0],
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
    button.title = 'Close';
    button.innerHTML = 'x';
    button.onclick = (function(wrapper, container) {
      return function() {
        if (wrapper) {
          try {
              container.d(wrapper).fade(-1, function() {
                if (wrapper && wrapper.parentNode) {
                  wrapper.parentNode.removeChild(wrapper);
                }
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
   * Set the current location of the container element.
   *
   * @param [DecentStickyLocation] location
   */
  setCurrentLocation: function(location) {
    this._currentLocation = location;
    return this;
  },

  /**
   * Get the current location of the container element.
   *
   * @return [DecentStickyLocation]
   */
  getCurrentLocation: function() {
    return this._currentLocation;
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
      elTop, elBottom, dialogContainer = (DecentStickyContainer.isChrome() ? this.d.insideMatchingElement(this.getElement(), {nodeName: 'DIALOG'}) : null),
      dialogCoords = {top:0, right:0, left:0, bottom: 0};

      if (coords && ('undefined' != typeof coords.top)) {
        if (dialogContainer) {
          dialogCoords = dialogContainer.getBoundingClientRect();
          dialogContainer.appendChild(this.wrapper);
          scrollAmount = 0;
        }
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

          // if any part of the location overlaps an element to avoid, penalize it
          } else if (0 < this._elementsToAvoid.length) {
            (function(elementsToAvoid) {
              var j = elementsToAvoid.length,
              elCoords, avoidLocation;
              while(j--) {
                elCoords = elementsToAvoid[j].getBoundingClientRect();
                if ('undefined' != typeof elCoords.top) {
                  avoidLocation = new DecentStickyLocation(elCoords.top + scrollAmount, elCoords.right, elCoords.bottom + scrollAmount, elCoords.left);
                  if (avoidLocation && avoidLocation.overlapsWith(potentialLocations[i])) {
                    potentialLocations[i].setRanking(potentialLocations[i].getRanking() + 1000);
                  }
                }
              }
            })(this._elementsToAvoid);
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
        this.wrapper.style.top = potentialLocations[0].top - dialogCoords.top + 'px';
        this.wrapper.style.left = potentialLocations[0].left - dialogCoords.left + 'px';
        this.setCurrentLocation(potentialLocations[0]);
      } else {
        this.setOrientation('down');
        this.setCurrentLocation(null);
        this.wrapper.style.top = (elTop ? (elTop - this.getHeight() - 10): 0) - dialogCoords.top + 'px';
        this.wrapper.style.left = (coords.left ? coords.left - (this.getWidth() / 2) - dialogCoords.left : 0) + 'px';
      }
    }
    return this;
  },

  /**
   * Set additional, optional classes for the sticky container.
   *
   * @param [Array<String>] classes
   */
  setContainerClasses: function(classes) {
    if (this.wrapper && classes) {
      this.wrapper.className = this.wrapper.className + ' ' + classes.join(' ')
    }
    return this;
  },

  /**
   * Set a list of elements to avoid.
   *
   * @param [NodeList|Array<DOMElement>] elements Elements especially to avoid.
   */
  setElementsToAvoid: function(elements) {
    var i = elements.length;
    while(i--) {
      this._elementsToAvoid[this._elementsToAvoid.length] = elements[i];
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
    var action = new DecentStickyAction((function(self) {
      var theElement = self.getElement();
      return function() {
        if (self.wrapper) {
          (function(container) {
            var wrapper = container.wrapper;
            DecentStickyAction.lockElement(theElement);
            DecentJS(wrapper).fade(-1, function() {
              if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
                container._cleared = true;
                DecentStickyAction.unlockElement(theElement);
                DecentSticky.clearContainer(container.getId());
              }
            });
          })(self);
        }
      };
    })(this), this.getElement(), 'clear');
    action.schedule();
  },

  isCleared: function() {
    return !! this._cleared;
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
    var action = new DecentStickyAction((function(self, callback, now) {
      var theElement = self.getElement();
      return function() {
        if (self.wrapper) {
          if (now) {
            self.wrapper.style.display = 'none';
            callback.call(self);
            self._active = false;
          } else {
            DecentStickyAction.lockElement(theElement);
            self.d(self.wrapper).fade(-1, (function(container, callback) {
              return function() {
                if (container.wrapper) {
                  container.wrapper.style.display = 'none';
                  self._active = false;
                }
                DecentStickyAction.unlockElement(theElement);
                callback.call(container);
              };
            })(self, callback));
          }
        }
        return self;
      };
    })(this, callback, now), this.getElement(), 'hide');
    action.schedule();
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
    var action = new DecentStickyAction((function(self, callback, now) {
      var theElement = self.getElement();
      return function() {
        if (self.wrapper) {
          if (now) {
            self.wrapper.style.display = 'block';
            callback.call(self);
            self._active = true;
          } else {
            DecentStickyAction.lockElement(theElement);
            self.d(self.wrapper).fade(1, (function(container, callback) {
              return function() {
                if (container.wrapper) {
                  container.wrapper.style.display = 'block';
                }
                DecentStickyAction.unlockElement(theElement);
                callback.call(container);
                self._active = true;
              };
            })(self, callback));
          }
        }
        return self;
      };
    })(this, callback, now), this.getElement(), 'show');
    action.schedule();
  },

  isActive:function() {
    return !! this._active;
  },

  d:DecentJS
};
/**
 * Constructor for the sticky action.
 */
var DecentStickyAction = function(callback, el, actionType, delay) {
  actionType = actionType || null;
  this._callback = callback || function() {};
  this._id = 'sticky_action_' + (Math.floor((Math.random() * 100) + 1)) + new Date().getTime();
  if (this.d.arrayContains(['clear','hide','show'], actionType)) {
    this._actionType = actionType;
  }
  this._active = true;
  this._el = el;
  this._delay = delay || 200;
  this._atTime = null;
};
DecentStickyAction.actionQueue = [];
DecentStickyAction.lockedElements = [];
DecentStickyAction.elementIsLocked = function(el) {
  var i = DecentStickyAction.lockedElements.length,
  now = new Date().valueOf(),
  elIndex = null,
  isLocked = false,
  item;
  while(i--) {
    if ((item = DecentStickyAction.lockedElements[i]) && item.element && (item.element == el)) {
      elIndex = i;
      if (item.time && (now - item.time) < 2500) {
        isLocked = true;
      }
    }
  }
  // if the lock is stale, clear it out
  if (!isLocked && (null !== elIndex)) {
    DecentStickyAction.lockedElements.splice(elIndex, 1);
    // console.log('unlocked index because expired', elIndex);
  }
  return isLocked;
};
DecentStickyAction.lockElement = function(el) {
  if (!DecentStickyAction.elementIsLocked(el)) {
    DecentStickyAction.lockedElements[DecentStickyAction.lockedElements.length] = {element: el, time: new Date().valueOf()};
  }
};
DecentStickyAction.unlockElement = function(el) {
  var i, elIndex = null, item;
  for (i = 0; i < DecentStickyAction.lockedElements.length; i++) {
    if ((item = DecentStickyAction.lockedElements[i]) && item.element && (item.element == el)) {
      elIndex = i;
    }
  }
  if (null !== elIndex) {
    DecentStickyAction.lockedElements.splice(elIndex, 1);
  }
};
/**
 * Perform one of the actions.
 *
 * @param [DecentStickyAction] action
 */
DecentStickyAction.doAnAction = function(action) {
  var matchingElements = [], i, actionIndex, result;

  // get an array of actions relevant to the given action's element
  if (action.getElement()) {
    for (i = 0; i < DecentStickyAction.actionQueue.length; i++) {
      if (action.getElement() == DecentStickyAction.actionQueue[i].getElement()) {
        matchingElements[matchingElements.length] = DecentStickyAction.actionQueue[i];
      }
    }
    if (0 < matchingElements.length) {
      matchingElements.sort(function(a, b) {
        if (a.occurrenceTime() && b.occurrenceTime()) {
          return ((a.occurrenceTime() < b.occurrenceTime()) ? -1 : 1);
        } else {
          return 0;
        }
      });
      actionIndex = null;
      for (i = 0; i < matchingElements.length; i++) {
        if ((null === actionIndex) && action.getId() && (matchingElements[i].getId() == action.getId())) {
          actionIndex = i;
        } else if ((null != actionIndex) && (i > actionIndex)) {
          if (matchingElements[i].contravenes(action)) {
            action.deactivate();
          } else if (matchingElements[i].equals(action)) {
            matchingElements[i].deactivate();
          }
        }
      }

      if (!DecentStickyAction.elementIsLocked(action.getElement())) {
        result = action.act();
      }
      action.deactivate();
    }
  }
  return result;
};
DecentStickyAction.prototype = {
  /**
   * Do the action in this action, if not contravened or duplicated.
   */
  act: function() {
    if (this.isActive()) {
      return this._callback.call(this);
    }
  },

  /**
   * Whether the other sticky action contravenes this action.
   *
   * @param [DecentStickyAction] other
   *
   * @return [Boolean]
   */
  contravenes: function(other) {
    var self = this;
    if (
      (other.getElement() == self.getElement()) &&
      (other.getActionType() != self.getActionType())
    ) {
      if (
        (
          ('show' == self.getActionType()) &&
          self.d.arrayContains(['clear', 'hide'], other.getActionType())
        ) || (
          ('show' == other.getActionType()) &&
          other.d.arrayContains(['clear', 'hide'], self.getActionType())
        )
      ) {
        return true;
      }
    } else {
      return false;
    }
  },

  /**
   * Deactivate the action.
   */
  deactivate: function() {
    this._active = false;
    return this;
  },

  /**
   * Whether the other sticky action equals this action.
   *
   * @param [DecentStickyAction] other
   *
   * @return [Boolean]
   */
  equals: function(other) {
    var self = this;
    return (
      (other.getElement() == self.getElement()) &&
      (other.getActionType() == self.getActionType())
    );
  },

  /**
   * Get the action type associated with the sticky action.
   *
   * @return [String]
   */
  getActionType: function() {
    return this._actionType;
  },

  /**
   * Get the element associated with the sticky action.
   *
   * @return [DOMElement]
   */
  getElement: function() {
    return this._el;
  },

  /**
   * Get the Id of the action.
   *
   * @return [String]
   */
  getId: function() {
    return this._id;
  },

  isActive:function() {
    return !! this._active;
  },

  occurrenceTime: function() {
    return this._atTime;
  },

  /**
   * Schedule an action to occur.
   */
  schedule: function() {
    var self = this,
    occurrenceTime = new Date();
    DecentStickyAction.actionQueue[DecentStickyAction.actionQueue.length] = self;
    setTimeout((function(action) {
      return function() {
        if (action.isActive()) {
          return DecentStickyAction.doAnAction.call(this, action);
        } else {
          return null;
        }
      };
    })(self), self._delay);
    occurrenceTime.setMilliseconds(occurrenceTime.getMilliseconds() + self._delay);
    self._atTime = occurrenceTime;
    return self;
  },

  d:DecentJS
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
  },

  /**
   * Whether the location overlaps with the other given location.
   *
   * @param [DecentStickyLocation] other
   *
   * @return [Boolean] Whether the two locations overlap.
   */
  overlapsWith: function(other) {
    return !! (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }
};
/**
 * Create sticky notes.
 */
var DecentSticky = (function() {

  var decent = DecentJS,
  doc = document,
  w = window,
  containers = {},

  clearContainer = function(id) {
    if (containers[id]) {
      delete containers[id];
    }
  },

  /**
   * Clear all the stickies.
   */
  clearStickies = function() {
    for (var i in containers) {
      if (containers[i]) {
        containers[i].clear();
      }
    }
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
   * Get a sticky container associated with the given element.
   *
   * @param [DOMElement] el The element associated with the sticky message.
   *
   * @return [DecentStickyContainer]
   */
  getStickyFromElement = function(el) {
    for (var i in containers) {
      if (containers[i] && containers[i].getElement && (containers[i].getElement() == el)) {
        return containers[i];
      }
    }
    return null;
  },

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
        if (decent.arrayContains(['INPUT', 'LABEL', 'SELECT', 'TH'], element.nodeName)) {
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
   * @param [Object]     options Optional.  Options for the sticky element.
   */
  showStickyForElement = function(el, message, options) {
    options = options || {};
    if (el) {
      var container = new DecentStickyContainer(message);
      if (options.elementsToAvoid) {
        container.setElementsToAvoid(options.elementsToAvoid);
      }
      if (options.classes) {
        container.setContainerClasses(options.classes);
      }
      if (options.orientation) {
        container.setOrientation(options.orientation);
      }
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
    clearContainer:clearContainer,
    clearStickies:clearStickies,
    getElementWordDensity:getElementWordDensity,
    getPotentialLocations:getPotentialLocations,
    getStickyFromElement:getStickyFromElement,
    getTextDensity:getTextDensity,
    repositionStickiesDebouncedCallback:repositionStickiesDebouncedCallback,
    repositionStickies:repositionStickies,
    showStickyForElement:showStickyForElement,
    showStickyForId:showStickyForId,
    sortByRanking:sortByRanking,
    viewPortDimensions:viewPortDimensions
  };
})();
