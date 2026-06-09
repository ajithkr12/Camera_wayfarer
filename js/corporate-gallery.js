(function () {
  var IMAGES = [
    "img/Corporate/0K7A4606.webp",
    "img/Corporate/0K7A4654.webp",
    "img/Corporate/0K7A4683.webp",
    "img/Corporate/0K7A4684.webp",
    "img/Corporate/0K7A4687.webp",
    "img/Corporate/0K7A4750.webp",
    "img/Corporate/0K7A4859.webp",
    "img/Corporate/Copy of Application Dev.webp",
    "img/Corporate/Copy of Contact Us.webp",
    "img/Corporate/Copy of Devops.webp",
    "img/Corporate/Copy of _K7A4940.webp",
    "img/Corporate/_K7A0305.webp",
    "img/Corporate/_K7A0316.webp",
    "img/Corporate/_K7A0335.webp",
    "img/Corporate/_K7A0359.webp",
    "img/Corporate/_K7A0412.webp",
    "img/Corporate/_K7A0566.webp",
    "img/Corporate/_K7A0570.webp",
    "img/Corporate/_K7A0618.webp",
    "img/Corporate/_K7A0766.webp",
    "img/Corporate/_K7A0771.webp",
    "img/Corporate/_K7A0786.webp",
    "img/Corporate/_K7A1002.webp",
    "img/Corporate/_K7A1010.webp",
    "img/Corporate/_K7A1013.webp",
    "img/Corporate/_K7A1156.webp",
    "img/Corporate/_K7A1838.webp",
    "img/Corporate/_K7A1873.webp",
    "img/Corporate/_K7A1950.webp",
    "img/Corporate/_K7A1963.webp",
    "img/Corporate/_K7A2774.webp",
    "img/Corporate/_K7A2782.webp",
    "img/Corporate/_K7A2790.webp",
    "img/Corporate/_K7A2814.webp",
    "img/Corporate/_K7A2832.webp",
    "img/Corporate/_K7A3308.webp",
    "img/Corporate/_K7A3310.webp",
    "img/Corporate/_K7A3355.webp",
    "img/Corporate/_K7A3420.webp",
    "img/Corporate/_K7A4649.webp",
    "img/Corporate/_K7A4652.webp",
    "img/Corporate/_K7A4660.webp",
    "img/Corporate/_K7A4686.webp",
    "img/Corporate/_K7A4814.webp",
    "img/Corporate/_K7A4882.webp",
    "img/Corporate/_K7A4893.webp",
    "img/Corporate/_K7A5060.webp",
    "img/Corporate/_K7A5370.webp",
    "img/Corporate/_K7A5375.webp",
    "img/Corporate/_K7A5385.webp",
    "img/Corporate/_K7A5396.webp",
    "img/Corporate/_K7A5404.webp",
    "img/Corporate/_K7A5413.webp",
  ];

  var ROW_UNIT = 6; // must match grid-auto-rows in CSS
  var GAP      = 8; // must match grid gap in CSS

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Recalculate row span for one item using its stored natural dimensions
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

  // Recalculate all items (called on resize)
  function recalcAll() {
    var items = container.querySelectorAll(".ashade-gallery-item[data-nat-w]");
    items.forEach(function (item) { setSpan(item); });
  }

  var container = document.getElementById("corp-gallery-container");
  if (!container) return;

  // Debounced resize listener — recalculates spans for current column width
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(recalcAll, 120);
  });

  shuffle(IMAGES).forEach(function (src) {
    var item = document.createElement("div");
    item.className = "ashade-gallery-item";

    var link = document.createElement("a");
    link.href = src;
    link.className = "ashade-lightbox-link";
    link.setAttribute("data-size", "1600x1067");

    var img = document.createElement("img");
    img.alt = "Corporate";

    img.onload = function () {
      var w = this.naturalWidth;
      var h = this.naturalHeight;

      // Store dimensions on the item for resize recalculation
      item.dataset.natW = w;
      item.dataset.natH = h;

      // Update lightbox size
      link.setAttribute("data-size", w + "x" + h);

      // Set initial span
      setSpan(item);

      // Sync real dimensions into pswp gallery array if already built
      if (window.ashade && ashade.pswp && ashade.pswp.gallery) {
        var count = parseInt(link.dataset.count);
        var gallery = link.dataset.gallery || "default";
        if (
          !isNaN(count) &&
          ashade.pswp.gallery[gallery] &&
          ashade.pswp.gallery[gallery][count]
        ) {
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
})();
