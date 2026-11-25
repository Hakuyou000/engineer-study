# CCNA テキスト 5.0 AI、ネットワーク運用と管理(10%)

対象: 200-301 CCNA v2.0

ネットワークの運用に AI をどう使うか、機器をどのような方法で管理するか、SNMP、Ansible、syslog を学びます。

> **【注意】** 5.1 と 5.2 は v2.0 で新しく加わった項目です。公式の教材がまだそろっていないため、この節は出題範囲の文言と一般的な定義をもとに書いています。Cisco の公式教材(Cisco U.、Official Cert Guide の v2.0 対応版)が出たら、照らし合わせてください。

## 5.1 ネットワーク運用におけるエージェント型 AI の役割

### 1. AI の分類

| 種類 | 内容 | ネットワーク運用での例 |
|---|---|---|
| 予測 AI(従来の機械学習) | 過去のデータからパターンを学び、分類や予測をする | 通信量の予測、いつもと違う動きの検知、障害の前ぶれの検知 |
| 生成 AI | 学んだパターンから、文章、コード、設定を作る。大規模言語モデル(LLM)が中心 | 設定例の作成、ログの要約、手順書の下書き |
| **エージェント型 AI**(Agentic AI) | 与えられた目標に向けて、自分で **計画を立て、ツールを使って行動し、結果を見て次の行動を決める** | 障害の調査から、原因の特定、直し方の案の作成と実行までを続けて進める |

### 2. 生成 AI とエージェント型 AI の違い

| | 生成 AI(チャット型) | エージェント型 AI |
|---|---|---|
| 動き方 | 質問に1回答える(受け身) | 目標に向けて、いくつもの手順を自分で進める |
| 外への働きかけ | 文章を返すだけ | ツールや API を呼び出して、情報を集めたり操作したりする |
| 人の関わり方 | 毎回、人が指示して結果を使う | 人は目標と制約を与え、大事な場面で承認する |
| 状態 | 基本的に、会話の中だけ | 作業の経過を覚えておき、結果を踏まえて計画を直す |

### 3. エージェントの構成要素

| 要素 | 役割 |
|---|---|
| モデル(LLM) | 考えて判断する |
| 計画 | 目標を手順に分ける |
| ツール | 外に働きかける手段。機器の CLI / API、監視システム、チケットシステム、ナレッジベース |
| メモリ・コンテキスト | 作業の経過、ネットワークの構成の情報、過去の対応の記録 |
| フィードバックループ | 観察 → 判断 → 行動 → 結果の確認を繰り返す |
| ガードレール | 許可する操作の範囲、承認が必要かどうか、監査のためのログ |

エージェントの動きの流れです。

```text
Goal       人が目標と制約を与える
  |
  v
[Plan]     目標を手順に分ける
  |
  v
[Act]      ツールを使う(機器の CLI や API、監視システムなど)
  |
  v
[Observe]  結果を見る
  |
  v
[Check]    目標に届いたか
  |
  +-- no  --> [Plan] へ戻る
  +-- yes --> 結果を報告して終わる
```

大事な操作の前には、ガードレールに従って人が承認します。

いくつものエージェントが役割を分けて協力する構成(マルチエージェント)もあります。

### 4. ネットワーク運用での役割

| 場面 | エージェントが行うこと |
|---|---|
| 監視・検知 | テレメトリ、ログ、アラートを続けて突き合わせ、おかしな点を見つける |
| トラブルシューティング | 関係する機器に show コマンドを実行し、出力を突き合わせて原因の候補を絞る |
| 根本原因分析(RCA) | いくつものアラートを1つの原因にまとめ、影響の範囲を示す |
| 修復(クローズドループ) | 直し方の案を作り、承認を得て(または決められた範囲の中で自動で)適用し、効果を確かめる |
| 変更管理 | 変更の前の影響の見積もり、設定の作成、変更の前後のチェック、問題が起きたときの切り戻し |
| チケット対応 | 起票、分類、情報の追加、決まった対応の自動処理 |
| 最適化 | 容量の計画、経路やポリシーの調整の提案 |
| セキュリティ | 脅威の発見、隔離の提案、ポリシー違反の発見 |

AI を IT の運用に使う考え方を **AIOps** といいます。

### 5. 利点とリスク

| 利点 | 内容 |
|---|---|
| 平均復旧時間(MTTR)が短くなる | 調査の初めの作業を自動にできる |
| 運用の負担が減る | 決まった作業の繰り返し(トイル)が減る |
| 一貫性 | 人による手順のばらつきが減る |
| 24時間の対応 | 人がいない時間帯の一次対応 |

| リスク | 対策 |
|---|---|
| ハルシネーション(もっともらしい誤り) | 実機の出力や正式な情報で裏付ける。人が確かめる |
| 誤った自律操作による障害 | **Human-in-the-loop**(大事な変更は人が承認する)。権限は少しずつ広げる |
| 権限が大きすぎる | **最小権限**。読み取りだけから始める。操作できる範囲を限る |
| 機密情報の漏えい | データの分類に従う。承認された AI の基盤を使う(→ 5.2) |
| 判断の理由が説明できない | 根拠を示させる。行動を **監査ログ** に残す |
| プロンプトインジェクション | ログや機器の出力に紛れ込んだ指示に従わない作りにする。入力を確かめる |

> **【要点】** エージェント型 AI は運用する人の代わりになるものではありません。人の監督の下で作業を進めるものです。責任は人に残ります。

> **【5.1 まとめ】**
>
> - 生成 AI は「答える」、エージェント型 AI は「計画し、ツールを使い、行動する」
> - 構成: モデル、計画、ツール、メモリ、フィードバックループ、ガードレール
> - 役割: 検知、トラブルシューティング、根本原因分析、クローズドループの修復、変更の確認
> - リスクへの対策: Human-in-the-loop、最小権限、監査ログ、出力の確認

## 5.2 ネットワーク運用を助ける生成 AI へのプロンプトを選ぶ

出題範囲: データの分類、出力の形式、ペルソナ、指示といったプロンプトの構成要素を考えて選ぶ。

問題は「いくつかのプロンプトの案から、目的に合う最も適切なものを選ぶ」形が考えられます。

### 1. プロンプトの構成要素

| 要素 | 内容 | 例 |
|---|---|---|
| **ペルソナ**(役割) | AI に担わせる立場や専門性 | 「あなたは Cisco IOS XE に詳しいネットワークエンジニアです」 |
| **指示**(タスク) | 何をしてほしいか。具体的な動詞で書く | 「次の出力から、OSPF のネイバーが確立しない原因を特定してください」 |
| コンテキスト | 背景、環境、制約 | 「機種は Catalyst 9300、IOS XE 17.9。シングルエリアの OSPF」 |
| 入力データ | 分析してほしいもの | show コマンドの出力、ログ(機密情報は取り除く) |
| **出力の形式** | 答えの形 | 「原因を1文で述べ、続けて修正のコマンドをコードブロックで示してください」「表で」「JSON で」 |
| 制約 | してはいけないこと、範囲 | 「推測と確認できた事実を分けてください」「再起動が必要な手順は除いてください」 |
| 例示 | 望む出力の見本(few-shot) | 入力と出力の例を1〜2組 |
| **データの分類** | 入力してよい情報の区分 | 下の表 |

### 2. データの分類

情報を、どれだけ秘密にすべきかで分けたものです。区分ごとに、どの AI に入力してよいかを決めます。

| 区分(例) | 内容 | 外部の公開された AI サービスへの入力 |
|---|---|---|
| 公開(Public) | すでに公開されている情報。製品のマニュアル、一般的な技術の知識 | よい |
| 社内(Internal) | 社内向けの一般的な情報 | 組織の方針による |
| 機密(Confidential) | 構成図、設定ファイル、IP アドレスの設計、顧客の情報 | **いけない**。承認された AI の基盤だけ |
| 極秘(Restricted) | パスワード、秘密鍵、SNMP のコミュニティ、事前共有鍵、個人情報 | **いけない** |

**入力する前に取り除く・置き換えるもの(サニタイズ)**

- パスワード、`enable secret` のハッシュ、`username … secret` の行
- SNMP のコミュニティ文字列、RADIUS / TACACS+ の共有鍵、IPsec の事前共有鍵、秘密鍵、証明書
- グローバル IP アドレス、ホスト名、拠点の名前、顧客の名前(必要なら `192.0.2.x`、`R1` などの仮の値に置き換える)
- 個人情報(ユーザー名、メールアドレス)

**原則**

- 組織の AI の利用方針に従います。承認されていない AI サービスに仕事のデータを入れません。
- 入力したデータが学習に使われたり、保存されたりするかもしれないことを考えます。
- 必要な分だけの情報を渡します。

### 3. 良いプロンプトの条件

| 条件 | 説明 |
|---|---|
| 具体的 | 機種、OS、プロトコル、症状をはっきり書く。「ネットワークが遅い。直して」ではいけない |
| 目的が1つ | 1つのプロンプトに、関係のない依頼をいくつも詰め込まない |
| 出力の形式を決める | そのまま使える形で答えさせる |
| 根拠を求める | 判断の理由や、もとになった出力の行を示させる |
| 制約をはっきり書く | 本番への影響、してはいけないこと |
| データの分類に合っている | 機密情報を含まない |

### 4. 比べてみる

目的: OSPF のネイバーが確立しない原因を調べたい。

| 案 | プロンプト | 評価 |
|---|---|---|
| A | 「OSPF が動かない。なぜ?」 | 不適切。情報がないので、一般論しか返ってこない |
| B | (running-config の全文を、パスワードや共有鍵を含めたまま貼り付けて)「どこが悪い?」 | 不適切。データの分類に違反している。関係のない情報が多い |
| C | 「あなたはネットワークエンジニアです。R1 と R2 はシングルエリアの OSPFv2 で、ギガビットイーサネットで直接つながっています。ネイバーが EXSTART で止まります。以下は両方のルーターの `show ip ospf interface g0/1` の出力です(アドレスは仮の値に置き換えてあります)。原因の候補を可能性の高い順に3つ挙げ、それぞれを確かめる show コマンドを表で示してください。設定の変更は提案にとどめ、理由を付けてください」 | 適切。ペルソナ、コンテキスト、指示、入力データ、出力の形式、制約がそろっていて、機密情報を含まない |
| D | 「OSPF のすべてを説明して」 | 不適切。目的に合わない。範囲が広すぎる |

### 5. 出力の扱い方

- 生成 AI の出力は **提案** です。そのまま本番の機器に入れてはいけません。
- コマンドの書き方は、機種や OS のバージョンによって違います。公式のドキュメントや検証の環境で確かめます。
- 存在しないコマンドやオプションを作ってしまうことがあります(ハルシネーション)。
- 期待と違う結果なら、条件を足してやり直します(繰り返して良くしていく)。
- 変更は、いつもの変更管理(レビュー、検証、切り戻しの計画)に従います。

> **【5.2 まとめ】**
>
> - 構成要素: ペルソナ、指示、コンテキスト、入力データ、出力の形式、制約、例示
> - 先にデータの分類を確かめる。パスワード、鍵、コミュニティ文字列、顧客の情報は入力しない。仮の値に置き換える
> - 具体的で、目的が1つで、出力の形式と制約を決めたプロンプトを選ぶ
> - 出力は確かめてから使う

## 5.3 ネットワークの管理の方法

出題範囲: デバイスベース、クラウドベース、コントローラーベース、自動化ベース、Infrastructure as Code。

### 1. 3つのプレーン

| プレーン | 役割 | 例 |
|---|---|---|
| データプレーン(転送プレーン) | パケットを転送する | MAC アドレステーブルやルーティングテーブルを見る、カプセル化、ACL の適用、NAT |
| コントロールプレーン | 転送に必要な情報を作る | OSPF、STP、ARP、MAC アドレスの学習 |
| マネジメントプレーン | 機器を管理する | SSH、SNMP、syslog、NETCONF |

昔ながらのネットワークでは、3つのプレーンがすべて、それぞれの機器の中にあります。

### 2. デバイスベース(昔ながらの方法)

- 機器に1台ずつ SSH やコンソールでログインし、CLI(または機器の GUI)で設定します。
- コントロールプレーンは、それぞれの機器に分かれています。
- 長所: ほかの仕組みがいらない。細かく制御できる。小さなネットワークなら単純。
- 短所: 台数が増えると時間がかかる。手作業のミス、機器ごとの設定のずれ(コンフィグドリフト)。全体の状態が見えにくい。

### 3. コントローラーベース

コントローラーが、たくさんの機器をまとめて管理します。SDN(Software-Defined Networking)の考え方では、コントロールプレーンの働き(の一部)をコントローラーに集めます。

```text
[アプリケーション / スクリプト]
   |
   |  ノースバウンド API(REST)
   |
[コントローラー]
   |
   |  サウスバウンド API(NETCONF、RESTCONF、SNMP、SSH/CLI、OpenFlow)
   |
[スイッチ] [ルーター] [AP] …
```

| インターフェース | 向き | 用途 | 例 |
|---|---|---|---|
| **ノースバウンド**(NBI) | コントローラー ↔ アプリケーション | 意図やポリシーを伝える、情報を取り出す | REST API |
| **サウスバウンド**(SBI) | コントローラー ↔ ネットワーク機器 | 機器を設定・監視する | NETCONF、RESTCONF、SNMP、SSH / Telnet、OpenFlow、OpFlex |

| Cisco の製品 | 対象 |
|---|---|
| Catalyst Center(旧 DNA Center) | キャンパス LAN(SD-Access) |
| Catalyst SD-WAN Manager(旧 vManage) | WAN(SD-WAN) |
| APIC | データセンター(ACI) |
| WLC | 無線の AP |

**SD-Access の用語**

| 用語 | 意味 |
|---|---|
| アンダーレイ | 物理的な機器と、その間の IP での到達性(ルーティング) |
| オーバーレイ | アンダーレイの上に作る仮想的なネットワーク(VXLAN のトンネル) |
| ファブリック | アンダーレイとオーバーレイを合わせた全体 |

**インテントベースネットワーキング(IBN)**: 管理する人は「何をしたいか(意図)」を決めます。コントローラーがそれをそれぞれの機器の設定に変えて適用し、意図どおりに動いているかを確かめ続けます。

- 長所: まとめて見える・まとめて設定できる、ポリシーがそろう、ほぼ自動で機器を設置できる、テレメトリによる分析(アシュアランス)、API で他の仕組みとつなげられる。
- 短所: コントローラーを入れて動かす費用。コントローラーの冗長化が必要。使える機種が限られる。

### 4. クラウドベース

管理の働き(コントローラー)を、メーカーのクラウドが提供します。機器はインターネットを通してクラウドにつながり、管理する人はブラウザのダッシュボードで操作します。例: Cisco Meraki。

- マネジメントプレーンがクラウドにあります。**利用者のデータの通信はクラウドを通りません**(通るのは管理の通信だけ)。
- 機器は、電源とインターネットへの接続があれば、クラウドから設定を受け取って動きます(ゼロタッチプロビジョニング)。
- 長所: 自分でコントローラーを持たなくてよい。拠点が多くてもまとめて管理できる。ソフトウェアの更新が自動。早く導入できる。
- 短所: インターネットへの接続に頼る(切れても転送は続くが、設定の変更や監視ができない)。ライセンスの費用がずっとかかる。細かい設定の自由さは CLI より低い。データを保管する場所を考える必要がある。

| | 自社内のコントローラー | クラウドによる管理 |
|---|---|---|
| コントローラーの場所 | 自社の中 | メーカーのクラウド |
| 保守 | 自社 | メーカー |
| 費用 | 最初の投資が中心 | サブスクリプション |
| インターネットが切れたときの影響 | 小さい | 管理ができなくなる |

### 5. 自動化ベース

スクリプトや自動化のツールで、設定や確認の作業を機械的に行います。

| 手段 | 例 |
|---|---|
| スクリプト | Python(Netmiko、NAPALM、ncclient)、シェル |
| 構成管理のツール | **Ansible**(→ 5.5)、Puppet、Chef |
| API | REST API、NETCONF、RESTCONF |
| データの形式 | JSON、XML、YAML。YANG はデータモデル |

- 長所: 速い。ミスが減る。同じ手順を何度でも同じように行える。たくさんの機器にまとめて適用できる。
- 大事な性質: **冪等性**(同じ操作を何度行っても結果が同じ。すでに望む状態なら何も変えない)。
- 注意: 間違った自動化は、間違いをすべての機器に一度に広げます。検証の環境とレビューが必要です。

### 6. Infrastructure as Code(IaC)

ネットワークやサーバーの構成を **コード(テキストのファイル)として書き**、ソフトウェアの開発と同じ方法で管理します。

| 要素 | 内容 |
|---|---|
| コードで書く | あるべき構成を、YAML や HCL などのファイルに書く |
| **バージョン管理** | Git で履歴を残す。誰が、いつ、何を変えたかが分かる。前の状態に戻せる |
| レビュー | 変更をプルリクエストで確かめてから反映する |
| 自動のテスト・自動の適用 | CI/CD のパイプラインで確かめて、適用する |
| **信頼できる唯一の情報源**(Single Source of Truth) | 機器の実際の設定ではなく、リポジトリのコードを正しいものとする |
| ドリフトの検出 | コードと実機の差(手作業による変更)を見つけて直す |

| | 宣言的(declarative) | 手続き的(imperative) |
|---|---|---|
| 書くこと | **最後にあるべき状態** | 実行する手順 |
| ツールの例 | Terraform、Ansible(多くのモジュール) | シェルスクリプト、CLI のコマンドの並び |
| 今の状態との差 | ツールが計算して、必要な変更だけを行う | 書いた手順をそのまま実行する |

| ツール | 特徴 |
|---|---|
| Ansible | エージェントレス、プッシュ型、YAML。構成管理 |
| Terraform | 宣言的、状態ファイル(state)を持つ、HCL。環境の用意(プロビジョニング) |
| Puppet / Chef | エージェント型、プル型 |

- 長所: 同じ環境を作り直せる、変更の履歴、レビュー、すぐに切り戻せる、環境を複製できる、文書とコードが一致する。
- 「自動化ベース」との違い: 自動化は、作業を機械にやらせることです。IaC は、構成そのものをコードとして管理する運用のやり方です。IaC は自動化を前提にしています。

### 7. 比較

| | デバイスベース | コントローラーベース | クラウドベース | 自動化ベース | IaC |
|---|---|---|---|---|---|
| 操作する相手 | 機器1台ずつ | コントローラー | クラウドのダッシュボード | スクリプト・ツール | リポジトリのコード |
| 手段 | CLI、機器の GUI | GUI、REST API | Web の GUI、API | Python、Ansible | Git、CI/CD、Ansible、Terraform |
| 大きな規模への対応 | 低い | 高い | 高い | 高い | 高い |
| 一貫性 | 作業する人次第 | ポリシーでそろう | テンプレートでそろう | スクリプトでそろう | コードでそろい、履歴もある |
| 主な弱点 | 手間、ミス、ドリフト | コントローラーの費用と冗長化 | インターネットに頼る、費用がずっとかかる | スクリプトの品質次第 | 覚えることと仕組み作りの負担 |

> **【5.3 まとめ】**
>
> - データプレーンは転送、コントロールプレーンは経路を決める、マネジメントプレーンは管理
> - デバイスベースは機器ごとに CLI で設定する。ドリフトとミスが弱点
> - コントローラーベース: ノースバウンド(REST)はアプリケーション側、サウスバウンド(NETCONF、RESTCONF、SNMP、SSH)は機器側
> - アンダーレイは物理と IP の到達性、オーバーレイは仮想的なネットワーク、合わせてファブリック
> - クラウドベースは管理がクラウドにある。データの通信はクラウドを通らない
> - 自動化の要は冪等性
> - IaC: コードで書く、Git でバージョン管理する、コードが唯一の正しい情報、宣言的

## 5.4 ネットワーク運用における SNMP の働き

### 1. 構成要素

| 要素 | 内容 |
|---|---|
| SNMP マネージャー(NMS) | 監視のサーバー。情報を集め、表示したり知らせたりする |
| SNMP エージェント | 監視される機器(ルーター、スイッチ)で動くソフトウェア |
| **MIB** | 機器が持つ管理の情報の定義(データベース)。木の形をしている |
| **OID** | MIB の中の1つ1つの項目を指す番号。例: `1.3.6.1.2.1.1.5`(sysName) |

用途: インターフェースの状態・通信量・エラーの数、CPU やメモリの使用率、温度などの監視。障害の通知。設定の変更(Set)。

### 2. メッセージ

| メッセージ | 向き | 内容 |
|---|---|---|
| Get | マネージャー → エージェント | 指定した OID の値を求める |
| GetNext | マネージャー → エージェント | 次の OID の値を求める(MIB を順にたどる) |
| GetBulk | マネージャー → エージェント | まとめて求める。**v2c から** |
| Set | マネージャー → エージェント | 値を **変える** |
| Response | エージェント → マネージャー | 求めに対する応答 |
| **Trap** | エージェント → マネージャー | 出来事が起きたことを自分から知らせる。**確認の応答はない** |
| **Inform** | エージェント → マネージャー | 知らせる。**確認の応答がある**(届かなければ送り直す)。v2c から |

| | ポート |
|---|---|
| エージェント(Get / Set を受け取る) | **UDP 161** |
| マネージャー(Trap / Inform を受け取る) | **UDP 162** |

ポーリングと通知のやり取りです。

```text
   NMS                          Agent
    |                             |
    |- Get ---------------------->|   UDP 161 あて
    |<- Response -----------------|   値を返す
    |                             |
    |<- Trap ---------------------|   UDP 162 あて。確認の応答はない
    |<- Inform -------------------|   UDP 162 あて
    |- Response ----------------->|   Inform への確認
```

| 方式 | 内容 | 特徴 |
|---|---|---|
| ポーリング | マネージャーが決まった間隔で Get する | 変化の傾向がつかめる。間隔の間に起きたことは、次の問い合わせまで分からない |
| 通知(Trap / Inform) | 出来事が起きたときにエージェントが送る | すぐに分かる。Trap は UDP で確認がないので、失われることがある |

### 3. バージョン

| バージョン | 認証 | 暗号化 | 備考 |
|---|---|---|---|
| v1 | コミュニティ文字列(平文) | なし | 古い |
| v2c | コミュニティ文字列(平文) | なし | GetBulk と Inform が加わった。64 ビットのカウンタ |
| **v3** | ユーザー名 + ハッシュ(MD5 / SHA) | あり(DES / AES) | 推奨 |

**SNMPv3 のセキュリティレベル**

| レベル | キーワード | 認証 | 暗号化 |
|---|---|---|---|
| noAuthNoPriv | `noauth` | ユーザー名だけ | なし |
| authNoPriv | `auth` | あり | なし |
| authPriv | `priv` | あり | あり |

**コミュニティ文字列**(v1 / v2c): パスワードにあたるものです。

| 種類 | 権限 |
|---|---|
| RO(Read-Only) | 読み取りだけ(Get) |
| RW(Read-Write) | 読み書き(Get、Set) |

既定の値として知られている `public`(RO)、`private`(RW)は使いません。

### 4. 設定の例

```
! v2c
snmp-server community MonR3ad RO 10            ! ACL 10 のマネージャーだけを許可する
snmp-server location Tokyo-DC1
snmp-server contact noc@example.com
snmp-server host 10.1.1.100 version 2c MonR3ad ! Trap の送り先
snmp-server enable traps                       ! Trap を有効にする
!
! v3(authPriv)
snmp-server group NMS-GRP v3 priv
snmp-server user nmsuser NMS-GRP v3 auth sha AuthPass123 priv aes 128 PrivPass123
snmp-server host 10.1.1.100 version 3 priv nmsuser
```

```
show snmp
show snmp community
show snmp user
show snmp group
show snmp host
```

> **【5.4 まとめ】**
>
> - マネージャー(NMS)、エージェント、MIB、OID
> - Get / GetNext / GetBulk / Set はマネージャーから。Trap / Inform はエージェントから
> - Trap は確認の応答なし、Inform は確認の応答あり
> - UDP 161(エージェント)、UDP 162(Trap を受け取る側)
> - v1 / v2c はコミュニティ文字列(平文)。v3 は認証と暗号化がある
> - v3: noAuthNoPriv、authNoPriv、authPriv
> - RO は読み取りだけ、RW は Set もできる

## 5.5 Ansible などの構成管理の仕組みを使ってコマンドを実行する

### 1. Ansible の特徴

| 特徴 | 内容 |
|---|---|
| **エージェントレス** | 管理する相手に専用のソフトウェアを入れない。ネットワーク機器には SSH(または NETCONF、API)でつなぐ |
| **プッシュ型** | コントロールノードから相手へ設定を送る |
| YAML | プレイブックを YAML で書く |
| 冪等性 | すでに望む状態なら変えない(`changed` にならない) |
| 作り | Python で作られている。オープンソース(Red Hat) |

| | Ansible | Puppet | Chef |
|---|---|---|---|
| エージェント | **いらない** | 必要(エージェントレスもできる) | 必要 |
| 方式 | **プッシュ** | プル | プル |
| 書き方 | YAML(プレイブック) | 独自の言語(マニフェスト) | Ruby(レシピ、クックブック) |
| 通信 | SSH、NETCONF | HTTPS(TCP 8140) | HTTPS(TCP 10002) |

### 2. 構成要素

| 用語 | 内容 |
|---|---|
| コントロールノード | Ansible を実行するホスト(Linux など) |
| 管理対象ノード(マネージドノード) | 設定される機器 |
| **インベントリ** | 管理する相手の一覧。ホスト、グループ、変数。INI 形式か YAML で書く |
| **プレイブック** | 実行する内容を書いた YAML のファイル。1つ以上のプレイを含む |
| プレイ | 「どのホストに」「どのタスクを」実行するかの組 |
| タスク | 1つの処理。モジュールを1つ呼ぶ |
| **モジュール** | 実際の処理をする部品。`cisco.ios.ios_command`、`cisco.ios.ios_config` など |
| コレクション | モジュールなどを配るときのまとまり。`cisco.ios`、`cisco.nxos` |
| 変数 | 値を差し替える。`group_vars/`、`host_vars/`、プレイブックの中の `vars` |
| テンプレート | Jinja2(`.j2`)。変数を埋め込んで設定を作る |
| ロール | タスク、変数、テンプレートをまとめて、使い回せるようにしたもの |
| Ansible Vault | パスワードなどの秘密の情報を暗号化して保存する |
| ファクト | 相手から集めた情報(`ios_facts`) |

Ansible は、コントロールノードから、管理対象の機器に SSH でつなぎます。

### 3. YAML の基本

```yaml
---                          # 文書の始まり
hostname: R1                 # キー: 値(コロンの後に空白)
interfaces:                  # リスト
  - name: GigabitEthernet0/0
    ip: 10.1.1.1
  - name: GigabitEthernet0/1
    ip: 10.1.12.1
enabled: true                # 真偽値
# コメント
```

- 階層は **インデント(空白)** で表します。**タブは使えません**。
- リストの要素は `- `(ハイフンと空白)で始めます。
- 文字列の引用符は、普通は省略できます。

### 4. インベントリ

```ini
# inventory.ini
[routers]
R1 ansible_host=10.1.1.1
R2 ansible_host=10.1.1.2

[switches]
SW1 ansible_host=10.1.1.11

[network:children]
routers
switches

[network:vars]
ansible_connection=ansible.netcommon.network_cli
ansible_network_os=cisco.ios.ios
ansible_user=admin
ansible_become=yes
ansible_become_method=enable
```

| 変数 | 意味 |
|---|---|
| `ansible_host` | つなぐ先のアドレス |
| `ansible_connection` | つなぎ方。ネットワーク機器の CLI なら `ansible.netcommon.network_cli`(SSH) |
| `ansible_network_os` | 相手の OS。`cisco.ios.ios` |
| `ansible_user` | ログインするユーザー |
| `ansible_become` / `ansible_become_method` | 特権モードに上がる(`enable`) |

パスワードは平文で書かず、Ansible Vault や、実行するときの入力(`--ask-pass`、`-k`)を使います。

### 5. プレイブック

**show コマンドを実行する**

```yaml
---
- name: Collect interface status
  hosts: routers
  gather_facts: false

  tasks:
    - name: Run show commands
      cisco.ios.ios_command:
        commands:
          - show ip interface brief
          - show version
      register: result

    - name: Display output
      ansible.builtin.debug:
        var: result.stdout_lines
```

この show.yml を実行したときの、つなぎ方です。

```text
[Control node]  inventory.ini とプレイブックを読む
      |
      +-- SSH --> [R1]
      +-- SSH --> [R2]
      +-- [SW1]     <- show.yml は hosts: routers なので、SW1 にはつながない(SSH の矢印なし)
```

機器には何も入れません(エージェントレス)。

**設定のコマンドを実行する**

```yaml
---
- name: Configure syslog and loopback
  hosts: routers
  gather_facts: false

  tasks:
    - name: Set logging host
      cisco.ios.ios_config:
        lines:
          - logging host 10.1.1.100
          - logging trap informational

    - name: Configure Loopback0
      cisco.ios.ios_config:
        parents: interface Loopback0
        lines:
          - description Managed-by-Ansible
          - ip address 1.1.1.1 255.255.255.255
        save_when: modified
```

| キー | 意味 |
|---|---|
| `name` | プレイやタスクの説明。実行すると表示される |
| `hosts` | 相手。インベントリのホスト名、グループ名、`all` |
| `gather_facts` | ファクトを集めるかどうか。ネットワーク機器では普通 `false` |
| `tasks` | タスクのリスト。上から順に実行する |
| `register` | タスクの結果を変数に入れる |
| `vars` | 変数を決める。`{{ 変数名 }}` で使う |
| `when` | 条件が合うときだけ実行する |
| `loop` | 繰り返す |

上の show コマンドのプレイブックを、構成要素に分けて描きます。

```text
playbook (show.yml)
`-- play: hosts: routers
    |-- task: Run show commands   -> module: cisco.ios.ios_command
    `-- task: Display output      -> module: ansible.builtin.debug
```

| モジュール | 用途 | 冪等性 |
|---|---|---|
| `cisco.ios.ios_command` | EXEC のコマンド(show など)を実行して出力を受け取る | 設定を変えない。いつも `ok` |
| `cisco.ios.ios_config` | 設定のコマンドを入れる。running-config と比べて、違う部分だけを適用する | あり |
| `cisco.ios.ios_facts` | 機器の情報を集める | — |
| `cisco.ios.ios_interfaces`、`ios_vlans`、`ios_l3_interfaces` など | 機能ごとのリソースモジュール。状態を宣言的に指定する(`state: merged` など) | あり |
| `ansible.builtin.debug` | 変数やメッセージを表示する | — |

### 6. 実行

```bash
ansible-playbook -i inventory.ini show.yml            # 実行する
ansible-playbook -i inventory.ini config.yml --check  # ドライラン。実際には変えない
ansible-playbook -i inventory.ini config.yml --diff   # 差を表示する
ansible-playbook -i inventory.ini config.yml --limit R1   # 相手を絞る
ansible-playbook -i inventory.ini config.yml -k       # SSH のパスワードを尋ねる
ansible-playbook config.yml --syntax-check            # 書き方のチェック
ansible-inventory -i inventory.ini --list             # インベントリの確認
ansible-doc cisco.ios.ios_config                      # モジュールの説明
ansible routers -i inventory.ini -m cisco.ios.ios_command -a "commands='show clock'"   # その場で1回だけ実行する(アドホック)
```

**実行結果の読み方**

```
PLAY RECAP *********************************************************
R1    : ok=2    changed=1    unreachable=0    failed=0    skipped=0
R2    : ok=2    changed=0    unreachable=0    failed=0    skipped=0
```

| 項目 | 意味 |
|---|---|
| `ok` | うまくいったタスクの数(変更がなかったものも含む) |
| `changed` | 変更が起きたタスクの数 |
| `unreachable` | つなげなかった(SSH できない、認証の失敗、届かない) |
| `failed` | タスクが失敗した |
| `skipped` | 条件に合わず、実行されなかった |

R2 は `changed=0` です。すでに望む状態だったので、変更されませんでした(冪等性)。

> **【5.5 まとめ】**
>
> - Ansible はエージェントレス、プッシュ型、YAML、SSH
> - インベントリは相手の一覧、プレイブックは実行する内容、モジュールは処理の部品
> - YAML はインデント(空白)で階層を表し、`- ` でリストを書く。タブは使えない
> - `ios_command` は show などの実行、`ios_config` は設定を入れる
> - `ansible-playbook -i <インベントリ> <プレイブック>`。`--check` はドライラン
> - 冪等性: 同じプレイブックをもう一度実行しても `changed=0`
> - Puppet と Chef はエージェント型・プル型

## 5.6 syslog のメッセージの内容、重大度、ファシリティを読み取る

### 1. メッセージの形

```
*Nov 17 14:06:21.345: %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down
 ①                     ②    ③ ④       ⑤
```

```
seq no: timestamp: %FACILITY-SEVERITY-MNEMONIC: description
```

| 番号 | 要素 | 例 | 内容 |
|---|---|---|---|
| — | シーケンス番号 | `000123:` | `service sequence-numbers` で付く |
| ① | タイムスタンプ | `*Nov 17 14:06:21.345` | `service timestamps log datetime msec` |
| ② | **ファシリティ** | `LINK` | メッセージを出した機能、プロトコル、ハードウェア |
| ③ | **重大度** | `3` | 0〜7 |
| ④ | ニーモニック | `UPDOWN` | 出来事を表す短い名前 |
| ⑤ | 説明 | `Interface …` | 詳しい内容 |

タイムスタンプの先頭の `*` は、時刻が正確でない(NTP で合わせていない)ことを表します。障害を調べるときは、いくつもの機器のログを時刻で突き合わせるので、時刻を合わせておくことが前提になります。

### 2. 重大度

| レベル | キーワード | 意味 | 例 |
|---|---|---|---|
| **0** | emergencies | システムが使えない | |
| **1** | alerts | すぐに対処が必要 | |
| **2** | critical | 危険な状態 | `%PORT_SECURITY-2-PSECURE_VIOLATION`、`%SPANTREE-2-BLOCK_BPDUGUARD` |
| **3** | errors | エラー | `%LINK-3-UPDOWN` |
| **4** | warnings | 警告 | `%CDP-4-NATIVE_VLAN_MISMATCH`、`%PM-4-ERR_DISABLE` |
| **5** | notifications | 正常だが大事な出来事 | `%LINEPROTO-5-UPDOWN`、`%SYS-5-CONFIG_I`、`%OSPF-5-ADJCHG` |
| **6** | informational | 情報 | `%SEC-6-IPACCESSLOGP`(ACL の log) |
| **7** | debugging | デバッグ | `debug` コマンドの出力 |

**数値が小さいほど重大です**。

> **【覚え方】** Every Awesome Cisco Engineer Will Need Ice cream Daily(Emergency、Alert、Critical、Error、Warning、Notification、Informational、Debugging)。

**レベルを指定したときの意味**: あるレベルを指定すると、**そのレベルと、それより重大な(数値の小さい)メッセージ** が対象になります。

| 指定 | 出力されるレベル |
|---|---|
| `logging trap 4`(warnings) | 0〜4 |
| `logging trap informational` | 0〜6 |
| `logging console 7`(debugging) | 0〜7(すべて) |

レベルの並びと、指定したときの対象の範囲です。

```text
0 emergencies
1 alerts
2 critical
3 errors
4 warnings         <- logging trap 4 はここまで
5 notifications
6 informational    <- logging trap informational はここまで
7 debugging
```

数値が小さいほど重大です。指定したレベルより下(数値が大きい)のメッセージは出力されません。

### 3. ファシリティ

「ファシリティ」という言葉には、2つの意味があります。

| 意味 | 内容 | 例 |
|---|---|---|
| IOS のメッセージの中のファシリティ | メッセージを出したところ | `LINK`、`LINEPROTO`、`SYS`、`OSPF`、`SEC`、`CDP`、`SPANTREE`、`PM`、`DHCP_SNOOPING`、`SW_DAI`、`STORM_CONTROL` |
| syslog のプロトコルのファシリティ | syslog サーバーが振り分けに使う分類の番号(0〜23) | kern(0)、user(1)、mail(2)、daemon(3)、auth(4)、syslog(5)、local0〜local7(16〜23) |

- Cisco の機器が syslog サーバーに送るときの既定は **local7** です。`logging facility local5` で変えられます。
- サーバー側は、ファシリティと重大度の組み合わせで、保存するファイルを分けます。
- syslog のパケットの優先度(PRI)= ファシリティ × 8 + 重大度 です。local7(23)で重大度 5 なら 189 になります。

### 4. ログの出力先

| 出力先 | 既定 | 既定のレベル | 設定 |
|---|---|---|---|
| コンソール | 有効 | debugging(7) | `logging console <レベル>` |
| モニター(VTY: SSH / Telnet) | 送る設定は有効だが、**そのセッションで `terminal monitor` を実行しないと表示されない** | debugging(7) | `logging monitor <レベル>`、`terminal monitor` |
| バッファ(RAM) | 機種による | debugging(7) | `logging buffered [サイズ] [レベル]` |
| syslog サーバー | 無効 | **informational(6)** | `logging host <IP>`、`logging trap <レベル>` |

```
service timestamps log datetime msec localtime show-timezone
service timestamps debug datetime msec
service sequence-numbers
!
logging buffered 64000 informational
logging console warnings
logging host 10.1.1.100
logging trap notifications
logging facility local5
logging source-interface Loopback0
!
line console 0
 logging synchronous            ! 入力中のコマンドがログで途切れないようにする
```

- syslog サーバーへは **UDP 514** で送ります。
- バッファは RAM にあるので、再起動すると消えます。いっぱいになると、古いものから上書きされます。
- SSH で接続している間にログを見るには `terminal monitor`、止めるには `terminal no monitor` を使います。

```
R1# show logging
Syslog logging: enabled (0 messages dropped, 0 flushes, 0 overruns)
    Console logging: level warnings, 12 messages logged
    Monitor logging: level debugging, 0 messages logged
    Buffer logging:  level informational, 87 messages logged
    Trap logging: level notifications, 45 message lines logged
        Logging to 10.1.1.100  (udp port 514, audit disabled, link up)

Log Buffer (64000 bytes):

Nov 17 14:06:21.345: %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down
Nov 17 14:06:22.345: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to down
Nov 17 14:06:22.401: %OSPF-5-ADJCHG: Process 1, Nbr 2.2.2.2 on GigabitEthernet0/1 from FULL to DOWN, Neighbor Down: Interface down or detached
```

`show logging` の前半でそれぞれの出力先のレベルが、後半でバッファの中身が分かります。

### 5. よく見るメッセージの読み方

| メッセージ | 読み取ること |
|---|---|
| `%LINK-3-UPDOWN: Interface Gi0/1, changed state to down` | 物理層がダウンした。重大度 3(エラー) |
| `%LINEPROTO-5-UPDOWN: Line protocol on Interface Gi0/1, changed state to down` | ラインプロトコル(L2)がダウンした。重大度 5 |
| `%LINK-5-CHANGED: Interface Gi0/1, changed state to administratively down` | `shutdown` が実行された |
| `%SYS-5-CONFIG_I: Configured from console by admin on vty0 (10.1.1.50)` | 設定モードを抜けた。誰が、どこから変えたか |
| `%SYS-5-RESTART: System restarted` | 再起動した |
| `%OSPF-5-ADJCHG: Process 1, Nbr 2.2.2.2 on Gi0/1 from FULL to DOWN, Neighbor Down: Dead timer expired` | OSPF のネイバーが切れた。理由は Dead タイマーの時間切れ(Hello が届かない) |
| `%OSPF-4-ERRRCV: Received invalid packet: mismatched area ID` | エリア ID が一致しない |
| `%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on Gi0/24 (1), with SW2 Gi0/24 (99)` | ネイティブ VLAN が、自分は 1、相手は 99 |
| `%CDP-4-DUPLEX_MISMATCH: duplex mismatch discovered on Gi0/1 (not full duplex), with R1 Gi0/0 (full duplex)` | デュプレックスが一致しない |
| `%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi0/5 with BPDU Guard enabled. Disabling port.` | BPDU ガードが働いた |
| `%PM-4-ERR_DISABLE: bpduguard error detected on Gi0/5, putting Gi0/5 in err-disable state` | err-disabled になった原因 |
| `%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address … on port Gi0/5` | ポートセキュリティの違反と、原因の MAC アドレス |
| `%SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Req) on Gi0/3, vlan 10` | DAI が ARP を捨てた |
| `%DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: … drop message on untrusted port, message type: DHCPOFFER` | 信頼しないポートで、DHCP サーバーのメッセージを捨てた |
| `%STORM_CONTROL-3-FILTERED: A Broadcast storm detected on Gi0/6` | ストーム制御が働いた |
| `%SEC-6-IPACCESSLOGP: list 110 denied tcp 192.168.1.10(51000) -> 10.1.1.80(23), 1 packet` | ACL 110 が Telnet を拒否した |
| `%SEC_LOGIN-5-LOGIN_SUCCESS` / `%SEC_LOGIN-4-LOGIN_FAILED` | ログインの成功 / 失敗 |
| `%IP-4-DUPADDR: Duplicate address 10.1.1.1 on Gi0/0, sourced by 0c1a.2b3c.4d99` | IP アドレスの重複と、相手の MAC アドレス |
| `%SW_MATM-4-MACFLAP_NOTIF: Host 0c1a.2b3c.4d01 in vlan 10 is flapping between port Gi0/1 and port Gi0/2` | MAC フラッピング。ループが疑われる |
| `%HSRP-5-STATECHANGE: GigabitEthernet0/0 Grp 1 state Standby -> Active` | HSRP が切り替わった |

**読み取りの手順**

1. タイムスタンプで、出来事を起きた順に並べます。
2. ファシリティで、どの機能のメッセージかを知ります。
3. 重大度で、どれから対応するかを決めます。
4. ニーモニックと説明から、対象(インターフェース、ネイバー、MAC アドレス)と、状態がどう変わったかを読みます。
5. 先に起きた出来事が原因、後に起きた出来事が結果であることが多いです(リンクのダウン → ラインプロトコルのダウン → OSPF のネイバーのダウン)。

### 6. debug

- `debug` の出力は重大度 7 です。機器への負担が大きいので、本番の環境では対象を絞り、短い時間だけ使います。
- 止めるには `undebug all`(`no debug all`、`u all`)を使います。
- 出力先のレベルが 7 より小さいと、表示されません。

> **【5.6 まとめ】**
>
> - 形: `%ファシリティ-重大度-ニーモニック: 説明`
> - 重大度は 0 emergencies 〜 7 debugging。小さいほど重大
> - レベルを指定すると、それ以下の数値のメッセージがすべて対象になる
> - syslog サーバーへは UDP 514。既定のレベルは informational(6)、既定のファシリティは local7
> - コンソールは既定ですべてのレベルを表示する。VTY では `terminal monitor` が必要
> - `show logging` で、それぞれの出力先のレベルとバッファの中身が分かる
> - 時刻を合わせていないと、タイムスタンプに `*` が付く
