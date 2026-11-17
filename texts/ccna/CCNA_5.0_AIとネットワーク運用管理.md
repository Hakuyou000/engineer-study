# CCNA テキスト 5.0 AI、ネットワーク運用と管理(10%)

対象: 200-301 CCNA v2.0

> **【注意】** 5.1 と 5.2 は v2.0 で新設された項目。公式教材が出そろっていないため、この節は出題範囲の文言と一般的な定義に基づく。Cisco の公式教材(Cisco U.、Official Cert Guide の v2.0 対応版)が出たら照合すること。

## 5.1 ネットワーク運用におけるエージェント型 AI の役割

### 1. AI の分類

| 種類 | 内容 | ネットワーク運用での例 |
|---|---|---|
| 予測 AI(従来の機械学習) | 過去のデータからパターンを学び、分類・予測する | トラフィック量の予測、異常検知、障害の予兆検知 |
| 生成 AI | 学習したパターンから文章・コード・設定を生成する。大規模言語モデル(LLM)が中心 | 設定例の作成、ログの要約、手順書の下書き |
| **エージェント型 AI**(Agentic AI) | 与えられた目標に向けて、自ら**計画を立て、ツールを使って行動し、結果を見て次の行動を決める** | 障害の調査から原因特定、修正案の作成・実行までを連続して進める |

### 2. 生成 AI とエージェント型 AI の違い

| | 生成 AI(チャット型) | エージェント型 AI |
|---|---|---|
| 動き方 | 質問に1回答える(受動的) | 目標に向けて複数の手順を自律的に進める |
| 外部への作用 | 文章を返すだけ | ツール・API を呼び出して情報を取得し、操作する |
| 人の関与 | 毎回、人が指示して結果を使う | 人は目標と制約を与え、要所で承認する |
| 状態 | 基本的に会話の中だけ | 作業の経過を保持し、結果を踏まえて計画を修正する |

### 3. エージェントの構成要素

| 要素 | 役割 |
|---|---|
| モデル(LLM) | 推論と判断 |
| 計画 | 目標を手順に分解する |
| ツール | 外部への手段。機器の CLI / API、監視システム、チケットシステム、ナレッジベース |
| メモリ・コンテキスト | 経過、ネットワークの構成情報、過去の対応記録 |
| フィードバックループ | 観察 → 判断 → 行動 → 結果の確認を繰り返す |
| ガードレール | 許可する操作の範囲、承認の要否、監査ログ |

複数のエージェントが役割を分担して連携する構成(マルチエージェント)もある。

### 4. ネットワーク運用での役割

| 場面 | エージェントが行うこと |
|---|---|
| 監視・検知 | テレメトリ、ログ、アラートを継続的に相関分析し、異常を検出する |
| トラブルシューティング | 関連機器に show コマンドを発行し、出力を突き合わせて原因の候補を絞る |
| 根本原因分析(RCA) | 複数のアラートを1つの原因にまとめ、影響範囲を示す |
| 修復(クローズドループ) | 修正案を作り、承認を得て(または方針の範囲内で自動的に)適用し、効果を検証する |
| 変更管理 | 変更前の影響評価、設定の生成、事前・事後チェック、問題時のロールバック |
| チケット対応 | 起票、分類、情報の追記、定型対応の自動処理 |
| 最適化 | 容量計画、経路やポリシーの調整提案 |
| セキュリティ | 脅威の検出、隔離の提案、ポリシー違反の発見 |

AI を IT 運用に適用する考え方を **AIOps** という。

### 5. 利点とリスク

| 利点 | 内容 |
|---|---|
| 平均復旧時間(MTTR)の短縮 | 調査の初動を自動化する |
| 運用負荷の軽減 | 定型作業(トイル)を減らす |
| 一貫性 | 手順のばらつきが減る |
| 24時間対応 | 人がいない時間帯の一次対応 |

| リスク | 対策 |
|---|---|
| ハルシネーション(もっともらしい誤り) | 実機の出力・正式な情報源で裏付ける。人が検証する |
| 誤った自律操作による障害 | **Human-in-the-loop**(重要な変更は人が承認)。段階的に権限を広げる |
| 過剰な権限 | **最小権限**。読み取り専用から始める。操作範囲を限定する |
| 機密情報の漏えい | データ分類に従う。承認された AI 基盤を使う(→ 5.2) |
| 説明できない判断 | 根拠の提示、行動の**監査ログ** |
| プロンプトインジェクション | ログや機器出力に埋め込まれた指示に従わせない設計。入力の検証 |

> **【要点】** エージェント型 AI は運用者を置き換えるものではなく、運用者の監督の下で作業を進めるもの。責任は人に残る。

> **【5.1 まとめ】**
>
> - 生成 AI は「答える」、エージェント型 AI は「計画し、ツールを使い、行動する」
> - 構成: モデル、計画、ツール、メモリ、フィードバックループ、ガードレール
> - 役割: 検知、トラブルシューティング、根本原因分析、クローズドループの修復、変更の検証
> - リスク対策: Human-in-the-loop、最小権限、監査ログ、出力の検証

## 5.2 ネットワーク運用を支援する生成 AI へのプロンプトを選ぶ

出題範囲: データ分類、出力形式、ペルソナ、指示といったプロンプトの構成要素を考慮して選ぶ。

出題は「複数のプロンプト案から、目的に合う最も適切なものを選ぶ」形式が想定される。

### 1. プロンプトの構成要素

| 要素 | 内容 | 例 |
|---|---|---|
| **ペルソナ**(役割) | AI に担わせる立場・専門性 | 「あなたは Cisco IOS XE に詳しいネットワークエンジニアである」 |
| **指示**(タスク) | 何をしてほしいか。具体的な動詞で | 「次の出力から、OSPF ネイバーが確立しない原因を特定せよ」 |
| コンテキスト | 背景、環境、制約 | 「機種は Catalyst 9300、IOS XE 17.9。シングルエリア OSPF」 |
| 入力データ | 分析対象 | show コマンドの出力、ログ(機密情報は除去) |
| **出力形式** | 答えの形 | 「原因を1文で述べ、続けて修正コマンドをコードブロックで示せ」「表形式で」「JSON で」 |
| 制約 | やってはならないこと、範囲 | 「推測と確認済みの事実を区別せよ」「再起動を伴う手順は除け」 |
| 例示 | 望む出力の見本(few-shot) | 入力と出力の例を1〜2組 |
| **データ分類** | 入力してよい情報の区分 | 下記 |

### 2. データ分類

情報の機密度による区分。区分ごとに、どの AI に入力してよいかを決める。

| 区分(例) | 内容 | 外部の公開 AI サービスへの入力 |
|---|---|---|
| 公開(Public) | 公開済みの情報。製品マニュアル、一般的な技術知識 | 可 |
| 社内(Internal) | 社内向けの一般情報 | 組織の方針による |
| 機密(Confidential) | 構成図、設定ファイル、IP アドレス設計、顧客情報 | **不可**。承認された AI 基盤のみ |
| 極秘(Restricted) | パスワード、秘密鍵、SNMP コミュニティ、事前共有鍵、個人情報 | **不可** |

**入力前に取り除く・置き換えるもの(サニタイズ)**

- パスワード、`enable secret` のハッシュ、`username … secret` の行
- SNMP コミュニティ文字列、RADIUS / TACACS+ の共有鍵、IPsec の事前共有鍵、秘密鍵、証明書
- グローバル IP アドレス、ホスト名、拠点名、顧客名(必要なら `192.0.2.x`、`R1` などの仮の値に置換)
- 個人情報(ユーザ名、メールアドレス)

**原則**

- 組織の AI 利用方針に従う。承認されていない AI サービスに業務データを入れない
- 入力したデータが学習に使われたり、保存されたりする可能性を考える
- 必要最小限の情報だけを渡す

### 3. 良いプロンプトの条件

| 条件 | 説明 |
|---|---|
| 具体的 | 機種、OS、プロトコル、症状を明示する。「ネットワークが遅い。直して」は不可 |
| 目的が1つ | 1つのプロンプトに複数の無関係な依頼を詰めない |
| 出力形式を指定 | そのまま使える形にさせる |
| 根拠を求める | 判断の理由、該当する出力行を示させる |
| 制約を明示 | 本番への影響、禁止事項 |
| データ分類に適合 | 機密情報を含まない |

### 4. 比較例

目的: OSPF ネイバーが確立しない原因を調べたい。

| 案 | プロンプト | 評価 |
|---|---|---|
| A | 「OSPF が動かない。なぜ?」 | 不可。情報がなく、一般論しか返らない |
| B | (running-config 全文を、パスワードや共有鍵を含めたまま貼り付けて)「どこが悪い?」 | 不可。データ分類違反。不要な情報が多い |
| C | 「あなたはネットワークエンジニアである。R1 と R2 はシングルエリア OSPFv2 で、ギガビットイーサネットで直結している。ネイバーが EXSTART で止まる。以下は両ルータの `show ip ospf interface g0/1` の出力である(アドレスは仮の値に置換済み)。原因の候補を可能性の高い順に3つ挙げ、各候補を確認する show コマンドを表形式で示せ。設定変更は提案にとどめ、理由を付けよ」 | 適切。ペルソナ、コンテキスト、指示、入力データ、出力形式、制約がそろい、機密情報を含まない |
| D | 「OSPF のすべてを説明せよ」 | 不可。目的に合わない。範囲が広すぎる |

### 5. 出力の扱い

- 生成 AI の出力は**提案**。そのまま本番機器に投入しない
- コマンドの構文は機種・OS バージョンで異なる。公式ドキュメントや検証環境で確かめる
- 存在しないコマンドやオプションを生成することがある(ハルシネーション)
- 期待と違う結果なら、条件を足して繰り返す(反復的な改善)
- 変更は通常の変更管理(レビュー、検証、ロールバック計画)に従う

> **【5.2 まとめ】**
>
> - 構成要素: ペルソナ、指示、コンテキスト、入力データ、出力形式、制約、例示
> - データ分類を先に確認する。パスワード、鍵、コミュニティ文字列、顧客情報は入力しない。仮の値に置換する
> - 具体的で、目的が1つで、出力形式と制約を指定したプロンプトを選ぶ
> - 出力は検証してから使う

## 5.3 ネットワーク管理のアプローチ

出題範囲: デバイスベース、クラウドベース、コントローラベース、自動化ベース、Infrastructure as Code。

### 1. 3つのプレーン

| プレーン | 役割 | 例 |
|---|---|---|
| データプレーン(転送プレーン) | パケットを転送する | MAC テーブル・ルーティングテーブルの参照、カプセル化、ACL の適用、NAT |
| コントロールプレーン | 転送に必要な情報を作る | OSPF、STP、ARP、MAC 学習 |
| マネジメントプレーン | 機器を管理する | SSH、SNMP、syslog、NETCONF |

従来型のネットワークでは、3つのプレーンすべてが各機器の中にある。

### 2. デバイスベース(従来型)

- 機器1台ずつに SSH / コンソールでログインし、CLI(または機器の GUI)で設定する
- コントロールプレーンは各機器に分散
- 長所: 追加の基盤が不要。細かい制御ができる。小規模では単純
- 短所: 台数が増えると時間がかかる。手作業のミス、機器間の設定のばらつき(コンフィグドリフト)。全体の状態が見えにくい

### 3. コントローラベース

コントローラが多数の機器を集中管理する。SDN(Software-Defined Networking)の考え方では、コントロールプレーンの機能(の一部)をコントローラに集約する。

```
        [アプリケーション / スクリプト]
                  │  ノースバウンド API(REST)
            [ コントローラ ]
                  │  サウスバウンド API(NETCONF、RESTCONF、SNMP、SSH/CLI、OpenFlow)
     [スイッチ] [ルータ] [AP] …
```

| インターフェース | 向き | 用途 | 例 |
|---|---|---|---|
| **ノースバウンド**(NBI) | コントローラ ↔ アプリケーション | 意図・ポリシーを伝える、情報を取得する | REST API |
| **サウスバウンド**(SBI) | コントローラ ↔ ネットワーク機器 | 機器を設定・監視する | NETCONF、RESTCONF、SNMP、SSH / Telnet、OpenFlow、OpFlex |

| Cisco の製品 | 対象 |
|---|---|
| Catalyst Center(旧 DNA Center) | キャンパス LAN(SD-Access) |
| Catalyst SD-WAN Manager(旧 vManage) | WAN(SD-WAN) |
| APIC | データセンター(ACI) |
| WLC | 無線 AP |

**SD-Access の用語**

| 用語 | 意味 |
|---|---|
| アンダーレイ | 物理機器とその間の IP 到達性(ルーティング) |
| オーバーレイ | アンダーレイ上に作る仮想ネットワーク(VXLAN トンネル) |
| ファブリック | アンダーレイとオーバーレイを合わせた全体 |

**インテントベースネットワーキング(IBN)**: 管理者は「何を実現したいか(意図)」を定義し、コントローラがそれを各機器の設定に変換して適用し、意図どおりに動いているかを検証し続ける。

- 長所: 一元的な可視化と設定、一貫したポリシー、ゼロタッチに近い展開、テレメトリによる分析(アシュアランス)、API による連携
- 短所: コントローラの導入・運用コスト。コントローラの冗長化が必要。対応機種の制約

### 4. クラウドベース

管理機能(コントローラ)をベンダーのクラウドで提供する。機器はインターネット経由でクラウドに接続し、管理者はブラウザのダッシュボードで操作する。例: Cisco Meraki。

- 管理プレーンがクラウドにある。**ユーザのデータ通信はクラウドを経由しない**(管理トラフィックだけ)
- 機器は電源とインターネット接続があれば、クラウドから設定を取得して動く(ゼロタッチプロビジョニング)
- 長所: コントローラを自前で持たない。拠点が多くても一元管理。ソフトウェア更新が自動。導入が速い
- 短所: インターネット接続に依存(切れても転送は続くが、設定変更や監視ができない)。ライセンスの継続費用。細かい設定の自由度は CLI より低い。データの保管場所の考慮

| | オンプレミスのコントローラ | クラウド管理 |
|---|---|---|
| コントローラの場所 | 自社内 | ベンダーのクラウド |
| 維持管理 | 自社 | ベンダー |
| 費用 | 初期投資中心 | サブスクリプション |
| インターネット断の影響 | 小さい | 管理ができなくなる |

### 5. 自動化ベース

スクリプトや自動化ツールで、設定や確認作業を機械的に実行する。

| 手段 | 例 |
|---|---|
| スクリプト | Python(Netmiko、NAPALM、ncclient)、シェル |
| 構成管理ツール | **Ansible**(→ 5.5)、Puppet、Chef |
| API | REST API、NETCONF、RESTCONF |
| データ形式 | JSON、XML、YAML。YANG はデータモデル |

- 長所: 速い。ミスが減る。同じ手順を何度でも再現できる。多数の機器に一括適用できる
- 重要な性質: **冪等性**(同じ操作を何度実行しても結果が同じ。既に望む状態なら何も変えない)
- 注意: 誤った自動化は、誤りを全機器に一気に広げる。検証環境とレビューが要る

### 6. Infrastructure as Code(IaC)

ネットワークやサーバの構成を**コード(テキストファイル)として定義**し、ソフトウェア開発と同じ手法で管理する。

| 要素 | 内容 |
|---|---|
| コードで定義 | あるべき構成を YAML や HCL などのファイルに書く |
| **バージョン管理** | Git で履歴を残す。誰が、いつ、何を変えたかが分かる。前の状態に戻せる |
| レビュー | 変更をプルリクエストで確認してから反映する |
| 自動テスト・自動適用 | CI/CD パイプラインで検証し、適用する |
| **信頼できる唯一の情報源**(Single Source of Truth) | 機器の実際の設定ではなく、リポジトリのコードが正とする |
| ドリフトの検出 | コードと実機の差分(手作業による変更)を検出し、修正する |

| | 宣言的(declarative) | 手続き的(imperative) |
|---|---|---|
| 書く内容 | **あるべき最終状態** | 実行する手順 |
| ツールの例 | Terraform、Ansible(モジュールの多く) | シェルスクリプト、CLI コマンドの列 |
| 現状との差分 | ツールが計算して必要な変更だけを行う | 書いた手順をそのまま実行 |

| ツール | 特徴 |
|---|---|
| Ansible | エージェントレス、プッシュ型、YAML。構成管理 |
| Terraform | 宣言的、状態ファイル(state)を持つ、HCL。プロビジョニング |
| Puppet / Chef | エージェント型、プル型 |

- 長所: 再現性、変更履歴、レビュー、迅速なロールバック、環境の複製、文書とコードの一致
- 「自動化ベース」との違い: 自動化は作業を機械にやらせること。IaC は、構成そのものをコードとして管理する運用の方式。IaC は自動化を前提にする

### 7. 比較

| | デバイスベース | コントローラベース | クラウドベース | 自動化ベース | IaC |
|---|---|---|---|---|---|
| 操作の対象 | 機器1台ずつ | コントローラ | クラウドのダッシュボード | スクリプト・ツール | リポジトリのコード |
| 手段 | CLI、機器の GUI | GUI、REST API | Web GUI、API | Python、Ansible | Git、CI/CD、Ansible、Terraform |
| 規模への対応 | 低い | 高い | 高い | 高い | 高い |
| 一貫性 | 作業者に依存 | ポリシーで統一 | テンプレートで統一 | スクリプトで統一 | コードで統一、履歴あり |
| 主な弱点 | 手間、ミス、ドリフト | コントローラの費用と冗長化 | インターネット依存、継続費用 | スクリプトの品質に依存 | 習得と仕組み作りの負担 |

> **【5.3 まとめ】**
>
> - データプレーンは転送、コントロールプレーンは経路の決定、マネジメントプレーンは管理
> - デバイスベースは機器ごとに CLI。ドリフトとミスが弱点
> - コントローラベース: ノースバウンド(REST)はアプリ側、サウスバウンド(NETCONF、RESTCONF、SNMP、SSH)は機器側
> - アンダーレイは物理と IP 到達性、オーバーレイは仮想ネットワーク、合わせてファブリック
> - クラウドベースは管理がクラウド。データ通信はクラウドを通らない
> - 自動化の要は冪等性
> - IaC: コードで定義、Git でバージョン管理、コードが唯一の正、宣言的

## 5.4 ネットワーク運用における SNMP の機能

### 1. 構成要素

| 要素 | 内容 |
|---|---|
| SNMP マネージャ(NMS) | 監視サーバ。情報を集め、表示・通知する |
| SNMP エージェント | 監視される機器(ルータ、スイッチ)で動くソフトウェア |
| **MIB** | 機器が持つ管理情報の定義(データベース)。木構造 |
| **OID** | MIB の中の各項目を指す識別子。例: `1.3.6.1.2.1.1.5`(sysName) |

用途: インターフェースの状態・トラフィック量・エラー数、CPU・メモリ使用率、温度などの監視。障害の通知。設定の変更(Set)。

### 2. メッセージ

| メッセージ | 方向 | 内容 |
|---|---|---|
| Get | マネージャ → エージェント | 指定した OID の値を要求 |
| GetNext | マネージャ → エージェント | 次の OID の値を要求(MIB を順にたどる) |
| GetBulk | マネージャ → エージェント | まとめて要求。**v2c 以降** |
| Set | マネージャ → エージェント | 値を**変更** |
| Response | エージェント → マネージャ | 要求への応答 |
| **Trap** | エージェント → マネージャ | 事象の発生を自発的に通知。**確認応答なし** |
| **Inform** | エージェント → マネージャ | 通知。**確認応答あり**(届かなければ再送)。v2c 以降 |

| | ポート |
|---|---|
| エージェント(Get / Set を受ける) | **UDP 161** |
| マネージャ(Trap / Inform を受ける) | **UDP 162** |

| 方式 | 内容 | 特徴 |
|---|---|---|
| ポーリング | マネージャが定期的に Get | 傾向を把握できる。間隔の間に起きた事象は次回まで分からない |
| 通知(Trap / Inform) | エージェントが事象発生時に送る | 即時。Trap は UDP で確認がないため、失われることがある |

### 3. バージョン

| バージョン | 認証 | 暗号化 | 備考 |
|---|---|---|---|
| v1 | コミュニティ文字列(平文) | なし | 旧式 |
| v2c | コミュニティ文字列(平文) | なし | GetBulk、Inform を追加。64 ビットカウンタ |
| **v3** | ユーザ名 + ハッシュ(MD5 / SHA) | あり(DES / AES) | 推奨 |

**SNMPv3 のセキュリティレベル**

| レベル | キーワード | 認証 | 暗号化 |
|---|---|---|---|
| noAuthNoPriv | `noauth` | ユーザ名のみ | なし |
| authNoPriv | `auth` | あり | なし |
| authPriv | `priv` | あり | あり |

**コミュニティ文字列**(v1 / v2c): パスワードに相当。

| 種類 | 権限 |
|---|---|
| RO(Read-Only) | 読み取りのみ(Get) |
| RW(Read-Write) | 読み書き(Get、Set) |

既定値として知られる `public`(RO)、`private`(RW)は使わない。

### 4. 設定例

```
! v2c
snmp-server community MonR3ad RO 10            ! ACL 10 のマネージャだけ許可
snmp-server location Tokyo-DC1
snmp-server contact noc@example.com
snmp-server host 10.1.1.100 version 2c MonR3ad ! Trap の送信先
snmp-server enable traps                       ! Trap を有効化
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
> - マネージャ(NMS)、エージェント、MIB、OID
> - Get / GetNext / GetBulk / Set はマネージャから。Trap / Inform はエージェントから
> - Trap は確認応答なし、Inform は確認応答あり
> - UDP 161(エージェント)、UDP 162(Trap の受信)
> - v1 / v2c はコミュニティ文字列(平文)。v3 は認証と暗号化
> - v3: noAuthNoPriv、authNoPriv、authPriv
> - RO は読み取り、RW は Set も可

## 5.5 Ansible などの構成管理の仕組みを使ってコマンドを実行する

### 1. Ansible の特徴

| 特徴 | 内容 |
|---|---|
| **エージェントレス** | 管理対象に専用ソフトウェアを入れない。ネットワーク機器には SSH(または NETCONF、API)で接続 |
| **プッシュ型** | コントロールノードから対象へ設定を送る |
| YAML | プレイブックを YAML で書く |
| 冪等性 | 既に望む状態なら変更しない(`changed` にならない) |
| 実装 | Python 製。オープンソース(Red Hat) |

| | Ansible | Puppet | Chef |
|---|---|---|---|
| エージェント | **不要** | 必要(エージェントレスも可) | 必要 |
| 方式 | **プッシュ** | プル | プル |
| 記述 | YAML(プレイブック) | 独自 DSL(マニフェスト) | Ruby(レシピ、クックブック) |
| 通信 | SSH、NETCONF | HTTPS(TCP 8140) | HTTPS(TCP 10002) |

### 2. 構成要素

| 用語 | 内容 |
|---|---|
| コントロールノード | Ansible を実行するホスト(Linux など) |
| 管理対象ノード(マネージドノード) | 設定される機器 |
| **インベントリ** | 管理対象の一覧。ホスト、グループ、変数。INI 形式または YAML |
| **プレイブック** | 実行内容を定義した YAML ファイル。1つ以上のプレイを含む |
| プレイ | 「どのホストに」「どのタスクを」実行するかの組 |
| タスク | 1つの処理。モジュールを1つ呼ぶ |
| **モジュール** | 実際の処理を行う部品。`cisco.ios.ios_command`、`cisco.ios.ios_config` など |
| コレクション | モジュールなどの配布単位。`cisco.ios`、`cisco.nxos` |
| 変数 | 値の差し替え。`group_vars/`、`host_vars/`、プレイブック内の `vars` |
| テンプレート | Jinja2(`.j2`)。変数を埋め込んで設定を生成する |
| ロール | タスク・変数・テンプレートをまとめた再利用単位 |
| Ansible Vault | パスワードなどの機密情報を暗号化して保存する |
| ファクト | 対象から収集した情報(`ios_facts`) |

### 3. YAML の基本

```yaml
---                          # 文書の開始
hostname: R1                 # キー: 値(コロンの後に空白)
interfaces:                  # リスト
  - name: GigabitEthernet0/0
    ip: 10.1.1.1
  - name: GigabitEthernet0/1
    ip: 10.1.12.1
enabled: true                # 真偽値
# コメント
```

- 階層は**インデント(空白)**で表す。**タブは使えない**
- リストの要素は `- `(ハイフンと空白)で始める
- 文字列の引用符は通常省略できる

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
| `ansible_host` | 接続先のアドレス |
| `ansible_connection` | 接続方式。ネットワーク機器の CLI は `ansible.netcommon.network_cli`(SSH) |
| `ansible_network_os` | 対象の OS。`cisco.ios.ios` |
| `ansible_user` | ログインユーザ |
| `ansible_become` / `ansible_become_method` | 特権モードへの昇格(`enable`) |

パスワードは平文で書かず、Ansible Vault や実行時の入力(`--ask-pass`、`-k`)を使う。

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

**設定コマンドを実行する**

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
| `name` | プレイ・タスクの説明。実行時に表示される |
| `hosts` | 対象。インベントリのホスト名、グループ名、`all` |
| `gather_facts` | ファクト収集の有無。ネットワーク機器では通常 `false` |
| `tasks` | タスクのリスト。上から順に実行 |
| `register` | タスクの結果を変数に保存 |
| `vars` | 変数の定義。`{{ 変数名 }}` で参照 |
| `when` | 条件付き実行 |
| `loop` | 繰り返し |

| モジュール | 用途 | 冪等性 |
|---|---|---|
| `cisco.ios.ios_command` | EXEC コマンド(show など)を実行して出力を得る | 設定を変えない。常に `ok` |
| `cisco.ios.ios_config` | 設定コマンドを投入する。running-config と比較し、差分だけ適用 | あり |
| `cisco.ios.ios_facts` | 機器の情報を収集 | — |
| `cisco.ios.ios_interfaces`、`ios_vlans`、`ios_l3_interfaces` など | 機能ごとのリソースモジュール。状態を宣言的に指定(`state: merged` など) | あり |
| `ansible.builtin.debug` | 変数やメッセージを表示 | — |

### 6. 実行

```bash
ansible-playbook -i inventory.ini show.yml            # 実行
ansible-playbook -i inventory.ini config.yml --check  # ドライラン。変更しない
ansible-playbook -i inventory.ini config.yml --diff   # 差分を表示
ansible-playbook -i inventory.ini config.yml --limit R1   # 対象を絞る
ansible-playbook -i inventory.ini config.yml -k       # SSH パスワードを尋ねる
ansible-playbook config.yml --syntax-check            # 構文チェック
ansible-inventory -i inventory.ini --list             # インベントリの確認
ansible-doc cisco.ios.ios_config                      # モジュールの説明
ansible routers -i inventory.ini -m cisco.ios.ios_command -a "commands='show clock'"   # アドホック実行
```

**実行結果の読み方**

```
PLAY RECAP *********************************************************
R1    : ok=2    changed=1    unreachable=0    failed=0    skipped=0
R2    : ok=2    changed=0    unreachable=0    failed=0    skipped=0
```

| 項目 | 意味 |
|---|---|
| `ok` | 成功したタスク数(変更なしを含む) |
| `changed` | 変更が発生したタスク数 |
| `unreachable` | 接続できなかった(SSH 不可、認証失敗、到達性なし) |
| `failed` | タスクが失敗した |
| `skipped` | 条件により実行されなかった |

R2 は `changed=0`。既に望む状態だったので変更されなかった(冪等性)。

> **【5.5 まとめ】**
>
> - Ansible はエージェントレス、プッシュ型、YAML、SSH
> - インベントリ = 対象の一覧、プレイブック = 実行内容、モジュール = 処理の部品
> - YAML はインデント(空白)で階層、`- ` でリスト。タブ不可
> - `ios_command` は show などの実行、`ios_config` は設定の投入
> - `ansible-playbook -i <インベントリ> <プレイブック>`。`--check` はドライラン
> - 冪等性: 同じプレイブックを再実行しても `changed=0`
> - Puppet と Chef はエージェント型・プル型

## 5.6 syslog メッセージの内容、重大度、ファシリティを読み取る

### 1. メッセージの形式

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
| ② | **ファシリティ** | `LINK` | メッセージを生成した機能・プロトコル・ハードウェア |
| ③ | **重大度** | `3` | 0〜7 |
| ④ | ニーモニック | `UPDOWN` | 事象を示す短い名前 |
| ⑤ | 説明 | `Interface …` | 詳細 |

タイムスタンプ先頭の `*` は、時刻が正確でない(NTP で同期していない)ことを示す。障害調査では複数機器のログを時刻で突き合わせるので、時刻同期が前提になる。

### 2. 重大度

| レベル | キーワード | 意味 | 例 |
|---|---|---|---|
| **0** | emergencies | システムが使用不能 | |
| **1** | alerts | 直ちに対処が必要 | |
| **2** | critical | 危機的な状態 | `%PORT_SECURITY-2-PSECURE_VIOLATION`、`%SPANTREE-2-BLOCK_BPDUGUARD` |
| **3** | errors | エラー | `%LINK-3-UPDOWN` |
| **4** | warnings | 警告 | `%CDP-4-NATIVE_VLAN_MISMATCH`、`%PM-4-ERR_DISABLE` |
| **5** | notifications | 正常だが重要な事象 | `%LINEPROTO-5-UPDOWN`、`%SYS-5-CONFIG_I`、`%OSPF-5-ADJCHG` |
| **6** | informational | 情報 | `%SEC-6-IPACCESSLOGP`(ACL の log) |
| **7** | debugging | デバッグ | `debug` コマンドの出力 |

**数値が小さいほど重大**。

> **【覚え方】** Every Awesome Cisco Engineer Will Need Ice cream Daily(Emergency、Alert、Critical、Error、Warning、Notification、Informational、Debugging)。

**レベル指定の意味**: あるレベルを指定すると、**そのレベルと、それより重大な(数値の小さい)メッセージ**が対象になる。

| 指定 | 出力されるレベル |
|---|---|
| `logging trap 4`(warnings) | 0〜4 |
| `logging trap informational` | 0〜6 |
| `logging console 7`(debugging) | 0〜7(すべて) |

### 3. ファシリティ

「ファシリティ」には2つの意味がある。

| 意味 | 内容 | 例 |
|---|---|---|
| IOS メッセージ内のファシリティ | メッセージの発生元 | `LINK`、`LINEPROTO`、`SYS`、`OSPF`、`SEC`、`CDP`、`SPANTREE`、`PM`、`DHCP_SNOOPING`、`SW_DAI`、`STORM_CONTROL` |
| syslog プロトコルのファシリティ | syslog サーバが振り分けに使う分類コード(0〜23) | kern(0)、user(1)、mail(2)、daemon(3)、auth(4)、syslog(5)、local0〜local7(16〜23) |

- Cisco 機器が syslog サーバへ送るときの既定は **local7**。`logging facility local5` で変更できる
- サーバ側は、ファシリティと重大度の組み合わせで保存先のファイルを分ける
- syslog パケットの優先度(PRI)= ファシリティ × 8 + 重大度。local7(23)で重大度 5 なら 189

### 4. ログの出力先

| 出力先 | 既定 | 既定のレベル | 設定 |
|---|---|---|---|
| コンソール | 有効 | debugging(7) | `logging console <レベル>` |
| モニタ(VTY: SSH / Telnet) | 送る設定は有効だが、**セッションで `terminal monitor` を実行しないと表示されない** | debugging(7) | `logging monitor <レベル>`、`terminal monitor` |
| バッファ(RAM) | 機種による | debugging(7) | `logging buffered [サイズ] [レベル]` |
| syslog サーバ | 無効 | **informational(6)** | `logging host <IP>`、`logging trap <レベル>` |

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
 logging synchronous            ! 入力中のコマンドがログで分断されないようにする
```

- syslog サーバへは **UDP 514** で送る
- バッファは RAM 上にあり、再起動で消える。あふれると古いものから上書きされる
- SSH 接続中にログを見る: `terminal monitor`。止める: `terminal no monitor`

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

`show logging` の前半で各出力先のレベルが、後半でバッファの内容が分かる。

### 5. 代表的なメッセージの読み取り

| メッセージ | 読み取ること |
|---|---|
| `%LINK-3-UPDOWN: Interface Gi0/1, changed state to down` | 物理層がダウン。重大度 3(エラー) |
| `%LINEPROTO-5-UPDOWN: Line protocol on Interface Gi0/1, changed state to down` | ラインプロトコル(L2)がダウン。重大度 5 |
| `%LINK-5-CHANGED: Interface Gi0/1, changed state to administratively down` | `shutdown` が実行された |
| `%SYS-5-CONFIG_I: Configured from console by admin on vty0 (10.1.1.50)` | 設定モードを抜けた。誰が、どこから変更したか |
| `%SYS-5-RESTART: System restarted` | 再起動した |
| `%OSPF-5-ADJCHG: Process 1, Nbr 2.2.2.2 on Gi0/1 from FULL to DOWN, Neighbor Down: Dead timer expired` | OSPF ネイバーが落ちた。理由は Dead タイマー満了(Hello が届かない) |
| `%OSPF-4-ERRRCV: Received invalid packet: mismatched area ID` | エリア ID の不一致 |
| `%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on Gi0/24 (1), with SW2 Gi0/24 (99)` | ネイティブ VLAN が自分 1、相手 99 |
| `%CDP-4-DUPLEX_MISMATCH: duplex mismatch discovered on Gi0/1 (not full duplex), with R1 Gi0/0 (full duplex)` | デュプレックス不一致 |
| `%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi0/5 with BPDU Guard enabled. Disabling port.` | BPDU ガード発動 |
| `%PM-4-ERR_DISABLE: bpduguard error detected on Gi0/5, putting Gi0/5 in err-disable state` | err-disabled の原因 |
| `%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address … on port Gi0/5` | ポートセキュリティ違反と、原因の MAC アドレス |
| `%SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Req) on Gi0/3, vlan 10` | DAI が ARP を破棄 |
| `%DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: … drop message on untrusted port, message type: DHCPOFFER` | 非信頼ポートで DHCP サーバのメッセージを破棄 |
| `%STORM_CONTROL-3-FILTERED: A Broadcast storm detected on Gi0/6` | ストーム制御が発動 |
| `%SEC-6-IPACCESSLOGP: list 110 denied tcp 192.168.1.10(51000) -> 10.1.1.80(23), 1 packet` | ACL 110 が Telnet を拒否 |
| `%SEC_LOGIN-5-LOGIN_SUCCESS` / `%SEC_LOGIN-4-LOGIN_FAILED` | ログインの成功 / 失敗 |
| `%IP-4-DUPADDR: Duplicate address 10.1.1.1 on Gi0/0, sourced by 0c1a.2b3c.4d99` | IP アドレス重複と、相手の MAC |
| `%SW_MATM-4-MACFLAP_NOTIF: Host 0c1a.2b3c.4d01 in vlan 10 is flapping between port Gi0/1 and port Gi0/2` | MAC フラッピング。ループの疑い |
| `%HSRP-5-STATECHANGE: GigabitEthernet0/0 Grp 1 state Standby -> Active` | HSRP の切り替わり |

**読み取りの手順**

1. タイムスタンプで事象の順序を並べる
2. ファシリティで、どの機能のメッセージかを知る
3. 重大度で優先度を判断する
4. ニーモニックと説明から、対象(インターフェース、ネイバー、MAC アドレス)と状態の変化を読む
5. 先に起きた事象が原因、後の事象が結果であることが多い(リンクダウン → ラインプロトコルダウン → OSPF ネイバーダウン)

### 6. debug

- `debug` の出力は重大度 7。処理負荷が高い。本番では対象を絞って短時間だけ使う
- 止める: `undebug all`(`no debug all`、`u all`)
- 出力先のレベルが 7 より小さいと表示されない

> **【5.6 まとめ】**
>
> - 形式: `%ファシリティ-重大度-ニーモニック: 説明`
> - 重大度 0 emergencies 〜 7 debugging。小さいほど重大
> - レベルを指定すると、そのレベル以下の数値すべてが対象
> - syslog サーバへは UDP 514。既定のレベルは informational(6)、既定のファシリティは local7
> - コンソールは既定で全レベル表示。VTY では `terminal monitor`
> - `show logging` で各出力先のレベルとバッファの内容
> - 時刻同期がないとタイムスタンプに `*` が付く
