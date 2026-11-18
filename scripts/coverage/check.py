# 公式の出題範囲の用語が、問題に出てくるかを集計する。リポジトリのルートで npm run gen の後に実行: python3 scripts/coverage/check.py
import json, re
Q = json.load(open('src/data/questions.json'))

# LinuC 102 v10.0 公式の出題範囲(linuc.org)の重要な用語。(表示名, 正規表現)
LINUC = {
 '1.06.1': (4, [('PATH などの環境変数', r'PATH|環境変数'), ('/etc/bash.bashrc', r'bash\.bashrc'), ('/etc/profile', r'/etc/profile'),
   ('~/.bash_profile', r'bash_profile'), ('~/.bash_login', r'bash_login'), ('~/.profile', r'~/\.profile'), ('~/.bashrc', r'\.bashrc'), ('~/.bash_logout', r'bash_logout'),
   ('. / source', r'source|`\. '), ('lists ; && ||', r'&&|\|\|'), ('コマンド置換', r'コマンド置換|\$\(|`date'), ('alias', r'alias'), ('コマンドサーチパス', r'PATH|which|type ')]),
 '1.06.2': (6, [('function', r'関数|function'), ('#!(シバン)', r'#!|シバン'), ('配置・所有者・実行権', r'/usr/local/bin|chown|実行権'), ('chmod', r'chmod|755|711'),
   ('for', r'\bfor\b'), ('while', r'while|until'), ('戻り値 $? exit', r'\$\?|exit|終了ステータス'), ('if', r'\bif\b'), ('case', r'case|esac'),
   ('$# $* $@ $0 $1..', r'\$#|\$@|\$\*|\$0|\$1|\$2'), ('shift', r'shift'), ('PATH(環境に依存しない)', r'LANG=C|PATH=/|PATH を設定'), ('bash -v / -x', r'bash -[vx]')]),
 '1.07.1': (4, [('ネットマスク・CIDR', r'/2[0-9]|CIDR|マスク'), ('サブネット化', r'/2[5-9]|ブロードキャスト'), ('プライベート/パブリック', r'プライベート|グローバル'),
   ('22/SSH', r'SSH'), ('25/SMTP', r'SMTP'), ('53/DNS', r'DNS'), ('80/HTTP', r'HTTP'), ('123/NTP', r'NTP'), ('443/HTTPS', r'HTTPS'),
   ('TCP/UDP/ICMP の違い', r'ICMP'), ('IPv4 と IPv6 の違い', r'IPv6'), ('IPv6 の基本機能', r'::|ブロードキャスト|リンクローカル')]),
 '1.07.2': (4, [('手動/自動の設定', r'DHCP|BOOTPROTO|ipv4\.method|static'), ('/etc/hostname', r'/etc/hostname|hostnamectl'), ('ifconfig', r'ifconfig'),
   ('ifup / ifdown', r'ifup|ifdown'), ('nmcli', r'nmcli'), ('ip addr', r'ip addr'), ('/etc/hosts', r'/etc/hosts'), ('/etc/nsswitch.conf', r'nsswitch'), ('ping', r'\bping\b'),
   ('ip route / route', r'ip route|\broute\b')]),
 '1.07.3': (4, [('host', r'\bhost\b'), ('dig', r'\bdig\b'), ('ping / ping6', r'ping'), ('nc / ncat', r'\bnc\b|ncat|netcat'), ('netstat', r'netstat'), ('ss', r'\bss\b'),
   ('traceroute / traceroute6', r'traceroute'), ('tracepath / tracepath6', r'tracepath'), ('ifconfig ifup ifdown', r'ifconfig|ifup|ifdown'), ('hostname', r'hostname'),
   ('ip route / route', r'ip route|route -n|\broute\b')]),
 '1.07.4': (2, [('host', r'\bhost\b'), ('dig', r'\bdig\b'), ('/etc/resolv.conf', r'resolv\.conf'), ('getent', r'getent'), ('/etc/nsswitch.conf', r'nsswitch'), ('/etc/hosts', r'/etc/hosts')]),
 '1.08.1': (5, [('useradd', r'useradd'), ('userdel', r'userdel'), ('usermod', r'usermod'), ('groupadd', r'groupadd'), ('groupdel', r'groupdel'), ('groupmod', r'groupmod'),
   ('/etc/default/useradd', r'default/useradd|useradd -D'), ('/etc/skel', r'skel'), ('passwd', r'\bpasswd\b'), ('/etc/passwd', r'/etc/passwd'), ('/etc/shadow', r'/etc/shadow'),
   ('/etc/group', r'/etc/group'), ('複数グループへの所属', r'セカンダリ|-aG'), ('getent', r'getent'), ('id', r'\bid -|\bid\b')]),
 '1.08.2': (4, [('cron', r'cron'), ('at', r'\bat\b|atq'), ('anacron', r'anacron'), ('/var/spool/cron/', r'/var/spool/cron'), ('cron.allow / cron.deny', r'cron\.(allow|deny)'),
   ('at.allow / at.deny', r'at\.(allow|deny)'), ('atq / atrm', r'atq|atrm'), ('/etc/cron.d・daily など', r'cron\.(d|daily|hourly|weekly|monthly)'), ('/etc/crontab', r'/etc/crontab'),
   ('/etc/anacrontab', r'anacrontab')]),
 '1.08.3': (3, [('i18n / l10n', r'i18n|l10n'), ('LANG', r'LANG'), ('LC_ALL / LC_*', r'LC_'), ('/usr/bin/locale', r'\blocale\b'), ('iconv', r'iconv'), ('UTF-8', r'UTF-8'),
   ('ISO-8859', r'ISO-8859'), ('ASCII', r'ASCII'), ('Unicode', r'Unicode'), ('ISO-2022-JP', r'ISO-2022-JP'), ('スクリプトでの LANG=C', r'LANG=C|LC_ALL=C')]),
 '1.09.1': (2, [('date', r'\bdate\b'), ('hwclock', r'hwclock'), ('/usr/share/zoneinfo', r'zoneinfo'), ('/etc/timezone', r'/etc/timezone\b'), ('/etc/localtime', r'localtime'),
   ('TZ', r'\bTZ\b'), ('tzselect', r'tzselect'), ('timedatectl', r'timedatectl'), ('ntpd', r'ntpd\b'), ('ntpdate', r'ntpdate'), ('ntp.conf', r'ntp\.conf'), ('chronyd', r'chronyd'),
   ('chronyc', r'chronyc'), ('chrony.conf', r'chrony\.conf'), ('pool.ntp.org', r'pool\.ntp'), ('ntpq', r'ntpq')]),
 '1.09.2': (5, [('rsyslog.conf / rsyslogd', r'rsyslog'), ('ログの集約(送受信)', r'@@|@192|imudp|imtcp|ログサーバー'), ('journalctl', r'journalctl'),
   ('/etc/systemd/journald.conf', r'journald\.conf|Storage'), ('/var/log/journal/', r'/var/log/journal|persistent'), ('ジャーナルの検索・削除', r'vacuum|-u |-b'),
   ('ファシリティ', r'ファシリティ|local0|mail\.|authpriv'), ('プライオリティ', r'プライオリティ|emerg|err'), ('アクション', r'@@|/var/log/messages|:omusrmsg'),
   ('logger', r'logger'), ('systemd-cat', r'systemd-cat'), ('logrotate', r'logrotate|rotate'), ('/etc/logrotate.conf / logrotate.d', r'logrotate\.(conf|d)'), ('/var/log/', r'/var/log')]),
 '1.09.3': (2, [('/etc/aliases', r'/etc/aliases'), ('newaliases', r'newaliases'), ('~/.forward', r'forward'), ('mail', r'\bmail\b'), ('mailq', r'mailq'),
   ('postfix', r'postfix'), ('exim', r'exim'), ('sendmail', r'sendmail')]),
 '1.10.1': (3, [('find(SUID/SGID の監査)', r'find'), ('passwd', r'passwd'), ('usermod', r'usermod'), ('chage', r'chage'), ('ss / netstat', r'\bss\b|netstat'), ('nmap', r'nmap'),
   ('lsof', r'lsof'), ('fuser', r'fuser'), ('who', r'\bwho\b'), ('w', r'`w`|\bw\b はログイン'), ('last', r'\blast\b'), ('ulimit', r'ulimit|limits\.conf'), ('su', r'\bsu\b'),
   ('sudo / /etc/sudoers', r'sudo'), ('TMOUT', r'TMOUT')]),
 '1.10.2': (3, [('シャドウパスワード', r'shadow|シャドウ'), ('/etc/nologin', r'/etc/nologin'), ('xinetd', r'xinetd'), ('inetd', r'\binetd'), ('systemctl', r'systemctl'),
   ('/etc/init.d/', r'init\.d'), ('chkconfig', r'chkconfig'), ('service', r'\bservice\b'), ('iptables', r'iptables|INPUT|DROP'), ('firewalld', r'firewall')]),
 '1.10.3': (3, [('公開鍵技術', r'公開鍵'), ('ssh-keygen', r'ssh-keygen'), ('ssh-agent', r'ssh-agent'), ('ssh-add', r'ssh-add'), ('rsa', r'\brsa\b|RSA'), ('ecdsa', r'ecdsa'),
   ('ed25519', r'ed25519'), ('SSH ポート転送', r'ssh -L|ポート転送|-L '), ('gpg', r'gpg'), ('gpg-agent', r'gpg-agent'), ('~/.gnupg/', r'\.gnupg'),
   ('authorized_keys / known_hosts', r'authorized_keys|known_hosts'), ('sshd_config', r'sshd_config')]),
 '1.10.4': (3, [('管理コンソール', r'管理コンソール'), ('ファイアウォール(クラウド側)', r'セキュリティグループ|ファイアウォール'), ('ルーティング(クラウド側)', r'ルート|経路'),
   ('リージョン選択と国内外の制約', r'リージョン'), ('揮発性ストレージ', r'揮発'), ('事業者の制約', r'事業者.*制約|制約|25 番|事業者のメンテナンス'), ('メンテナンス・再起動', r'メンテナンス|再起動'),
   ('コンソールへの経路と認証', r'コンソール.*(認証|経路)|インターネット経由'), ('多段階・多要素認証', r'多要素|多段階'), ('ワンタイムパスワード', r'ワンタイム|OTP|TOTP'),
   ('責任共有', r'責任|IaaS')]),
 '1.11.1': (2, [('自由', r'自由'), ('ソースコード', r'ソースコード'), ('著作物', r'著作'), ('無保証', r'保証'), ('継続した開発', r'継続|開発が'), ('多くのライセンス', r'ライセンス'),
   ('GPL', r'\bGPL'), ('AGPL', r'AGPL'), ('LGPL', r'LGPL'), ('MPL', r'MPL'), ('BSD', r'BSD'), ('MIT', r'MIT'), ('Apache V2', r'Apache'), ('パブリックドメイン', r'パブリックドメイン'),
   ('改変と再配布', r'改変|再配布')]),
 '1.11.2': (1, [('メーリングリスト', r'メーリングリスト'), ('掲示板', r'掲示板|フォーラム'), ('開発サイト', r'開発サイト|GitHub'), ('開発体制', r'バザール|メンテナ|コミッタ|アップストリーム'),
   ('使用・紹介・バグ報告', r'バグ報告|紹介')]),
}

# CCNA 200-301 v2.0(Cisco 公式の Exam Topics)の小項目と、本文で挙げられている要素
CCNA = {
 '1.1': (None, [('銅線(UTP)・ケーブル種別', r'ストレート|クロス|UTP|Cat'), ('光ファイバ', r'光|ファイバ|SR|LR'), ('速度・デュプレックス', r'デュプレックス|duplex'),
   ('インターフェースのエラーカウンタ', r'CRC|runts|giants|collision'), ('インターフェースの状態', r'administratively|up/up|down')]),
 '1.2': (None, [('ハイパーバイザ Type1/2', r'Type 1|ハイパーバイザ'), ('VM', r'仮想マシン|VM'), ('コンテナ', r'コンテナ'), ('仮想スイッチ', r'仮想スイッチ')]),
 '1.3': (None, [('サブネット計算', r'/2[0-9]|ブロードキャスト'), ('VLSM', r'VLSM'), ('プライベートアドレス', r'プライベート'), ('ゲートウェイ設定の誤り', r'ゲートウェイ'), ('IOS での重複', r'overlaps')]),
 '1.4': (None, [('表記の省略', r'::'), ('EUI-64', r'EUI-64|eui-64'), ('SLAAC / RA', r'SLAAC|RA'), ('NDP', r'Neighbor|NDP'), ('プレフィックス長 /64', r'/64|/80'), ('DHCPv6(M/O フラグ)', r'DHCPv6|M フラグ')]),
 '1.5': (None, [('帯域とチャネル', r'2\.4|5 GHz|チャネル'), ('RF(RSSI・SNR)', r'RSSI|SNR|dBm'), ('セキュリティ(WPA2/3)', r'WPA|SAE'), ('干渉', r'干渉|電子レンジ')]),
 '1.6': (None, [('Windows のクライアント確認', r'ipconfig|netsh'), ('macOS のクライアント確認', r'macOS|networksetup|ifconfig'), ('Linux のクライアント確認', r'Linux|ip addr|nmcli'),
   ('APIPA(169.254)', r'169\.254'), ('無線クライアントの障害', r'無線|SSID')]),
 '1.7': (None, [('DORA', r'DORA|Discover|Offer'), ('DHCP サーバ設定', r'ip dhcp pool|excluded'), ('DHCP クライアント', r'ip address dhcp'), ('リレー(helper-address)', r'helper-address'),
   ('確認・トラブルシュート', r'show ip dhcp|binding|conflict')]),
 '2.1': (None, [('L2/L3 物理インターフェース', r'no switchport|ルーテッド'), ('VLAN', r'VLAN'), ('802.1Q トランク', r'トランク|dot1Q'), ('DTP', r'dynamic|DTP'), ('ネイティブ VLAN', r'ネイティブ'),
   ('EtherChannel(LACP)', r'EtherChannel|LACP|channel-group'), ('L3 EtherChannel', r'L3 EtherChannel|Port-channel'), ('SVI', r'SVI|interface Vlan'), ('ルータオンアスティック', r'サブインターフェース|g0/0\.')]),
 '2.2': (None, [('PoE', r'PoE|802\.3at|power'), ('デスクトップ・プリンタ・IoT', r'アクセスポート|プリンタ|IoT'), ('AP(スタンドアロン/コントローラ型)', r'AP|CAPWAP'),
   ('VoIP 電話(voice vlan)', r'voice vlan|IP 電話'), ('仮想化ホスト', r'ハイパーバイザ|VM'), ('ネットワークアプライアンス', r'アプライアンス|ファイアウォール|ロードバランサ')]),
 '2.3': (None, [('CDP', r'CDP|cdp'), ('LLDP', r'LLDP|lldp'), ('出力の読み方', r'Local Intrfce|Port ID'), ('資料との突き合わせ', r'構成図|結線')]),
 '2.4': (None, [('show コマンド', r'show '), ('ping の結果記号', r'U\.U|!!!|ping'), ('拡張 ping', r'source|拡張 ping'), ('traceroute', r'traceroute'), ('パケットキャプチャ', r'Flags \[|キャプチャ'),
   ('ARP・MAC の判断', r'MAC')]),
 '2.5': (None, [('ルートブリッジ選出', r'ルートブリッジ|プライオリティ'), ('ルートポート・コスト', r'ルートポート|コスト'), ('ポートの状態と役割', r'Discarding|Altn|Desg|状態'),
   ('PortFast', r'PortFast|portfast'), ('BPDU ガード', r'BPDU ガード|bpduguard'), ('ルートガード', r'ルートガード|root-inconsistent'), ('ループガード', r'ループガード|loop-inconsistent'),
   ('root primary', r'root primary')]),
 '3.1': (None, [('最長一致', r'/25|最長'), ('AD', r'AD|アドミニストレーティブ'), ('メトリック', r'メトリック|\[110/'), ('コード(L/C/S/O)', r'\bL \d|ローカルルート'),
   ('デフォルトルート', r'0\.0\.0\.0/0|Gateway of last resort'), ('IPv6 ルーティングテーブル', r'show ipv6 route|ipv6.*route')]),
 '3.2': (None, [('デフォルトルート', r'0\.0\.0\.0 0\.0\.0\.0'), ('ネットワークルート', r'ip route 172|ip route 10\.'), ('ホストルート', r'255\.255\.255\.255|ホスト'), ('フローティングスタティック', r'AD|フローティング|130'),
   ('IPv6 スタティック', r'ipv6 route'), ('ネクストホップ到達性', r'到達できない|down'), ('戻り経路', r'戻り')]),
 '3.3': (None, [('ネイバー隣接の条件', r'Hello|エリア ID|MTU'), ('ネイバー状態', r'EXSTART|2WAY|FULL'), ('ポイントツーポイント', r'ポイントツーポイント|point-to-point'), ('DR/BDR 選出', r'DR'),
   ('ルータ ID', r'ルータ ID|router-id'), ('コスト', r'コスト'), ('network コマンド', r'network 10'), ('passive-interface', r'passive'), ('OSPFv3', r'OSPFv3|ff02::5')]),
 '3.4': (None, [('HSRP の状態', r'Active|Standby'), ('プリエンプト', r'プリエンプト|preempt'), ('仮想 IP/MAC', r'仮想|virtual'), ('トラッキング', r'トラッキング|configured'), ('VRRP', r'VRRP')]),
 '4.1': (None, [('パスワードの種類', r'secret|password 7|タイプ'), ('ローカルユーザ', r'login local|username'), ('SSH', r'SSH|crypto key'), ('TACACS+ と RADIUS', r'TACACS|RADIUS'),
   ('AAA メソッドリスト', r'aaa authentication|group tacacs'), ('共有鍵', r'共有鍵|key')]),
 '4.2': (None, [('SCP', r'SCP|scp'), ('SFTP', r'SFTP'), ('ファイルシステム・copy', r'copy |flash'), ('イメージの検証', r'verify|md5'), ('ip scp server enable', r'ip scp server')]),
 '4.3': (None, [('用語(内部ローカル等)', r'内部グローバル|内部ローカル'), ('スタティック NAT', r'static'), ('ダイナミック NAT', r'pool|プール'), ('PAT(overload)', r'overload|PAT'),
   ('inside/outside', r'nat outside|nat inside'), ('ポートフォワード', r'static tcp'), ('確認コマンド', r'show ip nat')]),
 '4.4': (None, [('A / AAAA', r'\bA\b|AAAA'), ('CNAME', r'CNAME'), ('MX', r'MX'), ('NS', r'\bNS\b'), ('PTR', r'PTR'), ('TTL・キャッシュ', r'TTL|キャッシュ'), ('NXDOMAIN/SERVFAIL', r'SERVFAIL|NXDOMAIN|Non-existent')]),
 '4.5': (None, [('ESP / AH', r'ESP|AH'), ('IKE', r'IKE'), ('トンネル/トランスポートモード', r'トンネルモード|トランスポート'), ('サイト間 VPN', r'サイト間'), ('リモートアクセス VPN', r'リモートアクセス')]),
 '4.6': (None, [('ワイルドカードマスク', r'ワイルドカード|0\.0\.15\.255'), ('標準 ACL', r'標準 ACL|access-list 20|access-list 10'), ('拡張 ACL', r'拡張|access-list 110'), ('名前付き ACL', r'ip access-list extended|名前付き'),
   ('評価順・暗黙の deny', r'暗黙|上から'), ('配置', r'近い'), ('VTY の access-class', r'access-class')]),
 '4.7': (None, [('DHCP スヌーピング', r'snooping|スヌーピング'), ('DAI', r'arp inspection|ARP'), ('ストーム制御', r'storm'), ('RA ガード', r'raguard|RA'), ('ポートセキュリティ', r'protect|restrict|ポートセキュリティ')]),
 '5.1': (None, [('エージェント型 AI の特徴', r'エージェント型'), ('リスク対策(承認・最小権限)', r'承認|最小'), ('運用での役割', r'アラート|修正案')]),
 '5.2': (None, [('プロンプトの構成要素', r'ペルソナ|出力形式|コンテキスト'), ('機密情報の除去', r'機密|ハッシュ|コミュニティ'), ('出力の検証', r'検証|変更管理')]),
 '5.3': (None, [('コントローラ型(ノース/サウスバウンド)', r'ノースバウンド|サウスバウンド'), ('クラウド管理', r'クラウド'), ('IaC', r'Infrastructure as Code|コード'), ('宣言的/手続き的', r'宣言的'), ('冪等性', r'冪等')]),
 '5.4': (None, [('Trap / Inform', r'Trap|Inform'), ('SNMPv3 セキュリティレベル', r'authPriv'), ('コミュニティ RO/RW', r'コミュニティ|RO'), ('MIB / OID', r'MIB|OID'), ('ポート 161/162', r'161|162')]),
 '5.5': (None, [('エージェントレス・プッシュ型', r'エージェントレス|プッシュ'), ('モジュール', r'ios_command|ios_config'), ('PLAY RECAP の読み取り', r'RECAP|changed'), ('インベントリ・hosts', r'hosts|インベントリ'), ('YAML', r'YAML|yaml')]),
 '5.6': (None, [('メッセージの書式', r'%LINK|%SYS'), ('重大度', r'重大度|errors'), ('ファシリティ', r'ファシリティ|%LINK'), ('logging trap / host', r'logging')]),
}

# AWS SAA-C03 公式の試験ガイド(docs.aws.amazon.com)のタスクの「Knowledge of / Skills in」。(配点 %, 用語)
SAA = {
 '1.1': (None, [('複数アカウントのアクセス管理', r'Organizations|複数のアカウント|複数アカウント'), ('IAM / Identity Center', r'Identity Center'), ('グローバルインフラ(AZ・リージョン)', r'リージョン|AZ'),
   ('最小権限', r'最小権限|上限|境界'), ('責任共有モデル', r'責任共有'), ('ルートユーザーと MFA', r'MFA'), ('ユーザー・グループ・ロール・ポリシー', r'グループ'),
   ('STS・ロールの切り替え・クロスアカウント', r'STS|AssumeRole|クロスアカウント'), ('Control Tower・SCP', r'Control Tower'), ('SCP', r'SCP'), ('リソースベースのポリシー', r'リソースベース|バケットポリシー|信頼ポリシー'),
   ('ディレクトリのフェデレーション', r'AD Connector|Active Directory|SAML')]),
 '1.2': (None, [('認証情報の保護', r'Secrets Manager'), ('サービスエンドポイント', r'エンドポイント'), ('ポート・プロトコル・通信の制御', r'ポート'), ('Cognito', r'Cognito'),
   ('GuardDuty', r'GuardDuty'), ('Macie', r'Macie'), ('DDoS', r'DDoS'), ('SQL インジェクション', r'SQL インジェクション'), ('セキュリティグループ', r'セキュリティグループ|SG'),
   ('ルートテーブル', r'ルートテーブル'), ('ネットワーク ACL', r'ネットワーク ACL|NACL'), ('NAT ゲートウェイ', r'NAT ゲートウェイ'), ('パブリック/プライベートサブネット', r'プライベートサブネット'),
   ('Shield', r'Shield'), ('WAF', r'WAF'), ('VPN / Direct Connect', r'Direct Connect')]),
 '1.3': (None, [('データアクセスとガバナンス', r'キーポリシー|アクセス'), ('データの復旧', r'復元|バックアップ'), ('データの保持と分類', r'保持|保存する必要'), ('暗号化とキー管理', r'KMS'),
   ('コンプライアンス', r'規制|法令|コンプライアンス'), ('保存時の暗号化', r'暗号化'), ('ACM と TLS', r'ACM|HTTPS'), ('キーのアクセスポリシー', r'キーポリシー'),
   ('バックアップとレプリケーション', r'AWS Backup|コピー'), ('ライフサイクルと保護のポリシー', r'Object Lock|Vault Lock'), ('キーのローテーション・証明書の更新', r'自動で更新|更新')]),
 '2.1': (None, [('API Gateway', r'API Gateway'), ('Transfer Family / SQS / Secrets Manager', r'SQS'), ('キャッシュ戦略', r'キャッシュ'), ('ステートレス', r'ステートレス'),
   ('イベント駆動', r'イベント'), ('水平・垂直スケーリング', r'Auto Scaling|台数'), ('CDN', r'CloudFront'), ('コンテナへの移行', r'コンテナ'), ('ALB', r'ALB|Application Load Balancer'),
   ('多層アーキテクチャ', r'Web 層|バックエンド'), ('Pub/Sub', r'SNS'), ('Lambda / Fargate', r'Fargate'), ('ストレージの種類', r'EFS|EBS'), ('ECS / EKS', r'EKS'),
   ('リードレプリカ', r'リードレプリカ'), ('Step Functions', r'Step Functions')]),
 '2.2': (None, [('AZ・リージョン・Route 53', r'Route 53'), ('Comprehend / Polly', r'Comprehend'), ('ルートテーブル', r'ルートテーブル'), ('DR 戦略・RPO・RTO', r'RPO'),
   ('パイロットライト', r'パイロットライト'), ('ウォームスタンバイ', r'ウォームスタンバイ'), ('フェイルオーバー', r'フェイルオーバー'), ('イミュータブル', r'イミュータブル|入れ替え'),
   ('ロードバランサー', r'ALB'), ('RDS Proxy', r'RDS Proxy'), ('サービスクォータ', r'クォータ'), ('耐久性・レプリケーション', r'複製'), ('X-Ray', r'X-Ray'),
   ('自動化', r'CloudFormation'), ('単一障害点', r'AZ の障害|AZ 障害')]),
 '3.1': (None, [('ハイブリッドストレージ', r'Storage Gateway|File Gateway'), ('S3', r'S3'), ('EFS', r'EFS'), ('EBS', r'EBS|io2|gp3|st1'), ('オブジェクト/ファイル/ブロック', r'ファイル'),
   ('性能を満たす構成', r'IOPS|スループット'), ('将来の拡張', r'自動スケーリング|自動で')]),
 '3.2': (None, [('Batch', r'Batch'), ('EMR', r'EMR'), ('Fargate', r'Fargate|コンテナ'), ('エッジ・分散コンピューティング', r'Wavelength|エッジ'), ('キューとメッセージ', r'SQS|キュー'),
   ('EC2 Auto Scaling', r'Auto Scaling'), ('Lambda', r'Lambda'), ('デカップリング', r'キュー'), ('スケーリングの指標', r'メッセージ数|バックログ'), ('インスタンスタイプ', r'ファミリー'),
   ('Lambda のメモリ', r'メモリを増やす'), ('プレイスメントグループ', r'プレイスメント')]),
 '3.3': (None, [('ElastiCache', r'ElastiCache'), ('読み取り中心/書き込み中心', r'読み取り'), ('容量の計画', r'キャパシティ|オンデマンド|プロビジョンド'), ('接続とプロキシ', r'エンドポイント|Proxy'),
   ('同種/異種の移行', r'異種|SCT|DMS'), ('リードレプリカ', r'レプリカ'), ('リレーショナル/非リレーショナル/インメモリ', r'DynamoDB'), ('グラフ', r'Neptune'), ('Aurora', r'Aurora'),
   ('DAX', r'DAX'), ('キャッシュの組み込み', r'キャッシュアサイド|遅延読み込み')]),
 '3.4': (None, [('CloudFront', r'CloudFront'), ('Global Accelerator', r'Global Accelerator'), ('サブネット・ルーティング・IP 設計', r'/24|CIDR'), ('ロードバランサー', r'NLB'),
   ('VPN / Direct Connect / PrivateLink', r'PrivateLink'), ('Direct Connect', r'Direct Connect'), ('グローバル/ハイブリッドのトポロジー', r'Transit Gateway'), ('VPC ピアリング', r'ピアリング')]),
 '3.5': (None, [('Athena', r'Athena'), ('Lake Formation', r'Lake Formation'), ('可視化(Quick)', r'ダッシュボード|Quick'), ('取り込みの頻度', r'毎晩|毎日|リアルタイム'),
   ('DataSync', r'DataSync'), ('Glue', r'Glue'), ('Kinesis', r'Kinesis'), ('ストリーミング', r'ストリーミング'), ('データレイク', r'データレイク'), ('CSV → Parquet', r'Parquet'),
   ('サイズと速度', r'Gbps|TB'), ('SaaS 連携', r'AppFlow')]),
 '4.1': (None, [('リクエスタ支払い', r'リクエスタ支払い'), ('コスト配分タグ', r'コスト配分タグ'), ('Cost Explorer / Budgets / CUR', r'Budgets'), ('ストレージクラス', r'Glacier'),
   ('ライフサイクル', r'ライフサイクル'), ('Intelligent-Tiering', r'Intelligent-Tiering'), ('One Zone-IA', r'One Zone'), ('Instant Retrieval', r'Instant Retrieval'),
   ('非現行バージョン', r'非現行')]),
 '4.2': (None, [('Savings Plans', r'Savings Plans'), ('リザーブドインスタンス', r'リザーブド'), ('スポット', r'スポット'), ('Dedicated Hosts', r'Dedicated Hosts'),
   ('ライトサイジング', r'Compute Optimizer|小さいサイズ'), ('Lambda / EC2 / Fargate', r'Lambda'), ('本番/非本番の可用性', r'開発環境|開発・テスト'), ('スケジュールでの停止', r'停止')]),
 '4.3': (None, [('サーバーレス DB', r'Serverless'), ('キャパシティモード', r'プロビジョンドモード'), ('TTL・データ保持', r'TTL'), ('異種移行', r'SCT|DMS'), ('時系列', r'Timestream'),
   ('バックアップ保持期間', r'保持期間')]),
 '4.4': (None, [('NAT ゲートウェイの費用', r'NAT ゲートウェイ'), ('VPC エンドポイント', r'ゲートウェイエンドポイント'), ('Direct Connect / VPN', r'Direct Connect'),
   ('ピアリング / Transit Gateway', r'ピアリング'), ('CDN・エッジキャッシュ', r'CloudFront'), ('価格クラス', r'価格クラス'), ('スロットリング', r'スロットリング|使用量プラン')]),
}

# 試験ガイドの In-Scope AWS Services(テキストと問題での出現を数える)
SAA_SERVICES = ['Athena', 'Data Exchange', 'Data Pipeline', 'EMR', 'Glue', 'Kinesis', 'Lake Formation', 'MSK', 'OpenSearch', 'Quick', 'Redshift',
  'AppFlow', 'EventBridge', 'Amazon MQ', 'SNS', 'SQS', 'Step Functions', 'Budgets', 'Cost and Usage Report', 'Cost Explorer', 'Savings Plans',
  'Batch', 'EC2', 'Auto Scaling', 'Elastic Beanstalk', 'Outposts', 'Serverless Application Repository', 'VMware Cloud on AWS', 'Wavelength',
  'ECR', 'ECS', 'ECS Anywhere', 'EKS', 'EKS Anywhere', 'EKS Distro', 'Aurora', 'Aurora Serverless', 'DocumentDB', 'DynamoDB', 'ElastiCache', 'Keyspaces', 'Neptune', 'RDS',
  'X-Ray', 'Amplify', 'API Gateway', 'Device Farm', 'Comprehend', 'Lex', 'Polly', 'Rekognition', 'SageMaker', 'Textract', 'Transcribe', 'Translate',
  'AWS Auto Scaling', 'CLI', 'CloudFormation', 'CloudTrail', 'CloudWatch', 'Compute Optimizer', 'Config', 'Control Tower', 'Health Dashboard', 'License Manager',
  'Managed Grafana', 'Managed Service for Prometheus', 'Management Console', 'Organizations', 'Proton', 'Service Catalog', 'Systems Manager', 'Well-Architected Tool',
  'Kinesis Video Streams', 'Application Discovery Service', 'Application Migration Service', 'DataSync', 'DMS', 'Snow', 'Transfer Family',
  'Client VPN', 'CloudFront', 'Direct Connect', 'Load Balanc', 'Global Accelerator', 'PrivateLink', 'Route 53', 'Site-to-Site VPN', 'Transit Gateway', 'VPC',
  'Artifact', 'Certificate Manager', 'CloudHSM', 'Cognito', 'Detective', 'Directory Service', 'Firewall Manager', 'GuardDuty', 'Identity Center', 'Inspector', 'KMS', 'Macie',
  'Network Firewall', 'Resource Access Manager', 'Secrets Manager', 'Security Hub', 'Shield', 'WAF', 'IAM', 'Fargate', 'Lambda',
  'AWS Backup', 'EBS', 'EFS', 'FSx', 'S3', 'Glacier', 'Storage Gateway']

def corpus(q): return '\n'.join([q['stem']] + [c['text'] for c in q['choices']] + (q['answer'] if q.get('kind') == 'input' else []) + [q['explanation']])

def objective(q):
    s = q['section'].split()[0]
    return s

def analyze(exam, table):
    qs = [q for q in Q if q['exam'] == exam]
    rows = []
    for obj, (w, items) in table.items():
        oq = [q for q in qs if obj in q['section'].replace('/', ' ').split()]
        text = '\n'.join(corpus(q) for q in oq)
        hit = [(n, bool(re.search(p, text))) for n, p in items]
        rows.append(dict(obj=obj, weight=w, n=len(oq), items=len(items), covered=sum(h for _, h in hit),
                         missing=[n for n, h in hit if not h],
                         output=sum('```' in q['stem'] or '|' in q['stem'] for q in oq),
                         trouble=sum(bool(re.search(r'原因|できない|通らない|失敗|進まない|down|エラー|起動しない|遅く', q['stem'])) for q in oq),
                         multi=sum(len(q['answer']) > 1 for q in oq)))
    return qs, rows

out = {}
for exam, table in [('LinuC102', LINUC), ('CCNA', CCNA), ('SAA', SAA)]:
    qs, rows = analyze(exam, table)
    out[exam] = rows
    tot_items = sum(r['items'] for r in rows); tot_cov = sum(r['covered'] for r in rows)
    print(f'== {exam}: {len(qs)} 問, 用語 {tot_cov}/{tot_items} ({tot_cov/tot_items:.0%})')
    wsum = sum(r['weight'] or 0 for r in rows)
    for r in rows:
        share = f"{r['n']/len(qs):5.1%}"
        ws = f"{(r['weight'] or 0)/wsum:5.1%}" if wsum else ''
        print(f"{r['obj']:7} w={r['weight']} n={r['n']:2} share={share} wshare={ws} terms={r['covered']}/{r['items']} out={r['output']} ts={r['trouble']} multi={r['multi']} missing={r['missing']}")


import glob
qtext = '\n'.join(corpus(q) for q in Q if q['exam'] == 'SAA')
ttext = '\n'.join(open(f).read() for f in glob.glob('texts/aws-saa/*.md'))
miss_t = [x for x in SAA_SERVICES if x not in ttext]
miss_q = [x for x in SAA_SERVICES if x not in qtext]
print(f'== SAA 対象サービス {len(SAA_SERVICES)}: テキスト {len(SAA_SERVICES)-len(miss_t)} / 問題 {len(SAA_SERVICES)-len(miss_q)}')
print('テキストにない:', miss_t)
print('問題にない:', miss_q)
