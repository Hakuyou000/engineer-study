# LinuC 3SS テキスト 4.0 セキュアプロトコルによる各種機能の実装

対象: LinuC レベル3 3SS試験 Version 1.0

インターネットの通信を安全にするために、サーバーに実装する仕組みを学びます。証明書の自動更新(Let's Encrypt)、Web サーバーの TLS とセキュリティヘッダー、DNS の通信の暗号化(DoT、DoH)、DNS の答えの署名(DNSSEC)、メールの送信元の確認と暗号化の順に進みます。

Red Hat 系(AlmaLinux / RHEL 9 系)と Debian 系(Ubuntu 24.04 / Debian 12)で違うところは、両方書きます。BIND は 9.18 系を前提にします。Ubuntu 24.04 は `bind9` パッケージ、RHEL 9 系は 9.5 以降の `bind9.18` パッケージを使います(`bind` パッケージは 9.16 系で、4.3 の DoT と DoH の書き方がそのままは使えないことがあります)【要確認】。例のドメイン名は `example.com`、IP アドレスは `192.0.2.0/24` と `2001:db8::/32` を使います(どちらも文書用に予約された値です)。

基本の DNS、Web サーバー、メールサーバーの設定は LinuC 202 の 2.08、2.09、2.10 で学びます。この章は、その上に安全のための機能を重ねます。

## 4.1 Let's Encrypt による証明書管理 (重要度2)

### 1. Let's Encrypt と ACME

**Let's Encrypt**は、無料で証明書を出す認証局(CA)です。**ACME**(Automatic Certificate Management Environment)という決まりごと(RFC 8555)で、証明書の申請、確認、発行、更新をすべて自動でできます。

- 出すのは **DV 証明書**(Domain Validation。ドメインを管理していることだけを確かめる証明書)です。会社の実在は確かめません。
- ACME の道具(クライアント)は、`certbot`、`acme.sh`、`lego` などがあります。この章では、いちばん使われている **certbot** を使います。
- 申請する人が、そのドメインを本当に管理しているかを確かめる手順を**チャレンジ**と呼びます。

| チャレンジ | 確かめ方 | 使う場面 |
|---|---|---|
| **HTTP-01** | `http://<ドメイン>/.well-known/acme-challenge/<token>` に、指定の内容を置いて、CA が 80 番ポートで取りに来る | 公開された Web サーバーがある。いちばん簡単 |
| **DNS-01** | `_acme-challenge.<ドメイン>` の TXT レコードに、指定の値を置いて、CA が DNS で調べる | **ワイルドカード証明書**(`*.example.com`)、80 番を開けられない、外から見えないサーバー |
| TLS-ALPN-01 | 443 番ポートの TLS の途中で確かめる | 80 番が使えないとき(certbot は対応していません。`acme.sh`、`lego` などで使います)【要確認】 |

```text
certbot                          Let's Encrypt (ACME)
   |                                |
   |-- 1. new-order example.com --->|  この名前の証明書がほしい
   |<-- 2. token -------------------|  この内容を置いてください
   |                                |
   |  .well-known/acme-challenge/ に token を置く(HTTP-01 の場合)
   |                                |
   |<-- 3. GET :80 -----------------|  CA が置かれた内容を取りに来る
   |-- 4. CSR ---------------------->|  署名してほしい申請書を送る
   |<-- 5. certificate --------------|  証明書が発行される
```

**ワイルドカード証明書**は、`*.example.com` のように、同じ階層のすべての名前をまとめて 1 枚にしたものです。HTTP-01 では取れず、**DNS-01 だけ**です。`*.example.com` は `example.com` 自体を含まないので、両方を `-d` で指定します。

### 2. certbot の入れ方とプラグイン

| | Red Hat 系(AlmaLinux / RHEL 9 系) | Debian 系(Ubuntu 24.04 / Debian 12) |
|---|---|---|
| 入れ方 | EPEL を有効にして `dnf install certbot python3-certbot-nginx`(Apache は `python3-certbot-apache`)【要確認】 | `apt install certbot python3-certbot-nginx`(Apache は `python3-certbot-apache`) |
| snap 版 | どちらも `snap install certbot --classic` で入れられる。公式の案内は snap 版 | 同左 |
| 更新の仕組み | timer ユニット(パッケージにより名前が違う)【要確認】 | `certbot.timer`(パッケージに入っている) |

certbot は、**認証**(チャレンジに答える)と**インストール**(Web サーバーの設定に証明書を書く)に分かれます。方法はいくつかあります。

| 使い方 | コマンドの例 | 動き |
|---|---|---|
| `--nginx` / `--apache` | `certbot --nginx -d example.com -d www.example.com` | 認証もインストールも自動。設定ファイルを書き換え、reload する |
| `certonly --webroot` | `certbot certonly --webroot -w /var/www/html -d example.com` | 動いている Web サーバーの公開ディレクトリに token を置く。設定は自分で書く |
| `certonly --standalone` | `certbot certonly --standalone -d example.com` | certbot 自身が 80 番で待ち受ける。Web サーバーが 80 番を使っていると失敗する(止めるか、webroot にする) |
| `--manual` / DNS プラグイン | `certbot certonly --dns-route53 -d '*.example.com'` | DNS-01。DNS の API を使うプラグイン(`certbot-dns-*`)で自動にする |

- 本番の前に、`--dry-run`(テスト用の環境で試す。証明書は保存されない)で試します。本番の CA には発行の回数の制限(レート制限)があり、失敗を繰り返すと止められます。
- 申請の前に、ドメインの A レコードがこのサーバーを指していること、**80 番(HTTP-01 の場合)が外から届くこと**を確かめます。ファイアウォールで止めていると、チャレンジに失敗します。

### 3. 証明書のファイルと Web サーバーの設定

発行された証明書は、`/etc/letsencrypt/` の下に置かれます。

| 場所 | 中身 |
|---|---|
| `/etc/letsencrypt/live/example.com/fullchain.pem` | サーバー証明書と中間証明書をつなげたもの。Web サーバーはこれを使う |
| `/etc/letsencrypt/live/example.com/privkey.pem` | 秘密鍵。漏らさない |
| `/etc/letsencrypt/live/example.com/cert.pem`、`chain.pem` | サーバー証明書だけ、中間証明書だけ |
| `/etc/letsencrypt/archive/example.com/` | 実際のファイル(更新のたびに番号が増える)。`live/` はここへのシンボリックリンク |
| `/etc/letsencrypt/renewal/example.com.conf` | 更新の設定(認証の方法など) |

`live/` のファイルは、更新しても同じパスのまま中身が新しくなります。Web サーバーの設定には、`live/` のパスを書きます(`archive/` を書かない)。

```nginx
server {
    listen 443 ssl;
    server_name example.com www.example.com;
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
}
```

Apache は、`SSLCertificateFile` に `fullchain.pem`、`SSLCertificateKeyFile` に `privkey.pem` を書きます。

### 4. 自動更新と確かめ方

Let's Encrypt の証明書は有効期間が短いため、**自動で更新する**ことが前提です。更新は `certbot renew` で行います。期限が近い証明書(標準では残り 30 日未満)だけを更新し、まだ余裕のあるものは何もしません。

| 方法 | 確かめ方 |
|---|---|
| systemd の timer ユニット | `systemctl list-timers '*certbot*'`、`systemctl status certbot.timer` |
| cron | `/etc/cron.d/certbot`(Debian 系のパッケージ。systemd が動いているときは timer が先に働く) |
| snap 版 | `systemctl list-timers snap.certbot.renew.timer` |

```bash
sudo certbot certificates                 # 持っている証明書と期限の一覧
sudo certbot renew --dry-run              # 更新のテスト(本番の証明書は変わらない)
sudo certbot renew --deploy-hook 'systemctl reload nginx'   # 更新できたときだけ reload する
```

- 更新しても、Web サーバーが**古い証明書をメモリに持ったまま**だと、期限切れに見えます。`/etc/letsencrypt/renewal-hooks/deploy/` に置いたスクリプトか `--deploy-hook` で、更新できたときに reload します(`--nginx` / `--apache` で入れた場合、certbot が reload します)。
- `renewal-hooks/` の `pre`、`post` は、更新の前後に毎回動きます。`standalone` のときは、`pre` で Web サーバーを止め、`post` で起動します。
- 失敗したときは、ログ `/var/log/letsencrypt/letsencrypt.log` を見ます。`Challenge failed`、`Timeout during connect`(80 番に届かない)、`unauthorized`(置いた内容が違う、別のサーバーに届いている)などの理由が出ます。
- DNS に **CAA レコード**があり、Let's Encrypt(`letsencrypt.org`)を許可していないと、発行が断られます。

最近の変更です(2026 年 11 月時点。Let's Encrypt の公式のお知らせで確かめた内容)。

- **OCSP の終了**: Let's Encrypt の OCSP の応答サービスは 2025 年 8 月 6 日に終了しました。失効の情報は **CRL**(失効リスト)だけで出します。そのため、`ssl_stapling` で Let's Encrypt の証明書の OCSP ステープリングをしても、役に立ちません。
- **有効期間の短縮**: 現在の既定は 90 日です。`tlsserver` プロファイル(希望した人だけ)は 2026 年 5 月 13 日から 45 日です。既定の `classic` プロファイルは、2027 年 2 月 10 日に 64 日、2028 年 2 月 16 日に 45 日になる予定です。更新が自動でないと、期限切れが増えます。

ポイントは次のとおりです。

- 「更新は期限の約 3 分の 2 が過ぎたころ」を目安にします。60 日おきなどの固定の間隔は、短くなると足りなくなります。
- 更新が失敗しても気づけるように、期限の監視(`openssl x509 -checkend` など)も入れます。

## 4.2 Web サーバーのセキュリティ強化 (重要度3)

### 1. 証明書の種類と階層

証明書は、確かめる範囲で種類が分かれます。

| 種類 | 確かめること | 特徴 |
|---|---|---|
| **DV**(Domain Validation) | ドメインを管理していること | 自動で発行できる。Let's Encrypt はこれだけ |
| **OV**(Organization Validation) | DV に加えて、組織が実在すること | 証明書に組織名が入る |
| **EV**(Extended Validation) | OV より厳しい審査 | 暗号の強さは同じ。今のブラウザーは、DV と見た目をほぼ区別しない |

どの種類でも、通信を暗号化する強さは変わりません。違うのは「誰が確かめられたか」です。

証明書は、次の 3 階層でつながります。

```text
[root]            ルート証明書。OS やブラウザーに最初から入っている(信頼の出発点)
    |
    |  署名する
    v
[intermediate]    中間証明書。サーバーが一緒に送る
    |
    |  署名する
    v
[end-entity]      エンドエンティティ証明書(サーバー証明書)。サーバーに設定する
```

- **ルート証明書**は、OS やブラウザーが持つ「信頼するルート CA の一覧」に入っています。サーバーが送る必要はありません。
- **中間証明書**は、サーバーが**サーバー証明書と一緒に送ります**(`fullchain.pem`)。送らないと、クライアントが「発行元の証明書が見つからない」と判断して、エラーになります。ブラウザーは補って成功することがありますが、`curl` や API のクライアント、Java などは失敗します。
- **エンドエンティティ証明書**(サーバー証明書、leaf)は、実際にサーバーに設定する証明書です。

### 2. TLS 1.2 と TLS 1.3

| | TLS 1.2 | TLS 1.3 |
|---|---|---|
| 位置づけ | 今も使われる。設定しだいで弱くもなる | 現在の標準。弱い方式は仕様から外された |
| ハンドシェイク | 2 往復 | 1 往復(再接続は 0-RTT もある) |
| 暗号スイート | 多くの組み合わせから選ぶ(弱いものも選べてしまう) | 少数に固定(AEAD の方式だけ) |

TLS 1.0 と 1.1 は廃止されました(RFC 8996)。古い SSLv3 以前も使いません。Web サーバーでは、使う版を明示します。

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
```

```apache
SSLProtocol -all +TLSv1.2 +TLSv1.3
```

- 古い版しか話せない古いクライアントは、つながらなくなります。ログ(`error.log`)の `no shared cipher`、`unsupported protocol` の理由を確認します。
- TLS 1.3 の **0-RTT**(早期データ)は、同じ要求が再送されて 2 回処理される危険があります。書き込みを伴う要求には使いません。

### 3. openssl で確かめる

| コマンド | 確かめること |
|---|---|
| `openssl s_client -connect example.com:443 -servername example.com` | 実際につないで、証明書の連なりと TLS の版を見る。`-servername` で SNI(名前)を送る |
| `openssl s_client -connect example.com:443 -tls1_2` | TLS 1.2 でつなげるか(`-tls1_3` で 1.3、古い版を試して**つながらないこと**も確かめる) |
| `openssl s_client -connect example.com:443 -showcerts` | サーバーが送ってくる証明書をすべて表示する(中間証明書が送られているか) |
| `openssl x509 -in cert.pem -noout -subject -issuer -dates` | 証明書の名前、発行元、有効期間 |
| `openssl x509 -in cert.pem -noout -ext subjectAltName` | 証明書が有効な名前(SAN) |
| `openssl x509 -in cert.pem -noout -checkend 2592000` | 30 日以内に期限が切れるなら終了コード 1 |
| `openssl verify -untrusted chain.pem cert.pem` | 証明書が、中間証明書を通して信頼できるか |

```bash
# サーバーの証明書の期限を、つないで直接調べる
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -dates
```

`s_client` の出力の `Verify return code: 0 (ok)` は検証の成功です。`20 (unable to get local issuer certificate)` は、中間証明書が足りない、`10 (certificate has expired)` は期限切れ、`18` や `19` は自己署名の証明書、を表します。

### 4. nginx の HTTP/3

**HTTP/3**は、TCP の代わりに **QUIC**(UDP の上の暗号化された通信)を使う HTTP です。接続が速く、回線が不安定でも遅くなりにくいのが特徴です。

```nginx
server {
    listen 443 ssl;                       # HTTP/1.1、HTTP/2 用(TCP)
    listen 443 quic reuseport;            # HTTP/3 用(UDP)
    http3 on;
    ssl_protocols TLSv1.3;                # QUIC は TLS 1.3 が必須
    add_header Alt-Svc 'h3=":443"; ma=86400' always;   # HTTP/3 が使えることを知らせる
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
}
```

- QUIC は **UDP の 443 番**を使います。ファイアウォールで TCP だけを開けていると、HTTP/3 は使われず、HTTP/2 に戻ります(障害にはなりません)。
- nginx 本体の HTTP/3 は 1.25.0 以降の機能です。Ubuntu 24.04 のパッケージは 1.24 系で、使えません【要確認】。RHEL 9 系のモジュール(1.20、1.22、1.24)は 1.25 より前なので使えません。9.5 以降の 1.26 のストリームは、HTTP/3 のモジュールが組み込まれているかを `nginx -V` で確かめます【要確認】。使うときは、nginx.org のパッケージなど、対応した版を使います。
- ブラウザーは、最初は HTTP/2 でつなぎ、`Alt-Svc` ヘッダーを見て、次から HTTP/3 を試します。確かめるには `curl --http3 -I https://example.com`(curl が HTTP/3 に対応している場合)を使います。

### 5. セキュリティヘッダー

Web サーバーが返す HTTP のヘッダーで、ブラウザーに安全な動きを指示します。

| ヘッダー | 役割 | 設定の例 |
|---|---|---|
| **HSTS** `Strict-Transport-Security` | 「このサイトは、指定した期間、HTTPS だけでつなぐ」と、ブラウザーに覚えさせる。HTTP に落とされる攻撃を防ぐ | `max-age=31536000; includeSubDomains` |
| **CSP** `Content-Security-Policy` | 読み込んでよいスクリプトや画像の取得元を制限する。XSS の被害を小さくする | `default-src 'self'` |
| `X-Frame-Options` | 自分のページを、別のサイトの `<iframe>` に埋め込ませない(クリックジャッキングの対策) | `DENY` または `SAMEORIGIN` |
| `X-Content-Type-Options` | ブラウザーが中身から種類を推測する(MIME スニッフィング)のを止める | `nosniff` |
| `Referrer-Policy` | リンク先に送る参照元(Referer)の量を決める | `strict-origin-when-cross-origin`、`no-referrer` |

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

Apache は `mod_headers` を有効にして、`Header always set X-Content-Type-Options "nosniff"` のように書きます(Debian 系は `a2enmod headers`)。

次の点に注意します。

- **HSTS は取り消しにくい**です。ブラウザーが `max-age` の間、HTTP でのつなぎを拒否します。HTTPS の準備ができていない(証明書が切れる、サブドメインが HTTP だけ)と、サイトが開けなくなります。最初は `max-age=300` のように短くして、問題がなければ延ばします。HSTS は **HTTPS の応答でだけ**有効です(HTTP の応答に付けても無視されます)。
- CSP は、厳しすぎると、自分のサイトの画面が壊れます。最初は `Content-Security-Policy-Report-Only` で、違反を報告するだけにして、様子を見ます。`X-Frame-Options` の役割は、CSP の `frame-ancestors` でもできます。
- nginx の `add_header` は、**下の階層(`location` など)に 1 つでも `add_header` があると、上の階層(`server`)の `add_header` が引き継がれません**。ヘッダーが消えたときは、まずここを疑います。`always` を付けないと、4xx や 5xx の応答にはヘッダーが付きません。
- 確かめるには、`curl -sI https://example.com`(`-I` は応答のヘッダーだけを表示)を使います。

## 4.3 DNS over TLS/HTTPS (重要度2)

### 1. DoT と DoH

普通の DNS(53 番ポート)の問い合わせは、暗号化されず、途中で見られたり書き換えられたりします。**DoT** と **DoH** は、クライアントとリゾルバー(DNS のキャッシュサーバー)の間を暗号化します。

| | DoT(DNS over TLS) | DoH(DNS over HTTPS) |
|---|---|---|
| 仕組み | DNS のメッセージを TLS の上で送る | DNS のメッセージを HTTPS の上で送る(RFC 8484) |
| ポート | **853 番/TCP** | **443 番/TCP**(パスは通常 `/dns-query`) |
| 見分けやすさ | ポートで DNS だと分かる。ファイアウォールで止めやすい | 普通の HTTPS と同じに見える |

```text
client (stub)             resolver (BIND)           authoritative
    |                         |                         |
    |== DoT 853 / DoH 443 ===>|                         |  ここは暗号化される
    |                         |------ DNS 53 ---------->|  ここは暗号化されない
```

- 暗号化されるのは、**クライアントとリゾルバーの間だけ**です。リゾルバーから権威サーバーへの問い合わせは、そのままです。
- DoT と DoH は、通信を**隠す**ものです。答えが本物であることは**保証しません**(これは DNSSEC の役割です。4.4)。
- 管理する側から見ると、DoH は DNS の通信を、普通の HTTPS に混ぜて見えにくくします。組織によっては、ブラウザーの DoH の設定を管理したり、止めたりします。

### 2. BIND 9.18 に DoT と DoH を設定する

BIND は、**9.18 から** DoT と DoH の待ち受け(サーバーの側)ができます。次の 3 つを用意します。

1. サーバーの**証明書と秘密鍵**(リゾルバーのホスト名 `dns.example.com` の証明書。Let's Encrypt でも取れる)
2. `tls` ステートメント(証明書と鍵の指定)
3. `listen-on` の `tls`(DoT)、`tls` と `http`(DoH)の指定

```text
// named.conf(Debian 系は named.conf.options に options を書く)
tls dot-tls {
    cert-file "/etc/bind/tls/dns.example.com.fullchain.pem";
    key-file  "/etc/bind/tls/dns.example.com.key";
    protocols { TLSv1.2; TLSv1.3; };
};

options {
    listen-on port 53 { 192.0.2.53; };                      // 普通の DNS
    listen-on port 853 tls dot-tls { 192.0.2.53; };         // DoT
    listen-on port 443 tls dot-tls http default { 192.0.2.53; };  // DoH
    listen-on-v6 port 853 tls dot-tls { 2001:db8::53; };
    allow-recursion { 192.0.2.0/24; };                      // 開いたリゾルバーにしない
};
```

- `tls <名前> { … };` は、`options` の外に書く、独立したステートメントです。`cert-file` と `key-file` が要ります。
- `listen-on` に `tls <名前>` を付けると DoT、さらに `http default` を付けると DoH(パスは `/dns-query`)になります。`port` を書かなければ、DoT は 853 番、DoH は 443 番です。
- `tls ephemeral` を指定すると、一時的な自己署名の証明書で動きます。試験用で、本番では使いません。
- DoH は、TLS を別の装置(リバースプロキシ)で終わらせるときは、`tls none http default` で、平文の HTTP で受けることもできます。
- 鍵のファイルは、named の実行ユーザーだけが読めるようにします(`chmod 640`、所有グループは named または bind)。Debian 系は AppArmor、Red Hat 系は SELinux で、置き場所やラベルが合わないと、named が読めずに起動に失敗します【要確認】(ログは `journalctl -u named`。Red Hat 系、Debian 系とも同じです)。
- 設定は `named-checkconf` で検査してから、`rndc reconfig` か再起動で反映します。Let's Encrypt の証明書が更新されたときの反映も忘れないようにします(deploy フック)。ファイアウォールで、853/tcp と 443/tcp を開けます。

| | Red Hat 系 | Debian 系 |
|---|---|---|
| 設定ファイル | `/etc/named.conf`(1 つ) | `/etc/bind/named.conf`、`named.conf.options`、`named.conf.local` |
| パッケージ | `bind9.18`(9.5 以降。`bind` は 9.16 系)【要確認】 | `bind9` |
| サービス | `named` | `named`(`bind9` は別名) |

### 3. 動作の確認

```bash
ss -tlnp | grep -E ':(853|443)\b'                             # 待ち受けているか
openssl s_client -connect 192.0.2.53:853 -servername dns.example.com   # TLS の握手と証明書
dig +tls @dns.example.com example.com A                        # DoT で問い合わせ(BIND 9.18 の dig)
kdig -d @dns.example.com +tls +tls-hostname=dns.example.com example.com A  # knot-dnsutils の kdig
dig +https @dns.example.com example.com A                      # DoH
curl --doh-url https://dns.example.com/dns-query https://example.com   # curl の DoH
```

クライアントの側は、`systemd-resolved` なら、`/etc/systemd/resolved.conf` に `DNS=192.0.2.53#dns.example.com` と `DNSOverTLS=yes` を書きます(`#` の後ろは、証明書を確かめる名前)。

つながらないときの確認の順番です。

1. `ss` で、853 番、443 番を named が待ち受けているか。
2. ファイアウォールで、その通信が通るか。
3. 証明書の名前(SAN)が、クライアントが指定した名前と合っているか。期限は切れていないか。
4. 証明書に中間証明書(`fullchain`)が入っているか。

## 4.4 DNSSEC (重要度2)

### 1. DNSSEC のレコード

**DNSSEC** は、DNS の答えが、正しい持ち主のもので、途中で書き換えられていないことを、電子署名で確かめる仕組みです。通信の暗号化(DoT、DoH)とは別のものです。

| レコード | 役割 |
|---|---|
| **DNSKEY** | ゾーンの公開鍵 |
| **RRSIG** | レコードの組に付けた署名 |
| **DS** | 子ゾーンの KSK のハッシュ。**親のゾーン**に置く。親と子をつなぐ |
| **NSEC** | 次に存在する名前を示し、「その名前はない」ことを証明する。**名前を順にたどれてしまう**(ゾーンの列挙) |
| **NSEC3** | NSEC の名前をハッシュにして、列挙しにくくしたもの |
| **NSEC3PARAM** | NSEC3 のハッシュの設定(回数、ソルト)を持つレコード |
| **TLSA** | サーバーの証明書の情報(DANE)。DNSSEC で署名して使う |

鍵は 2 つに役割を分けます。

- **KSK**(鍵署名鍵): DNSKEY の組に署名する。ハッシュを親に DS として登録する。替えるときに親の作業が要るので、長く使う。
- **ZSK**(ゾーン署名鍵): 実際のレコードに署名する。親に関係がないので、短い周期で替えられる。

BIND 9.18 の `dnssec-policy default` は、1 つの鍵で両方の役目をする **CSK** を使います。

```text
[parent zone]  com
    |
    |  DS : KSK のハッシュを、親に置く
    v
[child zone]   example.com
    |
    |  DNSKEY (KSK) : DNSKEY の組に署名する
    |  DNSKEY (ZSK) : ほかのレコードに署名する
    v
[records]      A、MX など + RRSIG(署名)
```

親に DS が登録されて、はじめて**信頼のつながり**(チェーン)ができます。登録しないと、署名があっても、検証するリゾルバーは「署名なしのゾーン」として扱います(安全ではないが、動く)。

### 2. dnssec-policy で自動にする(BIND 9.16 以降、9.18 でも使える)

鍵の作成、署名、鍵の交換を named に任せる方法です。通常はこちらを使います。

```text
zone "example.com" {
    type primary;
    file "/var/lib/bind/example.com.zone";    // Red Hat 系は /var/named/ の下
    dnssec-policy default;
    inline-signing yes;
};
```

- 9.18 では、静的なゾーンファイルに `dnssec-policy` を使うとき、**`inline-signing yes;` を明示します**。元のゾーンファイルは書き換えず、署名したコピーを別に作ります。動的更新(`allow-update` など)のゾーンでは不要です。
- 鍵は `key-directory`(既定では `directory` の場所)に作られます。鍵のファイルは named だけが読めるようにします。
- 方針を自分で決めるには、`dnssec-policy "名前" { … };` を書きます。

```text
dnssec-policy "mypolicy" {
    keys {
        ksk lifetime unlimited algorithm ecdsap256sha256;
        zsk lifetime 90d algorithm ecdsap256sha256;
    };
    nsec3param iterations 0 optout no salt-length 0;   // NSEC3 を使う
};
```

- `nsec3param` を書くと、NSEC の代わりに NSEC3 になります。ハッシュの繰り返し(`iterations`)は、**0** とし、ソルトは使わないのが、今の推奨(RFC 9276)です。
- 反映は `rndc reconfig`。状態は `rndc dnssec -status example.com`。
- **DS を親に登録する**のは、人の作業です(レジストラーの画面など)。DS の値は、`dnssec-dsfromkey` で作るか、`dig example.com DNSKEY` の結果から作ります。登録したら、`rndc dnssec -checkds -key <鍵 ID> published example.com` で named に伝えます。
- 署名をやめるときは、**先に親の DS を消し、DS の TTL が過ぎてから**署名を止めます。順番を逆にすると、検証するリゾルバーが SERVFAIL を返し、ドメインが引けなくなります。

### 3. 手作業の署名(dnssec-* コマンド)

`dnssec-policy` を使わない、古くからの方法です。仕組みの理解と試験のために、コマンドを覚えます。

| コマンド | 役割 | 例 |
|---|---|---|
| `dnssec-keygen` | 鍵を作る | `dnssec-keygen -a ECDSAP256SHA256 -n ZONE example.com`(ZSK)、`-f KSK` を付けると KSK |
| `dnssec-settime` | 鍵の時刻(公開、有効化、無効化、削除)を変える | `dnssec-settime -I +30d -D +37d Kexample.com.+013+12345` |
| `dnssec-signzone` | ゾーンに署名する | `dnssec-signzone -S -o example.com -N increment example.com.zone` |
| `dnssec-dsfromkey` | KSK から DS を作る | `dnssec-dsfromkey -2 Kexample.com.+013+67890.key` |
| `dnssec-verify` | 署名したゾーンが正しいか確かめる | `dnssec-verify -o example.com example.com.zone.signed` |

- `dnssec-keygen` は、`K<ゾーン>.+<アルゴリズム番号>+<鍵 ID>.key`(公開鍵)と `.private`(秘密鍵)を作ります。ECDSAP256SHA256 の番号は 13 です。
- `dnssec-settime` の主な時刻のオプションは、`-P`(公開)、`-A`(有効化)、`-I`(無効化の予定)、`-D`(削除)です。鍵の交換では、新しい鍵を先に公開し、時間を置いて有効にし、古い鍵を後で消します。
- `dnssec-signzone` の署名には**期限**(標準で約 30 日)があります。期限が切れる前に署名し直さないと、検証するリゾルバーがすべて SERVFAIL を返します。cron などで定期的に実行します。NSEC3 にするときは `-3 <ソルト>` を付けます。
- 署名したゾーン(`.signed`)を、`named.conf` の `file` に指定します。ゾーンの内容を変えたら、署名し直します。

### 4. 検証する側とトラストアンカー

DNSSEC の検証は、リゾルバーが行います。検証の出発点が**トラストアンカー**(信頼の起点。通常はルートゾーンの KSK)です。

```text
options {
    dnssec-validation auto;     // BIND に組み込まれたルートのトラストアンカーを使う(推奨)
};
```

- Debian 系の既定は `dnssec-validation auto;` です。Red Hat 系の `named.conf` は `dnssec-validation yes;` で、ルートのトラストアンカーを `include "/etc/named.root.key";`(`trust-anchors` が書かれたファイル)で読み込みます【要確認】。
- 内部のゾーンなど、公開の DNS にないゾーンを検証したいときは、`trust-anchors { "internal.example" static-ds 12345 13 2 "…"; };` のように、**自分でトラストアンカーを登録**します(`static-key` や `initial-key` もある)。
- トラストアンカーの更新(ルートの KSK の交換)は、RFC 5011 で自動で追従します(`initial-key`、`initial-ds`、組み込みの `auto`)。`static-*` は追従せず、**手で保守**します。

確かめ方です。

```bash
dig +dnssec example.com A @127.0.0.1       # 答えに RRSIG が付く。検証できれば flags に ad が出る
dig +dnssec +cd example.com A @127.0.0.1   # +cd は検証をしない。これで答えが出るのに、+cd なしで SERVFAIL なら、検証の失敗
delv @127.0.0.1 example.com A              # リゾルバーと同じ検証をして、'; fully validated' と出す
dig example.com DS +short                  # 親のゾーンに DS が登録されているか
dig _443._tcp.www.example.com TLSA +dnssec # TLSA レコード
```

- `ad`(Authenticated Data)は、検証したリゾルバーが付けます。自分のサーバーが検証しているかも、これで分かります。
- `delv` の `; unsigned answer` は署名なしのゾーン、`; resolution failed: …` は検証の失敗です。`+rtrace`(検証の途中の問い合わせ)、`+vtrace`(検証の手順)を付けると、どこで失敗したかが分かります。
- 症状別の原因です。
  - 署名の期限切れ(RRSIG の期限): SERVFAIL。
  - 親の DS と子の KSK が合わない(鍵を替えたのに DS を替えていない): SERVFAIL。
  - ゾーンの変更後に署名し直していない: SERVFAIL(`dnssec-signzone` の方法)。
- サーバーの時刻が大きくずれていても、署名の期限の検査に失敗します。時刻は `chronyc tracking` で確かめます。

### 5. DANE と TLSA

**TLSA** レコードは、サーバーの証明書や公開鍵のハッシュを DNS に書き、クライアントがそれと照らします(DANE)。**DNSSEC で署名されている**ことが前提です。

```text
_25._tcp.mail.example.com. IN TLSA 3 1 1 <公開鍵の SHA-256 の 16 進数>
```

- `3 1 1` は「サーバー証明書(DANE-EE)、公開鍵の部分(SPKI)、SHA-256」です。
- 公開鍵のハッシュを求める例です。

```bash
openssl x509 -in cert.pem -noout -pubkey \
  | openssl pkey -pubin -outform DER \
  | openssl dgst -sha256 -binary | xxd -p -c 64
```

- ブラウザーは、標準では DANE を使いません。使われるのは、主に**メールサーバーどうし**(SMTP)です。
- Let's Encrypt の更新で**鍵が新しくなる**と、TLSA のハッシュが合わなくなり、メールが届かなくなります。`certbot renew --reuse-key` で鍵を使い回すか、新しい鍵の TLSA を先に公開してから切り替えます。

## 4.5 メールセキュリティ (重要度2)

### 1. SPF、DKIM、DMARC

メールの送信元は、そのままでは偽れます。次の 3 つは、**受信側が送信元の正しさを確かめる**ための、DNS の TXT レコードを使う仕組みです。

| | 何を確かめるか | DNS に書くもの |
|---|---|---|
| **SPF** | メールを送ってきたサーバーの IP アドレスが、そのドメインから許可されたものか | `example.com` の TXT |
| **DKIM** | メールが、そのドメインの鍵で署名されていて、途中で改ざんされていないか | `<セレクター>._domainkey.example.com` の TXT(公開鍵) |
| **DMARC** | SPF か DKIM の結果が、「From: に見えるドメイン」と合っているか。失敗したときの扱いと、報告の送り先 | `_dmarc.example.com` の TXT |

```text
sender (example.com)           receiver
    |                            |
    |--- mail ------------------>|  送信元の IP アドレスと DKIM-Signature が付く
    |                            |  SPF   : IP アドレスが許可されているか
    |                            |  DKIM  : 署名を DNS の公開鍵で確かめる
    |                            |  DMARC : From のドメインと合っているか
    |<-- aggregate report -------|  rua の宛先に、集計の報告が届く
```

**SPF** の書き方です。

```text
example.com.  IN TXT  "v=spf1 mx ip4:192.0.2.25 include:_spf.example.net -all"
```

| 要素 | 意味 |
|---|---|
| `mx`、`a`、`ip4:`、`ip6:` | 送ってよいサーバー(MX のホスト、A のホスト、IP アドレス) |
| `include:` | ほかのドメインの SPF を取り込む(外部のメール配信サービスなど) |
| `-all` | 上のどれにも当てはまらなければ**拒否**(fail) |
| `~all` | 当てはまらなければ**疑わしい**として受け取る(softfail)。導入の途中で使う |

- 1 つのドメインに SPF の TXT は **1 つだけ**です。2 つあると、エラー(permerror)になります。
- SPF の評価では、DNS の問い合わせが **10 回まで**です(`include`、`a`、`mx` などで数える)。超えると permerror です。
- SPF が見るのは、**封筒の送信元**(`MAIL FROM`)です。画面に見える `From:` ではありません。また、メールが**転送**されると、転送した側の IP アドレスから届くので、SPF は失敗しやすくなります。

**DKIM** は、送信するサーバーが、秘密鍵でヘッダーと本文に署名し、`DKIM-Signature:` ヘッダーを付けます。受信側は、`d=`(ドメイン)と `s=`(セレクター)から、公開鍵を DNS で取って確かめます。

```text
DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=202611; h=from:to:subject:date; bh=…; b=…
```

```text
202611._domainkey.example.com.  IN TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkq…(公開鍵。架空)"
```

- **セレクター**で、鍵を複数持てます。鍵の交換は、新しいセレクターで公開して、署名を切り替え、古いものを後で消します。
- メールの途中で、件名や本文を書き換える装置(メーリングリストなど)があると、署名が合わなくなります。

**DMARC** です。

```text
_dmarc.example.com.  IN TXT  "v=DMARC1; p=none; rua=mailto:dmarc@example.com"
```

| タグ | 意味 |
|---|---|
| `p=` | 失敗したときの扱い。`none`(何もしない、報告だけ)、`quarantine`(迷惑メール扱い)、`reject`(拒否) |
| `rua=` | 集計レポート(どこから何通届き、結果はどうだったか)の送り先 |
| `sp=` | サブドメインの扱い |
| `adkim=`、`aspf=` | アラインメントの厳しさ(`r` ゆるい、`s` 厳しい) |

- DMARC に通るには、**SPF か DKIM のどちらか 1 つが成功し、かつ、そのドメインが `From:` のドメインと合っている**(アラインメント)必要があります。SPF や DKIM が単に成功しても、ドメインが合っていなければ、DMARC は失敗します。
- 導入は、`p=none` で始め、`rua` のレポートで、正当なメールが失敗していないか確かめます。そのあと `quarantine`、`reject` と強めます。いきなり `reject` にすると、設定漏れの正当なメールが捨てられます。

### 2. OpenDKIM と Postfix

**OpenDKIM** は、Postfix にミルター(メールを通す途中の部品)としてつなぎ、署名と検証をするソフトです。

| | Red Hat 系 | Debian 系 |
|---|---|---|
| パッケージ | `opendkim`、`opendkim-tools`(EPEL)【要確認】 | `opendkim`、`opendkim-tools` |
| 設定 | `/etc/opendkim.conf`、`/etc/opendkim/` | `/etc/opendkim.conf`、`/etc/opendkim/` |

```bash
# 鍵を作る(セレクター 202611。2048 ビットの RSA)
sudo opendkim-genkey -b 2048 -d example.com -s 202611 -D /etc/opendkim/keys/example.com
#   → 202611.private(秘密鍵)と 202611.txt(DNS に載せる TXT)ができる
sudo chown opendkim:opendkim /etc/opendkim/keys/example.com/202611.private
sudo chmod 600 /etc/opendkim/keys/example.com/202611.private
```

```text
# /etc/opendkim.conf
Domain      example.com
Selector    202611
KeyFile     /etc/opendkim/keys/example.com/202611.private
Socket      inet:8891@localhost
```

```text
# /etc/postfix/main.cf(ミルターとしてつなぐ)
smtpd_milters = inet:localhost:8891
non_smtpd_milters = $smtpd_milters
milter_default_action = accept
```

- `milter_default_action = accept` は、OpenDKIM が止まっていても、メールを止めません(署名がなくなるだけ)。
- 秘密鍵が、ほかのユーザーに読めると、なりすましの署名ができます。所有者を `opendkim`、権限を 600 にします。
- 確かめ方は `opendkim-testkey -d example.com -s 202611 -vvv`(DNS の公開鍵と秘密鍵が合っているか)と、`dig +short TXT 202611._domainkey.example.com` です。
- 受信したメールは、ヘッダーの `Authentication-Results:` に `spf=pass dkim=pass dmarc=pass` のように結果が書かれます。

### 3. SMTPS、IMAPS、STARTTLS

メールの通信を暗号化する方法は、2 つあります。

| 方式 | 動き | 例 |
|---|---|---|
| **暗黙の TLS**(最初から TLS) | つないだ直後から TLS | SMTPS 465、IMAPS 993、POP3S 995 |
| **STARTTLS** | 平文でつないで、`STARTTLS` の命令で TLS に切り替える | SMTP 25 と 587、IMAP 143、POP3 110 |

| ポート | 用途 | 暗号化 |
|---|---|---|
| 25 | サーバーどうしの配送(SMTP) | STARTTLS(できる相手とだけ。強制しにくい) |
| 587 | メールソフトからの送信(**サブミッション**) | STARTTLS を必須にし、SMTP 認証をする |
| 465 | メールソフトからの送信(**SMTPS**) | 最初から TLS |
| 143 | 受信(IMAP) | STARTTLS |
| 993 | 受信(**IMAPS**) | 最初から TLS |

```text
client                            server
    |                                |
    |-- EHLO ----------------------->|  拡張機能を問い合わせる
    |<-- 250-STARTTLS ---------------|  STARTTLS が使える、と返る
    |-- STARTTLS ------------------->|  TLS に切り替えたい
    |<-- 220 Ready to start TLS -----|  よい、と返る
    |== TLS handshake ==============>|  ここから暗号化
    |-- AUTH ... ------------------->|  暗号化のあとで認証する
```

**STARTTLS の弱点**は、最初が平文なので、途中の攻撃者が `250-STARTTLS` の行を消すと、TLS が使われないまま、**平文で続けられてしまう**(ダウングレード)ことです。25 番で暗号化を「できるときだけ」にすると、これを防げません。587 番の送信では、**必須**にして、パスワードを平文で送らないようにします。サーバーどうしでは、DANE(4.4)や MTA-STS で、暗号化を必須にできます。

Postfix の設定です。

```text
# main.cf: 25 番の受信
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.example.com/fullchain.pem
smtpd_tls_key_file  = /etc/letsencrypt/live/mail.example.com/privkey.pem
smtpd_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
# TLS の前は、パスワードを受け付けない
smtpd_tls_auth_only = yes

# master.cf: 587(STARTTLS を必須にする)
submission inet n - y - - smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes

# master.cf: 465(最初から TLS)
smtps inet n - y - - smtpd
  -o syslog_name=postfix/smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
```

- `smtpd_tls_protocols` の `>=TLSv1.2` の書き方は Postfix 3.6 以降です。RHEL 9 系の Postfix は 3.5 系【要確認】なので、上のように、古い版を `!` で除く書き方が両方で使えます。
- Dovecot は、`/etc/dovecot/conf.d/10-ssl.conf` に `ssl = required`、`ssl_min_protocol = TLSv1.2`、証明書と鍵を書き、`10-master.conf` の `service imap-login` で、143 番(STARTTLS)と 993 番(`imaps`、`ssl = yes`)を有効にします。
- 確かめるには、次のコマンドを使います。

```bash
openssl s_client -starttls smtp -connect mail.example.com:587 -servername mail.example.com
openssl s_client -connect mail.example.com:465 -servername mail.example.com    # 最初から TLS
openssl s_client -starttls imap -connect mail.example.com:143
openssl s_client -connect mail.example.com:993
```

ポイントは次のとおりです。

- 暗号化(TLS)は、**通信の途中を守る**もの。SPF、DKIM、DMARC は、**送信元の正しさを確かめる**もの。目的が違うので、両方入れます。
- Let's Encrypt の証明書を更新したら、Postfix と Dovecot も reload します。
