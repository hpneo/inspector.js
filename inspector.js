/*
 *
 * Inspector.js v0.1.0
 *
*/

(function(global) {

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
var Async = {
  request: function(request_type, options) {
    options = options || {};
    options.data = options.data || {};
    options.data.device_id = deviceID;

    var xhr = new XMLHttpRequest();
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
    'content': JSON.stringify(content)
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
    'content': JSON.stringify(content)
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
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
    'content': doctypeHTML + document.documentElement.outerHTML
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