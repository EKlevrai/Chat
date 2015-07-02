module.paths.push('/usr/local/lib/node_modules');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var morgan = require('morgan')//logger de dev
var cookieParser = require('cookie-parser')//
var session = require('express-session');//
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');//NOT USED

var chatManager=require('./libs/chatManager.js');
var chatSession=require('./libs/sessionID.js');


function clientSocket(roomId, namespace) {
	    var res = [];
	    var ns = io.of(namespace ||"/");    // the default namespace is "/"

	    if (ns) {
	        for (var id in ns.connected) {
	            if(roomId) {
	                var index = ns.connected[id].rooms.indexOf(roomId) ;
	                if(index !== -1) {
	                    res.push(ns.connected[id]);
	                }
	            } else {
	                res.push(ns.connected[id]);
	            }
	        }
	    }
	    return res;
	}

/**put the host */
global.mysql_host='localhost';
/**the user */
global.mysql_user='root';
/**put the password */
global.mysql_password='root';
/**the DB*/
global.mysql_database='FauchChat';

//all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(morgan('combined'))
app.use(cookieParser());

app.use(session({secret: '1234567890QWERTY'}));

app.use(bodyParser());
//app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));

app.get("/chat",function(req, res, next){
	if (req.session.fauchChat && req.session.fauchChat.sid){
		chatSession.getUid(req.session.fauchChat.sid,console.log)
		res.render('chat.ejs');
	}
	else {
//		var new_SID= Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 45);
//		chatSession.add(new_SID,1);

		res.redirect('/login');
		
	}	
});
app.get("/login",function(req, res, next){
	if (req.session.fauchChat && req.session.fauchChat.sid){
		console.log("got-it");
		chatSession.getUid(req.session.fauchChat.sid,console.log)
		res.redirect('/chat');
	}
	else {
		var new_SID= Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 45);
		chatSession.add(new_SID,1);
		req.session.fauchChat={sid : new_SID};
		res.render('login.ejs');
	}	
});
app.use(function(req, res, next){
	if (req.originalUrl=="/chat" || req.originalUrl=="/login"){}
	else{res.redirect("/chat");}
});

server.listen(port, function () {
	console.log('Server listening at port %d', port);
	});
var usernames = {};
var numUsers = 0;


/** Connexion avec le client */
io.on('connection', function (socket) {

	/** @var uid : (user id) l'identifiant de la personne connectée */
	socket.uid = undefined;
	socket.username = undefined;
	// when the client emits 'new message', this listens and executes
	socket.on('new message', function(data){chatManager.newMessage(data,clientSocket(),socket);});
	socket.on('login',function(item){chatManager.login(item,clientSocket(),socket)});
	socket.on('log_out',function(){chatManager.logout(clientSocket(),socket)});
});

