# LinuC202 問題 2.10 電子メールサービス

対象: LinuC レベル2 202試験 / 全16問 / すべてオリジナル問題
対応テキスト: `LinuC202_2.10_電子メールサービス.md`
解答・解説は末尾。

## 問題

### 2.10.1 Postfix の設定と管理

**問1** `LinuC202-2.10-001` Postfix のサーバーで、`/etc/aliases` に新しいエイリアスを書き足した。変更を Postfix に反映するために実行するコマンドはどれか。

- A. `postfix check`
- B. `newaliases`
- C. `postconf -e`
- D. `mailq`

**問2** `LinuC202-2.10-002` Postfix の `main.cf` で、「ここからのメールは中継してよい」と信頼するクライアントのネットワークを指定するパラメーターはどれか。

- A. `inet_interfaces`
- B. `mydestination`
- C. `mynetworks`
- D. `myorigin`

**問3** `LinuC202-2.10-003` Postfix の設定のうち、既定値と違うものだけを表示するコマンドを、オプションまで答えよ。

**問4** `LinuC202-2.10-004` Postfix で、`main.cf` に `virtual_alias_maps = hash:/etc/postfix/virtual` と書いた。`/etc/postfix/virtual` を編集したあと、Postfix が読める形のデータベースにするコマンドはどれか。

- A. `postmap /etc/postfix/virtual`
- B. `newaliases`
- C. `postfix check`
- D. `mailq`

**問5** `LinuC202-2.10-005` 社内のメールサーバーを、オープンリレー(誰からの中継も受ける状態)にしないための設定として、適切なものを**2つ**選べ。

- A. `mynetworks` に、社内のネットワークだけを書く
- B. SMTP 認証に成功したユーザーに限って、外のネットワークからの中継を許す
- C. `mynetworks` に `0.0.0.0/0` を書いて、どこからでも使えるようにする
- D. `smtpd_relay_restrictions` に `permit` だけを書いて、中継の確認をなくす

**問6** `LinuC202-2.10-006` SMTP でメールを送るとき、送り主のアドレスをサーバーに伝えるコマンドを答えよ(アドレスは不要)。

**問7** `LinuC202-2.10-007` Postfix のメールキューに残っているメールの一覧を表示するコマンドを答えよ。`mailq` のほかにも同じ働きのコマンドがあれば、どれを答えてもよい。

**問8** `LinuC202-2.10-008` AlmaLinux 9 で動く Postfix のログは、既定では、どのファイルに出るか。rsyslog を使うものとする。

- A. `/var/log/mail.log`
- B. `/var/log/postfix.log`
- C. `/var/log/messages`
- D. `/var/log/maillog`

**問9** `LinuC202-2.10-009` メールソフトからの送信用のポート(587 番)で、つないだあとに命令を送って通信を暗号化に切り替え、そのあとで SMTP 認証をさせたい。この、通信を暗号化に切り替える命令はどれか。

- A. `DATA`
- B. `STARTTLS`
- C. `EHLO`
- D. `RCPT TO`

**問10** `LinuC202-2.10-010` Postfix と同じ、メールを転送する MTA はどれか。

- A. Dovecot
- B. Samba
- C. Exim
- D. Chrony

### 2.10.2 Dovecot の設定と管理

**問11** `LinuC202-2.10-011` 利用者が、パソコンとスマートフォンの両方で同じメールボックスを読み、既読の状態や作ったフォルダーを共通にしたい。サーバーにメールを残したまま読むプロトコルはどれか。

- A. IMAP
- B. POP3
- C. SMTP
- D. SASL

**問12** `LinuC202-2.10-012` Dovecot の設定のうち、既定値と違うものだけを表示するコマンドを、オプションまで答えよ。

**問13** `LinuC202-2.10-013` Postfix の `main.cf` に `home_mailbox = Maildir/` と書いた。Dovecot で、同じメールボックスを読むための `mail_location` の設定はどれか。

- A. `mbox:~/mail:INBOX=/var/mail/%u`
- B. `maildir:/var/spool/postfix`
- C. `mbox:~/Maildir`
- D. `maildir:~/Maildir`

**問14** `LinuC202-2.10-014` Dovecot 2.3 系で、証明書のファイル `/etc/ssl/certs/mail.pem` を使う `ssl_cert` の正しい書き方はどれか。

- A. `ssl_cert = /etc/ssl/certs/mail.pem`
- B. `ssl_cert = </etc/ssl/certs/mail.pem`
- C. `ssl_cert: /etc/ssl/certs/mail.pem`
- D. `ssl_cert = >/etc/ssl/certs/mail.pem`

**問15** `LinuC202-2.10-015` Dovecot に、いま接続しているユーザーの一覧を表示するコマンドはどれか。

- A. `doveconf -n`
- B. `doveadm reload`
- C. `doveadm who`
- D. `doveconf -a`

**問16** `LinuC202-2.10-016` TLS を最初から使う(つないだ直後から暗号化する)、メールを読むためのポートを**2つ**選べ。

- A. 995
- B. 110
- C. 143
- D. 993

## 解答・解説

### 問1 `LinuC202-2.10-001`

**正解**: B

**入力の別解**: `postalias /etc/aliases`、`sendmail -bi`

**テキスト**: 4. エイリアスと newaliases

`newaliases` は、`/etc/aliases` から、Postfix が読むデータベース(`/etc/aliases.db`)を作り直します。`/etc/aliases` を編集しただけでは反映されません。`postalias /etc/aliases` と `sendmail -bi` も同じ働きです。

- A. `postfix check` は、設定ファイルの誤りを調べるだけで、エイリアスのデータベースは作りません。
- C. `postconf -e` は、`main.cf` のパラメーターを書き換えるコマンドです。
- D. `mailq` は、メールキューの一覧を表示するコマンドです。

### 問2 `LinuC202-2.10-002`

**正解**: C

**テキスト**: 3. main.cf の主なパラメーター

`mynetworks` は、信頼するクライアントのネットワークです。ここからのメールは、中継(自分宛てでないドメインへの送信)が許されます。

- A. `inet_interfaces` は、SMTP を待ち受けるネットワークインターフェースを決めます。
- B. `mydestination` は、自分宛てとしてローカルに配送するドメインの一覧です。
- D. `myorigin` は、このサーバーから出すメールの `@` の後ろに付けるドメイン名です。

### 問3 `LinuC202-2.10-003`

**正解**: `postconf -n`

**テキスト**: 2. 設定ファイルとディレクトリ

`postconf -n` は、`main.cf` で変えた設定(既定値と違うもの)だけを表示します。`postconf` だけだと、既定値も含めてすべてが出て、長くなります。`postconf -d` は逆に、既定値の一覧です。

### 問4 `LinuC202-2.10-004`

**正解**: A

**テキスト**: 5. 仮想ドメイン

`postmap` は、`hash:` 形式のファイルから、Postfix が読むデータベース(`virtual.db`)を作ります。仮想エイリアスのほか、`check_sender_access` のファイルなどでも使います。

- B. `newaliases` は、`/etc/aliases` 専用です。
- C. `postfix check` は、設定ファイルの誤りを調べるだけです。
- D. `mailq` は、メールキューの一覧を表示するコマンドです。

### 問5 `LinuC202-2.10-005`

**正解**: A、B

**テキスト**: 6. 中継の制限(オープンリレーを防ぐ)

中継を許す相手は、信頼するネットワーク(`mynetworks`)か、SMTP 認証(SASL)に成功したユーザーに絞ります。

- A. 社内のネットワークだけを `mynetworks` に書くのは、正しい制限です。
- B. SMTP 認証に成功したユーザーだけを許すのも、正しい制限です。`permit_sasl_authenticated` で書きます。
- C. `0.0.0.0/0` は、すべてのアドレスです。誰でも中継できるオープンリレーになります。
- D. `permit` だけだと、すべてを許可します。`reject_unauth_destination` などで、自分宛て以外を拒否する必要があります。

### 問6 `LinuC202-2.10-006`

**正解**: `MAIL FROM`、`MAIL FROM:`、`mail from`、`mail from:`

**テキスト**: 8. SMTP の基本

`MAIL FROM:<送り主のアドレス>` で、送り主を伝えます。SMTP のコマンドは、大文字と小文字を区別しません。宛先は `RCPT TO:<宛先のアドレス>` で、本文は `DATA` で送ります。

### 問7 `LinuC202-2.10-007`

**正解**: `mailq`、`postqueue -p`、`sendmail -bp`

**テキスト**: 9. キュー、ログ、監視

どちらも、キュー(`/var/spool/postfix/` の下)に残っているメールの一覧を表示します。`mailq` は、Sendmail 互換のコマンドで、Postfix では `postqueue -p` と同じ動きです。Sendmail 互換の `sendmail -bp` も同じです。`postqueue -f` で、キューのメールをすぐに再配送します。

### 問8 `LinuC202-2.10-008`

**正解**: D

**テキスト**: 9. キュー、ログ、監視

Red Hat 系(AlmaLinux、RHEL 9 系)では、メールのログは `/var/log/maillog` に出ます。

- A. `/var/log/mail.log` は、Debian 系(Ubuntu、Debian)の名前です。
- B. `postfix.log` という名前の、既定のログファイルはありません。
- C. `/var/log/messages` は、メール以外のログが出る場所です。メールのログは `maillog` に分けられます。

### 問9 `LinuC202-2.10-009`

**正解**: B

**テキスト**: 7. SMTP 認証と TLS

`STARTTLS` は、平文でつないだあとに、通信を TLS に切り替える SMTP の命令です。切り替えたあとで SMTP 認証をするので、パスワードが平文で流れません。

- A. `DATA` は、メールの本文を送り始める命令です。
- C. `EHLO` は、自分の名前を名乗る命令です。返事で、STARTTLS が使えるかが分かります。
- D. `RCPT TO` は、宛先を伝える命令です。

### 問10 `LinuC202-2.10-010`

**正解**: C

**テキスト**: 1. メールが届くまでの流れ

Exim は、Postfix と同じ MTA です。Debian では、標準で入る MTA として使われてきました(パッケージ名は `exim4`)。

- A. Dovecot は、POP3 と IMAP でメールを読ませるサーバーです。
- B. Samba は、Windows とのファイル共有のサーバーです。
- D. Chrony は、時刻を合わせるサーバーです。

### 問11 `LinuC202-2.10-011`

**正解**: A

**テキスト**: 1. POP3 と IMAP

IMAP は、メールをサーバーに置いたまま読みます。既読の状態やフォルダーもサーバーにあるので、どの端末でも同じに見えます。

- B. POP3 は、メールをメールソフトにダウンロードします。端末ごとにメールが分かれます。
- C. SMTP は、メールを送る、転送するプロトコルです。読み出しには使いません。
- D. SASL は、ユーザーを確かめる認証の仕組みで、メールを読むプロトコルではありません。

### 問12 `LinuC202-2.10-012`

**正解**: `doveconf -n`

**テキスト**: 5. doveconf と doveadm

`doveconf -n` は、既定値と違う設定だけを表示します。`doveconf -a` は、すべての設定を表示します。設定が効いているかを確かめるときは、まず `doveconf -n` を見ます。設定は `/etc/dovecot/dovecot.conf` と、`/etc/dovecot/conf.d/` の下のファイルにあります。

### 問13 `LinuC202-2.10-013`

**正解**: D

**テキスト**: 3. メールの形式: Maildir と mbox

Postfix の `home_mailbox = Maildir/` は、利用者のホームディレクトリの `Maildir/` に、Maildir 形式でメールを入れます。Dovecot は、`mail_location = maildir:~/Maildir` で、同じ場所を読みます。Postfix と Dovecot で形式と場所をそろえることが大切です。

- A. mbox 形式で、`/var/mail/` にあるメールボックスを読む設定です。
- B. `/var/spool/postfix` は、Postfix のキューの場所で、メールボックスではありません。
- C. `~/Maildir` は Maildir 形式のディレクトリです。mbox 形式として読もうとすると失敗します。

### 問14 `LinuC202-2.10-014`

**正解**: B

**テキスト**: 4. TLS と認証の設定

Dovecot 2.3 系では、`ssl_cert` の値の頭に `<` を付けます。「このファイルの中身を値にする」という意味です。

- A. `<` がないと、ファイルの名前が証明書の文字として読まれて、失敗します。
- C. 設定は `名前 = 値` の形で、`:` は使いません。
- D. `>` は、設定では使いません。

### 問15 `LinuC202-2.10-015`

**正解**: C

**テキスト**: 5. doveconf と doveadm

`doveadm who` は、いま接続しているユーザーと、接続元を表示します。接続を切るときは `doveadm kick` を使います。

- A. `doveconf -n` は、既定値と違う設定を表示します。接続は分かりません。
- B. `doveadm reload` は、設定を読み込み直すコマンドです。
- D. `doveconf -a` は、すべての設定を表示します。接続は分かりません。

### 問16 `LinuC202-2.10-016`

**正解**: A、D

**テキスト**: 1. POP3 と IMAP

つないだ直後から TLS にするのは、POP3 の 995 番(POP3S)と、IMAP の 993 番(IMAPS)です。

- A. 995 番は、TLS を使う POP3 です。
- B. 110 番は、平文の POP3 です(`STARTTLS` で暗号化に切り替えることはできます)。
- C. 143 番は、平文の IMAP です(`STARTTLS` で暗号化に切り替えることはできます)。
- D. 993 番は、TLS を使う IMAP です。
