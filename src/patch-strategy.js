'use strict';

var PositiveWriteStrategy = require('./positive-write-strategy');
var _ = require('underscore');

module.exports = PositiveWriteStrategy.extend({
  method: 'patch',

  // A reasonable response for a PATCH call is to return the delta of the update.
  // Provide the original information so the cached data makes sense
  cacheOptions: function (model, options) {
    return { original: this.policy.getData(model, options) };
  },

  decorateResponse: function (response, options) {
    return _.extend({}, options.original, response);
  }
});
