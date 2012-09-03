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
	// States
	this.writable = true;
	this.readable = true;
	this._destroyed = false;
	this._paused = false;
	this._ended = false;
	this._endCallWhenPause = false;

	// Buffer
	this._buffered = {
		buffer : new Buffer(0),
		encoding : ''
	};
}

// Inherits of Stream
util.inherits(Bridge,Stream);

Bridge.prototype.write = function(buffer,encoding){
	if(!Buffer.isBuffer(buffer)){
		buffer = new Buffer(buffer,'utf-8');
		this.encoding = 'utf-8';
	}
	this._buffered = { buffer : Buffer.concat([this._buffered.buffer,buffer]), encoding : encoding};
	if(!this._paused){
		this.emit('data',this._decode(this._buffered.buffer,this._buffered.encoding));
		this._buffered.buffer = new Buffer(0);
	}
	return !this._paused;
}

Bridge.prototype.end = function(buffer,encoding){
	if(buffer || this._buffered.buffer.length > 0) this.write(buffer,encoding);
	if(this._paused) return this._endCallWhenPause = true;
	this._ended = true;
	this.writable = false;
	this.readable = false;
	this.emit('end');
	if(!this._destroyed) this.destroy();
}

Bridge.prototype.destroy = function(){
	this._destroyed = true;
	this._buffered.buffer = null;
	this.emit('close');
}

Bridge.prototype.setEncoding = function(encoding){
	this.encoding = encoding;
}

Bridge.prototype._decode = function(buffer,encoding) {
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
	if(this._buffered.buffer.length > 0){
		this.write(this._buffered.buffer,this._buffered.encoding);
		this._buffered.buffer = new Buffer(0);
	}
	if(this._endCallWhenPause) this.end();
	this.emit('drain');
}