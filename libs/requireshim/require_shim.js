
// Public Properties

var __commonjs_modules = {};
var __commonjs_factories = {};

// Public Methods

function define(id, factory) { 
	id = id.replace(/\/index$/, '');
	__commonjs_factories[id] = factory; 
} 

function require(id) {
	var modules = __commonjs_modules;
	var factories = __commonjs_factories; 

	// This converts relative paths into absolute module names
	function normalize(id, base){
	
		// Some code golf to get the number of "directories" of the id back.
		var dots = /(\.?\.\/?)*/.exec(id)[0];
		var dirCount = Math.floor(dots.replace(/\//g, '').length/1.9 + 0.99);

		if(dirCount){
			// Reduce base by found number of "directories"
			var reduced = base.split('/');
			reduced = reduced.slice(0, reduced.length - dirCount)
			reduced = reduced.join('/');
			
			if(reduced){
				id = reduced + '/' + id.slice(dots.length);
			}
		}
		return id.replace(/\/$/, '');
	}

	if (!modules[id]){		
		var message = "Could not load module: '"+id+"'";
		if(!factories[id])throw new Error(message);

		// creates custome require function
		var customeRequire = function(newid){
			return require(normalize(newid, id));
		}
		
		// This stops infinite recursion with circular dependencies
		modules[id] = {};

		var module = {exports: {}};
		factories[id](customeRequire, module.exports, module);
		modules[id] = module.exports;
	}
	
	return modules[id];
}