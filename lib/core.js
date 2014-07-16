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

        Logg.init();
        Logg.trackLocation();
      }
    });

    mapDOM(document.documentElement);
    Logg.initHighlight();
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