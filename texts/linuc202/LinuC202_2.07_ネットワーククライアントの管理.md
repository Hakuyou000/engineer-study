# LinuC 202 テキスト 2.07 ネットワーククライアントの管理

ネットワークにつなぐ端末(クライアント)の面倒を見る仕組みを学びます。DHCP でアドレスを配り、PAM で認証の方法を決め、LDAP でユーザーの情報をまとめて持ちます。Red Hat 系(AlmaLinux / RHEL 9 系)と Debian 系(Ubuntu 24.04 / Debian 12)で違うところは、両方書きます。

## 2.07.1 DHCPサーバーの設定と管理 (重要度2)

### 1. DHCP と dhcpd

- **DHCP**(Dynamic Host Configuration Protocol)は、IP アドレス、サブネットマスク、デフォルトゲートウェイ、DNS サーバーなどを、端末に自動で配るプロトコルです。
- **dhcpd** は、Linux で使われる DHCP サーバーのデーモンです。ISC(Internet Systems Consortium)が作った ISC DHCP に入っています。
- ISC DHCP は、ISC が 2022 年に保守を終えています。後継は同じ ISC の **Kea** です。試験の範囲は dhcpd なので、ここでは dhcpd で学びます。Kea に移る流れは、配布元の情報で確かめてください【要確認】。

| | Red Hat 系 | Debian 系 |
|---|---|---|
| パッケージ | `dhcp-server` | `isc-dhcp-server` |
| 設定ファイル | `/etc/dhcp/dhcpd.conf` | `/etc/dhcp/dhcpd.conf` |
| 貸し出しの記録 | `/var/lib/dhcpd/dhcpd.leases` | `/var/lib/dhcp/dhcpd.leases` |
| サービス名 | `dhcpd` | `isc-dhcp-server` |
| 待ち受けるインターフェース | 設定ファイルの subnet に合うものを自動で選ぶ | `/etc/default/isc-dhcp-server` の `INTERFACESv4` に書く |

- Red Hat 系で `dhcp-server` を使えるかは、版で違います。RHEL 10 以降の扱いは確かめてください【要確認】。

### 2. 基本の設定(dhcpd.conf)

```
# 全体の既定値
default-lease-time 600;          # 貸し出しの期限(秒)
max-lease-time 7200;             # クライアントが求めても、これより長くはしない
option domain-name "example.com";
option domain-name-servers 192.0.2.53;
authoritative;                   # このサーバーを、このネットワークの正式な DHCP サーバーとする

# サブネットごとの設定
subnet 192.0.2.0 netmask 255.255.255.0 {
    range 192.0.2.100 192.0.2.150;       # 動的に貸し出す範囲
    option routers 192.0.2.1;            # デフォルトゲートウェイ
    option broadcast-address 192.0.2.255;
}
```

| 書き方 | 意味 |
|---|---|
| `subnet … netmask … { }` | サブネットの宣言。この中に、そのサブネット専用の設定を書く |
| `range 開始 終了;` | 動的に貸し出すアドレスの範囲 |
| `option routers` | デフォルトゲートウェイ |
| `option domain-name-servers` | DNS サーバー(コンマで複数) |
| `default-lease-time` / `max-lease-time` | 貸し出しの期限の既定値と上限(秒) |

- `option` を外側(全体)に書くと既定値になり、`subnet` の中に書くとそのサブネットだけで上書きします。**既定の設定と、サブネットごとの設定**です。
- サーバーが待ち受けるインターフェースに、そのサブネットのアドレスが付いていないと、`subnet` に合わず動きません。
- 設定を書き換えたら、再起動の前に文法を確かめます。

```bash
dhcpd -t -cf /etc/dhcp/dhcpd.conf     # 文法の検査(動かさない)
sudo systemctl restart dhcpd          # Debian 系は isc-dhcp-server
```

### 3. 固定の割り当てと BOOTP

特定の機器には、いつも同じアドレスを渡せます。機器の MAC アドレスで見分けます。

```
host printer1 {
    hardware ethernet 52:54:00:12:34:56;    # 機器の MAC アドレス
    fixed-address 192.0.2.10;               # 渡すアドレス
}
```

- `hardware ethernet` は MAC アドレスです。ホスト名ではありません。
- `fixed-address` は、`range` の外のアドレスにするのがふつうです(動的な貸し出しとぶつからないため)。
- **BOOTP** は DHCP の前身で、ネットワークブートの機器が今も使います。dhcpd は、BOOTP の問い合わせを既定で受け付けます(`deny bootp;` で止められます)。`host` で固定のアドレスを渡し、起動に使うファイルを `filename`、取りに行く先を `next-server` で渡します。

```
host diskless1 {
    hardware ethernet 52:54:00:ab:cd:ef;
    fixed-address 192.0.2.20;
    filename "pxelinux.0";        # 起動に使うファイル
    next-server 192.0.2.5;        # そのファイルを置いた TFTP サーバー
}
```

### 4. リレーエージェント

DHCP の最初の要求(Discover)は**ブロードキャスト**です。ブロードキャストはルーターを越えられないので、DHCP サーバーのいないサブネットでは、**リレーエージェント**が代わりに中継します。

```text
[client]  192.0.2.0/24 側
   |
   |  1. Discover(ブロードキャスト。ルーターを越えられない)
   v
[relay]   dhcrelay。両方のサブネットにつながるルーターなどで動かす
   |
   |  2. ユニキャストで DHCP サーバーへ転送(リレーのアドレスを付ける)
   v
[dhcpd]   198.51.100.10
   |
   |  3. リレーのアドレスから、どのサブネットの要求かを知り、range から選ぶ
   v
[client]  Offer がリレーを通って戻る
```

```bash
# リレーのサーバーで。192.0.2.1 側と、サーバー側の両方のインターフェースを指定する
sudo dhcrelay -i eth0 -i eth1 198.51.100.10
```

- DHCP サーバーには、リレー越しのサブネット(上の例なら `192.0.2.0/24`)の `subnet` 宣言が要ります。
- Red Hat 系では `dhcp-relay` パッケージ、Debian 系では `isc-dhcp-relay` パッケージに入っています。

### 5. 保守とログ

- `dhcpd.leases` は、貸し出したアドレス、機器の MAC アドレス、期限などの記録です。サーバーが書くもので、人は読むだけにします。

```
lease 192.0.2.100 {
  starts 3 2026/11/25 01:00:00;
  ends 3 2026/11/25 01:10:00;
  binding state active;
  hardware ethernet 52:54:00:12:34:56;
  client-hostname "pc01";
}
```

- ログは syslog か journal に出ます。

```bash
journalctl -u dhcpd -f               # Debian 系は -u isc-dhcp-server
grep dhcpd /var/log/syslog           # Debian 系(rsyslog がある場合)
```

- ログには `DHCPDISCOVER`、`DHCPOFFER`、`DHCPREQUEST`、`DHCPACK` が並びます。この順に流れれば、貸し出しは成功です。`no free leases` と出れば、`range` が足りません。
- **arp** は、同じネットワークの IP アドレスと MAC アドレスの対応表(ARP テーブル)を見るコマンドです。貸し出したアドレスが、本当にその機器のものかを確かめられます。

```bash
arp -n                    # 名前を引かずに表示(arp -a でも見られる)
ip neigh                  # 新しい書き方
```

### 6. DHCPv6 とルーター広告(radvd)

IPv6 では、アドレスの決め方が 3 通りあります。

```text
ルーターが RA(ルーター広告)を送る
   |
   +-- プレフィックスを広告し、AdvAutonomous on
   |       クライアントが自分でアドレスを作る(SLAAC)
   |
   +-- M フラグ(AdvManagedFlag on)
   |       アドレスを DHCPv6 サーバーからもらう
   |
   +-- O フラグ(AdvOtherConfigFlag on)
           アドレスは SLAAC。DNS などの情報だけ DHCPv6 からもらう
```

- **RA**(Router Advertisement、ルーター広告)は、ルーターが「このプレフィックスを使ってよい」と知らせる仕組みです。Linux では **radvd** が送ります。設定は `/etc/radvd.conf` です。
- **SLAAC** は、クライアントが RA のプレフィックスと自分のインターフェース ID から、アドレスを自分で作る方法です。
- **DHCPv6** は、IPv6 の DHCP です。IPv4 の DHCP とは別のプロトコルで、dhcpd も `-6` で動かし、`subnet6` と `range6` で書きます。

```
# /etc/radvd.conf(2001:db8::/32 は説明用のアドレス)
interface eth0 {
    AdvSendAdvert on;                  # RA を送る
    prefix 2001:db8:1::/64 {
        AdvOnLink on;
        AdvAutonomous on;              # クライアントが SLAAC でアドレスを作る
    };
};
```

```
# DHCPv6 の例(/etc/dhcp/dhcpd6.conf)
subnet6 2001:db8:1::/64 {
    range6 2001:db8:1::100 2001:db8:1::1ff;
    option dhcp6.name-servers 2001:db8:1::53;
}
```

- radvd を動かすルーターは、IPv6 の転送を有効にします(`sysctl net.ipv6.conf.all.forwarding=1`)。radvd は転送を有効にしません。
- DHCPv6 は、ルーターのアドレス(デフォルトゲートウェイ)を配りません。ルーターは RA で知らせます。

ポイント:
- 設定ファイルは `/etc/dhcp/dhcpd.conf`。貸し出しの記録は `dhcpd.leases`。
- 固定の割り当ては `host` の中の `hardware ethernet` と `fixed-address`。動的な範囲は `range`。
- 別のサブネットへは、リレー(dhcrelay)が中継する。
- IPv6 のルーター広告は radvd、アドレスの配布は DHCPv6。

## 2.07.2 PAM認証 (重要度3)

### 1. PAM とは

- **PAM**(Pluggable Authentication Modules)は、認証の仕組みを部品(モジュール)に分け、プログラムごとに組み合わせを選べるようにしたものです。
- ログイン、ssh、sudo などのプログラムは、自分で認証を書かず、PAM に任せます。認証の方法を変えるときに、プログラムを作り直さずに済みます。
- 設定は、プログラムごとのファイルが `/etc/pam.d/` に入っています(`/etc/pam.d/sshd`、`/etc/pam.d/sudo` など)。古い形式の `/etc/pam.conf` は、`/etc/pam.d/` がないときだけ使われます。

### 2. 設定ファイルの 1 行

```
# タイプ   制御フラグ   モジュール              引数
auth       required     pam_unix.so             nullok
```

**タイプ**は、何をする段階かです。

| タイプ | 役割 | 例 |
|---|---|---|
| `auth` | 本人かどうかを確かめる | パスワードを聞く |
| `account` | アカウントを使ってよいかを確かめる | 期限切れ、時間帯、ログインの許可 |
| `password` | 認証の情報(パスワード)を変える | パスワードの強さの検査 |
| `session` | ログインの前後の準備と後片付け | 資源の上限、ホームディレクトリーの作成 |

**制御フラグ**は、そのモジュールの結果をどう扱うかです。

| フラグ | 成功したとき | 失敗したとき |
|---|---|---|
| `required` | 続きの行も実行する | 続きの行も最後まで実行してから、失敗を返す |
| `requisite` | 続きの行も実行する | すぐに失敗を返し、続きの行は実行しない |
| `sufficient` | それまでに失敗した required がなければ、すぐに成功を返す | 無視して続きの行へ進む |
| `optional` | 結果は、そのタイプの唯一のモジュールのときだけ効く | 同じ |

- `include` や `substack` は、別のファイルの設定を取り込みます。
- `[success=1 default=ignore]` のような `[値=動作]` の書き方もあります。

```text
auth スタックの流れ(上から下へ)

auth  requisite   pam_listfile.so  ...    失敗 --> その場で全体が失敗
  |  成功
  v
auth  sufficient  pam_sss.so              成功 --> 全体が成功(ここで終わり)
  |  失敗
  v
auth  required    pam_unix.so             成功か失敗かを記録して続ける
  |
  v
auth  required    pam_deny.so             必ず失敗(ここまで来たら拒否)
```

### 3. 主なモジュール

| モジュール | 役割 |
|---|---|
| `pam_unix` | `/etc/passwd` と `/etc/shadow` で認証する。標準の認証 |
| `pam_sss` | SSSD に認証を頼む(LDAP などのユーザー用) |
| `pam_limits` | `/etc/security/limits.conf` の資源の上限(プロセス数、開けるファイルの数など)を、ログインしたユーザーに適用する。`session` で使う |
| `pam_listfile` | ファイルに書いたユーザー(やグループ、ホスト)で、許可か拒否を決める |
| `pam_cracklib` | パスワードの強さを検査する。古いモジュール |
| `pam_pwquality` | `pam_cracklib` の後継。設定は `/etc/security/pwquality.conf` |
| `pam_deny` / `pam_permit` | いつも失敗 / いつも成功 |
| `pam_faillock` | ログインの失敗を数えて、一定回数でロックする |

- `pam_cracklib` は Linux-PAM 1.5.0(2020 年)で削除されました。RHEL 9 系は `pam_pwquality` を既定で使います。Debian 系は `libpam-pwquality` を入れて使います【要確認】。試験では `pam_cracklib` の名前も出るので、同じ役割と覚えます。
- Red Hat 系の設定は、`/etc/pam.d/system-auth` や `password-auth` にまとまっていて、`authselect` で組み合わせを選びます。Debian 系は `/etc/pam.d/common-auth`、`common-password` などで、`pam-auth-update` で組み合わせを選びます。

pam_listfile の例です。

```
# /etc/denyusers に書いたユーザーの ssh を拒否する(/etc/pam.d/sshd)
auth  required  pam_listfile.so  item=user sense=deny file=/etc/denyusers onerr=succeed
```

- `item=user` は、ユーザー名を調べる。
- `sense=deny` は、ファイルにあれば拒否する(`sense=allow` は、ファイルにあるものだけ許可する)。
- `onerr=succeed` は、ファイルが読めないときは成功とする。

pam_limits の例です。

```
# /etc/pam.d/login に
session  required  pam_limits.so

# /etc/security/limits.conf に
taro   hard   nproc   100      # taro が持てるプロセスの数の上限
```

pam_pwquality の例です。

```
# /etc/security/pwquality.conf
minlen = 12        # 最低の長さ
minclass = 3       # 文字の種類(大文字、小文字、数字、記号)を 3 種類以上
```

### 4. nsswitch.conf と SSSD

- **nsswitch.conf**(Name Service Switch)は、ユーザー、グループ、ホスト名などの情報を、どこから調べるかを決めます。PAM が「認証できるか」を決めるのに対し、NSS は「そのユーザーは存在するか」を決めます。

```
# /etc/nsswitch.conf
passwd:   files sss
group:    files sss
shadow:   files sss
hosts:    files dns
```

- `files` は `/etc/passwd` などのファイル、`sss` は SSSD です。左から順に調べます。
- **SSSD**(System Security Services Daemon)は、LDAP や Active Directory などの認証の情報を取りに行き、手元に覚えておくデーモンです。`[domain/…]` に `cache_credentials = True` を書くと、サーバーにつながらなくても、覚えた認証の情報でログインできます(既定は False)。

```text
login / sshd
   |
   +-- PAM(pam_sss)   認証してよいか ----+
   |                                      v
   +-- NSS(sss)       ユーザーの情報 --> [sssd] --> LDAP サーバー
```

```
# /etc/sssd/sssd.conf(LDAP の最小の例)
[sssd]
services = nss, pam
domains = example

[domain/example]
id_provider = ldap
auth_provider = ldap
ldap_uri = ldap://ldap.example.com
ldap_search_base = dc=example,dc=com
cache_credentials = True
```

- `sssd.conf` は、所有者 root、権限 `0600` にします。ゆるいと、sssd は起動しません。
- 準備は次のとおりです。Red Hat 系は `sudo authselect select sssd` で、nsswitch.conf と PAM の設定を作ります。Debian 系は `sssd` と `libpam-sss`、`libnss-sss` を入れ、`pam-auth-update` で SSSD を有効にします。

```bash
sudo chmod 600 /etc/sssd/sssd.conf
sudo systemctl enable --now sssd
getent passwd taro        # NSS 経由でユーザーが見えるか
```

ポイント:
- PAM の 1 行は「タイプ、制御フラグ、モジュール、引数」。設定は `/etc/pam.d/`。
- `requisite` は失敗で即終了、`sufficient` は成功で即終了、`required` は最後まで実行。
- `pam_limits` は `session`。パスワードの強さは `pam_pwquality`(古くは `pam_cracklib`)。
- SSSD を使うときは、`nsswitch.conf` に `sss`、PAM に `pam_sss`。

## 2.07.3 LDAPクライアントの利用方法 (重要度2)

### 1. LDAP の基本

- **LDAP**(Lightweight Directory Access Protocol)は、ディレクトリー(木の形に整理した、検索に向いたデータベース)を読み書きするプロトコルです。ユーザーのアカウント、メールアドレス、部署などを 1 か所にまとめるのによく使います。
- ポートは 389(StartTLS を使えば暗号化できる)と 636(LDAPS)です。
- データは**エントリー**の木です。エントリーは、**DN**(Distinguished Name、識別名)で 1 つに決まります。

```text
dc=example,dc=com                       ルート(ベース)
  +-- ou=People                         ユーザーを入れる部署
  |     +-- uid=taro                    DN は uid=taro,ou=People,dc=example,dc=com
  |     +-- uid=hanako
  +-- ou=Groups
        +-- cn=staff
```

- DN は、末端から根に向かって、`,` でつなぎます。先頭の `uid=taro` を **RDN**(相対識別名)と言います。
- エントリーは、いくつかの**属性**(`uid`、`cn`、`mail` など)を持ちます。

### 2. 共通のオプション

クライアントのコマンド(`ldapsearch`、`ldapadd` など)は、同じオプションを使います。

| オプション | 意味 |
|---|---|
| `-H ldap://ldap.example.com` | サーバーの場所(URI)。省略すると `ldap.conf` の `URI` |
| `-x` | 簡易認証(単純なバインド)を使う。付けないと SASL を試す |
| `-D "cn=admin,dc=example,dc=com"` | **バインド DN**。この DN として接続する(バインドは、ログインのようなもの) |
| `-W` | パスワードを、聞いてもらって入力する |
| `-w パスワード` | パスワードをコマンドに書く(`ps` で見えるので避ける) |
| `-y ファイル` | パスワードをファイルから読む |
| `-ZZ` | StartTLS で暗号化する |
| `-b "dc=example,dc=com"` | 検索のベース(どこから探すか) |

- バインドの DN を省略すると、**匿名**で接続します。
- 既定のサーバーとベースは、設定ファイルに書けます。Red Hat 系は `/etc/openldap/ldap.conf`、Debian 系は `/etc/ldap/ldap.conf` です。

```
# ldap.conf
URI   ldap://ldap.example.com
BASE  dc=example,dc=com
```

### 3. ldapsearch(探す)

```bash
# uid が taro のエントリーの、cn と mail を表示する
ldapsearch -x -H ldap://ldap.example.com -b "dc=example,dc=com" "(uid=taro)" cn mail

# 管理者として、すべてのエントリーを表示する(出力を短く: -LLL)
ldapsearch -x -LLL -D "cn=admin,dc=example,dc=com" -W -b "dc=example,dc=com"
```

| 部分 | 意味 |
|---|---|
| `-b` | 探し始めるエントリー(ベース) |
| `-s base / one / sub` | 探す範囲。`base` はベースだけ、`one` は 1 つ下まで、`sub` は下すべて(既定) |
| `"(uid=taro)"` | **フィルター**。条件を `( )` で囲む |
| `cn mail` | 表示する属性。省略するとすべて |

- フィルターの例: `(uid=ta*)`(ワイルドカード)、`(&(objectClass=posixAccount)(uid=taro))`(かつ)、`(|(uid=taro)(uid=hanako))`(または)、`(!(uid=taro))`(否定)。
- 人の名前や電話番号を検索できる**ホワイトページ**(社内の電話帳)も、ldapsearch で引きます。

### 4. ldapadd、ldapmodify、ldapdelete

追加や変更の内容は、**LDIF**(LDAP Data Interchange Format)という文字の形式で書きます。

```
dn: uid=taro,ou=People,dc=example,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
uid: taro
cn: Taro Yamada
sn: Yamada
uidNumber: 10001
gidNumber: 10001
homeDirectory: /home/taro
mail: taro@example.com
```

```bash
# 追加(people.ldif のエントリーを足す)
ldapadd -x -D "cn=admin,dc=example,dc=com" -W -f people.ldif

# 変更(modify.ldif に changetype を書く)
ldapmodify -x -D "cn=admin,dc=example,dc=com" -W -f modify.ldif

# 削除(DN を指定する)
ldapdelete -x -D "cn=admin,dc=example,dc=com" -W "uid=taro,ou=People,dc=example,dc=com"
```

変更の LDIF は、`changetype` で動作を指定します。

```
dn: uid=taro,ou=People,dc=example,dc=com
changetype: modify
replace: mail
mail: taro.new@example.com
-
add: telephoneNumber
telephoneNumber: 03-0000-0000
```

- `replace` は値を置き換え、`add` は値を足し、`delete` は値を消します。`-` で操作を区切ります。
- `ldapadd` は、`ldapmodify -a` と同じです。
- `ldapdelete -r` は、子のエントリーも含めて消します。`-n` は、実行せずに動作だけを表示します。
- `-f` を付けないと、標準入力から LDIF を読みます。

### 5. ldappasswd(パスワードを変える)

```bash
# 管理者として、taro のパスワードを、聞かれて入力した新しいものに変える
ldappasswd -x -D "cn=admin,dc=example,dc=com" -W -S "uid=taro,ou=People,dc=example,dc=com"

# taro 自身が、自分のパスワードを変える
ldappasswd -x -D "uid=taro,ou=People,dc=example,dc=com" -W -A -S
```

| オプション | 意味 |
|---|---|
| `-S` | 新しいパスワードを聞いてもらって入力する |
| `-s 新しいパスワード` | 新しいパスワードをコマンドに書く |
| `-A` | 古いパスワードを聞いてもらって入力する |
| `-a 古いパスワード` | 古いパスワードをコマンドに書く |

- 最後に DN を書くと、その人のパスワードを変えます。省略すると、バインドした DN のパスワードです。
- 新しいパスワードを何も指定しないと、サーバーが作ったものが表示されます。

ポイント:
- 探すのは `ldapsearch`、足すのは `ldapadd`、書き換えるのは `ldapmodify`、消すのは `ldapdelete`、パスワードは `ldappasswd`。
- `-x`(簡易認証)、`-D`(バインド DN)、`-W`(パスワードを入力)、`-b`(ベース)はよく使う。
- 追加や変更の内容は LDIF で渡す(`-f`)。

## 2.07.4 OpenLDAPサーバーの設定 (重要度2)

### 1. OpenLDAP と slapd

- **OpenLDAP** は、オープンソースの LDAP サーバーです。サーバー本体のデーモンが **slapd** です。
- Debian 系は `slapd` と `ldap-utils` を入れます。Red Hat 系の RHEL 9 系には `openldap-servers` がありません。サーバーを動かすなら、別のリポジトリのパッケージか、コンテナを使います【要確認】。
- 設定の置き場所は次のとおりです。

| | Debian 系 | Red Hat 系(パッケージがある場合) |
|---|---|---|
| 設定 | `/etc/ldap/slapd.d/` | `/etc/openldap/slapd.d/` |
| データ | `/var/lib/ldap/` | `/var/lib/ldap/` |
| スキーマ | `/etc/ldap/schema/` | `/etc/openldap/schema/` |
| 動かすユーザー | `openldap` | `ldap` |

- Debian 系では、`sudo dpkg-reconfigure slapd` で、ドメイン名と管理者のパスワードを決めて、初期設定を作れます。

### 2. 設定の方式: slapd-config(cn=config)

OpenLDAP の設定には、2 つの方式があります。

| 方式 | 設定の持ち方 | 変更の方法 |
|---|---|---|
| 古い方式 | `/etc/ldap/slapd.conf` という 1 つのファイル | 編集して、slapd を再起動する |
| **slapd-config**(**cn=config**) | `slapd.d/` の下の、LDIF のファイル(ディレクトリーのエントリー) | `ldapmodify` で、動いたまま変える |

- いまの OpenLDAP は、**slapd-config**(**cn=config** という名前のエントリーの木)が標準です。`slapd.d/` の中のファイルは、直接編集しません。ldapmodify で変えます。
- ローカルの root が、設定を変えるときの接続は次のとおりです。

```bash
# cn=config を見る(root が、Unix ドメインソケットで接続する。-Y EXTERNAL は、接続した OS のユーザーで認証する)
sudo ldapsearch -Y EXTERNAL -H ldapi:/// -b cn=config -LLL "(olcDatabase=*)" dn
```

```text
cn=config                                    全体の設定
  +-- cn=schema                              スキーマ
  |     +-- cn={1}cosine ...
  +-- olcDatabase={0}config                  cn=config 自身
  +-- olcDatabase={1}mdb                     データを入れるデータベース
```

データベースの設定の主な属性です。

| 属性 | 意味 |
|---|---|
| `olcSuffix` | このデータベースの根の DN(例 `dc=example,dc=com`) |
| `olcRootDN` | 管理者の DN |
| `olcRootPW` | 管理者のパスワード(`slappasswd` で作った、ハッシュ化したもの) |
| `olcDbDirectory` | データのファイルを置く場所(`/var/lib/ldap`) |
| `olcDbIndex` | 検索を速くするインデックスを付ける属性 |
| `olcAccess` | アクセス制御 |

```
# 管理者のパスワードを変える LDIF
dn: olcDatabase={1}mdb,cn=config
changetype: modify
replace: olcRootPW
olcRootPW: {SSHA}…(slappasswd で作った文字列)
```

```bash
slappasswd -s 'S3cret!'            # ハッシュ化した文字列を作る
sudo ldapmodify -Y EXTERNAL -H ldapi:/// -f rootpw.ldif
```

### 3. スキーマ

- **スキーマ**は、エントリーに使える**属性**と **objectClass**(エントリーの種類。持つべき属性や、持ってよい属性の集まり)の決まりです。
- スキーマの中の属性や objectClass には、世界で 1 つに決まる番号 **OID**(`2.5.4.3` のような、ドットで区切った数字)が付いています。`cn` の OID は `2.5.4.3` です。自分で足すときは、組織用に割り当てを受けた OID の下に作ります。
- 主な objectClass です。

| objectClass | 使い道 |
|---|---|
| `top` | すべての根(必ず含まれる) |
| `organizationalUnit` | `ou=People` のような部署の入れ物 |
| `inetOrgPerson` | 人(名前、メール、電話) |
| `posixAccount` | Linux のアカウント(`uidNumber`、`gidNumber`、`homeDirectory`) |
| `posixGroup` | Linux のグループ |

- Linux のユーザーを入れるなら、`core`、`cosine`、`inetorgperson`、`nis`(posixAccount を含む)のスキーマを読み込みます。
- Debian 系の初期設定では、`cosine`、`nis`、`inetorgperson` はすでに読み込まれています。`sudo ldapsearch -Y EXTERNAL -H ldapi:/// -b cn=schema,cn=config -LLL dn` で確かめ、ないものだけを足します。

```bash
sudo ldapadd -Y EXTERNAL -H ldapi:/// -f /etc/ldap/schema/cosine.ldif
sudo ldapadd -Y EXTERNAL -H ldapi:/// -f /etc/ldap/schema/nis.ldif
sudo ldapadd -Y EXTERNAL -H ldapi:/// -f /etc/ldap/schema/inetorgperson.ldif
```

### 4. 最初のデータを入れる

ルートのエントリーと `ou` を、LDIF にして足します。

```
# base.ldif
dn: dc=example,dc=com
objectClass: top
objectClass: dcObject
objectClass: organization
o: Example
dc: example

dn: ou=People,dc=example,dc=com
objectClass: organizationalUnit
ou: People
```

```bash
ldapadd -x -D "cn=admin,dc=example,dc=com" -W -f base.ldif
```

- LDIF では、エントリーとエントリーを**空行**で区切ります。1 つ目の行は `dn:` です。行頭を空白にすると、前の行の続きになります。

### 5. slapadd、slapcat、slapindex

これらは、slapd を通さずに、**データベースのファイルを直接**扱うコマンドです。

| コマンド | 役割 |
|---|---|
| `slapadd` | LDIF から、データベースに直接足す(大量の入れ込み) |
| `slapcat` | データベースの中身を、LDIF にして書き出す(バックアップ) |
| `slapindex` | インデックスの設定を変えたあと、データのインデックスを作り直す |
| `slappasswd` | ハッシュ化したパスワードの文字列を作る |

```bash
sudo systemctl stop slapd
sudo slapcat -b "dc=example,dc=com" -l backup.ldif     # バックアップ
sudo slapcat -n 0 -l config-backup.ldif                # cn=config のバックアップ(-n 0)
sudo slapadd -b "dc=example,dc=com" -l backup.ldif     # 戻す
sudo slapindex                                         # インデックスの作り直し
sudo chown -R openldap:openldap /var/lib/ldap          # Red Hat 系は ldap:ldap
sudo systemctl start slapd
```

- `slapadd` と `slapindex` は、slapd を**止めてから**実行します。root で実行すると、できたファイルの所有者が root になるので、`chown` で動かすユーザーに戻します。
- slapd-config で、動いている slapd に `ldapmodify` で `olcDbIndex` を足すと、インデックスは裏で自動で作られます。slapd を止めて設定を変えたときや、slapd.conf の方式では、`slapindex` で作り直します【要確認】。
- `slapcat` は、動いていても読めますが、止めてから取るほうが確実です。
- データのファイルは `/var/lib/ldap/` にあります。エディターで書き換えません。

### 6. アクセス制御(olcAccess)

アクセス制御は、「何に(`to`)」「だれが(`by`)」「どこまで(権限)」を書きます。古い方式では `slapd.conf` の `access to …` で、`slapd.access(5)` に書き方があります。slapd-config では、`olcAccess` に書きます。

```
dn: olcDatabase={1}mdb,cn=config
changetype: modify
replace: olcAccess
olcAccess: {0}to attrs=userPassword by self write by anonymous auth by * none
olcAccess: {1}to * by self read by users read by * none
```

| 部分 | 意味 |
|---|---|
| `to attrs=userPassword` | 対象(userPassword という属性) |
| `by self write` | 本人は、書き換えられる |
| `by anonymous auth` | 匿名の接続は、認証にだけ使える(読めない) |
| `by * none` | それ以外は、何もできない |

- 権限は、弱いほうから `none`、`disclose`、`auth`、`compare`、`search`、`read`、`write`、`manage` です。強い権限は、弱いものも含みます。
- `{0}`、`{1}` は順番です。上から調べ、**最初に合った `to` の、最初に合った `by`** で決まります。
- 具体的な対象(`userPassword`)を先に、広い対象(`*`)を後に書きます。逆にすると、広いほうが先に合って、具体的な規則に届きません。

```text
接続が来る(だれとして?)
   |
   v
olcAccess を上から調べる
   |
   +-- to が対象に合わない: 次の olcAccess へ
   |
   +-- to が合った
          |
          v
       by を上から調べる。最初に合った by の権限で決まる
```

ポイント:
- 設定は slapd-config(cn=config)。`ldapmodify -Y EXTERNAL -H ldapi:/// ` で変える。
- データは `/var/lib/ldap/`。バックアップは `slapcat`、入れ込みは `slapadd`、インデックスは `slapindex`(slapd を止めて)。
- スキーマは属性と objectClass の決まりで、OID で識別する。
- アクセス制御は `olcAccess`。最初に合った規則で決まる。
