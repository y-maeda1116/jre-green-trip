# jre-green-trip — プロジェクトルール

JRE BANK の「普通列車グリーン券（有効期限3ヶ月）」を無駄なく消費するための、日帰り・半日旅プラン表示サイト。

- 公開サイト: https://jre-green.maeda.coffee/ （GitHub Pages / `docs/` をそのまま公開）
- 非公式の参考サイト。JR東日本とは無関係

## 技術スタック

- Vanilla JS（フレームワーク不使用）+ 静的 HTML/CSS。**ビルドステップなし**
- サイト本体は `docs/` 配下のみ。変更は `docs/` だけで完結する

## ファイル構成

```
docs/                     # サイト本体（GitHub Pages で公開）
├── index.html            # 3ページ構成のエントリポイント
├── css/style.css
└── js/
    ├── data.js           # PLANS（旅プラン）+ SEASON_BLOCKS ★編集対象
    ├── map.js            # ROUTE_LINES（路線・所要時間）・利用ルール本文
    ├── app.js            # フィルタ・カード描画・期限アラート
    └── recommend.js
scripts/
├── validate-plans.js     # PLANS / SEASON_BLOCKS の検証スクリプト
└── apply-security.sh     # security-base 由来（他リポジトリへ適用するスクリプト）
tools/sync/               # security-base 由来の Go 製同期ツール
configs/                  # security-base 由来の Lint 共通設定
.github/workflows/        # pages.yml（Pages デプロイ）+ security-base 由来のセキュリティCI
```

## データ編集（PLANS / SEASON_BLOCKS）

- プランは `docs/js/data.js` の `PLANS` 配列に追加する。フィールド詳細は `README.md` の「プランの追加方法」を参照
- `baseStations` は配列（旧 `baseStation` 文字列は移行済み）。所要時間順ソートは `oneWayMinutes`、グリーン車区間は `greenCarSection` を使用
- 編集後は必ず検証スクリプトを実行する:

```bash
node scripts/validate-plans.js
```

- エラー（終了コード1）: ID重複・`baseStations`/`targetMonth`/`seasonBlock`/`type` 等の不整合
- 警告（終了コード0）: `lastVerified` 未設定・カバレッジ不足（発駅×季節ブロック等の未カバー組み合わせ）

## ローカル確認

```bash
open docs/index.html   # または任意のライブサーバーで docs/ を配信
```

## 必須ルール（security-base 継承）

本リポジトリは [security-base](https://github.com/y-maeda1116/security-base) 由来のセキュリティCI設定を継承している。

### GitHub Actions は SHA ピン留め必須

`uses:` にはタグ (`@v4`) ではなく **コミットSHA** を使用する。Dependabot が週次でSHA付き更新PRを作成するため、タグ版を使う理由はない。

### コミット規約

Conventional Commits を使用: `feat:` / `fix:` / `refactor:` / `test:` / `docs:` / `chore:` / `ci:` / `build(deps):`

### 依存関係

- `tools/sync`（Go）は Dependabot が `gomod` で日次更新
- GitHub Actions は Dependabot が日次更新（SHAピン留め維持）

## デプロイ

`main` への push で `pages.yml` が `docs/` を GitHub Pages へ自動デプロイ（`paths: [docs/**]` でトリガー）。手動は workflow_dispatch。
