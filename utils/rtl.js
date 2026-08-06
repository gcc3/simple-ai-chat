export function setRtl(rtl) {
  if (rtl) {
    document.dir = "rtl";
    document.documentElement.style.setProperty("--submit-rtl-right-offset", "auto");
    document.documentElement.style.setProperty("--submit-rtl-left-offset", "calc(50% + 22px)");
    document.documentElement.style.setProperty("--dot-rtl-right-offset", "auto");
    document.documentElement.style.setProperty("--dot-rtl-left-offset", "8px");
    document.documentElement.style.setProperty("--nav-rtl-right-margin", "0px");
    document.documentElement.style.setProperty("--nav-rtl-left-margin", "10px");
  } else {
    document.dir = "ltr";
    document.documentElement.style.setProperty("--submit-rtl-right-offset", "calc(50% + 22px)");
    document.documentElement.style.setProperty("--submit-rtl-left-offset", "auto");
    document.documentElement.style.setProperty("--dot-rtl-right-offset", "8px");
    document.documentElement.style.setProperty("--dot-rtl-left-offset", "auto");
    document.documentElement.style.setProperty("--nav-rtl-right-margin", "10px");
    document.documentElement.style.setProperty("--nav-rtl-left-margin", "0px");
  }
}
