var routeApp = angular.module('mainContent',['ngRoute']);
var legendText =['特征',"流量大小特征(MB/S)","包数特征(个)","五元组(个)","分片(个)","包长分布(百分比)"];
var nameSeries = {size:'流量大小(MB/S)',pkt:'包数(个)',tuple:'五元组(个)',frag:'分片(个)'};
routeApp.config(['$routeProvider',function($routeProvider){
	$routeProvider
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
	/*.other({
		redirectTo:'/index.html'
	});*/
}]); 

routeApp.factory('trafficInfo',function(){
	return {};
});
routeApp.controller('manageCtl',function($scope,$http,trafficInfo){
	$scope.taskInfo = {};
	$scope.geneTaskInfo = {};
	$scope.period = 1;
	$scope.searchClick=function(e){
		var parentEle = $(e.target).parent();
		trafficInfo.trafficName = parentEle.siblings()[1].innerHTML;
		trafficInfo.mstartTime = parentEle.siblings()[6].innerHTML;
		trafficInfo.mendTime = parentEle.siblings()[7].innerHTML;
		trafficInfo.mid = parentEle.siblings()[8].value;
		$.cookie('trafficName', trafficInfo.trafficName, { expires: 7 }); // 存储一个带7天期限的 cookie
		$.cookie('mstartTime', trafficInfo.mstartTime, { expires: 7 });
		$.cookie('mendTime', trafficInfo.mendTime, { expires: 7 });
		$.cookie('mid', trafficInfo.mid, { expires: 7 }); 
		console.log($.cookie());
	}

	 
/*	$scope.generateClick=function(e){
		var parentEle = $(e.target).parent();
		var id = parentEle.siblings()[8].value;
		$.ajax({
			url:'/geneTraffic',
			type:'POST',
			data:{id:id},
			dataType:'json',
			success:function(data){
				if(data.status==1){
					alert(data.message);
				}else{
					$(e.target).prop('disabled','true');
					$scope.infos.forEach(function(item,index) {
						if(item.id == id){
							item.status = '结束运行'; 
							item.disable = 'true';
						}
					});
					//$(parentEle.siblings()[3]).text('结束运行');
				}
			}
		});
	}*/
	$scope.stopClick=function(e){
		var parentEle = $(e.target).parent();
		var id = parentEle.siblings()[8].value;
		var type;
		var typeArray={'生成':1,'捕获':2};
		$scope.infos.forEach(function(item,index) {
			if(item.id == id){
				type = typeArray[item.type]; 
				return false;
			}
		});
		$.ajax({
			url:'/stopTask',
			type:'POST',
			data:{id:id,type:type},
			dataType:'json',
			success:function(data){
				if(data.status==1){
					alert(data.message);
				}else{
					$(e.target).prop('disabled','true');
					$scope.infos.forEach(function(item,index) {
						if(item.id == id){
							item.status = '结束运行'; 
							item.disable = 'true';
							return false;
						}
					});
					$scope.$apply()
				}
			}
		});
	}
	$scope.geneClick=function(e){
		var parentEle = $(e.target).parent();
		$scope.geneTaskInfo.id = $($(parentEle).siblings()[8]).val();
		$scope.geneTaskInfo.desc = '依赖于流量：'+$($(parentEle).siblings()[1]).text();
	}
	$scope.query=function(e){
		var query = $.trim($('#queryString').val());
		$("#pagination-traffic").remove();
		$scope.getList(query,1);
	}
	$scope.getList = function(query,page){
		$scope.page = 1;
		
		$.ajax({
			url:'/trafficInfo',
			type:'GET',
			data:{queryStr:query,page:page},
			dataType:'json',
			success:function(data){
				var statusArray = ['准备运行','正在运行','结束运行'];
				if(data.status==0 && data.dataList){
					$.each(data.dataList,function(index,item){
						//item.end = NormalDate(UTCDay(item.start)+parseInt(item.end,10));
						item.status = statusArray[item.status];
						item.name = item.name?item.name:'';
						item.descript = item.descript?item.descript:'';
					});
					$scope.$apply(function(){
						$scope.infos = data.dataList;	
					});
				}
				$(".trafficDesc").append('<ul id="pagination-traffic" class="pagination-sm pull-right"></ul>');
				$('#pagination-traffic').twbsPagination({
			        totalPages: data.totalPng,
			        visiblePages: 5,
			        first:'第一页',
			        prev:'前一页',
			        next:'后一页',
			        last:'最后一页',
			        onPageClick: function (event, page) {
			        	var query = $.trim($('#queryString').val());
			            $scope.getList(query,page);
			            $scope.page = page;
			        }
			    });		    
			}
		});
	}
	$('#pagination-traffic').remove();
	$scope.getList('',1);
	$scope.page = 1;	
	$("#newTask").click(function(e){
		var name = $("#taskName").val().substring(0,120);
		$scope.taskInfo.type = 1;      //$("input[name='machineType']").val();
		$scope.taskInfo.machine = $("#machineList").val();
		$scope.taskInfo.desc = $('#desc').val().substring(0,120);
		//开始时间
		if($scope.taskInfo.execType == '1'){ //立即执行
			$scope.taskInfo.start = 0;
		}else{
			var startSec = $("#startSec").val()?parseInt($("#startSec").val(),10):0;
			if($scope.taskInfo.startTimeType == '1'){
				var startHour = $("#startTime").val()?UTCDay($("#startTime").val()):0; 	
		    	$scope.taskInfo.start = startHour+startSec;
			}else{
				$scope.taskInfo.start = startSec;
			}
		}
		//结束时间
		var endSec = $("#endSec").val()?parseInt($("#endSec").val(),10):0;
		if($scope.taskInfo.endTimeType == '1'){
			var endHour = $("#endTime").val()?UTCDay($("#endTime").val()):0; 	
	    	$scope.taskInfo.end = endHour+endSec;
		}else{
			$scope.taskInfo.end = endSec;
		}
		var period = Math.round($("#period").val());
		if(period && period >=1){
			$scope.taskInfo.period = period;
			$scope.period = period;
		}else{
			$scope.taskInfo.period = 1;
			$scope.period = 1;
		}
		
		if(name != ''){
			$scope.taskInfo.name = name;
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
						}else{
							alert(data.message);
						}
					}
				});
			}else{
				$("#newModal .modal-body .text-danger").html('结束时间早于开始时间，请重新选择');
			}
		}else{
			alert("任务名称必填");
		}		
	});
	$("#geneNewTask").click(function(e){
		$scope.geneTaskInfo.machine = $("#geneMachineList").val();
		$scope.geneTaskInfo.name = $("#geneTaskName").val().substring(0,120);
		//开始时间
		if($scope.geneTaskInfo.execType == '1'){ //立即执行
			$scope.geneTaskInfo.start = 0;
		}else{
			var startSec = $("#geneStartSec").val()?parseInt($("#geneStartSec").val(),10):0;
			if($scope.geneTaskInfo.startTimeType == '1'){
				var startHour = $("#geneStartTime").val()?UTCDay($("#geneStartTime").val()):0; 	
		    	$scope.geneTaskInfo.start = startHour+startSec;
			}else{
				$scope.geneTaskInfo.start = startSec;
			}
		}
		$.ajax({
			url:'/geneTraffic',
			type:'POST',
			data:$scope.geneTaskInfo,
			dataType:'json',
			success:function(data){
				if(data.status==0){
					$('#geneModal').modal('hide');
					location.reload();
				}else{
					alert(data.message);
				}
			}
		});	
	});

/*	$("body").delegate("[name='machineType']:checked","change",function(e){	
		var type = 	$("input[name='machineType']:checked").val();
		$scope.taskInfo.type = type;
		e.stopPropagation();
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
	});*/

	$('#newModal').on('show.bs.modal', function (event) {
		//event.stopPropagation(); 
		$("#newModal .modal-body .text-danger").html('');

		if(event.target.id == 'endTime' || event.target.id == 'startTime'){

		}else{
			$("#newModal input[type='radio']").trigger('change');
			$.ajax({
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
			});
		}			
	});
	$('#geneModal').on('show.bs.modal', function (event) {
		$("#geneModal input[type='radio']").trigger('change');
		$.ajax({
			url:'/machineFunc',
			type:'POST',
			data:{type:2},
			dataType:'json',
			success:function(data){
				if(data.status==0 && data.dataList){
					$scope.$apply(function(){
						$scope.genemachines = data.dataList;
					});
				}
			}
		});	
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
	$("body").delegate("input[name='geneExecType']","change",function(e){	
		var type = 	$("input[name='geneExecType']:checked").val();
		$scope.geneTaskInfo.execType = type;
		if(type == '2'){
			$(".geneStart").css("display","block");
		}else{
			$(".geneStart").css("display","none");
		}
	});
	$("body").delegate("input[name='geneStartCountType']","change",function(e){	
		var type = 	$("input[name='geneStartCountType']:checked").val();
		$scope.geneTaskInfo.startTimeType = type;
		if(type == '1'){
			$(".geneStartYearView").css("display","inline-block");
		}else{
			$(".geneStartYearView").css("display","none");
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
	$scope.lenArray = [{name:$scope.trafficName}];
	//$scope.radius = 180;
	var option_pie;
	var option_line = 
		{
	        title : {
	            text: '',
	            subtextStyle:{
	            	baseline:'top',
	            	color:'red'
	            },
	            padding:10,
	            itemGap:-25
	        },
	        tooltip : {
	            trigger: 'item'
	        },
	        legend: {
	            data:[],
	            padding:[5,5,5,500]
	        },
	        toolbox: {
	            show : false
	        },
	        dataZoom : {
		        show : true,
		        realtime : true,
		        start : 0,
		        end : 100
		    },
	        calculable : true,
	        xAxis : [
	            {
	                type : 'category',
	                /*name:"时间", */                      
	                data:['']
	            }
	        ],
	        yAxis : [
	            {
	                type : 'value',
	                splitNumber:50000,
	                axisLabel : {
	                    formatter: function(value){
	                    	return Math.round(value);
	                    	//Math.round(value)+'GB';
	                    },
	                    interval:1048576
	                },
	                splitArea : {show : true}
	            }/*,
	            {
		            type : 'value',
		            splitNumber: 10,
		            axisLabel : {
		                formatter: function (value) {
		                    return value 
		                }
		            },
		            splitLine : {
		                show: false
		            }
		        }*/
	        ],
	        series : ['']
	    };
	$.ajax({
		url:'/netInfo',
		type:'get',
		dataType:'json',
		success:function(data){
			if(data.status == 0 && data.dataList){
				$scope.net = data.dataList;
				$("#netPro").trigger('change');
				$scope.$apply();
			}
		}
	});
	$("#netPro").change(function(e){
		getTransport($("#netPro"),'');
	});
/*	$("#cp_netPro").change(function(e){
		getTransport($("#cp_netPro"),'cp_');
	});*/
	function getTransport(ele,pre){
		var id = ele.val();
		if(id == '' || id == '2'){
			$scope[pre+'transDis'] = true;
		}else{
			$scope[pre+'transDis'] = false;
		}
		$.ajax({
			url:'/transInfo',
			type:'get',
			data:{id:id},
			dataType:'json',
			success:function(data){
				if(data.status == 0 && data.dataList){
					$scope[pre+'trans'] = data.dataList;
					$scope.$apply();
				}
			}
		});
	}
    function initOption(option,title,legend,x,series){
    	if(!option){
    		return;
    	}
    	option.series=[];
    	title?option.title.text = title:'';
    	legend?option.legend.data=legend:'';
    	x?option.xAxis[0].data = x:'';	
    	//series?option.series.push(series):'';
    	option.series=series?series:'';
    }
    function addOption(option,legend,x,series,type){
    	if(legend){
    		$.each(legend,function(index,item){
	    		option.legend.data.push(item);
	    	}); 
    	}
    	var opLen,sLen;
    	opLen=option.series[0].data.length; //原数据
    	sLen=series.data.length; //series 需要添加的数据
    	if(sLen>opLen){
    		//x坐标
    		for(var i=0;i<sLen-opLen;i++){
				option.xAxis[0].data.push('');
			}
			//数据
			if(type =='normal'){
				$.each(option.series,function(index,item){
					for(var i=0;i<sLen-opLen;i++){
						item.data.push(0);						
					}	    		
		    	}); 
			}else if(type =='total'){  //改原数据
				$.each(option.series,function(index,item){
					for(var i=0;i<sLen-opLen;i++){
						item.data.push(item.data[opLen-1]);						
					}	    		
		    	});
			}
			
    	}else{ //修改新加数据
    		if(type =='normal'){
				for(var i=0;i<opLen-sLen;i++){
					series.data.push(0);
				} 
			}else if(type =='total'){  //改原数据
				for(var i=0;i<opLen-sLen;i++){
					series.data.push(series.data[series.data.length-1]);
				} 
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
    function addPie(option,series){
    	var len = option.series.length;
    	var innerRadius = 150+(len-1)*50;
    	series.radius = [innerRadius,innerRadius+30];
    	option.series.push(series);
    }
/*    $scope.trafficName = trafficInfo.trafficName;
    $scope.mstartTime = trafficInfo.mstartTime;
    $scope.mendTime = trafficInfo.mendTime;
    $scope.mid = trafficInfo.mid;*/
    $('#watch').click(function(e){
    	rt();
    	if(watch){
        	clearInterval(watch);
        }
        $(e.target).css("background-color","#d9534f");
    	watch = setInterval(rt,5000);
    	console.log(watch)
    	function rt(){
    		var type = $('#searchType').val();
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
					    if(type=='0'){
					    	$('.graph_content').css('display','block');
					    	$('.right_content').css('display','none');
					    	var option_size={title:{text:"",padding:10},tooltip:{trigger:"item"},legend:{data:[]},toolbox:{show:false},calculable:true,
					    	xAxis:[{type:"category",data:[""]}],yAxis:[{type:"value",
					    	axisLabel:{formatter:function(value){return Math.round(value/1024/1024)}},splitArea:{show:true}}],series:[]};
					    	var option_pkt={title:{text:"",padding:10},tooltip:{trigger:"item"},legend:{data:[]},toolbox:{show:false},calculable:true,
					    	xAxis:[{type:"category",data:[""]}],yAxis:[{type:"value",
					    	axisLabel:{formatter:function(value){return Math.round(value)}},splitArea:{show:true}}],series:[]};
					    	var option_tuple={title:{text:"",padding:10},tooltip:{trigger:"item"},legend:{data:[]},toolbox:{show:false},calculable:true,
					    	xAxis:[{type:"category",data:[""]}],yAxis:[{type:"value",
					    	axisLabel:{formatter:function(value){return Math.round(value)}},splitArea:{show:true}}],series:[]};
					    	var option_frag={title:{text:"",padding:10},tooltip:{trigger:"item"},legend:{data:[]},toolbox:{show:false},calculable:true,
					    	xAxis:[{type:"category",data:[""]}],yAxis:[{type:"value",
					    	axisLabel:{formatter:function(value){return Math.round(value)}},splitArea:{show:true}}],series:[]};
					    	var totalseries={size:[],pkt:[],tuple:[],frag:[]};
					    	var timeData = [];
					    	$scope.compDis = true;
							$scope.$apply();
							var formalTime = UTCDay($scope.mstartTime);
							var sizeChart = echarts.init(document.getElementById('sizeChart'));
							var pktChart = echarts.init(document.getElementById('pktChart'));
							var tupleChart = echarts.init(document.getElementById('tupleChart'));
							var fragChart = echarts.init(document.getElementById('fragChart'));
							$.each(data.dataList,function(index,item){
								if(index != 'time' && item.length > 0){
									var lineSeries = {
							            name:'',
							            type:'line',
							            data:[]
							        };
									lineSeries.data = item;
									lineSeries.name = nameSeries[index];
									//legend.push(nameSeries[index]);
									totalseries[index].push(lineSeries);
								}		
							});
							$.each(data.dataList.time,function(index,item){
								timeData.push(NormalDate(formalTime+parseInt(item,10)));		
							});
							initOption(option_size,legendText[1],[$scope.trafficName],timeData,totalseries['size']);
							initOption(option_pkt,legendText[2],[$scope.trafficName],timeData,totalseries['pkt']);
							initOption(option_tuple,legendText[3],[$scope.trafficName],timeData,totalseries['tuple']);
							initOption(option_frag,legendText[4],[$scope.trafficName],timeData,totalseries['frag']);
							sizeChart?sizeChart.clear():'';
							pktChart?pktChart.clear():'';
							tupleChart?tupleChart.clear():'';
							fragChart?fragChart.clear():'';
							sizeChart.setOption(option_size);
							pktChart.setOption(option_pkt);
							tupleChart.setOption(option_tuple);
							fragChart.setOption(option_frag);
					    }else{
					    	$('.graph_content').css('display','none');
					    	$('.right_content').css('display','block');
					    	var lengendData = [];
							var valueData = [];	
							var timeData = [];
					        var totalseries = [];
					        var legend = [];
					        var option_real = 
								{
							        title : {
							            text: '',
							            padding:10
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
							                /*name:"时间",  */                     
							                data:['']
							            }
							        ],
							        yAxis : [
							            {
							                type : 'value',
							                axisLabel : {
							                    formatter: function(value){
							                    	return Math.round(value/1024/1024);
							                    }
							                },
							                splitArea : {show : true}
							            }
							        ],
							        series : []
							    };
					    	$scope.compDis = true;
							$scope.$apply();
							var formalTime = UTCDay($scope.mstartTime);
							$.each(data.dataList,function(index,item){
								if(index != 'time' && item.length > 0){
									var lineSeries = {
							            name:'',
							            type:'line',
							            data:[]
							        };
									lineSeries.data = item;
									lineSeries.name = nameSeries[index];
									if(index == 'tuple' || index == 'frag' || index == 'pkt'){
										option_real.yAxis[0].axisLabel={formatter: '{value}'};
									}else{
										option_real.yAxis[0].axisLabel={formatter: function(value){
							                    	return Math.round(value/1024/1024);
							                    }};
									}
									legend.push(nameSeries[index]);
									totalseries.push(lineSeries);
								}		
							});
							$.each(data.dataList.time,function(index,item){
								timeData.push(NormalDate(formalTime+parseInt(item,10)));		
							});
							initOption(option_real,legendText[type],legend,timeData,totalseries);
							myChart?myChart.clear():'';
							myChart.setOption(option_real);	
					    }								 
	    			}
	    		}
	    	});
    	}
    });
    function search(callback){
    	$scope.type =  $('#searchType').val();
    	$scope.port = $("#portId").val();
    	$scope.transPro = $('#transPro').val();
    	$scope.netPro = $("#netPro").val();
    	$scope.scale = $('#timeScale').val() || 1;
    	$scope.totalBoolean = $('#totalUp').prop('checked');
    	
    	var startHour = $("#startTime").val()?(UTCDay($("#startTime").val())-UTCDay($scope.mstartTime)):0;
    	//var startHour = $("#startTime").val()?UTCDay($("#startTime").val()):0;
    	var startSec = $("#startSec").val()?($("#startSec").val()>59?59:parseInt($("#startSec").val(),10)):0;
    	var startTime = startHour+startSec;
    	var endHour = $("#endTime").val()?(UTCDay($("#endTime").val())-UTCDay($scope.mstartTime)):0;
    	//var endHour = $("#endTime").val()?UTCDay($("#endTime").val()):0;
    	var endSec = $("#endSec").val()?($("#endSec").val()>59?59:parseInt($("#endSec").val(),10)):0;  
    	var endTime = endHour+endSec;
    	var tId = $("#mid").val();
    	var timeScale,port,transPr,totalBoolean;
    	type = $scope.type;
    	totalBoolean = $scope.totalBoolean;
    	port = $scope.port;
    	transPro = $scope.transPro;
    	netPro = $scope.netPro;
    	timeScale = $scope.scale;
    	/*if(totalBoolean == true){
    		timeScale = 1;
    	}else{
    		timeScale = $('#timeScale').val() || 1;
    	}*/
    	if(startTime && endTime && startTime>endTime){
    		var temp = startTime;
    		startTime=endTime;
    		endTime=temp;
    	}

		$.ajax({
    		url:'/trafficDetail',
    		data:{ctype:type,port:port,transPro:transPro,netPro:netPro,start:startTime,end:endTime,tId:tId,total:totalBoolean,scale:timeScale},
    		type:'post',
    		dataType:'json',
    		success:function(data){
    			if(data.status == 0 && data.dataList){
    				callback(data,type,totalBoolean);
    				//localStorage.setItem('searchData',JSON.stringify(data.dataList));					 
    			}
    		}
    	});
    }//end of search
    $("#exportExcel").click(function(e){
    	if(watch){
        	clearInterval(watch);
        }
        $("#watch").css("background-color","#f0ad4e");
    	var ctype = $('#searchType').val();
    	//var startHour = $("#startTime").val()?UTCDay($("#startTime").val())-UTCDay($scope.mstartTime):0;
    	var startHour = $("#startTime").val()?UTCDay($("#startTime").val()):0;
    	var startSec =  $("#startSec").val()?($("#startSec").val()>59?59:parseInt($("#startSec").val(),10)):0;
    	var startTime = startHour+startSec;
    	//var endHour = $("#endTime").val()?UTCDay($("#endTime").val())-UTCDay($scope.mstartTime):0;
    	var endHour = $("#endTime").val()?UTCDay($("#endTime").val()):0;
    	var endSec = $("#endSec").val()?($("#endSec").val()>59?59:parseInt($("#endSec").val(),10)):0;  
    	var endTime = endHour+endSec;
    	var timeScale = parseInt($('#timeScale').val()) || 1;
    	var port = $("#portId").val();
    	var transPro = $('#transPro').val();
    	var netPro = $("#netPro").val();
    	var tId = $("#mid").val();
    	var totalBoolean = $('#totalUp').prop('checked');
    	if(startTime && endTime && startTime>endTime){
    		var temp = startTime;
    		startTime=endTime;
    		endTime=temp;
    	}
    	window.open("/exceldata?start="+startTime+"&end="+endTime+"&port="+port+"&ctype="+ctype+"&transPro="+transPro+"&netPro="+netPro+"&tId="+tId+"&total="+totalBoolean+"&scale="+timeScale);
	});
    $('#searchNum').click(function(){
    	myChart?myChart.clear():'';
    	$("#watch").css("background-color","#f0ad4e");
    	if(watch){
        	clearInterval(watch);
        }
        console.log(watch);
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
    	var pieRadius = 130;
		var pieSeries = [{
            name:'',
            type:'pie',
            radius:[0,pieRadius],
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
        }];	
       /* var lineSeries = [{
            name:'',
            type:'line',
            data:[]
        }]*/
        
        search(function(data,type,totalBoolean){
			var lengendData = [];
			var valueData = [];	
			var timeData = [];
			if(type != '0'){
				$scope.compDis = false;
			}
			
			$scope.$apply();
			if(type == '5'){   	
				$.each(data.dataList,function(index,item){
			  		for(name in item){
						if(name !== 'time'){
							var obj = {};
							obj.value = item[name];
							obj.name = name;
							pieSeries[0].data.push(obj);
							lengendData.push(name);
						}			
					}			
				});	
				pieSeries[0].name = $scope.trafficName;
				initOption(option_pie,'',lengendData,'',pieSeries);
				console.log(option_pie);
				myChart?myChart.clear():'';
				myChart.setOption(option_pie);
			}else{
				if(type == '0'){
					$('.graph_content').css('display','block');
					$('.right_content').css('display','none');
					var option_size={title:{text:"",padding:10},tooltip:{trigger:"item"},dataZoom:{show:true,realtime:true,start:0,end:100},legend:{data:[]},toolbox:{show:false},calculable:true,
			    	xAxis:[{type:"category",data:[""]}],yAxis:[{type:"value",
			    	axisLabel:{formatter:function(value){return Math.round(value/1024/1024)}},splitArea:{show:true}}],series:[]};
			    	var option_pkt={title:{text:"",padding:10},tooltip:{trigger:"item"},dataZoom:{show:true,realtime:true,start:0,end:100},legend:{data:[]},toolbox:{show:false},calculable:true,
			    	xAxis:[{type:"category",data:[""]}],yAxis:[{type:"value",
			    	axisLabel:{formatter:function(value){return Math.round(value)}},splitArea:{show:true}}],series:[]};
			    	var option_tuple={title:{text:"",padding:10},tooltip:{trigger:"item"},dataZoom:{show:true,realtime:true,start:0,end:100},legend:{data:[]},toolbox:{show:false},calculable:true,
			    	xAxis:[{type:"category",data:[""]}],yAxis:[{type:"value",
			    	axisLabel:{formatter:function(value){return Math.round(value)}},splitArea:{show:true}}],series:[]};
			    	var option_frag={title:{text:"",padding:10},tooltip:{trigger:"item"},dataZoom:{show:true,realtime:true,start:0,end:100},legend:{data:[]},toolbox:{show:false},calculable:true,
			    	xAxis:[{type:"category",data:[""]}],yAxis:[{type:"value",
			    	axisLabel:{formatter:function(value){return Math.round(value)}},splitArea:{show:true}}],series:[]};
			    	var totalseries={size:[],pkt:[],tuple:[],frag:[]};
			    	var timeData = [];
					var formalTime = UTCDay($scope.mstartTime);
					var sizeChart = echarts.init(document.getElementById('sizeChart'));
					var pktChart = echarts.init(document.getElementById('pktChart'));
					var tupleChart = echarts.init(document.getElementById('tupleChart'));
					var fragChart = echarts.init(document.getElementById('fragChart'));
					$.each(data.dataList,function(index,item){
						if(index != 'time' && item.length > 0){
							var lineSeries = {
					            name:'',
					            type:'line',
					            data:[]
					        };
							lineSeries.data = item;
							lineSeries.name = nameSeries[index];
							totalseries[index].push(lineSeries);
						}		
					});
					$.each(data.dataList.time,function(index,item){
						timeData.push(NormalDate(formalTime+parseInt(item,10)));		
					});
					var sizetitle = totalBoolean ? '流量大小(MB)':legendText[1];
					initOption(option_size,sizetitle,[$scope.trafficName],timeData,totalseries['size']);
					initOption(option_pkt,legendText[2],[$scope.trafficName],timeData,totalseries['pkt']);
					initOption(option_tuple,legendText[3],[$scope.trafficName],timeData,totalseries['tuple']);
					initOption(option_frag,legendText[4],[$scope.trafficName],timeData,totalseries['frag']);
					sizeChart?sizeChart.clear():'';
					pktChart?pktChart.clear():'';
					tupleChart?tupleChart.clear():'';
					fragChart?fragChart.clear():'';
					sizeChart.setOption(option_size);
					pktChart.setOption(option_pkt);
					tupleChart.setOption(option_tuple);
					fragChart.setOption(option_frag);
				}else{
					$('.graph_content').css('display','none');
					$('.right_content').css('display','block');
					var formalTime = UTCDay($scope.mstartTime);
					var legend = [],totalseries = [];
					var title = totalBoolean && type == 1 ? '流量大小(MB)':legendText[type];
					$scope.lenArray[0].len = data.dataList['size'].length;
					$.each(data.dataList,function(index,item){
						if(index != 'time' && item.length > 0){
							var lineSeries = {
					            name:'',
					            type:'line',
					            data:[]
					        };
							lineSeries.data = item;
							lineSeries.name = $scope.trafficName;
							if(index == 'size'){
								option_line.yAxis[0].axisLabel.formatter=function(value){
									return Math.round(value/1024/1024);
								}
							}else{
								option_line.yAxis[0].axisLabel.formatter=function(value){
									return Math.round(value);
								}
							}
							totalseries.push(lineSeries);
							if(totalBoolean && type != '0'){
								option_line.title.subtext='总量:'+lineSeries.data[lineSeries.data.length-1];
							}else{
								option_line.title.subtext='';
							}
						}	
					});
					$.each(data.dataList.time,function(index,item){
						timeData.push(NormalDate(formalTime+parseInt(item,10)));		
					});				
					initOption(option_line,title,[$scope.trafficName],timeData,totalseries);
					myChart?myChart.clear():'';
					myChart.setOption(option_line);
				}
			}
        }); //end of click
    });
	$scope.comCkListdata = [];
    $("body").delegate("#chooseConfirm","click",function(e){
    	e.stopPropagation();
    	myChart?myChart.clear():'';
		var checkEle = $("input[name='comCheck']:checked");
		var checkData = [];
		var type = $scope.type;
		var scale = $scope.scale;
		var totalBoolean = $scope.totalBoolean;
		var port = $scope.port;
		var netPro = $scope.netPro;
		var transPro = $scope.transPro;
		$.each(checkEle,function(index,item){
			var obj={};
			var parentEle = $(item).parent().siblings();
			obj.id=item.id;
			obj.name=$(parentEle[0]).text();
			obj.desc=$(parentEle[1]).text();
			obj.start=$(parentEle[2]).text();
			obj.end=$(parentEle[3]).text()
			$.ajax({
				url:'/trafficAll',
				type:'POST',
				dataType:'json',
				data:{type:type,id:obj.id,total:totalBoolean,scale:scale,port:port,netPro:netPro,transPro:transPro},
				success:function(data){
					if(data.status==0){
						var dataValue = [],timeValue = [];
						$scope.comCkListdata.push(obj);
						$scope.$apply();
						if(type == '5'){
							var series = 
								{
									name:obj.name,
									type:'pie',
									data:[],
									radius:[]
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
							addPie(option_pie,series);
	    					myChart?myChart.clear():'';
							myChart.setOption(option_pie);
						}else{
							var series = {};
							$.each(data.dataList,function(index,item){
								dataValue.push(item.sumData);
								timeValue.push(item.time);
							});
							$scope.lenArray.push({'name':obj.name,'len':dataValue.length});
							series.name = obj.name;
							series.type = 'line';
							series.data = dataValue;
							if(totalBoolean){
								addOption(option_line,[obj.name],timeValue,series,'total');
							}else{
								addOption(option_line,[obj.name],timeValue,series,'normal');
							}				
							myChart.setOption(option_line);
						}	
					}else if(data.status==2){
						myChart.setOption(option_line);
					}
				}
			});
		});	
		$('#addModal').modal('hide');
	});
    $("body").delegate("#dele_confirm","click",function(e){
		var checkEle = $("input[name='comList']:checked");
		//var type = $('#searchType').val();
		if($scope.type =='5'){
			$.each(checkEle,function(index,item){
				var sibEle = $(item).parent().siblings();
				var tname = sibEle[0].innerHTML;
				var tid=item.id;
				$.each(option_pie.series,function(index,item){
					if(tname == item.name){
						option_pie.series.splice(index,1);
						return false;
					}
				});	
				//调整半径
				$.each(option_pie.series,function(index,item){
					if(index >0){
						var innerRadius = 150+(index-1)*50;
			    		item.radius = [innerRadius,innerRadius+30];
					}    	
				});
				//同步对比流量table
				$.each($scope.comCkListdata,function(index,data) {
					if(tid == data.id){
						$scope.comCkListdata.splice(index,1);
						return false;
					}
				});	
				$scope.$apply();	
				myChart.clear();
				myChart.setOption(option_pie);
			});
		}else{
			$.each(checkEle,function(index,item){
				var sibEle = $(item).parent().siblings();
				var tname = sibEle[0].innerHTML;
				var tid=item.id;
				var maxLen = 0;
				$.each(option_line.series,function(index,item){
					if(tname == item.name){
						option_line.series.splice(index,1);
						return false;
					}
				});	
				$.each(option_line.legend.data,function(index,item){
					if(tname == item){
						option_line.legend.data.splice(index,1);
						return false;
					}
				});	
				$.each($scope.lenArray,function(index,data) {
					if(tname == data.name){
						$scope.lenArray.splice(index,1);
						return false;
					}
				});
				$.each($scope.lenArray,function(index,item){
					var len = item.len;
					if(maxLen < len){
						maxLen = len;
					}
				});
				var timeLen = option_line.xAxis[0].data.length;
				if(timeLen>maxLen){
					option_line.xAxis[0].data.splice(maxLen,timeLen-maxLen);
					option_line.series[0].data.splice(maxLen,timeLen-maxLen);
				}
				$.each($scope.comCkListdata,function(index,data) {
					if(tid == data.id){
						$scope.comCkListdata.splice(index,1);
						return false;
					}
				});	
				$scope.$apply();
				myChart.clear();
				myChart.setOption(option_line);		
			});	
		}	
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
		var type = $(e.target).val();
		if(type == '5'){
			$scope.typeDis = true;
			$scope.scaleDis = true;
			if(watch){
	        	clearInterval(watch);
	        }
		}else{
			$scope.typeDis = false;
			$scope.scaleDis = false;
		}
		if(type == '0'){
			$scope.compDis = true;
		}
		$scope.$apply();
	});
	/*$("#totalUp").change(function(e){  //勾选total时是否要时间比例
    	var totalBoolean = $('#totalUp').prop('checked');
		if(totalBoolean==true){
			$scope.scaleDis = true;
		}else{
			$scope.scaleDis = false;
		}
		$scope.$apply();
	});*/
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
	$scope.addCompareTraffic = function(query,page){			
		$.ajax({
			url:'/trafficCap',
			type:'GET',
			data:{queryStr:query,page:page},
			dataType:'json',
			success:function(data){
				if(data.status==0 && data.dataList){
					$.each(data.dataList,function(index,item){
						if(item.name == $scope.trafficName){
							item.comdisable = true;
						}
						if(item.descript == null){
							item.descript = '';
						}
						item.end = NormalDate(UTCDay(item.start)+parseInt(item.end,10));
						$.each($scope.comCkListdata,function(cpindex,cpItem){
							if(cpItem.name == item.name || item.name == $scope.trafficName){
								item.comdisable = true;
								return false;
							}else{
								item.comdisable = false;
							}
						});
						item.name = item.name;	
						item.descript = item.descript;	
					});
					$scope.comInfos = data.dataList;
					$scope.$apply();
					$("#addModal .modal-body").append('<ul id="pagination-traffic" class="pagination-sm pull-right"></ul>');
					$('#pagination-traffic').twbsPagination({
				        totalPages: data.totalPng,
				        visiblePages: 5,
				        first:'第一页',
				        prev:'前一页',
				        next:'后一页',
				        last:'最后一页',
				        onPageClick: function (event, page) {
				        	var query = $.trim($('#queryString').val());
				            $scope.addCompareTraffic(query,page);
				        }
				    });
				}
			}
		  });	
	}
	$("body").delegate("#queryComp","click",function(e){
		e.stopPropagation();
		var queryStr = $.trim($("#queryString").val());
		$("#pagination-traffic").remove();
		$scope.addCompareTraffic(queryStr,1);
	})
	$('#addModal').on('show.bs.modal', function (event) {
		$("#pagination-traffic").remove();
		$("#queryString").val('');
	  	$scope.addCompareTraffic('',1);	
	  	/*$.ajax({
			url:'/netInfo',
			type:'get',
			dataType:'json',
			success:function(data){
				if(data.status == 0 && data.dataList){
					$scope.cp_net = data.dataList;
					$("#cp_netPro").trigger('change');
					$scope.$apply();
				}
			}
		});*/
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
				data:{capture:capture,generate:generate,valid:valid,id:id},
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

routeApp.directive('datepicker', function() {
  return{
    restrict: 'EA',
    scope: {
        error:'=dateError'
    },
    link:function(scope, element, attrs) {
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