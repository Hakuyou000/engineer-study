# LinuC 3SS テキスト 1.0 アクセスおよび権限制御の強化

対象: LinuC レベル3 3SS試験 Version 1.0

ファイルやプロセスに、通常の「所有者・グループ・その他」より細かく、あるいは root でも破れない形で、できることを制限する仕組みを学びます。ACL、SELinux、AppArmor、seccomp、Capabilities です。どれも「守る側の設定と、困ったときの確かめ方」が中心です。

この章の例は、Red Hat 系は AlmaLinux 9(RHEL 9 系)、Debian 系は Ubuntu 24.04 を前提にします。

## 1.1 Linux ACL によるアクセス制御 (重要度3)

### 1. ACL とは

通常のファイルの権限(`rwxr-xr--`)は、所有者、所有グループ、その他の 3 つにしか決められません。**ACL**(Access Control List)を使うと、「ユーザー alice にだけ読み書きを許す」「グループ dev に読み取りを許す」のように、個別の相手に権限を足せます。

- ACL の 1 行を **ACL エントリ**と呼びます。
- 通常の 3 つの権限も、ACL では「所有者」「所有グループ」「その他」のエントリとして入っています。
- ACL を使うファイルシステムは、ACL に対応している必要があります。ext4 と XFS は、既定で使えます。

| エントリの種類 | 書き方 | 意味 |
|---|---|---|
| 所有者 | `user::rw-` | ユーザー名が空。ファイルの所有者 |
| 名前付きユーザー | `user:alice:rw-` | ユーザー alice に与える権限 |
| 所有グループ | `group::r--` | ファイルの所有グループ |
| 名前付きグループ | `group:dev:r-x` | グループ dev に与える権限 |
| マスク | `mask::rwx` | 名前付きユーザー、名前付きグループ、所有グループが持てる権限の上限 |
| その他 | `other::---` | それ以外のすべて |

### 2. setfacl と getfacl

**setfacl** で ACL を設定し、**getfacl** で見ます。

```bash
# alice に読み書きを許す
setfacl -m u:alice:rw report.txt

# グループ dev に読み取りと実行を許す
setfacl -m g:dev:rx tools/

# alice のエントリを消す
setfacl -x u:alice report.txt

# ACL をすべて消す(通常の権限に戻る)
setfacl -b report.txt

# ディレクトリの下をまとめて設定する
setfacl -R -m g:dev:rX project/

# 内容を見る
getfacl report.txt
```

`getfacl` の出力の例です。

```text
# file: report.txt
# owner: bob
# group: staff
user::rw-
user:alice:rw-
group::r--
mask::rw-
other::r--
```

- ACL が付いたファイルは、`ls -l` の権限の最後に `+` が付きます(`-rw-rw-r--+`)。
- `-m` は追加と変更、`-x` は個別の削除、`-b` は全部の削除です。
- `-R` は下の階層にも適用します。`rX` の大文字の `X` は、ディレクトリと、すでに実行権限があるファイルにだけ実行権限を付けます。

### 3. マスク

**マスク**は、名前付きユーザー、名前付きグループ、所有グループの権限の**上限**です。実際に効く権限は、エントリの権限とマスクの両方で許されたものだけです(論理積)。

```text
user:alice:rwx    エントリで許した権限
mask::r--         マスクの上限
-----------------
実際に効く権限は r-- だけ
```

- `getfacl` は、マスクで削られた権限の横に `#effective:r--` と表示します。
- `setfacl -m` でエントリを足すと、マスクは自動で再計算されます。`setfacl -n` を付けると再計算しません。
- マスクを直接決めるには `setfacl -m m::rw file` のように書きます。
- 注意: ACL があるファイルで `chmod g=r file` を実行すると、グループの権限ではなく**マスク**が変わります。名前付きユーザーの権限が突然効かなくなる原因になります。

### 4. デフォルト ACL

ディレクトリには、**デフォルト ACL** を付けられます。そのディレクトリの中に**新しく作られる**ファイルとディレクトリが、この ACL を引き継ぎます。

```bash
# 以後ここに作るファイルは、グループ dev が読み書きできる
# (サブディレクトリにも入れるよう、X を使う。rw だけだと、サブディレクトリに入れない)
setfacl -d -m g:dev:rwX shared/
# 同じ意味の書き方
setfacl -m d:g:dev:rwX shared/

# デフォルト ACL だけを消す
setfacl -k shared/
```

- `getfacl` では `default:group:dev:rw-` のように表示されます。
- すでにあるファイルには効きません。必要なら `-R` で、中のファイルにも通常の ACL を付けます。
- デフォルト ACL があるディレクトリでは、新しく作るファイルの権限が、`umask` ではなくデフォルト ACL とプログラムが指定したモードで決まります。

### 5. NFSv4 と Samba の ACL

ファイルを共有すると、ACL の形が相手によって変わります。

| 共有の方法 | ACL の扱い |
|---|---|
| NFSv4 | **NFSv4 ACL** という、POSIX ACL とは別の形式(許可 `A` と拒否 `D` のエントリを並べる)を使います。Linux の NFS サーバーは POSIX ACL を NFSv4 ACL に変換して見せます。クライアントでは `nfs4_getfacl`、`nfs4_setfacl`(`nfs4-acl-tools` パッケージ)で扱います。【要確認】変換の細かい規則 |
| Samba | Windows の ACL を、Linux の POSIX ACL に対応させます。共有するディレクトリが ACL 対応のファイルシステムにある必要があります |

Samba の設定の例です。

```ini
[projects]
    path = /srv/projects
    read only = no
    vfs objects = acl_xattr
    map acl inherit = yes
    store dos attributes = yes
```

- `vfs objects = acl_xattr` は、Windows の ACL を拡張属性に保存して、Windows 側の見え方を保ちます。
- `smbcacls` で、コマンドから Samba 共有の ACL を見たり変えたりできます。
- Windows 側から付けた権限が効かないときは、Linux 側の ACL(`getfacl`)とマスクも確かめます。

### 6. 拡張属性

**拡張属性**(xattr)は、ファイルに付けられる「名前と値」の組です。ACL も SELinux のラベルも、拡張属性として保存されます。名前は `user.`、`trusted.`、`security.`、`system.` のどれかで始まります。

| 名前の先頭 | 用途の例 |
|---|---|
| `user.` | 利用者が自由に付けるメモ。ファイルの権限で守られる |
| `security.` | `security.selinux`(SELinux のラベル)、`security.capability`(ファイルの Capabilities) |
| `system.` | `system.posix_acl_access`(ACL) |
| `trusted.` | root だけが見られる |

**setfattr** で付け、**getfattr** で見ます。

```bash
setfattr -n user.project -v "alpha" report.txt
getfattr -n user.project report.txt
getfattr -d report.txt            # user. の属性をすべて表示
getfattr -d -m - report.txt       # すべての名前空間を表示(root)
setfattr -x user.project report.txt   # 削除
```

### 7. コピー、移動、バックアップで ACL を残す

ACL と拡張属性は、コマンドによっては**黙って落ちます**。バックアップや移行では、残す指定が要ります。

| コマンド | 残す指定 |
|---|---|
| `cp` | `cp -a`(アーカイブ。拡張属性も含めて残す)、または `cp --preserve=all` |
| `mv` | 同じファイルシステムの中の移動は、そのままです。別のファイルシステムへの移動は、コピーして消すので、移動先が対応していないと落ちます |
| `rsync` | `-a` だけでは残りません。ACL は `-A`、拡張属性は `-X` を足します(`rsync -aAX`) |
| `tar` | `--acls`、`--xattrs`(SELinux のラベルは `--selinux`)。取り出すときにも同じ指定をします。取り出すとき `--xattrs` が戻すのは、既定では `user.` の属性だけです。`security.capability` なども戻すには `--xattrs-include='*'` を足します |

```bash
rsync -aAX /srv/data/ backup:/srv/data/
tar --acls --xattrs --selinux -czf data.tar.gz /srv/data
tar --acls --xattrs --xattrs-include='*' --selinux -xzf data.tar.gz -C /restore
```

- 移行のあとに「権限が合わない」ときは、まず `getfacl` で ACL が残っているかを見ます。
- ACL の付いたファイルは、`ls -l` に `+` が出ます。

## 1.2 SELinux による強制アクセス制御 (重要度3)

### 1. 強制アクセス制御と SELinux

通常のファイルの権限は、持ち主が変えられます(**任意アクセス制御**、DAC)。**SELinux** は、**強制アクセス制御**(MAC)です。管理者が決めたルール(ポリシー)に従って、root で動くプロセスでも、ルールで許されていないことはできません。

アクセスは、**DAC と SELinux の両方**が許したときだけ通ります。

```text
[process]   プロセスがファイルを開く
    |
    v
[DAC]       権限(rwx)や ACL の確認
    |       拒否ならここで終わり
    v
[SELinux]   ポリシーの確認
    |       拒否なら AVC を記録して終わり
    v
[allowed]   許可
```

- Red Hat 系(AlmaLinux、RHEL)は SELinux が既定で有効です。Ubuntu は SELinux ではなく AppArmor が既定です(1.3 で学びます)。
- SELinux で拒否されても、`ls -l` の権限は正しく見えます。「権限は合っているのに Permission denied」になったら、SELinux を疑います。

### 2. セキュリティコンテキスト

すべてのプロセスとファイルに、**セキュリティコンテキスト**(ラベル)が付いています。

```text
system_u:object_r:httpd_sys_content_t:s0
   |         |           |            |
   |         |           |            +-- レベル(MLS 用)
   |         |           +-- タイプ(ここが最も大事)
   |         +-- ロール
   +-- ユーザー
```

- 通常は、**タイプ**だけを見ます。Web サーバーのプロセスは `httpd_t`、Web の公開用ファイルは `httpd_sys_content_t` です。
- 「`httpd_t` のプロセスは、`httpd_sys_content_t` のファイルを読める」のようなルールを、ポリシーが決めています(**タイプ強制**)。
- 表示は `-Z` オプションです。

```bash
ls -Z /var/www/html
ps -eZ | grep httpd
id -Z
```

### 3. モードとポリシーの種類

SELinux には 3 つの**モード**があります。

| モード | 動き |
|---|---|
| **enforcing** | ルールを強制する。違反は拒否して記録する |
| **permissive** | 拒否はせず、記録だけする。原因調べに使う |
| **disabled** | SELinux を使わない |

**ポリシーの種類**は `SELINUXTYPE` で決めます。

| 種類 | 意味 |
|---|---|
| **targeted** | 既定。ネットワークに出るデーモンなど、決まったプロセスだけを制限する。ほかは制限なし(`unconfined_t`) |
| **minimum** | targeted を小さくしたもの。選んだプロセスだけを制限する |
| **mls** | 機密のレベルで制限する(Multi-Level Security)。特別な用途 |

| コマンド | 動き |
|---|---|
| `getenforce` | 今のモードを 1 語で表示(`Enforcing`、`Permissive`、`Disabled`) |
| `setenforce 0` / `setenforce 1` | 今のモードを permissive / enforcing に変える(再起動で元に戻る) |
| `sestatus` | モード、設定ファイルのモード、ポリシーの種類などをまとめて表示 |

- `setenforce` で変えられるのは、enforcing と permissive の間だけです。disabled には、実行中には切り替えられません。
- 動作の確認は、`setenforce 0` で permissive にして、拒否が減るかを見ます。SELinux が原因と分かったら、元に戻して原因を直します(無効にして済ませない)。

### 4. 設定ファイルと、無効にする手順

起動時のモードとポリシーの種類は、`/etc/selinux/config` に書きます。

```ini
SELINUX=enforcing
SELINUXTYPE=targeted
```

- `SELINUX=` には `enforcing`、`permissive`、`disabled` を書きます。再起動で効きます。
- RHEL 9 系では、`SELINUX=disabled` と書いても、カーネルの中の SELinux は有効のまま、ポリシーを読み込まずに動きます。完全には無効になりません。SELinux を無効にするには、カーネルの起動の引数 `selinux=0` を **grubby** で付けて、再起動します。

```bash
# 無効にする(RHEL 9 系)
sudo grubby --update-kernel ALL --args selinux=0
sudo reboot

# また有効にする
sudo grubby --update-kernel ALL --remove-args selinux=0
sudo touch /.autorelabel      # 次の起動でラベルを付け直す
sudo reboot
```

- 無効のあいだに作ったファイルにはラベルがありません。有効に戻すときは、`/.autorelabel` を作って、起動時にラベルを付け直します。
- 付け直しには時間がかかります。

### 5. ファイルのラベルを直す

SELinux の拒否で、最も多い原因は、**ファイルのラベルが違う**ことです。

| コマンド | 動き |
|---|---|
| `restorecon -Rv /path` | ポリシーが決めている正しいラベルに戻す |
| `chcon -t type /path` | ラベルを**一時的に**変える。ラベルの付け直しで元に戻る |
| `semanage fcontext -a -t type "/path(/.*)?"` | 「この場所のファイルは、このラベル」という決まりを**恒久的に**足す |
| `semanage fcontext -l` | 決まりの一覧 |

Web の公開用ディレクトリを `/web` に作って、アクセスできるようにする手順です。

```bash
sudo semanage fcontext -a -t httpd_sys_content_t "/web(/.*)?"
sudo restorecon -Rv /web
ls -Zd /web
```

- `chcon` で付けたラベルは、`restorecon` やファイルシステムのラベルの付け直しで消えます。恒久的にするには `semanage fcontext` と `restorecon` を組み合わせます。
- 新しいファイルは、**置いた先のディレクトリのラベル**を引き継ぎます。`cp` は新しいファイルを作るのでラベルは置き先のものになり、`mv` は同じファイルを動かすので、**元のラベルのまま**です。`/home` で作ったファイルを `mv` で `/var/www/html` に置くと、ラベルが違って Apache が読めないことがあります。

ポートも、タイプで決まっています。決まった以外のポートで待ち受けるには、ポートのタイプを足します。

```bash
sudo semanage port -l | grep http_port_t
sudo semanage port -a -t http_port_t -p tcp 8181
```

この例の 8181 は、どの型にも割り当てられていないポートとします。ポリシーですでに別の型が割り当てられているポート(たとえば 8080)は、`-a` が失敗します。`-m` で変えます。先に `semanage port -l` で確かめます。

`seinfo` や `sesearch`(`setools-console` パッケージ)は、ポリシーの中身を調べます。

```bash
seinfo -t | grep httpd          # httpd に関するタイプの一覧
sesearch -A -s httpd_t -t httpd_sys_content_t   # 許可のルールを探す
```

【要確認】パッケージ名(`policycoreutils-python-utils`、`setools-console`)は、AlmaLinux 9 の時点の名前です。

### 6. ブール値

ポリシーには、**ブール値**(boolean)という、オンとオフで切り替えられるスイッチがあります。よくある設定の違いは、ルールを書かずに、ブール値で切り替えます。

```bash
getsebool -a | grep httpd
getsebool httpd_can_network_connect
sudo setsebool -P httpd_can_network_connect on
sudo semanage boolean -l | grep httpd_can_network_connect
```

- `setsebool` だけでは、再起動で元に戻ります。**`-P`** を付けると、恒久的になります。
- Web サーバーから外のサーバーに接続したいときは `httpd_can_network_connect`、ホームディレクトリを公開するときは `httpd_enable_homedirs` が、よく使われます。

### 7. 拒否のログと audit2allow

SELinux の拒否は、**AVC**(Access Vector Cache)の拒否として、`/var/log/audit/audit.log` に `type=AVC` の行で記録されます(auditd が動いているとき)。

```text
type=AVC msg=audit(1731000000.123:456): avc:  denied  { read } for  pid=1234 comm="httpd" name="index.html" dev="dm-0" ino=5678 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
```

読み方です。

| 項目 | 意味 |
|---|---|
| `denied { read }` | read が拒否された |
| `comm="httpd"` | 動いていたコマンド |
| `scontext=…httpd_t…` | 操作したプロセスのタイプ(source) |
| `tcontext=…user_home_t…` | 操作されたファイルのタイプ(target) |
| `tclass=file` | 対象の種類 |
| `permissive=0` | enforcing だったので、本当に拒否された(`1` なら、記録だけ) |

この例は、`httpd_t` が `user_home_t` を読もうとして拒否されています。原因は、ファイルのラベルです。`restorecon` で直します。

```bash
sudo ausearch -m AVC -ts recent
sudo ausearch -m AVC -ts recent | audit2allow -w   # 理由を説明する
sudo ausearch -m AVC -ts recent | audit2allow -M mypol
sudo semodule -i mypol.pp                          # 作ったモジュールを入れる
```

- **audit2allow** は、拒否のログから、許可のルールを作ります。
- ただし、audit2allow の結果を、そのまま入れるのは最後の手段です。ラベルの誤りやブール値で直せることが、ほとんどだからです。許しすぎのルールが入らないよう、中身を読みます。
- ポリシーのルールには、`allow`(許可)、`auditallow`(許可するが、成功も記録する)、`dontaudit`(拒否しても記録しない)があります。拒否の記録がないのに失敗するときは、`dontaudit` のルールが記録を隠していることがあります(`semodule -DB` で隠すルールを一時的に外せます。見終わったら `semodule -B` で戻します)。

## 1.3 AppArmor による強制アクセス制御 (重要度3)

### 1. AppArmor とは

**AppArmor** も、強制アクセス制御です。SELinux はファイルの**ラベル**でルールを書きますが、AppArmor は、プログラムごとの**プロファイル**に、**パスで**「このプログラムは、このファイルを読める」と書きます。

| | SELinux | AppArmor |
|---|---|---|
| ルールの基準 | ファイルのラベル(拡張属性) | ファイルのパス |
| 既定で使う OS | Red Hat 系 | Ubuntu、Debian(10 以降)。SUSE 系は従来 AppArmor だったが、新しい openSUSE Tumbleweed や SLES 16 は SELinux が既定【要確認】 |
| 難しさ | ラベルとポリシーの理解が要る | プロファイルが読みやすい |

- Ubuntu 24.04 では、AppArmor が既定で有効です。
- RHEL 系には AppArmor は入っていません。

### 2. プロファイルとモード

プロファイルは `/etc/apparmor.d/` に置きます。ファイル名は、プログラムのパスの `/` を `.` にしたものです(`/usr/sbin/cupsd` なら `usr.sbin.cupsd`)。

```text
/usr/sbin/myapp {
  #include <abstractions/base>

  /etc/myapp/** r,
  /var/log/myapp.log w,
  /var/lib/myapp/** rw,
  network inet tcp,
}
```

- パスの後ろの文字が権限です。`r` 読み、`w` 書き、`a` 追記、`m` メモリに載せる、`k` ロック、`l` リンクです。実行は、実行のしかたを付けて書きます。`ix`(同じプロファイルのまま実行)、`px`(そのプログラムのプロファイルで実行)、`cx`(子のプロファイルで実行)、`ux`(制限なしで実行)です。許可の規則に `x` だけは書けません。
- `**` は、下の階層すべてを表します。
- 書かれていないことは、拒否されます。

プロファイルには、**モード**があります。

| モード | 動き |
|---|---|
| **enforce** | ルールを強制する。違反は拒否して記録する |
| **complain** | 拒否せず、違反を記録だけする。プロファイルを作る、直すときに使う |
| unconfined / disable | プロファイルで縛らない |

### 3. 状態の確認とモードの切り替え

`aa-status` と `apparmor_parser` は `apparmor` パッケージ(Ubuntu では既定で入っています)のコマンドです。`aa-complain`、`aa-enforce`、`aa-disable` などは `apparmor-utils` パッケージ(`sudo apt install apparmor-utils`)のコマンドです。

| コマンド | 動き |
|---|---|
| `aa-status`(`apparmor_status`) | 読み込まれているプロファイルと、モード別の数を表示 |
| `aa-complain /etc/apparmor.d/usr.sbin.myapp` | complain モードにする |
| `aa-enforce /etc/apparmor.d/usr.sbin.myapp` | enforce モードにする |
| `aa-disable /etc/apparmor.d/usr.sbin.myapp` | プロファイルを無効にする |
| `apparmor_parser -r /etc/apparmor.d/usr.sbin.myapp` | プロファイルを読み込み直す(置き換える) |
| `apparmor_parser -a file` / `-R file` | 読み込む / 外す |

```bash
sudo aa-status
sudo aa-complain /usr/sbin/myapp
sudo aa-enforce /usr/sbin/myapp
sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.myapp
```

- プロファイルのファイルを書き換えたら、**読み込み直す**までは、古い内容のままです。`apparmor_parser -r` か `systemctl reload apparmor` を使います。
- `apparmor_parser` は、プロファイルの文法の検査にも使います。

### 4. プロファイルを作って育てる

新しいプログラムのプロファイルは、**complain モードで動かして、記録から作る**のが定番です。

```text
[1] aa-genprof     を実行する
    |
    v
[2] 別の端末でプログラムを普通に使う
    |
    v
[3] aa-genprof     に戻って S(スキャン)を押す
    |              記録を読み、許す / 拒否の質問に答える
    v
[4] F              で終了。プロファイルを保存し、enforce にする
```

- **aa-genprof** は、プロファイルの下書きを作り、動かしながら質問に答えて仕上げます。
- あとから足りない許可が見つかったら、**aa-logprof** を使います。complain や enforce で記録された違反を読んで、プロファイルへの追加を質問してきます。

```bash
sudo aa-genprof /usr/sbin/myapp
sudo aa-logprof
```

### 5. 拒否のログ

AppArmor の拒否は、`apparmor="DENIED"` を含む行として、カーネルのログに出ます。auditd が動いていれば `/var/log/audit/audit.log` に、動いていなければ `journalctl -k` や `/var/log/kern.log` に出ます。

```text
audit: type=1400 audit(1731000000.123:45): apparmor="DENIED" operation="open" profile="/usr/sbin/myapp" name="/srv/data/a.txt" pid=2345 comm="myapp" requested_mask="r" denied_mask="r" fsuid=0 ouid=0
```

- `profile=` は、どのプロファイルか。`name=` は、対象のパス。`denied_mask` は、拒否された権限です。
- complain モードでは、同じ記録が `apparmor="ALLOWED"` になります。
- 直し方は、`aa-logprof` で追加するか、プロファイルに `/srv/data/** r,` のような行を足して `apparmor_parser -r` で読み込み直します。

## 1.4 システムコールの制御 (重要度3)

### 1. システムコールと seccomp

**システムコール**は、プログラムが、カーネルに仕事を頼むための入口です(`open`、`read`、`write`、`mount`、`reboot` など)。Linux には、300 以上あります。

プログラムに必要なシステムコールは、ごく一部です。使わないものを禁止しておけば、プログラムの欠陥が悪用されても、カーネルを操作できる範囲が狭くなります。この制限をするのが **seccomp**(secure computing mode)です。

### 2. seccomp のモード

プロセスは、次のどれかのモードで動きます。

| モード | 意味 |
|---|---|
| `SECCOMP_MODE_DISABLED` | 制限なし(0) |
| `SECCOMP_MODE_STRICT` | `read`、`write`、`_exit`、`sigreturn` の 4 つだけ許す(1)。それ以外を呼ぶと、プロセスが強制終了される |
| `SECCOMP_MODE_FILTER` | **BPF プログラム**で書いたフィルタが、システムコールごとに許可、拒否、強制終了などを決める(2) |

- 実際に使われるのは、ほとんど `SECCOMP_MODE_FILTER` です。
- フィルタは、呼ばれたシステムコールの番号、アーキテクチャ、引数を見て判定します。使う言語は、**BPF**(Berkeley Packet Filter)のうち、昔からある「クラシック BPF」の形式です。
- フィルタが返す結果には、許可(ALLOW)、強制終了(KILL)、エラー番号を返す(ERRNO)、記録だけ(LOG)などがあります。
- 一度付けたフィルタは、外せません。プロセスを増やしても引き継がれます。

```bash
grep -i seccomp /proc/self/status
# Seccomp:          0     ← 0 は DISABLED、1 は STRICT、2 は FILTER
# Seccomp_filters:  0
```

Docker は、既定で seccomp のフィルタを使います(危険なシステムコールを禁止)。Kubernetes は、既定ではフィルタを付けません(`Unconfined`)。Pod の `securityContext.seccompProfile.type: RuntimeDefault` か、kubelet の `seccompDefault: true` で付けます。

### 3. systemd のサービスで使う

systemd のサービスには、設定ファイルだけでフィルタを付けられます。

```ini
[Service]
SystemCallFilter=@system-service
SystemCallFilter=~@privileged @resources
SystemCallErrorNumber=EPERM
SystemCallArchitectures=native
```

| 設定 | 意味 |
|---|---|
| `SystemCallFilter=` | 許可するシステムコールを書く。`@` で始まる名前は**グループ**(`@system-service` は、一般的なサービスが使うもの)。`~` を付けると、**禁止する**リストになる |
| `SystemCallErrorNumber=` | 禁止したシステムコールが呼ばれたときの動き。書かないと、プロセスが `SIGSYS` で強制終了される。`EPERM` と書くと、エラー(権限がない)を返して、プロセスは続く |
| `SystemCallArchitectures=` | 使ってよいアーキテクチャ。`native` は、そのマシンの本来のものだけ |

- `SystemCallArchitectures=native` を付けるのは、64 ビットの環境で、32 ビット用のシステムコールの番号を使って、フィルタをすり抜けられないようにするためです。
- 許可のリストを作るときは、まず `strace -c -f コマンド` で、プログラムが使うシステムコールを調べます。
- `systemd-analyze syscall-filter` で、グループの中身を見られます。`systemd-analyze security サービス名` で、サービスの守りの点数を見られます。
- 禁止して強制終了されたときは、`systemctl status` に `status=31/SYS`(`SIGSYS`)が出ます。監査ログには `type=SECCOMP` の行が出ます。

```text
SystemCallErrorNumber を書かない
   禁止したシステムコール --> プロセスが SIGSYS で強制終了

SystemCallErrorNumber=EPERM
   禁止したシステムコール --> EPERM を返す。プロセスは続く
```

### 4. フィルタの中身を読む: seccomp-tools

**seccomp-tools** は、プログラムに付いている seccomp のフィルタを読み出して、人が読める形に直す道具です(Ruby の gem です)。自分たちが付けたフィルタが、意図どおりかを確かめるときに使います。

```bash
seccomp-tools dump ./myapp        # 付いているフィルタを逆アセンブルして表示
seccomp-tools disasm filter.bpf   # BPF のファイルを読む
```

- 表示は、「アーキテクチャを確かめる」「システムコールの番号で分岐する」「ALLOW か KILL を返す」という流れです。

## 1.5 Linux Capabilities による権限制御 (重要度3)

### 1. Capabilities とは

昔の UNIX では、root(UID 0)は何でもでき、root でなければ何もできませんでした。そこで Linux は、root の権限を細かく分けました。この 1 つ 1 つが **Capability**(ケーパビリティ)です。プログラムには、必要な Capability だけを与えます(最小権限の原則)。

主な Capability です。

| Capability | できること |
|---|---|
| `CAP_NET_BIND_SERVICE` | 1024 未満のポートで待ち受ける |
| `CAP_NET_RAW` | RAW ソケット、パケットのソケットを使う(`ping`、`tcpdump`) |
| `CAP_NET_ADMIN` | ネットワークの設定(インターフェース、経路、ファイアウォール) |
| `CAP_DAC_OVERRIDE` | ファイルの読み書きと実行の権限の確認を、すべて無視する |
| `CAP_SYS_TIME` | システムの時刻を変える |
| `CAP_SYS_BOOT` | 再起動する、`kexec` で別のカーネルを起動する |
| `CAP_SYS_MODULE` | カーネルモジュールを入れる、外す |
| `CAP_SYS_NICE` | 優先度を上げる、スケジューリングの方法を変える |
| `CAP_SYS_ADMIN` | マウントなど、ほかに分類しにくい管理の操作の、非常に広い集まり |

- `CAP_SYS_ADMIN` は、できることが多すぎて「新しい root」と呼ばれます。コンテナや systemd のサービスに、与えないようにします。
- `CAP_DAC_OVERRIDE` を持つプロセスは、ファイルの権限を気にせず読み書きできます(SELinux の制限は別に効きます)。読み取りだけなら、より狭い `CAP_DAC_READ_SEARCH` があります。
- 一覧は `man 7 capabilities` にあります。

### 2. ケーパビリティセット

プロセスは、Capability を、次のセットに分けて持ちます。

| セット | 意味 |
|---|---|
| **Permitted** | プロセスが**使ってよい**上限 |
| **Effective** | **今、効いている**もの。カーネルが権限の確認で見るのは、これ |
| **Inheritable** | `exec` したあとに、引き継げる候補 |
| Bounding | 持てる上限。ここにないものは、どうやっても得られない |
| Ambient | 一般のユーザーで動くプログラムでも、`exec` のあとに引き継がれる |

`/proc/<PID>/status` には、16 進数で出ます(`CapInh`、`CapPrm`、`CapEff`、`CapBnd`、`CapAmb`)。

```bash
grep Cap /proc/$$/status
capsh --decode=0000000000000400    # 16 進数を名前にする(cap_net_bind_service)
capsh --print                       # 今のシェルの Capability を表示
getpcaps $$
```

### 3. ファイルに付ける: setcap と getcap

実行ファイルに Capability を付けると、一般のユーザーが実行しても、その Capability が使えます。setuid root より、与える権限が小さくて済みます。

```bash
# 1024 未満のポートで待ち受けられるようにする
sudo setcap cap_net_bind_service=+ep /usr/local/bin/myserver

# 付いているものを見る
getcap /usr/local/bin/myserver
getcap -r /usr/local/bin 2>/dev/null     # 下の階層を探す

# 外す
sudo setcap -r /usr/local/bin/myserver
```

- `+ep` の `e` は Effective、`p` は Permitted です。`e` がないと、プログラム自身が有効にする処理を持っていなければ効きません。
- Capability は、ファイルの拡張属性(`security.capability`)に保存されます。コピーや移動で落とさないよう、1.1 の `cp -a`、`tar --xattrs`(取り出すときは `--xattrs-include='*'` も)、`rsync -X` を使います。
- シェルスクリプトに付けても効きません。実行するのはインタープリタで、スクリプトのファイルの Capability は使われないためです。
- 付いているファイルは、定期的に `getcap -r /` で棚卸しします。意図しないものがあれば、攻撃の足がかりになります。

### 4. systemd のサービスで使う

```ini
[Service]
User=webapp
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
NoNewPrivileges=yes
ExecStart=/usr/local/bin/myserver --port 80
```

| 設定 | 意味 |
|---|---|
| `CapabilityBoundingSet=` | サービスが持てる Capability の**上限**。書いたもの以外は外される。空にすると、すべて外す。`~` を付けると、書いたものだけを外す |
| `AmbientCapabilities=` | root 以外で動くサービスに、渡す Capability |
| `NoNewPrivileges=yes` | これ以後、`setuid` やファイルの Capability で、新しい権限を得られないようにする |

```text
[start]   root で動き、すべての Capability を持つ
    |
    |  User= で一般のユーザーに替える
    |  CapabilityBoundingSet= で上限を決める
    |  AmbientCapabilities= で必要な分だけ渡す
    v
[running] 一般のユーザーで動き、CAP_NET_BIND_SERVICE だけ持つ
```

- 「ポート 80 で待ち受けたいが、root では動かしたくない」の、定番の答えです。
- `NoNewPrivileges=yes` を付けると、`setcap` で付けたファイルの Capability を使う方法は、効かなくなります。サービスの設計で、どちらの方法を使うか決めます。
- Docker でも同じ考え方です。`--cap-drop ALL --cap-add NET_BIND_SERVICE` のように、すべて外して、必要なものを足します。

### 5. Capability の不足を調べる

プログラムが `Operation not permitted`(EPERM)で失敗したら、足りない Capability を探します。

- `strace` で、失敗したシステムコールを見る(例: `bind(...) = -1 EPERM`)。
- そのシステムコールに必要な Capability を、`man 7 capabilities` で調べる。
- 必要な Capability を `AmbientCapabilities=` などで足し、`capsh --decode` や `/proc/<PID>/status` で、足りたかを確認する。
- `CAP_SYS_ADMIN` や `--privileged` で済ませない。
