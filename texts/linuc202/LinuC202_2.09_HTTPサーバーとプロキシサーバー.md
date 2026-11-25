# LinuC 202 テキスト 2.09 HTTPサーバーとプロキシサーバー

Web サーバー(Apache、nginx)と、HTTPS に使う OpenSSL、プロキシサーバー(Squid)の設定と管理を学びます。Red Hat 系(AlmaLinux / RHEL 9 系)と Debian 系(Ubuntu 24.04 / Debian 12)で、パッケージ名や置き場所が違うところは両方書きます。

## 2.09.1 Apache HTTPサーバーの設定と管理 (重要度3)

### 1. Apache の名前と置き場所

**Apache HTTP Server** は、代表的な Web サーバーです。パッケージ、サービス、設定ファイルの名前が、ディストリビューションで違います。

| | Red Hat 系 | Debian 系 |
|---|---|---|
| パッケージとサービスの名前 | `httpd` | `apache2` |
| メインの設定ファイル | `/etc/httpd/conf/httpd.conf` | `/etc/apache2/apache2.conf` |
| 追加の設定 | `/etc/httpd/conf.d/*.conf` | `/etc/apache2/conf-enabled/`、`sites-enabled/`、`mods-enabled/` |
| 公開する場所(DocumentRoot)の既定 | `/var/www/html` | `/var/www/html` |
| アクセスログ | `/var/log/httpd/access_log` | `/var/log/apache2/access.log` |
| エラーログ | `/var/log/httpd/error_log` | `/var/log/apache2/error.log` |
| 実行するユーザー | `apache` | `www-data` |
| 構文の検査と制御のコマンド | `apachectl` | `apache2ctl` |

- Debian 系は、設定を `*-available/` に置き、有効にしたものだけを `*-enabled/` からのシンボリックリンクにします。この作業を `a2ensite`(サイト)、`a2enmod`(モジュール)、`a2enconf`(設定)が行い、`a2dissite`、`a2dismod`、`a2disconf` が無効にします。
- Red Hat 系には `a2ensite` はありません。`conf.d/` に置いた `.conf` ファイルが、そのまま読まれます。

```bash
# Red Hat 系
sudo dnf install httpd
sudo systemctl enable --now httpd

# Debian 系
sudo apt install apache2
sudo a2ensite example.conf         # sites-available/example.conf を有効にする
sudo a2enmod rewrite               # モジュールを有効にする
```

設定を変えたら、反映の前に構文を検査します。

```bash
sudo apachectl configtest          # Debian 系は apache2ctl configtest。apachectl -t でも同じ
sudo systemctl reload httpd        # Debian 系は reload apache2
```

`reload`(`apachectl graceful` も同じ考え方)は、処理中の接続を切らずに設定を読み直します。構文に誤りがあるまま `restart` すると、止まったまま起動に失敗することがあるので、先に検査します。

### 2. 同時接続とリクエストの上限

Apache の同時処理の仕方は **MPM**(Multi-Processing Module)で決まります。`prefork`(プロセス)、`worker`(プロセスとスレッド)、`event`(worker を改良。持続接続に強い)があります。新しい版では `event` が既定です。

| ディレクティブ | 意味 |
|---|---|
| `MaxRequestWorkers` | 同時に処理するリクエスト数の上限(Apache 2.2 では `MaxClients`) |
| `ServerLimit` | プロセス数の上限 |
| `KeepAlive On` | 1 回の TCP 接続で、続けて複数のリクエストを受ける |
| `KeepAliveTimeout` | 持続接続で、次のリクエストを待つ秒数 |
| `Timeout` | リクエストや応答の待ち時間(秒) |
| `LimitRequestBody` | 1 つのリクエストの本体(アップロードなど)の最大バイト数 |

上限を小さくしすぎると、混んだときに待たされます。大きくしすぎると、メモリが足りなくなります。サーバーの負荷は、`mod_status` の `server-status` ページ(`ExtendedStatus On` で詳細)や、アクセスログで見ます。

### 3. 仮想ホスト

**仮想ホスト(VirtualHost)** は、1 台の Apache で複数のサイトを出す仕組みです。同じ IP アドレスとポートで、リクエストの `Host` ヘッダー(利用者が入力したホスト名)を見て振り分ける方式を、名前ベースと言います。

```text
GET /  Host: www.example.com  ----+
                                  |
GET /  Host: blog.example.com ----+--> [Apache 80]    Host を見て、仮想ホストを選ぶ
                                         |
                                         +--> ServerName www.example.com    DocumentRoot /var/www/www
                                         |
                                         +--> ServerName blog.example.com   DocumentRoot /var/www/blog
```

```apache
<VirtualHost *:80>
    ServerName www.example.com
    ServerAlias example.com
    DocumentRoot /var/www/www
    ErrorLog  logs/www_error_log
    CustomLog logs/www_access_log combined
</VirtualHost>
```

- どの `ServerName` にも合わないときは、先に読まれた仮想ホストが使われます。
- ログのファイルは、`ErrorLog`(エラーログ)と `CustomLog`(アクセスログ。書式は `LogFormat` で決める)で、仮想ホストごとに分けられます。`LogLevel` で、エラーログに書く詳しさを変えます。
- Debian 系では、このファイルを `/etc/apache2/sites-available/` に置き、`a2ensite` で有効にします。
- Apache 2.4 では、以前必要だった `NameVirtualHost` は要りません。

### 4. アクセスの制限(Apache 2.4 の書き方)

Apache 2.4 では、`mod_authz_host`(アドレスで許可を決める)などの認可モジュールが提供する **`Require`** で、アクセスを許可する条件を書きます。

```apache
<Directory "/var/www/html/admin">
    Require ip 192.168.10.0/24     # このネットワークだけ許可
</Directory>

<Directory "/var/www/html">
    Require all granted            # 全員に許可
</Directory>
```

| 書き方 | 意味 |
|---|---|
| `Require all granted` | 全員に許可 |
| `Require all denied` | 全員に拒否 |
| `Require ip 192.168.10.0/24` | そのアドレスの範囲だけ許可 |
| `Require host example.com` | そのホスト名(の下)だけ許可 |
| `Require local` | 同じサーバーからだけ許可 |
| `Require valid-user` | 認証に成功した利用者だけ許可 |

複数の `Require` を並べると、いずれか 1 つでも当たれば許可です(`<RequireAny>`)。すべてを満たす条件にするときは、`<RequireAll>` で囲みます。

古い Apache 2.2 では、`Order`、`Allow from`、`Deny from` で書きました。2.4 でも `mod_access_compat` があれば動きますが、古い書き方なので、新しく書くときは `Require` を使います。

### 5. 利用者の認証(Basic 認証)

**Basic 認証**は、ブラウザーが利用者名とパスワードを聞く、簡単な認証です。`mod_auth_basic` が仕組みを提供し、パスワードを書いたファイルを読むのは `mod_authn_file` です。

```bash
sudo htpasswd -c /etc/httpd/.htpasswd alice    # -c はファイルを新しく作る(2 人目から付けない)
sudo htpasswd    /etc/httpd/.htpasswd bob      # 追加または変更
sudo htpasswd -B /etc/httpd/.htpasswd carol    # bcrypt で保存
```

`htpasswd` は、パスワードを暗号化(ハッシュ)して、`利用者名:ハッシュ` の形で保存します。Debian 系では `apache2-utils`、Red Hat 系では `httpd-tools` のパッケージに入っています。

```apache
<Directory "/var/www/html/private">
    AuthType Basic
    AuthName "Private Area"                  # 認証の画面に出る名前
    AuthUserFile /etc/httpd/.htpasswd        # パスワードのファイル
    Require valid-user                       # ファイルにある全員
</Directory>
```

グループで分けるときは、グループのファイル(`グループ名: alice bob` の形)を `AuthGroupFile` で指定し、`Require group グループ名` と書きます。特定の利用者だけにするときは、`Require user alice` です。

- Basic 認証のパスワードは、暗号化されず、符号化(base64)されるだけで送られます。必ず HTTPS と組み合わせます。
- パスワードのファイルは、DocumentRoot の外に置きます。

### 6. .htaccess

**.htaccess** は、ディレクトリごとに置く設定ファイルです。サーバーの設定ファイルを触れない利用者が、自分のディレクトリの設定を変えるために使います。

- リクエストのたびに、そのディレクトリから上の階層まで探して読むので、遅くなります。使わないなら `AllowOverride None` にします。
- `.htaccess` で変えてよい設定の種類は、`AllowOverride`(`AuthConfig`、`FileInfo`、`All` など)で決めます。許可されていない設定は、効きません(エラーになることもあります)。
- 設定を変えても、Apache を再読み込みする必要はありません。次のリクエストから反映されます。

```apache
# /var/www/html/private/.htaccess (AllowOverride AuthConfig が必要)
AuthType Basic
AuthName "Private Area"
AuthUserFile /etc/httpd/.htpasswd
Require valid-user
```

### 7. リダイレクトとスクリプト言語

**Redirect** は、別の URL へ転送する指示を返します。`mod_alias` が提供します。

```apache
Redirect permanent /old https://www.example.com/new     # 301(恒久的な移転)
Redirect temp      /tmp https://www.example.com/work    # 302(一時的な移転)
Redirect gone      /removed                             # 410(なくなった)
```

`Redirect 301 /old …` のように、状態コードを数字で書いても同じです。`Alias` は URL をファイルシステムの場所に結び付けるもので、別の URL への転送ではありません。

スクリプト言語は、モジュール(`mod_php`、`mod_perl`、`mod_wsgi` など)を Apache に組み込む方法と、外部の処理系(PHP-FPM など)へ渡す方法(`mod_proxy_fcgi`)があります。

## 2.09.2 OpenSSLとHTTPSの設定 (重要度3)

### 1. HTTPS と証明書

**HTTPS** は、HTTP を TLS で暗号化したものです。サーバーは、**秘密鍵**と**サーバー証明書**を使います。サーバー証明書は、サーバーの公開鍵と名前に、**認証局(CA)**が署名したものです。

| ファイル | 中身 | 注意 |
|---|---|---|
| 秘密鍵(`server.key`) | サーバーだけが持つ鍵 | 他人に渡さない。権限は `600`(所有者だけ読み書き)にする |
| CSR(`server.csr`) | 証明書の署名の申請書(公開鍵と名前) | 秘密鍵は入っていない |
| サーバー証明書(`server.crt`) | CA が署名した証明書 | 公開してよい |
| 中間 CA 証明書 | サーバー証明書に署名した CA の証明書 | サーバーが、サーバー証明書と一緒に送る |

置き場所は、ディストリビューションで違います。

| | Red Hat 系 | Debian 系 |
|---|---|---|
| 証明書 | `/etc/pki/tls/certs/` | `/etc/ssl/certs/` |
| 秘密鍵 | `/etc/pki/tls/private/` | `/etc/ssl/private/` |
| Apache の HTTPS を入れる | `dnf install mod_ssl`(`/etc/httpd/conf.d/ssl.conf` ができる) | `a2enmod ssl`、`a2ensite default-ssl` |

商用の CA に証明書を発行してもらう流れを図にします。

```text
1. openssl genrsa      秘密鍵を作る
        |
        v
2. openssl req -new    CSR を作る(秘密鍵は CA に渡さない)
        |
        v
3. CSR を CA に送る。CA が申請者を確かめる
        |
        v
4. server.crt          CA がサーバー証明書を返す(中間 CA 証明書も一緒に)
        |
        v
5. Apache / nginx      証明書と鍵を設定する
```

### 2. openssl のコマンド

```bash
# 1. 秘密鍵(RSA 2048 ビット)
openssl genrsa -out server.key 2048
chmod 600 server.key

# 2. CSR を作る(-subj で、国や組織、サーバーの名前を書く)
openssl req -new -key server.key -out server.csr -subj "/C=JP/O=Example/CN=www.example.com"

# 自己署名証明書(鍵と証明書を一度に作る。365 日有効)
openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt -days 365 \
  -subj "/CN=www.example.com"

# 証明書の中身と有効期限を見る
openssl x509 -in server.crt -noout -subject -issuer -dates

# 証明書を、CA の証明書で検査する
openssl verify -CAfile ca.crt server.crt

# 動いているサーバーの証明書を確かめる
openssl s_client -connect www.example.com:443 -servername www.example.com
```

**自己署名証明書**は、自分の秘密鍵で自分に署名した証明書です。通信は暗号化できますが、信頼された CA の署名がないので、ブラウザーが警告を出します。検証や社内の試験に使います。

### 3. Apache の SSL のディレクティブ

```apache
<VirtualHost *:443>
    ServerName www.example.com
    DocumentRoot /var/www/www

    SSLEngine on                                          # SSL/TLS を使う
    SSLCertificateFile    /etc/pki/tls/certs/server.crt    # サーバー証明書
    SSLCertificateKeyFile /etc/pki/tls/private/server.key  # 秘密鍵
    SSLProtocol -all +TLSv1.2 +TLSv1.3                     # 使う TLS の版
    SSLCipherSuite HIGH:!aNULL:!MD5                        # 使う暗号スイート
</VirtualHost>
```

| ディレクティブ | 意味 |
|---|---|
| `SSLEngine on` | その仮想ホストで SSL/TLS を有効にする |
| `SSLCertificateFile` | サーバー証明書のファイル |
| `SSLCertificateKeyFile` | サーバーの秘密鍵のファイル |
| `SSLProtocol` | 使う(使わない)プロトコルの版。`-` で外し、`+` で足す |
| `SSLCipherSuite` | 使う暗号スイート(暗号方式の組み合わせ)。`!` で除く |
| `SSLCACertificateFile` | **クライアント証明書**を検証する CA の証明書を、1 つのファイルにまとめたもの |
| `SSLCACertificatePath` | 同じものを、ディレクトリに 1 つずつ置いたもの(ハッシュ名のリンクが要る) |

`SSLCACertificateFile` と `SSLCACertificatePath` は、サーバーが**クライアントの証明書**を確かめる(`SSLVerifyClient require` など)ときに、信頼する CA を教えるものです。

### 4. 中間 CA と古い方式の停止

- サーバー証明書は、CA の中でも**中間 CA** が署名することが多いです。クライアントが信頼する**ルート CA** までのつながり(チェーン)が切れると、検証に失敗します。
- Apache 2.4.8 以降は、`SSLCertificateFile` のファイルに、**サーバー証明書、中間 CA 証明書**の順で続けて書きます(サーバー証明書が先頭です)。以前の `SSLCertificateChainFile` は、非推奨です。

```text
[root CA]         クライアントが元から信頼している
    |
    v 署名
[intermediate]    中間 CA。サーバーが一緒に送る
    |
    v 署名
[server cert]     サーバー証明書。SSLCertificateFile の先頭に書く
```

- 古いプロトコル(SSLv2、SSLv3、TLS 1.0、TLS 1.1)と、弱い暗号スイートは、無効にします。`SSLProtocol -all +TLSv1.2 +TLSv1.3` のように、使うものだけを書くと確実です。
- `SSLCipherSuite` で、`!aNULL`(認証のない方式を除く)、`!MD5` のように弱いものを除きます。暗号スイートの一覧は、`openssl ciphers -v 'HIGH:!aNULL'` で確かめます。TLS 1.3 の暗号スイートは、別に指定します。Apache では、OpenSSL 1.1.1 以降で `SSLCipherSuite TLSv1.3 TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256` のように、`TLSv1.3` を先頭に付けます。`SSLCipherSuite HIGH:!aNULL:!MD5` のような指定は、TLS 1.2 以前に効きます。nginx では、1.19.4 以降で `ssl_conf_command Ciphersuites …;` と書きます。
- 設定のあとは、`apachectl configtest` で検査し、`reload` します。

## 2.09.3 nginxの設定と管理 (重要度3)

### 1. nginx の名前と設定ファイル

**nginx**(エンジンエックス)は、軽くて速い Web サーバーで、リバースプロキシとしてもよく使います。

| | Red Hat 系 | Debian 系 |
|---|---|---|
| パッケージとサービス | `nginx` | `nginx` |
| メインの設定 | `/etc/nginx/nginx.conf` | `/etc/nginx/nginx.conf` |
| 追加の設定 | `/etc/nginx/conf.d/*.conf` | `/etc/nginx/conf.d/*.conf`、`/etc/nginx/sites-enabled/*` |
| ログ | `/var/log/nginx/access.log`、`error.log` | 同じ |

- Debian 系の nginx は、`sites-available/` に設定を置き、`sites-enabled/` に**シンボリックリンク**(`ln -s`)を作って有効にします。`a2ensite` のようなコマンドはありません。
- 設定の検査と反映は、次のとおりです。

```bash
sudo nginx -t                  # 設定の構文を検査(-T なら、設定の全文も表示)
sudo nginx -s reload           # 処理中の接続を切らずに、設定を読み直す
sudo systemctl reload nginx    # systemd でも同じ
```

設定は、`{ }` で入れ子になった**ブロック**(ディレクティブの集まり)で書きます。

```text
http { }                  Web サーバーとしての全体の設定
  |
  +-- server { }          1 つのサイト(仮想ホスト)。listen と server_name で選ばれる
        |
        +-- location { }  URL の道筋ごとの処理
```

### 2. HTTP サーバーとしての設定

```nginx
server {
    listen 80;
    server_name www.example.com;
    root /usr/share/nginx/html;

    location / {
        index index.html;
    }
    location /images/ {
        root /var/www;                 # /images/a.png は /var/www/images/a.png を返す
    }
}
```

`location` は、次の順で選ばれます。

- 接頭辞の `location`(`location /images/` など)は、いちばん長く合うものが候補になります。
- そのあと、正規表現(`~`、`~*`。例: `location ~ \.php$`)の `location` を、書いた順に調べます。合ったものがあれば、そちらが選ばれます。
- `location = /x`(完全一致)が合えば、すぐに決まります。
- `^~` を付けた接頭辞が最長なら、正規表現は調べません。

### 3. HTTPS の設定

```nginx
server {
    listen 443 ssl;                                  # ssl を付けて、TLS で待ち受ける
    server_name www.example.com;

    ssl_certificate     /etc/nginx/ssl/server.crt;   # サーバー証明書(中間 CA 証明書を続けて書く)
    ssl_certificate_key /etc/nginx/ssl/server.key;   # 秘密鍵
    ssl_protocols       TLSv1.2 TLSv1.3;             # 許可する TLS の版
    ssl_ciphers         HIGH:!aNULL:!MD5;            # 許可する暗号スイート
}
```

- 以前は、`ssl on;` という書き方がありました。古い書き方で、いまは `listen 443 ssl;` と書きます。
- `listen 443;` だけでは、暗号化されない HTTP を 443 番で待ち受けます。`ssl` を付けます。
- `ssl_certificate` の証明書ファイルには、Apache と同じく、サーバー証明書、中間 CA 証明書の順に書きます。

### 4. リバースプロキシ

**リバースプロキシ**は、利用者のリクエストを受けて、裏のサーバー(バックエンド。アプリケーションサーバーなど)へ中継します。TLS の処理や、複数のバックエンドへの振り分けを、nginx が引き受けられます。

```text
[client] --HTTPS 443--> [nginx] --HTTP 8080--> [app 127.0.0.1]
                           |
                           +-- TLS を終わらせ、ヘッダーで元の情報を伝える
```

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

| ディレクティブ | 意味 |
|---|---|
| `proxy_pass` | 中継先の URL |
| `proxy_http_version` | バックエンドとの通信に使う HTTP の版。既定は、nginx 1.29.7 より前は `1.0`、1.29.7 以降は `1.1`。`1.1` にすると、接続の使い回し(keepalive)と WebSocket が使える |
| `proxy_set_header` | バックエンドへ送るヘッダーを、決めたり足したりする |

- `proxy_set_header Host $host;` を書かないと、バックエンドには、元のホスト名ではなく、中継先の名前(`$proxy_host`)が `Host` として渡ります。
- 元の利用者の IP アドレスは、`X-Real-IP` や `X-Forwarded-For` で渡します。バックエンドのログに、nginx の IP ではなく、利用者の IP を残せます。
- `proxy_http_version` の既定は、nginx 1.29.7 より前は 1.0、1.29.7 以降(安定版 1.30 を含む)は 1.1 です。古い版で接続を使い回すには、`upstream` ブロックに `keepalive 16;` と書き、`location` に `proxy_http_version 1.1;` と `proxy_set_header Connection "";` を書きます。1.29.7 以降は、書かなくても使い回されます。AlmaLinux 9 や Ubuntu 24.04 の標準のパッケージの nginx は 1.29.7 より前の版なので、古い版の書き方が要ります。
- **`proxy_pass` の末尾の `/`** に注意します。URL に道筋(`/` を含む)を書くと、`location` に合った部分が、その道筋に置き換わります。

| 設定 | `/api/users` を受けたとき、バックエンドへ渡る道筋 |
|---|---|
| `location /api/ { proxy_pass http://127.0.0.1:8080/; }` | `/users`(`/api/` が `/` に置き換わる) |
| `location /api/ { proxy_pass http://127.0.0.1:8080; }` | `/api/users`(そのまま渡る) |

### 5. リダイレクト

```nginx
server {
    listen 80;
    server_name www.example.com;
    return 301 https://$host$request_uri;       # HTTP を HTTPS へ、恒久的に転送
}

server {
    listen 443 ssl;
    server_name www.example.com;
    # (証明書の設定は省略)

    location /old/ {
        rewrite ^/old/(.*)$ /new/$1 permanent;  # 301 で /new/ へ
    }
}
```

- `return 301 URL;` が、いちばん簡単な転送です。`return 302` は一時的な転送です。
- `rewrite` は、正規表現で道筋を書き換えます。末尾に `permanent`(301)や `redirect`(302)を付けると、転送になります。

## 2.09.4 Squidの設定と管理 (重要度2)

### 1. Squid とは

**Squid** は、フォワードプロキシ(利用者の側に置き、外向きの通信を中継する)で、Web の内容をキャッシュ(保存して使い回す)できます。アクセスの制限、認証、使う資源の制限ができます。

| 項目 | 内容 |
|---|---|
| パッケージ | `squid`(Red Hat 系も Debian 系も同じ) |
| 設定ファイル | `/etc/squid/squid.conf` |
| 待ち受けポートの既定 | `3128`(`http_port 3128`) |
| ログ | `/var/log/squid/access.log`、`cache.log` |
| キャッシュの置き場所 | `/var/spool/squid` |

```text
[browser] --proxy 192.168.1.1:3128--> [Squid] --> [internet]
                                         |
                                         +-- acl と http_access で、通すか決める
                                         +-- キャッシュにあれば、そこから返す
```

クライアント側では、ブラウザーの設定のほか、`export http_proxy=http://192.168.1.1:3128`(コマンド用)や `curl -x http://192.168.1.1:3128 URL` でプロキシを使えます。

### 2. acl と http_access

アクセスの制限は、**`acl`(条件に名前を付ける)**と、**`http_access`(その名前を使って許可か拒否を決める)**の組み合わせで書きます。

```text
acl <name> <type> <value> ...
http_access allow|deny [!]<name> ...
```

```squid
http_port 3128

acl lan      src 192.168.1.0/24            # 送信元のアドレス
acl SSL_ports port 443                     # 宛先のポート
acl CONNECT  method CONNECT
acl blocked  dstdomain .badsite.example    # 宛先のドメイン(サブドメインも含む)
acl worktime time MTWHF 09:00-18:00        # 曜日と時間

http_access deny  blocked                  # 禁止のサイトは、まず拒否
http_access allow lan                      # 社内のネットワークは許可
http_access deny  all                      # それ以外は拒否(最後に必ず書く)
```

| acl の種類 | 意味 |
|---|---|
| `src` | 送信元(クライアント)の IP アドレス |
| `dst` | 宛先の IP アドレス |
| `dstdomain` | 宛先のドメイン名(`.example.com` はサブドメインを含む) |
| `url_regex` | URL の正規表現 |
| `port` | 宛先のポート |
| `method` | HTTP のメソッド(`GET`、`CONNECT`) |
| `time` | 曜日と時間 |
| `proxy_auth` | 認証した利用者の名前 |

**`http_access` は、上から順に調べ、最初に当たった行で決まります。**それ以降の行は見ません。同じ行に複数の acl を書くと、すべてに当たったとき(AND)にその行が当たります。

```text
http_access allow lan          <-- 1 行目。lan に当たれば、ここで許可して終わり
http_access deny  blocked      <-- 2 行目。1 行目で決まった人には、見られない
http_access deny  all
```

禁止の行を許可の行より前に置きます。

### 3. 認証

利用者名とパスワードで、プロキシを使える人を絞ります。`auth_param` で認証の仕組みを決め、`proxy_auth` の acl で使います。

```squid
auth_param basic program /usr/lib64/squid/basic_ncsa_auth /etc/squid/passwd   # Debian 系は /usr/lib/squid/…
auth_param basic realm Proxy
acl auth_users proxy_auth REQUIRED          # 認証できた利用者
http_access allow auth_users
http_access deny all
```

```bash
sudo htpasswd -c /etc/squid/passwd alice    # Apache と同じ htpasswd で作る
```

`basic_ncsa_auth` の場所は、パッケージで違います【要確認】。

### 4. 資源と管理

| ディレクティブ | 意味 |
|---|---|
| `cache_mem 256 MB` | メモリに置くキャッシュの量 |
| `cache_dir ufs /var/spool/squid 1000 16 256` | ディスクのキャッシュ(種類、場所、MB、ディレクトリの数) |
| `maximum_object_size 64 MB` | キャッシュする 1 つの大きさの上限 |

```bash
sudo squid -k parse                         # 設定の構文を検査
sudo squid -k reconfigure                   # 止めずに、設定を読み直す
squidclient -h localhost mgr:info           # 動いている Squid に、状態を問い合わせる(Squid 6 以前)
curl http://localhost:3128/squid-internal-mgr/info   # Squid 7 以降の、同じ問い合わせ
curl http://localhost:3128/squid-internal-mgr/5min   # 5 分間の統計
```

- `squidclient` は、Squid へ要求を送る簡単なクライアントです。`mgr:info`(全体の情報)、`mgr:5min`(5 分間の統計)のように、キャッシュマネージャーの情報を取れます。ディストリビューションによっては、別のパッケージ(`squidclient`)に入っています。
- Squid 7 では、`squidclient` や `cachemgr.cgi` などの付属ツールがなくなりました。curl やブラウザーで、`/squid-internal-mgr/` から始まる URL に問い合わせて、同じ情報を取ります。
- 変更を `reload`(`systemctl reload squid`)で反映することもできます。
