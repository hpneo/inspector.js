(function(global) {
  var SERVER_ENDPOINT = 'http://loggio.herokuapp.com/endpoint';
  //var SERVER_ENDPOINT = 'http://' + location.hostname + ':3000' + '/endpoint';

  var polling = false,
      pollingInterval = 1500,
      intervalID,
      lastID = 0,
      deviceID = 0,
      deviceGroupID = 0,
      registered = false;
