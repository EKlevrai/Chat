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

var chatManager=require('./libs/chatManager.js');
var chatSQL=require('./libs/chatSQL.js');
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

app.use(morgan('combined'));/*, {
  skip: function (req, res) { return (req.originalUrl.match(new RegExp(/\/[(scripts),(stylesheets),(images)]+/))); }
	})
);*/
app.use(cookieParser());

app.use(session({secret: '1234567890QWERTY'}));

app.use(bodyParser());
//app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));

app.get("/login",function(req, res, next){
	if (req.session.fauchChat && req.session.fauchChat.sid){ 
		//Si, sur le cookie, on trouve un id de session, on va le comparer à ceux qui sont actifs 
		try{chatSession.getUid(req.session.fauchChat.sid,function(userId){res.redirect('/chat');});//si on trouve :  on redirige vers le chat
		}
		catch (exception) {
			/* exception possibles :
			 * "no entry found"       : le cookie sur le navigateur de l'user etait périmé ou erroné 
			 * "too much entry found" : plusieurs utilisateurs utilisent la même clé de session (murphy's law)  
			 */
			res.render('login.ejs');
		}
	}
	else {
		//Sinon, on ne fait rien et on charge le login	
		res.render('login.ejs');
	}	
});

app.post("/login",function(req,res,next){
	chatSQL.connectUser(req.body.user,req.body.pass,function(connectInfo){
		if(connectInfo.isConnected){//la connexion a eu lieu
			var new_SID= Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 45);
			chatSession.add(new_SID,connectInfo.uid,function(){
				req.session.fauchChat={sid : new_SID};
				res.redirect("/chat");	
			});
		}
		else{//mauvais user/login
			res.render('login.ejs',{messageError : "Wrong login or password"});
		}
		});
});
app.get("/chat",function(req, res, next){
	if (req.session.fauchChat && req.session.fauchChat.sid){
		chatSession.getUid(req.session.fauchChat.sid,function(userId){
			res.render('chat.ejs',{
				connectionID : req.session.fauchChat.sid,//ATTENTION, à remplacer par ConnectionID
				userID : userId
			});
		});
	}
	else {
		res.redirect("/login");
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

var io = require('socket.io')(server);
		
io.use(function(socket, next){
//unused middleware
  next();
});
io.on('connection', function (socket) {
	/** @var uid : (user id) l'identifiant de la personne connectée */
	socket.uid = undefined;
	socket.username = undefined;
	// when the client emits 'new message', this listens and executes
	socket.on('new message', function(data){chatManager.newMessage(data,clientSocket(),socket);});

	socket.on('login',function(item){chatManager.login(item,clientSocket(),socket)});//DEPRECATED

	socket.on('login_session',function(item){console.log("session connection");chatManager.connect(item,clientSocket(),socket);});

	socket.on('log_out',function(){chatManager.logout(clientSocket(),socket)});
});

