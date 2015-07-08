(function(){

	
	/**
	 * react to a wrong login/passwd/connexionID using socket, and send it to the socket;
	 * @param sckt : the socket of the "connected" user
	 */ 
	var logFail=function(sckt){
		if(sckt!=undefined)sckt.emit("logFail");
	};
	module.exports.logFailed = function(s) {return logFail(s); }

}());
