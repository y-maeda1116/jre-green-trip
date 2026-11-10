"use strict";

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
