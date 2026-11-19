# Terraform 問題 7.0 Terraform でのインフラの保守

対象: Terraform Associate(004) / 全20問 / すべてオリジナル問題
対応テキスト: `Terraform_7.0_インフラの保守.md`
解答・解説は末尾。

## 問題

### 7.1 既存のインフラを取り込む(import)

**問1** `Terraform-7.0-001` import の説明として、正しいものはどれか。

- A. state を別のバックエンドに移す
- B. 別のクラウドのリソースを複製する
- C. Terraform の外で作られた既存のリソースを、Terraform の state に取り込む
- D. 設定に書いたリソースを新しく作る

**問2** `Terraform-7.0-002` Terraform 1.5 以降で推奨される、既存のリソースの取り込み方はどれか。

- A. リソースを一度削除して、Terraform で作り直す
- B. `import` ブロックを設定に書き、`plan` で確認してから `apply` する
- C. state のファイルに、手でリソースの記述を追加する
- D. `terraform state push` で取り込む

**問3** `Terraform-7.0-003` 次の設定で `terraform plan` を実行した。表示される内容として正しいものはどれか。

```hcl
import {
  to = aws_s3_bucket.logs
  id = "example-logs-bucket"
}

resource "aws_s3_bucket" "logs" {
  bucket = "example-logs-bucket"
}
```

- A. バケットを削除する計画
- B. エラー。import は `terraform import` コマンドでしかできない
- C. バケットを新しく作る計画(`+ create`)
- D. 既存のバケットを取り込む計画(`will be imported`)

**問4** `Terraform-7.0-004` 取り込みたいリソースの `resource` ブロックをまだ書いていない。`import` ブロックだけを書き、設定の下書きを Terraform に作らせたい。実行するコマンドはどれか。

- A. `terraform import -generate`
- B. `terraform fmt -generate`
- C. `terraform plan -generate-config-out=generated.tf`
- D. `terraform show -json > generated.tf`

**問5** `Terraform-7.0-005` `import` ブロックの `id` に書く値について、正しいものはどれか。

- A. どのリソースでも、Terraform が割り当てる連番である
- B. 何を書いてもよい
- C. 常にリソースの ARN である
- D. リソースの種類ごとに決まっていて、プロバイダーのドキュメントの Import の節に書かれている

**問6** `Terraform-7.0-006` `terraform import` コマンドと比べた、`import` ブロックの利点として正しいものはどれか。(2つ選べ)

- A. 設定に書くのでレビューでき、複数のリソースをまとめて取り込める
- B. 取り込んだ後に plan を確かめる必要がない
- C. 取り込む前に、plan で内容を確認できる
- D. 取り込んだリソースの state が暗号化される
- E. 取り込むときにリソースが自動で作り直される

**問7** `Terraform-7.0-007` import で取り込んだ後に、必ず確認すべきことはどれか。

- A. `terraform fmt` の結果に変更がないこと
- B. `terraform plan` を実行し、設定と実物の間に差分がないこと
- C. `.terraform.lock.hcl` が更新されたこと
- D. 取り込んだリソースが新しく作り直されたこと

**問8** `Terraform-7.0-008` `terraform import aws_instance.web i-0abc1234` を実行したが、エラーになった。設定にはまだ何も書いていない。原因として最も考えられるものはどれか。

- A. インスタンスの ID の形式が誤っている
- B. EC2 は import できない
- C. `import` は HCP Terraform でしか使えない
- D. `terraform import` コマンドは、取り込み先の `resource` ブロックが設定にないと実行できない

### 7.2 CLI で state を調べる

**問9** `Terraform-7.0-009` state で管理しているリソースのアドレスの一覧を表示したい。使うコマンドはどれか。

- A. `terraform providers`
- B. `terraform state show`
- C. `terraform output`
- D. `terraform state list`

**問10** `Terraform-7.0-010` state で管理している `aws_instance.web` の、インスタンスの ID やプライベート IP などすべての属性を確認したい。使うコマンドはどれか。

- A. `terraform state show aws_instance.web`
- B. `terraform console aws_instance.web`
- C. `terraform state list aws_instance.web`
- D. `terraform validate aws_instance.web`

**問11** `Terraform-7.0-011` モジュール `network` の中のリソースだけの一覧を表示したい。正しいコマンドはどれか。

- A. `terraform state list module.network`
- B. `terraform state show module.network`
- C. `terraform show module.network`
- D. `terraform output module.network`

**問12** `Terraform-7.0-012` `terraform plan -out=tfplan` で保存した計画の内容を、人が読める形で表示したい。使うコマンドはどれか。

- A. `terraform state show tfplan`
- B. `terraform show tfplan`
- C. `cat tfplan`
- D. `terraform output tfplan`

**問13** `Terraform-7.0-013` state の内容を JSON で出力し、別のツールで処理したい。使うコマンドはどれか。

- A. `terraform fmt -json`
- B. `terraform validate`
- C. `terraform show -json`
- D. `terraform state list -json`

**問14** `Terraform-7.0-014` `terraform state list` と `terraform state show` について、正しいものはどれか。

- A. どちらも読むだけで、state もインフラも変えない
- B. `state show` を実行すると、リソースが refresh されて変更される
- C. `state list` はロックファイルの内容を表示する
- D. どちらも state を書き換える

### 7.3 詳しいログをいつ、どう使うか

**問15** `Terraform-7.0-015` Terraform の詳しいログを有効にする環境変数はどれか。

- A. `TF_DEBUG`
- B. `TF_LOG`
- C. `TERRAFORM_VERBOSE`
- D. `TF_VAR_log`

**問16** `Terraform-7.0-016` `TF_LOG` に設定できるレベルのうち、最も詳しいものはどれか。

- A. `INFO`
- B. `TRACE`
- C. `DEBUG`
- D. `ERROR`

**問17** `Terraform-7.0-017` ログをファイル `./tf.log` に書き出したい。正しい設定はどれか。

- A. `TF_LOG=DEBUG` と `TF_LOG_PATH=./tf.log` の両方を設定する
- B. `terraform plan > ./tf.log` だけを実行する
- C. `TF_LOG_PATH=./tf.log` だけを設定する
- D. `TF_LOG=./tf.log` を設定する

**問18** `Terraform-7.0-018` プロバイダーと API のやり取りだけを詳しく見たい。Terraform 本体のログは減らしたい。使う環境変数はどれか。

- A. `TF_LOG_PATH`
- B. `TF_PROVIDER_DEBUG`
- C. `TF_LOG_CORE`
- D. `TF_LOG_PROVIDER`

**問19** `Terraform-7.0-019` 詳しいログを他の人に渡すときの注意として、正しいものはどれか。

- A. ログには認証情報や機密の値が含まれることがあるので、渡す前に中身を確認する
- B. ログは暗号化されているので、復号の鍵も渡す
- C. ログには機密情報は入らないので、そのまま渡してよい
- D. ログを渡すには HCP Terraform が必要である

**問20** `Terraform-7.0-020` `TF_LOG` を設定していないとき、Terraform の詳しいログはどうなるか。

- A. 既定で `INFO` のログが標準出力に出る
- B. HCP Terraform に送られる
- C. 既定で作業ディレクトリの `terraform.log` に書かれる
- D. 出力されない

## 解答・解説

### 問1 `Terraform-7.0-001`

**正解**: C

import は、管理画面などで作られた既存のリソースを、Terraform の state に記録して管理下に入れる操作です。リソースを新しく作ったり、複製したりはしません。state を別のバックエンドに移すのは `init -migrate-state` です。

### 問2 `Terraform-7.0-002`

**正解**: B

Terraform 1.5 以降は、`import` ブロックを設定に書き、`plan` で取り込まれる内容を確認してから `apply` するのが推奨です。state の手での編集や `state push` は危険で、削除と作り直しはサービスを止めてしまいます。

### 問3 `Terraform-7.0-003`

**正解**: D

`import` ブロックがあると、`plan` は既存のバケットを取り込む計画(`will be imported`)を表示します。新しく作ることはしません。Terraform 1.5 以降は、`terraform import` コマンドでなくても、設定の `import` ブロックで取り込めます。

### 問4 `Terraform-7.0-004`

**正解**: C

`terraform plan -generate-config-out=ファイル名` は、`resource` ブロックがない `import` ブロックについて、実物の属性から `resource` ブロックの下書きを作り、ファイルに書き出します。`terraform import` コマンドには設定を生成する機能はありません。

### 問5 `Terraform-7.0-005`

**正解**: D

`id` に何を書くかは、リソースの種類ごとに決まっています。S3 バケットならバケット名、EC2 ならインスタンスの ID のように、プロバイダーのドキュメントの Import の節で確認します。常に ARN というわけではなく、連番でもありません。

### 問6 `Terraform-7.0-006`

**正解**: A、C

`import` ブロックは、取り込む前に `plan` で内容を確認でき、設定に書くのでレビューでき、複数のリソースをまとめて取り込めます。import でリソースが作り直されたり、state が暗号化されたりはしません。取り込んだ後も、`plan` で差分がないことを確かめる必要があります。

### 問7 `Terraform-7.0-007`

**正解**: B

import は state に記録するだけで、設定が実物と一致しているかは保証しません。取り込んだ後に `plan` を実行し、差分がない(No changes)ことを確かめます。差分があれば、設定を実物に合わせて直します。そのままにすると、次の apply で実物が設定どおりに変えられてしまいます。

- A. `fmt` は書き方を整えるだけで、実物との差は調べません。
- C. ロックファイルはプロバイダーのバージョンを記録するもので、import では更新されません。
- D. import はすでにあるリソースを管理に入れるもので、作り直しはしません。作り直されたら、それは失敗です。

### 問8 `Terraform-7.0-008`

**正解**: D

`terraform import` コマンドは、取り込み先のアドレスの `resource` ブロックが設定にあることが前提で、ないとエラーになります。設定を自動で作る機能もありません。`import` ブロックと `-generate-config-out` を使えば、設定がなくても下書きを作れます。EC2 は import できます。

### 問9 `Terraform-7.0-009`

**正解**: D

`terraform state list` は、state で管理しているリソースのアドレスの一覧を表示します。`state show` は 1 つのリソースの属性、`providers` は必要なプロバイダー、`output` は出力の値です。

### 問10 `Terraform-7.0-010`

**正解**: A

`terraform state show アドレス` は、1 つのリソースの、state に記録されたすべての属性を表示します。`state list` は一覧だけで、属性は表示しません。`console` は式を試す画面で、`validate` は設定の検証です。

### 問11 `Terraform-7.0-011`

**正解**: A

`terraform state list` にアドレスを付けると、そのアドレスに当てはまるリソースだけを表示します。`module.network` を付けると、そのモジュールの中のリソースだけが一覧になります。`state show` は 1 つのリソースを指定するコマンドです。

### 問12 `Terraform-7.0-012`

**正解**: B

`terraform show` に計画のファイルを渡すと、その計画の内容を人が読める形で表示します。計画のファイルはバイナリなので、`cat` では読めません。`state show` と `output` は計画のファイルを読みません。

### 問13 `Terraform-7.0-013`

**正解**: C

`terraform show -json` は、state(または計画のファイル)を JSON で出力します。他のツールで処理するのに使います。`state list` と `fmt` に `-json` はなく、`validate` は設定の検証です。

### 問14 `Terraform-7.0-014`

**正解**: A

`state list` と `state show` は、state の内容を読んで表示するだけで、state もインフラも変えません。refresh も行いません。ロックファイルの内容を表示するコマンドではありません。

### 問15 `Terraform-7.0-015`

**正解**: B

詳しいログは、環境変数 `TF_LOG` にレベル(`TRACE`、`DEBUG` など)を設定して有効にします。`TF_DEBUG` や `TERRAFORM_VERBOSE` という環境変数はありません。`TF_VAR_` で始まる環境変数は、変数に値を渡すためのものです。

### 問16 `Terraform-7.0-016`

**正解**: B

ログのレベルは、詳しい順に `TRACE`、`DEBUG`、`INFO`、`WARN`、`ERROR` です。最も詳しいのは `TRACE` です。`ERROR` は最も少なく、エラーだけを出します。

### 問17 `Terraform-7.0-017`

**正解**: A

`TF_LOG_PATH` はログを書き出すファイルを指定しますが、`TF_LOG` でログを有効にしていないと何も書かれません。両方を設定します。`>` でリダイレクトするのは標準出力で、ログは標準エラー出力に出るので入りません。`TF_LOG` にはレベルを書きます。

### 問18 `Terraform-7.0-018`

**正解**: D

`TF_LOG_PROVIDER` はプロバイダーのログだけ、`TF_LOG_CORE` は Terraform 本体のログだけのレベルを決めます。プロバイダーと API のやり取りを見たいので、`TF_LOG_PROVIDER=TRACE` のように設定します。`TF_PROVIDER_DEBUG` という環境変数はありません。

### 問19 `Terraform-7.0-019`

**正解**: A

詳しいログには、API への要求と応答が含まれ、認証情報や機密の値が入ることがあります。渡す前に中身を確認し、必要なら消します。ログは暗号化されておらず、渡すのに HCP Terraform は必要ありません。

### 問20 `Terraform-7.0-020`

**正解**: D

`TF_LOG` を設定していないと、詳しいログは出力されません。ログを見るには、`TF_LOG` にレベルを設定します。既定でファイルに書かれたり、HCP Terraform に送られたりはしません。
