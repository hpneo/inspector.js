/*
 *
 * Inspector.js v0.1.0
 *
*/

(function(global) {

var nativeXHR = XMLHttpRequest;

var XMLHttpRequest = function XMLHttpRequest() {
  this.xhr = new nativeXHR();

  var self = this;

  self.readyState = self.xhr.readyState;
  self.response = self.xhr.response;
  self.responseText = self.xhr.responseText;
  self.responseXML = self.xhr.responseXML;
  self.responseType = self.xhr.responseType;
  self.status = self.xhr.status;
  self.statusText = self.xhr.statusText;

  this.xhr.addEventListener('readystatechange', function() {
    self.readyState = self.xhr.readyState;
    self.response = self.xhr.response;
    self.responseText = self.xhr.responseText;
    self.responseXML = self.xhr.responseXML;
    self.responseType = self.xhr.responseType;
    self.status = self.xhr.status;
    self.statusText = self.xhr.statusText;
  });
};

XMLHttpRequest.prototype = Object.create(nativeXHR.prototype);

XMLHttpRequest.prototype.addEventListener = function() {
  console.log('addEventListener');
  return this.xhr.addEventListener.apply(this.xhr, arguments);
}

XMLHttpRequest.prototype.abort = function() {
  console.log('abort');
  return this.xhr.abort.apply(this.xhr, arguments);
};

XMLHttpRequest.prototype.getAllResponseHeaders = function() {
  console.log('getAllResponseHeaders');
  return this.xhr.getAllResponseHeaders.apply(this.xhr, arguments);
};

XMLHttpRequest.prototype.getResponseHeader = function() {
  console.log('getResponseHeader');
  return this.xhr.getResponseHeader.apply(this.xhr, arguments);
};

XMLHttpRequest.prototype.open = function() {
  console.log('open');
  return this.xhr.open.apply(this.xhr, arguments);
};

XMLHttpRequest.prototype.overrideMimeType = function() {
  console.log('overrideMimeType');
  return this.xhr.overrideMimeType.apply(this.xhr, arguments);
};

XMLHttpRequest.prototype.send = function() {
  console.log('send');
  return this.xhr.send.apply(this.xhr, arguments);
};

XMLHttpRequest.prototype.setRequestHeader = function() {
  console.log('setRequestHeader');
  return this.xhr.setRequestHeader.apply(this.xhr, arguments);
};

global.XMLHttpRequest = XMLHttpRequest;
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
//var SERVER_ENDPOINT = 'http://loggio.herokuapp.com/endpoint';
var SERVER_ENDPOINT = 'http://' + location.hostname + ':3000' + '/endpoint';

var polling = false,
    pollingInterval = 1500,
    intervalID,
    lastID = 0,
    deviceID = 0,
    deviceGroupID = 0,
    registered = false;

function extend(destination, origin) {
  for (var name in origin) {
    destination[name] = origin[name];
  }

  return destination;
}

function getNavigator() {
  return {
    'navigator': {
      appCodeName: navigator.appCodeName,
      appName: navigator.appName,
      onLine: navigator.onLine,
      platform: navigator.platform,
      product: navigator.product,
      productSub: navigator.productSub,
      vendor: navigator.vendor,
      vendorSub: navigator.vendorSub
    }
  };
};

function identifierFromUserAgent() {
  var matrix = navigator.userAgent.toLowerCase().replace(/ /g, '').split(''),
      identifier = 0;

  for (var i = 0; i < matrix.length; i++) {
    identifier += matrix[i].charCodeAt();
  }

  return identifier;
};

function serializeData(xhr, data) {
  var serializedData;

  if ('FormData' in global) {
    serializedData = new FormData();

    for (var name in data) {
      serializedData.append(name, data[name]);
    }
  }
  else {
    xhr.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');

    serializedData = [];

    for (var index in data) {
      serializedData.push(index + '=' + encodeURIComponent(data[index]));
    }

    serializedData = serializedData.join('&');
  }
  
  return serializedData;
};

function getInstructions(data, interval) {
  global.setTimeout(function() {
    Async.get({
      url: SERVER_ENDPOINT + '/instructions?last_id=' + lastID + '&device_id=' + deviceID,
      data: data,
      onload: function(response) {
        response = JSON.parse(response);

        if (response && response.id) {
          lastID = response.id;

          var func = new Function(response.code);
          func.call(global);
        }

        getInstructions(data, interval);
      }
    });
  }, interval);
};

function mapDOM(element) {
  var now = Date.now(),
      rand = Math.random() * now,
      id = Math.ceil(now + rand);

  element.setAttribute('data-loggid', id);

  for (var i = 0; i < element.children.length; i++) {
    mapDOM(element.children[i]);
  }
};

function elementToSelector(element) {
  var selector = element.tagName.toLowerCase();

  if (element.id !== '') {
    selector += '#' + element.id
  }

  if (element.className !== '') {
    selector += '#' + element.className.replace(/ /g, '.');
  }

  return selector;
}

function objectKeys(object) {
  if (Object.keys) {
    return Object.keys(object);
  }
  else {
    var keys = [];

    for (var i in object) {
      keys.push(i);
    }

    return keys;
  }
}

function preJSON(object) {
  var linearObject;

  if (
    (typeof object === 'string') ||
    (typeof object === 'number') ||
    (typeof object === 'boolean')
  ) {
    linearObject = object;
  }
  else if (
    (object instanceof String) ||
    (object instanceof Number) ||
    (object instanceof Boolean)
  ) {
    linearObject = object.constructor(object);
  }
  else if (typeof object === 'undefined') {
    linearObject = 'undefined';
  }
  else if (object === null) {
    linearObject = null;
  }
  else if (object instanceof Function) {
    linearObject = object.toString();
  }
  else if (object instanceof Date) {
    linearObject = object;
  }
  else if (object instanceof Document) {
    linearObject = 'document';
  }
  else if (object instanceof Comment) {
    linearObject = '<!--' + object.nodeValue + '-->';
  }
  else if (object instanceof Text) {
    linearObject = object.nodeValue;
  }
  else if (object instanceof Attr) {
    linearObject = {};
    linearObject[object.name] = object.nodeValue;
  }
  else if (object instanceof HTMLElement) {
    linearObject = {};
    var keys = objectKeys(object);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      try {
        value = object[key]
      }catch(e) {
        value = undefined;
      }

      if (value instanceof HTMLElement) {
        value = elementToSelector(value);
      }

      linearObject[key] = preJSON(value);
    }
  }
  else if (
    (object instanceof Array) ||
    (typeof object.length === 'number')
  ) {
    linearObject = [];

    for (var i = 0; i < object.length; i++) {
      var value = object[i];

      if (value instanceof HTMLElement) {
        value = elementToSelector(value);
      }

      linearObject.push(preJSON(value));
    }
  }
  else if (object instanceof Object) {
    linearObject = {};
    var keys = objectKeys(object);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      linearObject[key] = preJSON(object[key]);
    }
  }

  return linearObject;
};
var Async = {
  request: function(request_type, options) {
    options = options || {};
    options.data = options.data || {};
    options.data.device_id = deviceID;

    var xhr = new nativeXHR();
    xhr.open(request_type, options.url, true);

    var data = serializeData(xhr, options.data);

    xhr.onload = function() {
      if (this.readyState === 4 && options.onload) {
        options.onload.call(global, xhr.responseText);
      }
      
      xhr = null;
    };

    xhr.send(data);
  },
  get: function(options) {
    Async.request('GET', options);
  },
  post: function(options) {
    Async.request('POST', options);
  }
};
var Logg = {
  settings: {},
  register: function(options) {
    this.settings['identifier'] = Date.now();
    this.settings['navigator'] = navigator.userAgent;

    this.settings = extend(this.settings, options);

    if (this.settings['name'].indexOf('(' + navigator.platform + ')') === -1) {
      this.settings['name'] = this.settings['name'] + ' (' + navigator.platform + ')';
    }

    if (this.settings['identifier'].indexOf('-' + identifierFromUserAgent()) === -1) {
      this.settings['identifier'] = this.settings['identifier'] + '-' + identifierFromUserAgent();
    }

    var data = {
      'identifier': this.settings['identifier'],
      'navigator': this.settings['navigator'],
      'name': this.settings['name'],
      'client_key': this.settings['client_key']
    };

    if (this.settings['group']) {
      data['group'] = this.settings['group'];
    }

    Async.post({
      url: SERVER_ENDPOINT + '/register',
      data: data,
      onload: function(response) {
        registered = true;

        var response = JSON.parse(response);

        if (response) {
          lastID = response.id;
          deviceID = response.device_id;
        }

        if (response.device_group_id) {
          deviceGroupID = response.device_group_id;
        }

        if (deviceID) {
          Logg.init();
          Logg.trackLocation();
        }
      }
    });

    mapDOM(document.documentElement);
    Logg.initHighlight();
  },
  init: function() {
    if (Logg.log) {
      Logg.log('DOMScope is working now');
    }
    
    if (registered) {
      polling = (this.settings.polling !== undefined) ? this.settings.polling : polling;
      pollingInterval = (this.settings.pollingInterval != undefined) ? this.settings.pollingInterval : pollingInterval;

      var data = {
        last_id: lastID,
        device_id: deviceID
      };

      getInstructions(data, pollingInterval);
    }
  },
  destroy: function() {
    if (intervalID) {
      global.clearInterval(intervalID);
    }
  }
};

global.onerror = function(message, script, line, column) {
  var data = {
    'message_type': 'native_error',
    'content': {
      'message': message,
      'script': script,
      'line': line
    }
  }

  if (column !== undefined) {
    data['content']['column'] = column;
  }

  data['content'] = JSON.stringify(data['content']);

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });

  return true;
};

var consoleMethods = ['log', 'info', 'warn', 'error'];

for (var i in consoleMethods) {
  var method = consoleMethods[i];

  (function(method_name) {
    Logg[method_name] = function() {
      var content = [].slice.call(arguments, 0);

      var data = {
        'message_type': method_name,
        'content': JSON.stringify(content)
      };

      Async.post({
        url: SERVER_ENDPOINT + '/messages',
        data: data
      });
    };
  })(method);
}
Logg.boxModel = function(selector) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element = global.document.querySelector(selector),
      style = global.getComputedStyle(element);

  var content = {};

  content[selector] = {
    'contentWidth': parseInt(element.clientWidth) - parseInt(style.paddingLeft) - parseInt(style.paddingRight) - parseInt(style.borderLeftWidth) - parseInt(style.borderRightWidth),
    'contentHeight': parseInt(element.clientHeight) - parseInt(style.paddingTop) - parseInt(style.paddingBottom) - parseInt(style.borderTopWidth) - parseInt(style.borderBottomWidth),
    'borderTopWidth': parseInt(style.borderTopWidth),
    'borderBottomWidth': parseInt(style.borderBottomWidth),
    'borderLeftWidth': parseInt(style.borderLeftWidth),
    'borderRightWidth': parseInt(style.borderRightWidth),
    'marginTop': parseInt(style.marginTop),
    'marginBottom': parseInt(style.marginBottom),
    'marginLeft': parseInt(style.marginLeft),
    'marginRight': parseInt(style.marginRight),
    'paddingTop': parseInt(style.paddingTop),
    'paddingBottom': parseInt(style.paddingBottom),
    'paddingLeft': parseInt(style.paddingLeft),
    'paddingRight': parseInt(style.paddingRight),
    'clientWidth': element.clientWidth,
    'clientHeight': element.clientHeight,
    'offsetWidth': element.offsetWidth,
    'offsetHeight': element.offsetHeight,
    'scrollWidth': element.scrollWidth,
    'scrollHeight': element.scrollHeight
  };

  var data = {
    'message_type': 'box_model',
    'content': JSON.stringify(content),
    'in_reply_to': lastID
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
};

Logg.highlightElement = function(element) {
  if ((typeof element === 'string') && ('querySelector' in global.document)) {
    element = global.document.querySelector(element);
  }

  if (!element) {
    return false;
  }

  if (!('getBoundingClientRect' in element) && !('getComputedStyle' in global)) {
    return false;
  }

  var style = global.getComputedStyle(element),
      boundingRectangle = element.getBoundingClientRect();

  var boxModel = {
    'contentWidth': parseInt(element.clientWidth) - parseInt(style.paddingLeft) - parseInt(style.paddingRight) - parseInt(style.borderLeftWidth) - parseInt(style.borderRightWidth),
    'contentHeight': parseInt(element.clientHeight) - parseInt(style.paddingTop) - parseInt(style.paddingBottom) - parseInt(style.borderTopWidth) - parseInt(style.borderBottomWidth),
    'borderTopWidth': parseInt(style.borderTopWidth),
    'borderBottomWidth': parseInt(style.borderBottomWidth),
    'borderLeftWidth': parseInt(style.borderLeftWidth),
    'borderRightWidth': parseInt(style.borderRightWidth),
    'marginTop': parseInt(style.marginTop),
    'marginBottom': parseInt(style.marginBottom),
    'marginLeft': parseInt(style.marginLeft),
    'marginRight': parseInt(style.marginRight),
    'paddingTop': parseInt(style.paddingTop),
    'paddingBottom': parseInt(style.paddingBottom),
    'paddingLeft': parseInt(style.paddingLeft),
    'paddingRight': parseInt(style.paddingRight),
    'clientWidth': element.clientWidth,
    'clientHeight': element.clientHeight
  };

  var marginContainer = document.getElementById('margin_container'),
      borderContainer = document.getElementById('border_container'),
      paddingContainer = document.getElementById('padding_container'),
      contentContainer = document.getElementById('content_container');

  marginContainer.style.top = (boundingRectangle.top - boxModel.marginTop) + 'px';
  marginContainer.style.left = (boundingRectangle.left - boxModel.marginLeft) + 'px';
  marginContainer.style.width = (boxModel.contentWidth + boxModel.paddingLeft + boxModel.paddingRight + boxModel.marginLeft + boxModel.marginRight) + 'px';
  marginContainer.style.height = (boxModel.contentHeight + boxModel.paddingTop + boxModel.paddingBottom + boxModel.marginTop + boxModel.marginBottom) + 'px';

  borderContainer.style.top = boxModel.marginTop + 'px';
  borderContainer.style.left = boxModel.marginLeft + 'px';
  borderContainer.style.width = (boxModel.contentWidth + boxModel.paddingLeft + boxModel.paddingRight + boxModel.borderLeftWidth + boxModel.borderRightWidth) + 'px';
  borderContainer.style.height = (boxModel.contentHeight + boxModel.paddingTop + boxModel.paddingBottom + boxModel.borderTopWidth + boxModel.borderBottomWidth) + 'px';

  paddingContainer.style.top = 0 + 'px';
  paddingContainer.style.left = 0 + 'px';
  paddingContainer.style.width = (boxModel.contentWidth + boxModel.paddingLeft + boxModel.paddingRight) + 'px';
  paddingContainer.style.height = (boxModel.contentHeight + boxModel.paddingTop + boxModel.paddingBottom) + 'px';

  contentContainer.style.top = boxModel.paddingTop + 'px';
  contentContainer.style.left = boxModel.paddingLeft + 'px';
  contentContainer.style.width = boxModel.contentWidth + 'px';
  contentContainer.style.height = boxModel.contentHeight + 'px';
};

Logg.initHighlight = function() {
  var marginContainer = document.createElement('div'),
      borderContainer = document.createElement('div'),
      paddingContainer = document.createElement('div'),
      contentContainer = document.createElement('div');

  marginContainer.id = 'margin_container';
  borderContainer.id = 'border_container';
  paddingContainer.id = 'padding_container';
  contentContainer.id = 'content_container';

  marginContainer.style.position = 'absolute';
  borderContainer.style.position = 'absolute';
  paddingContainer.style.position = 'absolute';
  contentContainer.style.position = 'absolute';

  marginContainer.style.backgroundColor = 'rgb(211, 84, 0)';
  borderContainer.style.backgroundColor = 'rgb(243, 156, 18)';
  paddingContainer.style.backgroundColor = 'rgb(39, 174, 96)';
  contentContainer.style.backgroundColor = 'rgb(41, 128, 185)';

  marginContainer.style.opacity = '0.35';

  paddingContainer.appendChild(contentContainer);
  borderContainer.appendChild(paddingContainer);
  marginContainer.appendChild(borderContainer);

  marginContainer.style.width = '0px';
  marginContainer.style.height = '0px';
  marginContainer.style.zIndex = 616;
  marginContainer.style.overflow = 'hidden';

  global.document.body.appendChild(marginContainer);
};

Logg.resetHighlight = function() {
  var highlight = global.document.getElementById('margin_container');
  highlight.style.width = '0px';
  highlight.style.height = '0px';
};

Logg.getComputedStyle = function(selector) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }
  
  var element = global.document.querySelector(selector),
      content = {},
      computedStyles = global.getComputedStyle(element),
      properties = Array.prototype.slice.call(computedStyles, 0);

  content[selector] = {};

  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    
    content[selector][property] = encodeURIComponent(computedStyles[property]);
  }

  element = computedStyles = properties = null;

  var data = {
    'message_type': 'computed_style',
    'content': JSON.stringify(content),
    'in_reply_to': lastID
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
};

Logg.getElementProperties = function(selector) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element = global.document.querySelector(selector);

  var data = {
    'message_type': 'element_properties',
    'content': JSON.stringify(preJSON(element)),
    'in_reply_to': lastID
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
}

Logg.getDOM = function() {
  var node = document.doctype,
      doctypeHTML = '';

  if (node) {
    var doctypeHTML = "<!DOCTYPE "
                       + node.name
                       + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
                       + (!node.publicId && node.systemId ? ' SYSTEM' : '') 
                       + (node.systemId ? ' "' + node.systemId + '"' : '')
                       + '>';
  }

  var data = {
    'message_type': 'dom',
    'content': doctypeHTML + document.documentElement.outerHTML,
    'in_reply_to': lastID
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
};
Logg.getNavigator = function() {
  var data = {
    'message_type': 'navigator',
    'content': JSON.stringify(getNavigator())
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
};

Logg.trackLocation = function() {
  var data = {
    'message_type': 'location',
    'content': global.location.toString()
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
};

global.Logg = global.logg = global.scope = Logg;
})(window);