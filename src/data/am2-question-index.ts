/** The library's own 225-question topic and chapter index.
 * Chapter-level generic tips are intentionally omitted: they are not
 * individually verified explanations of each question.
 */
export interface Am2QuestionIndexEntry {
  title: string;
  chapter: number;
}

export const am2QuestionIndex: Readonly<Record<string, Am2QuestionIndexEntry>> = {
  "2016:1": {
    "title": "JIS X 0160:2012のシステム要求事項分析と成果",
    "chapter": 2
  },
  "2016:2": {
    "title": "共通フレームのシステム方式設計と要求割当",
    "chapter": 2
  },
  "2016:3": {
    "title": "DFDの要素とERモデルとの区別",
    "chapter": 4
  },
  "2016:4": {
    "title": "ペトリネットの並行・同期表現",
    "chapter": 5
  },
  "2016:5": {
    "title": "論理データモデルのトップダウン／ボトムアップ",
    "chapter": 17
  },
  "2016:6": {
    "title": "デマルコ構造化開発とライフサイクル",
    "chapter": 8
  },
  "2016:7": {
    "title": "モジュール分割技法と情報隠蔽",
    "chapter": 6
  },
  "2016:8": {
    "title": "JIS X 25010の利用時品質・効率性",
    "chapter": 10
  },
  "2016:9": {
    "title": "組込みC言語のコーディング規約（MISRA C）",
    "chapter": 26
  },
  "2016:10": {
    "title": "ブラックボックステストと試験データ",
    "chapter": 11
  },
  "2016:11": {
    "title": "エラー埋込み法と潜在欠陥数の推計",
    "chapter": 11
  },
  "2016:12": {
    "title": "分散拠点システムの保守方式",
    "chapter": 2
  },
  "2016:13": {
    "title": "ユースケース駆動開発と要求から実装への橋渡し",
    "chapter": 3
  },
  "2016:14": {
    "title": "Privacy by Designと事前のプライバシー組込み",
    "chapter": 23
  },
  "2016:15": {
    "title": "グリーン購入法と環境物品等",
    "chapter": 24
  },
  "2016:16": {
    "title": "請負と準委任の工程別適合",
    "chapter": 24
  },
  "2016:17": {
    "title": "EA／業務機能情報関連図としてのDFD",
    "chapter": 4
  },
  "2016:18": {
    "title": "RAIDレベルの違いとパリティ／ミラー",
    "chapter": 15
  },
  "2016:19": {
    "title": "分散処理の障害透明性",
    "chapter": 7
  },
  "2016:20": {
    "title": "累積故障率・故障率・バスタブ曲線",
    "chapter": 13
  },
  "2016:21": {
    "title": "コミット確定と永続化ログ",
    "chapter": 18
  },
  "2016:22": {
    "title": "SANと専用ストレージネットワーク",
    "chapter": 15
  },
  "2016:23": {
    "title": "JIS Q 27014の情報セキュリティガバナンス",
    "chapter": 23
  },
  "2016:24": {
    "title": "Web攻撃と防御手段の対応",
    "chapter": 21
  },
  "2016:25": {
    "title": "WPA2と暗号方式",
    "chapter": 22
  },
  "2017:1": {
    "title": "INVESTと良いユーザーストーリー",
    "chapter": 9
  },
  "2017:2": {
    "title": "機能要件を満たす設計と非機能要件",
    "chapter": 3
  },
  "2017:3": {
    "title": "UMLクラス図で注文・注文明細の多重度を読む",
    "chapter": 5
  },
  "2017:4": {
    "title": "SysMLと複合システム（SoS）",
    "chapter": 5
  },
  "2017:5": {
    "title": "GoFデザインパターンとPOSAの分類",
    "chapter": 6
  },
  "2017:6": {
    "title": "組込みのハードウェア／ソフトウェア協調設計",
    "chapter": 26
  },
  "2017:7": {
    "title": "イベント処理のタイミングを表すモデル",
    "chapter": 5
  },
  "2017:8": {
    "title": "フェールセーフ・フールプルーフ・冗長化",
    "chapter": 13
  },
  "2017:9": {
    "title": "エラー埋込み法の実数値計算",
    "chapter": 11
  },
  "2017:10": {
    "title": "ペアプログラミングと役割交替",
    "chapter": 9
  },
  "2017:11": {
    "title": "探索的テストの実践",
    "chapter": 11
  },
  "2017:12": {
    "title": "FMEAとFTAの向きの違い",
    "chapter": 13
  },
  "2017:13": {
    "title": "ドメインエンジニアリングと再利用",
    "chapter": 8
  },
  "2017:14": {
    "title": "戦略的IT投資に対応するKPI",
    "chapter": 25
  },
  "2017:15": {
    "title": "グラントバックの意味と利用許諾",
    "chapter": 24
  },
  "2017:16": {
    "title": "実費償還型契約と固定価格型契約",
    "chapter": 24
  },
  "2017:17": {
    "title": "データサイエンティストのスキルセット",
    "chapter": 27
  },
  "2017:18": {
    "title": "CPI、命令数、周波数から実行時間",
    "chapter": 14
  },
  "2017:19": {
    "title": "HTTPを用いないオンライン対戦の通信",
    "chapter": 19
  },
  "2017:20": {
    "title": "アムダールの法則と並列化率",
    "chapter": 14
  },
  "2017:21": {
    "title": "クラス図から外部キーの関係モデルへ",
    "chapter": 17
  },
  "2017:22": {
    "title": "既設PBXをIP電話へ統合するゲートウェイ",
    "chapter": 19
  },
  "2017:23": {
    "title": "ソフトウェア署名とコード署名証明書",
    "chapter": 20
  },
  "2017:24": {
    "title": "AESの規定鍵長",
    "chapter": 20
  },
  "2017:25": {
    "title": "587番ポート・SMTP Submission",
    "chapter": 19
  },
  "2018:1": {
    "title": "CRUDマトリックスの読解",
    "chapter": 4
  },
  "2018:2": {
    "title": "要求分析の成果を承認する主体",
    "chapter": 2
  },
  "2018:3": {
    "title": "CMMIのプロセス領域と運用構想",
    "chapter": 10
  },
  "2018:4": {
    "title": "アシュアランスケースの主張・論拠・証拠",
    "chapter": 10
  },
  "2018:5": {
    "title": "ソフトウェア要求定義で決める内容",
    "chapter": 3
  },
  "2018:6": {
    "title": "JIS X 25010:2013 製品品質特性",
    "chapter": 10
  },
  "2018:7": {
    "title": "要求分析・設計技法の適用条件",
    "chapter": 5
  },
  "2018:8": {
    "title": "ソフトウェア構築プロセスのタスク",
    "chapter": 8
  },
  "2018:9": {
    "title": "ブラックボックステストケース設計",
    "chapter": 11
  },
  "2018:10": {
    "title": "全数検査の期待費用と費用削減",
    "chapter": 11
  },
  "2018:11": {
    "title": "制御フロー上の分岐条件",
    "chapter": 12
  },
  "2018:12": {
    "title": "システム適格性確認と要求への適合",
    "chapter": 2
  },
  "2018:13": {
    "title": "スクラムのレトロスペクティブ",
    "chapter": 9
  },
  "2018:14": {
    "title": "共通フレームにおける要求の識別",
    "chapter": 3
  },
  "2018:15": {
    "title": "WTO政府調達協定",
    "chapter": 24
  },
  "2018:16": {
    "title": "非反復費用（NRE）",
    "chapter": 25
  },
  "2018:17": {
    "title": "バランスト・スコアカードと投資評価",
    "chapter": 25
  },
  "2018:18": {
    "title": "FC（Fibre Channel）の特徴",
    "chapter": 15
  },
  "2018:19": {
    "title": "マルチプロセッサ性能とオーバーヘッド",
    "chapter": 14
  },
  "2018:20": {
    "title": "キャパシティプランニングの目的",
    "chapter": 16
  },
  "2018:21": {
    "title": "候補キーの一意性・最小性",
    "chapter": 17
  },
  "2018:22": {
    "title": "SANとFCストレージ接続",
    "chapter": 15
  },
  "2018:23": {
    "title": "格納型クロスサイトスクリプティング",
    "chapter": 21
  },
  "2018:24": {
    "title": "Common Criteria（ISO/IEC 15408）",
    "chapter": 23
  },
  "2018:25": {
    "title": "Webアプリケーションの脅威と対策",
    "chapter": 21
  },
  "2019:1": {
    "title": "階層DFDの入出力バランシング",
    "chapter": 4
  },
  "2019:2": {
    "title": "並行・同期を表すペトリネット",
    "chapter": 5
  },
  "2019:3": {
    "title": "GoFの生成・構造・振る舞い分類",
    "chapter": 6
  },
  "2019:4": {
    "title": "Servletのメソッドオーバーライド",
    "chapter": 6
  },
  "2019:5": {
    "title": "再帰呼出しとスタックの性質",
    "chapter": 6
  },
  "2019:6": {
    "title": "ソフトウェアの使用性向上",
    "chapter": 10
  },
  "2019:7": {
    "title": "境界値・同値分割を考えたテストデータ",
    "chapter": 11
  },
  "2019:8": {
    "title": "アサーション（実行時検証）",
    "chapter": 12
  },
  "2019:9": {
    "title": "組込み変更後の回帰テスト",
    "chapter": 11
  },
  "2019:10": {
    "title": "結合後ソフトウェアの適格性確認",
    "chapter": 11
  },
  "2019:11": {
    "title": "バグ管理図と欠陥収束の見極め",
    "chapter": 11
  },
  "2019:12": {
    "title": "AIチャットシステムのテスト",
    "chapter": 27
  },
  "2019:13": {
    "title": "KPTとふりかえり",
    "chapter": 9
  },
  "2019:14": {
    "title": "UMLアクティビティ図の分岐・並行",
    "chapter": 5
  },
  "2019:15": {
    "title": "ランニングロイヤリティ",
    "chapter": 24
  },
  "2019:16": {
    "title": "グラントバック",
    "chapter": 24
  },
  "2019:17": {
    "title": "ディープラーニングの識別",
    "chapter": 27
  },
  "2019:18": {
    "title": "プロセッサの命令読取り構成",
    "chapter": 14
  },
  "2019:19": {
    "title": "ページフォールトと実効アクセス時間",
    "chapter": 14
  },
  "2019:20": {
    "title": "直列・並列構成の稼働不能確率",
    "chapter": 13
  },
  "2019:21": {
    "title": "完全関数従属性と正規化",
    "chapter": 17
  },
  "2019:22": {
    "title": "PBXとIP電話の接続機器",
    "chapter": 19
  },
  "2019:23": {
    "title": "コード署名用証明書",
    "chapter": 20
  },
  "2019:24": {
    "title": "共通鍵暗号方式の識別",
    "chapter": 20
  },
  "2019:25": {
    "title": "セキュアOSの保護機構",
    "chapter": 21
  },
  "2021:1": {
    "title": "アシュアランスケースの目的",
    "chapter": 10
  },
  "2021:2": {
    "title": "垂直プロトタイプと水平プロトタイプ",
    "chapter": 3
  },
  "2021:3": {
    "title": "ウォークスルーとレビュー",
    "chapter": 8
  },
  "2021:4": {
    "title": "イベント処理モデル",
    "chapter": 5
  },
  "2021:5": {
    "title": "マイクロサービス分割の利点と分散の代償",
    "chapter": 7
  },
  "2021:6": {
    "title": "オブジェクト指向の汎化",
    "chapter": 6
  },
  "2021:7": {
    "title": "分岐網羅と条件網羅",
    "chapter": 11
  },
  "2021:8": {
    "title": "引数の値渡し／参照渡し",
    "chapter": 6
  },
  "2021:9": {
    "title": "システム適格性確認と要求",
    "chapter": 2
  },
  "2021:10": {
    "title": "信頼性の副特性・回復性",
    "chapter": 10
  },
  "2021:11": {
    "title": "保守変更に伴うライフサイクルプロセス",
    "chapter": 2
  },
  "2021:12": {
    "title": "開発モデルと要求の確定度",
    "chapter": 8
  },
  "2021:13": {
    "title": "ビジネスモデルキャンバス",
    "chapter": 4
  },
  "2021:14": {
    "title": "ユースケース図の境界とアクター",
    "chapter": 3
  },
  "2021:15": {
    "title": "WTO政府調達協定",
    "chapter": 24
  },
  "2021:16": {
    "title": "CEMと顧客経験価値",
    "chapter": 25
  },
  "2021:17": {
    "title": "Stored XSSの攻撃成立",
    "chapter": 21
  },
  "2021:18": {
    "title": "OCSPで証明書失効確認",
    "chapter": 20
  },
  "2021:19": {
    "title": "NOTICEのIoT機器調査",
    "chapter": 22
  },
  "2021:20": {
    "title": "SMTP Submission（587番ポート）",
    "chapter": 19
  },
  "2021:21": {
    "title": "パイプライン実行時間の公式",
    "chapter": 14
  },
  "2021:22": {
    "title": "SANの接続方式",
    "chapter": 15
  },
  "2021:23": {
    "title": "フォールトトレランス",
    "chapter": 13
  },
  "2021:24": {
    "title": "SQLビューと集計結果",
    "chapter": 17
  },
  "2021:25": {
    "title": "TCPコネクションのポート番号",
    "chapter": 19
  },
  "2022:1": {
    "title": "アジャイルの共通理解形成手法（インセプションデッキ）",
    "chapter": 9
  },
  "2022:2": {
    "title": "GoFデザインパターン",
    "chapter": 6
  },
  "2022:3": {
    "title": "POSA Reflectionアーキテクチャ",
    "chapter": 6
  },
  "2022:4": {
    "title": "インプロセスDBの特徴",
    "chapter": 26
  },
  "2022:5": {
    "title": "Strategyパターンでアルゴリズム交換",
    "chapter": 6
  },
  "2022:6": {
    "title": "低結合度のデータ受渡し",
    "chapter": 6
  },
  "2022:7": {
    "title": "既存システムのDFD化手順",
    "chapter": 4
  },
  "2022:8": {
    "title": "探索的テストの具体例",
    "chapter": 11
  },
  "2022:9": {
    "title": "バグ管理図の進捗・品質判断",
    "chapter": 11
  },
  "2022:10": {
    "title": "FMEAによる故障モード分析",
    "chapter": 13
  },
  "2022:11": {
    "title": "JIS X 0160:2021の廃棄プロセス",
    "chapter": 2
  },
  "2022:12": {
    "title": "ライフサイクルプロセスのテーラリング",
    "chapter": 2
  },
  "2022:13": {
    "title": "BSC内部ビジネスプロセスKPI",
    "chapter": 25
  },
  "2022:14": {
    "title": "ファブレス・ファウンドリとLSI製造委託",
    "chapter": 26
  },
  "2022:15": {
    "title": "ラボ契約の特徴",
    "chapter": 24
  },
  "2022:16": {
    "title": "eシールと組織由来の証明",
    "chapter": 20
  },
  "2022:17": {
    "title": "マルチベクトル型DDoS",
    "chapter": 22
  },
  "2022:18": {
    "title": "暗号方式と鍵の関係",
    "chapter": 20
  },
  "2022:19": {
    "title": "CRYPTRECの役割",
    "chapter": 23
  },
  "2022:20": {
    "title": "NAPTでの外部公開・通信管理",
    "chapter": 22
  },
  "2022:21": {
    "title": "命令キャッシュの平均アクセス時間",
    "chapter": 14
  },
  "2022:22": {
    "title": "シェアードエブリシングDBクラスタ",
    "chapter": 18
  },
  "2022:23": {
    "title": "サブシステム構成と信頼性",
    "chapter": 13
  },
  "2022:24": {
    "title": "待ちグラフによるデッドロック分析",
    "chapter": 18
  },
  "2022:25": {
    "title": "PBXとIP電話の接続機器",
    "chapter": 19
  },
  "2023:1": {
    "title": "アシュアランスケース",
    "chapter": 10
  },
  "2023:2": {
    "title": "階層DFDの入出力整合",
    "chapter": 4
  },
  "2023:3": {
    "title": "SoSにおけるSysML",
    "chapter": 5
  },
  "2023:4": {
    "title": "MVCアーキテクチャで関心を分離",
    "chapter": 6
  },
  "2023:5": {
    "title": "Servletメソッドのオーバーライド",
    "chapter": 6
  },
  "2023:6": {
    "title": "デザインパターンの再利用性",
    "chapter": 6
  },
  "2023:7": {
    "title": "AIシステムのテストと判定基準",
    "chapter": 27
  },
  "2023:8": {
    "title": "JIS X 25010の品質特性",
    "chapter": 10
  },
  "2023:9": {
    "title": "ステートマシン図の遷移記法",
    "chapter": 5
  },
  "2023:10": {
    "title": "ペアプログラミング",
    "chapter": 9
  },
  "2023:11": {
    "title": "JIS X 0160の妥当性確認プロセス",
    "chapter": 2
  },
  "2023:12": {
    "title": "スクラムのふりかえり",
    "chapter": 9
  },
  "2023:13": {
    "title": "ABC原価計算と業務効率化",
    "chapter": 25
  },
  "2023:14": {
    "title": "WTO政府調達協定",
    "chapter": 24
  },
  "2023:15": {
    "title": "実費償還型契約",
    "chapter": 24
  },
  "2023:16": {
    "title": "個人スコアリングとデータ利用",
    "chapter": 23
  },
  "2023:17": {
    "title": "共通鍵暗号アルゴリズム",
    "chapter": 20
  },
  "2023:18": {
    "title": "TPM 2.0の機能",
    "chapter": 20
  },
  "2023:19": {
    "title": "ベイジアンフィルタによる迷惑メール検知",
    "chapter": 22
  },
  "2023:20": {
    "title": "デジタル署名と検証鍵",
    "chapter": 20
  },
  "2023:21": {
    "title": "ハーバードアーキテクチャ",
    "chapter": 14
  },
  "2023:22": {
    "title": "対戦型通信と独自プロトコル",
    "chapter": 19
  },
  "2023:23": {
    "title": "クラウドサービス派生データ",
    "chapter": 16
  },
  "2023:24": {
    "title": "DBMSのコミット確定条件",
    "chapter": 18
  },
  "2023:25": {
    "title": "L2スイッチとブリッジ",
    "chapter": 19
  },
  "2024:1": {
    "title": "INVESTの六条件",
    "chapter": 9
  },
  "2024:2": {
    "title": "組込みのインプロセスDB",
    "chapter": 26
  },
  "2024:3": {
    "title": "サーキットブレーカーの遮断条件",
    "chapter": 7
  },
  "2024:4": {
    "title": "デザインパターンの性質",
    "chapter": 6
  },
  "2024:5": {
    "title": "低結合なモジュール間データ伝達",
    "chapter": 6
  },
  "2024:6": {
    "title": "プログラムのアサーション",
    "chapter": 12
  },
  "2024:7": {
    "title": "AOPによる横断関心事の実装",
    "chapter": 6
  },
  "2024:8": {
    "title": "純粋関数と参照透過性",
    "chapter": 6
  },
  "2024:9": {
    "title": "論理型言語と推論",
    "chapter": 12
  },
  "2024:10": {
    "title": "JIS X 0160の移行プロセス",
    "chapter": 2
  },
  "2024:11": {
    "title": "JIS X 0160の廃棄プロセス",
    "chapter": 2
  },
  "2024:12": {
    "title": "リーンソフトウェア開発",
    "chapter": 9
  },
  "2024:13": {
    "title": "デザイン思考の手順",
    "chapter": 3
  },
  "2024:14": {
    "title": "WTO政府調達協定",
    "chapter": 24
  },
  "2024:15": {
    "title": "ファウンドリによる半導体受託製造",
    "chapter": 26
  },
  "2024:16": {
    "title": "eシールの作成者と完全性",
    "chapter": 20
  },
  "2024:17": {
    "title": "コード署名証明書",
    "chapter": 20
  },
  "2024:18": {
    "title": "AESの鍵長",
    "chapter": 20
  },
  "2024:19": {
    "title": "OCSPと失効確認",
    "chapter": 23
  },
  "2024:20": {
    "title": "JISECとITセキュリティ評価",
    "chapter": 23
  },
  "2024:21": {
    "title": "スーパースカラ方式",
    "chapter": 14
  },
  "2024:22": {
    "title": "シンプロビジョニング",
    "chapter": 15
  },
  "2024:23": {
    "title": "フェールソフトとフェールセーフ",
    "chapter": 13
  },
  "2024:24": {
    "title": "デッドロックの待ちグラフ",
    "chapter": 18
  },
  "2024:25": {
    "title": "HTTP 3xx リダイレクトの意味",
    "chapter": 19
  },
  "2025:1": {
    "title": "DFDの構成要素とER図の混同",
    "chapter": 4
  },
  "2025:2": {
    "title": "SOLIDの開放・閉鎖原則",
    "chapter": 6
  },
  "2025:3": {
    "title": "Keycloakによるシングルサインオン",
    "chapter": 20
  },
  "2025:4": {
    "title": "MapReduceのMap・Shuffle・Reduce",
    "chapter": 27
  },
  "2025:5": {
    "title": "Observerによる変更通知",
    "chapter": 6
  },
  "2025:6": {
    "title": "静的解析と実行時テスト",
    "chapter": 12
  },
  "2025:7": {
    "title": "ミューテーションテスト",
    "chapter": 11
  },
  "2025:8": {
    "title": "McCabeサイクロマティック複雑度",
    "chapter": 12
  },
  "2025:9": {
    "title": "値渡し・参照渡し",
    "chapter": 6
  },
  "2025:10": {
    "title": "Kirkpatrickの教育効果4レベル",
    "chapter": 25
  },
  "2025:11": {
    "title": "ユースケース駆動開発",
    "chapter": 3
  },
  "2025:12": {
    "title": "構造化インタビュー",
    "chapter": 3
  },
  "2025:13": {
    "title": "ユースケース図のアクター・境界",
    "chapter": 3
  },
  "2025:14": {
    "title": "ラボ契約と指揮命令",
    "chapter": 24
  },
  "2025:15": {
    "title": "協調フィルタリングの推薦",
    "chapter": 27
  },
  "2025:16": {
    "title": "オープンリゾルバ悪用のDNS増幅攻撃",
    "chapter": 22
  },
  "2025:17": {
    "title": "対策後の事象発生確率とリスク分析",
    "chapter": 23
  },
  "2025:18": {
    "title": "SSH・L2TP・LDAP・RADIUSの区別",
    "chapter": 22
  },
  "2025:19": {
    "title": "587番ポートのSMTP Submission",
    "chapter": 19
  },
  "2025:20": {
    "title": "キャッシュのセットアソシアティブ配置",
    "chapter": 14
  },
  "2025:21": {
    "title": "コンテナオーケストレーション",
    "chapter": 16
  },
  "2025:22": {
    "title": "キャッシュヒット率と平均応答時間",
    "chapter": 14
  },
  "2025:23": {
    "title": "表意コード・体系的コード付番",
    "chapter": 17
  },
  "2025:24": {
    "title": "隔離レベルと整合性／スループット",
    "chapter": 18
  },
  "2025:25": {
    "title": "ブリッジ・ルータ・リピータのOSI層",
    "chapter": 19
  }
};

export function findAm2QuestionIndex(yearId: string, number: number): Am2QuestionIndexEntry | undefined {
  return am2QuestionIndex[yearId.slice(0, 4) + ':' + number];
}
