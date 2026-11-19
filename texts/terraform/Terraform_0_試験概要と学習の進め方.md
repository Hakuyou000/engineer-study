# Terraform 0 試験概要と学習の進め方

作成: 2026-11-19
対象: HashiCorp Certified: Terraform Associate(**004**)

Terraform Associate は、HashiCorp が実施する Terraform の基礎の資格です。Terraform でインフラをコードとして書き、作り、変え、消す一連の作業と、state(状態ファイル)やモジュール、HCP Terraform の基本を理解しているかが問われます。

## 1. 試験の概要

| 項目 | 内容 |
|---|---|
| 試験 | Terraform Associate(004)。2026-01-08 から。003 は終了しました |
| 対象のバージョン | Terraform 1.12 |
| 試験時間 | 1 時間 |
| 形式 | 選択式(1つを選ぶ問題、複数を選ぶ問題、正しいか誤りかを選ぶ問題) |
| 受験料 | US$70.50(税別)。再受験の無料の権利は付きません |
| 言語 | 英語のみ |
| 受験の方法 | オンラインでの監督付きの受験 |
| 前提 | なし。ターミナルの基本操作と、オンプレミスとクラウドの基本の理解があるとよい |
| 有効期間 | 2 年 |

> **【要確認】** 問題の数と合格点は、公式には公開されていません(問題の数は 57 問前後とする情報が多いです)。出題の割合も公開されていません。申し込む前に、HashiCorp 公式のページで確認してください。

- 試験は英語だけです。このテキストでは、試験に出る英語の用語(state、backend、workspace など)をそのまま使います。
- 有効期限の 6 か月前から、004 を受け直すと期限を延ばせます。上位の Terraform Infrastructure Engineer Professional に合格しても延長されます。

## 2. 出題の分野

公式の試験の範囲は 8 つの分野と、37 の小項目(1a、1b … のように番号と英字で表す)に分かれています。このテキストの節番号は、小項目の英字を数字に置き換えたものです(1a → 1.1、4f → 4.6)。

| 分野 | 内容 | テキスト |
|---|---|---|
| 1 | Infrastructure as Code(IaC)と Terraform | `Terraform_1.0_…` |
| 2 | Terraform の基本(プロバイダーと state) | `Terraform_2.0_…` |
| 3 | Terraform の基本のワークフロー | `Terraform_3.0_…` |
| 4 | Terraform の設定 | `Terraform_4.0_…` |
| 5 | Terraform のモジュール | `Terraform_5.0_…` |
| 6 | Terraform の state の管理 | `Terraform_6.0_…` |
| 7 | Terraform でのインフラの保守 | `Terraform_7.0_…` |
| 8 | HCP Terraform | `Terraform_8.0_…` |

| 小項目 | 節 | 内容 |
|---|---|---|
| 1a〜1c | 1.1〜1.3 | IaC とは何か、IaC の利点、マルチクラウドとハイブリッドクラウド |
| 2a〜2d | 2.1〜2.4 | プロバイダーのインストールとバージョン、プロバイダーの使われ方、複数のプロバイダー、state |
| 3a〜3g | 3.1〜3.7 | ワークフロー、init、validate、plan、apply、destroy、fmt |
| 4a〜4h | 4.1〜4.8 | resource と data、参照、変数と出力、複雑な型、式と関数、依存関係、カスタム条件、機密データ |
| 5a〜5d | 5.1〜5.4 | モジュールの取得元、変数のスコープ、モジュールの使い方、バージョン |
| 6a〜6d | 6.1〜6.4 | local バックエンド、state のロック、リモートの state、ドリフト |
| 7a〜7c | 7.1〜7.3 | import、state を調べる CLI、詳しいログ |
| 8a〜8d | 8.1〜8.4 | HCP Terraform でのインフラの作成、共同作業とガバナンス、ワークスペースとプロジェクト、連携の設定 |

## 3. 003 からの変更点

004 は 003 を土台にしています。次の 4 つの小項目が新しく加わりました。市販の教材の多くは 003 のままなので、この部分は特に公式の資料で確認しましょう。

| 小項目 | 内容 |
|---|---|
| 4f | `depends_on` と、`create_before_destroy` などの lifecycle のルールで依存関係を決める |
| 4g | 変数の `validation`、`precondition`、`postcondition`、`check` ブロックで設定を検証する |
| 4h | 機密データの扱い。Vault による秘密情報の管理、ephemeral(一時的な)値 |
| 8c | HCP Terraform のワークスペースとプロジェクトの整理 |

また、Terraform 1.12 が対象なので、次の比較的新しい機能も範囲に入ります。

- `import` ブロック(1.5〜)、`removed` ブロック(1.7〜)、`moved` ブロック
- ephemeral な変数、出力、リソース(1.10〜)、write-only の引数(1.11〜)
- S3 バックエンドの S3 だけでのロック `use_lockfile`(1.11〜。DynamoDB でのロックは非推奨)

## 4. この試験で問われること

暗記よりも、「どのコマンドを、どの順番で、何のために使うか」と「その結果 state と実際のインフラがどうなるか」を理解しているかが問われます。

| よく問われる観点 | 例 |
|---|---|
| コマンドの役割 | `terraform init` は何をダウンロードするか。`plan` は何も変えないか |
| state の扱い | state に何が入るか。チームで使うときどこに置くか。ロックは何を防ぐか |
| 設定の書き方 | `count` と `for_each` の違い。`depends_on` が必要な場面。変数の優先順位 |
| 変更の影響 | 引数を変えたとき、その場で更新されるか、作り直しになるか |
| HCP Terraform の機能 | ワークスペース、プロジェクト、変数セット、ポリシー、ドリフトの検出 |

## 5. 学習の進め方

1. **手を動かす**: Terraform をインストールし、AWS の無料枠(または Docker プロバイダー)で、リソースを作る → 変える → 消す、を何度も繰り返します。`plan` の出力の `+`、`~`、`-/+` の意味が自然に読めるようになるまで続けます。
2. **テキストを読む**: 分野 1 から順に読みます。分野 3(ワークフロー)と分野 4(設定)は出題が多く、他の分野の土台になるので、時間をかけます。
3. **問題を解く**: 各分野の問題を解き、間違えた問題はテキストの該当の節に戻ります。
4. **HCP Terraform を触る**: 無料の枠(管理するリソース 500 個まで)でアカウントを作り、ワークスペースを作って `cloud` ブロックで CLI からつなぎ、リモートで `plan` と `apply` を実行してみます。
5. **公式の資料で仕上げる**: HashiCorp の「Exam Content List」と「Sample Questions」に目を通し、知らない用語がないか確かめます。

## 6. 用語の対応

| 英語 | このテキストでの言い方 |
|---|---|
| configuration | 設定(`.tf` ファイルに書いたコード) |
| state | state(状態ファイル)。Terraform が管理しているリソースの記録 |
| provider | プロバイダー。クラウドなどの API と Terraform をつなぐプラグイン |
| backend | バックエンド。state を置く場所 |
| drift | ドリフト。Terraform の外で変更され、実際のインフラが state とずれた状態 |
| workspace | ワークスペース。CLI と HCP Terraform で意味が違う(分野 6 と 8) |

## 7. 演習環境の作り方

### 1. Terraform を入れる

試験の対象は Terraform 1.12 です。新しい版でも基本は同じですが、迷ったら 1.12 以降を使います。

| OS | 入れ方 |
|---|---|
| Windows | `winget install Hashicorp.Terraform` |
| Mac | `brew tap hashicorp/tap` の後に `brew install hashicorp/tap/terraform` |
| Linux | HashiCorp の公式のパッケージのリポジトリを追加して入れる |

```bash
terraform -version     # 入ったかを確かめる
```

エディターは VS Code に HashiCorp Terraform の拡張機能を入れると、書き方の誤りがその場で分かります。

### 2. まずは費用のかからない練習から

最初は、パソコンの中だけで動くプロバイダーで、init → plan → apply → destroy の流れに慣れます。

```hcl
terraform {
  required_version = ">= 1.12.0"
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

resource "local_file" "hello" {
  filename = "${path.module}/hello.txt"
  content  = "Hello, Terraform"
}
```

```bash
terraform init
terraform plan
terraform apply      # hello.txt ができる
terraform destroy    # hello.txt が消える
```

Docker を入れていれば、`kreuzwerger/docker` プロバイダーでコンテナを作る練習もできます(Docker のテキストを参照)。

### 3. AWS で試す

AWS で試すときは、先に AWS のテキスト(SAA 0 の「演習環境の作り方」)の費用の守りをしておきます。

- 認証情報は、`aws configure sso`(IAM Identity Center)か、環境変数で渡します。`.tf` ファイルには書きません。
- 最初は S3 のバケットや、VPC とサブネットのように、置いておくだけでは費用のかからないものから始めます。NAT ゲートウェイや RDS は時間の料金がかかります。
- 練習の最後には必ず `terraform destroy` を実行し、`terraform state list` が空になったことを確かめます。

### 4. HCP Terraform を試す

HCP Terraform の無料の枠では、管理するリソース 500 個まで使えます。`terraform login` でつなぎ、`cloud` ブロックで設定をワークスペースにつなぐと、plan と apply がリモートで動く様子を確かめられます。
