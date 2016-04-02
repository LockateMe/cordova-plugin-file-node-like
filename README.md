# cordova-plugin-file-node-like

A wrapper for [cordova-plugin-file](https://github.com/apache/cordova-plugin-file) that provides a Node.js-like API.

Tested on iOS and Android.

## Why?

* Because the API provided by [cordova-plugin-file](https://github.com/apache/cordova-plugin-file) is (mainly) the API that was meant to become the [HTML5 File API](http://www.w3.org/TR/FileAPI/); compared to the [Node.js fs module](https://nodejs.org/dist/latest-v5.x/docs/api/fs.html), it is awful!
* Because a rudimentary Node.js-like file API might suffice in most use cases in a Cordova app

## Setup

```
cordova plugin add cordova-plugin-file-node-like
```

## Getting started

Once the `deviceready` event has been triggered, here is how to setup this module

```js
//initialize this module, for the application data directory and the cache directory
window.plugins.nodefs.init(function(err){
	if (err){
		//Handle initialization error
		return;
	}

	//After the `init` call, window._fs, window._cacheFs and others become available
	var fs = window.plugins.nodefs(window._fs);
	var cacheFs = window.plugins.nodefs(window._cacheFs);
	// ... initialize an file system you want. I wrote those because they are among the most common ones. See below for more info

	//Example operations:

	//Recursively create folders
	fs.mkdirp('hello/world', function(err){
		if (err) throw err;

		//Write a file.
		fs.writeFile('hello/world/message', 'what\'s up guys?', function(err){
			if (err) throw err;

			//Read the file's contents, as string
			fs.readFile('hello/world/message', 'utf8', function(err, messageStr){
				if (err) throw err;

				console.log('Read from the file system: ' + messageStr);
			});
		});
	});
});
```

### Available file systems

When you call `window.plugins.nodefs.init`, it pre-loads/resolve multiple file systems available in the standard `cordova-plugin-file`. Once they are resolved, they are renamed and attached to an object (`window`, by default)

See the [available storage directories](https://github.com/apache/cordova-plugin-file#where-to-store-files), [their layouts and their read/write capabilities](https://github.com/apache/cordova-plugin-file#file-system-layouts) in `cordova-plugin-file`. Here is how they are renamed:

<table>
	<thead>
		<tr>
			<th>cordova.file.* name</th>
			<th>Node-like FS name</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>cordova.file.applicationDirectory</td>
			<td>\_appFs</td>
		</tr>
		<tr>
			<td>cordova.file.applicationStorageDirectory</td>
			<td>\_appStorageFs</td>
		</tr>
		<tr>
			<td>cordova.file.dataDirectory</td>
			<td>\_fs</td>
		</tr>
		<tr>
			<td>cordova.file.cacheDirectory</td>
			<td>\_cacheFs</td>
		</tr>
		<tr>
			<td>cordova.file.externalApplicationStorageDirectory</td>
			<td>\_externalAppStorageFs</td>
		</tr>
		<tr>
			<td>cordova.file.externalDataDirectory</td>
			<td>\_externalFs</td>
		</tr>
		<tr>
			<td>cordova.file.externalCacheDirectory</td>
			<td>\_externalCacheFs</td>
		</tr>
		<tr>
			<td>cordova.file.externalRootDirectory</td>
			<td>\_externalRootFs</td>
		</tr>
		<tr>
			<td>cordova.file.tempDirectory</td>
			<td>\_tempFs</td>
		</tr>
		<tr>
			<td>cordova.file.syncedDataDirectory</td>
			<td>\_syncedFs</td>
		</tr>
		<tr>
			<td>cordova.file.documentsDirectory</td>
			<td>\_documentsFs</td>
		</tr>
		<tr>
			<td>cordova.file.sharedDirectory</td>
			<td>\_sharedFs</td>
		</tr>
	</tbody>
</table>

__NOTE:__ Not all of the listed file systems are available on every platform. Availability is described in the `cordova-plugin-file` documentation.

## API

`window.plugins.nodefs.init(callback, [hostObject])` : initializes and resolves file systems.
* Function callback(err) : a callback function, receiving error `err` if one occurred
* Object hostObject : optional. An object to which the resolved file systems will be attached. Defaults to `window`. (This is where the `window._fs` and `window._cacheFs` in the example come from)

`window.plugins.node(fsReference)` : initializes a new file system wrapper, for the file system referred to by `fsReference` (like `_fs`, `cacheFs`, `_syncedFs`, and others, as described above)
* Returns an FS wrapper object, whose methods are documented below

### The FS wrapper object

__NOTE:__ As of now, methods involving blobs/buffers [are known not to work on Windows platforms](https://github.com/apache/cordova-plugin-file#supported-platforms). Please keep that in mind...

`fs.writeFile(path, data, cb)` : Write data at the given path. Overwrites the file if it already exists.
* String path : the path at which the file will be written. Note that parent folders must exist before making this call
* String|Uint8Array data : the data to be stored
* Function cb(err) : a callback function, receiving error `err` if one occurred

`fs.appendFile(path, data, cb)` : Append data to the file at the given file. Creates the file if it doesn't already exist
* String path : the path to which the data will be appended
* String|Uint8Array data : the data to be stored
* Function cb(err) : a callback function, receiving error `err` if one occurred

`fs.readFile(path, [encoding], cb)` : Read data at the given path
* String path : the path of the file to be read
* String encoding : optional string. Defaults to 'buffer'. Accepted values: 'buffer' to get a Uint8Array, 'utf8' to get a string
* Function cb(err, data) : a callback function, receiving the read data (in `data`). receiving error `err` if one occurred

`fs.exists(path, cb)` : Check whether a file or directory exists at the given
* String path : the path to be tested
* Function(exists) : a callback function, receiving the boolean `exists`, whose value indicate whether there is a file or directory at the given path

`fs.stat(path, cb)` : Get info about the file/directory at the given path (currently limited to whether it's a file or a directory)
* String path : the path to be tested
* Function cb(err, stat) : a callback function, receiving the resulting Stat object. Receives error `err`, if one occurred

`fs.mkdir(path, cb)` : Create a directory, given that its parent directories exist
* String path : path of the directory to be created
* Function cb(err) : a callback function. Receives error `err` if one occurred

`fs.mkdirp(path, cb)` : Create a directory, with its parent directories if they do not exist. Purpose : replace the `mkdirp` package
* String path : path of the directory to be created
* Function cb(err) : a callback function. Receives error `err` if one occurred

__NOTE:__ `fs.mkdirp` is not a standard function in the `fs` module of Node.js

`fs.readdir(path, cb)` : List the contents of a directory
* String path : path of the directory whose contents should be listed. To list the contents of the root folder, use `'.'` as path
* Function cb(err, contents) : a callback function, receiving the array `contents`, listing the files and directories in the requested directory. Receives error `err` if one occurred


`fs.unlink(path, cb)` : Delete a file
* String path : path of the file to be deleted
* Function cb(err) : a callback function, receiving error `err` if one occurred

`fs.rmdir(path, cb)` : Delete a directory, if it is empty
* String path : path of the directory to be deleted
* Function cb(err) : a callback function, receiving error `err` if one occurred

`fs.rmdirr(path, cb)` : Delete a directory and its contents : replace the `rmdir` package
* String path : path of the directory to be deleted
* Function cb(err) : a callback function, receiving error `err` if one occurred

__NOTE:__ `fs.rmdirr` is not a standard function in the `fs` module of Node.js

### The `Stat` object
The object resulting from a `fs.stat` call

As of now, the only attributes implemented in the stat object are:
* `Boolean isDirectory`
* `Boolean isFile`

Many attributes are missing [compared](https://nodejs.org/dist/latest-v5.x/docs/api/fs.html#fs_class_fs_stats) to the `fs` module of Node.js

__NOTE:__ These attributes are boolean variables, instead of being functions.

## Testing

1. Create a Cordova/Phonegap application
2. Add the iOS and/or the Android platforms
3. Add the [testing framework](https://github.com/apache/cordova-plugin-test-framework) and [bind its page](https://github.com/apache/cordova-plugin-test-framework#running-plugin-tests) as the main page of the app
4. Add this plugin
5. Add this plugin's test cases, by adding the plugin located in the `tests` folder
```
	cordova plugin add https://github.com/LockateMe/cordova-plugin-file-node-like.git#:/tests
```

## License

This module is released under the terms of the MIT license.
