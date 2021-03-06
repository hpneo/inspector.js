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