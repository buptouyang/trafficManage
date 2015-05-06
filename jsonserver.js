var express = require('express');
var app = express();
var fs = require("fs");
var nodeExcel = require('excel-export');
var urllib = require('url');  
var path = require('path');
var mysql = require('mysql');
var config = require('./config');
var port = 3000;  
app.use(express.static(path.join(__dirname,'public')));
app.use(express.bodyParser());
app.get('/',function(req,res,next){
 res.send('hello')
});
function NormalDate(utc){
    var date = new Date(utc*1000);
    var ndt;
    ndt = date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate()+" "+(date.getHours())+":"+date.getMinutes()+":"+date.getSeconds();
    return ndt;
}
app.post('/login', function(req, res,next){
  console.log(req.body);
  var queryExpression="select * from user where user='"+req.body.uid+"'";
  db.query(queryExpression,function(err,results){
      if(err) return next(err);
        if(!results[0]){
          var message={'status':1,'message':"用户名不存在"};
          var str =  JSON.stringify(message);
          res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
          res.end(str);
        } else { 
          if(results[0].psw == req.body.psw){
            res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
            var message={'status':0,'message':"登录成功"};
            var str =  JSON.stringify(message); 
            res.end(str);
          } else {
            var message={'status':2,'message':"密码错误"};
            var str =  JSON.stringify(message); 
            res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
            res.end(str);
          }
        }
  });
});
app.post('/trafficDetail', function(req, res,next){
  console.log(req.body);
  var queryExpression = 'select';
  var queryObj = req.body;
  var type = queryObj.ctype;
  switch(type){
    case '1':queryExpression +=" sum(traffic_size) as sumData";break;
    case '2':queryExpression +=" sum(pkt_num) as sumData";break;
    case '3':queryExpression +=" sum(tuple_num) as sumData";break;
    case '4':queryExpression +=" sum(frag_num) as sumData";break;
    case '5':queryExpression +=" sum(size_40_80) as 40byte_80byte,sum(size_81_160) as 81byte_160byte,sum(size_161_320) as 161byte_320byte,sum(size_321_640) as 321byte_640byte,sum(size_641_1280) as 641byte_1280byte,sum(size_1280_1500) as 1281byte_1500byte,sum(size_1501) as 1501byte_above";break;
  }
  queryExpression+=",c_time as time from CAPTURE_TRAFFIC where t_id="+queryObj.tId;//"and t_start >"+req.body.start+" and t_end<"+req.body.end+
  queryObj.start!='0'?(queryExpression+=" and c_time >="+queryObj.start):'';
  queryObj.end!='0'?(queryExpression+=" and c_time <="+queryObj.end):'';
  queryObj.port?(queryExpression+=" and port_id ="+queryObj.port):'';
  queryObj.transPro?(queryExpression+=" and trans_pro="+queryObj.transPro):'';
  queryObj.netPro?(queryExpression+=" and net_pro ="+queryObj.netPro):'';
  if(type != 5){
    queryExpression +=" group by c_time";
  }
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
    console.log(results);
      if(err) return next(err);
        if(!results[0]){ //无查询结果 
            var message={'status':1,'message':"无查询结果"};
            var str =  JSON.stringify(message);
            res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
            res.end(str);
        } else {  //有结果
            var data={'status':0,dataList:[]};
            data.dataList=results;
            var str =  JSON.stringify(data); 
            res.end(str);
        }
    });   
});
app.get('/exceldata', function(req, res,next){
  console.log(req.query);
  var queryExpression = 'select';
  var queryObj = req.query;
  var type = queryObj.ctype;
  switch(type){
    case '1':queryExpression +=" sum(traffic_size) as sumData";break;
    case '2':queryExpression +=" sum(pkt_num) as sumData";break;
    case '3':queryExpression +=" sum(tuple_num) as sumData";break;
    case '4':queryExpression +=" sum(frag_num) as sumData";break;
    case '5':queryExpression +=" sum(size_40_80) as 40byte_80byte,sum(size_81_160) as 81byte_160byte,sum(size_161_320) as 161byte_320byte,sum(size_321_640) as 321byte_640byte,sum(size_641_1280) as 641byte_1280byte,sum(size_1280_1500) as 1281byte_1500byte,sum(size_1501) as 1501byte_above";break;
  }
  queryExpression+=",c_time as time from CAPTURE_TRAFFIC where t_id="+queryObj.tId;//"and t_start >"+req.body.start+" and t_end<"+req.body.end+
  queryObj.start!='0'?(queryExpression+=" and t_start >="+queryObj.start,10):'';
  queryObj.end!='0'?(queryExpression+=" and t_end <="+queryObj.end,10):'';
  queryObj.port?(queryExpression+=" and port_id ="+queryObj.port):'';
  queryObj.transPro?(queryExpression+=" and trans_pro="+queryObj.transPro):'';
  queryObj.netPro?(queryExpression+=" and net_pro ="+queryObj.netPro):'';
  if(type != 5){
    queryExpression +=" group by c_time";
  }
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
    console.log(results);
      if(err) return next(err);
        if(!results[0]){ //无查询结果 
            var message={'status':1,'message':"无查询结果"};
            var str =  JSON.stringify(message);
            res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
            res.end(str);
        } else {  //有结果
            db.query('select t_start,t_end from TRAFFIC_INFO where t_id='+queryObj.tId,function(err,timeResults){
              var formalTime = timeResults[0].t_start;
              var tendTime = formalTime+timeResults[0].t_end;
              var conf ={};
              var confrowdata=new Array();           
              if(type == '5'){
                var rowdata =new Array();
                if(queryObj.start!=0){
                  console.log(queryObj.start)
                  rowdata.push(queryObj.start);
                }else{
                  console.log(NormalDate(formalTime))
                  rowdata.push(NormalDate(formalTime));
                }
                if(queryObj.end!=0){
                  rowdata.push(queryObj.end);
                }else{
                  console.log(NormalDate(tendTime))
                  rowdata.push(NormalDate(tendTime));
                }
                for(value in results[0]){
                  if(value != 'time'){
                    rowdata.push(results[0][value]); 
                  }              
                }
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
                    caption:'40字节~80字节',  
                    type:'number',
                    width:20
                },
                {
                    caption:'81~160字节',  
                    type:'number',
                    width:20
                },
                {
                    caption:'161字节~320字节',  
                    type:'number',
                    width:20
                },
                {
                    caption:'321字节~640字节',  
                    type:'number',
                    width:20
                },
                {
                    caption:'641字节~1280字节',  
                    type:'number',
                    width:20
                },
                {
                    caption:'1281字节~1500字节',  
                    type:'number',
                    width:20
                },
                {
                    caption:'1501字节以上',  
                    type:'number',
                    width:20
                }];
              }else{
                results.forEach(function(item, index){
                var rowdata =new Array();    
                  rowdata.push(NormalDate(formalTime+parseInt(item.time,10)));
                  rowdata.push(item.sumData);
                  confrowdata.push(rowdata);
                }); 
                conf.rows = confrowdata;
                conf.cols = [{
                  caption:'时刻',   
                  type:'string',
                  width:60
                  },/*{
                      caption:'结束时间',
                      type:'string',
                      width:60
                  },*//*{
                      caption:'步长',
                      type:'number',
                      width:20
                  },*/
                  {
                      caption:'数据',  
                      type:'number',
                      width:20
                  }];
              }
              
              var result = nodeExcel.execute(conf);
              res.setHeader('Content-Type', 'application/vnd.openxmlformats');
              res.setHeader('charset', 'utf-8');
              res.setHeader("Content-Disposition", "attachment; filename="+"trafficdistribution.xlsx");
              res.end(result, 'binary');
            });
            
          }//end of excel
    });   
});
app.get('/trafficInfo', function(req, res,next){
  var queryExpression="select t_id as id,t_name as name,t_desc as descript,from_unixtime(t_start,'%Y-%m-%d %h:%i:%s') as start,t_end as end from TRAFFIC_INFO";
  db.query(queryExpression,function(err,results){
    console.log(results);
      if(err) return next(err);
        if(!results[0]){ //无查询结果
            var message={'status':1,'message':"无查询结果"};
            var str =  JSON.stringify(message);
            res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
            res.end(str);         
        } else {  //有结果
            var data={'status':0,dataList:[]};
            data.dataList=results;
            var str =  JSON.stringify(data); 
            res.end(str);
        }
  });
});
//实时流量
app.post('/realTime', function(req, res,next){
  var queryExpression = 'select';
  var type = parseInt(req.body.ctype,10);
  var queryObj = req.body;
  console.log(queryObj);
  switch(type){
    case 1:queryExpression +=" sum(traffic_size) as sumData";break;
    case 2:queryExpression +=" sum(pkt_num) as sumData";break;
    case 3:queryExpression +=" sum(tuple_num) as sumData";break;
    case 4:queryExpression +=" sum(frag_num) as sumData";break;
  }
  queryExpression+=",c_time as time from CAPTURE_TRAFFIC where t_id="+queryObj.tId;
  queryObj.port?(queryExpression+=" and port_id ="+queryObj.port):'';
  queryObj.transPro?(queryExpression+=" and trans_pro="+queryObj.transPro):'';
  queryObj.netPro?(queryExpression+=" and net_pro ="+queryObj.netPro):'';
  queryExpression +=" group by c_time";
  queryExpression += ' order by c_time DESC limit 0,3000';
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
    console.log(results);
      if(err) return next(err);
        if(!results[0]){ //无查询结果
            var message={'status':1,'message':"无查询结果"};
            var str =  JSON.stringify(message);
            res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
            res.end(str);         
        } else {  //有结果
            var data={'status':0,dataList:[]};
            data.dataList=results;
            var str =  JSON.stringify(data); 
            res.end(str);
        }
  });
});
app.post('/trafficAll', function(req, res,next){
  var queryExpression = 'select';
  var type = parseInt(req.body.type,10);
  switch(type){
    case 1:queryExpression +=" sum(traffic_size) as sumData";break;
    case 2:queryExpression +=" sum(pkt_num) as sumData";break;
    case 3:queryExpression +=" sum(tuple_num) as sumData";break;
    case 4:queryExpression +=" sum(frag_num) as sumData";break;
    case 5:queryExpression +=" sum(size_40_80) as 40byte_80byte,sum(size_81_160) as 81byte_160byte,sum(size_161_320) as 161byte_320byte,sum(size_321_640) as 321byte_640byte,sum(size_641_1280) as 641byte_1280byte,sum(size_1280_1500) as 1281byte_1500byte,sum(size_1501) as 1501byte_above";break;
  }
  queryExpression+=",from_unixtime(c_time,'%Y-%m-%d %h:%i:%s') as time from CAPTURE_TRAFFIC where t_id="+req.body.id;//+"and t_start >"+req.body.start+" and t_end<"+req.body.end;
  if(type != 5){
    queryExpression +=" group by c_time";
  }
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
      if(err) return next(err);
        if(!results[0]){ //无查询结果
          var message={'status':1,'message':"无查询结果"};
          var str =  JSON.stringify(message);
          res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
          res.end(str);
        } else {  //有结果
            var data={'status':0,dataList:[]};
            data.dataList=results;
            var str =  JSON.stringify(data); 
            res.end(str);
        }
  });
});
//http://localhost:3000/search?type=1&start=201411181212&end=201411181213&callback=a    //10.108.24.18
/*app.get('/feature', function(req, res,next){
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
  
});*/

/*app.get('/excel', function(req, res,next){
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
      db.query("select * from CAPTURE_TRAFFIC where t_id =? and port_id =? and net_pro =? and time >=? and time <=?",[req.query.start,req.query.end],function(err,results){ 
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
});*/
 
//链接数据库
var db = mysql.createClient(config);
app.listen(3000,function(){
  console.log("--listen on 3000");
});