//the room the user is currently writing
var currentRoom;

// Keyboard events
window.onkeydown=function (event) {
// Auto-focus the current input when a key is typed
if (!(event.ctrlKey || event.metaKey || event.altKey)) {
 try {
    if(CURRENT_ROOM) {
	document.getElementById('inputMessage').focus();
	}
 }catch(e){

 }
}
// When the client hits ENTER on their keyboard
if (event.which === 13) {
if(CURRENT_ROOM)sendMessage();
}
};
// Focus input when clicking on the message input's border
document.getElementById('inputMessage').click(function () {
if(CURRENT_ROOM)document.getElementById('inputMessage').focus();
});
