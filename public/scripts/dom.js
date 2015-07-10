/**
 * change the navbar dom when the user is connected to the server
 * @param username : the name of the newly connected user
 */
function navbarConnected(username){

	var logs = document.querySelectorAll(".menu-logs li:not(.divider)");
	
	console.log(logs);
	logs[0].firstChild.innerHTML="";
	logs[0].firstChild.appendChild(document.createTextNode("Welcome, "+username));

	logs[1].firstChild.onclick = function(){socket.emit("log_out");};
		
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


var COLORS = [
'#e21400', '#91580f', '#f8a700', '#f78b00',
'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];


function switchRoom(id,display_name){
	
	if (typeof CURRENT_ROOM !== 'undefined') {	
		document.getElementById("room-button"+CURRENT_ROOM).className = "room button-chat-link"; //we remove the room-selected class
	}
	
	CURRENT_ROOM=id;
	document.getElementById("room-button"+CURRENT_ROOM).className += " room-selected"; //we add the room-selected class
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
