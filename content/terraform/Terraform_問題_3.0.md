# Terraform 問題 3.0 Terraform の基本のワークフロー

対象: Terraform Associate(004) / 全26問 / すべてオリジナル問題
対応テキスト: `Terraform_3.0_基本のワークフロー.md`
解答・解説は末尾。

## 問題

### 3.1 Terraform のワークフロー

**問1** `Terraform-3.0-001` Terraform の基本のワークフローの 3 つの段階を、正しい順番に並べたものはどれか。

- A. Write → Apply → Plan
- B. Apply → Plan → Write
- C. Plan → Write → Apply
- D. Write → Plan → Apply

**問2** `Terraform-3.0-002` 依存関係のない 30 個のリソースを、既定の設定で `terraform apply` した。Terraform の動作として正しいものはどれか。

- A. 1 つずつ順番に作る
- B. ランダムな順番で 1 つずつ作る
- C. 30 個すべてを同時に作る
- D. 既定で最大 10 個ずつ並列に作る

**問3** `Terraform-3.0-003` VPC、サブネット、EC2 インスタンスを作る設定がある。サブネットは VPC の ID を、EC2 はサブネットの ID を参照している。`terraform destroy` で削除される順番はどれか。

- A. 設定ファイルに書かれた順番
- B. VPC → サブネット → EC2
- C. EC2 → サブネット → VPC
- D. 3 つを同時に削除する

### 3.2 作業ディレクトリの初期化(terraform init)

**問4** `Terraform-3.0-004` `terraform init` が行うこととして、正しいものはどれか。(2つ選べ)

- A. state の内容を実際のインフラに合わせて書き換える
- B. 必要なプロバイダーをダウンロードする
- C. 設定どおりにリソースを作る
- D. バックエンドを初期化する
- E. 設定ファイルの書式を整える

**問5** `Terraform-3.0-005` `terraform init` について、正しいものはどれか。

- A. 何度実行しても安全で、モジュールやプロバイダーを追加したときにも実行する
- B. HCP Terraform を使うときだけ必要である
- C. 実行するとすべてのリソースが削除される
- D. 一度だけしか実行できず、二度目はエラーになる

**問6** `Terraform-3.0-006` 既存の設定に、新しく子モジュールを呼ぶ `module` ブロックを追加した。`terraform plan` を実行するとエラーになった。最初に実行すべきコマンドはどれか。

- A. `terraform state list`
- B. `terraform apply -auto-approve`
- C. `terraform init`(または `terraform get`)
- D. `terraform fmt`

**問7** `Terraform-3.0-007` バックエンドを local から S3 に変更し、今ある state を S3 に移したい。実行するコマンドはどれか。

- A. `terraform apply -target=backend`
- B. `terraform plan -refresh-only`
- C. `terraform init -migrate-state`
- D. `terraform state push`

### 3.3 設定の検証(terraform validate)

**問8** `Terraform-3.0-008` `terraform validate` が見つけられるものはどれか。

- A. IAM の権限が足りず、作成に失敗すること
- B. リソースに存在しない引数を書いていること
- C. AWS アカウントの EC2 の台数の上限を超えていること
- D. S3 バケットの名前が、世界で既に使われていること

**問9** `Terraform-3.0-009` `terraform validate` について、正しいものはどれか。

- A. 実行すると、設定ファイルの書式も整える
- B. プロバイダーのスキーマが必要なので、`terraform init` の後に実行する
- C. クラウドの API を呼び出して、リソースが作れるかを確かめる
- D. クラウドの認証情報が必須である

### 3.4 実行計画の作成と確認(terraform plan)

**問10** `Terraform-3.0-010` `terraform plan` の出力で、リソースの前に `-/+` と表示された。この意味はどれか。

- A. データソースを読み取る
- B. 削除してから作り直す
- C. 新しく作成する
- D. その場で更新する

**問11** `Terraform-3.0-011` `terraform plan` の出力の最後の行が次のとおりだった。正しい読み取りはどれか。

```
Plan: 2 to add, 1 to change, 1 to destroy.
```

- A. 2 つが削除され、1 つが作成され、1 つが更新される
- B. 4 つのリソースがすべて作り直される
- C. すでに 2 つが作成済みで、残りは失敗した
- D. 2 つが作成され、1 つがその場で更新され、1 つが削除される

**問12** `Terraform-3.0-012` `terraform plan` を実行したときに起きることとして、正しいものはどれか。

- A. 実際の状態を読み取り、設定と比べて変更の計画を表示する。インフラは変更しない
- B. 計画どおりにインフラを変更する
- C. 設定ファイルを書き換える
- D. state を削除する

**問13** `Terraform-3.0-013` レビューで承認された計画と、実際に適用する内容を確実に同じにしたい。最も適切な方法はどれか。

- A. `terraform apply` を 2 回実行する
- B. `terraform plan -out=tfplan` で計画を保存し、`terraform apply tfplan` で適用する
- C. `terraform validate` の後に `terraform apply` を実行する
- D. `terraform plan` の画面をスクリーンショットで残し、`terraform apply -auto-approve` を実行する

**問14** `Terraform-3.0-014` CI で、`terraform plan` の結果から変更があるかどうかを終了コードで判断したい。使うオプションと、変更があるときの終了コードの組み合わせはどれか。

- A. `-detailed-exitcode`、1
- B. `-check`、0
- C. `-detailed-exitcode`、2
- D. `-json`、2

**問15** `Terraform-3.0-015` `terraform plan` の出力に、EC2 の `public_ip` が `(known after apply)` と表示された。この意味はどれか。

- A. 値が機密情報なので表示されない
- B. 設定の誤りで値が読めない
- C. この属性は state から削除される
- D. リソースを作ってみるまで値が決まらない

**問16** `Terraform-3.0-016` 本番の環境で、全部を削除する前に、何が削除されるかを確認したい。実行するコマンドはどれか。

- A. `terraform destroy -auto-approve`
- B. `terraform plan -destroy`
- C. `terraform state rm`
- D. `terraform validate -destroy`

### 3.5 インフラへの変更の適用(terraform apply)

**問17** `Terraform-3.0-017` 引数なしで `terraform apply` を実行したときの動作として正しいものはどれか。

- A. 計画を作って表示し、`yes` と入力すると適用する
- B. 保存された計画がないとエラーになる
- C. 確認なしで、すぐに変更を適用する
- D. 計画を表示するだけで、適用はしない

**問18** `Terraform-3.0-018` CI のパイプラインで、対話の確認なしに `terraform apply` を実行したい。使うオプションはどれか。

- A. `-auto-approve`
- B. `-no-confirm`
- C. `-force`
- D. `-yes`

**問19** `Terraform-3.0-019` EC2 インスタンス `aws_instance.web` の中の OS が壊れた。設定は変えずに、このインスタンスだけを作り直したい。推奨される方法はどれか。

- A. `terraform state rm aws_instance.web` の後に `terraform apply`
- B. `terraform apply -replace="aws_instance.web"`
- C. `terraform destroy` の後に `terraform apply`
- D. `terraform taint aws_instance.web` の後に `terraform apply`

**問20** `Terraform-3.0-020` 5 つのリソースを作る `terraform apply` で、3 つ目のリソースの作成がエラーになった。正しいものはどれか。

- A. 作成に成功したリソースは state に記録される。原因を直して、もう一度 apply する
- B. 作成済みの 2 つも自動で削除され、元の状態に戻る
- C. 残りの 2 つも自動でリトライされ、必ず成功する
- D. state が壊れるので、state を削除してやり直す必要がある

**問21** `Terraform-3.0-021` `terraform apply` で、作成の途中で失敗したリソースは、state でどのように扱われるか。

- A. tainted(作り直しが必要)として記録され、次の apply で作り直される
- B. 正常なリソースとして記録される
- C. 別の state ファイルに移される
- D. state から削除される

### 3.6 Terraform が管理するインフラの削除(terraform destroy)

**問22** `Terraform-3.0-022` `terraform destroy` について、正しいものはどれか。

- A. 確認なしで削除する
- B. AWS アカウントの中のすべてのリソースを削除する
- C. 設定ファイルと state のファイルを削除する
- D. その設定の state で管理しているリソースをすべて削除する

**問23** `Terraform-3.0-023` `terraform destroy` と同じ意味のコマンドはどれか。

- A. `terraform plan -destroy`
- B. `terraform apply -replace`
- C. `terraform apply -destroy`
- D. `terraform state rm -all`

**問24** `Terraform-3.0-024` 10 個のリソースのうち、使わなくなった 1 つの S3 バケットだけを削除したい。普段の運用として推奨される方法はどれか。

- A. 管理画面でバケットを削除する
- B. `terraform destroy` で全部を削除してから、残りの 9 個を作り直す
- C. state のファイルからそのバケットの記述を手で消す
- D. 設定からそのバケットのリソースを削除し、`terraform apply` する

### 3.7 書式とスタイルの調整(terraform fmt)

**問25** `Terraform-3.0-025` CI で、設定ファイルの書式が標準どおりかを確かめたい。ファイルは書き換えず、サブディレクトリのファイルも対象にしたい。正しいコマンドはどれか。

- A. `terraform fmt -check -recursive`
- B. `terraform validate -recursive`
- C. `terraform fmt`
- D. `terraform fmt -diff`

**問26** `Terraform-3.0-026` `terraform fmt` について、正しいものはどれか。

- A. 存在しない引数などの設定の誤りを見つける
- B. 既定で、サブディレクトリも含めて整形する
- C. `terraform init` の後でないと実行できない
- D. 設定ファイルを HCL の標準の書式に書き換える

## 解答・解説

### 問1 `Terraform-3.0-001`

**正解**: D

**テキスト**: 1. 3 つの段階

設定を書き(Write)、変更の内容を確認し(Plan)、インフラに適用する(Apply)の順です。この 3 つを繰り返します。最初に一度だけ `terraform init` で作業ディレクトリを準備します。

### 問2 `Terraform-3.0-002`

**正解**: D

**テキスト**: 2. 依存関係のグラフ

Terraform は依存関係のないリソースを並列に作ります。同時に処理する数は既定で 10 で、`-parallelism` で変えられます。1 つずつ作るわけでも、上限なしに全部を同時に作るわけでもありません。

### 問3 `Terraform-3.0-003`

**正解**: C

**テキスト**: 2. 依存関係のグラフ

Terraform は参照から依存関係のグラフを作り、作成は依存されるものから(VPC → サブネット → EC2)、削除はその逆の順番(EC2 → サブネット → VPC)で行います。サブネットが残っていると VPC は削除できないためです。設定ファイルに書かれた順番は関係ありません。

### 問4 `Terraform-3.0-004`

**正解**: B、D

**テキスト**: 1. init が行うこと

`init` は、バックエンドの初期化、プロバイダーのダウンロード、モジュールのダウンロードを行います。リソースを作るのは `apply`、書式を整えるのは `fmt`、state を実際のインフラに合わせるのは `apply -refresh-only` です。`init` はインフラも state の内容も変えません。

### 問5 `Terraform-3.0-005`

**正解**: A

**テキスト**: 1. init が行うこと

`init` は何度実行しても安全です。プロバイダーやモジュールの追加・変更、バックエンドの設定の変更のたびに実行します。リソースは変更しません。HCP Terraform を使わない場合でも、ローカルのバックエンドの準備とプロバイダーのダウンロードのために必要です。

### 問6 `Terraform-3.0-006`

**正解**: C

**テキスト**: 1. init が行うこと

新しいモジュールはまだダウンロードされていないので、`plan` は「モジュールがインストールされていない」としてエラーになります。`terraform init`(モジュールだけなら `terraform get`)でダウンロードします。`fmt` は書式、`state list` は state の一覧です。

### 問7 `Terraform-3.0-007`

**正解**: C

**テキスト**: 2. 主なオプション

バックエンドの設定を変えたら `terraform init` を実行します。`-migrate-state` を付けると、既存の state を新しいバックエンドに移します。`state push` は state を直接上書きする危険な操作で、バックエンドの移行には使いません。

### 問8 `Terraform-3.0-008`

**正解**: B

`validate` は、構文、存在しない引数、必須の引数の不足、型や参照の誤りなど、設定そのものの誤りを見つけます。クラウドの API は呼ばないので、上限、名前の重複、権限の不足のように、実際に作ってみないと分からない問題は見つけられません。

### 問9 `Terraform-3.0-009`

**正解**: B

`validate` は、プロバイダーのスキーマ(引数の一覧)を使って確かめるので、`init` の後に実行します。クラウドの API は呼ばず、認証情報も不要です。書式は整えません。それは `fmt` の役割です。

### 問10 `Terraform-3.0-010`

**正解**: B

**テキスト**: 2. 記号の意味

`-/+` は、既存のリソースを削除してから作り直す(replace)ことを表します。作成後に変えられない引数(EC2 の AMI など)を変えたときに表示されます。作成は `+`、その場での更新は `~`、データソースの読み取りは `<=` です。

### 問11 `Terraform-3.0-011`

**正解**: D

**テキスト**: 2. 記号の意味

`Plan:` の行は、作成(add)、その場での更新(change)、削除(destroy)の件数です。
① 2 to add:2 つを作成します。
② 1 to change:1 つをその場で更新します。
③ 1 to destroy:1 つを削除します。

plan はまだ何も変更していないので、作成済みや失敗の意味ではありません。作り直し(replace)は、add と destroy の両方に 1 つずつ数えられます。

### 問12 `Terraform-3.0-012`

**正解**: A

**テキスト**: 1. plan の動き

`plan` は、state のリソースの今の状態を読み取り(refresh)、設定と比べて変更の計画を表示します。インフラも state も、設定ファイルも変更しません。

### 問13 `Terraform-3.0-013`

**正解**: B

**テキスト**: 3. 計画の保存

`plan -out` で保存した計画を `apply` に渡すと、その計画の内容だけを確認なしで適用します。レビューした内容と適用する内容が同じになります。スクリーンショットの後に `apply` を実行すると、その間にインフラが変わっていれば、別の計画で適用されるおそれがあります。

### 問14 `Terraform-3.0-014`

**正解**: C

**テキスト**: 4. 主なオプション

`-detailed-exitcode` を付けると、終了コードが 0 = 変更なし、1 = エラー、2 = 変更あり、になります。終了コード 1 はエラーを表すので、変更ありとは区別されます。`-check` は `fmt` のオプション、`-json` は出力の形式の指定です。

### 問15 `Terraform-3.0-015`

**正解**: D

**テキスト**: 2. 記号の意味

`(known after apply)` は、作ってみるまで値が決まらない属性です。インスタンスの ID や、割り当てられる IP アドレスなどが該当します。機密情報の場合は `(sensitive value)` と表示されます。

### 問16 `Terraform-3.0-016`

**正解**: B

**テキスト**: 4. 主なオプション

`terraform plan -destroy` は、全部を削除する計画を表示するだけで、何も削除しません。`destroy -auto-approve` は確認なしで削除してしまいます。`state rm` は state から外す操作で、`validate` に `-destroy` はありません。

### 問17 `Terraform-3.0-017`

**正解**: A

**テキスト**: 1. apply の動き

計画のファイルを渡さない `apply` は、まず計画を作って表示し、`yes` と入力したときだけ適用します。`yes` 以外を入力すると何もしません。確認を省略するには `-auto-approve` を使います。

### 問18 `Terraform-3.0-018`

**正解**: A

**入力の別解**: `--auto-approve`

**テキスト**: 1. apply の動き

`-auto-approve` を付けると、`yes` の入力なしに適用します。CI などで使いますが、本番では、保存した計画を渡す方法と組み合わせて慎重に使います。`-force`、`-yes`、`-no-confirm` というオプションはありません。

### 問19 `Terraform-3.0-019`

**正解**: B

**テキスト**: 2. リソースを作り直す: -replace

設定を変えずに特定のリソースを作り直すには、`terraform apply -replace="アドレス"` を使います。`taint` は同じことができますが非推奨です。`destroy` は全部を削除してしまいます。`state rm` は state から外すだけで、古いインスタンスは AWS に残り、新しいものが作られて二重になります。

### 問20 `Terraform-3.0-020`

**正解**: A

**テキスト**: 3. 途中で失敗したとき

Terraform の apply は全体を元に戻す(ロールバックする)仕組みを持ちません。作成に成功したリソースは state に記録されているので、原因を直して、もう一度 `plan` と `apply` を実行すれば、残りが作られます。state を削除すると、作成済みのリソースの管理が分からなくなります。

### 問21 `Terraform-3.0-021`

**正解**: A

**テキスト**: 3. 途中で失敗したとき

作成の途中で失敗したリソースは、正しく設定されていないおそれがあるので、state に tainted として記録されます。次の `apply` で、そのリソースは作り直されます。

### 問22 `Terraform-3.0-022`

**正解**: D

`destroy` が削除するのは、その作業ディレクトリの state で管理しているリソースだけです。アカウントの中の他のリソースは削除しません。設定ファイルは残り、`yes` の確認が必要です。

### 問23 `Terraform-3.0-023`

**正解**: C

`terraform destroy` は `terraform apply -destroy` の別名です。`plan -destroy` は削除の計画を見るだけで、`-replace` は特定のリソースを作り直すオプションです。`state rm` に `-all` というオプションはありません。

### 問24 `Terraform-3.0-024`

**正解**: D

Terraform は宣言的なので、設定からリソースを削除して `apply` すると、そのリソースだけが削除されます。これが普段の方法です。全部を削除するのは影響が大きすぎます。管理画面での削除はドリフトを生み、state の手での編集は避けます。

### 問25 `Terraform-3.0-025`

**正解**: A

**テキスト**: まとめ: よく出る判断

`terraform fmt -check` は、ファイルを書き換えずに、整形が必要なファイルがあれば 0 以外の終了コードを返します。既定では今のディレクトリだけが対象なので、サブディレクトリも見るには `-recursive` を付けます。オプションなしの `fmt` は書き換えてしまい、`-diff` も書き換えます。

### 問26 `Terraform-3.0-026`

**正解**: D

**テキスト**: まとめ: よく出る判断

`fmt` は、インデントや `=` の位置などを HCL の標準の書式に書き換えます。設定の意味の誤りは見つけません(それは `validate`)。既定では今のディレクトリだけが対象です。プロバイダーを使わないので、`init` の前でも実行できます。
