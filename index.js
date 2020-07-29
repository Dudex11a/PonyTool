var express = require("express");
 
var app = express();
 
app.use(express.static('public'));
 
var server = app.listen(4000, function(){
    var port = server.address().port;
    console.log("Server started at http://localhost:%s", port);
});

app.use(express.static("public"));