var nativeAddEventListener = EventTarget.prototype.addEventListener,
    nativeRemoveEventListener = EventTarget.prototype.removeEventListener;

var globalEvents = {},
    elementsWithEvents = [];

EventTarget.prototype.addEventListener = function() {
  if (elementsWithEvents.indexOf(this) === -1) {
    elementsWithEvents.push(this);
  }

  var index = elementsWithEvents.indexOf(this);

  globalEvents[index] = globalEvents[index] || {};
  globalEvents[index][arguments[0]] = globalEvents[index][arguments[0]] || [];
  
  globalEvents[index][arguments[0]].push({
    handler: arguments[1],
    useCapture: ((arguments[2] === undefined) ? false : arguments[2])
  })

  nativeAddEventListener.apply(this, arguments);
}

EventTarget.prototype.removeEventListener = function() {
  var index = elementsWithEvents.indexOf(this);

  if (index > -1) {
    globalEvents[index] = globalEvents[index] || {};
    globalEvents[index][arguments[0]] = globalEvents[index][arguments[0]] || [];

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