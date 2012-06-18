/**
 * Modules dependencies
 */

var util = require('util'),
	EventEmitter = require('events').EventEmitter;


exports.listen = function(parser){
	var xpath = new XPath();
	xpath.listen(parser);
	return xpath;
}

function XPath(){
	EventEmitter.call(this);
	this.expression = '';
}

util.inherits(XPath,EventEmitter);

XPath.prototype.listen = function(parser){
	var self = this;
	// node.name - tag name
	// node.attributes - hash of attribute name and value
	parser.onopentag = function(node){
		self.expression += '/' + node.name ;
		Object.keys(node.attributes).forEach(function(value, index){
			self.emit('text', { 
				expression : self.expression + '[@' + value + ']' , 
				text : node.attributes[value]  
			})
		});
	}

	parser.onclosetag = function(tag){
		self.emit('closetag', self.expression);
		var lastIndex = self.expression.lastIndexOf('/');
		self.expression = self.expression.slice(0,lastIndex)
	}

	parser.oncdata = function(text){
		self.emit('text', { 
			expression : self.expression, 
			text : text  
		})
	}

	parser.ontext = function(text){
		self.emit('text', { 
			expression : self.expression, 
			text : text  
		})
	}
	return self;
}

XPath.prototype.close = function(){
	this.removeAllListeners();
}

