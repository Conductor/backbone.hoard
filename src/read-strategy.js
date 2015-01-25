'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');

// The `Read` Strategy keeps a hash, `this.placeholders` of cache keys for which it is currently retrieving data.
// Only one request, the 'live' request, for a given key will actually go through to retrieve the data from its source,
// be it a cache hit (read from storage), or a cache miss (read from the server).
// The remaining requests, the 'placeholder' requests', will receive the data once the live request responds.
var Read = Strategy.extend({
  method: 'read',

  initialize: function (options) {
    this.placeholders = {};
  },

  sync: function (model, options) {
    var key = this.policy.getKey(model, this.method, options);

    // If a placeholder is hit, then a request has already been made for this key
    // Resolve when that request has returned
    if (this.placeholders[key]) {
      return this._onPlaceholderHit(key, options);
    } else {
      // If a placeholder is not found, then check the store for that key
      // If the key is found in the store, treat that as a cache hit
      // Otherwise, treat that as a cache miss
      var executionPromise = this.get(key, options).then(
        _.bind(this.onCacheHit, this, key, model, options),
        _.bind(this.onCacheMiss, this, key, model, options)
      );

      // This is the first access, add a placeholder to signify that this key is in the process of being fetched
      // `accesses` refers to the number of current live requests for this key
      // `promise` will be resolved with the key's data if the retrieval is successful,
      // or rejected with an error otherwise
      this.placeholders[key] = {
        accesses: 1,
        promise: executionPromise
      };

      return executionPromise;
    }
  },

  // On a cache hit, first check to see if the cached item should be evicted (e.g. the cache has expired).
  // If the item should be evicted, do so, and proceed as a cache miss.
  // Otherwise, remove this request from the placeholder access and resolve the promise with the cached item
  onCacheHit: function (key, model, options, cachedItem) {
    return this.store.getMetadata(key, options).then(_.bind(function (meta) {
      if (this.policy.shouldEvictItem(meta)) {
        return this.invalidate(key).then(_.bind(function () {
          return this.onCacheMiss(key, model, options);
        }, this));
      } else {
        this._decreasePlaceholderAccess(key);
        if (options.success) {
          options.success(cachedItem);
        }
        return cachedItem;
      }
    }, this));
  },

  // On a cache miss, fetch the data using `Hoard.sync` and cache it on success/invalidate on failure.
  // Clears it's placeholder access only after storing or invalidating the response
  onCacheMiss: function (key, model, options) {
    var deferred = Hoard.defer();
    var callback = _.bind(function (response) {
      this._decreasePlaceholderAccess(key);
      return deferred.resolve(response);
    }, this);

    var cacheOptions = _.extend({
      onStoreSuccess: callback,
      onStoreError: callback
    }, options);
    options.success = this._wrapSuccessWithCache(this.method, model, cacheOptions);
    options.error = this._wrapErrorWithInvalidate(this.method, model, cacheOptions);

    var syncResponse = Hoard.sync(this.method, model, options);
    return deferred.promise.then(function () {
      return syncResponse;
    });
  },

  // On a placeholder hit, wait for the live request to go through,
  // then resolve or reject with the response from the live request
  _onPlaceholderHit: function (key, options) {
    var deferred = Hoard.defer();
    var callback = function (promiseHandler, originalHandler, response) {
      if (originalHandler) { originalHandler(response); }
      this._decreasePlaceholderAccess(key);
      promiseHandler(response);
    };
    var onSuccess = _.bind(callback, this, deferred.resolve, options.success);
    var onError = _.bind(callback, this, deferred.reject, options.error);

    this.placeholders[key].accesses += 1;
    this.placeholders[key].promise.then(onSuccess, onError);
    return deferred.promise;
  },

  // A convenience method for decrementing the count for a placeholder
  // and deleting the placeholder if nothing is currently accessing it
  _decreasePlaceholderAccess: function (key) {
    this.placeholders[key].accesses -= 1;
    if (!this.placeholders[key].accesses) {
      delete this.placeholders[key];
    }
  }
});

module.exports = Read;