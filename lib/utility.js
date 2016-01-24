'use strict';

var forEach = require('lodash-compat/collection/forEach'),
    map = require('lodash-compat/collection/map'),
    assign = require('lodash-compat/object/assign'),
    internalMethods = require('./internal_methods');

function trimString(string) {
  var trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
  return string.replace(trim, '');
}

function getNavigatorData() {
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

function getNavigator() {
  var data = {
    'type': 'navigator',
    'content': JSON.stringify(getNavigatorData())
  };

  global.Scope.sendMessage(data);
};

function getCookies(send) {
  var data = {};

  forEach(document.cookie.split(';'), function(item) {
    var keyValue = trimString(item).split('=');

    data[keyValue[0]] = keyValue[1];
  });

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'cookies',
      'content': JSON.stringify(internalMethods.preJSON(data))
    });
  }
  else {
    return data;
  }
}

function getLocalStorage(send) {
  var data = assign({}, global.localStorage);

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'localstorage',
      'content': JSON.stringify(internalMethods.preJSON(data))
    });
  }
  else {
    return data;
  }
}

 function getSessionStorage(send) {
  var data = assign({}, global.sessionStorage);

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'sessionstorage',
      'content': JSON.stringify(internalMethods.preJSON(data))
    });
  }
  else {
    return data;
  }
}

function getScripts(send) {
  var scripts = map(document.scripts, function(script) {
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
    global.Scope.sendMessage({
      'type': 'scripts',
      'content': JSON.stringify(internalMethods.preJSON(scripts))
    });
  }
  else {
    return scripts;
  }
}

function getStyleSheets(send) {
  var styleSheets = {};

  forEach(document.styleSheets, function(styleSheet) {
    var name = styleSheet.href || 'stylesheet_' + styleSheet.ownerNode.getAttribute('data-loggid');

    styleSheets[name] = '';

    forEach(styleSheet.cssRules || styleSheet.rules || [], function(cssRule) {
      styleSheets[name] += '\n' + cssRule.cssText;
    });
  });

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'stylesheets',
      'content': JSON.stringify(internalMethods.preJSON(styleSheets))
    });
  }
  else {
    return styleSheets;
  }
}

function trackLocation() {
  var data = {
    'type': 'location',
    'content': global.location.toString()
  };

  global.Scope.sendMessage(data);
};

function getFeatures() {
  var featuresList,
      features = arguments;

  if (features.length > 0) {
    featuresList = {};

    forEach(features, function(feature) {
      if (feature instanceof RegExp) {
        forEach(global.Modernizr, function(featureValue, featureName) {
          if (featureName.match(feature)) {
            featuresList[featureName] = global.Modernizr[featureName];
          }
        });
      }
      else {
        featuresList[feature] = global.Modernizr[feature];
      }
    });
  }
  else {
    featuresList = global.Modernizr;
  }

  var data = {
    'type': 'features',
    'content': JSON.stringify(featuresList)
  };

  global.Scope.sendMessage(data);
}

module.exports = {
  trackLocation: trackLocation,
  getNavigator: getNavigator,
  getCookies: getCookies,
  getLocalStorage: getLocalStorage,
  getSessionStorage: getSessionStorage,
  getScripts: getScripts,
  getStyleSheets: getStyleSheets,
  getFeatures: getFeatures
};