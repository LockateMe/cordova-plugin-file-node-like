var fs, cacheFs;

exports.defineAutoTests = function(){

	describe('cordova-plugin-file-node-like', function(){

		it('should be defined', function(){
			expect(window.plugins.nodefs).toBeDefined();
			expect(window.plugins.nodefs.init).toBeDefined();
		});

		it('should initialize the file system', function(done){
			window.plugins.nodefs.init(function(err){
				expect(!!err).toBe(false);
				if (err) console.error(err);

				expect(window._fs).toBeDefined();
				expect(window._cacheFs).toBeDefined();

				done();
			});
		});

		it('should wrap the File API', function(){
			expect(fs = window.plugins.nodefs(window._fs)).toBeDefined();
			expect(cacheFs = window.plugins.nodefs(window._cacheFs)).toBeDefined();
		});

		it('deletes everything', function(done){
			deleteAll(function(err){
				expect(!!err).toBe(false);

				done();
			});
		}, 10000);

		it('should be empty', function(done){
			fs.readdir('.', function(err, contents){
				expect(!!err).toBe(false);
				if (err) console.error(err);

				expect(Array.isArray(contents)).toBe(true);
				expect(contents.length).toEqual(0);

				done();
			});
		});
	});

	describe('directory creation', function(){

		it('should not exist', function(done){
			fs.exists('testDir', function(exists){
				expect(exists).toBe(false);

				done();
			});
		});

		it('should create the directory', function(done){
			fs.mkdir('testDir', function(err){
				expect(!!err).toBe(false);
				if (err) console.error(err);

				done();
			});
		});

		it('should have created the directory', function(done){
			fs.exists('testDir', function(exists){
				expect(exists).toBe(true);

				done();
			});
		});

		it('should contain testDir', function(done){
			fs.readdir('.', function(err, contents){
				expect(!!err).toBe(false);
				if (err) console.error(err);

				expect(Array.isArray(contents)).toBe(true);
				expect(contents.length).toEqual(1);

				expect(contents).toContain('testDir');

				done();
			});
		});

	});

};

/*
if (!window.fs) throw new Error('fs not defined');

var fs = window.fs;
var console = window.console;

//var buf1 = string_to_Uint8Array('buffer1');
//var buf2 = string_to_Uint8Array('buffer2');

var params = [
	{path: '.', message: 'Reading the content of the root folder', result: []},
	{path: 'testDir', message: 'Check the existence of an unexistant directory', expected: false},
	{path: 'testDir', message: 'Creating a directory'},
	{path: 'testDir', message: 'Check the directory\'s existence', expected: true},
	{path: '.', message: 'Reading the content of the root folder, again', result: ['testDir']},
	{path: 'testDir/dir1/dir2', message: 'Creating folders, non-recursively. Is an error thrown?', throws: true},
	{path: 'testDir/dir1/dir2', message: 'Creating folders, recursively'},
	{path: 'testDir/dir1', message: 'Reading folder\'s contents', result: ['dir2']},
	{path: 'testDir', message: 'Deleting folders, non-recursively. Is an error thrown?', throws: true},
	{path: 'testDir', message: 'Deleting folders, recursively'},
	{path: 'testFile', data: 'Testing the files stuff\r\n', message: 'Creating a file and writing data to it'},
	{path: 'testFile', message: 'Trying fs.stat'},
	{path: 'ghostFile', data: 'Whatever', message: 'Appending data to an unexistant file. No error should be thrown'},
	{path: 'testFile', data: 'Whatever', message: 'Appending data to an existing file'},
	{path: 'ghostFile', data: 'Whatever', message: 'Reading appended to a non-existing file. No error should be thrown'},
	{path: 'ghostFile', message: 'Deleting a file'},
	{path: 'testFile', data: 'Testing the files stuff\r\nWhatever', message: 'Reading an existing file'},
	{path: 'testFile', message: 'Deleting an existing file'},
	{path: 'bufferFile', data: 'Testing buffers\r\nWhatever', message: 'Writing a buffer to a file'},
	{path: 'bufferFile', data: '\r\nLike, really whatever', message: 'Appending a buffer to a file'},
	{path: 'bufferFile', data: 'Testing buffers\r\nWhatever\r\nLike, really whatever', message: 'Reading a buffer from a file'},
	{path: 'bufferFile', message: 'Deleting an existing file'}
];

var _currentParams;

var tasks = [deleteAll,
	testReaddir,
	testExists,
	testMkdir,
	testExists,
	testReaddir,
	testMkdir,
	testMkdirp,
	testReaddir,
	testRmdir,
	testRmdirr,
	testWriteFile,
	testStat,
	testAppendFile,
	testAppendFile,
	testReadFile,
	testUnlink,
	testReadFile,
	testUnlink,
	testWriteFileBuffer,
	testAppendFileBuffer,
	testReadFileBuffer,
	testUnlink
];

function testWriteFile(next){
	var _params = getParams();
	fs.writeFile(_params.path, _params.data, next);
}

function testWriteFileBuffer(next){
	var _params = getParams();
	var d;
	if (typeof _params.data == 'string') d = string_to_Uint8Array(_params.data);
	else d = _params.data;
	fs.writeFile(_params.path, d, next);
}

function testAppendFile(next){
	var _params = getParams();
	fs.appendFile(_params.path, _params.data, next);
}

function testAppendFileBuffer(next){
	var _params = getParams();
	var d;
	if (typeof _params.data == 'string') d = string_to_Uint8Array(_params.data);
	else d = _params.data;
	fs.appendFile(_params.path, d, next);
}

function testReadFile(next){
	var _params = getParams();
	fs.readFile(_params.path, function(err, data){
		if (err) next(err);
		else next(data != _params.data ? new Error('Unexpected data') : undefined);
	});
}

function testReadFileBuffer(next){
	var _params = getParams();
	fs.readFile(_params.path, function(err, data){
		if (err) next(err);
		else {
			if (!(data instanceof Uint8Array)){
				next(new Error('Unexpected returned value type'));
				return;
			}
			next(uint8Array_to_String(data) != _params.data ? new Error('Unexpected data') : undefined);
		}
	}, true);
}

function testExists(next){
	var _params = getParams();
	fs.exists(_params.path, function(exists){
		if (exists != _params.expected) next(new Error(_params.path + '\'s existence. Expected: ' + _params.expected + '; Received: ' + exists));
		else next();
	});
}

function testMkdir(next){
	var _params = getParams();
	fs.mkdir(_params.path, next);
}

function testMkdirp(next){
	var _params = getParams();
	fs.mkdirp(_params.path, next);
}

function testReaddir(next){
	var _params = getParams();
	fs.readdir(_params.path, function(err, contents){
		if (err){
			next(err);
			return;
		}
		if (!(_params.result && _params.result.length > 0)){
			next();
			return;
		}
		var foundCount = 0;
		for (var i = 0; i < contents.length; i++){
			for (var j = 0; j < _params.result.length; j++){
				if (contents[i] == _params.result[j]){
					foundCount++;
					break;
				}
			}
		}
		if (foundCount != _params.result.length) next(new Error('Unexpected result: ' + JSON.stringify(contents)));
		else next();
	});
}

function testRmdir(next){
	var _params = getParams();
	fs.rmdir(_params.path, next);
}

function testRmdirr(next){
	var _params = getParams();
	fs.rmdirr(_params.path, next);
}

function testUnlink(next){
	var _params = getParams();
	fs.unlink(_params.path, next);
}

function testStat(next){
	var _params = getParams();
	fs.stat(_params.path, function(err, s){
		if (err){
			next(err);
			return;
		}
		console.log('Stat for ' + _params.path + ': ' + JSON.stringify(s));
		next();
	});
}

function getParams(){
	var currentParams = params[0];
	_currentParams = currentParams;
	params.splice(0, 1);
	console.log('Current task: ' + currentParams.message);
	return currentParams;
}

function queue(tasks, generalCallback){
	var taskIndex = 0;

	function doOne(){
		tasks[taskIndex](next);
	}

	function next(err){
		if (err && !_currentParams.throws){
			console.error('Unexpected error');
			console.error(err);
			return;
		}
		taskIndex++;
		if (taskIndex == tasks.length) generalCallback();
		else doOne();
	}

	doOne();
}

queue(tasks, function(){
	console.log('All FS tests completed with success!');
});

function deleteAll(callback){
	console.log('Deleting all the app\'s files');
	fs.readdir('/', function(err, currentFiles){
		if (err){
			callback(err);
			return;
		}

		var endCount = 0;

		var foundErr;

		function endCb(err){
			if (err) foundErr = err;
			endCount++;
			if (endCount == currentFiles.length){
				if (typeof callback == 'function') callback(foundErr);
				else if (err) throw err;
			}
		}

		for (var i = 0; i < currentFiles.length; i++){
			deleteElem(currentFiles[i]);
		}

		function deleteElem(f){
			fs.stat('/' + f, function(err, stat){
				if (err){
					endCb(err);
					return;
				}
				if (stat.isDirectory()){
					fs.rmdirr('/' + f, endCb);
				} else {
					fs.unlink('/' + f, endCb);
				}
			});
		}
	});
}

}*/

function deleteAll(callback){
	//console.log('Deleting all the app\'s files');
	fs.readdir('/', function(err, currentFiles){
		if (err){
			callback(err);
			return;
		}

		console.log('To be deleted: ' + JSON.stringify(currentFiles));

		var endCount = 0;

		var foundErr;

		function endCb(err){
			if (err) foundErr = err;
			endCount++;
			if (endCount == currentFiles.length){
				if (typeof callback == 'function') callback(foundErr);
				else if (err) throw err;
			}
		}

		for (var i = 0; i < currentFiles.length; i++){
			deleteElem(currentFiles[i]);
		}

		function deleteElem(f){
			fs.stat('/' + f, function(err, stat){
				if (err){
					endCb(err);
					return;
				}
				if (stat.isDirectory){
					fs.rmdirr('/' + f, endCb);
				} else {
					fs.unlink('/' + f, endCb);
				}
			});
		}
	});
}

//UTF8 to Uint8Array
function string_to_Uint8Array(s) {
	var escapedStr = unescape(encodeURIComponent(s));

	var latin1 = new Uint8Array(escapedStr.length);
	for (var i = 0; i < escapedStr.length; i++) {
		var c = escapedStr.charCodeAt(i);
		if ((c & 0xff) !== c) throw {
			message: "Cannot encode string in Latin1",
			str: s
		};
		latin1[i] = (c & 0xff);
	}
	return latin1;
}

//Uint8Array to UTF8
function uint8Array_to_String(b) {
	var encoded = [];
	for (var i = 0; i < b.length; i++) {
		encoded.push(String.fromCharCode(b[i]));
	}
	encoded = encoded.join('');
	try {
		return decodeURIComponent(escape(encoded));
	} catch (e) {
		throw new Error('Cannot convert to a UTF8 string');
	}
}

function bufEquals(b1, b2){
	if (!(b1 instanceof Uint8Array && b2 instanceof Uint8Array)) throw new TypeError('b1 and b2 must be a Uint8Arrays');
	if (b1.length != b2.length) return false;
	for (var i = 0; i < b1.length; i++) if (b1[i] != b2[i]) return false;
	return true;
}
