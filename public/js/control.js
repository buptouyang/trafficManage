$(function(){
	var feature_url="/feature/";
	var html ='',htmlM='',htmlH='',htmlD='';
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
            'echarts/chart/line' : 'js/echarts'
        }
    });
    function search(ele){
    	var url = "/search";
    	var start =$("#startYear").val()+$("#startMonth").val()+$("#startDay").val()+$("#startHour").val()+$("#startMin").val()+$("#startSec").val();
    	var end =$("#endYear").val()+$("#endMonth").val()+$("#endDay").val()+$("#endHour").val()+$("#endMin").val()+$("#endSec").val();
    	var step = $(ele).siblings("#step").val();
    	var type = $(ele).attr("id");
    	var dataValue=new Array();
    	var text ={packageNum:"报文数特征情况",trafficNum:"流量大小特征",fragment:"分片",ack:"ack",syn:'syn',fin:"fin",syn_ack:"syn+ack报文"};
    	$.ajax({
			url:url,
			type:'GET',
			data:{type:type,start:start,end:end,step:step},
			dataType:'jsonp',
			success:function(data){				
				$.each(data,function(index,item){
					dataValue.push(item);
				});
				var xdata =new Array();	
				$.each(data,function(index,item){
					xdata.push("");
				});
			    require(
			        [
			            'echarts',
			            'echarts/chart/line'
			        ],
			        function (ec) {
			            var myChart = ec.init(document.getElementById('main'));
			            myChart.setOption({
			                title : {
			                    text: text[type]
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
			                        name:text[type],
			                        type:'line',
			                        data:dataValue
			                    }
			                ]
			            });
					});


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


/*	$("button").click(function(){
		var dataValue=new Array();
		var url="/search";
		$.ajax({
			url:url,
			type:'GET',
			data:{type:"1",start:,end:}
			dataType:'jsonp',
			success:function(data){
				dataValue.push(data.package);
				dataValue.push(data.trafficNum);
				dataValue.push(data.fragment);
				dataValue.push(data.ack);
				dataValue.push(data.syn);
				dataValue.push(data.fin);
				dataValue.push(data.syn_ack);
				
			    require(
			        [
			            'echarts',
			            'echarts/chart/line'
			        ],
			        function (ec) {
			            var myChart = ec.init(document.getElementById('main'));
			            myChart.setOption({
			                title : {
			                    text: '报文数特征情况'
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
			                        data : ['1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5','1','2','3','4','5']
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
			                        name:'package',
			                        type:'line',
			                        data:[1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5]
			                    }
			                ]
			            });
					});


			}
		});

	});//end of search click*/
	

})