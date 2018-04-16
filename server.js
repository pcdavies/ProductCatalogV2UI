'use strict';

var http = require('http');
var express = require('express');
var path = require('path');
var PORT = process.env.PORT || 8085;
var app = express();

app.use(express.static('./public'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/alpha.html'));
});

app.listen(PORT, function () {
    console.log('listening on port ' + PORT)
});

app.get('/endpoints', function(request,response){
    var db_rest_url = process.env.DB_REST_URL + 'products';
    var twitter_url = process.env.TWITTER_URL + 'statictweets';
    response.send( { "db_rest_url": db_rest_url, "twitter_url": twitter_url} );
});
