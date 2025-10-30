$("#login-button").click(function (event) {
  var userName = document.getElementById("userName").value;
  var pwd = document.getElementById("pwd").value;
  //修改密码请改此处
  if (userName == "wy" && (pwd == "lxr520" || pwd == "wy520" || pwd == "20250629")) {
    event.preventDefault();
    $("form").fadeOut(500);
    $(".wrapper").addClass("form-success");
    setTimeout(function () {
      location.href = "Memories.html";
    }, 2000);
  } else {
    alert("不对不对,给你个提示吧,我们在一起那天");
  }
});
