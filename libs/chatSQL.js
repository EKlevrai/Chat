module.paths.push('/usr/local/lib/node_modules');
var mysql = require('mysql');

(function() {
/**
 * log in, reponse true or false
 * log out(forcé par serveur, ou demandé coté client)
 * ajout d'une personne à une discussion*/
	
	
	/**
	 * log the user and return the usefull data
	 * @param username: the login entered client-side
	 * @param key: the password entered client-side
	 * @param whatToDo : the callback function to execute after the response fct(connect)
	 * @return the connection data with
	 * 			-isConnected :  the boolean saying if the connection was successfull
	 * 			-uid : the user_id in the DB
	 * 			-username : the user's name
	 * 			
	 */
	var connectUser = function(username,key,whatToDo){
		var connectInfo={};
		var mySQLConnection = mysql.createConnection({
			host     : global.mysql_host,
			user     : global.mysql_user,
			password : global.mysql_password,
			database : global.mysql_database
		});
		/*On genere la query à partir des infos*/
		mySQLConnection.query(''
			+'SELECT * FROM FauchChatUser '
			+'WHERE `login` = ? AND `password` = ? '
			+'ORDER BY id DESC LIMIT 1;',[username,key],
			function(err, rows, fields) {
				mySQLConnection.end();
				if (err) throw err;
				if(rows.length==1){
				//we found a correct entry in the db which is unique(1row only),and got correct login and password
				//Consequence we connect
					connectInfo = {	isConnected : true,
								uid : rows[0].id,
								username : rows[0].login
							};
				}
				else connectInfo = { isConnected : false }
				whatToDo(connectInfo);
			});

	}
	
	/**
	 * list the users who are linked to a room
	 * @param room : the id of the room
	 * @param whatToDo : the callback function after we got the ids fct([id_users])
	 * @return : a list with all user Ids of the users linked to this room
	 */
	var peopleInRoom =  function(room,whatToDo) {
		var users_id=[];
		var mySQLConnection = mysql.createConnection({
			host     : global.mysql_host,
			user     : global.mysql_user,
			password : global.mysql_password,
			database : global.mysql_database
		});
		mySQLConnection.query(''
				+'SELECT `id_user` FROM `FauchChatInRoom` '
				+'WHERE `id_room` IN (?) ;',[room],
				function(err, rows, fields) {
					mySQLConnection.end();
					if (err) throw err;
					rows.forEach(function(entry){users_id.push(entry.id_user)});
					whatToDo(users_id);
				});
	}
	/**
	 * list the rooms who are linked to a user
	 * @param uid : the id of the user
	 * @param whatTodo : the callback function after we got the list of ids fct([id_rooms])
	 * @return : a list with all user Ids of the users linked to this room
	 */
	var  roomForPeople =  function(uid,whatToDo) {
		var rooms_id=[];
		var mySQLConnection = mysql.createConnection({
			host     : global.mysql_host,
			user     : global.mysql_user,
			password : global.mysql_password,
			database : global.mysql_database
		});
		mySQLConnection.query(''
				+'SELECT `id_room` FROM `FauchChatInRoom` '
				+'WHERE `id_user` IN (?) ;',[uid],
				function(err, rows, fields) {
					mySQLConnection.end();
					if (err) throw err;
					rows.forEach(function(entry){rooms_id.push(entry.id_room)});
					whatToDo(rooms_id);
				});
	};
	/** get all details on the rooms the user is linked to
	 * @param uid : the id of the user
	 * @param whatTodo : the callback function after we got the list of ids fct([{rooms_id,rooms_name, rooms_admin}])
	 */
	var roomDetailed=  function(uid,whatToDo) {
		roomForPeople(uid,function(rooms_id){
			var rooms=[];
			var mySQLConnection = mysql.createConnection({
				host     : global.mysql_host,
				user     : global.mysql_user,
				password : global.mysql_password,
				database : global.mysql_database
			});
			mySQLConnection.query(''
				+'SELECT `id`,`display_name`,`id_admin` FROM `FauchChatRoom` '
				+'WHERE `id` IN (?) ;',[rooms_id],
				function(err, rows, fields) {
					mySQLConnection.end();
					if (err) throw err;
					rows.forEach(function(entry){rooms.push(entry);});
					whatToDo(rooms);
				}
			);				
		});
	};
	
	
	
	/**
	 * list the users who are in contact to others people (commons rooms)
	 * @param uid : id of the user 
	 * @param whatToDo : callback function fct ([users_ids])
	 */
	var peopleForPeople = function(uid,whatToDo){
		roomForPeople(uid,function(rooms){
			peopleInRoom(rooms,function(users){
				//console.log(users);
				whatToDo(users);
			});
		})
		
	};
	
	/**
	 * give all information of a user from its id_user
	 * @param uid :  the id of the user
	 * @param args : array of args we ask
	 * @param whatToDo callback function fct({arg1 : r1 ,...})
	 */
	 var uInfo = function(uid,args,whatToDo){
		var mySQLConnection = mysql.createConnection({
			host     : global.mysql_host,
			user     : global.mysql_user,
			password : global.mysql_password,
			database : global.mysql_database
		});
		/*On genere la query à partir des infos*/
		mySQLConnection.query(''
			+'SELECT '
			+' '+args.join()
			+' FROM FauchChatUser '
			+'WHERE id = ? '	
			+'ORDER BY id DESC LIMIT 1;',[uid],
			function(err, rows, fields) {
				mySQLConnection.end();
				if (err) throw err;
				if(rows.length==1){
				//we found a correct entry in the db which is unique(1row only),
					whatToDo(rows[0]);
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
	
	module.exports.connectUser = function(uname,k,w) {return connectUser(uname,k,w); }
	module.exports.linkRoom = function(room,whatToDo) {return peopleInRoom(room,whatToDo); }
	module.exports.detailRoom = function(uid,whatToDo) {return roomDetailed(uid,whatToDo); }
	module.exports.linkPeople = function(uid,whatToDo) {return roomForPeople(uid,whatToDo); }
	module.exports.linkContact = function(uid,whatToDo) {return peopleForPeople(uid,whatToDo); }
	module.exports.inCommon = function(uid1,uid2) {return isInCommon(uid1,uid2); }
	module.exports.uInfo = function(uid,a,w) {return uInfo(uid,a,w); }
}());
