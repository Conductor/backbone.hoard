'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');

// A strategy for caching a successful response. Subclasses declare a sync method to adhere use
module.exports = Strategy.extend({
  // Cache the response.
  // If cacheOptions.generateKeyFromResponse is true,
  // cache using the key from the response, rather than the request
  sync: function (model, options) {
    // Don't consider the sync 'complete' until storage is also complete
    // This ensures that the cache is in sync with the server
    var storeComplete = Hoard.defer();
    var cacheOptions = _.extend({
      onStoreSuccess: storeComplete.resolve,
      onStoreError: storeComplete.reject
    }, options, this.cacheOptions(model, options));

    options.success = this._wrapSuccessWithCache(this.method, model, cacheOptions);
    Hoard.sync(this.method, model, options);
    return storeComplete.promise;
  },

  cacheOptions: function (model, options) {}
});
