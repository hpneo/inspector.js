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
