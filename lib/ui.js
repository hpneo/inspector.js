Logg.initHighlight = function() {
  var marginContainer = document.createElement('div'),
      borderContainer = document.createElement('div'),
      paddingContainer = document.createElement('div'),
      contentContainer = document.createElement('div');

  marginContainer.id = 'margin_container';
  borderContainer.id = 'border_container';
  paddingContainer.id = 'padding_container';
  contentContainer.id = 'content_container';

  marginContainer.style.position = 'absolute';
  borderContainer.style.position = 'absolute';
  paddingContainer.style.position = 'absolute';
  contentContainer.style.position = 'absolute';

  marginContainer.style.backgroundColor = 'rgb(211, 84, 0)';
  borderContainer.style.backgroundColor = 'rgb(243, 156, 18)';
  paddingContainer.style.backgroundColor = 'rgb(39, 174, 96)';
  contentContainer.style.backgroundColor = 'rgb(41, 128, 185)';

  marginContainer.style.opacity = '0.35';

  paddingContainer.appendChild(contentContainer);
  borderContainer.appendChild(paddingContainer);
  marginContainer.appendChild(borderContainer);

  marginContainer.style.width = '0px';
  marginContainer.style.height = '0px';
  marginContainer.style.zIndex = 9999;
  marginContainer.style.overflow = 'hidden';

  global.document.body.appendChild(marginContainer);
};

Logg.resetHighlight = function() {
  var highlight = global.document.getElementById('margin_container');
  highlight.style.width = '0px';
  highlight.style.height = '0px';
};

Logg.highlightElement = function(element) {
  if ((typeof element === 'string') && ('querySelector' in global.document)) {
    element = global.document.querySelector(element);
  }

  if (!element) {
    return false;
  }

  if (!('getBoundingClientRect' in element) && !('getComputedStyle' in global)) {
    return false;
  }

  var style = global.getComputedStyle(element),
      boundingRectangle = element.getBoundingClientRect();

  var boxModel = {
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
    'clientHeight': element.clientHeight
  };

  var marginContainer = document.getElementById('margin_container'),
      borderContainer = document.getElementById('border_container'),
      paddingContainer = document.getElementById('padding_container'),
      contentContainer = document.getElementById('content_container');

  marginContainer.style.top = (boundingRectangle.top - boxModel.marginTop) + 'px';
  marginContainer.style.left = (boundingRectangle.left - boxModel.marginLeft) + 'px';
  marginContainer.style.width = (boxModel.contentWidth + boxModel.paddingLeft + boxModel.paddingRight + boxModel.marginLeft + boxModel.marginRight) + 'px';
  marginContainer.style.height = (boxModel.contentHeight + boxModel.paddingTop + boxModel.paddingBottom + boxModel.marginTop + boxModel.marginBottom) + 'px';

  borderContainer.style.top = boxModel.marginTop + 'px';
  borderContainer.style.left = boxModel.marginLeft + 'px';
  borderContainer.style.width = (boxModel.contentWidth + boxModel.paddingLeft + boxModel.paddingRight + boxModel.borderLeftWidth + boxModel.borderRightWidth) + 'px';
  borderContainer.style.height = (boxModel.contentHeight + boxModel.paddingTop + boxModel.paddingBottom + boxModel.borderTopWidth + boxModel.borderBottomWidth) + 'px';

  paddingContainer.style.top = 0 + 'px';
  paddingContainer.style.left = 0 + 'px';
  paddingContainer.style.width = (boxModel.contentWidth + boxModel.paddingLeft + boxModel.paddingRight) + 'px';
  paddingContainer.style.height = (boxModel.contentHeight + boxModel.paddingTop + boxModel.paddingBottom) + 'px';

  contentContainer.style.top = boxModel.paddingTop + 'px';
  contentContainer.style.left = boxModel.paddingLeft + 'px';
  contentContainer.style.width = boxModel.contentWidth + 'px';
  contentContainer.style.height = boxModel.contentHeight + 'px';
};

Logg.getDOM = function() {
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
    'message_type': 'dom',
    'content': doctypeHTML + document.documentElement.outerHTML,
    'in_reply_to': lastID
  };

  Async.post({
    url: SERVER_ENDPOINT + '/messages',
    data: data
  });
};

Logg.getMediaQueries = function(send) {
  var availableStyleSheets = filterList(document.styleSheets, function(item) { return item.cssRules || item.rules }),
      styleSheetsWithMediaQueries = {},
      matchMediaSupport = !!global.matchMedia;

  if (matchMediaSupport) {
    for (var i = 0; i < availableStyleSheets.length; i++) {
      var styleSheet = availableStyleSheets[i];

      var name = styleSheet.href,
          rules = styleSheet.cssRules || styleSheet.rules || [];;

      if (styleSheet.ownerNode.tagName === 'STYLE') {
        name = 'style_' + styleSheet.ownerNode.getAttribute('data-loggid');
      }

      var mediaRules = filterList(rules, function(item) { return item instanceof CSSMediaRule; }),
          uniqueMediaRules = [];

      mediaRules = mapList(mediaRules, function(item) { return item.media.mediaText; });

      for (var j = 0; j < mediaRules.length; j++) {
        var mediaRule = mediaRules[j];

        if (uniqueMediaRules.indexOf(mediaRule) === -1) {
          if (global.matchMedia(mediaRule).matches) {
            uniqueMediaRules.push(mediaRule);
          }
        }
      }

      if (uniqueMediaRules.length > 0) {
        styleSheetsWithMediaQueries[name] = uniqueMediaRules;
      }
    }
  }

  if (send === undefined || send === true) {
    Async.post({
      url: SERVER_ENDPOINT + '/messages',
      data: {
        'message_type': 'media_queries',
        'content': JSON.stringify(preJSON(styleSheetsWithMediaQueries)),
        'in_reply_to': lastID
      }
    });
  }
  else {
    return styleSheetsWithMediaQueries;
  }
};