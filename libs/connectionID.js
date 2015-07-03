module.paths.push('/usr/local/lib/node_modules');

var mysql = require('mysql');

/** connexion ID :  can be usefull to
 * get a user from a Cid [do it in the socket connection]
 * add a Cid to the DB and link it to a user [do it in the get("/chat") middleware]
 * flush all old Sid (checked via crontab)
 * kill all Sid except the trigger
 * 
*/
(function() {
	/**
	 * check in the DB the UserId which is associated with the SessionId and launch a callback with it
	 * @param sid : the sessionId we search userId matched
	 * @param whatToDo : the callback to do with the userId fct(uid) 
	 * */
	var getUid = function(sid,whatToDo){
		var mySQLConnection = mysql.createConnection({
			host     : global.mysql_host,
			user     : global.mysql_user,
			password : global.mysql_password,
			database : global.mysql_database
		});
		//query our trouver les sessions en fonction de l'id
		mySQLConnection.query(''
			+'SELECT id_user FROM FauchChatSessionId '
			+'WHERE `session_id` = ? ;',[sid],
			function(err, rows, fields) {
				mySQLConnection.end();
				if (err) throw err;
				if(rows.length==1){
				//we found a correct entry in the db which is unique(1row only),and where user and session_id match
				//Consequence we do what to do
					whatToDo(rows[0].is_user);
				}
				else {if(rows.length<1){
						throw "no entry found";
					}
					else{
						throw "too much entry found";
					}
				}
			});
	};
	/**
	 * add in the DB the session who matches a userID and a sessionID
	 * @param sid : the sessionId we want to match with userId
	 * @param uid : the userId we want to match with sessionId
	 * */ 
	var add = function (sid, uid){
			var mySQLConnection = mysql.createConnection({
			host     : global.mysql_host,
			user     : global.mysql_user,
			password : global.mysql_password,
			database : global.mysql_database
		});
		//query our trouver les sessions en fonction de l'id
		mySQLConnection.query(''
			+' INSERT INTO `FauchChatSessionId`(`id_user`,`session_id`) '
			+' VALUES(?,?);',[uid,sid],
			function(err, rows, fields) {
				mySQLConnection.end();
				if (err) throw err;
			});
		};
	
	//var check = function(){}
	


	module.exports.add = function(s,u) {return add(s,u); }
	module.exports.getUid = function(s,w) {return getUid(s,w); }
}());
