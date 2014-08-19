module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*\n' +
      ' *\n' +
      ' * Inspector.js v<%= pkg.version %>\n' +
      ' *\n' +
      '*/\n\n'
    },
    concat: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dev: {
        src: [
          'lib/begin.js',
          'lib/dev.js',
          'lib/xhr.js',
          'lib/events.js',
          'lib/helpers.js',
          'lib/async.js',
          'lib/core.js',
          'lib/ui.js',
          'lib/inspector.js',
          'lib/utils.js',
          'lib/end.js'
        ],
        dest: 'inspector_development.js'
      },
      prod: {
        src: [
          'lib/begin.js',
          'lib/prod.js',
          'lib/xhr.js',
          'lib/events.js',
          'lib/helpers.js',
          'lib/async.js',
          'lib/core.js',
          'lib/ui.js',
          'lib/inspector.js',
          'lib/utils.js',
          'lib/end.js'
        ],
        dest: 'inspector_production.js'
      }
    },
    uglify: {
      all: {
        files: {
          'inspector_development.min.js': [ 'inspector_development.js' ],
          'inspector_production.min.js': [ 'inspector_production.js' ]
        },
        options: {
          preserveComments: false,
          banner: '/*' +
          ' Inspector.js v<%= pkg.version %> ' +
          '*/\n'
        }
      }
    },
    copy: {
      main: {
        files: [
          {
            src: 'inspector_development.min.js',
            dest: '../logg.io/public/inspector_development.js'
          },
          {
            src: 'inspector_production.min.js',
            dest: '../logg.io/public/inspector_production.js'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['concat', 'uglify', 'copy']);
};