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