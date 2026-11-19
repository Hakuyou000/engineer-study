# LinuC 101 テキスト 1.04 リポジトリとパッケージ管理

ソフトウェアを入れる、更新する、消すための仕組み(パッケージ管理)を、Debian 系(apt、dpkg)と Red Hat 系(yum / dnf、rpm)の両方で学びます。

## 1.04.1 apt コマンドによるパッケージ管理 (重要度3)

### 1. パッケージとリポジトリ

- **パッケージ**は、プログラム、設定ファイル、説明、必要なほかのパッケージ(**依存関係**)の情報をまとめたファイルです。
- **リポジトリ**は、パッケージを置いた配布の場所(サーバー)です。
- apt や yum は、リポジトリからパッケージを探し、依存関係も一緒に入れてくれます。dpkg や rpm は、手元のパッケージのファイルを 1 つずつ扱う、低いレベルの道具です。

| | Debian 系(Debian、Ubuntu) | Red Hat 系(RHEL、AlmaLinux、Fedora) |
|---|---|---|
| パッケージの形式 | `.deb` | `.rpm` |
| 低いレベルの道具 | `dpkg` | `rpm` |
| 高いレベルの道具 | `apt`、`apt-get`、`apt-cache` | `yum`、`dnf` |
| リポジトリの設定 | `/etc/apt/sources.list`、`/etc/apt/sources.list.d/` | `/etc/yum.repos.d/*.repo` |

### 2. apt と apt-get

| apt | apt-get / apt-cache | 動き |
|---|---|---|
| `apt update` | `apt-get update` | リポジトリから、パッケージの一覧を取り直す(パッケージそのものは更新しない) |
| `apt upgrade` | `apt-get upgrade` | 入っているパッケージを新しい版にする(新しいパッケージを入れたり消したりはしない) |
| `apt full-upgrade` | `apt-get dist-upgrade` | 依存関係の変化に合わせて、必要なら入れたり消したりして更新する |
| `apt install nginx` | `apt-get install nginx` | 入れる |
| `apt remove nginx` | `apt-get remove nginx` | 消す(設定ファイルは残る) |
| `apt purge nginx` | `apt-get purge nginx` | 設定ファイルも消す |
| `apt autoremove` | `apt-get autoremove` | 依存関係として入り、もう要らなくなったものを消す |
| `apt search nginx` | `apt-cache search nginx` | 名前と説明で探す |
| `apt show nginx` | `apt-cache show nginx` | パッケージの詳しい情報 |
| ― | `apt-cache depends nginx` | 依存するパッケージ |
| `apt list --installed` | ― | 入っているパッケージの一覧 |

- `apt` は人が使うための新しいコマンドで、`apt-get` と `apt-cache` はスクリプトでも使う古くからのコマンドです。
- 入れる前に、まず `apt update` で一覧を新しくします。

### 3. apt-file

**apt-file** は、あるファイルが**どのパッケージに入っているか**を探します。まだ入れていないパッケージも探せます。

```bash
sudo apt install apt-file
sudo apt-file update
apt-file search bin/ifconfig     # net-tools に入っていると分かる
apt-file list net-tools          # パッケージに入っているファイルの一覧
```

### 4. /etc/apt/sources.list

```
deb http://archive.ubuntu.com/ubuntu noble main restricted universe
deb-src http://archive.ubuntu.com/ubuntu noble main
```

| 項目 | 意味 |
|---|---|
| `deb` / `deb-src` | バイナリのパッケージ / ソースのパッケージ |
| URL | リポジトリの場所 |
| `noble` | ディストリビューションの版のコード名(Ubuntu 24.04) |
| `main` など | コンポーネント(main は公式に支える自由なソフトウェア、universe はコミュニティのもの など) |

新しい Ubuntu では、`/etc/apt/sources.list.d/ubuntu.sources` に、同じ内容を別の書式(deb822)で書きます。

## 1.04.2 Debian パッケージ管理 (重要度1)

### 1. dpkg

| コマンド | 動き |
|---|---|
| `dpkg -i pkg.deb` | 手元の .deb を入れる(依存関係は解決しない) |
| `dpkg -r nginx` | 消す(設定ファイルは残る) |
| `dpkg -P nginx` | 設定ファイルも消す(purge) |
| `dpkg -l` | 入っているパッケージの一覧(`dpkg -l 'nginx*'` で絞る) |
| `dpkg -L nginx` | パッケージが入れたファイルの一覧 |
| `dpkg -S /usr/sbin/nginx` | そのファイルを入れたパッケージ |
| `dpkg -s nginx` | パッケージの状態と情報 |
| `dpkg -c pkg.deb` | .deb の中のファイルの一覧(入れずに見る) |

`dpkg -i` で依存関係が足りずにエラーになったら、`apt -f install`(足りないものを入れて直す)を実行します。手元の .deb は `apt install ./pkg.deb` で入れると、依存関係も解決します。

### 2. dpkg-reconfigure

パッケージを入れたときに答えた設定を、もう一度やり直します。

```bash
sudo dpkg-reconfigure tzdata             # タイムゾーンを選び直す
sudo dpkg-reconfigure locales            # ロケールを選び直す
```

## 1.04.3 yum コマンドによるパッケージ管理 (重要度3)

### 1. yum と dnf

RHEL 8 以降と AlmaLinux、Fedora では、yum の後継の **dnf** が使われます。`yum` のコマンドは dnf への別名として残っていて、同じように使えます。

| コマンド | 動き |
|---|---|
| `yum install nginx` | 入れる(`-y` で確かめずに) |
| `yum remove nginx`(`erase`) | 消す |
| `yum update` | すべてを更新する(`yum update nginx` で 1 つだけ) |
| `yum check-update` | 更新できるものの一覧(更新はしない) |
| `yum search nginx` | 名前と説明で探す |
| `yum info nginx` | 詳しい情報 |
| `yum list installed` | 入っているパッケージの一覧(`yum list` で入れられるものも) |
| `yum provides /usr/sbin/ifconfig` | そのファイルを持つパッケージを探す(`whatprovides`) |
| `yum deplist nginx` | 依存関係 |
| `yum groupinstall "Development Tools"` | パッケージグループを入れる(`yum group install`) |
| `yum grouplist` | パッケージグループの一覧 |
| `yum repolist` | 使えるリポジトリの一覧 |
| `yum history` | 入れたり消したりした履歴(`yum history undo 番号` で戻す) |
| `yum clean all` | キャッシュを消す |

### 2. リポジトリの設定

全体の設定は `/etc/yum.conf`(dnf では `/etc/dnf/dnf.conf`)に、リポジトリごとの設定は `/etc/yum.repos.d/` の `.repo` のファイルに書きます。

```ini
[myrepo]
name=My Repository
baseurl=https://repo.example.com/el9/
enabled=1
gpgcheck=1
gpgkey=https://repo.example.com/RPM-GPG-KEY-myrepo
```

| 項目 | 意味 |
|---|---|
| `[myrepo]` | リポジトリの ID |
| `baseurl` | パッケージの場所 |
| `enabled` | 1 で使う、0 で使わない |
| `gpgcheck` | 1 でパッケージの署名を確かめる |

一時的に使うときは `yum --enablerepo=myrepo install …`、使わないときは `--disablerepo=` を付けます。

### 3. yumdownloader

パッケージを**入れずに**、.rpm のファイルだけをダウンロードします(yum-utils、dnf では `dnf download`)。

```bash
yumdownloader nginx                 # 今のディレクトリに nginx の .rpm を落とす
yumdownloader --resolve nginx       # 依存するものも
yumdownloader --source nginx        # ソースの .rpm
```

## 1.04.4 RPM パッケージ管理 (重要度1)

### 1. rpm

| コマンド | 動き |
|---|---|
| `rpm -ivh pkg.rpm` | 入れる(`-i` install、`-v` 詳しく、`-h` 進み具合を # で表示) |
| `rpm -Uvh pkg.rpm` | 更新する(入っていなければ入れる) |
| `rpm -Fvh pkg.rpm` | 入っているものだけを更新する |
| `rpm -e nginx` | 消す(erase) |
| `rpm -qa` | 入っているすべてのパッケージ(`rpm -qa \| grep nginx`) |
| `rpm -qi nginx` | 情報 |
| `rpm -ql nginx` | 入れたファイルの一覧 |
| `rpm -qf /usr/sbin/nginx` | そのファイルを入れたパッケージ |
| `rpm -qc nginx` | 設定ファイルだけの一覧 |
| `rpm -qR nginx` | 依存関係 |
| `rpm -qpl pkg.rpm` | 入れていない .rpm の中のファイル(`-p` は手元のファイルを指す) |
| `rpm -V nginx` | 入れたときから変わったファイルを確かめる |
| `rpm --import KEY` | 署名を確かめるための公開鍵を取り込む |
| `rpm -K pkg.rpm` | 署名を確かめる |

- `-q`(query)で始まるものは調べるだけです。
- rpm は依存関係を自動では解決しません。足りなければエラーになるので、普段は yum / dnf を使います。
- `rpm2cpio pkg.rpm | cpio -idmv` で、入れずに中のファイルを取り出せます。

### 2. パッケージのファイル名の読み方

```
nginx-1.20.1-14.el9.x86_64.rpm
```

| 部分 | 意味 |
|---|---|
| `nginx` | 名前 |
| `1.20.1` | 版(バージョン) |
| `14.el9` | リリース(パッケージを作り直した回数と、対象のディストリビューション) |
| `x86_64` | アーキテクチャ(`noarch` はどれでも動く) |

Debian 系では `nginx_1.24.0-2ubuntu7_amd64.deb` のように、名前と版を `_` で区切ります。
