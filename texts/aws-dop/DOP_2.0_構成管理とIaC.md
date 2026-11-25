# AWS DOP テキスト 2.0 構成管理と IaC(17%)

対象: DOP-C02

「インフラをコードで作る(2.1)」「たくさんのアカウントを自動で作って守る(2.2)」「大規模な環境の運用を自動化する(2.3)」の3つに分かれます。

## 2.1 システムのライフサイクル全体でプロビジョニングと管理を行うクラウドインフラと再利用可能な部品を定義する

出題範囲: IaC の選択肢(CloudFormation、AWS SAM、AWS CDK)、IaC の変更管理、CloudFormation の機能(変更セット、ドリフト検出、スタックポリシー、StackSets、ネストされたスタック、カスタムリソース、モジュール)、構成管理サービスの選び方(Systems Manager、AWS Config、AWS AppConfig、OpsWorks)、AWS Service Catalog による再利用可能なテンプレートの提供。

### 1. IaC の選択肢

| ツール | 書き方 | 位置づけ |
|---|---|---|
| AWS CloudFormation | YAML / JSON のテンプレート | AWS の IaC の基本。スタックという単位で作成、更新、削除する |
| AWS SAM(Serverless Application Model) | CloudFormation の拡張の書き方 | Lambda、API Gateway、DynamoDB などのサーバーレスを短く書く。最後は CloudFormation になる |
| AWS CDK(Cloud Development Kit) | TypeScript、Python などのプログラミング言語 | コードから CloudFormation のテンプレートを生成する(`cdk synth`) |
| Terraform | HCL | AWS 以外にも使えるサードパーティのツール(Terraform のテキストを参照) |

どれを使っても、AWS の中では CloudFormation が実際の作成を行います(Terraform を除く)。

### 2. CloudFormation の基本

**テンプレート**に、作りたいリソースを宣言的に書きます。**スタック**は、1つのテンプレートから作ったリソースの集まりです。

| セクション | 内容 |
|---|---|
| `Parameters` | 実行時に渡す値。SSM のパラメーターを参照する型もある |
| `Mappings` | リージョンごとの AMI など、固定の対応表 |
| `Conditions` | 条件。「本番のときだけ作る」など |
| `Resources` | **必須**。作るリソース |
| `Outputs` | 出力。他のスタックから参照(`Export`)できる |
| `Metadata` | 補足情報。`AWS::CloudFormation::Init` を書く |

よく使う組み込み関数です。

| 関数 | 内容 |
|---|---|
| `!Ref` | パラメーターの値、またはリソースの ID を返す |
| `!GetAtt` | リソースの属性(ARN、DNS 名など)を返す |
| `!Sub` | 文字列の中の `${…}` を置き換える |
| `!FindInMap` | Mappings から値を引く |
| `!ImportValue` | 他のスタックの Export の値を取り込む |
| `!If` | 条件で値を切り替える |

#### 更新の安全装置

| 機能 | 内容 |
|---|---|
| **変更セット** | 更新を実行する前に、何が変わるか(追加、変更、削除、**置換**の有無)を確認する。確認してから実行する |
| **スタックポリシー** | スタックの更新で、指定したリソース(本番のデータベースなど)を更新や置換から守る。JSON で書く |
| **終了保護** | スタックの削除を防ぐ |
| **`DeletionPolicy`** | スタックを削除したときのリソースの扱い。`Delete`(削除)、`Retain`(残す)、`Snapshot`(スナップショットを取って削除。RDS や EBS など) |
| **`UpdatePolicy`** | Auto Scaling グループなどの更新の方法(`AutoScalingRollingUpdate`、`AutoScalingReplacingUpdate`) |
| **ロールバックの設定** | 更新中にアラームが発火したら、自動でロールバックする(`RollbackConfiguration` に CloudWatch アラームを指定) |
| **サービスロール** | CloudFormation が使う IAM ロールを指定する。利用者の権限をスタックの操作に絞れる |

- リソースの更新には、「中断なし」「一部の中断」「**置換**(新しいリソースに入れ替わる)」があります。置換されるとデータが失われるリソース(RDS など)は、変更セットで必ず確認します。
- 更新に失敗すると、自動でロールバックします。ロールバックにも失敗すると `UPDATE_ROLLBACK_FAILED` になります。原因(手で消したリソースなど)を直してから、`ContinueUpdateRollback` を実行します。
- 作成の失敗を調べたいときは、ロールバックを無効にして、失敗したリソースを残します。

変更セットを使った、スタックの更新の流れを図にします。

```text
[Template] テンプレートを変更する
  |
  v
[Change set] 変更セットを作る(まだ何も変わらない)
  |
  v
[Review] 差分を確認する(追加、変更、削除、置換)
  |
  +-- NG --> 変更セットを捨てる
  |
  v
[Execute] 変更セットを実行する
  |
  +-- success --> UPDATE_COMPLETE
  |
  +-- failure --> UPDATE_ROLLBACK_COMPLETE(自動でロールバックする)
```

#### ドリフト検出

- **ドリフト**: スタックの外(コンソールなど)でリソースの設定が変えられ、テンプレートとずれた状態。
- ドリフト検出は、ずれを**見つけるだけ**で、直しません。直すには、テンプレートを更新するか、手で戻します。
- すでにあるリソースを、スタックの管理に取り込むには、**リソースのインポート**を使います(取り込むには `DeletionPolicy` が必要です)。

#### リソースの作成を待つ

| 仕組み | 内容 |
|---|---|
| `CreationPolicy` + `cfn-signal` | EC2 や Auto Scaling グループで、ソフトウェアの導入が終わったという合図(シグナル)を受け取るまで、作成の完了を待つ。タイムアウトで失敗にする |
| `cfn-init` | `AWS::CloudFormation::Init` のメタデータを読み、パッケージの導入やファイルの配置を行う。ユーザーデータのスクリプトより、宣言的で、冪等 |
| `cfn-hup` | メタデータの変更を検知して、`cfn-init` を再実行する |
| `WaitCondition` | 外部からの合図を待つ(`CreationPolicy` のほうが推奨) |

#### カスタムリソース

CloudFormation が対応していない処理を、Lambda 関数(または SNS)で実行する仕組みです。

- 作成、更新、削除のたびに Lambda が呼ばれます。
- Lambda は、処理が終わったら、渡された**署名付き URL に成功か失敗を返す**必要があります。返さないと、スタックはタイムアウト(既定で 1 時間)まで待ちます。削除のときに応答しないのが、よくある失敗の原因です。

### 3. 再利用の仕組み

| 仕組み | 内容 | 使う場面 |
|---|---|---|
| ネストされたスタック | スタックから別のスタックを部品として呼ぶ(`AWS::CloudFormation::Stack`)。親から子へ値を渡す | 大きなテンプレートを分ける。共通の部品(VPC など)を使い回す |
| クロススタック参照 | `Export` と `!ImportValue` | 別々の寿命のスタックの間で値を共有する。参照されている Export は削除や変更ができない |
| **モジュール** | レジストリに登録した、再利用できるリソースの定義の部品。バージョン管理ができる | 組織の標準の構成(暗号化済みの S3 など)を、各チームに配る |
| マクロ(トランスフォーム) | Lambda でテンプレートを処理して変換する。`AWS::Serverless`(SAM)も、トランスフォームの 1 つ | テンプレートの記述を短くする |
| **Hooks** | リソースの作成や更新の前に、ルールを検証して、違反なら止める | 組織の標準の強制(暗号化していない S3 を作らせない) |
| 動的参照 | `{{resolve:ssm:…}}`、`{{resolve:secretsmanager:…}}` で、テンプレートに値を書かずに実行時に取得する | パスワードや AMI の ID を、テンプレートに埋め込まない |

- パスワードの生成は、`AWS::SecretsManager::Secret` の `GenerateSecretString` で自動で作り、動的参照で RDS に渡します。テンプレートにパスワードを書かないためです。
- テンプレートの検査は、`cfn-lint`(文法やベストプラクティス)と、CloudFormation Guard(ポリシーのルールをコードで検査)を、パイプラインの中で使います。

ネストされたスタックと、クロススタック参照の違いを図にします。

```text
Nested stacks (親が子を部品として呼ぶ)
  [Parent stack]
    +-- [Child stack: VPC]
    +-- [Child stack: App]

Cross-stack reference (別々のスタックが値を受け渡す)
  [Network stack] Outputs の Export
        |
        |  !ImportValue
        v
  [App stack]
```

### 4. StackSets(複数のアカウントとリージョンへ展開)

**CloudFormation StackSets**は、1つのテンプレートを、複数のアカウントとリージョンへ、まとめて展開します。

| 項目 | セルフマネージド権限 | サービスマネージド権限 |
|---|---|---|
| 前提 | 管理者アカウントと、ターゲットのアカウントに、IAM ロールを自分で作る | AWS Organizations と連携する(信頼されたアクセスを有効にする) |
| ターゲットの指定 | アカウントの ID | 組織または OU |
| 新しいアカウントへの展開 | 手動 | **自動デプロイ**を有効にすると、OU に参加した新しいアカウントに自動で展開される |
| 使う場面 | Organizations を使わない | Organizations を使っている(推奨) |

- 展開の動きは、「最大同時実行アカウント数」「失敗の許容数」「リージョンの実行順」で調整します。
- スタックセットの更新は、全スタックインスタンスに反映されます。
- 自動デプロイでは、アカウントが OU から外れたときに、スタックを削除するか残すか(`RetainStacksOnAccountRemoval`)を選べます。自動デプロイの設定は、スタックセットごとに行います。
- 組織のメンバーアカウントから StackSets を運用するには、委任された管理者を登録します。

StackSets が、1 つのテンプレートを複数のアカウントとリージョンへ展開する様子を図にします。

```text
[StackSet] 管理者アカウントのスタックセット(テンプレート 1 つ)
  |
  +--> [Account A / Region 1] スタックインスタンス
  +--> [Account A / Region 2] スタックインスタンス
  +--> [Account B / Region 1] スタックインスタンス
  +--> [Account B / Region 2] スタックインスタンス
```

### 5. AWS SAM と AWS CDK

| 項目 | SAM | CDK |
|---|---|---|
| 主なコマンド | `sam build`、`sam deploy`、`sam local invoke`、`sam sync` | `cdk synth`、`cdk diff`、`cdk deploy`、`cdk bootstrap` |
| 書き方 | `Transform: AWS::Serverless-2016-10-31` を宣言し、`AWS::Serverless::Function` などを書く | プログラミング言語で、クラス(コンストラクト)を組み立てる |
| 得意な場面 | Lambda を中心にした構成。`DeploymentPreference` で段階的なデプロイ | ループや条件分岐、関数による再利用。大きな構成 |

- CDK のコンストラクトには 3 段階あります。L1(CloudFormation のリソースそのもの。`Cfn…`)、L2(既定値を持つ使いやすい形)、L3(複数のリソースを組み合わせたパターン)。
- **`cdk bootstrap`**: CDK がアセット(Lambda のコードなど)を置く S3 バケット、ECR、IAM ロールを、環境(アカウントとリージョン)ごとに事前に作ります。初回のデプロイの前に 1 回必要です。
- CDK Pipelines は、CDK で書いた、パイプラインを自分で更新するパイプラインです。

### 6. 構成管理のサービスの選び方

| サービス | 役割 | 使う場面 |
|---|---|---|
| AWS Systems Manager | サーバーの管理(Run Command、State Manager、Patch Manager、Inventory など) | EC2 とオンプレミスの設定、パッチ、コマンドの実行 |
| AWS Config | リソースの設定の記録と、ルールでの評価 | 設定の変更の履歴、ルール違反の検出と自動修復 |
| **AWS AppConfig** | アプリケーションの設定と**機能フラグ**を、検証して、段階的に配る(Systems Manager の機能) | コードをデプロイせずに設定を変える。問題があればアラームで自動で戻す |
| Parameter Store | 設定値と秘密の値の保存(階層、バージョン、暗号化) | 単純な設定値の保管。段階的な配布や検証はできない |
| AWS OpsWorks | Chef と Puppet による構成管理 | **OpsWorks Stacks は 2024-05-26 にサービスが終了**しました。公式の移行先は Systems Manager です。試験ガイドには残っていますが、新しい構成では選ばない |

- **AppConfig** の配布の方式は、「線形」「指数」「一度に全部」から選びます。**ベイク時間**(配布のあと、問題がないか監視する時間)に、CloudWatch アラームが発火したら、自動でロールバックします。**バリデーター**(JSON スキーマか Lambda)で、配る前に値の形を検証します。
- Config と CloudTrail の違い: Config は「リソースの設定が**どうなっているか、どう変わったか**」、CloudTrail は「**誰が、どの API を呼んだか**」を記録します。

### 7. AWS Service Catalog

**AWS Service Catalog**は、組織が承認した IaC のテンプレートを「製品」として、利用者にセルフサービスで提供するサービスです。

| 用語 | 意味 |
|---|---|
| 製品 | CloudFormation(または Terraform)のテンプレート。バージョンを持つ |
| ポートフォリオ | 製品の集まり。利用者(IAM のユーザー、グループ、ロール)に許可を与える。他のアカウントや組織と共有できる |
| 制約 | 製品の使い方の制限 |

制約の種類です。

| 制約 | 内容 |
|---|---|
| **起動制約** | 製品の作成に使う IAM ロールを指定する。利用者本人には、リソースを作る広い権限を与えなくてよい |
| テンプレート制約 | パラメーターで選べる値を絞る(インスタンスタイプを小さいものに限る、など) |
| 通知制約 | スタックのイベントを SNS に通知する |
| StackSet 制約 | 製品を複数のアカウントやリージョンに展開する |

- 「開発者に、承認された構成だけを、自分で作らせたい。ただし、リソースを作る広い権限は渡したくない」は、Service Catalog の起動制約の典型の場面です。

### 8. まとめ: よく出る判断

| 場面 | 選ぶもの |
|---|---|
| 更新で何が変わるかを先に確認 | 変更セット |
| データベースを更新や削除から守る | スタックポリシー、`DeletionPolicy`(`Retain` か `Snapshot`)、終了保護 |
| コンソールでの手作業の変更を見つける | ドリフト検出(検出だけで、直さない) |
| すでにあるリソースをスタックに取り込む | リソースのインポート |
| CloudFormation が対応していない処理 | Lambda のカスタムリソース(署名付き URL に応答を返す) |
| インスタンスの設定が終わるまで、作成の完了を待つ | `CreationPolicy` と `cfn-signal` |
| 複数のアカウントとリージョンに展開、新しいアカウントにも自動で | StackSets のサービスマネージド権限と自動デプロイ |
| 組織の標準のリソース定義を、各チームに配る | CloudFormation のモジュール、Service Catalog |
| 標準に反するリソースを、作る前に止める | CloudFormation Hooks |
| パスワードをテンプレートに書かない | 動的参照(Secrets Manager、Parameter Store) |
| Lambda の構成を、段階的にデプロイ | SAM の `DeploymentPreference` |
| アプリの設定を、コードを変えずに段階的に配る | AppConfig |
| 開発者に承認済みの構成だけを作らせる | Service Catalog(起動制約) |

## 2.2 マルチアカウント・マルチリージョン環境で、アカウントの作成、受け入れ、保護を自動化する

出題範囲: AWS アカウントの構造とベストプラクティス、AWS Organizations、AWS Control Tower、SCP、ロールの引き受けによるアカウント間のアクセス、ガバナンスとセキュリティのコントロールを大規模に実装する(AWS Config、Control Tower、AWS Security Hub、Amazon Detective、Amazon GuardDuty、Service Catalog、SCP)。

### 1. なぜアカウントを分けるか

| 目的 | 内容 |
|---|---|
| 影響範囲の分離 | 1つのアカウントでの事故や侵害が、他に広がらない |
| 権限の分離 | 本番と開発で、権限を完全に分ける |
| 請求の分離 | チームやプロジェクトごとの費用が分かる |
| 上限の分離 | サービスの上限(クォータ)はアカウントごと |
| コンプライアンス | 監査のログを、別の専用のアカウントに置いて守る |

### 2. AWS Organizations

| 要素 | 内容 |
|---|---|
| 管理アカウント | 組織を作ったアカウント。請求を一括で払う。ワークロードは置かない |
| メンバーアカウント | 組織に所属するアカウント |
| OU(組織単位) | アカウントのグループ。入れ子にできる。SCP や StackSets の対象にする |
| **SCP** | アカウントや OU が使える権限の**上限**。権限を与えるものではない |
| 信頼されたアクセス | 他の AWS サービス(StackSets、Config、Security Hub など)が、組織全体で動くのを許可する |
| 委任された管理者 | 管理アカウントの代わりに、メンバーアカウントがサービスを組織全体で管理する |

SCP の性質です。

- メンバーアカウントの**すべてのユーザーとロール(ルートユーザーも)**に効きます。
- **管理アカウントには効きません**。
- サービスにリンクされたロールには効きません。
- 許可(`Allow`)だけでは権限を与えません。IAM ポリシーでの許可も必要です。
- 「このリージョン以外を使わせない」は、`aws:RequestedRegion` 条件キーを使った `Deny` の SCP で書きます。IAM などのグローバルサービスは、`NotAction` で例外にします。

Organizations の階層と、SCP が効く範囲を図にします。

```text
[Root]
  +-- [Management account] 管理アカウント(SCP は効かない)
  +-- [OU: Prod] 本番の OU(SCP を付ける)
  |     +-- [Member account]
  |     +-- [Member account]
  +-- [OU: Dev] 開発の OU(SCP を付ける)
        +-- [OU: Team A] 入れ子の OU(上の OU の SCP も効く)
              +-- [Member account]
```

SCP は権限の上限です。権限を与えるのは IAM ポリシーです。

アカウントの作成は、`CreateAccount` API や、コンソール、Control Tower の Account Factory で自動化できます。作ったアカウントには、既定で `OrganizationAccountAccessRole` という IAM ロールが作られ、管理アカウントからロールを引き受けて操作できます。

### 3. AWS Control Tower

**AWS Control Tower**は、Organizations をベースに、ベストプラクティスに沿った複数アカウントの環境(**ランディングゾーン**)を、自動で構築して管理するサービスです。

| 要素 | 内容 |
|---|---|
| ランディングゾーン | 組織、OU、共有のアカウント(Log Archive と Audit)、IAM Identity Center、コントロールをまとめた土台 |
| Log Archive アカウント | CloudTrail と Config のログを集める |
| Audit アカウント | セキュリティと監査の読み取り専用のアクセス |
| **コントロール**(旧ガードレール) | ルール。予防的(SCP、RCP(リソースコントロールポリシー)、宣言型ポリシーで禁止する)、発見的(Config ルールで検出する)、プロアクティブ(CloudFormation Hooks で作成前に検査する) |
| **Account Factory** | 標準のアカウントを、セルフサービスで作る仕組み(Service Catalog の製品) |
| **Account Factory for Terraform(AFT)** | Terraform のパイプラインでアカウントを作る |
| **Customizations for Control Tower(CfCT)** | アカウントの作成時に、StackSets と SCP を自動で適用して、標準の設定を配る |
| 既存のアカウントの登録 | 既存のアカウントや OU を、Control Tower の管理下に登録(エンロール)できる |

- Control Tower の外から、管理している OU や SCP を変更すると、**ドリフト**が起きます。Control Tower の画面で、検出して修復します。
- 「新しいアカウントを、標準の設定(ログ、ネットワーク、セキュリティの設定)つきで自動で作る」は、Account Factory(または AFT)と CfCT です。
- ゼロから自分で作るより、Control Tower が運用の手間は少ない、というのが試験での方向です。

Control Tower のランディングゾーンの構成の例を図にします。OU の名前は例です。

```text
[Management account] Control Tower と Organizations を動かす
  |
  +-- [OU: Security]
  |     +-- [Log Archive account] CloudTrail と Config のログを集める
  |     +-- [Audit account] 監査用の読み取り専用のアクセス
  |
  +-- [OU: Workloads]
        +-- [Account] Account Factory で作ったアカウント。コントロールが効く
```

### 4. 大規模でのセキュリティとガバナンス

| サービス | 役割 | 組織全体での使い方 |
|---|---|---|
| AWS Config | 設定の記録とルールでの評価 | **組織のルール**と**コンフォーマンスパック**を、組織全体に展開する。**アグリゲーター**で、全アカウント、全リージョンの結果を 1 か所で見る |
| AWS Security Hub | セキュリティの検出結果を集約し、基準(CIS など)に沿った評価をする | 委任された管理者のアカウントで、全アカウントとリージョンを集約する。組織の新しいアカウントで自動で有効にする |
| Amazon GuardDuty | CloudTrail、VPC フローログ、DNS のログから、脅威を検出する | 委任された管理者で、全アカウントで自動で有効にする |
| Amazon Detective | 検出結果の原因を調べる(関係するリソースや時系列の分析) | GuardDuty などの結果の調査に使う。検出はしない |
| AWS Service Catalog | 承認済みの製品の提供 | ポートフォリオの共有 |
| SCP | 権限の上限 | OU に付ける |

### 5. アカウント間のアクセス

- 各アカウントに IAM ユーザーを作るのではなく、**IAM Identity Center**で一元的にサインインさせ、アカウントごとの権限セットを割り当てます。
- 自動化の処理は、**ロールを引き受けて**(`AssumeRole`)、別のアカウントにアクセスします。長期のアクセスキーは使いません。
- ロールの信頼ポリシーで、引き受けてよいアカウントを指定します。

### 6. まとめ: よく出る判断

| 場面 | 選ぶもの |
|---|---|
| 複数のアカウントの土台を、ベストプラクティスで自動で作る | Control Tower(ランディングゾーン) |
| 新しいアカウントを、標準の設定で自動で作る | Account Factory(Terraform なら AFT)、設定の配布は CfCT |
| 指定のリージョンしか使わせない | `aws:RequestedRegion` の `Deny` の SCP |
| 管理アカウントにも制限をかけたい | SCP は管理アカウントに効かないため、不可。管理アカウントにワークロードを置かない |
| 全アカウントの Config の結果を 1 か所で見る | Config のアグリゲーター |
| 全アカウントに同じ Config のルール群を展開 | 組織のコンフォーマンスパック |
| 全アカウントのセキュリティ検出結果を集約 | Security Hub(委任された管理者) |
| 全アカウントで脅威を検出 | GuardDuty(組織で自動で有効に) |
| 検出された脅威の原因を調べる | Detective |
| 新しいアカウントにも自動で同じスタックを展開 | StackSets のサービスマネージド権限と自動デプロイ |
| 管理アカウントの代わりにメンバーが管理 | 委任された管理者 |

## 2.3 複雑なタスクと大規模環境のための自動化ソリューションを設計して構築する

出題範囲: システムの在庫(インベントリ)、構成、パッチ管理の自動化(Systems Manager、AWS Config)、Lambda による複雑な自動化(AWS SDK、Step Functions)、アプリケーションのあるべき状態の維持(Systems Manager State Manager、OpsWorks)、ソフトウェアのコンプライアンスの維持。

### 1. AWS Systems Manager の機能

AWS Systems Manager は、EC2 とオンプレミスのサーバーを、大規模に運用するためのサービス群です。管理される側のサーバーを**マネージドノード**と呼びます。

マネージドノードにする条件です。

- **SSM エージェント**が動いている(Amazon Linux など、多くの AMI に最初から入っています)。
- インスタンスに、Systems Manager に必要な権限(`AmazonSSMManagedInstanceCore` のマネージドポリシーを付けた IAM ロール)がある。
- Systems Manager のエンドポイントに通信できる(インターネット、NAT、または VPC エンドポイント)。
- オンプレミスのサーバーは、**ハイブリッドアクティベーション**で登録します。

| 機能 | 内容 | 使う場面 |
|---|---|---|
| **Run Command** | 多数のノードに、コマンドを 1 回実行する。タグで対象を指定する。同時実行数とエラーのしきい値を設定できる。SSH は要らない | 一度だけの、全体への作業 |
| **State Manager** | 「このノードは、こうあるべき」という状態を**アソシエーション**で定義し、スケジュールで繰り返し適用する | 設定のずれを自動で直す。エージェントの導入と更新を保つ |
| **Patch Manager** | パッチの適用を自動化する | OS のパッチの管理 |
| **Inventory** | ノードのソフトウェア、ネットワークなどの情報を収集する | 「どのサーバーにどのソフトが入っているか」を調べる |
| **Automation** | **ランブック**(複数の手順の自動処理)を実行する。承認、分岐、複数のアカウントとリージョンへの展開ができる | 複雑な修復、AMI の作成、手順書の自動化 |
| **Maintenance Windows** | 作業を行う時間帯を決める | 業務に影響しない時間帯のパッチ適用 |
| **Session Manager** | ブラウザや CLI から、SSH なしでシェルに入る。ポート 22 を開けず、踏み台サーバーが要らない。操作の記録を S3 と CloudWatch Logs に残せる | 安全なサーバーへのログイン |
| **Distributor** | ソフトウェアのパッケージを配る | エージェントなどの配布 |
| Parameter Store | 設定値と秘密の値の保管 | アプリの設定 |
| **Change Manager** | 変更の承認の流れを管理する | 運用の変更の統制 |

### 2. Patch Manager

| 用語 | 意味 |
|---|---|
| パッチベースライン | どのパッチを承認するかのルール。OS ごとの既定のベースラインがあり、自分で作ることもできる。承認ルールには「重要度」「分類」「公開から○日後に自動で承認」を指定する |
| パッチグループ | ノードをグループにする。`Patch Group` か `PatchGroup` のタグで指定し、グループごとに別のベースラインを割り当てる。パッチポリシー(Quick Setup)では使わない。2022-12-22 より後に使い始めたアカウントとリージョンでは、コンソールで使えない |
| 操作 | `Scan`(不足するパッチを報告するだけ)と `Install`(適用する。再起動することがある) |
| 実行の方法 | Maintenance Windows、State Manager のアソシエーション、Quick Setup のパッチポリシー(組織全体に展開できる) |
| コンプライアンス | ノードごとに、パッチが適用済みかを報告する。Config や Security Hub にも連携できる |

- 「全サーバーに毎週、夜間にパッチを当て、結果を報告させる」は、Patch Manager + Maintenance Windows(または Quick Setup のパッチポリシー)です。

### 3. Inventory と Config

- **Inventory** は、ソフトウェア、ファイル、ネットワークの設定などを収集します。**リソースデータの同期**で S3 に集め、Athena で問い合わせて、全アカウントを集計できます。
- **AWS Config** は、リソースの設定の変更履歴と、ルールの準拠状態を記録します。
- 準拠していないリソースの**自動修復**は、Config のルールに「修復アクション」として、**Systems Manager Automation のランブック**を結び付けます。たとえば、暗号化していない S3 を検出して、暗号化を有効にするランブックを実行します。
- State Manager は、ノードの中(OS の設定やソフトウェア)のあるべき状態を、スケジュールで繰り返し適用します(間隔は 30 分以上)。Config の修復は、AWS のリソースの設定(S3 の暗号化など)の違反を検出して直します。

### 4. Lambda と Step Functions による自動化

| 仕組み | 使う場面 |
|---|---|
| **Amazon EventBridge**のルール | AWS のイベント(状態の変化、API の呼び出し)や、スケジュールをきっかけに、処理を起動する |
| **AWS Lambda** | 短い処理(AWS SDK で AWS の API を呼ぶ)。処理時間の上限は 15 分 |
| **AWS Step Functions** | 複数の手順をつなぐ。分岐、並列、再試行、エラー処理、人の承認の待機。長い処理や、複数のサービスをまたぐ処理の流れを、画面で見て管理できる。多くの AWS サービスを直接呼べる |
| Systems Manager Automation | サーバーやリソースの運用の手順。AWS が用意したランブックが多数ある |

- Step Functions のスタンダードワークフローは、長時間(最長 1 年)の処理に、エクスプレスワークフローは、短時間(最長 5 分)で大量の処理に向きます。
- 「Lambda を数珠つなぎに呼び合う」のは避け、Step Functions で流れを管理します。

### 5. OpsWorks から Systems Manager へ

| 以前の OpsWorks | 今の選択肢 |
|---|---|
| Chef や Puppet でサーバーの構成を維持 | Systems Manager の State Manager(アソシエーションで、あるべき状態を維持) |
| レイヤーとインスタンスの管理 | Auto Scaling + 起動テンプレート + Image Builder |
| アプリのデプロイ | CodeDeploy |

OpsWorks Stacks のサービスは終了しています(公式の FAQ)。試験ガイドにはまだ名前がありますが、「新しく選ぶ答え」にはなりません。

### 6. まとめ: よく出る判断

| 場面 | 選ぶもの |
|---|---|
| 全サーバーのソフトウェアの一覧を集めたい | Systems Manager Inventory(リソースデータの同期 + Athena) |
| 設定のずれを、定期的に自動で戻したい | State Manager のアソシエーション |
| 多数のサーバーに、一度だけコマンドを実行 | Run Command(タグで対象、同時実行数を制限) |
| 夜間に OS のパッチを当てる | Patch Manager + Maintenance Windows |
| 「パッチの重要度が高いものだけ、公開から 3 日後に承認」 | パッチベースラインの承認ルール |
| SSH を開けずに、サーバーに入る | Session Manager |
| 準拠していないリソースを自動で直す | Config ルール + 修復アクション(Automation ランブック) |
| 複数のステップ、分岐、再試行がある自動化 | Step Functions |
| 複数のアカウントとリージョンの運用を一度に自動化 | Automation のマルチアカウント・マルチリージョンの実行 |
| オンプレミスのサーバーも同じ仕組みで管理 | ハイブリッドアクティベーション(マネージドノード) |
| 以前 OpsWorks で行っていた構成の維持 | State Manager |

## 出典

- AWS DOP-C02 試験ガイド 分野 2: https://docs.aws.amazon.com/aws-certification/latest/devops-engineer-professional-02/devops-engineer-professional-02-domain2.html
- AWS CloudFormation ユーザーガイド: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
- AWS SAM デベロッパーガイド: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html
- AWS CDK デベロッパーガイド: https://docs.aws.amazon.com/cdk/v2/guide/home.html
- AWS Service Catalog 管理者ガイド: https://docs.aws.amazon.com/servicecatalog/latest/adminguide/introduction.html
- AWS AppConfig ユーザーガイド: https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html
- AWS Organizations ユーザーガイド(SCP): https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html
- AWS Control Tower ユーザーガイド: https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html
- AWS Systems Manager ユーザーガイド: https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html
- AWS Systems Manager のパッチグループ: https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager-patch-groups.html
- AWS-RunPatchBaseline: https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager-aws-runpatchbaseline.html
- State Manager の cron と rate の式: https://docs.aws.amazon.com/systems-manager/latest/userguide/reference-cron-and-rate-expressions.html
- Control Tower のコントロールの種類: https://docs.aws.amazon.com/controltower/latest/controlreference/control-behavior.html
- StackSets の AutoDeployment: https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_AutoDeployment.html
- AWS OpsWorks Stacks End of Life FAQ: https://docs.aws.amazon.com/opsworks/latest/userguide/stacks-eol-faqs.html
