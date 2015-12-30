'use strict';

function traceFunction(functionToTrace) {
  try {
    functionToTrace = new Function('try { return ' + functionToTrace + ' }catch(e) { Scope.error({ name: e.name, message: e.message, stack: e.stack }); }');

    functionToTrace.call(global).apply(global, [].slice.call(arguments, 1));
  }
  catch(traceError) {
    global.Scope.error({
      name: traceError.name,
      message: traceError.message,
      stack: traceError.stack
    })
  }
};

module.exports = {
  trace: traceFunction
};