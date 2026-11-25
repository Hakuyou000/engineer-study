# LinuC202 問題 2.11 ファイル共有サービス

対象: LinuC レベル2 202試験 / 全24問 / すべてオリジナル問題
対応テキスト: `LinuC202_2.11_ファイル共有サービス.md`
解答・解説は末尾。

## 問題

### 2.11.1 Samba の設定と管理

**問1** `LinuC202-2.11-001` Linux にユーザー alice がすでにある。alice を Samba のユーザーとして追加し、Samba 用のパスワードを設定するコマンドを、オプションまで答えよ(ユーザー名は不要)。

**問2** `LinuC202-2.11-002` `smb.conf` を編集した。Samba を再起動する前に、書き方の誤りを検査するコマンドはどれか。

- A. `smbstatus`
- B. `testparm`
- C. `smbclient`
- D. `nmblookup`

**問3** `LinuC202-2.11-003` Samba のデーモンのうち、NetBIOS の名前の解決を受け持つものはどれか。

- A. `smbd`
- B. `winbindd`
- C. `nmbd`
- D. `samba-tool`

**問4** `LinuC202-2.11-004` Samba で、ログインしたユーザー自身のホームディレクトリを、そのユーザーの名前の共有として自動的に公開する、`smb.conf` の節はどれか。

- A. `[homes]`
- B. `[global]`
- C. `[printers]`
- D. `[profiles]`

**問5** `LinuC202-2.11-005` Samba のサーバーを Active Directory のメンバーとして動かし、ユーザーの認証を AD に任せる。`smb.conf` の `[global]` に書く設定はどれか。

- A. `security = user`
- B. `passdb backend = ads`
- C. `workgroup = ads`
- D. `security = ads`

**問6** `LinuC202-2.11-006` Samba のサーバー `fs1` が公開している共有の一覧を、ユーザー alice で表示するコマンドはどれか。

- A. `smbstatus -S fs1`
- B. `testparm -L //fs1`
- C. `smbclient -L //fs1 -U alice`
- D. `nmblookup -L fs1`

**問7** `LinuC202-2.11-007` Samba に、いまつないでいるクライアントと、使っている共有、ロックされているファイルの一覧を表示するコマンドを答えよ。

**問8** `LinuC202-2.11-008` Windows のユーザー `administrator` を、Linux のユーザー `root` に対応づけたい。`smb.conf` に `username map = /etc/samba/smbusers` と書いてある。`/etc/samba/smbusers` に書く行はどれか。

- A. `root = administrator`
- B. `administrator = root`
- C. `map root administrator`
- D. `root : administrator`

**問9** `LinuC202-2.11-009` `smb.conf` の共有 `[data]` を、グループ staff のユーザーだけが、読み書きできるようにしたい。Linux 側のディレクトリのパーミッションは、すでに staff に書き込みを許している。`[data]` に書く設定を**2つ**選べ。

- A. `browseable = no`
- B. `valid users = @staff`
- C. `guest ok = yes`
- D. `read only = no`

**問10** `LinuC202-2.11-010` 共有するディレクトリ `/srv/share` に、ACL で、ユーザー bob に読み書きと実行を許す設定を足すコマンドはどれか。

- A. `getfacl -m u:bob:rwx /srv/share`
- B. `setfacl -m u:bob:rwx /srv/share`
- C. `setfacl -x u:bob:rwx /srv/share`
- D. `chmod bob+rwx /srv/share`

**問11** `LinuC202-2.11-011` 動いている smbd に、サービスを再起動せずに、`smb.conf` の再読み込みを伝えるコマンドを、サブコマンドまで答えよ(`all` を使って、すべてのプロセスに伝える形で答える)。

**問12** `LinuC202-2.11-012` `smb.conf` に `log file = /var/log/samba/log.%m` と書いた。`%m` が表すものはどれか。

- A. ログインしたユーザー名
- B. サーバーのホスト名
- C. 共有の名前
- D. クライアントのコンピューター名(NetBIOS 名)

**問13** `LinuC202-2.11-013` NetBIOS の名前から、IP アドレスを調べるコマンドを答えよ(名前は不要)。

**問14** `LinuC202-2.11-014` Samba を Active Directory のドメインコントローラーとして動かしている。ドメインのユーザー `bob` を作るコマンドはどれか。

- A. `samba-tool user create bob`
- B. `smbpasswd -a bob`
- C. `net ads join -U bob`
- D. `pdbedit -a -u bob`

### 2.11.2 NFS サーバーの設定と管理

**問15** `LinuC202-2.11-015` NFS サーバーで、`/srv/share` を、ネットワーク `192.168.1.0/24` のホストにだけ、読み書き可で公開したい。`/etc/exports` の書き方で、意図どおりになるものはどれか。

- A. `/srv/share 192.168.1.0/24 (rw)`
- B. `/srv/share 192.168.1.0/24(rw,sync)`
- C. `/srv/share (rw) 192.168.1.0/24`
- D. `/srv/share 192.168.1.0/24:(rw)`

**問16** `LinuC202-2.11-016` `/etc/exports` を編集した。NFS のサービスを再起動せずに、公開の状態を `/etc/exports` に合わせる `exportfs` のコマンドを、オプションまで答えよ。

**問17** `LinuC202-2.11-017` クライアントから、NFS サーバー `nfs1` が公開しているディレクトリの一覧を表示するコマンドはどれか。

- A. `nfsstat -e nfs1`
- B. `exportfs -v nfs1`
- C. `showmount -e nfs1`
- D. `rpcinfo -e nfs1`

**問18** `LinuC202-2.11-018` `/etc/exports` のオプション `root_squash` の動きはどれか。

- A. クライアントの root(UID 0)を、匿名のユーザー(`nobody` など)として扱う
- B. サーバーの root のパスワードを、クライアントが変えられないようにする
- C. すべてのクライアントのユーザーを、匿名のユーザーとして扱う
- D. 公開するディレクトリを、読み取り専用にする

**問19** `LinuC202-2.11-019` NFSv3 のクライアントが、サーバーのディレクトリをマウントするために、サーバーで動いている必要があるサービスを**2つ**選べ。`nfsd` は動いているものとする。

- A. `winbindd`
- B. `rpcbind`
- C. `rpc.mountd`
- D. `nmbd`

**問20** `LinuC202-2.11-020` NFS のサーバーで、rpcbind(ポートマッパー)に登録されている RPC のサービスと、そのポート番号の一覧を表示するコマンドはどれか。

- A. `showmount -a`
- B. `nfsstat -s`
- C. `exportfs -v`
- D. `rpcinfo -p`

**問21** `LinuC202-2.11-021` NFS のクライアントで、マウントしている NFS ごとのマウントオプションを表示する、`nfsstat` のオプションを答えよ(`nfsstat` からのオプションまで答える)。

**問22** `LinuC202-2.11-022` NFSv4 の共有 `server:/srv/share` を、`/mnt/share` に、起動のときに自動でマウントしたい。ネットワークが使えるようになってからマウントさせる。`/etc/fstab` の行として正しいものはどれか。

- A. `/mnt/share server:/srv/share nfs4 defaults 0 0`
- B. `server:/srv/share /mnt/share nfs4 defaults,_netdev 0 0`
- C. `server/srv/share /mnt/share nfs4 defaults 0 0`
- D. `server:/srv/share /mnt/share cifs defaults,_netdev 0 0`

**問23** `LinuC202-2.11-023` NFS のクライアントで、サーバーが一時的に止まっても、書き込みのデータを失わないように、サーバーが戻るまで待って再試行させたい。マウントオプションはどれか。

- A. `soft`
- B. `ro`
- C. `hard`
- D. `nosuid`

**問24** `LinuC202-2.11-024` NFS のサーバーを守るための設定として、適切なものを**2つ**選べ。

- A. `/etc/exports` で、公開する相手を、必要なネットワークだけに絞る
- B. すべてのホストに `*(rw,no_root_squash)` で公開する
- C. 書き込みの確認をなくすため、すべての公開に `async` を付ける
- D. クライアントの root を匿名のユーザーに変える `root_squash`(既定)を、そのまま使う

## 解答・解説

### 問1 `LinuC202-2.11-001`

**正解**: `smbpasswd -a`、`pdbedit -a -u`、`pdbedit -a`、`pdbedit -u -a`、`pdbedit --create --user`、`pdbedit --create -u`、`pdbedit -a --user`、`pdbedit --create`

`smbpasswd -a ユーザー名` は、Linux にあるユーザーを、Samba のユーザーとして追加し、Samba 用のパスワードを設定します。Samba のパスワードは、Linux のパスワードとは別のデータベースにあります。Linux にユーザーがないと失敗します。`pdbedit -a -u ユーザー名` でも追加できます。

### 問2 `LinuC202-2.11-002`

**正解**: B

**入力の別解**: `testparm -s`、`testparm /etc/samba/smb.conf`、`testparm -s /etc/samba/smb.conf`

`testparm` は、`smb.conf` の書き方を検査し、誤りがあれば表示します。`-s` を付けると、Enter を待たずに設定の中身まで表示します。

- A. `smbstatus` は、つないでいるクライアントなどの状態を表示します。
- C. `smbclient` は、共有につなぐクライアントです。
- D. `nmblookup` は、NetBIOS の名前を調べます。

### 問3 `LinuC202-2.11-003`

**正解**: C

`nmbd` は、NetBIOS の名前の解決(ワークグループの名前の一覧など)を受け持ちます。SMB を 445 番だけで使うなら、なくても動きます。

- A. `smbd` は、ファイルとプリンターの共有と、ユーザーの認証を受け持ちます。
- B. `winbindd` は、AD のユーザーとグループを、Linux から使えるようにします。
- D. `samba-tool` は、AD のドメインコントローラーとして使うときの管理のコマンドで、デーモンではありません。

### 問4 `LinuC202-2.11-004`

**正解**: A

`[homes]` は特別な節で、ログインしたユーザー自身のホームディレクトリを、そのユーザーの名前で共有します。`browseable = no`、`read only = no` などと一緒に書きます。

- B. `[global]` は、サーバー全体の設定の節です。
- C. `[printers]` は、プリンターの共有の特別な節です。
- D. `[profiles]` は、ホームディレクトリの共有を決める特別な節ではありません。

### 問5 `LinuC202-2.11-005`

**正解**: D

`security = ads` にすると、Samba は AD のメンバーサーバーとして、AD に認証を任せます。あわせて `realm`、`workgroup`、`idmap config` の設定と、AD への参加(`net ads join`)が要ります。`winbindd` が、AD のユーザーを Linux の UID、GID に対応づけます。

- A. `security = user` は、Samba のユーザー名とパスワードで、サーバー自身が認証する方式です。
- B. `passdb backend` は、パスワードを置く場所の設定で、`ads` という値はありません(`tdbsam` など)。
- C. `workgroup` は、ワークグループ(または AD のドメインの短い名前)を書く設定で、認証の方式は決めません。

### 問6 `LinuC202-2.11-006`

**正解**: C

`smbclient -L //サーバー -U ユーザー` は、サーバーの共有の一覧を表示します。

- A. `smbstatus` はサーバー自身で実行するもので、ほかのサーバーは指定しません。
- B. `testparm` の `-L` は、`%L` に入れるサーバー名を決めるオプションです。`testparm` は手元の `smb.conf` を検査するだけで、サーバーにはつながず、共有の一覧も取りません。
- D. `nmblookup` は、名前から IP アドレスを調べるコマンドで、共有の一覧は出ません。

### 問7 `LinuC202-2.11-007`

**正解**: `smbstatus`

`smbstatus` は、つないでいるクライアントと、使っている共有、ロックされたファイルの一覧を表示します。`-S` で共有、`-p` でプロセス、`-L` でロックだけを表示します。

### 問8 `LinuC202-2.11-008`

**正解**: A

`username map` のファイルは、`Linux のユーザー名 = Windows のユーザー名` の形で書きます。左が Linux、右が Windows です。Windows の名前は、空白で区切って、複数を書けます。

- B. 左右が逆です。この書き方では、Linux の `administrator` に、Windows の `root` を対応づけます。
- C. `map ...` という書き方は、ありません。
- D. 区切りは `=` で、`:` ではありません。

### 問9 `LinuC202-2.11-009`

**正解**: B、D

- A. `browseable = no` は、共有の一覧に表示しないだけで、アクセスの制限ではありません。
- B. `valid users = @staff` で、グループ staff のユーザーだけにアクセスを許します。
- C. `guest ok = yes` は、パスワードなしのゲストを許します。制限とは逆です。
- D. `read only` の既定は `yes` なので、書き込みを許すには `read only = no`(または `writable = yes`)が要ります。

### 問10 `LinuC202-2.11-010`

**正解**: B

`setfacl -m`(modify)で、ACL を足したり、変えたりします。`u:bob:rwx` は、ユーザー bob に rwx を許す、という意味です。`getfacl` は ACL を見るコマンドです。

- A. `getfacl` は ACL を表示するコマンドで、`-m` では変えられません。
- C. `setfacl -x` は、ACL を消します。
- D. `chmod` に、ユーザー名を指定する書き方はありません。

### 問11 `LinuC202-2.11-011`

**正解**: `smbcontrol all reload-config`

`smbcontrol all reload-config` は、smbd などのすべてのプロセスに、設定の再読み込みを伝えます。`smbcontrol smbd reload-config` でも、smbd に伝わります。サービスの再起動は要りません。

### 問12 `LinuC202-2.11-012`

**正解**: D

`%m` は、クライアントのコンピューター名(NetBIOS 名)です。`log file = /var/log/samba/log.%m` と書くと、クライアントごとに、`/var/log/samba/log.PC01` のようなログができます。

- A. ユーザー名は `%U` です。
- B. サーバーのホスト名は `%h` です。
- C. 共有の名前は `%S` です。

### 問13 `LinuC202-2.11-013`

**正解**: `nmblookup`

`nmblookup 名前` で、NetBIOS の名前から IP アドレスを調べます。`nmblookup -A IPアドレス` は逆に、IP アドレスから名前を調べます。

### 問14 `LinuC202-2.11-014`

**正解**: A

`samba-tool` は、Samba を AD のドメインコントローラーとして動かすときの管理のコマンドです。`samba-tool user create` で、ドメインのユーザーを作ります。`samba-tool domain provision` で、ドメインを作ります。

- B. `smbpasswd -a` は、`security = user` のサーバーで、Samba のユーザーを追加するコマンドです。
- C. `net ads join` は、サーバーを既存の AD に**参加させる**コマンドです。ユーザーは作りません。
- D. `pdbedit -a` は、主に `security = user` のサーバーで、Samba 内蔵のデータベースにユーザーを足すコマンドです。AD のドメインコントローラーでは、ユーザーは `samba-tool user create` で作ります。

### 問15 `LinuC202-2.11-015`

**正解**: B

`/etc/exports` では、ホストとかっこの間に、空白を入れません。`192.168.1.0/24(rw,sync)` で、そのネットワークに、読み書き(rw)と、ディスクに書いてから返事をする(sync)を許します。

- A. ホストとかっこの間の空白で、行が 2 つに分かれます。`192.168.1.0/24` には既定の `ro` が付き、かっこだけの `(rw)` は、すべてのホストに rw を許します。意図と逆に、公開が広がります。
- C. `(rw)` が、すべてのホストへの公開です。`192.168.1.0/24` には既定の `ro` が付きます。
- D. `:` を付けた書き方は、ホストの書式にありません。

### 問16 `LinuC202-2.11-016`

**正解**: `exportfs -ra`、`exportfs -r`、`exportfs -rav`、`exportfs -arv`、`exportfs -ar`、`exportfs -rv`、`exportfs -vr`、`exportfs -var`、`exportfs -vra`、`exportfs -avr`、`exportfs -rva`、`exportfs -r -a`、`exportfs -a -r`

`exportfs -r` は、`/etc/exports` に合わせて、公開の状態を整えます。`-a` ですべての行を対象にします。`-v` で、詳しく表示します。サービスの再起動は要りません。`systemctl reload nfs-server` も、中で `exportfs -r` を実行します。

### 問17 `LinuC202-2.11-017`

**正解**: C

`showmount -e サーバー` は、サーバーの mountd に問い合わせて、公開しているディレクトリの一覧を表示します。

- A. `nfsstat` は、NFS の統計を表示するコマンドで、`-e` では公開の一覧を取れません。
- B. `exportfs` は、サーバー自身で実行するコマンドで、ほかのサーバーは指定しません。
- D. `rpcinfo` は、RPC のサービスの一覧を表示します。公開しているディレクトリは出ません。

### 問18 `LinuC202-2.11-018`

**正解**: A

`root_squash` は、クライアントの root(UID 0)を、匿名のユーザー(`nobody` など)に変えます。クライアントの root が、サーバーのファイルを root の権限で書き換えるのを防ぎます。既定の設定です。

- B. サーバーの root のパスワードとは関係がありません。
- C. すべてのユーザーを匿名にするのは、`all_squash` です。
- D. 読み取り専用にするのは、`ro` です。

### 問19 `LinuC202-2.11-019`

**正解**: B、C

NFSv3 のクライアントは、rpcbind(111 番)でサービスのポートを聞き、`rpc.mountd` に、マウントを求めます。NFSv4 のクライアントは、2049 番(`nfsd`)だけにつなぎます。rpcbind は要りません。

- A. `winbindd` は、Samba で、AD のユーザーを解決するデーモンです。
- B. `rpcbind` は、ポートマッパーとして、RPC のサービスのポートを答えます。
- C. `rpc.mountd` は、マウントの要求が `/etc/exports` で許されているかを確かめます。
- D. `nmbd` は、Samba の NetBIOS の名前の解決のデーモンです。

### 問20 `LinuC202-2.11-020`

**正解**: D

`rpcinfo -p` は、rpcbind に登録されている RPC のサービスの一覧と、そのポート番号を表示します。

- A. `showmount -a` は、マウントしているクライアントの一覧です。
- B. `nfsstat -s` は、サーバーの統計です。
- C. `exportfs -v` は、公開しているディレクトリとオプションです。

### 問21 `LinuC202-2.11-021`

**正解**: `nfsstat -m`、`nfsstat --mounts`

`nfsstat -m` は、マウントしている NFS ごとに、サーバーと、マウントオプション(`hard`、`vers`、`rsize` など)を表示します。`/proc/mounts` でも、マウントの状態を確かめられます。

### 問22 `LinuC202-2.11-022`

**正解**: B

`/etc/fstab` は、「サーバー:ディレクトリ、マウントする場所、種類、オプション、dump、fsck」の順に書きます。`_netdev` は、ネットワークが使えるようになってからマウントする印です。

- A. 最初の 2 つの欄が逆です。
- C. サーバーとディレクトリの間の `:` がありません。
- D. `cifs` は、Samba(SMB)のファイル共有の種類です。NFSv4 は `nfs4` です。

### 問23 `LinuC202-2.11-023`

**正解**: C

`hard` は、サーバーが応答しないとき、応答があるまで再試行を続けます。プログラムは待たされますが、データは失われません。既定です。

- A. `soft` は、一定の回数で、エラーを返します。書き込みが失われる危険があります。
- B. `ro` は、読み取り専用でマウントします。再試行とは関係がありません。
- D. `nosuid` は、SUID のビットを無効にします。再試行とは関係がありません。

### 問24 `LinuC202-2.11-024`

**正解**: A、D

- A. 公開する相手を、必要なネットワークだけに絞ると、関係のないホストからはマウントできません。
- B. `*` はすべてのホスト、`no_root_squash` はクライアントの root をそのまま扱います。最も危険な組み合わせです。
- C. `async` は、書き込みの確認の前に返事をします。速くなりますが、サーバーが止まるとデータを失う危険があり、守りにはなりません。
- D. `root_squash` は、クライアントの root を匿名のユーザーに変えます。そのまま使います。
