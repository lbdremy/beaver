/**
 * Module dependencies
 */

var sax = require('sax'),
	util = require('util'),
	Stream = require('stream'),
	xpath = require('./../utils/xpath');

exports.createStream = function(options){
	return new XmlMapper(options);
}

function XmlMapper(options){
	var self = this;
	Stream.call(this);
	this.readable = true;
	this.writable = true;
	this.options = options;
	var strict = true;
	this.parser = sax.parser(strict);

	// Data collected
	this.row = initialize({},options);
	
	this.xpathListener = xpath.listen(this.parser)
		.on('closetag',function(expression){
			if(expression === self.options.main){
				if(self.row){
					//console.log(self.row)
					self.emit('data',JSON.stringify(self.row));
				}
				self.row = initialize(self.row,self.options);
			}
		})
		.on('text',function(node){
			var exist = self.options.map[node.expression];
			if(exist){
				var field = exist['to'] || exist;
				self.row[field] = self.row[field] ? (self.row[field] + node.text) : node.text;
			}
		});

	// Attach handlers to sax events
	this.parser.onerror = function(err){
		self.emit('error',err);
	}
}

// Inherits from Stream
util.inherits(XmlMapper,Stream);

XmlMapper.prototype.write = function(buffer,encoding){
	//console.log(buffer.toString(encoding))
	if(!this._paused){
		this.parser.write(buffer.toString(encoding));
		return true;
	}else{
		this._buffered = { buffer : buffer, encoding : encoding};
		return false;
	}
}

XmlMapper.prototype.end = function(buffer,encoding){
	if(buffer){
		this.parser.write(buffer.toString(encoding));
	}
	this.ended = true;
	this.emit('end');
}

XmlMapper.prototype.destroy = function(){
	if(!this._ended) this.end();
	this.parser.close();
	this.xpathListener.close();
	this.emit('close');
}

XmlMapper.prototype.pause = function(){
	this._paused = true;
}

XmlMapper.prototype.resume = function(){
	this._paused = false;
	if(this._buffered){
		this.write(this._buffered.buffer,this._buffered.encoding);
		delete this._buffered.buffer;
		delete this._buffered.encoding;
		this._buffered = null;
	}
	this.emit('drain');
}

// Initialize and cleanup the row with default values
function initialize(row,options){
	var map = options.map;
	var rowInit = {};
	var field, common, defaultValue;
	Object.keys(map).forEach(function(key){
		field = map[key]['to'] || map[key];
		common = map[key]['common'];
		defaultValue = map[key]['default'];
		if(defaultValue) rowInit[field] = defaultValue;
		if(common) rowInit[field] =  row[field] || defaultValue;
	});
	return rowInit;
}