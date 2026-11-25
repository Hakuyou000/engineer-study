# LinuC 3PS テキスト 6.0 プラットフォームの運用管理

サーバーやインフラを、手作業ではなくコードと道具で作り、監視し、守る方法を学びます。Ansible と OpenTofu による構築、PXE と cloud-init による初期設定、Git とパイプラインによる自動化、Zabbix による監視、バックアップのツールを扱います。

前提の版は、OpenTofu が 1.x 系、Zabbix が 7.0 LTS、OS が AlmaLinux 9(RHEL 9 系)と Ubuntu 24.04 です。

## 6.1 インフラプロビジョニングの自動化 (重要度3)

**プロビジョニング**は、サーバーやネットワークなどのインフラを、使える状態に用意することです。ここでは、役割の違う 2 つの道具を使い分けます。

| 道具 | 得意なこと | 例 |
|---|---|---|
| OpenTofu | インフラそのものを作る、変える、消す(仮想マシン、ネットワーク、ストレージ) | 仮想マシンを 3 台作る |
| Ansible | できたサーバーの中の設定をそろえる(パッケージ、ファイル、サービス) | nginx を入れて設定ファイルを置く |

### 1. Ansible の設定ファイル(ansible.cfg)

**ansible.cfg** は、Ansible の動きを決める設定ファイルです。次の順に探し、最初に見つかった 1 つだけを使います(混ぜ合わせません)。

| 順 | 場所 |
|---|---|
| 1 | 環境変数 `ANSIBLE_CONFIG` で指したファイル |
| 2 | カレントディレクトリの `ansible.cfg` |
| 3 | ホームの `~/.ansible.cfg` |
| 4 | `/etc/ansible/ansible.cfg` |

プロジェクトのディレクトリに `ansible.cfg` を置くと、その場所で実行したときだけ効きます。Git で一緒に管理できます。

カレントディレクトリが誰でも書き込める(world-writable)場合、そこの `ansible.cfg` は安全のため読まれません。

```ini
[defaults]
inventory = ./inventory.ini
remote_user = ops
roles_path = ./roles
host_key_checking = True
vault_password_file = ~/.vault_pass

[privilege_escalation]
become = True
become_method = sudo
```

- `inventory`: 既定のインベントリ。`-i` を毎回書かなくてよくなります。
- `remote_user`: SSH でつなぐユーザー。
- `roles_path`: Role を探す場所。
- `become`: つないだあとに sudo などで権限を上げます。
- `ansible --version` で、どの `ansible.cfg` を読んでいるか(config file の行)を確認できます。

### 2. インベントリと Dynamic Inventory

**インベントリ**は、対象のホストの一覧とグループです。INI か YAML で書きます。

```yaml
all:
  children:
    web:
      hosts:
        web1.example.com:
        web2.example.com:
    db:
      hosts:
        db1.example.com:
          ansible_user: ops
      vars:
        ansible_port: 2222
```

- ホストごとの変数は `host_vars/<ホスト名>.yml`、グループごとの変数は `group_vars/<グループ名>.yml` に分けて置けます。
- 解釈の結果は `ansible-inventory --graph`(木の形)と `ansible-inventory --list`(JSON)で確かめます。

クラウドや仮想基盤では、台数と IP アドレスが毎日変わります。ファイルを手で書き換える代わりに、**Dynamic Inventory(動的インベントリ)**を使います。実行のたびに、クラウドの API に問い合わせて、いまあるホストの一覧を作ります。

```yaml
# aws_ec2.yml(amazon.aws コレクションのインベントリプラグイン)
plugin: amazon.aws.aws_ec2
regions:
  - ap-northeast-1
keyed_groups:
  - key: tags.Role
    prefix: role
```

```bash
ansible-inventory -i aws_ec2.yml --graph
ansible-playbook -i aws_ec2.yml site.yml
```

- 昔はスクリプト(JSON を出力する実行ファイル)でしたが、いまは**インベントリプラグイン**が主流です。
- 上の例では、タグ `Role=web` のホストが自動で `role_web` グループに入ります。

### 3. Role

**Role** は、playbook の部品を、決まったディレクトリの形にまとめた単位です。再利用と共有がしやすくなります。

```text
roles/
`-- nginx/
    |-- tasks/main.yml        やること(入口)
    |-- handlers/main.yml     変更があったときだけ動く処理
    |-- templates/            Jinja2 のテンプレート(.j2)
    |-- files/                そのままコピーするファイル
    |-- vars/main.yml         変数(優先度が高い)
    |-- defaults/main.yml     既定の変数(優先度が最も低い)
    `-- meta/main.yml         依存する Role、作者などの情報
```

| ディレクトリ | 内容 |
|---|---|
| `tasks` | 実行するタスクの一覧。`main.yml` から読まれる |
| `handlers` | `notify` で呼ばれたときだけ動く処理(サービスの再読み込みなど)。同じ実行の中で何度呼ばれても、最後に 1 回だけ動く |
| `templates` | 変数を埋め込んだ設定ファイルのひな形。`template` モジュールで使う |
| `files` | 変えずに置くファイル。`copy` モジュールで使う |
| `vars` | Role の内部の変数。上書きされにくい(優先度が高い) |
| `defaults` | 使う人が上書きする前提の既定値。優先度が最も低い |
| `meta` | 依存する Role(`dependencies`)や対応する OS |

```yaml
# roles/nginx/tasks/main.yml
- name: nginx を入れる
  ansible.builtin.package:
    name: nginx
    state: present

- name: 設定ファイルを置く
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    mode: "0644"
  notify: nginx を再読み込みする

- name: nginx を起動して自動起動にする
  ansible.builtin.service:
    name: nginx
    state: started
    enabled: true
```

```yaml
# roles/nginx/handlers/main.yml
- name: nginx を再読み込みする
  ansible.builtin.service:
    name: nginx
    state: reloaded
```

```yaml
# roles/nginx/defaults/main.yml
nginx_worker_connections: 1024
```

```yaml
# site.yml
- hosts: web
  become: true
  roles:
    - role: nginx
      vars:
        nginx_worker_connections: 4096
```

- 設定ファイルが変わったときだけ、`notify` で handler が呼ばれ、nginx を再読み込みします。変わらなければ呼ばれません。
- 使う側は `defaults` の値を、上のように上書きします。`vars` に置くと上書きしにくくなるので、「使う人に変えてほしい値」は `defaults` に置きます。
- ひな形は `ansible-galaxy role init nginx` で作れます。

### 4. Ansible Vault

**Ansible Vault** は、パスワードや鍵などの秘密の値を、暗号化して Git に置けるようにする機能です。

| コマンド | 内容 |
|---|---|
| `ansible-vault create secrets.yml` | 暗号化したファイルを新しく作る(エディタが開く) |
| `ansible-vault encrypt vars.yml` | 既存のファイルを暗号化する |
| `ansible-vault decrypt vars.yml` | 暗号化を解く(平文に戻る) |
| `ansible-vault view secrets.yml` | 中身を見る(ファイルは暗号化のまま) |
| `ansible-vault edit secrets.yml` | 開いて編集する(保存すると暗号化される) |
| `ansible-vault rekey secrets.yml` | 暗号化のパスワードを変える |
| `ansible-vault encrypt_string 'abc' --name 'db_password'` | 1 つの値だけを暗号化して、YAML に貼る形で出す |

実行のときは、パスワードを渡します。

```bash
ansible-playbook site.yml --ask-vault-pass
ansible-playbook site.yml --vault-password-file ~/.vault_pass
ansible-playbook site.yml --vault-id prod@~/.vault_pass_prod
```

- パスワードを書いたファイル(`~/.vault_pass`)は、Git に入れません。権限を `0600` にします。
- 暗号化したファイルは、先頭が `$ANSIBLE_VAULT;1.1;AES256` で始まります。
- ファイル全体を暗号化すると、`grep` で変数の名前を探せなくなります。そこで、平文のファイルに `db_password: "{{ vault_db_password }}"` と書き、暗号化したファイルに `vault_db_password` の実際の値を置く方法がよく使われます。

### 5. Ansible Galaxy

**Ansible Galaxy** は、Role と**コレクション**(モジュール、プラグイン、Role をまとめた配布の単位)を共有する場所です。`ansible-galaxy` コマンドで取ってきます。

```bash
ansible-galaxy role init myrole                          # Role のひな形を作る
ansible-galaxy role install geerlingguy.nginx            # Role を入れる
ansible-galaxy collection install amazon.aws             # コレクションを入れる
ansible-galaxy install -r requirements.yml               # 一覧のファイルからまとめて入れる
```

```yaml
# requirements.yml
roles:
  - name: geerlingguy.nginx
    version: 3.2.0
collections:
  - name: amazon.aws
    version: ">=8.0.0"
```

- バージョンを固定しておくと、同じ結果を再現しやすくなります。
- 外から取ってきた Role は、使う前に中身を読みます。

### 6. OpenTofu とは

**OpenTofu** は、Terraform から分かれて、Linux Foundation の下で開発されているオープンソースの IaC(インフラをコードで管理する方法)の道具です。コマンドは `tofu` です。書き方(HCL)は、Terraform とほぼ同じです。

- Terraform の `terraform` コマンドを `tofu` に置き換えたものと考えられます。`terraform` ブロックという名前は、OpenTofu でも同じです。
- 同じ名前のファイル(`.terraform.lock.hcl`、`terraform.tfstate`、`terraform.tfvars`)を使います。
- OpenTofu だけの機能に、state と plan のファイルの暗号化があります(1.7 以降。`terraform` ブロックの中の `encryption` ブロックで設定します)。
- 基本の考え方(宣言的、plan と apply、state)は Terraform と同じです。詳しくは Terraform のテキストにあります。

### 7. 設定ファイルの構成

| ファイル | 内容 |
|---|---|
| `main.tf` | resource、data、module などの本体 |
| `variables.tf` | 入力変数の宣言(`variable` ブロック) |
| `outputs.tf` | 出力の宣言(`output` ブロック) |
| `terraform.tfvars` | 変数に入れる値。ここにある値は、自動で読まれる |
| `*.auto.tfvars` | これも自動で読まれる値のファイル |
| `.terraform.lock.hcl` | provider の版を固定するファイル。Git に入れる |
| `terraform.tfstate` | state(管理しているものの記録)。Git に入れない |

ファイルの名前は決まりではなく、同じディレクトリの `.tf` はすべて読まれます。分けているのは人が読みやすくするためです。

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  type    = string
  default = "ap-northeast-1"
}

variable "instance_type" {
  type = string
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.al2023.id
  instance_type = var.instance_type
  tags = {
    Name = "web"
  }
}

output "web_ip" {
  value = aws_instance.web.private_ip
}
```

| ブロック | 役割 |
|---|---|
| `terraform` | 必要な OpenTofu と provider の版、バックエンド(state の置き場所)を決める |
| `provider` | どのサービス(AWS、Proxmox など)に、どう接続するか |
| `resource` | 作るもの。state で管理される |
| `data` | すでにあるものを読むだけ(作らない、変えない) |
| `variable` | 外から入れる値 |
| `output` | 実行のあとに表示する値、ほかの module に渡す値 |
| `module` | ほかのディレクトリの設定を、部品として呼ぶ |

AWS のプロバイダーは 6 系の例です。版の指定は、使う時点の最新を確かめて決めます。

変数に値を入れる方法は、優先度の低い順に次のとおりです(後のものが勝ちます)。

1. `variable` ブロックの `default`
2. 環境変数 `TF_VAR_名前`
3. `terraform.tfvars`、`terraform.tfvars.json`
4. `*.auto.tfvars`
5. コマンドラインの `-var` と `-var-file`

### 8. 実行の流れとコマンド

```text
tofu init       provider と module を取ってくる、バックエンドを準備する
tofu fmt        書き方をそろえる
tofu validate   書き方と参照の誤りを調べる(接続はしない)
tofu plan       何が変わるかを表示する(変えない)
tofu apply      実際に作る、変える
tofu destroy    管理しているものをすべて消す
```

| コマンド | 内容 |
|---|---|
| `tofu init` | 最初に 1 回。バックエンド、provider、module を用意する。`-upgrade` で provider を新しくする |
| `tofu validate` | 設定の構文と、変数や参照の正しさを調べる。実際のインフラには接続しない |
| `tofu fmt` | 書式を整える。`-check` は直さず、直すべきかだけを調べる。`-recursive` は下のディレクトリまで |
| `tofu plan -out=tfplan` | 計画を表示して、ファイルに保存する |
| `tofu apply tfplan` | 保存した計画のとおりに実行する(確認の質問は出ない) |
| `tofu apply -auto-approve` | 確認の質問なしで実行する |
| `tofu destroy` | 管理しているものをすべて消す |
| `tofu output` | 出力の値を表示する。`-raw`、`-json` もある |

- `tofu plan` の記号は `+` が作成、`~` が変更、`-` が削除、`-/+` が作り直しです。
- `tofu plan -detailed-exitcode` は、変更なしで 0、エラーで 1、変更ありで 2 を返します。パイプラインでの判定に使えます。

### 9. state の操作とインポート

**state** は、OpenTofu が「いま何を管理しているか」を記録するファイルです。手で編集せず、`tofu state` で操作します。

| コマンド | 内容 |
|---|---|
| `tofu state list` | state にあるリソースの一覧 |
| `tofu state show aws_instance.web` | 1 つのリソースの記録を見る |
| `tofu state mv A B` | state の中の名前を付け替える(実際のインフラは変えない) |
| `tofu state rm aws_instance.web` | state から外す(実際のインフラは消えない。管理だけをやめる) |

すでにあるインフラを管理に取り込むのが `tofu import` です。

```bash
tofu import aws_instance.web i-0123456789abcdef0
```

- `tofu import` の前に、取り込む先の `resource` ブロックを書いておきます(中身は空でよい)。ブロックがないと、import はエラーになります。import は **state に記録するだけ**で、ブロックの中身は書きません。取り込んだあとにブロックをコードから消すと、次の plan で削除の計画が出ます。
- 新しい書き方として、設定の中に `import { to = ...  id = ... }` ブロックを書き、`tofu plan` と `tofu apply` で取り込む方法もあります。この場合は、`tofu plan -generate-config-out=generated.tf` で、ブロックの中身の案を作れます。
- 取り込んだあとの `tofu plan` で、差分が出なくなるまで `resource` の中身を合わせます。

### 10. バックエンドと state のロック

**バックエンド**は、state をどこに置くかを決めます。既定は `terraform.tfstate`(local バックエンド)です。複数の人やパイプラインで使うときは、共有の場所に置きます。

```hcl
terraform {
  backend "s3" {
    bucket         = "example-tofu-state"
    key            = "prod/network/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "example-tofu-lock"
    encrypt        = true
  }
}
```

- **state のロック**は、同じ state を 2 人が同時に変えて壊すことを防ぐ仕組みです。plan や apply の間、ほかの実行を待たせるか、失敗させます。
- ロックの方式はバックエンドで違います。S3 では、DynamoDB のテーブルを使う方法(`dynamodb_table`)のほかに、1.10 からは S3 のバケットの中のロックのファイルだけで行う方法(`use_lockfile = true`)も使えます。
- 実行が途中で落ちてロックが残ったときは、`tofu force-unlock <ロックの ID>` で外します。ほかの人が実行中でないことを確かめてから行います。
- 待つ時間は `-lock-timeout=60s` で指定します。
- バックエンドを変えたあとは、`tofu init -migrate-state` で state を移します。
- state には、パスワードなどの値が平文で入ることがあります。置き場所を暗号化し、アクセスを絞ります。

### 11. プロビジョナー

**プロビジョナー**は、リソースを作ったあとに、コマンドを実行したりファイルを送ったりする機能です。

| 種類 | 内容 |
|---|---|
| `local-exec` | OpenTofu を動かしている側のマシンでコマンドを実行する |
| `remote-exec` | 作ったサーバーに SSH でつないで、コマンドを実行する |
| `file` | 作ったサーバーに、ファイルやディレクトリを送る |

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.al2023.id
  instance_type = "t3.micro"

  connection {
    type        = "ssh"
    host        = self.public_ip
    user        = "ec2-user"
    private_key = file("~/.ssh/id_ed25519")
  }

  provisioner "file" {
    source      = "app.conf"
    destination = "/tmp/app.conf"
  }

  provisioner "remote-exec" {
    inline = ["sudo mv /tmp/app.conf /etc/app.conf"]
  }

  provisioner "local-exec" {
    command = "echo ${self.private_ip} >> hosts.txt"
  }
}
```

- プロビジョナーは**最後の手段**です。plan に結果が出ず、失敗すると `tainted`(作り直しの対象)の印が付きます。
- できるなら、サーバーの中の設定は cloud-init(6.2)か Ansible に任せます。
- `local-exec` から Ansible を呼ぶ方法もありますが、再実行しにくくなります。

## 6.2 初期設定とインストールの自動化 (重要度3)

サーバーを増やすとき、OS のインストールと初期設定を毎回手でやると、ミスとばらつきが出ます。ここでは、**インストール**の自動化(PXE、kickstart、Preseed、Autoinstall)と、**起動後の初期設定**の自動化(cloud-init)を学びます。

### 1. PXE ブート

**PXE**(Preboot Execution Environment)は、ディスクもメディアもない機械が、ネットワークから起動する仕組みです。NIC のファームウェアに入っています。

```text
[client]  新しいサーバー(NIC の PXE)
   |
   | 1. DHCP で、IP アドレスと取ってくるファイルの名前を聞く
   v
[DHCP]    next-server(TFTP の場所)と filename を返す
   |
   | 2. TFTP で、ブートローダーを取ってくる
   v
[TFTP]    pxelinux.0、grubx64.efi などを置く
   |
   | 3. カーネルと initrd を取ってきて起動する
   v
[installer]  回答ファイル(kickstart、preseed、autoinstall)を HTTP で取り、無人で進む
```

| 役割 | 使うもの | ポート |
|---|---|---|
| DHCP | IP アドレスと、ブートローダーの名前を渡す | UDP 67、68 |
| TFTP | ブートローダー、カーネル、initrd を渡す | UDP 69 |
| HTTP | 回答ファイル、パッケージのリポジトリを渡す | TCP 80 |

- **dnsmasq** は、DHCP と TFTP を 1 つで動かせるので、小さな環境でよく使われます。
- BIOS と UEFI で、渡すブートローダーが違います。BIOS は `pxelinux.0` など、UEFI は `shimx64.efi` や `grubx64.efi` などです。DHCP の設定で、機械の種類(アーキテクチャ)によって出し分けます。
- DHCP を新しく動かすときは、同じネットワークの既存の DHCP サーバーと競合しないようにします。専用のネットワークで動かすか、プロキシ DHCP を使います。

### 2. kickstart(RHEL 系)

**kickstart** は、RHEL 系(AlmaLinux、Rocky Linux、RHEL)のインストーラー(Anaconda)に、質問の答えをあらかじめ渡すファイルです。`ks.cfg` などの名前で作ります。

```text
# ks.cfg(抜粋)
lang ja_JP.UTF-8
keyboard jp106
timezone Asia/Tokyo --utc
rootpw --lock
user --name=ops --groups=wheel --iscrypted --password=$6$...(ハッシュ)
network --bootproto=dhcp --hostname=web01.example.com
zerombr
clearpart --all --initlabel
autopart
bootloader --location=mbr
reboot

%packages
@core
chrony
%end

%post
systemctl enable chronyd
%end
```

- 渡し方は、ブートのパラメーターで `inst.ks=http://192.0.2.10/ks.cfg` のように書きます。RHEL 9 では `inst.ks=` です(以前の `ks=` は古い書き方)。
- `%packages` は入れるもの、`%pre` はインストールの前、`%post` はインストールの後に実行するシェルスクリプトです。
- インストールを一度手でやると、`/root/anaconda-ks.cfg` が自動で作られます。これを元に作ると楽です。
- `ksvalidator ks.cfg`(pykickstart の道具)で、書き方を検査できます。
- パスワードは平文でなくハッシュにします。`clearpart --all` は、ディスクの中身をすべて消します。

### 3. Preseed(Debian)

**Preseed** は、Debian のインストーラー(debian-installer)に、答えをあらかじめ渡す仕組みです。書式は `d-i 質問の名前 型 値` です。

```text
# preseed.cfg(抜粋)
d-i debian-installer/locale string ja_JP.UTF-8
d-i keyboard-configuration/xkb-keymap select jp
d-i netcfg/get_hostname string web01
d-i mirror/country string manual
d-i mirror/http/hostname string deb.debian.org
d-i mirror/http/directory string /debian
d-i partman-auto/method string lvm
d-i partman-auto/choose_recipe select atomic
d-i partman/confirm boolean true
d-i partman/confirm_nooverwrite boolean true
d-i passwd/root-login boolean false
d-i passwd/username string ops
d-i passwd/user-password-crypted password $6$...(ハッシュ)
d-i pkgsel/include string openssh-server
d-i finish-install/reboot_in_progress note
```

- 渡し方は、ブートのパラメーターに `auto=true priority=critical url=http://192.0.2.10/preseed.cfg` のように書きます。【要確認】指定の細かい書き方は、版で違うことがあります。
- 質問の名前を調べるには、手でインストールしたあとに `debconf-get-selections --installer` を使います。
- `priority=critical` では、それより低い優先度の質問は既定値で進みます。critical の質問(ディスクへの書き込みの確認など)に答えがないと、そこで止まります。

### 4. Autoinstall(Ubuntu)

**Autoinstall** は、Ubuntu Server(subiquity というインストーラー)の自動インストールです。YAML で書き、`user-data` の中の `autoinstall:` の下に置きます。Ubuntu 24.04 で使えます。

```yaml
#cloud-config
autoinstall:
  version: 1
  locale: ja_JP.UTF-8
  keyboard:
    layout: jp
  identity:
    hostname: web01
    username: ops
    password: "$6$...(ハッシュ)"
  ssh:
    install-server: true
    allow-pw: false
    authorized-keys:
      - ssh-ed25519 AAAA... ops@example.com
  storage:
    layout:
      name: lvm
  packages:
    - chrony
  late-commands:
    - curtin in-target --target=/target -- systemctl enable chrony
```

- `user-data` と、空でもよい `meta-data` の 2 つを、HTTP で配ります。ブートのパラメーターに `autoinstall ds=nocloud\;s=http://192.0.2.10/` のように書きます(GRUB では `;` が区切りになるので、`\;` とエスケープするか、引用符で囲みます)。`s=` の URL は `/` で終わらせます。
- 確認の質問が出ないように、インストーラーは `autoinstall` というパラメーターがあるときだけ、無人で進みます。ディスクを消すので、この安全装置があります。
- インストールが終わったあとに、同じ形式の設定が `/var/log/installer/autoinstall-user-data` に残ります。

3 つの比較です。

| | kickstart | Preseed | Autoinstall |
|---|---|---|---|
| 対象 | RHEL 系 | Debian | Ubuntu Server |
| インストーラー | Anaconda | debian-installer | subiquity |
| 書式 | 独自の書式(`%packages` など) | `d-i 名前 型 値` | YAML(cloud-config の中) |
| 渡し方 | `inst.ks=URL` | `url=URL` | `autoinstall ds=nocloud;s=URL` |

### 5. cloud-init

**cloud-init** は、クラウドや仮想マシンが**初めて起動するときに**、ホスト名、ユーザー、SSH の鍵、パッケージ、ファイルなどを自動で設定する仕組みです。多くのクラウドのイメージ(AWS、Azure、Ubuntu のクラウドイメージなど)に入っています。

cloud-init は、起動すると次の順に動きます。

1. datasource(設定の取得先)を探す。クラウドの API、NoCloud(ディスク)など。
2. `meta-data`、`user-data`、`network-config` を読む。
3. init、config、final の 3 つの段階で、モジュールが順に実行される。

| 入力 | 内容 |
|---|---|
| `meta-data` | インスタンスの ID、ホスト名など、基盤が決める情報 |
| `user-data` | 利用者が書く設定。`#cloud-config` で始まる YAML か、`#!` で始まるシェルスクリプト |
| `network-config` | ネットワークの設定(version 2 は netplan に近い書式)。NoCloud などで使う |
| `vendor-data` | 基盤の提供者が入れる設定 |

- クラウドなしの環境(KVM、Proxmox など)では、**NoCloud** という datasource を使います。`cidata` という名前のラベルを付けたディスク(ISO)に、`user-data` と `meta-data`(必要なら `network-config`)を入れて、仮想マシンに付けます。
- `user-data` の最初の行は、`#cloud-config` と書かなければなりません。違うと、設定として読まれません。
- 設定ファイルは `/etc/cloud/cloud.cfg` と `/etc/cloud/cloud.cfg.d/*.cfg` です。**cloud.cfg** は、どのモジュールを、どの段階で動かすかと、既定のユーザーなどを決める、cloud-init 自身の設定です。利用者が書く `user-data` とは別のものです。

### 6. #cloud-config の主なモジュール

```yaml
#cloud-config
hostname: web01
fqdn: web01.example.com
timezone: Asia/Tokyo

groups:
  - appteam

users:
  - default
  - name: ops
    groups: [sudo, appteam]
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    lock_passwd: true
    ssh_authorized_keys:
      - ssh-ed25519 AAAA... ops@example.com

package_update: true
package_upgrade: true
packages:
  - nginx
  - chrony

write_files:
  - path: /etc/motd
    content: |
      Managed by cloud-init.
    permissions: "0644"
    owner: root:root

bootcmd:
  - echo "boot at $(date)" >> /var/log/boot-mark.log

runcmd:
  - systemctl enable --now nginx
  - [sh, -c, "echo done > /var/tmp/first-boot"]
```

| キー | 内容 |
|---|---|
| `hostname`、`fqdn`、`timezone` | ホスト名、完全なホスト名、タイムゾーン |
| `users` | ユーザーを作る。`default` は、イメージの既定のユーザー(Ubuntu なら `ubuntu`) |
| `groups` | グループを作る |
| `packages` | パッケージを入れる |
| `package_update` | 入れる前にパッケージの一覧を更新する(`apt update`、`dnf makecache` 相当) |
| `package_upgrade` | 入っているパッケージを更新する |
| `write_files` | ファイルを作る(場所、中身、権限、持ち主) |
| `bootcmd` | 起動の**早い段階**で、**起動のたび**に実行するコマンド |
| `runcmd` | 起動の**最後の段階**で、**最初の起動の 1 回だけ**実行するコマンド |
| `disk_setup`、`fs_setup`、`mounts` | ディスクの分割、ファイルシステムの作成、マウント(`/etc/fstab` への追加) |
| `network` | ネットワークの設定(`network-config` と同じ書式) |

- `runcmd` は、1 回だけです。再起動のたびに実行したいことは `bootcmd` に書きます(ただし、まだ早い段階なので、ネットワークやサービスが整っていません)。
- `users` に `default` を書かずに自分でユーザーを書くと、既定のユーザーは作られません。書き方に注意します。
- `write_files` は、ユーザーを作るより前に動きます。そのため、`owner` に作る予定のユーザーを書くと失敗します。`defer: true` を付けると、ユーザーとパッケージのあとの final の段階で書かれます。【要確認】`defer` が使える版は、公式の文書で確かめてください。
- ディスクの設定の例です。

```yaml
disk_setup:
  /dev/vdb:
    table_type: gpt
    layout: true
    overwrite: false
fs_setup:
  - label: data
    filesystem: ext4
    device: /dev/vdb1
mounts:
  - [/dev/vdb1, /data, ext4, "defaults,nofail", "0", "2"]
```

### 7. cloud-init の確認とやり直し

| コマンド | 内容 |
|---|---|
| `cloud-init status --long` | 終わったか、エラーがあったかを見る。`--wait` で終わるまで待つ |
| `cloud-init schema --system` | 実際に使われている user-data が、決まりに合っているかを調べる |
| `cloud-init schema --config-file user-data.yaml` | ファイルの書き方を調べる(起動前に使える) |
| `cloud-init clean --logs` | 実行の記録を消して、次の起動で最初からやり直せるようにする |
| `/var/log/cloud-init.log` | 詳しい記録 |
| `/var/log/cloud-init-output.log` | runcmd などのコマンドの出力 |

- 設定を直して試すときは、`cloud-init clean --logs` のあとに再起動します。やらないと、「すでに実行済み」で、`runcmd` などが動きません。
- `#cloud-config` の YAML の書き方を間違えると、静かに無視されることがあります。必ず `cloud-init schema` で調べます。

## 6.3 インフラ構成の Git 管理とパイプラインの自動化 (重要度3)

インフラの設定をコードにしたら、アプリのコードと同じように、**Git で履歴を管理**し、**パイプライン**で自動の検査と適用を行います。

### 1. Git の基本のコマンド

| コマンド | 内容 |
|---|---|
| `git add main.tf` | 変更をステージに載せる(次のコミットに入れる) |
| `git commit -m "メッセージ"` | ステージの内容を履歴に残す |
| `git push origin feature/web` | 手元の履歴を、共有の場所に送る |
| `git pull --rebase` | 共有の場所の新しい履歴を取り込む |
| `git branch` | ブランチの一覧。`git branch feature/web` で作る |
| `git switch feature/web` | ブランチを切り替える(`git checkout` でも同じ) |
| `git switch -c feature/web` | ブランチを作って切り替える |
| `git merge feature/web` | ほかのブランチを、いまのブランチに取り込む |
| `git rebase main` | いまのブランチの変更を、main の先頭の上に載せ直す |
| `git log --oneline --graph` | 履歴を短く、木の形で見る |
| `git diff` | まだステージしていない変更の差分 |
| `git diff --staged` | ステージした変更の差分(コミットされる内容) |

merge と rebase は、同じ目的(ブランチを取り込む)に使いますが、履歴の形が違います。

```text
merge(履歴に合流の印が残る)
  main     A---B---C-------M
                \         /
  feature        D---E---+

rebase(履歴が 1 本につながる)
  main     A---B---C
                    \
  feature            D'--E'
```

- rebase は、コミットを作り直します(D が D' になる)。すでに共有の場所に push したブランチを rebase して push し直すと、ほかの人の履歴と食い違います。共有しているブランチでは行いません。
- やむを得ず push し直すときは、`git push --force-with-lease` を使います。ほかの人が先に push していたら失敗するので、`--force` より安全です。
- 秘密の情報(パスワード、鍵、`terraform.tfstate`)は、コミットしません。`.gitignore` に `*.tfstate`、`.terraform/` を書きます。履歴に一度入ると、あとで消しても履歴に残ります。

### 2. インフラのリポジトリの進め方

```text
1. main から作業用のブランチを切る: git switch -c change/add-web
2. コードを変える
3. 手元で検査する: fmt、validate、lint
4. コミットして push する
5. プルリクエストを作る: CI が自動で検査し、plan を出す
6. 人がレビューする: コードと plan の内容を見る
7. main に merge する: CD が自動で apply する
```

- **plan の結果をレビューの対象にする**のが、インフラのコードの要点です。コードの差分だけでは、実際に何が消えるかが見えません。
- main への直接の push を禁止し、レビューを通さないと merge できないようにします(ブランチの保護)。
- 適用は、決まったパイプラインだけが行います。手元から apply しないようにすると、コードと実際のずれが減ります。

### 3. OpenTofu の検査と適用

| 段階 | コマンド | 内容 |
|---|---|---|
| 書式 | `tofu fmt -check -recursive` | 書式がそろっていなければ失敗する |
| 検証 | `tofu init -backend=false` のあと `tofu validate` | 書き方と参照の誤りを調べる |
| 計画 | `tofu plan -out=tfplan` | 何が変わるかを出す。レビューに載せる |
| 適用 | `tofu apply tfplan` | **レビューした計画のとおり**に適用する |

- `tofu apply` に計画のファイルを渡すと、レビューした内容と、実際に変わる内容が必ず同じになります。計画を渡さないと、plan から apply までの間に変化があれば、別の内容が実行されます。
- `tofu validate` は、provider が使えるように `init` を先に行う必要があります。接続はしないので、認証の情報がなくても動きます。
- 本番への適用は、plan の確認のあとに、人が承認してから行う運用にします。

### 4. Ansible の検査と適用

| 道具 | 内容 |
|---|---|
| `ansible-lint site.yml` | 書き方の規約や、よくない書き方を指摘する(別にインストールする道具) |
| `ansible-playbook site.yml --syntax-check` | YAML と playbook の構文だけを調べる。対象のホストには接続しない |
| `ansible-playbook site.yml --check` | **ドライラン**。変更せずに、何が変わるかだけを確認する |
| `ansible-playbook site.yml --check --diff` | 変わるファイルの差分も表示する |
| `ansible-playbook site.yml --limit web1` | 対象を 1 台に絞って適用する |

- `--check` は、`command` や `shell` のモジュールを実行しない(飛ばす)ので、結果が実際と違うことがあります。前の手順の結果に頼る手順は、正しく確かめられません。
- 本番の前に、検証用の環境に適用し、2 回目の実行で `changed=0` になること(冪等性)を確かめます。
- `--limit` で 1 台に絞ってから、全体に広げます。

### 5. cloud-init の検査

- `user-data` の作成は、テンプレート(変数を入れる元のファイル)から、環境ごとに生成します。
- 適用前の検査は、`cloud-init schema --config-file user-data.yaml --annotate` です。`--annotate` は、誤りの場所を行ごとに印で示します。
- 適用の検証は、実際にテスト用の仮想マシンを起動し、`cloud-init status --wait` が成功し、期待する状態(ユーザー、パッケージ、ファイル)になっているかを調べます。

### 6. InSpec

**InSpec** は、サーバーが「あるべき状態」になっているかを、コードで検査する道具です。設定を変えず、調べて合否を出します。

```ruby
# controls/web.rb
control 'web-1' do
  title 'nginx が入っていて動いている'
  describe package('nginx') do
    it { should be_installed }
  end
  describe service('nginx') do
    it { should be_enabled }
    it { should be_running }
  end
  describe port(80) do
    it { should be_listening }
  end
  describe file('/etc/nginx/nginx.conf') do
    its('mode') { should cmp '0644' }
  end
end
```

```bash
inspec init profile web-profile                      # ひな形を作る
inspec exec web-profile -t ssh://ops@192.0.2.10 -i ~/.ssh/id_ed25519   # SSH で対象を調べる
inspec exec web-profile                              # 自分自身を調べる
```

- 適用(Ansible など)のあとに InSpec を動かすと、「適用したつもり」ではなく、「実際に狙いどおり」になっているかが分かります。
- 検査が失敗したら、パイプラインを止めます。

### 7. パイプライン(CI/CD)

**CI**(継続的インテグレーション)は、変更のたびに、自動で検査を行うことです。**CD**(継続的デリバリー、デプロイ)は、検査を通ったものを、自動で適用する(または承認を待つ)ことです。

```text
[pull request]
   fmt / lint --> validate --> plan --> review
   早く安い検査から順に。review では人が plan を確認する

[main に merge したあと]
   apply --> InSpec
   apply で計画のとおり適用し、InSpec で狙いどおりかを検証する
```

簡単な例です(GitHub Actions 風の、考え方を示すものです)。

```yaml
jobs:
  check:
    steps:
      - run: tofu fmt -check -recursive
      - run: tofu init -backend=false
      - run: tofu validate
      - run: ansible-lint
      - run: ansible-playbook site.yml --syntax-check
      - run: cloud-init schema --config-file user-data.yaml
  plan:
    needs: check
    steps:
      - run: tofu init
      - run: tofu plan -out=tfplan
  apply:
    needs: plan
    if: github.ref == 'refs/heads/main'
    steps:
      - run: tofu apply tfplan
      - run: inspec exec web-profile -t ssh://ops@${{ vars.WEB_HOST }}
```

- 速くて安い検査(書式、構文)を先に置き、失敗したら以降を止めます。
- 認証の情報(クラウドの鍵、Vault のパスワード)は、パイプラインの秘密の変数に入れ、リポジトリには入れません。

## 6.4 Zabbix による監視システムの構築 (重要度3)

**Zabbix** は、サーバーやネットワーク機器の状態を集め、グラフにし、問題があれば通知する監視のツールです。この教材は Zabbix 7.0 LTS を前提にします。

### 1. 構成部品

```text
agent  --- 10051 (アクティブ: agent から送る) ---> server
agent  <-- 10050 (パッシブ: server が聞きに来る) -- server
```

| 部品 | 内容 |
|---|---|
| Zabbix サーバー | 値を集め、トリガーを評価し、通知する中心(`zabbix_server`)。ポート 10051 |
| DB | 設定と集めた値を保存する。MySQL / MariaDB か PostgreSQL |
| フロントエンド | PHP で作られた Web の画面。Apache か Nginx の上で動く。設定のほとんどをここで行う |
| Zabbix エージェント | 監視される側で動き、値を返す。ポート 10050。`zabbix-agent`(従来)と `zabbix-agent2`(新しい) |
| Zabbix プロキシ | 遠い拠点などで値を集め、まとめてサーバーに送る。サーバーの負荷と回線を減らす |

### 2. 導入の手順(Zabbix 7.0、概要)

1. Zabbix の公式のリポジトリを追加する。
2. サーバー、フロントエンド、エージェントのパッケージを入れる。
3. DB を用意し、初期のスキーマを取り込む。
4. `/etc/zabbix/zabbix_server.conf` に、DB の接続を書く。
5. サーバーとエージェントとウェブサーバーを起動する。
6. ブラウザーで画面を開き、初期設定を行う。

```bash
# AlmaLinux 9(公式のリポジトリを追加したあと)
dnf install zabbix-server-mysql zabbix-web-mysql zabbix-nginx-conf \
            zabbix-sql-scripts zabbix-selinux-policy zabbix-agent2

# Ubuntu 24.04
apt install zabbix-server-mysql zabbix-frontend-php zabbix-nginx-conf \
            zabbix-sql-scripts zabbix-agent2
```

```bash
# MariaDB に、データベースとユーザーを作る
mysql -uroot -p
> create database zabbix character set utf8mb4 collate utf8mb4_bin;
> create user zabbix@localhost identified by 'パスワード';
> grant all privileges on zabbix.* to zabbix@localhost;
> set global log_bin_trust_function_creators = 1;
> quit

# 初期のスキーマを取り込む
zcat /usr/share/zabbix-sql-scripts/mysql/server.sql.gz | \
  mysql --default-character-set=utf8mb4 -uzabbix -p zabbix

# 取り込んだら、設定を戻す
mysql -uroot -p -e "set global log_bin_trust_function_creators = 0;"
```

```text
# /etc/zabbix/zabbix_server.conf
DBHost=localhost
DBName=zabbix
DBUser=zabbix
DBPassword=パスワード
```

- パッケージの名前や手順は、OS と DB の組み合わせで変わります。公式の手順で確かめます。【要確認】
- 画面の初期のユーザーは `Admin`、パスワードは `zabbix` です。最初に必ず変えます。
- SELinux が有効な RHEL 系では、`zabbix-selinux-policy` を入れ、`setsebool -P httpd_can_connect_zabbix on` などが必要になることがあります。【要確認】

### 3. エージェントとパッシブ / アクティブ

エージェントの設定ファイルは `/etc/zabbix/zabbix_agent2.conf`(従来は `zabbix_agentd.conf`)です。

```text
Server=192.0.2.10          パッシブ: 値を聞きに来てよいサーバー
ServerActive=192.0.2.10    アクティブ: 自分から値を送りに行くサーバー
Hostname=web01             アクティブで、自分を名乗る名前(画面のホスト名と同じにする)
```

| 方式 | 動き | 向く場面 |
|---|---|---|
| パッシブ | サーバーが、エージェントの 10050 に問い合わせる | 通常。サーバーからエージェントへの通信を通せる |
| アクティブ | エージェントが、サーバーの 10051 に、自分から送る | NAT や FW の内側。ログ監視。自動登録 |

- パッシブは、サーバー側から**エージェントへ**、アクティブは、エージェント側から**サーバーへ**接続します。FW でどちらの向きを許すかが変わります。
- 値を送れないとき、`Server` と `ServerActive` に、サーバーの IP を書き間違えていないかをまず確認します。アクティブでは、`Hostname` が画面のホスト名と違うと、値が届きません。

### 4. ホスト、アイテム、トリガー、テンプレート

| 用語 | 内容 |
|---|---|
| ホスト | 監視する対象。インターフェース(エージェント、SNMP、IPMI)を持つ |
| アイテム | 集める値 1 つ。キーで指定する。例: `system.cpu.load[all,avg1]`、`vfs.fs.size[/,pfree]` |
| トリガー | アイテムの値の条件(しきい値)。条件を満たすと「問題」になる |
| テンプレート | アイテム、トリガー、グラフなどを 1 つにまとめた部品。ホストにリンクして使う |
| アクション | 問題が起きたときの対応(条件と、通知などの操作) |

トリガーの式は、7.0 では次の形です。

```text
last(/web01/system.cpu.load[all,avg1])>5                  直近の値が 5 より大きい
avg(/web01/system.cpu.load[all,avg1],5m)>2                5 分間の平均が 2 より大きい
min(/web01/vfs.fs.size[/,pfree],10m)<10                   10 分間ずっと、空きが 10% を下回っている
```

- トリガーを `last` だけで作ると、一瞬の山で通知が来ます。`avg` や `min` で、一定の時間の様子を見ると、誤報が減ります。
- ホストを 1 台ずつ設定せず、**テンプレート**を作ってリンクします。「Linux by Zabbix agent」など、最初から入っているテンプレートがあります。
- ホストの追加は、画面の「データ収集」の「ホスト」から行います。ホスト名、グループ、エージェントのインターフェース(IP、ポート 10050)、リンクするテンプレートを指定します。

### 5. アクションとアラート

通知を出すまでの流れです。

通知を出すまでの流れは、次のとおりです。

1. アイテムの値が、トリガーの条件を満たす。
2. 問題(Problem)が作られる。
3. アクションの条件に合うかを調べる(例: 重要度が「警告」以上で、ホストグループが本番)。
4. 合えば、操作を実行する(メディアタイプ経由でメールや Slack に通知、スクリプトの実行)。

- **メディアタイプ**は、通知の手段(メール、Slack、スクリプトなど)です。ユーザーの設定の「メディア」に、宛先を登録します。この両方がないと、アクションを作っても通知は届きません。
- 通知の文面には、**マクロ**(`{HOST.NAME}`、`{TRIGGER.NAME}`、`{ITEM.VALUE}` など)を使えます。
- 問題が直ったときの通知は、「復旧時の操作」で別に設定します。
- 通知を段階にする(10 分で解決しなければ、上の人に)こともできます。

### 6. マクロ

**マクロ**は、値を名前で呼び出す仕組みです。

| 種類 | 例 | 内容 |
|---|---|---|
| 組み込みのマクロ | `{HOST.NAME}`、`{ITEM.VALUE}` | Zabbix が値を入れる。通知の文面などで使う |
| ユーザーマクロ | `{$DISK_FREE_MIN}` | 利用者が決める。グローバル、テンプレート、ホストで定義でき、ホスト、テンプレート、グローバルの順に探す(狭いほうが優先される) |
| LLD マクロ | `{#FSNAME}` | ローレベルディスカバリで、見つかったものの名前が入る |

```text
トリガー: min(/Linux/vfs.fs.size[/,pfree],10m)<{$DISK_FREE_MIN}
テンプレートでの値: {$DISK_FREE_MIN} = 10
ログ用のサーバーだけ、ホストで上書き: {$DISK_FREE_MIN} = 5
```

- しきい値をマクロにしておくと、1 つのテンプレートで、ホストごとに違う値を使えます。
- パスワードなどの秘密の値は、「シークレットテキスト」のマクロにすると、画面に出ません。

### 7. ローレベルディスカバリ(LLD)

**ローレベルディスカバリ**は、ホストの中にある「数が決まっていないもの」(ファイルシステム、ネットワークインターフェース、ディスクなど)を、自動で見つけて、アイテムとトリガーを作る機能です。

流れは、次のとおりです。

1. ディスカバリルール(キー `vfs.fs.discovery`)で、エージェントが、見つけた一覧を JSON で返す。
2. 例: `[{"{#FSNAME}":"/"}, {"{#FSNAME}":"/var"}, {"{#FSNAME}":"/data"}]`
3. アイテムのプロトタイプ(例 `vfs.fs.size[{#FSNAME},pused]`)とトリガーのプロトタイプから、見つかった数だけアイテムとトリガーが作られる。消えたものは、一定の期間のあとに消える。

- 主なキーは、`vfs.fs.discovery`(ファイルシステム)、`net.if.discovery`(ネットワークインターフェース)です。
- ディスクを後から増やしても、手でアイテムを足さなくてよくなります。

### 8. ネットワークディスカバリと自動登録

新しいホストを、人が 1 台ずつ登録しなくてもよくする方法が 2 つあります。LLD(ホストの中のもの)とは別の話です。

| | ネットワークディスカバリ(自動ディスカバリ) | エージェントの自動登録 |
|---|---|---|
| 動き | サーバーが、IP の範囲を調べて、見つけた機器を登録する | **アクティブ**のエージェントが、自分からサーバーに、登録を頼む |
| 設定 | 「データ収集」の「ディスカバリ」で、IP の範囲とチェック(ポート、SNMP など)を決める | エージェントに `ServerActive` と `Hostname`、必要なら `HostMetadata` を書く |
| 登録の操作 | ディスカバリのアクションで、ホストの追加、グループ、テンプレートを決める | 自動登録のアクションで、同じことを決める |
| 向く場面 | 機器が多い既存のネットワーク | クラウドで、台数が増減するサーバー |

- 自動登録では、`HostMetadata=Linux web` のように書いておくと、アクションの条件に使えます(「web を含むなら、web のテンプレートをリンクする」)。
- cloud-init(6.2)の `runcmd` や、Ansible で、エージェントの設定ファイルを置いておくと、起動するだけで監視に入ります。

### 9. SNMP と IPMI

**SNMP** は、ネットワーク機器などが、状態を OID(数字の並びの名前)で教える仕組みです。エージェントを入れられない機器の監視に使います。

- ホストに「SNMP」のインターフェースを追加し、IP、ポート(161)、バージョン(v2c か v3)、コミュニティ(v2c の場合)を指定します。
- アイテムの種類は「SNMP エージェント」です。OID は「SNMP OID」の欄に書きます(キーは、自分で決める一意の名前です)。`{$SNMP_COMMUNITY}` のマクロを使うと、まとめて変えられます。
- 機器からの通知(トラップ)を受けるなら、`snmptrap` の仕組みを使います。
- v2c のコミュニティは平文で流れます。可能なら v3(認証と暗号化)にします。

**IPMI** は、サーバーの本体の管理用のチップ(BMC)に、ネットワークで問い合わせて、温度、ファン、電源などを見る仕組みです。OS が止まっていても見られます。

- ホストに「IPMI」のインターフェースを追加し、BMC の IP とユーザーを指定します。
- Zabbix サーバーの設定 `StartIPMIPollers` を、0 より大きくします(既定は 0 で、IPMI の収集が動きません)。
- アイテムの種類は「IPMI エージェント」で、センサーの名前をキーにします。

### 10. Web シナリオ

**Web シナリオ**は、Web サイトを、人が使うように順にアクセスして、応答を確かめる監視です。ホストの「Web」の項目で作ります。

| 設定 | 内容 |
|---|---|
| ステップ | 順番に開く URL。ログインの画面、ログイン後の画面、など |
| 必須の文字列 | 画面に含まれているべき文字列。ないと失敗とみなす |
| 期待するステータスコード | 例: `200` |
| 変数、ヘッダー、POST のデータ | ログインの情報などを渡す |

- ステップごとに、応答のコード(`web.test.rspcode`)、応答の時間(`web.test.time`)などのアイテムが自動で作られます。
- 画面が 200 を返しても、中身がエラーの表示のことがあります。「必須の文字列」で確かめます。
- 実行するのは、サーバーかプロキシです。ブラウザーの JavaScript は動かしません。

### 11. ログ監視

ファイルのログに、ある文字列が出たら検知する監視です。アイテムの種類は「Zabbix エージェント(アクティブ)」にします。**パッシブでは動きません**。

```text
log[/var/log/messages,"error|failed",,,skip]
```

| 引数 | 内容 |
|---|---|
| 1 つ目 | 見るファイル |
| 2 つ目 | 正規表現(一致した行だけを集める) |
| 5 つ目 | `skip` にすると、監視を始める前の古い行は読まない(`all` は、すべての行を読む) |

- ログのローテーションに対応する場合は `logrt[]` を使います。
- エージェントの実行ユーザー(`zabbix`)が、そのログを読める必要があります。RHEL 系の `/var/log/messages` は、読めるように権限を調整します。Ubuntu の `/var/log/syslog` は `adm` グループで読めます。`usermod -aG adm zabbix` で zabbix のユーザーを `adm` に入れ、エージェントを再起動します。
- 一致した行をトリガーにするときは、`find()` や `count()` の関数を使います(例: `find(/web01/log[/var/log/messages,"error"],,"like","error")=1`)。

### 12. 外部チェックとユーザーパラメーター

標準のアイテムで取れない値は、自作のスクリプトで取ります。方法が 2 つあります。

| | 外部チェック | ユーザーパラメーター |
|---|---|---|
| 実行する場所 | **Zabbix サーバー**(またはプロキシ)の上 | **監視される側**(エージェント)の上 |
| 置き場所 | `ExternalScripts` ディレクトリ(例: `/usr/lib/zabbix/externalscripts`) | エージェントの設定ファイルの `UserParameter=` |
| 用途 | 手元から調べるもの(外部の API、ほかの機器への問い合わせ) | そのサーバーの中を調べるもの |

```text
外部チェック
  アイテムの種類: 外部チェック
  キー: check_queue.sh[mqhost1]
  配置: /usr/lib/zabbix/externalscripts/check_queue.sh(zabbix が実行できる権限)

ユーザーパラメーター(エージェントの設定)
  UserParameter=app.sessions,/usr/local/bin/count_sessions.sh
```

- 外部チェックは、サーバーでプロセスを起こすため、数が多いとサーバーの負荷が上がります。大量には向きません。
- スクリプトが遅いと、収集が詰まります。タイムアウトに注意します。

## 6.5 バックアップツールの利用 (重要度2)

バックアップは、取るだけでは意味がなく、**戻せて**初めて価値があります。ここでは、方式の選び方と、rsync、rclone、Bacula の使い方、取れなかったときの切り分けを学びます。

### 1. バックアップの種類

| 軸 | 種類 | 内容 |
|---|---|---|
| 対象 | システムバックアップ | OS と設定を含む全体。サーバーを丸ごと復旧するため |
| 対象 | データバックアップ | アプリのデータだけ(DB、ユーザーのファイル)。OS は入れ直せる前提 |
| 量 | フル | すべてを毎回取る |
| 量 | 増分 | **前回(フルでも増分でも)**からの変更だけ |
| 量 | 差分 | **前回のフル**からの変更だけ |

```text
        Sun Mon Tue Wed Thu Fri Sat
full     F   .   .   .   .   .   .
incr     F   i1  i2  i3  i4  i5  i6    各回は、直前の回との差だけ
diff     F   d1  d2  d3  d4  d5  d6    各回は、日曜のフルとの差(だんだん大きくなる)
```

| | フル | 増分 | 差分 |
|---|---|---|---|
| 取る時間と量 | 最大 | 最小 | 中(日ごとに増える) |
| 戻すのに要るもの | そのフルだけ | フル + その日までの増分すべて | フル + 最新の差分の 1 つ |
| 戻す手間 | 小さい | 大きい。途中が 1 つ欠けても戻せない | 中 |

### 2. 見方の 4 つ(効率性、即時性、依存性、整合性)

方式を選ぶときの見方を、この教材では次の 4 つで整理します。

| 見方 | 問い | 例 |
|---|---|---|
| 効率性 | 時間、容量、回線をどれだけ使うか | 増分や重複排除で、取る量と置く量を減らす |
| 即時性 | 障害のときに、どれだけ早く戻せるか | フルは戻しが早い。増分は戻しに時間がかかる |
| 依存性 | 戻すのに、ほかのバックアップが必要か | 増分は、前の増分とフルに依存する。1 つ壊れると戻せない |
| 整合性 | 取ったデータが、矛盾なく、ある時点の状態になっているか | 動いている DB のファイルをそのままコピーすると、途中の状態で壊れる |

- 効率性を上げる(増分)と、即時性と依存性が悪くなります。バランスで決めます。
- 整合性のために、DB は `mysqldump --single-transaction` や `pg_dump` で取る、LVM のスナップショットを使う、サービスを一時止める、などの方法があります。

### 3. 圧縮、暗号化、重複排除、帯域制限

| 機能 | 内容 | 注意 |
|---|---|---|
| 圧縮 | 容量を減らす(`gzip`、`zstd`、rsync の `-z`) | CPU を使う。写真など、すでに圧縮されたものは小さくならない |
| 暗号化 | 盗まれても読まれないようにする(`gpg`、rclone の crypt、borg、restic) | **鍵をなくすと、戻せない**。鍵はバックアップとは別の場所に保管する |
| 重複排除 | 同じ内容のかたまりを 1 つだけ保存する(borg、restic、専用のストレージ) | 大量の似たデータで、容量が大きく減る |
| 帯域制限 | 回線を使いすぎないようにする(rsync `--bwlimit`、rclone `--bwlimit`) | 昼の業務の通信を邪魔しない |

- **圧縮してから暗号化**します。暗号化したデータは、もう圧縮できません。
- 重複排除は、バックアップの道具の機能です。rsync と rclone の本体にはありません(同じ内容のファイルを別の名前で置いても、2 つ分を使います)。
- 帯域制限の単位は、rsync の `--bwlimit=5000` が約 5000 KiB/秒、rclone の `--bwlimit 10M` が 10 MiB/秒です(単位の書き方は、道具ごとに違います)。

### 4. rsync

**rsync** は、元と先を比べて、**違うところだけ**を送る、コピーの道具です。SSH を通して、ほかのサーバーにも送れます。

```bash
rsync -avz --delete /srv/data/ backup@bk01:/backup/data/
```

| オプション | 内容 |
|---|---|
| `-a` | アーカイブ。権限、時刻、持ち主、シンボリックリンクなどを保つ(`-rlptgoD` と同じ) |
| `-v` | 経過を表示する |
| `-z` | 送るときに圧縮する |
| `-n`、`--dry-run` | 実際にはコピーせず、何をするかだけを表示する |
| `--delete` | 元にないファイルを、先から**消す**(元を同期する) |
| `-A`、`-X` | ACL と拡張属性(SELinux のラベルを含む)を保つ |
| `--bwlimit=KBPS` | 帯域を制限する |
| `-e ssh` | 通信に使うシェルを指定する(最近は、既定が ssh) |
| `--exclude='*.tmp'` | 除外する |
| `--link-dest=DIR` | 前回のバックアップと同じファイルは、ハードリンクにして、容量を節約する |
| `-c`、`--checksum` | 時刻と大きさではなく、中身のチェックサムで比べる(遅いが確実) |

- **元のパスの最後の `/`** に注意します。`/srv/data/` は「中身」を、`/srv/data` は「ディレクトリ自体」を送ります。
- `--delete` を付けたら、まず `-n` で確かめます。元を間違えると、先の大事なファイルが消えます。
- `--link-dest` を使うと、日ごとのディレクトリが、全部がフルに見えるのに、増えた分しか容量を使わない、増分のようなバックアップになります。

```bash
today=$(date +%F)
rsync -a --link-dest=/backup/latest /srv/data/ /backup/$today/
ln -sfn /backup/$today /backup/latest
```

### 5. rclone

**rclone** は、クラウドのストレージ(S3、Google Drive、Azure Blob など)と、手元のファイルの間で、同期やコピーをする道具です。「rsync のクラウド版」と呼ばれます。

```bash
rclone config                                    # 接続先(リモート)を対話で作る
rclone lsd s3backup:                             # バケットの一覧
rclone copy /srv/data s3backup:bucket/data       # コピー(先に余分があっても消さない)
rclone sync /srv/data s3backup:bucket/data       # 同期(元にないものは先から消す)
rclone check /srv/data s3backup:bucket/data      # 元と先が同じかを比べる
rclone sync /srv/data s3backup:bucket/data --bwlimit 10M --dry-run
```

| コマンド、オプション | 内容 |
|---|---|
| `rclone copy` | 元から先へコピーする。先にだけあるファイルは残す |
| `rclone sync` | 先を元と同じにする。**先にだけあるファイルは消す** |
| `rclone check` | 元と先が同じかを調べる(変えない) |
| `--dry-run`、`-n` | 実際には行わず、何をするかだけを表示する |
| `--bwlimit 10M` | 帯域を 10 MiB/秒までにする |
| `--transfers N` | 同時に転送する数 |
| `-P` | 進み具合を表示する |
| crypt の remote | 中身とファイル名を暗号化して、クラウドに置く |

- `copy` と `sync` の違いが、いちばん事故になりやすいところです。sync の前に `--dry-run` を行います。
- 設定ファイル(`~/.config/rclone/rclone.conf`)には、認証の情報が入ります。権限を絞り、Git に入れません。

### 6. Bacula

**Bacula** は、複数のサーバーを、まとめて管理して取る、ネットワーク型のバックアップのシステムです。部品の関係は、次のとおりです。

- Director(`bacula-dir`): 指揮者。いつ、何を、どこに取るかを決める。
- File Daemon(`bacula-fd`): バックアップされる側に入れ、ファイルを読む。
- Storage Daemon(`bacula-sd`): テープやディスクなどの保存先に書く。
- Catalog: 何をいつ取ったかの記録(MySQL / PostgreSQL)。
- Console(`bconsole`): 人が操作する画面。

| 用語 | 内容 |
|---|---|
| Job | 1 回のバックアップや復元の仕事 |
| FileSet | 何を取るか(ディレクトリ、除外、圧縮の設定) |
| Schedule | いつ、どのレベル(Full / Incremental / Differential)で取るか |
| Pool、Volume | 保存先のグループと、実際のテープ、ファイル |
| Client | バックアップされる側(File Daemon) |

```text
Schedule {
  Name = "WeeklyCycle"
  Run = Level=Full 1st sun at 02:05
  Run = Level=Differential 2nd-5th sun at 02:05
  Run = Level=Incremental mon-sat at 02:05
}
FileSet {
  Name = "web-data"
  Include {
    Options { signature = SHA1; compression = GZIP }
    File = /srv/data
  }
}
```

```bash
bconsole
*status client=web01-fd     # クライアントの状態
*run job=BackupWeb          # すぐに実行する
*list jobs                  # 実行の一覧
*messages                   # 結果のメッセージ
*restore                    # 復元(対話式)
```

- 設定ファイルは `/etc/bacula/bacula-dir.conf`、`bacula-sd.conf`、`bacula-fd.conf` などです。
- ポートは、Director が 9101、File Daemon が 9102、Storage Daemon が 9103 です。
- 復元は、Catalog に記録があるので、「いつの時点の、どのファイルを、どこに」と指定して行えます。

### 7. SELinux と AppArmor との関係

バックアップと復元は、ファイルの**ラベルや制限の影響**を受けます。

| 項目 | RHEL 系(SELinux) | Ubuntu(AppArmor) |
|---|---|---|
| 何を守るか | ファイルとプロセスに付けた**ラベル**(コンテキスト) | プログラムごとの**プロファイル**(読める、書ける場所の一覧) |
| ラベルを保つ | rsync `-aX`、tar `--selinux --xattrs` | ファイルに付ける印はないので、気にしなくてよい |
| 復元の後の直し方 | `restorecon -Rv /path` で、ポリシーが決めた正しいラベルに戻す | 該当なし |
| 拒否の確認 | `ausearch -m avc -ts recent`、`journalctl`、`sealert` | `dmesg \| grep DENIED`、`journalctl`、`aa-status` |
| 一時的に動きを緩める | `setenforce 0`(原因の切り分け用。常用しない) | `aa-complain /etc/apparmor.d/<プロファイル>` |

- **SELinux**: 別のところから復元したファイルは、ラベルが違い(例: `user_home_t`)、Web サーバーが読めなくなることがあります。`ls -Z` で確認し、`restorecon -Rv` で直します。
- **AppArmor**: バックアップの道具のプロファイルが、読む場所を制限していて、取れないことがあります。ログに `DENIED` が出ます。プロファイルに許可を足すか、プロファイルを complain(記録だけ)にして原因を見ます。
- 切り分けのために無効にしたら、原因が分かった時点で必ず有効に戻します。

### 8. ログ解析と切り分け、復元の検証

バックアップが失敗したときは、広い範囲から順に狭めます。

| 症状 | 確認すること |
|---|---|
| 定期の実行が動いていない | `systemctl list-timers`、`journalctl -u backup.service`、cron のログ |
| 接続できない | `ssh` で手でつなぐ。FW、DNS、鍵、`~/.ssh/known_hosts` |
| 一部のファイルだけ失敗 | 権限(読めない)、SELinux / AppArmor の拒否、ファイルが消えた |
| 容量が足りない | 先の `df -h`、`df -i`(inode)、古い世代の掃除 |
| 時間がかかりすぎる | 回線の混み具合、帯域制限、`-z` の CPU、増分にできないか |

rsync は、終了コードで原因を絞れます。

| 終了コード | 意味 |
|---|---|
| 0 | 成功 |
| 23 | 一部のファイルが転送できなかった(権限、SELinux の拒否など) |
| 24 | 転送中に、元のファイルが消えた(多くは無害) |
| 30 | 時間切れ |

- 一部が失敗した場合、全体が失敗の終了コードになっても、残りのファイルは取れています。何が取れていないかを、必ずログで確認します。

**復元の検証**は、「戻せる」ことを、定期的に確かめることです。

1. 本番とは**別の場所**に、復元してみる。
2. 元と中身を比べる(`diff -r`、`sha256sum -c`、`rclone check`、`rsync -avnc`)。
3. 整合性を確認する(DB なら、起動して、テーブルを数える。ファイルなら、アプリが開く)。
4. アーカイブなら、`tar -tzf backup.tar.gz > /dev/null` で、壊れていないかだけでも確かめる。
5. かかった時間を測る。想定していた復旧の時間に収まるかを見る。

```bash
mkdir /tmp/restore-test
tar -xzf /backup/data-2026-11-20.tar.gz -C /tmp/restore-test
diff -r /srv/data /tmp/restore-test/srv/data       # 元と比べる(その後の変更は差として出る)
sha256sum -c /backup/data-2026-11-20.sha256        # 取ったときのチェックサムと比べる
```

- バックアップは、**元の機械とは別の場所**にも置きます(同じ場所では、火事や機器の故障で一緒に失われます)。
- 「取れた」ではなく、「戻せた」が、バックアップの合格の条件です。
