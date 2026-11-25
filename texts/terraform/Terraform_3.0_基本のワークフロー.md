# Terraform テキスト 3.0 Terraform の基本のワークフロー

対象: Terraform Associate(004)

Terraform の作業は、書く → 計画する → 適用する、の繰り返しです。この分野では、`init`、`validate`、`plan`、`apply`、`destroy`、`fmt` の各コマンドが何をし、何をしないかが問われます。試験で最も出題が多い分野の 1 つです。

## 3.1 Terraform のワークフロー

出題範囲: Write → Plan → Apply、依存関係のグラフ、並列の実行。

### 1. 3 つの段階

| 段階 | 内容 | 主なコマンド |
|---|---|---|
| **Write**(書く) | `.tf` ファイルに設定を書く。Git で管理し、レビューする | `terraform fmt`、`terraform validate` |
| **Plan**(計画する) | 変更の内容を確認する。インフラは変えない | `terraform plan` |
| **Apply**(適用する) | 計画どおりにインフラを変え、結果を state に書く | `terraform apply` |

最初に一度、作業ディレクトリを準備する **`terraform init`** が必要です。不要になったら **`terraform destroy`** で全部を消します。

```
init → (write → fmt → validate → plan → apply) の繰り返し → destroy
```

チームでは、次の流れが一般的です。

1. ブランチで設定を変え、`plan` の結果をプルリクエストに付ける。
2. レビューで `plan` の内容を確認してもらう。
3. マージ後に `apply` する(CI や HCP Terraform から実行することが多い)。

### 2. 依存関係のグラフ

Terraform は、リソース同士の参照から**依存関係のグラフ**を作ります。

- 依存しているものから順番に作ります(VPC → サブネット → EC2)。削除は逆の順番です。
- 依存関係のないリソースは**並列に**作ります。同時に処理する数は既定で **10** で、`-parallelism=N` で変えられます。
- グラフは `terraform graph` で DOT 形式で出力できます。

参照から決まる依存関係と、作成の順番を図にします。同じ段のものは並列に作ります。

```text
[aws_vpc.main]    [aws_s3_bucket.logs]
      |
      v
[aws_subnet.a]
      |
      v
[aws_instance.web]
```

削除の順番は、作成と逆(下から上)です。`aws_s3_bucket.logs` は他と依存関係がないので、並列に処理できます。

## 3.2 作業ディレクトリの初期化(terraform init)

出題範囲: init が行うこと、`.terraform` ディレクトリ、何度実行してもよいこと、主なオプション。

### 1. init が行うこと

`terraform init` は、設定のあるディレクトリで**最初に必ず実行する**コマンドです。

| 行うこと | 内容 |
|---|---|
| バックエンドの初期化 | state を置く場所(local、S3、HCP Terraform など)を準備する |
| プロバイダーのダウンロード | `required_providers` に合うものを `.terraform/providers/` に置き、`.terraform.lock.hcl` を作る・確認する |
| モジュールのダウンロード | 子モジュールを `.terraform/modules/` に置く |

`terraform init` が準備するものを図にします。

```text
terraform init
  |
  +-- backend             --> state を置く場所を準備する
  +-- required_providers  --> プロバイダーを .terraform/providers/ に置き、ロックファイルを作る(確認する)
  +-- module              --> 子モジュールを .terraform/modules/ にダウンロードする
```

- インフラは**変更しません**。
- 何度実行しても安全です。次の場合は再び実行が必要です。
  - 新しいプロバイダーやモジュールを追加したとき
  - モジュールの `source` や `version` を変えたとき
  - バックエンドの設定を変えたとき
- init をしないで `plan` などを実行すると、「初期化が必要」というエラーになります。

### 2. 主なオプション

| オプション | 用途 |
|---|---|
| `-upgrade` | プロバイダーとモジュールを、制約の範囲の最新に上げる(ロックファイルも更新) |
| `-backend-config=...` | バックエンドの設定の一部をコマンドから渡す(部分的な設定。分野 6) |
| `-migrate-state` | バックエンドを変えたとき、既存の state を新しいバックエンドに移す |
| `-reconfigure` | 既存の state を移さずに、バックエンドの設定をやり直す |
| `-backend=false` | バックエンドの初期化を飛ばす |

モジュールだけを取得し直すコマンドとして `terraform get` もあります。

## 3.3 設定の検証(terraform validate)

出題範囲: validate が確かめること、確かめないこと。

`terraform validate` は、設定が**構文として正しく、内部で矛盾がないか**を確かめます。

| 確かめる | 確かめない |
|---|---|
| HCL の構文の誤り | クラウドに実際にそのリソースを作れるか(権限、上限、名前の重複) |
| 存在しない引数、必須の引数の不足 | state との違い |
| 型の誤り、存在しない変数やリソースの参照 | リモートの API の状態 |

- クラウドの API は呼びません。認証情報も不要です。
- ただし、プロバイダーのスキーマ(引数の一覧)が必要なので、**`init` の後**に実行します。
- CI で、`fmt -check` と一緒に最初に実行するのが一般的です。
- `plan` と `apply` も、内部で同じ検証を行います。

## 3.4 実行計画の作成と確認(terraform plan)

出題範囲: plan の動き、記号の意味、計画の保存、主なオプション。

### 1. plan の動き

1. state のリソースの今の状態を API で読み取る(refresh)。
2. 設定(あるべき状態)と比べる。
3. 変更の計画を表示する。**インフラも state も変更しません。**

### 2. 記号の意味

| 記号 | 意味 |
|---|---|
| `+` | 作成(create) |
| `-` | 削除(destroy) |
| `~` | その場での更新(update in-place) |
| `-/+` | 削除してから作り直す(replace)。作成後に変えられない引数を変えたとき |
| `+/-` | 先に作ってから古いものを削除する(`create_before_destroy` のとき) |
| `<=` | データソースの読み取り |

最後の行に、件数がまとめて表示されます。

```
Plan: 1 to add, 2 to change, 0 to destroy.
```

`(known after apply)` は、作ってみるまで値が決まらない属性(ID、IP アドレスなど)です。

### 3. 計画の保存

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

- `-out` で保存した計画を `apply` に渡すと、**確認なしで、その計画どおりに**適用します。レビューした内容と、実際に適用する内容が同じになります。
- 保存した計画のファイルには、機密情報が含まれることがあります。取り扱いに注意します。
- 計画を作った後に state が変わっていると、古い計画として適用は失敗します。

### 4. 主なオプション

| オプション | 用途 |
|---|---|
| `-var="name=value"`、`-var-file=prod.tfvars` | 変数を渡す |
| `-destroy` | 全部を削除する計画を見る(`terraform destroy` の下見) |
| `-refresh-only` | 実際のインフラに合わせて state だけを更新する計画を見る(分野 6) |
| `-refresh=false` | refresh を飛ばして速くする(実際の状態との違いは見えなくなる) |
| `-target=ADDRESS` | 特定のリソースだけを対象にする(例外的な操作。普段は使わない) |
| `-replace=ADDRESS` | 変更がなくても、そのリソースを作り直す計画にする |
| `-detailed-exitcode` | 終了コードで結果を返す。0 = 変更なし、1 = エラー、2 = 変更あり |

## 3.5 インフラへの変更の適用(terraform apply)

出題範囲: apply の動き、確認の省略、作り直し、途中で失敗したとき。

### 1. apply の動き

- 引数なしの `terraform apply` は、**まず計画を作って表示し、`yes` と入力すると**適用します。
- **`-auto-approve`** を付けると確認を省略します(CI などで使う。本番では慎重に)。
- 保存した計画のファイルを渡すと、確認なしで適用します。
- 適用した結果を state に書き込みます。

### 2. リソースを作り直す: -replace

壊れたサーバーを作り直したいときのように、設定は変えずに特定のリソースを作り直すには `-replace` を使います。

```bash
terraform apply -replace="aws_instance.web"
```

古い `terraform taint` コマンドは非推奨で、`-replace` の使用が推奨されます。

### 3. 途中で失敗したとき

- 作成の途中でエラーになっても、**それまでに成功した変更は state に記録されます**。全体が元に戻る(ロールバックする)わけではありません。
- 作成の途中で失敗したリソースは、state に「tainted(作り直しが必要)」として記録され、次の `apply` で作り直されます。
- 原因を直して、もう一度 `plan` と `apply` を実行します。

## 3.6 Terraform が管理するインフラの削除(terraform destroy)

出題範囲: destroy の動き、下見、一部だけの削除、削除の防止。

- `terraform destroy` は、**その設定(state)が管理しているリソースをすべて削除**します。Terraform の管理下にないリソースは削除しません。
- `terraform apply -destroy` と同じ意味です。下見は `terraform plan -destroy` です。
- 削除は、依存関係の逆の順番で行います(EC2 → サブネット → VPC)。
- 確認で `yes` が必要です。`-auto-approve` で省略できます。
- 一部だけを消すには、**設定からそのリソースを削除して `apply`** するのが普通の方法です。`terraform destroy -target=ADDRESS` もありますが、例外的な操作です。
- `lifecycle { prevent_destroy = true }` を付けたリソースは、削除する計画になるとエラーになります(分野 4)。

## 3.7 書式とスタイルの調整(terraform fmt)

出題範囲: fmt の動き、主なオプション。

`terraform fmt` は、設定ファイルを HCL の**標準の書式**(インデント、`=` の位置揃えなど)に書き換えます。

| オプション | 用途 |
|---|---|
| (なし) | 今のディレクトリの `.tf` と `.tfvars` を整形して上書きする |
| `-recursive` | サブディレクトリも整形する(既定では今のディレクトリだけ) |
| `-check` | 書き換えずに、整形が必要なファイルがあれば終了コード 0 以外を返す(CI 向け) |
| `-diff` | 変更の差分を表示する |

- 書式だけを直します。設定の意味の誤り(存在しない引数など)は見つけません。それは `validate` の役割です。
- `init` の前でも実行できます。

### まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| 最初に必ず実行するコマンド | `terraform init` |
| インフラを変えないコマンド | `init`、`validate`、`plan`、`fmt` |
| 計画どおりに確実に適用したい | `plan -out=FILE` → `apply FILE` |
| 確認なしで適用 | `apply -auto-approve`(または保存した計画を渡す) |
| 特定のリソースを作り直す | `apply -replace=ADDRESS`(`taint` は非推奨) |
| CI で書式の乱れを検出する | `terraform fmt -check`(サブディレクトリも見るなら `-recursive`) |
| validate はクラウドの API を呼ぶか | 呼ばない |
