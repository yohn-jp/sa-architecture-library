# System Architect Library

システムアーキテクトの知識と設計判断をつなぐ、静的な読書ライブラリ。

- [公開サイト](https://yohn-jp.github.io/sa-architecture-library/)
- [午後Ⅰ CBT型記述演習](https://architect.library.yohn.jp/practice/pm1/)
- [コンプリートテキスト](https://yohn-jp.github.io/sa-architecture-library/complete/)
- [第1巻・業務分析と要求工学（7章）](https://yohn-jp.github.io/sa-architecture-library/books/requirements/)
- [副読本一覧](https://yohn-jp.github.io/sa-architecture-library/books/)
- [シラバス対応索引](https://yohn-jp.github.io/sa-architecture-library/syllabus/)

副読本は既存教材を出発点とする独自解説。公式資料に由来する知識、説明用の架空事例、設計上の推論を区別し、章末に出典と照合範囲を記す。IPAによる公式教材・認定教材ではない。

## 執筆

本文は `src/content/books/<volume>/<chapter>.md`。巻・章の識別子はURLを維持するため変更しない。frontmatterの `volume`, `order`, `title`, `description`, `syllabus`, `completeChapters`, `reviewed` を定義する。未公開の原稿は `draft: true` とする。

目次、章ページ、前後の章、シラバス索引、検索索引は本文とメタデータから生成する。新しい本文を追加するためにページを個別実装する必要はない。原本の `public/complete/index.html` は変更しない。

## 開発・検証

```sh
npm install
npm run dev
npm run check
npm run build
python3 scripts/verify_site.py
npx playwright install --with-deps chromium
npm run verify:reader
```

GitHub Actionsで静的検査、ビルド、内部リンク・アンカー・原本ハッシュ、デスクトップ／モバイル表示・読書操作・日本語検索を確認してからPagesへ配信する。検証の成功は文章内容が自動的に正しいことを意味しない。本文の事実と出典は別に照合する。

[午後Ⅰ演習契約](docs/PM1.md) / [編集方針](docs/EDITORIAL.md) / [構成](docs/ARCHITECTURE.md) / [再開位置](docs/PROGRESS.md)
