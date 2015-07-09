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
			if (rows[0].nombre_msg>=30){
				mySQLConnection.query(''
				+'DELETE FROM FauchChatHistory '
				+'WHERE id_room=? '
				+'ORDER BY post_date ASC limit ?;'
					,[data.rid,rows[0].nombre_msg-29]
					,function(err2){
						if (err2) throw err2;
				});
			}
		});
	};
	/*
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
		+'SELECT post_date,post_user,post_content FROM FauchChatHistory '
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

	module.exports.postHistory = function(user_id,room_id,message) {return postHistory(user_id,room_id,message); }
	module.exports.getHistory = function(room_id,whatToDo) {return getHistory(room_id,whatToDo); }
	module.exports.parseToMessage = function(post,whatToDo) {return parseToMessage(post,whatToDo); }
	module.exports.handleOverFlowHistory = function(MySQLConnection,data){return handleOverFlowHistory(MySQLConnection,data);};
})();
