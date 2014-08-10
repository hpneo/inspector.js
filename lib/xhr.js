var nativeXHR = XMLHttpRequest;

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

  self.xhr.addEventListener('readystatechange', function() {
    self.readyState = self.xhr.readyState;
    self.response = self.xhr.response;
    self.responseText = self.xhr.responseText;
    self.responseXML = self.xhr.responseXML;
    self.responseType = self.xhr.responseType;
    self.status = self.xhr.status;
    self.statusText = self.xhr.statusText;
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
  return this.xhr.open.apply(this.xhr, arguments);
};

XMLHttpRequestWrapper.prototype.overrideMimeType = function() {
  return this.xhr.overrideMimeType.apply(this.xhr, arguments);
};

XMLHttpRequestWrapper.prototype.send = function() {
  return this.xhr.send.apply(this.xhr, arguments);
};

XMLHttpRequestWrapper.prototype.setRequestHeader = function() {
  return this.xhr.setRequestHeader.apply(this.xhr, arguments);
};

global.XMLHttpRequest = XMLHttpRequestWrapper;
