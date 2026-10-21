/** Independently authored notes keyed by "<year id>:<question number>".
 * Original external commentary is linked, not copied into the repository.
 */
export interface Am2Explanation {
  text: string;
  sources?: ReadonlyArray<{ title: string; url: string }>;
}

export const am2Explanations: Readonly<Record<string, Am2Explanation>> = {
  '2025r07h:1': {
    text: "正解：エ。DFD（データフロー図）は、①外部のデータの出入り口である「源泉と吸収（外部実体）」、②入力データを処理する「プロセス」、③データの移動を表す「データフロー」、④データの保存先を表す「データストア」で構成されます。エの三要素はすべてDFDの図形要素です。ア・イに含まれる「関連」は、実体間の関係を表すE-R図の用語です。ア・ウの「実体」も、この問題ではE-R図の構成要素を指します。DFDはデータの流れ、E-R図はデータの構造を表すという違いが判断の鍵です。"
  },
  '2025r07h:2': {
    text: "正解：エ。開放・閉鎖原則（OCP：Open/Closed Principle）は、ソフトウェアの構成要素を「拡張に対して開き、既存の実装の変更に対して閉じる」ように設計する原則です。新しい機能を追加しても既存モジュールをできるだけ修正せず、他のモジュールへの影響を抑えるエが該当します。アは単一責任原則（SRP）：クラスの変更理由を一つに絞る考え方。イはインタフェース分離原則（ISP）：利用者が不要な操作に依存しないようインタフェースを分割する考え方。ウは依存性逆転原則（DIP）：上位・下位のモジュールがともに抽象に依存する考え方です。いずれもSOLID原則ですが、問われているのは拡張と既存コードの変更の関係です。"
  },
  '2025r07h:3': {
    text: "正解：イ（Keycloak）。複数のWebサイトの認証を連携させ、一度のログインで別のサイトも利用できる仕組みはシングルサインオン（SSO）です。KeycloakはOSSのアイデンティティ・アクセス管理製品で、OpenID ConnectやSAMLなどを用いた認証連携を実現できます。アのBINDはDNSサーバソフトウェアで、名前解決を担当します。ウのLogstashはログやイベントデータの収集・変換・転送を行うツールです。エのOpenSSLはTLSや暗号処理を実装するライブラリ・ツール群であり、それ単体でSSOの認証基盤にはなりません。認証（誰かを確かめる）と暗号化・名前解決を区別しましょう。"
  },
  '2025r07h:4': {
    text: "正解：ウ（MapReduce）。問題文の「入力から中間キーと値の組を生成する」処理がMap、「同じキーの値をまとめて加工する」処理がReduceに対応します。Map処理は入力データを並列に変換し、キーによるグルーピングを経てReduce処理が集計します。アの2相コミットは分散トランザクションのコミット可否を参加者間で調整する手順です。イのKVSはキーを使って値を格納・取得するデータストアで、2段階の分散計算モデルではありません。エのマルチスレッドは一つのプロセス内で複数の実行系列を扱う仕組みで、MapとReduceの処理段階を規定しません。「キーと値の生成→キー単位の集約」が決め手です。"
  },
  '2025r07h:5': {
    text: "正解：ア。Observerパターンは、あるオブジェクト（Subject）の状態変化を、その変化を監視する登録済みオブジェクト（Observer）に通知する仕組みです。状態の変化とそれに伴う更新処理を疎結合にできます。アの「依存するオブジェクトへ自動通知」が該当します。イはDecoratorパターンで、既存オブジェクトを包んで機能を追加します。ウはSingletonパターンで、インスタンスを一つに制限します。エはIteratorパターンで、異なるコンテナの要素を統一的な方法で順次参照します。Observerの要点は「状態変化の通知」であり、単に複数のオブジェクトを扱うことではありません。"
  },
  '2023r05h:13': {
    text: 'ABC（活動基準原価計算）では、活動ごとに時間単価を求めます。見積作成は(50＋100)時間に60万円なので0.4万円/時。製品Xの50時間を20％短縮すると50×0.4×0.2＝4万円です。提案書作成は(50＋400)時間に360万円なので0.8万円/時。製品Xの50時間を20％短縮すると50×0.8×0.2＝8万円です。合計は4＋8＝12万円（ウ）。二つの活動の単価を平均してしまうと、14万円という誤答になります。'
  },
  '2016h28a:1': {
    text: 'JIS X 0160のシステム要求事項分析プロセスでは、利害関係者の要求をシステムの技術的要求に整理し、関係者へ伝えて合意済みの基準（ベースライン）とします。したがってウが正解です。アは方式設計、イはシステム結合、エは適格性確認テストの成果を述べています。規格のプロセス名と成果物を対応付けて覚える問題です。'
  },
  '2018h30a:1': {
    text: 'CRUDマトリックスは、業務機能とデータ（エンティティ）を交差させ、各機能がデータを作成（Create）、参照（Read）、更新（Update）、削除（Delete）するかを整理します。イが正解です。アはデシジョンテーブル、ウはデータの流れを扱うDFD、エは実体間の関係を扱うE-R図です。'
  },
  '2022r04h:1': {
    text: 'インセプションデッキは、アジャイル開発の立ち上げ時に、プロジェクトの目的、対象範囲、制約や懸念について関係者の認識をそろえるための問いのセットです。イが正解です。プランニングポーカは見積り、ユーザーストーリーマッピングは利用者の行動と機能の整理に用います。'
  },
  '2017h29a:1': {
    text: 'INVESTはユーザーストーリーの品質を点検する六つの観点です。Independent（独立）、Negotiable（交渉可能）、Valuable（価値がある）、Estimable（見積可能）、Small（小さい）、Testable（検証可能）の頭文字を取っています。したがって質の高いユーザーストーリーかを評価するエが正解です。UML図やDFDの作成方法を評価するものではありません。'
  },
  '2021r03h:25': {
    text: 'PC側でWebサーバとのTCP接続に使われているポート番号を確認するには、接続一覧を表示するnetstatを使います。正解はイです。ipconfig/ifconfigはインタフェース設定、nslookup/digは名前解決、tracert/tracerouteは経路調査のためのコマンドであり、確立済み接続のローカルポートを確認する目的とは異なります。'
  },
  '2019r01a:24': {
    text: 'AESは暗号化と復号に同じ秘密鍵を使う共通鍵暗号方式です。アが正解です。RSA、ElGamal、楕円曲線暗号は公開鍵暗号の代表例です。試験では暗号方式を共通鍵暗号・公開鍵暗号・ハッシュ関数に分類できることが重要です。'
  }
};

/** Independently published commentary: verified year-level pages, not copied text. */
const externalSets: Readonly<Record<string, string>> = {
  '2025r07h': 'https://pasuteku.com/sets/2025r07h-sa-am2',
  '2024r06h': 'https://shikakutech.com/itee/sa/subject-a2/2024s',
  '2023r05h': 'https://pasuteku.com/sets/2023r05h-sa-am2',
  '2022r04h': 'https://pasuteku.com/sets/2022r04h-sa-am2',
  '2021r03h': 'https://pasuteku.com/sets/2021r03h-sa-am2',
  '2019r01a': 'https://pasuteku.com/sets/2019r01a-sa-am2',
  '2018h30a': 'https://pasuteku.com/sets/2018h30a-sa-am2',
  '2017h29a': 'https://shikakutech.com/itee/sa/subject-a2/2017a',
  '2016h28a': 'https://pasuteku.com/sets/2016h28a-sa-am2'
};

export function findAm2Explanation(yearId: string, questionNumber: number): Am2Explanation | undefined {
  return am2Explanations[yearId + ':' + questionNumber];
}

export function externalAm2ExplanationUrl(yearId: string): string | undefined {
  return externalSets[yearId];
}
