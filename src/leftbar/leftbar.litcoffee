
# Puppet.js - Left Toolbar 

When an iframe is opened a toolbar is diplayed on the left side. This bar 
contains the close iframe button and any recorded events. It should be 
possible to manually add events via a dropdown box in the toolbar. The 
properties of an event, like the position of a click, should be configurable 
in this toolbar.


## Utility functions

We use checkboxes to execute commands here. For these when the checkbox 
changes the new value is read and the checkbox is reset to the previous
state.

    resetCheckbox = (checkbox) ->
      value = checkbox.value
      checkbox.options[0].selected = true
      return value

A valentine.js extension to iterate over an array of arrays.

    v.eacheach = (arrayOfArray, cb) ->
      v.each arrayOfArray, (array) ->
        v.each array, cb


## Constructing and destructing functions init and hide

The method init returns a function that can be used to add event types to
the dropdown box in the upper left corner. This dropdown menu is used to 
manually add events that are not recorded. Init takes two callbacks as 
arguments: onClose and onRun. OnClose is run when the button to close the 
iframe is pressed and onRun is used to execute a specific event in the 
opened iframe.

    onrun = null
    registeredEvents = {}

    exports.hide = () ->
      do xui('#puppet-leftbar').remove
    
    exports.init = (onClose, onRun) -> 
      do exports.hide
      onrun = onRun

      leftbar = xui('template#leftbar').html()[0]
      xui('body').bottom riot.render leftbar, {}
      xui('#puppet-leftbar a.bind-close').on 'click', onClose

      addEventSelect = xui('#puppet-leftbar .head select')
      addEventSelect.on 'change', ->
        value = resetCheckbox addEventSelect[0]
        event = registeredEvents[value]
        exports.addEvent event if event
        
    exports.registerEvent = (event) ->
      addEventSelect = xui('#puppet-leftbar .head select')
      registeredEvents[event.name] = event
      addEventSelect.bottom "<option>#{event.name}</option>"


## Adding an event to the left toolbar

    exports.addEvent = (event) ->
      leftbar = xui('#puppet-leftbar')
      leftbar.bottom riot.render xui('template#event').html()[0], {
        name: event.name
      }
      
      current = xui v.last leftbar.find '.event'
      current.find('.bind-remove').on 'click', ->
        do current.remove
        return false

      do expand = ->
        xui('.event-body').addClass('hide')
        current.find('.event-body').removeClass('hide')
      current.find('.event-head').on 'click', expand

      current.find('.bind-run').on 'click', ->
        onrun (exports.serializeEvent current)[0]
        return false


      addAttributeSelect = current.find('.attribute-add select')
      addAttributeSelect.on 'change', ->
          value = resetCheckbox addAttributeSelect[0]
          v.eacheach event.addable, (name, onselect) ->
            onselect v.curry(addAttribute, current) if name == value

      v.eacheach event.current, (name, value) ->
        addAttribute current, name, value

      v.eacheach event.addable, (name) ->
        addAttributeSelect.bottom "<option>#{name}</option>"


## Adding an attribute

    addAttribute = (current, name, value) ->
      if v.is.array value
        value = v.map value, (item) -> "<option>#{item}</option>"
        value = value.join ''
        value = "<select>#{value}<select>"
      else
        value = "<input type='text' value='#{value}'/>"
      template = xui('template#attribute').html()[0]
      html = riot.render template, {
        label: name
        value: value
      }
      current.find('.attribute-add').before html


## Serialize event to json

    exports.serializeEvent = (events) ->
      result = []
      events = events || xui('.event')
      v.each events, (event) ->
        attributes = xui(event).find('.attribute')
        result.push current = 
          name: xui(event).find('.name').text().join('').trim()
          attr: {}
        v.each attributes, (attribute) ->
          label = xui(attribute).find('label')
          label = label.text().join('').trim()
          enabled = xui(attribute).find('.label input')
          enabled = enabled[0] && enabled[0].checked
          value = xui(attribute).find('.value input, .value select')
          value = value[0].value
          if label.length and enabled
            current.attr[label] = [] if !current.attr[label] 
            current.attr[label].push(value)
      return result


    xui.ready ->
      exports.init exports.hide, (data) ->
        console.log data
      exports.registerEvent
        name: 'click'
        current: [
          { 'x': '4px' }
          { 'y': '3px' }
          { 'id': ['fullid', 'false'] }
        ]
        addable: [
          { 'class': (add) -> add 'class', '' }
        ]