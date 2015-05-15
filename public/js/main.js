var routeApp = angular.module('mainContent',['ngRoute']);
var legendText =['',"流量大小特征","包大小特征","五元组","分片","包长分布"];
routeApp.config(['$routeProvider',function($routeProvider){
	$routeProvider
	.when('/main',{
		templateUrl:'tpl/feature.html',
		controller:'featureCtl'
	})	
	.when('/trafficManage',{
		templateUrl:'tpl/trafficManage.html',
		controller:'manageCtl'
	})
	.when('/realTraffic',{
		templateUrl:'tpl/realTraffic.html',
		controller:'realCtl'
	})
	.when('/machineManage',{
		templateUrl:'tpl/machineManage.html',
		controller:'machineCtl'
	})
	/*.when('/feature/:type',{
		templateUrl:'tpl/featureChart.html',
		controller:'featureChartCtl'
	})
	.when('/emulate',{
		templateUrl:'tpl/emulation.html',
		controller:'emulateCtl'
	})
	.when('/login',{
		templateUrl:'login.html',
		controller:'loginCtl'
	})*/
}]);
/*
routeApp.controller('loginCtl',function($scope,$http){

});*/
routeApp.factory('trafficInfo',function(){
	return {};
});
routeApp.controller('manageCtl',function($scope,$http,trafficInfo){
	$scope.searchClick=function(e){
		var parentEle = $(e.target).parent();
		trafficInfo.trafficName = parentEle.siblings()[1].innerText;
		trafficInfo.mstartTime = parentEle.siblings()[3].innerText;
		trafficInfo.mendTime = parentEle.siblings()[4].innerText;
		trafficInfo.mid = parentEle.siblings()[5].value;
		$.cookie('trafficName', trafficInfo.trafficName, { expires: 7 }); // 存储一个带7天期限的 cookie
		$.cookie('mstartTime', trafficInfo.mstartTime, { expires: 7 });
		$.cookie('mendTime', trafficInfo.mendTime, { expires: 7 });
		$.cookie('mid', trafficInfo.mid, { expires: 7 }); 
		console.log($.cookie())
	}
	$.ajax({
		url:'/trafficInfo',
		type:'GET',
		dataType:'json',
		success:function(data){
			if(data.status==0 && data.dataList){
				$.each(data.dataList,function(index,item){
					item.end = NormalDate(UTCDay(item.start)+parseInt(item.end,10));
				});
				$scope.$apply(function(){
					$scope.infos = data.dataList;
				});
			}
		}
	});	
	$("#newTask").click(function(e){
		var type = 	$("input[name='machineType']").val();
		var machine = $("#newName").val();
		var start;
		var end;
		$.ajax({
			url:'/newTask',
			type:'POST',
			data:{type:type,machine:machine,start:start,end:end},
			dataType:'json',
			success:function(data){
				if(data.status==0){
					$('#editModal').modal('hide');
					location.reload();
				}
			}
		});
	});

	$("body").delegate("input[name='machineType']","change",function(e){	
		var type = 	$("input[name='machineType']").val();
		$.ajax({
			url:'/machineFunc',
			type:'POST',
			data:{type:type},
			dataType:'json',
			success:function(data){
				if(data.status==0 && data.dataList){
					$scope.machines = data.dataList;
				}
			}
		});
	});

	$('#newModal').on('show.bs.modal', function (event) {
	  $.ajax({
		url:'/machineAll',
		type:'POST',
		dataType:'json',
		success:function(data){
			if(data.status==0 && data.dataList){
				$scope.$apply(function(){
					$scope.machines = data.dataList;
				});
			}
		}
	  });	
	});
});

routeApp.controller('realCtl',function($scope,$http,trafficInfo){
	var myChart = echarts.init(document.getElementById('featureChart'));
	var watch = 0;
	$scope.compDis = true;
	//if($.cookie('trafficName'))
	$.cookie('trafficName') && ($scope.trafficName = $.cookie('trafficName'));
	$.cookie('mstartTime') && ($scope.mstartTime = $.cookie('mstartTime'));
	$.cookie('mendTime') && ($scope.mendTime = $.cookie('mendTime'));
	$.cookie('mid') && ($scope.mid = $.cookie('mid'));
	console.log($scope.trafficName);
	
	//$scope.radius = 180;
	var option_pie;
	var option_line = 
		{
	        title : {
	            text: ''
	        },
	        tooltip : {
	            trigger: 'item'
	        },
	        legend: {
	            data:[]
	        },
	        toolbox: {
	            show : false
	        },
	        calculable : true,
	        xAxis : [
	            {
	                type : 'category',
	                name:"时间",                       
	                data:['']
	            }
	        ],
	        yAxis : [
	            {
	                type : 'value',
	                axisLabel : {
	                    formatter: '{value}'
	                },
	                splitArea : {show : true}
	            }
	        ],
	        series : []
	    };
	
    function initOption(option,title,legend,x,series){
    	if(!option){
    		return;
    	}
    	option.series=[];
    	title?option.title.text = title:'';
    	legend?option.legend.data=legend:'';
    	x?option.xAxis[0].data = x:'';	
    	series?option.series.push(series):'';
    }
    function addOption(option,legend,x,series){
    	if(legend){
    		$.each(legend,function(index,item){
	    		option.legend.data.push(item);
	    	}); 
    	}
		option.series.push(series);
		if(option.xAxis){
			var len = option.xAxis[0].data.length;
			if(x>len){
				for(var i=0;i<len-x;i++){
					option.xAxis[0].data.push('');
				}
			}
		}		
    }
/*    $scope.trafficName = trafficInfo.trafficName;
    $scope.mstartTime = trafficInfo.mstartTime;
    $scope.mendTime = trafficInfo.mendTime;
    $scope.mid = trafficInfo.mid;*/
    $('#watch').click(function(e){
    	rt();
    	watch = setInterval(rt,5000);
    	function rt(){
    		type = $('#searchType').val();
	    	var port = $("#portId").val();
	    	var transPro = $('#transPro').val();
	    	var netPro = $("#netPro").val();
	    	var tId = $("#mid").val();

			$.ajax({
	    		url:'/realTime',
	    		data:{ctype:type,port:port,transPro:transPro,netPro:netPro,tId:tId},
	    		type:'post',
	    		dataType:'json',
	    		success:function(data){
	    			if(data.status == 0 && data.dataList){
	    				data.dataList = data.dataList.reverse();
	    				var lengendData = [];
						var valueData = [];	
						var timeData = [];
						var lineSeries = {
				            name:'',
				            type:'line',
				            data:[]
				        }
				        var option_real = 
							{
						        title : {
						            text: ''
						        },
						        tooltip : {
						            trigger: 'item'
						        },
						        legend: {
						            data:[]
						        },
						        toolbox: {
						            show : false
						        },
						        calculable : true,
						        xAxis : [
						            {
						                type : 'category',
						                name:"时间",                       
						                data:['']
						            }
						        ],
						        yAxis : [
						            {
						                type : 'value',
						                axisLabel : {
						                    formatter: '{value}'
						                },
						                splitArea : {show : true}
						            }
						        ],
						        series : []
						    };
						$scope.compDis = false;
						$scope.$apply();
						var formalTime = UTCDay($scope.mstartTime);
						lineSeries.name = $scope.trafficName;
						$.each(data.dataList,function(index,item){
					  		valueData.push(item.sumData);
							timeData.push(NormalDate(formalTime+parseInt(item.time,10)));			
						});
						lineSeries.data = valueData;
						initOption(option_real,legendText[type],[$scope.trafficName],timeData,lineSeries);
						myChart?myChart.clear():'';
						myChart.setOption(option_real);			 
	    			}
	    		}
	    	});
    	}
    });
    function search(callback){ 
    	type = $('#searchType').val();
    	var startHour = $("#startTime").val()?(UTCDay($("#startTime").val())-UTCDay($scope.mstartTime)):0;
    	var startSec = $("#startSec").val()?($("#startSec").val()>59?59:parseInt($("#startSec").val(),10)):0;
    	var startTime = startHour+startSec;
    	var endHour = $("#endTime").val()?(UTCDay($("#endTime").val())-UTCDay($scope.mstartTime)):0;
    	var endSec = $("#endSec").val()?($("#endSec").val()>59?59:parseInt($("#endSec").val(),10)):0;  
    	var endTime = endHour+endSec;
    	var timeScale = $('#timeScale').val();
    	var port = $("#portId").val();
    	var transPro = $('#transPro').val();
    	var netPro = $("#netPro").val();
    	var tId = $("#mid").val();
    	var totalBoolean = $('#totalUp').prop('checked');
    	if(startTime && endTime && startTime>endTime){
    		var temp = startTime;
    		startTime=endTimep;
    		endTime=tem;
    	}

		$.ajax({
    		url:'/trafficDetail',
    		data:{ctype:type,port:port,transPro:transPro,netPro:netPro,start:startTime,end:endTime,tId:tId,total:totalBoolean},
    		type:'post',
    		dataType:'json',
    		success:function(data){
    			if(data.status == 0 && data.dataList){
    				callback(data,type);
    				localStorage.setItem('searchData',JSON.stringify(data.dataList));					 
    			}
    		}
    	});
    }//end of search
    $("#exportExcel").click(function(e){
    	var ctype = $('#searchType').val();
    	var startHour = $("#startTime").val()?UTCDay($("#startTime").val())-UTCDay($scope.mstartTime):0;
    	var startSec =  $("#startSec").val()?($("#startSec").val()>59?59:parseInt($("#startSec").val(),10)):0;
    	var startTime = startHour+startSec;
    	var endHour = $("#endTime").val()?UTCDay($("#endTime").val())-UTCDay($scope.mstartTime):0;
    	var endSec = $("#endSec").val()?($("#endSec").val()>59?59:parseInt($("#endSec").val(),10)):0;  
    	var endTime = endHour+endSec;
    	var timeScale = $('#timeScale').val();
    	var port = $("#portId").val();
    	var transPro = $('#transPro').val();
    	var netPro = $("#netPro").val();
    	var tId = $("#mid").val();
    	var totalBoolean = $('#totalUp').prop('checked');
    	window.open("/exceldata?start="+startTime+"&end="+endTime+"&port="+port+"&ctype="+ctype+"&transPro="+transPro+"&netPro="+netPro+"&tId="+tId+"&total="+totalBoolean);
	});
    $('#searchNum').click(function(){
    	var type;
    	$scope.comCkListdata = null;
    	option_pie = {
		    title : {
		        text: '包长分布',
		        x:'center'
		    },
		    tooltip : {
		        trigger: 'item',
		        formatter: "{a} <br/>{b} : {c}个 ({d}%)"
		    },
		    legend: {
		        orient:'vertical',
		        x:'left',
		        data:[]
		    },
		    toolbox: {
		        show : false
		    },
		    calculable : false,
		    series : []
		}
    	$scope.radius = 180;
		var pieSeries = {
            name:'包总数',
            type:'pie',
            radius:[0,$scope.radius],
            itemStyle:{
            	normal:{
            		label:{
            			position:'inner'
            		},
            		labelLine:{
            			show:false
            		}
            	}
            },
            data:[]
        };	
        var lineSeries = {
            name:'',
            type:'line',
            data:[]
        }
        if(watch){
        	clearInterval(watch);
        }
        search(function(data,type){
			var lengendData = [];
			var valueData = [];	
			var timeData = [];
			$scope.compDis = false;
			$scope.$apply();
			if(type == '5'){   	
				$.each(data.dataList,function(index,item){
			  		for(name in item){
						if(name !== 'time'){
							var obj = {};
							obj.value = item[name];
							obj.name = name;
							pieSeries.data.push(obj);
							lengendData.push(name);
						}			
					}			
				});	
				initOption(option_pie,'',lengendData,'',pieSeries);
				console.log(option_pie);
				myChart?myChart.clear():'';
				myChart.setOption(option_pie);
			}else{
				var formalTime = UTCDay($scope.mstartTime);
				lineSeries.name = $scope.trafficName;
				$.each(data.dataList,function(index,item){
			  		valueData.push(item.sumData);
					timeData.push(NormalDate(formalTime+parseInt(item.time,10)));			
				});
				lineSeries.data = valueData;
				initOption(option_line,legendText[type],[$scope.trafficName],timeData,lineSeries);
				myChart?myChart.clear():'';
				myChart.setOption(option_line);
			}
        }); //end of click
    	/*$.ajax({
    		url:'/trafficInfo',
    		data:{ctype:type,port:port,transPro:transPro,netPro:netPro,start:startTime,end:endTime,tId:tId,stype:1},
    		type:'post',
    		dataType:'json',
    		success:function(data){

    			if(data.status == 0 && data.dataList){
    				var lengendData = [];
    				var valueData = [];	
    				var timeData = [];
    				$scope.compDis = false;
    				$scope.$apply();
    				if(type == '5'){   	
						$.each(data.dataList,function(index,item){
					  		for(name in item){
    							if(name !== 'time'){
    								var obj = {};
    								obj.value = item[name];
    								obj.name = name;
    								pieSeries.data.push(obj);
    								lengendData.push(name);
    							}			
    						}			
						});	
						initOption(option_pie,'',lengendData,'',pieSeries,'');
    					console.log(option_pie);
    					myChart?myChart.clear():'';
						myChart.setOption(option_pie);
					}else{
						lineSeries.name = $scope.trafficName;
						$.each(data.dataList,function(index,item){
					  		valueData.push(item.sumData);
							timeData.push(item.time);			
						});
						lineSeries.data = valueData;
						initOption(option_line,legendText[type],[$scope.trafficName],timeData,lineSeries);
						console.log(JSON.stringify(option_line));
						myChart?myChart.clear():'';
						myChart.setOption(option_line);
					}  				 
    			}
    		}
    	});*/
    });
    $("body").delegate("#chooseConfirm","click",function(e){
		var checkEle = $("input[name='comCheck']:checked");
		var checkData = [];
		var type = $('#searchType').val();
		$.each(checkEle,function(index,item){
			var obj={};
			var parentEle = $(item).parent().siblings();
			obj.id=item.id;
			obj.name=$(parentEle[0]).text();
			obj.desc=$(parentEle[1]).text();
			obj.start=$(parentEle[2]).text();
			obj.end=$(parentEle[3]).text()
			checkData.push(obj);
			$.ajax({
				url:'/trafficAll',
				type:'POST',
				dataType:'json',
				data:{type:type,id:obj.id},
				success:function(data){
					if(data.status==0 && data.dataList){
						var dataValue = [],timeValue = [];
						if(type == '5'){
							
							var outRadius = $scope.radius+20;
							$scope.radius += 50;
							var series = 
								{
									name:'包总数',
									type:'pie',
									data:[],
									radius:[outRadius,outRadius+30],
								};
							$.each(data.dataList,function(index,item){
						  		for(name in item){
	    							if(name !== 'time'){
	    								var obj = {};
	    								obj.value = item[name];
	    								obj.name = name;
	    								series.data.push(obj);
	    							}			
	    						}			
							});	
							addOption(option_pie,'','',series);
	    					//console.log(option_pie);
	    					//myChart?myChart.clear():'';
							myChart.setOption(option_pie);
						}else{
							var series = {};
							$.each(data.dataList,function(index,item){
								dataValue.push(item.sumData);
								timeValue.push(item.time);
							});
							series.name = obj.name;
							series.type = 'line';
							series.data = dataValue;
							addOption(option_line,[obj.name],timeValue,series);
							myChart.setOption(option_line);
						}	
					}
				}
			});
		});	
		$scope.$apply(function(){
			$scope.comCkListdata = checkData;
		});
		console.log(option_line);
		$('#addModal').modal('hide');
	});
    $("body").delegate("#dele_confirm","click",function(e){
		var checkEle = $("input[name='comList']:checked");
		$.each(checkEle,function(index,item){
			var sibEle = $(item).parent().siblings();
			var tid=item.id;
			var tname = sibEle[0].innerText;
			$.each($scope.comCkListdata,function(index,data) {
				if(tid == data.id){
					$scope.comCkListdata.splice(index,1);
				}
			});	
			$.each(option_line.series,function(index,item){
				if(tname == item.name){
					option_line.series.splice(index,1);
				}
			});	
			$.each(option_line.legend.data,function(index,item){
				if(tname == item){
					option_line.legend.data.splice(index,1);
				}
			});	
		});	
		$scope.$apply();
		myChart.clear();
		myChart.setOption(option_line);
		$('#deleModal').modal('hide');
	});
	$("body").delegate("#timeScale","change",function(e){
		var ele = $(e.target);
		var scale = ele.val();
		var value = [];
		var i=-1;
        var num=0;
		var sdata = JSON.parse(localStorage.getItem('searchData'));
		console.log(sdata);
		$.each(sdata,function(index,item){
			if(index%scale){
				num++;
				value[i] += parseInt(sdata[index].sumData,10);
				if(index==sdata.length-1){
					value[i]=value[i]/num;
				}
			}else{
				i++;
				value[i] = parseInt(sdata[i].sumData,10);
				if(i-1>=0){value[i-1]=value[i-1]/num;} 
                num=1;
			}
		});
		console.log(value);
		var time = [];
		var type = $("#searchType").val();
		$.each(value,function(index,item){
			time.push('');
		});
		myChart.clear();
		myChart.setOption({
	        title : {
	            text: legendText[type]
	        },
	        tooltip : {
	            trigger: 'item'
	        },
	        legend: {
	            data:[]
	        },
	        toolbox: {
	            show : false
	        },
	        calculable : true,
	        xAxis : [
	            {
	                type : 'category',
	                name:"时间",                       
	                data:time
	            }
	        ],
	        yAxis : [
	            {
	                type : 'value',
	                axisLabel : {
	                    formatter: '{value}'
	                },
	                splitArea : {show : true}
	            }
	        ],
	        series : [{
	        	data:value,
	        	name:'累计流量',
	        	type:'line'
	        }]
	    });
	});
	$("#searchType").change(function(e){
		if($(e.target).val() == '5'){
			$scope.typeDis = true;
		}else{
			$scope.typeDis = false;
		}
		$scope.$apply();
	});
/*	$("#totalUp").change(function(e){
		var sdata = JSON.parse(localStorage.getItem('searchData'));
		var type = $("#searchType").val();
		if($(e.target).prop('checked')){
			var totalvalue = [];
			var totaltime = [];
			var tempValue=0;
			$.each(sdata,function(index,item) {
				tempValue+=parseInt(item.sumData,10);
				totaltime.push(item.time);
				totalvalue.push(tempValue);
			});
			myChart.setOption({
		        title : {
		            text: legendText[type]
		        },
		        tooltip : {
		            trigger: 'item'
		        },
		        legend: {
		            data:[$scope.trafficName]
		        },
		        toolbox: {
		            show : false
		        },
		        calculable : true,
		        xAxis : [
		            {
		                type : 'category',
		                name:"时间",                       
		                data:totaltime
		            }
		        ],
		        yAxis : [
		            {
		                type : 'value',
		                axisLabel : {
		                    formatter: '{value}'
		                },
		                splitArea : {show : true}
		            }
		        ],
		        series : [{
		        	data:totalvalue,
		        	name:[$scope.trafficName],
		        	type:'line'
		        }]
		    });
		}else{
			var normtime = [];
			var normalvalue = [];
			$.each(sdata,function(index,item) {
				normtime.push(item.time);
				normalvalue.push(parseInt(item.sumData,10));
			});
			myChart.setOption({
		        title : {
		            text: legendText[type]
		        },
		        tooltip : {
		            trigger: 'item'
		        },
		        legend: {
		            data:[$scope.trafficName]
		        },
		        toolbox: {
		            show : false
		        },
		        calculable : true,
		        xAxis : [
		            {
		                type : 'category',
		                name:"时间",                       
		                data:normtime
		            }
		        ],
		        yAxis : [
		            {
		                type : 'value',
		                axisLabel : {
		                    formatter: '{value}'
		                },
		                splitArea : {show : true}
		            }
		        ],
		        series : [{
		        	data:normalvalue,
		        	name:[$scope.trafficName],
		        	type:'line'
		        }]
		    });
		}
	});*/
    $('#addModal').on('show.bs.modal', function (event) {
	  $.ajax({
		url:'/trafficInfo',
		type:'GET',
		dataType:'json',
		success:function(data){
			if(data.status==0 && data.dataList){
				$.each(data.dataList,function(index,item){
					item.end = NormalDate(UTCDay(item.start)+parseInt(start,10));
				});
				$scope.$apply(function(){
					$scope.comInfos = data.dataList;
				});
			}
		}
	  });	
	});
});
	
routeApp.controller('machineCtl',function($scope,$http){
	$.ajax({
		url:'/machineAll',
		type:'POST',
		dataType:'json',
		success:function(data){
			if(data.status==0 && data.dataList){
				$scope.$apply(function(){
					$scope.machines = data.dataList;
				});
			}
		}
	});
	$("body").delegate("#newMachine","click",function(e){
		var name = $.trim($("#newName").val());
		var capture = $("input[name='cap']:checked").val();
		var geragte = $("input[name='gene']:checked").val();
		var valid = $("input[name='valid']:checked").val();
		$.ajax({
			url:'/newMachine',
			type:'POST',
			data:{machine:name,capture:capture,generagte:geragte,valid:valid},
			dataType:'json',
			success:function(data){
				if(data.status==0){
					$('#editModal').modal('hide');
				}
			}
		});
	});
	
});
	

routeApp.controller('emulateCtl',function($scope,$http){

});
routeApp.directive('datepicker', function() {
  return{
    restrict: 'EA',
    scope: {
        error:'=dateError'
    },
    link:function(scope, element, attrs) {
      //console.log(scope.err)

      var utcStartTime,utcEndTime,err;
      element.datetimepicker({
          language:  'zh-CN',
          format: 'yyyy/mm/dd hh:ii',
          todayBtn: true,
          pickerPosition: "bottom-right",
          autoclose: true,
          startDate: "2014-01-01 00:00",
          minuteStep: 1,
          minView:0,
          maxView:1
      }).on("changeDate",function(ev){
      /*  scope.error=true;
        utcStartTime=UTCDay($("#startTime").val());
        utcEndTime=UTCDay($("#endTime").val());
        if (ev.target.id =="endTime"){
          if(utcStartTime>utcEndTime){
            alert(1);
          console.log(utcStartTime);console.log(utcEndTime)
              scope.error=true;
            scope.$parent.errMessage=false;
          }else{
            alert(2)
            scope.$parent.errMessage=true;
          }
        }*/
      });
  }
}
});
function UTCDay(daystring) {
	var dayobj=new Date(daystring);
	return dayobj.getTime()/1000;
	// return Date.UTC(dayobj.getFullYear(), dayobj.getMonth(), dayobj.getDate(), dayobj.getHours()-8, dayobj.getMinutes(), dayobj.getSeconds(), 0);
}
function NormalDate(utc){
    var date = new Date(utc*1000);
    var ndt;
    ndt = date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate()+" "+(date.getHours()+8)+":"+date.getMinutes()+":"+date.getSeconds();
    return ndt;
}