# Terraform 問題 8.0 HCP Terraform

対象: Terraform Associate(004) / 全26問 / すべてオリジナル問題
対応テキスト: `Terraform_8.0_HCPTerraform.md`
解答・解説は末尾。

## 問題

### 8.1 HCP Terraform でインフラを作る

**問1** `Terraform-8.0-001` HCP Terraform が提供する機能として、正しいものはどれか。(2つ選べ)

- A. クラウドの料金を無料にする
- B. state の保管と版の履歴、自動のロック
- C. Terraform の設定を自動で書く
- D. plan と apply をリモートの環境で実行する
- E. Terraform の外での変更を自動で禁止する

**問2** `Terraform-8.0-002` HCP Terraform のワークスペースに GitHub のリポジトリをつないだ。プルリクエストを作ったときに実行されるものはどれか。

- A. apply まで自動で実行される
- B. destroy が実行される
- C. 何も実行されない
- D. 計画を見るだけの speculative plan が実行され、結果がプルリクエストに表示される

**問3** `Terraform-8.0-003` 手元の PC で `terraform apply` を実行すると、実際の処理は HCP Terraform で行われ、結果が手元に表示される。このワークフローはどれか。

- A. ローカルの実行モード
- B. API 駆動のワークフロー
- C. VCS 駆動のワークフロー
- D. CLI 駆動のワークフロー

**問4** `Terraform-8.0-004` HCP Terraform の実行(run)で、ポリシーのチェックが行われるタイミングはどれか。

- A. init の前
- B. apply の後
- C. plan の前
- D. plan の後、apply の前

**問5** `Terraform-8.0-005` HCP Terraform のワークスペースで、plan が成功したら確認なしで apply したい。設定するものはどれか。

- A. local の実行モード
- B. speculative plan
- C. run tasks
- D. auto-apply

**問6** `Terraform-8.0-006` HCP Terraform を state の保管だけに使い、plan と apply は手元の PC で実行したい。選ぶ実行モードはどれか。

- A. Agent
- B. Local
- C. Remote
- D. Speculative

**問7** `Terraform-8.0-007` HCP Terraform のリモートの実行から、社内のデータセンターの中の、インターネットから届かない vSphere を操作したい。適切な実行モードはどれか。

- A. Local
- B. Remote
- C. Agent
- D. 操作できない

**問8** `Terraform-8.0-008` ワークスペースの変数で、Sensitive にした変数の扱いとして正しいものはどれか。

- A. 実行には使われない
- B. 値は誰でも画面で見られるが、編集できない
- C. 保存した後は、画面や API で値を見られず、ログにも表示されない
- D. state に保存されなくなる

### 8.2 HCP Terraform の共同作業とガバナンスの機能

**問9** `Terraform-8.0-009` HCP Terraform で、変更が会社のルールに合っているかを自動で確かめるポリシーを書く言語として、正しいものはどれか。(2つ選べ)

- A. OPA(Rego)
- B. YAML の Ansible プレイブック
- C. Bash
- D. Sentinel
- E. HCL の variable の validation だけ

**問10** `Terraform-8.0-010` Sentinel のポリシーの強制のレベルのうち、違反すると実行が止まるが、権限のある人が上書きして apply できるものはどれか。

- A. soft-mandatory
- B. advisory
- C. mandatory
- D. hard-mandatory

**問11** `Terraform-8.0-011` 「本番のワークスペースでは、許可していないインスタンスタイプの EC2 は、誰であっても作れない」ようにしたい。Sentinel のポリシーの強制のレベルとして適切なものはどれか。

- A. informational
- B. soft-mandatory
- C. hard-mandatory
- D. advisory

**問12** `Terraform-8.0-012` 組織の中だけで承認したモジュールを配り、各チームに使ってもらいたい。HCP Terraform の機能として適切なものはどれか。

- A. run triggers
- B. state のロック
- C. speculative plan
- D. プライベートレジストリ

**問13** `Terraform-8.0-013` HCP Terraform のヘルスアセスメントで行われるチェックとして、正しいものはどれか。(2つ選べ)

- A. 継続的な検証(`check` ブロックや postcondition の条件を満たしているか)
- B. 設定ファイルの書式を自動で整える
- C. ドリフトの検出(実際のインフラが state から変わっていないか)
- D. ドリフトを見つけたら、自動でインフラを元に戻す
- E. プロバイダーを自動で最新のバージョンに上げる

**問14** `Terraform-8.0-014` 組織のすべてのワークスペースから、古いバージョンのモジュールを使っているものを探し、それぞれのワークスペースに「モジュールを更新すること」という作業項目を記録して、担当のチームに知らせたい。使う機能の組み合わせとして適切なものはどれか。

- A. state のロックと force-unlock
- B. explorer と change requests
- C. run triggers と変数セット
- D. speculative plan と auto-apply

**問15** `Terraform-8.0-015` チームに権限を与える方法として、正しいものはどれか。

- A. ユーザーをチームに入れ、チームに組織、プロジェクト、ワークスペースの権限を与える
- B. 権限は設定できず、全員が同じ操作をできる
- C. ユーザーごとに state のファイルを配る
- D. ワークスペースごとに別のパスワードを共有する

**問16** `Terraform-8.0-016` plan の後に、外部のセキュリティのスキャンのサービスを呼び出して、結果によって実行を止めたい。HCP Terraform の機能として適切なものはどれか。

- A. state のバージョン
- B. プロジェクト
- C. run tasks
- D. 変数セット

### 8.3 HCP Terraform のワークスペースとプロジェクトを整理して使う

**問17** `Terraform-8.0-017` HCP Terraform のワークスペースが持つものとして、正しいものはどれか。(2つ選べ)

- A. 組織のすべてのユーザーのパスワード
- B. 変数と環境変数、実行の履歴
- C. 他の組織の state
- D. プロバイダーのソースコード
- E. その設定の state と版の履歴

**問18** `Terraform-8.0-018` CLI のワークスペースと HCP Terraform のワークスペースの違いとして、正しいものはどれか。

- A. どちらも state だけを分けるもので、同じものである
- B. CLI のワークスペースは state を分けるだけだが、HCP Terraform のワークスペースは変数、権限、実行の履歴なども分ける
- C. CLI のワークスペースのほうが、権限を細かく分けられる
- D. HCP Terraform のワークスペースは state を持たない

**問19** `Terraform-8.0-019` 30 個のワークスペースを、事業部ごとにまとめ、事業部のチームに一括で権限を与えたい。使う機能はどれか。

- A. speculative plan
- B. プロジェクト
- C. run triggers
- D. Sentinel

**問20** `Terraform-8.0-020` 20 個のワークスペースで、同じクラウドの認証の設定とタグの値を使いたい。ワークスペースごとに設定するのは手間である。使う機能はどれか。

- A. プライベートレジストリ
- B. explorer
- C. 変数セット
- D. run tasks

**問21** `Terraform-8.0-021` ネットワークのワークスペースの apply が成功したら、アプリのワークスペースの実行を自動で始めたい。使う機能はどれか。

- A. 変数セット
- B. auto-apply
- C. run triggers
- D. ヘルスアセスメント

**問22** `Terraform-8.0-022` HCP Terraform のワークスペースの分け方として、一般的に推奨されるものはどれか。

- A. リソース 1 つにつき 1 つのワークスペースを作る
- B. アプリやインフラの部品と、環境(dev、prod など)ごとに分ける
- C. 組織のすべてのインフラを 1 つのワークスペースにまとめる
- D. ユーザーごとに 1 つのワークスペースを作る

### 8.4 HCP Terraform との連携を設定して使う

**問23** `Terraform-8.0-023` 手元の Terraform の CLI から HCP Terraform を使うために、API トークンを取得して保存するコマンドはどれか。

- A. `terraform auth`
- B. `terraform connect`
- C. `terraform init -cloud`
- D. `terraform login`

**問24** `Terraform-8.0-024` 手元の設定を HCP Terraform の組織 `example-org` のワークスペース `app-prod` につなぎたい。設定に書くものとして正しいものはどれか。

- A. `module "hcp" { source = "example-org/app-prod" }`
- B. `provider "hcp" { organization = "example-org" }`
- C. `terraform { cloud { organization = "example-org" workspaces { name = "app-prod" } } }`
- D. `backend "local" { workspace = "app-prod" }`

**問25** `Terraform-8.0-025` local バックエンドで管理していた設定に `cloud` ブロックを追加した。既存の state を HCP Terraform のワークスペースに移したい。実行するコマンドはどれか。

- A. `terraform state push`
- B. `terraform login -migrate`
- C. `terraform init`
- D. `terraform apply -refresh-only`

**問26** `Terraform-8.0-026` HCP Terraform のワークスペースに、AWS の長期のアクセスキーを保存したくない。実行のたびに有効期限の短い認証情報を使いたい。適切な機能はどれか。

- A. 変数セットにアクセスキーを保存する
- B. 設定ファイルにアクセスキーを書く
- C. 動的なプロバイダーの認証情報(OIDC を使う)
- D. Sensitive の変数にアクセスキーを保存する

## 解答・解説

### 問1 `Terraform-8.0-001`

**正解**: B、D

HCP Terraform は、state をワークスペースごとに保管して版の履歴を残し、自動でロックします。plan と apply を HCP Terraform の環境でリモートに実行できます。設定を自動で書いたり、クラウドの料金を無料にしたり、外での変更を禁止したりはしません(ドリフトの検出はできます)。

### 問2 `Terraform-8.0-002`

**正解**: D

VCS 駆動のワークフローでは、プルリクエストを作ると、計画を見るだけの speculative plan が実行され、結果がプルリクエストに表示されます。speculative plan は apply できません。apply は既定のブランチにマージしたときの実行で行われます。

### 問3 `Terraform-8.0-003`

**正解**: D

CLI 駆動のワークフローでは、手元で `terraform plan` や `apply` を実行すると、設定がアップロードされ、HCP Terraform でリモートに実行され、結果が手元に流れてきます。VCS 駆動はリポジトリへの変更、API 駆動は API の呼び出しで実行が始まります。ローカルの実行モードは手元で処理します。

### 問4 `Terraform-8.0-004`

**正解**: D

ポリシーのチェック(Sentinel、OPA)は、plan の後、apply の前に行われます。計画の内容を見て、会社のルールに合っているかを確かめ、違反していれば apply を止められます。

### 問5 `Terraform-8.0-005`

**正解**: D

auto-apply を有効にすると、plan(とポリシーのチェック)が成功したとき、確認なしで apply します。既定では apply の前に確認が必要です。speculative plan は計画を見るだけの実行です。

### 問6 `Terraform-8.0-006`

**正解**: B

Local の実行モードでは、plan と apply は手元で実行し、HCP Terraform は state の保管(とロック)だけに使います。Remote は HCP Terraform の環境で実行し、Agent は自社のネットワークに置いたエージェントで実行します。

### 問7 `Terraform-8.0-007`

**正解**: C

Agent の実行モードでは、自社のネットワークの中に置いた HCP Terraform のエージェントが実行を行うので、インターネットから届かないリソースも操作できます。Remote は HCP Terraform の環境で実行するので、社内のネットワークには届きません。

### 問8 `Terraform-8.0-008`

**正解**: C

Sensitive にした変数は、保存した後は画面や API で値を見られず(書き換えはできる)、実行のログにも表示されません。実行には通常どおり使われます。state に保存されるかどうかは、設定での使われ方で決まり、この設定では変わりません。

### 問9 `Terraform-8.0-009`

**正解**: A、D

HCP Terraform のポリシーは、HashiCorp の Sentinel、または OPA(Open Policy Agent。Rego という言語)で書きます。変数の `validation` は 1 つの設定の中の入力の検証で、組織のポリシーの仕組みではありません。

### 問10 `Terraform-8.0-010`

**正解**: A

soft-mandatory は、違反すると実行が止まりますが、権限のある人が上書き(override)すれば apply できます。advisory は警告だけ、hard-mandatory は上書きできません。mandatory は OPA の強制のレベルで、Sentinel にはありません。

### 問11 `Terraform-8.0-011`

**正解**: C

誰であっても違反を許さないなら、上書きできない hard-mandatory にします。soft-mandatory は権限のある人が上書きでき、advisory は警告だけなので、違反したまま apply できてしまいます。

### 問12 `Terraform-8.0-012`

**正解**: D

プライベートレジストリは、組織の中だけで使うモジュールとプロバイダーを公開する場所です。承認した標準のモジュールを配れます。run triggers はワークスペースの連携、speculative plan は計画を見るだけの実行、ロックは同時の操作の防止です。

### 問13 `Terraform-8.0-013`

**正解**: A、C

ヘルスアセスメントは、ドリフトの検出と、`check` ブロックや postcondition の条件の継続的な検証を定期的に行います。問題を見つけると表示と通知をしますが、インフラを自動で直すことはしません。プロバイダーの更新や書式の整形も行いません。

### 問14 `Terraform-8.0-014`

**正解**: B

explorer は、組織のすべてのワークスペースの情報(使っているモジュールのバージョンなど)を横断して調べる画面です。change requests は、見つけた対応が必要なことを、ワークスペースの作業項目として記録し、チームに知らせる機能です。

- A. state のロックは同時の実行を防ぐ仕組みで、force-unlock はそのロックを外すコマンドです。
- C. run triggers はワークスペースの実行をつなげる機能、変数セットは共通の変数をまとめる機能です。
- D. speculative plan は確認のための plan、auto-apply は plan の後に自動で apply する設定です。

### 問15 `Terraform-8.0-015`

**正解**: A

HCP Terraform では、ユーザーをチームに入れ、チームに組織、プロジェクト、ワークスペースの単位で権限(Read、Plan、Write、Admin など)を与えます。state のファイルやパスワードを配る必要はなく、全員が同じ権限になるわけでもありません。

### 問16 `Terraform-8.0-016`

**正解**: C

run tasks は、実行の途中(plan の後など)で外部のサービスを呼び出し、その結果で実行を続けるか止めるかを決められる機能です。セキュリティのスキャンや費用の管理のツールと連携します。

state のバージョンは state の履歴、プロジェクトはワークスペースをまとめる単位、変数セットは共通の変数のまとまりで、どれも外部のサービスを呼び出しません。

### 問17 `Terraform-8.0-017`

**正解**: B、E

HCP Terraform のワークスペースは、1 つの設定について、state と版の履歴、変数と環境変数、実行の履歴、設定(実行モード、VCS の接続、権限など)を持ちます。ユーザーのパスワード、他の組織の state、プロバイダーのソースコードは持ちません。

### 問18 `Terraform-8.0-018`

**正解**: B

CLI のワークスペースは、同じ設定とバックエンドのまま state だけを分ける仕組みです。HCP Terraform のワークスペースは、state に加えて、変数、権限、実行の履歴、設定まで分ける、独立した管理の単位です。名前は同じでも別の仕組みです。

### 問19 `Terraform-8.0-019`

**正解**: B

プロジェクトは、関係するワークスペースをまとめる単位で、チームの権限をプロジェクトの単位で与えられます。後からワークスペースを追加しても、権限を一つずつ設定しなくて済みます。

speculative plan は確認のための plan、run triggers はワークスペースの実行をつなげる機能、Sentinel はポリシーを書く言語で、どれも権限をまとめて与えるものではありません。

### 問20 `Terraform-8.0-020`

**正解**: C

変数セットは、複数のワークスペースで共通の変数をまとめたもので、組織全体、プロジェクト、特定のワークスペースに適用できます。同じ変数を一つずつ設定する手間がなくなります。

プライベートレジストリはモジュールとプロバイダーの共有、explorer はワークスペースの横断の調査、run tasks は実行の途中で外部のサービスを呼び出す機能です。

### 問21 `Terraform-8.0-021`

**正解**: C

run triggers を設定すると、元のワークスペースの apply が成功したときに、つないだワークスペースの実行が自動で始まります。auto-apply は、そのワークスペースの plan の後に確認なしで apply する設定で、別のワークスペースは動かしません。

### 問22 `Terraform-8.0-022`

**正解**: B

ワークスペースは、アプリやインフラの部品と、環境ごとに分けるのが一般的です(例: `network-prod`、`app-dev`)。1 つにまとめると変更の影響範囲が大きくなり、権限も分けられません。リソースやユーザーごとに分けるのは細かすぎて管理できません。

### 問23 `Terraform-8.0-023`

**正解**: D

`terraform login` は、ブラウザで HCP Terraform の API トークンを作り、手元の `credentials.tfrc.json` に保存します。`terraform auth` や `terraform connect` というコマンドはありません。

### 問24 `Terraform-8.0-024`

**正解**: C

HCP Terraform につなぐには、`terraform` ブロックの中に `cloud` ブロックを書き、`organization` と `workspaces` を指定します。`provider` ブロックは state の置き場所を決めるものではなく、`backend "local"` は手元に置く設定です。

### 問25 `Terraform-8.0-025`

**正解**: C

`cloud` ブロックを追加したら `terraform init` を実行します。local の state があると、HCP Terraform のワークスペースに移すかどうかを質問され、移せます。`state push` は state を直接上書きする危険な操作です。`login` に `-migrate` はありません。

### 問26 `Terraform-8.0-026`

**正解**: C

動的なプロバイダーの認証情報は、実行のたびに OIDC でクラウドから有効期限の短い認証情報をもらう機能で、長期のアクセスキーを保存しなくて済みます。Sensitive の変数や変数セットに保存しても、長期のアクセスキーであることは変わりません。設定ファイルに書くのは漏えいの原因です。
