'use strict';

var gulp = require('gulp');
var karma = require('karma').server;
var argv = require('yargs').argv;

gulp.task('test:integration', ['test:integration:bundle'], function (done) {
  karma.start({
    configFile: process.env.PWD + '/karma.conf.js',
    singleRun: !argv.karmaDebug
  }, done);
});