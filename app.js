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

//ici commence le code propre

var chatMessage=require(global.config.paths.libs+'/chatMessage.js');
var chatConnect=require(global.config.paths.libs+'/chatConnect.js');
var chatLogin=require(global.config.paths.libs+'/chatLogin.js');
var chatSQL=require(global.config.paths.libs+'/chatSQL.js');
var chatSession=require(global.config.paths.libs+'/sessionID.js');
var chatSession=require(global.config.paths.libs+'/sessionID.js');
var socketManager = require(global.config.paths.libs+'/socketManager.js')(io)



//all environments
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
//app.use(express.methodOverride());
app.use(express.static(__dirname + global.config.paths.frontendFiles));

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
	chatLogin.login({user : req.body.user,key :req.body.pass},
	function(connectInfo){
		if(connectInfo.isConnected){
		var new_SID= Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 45);
		chatSession.add(new_SID,connectInfo.uid,function(){
			req.session.fauchChat={sid : new_SID};		
			res.redirect("/chat");
		});
		}
		else{res.render('login.ejs',{message : { error : connectInfo.error }});}
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



/** Connexion avec le client */



process.on('uncaughtException', function (error) {
   console.log("c'est une belle errreur" +error.stack + error.toString());
});
