var Async = {
  request: function(request_type, options) {
    options = options || {};
    options.data = options.data || {};
    options.data.device_id = deviceID;

    var xhr = new nativeXHR();
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