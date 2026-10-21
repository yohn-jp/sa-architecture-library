/** Independently authored notes keyed by "<year id>:<question number>".
 * Original external commentary is linked, not copied into the repository.
 */
export interface Am2Explanation {
  text: string;
  sources?: ReadonlyArray<{ title: string; url: string }>;
}

export const am2Explanations: Readonly<Record<string, Am2Explanation>> = {
  '2025r07h:1': {
    text: 'DFD（データフロー図）の基本要素は、データを変換する「プロセス」、情報の通り道を示す「データフロー」、蓄積先の「データストア」、外部との入出力を表す「源泉と吸収」の四つです。エはこのうち三つを正しく列挙しています。「実体」「関連」はE-R図の用語であり、DFDの要素と混同しないことがポイントです。'
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
