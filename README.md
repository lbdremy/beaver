#Beaver - Let it process your pipeline

##Usage

```js
var beaver = require('beaver');

// available readable and/or writable streams are in `beaver.streams` object.
// extend the `beaver.streams` object with your own streams and use them later in the pipeline.

var options = {
	pipeline : ['http-get', 'gunzip', 'fs-write'],
	'http-get' : 'http://mysite.com/nice-file.gz',
	'fs-write' : '/home/user/Desktop/nice-file'	
}

beaver.process(options)
	.on('error',function(err){
		console.log(err);
	})
	.on('end',function(){
		console.log('ended!')
	})
```

##Write your own streams

Documentation -> https://github.com/nodedocs/Creating-Your-Streams/blob/master/article.md