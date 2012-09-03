/**
 * Modules dependencies
 */

var spec = require('stream-spec'),
	tester = require('stream-tester'),
	bridge = require('./../lib/beaver/streams/bridge');

var stream = bridge.createStream();
stream.setEncoding('utf-8');

spec(stream)
	.through({ strict : true , error : false })
	.validateOnExit();

tester.createRandomStream(function(){
	var b = new Buffer(50);
	b.fill('f');
	return b;
},1000)
	.pipe(stream)
	.pipe(tester.createPauseStream());