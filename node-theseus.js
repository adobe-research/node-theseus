var fondue = require('fondue');
var fs     = require('fs');
var Module = require('module');

exports.launch = function (scriptPath) {
	require(scriptPath);
}

exports.beginInstrumentation = function () {
	// adapted from https://github.com/joyent/node/blob/master/lib/module.js
	Module._extensions['.js'] = function(module, filename) {
	  var content = stripBOM(fs.readFileSync(filename, 'utf8'));
	  content = fondue.instrument(content, {
	    name: 'global.tracer',
	    include_prefix: typeof(global.tracer) === 'undefined',
	    path: filename,
	  });
	  module._compile(content, filename);
	};
}

// taken from https://github.com/joyent/node/blob/master/lib/module.js
function stripBOM(content) {
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}
