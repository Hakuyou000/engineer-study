# Terraform テキスト 5.0 Terraform のモジュール

対象: Terraform Associate(004)

モジュールは、よく使う構成をまとめて再利用するための仕組みです。この分野では、モジュールの取得元の書き方、モジュールの中と外での変数の見え方、モジュールの呼び方、バージョンの決め方が問われます。

## 5.1 Terraform がモジュールをどこから取得するか

出題範囲: ルートモジュールと子モジュール、`source` の書き方、ダウンロードされる場所。

### 1. モジュールとは

**モジュール**は、同じディレクトリに置いた `.tf` ファイルの集まりです。

| 用語 | 意味 |
|---|---|
| **ルートモジュール** | `terraform` コマンドを実行するディレクトリの設定。すべての設定にある |
| **子モジュール** | ルートモジュール(または別のモジュール)から `module` ブロックで呼ばれるモジュール |

つまり、Terraform の設定はすべて何かのモジュールです。

ルートモジュールと子モジュールの置き場所の例を図にします。

```text
terraform-project/
  +-- main.tf            ルートモジュール。module ブロックで子モジュールを呼ぶ
  +-- modules/
        +-- network/     子モジュール(./modules/network)
        +-- app/         子モジュール(./modules/app)
```

### 2. source の書き方

`module` ブロックの **`source`** で、モジュールをどこから取得するかを書きます。

| 取得元 | 書き方の例 |
|---|---|
| ローカルのパス | `"./modules/network"`、`"../shared/vpc"`(`./` か `../` で始める) |
| 公開の Terraform Registry | `"terraform-aws-modules/vpc/aws"`(`名前空間/名前/プロバイダー`) |
| プライベートレジストリ(HCP Terraform) | `"app.terraform.io/example-org/vpc/aws"`(先頭にホスト名) |
| GitHub | `"github.com/example-org/terraform-aws-vpc"` |
| 一般の Git | `"git::https://example.com/vpc.git?ref=v1.2.0"` |
| HTTP の URL | `"https://example.com/vpc-module.zip"` |
| S3 バケット | `"s3::https://s3.amazonaws.com/example-bucket/vpc.zip"` |

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = "main"
  cidr = "10.0.0.0/16"
}
```

- ローカルのパスは `./` か `../` で始めます。`modules/network` のように書くと、Registry のアドレスとして解釈されます。
- Registry に公開するモジュールのリポジトリ名は、`terraform-<プロバイダー>-<名前>` の形(例: `terraform-aws-vpc`)にする決まりがあります。

### 3. ダウンロードされる場所

`terraform init`(または `terraform get`)で、ローカル以外のモジュールは作業ディレクトリの **`.terraform/modules/`** にダウンロードされます。ローカルのパスのモジュールはコピーされず、その場所のファイルが直接読まれます。

`source` を追加したり変えたりしたら、もう一度 `init` が必要です。

## 5.2 モジュールの中の変数のスコープ

出題範囲: 入力変数、出力、モジュールの間で値が見える範囲。

### 1. モジュールは閉じた箱

モジュールの中と外は、**入力変数と出力だけでつながります**。

```text
呼び出し元(ルートモジュール)
  |
  |  module "network" { cidr = "10.0.0.0/16" }      <- 引数で入力変数に渡す
  v
子モジュール(./modules/network)
  variable "cidr" {}                                 <- 受け取る
  resource "aws_vpc" "this" { cidr_block = var.cidr }
  output "vpc_id" { value = aws_vpc.this.id }        <- 公開する
  |
  v
呼び出し元
  module.network.vpc_id                              <- 出力だけを参照できる
```

| ルール | 内容 |
|---|---|
| 子は親の変数を見られない | 子モジュールの中で、親の `var.env` は使えません。必要なら、親が引数で渡します |
| 親は子のリソースを直接見られない | `module.network.aws_vpc.this.id` とは書けません。子が `output` で公開した値だけを `module.network.vpc_id` で参照します |
| ローカル値も外から見えない | `locals` はそのモジュールの中だけで使えます |
| 兄弟のモジュール同士 | 直接は参照できません。親が一方の出力を、もう一方の入力に渡します |

```hcl
module "network" {
  source = "./modules/network"
  cidr   = "10.0.0.0/16"
}

module "app" {
  source    = "./modules/app"
  subnet_id = module.network.subnet_id # 兄弟の値は親を通して渡す
}
```

兄弟のモジュールの間で、値が親を通って渡る流れを図にします。

```text
[module.network]
  |
  | output "subnet_id"
  v
[root]  module.network.subnet_id を読む
  |
  | subnet_id = module.network.subnet_id
  v
[module.app]
```

兄弟のモジュールは、直接はつながりません。必ず親(ルートモジュール)を通ります。

### 2. 入力変数の必須と省略

- 子モジュールの変数に `default` がなければ、呼び出し元はその引数を**必ず**書きます(書かないとエラー)。モジュールの中の変数は、実行時に入力を求められません。
- `default` があれば、省略できます。

## 5.3 設定の中でモジュールを使う

出題範囲: `module` ブロック、メタ引数、標準のモジュールの構成、使い方のよい習慣。

### 1. module ブロックで使える引数

| 引数 | 用途 |
|---|---|
| `source` | 取得元(必須) |
| `version` | バージョンの制約(Registry のモジュールだけ) |
| 入力変数の名前 | 子モジュールの変数に値を渡す |
| `count`、`for_each` | 同じモジュールを複数呼ぶ |
| `depends_on` | 明示的な依存関係 |
| `providers` | 子モジュールに渡すプロバイダーの設定(2.3) |

```hcl
module "bucket" {
  source   = "./modules/bucket"
  for_each = toset(["logs", "backup"])
  name     = "example-${each.key}"
}
```

`for_each` で呼んだモジュールの出力は `module.bucket["logs"].arn` のように参照します。

### 2. 標準のモジュールの構成

| ファイル | 中身 |
|---|---|
| `main.tf` | リソースの定義 |
| `variables.tf` | 入力変数 |
| `outputs.tf` | 出力 |
| `README.md` | 使い方の説明 |
| `versions.tf`(任意) | `terraform` ブロック、`required_providers` |
| `modules/`(任意) | 入れ子のモジュール |
| `examples/`(任意) | 使い方の例 |

ファイル名に決まりはありません(Terraform はディレクトリの `.tf` をすべて読みます)。上の名前は、読みやすくするための習慣です。

### 3. よい習慣

- モジュールの中に `provider` ブロックを書かない。プロバイダーの設定は、ルートモジュールで行い、子モジュールに引き継がせるか `providers` で渡します。
- 入れ子を深くしすぎない。小さなモジュールを組み合わせる(モジュールの合成)方が、再利用しやすく、分かりやすくなります。
- 公開のモジュールを使う前に、中身(どんなリソースを作るか)を確認します。

## 5.4 モジュールのバージョンを管理する

出題範囲: `version` 引数、Git の `ref`、バージョンを上げる手順。

### 1. version 引数

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "6.0.1" # 固定。"~> 6.0" なら 6.x の範囲
}
```

- `version` が使えるのは、**Registry(公開またはプライベート)のモジュールだけ**です。
- ローカルのパスのモジュールにはバージョンがありません(その場のファイルを使う)。
- Git から取得するモジュールは、`version` ではなく、`source` の **`?ref=`** でタグやブランチ、コミットを指定します。

```hcl
module "vpc" {
  source = "git::https://github.com/example-org/terraform-aws-vpc.git?ref=v1.2.0"
}
```

### 2. バージョンを固定する理由と上げ方

- バージョンを決めないと、新しく `init` する環境(CI や他のメンバー)や `init -upgrade` のときに最新が使われ、モジュールの変更で予期しない差分が出ることがあります。本番では**バージョンを固定する(または範囲を絞る)**のが推奨です。
- 制約の範囲で新しいバージョンに上げるには、**`terraform init -upgrade`** を実行します。
- モジュールのバージョンは、`.terraform.lock.hcl` には**記録されません**(記録されるのはプロバイダーだけ)。モジュールは `version` の制約と `.terraform/modules/` の内容で決まります。

### 3. まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| `version` 引数が使えるモジュール | Registry(公開・プライベート)のものだけ |
| Git のモジュールのバージョンを決める | `source` に `?ref=v1.2.0` |
| 子モジュールのリソースの値を親で使う | 子に `output` を書き、`module.名前.出力名` で参照 |
| 子モジュールで親の変数を使う | 直接は使えない。親が引数で渡す |
| モジュールを追加・変更した後 | `terraform init` |
| ローカルのモジュールの `source` の書き方 | `./` か `../` で始める |
