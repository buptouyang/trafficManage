var routeApp = angular.module('mainContent',['ngRoute']);
routeApp.config(['$routeProvider',function($routeProvider){
	$routeProvider
	.when('/feature/:type',{
		templateUrl:'tpl/featureChart.html',
		controller:'featureChartCtl'
	})
	.when('/login',{
		templateUrl:'login.html',
		controller:'loginCtl'
	})
	.when('/main',{
		templateUrl:'tpl/feature.html',
		controller:'featureCtl'
	})
}]);
routeApp.controller('featureChartCtl',function($scope,$routeParams,$http){
	$scope.type = $routeParams.type;
	var text ={packageNum:"报文数特征情况",trafficNum:"流量大小特征",fragment:"分片",ack:"ack",syn:'syn',fin:"fin",syn_ack:"syn+ack报文",portPer:"端口分布情况",packagePer:"数据包大小分布"};
	var portValue=[
        {value:0, name:'ftp'},
        {value:0, name:'http'},
        {value:0, name:'telnet'},
        {value:0, name:'smtp'},
        {value:0, name:'pop3'}, 
        {value:0, name:'其他'}];
    var portLegent=['ftp','http','telnet','smtp','pop3','其他']; 
    var packageValue=[
        {value:0, name:'40'},
        {value:0, name:'41~53'},
        {value:0, name:'54'},
        {value:0, name:'55~60'},
        {value:0, name:'61~100'},
        {value:0, name:'101~256'}, 
        {value:0, name:'257~512'},
        {value:0, name:'513~1024'},
        {value:0, name:'1025~1499'},
        {value:0, name:'1500'}];
    var packageLegent=['40字节','41~53','54','55~60','61~100','101~256','257~512','513~1024','1025~1499','1500'];
	$http.get('').then(function(res){
		$scope.item=res.data;
	});
	var html ='',htmlM='',htmlH='',htmlD='';
	var feature_url="/feature/";
	for(var i=0;i<60;i++){	
		if(i<10){
			html+='<option value="0'+i+'">'+i+'</option>'
		}else{
			html+='<option value="'+i+'">'+i+'</option>'
		}	
	}
	$("#startMin").html(html);$("#endMin").html(html);$("#startSec").html(html);$("#endSec").html(html);	
	for(var i=1;i<13;i++){
		if(i<10){
			htmlM+='<option value="0'+i+'">'+i+'</option>'
		}else{
			htmlM+='<option value="'+i+'">'+i+'</option>'
		}				
	}
	$("#startMonth").html(htmlM);$("#endMonth").html(htmlM);
	for(var i=0;i<24;i++){
		if(i<10){
			htmlH+='<option value="0'+i+'">'+i+'</option>'
		}else{
			htmlH+='<option value="'+i+'">'+i+'</option>'
		}				
	}
	$("#startHour").html(htmlH);$("#endHour").html(htmlH);
	for(var i=1;i<31;i++){
		if(i<10){
			htmlD+='<option value="0'+i+'">'+i+'</option>'
		}else{
			htmlD+='<option value="'+i+'">'+i+'</option>'

		}				
	}
	$("#startDay").html(htmlD);$("#endDay").html(htmlD);
	

	$.ajax({
		url:feature_url,
		type:'GET',
		dataType:'jsonp',
		data:{type:"num"},
		success:function(result){

			var startTime=result[0].time;
			var endTime=result[result.length-1].time;

			var startYear=startTime[0]+startTime[1]+startTime[2]+startTime[3];$("#startYear").val(startYear)
			var startMonth=startTime[4]+startTime[5];$("#startMonth").val(startMonth)
			var startDay=startTime[6]+startTime[7];$("#startDay").val(startDay)

			var startHour=startTime[8]+startTime[9];$("#startHour").val(startHour)
			var startMin=startTime[10]+startTime[11];$("#startMin").val(startMin)
			var startSec=startTime[12]+startTime[13];$("#startSec").val(startSec)

			var endYear=endTime[0]+endTime[1]+endTime[2]+endTime[3];$("#endYear").val(endYear)
			var endMonth=endTime[4]+endTime[5];$("#endMonth").val(endMonth)
			var endDay=endTime[6]+endTime[7];$("#endDay").val(endDay)
			var endHour=endTime[8]+endTime[9];$("#endHour").val(endHour)
			var endMin=endTime[10]+endTime[11];$("#endMin").val(endMin)
			var endSec=endTime[12]+endTime[13];$("#endSec").val(endSec)

		}
	});
	require.config({
        paths:{
            echarts:'js/echarts',
            'echarts/chart/line' : 'js/echarts',
            'echarts/chart/pie' : 'js/echarts'
        }
    });	
    function drawLine(dataValue){
    	var xdata =new Array();	
		$.each(dataValue,function(index,item){
			xdata.push("");
		});
	    require(
	        [
	            'echarts',
	            'echarts/chart/line'
	        ],
	        function (ec) {
	            var myChart = ec.init(document.getElementById('featureChart'));
	            myChart.setOption({
	                title : {
	                    text: text[$scope.type]
	                },
	                tooltip : {
	                    trigger: 'item'
	                },
	                legend: {
	                    data:['大小']
	                },
	                toolbox: {
	                    show : false
	                },
	                calculable : true,
	                xAxis : [
	                    {
	                        type : 'category',
	                        name:"时间",                       
	                        data:xdata
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
	                series : [
	                    {
	                        name:text[$scope.type],
	                        type:'line',
	                        data:dataValue
	                    }
	                ]
	            });
			});    	
    }
    function drawPie(data){
    	var dataValue = new Array();
		var dataLegend = new Array();
    	$scope.type=="portPer"?(dataValue=portValue,dataLegend=portLegent):(dataValue=packageValue,dataLegend=packageLegent);

    	$.each(data,function(index,item){
			dataValue[index].value=item
		});	
	    require(
	        [
	            'echarts',
	            'echarts/chart/pie'
	        ],
	        function (ec) {
	           	var myChart = ec.init(document.getElementById('featureChart'));
				myChart.setOption({
				    title : {
				        text: text[$scope.type],
				        x:'center'
				    },
				    tooltip : {
				        trigger: 'item',
				        formatter: "{a} <br/>{b} : {c}个 ({d}%)"
				    },
				    legend: {
				        orient:'vertical',
				        x:'left',
				        data:dataLegend
				    },
				    toolbox: {
				        show : false
				    },
				    calculable : false,
				    series : [
				        {
				            name:'1s内',
				            type:'pie',
				            data:dataValue
				        }
				    ]
				});	
			}
		);
    }
    function search(ele){
    	var url = "/search";
    	var start =$("#startYear").val()+$("#startMonth").val()+$("#startDay").val()+$("#startHour").val()+$("#startMin").val()+$("#startSec").val();
    	var end =$("#endYear").val()+$("#endMonth").val()+$("#endDay").val()+$("#endHour").val()+$("#endMin").val()+$("#endSec").val();
    	var step = $(ele).siblings("#step").val();
    	//var type = $(ele).attr("id");
    	var dataValue=new Array();
    	
    	$.ajax({
			url:url,
			type:'GET',
			data:{type:$scope.type,start:start,end:end,step:step},
			dataType:'jsonp',
			success:function(data){		
				$.each(data,function(index,item){
					dataValue.push(item);
				});
				if($scope.type == 'portPer' || $scope.type == 'packagePer'){
					drawPie(dataValue);
				}else{
					drawLine(dataValue);
				}
				
			}
		});
    }//end of search
    $("button").click(function(e){
		search(e.target);
	});	
    $("#export").click(function(e){
		var start =$("#startYear").val()+$("#startMonth").val()+$("#startDay").val()+$("#startHour").val()+$("#startMin").val()+$("#startSec").val();
	    var end =$("#endYear").val()+$("#endMonth").val()+$("#endDay").val()+$("#endHour").val()+$("#endMin").val()+$("#startSec").val();
		var step = $(e.target).siblings("#step").val();
		var type = $(e.target).siblings("button").attr("id");
		window.location.href="/excel?start="+start+"&end="+end+"&step="+step+"&ptype="+type;
	});
});
routeApp.controller('loginCtl',function($scope,$http){

});
routeApp.controller('featureCtl',function($scope,$http){

});