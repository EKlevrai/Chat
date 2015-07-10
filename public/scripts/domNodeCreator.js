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
	rooms.forEach(function (entry){nodeRoom(entry,roomNode,messagePanel);});
	if(rooms.length)switchRoom(rooms[0].id,rooms[0].display_name);
}

/**
 * set the nodes (link button and chat area) that correspond to a room;
 * @param : room : the room we want to create the node from
 * @param : roomNode : the mother node of the link
 * @param : messagePanel : the mother node of the chat area
 * 
 * */
function nodeRoom(room,roomNode,messagePanel){
	var newRoomNode = document.createElement('div');
	//newRoomNode.innerHTML = room.display_name;
	newRoomNode.dataset.roomId = room.id;
	newRoomNode.id = "room-button"+room.id;
	newRoomNode.onclick = function(){switchRoom(room.id,room.display_name);};
	newRoomNode.className = "room button-chat-link" ;//main div of the roomnode is created, go for the image, the title, the preview and the alert(for new message)
	

	var roomImage=document.createElement('div');
	roomImage.className +="room-image";
	var image=document.createElement('img');
	image.src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNPygCSDF8PVmoNV2RMqvs-nGEKRqEBcbQzYAbQ31K742ibWVonQ";//image 64x64
	roomImage.appendChild(image);
	newRoomNode.appendChild(roomImage);
	

	
	var roomActivity=document.createElement('div');
	roomActivity.className +="room-activity";
	var roomLastActivity=document.createElement('div');
	roomLastActivity.appendChild(document.createTextNode("14:55"));
	roomLastActivity.className +="room-last-activity";
	roomActivity.appendChild(roomLastActivity);
	var roomNewMessage=document.createElement('div');
	var roomNewMessageCount=document.createElement('span')
	roomNewMessageCount.appendChild(document.createTextNode(10))
	roomNewMessageCount.className +="room-message-count";
	roomNewMessage.appendChild(roomNewMessageCount);
	roomActivity.appendChild(roomNewMessageCount);
	newRoomNode.appendChild(roomActivity);
	
	var roomTextInfo=document.createElement('div');
	roomTextInfo.className +="room-text";
	var roomTitle=document.createElement('div');
	roomTitle.appendChild(document.createTextNode("abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"+ " ("+room.display_name+")"));
	roomTitle.className +="room-title";
	roomTextInfo.appendChild(roomTitle);
	var roomPreview=document.createElement('div');
	var roomPreviewAuthor=document.createElement('span');
	roomPreviewAuthor.className +="room-preview-author";
	roomPreviewAuthor.appendChild(document.createTextNode("Olivier : "));	
	roomPreview.appendChild(roomPreviewAuthor);
	roomPreview.appendChild(document.createTextNode("dazdazdazd"));
	roomPreview.className +="room-preview";
	roomTextInfo.appendChild(roomPreview);
	newRoomNode.appendChild(roomTextInfo);
	roomNode.appendChild(newRoomNode);
	
	//NOW the chat area
	var newMessagePanel = document.createElement("div");
	var newMessagePanelList = document.createElement("ul");
	newMessagePanel.className += " chatArea";
	newMessagePanel.id= "room"+room.id;
	newMessagePanelList.className += " messages messageField";
	newMessagePanel.appendChild(newMessagePanelList)
	messagePanel.insertBefore(newMessagePanel, document.getElementById("inputMessage"));
}

