# LinuC 3PS テキスト 5.0 高可用性プラットフォームの構築

対象: LinuC レベル3 3PS試験 Version 1.0

止まらないサービスを作るための 3 つの部品を学びます。通信を複数のサーバーに振り分ける**ロードバランサー**(5.1)、Web サーバー自身の負荷分散と同時接続の調整(5.2)、サーバーが壊れたときに別のサーバーへ切り替える**フェイルオーバークラスタ**(5.3)です。

前提は、AlmaLinux 9(RHEL 9 系)と Ubuntu 24.04 です。HAProxy は 2.4(AlmaLinux 9 の標準)〜 3.x 系(2.8 以降でだけ違う点は、その場で書きます)、クラスタは `pcs` を使う RHEL 9 系の手順で書きます。IP アドレスの `192.0.2.0/24` は、文書用の例のアドレスです。

## 5.1 ロードバランサーの構築 (重要度4)

### 1. 全体の形

ロードバランサーが 1 台だと、その 1 台が壊れたときにサービス全体が止まります。これを**単一障害点**(SPOF)と呼びます。そこで、ロードバランサー自身も 2 台にして、**仮想 IP アドレス**(VIP)を持ち回ります。

- **VRRP**(Virtual Router Redundancy Protocol)は、複数の機器で 1 つの仮想 IP アドレスを共有する仕組みです。優先度(priority)がいちばん高い機器が MASTER になり、VIP を持ちます。MASTER が広告(advertisement)を出さなくなると、ほかの機器(BACKUP)が MASTER になり、VIP を引き継ぎます。この切り替えが**フェイルオーバー**です。
- Linux で VRRP を動かすソフトが **keepalived** です。IPVS の設定や、サービスの**ヘルスチェック**(対象が正常に応答するかを定期的に確かめること)もできます。
- 実際に通信を振り分けるのは、**HAProxy** や **IPVS** です。

```text
              [client]
                 |
          VIP 192.0.2.100
          +------+------+
          |             |
   [lb1 MASTER]   [lb2 BACKUP]       keepalived で VIP を持ち回る
   HAProxy        HAProxy
          |             |
          +------+------+
                 |
        +--------+--------+
        |                 |
   [web1 :8080]      [web2 :8080]    ヘルスチェックで異常なものを外す
```

### 2. keepalived の設定(VRRP)

設定ファイルは `/etc/keepalived/keepalived.conf` です。パッケージ名は `keepalived` です。

```text
global_defs {
    router_id LB1                    # この機器の名前(ログに出る)
    enable_script_security           # スクリプトを root 以外で動かす安全のため
    script_user keepalived_script
}

vrrp_script chk_haproxy {
    script "/usr/bin/killall -0 haproxy"   # 終了コード 0 なら正常
    interval 2                             # 2 秒ごとに実行
    weight -20                             # 失敗したら priority を 20 下げる
    fall 2                                 # 2 回続けて失敗で失敗と判断
    rise 2                                 # 2 回続けて成功で復帰と判断
}

vrrp_instance VI_1 {
    state MASTER                     # 最初の状態。もう 1 台は BACKUP
    interface eth0                   # VRRP の広告を出すインターフェース
    virtual_router_id 51             # 同じ VIP の機器は同じ値(1〜255)
    priority 100                     # 大きいほうが MASTER。もう 1 台は 90 など
    advert_int 1                     # 広告の間隔(秒)
    virtual_ipaddress {
        192.0.2.100/24
    }
    track_script {
        chk_haproxy
    }
}
```

| ブロック | 役割 |
|---|---|
| `global_defs` | 全体の設定(機器の名前、スクリプトの安全設定、通知など) |
| `vrrp_script` | 動作を確かめるスクリプトとその間隔。`vrrp_instance` の `track_script` で結び付ける |
| `vrrp_instance` | 1 つの VRRP のグループ。`state`、`interface`、`virtual_router_id`、`priority`、VIP を決める |
| `virtual_server` | IPVS の設定(次の節) |

- `virtual_router_id` と VIP は、同じグループの機器で同じにします。違うと、別のグループとして動き、両方が VIP を持ちます。
- `vrrp_script` の `weight` が負の値のときは、失敗すると `priority` から引かれます。**引かれた結果が、相手の `priority` より低くなるように**数字を決めます(例: 100 − 20 = 80 は、相手の 90 より低い)。`weight` を書かないと(0 のまま)、失敗した機器は FAULT になり、VIP を手放します。
- `state MASTER` と書いても、優先度が高い機器が MASTER になります。`state` は最初の状態です。
- 優先度の高い機器が復帰すると、既定では、VIP を取り返します(プリエンプト)。取り返したくないときは `nopreempt` を書き、両方の `state` を `BACKUP` にします。
- VRRP の広告は、マルチキャスト `224.0.0.18`、IP プロトコル番号 112 で送ります。ファイアウォールで止めると、両方の機器が MASTER になります。
- BACKUP の機器の HAProxy は、VIP を持っていないので、`bind 192.0.2.100:80` で起動に失敗します。`sysctl -w net.ipv4.ip_nonlocal_bind=1` で、持っていないアドレスにも bind できるようにします。または `bind *:80` と書きます。

```bash
sudo systemctl enable --now keepalived
ip -br addr show eth0            # VIP が付いている機器が MASTER
journalctl -u keepalived         # Entering MASTER STATE などが出る
```

### 3. IPVS(LVS)

**IPVS**(IP Virtual Server)は、Linux のカーネルの中にある、L4(IP アドレスとポート番号)の負荷分散の機能です。これを使った負荷分散の構成を **LVS**(Linux Virtual Server)と呼びます。HTTP の中身(URL やヘッダー)は見ません。そのぶん速く、大量の通信を扱えます。

`ipvsadm` で設定します。`keepalived` の `virtual_server` で書くと、ヘルスチェックで異常な実サーバーを自動で外せます。

```bash
sudo dnf install ipvsadm                         # Debian 系は apt install ipvsadm
sudo ipvsadm -A -t 192.0.2.100:80 -s wrr         # 仮想サービスを作る(wrr は重み付きのラウンドロビン)
sudo ipvsadm -a -t 192.0.2.100:80 -r 192.0.2.11:80 -g -w 1    # -g は DR
sudo ipvsadm -a -t 192.0.2.100:80 -r 192.0.2.12:80 -g -w 1
sudo ipvsadm -L -n                               # 一覧(数字のまま表示)
```

| 方式 | オプション | 仕組み | 実サーバーの応答 | 条件 |
|---|---|---|---|---|
| **NAT** | `-m` | 宛先の IP アドレスを実サーバーのものに書き換える | LB を通って戻る | 実サーバーの既定ゲートウェイを LB にする。ポート番号も変えられる |
| **DR**(Direct Routing) | `-g` | 宛先の MAC アドレスだけを書き換える | 実サーバーから直接クライアントへ戻る | LB と実サーバーが同じネットワーク(L2)にある。実サーバーの `lo` に VIP を付け、ARP に答えないようにする。ポート番号は変えられない |
| **TUN**(IP トンネリング) | `-i` | IP パケットを別の IP パケットで包んで送る | 実サーバーから直接クライアントへ戻る | 実サーバーがトンネルを扱える。別のネットワークにも置ける |

```text
NAT 方式
  [client] --> [LB] --> [real server]
  [client] <-- [LB] <-- [real server]     戻りも LB を通る。LB が詰まりやすい

DR 方式
  [client] --> [LB] --> [real server]
  [client] <---------- [real server]      戻りは実サーバーから直接。LB は軽い
```

DR 方式では、実サーバーも VIP を持つので、**ARP の応答を抑える設定**が要ります。これがないと、ネットワークの機器が「VIP は実サーバーのもの」と覚えてしまい、LB を通らない通信が起きます。

```bash
# 実サーバー側(DR)
sudo ip addr add 192.0.2.100/32 dev lo
sudo sysctl -w net.ipv4.conf.all.arp_ignore=1       # 自分の NIC のアドレス宛の ARP だけに答える
sudo sysctl -w net.ipv4.conf.all.arp_announce=2     # ARP の送信元に、出ていく NIC のアドレスを使う
```

keepalived で書くと、次のようになります。

```text
virtual_server 192.0.2.100 80 {
    delay_loop 6                  # ヘルスチェックの間隔(秒)
    lb_algo wrr                   # rr、wrr、lc、wlc、sh など
    lb_kind DR                    # NAT、DR、TUN
    protocol TCP

    real_server 192.0.2.11 80 {
        weight 1
        HTTP_GET {
            url {
                path /health
                status_code 200
            }
            connect_timeout 3
        }
    }
    real_server 192.0.2.12 80 {
        weight 1
        TCP_CHECK {
            connect_timeout 3
        }
    }
}
```

### 4. HAProxy の構成

**HAProxy** は、TCP(L4)と HTTP(L7)の両方で負荷分散できるソフトです。設定ファイルは `/etc/haproxy/haproxy.cfg` です。次の 4 つの節で成り立ちます。

```text
global           プロセス全体の設定(ユーザー、ログ、最大接続数)
defaults         以降の節の既定値(モード、タイムアウト)
frontend <名前>: クライアントから受ける入り口(bind、acl、use_backend)
backend <名前>: 振り分け先のサーバーの集まり(balance、server)
```

```text
global
    log /dev/log local0
    user haproxy
    group haproxy
    pidfile /var/run/haproxy.pid
    maxconn 4000                    # プロセス全体の同時接続の上限
    daemon                          # バックグラウンドで動かす(systemd では不要なことが多い)

defaults
    mode http
    log global
    option httplog
    option forwardfor               # X-Forwarded-For で元の IP を渡す
    timeout connect 5s              # バックエンドへ接続できるまで
    timeout client  30s             # クライアントの無通信
    timeout server  30s             # バックエンドの無応答

frontend fe_http
    bind :80
    default_backend be_web

backend be_web
    balance roundrobin
    server web1 192.0.2.11:8080 check
    server web2 192.0.2.12:8080 check
```

| 設定 | 意味 |
|---|---|
| `daemon`、`user`、`group`、`pidfile` | バックグラウンドで動かす。動かすユーザーとグループ。PID を書くファイル |
| `maxconn` | 同時接続の上限。`global` ではプロセス全体、`server` 行では、そのサーバーへの同時接続の上限(超えた分は待たせる) |
| `timeout connect` | バックエンドへの TCP 接続を待つ時間 |
| `timeout client` | クライアント側が無通信のときに、待つ時間 |
| `timeout server` | バックエンド側が無応答のときに、待つ時間 |

- `timeout` を書かないと、警告が出ます。時間が無制限のままだと、遅いクライアントが接続を握り続けます。単位は `s`(秒)、`ms`(ミリ秒)、`m`(分)です。単位を書かないとミリ秒です。
- `daemon` は、systemd のモード(`-Ws` で起動する master-worker モード)では無視されます。
- 設定の検査と反映は、次のとおりです。

```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg     # 構文の検査
sudo systemctl reload haproxy                   # 接続を切らずに設定を読み直す
```

- AlmaLinux 9 の標準の HAProxy は 2.4 系、Ubuntu 24.04 は 2.8 系です【要確認】。この章の書き方は、2.4 でも動く形です。
- AlmaLinux(SELinux が有効)で、標準以外のポート(8080 など)へ接続できないときは、`sudo setsebool -P haproxy_connect_any 1` で許可します。

### 5. 負荷分散の方式とサーバーの指定

`backend` の `balance` で方式を選びます。

| 方式 | 動き | 向く場面 |
|---|---|---|
| `balance roundrobin` | 順番に振り分ける(`weight` の比で重み付け)。既定 | 処理の重さがそろった短いリクエスト |
| `balance leastconn` | 接続数がいちばん少ないサーバーへ | 接続が長いもの(データベース、WebSocket) |
| `balance source` | クライアントの IP アドレスから決める。同じクライアントは同じサーバーへ | 簡単にセッションを固定したいとき |

`server` 行には、状態を見る `check` と、次のようなオプションを付けます。

```text
backend be_web
    balance roundrobin
    server web1 192.0.2.11:8080 check inter 2s fall 3 rise 2 weight 3
    server web2 192.0.2.12:8080 check inter 2s fall 3 rise 2 weight 1
    server web3 192.0.2.13:8080 check backup
```

| オプション | 意味 |
|---|---|
| `check` | ヘルスチェックをする(付けないと、死んでいても振り分け続ける) |
| `inter 2s` | チェックの間隔(既定 2 秒) |
| `fall 3` | 3 回続けて失敗したら DOWN(既定 3) |
| `rise 2` | 2 回続けて成功したら UP に戻す(既定 2) |
| `weight` | 重み。大きいほど多く振り分ける(既定 1) |
| `backup` | 予備のサーバー。ほかのサーバーがすべて DOWN のときだけ使う |
| `cookie` | クッキーに入れる、このサーバーの識別の値 |

### 6. ヘルスチェックの設定

`check` だけだと、**TCP で接続できるか**だけを見ます。ポートが開いていても、アプリケーションが 500 を返し続けていることは見つかりません。HTTP で確かめるには、`option httpchk` と `http-check expect` を使います。

```text
backend be_web
    option httpchk
    http-check send meth GET uri /health ver HTTP/1.1 hdr Host www.example.com
    http-check expect status 200
    server web1 192.0.2.11:8080 check inter 2s fall 3 rise 2
    server web2 192.0.2.12:8080 check inter 2s fall 3 rise 2
```

- `option httpchk` は、チェックを HTTP のリクエストにします。短い書き方は `option httpchk GET /health` です。
- `http-check expect status 200` は、応答のステータスが 200 のときだけ正常とします。書かないと、2xx と 3xx が正常です。
- 仮想ホストの Web サーバーが相手のときは、`Host` ヘッダーが要ります。上のように `http-check send` で付けます。
- `/health` が、データベースなど依存先まで確かめると、依存先の障害で全台が外れます。何を確かめるかは、要件に合わせて決めます。
- 最悪、全台が DOWN になると、HAProxy は 503 を返します。

### 7. HTTPS(TLS オフロード)

**TLS オフロード**(TLS 終端)は、HAProxy が HTTPS を受けて復号し、バックエンドへは HTTP で渡すことです。証明書の管理が HAProxy だけになり、バックエンドの負担も減ります。

```text
[client] --HTTPS 443--> [HAProxy] --HTTP 8080--> [web1 / web2]
                           |
                           +-- ここで TLS を終わらせる
```

```text
frontend fe_https
    bind :80
    bind :443 ssl crt /etc/haproxy/certs/www.example.com.pem alpn h2,http/1.1
    http-request redirect scheme https code 301 unless { ssl_fc }
    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    default_backend be_web
```

- `ssl crt` で、証明書のファイルを指定します。HAProxy の `crt` のファイルは、**証明書、中間 CA 証明書、秘密鍵を 1 つにつないだ PEM** です(`cat server.crt chain.crt server.key > www.example.com.pem`)。ディレクトリも指定できます。
- `alpn h2,http/1.1` で、クライアントが HTTP/2 を使えるようにします。2.4 では書く必要があります。2.8 以降は、書かなくてもこの値が既定です。
- `redirect scheme https` で、HTTP を HTTPS へ転送します。`{ ssl_fc }` は「TLS の接続か」を表す条件で、`unless { ssl_fc }` は「TLS でなければ」の意味です。
- バックエンドは、元が HTTPS だったことを知らないので、`X-Forwarded-Proto` で伝えます。
- 秘密鍵を含む PEM の権限は、`0600` か `0640`(`haproxy` グループ)にします。

### 8. セッションの固定(Sticky Session)

ログイン状態をサーバーのメモリに持つアプリケーションでは、同じ利用者を同じサーバーへ送り続けないと、ログインが切れます。これが **Sticky Session**(スティッキーセッション)です。

| 方法 | 設定 | 特徴 |
|---|---|---|
| 送信元 IP | `balance source` | 簡単。NAT の後ろの大勢が 1 つの IP に見えると、片寄る |
| クッキー | `cookie SRV insert indirect nocache` と、`server` 行の `cookie` | 利用者ごとに固定できる。HTTP モードだけ |

```text
backend be_app
    balance roundrobin
    cookie SRV insert indirect nocache
    server web1 192.0.2.11:8080 check cookie s1
    server web2 192.0.2.12:8080 check cookie s2
```

- HAProxy が、最初の応答に `Set-Cookie: SRV=s1` を足します。次のリクエストからは、`SRV=s1` を見て web1 へ送ります。
- 固定したサーバーが DOWN になると、別のサーバーへ移ります。そのとき、メモリのセッションは失われます。本当は、セッションを共有(Redis など)するのがよい設計です。

### 9. acl と振り分け、ヘッダーと圧縮

**acl**(アクセス制御リスト)は、「リクエストの何かが、条件に合うか」に名前を付けます。それを使って、振り分け先を選びます。

```text
frontend fe_https
    bind :443 ssl crt /etc/haproxy/certs/www.example.com.pem
    acl is_api  path_beg /api            # パスが /api で始まる
    acl is_img  hdr(host) -i img.example.com
    use_backend be_api if is_api
    use_backend be_img if is_img
    default_backend be_web               # どれにも合わないとき
```

- `use_backend` は、上から順に調べ、最初に合ったものを使います。
- `default_backend` がなく、どの `use_backend` にも合わないと、503 になります。

ヘッダーは、`http-response` で応答に対して書き換えます。

```text
frontend fe_https
    http-response set-header Strict-Transport-Security "max-age=31536000"
    http-response add-header X-Served-By lb1
    http-response del-header Server
    compression algo gzip
    compression type text/html text/plain text/css application/json
```

| ディレクティブ | 意味 |
|---|---|
| `http-response set-header` | ヘッダーを設定する。すでにあれば置き換える |
| `http-response add-header` | ヘッダーを追加する。すでにあっても、もう 1 つ足す |
| `http-response del-header` | ヘッダーを消す(`Server` で、ソフトの名前を隠すなど) |
| `compression algo gzip` | 圧縮の方式 |
| `compression type` | 圧縮する Content-Type を絞る。書かないと、条件に合う応答をすべて圧縮する(画像も対象になる) |

- 画像や、すでに圧縮されたファイルは、`compression type` に入れません。CPU を使うだけで、小さくなりません。

## 5.2 Web サーバーによる負荷分散 (重要度3)

HAProxy を使わず、Apache や nginx 自身の機能で、裏のサーバーへ振り分けることもできます。この節は、その設定と、同時接続の調整です。

### 1. Apache の mod_proxy_balancer

Apache では、**mod_proxy_balancer** が、バックエンドへの振り分けを担当します。必要なモジュールは、`mod_proxy`、`mod_proxy_http`、`mod_proxy_balancer`、振り分けの方式のモジュール(`mod_lbmethod_byrequests` など)と、`mod_slotmem_shm` です。RHEL 系の標準の設定は、これらを読み込んでいます。Debian 系は `a2enmod proxy proxy_http proxy_balancer lbmethod_byrequests` で有効にします。

```apache
<Proxy "balancer://mycluster">
    BalancerMember "http://192.0.2.11:8080" loadfactor=3
    BalancerMember "http://192.0.2.12:8080" loadfactor=1
    BalancerMember "http://192.0.2.13:8080" status=+H
    ProxySet lbmethod=byrequests
</Proxy>

ProxyPass        "/app/" "balancer://mycluster/"
ProxyPassReverse "/app/" "balancer://mycluster/"
```

| ディレクティブ | 意味 |
|---|---|
| `ProxyPass` | この URL へのリクエストを、バックエンドへ中継する |
| `ProxyPassReverse` | バックエンドの応答の `Location` などのヘッダーを、Apache の URL に書き換える(リダイレクトで、バックエンドの内部の URL が出ないようにする) |
| `BalancerMember` | 振り分け先の 1 台 |
| `ProxySet` | グループ全体の設定(方式、固定の方法など) |

- `ProxyPassReverse` に `balancer://` の名前を書くと、全メンバーの URL を書き換えます。
- `BalancerMember` のおもなパラメータ: `loadfactor`(重み。1〜100、既定 1)、`status=+H`(ホットスタンバイ。ほかが全部使えないときだけ使う)、`status=+D`(無効にして外す)、`route`(固定の目印)、`retry`(失敗したメンバーへの再試行までの秒数。既定 60)。
- バックエンドが SELinux で止められるときは、`sudo setsebool -P httpd_can_network_connect 1` で許可します。

### 2. Apache の振り分けの方式

`lbmethod` で方式を決めます。方式ごとに、モジュールが別です。

| lbmethod | 動き | モジュール |
|---|---|---|
| `byrequests` | リクエストの数が、`loadfactor` の比になるように振り分ける。既定 | `mod_lbmethod_byrequests` |
| `bytraffic` | 転送したバイト数が、`loadfactor` の比になるように振り分ける | `mod_lbmethod_bytraffic` |
| `bybusyness` | 処理中のリクエストが、いちばん少ないメンバーへ | `mod_lbmethod_bybusyness` |

- 応答の大きさがばらつくなら `bytraffic`、処理時間がばらつくなら `bybusyness` が向きます。
- 方式のモジュールを読み込んでいないと、`unknown lbmethod` の設定の誤りになり、Apache が起動しません。
- 同じ利用者を同じバックエンドへ送るときは、クッキーを使います。

```apache
Header add Set-Cookie "ROUTEID=.%{BALANCER_WORKER_ROUTE}e; path=/" env=BALANCER_ROUTE_CHANGED
<Proxy "balancer://mycluster">
    BalancerMember "http://192.0.2.11:8080" route=1
    BalancerMember "http://192.0.2.12:8080" route=2
    ProxySet stickysession=ROUTEID
</Proxy>
```

### 3. Apache の持続接続と同時接続の上限

**持続接続**(KeepAlive)は、1 回の TCP 接続で、続けて複数のリクエストを受けることです。接続を作り直すコストが減ります。

| ディレクティブ | 意味 | 既定 |
|---|---|---|
| `KeepAlive` | 持続接続を使うか | On |
| `KeepAliveTimeout` | 次のリクエストを待つ秒数 | 5 |
| `MaxKeepAliveRequests` | 1 回の接続で受けるリクエスト数の上限(0 は無制限) | 100 |
| `MaxRequestWorkers` | 同時に処理するリクエストの上限 | 400(event、worker) |
| `ServerLimit` | プロセス数の上限(設定で変えられる最大) | 16(event、worker) |
| `MaxConnectionsPerChild` | 1 つの子プロセスが処理する接続の数。超えると、そのプロセスを終了して、作り直す(0 は無制限) | 0 |

- 待ち時間(`KeepAliveTimeout`)を長くすると、prefork と worker では、アイドルの接続が処理の枠を占めます。event は、アイドルの接続をリスナーのスレッドに任せるので、影響が小さくなります。混んでいるサーバーでは、短くします。
- Ubuntu の `mpm_event.conf` は、`MaxRequestWorkers` を 150 にしています【要確認】。
- `MaxRequestWorkers` は、`ServerLimit × ThreadsPerChild` を超えられません。event と worker の既定は、16 × 25 = 400 です。超えて上げたいときは `ServerLimit` も上げ、`httpd` を再起動します(`reload` では変わりません)。
- 上限に達すると、エラーログに `server reached MaxRequestWorkers setting, consider raising the MaxRequestWorkers setting` と出ます。新しい接続は待たされます。
- `MaxConnectionsPerChild` は、メモリを少しずつ使い込むモジュールがあるときに、定期的にプロセスを作り直す用途で使います。

```text
MaxRequestWorkers  <=  ServerLimit  x  ThreadsPerChild
        400        <=      16       x       25            event の既定値
```

### 4. nginx の upstream

nginx では、`upstream` ブロックにサーバーを並べ、`proxy_pass` で使います。

```nginx
upstream backend {
    least_conn;
    server 192.0.2.11:8080 weight=3;
    server 192.0.2.12:8080 max_fails=3 fail_timeout=30s;
    server 192.0.2.13:8080 backup;
    server 192.0.2.14:8080 down;
    keepalive 16;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

| パラメータ | 意味 |
|---|---|
| `weight=N` | 重み(既定 1) |
| `backup` | 予備。ほかが使えないときだけ使う |
| `down` | 使わない印(メンテナンス中など)。設定に残したまま外せる |
| `max_fails=N` | `fail_timeout` の間に N 回失敗したら、使えないとみなす(既定 1) |
| `fail_timeout=T` | 失敗を数える期間と、使えないとみなす期間(既定 10 秒) |

- 何も書かないと、**重み付きのラウンドロビン**です。
- nginx(オープンソース版)のヘルスチェックは、実際のリクエストの失敗を見る受け身のものです。定期的に調べる能動的なヘルスチェックは、有償の NGINX Plus の機能です。

| 方式 | 動き | 向く場面 |
|---|---|---|
| (既定) | 重み付きのラウンドロビン | 一般 |
| `least_conn;` | 接続数が最も少ないサーバーへ | 処理時間がばらつく |
| `ip_hash;` | クライアントの IP アドレスで決める(IPv4 は先頭の 3 オクテット) | セッションを固定したい |
| `hash $request_uri consistent;` | 好きな値のハッシュで決める | キャッシュのヒット率を上げたい |

- `ip_hash` と `hash` は、`backup` を使えません。サーバーを一時的に外すときは `down` を使います(`ip_hash` では、`down` にしても、ほかのクライアントの割り当てが変わりません)。
- `hash $request_uri consistent;` の `consistent` は、サーバーを足したり外したりしたときに、割り当てが変わる量を少なくします。
- `proxy_http_version 1.1;` と `proxy_set_header Connection "";` は、`keepalive` で、バックエンドへの接続を使い回すために要ります(nginx 1.29.7 より前。詳しくは LinuC 202 の範囲)。

### 5. nginx の持続接続と処理能力

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;                 # CPU のコア数に合わせる

events {
    worker_connections 1024;           # 1 プロセスの同時接続の上限
    multi_accept off;
    accept_mutex off;
}

http {
    keepalive_timeout  65s;
    keepalive_requests 1000;
    keepalive_disable  msie6;
}
```

| ディレクティブ | 意味 | 組み込みの既定 |
|---|---|---|
| `keepalive_timeout` | 持続接続で、次のリクエストを待つ時間。0 で持続接続を使わない | 75 秒 |
| `keepalive_requests` | 1 回の接続で処理できるリクエストの数 | 1000(1.19.10 以降。それより前は 100) |
| `keepalive_disable` | 持続接続を使わない相手のブラウザー | msie6 |
| `worker_processes` | ワーカープロセスの数。`auto` で CPU のコア数 | 1 |
| `worker_connections` | 1 つのワーカーが開ける接続の上限 | 512 |
| `multi_accept` | 1 回の通知で、新しい接続をまとめて受けるか | off |
| `accept_mutex` | ワーカー同士で、順番に接続を受ける | off(1.11.3 以降) |

- 標準のパッケージの `nginx.conf` は、`worker_processes auto;` と書いています。`worker_connections` の値は配布によって違うので、自分の環境の `/etc/nginx/nginx.conf` で確かめます。
- 同時に処理できる接続の目安は、`worker_processes × worker_connections` です。**リバースプロキシでは、クライアント側とバックエンド側の 2 本を使う**ので、扱えるクライアントの数は約半分です。
- `worker_connections` が足りないと、エラーログに `worker_connections are not enough` と出ます。ファイルディスクリプタの上限(`worker_rlimit_nofile`、systemd の `LimitNOFILE`)も合わせて上げます。
- `accept_mutex` は、古い版では既定で on でした。いまの nginx は off です。接続が少ないサーバーで on にすると、ワーカーが順番を待ちます。

## 5.3 フェイルオーバークラスタの構築 (重要度3)

### 1. クラスタの部品

**フェイルオーバークラスタ**は、複数のサーバー(**ノード**)で 1 つのサービスを守り、動いているノードが壊れたら、別のノードでサービスを動かし直す仕組みです。ロードバランサーが「同時に複数台で処理する」のに対し、こちらは「1 台で動かし、壊れたら切り替える」(アクティブ/スタンバイ)が基本です。データベースのような、同時に 1 つしか動かせないサービスに向きます。

| 部品 | 役割 |
|---|---|
| **Corosync** | ノード同士が通信し、仲間の生死を確かめる。**クォーラム**(過半数)も計算する |
| **Pacemaker** | **リソース**(サービス、仮想 IP、ファイルシステムなど)を、どのノードで動かすかを決める |
| **pcs** | Pacemaker と Corosync を、1 つのコマンドで設定する道具。`pcsd` というサービスを通して、全ノードへ反映する |
| **STONITH**(フェンシング) | 壊れたかもしれないノードを、強制的に止める(電源を落とす) |

```text
[pcs]                 設定の入り口(コマンド)
   |
[Pacemaker]           リソースをどのノードで動かすか決める
   |
[Corosync]            ノード同士の通信、生死の確認、クォーラム
   |
[node1] <------> [node2] <------> [node3]
```

### 2. corosync.conf

Corosync の設定は `/etc/corosync/corosync.conf` です。`pcs cluster setup` が作り、全ノードへ配ります。

```text
totem {
    version: 2
    cluster_name: mycluster
    transport: knet
}

nodelist {
    node {
        ring0_addr: node1.example.com
        name: node1
        nodeid: 1
    }
    node {
        ring0_addr: node2.example.com
        name: node2
        nodeid: 2
    }
    node {
        ring0_addr: node3.example.com
        name: node3
        nodeid: 3
    }
}

quorum {
    provider: corosync_votequorum
}

logging {
    to_logfile: yes
    logfile: /var/log/cluster/corosync.log
    to_syslog: yes
    timestamp: on
}
```

| セクション | 内容 |
|---|---|
| `totem` | ノード同士の通信の設定(クラスタの名前、通信の方式) |
| `quorum` | クォーラムの方式(`corosync_votequorum`)と、2 ノードの扱い |
| `nodelist` | 仲間のノードの一覧(アドレス、名前、ID) |
| `logging` | ログの出し先 |

- `pcs` で作ったクラスタの `corosync.conf` を、手で書き換えず、変更は `pcs cluster config update` などで行い、`pcs cluster corosync` で内容を確かめます。ノードごとに内容が違うと、クラスタが組めません。
- RHEL 9 系の手順は、High Availability のリポジトリを有効にして `pacemaker`、`pcs`、`fence-agents-all` を入れ、`firewall-cmd --permanent --add-service=high-availability` でファイアウォールを開けます。AlmaLinux 9 では、リポジトリの名前が `highavailability` です【要確認】。
- Ubuntu 24.04 にも `pcs`、`pacemaker`、`corosync` のパッケージがあります。入れたとき、自動で作られる初期のクラスタの設定を `pcs cluster destroy` で消してから、組みます【要確認】。

**クォーラム**は、クラスタが動いてよい条件(過半数のノードが見えている)です。N 台のクラスタで、必要な票は `N ÷ 2` の切り捨てに 1 を足した数(3 台なら 2、4 台なら 3、5 台なら 3)です。過半数に届かないノードは、リソースを止めます。

**スプリットブレイン**は、通信が途切れ、両方が「相手が死んだ」と思って、両方がサービスを動かす状態です。同じデータへ同時に書くと、壊れます。クォーラムと STONITH で防ぎます。

```text
node1 と node2 の間の通信が切れた(3 ノード)

  [node1] --X-- [node2]
      \          /
       \        /
        [node3]

  node1 + node3 = 2 票 → クォーラムあり(動き続ける)
  node2 だけ = 1 票 → クォーラムなし(止まる)。STONITH で電源も落とす
```

2 ノードのクラスタは、片方が見えなくなると過半数にならないので、`quorum` に `two_node: 1` を書き、特別に扱います(`pcs cluster setup` が自動で書きます)。そのため、2 ノードでは**スプリットブレインを STONITH で防ぐ**ことが特に大事です。

### 3. pcs でクラスタを作る

```bash
# 全ノードで
sudo systemctl enable --now pcsd
sudo passwd hacluster                              # pcs が使うユーザーの、パスワードを決める

# どれか 1 台で
sudo pcs host auth node1 node2 -u hacluster        # ノードを認証(パスワードを聞かれる)
sudo pcs cluster setup mycluster node1 node2       # corosync.conf を作って配る
sudo pcs cluster start --all                       # 全ノードで起動
sudo pcs cluster enable --all                      # OS の起動時に自動で起動
sudo pcs status                                    # 状態
```

| コマンド | 内容 |
|---|---|
| `pcs cluster ...` | クラスタの作成、起動、停止、ノードの追加 |
| `pcs property set ...` | クラスタ全体の設定 |
| `pcs status` | クラスタ、ノード、リソースの状態 |
| `pcs resource ...` | リソースの作成、変更、削除、掃除(`cleanup`) |
| `pcs constraint ...` | リソースの置き場所と順番の制約 |
| `pcs stonith ...` | フェンシングの装置 |
| `pcs node standby node1` | ノードを待機にする(リソースが、ほかのノードへ移る) |

- `pcs cluster enable` をしないと、ノードを再起動したあと、クラスタに戻りません。
- 状態の確認は `pcs status` に加えて、`corosync-cfgtool -s`(通信のリンク)と `corosync-quorumtool -s`(クォーラム)を使います。

### 4. リソースを作る(OCF)

リソースは、**リソースエージェント**(動かし方を知っているスクリプト)で動かします。種類は `標準:提供元:名前` の形で書きます。`ocf:heartbeat:IPaddr2` なら、OCF 標準の、heartbeat の提供元の、`IPaddr2` です。

| リソースエージェント | 内容 | おもなパラメータ |
|---|---|---|
| `ocf:heartbeat:IPaddr2` | 仮想 IP アドレスを付ける | `ip`、`cidr_netmask`、`nic` |
| `ocf:heartbeat:Filesystem` | ファイルシステムをマウントする | `device`、`directory`、`fstype` |
| `ocf:heartbeat:pgsql` | PostgreSQL を動かす | `pgctl`、`psql`、`pgdata` |
| `systemd:httpd` | systemd のサービスをそのまま使う | (なし) |

```bash
sudo pcs resource create vip ocf:heartbeat:IPaddr2 \
    ip=192.0.2.100 cidr_netmask=24 \
    op monitor interval=30s timeout=20s

sudo pcs resource create fs ocf:heartbeat:Filesystem \
    device=/dev/vg_shared/lv_data directory=/var/lib/pgsql fstype=xfs \
    op monitor interval=20s

sudo pcs resource create db ocf:heartbeat:pgsql \
    pgctl=/usr/bin/pg_ctl psql=/usr/bin/psql pgdata=/var/lib/pgsql/data \
    op monitor interval=30s timeout=30s on-fail=restart
```

- `op monitor interval=30s` は、30 秒ごとに状態を確かめます(**interval**)。`timeout` は、1 回の確認を待つ時間です。短すぎると、混んだだけで失敗と判断します。
- `on-fail` は、その操作が失敗したときの動きです。

| `on-fail` | 動き |
|---|---|
| `restart` | リソースを再起動する(多くの操作の既定) |
| `ignore` | 失敗を無視する |
| `block` | 何もしない(手作業を待つ) |
| `stop` | 止めたままにする |
| `standby` | そのノードを待機にして、すべてのリソースを移す |
| `fence` | そのノードをフェンシングする(STONITH が有効なとき、`stop` の失敗の既定) |

- 共有のストレージ(SAN、DRBD など)の `Filesystem` は、同時に 2 つのノードでマウントすると壊れます。STONITH が前提です。
- `pgsql` のパスは、パッケージによって違います。ここは AlmaLinux 9 の標準の `postgresql-server` の例です【要確認】。

### 5. 制約(location、order、colocation)

リソースを作っただけでは、バラバラのノードで動きます。**制約**で関係を決めます。

| 制約 | 意味 | 例 |
|---|---|---|
| **location** | どのノードで動かしたいか(好み) | `pcs constraint location db prefers node1=100` |
| **order** | 起動の順番 | `pcs constraint order fs then db` |
| **colocation** | 同じノードで動かすか(離すか) | `pcs constraint colocation add db with fs INFINITY` |

```bash
sudo pcs constraint order fs then db            # fs を先に起動、db を後に起動(停止は逆順)
sudo pcs constraint order db then vip
sudo pcs constraint colocation add db with fs INFINITY
sudo pcs constraint colocation add vip with db INFINITY
sudo pcs constraint location db prefers node1=100
sudo pcs constraint                             # 制約の一覧
```

- 数字は**スコア**です。`INFINITY` は「必ず」、`-INFINITY` は「絶対にしない」です。
- `colocation add A with B` は、「A を、B と同じノードに置く」です。**B のほうが先に置き場所が決まり、A がそれに従います**。B が動かせないと、A も動けません。
- colocation は、起動の順番を決めません。順番が要るなら、order も足します。
- 同じ組み合わせは、`pcs resource group add dbgroup fs db vip` で、グループにまとめられます。グループは、書いた順に起動し、同じノードに置きます。
- RHEL 9 の `pcs resource move` は、移したあとに制約を自動で消します。制約を残すのは `pcs resource move-with-constraint` と `pcs resource ban` で、残った制約は `pcs resource clear` で消します。

```text
fs  -->  db  -->  vip
 起動の順番(order)

[node1]                      [node2]
 fs, db, vip がまとまって、壊れるとまとまって移る
 動く(colocation)
```

### 6. 戻らない設定と、失敗の扱い

ノードが壊れて、リソースが node2 へ移りました。node1 が直ったあと、リソースが node1 へ戻るのは、必ずしも良いことではありません。戻すためにもう 1 回、短く止まるからです。

| プロパティ(メタ属性) | 意味 |
|---|---|
| `resource-stickiness` | 今いるノードに居続けたい強さ(スコア)。`location` の好みの強さより大きいと、戻らない |
| `migration-threshold` | そのノードで、このリソースが何回失敗したら、ほかのノードへ移すか |
| `failure-timeout` | 失敗の記録(失敗の回数)を、この時間が過ぎたら消す |

```bash
sudo pcs resource defaults update resource-stickiness=100          # 全リソースの既定
sudo pcs resource meta db migration-threshold=3 failure-timeout=10min
```

- 例: `location db prefers node1=50` で、`resource-stickiness=100` なら、node1 が直っても、db は node2 に居続けます(100 > 50)。`prefers node1=200` なら、node1 に戻ります。
- `migration-threshold=3` なら、そのノードで 3 回失敗するまで、同じノードで再起動します。3 回目で、そのノードでは動かさず、別のノードへ移します。
- 失敗の回数は、`failure-timeout` が過ぎるまで残ります。`failure-timeout` がないと、昔の失敗が積み重なり、いつか閾値に届いて移ってしまいます。手で消すには、`pcs resource cleanup db` を使います。
- Pacemaker の `resource-stickiness` の既定は 0 です(clone のインスタンスは 1)。RHEL 8.3 以降の `pcs cluster setup` は、全リソースの既定に 1 を設定します【要確認】。何も設定しないと、`location` の好みが勝ち、直ったノードへ戻ります。

### 7. STONITH(フェンシング)

**STONITH**(Shoot The Other Node In The Head)は、状態の分からないノードを、電源を落とすなどして、確実に止める仕組みです。止まったと分かって初めて、別のノードでサービスを動かします。これがないと、通信が切れただけで動いているノードに、別のノードが同じサービスを起動してしまい(スプリットブレイン)、データが壊れます。

```bash
sudo pcs stonith create fence_node1 fence_ipmilan \
    pcmk_host_list=node1 ip=192.0.2.201 username=admin password=secret lanplus=1
sudo pcs stonith create fence_node2 fence_ipmilan \
    pcmk_host_list=node2 ip=192.0.2.202 username=admin password=secret lanplus=1
sudo pcs property set stonith-enabled=true
sudo pcs property set stonith-timeout=60s
sudo pcs stonith status
sudo pcs stonith fence node2          # 試しに、node2 を止める(実際に電源が落ちる)
```

| プロパティ | 意味 | 既定 |
|---|---|---|
| `stonith-enabled` | フェンシングを使うか | true |
| `stonith-timeout` | フェンシングの操作を待つ時間 | 60 秒 |

- `stonith-enabled=true` で、フェンシングの装置がないと、リソースは起動しません。練習用の仮想環境に限って、`pcs property set stonith-enabled=false` で止められます。**本番では止めません**。
- フェンシングの装置は、ipmi(`fence_ipmilan`)、仮想環境のホスト(`fence_xvm` など)、電源タップ(PDU)などです。ノードごとに作り、どのノードを担当するかを `pcmk_host_list` に書きます。
- 共有ストレージを使うクラスタでは、フェンシングが、データを守る最後の砦です。

### 8. 手を動かして確かめる

1. 手元の 3 台の VM で、keepalived と HAProxy を動かし、MASTER を止めて VIP が移ることを見ます。
2. HAProxy の `server` を 1 台止め、`check` の有無で振り分けが変わることを見ます。
3. 3 台のクラスタを `pcs` で作り、`vip` と `db` を足して、ノードを `standby` にして、動きを見ます。
4. 試験のあとも、`haproxy -c`、`nginx -t`、`apachectl configtest`、`pcs status` を、設定のたびに実行する癖を付けます。
