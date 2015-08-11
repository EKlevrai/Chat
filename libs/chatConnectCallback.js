module.paths.push('/usr/local/lib/node_modules');
var chatSQL=require('./chatSQL.js');
var chatLDAP=require('./chatLDAP.js');
var chatHistory=require('./chatHistory.js');

/**
 * 
 * This module is to "centerify" the callback function to do when the user connect itself, by socket.io event with SQL or LDAP, or sessionID
 * 																OR, by a POST/GET request , and with the same mode
 * 
 * 
 * 
*/
(function() {
	/**
	 * react to a correct "login" or "connect" socket.io event
	 * so get the architecture of the rooms and its content before sending them via socket
	 * @param connectedUsers : the list of sockets of differents users connected
	 * @param connectInfo : a json info with
	 * 						- isConnected : boolean to check first
	 * 						- uid : userId (int in SQL mode, string in LDAP mode)
	 * 						- username : nickname
	 * @param sckt : the socket of the main user
	 * 				- uid : the user_id
	 * 				_username : the nickname
	 * */
	var  recoverSQL =  function(connectedUsers,connectInfo,sckt){
		if(connectInfo.isConnected){
			sckt.uid = connectInfo.uid
			sckt.username = connectInfo.username;
			// add the client's username to the global list
			chatSQL.linkPeople(sckt.uid,function(rid){
				chatSQL.detailRoom(rid,function(rooms){
					recover(sckt,rooms,connectInfo);
				});				
			});
			announceLogged(sckt,connectedUsers);// echo globally (all clients) that a person has connected
		}
		else chatError.logFail(sckt);		
	};
	/**
	 * react to a correct "login" or "connect" socket.io event using LDAP
	 * so get the architecture of the rooms and its content before sending them via socket
	 * @param connectedUsers : the list of sockets of differents users connected
	 * @param connectInfo : a json info with
	 * 						- isConnected : boolean to check first
	 * 						- uid : userId (int in SQL mode, string in LDAP mode)
	 * 						- username : nickname
	 * @param sckt : the socket of the main user
	 * 				- uid : the user_id
	 * 				_username : the nickname
	 * */
	var  recoverLDAP =  function(connectedUsers,connectInfo,sckt){
		if(connectInfo.isConnected){
			sckt.uid = connectInfo.uid
			sckt.username = connectInfo.username;
			// add the client's username to the global list
			chatLDAP.linkPeople(sckt.username,function(rid){
				chatLDAP.detailRoom(rid,function(rooms){
					recover(sckt,rooms,connectInfo);
				});				
			});
			announceLogged(sckt,connectedUsers);// echo globally (all clients) that a person has connected
		}
		else chatError.logFail(sckt);		
	};
	/**
	 * 2nd part of recovering historic messages.
	 * This part is both for SQL and LDAP datatype, because the datas ares stocked in MYSQL, regarding the type of storage used by users
	 * 
	 * 
	 * 
	 */
	var recover = function(sckt,rooms,connectInfo){
		//log to the user its loggin and its rooms
		sckt.emit('login_success', {
			username : connectInfo.username,
			rooms : rooms
		});
		//lookup to the rooms and recover history
		rooms.forEach(function(entry){
			//we send the number of unread message
			chatHistory.countUnRead(sckt.uid,entry.id,function(count){
				sckt.emit('unread_messages',{
					roomId : entry,
					unread : count
				});
			});
			chatHistory.getHistory(entry.id,function(msgs){
				msgs.forEach(function(e2,index2){
					chatHistory.parseToMessage(e2,function(msg){										
						sckt.emit('recover_history',{
							roomId : entry,
							messages : [msg]
						});
					});
				});
			});
		});	

	};
	/**
	 * Anounce globally to all connected users that the newly logged user is logged;
	 * @param sckt : the socket of the newly logged user
	 * @param connectedUsers : the sockets of the allready connected users
	 */ 
	var announceLogged=function(sckt,connectedUsers){
		if(global.config.datatype=="SQL"){
			chatSQL.linkContact(sckt.uid,function(u){announceLoggedCallback(u,sckt,connectedUsers);});
		}
		else{
			chatLDAP.linkContact(sckt.username,function(u){announceLoggedCallback(u,sckt,connectedUsers);});
		}
	};
	/**
	 * sort and emit if concerned that the newly logged user is connected
	 * @param users : the uid of the concerned users
	 * @param sckt : the socket of the newly logged user
	 * @param connectedUsers : the sockets of the allready connected users
	 */ 
	var announceLoggedCallback =function(users,sckt,connectedUsers){
		users.forEach(function(entry){
			connectedUsers.forEach(function(e2){
				if(entry!=sckt.username && entry.username==e2.username)
					e2.emit('user joined', {
						username: sckt.username
					});
			});
		});
	};







/* HERE BEGINS THE CALLBACKS FOR THE HTTP REQUESTS */
//NOTHING
	

	module.exports.recoverCallback = function(cu,ci,s) {
		if (global.config.datatype=='SQL')return recoverSQL(cu,ci,s);
		if (global.config.datatype=='LDAP')return recoverLDAP(cu,ci,s);
	};
	module.exports.announceLogged = function(s,cu) {return announceLogged(s,cu); };
	

}());
