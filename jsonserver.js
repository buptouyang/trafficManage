var express = require('express');
var app = express();
var fs = require("fs");
var nodeExcel = require('excel-export');
var urllib = require('url');  
var path = require('path');
var mysql = require('mysql');
var config = require('./config');
var port = 3000;  
var typeArray =['',"traffic","package","tuple","fragment","packetdistribution"];
app.use(express.static(path.join(__dirname,'public')));
app.use(express.bodyParser());
/*app.get('/',function(req,res,next){
 res.send('hello')
});*/
function NormalDate(utc){
    var date = new Date(utc*1000);
    var ndt;
    function checkTime(i){
      if (i<10){
          i = "0" + i;
      }
      return i;
  }
    ndt = date.getFullYear()+"/"+checkTime(date.getMonth()+1)+"/"+checkTime(date.getDate())+" "+checkTime(date.getHours())+":"+checkTime(date.getMinutes())+":"+checkTime(date.getSeconds());
    return ndt;
}
function UTCDay(daystring) {
  var dayobj=new Date(daystring);
  return Date.parse(dayobj)/1000;
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
function toInteger(str) {
  var res = parseInt(str, 10)
  return isNaN(res) ? 1 : res;
}
app.post('/trafficDetail', function(req, res,next){
  console.log(req.body);
  var queryExpression = 'select';
  var queryObj = req.body;
  var type = queryObj.ctype;
  var scale = queryObj.scale >= 1 ? toInteger(queryObj.scale):1;
  switch(type){
    case '1':queryExpression +=" sum(traffic_size) as sumData";break;
    case '2':queryExpression +=" sum(pkt_num) as sumData";break;
    case '3':queryExpression +=" sum(tuple_num) as sumData";break;
    case '4':queryExpression +=" sum(frag_num) as sumData";break;
    case '5':queryExpression +=" sum(size_1_53) as 1byte_53byte,sum(size_54_79) as 54byte_79byte,sum(size_80_159) as 80byte_159byte,sum(size_160_319) as 160byte_319byte,sum(size_320_639) as 320byte_639byte,sum(size_640_1279) as 640byte_1279byte,sum(size_1280_1518) as 1280byte_1518byte,sum(size_1519) as 1519byte_above";break;
  }
  queryExpression+=",c_time as time from capture_traffic where t_id="+queryObj.tId;
  queryObj.start!='0'?(queryExpression+=" and c_time >="+queryObj.start):'';
  queryObj.end!='0'?(queryExpression+=" and c_time <="+queryObj.end):'';
  queryObj.port?(queryExpression+=" and port_id ="+queryObj.port):'';  
  queryObj.netPro?(queryExpression+=" and net_pro ="+queryObj.netPro):'';
  if(queryObj.netPro != '' && queryObj.netPro != '2'){
    queryObj.transPro?(queryExpression+=" and trans_pro="+queryObj.transPro):'';
  }
  if(type != 5){
    queryExpression +=" group by c_time";
  }
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
    console.log(results.length);
      if(err) return next(err);
        if(!results[0] || results[0].time == null ){ //无查询结果 
            var message={'status':1,'message':"无查询结果"};
            var str =  JSON.stringify(message);
            res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
            res.end(str);
        } else {  //有结果
            var data={'status':0,dataList:[]};
            var tempValue=0;
            if(queryObj.total == 'true'){    //累积
              var pointValue = [];
              results.forEach(function(item,index) {
                var totalvalue = {};
                tempValue += toInteger(item.sumData);
                totalvalue.time = item.time;
                totalvalue.sumData = tempValue;
                pointValue.push(totalvalue);
              });
              var searchPointLen = pointValue.length;
              if(scale > searchPointLen){  //时间尺度
                data.dataList.push(pointValue[searchPointLen-1]);
              }else{
                for(var k=(scale-1);k<searchPointLen;k+=scale){
                  if(k > searchPointLen){
                    data.dataList.push(pointValue[searchPointLen-1]);
                  }else{
                    data.dataList.push(pointValue[k]);
                  }      
                }
              }              
            }else{
              if(scale != 1){
                var value = new Array();
                var i=0;
                var num = 0;
                var total = 0;
                results.forEach(function(item,index) {
                  if((index+1)%scale){
                    num++;
                    total += toInteger(item.sumData);
                    if(index==results.length-1){
                      value[i]={};
                      value[i].sumData=total/num;
                      value[i].time = item.time;
                    }
                  }else{
                    num++;
                    total += toInteger(item.sumData,10);
                    value[i]={};
                    value[i].sumData=total/num;
                    value[i].time = item.time;
                    total = 0;//toInteger(item.sumData,10);                
                    i++;
                    num=0;
                  }
                });
                data.dataList = value;
              }else{
                data.dataList = results;
              }             
            }            
            var str =  JSON.stringify(data); 
            res.end(str);
        }
    });   
});
function searchData(reqparam,callback){
  console.log(reqparam);
  var queryExpression = 'select';
  var queryObj = reqparam;
  var type = queryObj.ctype;
  var scale = queryObj.scale >= 1 ? toInteger(queryObj.scale):1;
  switch(type){
    case '1':queryExpression +=" sum(traffic_size) as sumData";break;
    case '2':queryExpression +=" sum(pkt_num) as sumData";break;
    case '3':queryExpression +=" sum(tuple_num) as sumData";break;
    case '4':queryExpression +=" sum(frag_num) as sumData";break;
    case '5':queryExpression +=" sum(size_1_53) as 1byte_53byte,sum(size_54_79) as 54byte_79byte,sum(size_80_159) as 80byte_159byte,sum(size_160_319) as 160byte_319byte,sum(size_320_639) as 320byte_639byte,sum(size_640_1279) as 640byte_1279byte,sum(size_1280_1518) as 1280byte_1518byte,sum(size_1519) as 1519byte_above";break;
  }
  queryExpression+=",c_time as time from capture_traffic where t_id="+queryObj.tId;
  queryObj.start!='0'?(queryExpression+=" and c_time >="+queryObj.start):'';
  queryObj.end!='0'?(queryExpression+=" and c_time <="+queryObj.end):'';
  queryObj.port?(queryExpression+=" and port_id ="+queryObj.port):'';  
  queryObj.netPro?(queryExpression+=" and net_pro ="+queryObj.netPro):'';
  if(queryObj.netPro != '' && queryObj.netPro != '2'){
    queryObj.transPro?(queryExpression+=" and trans_pro="+queryObj.transPro):'';
  }
  if(type != 5){
    queryExpression +=" group by c_time";
  }
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
    callback(err,results);
  });
}

function isArrayFun(arr){
  if( Object.prototype.toString.call(arr) === '[object Array]' ) {
    return true;
  }else{
    return false;
  }
}

function totalUp(arr){
  if(isArrayFun){
    var tempValue = 0,pointValue = [];
    arr.forEach(function(item,index) {
      var totalvalue = {};
      tempValue+=toInteger(item.sumData);
      totalvalue.time = item.time;
      totalvalue.sumData = tempValue;
      pointValue.push(totalvalue);
    });
    return pointValue;
  }else{
    return false;
  }
}
function scaleUp(scale,arr,type){
  var pointLen = arr.length;
  var scaleValue = [];
  if(parseInt(scale,10) == 1){
    return arr;
  }else{
    if(type == 1){ //total
      if(scale > pointLen){
        scaleValue.push(arr[pointLen-1]);
      }else{
        for(var k=(scale-1);k<pointLen;k+=scale){
          if(k>pointLen){
            scaleValue.push(arr[pointLen-1]);
          }else{
            scaleValue.push(arr[k]);
          }      
        }
      }
    }else{
      var i=0;
      var num = 0;
      var total = 0;
      arr.forEach(function(item,index) {
        if((index+1)%scale){
          num++;
          total += toInteger(item.sumData);
          if(index==arr.length-1){
            scaleValue[i]={};
            scaleValue[i].sumData=total/num;
            scaleValue[i].time = item.time;
          }
        }else{
          num++;
          total += toInteger(item.sumData,10);
          scaleValue[i]={};
          scaleValue[i].sumData=total/num;
          scaleValue[i].time = item.time;
          total = 0;//toInteger(item.sumData,10);                
          i++;
          num=0;
        }
      });
    }   
    return scaleValue;
  }
}
app.get('/exceldata', function(req, res,next){
  var queryObj = req.query;
  searchData(queryObj,function(err,results){
    if(err) return next(err);
    if(!results[0]){ //无查询结果 
        //var message={'status':1,'message':"无查询结果"};
        var str = 'no data';
        res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
        res.end(str);
    } else {  //有结果
      var wstart,wend;
      db.query('select t_start,t_end,t_name from traffic_info where t_id='+queryObj.tId,function(err,timeResults){
        console.log(timeResults)
        var formalTime = timeResults[0].t_start;
        //var tendTime = formalTime+timeResults[0].t_end;
        var tendTime = timeResults[0].t_end;
        var conf ={};
        var confrowdata=new Array();
        if(queryObj.start!=0 ){
          wstart = NormalDate(formalTime+toInteger(queryObj.start)).replace(/[\/\:]/g,'-');
        }else{
          wstart = NormalDate(formalTime).replace(/[\/\:]/g,'-');
        }
        if(queryObj.end!=0){
          wend = NormalDate(formalTime+toInteger(queryObj.end)).replace(/[\/\:]/g,'-');
        }else{
          wend = NormalDate(tendTime).replace(/[\/\:]/g,'-');
        }
        if(queryObj.ctype == '5'){   //包分布
            var rowdata =new Array();
            if(queryObj.start!=0 ){
              wstart = NormalDate(formalTime+toInteger(queryObj.start));
              rowdata.push(wstart);
            }else{
              wstart = NormalDate(formalTime);
              rowdata.push(wstart);
            }
            if(queryObj.end!=0){
              wend = NormalDate(formalTime+toInteger(queryObj.end));
              rowdata.push(wend);
            }else{
              wend = NormalDate(tendTime);
              rowdata.push(wend);
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
                caption:'1字节~53字节(单位：个)',  
                type:'number',
                width:60
            },
            {
                caption:'54~79字节(单位：个)',  
                type:'number',
                width:60
            },
            {
                caption:'80字节~159字节(单位：个)',  
                type:'number',
                width:60
            },
            {
                caption:'160字节~319字节(单位：个)',  
                type:'number',
                width:60
            },
            {
                caption:'320字节~639字节(单位：个)',  
                type:'number',
                width:60
            },
            {
                caption:'640字节~1279字节(单位：个)',  
                type:'number',
                width:60
            },
            {
                caption:'1280字节~1518字节(单位：个)',  
                type:'number',
                width:60
            },
            {
                caption:'1519字节以上(单位：个)',  
                type:'number',
                width:60
            }];
          }else{  //其他线图
            if(queryObj.total == 'true'){
              results = totalUp(results);
              results = scaleUp(queryObj.scale,results);
            }else{
              results = scaleUp(queryObj.scale,results);
            } 
            results.forEach(function(item, index){
              var rowdata =new Array();    
              rowdata.push(NormalDate(formalTime+toInteger(item.time)));
              //rowdata.push(NormalDate(toInteger(item.time)));
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
                  caption:'数据(单位：byte)',  
                  type:'number',
                  width:20
            }];
            if(queryObj.type == '1'){
              conf.cols[1].caption = '数据(单位：MB)';
            }else if(queryObj.type == '3' || queryObj.type =='2' || queryObj.type =='4'){
              conf.cols[1].caption = '数据(单位：个)';
            }
          }//非饼状
          //解决中文乱码
          var userAgent = (req.headers['user-agent']||'').toLowerCase();
          if(userAgent.indexOf('msie') >= 0 || userAgent.indexOf('chrome') >= 0) {
              res.setHeader('Content-Disposition', 'attachment; filename=' + timeResults[0].t_name +'__' +encodeURIComponent(typeArray[queryObj.ctype]) +wstart+"__"+wend+".xlsx");
          } else if(userAgent.indexOf('firefox') >= 0) {
              res.setHeader('Content-Disposition', 'attachment; filename*="utf8\'\'' + encodeURIComponent(typeArray[queryObj.ctype])+wstart+'__'+wend+'.xlsx"');
          } else {
              /* safari等其他非主流浏览器只能呵呵了 */
              res.setHeader('Content-Disposition', 'attachment; filename=' + new Buffer(typeArray[queryObj.ctype]).toString('binary')+wstart+"__"+wend+".xlsx");
          }
          var excelResult = nodeExcel.execute(conf);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats');
          res.setHeader('charset', 'GB2312');
          //res.setHeader("Content-Disposition", "attachment; filename="+encodeURIComponent(typeArray[type])+wstart+"__"+wend+".xlsx");
          res.end(excelResult, 'binary');
        });
      }
  });
});

//传输协议
app.get('/transInfo', function(req, res,next){
  var id = req.query.id || null;
  var queryExpression="select t.trans_name as name,t.trans_id as id from net_type n,trans_type t where t.trans_id=n.trans_id and n.net_id="+id;
  console.log(queryExpression)
  db.query(queryExpression,function(err,results){
    console.log(results)
    if(err){
      console.log('无记录:'+err.message);
      return next(err);
    } else {
      var data={'status':0,dataList:[]};
      data.dataList = results;
      var str =  JSON.stringify(data); 
      res.end(str);
    }
  });
});

//网络协议
app.get('/netInfo', function(req, res,next){
  var queryExpression="select net_id as id,net_name as name from net_type group by net_id";
  console.log(queryExpression)
  db.query(queryExpression,function(err,results){
    console.log(results);
    if(err){
      console.log('无记录:'+err.message);
      return next(err);
    } else {
      var data={'status':0,dataList:[]};
      data.dataList = results;
      var str =  JSON.stringify(data); 
      res.end(str);
    }
  });
});

app.get('/trafficInfo', function(req, res,next){
  console.log(req.query);
  var page = req.query.page;
  if(req.query.queryStr == ''){
    /*var queryExpression="select t.t_id as id,t.t_name as name,m.m_name as machine,t.t_type as type,t.t_run_flag as status,t.t_desc as descript,from_unixtime(t.t_start,'%Y/%m/%d %H:%i:%s') as start,max(c.c_time) as end ";
    queryExpression+="from machine_info m,traffic_info t left join capture_traffic c using(t_id) where t.m_id=m.m_id group by t.t_id";
    queryExpression+=" UNION select g.g_id as id,g.g_name as name,m.m_name as machine,g.g_type as type,g.g_run_flag as status,g.g_desc as descript,from_unixtime(g.g_start,'%Y/%m/%d %H:%i:%s') as start,g.g_end as end ";
    queryExpression+="from machine_info m,generate_traffic_info g where g.m_id=m.m_id order by id DESC";*/
    var queryExpression="select t.t_id as id,t.t_name as name,m.m_name as machine,1 as type,t.t_run_flag as status,t.t_desc as descript,from_unixtime(t.t_start,'%Y/%m/%d %H:%i:%s') as start,from_unixtime(t.t_end,'%Y/%m/%d %H:%i:%s') as end ";
    queryExpression+="from machine_info m,traffic_info t left join capture_traffic c using(t_id) where t.m_id=m.m_id group by t.t_id";
    queryExpression+=" UNION select g.g_id as id,g.g_name as name,m.m_name as machine,2 as type,g.g_run_flag as status,g.g_desc as descript,from_unixtime(g.g_start,'%Y/%m/%d %H:%i:%s') as start,from_unixtime(g.g_end,'%Y/%m/%d %H:%i:%s') as end ";
    queryExpression+="from machine_info m,generate_traffic_info g where g.m_id=m.m_id order by id DESC"
  }else{
   /* var queryExpression="select t.t_id as id,t.t_name as name,m.m_name as machine,t.t_type as type,t.t_run_flag as status,t.t_desc as descript,from_unixtime(t.t_start,'%Y/%m/%d %H:%i:%s') as start,max(c.c_time) as end ";
    queryExpression+="from machine_info m,traffic_info t left join capture_traffic c using(t_id) where t.m_id=m.m_id and t.t_name like '%"+req.query.queryStr+"%' group by t.t_id";
    queryExpression+=" UNION select g.g_id as id,g.g_name as name,m.m_name as machine,g.g_type as type,g.g_run_flag as status,g.g_desc as descript,from_unixtime(g.g_start,'%Y/%m/%d %H:%i:%s') as start,g.g_end as end ";
    queryExpression+="from machine_info m,generate_traffic_info g where g.m_id=m.m_id and g.g_name like '%"+req.query.queryStr+"%' order by id DESC";*/
    var queryExpression="select t.t_id as id,t.t_name as name,m.m_name as machine,1 as type,t.t_run_flag as status,t.t_desc as descript,from_unixtime(t.t_start,'%Y/%m/%d %H:%i:%s') as start,from_unixtime(t.t_end,'%Y/%m/%d %H:%i:%s') as end ";
    queryExpression+="from machine_info m,traffic_info t left join capture_traffic c using(t_id) where t.m_id=m.m_id and t.t_name like'%"+req.query.queryStr+"%' group by t.t_id";
    queryExpression+=" UNION select g.g_id as id,g.g_name as name,m.m_name as machine,2 as type,g.g_run_flag as status,g.g_desc as descript,from_unixtime(g.g_start,'%Y/%m/%d %H:%i:%s') as start,from_unixtime(g.g_end,'%Y/%m/%d %H:%i:%s') as end ";
    queryExpression+="from machine_info m,generate_traffic_info g where g.m_id=m.m_id and g.g_name like '%"+req.query.queryStr+"%' order by id DESC"
  }
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
   console.log(results.length);
      if(err) return next(err);
      if(!results[0]){ //无查询结果
          var message={'status':0,'message':"无查询结果",dataList:[]};
          var str =  JSON.stringify(message);
          res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
          res.end(str);         
      } else {  //有结果
          var data={'status':0,dataList:[],totalPng:0};
          results.forEach(function(item,index) {
            if(item.end==null){
              item.end = 0;
            }
            if(item.status == 2){
              item.disable = true;
            }else{
              item.disable = false;
            }
            if(item.type == 2){
              item.type = '生成';
              item.cap = 'false';
            }else{
              item.type = '捕获';
              item.cap = 'true';
            }
          });
          data.totalPng = Math.ceil(results.length/10);
          data.dataList=results.slice((page-1)*10,page*10);
          var str =  JSON.stringify(data); 
          res.end(str);
      }
  });
});
app.get('/trafficCap', function(req, res,next){
  console.log(req.query);
  var page = req.query.page;
  if(req.query.queryStr == ''){
    var queryExpression="select t.t_id as id,t.t_name as name,t.t_desc as descript,from_unixtime(t.t_start,'%Y/%m/%d %H:%i:%s') as start,max(c.c_time) as end ";
    queryExpression+="from traffic_info t left join capture_traffic c using(t_id) group by t.t_id";
   
  }else{
    var queryExpression="select t.t_id as id,t.t_name as name,t.t_desc as descript,from_unixtime(t.t_start,'%Y/%m/%d %H:%i:%s') as start,max(c.c_time) as end ";
    queryExpression+="from traffic_info t left join capture_traffic c using(t_id) where t.t_name like '%"+req.query.queryStr+"%' group by t.t_id";
    
  }
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
   console.log(results.length);
      if(err) return next(err);
        if(!results[0]){ //无查询结果
            var message={'status':1,'message':"无查询结果"};
            var str =  JSON.stringify(message);
            res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
            res.end(str);         
        } else {  //有结果
            var data={'status':0,dataList:[],totalPng:0};
            results.forEach(function(item,index) {
              if(item.end==null){
                item.end = 0;
              }
            });
            data.totalPng = Math.ceil(results.length/10);
            data.dataList=results.slice((page-1)*10,page*10);
            var str =  JSON.stringify(data); 
            res.end(str);
        }
  });
});
//实时流量
app.post('/realTime', function(req, res,next){
  var queryExpression = 'select';
  var type = toInteger(req.body.ctype);
  var queryObj = req.body;
  console.log(queryObj);
  switch(type){
    case 1:queryExpression +=" sum(traffic_size) as sumData";break;
    case 2:queryExpression +=" sum(pkt_num) as sumData";break;
    case 3:queryExpression +=" sum(tuple_num) as sumData";break;
    case 4:queryExpression +=" sum(frag_num) as sumData";break;
  }
  queryExpression+=",c_time as time from capture_traffic where t_id="+queryObj.tId;
  queryObj.port?(queryExpression+=" and port_id ="+queryObj.port):'';
  queryObj.netPro?(queryExpression+=" and net_pro ="+queryObj.netPro):'';
  if(queryObj.netPro != '' && queryObj.netPro != '2'){
    queryObj.transPro?(queryExpression+=" and trans_pro="+queryObj.transPro):'';
  }
  queryExpression +=" group by c_time";
  queryExpression += ' order by c_time DESC limit 0,1000';
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
app.post('/trafficAll', function(req, res,next){
  var queryExpression = 'select';
  var type = toInteger(req.body.type);
  switch(type){
    case 1:queryExpression +=" sum(traffic_size) as sumData";break;
    case 2:queryExpression +=" sum(pkt_num) as sumData";break;
    case 3:queryExpression +=" sum(tuple_num) as sumData";break;
    case 4:queryExpression +=" sum(frag_num) as sumData";break;
    case 5:queryExpression +=" sum(size_1_53) as 1byte_53byte,sum(size_54_79) as 54byte_79byte,sum(size_80_159) as 80byte_159byte,sum(size_160_319) as 160byte_319byte,sum(size_320_639) as 320byte_639byte,sum(size_640_1279) as 640byte_1279byte,sum(size_1280_1518) as 1280byte_1518byte,sum(size_1519) as 1519byte_above";break;
  }
  queryExpression+=",c_time as time from capture_traffic where t_id="+req.body.id;//+"and t_start >"+req.body.start+" and t_end<"+req.body.end;
  if(type != 5){
    queryExpression +=" group by c_time";
  }
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
      if(err) return next(err);
        if(!results[0]){ //无查询结果
          var message={'status':2,'message':"无查询结果"};
          var str =  JSON.stringify(message);
          res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
          res.end(str);
        } else {  //有结果
            var data={'status':0,dataList:[]};
            var tempValue = 0;
            if(req.body.total == 'true'){
              results.forEach(function(item,index) {
                var totalvalue = {};
                tempValue+=toInteger(item.sumData);
                totalvalue.time = item.time;
                totalvalue.sumData = tempValue
                data.dataList.push(totalvalue);
              });
            }else{
              data.dataList=results;
            }            
            var str =  JSON.stringify(data); 
            res.end(str);
        }
  });
});
//查询机器
app.post('/machineFunc', function(req, res,next){
  var queryExpression = 'select m_id as id,m_name as name from machine_info where ';
  if(req.body.type == '1'){
    queryExpression += 'm_capture_flag=1';
  }else{
    queryExpression += 'm_generate_flag=1';
  }
  queryExpression+=' and m_valid_flag=1';
  console.log(queryExpression)
  db.query(queryExpression,function(err,results){
    console.log(results)
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
  })
});
//新建机器
app.post('/newMachine', function(req, res,next){
  var queryObj = req.body;
  var queryExpression = 'insert into machine_info(m_name,m_capture_flag,m_generate_flag,m_valid_flag) values("'+queryObj.machine+'",'+queryObj.capture;
  queryExpression+=','+queryObj.generate+','+queryObj.valid+')';
  console.log(queryExpression)
  db.query(queryExpression,function(err,results){
    if(err){
      console.log('插入记录出错:'+err.message);
      return next(err);
    } else {
      var data={'status':0,dataList:[]};
      var str =  JSON.stringify(data); 
      res.end(str);
    }
  });
});
//修改机器
app.post('/updateMachine', function(req, res,next){
  var queryObj = req.body;
  var queryExpression = 'update machine_info set m_capture_flag='+queryObj.capture+',m_generate_flag='+queryObj.generate+',m_valid_flag='+queryObj.valid+' where m_id='+queryObj.id;
  console.log(queryExpression)
  db.query(queryExpression,function(err,results){
    if(err){
      console.log('修改出错:'+err.message);
      return next(err);
    } else {
      var data={'status':0,dataList:[]};
      var str =  JSON.stringify(data); 
      res.end(str);
    }
  });
});
//新建任务
app.post('/newTask', function(req, res,next){
  var queryObj = req.body;
  queryObj.start = toInteger(queryObj.start);
  queryObj.end = toInteger(queryObj.end);
  var start,end;
  if(queryObj.execType == '1'){ //立即执行
    start = UTCDay(new Date());
  }else{
    if(queryObj.startTimeType == '1'){//绝对时间
      start = queryObj.start;
    }else{
      start = UTCDay(new Date()) + queryObj.start;
    }   
  }
  if(queryObj.endTimeType == '1'){//绝对时间
    if(queryObj.end < start){
      end = start;
      start = queryObj.end;
    }else{
      end = queryObj.end;
    }    
  }else{ //相对时间
    end = start + queryObj.end;
  }
  queryObj.period=queryObj.period?queryObj.period:1;
  var queryExpression = 'insert into traffic_info(m_id,t_name,t_type,t_start,t_end,t_desc,t_run_flag,t_period) values('+queryObj.machine+',"'+queryObj.name+'",'+queryObj.type+','+start+',';
  queryExpression+=end+',"'+queryObj.desc+'",0,'+queryObj.period+')';
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
    if(err){
      if(err.message == "Duplicate entry 'traffic' for key 't_name_UNIQUE'"){
        var data={'status':1,message:"任务名称重复，请重新输入"};
        var str =  JSON.stringify(data); 
        res.end(str);
      }    
      console.log('插入记录出错:'+err.message);
      return next(err);
    } else {
      var data={'status':0,message:"新建成功"};
      var str =  JSON.stringify(data); 
      res.end(str);
    }  
  })
});
//结束任务
app.post('/stopTask', function(req, res,next){
  var id = req.body.id,queryExpression;
  if(req.body.type == '2'){
    queryExpression = 'update traffic_info set t_run_flag=2 where t_id='+id;
  }else if(req.body.type == '1'){
    queryExpression = 'update generate_traffic_info set g_run_flag=2 where g_id='+id;
  }  
  console.log(queryExpression);
  db.query(queryExpression,function(err,results){
    if(err){
      console.log('任务结束出错:'+err.message);
      var data={'status':1,message:'任务结束出错'};
      var str =  JSON.stringify(data); 
      res.end(str);
      return next(err);
    } else{
      var data={'status':0,dataList:[]};
      var str =  JSON.stringify(data); 
      res.end(str);
    }  
  })
});
//生成流量
app.post('/geneTraffic', function(req, res,next){
  var queryObj = req.body;
  var start=0;
  if(queryObj.execType == '1'){  //立即执行
    start = UTCDay(new Date());
  }else if(queryObj.execType == '2'){
    if(queryObj.startTimeType == '1'){//绝对时间
      start = queryObj.start;
    }else{
      start = UTCDay(new Date()) + toInteger(queryObj.start);
    }
  }
  db.query('select max(c_time) as end from capture_traffic where t_id = '+queryObj.id,function(err,results){
    if(results[0].end == null){
      console.log('生成出错');
      var data={'status':1,message:'生成出错，请等待捕获完成'};
      var str =  JSON.stringify(data); 
      res.end(str);
      return next(err);
    }else{
      var queryExpression = 'insert into generate_traffic_info(g_end,t_id,m_id,g_start,g_name,g_desc,g_run_flag) select max(c_time),'+queryObj.id+','+queryObj.machine+','+start+',"'+queryObj.name+'","'+queryObj.desc+'",0'+' from capture_traffic where t_id = '+queryObj.id;
      console.log(queryExpression);
      db.query(queryExpression,function(err,results){
        if(err){
          console.log('生成出错:'+err.message);
          var data={'status':1,message:'生成出错'};
          var str =  JSON.stringify(data); 
          res.end(str);
          return next(err);
        } else{
          var data={'status':0,dataList:[]};
          var str =  JSON.stringify(data); 
          res.end(str);
        }  
      });
    }
  });
});
app.post('/machineAll', function(req, res,next){
  var queryExpression = 'select m_id as id,m_name as name,m_capture_flag as cap,m_generate_flag as gene,m_valid_flag as valid from machine_info order by m_id DESC';
  db.query(queryExpression,function(err,results){
      if(err) return next(err);
      if(!results[0]){ //无查询结果
        var message={'status':1,'message':"无查询结果"};
        var str =  JSON.stringify(message);
        res.writeHead(200, {"Content-Type": "text/plain",'charset':'utf-8'}); 
        res.end(str);
      } else {  //有结果
          var validArray = ['不启用','启用'];
          var capArray = ['不能捕获','捕获'];
          var geneArray = ['不能生成','生成'];            
          results.forEach(function(item, index){ 
            item.valid = validArray[item.valid];
            item.cap = capArray[item.cap];
            item.gene = geneArray[item.gene];
          });
          console.log(results);
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
        var step = toInteger(req.query.step);
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
                value[i] += toInteger(item[type]);
                if(index==results.length-1){value[i]=value[i]/num}
              }else{
                i++;               
                value[i] = toInteger(item[type]);
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
              dataArray[0]+=toInteger(item.ftp_21);
              dataArray[1]+=toInteger(item.telnet_23);
              dataArray[2]+=toInteger(item.http_80);
              dataArray[3]+=toInteger(item.smtp_25);
              dataArray[4]+=toInteger(item.pop3_110);
              dataArray[5]+=toInteger(item.elseport);
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
            dataArray[0]+=toInteger(item.size_40);
            dataArray[1]+=toInteger(item.size_41);
            dataArray[2]+=toInteger(item.size_54);
            dataArray[3]+=toInteger(item.size_55);
            dataArray[4]+=toInteger(item.size_61);
            dataArray[5]+=toInteger(item.size_101);
            dataArray[6]+=toInteger(item.size_257);
            dataArray[7]+=toInteger(item.size_513);
            dataArray[8]+=toInteger(item.size_1025);
            dataArray[9]+=toInteger(item.size_1500);
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
  var start = toInteger(req.query.start);
  var end = toInteger(req.query.end);
  // uncomment it for style example  
  // conf.stylesXmlFile = "styles.xml";
  switch (req.query.ptype){
    case "packagePer":{
      var dataArray = new Array(0,0,0,0,0,0,0,0,0,0);    
      db.query("select * from capture_traffic where t_id =? and port_id =? and net_pro =? and time >=? and time <=?",[req.query.start,req.query.end],function(err,results){ 
        if(err) return next(err);
        if(!results) return res.send(404);
        results.forEach(function(item,index){       
          dataArray[0]+=toInteger(item.size_40);
          dataArray[1]+=toInteger(item.size_41);
          dataArray[2]+=toInteger(item.size_54);
          dataArray[3]+=toInteger(item.size_55);
          dataArray[4]+=toInteger(item.size_61);
          dataArray[5]+=toInteger(item.size_101);
          dataArray[6]+=toInteger(item.size_257);
          dataArray[7]+=toInteger(item.size_513);
          dataArray[8]+=toInteger(item.size_1025);
          dataArray[9]+=toInteger(item.size_1500);
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
          dataArray[0]+=toInteger(item.ftp_21);
          dataArray[1]+=toInteger(item.telnet_23);
          dataArray[2]+=toInteger(item.http_80);
          dataArray[3]+=toInteger(item.smtp_25);
          dataArray[4]+=toInteger(item.pop3_110);
          dataArray[5]+=toInteger(item.elseport);
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
        var step = toInteger(req.query.step);
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
                value[i] += toInteger(item[ptype]);
                if(index==results.length-1){value[i]=value[i]/num}
              }else{
                i++;               
                value[i] = toInteger(item[ptype]);
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