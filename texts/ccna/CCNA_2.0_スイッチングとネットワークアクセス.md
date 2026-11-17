# CCNA テキスト 2.0 スイッチングとネットワークアクセス(25%)

対象: 200-301 CCNA v2.0

## 2.0 前提: スイッチの基本動作

### 1. フレームの転送

スイッチは受信フレームの**送信元 MAC アドレス**を見て MAC アドレステーブルに学習し、**あて先 MAC アドレス**を見て転送先を決める。

| 動作 | 条件 |
|---|---|
| 学習(learning) | 送信元 MAC と受信ポート、VLAN を記録 |
| フラッディング | あて先が未学習のユニキャスト、ブロードキャスト、(既定では)マルチキャスト → 受信ポート以外の同一 VLAN の全ポートへ |
| 転送(forwarding) | あて先が学習済み → そのポートだけへ |
| フィルタリング | あて先が受信ポートと同じポートにある → 破棄 |
| エージング | 既定 300 秒通信がなければ削除 |

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

| | 分割する機器 |
|---|---|
| コリジョンドメイン | スイッチの各ポート、ルータ。ハブは分割しない |
| ブロードキャストドメイン | ルータ(L3 インターフェース)、VLAN。スイッチは既定では分割しない |

### 3. イーサネットフレーム

| フィールド | 長さ | 内容 |
|---|---|---|
| プリアンブル + SFD | 7 + 1 バイト | 同期 |
| あて先 MAC | 6 | |
| 送信元 MAC | 6 | |
| (802.1Q タグ) | 4 | トランク上のみ |
| タイプ | 2 | 0x0800 IPv4、0x0806 ARP、0x86DD IPv6 |
| データ | 46〜1500 | MTU 1500 |
| FCS | 4 | CRC による誤り検出 |

MAC アドレスは 48 ビット。前半 24 ビットが OUI(ベンダー)。ブロードキャストは ffff.ffff.ffff。

## 2.1 ネットワーク機器間の接続を設定する

### 2.1.a L2 / L3 物理インターフェース

| | L2 ポート(スイッチポート) | L3 ポート(ルーテッドポート) |
|---|---|---|
| 設定 | `switchport`(L2 スイッチの既定) | `no switchport` |
| IP アドレス | 持たない | 持つ |
| VLAN | 所属する | 所属しない |
| STP | 動く | 動かない |
| 用途 | ホスト接続、スイッチ間 | L3 スイッチ間、ルータとの接続 |

```
! L3 スイッチのルーテッドポート
ip routing
interface GigabitEthernet1/0/1
 no switchport
 ip address 10.0.0.1 255.255.255.252
 no shutdown
```

```
! ルータの物理インターフェース(常に L3)
interface GigabitEthernet0/0
 description To-SW1
 ip address 10.0.0.2 255.255.255.252
 no shutdown
```

- ルータのインターフェースは既定で shutdown。スイッチのポートは既定で有効
- L3 スイッチでルーティングするには `ip routing` が要る
- `interface range g0/1 - 4` で複数ポートをまとめて設定できる

### VLAN の基礎

VLAN はスイッチ内でブロードキャストドメインを論理的に分ける。異なる VLAN 間の通信には L3 機器(ルータ、L3 スイッチ)が要る。

| VLAN ID | 区分 |
|---|---|
| 1 | デフォルト VLAN。削除不可。全ポートの初期所属 |
| 2〜1001 | 標準範囲。作成・削除できる |
| 1002〜1005 | FDDI / Token Ring 用の予約。削除不可 |
| 1006〜4094 | 拡張範囲 |

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

- 存在しない VLAN を `switchport access vlan` で指定すると、その VLAN が自動作成される
- 標準範囲の VLAN 情報は `flash:vlan.dat` に保存される。`erase startup-config` だけでは消えない(`delete flash:vlan.dat` が要る)
- VLAN を削除(`no vlan 10`)すると、所属していたポートは通信できなくなる(`show vlan brief` に表示されなくなる)。別の VLAN へ割り当て直す

```
Switch# show vlan brief
VLAN Name          Status    Ports
---- ------------- --------- ---------------------------
1    default       active    Gi0/3, Gi0/4
10   SALES         active    Gi0/1
20   ENG           active    Gi0/2
```

`show vlan brief` にトランクポートは表示されない。

### 2.1.b 802.1Q トランク

トランクは1本のリンクで複数 VLAN のフレームを運ぶ。フレームに 4 バイトのタグを挿入して VLAN を識別する。

| タグのフィールド | 長さ | 内容 |
|---|---|---|
| TPID | 16 ビット | 0x8100 |
| PCP | 3 ビット | 優先度(CoS) |
| DEI | 1 ビット | |
| VID | 12 ビット | VLAN ID(0〜4095) |

**ネイティブ VLAN**: トランク上でタグを付けずに送る VLAN。既定は VLAN 1。**両端で一致させる**。

```
interface GigabitEthernet0/24
 switchport trunk encapsulation dot1q     ! ISL にも対応する機種のみ必要
 switchport mode trunk
 switchport trunk native vlan 99
 switchport trunk allowed vlan 10,20,99
 switchport nonegotiate                    ! DTP を止める
```

| コマンド | 動作 |
|---|---|
| `switchport trunk allowed vlan 10,20` | 許可リストを 10,20 に**置き換える** |
| `switchport trunk allowed vlan add 30` | 30 を追加 |
| `switchport trunk allowed vlan remove 20` | 20 を削除 |
| `switchport trunk allowed vlan all` | すべて許可(既定) |
| `switchport trunk allowed vlan except 99` | 99 以外 |

> **【ひっかけ】** `add` を付けずに `switchport trunk allowed vlan 30` と打つと、既存の許可 VLAN が消えて 30 だけになる。

**DTP(Dynamic Trunking Protocol)**: トランクを自動で交渉する Cisco 独自プロトコル。

| | dynamic auto | dynamic desirable | trunk | access |
|---|---|---|---|---|
| **dynamic auto** | アクセス | トランク | トランク | アクセス |
| **dynamic desirable** | トランク | トランク | トランク | アクセス |
| **trunk** | トランク | トランク | トランク | 不整合(使わない) |
| **access** | アクセス | アクセス | 不整合 | アクセス |

- auto は受け身。auto 同士ではトランクにならない
- `switchport nonegotiate` は DTP フレームを送らない。対向は `trunk` 固定にする
- セキュリティ上、DTP は無効にし、モードを固定するのが原則

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
| Vlans allowed on trunk | 許可リスト |
| Vlans allowed and active in management domain | 許可されていて、かつスイッチに VLAN が存在して active |
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
| 特定の VLAN だけスイッチ間で通らない | 許可リストにない。片側のスイッチに VLAN が作られていない |
| `%CDP-4-NATIVE_VLAN_MISMATCH` | ネイティブ VLAN の不一致。VLAN 間でフレームが漏れる |
| トランクにならない | auto 同士。片側 access。カプセル化不一致 |
| ポートが `show interfaces trunk` に出ない | リンクダウン、アクセスモードで動作中 |

**ルータオンアスティック(スイッチ-ルータ間のトランク)**

ルータの1本の物理インターフェースをサブインターフェースに分け、VLAN 間ルーティングを行う。

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

- スイッチ側は `switchport mode trunk`。ルータは DTP を話さない
- `encapsulation dot1Q` を先に設定しないと、サブインターフェースに IP アドレスを設定できない
- 物理インターフェースには IP アドレスを付けず、`no shutdown` する

### 2.1.c LACP ポートチャネル / EtherChannel(L2・L3)

複数の物理リンクを1本の論理リンク(ポートチャネル)に束ねる。帯域が増え、冗長になり、STP からは1本のリンクに見える(ブロックされない)。

| プロトコル | 規格 | モード |
|---|---|---|
| **LACP** | IEEE 802.3ad(802.1AX) | `active`(自分から交渉)、`passive`(受け身) |
| PAgP | Cisco 独自 | `desirable`、`auto` |
| 静的 | なし | `on` |

| 組み合わせ | 結果 |
|---|---|
| active - active | 成立 |
| active - passive | 成立 |
| passive - passive | **不成立** |
| desirable - desirable / auto | 成立 |
| auto - auto | 不成立 |
| on - on | 成立 |
| on - active / desirable など | 不成立 |
| LACP - PAgP | 不成立 |

**束ねる条件(メンバーポートで一致させる)**: 速度、デュプレックス、スイッチポートモード(アクセス / トランク)、アクセス VLAN、トランクの許可 VLAN とネイティブ VLAN。

- 最大 8 本がアクティブ。LACP は 16 本まで登録でき、8 本はスタンバイ
- LACP のシステム優先度・ポート優先度は小さいほうが優先(既定 32768)

**L2 EtherChannel**

```
interface range GigabitEthernet0/1 - 2
 channel-group 1 mode active
!
interface Port-channel1
 switchport mode trunk
 switchport trunk allowed vlan 10,20
```

ポートチャネルインターフェースへの設定はメンバーポートに反映される。VLAN やトランクの設定は Port-channel 側で行う。

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

物理ポートを先に `no switchport` にする。IP アドレスは Port-channel に付ける。

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
| SU | L2、使用中。正常 |
| RU | L3、使用中。正常 |
| SD / RD | ダウン |
| P | 束ねられている |
| I | 単独で動作。対向と交渉できていない |
| s | サスペンド。設定の不一致 |
| D | ダウン |

```
show etherchannel port-channel
show lacp neighbor
show interfaces port-channel 1
port-channel load-balance src-dst-ip      ! 負荷分散方式(グローバル)
show etherchannel load-balance
```

負荷分散はフロー単位。1つのフローは常に同じ物理リンクを通るため、1フローの速度は1本分を超えない。

### 2.1.d スイッチ仮想インターフェース(SVI)

SVI は VLAN に対応する仮想の L3 インターフェース。

| 用途 | 内容 |
|---|---|
| L2 スイッチの管理 | 管理用 IP アドレスを付ける。別サブネットからの管理には `ip default-gateway` が要る |
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

1. その VLAN がスイッチに存在し、active である
2. その VLAN に所属するポート(アクセスポート、またはその VLAN を許可するトランク)が1つ以上 up で、STP のフォワーディング状態である
3. SVI が `shutdown` されていない

条件を満たさないと down/down になる。

| VLAN 間ルーティングの方式 | 特徴 |
|---|---|
| ルータの物理ポートを VLAN ごとに使う | ポートを消費。拡張性なし |
| ルータオンアスティック | 1本のトランク。帯域がボトルネック |
| L3 スイッチの SVI | 高速。現在の標準 |

> **【2.1 まとめ】**
>
> - `no switchport` で L3 ポート。L3 スイッチは `ip routing`
> - トランクのネイティブ VLAN は両端で一致。タグなしで流れる
> - `allowed vlan` は置き換え。追加は `add`
> - DTP: auto 同士はトランクにならない
> - LACP: active / passive。passive 同士は不成立。on は on とだけ
> - `show etherchannel summary`: SU / RU と P が正常
> - SVI は VLAN が存在し、その VLAN の up ポートがあると up
> - L2 スイッチの管理は SVI + `ip default-gateway`

## 2.2 エッジホスト接続用の L2 スイッチポート属性を設定する

出題範囲: VLAN、PoE、ポートチャネル、LACP。

### 共通: アクセスポートの基本形

```
interface GigabitEthernet0/5
 description PC-Sales
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
 spanning-tree bpduguard enable
```

`switchport host` は、アクセスモード固定 + PortFast 有効 + チャネルグループ無効をまとめて設定するマクロ。

未使用ポートは `shutdown` し、未使用の VLAN(ブラックホール VLAN)に入れる。

### PoE(Power over Ethernet)

LAN ケーブルで電力を供給する。給電側が PSE(スイッチ)、受電側が PD(AP、IP 電話、カメラ)。

| 規格 | 通称 | PSE の最大出力 | PD が使える電力 | 使う対数 |
|---|---|---|---|---|
| IEEE 802.3af | PoE(Type 1) | 15.4 W | 12.95 W | 2 |
| IEEE 802.3at | PoE+(Type 2) | 30 W | 25.5 W | 2 |
| IEEE 802.3bt | PoE++(Type 3) | 60 W | 51 W | 4 |
| IEEE 802.3bt | PoE++(Type 4) | 90〜100 W | 71.3 W | 4 |

Cisco 独自の UPOE(60 W)、UPOE+(90 W)もある。

```
interface GigabitEthernet0/5
 power inline auto            ! 既定。PD を検出したら給電
 power inline never           ! 給電しない
 power inline static max 15400 ! 電力を予約(mW)
 power inline police          ! 割り当て超過を監視
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

- スイッチ全体の電力予算(Available)を超えると、新しい PD に給電できない(`power-deny`)
- PD の必要電力は CDP / LLDP-MED で交渉する
- AP が機能制限で起動する場合は、スイッチの PoE 規格が AP の要求に足りていない

### 2.2.a デスクトップ、プリンタ、IoT 機器

- アクセスポート。データ VLAN を1つ割り当てる
- PortFast と BPDU ガードを有効にする
- 必要に応じてポートセキュリティ(→ 4.7)
- IoT 機器(カメラ、センサー)は専用 VLAN に分離する。PoE 給電が多い
- プリンタは固定 IP か DHCP 予約にする

### 2.2.b 無線アクセスポイント(スタンドアロン、コントローラ型)

| AP の種類 | 管理 | スイッチポート |
|---|---|---|
| 自律型(スタンドアロン) | AP ごとに個別設定 | SSID ごとに VLAN を分けるなら**トランク** |
| コントローラ型(Lightweight)ローカルモード | WLC が集中管理。データは CAPWAP トンネルで WLC へ | **アクセス**(AP 管理用 VLAN) |
| コントローラ型 FlexConnect モード | WLC が管理。データは AP でローカルスイッチング可 | **トランク**(WLAN ごとの VLAN) |
| クラウド管理(Meraki) | クラウドのダッシュボード | SSID ごとに VLAN を分けるならトランク |

**CAPWAP**: AP と WLC の間のトンネル。UDP **5246**(制御、暗号化)、UDP **5247**(データ)。

**スプリット MAC アーキテクチャ**: リアルタイム処理(ビーコン、暗号化、ACK)は AP、管理機能(認証、ローミング、RF 管理、QoS ポリシー)は WLC が受け持つ。

| AP モード | 動作 |
|---|---|
| Local | 既定。クライアントを収容。全トラフィックを WLC へトンネル |
| FlexConnect | WAN 越しの拠点向け。WLC と切れてもローカルでスイッチング |
| Monitor | クライアントを収容せず、不正 AP や干渉を監視 |
| Sniffer | パケットをキャプチャして解析装置へ送る |
| Bridge / Mesh | AP 間を無線でつなぐ |

**WLC の接続**: WLC は複数 VLAN(各 WLAN の VLAN)を扱うので、スイッチ側は**トランク**。冗長化と帯域のため LAG(ポートチャネル)にする。

> **【ひっかけ】** AireOS 系 WLC の LAG は LACP / PAgP に対応しない。スイッチ側は `channel-group N mode on`。Catalyst 9800 系は LACP を使える。

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

AP が WLC を見つける方法: DHCP オプション 43、DNS(`CISCO-CAPWAP-CONTROLLER.<ドメイン>`)、同一サブネットへのブロードキャスト、手動設定。

### 2.2.c VoIP 電話

IP 電話は3ポートのスイッチを内蔵する(スイッチ側、PC 側、電話本体)。1つのスイッチポートに電話と PC を数珠つなぎにする。

```
interface GigabitEthernet0/6
 switchport mode access
 switchport access vlan 10       ! データ VLAN(PC。タグなし)
 switchport voice vlan 20        ! 音声 VLAN(電話。802.1Q タグ付き)
 spanning-tree portfast
```

- ポートは**アクセスモード**のまま、2つの VLAN を運ぶ(マルチ VLAN アクセスポート)
- スイッチは CDP(または LLDP-MED)で音声 VLAN の番号を電話に伝える
- 電話は音声フレームに VLAN 20 のタグを付ける。PC のフレームはタグなしで VLAN 10
- 電話は PoE で給電する
- 音声とデータを分ける理由: QoS で音声を優先する、セキュリティ、管理の容易さ

```
Switch# show interfaces g0/6 switchport
Administrative Mode: static access
Operational Mode: static access
Access Mode VLAN: 10 (DATA)
Voice VLAN: 20 (VOICE)
```

`show interfaces trunk` には出ない。`show vlan brief` では両方の VLAN にポートが表示される。

### 2.2.d 仮想化ホスト

ハイパーバイザのホストは、vSwitch 上の複数の VLAN(ポートグループ)を1本の物理 NIC で運ぶ。

```
interface GigabitEthernet0/20
 description ESXi-01 vmnic0
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 spanning-tree portfast trunk          ! 機種により portfast edge trunk
```

- ホストは BPDU を送らず、ループを作らないので、トランクでも PortFast(`trunk` キーワード)を使う
- NIC チーミングで冗長化する。スイッチ側をポートチャネルにするかどうかは vSwitch の方式に合わせる(LACP 対応の vSwitch なら `mode active`、IP ハッシュの静的チーミングなら `mode on`、ポート ID ベースのチーミングならポートチャネル不要)
- vSwitch で必要な VLAN が許可リストから漏れると、その VLAN の VM だけ通信できない

### 2.2.e ネットワークアプライアンス

ファイアウォール、ロードバランサ、WLC、IPS など。

- 複数 VLAN を扱う機器はトランク、単一セグメントならアクセスまたは L3 ポート
- 冗長化のため LACP ポートチャネルで接続することが多い
- アプライアンス側のサブインターフェースの VLAN ID、ネイティブ VLAN、LACP モードをスイッチ側と合わせる
- HA 構成(アクティブ/スタンバイ)では、両機のポートを同じ VLAN 設定にする

> **【2.2 まとめ】**
>
> - PoE: af 15.4 W、at(PoE+)30 W、bt 60 / 90 W。`show power inline`
> - 自律型 AP と FlexConnect はトランク、ローカルモードの Lightweight AP はアクセス
> - CAPWAP は UDP 5246(制御)/ 5247(データ)。WLC はトランク + LAG
> - 電話: `switchport voice vlan`。アクセスモードのまま。音声はタグ付き、PC はタグなし
> - 仮想化ホストはトランク + `spanning-tree portfast trunk`
> - エッジポートは PortFast + BPDU ガード

## 2.3 CDP と LLDP でネットワーク資料の正確さを検証する

### 1. CDP と LLDP

| | CDP | LLDP |
|---|---|---|
| 規格 | Cisco 独自 | IEEE 802.1AB(マルチベンダ) |
| レイヤ | L2 | L2 |
| Cisco 機器の既定 | **有効** | **無効**(機種による) |
| 送信間隔 | 60 秒 | 30 秒 |
| ホールドタイム | 180 秒 | 120 秒 |
| あて先 MAC | 0100.0ccc.cccc | 0180.c200.000e |
| 拡張 | — | LLDP-MED(IP 電話などの端末向け) |

どちらも**直接接続された隣接機器**の情報だけを得る。ルータやスイッチを越えない。IP アドレスが未設定でも動く。

```
! CDP
cdp run                        ! グローバルで有効(既定)
no cdp run                     ! グローバルで無効
interface g0/1
 no cdp enable                 ! インターフェース単位で無効
cdp timer 30
cdp holdtime 90
!
! LLDP
lldp run                       ! グローバルで有効
interface g0/1
 no lldp transmit              ! 送信だけ止める
 no lldp receive               ! 受信だけ止める
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
| Device ID | 隣接機器のホスト名 |
| **Local Intrfce** | **自分側**のインターフェース |
| Holdtme | 情報を保持する残り秒数 |
| Capability | 隣接機器の種別 |
| Platform | 隣接機器の機種 |
| **Port ID** | **相手側**のインターフェース |

> **【ひっかけ】** Local Intrfce が自分、Port ID が相手。逆に読ませる選択肢が出る。

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

`detail` で追加で分かる情報: **IP アドレス**、IOS のバージョン、ネイティブ VLAN、デュプレックス、VTP ドメイン。

```
show cdp                       ! タイマーなどの全体設定
show cdp interface             ! CDP が有効なインターフェース
show cdp entry R1              ! 特定の隣接機器の詳細
show lldp neighbors
show lldp neighbors detail
show lldp entry SW2
```

`show lldp neighbors` の Capability は B(Bridge = スイッチ)、R(Router)、W(WLAN AP)、T(Telephone)など。

### 3. 資料との突き合わせ

構成図・結線表と実機の出力を比較し、食い違いを見つける。

| 確認項目 | 使う情報 |
|---|---|
| どのポートがどの機器のどのポートにつながっているか | Local Intrfce、Device ID、Port ID |
| 隣接機器の機種・OS バージョン | Platform、Version |
| 隣接機器の管理 IP アドレス | Entry address |
| ネイティブ VLAN、デュプレックスの一致 | detail。不一致はログにも出る |
| 資料にあるのに出力にない機器 | 断線、相手が CDP/LLDP 無効、非 Cisco(CDP 非対応) |
| 資料にないのに出力にある機器 | 無断接続、資料の更新漏れ |

- 非 Cisco 機器との間は LLDP を使う
- セキュリティ上、外部(ISP、ユーザ端末側)に向くポートでは CDP / LLDP を無効にする。機種や OS バージョンが漏れるため

> **【2.3 まとめ】**
>
> - CDP は Cisco 独自・既定で有効・60 / 180 秒。LLDP は標準・既定で無効・30 / 120 秒
> - 直接接続の隣接機器だけが見える
> - Local Intrfce = 自分、Port ID = 相手
> - IP アドレスと OS バージョンは `detail`
> - `no cdp run`(全体)、`no cdp enable`(IF)、`lldp run`、`lldp transmit` / `receive`

## 2.4 show コマンド、ping、拡張 ping、traceroute、パケットキャプチャ出力による L2 / L3 のトラブルシュート

### 1. 主な show コマンド

| 層 | コマンド | 確認すること |
|---|---|---|
| L1 | `show interfaces status` | connected / notconnect / err-disabled、速度、デュプレックス |
| L1 | `show interfaces g0/1` | エラーカウンタ |
| L2 | `show vlan brief` | VLAN の存在、ポートの所属 |
| L2 | `show interfaces trunk` | トランク状態、許可 VLAN、ネイティブ VLAN |
| L2 | `show interfaces g0/1 switchport` | 動作モード、アクセス VLAN、音声 VLAN |
| L2 | `show mac address-table` | MAC の学習先ポート |
| L2 | `show spanning-tree vlan 10` | ルートブリッジ、ポートの役割・状態 |
| L2 | `show etherchannel summary` | 束ねの状態 |
| L2 | `show cdp neighbors` | 隣接機器 |
| L2/L3 | `show ip arp`(`show arp`) | IP と MAC の対応 |
| L3 | `show ip interface brief` | IP アドレス、up/down |
| L3 | `show ip route` | 経路の有無 |
| L3 | `show ip protocols` | 動作中のルーティングプロトコル |
| 全般 | `show running-config`、`show startup-config` | 設定 |
| 全般 | `show version` | OS バージョン、稼働時間、再起動理由 |
| 全般 | **`show logging`** | ログ(→ 5.6) |
| 全般 | `show errdisable recovery`、`show interfaces status err-disabled` | err-disabled の原因 |

出力の絞り込み: `| include`、`| exclude`、`| begin`、`| section`。

**ログから読み取る例**

| メッセージ | 意味 |
|---|---|
| `%LINK-3-UPDOWN: Interface Gi0/1, changed state to down` | 物理層の状態変化 |
| `%LINEPROTO-5-UPDOWN: Line protocol on Interface Gi0/1, changed state to up` | L2 の状態変化 |
| `%CDP-4-NATIVE_VLAN_MISMATCH` | ネイティブ VLAN 不一致 |
| `%CDP-4-DUPLEX_MISMATCH` | デュプレックス不一致 |
| `%PM-4-ERR_DISABLE: bpduguard error detected on Gi0/5` | BPDU ガードで err-disabled |
| `%PM-4-ERR_DISABLE: psecure-violation error detected` | ポートセキュリティ違反 |
| `%SW_MATM-4-MACFLAP_NOTIF` | MAC アドレスが複数ポート間で移動。ループの疑い |
| `%OSPF-5-ADJCHG` | OSPF ネイバーの状態変化 |
| `%IP-4-DUPADDR` | IP アドレス重複 |
| `%SYS-5-CONFIG_I` | 設定変更があった |

### 2. ping

ICMP エコー要求(タイプ 8)を送り、エコー応答(タイプ 0)を待つ。

```
R1# ping 10.1.1.1
Sending 5, 100-byte ICMP Echos to 10.1.1.1, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/2/4 ms
```

| 記号 | 意味 |
|---|---|
| `!` | 応答あり |
| `.` | タイムアウト |
| `U` | 宛先到達不能(Destination Unreachable)を受信。途中のルータに経路がない、ACL で拒否 |
| `Q` | 送信元抑制 |
| `M` | フラグメント不可(DF ビット付きで MTU 超過) |
| `?` | 不明なパケット種別 |
| `&` | TTL 超過 |

`.!!!!` の最初の1回の失敗は ARP 解決待ち。正常。

| 結果 | 考えられる原因 |
|---|---|
| `.....` | 行きの経路はあるが戻りがない、相手が停止、途中で破棄、ファイアウォール |
| `U.U.U` | 途中のルータに経路がない、ACL で管理的に拒否 |
| `!.!.!` | 負荷分散された2経路の片方が不通、レート制限 |

### 3. 拡張 ping

`ping` だけを入力して対話形式で指定するか、1行で指定する。

```
R1# ping 10.2.2.2 source 192.168.1.1 repeat 100 size 1500 df-bit
R1# ping 10.2.2.2 source Loopback0
```

| 項目 | 用途 |
|---|---|
| `source` | **送信元アドレス(インターフェース)を指定**。LAN 側アドレスからの到達性を確認する |
| `repeat` | 回数。間欠障害の確認 |
| `size` | データグラムサイズ。MTU の確認 |
| `df-bit` | フラグメント禁止。`size` と組み合わせて経路 MTU を調べる |
| `timeout` | 待ち時間 |
| Sweep range of sizes | サイズを変えながら送る |

> **【重要】** 通常の ping の送信元は**出力インターフェースのアドレス**。ルータからの ping が通っても、LAN 上のホストから通るとは限らない。対向ルータが LAN のサブネットへの戻り経路を持っているかは、`source` に LAN 側アドレスを指定して確かめる。

### 4. traceroute

TTL を 1 から順に増やして送り、経路上の各ルータが返す ICMP 時間超過(タイプ 11)から経路を知る。

| OS | 送るパケット | 終点の応答 |
|---|---|---|
| Cisco IOS、Linux、macOS(`traceroute`) | UDP(あて先ポート 33434〜) | ICMP ポート到達不能 |
| Windows(`tracert`) | ICMP エコー要求 | ICMP エコー応答 |

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
| `!H` | ホスト到達不能 |
| `!N` | ネットワーク到達不能 |
| `!P` | プロトコル到達不能 |
| `!A`(`A`) | 管理的に禁止(ACL) |

- 最後に応答したルータの**次**が問題の箇所。そのルータに先の経路がないか、次のルータに戻りの経路がない
- 止めるには `Ctrl + Shift + 6`
- 拡張 traceroute で送信元、最大 TTL、プローブ数を指定できる
- 同じホップが交互に繰り返し表示されたら、ルーティングループ

### 5. パケットキャプチャ出力の読解

出題範囲は「出力を読むこと」。Wireshark や `tcpdump` の出力から、何が起きているかを判断する。

**見るフィールド**

| 層 | フィールド | 着眼点 |
|---|---|---|
| L2 | 送信元 / あて先 MAC | あて先が ffff.ffff.ffff ならブロードキャスト |
| L2 | 802.1Q タグ | VLAN ID。タグがなければネイティブ VLAN かアクセスポート |
| L2 | EtherType | 0x0800 IPv4、0x0806 ARP、0x86DD IPv6、0x8100 802.1Q |
| L3 | 送信元 / あて先 IP、TTL、プロトコル番号 | 1 ICMP、6 TCP、17 UDP、89 OSPF、50 ESP |
| L4 | 送信元 / あて先ポート | サービスの特定 |
| L4 | TCP フラグ、シーケンス番号、確認応答番号 | 接続の状態 |

**L2 ヘッダと L3 ヘッダの関係**: ルータを越えるたびに MAC アドレス(L2 ヘッダ)は付け替えられる。IP アドレスは(NAT がなければ)端から端まで変わらない。別サブネットあてのフレームのあて先 MAC は**デフォルトゲートウェイの MAC**。

**TCP のフラグ**

| フラグ | 意味 |
|---|---|
| SYN | 接続開始 |
| ACK | 確認応答 |
| FIN | 正常終了 |
| RST | 強制切断・拒否 |
| PSH | すぐにアプリケーションへ渡す |

| キャプチャに見える並び | 判断 |
|---|---|
| SYN → SYN,ACK → ACK | 3ウェイハンドシェイク成功。接続確立 |
| SYN → RST,ACK | ポートが閉じている。サービス停止、ホスト上で拒否 |
| SYN → SYN → SYN(再送のみ) | 応答なし。ファイアウォール・ACL で破棄、経路なし、相手停止 |
| FIN,ACK → ACK → FIN,ACK → ACK | 正常終了 |
| 同じシーケンス番号の再送、Dup ACK | パケットロス |

**プロトコルごとの並び**

| プロトコル | 正常な並び | 異常の例 |
|---|---|---|
| ARP | Request(ブロードキャスト)→ Reply(ユニキャスト) | Request だけが繰り返される → 相手不在、VLAN 違い |
| ICMP | Echo request → Echo reply | request だけ → 戻りなし。Destination unreachable → 経路なし |
| DHCP | Discover → Offer → Request → Ack | Discover だけ → サーバに届いていない |
| DNS | Query → Response | Response に NXDOMAIN → レコードなし。応答なし → サーバ不達 |

```
tcpdump の例
10:15:01.100 IP 192.168.1.10.51000 > 10.1.1.80.443: Flags [S], seq 100
10:15:02.101 IP 192.168.1.10.51000 > 10.1.1.80.443: Flags [S], seq 100
10:15:04.103 IP 192.168.1.10.51000 > 10.1.1.80.443: Flags [S], seq 100
```

SYN の再送だけで応答がない。途中で破棄されているか、相手に届いていない。

Cisco 機器でのキャプチャ手段: SPAN(`monitor session 1 source interface g0/1` / `destination interface g0/24`)でミラーして解析装置で採る。IOS XE の Embedded Packet Capture(`monitor capture`)で機器上で採る。

### 6. 切り分けの考え方

| 症状 | 確認 |
|---|---|
| 同一 VLAN 内で通らない | ポートの VLAN、VLAN の存在、トランクの許可 VLAN、MAC テーブル、STP の状態、err-disabled |
| 別 VLAN と通らない | ホストのゲートウェイ設定、SVI / サブインターフェースの up、`ip routing`、ACL |
| 別拠点と通らない | 経路(行きと戻り)、NAT、ACL。traceroute で止まる箇所を見る |
| 遅い | エラーカウンタ、デュプレックス不一致、ループ、輻輳 |

> **【2.4 まとめ】**
>
> - ping: `!` 成功、`.` タイムアウト、`U` 到達不能
> - 拡張 ping の `source` で LAN 側からの到達性(戻り経路)を確認
> - traceroute は TTL と ICMP 時間超過。IOS は UDP、Windows は ICMP
> - 最後に応答したホップの次が怪しい
> - SYN → RST はポート閉、SYN の再送だけは途中で破棄
> - ルータを越えると MAC は変わり、IP は変わらない
> - `show logging` のメッセージ名から原因を読む

## 2.5 Rapid PVST+ の動作を設定する

### 1. STP の目的

冗長な L2 リンクがあるとループが起き、ブロードキャストストーム、MAC テーブルの不安定化、フレームの重複が起きる。イーサネットフレームには TTL がないので止まらない。STP は一部のポートをブロックしてループのない木構造を作り、障害時にはブロックを解いて迂回させる。

| 方式 | 規格 | 特徴 |
|---|---|---|
| STP | 802.1D | 全 VLAN で1つ。収束 30〜50 秒 |
| PVST+ | Cisco | VLAN ごとに 802.1D |
| RSTP | 802.1w | 高速収束(数秒以内) |
| **Rapid PVST+** | Cisco | VLAN ごとに RSTP。Catalyst の標準 |
| MSTP | 802.1s | 複数 VLAN をインスタンスにまとめる |

```
spanning-tree mode rapid-pvst
```

### 2. ブリッジ ID と BPDU

スイッチは BPDU を交換してトポロジを決める。

**ブリッジ ID(8 バイト)= ブリッジプライオリティ(2 バイト)+ MAC アドレス(6 バイト)**

- プライオリティの上位 4 ビットが設定値、下位 12 ビットは拡張システム ID(VLAN ID)
- 設定値は **4096 の倍数**(0、4096、8192 … 61440)。既定は **32768**
- 表示されるプライオリティ = 設定値 + VLAN ID。VLAN 10 で既定なら 32778

### 2.5.a ルートブリッジ、ルートポート、その他のポート

**選出の手順**

| 順 | 決めるもの | 基準 |
|---|---|---|
| 1 | ルートブリッジ(VLAN ごとに1台) | ブリッジ ID が最小。プライオリティが同じなら MAC アドレスが小さいほう |
| 2 | ルートポート(非ルートブリッジごとに1つ) | ルートブリッジへのパスコストが最小のポート |
| 3 | 指定ポート(セグメントごとに1つ) | そのセグメントからルートへのコストが最小の側のポート |
| 4 | 残り | 非指定ポート(RSTP では代替ポート・バックアップポート)。ブロック |

**タイブレーク(ルートポート・指定ポートの決定で同点のとき)**

1. ルートパスコストが最小
2. 送信側(上流)のブリッジ ID が最小
3. 送信側のポート ID(ポートプライオリティ + ポート番号)が最小
4. 自分のポート ID が最小(同一スイッチから2本受ける場合)

**ポートコスト**

| 速度 | ショート方式(既定) | ロング方式 |
|---|---|---|
| 10 Mbps | 100 | 2,000,000 |
| 100 Mbps | 19 | 200,000 |
| 1 Gbps | 4 | 20,000 |
| 10 Gbps | 2 | 2,000 |

ルートパスコストは、ルートブリッジまでの経路上で BPDU を**受信するポート**のコストの合計。ルートブリッジの全ポートは指定ポート。

**設定**

```
spanning-tree vlan 10 priority 4096            ! 値を直接指定
spanning-tree vlan 10 root primary             ! ルートになるよう自動設定
spanning-tree vlan 10 root secondary           ! 予備ルート
!
interface GigabitEthernet0/1
 spanning-tree vlan 10 cost 10                 ! ポートコスト
 spanning-tree vlan 10 port-priority 64        ! ポートプライオリティ(16 の倍数、既定 128)
```

| コマンド | 設定されるプライオリティ |
|---|---|
| `root primary` | 現在のルートが 24576 より大きければ **24576**。そうでなければ現在のルートより 4096 小さい値 |
| `root secondary` | **28672** |

`root primary` はマクロ。実行時点の値を設定するだけで、後から別のスイッチがより小さい値にしても追従しない。

- ルートブリッジは、ディストリビューション層(コア層)の高性能なスイッチに明示的に設定する。既定のままだと最も MAC アドレスが小さい(古い)スイッチがルートになる
- ポートコストは**自分のルートポートの選択**に、ポートプライオリティは**下流スイッチのルートポートの選択**に影響する

### 2.5.b ポートの状態と役割

**ポートの状態**

| 802.1D(STP) | 802.1w(RSTP) | MAC 学習 | フレーム転送 |
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
| 代替ポート | Altn | ルートポートの予備。別のスイッチからより良い BPDU を受信。ディスカーディング |
| バックアップポート | Back | 指定ポートの予備。**自分自身**の BPDU を受信(ハブ経由など)。ディスカーディング |

**802.1D のタイマー**(参考)

| タイマー | 既定 | 内容 |
|---|---|---|
| Hello | 2 秒 | BPDU の送信間隔 |
| Forward Delay | 15 秒 | リスニング、ラーニングそれぞれの時間 |
| Max Age | 20 秒 | BPDU を保持する時間 |

802.1D の収束は最大 50 秒(Max Age 20 + リスニング 15 + ラーニング 15)。

**RSTP が速い理由**

- タイマー待ちではなく、**プロポーザル / アグリーメント**のやり取りで即座に遷移する(ポイントツーポイントリンク)
- 代替ポートを事前に決めておき、ルートポート障害時に即切り替える
- すべてのスイッチが Hello 間隔で BPDU を送る。3回(6 秒)連続で受信できなければ隣接断と判断する
- エッジポート(PortFast)は即フォワーディング

**リンクタイプ**

| 種別 | 判定 | 表示 |
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
| 動作モード | `protocol rstp`(Rapid PVST+)、`ieee`(PVST+) |
| ルートブリッジ | Root ID。4106 = 4096 + VLAN 10 |
| 自分がルートか | Root ID と Bridge ID が同じなら自分。`This bridge is the root` と表示される |
| ルートへのコストとポート | Root ID の Cost、Port |
| 各ポートの役割・状態 | Role、Sts |
| PortFast | Type の `Edge` |

```
show spanning-tree summary          ! モード、PortFast / BPDU ガードの既定、ポート数
show spanning-tree root             ! VLAN ごとのルート
show spanning-tree interface g0/1 detail
show spanning-tree inconsistentports
```

### 2.5.c PortFast

端末を接続するポートを、リスニング・ラーニングを経ずに即フォワーディングにする。RSTP ではエッジポートになる。

```
interface GigabitEthernet0/5
 spanning-tree portfast                 ! アクセスポート用
 spanning-tree portfast trunk           ! トランク用(サーバ、ハイパーバイザ)
!
spanning-tree portfast default          ! グローバル。全アクセスポートで有効
```

- 新しい IOS では `spanning-tree portfast edge`、`spanning-tree portfast edge trunk` と表記する
- 端末が DHCP を取得できない(STP の遷移待ちでタイムアウト)問題を解消する
- エッジポートの up/down ではトポロジ変更通知(TCN)が発生しない
- PortFast のポートが BPDU を受信すると、エッジの扱いをやめて通常の STP ポートになる
- **スイッチを接続するポートには設定しない**。一時的なループの原因になる

### 2.5.d ルートガード、ループガード、BPDU ガード

| 機能 | 設定する場所 | 発動条件 | 動作 | 復旧 |
|---|---|---|---|---|
| **BPDU ガード** | PortFast のエッジポート | BPDU を受信 | **err-disabled** | 手動(shut / no shut)または errdisable recovery |
| **ルートガード** | ルートになってほしくないスイッチに向く指定ポート | より優位な(superior)BPDU を受信 | **root-inconsistent**(ブロック) | 優位な BPDU が止まれば自動 |
| **ループガード** | ルートポート、代替ポート(非指定ポート) | BPDU が届かなくなる | **loop-inconsistent**(ブロック) | BPDU を再び受信すれば自動 |
| BPDU フィルタ | エッジポート | — | BPDU を送受信しない | —(STP を無効にするのと同じ。危険) |

```
! BPDU ガード
interface GigabitEthernet0/5
 spanning-tree bpduguard enable
!
spanning-tree portfast bpduguard default     ! グローバル。PortFast の全ポートで有効
!
! ルートガード
interface GigabitEthernet0/20
 spanning-tree guard root
!
! ループガード
interface GigabitEthernet0/24
 spanning-tree guard loop
!
spanning-tree loopguard default              ! グローバル
```

**BPDU ガード**: 端末用ポートにスイッチが無断で接続されるのを防ぐ。

```
%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi0/5 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Gi0/5, putting Gi0/5 in err-disable state
```

```
! 復旧
interface GigabitEthernet0/5
 shutdown
 no shutdown
!
! 自動復旧
errdisable recovery cause bpduguard
errdisable recovery interval 300            ! 秒。既定 300
```

原因(接続されたスイッチ)を取り除かずに復旧しても、再び err-disabled になる。

**ルートガード**: 配下のスイッチがより小さいプライオリティを設定しても、ルートブリッジの位置を変えさせない。ポートは BPDU を受け続ける間だけブロックされ、err-disabled にはならない。

```
%SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port Gi0/20 on VLAN0010.
```

**ループガード**: 単方向リンク障害(光ファイバの片側断など)で BPDU が届かなくなると、通常の STP は非指定ポートを指定ポートに遷移させ、ループが起きる。ループガードはこの遷移を止める。

- ルートガードとループガードは同じポートに同時に設定できない
- ループガードと似た目的の機能に UDLD がある

> **【2.5 まとめ】**
>
> - ルートブリッジはブリッジ ID 最小。プライオリティ既定 32768、4096 刻み
> - `root primary` は 24576、`root secondary` は 28672
> - コスト: 10M 100、100M 19、1G 4、10G 2
> - タイブレーク: コスト → 上流のブリッジ ID → 上流のポート ID
> - RSTP の状態は Discarding / Learning / Forwarding。役割は Root / Desg / Altn / Back
> - PortFast は端末ポートだけ。トランクの端末は `portfast trunk`
> - BPDU ガード → err-disabled。ルートガード → root-inconsistent。ループガード → loop-inconsistent
> - `show spanning-tree vlan N` で Root ID、Bridge ID、Role、Sts を読む
