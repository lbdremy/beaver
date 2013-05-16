/**
 * Module dependencies
 */

var sax = require('sax'),
	util = require('util'),
	Stream = require('stream'),
	xpath = require('./../utils/xpath'),
	crypto = require('crypto');

exports.createStream = function(options){
	return new XmlMapper(options);
}

function XmlMapper(options){
	var self = this;
	Stream.call(this);

	// States
	this._paused = false;
	this._ended = false;
	this._destroyed = false;
	this.readable = true;
	this.writable = true;
	this._endCallWhenPause = false;

	// Parsing
	this.options = options;
	var strict = true;
	this.parser = sax.parser(strict);
	this._buffered = {
		buffer : new Buffer(0),
		encoding : ''
	};
	// Data collected
	this.row = {};
	this.xpathListener = xpath.listen(this.parser)
		.on('closetag',function(expression){
			if(expression === self.options.main){
				if(self.row){
					standardize(self.row,self.options);
					self.emit('data',self.row);
				}
				self.row = {};
			}
		})
		.on('text',function(node){
			var element = self.options.map[node.expression];
			if(element){
				var field = element['to'] || element;
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
	if(buffer){
		this._buffered = {
			buffer : Buffer.concat([this._buffered.buffer, buffer]),
			encoding : encoding
		};
	}
	if(!this._paused && this._buffered.buffer.length > 0){
		var text = this._buffered.buffer.toString(this._buffered.encoding);
		this._buffered.buffer = new Buffer(0);
		this.parser.write(text);
	}
	return !this._paused;
}

XmlMapper.prototype.end = function(buffer,encoding){
	if(buffer || this._buffered.buffer.length > 0) this.write(buffer,encoding);
	this.ended = true;
	this.writable = false;
	if(this._paused) return this._endCallWhenPause = true;
	this.readable = false;
	this.parser.close();
	this.xpathListener.close();
	this.emit('end');
	if(!this._destroyed) this.destroy();
}

XmlMapper.prototype.destroy = function(){
	this._destroyed = true;
	this.row = null;
	this.emit('close');
}

XmlMapper.prototype.pause = function(){
	this._paused = true;
}

XmlMapper.prototype.resume = function(){
	this._paused = false;
	this.write();
	this.emit('drain');
	if(this._endCallWhenPause) this.end();
}

/**
 * Apply transformations configured by `common`, `default`, `copy` and `format` options.
 */

function standardize(row,options){
	var map = options.map;
	Object.keys(map).forEach(function(key){
		if(typeof(map[key]) === 'object'){
			var field = map[key]['to'];
			var common = map[key]['common'];
			var defaultValue = map[key]['default'];
			var currentValue = row[field];
			var format = map[key]['format'] && exports.format[map[key]['format']];
			if(!currentValue && defaultValue) row[field] = defaultValue;
			if(currentValue && common) map[key]['default'] = currentValue;
			if(row[field] && format) row[field] = format(row[field]);
		}
	});
	// Second pass to take care of the `copy` options
	Object.keys(map).forEach(function(key){
		if(typeof(map[key]) === 'object'){
			var copy = map[key]['copy'];
			if(copy){
				var currentField = map[key]['to'];
				var fields = copy.split(',');
				row[currentField] = '';
				fields.forEach(function(field){
					row[currentField] += row[field]
				});
				var format = map[key]['format'] && exports.format[map[key]['format']];
				if(format) row[currentField] = format(row[currentField]);
			}
		}
	})
}

// Bag for methods to format value
exports.format = {};