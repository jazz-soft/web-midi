// cut out the middle part from JZZ.js
module.exports = function(grunt) {
  return function() {
    var i;
    var eol = require('os').EOL;
    var config = grunt.config('import');
    var src = grunt.file.read(config.src).split(/\r?\n/);
    var res = ['function _JZZ() {'];
    for (i = 0; i < src.length; i++) {
      if (src[i].match(/}\)\(this, function\(\)\s*{/)) break;
    }
    for (i++; i < src.length; i++) {
      if (src[i].match(/^}\);/)) break;
      res.push(src[i]);
    }
    res.push('}');
    res.push('');
    grunt.file.write(config.dest, res.join(eol));
  };
};
