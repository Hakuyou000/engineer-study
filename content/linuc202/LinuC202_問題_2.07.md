# LinuC202 問題 2.07 ネットワーククライアントの管理

対象: LinuC レベル2 202試験 / 全24問 / すべてオリジナル問題
対応テキスト: `LinuC202_2.07_ネットワーククライアントの管理.md`
解答・解説は末尾。

## 問題

### 2.07.1 DHCPサーバーの設定と管理

**問1** `LinuC202-2.07-001` ISC の dhcpd を、パッケージの標準の設定で動かす。メインの設定ファイルはどれか。

- A. `/etc/dhcp/dhcpd.conf`
- B. `/var/lib/dhcpd/dhcpd.conf`
- C. `/etc/dhcp/dhclient.conf`
- D. `/etc/default/dhcpd.conf`

**問2** `LinuC202-2.07-002` `dhcpd.leases` について正しいものはどれか。

- A. 特定の機器に固定のアドレスを渡す設定を書くファイルである。
- B. dhcpd のエラーメッセージを書き出すログのファイルである。
- C. 貸し出したアドレスと、借りた機器の MAC アドレス、期限などの記録である。
- D. クライアントが受け取った設定を覚えておくキャッシュである。

**問3** `LinuC202-2.07-003` dhcpd.conf に、次の `subnet` の宣言と `host` の宣言がある。`host` の宣言について正しいものはどれか。

```
subnet 192.0.2.0 netmask 255.255.255.0 {
    range 192.0.2.100 192.0.2.150;
    option routers 192.0.2.1;
}

host printer1 {
    hardware ethernet 52:54:00:12:34:56;
    fixed-address 192.0.2.10;
}
```

- A. `fixed-address` には、`range` の中のアドレスしか書けない。
- B. MAC アドレスが `52:54:00:12:34:56` の機器に、いつも `192.0.2.10` を渡す。
- C. `hardware ethernet` は、機器のホスト名を指定する書き方である。
- D. この `host` を書くと、ほかの機器への `range` の貸し出しが止まる。

**問4** `LinuC202-2.07-004` DHCP サーバーのいるネットワークとは別のサブネットのクライアントに、DHCP を使わせたい。両方のサブネットにつながるルーターで動かして、クライアントの要求をサーバーへ中継するプログラムの名前を答えよ(ISC のものとする)。

**問5** `LinuC202-2.07-005` IPv6 のルーター広告(RA)を送る radvd について、正しいものを**2つ**選べ。

- A. radvd は DHCPv6 のサーバーで、`/etc/radvd.conf` に `range6` を書いてアドレスを貸し出す。
- B. radvd は、`/etc/radvd.conf` の設定に従って、ルーター広告を送る。
- C. radvd を起動すると、そのルーターの IPv6 の転送も自動で有効になる。
- D. プレフィックスに `AdvAutonomous on` を付けて広告すると、クライアントは自分でそのプレフィックスのアドレスを作れる。

**問6** `LinuC202-2.07-006` 同じネットワークの機器の、IP アドレスと MAC アドレスの対応表(ARP テーブル)を表示するコマンドを答えよ。

### 2.07.2 PAM認証

**問7** `LinuC202-2.07-007` ログインしたユーザーに、プロセス数などの資源の上限を適用する `pam_limits` を、`/etc/pam.d/` のファイルに書く。どのタイプの行に書くのがふつうか。

- A. `auth`
- B. `account`
- C. `password`
- D. `session`

**問8** `LinuC202-2.07-008` `auth` の行が何行か並んでいる。あるモジュールが失敗したときに、続きの行を実行せずに、すぐ全体を失敗にする制御フラグはどれか。

- A. `required`
- B. `requisite`
- C. `sufficient`
- D. `optional`

**問9** `LinuC202-2.07-009` PAM の制御フラグについて、正しいものを**2つ**選べ。

- A. `required` は、失敗しても続きの行を最後まで実行してから、全体を失敗にする。
- B. `sufficient` は、失敗したら、すぐに全体を失敗にする。
- C. `optional` は、そのタイプに行が 1 つしかないときだけ、結果が全体に効く。
- D. `requisite` は、成功したら、続きの行を見ずに全体を成功にする。

**問10** `LinuC202-2.07-010` `/etc/denyusers` に名前を書いたユーザーだけを、sshd のログインから拒否したい。`/etc/pam.d/sshd` に足す行として正しいものはどれか。ファイルが読めないときは、拒否しない(成功とする)ものとする。

- A. `auth required pam_listfile.so item=user sense=deny file=/etc/denyusers onerr=succeed`
- B. `auth required pam_listfile.so item=tty sense=deny file=/etc/denyusers onerr=succeed`
- C. `auth required pam_listfile.so item=user sense=allow file=/etc/denyusers onerr=succeed`
- D. `auth sufficient pam_listfile.so item=user sense=deny file=/etc/denyusers onerr=succeed`

**問11** `LinuC202-2.07-011` Linux-PAM 1.5.0 で削除された `pam_cracklib` の後継で、パスワードの強さを検査するモジュールはどれか。

- A. `pam_limits`
- B. `pam_listfile`
- C. `pam_pwquality`
- D. `pam_deny`

**問12** `LinuC202-2.07-012` SSSD の設定ファイルを、フルパスで答えよ。

**問13** `LinuC202-2.07-013` LDAP のユーザーを、SSSD を通してログインさせたい。`/etc/nsswitch.conf` の `passwd` の行と、`auth` で呼ぶモジュールの組み合わせとして正しいものはどれか。

- A. `passwd: files ldap` と `pam_unix`
- B. `passwd: sss` と `pam_listfile`
- C. `passwd: files` と `pam_limits`
- D. `passwd: files sss` と `pam_sss`

### 2.07.3 LDAPクライアントの利用方法

**問14** `LinuC202-2.07-014` `ldap.conf` に既定のベースは書いていない。`ldap.example.com` に、`uid` が `taro` のエントリーの `mail` を、匿名で探したい。正しいコマンドはどれか。

- A. `ldapsearch -x -H ldap://ldap.example.com -b "dc=example,dc=com" "(uid=taro)" mail`
- B. `ldapsearch -x -H ldap://ldap.example.com -D "dc=example,dc=com" "(uid=taro)" mail`
- C. `ldapsearch -x -H ldap://ldap.example.com -b "dc=example,dc=com" "(mail=taro)" uid`
- D. `ldapsearch -x -H ldap://ldap.example.com -b "dc=example,dc=com" -s base "(uid=taro)" mail`

**問15** `LinuC202-2.07-015` LDIF のファイル `people.ldif` に書いたエントリーを、新しく追加したい。LDIF には `changetype` の行がない。使えるコマンドを**2つ**選べ。バインド DN とパスワードの指定は省略している。

- A. `ldapsearch -f people.ldif`
- B. `ldapadd -f people.ldif`
- C. `ldapmodify -a -f people.ldif`
- D. `ldapdelete -f people.ldif`

**問16** `LinuC202-2.07-016` `changetype: modify` と `replace: mail` を書いた LDIF を渡して、既存のエントリーの属性を書き換えたい。変更のためのコマンドで、`-a` を付けると `ldapadd` と同じ動きになるものの名前を答えよ。

**問17** `LinuC202-2.07-017` 管理者(`cn=admin,dc=example,dc=com`)として、`uid=taro,ou=People,dc=example,dc=com` のパスワードを、対話で入力した新しいパスワードに変えたい。正しいコマンドはどれか。管理者のパスワードも、対話で入力する。

- A. `ldappasswd -x -D "uid=taro,ou=People,dc=example,dc=com" -S "cn=admin,dc=example,dc=com"`
- B. `ldappasswd -x -D "cn=admin,dc=example,dc=com" -W -S "uid=taro,ou=People,dc=example,dc=com"`
- C. `ldappasswd -x -b "uid=taro,ou=People,dc=example,dc=com" -W -S`
- D. `ldappasswd -x -D "cn=admin,dc=example,dc=com" -W -s "uid=taro,ou=People,dc=example,dc=com"`

**問18** `LinuC202-2.07-018` `ou=Temp,dc=example,dc=com` と、その下にあるエントリーをまとめて削除したい。`ldapdelete` に付けるオプションはどれか。

- A. `-c`
- B. `-f`
- C. `-n`
- D. `-r`

### 2.07.4 OpenLDAPサーバーの設定

**問19** `LinuC202-2.07-019` DN が `uid=taro,ou=People,dc=example,dc=com` のエントリーの、RDN(相対識別名)はどれか。

- A. `uid=taro`
- B. `ou=People`
- C. `dc=example`
- D. `dc=com`

**問20** `LinuC202-2.07-020` slapd.conf の `index` に属性を足した。すでに入っているデータのインデックスを作り直すために、slapd を止めてから使うコマンドはどれか。

- A. `slapindex`
- B. `slapcat`
- C. `slapadd`
- D. `slappasswd`

**問21** `LinuC202-2.07-021` OpenLDAP の設定を LDAP のエントリー(`cn=config`)として持ち、slapd を止めずに `ldapmodify` で変えられる方式はどれか。

- A. `/etc/ldap/slapd.conf` を編集して、slapd を再起動する方式
- B. slapd-config
- C. `/var/lib/ldap/` の中のデータベースのファイルを、直接編集する方式
- D. `/etc/ldap/ldap.conf` に書くクライアントの設定

**問22** `LinuC202-2.07-022` OpenLDAP のデータベースに、次の `olcAccess` を設定した。意味として正しいものはどれか。

```
olcAccess: {0}to attrs=userPassword by self write by anonymous auth by * none
```

- A. だれでも、`userPassword` を読める。
- B. 本人は `userPassword` を書き換えられず、本人以外が書き換えられる。
- C. 本人は自分の `userPassword` を書き換えられ、匿名の接続は認証にだけ使え、それ以外は何もできない。
- D. 匿名の接続も、`userPassword` を検索して読める。

**問23** `LinuC202-2.07-023` OpenLDAP のスキーマで、属性や objectClass を世界で 1 つに決めるために付いている、`2.5.4.3` のようなドットで区切った数字の識別子はどれか。

- A. DN
- B. RDN
- C. LDIF
- D. OID

**問24** `LinuC202-2.07-024` OpenLDAP のデータベースの中身を、slapd を通さずに LDIF に書き出して、バックアップを取るコマンド名を答えよ。

## 解答・解説

### 問1 `LinuC202-2.07-001`

**正解**: A

**テキスト**: 1. DHCP と dhcpd

ISC dhcpd のメインの設定は `/etc/dhcp/dhcpd.conf` です。Red Hat 系(`dhcp-server`)も Debian 系(`isc-dhcp-server`)も、同じ場所です。

- B. `/var/lib/dhcpd/` は、貸し出しの記録(`dhcpd.leases`)を置く場所です。設定ファイルは置きません。
- C. `dhclient.conf` は、クライアント側(dhclient)の設定です。
- D. `/etc/default/` には、Debian 系でサービスの起動の設定(`isc-dhcp-server` ファイル)がありますが、`dhcpd.conf` という名前のファイルはありません。

### 問2 `LinuC202-2.07-002`

**正解**: C

**テキスト**: 1. DHCP と dhcpd

`dhcpd.leases` は、dhcpd が書く貸し出しの記録です。アドレス、MAC アドレス、期限、状態が残ります。Red Hat 系は `/var/lib/dhcpd/`、Debian 系は `/var/lib/dhcp/` にあります。

- A. 固定の割り当ては、`dhcpd.conf` の `host` の中に `hardware ethernet` と `fixed-address` で書きます。
- B. ログは syslog か journal に出ます。`journalctl -u dhcpd` などで見ます。
- D. クライアント側の記録は、`dhclient.leases` などで、別のファイルです。

### 問3 `LinuC202-2.07-003`

**正解**: B

**テキスト**: 3. 固定の割り当てと BOOTP

`hardware ethernet` で MAC アドレスを指定し、`fixed-address` で渡すアドレスを決めます。その MAC の機器には、いつも `192.0.2.10` が渡されます。`192.0.2.10` は `range`(100〜150)の外ですが、書けます。むしろ、`range` の外にするのがふつうです。

- A. `fixed-address` は、`range` の外でも書けます。
- C. `hardware ethernet` は MAC アドレスの指定です。ホスト名ではありません。
- D. `host` の宣言は、ほかの機器の `range` からの貸し出しには関係しません。

### 問4 `LinuC202-2.07-004`

**正解**: `dhcrelay`

**テキスト**: 4. リレーエージェント

ブロードキャストの Discover はルーターを越えられないので、**リレーエージェント**の `dhcrelay` が、サーバーへユニキャストで転送します。`dhcrelay -i eth0 -i eth1 198.51.100.10` のように、クライアント側とサーバー側のインターフェースと、サーバーのアドレスを指定します。DHCP サーバー側にも、リレー越しのサブネットの `subnet` の宣言が要ります。

### 問5 `LinuC202-2.07-005`

**正解**: B、D

**テキスト**: 6. DHCPv6 とルーター広告(radvd)

radvd は、`/etc/radvd.conf` に従って、定期的にルーター広告(RA)を送ります。`AdvAutonomous on` のプレフィックスは、クライアントが SLAAC で、自分でアドレスを作れます。

- A. DHCPv6 のサーバーは、dhcpd を `-6` で動かすものです。`range6` は dhcpd の設定で、radvd の設定ではありません。
- C. radvd は IPv6 の転送を有効にしません。`sysctl net.ipv6.conf.all.forwarding=1` が別に要ります。

### 問6 `LinuC202-2.07-006`

**正解**: `arp`、`arp -a`、`arp -n`、`arp -an`、`arp -e`、`ip neigh`、`ip neighbour`、`ip neighbor`、`ip n`、`ip neigh show`、`ip neigh list`、`ip neighbour show`、`ip neighbor show`

**テキスト**: 5. 保守とログ

`arp` は、ARP テーブル(IP アドレスと MAC アドレスの対応)を表示します。`arp -n` は、名前を引かずに表示します。新しい書き方は `ip neigh` です。

### 問7 `LinuC202-2.07-007`

**正解**: D

**テキスト**: 3. 主なモジュール

`pam_limits` は、ログインの前後の準備にあたる `session` のタイプで使います。`session required pam_limits.so` のように書き、`/etc/security/limits.conf` の上限を適用します。

- A. `auth` は、本人かどうかを確かめるタイプです。
- B. `account` は、アカウントが使ってよい状態か(期限切れなど)を確かめるタイプです。
- C. `password` は、パスワードを変える段階のタイプです。

### 問8 `LinuC202-2.07-008`

**正解**: B

**テキスト**: 2. 設定ファイルの 1 行

`requisite` は、失敗したらすぐに失敗を返し、続きの行を実行しません。

- A. `required` も、最終的には失敗になりますが、続きの行を最後まで実行します。
- C. `sufficient` は、成功したときにすぐ成功を返すもので、失敗は無視して続けます。
- D. `optional` は、そのタイプの唯一のモジュールでないかぎり、結果が全体に効きません。

### 問9 `LinuC202-2.07-009`

**正解**: A、C

**テキスト**: 2. 設定ファイルの 1 行

`required` は、失敗しても最後まで実行してから失敗を返します(どこで失敗したかを、ユーザーに悟らせないためです)。`optional` は、そのタイプの唯一のモジュールのときだけ、結果が効きます。

- B. `sufficient` は、失敗しても無視して続きの行へ進みます。失敗で即終了するのは `requisite` です。
- D. 成功したときにすぐ成功を返すのは `sufficient` です。`requisite` は、失敗したときにすぐ失敗を返します。

### 問10 `LinuC202-2.07-010`

**正解**: A

**テキスト**: 3. 主なモジュール

`pam_listfile` で `item=user sense=deny` と書くと、ファイルにあるユーザーは失敗します。`required` なので、その失敗は全体の失敗になります。`onerr=succeed` は、ファイルが読めないときは成功とします。

- B. `item=tty` は、端末の名前を調べます。ファイルにはユーザー名が書いてあるので合わず、拒否されません。
- C. `sense=allow` は、ファイルに書いてあるユーザーだけを許可し、ほかを拒否します。向きが逆です。
- D. `sufficient` は失敗を無視するので、ファイルにあるユーザーも拒否されません。さらに、ファイルにないユーザーは、ここで成功してパスワードの確認を飛ばすおそれがあります。

### 問11 `LinuC202-2.07-011`

**正解**: C

**テキスト**: 3. 主なモジュール

`pam_pwquality` は `pam_cracklib` の後継で、パスワードの強さを検査します。設定は `/etc/security/pwquality.conf` に書けます。`pam_cracklib` は Linux-PAM 1.5.0 で削除されました。Debian 系では `libpam-pwquality` を入れて使います【要確認】。

- A. `pam_limits` は、資源の上限を適用します。
- B. `pam_listfile` は、ファイルに書いた名前で、許可か拒否を決めます。
- D. `pam_deny` は、いつも失敗するモジュールです。

### 問12 `LinuC202-2.07-012`

**正解**: `/etc/sssd/sssd.conf`、`sssd.conf`

**テキスト**: 4. nsswitch.conf と SSSD

SSSD の設定は `/etc/sssd/sssd.conf` です。所有者を root、権限を `0600` にしないと、sssd は起動しません。

### 問13 `LinuC202-2.07-013`

**正解**: D

**テキスト**: 4. nsswitch.conf と SSSD

NSS の `passwd` の行に `sss` を足して、SSSD の持つユーザーを見えるようにします。認証は、`auth` で `pam_sss` が SSSD に頼みます。

- A. `ldap` は SSSD を通さずに LDAP を直接見る書き方で、SSSD は使われません。また `pam_unix` は、`/etc/passwd` と `/etc/shadow` で認証するもので、LDAP のパスワードは確かめられません。
- B. `pam_listfile` は、ファイルの名前で許可か拒否を決めるもので、認証をしません。
- C. `files` だけでは、LDAP のユーザーが見えません。`pam_limits` も、資源の上限のためのモジュールです。

### 問14 `LinuC202-2.07-014`

**正解**: A

**テキスト**: 3. ldapsearch(探す)

`-b` で探し始めるベースを指定し、`"(uid=taro)"` のフィルターで探し、最後に表示したい属性(`mail`)を書きます。`-x` は簡易認証で、バインド DN がないので匿名になります。

- B. `-D` はバインド DN(接続する名前)の指定で、ベースではありません。`dc=example,dc=com` というエントリーでバインドしようとして失敗し、ベースも決まりません。
- C. フィルターが `(mail=taro)` で、`mail` が `taro` のエントリーを探すことになります。属性の取り違えです。
- D. `-s base` は、ベースのエントリーだけを探します。その下の `uid=taro` のエントリーは見つかりません。

### 問15 `LinuC202-2.07-015`

**正解**: B、C

**テキスト**: 4. ldapadd、ldapmodify、ldapdelete

`ldapadd` は、LDIF のエントリーを追加します。`ldapmodify -a` は、`ldapadd` と同じ動きです。

- A. `ldapsearch` の `-f` は、ファイルに書いたフィルターで探すオプションです。追加はしません。
- D. `ldapdelete` の `-f` は、ファイルに書いた DN を削除します。追加の反対です。

### 問16 `LinuC202-2.07-016`

**正解**: `ldapmodify`

**テキスト**: 4. ldapadd、ldapmodify、ldapdelete

`ldapmodify` は、LDIF の `changetype: modify` に従って、`replace`(置き換え)、`add`(足す)、`delete`(消す)を行います。`ldapadd` も `changetype` の行に従いますが、変更には `ldapmodify` を使うのがふつうです。

### 問17 `LinuC202-2.07-017`

**正解**: B

**テキスト**: 5. ldappasswd(パスワードを変える)

`-D` でバインド DN(管理者)、`-W` でその管理者のパスワードの入力、`-S` で新しいパスワードの入力、最後に変える相手の DN を書きます。

- A. taro でバインドして管理者の DN を指定しています。逆です。また、`-W` がないので、バインドのパスワードがありません。
- C. `ldappasswd` に `-b` はありません。バインド DN の `-D` もないので、匿名になります。
- D. `-s` は、新しいパスワードそのものを次の引数に書くオプションです。DN の文字列が新しいパスワードとして扱われ、変える相手の DN もありません。

### 問18 `LinuC202-2.07-018`

**正解**: D

**テキスト**: 4. ldapadd、ldapmodify、ldapdelete

`ldapdelete -r` は、子のエントリーも含めて、再帰的に削除します。

- A. `-c` は、エラーがあっても続けるオプションです。子を持つエントリーは、消せません。
- B. `-f` は、DN を書いたファイルを読むオプションです。
- C. `-n` は、実行せずに、動作だけを表示するオプションです。

### 問19 `LinuC202-2.07-019`

**正解**: A

DN は、RDN を `,` でつなげたものです。いちばん左の `uid=taro` が、そのエントリー自身を表す RDN です。

- B. `ou=People` は、親のエントリーの RDN です。
- C. `dc=example` は、ドメインの部分の RDN です。
- D. `dc=com` は、根にいちばん近い RDN です。

### 問20 `LinuC202-2.07-020`

**正解**: A

**テキスト**: 5. slapadd、slapcat、slapindex

`slapindex` は、インデックスの設定を変えたあと、すでに入っているデータのインデックスを作り直します。slapd を止めてから実行します。slapd-config で、動いている slapd に `olcDbIndex` を足したときは、インデックスは裏で自動で作られます【要確認】。

- B. `slapcat` は、データベースの中身を LDIF に書き出します。
- C. `slapadd` は、LDIF からデータベースに足します。
- D. `slappasswd` は、ハッシュ化したパスワードの文字列を作ります。

### 問21 `LinuC202-2.07-021`

**正解**: B

**テキスト**: 2. 設定の方式: slapd-config(cn=config)

slapd-config は、設定を `cn=config` のエントリー(`slapd.d/` の LDIF のファイル)として持ちます。`ldapmodify -Y EXTERNAL -H ldapi:///` で、動いたまま変えられます。

- A. これは古い方式です。変えたら再起動が要ります。
- C. `/var/lib/ldap/` は、データを入れる場所で、設定ではありません。データベースのファイルを直接書き換えると、壊れます。
- D. `ldap.conf` は、`ldapsearch` などのクライアントが使う設定です。サーバーの設定ではありません。

### 問22 `LinuC202-2.07-022`

**正解**: C

**テキスト**: 6. アクセス制御(olcAccess)

`to attrs=userPassword` が対象で、本人は書き換え(`self write`)、匿名の接続は認証にだけ使え(`anonymous auth`)、それ以外は何もできません(`* none`)。パスワードのハッシュを、他人に読ませないための規則です。

- A. 本人以外は `none` です。読めません。
- B. 本人は `write` です。逆です。
- D. 匿名の接続は `auth` で、検索して読む権限(`search`、`read`)はありません。

### 問23 `LinuC202-2.07-023`

**正解**: D

**テキスト**: 3. スキーマ

スキーマの属性や objectClass には、OID が付いています。`cn` は `2.5.4.3` です。

- A. DN は、エントリーを決める名前(識別名)です。
- B. RDN は、DN のいちばん左の部分です。
- C. LDIF は、エントリーを文字で書く形式です。

### 問24 `LinuC202-2.07-024`

**正解**: `slapcat`

**テキスト**: 5. slapadd、slapcat、slapindex

`slapcat` は、データベースを直接読んで、LDIF にして出力します。`slapcat -b "dc=example,dc=com" -l backup.ldif` のように、`-b` でデータベースを、`-l` で出力のファイルを指定します。戻すときは `slapadd` を使います。
