'use strict';

/* eslint-disable dot-notation */

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', express.static('./dist'));

var server = app.listen(3000, () => {
  var port = server.address().port;
  console.log('Server is listening at http://localhost:%s', port);
});
