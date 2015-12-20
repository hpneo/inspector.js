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