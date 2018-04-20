module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['src/**/*.js']
    },
    import: {
      src: 'node_modules/jzz/javascript/JZZ.js',
      dest: 'src/_JZZ.js'
    },
    uglify: {
      firefox: {
        expand: true,
        cwd: 'src',
        src: '*.js',
        dest: 'firefox'
      },
      safari: {
        expand: true,
        cwd: 'src',
        src: '*.js',
        dest: 'safari/web-midi-api.safariextension'
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('import', require('./src/tools/import.js')(grunt));
  grunt.registerTask('default', ['import', 'uglify']);
};
