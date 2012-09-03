/**
 * Modules dependencies
 */

var solr = require('solr-client'),
	util = require('util'),
	Stream = require('stream');

exports.createStream = function(options){
	return new SolrRiver(options);
}

function SolrRiver(options){
	Stream.call(this);
	var self = this;

	// States
	this.writable = true;
	this.readable = true;
	this._paused = false;
	this._ended = false;
	this._destroyed = false;
	this._endCallWhenPause = false;

	// Options
	this.options = options;
	this.clients = [];
	if(Array.isArray(options)){
		options.forEach(function(option){
			var client = solr.createClient(option);
			client.autoCommit = option.autoCommit || false;
			self.clients.push(client);
		});
	}else{
		var client = solr.createClient(options);
		client.autoCommit = options.autoCommit || false;
		this.clients.push(client);
	}
	this.docs = [];
	this.queue = 0;
	this.docsLimit = 500;
	this.errors = []; 
}

util.inherits(SolrRiver,Stream);


SolrRiver.prototype.write = function(object){
	var self = this;
	if(object) this.docs.push(object);
	if(!this._paused && (this.docs.length >= this.docsLimit) || (this._ended && this.docs.length > 0)){
		this.queue += this.clients.length;
		this.clients.forEach(function(client){
			client.add(self.docs,function(err,obj){
				self._onresponse(err,obj);
			});
		});
		this.docs = [];
	}
	return !this._paused;
}

SolrRiver.prototype.end = function(object){
	this._ended = true;
	this.writable = false;
	if(object || this.docs.length > 0) this.write(object);
	if(this._paused) this._endCallWhenPause = true; 
	if(!this._paused) this._superEnd();
}

SolrRiver.prototype._superEnd = function(){
	if(this._ended && this.queue === 0 && this.errors.length > 0) this.emit('error',this.errors[0]);
	if(this._ended && this.queue === 0 && this.errors.length === 0){
		this.readable = false;
		this.emit('end');
		if(!this._destroyed) this.destroy();
	}
}

SolrRiver.prototype.destroy = function(){
	this._destroyed = true;
	this.docs = null;
	this.emit('close');
}

SolrRiver.prototype._onresponse = function(err,obj){
	this.queue--;
	if(err){
		this.errors.push(err);
	}else{
		this.emit('data',JSON.stringify(obj));
	}
	this._superEnd();
}

SolrRiver.prototype.pause = function(){
	this._paused = true;
}

SolrRiver.prototype.resume = function(){
	this._paused = false;
	if(this.docs.length > 0) this.write();
	this.emit('drain');
	if(this._endCallWhenPause) this._superEnd();
}