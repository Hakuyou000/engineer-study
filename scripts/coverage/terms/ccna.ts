// CCNA 200-301 v2.0(Cisco 公式の Exam Topics)の小項目と、本文で挙げられている要素
import type { Table } from '../types'

export const exam = 'CCNA'

export const table: Table = {
  '1.1': {
    weight: null,
    terms: [
      ["銅線(UTP)・ケーブル種別", "ストレート|クロス|UTP|Cat"],
      ["光ファイバ", "光|ファイバ|SR|LR"],
      ["速度・デュプレックス", "デュプレックス|duplex"],
      ["インターフェースのエラーカウンタ", "CRC|runts|giants|collision"],
      ["インターフェースの状態", "administratively|up/up|down"],
    ],
  },
  '1.2': {
    weight: null,
    terms: [
      ["ハイパーバイザ Type1/2", "Type 1|ハイパーバイザ"],
      ["VM", "仮想マシン|VM"],
      ["コンテナ", "コンテナ"],
      ["仮想スイッチ", "仮想スイッチ"],
    ],
  },
  '1.3': {
    weight: null,
    terms: [
      ["サブネット計算", "/2[0-9]|ブロードキャスト"],
      ["VLSM", "VLSM"],
      ["プライベートアドレス", "プライベート"],
      ["ゲートウェイ設定の誤り", "ゲートウェイ"],
      ["IOS での重複", "overlaps"],
    ],
  },
  '1.4': {
    weight: null,
    terms: [
      ["表記の省略", "::"],
      ["EUI-64", "EUI-64|eui-64"],
      ["SLAAC / RA", "SLAAC|RA"],
      ["NDP", "Neighbor|NDP"],
      ["プレフィックス長 /64", "/64|/80"],
      ["DHCPv6(M/O フラグ)", "DHCPv6|M フラグ"],
    ],
  },
  '1.5': {
    weight: null,
    terms: [
      ["帯域とチャネル", "2\\.4|5 GHz|チャネル"],
      ["RF(RSSI・SNR)", "RSSI|SNR|dBm"],
      ["セキュリティ(WPA2/3)", "WPA|SAE"],
      ["干渉", "干渉|電子レンジ"],
    ],
  },
  '1.6': {
    weight: null,
    terms: [
      ["Windows のクライアント確認", "ipconfig|netsh"],
      ["macOS のクライアント確認", "macOS|networksetup|ifconfig"],
      ["Linux のクライアント確認", "Linux|ip addr|nmcli"],
      ["APIPA(169.254)", "169\\.254"],
      ["無線クライアントの障害", "無線|SSID"],
    ],
  },
  '1.7': {
    weight: null,
    terms: [
      ["DORA", "DORA|Discover|Offer"],
      ["DHCP サーバ設定", "ip dhcp pool|excluded"],
      ["DHCP クライアント", "ip address dhcp"],
      ["リレー(helper-address)", "helper-address"],
      ["確認・トラブルシュート", "show ip dhcp|binding|conflict"],
    ],
  },
  '2.1': {
    weight: null,
    terms: [
      ["L2/L3 物理インターフェース", "no switchport|ルーテッド"],
      ["VLAN", "VLAN"],
      ["802.1Q トランク", "トランク|dot1Q"],
      ["DTP", "dynamic|DTP"],
      ["ネイティブ VLAN", "ネイティブ"],
      ["EtherChannel(LACP)", "EtherChannel|LACP|channel-group"],
      ["L3 EtherChannel", "L3 EtherChannel|Port-channel"],
      ["SVI", "SVI|interface Vlan"],
      ["ルータオンアスティック", "サブインターフェース|g0/0\\."],
    ],
  },
  '2.2': {
    weight: null,
    terms: [
      ["PoE", "PoE|802\\.3at|power"],
      ["デスクトップ・プリンタ・IoT", "アクセスポート|プリンタ|IoT"],
      ["AP(スタンドアロン/コントローラ型)", "AP|CAPWAP"],
      ["VoIP 電話(voice vlan)", "voice vlan|IP 電話"],
      ["仮想化ホスト", "ハイパーバイザ|VM"],
      ["ネットワークアプライアンス", "アプライアンス|ファイアウォール|ロードバランサ"],
    ],
  },
  '2.3': {
    weight: null,
    terms: [
      ["CDP", "CDP|cdp"],
      ["LLDP", "LLDP|lldp"],
      ["出力の読み方", "Local Intrfce|Port ID"],
      ["資料との突き合わせ", "構成図|結線"],
    ],
  },
  '2.4': {
    weight: null,
    terms: [
      ["show コマンド", "show "],
      ["ping の結果記号", "U\\.U|!!!|ping"],
      ["拡張 ping", "source|拡張 ping"],
      ["traceroute", "traceroute"],
      ["パケットキャプチャ", "Flags \\[|キャプチャ"],
      ["ARP・MAC の判断", "MAC"],
    ],
  },
  '2.5': {
    weight: null,
    terms: [
      ["ルートブリッジ選出", "ルートブリッジ|プライオリティ"],
      ["ルートポート・コスト", "ルートポート|コスト"],
      ["ポートの状態と役割", "Discarding|Altn|Desg|状態"],
      ["PortFast", "PortFast|portfast"],
      ["BPDU ガード", "BPDU ガード|bpduguard"],
      ["ルートガード", "ルートガード|root-inconsistent"],
      ["ループガード", "ループガード|loop-inconsistent"],
      ["root primary", "root primary"],
    ],
  },
  '3.1': {
    weight: null,
    terms: [
      ["最長一致", "/25|最長"],
      ["AD", "AD|アドミニストレーティブ"],
      ["メトリック", "メトリック|\\[110/"],
      ["コード(L/C/S/O)", "\\bL \\d|ローカルルート"],
      ["デフォルトルート", "0\\.0\\.0\\.0/0|Gateway of last resort"],
      ["IPv6 ルーティングテーブル", "show ipv6 route|ipv6.*route"],
    ],
  },
  '3.2': {
    weight: null,
    terms: [
      ["デフォルトルート", "0\\.0\\.0\\.0 0\\.0\\.0\\.0"],
      ["ネットワークルート", "ip route 172|ip route 10\\."],
      ["ホストルート", "255\\.255\\.255\\.255|ホスト"],
      ["フローティングスタティック", "AD|フローティング|130"],
      ["IPv6 スタティック", "ipv6 route"],
      ["ネクストホップ到達性", "到達できない|down"],
      ["戻り経路", "戻り"],
    ],
  },
  '3.3': {
    weight: null,
    terms: [
      ["ネイバー隣接の条件", "Hello|エリア ID|MTU"],
      ["ネイバー状態", "EXSTART|2WAY|FULL"],
      ["ポイントツーポイント", "ポイントツーポイント|point-to-point"],
      ["DR/BDR 選出", "DR"],
      ["ルータ ID", "ルータ ID|router-id"],
      ["コスト", "コスト"],
      ["network コマンド", "network 10"],
      ["passive-interface", "passive"],
      ["OSPFv3", "OSPFv3|ff02::5"],
    ],
  },
  '3.4': {
    weight: null,
    terms: [
      ["HSRP の状態", "Active|Standby"],
      ["プリエンプト", "プリエンプト|preempt"],
      ["仮想 IP/MAC", "仮想|virtual"],
      ["トラッキング", "トラッキング|configured"],
      ["VRRP", "VRRP"],
    ],
  },
  '4.1': {
    weight: null,
    terms: [
      ["パスワードの種類", "secret|password 7|タイプ"],
      ["ローカルユーザ", "login local|username"],
      ["SSH", "SSH|crypto key"],
      ["TACACS+ と RADIUS", "TACACS|RADIUS"],
      ["AAA メソッドリスト", "aaa authentication|group tacacs"],
      ["共有鍵", "共有鍵|key"],
    ],
  },
  '4.2': {
    weight: null,
    terms: [
      ["SCP", "SCP|scp"],
      ["SFTP", "SFTP"],
      ["ファイルシステム・copy", "copy |flash"],
      ["イメージの検証", "verify|md5"],
      ["ip scp server enable", "ip scp server"],
    ],
  },
  '4.3': {
    weight: null,
    terms: [
      ["用語(内部ローカル等)", "内部グローバル|内部ローカル"],
      ["スタティック NAT", "static"],
      ["ダイナミック NAT", "pool|プール"],
      ["PAT(overload)", "overload|PAT"],
      ["inside/outside", "nat outside|nat inside"],
      ["ポートフォワード", "static tcp"],
      ["確認コマンド", "show ip nat"],
    ],
  },
  '4.4': {
    weight: null,
    terms: [
      ["A / AAAA", "\\bA\\b|AAAA"],
      ["CNAME", "CNAME"],
      ["MX", "MX"],
      ["NS", "\\bNS\\b"],
      ["PTR", "PTR"],
      ["TTL・キャッシュ", "TTL|キャッシュ"],
      ["NXDOMAIN/SERVFAIL", "SERVFAIL|NXDOMAIN|Non-existent"],
    ],
  },
  '4.5': {
    weight: null,
    terms: [
      ["ESP / AH", "ESP|AH"],
      ["IKE", "IKE"],
      ["トンネル/トランスポートモード", "トンネルモード|トランスポート"],
      ["サイト間 VPN", "サイト間"],
      ["リモートアクセス VPN", "リモートアクセス"],
    ],
  },
  '4.6': {
    weight: null,
    terms: [
      ["ワイルドカードマスク", "ワイルドカード|0\\.0\\.15\\.255"],
      ["標準 ACL", "標準 ACL|access-list 20|access-list 10"],
      ["拡張 ACL", "拡張|access-list 110"],
      ["名前付き ACL", "ip access-list extended|名前付き"],
      ["評価順・暗黙の deny", "暗黙|上から"],
      ["配置", "近い"],
      ["VTY の access-class", "access-class"],
    ],
  },
  '4.7': {
    weight: null,
    terms: [
      ["DHCP スヌーピング", "snooping|スヌーピング"],
      ["DAI", "arp inspection|ARP"],
      ["ストーム制御", "storm"],
      ["RA ガード", "raguard|RA"],
      ["ポートセキュリティ", "protect|restrict|ポートセキュリティ"],
    ],
  },
  '5.1': {
    weight: null,
    terms: [
      ["エージェント型 AI の特徴", "エージェント型"],
      ["リスク対策(承認・最小権限)", "承認|最小"],
      ["運用での役割", "アラート|修正案"],
    ],
  },
  '5.2': {
    weight: null,
    terms: [
      ["プロンプトの構成要素", "ペルソナ|出力形式|コンテキスト"],
      ["機密情報の除去", "機密|ハッシュ|コミュニティ"],
      ["出力の検証", "検証|変更管理"],
    ],
  },
  '5.3': {
    weight: null,
    terms: [
      ["コントローラ型(ノース/サウスバウンド)", "ノースバウンド|サウスバウンド"],
      ["クラウド管理", "クラウド"],
      ["IaC", "Infrastructure as Code|コード"],
      ["宣言的/手続き的", "宣言的"],
      ["冪等性", "冪等"],
    ],
  },
  '5.4': {
    weight: null,
    terms: [
      ["Trap / Inform", "Trap|Inform"],
      ["SNMPv3 セキュリティレベル", "authPriv"],
      ["コミュニティ RO/RW", "コミュニティ|RO"],
      ["MIB / OID", "MIB|OID"],
      ["ポート 161/162", "161|162"],
    ],
  },
  '5.5': {
    weight: null,
    terms: [
      ["エージェントレス・プッシュ型", "エージェントレス|プッシュ"],
      ["モジュール", "ios_command|ios_config"],
      ["PLAY RECAP の読み取り", "RECAP|changed"],
      ["インベントリ・hosts", "hosts|インベントリ"],
      ["YAML", "YAML|yaml"],
    ],
  },
  '5.6': {
    weight: null,
    terms: [
      ["メッセージの書式", "%LINK|%SYS"],
      ["重大度", "重大度|errors"],
      ["ファシリティ", "ファシリティ|%LINK"],
      ["logging trap / host", "logging"],
    ],
  },
}
