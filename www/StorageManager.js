function initializeFS(callback, hostObject){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, boundFS, err);

	hostObject = hostObject || window;
	if (!(hostObject && typeof hostObject == 'object')) throw new TypeError('hostObject must be a defined object');

	var resolveFsNames = {
		dataDirectory: '_fs',
		syncedDataDirectory: '_syncedFs',
		cacheDirectory: '_cacheFs',
		applicationDirectory: '_appFs',
		applicationStorageDirectory: '_appStorageFs',
		externalApplicationStorageDirectory: '_externalAppStorageFs',
		externalDataDirectory: '_externalFs',
		externalCacheDirectory: '_externalCacheFs',
		externalRootDirectory: '_externalRootFs',
		tempDirectory: '_tempFs',
		documentsDirectory: '_documentsFs',
		sharedDirectory: '_sharedFs'
	};

	function boundFS(fileSystem){

		var fsToResolve = Object.keys(resolveFsNames);
		var resolveIndex = 0;

		function resolveOne(){
			var currentFsName = fsToResolve[resolveIndex];

			if (!cordova.file[currentFsName]){ //Skipping unavailable directories
				console.log('[FS:init] ' + currentFsName + ' is unavailable. Skipping');
				next();
				return;
			}

			window.resolveLocalFileSystemURL(cordova.file[currentFsName], function(fsDir){
				var fsAlias = resolveFsNames[currentFsName];
				hostObject[fsAlias] = fsDir;

				next();
			}, err);
		}

		function next(){
			resolveIndex++;
			if (resolveIndex < fsToResolve.length){
				resolveOne();
			} else {
				if (typeof callback == 'function') callback();
			}
		}

		resolveOne();

	}

	function err(_err){
		console.error('Error on cordova-plugin-file-node-like initialization: ' + JSON.stringify(_err));
		if (typeof callback == 'function') callback(_err);
		else throw _err;
	}
}

function StorageManager(fsRoot){

	var root = fsRoot || window._fs;

	var configFileName = 'config.json';

	var sm = {};

	var FileErrorAttributes = Object.keys(FileError);
	var FileErrorCodes = [];
	for (var i = 0; i < FileErrorAttributes.length; i++) if (/^[A-Z_]+$/.test(FileErrorAttributes[i])) FileErrorCodes.push(FileErrorAttributes[i]);

	var FileErrorCodesObj = {};
	for (var i = 0; i < FileErrorCodes.length; i++) FileErrorCodesObj[FileError[FileErrorCodes[i]]] = FileErrorCodes[i];

	var ioQueue = [];
	var processedIoTasks = 0;
	var isProcessingIo = false;

	function ioQueueProcessing(_chaining){
		if (ioQueue.length == 0) return;

		if (isProcessingIo == true && !_chaining) return;
		isProcessingIo = true;

		var nextTask = ioQueue[0];
		ioQueue.splice(0, 1);

		var opName = nextTask.type;
		var filePath = nextTask.path;
		var cb = nextTask.cb;

		if (opName == 'write'){
			var data = nextTask.data;

			root.getFile(filePath, {create: true}, write_FileFound, fsErrorHandler(cb));

			function printErr(e){
				//if (console.trace) console.trace(e);
				if (e.stack) console.error(e.stack);
				else console.error(e);
			}

			function write_FileFound(file){
				file.createWriter(function(writer){
					writer.onwriteend = function(){
						next();
						try {
							cb();
						} catch (e){
							printErr(e);
						}
					};
					writer.onerror = function(err){
						next();
						try {
							fsErrorHandler(err, cb);
						} catch (e){
							printErr(e);
						}
					};
					if (typeof data == 'string') writer.write(data);
					else writer.write(data.buffer); //Getting the underlying array buffer
				}, function(err){
					next();
					try {
						fsErrorHandler(err, cb);
					} catch (e){
						printErr(e);
					}
				});
			}

			function fileError(evt){
				next();
				try {
					cb(evt.target.error);
				} catch (e){
					printErr(e);
				}
			}
		} else if (opName == 'append'){
			var data = nextTask.data;

			root.getFile(filePath, {create: true}, function(fileEntry){
				fileEntry.createWriter(function(writer){
					writer.onwriteend = function(){
						next();
						try {
							cb();
						} catch (e){
							printErr(e);
						}
					};
					writer.onerror = function(err){
						next();
						try {
							fsErrorHandler(err, cb);
						} catch (e){
							printErr(e);
						}
					};

					writer.seek(writer.length); //Goto EOF
					if (typeof data == 'string') writer.write(data);
					else writer.write(data.buffer);
				}, function(err){
					next();
					try {
						fsErrorHandler(err, cb);
					} catch (e){
						printErr(e);
					}
				});
			}, function(err){
				next();
				try {
					fsErrorHandler(err, cb);
				} catch (e){
					printErr(e);
				}
			});
		} else if (opName == 'read'){
			var asBuffer = nextTask.asBuffer;

			root.getFile(filePath, null, read_fileEntryFound, function(err){
				next();
				try {
					fsErrorHandler(err, cb);
				} catch (e){
					printErr(e);
				}
			});

			function read_fileEntryFound(fileEntry){
				fileEntry.file(read_fileFound, function(err){
					next();
					try {
						fsErrorHandler(cb, err);
					} catch (e){
						printErr(e);
					}
				});
			}

			function read_fileFound(file){
				var fileReader = new FileReader();
				fileReader.onloadend = function(evt){
					if (asBuffer){
						var byteBuffer = new Uint8Array(evt.target.result);
						next();
						try {
							cb(null, byteBuffer);
						} catch (e){
							printErr(e);
						}
					} else {
						next();
						try {
							cb(null, evt.target.result);
						} catch (e){
							printErr(e);
						}
					}
				};
				if (asBuffer) fileReader.readAsArrayBuffer(file);
				else fileReader.readAsText(file);
			}
		} else if (opName == 'unlink'){
			root.getFile(filePath, {create: true}, function(entry){
				entry.remove(function(){ //Success callback
					next();
					try {
						cb();
					} catch (e){
						printErr(e);
					}
				}, function(err){ //Error callback
					next();
					try {
						if (err.code == FileError.NOT_FOUND_ERR) cb();
						else fsErrorHandler(err, cb);
					} catch (e){
						printErr(e);
					}
				});
			}, function(err){ //Error callback
				next();
				try {
					if (err.code == FileError.NOT_FOUND_ERR) cb();
					else fsErrorHandler(err, cb);
				} catch (e){
					printErr(e);
				}
			});
		} else {
			console.error('Unknown task type: ' + JSON.stringify(nextTask));
			next();
		}

		function next(){
			processedIoTasks++;
			if (ioQueue.length > 0){
				if (processedIoTasks % 100 == 0) setTimeout(function(){
					ioQueueProcessing(true);
				}, 0);
				else ioQueueProcessing(true);
			} else isProcessingIo = false;
			/* else {
				setTimeout(ioQueueProcessing, 10);
			}*/
		}
	}

	//ioQueueProcessing(); //Launch the ioQueueProcessing loop

	/**
	* Load the user's local config
	* @private
	* @param {Function} callback - callback function that will receive (err, configObject)
	*/
	sm.loadConfig = function(callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		sm.readFile(configFileName, function(err, configStr){
			if (err) callback(err);
			else {
				if (!configStr || configStr == ''){
					callback(null, {}); //If no config has been set, return a null object
					return;
				}
				var config;
				try {
					config = JSON.parse(configStr);
				} catch (e){
					callback(new Error('Error while trying to parse the config file: ' + JSON.stringify(e)));
					return;
				}
				callback(null, config);
			}
		});
	};

	/**
	* Save the user's config object
	* @private
	* @param {Object} configObj - the configuration object to be saved
	* @param {Function} callback - callback function that will receive (err)
	*/
	sm.saveConfig = function(configObj, callback){
		if (typeof configObj != 'object') throw new TypeError('configObj must be an object');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		sm.writeFile(configFileName, JSON.stringify(configObj), callback);

	};

	/**
	* Asynchronously read the content of a local file
	* @private
	* @param {String} filename - name of the file to be read
	* @param {String} [encoding] - "buffer" or "utf8". Optional
	* @param {Function} callback - callback function that will receive (err, contentStr)
	*/
	sm.readFile = function(filename, _encodingOrCallback, _callback){
		if (typeof filename != 'string') throw new TypeError('filename must be a string');

		var encoding, callback;
		if (typeof _encodingOrCallback == 'string'){
			//If an encoding argument is provided, the following one must be the callback, hence a function
			if (typeof _callback != 'function') throw new TypeError('callback must be a function');

			encoding = _encodingOrCallback;
			callback = _callback;
		} else if (typeof _encodingOrCallback == 'function'){
			callback = _encodingOrCallback;
		}

		var asBuffer = true;

		if (typeof encoding == 'string'){
			if (encoding == 'buffer') asBuffer = true;
			else if (encoding == 'utf8') asBuffer = false;
			else {
				callback('Invalid encoding: ' + asBuffer);
				return;
			}
		}

		ioQueue.push({type: 'read', path: filename, asBuffer: asBuffer, cb: callback});
		ioQueueProcessing();

		/*root.getFile(filename, null, fileEntryFound, fsErrorHandler(callback));

		function fileEntryFound(fileEntry){
			fileEntry.file(fileFound, fsErrorHandler(callback));
		}

		function fileFound(file){
			var fileReader = new FileReader();
			fileReader.onloadend = function(evt){
				if (asBuffer){
					var byteBuffer = new Uint8Array(evt.target.result);
					callback(null, byteBuffer);
				} else callback(null, evt.target.result);
			};
			if (asBuffer) fileReader.readAsArrayBuffer(file);
			else fileReader.readAsText(file);
		}

		function fileError(evt){
			callback(evt.target.error);
		}*/

	};

	/**
	* Asynchronously save a string to a local file. Overwrites an existing file
	* @private
	* @param {String} filename - the file's name
	* @param {String} data - the data to be saved
	* @param {Function} callback - callback function that will receive (err)
	*/
	sm.writeFile = function(filename, data, callback){
		if (typeof filename != 'string') throw new TypeError('filename must be a string');
		if (!(typeof data == 'string' || data instanceof Uint8Array)) throw new TypeError('data must be a string or a Uint8Array');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		ioQueue.push({type: 'write', path: filename, data: data, cb: callback});
		ioQueueProcessing();

		/*root.getFile(filename, {create: true}, fileFound, fsErrorHandler(callback));

		function fileFound(file){
			file.createWriter(function(writer){
				writer.onwriteend = function(){
					callback();
				};
				writer.onerror = fsErrorHandler(callback);
				if (typeof data == 'string') writer.write(data);
				else writer.write(data.buffer); //Getting the underlying array buffer
			}, fsErrorHandler(callback));
		}

		function fileError(evt){
			callback(evt.target.error);
		}*/
	};

	/**
	* Asynchronously save a string to a local file. Appends to an existing file
	* @private
	* @param {String} filename - the file's name
	* @param {String} data - the data to be saved
	* @param {Function} callback - callback function that will receive (err)
	*/
	sm.appendFile = function(filename, data, callback){
		if (typeof filename != 'string') throw new TypeError('filename must be a string');
		if (!(typeof data == 'string' || data instanceof Uint8Array)) throw new TypeError('data must either be a string or a Uint8Array');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		ioQueue.push({type: 'append', path: filename, data: data, cb: callback});
		ioQueueProcessing();

		/*root.getFile(filename, {create: true}, function(fileEntry){
			fileEntry.createWriter(function(writer){
				writer.onwriteend = function(){
					callback();
				};
				writer.onerror = fsErrorHandler(callback);

				writer.seek(writer.length); //Goto EOF
				//var b = new Blob([data], {type: 'text/plain'});
				if (typeof data == 'string') writer.write(data);
				else writer.write(data.buffer);
			}, fsErrorHandler(callback));
		}, fsErrorHandler(callback));*/
	};

	/**
	* Check whether a file exists or not
	* @param {String} filename - name of the file to be checked
	* @param {Function} callback - callback function to receive (err, exists)
	*/
	sm.exists = function(filename, callback){
		if (typeof filename != 'string') throw new TypeError('filename must be a string');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		root.getFile(filename, {create: false}, foundFile, fsFileError);

		function foundFile(fileEntry){
			callback(true);
		}

		function fsFileError(err){
			if (err.code == 11){ //Type mismatch
				root.getDirectory(filename, {create: false}, foundDir, fsDirError);

				function foundDir(dirEntry){
					callback(true);
				}

				function fsDirError(err){
					if (err.code != 1){
						console.error('Unexpected FileError type');
						console.error(JSON.stringify(err));
					}
					callback(false);
				}

				return;
			} else if (err.code != 1){
				console.error('Unexpected FileError type');
				console.error(JSON.stringify(err));
			}

			callback(false);
		}
	};

	sm.stat = function(filename, callback){
		if (typeof filename != 'string') throw new TypeError('filename must be a string');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		root.getFile(filename, {create: false}, fileEntryFound, fsFileError);

		function fileEntryFound(entry){
			//console.log('entry: ' + JSON.stringify(entry));
			//console.log('keys: ' + JSON.stringify(Object.keys(entry)));
			var stats = {
				//size: entry.size,
				//mtime: entry.lastModifiedDate,
				isFile: true, //function(){return true},
				isDirectory: false //function(){return false}
			};
			callback(null, stats);
		}

		function fsFileError(err){
			if (err.code == 11){ //Target is a directory

				root.getDirectory(filename, {create: false}, dirEntryFound, fsDirError);

				function dirEntryFound(entry){
					var stats = {
						//size: Number(entry.size),
						//mtime: String(entry.lastModifiedDate),
						isFile: false, //function(){return false},
						isDirectory: true //function(){return true}
					};
					callback(null, stats);
				}

				function fsDirError(err){
					callback(err);
				}

			} else {
				callback(err);
			}
		}
	};

	sm.mkdir = function(filename, callback){
		if (typeof filename != 'string') throw new TypeError('filename must be a string');
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		root.getDirectory(filename, {create: true}, function(dirEntry){
			callback();
		}, fsErrorHandler(callback));
	};

	sm.mkdirp = function(filename, callback){
		ensureTypes(arguments, ['string', 'function']);

		var _paths = interpaths(filename);

		function createDir(folders){
			root.getDirectory(folders[0], {create: true}, function(dirEntry){
				if (folders.length > 1){
					createDir(folders.slice(1));
				} else callback();
			}, function(err){
				if (err.code != FileError.PATH_EXISTS_ERR){
					fsErrorHandler(err, callback);
				} else {
					if (folders.length > 1){
						createDir(folders.slice(1));
					} else callback();
				}
			});
		}

		createDir(_paths);
	};

	sm.readdir = function(path, callback){
		ensureTypes(arguments, ['string', 'function']);

		root.getDirectory(path, {}, function(dirEntry){
			var dirReader = dirEntry.createReader();
			var entries = [];

			//Because it's not guaranteed by the API that all the dir's contents will be listed in a single readEntries call
			function readEntries(){
				dirReader.readEntries(function(results){
					if (!results.length) callback(null, entries);
					else {
						for (var i = 0; i < results.length; i++) entries.push(results[i].name);
						readEntries();
					}
				}, fsErrorHandler(callback));
			}

			readEntries();

		}, fsErrorHandler(callback));
	};

	sm.unlink = function(path, callback){
		ensureTypes(arguments, ['string', 'function']);

		ioQueue.push({type: 'unlink', path: path, cb: callback});
		ioQueueProcessing();

		/*root.getFile(path, {create: false}, function(entry){
			entry.remove(function(){callback();}, function(err){
				if (err.code == FileError.NOT_FOUND_ERR){
					callback();
					return;
				}
				fsErrorHandler(err, callback);
			});
		}, function(err){
			if (err.code == FileError.NOT_FOUND_ERR){
				callback();
				return;
			}
			fsErrorHandler(err, callback);
		});*/
	};

	sm.rmdir = function(path, callback){
		ensureTypes(arguments, ['string', 'function']);

		root.getDirectory(path, {}, function(dirEntry){
			dirEntry.remove(function(){callback();}, function(err){
				if (err.code == FileError.NOT_FOUND_ERR){
					callback();
					return;
				}
				fsErrorHandler(err, callback);
			});
		}, function(err){
			if (err.code == FileError.NOT_FOUND_ERR){
				callback();
				return;
			}
			fsErrorHandler(err, callback);
		});
	};

	sm.rmdirr = function(path, callback){
		ensureTypes(arguments, ['string', 'function']);

		root.getDirectory(path, {}, function(dirEntry){
			dirEntry.removeRecursively(function(){callback();}, function(err){
				if (err.code == FileError.NOT_FOUND_ERR){
					callback();
					return;
				}
				fsErrorHandler(err, callback);
			});
		}, function(err){
			if (err.code == FileError.NOT_FOUND_ERR){
				callback();
				return;
			}
			fsErrorHandler(err, callback);
		});
	};

	/*sm.mv = function(path, callback){
		ensureTypes(arguments, ['string', 'function']);

		//_fs.getFile(path)
	};*/

	function fsErrorHandler(param1, param2) {
		var e, cb;
		if (typeof param1 == 'object'){
			e = param1;
			if (typeof param2 == 'function') cb = param2;
			runHandler();
		} else if (typeof param1 == 'function'){
			cb = param1;
			return runHandler;
		} else throw new Error('Invalid parameters');

		function runHandler(_e){
			e = _e || e;
			var msg = FileErrorCodesObj[e.code];
			if (!msg) msg = 'Unknown error';

			/*switch (e.code) {
				case FileError.QUOTA_EXCEEDED_ERR:
					msg = 'QUOTA_EXCEEDED_ERR';
					break;
				case FileError.NOT_FOUND_ERR:
					msg = 'NOT_FOUND_ERR';
					break;
				case FileError.SECURITY_ERR:
					msg = 'SECURITY_ERR';
					break;
				case FileError.INVALID_MODIFICATION_ERR:
					msg = 'INVALID_MODIFICATION_ERR';
					break;
				case FileError.INVALID_STATE_ERR:
					msg = 'INVALID_STATE_ERR';
					break;
				default:
					msg = 'Unknown Error';
					break;
			};*/

			if (typeof cb == 'function') cb(msg);
			//console.error('FS error: ' + msg);
		}
	}

	sm.fsErrorHandler = fsErrorHandler;

	function ensureTypes(params, types){
		for (var i = 0; i < params.length; i++) if (typeof params[i] != types[i]) throw new TypeError('param[' + i + '] must be of type ' + types[i]);
	}

	function interpaths(filename){
		var pathParts = filename.split('/');
		while (pathParts[0] == '' || pathParts[0] == '.'){
			pathParts = pathParts.slice(1);
		}

		var intermediaryPaths = [];
		var currentInterPath = [];
		for (var i = 0; i < pathParts.length; i++){
			currentInterPath.push(pathParts[i]);
			intermediaryPaths.push(currentInterPath.join('/'));
		}

		return intermediaryPaths;
	}

	//this = sm;
	return sm;
}

StorageManager.init = initializeFS;

module.exports = StorageManager;
