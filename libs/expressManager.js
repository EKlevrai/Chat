module.paths.push('/usr/local/lib/node_modules');



var chatMessage=require('./chatMessage.js');
var chatConnect=require('./chatConnect.js');
var chatLogin=require('./chatLogin.js');
var chatSession=require('./sessionID.js');
/**
 * this is the file who groups all the middlewares linked to socket.io event 
 * 
 * @param : io : the socket.io lib defined in the main file app.js
 * 
 * */
exports = module.exports = function(app){
	
	app.use(function(req, res, next){
		if (req.originalUrl!="/login" && req.originalUrl!="/logout"){//something else than public page(who doesnt need to connect)
			if (req.session.rSAS && req.session.rSAS.sid){//check if there is a cookie
				chatSession.getUid(req.session.rSAS.sid,function(userId){//and if it match to a user
					if(userId){
						req.data={
							connectionID : req.session.rSAS.sid,//ATTENTION, à remplacer par ConnectionID
							userID : userId
						};
						next();
					}
					else{res.redirect("/login");}
				});
			}
			else {res.redirect("/login");}
		}
		else{
			next();
		}
	});
	
	
	app.get("/login",function(req, res, next){
		if (req.session.rSAS && req.session.rSAS.sid){ 
			//Si, sur le cookie, on trouve un id de session, on va le comparer à ceux qui sont actifs 
			try{chatSession.getUid(req.session.rSAS.sid,function(userId){res.redirect('/chat');});//si on trouve :  on redirige vers le chat
			}
			catch (exception) {
				/* 
				 * possibles exception:
				 * "no entry found"       : the cookie on the browser has expired or do not match 
				 * "too much entry found" : more than one user use the same key (murphy's law)  
				 */
				 logMyErrors(exception)
				res.render('login.ejs',{message : {}});
			}
		}
		else {
			//if we find no cookies in the browser, we send to the login
			res.render('login.ejs',{message : {}});
		}	
	});

	app.post("/login",function(req,res,next){
		console.log(req)
		console.log("")
		console.log("")
		console.log("")
		console.log("")
		console.log("")
		console.log("")
		chatLogin.login({user : req.body.user,key :req.body.pass},
		function(connectInfo){
			if(connectInfo.isConnected){
			var new_SID= Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 45);
			chatSession.add(new_SID,connectInfo.uid,function(){
				req.session.rSAS={sid : new_SID};		
				res.redirect("/");
			});
			}
			else{res.render('login.ejs',{message : { error : connectInfo.error }});}
		});
	});

	app.get("/logout",function(req, res, next){
		if (req.session.rSAS && req.session.rSAS.sid){ 
			//Si, sur le cookie, on trouve un id de session, on va le comparer à ceux qui sont actifs 	
			try{chatSession.getUid(req.session.rSAS.sid,function(userId){
					chatSession.rm(req.session.rSAS.sid,userId);
					delete req.session.rSAS.sid;
				});//si on trouve :  on l'enleve sur le browser et la DB
				res.render('login.ejs',{message : {success : "successfully logged out"}});
			}
			catch (exception) {
				/* exception possibles :
				 * "no entry found"       : le cookie sur le navigateur de l'user etait périmé ou erroné  :dans ce cas on le delete quand meme
				 * "too much entry found" : plusieurs utilisateurs utilisent la même clé de session (murphy's law) :dans ce cas on le delete quand meme 
				 */
				req.session.rSAS={};
				res.render('login.ejs',{message : {}});
				console.log("error  : "+exception.message);
			}
		}
		else {
			//Sinon, on ne fait rien et on charge le login	
			res.render('login.ejs',{message : {}});
		}	
	});

	app.get("/",function(req, res, next){
		res.render('chat.ejs',req.data);
	});


};
	

