'use strict';

var gulp = require('gulp');
var del = require('del');

gulp.task('clean', function (cb) {
  del([
    './spec/integration/spec.bundle.js',
    'dist'
  ], cb);
});