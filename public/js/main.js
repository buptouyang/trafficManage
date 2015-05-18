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
	$scope.taskInfo = {};
	$scope.searchClick=function(e){
		var parentEle = $(e.target).parent();
		trafficInfo.trafficName = parentEle.siblings()[1].innerText;
		trafficInfo.mstartTime = parentEle.siblings()[4].innerText;
		trafficInfo.mendTime = parentEle.siblings()[5].innerText;
		trafficInfo.mid = parentEle.siblings()[7].value;
		$.cookie('trafficName', trafficInfo.trafficName, { expires: 7 }); // 存储一个带7天期限的 cookie
		$.cookie('mstartTime', trafficInfo.mstartTime, { expires: 7 });
		$.cookie('mendTime', trafficInfo.mendTime, { expires: 7 });
		$.cookie('mid', trafficInfo.mid, { expires: 7 }); 
		console.log($.cookie())
	}
	$scope.stopClick=function(e){
		var parentEle = $(e.target).parent();
		var id = parentEle.siblings()[7].value;
		$.ajax({
			url:'/stopTask',
			type:'POST',
			data:{id:id},
			dataType:'json',
			success:function(data){
				if(data.status==1){
					alert(data.message);
				}else{
					$(parentEle.siblings()[3]).text('结束运行');
				}
			}
		});
	}
	$.ajax({
		url:'/trafficInfo',
		type:'GET',
		dataType:'json',
		success:function(data){
			var statusArray = ['准备运行','正在运行','结束运行'];
			if(data.status==0 && data.dataList){
				$.each(data.dataList,function(index,item){
					item.end = NormalDate(UTCDay(item.start)+parseInt(item.end,10));
					item.status = statusArray[item.status];
				});
				$scope.$apply(function(){
					$scope.infos = data.dataList;
				});
			}
		}
	});	
	$("#newTask").click(function(e){
		var type = 	$("input[name='machineType']").val();
		$scope.taskInfo.machine = $("#machineList").val();
		//开始时间
		if($scope.taskInfo.execType == '1'){ //立即执行
			$scope.taskInfo.start = 0;
		}else{
			var startSec = $("#startSec").val()?($("#startSec").val()>59?59:parseInt($("#startSec").val(),10)):0;
			if($scope.taskInfo.startTimeType == '1'){
				var startHour = $("#startTime").val()?UTCDay($("#startTime").val()):0; 	
		    	$scope.taskInfo.start = startHour+startSec;
			}else{
				$scope.taskInfo.start = startSec;
			}
		}
		//结束时间
		var endSec = $("#endSec").val()?($("#endSec").val()>59?59:parseInt($("#endSec").val(),10)):0;
		if($scope.taskInfo.endTimeType == '1'){
			var endHour = $("#endTime").val()?UTCDay($("#endTime").val()):0; 	
	    	$scope.taskInfo.end = endHour+endSec;
		}else{
			$scope.taskInfo.end = endSec;
		}
		if($scope.taskInfo.start < $scope.taskInfo.end){
			$.ajax({
				url:'/newTask',
				type:'POST',
				data:$scope.taskInfo,
				dataType:'json',
				success:function(data){
					if(data.status==0){
						$('#editModal').modal('hide');
						location.reload();
					}
				}
			});
		}else{
			$("#newModal .modal-body").append('<div class="form-group"><div class="col-sm-offset-2"><p class="text-danger">结束时间早于开始时间，请重新选择</p></div></div>');
		}
		
	});

	$("body").delegate("[name='machineType']:checked","change",function(e){	
		var type = 	$("input[name='machineType']:checked").val();
		$scope.taskInfo.type = type;
		e.stopPropagation();
		debugger
		$.ajax({
			url:'/machineFunc',
			type:'POST',
			data:{type:type},
			dataType:'json',
			success:function(data){
				if(data.status==0 && data.dataList){
					$scope.machines = data.dataList;
					$scope.$apply();
				}
			}
		});
	});

	$('#newModal').on('show.bs.modal', function (event) {
		$("#newModal input[type='radio']").trigger('change');
	 /* $.ajax({
		url:'/machineFunc',
		type:'POST',
		data:{type:1},
		dataType:'json',
		success:function(data){
			if(data.status==0 && data.dataList){
				$scope.$apply(function(){
					$scope.machines = data.dataList;
				});
			}
		}
	  });*/	
	});

	$("body").delegate("input[name='execType']","change",function(e){	
		var type = 	$("input[name='execType']:checked").val();
		$scope.taskInfo.execType = type;
		if(type == '2'){
			$(".start").css("display","block");
		}else{
			$(".start").css("display","none");
		}
	});

	$("body").delegate("input[name='startCountType']","change",function(e){	
		var type = 	$("input[name='startCountType']:checked").val();
		$scope.taskInfo.startTimeType = type;
		if(type == '1'){
			$(".startYearView").css("display","inline-block");
		}else{
			$(".startYearView").css("display","none");
		}
	});

	$("body").delegate("input[name='endCountType']","change",function(e){	
		var type = 	$("input[name='endCountType']:checked").val();
		$scope.taskInfo.endTimeType = type;
		if(type == '1'){
			$(".endYearView").css("display","inline-block");
		}else{
			$(".endYearView").css("display","none");
		}
	});
});//end 

routeApp.controller('realCtl',function($scope,$http,trafficInfo){
	 $(".container").attr('class', 'realGraph');
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
	                    formatter: function(value){
	                    	return Math.round(value/1024/1024)+'GB';
	                    }
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
    	var opLen,sLen;
    	opLen=option.series[0].data.length;
    	sLen=series.data.length
    	if(sLen>opLen){
    		//x坐标
    		for(var i=0;i<sLen-opLen;i++){
				option.xAxis[0].data.push('');
			}
			//数据
			$.each(option.series,function(index,item){
				for(var i=0;i<sLen-opLen;i++){
					item.data.push(0);						
				}	    		
	    	}); 
    	}else{
    		for(var i=0;i<opLen-sLen;i++){
				series.data.push('');
			}   		
    	}
		option.series.push(series);
/*		if(option.xAxis){
			var len;
			len = option.xAxis[0].data.length;
			if(x.length>len){
				for(var i=0;i<x.length-len;i++){
					option.xAxis[0].data.push('');
				}
			}
		}*/		
    }
/*    $scope.trafficName = trafficInfo.trafficName;
    $scope.mstartTime = trafficInfo.mstartTime;
    $scope.mendTime = trafficInfo.mendTime;
    $scope.mid = trafficInfo.mid;*/
    $('#watch').click(function(e){
    	rt();
    	watch = setInterval(rt,5000);
    	console.log(watch)
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
						                    formatter: function(value){
						                    	return Math.round(value/1024/1024)+'GB';
						                    }
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
    	var timeScale;
    	var port = $("#portId").val();
    	var transPro = $('#transPro').val();
    	var netPro = $("#netPro").val();
    	var tId = $("#mid").val();
    	var totalBoolean = $('#totalUp').prop('checked');
    	if(totalBoolean == 'true'){
    		timeScale = 1;
    	}else{
    		timeScale = $('#timeScale').val() || 1;
    	}
    	if(startTime && endTime && startTime>endTime){
    		var temp = startTime;
    		startTime=endTime;
    		endTime=tem;
    	}

		$.ajax({
    		url:'/trafficDetail',
    		data:{ctype:type,port:port,transPro:transPro,netPro:netPro,start:startTime,end:endTime,tId:tId,total:totalBoolean,scale:timeScale},
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
    	var timeScale = $('#timeScale').val() || 1;
    	var port = $("#portId").val();
    	var transPro = $('#transPro').val();
    	var netPro = $("#netPro").val();
    	var tId = $("#mid").val();
    	var totalBoolean = $('#totalUp').prop('checked');
    	window.open("/exceldata?start="+startTime+"&end="+endTime+"&port="+port+"&ctype="+ctype+"&transPro="+transPro+"&netPro="+netPro+"&tId="+tId+"&total="+totalBoolean);
	});
    $('#searchNum').click(function(){
    	myChart?myChart.clear():'';
    	if(watch){
        	clearInterval(watch);
        }
        console.log(watch);
    	var type;
    	$scope.comCkListdata = [];
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
        
        search(function(data,type){
			var lengendData = [];
			var valueData = [];	
			var timeData = [];
			$scope.compDis = false;
			$scope.$apply();
			//
/*			var i=-1;
			var num = 0;
			var value = [];
			var total = 0;
			var scale = $('#timeScale').val() || 1;
			var results = data.dataList;
			results.forEach(function(item,index) {
              if(index%scale){
                num++;
                total += parseInt(item.sumData,10);
                if(index==results.length-1){
                  value[i]={};
                  value[i].sumData=total/num;
                  value[i].time = item.time;
                }
              }else{

                if(i>=0){ 
                	value[i]={};
                  value[i].sumData=total/num;
                  value[i].time = results[index-1].time;
                }
                total = parseInt(item.sumData,10);                 
                i++;
                num=1;
              }
            });
            console.log(value)*/
            //
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
	$scope.comCkListdata = [];
    $("body").delegate("#chooseConfirm","click",function(e){
    	e.stopPropagation();
    	myChart?myChart.clear():'';
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
			$scope.comCkListdata.push(obj);
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
		$scope.$apply();
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
	/*$("body").delegate("#timeScale","change",function(e){
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
	});*/
	$("#searchType").change(function(e){
		if($(e.target).val() == '5'){
			$scope.typeDis = true;
			$scope.scaleDis = true;
		}else{
			$scope.typeDis = false;
			$scope.scaleDis = false;
		}
		$scope.$apply();
	});
	$("#totalUp").change(function(e){
    	var totalBoolean = $('#totalUp').prop('checked');
		if(totalBoolean==true){
			$scope.scaleDis = true;
		}else{
			$scope.scaleDis = false;
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
					item.end = NormalDate(UTCDay(item.start)+parseInt(item.end,10));
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
	$("body").delegate(".edit","click",function(e){
		var btn = e.target;
		var id = $("#newName").attr('data');
		var name = $.trim($("#newName").val());
		var capture = $("input[name='cap']:checked").val();
		var generate = $("input[name='gene']:checked").val();
		var valid = $("input[name='valid']:checked").val();
		if(btn.id == 'newBtn'){
			$.ajax({
				url:'/newMachine',
				type:'POST',
				data:{machine:name,capture:capture,generate:generate,valid:valid},
				dataType:'json',
				success:function(data){
					if(data.status==0){
						$('#editModal').modal('hide');
						location.reload();
					}
				}
			});
		}else if(btn.id == 'updateBtn'){
			$.ajax({
				url:'/updateMachine',
				type:'POST',
				data:{machine:name,capture:capture,generate:generate,valid:valid,id:id},
				dataType:'json',
				success:function(data){
					if(data.status==0){
						$('#editModal').modal('hide');
						location.reload();
					}
				}
			});
		}
		
	});
	$('#editModal').on('show.bs.modal', function (event) {
		var modal = $(this);
		var button = $(event.relatedTarget) // Button that triggered the modal
		if($(button)[0].name=="editMachine"){
			modal.find("#updateBtn").css('display','inline-block');
			modal.find("#newBtn").css('display','none');
			
			var arr = new Array();
			var valid = {"启用":0,"不启用":1};
			var cap = {'捕获':0,"不能捕获":1};
			var gene = {'生成':0,"不能生成":1};
			var tdTem = button.parent().siblings();

			// Extract info from data-* attributes
			// If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
			// Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
			modal.find("#newName").attr('data',$(tdTem[5]).val());
			modal.find('#newName').val($(tdTem[1]).text());
			modal.find("input[name='cap']").eq(cap[$(tdTem[3]).text()]).prop("checked","checked");
			modal.find("input[name='gene']").eq(gene[$(tdTem[4]).text()]).prop("checked","checked");
			modal.find("input[name='valid']").eq(valid[$(tdTem[2]).text()]).prop("checked","checked");
		}else if($(button)[0].name=="addMachine"){
			modal.find("#updateBtn").css('display','none');
			modal.find("#newBtn").css('display','inline-block');
			modal.find('#newName').val('');
			modal.find("input[name='cap']").eq(0).prop("checked","checked");
			modal.find("input[name='gene']").eq(0).prop("checked","checked");
			modal.find("input[name='valid']").eq(0).prop("checked","checked");			
		}
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
    function checkTime(i){
	    if (i<10){
	        i = "0" + i;
	    }
	    return i;
	}
    ndt = date.getFullYear()+"/"+checkTime(date.getMonth()+1)+"/"+checkTime(date.getDate())+" "+checkTime(date.getHours())+":"+checkTime(date.getMinutes())+":"+checkTime(date.getSeconds());
    return ndt;
}