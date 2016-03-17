# cordova-plugin-file-node-like

A wrapper for [cordova-plugin-file](https://github.com/apache/cordova-plugin-file) that provides a Node.js-like API

## Setup

cordova plugin add cordova-plugin-file-node-like

## Getting started

Once the `deviceready` event has been triggered, here is how to setup this module

```js
//initialize this module, for the application data directory and the cache directory
window.plugins.nodefs.init(function(err){
	if (err){
		//Handle initialization error
		return;
	}

	var fs = window.plugins.nodefs(window._fs);
	var cacheFs = window.plugins.nodefs(window._cacheFs)
});
```

## License

This module is released under the terms of the MIT license.
