module.paths.push('/usr/local/lib/node_modules');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var port = process.env.PORT || 3000;
var morgan = require('morgan')//logger de dev
var cookieParser = require('cookie-parser')//
var session = require('express-session');//
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');//NOT USED
var io = require('socket.io')(server);
var fs = require('fs');
var ini = require('ini');

global.config = ini.parse(fs.readFileSync('./properties.conf', 'utf-8'))

var chatMessage=require(global.config.paths.libs+'/chatMessage.js');
var chatConnect=require(global.config.paths.libs+'/chatConnect.js');
var chatLogin=require(global.config.paths.libs+'/chatLogin.js');
var chatSQL=require(global.config.paths.libs+'/chatSQL.js');
var chatSession=require(global.config.paths.libs+'/sessionID.js');
var socketManager = require(global.config.paths.libs+'/socketManager.js')
var expressManager = require(global.config.paths.libs+'/expressManager.js')

/**
 * Setting up the express server
 */
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + global.config.paths.templates);
app.set('view engine', 'ejs');
/*app.use(morgan('combined'), {
  skip: function (req, res) { return (req.originalUrl.match(new RegExp(/\/[a-z]+\.[a-z]+$/))); }
	});*/
app.use(cookieParser());
app.use(
	session({secret: global.config.session.secret,
		saveUninitialized : false,
		resave : false
	})
);
app.use(bodyParser());
app.use(express.static(__dirname + global.config.paths.frontendFiles));
/*
 * server set up : 
 * we declare the middlewares (express and socket) 
 */
socketManager(io);
expressManager(app);



server.listen(port, function () {
	console.log('Server listening at port %d', port);
	});


process.on('uncaughtException', function (error) {
   console.log("c'est une belle errreur" +error.stack + error.toString());
});
