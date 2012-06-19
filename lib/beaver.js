/**
 * Modules dependencies
 */

var request = require('request'),
	fs = require('fs'),
	zlib = require('zlib'),
	bridge = require('./beaver/streams/bridge'),
	ftpGet = require('./beaver/streams/ftp-get'),
	xmlMapper = require('./beaver/streams/xml-mapper'),
	solrRiver = require('./beaver/streams/solr-river');

/**
 * Supported streams
 */

exports.streams = {
	gunzip: zlib.createGunzip,
    inflate: zlib.createInflate,
    unzip : zlib.createUnzip,
    'fs-read' : fs.createReadStream,
    'fs-write' : fs.createWriteStream,
	'http-get' : request,
	'ftp-get' : ftpGet.createStream,
	'xml-mapper' : xmlMapper.createStream,
	'solr-river' : solrRiver.createStream,
	bridge : bridge.createStream
}

/**
 * Process the entry according to the given `options`
 *
 * @param {Object} options - set of options
 * @param {Array} options.pipeline - list of streams
 */

exports.process = function process(options){
	var bridgeStream = bridge.createStream();
	return options.pipeline.reduce(function(stream,currentStep,index){
		if(!stream){
			return exports.streams[currentStep](options[currentStep])
					.on('error',function(err){ bridgeStream.emit('error',err)});
		}
		return stream.pipe(exports.streams[currentStep](options[currentStep]))
			.on('error',function(err){ bridgeStream.emit('error',err)});
	},null).pipe(bridgeStream);
}