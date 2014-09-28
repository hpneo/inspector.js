Logg.boxModel = function(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element = global.document.querySelector(selector),
      style = global.getComputedStyle(element);

  var content = {};

  content[selector] = {
    'contentWidth': parseInt(element.clientWidth) - parseInt(style.paddingLeft) - parseInt(style.paddingRight) - parseInt(style.borderLeftWidth) - parseInt(style.borderRightWidth),
    'contentHeight': parseInt(element.clientHeight) - parseInt(style.paddingTop) - parseInt(style.paddingBottom) - parseInt(style.borderTopWidth) - parseInt(style.borderBottomWidth),
    'borderTopWidth': parseInt(style.borderTopWidth),
    'borderBottomWidth': parseInt(style.borderBottomWidth),
    'borderLeftWidth': parseInt(style.borderLeftWidth),
    'borderRightWidth': parseInt(style.borderRightWidth),
    'marginTop': parseInt(style.marginTop),
    'marginBottom': parseInt(style.marginBottom),
    'marginLeft': parseInt(style.marginLeft),
    'marginRight': parseInt(style.marginRight),
    'paddingTop': parseInt(style.paddingTop),
    'paddingBottom': parseInt(style.paddingBottom),
    'paddingLeft': parseInt(style.paddingLeft),
    'paddingRight': parseInt(style.paddingRight),
    'clientWidth': element.clientWidth,
    'clientHeight': element.clientHeight,
    'offsetWidth': element.offsetWidth,
    'offsetHeight': element.offsetHeight,
    'scrollWidth': element.scrollWidth,
    'scrollHeight': element.scrollHeight
  };

  var data = {
    'message_type': 'box_model',
    'content': JSON.stringify(content),
    'in_reply_to': lastID
  };

  if (send) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.getComputedStyle = function(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }
  
  var element = global.document.querySelector(selector),
      content = {},
      computedStyles = global.getComputedStyle(element),
      properties = Array.prototype.slice.call(computedStyles, 0);

  content[selector] = CSSStyleDeclarationToObject(computedStyles);

  /*for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    
    content[selector][property] = encodeURIComponent(computedStyles[property]);
  }*/

  element = computedStyles = properties = null;

  var data = {
    'message_type': 'computed_style',
    'content': JSON.stringify(content),
    'in_reply_to': lastID
  };

  if (send) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.getElementProperties = function(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element = global.document.querySelector(selector);

  var data = {
    'message_type': 'element_properties',
    'content': JSON.stringify(preJSON(element)),
    'in_reply_to': lastID
  };

  if (send) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.getElementStyles = function(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element = global.document.querySelector(selector),
      stylesheets = document.styleSheets,
      elementStyles = {};

  for (var i = 0; i < stylesheets.length; i++) {
    var stylesheet = stylesheets[i],
        href = stylesheet.href || 'not_available',
        cssRules = stylesheet.cssRules || stylesheet.rules || [];

    for (var j = 0; j < cssRules.length; j++) {
      var selectorText = cssRules[j].selectorText;
      if (matchesSelector(element, selectorText)) {
        elementStyles[selectorText] = elementStyles[selectorText] || [];

        var elementStyle = {};
        elementStyle[href] = CSSStyleDeclarationToObject(cssRules[j].style);

        elementStyles[selectorText].push(elementStyle);
      }
    }
  }

  var data = {
    'message_type': 'element_styles',
    'content': JSON.stringify(preJSON(elementStyles)),
    'in_reply_to': lastID
  };

  if (send) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.getElementEvents = function(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element, elementEvents = {};

  if (selector === 'window') {
    element = global;
  }
  else {
    element = global.document.querySelector(selector);
  }
  
  var elementEventsIndex = elementsWithEvents.indexOf(element);

  if (elementEventsIndex > -1) {
    elementEvents = globalEvents[elementEventsIndex];
  }

  var data = {
    'message_type': 'element_events',
    'content': JSON.stringify(preJSON(elementEvents)),
    'in_reply_to': lastID
  };

  if (send) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: data
    });
  }
  else {
    return data;
  }
};

Logg.inspect = function(selector) {
  var boxModel = Logg.boxModel(selector, false),
      computedStyle = Logg.getComputedStyle(selector, false),
      properties = Logg.getElementProperties(selector, false),
      styles = Logg.getElementStyles(selector, false),
      events = Logg.getElementEvents(selector, false);

  var data = {
    'message_type': 'element_inspect',
    'content': JSON.stringify({
      boxModel: boxModel,
      computedStyle: computedStyle,
      properties: properties,
      styles: styles,
      events: events
    }),
    'in_reply_to': lastID
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
};