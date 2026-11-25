# CCNA テキスト 3.0 IP ルーティング(20%)

対象: 200-301 CCNA v2.0

ルーターがパケットの送り先を決める仕組みを学びます。ルーティングテーブルの読み方、スタティックルート、OSPF、デフォルトゲートウェイを冗長にする FHRP(HSRP と VRRP)が中心です。

## 3.1 ルーティングテーブルを読み、パケットのネクストホップを特定する

出題範囲: ルーティングプロトコル、プレフィックス/マスク、アドミニストレーティブディスタンス、メトリック、デフォルトルート。

### 1. ルーターの転送の手順

1. フレームを受け取り、FCS(誤り検出の値)を確かめて、L2 ヘッダを外します。
2. あて先の IP アドレスで、ルーティングテーブルを探します(**最長一致**)。
3. 当てはまる経路がなければパケットを捨て、送信元に ICMP の宛先到達不能を返します。
4. TTL を 1 減らします。0 になったら捨てて、ICMP の時間超過を返します。
5. 出ていくインターフェースとネクストホップ(次に渡すルーター)を決め、ネクストホップの MAC アドレスを ARP で調べます。
6. 新しい L2 ヘッダ(送信元 MAC = 自分の出ていくインターフェース、あて先 MAC = ネクストホップ)を付けて送ります。

IP アドレスは変わりません。MAC アドレスは、ルーターを1つ越えるごとに変わります。

PC1 から PC2 まで、ルーターを 2 台越える間に、IP アドレスと MAC アドレスがどう変わるかを示します。

```text
PC1 ---- (1) ---- [R1] ---- (2) ---- [R2] ---- (3) ---- PC2

(1) IP: PC1 -> PC2    MAC: PC1 -> R1
(2) IP: PC1 -> PC2    MAC: R1 -> R2
(3) IP: PC1 -> PC2    MAC: R2 -> PC2
```

IP アドレスは PC1 から PC2 まで同じです(NAT がない場合)。MAC アドレスは、区間ごとに付け替えられます。

### 2. ルーティングテーブルの読み方

```
R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
       E1 - OSPF external type 1, E2 - OSPF external type 2
       i - IS-IS, * - candidate default

Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
      10.0.0.0/8 is variably subnetted, 11 subnets, 4 masks    ! 以下は一部。ルーター同士のリンクの C / L は省略
C        10.1.1.0/24 is directly connected, GigabitEthernet0/0
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0
O        10.1.2.0/24 [110/2] via 10.1.12.2, 00:12:35, GigabitEthernet0/1
O        10.1.0.0/16 [110/20] via 10.1.13.3, 00:10:02, GigabitEthernet0/2
S        10.1.2.128/25 [1/0] via 10.1.14.4
D        172.16.0.0/16 [90/3072] via 10.1.12.2, 00:05:11, GigabitEthernet0/1
```

1行の経路の構造:

```
O   10.1.2.0/24  [110/2]  via 10.1.12.2,  00:12:35,  GigabitEthernet0/1
①   ②            ③ ④       ⑤              ⑥          ⑦
```

| 番号 | 意味 |
|---|---|
| ① | 経路の情報源(コード) |
| ② | あて先のプレフィックス / マスク |
| ③ | アドミニストレーティブディスタンス(AD) |
| ④ | メトリック |
| ⑤ | ネクストホップのアドレス |
| ⑥ | 経路を学習してからの時間 |
| ⑦ | 出ていくインターフェース |

| コード | 意味 |
|---|---|
| C | 直接接続。インターフェースが up/up で IP アドレスがあると登録される |
| L | ローカル。自分のインターフェースのアドレス(/32、IPv6 は /128) |
| S | スタティック |
| S* | スタティックのデフォルトルート |
| O | OSPF のエリアの中の経路 |
| O IA | OSPF のエリアの間の経路 |
| O E1 / O E2 | OSPF の外部の経路 |
| O*E2 | OSPF で配られたデフォルトルート |
| D | EIGRP |
| R | RIP |
| B | BGP |

### 3. 経路の選び方の2つの段階

混同しやすいところです。**テーブルに載せる段階** と、**テーブルを引く段階** を分けて考えます。

**段階1: ルーティングテーブルに載せる経路を選ぶ**(まったく同じプレフィックスと長さの経路が複数ある場合)

1. **AD が小さい** 情報源を選びます。
2. 同じプロトコルの中では、**メトリックが小さい** 経路を選びます。
3. AD もメトリックも同じなら、複数を載せて負荷分散します(等コストマルチパス、ECMP)。

**段階2: パケットを転送する経路を選ぶ**

- あて先のアドレスに当てはまる経路のうち、**プレフィックスが最も長い** ものを使います(最長一致)。
- AD やメトリックは関係ありません。

> **【ひっかけ】** プレフィックスの長さが違う経路は、別の経路です。10.1.2.0/24(OSPF、AD 110)と 10.1.2.128/25(スタティック、AD 1)は、両方ともテーブルに載ります。10.1.2.200 あては /25 に当てはまるのでスタティックを使い、10.1.2.50 あては /24 だけに当てはまるので OSPF を使います。AD は比べません。

**例題**(上のテーブルの場合)

| あて先 | 当てはまる経路 | 使う経路 | ネクストホップ |
|---|---|---|---|
| 10.1.2.200 | 0.0.0.0/0、10.1.0.0/16、10.1.2.0/24、10.1.2.128/25 | 10.1.2.128/25 | 10.1.14.4 |
| 10.1.2.50 | 0.0.0.0/0、10.1.0.0/16、10.1.2.0/24 | 10.1.2.0/24 | 10.1.12.2 |
| 10.1.9.9 | 0.0.0.0/0、10.1.0.0/16 | 10.1.0.0/16 | 10.1.13.3 |
| 10.1.1.1 | 10.1.1.1/32 など | 10.1.1.1/32(自分自身) | — |
| 8.8.8.8 | 0.0.0.0/0 | デフォルトルート | 203.0.113.1 |

### 4. アドミニストレーティブディスタンス(AD)

AD は、経路の情報源の信頼度で、小さいほど優先されます。ルーターの中だけで使う値で、他のルーターには伝わりません。

| 情報源 | AD |
|---|---|
| 直接接続 | **0** |
| スタティック | **1** |
| EIGRP の集約 | 5 |
| eBGP | **20** |
| EIGRP(内部) | **90** |
| OSPF | **110** |
| IS-IS | 115 |
| RIP | **120** |
| EIGRP(外部) | 170 |
| iBGP | 200 |
| DHCP で学習したデフォルトルート | 254 |
| 使えない | 255 |

### 5. メトリック

メトリックは、同じプロトコルの中での経路の良し悪しを表す値で、小さいほど優先されます。

| プロトコル | メトリック |
|---|---|
| RIP | ホップ数(通るルーターの数。最大 15) |
| OSPF | コスト(帯域幅から計算する) |
| EIGRP | 帯域幅と遅延を組み合わせた値 |
| スタティック、直接接続 | 0 |

### 6. デフォルトルート

- 0.0.0.0/0(IPv6 は ::/0)は、プレフィックスの長さが 0 なので、すべてのあて先に当てはまります。
- 最長一致では最後に選ばれます(他に当てはまる経路がないときだけ使われます)。
- `Gateway of last resort is 203.0.113.1 to network 0.0.0.0` と表示されます。
- `Gateway of last resort is not set` なら、テーブルにないあて先のパケットは捨てられます。

```
show ip route 10.1.2.200          ! このあて先に使う経路の詳細
show ip route ospf                ! 情報源で絞り込む
show ip route static
show ip route connected
show ipv6 route
show ip cef 10.1.2.200            ! 実際に転送に使う情報
```

### 7. IPv6 のルーティングテーブル

```
R1# show ipv6 route
C   2001:DB8:1:1::/64 [0/0]
     via GigabitEthernet0/0, directly connected
L   2001:DB8:1:1::1/128 [0/0]
     via GigabitEthernet0/0, receive
S   2001:DB8:2::/64 [1/0]
     via 2001:DB8:12::2
O   2001:DB8:3::/64 [110/2]
     via FE80::2, GigabitEthernet0/1
L   FF00::/8 [0/0]
     via Null0, receive
```

- 考え方は IPv4 と同じです。最長一致、AD、メトリックで選びます。
- ルーティングプロトコルで学習した経路のネクストホップは、**リンクローカルアドレス** になります。
- リンクローカルのネットワーク(fe80::/10)そのものは、テーブルに載りません。

> **【3.1 まとめ】**
>
> - 転送は最長一致で選ぶ。AD とメトリックは、テーブルに載せるときの基準
> - `[AD/メトリック]` の形。`via` の後がネクストホップ
> - AD: 直接接続 0、スタティック 1、eBGP 20、EIGRP 90、OSPF 110、RIP 120
> - C はつながっているネットワーク、L は自分のアドレス(/32)
> - デフォルトルートは 0.0.0.0/0。他に当てはまる経路がないときだけ使う
> - IPv6 のルーティングプロトコルの経路のネクストホップはリンクローカル

## 3.2 IPv4 / IPv6 のスタティックルーティングのトラブルシュート

### 1. IPv4 の書き方

```
ip route <あて先のネットワーク> <マスク> {<ネクストホップ> | <出ていくIF> | <出ていくIF> <ネクストホップ>} [AD]
```

| 指定の方法 | 例 | 特徴 |
|---|---|---|
| ネクストホップ(再帰) | `ip route 10.2.0.0 255.255.0.0 10.1.12.2` | ネクストホップへの経路をもう一度探す。一般的な書き方 |
| 出ていくインターフェース(直接接続) | `ip route 10.2.0.0 255.255.0.0 Serial0/0/0` | ポイントツーポイントならよい。**イーサネットでは推奨されない**(あて先ごとに ARP し、相手のプロキシ ARP に頼るため) |
| 両方(完全な指定) | `ip route 10.2.0.0 255.255.0.0 g0/1 10.1.12.2` | イーサネットで確実 |

### 3.2.a デフォルトルート

```
ip route 0.0.0.0 0.0.0.0 203.0.113.1
```

### 3.2.b ネットワークルート

```
ip route 10.2.0.0 255.255.0.0 10.1.12.2
```

### 3.2.c ホストルート

```
ip route 10.2.2.2 255.255.255.255 10.1.12.2
```

マスクは /32 です。特定の1台あての経路で、最長一致で必ず優先されます。

### 3.2.d フローティングスタティックルート

AD をルーティングプロトコルより大きくしたスタティックルートです。メインの経路がある間はテーブルに載らず、メインの経路が消えたときだけ載ります。バックアップの経路に使います。

```
ip route 10.2.0.0 255.255.0.0 10.1.13.3 130     ! OSPF(110)より大きい AD
ip route 0.0.0.0 0.0.0.0 203.0.113.1            ! メインの回線(AD 1)
ip route 0.0.0.0 0.0.0.0 198.51.100.1 5         ! 予備の回線
```

| メインの経路 | フローティングの AD |
|---|---|
| スタティック(1) | 2 以上 |
| EIGRP(90) | 91 以上 |
| OSPF(110) | 111 以上 |
| RIP(120) | 121 以上 |

### 2. IPv6 の書き方

```
ipv6 unicast-routing
ipv6 route <プレフィックス/長さ> {<ネクストホップ> | <出ていくIF> | <出ていくIF> <ネクストホップ>} [AD]
```

```
ipv6 route ::/0 2001:db8:12::2                           ! デフォルト
ipv6 route 2001:db8:2::/64 2001:db8:12::2                ! ネットワーク
ipv6 route 2001:db8:2::10/128 2001:db8:12::2             ! ホスト
ipv6 route 2001:db8:2::/64 2001:db8:13::3 130            ! フローティング
ipv6 route 2001:db8:2::/64 GigabitEthernet0/1 fe80::2    ! リンクローカルをネクストホップにする
```

> **【ひっかけ】** ネクストホップにリンクローカルアドレスを指定するときは、**出ていくインターフェースも必ず指定します**。リンクローカルアドレスはどのリンクにも同じ範囲があるので、アドレスだけでは、どのインターフェースの先なのかが分からないためです。

### 3. スタティックルートがテーブルに載る条件

| 指定の方法 | 載る条件 |
|---|---|
| ネクストホップ | ネクストホップへの経路がテーブルにある(到達できる) |
| 出ていくインターフェース | そのインターフェースが up/up |
| 両方 | 出ていくインターフェースが up/up |

`show running-config` に `ip route` があるのに `show ip route` に表示されない場合は、この条件を満たしていません。

### 4. トラブルシュート

| 症状 | 原因 |
|---|---|
| 設定したのにテーブルに載らない | ネクストホップに到達できない。出ていくインターフェースが down |
| 同上 | 同じあて先で、AD の小さい別の経路がある(フローティングになっている) |
| ping が `.....` | **戻りの経路** がない。相手のルーターに、こちらの LAN への経路を設定していない |
| ルーターからは通るが、LAN のホストからは通らない | 同上。拡張 ping の `source` で確かめる |
| 一部のアドレスだけ届かない | マスクの誤り。範囲が狭い(/24 にすべきところを /25 にした) |
| 予想と違う経路を通る | もっと長いプレフィックスの経路がある。ネクストホップのアドレスの誤り |
| バックアップがいつも使われる / 切り替わらない | フローティングの AD がメインより小さい / メインのネクストホップが落ちても、インターフェースが up のままで経路が消えない |
| メインの回線の障害で切り替わらない | メインの経路がテーブルから消える条件を満たしていない。間にスイッチがあり、インターフェースは up のまま |
| ルーティングのループ(traceroute で同じホップがくり返される、TTL 超過) | 2台のルーターが、互いを相手のネクストホップに指定している |
| `%Invalid next hop address (it's this router)` | ネクストホップに自分のアドレスを指定した |
| `%Inconsistent address and mask` | ネットワークアドレスとマスクが合わない(`ip route 10.2.2.1 255.255.255.0 …`) |
| IPv6 だけ転送されない | `ipv6 unicast-routing` が設定されていない |
| IPv6 のリンクローカルの指定でエラーになる | 出ていくインターフェースの指定が抜けている |
| イーサネットで出ていくインターフェースだけを指定し、不安定 | 相手でプロキシ ARP が無効。ネクストホップも指定する |

```
show ip route static
show ip route 10.2.2.2
show running-config | include ip route
show ipv6 route static
show ip interface brief
ping 10.2.2.2 source g0/0
traceroute 10.2.2.2
```

**行きと戻りの両方で考える**: 通信は、行きと戻りで別々にルーティングされます。途中のすべてのルーターが、あて先のネットワークと送信元のネットワークの両方への経路を持っている必要があります。

> **【3.2 まとめ】**
>
> - `ip route <ネットワーク> <マスク> <ネクストホップ> [AD]`
> - デフォルトは 0.0.0.0 0.0.0.0、ホストは 255.255.255.255(IPv6 は ::/0 と /128)
> - フローティングは AD をメインの経路より大きくする
> - ネクストホップに到達できない、出ていくインターフェースが down → テーブルに載らない
> - ping が通らないときは、戻りの経路を疑う
> - IPv6 でリンクローカルをネクストホップにするなら、出ていくインターフェースも指定する
> - IPv6 は `ipv6 unicast-routing` が必要

## 3.3 シングルエリアの OSPFv2(IPv4)と OSPFv3(IPv6)を設定する

### 1. OSPF の概要

| 項目 | 内容 |
|---|---|
| 種類 | リンクステート型の IGP(組織の中で使うルーティングプロトコル)。標準規格で、メーカーを問わない |
| アルゴリズム | SPF(ダイクストラ法) |
| メトリック | コスト |
| AD | 110 |
| 運び方 | IP プロトコル番号 **89**(TCP や UDP は使わない) |
| マルチキャスト | 224.0.0.5(すべての OSPF ルーター)、224.0.0.6(DR / BDR) |
| 更新 | 変化があったときに差分を知らせる。30 分ごとに LSA を送り直す |
| 階層 | エリアに分ける。中心(バックボーン)は **エリア 0** |

**動きの流れ**

1. Hello でネイバー(隣のルーター)を見つけ、隣接関係を作ります。
2. LSA(リンクステート広告)を交換し、エリアの中のすべてのルーターが同じ LSDB(リンクステートデータベース。ネットワークの地図)を持ちます。
3. 各ルーターが LSDB から SPF で最短の経路の木を計算します。
4. 最も良い経路をルーティングテーブルに載せます。

**3つのテーブル**

| テーブル | コマンド |
|---|---|
| ネイバーテーブル | `show ip ospf neighbor` |
| LSDB(トポロジテーブル) | `show ip ospf database` |
| ルーティングテーブル | `show ip route ospf` |

**パケットの種類**

| タイプ | 名前 | 役割 |
|---|---|---|
| 1 | Hello | ネイバーを見つけて関係を保つ、DR / BDR を選ぶ |
| 2 | DBD(Database Description) | LSDB の目次を交換する |
| 3 | LSR(Link-State Request) | 足りない LSA を要求する |
| 4 | LSU(Link-State Update) | LSA を送る |
| 5 | LSAck | 受け取ったことを確認する |

2 台のルーターが隣接するまでのパケットの流れを、簡単にして描きます。

```text
   R1                        R2
    |                         |
    |- Hello ---------------->|   ネイバーを見つける
    |<- Hello ----------------|   相手のルーター ID が入っている
    |- DBD ------------------>|   LSDB の目次を交換する
    |<- DBD ------------------|
    |- LSR ------------------>|   足りない LSA を要求する
    |<- LSU ------------------|   LSA を送る
    |- LSAck ---------------->|   受け取ったことを確認する
```

### 2. コスト

```
コスト = 基準帯域幅 ÷ インターフェースの帯域幅(既定の基準帯域幅は 100 Mbps)
```

| インターフェース | 既定のコスト |
|---|---|
| 10 Mbps | 10 |
| 100 Mbps(FastEthernet) | 1 |
| 1 Gbps | 1 |
| 10 Gbps | 1 |
| シリアル(1.544 Mbps) | 64 |
| ループバック | 1 |

1 未満は 1 に切り上げるので、既定のままでは 100 Mbps 以上のリンクを区別できません。基準帯域幅を変更します。

```
router ospf 1
 auto-cost reference-bandwidth 10000      ! Mbps の単位。10 Gbps を基準にする。すべてのルーターで同じにする
!
interface GigabitEthernet0/1
 ip ospf cost 50                          ! コストを直接指定する
 bandwidth 100000                         ! 帯域幅の値を変える(kbps)。計算に使う値だけが変わる
```

経路のコストは、あて先までに通る **出ていくインターフェース** のコストの合計です。

経路のコストの数え方です。数字は説明のための例です。

```text
[R1] -(Gi0/1: 10)-> [R2] -(Gi0/1: 20)-> [R3] -(Gi0/2: 1)-> [10.9.9.0/24]
```

R1 から見た 10.9.9.0/24 までのコストは、10 + 20 + 1 = 31 です。

### 3. ネイバーの状態

| 状態 | 内容 |
|---|---|
| Down | Hello を受け取っていない |
| Init | Hello を受け取ったが、その中に自分のルーター ID がない(片方向) |
| **2-Way** | 互いの Hello に相手のルーター ID がある(双方向)。DR / BDR を選ぶ。DROTHER 同士はここで止まる |
| ExStart | マスターとスレーブを決める |
| Exchange | DBD を交換する |
| Loading | LSR / LSU で足りない分を取得する |
| **Full** | LSDB の同期が終わった |

ネイバーの状態が進む順番です。

```text
Down -> Init -> 2-Way -> ExStart -> Exchange -> Loading -> Full
                  |
                  +-- DROTHER 同士は、ここで止まる(正常)
```

### 3.3.a ネイバーとの隣接(認証を除く)

**隣接が成立する条件**

| 項目 | 条件 |
|---|---|
| サブネット | 同じサブネットで、同じマスク |
| エリア ID | 一致する |
| Hello / Dead の間隔 | 一致する |
| ルーター ID | **重複しない** |
| 認証 | 一致する(試験の範囲外) |
| MTU | 一致する。一致しないと ExStart / Exchange で止まる |
| ネットワークタイプ | 合っている(一致しなくても Full になることがあるが、経路が入らない) |
| スタブのフラグ | 一致する |
| パッシブ | どちらもパッシブではない |
| ACL | プロトコル 89 や 224.0.0.5 を遮断していない |

一致する必要が **ない** もの: プロセス ID、コスト、プライオリティ。

| タイマー | ブロードキャスト、ポイントツーポイント | NBMA |
|---|---|---|
| Hello | 10 秒 | 30 秒 |
| Dead | 40 秒(Hello の4倍) | 120 秒 |

```
interface GigabitEthernet0/1
 ip ospf hello-interval 5         ! Dead は自動で 20 になる
 ip ospf dead-interval 20
```

**基本の設定(OSPFv2)**

```
router ospf 1                                   ! プロセス ID(1〜65535)。そのルーターの中だけで使う番号
 router-id 1.1.1.1
 network 10.1.1.0 0.0.0.255 area 0              ! ワイルドカードマスクで書く
 network 10.1.12.1 0.0.0.0 area 0               ! インターフェースのアドレスを直接指定する
 passive-interface GigabitEthernet0/0           ! Hello を送らない
 passive-interface default                      ! すべてのインターフェースをパッシブにする
 no passive-interface GigabitEthernet0/1        ! 必要なインターフェースだけ解除する
 default-information originate                  ! デフォルトルートを配る
```

```
! インターフェースごとに有効にする(network コマンドの代わり)
interface GigabitEthernet0/1
 ip ospf 1 area 0
```

- `network` コマンドは「このアドレスの範囲に入るインターフェースで OSPF を有効にする」という意味です。そのインターフェースで Hello を送り、そのサブネットを広告します。
- **ワイルドカードマスク**: 0 のビットは一致が必要、1 のビットは無視という意味です。サブネットマスクを反転したもの(255.255.255.255 − マスク)で、/24 → 0.0.0.255、/30 → 0.0.0.3、/26 → 0.0.0.63 です。
- **パッシブインターフェース**: Hello を送受信しない(ネイバーを作らない)が、そのサブネットは広告します。端末しかいない LAN に設定します。
- `default-information originate`: 自分がデフォルトルートを持っているときに、それを OSPF で配ります。`always` を付けると、持っていなくても配ります。受け取った側では `O*E2` と表示されます。

### 3.3.b ポイントツーポイント

- DR / BDR を選びません。2台のルーターが直接 Full になります。
- `show ip ospf neighbor` の State は `FULL/  -` と表示されます。
- シリアル(PPP、HDLC)では既定でこのタイプです。イーサネットは既定でブロードキャストです。
- ルーター2台を直接つないだイーサネットのリンクでは、ポイントツーポイントに変えると、DR を選ぶ待ち時間がなくなり、LSA も簡単になります。

```
interface GigabitEthernet0/1
 ip ospf network point-to-point       ! 両端で設定する
```

### 3.3.c ブロードキャスト(DR / BDR の選び方)

イーサネットのように多数の機器がつながるネットワークで、すべてのルーターが互いに Full になると、隣接の数が n(n−1)/2 に増えてしまいます。そこで代表のルーター(DR)とその予備(BDR)を選び、他のルーター(DROTHER)は DR と BDR とだけ Full になります。

**選ぶ基準**

1. OSPF の **プライオリティ** が最も大きい(既定は **1**、範囲は 0〜255)
2. 同じなら、**ルーター ID** が最も大きい

- プライオリティが **0** のルーターは、DR にも BDR にもなりません。
- **後から交代しません**(非プリエンプティブ)。DR が決まった後に、もっと高いプライオリティのルーターが加わっても交代しません。DR が落ちたら BDR が DR になり、新しい BDR を選びます。
- 選ぶのはセグメント(インターフェース)ごとです。あるルーターが、片方のセグメントでは DR、別のセグメントでは DROTHER ということがあります。
- 先に起動したルーターが DR になりやすいです。思いどおりにするには、プライオリティを設定して `clear ip ospf process` するか、起動の順番をそろえます。

```
interface GigabitEthernet0/0
 ip ospf priority 255        ! DR にしたい
!
interface GigabitEthernet0/0
 ip ospf priority 0          ! DR / BDR にしない
```

| 自分 | 相手 | 関係 |
|---|---|---|
| DROTHER | DR / BDR | Full |
| DROTHER | DROTHER | **2-Way**(正常) |
| DR | BDR | Full |

- DROTHER は更新を 224.0.0.6(DR / BDR あて)に送り、DR が 224.0.0.5 で全員に配ります。

```
R3# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
1.1.1.1           1   FULL/DR         00:00:35    10.1.1.1        GigabitEthernet0/0
2.2.2.2           1   FULL/BDR        00:00:33    10.1.1.2        GigabitEthernet0/0
4.4.4.4           1   2WAY/DROTHER    00:00:38    10.1.1.4        GigabitEthernet0/0
5.5.5.5           0   FULL/  -        00:00:31    10.1.35.5       GigabitEthernet0/1
```

| 列 | 意味 |
|---|---|
| Neighbor ID | 相手のルーター ID |
| Pri | 相手のプライオリティ |
| State | 隣接の状態 / **相手** の役割 |
| Dead Time | 残りの時間。Hello を受け取るたびに 40 秒に戻る |
| Address | 相手のインターフェースのアドレス |
| Interface | 自分側のインターフェース |

`FULL/DR` は「相手が DR」という意味です。`FULL/  -` はポイントツーポイントです。

### 3.3.d ルーター ID

OSPF のルーターを見分けるための 32 ビットの値で、IPv4 アドレスの形で書きます。

**決まる順番**

1. `router-id` コマンドで設定した値
2. up しているループバックインターフェースの中で、最も大きい IPv4 アドレス
3. up している物理インターフェースの中で、最も大きい IPv4 アドレス

- ルーター ID は OSPF のプロセスが起動したときに決まり、後でアドレスを変えても変わりません。反映するには `clear ip ospf process`(または再起動)が必要です。
- ルーター ID は、到達できるアドレスである必要はありません。他と重複しなければかまいません。
- 重複するとネイバーが成立しないか、経路が不安定になります(`%OSPF-4-DUP_RTRID_NBR`)。

### 4. 確認のコマンド

```
R1# show ip ospf interface brief
Interface    PID   Area    IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0       10.1.1.1/24        1     DR    2/2
Gi0/1        1     0       10.1.12.1/30       1     P2P   1/1
Lo0          1     0       1.1.1.1/32         1     LOOP  0/0
```

`Nbrs F/C` は「Full の数 / ネイバーの総数」です。

```
R1# show ip ospf interface g0/0
GigabitEthernet0/0 is up, line protocol is up
  Internet Address 10.1.1.1/24, Area 0
  Process ID 1, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1
  Transmit Delay is 1 sec, State DR, Priority 1
  Designated Router (ID) 1.1.1.1, Interface address 10.1.1.1
  Backup Designated router (ID) 2.2.2.2, Interface address 10.1.1.2
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
```

| コマンド | 確認できること |
|---|---|
| `show ip protocols` | プロセス ID、ルーター ID、network の行、パッシブのインターフェース、AD、基準帯域幅 |
| `show ip ospf` | ルーター ID、エリアの情報、SPF を計算した回数 |
| `show ip ospf neighbor` | ネイバーの状態、相手の役割 |
| `show ip ospf interface [brief]` | エリア、コスト、ネットワークタイプ、タイマー、DR / BDR、プライオリティ |
| `show ip ospf database` | LSDB |
| `show ip route ospf` | OSPF で学習した経路 |

### 5. ネイバーが成立しないときの絞り込み

| 状態 | 原因 |
|---|---|
| ネイバーが表示されない | そのインターフェースで OSPF が無効(network の行の誤り)、パッシブ、L1/L2 の障害、ACL、サブネットやマスクの不一致、エリアの不一致、Hello/Dead の不一致 |
| Init で止まる | 片方向の通信。相手に自分の Hello が届いていない |
| 2-Way のまま | DROTHER 同士なら正常。すべてのルーターのプライオリティが 0 なら、DR がいない |
| ExStart / Exchange で止まる | **MTU の不一致** |
| Full だが経路が入らない | ネットワークタイプの不一致(片方だけ point-to-point) |

ログの例: `%OSPF-5-ADJCHG: Process 1, Nbr 2.2.2.2 on GigabitEthernet0/1 from LOADING to FULL, Loading Done`

### 6. OSPFv3(IPv6)

OSPFv3 は IPv6 用の OSPF です。アルゴリズム、コスト、エリア、DR / BDR の選び方、ネイバーの状態、タイマー、パケットの種類は OSPFv2 と同じです。

| | OSPFv2 | OSPFv3 |
|---|---|---|
| 対象 | IPv4 | IPv6(アドレスファミリの方式では IPv4 も扱える) |
| 有効にする方法 | `network` コマンドかインターフェース | **インターフェースごとだけ**。`network` コマンドはない |
| 送信元のアドレス | インターフェースの IPv4 アドレス | **リンクローカルアドレス** |
| マルチキャスト | 224.0.0.5 / 224.0.0.6 | **ff02::5** / **ff02::6** |
| ネクストホップ | IPv4 アドレス | リンクローカルアドレス |
| ルーター ID | 32 ビット | **32 ビット**(IPv4 の形のまま) |
| 動く単位 | サブネットごと | リンクごと。同じリンクで複数のインスタンスを動かせる |
| 認証 | OSPF 独自 | IPsec |
| プロトコル番号 | 89 | 89 |

**設定(従来の方式)**

```
ipv6 unicast-routing
!
ipv6 router ospf 1
 router-id 1.1.1.1
 passive-interface GigabitEthernet0/0
 default-information originate
!
interface GigabitEthernet0/1
 ipv6 address 2001:db8:12::1/64
 ipv6 ospf 1 area 0
 ipv6 ospf network point-to-point
```

**設定(アドレスファミリの方式)**

```
router ospfv3 1
 router-id 1.1.1.1
 address-family ipv6 unicast
  passive-interface GigabitEthernet0/0
!
interface GigabitEthernet0/1
 ospfv3 1 ipv6 area 0
```

> **【ひっかけ】** OSPFv3 でも、ルーター ID は 32 ビットです。ルーターに IPv4 アドレスが1つもないと自動で決められず、プロセスが起動しません。`router-id` を手動で設定します。

```
R1# show ipv6 ospf neighbor

Neighbor ID     Pri   State           Dead Time   Interface ID    Interface
2.2.2.2           1   FULL/  -        00:00:36    4               GigabitEthernet0/1

R1# show ipv6 route ospf
O   2001:DB8:2::/64 [110/2]
     via FE80::2, GigabitEthernet0/1
```

| OSPFv2 | OSPFv3 |
|---|---|
| `show ip ospf neighbor` | `show ipv6 ospf neighbor` / `show ospfv3 neighbor` |
| `show ip ospf interface brief` | `show ipv6 ospf interface brief` / `show ospfv3 interface brief` |
| `show ip route ospf` | `show ipv6 route ospf` |
| `show ip protocols` | `show ipv6 protocols` |
| `clear ip ospf process` | `clear ipv6 ospf process` |

OSPFv3 で特に確認する点: `ipv6 unicast-routing` があるか、インターフェースで IPv6 が有効か(リンクローカルアドレスがあるか)、ルーター ID が設定されているか、両端のエリアとネットワークタイプ。隣り合うインターフェースのグローバルアドレスのプレフィックスが違っても、リンクローカルアドレスで通信するので、ネイバーは成立します。

> **【3.3 まとめ】**
>
> - コスト = 100 Mbps ÷ 帯域幅。`auto-cost reference-bandwidth` はすべてのルーターで同じにする
> - 隣接の条件: サブネット、エリア、Hello / Dead、MTU が一致する。ルーター ID は重複してはいけない。プロセス ID は違ってよい
> - ルーター ID: `router-id` → ループバックの最大 → 物理インターフェースの最大
> - DR: プライオリティが最大 → ルーター ID が最大。0 は参加しない。後から交代しない
> - DROTHER 同士は 2-Way で正常
> - ポイントツーポイントは DR がいない。`FULL/  -`
> - Hello 10 / Dead 40。224.0.0.5 / .6。プロトコル 89
> - OSPFv3: インターフェースごとに有効にする、リンクローカル、ff02::5 / ::6、ルーター ID は 32 ビット

## 3.4 ファーストホップ冗長プロトコル(HSRP と VRRP)の動作の状態を読み取る

### 1. FHRP の目的

ホストのデフォルトゲートウェイは1つです。そのルーターが止まると、外に出られなくなります。FHRP では、複数のルーターで **仮想 IP アドレス** と **仮想 MAC アドレス** を共有し、ホストには仮想 IP アドレスをゲートウェイとして設定します。今動いているルーターが止まると、待機しているルーターが仮想 IP / MAC を引き継ぎます。ホストの設定を変える必要はありません。

切り替わるとき、新しく動くルーターは Gratuitous ARP を送り、スイッチの MAC アドレステーブルを更新させます。

PC は、仮想 IP アドレスをデフォルトゲートウェイにしています。ルーターが止まったときの切り替わりを、前後で比べます。

```text
通常時
PC --- [SW] --+-- [R1] Active     <- 仮想 IP / MAC あてのパケットを転送する
              +-- [R2] Standby    <- Active を見張る

R1 が止まったとき
PC --- [SW] --+-- [R1] down
              +-- [R2] Active     <- 仮想 IP / MAC を引き継ぐ
```

### 2. 比較

| | HSRP | VRRP | GLBP(参考) |
|---|---|---|---|
| 規格 | Cisco 独自 | 標準(RFC 5798) | Cisco 独自 |
| 役割 | **Active / Standby** | **Master / Backup** | AVG / AVF |
| プライオリティの既定 | 100 | 100 | 100 |
| プライオリティの範囲 | 0〜255 | 1〜254(255 は IP アドレスの所有者) | 1〜255 |
| 高いほうが勝つ | はい | はい | はい |
| 同じ値のとき | IP アドレスが大きいほう | IP アドレスが大きいほう | |
| **プリエンプト** | **既定で無効** | **既定で有効** | 既定で無効 |
| Hello / Hold | 3 秒 / 10 秒 | 広告 1 秒 / マスターダウン約 3 秒 | 3 秒 / 10 秒 |
| マルチキャスト | v1 は 224.0.0.2、v2 は 224.0.0.102 | 224.0.0.18 | 224.0.0.102 |
| 運び方 | UDP 1985 | IP プロトコル 112 | UDP 3222 |
| 仮想 MAC | v1 は 0000.0c07.ac**XX**、v2 は 0000.0c9f.f**XXX** | 0000.5e00.01**XX** | 0007.b400.XXYY |
| 仮想 IP | 実際のアドレスとは別のアドレス | 実際のアドレスと同じでもよい | 別のアドレス |
| 負荷分散 | グループを分けて実現する | グループを分けて実現する | 1つのグループの中でできる |

XX はグループ番号の 16 進数です。HSRP v1 のグループ 10 なら 0000.0c07.ac0a になります。

| | HSRP v1 | HSRP v2 |
|---|---|---|
| グループ番号 | 0〜255 | 0〜4095 |
| マルチキャスト | 224.0.0.2 | 224.0.0.102 |
| IPv6 | 対応していない | 対応している |
| 仮想 MAC | 0000.0c07.acXX | 0000.0c9f.fXXX |

v1 と v2 には互換性がありません。

### 3. HSRP の状態

| 状態 | 内容 |
|---|---|
| Initial | 始めたばかり、またはインターフェースが down |
| Learn | 仮想 IP をまだ知らない |
| Listen | Hello を聞いている。Active でも Standby でもない |
| Speak | Hello を送り、役割の選出に参加している |
| **Standby** | 待機している。Active を見張っている |
| **Active** | 仮想 IP / MAC あてのパケットを転送している |

1つのグループの中で、Active が1台、Standby が1台です。3台目以降は Listen になります。

### 4. 設定(読み取りのための参考)

```
! HSRP
interface GigabitEthernet0/0
 ip address 192.168.1.2 255.255.255.0
 standby version 2
 standby 1 ip 192.168.1.1
 standby 1 priority 110
 standby 1 preempt
 standby 1 track 1 decrement 20
!
! VRRP
interface GigabitEthernet0/0
 ip address 192.168.1.2 255.255.255.0
 vrrp 1 ip 192.168.1.1
 vrrp 1 priority 110
```

- **プリエンプト**: 自分のプライオリティのほうが高いときに、今動いている役割を取り戻す機能です。HSRP は既定で無効なので、障害から復旧した元の Active ルーターは、`preempt` がなければ Standby のままです。
- **トラッキング**: 上流のインターフェースや経路の障害を見つけて、プライオリティを下げる機能です。HSRP の既定の下げ幅は 10 です。切り替えるには、相手側に `preempt` があり、下げた後の値が相手より低くなる必要があります。

### 5. 出力の読み取り

```
R1# show standby
GigabitEthernet0/0 - Group 1 (version 2)
  State is Active
    2 state changes, last state change 00:05:12
  Virtual IP address is 192.168.1.1
  Active virtual MAC address is 0000.0c9f.f001 (MAC In Use)
    Local virtual MAC address is 0000.0c9f.f001 (v2 default)
  Hello time 3 sec, hold time 10 sec
    Next hello sent in 1.264 secs
  Preemption enabled
  Active router is local
  Standby router is 192.168.1.3, priority 100 (expires in 9.120 sec)
  Priority 110 (configured 110)
    Track object 1 state Up decrement 20
  Group name is "hsrp-Gi0/0-1" (default)
```

| 行 | 読み取ること |
|---|---|
| `Group 1 (version 2)` | グループ番号とバージョン |
| `State is Active` | このルーターの状態 |
| `Virtual IP address` | ホストのデフォルトゲートウェイにするアドレス |
| `Active virtual MAC address` | 仮想 MAC。f001 はグループ 1、v2 |
| `Hello time 3 sec, hold time 10 sec` | タイマー |
| `Preemption enabled` | プリエンプトの有無 |
| `Active router is local` | 自分が Active。相手なら、相手の実際の IP アドレスが表示される |
| `Standby router is 192.168.1.3, priority 100` | Standby の実際の IP アドレスとプライオリティ |
| `Priority 110 (configured 110)` | 今の値(設定した値)。トラッキングで下がると `Priority 90 (configured 110)` になる |

```
R1# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       1    110 P Active  local           192.168.1.3     192.168.1.1
Gi0/1       2    100   Standby 192.168.2.3     local           192.168.2.1
```

`P` の列は、プリエンプトが設定されていることを表します。

```
R1# show vrrp brief
Interface   Grp Pri Time  Own Pre State   Master addr     Group addr
Gi0/0       1   110 3570       Y  Master  192.168.1.2     192.168.1.1

R1# show vrrp
GigabitEthernet0/0 - Group 1
  State is Master
  Virtual IP address is 192.168.1.1
  Virtual MAC address is 0000.5e00.0101
  Advertisement interval is 1.000 sec
  Preemption enabled
  Priority is 110
  Master Router is 192.168.1.2 (local), priority is 110
  Master Advertisement interval is 1.000 sec
  Master Down interval is 3.570 sec
```

`Own` は IP アドレスの所有者(仮想 IP が自分の実際のアドレスで、プライオリティは 255)、`Pre` はプリエンプトを表します。

### 6. 出力から判断するよくある問題

| 出力・状況 | 判断 |
|---|---|
| 両方のルーターが Active(または Master) | Hello が互いに届いていない。L2 の分断、VLAN の不一致、ACL、バージョンの不一致、認証の不一致 |
| プライオリティが高いのに Standby | プリエンプトが無効で、先に相手が Active になった |
| `Priority 90 (configured 110)` | トラッキングで見張っている対象が down |
| プライオリティは下がったが Active のまま | 相手にプリエンプトがない。または、下げた値がまだ相手より高い |
| `Standby router is unknown` | 相手がいない、Hello が届いていない |
| State が Init | インターフェースが down |
| ホストから仮想 IP に通らない | ホストのゲートウェイの設定の誤り、グループ番号や仮想 IP の不一致 |
| 仮想 MAC が 0000.0c07.ac05 | HSRP v1、グループ 5 |
| 仮想 MAC が 0000.5e00.010a | VRRP、グループ 10 |

> **【3.4 まとめ】**
>
> - HSRP は Cisco 独自で Active / Standby、VRRP は標準規格で Master / Backup
> - どちらもプライオリティの既定は 100 で、高いほうが勝つ
> - プリエンプトは HSRP では既定で無効、VRRP では既定で有効
> - HSRP: Hello 3 / Hold 10、UDP 1985、v1 は 224.0.0.2、v2 は 224.0.0.102
> - VRRP: 広告は 1 秒、224.0.0.18、プロトコル 112
> - 仮想 MAC: HSRP v1 は 0000.0c07.acXX、v2 は 0000.0c9f.fXXX、VRRP は 0000.5e00.01XX
> - `show standby` の State、Active router、Standby router、Priority、Preemption を読む
