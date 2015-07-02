/**
 * New node file
 */
var socket = io();

//Sets the client's username
document.getElementById("login_send").onclick=send_login;
function send_login(){
	socket.emit('login', {user : document.getElementById("form_name").value, key :document.getElementById("form_passw").value});
}



//Sends a chat message
function sendMessage () {
	if(CURRENT_ROOM){
		var message = {
				txt : document.getElementById("inputMessage").value,
				rid : CURRENT_ROOM
		};
//		TODO XSS ATTACK

//		if there is a non-empty message and a socket connection
		if (message && message.txt!="" && connected) {
			document.getElementById("inputMessage").value="";
			addMessageElement({
				username: 'Me',
				message: message.txt,
				roomId : CURRENT_ROOM
			});
//			tell server to execute 'new message' and send along one parameter
			socket.emit('new message', message);
		}
	}
}


//Socket events

//Whenever the server emits 'login', log the login message
socket.on('login_success', function (data) {
	var message = "Welcome to Socket.IO Chat � ";
	connected = true;
	navbarConnected(data.username);
	setRooms(data.rooms);
});/*
socket.on('disconnect', function(){
	console.log("disc");
	navbarDisconnected();
	setRooms([{display_name : "please connect", id : 0}]);
	CURRENT_ROOM = null;
	var  roomNode = document.querySelector('#room-list>.rooms');
	while (roomNode.firstChild) {
		roomNode.removeChild(roomNode.firstChild);
	}
});*/
socket.on('log_out', function(){
	navbarDisconnected();
	setRooms([{display_name : "please connect", id : 0}]);
	CURRENT_ROOM = null;
	var  roomNode = document.querySelector('#room-list>.rooms');
	while (roomNode.firstChild) {
		roomNode.removeChild(roomNode.firstChild);
	}
});

//Whenever the server emits 'new message', update the chat body
socket.on('new message', function (data) {
	addMessageElement(data);
});
//When the server give all previous history, init the chat with message
socket.on('recover_history', function (data) {
	recoverHistory(data);
});
//Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', function (data) {
	log(data.username + ' joined');
});
//Whenever the server emits 'user left', log it in the chat body
socket.on('user left', function (data) {
	log(data.username + ' left');
	removeChatTyping(data);
});