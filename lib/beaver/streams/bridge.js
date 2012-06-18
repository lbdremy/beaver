/**
 * Modules dependencies
 */

var Stream = require('stream'),
	util = require('util');

exports.createStream = function(){
	return new Bridge();
}

function Bridge(){
	Stream.call(this);
	this.writable = true;
	this.readable = true;
}

// Inherits of Stream
util.inherits(Bridge,Stream);

Bridge.prototype.write = function(buffer,encoding){
	if(!this._paused){
		this.emit('data',this.encode(buffer,encoding));
		return true;
	}else{
		this._buffered = { buffer : buffer, encoding : encoding};
		return false;
	}
	
}

Bridge.prototype.end = function(buffer,encoding){
	if(buffer){
		this.emit('data',this.encode(buffer,encoding))
	};
	this._ended = true;
	this.emit('end');
}

Bridge.prototype.destroy = function(){
	if(!this._ended) this.end();
	this.emit('close');
}

Bridge.prototype.setEncoding = function(encoding){
	this.encoding = encoding;
}

Bridge.prototype.encode = function(buffer,encoding) {
  if (encoding || this.encoding) {
    buffer = buffer.toString(encoding || this.encoding);
  }
  return buffer;
};

Bridge.prototype.pause = function(){
	this._paused = true;
}

Bridge.prototype.resume = function(){
	this._paused = false;
	if(this._buffered){
		this.write(this._buffered.buffer,this._buffered.encoding);
		delete this._buffered.buffer;
		delete this._buffered.encoding;
		this._buffered = null;
	}
	this.emit('drain');
}