"use strict";

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

function filterPlans() {
  return PLANS.filter(plan => {
    if (state.baseStation !== "all" && !plan.baseStations.includes(state.baseStation)) return false;
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
