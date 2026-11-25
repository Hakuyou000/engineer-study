# AWS DOP 4.0 監視とログ(15%)

対象: DOP-C02

「ログと指標を集めて、保存する(4.1)」「集めたものを分析して、異常を見つける(4.2)」「監視とイベントへの対応を自動化する(4.3)」の 3 つに分かれます。中心は Amazon CloudWatch です。

## 4.1 ログと指標の収集、集約、保存を設定する

出題範囲: CloudWatch の指標(名前空間、ディメンション、解像度)、CloudWatch エージェント、カスタム指標、メトリクスフィルター、メトリクスストリーム、ロググループの保持期間、サブスクリプションフィルター、CloudWatch Logs Insights、ログの暗号化(KMS)、ログ収集のための IAM。

### 1. CloudWatch の指標

**Amazon CloudWatch(指標とログを集めて監視するサービス)** の指標は、次の要素で決まります。

| 要素 | 意味 | 例 |
|---|---|---|
| 名前空間 | 指標を入れる入れ物 | `AWS/EC2`、自作は `MyApp` |
| 指標名 | 測るもの | `CPUUtilization` |
| ディメンション | 指標を区別する名前と値の組 | `InstanceId=i-0abc...` |
| 解像度 | データの間隔。標準は 1 分、高解像度は 1 秒 | 高解像度のカスタム指標 |

- 同じ指標名でも、ディメンションの組み合わせが違えば、別の指標です。
- EC2 の既定の監視(基本モニタリング)は 5 分間隔です。詳細モニタリングにすると 1 分間隔になります(有料)。
- EC2 の標準指標には、**メモリ使用率とディスクの使用率がありません**。OS の中の値なので、CloudWatch エージェントで集めます。
- 指標の保持期間: 1 秒間隔のデータは 3 時間、1 分間隔は 15 日、5 分間隔は 63 日、1 時間間隔は 455 日です。古いデータは、粗い間隔にまとめて残ります。

### 2. CloudWatch エージェント

**CloudWatch エージェント** は、EC2 やオンプレミスのサーバーで動き、OS 内の指標(メモリ、ディスク、スワップなど)と、ログファイルを CloudWatch に送ります。

- 設定は JSON ファイルで書きます。**Systems Manager のパラメータストア** に置くと、多数のサーバーへ同じ設定を配れます。
- インストールと設定の配布は、Systems Manager の Run Command や State Manager で自動化できます。
- インスタンスに付ける IAM ロールに、`CloudWatchAgentServerPolicy`(AWS 管理ポリシー)を付けます。パラメータストアから設定を読むなら、その権限も要ります。
- 自作のアプリの指標は、`PutMetricData` API でも送れます。**埋め込みメトリクスフォーマット(EMF)** で、ログに決まった形の JSON を書くと、CloudWatch が指標に変換します。Lambda などで便利です。

### 3. CloudWatch Logs

| 用語 | 意味 |
|---|---|
| ロググループ | 同じ種類のログの入れ物。保持期間や暗号化は、ここで設定する |
| ログストリーム | 1 つの発生元(インスタンス、コンテナなど)の、ログの並び |
| ロググループのクラス | Standard と Infrequent Access。頻繁に検索しないログは、Infrequent Access で費用を減らせる |

- **保持期間の既定は「失効しない」** です。何もしないとログが溜まり続けて、費用が増えます。ロググループごとに保持期間を決めます。
- 長期に保存して費用を下げるなら、S3 に出して、S3 ライフサイクルで安いストレージクラスへ移します。

CloudWatch Logs の入れ物の関係を図にします。

```text
[Log group] 保持期間と暗号化は、ここで設定する
  +-- [Log stream: instance A] 1 つの発生元のログの並び
  |     +-- log events
  +-- [Log stream: instance B]
        +-- log events
```

### 4. ログから指標を作る: メトリクスフィルター

**メトリクスフィルター** は、ロググループに届いたログを、パターンで検索して、一致した数などを指標にします。

- 例: ログに `ERROR` を含む行の数を、指標 `ErrorCount` にして、アラームにつなぐ。
- フィルターを作った**後に届いたログ**だけが対象です。過去のログは対象になりません。
- JSON のログは、`{ $.statusCode = 500 }` のような形で、フィールドを指定できます。

### 5. ログをほかへ流す

| 方法 | 内容 | 遅延 |
|---|---|---|
| **サブスクリプションフィルター** | ログをリアルタイムで、Kinesis Data Streams、Amazon Data Firehose、Lambda へ送る。1 つのロググループに付けられるのは 5 つまでで、上限は引き上げられない | ほぼリアルタイム |
| S3 へのエクスポート | 指定した期間のログを、S3 にまとめて出す | バッチ。ログがエクスポートできるようになるまで、最大 12 時間かかる |

ログを継続的に保管するには、エクスポートではなくサブスクリプションフィルターを使います(AWS の推奨)。

CloudWatch Logs から、ログを加工して流す経路を図にします。

```text
[Log group]
  |
  +-- metric filter --> [Metric] --> [Alarm]
  |
  +-- subscription filter (ほぼリアルタイム)
  |     +--> Kinesis Data Streams
  |     +--> Amazon Data Firehose --> S3、OpenSearch Service
  |     +--> Lambda
  |
  +-- export to S3 (バッチ)
```

- **Amazon Data Firehose(データを S3、OpenSearch Service などへ届けるサービス)** へ送ると、S3 や Amazon OpenSearch Service へ、自動で保存できます。
- **クロスアカウント**で集約するときは、集約先のアカウントに「送信先」を作り、各アカウントのサブスクリプションフィルターから送ります。
- **CloudWatch のクロスアカウントのオブザーバビリティ**: 監視用のアカウントから、複数のアカウントとリージョンの指標、ログ、トレースを見られます。

### 6. メトリクスストリーム

**CloudWatch メトリクスストリーム** は、指標をほぼリアルタイムで、継続的に Amazon Data Firehose へ流します。そこから S3 に保存して Athena で分析したり、サードパーティの監視サービスへ送ったりします。形式は JSON か OpenTelemetry です。

### 7. ログの検索: CloudWatch Logs Insights

専用のクエリ言語で、ロググループのログを集計や検索します。複数のロググループを一度に検索できます。

```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count(*) as errors by bin(5m)
| sort errors desc
```

- 単純な絞り込みなら、フィルターパターンでもできます。
- 集計が要る検索は、Logs Insights を選びます。
- **Contributor Insights** は、ログから「上位の利用者」などの寄与者を見つけます(例: 一番多くリクエストした IP)。
- **データ保護ポリシー**: ログの中のメールアドレスなどの機密データを検出して、マスクします。

### 8. ログと指標の暗号化とアクセス権限

| 対象 | 暗号化の方法 |
|---|---|
| CloudWatch Logs | 保存時は既定で暗号化される。ロググループに AWS KMS のカスタマーマネージドキーを関連付けると、そのキーで暗号化できる |
| S3 に保存したログ | SSE-S3、SSE-KMS、またはクライアント側の暗号化 |
| 転送中 | HTTPS(TLS)で送る |

- KMS キーで暗号化するとき、**キーポリシー**で、CloudWatch Logs のサービスプリンシパル(`logs.<リージョン>.amazonaws.com`)に、使う権限を与えます。与えないと、ロググループへの関連付けが失敗します。
- ログを S3 に置くときは、バケットポリシーで、ログを書き込むサービスだけに許可します。ログの改ざんと削除を防ぐには、S3 のバージョニング、MFA 削除、Object Lock が使えます。
- ログを送る側(EC2 など)は、IAM ロールで、`logs:CreateLogStream` と `logs:PutLogEvents` などを許可します。

### まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| EC2 のメモリ使用率を監視 | CloudWatch エージェント |
| 多数のサーバーに同じエージェント設定を配る | パラメータストアに設定を置く + Systems Manager |
| ログの `ERROR` の数でアラーム | メトリクスフィルター + アラーム |
| ログをリアルタイムで S3 や OpenSearch Service へ | サブスクリプションフィルター + Firehose |
| ログのリアルタイムの独自処理 | サブスクリプションフィルター + Lambda または Kinesis Data Streams |
| ログの集計とパターンの検索 | CloudWatch Logs Insights |
| ログの保持期間を決めて費用を抑える | ロググループの保持期間 + S3 のライフサイクル |
| ログをカスタマーマネージドキーで暗号化 | ロググループに KMS キーを関連付け + キーポリシーで Logs を許可 |
| 全指標を継続的に S3 へ流す | メトリクスストリーム + Firehose |

## 4.2 ログと指標を監査、監視、分析して問題を検出する

出題範囲: 異常検知アラーム、よく使う指標、ダッシュボード、Amazon Quick Sight、CloudWatch アラーム、AWS X-Ray、Kinesis Data Streams によるログのリアルタイム分析、Athena、Amazon Inspector、AWS Config のルール、AWS CloudTrail のイベント。

### 1. CloudWatch アラーム

アラームは、1 つの指標(または計算式)を監視し、状態が変わると動作を起こします。

| 状態 | 意味 |
|---|---|
| OK | しきい値の範囲内 |
| ALARM | しきい値を超えている |
| INSUFFICIENT_DATA | データが足りず判定できない |

- **M 個中 N 個(Datapoints to alarm)**: 評価期間のうち、N 個のデータポイントがしきい値を超えたら、ALARM にします。一瞬の変動で鳴らないようにできます。
- **欠損データの扱い**: データが来ないときに、「欠損として扱う」「良好」「不良」「無視」から選べます。
- **複合アラーム**: 複数のアラームの状態を、AND や OR で組み合わせます。ノイズを減らせます。
- **メトリクス計算(Metric Math)**: 複数の指標を計算して、アラームやグラフに使います(例: エラー数 ÷ リクエスト数)。
- **異常検知アラーム**: 過去のデータから、指標の正常な範囲(バンド)を機械学習で作ります。バンドを外れると、アラームになります。時刻や曜日で変わる指標に向きます。固定のしきい値を決めにくいときに選びます。

### 2. よく使う指標

| サービス | 指標の例 | 意味 |
|---|---|---|
| EC2 | `CPUUtilization` | CPU 使用率 |
| EC2 | `StatusCheckFailed_System` | AWS 側(ホスト)の障害 |
| EC2 | `StatusCheckFailed_Instance` | インスタンス内(OS など)の障害 |
| ALB | `HTTPCode_Target_5XX_Count` | ターゲット(アプリ)が返した 5xx の数 |
| ALB | `HTTPCode_ELB_5XX_Count` | ロードバランサー自身が返した 5xx の数 |
| ALB | `TargetResponseTime` | ターゲットの応答時間 |
| ALB | `UnHealthyHostCount` | 異常なターゲットの数 |
| RDS | `DatabaseConnections`、`FreeStorageSpace`、`ReplicaLag` | 接続数、空き容量、レプリカの遅れ |
| SQS | `ApproximateAgeOfOldestMessage` | 最も古いメッセージの滞留時間 |
| Lambda | `Errors`、`Throttles`、`Duration` | エラー数、スロットリング数、実行時間 |

### 3. ダッシュボードと可視化

- **CloudWatch ダッシュボード**: 指標、アラーム、ログの検索結果を、1 画面に並べます。複数のアカウントとリージョンの指標を、1 つのダッシュボードに置けます。
- **Amazon Quick Sight(BI。データを可視化するサービス)**: S3 のログを Athena で検索して、グラフにする、といった用途に向きます。運用の指標より、分析と報告に向きます。

### 4. AWS X-Ray

**AWS X-Ray(分散アプリケーションのリクエストを追跡するサービス)** は、リクエストが通ったサービスの順序と、各段階の時間を記録します。

| 用語 | 意味 |
|---|---|
| トレース | 1 つのリクエストの全経路の記録 |
| セグメント、サブセグメント | 各サービス、外部への呼び出しの記録 |
| サービスマップ | サービス間の呼び出しと、エラー・遅延の図 |
| サンプリングルール | 記録する割合を決める(すべては記録しない) |
| アノテーション | 検索できる、キーと値のメタデータ |

有効にする方法は、実行環境で変わります。

| 環境 | 設定 |
|---|---|
| Lambda | 関数の「アクティブトレーシング」を有効にする |
| API Gateway | ステージの X-Ray トレースを有効にする |
| EC2、オンプレミス | アプリに X-Ray SDK(または ADOT)を組み込み、**X-Ray デーモン**を動かす |
| ECS | デーモンを、同じタスク内の**サイドカーコンテナ**で動かす |
| EKS | デーモンを DaemonSet で動かす |

X-Ray の SDK とデーモンは、2026 年 2 月 25 日から保守モードです。新しく作るときは、OpenTelemetry(ADOT など)で計装して、X-Ray へ送ります。

- 実行ロールに、`AWSXRayDaemonWriteAccess` 相当の権限が要ります。
- 「どのサービスで遅いのか」「どの下流の呼び出しでエラーが出るのか」を調べるときは、X-Ray を選びます。

X-Ray が、1 つのリクエストの経路を記録する様子を図にします。

```text
users --> [API Gateway] --> [Lambda] --> [DynamoDB]
               |                |              |
               +----------------+--------------+
                                |
                                v
                 [X-Ray trace] 1 つのリクエストの記録にまとめる
                                |
                                v
                 [Service map] 遅延とエラーを図で見る
```

### 5. リアルタイムのログ分析と、ログの検索

| 目的 | 選ぶもの |
|---|---|
| ログのストリームを、リアルタイムで独自に処理 | サブスクリプションフィルター + Kinesis Data Streams |
| 過去のログを、直近の障害の調査で素早く検索 | CloudWatch Logs Insights |
| S3 の大量のログを、SQL で分析 | Amazon Athena(S3 のデータを SQL で検索するサービス)。ALB のログ、VPC フローログ、CloudTrail のログなどに使う |

Athena は、パーティション(日付などでフォルダーを分ける)と、列指向の形式(Parquet)にすると、検索する量が減って、費用が下がります。

### 6. Amazon Inspector

**Amazon Inspector(脆弱性を継続的に検査するサービス)** は、EC2、ECR のコンテナイメージ、Lambda 関数の、ソフトウェアの脆弱性と、意図しないネットワークの露出を検査します。

- 有効にすると、自動で対象を見つけて、継続的に検査します。新しい脆弱性が公表されると、再検査します。
- EC2 は、SSM エージェントを使う方式が基本です。エージェントなしの検査(スナップショットを使う)もあります。
- 結果は検出結果(Finding)として出ます。重大度のスコアがつきます。EventBridge で通知や自動対応につなげます。
- **AWS Organizations と連携**して、委任された管理者のアカウントで、組織全体を有効にできます。

### 7. AWS Config と CloudTrail

| サービス | 何を見るか | 使いどころ |
|---|---|---|
| **AWS Config** | リソースの設定の履歴と、ルールへの準拠 | 「暗号化されていない EBS があるか」「セキュリティグループが 0.0.0.0/0 でポートを開けていないか」 |
| **AWS CloudTrail** | 誰が、いつ、どの API を呼んだか | 「誰がセキュリティグループを変更したか」 |

- Config ルールには、AWS のマネージドルールと、Lambda で作るカスタムルールがあります。
- **コンフォーマンスパック**: 複数のルールと修復を、まとめて配ります。
- **Config アグリゲーター**: 複数のアカウントとリージョンの結果を、1 か所に集めます。
- CloudTrail は、**管理イベント**(リソースの作成や変更)が、既定で記録されます(イベント履歴で 90 日)。**データイベント**(S3 のオブジェクトの操作、Lambda の呼び出しなど)は、既定では記録されません。証跡を作って有効にします。
- 90 日より長く保存するには、**証跡**を作って、S3 に出します。ログファイルの整合性検証で、改ざんを検出できます。
- **CloudTrail Lake**: イベントを保存して SQL で検索します。2026 年 5 月 31 日から、新しい顧客は使い始められません。AWS は CloudWatch への移行を勧めています。
- **CloudTrail Insights**: 通常と違う API の呼び出し量(急に増えた、など)を検出します。

### まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| 時間帯で変わる指標の異常を検出 | 異常検知アラーム |
| 複数のアラームの組み合わせで通知(ノイズを減らす) | 複合アラーム |
| 一瞬の変動で鳴らさない | M 個中 N 個の設定 |
| 複数のサービスにまたがる遅延の原因を探す | AWS X-Ray |
| ECS で X-Ray を使う | サイドカーコンテナの X-Ray デーモン |
| S3 の ALB ログを SQL で調べる | Athena |
| EC2 と ECR の脆弱性を継続的に検査 | Amazon Inspector |
| リソースの設定がルールに合うかを継続的に評価 | AWS Config |
| 誰が API を呼んだかの調査 | CloudTrail |
| 90 日より前の API の履歴 | CloudTrail の証跡(S3) |

## 4.3 複雑な環境の監視とイベント管理を自動化する

出題範囲: イベント駆動で非同期の設計(S3 イベント通知、EventBridge、SNS、Lambda)、各サービスのオートスケーリング、アラームによる通知と動作(EC2 の自動復旧を含む)、ヘルスチェック(ALB、Route 53)、エージェント(SSM エージェント、CloudWatch エージェント)の導入、Config ルールによる自動修復。

### 1. イベント駆動の設計

| 仕組み | 内容 |
|---|---|
| **S3 イベント通知** | オブジェクトの作成や削除で、SNS、SQS、Lambda、EventBridge へ通知する。ログファイルが S3 に届いたら、Lambda で処理して、OpenSearch Service や CloudWatch Logs へ送る、という使い方ができる |
| **Amazon EventBridge** | AWS のサービスのイベント、自作アプリのイベント、SaaS のイベントを、ルールのイベントパターンで選んで、ターゲットへ送る |
| Amazon SNS | 通知を、メール、SMS、SQS、Lambda などへ配る |

EventBridge のルールの例です。EC2 インスタンスが停止したときだけ、一致します。

```json
{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Instance State-change Notification"],
  "detail": { "state": ["stopped"] }
}
```

EventBridge の機能です。

- **スケジュール**: 決まった時刻や間隔で、ターゲットを起動します(EventBridge Scheduler も使えます)。
- **アーカイブとリプレイ**: 過去のイベントを保存して、あとで再送します。
- **デッドレターキュー(DLQ)**: ターゲットへの配信に失敗したイベントを、SQS に残します。
- **クロスアカウント、クロスリージョン**: 別のアカウントやリージョンのイベントバスへ、イベントを送れます。

S3 イベント通知と EventBridge の使い分けです。S3 の通知は、設定が単純で、宛先が決まっています。EventBridge は、フィルターが細かく、宛先が多く、複数のターゲットへ送れます。

EventBridge が、イベントをルールで選んでターゲットへ送る流れを図にします。

```text
[Event source] AWS のサービス、自作アプリ、SaaS
  |
  v
[Event bus]
  |
  +-- rule --> [Target: Lambda] イベントパターンに一致したものを送る
  +-- rule --> [Target: SNS] 同じく、一致したものを送る
  +-- delivery failed --> [Dead-letter queue (SQS)] 配信に失敗したものを残す
```

### 2. アラームによる通知と動作

アラームの状態が変わると、次の動作を起こせます。

| 動作 | 内容 |
|---|---|
| SNS トピックへ通知 | メール、チャットへの通知、Lambda の起動など |
| EC2 アクション | 停止、終了、再起動、**復旧** |
| Auto Scaling の動作 | スケーリングポリシーを実行する |
| Systems Manager の動作 | OpsItem を作る、インシデントを作る(Incident Manager) |

**EC2 の自動復旧**: `StatusCheckFailed_System`(AWS 側の障害)のアラームに、復旧アクションを付けます。同じ ID、同じプライベート IP、同じ設定のまま、別のホストで起動します。インスタンス内の障害(`StatusCheckFailed_Instance`)には、再起動のアクションを付けます。

### 3. 各サービスのオートスケーリング

| 対象 | 仕組み |
|---|---|
| EC2 | EC2 Auto Scaling グループ |
| RDS | **ストレージの自動スケーリング**。空き容量が少なくなると、自動でストレージを増やす(増やすだけ。減らせない)。上限を決めておく |
| DynamoDB | プロビジョニングモードでは、Application Auto Scaling のターゲット追跡で、読み取りと書き込みの容量を調整する。予測できない負荷には、オンデマンドモードもある |
| ECS | サービスのオートスケーリング(タスク数)と、キャパシティプロバイダー(インスタンス数) |
| EKS | HPA(Pod)、Cluster Autoscaler や Karpenter(ノード) |
| Lambda | 自動(同時実行数の上限を設定できる) |
| Aurora | Aurora レプリカの自動スケーリング(読み取りの負荷に合わせてレプリカを増減する) |

Application Auto Scaling は、DynamoDB、ECS、Aurora などの共通の仕組みです。

### 4. ヘルスチェック

| サービス | 内容 |
|---|---|
| ALB のターゲットグループ | パス、ポート、間隔、正常と異常のしきい値(連続回数)を設定する。異常なターゲットには、リクエストを送らない |
| EC2 Auto Scaling | ヘルスチェックの種類が EC2(既定)か ELB か。ELB にすると、ALB が異常と判定したインスタンスも置き換える |
| **Route 53 のヘルスチェック** | エンドポイント(HTTP、HTTPS、TCP)、ほかのヘルスチェックの組み合わせ(計算されたヘルスチェック)、CloudWatch アラームの状態、のいずれかを監視する |

- Route 53 のヘルスチェックは、プライベートなリソース(VPC の中)を直接は見られません。その場合は、CloudWatch アラームで状態を見る、ヘルスチェックを使います。
- ヘルスチェックの設定を、アプリが実際に使えるかを見られる深さ(データベースにつながるか、など)にします。ただし、深くしすぎると、下流の障害で全部のターゲットが外れることがあります。

### 5. エージェントの導入と管理

- **SSM エージェント**: Systems Manager が、インスタンスを管理するために必要です。多くの AMI(Amazon Linux など)に、最初から入っています。インスタンスの IAM ロールに、`AmazonSSMManagedInstanceCore` を付けます。
- **CloudWatch エージェント**: 4.1 のとおりです。
- 多数のインスタンスへの導入と更新は、Systems Manager の次の機能で自動化します。
  - **Run Command**: 指定したインスタンスで、コマンドを実行します。
  - **State Manager**: 状態(エージェントが入っている、など)を保つように、定期的に適用します。
  - **Distributor**: パッケージを配ります。
  - **Patch Manager**: パッチの適用を自動にします。

### 6. Config ルールによる自動修復

AWS Config のルールが「非準拠」と判定したときに、**Systems Manager Automation のドキュメント**(ランブック)を実行して、自動で直せます。

- 修復のアクションは、ルールに設定します。自動か手動かを選べます。
- 例: パブリックに読み取れる S3 バケットを、`AWS-DisableS3BucketPublicReadWrite` で、自動で非公開にする。
- 修復の実行に使う IAM ロールを、指定します。
- 非準拠のイベントを EventBridge で受けて、通知や別の処理につなげる方法もあります。

### まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| S3 にログが届いたら Lambda で処理 | S3 イベント通知(または EventBridge) |
| 特定のイベントだけ、複数の宛先へ送る | EventBridge のルール |
| EC2 のホストの障害から自動で復旧 | `StatusCheckFailed_System` のアラーム + 復旧アクション |
| アラームの通知を、メールとチャットへ | アラーム + SNS トピック |
| RDS の空き容量の不足を自動で防ぐ | ストレージの自動スケーリング(上限を設定) |
| DynamoDB の容量を負荷に合わせる | Application Auto Scaling(またはオンデマンドモード) |
| 異常なインスタンスを、アプリの応答で判定して置き換える | ターゲットグループのヘルスチェック + ASG のヘルスチェックを ELB に |
| VPC の中の、プライベートなものを Route 53 で監視 | CloudWatch アラームを見る Route 53 のヘルスチェック |
| 多数のインスタンスにエージェントを配る | Systems Manager(Run Command、State Manager) |
| 非準拠のリソースを自動で直す | Config ルールの自動修復(Systems Manager Automation) |

## 出典

- 試験ガイドの分野 4: https://docs.aws.amazon.com/aws-certification/latest/devops-engineer-professional-02/devops-engineer-professional-02-domain4.html
- CloudWatch の指標: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html
- CloudWatch エージェント: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Install-CloudWatch-Agent.html
- CloudWatch Logs のサブスクリプションフィルター: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Subscriptions.html
- CloudWatch Logs の KMS による暗号化: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/encrypt-log-data-kms.html
- CloudWatch アラーム(異常検知を含む): https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html
- CloudWatch メトリクスストリーム: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Metric-Streams.html
- AWS X-Ray: https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html
- Amazon Inspector: https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html
- AWS Config の修復: https://docs.aws.amazon.com/config/latest/developerguide/remediation.html
- AWS CloudTrail のイベント: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-concepts.html
- Amazon EventBridge のイベントパターン: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html
- RDS のストレージの自動スケーリング: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIOPS.StorageTypes.html#USER_PIOPS.Autoscaling
