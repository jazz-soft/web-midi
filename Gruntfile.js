module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['src/**/*.js']
    },
    assemble: {
      main: 'src/tools/main.js',
      src: [ 'node_modules/jzz/javascript/JZZ.js' ],
      dest: 'src/inject.js'
    },
    copy: {
      firefox: {
        expand: true,
        cwd: 'src',
        src: '*.js',
        dest: 'firefox/web-midi'
      },
      safari: {
        expand: true,
        cwd: 'src',
        src: '*.js',
        dest: 'safari/web-midi/extension'
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('assemble', require('./src/tools/assemble.js')(grunt));
  grunt.registerTask('default', ['assemble', 'copy']);
};
