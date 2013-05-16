// Module dependencies
var FTPClient = require('ftp'),
    url = require('url'),
    bridge = require('./bridge');


exports.createStream = function(uri){
   var bridgeStream = bridge.createStream();

   // Create a ftp client
   var ftpClient = new FTPClient();

   // Client connected
   ftpClient.on('ready',function(){
      ftpClient.get(path, function(err,res){
         if(err){
            ftpClient.end();
            return bridgeStream.emit('error',err);
         }
         res.once('close',function() {
            ftpClient.end();
         });
         res.once('error',function(err){
            ftpClient.end();
            bridgeStream.emit('error',err);
         });
         res.pipe(bridgeStream);
      });
   });

   ftpClient.once('error',function(err){
      bridgeStream.emit('error',err);
   });

   ftpClient.once('close',function(){
      bridgeStream.emit('close');
   });

   ftpClient.once('end',function(){
      bridgeStream.emit('end');
   });

   // Start connection
   var options = {};
   var urlParsed = url.parse(uri);
   options.host = urlParsed.host;
   if(urlParsed.auth){
      options.user = urlParsed.auth.split(':')[0];
      options.password = urlParsed.auth.split(':')[1];
   }
   var path = urlParsed.pathname;
   ftpClient.connect(options);

   return bridgeStream;
}