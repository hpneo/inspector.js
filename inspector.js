/*
 *
 * Inspector.js v0.1.0
 *
*/

(function(global) {

var SERVER_ENDPOINT = 'http://loggio.herokuapp.com/endpoint';

var polling = false,
    pollingInterval = 1500,
    intervalID,
    lastID = 0,
    deviceID = 0,
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
      serializedData.push(i + '=' + data[index]);
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

    extend(this.settings, options);

    Async.post({
      url: SERVER_ENDPOINT + '/register',
      data: {
        'identifier': this.settings['identifier'] + identifierFromUserAgent(),
        'navigator': this.settings['navigator'],
        'name': this.settings['name'] + ' (' + navigator.platform + ')',
        'client_key': this.settings['client_key']
      },
      onload: function(response) {
        registered = true;

        var response = JSON.parse(response);

        if (response) {
          lastID = response.id;
          deviceID = response.device_id;
        }

        Logg.init();
      }
    });
  },
  init: function() {
    if (Logg.log) {
      Logg.log('Logg.io is working now');
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
  var element = document.querySelector(selector);
  var style = window.getComputedStyle(element);

  var content = {};

  content[selector] = {
    'contentWidth': parseInt(style.width),
    'contentHeight': parseInt(style.height),
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

Logg.getComputedStyle = function(selector) {
  var element = document.querySelector(selector),
      content = {},
      computedStyles = window.getComputedStyle(element),
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


global.Logg = Logg;
})(window);