// Module dependencies
var ftp = require('ftp'),
    url = require('url'),
    bridge = require('./bridge');


exports.createStream = function(uri){
   var bridgeStream = bridge.createStream();
   // Parse uri
   var urlParsed = url.parse(uri);
   if(urlParsed.auth){
      var username = urlParsed.auth.split(':')[0];
      var password = urlParsed.auth.split(':')[1];
   }
   var path = urlParsed.pathname;
   
   // Create a ftp client
   var options = { 
      host : urlParsed.host 
   };
   var ftpClient = new ftp(options);
   
   // Client connected
   ftpClient.on('connect',function(){
      if(username && password){
         ftpClient.auth(username,password,function(err){
            if(err){
               bridgeStream.emit('error',err);
            }else{
               get();
            }
         });
      }
      get();
   });

   // Get file
   function get(){
      ftpClient.get(path, function(err,res){
         res.pipe(bridgeStream);
         if(err){
            bridgeStream.emit('error',err);
         }else{
            res.on('success', function() {
               ftpClient.end();
            });
            res.on('error', function(err) {
               ftpClient.end();
               bridgeStream.emit('error',err);
            });
         }
      });
   }

   // Error event
   ftpClient.on('error',function(err){
      bridgeStream.emit('error',err);
   });
   
   // Timeout event
   ftpClient.on('timeout',function(){
      var err = new Error('Timeout. FTP Server does not respond');
      bridgeStream.emit('error',err);
   });
   
   ftpClient.connect();

   return bridgeStream;
}