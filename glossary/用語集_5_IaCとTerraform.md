# 用語集 IaC と Terraform

## 考え方

### IaC
別名: Infrastructure as Code、コードによるインフラの管理
要約: インフラの構成をコードで書き、同じ手順で作り直せるようにする方法です。
インフラ(サーバー、ネットワーク、権限など)の構成をコードで書き、そのコードを実行して作る考え方です。レビューでき、同じ環境を何度でも作れ、変更の履歴が Git に残ります。
例: Terraform、CloudFormation、Ansible、Pulumi
注意: コードと実物がずれないように、手で変更しない運用とセットにします。
関連: Terraform、宣言的、冪等性

### 宣言的
別名: 宣言型
試験: Terraform、K8s
要約: 手順ではなく、最終的にあるべき状態を書く方法です。
「どういう状態にしたいか(最終の形)」を書き、そこに至る手順は道具に任せる書き方です。反対に、手順を順番に書くものを手続き的(命令的)と呼びます。Terraform と Kubernetes は宣言的です。
例: Terraform、Kubernetes のマニフェスト
注意: 手続き的(シェルスクリプトなど)は「何をするか」を書き、宣言的は「どうなっていてほしいか」を書きます。
関連: IaC、冪等性

### 冪等性
別名: べき等性
要約: 同じ操作を何度実行しても、結果が同じになる性質です。
何度実行しても、同じ結果になる性質です。すでに望む状態なら、何も変えません。IaC や Ansible で重視されます。
例: 一致していれば `terraform apply` は `No changes`
注意: シェルスクリプトで `mkdir` を 2 回すると失敗するように、手続き的な方法では自分で気をつける必要があります。
関連: 宣言的、IaC

### ドリフト
別名: 構成のずれ
試験: Terraform、K8s
要約: コードの状態と、実際のインフラの状態がずれることです。
コードの外での変更(管理画面での手作業など)で、実際のインフラがコードや記録とずれてしまうことです。Terraform は plan で、GitOps のツールは同期のときに見つけます。
例: コンソールで手でセキュリティグループを変えた
注意: `terraform plan -refresh-only` で見つけ、コードに取り込むか、apply で元に戻すかを決めます。
関連: state、GitOps

### イミュータブルインフラ
別名: イミュータブルなインフラ
試験: Terraform、Docker
要約: 動いているサーバーを直さず、新しく作り直して入れ替える考え方です。
動いているサーバーに手を加えず、変更するときは新しいものを作って入れ替える考え方です。手作業の変更で 1 台ずつ違ってしまう(スノーフレークサーバー)のを防ぎます。コンテナのイメージも同じ考え方です。
例: 新しい AMI を作って Auto Scaling で入れ替える、コンテナのイメージを入れ替える
注意: 作り直す前提なので、データはサーバーの外(データベース、S3)に置きます。
関連: IaC、イメージ

## Terraform の部品

### Terraform
試験: Terraform
要約: HashiCorp の IaC の道具で、HCL で書いた設定からインフラを作ります。
HashiCorp の IaC の道具です。HCL で書いた設定から、プロバイダーを通して、クラウドなどのリソースを作り、変え、消します。
例: `terraform init`、`plan`、`apply`、`destroy`
注意: Terraform 1.6 以降は BSL のライセンスです。オープンソースの分岐として OpenTofu があります。
関連: HCL、プロバイダー、state

### HCL
別名: HashiCorp Configuration Language
試験: Terraform
要約: Terraform の設定を書く言語です。
Terraform の設定を書く言語です。`resource "種類" "名前" { 引数 = 値 }` のようなブロックで書きます。
例: `resource "aws_instance" "web" { instance_type = "t3.micro" }`
注意: ファイルの拡張子は `.tf` で、同じディレクトリのすべての `.tf` がまとめて読まれます。
関連: Terraform

### プロバイダー
試験: Terraform
要約: Terraform から AWS などの API を操作するためのプラグインです。
Terraform が、AWS や GitHub などの各サービスの API を操作するためのプラグインです。`required_providers` で宣言し、`terraform init` でダウンロードします。
例: `hashicorp/aws`、`required_providers { aws = { source = "hashicorp/aws", version = "~> 6.0" } }`
注意: 同じプロバイダーを別のリージョンで使うときは、`alias` で 2 つ目を作ります。
関連: Terraform、ロックファイル

### リソース
別名: resource ブロック
試験: Terraform
要約: Terraform が作り、管理するインフラの部品です。
Terraform が作って管理するもの(EC2、VPC、バケットなど)と、それを書くブロックです。`種類.名前`(例: `aws_instance.web`)で参照します。
例: `resource "aws_s3_bucket" "logs" { … }`、アドレスは `aws_s3_bucket.logs`
注意: 名前(`logs`)を変えると、別のリソースとして作り直されます(`moved` で防ぐ)。
関連: データソース、state

### データソース
別名: data ブロック
試験: Terraform
要約: Terraform の外にある既存の情報を、読み取るだけのものです。
Terraform の外にある情報(既存の VPC、最新の AMI など)を読み取るだけのブロックです。作ったり消したりはしません。
例: `data "aws_ami" "ubuntu" { most_recent = true … }`、`data.aws_ami.ubuntu.id`
注意: データソースは作成も変更もしません。
関連: リソース

### モジュール
試験: Terraform
要約: 設定をまとめて、何度も使えるようにしたものです。
複数のリソースをまとめて、再利用できるようにした Terraform の設定のディレクトリです。`terraform` を実行するディレクトリがルートモジュールで、そこから呼ぶものを子モジュールと呼びます。
例: `module "vpc" { source = "terraform-aws-modules/vpc/aws" version = "~> 6.0" }`
注意: ソースやバージョンを変えたら、`terraform init` をやり直します。
関連: Terraform Registry

### Terraform Registry
別名: レジストリ(Terraform)
試験: Terraform
要約: 公開されたプロバイダーとモジュールを探して使える場所です。
プロバイダーとモジュールが公開されている場所です(registry.terraform.io)。HCP Terraform には、組織の中だけで使うプライベートレジストリもあります。
例: `registry.terraform.io`、Official、Partner、Community の区分
注意: Registry のモジュールは `version` で固定できますが、Git のソースは `?ref=` で固定します。
関連: プロバイダー、モジュール

### 変数
別名: 入力変数、variable
試験: Terraform
要約: 設定に外から値を渡すための入力です。
設定の外から値を渡すための仕組みです。`var.名前` で参照します。値は `-var`、`*.tfvars`、環境変数 `TF_VAR_名前`、既定値の順に優先されます。
例: `variable "env" { type = string }`、`-var="env=prod"`、`terraform.tfvars`、`TF_VAR_env`
注意: 優先順位は、`-var` が最も高く、環境変数が最も低い(既定値を除く)です。
関連: 出力

### 出力
別名: output
試験: Terraform
要約: 作ったリソースの値を、外に見せるためのものです。
作ったリソースの値(IP アドレス、ID など)を外に見せる仕組みです。子モジュールの値を親で使うときや、`terraform output` で表示するときに使います。
例: `output "vpc_id" { value = aws_vpc.main.id }`、`terraform output`
注意: 子モジュールの値は、子で output しないと親から参照できません。
関連: 変数、モジュール

### locals
別名: ローカル値
試験: Terraform
要約: 設定の中で何度も使う式に、名前を付けたものです。
設定の中で何度も使う値や式に、名前を付けるブロックです。`local.名前` で参照します。外から値は渡せません。
例: `locals { name = "${var.project}-${var.env}" }`、`local.name`
注意: 外から値を渡すのは変数(variable)で、locals は中で計算するだけです。
関連: 変数

### count
別名: for_each
試験: Terraform
要約: 同じリソースを、数を指定して複数作るメタ引数です。
1 つのブロックから、複数のリソースを作る仕組みです。count は番号で、for_each はキーで区別します。途中の要素を消しても番号がずれないので、for_each が安全です。
例: `count = 3`、`aws_instance.web[0]`
注意: 途中の要素を消すと番号がずれて作り直されるので、名前で管理するなら `for_each` を使います。
関連: リソース

### depends_on
試験: Terraform
要約: 参照のない依存関係を、明示的に書くメタ引数です。
参照がなく、Terraform が自動で気づけない依存関係を、明示するための引数です。普段は参照で依存が決まるので、必要なときだけ書きます。
例: `depends_on = [aws_iam_role_policy.app]`
注意: 属性を参照していれば依存関係は自動で決まるので、必要なときだけ使います。
関連: リソース

### lifecycle
別名: create_before_destroy、prevent_destroy、ignore_changes
試験: Terraform
要約: リソースの作り直しや変更の扱いを変える設定です。
リソースの作り直しや変更の扱いを変える設定です。新しいものを先に作る(create_before_destroy)、削除を禁止する(prevent_destroy)、ある属性の変化を無視する(ignore_changes)などがあります。
例: `create_before_destroy`、`prevent_destroy`、`ignore_changes`
注意: `prevent_destroy` は、そのリソースを消す plan をエラーにします。
関連: リソース

### moved
別名: removed
試験: Terraform
要約: リソースの名前や場所を変えたことを、作り直さずに伝えるブロックです。
リソースの名前やモジュールを変えたときに、作り直さずに state の記録だけを付け替えるブロックです。removed は、実物を残したまま Terraform の管理から外すブロックです。
例: `moved { from = aws_instance.web to = aws_instance.app }`
注意: 書かずに名前を変えると、古いものを消して新しく作る plan になります。
関連: state

### sensitive
別名: ephemeral、write-only
試験: Terraform
要約: 値を plan や出力の表示で隠す指定です。
sensitive は、値を画面に表示しないための印です。state には平文で残ります。state に残さないには、ephemeral の値と write-only の引数を使います。
例: `variable "db_password" { sensitive = true }`
注意: 表示で隠すだけで、state には平文で保存されます。
関連: state、秘密情報

## state

### state
別名: ステート、tfstate
試験: Terraform
要約: 設定のリソースと、実際のリソースの対応を記録したファイルです。
Terraform が、設定のリソースと実際のリソースの対応を記録したファイルです(`terraform.tfstate`)。パスワードなどが平文で入ることがあるので、Git に入れず、暗号化と権限の管理ができる場所に置きます。
例: `terraform.tfstate`、`terraform state list`、`terraform state show`
注意: パスワードなどが平文で入るので、Git に入れず、暗号化した場所に置きます。
関連: バックエンド、state のロック、ドリフト

### バックエンド
試験: Terraform
要約: state を保存する場所の設定です。
state を保存する場所の設定です。既定は手元のファイル(local)で、チームでは S3 や HCP Terraform のようなリモートに置きます。
例: `backend "s3" { bucket = "tf-state" key = "prod/terraform.tfstate" use_lockfile = true }`
注意: バックエンドを変えたら `terraform init -migrate-state` で state を移します。
関連: state、state のロック

### state のロック
別名: ロック(state)
試験: Terraform
要約: 同時に 2 人が apply して state が壊れないようにする仕組みです。
複数の人や CI が同時に state を書き換えて壊さないように、操作の間 state を押さえる仕組みです。S3 では `use_lockfile = true` で有効にします。
例: S3 の `use_lockfile = true`(1.11 以降)、HCP Terraform
注意: ロックが残ったときの `terraform force-unlock` は、本当に誰も実行していないことを確かめてから使います。
関連: state、バックエンド

### terraform_remote_state
別名: リモートの state
試験: Terraform
要約: 別の設定の state の出力を読むデータソースです。
別の設定の state から、ルートモジュールの出力を読むデータソースです。チームの間で値を受け渡すのに使います。
例: `data "terraform_remote_state" "network" { backend = "s3" … }`
注意: state 全体を読む権限が要るので、出力だけを公開する仕組み(HCP Terraform の機能など)も検討します。
関連: 出力、state

### ロックファイル
別名: .terraform.lock.hcl
試験: Terraform
要約: 選ばれたプロバイダーのバージョンとハッシュを記録するファイルです。
選ばれたプロバイダーのバージョンとハッシュ値を記録するファイルです。Git にコミットし、チーム全員が同じバージョンを使うようにします。
例: `.terraform.lock.hcl`
注意: Git にコミットします。state のロックとは関係ありません。
関連: プロバイダー

### import
別名: インポート
試験: Terraform
要約: すでにあるリソースを、Terraform の管理に取り込む仕組みです。
Terraform の外で作られた既存のリソースを、state に取り込むことです。`import` ブロックを書き、plan で確認してから apply します。
例: `import { to = aws_s3_bucket.logs id = "my-logs" }`、`terraform plan -generate-config-out=gen.tf`
注意: 取り込んだ後に plan で差分がないことを確かめます。
関連: state

### ワークスペース
別名: workspace
試験: Terraform
要約: 同じ設定で、別々の state を持つための仕組みです。
同じ設定で、別々の state を持つための仕組みです。CLI のワークスペースは state を分けるだけです。HCP Terraform のワークスペースは、変数、権限、実行の履歴も持つ管理の単位です。
例: `terraform workspace new dev`、`terraform.workspace`
注意: CLI のワークスペースと、HCP Terraform のワークスペースは別の意味です。
関連: state、HCP Terraform

## コマンド

### terraform init
別名: init
試験: Terraform
要約: 作業ディレクトリを準備し、プロバイダーとモジュールを入れるコマンドです。
作業ディレクトリを初期化するコマンドです。プロバイダーとモジュールをダウンロードし、バックエンドを準備します。何度実行しても安全です。
例: `terraform init`、`terraform init -upgrade`、`terraform init -migrate-state`
注意: ロックファイルがあると、新しい版があってもロックファイルの版を使います。
関連: プロバイダー、バックエンド

### terraform validate
別名: terraform fmt
試験: Terraform
要約: 設定の書き方と、内部の整合性を確かめるコマンドです。
validate は、設定の書き方や引数の誤りを、クラウドに問い合わせずに確かめるコマンドです。fmt は、設定を標準の書式に整えるコマンドです。
例: `terraform validate`
注意: API には問い合わせないので、AWS の側でエラーになる値までは見つけられません。
関連: terraform plan

### terraform plan
別名: 実行計画、plan
試験: Terraform
要約: 実行したときに何が変わるかを、変える前に表示するコマンドです。
今の設定を適用したら何が作られ、変わり、消えるかを、実際には何も変えずに表示するコマンドです。`+` は作成、`~` は変更、`-` は削除、`-/+` は作り直しです。
例: `+` 作成、`~` 変更、`-/+` 作り直し、`-` 削除、`terraform plan -out=tfplan`
注意: `-/+` は止まる時間が出るので、本番では特に確かめます。
関連: terraform apply

### terraform apply
別名: apply
試験: Terraform
要約: plan の内容を実際のインフラに反映するコマンドです。
計画を実行して、実際にインフラを変えるコマンドです。既定では確認で `yes` の入力を求めます。
例: `terraform apply tfplan`、`terraform apply -auto-approve`
注意: 保存した plan を apply すれば、レビューした内容と同じ変更になります。
関連: terraform plan

### terraform destroy
別名: destroy
試験: Terraform
要約: 管理しているリソースをすべて消すコマンドです。
その設定の state で管理しているリソースを、すべて削除するコマンドです。学習で作ったものは、終わったらこれで消すと、費用がかかり続けません。
例: `terraform destroy`、`terraform plan -destroy`
注意: 本番では `prevent_destroy` や、権限の分離で誤った実行を防ぎます。
関連: terraform apply

## 運用

### HCP Terraform
別名: Terraform Cloud
試験: Terraform
要約: HashiCorp の、Terraform をチームで使うためのサービスです。
HashiCorp のクラウドのサービスで、state の保管、リモートでの plan と apply、ポリシーのチェック、チームの権限の管理ができます。無料の枠では 500 個のリソースまで管理できます。
例: リモートでの実行、state の保存とロック、Sentinel、変数セット
注意: 無料の枠は管理するリソース 500 個までです。
関連: Terraform、ワークスペース、ポリシー as コード

### ポリシー as コード
別名: Policy as Code、Sentinel、OPA
試験: Terraform、K8s
要約: 守るべき決まりをコードで書き、自動で確かめる方法です。
組織のルール(使ってよいインスタンスタイプ、必須のタグなど)をコードで書き、自動で確かめる考え方です。HCP Terraform では Sentinel や OPA を、Kubernetes では Kyverno や Gatekeeper を使います。
例: Sentinel、OPA(Rego)、`instance_type` を決まったものだけに制限する
注意: plan の後、apply の前に確かめ、違反なら止めます。
関連: HCP Terraform

### CI/CD
別名: CI、継続的インテグレーション、継続的デリバリー
要約: コードの変更を自動で確かめ(CI)、自動で反映する(CD)仕組みです。
コードの変更のたびに、自動でビルドとテストを行い(CI)、本番まで自動で届ける(CD)仕組みです。GitHub Actions などで行います。
例: GitHub Actions でプルリクエストに plan、マージで apply
注意: 本番への apply は、人の承認を挟むことが多いです。
関連: プルリクエスト、GitOps
