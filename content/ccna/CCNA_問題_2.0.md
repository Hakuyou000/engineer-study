# CCNA 問題 2.0 スイッチングとネットワークアクセス

対象: 200-301 CCNA v2.0 / 全36問 / すべてオリジナル問題
対応テキスト: `CCNA_2.0_スイッチングとネットワークアクセス.md`
解答・解説は末尾。

## 問題

### 2.0 / 2.1 スイッチの基本、トランク、EtherChannel、SVI

**問1** スイッチが、MAC アドレステーブルにないあて先 MAC アドレスのユニキャストフレームを VLAN 10 のポートで受信した。動作はどれか。

- A. フレームを破棄する
- B. 全 VLAN の全ポートに転送する
- C. 受信ポートを除く、VLAN 10 の全ポート(VLAN 10 を許可するトランクを含む)に転送する
- D. デフォルトゲートウェイに転送する

**問2** トランクポート Gi0/24 は VLAN 10 と 20 を許可している。VLAN 30 を追加するつもりで `switchport trunk allowed vlan 30` を実行した。結果はどれか。

- A. VLAN 10、20、30 が許可される
- B. 全 VLAN が許可される
- C. コマンドがエラーになる
- D. VLAN 30 だけが許可される

**問3** SW1 の Gi0/1 と SW2 の Gi0/1 を接続した。両方とも `switchport mode dynamic auto` である。リンクの動作はどれか。

- A. トランク
- B. アクセス
- C. err-disabled
- D. ルーテッドポート

**問4** SW1 に次のログが出た。意味はどれか。

```
%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/24 (1), with SW2 GigabitEthernet0/24 (99).
```

- A. SW1 のネイティブ VLAN が 99、SW2 が 1
- B. トランクの許可 VLAN が一致していない
- C. VLAN 99 が SW1 に存在しない
- D. SW1 のネイティブ VLAN が 1、SW2 が 99

**問5** VLAN 30 のホストだけがスイッチ間で通信できない。SW1 の出力は次のとおり。原因はどれか。

```
Port      Vlans allowed on trunk
Gi0/24    10,20,30

Port      Vlans allowed and active in management domain
Gi0/24    10,20
```

- A. SW1 に VLAN 30 が作成されていない(または active でない)
- B. トランクの許可リストに VLAN 30 がない
- C. ネイティブ VLAN が不一致
- D. STP が VLAN 30 をブロックしている

**問6** ルータオンアスティックで VLAN 20(192.168.20.0/24)のゲートウェイを設定する。正しいものはどれか。

- A. `interface g0/0.20` → `ip address 192.168.20.1 255.255.255.0` → `switchport access vlan 20`
- B. `interface vlan 20` → `encapsulation dot1Q 20` → `ip address 192.168.20.1 255.255.255.0`
- C. `interface g0/0` → `switchport mode trunk` → `ip address 192.168.20.1 255.255.255.0`
- D. `interface g0/0.20` → `encapsulation dot1Q 20` → `ip address 192.168.20.1 255.255.255.0`

**問7** ルータオンアスティック構成で、VLAN 10 のホストはゲートウェイに ping が通るが、VLAN 20 のホストは通らない。スイッチ側のトランクと VLAN は正しい。ルータの設定は次のとおり。原因はどれか。

```
interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0
interface GigabitEthernet0/0.20
 encapsulation dot1Q 200
 ip address 192.168.20.1 255.255.255.0
```

- A. G0/0.20 のカプセル化の VLAN ID が 200 になっている
- B. サブインターフェース番号と VLAN ID は一致させる必要があり、.20 が誤り
- C. 物理インターフェースに IP アドレスがない
- D. `ip routing` が設定されていない

**問8** SW1 と SW2 の間に EtherChannel を作る。両方のスイッチで `channel-group 1 mode passive` を設定した。結果はどれか。

- A. LACP で EtherChannel が成立する
- B. PAgP で EtherChannel が成立する
- C. EtherChannel は成立しない
- D. 静的な EtherChannel として成立する

**問9** SW1 は `channel-group 1 mode on`、SW2 は `channel-group 1 mode active` である。結果はどれか。

- A. 成立する。on はどのモードとも組める
- B. PAgP で成立する
- C. 成立する。SW2 が自動で on に切り替わる
- D. 成立しない。on は LACP を送らないので、対向も on でなければならない

**問10** 次の出力から読み取れることはどれか。

```
Group  Port-channel  Protocol    Ports
------+-------------+-----------+---------------------
1      Po1(SU)       LACP        Gi0/1(P)    Gi0/2(s)
```

- A. Po1 は L2 で動作中。Gi0/2 は設定の不一致などでサスペンドされている
- B. Po1 は L3 で、両方のポートが束ねられている
- C. Po1 はダウンしている
- D. Gi0/2 はホットスタンバイである

**問11** L3 EtherChannel を設定する。IP アドレスを設定する場所として正しいものはどれか。

- A. 各メンバーの物理インターフェース
- B. SVI
- C. `no switchport` にした Port-channel インターフェース
- D. どこにも設定しない

**問12** L3 スイッチで `interface Vlan30` を作成し、IP アドレスを設定して `no shutdown` したが、状態が down/down である。原因として考えられるものを**2つ**選べ。

- A. VLAN 30 がスイッチに作成されていない
- B. `ip routing` が設定されていない
- C. VLAN 30 に属する up 状態のポート(アクセスポート、または VLAN 30 を許可するトランク)がない
- D. SVI に `switchport mode access` が設定されていない

**問13** L2 スイッチの管理用 SVI(192.168.99.2/24)に、同じサブネットからは SSH できるが、別のサブネットからはできない。追加する設定はどれか。

- A. `ip routing`
- B. `switchport mode trunk`
- C. `ip helper-address 192.168.99.1`
- D. `ip default-gateway 192.168.99.1`

**問14** L3 スイッチに SVI Vlan10 と Vlan20 があり、どちらも up/up である。各 VLAN のホストは自分のゲートウェイには ping が通るが、別の VLAN のホストには通らない。ホスト側の設定は正しい。不足している設定はどれか。

- A. `ip routing`
- B. `ip default-gateway`
- C. `switchport trunk encapsulation dot1q`
- D. `spanning-tree portfast`

### 2.2 エッジポート

**問15** 最大 30 W を給電できる PoE の規格はどれか。

- A. IEEE 802.3af
- B. IEEE 802.3at
- C. IEEE 802.3ab
- D. IEEE 802.3ad

**問16** 新しく接続した AP が起動しない。`show power inline` の Oper 列が `power-deny` である。原因はどれか。

- A. スイッチの電力予算が不足している
- B. ポートが `power inline never` に設定されている
- C. AP が PoE に対応していない
- D. ポートが shutdown されている

**問17** ローカルモードの Lightweight AP を接続するスイッチポートの設定として、一般的なものはどれか。

- A. AP 管理用 VLAN のアクセスポート
- B. 全 WLAN の VLAN を許可するトランクポート
- C. ルーテッドポート
- D. LACP のポートチャネル

**問18** AP と WLC の間の CAPWAP が使うポートはどれか。

- A. TCP 5246(制御)、TCP 5247(データ)
- B. UDP 1812(制御)、UDP 1813(データ)
- C. UDP 5246(制御)、UDP 5247(データ)
- D. UDP 161(制御)、UDP 162(データ)

**問19** Gi0/6 に IP 電話を接続し、電話の PC ポートに PC を接続する。PC は VLAN 10、音声は VLAN 20 とする。正しい設定はどれか。

- A. `switchport mode trunk` / `switchport trunk allowed vlan 10,20`
- B. `switchport mode access` / `switchport access vlan 10,20`
- C. `switchport mode access` / `switchport access vlan 20` / `switchport voice vlan 10`
- D. `switchport mode access` / `switchport access vlan 10` / `switchport voice vlan 20`

**問20** 複数の VLAN の VM を収容するハイパーバイザホストを接続する。接続直後から通信でき、かつ STP の遷移待ちを避ける設定はどれか。

- A. `switchport mode trunk` / `spanning-tree portfast trunk`
- B. `switchport mode access` / `spanning-tree portfast`
- C. `switchport mode trunk` / `spanning-tree guard root`
- D. `no switchport` / `spanning-tree bpduguard enable`

### 2.3 CDP / LLDP

**問21** SW1 で次の出力を得た。正しい読み取りはどれか。

```
Device ID    Local Intrfce   Holdtme   Capability   Platform    Port ID
SW2          Gig 0/1         152       S I          WS-C2960X   Gig 0/24
```

- A. SW1 の Gi0/24 が SW2 の Gi0/1 に接続されている
- B. SW2 は 152 秒前に接続された
- C. SW1 の Gi0/1 が SW2 の Gi0/24 に接続されている
- D. SW2 はルータである

**問22** 隣接機器の管理 IP アドレスと IOS のバージョンを、ログインせずに確認したい。使うコマンドはどれか。

- A. `show cdp neighbors`
- B. `show mac address-table`
- C. `show cdp interface`
- D. `show cdp neighbors detail`

**問23** Cisco スイッチと他社製スイッチの間の接続を、結線表と突き合わせて検証したい。Cisco スイッチで最初に必要な設定はどれか。

- A. `lldp run`
- B. `cdp run`
- C. `no cdp enable`
- D. `lldp reinit 2`

**問24** 構成図では SW1 の Gi0/3 に R2 が接続されているはずだが、`show cdp neighbors` に R2 が表示されない。Gi0/3 は up/up である。考えられる原因として**適切でない**ものはどれか。

- A. R2 側で CDP が無効になっている
- B. Gi0/3 に実際には別の非 Cisco 機器が接続されている
- C. SW1 の Gi0/3 に `no cdp enable` が設定されている
- D. R2 が2ホップ先のルータであり、CDP は IP ルーティングで中継される

### 2.4 トラブルシュート

**問25** ルータで ping を実行した結果が `U.U.U` だった。意味はどれか。

- A. すべて成功した
- B. ARP の解決待ち
- C. 宛先到達不能の ICMP メッセージを受信した。途中のルータに経路がない、または ACL で拒否されている
- D. MTU を超過した

**問26** R1 から R2 の LAN 上のサーバへの通常の ping は成功するが、R1 の LAN 上の PC からは同じサーバに届かない。R1 で原因を確かめる方法として最も適切なものはどれか。

- A. `ping <サーバ> repeat 1000`
- B. `ping <サーバ> source <R1 の LAN 側インターフェース>`
- C. `ping <サーバ> size 1500 df-bit`
- D. `show cdp neighbors`

**問27** R1 での traceroute の結果は次のとおり。調べる箇所として最も適切なものはどれか。

```
  1 10.0.12.2 1 msec 1 msec 0 msec
  2 10.0.23.3 2 msec 2 msec 1 msec
  3  *  *  *
  4  *  *  *
```

- A. R1 のデフォルトゲートウェイ
- B. 10.0.12.2 のルータの、送信元への戻り経路
- C. 10.0.23.3 のルータの、あて先への経路、およびその次のルータ
- D. R1 のインターフェースのデュプレックス

**問28** クライアントからサーバの TCP 443 への接続が失敗する。クライアント側のキャプチャは次のとおり。判断として最も適切なものはどれか。

```
192.168.1.10.51000 > 10.1.1.80.443: Flags [S]
10.1.1.80.443 > 192.168.1.10.51000: Flags [R.]
```

- A. 経路上のファイアウォールがパケットを黙って破棄している
- B. サーバには到達しているが、443 番ポートで待ち受けているサービスがない(または拒否されている)
- C. DNS の名前解決に失敗している
- D. 3ウェイハンドシェイクが成功している

**問29** ホスト 192.168.1.10/24(ゲートウェイ 192.168.1.1)が 10.2.2.2 に ping を送る。ホストが送出するフレームのあて先 MAC アドレスはどれか。

- A. 10.2.2.2 のホストの MAC アドレス
- B. 192.168.1.1(デフォルトゲートウェイ)の MAC アドレス
- C. ffff.ffff.ffff
- D. スイッチの MAC アドレス

### 2.5 Rapid PVST+

**問30** VLAN 10 でルートブリッジになるスイッチはどれか。

| スイッチ | プライオリティ | MAC アドレス |
|---|---|---|
| SW1 | 32768 | 0c00.0000.0003 |
| SW2 | 32768 | 0c00.0000.0001 |
| SW3 | 28672 | 0c00.0000.0005 |

- A. SW1
- B. SW2
- C. SW3
- D. 決まらない

**問31** 現在のルートブリッジのプライオリティは既定値(32768)である。別のスイッチで `spanning-tree vlan 10 root primary` を実行した。このスイッチに設定されるプライオリティはどれか。

- A. 0
- B. 4096
- C. 24576
- D. 28672

**問32** SW3 は、ルートブリッジ SW1 に Gi0/1(1 Gbps)で直結し、SW2 に Fa0/2(100 Mbps)で接続している。SW2 は SW1 に 1 Gbps で直結している。コストは既定(ショート方式)。SW3 のルートポートと、そのルートパスコストはどれか。

- A. Gi0/1、コスト 4
- B. Fa0/2、コスト 19
- C. Fa0/2、コスト 23
- D. Gi0/1、コスト 8

**問33** Rapid PVST+ のポート状態として正しい組み合わせはどれか。

- A. Blocking、Listening、Learning、Forwarding
- B. Discarding、Learning、Forwarding
- C. Disabled、Blocking、Forwarding
- D. Discarding、Listening、Forwarding

**問34** PortFast と BPDU ガードを設定した端末用ポートに、利用者が小型スイッチを接続した。ポートの状態と、復旧の方法はどれか。

- A. root-inconsistent。BPDU が止まれば自動で復旧する
- B. err-disabled。原因を取り除き、`shutdown` → `no shutdown` する(または errdisable recovery を設定する)
- C. loop-inconsistent。`clear spanning-tree detected-protocols` を実行する
- D. Forwarding のまま。何もしなくてよい

**問35** ディストリビューションスイッチで、アクセススイッチに向くポートに設定し、配下のスイッチがルートブリッジになることを防ぐ機能と、発動時のポートの状態はどれか。

- A. BPDU ガード / err-disabled
- B. ルートガード / root-inconsistent
- C. ループガード / loop-inconsistent
- D. PortFast / Forwarding

**問36** SW2 の出力は次のとおり。正しい読み取りはどれか。

```
VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    4106
             Address     0c1a.2b00.0001
             Cost        4
             Port        24 (GigabitEthernet0/24)
  Bridge ID  Priority    32778  (priority 32768 sys-id-ext 10)
             Address     0c1a.2b00.0002

Interface        Role Sts Cost      Prio.Nbr Type
---------------- ---- --- --------- -------- ---------
Gi0/1            Desg FWD 4         128.1    P2p Edge
Gi0/23           Altn BLK 4         128.23   P2p
Gi0/24           Root FWD 4         128.24   P2p
```

- A. SW2 がルートブリッジである
- B. ルートブリッジのプライオリティ設定値は 4096。SW2 のルートポートは Gi0/24 で、Gi0/23 はその予備としてブロックされている
- C. Gi0/1 にはスイッチが接続されている
- D. 動作モードは PVST+(802.1D)である

## 解答・解説

| 問 | 正解 | 解説 |
|---|---|---|
| 1 | C | 未知のユニキャストは同一 VLAN 内にフラッディングする。受信ポートには返さない。 |
| 2 | D | `add` を付けないと許可リストが置き換わる。 |
| 3 | B | dynamic auto は受け身。auto 同士ではトランクにならず、アクセスとして動作する。 |
| 4 | D | 括弧内がそれぞれのネイティブ VLAN。自分(Gi0/24)が 1、相手が 99。 |
| 5 | A | 許可リストにはあるが「allowed and active」にない。VLAN がスイッチに存在しない。 |
| 6 | D | サブインターフェースで `encapsulation dot1Q` を先に設定し、IP アドレスを付ける。ルータに switchport コマンドはない。 |
| 7 | A | VLAN を決めるのは `encapsulation dot1Q` の値。サブインターフェース番号は任意(一致させるのは慣習)。 |
| 8 | C | passive 同士はどちらも交渉を始めない。少なくとも片側を active にする。 |
| 9 | D | on は交渉プロトコルを使わない。on は on とだけ組める。 |
| 10 | A | S は L2、U は使用中、P は束ね済み、s はサスペンド。速度・VLAN などの不一致を調べる。 |
| 11 | C | 物理ポートを `no switchport` にしてチャネルグループに入れ、Port-channel に IP アドレスを付ける。 |
| 12 | A、C | SVI は VLAN が存在し、その VLAN の up ポートがあると up になる。`ip routing` は SVI の up/down に関係しない。 |
| 13 | D | L2 スイッチが別サブネットへ返信するにはデフォルトゲートウェイが要る。 |
| 14 | A | L3 スイッチは `ip routing` で VLAN 間ルーティングを有効にする。 |
| 15 | B | 802.3at(PoE+)が 30 W。af は 15.4 W。ab は 1000BASE-T、ad は LACP。 |
| 16 | A | power-deny は電力予算の不足で給電を拒否した状態。 |
| 17 | A | ローカルモードはデータを CAPWAP で WLC へ送るので、AP のポートはアクセスでよい。FlexConnect と自律型はトランク。 |
| 18 | C | CAPWAP は UDP 5246(制御)と 5247(データ)。 |
| 19 | D | ポートはアクセスモードのまま、データ VLAN と音声 VLAN を指定する。 |
| 20 | A | 複数 VLAN を運ぶのでトランク。ホストはループを作らないので `portfast trunk` を使う。 |
| 21 | C | Local Intrfce は自分側、Port ID は相手側。Holdtme は保持の残り秒数。S はスイッチ。 |
| 22 | D | IP アドレスとバージョンは detail で表示される。 |
| 23 | A | 他社製機器は CDP を話さない。LLDP を有効にする。Cisco では LLDP は既定で無効のことが多い。 |
| 24 | D | CDP は L2 で直接接続の隣接機器だけに届く。ルーティングでは中継されない。 |
| 25 | C | U は Destination Unreachable の受信。 |
| 26 | B | 通常の ping の送信元は出力インターフェース。LAN 側を送信元にして、R2 側の戻り経路の有無を確かめる。 |
| 27 | C | 最後に応答したホップ(10.0.23.3)の先に問題がある。そのルータに先の経路がないか、次のルータに戻りの経路がない。 |
| 28 | B | SYN に対して RST,ACK が返っている。相手ホストには届いており、ポートが閉じている。黙って破棄なら SYN の再送だけが見える。 |
| 29 | B | 別サブネットあてのフレームはデフォルトゲートウェイの MAC あてに送る。あて先 IP は 10.2.2.2 のまま。 |
| 30 | C | まずプライオリティが小さいスイッチ。SW3 の 28672 が最小。MAC アドレスの比較は同値のときだけ。 |
| 31 | C | 現在のルートが 24576 より大きければ 24576 を設定する。 |
| 32 | A | Gi0/1 経由は 4。Fa0/2 経由は 19 + 4 = 23。小さいほうがルートポート。 |
| 33 | B | RSTP は3状態。A は 802.1D。 |
| 34 | B | BPDU ガードは BPDU を受信するとポートを err-disabled にする。 |
| 35 | B | ルートガードは優位な BPDU を受けたポートを root-inconsistent にする。 |
| 36 | B | 4106 = 4096 + VLAN 10。Root ID と Bridge ID が異なるので SW2 はルートではない。Altn は代替ポート。Edge は PortFast(端末)。rstp は Rapid PVST+。 |
