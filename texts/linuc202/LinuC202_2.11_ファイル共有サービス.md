# LinuC 202 テキスト 2.11 ファイル共有サービス

ネットワークの向こうのパソコンと、ファイルを共有する仕組みを学びます。Windows とつなぐための Samba と、Linux どうし(や UNIX 系)でつなぐための NFS が中心です。

## 2.11.1 Samba の設定と管理 (重要度4)

### 1. Samba とは

**Samba** は、Windows のファイル共有のプロトコル(**SMB**、昔の名前は CIFS)を Linux で話すためのソフトウェアです。Linux のディレクトリを、Windows から「ネットワークドライブ」として使えるようにします。このテキストは Samba 4 系です。

| デーモン | 役割 | 主なポート |
|---|---|---|
| `smbd` | ファイルとプリンターの共有、ユーザーの認証 | 445/tcp、139/tcp |
| `nmbd` | NetBIOS の名前の解決(ワークグループの名前の一覧など)。SMB を 445 番だけで使うなら、なくても動く | 137/udp、138/udp |
| `winbindd` | Active Directory(AD)のユーザーとグループを、Linux から使えるようにする | (クライアントの側) |

- **NetBIOS** は、昔の Windows が使っていた、名前でコンピューターを探す仕組みです。
- **ワークグループ**は、小さなネットワークで、コンピューターをまとめる名前です(既定は `WORKGROUP`)。
- **Active Directory**(AD)は、Windows のユーザーとコンピューターを、まとめて管理する仕組みです。

サービス名は、ディストリビューションで違います。

| | Red Hat 系(AlmaLinux、RHEL 9 系) | Debian 系(Ubuntu 24.04、Debian 12) |
|---|---|---|
| パッケージ | `samba`、`samba-client`、`samba-winbind` | `samba`、`smbclient`、`winbind` |
| サービス | `smb`、`nmb`、`winbind` | `smbd`、`nmbd`、`winbind` |
| 設定 | `/etc/samba/smb.conf` | `/etc/samba/smb.conf` |
| ログ | `/var/log/samba/` | `/var/log/samba/` |

```text
[Windows]  クライアント
        |
        |  SMB  445/tcp
        v
   [smbd]  smb.conf を読んで、共有とユーザーを決める
        |
        |  Linux のファイルを読み書き (Linux の権限と ACL が効く)
        v
   [共有のディレクトリ]: /srv/share など
```

### 2. smb.conf の構成

`/etc/samba/smb.conf` は、`[節の名前]` で区切り、`名前 = 値` で書きます。

```ini
[global]
    workgroup = WORKGROUP
    server string = File Server
    security = user
    passdb backend = tdbsam
    map to guest = Bad User
    log file = /var/log/samba/log.%m
    max log size = 1000

[homes]
    comment = Home Directories
    browseable = no
    read only = no

[share]
    path = /srv/share
    read only = no
    valid users = @staff
    create mask = 0664
    directory mask = 0775
```

| 節 | 意味 |
|---|---|
| `[global]` | サーバー全体の設定 |
| `[homes]` | ログインしたユーザー自身のホームディレクトリを、そのユーザーの名前で自動的に共有する特別な節 |
| `[printers]` | プリンターの共有の特別な節 |
| `[share]` など | 共有の 1 つ。名前が、Windows から見える共有名 |

| パラメーター | 意味 |
|---|---|
| `workgroup` | ワークグループ名(AD では、ドメインの短い名前) |
| `security` | 認証の方式。`user`(Samba のユーザー名とパスワードで認証。既定)、`ads`(AD のメンバーとして、AD に認証を任せる) |
| `passdb backend` | ユーザーのパスワードを置く場所。`tdbsam`(Samba の内蔵のデータベース。既定) |
| `map to guest` | `Bad User`: 存在しないユーザー名でのログインをゲストとして扱う。`Never`: 扱わない |
| `path` | 共有するディレクトリ |
| `read only` | `no` で書き込みを許す(`writable = yes` と同じ意味) |
| `browseable` | `no` で、共有の一覧に表示しない(アクセスの制限ではない) |
| `valid users` | アクセスを許すユーザー(`@グループ名` でグループ) |
| `guest ok` | `yes` で、パスワードなしのゲストを許す |
| `create mask`、`directory mask` | 新しく作るファイル、ディレクトリのパーミッション |
| `username map` | Windows のユーザー名を、Linux のユーザー名に対応づけるファイル |
| `log file`、`log level` | ログの場所と詳しさ。`%m` はクライアントのコンピューター名(NetBIOS 名) |

- `%U`(ユーザー名)、`%m`(クライアントの名前)、`%h`(サーバーのホスト名)のような `%` の記号を、値の中で使えます。
- `smb.conf` を変えたら、**`testparm`** で書き方を検査します。`testparm` は、誤りを表示し、設定を整えて出力します。

```bash
testparm              # 検査して、設定を表示する (Enter を押す)
testparm -s           # Enter を待たずに、設定だけを表示する
testparm -v           # 既定値も含めて表示する
sudo smbcontrol all reload-config       # smbd に設定を読み込み直させる
sudo systemctl reload smb               # Red Hat 系。Debian 系は smbd
```

### 3. ユーザーの追加

Samba には、Linux とは別に、Samba 用のパスワードのデータベースがあります。共有を使う人は、**まず Linux のユーザーとして存在し、そのうえで Samba に追加します**。

```bash
sudo useradd -M -s /sbin/nologin alice      # Linux のユーザー (ログインさせない例)
sudo smbpasswd -a alice                     # Samba に追加し、パスワードを設定する
sudo pdbedit -L                             # Samba のユーザーの一覧
sudo smbpasswd -d alice                     # 無効にする
sudo smbpasswd -e alice                     # 有効に戻す
sudo smbpasswd -x alice                     # Samba のユーザーから消す
```

- `smbpasswd -a` は、Linux にユーザーがないと失敗します。
- `pdbedit -a -u alice` でも、Samba のユーザーを追加できます。

**ユーザー名の対応**(`username map`)は、Windows のユーザー名が、Linux のユーザー名と違うときに使います。

```ini
# smb.conf の [global]
username map = /etc/samba/smbusers
```

```text
# /etc/samba/smbusers  (Linux の名前 = Windows の名前)
root = administrator admin
alice = Alice.Smith
```

### 4. 道具の一覧

| コマンド | 動き |
|---|---|
| `smbclient -L //サーバー -U ユーザー` | サーバーの共有の一覧(`-N` でパスワードなし) |
| `smbclient //サーバー/共有 -U ユーザー` | FTP のように共有に入って、`ls`、`get`、`put` をする |
| `smbstatus` | つないでいるクライアント、使っている共有、ロックされたファイルの一覧(`-S` 共有、`-p` プロセス、`-L` ロック) |
| `smbcontrol all reload-config` | smbd などに、設定の再読み込みを伝える(`smbcontrol smbd reload-config`) |
| `nmblookup 名前` | NetBIOS の名前から IP アドレスを調べる(`nmblookup -A IPアドレス` は逆) |
| `testparm` | smb.conf の検査 |
| `smbpasswd`、`pdbedit` | Samba のユーザーの管理 |
| `net ads join -U Administrator` | このサーバーを AD に参加させる(`net ads info` で情報、`net rpc` は NT4 型のドメインや Windows のサーバーの操作) |
| `samba-tool` | Samba を AD のドメインコントローラー(DC)として動かすときの管理(`samba-tool user create`、`samba-tool domain provision`) |
| `getfacl`、`setfacl` | Linux のファイルの ACL を見る、変える |

Windows からでなく、Linux から共有を使うときは、`cifs-utils` の `mount` を使います。

```bash
sudo mount -t cifs //server/share /mnt -o username=alice
```

### 5. ACL とセキュリティ

共有するファイルは、Linux のファイルです。Samba の設定と、**Linux のパーミッション**の**両方が許したときだけ**、アクセスできます。

```text
Windows から書き込む
        |
        v
   smb.conf の許可: read only = no、valid users に入っている
        |
        v
   Linux のパーミッション: ユーザー、グループ、ACL が書き込みを許している
        |
        v
   (Red Hat 系は SELinux も): samba_share_t などのラベル
```

ユーザーやグループごとに細かく許可するには、**ACL**(アクセス制御リスト)を使います。

```bash
getfacl /srv/share                          # ACL を見る
sudo setfacl -m u:bob:rwx /srv/share        # bob に rwx を足す
sudo setfacl -m g:staff:rwx /srv/share      # staff グループに rwx を足す
sudo setfacl -d -m g:staff:rwx /srv/share   # これから作るファイルの既定の ACL
sudo setfacl -R -m u:bob:rx /srv/share      # 中のすべてにも
sudo setfacl -x u:bob /srv/share            # bob の ACL を消す
```

- ACL を使うには、ファイルシステムが ACL に対応している必要があります(ext4 と XFS は、既定で使えます)。
- Samba で Windows の ACL も保つには、`vfs objects = acl_xattr` などを使います。【要確認】
- **security = ads** にすると、AD のユーザーとグループが使え、パスワードは AD が確かめます。`realm = EXAMPLE.COM`、`workgroup = EXAMPLE`、`idmap config` の設定が要ります。`winbindd` が、AD のユーザーを Linux の UID、GID に対応づけます。
- ファイアウォールでは、`samba` のサービスを許可します(`firewall-cmd --permanent --add-service=samba`)。
- Red Hat 系の SELinux では、共有するディレクトリに `samba_share_t` のラベルを付けます。ホームディレクトリの共有には、`setsebool -P samba_enable_home_dirs on` が要ります。

### 6. 困ったときの調べ方

| 症状 | 見るところ |
|---|---|
| `smb.conf` を変えたら動かない | `testparm` で誤りを探す |
| ログインできない | `pdbedit -L` で Samba のユーザーがあるか、`smbpasswd` でパスワードを設定したか |
| 共有が見えない、入れない | `smbclient -L //localhost -U ユーザー` で、サーバー側から試す。`valid users`、パーミッション、SELinux、ファイアウォール |
| 書き込めない | `read only = no` か、Linux のパーミッションと ACL |
| 名前で見つからない | `nmblookup`、`nmbd` が動いているか |
| 詳しい理由が知りたい | `/var/log/samba/` のログ(`log.smbd`、クライアントごとの `log.クライアント名`)。`log level = 2` などで詳しくする |

## 2.11.2 NFS サーバーの設定と管理 (重要度3)

### 1. NFS とは

**NFS**(Network File System)は、Linux や UNIX 系で、ほかのコンピューターのディレクトリを、自分のディレクトリのようにマウントして使う仕組みです。サーバーが**エクスポート**(公開)したディレクトリを、クライアントが**マウント**します。

| | NFSv3 | NFSv4 |
|---|---|---|
| 使うポート | 2049 のほかに、rpcbind(111)、mountd、statd、lockd など、複数 | **2049/tcp だけ** |
| 必要なサービス | `rpcbind`、`rpc.mountd` | ネットワークで待ち受けるのは `nfsd`(2049)だけ。rpcbind は不要。`rpc.mountd` はサーバーの中で公開の確認に使う |
| 認証 | AUTH_SYS(クライアントが送る UID を信じる)が中心。Kerberos(`sec=krb5`)も使える | Kerberos(`sec=krb5`)も使える |
| 名前の対応 | UID と GID の数字 | `ユーザー名@ドメイン` の名前(idmapd) |

```text
NFSv3
  [client]
     |
     +--> rpcbind  111       まずポートを聞く
     +--> mountd             マウントの許可を確かめる
     +--> nfsd     2049      ファイルの読み書き

NFSv4
  [client]
     |
     +--> nfsd     2049/tcp  これだけ
```

- 現在の Linux では、NFSv4 を使うのがふつうです。設定の記録は `/etc/nfs.conf` にあります(`[nfsd]` の `vers3 = n` で v3 を止められます)。
- ファイアウォールは、v4 だけなら、`firewall-cmd --permanent --add-service=nfs`(2049 番)で足ります。

サーバーのパッケージとサービスです。

| | Red Hat 系 | Debian 系 |
|---|---|---|
| サーバー | `nfs-utils`、サービス `nfs-server` | `nfs-kernel-server`、サービス `nfs-kernel-server`(別名 `nfs-server`) |
| クライアント | `nfs-utils` | `nfs-common` |

### 2. /etc/exports

`/etc/exports` に、公開するディレクトリと、公開する相手とオプションを書きます。

```text
/srv/share   192.168.1.0/24(rw,sync,no_subtree_check)
/srv/public  *.example.com(ro)  192.168.1.10(rw)
```

書式は、`ディレクトリ  ホスト(オプション)  ホスト(オプション)` です。ホストの書き方は、次のとおりです。

| 書き方 | 意味 |
|---|---|
| `192.168.1.10` | 1 台のホスト |
| `192.168.1.0/24` | ネットワーク全体 |
| `*.example.com` | ワイルドカードを使ったホスト名 |
| `@groupname` | ネットグループ |
| `*` | すべてのホスト |

主なオプションです。

| オプション | 意味 |
|---|---|
| `ro` / `rw` | 読み取り専用(既定)/ 読み書き |
| `sync` / `async` | 書き込みをディスクに書いてから返事をする(既定)/ 返事を先にする(速いが、停電で失う危険) |
| `root_squash` | クライアントの root(UID 0)を、匿名のユーザー(`nobody`)に変える(既定) |
| `no_root_squash` | クライアントの root を、root のまま扱う(危険) |
| `all_squash` | すべてのユーザーを、匿名のユーザーに変える |
| `anonuid`、`anongid` | 匿名のユーザーに使う UID、GID |
| `no_subtree_check` | サブツリーの検査をしない(現在の既定) |
| `sec=sys` / `sec=krb5` など | 認証の方式 |

**注意: ホストとかっこの間に空白を入れると、意味が変わります。**

```text
/srv/share  192.168.1.0/24(rw)      192.168.1.0/24 に、rw を許す (正しい)
/srv/share  192.168.1.0/24 (rw)     192.168.1.0/24 には、既定の ro。
                                    そのうえ、すべてのホストに rw を許す (危険)
```

空白で区切ると、「前のものは、そのホストのオプションが無し(既定)」「かっこだけのものは、すべてのホストのオプション」と読まれます。

### 3. サーバーの操作

```bash
sudo systemctl enable --now nfs-server     # Debian 系は nfs-kernel-server
sudo exportfs -ra                          # /etc/exports を読み込み直す
sudo exportfs -v                           # 今公開しているものとオプション
sudo exportfs -u 192.168.1.0/24:/srv/share # 公開をやめる
```

| コマンド | 動き |
|---|---|
| `exportfs -r` | `/etc/exports` に合わせて、公開の状態を整える(再起動は要らない) |
| `exportfs -a` | `/etc/exports` のすべてを公開する |
| `exportfs -v` | 公開しているものを、オプションも含めて詳しく表示する |
| `exportfs -u` | 公開をやめる |
| `showmount -e サーバー` | サーバーが公開しているものの一覧(mountd に問い合わせる) |
| `showmount -a` | 今マウントしているクライアントの一覧(v3 の mountd が記録) |
| `rpcinfo -p サーバー` | rpcbind(ポートマッパー)に登録されている RPC のサービスの一覧(`mountd`、`nfs` など) |
| `nfsstat -s` / `-c` | サーバー / クライアントの統計 |
| `nfsstat -m` | マウントしている NFS ごとの、マウントオプション |

- **rpcbind**(ポートマッパー)は、RPC のサービスが、どのポートを使っているかを答えるサービスです(111 番)。v3 のクライアントは、まず rpcbind に聞いてから、mountd と nfsd につなぎます。
- **mountd**(`rpc.mountd`)は、v3 で、マウントの要求が `/etc/exports` で許されているかを確かめるデーモンです。v4 でも、サーバーの中で、カーネルの nfsd からの公開の問い合わせに答えます(ネットワークでは待ち受けません)。
- v4 だけのサーバーでは、mountd がネットワークで待ち受けないので、`showmount -e` は使えません。

### 4. クライアントのマウント

```bash
sudo mount -t nfs4 server:/srv/share /mnt/share
sudo mount -t nfs4 -o ro,hard,vers=4.2 server:/srv/share /mnt/share
```

`/etc/fstab` に書くと、起動のときにマウントされます。

```text
server:/srv/share  /mnt/share  nfs4  defaults,_netdev  0 0
```

| 欄 | 内容 |
|---|---|
| 1 | `サーバー:公開されたディレクトリ` |
| 2 | マウントする場所 |
| 3 | `nfs4`(または `nfs`) |
| 4 | オプション。`_netdev` は、ネットワークが使えるようになってからマウントする印 |
| 5、6 | dump と fsck の順番。NFS では `0 0` |

マウントのオプションです。

| オプション | 意味 |
|---|---|
| `hard`(既定) | サーバーが応答しないとき、応答があるまで再試行を続ける(プログラムは待つ) |
| `soft` | 一定の回数で、エラーを返す(データが壊れる危険がある) |
| `ro` / `rw` | 読み取り専用 / 読み書き |
| `nosuid`、`noexec` | SUID の無効、実行の禁止 |
| `rsize`、`wsize` | 読み書きの 1 回のサイズ |
| `vers=4.2` | NFS のバージョン |
| `nofail` | マウントできなくても、起動を続ける |

- 今のマウントは、`/proc/mounts` や `nfsstat -m`、`findmnt -t nfs4` で確かめます。
- `umount /mnt/share` で外します。使用中で外せないときは、`fuser -vm /mnt/share` で、使っているプロセスを探します。

### 5. NFS を守る

NFS の既定は、クライアントの UID を信じる仕組みです。クライアントの root を持つ人は、ほかのユーザーのファイルも読めます。次のように守ります。

| 対策 | 内容 |
|---|---|
| 公開する相手を絞る | `/etc/exports` に、ネットワークや台数を限って書く。`*` は避ける |
| `root_squash` を使う | クライアントの root を匿名に変える。`no_root_squash` は必要なときだけ |
| `ro` を使う | 書き込みが要らないものは読み取り専用で公開する |
| ファイアウォール | 2049 番(v3 は rpcbind なども)を、クライアントのネットワークだけに開ける |
| `sec=krb5` | Kerberos で認証する(v4 で使うのがふつう) |
| クライアントの `nosuid`、`noexec` | NFS 上のファイルから、権限の昇格をさせない |
| v3 を止める | v4 だけにして、開けるポートを減らす |
