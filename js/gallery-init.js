// Shared dynamic masonry gallery initializer
// Usage: initGallery("container-id", ["img/path1.webp", ...])
function initGallery(containerId, images) {
  var ROW_UNIT = 6;
  var GAP      = 8;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function setSpan(item) {
    var w = parseInt(item.dataset.natW);
    var h = parseInt(item.dataset.natH);
    if (!w || !h) return;
    var colWidth = item.offsetWidth;
    if (!colWidth) return;
    var renderedHeight = Math.round((h / w) * colWidth);
    var span = Math.ceil((renderedHeight + GAP) / (ROW_UNIT + GAP));
    item.style.gridRowEnd = "span " + span;
  }

  var container = document.getElementById(containerId);
  if (!container) return;

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      container.querySelectorAll(".ashade-gallery-item[data-nat-w]").forEach(function (item) {
        setSpan(item);
      });
    }, 120);
  });

  shuffle(images).forEach(function (src) {
    var item = document.createElement("div");
    item.className = "ashade-gallery-item";

    var link = document.createElement("a");
    link.href = src;
    link.className = "ashade-lightbox-link";
    link.setAttribute("data-size", "1600x1067");

    var img = document.createElement("img");
    img.alt = "";

    img.onload = function () {
      var w = this.naturalWidth;
      var h = this.naturalHeight;
      item.dataset.natW = w;
      item.dataset.natH = h;
      link.setAttribute("data-size", w + "x" + h);
      setSpan(item);
      if (window.ashade && ashade.pswp && ashade.pswp.gallery) {
        var count = parseInt(link.dataset.count);
        var gallery = link.dataset.gallery || "default";
        if (!isNaN(count) && ashade.pswp.gallery[gallery] && ashade.pswp.gallery[gallery][count]) {
          ashade.pswp.gallery[gallery][count].w = w;
          ashade.pswp.gallery[gallery][count].h = h;
        }
      }
    };

    img.src = src;
    link.appendChild(img);
    item.appendChild(link);
    container.appendChild(item);
  });
}
