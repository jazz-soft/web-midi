module.exports = function(grunt) {
  return function() {
    var i, j, k;
    var eol = require('os').EOL;
    var config = grunt.config('assemble');
    var out = [];
    var src;
    var main = grunt.file.read(config.main).split(/\r?\n/);
    for (i = 0; i < main.length; i++) {
      if (main[i] == '/* insert here */') {
        for (j = 0; j < config.src.length; j++) {
          out.push('// ' + config.src[j].substr(config.src[j].lastIndexOf('/') + 1));
          out.push('function() {');
          src = grunt.file.read(config.src[j]).split(/\r?\n/);
          for (k = 0; k < src.length; k++) {
            if (src[k].match(/}\)\(this, function\(\S*\)\s*{/)) break;
          }
          for (k++; k < src.length; k++) {
            if (src[k].match(/^}\);/)) break;
            out.push(src[k]);
          }
          out.push('}');
        }
      }
      else out.push(main[i]);
    }
    grunt.file.write(config.dest, out.join(eol));
  };
};
