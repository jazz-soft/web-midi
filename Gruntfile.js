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
  grunt.registerTask('import', require('./src/tools/import.js')(grunt));
  grunt.registerTask('default', ['import', 'copy']);
};
