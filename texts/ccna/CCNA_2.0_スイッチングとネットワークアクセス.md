# CCNA テキスト 2.0 スイッチングとネットワークアクセス(25%)

対象: 200-301 CCNA v2.0

スイッチの基本の動き、VLAN とトランク、EtherChannel、端末をつなぐポートの設定、CDP / LLDP、問題の調べ方、STP(Rapid PVST+)を学びます。

## 2.0 前提: スイッチの基本の動き

### 1. フレームの転送

スイッチは、受け取ったフレームの **送信元 MAC アドレス** を見て MAC アドレステーブルに覚え(学習)、**あて先 MAC アドレス** を見て送り先のポートを決めます。

| 動作 | 条件 |
|---|---|
| 学習(learning) | 送信元の MAC アドレスと、受け取ったポートと VLAN を記録する |
| フラッディング | あて先をまだ覚えていないユニキャスト、ブロードキャスト、(既定では)マルチキャスト → 受け取ったポート以外の、同じ VLAN のすべてのポートへ送る |
| 転送(forwarding) | あて先を覚えている → そのポートだけに送る |
| フィルタリング | あて先が受け取ったポートと同じポートにいる → 捨てる |
| エージング | 既定では 300 秒通信がなければ、記録を消す |

3 台がつながったスイッチで、学習とフラッディングを追います。MAC アドレスは a、b、c と略します。

```text
PC-A (MAC a) --- Gi0/1 [SW1] Gi0/2 --- PC-B (MAC b)
                         |
                       Gi0/3
                         |
                  PC-C (MAC c)

(1) PC-A が PC-B あてに最初のフレームを送る。あて先 b は未学習
    SW1: Gi0/1 に a がいると学習する。Gi0/2 と Gi0/3 の両方へ送る(フラッディング)
(2) PC-B が PC-A へ返す。あて先 a は学習済み
    SW1: Gi0/2 に b がいると学習する。Gi0/1 だけへ送る(転送)
```

```
Switch# show mac address-table
          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0c1a.2b3c.4d01    DYNAMIC     Gi0/1
  10    0c1a.2b3c.4d02    DYNAMIC     Gi0/2
  20    0c1a.2b3c.4d03    STATIC      Gi0/3
```

```
show mac address-table dynamic
show mac address-table interface g0/1
show mac address-table address 0c1a.2b3c.4d01
show mac address-table count
clear mac address-table dynamic
```

### 2. ドメイン

| | 分ける機器 |
|---|---|
| コリジョンドメイン(衝突が起きる範囲) | スイッチの各ポート、ルーター。ハブは分けない |
| ブロードキャストドメイン(ブロードキャストが届く範囲) | ルーター(L3 インターフェース)、VLAN。スイッチは既定では分けない |

### 3. イーサネットのフレーム

| フィールド | 長さ | 内容 |
|---|---|---|
| プリアンブル + SFD | 7 + 1 バイト | 同期のための信号 |
| あて先 MAC | 6 | |
| 送信元 MAC | 6 | |
| (802.1Q タグ) | 4 | トランクの上だけで付く |
| タイプ | 2 | 0x0800 は IPv4、0x0806 は ARP、0x86DD は IPv6 |
| データ | 46〜1500 | MTU は 1500 |
| FCS | 4 | CRC による誤りの検出 |

MAC アドレスは 48 ビットで、前半の 24 ビットは OUI(メーカーの番号)です。ブロードキャストのアドレスは ffff.ffff.ffff です。

## 2.1 ネットワーク機器の間の接続を設定する

### 2.1.a L2 / L3 の物理インターフェース

| | L2 ポート(スイッチポート) | L3 ポート(ルーテッドポート) |
|---|---|---|
| 設定 | `switchport`(L2 スイッチの既定) | `no switchport` |
| IP アドレス | 持たない | 持つ |
| VLAN | 所属する | 所属しない |
| STP | 動く | 動かない |
| 用途 | ホストの接続、スイッチ同士 | L3 スイッチ同士、ルーターとの接続 |

```
! L3 スイッチのルーテッドポート
ip routing
interface GigabitEthernet1/0/1
 no switchport
 ip address 10.0.0.1 255.255.255.252
 no shutdown
```

```
! ルーターの物理インターフェース(いつも L3)
interface GigabitEthernet0/0
 description To-SW1
 ip address 10.0.0.2 255.255.255.252
 no shutdown
```

- ルーターのインターフェースは、最初は shutdown になっています。スイッチのポートは、最初から有効です。
- L3 スイッチでルーティングするには、`ip routing` が必要です。
- `interface range g0/1 - 4` で、複数のポートをまとめて設定できます。

### VLAN の基礎

VLAN は、スイッチの中でブロードキャストドメインを論理的に分ける仕組みです。異なる VLAN の間で通信するには、L3 の機器(ルーターや L3 スイッチ)が必要です。

| VLAN ID | 区分 |
|---|---|
| 1 | デフォルト VLAN。削除できない。すべてのポートが最初に所属する |
| 2〜1001 | 標準の範囲。作成・削除できる |
| 1002〜1005 | FDDI / Token Ring 用に予約されている。削除できない |
| 1006〜4094 | 拡張の範囲 |

```
vlan 10
 name SALES
vlan 20
 name ENG
!
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 10
```

- まだない VLAN を `switchport access vlan` で指定すると、その VLAN が自動で作られます。
- 標準の範囲の VLAN の情報は `flash:vlan.dat` に保存されます。`erase startup-config` だけでは消えません(`delete flash:vlan.dat` が必要です)。
- VLAN を削除(`no vlan 10`)すると、そこに所属していたポートは通信できなくなります(`show vlan brief` に表示されなくなります)。別の VLAN に割り当て直します。

```
Switch# show vlan brief
VLAN Name          Status    Ports
---- ------------- --------- ---------------------------
1    default       active    Gi0/3, Gi0/4
10   SALES         active    Gi0/1
20   ENG           active    Gi0/2
```

`show vlan brief` には、トランクのポートは表示されません。

### 2.1.b 802.1Q トランク

トランクは、1本のリンクで複数の VLAN のフレームを運びます。フレームに 4 バイトのタグを入れて、どの VLAN のフレームかを見分けます。

| タグのフィールド | 長さ | 内容 |
|---|---|---|
| TPID | 16 ビット | 0x8100 |
| PCP | 3 ビット | 優先度(CoS) |
| DEI | 1 ビット | |
| VID | 12 ビット | VLAN ID(0〜4095) |

タグなしのフレームと、802.1Q のタグ付きのフレームを比べます。数字はバイト数で、プリアンブルは省いています。

```text
Untagged
[DA 6][SA 6][Type 2][Data][FCS 4]

802.1Q tagged
[DA 6][SA 6][TPID 2][PCP+DEI+VID 2][Type 2][Data][FCS 4]
            ^^^^^^^^^^^^^^^^^^^^^^^
            `-- 4 バイトのタグ。SA と Type の間に入る
```

**ネイティブ VLAN**: トランクの上で、タグを付けずに送る VLAN です。既定は VLAN 1 です。**両端で一致させます**。

```
interface GigabitEthernet0/24
 switchport trunk encapsulation dot1q     ! ISL にも対応する機種でだけ必要
 switchport mode trunk
 switchport trunk native vlan 99
 switchport trunk allowed vlan 10,20,99
 switchport nonegotiate                    ! DTP を止める
```

| コマンド | 動作 |
|---|---|
| `switchport trunk allowed vlan 10,20` | 許可する VLAN の一覧を 10,20 に **置き換える** |
| `switchport trunk allowed vlan add 30` | 30 を追加する |
| `switchport trunk allowed vlan remove 20` | 20 を削除する |
| `switchport trunk allowed vlan all` | すべて許可する(既定) |
| `switchport trunk allowed vlan except 99` | 99 以外を許可する |

> **【ひっかけ】** `add` を付けずに `switchport trunk allowed vlan 30` と入力すると、それまで許可していた VLAN が消えて、30 だけになります。

**DTP(Dynamic Trunking Protocol)**: トランクにするかどうかを自動で交渉する、Cisco 独自のプロトコルです。

| | dynamic auto | dynamic desirable | trunk | access |
|---|---|---|---|---|
| **dynamic auto** | アクセス | トランク | トランク | アクセス |
| **dynamic desirable** | トランク | トランク | トランク | アクセス |
| **trunk** | トランク | トランク | トランク | 不整合(使わない) |
| **access** | アクセス | アクセス | 不整合 | アクセス |

- auto は受け身なので、auto 同士ではトランクになりません。
- `switchport nonegotiate` は DTP のフレームを送りません。相手は `trunk` に固定します。
- セキュリティのため、DTP は無効にして、モードを固定するのが原則です。

```
Switch# show interfaces trunk
Port      Mode         Encapsulation  Status        Native vlan
Gi0/24    on           802.1q         trunking      99

Port      Vlans allowed on trunk
Gi0/24    10,20,99

Port      Vlans allowed and active in management domain
Gi0/24    10,20,99

Port      Vlans in spanning tree forwarding state and not pruned
Gi0/24    10,20,99
```

| 行 | 意味 |
|---|---|
| Vlans allowed on trunk | 許可している VLAN の一覧 |
| Vlans allowed and active in management domain | 許可されていて、さらにスイッチにその VLAN が作られて有効になっているもの |
| Vlans in spanning tree forwarding state and not pruned | 実際にフレームが流れる VLAN |

```
Switch# show interfaces g0/24 switchport
Name: Gi0/24
Switchport: Enabled
Administrative Mode: trunk
Operational Mode: trunk
Administrative Trunking Encapsulation: dot1q
Negotiation of Trunking: Off
Access Mode VLAN: 1 (default)
Trunking Native Mode VLAN: 99 (NATIVE)
Trunking VLANs Enabled: 10,20,99
```

**トランクの障害**

| 症状 | 原因 |
|---|---|
| 特定の VLAN だけ、スイッチの間で通らない | 許可の一覧にない。片方のスイッチにその VLAN が作られていない |
| `%CDP-4-NATIVE_VLAN_MISMATCH` | ネイティブ VLAN の不一致。VLAN の間でフレームが漏れる |
| トランクにならない | auto 同士。片方が access。カプセル化の不一致 |
| ポートが `show interfaces trunk` に表示されない | リンクがダウンしている、アクセスモードで動いている |

**ルーターオンアスティック(スイッチとルーターの間のトランク)**

ルーターの1本の物理インターフェースを、サブインターフェースに分けて、VLAN の間のルーティングをします。

```
interface GigabitEthernet0/0
 no shutdown
!
interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0
!
interface GigabitEthernet0/0.20
 encapsulation dot1Q 20
 ip address 192.168.20.1 255.255.255.0
!
interface GigabitEthernet0/0.99
 encapsulation dot1Q 99 native
```

- スイッチ側は `switchport mode trunk` にします。ルーターは DTP を使いません。
- `encapsulation dot1Q` を先に設定しないと、サブインターフェースに IP アドレスを設定できません。
- 物理インターフェースには IP アドレスを付けず、`no shutdown` だけをします。

### 2.1.c LACP のポートチャネル / EtherChannel(L2・L3)

複数の物理リンクを、1本の論理的なリンク(ポートチャネル)にまとめます。帯域が増え、冗長になり、STP からは1本のリンクに見えるので、ブロックされません。

同じ 2 本のリンクで、束ねない場合と束ねた場合を比べます。

```text
Without EtherChannel
[SW1] Gi0/1 ------------ Gi0/1 [SW2]
      Gi0/2 ----X------- Gi0/2        <- STP が一方をブロックする

With EtherChannel (Po1)
[SW1] Gi0/1 ============ Gi0/1 [SW2]
      Gi0/2 ============ Gi0/2        <- 2 本とも使う。STP からは 1 本に見える
```

| プロトコル | 規格 | モード |
|---|---|---|
| **LACP** | IEEE 802.3ad(802.1AX) | `active`(自分から交渉する)、`passive`(受け身) |
| PAgP | Cisco 独自 | `desirable`、`auto` |
| 静的 | なし | `on` |

| 組み合わせ | 結果 |
|---|---|
| active と active | 成立する |
| active と passive | 成立する |
| passive と passive | **成立しない** |
| desirable と desirable / auto | 成立する |
| auto と auto | 成立しない |
| on と on | 成立する |
| on と active / desirable など | 成立しない |
| LACP と PAgP | 成立しない |

**まとめる条件(メンバーのポートで一致させるもの)**: 速度、デュプレックス、スイッチポートのモード(アクセス / トランク)、アクセス VLAN、トランクの許可 VLAN とネイティブ VLAN。

- 同時に使えるのは最大 8 本です。LACP は 16 本まで登録でき、残りの 8 本は待機になります。
- LACP のシステムの優先度とポートの優先度は、小さいほうが優先されます(既定は 32768)。

**L2 EtherChannel**

```
interface range GigabitEthernet0/1 - 2
 channel-group 1 mode active
!
interface Port-channel1
 switchport mode trunk
 switchport trunk allowed vlan 10,20
```

ポートチャネルのインターフェースに書いた設定は、メンバーのポートに反映されます。VLAN やトランクの設定は、Port-channel 側で行います。

**L3 EtherChannel**

```
interface range GigabitEthernet1/0/1 - 2
 no switchport
 no ip address
 channel-group 2 mode active
!
interface Port-channel2
 no switchport
 ip address 10.0.0.1 255.255.255.252
```

物理ポートを先に `no switchport` にします。IP アドレスは Port-channel に付けます。

```
Switch# show etherchannel summary
Flags:  D - down        P - bundled in port-channel
        I - stand-alone s - suspended
        H - Hot-standby (LACP only)
        R - Layer3      S - Layer2
        U - in use

Group  Port-channel  Protocol    Ports
------+-------------+-----------+----------------------------
1      Po1(SU)       LACP        Gi0/1(P)    Gi0/2(P)
2      Po2(RU)       LACP        Gi1/0/1(P)  Gi1/0/2(P)
```

| フラグ | 意味 |
|---|---|
| SU | L2 で使用中。正常 |
| RU | L3 で使用中。正常 |
| SD / RD | ダウン |
| P | まとめられている |
| I | 単独で動いている。相手と交渉できていない |
| s | 一時停止(サスペンド)。設定が一致していない |
| D | ダウン |

```
show etherchannel port-channel
show lacp neighbor
show interfaces port-channel 1
port-channel load-balance src-dst-ip      ! 負荷分散の方式(グローバル)
show etherchannel load-balance
```

負荷分散は通信の流れ(フロー)の単位で行われます。1つのフローはいつも同じ物理リンクを通るので、1つのフローの速度は1本分を超えません。

### 2.1.d スイッチ仮想インターフェース(SVI)

SVI は、VLAN に対応する仮想の L3 インターフェースです。

| 用途 | 内容 |
|---|---|
| L2 スイッチの管理 | 管理用の IP アドレスを付ける。別のサブネットから管理するには `ip default-gateway` が必要 |
| L3 スイッチの VLAN 間ルーティング | 各 VLAN のデフォルトゲートウェイになる |

```
! L3 スイッチ
ip routing
vlan 10
vlan 20
interface Vlan10
 ip address 192.168.10.1 255.255.255.0
 no shutdown
interface Vlan20
 ip address 192.168.20.1 255.255.255.0
 no shutdown
```

```
! L2 スイッチの管理
interface Vlan99
 ip address 192.168.99.2 255.255.255.0
 no shutdown
ip default-gateway 192.168.99.1
```

**SVI が up/up になる条件**

1. その VLAN がスイッチに作られていて、有効(active)である
2. その VLAN に所属するポート(アクセスポート、またはその VLAN を通すトランク)が1つ以上 up で、STP のフォワーディングの状態である
3. SVI が `shutdown` されていない

条件を満たさないと、down/down になります。

| VLAN 間ルーティングの方式 | 特徴 |
|---|---|
| ルーターの物理ポートを VLAN ごとに使う | ポートをたくさん使う。広げにくい |
| ルーターオンアスティック | 1本のトランクで済むが、その帯域がボトルネックになる |
| L3 スイッチの SVI | 速い。今の標準 |

> **【2.1 まとめ】**
>
> - `no switchport` で L3 ポートになる。L3 スイッチは `ip routing` が必要
> - トランクのネイティブ VLAN は両端で一致させる。タグなしで流れる
> - `allowed vlan` は置き換え。追加は `add`
> - DTP: auto 同士はトランクにならない
> - LACP: active / passive。passive 同士は成立しない。on は on とだけ成立する
> - `show etherchannel summary`: SU / RU と P が正常
> - SVI は、VLAN があり、その VLAN の up のポートがあると up になる
> - L2 スイッチの管理は SVI + `ip default-gateway`

## 2.2 端末を接続する L2 スイッチポートの設定

出題範囲: VLAN、PoE、ポートチャネル、LACP。

### 共通: アクセスポートの基本の形

```
interface GigabitEthernet0/5
 description PC-Sales
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
 spanning-tree bpduguard enable
```

`switchport host` は、アクセスモードの固定、PortFast の有効化、チャネルグループの無効化をまとめて設定するマクロです。

使っていないポートは `shutdown` し、使っていない VLAN(ブラックホール VLAN)に入れておきます。

### PoE(Power over Ethernet)

LAN ケーブルで電力を送る仕組みです。電力を送る側が PSE(スイッチ)、受け取る側が PD(アクセスポイント、IP 電話、カメラ)です。

| 規格 | 呼び名 | PSE の最大の出力 | PD が使える電力 | 使う線の対の数 |
|---|---|---|---|---|
| IEEE 802.3af | PoE(Type 1) | 15.4 W | 12.95 W | 2 |
| IEEE 802.3at | PoE+(Type 2) | 30 W | 25.5 W | 2 |
| IEEE 802.3bt | PoE++(Type 3) | 60 W | 51 W | 4 |
| IEEE 802.3bt | PoE++(Type 4) | 90〜100 W | 71.3 W | 4 |

Cisco 独自の UPOE(60 W)、UPOE+(90 W)もあります。

```
interface GigabitEthernet0/5
 power inline auto            ! 既定。PD を見つけたら給電する
 power inline never           ! 給電しない
 power inline static max 15400 ! 電力を予約する(mW)
 power inline police          ! 割り当てを超えていないかを監視する
```

```
Switch# show power inline
Available:370.0(w)  Used:45.9(w)  Remaining:324.1(w)

Interface Admin  Oper       Power   Device              Class Max
                            (Watts)
--------- ------ ---------- ------- ------------------- ----- ----
Gi0/5     auto   on         15.4    AIR-AP2802I-Q-K9    3     30.0
Gi0/6     auto   on         6.3     IP Phone 8845       2     30.0
Gi0/7     auto   off        0.0     n/a                 n/a   30.0
Gi0/8     auto   power-deny 0.0     n/a                 n/a   30.0
```

- スイッチ全体で使える電力(Available)を超えると、新しい PD に給電できません(`power-deny`)。
- PD が必要な電力は、CDP や LLDP-MED で交渉します。
- アクセスポイントが機能を制限して起動する場合は、スイッチの PoE の規格が足りていません。

### 2.2.a パソコン、プリンター、IoT 機器

- アクセスポートにして、データの VLAN を1つ割り当てます。
- PortFast と BPDU ガードを有効にします。
- 必要に応じて、ポートセキュリティを設定します(→ 4.7)。
- IoT 機器(カメラ、センサー)は専用の VLAN に分けます。PoE で給電するものが多いです。
- プリンターは固定の IP アドレスか、DHCP の予約にします。

### 2.2.b 無線のアクセスポイント(自律型、コントローラー型)

| アクセスポイント(AP)の種類 | 管理 | スイッチのポート |
|---|---|---|
| 自律型(スタンドアロン) | AP ごとに個別に設定する | SSID ごとに VLAN を分けるなら **トランク** |
| コントローラー型(Lightweight)のローカルモード | WLC がまとめて管理する。データは CAPWAP のトンネルで WLC へ送る | **アクセス**(AP の管理用 VLAN) |
| コントローラー型の FlexConnect モード | WLC が管理する。データは AP からその場のネットワークに出せる | **トランク**(WLAN ごとの VLAN) |
| クラウド管理(Meraki) | クラウドのダッシュボード | SSID ごとに VLAN を分けるならトランク |

**CAPWAP**: AP と WLC の間のトンネルです。UDP の **5246** 番(制御。暗号化される)と、UDP の **5247** 番(データ)を使います。

ローカルモードの AP では、クライアントの通信がスイッチを通り抜けて、CAPWAP のトンネルで WLC まで運ばれます。

```text
[Client] -- Wi-Fi -- [AP] ---------- [SW] ---------- [WLC]
                       |                               |
                       +======= CAPWAP tunnel ========+
```

**スプリット MAC アーキテクチャ**: すぐに処理する必要があるもの(ビーコン、暗号化、ACK)は AP が、管理の機能(認証、ローミング、電波の管理、QoS のポリシー)は WLC が受け持ちます。

| AP のモード | 動作 |
|---|---|
| Local | 既定。クライアントをつなぎ、すべての通信を WLC へトンネルで送る |
| FlexConnect | WAN の先の拠点向け。WLC との接続が切れても、その場で通信を続けられる |
| Monitor | クライアントをつながず、不正な AP や干渉を監視する |
| Sniffer | パケットをキャプチャして、解析装置へ送る |
| Bridge / Mesh | AP 同士を無線でつなぐ |

**WLC の接続**: WLC は複数の VLAN(各 WLAN の VLAN)を扱うので、スイッチ側は **トランク** にします。冗長化と帯域のために LAG(ポートチャネル)にします。

> **【ひっかけ】** AireOS 系の WLC の LAG は、LACP / PAgP に対応していません。スイッチ側は `channel-group N mode on` にします。Catalyst 9800 系は LACP を使えます。

```
! ローカルモードの Lightweight AP
interface GigabitEthernet0/10
 switchport mode access
 switchport access vlan 50
 spanning-tree portfast
!
! 自律型 AP / FlexConnect AP
interface GigabitEthernet0/11
 switchport mode trunk
 switchport trunk native vlan 50
 switchport trunk allowed vlan 50,60,70
 spanning-tree portfast trunk
```

AP が WLC を見つける方法: DHCP のオプション 43、DNS(`CISCO-CAPWAP-CONTROLLER.<ドメイン>`)、同じサブネットへのブロードキャスト、手動の設定。

### 2.2.c IP 電話(VoIP)

IP 電話の中には、3つのポートを持つ小さなスイッチがあります(スイッチ側、PC 側、電話本体)。1つのスイッチのポートに、電話と PC を数珠つなぎにできます。

```
interface GigabitEthernet0/6
 switchport mode access
 switchport access vlan 10       ! データの VLAN(PC。タグなし)
 switchport voice vlan 20        ! 音声の VLAN(電話。802.1Q のタグ付き)
 spanning-tree portfast
```

- ポートは **アクセスモード** のまま、2つの VLAN を運びます(マルチ VLAN のアクセスポート)。
- スイッチは CDP(または LLDP-MED)で、音声の VLAN の番号を電話に知らせます。
- 電話は、音声のフレームに VLAN 20 のタグを付けます。PC のフレームはタグなしで VLAN 10 になります。
- 電話は PoE で給電します。
- 音声とデータを分ける理由: QoS で音声を優先するため、セキュリティのため、管理しやすくするため。

```
Switch# show interfaces g0/6 switchport
Administrative Mode: static access
Operational Mode: static access
Access Mode VLAN: 10 (DATA)
Voice VLAN: 20 (VOICE)
```

このポートは `show interfaces trunk` には表示されません。`show vlan brief` では、両方の VLAN にポートが表示されます。

### 2.2.d 仮想化のホスト

ハイパーバイザーのホストは、仮想スイッチの上の複数の VLAN(ポートグループ)を、1本の物理 NIC で運びます。

```
interface GigabitEthernet0/20
 description ESXi-01 vmnic0
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 spanning-tree portfast trunk          ! 機種によっては portfast edge trunk
```

- ホストは BPDU を送らず、ループも作らないので、トランクでも PortFast(`trunk` キーワード付き)を使います。
- NIC チーミング(複数の NIC をまとめること)で冗長化します。スイッチ側をポートチャネルにするかどうかは、仮想スイッチの方式に合わせます(LACP に対応した仮想スイッチなら `mode active`、IP ハッシュの静的なチーミングなら `mode on`、ポート ID によるチーミングならポートチャネルは不要)。
- 仮想スイッチで必要な VLAN が、許可の一覧から漏れていると、その VLAN の VM だけが通信できません。

### 2.2.e ネットワークアプライアンス

ファイアウォール、ロードバランサー、WLC、IPS などの専用機器です。

- 複数の VLAN を扱う機器はトランクに、1つのセグメントだけならアクセスポートか L3 ポートにします。
- 冗長化のため、LACP のポートチャネルで接続することが多いです。
- 機器側のサブインターフェースの VLAN ID、ネイティブ VLAN、LACP のモードを、スイッチ側と合わせます。
- 2台で冗長化する構成(アクティブ/スタンバイ)では、両方の機器のポートを同じ VLAN の設定にします。

> **【2.2 まとめ】**
>
> - PoE: af は 15.4 W、at(PoE+)は 30 W、bt は 60 / 90 W。`show power inline` で確認する
> - 自律型 AP と FlexConnect はトランク、ローカルモードの Lightweight AP はアクセス
> - CAPWAP は UDP 5246(制御)/ 5247(データ)。WLC はトランク + LAG
> - 電話: `switchport voice vlan`。アクセスモードのまま。音声はタグ付き、PC はタグなし
> - 仮想化のホストはトランク + `spanning-tree portfast trunk`
> - 端末用のポートは PortFast + BPDU ガード

## 2.3 CDP と LLDP でネットワークの資料が正しいかを確かめる

### 1. CDP と LLDP

CDP と LLDP は、隣につながっている機器の情報(名前、機種、ポートなど)を交換するプロトコルです。

| | CDP | LLDP |
|---|---|---|
| 規格 | Cisco 独自 | IEEE 802.1AB(メーカーを問わない) |
| 層 | L2 | L2 |
| Cisco の機器での既定 | **有効** | **無効**(機種による) |
| 送信の間隔 | 60 秒 | 30 秒 |
| 情報を保持する時間 | 180 秒 | 120 秒 |
| あて先 MAC | 0100.0ccc.cccc | 0180.c200.000e |
| 拡張 | — | LLDP-MED(IP 電話などの端末向け) |

どちらも、**直接つながっている隣の機器** の情報だけを得られます。ルーターやスイッチを越えては届きません。IP アドレスが設定されていなくても動きます。

```
! CDP
cdp run                        ! 全体で有効にする(既定)
no cdp run                     ! 全体で無効にする
interface g0/1
 no cdp enable                 ! インターフェースごとに無効にする
cdp timer 30
cdp holdtime 90
!
! LLDP
lldp run                       ! 全体で有効にする
interface g0/1
 no lldp transmit              ! 送信だけを止める
 no lldp receive               ! 受信だけを止める
lldp timer 30
lldp holdtime 120
lldp reinit 2
```

### 2. 出力の読み方

```
SW1# show cdp neighbors
Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone

Device ID    Local Intrfce   Holdtme   Capability   Platform    Port ID
SW2          Gig 0/1         152       S I          WS-C2960X   Gig 0/24
R1           Gig 0/2         170       R S I        ISR4331     Gig 0/0/1
SEP0C1A2B3C  Gig 0/6         141       H P          IP Phone    Port 1
```

| 列 | 意味 |
|---|---|
| Device ID | 隣の機器のホスト名 |
| **Local Intrfce** | **自分側** のインターフェース |
| Holdtme | 情報を保持する残りの秒数 |
| Capability | 隣の機器の種類 |
| Platform | 隣の機器の機種 |
| **Port ID** | **相手側** のインターフェース |

> **【ひっかけ】** Local Intrfce が自分、Port ID が相手です。逆に読ませる選択肢が出ます。

```
SW1# show cdp neighbors detail
-------------------------
Device ID: R1
Entry address(es):
  IP address: 10.0.0.1
Platform: Cisco ISR4331/K9,  Capabilities: Router Switch IGMP
Interface: GigabitEthernet0/2,  Port ID (outgoing port): GigabitEthernet0/0/1
Holdtime : 165 sec
Version :
Cisco IOS XE Software, Version 17.09.04a
Native VLAN: 1
Duplex: full
```

`detail` を付けると、さらに **IP アドレス**、IOS のバージョン、ネイティブ VLAN、デュプレックス、VTP のドメインが分かります。

```
show cdp                       ! タイマーなどの全体の設定
show cdp interface             ! CDP が有効なインターフェース
show cdp entry R1              ! 特定の隣の機器の詳細
show lldp neighbors
show lldp neighbors detail
show lldp entry SW2
```

`show lldp neighbors` の Capability は、B(Bridge。スイッチ)、R(Router)、W(無線 LAN の AP)、T(電話)などです。

### 3. 資料との突き合わせ

構成図や結線表と、実際の機器の出力を比べて、違いを見つけます。

| 確認すること | 使う情報 |
|---|---|
| どのポートが、どの機器のどのポートにつながっているか | Local Intrfce、Device ID、Port ID |
| 隣の機器の機種と OS のバージョン | Platform、Version |
| 隣の機器の管理用の IP アドレス | Entry address |
| ネイティブ VLAN とデュプレックスの一致 | detail。不一致はログにも出る |
| 資料にあるのに、出力にない機器 | 断線、相手で CDP/LLDP が無効、Cisco 以外の機器(CDP に対応していない) |
| 資料にないのに、出力にある機器 | 無断の接続、資料の更新漏れ |

- Cisco 以外の機器との間では LLDP を使います。
- セキュリティのため、外部(ISP や利用者の端末)に向いたポートでは、CDP / LLDP を無効にします。機種や OS のバージョンが漏れてしまうためです。

> **【2.3 まとめ】**
>
> - CDP は Cisco 独自で既定で有効、60 / 180 秒。LLDP は標準規格で既定では無効、30 / 120 秒
> - 直接つながった隣の機器だけが見える
> - Local Intrfce は自分、Port ID は相手
> - IP アドレスと OS のバージョンは `detail` で見る
> - `no cdp run`(全体)、`no cdp enable`(インターフェース)、`lldp run`、`lldp transmit` / `receive`

## 2.4 show コマンド、ping、拡張 ping、traceroute、パケットキャプチャによる L2 / L3 のトラブルシュート

### 1. 主な show コマンド

| 層 | コマンド | 確認すること |
|---|---|---|
| L1 | `show interfaces status` | connected / notconnect / err-disabled、速度、デュプレックス |
| L1 | `show interfaces g0/1` | エラーのカウンタ |
| L2 | `show vlan brief` | VLAN があるか、ポートの所属 |
| L2 | `show interfaces trunk` | トランクの状態、許可 VLAN、ネイティブ VLAN |
| L2 | `show interfaces g0/1 switchport` | 動作のモード、アクセス VLAN、音声 VLAN |
| L2 | `show mac address-table` | MAC アドレスをどのポートで覚えたか |
| L2 | `show spanning-tree vlan 10` | ルートブリッジ、ポートの役割と状態 |
| L2 | `show etherchannel summary` | まとめの状態 |
| L2 | `show cdp neighbors` | 隣の機器 |
| L2/L3 | `show ip arp`(`show arp`) | IP アドレスと MAC アドレスの対応 |
| L3 | `show ip interface brief` | IP アドレス、up/down |
| L3 | `show ip route` | 経路があるか |
| L3 | `show ip protocols` | 動いているルーティングプロトコル |
| 全般 | `show running-config`、`show startup-config` | 設定 |
| 全般 | `show version` | OS のバージョン、動いている時間、再起動の理由 |
| 全般 | **`show logging`** | ログ(→ 5.6) |
| 全般 | `show errdisable recovery`、`show interfaces status err-disabled` | err-disabled の原因 |

出力を絞り込むには、`| include`、`| exclude`、`| begin`、`| section` を使います。

**ログから読み取る例**

| メッセージ | 意味 |
|---|---|
| `%LINK-3-UPDOWN: Interface Gi0/1, changed state to down` | 物理層の状態が変わった |
| `%LINEPROTO-5-UPDOWN: Line protocol on Interface Gi0/1, changed state to up` | L2 の状態が変わった |
| `%CDP-4-NATIVE_VLAN_MISMATCH` | ネイティブ VLAN の不一致 |
| `%CDP-4-DUPLEX_MISMATCH` | デュプレックスの不一致 |
| `%PM-4-ERR_DISABLE: bpduguard error detected on Gi0/5` | BPDU ガードで err-disabled になった |
| `%PM-4-ERR_DISABLE: psecure-violation error detected` | ポートセキュリティの違反 |
| `%SW_MATM-4-MACFLAP_NOTIF` | MAC アドレスが複数のポートの間を行き来している。ループの疑い |
| `%OSPF-5-ADJCHG` | OSPF のネイバーの状態が変わった |
| `%IP-4-DUPADDR` | IP アドレスの重複 |
| `%SYS-5-CONFIG_I` | 設定が変更された |

### 2. ping

ICMP のエコー要求(タイプ 8)を送り、エコー応答(タイプ 0)を待ちます。

```
R1# ping 10.1.1.1
Sending 5, 100-byte ICMP Echos to 10.1.1.1, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/2/4 ms
```

| 記号 | 意味 |
|---|---|
| `!` | 応答があった |
| `.` | タイムアウト |
| `U` | 宛先到達不能(Destination Unreachable)を受け取った。途中のルーターに経路がない、ACL で拒否された |
| `Q` | 送信元抑制 |
| `M` | フラグメントできない(DF ビット付きで MTU を超えた) |
| `?` | 不明な種類のパケット |
| `&` | TTL を超えた |

`.!!!!` の最初の1回の失敗は、ARP で MAC アドレスを調べている間の待ちです。正常です。

| 結果 | 考えられる原因 |
|---|---|
| `.....` | 行きの経路はあるが戻りがない、相手が止まっている、途中で捨てられている、ファイアウォール |
| `U.U.U` | 途中のルーターに経路がない、ACL で拒否されている |
| `!.!.!` | 負荷分散している2つの経路の片方が通らない、送信の量の制限 |

### 3. 拡張 ping

`ping` だけを入力して質問に答えていく方法と、1行で指定する方法があります。

```
R1# ping 10.2.2.2 source 192.168.1.1 repeat 100 size 1500 df-bit
R1# ping 10.2.2.2 source Loopback0
```

| 項目 | 用途 |
|---|---|
| `source` | **送信元のアドレス(インターフェース)を指定する**。LAN 側のアドレスからの到達性を確かめる |
| `repeat` | 回数。ときどき起きる障害を確かめる |
| `size` | パケットの大きさ。MTU を確かめる |
| `df-bit` | フラグメントを禁止する。`size` と組み合わせて、経路の MTU を調べる |
| `timeout` | 待つ時間 |
| Sweep range of sizes | 大きさを変えながら送る |

> **【重要】** 普通の ping の送信元は、**出ていくインターフェースのアドレス** です。ルーターからの ping が通っても、LAN のホストから通るとは限りません。相手のルーターが LAN のサブネットへの戻りの経路を持っているかは、`source` に LAN 側のアドレスを指定して確かめます。

### 4. traceroute

TTL を 1 から順に増やしてパケットを送り、経路の途中の各ルーターが返す ICMP の時間超過(タイプ 11)から経路を調べます。

| OS | 送るパケット | 終点の応答 |
|---|---|---|
| Cisco IOS、Linux、macOS(`traceroute`) | UDP(あて先ポート 33434〜) | ICMP のポート到達不能 |
| Windows(`tracert`) | ICMP のエコー要求 | ICMP のエコー応答 |

```
R1# traceroute 10.3.3.3
  1 10.0.12.2 1 msec 1 msec 0 msec
  2 10.0.23.3 2 msec 2 msec 1 msec
  3  *  *  *
  4  *  *  *
```

| 記号 | 意味 |
|---|---|
| `*` | タイムアウト |
| `!H` | ホストに到達できない |
| `!N` | ネットワークに到達できない |
| `!P` | プロトコルに到達できない |
| `!A`(`A`) | 管理的に禁止されている(ACL) |

- 最後に応答したルーターの **次** が、問題のある場所です。そのルーターに先への経路がないか、次のルーターに戻りの経路がありません。
- 止めるには `Ctrl + Shift + 6` を押します。
- 拡張 traceroute では、送信元、最大の TTL、送る回数を指定できます。
- 同じホップが交互にくり返し表示されたら、ルーティングのループです。

### 5. パケットキャプチャの出力の読み取り

出題範囲は「出力を読むこと」です。Wireshark や `tcpdump` の出力から、何が起きているかを判断します。

**見るフィールド**

| 層 | フィールド | 注目する点 |
|---|---|---|
| L2 | 送信元 / あて先 MAC | あて先が ffff.ffff.ffff ならブロードキャスト |
| L2 | 802.1Q のタグ | VLAN ID。タグがなければ、ネイティブ VLAN かアクセスポート |
| L2 | EtherType | 0x0800 は IPv4、0x0806 は ARP、0x86DD は IPv6、0x8100 は 802.1Q |
| L3 | 送信元 / あて先 IP、TTL、プロトコル番号 | 1 は ICMP、6 は TCP、17 は UDP、89 は OSPF、50 は ESP |
| L4 | 送信元 / あて先のポート | どのサービスかを特定する |
| L4 | TCP のフラグ、シーケンス番号、確認応答番号 | 接続の状態 |

**L2 ヘッダと L3 ヘッダの関係**: ルーターを越えるたびに、MAC アドレス(L2 ヘッダ)は付け替えられます。IP アドレスは(NAT がなければ)最初から最後まで変わりません。別のサブネットあてのフレームのあて先 MAC は、**デフォルトゲートウェイの MAC** です。

**TCP のフラグ**

| フラグ | 意味 |
|---|---|
| SYN | 接続を始める |
| ACK | 確認の応答 |
| FIN | 正常に終える |
| RST | 強制的に切断する・拒否する |
| PSH | すぐにアプリケーションに渡す |

| キャプチャに見える並び | 判断 |
|---|---|
| SYN → SYN,ACK → ACK | 3ウェイハンドシェイクに成功。接続ができた |
| SYN → RST,ACK | ポートが閉じている。サービスが止まっているか、ホストで拒否されている |
| SYN → SYN → SYN(再送だけ) | 応答がない。ファイアウォールや ACL で捨てられている、経路がない、相手が止まっている |
| FIN,ACK → ACK → FIN,ACK → ACK | 正常に終了した |
| 同じシーケンス番号の再送、Dup ACK | パケットが失われている |

**プロトコルごとの並び**

| プロトコル | 正常な並び | 異常の例 |
|---|---|---|
| ARP | Request(ブロードキャスト)→ Reply(ユニキャスト) | Request だけがくり返される → 相手がいない、VLAN が違う |
| ICMP | Echo request → Echo reply | request だけ → 戻りがない。Destination unreachable → 経路がない |
| DHCP | Discover → Offer → Request → Ack | Discover だけ → サーバーに届いていない |
| DNS | Query → Response | Response に NXDOMAIN → レコードがない。応答がない → サーバーに届かない |

```
tcpdump の例
10:15:01.100 IP 192.168.1.10.51000 > 10.1.1.80.443: Flags [S], seq 100
10:15:02.101 IP 192.168.1.10.51000 > 10.1.1.80.443: Flags [S], seq 100
10:15:04.103 IP 192.168.1.10.51000 > 10.1.1.80.443: Flags [S], seq 100
```

SYN の再送だけで、応答がありません。途中で捨てられているか、相手に届いていません。

Cisco の機器でキャプチャする方法: SPAN(`monitor session 1 source interface g0/1` / `destination interface g0/24`)で通信をコピーして、解析装置で記録する。IOS XE の Embedded Packet Capture(`monitor capture`)で機器の上で記録する。

### 6. 原因の絞り込み方

| 症状 | 確認すること |
|---|---|
| 同じ VLAN の中で通らない | ポートの VLAN、VLAN があるか、トランクの許可 VLAN、MAC アドレステーブル、STP の状態、err-disabled |
| 別の VLAN と通らない | ホストのゲートウェイの設定、SVI やサブインターフェースが up か、`ip routing`、ACL |
| 別の拠点と通らない | 経路(行きと戻り)、NAT、ACL。traceroute で止まる場所を見る |
| 遅い | エラーのカウンタ、デュプレックスの不一致、ループ、混雑 |

> **【2.4 まとめ】**
>
> - ping: `!` は成功、`.` はタイムアウト、`U` は到達不能
> - 拡張 ping の `source` で、LAN 側からの到達性(戻りの経路)を確かめる
> - traceroute は TTL と ICMP の時間超過を使う。IOS は UDP、Windows は ICMP
> - 最後に応答したホップの次が怪しい
> - SYN → RST はポートが閉じている、SYN の再送だけは途中で捨てられている
> - ルーターを越えると MAC アドレスは変わり、IP アドレスは変わらない
> - `show logging` のメッセージの名前から原因を読む

## 2.5 Rapid PVST+ の動作を設定する

### 1. STP の目的

L2 のリンクを冗長にしてループがあると、ブロードキャストストーム、MAC アドレステーブルの不安定化、フレームの重複が起きます。イーサネットのフレームには TTL がないので、ループしたフレームは止まりません。STP は、一部のポートをブロックしてループのない木の形を作り、障害が起きたらブロックを解いて迂回させます。

| 方式 | 規格 | 特徴 |
|---|---|---|
| STP | 802.1D | すべての VLAN で1つ。切り替えに 30〜50 秒かかる |
| PVST+ | Cisco | VLAN ごとに 802.1D を動かす |
| RSTP | 802.1w | 速く切り替わる(数秒以内) |
| **Rapid PVST+** | Cisco | VLAN ごとに RSTP を動かす。Catalyst の標準 |
| MSTP | 802.1s | 複数の VLAN をインスタンスにまとめる |

```
spanning-tree mode rapid-pvst
```

### 2. ブリッジ ID と BPDU

スイッチは BPDU というメッセージを交換して、ネットワークの形を決めます。

**ブリッジ ID(8 バイト)= ブリッジプライオリティ(2 バイト)+ MAC アドレス(6 バイト)**

- プライオリティの上位 4 ビットが設定値で、下位 12 ビットは拡張システム ID(VLAN ID)です。
- 設定値は **4096 の倍数**(0、4096、8192 … 61440)で、既定は **32768** です。
- 表示されるプライオリティは「設定値 + VLAN ID」です。VLAN 10 で既定のままなら 32778 になります。

### 2.5.a ルートブリッジ、ルートポート、その他のポート

**選び方の手順**

| 順番 | 決めるもの | 基準 |
|---|---|---|
| 1 | ルートブリッジ(VLAN ごとに1台) | ブリッジ ID が最も小さいスイッチ。プライオリティが同じなら、MAC アドレスが小さいほう |
| 2 | ルートポート(ルートブリッジ以外の各スイッチに1つ) | ルートブリッジまでのコストが最も小さいポート |
| 3 | 指定ポート(セグメントごとに1つ) | そのセグメントからルートまでのコストが最も小さい側のポート |
| 4 | 残り | 非指定ポート(RSTP では代替ポート・バックアップポート)。ブロックされる |

**同点のときの決め方(ルートポートや指定ポートを決めるとき)**

1. ルートまでのコストが最も小さい
2. 送ってきた側(上流)のブリッジ ID が最も小さい
3. 送ってきた側のポート ID(ポートプライオリティ + ポート番号)が最も小さい
4. 自分のポート ID が最も小さい(同じスイッチから2本受けている場合)

**ポートのコスト**

| 速度 | ショート方式(既定) | ロング方式 |
|---|---|---|
| 10 Mbps | 100 | 2,000,000 |
| 100 Mbps | 19 | 200,000 |
| 1 Gbps | 4 | 20,000 |
| 10 Gbps | 2 | 2,000 |

ルートまでのコストは、ルートブリッジまでの経路の上で、BPDU を **受け取るポート** のコストを合計したものです。ルートブリッジのポートは、すべて指定ポートになります。

3 台のスイッチを三角形につないだ例です。すべて 1 Gbps(コスト 4)で、SW1 のブリッジ ID が最も小さく、次に SW2、SW3 の順に小さいとします。

```text
[SW1] Gi0/1 (Desg) ----------------- (Root) Gi0/1 [SW2]
[SW1] Gi0/2 (Desg) ----------------- (Root) Gi0/1 [SW3]
[SW2] Gi0/2 (Desg) ----------------- (Altn) Gi0/2 [SW3]
```

SW1 がルートブリッジなので、SW1 のポートはすべて指定ポートです。SW2 と SW3 は、SW1 に直接つながるポートがルートポートになります。SW2 と SW3 の間のリンクは、コストが同じなのでブリッジ ID が小さい SW2 側が指定ポートになり、SW3 側が代替ポートとしてブロックされます。

**設定**

```
spanning-tree vlan 10 priority 4096            ! 値を直接指定する
spanning-tree vlan 10 root primary             ! ルートになるように自動で設定する
spanning-tree vlan 10 root secondary           ! 予備のルートにする
!
interface GigabitEthernet0/1
 spanning-tree vlan 10 cost 10                 ! ポートのコスト
 spanning-tree vlan 10 port-priority 64        ! ポートのプライオリティ(16 の倍数。既定は 128)
```

| コマンド | 設定されるプライオリティ |
|---|---|
| `root primary` | 今のルートが 24576 より大きければ **24576**。そうでなければ、今のルートより 4096 小さい値 |
| `root secondary` | **28672** |

`root primary` はマクロで、実行したときの値を設定するだけです。後で別のスイッチがもっと小さい値にしても、自動では追いかけません。

- ルートブリッジは、ディストリビューション層(コア層)の性能の高いスイッチに、はっきりと設定します。既定のままだと、MAC アドレスが最も小さい(古い)スイッチがルートになってしまいます。
- ポートのコストは **自分のルートポートの選び方** に、ポートのプライオリティは **下流のスイッチのルートポートの選び方** に影響します。

### 2.5.b ポートの状態と役割

**ポートの状態**

| 802.1D(STP) | 802.1w(RSTP) | MAC アドレスの学習 | フレームの転送 |
|---|---|---|---|
| Disabled | Discarding | しない | しない |
| Blocking | Discarding | しない | しない |
| Listening | Discarding | しない | しない |
| Learning | Learning | する | しない |
| Forwarding | Forwarding | する | する |

**ポートの役割(RSTP)**

| 役割 | 表示 | 内容 |
|---|---|---|
| ルートポート | Root | ルートブリッジに最も近いポート。フォワーディング |
| 指定ポート | Desg | セグメントの代表。フォワーディング |
| 代替ポート | Altn | ルートポートの予備。別のスイッチから、より良い BPDU を受け取っている。ディスカーディング |
| バックアップポート | Back | 指定ポートの予備。**自分自身** の BPDU を受け取っている(ハブを通した場合など)。ディスカーディング |

**802.1D のタイマー**(参考)

| タイマー | 既定 | 内容 |
|---|---|---|
| Hello | 2 秒 | BPDU を送る間隔 |
| Forward Delay | 15 秒 | リスニングとラーニングの、それぞれの時間 |
| Max Age | 20 秒 | BPDU を保持する時間 |

802.1D の切り替えには、最大 50 秒(Max Age 20 + リスニング 15 + ラーニング 15)かかります。

**RSTP が速い理由**

- タイマーを待つのではなく、**プロポーザル / アグリーメント** のやり取りで、すぐに状態を変えます(ポイントツーポイントのリンクの場合)。
- 代替ポートを前もって決めておき、ルートポートに障害が起きたら、すぐに切り替えます。
- すべてのスイッチが Hello の間隔で BPDU を送ります。3回(6 秒)続けて受け取れなければ、隣とのつながりが切れたと判断します。
- 端末用のポート(PortFast)は、すぐにフォワーディングになります。

**リンクの種類**

| 種類 | 判断の基準 | 表示 |
|---|---|---|
| ポイントツーポイント | 全二重 | P2p |
| 共有 | 半二重 | Shr |
| エッジ | PortFast | P2p Edge |

```
SW2# show spanning-tree vlan 10

VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    4106
             Address     0c1a.2b00.0001
             Cost        4
             Port        24 (GigabitEthernet0/24)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32778  (priority 32768 sys-id-ext 10)
             Address     0c1a.2b00.0002

Interface        Role Sts Cost      Prio.Nbr Type
---------------- ---- --- --------- -------- --------------------------
Gi0/1            Desg FWD 4         128.1    P2p Edge
Gi0/23           Altn BLK 4         128.23   P2p
Gi0/24           Root FWD 4         128.24   P2p
```

| 読み取る点 | 見る場所 |
|---|---|
| 動作のモード | `protocol rstp`(Rapid PVST+)、`ieee`(PVST+) |
| ルートブリッジ | Root ID。4106 = 4096 + VLAN 10 |
| 自分がルートか | Root ID と Bridge ID が同じなら自分。`This bridge is the root` と表示される |
| ルートまでのコストとポート | Root ID の Cost と Port |
| 各ポートの役割と状態 | Role、Sts |
| PortFast | Type の `Edge` |

```
show spanning-tree summary          ! モード、PortFast / BPDU ガードの既定、ポートの数
show spanning-tree root             ! VLAN ごとのルート
show spanning-tree interface g0/1 detail
show spanning-tree inconsistentports
```

### 2.5.c PortFast

端末をつなぐポートを、リスニングとラーニングを経ずに、すぐにフォワーディングにします。RSTP では、エッジポートになります。

```
interface GigabitEthernet0/5
 spanning-tree portfast                 ! アクセスポート用
 spanning-tree portfast trunk           ! トランク用(サーバー、ハイパーバイザー)
!
spanning-tree portfast default          ! 全体。すべてのアクセスポートで有効にする
```

- 新しい IOS では、`spanning-tree portfast edge`、`spanning-tree portfast edge trunk` と書きます。
- 端末が DHCP でアドレスを取得できない(STP の状態の遷移を待つ間にタイムアウトする)問題を防げます。
- エッジポートが up/down しても、トポロジ変更の通知(TCN)は出ません。
- PortFast のポートで BPDU を受け取ると、エッジの扱いをやめて普通の STP のポートになります。
- **スイッチをつなぐポートには設定しません**。一時的なループの原因になります。

### 2.5.d ルートガード、ループガード、BPDU ガード

| 機能 | 設定する場所 | 働く条件 | 動作 | 復旧 |
|---|---|---|---|---|
| **BPDU ガード** | PortFast のエッジポート | BPDU を受け取った | **err-disabled** | 手動(shutdown / no shutdown)または errdisable recovery |
| **ルートガード** | ルートになってほしくないスイッチに向いた指定ポート | より優先度の高い(superior)BPDU を受け取った | **root-inconsistent**(ブロック) | 優先度の高い BPDU が届かなくなれば自動 |
| **ループガード** | ルートポート、代替ポート(非指定ポート) | BPDU が届かなくなった | **loop-inconsistent**(ブロック) | BPDU をまた受け取れば自動 |
| BPDU フィルター | エッジポート | — | BPDU を送受信しない | —(STP を無効にするのと同じなので危険) |

3 つの機能を、どのポートに設定するかを図にします。

```text
[Core-SW]            ルートブリッジ
   |
   | Gi0/24 (Root)   ループガード: BPDU が途絶えても、転送を始めない
[Dist-SW]
   | Gi0/20 (Desg)   ルートガード: 配下のスイッチに、ルートの座を奪わせない
   |
[Access-SW]
   | Gi0/5 (Edge)    BPDU ガード: BPDU を受け取ったら err-disabled にする
   |
[PC]
```

```
! BPDU ガード
interface GigabitEthernet0/5
 spanning-tree bpduguard enable
!
spanning-tree portfast bpduguard default     ! 全体。PortFast のすべてのポートで有効にする
!
! ルートガード
interface GigabitEthernet0/20
 spanning-tree guard root
!
! ループガード
interface GigabitEthernet0/24
 spanning-tree guard loop
!
spanning-tree loopguard default              ! 全体
```

**BPDU ガード**: 端末用のポートに、スイッチが無断でつながれるのを防ぎます。

```
%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi0/5 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Gi0/5, putting Gi0/5 in err-disable state
```

```
! 復旧する
interface GigabitEthernet0/5
 shutdown
 no shutdown
!
! 自動で復旧させる
errdisable recovery cause bpduguard
errdisable recovery interval 300            ! 秒。既定は 300
```

原因(つながれたスイッチ)を取り除かずに復旧させても、また err-disabled になります。

**ルートガード**: 配下のスイッチがもっと小さいプライオリティを設定しても、ルートブリッジの位置を変えさせません。優先度の高い BPDU を受け取っている間だけポートがブロックされ、err-disabled にはなりません。

```
%SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port Gi0/20 on VLAN0010.
```

**ループガード**: 片方向だけの障害(光ファイバーの片側の断線など)で BPDU が届かなくなると、普通の STP はブロックしていたポートを指定ポートにして転送を始めてしまい、ループが起きます。ループガードは、この状態の変化を止めます。

- ルートガードとループガードは、同じポートに同時には設定できません。
- ループガードと似た目的の機能に UDLD があります。

> **【2.5 まとめ】**
>
> - ルートブリッジはブリッジ ID が最も小さいスイッチ。プライオリティの既定は 32768 で、4096 単位
> - `root primary` は 24576、`root secondary` は 28672
> - コスト: 10 Mbps は 100、100 Mbps は 19、1 Gbps は 4、10 Gbps は 2
> - 同点のとき: コスト → 上流のブリッジ ID → 上流のポート ID
> - RSTP の状態は Discarding / Learning / Forwarding。役割は Root / Desg / Altn / Back
> - PortFast は端末のポートだけ。トランクでつなぐ端末は `portfast trunk`
> - BPDU ガード → err-disabled。ルートガード → root-inconsistent。ループガード → loop-inconsistent
> - `show spanning-tree vlan N` で Root ID、Bridge ID、Role、Sts を読む
