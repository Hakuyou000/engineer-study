# CCNA テキスト 3.0 IP ルーティング(20%)

対象: 200-301 CCNA v2.0

## 3.1 ルーティングテーブルを読み、パケットのネクストホップを特定する

出題範囲: ルーティングプロトコル、プレフィックス/マスク、アドミニストレーティブディスタンス、メトリック、デフォルトルート。

### 1. ルータの転送処理

1. フレームを受信し、FCS を確認して L2 ヘッダを外す
2. あて先 IP アドレスでルーティングテーブルを検索する(**最長一致**)
3. 一致する経路がなければ破棄し、ICMP 宛先到達不能を送信元に返す
4. TTL を 1 減らす。0 になれば破棄し、ICMP 時間超過を返す
5. 出力インターフェースとネクストホップを決め、ネクストホップの MAC アドレスを ARP で解決する
6. 新しい L2 ヘッダ(送信元 MAC = 自分の出力 IF、あて先 MAC = ネクストホップ)を付けて送信する

IP アドレスは変わらない。MAC アドレスはホップごとに変わる。

### 2. ルーティングテーブルの読み方

```
R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
       E1 - OSPF external type 1, E2 - OSPF external type 2
       i - IS-IS, * - candidate default

Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
      10.0.0.0/8 is variably subnetted, 11 subnets, 4 masks    ! 以下は抜粋。ルータ間リンクの C / L は省略
C        10.1.1.0/24 is directly connected, GigabitEthernet0/0
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0
O        10.1.2.0/24 [110/2] via 10.1.12.2, 00:12:35, GigabitEthernet0/1
O        10.1.0.0/16 [110/20] via 10.1.13.3, 00:10:02, GigabitEthernet0/2
S        10.1.2.128/25 [1/0] via 10.1.14.4
D        172.16.0.0/16 [90/3072] via 10.1.12.2, 00:05:11, GigabitEthernet0/1
```

経路1行の構造:

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
| ⑦ | 出力インターフェース |

| コード | 意味 |
|---|---|
| C | 直接接続。インターフェースが up/up で IP アドレスがあると入る |
| L | ローカル。自分のインターフェースのアドレス(/32、IPv6 は /128) |
| S | スタティック |
| S* | スタティックのデフォルトルート |
| O | OSPF エリア内 |
| O IA | OSPF エリア間 |
| O E1 / O E2 | OSPF 外部 |
| O*E2 | OSPF で配布されたデフォルトルート |
| D | EIGRP |
| R | RIP |
| B | BGP |

### 3. 経路選択の2段階

混同しやすい。**テーブルに載せる段階**と、**テーブルを引く段階**を分けて考える。

**段階1: ルーティングテーブルに載せる経路を選ぶ**(同じプレフィックス・同じ長さの経路が複数ある場合)

1. **AD が小さい**情報源を選ぶ
2. 同じプロトコル内では**メトリックが小さい**経路を選ぶ
3. AD もメトリックも同じなら、複数載せて負荷分散する(等コストマルチパス、ECMP)

**段階2: パケットを転送する経路を選ぶ**

- あて先アドレスに一致する経路のうち、**プレフィックスが最も長い**ものを使う(最長一致)
- AD やメトリックは関係ない

> **【ひっかけ】** プレフィックス長が違う経路は別の経路。10.1.2.0/24(OSPF、AD 110)と 10.1.2.128/25(スタティック、AD 1)は両方テーブルに載る。10.1.2.200 あては /25 に一致するのでスタティックを使う。10.1.2.50 あては /24 だけに一致するので OSPF を使う。AD は比較しない。

**例題**(上のテーブルで)

| あて先 | 一致する経路 | 使う経路 | ネクストホップ |
|---|---|---|---|
| 10.1.2.200 | 0.0.0.0/0、10.1.0.0/16、10.1.2.0/24、10.1.2.128/25 | 10.1.2.128/25 | 10.1.14.4 |
| 10.1.2.50 | 0.0.0.0/0、10.1.0.0/16、10.1.2.0/24 | 10.1.2.0/24 | 10.1.12.2 |
| 10.1.9.9 | 0.0.0.0/0、10.1.0.0/16 | 10.1.0.0/16 | 10.1.13.3 |
| 10.1.1.1 | 10.1.1.1/32 ほか | 10.1.1.1/32(自分自身) | — |
| 8.8.8.8 | 0.0.0.0/0 | デフォルトルート | 203.0.113.1 |

### 4. アドミニストレーティブディスタンス(AD)

情報源の信頼度。小さいほど優先。ルータ内部だけの値で、他のルータには伝わらない。

| 情報源 | AD |
|---|---|
| 直接接続 | **0** |
| スタティック | **1** |
| EIGRP 集約 | 5 |
| eBGP | **20** |
| EIGRP(内部) | **90** |
| OSPF | **110** |
| IS-IS | 115 |
| RIP | **120** |
| EIGRP(外部) | 170 |
| iBGP | 200 |
| DHCP で学習したデフォルトルート | 254 |
| 使用不可 | 255 |

### 5. メトリック

同じプロトコル内での経路の優劣。小さいほど優先。

| プロトコル | メトリック |
|---|---|
| RIP | ホップ数(最大 15) |
| OSPF | コスト(帯域幅から計算) |
| EIGRP | 帯域幅と遅延の複合 |
| スタティック、直接接続 | 0 |

### 6. デフォルトルート

- 0.0.0.0/0(IPv6 は ::/0)。プレフィックス長 0 で、すべてのあて先に一致する
- 最長一致で最後に選ばれる(他に一致がないときだけ使う)
- `Gateway of last resort is 203.0.113.1 to network 0.0.0.0` と表示される
- `Gateway of last resort is not set` なら、テーブルにないあて先のパケットは破棄される

```
show ip route 10.1.2.200          ! このあて先に使う経路の詳細
show ip route ospf                ! 情報源で絞る
show ip route static
show ip route connected
show ipv6 route
show ip cef 10.1.2.200            ! 実際の転送情報
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

- 考え方は IPv4 と同じ。最長一致、AD、メトリック
- 動的ルーティングで学習した経路のネクストホップは**リンクローカルアドレス**
- リンクローカルのネットワーク(fe80::/10)自体はテーブルに載らない

> **【3.1 まとめ】**
>
> - 転送は最長一致。AD とメトリックはテーブルに載せるときの基準
> - `[AD/メトリック]`。`via` の後がネクストホップ
> - AD: 直接接続 0、スタティック 1、eBGP 20、EIGRP 90、OSPF 110、RIP 120
> - C は接続ネットワーク、L は自分のアドレス(/32)
> - デフォルトルートは 0.0.0.0/0。他に一致がないときだけ使う
> - IPv6 の動的経路のネクストホップはリンクローカル

## 3.2 IPv4 / IPv6 スタティックルーティングのトラブルシュート

### 1. IPv4 の構文

```
ip route <あて先ネットワーク> <マスク> {<ネクストホップ> | <出力IF> | <出力IF> <ネクストホップ>} [AD]
```

| 指定方法 | 例 | 特徴 |
|---|---|---|
| ネクストホップ(再帰) | `ip route 10.2.0.0 255.255.0.0 10.1.12.2` | ネクストホップへの経路を再度検索する。標準的 |
| 出力インターフェース(直接接続) | `ip route 10.2.0.0 255.255.0.0 Serial0/0/0` | ポイントツーポイントでは可。**イーサネットでは非推奨**(あて先ごとに ARP し、対向のプロキシ ARP に依存する) |
| 両方(完全指定) | `ip route 10.2.0.0 255.255.0.0 g0/1 10.1.12.2` | イーサネットで確実 |

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

マスクは /32。特定の1台あての経路。最長一致で必ず優先される。

### 3.2.d フローティングスタティック

AD を動的ルーティングより大きくしたスタティックルート。主経路がある間はテーブルに載らず、主経路が消えたときだけ載る。バックアップ経路に使う。

```
ip route 10.2.0.0 255.255.0.0 10.1.13.3 130     ! OSPF(110)より大きい AD
ip route 0.0.0.0 0.0.0.0 203.0.113.1            ! 主回線(AD 1)
ip route 0.0.0.0 0.0.0.0 198.51.100.1 5         ! 予備回線
```

| 主経路 | フローティングの AD |
|---|---|
| スタティック(1) | 2 以上 |
| EIGRP(90) | 91 以上 |
| OSPF(110) | 111 以上 |
| RIP(120) | 121 以上 |

### 2. IPv6 の構文

```
ipv6 unicast-routing
ipv6 route <プレフィックス/長さ> {<ネクストホップ> | <出力IF> | <出力IF> <ネクストホップ>} [AD]
```

```
ipv6 route ::/0 2001:db8:12::2                           ! デフォルト
ipv6 route 2001:db8:2::/64 2001:db8:12::2                ! ネットワーク
ipv6 route 2001:db8:2::10/128 2001:db8:12::2             ! ホスト
ipv6 route 2001:db8:2::/64 2001:db8:13::3 130            ! フローティング
ipv6 route 2001:db8:2::/64 GigabitEthernet0/1 fe80::2    ! リンクローカルをネクストホップに
```

> **【ひっかけ】** ネクストホップにリンクローカルアドレスを指定するときは、**出力インターフェースも必ず指定する**。リンクローカルはどのリンクにも同じ範囲が存在し、アドレスだけではどのインターフェースの先か分からない。

### 3. スタティックルートがテーブルに載る条件

| 指定方法 | 載る条件 |
|---|---|
| ネクストホップ | ネクストホップへの経路がテーブルにある(到達可能) |
| 出力インターフェース | そのインターフェースが up/up |
| 両方 | 出力インターフェースが up/up |

`show running-config` に `ip route` があるのに `show ip route` に出ない場合、上の条件を満たしていない。

### 4. トラブルシュート

| 症状 | 原因 |
|---|---|
| 設定したのにテーブルに載らない | ネクストホップが到達不能。出力インターフェースが down |
| 同上 | 同じプレフィックスで AD の小さい別の経路がある(フローティングになっている) |
| ping が `.....` | **戻りの経路**がない。対向ルータにこちらの LAN への経路を設定していない |
| ルータからは通るが LAN のホストからは通らない | 同上。拡張 ping の `source` で確認 |
| 一部のアドレスだけ届かない | マスクの誤り。範囲が狭い(/24 を /25 で設定) |
| 想定と違う経路を通る | より長いプレフィックスの経路がある。ネクストホップのアドレス誤り |
| バックアップが常に使われる / 切り替わらない | フローティングの AD が主経路より小さい / 主経路のネクストホップが落ちてもインターフェースが up で経路が消えない |
| 主回線の障害時に切り替わらない | 主経路がテーブルから消える条件を満たしていない。間にスイッチがあり、インターフェースは up のまま |
| ルーティングループ(traceroute で同じホップの繰り返し、TTL 超過) | 2台のルータが互いをネクストホップに指定している |
| `%Invalid next hop address (it's this router)` | ネクストホップに自分のアドレスを指定した |
| `%Inconsistent address and mask` | ネットワークアドレスとマスクが合わない(`ip route 10.2.2.1 255.255.255.0 …`) |
| IPv6 だけ転送されない | `ipv6 unicast-routing` 未設定 |
| IPv6 のリンクローカル指定でエラー | 出力インターフェースの指定漏れ |
| イーサネットで出力 IF のみ指定し、不安定 | 対向でプロキシ ARP が無効。ネクストホップも指定する |

```
show ip route static
show ip route 10.2.2.2
show running-config | include ip route
show ipv6 route static
show ip interface brief
ping 10.2.2.2 source g0/0
traceroute 10.2.2.2
```

**双方向で考える**: 通信は行きと戻りで別々にルーティングされる。途中の全ルータが、あて先ネットワークと送信元ネットワークの両方への経路を持つ必要がある。

> **【3.2 まとめ】**
>
> - `ip route <net> <mask> <next-hop> [AD]`
> - デフォルト 0.0.0.0 0.0.0.0、ホスト 255.255.255.255(IPv6 は ::/0、/128)
> - フローティングは AD を主経路より大きくする
> - ネクストホップ到達不能、出力 IF down → テーブルに載らない
> - ping が通らないときは戻りの経路を疑う
> - IPv6 のリンクローカルをネクストホップにするなら出力 IF も指定
> - IPv6 は `ipv6 unicast-routing`

## 3.3 シングルエリア OSPFv2(IPv4)と OSPFv3(IPv6)を設定する

### 1. OSPF の概要

| 項目 | 内容 |
|---|---|
| 種別 | リンクステート型の IGP。標準(マルチベンダ) |
| アルゴリズム | SPF(ダイクストラ) |
| メトリック | コスト |
| AD | 110 |
| 転送 | IP プロトコル番号 **89**(TCP / UDP を使わない) |
| マルチキャスト | 224.0.0.5(全 OSPF ルータ)、224.0.0.6(DR / BDR) |
| 更新 | 変化時に差分を通知。30 分ごとに LSA をリフレッシュ |
| 階層 | エリア。バックボーンは**エリア 0** |

**動作の流れ**

1. Hello でネイバーを発見し、隣接関係を作る
2. LSA(リンクステート広告)を交換し、エリア内の全ルータが同じ LSDB(リンクステートデータベース)を持つ
3. 各ルータが LSDB から SPF で最短経路ツリーを計算する
4. 最良経路をルーティングテーブルに載せる

**3つのテーブル**

| テーブル | コマンド |
|---|---|
| ネイバーテーブル | `show ip ospf neighbor` |
| LSDB(トポロジテーブル) | `show ip ospf database` |
| ルーティングテーブル | `show ip route ospf` |

**パケットの種類**

| タイプ | 名前 | 役割 |
|---|---|---|
| 1 | Hello | ネイバーの発見と維持、DR / BDR 選出 |
| 2 | DBD(Database Description) | LSDB の要約を交換 |
| 3 | LSR(Link-State Request) | 不足している LSA を要求 |
| 4 | LSU(Link-State Update) | LSA を送る |
| 5 | LSAck | 受信確認 |

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

1 未満は 1 に切り上げるため、既定では 100 Mbps 以上が区別できない。基準帯域幅を変える。

```
router ospf 1
 auto-cost reference-bandwidth 10000      ! Mbps 単位。10 Gbps を基準に。全ルータで揃える
!
interface GigabitEthernet0/1
 ip ospf cost 50                          ! コストを直接指定
 bandwidth 100000                         ! 帯域幅の値を変える(kbps)。計算に使う値だけが変わる
```

経路のコストは、あて先までの**出力インターフェース**のコストの合計。

### 3. ネイバーの状態

| 状態 | 内容 |
|---|---|
| Down | Hello を受信していない |
| Init | Hello を受信したが、その中に自分のルータ ID がない(片方向) |
| **2-Way** | 互いの Hello に相手のルータ ID がある(双方向)。DR / BDR を選出。DROTHER 同士はここで止まる |
| ExStart | マスター / スレーブを決める |
| Exchange | DBD を交換 |
| Loading | LSR / LSU で不足分を取得 |
| **Full** | LSDB の同期完了 |

### 3.3.a ネイバー隣接(認証を除く)

**隣接が成立する条件**

| 項目 | 条件 |
|---|---|
| サブネット | 同じサブネット、同じマスク |
| エリア ID | 一致 |
| Hello / Dead 間隔 | 一致 |
| ルータ ID | **重複しない** |
| 認証 | 一致(試験範囲外) |
| MTU | 一致。不一致だと ExStart / Exchange で止まる |
| ネットワークタイプ | 整合(不一致でも Full になることがあるが、経路が入らない) |
| スタブフラグ | 一致 |
| パッシブ | どちらもパッシブでない |
| ACL | プロトコル 89、224.0.0.5 を遮断していない |

一致する必要が**ない**もの: プロセス ID、コスト、プライオリティ。

| タイマー | ブロードキャスト、ポイントツーポイント | NBMA |
|---|---|---|
| Hello | 10 秒 | 30 秒 |
| Dead | 40 秒(Hello の 4 倍) | 120 秒 |

```
interface GigabitEthernet0/1
 ip ospf hello-interval 5         ! Dead は自動で 20 になる
 ip ospf dead-interval 20
```

**基本設定(OSPFv2)**

```
router ospf 1                                   ! プロセス ID(1〜65535)。ルータ内だけで意味を持つ
 router-id 1.1.1.1
 network 10.1.1.0 0.0.0.255 area 0              ! ワイルドカードマスク
 network 10.1.12.1 0.0.0.0 area 0               ! インターフェースのアドレスを直接指定
 passive-interface GigabitEthernet0/0           ! Hello を送らない
 passive-interface default                      ! 全 IF をパッシブに
 no passive-interface GigabitEthernet0/1        ! 必要な IF だけ解除
 default-information originate                  ! デフォルトルートを配布
```

```
! インターフェース単位で有効化(network コマンドの代わり)
interface GigabitEthernet0/1
 ip ospf 1 area 0
```

- `network` コマンドは「このアドレス範囲に入るインターフェースで OSPF を有効にする」という意味。そのインターフェースで Hello を送り、そのサブネットを広告する
- **ワイルドカードマスク**: 0 のビットは一致を要求、1 のビットは無視。サブネットマスクの反転(255.255.255.255 − マスク)。/24 → 0.0.0.255、/30 → 0.0.0.3、/26 → 0.0.0.63
- **パッシブインターフェース**: Hello を送受信しない(ネイバーを作らない)が、そのサブネットは広告する。端末だけの LAN に設定する
- `default-information originate`: 自分がデフォルトルートを持っているとき、それを OSPF で配る。`always` を付けると、持っていなくても配る。受け取った側では `O*E2` と表示される

### 3.3.b ポイントツーポイント

- DR / BDR を選出しない。2台のルータが直接 Full になる
- `show ip ospf neighbor` の State は `FULL/  -`
- シリアル(PPP、HDLC)では既定。イーサネットは既定でブロードキャスト
- ルータ2台を直結したイーサネットリンクでは、ポイントツーポイントに変更すると DR 選出の待ち時間がなくなり、LSA も簡素になる

```
interface GigabitEthernet0/1
 ip ospf network point-to-point       ! 両端で設定する
```

### 3.3.c ブロードキャスト(DR / BDR 選出)

イーサネットのようなマルチアクセスネットワークでは、全ルータが互いに Full になると隣接の数が n(n−1)/2 に増える。代表ルータ(DR)とその予備(BDR)を選び、他のルータ(DROTHER)は DR と BDR とだけ Full になる。

**選出の基準**

1. OSPF **プライオリティ**が最大(既定 **1**、範囲 0〜255)
2. 同じなら**ルータ ID** が最大

- プライオリティ **0** は DR / BDR にならない
- **非プリエンプティブ**。DR が決まった後に、より高いプライオリティのルータが参加しても交代しない。DR が落ちたら BDR が DR に昇格し、新たに BDR を選ぶ
- 選出はセグメント(インターフェース)ごと。あるルータが片方のセグメントで DR、別のセグメントで DROTHER ということがある
- 先に起動したルータが DR になりやすい。意図した結果にするには、プライオリティを設定して `clear ip ospf process` するか、起動順を揃える

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

- DROTHER は更新を 224.0.0.6(DR / BDR あて)に送り、DR が 224.0.0.5 で全体に配る

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
| Neighbor ID | 相手のルータ ID |
| Pri | 相手のプライオリティ |
| State | 隣接の状態 / **相手**の役割 |
| Dead Time | 残り時間。Hello を受信するたびに 40 秒に戻る |
| Address | 相手のインターフェースのアドレス |
| Interface | 自分側のインターフェース |

`FULL/DR` は「相手が DR」。`FULL/  -` はポイントツーポイント。

### 3.3.d ルータ ID

OSPF ルータを識別する 32 ビットの値。IPv4 アドレスの形式で書く。

**決定の優先順位**

1. `router-id` コマンドで設定した値
2. up している**ループバック**インターフェースの中で最大の IPv4 アドレス
3. up している物理インターフェースの中で最大の IPv4 アドレス

- ルータ ID は OSPF プロセスの起動時に決まり、後からアドレスを変えても変わらない。反映には `clear ip ospf process`(またはリロード)が要る
- ルータ ID は到達可能なアドレスである必要はない。一意であればよい
- 重複するとネイバーが成立しない、または経路が不安定になる(`%OSPF-4-DUP_RTRID_NBR`)

### 4. 確認コマンド

```
R1# show ip ospf interface brief
Interface    PID   Area    IP Address/Mask    Cost  State Nbrs F/C
Gi0/0        1     0       10.1.1.1/24        1     DR    2/2
Gi0/1        1     0       10.1.12.1/30       1     P2P   1/1
Lo0          1     0       1.1.1.1/32         1     LOOP  0/0
```

`Nbrs F/C` は Full の数 / ネイバーの総数。

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
| `show ip protocols` | プロセス ID、ルータ ID、network 文、パッシブ IF、AD、基準帯域幅 |
| `show ip ospf` | ルータ ID、エリア情報、SPF 実行回数 |
| `show ip ospf neighbor` | ネイバーの状態、相手の役割 |
| `show ip ospf interface [brief]` | エリア、コスト、ネットワークタイプ、タイマー、DR / BDR、プライオリティ |
| `show ip ospf database` | LSDB |
| `show ip route ospf` | OSPF で学習した経路 |

### 5. ネイバーが成立しないときの切り分け

| 状態 | 原因 |
|---|---|
| ネイバーが表示されない | OSPF が IF で無効(network 文の誤り)、パッシブ、L1/L2 の障害、ACL、サブネット・マスク不一致、エリア不一致、Hello/Dead 不一致 |
| Init で止まる | 片方向通信。相手に自分の Hello が届いていない |
| 2-Way のまま | DROTHER 同士なら正常。全ルータのプライオリティが 0 なら DR 不在 |
| ExStart / Exchange で止まる | **MTU 不一致** |
| Full だが経路が入らない | ネットワークタイプ不一致(片側だけ point-to-point) |

ログ: `%OSPF-5-ADJCHG: Process 1, Nbr 2.2.2.2 on GigabitEthernet0/1 from LOADING to FULL, Loading Done`

### 6. OSPFv3(IPv6)

OSPFv3 は IPv6 用の OSPF。アルゴリズム、コスト、エリア、DR / BDR 選出、ネイバーの状態、タイマー、パケットの種類は OSPFv2 と同じ。

| | OSPFv2 | OSPFv3 |
|---|---|---|
| 対象 | IPv4 | IPv6(アドレスファミリ構成では IPv4 も可) |
| 有効化 | `network` コマンドまたはインターフェース | **インターフェース単位のみ**。`network` コマンドはない |
| 送信元アドレス | インターフェースの IPv4 アドレス | **リンクローカルアドレス** |
| マルチキャスト | 224.0.0.5 / 224.0.0.6 | **ff02::5** / **ff02::6** |
| ネクストホップ | IPv4 アドレス | リンクローカルアドレス |
| ルータ ID | 32 ビット | **32 ビット**(IPv4 形式のまま) |
| 動作単位 | サブネット単位 | リンク単位。同一リンクで複数インスタンス可 |
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

**設定(アドレスファミリ方式)**

```
router ospfv3 1
 router-id 1.1.1.1
 address-family ipv6 unicast
  passive-interface GigabitEthernet0/0
!
interface GigabitEthernet0/1
 ospfv3 1 ipv6 area 0
```

> **【ひっかけ】** OSPFv3 でもルータ ID は 32 ビット。ルータに IPv4 アドレスが1つもないと自動で決められず、プロセスが起動しない。`router-id` を手動で設定する。

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

OSPFv3 固有の確認点: `ipv6 unicast-routing` の有無、インターフェースに IPv6 が有効か(リンクローカルがあるか)、ルータ ID が設定されているか、両端のエリアとネットワークタイプ。隣接するインターフェースのグローバルアドレスのプレフィックスが違っても、リンクローカルで通信するためネイバーは成立する。

> **【3.3 まとめ】**
>
> - コスト = 100 Mbps ÷ 帯域幅。`auto-cost reference-bandwidth` は全ルータで揃える
> - 隣接条件: サブネット、エリア、Hello / Dead、MTU が一致。ルータ ID は重複不可。プロセス ID は不一致でよい
> - ルータ ID: `router-id` → ループバック最大 → 物理 IF 最大
> - DR: プライオリティ最大 → ルータ ID 最大。0 は不参加。非プリエンプティブ
> - DROTHER 同士は 2-Way で正常
> - ポイントツーポイントは DR なし。`FULL/  -`
> - Hello 10 / Dead 40。224.0.0.5 / .6。プロトコル 89
> - OSPFv3: IF 単位で有効化、リンクローカル、ff02::5 / ::6、ルータ ID は 32 ビット

## 3.4 ファーストホップ冗長プロトコル(HSRP と VRRP)の動作状態を読み取る

### 1. FHRP の目的

ホストのデフォルトゲートウェイは1つ。そのルータが落ちると外に出られなくなる。FHRP は複数のルータで**仮想 IP アドレス**と**仮想 MAC アドレス**を共有し、ホストには仮想 IP をゲートウェイとして設定する。現用のルータが落ちると、待機のルータが仮想 IP / MAC を引き継ぐ。ホストの設定変更は不要。

切り替え時、新しい現用ルータは Gratuitous ARP を送り、スイッチの MAC テーブルを更新させる。

### 2. 比較

| | HSRP | VRRP | GLBP(参考) |
|---|---|---|---|
| 規格 | Cisco 独自 | 標準(RFC 5798) | Cisco 独自 |
| 役割 | **Active / Standby** | **Master / Backup** | AVG / AVF |
| プライオリティの既定 | 100 | 100 | 100 |
| プライオリティの範囲 | 0〜255 | 1〜254(255 は IP アドレス所有者) | 1〜255 |
| 高いほうが勝つ | ○ | ○ | ○ |
| 同点のとき | IP アドレスが大きいほう | IP アドレスが大きいほう | |
| **プリエンプト** | **既定で無効** | **既定で有効** | 既定で無効 |
| Hello / Hold | 3 秒 / 10 秒 | 広告 1 秒 / マスターダウン約 3 秒 | 3 秒 / 10 秒 |
| マルチキャスト | v1: 224.0.0.2、v2: 224.0.0.102 | 224.0.0.18 | 224.0.0.102 |
| 転送 | UDP 1985 | IP プロトコル 112 | UDP 3222 |
| 仮想 MAC | v1: 0000.0c07.ac**XX**、v2: 0000.0c9f.f**XXX** | 0000.5e00.01**XX** | 0007.b400.XXYY |
| 仮想 IP | 実アドレスとは別のアドレス | 実アドレスと同じでもよい | 別のアドレス |
| 負荷分散 | グループを分けて実現 | グループを分けて実現 | 1グループ内で可能 |

XX はグループ番号の 16 進数。HSRP v1 グループ 10 → 0000.0c07.ac0a。

| | HSRP v1 | HSRP v2 |
|---|---|---|
| グループ番号 | 0〜255 | 0〜4095 |
| マルチキャスト | 224.0.0.2 | 224.0.0.102 |
| IPv6 | 非対応 | 対応 |
| 仮想 MAC | 0000.0c07.acXX | 0000.0c9f.fXXX |

v1 と v2 は互換性がない。

### 3. HSRP の状態

| 状態 | 内容 |
|---|---|
| Initial | 開始直後、インターフェース down |
| Learn | 仮想 IP をまだ知らない |
| Listen | Hello を聞いている。Active でも Standby でもない |
| Speak | Hello を送り、選出に参加 |
| **Standby** | 待機。Active を監視 |
| **Active** | 仮想 IP / MAC あてのパケットを転送 |

グループ内で Active が1台、Standby が1台。3台目以降は Listen。

### 4. 設定(読解のための参考)

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

- **プリエンプト**: 自分のプライオリティのほうが高いとき、現用の役割を奪う機能。HSRP は既定で無効なので、障害から復旧した元の Active は、`preempt` がなければ Standby のままになる
- **トラッキング**: 上流インターフェースや経路の障害を検知してプライオリティを下げる。HSRP の既定の減少値は 10。切り替えるには、相手側に `preempt` が必要で、下げた後の値が相手より低くなければならない

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
| `State is Active` | このルータの状態 |
| `Virtual IP address` | ホストのデフォルトゲートウェイにするアドレス |
| `Active virtual MAC address` | 仮想 MAC。f001 → グループ 1、v2 |
| `Hello time 3 sec, hold time 10 sec` | タイマー |
| `Preemption enabled` | プリエンプトの有無 |
| `Active router is local` | 自分が Active。相手なら相手の実 IP アドレスが出る |
| `Standby router is 192.168.1.3, priority 100` | Standby の実 IP とプライオリティ |
| `Priority 110 (configured 110)` | 現在値(設定値)。トラッキングで下がると `Priority 90 (configured 110)` |

```
R1# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       1    110 P Active  local           192.168.1.3     192.168.1.1
Gi0/1       2    100   Standby 192.168.2.3     local           192.168.2.1
```

`P` の列はプリエンプトが設定されていることを示す。

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

`Own` は IP アドレス所有者(仮想 IP が自分の実アドレス。プライオリティ 255)。`Pre` はプリエンプト。

### 6. 出力から判断する典型問題

| 出力・状況 | 判断 |
|---|---|
| 両方のルータが Active(または Master) | Hello が互いに届いていない。L2 の分断、VLAN 不一致、ACL、バージョン不一致、認証不一致 |
| プライオリティが高いのに Standby | プリエンプト無効。先に相手が Active になった |
| `Priority 90 (configured 110)` | トラッキング対象が down |
| プライオリティは下がったが Active のまま | 相手にプリエンプトがない。または下げた値がまだ相手より高い |
| `Standby router is unknown` | 相手がいない、Hello が届いていない |
| State が Init | インターフェース down |
| ホストから仮想 IP に通らない | ホストのゲートウェイ設定誤り、グループ番号・仮想 IP の不一致 |
| 仮想 MAC が 0000.0c07.ac05 | HSRP v1、グループ 5 |
| 仮想 MAC が 0000.5e00.010a | VRRP、グループ 10 |

> **【3.4 まとめ】**
>
> - HSRP は Cisco 独自で Active / Standby、VRRP は標準で Master / Backup
> - どちらもプライオリティは既定 100、高いほうが勝つ
> - プリエンプトは HSRP 既定で無効、VRRP 既定で有効
> - HSRP: Hello 3 / Hold 10、UDP 1985、v1 は 224.0.0.2、v2 は 224.0.0.102
> - VRRP: 広告 1 秒、224.0.0.18、プロトコル 112
> - 仮想 MAC: HSRP v1 0000.0c07.acXX、v2 0000.0c9f.fXXX、VRRP 0000.5e00.01XX
> - `show standby` の State、Active router、Standby router、Priority、Preemption を読む
