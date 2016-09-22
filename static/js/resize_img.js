function autoResizeImg() {
    // Adjust height of webcam live stream
    var height = $(window).height();
    height -= document.getElementById("bs-example-navbar-collapse-1").offsetHeight;
    height -= document.getElementById("footer").offsetHeight;
    height -= 41; // Remove padding effect
    document.getElementById("resize-img").style.height = Math.min(height, 960) + "px"
}

window.onresize = function(event) {
    setHeightSidebar();
    autoResizeImg();
}
