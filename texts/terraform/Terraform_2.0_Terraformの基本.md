# Terraform テキスト 2.0 Terraform の基本(プロバイダーと state)

対象: Terraform Associate(004)

Terraform は、本体(CLI)と、管理する対象ごとのプロバイダー、そして管理しているものを記録する state の 3 つで動きます。この分野では、プロバイダーの入れ方とバージョンの決め方、複数のプロバイダーの使い方、state の役割が問われます。

## 2.1 プロバイダーのインストールとバージョンの管理

出題範囲: `terraform` ブロック、`required_providers`、プロバイダーのソースアドレス、バージョンの制約、`required_version`、依存関係のロックファイル、`terraform init -upgrade`。

### 1. required_providers でプロバイダーを宣言する

使うプロバイダーは、`terraform` ブロックの中の `required_providers` に書きます。

```hcl
terraform {
  required_version = ">= 1.12.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
```

| 項目 | 意味 |
|---|---|
| `aws`(左側の名前) | 設定の中でこのプロバイダーを呼ぶときの名前(ローカル名) |
| `source` | どこから取得するか。**ソースアドレス** |
| `version` | 使ってよいプロバイダーのバージョンの範囲 |
| `required_version` | **Terraform 本体(CLI)** のバージョンの制約。プロバイダーのバージョンではない |

### 2. ソースアドレス

ソースアドレスは `[ホスト名/]名前空間/種類` の形です。ホスト名を省略すると、公開の **Terraform Registry**(`registry.terraform.io`)を意味します。

| 書き方 | 意味 |
|---|---|
| `hashicorp/aws` | `registry.terraform.io/hashicorp/aws` と同じ |
| `integrations/github` | GitHub 社が提供するプロバイダー |
| `app.terraform.io/example-org/internal` | HCP Terraform のプライベートレジストリのプロバイダー |

`required_providers` を書かずにリソースだけを書くと、Terraform はリソースの種類の先頭(`aws_instance` なら `aws`)から `hashicorp/aws` を推測します。HashiCorp 以外が作ったプロバイダーは推測できないので、必ず `source` を書きます。

Registry のプロバイダーには、提供元による区分があります。

| 区分 | 提供元 |
|---|---|
| Official | HashiCorp が提供・保守する |
| Partner | HashiCorp の確認を受けた企業が、自社の製品向けに提供する |
| Community | 個人やコミュニティが公開する |

### 3. バージョンの制約

| 書き方 | 意味 |
|---|---|
| `= 6.3.0`(または `6.3.0`) | 6.3.0 だけ |
| `!= 6.3.0` | 6.3.0 以外 |
| `>= 6.0`、`> 6.0`、`<= 6.9`、`< 7.0` | 以上、より大きい、以下、未満 |
| `>= 6.0, < 7.0` | カンマで並べると、すべてを満たす範囲 |
| `~> 6.3` | **一番右の数字だけ上げてよい**。6.3 以上、7.0 未満 |
| `~> 6.3.0` | 6.3.0 以上、6.4 未満(パッチだけ上げてよい) |

`~>`(悲観的制約演算子)は試験によく出ます。「書いた一番右の数字だけが増えてよい」と覚えます。

| 制約 | 許されるもの | 許されないもの |
|---|---|---|
| `~> 1.2` | 1.2.0、1.5.7、1.99 | 2.0.0 |
| `~> 1.2.0` | 1.2.0、1.2.9 | 1.3.0 |

ルートモジュール(`terraform` コマンドを実行するディレクトリ)では、思わぬ破壊的な変更を避けるため、バージョンの範囲を決めておくのが推奨です。再利用されるモジュールでは、最低のバージョン(`>=`)だけを書き、上限はルートモジュールに任せるのが一般的です。

### 4. 依存関係のロックファイル(.terraform.lock.hcl)

`terraform init` を実行すると、作業ディレクトリに **`.terraform.lock.hcl`** ができます。

- 実際に選ばれた**プロバイダー**のバージョンと、ファイルのハッシュ値(チェックサム)を記録します。
- 次からの `init` は、制約の範囲に新しいバージョンがあっても、**ロックファイルに書かれたバージョンを使います**。チームの全員と CI で同じバージョンを使えます。
- **Git にコミットします**。
- モジュールのバージョンは記録しません。記録するのはプロバイダーだけです。

ロックファイルのバージョンより新しいものに上げるには、**`terraform init -upgrade`** を実行します。制約の範囲で一番新しいバージョンを選び直し、ロックファイルを更新します。

別の OS(Linux と macOS など)のハッシュをまとめて記録したいときは `terraform providers lock -platform=linux_amd64 -platform=darwin_arm64` を使います。

### 5. 確認のコマンド

| コマンド | 表示するもの |
|---|---|
| `terraform version` | Terraform 本体と、使っているプロバイダーのバージョン |
| `terraform providers` | 設定と state が必要としているプロバイダーの一覧(どのモジュールが使うか) |

## 2.2 Terraform がプロバイダーをどう使うか

出題範囲: プラグインの仕組み、ダウンロードされる場所、プロバイダーの設定、認証情報の渡し方。

### 1. プロバイダーはプラグイン

- Terraform 本体は、AWS や Azure の API の呼び方を知りません。API を呼ぶのは**プロバイダー**という別のプログラム(プラグイン)です。
- 本体とプロバイダーは**別々にリリース**され、バージョンも別々です。新しいクラウドのサービスに対応するには、プロバイダーを上げます(本体は上げなくてよいことが多い)。
- `terraform init` が、必要なプロバイダーを Registry からダウンロードし、作業ディレクトリの **`.terraform/providers/`** に置きます。`.terraform/` ディレクトリは Git にコミットしません。

```
┌──────────────┐  プラグインの仕組み   ┌────────────────┐   API    ┌──────┐
│ Terraform 本体 │ ───────────────▶ │ プロバイダー(aws) │ ──────▶ │ AWS  │
└──────────────┘                    └────────────────┘          └──────┘
```

プロバイダーの役割は次のとおりです。

- 扱えるリソースの種類(`aws_instance` など)とデータソースの種類を提供します。
- リソースの作成、読み取り、更新、削除(CRUD)のときに API を呼びます。

### 2. provider ブロック

プロバイダーの設定(リージョンなど)は `provider` ブロックに書きます。

```hcl
provider "aws" {
  region = "ap-northeast-1"
}
```

- 認証情報(アクセスキーなど)を `.tf` ファイルに直接書くのは避けます。Git に残って漏えいするためです。環境変数(`AWS_ACCESS_KEY_ID` など)、共有の認証情報ファイル、IAM ロール、HCP Terraform の動的な認証情報(分野 8)などを使います。
- 設定が不要なプロバイダーなら、`provider` ブロックを書かなくても使えます(空の設定として扱われます)。

## 2.3 複数のプロバイダーを使う設定

出題範囲: 種類の違うプロバイダーを一緒に使う、同じプロバイダーを別の設定で使う(alias)、モジュールへの受け渡し。

### 1. 種類の違うプロバイダー

1つの設定の中で、AWS、Azure、Kubernetes などを一緒に使えます。`required_providers` にすべて書き、リソースごとに種類の先頭でどのプロバイダーを使うかが決まります。

```hcl
terraform {
  required_providers {
    aws    = { source = "hashicorp/aws" }
    random = { source = "hashicorp/random" }
  }
}

resource "random_pet" "name" {}

resource "aws_s3_bucket" "logs" {
  bucket = "logs-${random_pet.name.id}"
}
```

### 2. 同じプロバイダーを別の設定で使う: alias

東京と大阪の両方のリージョンにリソースを作るときのように、同じプロバイダーを別の設定で使うには、**`alias`(別名)** を付けた `provider` ブロックを追加します。

```hcl
provider "aws" {
  region = "ap-northeast-1" # alias のないもの = 既定のプロバイダー
}

provider "aws" {
  alias  = "osaka"
  region = "ap-northeast-3"
}

resource "aws_s3_bucket" "tokyo" {
  bucket = "example-tokyo"
  # provider を書かないと、既定(alias のない)の aws を使う
}

resource "aws_s3_bucket" "osaka" {
  provider = aws.osaka
  bucket   = "example-osaka"
}
```

- リソースの `provider` 引数には、`<プロバイダー名>.<alias>` を引用符なしで書きます。
- `provider` を書かないリソースは、alias のない既定の設定を使います。

### 3. モジュールに別の設定を渡す

子モジュールは、既定では呼び出し元の既定のプロバイダーを引き継ぎます。alias のある設定を渡すには、`module` ブロックの `providers` 引数を使います。

```hcl
module "dr_bucket" {
  source = "./modules/bucket"
  providers = {
    aws = aws.osaka
  }
}
```

子モジュールの側で、複数の設定を受け取ることを宣言するには、`required_providers` に `configuration_aliases = [aws.primary, aws.secondary]` を書きます。

## 2.4 Terraform が state をどう使い、管理するか

出題範囲: state の目的、保存される内容、既定の保存場所、取り扱いの注意。

### 1. state とは

**state** は、Terraform が管理しているリソースと、実際のインフラ(クラウドの上のもの)の**対応表**です。既定では作業ディレクトリの **`terraform.tfstate`**(JSON 形式)に保存されます。

state が必要な理由は次のとおりです。

| 目的 | 内容 |
|---|---|
| **実物との対応付け** | 設定の `aws_instance.web` が、実際のどのインスタンス(`i-0abc…`)なのかを記録します。これがないと、何が Terraform の管理下か分かりません |
| **メタデータの記録** | リソース同士の依存関係などを記録し、設定から消えたリソースを正しい順番で削除するのに使います |
| **性能** | 大規模な環境では、すべての属性を毎回 API で取得せずに、state の値を使うことができます |
| **共同作業** | state をリモートに置くと、チームで同じ状態を共有できます(分野 6) |

### 2. state の動き

1. `plan` の前に、state に記録されたリソースの今の状態を API で読み取って(**refresh**)、state の内容を更新したものを使います。
2. 設定(あるべき状態)と比べて、差分を計画にします。
3. `apply` で変更した後、結果を state に書き込みます。

`terraform apply` の前の state は、ローカルの場合 **`terraform.tfstate.backup`** に残ります。

### 3. 取り扱いの注意

- **state には機密情報が平文で入ることがあります**(データベースの初期パスワード、作られた秘密鍵など)。`sensitive` を付けた値も、画面に表示されないだけで state には入ります。
  - state を Git にコミットしない(`.gitignore` に `*.tfstate` を入れる)。
  - 暗号化とアクセス制御ができるリモートのバックエンド(S3、HCP Terraform など)に置く。
- state のファイルを**手で編集しない**。変更が必要なら `terraform state` のコマンドや、`moved`、`removed`、`import` のブロックを使います(分野 6、7)。
- state を失うと、Terraform は既存のリソースを自分の管理下だと分からなくなり、同じものを作ろうとします。

### 4. まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| state の既定の保存場所 | 作業ディレクトリの `terraform.tfstate` |
| state の主な目的 | 設定のリソースと実際のリソースの対応付け |
| state に機密情報は入るか | 入ることがある。平文で。だから保護する |
| ロックファイルに記録されるもの | プロバイダーのバージョンとハッシュ。モジュールは記録されない |
| ロックファイルより新しいバージョンにする | `terraform init -upgrade` |
