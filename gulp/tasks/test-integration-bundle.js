'use strict';

var gulp = require('gulp');
var webpack = require('gulp-webpack');
var rename = require('gulp-rename');

gulp.task('test:integration:bundle', ['link'], function () {
  return gulp.src('./spec/integration/setup.js')
    .pipe(webpack({ devtool: 'inline-source-map' }))
    .pipe(rename('spec.bundle.js'))
    .pipe(gulp.dest('./spec/integration'));
});

gulp.task('test:integration:bundle:watch', ['test:integration:bundle'], function () {
  gulp.watch(['src/**.js', 'spec/integration/**.int-spec.js'], ['test:integration:bundle']);
});