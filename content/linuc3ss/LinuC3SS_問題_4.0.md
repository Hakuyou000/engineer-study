# LinuC3SS 問題 4.0 セキュアプロトコルによる各種機能の実装

対象: LinuC レベル3 3SS試験 Version 1.0 / 全39問 / すべてオリジナル問題
対応テキスト: `LinuC3SS_4.0_セキュアプロトコルによる各種機能の実装.md`
解答・解説は末尾。

## 問題

### 4.1 Let's Encrypt による証明書管理

**問1** `LinuC3SS-4.0-001` example.com の Web サーバー(nginx)に、`certbot --nginx -d example.com` で Let's Encrypt の証明書を取ろうとしたが、`Timeout during connect (likely firewall problem)` で失敗した。DNS の A レコードはこのサーバーを指している。ファイアウォールは 443/tcp だけを許可し、80/tcp は閉じている。原因として最も適切なものはどれか。

- A. 秘密鍵のファイルの権限が 600 になっていて、certbot が読めない。
- B. HTTP-01 チャレンジでは、Let's Encrypt が 80/tcp に確認に来るが、届かない。
- C. DV 証明書の確認は、443/tcp の TLS の中でしか行えない。
- D. nginx の `ssl_protocols` に TLSv1.3 が入っていない。

**問2** `LinuC3SS-4.0-002` `*.example.com` と `example.com` の両方を 1 枚で含む Let's Encrypt の証明書を取りたい。DNS のプラグイン `certbot-dns-route53` が入っていて、API の認証情報も設定済みである。使えるコマンドはどれか。

- A. `certbot certonly --webroot -w /var/www/html -d '*.example.com' -d example.com`
- B. `certbot certonly --standalone -d '*.example.com' -d example.com`
- C. `certbot --nginx -d '*.example.com' -d example.com`
- D. `certbot certonly --dns-route53 -d '*.example.com' -d example.com`

**問3** `LinuC3SS-4.0-003` Let's Encrypt の証明書の更新を、テスト用の環境で試し、本物の証明書は変えない certbot のコマンドを答えよ(sudo は不要)。

**問4** `LinuC3SS-4.0-004` certbot で更新した証明書が `certbot certificates` では新しい期限になっているのに、nginx が返す証明書は古く、ブラウザーに期限切れの警告が出る。証明書は `certbot certonly --webroot` で取り、systemd の timer ユニットで `certbot renew` を実行している。原因と対処として適切なものはどれか。

- A. `renewal/example.com.conf` を消して、証明書を取り直す。
- B. 更新のたびに TLS の版が変わるので、`ssl_protocols` を書き直す。
- C. nginx は古い証明書をメモリに持ったままである。更新に成功したときに reload するよう、`--deploy-hook 'systemctl reload nginx'` などを設定する。
- D. `/etc/letsencrypt/archive/` のファイルを、手で `/etc/nginx/` にコピーする。

**問5** `LinuC3SS-4.0-005` certbot の動作の記録(チャレンジの失敗の理由なども書かれる)のファイルを、絶対パスで答えよ。

**問6** `LinuC3SS-4.0-006` certbot で example.com の証明書を取った。nginx の `ssl_certificate` に書くファイルとして、更新のあとも設定を変えずに使え、中間証明書も一緒に送れるものはどれか。certbot の標準の置き場所を使っている。

- A. `/etc/letsencrypt/live/example.com/fullchain.pem`
- B. `/etc/letsencrypt/live/example.com/cert.pem`
- C. `/etc/letsencrypt/archive/example.com/fullchain1.pem`
- D. `/etc/letsencrypt/renewal/example.com.conf`

**問7** `LinuC3SS-4.0-007` Let's Encrypt の HTTP-01 と DNS-01 について、正しいものを**2つ**選べ。

- A. HTTP-01 では、`/.well-known/acme-challenge/` の下に置いた内容を、80/tcp で取りに来て確かめる。
- B. HTTP-01 でも、`*.example.com` のワイルドカード証明書が取れる。
- C. DNS-01 を使うには、80/tcp を外に向けて開けておく必要がある。
- D. DNS-01 は、`_acme-challenge.example.com` の TXT レコードに、指定された値を置いて確かめる。

### 4.2 Web サーバーのセキュリティ強化

**問8** `LinuC3SS-4.0-008` ブラウザーでは `https://www.example.com` が正常に開けるが、`curl https://www.example.com` と、社内の API クライアントが `unable to get local issuer certificate` で失敗する。nginx の `ssl_certificate` には、サーバー証明書(エンドエンティティ証明書)だけのファイルを指定している。原因と対処として最も適切なものはどれか。

- A. ルート証明書を、サーバーに置いて、サーバー証明書の前に続けて書く。
- B. TLS 1.3 を無効にして、TLS 1.2 だけにする。
- C. サーバー証明書の後ろに中間証明書を続けたファイル(`fullchain.pem` など)を指定する。
- D. 証明書を EV 証明書に取り替える。

**問9** `LinuC3SS-4.0-009` サーバー `www.example.com` が、TLS 1.3 でつながるかを、手元から確かめたい。コマンドはどれか。

- A. `openssl x509 -connect www.example.com:443 -tls1_3`
- B. `openssl verify -connect www.example.com:443 -tls1_3`
- C. `openssl s_client -starttls tls1_3 -connect www.example.com:443`
- D. `openssl s_client -connect www.example.com:443 -servername www.example.com -tls1_3`

**問10** `LinuC3SS-4.0-010` `openssl x509` で、証明書が、指定した秒数のうちに期限切れになるかを、終了コードで返すオプションを答えよ(秒数は不要)。

**問11** `LinuC3SS-4.0-011` `example.com` の HTTPS の応答に `Strict-Transport-Security: max-age=31536000; includeSubDomains` を付けた。翌日、`https://example.com` を以前に開いたブラウザーから、HTTP の 80/tcp だけで動く旧システム `http://old.example.com` に、つなげなくなった。理由はどれか。

- A. `includeSubDomains` により、ブラウザーが、`old.example.com` などのサブドメインも、HTTPS だけでつなぐと覚えたから。
- B. HSTS が、`old.example.com` の DNS の答えを、書き換えたから。
- C. `max-age` が 1 年だと、証明書の有効期間より長いため、設定が無効になったから。
- D. HSTS が効くのは、TLS 1.3 でつないだときだけだから。

**問12** `LinuC3SS-4.0-012` nginx に、次の設定がある。`curl -sI https://example.com/` の応答には `X-Frame-Options` が付くが、`/api/` の応答には付かない。原因はどれか。

```nginx
server {
    add_header X-Frame-Options "SAMEORIGIN" always;
    location /api/ {
        add_header Cache-Control "no-store";
        proxy_pass http://127.0.0.1:8080;
    }
}
```

- A. `always` を付けた `add_header` は、`location` の中の応答には使えない。
- B. `location` の中に `add_header` があるため、`server` の `add_header` が引き継がれない。
- C. `proxy_pass` を使う応答には、ヘッダーを追加できない。
- D. `X-Frame-Options` は、1 つの `server` に 1 回しか書けない。

**問13** `LinuC3SS-4.0-013` セキュリティヘッダーの説明として、正しいものを**2つ**選べ。

- A. `X-Content-Type-Options: nosniff` は、ブラウザーが中身から種類を推測する(MIME スニッフィング)のを止める。
- B. `X-Frame-Options: DENY` は、リンク先に送る参照元(Referer)を、送らないようにする。
- C. `Referrer-Policy: no-referrer` は、リンク先に参照元(Referer)を送らないようにする。
- D. `Content-Security-Policy: default-src 'self'` は、そのサイトを HTTP でつなぐことを禁止する。

**問14** `LinuC3SS-4.0-014` 新しいサイトに `Content-Security-Policy: default-src 'self'` を付けたい。ただし、外部のスクリプトや画像を使っているページがあるか分からず、いきなり付けて画面を壊すのは避けたい。最初の導入として、適切な方法はどれか。

- A. 代わりに `X-Frame-Options: DENY` を付ける。CSP と同じ効果がある。
- B. 代わりに `Referrer-Policy: no-referrer` を付ける。外部の取得元が使えなくなる。
- C. 先に HSTS を付ければ、CSP の違反は起きなくなる。
- D. `Content-Security-Policy-Report-Only` で、違反を報告するだけにして、問題がないと分かってから `Content-Security-Policy` に切り替える。

**問15** `LinuC3SS-4.0-015` HTTP/3 に対応した nginx で、`listen 443 ssl;` に加えて、`listen 443 quic reuseport;`、`http3 on;`、`add_header Alt-Svc 'h3=":443"; ma=86400' always;` を設定した。ファイアウォールは 443/tcp だけを許可している。HTTP/3 に対応したブラウザーで開くと、どうなるか。

- A. 443/tcp の上で、HTTP/3 が動く。
- B. つながらず、サイトが開けなくなる。
- C. HTTP/3 は使われず、TCP の HTTP/2 などで開ける。HTTP/3 を使うには、443/udp を許可する。
- D. 自動で別のポートの 8443/udp にまわり、HTTP/3 で開ける。

**問16** `LinuC3SS-4.0-016` Apache で、OS の暗号ポリシーに頼らず、Apache の設定だけで、TLS 1.2 と TLS 1.3 だけを許可すると明示する設定はどれか。

- A. `SSLProtocol -all +TLSv1.2 +TLSv1.3`
- B. `SSLProtocol all -SSLv3`
- C. `SSLProtocol TLSv1.3`
- D. `SSLCipherSuite TLSv1.2:TLSv1.3`

**問17** `LinuC3SS-4.0-017` ある会社が、自社の Web サイトに OV 証明書を使っている。DV 証明書と比べた、OV 証明書の説明として、正しいものはどれか。

- A. 通信の暗号の強さが、DV 証明書より強い。
- B. ドメインの管理に加えて、組織が実在することを認証局が確かめ、証明書に組織名が入る。
- C. 発行のときに、ドメインを管理していることの確認が省かれる。
- D. クライアントが、ルート証明書を持っていなくても、検証できる。

### 4.3 DNS over TLS/HTTPS

**問18** `LinuC3SS-4.0-018` BIND 9.18 に DoT を設定する。証明書と秘密鍵を指定する `tls dot-tls { cert-file "…"; key-file "…"; };` を書く場所はどれか。

- A. `named.conf`(または include されるファイル)の最上位。`options` の外
- B. `options { }` の中
- C. `zone "example.com" { }` の中
- D. `listen-on { }` の波かっこの中

**問19** `LinuC3SS-4.0-019` BIND 9.18 に DoT を設定し、`ss -tlnp` で named が 853 番で待ち受けていることを確かめた。サーバーのファイアウォール(firewalld)は、53/udp と 53/tcp だけを許可している。外のクライアントが DoT でつなげるようにするために、追加で許可するものはどれか。

- A. 853/udp
- B. 443/udp
- C. 853/tcp
- D. 53/udp を 853/udp に置き換える

**問20** `LinuC3SS-4.0-020` クライアントが DoT で BIND のキャッシュサーバーに問い合わせる。キャッシュサーバーは、権威サーバーに、普通の DNS(53 番)で問い合わせる。DoT で暗号化されるのは、どの区間か。

- A. クライアントからキャッシュサーバー、権威サーバーまでの、すべての区間
- B. クライアントとキャッシュサーバーの間だけ
- C. キャッシュサーバーと権威サーバーの間だけ
- D. どの区間も暗号化されない。DoT は改ざんの検知だけをする

**問21** `LinuC3SS-4.0-021` BIND 9.18 に DoT の設定を入れ、`named-checkconf` は無事に通ったが、`rndc reconfig` のあと 853 番で待ち受けない。ログに、`key-file` を開けない `permission denied` が出ている。鍵のファイルは `-rw------- root root` である。秘密鍵を他のユーザーに読ませずに直す対処は、どれか。

- A. 鍵のファイルを 777 にして、すべてのユーザーが読めるようにする。
- B. 本番でも `tls ephemeral` を使い、鍵のファイルを使わないようにする。
- C. DoT のポートを 853 から 443 に変える。
- D. 鍵のファイルの所有グループを named の実行グループ(Debian 系は `bind`)にして、権限を 640 にする。

**問22** `LinuC3SS-4.0-022` DoT で問い合わせるために、`dig` に付けるオプションを答えよ(`+` から書く)。

**問23** `LinuC3SS-4.0-023` BIND 9.18 で、DoH を 443/tcp で待ち受けたい。`tls dot-tls { … };` は定義済みで、パスは標準の `/dns-query` を使う。DoH の待ち受けとして、正しい設定はどれか。

- A. `listen-on port 443 tls dot-tls { 192.0.2.53; };`
- B. `listen-on port 443 tls dot-tls http default { 192.0.2.53; };`
- C. `listen-on port 443 https dot-tls { 192.0.2.53; };`
- D. `listen-on port 853 http default { 192.0.2.53; };`

### 4.4 DNSSEC

**問24** `LinuC3SS-4.0-024` example.com を `dnssec-policy default;` で署名し、権威サーバーから、署名(RRSIG)が付いた答えが返ることを確かめた。ただし、親(レジストラー)には、DS をまだ登録していない。DNSSEC を検証するリゾルバーから見て、どうなるか。

- A. SERVFAIL になり、ドメインが引けなくなる。
- B. 署名が壊れていると判断されて、答えが返らない。
- C. `ad` フラグが付いて、完全に検証される。
- D. 親とのつながりがないので、署名なしのゾーンとして扱われる。引けるが、検証済みにはならない。

**問25** `LinuC3SS-4.0-025` BIND 9.18 で、ゾーンファイル `/var/lib/bind/example.com.zone`(静的なファイルで、動的更新は使わない)に `dnssec-policy default;` を使って、自動で署名したい。`type primary;`、`file`、`dnssec-policy default;` に加えて、必要な設定はどれか。

- A. `inline-signing yes;`
- B. `allow-transfer { none; };`
- C. `dnssec-validation auto;`
- D. `masterfile-format raw;`

**問26** `LinuC3SS-4.0-026` KSK の公開鍵のファイル(`Kexample.com.+013+12345.key`)から、親のゾーンに登録する DS レコードを作る、BIND 付属のコマンドを答えよ。

**問27** `LinuC3SS-4.0-027` リゾルバーと同じように DNSSEC を検証し、成功すると `; fully validated` と表示する、BIND 付属のコマンドを答えよ。

**問28** `LinuC3SS-4.0-028` 手作業で `dnssec-signzone` を使って署名している example.com が、署名から約 30 日後に、検証するリゾルバーから SERVFAIL になった。`dig +cd example.com A`(検証をしない問い合わせ)では、答えが返る。原因として最も適切なものはどれか。

- A. ゾーンの NS レコードの数が多すぎる。
- B. 権威サーバーの 53/udp が、ファイアウォールで閉じられた。
- C. 署名(RRSIG)の有効期限が切れた。署名し直す必要があり、cron などで定期的に実行する。
- D. リゾルバーの `dnssec-validation` が `auto` になっていない。

**問29** `LinuC3SS-4.0-029` NSEC と NSEC3 について、正しいものを**2つ**選べ。

- A. NSEC3 を使うと、親のゾーンに DS を登録する必要がなくなる。
- B. NSEC は、存在する名前を順につないで示すため、ゾーンの名前の一覧を集められてしまう。
- C. NSEC3PARAM は、親のゾーンに置く、子の KSK のハッシュである。
- D. NSEC3 は、名前をハッシュにして、ゾーンの名前の列挙をしにくくする。ハッシュの設定は NSEC3PARAM が持つ。

**問30** `LinuC3SS-4.0-030` メールサーバー mail.example.com は、DNSSEC で署名したゾーンに `_25._tcp.mail.example.com. IN TLSA 3 1 1 <公開鍵の SHA-256>` を載せている。Let's Encrypt の証明書が自動で更新されたあと、DANE を使う送信元のサーバーから、メールが届かなくなった。更新のときに、新しい鍵が作られていた。対処として適切なものはどれか。

- A. 親のゾーンに、DS を登録し直す。
- B. 更新のときに鍵を使い回す(`certbot renew --reuse-key` など)か、新しい鍵の TLSA を先に公開してから切り替える。
- C. DNSKEY の TTL を、短くする。
- D. SPF の `-all` を `~all` に変える。

**問31** `LinuC3SS-4.0-031` 手作業で鍵を交換する。今の ZSK `Kexample.com.+013+12345` について、30 日後に使うのをやめる(署名には使わなくなる)予定を、鍵のファイルに書きたい。コマンドはどれか。

- A. `dnssec-settime -I +30d Kexample.com.+013+12345`
- B. `dnssec-settime -D +30d Kexample.com.+013+12345`
- C. `dnssec-settime -P +30d Kexample.com.+013+12345`
- D. `dnssec-keygen -I +30d Kexample.com.+013+12345`

**問32** `LinuC3SS-4.0-032` 社内だけの DNS ゾーン `corp.example.internal` を DNSSEC で署名した。社内のキャッシュサーバー(BIND 9.18、`dnssec-validation auto;`)に検証させたいが、公開の DNS には、このゾーンの DS がない。どうすればよいか。

- A. `dnssec-validation no;` にして、検証をやめる。
- B. 公開の親ゾーンに、DS を登録する。
- C. `trust-anchors` に、そのゾーンの KSK の DS か DNSKEY を、`static-ds` か `static-key` で登録する。
- D. `rndc flush` を実行して、キャッシュを消す。

### 4.5 メールセキュリティ

**問33** `LinuC3SS-4.0-033` example.com の SPF は `v=spf1 mx -all` で、自社のメールサーバー(MX のホスト)から送ったメールは、SPF に通る。社員が個人のメールアドレスに転送を設定していて、転送されたメールが、転送先で SPF の失敗になった。主な理由はどれか。

- A. SPF は、TLS で暗号化されたメールには、使えないから。
- B. 転送すると、メールを送る IP アドレスが転送した側のサーバーに変わり、example.com の SPF に書かれていないから。
- C. `-all` は、MX のホストからのメールも拒否する指定だから。
- D. MX レコードが 2 つ以上あると、SPF は必ず失敗するから。

**問34** `LinuC3SS-4.0-034` セレクターが `202611`、署名するドメインが `example.com` の、DKIM の公開鍵を載せる DNS の TXT レコードの名前はどれか。

- A. `_dmarc.example.com`
- B. `_domainkey.202611.example.com`
- C. `202611.example.com`
- D. `202611._domainkey.example.com`

**問35** `LinuC3SS-4.0-035` `From: alice@example.com` のメールが、`MAIL FROM` が `bounce@mailer.example.net` の、メール配信サービスから送られた。`example.net` の SPF は pass で、DKIM の署名はない。example.com は、`_dmarc` に `v=DMARC1; p=reject` を公開している。受信側の DMARC の判定は、どうなるか。

- A. fail になり、`p=reject` により、拒否される。SPF は pass だが、そのドメイン(example.net)が `From:` のドメイン(example.com)と合っていないため。
- B. SPF が pass なので、DMARC も pass になる。
- C. `p=reject` のドメインは、判定されずに、すべて受け取られる。
- D. DKIM の署名がないと、DMARC は判定されない。

**問36** `LinuC3SS-4.0-036` メールの暗号化の方式について、正しいものを**2つ**選べ。

- A. 587 番は、つないだ直後から TLS になる。
- B. 465 番(SMTPS)は、つないだ直後から TLS になる。
- C. 993 番(IMAPS)は、つないだ直後から TLS になる。
- D. 143 番(IMAP)は、つないだ直後から TLS になる。

**問37** `LinuC3SS-4.0-037` Postfix の 587 番(submission)で、暗号化の前に SMTP 認証のパスワードが送られないようにしたい。`master.cf` の `submission` の行の下に書く `-o` の設定として、適切なものはどれか。

- A. `-o smtpd_tls_security_level=none`
- B. `-o smtpd_tls_wrappermode=yes`
- C. `-o smtpd_tls_security_level=encrypt`
- D. `-o smtpd_sasl_auth_enable=no`

**問38** `LinuC3SS-4.0-038` DNS に載せた DKIM の公開鍵と、サーバーの秘密鍵が合っているかを確かめる、OpenDKIM 付属のコマンドを答えよ。

**問39** `LinuC3SS-4.0-039` メールサーバー `mail.example.com` の 587 番が、STARTTLS で TLS に切り替わり、サーバー証明書が正しく送られているかを、手元から確かめたい。コマンドはどれか。

- A. `openssl s_client -connect mail.example.com:587`
- B. `openssl s_client -starttls imap -connect mail.example.com:587`
- C. `openssl x509 -starttls smtp -connect mail.example.com:587`
- D. `openssl s_client -starttls smtp -connect mail.example.com:587 -servername mail.example.com`

## 解答・解説

### 問1 `LinuC3SS-4.0-001`

**正解**: B

`certbot --nginx` は、標準では HTTP-01 チャレンジで、ドメインの管理を確かめます。Let's Encrypt の側が、`http://example.com/.well-known/acme-challenge/<token>` に 80/tcp で取りに来ます。80/tcp が外から届かないと、`Timeout during connect` のように失敗します。対処は、80/tcp を開けるか、80 番を開けられないなら DNS-01 にすることです。

- A. 秘密鍵は、証明書を申請する前に certbot 自身が作ります。チャレンジに失敗する理由ではありません。
- C. DV 証明書のドメインの確認には、HTTP-01(80/tcp)と DNS-01(DNS の TXT レコード)があります。443/tcp の TLS で確かめる TLS-ALPN-01 もありますが、必須ではありません。
- D. チャレンジの確認の通信は、サーバーが今から設定する TLS の版とは関係ありません。

### 問2 `LinuC3SS-4.0-002`

**正解**: D

ワイルドカード証明書(`*.example.com`)は、DNS-01 チャレンジでだけ取れます。DNS のプラグイン(`--dns-route53` など)を使うと、`_acme-challenge` の TXT レコードを、certbot が API で自動で作って消します。`*.example.com` は `example.com` 自体を含まないので、`-d` で両方を指定します。

- A. `--webroot` は HTTP-01 を使います。HTTP-01 では、ワイルドカードの名前は取れません。
- B. `--standalone` も HTTP-01 を使います。ワイルドカードは取れません。
- C. `--nginx` のプラグインも HTTP-01 を使います。ワイルドカードは取れません。

### 問3 `LinuC3SS-4.0-003`

**正解**: `certbot renew --dry-run`、`certbot --dry-run renew`

`certbot renew --dry-run` は、Let's Encrypt のテスト用の環境(staging)で、更新の手順をすべて試します。証明書は保存されず、本番の証明書は変わりません。自動更新(timer ユニットや cron)が正しく動くかを、本番の発行の回数の制限(レート制限)を使わずに確かめられます。

### 問4 `LinuC3SS-4.0-004`

**正解**: C

nginx は、起動したとき(reload したとき)に証明書を読み込みます。ファイルが新しくなっても、reload するまでは古い証明書を返し続けます。`--nginx` や `--apache` のプラグインで入れた場合は、更新のあとに certbot が reload しますが、`--webroot` や `certonly` で取ったときは自分で設定します。`/etc/letsencrypt/renewal-hooks/deploy/` にスクリプトを置いても同じことができます。deploy フックは、更新に成功した証明書があるときだけ動きます。

- A. 更新の設定を消すと、自動更新の対象から外れます。問題の原因は、更新ではなく、反映されていないことです。
- B. 証明書を更新しても、TLS の版は変わりません。
- D. 手でコピーすると、次の更新のときにまた古くなります。`live/` のパスを設定に書き、reload を自動にします。

### 問5 `LinuC3SS-4.0-005`

**正解**: `/var/log/letsencrypt/letsencrypt.log`

certbot のログは、`/var/log/letsencrypt/letsencrypt.log` に書かれます(古いものは `.log.1` などに回されます)。`Challenge failed`、`Timeout during connect`、`unauthorized` などの、失敗の理由はここで確かめます。

### 問6 `LinuC3SS-4.0-006`

**正解**: A

`live/` の下の `fullchain.pem` は、サーバー証明書と中間証明書をつなげたファイルです。更新しても同じパスのまま、中身が新しくなります(実体は `archive/` の番号付きのファイルへのシンボリックリンク)。nginx の `ssl_certificate` と、Apache の `SSLCertificateFile` に使います。

- B. `cert.pem` は、サーバー証明書だけです。中間証明書が付かないので、一部のクライアントで検証に失敗します。
- C. `archive/` の `fullchain1.pem` は、更新のたびに `fullchain2.pem` のように番号が増えます。設定のパスが、更新後に古い証明書を指したままになります。
- D. `renewal/` の `.conf` は、更新の設定ファイルです。証明書ではありません。

### 問7 `LinuC3SS-4.0-007`

**正解**: A、D

ACME の 2 つの代表的なチャレンジです。HTTP-01 は Web サーバーに置いたファイルで、DNS-01 は DNS の TXT レコードで、ドメインの管理を確かめます。

- A. 正しい記述です。HTTP-01 は、公開された 80/tcp の Web サーバーが要ります。
- B. ワイルドカードの名前は、DNS-01 でだけ取れます。
- C. DNS-01 は DNS で確かめるので、80/tcp は要りません。外から見えないサーバーの証明書にも使えます。
- D. 正しい記述です。DNS の API を使うプラグインで、TXT レコードの作成と削除を自動にできます。

### 問8 `LinuC3SS-4.0-008`

**正解**: C

サーバー証明書は、中間証明書を通して、クライアントが信頼するルート証明書までつながって、はじめて検証できます。サーバーは、サーバー証明書と一緒に中間証明書も送る必要があります。ブラウザーは、足りない中間証明書を自分で補うことがあり、開けてしまいます。`curl` や API のクライアントは補わないので、失敗します。

- A. ルート証明書は、クライアントが元から持っています。サーバーが送る必要はなく、足りないのは中間証明書です。
- B. TLS の版と、証明書の連なりの不足は、関係ありません。
- D. 証明書の種類(EV、OV、DV)を替えても、中間証明書を送らない問題は変わりません。

### 問9 `LinuC3SS-4.0-009`

**正解**: D

`openssl s_client` は、サーバーに実際につないで、TLS の握手と証明書を表示します。`-tls1_3` で TLS 1.3 だけで試せます(`-tls1_2` なら 1.2)。`-servername` で、SNI(接続先の名前)を送ります。名前ごとに証明書を切り替えるサーバーでは、これがないと、別の証明書が返ることがあります。

- A. `openssl x509` は、証明書のファイルを読んで表示するコマンドで、サーバーにはつながりません。
- B. `openssl verify` は、証明書のファイルの検証をするコマンドで、サーバーにはつながりません。
- C. `-starttls` は、SMTP などで、平文から TLS に切り替えるプロトコルの名前(`smtp`、`imap` など)を指定します。TLS の版は指定できません。

### 問10 `LinuC3SS-4.0-010`

**正解**: `-checkend`、`--checkend`、`checkend`

`openssl x509 -in cert.pem -noout -checkend 2592000` のように使います。指定した秒数のうちに期限が切れるなら終了コード 1、切れないなら 0 になります(2592000 秒は 30 日)。cron や監視のスクリプトで、期限の近い証明書を見つけるのに使えます。

### 問11 `LinuC3SS-4.0-011`

**正解**: A

HSTS は、「この名前には、指定した期間、HTTPS だけでつなぐ」とブラウザーに覚えさせます。`includeSubDomains` を付けると、サブドメインも対象です。HTTPS に対応していない `old.example.com` には、つなげなくなります。HSTS は取り消しにくいので、サブドメインがすべて HTTPS になってから `includeSubDomains` を付けます。最初は `max-age=300` のような短い値で試します。

- B. HSTS は、ブラウザーの動きを決めるヘッダーです。DNS の答えには関係ありません。
- C. `max-age` と証明書の有効期間は、無関係です。
- D. HSTS は、TLS の版にかかわらず、HTTPS の応答に付けると効きます。

### 問12 `LinuC3SS-4.0-012`

**正解**: B

nginx の `add_header` は、下の階層(`location` など)に `add_header` が 1 つでもあると、上の階層(`server` など)の `add_header` を引き継ぎません。`/api/` の `location` に、必要なヘッダーを書き足します。ヘッダーを `include` で共通のファイルにして、各階層から読み込む方法もあります。

- A. `always` は、4xx や 5xx の応答にもヘッダーを付ける指定で、`location` の中でも使えます。
- C. `proxy_pass` の応答にも、`add_header` でヘッダーを付けられます。
- D. `X-Frame-Options` を書く回数に、そのような決まりはありません。

### 問13 `LinuC3SS-4.0-013`

**正解**: A、C

ヘッダーごとに、役割が違います。目的に合わせて組み合わせます。

- A. 正しい記述です。ブラウザーが、画像のふりをした実行ファイルなどを、中身から判断して実行するのを防ぎます。
- B. `X-Frame-Options` は、ページを別のサイトの `<iframe>` に埋め込めなくします(クリックジャッキングの対策)。参照元とは関係ありません。
- C. 正しい記述です。`strict-origin-when-cross-origin` のように、送る量を減らす値もあります。
- D. `Content-Security-Policy` は、読み込めるスクリプトや画像などの取得元を制限します。HTTPS だけにするのは、HSTS の役割です。

### 問14 `LinuC3SS-4.0-014`

**正解**: D

`Content-Security-Policy-Report-Only` は、ルールに違反したものを報告するだけで、実際には止めません。報告を見て、必要な取得元をルールに足してから、`Content-Security-Policy` にして強制します。

- A. `X-Frame-Options` は、`<iframe>` への埋め込みの制限だけです。CSP のスクリプトなどの制限の代わりになりません。
- B. `Referrer-Policy` は、参照元の送り方を決めます。取得元の制限ではありません。
- C. HSTS は、HTTPS だけでつなぐ指定です。CSP の違反とは関係ありません。

### 問15 `LinuC3SS-4.0-015`

**正解**: C

HTTP/3 は、TCP ではなく、QUIC(UDP の上の暗号化された通信)で動きます。使う UDP の 443 番が止まっていると、ブラウザーは HTTP/3 を諦めて、TCP の HTTP/2(または HTTP/1.1)に戻ります。サイトは開けますが、HTTP/3 にはなりません。ファイアウォールで 443/udp を開けます。

- A. HTTP/3 は TCP では動きません。
- B. ブラウザーは、HTTP/3 が使えないとき、TCP に戻って開きます。
- D. ポートが自動で変わることはありません。

### 問16 `LinuC3SS-4.0-016`

**正解**: A

`SSLProtocol -all +TLSv1.2 +TLSv1.3` は、いったんすべてを無効にして、使う版だけを足す書き方です。許可する版がはっきりして、確実です。nginx では `ssl_protocols TLSv1.2 TLSv1.3;` と書きます。

- B. `all -SSLv3` は、SSLv3 だけを除く指定です。TLS 1.0 と 1.1 は、設定の上では許可したままです(実際に使えるかは、OS の暗号ポリシーしだいです)。
- C. `SSLProtocol TLSv1.3` は、TLS 1.3 だけを許可します。TLS 1.2 は許可されません。
- D. `SSLCipherSuite` は、暗号スイートを指定する設定です。TLS の版は決められません。

### 問17 `LinuC3SS-4.0-017`

**正解**: B

証明書の種類は、認証局が何を確かめるかで決まります。DV はドメインの管理、OV はそれに加えて組織の実在、EV は OV よりさらに厳しい審査です。暗号の強さは、種類で変わりません。

- A. 暗号の強さは、鍵の種類や TLS の設定で決まります。DV、OV、EV で変わりません。
- C. OV でも、ドメインの確認は行われます。
- D. どの種類でも、検証には、クライアントが信頼するルート証明書までのつながりが要ります。

### 問18 `LinuC3SS-4.0-018`

**正解**: A

`tls <名前> { … };` は、`options` と同じ階層の、独立したステートメントです。`options` の中の `listen-on port 853 tls dot-tls { … };` から、名前で参照します。Debian 系では、`named.conf.options` の `options` の外に書いても、`named.conf` から include されるので同じです。

- B. `options` の中には書けません。`options` の外に書きます。
- C. `zone` の中は、ゾーンごとの設定です。TLS の鍵は、サーバー全体の設定です。
- D. `listen-on` の波かっこには、待ち受ける IP アドレスを書きます。

### 問19 `LinuC3SS-4.0-019`

**正解**: C

DoT は、TCP の 853 番を使います。`firewall-cmd --permanent --add-port=853/tcp` で許可し、`firewall-cmd --reload` で反映します(Debian 系で ufw なら `ufw allow 853/tcp`)。DoH も使うなら、443/tcp も要ります。普通の DNS(53 番)は、クライアントが使う限り、そのまま残します。

- A. DoT は TCP です。UDP の 853 番は、使いません。
- B. UDP の 443 番は、HTTP/3(QUIC)で使います。DoT とは関係ありません。
- D. 53 番の許可を外すと、普通の DNS が使えなくなります。DoT は、53 番の代わりではなく、追加の待ち受けです。

### 問20 `LinuC3SS-4.0-020`

**正解**: B

DoT と DoH が守るのは、クライアントとリゾルバー(キャッシュサーバー)の間です。リゾルバーが権威サーバーに問い合わせる区間は、そのまま平文です。また、DoT と DoH は、答えが本物であることを保証しません。それは DNSSEC の役割です。

- A. リゾルバーと権威サーバーの間は、DoT の対象外です。
- C. 反対です。守られるのは、クライアントとリゾルバーの間です。
- D. DoT は通信を暗号化し、途中での書き換えも検知します。ただし、リゾルバーが返す答えが権威サーバーの本物のデータかどうかは保証しません。それは DNSSEC の署名の役割です。

### 問21 `LinuC3SS-4.0-021`

**正解**: D

named は、専用のユーザー(`named`、Debian 系は `bind`)で動くので、root だけが読めるファイルは読めません。所有グループを named のグループにして、グループに読み取りを許す(640)と、他のユーザーには読ませずに済みます。秘密鍵が漏れると、サーバーになりすませるので、読めるユーザーは最小にします。AppArmor や SELinux で、置き場所が許されているかも確かめます【要確認】。

- A. 全員が読めると、秘密鍵が漏れます。
- B. `tls ephemeral` は、一時的な自己署名の証明書で動く、試験用の指定です。クライアントが証明書を検証できず、本番に向きません。
- C. ポートを変えても、鍵のファイルが読めない問題は直りません。

### 問22 `LinuC3SS-4.0-022`

**正解**: `+tls`、`dig +tls`

BIND 9.18 以降の `dig` は、`+tls` で DoT、`+https` で DoH の問い合わせができます。たとえば `dig +tls @dns.example.com example.com A` のように使います。`kdig`(knot-dnsutils のコマンド)も `+tls` を使います。

### 問23 `LinuC3SS-4.0-023`

**正解**: B

`listen-on` に、`tls <名前>` と `http <名前>` の両方を付けると DoH になります。`default` は、標準の設定(`/dns-query`)の名前です。`http` を付けない `tls` だけの指定は、DoT です。

- A. `http` がないので、443 番で DoT になります。DoH ではありません。
- C. `https` というキーワードは、`listen-on` にありません。
- D. `http` を使う `listen-on` には、`tls` の指定が必須です。`tls` がないので、設定の誤りになります。暗号化しない HTTP で受けるときも、`tls none` と書きます。また、853 番は、DoT の標準のポートです。

### 問24 `LinuC3SS-4.0-024`

**正解**: D

信頼のつながり(チェーン)は、ルートから親、子へと、DS で受け渡されます。親に DS がないと、検証するリゾルバーは、子のゾーンを署名なし(insecure)として扱います。普通に引けますが、`ad` は付きません。DS を登録して、はじめて DNSSEC が働きます。逆に、DS を登録したのに子の署名や鍵が合っていないと、SERVFAIL になります。

- A. DS がない場合は、署名なしの扱いで、SERVFAIL にはなりません。SERVFAIL になるのは、DS を登録したのに、署名や鍵が合っていないときです。
- B. 署名自体は正しく、検証に使う手がかり(DS)がないだけです。
- C. DS がないので、検証はされず、`ad` は付きません。

### 問25 `LinuC3SS-4.0-025`

**正解**: A

9.18 では、静的なゾーンファイルに `dnssec-policy` を使うとき、`inline-signing yes;` を明示します。元のゾーンファイルは書き換えず、署名したコピーを別に作って配ります。動的更新のゾーン(`allow-update` など)では不要です。反映は `rndc reconfig`、状態は `rndc dnssec -status example.com` で確かめます。

- B. `allow-transfer` は、ゾーン転送の許可の設定です。署名には関係ありません。
- C. `dnssec-validation` は、リゾルバーとして検証するための `options` の設定です。ゾーンの署名ではありません。
- D. `masterfile-format raw` は、ゾーンファイルの形式の指定です。署名には必須ではありません。

### 問26 `LinuC3SS-4.0-026`

**正解**: `dnssec-dsfromkey`

`dnssec-dsfromkey -2 Kexample.com.+013+12345.key` で、SHA-256 の DS が出ます。出た値を、親のゾーンの管理者(レジストラーの画面など)に登録します。

### 問27 `LinuC3SS-4.0-027`

**正解**: `delv`

`delv @127.0.0.1 example.com A` のように使います。`+rtrace` や `+vtrace` を付けると、どの手順で検証に失敗したかが分かります。署名のないゾーンは `; unsigned answer`、検証の失敗は `; resolution failed: …` と出ます。`dig +dnssec` は、答えと RRSIG を見る道具です。検証そのものは、`ad` フラグで確かめます。

### 問28 `LinuC3SS-4.0-028`

**正解**: C

`dnssec-signzone` が付ける署名には、期限があります(標準で約 30 日)。期限が切れると、検証するリゾルバーは、署名が無効と判断して SERVFAIL を返します。検証をしない `+cd` で答えが返ることから、署名の検証に失敗していると分かります。期限の前に署名し直すこと(cron など)が必要です。`dnssec-verify` で、署名したゾーンの内容を確かめられます。自動にしたいときは、`dnssec-policy` に切り替えます。

- A. NS レコードの数は、署名の有効性に関係ありません。
- B. 53/udp が閉じられていたら、`+cd` でも答えが返りません。
- D. リゾルバーの設定が原因なら、ほかの署名つきのゾーンでも同じ症状が出ます。署名から約 30 日で起きるのは、期限切れの特徴です。

### 問29 `LinuC3SS-4.0-029`

**正解**: B、D

NSEC と NSEC3 は、どちらも「その名前は存在しない」ことを、署名つきで証明するレコードです。違いは、名前をそのまま使うか、ハッシュにするかです。

- A. DS が要るかどうかは、NSEC と NSEC3 の選択とは関係ありません。どちらでも、親に DS を登録します。
- B. 正しい記述です。NSEC をたどると、ゾーンのすべての名前が分かります。
- C. 親のゾーンに置いて、子の KSK のハッシュを持つのは DS です。NSEC3PARAM は、子のゾーンにあって、NSEC3 の設定(繰り返しの回数、ソルト)を示します。
- D. 正しい記述です。BIND の `dnssec-policy` では、`nsec3param iterations 0 optout no salt-length 0;` のように書きます。

### 問30 `LinuC3SS-4.0-030`

**正解**: B

TLSA の `3 1 1` は、サーバー証明書の公開鍵の SHA-256 です。更新で鍵が変わると、DNS の TLSA と、サーバーが見せる鍵が合わなくなり、DANE を使う相手は、接続を拒否します。鍵を使い回す(`--reuse-key`)と、TLSA を変える必要がありません。鍵を変えるなら、新しい鍵の TLSA を先に公開して、古い TLSA の TTL が過ぎてから切り替えます。

- A. DS は、ゾーンの署名の信頼のつながりです。証明書の鍵が変わっても、DS は変わりません。
- C. DNSKEY の TTL を短くしても、TLSA と証明書の鍵の不一致は直りません。
- D. SPF は、送信元のサーバーを確かめる設定で、DANE の失敗とは関係ありません。

### 問31 `LinuC3SS-4.0-031`

**正解**: A

`dnssec-settime` は、鍵のファイルに、時刻の予定を書き込みます。`-I` は無効化(署名に使わなくなる。ゾーンには残る)、`-D` は削除(ゾーンからも消える)、`-P` は公開(ゾーンに DNSKEY を出す)、`-A` は有効化(署名に使い始める)です。新しい鍵は `dnssec-keygen` で作り、先に公開して、時間を置いてから有効にします。

- B. `-D` は、ゾーンから消す日です。署名に使わなくなる日は `-I` です。
- C. `-P` は、DNSKEY をゾーンに公開する日です。
- D. `dnssec-keygen` は、鍵を新しく作るコマンドで、既存の鍵の時刻は変えません。

### 問32 `LinuC3SS-4.0-032`

**正解**: C

検証は、トラストアンカー(信頼の起点)から始まります。`auto` の標準のトラストアンカーは、ルートゾーンのものです。ルートからつながらない内部のゾーンは、`trust-anchors { "corp.example.internal" static-ds … ; };` のように、自分でトラストアンカーを登録します。`static-*` は追従しないので、鍵を交換したら、手で更新します。

- A. 検証をやめると、ほかのゾーンの DNSSEC の保護も、すべて失われます。
- B. `.internal` のような公開の DNS にないゾーンは、親に DS を登録できません。
- D. `rndc flush` は、キャッシュを消すだけです。トラストアンカーは増えません。

### 問33 `LinuC3SS-4.0-033`

**正解**: B

SPF は、メールを送ってきたサーバーの IP アドレスが、送信元のドメインの SPF で許可されているかを確かめます。メールを転送すると、転送先から見て、送ってくるのは転送したサーバーです。その IP アドレスは、元のドメインの SPF に書かれていないので、失敗します。転送でも通る必要があるときは、DKIM の署名を使います(転送しても、署名は残ります)。

- A. SPF は、暗号化とは関係なく、IP アドレスだけで判断します。
- C. `mx` で許可した MX のホストからのメールは、通ります。`-all` は、書かれていないものだけを拒否します。
- D. MX が複数あっても、`mx` は、そのすべてを許可します。

### 問34 `LinuC3SS-4.0-034`

**正解**: D

DKIM の公開鍵は、`<セレクター>._domainkey.<ドメイン>` の TXT レコードに置きます。メールの `DKIM-Signature:` の `s=`(セレクター)と `d=`(ドメイン)から、受信側が、この名前で公開鍵を取ります。セレクターを変えると、鍵を複数持て、鍵の交換がしやすくなります。

- A. `_dmarc` は、DMARC のポリシーを置く名前です。
- B. セレクターと `_domainkey` の順が逆です。
- C. `_domainkey` がありません。DKIM の鍵は、この名前では探されません。

### 問35 `LinuC3SS-4.0-035`

**正解**: A

DMARC に通るには、SPF か DKIM の、どちらか 1 つが成功し、かつ、その認証したドメインが、`From:` のドメインと合っている(アラインメント)必要があります。ここで SPF が認証したのは `example.net` で、`From:` の `example.com` とは違うので、DMARC は fail です。対処は、配信サービスに、`d=example.com` の DKIM 署名をさせることです。

- B. SPF が pass でも、ドメインが `From:` と合っていないと、DMARC には通りません。
- C. `p=reject` は、判定に失敗したメールを拒否する指定です。
- D. DMARC は、SPF だけでも判定できます。ただし、そのドメインが `From:` と合っている必要があります。

### 問36 `LinuC3SS-4.0-036`

**正解**: B、C

メールの暗号化には、つないだ直後から TLS にする方式(暗黙の TLS)と、平文でつないでから `STARTTLS` で切り替える方式があります。

- A. 587 番(サブミッション)は、`STARTTLS` で TLS に切り替えます。
- B. 正しい記述です。メールソフトからの送信に、465 番を使います。
- C. 正しい記述です。受信の暗号化には、993 番を使います。
- D. 143 番は、平文でつないで、`STARTTLS` で切り替えます。

### 問37 `LinuC3SS-4.0-037`

**正解**: C

`smtpd_tls_security_level=encrypt` は、TLS を必須にします。`STARTTLS` で暗号化しないと、認証もメールの送信も、受け付けません。`main.cf` の `smtpd_tls_auth_only = yes` でも、暗号化の前の認証を拒否できます。

- A. `none` は、TLS を使わない指定です。パスワードが平文で流れます。
- B. `smtpd_tls_wrappermode=yes` は、つないだ直後から TLS にする方式で、465 番(SMTPS)の設定です。587 番の STARTTLS のクライアントと、合わなくなります。
- D. 認証を使えなくすると、メールソフトから送れなくなります。パスワードの保護になりません。

### 問38 `LinuC3SS-4.0-038`

**正解**: `opendkim-testkey`

`opendkim-testkey -d example.com -s 202611 -vvv` のように、ドメインとセレクターを指定します。DNS の TXT レコードを引いて、秘密鍵と合っているかを確かめます。`dig +short TXT 202611._domainkey.example.com` で、レコードそのものも見られます。

### 問39 `LinuC3SS-4.0-039`

**正解**: D

`openssl s_client -starttls smtp` は、SMTP で `EHLO` と `STARTTLS` のやり取りをしてから、TLS の握手をして、証明書を表示します。465 番や 993 番のように、つないだ直後から TLS のポートは、`-starttls` を付けずに `-connect` だけで確かめます。

- A. 587 番は、つないだ直後には TLS ではないので、`-starttls` なしでは、握手が進みません。
- B. `-starttls imap` は、IMAP の手順です。587 番は SMTP なので、合いません。
- C. `openssl x509` は、証明書のファイルを扱うコマンドで、サーバーにはつなげません。
