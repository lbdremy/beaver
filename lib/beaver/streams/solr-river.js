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
	this.writable = true;
	this.readable = true;
	this.options = options;
	this.client = solr.createClient(options);
	this.client.autoCommit = options.autoCommit || false;
	this.docs = [];
	this.queue = 0;
}

util.inherits(SolrRiver,Stream);


SolrRiver.prototype.write = function(buffer,encoding){
	var self = this;
	if(buffer){
		try{
			var doc = JSON.parse(buffer);
		}catch(err){
			this.emit('error',err);
		}
		if(doc){
			this.docs.push(doc)
		}
	}
	if(this._paused){
		return false;
	}else{
		if((this.docs.length >= this.options.limit) || (this._ended && this.docs)){
			this.queue++;
			this.client.add(this.docs,function(err,obj){
				self._onresponse(err,obj);
			});
			this.docs = [];
		}
		return true;
	}
}

SolrRiver.prototype.end = function(buffer,encoding){
	this._ended = true;
	this.write(buffer,encoding);
}

SolrRiver.prototype.destroy = function(){
	if(!this._ended) this.end();
	this._destroyed = true;
}

SolrRiver.prototype._onresponse = function(err,obj){
	this.queue--;
	if(err){
		this.emit('error',err);
	}else{
		this.emit('data',JSON.stringify(obj));
	}
	if(this._ended && this.queue === 0){
		this.emit('end');
	}
	if(this._destroyed && this.queue === 0){
		this.emit('close');
	}
}

SolrRiver.prototype.pause = function(){
	this._paused = true;
}

SolrRiver.prototype.resume = function(){
	this._paused = false;
	this.write();
	this.emit('drain');
}