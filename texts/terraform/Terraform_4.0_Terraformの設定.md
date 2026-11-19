# Terraform テキスト 4.0 Terraform の設定

対象: Terraform Associate(004)

設定(`.tf` ファイル)の書き方の分野です。出題が最も多く、範囲も広い分野です。resource と data、参照、変数と出力、型、式と関数、依存関係、カスタム条件、機密データの扱いが問われます。4.6〜4.8 は 004 で新しく加わった範囲です。

## 4.1 resource と data のブロック

出題範囲: resource と data の違い、ブロックの書き方、メタ引数。

### 1. resource ブロック

**resource** は、Terraform が**作成し、管理する**もの(インフラ)を表します。

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0abcdef1234567890"
  instance_type = "t3.micro"
}
```

| 部分 | 意味 |
|---|---|
| `aws_instance` | リソースの種類。先頭の `aws` がプロバイダーを表す |
| `web` | 設定の中での名前(ローカル名)。同じ種類の中で重複できない |
| `{ … }` の中 | 引数(プロバイダーが決めた設定項目) |

リソースは、種類と名前を合わせた `aws_instance.web` で識別します(**リソースのアドレス**)。

### 2. data ブロック(データソース)

**data** は、Terraform の外にある既存の情報を**読み取るだけ**のものです。作成も変更もしません。

```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
}
```

| | resource | data |
|---|---|---|
| 役割 | 作成・更新・削除する | 読み取るだけ |
| 参照の書き方 | `aws_instance.web.id` | `data.aws_ami.ubuntu.id` |
| `destroy` で | 削除される | 何も起きない(元々管理していない) |
| よくある用途 | 新しく作るもの | 最新の AMI、既存の VPC、別のチームが作ったもの、アカウントの情報 |

### 3. メタ引数

どのリソースにも使える、Terraform 自体が決めている引数を**メタ引数**と呼びます。

| メタ引数 | 用途 |
|---|---|
| `count` | 同じものを数を指定して複数作る(4.5) |
| `for_each` | マップや集合の要素ごとに作る(4.5) |
| `depends_on` | 明示的な依存関係(4.6) |
| `provider` | 使うプロバイダーの設定(alias)を選ぶ(2.3) |
| `lifecycle` | 作り直しや削除の動きを変える(4.6、4.7) |

## 4.2 リソースの属性の参照と、リソース同士の参照

出題範囲: 参照の書き方、暗黙の依存関係、count と for_each のアドレス。

### 1. 参照の書き方

| 参照するもの | 書き方 |
|---|---|
| リソースの属性 | `aws_instance.web.private_ip` |
| データソースの属性 | `data.aws_vpc.main.id` |
| 入力変数 | `var.instance_type` |
| ローカル値 | `local.common_tags` |
| 子モジュールの出力 | `module.network.vpc_id` |
| count で作ったもの | `aws_instance.web[0].id`(番号は 0 から) |
| for_each で作ったもの | `aws_instance.web["api"].id` |
| すべての要素の属性(スプラット) | `aws_instance.web[*].id` |

属性には、自分で書いた引数のほかに、作成後にクラウドが決める値(ID、ARN、IP アドレスなど)もあります。参照できる属性はプロバイダーのドキュメントの「Attributes Reference」に載っています。

### 2. 暗黙の依存関係

あるリソースが別のリソースの属性を参照すると、Terraform はその参照から**依存関係を自動で判断**します(暗黙の依存関係)。

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "a" {
  vpc_id     = aws_vpc.main.id # これで VPC → サブネットの順番が決まる
  cidr_block = "10.0.1.0/24"
}
```

順番を自分で書く必要はありません。ほとんどの依存関係は、この参照で表せます。

### 3. 文字列の中で参照する

```hcl
tags = {
  Name = "web-${var.env}"
}
```

`"${ … }"` を**文字列の補間**と呼びます。参照だけなら `"${var.env}"` ではなく `var.env` と書きます。

## 4.3 変数と出力

出題範囲: 入力変数、値の渡し方と優先順位、ローカル値、出力。

### 1. 入力変数(variable)

```hcl
variable "instance_type" {
  description = "EC2 のインスタンスタイプ"
  type        = string
  default     = "t3.micro"
}
```

| 引数 | 意味 |
|---|---|
| `type` | 受け付ける型(4.4) |
| `default` | 既定値。ないと値の指定が必須になる |
| `description` | 説明 |
| `sensitive` | `true` で画面の出力に値を表示しない(4.8) |
| `nullable` | `false` で null を受け付けない |
| `validation` | 値の検証(4.7) |
| `ephemeral` | `true` で state と計画のファイルに保存しない(4.8) |

### 2. 値の渡し方と優先順位

同じ変数に複数の方法で値を渡すと、**後に読まれたものが優先**されます。読まれる順番(下ほど優先)は次のとおりです。

| 順番 | 渡し方 |
|---|---|
| 1(最も弱い) | 変数の `default` |
| 2 | 環境変数 `TF_VAR_<変数名>`(例: `TF_VAR_instance_type=t3.small`) |
| 3 | `terraform.tfvars` |
| 4 | `terraform.tfvars.json` |
| 5 | `*.auto.tfvars`、`*.auto.tfvars.json`(ファイル名の順) |
| 6(最も強い) | コマンドラインの `-var` と `-var-file`(書いた順。後のものが優先) |

- `terraform.tfvars` と `*.auto.tfvars` は自動で読まれます。それ以外の名前(`prod.tfvars` など)は `-var-file=prod.tfvars` で指定します。
- どこからも値が渡されず、`default` もない変数は、実行時に**入力を求められます**(`-input=false` ならエラー)。

### 3. ローカル値(locals)

設定の中で何度も使う式に名前を付けます。外から値は渡せません。

```hcl
locals {
  common_tags = {
    Project = "drill"
    Env     = var.env
  }
}

resource "aws_s3_bucket" "logs" {
  bucket = "logs-${var.env}"
  tags   = local.common_tags
}
```

ブロックは `locals`(複数形)、参照は `local.名前`(単数形)です。

### 4. 出力(output)

```hcl
output "web_ip" {
  description = "Web サーバーのパブリック IP"
  value       = aws_instance.web.public_ip
}
```

- ルートモジュールの出力は、`apply` の最後に表示され、`terraform output` で後から見られます。
  - `terraform output -json`: JSON で全部を出す
  - `terraform output -raw web_ip`: 1 つの値を引用符なしで出す(スクリプト向け)
- 子モジュールの出力は、呼び出し元で `module.<名前>.<出力名>` として参照します。子モジュールの中のリソースを直接は参照できません。
- 出力は state にも記録されます。他の設定から `terraform_remote_state` で読むこともできます(分野 6)。

## 4.4 複雑な型

出題範囲: 基本の型、コレクション型、構造型、型の変換、optional。

| 分類 | 型 | 例 |
|---|---|---|
| 基本の型 | `string`、`number`、`bool` | `"t3.micro"`、`3`、`true` |
| コレクション型(要素はすべて同じ型) | `list(型)` | `["a", "b"]`。順番があり、番号で取り出す |
| | `map(型)` | `{ dev = "t3.micro", prod = "m5.large" }`。キーは文字列 |
| | `set(型)` | 順番がなく、重複がない |
| 構造型(要素ごとに型が違ってよい) | `object({ 属性 = 型, … })` | `{ name = "web", port = 80 }` |
| | `tuple([型, 型, …])` | `["web", 80, true]`。位置ごとに型が決まる |
| 何でもよい | `any` | 値から型を推測する |

```hcl
variable "servers" {
  type = map(object({
    instance_type = string
    disk_gb       = optional(number, 20) # 省略すると 20
  }))
}
```

- `optional(型, 既定値)` で、object の属性を省略できるようにします。
- Terraform は型を自動で変換します(`"3"` と `3`、`"true"` と `true` など)。リストを集合に変えるには `toset()` を使います。

## 4.5 式と関数で動的な設定を書く

出題範囲: count、for_each、条件式、for 式、スプラット、dynamic ブロック、組み込み関数、terraform console。

### 1. count と for_each

```hcl
# count: 同じものを数で
resource "aws_instance" "web" {
  count         = 3
  ami           = var.ami
  instance_type = "t3.micro"
  tags          = { Name = "web-${count.index}" } # 0, 1, 2
}

# for_each: 要素ごとに
resource "aws_iam_user" "users" {
  for_each = toset(["alice", "bob"])
  name     = each.value # each.key も同じ値
}
```

| | count | for_each |
|---|---|---|
| 受け付けるもの | 数 | マップ、または文字列の集合(リストは `toset()` で変える) |
| 識別 | 番号 `[0]`、`[1]` | キー `["alice"]` |
| 使う値 | `count.index` | `each.key`、`each.value` |
| 向いている場面 | 全部同じもの | 要素ごとに設定が違うもの、途中の要素を増減するもの |

count で作ったリストの途中の要素を削除すると、後ろの要素の番号がずれ、**関係のないリソースまで作り直し**になることがあります。キーで識別する for_each なら、その要素だけが削除されます。1つのリソースに count と for_each を同時には書けません。

`count = var.create ? 1 : 0` のように、条件によって作るか作らないかを切り替えるのにも count が使われます。

### 2. 条件式

```hcl
instance_type = var.env == "prod" ? "m5.large" : "t3.micro"
```

`条件 ? 真のときの値 : 偽のときの値` です。

### 3. for 式

```hcl
upper_names = [for n in var.names : upper(n)]                  # リストを作る
name_to_len = { for n in var.names : n => length(n) }          # マップを作る
prod_only   = [for s in var.servers : s.name if s.env == "prod"] # 条件で絞る
```

### 4. スプラット式

`aws_instance.web[*].id` は、`[for i in aws_instance.web : i.id]` と同じで、全要素の属性をリストにします。

### 5. dynamic ブロック

リソースの中の、繰り返す**入れ子のブロック**を動的に作ります。

```hcl
resource "aws_security_group" "web" {
  name = "web"
  dynamic "ingress" {
    for_each = [80, 443]
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

使いすぎると読みにくくなるので、必要な場面に限ります。

### 6. 組み込み関数

Terraform には多くの**組み込み関数**があります。自分で関数を定義することはできません(プロバイダーが関数を提供することはあります)。

| 関数 | 例 | 結果 |
|---|---|---|
| `length` | `length(["a","b"])` | `2` |
| `join` / `split` | `join(",", ["a","b"])` | `"a,b"` |
| `upper` / `lower` | `upper("web")` | `"WEB"` |
| `lookup` | `lookup({a=1}, "b", 0)` | `0`(キーがなければ既定値) |
| `merge` | `merge({a=1}, {b=2})` | `{a=1, b=2}`(同じキーは後ろが優先) |
| `concat` | `concat([1], [2,3])` | `[1,2,3]` |
| `flatten` | `flatten([[1],[2,3]])` | `[1,2,3]` |
| `toset` / `tolist` | `toset(["a","a"])` | `["a"]`(重複がなくなる) |
| `element` | `element(["a","b"], 3)` | `"b"`(長さで割った余りの位置) |
| `file` | `file("${path.module}/init.sh")` | ファイルの中身 |
| `templatefile` | `templatefile("t.tftpl", { name = "x" })` | テンプレートに値を埋めた文字列 |
| `cidrsubnet` | `cidrsubnet("10.0.0.0/16", 8, 2)` | `"10.0.2.0/24"` |
| `coalesce` | `coalesce("", "b")` | `"b"`(最初の空でない値) |
| `try` / `can` | `try(var.obj.a, "default")` | 評価できなければ代わりの値 |
| `jsonencode` | `jsonencode({a=1})` | `"{\"a\":1}"` |

関数の動きは **`terraform console`** で試せます。対話の画面で式を入力すると、結果が表示されます。

## 4.6 リソースの依存関係を定義する

出題範囲: 暗黙と明示の依存関係、`depends_on`、lifecycle の `create_before_destroy` などのルール。

### 1. depends_on

参照がないのに順番が必要な場合だけ、**`depends_on`** で明示します。

```hcl
resource "aws_iam_role_policy" "s3_access" {
  # …
}

resource "aws_instance" "app" {
  ami           = var.ami
  instance_type = "t3.micro"
  # アプリは起動時に S3 を読むので、ポリシーが先に付いている必要がある
  # しかし、インスタンスの引数はポリシーを参照していない
  depends_on = [aws_iam_role_policy.s3_access]
}
```

- 参照で表せる依存関係には使いません。参照があれば自動で判断されます。
- `depends_on` を多用すると、計画が保守的になり(値が `known after apply` になりやすい)、読みにくくなります。最後の手段として使います。
- `depends_on` には、リソースやモジュールの**アドレスのリスト**を書きます(属性ではない)。

### 2. lifecycle のルール

| ルール | 動き |
|---|---|
| `create_before_destroy = true` | 作り直しのとき、**新しいものを先に作ってから**古いものを削除する。停止時間を減らす。名前が一意でなければならないリソースでは、名前の重複に注意 |
| `prevent_destroy = true` | このリソースを削除する計画になると**エラーにする**。データベースなどの誤った削除を防ぐ。設定からブロックごと消した場合は守れない |
| `ignore_changes = [tags]` | 指定した引数の、Terraform の外での変更を無視する(差分にしない) |
| `replace_triggered_by = [aws_launch_template.app.id]` | 指定したものが変わったら、このリソースを作り直す |

```hcl
resource "aws_instance" "web" {
  ami           = var.ami
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true
  }
}
```

既定の作り直しは「削除してから作成」(`-/+`)です。`create_before_destroy` を付けると「作成してから削除」(`+/-`)になります。

## 4.7 カスタム条件で設定を検証する

出題範囲: 変数の `validation`、`precondition`、`postcondition`、`check` ブロック。

### 1. 変数の validation

```hcl
variable "env" {
  type = string
  validation {
    condition     = contains(["dev", "stg", "prod"], var.env)
    error_message = "env は dev、stg、prod のどれかにしてください。"
  }
}
```

条件が偽なら、`plan` の最初の段階でエラーにします。

### 2. precondition と postcondition

リソースとデータソースでは `lifecycle` の中に書きます。出力では `output` ブロックの中に直接、`precondition` だけを書けます。

```hcl
data "aws_ami" "app" {
  # …
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.app.id
  instance_type = var.instance_type

  lifecycle {
    precondition {
      condition     = data.aws_ami.app.architecture == "x86_64"
      error_message = "AMI は x86_64 である必要があります。"
    }
    postcondition {
      condition     = self.public_dns != ""
      error_message = "パブリック DNS 名が割り当てられていません。"
    }
  }
}
```

| 条件 | 評価するタイミング | 使い方 |
|---|---|---|
| `precondition` | リソースを作る・変える**前** | 前提(入力や他のリソース)が正しいかを確かめる |
| `postcondition` | 作った・読んだ**後** | 結果が期待どおりかを確かめる。`self` で自分の属性を参照できる |

条件を満たさないと**エラーになり、処理が止まります**。

### 3. check ブロック

```hcl
check "website_up" {
  data "http" "site" {
    url = "https://${aws_lb.web.dns_name}"
  }
  assert {
    condition     = data.http.site.status_code == 200
    error_message = "サイトが 200 を返していません。"
  }
}
```

- インフラ全体の状態を確かめるための独立したブロックです。
- 条件を満たさなくても**警告を出すだけで、plan や apply は止めません**。
- `check` の中にだけ使えるデータソース(スコープ付きのデータソース)を書けます。
- HCP Terraform の継続的な検証(分野 8)でも使われます。

| | validation | precondition / postcondition | check |
|---|---|---|---|
| 書く場所 | variable | resource と data の lifecycle、output(precondition だけ) | 独立したブロック |
| 失敗したとき | エラー | エラー | 警告だけ |

## 4.8 機密データの扱いのベストプラクティス(Vault による秘密情報の管理を含む)

出題範囲: `sensitive`、state の中の機密情報、ephemeral な値と write-only の引数、Vault、秘密情報を設定に書かない。

### 1. sensitive

```hcl
variable "db_password" {
  type      = string
  sensitive = true
}

output "db_password" {
  value     = var.db_password
  sensitive = true
}
```

- `plan` と `apply` の画面に `(sensitive value)` と表示され、値が隠れます。
- 機密の値を使った出力には、`sensitive = true` が必要です(ないとエラーになる)。
- **state には平文で保存されます**。`sensitive` は表示を隠すだけで、暗号化ではありません。
- `terraform output -json` や `terraform output -raw 名前` では値が表示されます。

### 2. ephemeral な値と write-only の引数(state に残さない)

| 機能 | 内容 |
|---|---|
| ephemeral な変数・出力(`ephemeral = true`、1.10〜) | 値を state と計画のファイルに保存しない |
| ephemeral リソース(`ephemeral` ブロック、1.10〜) | 秘密情報を、その実行の間だけ一時的に取得する。state に保存されない |
| write-only の引数(1.11〜) | リソースの引数のうち、値を渡すだけで state に保存しないもの(例: `password_wo`) |

```hcl
ephemeral "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
}

resource "aws_db_instance" "main" {
  # …
  password_wo         = ephemeral.aws_secretsmanager_secret_version.db.secret_string
  password_wo_version = 1 # 値を変えたらこの番号を上げる
}
```

write-only の値は state に入らないので、Terraform は値が変わったか分かりません。そのため、対になる `_version` の引数の番号を変えて、更新を知らせます。

### 3. Vault で秘密情報を管理する

**HashiCorp Vault** は秘密情報を安全に保管し、配るためのツールです。Terraform からは `hashicorp/vault` プロバイダーで使います。

| 使い方 | 注意 |
|---|---|
| データソース(`data "vault_kv_secret_v2"`)で秘密情報を読む | 読んだ値は **state に保存される**。state の保護が必要 |
| ephemeral リソース(`ephemeral "vault_kv_secret_v2"`)で読む | state に保存されない |
| 動的なシークレット(Vault がその都度、有効期限の短い認証情報を発行する) | 漏れても短時間で無効になる。長期の認証情報を持たずに済む |

### 4. ベストプラクティスのまとめ

- 秘密情報を `.tf` ファイルや Git にコミットした `.tfvars` に**書かない**。環境変数(`TF_VAR_db_password`)、Vault、クラウドのシークレット管理サービスから渡す。
- state は、暗号化とアクセス制御ができるリモートのバックエンドに置く(state には機密情報が入りうる前提で守る)。
- 可能なら ephemeral な値と write-only の引数を使い、そもそも state に残さない。
- クラウドの認証情報は、長期のアクセスキーより、短期の認証情報(HCP Terraform の動的な認証情報、Vault の動的なシークレット、IAM ロール)を使う。
- 機密の変数と出力に `sensitive = true` を付け、ログや画面への表示を防ぐ。
