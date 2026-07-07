(function () {
  "use strict";

  const state = {
    baseStation: "all",
    month: "all",
    type: "all",
    quickFilter: null,
    currentPage: "plans",
    mapRendered: false,
    rulesRendered: false
  };

  const monthNames = [
    "", "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
  ];

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function init() {
    renderStationToggle();
    renderMonthFilter();
    renderTypeFilter();
    renderQuickFilters();
    renderAlertBanner();
    renderCalendarModal();
    renderCards();
    bindEvents();
  }

  function renderStationToggle() {
    const container = $(".js-station-toggle");
    container.innerHTML = "";
    var stations = [
      { value: "all", label: "全駅" },
      { value: "東京", label: "東京" },
      { value: "品川", label: "品川" },
      { value: "新宿", label: "新宿" },
      { value: "上野", label: "上野" },
      { value: "横浜", label: "横浜" }
    ];
    stations.forEach(function(s) {
      var btn = document.createElement("button");
      btn.className = "station-toggle__btn" + (state.baseStation === s.value ? " station-toggle__btn--active" : "");
      btn.dataset.station = s.value;
      btn.textContent = s.label;
      container.appendChild(btn);
    });
  }

  function renderMonthFilter() {
    const container = $(".js-month-filter");
    container.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.className = "filter-btn filter-btn--active";
    allBtn.dataset.month = "all";
    allBtn.textContent = "すべて";
    container.appendChild(allBtn);
    for (let m = 1; m <= 12; m++) {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.month = m;
      btn.textContent = monthNames[m];
      container.appendChild(btn);
    }
  }

  function renderTypeFilter() {
    const container = $(".js-type-filter");
    container.innerHTML = "";
    const types = [
      { value: "all", label: "すべて" },
      { value: "全休", label: "全休" },
      { value: "午後休", label: "午後休" }
    ];
    types.forEach((t, i) => {
      const btn = document.createElement("button");
      btn.className = "filter-btn" + (i === 0 ? " filter-btn--active" : "");
      btn.dataset.type = t.value;
      btn.textContent = t.label;
      container.appendChild(btn);
    });
  }

  function renderQuickFilters() {
    const container = $(".js-quick-filters");
    container.innerHTML = "";
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    const filters = [
      { key: "now", label: monthNames[currentMonth] + "の午後休プラン" },
      { key: "weekend", label: "今月・来月の全休プラン" }
    ];

    filters.forEach(f => {
      const btn = document.createElement("button");
      btn.className = "quick-filter-btn";
      btn.dataset.quick = f.key;
      btn.textContent = f.label;
      container.appendChild(btn);
    });
  }

  function getUpcomingDeadlines() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return SEASON_BLOCKS.map(block => {
      let dlYear = year;
      if (block.deadlineMonth === 1 && month > 1) dlYear++;
      const day = block.deadlineMonth === 2 ? 28 : (block.deadlineMonth === 1 ? 31 : 30);
      const date = new Date(dlYear, block.deadlineMonth - 1, day);
      return { ...block, date, year: dlYear, day };
    }).filter(d => d.date >= now).sort((a, b) => a.date - b.date);
  }

  function renderAlertBanner() {
    const banner = $(".js-alert-banner");
    const deadlines = getUpcomingDeadlines();
    if (deadlines.length === 0) {
      banner.classList.add("alert-banner--hidden");
      return;
    }
    const next = deadlines[0];
    const now = new Date();
    const diffDays = Math.ceil((next.date - now) / (1000 * 60 * 60 * 24));

    if (diffDays > 60) {
      banner.classList.add("alert-banner--hidden");
      return;
    }

    banner.classList.remove("alert-banner--hidden");
    banner.querySelector(".js-alert-text").textContent =
      next.deadlineMonth + "月末が期限！（あと" + diffDays + "日）— " + next.name + "のグリーン券を使い切ろう！";
  }

  function renderCalendarModal() {
    const container = $(".js-calendar-modal");
    container.innerHTML = "";

    const modal = document.createElement("div");
    modal.className = "calendar-modal";

    const title = document.createElement("div");
    title.className = "calendar-modal__title";
    title.textContent = "グリーン券の期限をカレンダーに登録";
    modal.appendChild(title);

    const list = document.createElement("ul");
    list.className = "calendar-modal__list";

    const deadlines = getUpcomingDeadlines();
    deadlines.forEach(d => {
      const dateStr = d.year + String(d.deadlineMonth).padStart(2, "0") + String(d.day).padStart(2, "0");
      const nextDay = new Date(d.date);
      nextDay.setDate(nextDay.getDate() + 1);
      const dateEndStr = nextDay.getFullYear() + String(nextDay.getMonth() + 1).padStart(2, "0") + String(nextDay.getDate()).padStart(2, "0");
      const calUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("JRE BANK グリーン券期限") + "&dates=" + dateStr + "/" + dateEndStr + "&details=" + encodeURIComponent("JRE BANK 普通列車グリーン券の有効期限日です。\nhttps://y-maeda1116.github.io/jre-green-trip/");

      const li = document.createElement("li");
      li.className = "calendar-modal__item";

      const span = document.createElement("span");
      span.textContent = d.deadlineMonth + "月末（" + d.name + "）";
      li.appendChild(span);

      const a = document.createElement("a");
      a.className = "calendar-modal__link";
      a.href = calUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Googleカレンダーに追加";
      li.appendChild(a);

      list.appendChild(li);
    });

    modal.appendChild(list);

    const closeBtn = document.createElement("button");
    closeBtn.className = "calendar-modal__close js-calendar-close";
    closeBtn.textContent = "閉じる";
    modal.appendChild(closeBtn);

    container.appendChild(modal);
  }

  function filterPlans() {
    return PLANS.filter(plan => {
      if (state.baseStation !== "all" && !plan.baseStation.includes(state.baseStation)) return false;
      if (state.month !== "all" && !plan.targetMonth.includes(Number(state.month))) return false;
      if (state.type !== "all" && plan.type !== state.type) return false;
      if (state.quickFilter) {
        const now = new Date();
        const cm = now.getMonth() + 1;
        const nm = cm === 12 ? 1 : cm + 1;
        if (state.quickFilter === "now") {
          return plan.type === "午後休" && plan.targetMonth.includes(cm);
        }
        if (state.quickFilter === "weekend") {
          return plan.type === "全休" && (plan.targetMonth.includes(cm) || plan.targetMonth.includes(nm));
        }
      }
      return true;
    });
  }

  function createCard(plan) {
    const card = document.createElement("article");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card__header";

    const headerLeft = document.createElement("div");

    const seasonLabel = document.createElement("div");
    seasonLabel.className = "season-block-label";
    seasonLabel.textContent = plan.seasonBlock;
    headerLeft.appendChild(seasonLabel);

    const title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = plan.title;
    headerLeft.appendChild(title);

    header.appendChild(headerLeft);

    const badge = document.createElement("span");
    badge.className = "card__type-badge " + (plan.type === "全休" ? "card__type-badge--full" : "card__type-badge--half");
    badge.textContent = plan.type;
    header.appendChild(badge);

    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "card__body";

    const meta = document.createElement("div");
    meta.className = "card__meta";

    const tags = [plan.baseStation + "発"];
    if (plan.region) {
      tags.push(plan.region);
    }
    tags.push(plan.duration);
    plan.targetMonth.forEach(function(m) {
      tags.push(monthNames[m]);
    });
    tags.forEach(function(text) {
      const tag = document.createElement("span");
      tag.className = "card__tag";
      tag.textContent = text;
      meta.appendChild(tag);
    });
    body.appendChild(meta);

    const desc = document.createElement("p");
    desc.className = "card__description";
    desc.textContent = plan.description;
    body.appendChild(desc);

    const spotsDiv = document.createElement("div");
    spotsDiv.className = "card__spots";
    plan.spots.forEach(function(spot) {
      const span = document.createElement("span");
      span.className = "card__spot";
      span.textContent = spot;
      spotsDiv.appendChild(span);
    });
    body.appendChild(spotsDiv);

    if (plan.budget) {
      const budgetTag = document.createElement("div");
      budgetTag.className = "card__tag";
      budgetTag.style.marginBottom = "0.5rem";
      budgetTag.textContent = plan.budget;
      body.appendChild(budgetTag);
    }

    card.appendChild(body);

    const schedule = document.createElement("div");
    schedule.className = "card__schedule";

    const scheduleTitle = document.createElement("div");
    scheduleTitle.className = "card__schedule-title";
    scheduleTitle.textContent = "スケジュール例";
    schedule.appendChild(scheduleTitle);

    schedule.appendChild(document.createTextNode(plan.scheduleSample));
    card.appendChild(schedule);

    return card;
  }

  function renderCards() {
    const container = $(".js-cards");
    const countEl = $(".js-result-count");
    const plans = filterPlans();

    countEl.textContent = plans.length + "件のプランが見つかりました";

    container.innerHTML = "";

    if (plans.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";

      const icon = document.createElement("div");
      icon.className = "empty-state__icon";
      icon.textContent = "🔍";
      empty.appendChild(icon);

      const text = document.createElement("div");
      text.className = "empty-state__text";
      text.textContent = "条件に合うプランがありません。フィルターを変更してお試しください。";
      empty.appendChild(text);

      container.appendChild(empty);
      return;
    }

    plans.forEach(function(plan) {
      container.appendChild(createCard(plan));
    });
  }

  function setActiveButton(container, activeEl, cls) {
    container.querySelectorAll("." + cls).forEach(function(btn) {
      btn.classList.remove(cls + "--active");
    });
    activeEl.classList.add(cls + "--active");
  }

  function resetQuickFilters() {
    state.quickFilter = null;
    $$(".quick-filter-btn").forEach(function(b) {
      b.classList.remove("quick-filter-btn--active");
    });
  }

  function bindEvents() {
    $(".js-station-toggle").addEventListener("click", function(e) {
      var btn = e.target.closest("[data-station]");
      if (!btn) return;
      state.baseStation = btn.dataset.station;
      setActiveButton($(".js-station-toggle"), btn, "station-toggle__btn");
      resetQuickFilters();
      renderCards();
    });

    $(".js-month-filter").addEventListener("click", function(e) {
      var btn = e.target.closest("[data-month]");
      if (!btn) return;
      state.month = btn.dataset.month;
      setActiveButton($(".js-month-filter"), btn, "filter-btn");
      resetQuickFilters();
      renderCards();
    });

    $(".js-type-filter").addEventListener("click", function(e) {
      var btn = e.target.closest("[data-type]");
      if (!btn) return;
      state.type = btn.dataset.type;
      setActiveButton($(".js-type-filter"), btn, "filter-btn");
      resetQuickFilters();
      renderCards();
    });

    $(".js-quick-filters").addEventListener("click", function(e) {
      var btn = e.target.closest("[data-quick]");
      if (!btn) return;
      var wasActive = btn.classList.contains("quick-filter-btn--active");
      $$(".quick-filter-btn").forEach(function(b) {
        b.classList.remove("quick-filter-btn--active");
      });
      if (wasActive) {
        state.quickFilter = null;
      } else {
        state.quickFilter = btn.dataset.quick;
        btn.classList.add("quick-filter-btn--active");
      }
      state.month = "all";
      state.type = "all";
      state.baseStation = "all";
      setActiveButton($(".js-month-filter"), document.querySelector('[data-month="all"]'), "filter-btn");
      setActiveButton($(".js-type-filter"), document.querySelector('[data-type="all"]'), "filter-btn");
      setActiveButton($(".js-station-toggle"), document.querySelector('[data-station="all"]'), "station-toggle__btn");
      renderCards();
    });

    $(".js-calendar-btn").addEventListener("click", function() {
      $(".js-calendar-modal-overlay").classList.remove("calendar-modal-overlay--hidden");
    });

    document.addEventListener("click", function(e) {
      if (e.target.closest(".js-calendar-close") || e.target.classList.contains("js-calendar-modal-overlay")) {
        $(".js-calendar-modal-overlay").classList.add("calendar-modal-overlay--hidden");
      }
    });

    $(".js-nav-tabs").addEventListener("click", function(e) {
      var btn = e.target.closest("[data-page]");
      if (!btn) return;
      switchPage(btn.dataset.page);
    });
  }

  function switchPage(page) {
    state.currentPage = page;
    $$(".js-page").forEach(function(p) {
      p.style.display = "none";
    });
    var target = $(".js-page-" + page);
    if (target) target.style.display = "";

    $$(".nav-tabs__btn").forEach(function(btn) {
      btn.classList.remove("nav-tabs__btn--active");
    });
    var activeBtn = document.querySelector('[data-page="' + page + '"]');
    if (activeBtn) activeBtn.classList.add("nav-tabs__btn--active");

    if (page === "map" && !state.mapRendered) {
      renderMapPage("tokyo");
      state.mapRendered = true;
    }
    if (page === "rules" && !state.rulesRendered) {
      renderRulesPage();
      state.rulesRendered = true;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
