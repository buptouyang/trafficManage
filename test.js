var express = require('express');
var app = express();
var fs = require("fs");
var nodeExcel = require('excel-export');
var urllib = require('url');  
var path = require('path');
var mysql = require('mysql');
var config = require('./config');
var port = 4000;
//链接数据库
var db = mysql.createClient(config);
var index = 0;
setInterval(rt,1000);
function rt(){
	var q = 'insert into capture_traffic(t_id,port_id,net_pro,trans_pro,tuple_num,pkt_num,traffic_size,frag_num,size_1_53,size_54_79,size_80_159,size_160_319,size_320_639,size_640_1279,size_1280_1518,size_1519,c_time) values(212,0,0,0,1000,262154,67111936,0,0,0,0,0,0,0,0,0,'+index+')';
	console.log(q);
 	db.query(q,function(err,timeResults){
 		console.log(err)
 	})
 	index++;
}

app.listen(4000,function(){
  console.log("--listen on 4000");
});