# AWS DOP テキスト 1.0 SDLC の自動化(22%)

対象: DOP-C02

最も配点が大きい分野です。「パイプラインを作る(1.1)」「テストを組み込む(1.2)」「成果物を管理する(1.3)」「デプロイの方式を選ぶ(1.4)」の4つに分かれます。

## 1.1 CI/CD パイプラインを実装する

出題範囲: SDLC の考え方、リポジトリ(AWS CodeCommit、外部の Git)、AWS CodePipeline、AWS CodeBuild(buildspec、キャッシュ、VPC)、シークレットの扱い(Secrets Manager、Parameter Store)、単一アカウントとマルチアカウントのパイプライン、ブランチ戦略、デプロイ戦略の選び方。

### 1. パイプラインの全体像

CI/CD のパイプラインは、次の段を自動でつなぎます。

| 段 | やること | AWS のサービス |
|---|---|---|
| ソース | コードの変更を検知して取得する | CodeCommit、GitHub などの外部リポジトリ(CodeConnections 経由)、S3、ECR |
| ビルド | コンパイル、テスト、パッケージ化 | AWS CodeBuild(ビルドを実行するマネージドサービス) |
| テスト | 結合テスト、受け入れテスト | CodeBuild、Lambda の呼び出し、サードパーティ |
| デプロイ | 環境に届ける | AWS CodeDeploy、CloudFormation、ECS、Elastic Beanstalk、S3 など |
| 承認 | 人が確認してから進める | CodePipeline の手動承認アクション |

これらを順に流す役が **AWS CodePipeline**(パイプラインを組み立てて実行するサービス)です。

### 2. CodePipeline の仕組み

| 用語 | 意味 |
|---|---|
| パイプライン | ステージの並び |
| ステージ | 「Source」「Build」「Deploy」などの段。ステージは順に実行されます |
| アクション | ステージの中の1つの作業。同じステージ内で並列に動かせます(`runOrder` が同じなら並列) |
| アーティファクト | アクションの入力と出力。アーティファクトストア(S3)を経由して次のアクションに渡ります |
| 遷移 | ステージ間の流れ。無効にすると、そこで止められます |

- ソースの変更は、CodeCommit、S3、ECR では EventBridge のルールで、GitHub などでは CodeConnections の接続で検知します(ポーリングより早く、推奨です)。
- パイプラインには V1 と V2 の種類があります。V2 は、Git のブランチ、タグ、プルリクエスト、ファイルパスで起動を絞るトリガー、パイプラインの変数、実行モード(キュー、並列)、ステージのロールバックなどに対応します。
- 手動承認アクションは、承認の依頼を SNS で通知できます。承認されないと、次のステージに進みません。
- パイプラインの実行は、失敗したステージから再実行できます。

### 3. リポジトリ

| 選択肢 | 位置づけ |
|---|---|
| AWS CodeCommit | AWS のマネージドな Git リポジトリ。IAM で認証します |
| GitHub、GitLab、Bitbucket など | AWS CodeConnections(旧 CodeStar Connections)でパイプラインとつなぎます |
| S3 | zip にしたソースをバージョニング付きのバケットに置いて使います |
| ECR | コンテナイメージの更新をきっかけにパイプラインを動かします |

> **CodeCommit の状態(公式ブログ「AWS CodeCommit returns to general availability」、2025-11-24)**: AWS は 2024 年 7 月に CodeCommit の新規の顧客への提供を止めました(既存の顧客は使い続けられました)。その後 2025-11-24 に、CodeCommit は一般提供(GA)に戻ると発表されました。新規の顧客もリポジトリを作れます。料金は変わらず、SLA(稼働率 99.9%)も続くと書かれています。試験のためには「CodeCommit は IAM で認証するマネージドな Git」と、「外部のリポジトリも CodeConnections で使える」の両方を覚えます。提供の状況は、公式の「ドキュメント履歴」にあります。

ブランチ戦略の基本です。

| 戦略 | 内容 | パイプラインとの関係 |
|---|---|---|
| トランクベース | 短命なブランチで、メインのブランチに頻繁にマージする | メインのブランチへのマージのたびにパイプラインが走る。CI/CD に向く |
| GitFlow | develop、release、hotfix などの長命なブランチを使う | ブランチごとに別のパイプラインを持つことが多い |

### 4. CodeBuild とビルド仕様(buildspec)

AWS CodeBuild は、ビルド用のコンテナを起動して処理を実行するサービスです。サーバーの管理は不要で、ビルドした時間だけ課金されます。ビルドの手順は、ソースの直下の **`buildspec.yml`** に書きます。

```yaml
version: 0.2
env:
  variables:
    STAGE: test
  parameter-store:
    DB_USER: /myapp/db/user
  secrets-manager:
    DB_PASS: myapp/db:password
phases:
  install:
    runtime-versions:
      python: 3.12
  pre_build:
    commands:
      - pip install -r requirements.txt
  build:
    commands:
      - pytest --junitxml=report.xml
  post_build:
    commands:
      - echo done
reports:
  unit-tests:
    files:
      - report.xml
    file-format: JUNITXML
artifacts:
  files:
    - '**/*'
cache:
  paths:
    - '/root/.cache/pip/**/*'
```

| フェーズ | 役割 |
|---|---|
| `install` | ランタイムとツールの導入 |
| `pre_build` | ビルド前の準備(ログイン、依存の取得) |
| `build` | ビルドとテスト本体 |
| `post_build` | 後処理(イメージの push、通知など) |

- コマンドが 0 以外の終了コードで終わると、そのフェーズは失敗し、ビルドも失敗します(`post_build` は `build` が失敗しても実行されます)。
- ビルドの失敗は、パイプラインのアクションの失敗になり、次のステージに進みません。
- Docker イメージを、ビルド環境の中の Docker デーモンでビルドするときは、プロジェクトの「特権モード(privileged)」を有効にします(別の方法として、CodeBuild の Docker サーバーの機能もあります)。
- **キャッシュ**: ビルドを速くします。S3 キャッシュ(ビルドをまたいで共有)とローカルキャッシュ(ソース、Docker のレイヤー、カスタム)があります。
- **VPC**: プライベートサブネットの RDS などに触れるテストでは、CodeBuild を VPC の中で動かします。インターネットに出るには NAT ゲートウェイが要ります。
- **バッチビルド**: 複数のビルドを並列や順序付きで実行できます。
- **ビルドプロジェクトのサービスロール**: ビルドが使う IAM ロール。S3、ECR、Secrets Manager などへの権限をここに付けます。

### 5. ビルドとデプロイのシークレット

| 方法 | 使う場面 |
|---|---|
| `parameter-store`(Systems Manager Parameter Store) | 設定値や、SecureString の暗号化した値。標準のパラメーターは無料 |
| `secrets-manager` | データベースのパスワードなど。自動ローテーションが使える。料金がかかる |
| 平文の環境変数(`PLAINTEXT`) | **機密には使わない**(コンソールやログで見えてしまう) |

- buildspec の `env` の `parameter-store` と `secrets-manager` に書くと、ビルド時に値が環境変数として渡されます。
- ビルドのサービスロールに、`ssm:GetParameters` や `secretsmanager:GetSecretValue`、暗号化に使う KMS キーの `kms:Decrypt` を付けます。
- コードにパスワードを埋め込まない、リポジトリにコミットしない、が原則です。

### 6. マルチアカウントのパイプライン

開発、ステージング、本番を別のアカウントに分けるとき、よく使う構成です。

| 要素 | 内容 |
|---|---|
| ツール用アカウント | パイプラインとアーティファクトのバケットを置く(1つにまとめる) |
| デプロイ先のアカウント | 開発、ステージング、本番。それぞれにデプロイ用の IAM ロールを作る |
| クロスアカウントロール | パイプラインが、デプロイ先のアカウントのロールを引き受けて(`AssumeRole`)デプロイする |
| アーティファクトの暗号化 | デプロイ先のアカウントがアーティファクトを読むには、**カスタマー管理キー(CMK)**を使い、キーポリシーでデプロイ先のアカウントを許可する。AWS 管理のキー(`aws/s3`)は、別アカウントに共有できない |
| バケットポリシー | アーティファクトのバケットも、デプロイ先のアカウントのロールに読み取りを許可する |

- 別のリージョンにデプロイするアクションには、そのリージョンのアーティファクト用のバケットが要ります。CodePipeline が、リージョンごとにバケットを用意して成果物を複製します。
- デプロイを管理するアカウントを分ける目的は、本番の権限を絞ることです。ビルドの権限と、本番に触る権限を分けます。

### 7. まとめ: よく出る判断

| 場面 | 選ぶもの |
|---|---|
| コードの変更から自動でビルドとデプロイ | CodePipeline(ソース → CodeBuild → デプロイ) |
| ビルドサーバーを管理したくない | CodeBuild |
| ビルドのパスワードを安全に渡す | buildspec の `secrets-manager` か `parameter-store` |
| 本番の前に人の確認が要る | 手動承認アクション(SNS で通知) |
| 別アカウントにデプロイ | クロスアカウントロール + CMK で暗号化したアーティファクト |
| ビルドが遅い | キャッシュ(S3 かローカル)、バッチビルド |
| プライベートな RDS に触るテスト | CodeBuild を VPC の中で動かす |
| ソースが GitHub | CodeConnections でパイプラインにつなぐ |

## 1.2 自動テストを CI/CD パイプラインに組み込む

出題範囲: テストの種類(単体、結合、受け入れ、UI、セキュリティスキャン)、パイプラインのどの段で何を実行するか、プルリクエストとマージでのビルド、負荷テスト、アプリケーションの終了コードによる健全性の判断、コードカバレッジ、パイプラインから AWS サービスを呼び出すテスト。

### 1. どの段で何のテストを行うか

| テスト | 内容 | 置く場所 | 速さ |
|---|---|---|---|
| 単体テスト | 関数やクラスの単位 | ビルドの段(CodeBuild) | 速い |
| 静的解析、依存関係の脆弱性スキャン | コードやライブラリの問題を探す | ビルドの段 | 速い |
| 結合テスト | 部品をつないで動かす | テスト用の環境にデプロイしてから | 中 |
| 受け入れテスト、UI テスト | 画面やユーザーの操作から確かめる | ステージング環境にデプロイしてから | 遅い |
| 負荷テスト、性能テスト | 負荷をかけて性能を測る | 本番に近い環境で | 遅い |

- 速いテストを前の段に、遅いテストを後ろの段に置きます。早く失敗させる(fail fast)ためです。
- 本番にデプロイする前に、テストが通ることをパイプラインの段で保証します。

### 2. プルリクエストとマージでビルドを動かす

- **プルリクエストのとき**: CodeBuild を Webhook(GitHub など)か、EventBridge のルール(CodeCommit のプルリクエストのイベント)で起動して、単体テストの結果を PR に返します。マージ前に壊れた変更を見つけます。
- **マージのとき**: メインのブランチへのマージを検知して、パイプラインを起動します。
- CodeBuild の Webhook は、ブランチやファイルパス、イベントの種類で絞り込めます。

### 3. テスト結果とカバレッジの記録

- CodeBuild のレポート機能に、`reports` セクションでテスト結果(JUnit XML など)やコードカバレッジ(Cobertura、JaCoCo など)のファイルを渡すと、コンソールで結果を見られます。
- 終了コードが 0 以外のコマンドがあれば、ビルドは失敗します。テストのコマンド(`pytest`、`npm test` など)は、失敗時に 0 以外で終わるため、そのままビルドを止めます。
- カバレッジの最低ラインを決め、下回ったらビルドを失敗させるには、テストツール側の設定(しきい値)か、`build` フェーズで判定するスクリプトを使います。

### 4. パイプラインから AWS のサービスを呼ぶテスト

| 目的 | 使うもの |
|---|---|
| 独自の確認処理(デプロイ後のエンドポイントへの疎通確認など) | CodePipeline の Lambda 呼び出しアクション。Lambda が `PutJobSuccessResult` か `PutJobFailureResult` で結果を返す |
| 複数の手順にまたがるテスト | Step Functions を呼び出すアクション |
| 大規模な負荷テスト | AWS の「Distributed Load Testing」ソリューション、または CodeBuild で負荷ツール(Locust など)を動かす |
| モバイルやブラウザの UI テスト | AWS Device Farm のアクション |
| 承認 | 手動承認アクション |

- Lambda のアクションで結果を返さないと、パイプラインはタイムアウトするまで待ちます。
- デプロイ後の健全性は、CodeDeploy のライフサイクルフックの `ValidateService` や、CloudWatch アラームでも判断します(1.4)。

### 5. まとめ: よく出る判断

| 場面 | 選ぶもの |
|---|---|
| PR が出たら自動でテスト | CodeBuild を Webhook か EventBridge で起動 |
| テストが失敗したら止める | テストのコマンドの終了コード(0 以外) → ビルド失敗 → パイプライン停止 |
| テスト結果をコンソールで見る | CodeBuild の `reports` |
| デプロイ後に独自の確認 | Lambda 呼び出しアクション(結果を `PutJob…Result` で返す) |
| 画面の自動テスト | Device Farm など |
| 負荷テスト | ステージングの環境で、負荷ツールを CodeBuild か専用のソリューションで実行 |
| テストの順序 | 速い単体テストを先、遅い UI や負荷テストを後 |

## 1.3 アーティファクトを作成して管理する

出題範囲: アーティファクトの用途と安全な管理、作成する方法、ライフサイクル、AWS CodeArtifact、Amazon S3、Amazon ECR、EC2 Image Builder、ビルドツール(CodeBuild、Lambda)。

### 1. アーティファクトの置き場所

| 種類 | 置き場所 | 特徴 |
|---|---|---|
| パッケージ(npm、PyPI、Maven、NuGet など) | AWS CodeArtifact(パッケージの保管と配布のサービス) | 外部の公開リポジトリを上流(upstream)につなげられる |
| コンテナイメージ | Amazon ECR(コンテナイメージのレジストリ) | イメージのスキャン、ライフサイクルポリシー、レプリケーション |
| zip、バイナリ、テンプレート | Amazon S3 | バージョニング、ライフサイクルルール |
| AMI(サーバーのイメージ) | EC2 Image Builder で作る | パイプラインで自動作成 |

### 2. AWS CodeArtifact

- **ドメイン**の下に**リポジトリ**を作ります。ドメインは複数のリポジトリをまとめ、データを重複して持たず、暗号化のキーを共通にします。
- リポジトリは、別のリポジトリを**上流(upstream)**にできます。たとえば、社内のリポジトリの上流を npm の公開レジストリにつなぐと、必要なパッケージを初回の取得時にキャッシュします。
- **パッケージオリジンの制御**で、「社内で公開したパッケージ名を、外部のレジストリから取り込ませない」ように設定できます。社内のパッケージ名と同じ名前の悪意のあるパッケージを取り込む攻撃(依存関係の混乱)を防げます。
- 認証は、`aws codeartifact login` などで認証トークンを取得して、パッケージマネージャー(npm、pip など)に渡します。トークンの有効期間は 15 分〜12 時間です(既定は 12 時間)。
- アクセス権は、IAM ポリシーとリポジトリのリソースポリシーで制御します。CodeBuild のサービスロールに、`codeartifact:GetAuthorizationToken`、`codeartifact:GetRepositoryEndpoint`、`codeartifact:ReadFromRepository`、`sts:GetServiceBearerToken` を付けます。`sts:GetServiceBearerToken` は IAM のポリシーに書きます(ドメインのリソースポリシーに書いても効きません)。
- トークンの寿命は、引き受けたロールのセッションとは別です。`--duration-seconds 0` で、セッションの残り時間に合わせられます。

### 3. Amazon ECR

| 機能 | 内容 |
|---|---|
| ライフサイクルポリシー | 古いイメージや、タグなしのイメージを自動で削除する |
| イメージスキャン | 基本スキャン(push 時などに脆弱性を調べる)と、拡張スキャン(Amazon Inspector による継続的なスキャン) |
| タグのイミュータビリティ | 同じタグへの上書きを禁止する。`latest` を上書きして混乱するのを防ぐ |
| レプリケーション | 別のリージョンや別のアカウントに自動で複製する |
| プルスルーキャッシュ | Docker Hub などの外部のレジストリのイメージを、ECR にキャッシュして取得する。Docker Hub の取得回数の制限を避けられる |

- CodeBuild でイメージを作るときは、`aws ecr get-login-password` でログインして `docker push` します。サービスロールに ECR への権限が要ります。

### 4. EC2 Image Builder

EC2 Image Builder は、AMI やコンテナイメージの作成、テスト、配布を自動化するサービスです。

| 要素 | 内容 |
|---|---|
| イメージレシピ | 元のイメージ(ベース)と、組み込む「コンポーネント」の並び |
| コンポーネント | 「ビルド」(ソフトの導入など)と「テスト」(確認)の処理 |
| インフラ設定 | ビルド用のインスタンスの種類、サブネット、IAM ロール |
| 配布設定 | 作ったイメージを、複数のリージョンやアカウントへ配布する。ライセンスの設定や起動テンプレートの更新もできる |
| パイプライン | スケジュールや、ベースのイメージの更新をきっかけに自動で実行する |

- 「ゴールデン AMI を毎月自動で作り直して、複数のリージョンに配る」は Image Builder の典型の場面です。
- セキュリティパッチの入った新しい AMI を、起動テンプレートに自動で反映させ、Auto Scaling グループのインスタンスの更新(1.4)につなげます。

### 5. S3 でのアーティファクト管理

- バージョニングを有効にします。誤って上書きしても戻せます。
- ライフサイクルルールで、古い成果物を安い層に移すか、削除します。
- 暗号化(SSE-KMS)とバケットポリシーで、アクセスを制限します。
- CodePipeline のアーティファクトストアも S3 です。

### 6. ビルドの成果物を作る方法

| 方法 | 用途 |
|---|---|
| CodeBuild の `artifacts` セクション | zip やファイル群を S3 に出す |
| CodeBuild で `docker build` と `docker push` | コンテナイメージを ECR に出す |
| Lambda | 軽い変換処理を行う。ビルドの処理時間に上限があるため、長い処理は CodeBuild |
| `sam build` / `cdk synth` | サーバーレスのパッケージや、CloudFormation のテンプレートを作る |

### 7. まとめ: よく出る判断

| 場面 | 選ぶもの |
|---|---|
| 社内の npm や Maven のパッケージを管理 | CodeArtifact |
| 社内のパッケージ名を外部から取り込ませない | CodeArtifact のパッケージオリジンの制御 |
| コンテナイメージの保管と、古いものの自動削除 | ECR のライフサイクルポリシー |
| Docker Hub の取得制限を避ける | ECR のプルスルーキャッシュ |
| 別のリージョンにもイメージを置く | ECR のレプリケーション |
| タグの上書きを防ぐ | ECR のタグのイミュータビリティ |
| ゴールデン AMI を自動で作って配る | EC2 Image Builder(配布設定で複数のリージョンとアカウント) |
| 成果物の誤上書きに備える | S3 のバージョニング |

## 1.4 インスタンス、コンテナ、サーバーレス環境にデプロイ戦略を実装する

出題範囲: EC2、ECS、EKS、Lambda のデプロイ方法、アプリケーションのストレージのパターン(EFS、S3、EBS)、ミュータブルとイミュータブル、AWS CodeDeploy(エージェント、appspec、デプロイ設定、ロールバック)、Elastic Beanstalk、ブルー/グリーン、カナリア、デプロイの問題の調査。

### 1. デプロイ戦略の種類

| 戦略 | 動き | ダウンタイム | ロールバック | 追加のコスト |
|---|---|---|---|---|
| オールアットワンス | 全部を一度に更新する | あり | 再デプロイ | なし |
| ローリング | 少しずつ、順番に更新する | ほぼなし(能力は一時的に減る) | 再デプロイ(遅い) | なし |
| ローリング + 追加バッチ | 追加のインスタンスを足してから、順に更新する | なし(能力は減らない) | 再デプロイ | 少し |
| イミュータブル | 新しいインスタンスの一式を作り、成功したら入れ替える | なし | 新しい一式を捨てるだけ(速い) | 一時的に倍 |
| ブルー/グリーン | 新しい環境(グリーン)を作り、トラフィックを切り替える | なし | 切り戻すだけ(最速) | 一時的に倍 |
| カナリア | 少量のトラフィックだけ新しいほうへ流し、問題がなければ全部へ | なし | 速い | 少し |
| リニア | トラフィックを、一定の間隔で一定の割合ずつ新しいほうへ移す | なし | 速い | 少し |

- **ミュータブル**: 動いているサーバーを、その場で書き換えます。ローリングやオールアットワンスがこちらです。設定のずれが溜まりやすいです。
- **イミュータブル**: 動いているサーバーは書き換えず、新しいものと入れ替えます。ブルー/グリーンとイミュータブルがこちらです。
- 「ダウンタイムなしで、問題があればすぐに切り戻したい」→ ブルー/グリーン。「一部の利用者だけで先に確かめたい」→ カナリア。

### 2. AWS CodeDeploy

AWS CodeDeploy は、EC2 とオンプレミスのサーバー、Lambda、ECS に、アプリケーションのデプロイを自動化するサービスです。

| コンピューティング | デプロイの方式 | エージェント | 主な設定 |
|---|---|---|---|
| EC2 / オンプレミス | インプレース、ブルー/グリーン | **必要**(CodeDeploy エージェント) | AllAtOnce、HalfAtATime、OneAtATime |
| Lambda | トラフィックの切り替え(エイリアスの重み付け) | 不要 | Canary、Linear、AllAtOnce |
| ECS | ブルー/グリーン(タスクセットの切り替え) | 不要 | Canary、Linear、AllAtOnce |

- **インプレース**: 既存のインスタンスを順に停止し、新しい版を入れます。ロードバランサーがあれば、更新中のインスタンスをはずします。
- **EC2 のブルー/グリーン**: 新しいインスタンス(Auto Scaling グループをコピー)に新しい版を入れ、ロードバランサーの向き先を切り替えます。ロードバランサーが要ります。
- **Lambda**: 新しいバージョンを作り、エイリアスの重みを少しずつ新しいバージョンに移します。例: `CodeDeployDefault.LambdaCanary10Percent5Minutes`(SAM では `Canary10Percent5Minutes`。最初の 10% を 5 分流して、問題なければ全部)、`CodeDeployDefault.LambdaLinear10PercentEvery1Minute`(1 分ごとに 10% ずつ)。
- **ECS**: 新しいタスクセットを作り、ロードバランサーのリスナーを切り替えます。CodeDeploy のブルー/グリーンには、ロードバランサー(ALB か NLB)とターゲットグループ 2 つが要ります。

> ECS 自身のデプロイの機能として、ブルー/グリーン(2025-07)、リニアとカナリア(2025-10)が追加されています。試験で CodeDeploy を使う構成と、ECS の機能のどちらが想定されているかは、問題文に合わせて判断します。

#### appspec ファイルとライフサイクルフック

`appspec.yml` に、配置するファイルと、各段階で実行するスクリプト(フック)を書きます。

EC2 のインプレースデプロイの段階の順序です。

| 順 | イベント | 内容 |
|---|---|---|
| 1 | `ApplicationStop` | 現在のアプリを止める |
| 2 | `DownloadBundle` | エージェントが成果物を取得する(スクリプトは書けない) |
| 3 | `BeforeInstall` | 配置前の準備 |
| 4 | `Install` | ファイルを配置する(スクリプトは書けない) |
| 5 | `AfterInstall` | 配置後の設定 |
| 6 | `ApplicationStart` | アプリを起動する |
| 7 | `ValidateService` | 動作の確認。ここで失敗するとデプロイが失敗する |

- Lambda のフックは `BeforeAllowTraffic` と `AfterAllowTraffic` の 2 つです。それぞれ、検証用の Lambda 関数を指定します。
- ECS のフックには、`BeforeInstall`、`AfterInstall`、`AfterAllowTestTraffic`、`BeforeAllowTraffic`、`AfterAllowTraffic` があります。
- フックのスクリプトが 0 以外の終了コードで終わると、そのデプロイは失敗します。

#### 自動ロールバック

- デプロイの失敗、または **CloudWatch アラームの発火**をきっかけに、自動でロールバックできます。
- EC2 の場合、ロールバックは「直前の正常な版を、新しいデプロイとして再実行する」動きです。ブルー/グリーンなら、ロードバランサーを元に戻します。
- Lambda と ECS は、トラフィックを元の版に戻します。

#### Auto Scaling との関係

- デプロイグループに Auto Scaling グループを指定すると、あとからスケールアウトで増えたインスタンスにも、最新の版が自動でデプロイされます。

### 3. CodeDeploy エージェントとデプロイの問題の調査

| 症状 | 確認すること |
|---|---|
| デプロイが始まらない、「No instances found」 | インスタンスのタグ、デプロイグループの設定、**エージェントが動いているか**、インスタンスプロファイル |
| エージェントが成果物を取れない | インスタンスのロールに S3(成果物のバケット)の読み取り権限があるか。インスタンスが S3 に届くか(NAT かエンドポイント) |
| フックでの失敗 | エージェントのログ(`/var/log/aws/codedeploy-agent/codedeploy-agent.log`)とデプロイごとのログ(`/opt/codedeploy-agent/deployment-root/deployment-logs/codedeploy-agent-deployments.log`) |
| デプロイ先が見つからない | CodeDeploy のサービスロールの権限、デプロイグループの対象の指定 |

- エージェントは、Systems Manager の State Manager で導入と更新を自動化できます。
- 2 種類のロールを区別します。**CodeDeploy のサービスロール**(CodeDeploy が EC2 や Auto Scaling を操作する)と、**インスタンスプロファイル**(エージェントが S3 から成果物を取る)です。

### 4. AWS Elastic Beanstalk のデプロイ

Elastic Beanstalk は、アプリのコードを渡すと、EC2、Auto Scaling、ELB などを自動で用意して動かすサービスです。更新の方式を設定で選べます。

| 方式 | 内容 | ダウンタイム | 能力 |
|---|---|---|---|
| All at once | 全インスタンスを一度に更新 | あり | 一時的にゼロ |
| Rolling | バッチ単位で順に更新 | なし | バッチの分だけ減る |
| Rolling with additional batch | 追加のバッチを足してから順に更新 | なし | 減らない |
| Immutable | 新しいインスタンスの Auto Scaling グループを作って入れ替える | なし | 減らない。失敗時は新しい側を捨てるだけ |
| Traffic splitting | 新しい版にトラフィックの一部を流して評価する(カナリア) | なし | 減らない |
| Blue/green | 別の環境を作り、**環境の URL(CNAME)を入れ替える** | なし | 減らない |

- Blue/green は、Beanstalk 自体のデプロイ方式ではなく、環境を2つ作って CNAME を入れ替える操作です。データベースを環境の中に作っていると、環境ごと消えるので、データベースは環境の外に置きます。

### 5. コンテナのデプロイ(ECS と EKS)

| サービス | 既定の更新 | ブルー/グリーンやカナリア |
|---|---|---|
| Amazon ECS | ローリング更新(サービスのデプロイ設定の最小・最大の割合で制御) | CodeDeploy、または ECS 自身の機能 |
| Amazon EKS | Kubernetes の Deployment のローリング更新 | Argo Rollouts などのツール、または別のクラスター・サービスを切り替える |

- ECS のデプロイは、**デプロイサーキットブレーカー**を有効にすると、失敗を検知して自動でロールバックできます。
- ECS のイメージの更新は、パイプラインで、新しいイメージ URI を入れたタスク定義を登録して、サービスを更新します。CodePipeline の ECS デプロイアクションは、`imagedefinitions.json` を読みます。
- EKS へのデプロイでは、CodeBuild に `kubectl` や Helm を使わせます。CodeBuild のロールが EKS のクラスターに入れるように、EKS の「アクセスエントリ」(従来は `aws-auth` の ConfigMap)でアクセスを許可します。

### 6. Lambda とサーバーレスのデプロイ

- Lambda は、**バージョン**(変更できない版)と**エイリアス**(版を指す名前)を使います。エイリアスに 2 つの版と重みを設定すると、トラフィックを分けられます。
- **AWS SAM**(サーバーレス向けの CloudFormation の拡張)では、`AutoPublishAlias` と `DeploymentPreference` を書くと、CodeDeploy を使った段階的なデプロイ(カナリア、リニア)と、アラームによる自動ロールバックを設定できます。
- API Gateway には、ステージのカナリアリリースの機能があります。

### 7. アプリケーションのストレージのパターン

イミュータブルな方式では、インスタンスを捨てても失ってはいけないデータを、インスタンスの外に置きます。

| 保存先 | 特徴 | 向く用途 |
|---|---|---|
| Amazon S3 | 容量の制限がなく、どこからでもアクセス | アップロードされたファイル、成果物 |
| Amazon EFS | 複数のインスタンス、複数の AZ から共有できる NFS | 共有のコンテンツ、設定 |
| Amazon EBS | 1 つの AZ の中で、1 台のインスタンスにつなぐブロックストレージ | OS のディスク、データベースのディスク |
| インスタンスストア | インスタンスの停止や終了で消える | 一時的なキャッシュ |

- EBS のボリュームは、インスタンスの終了時に既定で削除されます(ルートボリューム)。残したいデータは、別のボリュームか EFS、S3 に置きます。
- セッションの情報は、ElastiCache や DynamoDB に置き、アプリケーションのサーバーをステートレスにします。

### 8. まとめ: よく出る判断

| 場面 | 選ぶもの |
|---|---|
| EC2 に、ダウンタイムなしで新しい版を入れ、すぐに切り戻したい | CodeDeploy のブルー/グリーン(または Beanstalk のイミュータブル) |
| Lambda を、少しの割合から段階的にデプロイ | エイリアスの重み付け(CodeDeploy の Canary、Linear。SAM の `DeploymentPreference`) |
| 悪化したら自動で戻す | CloudWatch アラームと CodeDeploy の自動ロールバック |
| ECS でカナリアやブルー/グリーン | CodeDeploy(または ECS 自身の機能) |
| ECS のデプロイ失敗を自動で戻す | デプロイサーキットブレーカー |
| Beanstalk で、能力を減らさず更新 | Rolling with additional batch、Immutable |
| Beanstalk で、環境ごと入れ替えたい | Blue/green(CNAME の入れ替え) |
| 新しいインスタンスにも最新の版を入れたい | CodeDeploy のデプロイグループに Auto Scaling グループを指定 |
| デプロイが始まらない | CodeDeploy エージェントの稼働、タグ、インスタンスプロファイル |
| 複数のインスタンスで共有するファイル | EFS(S3 でも可) |

## 出典

- AWS DOP-C02 試験ガイド 分野 1: https://docs.aws.amazon.com/aws-certification/latest/devops-engineer-professional-02/devops-engineer-professional-02-domain1.html
- AWS CodeCommit returns to general availability(AWS DevOps & Developer Productivity Blog、2025-11-24): https://aws.amazon.com/blogs/devops/aws-codecommit-returns-to-general-availability
- AWS CodePipeline ユーザーガイド: https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html
- AWS CodeBuild ユーザーガイド(ビルド仕様のリファレンス): https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html
- AWS CodeDeploy ユーザーガイド: https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html
- AWS CodeArtifact ユーザーガイド: https://docs.aws.amazon.com/codeartifact/latest/ug/welcome.html
- Amazon ECR ユーザーガイド: https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html
- EC2 Image Builder ユーザーガイド: https://docs.aws.amazon.com/imagebuilder/latest/userguide/what-is-image-builder.html
- AWS Elastic Beanstalk 開発者ガイド(デプロイ方式): https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.deploy-existing-version.html
- Amazon ECS built-in blue/green deployments(What's New、2025-07): https://aws.amazon.com/about-aws/whats-new/2025/07/amazon-ecs-built-in-blue-green-deployments/
- Amazon ECS built-in linear and canary deployments(What's New、2025-10): https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-ecs-built-in-linear-canary-deployments
- Amazon ECS ブルー/グリーンデプロイ: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-blue-green.html
- AWS CodeCommit User Guide document history: https://docs.aws.amazon.com/codecommit/latest/userguide/history.html
- AWS CodeArtifact の認証トークン: https://docs.aws.amazon.com/codeartifact/latest/ug/tokens-authentication.html
- CodePipeline のパイプラインの種類: https://docs.aws.amazon.com/codepipeline/latest/userguide/pipeline-types-planning.html
