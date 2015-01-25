'use strict';

var PositiveWriteStrategy = require('./positive-write-strategy');

module.exports = PositiveWriteStrategy.extend({
  method: 'create',

  // In standard REST APIs, the id is not available until the response returns.
  // Therefore, use the response when determining how to cache.
  cacheOptions: function (model, options) {
    return { generateKeyFromResponse: true };
  }
});
