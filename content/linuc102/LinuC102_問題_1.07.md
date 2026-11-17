# LinuC102 問題 1.07 ネットワークの基礎

対象: LinuC レベル1 102試験 / 全31問 / すべてオリジナル問題
対応テキスト: `LinuC102_1.07_ネットワークの基礎.md`
解答・解説は末尾。

## 問題

### 1.07.1 インターネットプロトコルの基礎

**問1** ホスト 192.168.10.77/27 が属するネットワークのネットワークアドレスとブロードキャストアドレスはどれか。

- A. 192.168.10.64 / 192.168.10.95
- B. 192.168.10.72 / 192.168.10.79
- C. 192.168.10.0 / 192.168.10.255
- D. 192.168.10.76 / 192.168.10.79

**問2** /28 のネットワークで、ホストに割り当てられるアドレスの数はどれか。

- A. 16
- B. 14
- C. 30
- D. 6

**問3** プライベートアドレスはどれか。

- A. 172.32.1.1
- B. 192.169.0.1
- C. 172.20.0.1
- D. 11.0.0.1

**問4** DHCP でアドレスを取得できなかったときに、自動で割り当てられるアドレスの範囲はどれか。

- A. 127.0.0.0/8
- B. 224.0.0.0/4
- C. 0.0.0.0/8
- D. 169.254.0.0/16

**問5** サービスとポート番号の組み合わせとして正しいものはどれか。

- A. SSH 23
- B. DNS 53
- C. NTP 110
- D. SMTP 143

**問6** HTTPS と NTP のポート番号の組み合わせはどれか。

- A. 443 と 123
- B. 80 と 123
- C. 443 と 110
- D. 8443 と 53

**問7** 主に UDP を使うものを**2つ**選べ。

- A. SSH
- B. NTP
- C. HTTP
- D. DHCP

**問8** ICMP の説明として正しいものはどれか。

- A. ポート番号で通信先のサービスを区別する
- B. 3ウェイハンドシェイクで接続を確立する
- C. ping や traceroute で使われ、ポート番号を持たない
- D. 到達確認と再送でデータを確実に届ける

**問9** IPv6 アドレスの表記として正しいものはどれか。

- A. `2001::db8::1`
- B. `2001:db8:1`
- C. `2001:db8::1`
- D. `2001:0db8::0000::1`

**問10** IPv6 に存在しないものはどれか。

- A. マルチキャスト
- B. ループバックアドレス
- C. リンクローカルアドレス
- D. ブロードキャスト

### 1.07.2 基本的なネットワーク構成

**問11** net-tools のコマンドと iproute2 のコマンドの対応として誤っているものはどれか。

- A. `ifconfig` と `ip addr`
- B. `route` と `ip route`
- C. `netstat` と `ss`
- D. `ifup` と `ip neigh`

**問12** デフォルトゲートウェイ 192.168.1.1 を追加するコマンドとして正しいものはどれか。

- A. `ip route add default gw 192.168.1.1`
- B. `ip addr add default via 192.168.1.1`
- C. `route add default via 192.168.1.1`
- D. `ip route add default via 192.168.1.1`

**問13** `ip addr add 192.168.1.10/24 dev eth0` で設定したアドレスについて正しいものはどれか。

- A. 再起動後も残る
- B. 再起動すると消える
- C. `/etc/hosts` に書き込まれる
- D. nmcli でしか削除できない

**問14** `nmcli connection modify eth0 ipv4.method manual ipv4.addresses 192.168.1.10/24` を実行した。設定をインターフェースに反映するために実行するコマンドはどれか。

- A. `nmcli connection reload`
- B. `nmcli connection up eth0`
- C. `nmcli general hostname`
- D. 何もしなくてよい

**問15** Red Hat 系の `/etc/sysconfig/network-scripts/ifcfg-eth0` で、DHCP でアドレスを取得する設定はどれか。

- A. `BOOTPROTO=dhcp`
- B. `iface eth0 inet dhcp`
- C. `ipv4.method manual`
- D. `ONBOOT=no`

**問16** `/etc/hosts` の行として正しいものはどれか。

- A. `db01 192.168.1.20`
- B. `192.168.1.20 db01.example.com db01`
- C. `192.168.1.20: db01`
- D. `hosts: 192.168.1.20 db01`

**問17** `/etc/nsswitch.conf` に `hosts: dns files` と書かれている。名前解決の動作はどれか。

- A. DNS に問い合わせ、見つからなければ `/etc/hosts` を調べる
- B. `/etc/hosts` を調べ、見つからなければ DNS に問い合わせる
- C. DNS だけを使う
- D. DNS と `/etc/hosts` に同時に問い合わせる

**問18** ホスト名を恒久的に web01 に変更するコマンドはどれか。

- A. `hostname web01`
- B. `hostnamectl set-hostname web01`
- C. `echo web01 > /etc/hosts`
- D. `export HOSTNAME=web01`

### 1.07.3 基本的なネットワークの問題解決

**問19** IP アドレスを指定した ping は通るが、`ping www.example.com` は `Name or service not known` で失敗する。最初に確認する対象はどれか。

- A. デフォルトルート
- B. `ss -tln` の出力
- C. LAN ケーブル
- D. `/etc/resolv.conf`

**問20** ゲートウェイへの ping は成功するが、`ping 8.8.8.8` は `Network is unreachable` で失敗する。疑うべき原因はどれか。

- A. DNS サーバーの設定
- B. `/etc/hosts` の記述
- C. デフォルトルートがない、または誤っている
- D. 目的のサービスが停止している

**問21** 待ち受け中の TCP ポートを数値で表示し、使っているプロセスも表示するコマンドはどれか。

- A. `ss -tlnp`
- B. `ss -uan`
- C. `netstat -r`
- D. `ss -tn`

**問22** `ss -tln` に `LISTEN 127.0.0.1:25` と表示された。正しい説明はどれか。

- A. 外部のホストから 25 番に接続できる
- B. 127 番ポートで待ち受けている
- C. UDP で待ち受けている
- D. 自ホストからしか 25 番に接続できない

**問23** サーバー 192.168.1.20 の 22 番ポートに接続できるかを確認するコマンドはどれか。

- A. `ping -p 22 192.168.1.20`
- B. `host 192.168.1.20 22`
- C. `ip route get 192.168.1.20`
- D. `nc -zv 192.168.1.20 22`

**問24** tracepath の特徴として正しいものはどれか。

- A. ICMP だけを使う
- B. root 権限が必要
- C. 経路の MTU も表示する
- D. 名前解決を一切行わない

**問25** `route -n` の出力で、Destination が `0.0.0.0`、Flags が `UG` の行の説明はどれか。

- A. ループバックの経路
- B. ゲートウェイを経由するデフォルトルート
- C. 特定ホストあての経路
- D. 無効になった経路

**問26** NetworkManager の接続設定 eth1 を削除するコマンドはどれか。

- A. `nmcli connection delete eth1`
- B. `nmcli device delete eth1`
- C. `nmcli connection down eth1`
- D. `ip addr del eth1`

### 1.07.4 クライアント側のDNS設定

**問27** `/etc/resolv.conf` に書ける `nameserver` の最大数はどれか。

- A. 1
- B. 2
- C. 3
- D. 制限はない

**問28** `/etc/hosts` にだけ `192.168.1.20 db01` と書いた。`/etc/nsswitch.conf` は `hosts: files dns` である。db01 を解決できるコマンドはどれか。

- A. `dig db01`
- B. `host db01`
- C. `getent hosts db01`
- D. `dig @127.0.0.1 db01`

**問29** DNS サーバー 8.8.8.8 に、example.com の MX レコードを問い合わせるコマンドはどれか。

- A. `dig 8.8.8.8 example.com MX`
- B. `dig example.com MX -server 8.8.8.8`
- C. `dig -s 8.8.8.8 example.com MX`
- D. `dig @8.8.8.8 example.com MX`

**問30** IP アドレスからホスト名を引く(逆引き)ときに使うレコードはどれか。

- A. A
- B. AAAA
- C. CNAME
- D. PTR

**問31** `/etc/resolv.conf` に `search example.com` と書いた。効果として正しいものはどれか。

- A. `ping www` が `www.example.com` として名前解決される
- B. example.com の DNS サーバーだけに問い合わせる
- C. example.com への問い合わせを禁止する
- D. `/etc/hosts` より DNS を優先する

## 解答・解説

| 問 | 正解 | 解説 |
|---|---|---|
| 1 | A | /27 のブロックは 32。77 は 64〜95 の範囲に入る。先頭がネットワーク、末尾がブロードキャスト。 |
| 2 | B | ホスト部は 4 ビットで 2^4 = 16。ネットワークとブロードキャストを引いて 14。 |
| 3 | C | クラス B のプライベートは 172.16〜172.31。172.32 や 192.169 はグローバル。 |
| 4 | D | 169.254.0.0/16 はリンクローカル。DHCP で取得できなかったときに自動で付く。 |
| 5 | B | SSH は 22、NTP は 123、SMTP は 25。110 は POP3、143 は IMAP、23 は Telnet。 |
| 6 | A | HTTPS は TCP 443、NTP は UDP 123。 |
| 7 | B、D | NTP と DHCP は UDP。SSH と HTTP は TCP。 |
| 8 | C | ICMP は通信の状態やエラーを伝えるプロトコルで、ポート番号を持たない。サービスの区別、3ウェイハンドシェイク、到達確認と再送は TCP の特徴。 |
| 9 | C | `::` は1か所だけ使える。2か所あると、それぞれ何グループの 0 か決まらない。`2001:db8:1` はグループが足りない。 |
| 10 | D | IPv6 にブロードキャストはなく、マルチキャストで代用する。 |
| 11 | D | ifup に対応するのは `ip link set ... up`。`ip neigh` は ARP テーブル(近隣キャッシュ)を扱う。 |
| 12 | D | `ip route` では `via`、`route` では `gw` でゲートウェイを指定する。 |
| 13 | B | ip、ifconfig、route による設定は一時的。永続化は設定ファイルか nmcli で行う。 |
| 14 | B | `modify` は設定を保存するだけ。`nmcli connection up` で反映する。 |
| 15 | A | Red Hat 系は `BOOTPROTO=dhcp`。`iface eth0 inet dhcp` は Debian 系の `/etc/network/interfaces` の書き方。 |
| 16 | B | IP アドレスが先、ホスト名が後。別名は空白で区切って並べる。 |
| 17 | A | `hosts:` 行は左から順に調べる。dns が先なので DNS、次に `/etc/hosts`。 |
| 18 | B | `hostname web01` は一時的な変更。hostnamectl は `/etc/hostname` に保存する。 |
| 19 | D | IP では届き名前では届かないので、DNS の設定を疑う。問い合わせ先は `/etc/resolv.conf`。 |
| 20 | C | LAN 内は通るが外に出られないので、出口となるデフォルトルートを疑う。 |
| 21 | A | `-t` TCP、`-l` LISTEN、`-n` 数値表示、`-p` プロセス。 |
| 22 | D | 127.0.0.1 で待ち受けているので、自ホストからの接続だけを受け付ける。0.0.0.0 なら全アドレス。 |
| 23 | D | ping は ICMP でポートを確認できない。`nc -zv` は接続できるかだけを確かめる。 |
| 24 | C | tracepath は一般ユーザーで使え、経路の MTU(PMTU)も表示する。 |
| 25 | B | Destination 0.0.0.0 はデフォルトルート。U は有効、G はゲートウェイ経由。 |
| 26 | A | 接続(設定)の削除は `nmcli connection delete`。`down` は無効にするだけ。 |
| 27 | C | nameserver は上から順に使われ、最大 3 つ。 |
| 28 | C | getent は nsswitch.conf に従うので `/etc/hosts` を見る。dig と host は DNS サーバーに直接問い合わせる。 |
| 29 | D | dig は `@サーバー` で問い合わせ先を指定し、レコードの種類は名前の後に書く。 |
| 30 | D | PTR は IP アドレスからホスト名。A レコードは IPv4、AAAA は IPv6、CNAME は別名。 |
| 31 | A | search はドメイン名を省略したときに補うドメイン。順番を変えるのは nsswitch.conf。 |
