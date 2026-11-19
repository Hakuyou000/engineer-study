# LinuC101 問題 1.04 リポジトリとパッケージ管理

対象: LinuC レベル1 101試験 / 全19問 / すべてオリジナル問題
対応テキスト: `LinuC101_1.04_リポジトリとパッケージ管理.md`
解答・解説は末尾。

## 問題

### 1.04.1 apt コマンドによるパッケージ管理

**問1** `LinuC101-1.04-001` Ubuntu で、パッケージを入れる前に、リポジトリからパッケージの一覧を取り直すコマンドはどれか。

- A. `apt upgrade`
- B. `apt update`
- C. `apt install`
- D. `apt autoremove`

**問2** `LinuC101-1.04-002` apache2 を、設定ファイルも含めて消したい。正しいコマンドはどれか。

- A. `apt remove apache2`
- B. `apt autoremove apache2`
- C. `apt purge apache2`
- D. `apt clean apache2`

**問3** `LinuC101-1.04-003` `ifconfig` を使いたいが入っていない。どのパッケージに入っているかを、まだ入れていないパッケージも含めて探すコマンドはどれか。

- A. `dpkg -S ifconfig`
- B. `apt-cache depends ifconfig`
- C. `apt show ifconfig`
- D. `apt-file search ifconfig`

**問4** `LinuC101-1.04-004` Debian 系で、リポジトリの場所を書く設定ファイルはどれか。

- A. `/etc/apt/sources.list`
- B. `/etc/yum.repos.d/`
- C. `/etc/apt/apt.conf`
- D. `/var/lib/dpkg/status`

**問5** `LinuC101-1.04-005` パッケージの名前と説明から、キーワード `nginx` を含むものを探す apt-cache のコマンドを、サブコマンドまで答えよ(キーワードは不要)。

### 1.04.2 Debian パッケージ管理

**問6** `LinuC101-1.04-006` 手元のファイル `tool_1.2_amd64.deb` を dpkg で入れるコマンドはどれか。

- A. `dpkg -l tool_1.2_amd64.deb`
- B. `dpkg -i tool_1.2_amd64.deb`
- C. `dpkg -r tool_1.2_amd64.deb`
- D. `dpkg -L tool_1.2_amd64.deb`

**問7** `LinuC101-1.04-007` `/usr/bin/curl` を入れたパッケージを、dpkg で調べるコマンドはどれか。

- A. `dpkg -L /usr/bin/curl`
- B. `dpkg -s /usr/bin/curl`
- C. `dpkg -S /usr/bin/curl`
- D. `dpkg -c /usr/bin/curl`

**問8** `LinuC101-1.04-008` パッケージを入れたときに答えた設定(タイムゾーンなど)を、もう一度やり直すコマンドを答えよ(パッケージの名前は不要)。

### 1.04.3 yum コマンドによるパッケージ管理

**問9** `LinuC101-1.04-009` AlmaLinux で、入っているパッケージのうち更新できるものの一覧を、更新せずに表示するコマンドはどれか。

- A. `yum update`
- B. `yum check-update`
- C. `yum list installed`
- D. `yum upgrade`

**問10** `LinuC101-1.04-010` `/usr/sbin/semanage` を持つパッケージを、入れていないものも含めてリポジトリから探す yum のサブコマンドはどれか。

- A. `yum search`
- B. `yum info`
- C. `yum deplist`
- D. `yum provides`

**問11** `LinuC101-1.04-011` Red Hat 系で、リポジトリごとの設定ファイル(.repo)を置くディレクトリはどれか。

- A. `/etc/yum.repos.d/`
- B. `/etc/apt/sources.list.d/`
- C. `/var/cache/yum/`
- D. `/etc/rpm/`

**問12** `LinuC101-1.04-012` .repo のファイルで、`enabled=0` と書いたリポジトリを、1 回だけ使って nginx を入れたい。正しいものはどれか。

- A. `yum install nginx --disablerepo=myrepo`
- B. `yum --enablerepo=myrepo install nginx`
- C. `yum install myrepo/nginx`
- D. `yum repolist enable myrepo`

**問13** `LinuC101-1.04-013` 「Development Tools」のパッケージグループを、まとめて入れるコマンドはどれか。

- A. `yum install "Development Tools"`
- B. `yum grouplist "Development Tools"`
- C. `yum groupinstall "Development Tools"`
- D. `rpm -ivh "Development Tools"`

**問14** `LinuC101-1.04-014` パッケージを入れずに、nginx の .rpm のファイルだけをカレントディレクトリにダウンロードするコマンドを答えよ(パッケージの名前は不要)。

### 1.04.4 RPM パッケージ管理

**問15** `LinuC101-1.04-015` 入っているすべての RPM パッケージの一覧を表示するコマンドはどれか。

- A. `rpm -qa`
- B. `rpm -ql`
- C. `rpm -qi`
- D. `rpm -V`

**問16** `LinuC101-1.04-016` `/etc/ssh/sshd_config` を入れたパッケージを調べるコマンドはどれか。

- A. `rpm -ql /etc/ssh/sshd_config`
- B. `rpm -qc /etc/ssh/sshd_config`
- C. `rpm -qR /etc/ssh/sshd_config`
- D. `rpm -qf /etc/ssh/sshd_config`

**問17** `LinuC101-1.04-017` 手元の `app-2.0-1.el9.x86_64.rpm` で、入っている app を更新したい。入っていなければ新しく入れたい。正しいコマンドはどれか。

- A. `rpm -ivh app-2.0-1.el9.x86_64.rpm`
- B. `rpm -Fvh app-2.0-1.el9.x86_64.rpm`
- C. `rpm -Uvh app-2.0-1.el9.x86_64.rpm`
- D. `rpm -e app-2.0-1.el9.x86_64.rpm`

**問18** `LinuC101-1.04-018` パッケージのファイル名 `nginx-1.20.1-14.el9.x86_64.rpm` の `14.el9` が表すものはどれか。

- A. リリース(パッケージを作り直した回数と対象のディストリビューション)
- B. ソフトウェアの版
- C. アーキテクチャ
- D. パッケージの名前の一部

**問19** `LinuC101-1.04-019` rpm でパッケージを消すときのオプションを答えよ(パッケージの名前は不要)。

## 解答・解説

### 問1 `LinuC101-1.04-001`

**正解**: B

`apt update` は、リポジトリから、使えるパッケージとその版の一覧を取り直します。パッケージそのものは更新しません。

- A. `apt upgrade` は、入っているパッケージを新しい版にします。先に `update` で一覧を新しくしておきます。
- C. `apt install` はパッケージを入れます。
- D. `apt autoremove` は、もう要らない依存のパッケージを消します。

### 問2 `LinuC101-1.04-002`

**正解**: C

`apt purge` は、パッケージと設定ファイルの両方を消します。

- A. `remove` は設定ファイルを残します。もう一度入れたときに、前の設定が使われます。
- B. `autoremove` は、依存関係として入って、もう要らなくなったものを消すコマンドです。
- D. `apt clean` は、ダウンロードしたパッケージのキャッシュを消すもので、パッケージは消しません。

### 問3 `LinuC101-1.04-003`

**正解**: D

`apt-file search` は、リポジトリのすべてのパッケージの中のファイルの一覧から探します。まだ入れていないパッケージも対象です(先に `apt-file update` が要ります)。

- A. `dpkg -S` は、**入っている**パッケージの中から探すので、入っていないものは見つかりません。
- B. `apt-cache depends` は、パッケージの依存関係を表示するものです。
- C. `apt show` はパッケージの名前で情報を表示します。ifconfig という名前のパッケージはありません。

### 問4 `LinuC101-1.04-004`

**正解**: A

リポジトリの場所は `/etc/apt/sources.list` と、`/etc/apt/sources.list.d/` の下のファイルに書きます。

- B. Red Hat 系のリポジトリの設定の場所です。
- C. `apt.conf` は apt の動き(プロキシなど)の設定です。
- D. 入っているパッケージの状態を dpkg が記録するファイルです。

### 問5 `LinuC101-1.04-005`

**正解**: `apt-cache search`

`apt-cache search キーワード` で、名前と説明にキーワードを含むパッケージを探します。新しい書き方では `apt search` です。

### 問6 `LinuC101-1.04-006`

**正解**: B

`dpkg -i`(install)で、手元の .deb を入れます。依存関係は解決しないので、足りないときは `apt -f install` で補います。

- A. `-l` は、入っているパッケージの一覧です。
- C. `-r` は、パッケージの名前を指定して消すオプションです。
- D. `-L` は、入っているパッケージのファイルの一覧です。

### 問7 `LinuC101-1.04-007`

**正解**: C

`dpkg -S`(search)は、ファイルを入れたパッケージを探します。

- A. `-L` は、パッケージの名前を指定して、そのファイルの一覧を表示します。
- B. `-s` は、パッケージの名前を指定して、状態を表示します。
- D. `-c` は、.deb のファイルの中身の一覧を表示します。

### 問8 `LinuC101-1.04-008`

**正解**: `dpkg-reconfigure`

`dpkg-reconfigure パッケージ名` で、入れたときの設定の質問をもう一度行います。`dpkg-reconfigure tzdata` でタイムゾーン、`dpkg-reconfigure locales` でロケールを選び直せます。

### 問9 `LinuC101-1.04-009`

**正解**: B

`yum check-update` は、更新できるパッケージの一覧を表示するだけです。

- A. `yum update` は実際に更新します(確かめの質問は出ます)。
- C. 入っているパッケージの一覧で、更新できるかは分かりません。
- D. `yum upgrade` も実際に更新します。

### 問10 `LinuC101-1.04-010`

**正解**: D

`yum provides`(`whatprovides`)は、ファイルや機能を持つパッケージを探します。`*/semanage` のようにパスの一部でも探せます。

- A. `search` は、名前と説明のキーワードで探します。ファイルの名前では探しません。
- B. `info` は、パッケージの名前を指定して情報を表示します。
- C. `deplist` は依存関係を表示します。

### 問11 `LinuC101-1.04-011`

**正解**: A

`/etc/yum.repos.d/` の `.repo` のファイルに、`[ID]`、`baseurl`、`enabled`、`gpgcheck` などを書きます。全体の設定は `/etc/yum.conf`(dnf は `/etc/dnf/dnf.conf`)です。

- B. Debian 系のリポジトリの設定です。
- C. ダウンロードしたパッケージなどのキャッシュです。
- D. rpm のマクロなどの設定で、リポジトリは書きません。

### 問12 `LinuC101-1.04-012`

**正解**: B

`--enablerepo=ID` で、その実行の間だけリポジトリを有効にします。設定ファイルは変わりません。

- A. `--disablerepo` は、その実行の間だけ無効にするオプションです。
- C. この書き方でリポジトリは指定できません。
- D. `repolist` はリポジトリの一覧を表示するコマンドです。

### 問13 `LinuC101-1.04-013`

**正解**: C

`yum groupinstall`(`yum group install`)で、パッケージグループをまとめて入れます。一覧は `yum grouplist` です。dnf では `dnf install @"Development Tools"` とも書けます。

- A. 普通の `install` にグループの名前をそのまま書いても、パッケージとして探されます。
- B. `grouplist` は一覧を表示するだけです。
- D. rpm にはグループを扱う機能はありません。

### 問14 `LinuC101-1.04-014`

**正解**: `yumdownloader`、`dnf download`

`yumdownloader`(yum-utils に入っています)は、パッケージを入れずに .rpm のファイルだけを落とします。`--resolve` で依存するものも、`--source` でソースのパッケージも落とせます。dnf では `dnf download` です。

### 問15 `LinuC101-1.04-015`

**正解**: A

`rpm -qa`(query all)で、入っているすべてのパッケージを表示します。`rpm -qa | grep nginx` で絞ります。

- B. `-ql` は、指定したパッケージのファイルの一覧です。
- C. `-qi` は、指定したパッケージの情報です。
- D. `-V` は、入れたときから変わったファイルを確かめるオプションです。

### 問16 `LinuC101-1.04-016`

**正解**: D

`rpm -qf`(file)は、そのファイルを入れたパッケージを表示します。

- A. `-ql` は、パッケージの名前を指定して、そのファイルの一覧を表示します。
- B. `-qc` は、パッケージの名前を指定して、設定ファイルだけの一覧を表示します。
- C. `-qR` は、パッケージの依存関係です。

### 問17 `LinuC101-1.04-017`

**正解**: C

`-U`(upgrade)は、入っていれば更新し、入っていなければ入れます。

- A. `-i` は新しく入れる操作で、古い版が入っていると衝突します。
- B. `-F`(freshen)は、入っているものだけを更新し、入っていなければ何もしません。
- D. `-e` は消す操作で、パッケージの名前を指定します。

### 問18 `LinuC101-1.04-018`

**正解**: A

RPM のファイル名は「名前-版-リリース.アーキテクチャ.rpm」です。`14.el9` はリリースで、同じ版のソフトウェアを作り直した回数と、対象のディストリビューション(el9 は RHEL 9 の系統)を表します。

- B. 版は `1.20.1` です。
- C. アーキテクチャは `x86_64` です。
- D. 名前は `nginx` です。

### 問19 `LinuC101-1.04-019`

**正解**: `-e`、`--erase`

`rpm -e パッケージ名` で消します(erase)。ほかのパッケージがそれに依存していると、エラーになって消えません。依存関係もまとめて扱うなら `yum remove` を使います。
