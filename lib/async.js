var Async = {
  request: function(request_type, options) {
    try {
      options = options || {};
      options.data = options.data || {};
      options.data.device_id = deviceID;

      var xhr = new nativeXHR();
      xhr.open(request_type, options.url, true);

      xhr.onerror = function(e) {
        if (this.readyState === 4 && options.onload) {
          if (!xhr.responseText || xhr.responseText === '') {
            xhr.responseText = {};
          }

          options.onload.call(global, xhr.responseText);
        }
        
        xhr = null;
      };

      xhr.onload = function() {
        if (this.readyState === 4 && options.onload) {
          options.onload.call(global, xhr.responseText);
        }
        
        xhr = null;
      };

      if (request_type === 'POST') {
        var data = serializeData(xhr, options.data);
        xhr.send(data);
      }
      else {
        xhr.send();
      }
    }
    catch(e) {
      alert(JSON.stringify(e));
    }
  },
  get: function(options) {
    Async.request('GET', options);
  },
  post: function(options) {
    Async.request('POST', options);
  }
};