# LinuC202 問題 2.09 HTTPサーバーとプロキシサーバー

対象: LinuC レベル2 202試験 / 全28問 / すべてオリジナル問題
対応テキスト: `LinuC202_2.09_HTTPサーバーとプロキシサーバー.md`
解答・解説は末尾。

## 問題

### 2.09.1 Apache HTTPサーバーの設定と管理

**問1** `LinuC202-2.09-001` AlmaLinux 9 に、パッケージの `httpd` を入れた。Apache のメインの設定ファイルはどれか。

- A. `/etc/apache2/apache2.conf`
- B. `/etc/httpd/conf/httpd.conf`
- C. `/etc/httpd/sites-enabled/httpd.conf`
- D. `/etc/sysconfig/httpd.conf`

**問2** `LinuC202-2.09-002` Ubuntu 24.04 で、`/etc/apache2/sites-available/example.conf` に仮想ホストの設定を書いた。この設定を有効にする、Debian 系の Apache 専用のコマンドを答えよ(`ln` ではなく、専用のコマンドの名前だけでよい)。

**問3** `LinuC202-2.09-003` Apache 2.4 の書き方で、ディレクトリへのアクセスを、ネットワーク 192.168.10.0/24 のクライアントだけに許可したい。正しい設定はどれか。

- A. `Require all granted`
- B. `Require local`
- C. `Require ip 192.168.10.0/24`
- D. `Allow from 192.168.10.0/24`

**問4** `LinuC202-2.09-004` Basic 認証のために、利用者 alice を、パスワードのファイルに追加したい。パスワードをハッシュにして保存する、このためのコマンドを答えよ(コマンドの名前だけでよい)。

**問5** `LinuC202-2.09-005` `.htaccess` について、正しいものを**2つ**選べ。

- A. ディレクトリごとに、設定を置ける。
- B. 内容を変えたら、Apache を再起動するまで反映されない。
- C. `AllowOverride` で許可された種類の設定だけが、効く。
- D. サーバーの設定ファイルに書くより、リクエストごとの負荷が小さい。

**問6** `LinuC202-2.09-006` `/old` へのリクエストを、`https://www.example.com/new` へ、恒久的な移転(HTTP の 301)として転送したい。正しい設定はどれか。

- A. `Redirect 302 /old https://www.example.com/new`
- B. `Alias /old https://www.example.com/new`
- C. `Redirect gone /old`
- D. `Redirect permanent /old https://www.example.com/new`

**問7** `LinuC202-2.09-007` 1 つの IP アドレスの 80 番ポートで、`www.example.com` と `blog.example.com` を、別のサイトとして出している。名前ベースの仮想ホストで、Apache が、どのサイトのリクエストかを見分けるために見る情報はどれか。

- A. HTTP リクエストの `Host` ヘッダー
- B. クライアントの IP アドレス
- C. URL の最後のファイルの拡張子
- D. クライアントの送信元ポート番号

**問8** `LinuC202-2.09-008` Apache 2.4 で、同時に処理するリクエスト数の上限を決めるディレクティブはどれか。

- A. `KeepAliveTimeout`
- B. `MaxRequestWorkers`
- C. `LimitRequestBody`
- D. `Timeout`

### 2.09.2 OpenSSLとHTTPSの設定

**問9** `LinuC202-2.09-009` 商用の認証局に、Web サーバーのサーバー証明書を発行してもらう。作業の順番として正しいものはどれか。

- A. 秘密鍵を CA に送る → CA が証明書を作る → 証明書を受け取る
- B. CSR を作る → 秘密鍵を作る → CSR を CA に送る → 証明書を受け取る
- C. 秘密鍵を作る → CSR を作る → CSR を CA に送る → 証明書を受け取る
- D. 証明書を受け取る → 秘密鍵を作る → CSR を作る → CSR を CA に送る

**問10** `LinuC202-2.09-010` 秘密鍵 `server.key` から、証明書の署名を申請する CSR を作る。`openssl` のサブコマンドを答えよ(`openssl` と、オプションは不要)。

**問11** `LinuC202-2.09-011` Apache の `SSLCertificateKeyFile` が指すファイルはどれか。

- A. サーバー証明書
- B. 認証局の証明書
- C. CSR
- D. サーバーの秘密鍵

**問12** `LinuC202-2.09-012` Apache で、SSLv3、TLS 1.0、TLS 1.1 を使わず、TLS 1.2 と TLS 1.3 だけを許可したい。OS の暗号ポリシーなどには頼らず、Apache の設定だけで制限する。正しい設定はどれか。

- A. `SSLProtocol -all +TLSv1.2 +TLSv1.3`
- B. `SSLProtocol all`
- C. `SSLProtocol +SSLv3 +TLSv1`
- D. `SSLEngine off`

**問13** `LinuC202-2.09-013` 自己署名証明書について、正しいものを**2つ**選べ。

- A. 商用の認証局の署名が付いているので、ブラウザーが警告を出さない。
- B. 自分の秘密鍵で、自分の証明書に署名している。
- C. 通信を暗号化できない。
- D. 信頼された認証局の署名がないので、ブラウザーが警告を出す。

**問14** `LinuC202-2.09-014` Apache 2.4.8 以降で、サーバー証明書に、中間 CA の証明書を添えてクライアントに送りたい。正しい方法はどれか。

- A. `SSLCertificateKeyFile` のファイルの最後に、中間 CA の証明書を足す。
- B. `SSLCertificateFile` のファイルに、サーバー証明書、中間 CA の証明書の順で続けて書く。
- C. `SSLCertificateFile` のファイルに、中間 CA の証明書、サーバー証明書の順で続けて書く。
- D. 中間 CA の証明書は送らず、サーバー証明書だけを置く。

**問15** `LinuC202-2.09-015` クライアント証明書で利用者を確かめたい。クライアントの証明書に署名した CA の証明書を、ディレクトリに 1 つずつ置いて、まとめて指定する。使うディレクティブはどれか。

- A. `SSLCACertificateFile`
- B. `SSLCertificateFile`
- C. `SSLCACertificatePath`
- D. `SSLCertificateKeyFile`

### 2.09.3 nginxの設定と管理

**問16** `LinuC202-2.09-016` nginx の設定を変えた。反映の前に、設定ファイルの構文を検査するコマンドを答えよ(`nginx` から始めて、オプションまで書く。ファイル名は不要)。

**問17** `LinuC202-2.09-017` nginx に、次の設定がある。

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/;
}
```

クライアントが `/api/users` にリクエストしたとき、バックエンドが受ける道筋(パス)はどれか。

- A. `/api/users`
- B. `/api/`
- C. `/`
- D. `/users`

**問18** `LinuC202-2.09-018` リバースプロキシの `location` に、`proxy_set_header Host $host;` を書く理由として、正しいものはどれか。

- A. バックエンドに、クライアントが指定した元のホスト名を伝えるため。
- B. バックエンドのログに、クライアントの IP アドレスを残すため。
- C. nginx とバックエンドの間を、HTTP/1.1 にするため。
- D. バックエンドからの応答を、キャッシュしないようにするため。

**問19** `LinuC202-2.09-019` nginx 1.29.6 以前(`proxy_http_version` の既定が 1.0 の版)で、`upstream` ブロックに `keepalive 16;` を書き、バックエンドへの接続を使い回したい。`location` に書く組み合わせとして、正しいものはどれか。

- A. `proxy_http_version 1.0;` と `proxy_set_header Connection close;`
- B. `proxy_http_version 1.1;` と `proxy_set_header Connection "";`
- C. `proxy_http_version 1.1;` と `proxy_set_header Connection close;`
- D. `ssl_protocols TLSv1.2;` と `proxy_set_header Connection "";`

**問20** `LinuC202-2.09-020` nginx を、443 番ポートの HTTPS のサーバーにしたい。正しい設定の組み合わせはどれか。

- A. `listen 443;` と、`ssl_certificate` に秘密鍵、`ssl_certificate_key` にサーバー証明書。
- B. `listen 443;` と、`ssl_certificate` にサーバー証明書、`ssl_certificate_key` に秘密鍵(`ssl` の指定なし)。
- C. `listen 443 ssl;` と、`ssl_certificate` にサーバー証明書、`ssl_certificate_key` に秘密鍵。
- D. `listen 443 ssl;` と `ssl_protocols TLSv1.2;` だけ(証明書の指定なし)。

**問21** `LinuC202-2.09-021` nginx の `ssl_protocols` と `ssl_ciphers` について、正しいものを**2つ**選べ。

- A. `ssl_protocols` は、許可する TLS の版を並べて指定する。
- B. `ssl_ciphers` は、許可する TLS の版を指定する。
- C. `ssl_protocols` は、秘密鍵のファイルを指定する。
- D. `ssl_ciphers` は、使う暗号スイートを指定する。

**問22** `LinuC202-2.09-022` nginx で、80 番ポートへのリクエストを、同じホスト名と道筋の HTTPS の URL へ、恒久的に転送したい。正しい設定はどれか。

- A. `return 301 https://$host$request_uri;`
- B. `return 302 https://$host$request_uri;`
- C. `proxy_pass https://$host$request_uri;`
- D. `ssl_redirect on;`

### 2.09.4 Squidの設定と管理

**問23** `LinuC202-2.09-023` Squid が、設定を変えない場合に待ち受けるポート番号(TCP)を答えよ(数字だけ)。

**問24** `LinuC202-2.09-024` Squid に次の設定がある。送信元 192.168.1.20 のクライアントが、`bad.example.com` に接続する。結果はどれか。

```squid
acl lan  src 192.168.1.0/24
acl bad  dstdomain .bad.example.com
http_access allow lan
http_access deny  bad
http_access deny  all
```

- A. `bad` に当たるので、拒否される。
- B. 最後の `deny all` で、拒否される。
- C. 先に `allow lan` に当たるので、許可される。
- D. 設定の矛盾で、Squid が起動できない。

**問25** `LinuC202-2.09-025` Squid で、宛先のドメイン名(`example.com` と、そのサブドメイン)を条件にする `acl` の種類はどれか。

- A. `src`
- B. `dst`
- C. `proxy_auth`
- D. `dstdomain`

**問26** `LinuC202-2.09-026` Squid に `auth_param basic …` で認証の方法を設定済みである。認証できた利用者だけがプロキシを使えるようにしたい。`acl` と `http_access` の正しい書き方はどれか(最後に `http_access deny all` がある)。

- A. `acl auth_users proxy_auth REQUIRED` と `http_access allow all`
- B. `acl auth_users proxy_auth REQUIRED` と `http_access allow auth_users`
- C. `acl auth_users src REQUIRED` と `http_access allow auth_users`
- D. `acl` を定義せず、`http_access allow auth_users` だけ

**問27** `LinuC202-2.09-027` Squid 6 以前で、動いている Squid に接続して、キャッシュマネージャーの情報(`mgr:info`)を取得するコマンドはどれか。

- A. `squidclient -h localhost mgr:info`
- B. `squid -k parse`
- C. `squid -z`
- D. `squid -k shutdown`

**問28** `LinuC202-2.09-028` `squid.conf` を変えたあと、Squid を止めずに設定を読み直す。`squid` コマンドを使って、オプションまで答えよ。

## 解答・解説

### 問1 `LinuC202-2.09-001`

**正解**: B

Red Hat 系の `httpd` のメインの設定は `/etc/httpd/conf/httpd.conf` です。追加の設定は `/etc/httpd/conf.d/*.conf` に置きます。

- A. `/etc/apache2/apache2.conf` は、Debian 系(`apache2` パッケージ)のメインの設定です。
- C. Red Hat 系には `sites-enabled` の仕組みがありません。そのディレクトリは作られません。
- D. `/etc/sysconfig/` には、サービスの起動時の環境変数などを置きます。`httpd.conf` は置きません。

### 問2 `LinuC202-2.09-002`

**正解**: `a2ensite`

`a2ensite example.conf` で、`sites-available/` の設定が `sites-enabled/` にリンクされます。そのあと `apache2ctl configtest` で構文を検査し、`systemctl reload apache2` で反映します。`a2ensite` は Debian 系のコマンドです。Red Hat 系の `conf.d/` に置いたファイルは、何もしなくても読まれます。

### 問3 `LinuC202-2.09-003`

**正解**: C

Apache 2.4 では `Require ip` で、アドレスの範囲を指定します(`mod_authz_host` の機能です)。

- A. `Require all granted` は、全員に許可します。
- B. `Require local` は、同じサーバーからのアクセスだけを許可します。
- D. `Allow from` は、Apache 2.2 の古い書き方です。2.4 の書き方としては `Require` を使います。

### 問4 `LinuC202-2.09-004`

**正解**: `htpasswd`

`htpasswd /etc/httpd/.htpasswd alice` で、パスワードを聞かれ、ハッシュにして `alice:ハッシュ` の形で保存されます。ファイルを新しく作るときだけ `-c` を付けます(付けると上書きで、前のユーザーが消えます)。Basic 認証の設定では、`mod_auth_basic` を使い、このファイルを `AuthUserFile` に指定します。グループで分けるときは、グループのファイルを `AuthGroupFile` に指定します。

### 問5 `LinuC202-2.09-005`

**正解**: A、C

`.htaccess` は、ディレクトリごとに置く設定ファイルです。`AllowOverride` で許可された種類の設定だけが効きます。

- B. `.htaccess` は、リクエストのたびに読まれるので、変えれば次のリクエストから反映されます。再起動は要りません。
- D. 逆です。リクエストのたびに、そのディレクトリから上の階層まで探して読むので、サーバーの設定ファイルに書くより遅くなります。

### 問6 `LinuC202-2.09-006`

**正解**: D

`Redirect permanent`(`Redirect 301` と同じ)は、301(恒久的な移転)を返して、別の URL へ転送します。

- A. `Redirect 302` は、一時的な移転です。恒久的ではありません。
- B. `Alias` は、URL をファイルシステムの場所に結び付けるものです。別の URL への転送はできません。
- C. `Redirect gone` は、410(なくなった)を返すもので、転送しません。

### 問7 `LinuC202-2.09-007`

**正解**: A

名前ベースの仮想ホストは、リクエストの `Host` ヘッダー(利用者が入力したホスト名)と、`ServerName` や `ServerAlias` を比べて選びます。合うものがなければ、先に読まれた仮想ホスト(`VirtualHost`)が使われます。サイトごとのログは、仮想ホストの中に `CustomLog`(アクセスログ)と `ErrorLog`(エラーログ)を書いて分けられます。

- B. クライアントの IP アドレスでは、同じ人が両方のサイトを開く場合に見分けられません。
- C. ファイルの拡張子は、サイトの選択とは関係がありません。
- D. 送信元ポートは、接続のたびに変わる番号で、サイトの選択には使いません。

### 問8 `LinuC202-2.09-008`

**正解**: B

`MaxRequestWorkers` は、同時に処理するリクエスト数の上限です(Apache 2.2 では `MaxClients` でした)。

- A. `KeepAliveTimeout` は、持続接続(`KeepAlive`)で、次のリクエストを待つ秒数です。
- C. `LimitRequestBody` は、1 つのリクエストの本体(アップロードなど)の大きさの上限です。
- D. `Timeout` は、リクエストや応答を待つ時間(秒)です。

### 問9 `LinuC202-2.09-009`

**正解**: C

先に秘密鍵を作り、その鍵から CSR(署名の申請書)を作って、CSR だけを CA に送ります。CA は、申請者を確かめて、サーバー証明書を返します。

- A. 秘密鍵は、サーバーだけが持つもので、CA に送りません。
- B. CSR は、秘密鍵(から取り出した公開鍵)を使って作るので、鍵が先です。
- D. 証明書は、申請の結果として受け取るもので、最初には受け取れません。

### 問10 `LinuC202-2.09-010`

**正解**: `req`、`openssl req`

`openssl req -new -key server.key -out server.csr` で、秘密鍵から CSR を作ります。`-x509` を付けると、CSR ではなく、自己署名証明書が作られます。

### 問11 `LinuC202-2.09-011`

**正解**: D

`SSLCertificateKeyFile` は、サーバーの秘密鍵のファイルを指します。ファイルの権限は `600`(所有者だけ読み書き)にして、他人に渡しません。置き場所は、Red Hat 系は `/etc/pki/tls/private/`、Debian 系は `/etc/ssl/private/` です。

- A. サーバー証明書は、`SSLCertificateFile` で指定します。
- B. CA の証明書は、クライアント証明書の検証なら `SSLCACertificateFile` や `SSLCACertificatePath` で指定します。
- C. CSR は、CA に送る申請書で、Apache の設定には使いません。

### 問12 `LinuC202-2.09-012`

**正解**: A

`SSLProtocol -all +TLSv1.2 +TLSv1.3` は、すべてを外してから、使うものだけを足します。確実に、古いプロトコルを無効にできます。`SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1` のように、外すものを書く方法もあります。

- B. `all` は、Apache の設定では古い版を外していません。OS やライブラリーの設定によっては止まりますが、Apache の設定で制限したことにはなりません。
- C. SSLv3 と TLS 1.0 を許可する設定で、逆です。
- D. `SSLEngine off` は、SSL/TLS そのものを止めるもので、版の制限ではありません。暗号スイートを決めるのは `SSLCipherSuite` です。

### 問13 `LinuC202-2.09-013`

**正解**: B、D

自己署名証明書は、自分の秘密鍵で、自分に署名した証明書です。通信は暗号化できますが、信頼された CA の署名がないので、ブラウザーが警告を出します。検証や社内の試験に使います。

- A. 商用の CA の署名は付いていません。そのためブラウザーが警告を出します。
- C. 暗号化はできます。できないのは、相手が本物だという信頼の保証です。

### 問14 `LinuC202-2.09-014`

**正解**: B

Apache 2.4.8 以降は、`SSLCertificateFile` のファイルに、サーバー証明書、中間 CA の証明書の順に続けて書きます。以前の `SSLCertificateChainFile` は、非推奨になりました。

- A. `SSLCertificateKeyFile` は、秘密鍵のファイルです。証明書を足す場所ではありません。
- C. 順番が逆です。先頭はサーバー証明書でなければなりません。
- D. 中間 CA の証明書がないと、クライアントによっては、ルート CA までのつながりを確かめられず、エラーになります。

### 問15 `LinuC202-2.09-015`

**正解**: C

`SSLCACertificatePath` は、クライアント証明書を検証するための CA の証明書を、ディレクトリに 1 つずつ置いて指定します(ハッシュの名前のリンクが要ります)。`SSLVerifyClient require` とあわせて使います。

- A. `SSLCACertificateFile` は、同じ目的の CA の証明書を、1 つのファイルにまとめて指定します。ディレクトリではありません。
- B. `SSLCertificateFile` は、サーバー自身の証明書です。
- D. `SSLCertificateKeyFile` は、サーバーの秘密鍵です。

### 問16 `LinuC202-2.09-016`

**正解**: `nginx -t`、`nginx -T`、`nginx -t -q`、`nginx -q -t`、`nginx -tq`、`nginx -qt`

`nginx -t` は、設定ファイルの構文を検査して、結果を表示します。`nginx -T` は、検査に加えて、設定の全文も表示します。`-q` を足すと、検査のときにエラー以外のメッセージを出しません。設定は `/etc/nginx/nginx.conf` と `/etc/nginx/conf.d/` の下のファイルです。問題がなければ `nginx -s reload` か `systemctl reload nginx` で反映します。

### 問17 `LinuC202-2.09-017`

**正解**: D

`proxy_pass` の URL に道筋(ここでは末尾の `/`)があるので、`location` に合った部分(`/api/`)が、その道筋(`/`)に置き換わります。結果は `/users` です。

- A. 末尾の `/` がない `proxy_pass http://127.0.0.1:8080;` なら、そのまま `/api/users` が渡ります。
- B. `/api/` は、一致した `location` の部分です。残りの `users` が付きます。
- C. 置き換わった `/` のあとに、残りの `users` が付くので、`/` だけにはなりません。

### 問18 `LinuC202-2.09-018`

**正解**: A

`proxy_set_header` を書かないと、バックエンドには、元のホスト名ではなく、中継先の名前が `Host` として渡ります。`$host` で、クライアントが指定したホスト名を渡します。

- B. クライアントの IP アドレスは、`X-Real-IP` や `X-Forwarded-For` で渡します。
- C. バックエンドとの HTTP の版は、`proxy_http_version` で指定します。
- D. キャッシュを使うかどうかは、`proxy_cache` などの設定で決めます。

### 問19 `LinuC202-2.09-019`

**正解**: B

`upstream` の `keepalive` を使うには、`proxy_http_version 1.1;` と、`Connection` ヘッダーを空にする `proxy_set_header Connection "";` を書きます。nginx 1.29.7 以降は、`proxy_http_version` の既定が 1.1 になり、この 2 行を書かなくても接続が使い回されます。古い版と同じ動きにするときも、明示しておくと確実です。

- A. HTTP/1.0 と `Connection close` は、リクエストのたびに接続を閉じる組み合わせです。
- C. `Connection close` を付けると、接続を閉じるよう伝えるので、使い回せません。
- D. `ssl_protocols` は TLS の版の指定で、バックエンドとの接続の使い回しとは関係がありません。

### 問20 `LinuC202-2.09-020`

**正解**: C

`listen 443 ssl;` で TLS の待ち受けにし、`ssl_certificate` にサーバー証明書、`ssl_certificate_key` に秘密鍵を指定します。

- A. 証明書と鍵が逆です。また、`listen` に `ssl` がありません。
- B. `listen 443;` だけでは、暗号化されない HTTP を 443 番で待ち受けます。`ssl` を付けます(`ssl on;` は古い書き方です)。
- D. 証明書と秘密鍵の指定がないので、TLS を始められません。nginx の起動や設定の検査でエラーになります。

### 問21 `LinuC202-2.09-021`

**正解**: A、D

`ssl_protocols` は許可する TLS の版(`TLSv1.2 TLSv1.3` など)を、`ssl_ciphers` は使う暗号スイートを指定します。

- B. `ssl_ciphers` が指定するのは、暗号スイートです。TLS の版は `ssl_protocols` で指定します。
- C. 秘密鍵のファイルを指定するのは、`ssl_certificate_key` です。

### 問22 `LinuC202-2.09-022`

**正解**: A

`return 301 URL;` は、恒久的な転送を返します。`$host` はリクエストのホスト名、`$request_uri` は道筋と引数です。

- B. `return 302` は、一時的な転送です。恒久的な転送ではありません。
- C. `proxy_pass` は、中継するだけで、クライアントに転送を返しません。
- D. `ssl_redirect` という設定はありません。

### 問23 `LinuC202-2.09-023`

**正解**: `3128`

`squid.conf` の `http_port` の既定は `3128` です。ブラウザーのプロキシの設定には、Squid のアドレスと 3128 番を書きます。

### 問24 `LinuC202-2.09-024`

**正解**: C

`http_access` は、上から順に調べ、最初に当たった行で決まります。192.168.1.20 は `lan` に当たるので、1 行目の `allow lan` で許可されて、終わりです。2 行目の `deny bad` は見られません。禁止したいなら、`deny bad` を `allow lan` より前に置きます。

- A. `bad` の行は、`allow lan` のあとにあるので、見られません。
- B. `deny all` は、どの行にも当たらなかったときのためです。
- D. 矛盾ではありません。順番で決まる書き方として、正しい設定です。

### 問25 `LinuC202-2.09-025`

**正解**: D

`dstdomain` は、宛先のドメイン名で決めます。`.example.com` のように、先頭に `.` を付けると、サブドメインも含みます。

- A. `src` は、送信元(クライアント)の IP アドレスです。
- B. `dst` は、宛先の IP アドレスです。ドメイン名ではありません。
- C. `proxy_auth` は、認証した利用者の名前です。

### 問26 `LinuC202-2.09-026`

**正解**: B

`proxy_auth REQUIRED` は、認証できた利用者に当たります。その acl に `http_access allow` を使うと、認証した人だけが許可されます。

- A. `allow all` では、認証しない人も許可されます。
- C. `src` は IP アドレスの種類で、`REQUIRED` を値にできません。認証には `proxy_auth` を使います。
- D. 名前を使う前に、`acl` で定義する必要があります。定義がないと、設定の読み込みでエラーになります。

### 問27 `LinuC202-2.09-027`

**正解**: A

`squidclient` は、動いている Squid にリクエストを送るクライアントです。`mgr:info` で、全体の情報(起動時間、要求の数など)を取れます。パッケージによっては、別の名前のパッケージになっています。`squidclient` は Squid 7 でなくなりました。新しい Squid では、`curl http://localhost:3128/squid-internal-mgr/info` のように、HTTP で同じ情報を取れます。

- B. `squid -k parse` は、設定ファイルの構文を検査するコマンドです。動いている Squid には問い合わせません。
- C. `squid -z` は、キャッシュ用のディレクトリを作ります。
- D. `squid -k shutdown` は、Squid を止めます。

### 問28 `LinuC202-2.09-028`

**正解**: `squid -k reconfigure`

`squid -k reconfigure` は、実行中の Squid に、`squid.conf` を読み直させます。止めないので、処理中の接続は切れません。先に `squid -k parse` で、構文を検査しておきます。
