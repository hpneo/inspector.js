'use strict';

var Scope = {},
    pick = require('lodash-compat/object/pick'),
    assign = require('lodash-compat/object/assign'),
    mixin = require('lodash-compat/utility/mixin'),
    forEach = require('lodash-compat/collection/forEach'),
    internalMethods = require('./lib/internal_methods');

function afterRegister(self, data) {
  if (data) {
    if ('error' in data) {
      alert(data['error']);
    }
    else {
      self.deviceID = data.device_id;
      self.deviceGroupID = data.device_group_id;

      if (self.deviceID) {
        self.createClient();
        self.trackLocation();

        self.log('DOMScope is working now');
        self.isRegistered = true;
      }
    }
  }
}

Scope.initialize = Scope.register = function register(options) {
  this.settings = internalMethods.extractSettings(options);

  if (options.device_id) {
    afterRegister(this, options);
  }
  else {
    var data = pick(this.settings, ['identifier', 'navigator', 'name', 'clientKey', 'group']);

    var request = internalMethods.post(this.settings.endpoint.replace('/endpoint', '/devices/register.json'), data),
        self = this;

    request.then(function onRequestSuccess(response) {
      afterRegister(self, response.body);
    });
  }

  internalMethods.mapDOM(global.document.documentElement);
  global.addEventListener('load', this.initHighlight);
};

Scope.createClient = function createClient() {
  var deviceID = this.deviceID;

  this.client = new global.Faye.Client(this.settings.endpoint);

  this.client.subscribe('/instructions/' + deviceID, function(message) {
    if (message.client_key === global.Scope.settings.clientKey) {
      Scope.lastID = message.instruction_id;

      try {
        var instructionFn = new Function('try {' + message.code + '}catch(e){ Scope.error({ name: e.name, message: e.message, stack: e.stack }); }');

        instructionFn.call(global);
      }
      catch(instructionError) {
        global.Scope.error({
          name: instructionError.name,
          message: instructionError.message,
          stack: instructionError.stack
        });

        if (global.Scope.settings.alertOnError) {
          alert('Name: ' + instructionError.name + '\nMessage: ' + instructionError.message + '\nStack:' + instructionError.stack);
        }
      }
    }
  });

  forEach(['log', 'info', 'warn', 'error'], function(method) {
    global.Scope[method] = function() {
      var content = [].slice.call(arguments, 0);

      var data = {
        'type': method,
        'content': JSON.stringify(internalMethods.preJSON(content))
      };

      global.Scope.sendMessage(data);
    };
  });
};

Scope.sendMessage = function(data) {
  data['device_id'] = this.deviceID;
  data['in_reply_to'] = this.lastID;
  data['client_key'] = this.settings.clientKey;
  data['persist'] = (data['persist'] === undefined) ? true : data['persist'];

  // console.log('sendMessage', this.settings.clientKey);

  global.Scope.client.publish('/messages/' + this.deviceID, data);
};

global.onerror = function(message, script, line, column) {
  var data = {
        'type': 'native_error',
        'device_id': Scope.deviceID
      },
      content = {
        'message': message,
        'script': script,
        'line': line
      };

  if (column !== undefined) {
    content['column'] = column;
  }

  data['content'] = JSON.stringify(content);

  global.Scope.sendMessage(data);

  if (Scope.settings.alertOnError) {
    alert('Message: ' + message + '\nScript: ' + script + ':' + line);
  }

  return true;
};

var EventInjection = require('./lib/event_injection'),
    DOM = require('./lib/dom'),
    Debug = require('./lib/debug'),
    Visual = require('./lib/visual'),
    Utility = require('./lib/utility'),
    Request = require('./lib/request');

assign(Scope, EventInjection);
mixin(Scope, Debug);
mixin(Scope, Visual);
mixin(Scope, DOM);
mixin(Scope, Utility);
mixin(Scope, Request);

global.Scope = global.Inspector = Scope;