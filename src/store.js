'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var MetaStore = require('./meta-store');
var StoreHelpers = require('./store-helpers');
var Lock = require('./lock');

var mergeOptions = ['backend', 'metaStoreClass'];

// Adapt a common interface to a desired storage mechanism (e.g. localStorage, sessionStorage)
// The interface is asynchronous, to support the use of asynchronous backends (e.g. IndexedDB)
var Store = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  _.defaults(this, {
    backend: Hoard.backend,
    metaStoreClass: MetaStore
  });
  this.metaStore = new this.metaStoreClass(options);
  this.initialize.apply(this, arguments);
};

_.extend(Store.prototype, Hoard.Events, {
  initialize: function () {},

  // Store an item and its metadata
  // If the store fails to set an item, invalidate the key
  // and return an error message
  set: function (key, item, meta, options) {
    item = item || '';
    meta = meta || '';
    return Lock.withAccess('store-write', _.bind(function () {
      var itemPromise = this._setItem(key, item);
      var metaPromise = this.metaStore.set(key, meta, options);
      return Hoard.Promise.all([itemPromise, metaPromise]);
    }, this)).then(
      _.identity,
      _.bind(function (error) {
        var errorHandler = function () {
          return Hoard.Promise.reject({
            key: key,
            value: item,
            meta: meta,
            error: error,
            options: options
          });
        };
        return this.invalidate(key, options)
          .then(errorHandler, errorHandler);
      }, this)
    );
  },

  // Retrieve an item from the cache
  // Returns a promise that resolves with the found cache item
  // or rejects if an item is not found in the cache
  get: StoreHelpers.proxyGetItem,

  // Remove an item and its metadata from the cache
  invalidate: function (key, options) {
    this.backend.removeItem(key);
    return this.metaStore.invalidate(key, options);
  },

  // Remove all items listed by store metadata then remove all metadata.
  invalidateAll: function () {
    var dataPromise = this.getAllMetadata().then(_.bind(function (metadata) {
      _.each(_.keys(metadata), function (key) {
        this.backend.removeItem(key);
      }, this);
    }, this));
    var metaPromise = this.metaStore.invalidateAll();
    return Hoard.Promise.all([dataPromise, metaPromise]);
  },

  // Get the metadata associated with the given key
  getMetadata: function (key, options) {
    return this.metaStore.get(key, options);
  },

  // Get all the metadata
  getAllMetadata: function (options) {
    return this.metaStore.getAll(options);
  },

  _setItem: StoreHelpers.proxySetItem
});

Store.extend = Hoard._proxyExtend;

module.exports = Store;
