# 用語集 IaC と Terraform

### IaC
別名: Infrastructure as Code、コードによるインフラの管理
インフラ(サーバー、ネットワーク、権限など)の構成をコードで書き、そのコードを実行して作る考え方です。レビューでき、同じ環境を何度でも作れ、変更の履歴が Git に残ります。
関連: Terraform、宣言的、冪等性

### 宣言的
別名: 宣言型
試験: Terraform、K8s
「どういう状態にしたいか(最終の形)」を書き、そこに至る手順は道具に任せる書き方です。反対に、手順を順番に書くものを手続き的(命令的)と呼びます。Terraform と Kubernetes は宣言的です。
関連: IaC、冪等性

### 冪等性
別名: べき等性
何度実行しても、同じ結果になる性質です。すでに望む状態なら、何も変えません。IaC や Ansible で重視されます。
関連: 宣言的、IaC

### ドリフト
別名: 構成のずれ
試験: Terraform、K8s
コードの外での変更(管理画面での手作業など)で、実際のインフラがコードや記録とずれてしまうことです。Terraform は plan で、GitOps のツールは同期のときに見つけます。
関連: state、GitOps

### イミュータブルインフラ
別名: イミュータブルなインフラ
試験: Terraform、Docker
動いているサーバーに手を加えず、変更するときは新しいものを作って入れ替える考え方です。手作業の変更で 1 台ずつ違ってしまう(スノーフレークサーバー)のを防ぎます。コンテナのイメージも同じ考え方です。
関連: IaC、イメージ

### Terraform
試験: Terraform
HashiCorp の IaC の道具です。HCL で書いた設定から、プロバイダーを通して、クラウドなどのリソースを作り、変え、消します。
関連: HCL、プロバイダー、state

### HCL
別名: HashiCorp Configuration Language
試験: Terraform
Terraform の設定を書く言語です。`resource "種類" "名前" { 引数 = 値 }` のようなブロックで書きます。
関連: Terraform

### プロバイダー
試験: Terraform
Terraform が、AWS や GitHub などの各サービスの API を操作するためのプラグインです。`required_providers` で宣言し、`terraform init` でダウンロードします。
関連: Terraform、ロックファイル

### リソース
別名: resource ブロック
試験: Terraform
Terraform が作って管理するもの(EC2、VPC、バケットなど)と、それを書くブロックです。`種類.名前`(例: `aws_instance.web`)で参照します。
関連: データソース、state

### データソース
別名: data ブロック
試験: Terraform
Terraform の外にある情報(既存の VPC、最新の AMI など)を読み取るだけのブロックです。作ったり消したりはしません。
関連: リソース

### モジュール
試験: Terraform
複数のリソースをまとめて、再利用できるようにした Terraform の設定のディレクトリです。`terraform` を実行するディレクトリがルートモジュールで、そこから呼ぶものを子モジュールと呼びます。
関連: Terraform Registry

### Terraform Registry
別名: レジストリ(Terraform)
試験: Terraform
プロバイダーとモジュールが公開されている場所です(registry.terraform.io)。HCP Terraform には、組織の中だけで使うプライベートレジストリもあります。
関連: プロバイダー、モジュール

### state
別名: ステート、tfstate
試験: Terraform
Terraform が、設定のリソースと実際のリソースの対応を記録したファイルです(`terraform.tfstate`)。パスワードなどが平文で入ることがあるので、Git に入れず、暗号化と権限の管理ができる場所に置きます。
関連: バックエンド、state のロック、ドリフト

### バックエンド
試験: Terraform
state を保存する場所の設定です。既定は手元のファイル(local)で、チームでは S3 や HCP Terraform のようなリモートに置きます。
関連: state、state のロック

### state のロック
別名: ロック(state)
試験: Terraform
複数の人や CI が同時に state を書き換えて壊さないように、操作の間 state を押さえる仕組みです。S3 では `use_lockfile = true` で有効にします。
関連: state、バックエンド

### ロックファイル
別名: .terraform.lock.hcl
試験: Terraform
選ばれたプロバイダーのバージョンとハッシュ値を記録するファイルです。Git にコミットし、チーム全員が同じバージョンを使うようにします。
関連: プロバイダー

### terraform plan
別名: 実行計画、plan
試験: Terraform
今の設定を適用したら何が作られ、変わり、消えるかを、実際には何も変えずに表示するコマンドです。`+` は作成、`~` は変更、`-` は削除、`-/+` は作り直しです。
関連: terraform apply

### terraform apply
別名: apply
試験: Terraform
計画を実行して、実際にインフラを変えるコマンドです。既定では確認で `yes` の入力を求めます。
関連: terraform plan

### ワークスペース
別名: workspace
試験: Terraform
同じ設定で、別々の state を持つための仕組みです。CLI のワークスペースは state を分けるだけです。HCP Terraform のワークスペースは、変数、権限、実行の履歴も持つ管理の単位です。
関連: state、HCP Terraform

### HCP Terraform
別名: Terraform Cloud
試験: Terraform
HashiCorp のクラウドのサービスで、state の保管、リモートでの plan と apply、ポリシーのチェック、チームの権限の管理ができます。無料の枠では 500 個のリソースまで管理できます。
関連: Terraform、ワークスペース、ポリシー as コード

### ポリシー as コード
別名: Policy as Code、Sentinel、OPA
試験: Terraform、K8s
組織のルール(使ってよいインスタンスタイプ、必須のタグなど)をコードで書き、自動で確かめる考え方です。HCP Terraform では Sentinel や OPA を、Kubernetes では Kyverno や Gatekeeper を使います。
関連: HCP Terraform

### import
別名: インポート
試験: Terraform
Terraform の外で作られた既存のリソースを、state に取り込むことです。`import` ブロックを書き、plan で確認してから apply します。
関連: state

### 変数
別名: 入力変数、variable
試験: Terraform
設定の外から値を渡すための仕組みです。`var.名前` で参照します。値は `-var`、`*.tfvars`、環境変数 `TF_VAR_名前`、既定値の順に優先されます。
関連: 出力

### 出力
別名: output
試験: Terraform
作ったリソースの値(IP アドレス、ID など)を外に見せる仕組みです。子モジュールの値を親で使うときや、`terraform output` で表示するときに使います。
関連: 変数、モジュール

### CI/CD
別名: CI、継続的インテグレーション、継続的デリバリー
コードの変更のたびに、自動でビルドとテストを行い(CI)、本番まで自動で届ける(CD)仕組みです。GitHub Actions などで行います。
関連: プルリクエスト、GitOps

### terraform init
別名: init
試験: Terraform
作業ディレクトリを初期化するコマンドです。プロバイダーとモジュールをダウンロードし、バックエンドを準備します。何度実行しても安全です。
関連: プロバイダー、バックエンド

### terraform destroy
別名: destroy
試験: Terraform
その設定の state で管理しているリソースを、すべて削除するコマンドです。学習で作ったものは、終わったらこれで消すと、費用がかかり続けません。
関連: terraform apply

### terraform validate
別名: terraform fmt
試験: Terraform
validate は、設定の書き方や引数の誤りを、クラウドに問い合わせずに確かめるコマンドです。fmt は、設定を標準の書式に整えるコマンドです。
関連: terraform plan

### count
別名: for_each
試験: Terraform
1 つのブロックから、複数のリソースを作る仕組みです。count は番号で、for_each はキーで区別します。途中の要素を消しても番号がずれないので、for_each が安全です。
関連: リソース

### depends_on
試験: Terraform
参照がなく、Terraform が自動で気づけない依存関係を、明示するための引数です。普段は参照で依存が決まるので、必要なときだけ書きます。
関連: リソース

### lifecycle
別名: create_before_destroy、prevent_destroy、ignore_changes
試験: Terraform
リソースの作り直しや変更の扱いを変える設定です。新しいものを先に作る(create_before_destroy)、削除を禁止する(prevent_destroy)、ある属性の変化を無視する(ignore_changes)などがあります。
関連: リソース

### moved
別名: removed
試験: Terraform
リソースの名前やモジュールを変えたときに、作り直さずに state の記録だけを付け替えるブロックです。removed は、実物を残したまま Terraform の管理から外すブロックです。
関連: state

### locals
別名: ローカル値
試験: Terraform
設定の中で何度も使う値や式に、名前を付けるブロックです。`local.名前` で参照します。外から値は渡せません。
関連: 変数

### sensitive
別名: ephemeral、write-only
試験: Terraform
sensitive は、値を画面に表示しないための印です。state には平文で残ります。state に残さないには、ephemeral の値と write-only の引数を使います。
関連: state、秘密情報

### terraform_remote_state
別名: リモートの state
試験: Terraform
別の設定の state から、ルートモジュールの出力を読むデータソースです。チームの間で値を受け渡すのに使います。
関連: 出力、state
