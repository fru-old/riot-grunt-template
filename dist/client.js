
// Public Properties

var __commonjs_modules = {};
var __commonjs_factories = {};

// Public Methods

function defineModule(id, factory) { 
	id = id.replace(/\/index$/, '');
	__commonjs_factories[id] = factory; 
} 

function require(id) {
	var modules = __commonjs_modules;
	var factories = __commonjs_factories; 

	// This converts relative paths into absolute module names
	function normalize(id, base){
	
		// Some code golf to get the number of "directories" of the id back.
		var dots = /(\.?\.\/?)*/.exec(id)[0];
		var dirCount = Math.floor(dots.replace(/\//g, '').length/1.9 + 0.99);

		if(dirCount){
			// Reduce base by found number of "directories"
			var reduced = base.split('/');
			reduced = reduced.slice(0, reduced.length - dirCount)
			reduced = reduced.join('/');
			
			if(reduced){
				id = reduced + '/' + id.slice(dots.length);
			}
		}
		return id.replace(/\/$/, '');
	}

	if (!modules[id]){		
		var message = "Could not load module: '"+id+"'";
		if(!factories[id])throw new Error(message);

		// creates custome require function
		var customeRequire = function(newid){
			return require(normalize(newid, id));
		}
		
		// This stops infinite recursion with circular dependencies
		modules[id] = {};

		var module = {exports: {}};
		factories[id](customeRequire, module.exports, module);
		modules[id] = module.exports;
	}
	
	return modules[id];
}
(function () {
/**
	Basics
	======
    
    xui is available as the global `x$` function. It accepts a CSS selector string or DOM element, or an array of a mix of these, as parameters,
    and returns the xui object. For example:
    
        var header = x$('#header'); // returns the element with id attribute equal to "header".
        
    For more information on CSS selectors, see the [W3C specification](http://www.w3.org/TR/CSS2/selector.html). Please note that there are
    different levels of CSS selector support (Levels 1, 2 and 3) and different browsers support each to different degrees. Be warned!
    
	The functions described in the docs are available on the xui object and often manipulate or retrieve information about the elements in the
	xui collection.

*/
var undefined,
    xui,
    window     = this,
    string     = new String('string'), // prevents Goog compiler from removing primative and subsidising out allowing us to compress further
    document   = window.document,      // obvious really
    simpleExpr = /^#?([\w-]+)$/,   // for situations of dire need. Symbian and the such        
    idExpr     = /^#/,
    tagExpr    = /<([\w:]+)/, // so you can create elements on the fly a la x$('<img href="/foo" /><strong>yay</strong>')
    slice      = function (e) { return [].slice.call(e, 0); };
    try { var a = slice(document.documentElement.childNodes)[0].nodeType; }
    catch(e){ slice = function (e) { var ret=[]; for (var i=0; e[i]; i++) ret.push(e[i]); return ret; }; }

window.x$ = window.xui = xui = function(q, context) {
    return new xui.fn.find(q, context);
};

// patch in forEach to help get the size down a little and avoid over the top currying on event.js and dom.js (shortcuts)
if (! [].forEach) {
    Array.prototype.forEach = function(fn) {
        var len = this.length || 0,
            i = 0,
            that = arguments[1]; // wait, what's that!? awwww rem. here I thought I knew ya!
                                 // @rem - that that is a hat tip to your thats :)

        if (typeof fn == 'function') {
            for (; i < len; i++) {
                fn.call(that, this[i], i, this);
            }
        }
    };
}
/* 
 * Patch indexOf for internet explorer: http://soledadpenades.com/2007/05/17/arrayindexof-in-internet-explorer/ 
 */
if(!Array.indexOf){
  Array.prototype.indexOf = function(obj) {
    for(var i = 0; i < this.length; i++) {
      if(this[i] == obj){
          return i;
      }
    }
    return -1;
  }
}
/*
 * Array Remove - By John Resig (MIT Licensed) 
 */
function removex(array, from, to) {
    var rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from: from;
    return array.push.apply(array, rest);
}

// converts all CSS style names to DOM style names, i.e. margin-left to marginLeft
function domstyle(name) {
  return name.replace(/\-[a-z]/g,function(m) { return m.charAt(1).toUpperCase(); });
}

// converts all DOM style names to CSS style names, i.e. marginLeft to margin-left
function cssstyle(name) {
  return name.replace(/[A-Z]/g, function(m) { return '-'+m.toLowerCase(); })
}

xui.fn = xui.prototype = {

/**
	extend
	------

	Extends XUI's prototype with the members of another object.

	### syntax ###

		xui.extend( object );

	### arguments ###

	- object `Object` contains the members that will be added to XUI's prototype.
 
	### example ###

	Given:

		var sugar = {
		    first: function() { return this[0]; },
		    last:  function() { return this[this.length - 1]; }
		}

	We can extend xui's prototype with members of `sugar` by using `extend`:

		xui.extend(sugar);

	Now we can use `first` and `last` in all instances of xui:

		var f = x$('.button').first();
		var l = x$('.notice').last();
*/
    extend: function(o) {
        for (var i in o) {
            xui.fn[i] = o[i];
        }
    },

/**
	find
	----

	Find the elements that match a query string. `x$` is an alias for `find`.

	### syntax ###

		x$( window ).find( selector, context );

	### arguments ###

	- selector `String` is a CSS selector that will query for elements.
	- context `HTMLElement` is the parent element to search from _(optional)_.
 
	### example ###

	Given the following markup:

		<ul id="first">
		    <li id="one">1</li>
		    <li id="two">2</li>
		</ul>
		<ul id="second">
		    <li id="three">3</li>
		    <li id="four">4</li>
		</ul>

	We can select list items using `find`:

		x$('li');                 // returns all four list item elements.
		x$('#second').find('li'); // returns list items "three" and "four"
*/
    find: function(q, context) {
        var ele = [], tempNode;
            
        if (!q) {
            return this;
        } else if (context == undefined && this.length) {
            ele = this.each(function(el) {
                ele = ele.concat(slice(xui(q, el)));
            }).reduce(ele);
        } else {
            context = context || document;
            // fast matching for pure ID selectors and simple element based selectors
            if (typeof q == string) {
              if (simpleExpr.test(q) && context.getElementById && context.getElementsByTagName) {
                  ele = idExpr.test(q) ? [context.getElementById(q.substr(1))] : context.getElementsByTagName(q);
                  // nuke failed selectors
                  if (ele[0] == null) { 
                    ele = [];
                  }
              // match for full html tags to create elements on the go
              } else if (tagExpr.test(q)) {
                  tempNode = document.createElement('i');
                  tempNode.innerHTML = q;
                  slice(tempNode.childNodes).forEach(function (el) {
                    ele.push(el);
                  });
              } else {
                  // one selector, check if Sizzle is available and use it instead of querySelectorAll.
                  if (window.Sizzle !== undefined) {
                    ele = Sizzle(q, context);
                  } else {
                    ele = context.querySelectorAll(q);
                  }
              }
              // blanket slice
              ele = slice(ele);
            } else if (q instanceof Array) {
                ele = q;
            } else if (q.nodeName || q === window) { // only allows nodes in
                // an element was passed in
                ele = [q];
            } else if (q.toString() == '[object NodeList]' ||
q.toString() == '[object HTMLCollection]' || typeof q.length == 'number') {
                ele = slice(q);
            }
        }
        // disabling the append style, could be a plugin (found in more/base):
        // xui.fn.add = function (q) { this.elements = this.elements.concat(this.reduce(xui(q).elements)); return this; }
        return this.set(ele);
    },

/**
	set
	---

	Sets the objects in the xui collection.

	### syntax ###

		x$( window ).set( array );
*/
    set: function(elements) {
        var ret = xui();
        ret.cache = slice(this.length ? this : []);
        ret.length = 0;
        [].push.apply(ret, elements);
        return ret;
    },

/**
	reduce
	------

	Reduces the set of elements in the xui object to a unique set.

	### syntax ###

		x$( window ).reduce( elements, index );

	### arguments ###

	- elements `Array` is an array of elements to reduce _(optional)_.
	- index `Number` is the last array index to include in the reduction. If unspecified, it will reduce all elements _(optional)_.
*/
    reduce: function(elements, b) {
        var a = [],
        elements = elements || slice(this);
        elements.forEach(function(el) {
            // question the support of [].indexOf in older mobiles (RS will bring up 5800 to test)
            if (a.indexOf(el, 0, b) < 0)
            a.push(el);
        });

        return a;
    },

/**
	has
	---

	Returns the elements that match a given CSS selector.

	### syntax ###

		x$( window ).has( selector );

	### arguments ###

	- selector `String` is a CSS selector that will match all children of the xui collection.

	### example ###

	Given:

		<div>
		    <div class="round">Item one</div>
		    <div class="round">Item two</div>
		</div>
	
	We can use `has` to select specific objects:

		var divs    = x$('div');          // got all three divs.
		var rounded = divs.has('.round'); // got two divs with the class .round
*/
     has: function(q) {
         var list = xui(q);
         return this.filter(function () {
             var that = this;
             var found = null;
             list.each(function (el) {
                 found = (found || el == that);
             });
             return found;
         });
     },

/**
	filter
	------

	Extend XUI with custom filters. This is an interal utility function, but is also useful to developers.

	### syntax ###

		x$( window ).filter( fn );

	### arguments ###

	- fn `Function` is called for each element in the XUI collection.

	        // `index` is the array index of the current element
	        function( index ) {
	            // `this` is the element iterated on
	            // return true to add element to new XUI collection
	        }

	### example ###

	Filter all the `<input />` elements that are disabled:

		x$('input').filter(function(index) {
		    return this.checked;
		});
*/
    filter: function(fn) {
        var elements = [];
        return this.each(function(el, i) {
            if (fn.call(el, i)) elements.push(el);
        }).set(elements);
    },

/**
	not
	---

	The opposite of `has`. It modifies the elements and returns all of the elements that do __not__ match a CSS query.

	### syntax ###

		x$( window ).not( selector );

	### arguments ###

	- selector `String` a CSS selector for the elements that should __not__ be matched.

	### example ###

	Given:

		<div>
		    <div class="round">Item one</div>
		    <div class="round">Item two</div>
		    <div class="square">Item three</div>
		    <div class="shadow">Item four</div>
		</div>

	We can use `not` to select objects:

		var divs     = x$('div');          // got all four divs.
		var notRound = divs.not('.round'); // got two divs with classes .square and .shadow
*/
    not: function(q) {
        var list = slice(this),
            omittedNodes = xui(q);
        if (!omittedNodes.length) {
            return this;
        }
        return this.filter(function(i) {
            var found;
            omittedNodes.each(function(el) {
                return found = list[i] != el;
            });
            return found;
        });
    },

/**
	each
	----

	Element iterator for an XUI collection.

	### syntax ###

		x$( window ).each( fn )

	### arguments ###

	- fn `Function` callback that is called once for each element.

		    // `element` is the current element
		    // `index` is the element index in the XUI collection
		    // `xui` is the XUI collection.
		    function( element, index, xui ) {
		        // `this` is the current element
		    }

	### example ###

		x$('div').each(function(element, index, xui) {
		    alert("Here's the " + index + " element: " + element);
		});
*/
    each: function(fn) {
        // we could compress this by using [].forEach.call - but we wouldn't be able to support
        // fn return false breaking the loop, a feature I quite like.
        for (var i = 0, len = this.length; i < len; ++i) {
            if (fn.call(this[i], this[i], i, this) === false)
            break;
        }
        return this;
    }
};

xui.fn.find.prototype = xui.fn;
xui.extend = xui.fn.extend;
/**
	DOM
	===

	Set of methods for manipulating the Document Object Model (DOM).

*/
xui.extend({
/**
	html
	----

	Manipulates HTML in the DOM. Also just returns the inner HTML of elements in the collection if called with no arguments.

	### syntax ###

		x$( window ).html( location, html );

	or this method will accept just a HTML fragment with a default behavior of inner:

		x$( window ).html( html );

	or you can use shorthand syntax by using the location name argument as the function name:

		x$( window ).outer( html );
		x$( window ).before( html );
	
	or you can just retrieve the inner HTML of elements in the collection with:
	
	    x$( document.body ).html();

	### arguments ###

	- location `String` can be one of: _inner_, _outer_, _top_, _bottom_, _remove_, _before_ or _after_.
	- html `String` is a string of HTML markup or a `HTMLElement`.

	### example ###

		x$('#foo').html('inner', '<strong>rock and roll</strong>');
		x$('#foo').html('outer', '<p>lock and load</p>');
		x$('#foo').html('top',   '<div>bangers and mash</div>');
		x$('#foo').html('bottom','<em>mean and clean</em>');
		x$('#foo').html('remove');
		x$('#foo').html('before', '<p>some warmup html</p>');
		x$('#foo').html('after',  '<p>more html!</p>');

	or

		x$('#foo').html('<p>sweet as honey</p>');
		x$('#foo').outer('<p>free as a bird</p>');
		x$('#foo').top('<b>top of the pops</b>');
		x$('#foo').bottom('<span>bottom of the barrel</span>');
		x$('#foo').before('<pre>first in line</pre>');
		x$('#foo').after('<marquee>better late than never</marquee>');
*/
    html: function(location, html) {
        clean(this);

        if (arguments.length == 0) {
            var i = [];
            this.each(function(el) {
                i.push(el.innerHTML);
            });
            return i;
        }
        if (arguments.length == 1 && arguments[0] != 'remove') {
            html = location;
            location = 'inner';
        }
        if (location != 'remove' && html && html.each !== undefined) {
            if (location == 'inner') {
                var d = document.createElement('p');
                html.each(function(el) {
                    d.appendChild(el);
                });
                this.each(function(el) {
                    el.innerHTML = d.innerHTML;
                });
            } else {
                var that = this;
                html.each(function(el){
                    that.html(location, el);
                });
            }
            return this;
        }
        return this.each(function(el) {
            var parent, 
                list, 
                len, 
                i = 0;
            if (location == "inner") { // .html
                if (typeof html == string || typeof html == "number") {
                    el.innerHTML = html;
                    list = el.getElementsByTagName('SCRIPT');
                    len = list.length;
                    for (; i < len; i++) {
                        eval(list[i].text);
                    }
                } else {
                    el.innerHTML = '';
                    el.appendChild(html);
                }
            } else {
              if (location == 'remove') {
                el.parentNode.removeChild(el);
              } else {
                var elArray = ['outer', 'top', 'bottom'],
                    wrappedE = wrapHelper(html, (elArray.indexOf(location) > -1 ? el : el.parentNode )),
                    children = wrappedE.childNodes;
                if (location == "outer") { // .replaceWith
                  el.parentNode.replaceChild(wrappedE, el);
                } else if (location == "top") { // .prependTo
                    el.insertBefore(wrappedE, el.firstChild);
                } else if (location == "bottom") { // .appendTo
                    el.insertBefore(wrappedE, null);
                } else if (location == "before") { // .insertBefore
                    el.parentNode.insertBefore(wrappedE, el);
                } else if (location == "after") { // .insertAfter
                    el.parentNode.insertBefore(wrappedE, el.nextSibling);
                }
                var parent = wrappedE.parentNode;
                while(children.length) {
                  parent.insertBefore(children[0], wrappedE);
                }
                parent.removeChild(wrappedE);
              }
            }
        });
    },

/**
	attr
	----

	Gets or sets attributes on elements. If getting, returns an array of attributes matching the xui element collection's indices.

	### syntax ###

		x$( window ).attr( attribute, value );

	### arguments ###

	- attribute `String` is the name of HTML attribute to get or set.
	- value `Varies` is the value to set the attribute to. Do not use to get the value of attribute _(optional)_.

	### example ###

	To get an attribute value, simply don't provide the optional second parameter:

		x$('.someClass').attr('class');

	To set an attribute, use both parameters:

		x$('.someClass').attr('disabled', 'disabled');
*/
    attr: function(attribute, val) {
        if (arguments.length == 2) {
            return this.each(function(el) {
                if (el.tagName && el.tagName.toLowerCase() == 'input' && attribute == 'value') el.value = val;
                else if (el.setAttribute) {
                  if (attribute == 'checked' && (val == '' || val == false || typeof val == "undefined")) el.removeAttribute(attribute);
                  else el.setAttribute(attribute, val);
                }
            });
        } else {
            var attrs = [];
            this.each(function(el) {
                if (el.tagName && el.tagName.toLowerCase() == 'input' && attribute == 'value') attrs.push(el.value);
                else if (el.getAttribute && el.getAttribute(attribute)) {
                    attrs.push(el.getAttribute(attribute));
                }
            });
            return attrs;
        }
    }
});
"inner outer top bottom remove before after".split(' ').forEach(function (method) {
  xui.fn[method] = function(where) { return function (html) { return this.html(where, html); }; }(method);
});
// private method for finding a dom element
function getTag(el) {
    return (el.firstChild === null) ? {'UL':'LI','DL':'DT','TR':'TD'}[el.tagName] || el.tagName : el.firstChild.tagName;
}

function wrapHelper(html, el) {
  if (typeof html == string) return wrap(html, getTag(el));
  else { var e = document.createElement('div'); e.appendChild(html); return e; }
}

// private method
// Wraps the HTML in a TAG, Tag is optional
// If the html starts with a Tag, it will wrap the context in that tag.
function wrap(xhtml, tag) {
  var e = document.createElement('div');
  e.innerHTML = xhtml;
  return e;
}

/*
* Removes all erronious nodes from the DOM.
* 
*/
function clean(collection) {
    var ns = /\S/;
    collection.each(function(el) {
        var d = el,
            n = d.firstChild,
            ni = -1,
            nx;
        while (n) {
            nx = n.nextSibling;
            if (n.nodeType == 3 && !ns.test(n.nodeValue)) {
                d.removeChild(n);
            } else {
                n.nodeIndex = ++ni; // FIXME not sure what this is for, and causes IE to bomb (the setter) - @rem
            }
            n = nx;
        }
    });
}
/**
	Event
	=====

	A good old fashioned events with new skool handling. Shortcuts exist for:

	- click
	- load
	- touchstart
	- touchmove
	- touchend
	- touchcancel
	- gesturestart
	- gesturechange
	- gestureend
	- orientationchange
	
*/
xui.events = {}; var cache = {};
xui.extend({

/**
	on
	--

	Registers a callback function to a DOM event on the element collection.

	### syntax ###

		x$( 'button' ).on( type, fn );

	or

		x$( 'button' ).click( fn );

	### arguments ###

	- type `String` is the event to subscribe (e.g. _load_, _click_, _touchstart_, etc).
	- fn `Function` is a callback function to execute when the event is fired.

	### example ###

		x$( 'button' ).on( 'click', function(e) {
		    alert('hey that tickles!');
		});

	or

		x$(window).load(function(e) {
		  x$('.save').touchstart( function(evt) { alert('tee hee!'); }).css(background:'grey');
		});
*/
    on: function(type, fn, details) {
        return this.each(function (el) {
            if (xui.events[type]) {
                var id = _getEventID(el), 
                    responders = _getRespondersForEvent(id, type);
                
                details = details || {};
                details.handler = function (event, data) {
                    xui.fn.fire.call(xui(this), type, data);
                };
                
                // trigger the initialiser - only happens the first time around
                if (!responders.length) {
                    xui.events[type].call(el, details);
                }
            } 
            el.addEventListener(type, _createResponder(el, type, fn), false);
        });
    },

/**
	un
	--

	Unregisters a specific callback, or if no specific callback is passed in, 
	unregisters all event callbacks of a specific type.

	### syntax ###

	Unregister the given function, for the given type, on all button elements:

		x$( 'button' ).un( type, fn );

	Unregisters all callbacks of the given type, on all button elements:

		x$( 'button' ).un( type );

	### arguments ###

	- type `String` is the event to unsubscribe (e.g. _load_, _click_, _touchstart_, etc).
	- fn `Function` is the callback function to unsubscribe _(optional)_.

	### example ###

		// First, create a click event that display an alert message
		x$('button').on('click', function() {
		    alert('hi!');
		});
		
		// Now unsubscribe all functions that response to click on all button elements
		x$('button').un('click');

	or

		var greeting = function() { alert('yo!'); };
		
		x$('button').on('click', greeting);
		x$('button').on('click', function() {
		    alert('hi!');
		});
		
		// When any button is clicked, the 'hi!' message will fire, but not the 'yo!' message.
		x$('button').un('click', greeting);
*/
    un: function(type, fn) {
        return this.each(function (el) {
            var id = _getEventID(el), responders = _getRespondersForEvent(id, type), i = responders.length;

            while (i--) {
                if (fn === undefined || fn.guid === responders[i].guid) {
                    el.removeEventListener(type, responders[i], false);
                    removex(cache[id][type], i, 1);
                }
            }

            if (cache[id][type].length === 0) delete cache[id][type];
            for (var t in cache[id]) {
                return;
            }
            delete cache[id];
        });
    },

/**
	fire
	----

	Triggers a specific event on the xui collection.

	### syntax ###

		x$( selector ).fire( type, data );

	### arguments ###

	- type `String` is the event to fire (e.g. _load_, _click_, _touchstart_, etc).
	- data `Object` is a JSON object to use as the event's `data` property.

	### example ###

		x$('button#reset').fire('click', { died:true });
		
		x$('.target').fire('touchstart');
*/
    fire: function (type, data) {
        return this.each(function (el) {
            if (el == document && !el.dispatchEvent)
                el = document.documentElement;

            var event = document.createEvent('HTMLEvents');
            event.initEvent(type, true, true);
            event.data = data || {};
            event.eventName = type;
          
            el.dispatchEvent(event);
  	    });
  	}
});

"click load submit touchstart touchmove touchend touchcancel gesturestart gesturechange gestureend orientationchange".split(' ').forEach(function (event) {
  xui.fn[event] = function(action) { return function (fn) { return fn ? this.on(action, fn) : this.fire(action); }; }(event);
});

// patched orientation support - Andriod 1 doesn't have native onorientationchange events
xui(window).on('load', function() {
    if (!('onorientationchange' in document.body)) {
      (function (w, h) {
        xui(window).on('resize', function () {
          var portraitSwitch = (window.innerWidth < w && window.innerHeight > h) && (window.innerWidth < window.innerHeight),
              landscapeSwitch = (window.innerWidth > w && window.innerHeight < h) && (window.innerWidth > window.innerHeight);
          if (portraitSwitch || landscapeSwitch) {
            window.orientation = portraitSwitch ? 0 : 90; // what about -90? Some support is better than none
            xui('body').fire('orientationchange'); // will this bubble up?
            w = window.innerWidth;
            h = window.innerHeight;
          }
        });
      })(window.innerWidth, window.innerHeight);
    }
});

// this doesn't belong on the prototype, it belongs as a property on the xui object
xui.touch = (function () {
  try{
    return !!(document.createEvent("TouchEvent").initTouchEvent)
  } catch(e) {
    return false;
  };
})();

/**
	ready
	----

  Event handler for when the DOM is ready. Thank you [domready](http://www.github.com/ded/domready)!

	### syntax ###

		x$.ready(handler);

	### arguments ###

	- handler `Function` event handler to be attached to the "dom is ready" event.

	### example ###

    x$.ready(function() {
      alert('mah doms are ready');
    });

    xui.ready(function() {
      console.log('ready, set, go!');
    });
*/
xui.ready = function(handler) {
  domReady(handler);
}

// lifted from Prototype's (big P) event model
function _getEventID(element) {
    if (element._xuiEventID) return element._xuiEventID;
    return element._xuiEventID = ++_getEventID.id;
}

_getEventID.id = 1;

function _getRespondersForEvent(id, eventName) {
    var c = cache[id] = cache[id] || {};
    return c[eventName] = c[eventName] || [];
}

function _createResponder(element, eventName, handler) {
    var id = _getEventID(element), r = _getRespondersForEvent(id, eventName);

    var responder = function(event) {
        if (handler.call(element, event) === false) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    
    responder.guid = handler.guid = handler.guid || ++_getEventID.id;
    responder.handler = handler;
    r.push(responder);
    return responder;
}
/**
	Fx
	==

	Animations, transforms, and transitions for getting the most out of hardware accelerated CSS.

*/

xui.extend({

/**
	Tween
	-----

	Transforms a CSS property's value.

	### syntax ###

		x$( selector ).tween( properties, callback );

	### arguments ###

	- properties `Object` or `Array` of CSS properties to tween.
	    - `Object` is a JSON object that defines the CSS properties.
	    - `Array` is a `Object` set that is tweened sequentially.
	- callback `Function` to be called when the animation is complete. _(optional)_.

	### properties ###

	A property can be any CSS style, referenced by the JavaScript notation.

	A property can also be an option from [emile.js](https://github.com/madrobby/emile):

	- duration `Number` of the animation in milliseconds.
	- after `Function` is called after the animation is finished.
	- easing `Function` allows for the overriding of the built-in animation function.

			// Receives one argument `pos` that indicates position
			// in time between animation's start and end.
			function(pos) {
			    // return the new position
			    return (-Math.cos(pos * Math.PI) / 2) + 0.5;
			}

	### example ###

		// one JSON object
		x$('#box').tween({ left:'100px', backgroundColor:'blue' });
		x$('#box').tween({ left:'100px', backgroundColor:'blue' }, function() {
		    alert('done!');
		});
		
		// array of two JSON objects
		x$('#box').tween([{left:'100px', backgroundColor:'green', duration:.2 }, { right:'100px' }]); 
*/
	tween: function( props, callback ) {

    // creates an options obj for emile
    var emileOpts = function(o) {
      var options = {};
      "duration after easing".split(' ').forEach( function(p) {
        if (props[p]) {
            options[p] = props[p];
            delete props[p];
        }
      });
      return options;
    }

    // serialize the properties into a string for emile
    var serialize = function(props) {
      var serialisedProps = [], key;
      if (typeof props != string) {
        for (key in props) {
          serialisedProps.push(cssstyle(key) + ':' + props[key]);
        }
        serialisedProps = serialisedProps.join(';');
      } else {
        serialisedProps = props;
      }
      return serialisedProps;
    };

    // queued animations
    /* wtf is this?
		if (props instanceof Array) {
		    // animate each passing the next to the last callback to enqueue
		    props.forEach(function(a){
		      
		    });
		}
    */
    // this branch means we're dealing with a single tween
    var opts = emileOpts(props);
    var prop = serialize(props);
		
		return this.each(function(e){
			emile(e, prop, opts, callback);
		});
	}
});
/**
	Style
	=====

	Everything related to appearance. Usually, this is CSS.

*/
function hasClass(el, className) {
    return getClassRegEx(className).test(el.className);
}

// Via jQuery - used to avoid el.className = ' foo';
// Used for trimming whitespace
var rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;

function trim(text) {
  return (text || "").replace( rtrim, "" );
}

xui.extend({
/**
	setStyle
	--------

	Sets the value of a single CSS property.

	### syntax ###

		x$( selector ).setStyle( property, value );

	### arguments ###

	- property `String` is the name of the property to modify.
	- value `String` is the new value of the property.

	### example ###

		x$('.flash').setStyle('color', '#000');
		x$('.button').setStyle('backgroundColor', '#EFEFEF');
*/
    setStyle: function(prop, val) {
        prop = domstyle(prop);
        return this.each(function(el) {
            el.style[prop] = val;
        });
    },

/**
	getStyle
	--------

	Returns the value of a single CSS property. Can also invoke a callback to perform more specific processing tasks related to the property value.
	Please note that the return type is always an Array of strings. Each string corresponds to the CSS property value for the element with the same index in the xui collection.

	### syntax ###

		x$( selector ).getStyle( property, callback );

	### arguments ###

	- property `String` is the name of the CSS property to get.
	- callback `Function` is called on each element in the collection and passed the property _(optional)_.

	### example ###
        <ul id="nav">
            <li class="trunk" style="font-size:12px;background-color:blue;">hi</li>
            <li style="font-size:14px;">there</li>
        </ul>
        
		x$('ul#nav li.trunk').getStyle('font-size'); // returns ['12px']
		x$('ul#nav li.trunk').getStyle('fontSize'); // returns ['12px']
		x$('ul#nav li').getStyle('font-size'); // returns ['12px', '14px']
		
		x$('ul#nav li.trunk').getStyle('backgroundColor', function(prop) {
		    alert(prop); // alerts 'blue' 
		});
*/
    getStyle: function(prop, callback) {
        // shortcut getComputedStyle function
        var s = function(el, p) {
            // this *can* be written to be smaller - see below, but in fact it doesn't compress in gzip as well, the commented
            // out version actually *adds* 2 bytes.
            // return document.defaultView.getComputedStyle(el, "").getPropertyValue(p.replace(/([A-Z])/g, "-$1").toLowerCase());
            return document.defaultView.getComputedStyle(el, "").getPropertyValue(cssstyle(p));
        }
        if (callback === undefined) {
        	var styles = [];
          this.each(function(el) {styles.push(s(el, prop))});
          return styles;
        } else return this.each(function(el) { callback(s(el, prop)); });
    },

/**
	addClass
	--------

	Adds a class to all of the elements in the collection.

	### syntax ###

		x$( selector ).addClass( className );

	### arguments ###

	- className `String` is the name of the CSS class to add.

	### example ###

		x$('.foo').addClass('awesome');
*/
    addClass: function(className) {
        var cs = className.split(' ');
        return this.each(function(el) {
            cs.forEach(function(clazz) {
              if (hasClass(el, clazz) === false) {
                el.className = trim(el.className + ' ' + clazz);
              }
            });
        });
    },

/**
	hasClass
	--------

	Checks if the class is on _all_ elements in the xui collection.

	### syntax ###

		x$( selector ).hasClass( className, fn );

	### arguments ###

	- className `String` is the name of the CSS class to find.
	- fn `Function` is a called for each element found and passed the element _(optional)_.

			// `element` is the HTMLElement that has the class
			function(element) {
			    console.log(element);
			}

	### example ###
        <div id="foo" class="foo awesome"></div>
        <div class="foo awesome"></div>
        <div class="foo"></div>
        
		// returns true
		x$('#foo').hasClass('awesome');
		
		// returns false (not all elements with class 'foo' have class 'awesome'),
		// but the callback gets invoked with the elements that did match the 'awesome' class
		x$('.foo').hasClass('awesome', function(element) {
		    console.log('Hey, I found: ' + element + ' with class "awesome"');
		});
		
		// returns true (all DIV elements have the 'foo' class)
		x$('div').hasClass('foo');
*/
    hasClass: function(className, callback) {
        var self = this,
            cs = className.split(' ');
        return this.length && (function() {
                var hasIt = true;
                self.each(function(el) {
                  cs.forEach(function(clazz) {
                    if (hasClass(el, clazz)) {
                        if (callback) callback(el);
                    } else hasIt = false;
                  });
                });
                return hasIt;
            })();
    },

/**
	removeClass
	-----------

	Removes the specified class from all elements in the collection. If no class is specified, removes all classes from the collection.

	### syntax ###

		x$( selector ).removeClass( className );

	### arguments ###

	- className `String` is the name of the CSS class to remove. If not specified, then removes all classes from the matched elements. _(optional)_

	### example ###

		x$('.foo').removeClass('awesome');
*/
    removeClass: function(className) {
        if (className === undefined) this.each(function(el) { el.className = ''; });
        else {
          var cs = className.split(' ');
          this.each(function(el) {
            cs.forEach(function(clazz) {
              el.className = trim(el.className.replace(getClassRegEx(clazz), '$1'));
            });
          });
        }
        return this;
    },

/**
	toggleClass
	-----------

	Removes the specified class if it exists on the elements in the xui collection, otherwise adds it. 

	### syntax ###

		x$( selector ).toggleClass( className );

	### arguments ###

	- className `String` is the name of the CSS class to toggle.

	### example ###
        <div class="foo awesome"></div>
        
		x$('.foo').toggleClass('awesome'); // div above loses its awesome class.
*/
    toggleClass: function(className) {
        var cs = className.split(' ');
        return this.each(function(el) {
            cs.forEach(function(clazz) {
              if (hasClass(el, clazz)) el.className = trim(el.className.replace(getClassRegEx(clazz), '$1'));
              else el.className = trim(el.className + ' ' + clazz);
            });
        });
    },
    
/**
	css
	---

	Set multiple CSS properties at once.

	### syntax ###

		x$( selector ).css( properties );

	### arguments ###

	- properties `Object` is a JSON object that defines the property name/value pairs to set.

	### example ###

		x$('.foo').css({ backgroundColor:'blue', color:'white', border:'2px solid red' });
*/
    css: function(o) {
        for (var prop in o) {
            this.setStyle(prop, o[prop]);
        }
        return this;
    }
});

// RS: now that I've moved these out, they'll compress better, however, do these variables
// need to be instance based - if it's regarding the DOM, I'm guessing it's better they're
// global within the scope of xui

// -- private methods -- //
var reClassNameCache = {},
    getClassRegEx = function(className) {
        var re = reClassNameCache[className];
        if (!re) {
            // Preserve any leading whitespace in the match, to be used when removing a class
            re = new RegExp('(^|\\s+)' + className + '(?:\\s+|$)');
            reClassNameCache[className] = re;
        }
        return re;
    };
/**
	XHR
	===

	Everything related to remote network connections.

 */
xui.extend({	
/**
	xhr
	---

	The classic `XMLHttpRequest` sometimes also known as the Greek hero: _Ajax_. Not to be confused with _AJAX_ the cleaning agent.

	### detail ###

	This method has a few new tricks.

	It is always invoked on an element collection and uses the behaviour of `html`.

	If there is no callback, then the `responseText` will be inserted into the elements in the collection.

	### syntax ###

		x$( selector ).xhr( location, url, options )

	or accept a url with a default behavior of inner:

		x$( selector ).xhr( url, options );

	or accept a url with a callback:
	
		x$( selector ).xhr( url, fn );

	### arguments ###

	- location `String` is the location to insert the `responseText`. See `html` for values.
	- url `String` is where to send the request.
	- fn `Function` is called on status 200 (i.e. success callback).
	- options `Object` is a JSON object with one or more of the following:
		- method `String` can be _get_, _put_, _delete_, _post_. Default is _get_.
		- async `Boolean` enables an asynchronous request. Defaults to _false_.
		- data `String` is a url encoded string of parameters to send.
                - error `Function` is called on error or status that is not 200. (i.e. failure callback).
		- callback `Function` is called on status 200 (i.e. success callback).
    - headers `Object` is a JSON object with key:value pairs that get set in the request's header set.

	### response ###

	- The response is available to the callback function as `this`.
	- The response is not passed into the callback.
	- `this.reponseText` will have the resulting data from the file.

	### example ###

		x$('#status').xhr('inner', '/status.html');
		x$('#status').xhr('outer', '/status.html');
		x$('#status').xhr('top',   '/status.html');
		x$('#status').xhr('bottom','/status.html');
		x$('#status').xhr('before','/status.html');
		x$('#status').xhr('after', '/status.html');

	or

		// same as using 'inner'
		x$('#status').xhr('/status.html');

		// define a callback, enable async execution and add a request header
		x$('#left-panel').xhr('/panel', {
		    async: true,
		    callback: function() {
		        alert("The response is " + this.responseText);
		    },
        headers:{
            'Mobile':'true'
        }
		});

		// define a callback with the shorthand syntax
		x$('#left-panel').xhr('/panel', function() {
		    alert("The response is " + this.responseText);
		});
*/
    xhr:function(location, url, options) {

      // this is to keep support for the old syntax (easy as that)
		if (!/^(inner|outer|top|bottom|before|after)$/.test(location)) {
            options = url;
            url = location;
            location = 'inner';
        }

        var o = options ? options : {};
        
        if (typeof options == "function") {
            // FIXME kill the console logging
            // console.log('we been passed a func ' + options);
            // console.log(this);
            o = {};
            o.callback = options;
        };
        
        var that   = this,
            req    = new XMLHttpRequest(),
            method = o.method || 'get',
            async  = (typeof o.async != 'undefined'?o.async:true),
            params = o.data || null,
            key;

        req.queryString = params;
        req.open(method, url, async);

        // Set "X-Requested-With" header
        req.setRequestHeader('X-Requested-With','XMLHttpRequest');

        if (method.toLowerCase() == 'post') req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');

        for (key in o.headers) {
            if (o.headers.hasOwnProperty(key)) {
              req.setRequestHeader(key, o.headers[key]);
            }
        }

        req.handleResp = (o.callback != null) ? o.callback : function() { that.html(location, req.responseText); };
        req.handleError = (o.error && typeof o.error == 'function') ? o.error : function () {};
        function hdl(){
            if(req.readyState==4) {
                delete(that.xmlHttpRequest);
                if((/^[20]/).test(req.status)) req.handleResp();
                if((/^[45]/).test(req.status)) req.handleError();
            }
        }
        if(async) {
            req.onreadystatechange = hdl;
            this.xmlHttpRequest = req;
        }
        req.send(params);
        if(!async) hdl();

        return this;
    }
});
// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.

(function(emile, container){
  var parseEl = document.createElement('div'),
    props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
    'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
    'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
    'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
    'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');

  function interpolate(source,target,pos){ return (source+(target-source)*pos).toFixed(3); }
  function s(str, p, c){ return str.substr(p,c||1); }
  function color(source,target,pos){
    var i = 2, j, c, tmp, v = [], r = [];
    while(j=3,c=arguments[i-1],i--)
      if(s(c,0)=='r') { c = c.match(/\d+/g); while(j--) v.push(~~c[j]); } else {
        if(c.length==4) c='#'+s(c,1)+s(c,1)+s(c,2)+s(c,2)+s(c,3)+s(c,3);
        while(j--) v.push(parseInt(s(c,1+j*2,2), 16)); }
    while(j--) { tmp = ~~(v[j+3]+(v[j]-v[j+3])*pos); r.push(tmp<0?0:tmp>255?255:tmp); }
    return 'rgb('+r.join(',')+')';
  }
  
  function parse(prop){
    var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'');
    return isNaN(p) ? { v: q, f: color, u: ''} : { v: p, f: interpolate, u: q };
  }
  
  function normalize(style){
    var css, rules = {}, i = props.length, v;
    parseEl.innerHTML = '<div style="'+style+'"></div>';
    css = parseEl.childNodes[0].style;
    while(i--) if(v = css[props[i]]) rules[props[i]] = parse(v);
    return rules;
  }  
  
  container[emile] = function(el, style, opts, after){
    el = typeof el == 'string' ? document.getElementById(el) : el;
    opts = opts || {};
    var target = normalize(style), comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
      prop, current = {}, start = +new Date, dur = opts.duration||200, finish = start+dur, interval,
      easing = opts.easing || function(pos){ return (-Math.cos(pos*Math.PI)/2) + 0.5; };
    for(prop in target) current[prop] = parse(comp[prop]);
    interval = setInterval(function(){
      var time = +new Date, pos = time>finish ? 1 : (time-start)/dur;
      for(prop in target)
        el.style[prop] = target[prop].f(current[prop].v,target[prop].v,easing(pos)) + target[prop].u;
      if(time>finish) { clearInterval(interval); opts.after && opts.after(); after && setTimeout(after,1); }
    },10);
  }
})('emile', this);
!function (context, doc) {
  var fns = [], ol, fn, f = false,
      testEl = doc.documentElement,
      hack = testEl.doScroll,
      domContentLoaded = 'DOMContentLoaded',
      addEventListener = 'addEventListener',
      onreadystatechange = 'onreadystatechange',
      loaded = /^loade|c/.test(doc.readyState);

  function flush(i) {
    loaded = 1;
    while (i = fns.shift()) { i() }
  }
  doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
    doc.removeEventListener(domContentLoaded, fn, f);
    flush();
  }, f);


  hack && doc.attachEvent(onreadystatechange, (ol = function () {
    if (/^c/.test(doc.readyState)) {
      doc.detachEvent(onreadystatechange, ol);
      flush();
    }
  }));

  context['domReady'] = hack ?
    function (fn) {
      self != top ?
        loaded ? fn() : fns.push(fn) :
        function () {
          try {
            testEl.doScroll('left');
          } catch (e) {
            return setTimeout(function() { context['domReady'](fn) }, 50);
          }
          fn();
        }()
    } :
    function (fn) {
      loaded ? fn() : fns.push(fn);
    };

}(this, document);
})();


xui.extend({
	text: function(){
		var result = [];
		if(this.length >= 1){
			var el = this[0];
			for (var i = 0; i < el.childNodes.length; i++) {
    			var n = el.childNodes[i];
    			if (n.nodeName === "#text")result.push(n.nodeValue);
    		}
		}
		return result;
	}
});

/* Riot 1.0.0, @license MIT, (c) 2014 Muut Inc + contributors */
(function(riot) { "use strict";

riot.observable = function(el) {
  var callbacks = {}, slice = [].slice;

  el.on = function(events, fn) {
    if (typeof fn === "function") {
      events.replace(/[^\s]+/g, function(name, pos) {
        (callbacks[name] = callbacks[name] || []).push(fn);
        fn.typed = pos > 0;
      });
    }
    return el;
  };

  el.off = function(events) {
    events.replace(/[^\s]+/g, function(name) {
      callbacks[name] = [];
    });
    if (events == "*") callbacks = {};
    return el;
  };

  // only single event supported
  el.one = function(name, fn) {
    if (fn) fn.one = true;
    return el.on(name, fn);
  };

  el.trigger = function(name) {
    var args = slice.call(arguments, 1),
      fns = callbacks[name] || [];

    for (var i = 0, fn; (fn = fns[i]); ++i) {
      if (!fn.busy) {
        fn.busy = true;
        fn.apply(el, fn.typed ? [name].concat(args) : args);
        if (fn.one) { fns.splice(i, 1); i--; }
        fn.busy = false;
      }
    }

    return el;
  };

  return el;

};

var FN = {}, // Precompiled templates (JavaScript functions)
  template_escape = {"\\": "\\\\", "\n": "\\n", "\r": "\\r", "'": "\\'"},
  render_escape = {'&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;'};

function default_escape_fn(str, key) {
  return str == undefined ? '' : (str+'').replace(/[&\"<>]/g, function(char) {
    return render_escape[char];
  });
}

riot.render = function(tmpl, data, escape_fn) {
  if (escape_fn === true) escape_fn = default_escape_fn;
  tmpl = tmpl || '';

  return (FN[tmpl] = FN[tmpl] || new Function("_", "e", "try { return '" +
    tmpl.replace(/[\\\n\r']/g, function(char) {
      return template_escape[char];

    }).replace(/{\s*([\w\.]+)\s*}/g, "' + (e?e(_.$1,'$1'):_.$1||(_.$1==undefined?'':_.$1)) + '")
      + "' } catch(e) { return '' }"
    )

  )(data, escape_fn);

};

/* Cross browser popstate */

// for browsers only
if (typeof top != "object") return;

var currentHash,
  pops = riot.observable({}),
  listen = window.addEventListener,
  doc = document;

function pop(hash) {
  hash = hash.type ? location.hash : hash;
  if (hash != currentHash) pops.trigger("pop", hash);
  currentHash = hash;
}

/* Always fire pop event upon page load (normalize behaviour across browsers) */

// standard browsers
if (listen) {
  listen("popstate", pop, false);
  doc.addEventListener("DOMContentLoaded", pop, false);

// IE
} else {
  doc.attachEvent("onreadystatechange", function() {
    if (doc.readyState === "complete") pop("");
  });
}

/* Change the browser URL or listen to changes on the URL */
riot.route = function(to) {
  // listen
  if (typeof to === "function") return pops.on("pop", to);

  // fire
  if (history.pushState) history.pushState(0, 0, to);
  pop(to);

};})(typeof top == "object" ? window.riot = {} : exports);

/*!
  * Valentine: JavaScript's functional Sister
  * (c) Dustin Diaz 2014
  * https://github.com/ded/valentine License MIT
  */

(function (name, context, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function') define(definition)
  else context[name] = context['v'] = definition()
})('valentine', this, function () {

  var ap = []
    , hasOwn = Object.prototype.hasOwnProperty
    , n = null
    , slice = ap.slice
    , nativ = 'map' in ap
    , nativ18 = 'reduce' in ap

  var iters = {
    each: function (a, fn, scope) {
      ap.forEach.call(a, fn, scope)
    }

  , map: function (a, fn, scope) {
      return ap.map.call(a, fn, scope)
    }

  , some: function (a, fn, scope) {
      return a.some(fn, scope)
    }

  , every: function (a, fn, scope) {
      return a.every(fn, scope)
    }

  , filter: function (a, fn, scope) {
      return a.filter(fn, scope)
    }
  , indexOf: function (a, el, start) {
      return a.indexOf(el, isFinite(start) ? start : 0)
    }

  , lastIndexOf: function (a, el, start) {
      return a.lastIndexOf(el, isFinite(start) ? start : a.length)
    }

  , reduce: function (o, i, m, c) {
      return ap.reduce.call(o, i, m, c);
    }

  , reduceRight: function (o, i, m, c) {
      return ap.reduceRight.call(o, i, m, c)
    }

  , find: function (obj, iterator, context) {
      var result
      iters.some(obj, function (value, index, list) {
        if (iterator.call(context, value, index, list)) {
          result = value
          return true
        }
      })
      return result
    }

  , reject: function (a, fn, scope) {
      var r = []
      for (var i = 0, j = 0, l = a.length; i < l; i++) {
        if (i in a) {
          if (fn.call(scope, a[i], i, a)) {
            continue;
          }
          r[j++] = a[i]
        }
      }
      return r
    }

  , size: function (a) {
      return o.toArray(a).length
    }

  , compact: function (a) {
      return iters.filter(a, function (value) {
        return !!value
      })
    }

  , flatten: function (a) {
      return iters.reduce(a, function (memo, value) {
        if (is.arr(value)) {
          return memo.concat(iters.flatten(value))
        }
        memo[memo.length] = value
        return memo
      }, [])
    }

  , uniq: function (ar, opt_iterator) {
      if (ar == null) return []
      var a = [], seen = []
      for (var i = 0, length = ar.length; i < length; i++) {
        var value = ar[i]
        if (opt_iterator) value = opt_iterator(value, i, ar)
        if (!iters.inArray(seen, value)) {
          seen.push(value)
          a.push(ar[i])
        }
      }
      return a
    }

  , merge: function (one, two) {
      var i = one.length, j = 0, l
      if (isFinite(two.length)) {
        for (l = two.length; j < l; j++) {
          one[i++] = two[j]
        }
      } else {
        while (two[j] !== undefined) {
          first[i++] = second[j++]
        }
      }
      one.length = i
      return one
    }

  , inArray: function (ar, needle) {
      return !!~iters.indexOf(ar, needle)
    }

  , memo: function (fn, hasher) {
      var store = {}
      hasher || (hasher = function (v) {
        return v
      })
      return function () {
        var key = hasher.apply(this, arguments)
        return hasOwn.call(store, key) ? store[key] : (store[key] = fn.apply(this, arguments))
      }
    }
  }

  var is = {
    fun: function (f) {
      return typeof f === 'function'
    }

  , str: function (s) {
      return typeof s === 'string'
    }

  , ele: function (el) {
      return !!(el && el.nodeType && el.nodeType == 1)
    }

  , arr: function (ar) {
      return ar instanceof Array
    }

  , arrLike: function (ar) {
      return (ar && ar.length && isFinite(ar.length))
    }

  , num: function (n) {
      return typeof n === 'number'
    }

  , bool: function (b) {
      return (b === true) || (b === false)
    }

  , args: function (a) {
      return !!(a && hasOwn.call(a, 'callee'))
    }

  , emp: function (o) {
      var i = 0
      return is.arr(o) ? o.length === 0 :
        is.obj(o) ? (function () {
          for (var k in o) {
            i++
            break;
          }
          return (i === 0)
        }()) :
        o === ''
    }

  , dat: function (d) {
      return !!(d && d.getTimezoneOffset && d.setUTCFullYear)
    }

  , reg: function (r) {
      return !!(r && r.test && r.exec && (r.ignoreCase || r.ignoreCase === false))
    }

  , nan: function (n) {
      return n !== n
    }

  , nil: function (o) {
      return o === n
    }

  , und: function (o) {
      return typeof o === 'undefined'
    }

  , def: function (o) {
      return typeof o !== 'undefined'
    }

  , obj: function (o) {
      return o instanceof Object && !is.fun(o) && !is.arr(o)
    }
  }

  // nicer looking aliases
  is.empty = is.emp
  is.date = is.dat
  is.regexp = is.reg
  is.element = is.ele
  is.array = is.arr
  is.string = is.str
  is.undef = is.und
  is.func = is.fun

  var o = {
    each: function each(a, fn, scope) {
      is.arrLike(a) ?
        iters.each(a, fn, scope) : (function () {
          for (var k in a) {
            hasOwn.call(a, k) && fn.call(scope, k, a[k], a)
          }
        }())
    }

  , map: function map(a, fn, scope) {
      var r = [], i = 0
      return is.arrLike(a) ?
        iters.map(a, fn, scope) : !function () {
          for (var k in a) {
            hasOwn.call(a, k) && (r[i++] = fn.call(scope, k, a[k], a))
          }
        }() && r
    }

  , some: function some(a, fn, scope) {
      if (is.arrLike(a)) return iters.some(a, fn, scope)
      for (var k in a) {
        if (hasOwn.call(a, k) && fn.call(scope, k, a[k], a)) {
          return true
        }
      }
      return false

    }

  , every: function every(a, fn, scope) {
      if (is.arrLike(a)) return iters.every(a, fn, scope)
      for (var k in a) {
        if (!(hasOwn.call(a, k) && fn.call(scope, k, a[k], a))) {
          return false
        }
      }
      return true
    }

  , filter: function filter(a, fn, scope) {
      var r = {}, k
      if (is.arrLike(a)) return iters.filter(a, fn, scope)
      for (k in a) {
        if (hasOwn.call(a, k) && fn.call(scope, k, a[k], a)) {
          r[k] = a[k]
        }
      }
      return r
    }

  , pluck: function pluck(a, k) {
      return is.arrLike(a) ?
        iters.map(a, function (el) {
          return el[k]
        }) :
        o.map(a, function (_, v) {
          return v[k]
        })
    }

  , toArray: function toArray(a) {
      if (!a) return []

      if (is.arr(a)) return a

      if (a.toArray) return a.toArray()

      if (is.args(a)) return slice.call(a)

      return iters.map(a, function (k) {
        return k
      })
    }

  , first: function first(a) {
      return a[0]
    }

  , last: function last(a) {
      return a[a.length - 1]
    }

  , keys: Object.keys
  , values: function (ob) {
      return o.map(ob, function (k, v) {
        return v
      })
    }

  , extend: function extend() {
      // based on jQuery deep merge
      var options, name, src, copy, clone
        , target = arguments[0], i = 1, length = arguments.length

      for (; i < length; i++) {
        if ((options = arguments[i]) !== n) {
          // Extend the base object
          for (name in options) {
            src = target[name]
            copy = options[name]
            if (target === copy) {
              continue;
            }
            if (copy && (is.obj(copy))) {
              clone = src && is.obj(src) ? src : {}
              target[name] = o.extend(clone, copy);
            } else if (copy !== undefined) {
              target[name] = copy
            }
          }
        }
      }
      return target
    }

  , trim: function (s) {
      return s.trim()
    }

  , bind: function (scope, fn) {
      var args = arguments.length > 2 ? slice.call(arguments, 2) : null
      return function () {
        return fn.apply(scope, args ? args.concat(slice.call(arguments)) : arguments)
      }
    }

  , curry: function curry(fn) {
      if (arguments.length == 1) return fn
      var args = slice.call(arguments, 1)
      return function () {
        return fn.apply(null, args.concat(slice.call(arguments)))
      }
    }

  , parallel: function parallel(fns, callback) {
      var args = o.toArray(arguments)
        , len = 0
        , returns = []
        , flattened = []

      if (is.arr(fns) && fns.length === 0 || (is.fun(fns) && args.length === 1)) throw new TypeError('Empty parallel array')
      if (!is.arr(fns)) {
        callback = args.pop()
        fns = args
      }

      iters.each(fns, function (el, i) {
        el(function () {
          var a = o.toArray(arguments)
            , e = a.shift()
          if (e) return callback(e)
          returns[i] = a
          if (fns.length == ++len) {
            returns.unshift(n)

            iters.each(returns, function (r) {
              flattened = flattened.concat(r)
            })

            callback.apply(n, flattened)
          }
        })
      })
    }

  , waterfall: function waterfall(fns, callback) {
      var args = o.toArray(arguments)
        , index = 0

      if (is.arr(fns) && fns.length === 0 || (is.fun(fns) && args.length === 1)) throw new TypeError('Empty waterfall array')
      if (!is.arr(fns)) {
        callback = args.pop()
        fns = args
      }

      (function f() {
        var args = o.toArray(arguments)
        if (!args.length) args.push(null) // allow callbacks with no args as passable non-errored functions
        args.push(f)
        var err = args.shift()
        if (!err && fns.length) fns.shift().apply(n, args)
        else {
          args.pop()
          args.unshift(err)
          callback.apply(n, args)
        }
      }(n))
    }

  , queue: function queue(ar) {
      return new Queue(is.arrLike(ar) ? ar : o.toArray(arguments))
    }

  , debounce: function debounce(wait, fn, opt_scope) {
      var timeout
      function caller() {
        var args = arguments
          , context = opt_scope || this
        function later() {
          timeout = null
          fn.apply(context, args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }

      // cancelation method
      caller.cancel = function debounceCancel() {
        clearTimeout(timeout)
        timeout = null
      }

      return caller
    }

  , throttle: function throttle(wait, fn, opt_scope) {
      var timeout
      return function throttler() {
        var context = opt_scope || this
          , args = arguments
        if (!timeout) {
          timeout = setTimeout(function throttleTimeout() {
              fn.apply(context, args)
              timeout = null
            },
            wait
          )
        }
      }
    }

  , throttleDebounce: function (throttleMs, debounceMs, fn, opt_scope) {
      var args
        , context
        , debouncer
        , throttler

      function caller() {
        args = arguments
        context = opt_scope || this

        clearTimeout(debouncer)
        debouncer = setTimeout(function () {
          clearTimeout(throttler)
          throttler = null
          fn.apply(context, args)
        }, debounceMs)

        if (!throttler) {
          throttler = setTimeout(function () {
            clearTimeout(debouncer)
            throttler = null
            fn.apply(context, args)
          }, throttleMs)
        }
      }

      // cancelation method
      caller.cancel = function () {
        clearTimeout(debouncer)
        clearTimeout(throttler)
        throttler = null
      }

      return caller
    }
  }

  function Queue (a) {
    this.values = a
    this.index = 0
  }

  Queue.prototype.next = function () {
    this.index < this.values.length && this.values[this.index++]()
    return this
  }

  function v(a, scope) {
    return new Valentine(a, scope)
  }

  function aug(o, o2) {
    for (var k in o2) o[k] = o2[k]
  }

  aug(v, iters)
  aug(v, o)
  v.is = is

  v.v = v // vainglory

  // peoples like the object style
  function Valentine(a, scope) {
    this.val = a
    this._scope = scope || n
    this._chained = 0
  }

  v.each(v.extend({}, iters, o), function (name, fn) {
    Valentine.prototype[name] = function () {
      var a = v.toArray(arguments)
      a.unshift(this.val)
      var ret = fn.apply(this._scope, a)
      this.val = ret
      return this._chained ? this : ret
    }
  })

  // people like chaining
  aug(Valentine.prototype, {
    chain: function () {
      this._chained = 1
      return this
    }
  , value: function () {
      return this.val
    }
  })

  return v
});

(function () {
;defineModule("/leftbar/leftbar.js", function(require, exports, module){
var addAttribute, onrun, registeredEvents, resetCheckbox;

resetCheckbox = function(checkbox) {
  var value;
  value = checkbox.value;
  checkbox.options[0].selected = true;
  return value;
};

v.eacheach = function(arrayOfArray, cb) {
  return v.each(arrayOfArray, function(array) {
    return v.each(array, cb);
  });
};

onrun = null;

registeredEvents = {};

exports.hide = function() {
  return xui('#puppet-leftbar').remove();
};

exports.init = function(onClose, onRun) {
  var addEventSelect, leftbar;
  exports.hide();
  onrun = onRun;
  leftbar = xui('template#leftbar').html()[0];
  xui('body').bottom(riot.render(leftbar, {}));
  xui('#puppet-leftbar a.bind-close').on('click', onClose);
  addEventSelect = xui('#puppet-leftbar .head select');
  return addEventSelect.on('change', function() {
    var event, value;
    value = resetCheckbox(addEventSelect[0]);
    event = registeredEvents[value];
    if (event) {
      return exports.addEvent(event);
    }
  });
};

exports.registerEvent = function(event) {
  var addEventSelect;
  addEventSelect = xui('#puppet-leftbar .head select');
  registeredEvents[event.name] = event;
  return addEventSelect.bottom("<option>" + event.name + "</option>");
};

exports.addEvent = function(event) {
  var addAttributeSelect, current, expand, leftbar;
  leftbar = xui('#puppet-leftbar');
  leftbar.bottom(riot.render(xui('template#event').html()[0], {
    name: event.name
  }));
  current = xui(v.last(leftbar.find('.event')));
  current.find('.bind-remove').on('click', function() {
    current.remove();
    return false;
  });
  (expand = function() {
    xui('.event-body').addClass('hide');
    return current.find('.event-body').removeClass('hide');
  })();
  current.find('.event-head').on('click', expand);
  current.find('.bind-run').on('click', function() {
    onrun((exports.serializeEvent(current))[0]);
    return false;
  });
  addAttributeSelect = current.find('.attribute-add select');
  addAttributeSelect.on('change', function() {
    var value;
    value = resetCheckbox(addAttributeSelect[0]);
    return v.eacheach(event.addable, function(name, onselect) {
      if (name === value) {
        return onselect(v.curry(addAttribute, current));
      }
    });
  });
  v.eacheach(event.current, function(name, value) {
    return addAttribute(current, name, value);
  });
  return v.eacheach(event.addable, function(name) {
    return addAttributeSelect.bottom("<option>" + name + "</option>");
  });
};

addAttribute = function(current, name, value) {
  var html, template;
  if (v.is.array(value)) {
    value = v.map(value, function(item) {
      return "<option>" + item + "</option>";
    });
    value = value.join('');
    value = "<select>" + value + "<select>";
  } else {
    value = "<input type='text' value='" + value + "'/>";
  }
  template = xui('template#attribute').html()[0];
  html = riot.render(template, {
    label: name,
    value: value
  });
  return current.find('.attribute-add').before(html);
};

exports.serializeEvent = function(events) {
  var result;
  result = [];
  events = events || xui('.event');
  v.each(events, function(event) {
    var attributes, current;
    attributes = xui(event).find('.attribute');
    result.push(current = {
      name: xui(event).find('.name').text().join('').trim(),
      attr: {}
    });
    return v.each(attributes, function(attribute) {
      var enabled, label, value;
      label = xui(attribute).find('label');
      label = label.text().join('').trim();
      enabled = xui(attribute).find('.label input');
      enabled = enabled[0] && enabled[0].checked;
      value = xui(attribute).find('.value input, .value select');
      value = value[0].value;
      if (label.length && enabled) {
        if (!current.attr[label]) {
          current.attr[label] = [];
        }
        return current.attr[label].push(value);
      }
    });
  });
  return result;
};

xui.ready(function() {
  exports.init(exports.hide, function(data) {
    return console.log(data);
  });
  return exports.registerEvent({
    name: 'click',
    current: [
      {
        'x': '4px'
      }, {
        'y': '3px'
      }, {
        'id': ['fullid', 'false']
      }
    ],
    addable: [
      {
        'class': function(add) {
          return add('class', '');
        }
      }
    ]
  });
});

});

require('/leftbar/leftbar.js');

})();