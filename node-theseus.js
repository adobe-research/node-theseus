var fondue = require('fondue');
var fs     = require('fs');
var Module = require('module');
var ws     = require('websocket.io');

var server;

exports.launch = function (scriptPath) {
	require(scriptPath);
}

exports.listen = function () {
	if (server) {
		return;
	}

	server = ws.listen(8888);
	server.on('connection', socketConnected);
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

function socketConnected(client) {
	client.on('message', function (data) {
		var cmd;
		try {
			cmd = JSON.parse(data);
		} catch (e) {
			return;
		}

		var result, bailed = false;
		try {
			result = global.tracer[cmd.name].apply(global.tracer, cmd.arguments);
		} catch (e) {
			bailed = true;
		}

		try {
			var data = { id: cmd.id };
			if (!bailed) {
				data.data = result;
			}
			client.send(JSON.stringify(data));
		} catch (e) {
		}
	});

	client.on('close', function () {
	});
}
