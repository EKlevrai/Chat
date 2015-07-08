module.paths.push('/usr/local/lib/node_modules');
var chatSQL=require('./chatSQL.js');
var chatLDAP=require('./chatLDAP.js');
var chatHistory=require('./chatHistory.js');
var chatSession=require('./sessionID.js');
var chatError=require('./chatError.js');
var chatConnectCallback=require('./chatConnectCallback.js');

/** @param sckt : the socket of the main user
* 				- uid : the user_id
* 				_username : the nickname
*/
(function() {
	/**
	 * react to the "connect" socket.io event [via connectionID] using SQL datastorage for users
	 * @param data : the data of the login
	 * 			- userID : the id of the user
	 * 			- connectionID : the id of the connection
	 * @param connected_users : the list of sockets of differents users connected
	 * @param sckt : the socket of the main user
	 * 				- uid : the user_id
	 * 				_username : the nickname
	 * */
	var  connectSQL =  function(data,connectedUsers,sckt) {
		chatSession.getUid(data.cid,function(userId){
			if (userId==data.uid){//normalement c'est le cas : la connection est valide :: on charge les info et on connecte
				chatSQL.uInfo(userId,['login'],function(args){//on charge les dernieres data manquantes à la création du connectInfo 
					connectInfo = {	isConnected : true,
								uid : data.uid,
								username : args.login
							}
					chatConnectCallback.connect(connectedUsers,connectInfo,sckt);
				});
			}
			else chatError.logFail(sckt);		
		});
	};
	
	/**
	 * react to the "login" socket.io event [via connectionID] using SQL datastorage for users
	 * @param data : the data of the login
	 * 			- userID : the id of the user
	 * 			- connectionID : the id of the connection
	 * @param connected_users : the list of sockets of differents users connected
	 * @param sckt : the socket of the main user
	 * 				- uid : the user_id
	 * 				_username : the nickname
	 * */
	var  connectLDAP =  function(data,connectedUsers,sckt) {
		chatSession.getUid(data.cid,function(userId){
			if (userId==data.uid){//normalement c'est le cas : la connection est valide :: on charge les info et on connecte
				chatLDAP.uInfo({"uidNumber" : userId},['login'],function(args){//on charge les dernieres data manquantes à la création du connectInfo 
					connectInfo = {	isConnected : true,
								uid : data.uid,
								username : args.login
							}
					chatConnectCallback.recover(connectedUsers,connectInfo,sckt);
				});
			}
			else chatError.logFail(sckt);		
		});
	};
	
	
	module.exports.connect = function(data,connectedUsers,sckt) {if(global.datastore=="SQL")return connectSQL(data,connectedUsers,sckt);
																else return connectLDAP(data,connectedUsers,sckt);}

}());
