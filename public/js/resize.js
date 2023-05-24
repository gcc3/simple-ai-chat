
window.addEventListener("resize", (event) => {
  adjustPaddingTop();
});

window.addEventListener("load", (event) => {
  adjustPaddingTop();
});

function adjustPaddingTop() {
  if (window.innerWidth < 650) {
    document.querySelector("body").style.paddingTop = "0px";
  } else if (650 < window.innerWidth && window.innerWidth < 800) {
    document.querySelector("body").style.paddingTop = "25px";
  } else if (800 < window.innerWidth) {
    document.querySelector("body").style.paddingTop = "50px";
  }
}
