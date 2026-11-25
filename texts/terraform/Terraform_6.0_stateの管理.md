# Terraform テキスト 6.0 Terraform の state の管理

対象: Terraform Associate(004)

state をどこに置き、どう守り、実際のインフラとずれたときにどう直すかの分野です。local バックエンド、ロック、リモートのバックエンド、ドリフトへの対応、`moved` と `removed` のブロックが問われます。

## 6.1 local バックエンド

出題範囲: 既定のバックエンド、保存される場所、CLI のワークスペース、チームでの限界。

### 1. local バックエンドとは

**バックエンド**は、state をどこに保存し、ロックをどう行うかを決めるものです。バックエンドを何も設定しないと、**local バックエンド**が使われます。

| 項目 | 内容 |
|---|---|
| 保存場所 | 作業ディレクトリの `terraform.tfstate` |
| バックアップ | 更新の前の state を `terraform.tfstate.backup` に残す |
| ロック | OS のファイルのロックを使う(同じマシンの中での同時実行を防ぐ) |
| 場所を変える | `backend "local" { path = "state/dev.tfstate" }` |

```hcl
terraform {
  backend "local" {
    path = "relative/path/to/terraform.tfstate"
  }
}
```

### 2. local バックエンドの限界

| 問題 | 内容 |
|---|---|
| 共有できない | state が 1 人のパソコンにあるので、他のメンバーは同じインフラを操作できない |
| 失いやすい | パソコンの故障や削除で state がなくなる |
| 同時の操作を防げない | 別々のパソコンで実行すると、ロックが効かない |
| 機密情報 | 暗号化されずにディスクに置かれる |

個人の検証には十分ですが、**チームではリモートのバックエンド**を使います(6.3)。

### 3. CLI のワークスペース

1 つの設定から、別々の state を持つ環境をいくつも作る仕組みが **CLI のワークスペース**です。

| コマンド | 動き |
|---|---|
| `terraform workspace list` | 一覧(今のものに `*`) |
| `terraform workspace new dev` | 作って切り替える |
| `terraform workspace select dev` | 切り替える |
| `terraform workspace show` | 今のワークスペースの名前 |
| `terraform workspace delete dev` | 削除する(`default` は削除できない) |

- 最初からあるワークスペースは **`default`** です。
- local バックエンドでは、`default` 以外の state は **`terraform.tfstate.d/<名前>/terraform.tfstate`** に保存されます。
- 設定の中で `terraform.workspace` で今の名前を参照できます(例: `"web-${terraform.workspace}"`)。
- CLI のワークスペースは同じバックエンドと認証情報を共有するので、本番と開発のように**強く分けたい環境には向きません**。その場合は、ディレクトリやバックエンドを分けます。HCP Terraform のワークスペースは別の仕組みです(分野 8)。

## 6.2 state のロック

出題範囲: ロックの目的、自動のロック、ロックに対応したバックエンド、ロックの強制解除。

### 1. ロックの目的

2 人が同時に `apply` すると、state が同時に書き換えられて壊れたり、片方の変更が失われたりします。**state のロック**は、state を書き換えうる操作の間、他の人が同じ state を書き換えられないようにします。

- `plan`、`apply`、`destroy` など、state を書き換えうる操作で**自動でロック**します。設定は不要です(バックエンドが対応していれば)。
- 他の人がロックしていると、エラー(`Error acquiring the state lock`)になり、ロックの ID と持ち主の情報が表示されます。

2 人が同時に `apply` したときの、ロックの働きを図にします。

```text
Alice: apply を始める
  |
  | state のロックを取る(成功)
  v
Alice: 実行中。この間、state はロックされている
  |
  |  (この間に Bob が apply を始める)
  |    Bob: ロックを取れず、Error acquiring the state lock で失敗する
  v
Alice: apply が終わり、ロックを解く
  |
  v
Bob: もう一度実行すると、ロックを取れる
```

### 2. ロックに対応したバックエンド

| バックエンド | ロックの方法 |
|---|---|
| local | OS のファイルのロック |
| S3 | `use_lockfile = true` で、S3 にロックファイル(`.tflock`)を置く(1.11〜。DynamoDB でのロックは非推奨) |
| azurerm | Azure の Blob のリース |
| gcs | Cloud Storage のロックファイル |
| HCP Terraform(`cloud` ブロック) | 自動。ワークスペースごとにロックされる |

すべてのバックエンドがロックに対応しているわけではありません。チームで使うバックエンドは、ロックに対応したものを選びます。

### 3. ロックのオプション

| オプション / コマンド | 用途 |
|---|---|
| `-lock-timeout=60s` | ロックが取れないとき、指定した時間だけ待つ(既定は待たずにエラー) |
| `-lock=false` | ロックを使わない。**危険**。他の人が同時に操作しないと確実なときだけ |
| `terraform force-unlock LOCK_ID` | 実行中のプロセスが異常終了して残ったロックを、手で解除する |

`force-unlock` は、本当に誰も操作していないことを確かめてから使います。実行中の操作のロックを外すと、state が壊れるおそれがあります。`force-unlock` は state を変更しません(ロックを外すだけです)。

## 6.3 backend ブロックでリモートの state を設定する

出題範囲: `backend` ブロック、リモートのバックエンドの利点、部分的な設定、バックエンドの変更、`terraform_remote_state`。

### 1. backend ブロック

```hcl
terraform {
  backend "s3" {
    bucket       = "example-tfstate"
    key          = "network/terraform.tfstate"
    region       = "ap-northeast-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

| ルール | 内容 |
|---|---|
| 1 つの設定にバックエンドは 1 つ | 複数は書けません |
| **変数や参照は使えない** | `bucket = var.bucket` のようには書けません。backend は他の値より先に初期化されるためです |
| 変えたら `terraform init` | `-migrate-state` で state を移す、または `-reconfigure` で設定し直す |
| 認証情報は書かない | 環境変数などで渡します |

### 2. リモートのバックエンドの利点

| 利点 | 内容 |
|---|---|
| 共有 | チームの全員と CI が、同じ state を使える |
| ロック | 同時の操作を防げる(対応しているもの) |
| 保護 | 暗号化、アクセス制御、バージョン管理(S3 のバージョニングなど)ができる |
| 機密情報 | 開発者のパソコンに state を置かなくて済む |

local バックエンドとリモートのバックエンドで、state を使う人がどう変わるかを比べます。

```text
local バックエンド
  Alice's PC: terraform.tfstate     自分のパソコンだけにある
  Bob's PC:   terraform.tfstate     別の state になり、共有できない

リモートのバックエンド
  Alice's PC --+
  Bob's PC   --+--> [remote backend]  全員と CI が同じ state を使う
  CI         --+
```

### 3. 部分的な設定(partial configuration)

変数が使えないので、環境ごとに違う値や秘密の値は、`init` のときに外から渡します。

```hcl
terraform {
  backend "s3" {} # 中身は init のときに渡す
}
```

```bash
terraform init -backend-config=backend-prod.hcl
terraform init -backend-config="bucket=example-tfstate" -backend-config="key=prod.tfstate"
```

### 4. HCP Terraform に state を置く: cloud ブロック

HCP Terraform を使うときは、`backend` ではなく **`cloud` ブロック**を書きます(分野 8)。`cloud` ブロックと `backend` ブロックは同時には書けません。

```hcl
terraform {
  cloud {
    organization = "example-org"
    workspaces {
      name = "network-prod"
    }
  }
}
```

### 5. 他の設定の出力を読む: terraform_remote_state

別の設定(別の state)の**ルートモジュールの出力**を読むには、`terraform_remote_state` データソースを使います。

```hcl
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "example-tfstate"
    key    = "network/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.network.outputs.subnet_id
  # …
}
```

- 読めるのは**ルートモジュールの出力**だけです(`outputs.名前`)。
- ただし、読む側は state 全体を読める権限が必要になります(機密情報も含めて)。公開してよい値だけを渡すなら、パラメーターストアなどに値を書き出してデータソースで読む方法や、HCP Terraform の `tfe_outputs` データソースも検討します。

## 6.4 リソースのドリフトと state を管理する

出題範囲: ドリフトの検出、refresh-only、ドリフトの直し方、`moved` と `removed` のブロック、`terraform state` のコマンド。

### 1. ドリフトとは

Terraform の外(管理画面、別のツール)での変更で、**実際のインフラが state や設定とずれた状態**を**ドリフト**と呼びます。

`terraform plan` を実行すると、refresh の結果として、次のような表示が出ます。

```
Note: Objects have changed outside of Terraform
```

### 2. ドリフトへの対応

| 方針 | 方法 |
|---|---|
| 外での変更を**元に戻す**(設定が正しい) | 普通に `terraform apply`。実際のインフラが設定に合わせて直される |
| 外での変更を**受け入れる**(実際が正しい) | 設定をその変更に合わせて書き換えたうえで、`terraform apply -refresh-only` で state を実際のインフラに合わせる |
| 特定の属性の外での変更を、ずっと無視する | `lifecycle { ignore_changes = [...] }` |

**refresh-only** のモード:

- `terraform plan -refresh-only`: 実際のインフラを読み取り、state がどう更新されるかだけを表示します。インフラは変えません。
- `terraform apply -refresh-only`: 確認のうえ、**state だけ**を実際のインフラに合わせて更新します。インフラは変えません。
- 古い `terraform refresh` コマンドは、確認なしで state を書き換えるので非推奨です。`apply -refresh-only` を使います。

ドリフトに気づいたときの、対応の分かれ道を図にします。

```text
Drift: 実際のインフラが、Terraform の外で変更された
  |
  | terraform plan が、refresh で気づく
  v
Q: どちらが正しいか
  |
  +-- 設定が正しい
  |     `-- terraform apply   --> インフラを設定に戻す
  |
  +-- 実際が正しい
  |     `-- 設定をその変更に合わせて書き換えたうえで:
  |           terraform apply -refresh-only   --> state だけを実際に合わせる
  |
  +-- ずっと無視したい属性
        `-- lifecycle ignore_changes   --> その属性を差分にしない
```

### 3. リソースの名前を変える: moved ブロック

設定でリソースの名前(アドレス)を変えると、Terraform は「古いものを削除し、新しいものを作る」と判断します。名前だけを変え、実物はそのままにするには **`moved` ブロック**を使います。

```hcl
moved {
  from = aws_instance.web
  to   = aws_instance.frontend
}

resource "aws_instance" "frontend" {
  # 中身は元のまま
}
```

- モジュールの中に移したとき(`aws_instance.web` → `module.app.aws_instance.web`)や、`count` から `for_each` に変えたときにも使えます。
- 設定の中に書くので、レビューでき、全員の環境に同じように反映されます。
- 古い `terraform state mv` コマンドでも同じことができますが、state を直接変える操作で、記録が残りません。

### 4. 管理をやめる(実物は残す): removed ブロック

リソースを Terraform の管理から外し、**実物は削除しない**ときは、**`removed` ブロック**(1.7〜)を使います。

```hcl
removed {
  from = aws_s3_bucket.old_logs

  lifecycle {
    destroy = false # 実物を削除せず、state から外すだけ
  }
}
```

- 設定から `resource` ブロックを消すだけだと、その実物は**削除**されます。
- 古い方法は `terraform state rm aws_s3_bucket.old_logs` です。

### 5. terraform state のコマンド

| コマンド | 用途 |
|---|---|
| `terraform state list` | state のリソースの一覧(分野 7) |
| `terraform state show ADDRESS` | 1 つのリソースの属性(分野 7) |
| `terraform state mv FROM TO` | アドレスを変える(`moved` ブロックが推奨) |
| `terraform state rm ADDRESS` | state から外す。実物は残る(`removed` ブロックが推奨) |
| `terraform state pull` | リモートの state を取得して表示する |
| `terraform state push` | ローカルのファイルでリモートの state を上書きする(危険。通常は使わない) |

local の state を `state` のコマンドで変えると、バックアップのファイルが作られます。リモートの state を変えるときも、事前に `terraform state pull > backup.tfstate` などでバックアップを取っておくのが安全です。

### 6. まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| バックエンドの既定 | local。`terraform.tfstate` |
| backend ブロックに変数を使えるか | 使えない。部分的な設定(`-backend-config`)で渡す |
| 残ったロックを外す | `terraform force-unlock LOCK_ID` |
| 外での変更を state に取り込む | `terraform apply -refresh-only`(設定も合わせて直す) |
| 外での変更を元に戻す | 普通に `terraform apply` |
| 名前だけ変えて作り直しを避ける | `moved` ブロック |
| 管理から外すが実物は残す | `removed` ブロック(`destroy = false`)、または `terraform state rm` |
| 別の state の出力を読む | `terraform_remote_state` データソース |
