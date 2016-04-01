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

	describe('recursive directory creation', function(){

		it('should throw an error when creating nested folders, non-recursively', function(done){
			fs.mkdir('testDir/dir1/dir2', function(err){
				expect(err).toBeDefined();

				done();
			});
		});

		it('should create nested directories', function(done){
			fs.mkdirp('testDir/dir1/dir2', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('should find nested directories', function(done){
			fs.readdir('testDir/dir1', function(err, contents){
				expect(!!err).toBe(false);

				expect(Array.isArray(contents)).toBe(true);
				expect(contents.length).toEqual(1);

				expect(contents).toContain('dir2');

				done();
			});
		});

	});

	describe('recursive directory deletion', function(){

		it('should throw an error when deleting nested folders, non-recursively', function(done){
			fs.rmdir('testDir', function(err){
				expect(err).toBeDefined();

				done();
			});
		});

		it('should delete nested directories', function(done){
			fs.rmdirr('testDir', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

	});

	describe('file existence', function(){

		it('should not exist', function(done){
			fs.exists('thing', function(exists){
				expect(exists).toBe(false);

				done();
			});
		});

		it('should not exist, again', function(done){
			fs.exists('thing', function(exists){
				expect(exists).toBe(false);

				done();
			});
		});
	});

	describe('file write', function(){

		it('should write a file', function(done){
			fs.writeFile('testFile', 'Testing the files stuff\r\n', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('should exist', function(done){
			fs.exists('testFile', function(exists){
				expect(exists).toBe(true);

				done();
			});
		});

		it('should be a file', function(done){
			fs.stat('testFile', function(err, s){
				expect(!!err).toBe(false);

				expect(typeof s == 'object').toBe(true);
				expect(typeof s.isDirectory == 'boolean').toBe(true);
				expect(typeof s.isFile == 'boolean').toBe(true);

				expect(s.isDirectory).toBe(false);
				expect(s.isFile).toBe(true);

				done();
			});
		});

		it('should contain data', function(done){
			fs.readFile('testFile', 'utf8', function(err, d){
				expect(!!err).toBe(false);

				expect(typeof d == 'string').toBe(true);
				expect(d).toEqual('Testing the files stuff\r\n');

				done();
			});
		});

	});

	describe('file append', function(){

		it('appending data to an unexistant file', function(done){
			fs.appendFile('ghostFile', 'Whatever', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('the unexistant file should now exist', function(done){
			fs.exists('ghostFile', function(exists){
				expect(exists).toBe(true);

				done();
			});
		});

		it('should be a file', function(done){
			fs.stat('ghostFile', function(err, s){
				expect(!!err).toBe(false);

				expect(typeof s == 'object').toBe(true);
				expect(typeof s.isDirectory == 'boolean').toBe(true);
				expect(typeof s.isFile == 'boolean').toBe(true);

				expect(s.isDirectory).toBe(false);
				expect(s.isFile).toBe(true);

				done();
			});
		});

		it('the now-existing file should contain data', function(done){
			fs.readFile('ghostFile', 'utf8', function(err, d){
				expect(!!err).toBe(false);

				expect(typeof d == 'string').toBe(true);
				expect(d).toEqual('Whatever');

				done();
			});
		});

		it('appending data to an existing file', function(done){
			fs.appendFile('testFile', 'Whatever', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('the existing file should have appended data', function(done){
			fs.readFile('testFile', 'utf8', function(err, d){
				expect(!!err).toBe(false);

				expect(typeof d == 'string').toBe(true);
				expect(d).toEqual('Testing the files stuff\r\nWhatever');

				done();
			});
		});

		it('should overwrite the file\'s contents', function(done){
			fs.writeFile('testFile', 'Whatever', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('should have overwritten the data', function(done){
			fs.readFile('testFile', 'utf8', function(err, d){
				expect(!!err).toBe(false);

				expect(d).toEqual('Whatever');

				done();
			});
		});

	});

	describe('file deletion', function(){

		it('should delete a file', function(done){
			fs.unlink('testFile', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('should not exist anymore', function(done){
			fs.exists('testFile', function(exists){
				expect(exists).toBe(false);

				done();
			});
		});

		it('should delete an other file', function(done){
			fs.unlink('ghostFile', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('should not exist anymore', function(done){
			fs.exists('ghostFile', function(exists){
				expect(exists).toBe(false);

				done();
			});
		});

	});

	describe('buffer write', function(){

		it('should write a buffer to a file', function(done){
			var b = string_to_Uint8Array('Testing buffers\r\nWhatever');
			fs.writeFile('bufferFile', b, function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('should contain data', function(done){
			fs.readFile('bufferFile', function(err, b){
				expect(!!err).toBe(false);

				expect(uint8Array_to_String(b)).toEqual('Testing buffers\r\nWhatever');

				done();
			});
		});

		it('should append a buffer to a file', function(done){
			var b = string_to_Uint8Array('\r\nLike, really whatever');
			fs.appendFile('bufferFile', b, function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('should contain appended data', function(done){
			fs.readFile('bufferFile', function(err, b){
				expect(!!err).toBe(false);

				expect(uint8Array_to_String(b)).toEqual('Testing buffers\r\nWhatever\r\nLike, really whatever');

				done();
			});
		});

		it('deletes the file', function(done){
			fs.unlink('bufferFile', function(err){
				expect(!!err).toBe(false);

				done();
			});
		});

		it('should not exist', function(done){
			fs.exists('bufferFile', function(exists){
				expect(exists).toBe(false);

				done();
			});
		});

	});

};

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

		if (currentFiles.length == 0){
			callback();
			return;
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
