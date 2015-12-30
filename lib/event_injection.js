'use strict';

var EventPrototype = ('EventTarget' in global) ? global.EventTarget.prototype : global.Node.prototype;

var nativeAddEventListener = EventPrototype.addEventListener,
    nativeRemoveEventListener = EventPrototype.removeEventListener;

var globalEvents = {},
    elementsWithEvents = [];

EventPrototype.addEventListener = function() {
  var index = elementsWithEvents.indexOf(this);

  if (index === -1) {
    elementsWithEvents.push(this);
    index = elementsWithEvents.indexOf(this);
  }

  var eventName = arguments[0];

  globalEvents[index] = globalEvents[index] || {};
  globalEvents[index][eventName] = globalEvents[index][eventName] || [];

  globalEvents[index][eventName].push({
    handler: arguments[1],
    useCapture: ((arguments[2] === undefined) ? false : arguments[2])
  })

  nativeAddEventListener.apply(this, arguments);
}

EventPrototype.removeEventListener = function() {
  var index = elementsWithEvents.indexOf(this);

  if (index > -1) {
    globalEvents[index] = globalEvents[index] || {};
    globalEvents[index][arguments[0]] = globalEvents[index][arguments[0]] || [];

    for (var i = 0; i < globalEvents[index][arguments[0]].length; i++) {
      var registeredEvents = globalEvents[index][arguments[0]][i];

      if (registeredEvents.handler === arguments[1]) {
        globalEvents[index][arguments[0]].splice(i, 1);
        break;
      }
    }
  }

  nativeRemoveEventListener.apply(this, arguments);
}

module.exports = {
  globalEvents: globalEvents,
  elementsWithEvents: elementsWithEvents
}