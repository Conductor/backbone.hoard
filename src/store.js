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
      var itemPromise = this.setItem(key, item);
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
  get: function (key, options) {
    return this.getItem.apply(this, arguments);
  },

  // Remove an item and its metadata from the cache
  invalidate: function (key, options) {
    var storePromise = this.removeItem(key, options);
    var metaPromise = this.metaStore.invalidate(key, options);
    return Hoard.Promise.all([storePromise, metaPromise]);
  },

  // Remove all items listed by store metadata then remove all metadata.
  invalidateAll: function (options) {
    var dataPromise = this.getAllMetadata(options).then(_.bind(function (metadata) {
      var removals = _.map(_.keys(metadata), function (key) {
        return this.removeItem(key, options);
      }, this);

      return Hoard.Promise.all(removals);
    }, this));
    var metaPromise = this.metaStore.invalidateAll(options);
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

  getItem: StoreHelpers.proxyGetItem,
  setItem: StoreHelpers.proxySetItem,
  removeItem: StoreHelpers.proxyRemoveItem
});

Store.extend = Hoard._proxyExtend;

module.exports = Store;
