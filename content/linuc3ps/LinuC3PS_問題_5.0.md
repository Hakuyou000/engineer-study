# LinuC3PS 問題 5.0 高可用性プラットフォームの構築

対象: LinuC レベル3 3PS試験 Version 1.0 / 全39問 / すべてオリジナル問題
対応テキスト: `LinuC3PS_5.0_高可用性プラットフォームの構築.md`
解答・解説は末尾。

## 問題

### 5.1 ロードバランサーの構築

**問1** `LinuC3PS-5.0-001` 2 台のロードバランサーに keepalived を入れ、仮想 IP アドレス(VIP)を共有している。lb1 は `priority 100`、lb2 は `priority 90` で、どちらの `vrrp_instance` にも `nopreempt` は書いていない。lb1 の keepalived を止めると VIP は lb2 に移った。そのあと lb1 の keepalived を起動したとき、VIP はどうなるか。

- A. lb2 が MASTER のまま VIP を持ち続ける
- B. どちらも VIP を持たない状態になる
- C. lb1 が優先度が高いので、VIP を取り戻す
- D. lb2 の `priority` が自動で下がるので、そのあと 1 時間は VIP が動かない

**問2** `LinuC3PS-5.0-002` lb1(`priority 100`、MASTER)と lb2(`priority 90`、BACKUP)の構成で、lb1 に次の設定を `/etc/keepalived/keepalived.conf` に書いた。`track_script` には `chk_haproxy` を書いてある。lb1 で HAProxy が停止し、スクリプトが失敗し続けているのに、VIP が lb2 に移らない。原因はどれか。

```text
vrrp_script chk_haproxy {
    script "/usr/bin/killall -0 haproxy"
    interval 2
    weight -5
}
```

- A. `weight -5` では、失敗しても priority が 95 までしか下がらず、lb2 の 90 を下回らない
- B. `advert_int` が 1 秒なので、スクリプトの結果が反映されない
- C. `track_script` は、BACKUP の機器でだけ働く
- D. `state MASTER` と書いた機器は、priority に関係なく MASTER であり続ける

**問3** `LinuC3PS-5.0-003` keepalived の 2 台構成で、`ip -br addr` を見ると、両方の機器が VIP を持っている。2 台は同じネットワークにあり、`virtual_router_id` と VIP の設定は同じである。原因として最も可能性が高いものはどれか。

- A. 2 台の `priority` が違う
- B. ファイアウォールが、VRRP の広告(IP プロトコル 112)を止めている
- C. `vrrp_script` の `weight` が負の値になっている
- D. 2 台の `global_defs` の `router_id` が違う

**問4** `LinuC3PS-5.0-004` keepalived の BACKUP の機器で HAProxy を起動すると、まだ VIP を持っていないので、`bind 192.0.2.100:80` で bind に失敗する。持っていないアドレスにも bind できるようにする sysctl のキーを答えよ(値は不要)。

**問5** `LinuC3PS-5.0-005` IPVS(LVS)で、次の条件をすべて満たす転送方式はどれか。

- LB と実サーバーは同じネットワーク(L2)にある
- LB は、宛先の MAC アドレスだけを書き換えて転送する
- 応答は、実サーバーからクライアントへ直接返し、LB を通らない
- トンネルの設定は増やしたくない

選択肢:

- A. NAT(`-m`)
- B. TUN(`-i`)
- C. HAProxy の `mode tcp`
- D. DR(`-g`)

**問6** `LinuC3PS-5.0-006` IPVS を DR 方式で使っている。実サーバーの `lo` に VIP を付けたところ、ネットワークの機器が VIP の MAC アドレスを実サーバーのものと覚えてしまい、LB を通らない通信が起きた。実サーバー側で必要な設定はどれか。

- A. `net.ipv4.ip_forward=0` にして、転送を止める
- B. `arp_ignore=1` と `arp_announce=2` で、VIP についての ARP の応答を抑える
- C. 既定ゲートウェイを LB のアドレスにする
- D. keepalived に `nopreempt` を書く

**問7** `LinuC3PS-5.0-007` IPVS を NAT 方式のまま使っている。クライアントからの SYN は LB を通って実サーバーに届くが、クライアントには応答が返らず、接続できない。実サーバーの既定ゲートウェイは、LB ではなく、別のルーター(192.0.2.1)になっている。どう直すか。

- A. 実サーバーの `lo` に VIP を付ける
- B. 実サーバーに `arp_ignore=1` を設定する
- C. 実サーバーの既定ゲートウェイを、LB のアドレスにする
- D. 転送方式を `-g` に変える(NAT 方式のままにする条件は外す)

**問8** `LinuC3PS-5.0-008` HAProxy の設定は次のとおりである。バックエンドは接続でき、ある処理が 45 秒かかる。クライアントは 30 秒たったところで 504 エラーを受け取った。直すには、どの設定を変えるか。

```text
defaults
    mode http
    timeout connect 5s
    timeout client  60s
    timeout server  30s
```

- A. `timeout server` を 60s にする
- B. `timeout connect` を 60s にする
- C. `timeout client` を 10s にする
- D. `global` の `maxconn` を 4 倍にする

**問9** `LinuC3PS-5.0-009` `/etc/haproxy/haproxy.cfg` の backend に `server web1 192.0.2.11:8080 check` と書いている。web1 は、ポート 8080 は開いているが、アプリケーションが 500 を返し続けている。それでも web1 に振り分けられてしまう。500 を返しているあいだだけ自動で外し、直ったら自動で戻したい。どう設定するか。

- A. `inter` を 500ms にする
- B. `weight 0` を付ける
- C. `balance leastconn` に変える
- D. `option httpchk` を足し、`http-check expect status 200` で正常な応答を決める

**問10** `LinuC3PS-5.0-010` HAProxy の `bind :443 ssl crt /etc/haproxy/certs/www.pem alpn ...` で、HTTP/2 を使えるようにしたい。`alpn` の後ろに書く、HTTP/2 を表す識別子を答えよ(HTTP/1.1 は不要)。

**問11** `LinuC3PS-5.0-011` `defaults` に `mode http` がある。次の frontend で、`/index.html` へのリクエストを受けると、どうなるか。

```text
frontend fe_https
    bind :443 ssl crt /etc/haproxy/certs/www.pem
    acl is_api path_beg /api
    use_backend be_api if is_api

backend be_api
    server api1 192.0.2.21:9000 check

backend be_web
    server web1 192.0.2.11:8080 check
```

- A. `be_api` に振り分けられる
- B. HAProxy が 404 を返す
- C. 振り分け先がないので、HAProxy が 503 を返す
- D. 最初に書かれた backend に振り分けられる

**問12** `LinuC3PS-5.0-012` HAProxy で、クッキーを使い、同じ利用者を同じサーバーに送り続けたい(Sticky Session)。設定として正しいものを**2つ**選べ。

- A. `balance source` を書く
- B. backend に `cookie SRV insert indirect nocache` を書く
- C. `option httpchk` を書く
- D. 各 `server` 行に、`cookie s1`、`cookie s2` のように、サーバーごとの値を付ける

**問13** `LinuC3PS-5.0-013` HAProxy の `server` 行で、ほかのサーバーがすべて DOWN になったときだけ使う予備にするためのキーワードを答えよ。

**問14** `LinuC3PS-5.0-014` `defaults` に `mode http` がある HAProxy で、返す応答から、`Server` ヘッダー自体を取り除きたい。正しい設定はどれか。

- A. `http-response del-header Server`
- B. `http-response add-header Server none`
- C. `http-request del-header Server`
- D. `option forwardfor`

**問15** `LinuC3PS-5.0-015` HAProxy(`mode http`)で `compression algo gzip` だけを書いたところ、JPEG の画像まで圧縮しようとして CPU を使っている。圧縮する応答を HTML と JSON だけに絞るために、足す設定はどれか。

- A. `compression algo deflate`
- B. `option forwardfor`
- C. `mode tcp`
- D. `compression type text/html application/json`

**問16** `LinuC3PS-5.0-016` `defaults` に `mode http` がある。次の設定を書いたところ、ブラウザーが「リダイレクトが繰り返されました」と表示した。直し方はどれか。

```text
frontend fe_https
    bind :80
    bind :443 ssl crt /etc/haproxy/certs/www.pem
    http-request redirect scheme https
    default_backend be_web
```

- A. `alpn h2` だけにする
- B. `http-request redirect scheme https unless { ssl_fc }` のように、TLS でないときだけ転送する
- C. `compression algo gzip` を足す
- D. `balance source` を足す

### 5.2 Web サーバーによる負荷分散

**問17** `LinuC3PS-5.0-017` Apache の mod_proxy_balancer で、`BalancerMember` を、ほかのメンバーがすべて使えないときだけ使う予備(ホットスタンバイ)にするパラメータを、`名前=値` の形で答えよ。

**問18** `LinuC3PS-5.0-018` Apache で `balancer://mycluster` に 3 台を並べている。配るファイルの大きさが数 KB から数百 MB まで大きくばらつく。リクエストの数ではなく、転送したバイト数の比が `loadfactor` に合うように振り分けたい。`ProxySet` の `lbmethod` に何を指定するか。

- A. `bytraffic`
- B. `byrequests`
- C. `bybusyness`
- D. `stickysession`

**問19** `LinuC3PS-5.0-019` `ProxySet lbmethod=bybusyness` を書いて `apachectl configtest` を実行すると、`ProxySet` について `unknown lbmethod`(`bybusyness` の方式が見つからない)という意味のエラーが出て、Apache が起動しない。`mod_proxy` と `mod_proxy_balancer` は読み込み済みである。原因はどれか。

- A. `mod_ssl` が読み込まれていない
- B. `KeepAlive` が On になっている
- C. `mod_lbmethod_bybusyness` が読み込まれていない
- D. `ServerLimit` が小さい

**問20** `LinuC3PS-5.0-020` Apache で `/app/` を 2 台のバックエンドへ中継している。バックエンドがログイン後に返すリダイレクトの `Location` が `http://192.0.2.11:8080/login` と、内部のアドレスのまま利用者に見えてしまう。直すのはどのディレクティブか。

- A. `BalancerMember` の `loadfactor`
- B. `ProxyPassReverse`
- C. `KeepAliveTimeout`
- D. `BalancerMember` の `status=+D`

**問21** `LinuC3PS-5.0-021` Apache 2.4 の event MPM で、`MaxRequestWorkers` を 600 にして `reload` した。`ServerLimit` は既定の 16、`ThreadsPerChild` は 25 である。エラーログに、`MaxRequestWorkers` が `ServerLimit` × `ThreadsPerChild` を超えているという警告が出て、400 のままである。`ThreadsPerChild` は 25 のまま、600 の同時処理を使えるようにするには、どうするか。

- A. `MaxConnectionsPerChild` を 600 にする
- B. `KeepAlive` を Off にする
- C. `ThreadsPerChild` を 600 にする
- D. `ServerLimit` を 24 以上にして、`httpd` を再起動する

**問22** `LinuC3PS-5.0-022` Apache 2.4 を prefork MPM で動かしている。混んだ時間にエラーログへ `server reached MaxRequestWorkers setting` と出て、新しい接続が待たされる。`KeepAliveTimeout` は 60 で、アイドルの持続接続が多くの処理の枠(プロセス)を占めていた。まず変えるべき設定はどれか。

- A. `KeepAliveTimeout` を数秒にする
- B. `MaxKeepAliveRequests` を 0(無制限)にする
- C. `KeepAliveTimeout` を 300 にする
- D. `MaxConnectionsPerChild` を 0 にする

**問23** `LinuC3PS-5.0-023` Apache で、ある拡張モジュールが、少しずつメモリを使い込む。子プロセスが一定数の接続を処理したら、そのプロセスを終了して作り直し、メモリを手放させたい。使うディレクティブはどれか。

- A. `MaxRequestWorkers 10000`
- B. `ServerLimit 10000`
- C. `MaxConnectionsPerChild 10000`
- D. `MaxKeepAliveRequests 10000`

**問24** `LinuC3PS-5.0-024` nginx の `upstream` に `ip_hash;` を書き、3 台のサーバーを並べている。1 台をメンテナンスのために一時的に外したいが、ほかのクライアントの割り当てを変えたくない。どうするか。

- A. その `server` 行に `backup` を付ける
- B. その `server` 行に `down` を付ける
- C. その `server` 行を削除する
- D. その `server` 行に `max_fails=0` を付ける

**問25** `LinuC3PS-5.0-025` nginx をリバースプロキシとして使う。`worker_processes 4;` と `worker_connections 1024;` を設定した。クライアントと同時に張れる接続の数の目安はいくつか(1 つのリクエストごとに、クライアント側とバックエンド側の 2 本の接続を使う)。

- A. 約 4096
- B. 約 1024
- C. 約 8192
- D. 約 2048

**問26** `LinuC3PS-5.0-026` nginx の `upstream` に、`server 192.0.2.11:8080 weight=3;` と `server 192.0.2.12:8080;` の 2 台を書いた。方式は何も書いていない。すべてが正常なとき、8 回のリクエストは、ほぼどう振り分けられるか。

- A. 6 回と 2 回
- B. 4 回と 4 回
- C. 8 回と 0 回
- D. 5 回と 3 回

**問27** `LinuC3PS-5.0-027` nginx の設定について、正しい説明を**2つ**選べ。

- A. `ip_hash` は、IPv4 のクライアントでは、アドレスの先頭 3 オクテットで振り分け先を決める
- B. `accept_mutex` は、1.11.3 以降も既定で on である
- C. `keepalive_timeout 0;` は、持続接続を使わない設定である
- D. `worker_processes` を書かないと、CPU のコア数と同じ数のワーカーが動く

**問28** `LinuC3PS-5.0-028` Apache で、持続接続の 1 回の接続あたりに受けるリクエスト数の上限を決めるディレクティブの名前を答えよ。

### 5.3 フェイルオーバークラスタの構築

**問29** `LinuC3PS-5.0-029` 2 台の AlmaLinux 9 に `pcs cluster setup` でクラスタを作り、両方のノードが Online である。フェンシングの装置は作っていない。次を実行しても、`vip` が Stopped のままで、起動しない。`ip` の値は正しく、`pcsd` も動いている。原因として正しいものはどれか。

```bash
sudo pcs resource create vip ocf:heartbeat:IPaddr2 ip=192.0.2.100 cidr_netmask=24
```

- A. `cidr_netmask` は、32 以外を指定できない
- B. `stonith-enabled` の既定が true で、フェンシングの装置がないので、リソースを起動しない
- C. 両方のノードが Online なので、クォーラムが足りない
- D. `pcsd` を、`hacluster` 以外のユーザーで動かす必要がある

**問30** `LinuC3PS-5.0-030` 5 ノードのクラスタで、ネットワークの故障により、3 台と 2 台に分断された。`no-quorum-policy` は既定のままである。どうなるか。

- A. 両方がサービスを動かし続ける
- B. すべてのノードがリソースを止める
- C. ノードの数が少ない 2 台の側が動き続ける
- D. 3 台の側は動き続け、2 台の側はリソースを止める

**問31** `LinuC3PS-5.0-031` `db` と `vip` のリソースがある。`vip` を、`db` と同じノードに置き、`db` が起動したあとに起動したい。正しい設定を**2つ**選べ。

- A. `pcs constraint location vip prefers db=INFINITY`
- B. `pcs constraint colocation add vip with db INFINITY`
- C. `pcs constraint order db then vip`
- D. `pcs resource defaults update resource-stickiness=INFINITY`

**問32** `LinuC3PS-5.0-032` `db` は `pcs constraint location db prefers node1=50` で node1 を好み、`resource-stickiness=100` が全リソースの既定である。node1 が故障して `db` が node2 に移った。そのあと node1 が復旧した。`db` はどうなるか。

- A. node2 で動き続ける
- B. node1 へ戻る
- C. node1 と node2 の両方で動く
- D. 停止する

**問33** `LinuC3PS-5.0-033` `db` リソースが node1 で失敗したとき、同じノードで再起動を繰り返さず、3 回目の失敗で別のノードへ移すようにしたい。`pcs resource meta` で設定するメタ属性の名前を答えよ(値は不要)。

**問34** `LinuC3PS-5.0-034` `db` の `monitor` 操作が失敗したら、そのノードを強制的に止めて(電源を落として)、別のノードで動かし直したい。STONITH は設定済みである。`op monitor` に付ける `on-fail` の値はどれか。

- A. `ignore`
- B. `block`
- C. `fence`
- D. `standby`

**問35** `LinuC3PS-5.0-035` Pacemaker で、Linux の `ip` コマンドで IPv4 の仮想 IP アドレスを付ける、RHEL 9 で標準のリソースエージェントを、`標準:提供元:名前` の形で答えよ。

**問36** `LinuC3PS-5.0-036` `db` に `migration-threshold=2` を設定している。1 週間前に 1 回失敗した記録が残っていて、今日 1 回失敗しただけで、`db` が別のノードへ移ってしまった。古い失敗の記録を、時間がたったら数えないようにするには、どのメタ属性を設定するか。

- A. `resource-stickiness`
- B. `stonith-timeout`
- C. `interval`
- D. `failure-timeout`

**問37** `LinuC3PS-5.0-037` メンテナンスのために `pcs resource move-with-constraint db node2` を実行した。終わったあとも、`db` が node2 に固定され、node1 に戻れない。`pcs constraint` に、`cli-prefer-db` という名前の location の制約が残っている。この制約を取り除く正しいコマンドはどれか。

- A. `pcs resource cleanup db`
- B. `pcs resource clear db`
- C. `pcs cluster stop --all`
- D. `pcs property set stonith-enabled=false`

**問38** `LinuC3PS-5.0-038` 共有ストレージのファイルシステム `fs`(`ocf:heartbeat:Filesystem`)、PostgreSQL の `db`(`ocf:heartbeat:pgsql`)、仮想 IP の `vip`(`ocf:heartbeat:IPaddr2`)を、同じノードで、この順に起動したい。停止は逆の順にする。1 つのコマンドで済ませるなら、どれか。

- A. `pcs resource group add dbgroup fs db vip`
- B. `pcs resource group add dbgroup vip db fs`
- C. `pcs resource group add dbgroup db fs vip`
- D. `pcs constraint location dbgroup prefers node1=100`

**問39** `LinuC3PS-5.0-039` `/etc/corosync/corosync.conf` で、クラスタに参加するノードのアドレス、名前、ID(`ring0_addr`、`name`、`nodeid`)を書くセクションはどれか。

- A. `totem`
- B. `quorum`
- C. `nodelist`
- D. `logging`

## 解答・解説

### 問1 `LinuC3PS-5.0-001`

**正解**: C

VRRP では、優先度(`priority`)がいちばん高い機器が MASTER になります。`nopreempt` を書かないと、優先度の高い機器が戻ったときに、MASTER を取り戻します(プリエンプト)。MASTER が止まって VIP が別の機器へ移る切り替えは、フェイルオーバーです。lb1 の起動後、lb1 が VIP を取り戻します。

- A. プリエンプトが有効なので、lb2 は MASTER のままではいません。取り戻させたくないときは、`nopreempt` を書き、両方の `state` を `BACKUP` にします。
- B. VRRP は VIP をどこかの機器に持たせ続ける仕組みで、どちらも持たない状態にはなりません。
- D. 優先度は自動で変わりません。`priority` は設定した値のままです。

### 問2 `LinuC3PS-5.0-002`

**正解**: A

`vrrp_script` の `weight` が負の値のとき、スクリプトが失敗すると、その分だけ `priority` から引かれます。100 − 5 = 95 は、lb2 の 90 より高いので、lb1 が MASTER のままです。VIP を移すには、100 − 20 = 80 のように、相手の `priority` を**下回る**値にします。`weight` を書かない(0 のまま)ときは、失敗した機器が FAULT になり、VIP を手放します。

- B. `advert_int` は広告を出す間隔で、スクリプトの結果の反映とは関係ありません。
- C. `track_script` は、MASTER の機器でも BACKUP の機器でも働きます。
- D. `state` は起動したときの最初の状態です。優先度が変われば MASTER は入れ替わります。

### 問3 `LinuC3PS-5.0-003`

**正解**: B

VRRP の広告は、マルチキャスト `224.0.0.18`、IP プロトコル番号 112 で送ります。ファイアウォールがこれを止めると、お互いの広告が届かず、どちらも「相手がいない」と判断して MASTER になります。`firewall-cmd` で VRRP を許可します。

- A. 同じグループで `priority` が違うのは、正常な設計です。差があるから MASTER が決まります。
- C. 負の `weight` は、失敗したときに `priority` を下げるだけで、両方が VIP を持つ原因にはなりません。
- D. `global_defs` の `router_id` は、ログに出す機器の名前です。機器ごとに別の名前にするのが普通で、VIP には関係しません。

### 問4 `LinuC3PS-5.0-004`

**正解**: `net.ipv4.ip_nonlocal_bind`

`sysctl -w net.ipv4.ip_nonlocal_bind=1` で、自分が持っていないアドレスにも bind できます。永続にするには `/etc/sysctl.d/` に書きます。ほかに、`bind *:80` と書く方法もあります。

**入力の別解**: `net.ipv4.ip_nonlocal_bind=1`、`net.ipv4.ip_nonlocal_bind = 1`、`net/ipv4/ip_nonlocal_bind`、`ip_nonlocal_bind`、`/proc/sys/net/ipv4/ip_nonlocal_bind`

### 問5 `LinuC3PS-5.0-005`

**正解**: D

宛先の MAC アドレスだけを書き換え、応答を実サーバーから直接返すのは、DR(Direct Routing)方式です。LB と実サーバーが同じ L2 にある必要があります。LB に戻りの通信が通らないので、LB の負荷が軽くなります。`ipvsadm` では `-g` です。keepalived の `virtual_server` で書くときは、`lb_kind DR` です。

- A. NAT は、宛先の IP アドレスを書き換え、応答も LB を通ります。
- B. TUN は、IP パケットを別の IP パケットで包むトンネルです。トンネルの設定が要ります。
- C. HAProxy の `mode tcp` は L4 のプロキシで、IPVS の転送方式ではありません。MAC アドレスだけの書き換えや、応答の直接の返信はしません。

### 問6 `LinuC3PS-5.0-006`

**正解**: B

DR 方式では、実サーバーも VIP を持ちます。そのままでは、実サーバーが VIP の ARP に答え、LB を通らない通信が起きます。`arp_ignore=1`(自分の NIC のアドレス宛の ARP にだけ答える)と、`arp_announce=2`(ARP の送信元に、出ていく NIC のアドレスを使う)で抑えます。

- A. `ip_forward` は、パケットを別のネットワークへ転送するかの設定で、ARP の応答とは関係ありません。
- C. 既定ゲートウェイを LB にするのは、NAT 方式の条件です。DR 方式では、応答を直接返すので、不要です。
- D. `nopreempt` は、keepalived の VIP の取り戻しの設定で、ARP とは関係ありません。

### 問7 `LinuC3PS-5.0-007`

**正解**: C

NAT 方式は、LB が宛先の IP アドレスを書き換えて転送するので、戻りも LB を通る必要があります。実サーバーの既定ゲートウェイが別のルーターだと、応答がそのルーターから直接クライアントへ出てしまい、クライアントから見ると、知らない送信元からの応答になって、捨てられます。

- A. `lo` に VIP を付けるのは、DR 方式の設定です。
- B. `arp_ignore` も DR 方式の設定です。
- D. `-g` は DR 方式です。問題の条件で、NAT 方式のままにします。

### 問8 `LinuC3PS-5.0-008`

**正解**: A

`timeout server` は、バックエンドからの応答を待つ時間です。処理に 45 秒かかるのに 30 秒なので、HAProxy が待ちきれず、504 を返します。45 秒より長くします。

- B. `timeout connect` は、バックエンドへの TCP の接続を待つ時間です。この問題では、接続はできています。
- C. `timeout client` は、クライアントが無通信のときに待つ時間です。短くしても、応答の待ち時間は延びません。
- D. `maxconn` は、同時接続の上限です。待ち時間とは関係ありません。

### 問9 `LinuC3PS-5.0-009`

**正解**: D

`check` だけでは、TCP で接続できるかしか見ません。`option httpchk` で HTTP のリクエストを送り、`http-check expect status 200` で、200 のときだけ正常と決めると、500 を返すサーバーを外せます。

- A. `inter` はチェックの間隔です。短くしても、見る内容は変わらず、TCP の接続ができれば正常です。
- B. `weight 0` は手で外す設定で、500 を返したかどうかを見ないので、直っても自動では戻りません。
- C. `balance leastconn` は、振り分けの方式で、ヘルスチェックの内容とは関係ありません。

### 問10 `LinuC3PS-5.0-010`

**正解**: `h2`

`alpn h2,http/1.1` と書くと、クライアントが TLS の接続のときに、HTTP/2(`h2`)か HTTP/1.1 かを選べます。HTTP/2 は TLS の上で使うのが普通なので、`ssl crt` と一緒に書きます。HAProxy 2.8 以降は、`alpn` を書かなければ `h2,http/1.1` が既定で使われます。AlmaLinux 9 の 2.4 系では書く必要があります。このように、HAProxy が TLS を終わらせる構成を、TLS オフロードと呼びます。

### 問11 `LinuC3PS-5.0-011`

**正解**: C

`use_backend` はどの条件にも合わず、`default_backend` もないので、振り分け先がありません。HAProxy は 503 を返します。`be_web` を使わせたいときは、`default_backend be_web` を足します。

- A. `/index.html` は、`path_beg /api` に合いません。
- B. HAProxy は、振り分け先がないときに 404 ではなく 503 を返します。404 は、バックエンドが返すものです。
- D. 先に書いた backend が使われる決まりはありません。

### 問12 `LinuC3PS-5.0-012`

**正解**: B、D

クッキーでの固定には、backend に `cookie SRV insert indirect nocache` を書き、`server` 行にサーバーごとの `cookie` の値を付けます。HAProxy が初回の応答に `Set-Cookie: SRV=s1` を足し、次からはその値を見て、同じサーバーへ送ります。

- A. `balance source` は、クッキーではなく、クライアントの IP アドレスで決める別の方式です。
- C. `option httpchk` は、ヘルスチェックの設定で、固定とは関係ありません。

### 問13 `LinuC3PS-5.0-013`

**正解**: `backup`

`server web3 192.0.2.13:8080 check backup` のように書くと、ほかのサーバーがすべて DOWN のときだけ使われます。

### 問14 `LinuC3PS-5.0-014`

**正解**: A

応答のヘッダーを消すのは `http-response del-header` です。`Server` の値を隠したいときに使います。

- B. `add-header` は、ヘッダーを足します。もともとの `Server` ヘッダーは残り、2 つになります。
- C. `http-request` は、リクエスト(クライアントからバックエンドへ)のヘッダーを扱います。`Server` は応答のヘッダーなので、効きません。
- D. `option forwardfor` は、`X-Forwarded-For` で元の IP を渡す設定です。

### 問15 `LinuC3PS-5.0-015`

**正解**: D

`compression algo` は方式を決めるだけです。`compression type` を書かないと、Content-Type で絞らず、条件に合う応答をすべて圧縮します(画像も対象になります)。`compression type text/html application/json` と書くと、その 2 種類だけを圧縮します。画像のような、すでに圧縮されたものは入れません。

- A. 方式を変えても、圧縮する種類は絞れません。
- B. `option forwardfor` は、元の IP を渡す設定で、圧縮とは関係ありません。
- C. `mode tcp` では、HTTP の中身を扱えず、圧縮できません。種類を絞る設定でもありません。

### 問16 `LinuC3PS-5.0-016`

**正解**: B

条件のない `http-request redirect scheme https` は、すでに HTTPS で来たリクエストも、また HTTPS へ転送するので、無限に繰り返されます。`unless { ssl_fc }`(TLS の接続でなければ)を付け、HTTP のときだけ転送します。

- A. `alpn` は、HTTP/2 を使えるようにする設定で、転送の繰り返しとは関係ありません。
- C. 圧縮は、転送の繰り返しとは関係ありません。
- D. `balance source` は、振り分けの方式で、転送の繰り返しとは関係ありません。

### 問17 `LinuC3PS-5.0-017`

**正解**: `status=+H`

`BalancerMember "http://192.0.2.13:8080" status=+H` と書くと、ほかのメンバーがすべて使えないときだけ使われます(H は Hot standby)。`+D` は無効にして外す指定です。

**入力の別解**: `+H`、`status=H`、`H`

### 問18 `LinuC3PS-5.0-018`

**正解**: A

`bytraffic` は、転送したバイト数が `loadfactor` の比になるように振り分けます。`mod_lbmethod_bytraffic` が要ります。

- B. `byrequests` は、リクエストの数で振り分けます(既定)。大きなファイルが 1 台に集まっても、数が同じなら、同じと数えます。
- C. `bybusyness` は、処理中のリクエストが少ないメンバーへ振り分けます。転送したバイト数の比にはなりません。
- D. `stickysession` は、クッキーで同じ利用者を同じメンバーへ送る設定で、振り分けの方式ではありません。

### 問19 `LinuC3PS-5.0-019`

**正解**: C

振り分けの方式ごとに、モジュールが別です。読み込まれていないと、設定の誤りになり、Apache が起動しません。`bybusyness` には `mod_lbmethod_bybusyness` が要ります。`a2enmod lbmethod_bybusyness`(Debian 系)や、`LoadModule`(Red Hat 系)で読み込みます。

- A. `mod_ssl` は HTTPS のモジュールで、振り分けの方式とは関係ありません。
- B. `KeepAlive` は、持続接続の設定で、方式の読み込みとは関係ありません。
- D. `ServerLimit` は、プロセスの数の上限で、方式の読み込みとは関係ありません。

### 問20 `LinuC3PS-5.0-020`

**正解**: B

`ProxyPassReverse` は、バックエンドの応答の `Location` などのヘッダーを、Apache の URL に書き換えます。`ProxyPassReverse "/app/" "balancer://mycluster/"` のように、バランサーの名前を書くと、各メンバーの URL を書き換えます。

- A. `loadfactor` は、振り分けの重みです。
- C. `KeepAliveTimeout` は、持続接続の待ち時間です。
- D. `status=+D` は、そのメンバーを無効にして外す指定です。

### 問21 `LinuC3PS-5.0-021`

**正解**: D

`MaxRequestWorkers` は、`ServerLimit × ThreadsPerChild` を超えられません。16 × 25 = 400 です。600 にするには、600 ÷ 25 = 24 なので、`ServerLimit` を 24 以上にします。`ServerLimit` の変更は、`reload` では反映されず、`httpd` の再起動が要ります。

- A. `MaxConnectionsPerChild` は、プロセスを作り直す接続の数で、同時処理の上限とは別です。
- B. `KeepAlive` を Off にしても、`MaxRequestWorkers` の上限の計算は変わりません。
- C. `ThreadsPerChild` を 600 にするのは、スレッドの数の上限(`ThreadLimit`、既定 64)を超えるので、設定できません。それに、問題の条件は 25 のままです。

### 問22 `LinuC3PS-5.0-022`

**正解**: A

prefork では、持続接続は、次のリクエストを待つ間も、処理の枠を占めます(event MPM では、アイドルの接続をリスナーのスレッドに任せるので、影響が小さくなります)。混んでいるときは、`KeepAliveTimeout` を数秒にして、アイドルの接続を早く手放します。

- B. `MaxKeepAliveRequests` を 0 にすると、1 つの接続が、さらに長く枠を占めます。
- C. 待ち時間を長くすると、さらに枠を占めて、悪化します。
- D. `MaxConnectionsPerChild` は、プロセスを作り直す条件で、アイドルの接続の占有とは関係ありません。

### 問23 `LinuC3PS-5.0-023`

**正解**: C

`MaxConnectionsPerChild` は、1 つの子プロセスが処理する接続の数です。その数に達したプロセスは終了し、新しいプロセスが作られます。0 は無制限です。Apache 2.2 では `MaxRequestsPerChild` でした。

- A. `MaxRequestWorkers` は、同時に処理するリクエストの上限です。
- B. `ServerLimit` は、プロセスの数の上限です。
- D. `MaxKeepAliveRequests` は、1 回の持続接続で受けるリクエストの数の上限です。プロセスは作り直されません。

### 問24 `LinuC3PS-5.0-024`

**正解**: B

`down` は、サーバーを使わない印で、`ip_hash` の計算の位置は残ります。ほかのクライアントの割り当ては変わりません。

- A. `ip_hash` と `hash` の `upstream` では、`backup` を使えません。`nginx -t` で、設定の誤りになります。
- C. 行を消すと、ハッシュの割り当てが変わり、ほかのクライアントも別のサーバーへ移ることがあります。
- D. `max_fails=0` は、失敗の数を数えない指定で、サーバーを外すものではありません。

### 問25 `LinuC3PS-5.0-025`

**正解**: D

同時の接続の目安は `worker_processes × worker_connections` = 4 × 1024 = 4096 です。リバースプロキシでは、クライアント側とバックエンド側で 2 本を使うので、クライアントは約 2048 です。

- A. 2 本使うことを考えていない数です。
- B. 1 つのワーカーだけの数です。
- C. 4 × 1024 を、さらに 2 倍にした数です。

### 問26 `LinuC3PS-5.0-026`

**正解**: A

何も書かないと、重み付きのラウンドロビンです。`weight` の 3:1 の比で振り分けるので、8 回では 6 回と 2 回です。

- B. 重みがないときの比です。
- C. 重みがあっても、片方だけになるわけではありません。
- D. 3:1 の比ではありません。

### 問27 `LinuC3PS-5.0-027`

**正解**: A、C

`ip_hash` は、IPv4 では先頭の 3 オクテット(/24)で決めます。`keepalive_timeout 0;` は、持続接続を使わない指定です。

- B. `accept_mutex` は、1.11.3 より前は既定で on でしたが、いまは既定で off です。
- D. `worker_processes` の組み込みの既定は 1 です。CPU のコア数に合わせるには、`auto` と書きます(標準のパッケージの `nginx.conf` には書いてあります)。

なお、`keepalive_requests` は 1 回の接続のリクエスト数、`keepalive_disable` は持続接続を使わないブラウザー、`multi_accept` は新しい接続をまとめて受ける設定です。

### 問28 `LinuC3PS-5.0-028`

**正解**: `MaxKeepAliveRequests`

既定は 100 で、0 にすると無制限です。待ち時間は `KeepAliveTimeout`、持続接続の使用の有無は `KeepAlive` です。

### 問29 `LinuC3PS-5.0-029`

**正解**: B

`stonith-enabled` の既定は true です。フェンシングの装置がないと、安全にリソースを動かせないとして、Pacemaker はリソースを起動しません。本番では、`pcs stonith create` で装置を作ります。練習用の環境に限って、`pcs property set stonith-enabled=false` で止められます。

- A. `cidr_netmask` は、24 などの値を使えます。
- C. 両方のノードが Online のときは、過半数がそろっているので、クォーラムはあります。
- D. `pcsd` は、`hacluster` ユーザーのパスワードを使って認証します。動かすユーザーの問題ではありません。

### 問30 `LinuC3PS-5.0-030`

**正解**: D

クォーラムは過半数の票です。5 ノードなら 3 票が要ります。3 台の側はクォーラムがあるので動き続けます。2 台の側は、過半数がないので、`no-quorum-policy` の既定(stop)により、リソースを止めます。STONITH があれば、3 台の側が 2 台の側を止めて、確実に分けます。

- A. 両方が動くと、スプリットブレインです。クォーラムは、これを防ぐためのものです。
- B. 過半数のある側は、止まりません。
- C. 動けるのは、数が多い(過半数の)側です。

### 問31 `LinuC3PS-5.0-031`

**正解**: B、C

`colocation add vip with db INFINITY` で、`vip` を `db` と同じノードに置きます。`order db then vip` で、`db` の起動のあとに `vip` を起動します(停止は逆順)。colocation は順番を決めず、order は置き場所を決めないので、両方が要ります。

- A. location はノードの好みを決める制約で、指定できるのはノードの名前です。`db` はリソースの名前です。
- D. `resource-stickiness` は、今いるノードに居続ける強さです。リソース同士の位置や順番は決まりません。

### 問32 `LinuC3PS-5.0-032`

**正解**: A

今いるノードに居続ける強さ(`resource-stickiness` = 100)が、node1 を好む強さ(50)より大きいので、`db` は node2 のままです。node1 に戻したければ、`prefers node1=200` のように、stickiness より大きいスコアにします。

- B. location のスコア 50 は、stickiness の 100 より小さいので、戻りません。
- C. `db` は、1 つのノードでだけ動くリソースです(clone ではありません)。
- D. 復旧は、リソースを止める理由になりません。

### 問33 `LinuC3PS-5.0-033`

**正解**: `migration-threshold`

`pcs resource meta db migration-threshold=3` と設定すると、同じノードで 3 回失敗したら、別のノードへ移します。

### 問34 `LinuC3PS-5.0-034`

**正解**: C

`on-fail=fence` は、失敗したらそのノードをフェンシング(STONITH)して、別のノードでリソースを動かします。

- A. `ignore` は、失敗を無視します。
- B. `block` は、何もせず、手作業を待ちます。
- D. `standby` は、そのノードを待機にして、リソースを別のノードへ移しますが、電源は落としません。

### 問35 `LinuC3PS-5.0-035`

**正解**: `ocf:heartbeat:IPaddr2`

`pcs resource create vip ocf:heartbeat:IPaddr2 ip=192.0.2.100 cidr_netmask=24` のように使います。OCF の標準で、heartbeat の提供元の `IPaddr2` です。

### 問36 `LinuC3PS-5.0-036`

**正解**: D

`failure-timeout` は、失敗の記録を、その時間がたったら消す設定です。`migration-threshold` と合わせると、「短い期間に何回も失敗したときだけ」別のノードへ移せます。手で消すときは `pcs resource cleanup db` です。

- A. `resource-stickiness` は、今のノードに居続ける強さです。
- B. `stonith-timeout` は、フェンシングの操作を待つ時間です。
- C. `interval` は、`monitor` を実行する間隔です。

### 問37 `LinuC3PS-5.0-037`

**正解**: B

`pcs resource move-with-constraint` は、`cli-prefer-<リソース名>` という location の制約を足して残します。`pcs resource clear db` で、その制約を消します。RHEL 9 の `pcs resource move` は、移したあとに制約を自動で消します。

- A. `cleanup` は、失敗の記録を消すもので、制約は消えません。
- C. クラスタを止めても、制約は残ります。
- D. `stonith-enabled` は、フェンシングの設定で、制約とは関係ありません。本番では止めません。

### 問38 `LinuC3PS-5.0-038`

**正解**: A

`pcs resource group add` は、書いた順に起動し、同じノードに置き、停止は逆順にします。`fs`、`db`、`vip` の順に書きます。

- B. 仮想 IP が先に付き、ファイルシステムがマウントされる前に、データベースが起動する順です。
- C. データベースが、ファイルシステムのマウントより先に起動する順です。
- D. `location` は、ノードの好みを決めるだけです。起動の順番も、同じノードに置くことも、決まりません。

### 問39 `LinuC3PS-5.0-039`

**正解**: C

`nodelist` は、仲間のノードの一覧です。`totem` は、クラスタの名前と通信の方式、`quorum` は、クォーラムの方式、`logging` は、ログの出し先です。`pcs cluster setup` が作り、全ノードへ配ります。

- A. `totem` は、クラスタの名前や通信の方式を書くセクションです。
- B. `quorum` は、クォーラムの計算の方式(`corosync_votequorum` など)を書くセクションです。
- D. `logging` は、ログの出し先を書くセクションです。
