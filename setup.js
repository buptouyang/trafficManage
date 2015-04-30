var mysql = require('mysql');
var config = require('./config');
delete config.database;
var db = mysql.createClient(config);
/*db.query("CREATE DATABASE traffic");*/
db.query("USE traffic");
/*db.query('DROP TABLE IF EXISTS packetdistribution');
db.query('CREATE TABLE packetdistribution('+
	'time VARCHAR(25),'+
	'size_40 LONG,'+
	'size_41 LONG,'+
	'size_54 LONG,'+
	'size_55 LONG,'+
	'size_61 LONG,'+
	'size_101 LONG,'+
	'size_257 LONG,'+
	'size_513 LONG,'+
	'size_1025 LONG,'+
	'size_1500 LONG,'+
	'PRIMARY KEY (time))'	);*/
db.query('DROP TABLE IF EXISTS user');
db.query('CREATE TABLE user('+
	'id bigint unsigned NOT NULL AUTO_INCREMENT,'+
	'user VARCHAR(256) NOT NULL,'+
	'psw VARCHAR(256) NOT NULL,'+
	'PRIMARY KEY (id))'	);

db.end(function(){
	process.exit();
});