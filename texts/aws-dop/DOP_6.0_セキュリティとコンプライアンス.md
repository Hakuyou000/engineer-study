# AWS DOP 6.0 セキュリティとコンプライアンス(17%)

対象: DOP-C02

「大規模な ID とアクセスの管理(6.1)」「セキュリティ対策とデータ保護の自動化(6.2)」「監視と監査(6.3)」の3つに分かれます。SAA で学んだ IAM、KMS、WAF などを前提に、複数のアカウントとリージョンへ自動で広げる方法が問われます。

## 6.1 大規模な ID とアクセスの管理を実装する

主に扱うサービス: IAM のユーザー・グループ・ロール、ID プロバイダー、アイデンティティベースとリソースベースのポリシー、セッションポリシー、フェデレーション(IAM ID プロバイダー、IAM Identity Center)、アクセス許可の境界、SCP、最小権限、ロールベースと属性ベースのアクセス制御、AWS Secrets Manager による認証情報のローテーション、MFA、AWS STS。

### 1. 人と機械の ID の使い分け

| 対象 | 使うもの | 避けるもの |
|---|---|---|
| 人(社員) | IAM Identity Center、または外部の ID プロバイダー(SAML 2.0)とのフェデレーション。一時的な認証情報 | 社員ごとの IAM ユーザーと長期のアクセスキー |
| EC2 のアプリ | IAM ロール(インスタンスプロファイル) | コードや設定ファイルに書いたアクセスキー |
| ECS のタスク | タスクロール | 同上 |
| EKS のポッド | IAM roles for service accounts(IRSA)、または EKS Pod Identity | ノードのロールに、全ポッド分の権限を付ける |
| Lambda | 実行ロール | 同上 |
| CI/CD(GitHub Actions など) | IAM の OIDC ID プロバイダー + ロール(`AssumeRoleWithWebIdentity`) | CI に保存した長期のアクセスキー |
| AWS の外のサーバー | IAM Roles Anywhere(X.509 証明書で認証し、一時的な認証情報を得る) | 長期のアクセスキー |

AWS STS(一時的な認証情報を発行するサービス)の主な API です。

| API | 用途 |
|---|---|
| `AssumeRole` | IAM ロールを引き受ける。クロスアカウントでよく使う |
| `AssumeRoleWithSAML` | SAML 2.0 の認証後に、ロールを引き受ける |
| `AssumeRoleWithWebIdentity` | OIDC(Web ID)の認証後に、ロールを引き受ける |
| `GetSessionToken` | IAM ユーザーが、MFA で認証して、一時的な認証情報を得る |

### 2. 権限の上限と委任

| 機能 | 役割 |
|---|---|
| SCP | 組織のアカウントや OU の権限の上限。管理アカウントには効かない。何も許可しない |
| アクセス許可の境界 | ユーザーやロールの権限の上限。何も許可しない |
| セッションポリシー | ロールを引き受けるときに渡す、そのセッション限りの絞り込み |

権限の管理を開発者に委任するときの考え方です。

- 開発者に `iam:CreateRole` を許可します。ただし、条件キー `iam:PermissionsBoundary` で、**指定した境界を付けるときだけ** 許可します。
- 境界を外したり、別のポリシーに付け替えたり、境界のポリシーを書き換えたりする操作は拒否します(`iam:DeleteRolePermissionsBoundary`、条件のない `iam:PutRolePermissionsBoundary`、境界のポリシーへの `iam:CreatePolicyVersion`、`iam:DeletePolicyVersion`、`iam:SetDefaultPolicyVersion`)。
- こうすると、開発者は、自分の権限を超えるロールを作れません(権限の昇格を防げます)。

セッションポリシーです。

- ロールを引き受けるとき(`AssumeRole` の `Policy` パラメータや `PolicyArns` パラメータ)に渡す、そのセッションだけの絞り込みです。
- セッションの権限は、**ロールのアイデンティティベースのポリシーと、セッションポリシーの共通部分** です。
- セッションポリシーで、ロールの権限を超えて許可することはできません。
- 例: ロールが `Get`、`Put`、`Delete` を許可し、セッションポリシーが `Get`、`Put` だけを許可すると、そのセッションは `Delete` できません。
- セッションポリシーは、`AssumeRole` を呼ぶ側が渡します。利用者本人に強制する仕組みではありません。業務委託者に認証情報を渡す仲介アプリなど、管理している仕組みが呼ぶときに使います。
- リソースベースのポリシーが、セッションの ARN を主体として指定しているときは、その許可はセッションポリシーで絞られません。
- ロールを増やさず、引き受ける人やアプリごとに、権限を絞りたいときに使います。

権限の上限が重なる様子を図にします。実際に使える権限は、すべての上限と許可の共通部分です。

```text
[SCP] 組織の上限(ユーザーやロールの側)
[RCP] リソースコントロールポリシー。組織の上限(リソースの側)
  |
  v
[Permissions boundary] アクセス許可の境界(ユーザーやロールの上限)
  |
  v
[Session policy] そのセッション限りの絞り込み
  |
  v
[Effective permissions] IAM ポリシーの許可のうち、すべてを通ったものだけが使える
```

リソースベースのポリシーは、これらとは別の規則で評価されます。

### 3. 最小権限とアクセス制御のパターン

**ロールベースのアクセス制御(RBAC)**: 職務ごとにロール(権限セット)を作り、人に割り当てます。

**属性ベースのアクセス制御(ABAC)**: タグなどの属性が一致したときだけ許可します。

- 例: 人に `Project=A` のタグ、リソースに `Project=A` のタグがあるとき、操作を許可します。
- ポリシーは、`aws:PrincipalTag/Project` と `aws:ResourceTag/Project` が等しい、という条件で書きます。
- プロジェクトが増えても、ポリシーを書き換えずに済みます。タグを付けるだけです。
- IAM Identity Center の属性や、ロールを引き受けるときの **セッションタグ** で、人のタグを渡せます。
- タグを自分で書き換えられると、制御が破れます。タグを変更する権限も、絞ります。

**最小権限に近づける方法**

- **IAM Access Analyzer のポリシー生成**: CloudTrail の記録(指定した期間)から、実際に使った操作だけを許可するポリシーを作れます。
- **IAM Access Analyzer の未使用のアクセスの検出**: 使われていないロール、キー、権限を見つけます。
- **ポリシーの検証**: 文法の誤りや、広すぎる権限を、作る前に指摘します。

### 4. MFA の条件

- `aws:MultiFactorAuthPresent`: MFA で認証されたセッションかどうか。
- `aws:MultiFactorAuthAge`: MFA で認証してからの経過時間。
- 重要な操作(本番のロールの引き受け、インスタンスの削除)は、ロールの信頼ポリシーやポリシーの `Condition` で、MFA を必須にします。
- IAM ユーザーは、`GetSessionToken` で MFA 付きの一時的な認証情報を得ます。

### 5. 機械の認証情報の自動ローテーション

AWS Secrets Manager(秘密情報を保管し、自動でローテーションできるサービス)の要点です。

- データベースの認証情報、API キーなどを保存します。アプリは、実行時に API で取得します。
- **ローテーション**: スケジュール(日数や cron 式)で、秘密情報を自動で更新します。
- RDS などでは、ローテーション用の Lambda 関数のテンプレートが用意されています。一部の秘密情報には、Lambda を使わない **マネージドローテーション** があります。
- Lambda 関数の手順は、`createSecret` → `setSecret` → `testSecret` → `finishSecret` です。新しい版(`AWSPENDING`)を作り、データベースに設定して、確認してから、現在の版(`AWSCURRENT`)にします。
- アプリは、キャッシュを使いつつ、取得し直す設計にします。

| 項目 | Secrets Manager | Systems Manager Parameter Store |
|---|---|---|
| 自動ローテーション | あり | なし(自作が必要) |
| 暗号化 | KMS で暗号化 | SecureString で KMS による暗号化 |
| 向いている用途 | データベースの認証情報など、回転が必要なもの | 設定値、回転が不要な値 |

### 6. まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| 社員が複数のアカウントにログイン | IAM Identity Center |
| CI/CD から、長期のキーなしでデプロイ | OIDC ID プロバイダー + ロール |
| AWS の外のサーバーが AWS を呼ぶ | IAM Roles Anywhere |
| プロジェクトのタグが同じものだけ操作させる | ABAC(`aws:PrincipalTag` と `aws:ResourceTag`) |
| 開発者にロールの作成を委任し、昇格を防ぐ | アクセス許可の境界 + `iam:PermissionsBoundary` 条件 |
| 実際に使った操作だけを許可するポリシーを作る | IAM Access Analyzer のポリシー生成 |
| データベースのパスワードを自動で更新 | Secrets Manager のローテーション |
| 本番ロールの引き受けに MFA を必須にする | 信頼ポリシーの `aws:MultiFactorAuthPresent` |
| 組織全体で操作を禁止 | SCP |

## 6.2 セキュリティ対策とデータ保護を自動化する

主に扱うサービス: ネットワークのセキュリティ(セキュリティグループ、ネットワーク ACL、AWS Network Firewall、AWS WAF、AWS Shield)、証明書と PKI(AWS Certificate Manager)、データの分類・暗号化・鍵管理(AWS KMS、AWS CloudHSM)、AWS Security Hub、Organizations、Control Tower、Systems Manager による複数アカウントとリージョンへの自動展開、多層防御、Amazon GuardDuty、Amazon Macie、Amazon Detective。

### 1. ネットワークの防御

| 防御 | 特徴 |
|---|---|
| セキュリティグループ | インスタンスの単位。ステートフル。許可のルールだけ |
| ネットワーク ACL | サブネットの単位。ステートレス。許可と拒否のルール。戻りの通信も明示する |
| AWS WAF(Web アプリケーションファイアウォール) | HTTP の内容を検査する。SQL インジェクション、レートベースのルール、マネージドルールグループ。CloudFront、ALB、API Gateway、AppSync などに付ける |
| AWS Shield | DDoS の対策。Standard は自動で無料。Advanced は有料で、専門チームの支援と、攻撃による費用の増加の保護がある |
| AWS Network Firewall | VPC の経路上に置く、マネージドのファイアウォール。ドメイン名(FQDN)での制限、侵入防止(IPS)のルールを使える |
| AWS Firewall Manager | 組織全体に、WAF、Shield Advanced、セキュリティグループ、Network Firewall のルールを、一元的に配って強制する。新しいアカウントとリソースにも自動で適用する |

使い分けです。

- 「HTTP の中身(SQL インジェクション、特定の URL)で制御」は WAF です。
- 「VPC から外へ出る通信を、許可したドメインだけにする」は Network Firewall です。IP アドレスが変わる相手には、セキュリティグループでは対応しにくくなります。
- 「組織のすべてのアカウントに同じ WAF のルールを強制」は Firewall Manager です。AWS Organizations と AWS Config の有効化が前提です。

### 2. 検出と集約のサービス

| サービス | 何を見つけるか |
|---|---|
| Amazon GuardDuty | CloudTrail、VPC フローログ、DNS ログなどから、不審な動き(暗号通貨のマイニング、漏えいした認証情報の使用など)を検出する |
| Amazon Macie | S3 内の機密データ(個人情報など)を、自動で見つけて分類する。公開や暗号化の状態も評価する |
| Amazon Inspector | EC2、ECR のコンテナイメージ、Lambda の脆弱性を、継続的にスキャンする |
| AWS Security Hub | 各サービスの検出結果を集めて、1 か所で見る。セキュリティの基準(AWS の基礎的なセキュリティのベストプラクティスなど)に照らして、自動でチェックする。基準に照らしたチェックは、AWS Security Hub CSPM の機能です |
| Amazon Detective | 検出結果の調査を助ける。関連するログから、関係をグラフで示す |

複数のアカウントとリージョンへの広げ方です。

- GuardDuty、Security Hub、Macie、Inspector は、**委任管理者** のアカウントを決めると、組織全体を管理できます。
- 組織の **新しいアカウントに自動で有効化する** 設定があります。
- Security Hub は、複数のリージョンの検出結果を、**集約リージョン** に集められます。
- Control Tower では、**コントロール(ガードレール)** を有効にします。予防的(SCP)、検出的(AWS Config のルール)、プロアクティブ(CloudFormation フック)があります。
- CloudFormation StackSets の、サービスマネージドの権限を使うと、組織の OU にスタックを配れます。各アカウントに、実行用のロールを手作業で作る必要がありません。**自動デプロイ** を有効にすると、OU に追加された新しいアカウントにも、スタックが自動で作られます。アカウントが OU から外れたときの動作は、「スタックを削除する」か「保持する」(`RetainStacksOnAccountRemoval`)から選べます。自動デプロイは、StackSet の単位で設定します。
- サービスマネージドの権限を使うには、Organizations のすべての機能を有効にし、管理アカウントで StackSets の信頼されたアクセスを有効にします。すると、CloudFormation が、対象のアカウントに必要なロールを作ります。
- Control Tower の予防的コントロール(SCP、RCP、宣言型ポリシー)は、違反する操作を拒否します。検出的コントロールは、検出して報告するだけです。プロアクティブコントロールは、CloudFormation で作るリソースだけが対象です。OU で有効にすると、その OU のアカウントすべてに適用されます。
- Systems Manager の Quick Setup でも、複数のアカウントとリージョンに設定を配れます。

### 3. 多層防御の組み合わせ

1 つの対策に頼らず、層を重ねます。

| 層 | 対策の例 |
|---|---|
| エッジ | CloudFront、WAF、Shield |
| ネットワーク | セキュリティグループ、ネットワーク ACL、Network Firewall、プライベートサブネット |
| 通信の暗号化 | ACM の証明書、TLS、HTTPS の強制 |
| ID | 最小権限の IAM、MFA |
| データ | KMS による暗号化、S3 のパブリックアクセスのブロック、Macie |
| 検出と対応 | GuardDuty、Security Hub、Config、Detective、自動修復 |

### 4. 証明書と鍵

**AWS Certificate Manager(ACM)**(証明書の発行と更新を管理するサービス)

- ACM の公開証明書は、ELB、CloudFront、API Gateway などに使えます。無料です。
- DNS 検証の CNAME レコードを残しておくと、**自動で更新** されます。Route 53 を使うと、作成も簡単です。
- ACM の通常の公開証明書は、エクスポートできないため、EC2 に直接入れられません。
- 有料の、エクスポートできる公開証明書を使うと、EC2 やオンプレミスのサーバーにも入れられます。この場合、更新は ACM が行いますが、サーバーへの配置は自分で行います。
- 証明書を **インポート** した場合は、自動で更新されません。有効期限を自分で管理します。
- CloudFront で使う証明書は、バージニア北部(`us-east-1`)のリージョンに作ります。
- 社内向けの証明書は、AWS Private CA(プライベートの認証局)で発行します。

**AWS KMS(暗号化の鍵を管理するサービス)**

| 項目 | 内容 |
|---|---|
| AWS 所有のキー | 利用者に見えない。管理は不要 |
| AWS マネージドキー | AWS が管理する。約 1 年ごとに自動でローテーションされる。利用者は設定を変えられない |
| カスタマーマネージドキー(CMK) | 利用者が管理する。キーポリシー、有効化と無効化、ローテーションを決められる |
| 自動ローテーション | 対称暗号化の CMK で有効にできる。既定は 365 日ごとで、周期は 90〜2560 日の範囲で変えられる。オンデマンドでもローテーションできる。古いキーマテリアルは残るので、既存の暗号文は、そのまま復号できる。キー ID は変わらない |
| インポートしたキーマテリアル | 自動ローテーションはできない。新しいキーマテリアルをインポートして、オンデマンドでローテーションする |
| マルチリージョンキー | 複数のリージョンで、同じキーのように使える |
| キーの削除 | 待機期間(7〜30 日)がある |

- **エンベロープ暗号化**: データは、データキーで暗号化します。そのデータキーを、KMS のキーで暗号化します。
- キーを使えるかどうかは、まずキーポリシーで決まります。キーポリシーが IAM ポリシーでの許可を有効にしているときだけ、IAM ポリシーで許可できます。既定のキーポリシーは、これを有効にしています。
- S3 の SSE-KMS では、S3 バケットキーで、KMS の呼び出しを減らせます。

エンベロープ暗号化の流れを図にします。

```text
[KMS key]
  |
  |  GenerateDataKey
  v
[Data key] 平文のデータキーと、暗号化したデータキーが返る
  |
  v
[Plaintext data key] で、入力のデータを暗号化する
  |
  v
[Encrypted data] と、暗号化したデータキーを一緒に保存する
```

平文のデータキーは、使い終わったら捨てます。

**AWS CloudHSM**(専用のハードウェアでキーを管理するサービス)は、鍵の管理をすべて自分で行いたいとき、規制で専用のハードウェアが必要なときに使います。

### 5. まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| SQL インジェクションや、同じ IP からの大量のリクエストを防ぐ | AWS WAF(マネージドルール、レートベースのルール) |
| 許可したドメインだけに、外への通信を絞る | AWS Network Firewall(ドメインリスト) |
| 組織全体に WAF やセキュリティグループのルールを強制 | AWS Firewall Manager |
| 全アカウントとリージョンで脅威を検出 | GuardDuty(委任管理者、新しいアカウントに自動で有効化) |
| 複数アカウント・リージョンの検出結果を 1 か所に | Security Hub(委任管理者、集約リージョン) |
| S3 の個人情報を探す | Amazon Macie |
| 脆弱性を継続的に見つける | Amazon Inspector |
| 新しいアカウントにも、同じ設定を自動で配る | StackSets(サービスマネージド、自動デプロイ)、Control Tower |
| 違反する操作そのものを拒否する | Control Tower の予防的コントロール(SCP、RCP、宣言型ポリシー) |
| 引き受けるセッションだけ権限を絞る | セッションポリシー(`AssumeRole` の `Policy`)。実効の権限は、ロールとの共通部分 |
| 証明書を自動で更新 | ACM(DNS 検証) |
| 暗号化の鍵を毎年自動で入れ替える | KMS の CMK の自動ローテーション |
| 専用のハードウェアで、鍵を自分で管理 | CloudHSM |

## 6.3 セキュリティの監視と監査を実装する

主に扱うサービス: AWS CloudTrail、AWS Config、VPC フローログ、CloudFormation のドリフト検出、GuardDuty、Amazon Inspector、IAM Access Analyzer、よくある脅威(安全でない Web 通信、漏えいしたアクセスキー、公開された S3 バケット、暗号化されていない S3 バケット)、CloudWatch Logs、アラート、ログとセキュリティの検出結果の分析。

### 1. 監査のためのログ

| ログ | 何が分かるか |
|---|---|
| AWS CloudTrail | 誰が、いつ、どこから、どの API を呼んだか。管理イベント、データイベント(S3 のオブジェクトなど)、Insights イベント(異常な API の呼び出しの量) |
| AWS Config | リソースの設定の履歴と、ルールへの準拠 |
| VPC フローログ | ネットワークインターフェースを通る通信の記録(送信元、送信先、ポート、許可か拒否か) |
| CloudWatch Logs | アプリケーションや OS のログ。CloudWatch エージェントで集める |
| ELB のアクセスログ、S3 のアクセスログ | 個々のリクエスト |

CloudTrail の設計です。

- **組織の証跡** を作ると、組織内のすべてのアカウントの記録を、1 つの S3 バケットに集められます。メンバーアカウントでは、証跡を止められません。
- **ログファイルの整合性の検証** を有効にすると、ダイジェストファイルで、ログが改ざんされていないかを確かめられます。
- ログを保存する S3 バケットは、アクセスを絞り、KMS で暗号化します。バージョニングや MFA 削除、Object Lock も使えます。
- CloudWatch Logs にも出力すると、メトリクスフィルターでアラームを作れます。
- **CloudTrail Lake** では、イベントを保存して、SQL で調べられます。
- データイベント(S3 のオブジェクトの操作など)は、既定では記録されません。有効にします。

VPC フローログです。

- 出力先は、CloudWatch Logs、S3、Amazon Data Firehose(旧 Kinesis Data Firehose) です。
- S3 に出力して、Amazon Athena(S3 のデータを SQL で調べるサービス)で分析できます。
- パケットの中身は記録されません。

監査のためのログを、組織で集める構成を図にします。

```text
[CloudTrail org trail] ----+
[VPC Flow Logs] -----------+--> [S3 bucket in log account] KMS で暗号化したログ用のバケット
[AWS Config] --------------+          |
                                      +--> Athena で SQL の分析

[CloudTrail org trail] --> [CloudWatch Logs] --> [Metric filter] --> [Alarm] 証跡を CloudWatch Logs にも出力する
```

CloudFormation の **ドリフト検出** は、スタックのリソースが、テンプレートの定義と違う状態になっていないか(手作業の変更がないか)を検出します。

### 2. 脅威の検出

| サービス | 見つけるもの |
|---|---|
| GuardDuty | 不審な API の呼び出し、漏えいした認証情報の使用、暗号通貨のマイニング、通信の異常 |
| Amazon Inspector | EC2、ECR のイメージ、Lambda のソフトウェアの脆弱性、意図しないネットワークの到達性 |
| IAM Access Analyzer | S3、IAM ロール、KMS キーなどが、**外部に共有** されている状態。未使用のアクセスも |
| AWS Config | 公開された S3 バケット、暗号化されていないボリュームなど、設定がルールに合わない状態 |
| Security Hub | 上記の結果の集約、基準に対するチェック |

よくある脅威と対策です。

| 脅威 | 対策 |
|---|---|
| アクセスキーの漏えい | AWS Health の通知(`AWS_RISK_CREDENTIALS_EXPOSED`)や GuardDuty の検出を、EventBridge で受ける。キーを無効にして、CloudTrail で利用の履歴を確認する。長期のキーをやめて、ロールにする |
| 公開された S3 バケット | S3 のパブリックアクセスのブロック(アカウント全体にも設定できる)、Config ルール、Access Analyzer |
| 暗号化されていない S3 バケットやボリューム | 既定の暗号化、Config ルールと自動修復 |
| 安全でない Web 通信(HTTP) | ALB や CloudFront で HTTPS にリダイレクト、S3 のバケットポリシーで `aws:SecureTransport` を必須にする |

### 3. アラートと分析

- **CloudWatch Logs のメトリクスフィルター** は、ログの中の特定のパターンを数えて、メトリクスにします。そのメトリクスにアラームを付けて、SNS で通知します。
  - 例: CloudTrail のログから、ルートユーザーのサインインや、認証されていない API の呼び出しを検知します。
- **サブスクリプションフィルター** は、ログを Kinesis、Firehose、Lambda に流します。アカウントをまたいで、ログを中央に集めるときに使います。
- GuardDuty や Security Hub の検出結果は、EventBridge のイベントになります。重大度で絞って、SNS や Lambda に流します。
- **CloudWatch Logs のデータ保護ポリシー** で、ログの中の機密データを検出して、マスクできます。
- ログの保管期間(保持期間)は、コンプライアンスの要件に合わせます。

### 4. まとめ: よく出る判断

| 要件 | 選ぶもの |
|---|---|
| 全アカウントの API の操作を、中央に、改ざんの検知付きで保存 | CloudTrail の組織の証跡 + ログファイルの整合性の検証 |
| S3 のオブジェクトの読み書きを記録 | CloudTrail のデータイベント |
| 外部に共有されているリソースを見つける | IAM Access Analyzer |
| 不審な動きの検出を通知 | GuardDuty + EventBridge + SNS |
| ソフトウェアの脆弱性を継続的に検出 | Amazon Inspector |
| ルートユーザーのサインインにアラーム | CloudTrail → CloudWatch Logs → メトリクスフィルター → アラーム |
| 拒否された通信を SQL で調べる | VPC フローログ → S3 → Athena |
| 手作業で変更されたスタックを検出 | CloudFormation のドリフト検出 |
| 漏えいしたキーへの対応 | キーを無効化 + CloudTrail で利用の履歴を調査 |
| 設定の履歴と、ルールへの準拠 | AWS Config |

## 出典

- AWS KMS のキーのローテーション: https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html
- IAM のロールの引き受けとセッションポリシー: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_assumerole.html
- Control Tower のコントロールの種類: https://docs.aws.amazon.com/controltower/latest/controlreference/control-behavior.html
- StackSets の自動デプロイ: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-orgs-manage-auto-deployment.html
- StackSets の信頼されたアクセス: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-orgs-enable-trusted-access.html
- EKS CreateAccessEntry: https://docs.aws.amazon.com/eks/latest/APIReference/API_CreateAccessEntry.html
- KMS EnableKeyRotation: https://docs.aws.amazon.com/kms/latest/APIReference/API_EnableKeyRotation.html
- Secrets Manager のローテーションの方式: https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotation-strategy.html
- CloudFront で使う ACM の証明書: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html
- ACM のエクスポートできる証明書: https://docs.aws.amazon.com/acm/latest/userguide/acm-exportable-certificates.html
- AWS Secrets Manager のローテーション: https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html
- AWS Health と EventBridge: https://docs.aws.amazon.com/health/latest/ug/cloudwatch-events-health.html
- 公式の試験ガイド(分野 6): https://docs.aws.amazon.com/aws-certification/latest/devops-engineer-professional-02/devops-engineer-professional-02-domain6.html
