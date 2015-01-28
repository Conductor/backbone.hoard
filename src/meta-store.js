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
    var allMetadata = this._get();
    allMetadata[key] = meta;
    return this._set(this.key, allMetadata);
  },

  get: function (key, options) {
    var allMetadata = this._get();
    var meta = allMetadata[key] || {};
    return Hoard.Promise.resolve(meta);
  },

  getAll: function (options) {
    return Hoard.Promise.resolve(this._get());
  },

  invalidate: function (key, options) {
    var allMetadata = this._get();
    delete allMetadata[key];
    this._set(this.key, allMetadata);
    return Hoard.Promise.resolve();
  },

  invalidateAll: function () {
    this.backend.removeItem(this.key);
    return Hoard.Promise.resolve();
  },

  _get: function () {
    return JSON.parse(this.backend.getItem(this.key)) || {};
  },

  _set: function (key, meta) {
    return this._setItem(key, meta);
  },

  _setItem: StoreHelpers.proxySetItem
});

MetaStore.extend = Hoard._proxyExtend;
module.exports = MetaStore;
