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
      dist: {
        src: [
          'lib/begin.js',
          'lib/helpers.js',
          'lib/async.js',
          'lib/core.js',
          'lib/ui.js',
          'lib/utils.js',
          'lib/end.js'
        ],
        dest: 'inspector.js'
      }
    },
    uglify: {
      all: {
        files: {
          'inspector.min.js': [ 'inspector.js' ]
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
        src: 'inspector.min.js',
        dest: '../logg.io/public/inspector.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['concat', 'uglify', 'copy']);
};