module.paths.push('/usr/local/lib/node_modules');
var chatSQL=require('./chatSQL.js');
var chatLDAP=require('./chatLDAP.js');
var chatHistory=require('./chatHistory.js');
var chatConnectCallback=require('./chatConnectCallback.js');

/** @param sckt : the socket of the main user
* 				- uid : the user_id
* 				_username : the nickname
*/
(function() {
	/**
	 * react to the "login" socket.io event  annd using SQL
	 * @param data : the data of the login
	 * 			- user : the username of the login
	 * 			- key : the password of the login
	 * @param whatToDo : callback after login fct(connectInfo){}
	 * */
	var  logInSQL =  function(data,connectedUsers,sckt) {
		chatSQL.connectUser(data.user,data.key,whatToDo);
	};
	
		
	/**
	 * react to the "login" socket.io event  annd using LDAP
	 * @param data : the data of the login
	 * 			- user : the username of the login
	 * 			- key : the password of the login

	 * @param whatToDo : callback after login fct(connectInfo){}
	 * 
	 * */
	var  logInLDAP =  function(data,whatToDo) {		
		chatLDAP.connectUser(data.user,data.key,whatToDo);
	};
	
	/**
	 * react to the "logout" socket.io event
	 * @param connectedUsers : list of the sockets online
	 * @param sckt : socket to logout
	 */ 
	var logOut = function(connectedUsers,sckt){
		
		sckt.emit("log_out");
		console.log("log out "+sckt.username);
		delete sckt.uid;
		delete sckt.username;
		//forEach other user, sendthem the user left event TODO
	};


	module.exports.login = function(d,w) {
		if(global.config.datatype=='SQL')return logInSQL(d,w);
		if(global.config.datatype=='LDAP')return logInLDAP(d,w);
		 };
	module.exports.logout = function(connectedUsers,sckt) {return logOut(connectedUsers,sckt); };
}());
