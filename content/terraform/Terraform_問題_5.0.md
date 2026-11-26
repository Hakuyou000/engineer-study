# Terraform 問題 5.0 Terraform のモジュール

対象: Terraform Associate(004) / 全20問 / すべてオリジナル問題
対応テキスト: `Terraform_5.0_モジュール.md`
解答・解説は末尾。

## 問題

### 5.1 Terraform がモジュールをどこから取得するか

**問1** `Terraform-5.0-001` ルートモジュールの説明として、正しいものはどれか。

- A. Terraform Registry に公開されたモジュール
- B. `modules/` ディレクトリの中のモジュール
- C. `terraform` コマンドを実行するディレクトリの設定
- D. プロバイダーが提供するモジュール

**問2** `Terraform-5.0-002` 公開の Terraform Registry のモジュールを指定する `source` の形式として、正しいものはどれか。

- A. `"aws/vpc"`
- B. `"hashicorp/vpc.zip"`
- C. `"registry://vpc"`
- D. `"名前空間/名前/プロバイダー"`(例: `"terraform-aws-modules/vpc/aws"`)

**問3** `Terraform-5.0-003` 同じリポジトリの `modules/network` ディレクトリにあるモジュールを使いたい。`source` の書き方として正しいものはどれか。

- A. `"local::modules/network"`
- B. `"./modules/network"`
- C. `"modules/network"`
- D. `"file://modules/network"`

**問4** `Terraform-5.0-004` HCP Terraform の組織 `example-org` のプライベートレジストリにある `vpc` モジュール(AWS 用)を指定する `source` はどれか。

- A. `"example-org/vpc/aws"`
- B. `"hcp/example-org/vpc"`
- C. `"app.terraform.io/example-org/vpc/aws"`
- D. `"private::example-org/vpc"`

**問5** `Terraform-5.0-005` `terraform init` でダウンロードされたリモートのモジュールが置かれる場所はどれか。

- A. `terraform.tfstate` の中
- B. `.terraform/providers/`
- C. `.terraform.lock.hcl` の中
- D. `.terraform/modules/`

### 5.2 モジュールの中の変数のスコープ

**問6** `Terraform-5.0-006` ルートモジュールで `variable "env"` を定義している。子モジュールの中のリソースで、この値を使いたい。正しい方法はどれか。

- A. 子モジュールにも `variable "env"` を定義し、親の `module` ブロックで `env = var.env` と渡す
- B. 子モジュールの中で `var.env` と書けば、親の変数が自動で使われる
- C. 環境変数 `TF_VAR_env` を設定すれば、子モジュールにも渡る
- D. 子モジュールの中で `parent.var.env` と書く

**問7** `Terraform-5.0-007` 子モジュール `network` の中に `resource "aws_vpc" "this"` がある。呼び出し元で、この VPC の ID を使いたい。正しい方法はどれか。

- A. 呼び出し元で `module.network.aws_vpc.this.id` と書く
- B. 子モジュールに `output "vpc_id" { value = aws_vpc.this.id }` を書き、呼び出し元で `module.network.vpc_id` と書く
- C. 呼び出し元で `data.network.vpc_id` と書く
- D. 呼び出し元で `aws_vpc.this.id` と書く

**問8** `Terraform-5.0-008` `module "network"` と `module "app"` は、どちらもルートモジュールから呼ばれている。`app` で `network` のサブネットの ID を使いたい。正しい方法はどれか。

- A. `app` に `depends_on = [module.network]` を書けば、値が見えるようになる
- B. ルートモジュールで、`app` の引数に `subnet_id = module.network.subnet_id` と渡す
- C. `app` の中で `module.network.subnet_id` と書く
- D. 2 つのモジュールを同じディレクトリに置く

**問9** `Terraform-5.0-009` 子モジュールの変数 `instance_type` に `default` がない。呼び出し元の `module` ブロックで、この引数を書かなかった。どうなるか。

- A. エラーになる。必須の引数として渡す必要がある
- B. 実行時に対話の画面で入力を求められる
- C. 親の同じ名前の変数が自動で使われる
- D. null が使われる

**問10** `Terraform-5.0-010` 子モジュールの中で定義したローカル値(`locals`)について、正しいものはどれか。

- A. 呼び出し元から `module.名前.local.名前` で参照できる
- B. state に出力として保存され、外から参照できる
- C. すべてのモジュールで共有される
- D. そのモジュールの中でだけ使える

### 5.3 設定の中でモジュールを使う

**問11** `Terraform-5.0-011` `module` ブロックで使える引数として、正しいものはどれか。(2つ選べ)

- A. `for_each`
- B. `provisioner`
- C. `providers`
- D. `connection`
- E. `lifecycle`

**問12** `Terraform-5.0-012` 次の設定で、`logs` のバケットのモジュールの出力 `arn` を参照する書き方はどれか。

```hcl
module "bucket" {
  source   = "./modules/bucket"
  for_each = toset(["logs", "backup"])
  name     = "example-${each.key}"
}
```

- A. `module.bucket.arn`
- B. `module.bucket["logs"].arn`
- C. `module.logs.arn`
- D. `module.bucket[0].arn`

**問13** `Terraform-5.0-013` 再利用するモジュールの書き方として、推奨されるものはどれか。

- A. すべてのリソースを 1 つの巨大なモジュールにまとめる
- B. プロバイダーの設定はルートモジュールで行い、子モジュールには引き継がせるか `providers` で渡す
- C. 変数を使わず、値をすべてモジュールの中に直接書く
- D. モジュールの中に `provider` ブロックを書き、リージョンを固定する

**問14** `Terraform-5.0-014` モジュールの標準の構成で、入力変数を書くファイルとして慣習的に使われる名前はどれか。

- A. `terraform.tfvars`
- B. `outputs.tf`
- C. `variables.tf`
- D. `main.tf`

**問15** `Terraform-5.0-015` モジュールの中のファイル名について、正しいものはどれか。

- A. ファイル名のアルファベット順に処理され、順番が依存関係になる
- B. `main.tf` という名前のファイルがないとエラーになる
- C. 1 つのモジュールには `.tf` ファイルを 1 つしか置けない
- D. Terraform はディレクトリの中の `.tf` ファイルをすべて読む。ファイル名は慣習である

### 5.4 モジュールのバージョンを管理する

**問16** `Terraform-5.0-016` `module` ブロックの `version` 引数が使えるモジュールはどれか。

- A. HTTP の URL のモジュール
- B. Git のリポジトリのモジュール
- C. ローカルのパスのモジュール
- D. 公開またはプライベートの Registry のモジュール

**問17** `Terraform-5.0-017` Git のリポジトリのモジュールの、タグ `v1.2.0` を使いたい。正しい書き方はどれか。

- A. `source = "git::https://example.com/vpc.git"` と `tag = "v1.2.0"`
- B. `source = "git::https://example.com/vpc.git?ref=v1.2.0"`
- C. `source = "git::https://example.com/vpc.git"` と `version = "1.2.0"`
- D. `source = "git::https://example.com/vpc.git@1.2.0"`

**問18** `Terraform-5.0-018` Registry のモジュールの `version` を `"~> 6.0"` にしている。制約の範囲で最新のバージョンに更新したい。実行するコマンドはどれか。

- A. `terraform init -upgrade`
- B. `terraform fmt`
- C. `terraform plan -refresh-only`
- D. `terraform state pull`

**問19** `Terraform-5.0-019` モジュールのバージョンについて、正しいものはどれか。

- A. モジュールのバージョンは `.terraform.lock.hcl` に記録されない。記録されるのはプロバイダーだけである
- B. モジュールにはバージョンを付けられない
- C. モジュールのバージョンは state にだけ記録される
- D. モジュールのバージョンは `.terraform.lock.hcl` に記録される

**問20** `Terraform-5.0-020` 本番の環境で、公開の Registry のモジュールを使う。推奨される `version` の書き方はどれか。

- A. `version` を書かず、常に最新を使う
- B. `version = ">= 0.0.0"` と書く
- C. `version = "latest"` と書く
- D. バージョンを固定するか、範囲を絞って書き、更新はテストしてから行う

## 解答・解説

### 問1 `Terraform-5.0-001`

**正解**: C

**テキスト**: 1. モジュールとは

ルートモジュールは、`terraform` コマンドを実行するディレクトリの設定です。すべての設定にはルートモジュールがあり、そこから `module` ブロックで呼ばれるものが子モジュールです。Registry に公開されているかどうかや、置き場所のディレクトリ名は関係ありません。

### 問2 `Terraform-5.0-002`

**正解**: D

**テキスト**: 2. source の書き方

公開の Terraform Registry のモジュールは `名前空間/名前/プロバイダー` の 3 つの部分で書きます。`terraform-aws-modules/vpc/aws` は、`terraform-aws-modules` という名前空間の、AWS 用の `vpc` モジュールです。

### 問3 `Terraform-5.0-003`

**正解**: B

**テキスト**: 2. source の書き方

ローカルのパスは `./` か `../` で始めます。`"modules/network"` と書くと、Terraform は Registry のアドレスとして解釈してしまいます。`local::` や `file://` という書き方はありません。

### 問4 `Terraform-5.0-004`

**正解**: C

**テキスト**: 2. source の書き方

プライベートレジストリのモジュールは、`ホスト名/組織名/名前/プロバイダー` の形で、先頭に HCP Terraform のホスト名 `app.terraform.io` を付けます。ホスト名がない `example-org/vpc/aws` は、公開の Registry を意味します。

### 問5 `Terraform-5.0-005`

**正解**: D

**テキスト**: 3. ダウンロードされる場所

`init`(または `get`)でダウンロードしたモジュールは `.terraform/modules/` に置かれます。プロバイダーは `.terraform/providers/` です。state とロックファイルには、モジュールのファイルは入りません。

### 問6 `Terraform-5.0-006`

**正解**: A

**テキスト**: 1. モジュールは閉じた箱

モジュールの中と外は、入力変数と出力だけでつながります。子モジュールは親の変数を直接見られないので、子に `variable "env"` を定義し、親の `module` ブロックで `env = var.env` と渡します。`TF_VAR_` の環境変数は、ルートモジュールの変数にだけ値を渡します。

### 問7 `Terraform-5.0-007`

**正解**: B

**テキスト**: 1. モジュールは閉じた箱

子モジュールの中のリソースは、外から直接は参照できません。子が `output` で公開した値だけを、`module.モジュール名.出力名` で参照できます。`aws_vpc.this` は子の中の名前なので、親から `aws_vpc.this.id` と書くと、親のリソースを探してエラーになります。

### 問8 `Terraform-5.0-008`

**正解**: B

**テキスト**: 1. モジュールは閉じた箱

兄弟のモジュール同士は、直接は参照できません。親(ルートモジュール)が `network` の出力を受け取り、`app` の入力変数に渡します。`depends_on` は順番を決めるだけで、値は見えるようになりません。

### 問9 `Terraform-5.0-009`

**正解**: A

**テキスト**: 2. 入力変数の必須と省略

モジュールの変数に `default` がなければ必須で、`module` ブロックに書かないとエラーになります。対話の画面で入力を求められるのは、ルートモジュールの変数だけです。親の同じ名前の変数が自動で渡されることもありません。

### 問10 `Terraform-5.0-010`

**正解**: D

**テキスト**: 1. モジュールは閉じた箱

ローカル値は、定義したモジュールの中でだけ使えます。外に値を見せるには、`output` で公開する必要があります。他のモジュールと自動で共有されることはありません。

### 問11 `Terraform-5.0-011`

**正解**: A、C

**テキスト**: 1. module ブロックで使える引数

`module` ブロックでは、`source`、`version`、入力変数のほか、`count`、`for_each`、`depends_on`、`providers` のメタ引数が使えます。`lifecycle`、`provisioner`、`connection` はリソースの中で使うもので、`module` ブロックには書けません。

### 問12 `Terraform-5.0-012`

**正解**: B

**テキスト**: 1. module ブロックで使える引数

`for_each` で呼んだモジュールは、キーで識別します。`module.bucket["logs"].arn` で、`logs` のインスタンスの出力を参照します。番号 `[0]` を使うのは `count` の場合です。キーを付けずに `module.bucket.arn` とは書けません。

### 問13 `Terraform-5.0-013`

**正解**: B

**テキスト**: 3. よい習慣

モジュールの中に `provider` ブロックを書くと、呼び出し元がリージョンなどを変えられず、再利用しにくくなります。プロバイダーの設定はルートモジュールで行い、子に引き継がせるか、`providers` で渡すのが推奨です。巨大なモジュールや、値の直接の記述も再利用を妨げます。

### 問14 `Terraform-5.0-014`

**正解**: C

**テキスト**: 2. 標準のモジュールの構成

慣習では、入力変数は `variables.tf`、リソースは `main.tf`、出力は `outputs.tf` に書きます。`terraform.tfvars` は変数に値を渡すファイルで、変数を定義するファイルではありません。

### 問15 `Terraform-5.0-015`

**正解**: D

**テキスト**: 2. 標準のモジュールの構成

Terraform は、ディレクトリの中の `.tf` ファイルをすべて読み、1 つの設定として扱います。`main.tf` などの名前は読みやすさのための慣習で、なくてもエラーにはなりません。処理の順番は、ファイル名ではなく参照による依存関係で決まります。

### 問16 `Terraform-5.0-016`

**正解**: D

**テキスト**: 1. version 引数

`version` 引数は、Registry(公開またはプライベート)のモジュールにだけ使えます。ローカルのパスのモジュールにはバージョンがなく、Git のモジュールは `source` の `?ref=` で指定します。HTTP の URL も、URL 自体でどのファイルかが決まります。

### 問17 `Terraform-5.0-017`

**正解**: B

**テキスト**: 1. version 引数

Git のモジュールは、`source` の最後に `?ref=タグ名`(ブランチやコミットでもよい)を付けて指定します。`version` は Registry のモジュール専用なので、Git には使えません。`@1.2.0` や `tag` という書き方はありません。

### 問18 `Terraform-5.0-018`

**正解**: A

**テキスト**: 2. バージョンを固定する理由と上げ方

`terraform init -upgrade` は、プロバイダーとモジュールを、制約の範囲で最新のバージョンに更新します。`-refresh-only` は state を実際のインフラに合わせる操作、`fmt` は書式の整形、`state pull` は state の取得です。

### 問19 `Terraform-5.0-019`

**正解**: A

**テキスト**: 2. バージョンを固定する理由と上げ方

`.terraform.lock.hcl` に記録されるのはプロバイダーのバージョンとハッシュだけで、モジュールは記録されません。モジュールのバージョンは `module` ブロックの `version` の制約で決まります。そのため、モジュールのバージョンも制約で固定しておくことが大切です。

### 問20 `Terraform-5.0-020`

**正解**: D

**テキスト**: 2. バージョンを固定する理由と上げ方

`version` を書かないと、新しく `init` する環境(CI や他のメンバー)や `init -upgrade` のときに最新のバージョンが使われ、モジュールの変更で予期しない差分が出るおそれがあります。本番ではバージョンを固定するか範囲を絞り、更新は検証してから行います。`>= 0.0.0` は書かないのと同じで、`latest` という書き方はありません。
