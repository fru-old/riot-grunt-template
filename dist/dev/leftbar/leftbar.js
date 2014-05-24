;defineModule("/leftbar/leftbar.js", function(require, exports, module){
var Puppet, addAttribute, onrun, registeredEvents, resetCheckbox;

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
  xui('#puppet-overlay').bottom(riot.render(leftbar, {}));
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

window.print = exports.serializeEvent = function(events) {
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

Puppet = function(url) {
  var html, self;
  html = "<iframe src='" + url + "'></iframe>";
  xui('#puppet-frames').bottom(html);
  this.iframe = v.last(xui('#puppet-frames iframe'));
  this.window = this.iframe.contentWindow;
  self = this;
  setInterval((function() {
    return self.initiate();
  }), 50);
  return this;
};

Puppet.prototype.initiate = function() {
  var self;
  self = this;
  if (!this.window.initiated && this.window.document.readyState === 'complete') {
    v.each(Puppet.plugins, function(plugin) {
      return plugin.detect.call(self, function(data) {
        if (Puppet.disableRecorder) {
          return;
        }
        return exports.addEvent(data);
      });
    });
    return this.window.initiated = true;
  }
};

Puppet.plugins = [];

Puppet.plugin = function(plugin) {
  Puppet.plugins.push(plugin);
  exports.registerEvent(plugin);
  return Puppet.prototype[plugin.name] = function() {
    return plugin.run.apply(this, arguments);
  };
};

exports.Puppet = Puppet;

xui.ready(function() {
  var puppet, waiter;
  exports.init(exports.hide, function(data) {
    return console.log(data);
  });
  Puppet.queue = [];
  Puppet.addToQueue = function(window, action) {
    return Puppet.queue.push(function() {
      if (window.document.readyState !== 'complete') {
        return false;
      }
      Puppet.disableRecorder = true;
      action();
      Puppet.disableRecorder = false;
      return true;
    });
  };
  waiter = setInterval(function() {
    if (Puppet.queue.length) {
      if (Puppet.queue[0]()) {
        return Puppet.queue = Puppet.queue.slice(1);
      }
    }
  }, 1000);
  (function() {
    var attr, name;
    name = 'click';
    attr = [
      {
        'x': function(add) {
          return add('x', '');
        }
      }, {
        'y': function(add) {
          return add('y', '');
        }
      }, {
        'selector': function(add) {
          return add('selector', 'div#id.class');
        }
      }
    ];
    return Puppet.plugin({
      name: name,
      current: [],
      addable: attr,
      run: function(data) {
        var selector, win, x, y;
        x = (data.x || [])[0];
        y = (data.y || [])[0];
        selector = (data.selector || [])[0];
        win = this.window;
        return Puppet.addToQueue(this.window, function() {
          var click, mousedown, mouseup, target;
          if (selector) {
            target = xui(win.document).find(selector)[0];
          } else {
            target = win.document.elementFromPoint(x, y);
          }
          mousedown = win.document.createEvent('MouseEvents');
          mousedown.initMouseEvent('mousedown', true, true, win, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
          target.dispatchEvent(mousedown);
          mouseup = win.document.createEvent('MouseEvents');
          mouseup.initMouseEvent('mouseup', true, true, win, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
          target.dispatchEvent(mouseup);
          click = win.document.createEvent('MouseEvents');
          click.initMouseEvent('click', true, true, win, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
          target.dispatchEvent(click);
          return target.focus();
        });
      },
      detect: function(add) {
        var action;
        action = function(e) {
          return add({
            name: name,
            current: [
              {
                'x': e.pageX
              }, {
                'y': e.pageY
              }
            ],
            addable: attr
          });
        };
        return this.window.document.body.addEventListener('click', action, true);
      }
    });
  })();
  (function() {
    var attr, name;
    name = 'typing';
    attr = [
      {
        'text': function(add) {
          return add('text', '');
        }
      }
    ];
    return Puppet.plugin({
      name: name,
      current: [],
      addable: attr,
      run: function(data) {
        var text, win;
        text = (data.text || [])[0];
        win = this.window;
        return Puppet.addToQueue(this.window, function() {
          var char, i, _i, _ref;
          for (i = _i = 0, _ref = text.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
            char = text.charCodeAt(i);
            v.each(['keydown', 'keyup', 'keypress'], function(event) {
              var key;
              key = win.document.createEvent('KeyboardEvent');
              if (key.initKeyEvent) {
                key.initKeyEvent(event, true, true, win, 0, 0, 0, 0, 0, char);
              } else {
                key.initKeyboardEvent(event, true, true, win, 0, 0, 0, 0, 0, char);
              }
              return win.document.activeElement.dispatchEvent(key);
            });
          }
          return win.document.activeElement.value = text;
        });
      },
      detect: function(add) {
        var action;
        action = function(event) {
          console.log(event);
        };
        return this.window.document.body.addEventListener('keypress', action, true);
      }
    });
  })();
  puppet = new Puppet('/AptDeFE/start/buyer');
  puppet.tab = {
    finance: function() {
      return puppet.click({
        x: [499],
        y: [75]
      });
    }
  };
  puppet.login = function(user, password) {
    puppet.click({
      selector: ['a.js_goto_loginpage']
    });
    puppet.click({
      x: [496],
      y: [317]
    });
    puppet.typing({
      text: ["auto@portal.de"]
    });
    puppet.click({
      x: [496],
      y: [377]
    });
    puppet.typing({
      text: ["init"]
    });
    puppet.click({
      x: [704],
      y: [545]
    });
    puppet.click({
      x: [859],
      y: [2408]
    });
    return puppet.click({
      x: [828],
      y: [1517]
    });
  };
  puppet.tab.finance();
  return puppet.login();
});

});