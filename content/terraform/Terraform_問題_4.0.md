# Terraform 問題 4.0 Terraform の設定

対象: Terraform Associate(004) / 全36問 / すべてオリジナル問題
対応テキスト: `Terraform_4.0_Terraformの設定.md`
解答・解説は末尾。

## 問題

### 4.1 resource と data のブロック

**問1** `Terraform-4.0-001` `data` ブロック(データソース)の説明として、正しいものはどれか。

- A. 変数の既定値を決める
- B. state を別の場所に保存する
- C. 新しいリソースを作成し、Terraform で管理する
- D. Terraform の外にある既存の情報を読み取るだけで、作成も変更もしない

**問2** `Terraform-4.0-002` 最新の Ubuntu の AMI の ID を調べて、EC2 インスタンスの作成に使いたい。AMI は自分で作らない。使うブロックはどれか。

- A. `data "aws_ami"`
- B. `resource "aws_ami"`
- C. `output "aws_ami"`
- D. `variable "aws_ami"`

**問3** `Terraform-4.0-003` 次の設定で `terraform destroy` を実行した。削除されるものはどれか。

```hcl
data "aws_vpc" "shared" {
  tags = { Name = "shared-vpc" }
}

resource "aws_subnet" "app" {
  vpc_id     = data.aws_vpc.shared.id
  cidr_block = "10.0.5.0/24"
}
```

- A. サブネットだけ
- B. VPC だけ
- C. 何も削除されない
- D. VPC とサブネットの両方

**問4** `Terraform-4.0-004` `resource "aws_instance" "web" { … }` のリソースのアドレスはどれか。

- A. `aws.instance.web`
- B. `aws_instance.web`
- C. `resource.web`
- D. `web`

### 4.2 リソースの属性の参照と、リソース同士の参照

**問5** `Terraform-4.0-005` データソース `data "aws_vpc" "main"` の `id` 属性を参照する正しい書き方はどれか。

- A. `${aws_vpc.main}.id`
- B. `data.main.id`
- C. `data.aws_vpc.main.id`
- D. `aws_vpc.main.id`

**問6** `Terraform-4.0-006` 子モジュール `module "network"` の出力 `vpc_id` を、呼び出し元のリソースで使いたい。正しい書き方はどれか。

- A. `module.network.vpc_id`
- B. `network.vpc_id`
- C. `output.network.vpc_id`
- D. `module.network.aws_vpc.main.id`

**問7** `Terraform-4.0-007` 次の設定で、サブネットと VPC の作成の順番はどうなるか。

```hcl
resource "aws_subnet" "a" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}
```

- A. `depends_on` がないので、同時に作られてエラーになる
- B. 順番は毎回ランダムである
- C. 参照から依存関係が判断され、VPC が先に作られる
- D. ファイルに先に書かれているサブネットが先に作られる

**問8** `Terraform-4.0-008` `count = 3` で作った `aws_instance.web` の、すべてのインスタンスの ID をリストで得る書き方はどれか。

- A. `aws_instance.web.all.id`
- B. `aws_instance.web.id`
- C. `aws_instance.web[3].id`
- D. `aws_instance.web[*].id`

### 4.3 変数と出力

**問9** `Terraform-4.0-009` 変数 `instance_type` に、次の 4 つの方法で値を渡した。使われる値はどれか。

- `default = "t3.micro"`
- `terraform.tfvars` に `instance_type = "t3.small"`
- 環境変数 `TF_VAR_instance_type=t3.medium`
- コマンド `terraform apply -var="instance_type=t3.large"`

- A. t3.micro
- B. t3.small
- C. t3.large
- D. t3.medium

**問10** `Terraform-4.0-010` 変数 `env` に、環境変数 `TF_VAR_env=dev` と、`terraform.tfvars` の `env = "prod"` の 2 つで値を渡した。`-var` は使っていない。使われる値はどれか。

- A. prod
- B. エラーになる
- C. 実行時に入力を求められる
- D. dev

**問11** `Terraform-4.0-011` `default` のない変数に、どこからも値を渡さずに `terraform plan` を実行した。どうなるか。

- A. その変数を使うリソースが無視される
- B. null が使われる
- C. 空の文字列が使われる
- D. 対話の画面で値の入力を求められる

**問12** `Terraform-4.0-012` `prod.tfvars` という名前のファイルの変数の値を使いたい。正しいものはどれか。

- A. 同じディレクトリに置けば自動で読まれる
- B. `terraform init -var-file=prod.tfvars` でだけ指定できる
- C. `-var-file=prod.tfvars` で指定する
- D. ファイル名を `variables.tf` に変える必要がある

**問13** `Terraform-4.0-013` ローカル値について、正しいものはどれか。

- A. コマンドラインの `-var` で値を上書きできる
- B. `local` ブロックで定義し、`locals.名前` で参照する
- C. 子モジュールに自動で渡される
- D. `locals` ブロックで定義し、`local.名前` で参照する

**問14** `Terraform-4.0-014` スクリプトで、出力 `web_ip` の値を、引用符などの装飾なしで取り出したい。正しいコマンドはどれか。

- A. `terraform console -raw web_ip`
- B. `terraform output -raw web_ip`
- C. `terraform state show web_ip`
- D. `terraform show web_ip`

### 4.4 複雑な型

**問15** `Terraform-4.0-015` 要素の順番がなく、同じ値が重複しないコレクション型はどれか。

- A. `object`
- B. `tuple`
- C. `list`
- D. `set`

**問16** `Terraform-4.0-016` `{ name = "web", port = 80, public = true }` のように、属性ごとに型が違う値を受け付ける変数の型として、最も適切なものはどれか。

- A. `object({ name = string, port = number, public = bool })`
- B. `set(string)`
- C. `list(any)`
- D. `map(string)`

**問17** `Terraform-4.0-017` 次の変数で、`servers` に `{ web = { instance_type = "t3.micro" } }` を渡した。`servers["web"].disk_gb` の値はどれか。

```hcl
variable "servers" {
  type = map(object({
    instance_type = string
    disk_gb       = optional(number, 20)
  }))
}
```

- A. null
- B. 20
- C. エラーになる
- D. 0

**問18** `Terraform-4.0-018` `tuple` 型の説明として、正しいものはどれか。

- A. 位置ごとに型が決まった、順番のある値の並びである
- B. 順番がなく、重複がない
- C. 1 つの文字列である
- D. キーと値の組の集まりで、すべての値が同じ型である

### 4.5 式と関数で動的な設定を書く

**問19** `Terraform-4.0-019` IAM ユーザーを `count` でリスト `["alice", "bob", "carol"]` から作っている。`bob` だけを削除するためにリストから外した。起きることとして正しいものはどれか。

- A. 番号がずれるため、carol のユーザーが bob の位置(番号 1)に変わり、意図しない変更や作り直しが起きる
- B. bob だけが削除される
- C. 3 人すべてが削除される
- D. 何も変わらない

**問20** `Terraform-4.0-020` IAM ユーザーを `count` でリスト `var.users`(`["alice", "bob", "carol"]`)から作っている。途中の要素を外すと番号がずれて、ほかのユーザーまで作り直しになるのを避けるため、ユーザー名をキーにしてリソースを作りたい。最も適切な書き方はどれか。

- A. `depends_on = var.users`
- B. `count = length(var.users)`
- C. `dynamic "users" { for_each = var.users }`
- D. `for_each = toset(var.users)`

**問21** `Terraform-4.0-021` `for_each = toset(["alice", "bob"])` で作ったリソースの中で、`each.key` と `each.value` の値について正しいものはどれか。

- A. `each.key` はユーザー名、`each.value` は null
- B. `each.key` は 0 と 1、`each.value` はユーザー名
- C. どちらもユーザー名
- D. 集合は `for_each` に使えない

**問22** `Terraform-4.0-022` 次の式の値はどれか。

```hcl
var.env == "prod" ? "m5.large" : "t3.micro"
```

`var.env` は `"dev"` である。

- A. "m5.large"
- B. エラーになる
- C. "t3.micro"
- D. true

**問23** `Terraform-4.0-023` セキュリティグループの中の `ingress` ブロックを、ポートのリストの要素の数だけ繰り返して作りたい。使う機能はどれか。

- A. `depends_on`
- B. `locals`
- C. `dynamic` ブロック
- D. `count`

**問24** `Terraform-4.0-024` 次の式の値はどれか。

```hcl
[for n in ["web", "db"] : upper(n)]
```

- A. `["WEB", "DB"]`
- B. `{ web = "WEB", db = "DB" }`
- C. `"WEB,DB"`
- D. `["web", "db"]`

**問25** `Terraform-4.0-025` 次の式の値はどれか。

```hcl
merge({ env = "dev", owner = "a" }, { env = "prod" })
```

- A. `{ env = "dev", owner = "a" }`
- B. エラーになる。キーが重複している
- C. `{ env = "prod", owner = "a" }`
- D. `{ env = "prod" }`

**問26** `Terraform-4.0-026` 関数や式の結果を、リソースを作らずに対話の画面で試したい。使うコマンドはどれか。

- A. `terraform validate`
- B. `terraform show`
- C. `terraform graph`
- D. `terraform console`

**問27** `Terraform-4.0-027` Terraform の関数について、正しいものはどれか。

- A. 関数は `data` ブロックの中でしか使えない
- B. `function` ブロックで、自分で関数を定義できる
- C. 組み込み関数を使う。自分で関数を定義することはできない
- D. 関数を使うには、関数用のプロバイダーが必ず必要である

### 4.6 リソースの依存関係を定義する

**問28** `Terraform-4.0-028` `depends_on` を使うべき場面として、最も適切なものはどれか。

- A. EC2 のアプリが起動時に S3 を使うので IAM のポリシーが先に必要だが、インスタンスの引数はポリシーを参照していないとき
- B. 変数の値を他のリソースに渡すとき
- C. すべてのリソースに、念のため付けておく
- D. サブネットが VPC の `id` を参照しているとき

**問29** `Terraform-4.0-029` EC2 インスタンスの AMI を変えると作り直しになる。新しいインスタンスを先に作ってから古いものを削除し、停止時間を減らしたい。設定するものはどれか。

- A. `depends_on = [aws_instance.web]`
- B. `lifecycle { create_before_destroy = true }`
- C. `lifecycle { prevent_destroy = true }`
- D. `lifecycle { ignore_changes = [ami] }`

**問30** `Terraform-4.0-030` 本番のデータベースを、誤った変更で削除されないようにしたい。削除する計画になったらエラーにする設定はどれか。

- A. `count = 1`
- B. `sensitive = true`
- C. `lifecycle { prevent_destroy = true }`
- D. `lifecycle { create_before_destroy = true }`

**問31** `Terraform-4.0-031` 別のチームのツールが EC2 のタグを自動で付け替える。そのたびに Terraform がタグを元に戻そうとするのを止めたい。設定するものはどれか。

- A. `depends_on = [tags]`
- B. `lifecycle { prevent_destroy = true }`
- C. `lifecycle { ignore_changes = [tags] }`
- D. `lifecycle { replace_triggered_by = [tags] }`

### 4.7 カスタム条件で設定を検証する

**問32** `Terraform-4.0-032` 変数 `env` に `dev`、`stg`、`prod` 以外の値が渡されたら、plan の最初でエラーにしたい。使うものはどれか。

- A. 変数の `validation` ブロック
- B. `sensitive = true`
- C. `depends_on`
- D. `check` ブロック

**問33** `Terraform-4.0-033` `check` ブロックの条件を満たさなかったときの動作として、正しいものはどれか。

- A. state が元に戻る
- B. 警告が表示されるが、plan と apply は止まらない
- C. エラーで plan と apply が止まる
- D. 該当のリソースが自動で作り直される

**問34** `Terraform-4.0-034` リソースを作った後に、作られたリソースの属性(`self.public_dns` など)が期待どおりかを確かめ、満たさなければエラーにしたい。使うものはどれか。

- A. `precondition`
- B. `postcondition`
- C. `ignore_changes`
- D. 変数の `validation`

### 4.8 機密データの扱いのベストプラクティス

**問35** `Terraform-4.0-035` 変数に `sensitive = true` を付けた。正しいものはどれか。

- A. 値は state に保存されない
- B. plan と apply の画面で値が隠されるが、state には平文で保存される
- C. 値は暗号化されて state に保存される
- D. 値を他のリソースに渡せなくなる

**問36** `Terraform-4.0-036` データベースのパスワードを、state に一切残さずにリソースに渡したい。Terraform 1.11 以降で使える方法として、最も適切なものはどれか。

- A. パスワードを `terraform.tfvars` に書いて Git にコミットする
- B. Vault のデータソース(`data` ブロック)で読み、通常の引数に渡す
- C. ephemeral リソースで秘密情報を取得し、write-only の引数(例: `password_wo`)に渡す
- D. 変数に `sensitive = true` を付けて、通常の `password` の引数に渡す

## 解答・解説

### 問1 `Terraform-4.0-001`

**正解**: D

データソースは、Terraform の外にある既存の情報(最新の AMI、既存の VPC など)を読み取るだけです。作成、変更、削除はしません。作成して管理するのは `resource` ブロックです。

### 問2 `Terraform-4.0-002`

**正解**: A

AMI を作るのではなく、既存の AMI の情報を調べたいので、データソース `data "aws_ami"` を使います。`resource "aws_ami"` は新しく AMI を作るためのもので、変数と出力は値の受け渡しに使います。

### 問3 `Terraform-4.0-003`

**正解**: A

`destroy` が削除するのは、Terraform が `resource` として作成・管理しているものだけです。
① `data "aws_vpc"` は既存の VPC を読んでいるだけなので、削除されません。
② `resource "aws_subnet"` は Terraform が作ったものなので、削除されます。

VPC まで削除されると考えるのは、データソースもリソースと同じく管理していると誤解したものです。

### 問4 `Terraform-4.0-004`

**正解**: B

リソースのアドレスは、`種類.名前` の形で、ここでは `aws_instance.web` です。名前の `web` だけでは、別の種類のリソースと区別できません。`resource.` という書き方はありません。

### 問5 `Terraform-4.0-005`

**正解**: C

データソースを参照するときは、先頭に `data.` を付けて `data.種類.名前.属性` と書きます。`aws_vpc.main.id` は、同じ名前の resource を参照する書き方になります。参照だけなら `${}` は使いません。

### 問6 `Terraform-4.0-006`

**正解**: A

子モジュールの出力は `module.モジュール名.出力名` で参照します。子モジュールの中のリソースを、`module.network.aws_vpc.main.id` のように直接参照することはできません。参照できるのは、子モジュールが `output` で公開した値だけです。

### 問7 `Terraform-4.0-007`

**正解**: C

サブネットが `aws_vpc.main.id` を参照しているので、Terraform は VPC → サブネットの順番が必要だと自動で判断します(暗黙の依存関係)。ファイルに書いた順番は関係なく、参照で表せる依存関係には `depends_on` は不要です。

### 問8 `Terraform-4.0-008`

**正解**: D

**入力の別解**: `aws_instance.web.*.id`

スプラット式 `[*]` を使うと、全要素の属性をリストにできます。`aws_instance.web[*].id` は、3 つのインスタンスの ID のリストです。count のリソースに `.id` を直接付けることはできず、番号は 0 から始まるので `[3]` は 4 つ目を指し、範囲外です。

### 問9 `Terraform-4.0-009`

**正解**: C

値の優先順位は、弱い方から `default` → 環境変数 `TF_VAR_` → `terraform.tfvars` → `*.auto.tfvars` → コマンドラインの `-var` と `-var-file` の順です。
① 最も強いのはコマンドラインの `-var` です。
② そのため t3.large が使われます。

t3.medium を選ぶのは、環境変数がいちばん強いと誤解したものです。環境変数は `terraform.tfvars` より弱い位置にあります。

### 問10 `Terraform-4.0-010`

**正解**: A

環境変数 `TF_VAR_` は、`terraform.tfvars` より先に読まれるので弱く、後から読まれる `terraform.tfvars` の値が優先されます。そのため prod です。値が複数あってもエラーにはならず、どこかで値が渡されているので入力も求められません。

### 問11 `Terraform-4.0-011`

**正解**: D

`default` がなく、どこからも値が渡されない変数は、実行時に対話の画面で入力を求められます。`-input=false` を付けている場合や CI では、エラーになります。空の文字列や null が自動で使われることはありません。

### 問12 `Terraform-4.0-012`

**正解**: C

自動で読まれるのは `terraform.tfvars`、`terraform.tfvars.json`、`*.auto.tfvars`、`*.auto.tfvars.json` だけです。`prod.tfvars` のような名前は、`plan` や `apply` の `-var-file=prod.tfvars` で指定します。ファイル名を `variables.tf` にすると、値ではなく設定として読まれてしまいます。

### 問13 `Terraform-4.0-013`

**正解**: D

ローカル値は `locals`(複数形)のブロックで定義し、`local.名前`(単数形)で参照します。設定の中の式に名前を付けるもので、`-var` で外から値を渡すことはできません。子モジュールに渡すには、子モジュールの変数として渡す必要があります。

### 問14 `Terraform-4.0-014`

**正解**: B

`terraform output -raw 名前` は、1 つの出力の値を引用符なしの文字列で出します。スクリプトで値を使うのに向いています。`show` と `state show` は state のリソースを表示するコマンドで、出力の値を取り出すものではありません。

### 問15 `Terraform-4.0-015`

**正解**: D

`set` は、順番がなく、同じ値が重複しないコレクション型です。`list` は順番があり重複してもよく、`tuple` は位置ごとに型が決まった並び、`object` は属性ごとに型が決まった構造です。

### 問16 `Terraform-4.0-016`

**正解**: A

属性ごとに型が違う(文字列、数、真偽値)値には、`object` 型を使い、属性と型を書きます。`map(string)` は、すべての値が文字列でなければなりません。`list` や `set` はキーで取り出す形ではありません。

### 問17 `Terraform-4.0-017`

**正解**: B

`optional(number, 20)` は、属性を省略したときの既定値を 20 にする書き方です。渡した値に `disk_gb` がないので、20 が使われます。既定値を書かない `optional(number)` なら null になります。

### 問18 `Terraform-4.0-018`

**正解**: A

`tuple` は、`["web", 80, true]` のように、位置ごとに型が決まった順番のある並びです。キーと値の組で値の型がそろっているのは `map`、順番がなく重複がないのは `set` です。

### 問19 `Terraform-4.0-019`

**正解**: A

count のリソースは番号で識別されます。
① 元は 0 = alice、1 = bob、2 = carol です。
② bob を外すと、リストは 0 = alice、1 = carol になります。
③ 番号 1 のユーザーの名前が bob から carol に変わり、番号 2 は削除されます。

つまり、bob のユーザーの名前が carol に変えられ、元の carol のユーザーは削除されます。関係のない carol まで影響を受けます(引数によっては作り直しになります)。bob だけが削除されるのは、キーで識別する for_each の場合です。

### 問20 `Terraform-4.0-020`

**正解**: D

`for_each` はキー(ここではユーザー名)でリソースを識別するので、`aws_iam_user.users["bob"]` だけが削除され、他は変わりません。リストは `toset()` で集合に変えて渡します。`count` は番号で識別するので、前の問題と同じ問題が起きます。

### 問21 `Terraform-4.0-021`

**正解**: C

集合を `for_each` に渡すと、`each.key` と `each.value` は、どちらも要素の値(ユーザー名)になります。マップを渡したときは、`each.key` がキー、`each.value` が値です。番号(0、1)が使われるのは `count` の `count.index` です。

### 問22 `Terraform-4.0-022`

**正解**: C

条件式は `条件 ? 真のときの値 : 偽のときの値` です。`var.env` は `"dev"` なので、`var.env == "prod"` は偽です。そのため `"t3.micro"` になります。

### 問23 `Terraform-4.0-023`

**正解**: C

リソースの中の入れ子のブロック(`ingress` など)を繰り返して作るには、`dynamic` ブロックを使います。`count` は、リソースそのものを複数作るためのもので、入れ子のブロックには使えません。

### 問24 `Terraform-4.0-024`

**正解**: A

`[for 要素 in リスト : 式]` は、各要素に式を当てはめたリストを作ります。`upper` は大文字にする関数なので、`["WEB", "DB"]` になります。マップを作るには `{ for n in … : n => … }` と書き、文字列にするには `join` を使います。

### 問25 `Terraform-4.0-025`

**正解**: C

`merge` はマップを 1 つにまとめます。同じキーがあると、後ろの引数の値が優先されます。
① 1 つ目から env = "dev"、owner = "a" が入ります。
② 2 つ目の env = "prod" で、env が上書きされます。
③ 結果は `{ env = "prod", owner = "a" }` です。

キーが重複してもエラーにはならず、owner も消えません。

### 問26 `Terraform-4.0-026`

**正解**: D

`terraform console` は、式や関数を入力すると結果を表示する対話の画面です。設定の変数や state の値も使えます。`validate` は設定の検証、`show` は state や計画の表示、`graph` は依存関係のグラフの出力です。

### 問27 `Terraform-4.0-027`

**正解**: C

Terraform では、組み込み関数を使います。自分で関数を定義する仕組みはありません(Terraform 1.8 以降、プロバイダーが関数を提供することはあります)。関数は、resource、locals、output など、式を書ける場所ならどこでも使えます。

### 問28 `Terraform-4.0-028`

**正解**: A

`depends_on` は、参照がないのに順番が必要な場合だけに使います。インスタンスの引数がポリシーを参照していないので、Terraform は順番を判断できず、明示が必要です。サブネットが VPC の `id` を参照している場合は、参照から自動で判断されるので不要です。念のため全部に付けると、計画が分かりにくくなります。

### 問29 `Terraform-4.0-029`

**正解**: B

`create_before_destroy = true` を付けると、作り直しのときに新しいリソースを先に作ってから古いものを削除します(`+/-`)。既定は削除してから作成(`-/+`)です。`prevent_destroy` は削除の防止、`ignore_changes` で AMI の変更を無視すると、作り直し自体が行われません。

### 問30 `Terraform-4.0-030`

**正解**: C

`prevent_destroy = true` を付けたリソースは、削除(または作り直し)する計画になるとエラーになります。誤った削除を防げます。ただし、設定からリソースのブロックごと消した場合は、この設定も消えるので守れません。

### 問31 `Terraform-4.0-031`

**正解**: C

`ignore_changes` に指定した引数は、Terraform の外で変わっても差分として扱われません。タグを外部のツールが管理する場合に使います。`replace_triggered_by` は、指定したものが変わったときに作り直す設定で、逆の働きです。

### 問32 `Terraform-4.0-032`

**正解**: A

変数の値を検証するには、`variable` ブロックの中の `validation` ブロックに、`condition` と `error_message` を書きます。条件が偽なら plan の最初でエラーになります。`check` ブロックは警告を出すだけで、止めません。

### 問33 `Terraform-4.0-033`

**正解**: B

`check` ブロックは、インフラ全体の状態を確かめるためのもので、条件を満たさなくても警告を出すだけです。plan と apply は止まりません。エラーで止めたいときは、`precondition` や `postcondition` を使います。

### 問34 `Terraform-4.0-034`

**正解**: B

`postcondition` は、リソースを作った・読んだ後に評価され、`self` で自分の属性を参照できます。満たさなければエラーになります。`precondition` は作る前に前提を確かめるもの、変数の `validation` は入力の値を確かめるものです。

### 問35 `Terraform-4.0-035`

**正解**: B

`sensitive = true` は、plan と apply の画面で値を `(sensitive value)` として隠すだけです。state には平文で保存されるので、state そのものを保護する必要があります。値は他のリソースに普通に渡せます(渡した先でも機密として扱われます)。

### 問36 `Terraform-4.0-036`

**正解**: C

ephemeral リソースで取得した値は state に保存されず、write-only の引数に渡した値も state に保存されません。この組み合わせで、パスワードを state に残さずに渡せます。`sensitive` は表示を隠すだけで、通常の引数に渡すと state に保存されます。Vault のデータソースで読んだ値も state に入ります。Git へのコミットは漏えいの原因です。
