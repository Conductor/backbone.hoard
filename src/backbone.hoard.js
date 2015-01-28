'use strict';

var Backbone = require('backbone');

var Hoard = {
  Promise: function () {
    throw new TypeError('An ES6-compliant Promise implementation must be provided');
  },

  sync: Backbone.sync,

  Events: Backbone.Events,

  extend: Backbone.Model.extend,

  _proxyExtend: function () {
    return Hoard.extend.apply(this, arguments);
  },

  defer: function () {
    var deferred = {};
    deferred.promise = new this.Promise(function (resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  }
};

module.exports = Hoard;
