'use strict';

var xhr = require('promised-xhr'),
    forEach = require('lodash-compat/collection/forEach'),
    map = require('lodash-compat/collection/map'),
    capitalize = require('lodash-compat/string/capitalize');

function createIdentifier() {
  var matrix = global.navigator.userAgent.toLowerCase().replace(/ /g, '').split(''),
      identifier = 0;

  for (var i = 0; i < matrix.length; i++) {
    identifier += matrix[i].charCodeAt();
  }

  return identifier;
};

function extractSettings(options) {
  var baseIdentifier = options.identifier,
      computedIdentifier = createIdentifier(),
      endpoint = (options.endpoint || process.env.SERVER_ENDPOINT),
      alertOnError = (typeof options.alertOnError === 'boolean') ? options.alertOnError : false,
      settings = {
        'navigator': global.navigator.userAgent,
        'endpoint': endpoint,
        'alertOnError': alertOnError,
        'clientKey': options.clientKey
      };

  xhr.base = '';
  settings.name = options.name || capitalize(baseIdentifier.replace(/-/g, ' '));

  if (settings.name.indexOf('(' + global.navigator.platform + ')') === -1) {
    settings.name = (settings.name + ' (' + global.navigator.platform + ')');
  }

  if (baseIdentifier.indexOf('-' + computedIdentifier) === -1) {
    settings.identifier = baseIdentifier + '-' + computedIdentifier;
  }
  else {
    settings.identifier = baseIdentifier;
  }

  if (options.group) {
    settings.group = options.group;
  }
  else {
    // settings.group = baseIdentifier.replace('-' + computedIdentifier, '');
  }

  return settings;
}

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
  var keys = [];

  for (var key in object) {
    keys.push(key);
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

function cssStyleDeclarationToObject(style) {
  var cssObject = {},
      properties = [].slice.call(style);

  forEach(properties, function(propertyName) {
    cssObject[propertyName] = style.getPropertyValue(propertyName);
  });

  return cssObject;
}

function preJSON(object) {
  var linearObject,
      isPrimitiveString = (typeof object === 'string'),
      isPrimitiveNumber = (typeof object === 'number'),
      isPrimitiveBoolean = (typeof object === 'boolean'),
      isInstanceOfString = (object instanceof String),
      isInstanceOfNumber = (object instanceof Number),
      isInstanceOfBoolean = (object instanceof Boolean),
      isInstanceOfArray = (object instanceof Array),
      isInstanceOfNodeList = (object instanceof NodeList),
      isInstanceOfHTMLCollection = (object instanceof HTMLCollection);

  if (isPrimitiveString || isPrimitiveNumber || isPrimitiveBoolean) {
    linearObject = object;
  }
  else if (isInstanceOfString || isInstanceOfNumber || isInstanceOfBoolean) {
    linearObject = object.constructor(object);
  }
  else if (typeof object === 'undefined') {
    linearObject = 'undefined';
  }
  else if (object === null) {
    linearObject = null;
  }
  else if (object instanceof Function) {
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
    linearObject = ('<!--' + object.nodeValue + '-->');
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

    var keys = objectKeys(object),
        value;

    forEach(keys, function(key) {
      try {
        value = object[key]
      }catch(e) {
        value = undefined;
      }

      if (value instanceof HTMLElement) {
        value = elementToSelector(value);
      }

      linearObject[key] = preJSON(value);
    });
  }
  else if (isInstanceOfArray || isInstanceOfNodeList || isInstanceOfHTMLCollection) {
    linearObject = map(object, function(item) {
      if (item instanceof HTMLElement) {
        item = elementToSelector(item);
      }

      return preJSON(item);
    });
  }
  else if (object instanceof Object) {
    linearObject = {};
    var keys = objectKeys(object);

    forEach(keys, function(key) {
      linearObject[key] = preJSON(object[key]);
    })
  }

  return linearObject;
}

function mapDOM(element) {
  var now = Date.now(),
      rand = Math.random() * now,
      id = Math.ceil(now + rand);

  element.setAttribute('data-loggid', id);

  for (var i = 0; i < element.children.length; i++) {
    mapDOM(element.children[i]);
  }
}

function post(url, params) {
  return xhr.post(url, { data: params });
}

module.exports = {
  extractSettings: extractSettings,
  preJSON: preJSON,
  mapDOM: mapDOM,
  cssStyleDeclarationToObject: cssStyleDeclarationToObject,
  matchesSelector: matchesSelector,
  elementToSelector: elementToSelector,
  keys: objectKeys,
  post: post
};