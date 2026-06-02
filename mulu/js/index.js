$("#login-button").click(function (event) {
  var userName = document.getElementById("userName").value;
  var pwd = document.getElementById("pwd").value;
  //修改密码请改此处
  if (
    (userName == "xyq" || userName == "lxr") &&
    (pwd == "lxr520" || pwd == "xyq520" || pwd == "20260307" || pwd == "19980307")
  ) {
    event.preventDefault();
    $("form").fadeOut(500);
    $(".wrapper").addClass("form-success");
    setTimeout(function () {
      // location.href = "mulu.html";
      window.location.replace(location.origin + "/mulu");
    }, 2000);
  } else {
    alert("不对不对,给你个提示吧,我们在一起那天");
  }
});
