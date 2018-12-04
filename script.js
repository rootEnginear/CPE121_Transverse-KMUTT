(function(){
  // Disable middle click scroller
  document.body.onmousedown = function (e) { if (e.button === 1) return false; }

  // render maths
  var maths = [...document.getElementsByClassName("math")];
  maths.forEach(e => {
    katex.render(e.innerText, e, {
      throwOnError: false
    });
  });

  // Update copyright year
  document.getElementById("year").innerText = new Date().getFullYear();
}());