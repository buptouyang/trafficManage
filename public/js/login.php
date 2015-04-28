<?php
$params=json_decode(file_get_contents('php://input'),true);
$uid=$params['uid'];
$psw=$params['psw'];
$rem=$params['rem'];
$conn='';
$timeout=null;
$mysql_server_name="localhost"; //数据库服务器名称
$mysql_username="root"; // 连接数据库用户名
$mysql_password="123456"; // 连接数据库密码
$mysql_database="ssdb"; // 数据库的名字

$conn= mysql_connect($mysql_server_name, $mysql_username,
                    $mysql_password);
mysql_select_db($mysql_database,$conn);
mysql_query("set names utf8");
$strsql="SELECT * FROM user WHERE user_name= '".$uid."' and user_password= '".$psw."'";
$strsqlname="SELECT * FROM user WHERE user_name= '".$uid."'";
$result=mysql_query($strsql,$conn);
$resultname=mysql_query($strsqlname,$conn);
$row = mysql_fetch_array($result);
$userId = $row[0];
if(mysql_num_rows($result)){
	$arr=array("msg"=>"success","reason"=>"");
	session_start();
	$_SESSION['admin']=true;
	$rem?$timeout = time()+60*60*24*7:$timeout=null;
	/*$salt="SSDB";
	$identifier = md5($salt .md5($uid.$salt));
	$token = md5(uniqid(rand(),true));
	
	setcookie("auth","$identifier:$token",$timeout);*/
	setcookie("user_id","$userId",-1);
	setcookie("admin","true",$timeout);

	echo json_encode($arr);
}else if(mysql_num_rows($resultname)){
	$arr=array("msg"=>"fail","reason"=>"001");
	setcookie("admin","false",$timeout);
	echo json_encode($arr);
}else{
	$arr=array("msg"=>"fail","reason"=>"002");
	setcookie("admin","false",$timeout);
	echo json_encode($arr);
}
?>
