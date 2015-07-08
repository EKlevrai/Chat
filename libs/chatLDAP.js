module.paths.push('/usr/local/lib/node_modules');
var ldap = require('ldapjs');

(function() {

	var client = ldap.createClient({
		url: 'ldap://192.168.42.60:389'
	});
	
	/**
	 * log the user and return the usefull data
	 * @param username: the login entered client-side
	 * @param key: the password entered client-side
	 * @param whatToDo : the callback function to execute after the response fct(connect)
	 * @return the connection data with
	 * 			-isConnected :  the boolean saying if the connection was successfull
	 * 			-uid : the user_id in the LDAP (ie login)
	 * 			-username : the user's name
	 * 			
	 */
	var connectUser = function(username,key,whatToDo){
		client.bind("cn="+username+",ou=users,dc=reactor,dc=lan",key, function(err) {
			var connectInfo;
			if(err){
				console.log("Error " +JSON.stringify(err));
				connectInfo = {
					isConnected : false,
					error : err.toString()
				};
				whatToDo(connectInfo);
			}
			else {
				uInfo({"uid":username},['uid'],function(d){
					whatToDo({isConnected : true,
						uid : d['uid'],
						username : username
					});
				});

			}			
		});
	}
	

	
	/**
	 * list the users who are linked to a room
	 * @param room : the id of the room (in LDAP or in SQL mode ) 
	 * @param whatToDo : the callback function after we got the ids fct([id_users])
	 * @return : a list with all user Ids of the users linked to this room
	 */
	var peopleInRoom =  function(room,whatToDo) {
		var users_id=[];
		var opts = {
			filter: '(gidNumber='+room+')',
			scope: 'one',
			attributes : ['memberUid']
		};
		if(room && room!=""){
			client.search('ou=groups,dc=reactor,dc=lan', opts, function(err, res) {
			  res.on('searchEntry', function(entry) {
				users_id.push(entry.memberUid);
			  });
			  res.on('searchReference', function(referral) {
				console.log('referral: ' + referral.uris.join());
			  });
			  res.on('error', function(err) {
				console.error('error: ' + err.message);
				whatToDo(users_id);
			  });
			  res.on('end', function(result) {
				console.log('status: ' + result.status);
				whatToDo(users_id);
			  });
			});
		}
		else{
			whatToDo(users_id);
		}
	}
	/**
	 * list the rooms who are linked to a user
	 * @param uid : the id of the user (LDAP : string login)
	 * @param whatTodo : the callback function after we got the list of ids fct([id_rooms])
	 */
	var  roomForPeople =  function(uid,whatToDo) {
		var opts = {
			filter: '(memberUid='+uid+')',
			  scope: 'one',
			  attributes : ['gidNumber']
		};
		var id_rooms=[];
		client.search('ou=groups,dc=reactor,dc=lan', opts, function(err, res) {
			res.on('searchEntry', function(entry) {
				id_rooms.push(entry.attributes[0].vals);
			});
			res.on('searchReference', function(referral) {
				console.log('referral: ' + referral.uris.join());
			});
			res.on('error', function(err) {
				console.error('error: ' + err.message);
				whatToDo(id_rooms);
			});
			res.on('end', function(result) {
				console.log('status: ' + result.status);
				console.log("roomsID"+id_rooms);
				whatToDo(id_rooms);
			});
		});
	};


	
	
	/**
	 * list the users who are in contact to others people (commons rooms)
	 * @param uid : id of the user 
	 * @param whatToDo : callback function fct ([users_ids])
	 */
	var peopleForPeople = function(uname,whatToDo){
		roomForPeople(uname,function(rooms){
			peopleInRoom(rooms,function(users){
				whatToDo(users);
			});
		})
		
	};
	
	/**
	 * give all information of a user from its id_user
	 * @param userInfo :  what we know about the user we search info (to identify it)
	 * @param args : array of args we ask, can be
	 * 	-surname,
	 * 	-firstname,
	 *  -login,
	 *  -uid(refers to uidnumber)
	 * @param whatToDo callback function fct({arg1 : r1 ,...})
	 */
	 var uInfo = function(userInfo,args,whatToDo){
		var attributes=[];
		args.forEach(function(e){
			switch(e){
				case "surname" : 
					attributes.push("sn");
				break;
				case "firstname" :
					attributes.push("givenName");
				break;
				case "login" :
					attributes.push("uid");
				break;
				case "uid" :
					attributes.push("uidNumber");
				break;					
				default : 
				break;
				}
			});
		var filter="";
		for (i in userInfo){
			filter+='('+i+'='+userInfo[i]+')'
		}
		var opts = {
			"filter": filter,
			scope: 'one',
			"attributes" : attributes
		};
		var data={};
		client.search('ou=users,dc=reactor,dc=lan', opts, function(err, res) {
			res.on('searchEntry', function(entry) {
				for(var i=0;i<attributes.length;i++){
					if(entry.attributes[i].vals.length==1)data[args[i]]=entry.attributes[i].vals[0];
					else data[args[i]].type=entry.attributes[i].vals;					
				}			
			});
			res.on('searchReference', function(referral) {
				console.log('referral: ' + referral.uris.join());
			});
			res.on('error', function(err) {
				console.error('error: ' + err.message);
			});
			res.on('end', function(result) {
				console.log('status: ' + result.status);
				whatToDo(data);
			});
		});
	};
	
	module.exports.connectUser = function(uname,k,w) {return connectUser(uname,k,w); }
	module.exports.linkRoom = function(room,whatToDo) {return peopleInRoom(room,whatToDo); }
	module.exports.linkPeople = function(uname,whatToDo) {return roomForPeople(uname,whatToDo); }
	module.exports.linkContact = function(uname,whatToDo) {return peopleForPeople(uname,whatToDo); }
	module.exports.inCommon = function(uid1,uid2) {return isInCommon(uid1,uid2); }
	module.exports.uInfo = function(uid,a,w) {return uInfo(uid,a,w); }
}());

