# LinuC 202 テキスト 2.10 電子メールサービス

メールを送る、受け取る、読むための仕組みを学びます。送る側のサーバーは Postfix、読む側のサーバーは Dovecot が中心です。

## 2.10.1 Postfix の設定と管理 (重要度3)

### 1. メールが届くまでの流れ

メールのソフトウェアは、役割ごとに名前が付いています。

| 略称 | 名前 | 役割 | 例 |
|---|---|---|---|
| MUA | メールユーザーエージェント | 人が使うメールソフト(送る、読む) | Thunderbird、Outlook、`mail` コマンド |
| MTA | メール転送エージェント | メールを受け取り、相手のサーバーへ送り届ける | Postfix、Exim、Sendmail |
| MDA | メール配送エージェント | 受け取ったメールを、利用者のメールボックスに入れる | Postfix の `local`、Dovecot の LMTP |
| (読み出し) | POP3 / IMAP サーバー | 利用者のメールソフトに、メールボックスの中身を渡す | Dovecot |

メールを送るときのプロトコルは **SMTP**(Simple Mail Transfer Protocol、TCP 25 番)です。メールを読むときのプロトコルは **POP3** と **IMAP** です(2.10.2 で学びます)。

```text
[MUA]  送る人
   |
   |  SMTP (送信は 587 番)
   v
[MTA]  Postfix  自分のメールサーバー
   |
   |  SMTP (port 25): DNS の MX レコードで相手のサーバーを探す
   v
[MTA]  Postfix  相手のメールサーバー
   |
   |  MDA が配送
   v
[mailbox]  /var/mail/ や ~/Maildir/
   ^
   |  POP3 / IMAP  Dovecot が読み出す
   |
[MUA]  読む人
```

- Postfix は、Red Hat 系(AlmaLinux、RHEL 9 系)では `postfix` パッケージ、Debian 系(Ubuntu 24.04、Debian 12)でも `postfix` パッケージで入ります。サービス名はどちらも `postfix` です。
- Exim は、Postfix と同じ MTA です。Debian では、標準で入る MTA として使われてきました(パッケージ名は `exim4`、設定は `/etc/exim4/`)。LinuC では、Postfix が中心で、Exim は「Postfix のほかにも MTA がある」ことを知っていれば足ります。

### 2. 設定ファイルとディレクトリ

| 場所 | 内容 |
|---|---|
| `/etc/postfix/main.cf` | 主な設定。`パラメーター = 値` の形で書く |
| `/etc/postfix/master.cf` | Postfix のプロセス(smtpd、pickup、submission など)の起動の設定 |
| `/etc/aliases` | メールの宛先の別名(エイリアス)を書く |
| `/var/spool/postfix/` | メールのキュー(まだ配送が終わっていないメール)を置く場所 |
| `/var/spool/mail/`、`/var/mail/` | 既定のメールボックス(mbox 形式。1 人 1 ファイル) |

`/var/spool/postfix/` の下には、メールの状態ごとにディレクトリがあります。

| ディレクトリ | 状態 |
|---|---|
| `incoming` | 受け取ったばかりのメール |
| `active` | いま配送しているメール |
| `deferred` | 配送に失敗して、あとで再試行するメール |
| `hold` | `postsuper -h` で、止めておくメール |

Postfix の設定を確かめる、変えるときは、`postconf` を使います。

```bash
postconf                       # すべての設定値(既定値も含む)
postconf -n                    # 既定値と違う設定だけ
postconf -d                    # 既定値の一覧
postconf myhostname            # 1 つのパラメーターの今の値
sudo postconf -e 'inet_interfaces = all'   # main.cf を書き換える
sudo postfix check             # 設定ファイルの誤りを調べる
sudo systemctl reload postfix  # 設定を読み込み直す
```

### 3. main.cf の主なパラメーター

| パラメーター | 意味 |
|---|---|
| `myhostname` | このサーバーの FQDN(例: `mail.example.com`) |
| `mydomain` | このサーバーのドメイン名(例: `example.com`)。既定では `myhostname` の最初のドットより後ろ |
| `myorigin` | このサーバーから出すメールの `@` の後ろに付けるドメイン名。既定は `$myhostname` |
| `mydestination` | 自分宛てとして**ローカルに配送する**ドメインの一覧。ここにないドメイン宛ては、中継か拒否 |
| `mynetworks` | 信頼するクライアントのネットワーク。ここからのメールは中継を許す(例: `127.0.0.0/8, 192.168.1.0/24`) |
| `inet_interfaces` | SMTP を待ち受けるネットワークインターフェース(`all`、`loopback-only`、特定のアドレス) |
| `home_mailbox` | 利用者のホームディレクトリの下に置くメールボックス。`Maildir/` と書くと Maildir 形式 |
| `relayhost` | 自分で配送せず、すべてのメールを渡す先(社内の中継サーバー、プロバイダーのサーバー) |
| `alias_maps` | エイリアスのファイル(例: `hash:/etc/aliases`) |

```ini
myhostname = mail.example.com
mydomain = example.com
myorigin = $mydomain
inet_interfaces = all
mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain
mynetworks = 127.0.0.0/8, 192.168.1.0/24
home_mailbox = Maildir/
```

- `$mydomain` のように、`$` を付けて、ほかのパラメーターの値を使えます。
- 変えたら `systemctl reload postfix`(または `postfix reload`)で反映します。
- Postfix の `inet_interfaces` の既定値は `all` です。ただし、Red Hat 系が配布する `main.cf` には `inet_interfaces = localhost` が書いてあり、そのままでは外からのメールを受け取れません。`postconf -n` で確かめます。

### 4. エイリアスと newaliases

`/etc/aliases` は、宛先の名前を別の宛先に読み替えます。

```text
# /etc/aliases
postmaster: root
root:       admin
webmaster:  alice, bob
```

- `/etc/aliases` を編集したら、**`newaliases`** を実行します。`newaliases` は、`/etc/aliases` から Postfix が読むデータベース(`/etc/aliases.db`)を作り直します。実行しないと、変更は反映されません。
- `postalias /etc/aliases` と `sendmail -bi` も同じ働きです。

### 5. 仮想ドメイン

1 台のサーバーで、複数のドメイン(例: `example.com` と `example.net`)のメールを受け取るために、**仮想ドメイン**を使います。いちばん簡単なのは**仮想エイリアス**です。

```ini
# main.cf
virtual_alias_domains = example.net
virtual_alias_maps = hash:/etc/postfix/virtual
```

```text
# /etc/postfix/virtual
info@example.net     alice@example.com
@example.net         bob@example.com
```

- 仮想エイリアスは、別のドメイン宛てのメールを、すでにあるユーザー宛てに振り替えます。
- `/etc/postfix/virtual` を変えたら、**`postmap /etc/postfix/virtual`** で、読み込む用のデータベース(`virtual.db`)を作ります。`newaliases` は `/etc/aliases` 専用です。
- 仮想メールボックス(`virtual_mailbox_domains`)を使うと、Linux のユーザーを作らずに、メールボックスだけを持てます。

### 6. 中継の制限(オープンリレーを防ぐ)

**中継**(リレー)は、受け取ったメールを、自分宛てでないドメインへ送ることです。誰からの中継でも受ける(**オープンリレー**)と、迷惑メールの踏み台に使われます。Postfix では、次のように制限します。

```ini
smtpd_relay_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination
```

| 設定 | 意味 |
|---|---|
| `permit_mynetworks` | `mynetworks` のクライアントからのメールを許可する |
| `permit_sasl_authenticated` | SMTP 認証に成功したクライアントを許可する |
| `reject_unauth_destination` | 自分のドメイン宛て以外で、上で許可されなかったものを拒否する |

- 上から順に評価されます。
- `mynetworks` に広いネットワーク(`0.0.0.0/0` など)を書くと、オープンリレーになります。

アクセスの制限には、送信元ごとの許可、拒否を `check_sender_access hash:/etc/postfix/sender_access` のように書く方法もあります(変えたら `postmap` を実行します)。

### 7. SMTP 認証と TLS

外のネットワークから送る人を、ユーザー名とパスワードで確かめるのが **SMTP 認証**です。仕組みは **SASL** です。Postfix は、認証を Dovecot に任せる設定がよく使われます。

```ini
# main.cf: SMTP 認証(Dovecot の SASL を使う)
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes

# main.cf: TLS
smtpd_tls_cert_file = /etc/ssl/certs/mail.example.com.pem
smtpd_tls_key_file = /etc/ssl/private/mail.example.com.key
smtpd_tls_security_level = may
```

| パラメーター | 意味 |
|---|---|
| `smtpd_sasl_auth_enable` | `yes` で SMTP 認証を使う |
| `smtpd_sasl_type`、`smtpd_sasl_path` | 認証を任せる相手(Dovecot)と、そこへつなぐソケット |
| `smtpd_tls_cert_file`、`smtpd_tls_key_file` | サーバー証明書と秘密鍵 |
| `smtpd_tls_security_level` | `may`: 暗号化できる相手とだけ暗号化する、`encrypt`: 暗号化を必須にする |

- メールを送る専用のポートが、**サブミッション**(587 番)です。25 番はサーバーどうし、587 番はメールソフトからの送信、と分けます。
- 587 番では、つないでから **STARTTLS** の命令で暗号化に切り替え、そのあとで SMTP 認証をします。暗号化の前にパスワードを送らないようにするには、`smtpd_tls_auth_only = yes` を設定します。
- 587 番を開けるには、`master.cf` の `submission` の行を有効にします。
- 465 番(smtps)は、つないだ直後から TLS にする方式です。

### 8. SMTP の基本

SMTP は、サーバーとやり取りする、文字のコマンドです。`telnet` や `nc` で、手で試せます。

```text
$ nc mail.example.com 25
220 mail.example.com ESMTP Postfix
EHLO client.example.com
250-mail.example.com
250 STARTTLS
MAIL FROM:<alice@example.com>
250 2.1.0 Ok
RCPT TO:<bob@example.net>
250 2.1.5 Ok
DATA
354 End data with <CR><LF>.<CR><LF>
Subject: test

hello
.
250 2.0.0 Ok: queued as 4A1B2C3D
QUIT
221 2.0.0 Bye
```

| コマンド | 意味 |
|---|---|
| `HELO` / `EHLO` | 自分の名前を名乗って始める(`EHLO` は拡張版。STARTTLS や AUTH が使えるかが返る) |
| `MAIL FROM` | 送り主のアドレス |
| `RCPT TO` | 宛先のアドレス(宛先ごとに 1 回) |
| `DATA` | 本文を送り始める。行が `.` だけのところで終わり |
| `QUIT` | 終わる |

返事の数字の最初の桁は、2 が成功、4 が一時的な失敗(あとで再試行)、5 が恒久的な失敗(届かない)です。

### 9. キュー、ログ、監視

| 確かめたいこと | コマンド、ファイル |
|---|---|
| キューの中のメールの一覧 | `mailq`、`postqueue -p` |
| キューのメールをすぐに再配送 | `postqueue -f` |
| キューのメールを消す | `postsuper -d キューID`、`postsuper -d ALL` |
| メールのログ(Red Hat 系) | `/var/log/maillog` |
| メールのログ(Debian 系) | `/var/log/mail.log`(rsyslog を使う場合)、`journalctl -u postfix@-`(Postfix の本体は `postfix@-.service` で動く) |
| 待ち受けの確認 | `ss -tlnp \| grep :25` |

```text
incoming  -->  active  -->  deferred   時間をおいて再試行 (active に戻る)
                   |
                   +--> 配送できたらキューから消える

incoming は受け取ったメール、active は配送中、deferred は失敗したメール
```

- 「メールが届かない」ときは、まずログで宛先ごとの `status=` を見ます。`status=sent` は届けた、`status=deferred` は再試行待ち、`status=bounced` は返送です。
- `deferred` が増えていたら、`mailq` で、理由(相手のサーバーに届かない、DNS が引けないなど)を読みます。

## 2.10.2 Dovecot の設定と管理 (重要度2)

### 1. POP3 と IMAP

利用者のメールソフトに、メールボックスの中身を渡すプロトコルが、**POP3** と **IMAP** です。**Dovecot** は、この 2 つを動かすサーバーです。

| | POP3 | IMAP |
|---|---|---|
| メールの置き場 | メールソフトに**ダウンロード**する(サーバーからは消すことが多い) | **サーバーに置いたまま**読む |
| 複数の端末 | 端末ごとにメールが分かれる | どの端末でも同じ状態(既読、フォルダー)が見える |
| ポート | 110(TLS は 995) | 143(TLS は 993) |

- 近ごろの標準は IMAP です。スマートフォンとパソコンで同じメールを見るためです。
- 995 と 993 は、つないだ直後から TLS にする方式のポートです。110 と 143 は、`STARTTLS` で暗号化に切り替えることもできます。

### 2. 設定ファイル

| 場所 | 内容 |
|---|---|
| `/etc/dovecot/dovecot.conf` | 主な設定(`protocols = imap pop3 lmtp` など)。`conf.d/` の下のファイルを読み込む |
| `/etc/dovecot/conf.d/10-mail.conf` | メールの置き場(`mail_location`) |
| `/etc/dovecot/conf.d/10-auth.conf` | 認証(`disable_plaintext_auth`、`auth_mechanisms`) |
| `/etc/dovecot/conf.d/10-ssl.conf` | TLS(`ssl`、`ssl_cert`、`ssl_key`) |
| `/etc/dovecot/conf.d/10-master.conf` | 待ち受けるポート、Postfix に認証を渡すソケット |

- Dovecot の設定の書式は版で変わりました。RHEL 9 系、Ubuntu 24.04、Debian 12 の Dovecot は 2.3 系で、このテキストは 2.3 系の書式です。2.4 系では `ssl_cert` などの名前が変わっています。【要確認】

### 3. メールの形式: Maildir と mbox

| 形式 | 内容 | `mail_location` の例 |
|---|---|---|
| **mbox** | 1 つのファイルに、すべてのメールを連ねる(`/var/mail/ユーザー名`) | `mbox:~/mail:INBOX=/var/mail/%u` |
| **Maildir** | 1 通を 1 つのファイルにして、ディレクトリ(`~/Maildir/`)に置く | `maildir:~/Maildir` |

- Maildir は、1 通ずつ別のファイルなので、同時にアクセスしても壊れにくく、扱いやすい形式です。
- Postfix と Dovecot は、**同じ形式、同じ場所**にそろえます。Postfix で `home_mailbox = Maildir/` と書いたら、Dovecot は `mail_location = maildir:~/Maildir` にします。

### 4. TLS と認証の設定

```ini
# conf.d/10-ssl.conf (2.3 系)
ssl = required
ssl_cert = </etc/ssl/certs/mail.example.com.pem
ssl_key = </etc/ssl/private/mail.example.com.key

# conf.d/10-auth.conf
disable_plaintext_auth = yes
auth_mechanisms = plain login
```

- `ssl_cert` と `ssl_key` の値の頭には、**`<`** を付けます。`<` は「このファイルの中身を値にする」という意味です。付けないと、ファイルの名前が証明書の文字として読まれて失敗します。
- `ssl = required` は TLS を必須に、`ssl = yes` は TLS を使えるようにします。
- `disable_plaintext_auth = yes` は、TLS でない通信でのパスワードの送信を拒否します。

Postfix の SMTP 認証を Dovecot に任せるには、`10-master.conf` で、Postfix が読めるソケットを作ります。

```text
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }
}
```

これが、Postfix の `smtpd_sasl_path = private/auth` に対応します。

### 5. doveconf と doveadm

| コマンド | 動き |
|---|---|
| `doveconf -n` | 既定値と違う設定だけを表示する(設定の確認の基本) |
| `doveconf -a` | すべての設定を表示する |
| `doveconf mail_location` | 1 つの設定の値を表示する |
| `doveadm who` | 今つないでいるユーザーの一覧 |
| `doveadm kick ユーザー名` | ユーザーの接続を切る |
| `doveadm user ユーザー名` | ユーザーの設定(メールの置き場など)を表示 |
| `doveadm mailbox list -u ユーザー名` | ユーザーのメールボックス(フォルダー)の一覧 |
| `doveadm auth test ユーザー名` | 認証が通るか試す |
| `doveadm reload` | 設定を読み込み直す |

```bash
sudo doveconf -n                 # 変えた設定の確認
sudo systemctl reload dovecot    # 反映
sudo doveadm who                 # 誰がつないでいるか
ss -tlnp | grep -E ':(143|993|110|995)'
```

- ログは、Red Hat 系では `/var/log/maillog`、Debian 系では `/var/log/mail.log` か `journalctl -u dovecot` に出ます。
- 認証や TLS の失敗は、ログに理由が書かれます。まずログを読みます。
