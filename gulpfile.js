'use strict';

var gulp = require('gulp');
var fs = require('fs');
var runSequence = require('run-sequence');

var projectPackage = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
GLOBAL.config = {
  env: 'prod',
  src: 'app',
  dest: 'dist',
  version: projectPackage.version,
  license: 'Apache',
  licenseOptions: {
    organization: 'Google Inc. All rights reserved.'
  }
};

// Get tasks from gulp-tasks directory
require('require-dir')('gulp-tasks');

var allTasks = ['styles', 'scripts', 'copy', 'html', 'images'];

gulp.task('default', function(cb) {
  runSequence(
    'clean',
    allTasks,
    cb);
});

gulp.task('dev', function() {
  GLOBAL.config.env = 'dev';
  return runSequence('clean', allTasks, 'watch', 'nodemon', 'browsersync');
});
