var ROUTE_LINES = [
  {
    name: "東海道線・伊東線",
    tagline: "沼津・伊東方面（静岡）",
    color: "#FF6D00",
    colorLight: "#FFF3E0",
    stations: [
      { name: "品川", fromTokyo: 10, fromShinjuku: 20 },
      { name: "横浜", fromTokyo: 25, fromShinjuku: 35 },
      { name: "大船", fromTokyo: 45, fromShinjuku: 55 },
      { name: "藤沢", fromTokyo: 55, fromShinjuku: 65 },
      { name: "小田原", fromTokyo: 80, fromShinjuku: 90 },
      { name: "熱海", fromTokyo: 100, fromShinjuku: null },
      { name: "伊東", fromTokyo: 120, fromShinjuku: null, isFarthest: true },
      { name: "沼津", fromTokyo: 135, fromShinjuku: null, isFarthest: true }
    ]
  },
  {
    name: "常磐線",
    tagline: "高萩・水戸方面（茨城）",
    color: "#1565C0",
    colorLight: "#E3F2FD",
    stations: [
      { name: "日暮里", fromTokyo: 5, fromShinjuku: null },
      { name: "松戸", fromTokyo: 25, fromShinjuku: null },
      { name: "柏", fromTokyo: 35, fromShinjuku: null },
      { name: "取手", fromTokyo: 45, fromShinjuku: null },
      { name: "土浦", fromTokyo: 65, fromShinjuku: null },
      { name: "水戸", fromTokyo: 120, fromShinjuku: null },
      { name: "高萩", fromTokyo: 140, fromShinjuku: null, isFarthest: true }
    ]
  },
  {
    name: "高崎線",
    tagline: "前橋方面（群馬）",
    color: "#E65100",
    colorLight: "#FBE9E7",
    stations: [
      { name: "上野", fromTokyo: 5, fromShinjuku: 20 },
      { name: "赤羽", fromTokyo: 12, fromShinjuku: 10 },
      { name: "大宮", fromTokyo: 30, fromShinjuku: 35 },
      { name: "熊谷", fromTokyo: 55, fromShinjuku: 60 },
      { name: "高崎", fromTokyo: 80, fromShinjuku: 90 },
      { name: "前橋", fromTokyo: 100, fromShinjuku: 115, isFarthest: true }
    ]
  },
  {
    name: "宇都宮線",
    tagline: "宇都宮方面（栃木）",
    color: "#558B2F",
    colorLight: "#F1F8E9",
    stations: [
      { name: "上野", fromTokyo: 5, fromShinjuku: 20 },
      { name: "赤羽", fromTokyo: 12, fromShinjuku: 10 },
      { name: "大宮", fromTokyo: 30, fromShinjuku: 35 },
      { name: "小山", fromTokyo: 60, fromShinjuku: 65 },
      { name: "宇都宮", fromTokyo: 110, fromShinjuku: 115, isFarthest: true }
    ]
  },
  {
    name: "総武快速線・房総",
    tagline: "成田空港・君津・成東方面（千葉）",
    color: "#00838F",
    colorLight: "#E0F7FA",
    stations: [
      { name: "錦糸町", fromTokyo: 10, fromShinjuku: null },
      { name: "船橋", fromTokyo: 20, fromShinjuku: null },
      { name: "千葉", fromTokyo: 40, fromShinjuku: null },
      { name: "成田", fromTokyo: 75, fromShinjuku: null },
      { name: "成東", fromTokyo: 80, fromShinjuku: null, isFarthest: true },
      { name: "君津", fromTokyo: 80, fromShinjuku: null, isFarthest: true },
      { name: "上総一ノ宮", fromTokyo: 80, fromShinjuku: null, isFarthest: true },
      { name: "成田空港", fromTokyo: 90, fromShinjuku: null, isFarthest: true }
    ]
  },
  {
    name: "中央線快速・青梅線",
    tagline: "大月・青梅方面（山梨・東京）",
    color: "#F4511E",
    colorLight: "#FBE9E7",
    stations: [
      { name: "中野", fromTokyo: 15, fromShinjuku: 5 },
      { name: "三鷹", fromTokyo: 25, fromShinjuku: 15 },
      { name: "国分寺", fromTokyo: 35, fromShinjuku: 25 },
      { name: "立川", fromTokyo: 45, fromShinjuku: 35 },
      { name: "八王子", fromTokyo: 55, fromShinjuku: 45 },
      { name: "高尾", fromTokyo: 65, fromShinjuku: 55 },
      { name: "青梅", fromTokyo: 75, fromShinjuku: 65, isFarthest: true },
      { name: "大月", fromTokyo: 100, fromShinjuku: 95, isFarthest: true }
    ]
  }
];

var renderMapPage;
var renderRulesPage;

(function () {
  "use strict";

  function $(sel) { return document.querySelector(sel); }

  var mapDeparture = "tokyo";

  function getMaxTime(route, departure) {
    var max = 0;
    route.stations.forEach(function (s) {
      var t = departure === "tokyo" ? s.fromTokyo : s.fromShinjuku;
      if (t !== null && t > max) max = t;
    });
    return max;
  }

  function isAccessible(route, departure) {
    return route.stations.some(function (s) {
      return departure === "tokyo" ? s.fromTokyo !== null : s.fromShinjuku !== null;
    });
  }

  function createDepartureToggle(departure) {
    var div = document.createElement("div");
    div.className = "map-departure-toggle";

    var options = [
      { value: "tokyo", label: "東京駅から出発" },
      { value: "shinjuku", label: "新宿駅から出発" }
    ];

    options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.className = "map-departure-toggle__btn" + (departure === opt.value ? " map-departure-toggle__btn--active" : "");
      btn.dataset.departure = opt.value;
      btn.textContent = opt.label;
      div.appendChild(btn);
    });

    return div;
  }

  function createSummary(sorted, departure) {
    var div = document.createElement("div");
    div.className = "map-summary";

    var farthest = sorted[0];
    var stationNames = [];
    farthest.route.stations.forEach(function (s) {
      var t = departure === "tokyo" ? s.fromTokyo : s.fromShinjuku;
      if (t === farthest.maxTime && s.isFarthest) stationNames.push(s.name);
    });

    div.textContent = "最遠：" + stationNames.join("・") + "（" + farthest.maxTime + "分）までグリーン車で直通可能";
    return div;
  }

  function createRouteCard(route, departure) {
    var card = document.createElement("div");
    card.className = "route-card";

    var header = document.createElement("div");
    header.className = "route-card__header";

    var colorBox = document.createElement("div");
    colorBox.className = "route-card__color";
    colorBox.style.backgroundColor = route.color;
    header.appendChild(colorBox);

    var nameEl = document.createElement("div");
    nameEl.className = "route-card__name";
    nameEl.textContent = route.name;
    header.appendChild(nameEl);

    var tagEl = document.createElement("span");
    tagEl.className = "route-card__tagline";
    tagEl.textContent = route.tagline;
    header.appendChild(tagEl);

    card.appendChild(header);

    var timeline = document.createElement("div");
    timeline.className = "route-timeline";
    timeline.style.setProperty("--route-color", route.color);
    timeline.style.setProperty("--route-color-light", route.colorLight);

    route.stations.forEach(function (station) {
      var time = departure === "tokyo" ? station.fromTokyo : station.fromShinjuku;
      if (time === null) return;

      var row = document.createElement("div");
      row.className = "route-station" + (station.isFarthest ? " route-station--farthest" : "");
      row.style.setProperty("--route-color", route.color);

      var nameSpan = document.createElement("span");
      nameSpan.className = "route-station__name";
      nameSpan.textContent = station.name;
      row.appendChild(nameSpan);

      var timeSpan = document.createElement("span");
      timeSpan.className = "route-station__time";
      timeSpan.textContent = "約" + time + "分";
      row.appendChild(timeSpan);

      timeline.appendChild(row);
    });

    card.appendChild(timeline);
    return card;
  }

  renderMapPage = function (departure) {
    if (departure) mapDeparture = departure;
    var container = $(".js-map-section");
    while (container.firstChild) container.removeChild(container.firstChild);

    var wrapper = document.createElement("div");
    wrapper.className = "map-wrapper";

    var toggle = createDepartureToggle(mapDeparture);
    wrapper.appendChild(toggle);

    var sorted = ROUTE_LINES
      .filter(function (route) { return isAccessible(route, mapDeparture); })
      .map(function (route) { return { route: route, maxTime: getMaxTime(route, mapDeparture) }; })
      .sort(function (a, b) { return b.maxTime - a.maxTime; });

    if (sorted.length > 0) {
      wrapper.appendChild(createSummary(sorted, mapDeparture));
    }

    sorted.forEach(function (item) {
      wrapper.appendChild(createRouteCard(item.route, mapDeparture));
    });

    if (mapDeparture === "shinjuku") {
      var note = document.createElement("div");
      note.className = "map-note";
      note.textContent = "※ 常磐線・総武快速線は新宿からの直通がありません（乗り換えが必要）。";
      wrapper.appendChild(note);
    }

    container.appendChild(wrapper);

    toggle.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-departure]");
      if (!btn) return;
      mapDeparture = btn.dataset.departure;
      renderMapPage(mapDeparture);
    });
  };

  function createRuleCard(rule) {
    var card = document.createElement("div");
    card.className = "rule-card rule-card--" + rule.type;

    var icon = document.createElement("div");
    icon.className = "rule-card__icon";
    icon.textContent = rule.type === "pro" ? "💡" : "⚠️";
    card.appendChild(icon);

    var title = document.createElement("h3");
    title.className = "rule-card__title";
    title.textContent = rule.title;
    card.appendChild(title);

    var desc = document.createElement("p");
    desc.className = "rule-card__description";
    desc.textContent = rule.description;
    card.appendChild(desc);

    var example = document.createElement("div");
    example.className = "rule-card__example";
    example.textContent = rule.example;
    card.appendChild(example);

    return card;
  }

  renderRulesPage = function () {
    var container = $(".js-rules-section");
    while (container.firstChild) container.removeChild(container.firstChild);

    var wrapper = document.createElement("div");
    wrapper.className = "rules-wrapper";

    var title = document.createElement("h2");
    title.className = "rules-title";
    title.textContent = "グリーン車クーポンの重要ルール";
    wrapper.appendChild(title);

    var subtitle = document.createElement("p");
    subtitle.className = "rules-subtitle";
    subtitle.textContent = "知っておけば損しない、グリーン券利用のポイント";
    wrapper.appendChild(subtitle);

    var rules = [
      {
        type: "pro",
        title: "改札を出ない乗り継ぎが可能",
        description: "改札を出なければ、同一方向の列車に1枚のグリーン券（クーポン）で乗り継げます。複数の列車を乗り継いでも、改札を出ない限り1回分の消費で済みます。",
        example: "例：高崎線（大宮まで）→ 大船で横須賀線に乗り換え → 逗子へ（1枚でOK）"
      },
      {
        type: "warning",
        title: "中央線・青梅線は独立エリア",
        description: "中央線快速・青梅線のグリーン車は、他線区（東海道線や総武快速線など）との間で1枚のグリーン券での乗り継ぎができません。完全に独立したエリアとして片道1回分が消費されます。",
        example: "例：中央線と東海道線をまたぐ利用には、2枚のグリーン券が必要"
      }
    ];

    rules.forEach(function (rule) {
      wrapper.appendChild(createRuleCard(rule));
    });

    var tipsTitle = document.createElement("h3");
    tipsTitle.className = "rules-tips-title";
    tipsTitle.textContent = "その他の注意点";
    wrapper.appendChild(tipsTitle);

    var tipsList = document.createElement("ul");
    tipsList.className = "rules-tips-list";

    var tips = [
      "普通列車（快速・普通）の2階建てグリーン車のみ対象。特急には使用不可。",
      "有効期限は3ヶ月（季節ブロック制）。期限切れに注意。",
      "座席は自由席（2階建て車両の1階・2階）。指定席ではありません。",
      "事前にグリーン券（クーポン）をJRE BANKアプリで取得する必要があります。"
    ];

    tips.forEach(function (tip) {
      var li = document.createElement("li");
      li.textContent = tip;
      tipsList.appendChild(li);
    });

    wrapper.appendChild(tipsList);
    container.appendChild(wrapper);
  };
})();
