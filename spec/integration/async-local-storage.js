'use strict';

var Hoard = require('src/backbone.hoard');

// Wrap localStorage
module.exports = {
  setItem: function (key, value) {
    return Hoard.Promise.resolve().then(function () {
      return localStorage.setItem(key, value);
    });
  },

  getItem: function (key) {
    return Hoard.Promise.resolve().then(function () {
      return localStorage.getItem(key);
    });
  },

  removeItem: function (key) {
    return Hoard.Promise.resolve().then(function () {
      return localStorage.removeItem(key);
    });
  }
};