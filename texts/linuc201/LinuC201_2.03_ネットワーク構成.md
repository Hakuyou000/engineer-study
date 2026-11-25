# LinuC 201 テキスト 2.03 ネットワーク構成

LinuC 102 の 1.07 で学んだ、ネットワークの基礎の続きです。201 では、ルーティングの設定、IP 転送(Linux をルーターにする設定)、通信を調べる道具(tcpdump、nmap、ss)、問題の切り分けの手順を学びます。ここでは、OS は Red Hat 系(AlmaLinux 9)と Debian 系(Ubuntu 24.04、Debian 12)の両方を扱います。

## 2.03.1 基本的なネットワーク構成 (重要度3)

### 1. 新旧のコマンドの対応

ネットワークの設定には、古い道具(**net-tools**)と新しい道具(**iproute2**)があります。新しい Linux では、`ip` が標準です。古いコマンドは、パッケージを入れないと使えないことがあります。

| 用途 | 新しいコマンド(iproute2) | 古いコマンド(net-tools) |
|---|---|---|
| アドレスの表示と設定 | `ip addr` | `ifconfig` |
| NIC の有効・無効 | `ip link set eth0 up` | `ifconfig eth0 up`、`ifup` |
| 経路の表示と設定 | `ip route` | `route` |
| 近くの機器の MAC アドレス(ARP の表) | `ip neigh` | `arp` |
| 待ち受けと接続の表示 | `ss` | `netstat` |

- **NIC** はネットワークカードです。Linux では `eth0` や `enp0s3` のような名前の **インターフェース**として見えます。
- `ifconfig`、`route`、`arp`、`netstat` は net-tools に入っています。AlmaLinux 9 でも Ubuntu 24.04 でも、最小の構成では入っていないことがあります(Ubuntu は `sudo apt install net-tools`、AlmaLinux は `sudo dnf install net-tools`)。

### 2. ip コマンドで Ethernet を設定する

```bash
# 状態を見る(-br は 1 行に短く表示する)
ip -br addr
ip -br link
# アドレスを付ける、外す
sudo ip addr add 192.168.10.5/24 dev eth0
sudo ip addr del 192.168.10.5/24 dev eth0
# NIC を有効にする、無効にする
sudo ip link set eth0 up
sudo ip link set eth0 down
# デフォルトルート(デフォルトゲートウェイ)を付ける
sudo ip route add default via 192.168.10.1
# ARP の表(近くの機器の IP アドレスと MAC アドレスの対応)を見る
ip neigh show
arp -n
```

古いコマンドで同じことをする例です。

```bash
sudo ifconfig eth0 192.168.10.5 netmask 255.255.255.0 up
sudo route add default gw 192.168.10.1
```

> **【ひっかけ】** デフォルトゲートウェイの指定は、`ip route` では `via`、`route` では `gw` です。

- `ip` の設定は、再起動や接続のやり直しで消えます。残すには設定ファイルか `nmcli` を使います(4 の nmcli)。
- `ip link` の `state UP` は、NIC が有効という意味です。`LOWER_UP` は、ケーブルがつながり、リンクが上がっているという意味です。`NO-CARRIER` は、ケーブルや相手の機器につながっていません。

### 3. ネットワークの設定を保存する場所

Linux には、ネットワークを管理する仕組みがいくつかあります。ディストリビューションと版で、標準が違います。

| | 管理する仕組みと設定の場所 |
|---|---|
| AlmaLinux / RHEL 9 系 | **NetworkManager**。設定は `/etc/NetworkManager/system-connections/` の `.nmconnection`(keyfile 形式)。古い形式 `/etc/sysconfig/network-scripts/ifcfg-*` は互換のために読めるが、使わない方向です |
| RHEL 7・8 系 | `/etc/sysconfig/network-scripts/ifcfg-eth0` などを、`network` サービスまたは NetworkManager が読む |
| Debian 12 | **ifupdown**。`/etc/network/interfaces` と `/etc/network/interfaces.d/` |
| Ubuntu 24.04 | **netplan**。`/etc/netplan/*.yaml` を書き、NetworkManager か systemd-networkd が実際に設定する |

`/etc/network/interfaces` の例(Debian 系。固定の IP アドレス)です。

```
auto eth0
iface eth0 inet static
    address 192.168.10.5/24
    gateway 192.168.10.1
```

`ifcfg-eth0` の例(Red Hat 系の古い形式)です。

```
DEVICE=eth0
BOOTPROTO=none
IPADDR=192.168.10.5
PREFIX=24
GATEWAY=192.168.10.1
ONBOOT=yes
```

ここまでの、道具と設定の関係を図にします。

```text
ip, ifconfig, route --------> [kernel]    直接設定する。再起動で消える
                                 ^
                                 |
NetworkManager, ifupdown, netplan         起動と接続のたびに、設定を反映する
                                 ^
                                 |
/etc/NetworkManager/system-connections/   AlmaLinux 9
/etc/network/interfaces                   Debian 12
/etc/netplan/*.yaml                       Ubuntu 24.04
```

下の 3 つが、残る設定(設定ファイル)です。

### 4. nmcli(NetworkManager の操作)

**nmcli** は、NetworkManager をコマンドで操作します。「接続(connection)」は設定のまとまりで、「デバイス(device)」は NIC です。

```bash
# デバイスと接続の状態
nmcli device status
nmcli connection show
nmcli device show eth0
# 固定の IP アドレスにする
sudo nmcli connection modify eth0 ipv4.method manual \
  ipv4.addresses 192.168.10.5/24 ipv4.gateway 192.168.10.1 ipv4.dns 192.168.10.2
# 変更を反映する(modify だけでは反映されない)
sudo nmcli connection up eth0
# 自動の設定(DHCP)に戻す
sudo nmcli connection modify eth0 ipv4.method auto
```

- `nmcli connection modify` の変更は、設定ファイルに保存されます。`connection up` で反映します。
- 新しい接続を作るときは `nmcli connection add type ethernet ifname eth0 con-name office ...` のように書きます。

### 5. 無線 LAN の設定

無線 LAN(Wi-Fi)の NIC も、`ip link` に `wlan0` や `wlp2s0` の名前で出ます。無線ならではの情報は、次の道具で見ます。

| コマンド | 動き |
|---|---|
| `iw dev wlan0 link` | 今つながっているアクセスポイントと、電波の強さを表示する |
| `sudo iw dev wlan0 scan` | 周りのアクセスポイントを探す |
| `iwconfig wlan0` | 無線の状態を表示する(古い道具 wireless-tools) |
| `sudo iwlist wlan0 scan` | 周りのアクセスポイントを探す(古い道具 wireless-tools) |
| `nmcli device wifi list` | NetworkManager が見つけたアクセスポイントの一覧 |
| `nmcli device wifi connect SSID password パスワード` | アクセスポイントにつなぐ |
| `rfkill list` | 無線機能が、スイッチやソフトウェアで止められていないかを見る |

- **iw** は新しい道具で、**iwconfig** と **iwlist** は古い道具です。新しい構成では、`iw` を使います。
- **SSID** は、無線 LAN のネットワークの名前です。
- 無線がつながらないとき、まず `rfkill list` で `Soft blocked: yes` や `Hard blocked: yes` になっていないかを見ます。

> **【2.03.1 まとめ】**
>
> - 新しい道具は `ip`、古い道具は `ifconfig`・`route`・`arp`
> - デフォルトゲートウェイは、`ip route add default via`、`route add default gw`
> - `ip` の設定は再起動で消える。残すには設定ファイルか `nmcli`
> - `nmcli connection modify` の後は `connection up` で反映する
> - 無線は、新しい `iw` と、古い `iwconfig`・`iwlist`

## 2.03.2 高度なネットワーク構成 (重要度3)

### 1. 複数のサブネットへの経路

あて先のネットワークが複数あるときは、ルーティングテーブルに、あて先ごとの経路を足します。ルーティングテーブルは、あて先のネットワークごとに、どこへ送るかを書いた表です。

```bash
# 表示する(ip route)
ip route show
route -n
# あて先ネットワークへの経路を足す
sudo ip route add 10.20.0.0/16 via 192.168.10.254
sudo ip route add 10.30.0.0/24 dev eth1
# 経路を消す
sudo ip route del 10.20.0.0/16
# ある相手へ、どの経路で送られるかを調べる
ip route get 10.20.1.5
```

古いコマンドで書いた例です。

```bash
sudo route add -net 10.20.0.0 netmask 255.255.0.0 gw 192.168.10.254
sudo route del -net 10.20.0.0 netmask 255.255.0.0
```

- あて先に当てはまる経路が複数あるときは、**プレフィックス長が長い**(範囲が狭い)ものが優先されます(ロンゲストマッチ)。当てはまるものがなければ、デフォルトルートを使います。
- `via` に書くゲートウェイは、自分が**直接届く**ネットワークの中の機器でなければなりません。そうでないと `Network is unreachable` になります。
- `ip route add` の設定も、再起動で消えます。残すには、設定ファイル(`ipv4.routes` を `nmcli` で設定する、`/etc/network/interfaces` の `up ip route add ...`、netplan の `routes:` など)に書きます。

### 2. IP 転送(Linux をルーターにする)

Linux は、設定を変えると、受け取ったパケットを別のネットワークへ転送するルーターとして動きます。この設定が **IP 転送**です。標準では無効です。

```text
[PC1] 192.168.10.10   gw 192.168.10.1
  |
  | 192.168.10.0/24
  |
  | eth0 192.168.10.1
[Linux router]        ip_forward を 1 にする
  | eth1 192.168.20.1
  |
  | 192.168.20.0/24
  |
[PC2] 192.168.20.10   gw 192.168.20.1
```

ルーターの `ip_forward` が 0 のままだと、eth0 に来たパケットは eth1 に渡されません。

```bash
# 今の値を見る(0 は無効、1 は有効)
cat /proc/sys/net/ipv4/ip_forward
sysctl net.ipv4.ip_forward
# 今だけ有効にする(再起動で戻る)
sudo sysctl -w net.ipv4.ip_forward=1
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward
# 残す設定にする
echo 'net.ipv4.ip_forward = 1' | sudo tee /etc/sysctl.d/99-forward.conf
sudo sysctl --system           # /etc/sysctl.d/ や /etc/sysctl.conf を読み直す
sudo sysctl -p                 # /etc/sysctl.conf だけを読み直す
```

- **sysctl** は、カーネルの設定(`/proc/sys/` の下の値)を表示、変更するコマンドです。
- `/etc/sysctl.conf` と `/etc/sysctl.d/*.conf` に書くと、起動時に読み込まれます。
- IPv6 の転送は、`net.ipv6.conf.all.forwarding = 1` です。
- `sysctl -w` や `echo 1 > /proc/...` の変更は、再起動で消えます。

> **【ひっかけ】** `ip route add` で経路を足しても、`ip_forward` が 0 のままでは、ほかのホストあてのパケットは転送されません。両方がそろって初めてルーターとして動きます。

### 3. 状態の確認

| コマンド | 見るもの |
|---|---|
| `ip -s link show eth0` | 送受信したパケットの数と、エラー、破棄の数 |
| `ip addr` | アドレスの設定 |
| `ip neigh` | ARP の表。`REACHABLE` は届く、`FAILED` は応答なし |
| `ethtool eth0` | リンクの速度と、リンクが上がっているか(`Link detected: yes`) |
| `netstat -i` | インターフェースごとの統計 |
| `netstat -r` | ルーティングテーブル(`route` と同じ) |
| `netstat -s` | プロトコルごとの統計 |

### 4. ping と ping6

```bash
ping -c 4 192.168.10.1              # 4 回で止める。-c を付けないと止まらない
ping -I eth1 192.168.20.1           # 送り出す NIC を指定する
ping -s 1472 -M do 192.168.20.1     # パケットの大きさを指定し、分割(フラグメント)を禁止する
ping -6 fe80::1%eth0                # IPv6
ping6 2001:db8::1                   # IPv6(古い書き方)
```

- `ping6` は IPv6 用の ping です。最近の `ping` は `-6` でも同じことができます。
- ping は ICMP を使います。ファイアウォールが ICMP を止めていると、つながるのに応答しないことがあります。

### 5. netcat(nc、ncat)

**netcat**(コマンド名は `nc`)は、TCP や UDP で、任意のポートへ接続したり、待ち受けたりします。**ncat** は、nmap のパッケージに入っている、機能の多い版です。

```bash
nc -zv 192.168.20.10 22          # 22 番に接続できるか(データは送らない)
nc -zv 192.168.20.10 20-25       # ポートの範囲
nc -zvu 192.168.20.10 53         # UDP
nc -l 9000                       # 9000 番で待ち受ける(受け取った文字を表示する)
nc 192.168.20.10 9000            # 接続して、入力した文字を送る
nc -w 3 -zv 192.168.20.10 80     # 3 秒で諦める
```

- 経路やファイアウォールの調査で、片側で `nc -l`、もう片側で `nc` を実行すると、「そのポートで通信できるか」を試せます。

### 6. tcpdump(パケットの解析)

**tcpdump** は、NIC を流れるパケットを取り込んで、表示や保存をします。root の権限が必要です。

```bash
sudo tcpdump -i eth0 -nn                         # eth0 のパケットを、名前に変換せず表示する
sudo tcpdump -i any -nn -c 10 port 53            # すべての NIC で、53 番を 10 個だけ
sudo tcpdump -i eth0 -nn host 192.168.10.10      # 相手がそのホストのもの
sudo tcpdump -i eth0 -nn icmp                    # ICMP(ping)だけ
sudo tcpdump -i eth0 -nn tcp and dst port 443    # あて先が 443 番の TCP
sudo tcpdump -i eth0 -w /tmp/cap.pcap            # ファイルに保存する
sudo tcpdump -nn -r /tmp/cap.pcap                # 保存したファイルを読む
```

| オプションと式 | 意味 |
|---|---|
| `-i eth0` | 見る NIC。`any` はすべて |
| `-n` | ホスト名に変換しない。`-nn` はポートの名前にも変換しない |
| `-c 10` | 10 個で止める |
| `-w ファイル` | 保存する(画面には出ない) |
| `-r ファイル` | 保存したファイルを読む |
| `-A` | 中身を文字で表示する。`-X` は 16 進数と文字 |
| `host`、`net`、`port` | 相手のホスト、ネットワーク、ポート |
| `src`、`dst` | 送り元、あて先 |
| `and`、`or`、`not` | 条件の組み合わせ |

- 保存したファイルは、Wireshark で開いて、詳しく調べられます。
- 問題が起きている間にだけ取り込み、`-c` や条件で量を絞ります。通信の中身(パスワードなど)が入る可能性があるので、取り扱いに注意します。

### 7. nmap(ポートの調査)

**nmap** は、ほかのホストの、開いているポートや動いているサービスを調べます。

```bash
nmap 192.168.20.10                   # よく使うポート 1000 個を調べる
nmap -p 22,80,443 192.168.20.10      # ポートを指定する
nmap -p 1-65535 192.168.20.10        # すべてのポート
sudo nmap -sS 192.168.20.10          # SYN スキャン(root が必要)
nmap -sU -p 53 192.168.20.10         # UDP
nmap -sV 192.168.20.10               # サービスの版も調べる
nmap -sn 192.168.20.0/24             # ポートは調べず、生きているホストだけ探す
```

| 結果 | 意味 |
|---|---|
| `open` | そのポートで、待ち受けている |
| `closed` | ホストには届くが、待ち受けていない |
| `filtered` | ファイアウォールなどに止められ、分からない |

> **【注意】** nmap で調べてよいのは、自分が管理している、または許可を得たホストだけです。許可のないポートの調査は、攻撃の準備と見なされることがあります。

### 8. ss と netstat

```bash
ss -tln                 # 待ち受け中の TCP を、番号で表示する
ss -tlnp                # 使っているプロセスも表示する(root なら全部見える)
ss -tan                 # TCP の全接続(待ち受けと接続中)
ss -tan state established     # 接続が確立しているものだけ
ss -s                   # 接続の数の集計
netstat -tlnp           # 同じ内容(古い道具)
```

| オプション | 意味 |
|---|---|
| `-t`、`-u` | TCP、UDP |
| `-l` | 待ち受け中だけ |
| `-a` | すべて |
| `-n` | 名前に変換しない |
| `-p` | プロセスを表示する |
| `-s` | 統計 |

- 待ち受けのアドレスが `0.0.0.0:80` なら、すべての IPv4 アドレスで待ち受けています。`127.0.0.1:80` なら、自分自身からしか届きません。`[::]:80` は IPv6 のすべてです。
- 通信の中身は見えません。中身まで見るなら tcpdump を使います。

調べたいものと、使う道具の対応を図にします。

```text
ping                 つながるか(ICMP)
nc -zv, nmap         ポートに届くか
ss -tlnp             自分で待ち受けているか
ip route get         どの経路で送るか
tcpdump              実際にパケットが流れたか
```

> **【2.03.2 まとめ】**
>
> - 経路は `ip route add 網/長さ via ゲートウェイ`、古い書き方は `route add -net ... netmask ... gw ...`
> - Linux をルーターにするには `net.ipv4.ip_forward=1`。残すには `/etc/sysctl.conf` か `/etc/sysctl.d/`
> - `sysctl -w` と `echo 1 > /proc/...` は再起動で消える。`sysctl -p` は `/etc/sysctl.conf` を読み直す
> - ポートへの接続は `nc -zv`、ポートの調査は `nmap`、待ち受けは `ss -tlnp`、パケットは `tcpdump`

## 2.03.3 ネットワークの問題解決 (重要度3)

### 1. 設定と状態を調べる

```bash
hostname                    # ホスト名を表示する
hostname -f                 # FQDN(完全な名前)を表示する
hostnamectl                 # ホスト名と OS の情報
sudo hostnamectl set-hostname web01.example.com    # 変更して /etc/hostname に保存する
ip -br addr                 # アドレス
ip route                    # 経路
cat /etc/resolv.conf        # DNS サーバー
nmcli device show eth0      # NetworkManager が見ている設定
```

| ファイル | 内容 |
|---|---|
| `/etc/hostname` | このホストの名前(1 行だけ) |
| `/etc/hosts` | 名前と IP アドレスの対応(DNS より先に見る。標準の設定のとき) |
| `/etc/resolv.conf` | 使う DNS サーバー(`nameserver`)と、検索するドメイン(`search`) |

`/etc/hosts` と `/etc/resolv.conf` の例です。

```
127.0.0.1   localhost
192.168.10.20   db01.example.com db01

nameserver 192.168.10.2
search example.com
```

- 名前を引くときの順番は `/etc/nsswitch.conf` の `hosts:` の行で決まります。標準では、`/etc/hosts`、DNS の順です。
- `/etc/resolv.conf` は、NetworkManager や systemd-resolved が自動で書き換えることがあります。手で書き換えても、元に戻ることがあります。

### 2. 原因を切り分ける順番

「つながらない」ときは、近いところから、一つずつ確かめます。どこまで届くかで、原因の場所が決まります。

```text
1. ip link, ethtool                 リンクが上がっているか
       |
2. ip addr                          IP アドレスがあるか
       |
3. ip route, ping (gateway)         ゲートウェイに届くか
       |
4. ping (outside IP)                外の IP アドレスに届くか
       |
5. ping (name), resolv.conf         名前を引けるか
       |
6. nc -zv, ss -tlnp                 ポートに届くか
```

| どこで失敗するか | 疑うところ |
|---|---|
| 1 で失敗(`NO-CARRIER`) | ケーブル、相手のスイッチ、ドライバー |
| 2 で失敗 | DHCP の失敗、設定の間違い |
| 3 で失敗 | ゲートウェイのアドレスやサブネットの間違い、ARP が解決しない(`ip neigh` が `FAILED`) |
| 4 で失敗 | デフォルトルートがない、ルーターの先の問題 |
| 4 は成功、5 で失敗 | DNS サーバーの設定や、DNS サーバーそのものの問題 |
| 5 まで成功、6 で失敗 | ファイアウォール、相手のサービスが動いていない |

### 3. traceroute と mtr(経路の確認)

**traceroute** は、あて先までに通るルーターを、順番に表示します。TTL(パケットが通れるルーターの数)を 1 から増やして送り、途中のルーターが返す ICMP の応答で、経路を調べます。

```text
me --TTL=1--> [router 1]   「TTL が切れた」と返す。1 番目が分かる
me --TTL=2--> [router 2]   「TTL が切れた」と返す。2 番目が分かる
me --TTL=3--> [target]     返事を返す。到着
```

```bash
traceroute 10.20.1.5          # 経路を表示する
traceroute -n 10.20.1.5       # 名前に変換しない(速い)
traceroute -I 10.20.1.5       # ICMP を使う(標準は UDP)
traceroute -T -p 443 10.20.1.5   # TCP の 443 番を使う
traceroute6 2001:db8::1       # IPv6(traceroute -6 と同じ)
mtr -rn -c 10 10.20.1.5       # 10 回ずつ測り、各ルーターの損失率と遅延を表にする
```

- 行の `* * *` は、そのルーターから応答がないという意味です。ファイアウォールが応答を止めているだけで、通信はできていることもあります。
- **mtr** は、traceroute と ping を合わせたような道具です。途中のルーターごとの、パケットの損失率(`Loss%`)と遅延を表示します。`-r` は結果を表で出して終わる、`-c` は回数、`-n` は名前に変換しないという意味です。
- 経路の途中で急に遅くなる、損失が出るところが、原因の候補です。ただし、ルーターが ICMP の応答を後回しにするだけの場合もあるので、最後のあて先に損失がなければ、問題とは限りません。

### 4. ログで、機器の認識や障害を調べる

NIC を OS が認識したか、ドライバーが読み込まれたか、リンクが上がったり下がったりしたかは、ログに記録されます。

| 見るもの | 内容 |
|---|---|
| `dmesg` | カーネルのメッセージ(起動時から)。`dmesg -T` で時刻を人が読める形にする |
| `journalctl -k` | カーネルのメッセージ(systemd のジャーナル) |
| `journalctl -b` | 今回の起動からのすべてのログ |
| `journalctl -u NetworkManager` | NetworkManager のログ |
| `/var/log/messages` | 一般のログ(Red Hat 系。rsyslog が書く) |
| `/var/log/syslog` | 一般のログ(Debian 系。rsyslog が書く) |

```bash
sudo dmesg -T | grep -i -E 'eth|enp|link'
sudo journalctl -k -b | grep -i -E 'eth|enp|link'
sudo journalctl -u NetworkManager --since "10 minutes ago"
sudo tail -f /var/log/messages          # Debian 系は /var/log/syslog
lspci | grep -i ethernet                # PCI の NIC を OS が見つけたか
lsusb                                   # USB の NIC
ip link                                 # インターフェースとして出ているか
```

- `lspci` には出るのに `ip link` に出ないときは、ドライバーが読み込まれていないことを疑います。`dmesg` に、ドライバーのエラーが出ていないかを見ます。
- `journalctl` のログは、設定によっては再起動で消えます。残すには `/var/log/journal/` を作るか、`Storage=persistent` にします。
- Debian 12 の新しい導入では、rsyslog が入っておらず `/var/log/syslog` がないことがあります。【要確認】そのときは `journalctl` で見ます。

### 5. NetworkManager が設定に与える影響

NetworkManager が動いていると、設定が自動で書き換わったり、手で変えた設定が戻ったりします。

| 起きること | 理由と対処 |
|---|---|
| `ip addr add` で付けたアドレスが、しばらくして消えた | NetworkManager が、接続を再設定した。残したいなら `nmcli connection modify` で設定する |
| `/etc/resolv.conf` を直したのに、元に戻る | NetworkManager が上書きする。`nmcli connection modify 接続名 ipv4.dns ...` で設定する。止めるなら `NetworkManager.conf` の `[main]` に `dns=none` |
| 手でファイルを直したが反映されない | `nmcli connection reload` で読み直し、`nmcli connection up` で反映する |
| ある NIC を NetworkManager に触らせたくない | `nmcli device set eth1 managed no` |

- Debian 12 では、`/etc/network/interfaces` に書いた NIC は、NetworkManager が管理しません。
- 動作の確認は `systemctl status NetworkManager`、再起動は `sudo systemctl restart NetworkManager` です。Debian 12 の ifupdown は `systemctl status networking`、Ubuntu の systemd-networkd は `systemctl status systemd-networkd` です。
- systemd のユニット(`NetworkManager.service` など)が起動していなければ、自動の設定は何も動きません。まず `systemctl status` で動いているかを見ます。

> **【2.03.3 まとめ】**
>
> - 切り分けは、リンク、IP アドレス、ゲートウェイ、外の IP アドレス、名前、ポートの順
> - ホスト名は `/etc/hostname`、名前と IP の対応は `/etc/hosts`、DNS は `/etc/resolv.conf`
> - 経路は `traceroute`(`traceroute6`)と `mtr`
> - ログは `dmesg`、`journalctl`、Red Hat 系の `/var/log/messages`、Debian 系の `/var/log/syslog`
> - NetworkManager は設定を書き換える。残す設定は `nmcli` で行う
