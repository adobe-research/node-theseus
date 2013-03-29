/*
 * Copyright (c) 2012 Adobe Systems Incorporated and other contributors.
 * All rights reserved.
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

var fondue = require('fondue');
var fs     = require('fs');
var Module = require('module');
var ws     = require('websocket.io');

var server;

exports.launch = function (scriptPath) {
	process.on('uncaughtException', function (err) {
		console.error('uncaught exception:', err);
	});

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
		var content = fs.readFileSync(filename, 'utf8');
		content = stripBOM(content);
		content = stripShebang(content);
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

function stripShebang(content) {
	if (/^#!/.test(content)) {
		return content.replace(/[^\r\n]+(\r|\n)/, '$1');
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
