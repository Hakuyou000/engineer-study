# LinuC 3PS テキスト 2.0 仮想化基盤のネットワークとストレージ

対象: LinuC レベル3 3PS試験 Version 1.0

仮想マシン(VM)をつなぐネットワークの作り方と、複数のサーバーで使うストレージ(共有ストレージ、分散ストレージ)を学びます。ネットワークは、ブリッジ、NIC の冗長化、VLAN、Open vSwitch、性能の調整です。ストレージは、DRBD、OCFS2、Lustre、そして Ceph です。

Ceph は、cephadm(コンテナで Ceph を入れて管理する道具)で入れる現行の版(Reef 18 系、Squid 19 系)を前提にします。版ごとの違いは 【要確認】 を付けています。

## 2.1 仮想化基盤のネットワーク構築 (重要度4)

出題範囲: ブリッジ、NAT、ホストオンリー。NIC bonding。VLAN ID、Priority。Tagged / Untagged VLAN。Open vSwitch と ovs-vsctl。Jumbo Frame、QoS、シェーピング。SR-IOV、TCP オフロード。マルチキュー、バッファの最適化。

### 1. VM をネットワークにつなぐ 3 つの形

KVM では、VM の仮想 NIC は、ホストの上の仮想スイッチ(Linux ブリッジなど)につながります。仮想スイッチを、物理ネットワークとどうつなぐかで、次の 3 つの形に分かれます。

| 形 | 外のネットワークへの通信 | 外から VM への通信 | 使いどころ |
|---|---|---|---|
| ブリッジ(bridged) | 物理ネットワークにそのまま出る | VM の IP に直接届く | サーバー用途。VM を LAN の一員にする |
| NAT | ホストの IP に変換されて出る | 通常は届かない(ポート転送が必要) | 検証用。ホストの外に見せたくない VM |
| ホストオンリー(isolated) | 出ない | 出ない(同じ仮想スイッチ上のホストと VM だけ) | VM 同士や、ホストとだけ通信させる |

```text
ブリッジ
  VM --- br0 --- eth0 --- 物理ネットワーク(VM は LAN の IP を持つ)

NAT
  VM --- virbr0 --- (iptables / nftables で送信元を変換) --- eth0 --- 物理ネットワーク

ホストオンリー
  VM --- virbr1(外へつながる線がない)
```

- libvirt の既定のネットワーク `default` は NAT です。ホストに `virbr0` ができ、VM は `192.168.122.0/24` の IP を受け取ります。dnsmasq が DHCP と DNS を担当します。
- libvirt で、`<forward>` を書かないネットワークを作ると、ホストオンリー(isolated)になります。
- NAT は、VM から外への通信だけを通します。外から VM の SSH に入るには、DNAT(宛先の変換)でポートを転送します。

#### ブリッジの作り方

ブリッジは、物理 NIC を「ポート」としてつなぎます。IP アドレスは、物理 NIC ではなく、ブリッジに付けます。

```bash
# NetworkManager(AlmaLinux / RHEL 9 系の既定)
nmcli con add type bridge ifname br0 con-name br0 ipv4.method manual ipv4.addresses 192.0.2.10/24 ipv4.gateway 192.0.2.1
nmcli con add type bridge-slave ifname eth0 master br0
nmcli con up br0
```

```yaml
# Ubuntu 24.04(netplan。/etc/netplan/01-br0.yaml)
network:
  version: 2
  ethernets:
    eno1: {}
  bridges:
    br0:
      interfaces: [eno1]
      addresses: [192.0.2.10/24]
      routes:
        - to: default
          via: 192.0.2.1
```

`bridge link` で、ブリッジに入っているポートを確認できます。リモートで作業するときは、物理 NIC の IP をブリッジに移す瞬間に、接続が切れます。コンソールから作業するか、切れても戻る手順を用意します。

### 2. NIC bonding(NIC の冗長化と束ね)

NIC bonding は、複数の物理 NIC を 1 つの論理インターフェース(`bond0`)にまとめるカーネルの機能です。目的は、1 本が切れても通信を続ける(冗長化)ことと、帯域を増やすことです。

| mode | 名前 | 動き | スイッチ側の設定 |
|---|---|---|---|
| 0 | balance-rr(ラウンドロビン) | パケットを順番にすべての NIC へ送る | 静的な束ね(ポートチャネル)が要る |
| 1 | active-backup | 1 本だけ使い、切れたら別の NIC に切り替える | 不要 |
| 2 | balance-xor | 送信元と宛先の組み合わせで NIC を選ぶ | 静的な束ねが要る |
| 3 | broadcast | すべての NIC に同じパケットを送る | 静的な束ねが要る |
| 4 | 802.3ad(LACP) | LACP でスイッチと合意して束ねる | LACP の設定が要る |
| 5 | balance-tlb | 送信だけ負荷分散する | 不要 |
| 6 | balance-alb | 送受信を負荷分散する | 不要 |

- 何も指定しないと、mode は 0(balance-rr)です。
- balance-rr は、1 つの通信を複数の NIC に分けて送れます。ただしパケットの順番が入れ替わりやすく、TCP の性能が下がることがあります。
- active-backup は、スイッチの設定が要りません。もっとも手軽で確実なので、スイッチを分けた冗長化(NIC 1 は SW1、NIC 2 は SW2)に向きます。帯域は増えません。
- 802.3ad(LACP)は、帯域を増やしつつ、障害にも強い形です。ただし、スイッチ側でも LACP を有効にしたポートチャネルを作る必要があります。片方だけでは、束ねが成立しません。
- 802.3ad は、通信ごと(フロー)に使う NIC を決めます。1 本の通信は 1 つの NIC の速度までです。2 本の 1 Gbps を束ねても、1 本の通信が 2 Gbps になるわけではありません。`xmit_hash_policy=layer3+4`(IP とポートで振り分ける)にすると、通信の分散が良くなります。
- `miimon=100` は、100 ミリ秒ごとにリンクの状態を確認する設定です。arp_interval を使わないときの既定も 100 です。0 にすると、リンクの監視が止まり、障害を検出できません。

```bash
# LACP の bond を作る(NetworkManager)
nmcli con add type bond ifname bond0 con-name bond0 bond.options "mode=802.3ad,miimon=100,xmit_hash_policy=layer3+4"
nmcli con add type ethernet ifname eth1 master bond0
nmcli con add type ethernet ifname eth2 master bond0
nmcli con up bond0

# 状態を確認する
cat /proc/net/bonding/bond0
```

`/proc/net/bonding/bond0` に、mode、各 NIC の `MII Status`(リンクの状態)、LACP のパートナー(`Partner Mac Address`)が出ます。LACP が成立していないと、`Aggregator ID` が NIC ごとに別の値になります。

### 3. VLAN(VLAN ID、Priority、Tagged / Untagged)

VLAN は、1 本の物理ネットワークを論理的に分ける仕組みです(IEEE 802.1Q)。イーサネットのフレームに、4 バイトのタグを付けて区別します。

| タグの項目 | 大きさ | 意味 |
|---|---|---|
| VLAN ID(VID) | 12 ビット | VLAN の番号。使えるのは 1〜4094 |
| PCP(Priority Code Point) | 3 ビット | 優先度。0〜7 の 8 段階。既定は 0(Best Effort)。1(Background)は 0 より低く、2〜7 は数が大きいほど優先 |
| DEI | 1 ビット | 輻輳のときに捨ててよいか |

- Tagged は、フレームに VLAN タグが付いた状態です。複数の VLAN を 1 本のリンクに通すトランクで使います。
- Untagged は、タグがない状態です。サーバーや PC がつながるアクセスポートでは、スイッチがタグを付け外しするので、機器にはタグのないフレームが届きます。
- トランクでは、Untagged のフレームがどの VLAN に入るか(ネイティブ VLAN)を、両端でそろえます。ずれると、通信がほかの VLAN に漏れます。

```bash
# Linux で VLAN インターフェース(VLAN 100)を作る
ip link add link eth0 name eth0.100 type vlan id 100
ip link set eth0.100 up
# 送信時の優先度(PCP)を決める。skb の優先度 0 を PCP 3 にする
ip link set eth0.100 type vlan egress-qos-map 0:3
# 確認(-d で VLAN の詳細を出す)
ip -d link show eth0.100
```

### 4. Open vSwitch(OVS)

Open vSwitch は、ソフトウェアで作る多機能な仮想スイッチです。Linux ブリッジより機能が多く、VLAN のトランク、bonding(LACP)、QoS、OpenFlow のフローによる制御、トンネル(VXLAN、GRE)が使えます。

| 部品 | 役割 |
|---|---|
| ovs-vswitchd | スイッチの本体(デーモン) |
| ovsdb-server | 設定を持つデータベース |
| ovs-vsctl | ブリッジ、ポート、VLAN の設定を変えるコマンド(ovsdb に書く) |
| ovs-ofctl | OpenFlow のフローエントリを見る、足す、消すコマンド |

パッケージは、Ubuntu 24.04 では `openvswitch-switch` です。AlmaLinux / RHEL 9 系の標準のリポジトリには入っていません。別のリポジトリ(SIG など)から入れます 【要確認】。

```bash
ovs-vsctl add-br br0                       # ブリッジを作る
ovs-vsctl add-port br0 eth1                # 物理 NIC をポートとして足す
ovs-vsctl add-port br0 vnet0 tag=100       # VM のポートを VLAN 100 のアクセスポートにする
ovs-vsctl set port eth1 trunks=100,200     # eth1 は VLAN 100 と 200 だけを通すトランクにする
ovs-vsctl add-bond br0 bond0 eth2 eth3 lacp=active   # LACP の bond を作る
ovs-vsctl show                             # 全体の構成を見る
ovs-vsctl list-ports br0                   # ブリッジのポートの一覧
ovs-vsctl del-port br0 vnet0               # ポートを消す
```

```text
VM-A (vnet0, tag=100) --+
VM-B (vnet1, tag=100) --+-- br0 --- eth1 (trunks=100,200) --- スイッチのトランクポート
VM-C (vnet2, tag=200) --+
```

- `tag=100` を付けたポート(アクセスポート)は、VM からはタグなしで受け取り、ブリッジの中では VLAN 100 として扱います。外のトランクに出すときに、タグを付けます。
- `trunks=` を指定したポート(トランクポート)は、そこに書いた VLAN だけを、タグ付きで通します。指定しないと、すべての VLAN を通します。
- VLAN 100 の VM-A、VM-B と、VLAN 200 の VM-C は、同じ `br0` に載っていても、互いに通信できません。

#### フローエントリ(OpenFlow)

OVS は、受け取ったフレームを、フローテーブルの規則(フローエントリ)に当てて処理します。フローエントリは、条件(match)と動作(actions)でできています。何も足さない既定では、`actions=NORMAL`(普通の L2 スイッチとして、MAC アドレスを学習して転送する)の 1 本が入っています。

```bash
ovs-ofctl dump-flows br0                   # フローエントリの一覧(パケット数も出る)
ovs-ofctl add-flow br0 "priority=100,dl_vlan=100,actions=drop"      # VLAN 100 のタグが付いて入ったフレームを捨てる
ovs-ofctl add-flow br0 "priority=50,in_port=2,actions=output:3"     # ポート 2 に入ったものをポート 3 へ出す
ovs-ofctl del-flows br0 "dl_vlan=100"      # 条件に合うフローを消す
ovs-ofctl dump-ports br0                   # ポートごとの送受信とエラーの数
```

- 優先度(`priority`)が大きいフローが、先に当たります。
- `ovs-vsctl` はブリッジとポートの設定、`ovs-ofctl` はフローの設定です。分けて覚えます。
- `ovs-ofctl` で足したフローは、ovsdb ではなく ovs-vswitchd のフローテーブルにあります。ovsdb には保存されません。`ovs-ctl restart` はフローを保存して戻しますが、ホストの再起動や ovs-vswitchd の停止と起動では消えます。残すには、起動のスクリプトなどで足し直します。
- `dl_vlan=100` は、受け取った時点でタグが付いているフレームにだけ当たります。`tag=` のアクセスポートから入るタグなしのフレームには当たりません。

### 5. ネットワークの性能を上げる

#### Jumbo Frame(MTU 9000)

MTU(1 フレームに入れられるデータの最大のバイト数)の既定は 1500 です。これを 9000 程度に増やしたものが Jumbo Frame です。1 フレームで運ぶ量が増え、ヘッダーとパケットの数が減るので、ストレージ(NFS、iSCSI、Ceph)やライブマイグレーションの転送で、CPU の負荷が下がり、速度が上がります。

```bash
ip link set eth1 mtu 9000                  # 一時的に変える
nmcli con modify bond0 802-3-ethernet.mtu 9000   # NetworkManager で永続にする
ping -M do -s 8972 192.0.2.20              # 分割を禁止して、9000 の通り道を確かめる
```

- 通り道のすべて(NIC、bond、ブリッジ、VLAN インターフェース、スイッチのポート、相手)で、MTU を 9000 以上にそろえます。1 か所でも小さいと、大きなパケットが捨てられ、小さな通信(ping など)は通るのに、大きなデータの転送だけが止まります。
- `ping -s` で指定するのは ICMP のデータの大きさです。IP ヘッダー(20)と ICMP ヘッダー(8)を足した 28 バイトが加わるので、MTU 9000 は `-s 8972` で確かめます。
- VLAN インターフェースでは、親の NIC(bond を含む)の MTU を先に大きくします。親より大きい値は設定できません。bond に MTU を設定すると、下の NIC にも同じ値が付きます【要確認】。
- 管理用などの外のネットワークと同じ NIC で使うと、外との間で問題が出ます。ストレージ専用のネットワークで使うのが一般的です。

#### QoS とシェーピング

QoS は、通信の種類によって、優先度や使える帯域を決める仕組みです。シェーピングは、送る速度を上限に合わせ、超えた分を待たせる(キューに溜める)方法です。ポリシング(policing)は、超えた分を捨てる方法です。

```bash
# eth0 から出る通信を 100 Mbps に絞る(tbf: トークンバケット)
tc qdisc add dev eth0 root tbf rate 100mbit burst 32kbit latency 400ms
tc qdisc show dev eth0                     # 設定を見る
tc -s qdisc show dev eth0                  # 送った量と捨てた量も見る
tc qdisc del dev eth0 root                 # 元に戻す

# OVS: VM のポートから入ってくる通信を 10 Mbps に制限する(ポリシング。単位は kbps)
ovs-vsctl set interface vnet0 ingress_policing_rate=10000 ingress_policing_burst=1000
```

- `tc` は、Linux の送信側のキューの制御に使います。シェーピングは、基本的に出ていく方向にかけます。
- libvirt でも、VM の XML の `<bandwidth>` で、`inbound` と `outbound` の上限を決められます。

#### SR-IOV

SR-IOV は、1 枚の物理 NIC を、複数の「見かけ上の NIC」に分ける仕組みです。物理側を PF(Physical Function)、分けた側を VF(Virtual Function)と呼びます。VF を VM に直接渡す(パススルー)と、VM はホストの仮想スイッチを通らずに NIC を使えます。遅延が小さく、CPU の負荷も下がります。

```bash
# 前提: BIOS で VT-d(IOMMU)を有効にし、カーネルに intel_iommu=on を付ける(AMD は既定で有効なことが多い)
lspci | grep -i ethernet                                  # NIC を確認する
cat /sys/class/net/eth2/device/sriov_totalvfs             # 作れる VF の最大数
echo 4 > /sys/class/net/eth2/device/sriov_numvfs          # VF を 4 つ作る
ip link show eth2                                         # vf 0 ... vf 3 が出る
```

```text
物理 NIC (PF: eth2)
  +-- VF0 --> VM-A に直接渡す
  +-- VF1 --> VM-B に直接渡す
  +-- VF2, VF3 --> 未使用
```

- NIC の既定(legacy)のモードでは、VF を VM に渡すと、ホストの仮想スイッチ(OVS など)を通らないので、そこで行う VLAN の制御、QoS、フローによる制御が使えません。VLAN は、PF 側で VF に割り当てます(`ip link set eth2 vf 0 vlan 100`)。
- NIC を switchdev のモードにして OVS のハードウェアオフロードを使うと、VF の通信も OVS のフローで制御できます【要確認】。
- VF を渡した VM は、ライブマイグレーションが難しくなります。
- 速度と、柔軟さや運用のしやすさが、引き換えです。

#### TCP オフロード

オフロードは、通信の処理の一部を、CPU から NIC に任せる機能です。

| 機能 | 動き |
|---|---|
| TSO(TCP Segmentation Offload) | 送信側。大きなデータを、NIC が MTU の大きさに分割する |
| GSO(Generic Segmentation Offload) | TSO の、ソフトウェアで行う版。NIC が非対応でも、できるだけ遅らせて分割する |
| GRO(Generic Receive Offload) | 受信側。小さなパケットをまとめてから、上の層に渡す |
| チェックサムのオフロード | チェックサムの計算を NIC が行う |

```bash
ethtool -k eth0                            # オフロードの機能の一覧(on / off)
ethtool -K eth0 tso off gso off gro off    # 無効にする(切り分けのときなど)
```

- `tcpdump` で、MTU より大きいパケット(例: 64 KB)が見えることがあります。TSO / GSO のため、分割前のパケットを見ているだけで、異常ではありません。
- 通常は有効のままにします。不具合の切り分けや、特別な構成のときだけ無効にします。

#### マルチキューとバッファ

1 つのキューの処理は、1 つの CPU コアに偏ります。キューを複数にして、複数のコアに分けるのが、マルチキューです。

```bash
ethtool -l eth0                            # キュー(チャネル)の数。最大値と現在値
ethtool -L eth0 combined 4                 # 4 キューにする
ethtool -g eth0                            # リングバッファの大きさ
ethtool -G eth0 rx 4096 tx 4096            # リングバッファを大きくする
ethtool -S eth0                            # NIC の統計(rx_dropped、rx_missed など)
ethtool eth0                               # 速度、デュプレックス、リンクの状態
```

- virtio-net(VM の仮想 NIC)で使うには、ホスト側で VM の NIC の定義に `<driver name='vhost' queues='4'/>` を書きます。現在のゲストのカーネルは、既定で、vCPU の数までのキューを使います。数を変えるときや、古いゲストでは、VM の中で `ethtool -L eth0 combined 4` を実行して設定します。キューの数は、VM の vCPU の数までにします。
- パケットの取りこぼし(`rx_dropped` や `rx_missed` が増える)ときは、リングバッファを大きくするか、キューを増やします。バッファを大きくしすぎると、遅延が増えます。
- カーネルの受信バッファは `sysctl net.core.rmem_max`、`net.core.wmem_max`、`net.core.netdev_max_backlog` で調整します。

## 2.2 クラスタ・分散ストレージの理解 (重要度2)

出題範囲: OCFS2、Lustre、DRBD。可用性、一貫性、スケーラビリティ、性能、障害耐性。

### 1. ストレージを複数のサーバーで使う方法

| 種類 | 例 | 考え方 |
|---|---|---|
| 共有ディスク型のクラスタファイルシステム | OCFS2、GFS2 | 1 つの共有ブロックデバイス(SAN、iSCSI)を、複数のサーバーが同時にマウントする |
| ブロックのレプリケーション | DRBD | 2 台以上のサーバーのディスクを、ネットワークでミラーする |
| 並列分散ファイルシステム | Lustre、CephFS | データを多数のサーバーに分散して置く。大規模、高性能 |
| 分散ストレージ | Ceph | データを分散し、複製して持つ。ブロック、ファイル、オブジェクトを提供する |

通常のファイルシステム(ext4、XFS)は、1 台のサーバーだけが使う前提です。2 台が同じディスクに同時に書くと、壊れます。複数台で同時に使うには、ロックを管理する仕組み(クラスタ)が要ります。

### 2. 比べるときの 5 つの観点

| 観点 | 意味 | 例 |
|---|---|---|
| 可用性 | 止まらずに使い続けられるか | 1 台が故障しても、サービスが続く |
| 一貫性 | どこから読んでも、同じ最新のデータが見えるか | 書いた直後に、別のサーバーからも新しい内容が見える |
| スケーラビリティ | 台数を増やして、容量や性能を伸ばせるか | サーバーを足して、容量を増やす(スケールアウト) |
| 性能 | 速度(スループット)と遅延 | 同期の複製は、書き込みの遅延が増える |
| 障害耐性 | 障害が起きたとき、データを失わず、戻せるか | 複製、自己修復、フェンシング |

観点はぶつかり合います。たとえば、複製を同期で行うほど一貫性と障害耐性は上がりますが、書き込みの遅延は増えます。ネットワークが分断されたときに、一貫性を守って止めるか、可用性を守って続けるかは、選ぶ必要があります。

### 3. DRBD

DRBD(Distributed Replicated Block Device)は、2 台のサーバーのブロックデバイスを、ネットワーク越しにリアルタイムでミラーします。「ネットワークの RAID 1」とも説明されます。ファイルシステムの上ではなく、ディスクの下(ブロックの層)で複製するので、どのファイルシステムでも使えます。

```text
node1 (Primary)   : app -> /dev/drbd0 -> /dev/sdb1
                               |
                               |  複製 (TCP。例: 7789。ポートは .res の address に書く)
                               v
node2 (Secondary) : /dev/drbd0 -> /dev/sdb1
```

- 既定の構成では、Primary(読み書きできる側)は 1 台だけです。Secondary は、複製を受け取るだけで、マウントできません。
- Primary が故障したら、Secondary を Primary に昇格(`drbdadm primary`)して、使い続けます。この切り替えは、Pacemaker のようなクラスタの管理ソフトに任せるのが一般的です。
- 両方を Primary にする構成(dual-primary)は、OCFS2 や GFS2 のようなクラスタファイルシステムと組み合わせるときだけ使います。ext4 や XFS のままでは壊れます。
- 複製の方式(プロトコル)は 3 つです。

| プロトコル | 動き | 性質 |
|---|---|---|
| A | 自分のディスクに書き、相手へ送ったら完了 | 非同期。速いが、障害のときに最新の書き込みを失うことがある |
| B | 相手のメモリに届いたら完了 | 半同期 |
| C | 相手のディスクに書き終えたら完了 | 同期。最も安全で、通常はこれを使う |

```bash
# /etc/drbd.d/r0.res に、リソースを書く(両ノードに同じ内容を置く)
drbdadm create-md r0              # メタデータを作る(初回だけ)
drbdadm up r0                     # リソースを起動する
drbdadm primary --force r0        # 最初の 1 台を Primary にする(初回の同期の起点)
drbdadm status r0                 # 状態(Connected、UpToDate など)
```

- DRBD 8.4 は Linux の本体のカーネルにあり、Ubuntu では使えます。RHEL 9 系のカーネルには入っていません【要確認】。DRBD 9 は、どちらも LINBIT などから別に入れます。AlmaLinux / RHEL 9 系では、LINBIT や ELRepo などから入れます 【要確認】。
- ネットワークが切れて、両方のノードが「自分が Primary だ」と思って書くと、データが食い違います(スプリットブレイン)。後で、どちらかのデータを捨てて、同期し直します。防ぐには、フェンシング(STONITH。相手の電源を切って、確実に止める)を組み合わせます。

### 4. OCFS2

OCFS2(Oracle Cluster File System 2)は、共有ディスク型のクラスタファイルシステムです。複数のサーバーが、同じ 1 つのブロックデバイス(SAN、iSCSI、DRBD の dual-primary など)を、同時にマウントして、読み書きできます。

- 同時の書き込みを守るため、DLM(分散ロックマネージャー)で、ロックをサーバー間でやり取りします。
- クラスタに入るサーバーを `/etc/ocfs2/cluster.conf` に書き、`o2cb` のサービスで、ハートビート(生存の確認)を行います。
- ファイルシステムを作るときに、同時に使うサーバーの数(ノードスロット)を決めます。

```bash
mkfs.ocfs2 -N 4 -L shared01 /dev/sdb1     # ノードスロットを 4 にして作る
mount -t ocfs2 /dev/sdb1 /mnt/shared      # すべてのノードで同じようにマウントする
```

- 1 台のサーバーが孤立したら、共有ディスクを壊さないように、そのサーバーは自分を再起動(フェンス)します。
- ロックのやり取りがあるので、1 台専用のファイルシステムより、小さなファイルを多数書く処理は遅くなります。
- Ubuntu では `ocfs2-tools` で入ります。AlmaLinux / RHEL 9 系の標準には含まれません 【要確認】。同じ用途に、RHEL では GFS2(Resilient Storage)を使います 【要確認】。

### 5. Lustre

Lustre は、スーパーコンピューターなど、大規模な計算(HPC)で使われる並列分散ファイルシステムです。1 つのファイルを、多数のサーバーに分割して(ストライプして)置き、多数のクライアントが並列に読み書きして、非常に高い速度を出します。

| 役割 | 内容 |
|---|---|
| MGS | 管理サーバー。設定の情報を持つ |
| MDS / MDT | メタデータ(ファイル名、権限、場所)を持つ |
| OSS / OST | 実際のデータを持つ。OST を増やして、容量と速度を伸ばす |
| クライアント | Lustre をマウントして使う |

```bash
mount -t lustre 192.0.2.1@tcp:/lustrefs /mnt/lustre    # クライアントでマウントする
lfs df -h                                              # OST ごとの使用量
lfs setstripe -c 4 /mnt/lustre/data                    # 4 つの OST に分けて書く
lfs getstripe /mnt/lustre/data/file1                   # ファイルがどの OST にあるか
```

- 大きなファイルの高速な読み書きが得意です。一方、小さなファイルが大量にあると、メタデータのサーバー(MDS)が詰まりやすくなります。
- Lustre 2.11 から、ファイルの単位で複数の OST に複製を持つ FLR(`lfs mirror create`)が使えます。ただし、標準ではファイルは複製されないので、OST の下の RAID や、サーバーの HA(冗長化)を用意します。

## 2.3 Ceph の理解と実装 (重要度4)

出題範囲: RBD、CephFS、RADOS Gateway。CRUSH、配置グループ、プール。レプリケーション、自己修復、MON quorum。OSD、MON、MDS、RGW、MGR。cephadm。/etc/ceph/ceph.conf、ceph.client.*.keyring。ceph status / health / df / osd / mon / pg / auth。/var/log/ceph/ceph.log。rbd map / unmap / showmapped。mount -t ceph、ceph-fuse。radosgw-admin。/etc/fstab。

### 1. Ceph の全体像

Ceph は、多数のサーバーのディスクを集めて、1 つの大きなストレージにするオープンソースの分散ストレージです。複製して持つので、1 台が壊れても、データは残り、通信も続きます。中心は RADOS(Reliable Autonomic Distributed Object Store)で、すべてのデータは、オブジェクトとして RADOS に入ります。その上に、3 つの使い方が載ります。

| 使い方 | 提供するもの | 例 |
|---|---|---|
| RBD(RADOS Block Device) | ブロックデバイス | VM のディスク、`mkfs` してマウントする |
| CephFS | POSIX のファイルシステム | 複数のサーバーから、同じディレクトリを使う |
| RGW(RADOS Gateway) | S3 / Swift 互換のオブジェクトストレージ | バケットにファイルを入れる |

```text
[ rbd / krbd ]   [ mount -t ceph ]   [ S3 / Swift ]
      |                 |                  |
      v                 v                  v
[   RBD    ]    [   CephFS    ]    [    RGW     ]
      |                 |                  |
      +-----------------+------------------+
                        |
                        v
                 [ RADOS ]
                        |
        +---------------+----------------+
        |               |                |
      [OSD]           [MON]          [MGR]
```

MDS は CephFS の部品で、RADOS の外にあります。RADOS のクライアントとして動き、メタデータも OSD に置きます。

### 2. デーモン(サービス)の役割

| デーモン | 役割 | 台数の目安 |
|---|---|---|
| MON(モニター) | クラスタの状態の地図(クラスタマップ)を持つ。多数決で決める | 3 台以上の奇数(3 か 5) |
| OSD | データを保存する。ディスク 1 本に 1 つ。複製、回復、再配置も行う | ディスクの数だけ |
| MGR(マネージャー) | 統計、ダッシュボード、Prometheus への出力、PG の自動調整などをする | 2 台(1 台が稼働、1 台が待機) |
| MDS | CephFS のメタデータ(ファイル名、ディレクトリ、権限)を持つ | CephFS を使うときだけ。待機も置く |
| RGW | S3 / Swift の API を受け付ける | オブジェクトストレージを使うときだけ |

- RBD だけを使うなら、MDS と RGW は要りません。
- MDS は、データそのものは持ちません。データは OSD にあります。

#### MON quorum(クォーラム)

MON は、過半数が互いに通信できているときだけ、クラスタの状態を決められます。この過半数の集まりが quorum です。

| MON の台数 | quorum に必要な台数 | 止まってよい台数 |
|---|---|---|
| 1 | 1 | 0 |
| 3 | 2 | 1 |
| 4 | 3 | 1 |
| 5 | 3 | 2 |

- 偶数にしても、止まってよい台数は増えません(4 台でも 1 台)。奇数にします。
- quorum を失う(過半数が止まる)と、クラスタは新しい状態を決められず、操作が止まります。`ceph status` が応答しなくなります。
- ネットワークが分断されたときも、過半数側だけが動きます。これでスプリットブレインを防ぎます。

### 3. データの置き場所: プール、配置グループ、CRUSH

```text
object "rbd_data.1a2b.0000"  -- ハッシュ --> PG 2.1f (プール 2 の PG 1f)
PG 2.1f                      -- CRUSH --> OSD.3, OSD.7, OSD.9   (3 つの OSD に複製を置く)
```

| 用語 | 意味 |
|---|---|
| プール | データを入れる論理の入れ物。複製の数(size)、PG の数、配置の規則を、プールごとに決める |
| 配置グループ(PG) | オブジェクトをまとめる単位。オブジェクトは、名前のハッシュで PG に割り当てる |
| CRUSH | PG をどの OSD に置くかを、計算で決める仕組み。中央の台帳がなく、誰が計算しても同じ答えになる |
| CRUSH ルール | 障害ドメイン(host、rack など)を指定する。既定は host。同じ PG の複製を、別のホストに置く |

- PG を挟むのは、オブジェクトが数百万あっても、置き場所の管理を PG の数(数百〜数千)で済ませるためです。
- PG の数は、少なすぎると偏り、多すぎると OSD の負荷が増えます。Ceph には、PG の数を自動で調整する `pg_autoscaler` があり、現行の版では、新しいプールで既定で有効です。
- 複製のプール(replicated)は、既定で size 3(3 つ持つ)、min_size 2(2 つ以上生きていれば読み書きできる)です。

```bash
ceph osd pool create mypool                       # プールを作る(PG の数は自動調整に任せる)
ceph osd pool application enable mypool rbd       # 用途を RBD と宣言する
ceph osd pool ls detail                           # size、min_size、pg_num を見る
ceph osd pool set mypool size 3                   # 複製の数を変える
```

#### レプリケーションと自己修復

- 書き込みは、PG の先頭の OSD(primary)が受け取り、ほかの OSD にも複製してから、完了を返します。
- OSD が止まると、そこにあった PG は `degraded`(複製が足りない)になりますが、残りの複製が min_size(既定 2)以上あれば、読み書きは続きます。下回ると、その PG の読み書きは止まります。
- OSD が一定時間(既定で 10 分)戻らないと、`out`(クラスタから外れた扱い)になり、足りない複製が、ほかの OSD に自動で作られます。これが自己修復(リカバリー、リバランス)です。
- 保守のために OSD を止めるときは、`ceph osd set noout` をかけると、自動の再配置が始まりません。終わったら `ceph osd unset noout` で戻します。

### 4. cephadm で入れる

cephadm は、コンテナ(Podman または Docker)で Ceph のデーモンを動かし、管理するコマンドです。現行の Ceph の標準の入れ方です。各ホストに必要なのは、Python 3、systemd、コンテナのエンジン(Podman または Docker)、LVM2、時刻の同期(chrony)です。

```bash
# 最初のホスト(ブートストラップ。MON と MGR ができる)
cephadm bootstrap --mon-ip 192.0.2.11

# 2 台目以降を足す(先に、公開鍵 /etc/ceph/ceph.pub を相手の root に入れる)
ssh-copy-id -f -i /etc/ceph/ceph.pub root@node2
ceph orch host add node2 192.0.2.12

# ディスクを OSD にする
ceph orch device ls                               # 使えるディスクの一覧
ceph orch apply osd --all-available-devices       # 使えるディスクをすべて OSD にする

# デーモンの状態
ceph orch ps                                      # デーモンごとの状態
ceph orch ls                                      # サービスごとの状態
```

- `cephadm bootstrap` は、`/etc/ceph/ceph.conf`(最小の設定)と `/etc/ceph/ceph.client.admin.keyring`(管理者の鍵)を作ります。ダッシュボードの URL と初期の管理者のパスワードも表示します。
- `cephadm shell` で、Ceph のコマンドが入ったコンテナの中に入れます。ホストに `ceph-common` を入れれば、ホストから直接 `ceph` コマンドが使えます。
- ホストの OS は、cephadm が動くものなら、AlmaLinux / RHEL 9 系でも Ubuntu 24.04 でも使えます。対応する OS と版は、Ceph の公式の文書で確かめます 【要確認】。
- 版は、Reef(18 系)と Squid(19 系)を前提にしています。さらに新しい版が出ているので、使う版で手順を確かめます 【要確認】。

### 5. 設定ファイルと鍵

| ファイル | 内容 |
|---|---|
| `/etc/ceph/ceph.conf` | クラスタの fsid(識別子)と、MON のアドレス。クライアントが、クラスタを見つけるために読む |
| `/etc/ceph/ceph.client.admin.keyring` | 管理者(`client.admin`)の鍵。クラスタ全体の権限を持つ |
| `/etc/ceph/ceph.client.<名前>.keyring` | ユーザー `client.<名前>` の鍵 |

```ini
# /etc/ceph/ceph.conf(最小の例)
[global]
        fsid = 8a3d6f0e-0000-4000-8000-000000000000
        mon_host = [v2:192.0.2.11:3300/0,v1:192.0.2.11:6789/0]
```

(`fsid` は、架空の値です。)

- Ceph のクライアントは、`/etc/ceph/ceph.conf` と keyring があれば、クラスタにつながります。keyring は、パスワードにあたる秘密の鍵です。権限を `600` にし、ほかの人に読ませません。
- `client.admin` の鍵は、各クライアントには配りません。必要な権限だけを持つユーザーを作って、その keyring を配ります。

```bash
ceph auth ls                                      # 全ユーザーと権限
ceph auth get client.admin                        # 1 ユーザーの鍵と権限
# RBD 用のユーザー。プール mypool の RBD だけを使える
ceph auth get-or-create client.rbduser mon 'profile rbd' osd 'profile rbd pool=mypool' \
  -o /etc/ceph/ceph.client.rbduser.keyring
chmod 600 /etc/ceph/ceph.client.rbduser.keyring
ceph auth del client.rbduser                      # ユーザーを消す
```

### 6. 状態を確かめるコマンド

| コマンド | 内容 |
|---|---|
| `ceph status`(`ceph -s`) | クラスタ全体の要約。health、MON の quorum、OSD の数、PG の状態、容量 |
| `ceph health detail` | health が OK でない理由を詳しく |
| `ceph df` | 容量。全体(RAW)とプールごとの使用量 |
| `ceph osd tree` | OSD の木(ホストごとの OSD と、up / down、重み) |
| `ceph osd stat` | OSD の数と、up、in の数 |
| `ceph mon stat` / `ceph quorum_status` | MON と quorum の状態 |
| `ceph pg stat` / `ceph pg dump_stuck` | PG の状態、止まっている PG |
| `ceph -w` | イベントを流し続ける(ログの更新) |

health の値は 3 つです。

| 値 | 意味 |
|---|---|
| HEALTH_OK | 問題なし |
| HEALTH_WARN | 警告。OSD の停止、容量の不足の予兆、復旧の途中など |
| HEALTH_ERR | 重大。データが読み書きできない、容量が満杯など |

- 容量の警告は、既定で、85%(nearfull)、90%(backfillfull)、95%(full)です。full になると、書き込みが止まります。
- PG の状態は、`active+clean`(正常)が目標です。`degraded`、`undersized`、`peering`、`recovering` などは、復旧中か異常です。
- ログは、パッケージで入れた構成では `/var/log/ceph/ceph.log`(クラスタ全体のログ)です。cephadm の構成では、既定でログは journald に出ます。デーモンごとのログは `journalctl` や `cephadm logs --name osd.3` で見ます。`log_to_file` と `mon_cluster_log_to_file` を true にすると、`/var/log/ceph/<fsid>/` の下にファイルで出ます。

### 7. 使い方 1: RBD(ブロックデバイス)

```bash
ceph osd pool create mypool
ceph osd pool application enable mypool rbd
rbd pool init mypool                              # RBD 用にプールを初期化する
rbd create mypool/img1 --size 10G                 # イメージを作る
rbd ls mypool                                     # イメージの一覧
rbd info mypool/img1                              # イメージの詳細

# クライアントで(ceph-common を入れ、conf と keyring を置いておく)
rbd map mypool/img1 --id rbduser                  # /dev/rbd0 ができる
rbd showmapped                                    # マップしているイメージの一覧
mkfs.xfs /dev/rbd0
mount /dev/rbd0 /mnt/rbd
umount /mnt/rbd
rbd unmap /dev/rbd0                               # マップを外す
```

- `rbd map` は、カーネルの RBD のクライアント(krbd)を使い、`/dev/rbdN` というデバイスを作ります。`--id` を省くと `client.admin` が使われます。
- マップは、再起動すると消えます。起動時に自動でマップするには、`/etc/ceph/rbdmap` にイメージを書き、`rbdmap.service` を有効にします。マウントは、`/etc/fstab` に `/dev/rbd/mypool/img1 /mnt/rbd xfs noauto 0 0` のように書きます。`noauto` にして、`rbdmap` がマップした後にマウントされるようにします 【要確認】。
- VM のディスクとして使うときは、libvirt や QEMU が librbd で直接つなぐので、`rbd map` は要りません。

### 8. 使い方 2: CephFS

```bash
ceph fs volume create myfs                        # ファイルシステムを作る。MDS も自動で起動する
ceph fs ls
ceph fs authorize myfs client.fsuser / rw         # ユーザーに権限を与える。keyring の内容が出る

# クライアントで(カーネルのクライアント)
mount -t ceph 192.0.2.11:6789:/ /mnt/cephfs -o name=fsuser,secretfile=/etc/ceph/fsuser.secret

# FUSE のクライアント(別のパッケージ ceph-fuse)
ceph-fuse -n client.fsuser /mnt/cephfs
fusermount -u /mnt/cephfs                         # ceph-fuse のマウントを外す
```

- カーネルのクライアントのほうが速いです。`ceph-fuse` は、ユーザー空間で動くので遅いですが、カーネルが古く、必要な機能がないときや、カーネルを更新できないときに使えます。
- `secretfile` には、鍵の文字列だけを書いたファイルを指定します(keyring の全体ではありません)。`name` には、`client.` を付けないユーザー名を書きます。
- 新しい書き方(Quincy 以降)では、`mount -t ceph fsuser@.myfs=/ /mnt/cephfs -o mon_addr=192.0.2.11` のように、ユーザーとファイルシステム名を、マウントの対象を書く欄に書きます。この場合、`/etc/ceph/ceph.conf` と keyring を使います 【要確認】。
- 起動時のマウントは `/etc/fstab` に書きます。ネットワークが使えてからマウントするため、`_netdev` を付けます。

```text
# /etc/fstab
192.0.2.11:6789:/  /mnt/cephfs  ceph  name=fsuser,secretfile=/etc/ceph/fsuser.secret,_netdev,noatime  0 0
```

### 9. 使い方 3: RGW(S3 互換)

```bash
ceph orch apply rgw myrgw                         # RGW のデーモンを起動する
radosgw-admin user create --uid=alice --display-name="Alice"   # S3 のユーザーを作る
radosgw-admin user info --uid=alice               # access_key と secret_key を見る
radosgw-admin user list                           # ユーザーの一覧
radosgw-admin bucket list                         # バケットの一覧
radosgw-admin quota set --quota-scope=user --uid=alice --max-size=10G   # 容量の上限
```

- `user create` の出力の `access_key` と `secret_key` を、S3 のクライアント(`aws s3` コマンドなど)に設定して使います。
- RGW のデーモンは、HTTP(S) で受け付けます。cephadm で入れた RGW は、既定で 80 番で受け付けます。`ceph orch apply rgw myrgw --port 8080` のように変えられます。

### 10. よくある障害と見方

| 症状 | 見るところ | 原因の例 |
|---|---|---|
| `HEALTH_WARN 1 osds down` | `ceph osd tree`、`ceph health detail` | OSD のホストが止まった、ディスクの故障。復旧するか、`out` にして再配置する |
| `HEALTH_WARN ... nearfull` | `ceph df`、`ceph osd df` | 容量の不足、OSD の偏り。ディスクを足す、不要なデータを消す |
| PG が `degraded` / `undersized` | `ceph pg dump_stuck`、`ceph osd tree` | OSD が足りず、複製の数が満たせない(host が 2 台しかなく size 3 など) |
| `ceph status` が応答しない | MON のホストと `systemctl status` | MON が quorum を失った。過半数の MON を戻す |
| `rbd map` が `permission denied` | `ceph auth get client.<名前>` | keyring がない、権限が足りない(`osd` の権限にプールがない) |
| `mount -t ceph` が失敗する | `dmesg`、`ceph fs status` | secret の違い、MDS が動いていない、MON のアドレスの誤り |
