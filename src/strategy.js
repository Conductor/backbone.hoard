'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var Lock = require('./lock');

var mergeOptions = ['store', 'policy'];

// A Strategy is tied to a particular sync method on a Control
// The execute method will be called by the Control with the model and options being synced.
// It is abstract by default, and it's implementations get access to the Store and Policy
// provided by the Controller
var Strategy = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  this.initialize.apply(this, arguments);
};

_.extend(Strategy.prototype, Hoard.Events, {
  initialize: function () {},

  // Set up some configuration, and pass control to this strategy's sync method
  // Take care of all caching/server requesting.
  // This is the main strategy method and entry point from Hoard.Control
  execute: function (model, options) {
    options.url = this.policy.getUrl(model, this.method, options);
    options.collection = this.policy.getCollection(model, options);
    options.model = model;
    return this.sync(model, options);
  },

  // If the model belongs to a collection and that collection is cached,
  //   first try to read the model from the collection's cache
  // Default to getting it from the model's cache
  get: function (key, options) {
    var updateCollection = this._getUpdateCollection(options);
    var getFromCache = _.bind(this.store.get, this.store, key, options);
    if (updateCollection) {
      return updateCollection().then(
        function (collection) {
          var modelResponse = collection.policy.findSameModel(collection.raw, options.model);
          return modelResponse ? modelResponse : getFromCache();
        },
        getFromCache
      );
    } else {
      return getFromCache();
    }
  },

  // If the model belongs to a collection and that collection is cached,
  //   add the model to the collection's cache
  // Default to setting the model the model's cache
  set: function (key, value, meta, options) {
    var updateCollection = this._getUpdateCollection(options);
    var setToCache = _.bind(this.store.set, this.store, key, value, meta, options);
    if (updateCollection) {
      return updateCollection().then(
        function (collection) {
          var modelResponse = collection.policy.findSameModel(collection.raw, options.model);
          if (!modelResponse) {
            modelResponse = {};
            collection.raw.push(modelResponse);
          }
          // clear the existing model and replace it with the response
          _.each(_.keys(modelResponse), function (key) {
            delete modelResponse[key];
          });
          _.extend(modelResponse, value);
          meta = collection.control.policy.getMetadata(collection.key, collection.raw, options);
          return collection.control.store.set(collection.key, collection.raw, meta, options);
        },
        setToCache
      );
    } else {
      return setToCache();
    }
  },

  // If the model belongs to a collection and that collection is cached,
  //   remove the model from the collection's cache
  // Default to removing the model the model's cache
  invalidate: function (key, options) {
    var updateCollection = this._getUpdateCollection(options);
    var invalidateFromCache = _.bind(this.store.invalidate, this.store, key, options);
    if (updateCollection) {
      return updateCollection().then(
        function (collection) {
          var filteredCollection = _.reject(collection.raw, function (model) {
            return collection.policy.areModelsSame(options.model, model);
          });
          var meta = collection.control.policy.getMetadata(collection.key, filteredCollection, options);
          return collection.control.store.set(collection.key, filteredCollection, meta, options);
        },
        invalidateFromCache
      );
    } else {
      return invalidateFromCache();
    }
  },

  // Return a funtion that accesses the model's collection, if it exists
  // Otherwise, return undefined, becasues the collection cannot be accessed
  _getUpdateCollection: function (options) {
    var collection = options && options.collection;
    var collectionControl = collection && collection.sync && collection.sync.hoardControl;
    if (collection && collectionControl) {
      var collectionKey = collectionControl.policy.getKey(collection, options);
      return _.bind(function () {
        return this.store.get(collectionKey, options).then(function (rawCollection) {
          return {
            control: collectionControl,
            policy: collectionControl.policy,
            key: collectionKey,
            raw: rawCollection
          };
        });
      }, this);
    }
  },

  //When the cache is full, evict items from the cache
  //and try to store the item again
  //or just return the value if storage fails
  onCacheFull: function (cacheFull) {
    var key = cacheFull.key;
    var value = cacheFull.value;
    var meta = cacheFull.meta;
    var error = cacheFull.error;
    var options = cacheFull.options;

    // lock access to keep knowledge of cache consistent
    return Lock.withLock('store-write', _.bind(function () {
      return this.store.getAllMetadata().then(_.bind(function (metadata) {
        var keysToEvict = this.policy.getKeysToEvict(metadata, key, value, error);
        if (!_.isEmpty(keysToEvict)) {
          var evictions = _.map(keysToEvict, function (key) {
            return this.invalidate(key, options);
          }, this);
          return Hoard.Promise.all(evictions);
        } else {
          return Hoard.Promise.reject();
        }
      }, this));
    }, this)).then(
      _.bind(this.set, this, key, value, meta, options),
      function () { return Hoard.Promise.reject(value); }
    );
  },

  // Override to edit the response
  // Returns the same response by default
  decorateResponse: function (response, options) {
    return response;
  },

  // Cache the response when the success callback is called
  _wrapSuccessWithCache: function (method, model, options) {
    return this._wrapMethod(method, model, _.extend({
      targetMethod: 'success',
      responseHandler: _.bind(this._storeResponse, this)
    }, options));
  },

  // invalidate the key when the success callback is called
  _wrapErrorWithInvalidate: function (method, model, options) {
    return this._wrapMethod(method, model, _.extend({
      targetMethod: 'error',
      responseHandler: _.bind(this._invalidateResponse, this)
    }, options));
  },

  _wrapMethod: function (method, model, options) {
    var key = this.policy.getKey(model, method, options);
    return _.wrap(options[options.targetMethod], _.bind(function (targetMethod, response) {
      if (targetMethod) {
        targetMethod(response);
      }
      if (options.generateKeyFromResponse) {
        key = this.policy.getKey(model, method, options);
      }
      if (options.responseHandler) {
        options.responseHandler(key, response, options);
      }
    }, this));
  },

  _invalidateResponse: function (key, response, options) {
    this.invalidate(key).then(
      this._storeAction('onStoreSuccess', options, response),
      this._storeAction('onStoreError', options, response)
    );
  },

  _storeResponse: function (key, response, options) {
    var meta = this.policy.getMetadata(key, response, options);
    var finalResponse = this.decorateResponse(response, options);
    this.set(key, finalResponse, meta, options).then(
      _.identity,
      _.bind(this.onCacheFull, this)
    ).then(
      this._storeAction('onStoreSuccess', options, response),
      this._storeAction('onStoreError', options, response)
    );
  },

  _storeAction: function (method, options, response) {
    var callback = options[method] || function () { return response };
    return function () {
      return callback(response);
    }
  }
});

Strategy.extend = Hoard._proxyExtend;

module.exports = Strategy;
