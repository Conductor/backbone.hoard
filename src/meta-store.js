'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');
var StoreHelpers = require('./store-helpers');

var mergeOptions = ['backend', 'key'];

// The meta store stores all metadata about items in a single entry in the backend.
// A single entry is used so we can easily iterate over managed keys
// This API should currently be considered private
var MetaStore = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  _.defaults(this, { backend: Hoard.backend });
  this.initialize.apply(this, arguments);
};


_.extend(MetaStore.prototype, Hoard.Events, {
  initialize: function () {},

  key: 'backbone.hoard.metastore',

  set: function (key, meta, options) {
    return this._get(options).then(_.bind(function (allMetadata) {
      allMetadata[key] = meta;
      return this._set(this.key, allMetadata);
    }, this));
  },

  get: function (key, options) {
    return this._get(options).then(_.bind(function (allMetadata) {
      return allMetadata[key] || {};
    }, this));
  },

  getAll: function (options) {
    return this._get(options);
  },

  invalidate: function (key, options) {
    return this._get(options).then(_.bind(function (allMetadata) {
      delete allMetadata[key];
      return this._set(this.key, allMetadata);
    }, this));
  },

  invalidateAll: function (options) {
    return this.removeItem(this.key, options);
  },

  _get: function (options) {
    return this.getItem(this.key, options).then(
      _.identity,
      function () {
        return {};
      }
    );
  },

  _set: function (key, meta) {
    return this.setItem(key, meta);
  },

  getItem: StoreHelpers.proxyGetItem,
  setItem: StoreHelpers.proxySetItem,
  removeItem: StoreHelpers.proxyRemoveItem
});

MetaStore.extend = Hoard._proxyExtend;
module.exports = MetaStore;
