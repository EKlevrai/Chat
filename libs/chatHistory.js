module.paths.push('/usr/local/lib/node_modules');
var mysql = require('mysql');
var chatLDAP=require('./chatLDAP.js');
var chatSQL=require('./chatSQL.js');
(function() {

	/**
	 * log the message in the DB
	 * @param user_id: the id of the user who sent the message
	 * @param data : JSON object containing 
	 * @param data.txt : the content of the message
	 * @param data.rid : the id of the room the message has been sent to
	 * 			
	 */
	var postHistory = function(user_id,data){
		var mySQLConnection = mysql.createConnection({
			host     : global.config.SQL.host,
			user     : global.config.SQL.user,
			password : global.config.SQL.password,
			database : global.config.SQL.database
		});
		handleOverFlowHistory(mySQLConnection,data);

		/*On genere la query à partir des infos*/
		mySQLConnection.query(''
			+'INSERT INTO '+global.config.SQL.prefix+'History '
			+'(post_date,post_content,id_room,post_user) '
			+'VALUES (?,?,?,?);',
			[new Date().getTime().toString(),data.txt,data.rid ,user_id],
			function(err) {
				mySQLConnection.end();
				if (err) throw err;
		});
	};
	/*
	 *check in the DB if the room has XX or more message stocked, and 
	 * if it is the case, delete the most ancients messages
	 * 
	 */
	var handleOverFlowHistory = function(mySQLConnection,data){
		mySQLConnection.query(''
		+'SELECT count(*) AS nombre_msg FROM FauchChatHistory '
		+'WHERE id_room=? ;',[data.rid],function(err,rows){

			if (err) throw err;
			if (rows[0].nombre_msg>=global.config.datastorage.maxmessage){
				mySQLConnection.query(''
				+'DELETE FROM FauchChatHistory '
				+'WHERE id_room=? '
				+'ORDER BY post_date ASC limit ?;'
					,[data.rid,rows[0].nombre_msg-global.config.datastorage.maxmessage+1]
					,function(err2){
						if (err2) throw err2;
				});
			}
		});
	};
	/**
	 * request the history of the last messages logged in the room, and execute a callback to do with them
	 * @param room_id :the id of the room where the messages are requested
	 * @param whatToDo : the callback function to do with the datas fct(msgs)
	 */
	var getHistory = function(room_id,whatTodo){
		var mySQLConnection = mysql.createConnection({
			host     : global.config.SQL.host,
			user     : global.config.SQL.user,
			password : global.config.SQL.password,
			database : global.config.SQL.database
		});
		mySQLConnection.query(''
		+'SELECT post_date,post_user,post_content FROM '+global.config.SQL.prefix+'History '
		+'WHERE id_room=? '
		+'ORDER BY post_date ASC;',[room_id],function(err,rows){
			if (err) throw err;
			whatTodo(rows);
			mySQLConnection.end();
		});
	};
	
	/**
	 * parse a entry to a readeable message(with username)
	 * @param msg : a msg in form of a object 
	 * @param 			{post_date: date(String),
	 * @param			 post_user: int,
	 * @param			 post_content:string}
	 * @param whatToDo : callback that is triggered when the mySQL query has ended. fct(msg)
	 * @return a msg useabale in chat in form of a object
	 * @return 			{post_date: date(String),
	 * @return			 post_user: int}
	 */
	var parseToMessage = function(post,whatToDo){
		if(global.config.datatype=='SQL'){
			parseToMessageSQL(post,whatToDo);
		}
		else{
			parseToMessageLDAP(post,whatToDo);
		}
	};

	var parseToMessageSQL = function(post,whatToDo){
		chatSQL.uInfo(post.user,['login'],function(a){
			var msg={username: a.login,
					message: post.post_content
				}
			whatToDo(msg);

		});
	};
	
	var parseToMessageLDAP = function(post,whatToDo){
		chatLDAP.uInfo({"uidNumber":post.post_user},['login'],function(a){
			var msg={username: a.login,
					message: post.post_content
				}
			whatToDo(msg);
		});
	};


	/**
	 * Mark the chatroom as read at the date moment
	 * @param :  uid :  the userId number
	 * @param : rid : the roomId numer
	 * @param : date : the date of the new "last seen" value
	 * 
	 */
	var markAsRead = function(uid,rid,date){
		var mySQLConnection = mysql.createConnection({
			host     : global.config.SQL.host,
			user     : global.config.SQL.user,
			password : global.config.SQL.password,
			database : global.config.SQL.database
		});
		mySQLConnection.query(''
			+'UPDATE '+global.config.SQL.prefix+'InRoom '
			+'SET last_seen=? '
			+'WHERE id_user=? '
			+'AND id_room=?;',
			[date,uid,rid],
			function(err) {
				mySQLConnection.end();
				if (err) throw err;
		});
	};
	
	/**
	 * Count the number of messages since the last seen by the user
	 * @param : uid : the userId number of the user we want to know how many message he missed
	 * @param : rid :  the roomId number of the room we want to know how many messages the user missed
	 * @param : whatToDo :  the callback to execute when we get the count, fct(count)
	 * */
	var countUnRead = function(uid,rid,whatTodo){
		var mySQLConnection = mysql.createConnection({
			host     : global.config.SQL.host,
			user     : global.config.SQL.user,
			password : global.config.SQL.password,
			database : global.config.SQL.database
		});
		//first we get the "last seen" value for the user and room specified
		mySQLConnection.query(''
		+'SELECT last_seen '
		+'FROM '+global.config.SQL.prefix+'InRoom '
		+'WHERE id_room=? '
		+'AND id_user=?;',[rid,uid],function(err,rows){
			if (err) throw err;
			//then, with the last seen value, we count the post who has occured after the last seen
			mySQLConnection.query(''
			+'SELECT count(*) AS number '
			+'FROM '+global.config.SQL.prefix+'History '
			+'WHERE id_room=? '
			+'AND post_date > ? ;',[rid,rows[0]],function(err2,rows2){
				if (err2) throw err2;
				whatTodo(rows2[0].number);
				mySQLConnection.end();
			});
		
		});
	};

	module.exports.postHistory = function(user_id,room_id,message) {return postHistory(user_id,room_id,message); }
	module.exports.getHistory = function(room_id,whatToDo) {return getHistory(room_id,whatToDo); }
	module.exports.parseToMessage = function(p,w) {return parseToMessage(p,w); }
	module.exports.handleOverFlowHistory = function(MySQLConnection,d){return handleOverFlowHistory(MySQLConnection,d);};
	module.exports.markAsRead = function(u,r,d){return markAsRead(u,r,d);};
	module.exports.countUnRead = function(u,r,w){return countUnRead(u,r,w);};
})();
