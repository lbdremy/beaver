/**
 * Modules dependencies
 */

var request = require('request'),
	fs = require('fs'),
	zlib = require('zlib'),
	bridge = require('./beaver/streams/bridge'),
	ftpGet = require('./beaver/streams/ftp-get'),
	xmlMapper = require('./beaver/streams/xml-mapper'),
	solrRiver = require('./beaver/streams/solr-river'),
	csv = require('csv-stream'),
	objectMapper = require('object-mapper-stream');

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
	bridge : bridge.createStream,
	'csv-stream' : csv.createStream,
	'object-mapper' : objectMapper.createStream
}

/**
 * Process the entry according to the given `options`
 *
 * @param {Object} options - set of options
 * @param {Array} options.pipeline - list of streams
 */

exports.process = function process(options){
	var bridgeStream = bridge.createStream();
	
	function onerror(err){
		bridgeStream.emit('error',err);
	}

	function cleanup(){
		this.removeListener('error',onerror);
		this.removeListener('close',cleanup);
		this.removeListener('end',cleanup);
	}

	return options.pipeline.reduce(function(stream,currentStep,index){
		if(!stream){
			return exports.streams[currentStep](options[currentStep])
					.on('error',onerror)
					.on('close',cleanup)
					.on('end',cleanup);
		}
		return stream.pipe(exports.streams[currentStep](options[currentStep]))
			.on('error',onerror)
			.on('close',cleanup)
			.on('end',cleanup);
	},null).pipe(bridgeStream);
}