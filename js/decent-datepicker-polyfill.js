DecentDatepicker = (function(scope) {
	var d = document,
	w = window,
	has_native_datepicker = (function() {
		var result = null;
		return function() {
			if (null === result) {
				var input = d.createElement('input'),
				notADateValue = 'not-a-date';

				input.setAttribute('type','date');
				input.setAttribute('value', notADateValue); 

				result = !(input.value === notADateValue);
			}
			return result;
		}
	})(),

	DAY_MILLISECS = (1000 * 3600 * 24),
	
	inputContainers = {},

	/**
	 * Activate the calendar.
	 *
	 * @param [Date]       activeDate The date to show as active.
	 */
	activateCalendar = function(activeDate) {
		var input = this, container, wrapper, containerId,
		index = 'data-datepicker-container-id';
		if (
			input.getAttribute(index) &&
			inputContainers[input.getAttribute(index)]
			) {
				container = inputContainers[input.getAttribute(index)];
				wrapper = container.parentNode;
		} else {
			container = create('div', {'class': 'decent-calendar-datepicker'});
			wrapper = create('div', {'class': 'decent-datepicker-wrapper'});
			input.parentNode.insertBefore(wrapper, input);
			containerId = 'contid-' + (new Date().getTime());
			input.setAttribute(index, containerId);
			inputContainers[containerId] = container; 

			wrapper.appendChild(input);
			wrapper.appendChild(container);
		}
		container.style.display = 'none';
		container.innerHTML = '';
		container.appendChild(buildCalendar.call(input, container, activeDate.getFullYear(), activeDate.getMonth() + 1, activeDate.getDate()));
		container.style.display = 'block';
		container.style.top = input.offsetHeight + 'px';

		attachClickListener(d, (function(wrapper, container) {
			return function(evt) {
				var target = getEventTarget(evt), inCalendar = false;
				if (target && ! wrapper.contains(target)) {
					// Gotta check whether the click was done on a 
					// now-removed calendar item
					do {
						if (target.className && (-1 < target.className.indexOf('calendar-content'))) {
							inCalendar = true;
							break;
						}
						target = target.parentNode;
					} while(target);
					if (!inCalendar) {
						deactivateCalendar(container);
					}
				}
			};
		})(wrapper, container)); 
	},

	/**
	 * Attach a callback to a click event.
	 *
	 * @param [DOMElement] el       The element on which to listen for clicks.
	 * @param [Function]   callback The callback to execute when the element is clicked.
	 */
	attachClickListener = function(el, callback) {
		if (el.addEventListener) {
			el.addEventListener('click', callback, false);
		} else if (el.attachEvent) {
			el.attachEvent('onclick', function() { return callback.call(el, w.event);});
		}
	},
	
	/**
	 * Create the table element that is the calendar.
	 *
	 * @param [DOMElement] container The container for the datepicker.
	 * @param [Integer]    year      The year.
	 * @param [Integer]    month     The 1-based month (e.g. 1 for January).
	 * @param [Integer]    activeDay The active day of the month.
	 */
	buildCalendar = function(container, year, month, activeDay) {
		var input = this,
		calendar = create('div', {'class': 'calendar-content'}),
		navigationEl = create('div', {'class': 'calendar-navigation'}),
		table = create('table'),
		tBody = create('tbody'),
		tHead = create('thead'),

		// The JS month is zero-indexed
		jsMonth = ((month - 1) % 12),
		currentDay = new Date(),
		daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
		daysOfWeekAbbrev = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
		monthNames = [null,"January","February","March","April","May","June","July","August","September","October","November","December"],
		navigation = ['Prev', 'Next'],

		daysInMonth = new Date(year, month, 0).getDate(),
		firstDayOfMonth = new Date(year, jsMonth, 1),
		firstDayOfCalendar = new Date(firstDayOfMonth.getTime()),
		lastDayOfMonth = new Date(year, jsMonth, daysInMonth),
		lastDayOfCalendar = new Date(lastDayOfMonth.getTime()),
		day, weekEl, dayEl, link, dayClass, span,
		i,

		/**
		 * Callback for the situation in which a day of the month is clicked.
		 *
		 * @param [Integer] year  The year chosen.
		 * @param [Integer] month The month chosen.
		 * @param [Integer] day   The day chosen.
		 */
		dayClickCallback = function(year, month, day) {
			deactivateCalendar(container);
			this.value = year + '-' + (10 > month ? '0' + month : month) + '-' + (10 > day ? '0' + day : day);
			fireChangeEvent(this); 
		},

		navigateMonth = function(year, month) {
			activateCalendar.call(this, new Date(year, month - 1, 1));
		};

		link = create('a', {href: '#', 'class': 'prior-nav'});
		span = create('span');
		span.appendChild(d.createTextNode(navigation[0]));
		link.appendChild(span);
		attachClickListener(link, (function(input, priorYear, priorMonth) {
			return function(evt) {
				navigateMonth.call(input, priorYear, priorMonth); 
				stopDefault(evt);
			};
		})(input, ((1 == month) ? year - 1 : year), ((1 == month) ? 12 : (month - 1))));
		navigationEl.appendChild(link);

		span = create('div', {'class': 'calendar-title'});
		span.appendChild(d.createTextNode(monthNames[month] + ' ' + year));
		navigationEl.appendChild(span);

		link = create('a', {href: '#', 'class': 'next-nav'});
		span = create('span');
		span.appendChild(d.createTextNode(navigation[1]));
		link.appendChild(span);
		attachClickListener(link, (function(input, nextYear, nextMonth) {
			return function(evt) {
				navigateMonth.call(input, nextYear, nextMonth); 
				stopDefault(evt);
			};
		})(input, ((12 == month) ? year + 1 : year), ((12 == month) ? 1 : (month + 1))));
		navigationEl.appendChild(link);

		while(0 < firstDayOfCalendar.getDay()) {
			firstDayOfCalendar = new Date(firstDayOfCalendar.getTime() - DAY_MILLISECS);
		}
		while(6 > lastDayOfCalendar.getDay()) {
			lastDayOfCalendar = new Date(lastDayOfCalendar.getTime() + DAY_MILLISECS);
		}
		if (firstDayOfCalendar && lastDayOfCalendar) {
			weekEl = create('tr', {'class': 'weekdays'});
			for (i = 0; i < daysOfWeekAbbrev.length; i++) {
				dayEl = create('th', {'class': 'weekday-name', title: daysOfWeek[i]});
				dayEl.appendChild(d.createTextNode(daysOfWeekAbbrev[i]));
				weekEl.appendChild(dayEl);
			}
			tHead.appendChild(weekEl);
			day = new Date(firstDayOfCalendar.getTime());
			while (day.getTime() < (lastDayOfCalendar.getTime() + (DAY_MILLISECS / 2))) {
				if (0 == day.getDay()) {
					weekEl = create('tr', {'class': 'week'});
				}
				dayClass = 'day';
				if (day.getMonth() == firstDayOfMonth.getMonth()) {
					dayClass += ' active-month';
				} else if (day.getMonth() < firstDayOfMonth.getMonth()) {
					dayClass += ' prior-month';
				} else if (day.getMonth() > firstDayOfMonth.getMonth()) {
					dayClass += ' following-month';
				}
				if (
					((day.getMonth() + 1) == month) &&
					(day.getDate() == activeDay) &&
					(day.getFullYear() == year)
				) {
					dayClass += ' active-day';
				}
				if (
					(day.getMonth() == currentDay.getMonth()) &&
					(day.getDate() == currentDay.getDate()) &&
					(day.getFullYear() == currentDay.getFullYear())
				) {
					dayClass += ' current-day';
				}
				dayEl = create('td', {'class': dayClass, 'data-day': day.getDate(), 'data-month': day.getMonth() + 1, 'data-year': day.getFullYear()});
				link = create('a', {href: '#', 'class': 'day-select'});
				attachClickListener(link, (function(input, year, month, monthDay) {
					return function(ev) {
						dayClickCallback.call(input, year, month, monthDay);
						stopDefault(ev);
					};
				})(input, day.getFullYear(), day.getMonth() + 1, day.getDate()));
				link.appendChild(d.createTextNode(day.getDate()));
				dayEl.appendChild(link);
				weekEl.appendChild(dayEl);
				if (6 == day.getDay()) {
					tBody.appendChild(weekEl);
				}
				day = new Date(day.getTime() + DAY_MILLISECS);
			}
		}
		table.appendChild(tHead);
		table.appendChild(tBody);
		calendar.appendChild(navigationEl);
		calendar.appendChild(table);
		return calendar;
	}

	/**
	 * Create a DOM element.
	 *
	 * @param [String] name    The name of the element to create.
	 * @param [Object] attribs The attributes to give the element.
	 */
	create = function(name, attribs) { 
		attribs = attribs || {};
		var el = d.createElement(name),
		i;
		for (i in attribs) {
			el.setAttribute(i, attribs[i]);
			if ('class' == i) {
				el.className = attribs[i];
			}
		}
		return el;
	},

	/**
	 * De-activate the calendar.
	 *
	 * @param [DOMElement] container The calendar container.
	 */
	deactivateCalendar = function(container) {
		container.style.display = 'none';
	},

	/**
	 * Fire a change event on the input element.
	 *
	 * @param [DOMElement] input The input on which to fire the change event.
	 */
	fireChangeEvent = function(input) {
		var doc = d, event;
		if (input.ownerDocument) {
			doc = input.ownerDocument;
		}

		if (input.dispatchEvent) {
			event = doc.createEvent("HTMLEvents");
			event.initEvent('change', false, true);

			// allow detection of synthetic events
			event.synthetic = true;
			input.dispatchEvent(event, true);
			
		// IE
		} else if (input.fireEvent) {
			event = doc.createEventObject();
			event.synthetic = true;
			input.fireEvent("onchange", event);
		}
	},

	/**
	 * Get the target of the given event.
	 *
	 * @param [Event] e The event for which to get the target.
	 *
	 * @return [DOMElement] The target of the event.
	 */
	getEventTarget = function(e) {
		e = e || w.event;
		return e.target || e.srcElement;
	},

	/**
	 * Whether the element is a date input.
	 *
	 * @return [Boolean]
	 */
	isDateInput = function(el) {
		return !! (
			el.nodeName &&
			('INPUT' == el.nodeName.toUpperCase()) &&
			el.getAttribute('type') &&
			('date' == el.getAttribute('type').toLowerCase())
		)
	},

	stopDefault = function(evt) {
		if (evt.stopPropagation) {
			evt.stopPropagation();
		}
		evt.cancelBubble = true;
		if (evt.preventDefault) {
			evt.preventDefault();
		}
		evt.returnValue = false;
	},

	whenFocusing = function(evt) {
		var target = getEventTarget(evt), existingDate = new Date(), matches;
		if (isDateInput(target)) {
			if (target.value && (matches = /(\d\d\d\d)-(\d\d)-(\d\d)/.exec(target.value))) {
				existingDate = new Date(parseInt(matches[1], 10), ((parseInt(matches[2], 10) - 1) % 12), parseInt(matches[3], 10));
			}
			activateCalendar.call(target, existingDate);
		}
	},

	whenReady = function() {
		if (!DecentDatepicker.has_native_datepicker()) {
			listenForTriggeringEvents(d); 
		}
	},

	listenForTriggeringEvents = function(parentEl) {
		if (parentEl.addEventListener) {
			parentEl.addEventListener('focus',whenFocusing,true);
		} else if (parentEl.attachEvent) {
			parentEl.attachEvent('onfocusin', function() { return whenFocusing.call(parentEl, w.event);});
		}
	};
	if (w.addEventListener) {
		w.addEventListener('load',whenReady);
	} else if (w.attachEvent) {
		w.attachEvent('onload', function() { return whenReady.call(w, w.event);});
	}

	return {
		has_native_datepicker:has_native_datepicker,
		isDateInput:isDateInput
	}
})(this);
