'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

var mergeOptions = ['expires', 'timeToLive'];

// A Policy determines key generation and cache eviction
var Policy = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  this.initialize.apply(this, arguments);
};

_.extend(Policy.prototype, Hoard.Events, {
  initialize: function () {},

  // How long, in milliseconds, should a cached item be considered 'fresh'?
  // Superceded by the `expires` option, which determines at what time the cache item becomes stale
  timeToLive: 5 * 60 * 1000,

  // Generate a key for the given model
  // The key will be used to determine uniqueness in the store
  getKey: function (model, method, options) {
    return this.getUrl(model, method, options);
  },

  // Get the url for the given model
  getUrl: function (model, method, options) {
    return _.result(model, 'url');
  },

  // Get the data from the given model
  getData: function (model, options) {
    return model.toJSON();
  },

  // Get the collection associated with the model
  getCollection: function (model, options) {
    return model.collection;
  },

  // Do two models refer to the same resource?
  // @param model: the raw model attributes
  // @param otherModel: the raw model attributes
  areModelsSame: function (model, otherModel) {
    return model.id === otherModel.id;
  },

  // Find the same resource within a collection
  // @param collection: the raw collection array
  // @param model: the raw model attributes
  findSameModel: function (collection, model) {
    return _.find(collection, function (other) {
      return this.areModelsSame(model, other);
    }, this);
  },

  // Generate metadata
  getMetadata: function (key, response, options) {
    var meta = {};
    var expires = this.expires;
    if (this.timeToLive != null && expires == null) {
      expires = Date.now() + this.timeToLive;
    }
    if (expires != null) {
      meta.expires = expires;
    }
    return meta;
  },

  // Return true if the item associated with the given metadata should be evicted.
  // Return false otherwise.
  shouldEvictItem: function (meta) {
    return meta.expires != null && meta.expires < Date.now();
  },

  // Return an array of keys to evict
  // By default, clear the world
  getKeysToEvict: function (metadata, key, value, error) {
    return _.keys(metadata);
  }
});

Policy.extend = Hoard.extend;

module.exports = Policy;
