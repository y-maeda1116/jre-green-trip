"use strict";

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

  const tags = [plan.baseStations.join("・") + "発"];
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

  if (plan.additionalTransport && plan.additionalTransport.length) {
    const transportDiv = document.createElement("div");
    transportDiv.className = "card__transport";
    const transportTitle = document.createElement("div");
    transportTitle.className = "card__transport-title";
    transportTitle.textContent = "グリーン券対象外の追加移動";
    transportDiv.appendChild(transportTitle);
    plan.additionalTransport.forEach(function(t) {
      const item = document.createElement("div");
      item.className = "card__transport-item";
      item.textContent = t.mode + "：" + t.section + (t.note ? "（" + t.note + "）" : "");
      transportDiv.appendChild(item);
    });
    body.appendChild(transportDiv);
  }

  card.appendChild(body);

  const schedule = document.createElement("div");
  schedule.className = "card__schedule";

  const scheduleTitle = document.createElement("div");
  scheduleTitle.className = "card__schedule-title";
  scheduleTitle.textContent = "モデルスケジュール（目安）";
  schedule.appendChild(scheduleTitle);

  schedule.appendChild(document.createTextNode(plan.scheduleSample));

  const scheduleNote = document.createElement("div");
  scheduleNote.className = "card__schedule-note";
  scheduleNote.textContent = "※目安です。乗車前に当日のダイヤ・営業時間・開催日を公式サイトでご確認ください。";
  schedule.appendChild(scheduleNote);

  card.appendChild(schedule);

  return card;
}

function renderRecommend() {
  var section = $(".js-recommend-section");
  if (!section) return;
  var subEl = $(".js-recommend-sub");
  var cardsEl = $(".js-recommend-cards");
  var result = recommendPlans(PLANS, SEASON_BLOCKS, {
    now: new Date(),
    baseStation: state.baseStation,
    type: state.type
  });
  while (cardsEl.firstChild) cardsEl.removeChild(cardsEl.firstChild);
  if (result.items.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  var deadlineText = result.meta.diffDays !== null && result.meta.diffDays >= 0
    ? result.meta.activeBlock + "（あと" + result.meta.diffDays + "日）・"
    : "";
  var fallbackText = result.meta.isFallback
    ? "完全一致はありませんが、条件に近い候補を表示しています。"
    : "いまの発駅・休暇タイプの条件で、上位3件をおすすめします。";
  subEl.textContent = deadlineText + fallbackText;
  result.items.forEach(function(item) {
    cardsEl.appendChild(createRecommendCard(item));
  });
}

function createRecommendCard(item) {
  var plan = item.plan;
  var card = document.createElement("article");
  card.className = "recommend-card";

  var head = document.createElement("div");
  head.className = "recommend-card__head";

  var title = document.createElement("div");
  title.className = "recommend-card__title";
  title.textContent = plan.title;
  head.appendChild(title);

  var badge = document.createElement("span");
  badge.className = "card__type-badge " + (plan.type === "全休" ? "card__type-badge--full" : "card__type-badge--half");
  badge.textContent = plan.type;
  head.appendChild(badge);

  card.appendChild(head);

  var meta = document.createElement("div");
  meta.className = "recommend-card__meta";
  meta.textContent = plan.baseStations.join("・") + "発・片道約" + plan.oneWayMinutes + "分・" + plan.seasonBlock;
  card.appendChild(meta);

  var reasons = document.createElement("div");
  reasons.className = "recommend-card__reasons";
  item.reasons.forEach(function(r) {
    var tag = document.createElement("span");
    tag.className = "recommend-card__reason";
    tag.textContent = r;
    reasons.appendChild(tag);
  });
  card.appendChild(reasons);

  return card;
}

function renderCards() {
  const container = $(".js-cards");
  const countEl = $(".js-result-count");
  const plans = filterPlans();

  countEl.textContent = plans.length + "件のプランが見つかりました";

  container.innerHTML = "";
  renderRecommend();

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
