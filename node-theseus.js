/*
 * Copyright (c) 2012 Massachusetts Institute of Technology, Adobe Systems
 * Incorporated, and other contributors. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

var child_process = require('child_process');
var fondue    = require('fondue');
var fs        = require('fs');
var minimatch = require('minimatch');
var Module    = require('module');
var WebSocketServer = require('ws').Server;
var sms       = require('source-map-support');

var server, noisy = 0;

var maps = {}; // path -> map

// level: 0  (no extra console output) (default)
//        1  (log when new files are instrumented, when debugger connects)
//        2  (every message from the debugger)
//        3+ (TBA)
exports.setLogLevel = function (level) {
	noisy = level;
}

exports.launch = function (scriptPath) {
	process.exit = function () {
		console.log('[node-theseus] caught process.exit(), not exiting');
	};

	var spawn = child_process.spawn, fork = child_process.fork;
	child_process.spawn = function () {
		console.log('[node-theseus] notice: node-theseus cannot instrument spawned processes yet');
		return spawn.apply(this, arguments);
	};
	child_process.fork = function () {
		console.log('[node-theseus] notice: node-theseus cannot instrument forked processes yet');
		return fork.apply(this, arguments);
	};

	process.on('uncaughtException', function (err) {
		console.error('[node-theseus] caught uncaught exception');
	});

	sms.install({
		retrieveSourceMap: function(source) {
			if (source in maps) {
				return {
					url: source,
					map: maps[source],
				};
			}
			return null;
		}
	});

	require(scriptPath);
}

exports.listen = function (port) {
	if (server) {
		return;
	}

	if (noisy >= 1) {
		console.log('[node-theseus] listening for WebSocket connections on port '+ port);
	}

        server = new WebSocketServer({port: port});
	server.on('connection', socketConnected);
}

exports.beginInstrumentation = function (options) {
	options = (options || {});
	var exclude = options.exclude || [];

	if (noisy >= 1) {
		console.log('[node-theseus] adding require() instrumentation hook');
	}

	createTracer(options);

	// adapted from https://github.com/joyent/node/blob/master/lib/module.js
	Module._extensions['.js'] = function (module, filename) {
		var content = fs.readFileSync(filename, 'utf8');
		content = stripBOM(content);
		content = stripShebang(content);

		var skip = false;
		if (exclude.some(function (pattern) { return minimatch(filename, pattern) })) {
			if (noisy >= 1) {
				console.log('[node-theseus] excluding', filename);
			}
			skip = true;
		} else if (/node_modules/.test(filename) && !options.include_modules) {
			if (noisy >= 2) {
				console.log('[node-theseus] excluding node_module', filename);
			}
			skip = true;
		}

		if (skip) {
			module._compile(content, filename);
		} else {
			if (noisy >= 1) {
				console.log('[node-theseus] instrumenting', filename, '...');
			}

			var newFilename = filename + ".fondue";

			content = fondue.instrument(content, {
				name: 'global.__tracer',
				include_prefix: false,
				path: filename,
				nodejs: true,
				maxInvocationsPerTick: options.maxInvocationsPerTick,
				sourceFilename: filename,
				generatedFilename: newFilename,
			});

			var map = content.map().toString();
			if (map) {
				maps[newFilename] = map;
			}

			content = content.toString();

			module.filename = newFilename;
			module._compile(content, filename + ".fondue");
		}
	};
}

function createTracer(options) {
	eval(fondue.instrumentationPrefix({
		name: 'global.__tracer',
		nodejs: true,
		maxInvocationsPerTick: options.maxInvocationsPerTick,
	}));
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

function stripShebang(content) {
	if (/^#!/.test(content)) {
		return content.replace(/[^\r\n]+(\r|\n)/, '$1');
	}
	return content;
}

function socketConnected(client) {
	if (noisy >= 1) {
		console.log('[node-theseus] debugger connected');
	}

	client.on('message', function (data) {
		if (noisy >= 2) {
			console.log('[node-theseus] received debugger message:', data);
		}

		var cmd;
		try {
			cmd = JSON.parse(data);
		} catch (e) {
			return;
		}

		var result, bailed = false;
		try {
			result = global.__tracer[cmd.name].apply(global.__tracer, cmd.arguments);
		} catch (e) {
			bailed = true;
		}

		try {
			var data = { id: cmd.id };
			if (!bailed) {
				data.data = result;
			}
			if (noisy >= 2) {
				console.log('[node-theseus] sending debugger message:', data);
			}
			client.send(JSON.stringify(data));
		} catch (e) {
		}
	});

	client.on('close', function () {
		if (noisy >= 1) {
			console.log('[node-theseus] debugger disconnected');
		}
	});
}
