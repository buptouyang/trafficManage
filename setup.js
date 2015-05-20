var mysql = require('mysql');
var config = require('./config');
delete config.database;
var db = mysql.createClient(config);
/*db.query("CREATE DATABASE traffic");*/
db.query("USE traffic_real");
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
/*db.query('DROP TABLE IF EXISTS user');
db.query('CREATE TABLE user('+
	'id bigint unsigned NOT NULL AUTO_INCREMENT,'+
	'user VARCHAR(256) NOT NULL,'+
	'psw VARCHAR(256) NOT NULL,'+
	'PRIMARY KEY (id))'	);*/
/*db.query('DROP TABLE IF EXISTS trans_type');
db.query('CREATE TABLE trans_type('+
	'trans_id int(11) NOT NULL AUTO_INCREMENT,'+
	'trans_name varchar(32) NOT NULL,'+
	'PRIMARY KEY (trans_id))'	);*/
db.query('DROP TABLE IF EXISTS net_type');
db.query('CREATE TABLE net_type('+
	'net_id int(11) NOT NULL AUTO_INCREMENT,'+
	'net_name varchar(32) NOT NULL,'+
	'trans_id int(11) NOT NULL,'+
	'FOREIGN KEY (trans_id) REFERENCES trans_type(trans_id) ON DELETE CASCADE,'+
	'PRIMARY KEY (net_id))'	);

db.end(function(){
	process.exit();
});