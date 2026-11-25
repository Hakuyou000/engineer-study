# AWS DOP 5.0 インシデントとイベントへの対応(14%)

対象: DOP-C02

「イベントを受け取って動かす(5.1)」「イベントを受けて構成を変える(5.2)」「失敗の原因を調べる(5.3)」の3つに分かれます。サービスの組み合わせを選ぶ問題が中心です。

## 5.1 イベントの発生源を管理し、処理・通知・対応を行う

主に扱うサービス: Amazon EventBridge、AWS Health、AWS CloudTrail、Amazon SNS、Amazon SQS、Amazon Kinesis Data Streams、AWS Lambda、AWS Step Functions、ファンアウト、イベントストリーミング、キューイング。

### 1. イベントの発生源

| 発生源 | 何が起きるか | EventBridge での扱い |
|---|---|---|
| AWS のサービス | EC2 の状態変更、CodePipeline の失敗、Auto Scaling の起動など | `source` が `aws.ec2` のように入ったイベントが、既定のイベントバスに届く |
| AWS CloudTrail(API の操作を記録するサービス) | 管理イベントの API 呼び出し | `detail-type` が `AWS API Call via CloudTrail` のイベントになる。ルールで API 名を指定して検知できる |
| AWS Health(AWS 側の障害や、自分のアカウントに影響する変更を知らせるサービス) | 計画メンテナンス、サービス障害、漏えいしたアクセスキーの通知など | `source` が `aws.health` のイベントとして届く |
| アプリケーション | 自作のアプリが `PutEvents` で送る | カスタムイベントバスに送る |
| スケジュール | 定期実行(cron、rate) | EventBridge Scheduler、またはスケジュールルール |

Amazon EventBridge(イベントをルールで振り分けて、ターゲットに届けるサービス)の基本です。

- **イベントバス**: イベントの受け口です。既定のバス、カスタムバス、パートナーバスがあります。
- **ルール**: イベントパターン(JSON)に一致したイベントを、ターゲットに送ります。1 つのルールに複数のターゲットを付けられます。
- **ターゲット**: Lambda、SNS、SQS、Step Functions、Kinesis、Systems Manager の Run Command や Automation など。
- **クロスアカウント、クロスリージョン**: 送り先のイベントバスのリソースポリシーで、送り元を許可します。送り元のルールのターゲットに、相手のバスを指定します。
- **アーカイブとリプレイ**: 過去のイベントを保存し、あとで再送できます。ルールを直した後の検証に使います。
- **デッドレターキュー(DLQ)**: ターゲットに届けられなかったイベントを SQS に残せます。

AWS Health の注意点です。

- アカウント単位のイベントを EventBridge で受け取れます。
- 組織の全アカウントのイベントをまとめて見るには、AWS Health の **組織ビュー** を有効にします。委任管理者のアカウントを使えます。
- アクセスキーの漏えいは、`eventTypeCode` が `AWS_RISK_CREDENTIALS_EXPOSED` の Health イベントとして届きます。EventBridge で受けて、キーの無効化を自動化できます。

### 2. イベント駆動のパターン

| パターン | 使うサービス | 特徴 |
|---|---|---|
| ファンアウト | SNS → 複数の SQS、Lambda | 1 つのメッセージを、複数の購読者に同時に配る。購読者ごとに SQS を挟むと、遅い購読者がほかを妨げない |
| キューイング | SQS | 受け手が処理できる速さで取り出す。負荷を平らにする。標準キューは順序の保証が弱く、FIFO キューは順序を守る |
| ストリーミング | Kinesis Data Streams | 順序をシャード単位で守る。複数の読み手が同じデータを読める。一定期間は再読込できる |
| ワークフロー | Step Functions | 複数のステップの順序、分岐、再試行、エラー処理を定義する |

SQS と Lambda の組み合わせです。

- 処理に失敗したメッセージは、キューに戻って再試行されます。何度も失敗するものは、**デッドレターキュー** に移します(`maxReceiveCount` で回数を決めます)。
- バッチの一部だけが失敗したときは、イベントソースマッピングで **部分バッチ応答**(`ReportBatchItemFailures`)を有効にします。失敗したメッセージだけを戻せます。成功した分まで再処理されるのを防げます。
- DLQ のメッセージは、原因を直したあと **DLQ のリドライブ** で元のキューに戻せます。

SQS と Lambda の組み合わせで、失敗したメッセージが進む流れを図にします。

```text
[SQS queue] --> [Lambda]
   ^               |
   |               +-- success --> メッセージを削除する
   |               |
   +---------------+-- failure --> キューに戻って再試行される
   |
   +-- over maxReceiveCount --> [Dead-letter queue]
                                        |
                                        |  原因を直したあと、リドライブ
                                        v
                                    [Original queue] 元のキューへ戻す
```
- 可視性タイムアウトは、Lambda の関数のタイムアウトより長くします。

Lambda の非同期呼び出し(EventBridge や SNS からの呼び出し)です。

- 関数のエラーで失敗すると、既定で、あと 2 回まで再試行されます。
- 失敗したイベントの送り先は、**OnFailure の送り先**(Destinations)か DLQ で指定します。
- OnFailure の送り先には、SQS、SNS、EventBridge、Lambda、S3 を指定できます。
- DLQ に指定できるのは、SQS か SNS だけです。
- Destinations のほうが新しい方法で、エラーの情報も一緒に届きます。

Step Functions です。

- **Standard ワークフロー**: 最長 1 年まで実行できます。実行履歴を残します。人の承認を待つ、長時間の処理に向きます。
- **Express ワークフロー**: 短時間(最長 5 分)で、大量の実行向きです。
- `Retry` で再試行、`Catch` でエラー時の遷移先を決められます。
- 人の承認を待つときは、タスクトークンを使うコールバックパターンにします。

### 3. 運用の通知

- CloudWatch アラームの通知先は、SNS が基本です。
- 運用のチームには、AWS Chatbot(Amazon Q Developer in chat applications)で、Slack や Microsoft Teams に通知できます。
- AWS Systems Manager Incident Manager(インシデントの対応を管理するサービス)は、新しい利用者の受け付けを止めています。すでに有効にしているアカウントでは、引き続き使えます。新しく作る場合は、OpsCenter などへの移行の方法が公式に示されています。

### 4. まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| 「EC2 が停止したら」「パイプラインが失敗したら」に反応 | EventBridge のルール |
| 特定の API 呼び出し(例: セキュリティグループの変更)を検知して動かす | EventBridge + CloudTrail の管理イベント |
| 他のアカウントのイベントを 1 か所に集める | 送り先バスのリソースポリシー |
| 組織全体の Health イベントを見る | AWS Health の組織ビュー |
| 1 つのイベントを複数のシステムに配る | SNS + SQS のファンアウト |
| 受け手の速さに合わせて処理 | SQS |
| 順序を守って、複数の読み手が読む | Kinesis Data Streams |
| 失敗したメッセージを隔離して後で調べる | DLQ(SQS)、Lambda の OnFailure |
| バッチのうち失敗した分だけ再処理 | 部分バッチ応答 |
| 順序、分岐、再試行がある処理 | Step Functions |
| 過去のイベントで検証 | EventBridge のアーカイブとリプレイ |

## 5.2 イベントに応じて構成を変更する

主に扱うサービス: AWS Systems Manager(Run Command、Automation、State Manager、Patch Manager、Maintenance Windows、Session Manager、Parameter Store)、AWS Auto Scaling とライフサイクルフック、AWS Config とルール、自動修復。

### 1. AWS Systems Manager

AWS Systems Manager(多数のサーバーを、まとめて管理・操作するサービス)は、管理対象のインスタンスに SSM エージェントを入れて使います。インスタンスに `AmazonSSMManagedInstanceCore` のポリシーを付けた IAM ロールが必要です。

| 機能 | 役割 |
|---|---|
| Run Command | 対象のインスタンスに、コマンドやスクリプトを一斉に実行する。SSH は不要 |
| Automation | 複数のステップの手順(Runbook)を自動で実行する。AWS リソースの操作(AMI 作成、インスタンス停止など)もできる |
| State Manager | 「この状態であり続ける」を維持する。関連付け(Association)をスケジュールで繰り返し適用する |
| Patch Manager | パッチのベースラインに沿って、パッチの検査と適用を行う |
| Maintenance Windows | 作業してよい時間帯を決める |
| Session Manager | SSH のポートを開けずに、シェルに入る。操作の記録を S3 や CloudWatch Logs に残せる |
| Parameter Store | 設定値と秘密情報(SecureString)を保存する |
| OpsCenter | 運用上の問題を OpsItem として集めて、調査と対応を管理する |

選び方の目安です。

- 「対象を絞って、今すぐ 1 回だけコマンドを実行」は Run Command です。
- 「手順が複数あり、承認や分岐がある」「AWS リソースを操作する」は Automation です。
- 「設定のずれを、継続的に元に戻す」は State Manager です。
- 対象の指定は、タグ、リソースグループ、インスタンス ID で行えます。
- 実行の速さは、**同時実行数** と **エラーのしきい値** で制御します。エラーが一定数を超えたら止められます。

### 2. AWS Config と自動修復

AWS Config(リソースの設定を記録して、ルールで評価するサービス)の流れです。

1. 設定の変更を記録します。
2. **Config ルール**(マネージドルールまたは Lambda などで作るカスタムルール)で、準拠か非準拠かを評価します。
3. 非準拠のとき、**修復アクション** を実行します。実体は **Systems Manager Automation のドキュメント** です。

- 修復は、手動と自動を選べます。自動修復では、再試行の回数と間隔を決められます。
- 修復には、Automation が使う IAM ロール(`AutomationAssumeRole`)が必要です。
- 例: ルール `s3-bucket-public-read-prohibited` に、ドキュメント `AWS-DisableS3BucketPublicReadWrite` を結び付けると、公開されたバケットを自動で閉じられます。
- 複数のルールと修復をまとめて、アカウントや組織に配るには **適合パック(Conformance Pack)** を使います。
- 複数のアカウントとリージョンの結果を 1 か所で見るには、**アグリゲーター** を使います。

Config を使わず EventBridge で作る方法もあります。

- 「API の呼び出し」や「状態の変化」をイベントで受けて、Lambda や Automation を動かします。
- 「設定が基準に合っているか」を継続的に評価したいときは Config、「この出来事に反応したい」ときは EventBridge、と使い分けます。

Config が、非準拠のリソースを自動で修復する流れを図にします。

```text
[Resource] リソースの設定が変わる
  |
  v
[AWS Config] 設定を記録する
  |
  v
[Config rule] 準拠か非準拠かを評価する
  |
  +-- compliant --> 何もしない
  |
  +-- non-compliant --> [Remediation] Systems Manager Automation のドキュメントを実行
                   |
                   v
                 リソースが直る
```

### 3. Auto Scaling とライフサイクルフック

Amazon EC2 Auto Scaling(インスタンスの台数を自動で増減するサービス)の **ライフサイクルフック** は、起動や終了の途中で、インスタンスを待機状態にします。

| 状態 | タイミング | 使い方の例 |
|---|---|---|
| `Pending:Wait` | 起動中、サービスに入る前 | 設定の取得、エージェントのインストール、準備ができるまで待つ |
| `Terminating:Wait` | 終了の前 | ログを S3 に退避する、ロードバランサーから外れるまで待つ |

- 待機中に、EventBridge でイベントを受け、Lambda や SSM Automation が処理します。
- 処理が終わったら、`complete-lifecycle-action` を呼んで、`CONTINUE` か `ABANDON` を返します。
- 待機の既定の時間は 1 時間です。処理が長いときは、ハートビートを記録して延ばします。
- **ウォームプール**: 準備済みのインスタンスをあらかじめ待機させて、スケールアウトを速くします。
- **インスタンスのリフレッシュ**: 起動テンプレートを変えたあと、インスタンスを順番に入れ替えます。最小の正常率を指定して、ローリングで行います。

Auto Scaling のライフサイクルフックで、インスタンスの状態が移り変わる流れを図にします。

```text
Launch
  Pending --> Pending:Wait --> Pending:Proceed --> InService
                  |
                  +-- 待機中に Lambda や SSM Automation が処理する
                      complete-lifecycle-action で CONTINUE か ABANDON を返す

Terminate
  Terminating --> Terminating:Wait --> Terminating:Proceed --> Terminated
```

### 4. CloudFormation を使った構成の変更

- 構成を変えるときは、変更セットで影響を確認してから実行します。
- **ドリフト検出** で、手作業で変えられたリソースを見つけます。
- 複数のアカウントとリージョンには、StackSets で配ります。

### 5. まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| 多数の EC2 に、SSH なしで同じコマンドを実行 | Systems Manager Run Command |
| 手順が複数ある運用作業を自動化(承認も入る) | Systems Manager Automation |
| 設定のずれを継続的に元へ戻す | State Manager の関連付け |
| パッチを決めた時間帯に適用 | Patch Manager + Maintenance Windows |
| SSH のポートを開けずにサーバーに入る | Session Manager |
| 非準拠のリソースを自動で直す | Config ルール + 自動修復(SSM Automation) |
| 同じルールを組織全体に配る | Config 適合パック |
| 起動したインスタンスの準備が終わってから、サービスに入れる | ライフサイクルフック(`Pending:Wait`) |
| 終了前にログを退避 | ライフサイクルフック(`Terminating:Wait`) |
| スケールアウトを速くする | ウォームプール |
| AMI を更新して、インスタンスを順に入れ替える | インスタンスのリフレッシュ |

## 5.3 システムとアプリケーションの障害を調査する

主に扱うサービス: Amazon CloudWatch(メトリクス、ログ、Logs Insights、Synthetics)、AWS X-Ray、AWS Health、Systems Manager OpsCenter、失敗したデプロイの分析(CodePipeline、CodeBuild、CodeDeploy、CloudFormation)、Auto Scaling、Amazon ECS、Amazon EKS の障害の分析、根本原因の分析。

### 1. 調べるときの道具

| 道具 | 見えるもの |
|---|---|
| CloudWatch メトリクス | CPU、エラー数、遅延などの数値の推移 |
| CloudWatch Logs と Logs Insights | ログ。Logs Insights は、クエリで集計や絞り込みができる |
| AWS X-Ray(リクエストの流れを追跡するサービス) | 1 つのリクエストが通ったサービスと、各区間の時間。サービスマップで、遅い区間やエラーの出ている区間が分かる |
| CloudWatch Synthetics(画面や API を定期的に試す監視) | 利用者から見た死活。カナリアのスクリプトで、手順を再現する |
| CloudTrail | 「誰がいつ何を変えたか」。変更が原因の障害を調べる |
| AWS Config | リソースの設定の履歴。「いつ設定が変わったか」 |
| AWS Health | AWS 側の障害や、メンテナンスの予定 |
| OpsCenter | 問題を OpsItem にまとめ、関連するリソース、アラーム、Runbook を結び付ける |

調べる順番の基本です。

1. 影響の範囲と、始まった時刻を決めます。
2. その時刻の前後の変更(デプロイ、設定変更)を、CloudTrail と Config で探します。
3. AWS 側の障害でないかを、AWS Health で確かめます。
4. メトリクスとログで、どのコンポーネントかを絞ります。
5. X-Ray のトレースで、区間ごとの時間とエラーを見ます。

### 2. デプロイの失敗

| サービス | 見る場所 |
|---|---|
| AWS CodePipeline | 失敗したステージとアクション。アクションの詳細のリンクから、呼び出したサービスの画面へ移る |
| AWS CodeBuild | ビルドのログ(CloudWatch Logs)、フェーズごとの結果。`buildspec.yml` の記述、IAM の権限、VPC 内のときはネットワークを確かめる |
| AWS CodeDeploy | デプロイの詳細で、失敗したライフサイクルイベント(例: `ApplicationStart`)と、そのスクリプトの出力。EC2 のときは、エージェントのログ(`codedeploy-agent` のログ)も見る |
| AWS CloudFormation | スタックイベントの、最初に `FAILED` になったリソースの理由 |

CloudFormation の失敗の読み方です。

- 失敗したら、既定ではロールバックします。理由は、スタックイベントの、**時刻が最も早い失敗** にあります。後ろのイベントは、巻き込まれた結果です。
- `UPDATE_ROLLBACK_FAILED` になったら、原因を直してから、ロールバックを続行します。直せないリソースは、スキップして続行できます。
- 作成の失敗の調査のために、リソースを残したいときは、ロールバックを無効にします。

CodePipeline と CodeBuild の失敗の調べ方です。

- パイプラインの画面には、失敗したステージとアクションが出ます。詳しい原因は、アクションの詳細から、呼び出したサービス(CodeBuild など)の画面へ移って調べます。
- CodeBuild のビルドの詳細に、フェーズごとの結果が出ます。失敗したフェーズを見つけて、そのログ(CloudWatch Logs)を読みます。
- CodePipeline の CodeCommit のソースアクションで、出力アーティファクトの形式を「完全クローン」にしたときは、CodeBuild のサービスロールに `codecommit:GitPull` が要ります。既定の形式では、ソースアクションが作った ZIP を S3 から受け取るので、要りません。
- CodePipeline のサービスロールの権限不足は、アクションのエラーの文言に出ます。権限を直したあと、失敗したステージを再試行するか、パイプラインを手動で実行し直します。

CodeDeploy のポイントです。

- アラームを関連付けると、デプロイ中のアラームで、自動でロールバックできます。
- EC2 では、AppSpec の `hooks` に書いたスクリプトの失敗が、よくある原因です。

### 3. 実行基盤の失敗

**Auto Scaling**

- **スケーリングのアクティビティ履歴** に、起動や終了の失敗の理由が出ます。
- 暗号化した EBS を使うときに、起動が失敗する例があります。Auto Scaling のサービスリンクロールに、KMS キーの使用を許可していないと、起動できません。キーポリシーを直します。
- ELB のヘルスチェックを Auto Scaling に使うと、ロードバランサーで異常と判定されたインスタンスも、置き換えられます。EC2 のヘルスチェックだけでは、アプリの異常に気づけません。
- 起動と終了を繰り返すときは、ヘルスチェックの猶予期間が短すぎないか確かめます。

**Amazon ECS**

- サービスの **イベント** と、停止したタスクの **停止の理由** を見ます。
- インターネットへの経路がないサブネットで、Fargate が ECR からイメージを取得するには、`ecr.api` と `ecr.dkr` のインターフェースエンドポイント、S3 のゲートウェイエンドポイントが要ります。イメージのレイヤーが S3 にあるためです。`awslogs` でログを出すときは、`logs` のエンドポイントも要ります。
- よくある原因: イメージを取得できない(`CannotPullContainerError`。ECR の権限、NAT やエンドポイントがない)、必須コンテナの終了、メモリ不足、配置できるだけの CPU やメモリがない。
- タスク実行ロール(イメージの取得やログの出力に使う)と、タスクロール(アプリが AWS を呼ぶのに使う)を区別します。
- Container Insights で、タスクごとの CPU とメモリを見ます。

**Amazon EKS**

- ポッドの状態は `kubectl describe pod` と `kubectl logs` で見ます。
- `Pending` は、ノードのリソースが足りない、ノードの Pod 数の上限(max-pods)に達している、ノードが `Ready` でない、taint や nodeSelector が合わない、などでスケジュールできない状態です。`kubectl describe pod` の Events に理由が出ます。
- サブネットの空き IP が足りないと、Pod は `ContainerCreating` のまま止まります。Events に `failed to assign an IP address to container` が出ます。
- `CrashLoopBackOff` は、コンテナが起動しても、すぐ終了することを繰り返す状態です。`kubectl logs <pod> --previous` で直前のログを、`kubectl describe pod` で終了コードと理由(`OOMKilled` など)を見ます。
- ノードが `NotReady` のときは、CPU、メモリ、ディスクの逼迫と、ネットワークプラグイン(`aws-node`)の状態を確かめます。
- ノードがクラスターに参加しない原因は、IAM ロール、セキュリティグループ、サブネットの経路が多いです。特に、ノードの IAM ロールが、アクセスエントリか `aws-auth` ConfigMap で、クラスターに対応付けられているかを確かめます。指定するのは、インスタンスプロファイルの ARN ではなく、ロールの ARN です。
- `kubectl` が `Unauthorized` になるときは、使っている IAM の主体が、アクセスエントリか `aws-auth` ConfigMap に対応付けられているかを確かめます。
- コントロールプレーンのログ(API サーバー、監査など)は、有効にすると CloudWatch Logs に出ます。

**Lambda**

- スロットリングは `Throttles`、失敗は `Errors` のメトリクスで見ます。
- 関数のログは CloudWatch Logs に出ます。実行ロールに、ログの書き込み権限が必要です。

### 4. まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| どの区間で遅いか、どこでエラーが出ているか | X-Ray のサービスマップとトレース |
| ログを条件で絞って集計 | CloudWatch Logs Insights |
| 利用者の目線で、ログインの手順を定期的に確認 | CloudWatch Synthetics(カナリア) |
| 「誰がいつ変更したか」 | CloudTrail |
| 「設定がいつ変わったか」 | AWS Config の履歴 |
| AWS 側の障害の影響を確認 | AWS Health |
| 問題と関連情報を 1 か所で管理 | OpsCenter |
| CloudFormation の失敗の原因 | 最初に FAILED になったスタックイベント |
| CodeDeploy の失敗の原因 | 失敗したライフサイクルイベントとスクリプトの出力 |
| Auto Scaling の起動が失敗する | スケーリングのアクティビティ履歴 |
| ECS のタスクが起動しない | 停止の理由とサービスのイベント |

## 出典

- Amazon EventBridge: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html
- AWS Health と EventBridge: https://docs.aws.amazon.com/health/latest/ug/cloudwatch-events-health.html
- Lambda の非同期呼び出しの送り先: https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-retain-records.html
- Step Functions のワークフローの種類: https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html
- Incident Manager: https://docs.aws.amazon.com/incident-manager/latest/userguide/what-is-incident-manager.html
- CodePipeline のトラブルシューティング: https://docs.aws.amazon.com/codepipeline/latest/userguide/troubleshooting.html
- EKS のトラブルシューティング: https://docs.aws.amazon.com/eks/latest/userguide/troubleshooting.html
- AWS Config の修復: https://docs.aws.amazon.com/config/latest/developerguide/remediation.html
- Auto Scaling のライフサイクルフック: https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html
- 公式の試験ガイド(分野 5): https://docs.aws.amazon.com/aws-certification/latest/devops-engineer-professional-02/devops-engineer-professional-02-domain5.html
