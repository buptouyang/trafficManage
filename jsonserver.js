var express = require('express');
var app = express();
var fs = require("fs");
var nodeExcel = require('excel-export');
var urllib = require('url');  
var path = require('path');
var mysql = require('mysql');
var config = require('./config');
var port = 3000;  
var data = {'name': 'jifeng', 'company': 'taobao'};  
app.use(express.static(path.join(__dirname,'public')));
app.get('/',function(req,res,next){
 
});
//http://localhost:3000/search?type=1&start=201411181212&end=201411181213&callback=a    //10.108.24.18
app.get('/feature', function(req, res,next){
  var databaseName;    
  switch(req.query.type){
    case "num":
      databaseName="feature";break;
    case "portPer":
      databaseName="portdistribution";break;
    case "packagePer":
      databaseName="packetdistribution";break;
  }
  var queryExpression="select time from "+databaseName;
  db.query(queryExpression,function(err,results){
      if(err) return next(err);
        if(!results) return res.send(404);
        if (req.query && req.query.callback) {  
          var str =  req.query.callback + '(' + JSON.stringify(results) + ')';//jsonp  
          res.end(str);
        }
  });

});

app.get('/search', function(req, res,next){
  console.log(req.query.start); console.log(req.query.end);
  var type = req.query.type;
  switch(type){
    case "packageNum":
    case "trafficNum":
    case "fragment":
    case "ack":
    case "syn":
    case "fin":
    case "syn_ack":
    {
     var databasesql= "select "+type+" from feature where time >="+req.query.start+" and time <="+req.query.end;
      db.query(databasesql,function(err,results){
        var step = parseInt(req.query.step);
        if(err) return next(err);
        if(!results) return res.send(404);
        if (req.query && req.query.callback) {
          console.log(type);
          
          var value=new Array();
          var i=-1;
          var num;
          value[0]=results[0][type];
          results.forEach(function(item, index){            
              if(index%step){
                num++;
                value[i] += parseInt(item[type]);
                if(index==results.length-1){value[i]=value[i]/num}
              }else{
                i++;               
                value[i] = parseInt(item[type]);
                if(i-1>=0){value[i-1]=value[i-1]/num;} 
                num=1;              
              }            
          });

          var str =  req.query.callback + '(' + JSON.stringify(value) + ')';//jsonp  
          res.end(str);
        }  
      });
      break;  
    }
    case "portPer":{           
        var dataArray = new Array(0,0,0,0,0,0);       
        if (req.query && req.query.callback) {
          db.query("select * from portdistribution where time >=? and time <=?",[req.query.start,req.query.end],function(err,results){ 
            if(err) return next(err);
            if(!results) return res.send(404);
            results.forEach(function(item,index){       
              dataArray[0]+=parseInt(item.ftp_21);
              dataArray[1]+=parseInt(item.telnet_23);
              dataArray[2]+=parseInt(item.http_80);
              dataArray[3]+=parseInt(item.smtp_25);
              dataArray[4]+=parseInt(item.pop3_110);
              dataArray[5]+=parseInt(item.elseport);
            });
            var str =  req.query.callback + '(' + JSON.stringify(dataArray) + ')';//jsonp  
            res.end(str);
          });
        }      
      break;
    }
    case "packagePer":{      
      db.query("select * from packetdistribution where time >=? and time <=?",[req.query.start,req.query.end],function(err,results){
        var dataArray = new Array(0,0,0,0,0,0,0,0,0,0);
        if(err) return next(err);
        if(!results) return res.send(404);
        if (req.query && req.query.callback) {
          results.forEach(function(item,index){           
            dataArray[0]+=parseInt(item.size_40);
            dataArray[1]+=parseInt(item.size_41);
            dataArray[2]+=parseInt(item.size_54);
            dataArray[3]+=parseInt(item.size_55);
            dataArray[4]+=parseInt(item.size_61);
            dataArray[5]+=parseInt(item.size_101);
            dataArray[6]+=parseInt(item.size_257);
            dataArray[7]+=parseInt(item.size_513);
            dataArray[8]+=parseInt(item.size_1025);
            dataArray[9]+=parseInt(item.size_1500);
          });
          var str =  req.query.callback + '(' + JSON.stringify(dataArray) + ')';//jsonp  
          res.end(str);
        }  
      });
      break;
    }
  }
  
});

app.get('/excel', function(req, res,next){
  var conf ={};
  var confrowdata=new Array();
  var ptype = req.query.ptype;
  var start = parseInt(req.query.start);
  var end = parseInt(req.query.end);
  // uncomment it for style example  
  // conf.stylesXmlFile = "styles.xml";
  switch (req.query.ptype){
    case "packagePer":{
      var dataArray = new Array(0,0,0,0,0,0,0,0,0,0);    
      db.query("select * from packetdistribution where time >=? and time <=?",[req.query.start,req.query.end],function(err,results){ 
        if(err) return next(err);
        if(!results) return res.send(404);
        results.forEach(function(item,index){       
          dataArray[0]+=parseInt(item.size_40);
          dataArray[1]+=parseInt(item.size_41);
          dataArray[2]+=parseInt(item.size_54);
          dataArray[3]+=parseInt(item.size_55);
          dataArray[4]+=parseInt(item.size_61);
          dataArray[5]+=parseInt(item.size_101);
          dataArray[6]+=parseInt(item.size_257);
          dataArray[7]+=parseInt(item.size_513);
          dataArray[8]+=parseInt(item.size_1025);
          dataArray[9]+=parseInt(item.size_1500);
        });
        var rowdata =new Array();
        rowdata.push(start);
        rowdata.push(end);
        dataArray.forEach(function(item, index){       
          rowdata.push(item);         
        }); 
        confrowdata.push(rowdata);
        conf.rows = confrowdata;
        conf.cols = [{
          caption:'开始时间',   
          type:'string',
          width:60
        },{
            caption:'结束时间',
            type:'string',
            width:60
        },
        {
            caption:'40字节',  
            type:'number',
            width:20
        },
        {
            caption:'41~53字节',  
            type:'number',
            width:20
        },
        {
            caption:'54字节',  
            type:'number',
            width:20
        },
        {
            caption:'55~61字节',  
            type:'number',
            width:20
        },
        {
            caption:'61~100字节',  
            type:'number',
            width:20
        },
        {
            caption:'101~256字节',  
            type:'number',
            width:20
        },
        {
            caption:'257~512字节',  
            type:'number',
            width:20
        },
        {
            caption:'513~1024字节',  
            type:'number',
            width:20
        },
        {
            caption:'1025~1499字节',  
            type:'number',
            width:20
        },
        {
            caption:'1500字节',  
            type:'number',
            width:20
        }];
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('charset', 'utf-8');
        res.setHeader("Content-Disposition", "attachment; filename="+"packetdistribution.xlsx");
        res.end(result, 'binary');
      }); 
      break;
    }
    case "portPer":{
      var dataArray = new Array(0,0,0,0,0,0);          
      db.query("select * from portdistribution where time >=? and time <=?",[req.query.start,req.query.end],function(err,results){ 
        if(err) return next(err);
        if(!results) return res.send(404);
        results.forEach(function(item,index){       
          dataArray[0]+=parseInt(item.ftp_21);
          dataArray[1]+=parseInt(item.telnet_23);
          dataArray[2]+=parseInt(item.http_80);
          dataArray[3]+=parseInt(item.smtp_25);
          dataArray[4]+=parseInt(item.pop3_110);
          dataArray[5]+=parseInt(item.elseport);
        });
        var rowdata =new Array();
        rowdata.push(start);
        rowdata.push(end);
        dataArray.forEach(function(item, index){         
            rowdata.push(item);
        });
        confrowdata.push(rowdata);
        conf.rows=confrowdata;
        conf.cols = [{
          caption:'开始时间',   
          type:'string',
          width:60
        },{
            caption:'结束时间',
            type:'string',
            width:60
        },
        {
            caption:'ftp',  
            type:'number',
            width:20
        },
        {
            caption:'http',  
            type:'number',
            width:20
        },
        {
            caption:'telnet',  
            type:'number',
            width:20
        },
        {
            caption:'smtp',  
            type:'number',
            width:20
        },
        {
            caption:'pop3',  
            type:'number',
            width:20
        },
        {
            caption:'其他端口',  
            type:'number',
            width:20
        }];
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('charset', 'utf-8');
        res.setHeader("Content-Disposition", "attachment; filename="+"portdistribution.xlsx");
        res.end(result, 'binary');
      }); 
      break;
    }
    default:{
      var fileName ={packageNum:"packet",trafficNum:"traffic",fragment:"fragment",ack:"ack",syn:'syn',fin:"fin",syn_ack:"syn_ack"};
      var value=new Array();
      if(req.query){
        var step = parseInt(req.query.step);
        var queryStr = "select "+ptype+" from feature where time >="+start+" and time <="+end;
        db.query(queryStr,function(err,results){
          if(err) return next(err);
          if(!results) return res.send(404);     
          var i=-1;
          var num;
          value[0]=results[0][ptype];
          results.forEach(function(item, index){            
              if(index%step){
                num++;
                value[i] += parseInt(item[ptype]);
                if(index==results.length-1){value[i]=value[i]/num}
              }else{
                i++;               
                value[i] = parseInt(item[ptype]);
                if(i-1>=0){value[i-1]=value[i-1]/num;} 
                num=1;              
              }            
          });     
          value.forEach(function(item, index){
            var rowdata =new Array();
            rowdata.push(start+index*step);
            rowdata.push(start+index*step+step-1);
            rowdata.push(step);
            rowdata.push(item);
            console.log(rowdata)
            confrowdata.push(rowdata);
          });
         
          conf.rows = confrowdata;
          conf.cols = [{
            caption:'开始时间',   
            type:'string',
            width:60
          },{
              caption:'结束时间',
              type:'string',
              width:60
          },{
              caption:'步长',
              type:'number',
              width:20
          },
          {
              caption:'数据',  
              type:'number',
              width:20
          }];
          var result = nodeExcel.execute(conf);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats');
          res.setHeader('charset', 'utf-8');
          res.setHeader("Content-Disposition", "attachment; filename=" + fileName[ptype]+".xlsx");
          res.end(result, 'binary');
      });
    }

    }//end of default
  }
});
 
//链接数据库
var db = mysql.createClient(config);
app.listen(3000,function(){
  console.log("--listen on 3000");
});