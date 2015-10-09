// Cache regex's
var rImages = /([\s\S]*?)(url\(([^)]+)\))(?!\s*[;,]?\s*\/\*\s*CssUrlRewrite:skip\s*\*\/)|([\s\S]+)/img; // TODO: Strip of CssUrlRewrite:skip
var rExternal = /(^http)/;
var rData = /^data:/;
var rQuotes = /['"]/g;
var rParams = /([?#].*)$/g;

// Grunt export wrapper
exports.init = function(grunt) {
  "use strict";

  var exports = {};

  // Grunt utils
  var utils = grunt.utils || grunt.util;
  var file = grunt.file;
  var _ = utils._;
  var async = utils.async;

  /**
   * Takes a CSS file as input, goes through it line by line, and calls
   * rewrite on any images/fonts it finds.
   *
   * @param srcFile Relative or absolute path to a source stylesheet file.
   * @param opts Options object
   * @param done Function to call once encoding has finished.
   */
  exports.stylesheet = function(srcFile, opts, done) {
    opts = opts || {};

    // Shift args if no options object is specified
    if(utils.kindOf(opts) === "function") {
      done = opts;
      opts = {};
    }

    var src = file.read(srcFile);
    var result = "";
    var match, img, line, tasks, group, params;

    async.whilst(function() {
      group = rImages.exec(src);
      return group != null;
    },
    function(complete) {
      // if there is another url to be processed, then:
      //    group[1] will hold everything up to the url declaration
      //    group[2] will hold the complete url declaration (useful if no encoding will take place)
      //    group[3] will hold the contents of the url declaration
      //    group[4] will be undefined
      // if there is no other url to be processed, then group[1-3] will be undefined
      //    group[4] will hold the entire string

      if(group[4] == null) {
        result += group[1];

        params = group[3]
          .replace(rQuotes, "")
          .match(rParams);

        img = group[3].trim()
          .replace(rQuotes, "")
          .replace(rParams, ""); // remove query string/hash parmams in the filename, like foo.png?bar or foo.png#bar


        // Skip external
        if(opts.skipExternal && rExternal.test(img)) {
          result += 'url("' + img + '")';
          complete();
          return;
        }

        // process it
        var loc = img, is_local_file = !rData.test(img) && !rExternal.test(img);

        // Resolve the image path relative to the CSS file
        if(is_local_file) {
          var resp;
          resp = img;
          if(opts.rewrite) {
            resp = opts.rewrite(img,opts);
          }
          result += 'url("' + resp + '")';
          grunt.log.debug("rewrite : '" + img + "' => '"+resp+"'")
          complete();
        }
      } else {
        result += group[4];
        complete();
      }
    },
    function() {
      done(null, result);
    });
  };


  return exports;
};
