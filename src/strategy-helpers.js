'use strict';

var _ = require('underscore');

var getSyncSuccessEvent = function (key) {
  return 'sync:success:' + key;
};

var getSyncErrorEvent = function (key) {
  return 'sync:error:' + key;
};

var storeResponse = function (context, key, response, options) {
  var meta = context.policy.getMetadata(key, response, options);
  var entry = { data: response, meta: meta };
  context.store.set(key, entry);
  context.trigger(getSyncSuccessEvent(key), response);
};

var wrapSuccessWithCache = function (context, method, model, options) {
  return _.wrap(options.success, function (onSuccess, response) {
    if (onSuccess) {
      onSuccess(response);
    }
    var key = context.policy.getKey(model, method);
    storeResponse(context, key, response, options);
  });
};

var wrapErrorWithInvalidate = function (context, method, model, options) {
  return _.wrap(options.error, function (onError, response) {
    if (onError) {
      onError(response);
    }
    var key = context.policy.getKey(model, method);
    context.store.invalidate(key);
    context.trigger(getSyncErrorEvent(key));
  });
};

var cacheSuccess = function (context, method, model, options) {
  options.success = wrapSuccessWithCache(context, method, model, options);
  var r = model.sync(method, model, options);
  return r;
};

module.exports = {
  getSyncSuccessEvent: getSyncSuccessEvent,

  getSyncErrorEvent: getSyncErrorEvent,

  proxyWrapSuccessWithCache: function (method, model, options) {
    return wrapSuccessWithCache(this, method, model, options);
  },

  proxyWrapErrorWithInvalidate: function (method, model, options) {
    return wrapErrorWithInvalidate(this, method, model, options);
  },

  proxyCacheSuccess: function (method, model, options) {
    return cacheSuccess(this, method, model, options);
  }
};