var SERVER_ENDPOINT = 'http://loggio.herokuapp.com/endpoint';
//var SERVER_ENDPOINT = 'http://localhost:3000/endpoint';

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

function mapDOM(element) {
  var now = Date.now(),
      rand = Math.random() * now,
      id = Math.ceil(now + rand);

  element.setAttribute('data-loggid', id);

  for (var i = 0; i < element.children.length; i++) {
    mapDOM(element.children[i]);
  }
};