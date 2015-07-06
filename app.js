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
var LdapAuth = require('ldapauth');


var chatManager=require('./libs/chatManager.js');
var chatSQL=require('./libs/chatSQL.js');
var chatSession=require('./libs/sessionID.js');

var config = {
  ldap: {
    url: "ldap://192.168.42.60:389",
    adminDn: "cn=admin,dc=reactor,dc=lan",
    adminPassword: "root",
    searchBase: "dc=reactor,dc=lan",
    searchFilter: "(uid={{username}})"
  }
};

var ldap = new LdapAuth({
  url: config.ldap.url,
  adminDn: config.ldap.adminDn,
  adminPassword: config.ldap.adminPassword,
  searchBase: config.ldap.searchBase,
  searchFilter: config.ldap.searchFilter,
  //log4js: require('log4js'),
  cache: true
});


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

/*app.use(morgan('combined'), {
  skip: function (req, res) { return (req.originalUrl.match(new RegExp(/\/[a-z]+\.[a-z]+$/))); }
	});*/
app.use(cookieParser());

app.use(
	session({secret: '1234567890QWERTY',
		saveUninitialized : false,
		resave : false
	})
);

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
			 logMyErrors(exception)
			res.render('login.ejs',{message : {}});
		}
	}
	else {
		//Sinon, on ne fait rien et on charge le login	
		res.render('login.ejs',{message : {}});
	}	
});

app.post("/login",function(req,res,next){
		ldap.authenticate(req.body.user,req.body.pass, function (err, user) {
		if (err) {
				console.log("LDAP auth error: %s", err);
		}
		else{//la connexion a eu lieu 
			console.log(user);
			var new_SID= Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 45);
			chatSession.add(new_SID,user.uidNumber,function(){
				req.session.fauchChat={sid : new_SID};		
				res.redirect("/chat");	
			});
		}
	});
});

app.get("/logout",function(req, res, next){
	if (req.session.fauchChat && req.session.fauchChat.sid){ 
		//Si, sur le cookie, on trouve un id de session, on va le comparer à ceux qui sont actifs 	
		try{chatSession.getUid(req.session.fauchChat.sid,function(userId){
				chatSession.rm(req.session.fauchChat.sid,userId);
				req.session.fauchChat={};
			});//si on trouve :  on l'enleve sur le browser et la DB
			res.render('login.ejs',{message : {success : "successfully logged out"}});
		}
		catch (exception) {
			/* exception possibles :
			 * "no entry found"       : le cookie sur le navigateur de l'user etait périmé ou erroné  :dans ce cas on le delete quand meme
			 * "too much entry found" : plusieurs utilisateurs utilisent la même clé de session (murphy's law) :dans ce cas on le delete quand meme 
			 */
			req.session.fauchChat={};
			res.render('login.ejs',{message : {}});
			console.log("error  : "+exception.message);
		}
	}
	else {
		//Sinon, on ne fait rien et on charge le login	
		res.render('login.ejs',{message : {}});
	}	
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

	socket.on('login_session',function(item){chatManager.connect(item,clientSocket(),socket);});

	socket.on('log_out',function(){chatManager.logout(clientSocket(),socket)});
});

process.on('uncaughtException', function (error) {
   console.log(error.stack);
});
