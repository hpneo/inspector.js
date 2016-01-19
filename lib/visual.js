'use strict';

function initHighlight() {
  var marginContainer = global.document.createElement('div'),
      borderContainer = global.document.createElement('div'),
      paddingContainer = global.document.createElement('div'),
      contentContainer = global.document.createElement('div');

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
}

function resetHighlight() {
  var highlight = global.document.getElementById('margin_container');
  highlight.style.width = '0px';
  highlight.style.height = '0px';
}

function highlightElement(element) {
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
      boundingRectangle = element.getBoundingClientRect(),
      clientWidth = element.clientWidth,
      clientHeight = element.clientHeight,
      paddingTop = parseInt(style.paddingTop),
      paddingBottom = parseInt(style.paddingBottom),
      paddingLeft = parseInt(style.paddingLeft),
      paddingRight = parseInt(style.paddingRight),
      borderTop = parseInt(style.borderTopWidth),
      borderBottom = parseInt(style.borderBottomWidth),
      borderLeft = parseInt(style.borderLeftWidth),
      borderRight = parseInt(style.borderRightWidth);

  var boxModel = {
    'contentWidth': parseInt(clientWidth) - paddingLeft - paddingRight - borderLeft - borderRight,
    'contentHeight': parseInt(clientHeight) - paddingTop - paddingBottom - borderTop - borderBottom,
    'borderTopWidth': borderTop,
    'borderBottomWidth': borderBottom,
    'borderLeftWidth': borderLeft,
    'borderRightWidth': borderRight,
    'marginTop': parseInt(style.marginTop),
    'marginBottom': parseInt(style.marginBottom),
    'marginLeft': parseInt(style.marginLeft),
    'marginRight': parseInt(style.marginRight),
    'paddingTop': paddingTop,
    'paddingBottom': paddingBottom,
    'paddingLeft': paddingLeft,
    'paddingRight': paddingRight,
    'clientWidth': clientWidth,
    'clientHeight': clientHeight
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
}

module.exports = {
  initHighlight: initHighlight,
  resetHighlight: resetHighlight,
  highlightElement: highlightElement
};