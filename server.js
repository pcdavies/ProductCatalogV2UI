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
