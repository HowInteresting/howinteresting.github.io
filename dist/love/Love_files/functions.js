/*
 * http://love.hackerzhou.me
 */

// variables
var $win = $(window);
var clientWidth = $win.width();
var clientHeight = $win.height();

$(window).resize(function () {
  var newWidth = $win.width();
  var newHeight = $win.height();
  if (newWidth != clientWidth && newHeight != clientHeight) {
    location.replace(location);
  }
});

(function ($) {
  $.fn.typewriter = function () {
    this.each(function () {
      var $ele = $(this),
        str = $ele.html(),
        progress = 0;
      $ele.html("");
      var timer = setInterval(function () {
        var current = str.substr(progress, 1);
        if (current == "<") {
          progress = str.indexOf(">", progress) + 1;
        } else {
          progress++;
        }
        $ele.html(str.substring(0, progress) + (progress & 1 ? "_" : ""));
        if (progress >= str.length) {
          clearInterval(timer);
        }
      }, 75);
    });
    return this;
  };
})(jQuery);

function timeElapse(date) {
  // 异常处理：检查输入是否为有效日期
  if (!date || isNaN(Date.parse(date))) {
    console.error("Invalid date input:", date);
    return;
  }

  try {
    const targetDate = new Date(date);
    const currentDate = new Date();

    // 计算时间差（毫秒）
    const timeDiff = currentDate.getTime() - targetDate.getTime();

    // 转换为总秒数
    let seconds = Math.floor(timeDiff / 1000);

    // 计算天数
    const days = Math.floor(seconds / (3600 * 24));
    seconds = seconds % (3600 * 24);

    // 计算小时数
    const hours = Math.floor(seconds / 3600);
    seconds = seconds % 3600;

    // 计算分钟数
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    // 补零函数
    const padZero = (num) => (num < 10 ? "0" + num : num);

    const result = `第 <span class="digit">${days}</span> 天 <span class="digit">${padZero(
      hours
    )}</span> 小时 <span class="digit">${padZero(
      minutes
    )}</span> 分钟 <span class="digit">${padZero(seconds)}</span> 秒`;

    const $clock = $("#clock");
    if ($clock.length) {
      $clock.html(result);
    } else {
      console.warn("Element #clock not found");
    }
  } catch (e) {
    console.error("Error in timeElapse:", e);
  }
}
