module.paths.push('/usr/local/lib/node_modules');
var chatSQL=require('./chatSQL.js');
var chatHistory=require('./chatHistory.js');
var chatSession=require('./sessionID.js');


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
		chatHistory.postHistory(sckt.uid,data);	
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
	module.exports.newMessage = function(data,connectedUsers,sckt) {return newMessage(data,connectedUsers,sckt); }
}());
