"use strict";

var gulp = require('gulp');
var rename = require('gulp-rename');
var jeditor = require('gulp-json-editor');
var _ = require('underscore');

gulp.task('bower', function () {
  return gulp.src('./package.json')
    .pipe(rename('bower.json'))
    .pipe(jeditor(function (json) {
      return _.pick(json, [
        'name',
        'version',
        'description',
        'main',
        'keywords',
        'author',
        'license',
        'dependencies'
      ]);
    }))
    .pipe(gulp.dest('.'));
});