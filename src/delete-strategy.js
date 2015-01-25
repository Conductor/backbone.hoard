'use strict';

var Hoard = require('./backbone.hoard');
var Strategy = require('./strategy');

// The Delete Strategy aggressively clears a cached item
var Delete = Strategy.extend({
  method: 'delete',

  sync: function (model, options) {
    var key = this.policy.getKey(model, this.method);
    var invalidatePromise = this.invalidate(key, options);
    var syncPromise = Hoard.sync(this.method, model, options);
    var returnSync = function () { return syncPromise; };
    return invalidatePromise.then(returnSync);
  }
});

module.exports = Delete;