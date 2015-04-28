(function() {
  var login=angular.module('login',[]);  
  function testValid(type,$scope){
    switch(type){
      case "uid":{
        if(!/^[A-Za-z0-9]+$/.test($scope.user.userName)){
          $scope.user.nameErr=true;
          $scope.user.nameErrMsg="用户名只能由数字和字母组成";
          $scope.user.nameValid=false;
        }else{
          $scope.user.nameErr=false;
          $scope.user.nameValid=true;
        }
        break;
      }
      case "psw":{
        if(!/^[A-Za-z0-9]{6,}$/.test($scope.user.passWord)){
          $scope.user.pswErr=true;
          $scope.user.pswErrMsg="密码至少6位,由数字和字母组成";
          $scope.user.pswValid=false;
        }else{
          $scope.user.pswErr=false;
          $scope.user.pswValid=true;
        }
        break;
      }
    }
  }
  login.controller('LoginController', function ($scope, $http,$location,$window) {
    $scope.user={};
    $scope.user.nameValid=false;
    $scope.user.pswValid=false;
    $scope.user.rem=false;
    angular.element(":text").bind('blur',function(ev){
      $scope.$apply(testValid(ev.target.id,$scope));
    });
    angular.element(":password").bind('blur',function(ev){
      $scope.$apply(testValid(ev.target.id,$scope));
    });
    
    
    $scope.submit = function() {
      testValid("uid",$scope);
      testValid("psw",$scope);
      if($scope.user.pswValid && $scope.user.nameValid){
        $http.post('login.php',{
         'uid':$scope.user.userName,'psw':$scope.user.passWord,'rem':$scope.user.rem
        }).success(function(data) {
          
          console.log(data);
          if(data.msg=="success"){
            $window.location.href='main.html';
          }else if(data.msg=="fail"){
            if(data.reason=="001"){
              $scope.user.pswErr=true;
              $scope.user.pswErrMsg="密码错误";
              $scope.user.nameErr=false;
            }else if(data.reason=="002"){
              $scope.user.nameErr=true;
              $scope.user.nameErrMsg="用户名不存在";
              $scope.user.pswErr=false;            }
          }
        });
      }
    }
  });
})();
