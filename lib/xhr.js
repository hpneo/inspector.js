var nativeXHR = global.XMLHttpRequest;

if (true) {
  var XMLHttpRequestWrapper = function XMLHttpRequest() {
    this.xhr = new nativeXHR();

    var self = this;

    self.readyState = self.xhr.readyState;
    self.response = self.xhr.response;
    self.responseText = self.xhr.responseText;
    self.responseXML = self.xhr.responseXML;
    self.responseType = self.xhr.responseType;
    self.status = self.xhr.status;
    self.statusText = self.xhr.statusText;
    self._request_headers = {};
    self._id = Date.now();

    var c = 0;

    self.xhr.addEventListener('readystatechange', function(e) {
      var url = '',
          response_headers = {};

      try {
        self.readyState = self.xhr.readyState;
        self.response = self.xhr.response;
        self.responseText = self.xhr.responseText;
        self.responseXML = self.xhr.responseXML;
        self.responseType = self.xhr.responseType;
        self.status = self.xhr.status;
        self.statusText = self.xhr.statusText;

        url = self._url;
        response_headers = self.xhr.getAllResponseHeaders();
      }
      catch(ex) {}

      var data = {
        id: (self._id + '_' + c),
        readyState: self.readyState,
        status: self.status,
        statusText: self.statusText,
        responseText: self.responseText,
        responseType: self.responseType,
        request_headers: self._request_headers,
        response_headers: response_headers,
        method: self._method,
        mime_type: self._mime_type,
        url: url,
        at: Math.round(new Date().getTime() / 1000)
      };

      Async.post({
        url: SERVER_ENDPOINT + '/messages',
        data: {
          'message_type': 'xhr',
          'internal_id': self._id,
          'content': JSON.stringify(preJSON(data))
        }
      });

      c = c + 1;
    });
  };

  XMLHttpRequestWrapper.prototype = Object.create(nativeXHR.prototype);

  XMLHttpRequestWrapper.prototype.addEventListener = function() {
    return this.xhr.addEventListener.apply(this.xhr, arguments);
  }

  XMLHttpRequestWrapper.prototype.abort = function() {
    return this.xhr.abort.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.getAllResponseHeaders = function() {
    return this.xhr.getAllResponseHeaders.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.getResponseHeader = function() {
    return this.xhr.getResponseHeader.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.open = function() {
    this._method = arguments[0];
    this._url = arguments[1];

    return this.xhr.open.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.overrideMimeType = function() {
    this._mime_type = arguments[0];
    return this.xhr.overrideMimeType.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.send = function() {
    return this.xhr.send.apply(this.xhr, arguments);
  };

  XMLHttpRequestWrapper.prototype.setRequestHeader = function() {
    this._request_headers = this._request_headers || {};
    this._request_headers[arguments[0]] = arguments[1];

    return this.setRequestHeader.apply(this.xhr, arguments);
  };

  function customXHROpen() {
    this._method = arguments[0];
    this._url = arguments[1];

    console.log(nativeXHR.prototype.open);

    return nativeXHR.prototype.open.apply(this, arguments);
  }

  function customXHRSetRequestHeader() {
    this._request_headers = this._request_headers || {};
    this._request_headers[arguments[0]] = arguments[1];

    return nativeXHR.prototype.setRequestHeader.apply(this, arguments);
  }

  function customXHROverrideMimeType() {
    this._mime_type = arguments[0];

    return nativeXHR.prototype.overrideMimeType.apply(this, arguments);
  };

  global.XMLHttpRequest = XMLHttpRequestWrapper;

  global.addEventListener('load', function() {
    function customXHRFactory() {
      var xhr = new nativeXHR(),
          c = 0,
          _id = Date.now();

      xhr.open = customXHROpen;
      xhr.setRequestHeader = customXHRSetRequestHeader;
      xhr.overrideMimeType = customXHROverrideMimeType;

      xhr.addEventListener('readystatechange', function(e) {
        var data = {
          id: (_id + '_' + c),
          readyState: this.readyState,
          status: this.status,
          statusText: this.statusText,
          responseText: this.responseText,
          responseType: this.responseType,
          request_headers: this._request_headers,
          response_headers: this.getAllResponseHeaders(),
          method: this._method,
          at: Math.round(new Date().getTime() / 1000),
          mime_type: this._mime_type,
          url: this._url
        };

        Async.post({
          url: SERVER_ENDPOINT + '/messages',
          data: {
            'message_type': 'xhr',
            'internal_id': _id,
            'content': JSON.stringify(preJSON(data))
          }
        });

        c = c + 1;
      });

      return xhr;
    }

    if ('jQuery' in global) {
      global.jQuery.support.cors = true;
      global.jQuery.ajaxSettings.xhr = customXHRFactory;
    }

    if ('Zepto' in global) {
      global.Zepto.support.cors = true;
      global.Zepto.ajaxSettings.xhr = customXHRFactory;
    }
  });
}