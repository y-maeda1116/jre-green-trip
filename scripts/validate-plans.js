#!/usr/bin/env node
"use strict";

/**
 * PLANS / SEASON_BLOCKS の検証スクリプト
 * 外部ライブラリ不使用（Node.js 標準モジュールのみ）
 *
 * 実行方法:
 *   node scripts/validate-plans.js
 *
 * 終了コード:
 *   0 = 必須エラーなし（警告のみの場合も 0）
 *   1 = 必須項目のエラーあり
 */

const path = require("path");

const DATA_PATH = process.env.JRE_DATA_PATH
  ? path.resolve(process.env.JRE_DATA_PATH)
  : path.join(__dirname, "..", "docs", "js", "data.js");

const ALLOWED_STATIONS = ["東京", "品川", "新宿", "上野", "横浜"];
const ALLOWED_TYPES = ["全休", "午後休"];
const ID_PATTERN = /^[a-z]+-[a-z]+-\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function loadData() {
  delete require.cache[require.resolve(DATA_PATH)];
  return require(DATA_PATH);
}

function validate() {
  const data = loadData();
  const PLANS = data.PLANS;
  const SEASON_BLOCKS = data.SEASON_BLOCKS;

  const errors = [];
  const warnings = [];

  if (!Array.isArray(PLANS) || PLANS.length === 0) {
    console.error("[ERROR] PLANS が空、または配列ではありません");
    process.exit(1);
  }

  const blockByName = {};
  SEASON_BLOCKS.forEach(function (b) { blockByName[b.name] = b; });

  function fail(planId, field, expected, actual) {
    errors.push("[ERROR] " + planId + ": " + field + " 期待=" + expected + " 実際=" + actual);
  }
  function warn(planId, field, message) {
    warnings.push("[WARN]  " + planId + ": " + field + " " + message);
  }

  const seenIds = {};
  PLANS.forEach(function (p) {
    const id = p.id || "(idなし)";

    // id 一意
    if (seenIds[p.id]) fail(id, "id", "一意", "duplicate plan id");
    else seenIds[p.id] = true;

    // id 命名規則（発駅-目的地-月）
    if (typeof p.id !== "string" || !ID_PATTERN.test(p.id)) {
      fail(id, "id", "発駅-目的地-月 (例: tokyo-narita-06)", JSON.stringify(p.id));
    }

    // baseStations は許可発駅のみ
    if (!Array.isArray(p.baseStations) || p.baseStations.length === 0) {
      fail(id, "baseStations", "1件以上の配列", JSON.stringify(p.baseStations));
    } else {
      p.baseStations.forEach(function (s) {
        if (!ALLOWED_STATIONS.includes(s)) fail(id, "baseStations", ALLOWED_STATIONS.join("/"), JSON.stringify(s));
      });
    }

    // targetMonth は 1〜12 の整数
    if (!Array.isArray(p.targetMonth) || p.targetMonth.length === 0) {
      fail(id, "targetMonth", "1〜12の整数配列", JSON.stringify(p.targetMonth));
    } else {
      p.targetMonth.forEach(function (m) {
        if (!Number.isInteger(m) || m < 1 || m > 12) fail(id, "targetMonth", "1〜12の整数", JSON.stringify(m));
      });
    }

    // seasonBlock は SEASON_BLOCKS に存在
    const blockName = typeof p.seasonBlock === "string" ? p.seasonBlock.split("（")[0] : "";
    const block = blockByName[blockName];
    if (!block) fail(id, "seasonBlock", "SEASON_BLOCKS の name のいずれか", JSON.stringify(p.seasonBlock));

    // 対象月が季節ブロックに含まれる
    if (block && Array.isArray(p.targetMonth)) {
      p.targetMonth.forEach(function (m) {
        if (!block.months.includes(m)) {
          fail(id, "targetMonth", blockName + " の対象月(" + block.months.join(",") + ")に含まれること", m + " is not included in season block " + blockName);
        }
      });
    }

    // type は 全休/午後休
    if (!ALLOWED_TYPES.includes(p.type)) fail(id, "type", ALLOWED_TYPES.join("/"), JSON.stringify(p.type));

    // oneWayMinutes は正の整数
    if (!Number.isInteger(p.oneWayMinutes) || p.oneWayMinutes <= 0) {
      fail(id, "oneWayMinutes", "正の整数", JSON.stringify(p.oneWayMinutes));
    }

    // spots は1件以上
    if (!Array.isArray(p.spots) || p.spots.length === 0) {
      fail(id, "spots", "1件以上の配列", JSON.stringify(p.spots));
    }

    // scheduleSample は空でない
    if (typeof p.scheduleSample !== "string" || p.scheduleSample.trim() === "") {
      fail(id, "scheduleSample", "空でない文字列", JSON.stringify(p.scheduleSample));
    }

    // greenCarSection は { from, to, line }
    const gc = p.greenCarSection;
    if (!gc || typeof gc !== "object" || !gc.from || !gc.to || !gc.line) {
      fail(id, "greenCarSection", "{ from, to, line }", JSON.stringify(gc));
    }

    // lastVerified は日付形式（推奨・現段階では警告）
    if (!p.lastVerified) {
      warn(id, "lastVerified", "未設定。最終確認日(YYYY-MM-DD)の登録を推奨");
    } else if (!DATE_PATTERN.test(p.lastVerified)) {
      warn(id, "lastVerified", "日付形式(YYYY-MM-DD)でない", JSON.stringify(p.lastVerified));
    }

    // officialUrl は設定されていれば HTTPS（推奨）
    if (p.officialUrl !== undefined && p.officialUrl !== "" && !/^https:\/\//.test(p.officialUrl)) {
      warn(id, "officialUrl", "HTTPS URL でない", JSON.stringify(p.officialUrl));
    }
  });

  // カバレッジ警告（指定軸の組み合わせが0件なら警告）
  coverageWarnings(PLANS, SEASON_BLOCKS, warnings);

  return { planCount: PLANS.length, errors: errors, warnings: warnings };
}

function coverageWarnings(PLANS, SEASON_BLOCKS, warnings) {
  function check(getA, allA, getB, allB, labelA, labelB) {
    const covered = {};
    PLANS.forEach(function (p) {
      const b = getB(p);
      getA(p).forEach(function (a) {
        covered[a + "\t" + b] = true;
      });
    });
    const missing = [];
    allA.forEach(function (a) {
      allB.forEach(function (b) {
        if (!covered[a + "\t" + b]) missing.push(labelA + "=" + a + " × " + labelB + "=" + b);
      });
    });
    if (missing.length) {
      warnings.push("[COVER] " + labelA + " × " + labelB + ": " + missing.length + "件の組み合わせが未カバー\n    " + missing.join("\n    "));
    }
  }

  check(
    function (p) { return p.baseStations; }, ALLOWED_STATIONS,
    function (p) { return p.seasonBlock.split("（")[0]; }, SEASON_BLOCKS.map(function (b) { return b.name; }),
    "発駅", "季節ブロック"
  );
  check(
    function (p) { return p.targetMonth; }, Array.from({ length: 12 }, function (_, i) { return i + 1; }),
    function (p) { return p.type; }, ALLOWED_TYPES,
    "月", "休暇タイプ"
  );
  check(
    function (p) { return p.baseStations; }, ALLOWED_STATIONS,
    function (p) { return p.type; }, ALLOWED_TYPES,
    "発駅", "休暇タイプ"
  );
}

const result = validate();

if (result.warnings.length) {
  console.log("=== 警告（推奨事項・カバレッジ）===");
  result.warnings.forEach(function (w) { console.log(w); });
  console.log("");
}

if (result.errors.length) {
  console.error("=== エラー（必須項目違反）===");
  result.errors.forEach(function (e) { console.error(e); });
  console.error("\n" + result.errors.length + "件のエラーがあります。");
  process.exit(1);
}

console.log("検証完了: " + result.planCount + "プラン、必須エラー0件（警告" + result.warnings.length + "件）");
process.exit(0);
