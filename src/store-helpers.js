'use strict';

var Hoard = require('./backbone.hoard');
var _ = require('underscore');

// Convenience methods for stores
module.exports = {
  proxySetItem: function (key, value) {
    return Hoard.Promise.resolve()
      .then(_.bind(function () {
        try {
          return this.backend.setItem(key, JSON.stringify(value));
        } catch (e) {
          return Hoard.Promise.reject(e);
        }
      }, this))
      .then(function () {
        return value;
      });
  },

  proxyGetItem: function (key, options) {
    return Hoard.Promise.resolve()
      .then(_.bind(function () {
        return this.backend.getItem(key);
      }, this))
      .then(function (raw) {
        var storedValue = JSON.parse(raw);
        if (storedValue !== null) {
          return storedValue;
        } else {
          return Hoard.Promise.reject();
        }
      });
  },

  proxyRemoveItem: function (key, options) {
    return Hoard.Promise.resolve().then(_.bind(function () {
      return this.backend.removeItem(key, options);
    }, this));
  }
};
