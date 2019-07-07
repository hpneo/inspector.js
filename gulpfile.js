var gulp = require('gulp'),
    browserify = require('browserify'),
    eslint = require('gulp-eslint'),
    jscs = require('gulp-jscs'),
    uglify = require('gulp-uglify'),
    envify = require('envify/custom'),
    rename = require('gulp-rename'),
    source = require('vinyl-source-stream'),
    mochaPhantomJS = require('gulp-mocha-phantomjs'),
    files = [ './index.js', './lib/**/*.js' ],
    buildDir = './build';

gulp.task('lint', function() {
  return gulp.src(files)
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('jscs', function() {
  return gulp.src(files)
    .pipe(jscs());
});

gulp.task('browserify', function() {
  var browserifyBundler = browserify('./index.js', {
    debug: false
  }).transform(envify({
    _: 'purge',
    SERVER_ENDPOINT: process.env.SERVER_ENDPOINT
  }));

  return browserifyBundler.bundle()
    .pipe(source('inspector.js'))
    .pipe(gulp.dest(buildDir));
});

gulp.task('dist', [ 'lint', 'jscs', 'browserify' ], function() {
  return gulp.src(buildDir + '/inspector.js')
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(buildDir));
});

gulp.task('test', function() {
  return gulp.src('./test/runner.html')
    .pipe(mochaPhantomJS());
});

gulp.task('build', [ 'lint', 'jscs', 'browserify' ]);

gulp.task('build_copy', ['build'], function() {
  gulp.src(buildDir + '/inspector.js')
    .pipe(rename('development.js'))
    .pipe(gulp.dest('../domscope/app/assets/javascripts/inspector'));
});

gulp.task('dist_copy', ['dist'], function() {
  gulp.src(buildDir + '/inspector.min.js')
    .pipe(rename('production.js'))
    .pipe(gulp.dest('../domscope/app/assets/javascripts/inspector'));
});

gulp.task('watch', function() {
  gulp.watch(files, [ 'build' ]);
});

gulp.task('default', [ 'build', 'watch' ]);