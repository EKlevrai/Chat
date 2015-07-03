/**
 * change the navbar dom when the user is connected to the server
 * @param username : the name of the newly connected user
 */
function navbarConnected(username){

	var logs = document.querySelectorAll(".menu-logs li:not(.divider)");
	
	console.log(logs);
	logs[0].removeChild(logs[0].firstChild);
	logs[0].appendChild(document.createTextNode("Welcome, "+username));

	logs[1].removeChild(logs[1].firstChild);

	var buttonDisconnect = document.createElement('button')
	buttonDisconnect.appendChild(document.createTextNode("disconnect"));
	buttonDisconnect.id = "disconnect";
	buttonDisconnect.onclick = function(){socket.emit("log_out");}
	
	logs[1].appendChild(buttonDisconnect);
	
}
/**
 * change the navbar dom when the user is disconnected from the server 
 */

function navbarDisconnected(){
	var logs = document.getElementById("login-info");
	while (logs.firstChild) {
		logs.removeChild(logs.firstChild);
	}
	var loginForm = document.createElement('div');
	loginForm.id = "login_form";
	var inputLogin = document.createElement('input');
	inputLogin.type="text";
	inputLogin.value="Olivier";
	inputLogin.name="form_login";
	inputLogin.id="form_name";
	inputLogin.maxlength=15;
	var inputPass = document.createElement('input');
	inputPass.type="password";
	inputPass.value="Olivier";
	inputPass.name="form_passw";
	inputPass.id="form_passw";
	inputPass.maxlength=15;
	var inputSend = document.createElement('button');
	inputSend.id="login_send";
	inputSend.appendChild(document.createTextNode("login"));
	inputSend.onclick=send_login;
	logs.appendChild(loginForm);
	loginForm.appendChild(document.createTextNode("login"));
	loginForm.appendChild(inputLogin);
	loginForm.appendChild(document.createTextNode("passw"));
	loginForm.appendChild(inputPass);
	loginForm.appendChild(inputSend);
}

/**
 * set the node of the room list
 * @param rooms the list of rooms
 */
function setRooms(rooms){
	var  roomNode = document.querySelector('#room-list>.rooms');
	var  messagePanel = document.getElementById("message-panel");
	// first we remove all child in the room-list
	while (roomNode.firstChild) {
		roomNode.removeChild(roomNode.firstChild);
	}
	while(messagePanel.children.length > 2){
		messagePanel.removeChild(messagePanel.children[1]);
	}
	rooms.forEach(
		function (entry){
			var newRoomNode = document.createElement('button');
			newRoomNode.innerHTML = entry.display_name;
			newRoomNode.dataset.roomId = entry.id;
			newRoomNode.onclick = function(){switchRoom(entry.id,entry.display_name);};
			newRoomNode.className += " room" ;			
			roomNode.appendChild(
					document.createElement('div')
					.appendChild(newRoomNode));
			var newMessagePanel = document.createElement("div");
			var newMessagePanelList = document.createElement("ul");
			newMessagePanel.className += " chatArea";
			newMessagePanel.id= "room"+entry.id;
			newMessagePanelList.className += " messages messageField";
			newMessagePanel.appendChild(newMessagePanelList)
			messagePanel.insertBefore(newMessagePanel, document.getElementById("inputMessage"));
	});
	if(rooms.length)switchRoom(rooms[0].id,rooms[0].display_name);
}

var COLORS = [
'#e21400', '#91580f', '#f8a700', '#f78b00',
'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];


function switchRoom(id,display_name){
	CURRENT_ROOM=id;
	rooms = document.querySelectorAll('.chatArea');
	for(var i = 0; i<rooms.length; i++){
		rooms[i].style.display='none';
	}
	document.getElementById("room"+id).style.display = 'initial';
	document.querySelector(".room-legend").innerHTML=display_name;
};

/**Adds a message element to the messages and scrolls to the bottom
 * @param msgData - The element to add as a message
 * 				  - username The name of message sender
 * 				  - message The content of the message
 * 				  - roomId The id of the room
 * @param options - te
 * 				- fade If the element should fade-in (default = true)
 * options.prepend - If the element should prepend
 * all other messages (default = false)
 */
function addMessageElement (msgData, options) {
	var messageDiv = '<li class="message" data-username="'
		+msgData.username
		+'">'
		+'<span style="color: '
		+getUsernameColor(msgData.username)
		+';"class="username">'
		+msgData.username
		+' : </span>'
		+'<span class="messageBody">'
		+msgData.message
		+'</span>'
		+'</li>';
	// Setup default options
	if (!options) {
	options = {};
	}
	if (typeof options.prepend === 'undefined') {
	options.prepend = false;
	}
	// Apply options
	if (options.prepend) {
		document.querySelector("#room"+msgData.roomId+">.messages").innerHTML=messageDiv +document.querySelector("#room"+msgData.roomId+">.messages").innerHTML ;
	} else {
		document.querySelector("#room"+msgData.roomId+">.messages").innerHTML=document.querySelector("#room"+msgData.roomId+">.messages").innerHTML +messageDiv;
	}
	if(msgData.roomId==CURRENT_ROOM)
	document.querySelector("#room"+msgData.roomId).scrollTop = document.querySelector("#room"+msgData.roomId).scrollHeight;
	
}


/**Init the Chat with the content recorded 
 * @param msgData - The element to add as a message history
 * 				  - username The name of message sender
 * 				  - message The content of the message
 * 				  - roomId The id of the room
 * @param options - te
 * 				- fade If the element should fade-in (default = true)
 * options.prepend - If the element should prepend
 * all other messages (default = false)
 */
function recoverHistory (data) {
		console.log(data);
	for(var i=0;i<data.messages.length;i++){
		addMessageElement({username : data.messages[i].username ,message : data.messages[i].message ,roomId : data.roomId.id });
	}
}

function getUsernameColor (username) {
	var hash = 0;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return COLORS[hash%COLORS.length];
	}
