# Terraform テキスト 7.0 Terraform でのインフラの保守

対象: Terraform Associate(004)

運用の中で必要になる作業の分野です。Terraform の外で作られた既存のインフラを取り込む import、state の中身を調べる CLI、問題を調べるための詳しいログが問われます。

## 7.1 既存のインフラを取り込む(import)

出題範囲: `import` ブロック、設定の自動生成、`terraform import` コマンド、取り込んだ後の確認。

### 1. import とは

管理画面などで作られた**既存のリソース**を、Terraform の管理下(state)に取り込む操作です。import は**リソースを作りません**。既にあるものを state に記録するだけです。

### 2. import ブロック(推奨。1.5〜)

```hcl
import {
  to = aws_s3_bucket.logs
  id = "example-logs-bucket"
}

resource "aws_s3_bucket" "logs" {
  bucket = "example-logs-bucket"
}
```

| 項目 | 意味 |
|---|---|
| `to` | 取り込み先のリソースのアドレス |
| `id` | 実物を特定する ID。何を ID にするかはリソースの種類ごとに違う(バケット名、インスタンス ID など)。プロバイダーのドキュメントの「Import」の節に書かれている |

流れ:

1. `import` ブロックを書く。
2. `terraform plan` で、何が取り込まれるか(`will be imported`)を確認する。
3. `terraform apply` で state に取り込む。
4. もう一度 `plan` して、**差分がない**(設定が実物と一致している)ことを確かめる。

`import` ブロックの利点:

- 計画の段階で確認してから取り込めます。普通の `plan` と `apply` の流れの中で行えます。
- 設定に書くので、レビューでき、複数のリソースをまとめて取り込めます(`for_each` も使えます。1.7〜)。
- 取り込んだ後は、`import` ブロックを消しても、残しておいても構いません。

### 3. 設定の自動生成

取り込みたいリソースの `resource` ブロックをまだ書いていないときは、Terraform に下書きを作らせられます。

```bash
terraform plan -generate-config-out=generated.tf
```

- `import` ブロックはあるが `resource` ブロックがないものについて、実物の属性から `resource` ブロックを作り、指定したファイルに書き出します。
- 生成された設定は下書きです。不要な引数を消したり、変数に置き換えたりして整えます。

### 4. terraform import コマンド(古い方法)

```bash
terraform import aws_s3_bucket.logs example-logs-bucket
```

| | import ブロック | `terraform import` コマンド |
|---|---|---|
| 計画で事前に確認 | できる | できない(すぐに state に書き込む) |
| 設定の自動生成 | できる | できない(`resource` ブロックを先に書く必要がある) |
| 一度に取り込める数 | 複数 | 1 つずつ |
| レビュー | 設定に残るのでできる | コマンドの操作なので記録が残らない |

## 7.2 CLI で state を調べる

出題範囲: `terraform state list`、`terraform state show`、`terraform show`、その他の確認のコマンド。

| コマンド | 表示するもの |
|---|---|
| `terraform state list` | state にあるリソースの**アドレスの一覧** |
| `terraform state list module.network` | 一部(このモジュールの中)だけの一覧 |
| `terraform state show aws_instance.web` | **1 つのリソース**のすべての属性 |
| `terraform show` | state 全体を、人が読める形で表示する |
| `terraform show tfplan` | 保存した計画のファイルの内容 |
| `terraform show -json` | state や計画を JSON で出す(ツールで処理する用) |
| `terraform output` | ルートモジュールの出力の値 |
| `terraform state pull` | リモートの state を JSON のまま取得する |

```
$ terraform state list
aws_instance.web
aws_security_group.web
module.network.aws_subnet.a
module.network.aws_vpc.this
```

- これらは**読むだけ**で、state もインフラも変えません(`state pull` も読むだけです)。
- `state show` や `show` では、`sensitive` の値は隠されて表示されます。
- 「どのリソースが管理されているか」は `state list`、「そのリソースの ID や IP アドレスは何か」は `state show` と覚えます。

## 7.3 詳しいログをいつ、どう使うか

出題範囲: `TF_LOG`、ログのレベル、`TF_LOG_PATH`、本体とプロバイダーのログを分ける。

### 1. TF_LOG

Terraform の内部の動きや、プロバイダーと API のやり取りを調べたいときは、環境変数 **`TF_LOG`** でログを有効にします。

```bash
export TF_LOG=DEBUG
terraform plan
```

| レベル | 内容 |
|---|---|
| `TRACE` | 最も詳しい |
| `DEBUG` | |
| `INFO` | |
| `WARN` | |
| `ERROR` | 最も少ない |
| `JSON` | `TRACE` のレベルを JSON の形で出す |

- 下に行くほど少なくなります。**`TRACE` が最も詳しい**ことを覚えます。
- 既定ではログは出ません。ログは標準エラー出力(stderr)に出ます。
- 無効にするには `TF_LOG` を消します(`unset TF_LOG`)。

### 2. TF_LOG_PATH

```bash
export TF_LOG=TRACE
export TF_LOG_PATH=./terraform.log
```

- ログを指定したファイルに書き出します。
- **`TF_LOG` も設定していないと、ログは出ません**。`TF_LOG_PATH` だけでは何も書かれません。

### 3. 本体とプロバイダーのログを分ける

| 環境変数 | 対象 |
|---|---|
| `TF_LOG_CORE` | Terraform 本体だけ |
| `TF_LOG_PROVIDER` | プロバイダーだけ |

例: プロバイダーと API のやり取りだけを詳しく見たいなら `TF_LOG_PROVIDER=TRACE` にします。

### 4. いつ使うか

- エラーの原因がメッセージだけでは分からないとき(API の応答、認証の問題など)。
- Terraform 本体やプロバイダーの不具合を報告するとき(ログを添えるよう求められることが多い)。

注意: 詳しいログには、**認証情報や機密の値が含まれることがあります**。他の人に渡す前に中身を確認し、必要なら消します。調べ終わったら、ログを無効に戻します。

### 5. まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| 既存のリソースを管理下に入れる(推奨) | `import` ブロック → `plan` → `apply` |
| 取り込むリソースの設定を自動で作る | `terraform plan -generate-config-out=FILE` |
| import でリソースは作られるか | 作られない。state に記録するだけ |
| 管理しているリソースの一覧 | `terraform state list` |
| 1 つのリソースの属性 | `terraform state show ADDRESS` |
| 最も詳しいログ | `TF_LOG=TRACE` |
| ログをファイルに出す | `TF_LOG` と `TF_LOG_PATH` の両方を設定する |
