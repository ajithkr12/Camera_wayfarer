(function () {
  var IMAGES = [
    "img/foods/0K7A7868.webp",
    "img/foods/0K7A7885.webp",
    "img/foods/0K7A7899.webp",
    "img/foods/0K7A7908.webp",
    "img/foods/6R9A5912.webp",
    "img/foods/6R9A6083.webp",
    "img/foods/6R9A6129.webp",
    "img/foods/6R9A6193.webp",
    "img/foods/6R9A6212.webp",
    "img/foods/7D3A0019_1.webp",
    "img/foods/7D3A0027_1.webp",
    "img/foods/7D3A0029_1.webp",
    "img/foods/7D3A0266_1.webp",
    "img/foods/7D3A0270_1.webp",
    "img/foods/7D3A0272_1.webp",
    "img/foods/7D3A0294_1.webp",
    "img/foods/7D3A0304_1.webp",
    "img/foods/7D3A0340_1.webp",
    "img/foods/7D3A0347_1.webp",
    "img/foods/7D3A0363_1.webp",
    "img/foods/7D3A0550_1.webp",
    "img/foods/7D3A0553_1.webp",
    "img/foods/7D3A0581_1.webp",
    "img/foods/7D3A0586_1.webp",
    "img/foods/7D3A7447.webp",
    "img/foods/7D3A7495 copy.webp",
    "img/foods/7D3A7508.webp",
    "img/foods/7D3A7521.webp",
    "img/foods/7D3A7534 copy.webp",
    "img/foods/7D3A7538 copy.webp",
    "img/foods/7D3A9563.webp",
    "img/foods/7D3A9574.webp",
    "img/foods/7D3A9660.webp",
    "img/foods/7D3A9670.webp",
    "img/foods/7D3A9684.webp",
    "img/foods/7D3A9695.webp",
    "img/foods/7D3A9707.webp",
    "img/foods/_K7A2521 2.webp",
    "img/foods/_K7A2521 4.webp",
    "img/foods/_K7A2554.webp",
  ];

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

  function recalcAll() {
    var items = container.querySelectorAll(".ashade-gallery-item[data-nat-w]");
    items.forEach(function (item) { setSpan(item); });
  }

  var container = document.getElementById("foods-gallery-container");
  if (!container) return;

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
    img.alt = "Food Photography";

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
