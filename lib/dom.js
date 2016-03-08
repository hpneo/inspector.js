'use strict';

var filter = require('lodash-compat/collection/filter'),
    forEach = require('lodash-compat/collection/forEach'),
    map = require('lodash-compat/collection/map'),
    internalMethods = require('./internal_methods');

function getDOM(send) {
  var node = document.doctype,
      doctypeHTML = '';

  if (node) {
    var doctypeHTML = "<!DOCTYPE "
                       + node.name
                       + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
                       + (!node.publicId && node.systemId ? ' SYSTEM' : '')
                       + (node.systemId ? ' "' + node.systemId + '"' : '')
                       + '>';
  }

  var data = {
    'type': 'dom',
    'content': doctypeHTML + document.documentElement.outerHTML,
    'in_reply_to': global.Scope.lastID,
    'device_id': global.Scope.deviceID,
    'persist': send
  };

  global.Scope.sendMessage(data);
}

function getBoxModel(selector, send) {
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

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'box_model',
      'content': JSON.stringify(content)
    });
  }
  else {
    return content;
  }
}

function getMediaQueries(send) {
  var styleSheetsWithRules = filter(document.styleSheets, function(item) {
        return item.cssRules || item.rules
      }),
      styleSheetsWithMediaQueries = {},
      matchMediaSupport = !!global.matchMedia;

  if (matchMediaSupport) {
    forEach(styleSheetsWithRules, function(styleSheet) {
      var name = styleSheet.href,
          mediaRules = map(filter(styleSheet.cssRules || styleSheet.rules || [], function(item) {
            return item instanceof CSSMediaRule;
          }), function(item) {
            return item.media.mediaText;
          }),
          uniqueMediaRules = [];

      if (styleSheet.ownerNode.tagName === 'STYLE') {
        name = 'style_' + styleSheet.ownerNode.getAttribute('data-loggid');
      }

      forEach(mediaRules, function(mediaRule) {
        if (uniqueMediaRules.indexOf(mediaRule) === -1) {
          if (global.matchMedia(mediaRule).matches) {
            uniqueMediaRules.push(mediaRule);
          }
        }
      });

      if (uniqueMediaRules.length > 0) {
        styleSheetsWithMediaQueries[name] = uniqueMediaRules;
      }
    });
  }

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'media_queries',
      'content': JSON.stringify(internalMethods.preJSON(styleSheetsWithMediaQueries))
    });
  }
  else {
    return styleSheetsWithMediaQueries;
  }
}

function getComputedStyle(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element = global.document.querySelector(selector),
      content = {},
      computedStyles = global.getComputedStyle(element);
      // properties = Array.prototype.slice.call(computedStyles, 0);

  content[selector] = internalMethods.cssStyleDeclarationToObject(computedStyles);

  /*for (var i = 0; i < properties.length; i++) {
    var property = properties[i];

    content[selector][property] = encodeURIComponent(computedStyles[property]);
  }*/

  element = computedStyles = null;

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'computed_style',
      'content': JSON.stringify(content)
    });
  }
  else {
    return content;
  }
}

function getElementProperties(selector, send) {
  if (!('querySelector' in global.document) && !('getComputedStyle' in global)) {
    return false;
  }

  var element = global.document.querySelector(selector);

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'element_properties',
      'content': JSON.stringify(internalMethods.preJSON(element))
    });
  }
  else {
    return internalMethods.preJSON(element);
  }
}

function getElementStyles(selector, send) {
  if (!('querySelector' in global.document)) {
    return false;
  }

  var element = global.document.querySelector(selector),
      stylesheets = document.styleSheets,
      elementStyles = {};

  forEach(stylesheets, function(styleSheet) {
    var href = styleSheet.href || 'stylesheet_' + styleSheet.ownerNode.getAttribute('data-loggid'),
        cssRules = styleSheet.cssRules || styleSheet.rules || [];

    forEach(cssRules, function(cssRule) {
      if (cssRule instanceof CSSStyleRule) {
        var selectorText = cssRule.selectorText;

        if (internalMethods.matchesSelector(element, selectorText)) {
          elementStyles[selectorText] = elementStyles[selectorText] || [];

          var elementStyle = {};
          elementStyle[href] = internalMethods.cssStyleDeclarationToObject(cssRule.style);

          elementStyles[selectorText].push(elementStyle);
        }
      }
    });
  });

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'element_styles',
      'content': JSON.stringify(internalMethods.preJSON(elementStyles))
    });
  }
  else {
    return internalMethods.preJSON(elementStyles);
  }
}

function getElementEvents(selector, send) {
  if (!('querySelector' in global.document)) {
    return false;
  }

  var elementEvents = {},
      elementEventsIndex,
      element;

  if (selector === 'window') {
    element = global;
  }
  else {
    element = global.document.querySelector(selector);
  }

  elementEventsIndex = global.Scope.elementsWithEvents.indexOf(element);

  if (elementEventsIndex > -1) {
    elementEvents = global.Scope.globalEvents[elementEventsIndex];
  }

  if (send === undefined || send === true) {
    global.Scope.sendMessage({
      'type': 'element_events',
      'content': JSON.stringify(internalMethods.preJSON(elementEvents))
    });
  }
  else {
    return internalMethods.preJSON(elementEvents);
  }
}

function inspect(selector) {
  var boxModel = getBoxModel(selector, false),
      computedStyle = getComputedStyle(selector, false),
      properties = getElementProperties(selector, false),
      styles = getElementStyles(selector, false),
      events = getElementEvents(selector, false);

  var data = {
    'type': 'element_inspect',
    'content': JSON.stringify({
      styles: styles,
      computedStyle: computedStyle,
      properties: properties,
      boxModel: boxModel,
      events: events
    })
  };

  global.Scope.sendMessage(data);
}

module.exports = {
  getDOM: getDOM,
  getBoxModel: getBoxModel,
  boxModel: getBoxModel,
  getMediaQueries: getMediaQueries,
  getComputedStyle: getComputedStyle,
  getElementProperties: getElementProperties,
  getElementStyles: getElementStyles,
  getMatchedCSSRules: getElementStyles,
  getElementEvents: getElementEvents,
  inspect: inspect
};