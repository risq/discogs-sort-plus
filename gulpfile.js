var gulp = require('gulp');
var gutil = require('gutil');
var webpack = require('webpack');
var eslint = require('gulp-eslint');

var runSequence = require('run-sequence');
var clean = require('gulp-clean');
var replace = require('gulp-replace');
var exec = require('child_process').exec;
var mkdirp = require('mkdirp');
var bump = require('gulp-bump');
var zip = require('gulp-zip');
var changeCase = require('change-case')


var getManifest = function() {
  var fs = require('fs');

  return JSON.parse(fs.readFileSync('./build/manifest.json', 'utf8'));
};

/**
 * Clean
 * Cleans the build directory before a build.
 * Used for the build task.
 */
gulp.task('clean', function() {
  return gulp.src(['./build', './dist']).pipe(clean());
});

/**
 * ESLint
 * Checks the sourcecode for errors with ESLint. Used for the build and dev tasks.
 */
gulp.task('lint', function() {
  return gulp.src(['app/js/*.js'])
    .pipe(eslint({ useEslintrc: true }))
    .pipe(eslint.format());
});

gulp.task('pre-build', function(callback) {
  runSequence(
    'clean',
    'lint',
    'static',
    'js',
    'html',
    callback
  );
});

gulp.task('build', ['pre-build'], function(callback) {
  runSequence(
    'crx',
    'zip',
    callback
  );
});

gulp.task('bump', function(){
  return gulp.src(['./manifest.json', './package.json'])
  .pipe(bump())
  .pipe(gulp.dest('./'));
});

gulp.task('zip', function() {
    var manifest = getManifest();
    gulp.src('build/**/*')
        .pipe(zip(changeCase.paramCase(manifest.name + '.' + manifest.version) + '.zip'))
        .pipe(gulp.dest('dist'));
    }
);

gulp.task('crx', function(callback) {
  var manifest = getManifest();
  var name = changeCase.paramCase(manifest.name + '.' + manifest.version);

  mkdirp('./dist', function(err) {
    if (err) {
      throw new gutil.PluginError('build', err);
    }

    var command = './node_modules/.bin/crx pack ./build -p ./config/extension.pem -o ./dist/';
    command += name + '.crx';

    console.log(command)

    exec(command, function(err, stdout, stderr) {
      callback();
    });
  });
});

gulp.task('static', function() {
  gulp.src(['manifest.json', 'src/**/*.css', 'src/**/*.png', 'src/assets/*.html'])
    .pipe(gulp.dest('./build'));
});

gulp.task('js', [], function(callback) {
  var config = require('./config/webpack.config.js');
  var compiler = webpack(config);

  compiler.run(function(err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack-build', err);
    }

    gutil.log("[webpack:build]", stats.toString({
      colors: true
    }));

    callback();
  });

});

gulp.task('html', function() {
  gulp.src('src/assets/*.html')
    .pipe(gulp.dest('./build'));
});

gulp.task('watch-static', [], function(callback) {
  runSequence(
    'static',
    callback
  );
});

gulp.task('watch-webpack', [], function(callback) {
  runSequence(
    'js',
    callback
  );
});

gulp.task('dev', ['static', 'js', 'html'], function() {
  gulp.watch(['src/*.json'], ['watch-static']);
  gulp.watch(['src/css/*.css'], ['watch-static']);
  gulp.watch(['src/assets/*.png'], ['watch-static']);
  gulp.watch(['src/assets/*.html'], ['watch-static']);

  gulp.watch(['src/js/**/*.js'], ['watch-webpack']);
});

gulp.task('default', ['dev'])
