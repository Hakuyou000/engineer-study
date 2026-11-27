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

### マルチクラウド
別名: multi-cloud
試験: Terraform、ITPassport、FE
要約: 複数のクラウド事業者のサービスを、組み合わせて使うことです。
1 つの事業者に頼り切らないことや、障害への備えのために使います。Terraform は、AWS、Azure、Google Cloud など多くのサービスを、プロバイダーを替えるだけで同じ書き方と手順で扱えるので、マルチクラウドの管理に向きます。1 つの設定に複数のプロバイダーを書くこともできます。
例: 1 つの設定で、AWS の VPC と GitHub のリポジトリを作る
注意: 書き方と手順が同じなだけで、リソースの種類や引数はクラウドごとに違います。
関連: Terraform、プロバイダー

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
別名: 入力変数、variable、TF_VAR_、nullable
試験: Terraform
要約: 設定に外から値を渡すための入力です。
設定の外から値を渡すための仕組みです。`var.名前` で参照します。値は `-var`、`*.tfvars`、環境変数 `TF_VAR_名前`、既定値の順に優先されます。
例: `variable "env" { type = string }`、`-var="env=prod"`、`terraform.tfvars`、`TF_VAR_env`
注意: 優先順位は、`-var` が最も高く、環境変数が最も低い(既定値を除く)です。
関連: 出力

### 出力
別名: output、terraform output
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
別名: create_before_destroy、prevent_destroy、ignore_changes、replace_triggered_by
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

### OpenTofu
別名: tofu、tofu init、tofu plan、tofu apply、tofu import、tofu destroy、tofu state、tofu validate、tofu fmt
試験: LinuC3PS
要約: Terraform から分かれた、オープンソースの IaC の道具です。コマンドは `tofu` です。
Linux Foundation の下で開発されています。書き方(HCL)と考え方は Terraform とほぼ同じで、`terraform` を `tofu` に置き換えて使います。state の暗号化など、独自の機能もあります。
例: `tofu init`、`tofu plan`、`tofu apply`
注意: 設定の中のブロックの名前は、OpenTofu でも `terraform` のままです。
関連: Terraform、IaC、state、バックエンド

### プロビジョナー
別名: local-exec、remote-exec、provisioner
試験: Terraform、LinuC3PS、K8s
要約: Terraform が、リソースを作った後に、コマンドを実行する仕組みです。
`local-exec` は、Terraform を動かしている手元のマシンで実行します。`remote-exec` は、作ったサーバーの中で、SSH などを使って実行します。
例: `provisioner "local-exec" { command = "echo created" }`
注意: Terraform の公式は、最後の手段として使うことを勧めています。まず、user-data や cloud-init、構成管理のツールを検討します。
関連: Terraform、cloud-init、Ansible

### required_providers
試験: Terraform
要約: 設定が使うプロバイダーの取得元と版の範囲を宣言するブロックです。
`terraform` ブロックの中に書きます。プロバイダーのローカル名、取得元(ソースアドレス)、使ってよい版の範囲を決めます。ソースアドレスは `[ホスト名/]名前空間/種類` の形で、ホスト名を省略すると公開の Terraform Registry です。
例: `required_providers { aws = { source = "hashicorp/aws", version = "~> 6.0" } }`
注意: `required_version` は Terraform 本体の版の制約で、プロバイダーの版ではありません。
関連: プロバイダー、バージョン制約、ロックファイル

### バージョン制約
別名: version 制約
試験: Terraform
要約: 使ってよいプロバイダー、モジュール、Terraform 本体の版の範囲を書く指定です。
`version` や `required_version` に、`=`、`!=`、`>=`、`<=`、`~>` などの演算子で範囲を書きます。`~>`(悲観的制約演算子)は、書いた一番右の数字だけを上げてよい、という意味です。
例: `~> 6.3` は 6.3 以上 7.0 未満、`~> 6.3.0` は 6.3.0 以上 6.4 未満
注意: `required_version` は Terraform 本体、`version` はプロバイダーとモジュールの版です。
関連: required_providers、ロックファイル、セマンティックバージョニング

### provider ブロック
別名: プロバイダーの設定
試験: Terraform
要約: プロバイダーの設定(リージョンなど)を書くブロックです。
プロバイダーごとの設定を書きます。同じプロバイダーを複数の設定で使うときは `alias` を付け、リソースやモジュールの `provider` や `providers` 引数で選びます。
例: `provider "aws" { region = "ap-northeast-1" }`、`provider = aws.virginia`、`providers = { aws = aws.virginia }`
注意: リソースでは `provider`(単数)、モジュールでは `providers`(複数)と書きます。
関連: プロバイダー、モジュール

### プロバイダーの tier
別名: プロバイダーの区分
試験: Terraform
要約: Registry のプロバイダーの提供元による区分です。
Official は HashiCorp が提供・保守するもの、Partner は HashiCorp の確認を受けた企業が提供するもの、Community は個人やコミュニティが公開するものです。
例: `hashicorp/aws` は Official、`integrations/github` は GitHub 社が提供するものです。
注意: HashiCorp 以外が作ったプロバイダーは、`required_providers` で `source` を必ず書きます。
関連: プロバイダー、Terraform Registry

### .terraform ディレクトリ
試験: Terraform
要約: `terraform init` がプロバイダーやモジュールを置く作業用のディレクトリです。
`terraform init` が作る、作業ディレクトリの中のディレクトリです。ダウンロードしたプロバイダーとモジュール、バックエンドの設定が入ります。`terraform init` をやり直せば作り直せるので、Git には入れません。
例: `.terraform/providers/`、`.terraform/modules/`
注意: Git に入れるのは `.terraform.lock.hcl` で、`.terraform` ディレクトリではありません。
関連: terraform init、ロックファイル

### terraform providers
別名: terraform providers lock
試験: Terraform
要約: 設定が使うプロバイダーを表示し、ロックファイルの内容を作るコマンドです。
`terraform providers` は、設定と state が必要とするプロバイダーを一覧にします。`terraform providers lock` は、複数の OS のハッシュ値をロックファイルに追加します。
例: `terraform providers`、`terraform providers lock -platform=linux_amd64 -platform=darwin_arm64`
注意: 手元と CI の OS が違うときは、`providers lock` で両方のハッシュを入れておきます。
関連: プロバイダー、ロックファイル

### メタ引数
別名: meta-argument
試験: Terraform
要約: リソースの種類に関係なく使える、Terraform が決めた特別な引数です。
どのリソースでも書ける引数です。`count`、`for_each`、`depends_on`、`lifecycle`、`provider` があります。モジュールでも `count`、`for_each`、`depends_on`、`providers` が使えます。
例: `count = 3`、`provider = aws.virginia`
注意: リソースごとの引数(`instance_type` など)とは別で、プロバイダーが決めるものではありません。
関連: count、depends_on、lifecycle

### モジュールの source
別名: source 引数
試験: Terraform
要約: モジュールの取得元を指定する、必須の引数です。
取得元には、ローカルのパス(`./` や `../` で始める)、Terraform Registry、プライベートレジストリ、Git のリポジトリなどを書けます。`//` の後ろでリポジトリ内のサブディレクトリを指し、`?ref=` で Git の版を指定します。
例: `source = "./modules/vpc"`、`source = "terraform-aws-modules/vpc/aws"`、`source = "git::https://example.com/net.git//vpc?ref=v1.2.0"`
注意: `version` 引数が使えるのは Registry のモジュールだけです。Git の版は `?ref=` で指定します。
関連: モジュール、プライベートレジストリ、Terraform Registry

### ルートモジュールと子モジュール
別名: ルートモジュール、子モジュール
試験: Terraform
要約: `terraform` を実行するディレクトリがルート、それが呼ぶモジュールが子です。
ルートモジュールは、`terraform plan` などを実行するディレクトリの設定です。子モジュールは、ルートから `module` ブロックで呼ばれます。値は、ルートが入力変数で渡し、子が出力で返します。
例: ルートの `module "vpc" { … }` が、`./modules/vpc` の子モジュールを呼ぶ
注意: 親は、子モジュールの中のリソースや変数を直接参照できません。子の output を使います。
関連: モジュール、出力、変数

### module ブロック
別名: モジュールの呼び出し
試験: Terraform
要約: 別のモジュールを呼び出し、入力変数に値を渡すブロックです。
`source` で取得元を指定し、子の入力変数に値を渡します。`count`、`for_each`、`depends_on`、`providers` も書けます。子の出力は `module.名前.出力名` で使います。
例: `module "bucket" { source = "./modules/bucket" }`、`module.bucket.arn`
注意: モジュールの中に `provider` ブロックは書かず、ルートで設定して引き継ぎます。
関連: モジュール、ルートモジュールと子モジュール、出力

### 標準のモジュール構成
別名: Standard Module Structure
試験: Terraform
要約: モジュールのファイルを、役割ごとに分けて置く習慣です。
`main.tf` にリソース、`variables.tf` に入力変数、`outputs.tf` に出力、`README.md` に使い方を書きます。必要なら `versions.tf`、`modules/`、`examples/` を足します。
例: `main.tf`、`variables.tf`、`outputs.tf`、`README.md`
注意: Terraform はディレクトリの `.tf` をすべて読むので、ファイル名は習慣で、決まりではありません。
関連: モジュール、変数、出力

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
別名: backend ブロック
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
別名: インポート、terraform import
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

### リソースアドレス
別名: アドレス指定
試験: Terraform
要約: state や plan の中で、リソースを 1 つに決めて指す名前です。
`種類.名前` が基本で、モジュールの中は `module.名前.種類.名前`、`count` は `[0]`、`for_each` は `["キー"]` を付けます。`terraform state` や `-target`、`-replace` で使います。
例: `aws_instance.web[0]`、`module.vpc.aws_subnet.a`
注意: シェルによっては、`["キー"]` の引用符を `\` やシングルクォートで守る必要があります。
関連: terraform state、state

### terraform state
別名: terraform state list、terraform state show、terraform state mv、terraform state rm、terraform state pull、terraform state push
試験: Terraform
要約: state の中身を、見たり直したりするコマンドの群です。
`list` は一覧、`show` は 1 つの詳細、`mv` は名前の付け替え、`rm` は管理から外す、`pull` と `push` は state の取り出しと書き込みです。インフラそのものは変えません。
例: `terraform state list`、`terraform state mv aws_instance.a aws_instance.b`、`terraform state rm aws_instance.a`
注意: state を手で編集しません。`mv` と `rm` は、まず `moved` や `removed` ブロックで足りないか考えます。
関連: state、moved、リソースアドレス

### refresh-only
別名: -refresh-only、terraform refresh
試験: Terraform
要約: インフラは変えず、state だけを実際の状態に合わせるモードです。
`terraform plan -refresh-only` は、state がどう変わるかだけを表示します。`terraform apply -refresh-only` は、確認のうえ state だけを更新します。ドリフトを state に取り込むときに使います。
例: `terraform apply -refresh-only`
注意: `terraform refresh` は確認なしで state を書き換えるので、非推奨です。
関連: ドリフト、state、terraform plan

### terraform force-unlock
別名: force-unlock
試験: Terraform
要約: 残ってしまった state のロックを、手で解除するコマンドです。
実行中のプロセスが異常終了すると、ロックが残ることがあります。`terraform force-unlock` に Lock ID を渡して外します。state の中身は変えません。
例: `terraform force-unlock 6a3f…`(Lock ID はエラーメッセージに出ます)
注意: 誰も操作していないと確かめてから使います。`-lock=false` で無効にするのも危険です。
関連: state のロック

### バックエンドの部分設定
別名: partial configuration、-backend-config
試験: Terraform
要約: backend ブロックの一部を、`terraform init` のときに外から渡す方法です。
backend ブロックでは、変数を使えません。そこで、変わる値を `-backend-config` のファイルや `キー=値` で `terraform init` に渡します。
例: `terraform init -backend-config="bucket=tf-state-prod"`
注意: backend ブロックでは `var.` が使えず、部分設定で渡します。
関連: バックエンド、terraform init

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
別名: destroy、terraform apply -destroy
試験: Terraform
要約: 管理しているリソースをすべて消すコマンドです。
その設定の state で管理しているリソースを、すべて削除するコマンドです。学習で作ったものは、終わったらこれで消すと、費用がかかり続けません。
例: `terraform destroy`、`terraform plan -destroy`
注意: 本番では `prevent_destroy` や、権限の分離で誤った実行を防ぎます。
関連: terraform apply

### -target
別名: -target オプション
試験: Terraform
要約: plan や apply の対象を、指定したリソースだけにするオプションです。
`terraform plan -target=ADDRESS` のように書きます。障害の復旧など、例外のときに使います。
例: `terraform apply -target=aws_instance.web`
注意: 普段の運用では使いません。依存するものが対象から外れ、state と設定がずれることがあります。
関連: リソースアドレス、terraform plan

### -replace
別名: terraform apply -replace、terraform taint
試験: Terraform
要約: 設定を変えずに、指定したリソースを作り直すオプションです。
壊れたサーバーのように、設定は正しいのに作り直したいときに使います。plan に `-/+` として出ます。古い `terraform taint` は非推奨です。
例: `terraform apply -replace="aws_instance.web"`
注意: `taint` ではなく `-replace` を使います。
関連: リソースアドレス、terraform apply、lifecycle

### 保存した計画
別名: tfplan、-out
試験: Terraform
要約: plan の結果をファイルに保存し、その内容どおりに apply する方法です。
`terraform plan -out=tfplan` で保存し、`terraform apply tfplan` で適用します。確認の `yes` は求められません。`terraform show tfplan` で中身を読めます。
例: `terraform plan -out=tfplan`、`terraform show tfplan`、`terraform show -json tfplan`
注意: レビューした内容と同じ変更になります。保存後に state が変わると、適用できません。
関連: terraform plan、terraform apply

### known after apply
別名: (known after apply)
試験: Terraform
要約: apply するまで値が決まらない属性を示す、plan の表示です。
ID のように、リソースを作って初めて決まる値は、plan では `(known after apply)` と出ます。
例: `id = (known after apply)`
注意: 値が決まらないので、それを使う `count` などは plan の時点で決められないことがあります。
関連: terraform plan

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

### InSpec
別名: Chef InSpec
試験: LinuC3PS
要約: サーバーがあるべき状態になっているかを、コードで検査する道具です。
設定を変えず、調べて合否を出します。`describe package("nginx")` のように書き、`inspec exec` で、SSH の先などを調べます。
例: `inspec exec web-profile -t ssh://ops@192.0.2.10`
注意: 適用のあとに動かすと、「適用したつもり」ではなく、実際に狙いどおりかが分かります。
関連: Ansible、CI/CD、IaC

### TF_LOG
別名: TF_LOG_PATH、TF_LOG_CORE、TF_LOG_PROVIDER
試験: Terraform
要約: Terraform の詳しいログを出す環境変数です。
`TF_LOG` にレベル(`TRACE`、`DEBUG`、`INFO`、`WARN`、`ERROR`)を入れます。`TRACE` が最も詳しいです。`TF_LOG_PATH` でファイルに出し、`TF_LOG_CORE` と `TF_LOG_PROVIDER` で、本体とプロバイダーを分けます。
例: `TF_LOG=DEBUG terraform plan`、`TF_LOG=TRACE TF_LOG_PATH=./terraform.log terraform apply`
注意: `TF_LOG_PATH` だけでは、ログは出ません。`TF_LOG` も設定します。
関連: プロバイダー、terraform plan

## 式と型

### 参照式
別名: リソースの参照、リソース属性の参照
試験: Terraform
要約: 別のリソースや変数の値を、名前で取り出す書き方です。
リソースは `種類.名前.属性`、データソースは `data.種類.名前.属性`、変数は `var.名前`、locals は `local.名前`、子モジュールの出力は `module.名前.出力名` と書きます。繰り返しの中では `count.index`、`each.key`、`each.value` が使えます。
例: `aws_vpc.main.id`、`data.aws_ami.ubuntu.id`、`var.env`、`local.name`、`module.vpc.vpc_id`
注意: `count` で作ったものは `[0]`、`for_each` で作ったものは `["キー"]` で選びます。
関連: リソース、データソース、変数、locals、暗黙の依存関係

### count.index
別名: each.key、each.value
試験: Terraform
要約: 繰り返しの中で、今の番号やキーと値を取り出す特別な値です。
`count` の中では `count.index` が 0 から始まる番号です。`for_each` の中では `each.key` がキー、`each.value` が値です。
例: `name = "web-${count.index}"`、`name = each.key`
注意: `count.index` は `count` を、`each.key` と `each.value` は `for_each` を書いたときだけ使えます。
関連: count、参照式

### スプラット式
別名: splat 式、スプラット
試験: Terraform
要約: 複数のリソースの同じ属性を、まとめてリストにする書き方です。
`[*]` を使い、全要素の属性をリストにします。`[for i in 要素 : i.属性]` と同じ意味です。
例: `aws_instance.web[*].id`
注意: `count` や `for_each` で作った複数のリソースに使います。1 つだけのリソースには、普通は使いません。
関連: count、for 式

### 暗黙の依存関係
別名: 暗黙の依存
試験: Terraform
要約: 別のリソースを参照すると、Terraform が自動で決める作成の順番です。
あるリソースが別のリソースの属性を参照していると、参照される側が先に作られます。`depends_on` を書かなくても決まる依存です。
例: `subnet_id = aws_subnet.a.id` と書くと、サブネットが先に作られる
注意: 参照がなく順番が必要なときだけ、`depends_on`(明示的な依存関係)を使います。
関連: depends_on、依存関係グラフ

### 依存関係グラフ
別名: dependency graph
試験: Terraform
要約: リソースの依存を線でつないだもので、作る順番と並列の範囲を決めます。
Terraform は、参照から依存関係グラフを作ります。依存のないリソースは並列に作り、削除は作成と逆の順番で行います。`terraform graph` は、このグラフを DOT 形式で出力するコマンドです。
例: `terraform graph`、`terraform apply -parallelism=5`
注意: 同時に処理する数の既定は 10 で、`-parallelism` で変えられます。
関連: 暗黙の依存関係、depends_on、terraform apply

### tfvars ファイル
別名: terraform.tfvars、auto.tfvars
試験: Terraform
要約: 変数の値をまとめて書いておくファイルです。
`terraform.tfvars` と `*.auto.tfvars` は、自動で読まれます。`prod.tfvars` のような名前は `-var-file` で指定します。環境ごとの値を分けたいときに使います。
例: `terraform.tfvars`、`terraform apply -var-file=prod.tfvars`
注意: 優先順位は、`default` が最も弱く、コマンドラインの `-var` と `-var-file` が最も強いです。
関連: 変数

### コレクション型
別名: collection type
試験: Terraform
要約: 同じ型の値を複数まとめる型で、list、map、set があります。
list は順番のある並び、map は名前と値の組、set は重複のない集まりです。要素の型をそろえて、`list(string)` のように書きます。
例: `list(string)`、`map(number)`、`set(string)`
注意: set には順番がなく、番号 `[0]` では取り出せません。
関連: 構造型、型制約

### 構造型
別名: structural type
試験: Terraform
要約: 型の違う値を 1 つにまとめる型で、object と tuple があります。
object は名前ごとに型を決めた入れ物、tuple は位置ごとに型を決めた並びです。
例: `object({ name = string, port = number })`、`tuple([string, number])`
注意: object の属性は `optional(型)` で省略できる属性にできます。
関連: コレクション型、型制約

### 型制約
別名: type 制約
試験: Terraform
要約: 変数に入れてよい値の型を決める指定です。
変数の `type` に、`string`、`number`、`bool`、コレクション型、構造型を書きます。`any` は型を決めない指定です。合わない値は、可能なら自動で型変換されます。
例: `variable "ports" { type = list(number) }`、`"5"` が `5` に変換される
注意: 変換できない値はエラーになります。
関連: 変数、コレクション型、構造型

### 三項演算子
別名: 条件式(Terraform)、conditional expression
試験: Terraform
要約: 条件によって、2 つの値のどちらかを選ぶ書き方です。
`条件 ? 真のときの値 : 偽のときの値` と書きます。リソースを作るかどうかを、`count = var.enabled ? 1 : 0` のように決めるのによく使います。
例: `var.env == "prod" ? "t3.large" : "t3.micro"`
注意: 真と偽の値の型は、そろえます。
関連: count

### for 式
別名: for expression
試験: Terraform
要約: 集まりの要素を 1 つずつ変換して、新しい集まりを作る式です。
`[for n in var.names : upper(n)]` はリストを、`{ for n in var.names : n => length(n) }` はマップを作ります。末尾に `if 条件` を付けると、要素を絞れます。
例: `[for s in var.servers : s.name if s.env == "prod"]`
注意: `for` 式は値を作る式で、リソースを繰り返し作る `for_each` とは別のものです。
関連: スプラット式、count

### 文字列テンプレート
別名: 文字列の補間
試験: Terraform
要約: 文字列の中に、式の値を埋め込む書き方です。
`${ }` の中に式を書くと、その値が文字列に入ります。`%{ if … }` のディレクティブで、条件や繰り返しも書けます。複数行の文字列は、ヒアドキュメント(`<<EOT`)で書きます。
例: `"${var.project}-${var.env}"`、`<<EOT … EOT`
注意: 式だけなら `${ }` で包まず、`var.name` のように直接書きます。
関連: locals、変数

### terraform console
試験: Terraform
要約: 式や関数を対話的に試すコマンドです。
設定と state を読み込んだ状態で、式を入力して、その場で結果を確かめられます。関数の動きの確認や、変数やリソースの値の確認に使います。
例: `terraform console` の後に `upper("abc")`、`aws_vpc.main.id`
注意: 式を評価するだけで、インフラは変えません。
関連: terraform plan

### Terraform の組み込み関数
別名: 組み込み関数
試験: Terraform
要約: Terraform に最初から入っている関数です。
文字列、コレクション、ファイルとエンコード、数値などの関数があります。設定の中で、自分で関数を定義することはできません。
例: `join(",", var.names)`、`lookup(var.map, "key", "default")`、`merge(a, b)`、`templatefile("a.tftpl", {})`、`jsonencode({ a = 1 })`
注意: 引数の順番を間違えやすいので、`terraform console` で試してから使います。
関連: terraform console、try 関数

### try 関数
別名: try()
試験: Terraform
要約: エラーになる式を、安全に扱うための関数です。
`try(式 1, 式 2)` は、式 1 がエラーなら式 2 を返します。`can(式)` は、式がエラーにならなければ `true` を返します。
例: `try(var.obj.name, "unknown")`、`can(regex("^a", var.s))`
注意: 使いすぎると、本当の誤りが隠れます。
関連: Terraform の組み込み関数

## 検証

### validation ブロック
別名: variable の validation
試験: Terraform
要約: 変数に入れる値が正しいかを、plan の前に確かめるブロックです。
`variable` の中に書きます。`condition` が偽なら、`error_message` を出して止まります。
例: `condition = length(var.name) > 3` と `error_message = "4 文字以上にしてください。"` を、`validation { }` の中に 1 行ずつ書く
注意: `condition` が真になる値が、正しい値です。偽のときにエラーです。
関連: 変数、precondition、check ブロック

### precondition
別名: postcondition
試験: Terraform
要約: リソースを作る前と後に、条件が成り立つかを確かめる指定です。
`lifecycle` の中に書きます。`precondition` は作る前に前提を、`postcondition` は作った後に結果を確かめます。`postcondition` では `self` で自分の属性を参照できます。条件が偽ならエラーで止まります。
例: `lifecycle` の中の `postcondition { }` に、`condition = self.public_ip != ""` と `error_message` を書く
注意: output では `precondition` だけが書けます。
関連: validation ブロック、check ブロック、lifecycle

### check ブロック
試験: Terraform
要約: インフラ全体の状態を確かめ、失敗しても警告だけにするブロックです。
独立したブロックで、`assert` の `condition` を確かめます。失敗しても警告を出すだけで、plan や apply は止めません。`check` の中でだけ使えるデータソースも書けます。
例: `check "website_up" { }` の中に、`data "http" "site"` のブロックと、`assert` のブロックを書く
注意: `validation` と `precondition` はエラーで止まりますが、`check` は止まりません。
関連: validation ブロック、precondition

## HCP Terraform の機能

### リモート実行
別名: remote operations
試験: Terraform
要約: plan と apply を、手元ではなく HCP Terraform の環境で実行することです。
手元のファイルはアップロードされ、実行の出力が手元に返ります。state の保管とロックも HCP Terraform が行います。
例: `terraform plan` を手元で打つと、HCP Terraform で実行される
注意: 手元の環境変数(`AWS_ACCESS_KEY_ID` など)は、リモートには渡されません。
関連: HCP Terraform、cloud ブロック、HCP Terraform の実行モード

### HCP Terraform の実行モード
別名: 実行モード、execution mode
試験: Terraform
要約: ワークスペースの plan と apply を、どこで実行するかの設定です。
Remote(既定)は HCP Terraform の環境で実行します。Local は手元で実行し、HCP Terraform は state の保管だけです。Agent は自社のネットワークに置いたエージェントで実行します。
例: プライベートなネットワークのリソースを扱うときは Agent
注意: Local では、plan と apply が手元で動くため、リモート実行の機能は使えません。
関連: リモート実行、ワークスペース

### VCS 駆動のワークフロー
別名: VCS 連携のワークフロー、VCS-driven
試験: Terraform
要約: Git のリポジトリをワークスペースにつなぎ、変更で自動実行するやり方です。
プルリクエストで plan(speculative plan)が動きます。マージすると実行が始まり、plan の後、確認(または自動の apply の設定)で apply されます。チームの標準の運用(GitOps)に向きます。
例: GitHub のリポジトリをワークスペースに接続する
注意: speculative plan は、計画を見るだけです。
関連: speculative plan、CLI 駆動のワークフロー、API 駆動のワークフロー

### CLI 駆動のワークフロー
別名: CLI-driven
試験: Terraform
要約: 手元で `terraform plan` や `apply` を打つと、HCP Terraform で実行されるやり方です。
`cloud` ブロックを書き、`terraform login` で認証すると、これまでと同じ操作でリモート実行できます。
例: `terraform apply`(HCP Terraform で実行され、結果が手元に出る)
注意: 実行は HCP Terraform で行われ、手元のファイルがアップロードされます。
関連: cloud ブロック、リモート実行

### API 駆動のワークフロー
別名: API-driven
試験: Terraform
要約: 自前の CI などから API で設定を送り、実行するやり方です。
独自のパイプラインに、HCP Terraform の実行を組み込みたいときに使います。
例: CI から API で設定をアップロードし、Run を作る
注意: VCS 駆動と違い、リポジトリの接続は要りません。
関連: VCS 駆動のワークフロー、CLI 駆動のワークフロー

### speculative plan
試験: Terraform
要約: 計画を見るだけで、apply はできない実行です。
VCS 駆動で、プルリクエストを作ると自動で動きます。結果はプルリクエストに表示され、レビューに使えます。CLI 駆動で、手元から `terraform plan` を打ったときも speculative plan です。
例: プルリクエストに表示される plan の結果
注意: apply はできません。マージ後の実行とは別のものです。
関連: VCS 駆動のワークフロー

### Run トリガー
別名: run triggers
試験: Terraform
要約: あるワークスペースの apply の成功で、別のワークスペースの実行を始める機能です。
ワークスペースの間の依存を、自動でつなぎます。
例: ネットワークの apply が成功したら、アプリの plan を始める
注意: 別のワークスペースの出力を読むのは、`terraform_remote_state` や `tfe_outputs` です。
関連: ワークスペース、HCP Terraform

### Variable Sets
別名: 変数セット
試験: Terraform
要約: 複数のワークスペースで共通の変数を、まとめて管理する機能です。
組織全体、特定のプロジェクト、特定のワークスペースに適用できます。クラウドの認証情報や共通のタグを、1 か所で管理します。
例: AWS の認証情報の変数セットを、プロジェクト全体に適用する
注意: 変数セットは HCP Terraform の機能で、ローカルの `terraform.tfvars` とは別です。
関連: HCP Terraform、ワークスペース、変数

### HCP Terraform のプロジェクト
別名: プロジェクト(HCP Terraform)
試験: Terraform
要約: 関係するワークスペースをまとめる、フォルダーのような単位です。
チームの権限、変数セット、ポリシーセットを、プロジェクトの単位で適用できます。プロジェクトを指定しないワークスペースは、Default Project に入ります。
例: プロジェクト `networking` に `network-dev` と `network-prod` を入れる
注意: プロジェクトは、組織とワークスペースの間の単位です。
関連: ワークスペース、Variable Sets

### Terraform Stacks
別名: Stacks
試験: Terraform
要約: 複数の構成をまとめて、いくつもの環境へ展開する HCP Terraform の機能です。
モジュールを部品(component)として `.tfcomponent.hcl` に並べ、展開先(deployment)を `.tfdeploy.hcl` に書きます。展開先ごとに state が分かれるので、1 つの展開先の変更は、ほかに影響しません。
例: 同じ構成を、開発、本番、複数のリージョンへ、展開先として並べて展開する
注意: ベータの間に書いた設定は、正式版(GA)の書き方に直す必要があります。【要確認】試験の範囲に入るかは、試験の公式の出題範囲で確かめます。
関連: HCP Terraform、ワークスペース

### no-code プロビジョニング
別名: no-code provisioning
試験: Terraform
要約: コードを書かずに、承認されたモジュールからインフラを作る機能です。
【要確認】プライベートレジストリのモジュールを、画面から選んでワークスペースを作る機能とされます。
例: 承認済みの VPC モジュールを選び、値だけ入力して作る
注意: 【要確認】使える条件と版は、公式の情報で確かめます。
関連: プライベートレジストリ、HCP Terraform

### ポリシーの強制レベル
別名: enforcement level
試験: Terraform
要約: ポリシーに違反したとき、どこまで止めるかを決めるレベルです。
advisory は警告だけで apply できます。soft-mandatory は止まりますが、上書きの権限を持つ人が上書きすれば apply できます。hard-mandatory は上書きできません。
例: Sentinel のポリシーを soft-mandatory にして、例外を認める
注意: soft と hard の違いは、上書きできるかどうかです。OPA のポリシーでは、advisory と mandatory の 2 つです。
関連: ポリシー as コード、HCP Terraform

### Run Tasks
試験: Terraform
要約: plan の後などに、外部のサービスを呼んで結果を確かめる機能です。
セキュリティのスキャンや費用の管理などの外部サービスを、実行の流れに組み込みます。plan の前、plan の後、apply の前、apply の後のどこで動かすかを選べます。
例: plan の後に、外部のセキュリティスキャンを呼ぶ
注意: 結果を必須にする(失敗なら止める)か、助言だけにするかを、選べます。
関連: ポリシー as コード、HCP Terraform

### cloud ブロック
別名: cloud block
試験: Terraform
要約: 設定を HCP Terraform につなぐ、`terraform` ブロックの中の設定です。
`organization` と `workspaces` を書きます。`workspaces` は `name` で 1 つ、`tags` で複数を選びます。組織名は `TF_CLOUD_ORGANIZATION` でも渡せます。旧方式の `remote` バックエンドとは別で、新しい設定では `cloud` を使います。
例: `terraform` ブロックの中に `cloud { }` を書き、その中に `organization = "example-org"` と `workspaces { name = "network-prod" }` を書く
注意: `backend` ブロックと `cloud` ブロックは、同時には書けません。
関連: HCP Terraform、ワークスペース、バックエンド

### terraform login
試験: Terraform
要約: HCP Terraform の API トークンを取得して、手元に保存するコマンドです。
ブラウザでトークンを作り、`~/.terraform.d/credentials.tfrc.json` に保存します。以降の `terraform init` や `plan` で、HCP Terraform に認証できます。
例: `terraform login`
注意: トークンは秘密情報なので、Git に入れません。
関連: cloud ブロック、HCP Terraform
