# Terraform 問題 2.0 Terraform の基本

対象: Terraform Associate(004) / 全24問 / すべてオリジナル問題
対応テキスト: `Terraform_2.0_Terraformの基本.md`
解答・解説は末尾。

## 問題

### 2.1 プロバイダーのインストールとバージョンの管理

**問1** `Terraform-2.0-001` 次の設定で、`version = "~> 5.3"` が許すプロバイダーのバージョンはどれか。

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.3"
    }
  }
}
```

- A. 5.3.0 以上、6.0.0 未満
- B. 5.3.0 だけ
- C. 5.3.0 以上、5.4.0 未満
- D. 5.3.0 以上のすべて

**問2** `Terraform-2.0-002` バージョンの制約 `~> 1.2.0` を満たすバージョンはどれか。

- A. 2.0.0
- B. 1.1.9
- C. 1.2.7
- D. 1.3.0

**問3** `Terraform-2.0-003` `terraform` ブロックの `required_version = ">= 1.12.0"` は、何のバージョンを制約するか。

- A. Terraform 本体(CLI)のバージョン
- B. 使っているモジュールのバージョン
- C. state のファイルの形式のバージョン
- D. AWS プロバイダーのバージョン

**問4** `Terraform-2.0-004` `required_providers` の `source = "hashicorp/aws"` について、正しいものはどれか。

- A. GitHub の hashicorp/aws リポジトリのソースコードを取得してビルドする
- B. HCP Terraform のプライベートレジストリから取得する
- C. ホスト名を省略しているので、公開の Terraform Registry(registry.terraform.io)から取得する
- D. ローカルのディレクトリ `hashicorp/aws` から読み込む

**問5** `Terraform-2.0-005` `.terraform.lock.hcl` の説明として、正しいものはどれか。(2つ選べ)

- A. 選ばれたプロバイダーのバージョンとハッシュ値を記録する
- B. バージョン管理システムにコミットして、チームで同じプロバイダーのバージョンを使う
- C. state のロックの情報を記録し、同時の apply を防ぐ
- D. `.terraform/` ディレクトリの中に作られ、コミットしない
- E. 使っているモジュールのバージョンを記録する

**問6** `Terraform-2.0-006` プロバイダーの制約は `~> 5.0` で、`.terraform.lock.hcl` には 5.40.0 が記録されている。Registry には 5.80.0 が公開されている。チームのメンバーが新しく clone して `terraform init` を実行した。使われるバージョンはどれか。

- A. 5.40.0
- B. エラーになる
- C. 5.80.0
- D. 5.0.0

**問7** `Terraform-2.0-007` 前の問題の状況で、制約の範囲の最新のバージョンに上げ、ロックファイルも更新したい。実行するコマンドはどれか。

- A. `terraform apply -refresh-only`
- B. `terraform get`
- C. `terraform fmt`
- D. `terraform init -upgrade`

**問8** `Terraform-2.0-008` 再利用されるモジュール(多くのルートモジュールから呼ばれる)の中で、プロバイダーのバージョンの制約を書くときの推奨として、最も適切なものはどれか。

- A. `< 5.0` のように上限だけを書く
- B. `>= 5.0` のように、必要な最低のバージョンだけを書く
- C. `= 5.40.0` のように 1 つのバージョンに固定する
- D. 制約を何も書かない

**問9** `Terraform-2.0-009` Terraform Registry のプロバイダーの区分のうち、HashiCorp 自身が提供し保守しているものはどれか。

- A. Official
- B. Partner
- C. Archived
- D. Community

### 2.2 Terraform がプロバイダーをどう使うか

**問10** `Terraform-2.0-010` Terraform 本体とプロバイダーの関係として、正しいものはどれか。

- A. すべてのプロバイダーは Terraform 本体に組み込まれている
- B. プロバイダーは Terraform 本体と同じバージョン番号でなければならない
- C. プロバイダーは別のプログラム(プラグイン)で、本体とは別にリリースされ、`terraform init` でダウンロードされる
- D. プロバイダーは HCP Terraform でしか使えない

**問11** `Terraform-2.0-011` `terraform init` でダウンロードされたプロバイダーが置かれる場所はどれか。

- A. 作業ディレクトリの `.terraform/providers/`
- B. Terraform をインストールしたディレクトリの `bin/`
- C. `.terraform.lock.hcl` の中
- D. 作業ディレクトリの `terraform.tfstate` の中

**問12** `Terraform-2.0-012` AWS のアクセスキーをプロバイダーに渡す方法として、最も適切なものはどれか。

- A. 環境変数や IAM ロールなど、設定ファイルの外から渡す
- B. アクセスキーを `terraform.tfstate` に書き込む
- C. `provider "aws"` ブロックに `access_key` と `secret_key` を直接書いて Git にコミットする
- D. 変数の既定値(`default`)にアクセスキーを書く

**問13** `Terraform-2.0-013` プロバイダーの役割として、正しいものはどれか。

- A. state を暗号化してリモートに保存する
- B. 設定ファイルの書式を整える
- C. 扱えるリソースとデータソースの種類を提供し、対象のサービスの API を呼んで作成・読み取り・更新・削除を行う
- D. HCL の構文をチェックする

**問14** `Terraform-2.0-014` `required_providers` に何も書かず、`resource "aws_instance" "web" {}` だけを書いて `terraform init` を実行した。どうなるか。

- A. エラーになり、何もダウンロードされない
- B. AWS CLI がインストールされていれば、それを使う
- C. すべてのプロバイダーをダウンロードする
- D. リソースの種類の先頭から `hashicorp/aws` を推測してダウンロードする

### 2.3 複数のプロバイダーを使う設定

**問15** `Terraform-2.0-015` 次の設定で、`aws_s3_bucket.b` が作られるリージョンはどれか。

```hcl
provider "aws" {
  region = "ap-northeast-1"
}

provider "aws" {
  alias  = "osaka"
  region = "ap-northeast-3"
}

resource "aws_s3_bucket" "b" {
  bucket = "example-b"
}
```

- A. ap-northeast-3
- B. ap-northeast-1
- C. 両方のリージョン
- D. エラーになる。alias が 2 つ必要である

**問16** `Terraform-2.0-016` 前の問題の設定で、バケットを大阪(ap-northeast-3)に作りたい。リソースに書く引数として正しいものはどれか。

- A. `provider = "aws.osaka"`
- B. `provider = aws.osaka`
- C. `region = osaka`
- D. `alias = "osaka"`

**問17** `Terraform-2.0-017` 1 つの設定の中で、AWS の S3 バケットと、random プロバイダーのランダムな名前を一緒に使いたい。正しいものはどれか。

- A. ワークスペースを 2 つ作る必要がある
- B. random プロバイダーは AWS プロバイダーの一部なので、追加は不要である
- C. 1 つの設定で使えるプロバイダーは 1 つだけなので、ディレクトリを分ける
- D. `required_providers` に両方を書けば、1 つの設定の中で一緒に使える

**問18** `Terraform-2.0-018` 呼び出し元で `alias = "osaka"` の AWS プロバイダーを定義している。子モジュールの中のリソースを、その大阪の設定で作りたい。`module` ブロックに書く設定として正しいものはどれか。

- A. `region = "ap-northeast-3"`
- B. `providers = { aws = aws.osaka }`
- C. `provider = aws.osaka`
- D. 子モジュールの中で `alias` を書き換える

### 2.4 Terraform が state をどう使い、管理するか

**問19** `Terraform-2.0-019` Terraform の state の主な目的として、最も適切なものはどれか。

- A. 設定ファイルのバックアップを取る
- B. プロバイダーのバイナリを保存する
- C. 変数の既定値を保存する
- D. 設定に書いたリソースと、実際に作られたリソースを対応付けて記録する

**問20** `Terraform-2.0-020` バックエンドを設定していないとき、state はどこに保存されるか。

- A. `.terraform.lock.hcl`
- B. HCP Terraform
- C. ホームディレクトリの `.terraformrc`
- D. 作業ディレクトリの `terraform.tfstate`

**問21** `Terraform-2.0-021` state の機密情報について、正しいものはどれか。

- A. state には機密情報は入らない
- B. `sensitive = true` を付けた値は state に保存されない
- C. Terraform は state を常に暗号化するので、何をしても安全である
- D. state には、パスワードなどの機密情報が平文で入ることがある。Git にコミットせず、暗号化とアクセス制御ができる場所に置く

**問22** `Terraform-2.0-022` state の内容を変える必要がある。推奨される方法はどれか。

- A. `terraform.tfstate` をテキストエディターで直接編集する
- B. state を削除して、`terraform apply` をやり直す
- C. `terraform state` のコマンドや、`moved`、`removed`、`import` のブロックを使う
- D. `.terraform.lock.hcl` を編集する

**問23** `Terraform-2.0-023` チームのメンバーが、誤ってローカルの `terraform.tfstate` を削除した。インフラは AWS 上にそのまま残っている。この状態で `terraform apply` を実行するとどうなるか。

- A. 何もしない
- B. 既存のリソースを自動で見つけて、state を作り直す
- C. 既存のリソースを管理下だと分からないので、同じリソースを新しく作ろうとする(名前の重複などでエラーになることもある)
- D. AWS 上のリソースをすべて削除する

**問24** `Terraform-2.0-024` `terraform plan` を実行したとき、Terraform が state を使って行うこととして正しいものはどれか。

- A. state に記録されたリソースの今の状態を読み取り(refresh)、設定と比べて差分を計算する
- B. state の内容をそのまま実際のインフラに書き込む
- C. state を削除してから計画を作る
- D. state を使わず、設定だけから計画を作る

## 解答・解説

### 問1 `Terraform-2.0-001`

**正解**: A

`~>` は「書いた一番右の数字だけを上げてよい」という意味です。
① `~> 5.3` の一番右は 3(マイナーバージョン)です。
② マイナーは 3 以上に上がってよいが、メジャーの 5 は変えられません。
③ そのため 5.3.0 以上、6.0.0 未満です。

5.4.0 未満と考えるのは、`~> 5.3.0` と同じだと読み違えた誤りです。5.3.0 だけなら `= 5.3.0`、上限なしなら `>= 5.3` と書きます。

### 問2 `Terraform-2.0-002`

**正解**: C

`~> 1.2.0` の一番右はパッチの 0 なので、パッチだけ上げてよく、範囲は 1.2.0 以上、1.3.0 未満です。
① 1.1.9 は 1.2.0 より小さいので範囲外です。
② 1.3.0 はマイナーが上がっているので範囲外です。
③ 1.2.7 はパッチだけが上がっているので範囲内です。
④ 2.0.0 はメジャーが上がっているので範囲外です。

### 問3 `Terraform-2.0-003`

**正解**: A

`required_version` は Terraform 本体(CLI)のバージョンの制約です。合わないバージョンの CLI で実行するとエラーになります。プロバイダーのバージョンは `required_providers` の `version` で、モジュールのバージョンは `module` ブロックの `version` で決めます。

### 問4 `Terraform-2.0-004`

**正解**: C

ソースアドレスは `[ホスト名/]名前空間/種類` の形で、ホスト名を省略すると公開の Terraform Registry(registry.terraform.io)を意味します。ソースコードをビルドしたり、ローカルのディレクトリを読んだりはしません。プライベートレジストリを使うには `app.terraform.io/組織名/名前` のようにホスト名を書きます。

### 問5 `Terraform-2.0-005`

**正解**: A、B

`.terraform.lock.hcl` は、`init` で選ばれたプロバイダーのバージョンとハッシュ値を記録するファイルで、作業ディレクトリの直下に作られます。Git にコミットすると、チームと CI で同じバージョンを使えます。モジュールのバージョンは記録しません。名前に lock とありますが、state のロック(同時の操作の防止)とは関係ありません。

### 問6 `Terraform-2.0-006`

**正解**: A

ロックファイルがあると、`terraform init` は制約の範囲に新しいバージョンがあっても、ロックファイルに記録されたバージョンを使います。そのため 5.40.0 です。5.80.0 に上がるのは `-upgrade` を付けたときです。

### 問7 `Terraform-2.0-007`

**正解**: D

`terraform init -upgrade` は、ロックファイルの記録を無視して、制約の範囲で最新のバージョンを選び直し、ロックファイルを更新します。`apply -refresh-only` は state を実際のインフラに合わせる操作、`get` はモジュールのダウンロード、`fmt` は書式の整形です。

### 問8 `Terraform-2.0-008`

**正解**: B

再利用されるモジュールで上限まで固定すると、呼び出し元のルートモジュールや他のモジュールの制約とぶつかり、バージョンを選べなくなることがあります。そのため、モジュールでは必要な最低のバージョン(`>=`)だけを書き、上限はルートモジュールで決めるのが推奨です。上限だけを書くと、必要な機能のない古いバージョンが選ばれるおそれがあります。

### 問9 `Terraform-2.0-009`

**正解**: A

Official は HashiCorp が提供・保守するプロバイダーです(`hashicorp/aws` など)。Partner は HashiCorp の確認を受けた企業が自社の製品向けに提供するもの、Community は個人やコミュニティが公開するものです。Archived は保守されなくなったものです。

### 問10 `Terraform-2.0-010`

**正解**: C

プロバイダーは本体とは別のプログラムで、本体とは別にリリースされ、バージョン番号も別々です。`terraform init` で Registry からダウンロードされます。HCP Terraform でなくても、ローカルの CLI で使えます。

### 問11 `Terraform-2.0-011`

**正解**: A

ダウンロードされたプロバイダーは、作業ディレクトリの `.terraform/providers/` に置かれます。`.terraform/` は Git にコミットしません。state はリソースの記録、ロックファイルはバージョンとハッシュの記録で、プロバイダーのバイナリは入りません。

### 問12 `Terraform-2.0-012`

**正解**: A

認証情報を `.tf` ファイルや変数の既定値に書くと、Git の履歴に残って漏えいします。環境変数、共有の認証情報ファイル、IAM ロール、HCP Terraform の動的な認証情報など、設定ファイルの外から渡します。state に書き込む仕組みはありません。

### 問13 `Terraform-2.0-013`

**正解**: C

プロバイダーは、扱えるリソースとデータソースの種類を提供し、作成・読み取り・更新・削除のときに対象のサービスの API を呼びます。state の保存はバックエンド、構文のチェックは `terraform validate`、書式の整形は `terraform fmt` の役割で、Terraform 本体が行います。

### 問14 `Terraform-2.0-014`

**正解**: D

`required_providers` がないと、Terraform はリソースの種類の先頭(`aws_instance` の `aws`)から、`hashicorp/aws` を推測してダウンロードします。HashiCorp 以外のプロバイダーは推測できないので、`source` を書く必要があります。AWS CLI は使いません。

### 問15 `Terraform-2.0-015`

**正解**: B

リソースに `provider` 引数がないと、alias のない既定のプロバイダーを使います。既定の設定は ap-northeast-1 なので、バケットは東京に作られます。alias の付いた設定は、`provider = aws.osaka` と明示したリソースだけが使います。

### 問16 `Terraform-2.0-016`

**正解**: B

リソースの `provider` 引数には、`<プロバイダー名>.<alias>` を引用符なしの参照で書きます。引用符で囲んだ文字列で書くのは Terraform 0.11 までの古い書き方で、今は使いません。`alias` はプロバイダーのブロックに書くもので、リソースの `region` という引数はこの用途には使いません。

### 問17 `Terraform-2.0-017`

**正解**: D

1 つの設定の中で、種類の違う複数のプロバイダーを一緒に使えます。`required_providers` に両方を書き、リソースの種類の先頭(`aws_`、`random_`)でどのプロバイダーを使うかが決まります。random は独立した `hashicorp/random` プロバイダーです。

### 問18 `Terraform-2.0-018`

**正解**: B

子モジュールに alias のある設定を渡すには、`module` ブロックの `providers` 引数で `{ 子モジュールの中での名前 = 呼び出し元の設定 }` を書きます。`provider`(単数)はリソースに書く引数です。子モジュールの中を書き換える必要はありません。

### 問19 `Terraform-2.0-019`

**正解**: D

state は、設定のリソース(`aws_instance.web`)と、実際に作られたリソース(`i-0abc…`)の対応表です。これがあるので、Terraform は何を管理しているかが分かり、差分を計算できます。設定のバックアップ、プロバイダーのバイナリ、変数の既定値は state の役割ではありません。

### 問20 `Terraform-2.0-020`

**正解**: D

バックエンドを設定していないと、local バックエンドが使われ、state は作業ディレクトリの `terraform.tfstate` に保存されます。HCP Terraform に置くには `cloud` ブロックが必要です。`.terraformrc` は CLI の設定ファイルです。

### 問21 `Terraform-2.0-021`

**正解**: D

state には、データベースの初期パスワードなど、機密情報が平文で入ることがあります。`sensitive = true` は画面への表示を隠すだけで、state には保存されます。Git にコミットせず、暗号化とアクセス制御ができるリモートのバックエンドに置きます。local バックエンドは暗号化しません。

### 問22 `Terraform-2.0-022`

**正解**: C

state を手で編集すると、形式が壊れたり、実際のインフラと合わなくなったりするおそれがあります。`terraform state mv` や `rm` などのコマンド、`moved`、`removed`、`import` のブロックを使うと、安全に変更できます。state を削除するとリソースの管理が分からなくなります。ロックファイルはプロバイダーのバージョンの記録です。

### 問23 `Terraform-2.0-023`

**正解**: C

state がないと、Terraform は AWS 上のリソースが自分の管理下だと分かりません。設定に書かれたリソースはまだないと判断して、新しく作ろうとします。名前が重複するリソースではエラーになります。既存のリソースを自動で見つけることはなく、管理下だと知らないので削除もしません。復旧するには、state のバックアップを戻すか、`import` で取り込みます。

### 問24 `Terraform-2.0-024`

**正解**: A

`plan` は、まず state に記録されたリソースの今の状態を API で読み取って(refresh)、その結果と設定を比べ、差分を計算します。state を使わずに計画を作ることはなく、state を削除したり、そのまま書き込んだりすることもありません。
