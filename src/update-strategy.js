'use strict';

var PositiveWriteStrategy = require('./positive-write-strategy');

module.exports = PositiveWriteStrategy.extend({ _method: 'update' });
