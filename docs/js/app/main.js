"use strict";

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

  var recommendLink = $(".js-recommend-link");
  if (recommendLink) {
    recommendLink.addEventListener("click", function(e) {
      e.preventDefault();
      var section = $(".js-recommend-section");
      if (section && section.style.display !== "none") {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

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
