$(function () {
  loadAudioFile("music/qingge.mp3");
  setTimeout(function () {
    $(".button-style1").animate(
      {
        opacity: "1",
        top: "20%",
      },
      1500,
    );
    $(".button-style2").animate(
      {
        opacity: "1",
        top: "40%",
      },
      1500,
    );
    $(".button-style3").animate(
      {
        opacity: "1",
        top: "60%",
      },
      1500,
    );
    $(".button-style4").animate(
      {
        opacity: "1",
        top: "80%",
      },
      1500,
    );
  }, 100);
  // $(window).click(function(){
  // 	$('audio')[0].play();
  // });
  // window.audio=$('audio')[0].play();
});

function jump(path) {
  window.parent.location.href = window.location.origin + path;
}
