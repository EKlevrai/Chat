module.paths.push('/usr/local/lib/node_modules');
var chatSQL=require('./chatSQL.js');
var chatLog=require('./chatLog.js');

/** @param sckt : the socket of the main user
* 				- uid : the user_id
* 				_username : the nickname
*/
(function() {

	/**
	 * react to the "new message" socket.io event 
	 * @param data : the data of the message
	 * 			- txt : the text of the message
	 * 			- rid the id of the room
	 * @param connectedUsers
	 * @param sckt
	 * */
	var  newMessage =  function(data,connectedUsers,sckt) {
		chatLog.postHistory(sckt.uid,data);	
		if(sckt.username){
			chatSQL.linkRoom(data.rid,
					function(peopleInRoom){
				connectedUsers.forEach(function(entry){
					if(entry.uid!=sckt.uid){
						peopleInRoom.forEach(function(e2){
							if(entry.uid == e2){
								entry.emit('new message', {
									username: sckt.username,
									message: data.txt,
									roomId : data.rid
								});
							}
						});
					}
				});
			});
		}
	};


	/**
	 * react to the "login" socket.io event 
	 * @param data : the data of the login
	 * 			- user : the username of the login
	 * 			- key : the password of the login
	 * @param connected_users : the list of sockets of differents users connected
	 * @param sckt : the socket of the main user
	 * 				- uid : the user_id
	 * 				_username : the nickname
	 * */
	var  logIn =  function(data,connectedUsers,sckt) {
		//on identifie TODO

		chatSQL.connectUser(data.user,data.key,
			function(connectInfo){
				if(connectInfo.isConnected){
					sckt.uid = connectInfo.uid
					sckt.username = connectInfo.username;
					// add the client's username to the global list
					chatSQL.detailRoom(sckt.uid,
						function(rooms){
						//log to the user its loggin and its rooms
						console.log("logged "+sckt.username);
						sckt.emit('login_success', {
							username : data.user,
							rooms : rooms
						});
						//lookup to the rooms and recover history
						rooms.forEach(function(entry){
							chatLog.getHistory(entry.id,function(msgs){
								msgs.forEach(function(e2,index2){
									chatLog.parseToMessage(e2,function(msg){										sckt.emit('recover_history',{
											roomId : entry,
											messages : [msg]
										});
									});
								});
						
							});
						});						
		
					});

				chatSQL.linkContact(sckt.uid,
					function(users){
						users.forEach(function(entry){
							connectedUsers.forEach(function(e2){
								if(entry!=sckt.uid && entry.uid==e2.uid)
									e2.emit('user joined', {
										username: sckt.username
									});
							});
						});
				});
					// echo globally (all clients) that a person has connected
			}
			else logFail(sckt);		

		});

	};
	var logFail=function(sckt){
		if(sckt!=undefined)sckt.emit("logFail");
	};
	
	var logOut = function(connectedUsers,sckt){
		
		sckt.emit("log_out");
		console.log("log out "+sckt.username);
		delete sckt.uid;
		delete sckt.username;
		//forEach other user, sendthem the user left event TODO
	};


	module.exports.newMessage = function(data,connectedUsers,sckt) {return newMessage(data,connectedUsers,sckt); }
	module.exports.login = function(data,connectedUsers,sckt) {return logIn(data,connectedUsers,sckt); }
	module.exports.logout = function(connectedUsers,sckt) {return logOut(connectedUsers,sckt); }
}());
