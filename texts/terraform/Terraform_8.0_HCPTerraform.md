# Terraform テキスト 8.0 HCP Terraform

対象: Terraform Associate(004)

**HCP Terraform**(旧 Terraform Cloud)は、HashiCorp が提供する、Terraform をチームで使うためのサービスです。state の保管、リモートでの実行、チームの権限、ポリシーなどを提供します。自社の環境に置く版は **Terraform Enterprise** と呼ばれます。この分野では、HCP Terraform で何ができ、どう組み立てるかが問われます。

## 8.1 HCP Terraform でインフラを作る

出題範囲: リモートでの実行、3 つのワークフロー、ワークスペースの変数、実行の流れ、実行モード。

### 1. HCP Terraform が提供するもの

| 機能 | 内容 |
|---|---|
| state の保管 | ワークスペースごとに、暗号化して保管し、版の履歴を残す。ロックも自動 |
| リモートでの実行 | `plan` と `apply` を HCP Terraform の環境で実行する。誰が実行しても同じ環境になる |
| 変数の管理 | 変数と環境変数を、機密の値も含めて保管する |
| 共同作業 | 実行の履歴、承認、通知、チームと権限 |
| ガバナンス | ポリシー(Sentinel、OPA)、プライベートレジストリ、監査 |

無料の枠(Free)では、管理するリソースが **500 個**まで使えます。それを超えるには有料のプランが必要です。

### 2. 3 つのワークフロー

| ワークフロー | 実行のきっかけ | 向いている場面 |
|---|---|---|
| **VCS 駆動** | ワークスペースに GitHub などのリポジトリをつなぐ。プルリクエストで plan、マージで apply | チームの標準の運用(GitOps) |
| **CLI 駆動** | 手元で `terraform plan` / `apply` を実行すると、HCP Terraform でリモートで実行され、結果が手元に表示される | 今までの CLI の操作のまま使いたい |
| **API 駆動** | 自前の CI などから API で設定をアップロードして実行する | 独自のパイプラインに組み込みたい |

- VCS 駆動では、プルリクエストを作ると **speculative plan**(計画を見るだけの実行。apply はできない)が実行され、結果がプルリクエストに表示されます。
- CLI 駆動でも、実行は HCP Terraform の環境で行われます。手元のファイルがアップロードされます。

VCS 駆動のワークフローで、プルリクエストとマージが何を起こすかを図にします。

```text
Pull request を作る
  |
  v
HCP Terraform: speculative plan を実行する(計画を見るだけ。apply はできない)
  |
  v
結果が Pull request に表示される。レビューする
  |
  | マージ
  v
HCP Terraform: plan を実行し、確認(または auto-apply)のあとで apply する
```

### 3. 実行(run)の流れ

```
plan → (run tasks、ポリシーのチェック、費用の見積もり) → 確認 → apply
```

- plan の後、ワークスペースの設定によって、外部のサービスの呼び出し(run tasks)、ポリシーのチェック、費用の見積もりが入ります。どれも **plan の後、apply の前**です。
- **apply には確認が必要**です(画面で「Confirm & Apply」)。ワークスペースで **auto-apply** を有効にすると、plan が成功したら自動で apply します。
- 1 つのワークスペースの実行は、順番に 1 つずつ行われます(キューに並ぶ)。

### 4. ワークスペースの変数

| 種類 | 用途 |
|---|---|
| Terraform の変数 | 設定の `variable` に値を渡す(`terraform.tfvars` の代わり) |
| 環境変数 | `AWS_ACCESS_KEY_ID` のような環境変数を、実行の環境に渡す |

- **Sensitive** にした変数は、保存した後は画面や API で値を見られず、ログにも表示されません。
- 手元のシェルの環境変数(`AWS_ACCESS_KEY_ID` など)は、リモートの実行には渡されません。リモートの実行で必要な値は、ワークスペースの変数(または変数セット)で設定します。

### 5. 実行モード

| モード | 動き |
|---|---|
| Remote(既定) | plan と apply を HCP Terraform の環境で実行する |
| Local | 実行は手元で行い、HCP Terraform は state の保管だけに使う |
| Agent | 自社のネットワークの中に置いたエージェントで実行する(プライベートなネットワークのリソースを扱うとき) |

## 8.2 HCP Terraform の共同作業とガバナンスの機能

出題範囲: 組織、チームと権限、ポリシー(Sentinel、OPA)、プライベートレジストリ、ヘルスアセスメント、explorer と change requests、run tasks、通知。

### 1. 組織、チーム、権限

- **組織(organization)** が一番上の単位です。その中にプロジェクト、ワークスペース、チームがあります。
- **チーム**に権限を与え、ユーザーをチームに入れます。権限は組織、プロジェクト、ワークスペースの単位で与えます。
  - ワークスペースの主な権限の例: Read(読むだけ)、Plan(plan まで)、Write(apply まで)、Admin(設定の変更まで)
- **owners** チームは、組織のすべてを管理できる特別なチームです。
- SSO(シングルサインオン)で、会社の ID 基盤と連携できます。

### 2. ポリシー(policy as code)

インフラの変更が会社のルールに合っているかを、**plan の後、apply の前**に自動でチェックします。

| 項目 | 内容 |
|---|---|
| 書く言語 | **Sentinel**(HashiCorp の言語)、または **OPA**(Open Policy Agent。Rego で書く) |
| ポリシーセット | ポリシーをまとめたもの。組織全体、または特定のプロジェクトやワークスペースに適用する |
| 例 | 「EC2 のインスタンスタイプは許可したものだけ」「S3 は暗号化が必須」「タグ Owner が必須」 |

違反したときの扱い(**強制のレベル**):

| 言語 | レベル | 違反したとき |
|---|---|---|
| Sentinel | advisory | 警告だけ。apply できる |
| Sentinel | soft-mandatory | 止まるが、上書き(override)の権限を持つ人が上書きすれば apply できる |
| Sentinel | hard-mandatory | 止まる。上書きできない。ポリシーを満たすまで apply できない |
| OPA | advisory | 警告だけ。apply できる |
| OPA | mandatory | 止まる。ポリシーセットで上書きを許可していれば、権限を持つ人が上書きできる |

Sentinel の 3 つのレベル(特に soft と hard の違い)がよく問われます。

### 3. プライベートレジストリ

組織の中だけで使うモジュールとプロバイダーを公開する場所です。承認したモジュールを配り、組織の標準の構成を使ってもらえます。`source = "app.terraform.io/<組織>/<名前>/<プロバイダー>"` で使います(分野 5)。

### 4. ヘルスアセスメント(ドリフトの検出と継続的な検証)

ワークスペースを定期的に自動でチェックします(有料のプランの機能)。

| チェック | 内容 |
|---|---|
| **ドリフトの検出** | 実際のインフラが state から変わっていないか(Terraform の外での変更) |
| **継続的な検証** | `check` ブロック、`precondition`、`postcondition` の条件が今も満たされているか(証明書の期限切れなど) |

問題が見つかると、ワークスペースに表示され、通知を送れます。インフラを自動で直すわけではありません。

### 5. explorer と change requests

- **explorer**: 組織のすべてのワークスペースの情報(使っている Terraform やモジュールやプロバイダーのバージョン、ドリフトの状態など)を横断して調べる画面です。
- **change requests**: explorer などで見つけた「対応が必要なこと」(古いモジュールのバージョンの更新など)を、そのワークスペースの作業項目として記録し、担当のチームに知らせる機能です。対応が終わったら archive します。

### 6. その他の機能

| 機能 | 内容 |
|---|---|
| run tasks | plan の後などに、外部のサービス(セキュリティのスキャン、費用の管理など)を呼んで結果を確かめる |
| 通知 | 実行の開始・完了・失敗などを、Slack、メール、Webhook などで知らせる |
| 監査ログ | 誰が何をしたかの記録(有料のプラン) |

## 8.3 HCP Terraform のワークスペースとプロジェクトを整理して使う

出題範囲: ワークスペースの中身、CLI のワークスペースとの違い、プロジェクト、変数セット、run triggers。

### 1. HCP Terraform のワークスペース

**ワークスペース**は、1 つのインフラの単位を管理する入れ物です。

| 1 つのワークスペースが持つもの |
|---|
| 1 つの Terraform の設定(リポジトリやディレクトリ) |
| その state(版の履歴つき) |
| 変数と環境変数 |
| 実行の履歴 |
| 設定(実行モード、auto-apply、VCS の接続、権限など) |

一般的には、**アプリ(またはインフラの部品)× 環境**ごとに 1 つ作ります(例: `network-prod`、`network-dev`、`app-prod`)。大きすぎる 1 つの state にしないことで、変更の影響範囲を小さくし、権限も分けられます。

| | CLI のワークスペース | HCP Terraform のワークスペース |
|---|---|---|
| 分けるもの | state だけ | state、変数、権限、実行の履歴、設定 |
| 認証情報 | 共有 | ワークスペースごとに分けられる |
| 用途 | 同じ設定の一時的なコピー | 環境やチームごとの独立した管理の単位 |

### 2. プロジェクト

**プロジェクト**は、関係するワークスペースをまとめるフォルダーのようなものです。

```text
組織(example-org)
+-- プロジェクト: networking
|   +-- network-dev
|   +-- network-prod
+-- プロジェクト: payments
    +-- payments-api-dev
    +-- payments-api-prod
```

- チームの権限を**プロジェクトの単位**で与えられます。新しいワークスペースを追加しても、権限を一つずつ設定しなくて済みます。
- 変数セットやポリシーセットも、プロジェクトに適用できます。
- 組織には最初から **Default Project** があり、プロジェクトを指定しないワークスペースはそこに入ります。

### 3. 変数セット

複数のワークスペースで共通の変数(クラウドの認証情報、共通のタグなど)をまとめたものです。

- 組織全体、特定のプロジェクト、特定のワークスペースに適用できます。
- 同じ変数を何十ものワークスペースに一つずつ設定しなくて済みます。

### 4. ワークスペースの間の連携

| 機能 | 内容 |
|---|---|
| **run triggers** | あるワークスペースの apply が成功したら、別のワークスペースの実行を自動で始める(例: ネットワークが変わったらアプリも plan) |
| `tfe_outputs` データソース / `terraform_remote_state` | 別のワークスペースの出力を読む。`tfe_outputs` は出力だけを読む権限で済む |

run triggers で、ワークスペースの実行がつながる流れを図にします。

```text
[network-prod] で apply が成功する
  |
  | run trigger
  v
[app-prod] の実行が自動で始まる(plan から)
```

## 8.4 HCP Terraform との連携を設定して使う

出題範囲: `terraform login`、`cloud` ブロック、state の移行、VCS の連携、動的な認証情報。

### 1. CLI から使う手順

1. **`terraform login`** を実行し、ブラウザで API トークンを作ります。トークンは手元の `credentials.tfrc.json` に保存されます。
2. 設定に **`cloud` ブロック**を書きます。
3. **`terraform init`** を実行します。local の state があれば、HCP Terraform に移すか質問されます。
4. `terraform plan` / `apply` を実行すると、リモートで実行されます。

CLI 駆動で、手元とリモートの間で何が起こるかを図にします。

```text
local: terraform plan または apply を実行する
  |
  | 手元の設定のファイルが、HCP Terraform にアップロードされる
  v
HCP Terraform: ワークスペースで plan と apply を実行する(既定の Remote モード)
  |
  | 実行の出力が返る
  v
local: 結果が手元の画面に表示される
```

```hcl
terraform {
  cloud {
    organization = "example-org"

    workspaces {
      name    = "network-prod"
      project = "networking"
    }
  }
}
```

| 書き方 | 意味 |
|---|---|
| `workspaces { name = "..." }` | 1 つのワークスペースを使う |
| `workspaces { tags = ["app"] }` | そのタグの付いた複数のワークスペースから、`terraform workspace select` で選んで使う |
| `hostname` | Terraform Enterprise を使うときのホスト名(既定は `app.terraform.io`) |

組織やワークスペースの名前は、環境変数 `TF_CLOUD_ORGANIZATION`、`TF_WORKSPACE` でも渡せます。

### 2. VCS との連携

- 組織に GitHub、GitLab、Bitbucket、Azure DevOps などの VCS プロバイダーを登録し、ワークスペースにリポジトリ(とブランチ、ディレクトリ)をつなぎます。
- プルリクエストで speculative plan、既定のブランチへのマージで plan と apply(確認または auto-apply)が実行されます。

### 3. 動的なプロバイダーの認証情報

**動的なプロバイダーの認証情報(dynamic provider credentials)** は、HCP Terraform が実行のたびに、OIDC という仕組みでクラウド(AWS、Azure、Google Cloud)や Vault から**有効期限の短い認証情報**をもらう機能です。

- ワークスペースに長期のアクセスキーを保存しなくて済みます。漏えいの危険が減ります。
- クラウド側で、HCP Terraform を信頼する設定(AWS なら IAM の OIDC プロバイダーとロール)をしておき、ワークスペースに環境変数(例: `TFC_AWS_PROVIDER_AUTH = true`、`TFC_AWS_RUN_ROLE_ARN`)を設定します。

### 4. HCP Terraform 自体を Terraform で管理する

`hashicorp/tfe` プロバイダーで、ワークスペース、チーム、変数、ポリシーセットなどを Terraform のコードで管理できます。

### 5. まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| CLI から HCP Terraform にログインする | `terraform login` |
| 設定を HCP Terraform のワークスペースにつなぐ | `terraform` ブロックの `cloud` ブロック → `terraform init` |
| プルリクエストで plan だけを見る | VCS 駆動の speculative plan |
| apply の前に会社のルールを確かめる | Sentinel / OPA のポリシー |
| 違反しても上書きできるレベル | soft-mandatory |
| ワークスペースをまとめ、権限をまとめて与える | プロジェクト |
| 共通の変数を複数のワークスペースに配る | 変数セット |
| 長期のアクセスキーを置かずにクラウドを操作する | 動的なプロバイダーの認証情報(OIDC) |
| ドリフトを定期的に見つける | ヘルスアセスメント |
| 前のワークスペースの apply の後に自動で実行する | run triggers |
