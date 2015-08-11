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
	var logs = document.querySelectorAll(".menu-logs li:not(.divider)");
	
	console.log(logs);
	logs[0].firstChild.innerHTML="";
	logs[0].firstChild.appendChild(document.createTextNode("Disconnected, please reconnect"));
}



function switchRoom(id,display_name){
	
	if (typeof CURRENT_ROOM !== 'undefined') {	
		document.getElementById("room-button"+CURRENT_ROOM).className = "room side-bar-link"; //we remove the room-selected class
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

/**
 * Adds a message element to the messages and scrolls to the bottom
 * actualise also the new message count to increase it 
 * and erase the last message preview
 * @param msgData - The element to add as a message
 * 				  - username The name of message sender
 * 				  - message The content of the message
 * 				  - roomId The id of the room
 * @param options - te
 * 				 - updateMessageCount : true if it should actualize the number of unread message (default), false if not (ie the user wrote it)
 * 				- fade If the element should fade-in (default = true)
 * options.prepend - If the element should prepend
 * all other messages (default = false)
 */
function addMessageElement (msgData, options) {
	if(!options){options={ updateMessageCount : true};}
	addMessageChatArea(msgData, options);
	updateLastMessagePreview(msgData, options);
	if(options.updateMessageCount)updateNewMessageCount(msgData, options);
}
/**
 * Add the div in the chatArea
 */ 
function addMessageChatArea(msgData, options){
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
/**
 * check if there is a new message number, and increment if its the case.
 * If not it creates the new message number and set it at one.
 * 		
 * 
 * 
 **/ 	
function updateNewMessageCount(msgData, options){
	if(!options){options = DEFAULT_OPTIONS;}
	if(options.setMessageCount){
		unread_messages[msgData.roomId]=options.setMessageCount;
		document.querySelector("#room-button"+msgData.roomId+" .room-message-count").innerHTML=unread_messages[msgData.roomId];
	}
	else{
		if(options.setMessageCount==0){}
		else{
			if(typeof unread_messages!="undefined" && typeof unread_messages[msgData.roomId]!="undefined" && unread_messages[msgData.roomId]>0){
				unread_messages[msgData.roomId]++;
				document.querySelector("#room-button"+msgData.roomId+" .room-message-count").innerHTML=unread_messages[msgData.roomId];
			}
			else{//there is no new message : we set the number to 1 and create the span
				unread_messages[msgData.roomId]=1;
				var span=document.createElement('span');
				span.className +="room-message-count";
				span.appendChild(document.createTextNode(unread_messages[msgData.roomId]));
				document.querySelector("#room-button"+msgData.roomId+" >.element-activity").appendChild(span);			
			}
		}
	}
}
function updateLastMessagePreview(msgData, options){
	var preview = document.querySelector("#room-button"+msgData.roomId+" .element-preview");			
	while (preview.firstChild){
			preview.removeChild(preview.firstChild);
	}
	
	var span=document.createElement('span');
	span.className +="element-preview-author";
	span.appendChild(document.createTextNode(msgData.username+" : "));
	preview.appendChild(span);
	preview.appendChild(document.createTextNode(msgData.message))
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
	for(var i=0;i<data.messages.length;i++){
		addMessageElement({username : data.messages[i].username ,message : data.messages[i].message ,roomId : data.roomId.id },{updateMessageCount : false});
	}
}

function getUsernameColor (username) {
	var hash = 0;
	for (i = 0; i < username.length; i++) {
		char = username.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return "hsl("+hash%360+",60%,50%)";
}
