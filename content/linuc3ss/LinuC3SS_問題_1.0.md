# LinuC3SS 問題 1.0 アクセスおよび権限制御の強化

対象: LinuC レベル3 3SS試験 Version 1.0 / 全55問 / すべてオリジナル問題
対応テキスト: `LinuC3SS_1.0_アクセスおよび権限制御の強化.md`
解答・解説は末尾。

## 問題

### 1.1 Linux ACL によるアクセス制御

**問1** `LinuC3SS-1.0-001` ユーザー alice に、ファイル `report.txt` の読み書きを許す ACL を足すコマンドはどれか。

- A. `setfacl -x u:alice:rw report.txt`
- B. `setfacl -b u:alice report.txt`
- C. `chmod u+alice report.txt`
- D. `setfacl -m u:alice:rw report.txt`

**問2** `LinuC3SS-1.0-002` あるファイルを `ls -l` で見ると、権限の最後に `+` が付いて `-rw-rw-r--+` と表示された。この `+` の意味はどれか。

- A. スティッキービットが設定されている
- B. ACL エントリが設定されている
- C. ハードリンクが複数ある
- D. ファイルが暗号化されている

**問3** `LinuC3SS-1.0-003` `getfacl` の出力が次のとおりで、alice が `report.txt` に書き込めない。原因はどれか。

```
# file: report.txt
# owner: bob
# group: staff
user::rw-
user:alice:rwx        #effective:r--
group::r--
mask::r--
other::r--
```

- A. マスクが `r--` で、alice に効く権限の上限が読み取りだけになっている
- B. alice のエントリが、読み取りだけで書かれている
- C. `other` が `r--` なので、名前付きユーザーも読み取りだけになる
- D. デフォルト ACL が付いていない

**問4** `LinuC3SS-1.0-004` ディレクトリ `/srv/share` に、これから作るファイルをグループ dev が読み書きできるようにしたい。既にあるファイルは対象にしない。正しいコマンドはどれか。

- A. `setfacl -m g:dev:rw /srv/share`
- B. `setfacl -x g:dev /srv/share`
- C. `setfacl -d -m g:dev:rw /srv/share`
- D. `setfacl -b /srv/share`

**問5** `LinuC3SS-1.0-005` ファイル `report.txt` の ACL をすべて消して、通常の権限だけに戻す `setfacl` のオプションを答えよ(ファイル名は不要)。

**問6** `LinuC3SS-1.0-006` サーバー移行で、ACL と拡張属性を残したまま `/srv/data/` を別のサーバーへ `rsync` でコピーしたい。正しいコマンドはどれか。

- A. `rsync -a /srv/data/ backup:/srv/data/`
- B. `rsync -aAX /srv/data/ backup:/srv/data/`
- C. `rsync -avz /srv/data/ backup:/srv/data/`
- D. `rsync -aH /srv/data/ backup:/srv/data/`

**問7** `LinuC3SS-1.0-007` GNU tar で、ACL、拡張属性、SELinux のラベルを含めてバックアップし、あとで復元したい。正しいものを**2つ**選べ。

- A. アーカイブを作るときに、`--acls --xattrs --selinux` を付ける
- B. 取り出すときは、何も付けなくても ACL が復元される
- C. 取り出すときにも、`--acls --xattrs --selinux` を付ける
- D. `-z` を付けると、ACL もアーカイブに含まれる

**問8** `LinuC3SS-1.0-008` Windows のクライアントから Samba の共有に付けた ACL を、Windows の形のまま保存したい。`smb.conf` の共有の設定に書くものはどれか。

- A. `vfs objects = recycle`
- B. `read only = no`
- C. `vfs objects = acl_xattr`
- D. `map to guest = bad user`

**問9** `LinuC3SS-1.0-009` NFSv4 でマウントしているクライアントで、マウントしたディレクトリの ACL を NFSv4 ACL の形で見るコマンドはどれか。

- A. `showmount -e`
- B. `exportfs -v`
- C. `nfsstat -m`
- D. `nfs4_getfacl`

**問10** `LinuC3SS-1.0-010` ファイル `report.txt` に、ユーザーの拡張属性 `user.team` を値 `sre` で付けるコマンドはどれか。

- A. `setfattr -n user.team -v sre report.txt`
- B. `getfattr -n user.team -v sre report.txt`
- C. `setfacl -m user.team=sre report.txt`
- D. `chattr +i report.txt`

**問11** `LinuC3SS-1.0-011` ディレクトリ `/data` を、ACL と拡張属性を含めて、別の場所に丸ごとコピーするコマンドはどれか。

- A. `cp -r /data /backup/`
- B. `cp -a /data /backup/`
- C. `cp -rf /data /backup/`
- D. `cp -l /data /backup/`

### 1.2 SELinux による強制アクセス制御

**問12** `LinuC3SS-1.0-012` AlmaLinux 9 で、Web アプリの動作が不調だが、SELinux が原因かを確かめたい。一時的に、拒否はせず記録だけするモードにするコマンドはどれか。

- A. `setenforce 0`
- B. `setenforce 1`
- C. `getenforce 0`
- D. `sestatus 0`

**問13** `LinuC3SS-1.0-013` AlmaLinux 9 で、SELinux を再起動後も完全に無効にしたい。RHEL 9 系の手順として正しいものはどれか。

- A. `setenforce 0` を実行する
- B. `/etc/selinux/config` の `SELINUX=` を `disabled` に書き換えるだけにする
- C. `grubby --update-kernel ALL --remove-args selinux=0` を実行する
- D. `grubby --update-kernel ALL --args selinux=0` を実行して再起動する

**問14** `LinuC3SS-1.0-014` `setenforce 0` を実行した直後の `sestatus` の出力は次のとおりだった。このサーバーを再起動すると、SELinux のモードはどうなるか。

```
SELinux status:                 enabled
Current mode:                   permissive
Mode from config file:          enforcing
Loaded policy name:             targeted
```

- A. permissive のままになる
- B. disabled になる
- C. enforcing になる
- D. 起動に失敗する

**問15** `LinuC3SS-1.0-015` Apache(`httpd`)が、`/var/www/html/index.html` を読めず、403 になる。`chmod` と所有者は正しい。`ls -Z` の出力は次のとおりだった。直し方として正しいものはどれか。

```
unconfined_u:object_r:user_home_t:s0 /var/www/html/index.html
```

- A. `chmod -R 777 /var/www/html`
- B. `setsebool -P httpd_enable_homedirs off`
- C. `semanage port -a -t http_port_t -p tcp 80`
- D. `restorecon -Rv /var/www/html`

**問16** `LinuC3SS-1.0-016` `/web` 以下のファイルに `httpd_sys_content_t` のラベルを付け、`restorecon` を実行してもこのラベルが維持されるように、決まりを足したい。まず実行するコマンドはどれか。

- A. `chcon -R -t httpd_sys_content_t /web`
- B. `restorecon -Rv /web`
- C. `semanage fcontext -a -t httpd_sys_content_t "/web(/.*)?"`
- D. `setsebool -P httpd_sys_content_t on`

**問17** `LinuC3SS-1.0-017` Apache を、ポート 8181 で待ち受けるように設定して起動したところ、失敗した。このポートは、どの型にも割り当てられていない。`audit.log` には、`httpd_t` がポート 8181 へ `name_bind` することを拒否した AVC が出ている。恒久的な直し方として正しいものはどれか。

- A. `semanage port -a -t http_port_t -p tcp 8181`
- B. `setenforce 0` を、`/etc/selinux/config` の `SELINUX=permissive` で恒久化する
- C. `restorecon -Rv /etc/httpd`
- D. `setsebool -P httpd_can_network_connect on`

**問18** `LinuC3SS-1.0-018` Web アプリが、外部の DB サーバーに接続しようとして拒否される。`audit.log` には `denied { name_connect }` が出ている。再起動後も使える設定として、正しいコマンドはどれか。

- A. `setsebool httpd_can_network_connect_db on`
- B. `setsebool -P httpd_can_network_connect_db on`
- C. `getsebool -P httpd_can_network_connect_db on`
- D. `semanage fcontext -a -t httpd_sys_content_t "/var/www(/.*)?"`

**問19** `LinuC3SS-1.0-019` `/var/log/audit/audit.log` に、次の行が出ていた。意味として正しいものはどれか。

```
type=AVC msg=audit(1731000000.123:456): avc:  denied  { write } for  pid=900 comm="nginx" name="cache" dev="dm-0" ino=7000 scontext=system_u:system_r:httpd_t:s0 tcontext=system_u:object_r:var_t:s0 tclass=dir permissive=0
```

- A. `var_t` のプロセスが、`httpd_t` のディレクトリへの書き込みを拒否された
- B. 書き込みは許されたが、記録だけされた
- C. `httpd_t` のプロセス(nginx)が、`var_t` のディレクトリへの書き込みを拒否された
- D. 読み取りが拒否された

**問20** `LinuC3SS-1.0-020` SELinux の拒否が出て、`audit2allow` で作ったポリシーモジュールを入れようとしている。入れる前にすることとして、最も適切なものはどれか。

- A. ファイルのラベルの誤りや、ブール値で直せないかを確かめ、モジュールの中身を読む
- B. 何も確かめず、すぐ入れる
- C. SELinux を disabled にしてから入れる
- D. `setenforce 1` を `0` に変えたままにする

**問21** `LinuC3SS-1.0-021` 拒否のログから、ポリシーモジュールのファイル(例: `mypol.pp`)を作る `audit2allow` のオプションを答えよ(ファイル名は不要)。

**問22** `LinuC3SS-1.0-022` SELinux のポリシーのルールについて、正しいものを**2つ**選べ。

- A. `allow` は、アクセスを拒否するルールである
- B. `auditallow` は、アクセスを許可し、許可した記録も残す
- C. `dontaudit` は、そのアクセスを許可する
- D. `dontaudit` は、拒否した記録を残さない

**問23** `LinuC3SS-1.0-023` `seinfo -t` は、何を表示するか。

- A. ファイルのセキュリティコンテキスト
- B. ポリシーにあるタイプの一覧
- C. ブール値の一覧と今の値
- D. ポートとタイプの対応

**問24** `LinuC3SS-1.0-024` `/etc/selinux/config` の `SELINUXTYPE=` に指定できる `mls` の説明として、正しいものはどれか。

- A. 既定のポリシーで、決まったデーモンだけを制限する
- B. 少数のプロセスだけを制限する、小さいポリシー
- C. SELinux を使わないことを示す
- D. 機密のレベルによって、情報の流れを制限する(特別な用途のポリシー)

### 1.3 AppArmor による強制アクセス制御

**問25** `LinuC3SS-1.0-025` Ubuntu 24.04 で、読み込まれている AppArmor のプロファイルと、それぞれのモードを確かめるコマンドはどれか。

- A. `getenforce`
- B. `sestatus`
- C. `aa-status`
- D. `aa-genprof`

**問26** `LinuC3SS-1.0-026` AppArmor で、`/usr/sbin/myapp` のプロファイルのファイルが置かれる場所と名前はどれか。

- A. `/etc/selinux/targeted/myapp.te`
- B. `/etc/apparmor/myapp.conf`
- C. `/usr/sbin/myapp.profile`
- D. `/etc/apparmor.d/usr.sbin.myapp`

**問27** `LinuC3SS-1.0-027` 新しく作ったプロファイルが厳しすぎるかもしれない。`/usr/sbin/myapp` を、拒否はせず違反を記録するだけにしたい。正しいコマンドはどれか。

- A. `aa-complain /usr/sbin/myapp`
- B. `aa-enforce /usr/sbin/myapp`
- C. `aa-disable /usr/sbin/myapp`
- D. `apparmor_parser -R /etc/apparmor.d/usr.sbin.myapp`

**問28** `LinuC3SS-1.0-028` `/etc/apparmor.d/usr.sbin.myapp` を編集して、`/srv/data/** r,` の行を足した。この内容をカーネルに反映するコマンドはどれか。

- A. `systemctl restart myapp`
- B. `apparmor_parser -r /etc/apparmor.d/usr.sbin.myapp`
- C. `aa-logprof`
- D. `aa-status`

**問29** `LinuC3SS-1.0-029` 次のログの行を見て、正しい説明を選べ。

```
audit: type=1400 audit(1731000000.123:45): apparmor="DENIED" operation="open" profile="/usr/sbin/myapp" name="/srv/data/a.txt" pid=2345 comm="myapp" requested_mask="r" denied_mask="r" fsuid=0 ouid=0
```

- A. 書き込みが拒否された
- B. complain モードのため、許可されて記録だけされた
- C. `/srv/data/a.txt` のプロファイルが読み込めなかった
- D. `/usr/sbin/myapp` のプロファイルのために、`/srv/data/a.txt` の読み取りが拒否された

**問30** `LinuC3SS-1.0-030` 新しいプログラムのプロファイルを、`aa-genprof` で作るときの流れとして正しいものはどれか。

- A. プログラムを別の端末で普通に動かし、記録された動作をもとに、許可の質問に答えてプロファイルを作る
- B. すべてのプロファイルを enforce にしてから、プログラムを動かす
- C. プログラムのソースコードを読み、システムコールの一覧を作る
- D. SELinux のポリシーを AppArmor の形に変換する

**問31** `LinuC3SS-1.0-031` complain モードで動かして記録された違反のログを読み、プロファイルに足す許可を対話で質問して、プロファイルを更新する AppArmor のコマンド名を答えよ。

**問32** `LinuC3SS-1.0-032` complain モードにしてあるプロファイル `/etc/apparmor.d/usr.sbin.myapp` を、拒否を強制する enforce モードに戻すコマンド名を答えよ(引数は不要)。

**問33** `LinuC3SS-1.0-033` SELinux と AppArmor の違いとして、正しいものはどれか。

- A. AppArmor は、ファイルの拡張属性に書いたラベルでルールを決める
- B. AppArmor は、AlmaLinux 9 で既定で有効になっている
- C. AppArmor は、プロファイルの中でファイルのパスを使ってルールを書く
- D. AppArmor は、root で動くプロセスを制限できない

### 1.4 システムコールの制御

**問34** `LinuC3SS-1.0-034` `SECCOMP_MODE_STRICT` のプロセスについて、正しいものはどれか。

- A. `open` と `close` を含め、ファイルの操作は一通り呼べる
- B. `read`、`write`、`_exit`、`sigreturn` だけを呼べる。ほかのシステムコールを呼ぶと強制終了される
- C. すべてのシステムコールが許可され、記録だけされる
- D. BPF プログラムで、許可するシステムコールを選べる

**問35** `LinuC3SS-1.0-035` `SECCOMP_MODE_FILTER` で、どのシステムコールを許可するかを書くのに使うものはどれか。

- A. SELinux のポリシーモジュール
- B. AppArmor のプロファイル
- C. `/etc/sudoers` の設定
- D. BPF プログラム

**問36** `LinuC3SS-1.0-036` あるプロセスの `/proc/<PID>/status` に `Seccomp: 2` と表示された。このプロセスの seccomp のモードはどれか。

- A. `SECCOMP_MODE_FILTER`
- B. `SECCOMP_MODE_DISABLED`
- C. `SECCOMP_MODE_STRICT`
- D. seccomp に対応していない

**問37** `LinuC3SS-1.0-037` systemd のサービスで、`SystemCallFilter=` で禁止したシステムコールが呼ばれたとき、プロセスを強制終了せず、エラー `EPERM` を返して続けさせたい。書く設定はどれか。

- A. `SystemCallFilter=EPERM`
- B. `SystemCallErrorNumber=EPERM`
- C. `SystemCallArchitectures=EPERM`
- D. `RestrictSUIDSGID=EPERM`

**問38** `LinuC3SS-1.0-038` systemd のサービスに次の設定を書いた。意味として正しいものはどれか。

```
SystemCallFilter=~@mount
```

- A. `@mount` のグループのシステムコールだけを許し、それ以外を禁止する
- B. `@mount` のグループのシステムコールを、記録だけして許す
- C. `@mount` のグループのシステムコールを禁止し、それ以外は許す
- D. `~` の部分はホームディレクトリを表し、`@mount` の下だけに適用される

**問39** `LinuC3SS-1.0-039` systemd のサービスに `SystemCallArchitectures=native` を設定する目的として、最も適切なものはどれか。

- A. サービスが使う CPU のコアを、1 つに固定する
- B. サービスのバイナリを、実行するマシンのアーキテクチャ用に再ビルドする
- C. ネットワークの通信を、同じ機器の間だけに制限する
- D. 別のアーキテクチャ(32 ビット用など)のシステムコールの番号を使って、フィルタを避けられないようにする

**問40** `LinuC3SS-1.0-040` systemd のサービスを、`SystemCallFilter=` を設定して起動し直したら、動いてしばらくして止まった。`systemctl status` には `status=31/SYS` と出る。原因として、最も適切なものはどれか。

- A. メモリ不足で、OOM killer に終了させられた
- B. フィルタで禁止されたシステムコールを呼び、`SIGSYS` で強制終了された(`SystemCallErrorNumber=` が未設定)
- C. SELinux が拒否したため
- D. ポートが他のプロセスに使われていた

**問41** `LinuC3SS-1.0-041` Ruby の gem として提供され、プログラムに付いた seccomp のフィルタを、`dump` で人が読める形に直して表示する道具の名前を答えよ。

**問42** `LinuC3SS-1.0-042` `/proc/<PID>/status` に `Seccomp: 1` と表示されたプロセスの、seccomp のモードの定数名を答えよ。

**問43** `LinuC3SS-1.0-043` seccomp のフィルタについて、正しいものを**2つ**選べ。

- A. root で実行すれば、フィルタをいつでも外せる
- B. 一度付けたフィルタは、そのプロセスから外せない
- C. フィルタは、そのプロセスが作る子プロセスにも引き継がれる
- D. 実行中のすべてのプロセスに、自動で付く

### 1.5 Linux Capabilities による権限制御

**問44** `LinuC3SS-1.0-044` 一般ユーザーで動かす Web サーバーのプログラムが、ポート 443 で待ち受けられるようにしたい。与える Capability はどれか。

- A. `CAP_NET_ADMIN`
- B. `CAP_NET_RAW`
- C. `CAP_NET_BIND_SERVICE`
- D. `CAP_SYS_ADMIN`

**問45** `LinuC3SS-1.0-045` NTP の機能を持つ自作のデーモンが、システムの時刻を変えられるようにしたい。与える Capability はどれか。

- A. `CAP_SYS_TIME`
- B. `CAP_SYS_BOOT`
- C. `CAP_SYS_NICE`
- D. `CAP_SYS_MODULE`

**問46** `LinuC3SS-1.0-046` Capability と、それで行えることの組み合わせとして、正しいものはどれか。

- A. `CAP_SYS_BOOT` ー システムの時刻を変える
- B. `CAP_SYS_TIME` ー プロセスの優先度を上げる
- C. `CAP_SYS_NICE` ー システムを再起動する
- D. `CAP_SYS_MODULE` ー カーネルモジュールを入れる、外す

**問47** `LinuC3SS-1.0-047` 一般ユーザー権限で動くサービスが、`ip route add` で経路を追加できるようにしたい。与える Capability はどれか。

- A. `CAP_NET_RAW`
- B. `CAP_NET_BIND_SERVICE`
- C. `CAP_NET_ADMIN`
- D. `CAP_DAC_OVERRIDE`

**問48** `LinuC3SS-1.0-048` バックアップ用のプログラムが、所有者とパーミッションに関係なく、すべてのファイルを読み書きできるようにしたい。ただし、root としては動かしたくない。与える Capability として、最も近いものはどれか。

- A. `CAP_DAC_OVERRIDE`
- B. `CAP_SYS_ADMIN`
- C. `CAP_SYS_BOOT`
- D. `CAP_NET_ADMIN`

**問49** `LinuC3SS-1.0-049` 実行ファイル `/usr/local/bin/myserver` に、1024 未満のポートで待ち受ける Capability を、実行したときに効く形で付けるコマンドはどれか。

- A. `getcap cap_net_bind_service=+ep /usr/local/bin/myserver`
- B. `setcap cap_net_bind_service=+ep /usr/local/bin/myserver`
- C. `capsh --print /usr/local/bin/myserver`
- D. `setcap -r /usr/local/bin/myserver`

**問50** `LinuC3SS-1.0-050` ファイルシステム全体で、Capability が付いているファイルを再帰的に探して一覧にする `getcap` のコマンドを、オプションまで答えよ(探す場所は不要)。

**問51** `LinuC3SS-1.0-051` systemd のサービスが持てる Capability の上限を決める、ユニットファイルの設定項目名を答えよ(`=` から後ろは不要)。

**問52** `LinuC3SS-1.0-052` `User=webapp`(一般ユーザー)で動く systemd のサービスに、`CAP_NET_BIND_SERVICE` を持たせて、ポート 80 で待ち受けさせたい。ユニットファイルに書く設定として正しいものはどれか。

- A. `AmbientCapabilities=CAP_NET_BIND_SERVICE`
- B. `CapabilityBoundingSet=CAP_NET_BIND_SERVICE` だけを書く
- C. `NoNewPrivileges=yes` だけを書く
- D. `User=root` に変える

**問53** `LinuC3SS-1.0-053` systemd のサービスに `NoNewPrivileges=yes` を設定した効果として、正しいものはどれか。

- A. サービスが持つすべての Capability が、外される
- B. そのサービスとその子プロセスが、`setuid` のビットやファイルの Capability によって、新しい権限を得られなくなる
- C. サービスが、子プロセスを作れなくなる
- D. サービスが、ネットワークに接続できなくなる

**問54** `LinuC3SS-1.0-054` プロセスが権限の確認を受けるとき、カーネルが実際に見る Capability のセットはどれか。

- A. Permitted
- B. Inheritable
- C. Effective
- D. Bounding

**問55** `LinuC3SS-1.0-055` `/proc/<PID>/status` の `CapEff: 0000000000000400` の値を、Capability の名前に直すコマンドはどれか。

- A. `getcap --decode 0000000000000400`
- B. `setcap -d 0000000000000400`
- C. `getfattr -d 0000000000000400`
- D. `capsh --decode=0000000000000400`

## 解答・解説

### 問1 `LinuC3SS-1.0-001`

**正解**: D

**テキスト**: 2. setfacl と getfacl

`setfacl -m` は、ACL エントリを追加または変更します。`u:alice:rw` は、ユーザー alice に読み書きを与える意味です。`getfacl report.txt` で確かめます。

- A. `-x` は、エントリを**消す**オプションです。
- B. `-b` は、ACL をすべて消すオプションで、ユーザーは指定しません。
- C. `chmod` は所有者、グループ、その他の権限を変えるコマンドで、ユーザーを指定した ACL は作れません。

### 問2 `LinuC3SS-1.0-002`

**正解**: B

**テキスト**: 2. setfacl と getfacl

`ls -l` は、通常の権限のほかに ACL があるファイルの権限の後ろに `+` を付けます。内容は `getfacl` で見ます。なお SELinux のラベルだけがあるときは、`.` が付きます。

- A. スティッキービットは、その他の実行の位置に `t` で表示されます。
- C. ハードリンクの数は、権限の次の列の数字に出ます。
- D. `ls -l` に暗号化を示す記号はありません。

### 問3 `LinuC3SS-1.0-003`

**正解**: A

**テキスト**: 3. マスク

名前付きユーザー、名前付きグループ、所有グループが実際に使える権限は、エントリとマスクの論理積です。エントリが `rwx` でも、マスクが `r--` なら、効くのは `r--` だけです。`setfacl -m m::rw report.txt` でマスクを広げます。`chmod g=r` のようにグループの権限を変えると、ACL があるファイルではマスクが変わるので、同じ症状になります。

- B. エントリは `rwx` です。マスクで削られて、実際に効くのが `r--` になっています(`#effective:r--`)。
- C. 名前付きユーザーの上限を決めるのは `other` ではなく、マスクです。
- D. デフォルト ACL は、ディレクトリの中に新しく作るファイルに引き継ぐものです。既にある `report.txt` への書き込みには関係しません。

### 問4 `LinuC3SS-1.0-004`

**正解**: C

**テキスト**: 4. デフォルト ACL

`-d` を付けると、デフォルト ACL を設定します。そのディレクトリの中に新しく作られるファイルとディレクトリが、この ACL を引き継ぎます。`getfacl` では `default:group:dev:rw-` と表示されます。既にあるファイルには効かないので、必要なら `-R` で別に ACL を付けます。

- A. これはディレクトリ自身の ACL を変えるだけで、中に新しく作るファイルには引き継がれません。
- B. `-x` は、グループ dev のエントリを消します。
- D. `-b` は、ACL をすべて消します。

### 問5 `LinuC3SS-1.0-005`

**正解**: `setfacl -b`、`setfacl --remove-all`、`-b`、`--remove-all`

**テキスト**: 2. setfacl と getfacl

`setfacl -b`(長い形は `--remove-all`)は、ACL エントリをすべて消します。1 つのエントリだけ消すなら `-x`、デフォルト ACL だけ消すなら `-k` です。

### 問6 `LinuC3SS-1.0-006`

**正解**: B

**テキスト**: 7. コピー、移動、バックアップで ACL を残す

`rsync` で ACL を残すのは `-A`(`--acls`)、拡張属性を残すのは `-X`(`--xattrs`)です。`-a` には含まれないので、足します。コピー先のファイルシステムも ACL と拡張属性に対応している必要があります。

- A. `-a` は、権限、所有者、時刻、リンクなどを残しますが、ACL(`-A`)と拡張属性(`-X`)は含みません。
- C. `-v` は表示を詳しくし、`-z` は転送のときに圧縮します。ACL と拡張属性は残りません。
- D. `-H` はハードリンクを残すオプションです。

### 問7 `LinuC3SS-1.0-007`

**正解**: A、C

**テキスト**: 7. コピー、移動、バックアップで ACL を残す

`tar` は、既定では ACL と拡張属性を扱いません。作るときと取り出すときの**両方**に `--acls --xattrs --selinux`(SELinux のラベルは `--selinux`)を付けます。なお、取り出すときの `--xattrs` が戻すのは、既定では `user.` で始まる名前の属性だけです。ほかの属性(`security.capability` など)も戻すには、`--xattrs-include='*'` を足します。

- B. 取り出すときにも指定がないと、ACL や拡張属性は復元されません。
- D. `-z` は gzip で圧縮するオプションで、ACL とは関係ありません。

### 問8 `LinuC3SS-1.0-008`

**正解**: C

**テキスト**: 5. NFSv4 と Samba の ACL

`acl_xattr` は、Windows の ACL を拡張属性に保存する Samba のモジュールです。共有するディレクトリは、拡張属性と ACL に対応するファイルシステムに置きます。Linux 側の ACL は `getfacl`、Samba 側の ACL は `smbcacls` で確かめます。

- A. ごみ箱の機能で、ACL とは関係がありません。
- B. 共有を書き込み可にする設定で、ACL の保存方法は変わりません。
- D. 存在しないユーザーのログインをゲストにする設定で、ACL とは関係がありません。

### 問9 `LinuC3SS-1.0-009`

**正解**: D

**テキスト**: 5. NFSv4 と Samba の ACL

NFSv4 ACL は、POSIX ACL とは別の形式です(許可と拒否のエントリを並べます)。クライアントでは、`nfs4-acl-tools` パッケージの `nfs4_getfacl` と `nfs4_setfacl` で扱います。

- A. サーバーが公開している共有の一覧を見るコマンドで、ACL は見えません。
- B. サーバー側で、公開の設定を表示するコマンドです。
- C. マウントしている NFS の、マウントのオプションを表示するコマンドです。

### 問10 `LinuC3SS-1.0-010`

**正解**: A

**テキスト**: 6. 拡張属性

`setfattr -n 名前 -v 値 ファイル` で、拡張属性(xattr)を付けます。`getfattr -d report.txt` で、`user.` の属性を一覧にできます。消すときは `setfattr -x user.team report.txt` です。ACL(`system.posix_acl_access`)や SELinux のラベル(`security.selinux`)も、拡張属性として保存されています。

- B. `getfattr` は、拡張属性を**表示**するコマンドです。付けるのは `setfattr` です。
- C. `setfacl` は ACL を扱うコマンドで、任意の名前の属性は付けられません。
- D. ファイルを変更できないようにする属性(ファイルシステムの属性)で、名前と値の組ではありません。

### 問11 `LinuC3SS-1.0-011`

**正解**: B

**テキスト**: 7. コピー、移動、バックアップで ACL を残す

`cp -a` は、`--preserve=all` と `-r` を合わせたものです。権限、所有者、時刻、拡張属性(ACL や SELinux のラベル、ファイルの Capability を含む)を残します。別の書き方は `cp -r --preserve=all` です。

- A. `-r` は、下の階層も含めてコピーするだけです。拡張属性や ACL は残りません。
- C. `-f` は、コピー先を強制的に上書きするオプションで、属性は残りません。
- D. ハードリンクを作るオプションです。ディレクトリには使えず、コピーにもなりません。

### 問12 `LinuC3SS-1.0-012`

**正解**: A

**テキスト**: 3. モードとポリシーの種類

`setenforce 0` で permissive になります。拒否はせず、記録だけします。再起動で、`/etc/selinux/config` のモードに戻ります。permissive で直るなら、原因は SELinux です。元の `setenforce 1` に戻して、ラベルやブール値を直します。

- B. `1` は enforcing(強制する)にします。
- C. `getenforce` は、今のモードを表示するだけで、引数では変えられません。
- D. `sestatus` は、状態を表示するだけです。

### 問13 `LinuC3SS-1.0-013`

**正解**: D

**テキスト**: 4. 設定ファイルと、無効にする手順

RHEL 9 系では、`grubby` で、カーネルの起動の引数に `selinux=0` を付けます。有効に戻すときは `--remove-args selinux=0` で外し、`/.autorelabel` を作ってラベルを付け直します。

- A. permissive になるだけで、無効にはなりません。再起動すると元のモードに戻ります。
- B. RHEL 9 系では、設定ファイルで disabled にしても、カーネルの中の SELinux は有効のまま、ポリシーを読み込まない状態で動きます。完全に無効にするには、カーネルの引数 `selinux=0` を使います。
- C. `selinux=0` を**外す**ので、無効を解除する手順です。

### 問14 `LinuC3SS-1.0-014`

**正解**: C

**テキスト**: 3. モードとポリシーの種類

`Current mode` は今のモード、`Mode from config file` は、`/etc/selinux/config` の `SELINUX=` の値で、再起動後に使われるモードです。再起動後も permissive にしたいときは、設定ファイルを書き換えます。

- A. `setenforce` の変更は、再起動まで有効です。起動のときは、設定ファイルのモードを使います。
- B. 設定ファイルのモードは enforcing で、disabled ではありません。
- D. モードの違いで、起動が失敗することはありません。

### 問15 `LinuC3SS-1.0-015`

**正解**: D

**テキスト**: 5. ファイルのラベルを直す

ホームディレクトリで作ったファイルを `mv` で移すと、ラベルが `user_home_t` のまま残り、`httpd_t` のプロセスは読めません。`restorecon` は、ポリシーが決めている正しいラベル(`httpd_sys_content_t`)に直します。

- A. 原因は権限ではなく、ラベルです。権限を広げても直りません。
- B. ホームディレクトリの公開を制御するブール値で、このファイルのラベルは変わりません。
- C. ポートのタイプを足すコマンドで、ファイルのラベルは直りません。

### 問16 `LinuC3SS-1.0-016`

**正解**: C

**テキスト**: 5. ファイルのラベルを直す

`semanage fcontext -a` は、「このパスのファイルは、このタイプ」という決まりを恒久的に足します。そのあと `restorecon -Rv /web` で、実際のファイルにラベルを付けます。`chcon` は、試すときの一時的な方法です。

- A. `chcon` で付けたラベルは一時的で、`restorecon` や再ラベルで元に戻ります。
- B. ポリシーの決まりに従って直すコマンドです。決まりがないうちに実行しても、元のラベルに戻るだけです。
- D. `httpd_sys_content_t` はブール値ではなく、タイプの名前です。

### 問17 `LinuC3SS-1.0-017`

**正解**: A

**テキスト**: 5. ファイルのラベルを直す

ポートにもタイプがあり、`httpd_t` が待ち受けられるのは `http_port_t` のポートだけです。`semanage port -l` で一覧を見て、`semanage port -a` で足します。ポリシーですでに別の型が割り当てられているポートは、`-a` ではなく `-m` で変えます。

- B. 動きますが、SELinux の保護を全体で弱めます。ポートのタイプを足せば、必要な許可だけで済みます。
- C. ファイルのラベルを直すコマンドで、ポートのタイプは変わりません。
- D. Web サーバーから外へ**接続する**ことを許すブール値です。待ち受けるポートの許可ではありません。

### 問18 `LinuC3SS-1.0-018`

**正解**: B

**テキスト**: 6. ブール値

よくある許可の切り替えは、ポリシーのブール値です。`getsebool -a | grep httpd` で探し、`setsebool -P 名前 on` で恒久的に変えます。`-P` を付けない設定は、再起動で消えます。

- A. `-P` がないので、すぐ効きますが、再起動で元に戻ります。
- C. `getsebool` は値を表示するコマンドで、設定は変えられません。
- D. ファイルのラベルの決まりで、ネットワーク接続の許可とは関係がありません。

### 問19 `LinuC3SS-1.0-019`

**正解**: C

**テキスト**: 7. 拒否のログと audit2allow

`scontext` が操作したプロセスのコンテキスト、`tcontext` が対象のコンテキストです。この例は、ディレクトリのラベルが合っていない可能性があります。まず `ls -Zd` で対象のラベルを見て、`restorecon` や `semanage fcontext` で直せるかを考えます。

- A. `scontext` が操作したプロセス、`tcontext` が操作された対象です。向きが逆です。
- B. `permissive=0` は enforcing で、本当に拒否されたことを示します。記録だけなら `permissive=1` です。
- D. `{ write }` は書き込みです。

### 問20 `LinuC3SS-1.0-020`

**正解**: A

**テキスト**: 7. 拒否のログと audit2allow

`audit2allow` は、拒否のログから許可のルールを作りますが、「ログに出た拒否をすべて許す」ルールになりがちです。原因の多くは、ラベルの誤り(`restorecon`、`semanage fcontext`)やブール値(`setsebool`)です。まずそれで直し、足りないときだけモジュールにします。`audit2allow -w` で、拒否の理由を説明させることもできます。

- B. 許しすぎのルールが入り、SELinux の保護を弱めるおそれがあります。
- C. 無効にする必要はなく、保護もなくなります。
- D. permissive のままでは、保護をしないまま運用することになります。

### 問21 `LinuC3SS-1.0-021`

**正解**: `audit2allow -M`、`-M`、`audit2allow --module-package`、`--module-package`

**テキスト**: 7. 拒否のログと audit2allow

`audit2allow -M mypol` は、`mypol.te` と `mypol.pp` を作ります。`semodule -i mypol.pp` で入れます。小文字の `-m` は、ルールの元(`.te` の形)を標準出力に出すだけで、`.pp` は作りません。

### 問22 `LinuC3SS-1.0-022`

**正解**: B、D

**テキスト**: 7. 拒否のログと audit2allow

`allow` が許可、`auditallow` が許可して記録、`dontaudit` が拒否の記録を省略です。拒否されているのに `audit.log` に AVC が出ないときは、`dontaudit` が記録を隠していることがあります。`semodule -DB` で一時的に隠さない設定にし、調べ終えたら `semodule -B` で戻します。

- A. `allow` は、アクセスを**許可**するルールです。
- C. 許可するのではなく、拒否の**記録を残さない**だけで、アクセスは拒否されたままです。

### 問23 `LinuC3SS-1.0-023`

**正解**: B

**テキスト**: 5. ファイルのラベルを直す

`seinfo` は、ポリシーの中身(タイプ、ユーザー、ロールなど)の数や一覧を調べます。`setools-console` パッケージに入っています。許可のルールを探すときは、同じパッケージの `sesearch` を使います。

- A. ファイルのコンテキストは `ls -Z` で見ます。
- C. ブール値は `getsebool -a` で見ます。
- D. ポートとタイプの対応は `semanage port -l` で見ます。

### 問24 `LinuC3SS-1.0-024`

**正解**: D

**テキスト**: 3. モードとポリシーの種類

`SELINUXTYPE=` は、ポリシーの種類です。`targeted`(既定)、`minimum`、`mls` があります。`mls` は、コンテキストの最後の「レベル」(`s0` など)を使います。

- A. これは `targeted` の説明です。
- B. これは `minimum` の説明です。
- C. それは、`SELINUX=` に `disabled` を指定する場合の話です。

### 問25 `LinuC3SS-1.0-025`

**正解**: C

**テキスト**: 3. 状態の確認とモードの切り替え

`aa-status`(古い名前は `apparmor_status`)は、読み込まれているプロファイルの数、enforce と complain の別、プロファイルで縛られているプロセスを表示します。root で実行します。

- A. SELinux のモードを表示するコマンドです。
- B. SELinux の状態を表示するコマンドです。
- D. プロファイルを新しく作るコマンドです。

### 問26 `LinuC3SS-1.0-026`

**正解**: D

**テキスト**: 2. プロファイルとモード

プロファイルは `/etc/apparmor.d/` に置き、ファイル名は、プログラムのパスの `/` を `.` にしたものです。

- A. SELinux のポリシーの置き場所です。
- B. AppArmor のプロファイルの置き場所ではありません。
- C. プログラムの隣には置きません。

### 問27 `LinuC3SS-1.0-027`

**正解**: A

**テキスト**: 3. 状態の確認とモードの切り替え

`aa-complain` は complain モードにします。違反は `apparmor="ALLOWED"` として記録され、動作は止まりません。記録をもとに、`aa-logprof` でプロファイルを直します。

- B. 違反を拒否するモードにします。
- C. プロファイルを無効にします。記録もされません。
- D. プロファイルをカーネルから外します。complain モードにするのではありません。

### 問28 `LinuC3SS-1.0-028`

**正解**: B

**テキスト**: 3. 状態の確認とモードの切り替え

プロファイルのファイルを書き換えても、カーネルに読み込まれているのは古い内容のままです。`apparmor_parser -r` で置き換えます。`-a` は追加、`-R` は外す、です。

- A. アプリを再起動しても、プロファイルの読み込み直しにはなりません。
- C. ログを読んで、プロファイルに足す内容を質問するコマンドです。編集した内容の読み込みではありません。
- D. 状態を表示するだけです。

### 問29 `LinuC3SS-1.0-029`

**正解**: D

**テキスト**: 5. 拒否のログ

`profile=` が、どのプロファイルか、`name=` が対象のパス、`denied_mask=` が拒否された権限です。直し方は、`aa-logprof` で足すか、`/srv/data/** r,` を足して `apparmor_parser -r` で読み込み直すことです。

- A. `denied_mask="r"` は読み取りです。
- B. complain モードの記録なら、`apparmor="ALLOWED"` になります。
- C. `profile=` は、拒否の原因のプロファイルを示します。`name=` は、対象のパスです。

### 問30 `LinuC3SS-1.0-030`

**正解**: A

**テキスト**: 4. プロファイルを作って育てる

`aa-genprof /usr/sbin/myapp` を実行したまま、別の端末で、プログラムの機能を一通り使います。戻って `S`(スキャン)を押すと、ログをもとに、許す、拒否するなどの質問が出ます。`F` で終わると、プロファイルが保存され、enforce になります。

- B. `aa-genprof` は、動作を記録する間は complain の状態にします。
- C. `aa-genprof` は、ソースコードを読みません。動かしたときのログを使います。
- D. そのような変換はしません。

### 問31 `LinuC3SS-1.0-031`

**正解**: `aa-logprof`、aa-logprof

**テキスト**: 2. プロファイルとモード

`aa-logprof` は、ログの違反を読み、「このアクセスを許可しますか」と質問します。答えに応じて、`/etc/apparmor.d/` のプロファイルを更新します。

### 問32 `LinuC3SS-1.0-032`

**正解**: `aa-enforce`、aa-enforce

**テキスト**: 3. 状態の確認とモードの切り替え

`aa-enforce` は、プロファイルを enforce モードにします。complain にするのは `aa-complain` です。

### 問33 `LinuC3SS-1.0-033`

**正解**: C

**テキスト**: 1. AppArmor とは

SELinux はラベル、AppArmor はパスで、ルールを決めます。ファイルのパスを書くので、読みやすい反面、ハードリンクや、別の名前でのマウントでは、見え方が変わることがあります。

- A. これは SELinux の仕組みです。
- B. Red Hat 系で既定で有効なのは SELinux です。AppArmor は Ubuntu などで既定です。
- D. root で動くプロセスも、プロファイルで制限できます。

### 問34 `LinuC3SS-1.0-034`

**正解**: B

**テキスト**: 2. seccomp のモード

`SECCOMP_MODE_STRICT` は、`read`、`write`、`_exit`、`sigreturn` だけを許す、非常に厳しいモードです。許されないシステムコールを呼ぶと、プロセスは強制終了されます。実際には、柔軟な `SECCOMP_MODE_FILTER` が使われます。

- A. `open` は許されません。STRICT は、4 つだけです。
- C. 記録だけにするのは、フィルタモードの LOG という動作です。
- D. それは `SECCOMP_MODE_FILTER` です。

### 問35 `LinuC3SS-1.0-035`

**正解**: D

**テキスト**: 2. seccomp のモード

フィルタは、BPF(クラシック BPF)の形式のプログラムです。呼ばれたシステムコールの番号、アーキテクチャ、引数を見て、許可、エラー、強制終了などを返します。

- A. seccomp は、SELinux とは別の仕組みです。
- B. seccomp は、AppArmor とは別の仕組みです。
- C. `sudoers` は、sudo で実行できるコマンドの設定です。

### 問36 `LinuC3SS-1.0-036`

**正解**: A

**テキスト**: 2. seccomp のモード

`Seccomp:` の値は、`0` が `SECCOMP_MODE_DISABLED`、`1` が `SECCOMP_MODE_STRICT`、`2` が `SECCOMP_MODE_FILTER` です。コンテナの中のプロセスは、`2` になっていることがよくあります。

- B. `0` のときです。
- C. `1` のときです。
- D. 対応していないカーネルでは、この行自体がありません。

### 問37 `LinuC3SS-1.0-037`

**正解**: B

**テキスト**: 3. systemd のサービスで使う

`SystemCallErrorNumber=` を書かないと、禁止したシステムコールを呼んだプロセスは、`SIGSYS` で強制終了します。`EPERM` などを書くと、システムコールがそのエラーで失敗して、プロセスは続きます。

- A. `SystemCallFilter=` には、システムコールの名前やグループを書きます。エラー番号ではありません。
- C. `SystemCallArchitectures=` には、`native` などのアーキテクチャを書きます。
- D. `RestrictSUIDSGID=` は、`yes` か `no` で、setuid や setgid ビットの設定を禁止するものです。

### 問38 `LinuC3SS-1.0-038`

**正解**: C

**テキスト**: 3. systemd のサービスで使う

`SystemCallFilter=` は、許可のリストです。先頭に `~` を付けると、禁止のリストになります。`@` で始まる名前は、システムコールのグループです。

- A. 先頭に `~` がなければ、そのとおりになります。`~` は、反対にします。
- B. 記録だけにする設定ではありません。
- D. `~` は、パスではありません。禁止のリストにする記号です。

### 問39 `LinuC3SS-1.0-039`

**正解**: D

**テキスト**: 3. systemd のサービスで使う

x86-64 のマシンは、32 ビット用のシステムコールの番号の体系も使えます。フィルタが 64 ビットの番号だけを見ていると、別の体系の番号で、抜けが出ることがあります。`native` は、そのマシンの本来のアーキテクチャだけを許します。

- A. CPU の割り当ては、`CPUAffinity=` で決めます。
- B. 設定で、バイナリは作り直されません。
- C. ネットワークの制限とは関係がありません。

### 問40 `LinuC3SS-1.0-040`

**正解**: B

**テキスト**: 3. systemd のサービスで使う

`status=31/SYS` は、`SIGSYS`(31 番)で終了したことを表します。監査ログには `type=SECCOMP` の行が残ります。`strace -c -f` で、プログラムが使うシステムコールを調べ、許可に足すか、`SystemCallErrorNumber=` でエラーにします。

- A. OOM killer は `SIGKILL`(9)で終了させます。`SIGSYS` ではありません。
- C. SELinux の拒否は、通常、エラー(`EACCES` など)になります。`SIGSYS` で終了することはありません。
- D. その場合は、プロセスが、エラーを出して終了します。`SIGSYS` ではありません。

### 問41 `LinuC3SS-1.0-041`

**正解**: `seccomp-tools`、seccomp-tools

**テキスト**: 4. フィルタの中身を読む: seccomp-tools

`seccomp-tools dump ./myapp` は、付いているフィルタを逆アセンブルして表示します。自分で作ったフィルタが、意図どおりに許可と禁止を決めているかを確かめるときに使います。

### 問42 `LinuC3SS-1.0-042`

**正解**: `SECCOMP_MODE_STRICT`、SECCOMP_MODE_STRICT

**テキスト**: 2. seccomp のモード

`0` が `SECCOMP_MODE_DISABLED`、`1` が `SECCOMP_MODE_STRICT`、`2` が `SECCOMP_MODE_FILTER` です。

### 問43 `LinuC3SS-1.0-043`

**正解**: B、C

**テキスト**: 2. seccomp のモード

フィルタは、あとから外せず、子にも引き継がれます。これによって、乗っ取られたプロセスが、自分でフィルタを外して、制限から逃げることを防ぎます。

- A. root でも外せません。外せないことで、フィルタの安全が保たれます。
- D. 付くのは、フィルタを設定したプロセスと、その子プロセスだけです。

### 問44 `LinuC3SS-1.0-044`

**正解**: C

**テキスト**: 1. Capabilities とは

`CAP_NET_BIND_SERVICE` は、1024 未満のポートで待ち受ける権限です。この権限だけを与えれば、root で動かさずに済みます。

- A. インターフェースや経路、ファイアウォールなどの設定に関する権限です。
- B. RAW ソケットやパケットのソケットを使うための権限です。
- D. 強すぎる権限です。待ち受けのためには、不要に広すぎます。

### 問45 `LinuC3SS-1.0-045`

**正解**: A

**テキスト**: 1. Capabilities とは

`CAP_SYS_TIME` は、システムの時刻(`settimeofday`、`adjtimex` など)を変える権限です。

- B. 再起動などに関する権限です。
- C. プロセスの優先度に関する権限です。
- D. カーネルモジュールの読み込みに関する権限です。

### 問46 `LinuC3SS-1.0-046`

**正解**: D

**テキスト**: 1. Capabilities とは

`CAP_SYS_MODULE` は、カーネルモジュールの読み込みと取り外しの権限で、持っていればカーネルの動作を変えられます。与えるのは、ごく限られた場合だけです。

- A. `CAP_SYS_BOOT` は、再起動や、`kexec` による別のカーネルの起動です。
- B. `CAP_SYS_TIME` は、時刻を変える権限です。
- C. `CAP_SYS_NICE` は、優先度の変更とスケジューリングの設定に関する権限です。

### 問47 `LinuC3SS-1.0-047`

**正解**: C

**テキスト**: 1. Capabilities とは

`CAP_NET_ADMIN` は、ネットワークの設定(インターフェース、経路、ファイアウォールなど)の権限です。

- A. RAW ソケットを使う権限で、経路の設定はできません。
- B. 1024 未満のポートで待ち受ける権限です。
- D. ファイルの権限の確認を無視する権限です。

### 問48 `LinuC3SS-1.0-048`

**正解**: A

**テキスト**: 1. Capabilities とは

`CAP_DAC_OVERRIDE` は、ファイルの読み、書き、実行の権限の確認を、すべて無視する権限です。読み取りだけでよいときは、より狭い `CAP_DAC_READ_SEARCH` を使います。SELinux や AppArmor の制限は、別に効きます。

- B. ファイルの権限の確認とは別の、管理操作の広い集まりです。
- C. 再起動に関する権限です。
- D. ネットワークの設定に関する権限です。

### 問49 `LinuC3SS-1.0-049`

**正解**: B

**テキスト**: 3. ファイルに付ける: setcap と getcap

`setcap` で、ファイルに Capability を付けます。`e` は Effective、`p` は Permitted を表します。`getcap /usr/local/bin/myserver` で確かめます。ファイルの Capability は拡張属性に保存されるため、コピーするときは `cp -a` などで残します。

- A. `getcap` は、付いている Capability を表示するコマンドで、付けるのは `setcap` です。
- C. `capsh --print` は、今のシェルの Capability を表示します。ファイルには付けられません。
- D. `-r` は、Capability を**外す**オプションです。

### 問50 `LinuC3SS-1.0-050`

**正解**: `getcap -r`

**テキスト**: 3. ファイルに付ける: setcap と getcap

`getcap -r /` で、Capability が付いたファイルを一覧にします(権限のないところのエラーは `2>/dev/null` で捨てます)。意図しない Capability の付与がないか、定期的に確かめます。

### 問51 `LinuC3SS-1.0-051`

**正解**: `CapabilityBoundingSet`、CapabilityBoundingSet

**テキスト**: 4. systemd のサービスで使う

`CapabilityBoundingSet=` は、サービスが持てる Capability の上限を決めます。書いたもの以外は外されます。`~` を付けると、書いたものだけを外します。

### 問52 `LinuC3SS-1.0-052`

**正解**: A

**テキスト**: 4. systemd のサービスで使う

`AmbientCapabilities=` は、root 以外で動くサービスに、Capability を渡します。上限の `CapabilityBoundingSet=` と合わせて書くのが定番です。

- B. 上限を決めるだけで、一般ユーザーのプロセスには渡されません。
- C. 新しい権限の獲得を禁止する設定で、Capability を渡しません。
- D. root で動かすことになり、最小権限の考え方に反します。

### 問53 `LinuC3SS-1.0-053`

**正解**: B

**テキスト**: 4. systemd のサービスで使う

`NoNewPrivileges=yes` は、実行する側の権限を上げる経路(`setuid`、ファイルの Capability など)を塞ぎます。乗っ取られても、権限を上げにくくなります。

- A. 持っている Capability を外す設定ではありません。外すのは `CapabilityBoundingSet=` です。
- C. 子プロセスは作れます。
- D. 通信とは関係がありません。

### 問54 `LinuC3SS-1.0-054`

**正解**: C

**テキスト**: 2. ケーパビリティセット

Effective が、今効いている Capability です。Permitted は使ってよい上限で、プログラムは、その範囲で Effective に入れたり、外したりします。Inheritable は、`exec` で引き継ぐ候補です。

- A. 使ってよい上限です。実際に効いているものは、Effective に入っているものです。
- B. `exec` のあとに引き継げる候補のセットです。
- D. 持てる上限のセットです。

### 問55 `LinuC3SS-1.0-055`

**正解**: D

**テキスト**: 2. ケーパビリティセット

`capsh --decode=値` は、16 進数の値を、Capability の名前に直します。`0x400` は `cap_net_bind_service` です。実行中のプロセスの Capability は `getpcaps PID` でも見られます。

- A. `getcap` は、ファイルの Capability を見るコマンドで、`--decode` はありません。
- B. `setcap` は、ファイルに付けるコマンドです。
- C. `getfattr` は、ファイルの拡張属性を表示するコマンドです。
