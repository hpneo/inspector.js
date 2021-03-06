/*
 *
 * Inspector.js v0.1.0
 *
*/

(function(global) {
  "use strict";
var SERVER_ENDPOINT = 'http://loggio.herokuapp.com/endpoint';

var nativeXHR = global.XMLHttpRequest;

if (true) {
  var XMLHttpRequestWrapper = function XMLHttpRequest() {
    this.xhr = new nativeXHR();

    var self = this;

    self.readyState = self.xhr.readyState;
    self.response = self.xhr.response;
    self.responseText = self.xhr.responseText;
    self.responseXML = self.xhr.responseXML;
    self.responseType = self.xhr.responseType;
    self.status = self.xhr.status;
    self.statusText = self.xhr.statusText;
    self._request_headers = {};
    self._id = Date.now();

    var c = 0;

    self.xhr.addEventListener('readystatechange', function(e) {
      var url = '',
          response_headers = {};

      try {
        self.readyState = self.xhr.readyState;
        self.response = self.xhr.response;
        self.responseText = self.xhr.responseText;
        self.responseXML = self.xhr.responseXML;
        self.responseType = self.xhr.responseType;
        self.status = self.xhr.status;
        self.statusText = self.xhr.statusText;

        url = self._url;
        response_headers = self.xhr.getAllResponseHeaders();
      }
      catch(ex) {}

      var data = {
        id: (self._id + '_' + c),
        readyState: self.readyState,
        status: self.status,
        statusText: self.statusText,
        responseText: self.responseText,
        responseType: self.responseType,
        request_headers: self._request_headers,
        response_headers: response_headers,
        method: self._method,
        mime_type: self._mime_type,
        url: url,
        at: Math.round(new Date().getTime() / 1000)
      };

      Async.post({
        url: SERVER_ENDPOINT + '/messages',
        data: {
          'message_type': 'xhr',
          'internal_id': self._id,
          'content': JSON.stringify(preJSON(data))
        }
      });

      c = c + 1;
    });
  };

  XMLHttpRequestWrapper.prototype = Object.create(nativeXHR.prototype);

  XMLHttpRequestWrapper.prototype.addEventListener = function() {
    return this.xhr.addEventListener.apply(this.xhr, arguments);
  }

  XMLHttpRequestWrapper.prototype.abort = function() {
    return this.xhr.abort.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.getAllResponseHeaders = function() {
    return this.xhr.getAllResponseHeaders.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.getResponseHeader = function() {
    return this.xhr.getResponseHeader.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.open = function() {
    this._method = arguments[0];
    this._url = arguments[1];

    return this.xhr.open.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.overrideMimeType = function() {
    this._mime_type = arguments[0];
    return this.xhr.overrideMimeType.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.send = function() {
    return this.xhr.send.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.setRequestHeader = function() {
    this._request_headers = this._request_headers || {};
    this._request_headers[arguments[0]] = arguments[1];

    return this.setRequestHeader.apply(this.xhr, arguments);
  };

  function customXHROpen() {
    this._method = arguments[0];
    this._url = arguments[1];

    console.log(nativeXHR.prototype.open);

    return nativeXHR.prototype.open.apply(this, arguments);
  }

  function customXHRSetRequestHeader() {
    this._request_headers = this._request_headers || {};
    this._request_headers[arguments[0]] = arguments[1];

    return nativeXHR.prototype.setRequestHeader.apply(this, arguments);
  }

  function customXHROverrideMimeType() {
    this._mime_type = arguments[0];

    return nativeXHR.prototype.overrideMimeType.apply(this, arguments);
  };

  global.XMLHttpRequest = XMLHttpRequestWrapper;

  global.addEventListener('load', function() {
    function customXHRFactory() {
      var xhr = new nativeXHR(),
          c = 0,
          _id = Date.now();

      xhr.open = customXHROpen;
      xhr.setRequestHeader = customXHRSetRequestHeader;
      xhr.overrideMimeType = customXHROverrideMimeType;

      xhr.addEventListener('readystatechange', function(e) {
        var data = {
          id: (_id + '_' + c),
          readyState: this.readyState,
          status: this.status,
          statusText: this.statusText,
          responseText: this.responseText,
          responseType: this.responseType,
          request_headers: this._request_headers,
          response_headers: this.getAllResponseHeaders(),
          method: this._method,
          at: Math.round(new Date().getTime() / 1000),
          mime_type: this._mime_type,
          url: this._url
        };

        Async.post({
          url: SERVER_ENDPOINT + '/messages',
          data: {
            'message_type': 'xhr',
            'internal_id': _id,
            'content': JSON.stringify(preJSON(data))
          }
        });

        c = c + 1;
      });

      return xhr;
    }

    if ('jQuery' in global) {
      global.jQuery.support.cors = true;
      global.jQuery.ajaxSettings.xhr = customXHRFactory;
    }

    if ('Zepto' in global) {
      global.Zepto.support.cors = true;
      global.Zepto.ajaxSettings.xhr = customXHRFactory;
    }
  });
}
var EventPrototype;

if ('EventTarget' in global) {
  EventPrototype = EventTarget.prototype;
}
else {
  EventPrototype = Node.prototype;
}

var nativeAddEventListener = EventPrototype.addEventListener,
    nativeRemoveEventListener = EventPrototype.removeEventListener;

var globalEvents = {},
    elementsWithEvents = [];

if (true) {
  EventPrototype.addEventListener = function() {
    var index = elementsWithEvents.indexOf(this);

    if (index === -1) {
      elementsWithEvents.push(this);
      index = elementsWithEvents.indexOf(this);
    }

    var eventName = arguments[0];

    globalEvents[index] = globalEvents[index] || {};
    globalEvents[index][eventName] = globalEvents[index][eventName] || [];
    
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
}
var polling = false,
    pollingInterval = 1500,
    intervalID,
    lastID = 0,
    deviceID = 0,
    deviceGroupID = 0,
    registered = false,
    alertOnError = false;

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

          try {
            var func = new Function('try {' + response.code + '}catch(e){ Logg.error({message: e.message, stack: e.stack}); }');
            func.call(global);
          }
          catch(e) {
            Logg.error({
              name: e.name,
              message: e.message,
              stack: e.stack
            });

            if (alertOnError) {
              alert('Name: ' + e.name + '\nMessage: ' + e.message + '\nStack:' + e.stack);
            }
          }
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
  var keys;

  if (true) { //object instanceof HTMLElement
    keys = [];

    for (var i in object) {
      keys.push(i);
    }
  }
  else {
    if (Object.getOwnPropertyNames) {
      keys = Object.getOwnPropertyNames(object);
    }
    else if (Object.keys) {
      keys = Object.keys(object);
    }
    else {
      keys = [];

      for (var i in object) {
        keys.push(i);
      }
    }
  }

  return keys;
}

function matchesSelector(element, selector) {
  var matchesSelectorFn = element.webkitMatchesSelector || element.mozMatchesSelector || element.msMatchesSelector || element.oMatchesSelector || element.matchesSelector || element.matches;

  if (matchesSelectorFn === undefined) {
    return false;
  }
  else {
    return matchesSelectorFn.call(element, selector);
  }
}

function CSSStyleDeclarationToObject(style) {
  var cssObject = {};
  var properties = [].slice.call(style, 0);

  for (var i = 0; i < properties.length; i++) {
    cssObject[properties[i]] = style.getPropertyValue(properties[i]);
  }

  return cssObject;
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
    linearObject = '#document';
  }
  else if (global.Window && object instanceof global.Window) {
    linearObject = 'window';
  }
  else if (global.DOMWindow && object instanceof global.DOMWindow) {
    linearObject = 'window';
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
    (object instanceof NodeList) ||
    (object instanceof HTMLCollection)
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

function filterList(list, callback) {
  var filtered = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];

    if (callback(item)) {
      filtered.push(item);
    }
  }

  return filtered;
}

function mapList(list, callback) {
  var mapped = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];

    mapped.push(callback(item));
  }

  return mapped;
}

function trimString(string) {
  var trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
  return string.replace(trim, "");
}
var Async = {
  request: function(request_type, options) {
    try {
      options = options || {};
      options.data = options.data || {};
      options.data.device_id = deviceID;

      var xhr = new nativeXHR();
      xhr.open(request_type, options.url, true);

      xhr.onerror = function(e) {
        if (this.readyState === 4 && options.onload) {
          if (!xhr.responseText || xhr.responseText === '') {
            xhr.responseText = {};
          }

          options.onload.call(global, xhr.responseText);
        }
        
        xhr = null;
      };

      xhr.onload = function() {
        if (this.readyState === 4 && options.onload) {
          options.onload.call(global, xhr.responseText);
        }
        
        xhr = null;
      };

      if (request_type === 'POST') {
        var data = serializeData(xhr, options.data);
        xhr.send(data);
      }
      else {
        xhr.send();
      }
    }
    catch(e) {
      alert(JSON.stringify(e));
    }
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
    this.settings['navigator'] = navigator.userAgent;

    //this.settings = extend(this.settings, options);

    var baseIdentifier = options['identifier'];
    if (options['alertOnError'] === true || options['alertOnError'] === false) {
      alertOnError = options['alertOnError'];
    }

    if (options['name']) {
      this.settings['name'] = options['name'];
    }
    else {
      this.settings['name'] = baseIdentifier.replace(/-/g, ' ');
      this.settings['name'] = this.settings['name'][0].toUpperCase() + this.settings['name'].substring(1);
    }

    if (this.settings['name'].indexOf('(' + navigator.platform + ')') === -1) {
      this.settings['name'] = this.settings['name'] + ' (' + navigator.platform + ')';
    }

    if (baseIdentifier.indexOf('-' + identifierFromUserAgent()) === -1) {
      this.settings['identifier'] = baseIdentifier + '-' + identifierFromUserAgent();
    }
    else {
      this.settings['identifier'] = baseIdentifier;
    }

    if (options['group']) {
      this.settings['group'] = options['group'];
    }
    else {
      this.settings['group'] = baseIdentifier.replace('-' + identifierFromUserAgent(), '');
    }

    this.settings['client_key'] = options['client_key'];

    var data = {
      'identifier': this.settings['identifier'],
      'navigator': this.settings['navigator'],
      'name': this.settings['name'],
      'client_key': this.settings['client_key'],
      'group': this.settings['group']
    };

    Async.post({
      url: SERVER_ENDPOINT + '/register',
      data: data,
      onload: function(response) {
        registered = true;

        var response = JSON.parse(response);

        if (response && ('error' in response)) {
          alert(response['error']);
        }
        else {
          if (response['id']) {
            lastID = response['id'];
          }

          if (response) {
            deviceID = response['device_id'];
          }

          if (response['device_group_id']) {
            deviceGroupID = response['device_group_id'];
          }

          if (deviceID) {
            Logg.init();
            Logg.trackLocation();
          }
        }
      }
    });

    mapDOM(document.documentElement);
    window.onload = Logg.initHighlight;

    if ('jQuery' in global && XMLHttpRequestWrapper) {
      global.jQuery.ajaxSettings.xhr = function() {
        try {
          return new XMLHttpRequestWrapper();
        }
        catch(e) {
          
        }
      };
    }
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

  if (alertOnError) {
    alert('Message: ' + message + '\nScript: ' + script + ':' + line);
  }

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
        'content': JSON.stringify(preJSON(content))
      };

      Async.post({
        url: SERVER_ENDPOINT + '/messages',
        data: data
      });
    };
  })(method);
}

Logg.trace = function(func) {
  try {
    var func = new Function('try { return ' + func + '}catch(e){ Logg.error({message: e.message, stack: e.stack}); }');
    func.call(global).apply(global, [].slice.call(arguments, 1));
  }
  catch(e) {
    Logg.error({
      name: e.name,
      message: e.message,
      stack: e.stack
    })
  }
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
  marginContainer.style.zIndex = 9999;
  marginContainer.style.overflow = 'hidden';

  global.document.body.appendChild(marginContainer);
};

Logg.resetHighlight = function() {
  var highlight = global.document.getElementById('margin_container');
  highlight.style.width = '0px';
  highlight.style.height = '0px';
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

Logg.getMediaQueries = function(send) {
  var availableStyleSheets = filterList(document.styleSheets, function(item) { return item.cssRules || item.rules }),
      styleSheetsWithMediaQueries = {},
      matchMediaSupport = !!global.matchMedia;

  if (matchMediaSupport) {
    for (var i = 0; i < availableStyleSheets.length; i++) {
      var styleSheet = availableStyleSheets[i];

      var name = styleSheet.href,
          rules = styleSheet.cssRules || styleSheet.rules || [];;

      if (styleSheet.ownerNode.tagName === 'STYLE') {
        name = 'style_' + styleSheet.ownerNode.getAttribute('data-loggid');
      }

      var mediaRules = filterList(rules, function(item) { return item instanceof CSSMediaRule; }),
          uniqueMediaRules = [];

      mediaRules = mapList(mediaRules, function(item) { return item.media.mediaText; });

      for (var j = 0; j < mediaRules.length; j++) {
        var mediaRule = mediaRules[j];

        if (uniqueMediaRules.indexOf(mediaRule) === -1) {
          if (global.matchMedia(mediaRule).matches) {
            uniqueMediaRules.push(mediaRule);
          }
        }
      }

      if (uniqueMediaRules.length > 0) {
        styleSheetsWithMediaQueries[name] = uniqueMediaRules;
      }
    }
  }

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: {
        'message_type': 'media_queries',
        'content': JSON.stringify(preJSON(styleSheetsWithMediaQueries)),
        'in_reply_to': lastID
      }
    });
  }
  else {
    return styleSheetsWithMediaQueries;
  }
};
Logg.boxModel = function(selector, send) {
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

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.getComputedStyle = function(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }
  
  var element = global.document.querySelector(selector),
      content = {},
      computedStyles = global.getComputedStyle(element),
      properties = Array.prototype.slice.call(computedStyles, 0);

  content[selector] = CSSStyleDeclarationToObject(computedStyles);

  /*for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    
    content[selector][property] = encodeURIComponent(computedStyles[property]);
  }*/

  element = computedStyles = properties = null;

  var data = {
    'message_type': 'computed_style',
    'content': JSON.stringify(content),
    'in_reply_to': lastID
  };

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.getElementProperties = function(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element = global.document.querySelector(selector);

  var data = {
    'message_type': 'element_properties',
    'content': JSON.stringify(preJSON(element)),
    'in_reply_to': lastID
  };

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.getElementStyles = function(selector, send) {
  if (!('querySelector' in global.document)) {
    return false;
  }

  var element = global.document.querySelector(selector),
      stylesheets = document.styleSheets,
      elementStyles = {};

  for (var i = 0; i < stylesheets.length; i++) {
    var styleSheet = stylesheets[i],
        href = styleSheet.href || 'stylesheet_' + styleSheet.ownerNode.getAttribute('data-loggid'),
        cssRules = styleSheet.cssRules || styleSheet.rules || [];

    for (var j = 0; j < cssRules.length; j++) {
      var selectorText = cssRules[j].selectorText;
      if (matchesSelector(element, selectorText)) {
        elementStyles[selectorText] = elementStyles[selectorText] || [];

        var elementStyle = {};
        elementStyle[href] = CSSStyleDeclarationToObject(cssRules[j].style);

        elementStyles[selectorText].push(elementStyle);
      }
    }
  }

  var data = {
    'message_type': 'element_styles',
    'content': JSON.stringify(preJSON(elementStyles)),
    'in_reply_to': lastID
  };

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.getMatchedCSSRules = Logg.getElementStyles;

Logg.getElementEvents = function(selector, send) {
  if (!('querySelector' in global.document)) {
    return false;
  }

  var element, elementEvents = {};

  if (selector === 'window') {
    element = global;
  }
  else {
    element = global.document.querySelector(selector);
  }
  
  var elementEventsIndex = elementsWithEvents.indexOf(element);

  if (elementEventsIndex > -1) {
    elementEvents = globalEvents[elementEventsIndex];
  }

  var data = {
    'message_type': 'element_events',
    'content': JSON.stringify(preJSON(elementEvents)),
    'in_reply_to': lastID
  };

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.inspect = function(selector) {
  var boxModel = Logg.boxModel(selector, false),
      computedStyle = Logg.getComputedStyle(selector, false),
      properties = Logg.getElementProperties(selector, false),
      styles = Logg.getElementStyles(selector, false),
      events = Logg.getElementEvents(selector, false);

  var data = {
    'message_type': 'element_inspect',
    'content': JSON.stringify({
      boxModel: boxModel,
      computedStyle: computedStyle,
      properties: properties,
      styles: styles,
      events: events
    }),
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

Logg.getCookies = function(send) {
  var data = mapList(document.cookie.split(';'), function(item) {
    var pairArray = trimString(item).split('=');

    var cookie = {};

    cookie[pairArray[0]] = pairArray[1];

    return cookie;
  });

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: {
        'message_type': 'cookies',
        'content': JSON.stringify(preJSON(data)),
        'in_reply_to': lastID
      }
    });
  }
  else {
    return data;
  }
};

Logg.getLocalStorage = function(send) {
  var data = {};
  var localStorageKeys = Object.keys(global.localStorage);

  for (var i = 0; i < localStorageKeys.length; i++) {
    var localStorageKey = localStorageKeys[i],
        localStorageValue = global.localStorage[localStorageKey];

    data[localStorageKey] = localStorageValue;
  }

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: {
        'message_type': 'localstorage',
        'content': JSON.stringify(preJSON(data)),
        'in_reply_to': lastID
      }
    });
  }
  else {
    return data;
  }
};

Logg.getSessionStorage = function(send) {
  var data = {};
  var sessionStorageKeys = Object.keys(global.sessionStorage);

  for (var i = 0; i < sessionStorageKeys.length; i++) {
    var sessionStorageKey = sessionStorageKeys[i],
        sessionStorageValue = global.sessionStorage[sessionStorageKey];

    data[sessionStorageKey] = sessionStorageValue;
  }

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: {
        'message_type': 'sessionstorage',
        'content': JSON.stringify(preJSON(data)),
        'in_reply_to': lastID
      }
    });
  }
  else {
    return data;
  }
};

Logg.getScripts = function(send) {
  var scripts = mapList(document.scripts, function(script) {
    var name;

    if (script.getAttribute('src')) {
      name = script.getAttribute('src');
    }
    else {
      name = 'script_' + script.getAttribute('data-loggid');
    }

    return name;
  });

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: {
        'message_type': 'scripts',
        'content': JSON.stringify(preJSON(scripts)),
        'in_reply_to': lastID
      }
    });
  }
  else {
    return scripts;
  }
};

Logg.getStyleSheets = function(send) {
  var styleSheets = {};

  for (var i = 0; i < document.styleSheets.length; i++) {
    var styleSheet = document.styleSheets[i],
        name = styleSheet.href || 'stylesheet_' + styleSheet.ownerNode.getAttribute('data-loggid'),
        cssRules = styleSheet.cssRules || styleSheet.rules || [];

    styleSheets[name] = '';

    for (var j = 0; j < cssRules.length; j++) {
      var content = cssRules[j].cssText;

      styleSheets[name] += '\n' + content;
    }
  }

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: {
        'message_type': 'stylesheets',
        'content': JSON.stringify(preJSON(styleSheets)),
        'in_reply_to': lastID
      }
    });
  }
  else {
    return styleSheets;
  }
};

global.Logg = global.logg = global.Scope = Logg;
})(window);