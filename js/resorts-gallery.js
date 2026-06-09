(function () {
  var IMAGES = [
    "img/resorts/DJI_20250706081328_0105_D.webp",
    "img/resorts/DJI_20250706171105_0222_D.webp",
    "img/resorts/DJI_20250706171346_0230_D.webp",
    "img/resorts/DJI_20250706172948_0247_D.webp",
    "img/resorts/DJI_20250707074751_0282_D.webp",
    "img/resorts/DJI_20250707080314_0308_D.webp",
    "img/resorts/DJI_20250707080449_0315_D.webp",
    "img/resorts/DJI_20250707080458_0316_D.webp",
    "img/resorts/DJI_20250707103748_0070_D.webp",
    "img/resorts/DJI_20250707130937_0102_D.webp",
    "img/resorts/DJI_20250707131232_0115_D.webp",
    "img/resorts/DJI_20250707140053_0358_D.webp",
    "img/resorts/DJI_20250707150439_0407_D.webp",
    "img/resorts/DJI_20250707171321_0425_D.webp",
    "img/resorts/DJI_20250707171344_0427_D.webp",
    "img/resorts/DJI_20250707171735_0430_D.webp",
    "img/resorts/DJI_20250707171757_0434_D.webp",
    "img/resorts/_K7A0305.webp",
    "img/resorts/_K7A0311.webp",
    "img/resorts/_K7A0323.webp",
    "img/resorts/_K7A0377.webp",
    "img/resorts/_K7A0682.webp",
    "img/resorts/_K7A0683.webp",
    "img/resorts/_K7A0725.webp",
    "img/resorts/_K7A1028.webp",
    "img/resorts/_K7A1082.webp",
    "img/resorts/_K7A1090.webp",
    "img/resorts/_K7A1101.webp",
    "img/resorts/_K7A1104.webp",
    "img/resorts/_K7A1107.webp",
    "img/resorts/_K7A1116.webp",
    "img/resorts/_K7A1130.webp",
    "img/resorts/_K7A1144.webp",
    "img/resorts/_K7A1412.webp",
    "img/resorts/_K7A1426.webp",
    "img/resorts/_K7A1443.webp",
    "img/resorts/_K7A1469.webp",
    "img/resorts/_K7A4354.webp",
    "img/resorts/_K7A4360.webp",
    "img/resorts/_K7A4365.webp",
    "img/resorts/_K7A4366.webp",
    "img/resorts/_K7A4379.webp",
    "img/resorts/_K7A4401.webp",
    "img/resorts/_K7A4425.webp",
    "img/resorts/_K7A4491.webp",
    "img/resorts/_K7A4521.webp",
    "img/resorts/Villa 01 a (2).webp",
    "img/resorts/Villa 01 a (5).webp",
    "img/resorts/Villa 03 a 1.webp",
    "img/resorts/Villa 03 a 4.webp",
    "img/resorts/Villa 03 a 5.webp",
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

  var container = document.getElementById("resorts-gallery-container");
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
    img.alt = "Resort Photography";

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
