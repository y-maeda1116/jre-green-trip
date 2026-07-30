/**
 * プラン推薦ロジック（純粋関数）
 * app.js（ブラウザ描画）と Node テストの両方で利用する。
 *
 * 優先順位:
 *   1. 現在利用可能な季節ブロック（期限切れ除外）
 *   2. 利用予定月（現在月）の一致
 *   3. 発駅の一致
 *   4. 全休／午後休の一致
 *   5. 片道所要時間（期限に応じて重み変更）
 *   6. 最終確認日の新しさ
 */

function getUpcomingDeadlinesFrom(SEASON_BLOCKS, now) {
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  return SEASON_BLOCKS.map(function (block) {
    var dlYear = year;
    if (block.deadlineMonth === 1 && month > 1) dlYear++;
    var day = block.deadlineMonth === 1 ? 31 : 30;
    var date = new Date(dlYear, block.deadlineMonth - 1, day);
    return {
      name: block.name,
      months: block.months,
      issueMonth: block.issueMonth,
      deadlineMonth: block.deadlineMonth,
      date: date,
      year: dlYear,
      day: day
    };
  })
    .filter(function (d) { return d.date >= now; })
    .sort(function (a, b) { return a.date - b.date; });
}

function recommendPlans(PLANS, SEASON_BLOCKS, context) {
  var now = context.now;
  var baseStation = context.baseStation; // "all" or 駅名
  var type = context.type;               // "all" or 全休/午後休
  var currentMonth = now.getMonth() + 1;

  var deadlines = getUpcomingDeadlinesFrom(SEASON_BLOCKS, now);
  // 現在月を含み、期限切れでないブロック（= 現在利用可能）
  var activeBlocks = deadlines.filter(function (d) { return d.months.indexOf(currentMonth) !== -1; });

  if (activeBlocks.length === 0) {
    return { items: [], meta: { message: "現在利用可能な季節ブロックがありません。", diffDays: null, hasExactMatch: false, isFallback: false, candidateCount: 0 } };
  }

  var nearestBlock = activeBlocks[0];
  var diffDays = Math.ceil((nearestBlock.date - now) / (1000 * 60 * 60 * 24));
  var activeNames = activeBlocks.map(function (b) { return b.name; });

  // 期限切れブロックを除外した候補
  var candidates = PLANS.filter(function (p) {
    var name = p.seasonBlock.split("（")[0];
    return activeNames.indexOf(name) !== -1;
  });

  var scored = candidates.map(function (p) {
    var score = 0;
    var reasons = [];

    if (p.targetMonth.indexOf(currentMonth) !== -1) {
      score += 30;
      reasons.push("今月（" + currentMonth + "月）利用できる季節ブロックです");
    }
    if (baseStation && baseStation !== "all" && p.baseStations.indexOf(baseStation) !== -1) {
      score += 20;
      reasons.push(baseStation + "発の条件に一致しています");
    }
    if (type && type !== "all" && p.type === type) {
      score += 15;
      reasons.push(type + "の条件に一致しています");
    }
    // 期限までの日数に応じた片道時間の重み付け
    if (diffDays < 3) {
      if (p.type === "午後休") score += 10;
      if (p.oneWayMinutes <= 60) {
        score += 15;
        reasons.push("片道" + p.oneWayMinutes + "分のため期限直前でも計画しやすいプランです");
      }
    } else if (diffDays < 8) {
      if (p.oneWayMinutes <= 90) {
        score += 10;
        reasons.push("片道90分以内のため期限近でも立ち寄りやすいプランです");
      }
    }
    if (p.lastVerified) {
      score += 5;
      reasons.push("最終確認日が新しいプランです");
    }
    if (reasons.length === 0) reasons.push(nearestBlock.name + "のグリーン券で利用可能なプランです");
    return { plan: p, score: score, reasons: reasons };
  });

  scored.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.plan.oneWayMinutes - b.plan.oneWayMinutes; // 同点なら所要時間が短い順
  });

  // 完全一致（月・発駅・休暇タイプのすべて一致）があるか
  var hasExactMatch = scored.some(function (s) {
    var monthOk = s.plan.targetMonth.indexOf(currentMonth) !== -1;
    var stationOk = !baseStation || baseStation === "all" || s.plan.baseStations.indexOf(baseStation) !== -1;
    var typeOk = !type || type === "all" || s.plan.type === type;
    return monthOk && stationOk && typeOk;
  });

  return {
    items: scored.slice(0, 3),
    meta: {
      activeBlock: nearestBlock.name,
      deadlineMonth: nearestBlock.deadlineMonth,
      diffDays: diffDays,
      hasExactMatch: hasExactMatch,
      isFallback: !hasExactMatch && scored.length > 0,
      candidateCount: candidates.length
    }
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { recommendPlans: recommendPlans, getUpcomingDeadlinesFrom: getUpcomingDeadlinesFrom };
}
