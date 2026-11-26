# Terraform 問題 6.0 Terraform の state の管理

対象: Terraform Associate(004) / 全25問 / すべてオリジナル問題
対応テキスト: `Terraform_6.0_stateの管理.md`
解答・解説は末尾。

## 問題

### 6.1 local バックエンド

**問1** `Terraform-6.0-001` バックエンドを何も設定していない設定で `terraform apply` を実行した。state が保存される場所はどれか。

- A. `.terraform.lock.hcl`
- B. HCP Terraform
- C. 作業ディレクトリの `terraform.tfstate`
- D. ホームディレクトリの `.terraform.d/`

**問2** `Terraform-6.0-002` local バックエンドで `terraform apply` を実行したとき、更新の前の state が残されるファイルはどれか。

- A. `terraform.tfstate.backup`
- B. `.terraform/backup.tfstate`
- C. 残されない
- D. `terraform.tfstate.old`

**問3** `Terraform-6.0-003` 3 人のチームで、local バックエンドのまま同じインフラを管理している。起きやすい問題として、正しいものはどれか。(2つ選べ)

- A. 他のメンバーが最新の state を使えず、同じリソースを重複して作ろうとする
- B. 別々のパソコンから同時に apply すると、ロックが効かず、変更がぶつかる
- C. state が自動で暗号化されるので、復号の鍵の共有が必要になる
- D. Terraform が local バックエンドでの apply を拒否する
- E. プロバイダーがダウンロードできなくなる

**問4** `Terraform-6.0-004` local バックエンドで `terraform workspace new dev` を実行し、`apply` した。`dev` の state が保存される場所はどれか。

- A. `dev/terraform.tfstate`
- B. `terraform.tfstate`
- C. `terraform.tfstate.d/dev/terraform.tfstate`
- D. `.terraform/dev.tfstate`

**問5** `Terraform-6.0-005` CLI のワークスペースについて、正しいものはどれか。

- A. `default` のワークスペースは削除できない
- B. 設定の中で今のワークスペースの名前を参照することはできない
- C. ワークスペースごとに、別のバックエンドと認証情報を使える
- D. 最初からあるワークスペースは `main` である

### 6.2 state のロック

**問6** `Terraform-6.0-006` state のロックの目的として、正しいものはどれか。

- A. プロバイダーのバージョンを固定する
- B. 誤ってリソースが削除されるのを防ぐ
- C. 複数の操作が同時に同じ state を書き換えて、壊したり変更を失ったりするのを防ぐ
- D. state を暗号化する

**問7** `Terraform-6.0-007` ロックに対応したバックエンドで、state のロックを有効にするために必要な作業はどれか。

- A. すべてのリソースに `lifecycle { lock = true }` を書く
- B. 何もしなくてよい。state を書き換えうる操作で自動でロックされる
- C. `-lock=true` を毎回付ける
- D. `terraform lock` コマンドを毎回実行する

**問8** `Terraform-6.0-008` `terraform apply` を実行したところ、別のメンバーが操作中で `Error acquiring the state lock` と表示された。相手の操作が終わるまで、最大 5 分待ってから実行したい。使うオプションはどれか。

- A. `-lock=false`
- B. `-wait=300`
- C. `-parallelism=5`
- D. `-lock-timeout=5m`

**問9** `Terraform-6.0-009` CI のジョブが apply の途中で強制終了され、ロックが残った。誰も操作していないことを確認した。ロックを外すコマンドはどれか。

- A. `terraform init -reconfigure`
- B. `terraform state rm lock`
- C. `terraform apply -lock=false`
- D. `terraform force-unlock LOCK_ID`

**問10** `Terraform-6.0-010` Terraform 1.11 以降で、S3 バックエンドの state のロックを、DynamoDB を使わずに有効にする設定はどれか。

- A. `encrypt = true`
- B. `lock = "s3"`
- C. `use_lockfile = true`
- D. `dynamodb_table = "locks"`

### 6.3 backend ブロックでリモートの state を設定する

**問11** `Terraform-6.0-011` チームでリモートのバックエンドを使う利点として、正しいものはどれか。(2つ選べ)

- A. state に機密情報が入らなくなる
- B. plan が不要になる
- C. チームの全員と CI が同じ state を使える
- D. ロックや暗号化、アクセス制御を使える
- E. `terraform init` が不要になる

**問12** `Terraform-6.0-012` 次の backend ブロックで `terraform init` を実行するとエラーになった。原因はどれか。

```hcl
terraform {
  backend "s3" {
    bucket = var.state_bucket
    key    = "app/terraform.tfstate"
    region = "ap-northeast-1"
  }
}
```

- A. backend ブロックは `provider` ブロックの中に書く必要がある
- B. `region` は環境変数でしか渡せない
- C. backend ブロックでは、変数や参照を使えない
- D. S3 バックエンドには `key` を書けない

**問13** `Terraform-6.0-013` S3 バックエンドの state のバケット名を、環境ごとに変えたい。backend ブロックでは変数を使えない。正しい方法はどれか。

- A. `terraform apply -var="state_bucket=..."` で渡す
- B. backend ブロックに `locals` の値を書く
- C. backend ブロックの一部を空にし、`terraform init -backend-config=...` で値を渡す
- D. バケット名を変えることはできない

**問14** `Terraform-6.0-014` バックエンドの設定を変えた後に必要な操作はどれか。

- A. `terraform init` を再び実行する
- B. 何もしなくても、次の `plan` で自動で切り替わる
- C. `.terraform.lock.hcl` を削除する
- D. `terraform fmt` を実行する

**問15** `Terraform-6.0-015` HCP Terraform に state を置き、リモートで実行したい。`terraform` ブロックに書くものはどれか。

- A. `remote_state { … }`
- B. `cloud { organization = "…" workspaces { name = "…" } }`
- C. `backend "hcp" { … }`
- D. `provider "hcp" { … }`

**問16** `Terraform-6.0-016` ネットワークのチームの state(S3)の出力 `subnet_id` を、アプリのチームの設定で使いたい。使うものはどれか。

- A. `terraform state pull` の結果を手でコピーする
- B. `module` ブロック
- C. `data "terraform_remote_state"`
- D. `moved` ブロック

**問17** `Terraform-6.0-017` `terraform_remote_state` データソースで読めるものはどれか。

- A. 別の state のルートモジュールの出力
- B. 別の設定の子モジュールの出力(ルートで出力にしていないもの)
- C. 別の設定の変数の既定値
- D. 別の state のすべてのリソースの属性(出力にしていないものも)

### 6.4 リソースのドリフトと state を管理する

**問18** `Terraform-6.0-018` ドリフトの説明として、正しいものはどれか。

- A. プロバイダーのバージョンが古いこと
- B. state のロックが残っていること
- C. 設定ファイルの書式が標準から外れていること
- D. Terraform の外での変更で、実際のインフラが state や設定とずれていること

**問19** `Terraform-6.0-019` 誰かが管理画面で EC2 のインスタンスタイプを変えた。設定の値が正しいので、元に戻したい。実行するコマンドはどれか。

- A. `terraform apply -refresh-only`
- B. `terraform state rm aws_instance.web`
- C. `terraform fmt`
- D. `terraform apply`

**問20** `Terraform-6.0-020` 管理画面でセキュリティグループの説明を変えた。この変更を正しいものとして受け入れることにし、設定も合わせて書き換えた。state を実際のインフラに合わせて更新したい。インフラは変えたくない。実行するコマンドはどれか。

- A. `terraform destroy`
- B. `terraform init -upgrade`
- C. `terraform apply -refresh-only`
- D. `terraform apply -replace=aws_security_group.web`

**問21** `Terraform-6.0-021` `terraform plan -refresh-only` について、正しいものはどれか。

- A. 確認なしで state を書き換える
- B. インフラを設定どおりに直す計画を表示する
- C. 実際のインフラを読み取り、state がどう更新されるかだけを表示する。インフラは変えない
- D. state を削除する

**問22** `Terraform-6.0-022` 設定で `resource "aws_instance" "web"` を `resource "aws_instance" "frontend"` に名前を変えた。そのまま `plan` すると、古いインスタンスの削除と新しいインスタンスの作成になった。実物はそのままにして、名前だけを変えたい。推奨される方法はどれか。

- A. `terraform apply -replace=aws_instance.frontend`
- B. 名前を元に戻すしかない
- C. `lifecycle { prevent_destroy = true }` を追加する
- D. `moved { from = aws_instance.web  to = aws_instance.frontend }` を設定に追加する

**問23** `Terraform-6.0-023` S3 バケットを Terraform の管理から外したい。バケットとデータは削除せず、AWS に残したい。推奨される方法はどれか。

- A. `terraform apply -replace=aws_s3_bucket.logs`
- B. `removed` ブロックに `lifecycle { destroy = false }` を書いて `apply` する
- C. 設定から `resource` ブロックを削除して `terraform apply` する
- D. `terraform destroy -target=aws_s3_bucket.logs`

**問24** `Terraform-6.0-024` `terraform state rm aws_s3_bucket.logs` を実行したときの動作として、正しいものはどれか。

- A. 設定ファイルから `resource` ブロックが削除される
- B. AWS のバケットが削除され、state からも外れる
- C. バケットが作り直される
- D. state からだけ外れ、AWS のバケットは残る

**問25** `Terraform-6.0-025` 非推奨になった `terraform refresh` の代わりに推奨されるコマンドはどれか。

- A. `terraform init -reconfigure`
- B. `terraform apply -refresh-only`
- C. `terraform state push`
- D. `terraform plan -refresh=false`

## 解答・解説

### 問1 `Terraform-6.0-001`

**正解**: C

**テキスト**: 1. local バックエンドとは

バックエンドを設定しないと local バックエンドが使われ、state は作業ディレクトリの `terraform.tfstate` に保存されます。HCP Terraform に置くには `cloud` ブロックが必要です。`.terraform.lock.hcl` はプロバイダーのバージョンの記録です。

### 問2 `Terraform-6.0-002`

**正解**: A

**テキスト**: 1. local バックエンドとは

local バックエンドは、state を更新する前の内容を `terraform.tfstate.backup` に残します。誤った変更のときに戻すのに使えます。

`.terraform/` はプロバイダーやモジュールを入れる作業用のディレクトリで、state の控えは置きません。`terraform.tfstate.old` という名前のファイルは作られません。

### 問3 `Terraform-6.0-003`

**正解**: A、B

**テキスト**: 2. local バックエンドの限界

local バックエンドでは、state は各自のパソコンにあるので、他のメンバーは最新の state を使えず、既にあるリソースをまた作ろうとします。また、ロックは同じマシンの中でしか効かないので、別々のパソコンからの同時の apply を防げません。local の state は暗号化されません。apply が拒否されたり、プロバイダーが使えなくなったりはしません。

### 問4 `Terraform-6.0-004`

**正解**: C

**テキスト**: 3. CLI のワークスペース

local バックエンドでは、`default` 以外のワークスペースの state は `terraform.tfstate.d/<ワークスペース名>/terraform.tfstate` に保存されます。`terraform.tfstate` は `default` のワークスペースの state です。

### 問5 `Terraform-6.0-005`

**正解**: A

**テキスト**: 3. CLI のワークスペース

最初からあるワークスペースは `default` で、削除できません。CLI のワークスペースは同じバックエンドと認証情報を共有します。設定の中では `terraform.workspace` で今の名前を参照できます。

### 問6 `Terraform-6.0-006`

**正解**: C

**テキスト**: 1. ロックの目的

ロックは、複数の操作が同時に同じ state を書き換えるのを防ぎます。同時に書き換えると、state が壊れたり、片方の変更が失われたりします。暗号化、削除の防止(`prevent_destroy`)、プロバイダーのバージョンの固定(ロックファイル)とは別のものです。

### 問7 `Terraform-6.0-007`

**正解**: B

**テキスト**: 1. ロックの目的

ロックに対応したバックエンドなら、`plan` や `apply` など state を書き換えうる操作で自動でロックされ、終わると解除されます。`terraform lock` というコマンドや、`lifecycle` の `lock` という設定はありません。

### 問8 `Terraform-6.0-008`

**正解**: D

**入力の別解**: `-lock-timeout=300s`

**テキスト**: 3. ロックのオプション

`-lock-timeout` は、ロックが取れないときに指定した時間だけ待ちます。既定は待たずにすぐエラーです。`-lock=false` はロックを使わない危険な設定で、相手の操作とぶつかります。`-parallelism` は同時に処理するリソースの数です。

### 問9 `Terraform-6.0-009`

**正解**: D

**テキスト**: 3. ロックのオプション

異常終了で残ったロックは、`terraform force-unlock` にエラーに表示されたロックの ID を付けて外します。誰も操作していないことを確かめてから使います。`-lock=false` で実行するとロックは残ったままで、他の人の操作も守られません。

### 問10 `Terraform-6.0-010`

**正解**: C

**テキスト**: 2. ロックに対応したバックエンド

S3 バックエンドで `use_lockfile = true` にすると、state と同じ場所にロックファイル(`.tflock`)を置いてロックします。Terraform 1.11 以降、DynamoDB でのロック(`dynamodb_table`)は非推奨です。`encrypt` は state の暗号化です。

### 問11 `Terraform-6.0-011`

**正解**: C、D

**テキスト**: 2. リモートのバックエンドの利点

リモートのバックエンドでは、チームと CI が同じ state を使え、ロック、暗号化、アクセス制御、バージョン管理も使えます。state に機密情報が入ること自体は変わらないので、保護が必要です。`init` と `plan` は引き続き必要です。

### 問12 `Terraform-6.0-012`

**正解**: C

**テキスト**: 1. backend ブロック

backend ブロックは、変数やリソースよりも先に初期化されるので、`var.` などの変数や参照は使えません。値は直接書くか、部分的な設定で `init` のときに渡します。`key` と `region` は S3 バックエンドの通常の引数です。

### 問13 `Terraform-6.0-013`

**正解**: C

**テキスト**: 3. 部分的な設定(partial configuration)

backend ブロックの一部を空にしておき、`terraform init -backend-config=backend-prod.hcl`(または `-backend-config="bucket=…"`)で値を渡します。これを部分的な設定と呼びます。`locals` も使えず、`apply` の `-var` はバックエンドには渡りません。

### 問14 `Terraform-6.0-014`

**正解**: A

**テキスト**: 1. backend ブロック

バックエンドの設定を変えたら、`terraform init` を再び実行します。state を移すなら `-migrate-state`、移さずに設定し直すなら `-reconfigure` を付けます。`plan` で自動で切り替わることはありません。

### 問15 `Terraform-6.0-015`

**正解**: B

**テキスト**: 4. HCP Terraform に state を置く: cloud ブロック

HCP Terraform を使うときは、`terraform` ブロックに `cloud` ブロックを書き、組織とワークスペースを指定します。`backend "hcp"`、`remote_state`、`provider "hcp"` で state の置き場所を決めることはできません。

### 問16 `Terraform-6.0-016`

**正解**: C

**テキスト**: 5. 他の設定の出力を読む: terraform_remote_state

別の state の出力を読むには `terraform_remote_state` データソースを使い、`data.terraform_remote_state.名前.outputs.subnet_id` で参照します。`module` ブロックはモジュールを呼ぶもので、別の state は読みません。手でのコピーは値の変更に追いつけません。

### 問17 `Terraform-6.0-017`

**正解**: A

**テキスト**: 5. 他の設定の出力を読む: terraform_remote_state

`terraform_remote_state` で読めるのは、相手の state のルートモジュールの出力だけです。出力にしていないリソースの属性や、子モジュールの出力(ルートで出力にしていないもの)、変数は読めません。ただし、読むには state 全体を読める権限が必要です。

### 問18 `Terraform-6.0-018`

**正解**: D

**テキスト**: 1. ドリフトとは

ドリフトは、Terraform の外での変更で、実際のインフラが state や設定とずれた状態です。`plan` で「Objects have changed outside of Terraform」と表示されます。書式の乱れ、古いプロバイダー、残ったロックはドリフトではありません。

### 問19 `Terraform-6.0-019`

**正解**: D

**テキスト**: 2. ドリフトへの対応

設定が正しいなら、普通に `terraform apply` すると、実際のインフラが設定どおりに直されます。`-refresh-only` は state を実際のインフラに合わせるだけで、インスタンスタイプは変更されたまま残ります。`state rm` は管理から外す操作です。

### 問20 `Terraform-6.0-020`

**正解**: C

**テキスト**: 2. ドリフトへの対応

`apply -refresh-only` は、実際のインフラを読み取り、確認のうえ state だけを更新します。インフラは変えません。外での変更を受け入れるときは、設定も合わせて直しておくことで、次の plan で差分が出なくなります。`-replace` は作り直し、`destroy` は削除です。

### 問21 `Terraform-6.0-021`

**正解**: C

**テキスト**: 2. ドリフトへの対応

`plan -refresh-only` は、実際のインフラを読み取って、state がどう更新されるかだけを表示します。インフラも state も変えません。state を更新するのは `apply -refresh-only` です(確認あり)。

### 問22 `Terraform-6.0-022`

**正解**: D

**テキスト**: 3. リソースの名前を変える: moved ブロック

`moved` ブロックは、state の中のアドレスを古い名前から新しい名前に移し、実物の削除と作成をしません。設定に書くのでレビューでき、全員の環境に同じように反映されます。`-replace` は作り直しで、`prevent_destroy` は削除の計画をエラーにするだけで、名前の変更にはなりません。

### 問23 `Terraform-6.0-023`

**正解**: B

**テキスト**: 4. 管理をやめる(実物は残す): removed ブロック

`removed` ブロックに `lifecycle { destroy = false }` を書いて `apply` すると、リソースを state から外し、実物は残します。`resource` ブロックを消すだけだと、Terraform はそのバケットを削除します。`destroy -target` も削除し、`-replace` は作り直しです。

### 問24 `Terraform-6.0-024`

**正解**: D

**テキスト**: 5. terraform state のコマンド

`terraform state rm` は、指定したリソースを state から外すだけで、実物は削除しません。設定ファイルも変わらないので、`resource` ブロックを残したまま `plan` すると、同じものを新しく作ろうとします。設定からも消しておく必要があります。

### 問25 `Terraform-6.0-025`

**正解**: B

**テキスト**: 2. ドリフトへの対応

`terraform refresh` は、確認なしで state を書き換えるため非推奨になりました。代わりに、変更の内容を確認してから state を更新できる `terraform apply -refresh-only` を使います。`-refresh=false` は refresh を飛ばすオプションで、逆の働きです。
