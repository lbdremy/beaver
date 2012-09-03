/**
 * Modules dependencies
 */

var spec = require('stream-spec'),
	tester = require('stream-tester'),
	solrRiver = require('./../lib/beaver/streams/solr-river');

var stream = solrRiver.createStream({ host : 'localhost' , port : 8983});

spec(stream)
	.through({ strict : true , error : false })
	.validateOnExit();

var id = 0;
tester.createRandomStream(function(){
	id++;
	return { id : id , title_t : 'title' + id, spec_b : true };
},10000)
	.pipe(stream)
	.on('error',function(err){
		console.error(err);
	})
	.pipe(tester.createPauseStream());