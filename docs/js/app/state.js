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
