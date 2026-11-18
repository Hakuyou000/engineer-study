# CCNA 問題 2.0 スイッチングとネットワークアクセス

対象: 200-301 CCNA v2.0 / 全37問 / すべてオリジナル問題
対応テキスト: `CCNA_2.0_スイッチングとネットワークアクセス.md`
解答・解説は末尾。

## 問題

### 2.0 / 2.1 スイッチの基本、トランク、EtherChannel、SVI

**問1** `CCNA-2.0-001` スイッチが VLAN 10 のポートで、ユニキャストフレームを受信した。フレームのあて先 MAC アドレスは、MAC アドレステーブルに登録されていない。スイッチの動作はどれか。

- A. フレームを破棄する
- B. 全 VLAN の全ポートに転送する
- C. 受信ポートを除く、VLAN 10 の全ポート(VLAN 10 を許可するトランクを含む)に転送する
- D. デフォルトゲートウェイに転送する

**問2** `CCNA-2.0-002` トランクポート Gi0/24 では、VLAN 10 と 20 の通過を許可している。VLAN 30 を追加するつもりで `switchport trunk allowed vlan 30` を実行した。結果はどれか。

- A. VLAN 10、20、30 が許可される
- B. 全 VLAN が許可される
- C. コマンドがエラーになる
- D. VLAN 30 だけが許可される

**問3** `CCNA-2.0-003` スイッチ SW1 の Gi0/1 と SW2 の Gi0/1 を接続した。どちらのポートも `switchport mode dynamic auto` である。このリンクはどのように動作するか。

- A. トランク
- B. アクセス
- C. err-disabled
- D. ルーテッドポート

**問4** `CCNA-2.0-004` スイッチ SW1 に次のログが表示された。このログの意味はどれか。

```
%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/24 (1), with SW2 GigabitEthernet0/24 (99).
```

- A. SW1 のネイティブ VLAN が 99、SW2 が 1
- B. トランクの許可 VLAN が一致していない
- C. VLAN 99 が SW1 に存在しない
- D. SW1 のネイティブ VLAN が 1、SW2 が 99

**問5** `CCNA-2.0-005` VLAN 30 のホストだけが、スイッチをまたいで通信できない。SW1 で `show interfaces trunk` を実行した結果の一部は次のとおり。原因はどれか。

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

**問6** `CCNA-2.0-006` ルーターオンアスティック(1本のトランクで複数の VLAN 間をルーティングする構成)で、VLAN 20(192.168.20.0/24)のゲートウェイを設定する。正しい設定はどれか。

- A. `interface g0/0.20` → `ip address 192.168.20.1 255.255.255.0` → `switchport access vlan 20`
- B. `interface vlan 20` → `encapsulation dot1Q 20` → `ip address 192.168.20.1 255.255.255.0`
- C. `interface g0/0` → `switchport mode trunk` → `ip address 192.168.20.1 255.255.255.0`
- D. `interface g0/0.20` → `encapsulation dot1Q 20` → `ip address 192.168.20.1 255.255.255.0`

**問7** `CCNA-2.0-007` ルーターオンアスティック構成で、VLAN 10 のホストはゲートウェイに ping が通るが、VLAN 20 のホストは通らない。スイッチ側のトランクと VLAN は正しい。ルーターの設定は次のとおり。原因はどれか。

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

**問8** `CCNA-2.0-008` SW1 と SW2 の間に EtherChannel(複数のリンクを1本にまとめる機能)を作る。両方のスイッチで `channel-group 1 mode passive` を設定した。結果はどれか。

- A. LACP で EtherChannel が成立する
- B. PAgP で EtherChannel が成立する
- C. EtherChannel は成立しない
- D. 静的な EtherChannel として成立する

**問9** `CCNA-2.0-009` EtherChannel の設定で、SW1 は `channel-group 1 mode on`、SW2 は `channel-group 1 mode active` である。結果はどれか。

- A. 成立する。on はどのモードとも組める
- B. PAgP で成立する
- C. 成立する。SW2 が自動で on に切り替わる
- D. 成立しない。on は LACP を送らないので、対向も on でなければならない

**問10** `CCNA-2.0-010` `show etherchannel summary` の出力は次のとおり。この出力から読み取れることはどれか。

```
Group  Port-channel  Protocol    Ports
------+-------------+-----------+---------------------
1      Po1(SU)       LACP        Gi0/1(P)    Gi0/2(s)
```

- A. Po1 は L2 で動作中。Gi0/2 は設定の不一致などでサスペンドされている
- B. Po1 は L3 で、両方のポートが束ねられている
- C. Po1 はダウンしている
- D. Gi0/2 はホットスタンバイである

**問11** `CCNA-2.0-011` L3 EtherChannel(ルーティングするポートをまとめた EtherChannel)を設定する。IP アドレスを設定する場所として正しいものはどれか。

- A. 各メンバーの物理インターフェース
- B. SVI
- C. `no switchport` にした Port-channel インターフェース
- D. どこにも設定しない

**問12** `CCNA-2.0-012` L3 スイッチで `interface Vlan30`(SVI)を作成し、IP アドレスを設定して `no shutdown` したが、状態が down/down のままである。原因として考えられるものはどれか。(2つ選べ)

- A. VLAN 30 がスイッチに作成されていない
- B. `ip routing` が設定されていない
- C. VLAN 30 に属する up 状態のポート(アクセスポート、または VLAN 30 を許可するトランク)がない
- D. SVI に `switchport mode access` が設定されていない

**問13** `CCNA-2.0-013` L2 スイッチの管理用 SVI(192.168.99.2/24)に、同じサブネットからは SSH で接続できるが、別のサブネットからは接続できない。スイッチに追加すべき設定はどれか。

- A. `ip routing`
- B. `switchport mode trunk`
- C. `ip helper-address 192.168.99.1`
- D. `ip default-gateway 192.168.99.1`

**問14** `CCNA-2.0-014` L3 スイッチに SVI の Vlan10 と Vlan20 があり、どちらも up/up である。各 VLAN のホストは、自分のゲートウェイには ping が通るが、別の VLAN のホストには通らない。ホスト側の設定は正しい。スイッチに足りない設定はどれか。

- A. `ip routing`
- B. `ip default-gateway`
- C. `switchport trunk encapsulation dot1q`
- D. `spanning-tree portfast`

### 2.2 エッジポート

**問15** `CCNA-2.0-015` LAN ケーブルで電力を送る PoE の規格のうち、1ポートあたり最大 30 W を給電できるものはどれか。

- A. IEEE 802.3af
- B. IEEE 802.3at
- C. IEEE 802.3ab
- D. IEEE 802.3ad

**問16** `CCNA-2.0-016` スイッチに新しく接続したアクセスポイント(AP)が起動しない。`show power inline` で確認すると、Oper 列が `power-deny` である。原因はどれか。

- A. スイッチの電力予算が不足している
- B. ポートが `power inline never` に設定されている
- C. AP が PoE に対応していない
- D. ポートが shutdown されている

**問17** `CCNA-2.0-017` ローカルモードの Lightweight AP(WLC で集中管理される AP)を接続するスイッチのポートの設定として、一般的なものはどれか。

- A. AP 管理用 VLAN のアクセスポート
- B. 全 WLAN の VLAN を許可するトランクポート
- C. ルーテッドポート
- D. LACP のポートチャネル

**問18** `CCNA-2.0-018` AP と WLC(無線 LAN コントローラー)の間の CAPWAP が使うポートはどれか。

- A. TCP 5246(制御)、TCP 5247(データ)
- B. UDP 1812(制御)、UDP 1813(データ)
- C. UDP 5246(制御)、UDP 5247(データ)
- D. UDP 161(制御)、UDP 162(データ)

**問19** `CCNA-2.0-019` スイッチの Gi0/6 に IP 電話を接続し、電話の PC ポートに PC を接続する。PC の通信は VLAN 10、電話の音声は VLAN 20 にする。正しい設定はどれか。

- A. `switchport mode trunk` / `switchport trunk allowed vlan 10,20`
- B. `switchport mode access` / `switchport access vlan 10,20`
- C. `switchport mode access` / `switchport access vlan 20` / `switchport voice vlan 10`
- D. `switchport mode access` / `switchport access vlan 10` / `switchport voice vlan 20`

**問20** `CCNA-2.0-020` 複数の VLAN の VM が動くハイパーバイザーのホストを、スイッチに接続する。接続した直後から通信でき、STP の状態の遷移を待たずに済む設定はどれか。

- A. `switchport mode trunk` / `spanning-tree portfast trunk`
- B. `switchport mode access` / `spanning-tree portfast`
- C. `switchport mode trunk` / `spanning-tree guard root`
- D. `no switchport` / `spanning-tree bpduguard enable`

**問37** `CCNA-2.0-037` 複数の VLAN を扱うファイアウォールを、冗長化のために2本のリンクでスイッチに接続する。一般的な構成はどれか。

- A. 2本をそれぞれ別 VLAN のアクセスポートにする
- B. 2本を LACP のポートチャネルにしてトランクにし、VLAN ID とネイティブ VLAN をファイアウォール側と合わせる
- C. PortFast と BPDU ガードだけを設定する
- D. CAPWAP でトンネルを作る

### 2.3 CDP / LLDP

**問21** `CCNA-2.0-021` SW1 で `show cdp neighbors` を実行し、次の出力を得た。正しい読み取りはどれか。

```
Device ID    Local Intrfce   Holdtme   Capability   Platform    Port ID
SW2          Gig 0/1         152       S I          WS-C2960X   Gig 0/24
```

- A. SW1 の Gi0/24 が SW2 の Gi0/1 に接続されている
- B. SW2 は 152 秒前に接続された
- C. SW1 の Gi0/1 が SW2 の Gi0/24 に接続されている
- D. SW2 はルーターである

**問22** `CCNA-2.0-022` 隣にある Cisco 機器の管理 IP アドレスと IOS のバージョンを、その機器にログインせずに確認したい。使うコマンドはどれか。

- A. `show cdp neighbors`
- B. `show mac address-table`
- C. `show cdp interface`
- D. `show cdp neighbors detail`

**問23** `CCNA-2.0-023` Cisco のスイッチと他社製のスイッチの間の接続を、結線表と突き合わせて確認したい。Cisco のスイッチで最初に必要な設定はどれか。

- A. `lldp run`
- B. `cdp run`
- C. `no cdp enable`
- D. `lldp reinit 2`

**問24** `CCNA-2.0-024` 構成図では SW1 の Gi0/3 に R2 が接続されているはずだが、`show cdp neighbors` に R2 が表示されない。Gi0/3 は up/up である。考えられる原因として「適切でない」ものはどれか。

- A. R2 側で CDP が無効になっている
- B. Gi0/3 に実際には別の非 Cisco 機器が接続されている
- C. SW1 の Gi0/3 に `no cdp enable` が設定されている
- D. R2 が2ホップ先のルーターであり、CDP は IP ルーティングで中継される

### 2.4 トラブルシュート

**問25** `CCNA-2.0-025` ルーターで ping を実行したところ、結果が `U.U.U` と表示された。この意味はどれか。

- A. すべて成功した
- B. ARP の解決待ち
- C. 宛先到達不能の ICMP メッセージを受信した。途中のルーターに経路がない、または ACL で拒否されている
- D. MTU を超過した

**問26** `CCNA-2.0-026` ルーター R1 から、R2 の LAN にあるサーバーへの普通の ping は成功する。しかし、R1 の LAN にある PC からは同じサーバーに届かない。R1 で原因を確かめる方法として、最も適切なものはどれか。

- A. `ping <サーバー> repeat 1000`
- B. `ping <サーバー> source <R1 の LAN 側インターフェース>`
- C. `ping <サーバー> size 1500 df-bit`
- D. `show cdp neighbors`

**問27** `CCNA-2.0-027` R1 で traceroute を実行した結果は次のとおり。次に調べる箇所として最も適切なものはどれか。

```
  1 10.0.12.2 1 msec 1 msec 0 msec
  2 10.0.23.3 2 msec 2 msec 1 msec
  3  *  *  *
  4  *  *  *
```

- A. R1 のデフォルトゲートウェイ
- B. 10.0.12.2 のルーターの、送信元への戻り経路
- C. 10.0.23.3 のルーターの、あて先への経路、およびその次のルーター
- D. R1 のインターフェースのデュプレックス

**問28** `CCNA-2.0-028` クライアントから、サーバーの TCP 443 番ポートへの接続が失敗する。クライアント側でパケットをキャプチャした結果は次のとおり。判断として最も適切なものはどれか。

```
192.168.1.10.51000 > 10.1.1.80.443: Flags [S]
10.1.1.80.443 > 192.168.1.10.51000: Flags [R.]
```

- A. 経路上のファイアウォールがパケットを黙って破棄している
- B. サーバーには到達しているが、443 番ポートで待ち受けているサービスがない(または拒否されている)
- C. DNS の名前解決に失敗している
- D. 3ウェイハンドシェイクが成功している

**問29** `CCNA-2.0-029` ホスト 192.168.1.10/24(デフォルトゲートウェイは 192.168.1.1)が、10.2.2.2 に ping を送る。ホストが送り出すフレームの、あて先 MAC アドレスはどれか。

- A. 10.2.2.2 のホストの MAC アドレス
- B. 192.168.1.1(デフォルトゲートウェイ)の MAC アドレス
- C. ffff.ffff.ffff
- D. スイッチの MAC アドレス

### 2.5 Rapid PVST+

**問30** `CCNA-2.0-030` 3台のスイッチの VLAN 10 の STP の設定は、次のとおりである。ルートブリッジになるスイッチはどれか。

| スイッチ | プライオリティ | MAC アドレス |
|---|---|---|
| SW1 | 32768 | 0c00.0000.0003 |
| SW2 | 32768 | 0c00.0000.0001 |
| SW3 | 28672 | 0c00.0000.0005 |

- A. SW1
- B. SW2
- C. SW3
- D. 決まらない

**問31** `CCNA-2.0-031` VLAN 10 の現在のルートブリッジのプライオリティは、既定値の 32768 である。別のスイッチで `spanning-tree vlan 10 root primary` を実行した。このスイッチに設定されるプライオリティはどれか。

- A. 0
- B. 4096
- C. 24576
- D. 28672

**問32** `CCNA-2.0-032` SW3 は、ルートブリッジの SW1 に Gi0/1(1 Gbps)で直接つながり、SW2 に Fa0/2(100 Mbps)でつながっている。SW2 は SW1 に 1 Gbps で直接つながっている。STP のコストは既定(ショート方式。1 Gbps は 4、100 Mbps は 19)である。SW3 のルートポートと、ルートまでのコストの組み合わせはどれか。

- A. Gi0/1、コスト 4
- B. Fa0/2、コスト 19
- C. Fa0/2、コスト 23
- D. Gi0/1、コスト 8

**問33** `CCNA-2.0-033` Rapid PVST+ のポートの状態の組み合わせとして、正しいものはどれか。

- A. Blocking、Listening、Learning、Forwarding
- B. Discarding、Learning、Forwarding
- C. Disabled、Blocking、Forwarding
- D. Discarding、Listening、Forwarding

**問34** `CCNA-2.0-034` PortFast と BPDU ガードを設定した端末用のポートに、利用者が小型のスイッチを接続した。ポートの状態と、復旧の方法の組み合わせはどれか。

- A. root-inconsistent。BPDU が止まれば自動で復旧する
- B. err-disabled。原因を取り除き、`shutdown` → `no shutdown` する(または errdisable recovery を設定する)
- C. loop-inconsistent。`clear spanning-tree detected-protocols` を実行する
- D. Forwarding のまま。何もしなくてよい

**問35** `CCNA-2.0-035` ディストリビューションスイッチの、アクセススイッチにつながるポートに設定して、配下のスイッチがルートブリッジになるのを防ぐ機能はどれか。また、その機能が働いたときのポートの状態はどれか。

- A. BPDU ガード / err-disabled
- B. ルートガード / root-inconsistent
- C. ループガード / loop-inconsistent
- D. PortFast / Forwarding

**問36** `CCNA-2.0-036` SW2 で `show spanning-tree vlan 10` を実行した結果は次のとおり。正しい読み取りはどれか。

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
| 1 | C | あて先が MAC アドレステーブルにないフレームは、同じ VLAN のすべてのポートに送られます(フラッディング)。VLAN 10 を通すトランクも含みますが、受信したポートには送り返しません。他の VLAN のポートには送られず、スイッチはデフォルトゲートウェイを使いません。 |
| 2 | D | `switchport trunk allowed vlan 30` は許可リストを VLAN 30 だけに「置き換え」ます。そのため VLAN 10 と 20 が通れなくなります。追加するときは `switchport trunk allowed vlan add 30` と `add` を付けます。 |
| 3 | B | dynamic auto は「相手から誘われたらトランクになる」受け身のモードです。両方が auto だとどちらも誘わないので、トランクにならず、アクセスポートとして動作します。片方を desirable(自分から誘う)か trunk にすればトランクになります。 |
| 4 | D | ログを前から順に読みます。<br>① `%CDP-4-NATIVE_VLAN_MISMATCH`:CDP が、ネイティブ VLAN の不一致を見つけたというメッセージです。<br>② `on GigabitEthernet0/24 (1)`:ログを出した自分(SW1)の Gi0/24 と、そのネイティブ VLAN 1 です。<br>③ `with SW2 GigabitEthernet0/24 (99)`:相手(SW2)の Gi0/24 と、そのネイティブ VLAN 99 です。<br>④ つまり SW1 のネイティブ VLAN が 1、SW2 が 99 です。<br>SW1 が 99、SW2 が 1 と読むのは、括弧の数字を自分と相手で逆に対応させた誤りです。許可 VLAN の不一致や VLAN の未作成は、このログでは分かりません。 |
| 5 | A | 出力の 2 つの欄を比べます。<br>① `Vlans allowed on trunk` は 10,20,30:トランクの許可リストには VLAN 30 が入っています。そのため、許可リストに VLAN 30 がないという判断は誤りです。<br>② `Vlans allowed and active in management domain` は 10,20:VLAN 30 が抜けています。<br>③ この欄は、許可リストにあり、かつ SW1 に作成されて有効になっている VLAN を表します。VLAN 30 が抜けているので、SW1 に VLAN 30 が作成されていない(または active でない)と分かります。<br>④ `vlan 30` で VLAN を作成すると解決します。<br>ネイティブ VLAN の不一致は、VLAN 30 だけでなくネイティブ VLAN の通信に影響し、CDP のログで分かります。STP によるブロックなら、さらに下の欄(forwarding state and not pruned)で抜けます。 |
| 6 | D | ルーターオンアスティックでは、物理インターフェースの下にサブインターフェース(g0/0.20)を作り、まず `encapsulation dot1Q 20` でどの VLAN を扱うかを決めてから、IP アドレスを設定します。ルーターには `switchport` コマンドはなく、`interface vlan` は L3 スイッチの SVI です。 |
| 7 | A | 2 つのサブインターフェースの設定を比べます。<br>① G0/0.10:`encapsulation dot1Q 10` なので、VLAN 10 のタグが付いたフレームを扱います。VLAN 10 のホストが ping できるのと合っています。<br>② G0/0.20:`encapsulation dot1Q 200` なので、VLAN 200 のタグのフレームを扱います。<br>③ スイッチからは VLAN 20 のタグが付いたフレームが届きますが、VLAN 20 を扱うサブインターフェースがないため、受け取られません。<br>④ そのため、カプセル化の VLAN ID が 200 になっていることが原因です。`encapsulation dot1Q 20` に直します。<br>サブインターフェースの番号(.20)は自由に付けられ、VLAN ID と合わせるのは分かりやすさのための慣習です。物理インターフェースに IP アドレスは不要で、ルーターでは IPv4 のルーティングが既定で有効です。 |
| 8 | C | LACP の passive は「相手から交渉が来たら応じる」受け身のモードです。両方が passive だとどちらも交渉を始めないので、EtherChannel は成立しません。少なくとも片方を active にします。 |
| 9 | D | on は交渉のプロトコル(LACP や PAgP)を使わずに、まとめる設定です。active の側は LACP で交渉しようとしますが、on の側は応答しないので成立しません。on は、相手も on のときだけ成立します。 |
| 10 | A | 出力の記号を順に読みます。<br>① `Po1(SU)`:S は Layer2(L2 の EtherChannel)、U は in use(使用中)です。L3 なら R が付きます。Po1 は L2 で動作中なので、ダウンしているという読み取りは誤りです。<br>② `LACP`:LACP でネゴシエーションしています。<br>③ `Gi0/1(P)`:P は bundled in port-channel で、束ねられて動作中です。<br>④ `Gi0/2(s)`:小文字の s は suspended(一時停止)です。速度、デュプレックス、VLAN などの設定が他のメンバーと一致しない場合に起きます。<br>ホットスタンバイは小文字の H で表します。大文字の S(Layer2)と小文字の s(suspended)を取り違えないようにします。 |
| 11 | C | L3 EtherChannel では、物理ポートを `no switchport` にしてからチャネルグループに入れ、Port-channel インターフェースにも `no switchport` を設定して、そこに IP アドレスを付けます。各メンバーの物理ポートには IP アドレスを付けません。 |
| 12 | A、C | SVI が up になるには、その VLAN がスイッチに作成されていて、さらにその VLAN に属する up のポート(アクセスポートか、その VLAN を通すトランク)が1つ以上あることが必要です。`ip routing` は VLAN 間のルーティングの設定で、SVI の up/down には関係ありません。SVI に `switchport` のコマンドは設定できません。 |
| 13 | D | L2 スイッチはルーティングをしないので、別のサブネットへ返信するには、`ip default-gateway` でデフォルトゲートウェイを設定する必要があります。同じサブネットなら直接届くので、ゲートウェイがなくても接続できます。 |
| 14 | A | L3 スイッチで VLAN の間のルーティングを行うには、`ip routing` を設定します。この設定がないと、SVI が up でも VLAN をまたぐ通信は転送されません。`ip default-gateway` はルーティングをしないときに使う設定です。 |
| 15 | B | IEEE 802.3at(PoE+)は、1ポートあたり最大 30 W を給電できます。802.3af(PoE)は最大 15.4 W です。802.3ab は 1000BASE-T(ギガビットイーサネット)、802.3ad は LACP(リンクアグリゲーション)の規格です。 |
| 16 | A | `power-deny` は、スイッチ全体で使える電力(電力予算)が足りないため、給電を拒否した状態です。`power inline never` の設定なら off、ポートが shutdown されていれば別の表示になります。 |
| 17 | A | ローカルモードの AP は、無線の利用者のデータを CAPWAP で WLC に送るので、AP をつなぐポートは AP の管理用 VLAN のアクセスポートで足ります。AP 自身が各 VLAN にデータを出す FlexConnect や自律型の AP の場合は、トランクにします。 |
| 18 | C | CAPWAP は、UDP の 5246 番を制御用、5247 番をデータ用に使います。UDP 1812 と 1813 は RADIUS、UDP 161 と 162 は SNMP のポートです。 |
| 19 | D | IP 電話をつなぐポートは、アクセスモードのまま、`switchport access vlan` でデータ(PC)の VLAN を、`switchport voice vlan` で音声の VLAN を指定します。この問題では PC が 10、音声が 20 です。`switchport access vlan` に複数の VLAN は指定できません。 |
| 20 | A | 複数の VLAN の通信を運ぶので、ポートはトランクにします。ハイパーバイザーのホストはループを作らないので、`spanning-tree portfast trunk` を設定すると、STP の状態の遷移を待たずにすぐ通信できます。アクセスポートでは1つの VLAN しか通せません。 |
| 21 | C | 列の見出しを順に読みます。<br>① `Device ID` は SW2:隣にいる機器の名前です。<br>② `Local Intrfce` は Gig 0/1:自分(SW1)のポートです。<br>③ `Port ID` は Gig 0/24:相手(SW2)のポートです。<br>④ つまり SW1 の Gi0/1 が SW2 の Gi0/24 につながっています。<br>⑤ `Holdtme` の 152 は、この情報を保持する残りの秒数です。接続してからの時間ではありません。<br>⑥ `Capability` の S はスイッチ、I は IGMP 対応です。ルーターなら R が付きます。<br>SW1 の Gi0/24 と読むのは、Local Intrfce と Port ID を逆に対応させた誤りです。 |
| 22 | D | `show cdp neighbors detail` を実行すると、隣の機器の IP アドレス、IOS のバージョン、プラットフォームなどの詳しい情報が表示されます。`detail` を付けない場合は、機器名とポートなどの概要だけです。 |
| 23 | A | 他社製の機器は、Cisco 独自の CDP を使いません。標準規格の LLDP を `lldp run` で有効にすると、お互いの機器の情報を交換できます。Cisco の機器では、LLDP は既定で無効になっていることが多いです。 |
| 24 | D | CDP は L2 のプロトコルで、直接つながっている隣の機器にだけ届き、ルーターを越えて中継されることはありません。そのため「2ホップ先なので中継される」という説明は誤りです。R2 側で CDP が無効、実際には別の非 Cisco の機器がつながっている、ポートで CDP が無効、はどれも表示されない原因になります。 |
| 25 | C | ping の結果の `U` は、宛先到達不能(Destination Unreachable)の ICMP メッセージを受け取ったことを表します。途中のルーターに経路がないか、ACL で拒否されています。成功は `!`、応答がない場合は `.` と表示されます。 |
| 26 | B | ルーターの普通の ping は、送信元として出ていくインターフェースのアドレスを使います。LAN 側のインターフェースを送信元に指定して ping すると、R2 側に R1 の LAN への戻りの経路があるかを確かめられます。回数や大きさを変えても、この問題の原因は分かりません。 |
| 27 | C | 各行の意味を順に読みます。<br>① 1 行目:最初のルーター 10.0.12.2 から応答があります。<br>② 2 行目:次のルーター 10.0.23.3 から応答があります。<br>③ 3 行目以降:`* * *` は、3 回とも応答がなかったことを表します。<br>④ 10.0.23.3 までは往復できているので、R1 の設定や 10.0.12.2 の戻り経路は問題ありません。<br>⑤ 問題は 10.0.23.3 より先にあります。10.0.23.3 のルーターにあて先への経路がないか、その次のルーターに送信元への戻り経路がない(またはフィルターしている)可能性があります。<br>R1 のデフォルトゲートウェイやデュプレックスに問題があれば、1 行目から応答がなくなるか、遅延が大きくなります。10.0.12.2 の戻り経路に問題があれば、2 行目の応答も届きません。 |
| 28 | B | キャプチャを 1 行ずつ読みます。<br>① 1 行目:クライアント 192.168.1.10 のポート 51000 から、サーバー 10.1.1.80 のポート 443 に `Flags [S]`(SYN、接続の要求)を送っています。<br>② 2 行目:サーバー 10.1.1.80 のポート 443 から `Flags [R.]`(RST と ACK、接続の拒否)が返っています。<br>③ 応答が返っているので、パケットはサーバー(または途中の機器)まで届いています。<br>④ RST は、443 番ポートで待ち受けているサービスがない場合や、接続を拒否する場合に返されます。<br>ファイアウォールが黙って破棄している場合は、応答がなく SYN の再送だけが見えます。IP アドレスで通信できているので、DNS は関係ありません。3 ウェイハンドシェイクが成功すれば、SYN → SYN,ACK → ACK の順になります。 |
| 29 | B | 別のサブネットあてのパケットは、デフォルトゲートウェイに渡すので、フレームのあて先 MAC アドレスはデフォルトゲートウェイ(192.168.1.1)の MAC アドレスです。IP パケットのあて先は 10.2.2.2 のまま変わりません。ffff.ffff.ffff はブロードキャストです。 |
| 30 | C | ルートブリッジは、ブリッジ ID(プライオリティと MAC アドレス)が最も小さいスイッチです。まずプライオリティを比べ、SW3 の 28672 が最も小さいので SW3 がルートになります。MAC アドレスを比べるのは、プライオリティが同じときだけです。 |
| 31 | C | `root primary` の決め方に当てはめます。<br>① 現在のルートブリッジのプライオリティは 32768 です。<br>② `root primary` は、現在のルートのプライオリティが 24576 より大きければ、自分を 24576 に設定します。<br>③ 32768 は 24576 より大きいので、このスイッチは 24576 になります。<br>④ 24576 は 32768 より小さいので、このスイッチが新しいルートブリッジになります。<br>現在のルートが 24576 以下だった場合は、それより 4096 小さい値になります。28672 は、32768 から 4096 引いた値で、この場合の決め方と取り違えた誤りです。4096 や 0 は、自分で `spanning-tree vlan 10 priority` を設定した場合の値です。 |
| 32 | A | ルートブリッジ SW1 までの累計コストを、ポートごとに計算します。<br>① Gi0/1:SW1 に直接つながっています。1 Gbps のコスト 4 だけなので、合計 4 です。<br>② Fa0/2:SW2 を経由します。SW3 → SW2 の 100 Mbps(19)と、SW2 → SW1 の 1 Gbps(4)を足して、19 + 4 = 23 です。<br>③ 累計コストが小さい Gi0/1 がルートポートになり、ルートまでのコストは 4 です。<br>Fa0/2 のコスト 19 は、SW2 から先の 4 を足し忘れた誤りです。Gi0/1 のコスト 8 は、1 Gbps のリンクを 2 本通ると考えた誤りです。 |
| 33 | B | Rapid PVST+(RSTP)のポートの状態は、Discarding、Learning、Forwarding の3つです。Blocking、Listening、Learning、Forwarding の4つ(Disabled を含めて5つ)は、古い 802.1D の STP の状態です。 |
| 34 | B | BPDU ガードは、端末用のポートで BPDU(スイッチが出す STP の情報)を受け取ると、ポートを err-disabled にして止めます。原因の機器を取り外してから、`shutdown` と `no shutdown` で復旧します。errdisable recovery を設定すると、一定時間後に自動で復旧させることもできます。 |
| 35 | B | ルートガードは、ポートで今のルートより優先度の高い BPDU を受け取ると、そのポートを root-inconsistent の状態にして、配下のスイッチがルートブリッジになるのを防ぎます。優先度の高い BPDU が届かなくなると、自動で元に戻ります。BPDU ガードは BPDU を受け取っただけでポートを止める機能です。 |
| 36 | B | 出力を上から順に読みます。<br>① `protocol rstp`:Rapid PVST+(802.1w)で動いています。802.1D の PVST+ なら ieee と表示されます。<br>② Root ID の `Priority 4106`:ブリッジプライオリティは、設定値に VLAN 番号(sys-id-ext)を足した値です。4106 − 10 = 4096 なので、ルートブリッジの設定値は 4096 です。<br>③ Root ID のアドレス 0c1a.2b00.0001 と、自分の Bridge ID のアドレス 0c1a.2b00.0002 が違います。そのため SW2 はルートブリッジではありません。<br>④ `Gi0/24 Root FWD`:ルートポートとして転送しています。Root ID の `Port 24` とも合っています。<br>⑤ `Gi0/23 Altn BLK`:代替ポートとしてブロックされています。ルートポートが使えなくなったときの予備です。<br>⑥ `Gi0/1 Desg FWD … P2p Edge`:Edge は PortFast が有効な端末用のポートで、スイッチではなく端末がつながっていると考えます。 |
| 37 | B | 複数の VLAN を扱う機器は、トランクで接続します。冗長化のために2本のリンクを使うときは、LACP のポートチャネルにまとめるのが一般的です。VLAN ID とネイティブ VLAN、LACP のモードを、ファイアウォール側の設定と合わせます。 |
