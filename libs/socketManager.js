module.paths.push('/usr/local/lib/node_modules');
var chatMessage=require('./chatMessage.js');
var chatConnect=require('./chatConnect.js');
var chatLogin=require('./chatLogin.js');
/**
 * this is the file who groups all the middlewares linked to socket.io event 
 * 
 * @param : io : the socket.io lib defined in the main file app.js
 * 
 * */

exports = module.exports = function(io){
	var usernames = {};
	var numUsers = 0;
	
	/** 
	 * function that give all the users connected in the room 
	 * @param : namespace : namespace of the request(unused, only the default namespace is used)
	 * @return : res :  array of all actives sockets 
	 * */
	function clientSocket(namespace) {
			var res = [];
			var ns = io.of(namespace ||"/");    // the default namespace is "/"	
			if (ns) {
				for (var id in ns.connected) {
						res.push(ns.connected[id]);
				}
			}
			return res;
		}	
			
	io.use(function(socket, next){
	//unused middleware
	  next();
	});
	io.on('connection', function (socket) {
		/** @var uid : refers to user_id in SQL mode or uidNumber in LDAP mode : id of the user who is connected on the socket */
		socket.uid = undefined;
		/** @var username : refers to login in SQL mode or uid in LDAP mode : nickname of the user who is connected on the socket */
		socket.username = undefined;
		
		/**
		 * socket event 'new message'
		 * the socket send a new message to the server and ask to be shared to all the  people selected (via selecting a room to send the message)
		 * @param : data : JSON containing :
		 * 				txt : the content of the message (string),
		 *				rid : the id of the room targeted to send the message (int)
		 */
		socket.on('new message', function(data){chatMessage.newMessage(data,clientSocket(),socket);});


		/**
		 * socket event 'login_session'
		 * the socket send to the server connection data (the cookie sessionID and the user_id) and ask to be connected
		 * the sessionID and the user_id must match
		 * @param : item : JSON containing :
		 * 				uid : id of the user
		 *				cid : cookie sessionID
		 */
		socket.on('login_session',function(item){chatConnect.connect(item,clientSocket(),socket);});

		/**
		 * socket event 'log_out' DEPRECATED
		 * the socket send to the server the information that the user has been deconnected
		 */
		socket.on('log_out',function(){chatLogin.logout(clientSocket(),socket)});//DEPRECATED

		/**
		 * socket event 'login' DEPRECATED
		 * the socket send to the server connection data and ask to be connected
		 * @param : data : JSON containing :
		 * 				user : login of the user
		 *				key : password of the user
		 */
		socket.on('login',function(item){chatLogin.login(item,clientSocket(),socket)});//DEPRECATED
	});	

}
	
