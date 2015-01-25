'use strict';

var gulp = require('gulp');
var exec = require('exec-sync');
var util = require('util');

gulp.task('link', function () {
  var srcDir = process.env.PWD;
  var cmd = util.format('ln -s -f %s/src %s/node_modules', srcDir, srcDir);
  console.log(cmd);
  exec(cmd);
});
