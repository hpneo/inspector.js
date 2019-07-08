'use strict';

var globalRequests = [];

if (global.fetch) {
  var originalFetch = global.fetch;

  global.fetch = (function(originalFetch) {
    return function (input, init) {
      var startTime = Date.now();
      return originalFetch.apply(this, arguments).then(function(response) {
        if (typeof response.status === 'number') {
          var endTime = Date.now();
          var time = endTime - startTime;

          globalRequests.push({
            url: input,
            time: time
          });
        }

        return response;
      });
    }
  })(originalFetch);
}

module.exports = {
  globalRequests: globalRequests
};
