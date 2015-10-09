/*
* grunt-tbp-css-url-rewrite
* https://github.com/TheBookPeople/grunt-tbp-css-url-rewrite
*
* Copyright (c) 2015 William Griffiths
* Licensed under the GNU license.
*/

'use strict';

var grunt_process_css = require("./lib/process_css");

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  // Grunt lib init
  var process_css = grunt_process_css.init(grunt);

  // Grunt utils
 var async = grunt.util.async;

  grunt.registerMultiTask('tbp_css_url_rewrite', 'Rewrites URL paths in css', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', '
    });

    var done = options.parallel === false ? function() {} : this.async();

    var filesRemaining = this.files.length;

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      var dest = f.dest;
      var tasks;

      tasks = f.src.map(function(srcFile) {
        return function(callback) {
          process_css.stylesheet(srcFile, options, callback);
        };
      });

      // Once all files have been processed write them out.
      var callback = function(err, output) {
        grunt.file.write(dest, output);
        grunt.log.writeln('File "' + dest + '" created.');
        filesRemaining--;
        if (filesRemaining === 0) {
          done();
        }
      };

      if (options.parallel === false) {
        grunt.util._.each(tasks, function(task) {
          task(callback);
        });
      } else {
        // Once all files have been processed write them out.
        async.parallel(tasks, callback);
      }
    });
  });

};
