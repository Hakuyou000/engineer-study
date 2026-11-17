# CCNA テキスト 4.0 ネットワークサービスとセキュリティ(20%)

対象: 200-301 CCNA v2.0

## 4.1 ローカルユーザ名と AAA クライアント(TACACS+ / RADIUS)による管理アクセスを設定する

### 1. 管理アクセスの経路

| 回線 | 用途 | 設定モード |
|---|---|---|
| コンソール | 直接接続(ロールオーバーケーブル、USB) | `line console 0` |
| VTY | Telnet / SSH によるリモート接続 | `line vty 0 4`(スイッチは 0 15) |
| AUX | モデム経由(旧来) | `line aux 0` |

| モード | プロンプト | 権限レベル |
|---|---|---|
| ユーザ EXEC | `>` | 1 |
| 特権 EXEC | `#` | 15 |
| グローバルコンフィグ | `(config)#` | 15 |

権限レベルは 0〜15。

### 2. パスワードの種類

```
enable secret Cisco123!                 ! 特権モードのパスワード。ハッシュ化して保存
enable password Cisco123                ! 平文で保存。使わない。secret があれば secret が優先
service password-encryption             ! 平文パスワードをタイプ 7 で難読化
```

| タイプ | 方式 | 評価 |
|---|---|---|
| 0 | 平文 | 不可 |
| 7 | Vigenère 暗号(`service password-encryption`) | 容易に復号できる。のぞき見防止程度 |
| 5 | MD5 ハッシュ | 弱い |
| 8 | PBKDF2-SHA-256 | 推奨 |
| 9 | scrypt | 推奨 |

```
enable algorithm-type scrypt secret Cisco123!
username admin privilege 15 algorithm-type scrypt secret Adm1n-Pass
```

`show running-config` の表示例: `username admin privilege 15 secret 9 $9$…`

### 3. ローカルユーザ名による認証

```
username admin privilege 15 secret Adm1n-Pass
username oper privilege 1 secret Oper-Pass
!
line console 0
 login local                  ! ローカルのユーザ名 / パスワードで認証
 exec-timeout 5 0             ! 無操作 5 分で切断(分 秒)。0 0 は無制限
 logging synchronous
!
line vty 0 4
 login local
 transport input ssh          ! SSH だけ許可。Telnet を止める
 exec-timeout 5 0
 access-class 10 in           ! 接続元を ACL で制限
```

| line の設定 | 動作 |
|---|---|
| `login` | その line に設定した `password` で認証 |
| `login local` | ローカルの `username` データベースで認証 |
| `no login` | 認証なし |
| `login authentication <リスト>` | AAA のメソッドリストで認証(`aaa new-model` 後) |

`privilege 15` のユーザは、ログイン直後から特権 EXEC になる。

### 4. SSH の設定

```
hostname R1                              ! 既定の "Router" のままでは鍵を作れない
ip domain name example.com
crypto key generate rsa modulus 2048     ! 鍵の名前は ホスト名.ドメイン名
ip ssh version 2
username admin privilege 15 secret Adm1n-Pass
line vty 0 4
 login local
 transport input ssh
```

| | Telnet | SSH |
|---|---|---|
| ポート | TCP 23 | TCP 22 |
| 暗号化 | なし(平文) | あり |

- SSH v2 には 768 ビット以上の RSA 鍵が要る。2048 ビット以上を使う
- `show ip ssh`(バージョン、タイムアウト)、`show ssh`(接続中のセッション)
- `ip ssh time-out 60`、`ip ssh authentication-retries 3`
- `login block-for 120 attempts 3 within 60`: 60 秒以内に 3 回失敗したら 120 秒間ログインを拒否

### 5. AAA

| 要素 | 問い | 例 |
|---|---|---|
| Authentication(認証) | 誰か | ユーザ名とパスワードの確認 |
| Authorization(認可) | 何をしてよいか | 権限レベル、実行できるコマンド |
| Accounting(アカウンティング) | 何をしたか | ログイン時刻、実行コマンドの記録 |

機器ごとにローカルユーザを作ると、台数が増えたときに管理できない。AAA サーバ(Cisco ISE など)でアカウントを集中管理し、ネットワーク機器は **AAA クライアント**(NAS)として問い合わせる。

| | RADIUS | TACACS+ |
|---|---|---|
| 規格 | 標準(RFC 2865) | Cisco 開発(現在は RFC 8907) |
| トランスポート | **UDP** 1812(認証・認可)、1813(アカウンティング)。旧 1645 / 1646 | **TCP 49** |
| 暗号化 | **パスワードだけ** | **パケット本体すべて** |
| 認証と認可 | 一体 | **分離** |
| コマンド単位の認可 | できない | **できる** |
| 主な用途 | ネットワークアクセス(802.1X、無線、VPN) | 機器の管理アクセス |

### 6. AAA クライアントの設定

```
aaa new-model                                    ! AAA を有効化
!
! サーバの定義
tacacs server TAC1
 address ipv4 10.1.1.10
 key T@cKey
!
radius server RAD1
 address ipv4 10.1.1.11 auth-port 1812 acct-port 1813
 key R@dKey
!
! サーバグループ(任意)
aaa group server tacacs+ TAC-GRP
 server name TAC1
aaa group server radius RAD-GRP
 server name RAD1
!
! メソッドリスト
aaa authentication login default group TAC-GRP local
aaa authentication login CONSOLE local
aaa authorization exec default group TAC-GRP local
aaa accounting exec default start-stop group TAC-GRP
!
! 適用
line vty 0 4
 login authentication default       ! default は自動適用されるので省略可
 transport input ssh
line console 0
 login authentication CONSOLE
!
ip tacacs source-interface Loopback0
```

**メソッドリストの要点**

- `aaa authentication login <リスト名> <方式1> <方式2> …`
- 左から順に試す。**次の方式に進むのは、前の方式が応答しない(エラー・タイムアウト)ときだけ**
- サーバが「認証失敗」を返したら、そこで拒否して終わる。`local` には進まない
- `default` リストは、別のリストを指定していないすべての line に適用される
- 末尾に `local` を置く。サーバに到達できないときのログイン手段を残すため。ローカルユーザを必ず1つ作っておく
- 方式: `group tacacs+`、`group radius`、`group <グループ名>`、`local`、`enable`、`line`、`none`

> **【注意】** `aaa new-model` を入力した直後から、VTY には既定でローカル認証が適用される。ローカルユーザを作る前に実行すると、リモートから入れなくなる。

- サーバの `key`(共有鍵)は、サーバ側の設定と一致させる。不一致だと認証できない
- サーバ側には、この機器を AAA クライアントとして登録する(送信元 IP アドレスと共有鍵)

```
show aaa servers                              ! サーバの状態、要求・応答の数
test aaa group TAC-GRP admin Adm1n-Pass legacy
show running-config | section aaa
debug aaa authentication
debug tacacs
debug radius
```

| 症状 | 原因 |
|---|---|
| 常にローカルユーザで認証される | サーバに到達できない。経路、ACL、ファイアウォール(TCP 49 / UDP 1812) |
| サーバのアカウントで拒否される | 共有鍵の不一致、サーバ側にクライアント未登録(送信元 IP の不一致)、パスワード誤り |
| サーバ停止時に誰も入れない | メソッドリストに `local` がない。ローカルユーザがない |
| ログインはできるが特権がない | 認可の未設定、サーバ側の権限設定 |

> **【4.1 まとめ】**
>
> - `enable secret`。ユーザは `username … secret`。タイプ 8 / 9 が強い、7 は弱い
> - VTY は `login local` + `transport input ssh`
> - SSH: ホスト名 → ドメイン名 → RSA 鍵 → `ip ssh version 2`
> - RADIUS: UDP 1812 / 1813、パスワードだけ暗号化、認証と認可が一体
> - TACACS+: TCP 49、全体を暗号化、AAA を分離、コマンド認可
> - `aaa new-model` → サーバ定義 → メソッドリスト → line に適用
> - 次の方式に進むのは無応答のときだけ。末尾に `local`

## 4.2 SFTP / SCP による安全なファイル転送で機器の設定とソフトウェアを管理する

### 1. IOS のファイルシステム

| ファイルシステム | 内容 |
|---|---|
| `flash:`(`bootflash:`) | IOS イメージ、vlan.dat など。不揮発 |
| `nvram:` | startup-config。不揮発 |
| `system:` | running-config。RAM(揮発) |
| `usbflash0:` | USB メモリ |

| 設定ファイル | 場所 | 内容 |
|---|---|---|
| running-config | RAM | 動作中の設定。再起動で消える |
| startup-config | NVRAM | 起動時に読み込む設定 |

```
show file systems
dir flash:
show flash:
copy running-config startup-config       ! 保存(write memory と同じ)
copy startup-config running-config       ! マージされる。置き換えではない
erase startup-config                     ! 初期化(次回起動時)
delete flash:old-image.bin
more flash:backup.cfg
```

### 2. 転送プロトコルの比較

| プロトコル | ポート | 認証 | 暗号化 | 備考 |
|---|---|---|---|---|
| TFTP | UDP 69 | なし | なし | 単純。信頼できる閉域のみ |
| FTP | TCP 20 / 21 | あり(平文) | なし | |
| **SCP** | TCP 22(SSH) | あり | あり | SSH 上でファイルをコピー |
| **SFTP** | TCP 22(SSH) | あり | あり | SSH 上のファイル転送プロトコル。FTP とは別物 |
| HTTPS | TCP 443 | あり | あり | |

設定ファイルにはパスワードのハッシュや SNMP コミュニティ、共有鍵が含まれる。IOS イメージは改ざんされると機器を乗っ取られる。管理用の転送には SCP / SFTP を使う。

### 3. SCP

**機器が SCP クライアントになる(機器からコマンドを実行)**

```
! 設定のバックアップ(機器 → サーバ)
copy running-config scp://backup@10.1.1.50/R1-config.cfg
copy startup-config scp:

! IOS イメージの取得(サーバ → 機器)
copy scp://admin@10.1.1.50/isr4300-universalk9.17.09.04a.SPA.bin flash:

! 設定の復元
copy scp://backup@10.1.1.50/R1-config.cfg running-config
```

URL を省略して `copy flash: scp:` とすると、アドレス、ユーザ名、ファイル名を対話形式で聞かれる。

**機器を SCP サーバにする(管理端末から機器へ送る)**

```
! 前提: SSH が動いていること、AAA の認証と認可
aaa new-model
aaa authentication login default local
aaa authorization exec default local
username admin privilege 15 secret Adm1n-Pass
ip scp server enable
```

```
# 管理端末(Linux / macOS / Windows の OpenSSH)から
scp new-image.bin admin@10.1.1.1:flash:new-image.bin
scp admin@10.1.1.1:nvram:startup-config ./R1-startup.cfg
```

SCP サーバの要件: SSH が有効、ユーザが権限レベル 15、EXEC の認可が設定されている。

### 4. SFTP

IOS は SFTP クライアントとして動作する。

```
copy running-config sftp://backup@10.1.1.50/R1-config.cfg
copy sftp://admin@10.1.1.50/isr4300-universalk9.17.09.04a.SPA.bin flash:
!
ip ssh source-interface Loopback0        ! 送信元インターフェースを固定
```

### 5. IOS イメージの更新手順

| 順 | 作業 | コマンド |
|---|---|---|
| 1 | 現在のバージョン、空き容量、メモリを確認 | `show version`、`dir flash:` |
| 2 | 設定をバックアップ | `copy running-config scp:` |
| 3 | サーバへの到達性を確認 | `ping` |
| 4 | イメージを転送 | `copy scp: flash:` |
| 5 | **完全性を検証** | `verify /md5 flash:<ファイル>`(または `/sha512`)。公式のハッシュ値と比較 |
| 6 | 起動イメージを指定 | `boot system flash:<ファイル>` |
| 7 | 設定を保存 | `copy running-config startup-config` |
| 8 | 再起動 | `reload` |
| 9 | 確認 | `show version` |

- `boot system` を複数書くと上から順に試す。指定がなければフラッシュ内の最初のイメージで起動する
- IOS XE のインストールモードでは `install add file flash:<ファイル> activate commit` を使う
- コンフィグレーションレジスタ: 既定は `0x2102`(startup-config を読み込んで起動)。`0x2142` は startup-config を読まずに起動(パスワードリカバリ用)。`show version` の最終行で確認する

### 6. トラブルシュート

| 症状 | 原因 |
|---|---|
| `%Error opening scp://… (Permission denied)` | ユーザ名・パスワード誤り、サーバ側の書き込み権限なし |
| タイムアウト | サーバへの経路なし、TCP 22 が ACL / ファイアウォールで遮断、サーバで SSH 停止 |
| 機器への scp が拒否される | `ip scp server enable` 未設定、ユーザの権限が 15 でない、`aaa authorization exec` 未設定 |
| `%Error copying … (No space left on device)` | フラッシュの空き不足。不要なイメージを削除 |
| 転送後に起動しない | イメージ破損(ハッシュ未確認)、機種違い、`boot system` の誤り |
| ハッシュが一致しない | 転送中の破損、改ざん。再取得する |

> **【4.2 まとめ】**
>
> - running-config は RAM、startup-config は NVRAM、IOS はフラッシュ
> - SCP / SFTP は SSH(TCP 22)上で動き、認証と暗号化がある。TFTP(UDP 69)はどちらもない
> - `copy running-config scp://user@host/file`、`copy scp://… flash:`
> - 機器を SCP サーバにするには `ip scp server enable` + SSH + 権限 15 + EXEC 認可
> - 転送後は `verify /md5` で検証し、`boot system` → 保存 → `reload`
> - コンフィグレーションレジスタの既定は 0x2102

## 4.3 IOS XE ルータで NAT / PAT を設定する

### 1. 用語

| 用語 | 意味 | 例 |
|---|---|---|
| 内部ローカル(inside local) | 内部ホストの、内部から見たアドレス。変換前 | 192.168.1.10 |
| 内部グローバル(inside global) | 内部ホストの、外部から見たアドレス。変換後 | 203.0.113.5 |
| 外部グローバル(outside global) | 外部ホストの、外部でのアドレス | 198.51.100.20 |
| 外部ローカル(outside local) | 外部ホストの、内部から見たアドレス。通常は外部グローバルと同じ | 198.51.100.20 |

「内部 / 外部」は機器がどこにあるか、「ローカル / グローバル」はどこから見たアドレスか。

### 2. 種類

| 種類 | 対応 | 用途 |
|---|---|---|
| スタティック NAT | 1対1、固定 | 内部のサーバを外部に公開する。外部からの開始も可 |
| ダイナミック NAT | 1対1、プールから動的に割り当て | プールのアドレス数までしか同時に出られない |
| **PAT**(NAPT、オーバーロード) | 多対1。ポート番号で区別 | 多数の内部ホストが1つのグローバルアドレスを共有。最も一般的 |

### 3. 設定

**共通: インターフェースの内外を指定する**

```
interface GigabitEthernet0/0/0
 ip address 192.168.1.1 255.255.255.0
 ip nat inside
!
interface GigabitEthernet0/0/1
 ip address 203.0.113.1 255.255.255.248
 ip nat outside
```

**スタティック NAT**

```
ip nat inside source static 192.168.1.10 203.0.113.5
```

**スタティック PAT(ポートフォワーディング)**

```
ip nat inside source static tcp 192.168.1.10 80 203.0.113.1 8080
```

外部から 203.0.113.1:8080 あての通信を 192.168.1.10:80 へ転送する。

**ダイナミック NAT**

```
access-list 1 permit 192.168.1.0 0.0.0.255                              ! 変換対象の内部アドレス
ip nat pool POOL1 203.0.113.2 203.0.113.6 netmask 255.255.255.248       ! 割り当てるアドレス
ip nat inside source list 1 pool POOL1
```

**PAT(インターフェースのアドレスを使う)**

```
access-list 1 permit 192.168.1.0 0.0.0.255
ip nat inside source list 1 interface GigabitEthernet0/0/1 overload
```

**PAT(プールを使う)**

```
ip nat inside source list 1 pool POOL1 overload
```

- ACL の `permit` は「変換する」、`deny` は「変換しない(そのまま転送)」という意味。フィルタリングではない
- `overload` を付けるとポート番号も変換する。付け忘れるとダイナミック NAT になり、プールのアドレス数しか同時に出られない

### 4. 処理の順序

| 方向 | 順序 |
|---|---|
| 内部 → 外部 | ルーティング → NAT(送信元を変換) |
| 外部 → 内部 | NAT(あて先を戻す) → ルーティング |

### 5. 確認

```
R1# show ip nat translations
Pro  Inside global        Inside local        Outside local       Outside global
tcp  203.0.113.1:1024     192.168.1.10:51000  198.51.100.20:443   198.51.100.20:443
tcp  203.0.113.1:1025     192.168.1.11:51000  198.51.100.20:443   198.51.100.20:443
---  203.0.113.5          192.168.1.10        ---                 ---
```

- `Pro` が `---` でポートのない行はスタティック NAT(常に表示される)
- ポート付きの行は PAT の動的エントリ。通信が発生して初めて作られる
- 同じ Inside global アドレスで、ポート番号によって内部ホストを区別している

```
R1# show ip nat statistics
Total active translations: 3 (1 static, 2 dynamic; 2 extended)
Outside interfaces:
  GigabitEthernet0/0/1
Inside interfaces:
  GigabitEthernet0/0/0
Hits: 120  Misses: 4
Dynamic mappings:
-- Inside Source
[Id: 1] access-list 1 interface GigabitEthernet0/0/1 refcount 2
```

```
clear ip nat translation *       ! 動的エントリを消去
debug ip nat
show access-lists                ! NAT 用 ACL のマッチ数
```

ダイナミック NAT のエントリの既定タイムアウトは 24 時間。PAT の TCP は 24 時間、UDP は 5 分。

### 6. トラブルシュート

| 症状 | 原因 |
|---|---|
| 変換エントリが作られない | `ip nat inside` / `outside` の指定漏れ・逆。ACL が対象アドレスに一致しない |
| 一部のホストだけ出られない | ACL のワイルドカードマスクの誤り。ダイナミック NAT のプール枯渇(`overload` 忘れ) |
| 変換はされるが応答が戻らない | ISP 側に内部グローバルアドレスへの経路がない。プールのアドレスが外部 IF のサブネット外 |
| 外部からサーバに入れない | スタティック NAT / ポートフォワーディングなし。ポート番号の誤り。ACL で拒否 |
| `%Dynamic mapping in use, cannot remove` | 使用中の設定を変更しようとした。`clear ip nat translation *` してから変更 |
| 内部同士の通信まで変換される | ACL の範囲が広すぎる |
| ルータ自身はインターネットに出られるが内部ホストは出られない | NAT の未設定・誤り。デフォルトルートはある |

> **【4.3 まとめ】**
>
> - 内部ローカル = 変換前の内部アドレス、内部グローバル = 変換後
> - インターフェースに `ip nat inside` / `ip nat outside`
> - スタティック: `ip nat inside source static <ローカル> <グローバル>`
> - PAT: `ip nat inside source list <ACL> interface <IF> overload`
> - ACL の permit は変換対象の指定
> - `show ip nat translations`、`show ip nat statistics`
> - `overload` 忘れ、inside / outside の逆、ACL 誤りが定番

## 4.4 DNS レコードの問題を診断する

出題範囲: A、AAAA、CNAME、MX、NS、PTR。ホスト、Web アプリケーション、メールサーバへの名前によるアクセスを支える。

### 1. DNS の仕組み

- 名前と IP アドレスを対応付ける分散データベース。**UDP 53**(応答が大きい場合とゾーン転送は TCP 53)
- 階層構造: ルート(`.`)→ TLD(`com`、`jp`)→ 第2レベル(`example.com`)→ ホスト(`www.example.com`)
- FQDN: ホスト名からルートまでを省略せずに書いた名前

| 役割 | 内容 |
|---|---|
| スタブリゾルバ | クライアント OS の問い合わせ機能 |
| キャッシュ DNS サーバ(フルリゾルバ) | クライアントの代わりにルートから順にたどって答えを得る(再帰問い合わせを受け、反復問い合わせを行う)。結果を TTL の間キャッシュする |
| 権威 DNS サーバ | ゾーンの正式な情報を持ち、応答する |

**名前解決の流れ**(`www.example.com` の場合)

1. クライアントが自分のキャッシュと hosts ファイルを確認する
2. キャッシュ DNS サーバに問い合わせる
3. キャッシュ DNS サーバがルートサーバに問い合わせ、`com` の NS を得る
4. `com` のサーバに問い合わせ、`example.com` の NS を得る
5. `example.com` の権威サーバに問い合わせ、A レコードを得る
6. クライアントに返し、TTL の間キャッシュする

### 2. レコードの種類

| レコード | 内容 | 例 |
|---|---|---|
| **A** | 名前 → IPv4 アドレス | `www.example.com. IN A 192.0.2.10` |
| **AAAA** | 名前 → IPv6 アドレス | `www.example.com. IN AAAA 2001:db8::10` |
| **CNAME** | 別名 → 正式名 | `shop.example.com. IN CNAME www.example.com.` |
| **MX** | ドメインあてメールの配送先。優先度付き | `example.com. IN MX 10 mail1.example.com.` |
| **NS** | ゾーンの権威サーバ | `example.com. IN NS ns1.example.com.` |
| **PTR** | IP アドレス → 名前(逆引き) | `10.2.0.192.in-addr.arpa. IN PTR www.example.com.` |
| SOA | ゾーンの管理情報(シリアル番号、更新間隔など) | |
| TXT | 任意の文字列。SPF、DKIM など | |

**レコードごとの規則**

| レコード | 規則 |
|---|---|
| CNAME | 同じ名前に他のレコード(A、MX など)を併存させられない。ゾーンの頂点(`example.com` 自体)には置けない。CNAME の連鎖は避ける |
| MX | 優先度の**数値が小さいほうが優先**。値は**ホスト名**(A / AAAA を持つ名前)。IP アドレスや CNAME を指してはならない |
| NS | 親ゾーンの委任と子ゾーンの NS が一致している必要がある。NS が指す名前には A / AAAA(グルーレコード)が要る |
| PTR | IPv4 は `in-addr.arpa`(オクテットを逆順に)、IPv6 は `ip6.arpa`。逆引きゾーンは正引きとは別に管理される |

### 3. 診断コマンド

```
# Windows / macOS / Linux
nslookup www.example.com
nslookup -type=MX example.com
nslookup www.example.com 8.8.8.8        # 問い合わせ先を指定
nslookup 192.0.2.10                     # 逆引き

# macOS / Linux
dig www.example.com A
dig example.com MX +short
dig example.com NS
dig -x 192.0.2.10
dig @ns1.example.com www.example.com    # 権威サーバに直接
dig +trace www.example.com              # ルートから順にたどる
```

```
$ dig example.com MX

;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4321
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 2

;; ANSWER SECTION:
example.com.        3600  IN  MX  10 mail1.example.com.
example.com.        3600  IN  MX  20 mail2.example.com.

;; ADDITIONAL SECTION:
mail1.example.com.  3600  IN  A   192.0.2.25
mail2.example.com.  3600  IN  A   192.0.2.26
```

| status | 意味 |
|---|---|
| NOERROR | 正常。ANSWER が 0 件なら「名前はあるが、その種類のレコードがない」 |
| **NXDOMAIN** | その名前が存在しない |
| **SERVFAIL** | サーバ側の失敗。権威サーバに到達できない、委任の不備、DNSSEC 検証失敗 |
| REFUSED | 問い合わせを拒否された |

| nslookup の表示 | 意味 |
|---|---|
| `Non-authoritative answer` | キャッシュからの応答。異常ではない |
| `Non-existent domain` | NXDOMAIN |
| `DNS request timed out` | サーバから応答がない |

### 4. 症状から原因を絞る

| 症状 | 疑うレコード・原因 |
|---|---|
| IP アドレスでは開けるが、名前では開けない | A / AAAA がない、名前の誤り、クライアントの DNS サーバ設定 |
| IPv4 では開けるが IPv6 では開けない(またはその逆) | AAAA(または A)がない、アドレスの誤り |
| 名前は引けるが違うサーバにつながる | A レコードの値が古い・誤り。キャッシュ(TTL 経過待ち)。hosts ファイルの上書き |
| 別名(`shop.`)だけ開けない | CNAME がない、CNAME の先の名前に A がない |
| 設定変更後、一部の利用者だけ古いサーバにつながる | キャッシュ。TTL が切れるまで残る。事前に TTL を短くしておく |
| ドメインあてのメールが届かない | MX がない、MX の値が IP アドレスや CNAME、MX が指すホストに A がない |
| 予備のメールサーバに先に配送される | MX の優先度が逆(数値の小さいほうが優先) |
| 送ったメールが相手に拒否される、迷惑メール扱い | 送信サーバの PTR がない、正引きと逆引きが不一致 |
| `traceroute` やログに名前が出ない | PTR がない |
| ドメイン全体が引けない(SERVFAIL) | NS の誤り、委任先サーバの停止、親ゾーンの NS と不一致、グルーレコードなし |
| 特定のキャッシュ DNS からだけ引けない | そのサーバのキャッシュ(ネガティブキャッシュを含む)、フォワーダの障害 |
| 社内からは引けるが社外から引けない | 内部用と外部用のゾーンが別(スプリット DNS)。外部ゾーンにレコードがない |

**切り分けの手順**

1. `nslookup <名前>` で応答を確認する(status、ANSWER)
2. 問い合わせ先を変える(`nslookup <名前> 8.8.8.8`)。結果が違えばキャッシュか、参照サーバの問題
3. 権威サーバに直接問い合わせる(`dig @<NS> <名前>`)。ここで正しければレコードは正しく、途中のキャッシュが原因
4. `dig +trace` で、どの階層で止まるかを見る(委任の問題)
5. レコードの種類を指定して確認する(A、AAAA、MX、CNAME、PTR)

### 5. IOS の DNS 関連コマンド

```
ip name-server 8.8.8.8 8.8.4.4        ! 機器が使う DNS サーバ
ip domain lookup                      ! 名前解決を有効化(既定で有効)
no ip domain lookup                   ! 無効化。打ち間違いを名前として引きにいくのを止める
ip domain name example.com
ip host SW1 192.168.99.2              ! 静的な対応(hosts に相当)
show hosts
```

> **【4.4 まとめ】**
>
> - A は IPv4、AAAA は IPv6、CNAME は別名、MX はメール、NS は権威サーバ、PTR は逆引き
> - MX は数値が小さいほうが優先。値はホスト名(A を持つ名前)。CNAME や IP は不可
> - CNAME は他のレコードと併存不可。ゾーンの頂点に置けない
> - NXDOMAIN は名前なし、SERVFAIL はサーバ側の失敗・委任不備
> - 変更が反映されないのは TTL(キャッシュ)
> - メールの拒否は PTR を疑う
> - 権威サーバへの直接問い合わせで、レコードの誤りかキャッシュかを分ける

## 4.5 IPsec リモートアクセス VPN とサイト間 VPN(プロトコルと転送モード)

### 1. VPN の種類

| 種類 | 接続 | 端末側 | 例 |
|---|---|---|---|
| **サイト間 VPN** | 拠点のゲートウェイ同士(ルータ、ファイアウォール) | VPN ソフト不要。端末は VPN を意識しない | 本社と支社の常時接続 |
| **リモートアクセス VPN** | 個々の端末と拠点のゲートウェイ | VPN クライアントが必要(クライアントレスはブラウザのみ) | 在宅勤務、出張先 |

| リモートアクセスの方式 | 内容 |
|---|---|
| クライアント型 | 端末に VPN クライアント(Cisco Secure Client、旧 AnyConnect)を入れる。IPsec(IKEv2)または TLS(SSL VPN)。全アプリケーションが使える |
| クライアントレス | ブラウザから HTTPS で接続。Web アプリケーションなど一部に限られる |

| トンネルの扱い | 内容 |
|---|---|
| フルトンネル | 端末の全通信を VPN に通す。社内のセキュリティ機器で検査できる |
| スプリットトンネル | 社内あてだけ VPN に通し、インターネットあては直接出す。帯域を節約できる |

### 2. IPsec が提供するもの

| 機能 | 内容 | 使う技術 |
|---|---|---|
| 機密性 | 盗聴されても読めない | 暗号化: AES(DES、3DES は旧式) |
| 完全性 | 改ざんを検出する | ハッシュ(HMAC): SHA-2(MD5、SHA-1 は旧式) |
| 認証 | 相手が本物か確かめる | 事前共有鍵(PSK)、デジタル証明書(RSA、ECDSA) |
| リプレイ防止 | 再送攻撃を防ぐ | シーケンス番号 |

鍵交換には Diffie-Hellman(DH)を使う。盗聴される経路上で共通鍵を安全に生成する。

### 3. プロトコル

| プロトコル | 番号 | 機能 |
|---|---|---|
| **IKE**(Internet Key Exchange) | UDP **500**(NAT 越えは UDP **4500**) | 相手の認証、パラメータの交渉、鍵の生成、SA の確立 |
| **ESP**(Encapsulating Security Payload) | IP プロトコル **50** | **暗号化** + 完全性 + 認証 + リプレイ防止 |
| **AH**(Authentication Header) | IP プロトコル **51** | 完全性 + 認証 + リプレイ防止。**暗号化しない** |

- AH は IP ヘッダも含めて完全性を検証するため、アドレスを書き換える NAT を通せない。実用上は ESP を使う
- **SA**(Security Association): 暗号・認証方式と鍵についての合意。IPsec SA は片方向で、双方向の通信には2つ要る

| IKEv1 のフェーズ | 内容 |
|---|---|
| フェーズ 1 | 相手を認証し、IKE SA(ISAKMP SA)を作る。以後の交渉を保護する。メインモード / アグレッシブモード |
| フェーズ 2 | IPsec SA を作る。実データの保護に使う。クイックモード |

IKEv2 は IKEv1 より交換が少なく、NAT トラバーサルと EAP 認証を標準で備える。現在の推奨。

### 4. 転送モード

| | トンネルモード | トランスポートモード |
|---|---|---|
| 保護する範囲 | **元の IP パケット全体**(IP ヘッダを含む) | **ペイロードのみ**(元の IP ヘッダはそのまま) |
| IP ヘッダ | 新しい IP ヘッダを付ける(あて先は VPN ゲートウェイ) | 元の IP ヘッダを使う |
| 元の送信元・あて先アドレス | 隠れる | 見える |
| オーバーヘッド | 大きい | 小さい |
| 用途 | **サイト間 VPN**、リモートアクセス VPN | ホスト間、**GRE over IPsec** |

```
元のパケット:         [IPヘッダ][TCP][データ]

トランスポート(ESP): [IPヘッダ][ESPヘッダ][TCP][データ][ESPトレーラ][ESP認証]
                                           └────── 暗号化 ──────┘

トンネル(ESP):       [新IPヘッダ][ESPヘッダ][元IPヘッダ][TCP][データ][ESPトレーラ][ESP認証]
                                             └──────── 暗号化 ────────┘
```

### 5. 関連技術

| 技術 | 内容 |
|---|---|
| GRE | 汎用トンネル(IP プロトコル 47)。マルチキャストやルーティングプロトコルを通せる。**暗号化しない** |
| GRE over IPsec | GRE で包み、IPsec で暗号化する。IPsec 単体ではマルチキャストを運べない弱点を補う |
| DMVPN | ハブ&スポーク構成で、スポーク間のトンネルを動的に張る |
| SSL / TLS VPN | TCP 443。ファイアウォールを通りやすい。リモートアクセス向け |
| MPLS VPN | 通信事業者の閉域網。暗号化はしない |

| インターネット VPN | 専用線・閉域網 |
|---|---|
| 安価。回線を選ばない。暗号化で保護 | 高価。帯域・遅延が保証される |

> **【4.5 まとめ】**
>
> - サイト間はゲートウェイ同士、リモートアクセスは端末とゲートウェイ
> - IKE: UDP 500(NAT-T は 4500)。SA の確立と鍵交換
> - ESP: プロトコル 50。暗号化あり。AH: プロトコル 51。暗号化なし、NAT 不可
> - トンネルモードはパケット全体を保護して新しい IP ヘッダを付ける。サイト間で使う
> - トランスポートモードはペイロードだけ保護。GRE over IPsec、ホスト間で使う
> - 機密性 AES、完全性 SHA、認証 PSK / 証明書、鍵交換 DH

## 4.6 IPv4 アクセスコントロールリストを設定する

出題範囲: 標準、拡張、番号付き、名前付き。

### 1. ACL の基本

ACL は条件(ACE)のリスト。パケットを上から順に照合し、**最初に一致した行**の動作(permit / deny)を適用して終わる。

| 規則 | 内容 |
|---|---|
| 上から順に評価 | 最初に一致した行で決まる。以降は見ない |
| **暗黙の deny** | 末尾に見えない `deny any`(拡張は `deny ip any any`)がある。どの行にも一致しないパケットは破棄 |
| 適用数 | インターフェースごと、方向(in / out)ごと、プロトコル(IPv4 / IPv6)ごとに1つ |
| 自己発信 | ルータ自身が生成したパケットは、アウトバウンド ACL の対象外 |
| 空の ACL | 存在しない ACL を適用すると、すべて許可になる |

| | 標準 ACL | 拡張 ACL |
|---|---|---|
| 条件 | **送信元 IP アドレスのみ** | 送信元 / あて先 IP、プロトコル、送信元 / あて先ポートなど |
| 番号 | **1〜99**、1300〜1999 | **100〜199**、2000〜2699 |
| 配置の原則 | **あて先の近く** | **送信元の近く** |

- 標準 ACL は送信元しか見ないので、送信元の近くに置くと他のあて先への通信まで止めてしまう
- 拡張 ACL は細かく指定できるので、不要なトラフィックを早い段階で落とすため送信元の近くに置く

| 方向 | 評価のタイミング |
|---|---|
| インバウンド(in) | インターフェースで受信した直後。ルーティングの前 |
| アウトバウンド(out) | ルーティングの後、インターフェースから送信する直前 |

### 2. ワイルドカードマスク

0 のビットは「一致を確認する」、1 のビットは「無視する」。サブネットマスクの反転。

| 対象 | 書き方 |
|---|---|
| 192.168.1.0/24 | `192.168.1.0 0.0.0.255` |
| 192.168.1.64/26 | `192.168.1.64 0.0.0.63` |
| 172.16.0.0/20 | `172.16.0.0 0.0.15.255` |
| 10.1.1.4/30 | `10.1.1.4 0.0.0.3` |
| ホスト 1台 | `host 192.168.1.10`(= `192.168.1.10 0.0.0.0`) |
| すべて | `any`(= `0.0.0.0 255.255.255.255`) |

計算: 255.255.255.255 − サブネットマスク。/26 なら 255 − 192 = 63。

### 3. 標準 ACL

```
! 番号付き
access-list 10 remark Permit-Admin-Net
access-list 10 deny host 192.168.1.100
access-list 10 permit 192.168.1.0 0.0.0.255
!
interface GigabitEthernet0/1
 ip access-group 10 out
```

```
! 名前付き
ip access-list standard ADMIN-ONLY
 permit 192.168.1.0 0.0.0.255
 deny any log
!
line vty 0 4
 access-class ADMIN-ONLY in        ! VTY への接続元を制限
```

> **【ひっかけ】** インターフェースには `ip access-group`、VTY には `access-class`。入れ替えた選択肢が出る。

### 4. 拡張 ACL

```
access-list <100-199> {permit|deny} <プロトコル> <送信元> [<送信元ポート>] <あて先> [<あて先ポート>] [オプション]
```

```
! 番号付き
access-list 110 permit tcp 192.168.1.0 0.0.0.255 host 10.1.1.80 eq 443
access-list 110 permit udp 192.168.1.0 0.0.0.255 host 10.1.1.53 eq 53
access-list 110 deny   ip  192.168.1.0 0.0.0.255 10.1.1.0 0.0.0.255
access-list 110 permit ip  any any
!
interface GigabitEthernet0/0
 ip access-group 110 in
```

```
! 名前付き
ip access-list extended WEB-FILTER
 remark Allow web to server, block telnet
 permit tcp any host 10.1.1.80 eq 80
 permit tcp any host 10.1.1.80 eq 443
 deny   tcp any any eq 23
 permit icmp any any echo
 permit icmp any any echo-reply
 permit tcp any any established
 deny   ip any any log
```

| プロトコル | 対象 |
|---|---|
| `ip` | すべての IP パケット(TCP、UDP、ICMP などを含む) |
| `tcp` / `udp` | ポート番号を指定できる |
| `icmp` | メッセージタイプを指定できる(`echo`、`echo-reply`) |
| `ospf`、`eigrp`、`gre`、`esp` | 各プロトコル |

| ポートの演算子 | 意味 |
|---|---|
| `eq 80` | 等しい |
| `neq 80` | 等しくない |
| `gt 1023` | より大きい |
| `lt 1024` | より小さい |
| `range 20 21` | 範囲 |

| キーワード | ポート | | キーワード | ポート |
|---|---|---|---|---|
| `ftp-data` / `ftp` | TCP 20 / 21 | | `domain` | UDP・TCP 53 |
| `ssh`(22) | TCP 22 | | `bootps` / `bootpc` | UDP 67 / 68 |
| `telnet` | TCP 23 | | `tftp` | UDP 69 |
| `smtp` | TCP 25 | | `ntp` | UDP 123 |
| `www` | TCP 80 | | `snmp` / `snmptrap` | UDP 161 / 162 |
| `pop3` | TCP 110 | | `syslog` | UDP 514 |
| 443(HTTPS) | TCP 443 | | `bgp` | TCP 179 |

- **ポートの位置に注意**。送信元アドレスの直後に書けば送信元ポート、あて先アドレスの直後に書けばあて先ポート。クライアントからサーバへの通信では、あて先ポートがサービスのポート
- `established`: ACK または RST の付いた TCP セグメント(確立済みの接続の戻り)だけに一致
- `log`: 一致したパケットをログに記録する

### 5. 編集

番号付きの旧来の方法(`access-list 10 …`)は末尾に追加しかできず、行の削除は ACL 全体の削除になる。名前付き ACL のモード(番号付きにも使える)で**シーケンス番号**を指定すれば、行単位で挿入・削除できる。

```
R1# show access-lists
Extended IP access list WEB-FILTER
    10 permit tcp any host 10.1.1.80 eq www (152 matches)
    20 permit tcp any host 10.1.1.80 eq 443 (2048 matches)
    30 deny tcp any any eq telnet (3 matches)
    40 deny ip any any log (17 matches)

R1(config)# ip access-list extended WEB-FILTER
R1(config-ext-nacl)# 25 permit tcp any host 10.1.1.80 eq 8080     ! 20 と 30 の間に挿入
R1(config-ext-nacl)# no 30                                        ! 行を削除
R1(config)# ip access-list resequence WEB-FILTER 10 10            ! 番号を振り直す
R1(config)# ip access-list standard 10                            ! 番号付き ACL を名前付きモードで編集
```

### 6. 確認

```
show access-lists                  ! 全 ACL と一致数
show ip access-lists WEB-FILTER
show ip interface g0/0             ! 適用されている ACL と方向
show running-config | include access-group
clear access-list counters
```

```
R1# show ip interface g0/0
  Outgoing access list is not set
  Inbound  access list is 110
```

### 7. 設計とトラブルシュート

| 原則 | 内容 |
|---|---|
| 具体的な条件を上に | ホスト単位の deny は、ネットワーク単位の permit より上に書く |
| よく一致する行を上に | 処理効率 |
| 末尾の扱いを明示 | 許可リスト方式なら何も書かない(暗黙の deny)。拒否リスト方式なら最後に `permit ip any any` |
| 戻りの通信を考える | 片方向だけ許可しても通信は成立しない |
| 必要なプロトコルを止めない | ルーティングプロトコル(OSPF)、DHCP、DNS、ICMP |

| 症状 | 原因 |
|---|---|
| ACL 適用後、すべての通信が止まる | permit 行がない(deny だけの ACL)。暗黙の deny |
| 意図した deny が効かない | 上の行で先に permit されている(順序)。一致数で確認 |
| 一部のホストだけ効く / 効かない | ワイルドカードマスクの誤り。サブネットマスクを書いている |
| まったく効かない | インターフェース・方向の誤り。ACL 名・番号の不一致。適用漏れ |
| HTTP を許可したのに通らない | ポートを送信元側に書いている。戻りの通信が止まっている。DNS(UDP 53)を許可していない |
| OSPF ネイバーが落ちた | ACL が OSPF(プロトコル 89)を止めている |
| ルータ自身からの ping は通る | アウトバウンド ACL は自己発信パケットを対象にしない |
| リモートで ACL を適用して切断された | 自分の管理通信(SSH)を止めた。`reload in 10` を先に入れておく |

> **【4.6 まとめ】**
>
> - 上から順、最初の一致で決定、末尾に暗黙の deny
> - 標準は送信元のみ・1〜99・あて先の近く。拡張は 100〜199・送信元の近く
> - ワイルドカード = 255.255.255.255 − マスク
> - `ip access-group <ACL> {in|out}`(IF)、`access-class <ACL> in`(VTY)
> - 拡張: `permit tcp <送信元> <あて先> eq <ポート>`。ポートの位置に注意
> - 名前付きモードでシーケンス番号を使って挿入・削除
> - `show access-lists` の一致数、`show ip interface` で適用を確認

## 4.7 L2 セキュリティ機能を設定する

| 攻撃 | 内容 | 対策 |
|---|---|---|
| MAC フラッディング | 偽の送信元 MAC を大量に送り、MAC テーブルをあふれさせて全フレームをフラッディングさせる | **ポートセキュリティ** |
| DHCP スプーフィング | 不正 DHCP サーバが偽のゲートウェイ・DNS を配る(中間者攻撃) | **DHCP スヌーピング** |
| DHCP スタベーション | 偽の MAC で大量に要求し、プールを枯渇させる | DHCP スヌーピング(レート制限)、ポートセキュリティ |
| ARP スプーフィング(ポイズニング) | 偽の ARP 応答で、他ホストの ARP テーブルを書き換える(中間者攻撃) | **ダイナミック ARP インスペクション** |
| 不正 RA | 偽の RA で IPv6 のゲートウェイやプレフィックスを配る | **RA ガード** |
| ブロードキャストストーム | ループや故障 NIC による大量のフラッディング | **ストーム制御**、STP |
| VLAN ホッピング(スイッチスプーフィング) | DTP でトランクを交渉し、全 VLAN にアクセスする | アクセスモード固定、`switchport nonegotiate` |
| VLAN ホッピング(ダブルタギング) | ネイティブ VLAN のタグを二重に付けて別 VLAN に送り込む | ネイティブ VLAN を未使用の VLAN にする |
| 不正スイッチの接続 | STP のトポロジを乱す | BPDU ガード、ルートガード(→ 2.5) |

### 4.7.a DHCP スヌーピング

ポートを**信頼(trusted)**と**非信頼(untrusted)**に分け、非信頼ポートから届く DHCP サーバのメッセージを破棄する。

| ポート | 接続先 | 既定 |
|---|---|---|
| 信頼 | DHCP サーバ、サーバのある方向のアップリンク | — |
| 非信頼 | 端末 | **既定**(全ポート) |

```
ip dhcp snooping                         ! グローバルで有効化
ip dhcp snooping vlan 10,20              ! 対象 VLAN を指定(両方必要)
no ip dhcp snooping information option   ! オプション 82 の挿入を止める(必要な場合)
!
interface GigabitEthernet0/24            ! アップリンク(サーバ方向)
 ip dhcp snooping trust
!
interface range GigabitEthernet0/1 - 20  ! 端末ポート
 ip dhcp snooping limit rate 10          ! 1 秒あたりの DHCP パケット数。超えると err-disabled
```

**非信頼ポートでの検査**

| 検査 | 内容 |
|---|---|
| サーバメッセージの破棄 | OFFER、ACK、NAK を受信したら破棄 |
| MAC アドレスの照合 | フレームの送信元 MAC と DHCP ペイロード内の chaddr が違えば破棄 |
| RELEASE / DECLINE の照合 | バインディングテーブルと受信ポートが合わなければ破棄 |

**バインディングテーブル**: 非信頼ポートのクライアントについて、MAC アドレス、IP アドレス、リース時間、VLAN、インターフェースを記録する。DAI がこれを参照する。

```
SW1# show ip dhcp snooping
Switch DHCP snooping is enabled
DHCP snooping is configured on following VLANs:
10,20
Insertion of option 82 is enabled
Interface                  Trusted    Rate limit (pps)
-----------------------    -------    ----------------
GigabitEthernet0/1         no         10
GigabitEthernet0/24        yes        unlimited

SW1# show ip dhcp snooping binding
MacAddress          IpAddress       Lease(sec)  Type           VLAN  Interface
0C:1A:2B:3C:4D:01   192.168.10.11   86100       dhcp-snooping  10    GigabitEthernet0/1
```

| 症状 | 原因 |
|---|---|
| 有効化後、誰もアドレスを取得できない | サーバ方向のポートに `trust` がない |
| 同上 | `ip dhcp snooping vlan` の指定漏れ(グローバルだけ有効) |
| リレー経由で取得できない | スイッチが挿入したオプション 82(giaddr が 0)をサーバ・リレーが破棄。`no ip dhcp snooping information option` か、上流で信頼設定 |
| 端末ポートが err-disabled | レート制限超過 |

### 4.7.b ダイナミック ARP インスペクション(DAI)

非信頼ポートで受信した ARP パケットの「送信元 IP と送信元 MAC の組」を、**DHCP スヌーピングのバインディングテーブル**と照合する。一致しなければ破棄する。

```
ip dhcp snooping
ip dhcp snooping vlan 10
ip arp inspection vlan 10
!
interface GigabitEthernet0/24
 ip dhcp snooping trust
 ip arp inspection trust                  ! スイッチ間、ルータ方向
!
ip arp inspection validate src-mac dst-mac ip   ! 追加の検査(任意)
```

- 前提として DHCP スヌーピングが要る
- 固定 IP の機器はバインディングテーブルにない。ARP ACL で許可するか、そのポートを信頼にする

```
arp access-list STATIC-HOSTS
 permit ip host 192.168.10.5 mac host 0c1a.2b3c.4d99
ip arp inspection filter STATIC-HOSTS vlan 10
```

- 非信頼ポートには既定で **15 pps** のレート制限がある。超えると err-disabled(`ip arp inspection limit rate 30` で変更)

```
show ip arp inspection
show ip arp inspection interfaces
show ip arp inspection statistics vlan 10
```

ログ: `%SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Req) on Gi0/3, vlan 10.`

### 4.7.c ストーム制御

ポートで受信するブロードキャスト、マルチキャスト、未知のユニキャストの量を監視し、しきい値を超えたら抑える。

```
interface GigabitEthernet0/5
 storm-control broadcast level 10.00 5.00     ! 上昇しきい値 10%、下降しきい値 5%(帯域比)
 storm-control multicast level pps 2000
 storm-control unicast level bps 50m
 storm-control action shutdown                ! err-disabled にする
 storm-control action trap                    ! SNMP トラップを送る
```

| 項目 | 内容 |
|---|---|
| 単位 | `level <%>`(帯域幅に対する割合)、`level bps`、`level pps` |
| 上昇しきい値 | これを超えると抑制を開始 |
| 下降しきい値 | これを下回ると通常に戻る。省略時は上昇しきい値と同じ |
| 既定の動作 | しきい値を超えた分の**トラフィックを破棄**(ポートは up のまま) |
| `action shutdown` | ポートを err-disabled にする |
| `action trap` | SNMP トラップ |

```
SW1# show storm-control broadcast
Interface  Filter State   Upper        Lower        Current
---------  -------------  -----------  -----------  ----------
Gi0/5      Forwarding     10.00%       5.00%        0.12%
Gi0/6      Blocking       10.00%       5.00%        23.40%
```

ログ: `%STORM_CONTROL-3-FILTERED: A Broadcast storm detected on Gi0/6. A packet filter action has been applied on the interface.`

err-disabled からの復旧: `shutdown` → `no shutdown`、または `errdisable recovery cause storm-control`。

### 4.7.d RA ガード

IPv6 では、ホストは RA を受けてデフォルトゲートウェイとプレフィックスを決める。攻撃者や誤設定の機器が RA を送ると、通信を横取りできる。RA ガードは、ホスト用のポートで受信した RA を破棄する。IPv6 ファーストホップセキュリティ(FHS)の一つ。

```
! ポリシーを定義
ipv6 nd raguard policy HOSTS
 device-role host                     ! 既定。RA を破棄
!
ipv6 nd raguard policy ROUTERS
 device-role router                   ! RA を許可
!
! ポートに適用
interface range GigabitEthernet0/1 - 20
 ipv6 nd raguard attach-policy HOSTS
!
interface GigabitEthernet0/24         ! 正規のルータに向くポート
 ipv6 nd raguard attach-policy ROUTERS
!
! 簡易設定(既定ポリシー = host)
interface GigabitEthernet0/5
 ipv6 nd raguard
```

| device-role | 動作 |
|---|---|
| `host`(既定) | そのポートで受信した RA とリダイレクトを破棄 |
| `router` | RA を許可(ポリシーで条件を付けられる) |

```
show ipv6 nd raguard policy
show ipv6 nd raguard policy HOSTS
show ipv6 snooping policies
```

| 症状 | 原因 |
|---|---|
| ホストが SLAAC でアドレスを得られない、IPv6 のゲートウェイがない | 正規ルータ側のポートにも host ポリシーを適用している |
| 不正な RA が通る | ポリシー未適用。ルータ用ポリシーを端末ポートに適用 |

IPv4 の DHCP スヌーピングに対応する IPv6 の機能として、DHCPv6 ガード、IPv6 スヌーピング(ND インスペクション)、ソースガードがある。

### 4.7.e ポートセキュリティ

ポートで許可する送信元 MAC アドレスの数とアドレスを制限する。

```
interface GigabitEthernet0/5
 switchport mode access                         ! 必須。dynamic のままでは有効化できない
 switchport port-security                       ! 有効化(これがないと他の設定は効かない)
 switchport port-security maximum 2             ! 最大数。既定 1
 switchport port-security mac-address sticky    ! 動的に学習し、running-config に書く
 switchport port-security mac-address 0c1a.2b3c.4d01   ! 静的に指定
 switchport port-security violation restrict    ! 違反時の動作。既定 shutdown
 switchport port-security aging time 60
```

| セキュア MAC の種類 | 学習 | 保存 |
|---|---|---|
| 静的 | 手動設定 | running-config |
| 動的 | 自動学習 | MAC テーブルのみ。リンクダウン・再起動で消える |
| スティッキー | 自動学習 | **running-config に追記**。`copy run start` で保存すれば再起動後も残る |

| 違反モード | 違反フレーム | ログ・SNMP | 違反カウンタ | ポート |
|---|---|---|---|---|
| `protect` | 破棄 | **しない** | 増えない | up のまま |
| `restrict` | 破棄 | **する** | 増える | up のまま |
| `shutdown`(既定) | 破棄 | する | 増える | **err-disabled** |

違反になる条件: 最大数を超える MAC アドレスからのフレームを受信した。または、あるポートのセキュア MAC が、同じ VLAN の別のセキュアポートで見つかった。

```
SW1# show port-security interface g0/5
Port Security              : Enabled
Port Status                : Secure-shutdown
Violation Mode             : Shutdown
Aging Time                 : 0 mins
Maximum MAC Addresses      : 2
Total MAC Addresses        : 2
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 2
Last Source Address:Vlan   : 0c1a.2b3c.4dff:10
Security Violation Count   : 1
```

| Port Status | 意味 |
|---|---|
| Secure-up | 正常 |
| Secure-shutdown | 違反で err-disabled |
| Secure-down | リンクダウン |

```
show port-security                      ! 全ポートの概要(最大数、現在数、違反数、動作)
show port-security address              ! セキュア MAC の一覧
show interfaces status err-disabled
```

ログ: `%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 0c1a.2b3c.4dff on port GigabitEthernet0/5.`

**復旧**

```
interface GigabitEthernet0/5
 shutdown
 no shutdown
!
errdisable recovery cause psecure-violation
errdisable recovery interval 300
```

違反の原因(不正な機器)を取り除いてから復旧する。

- IP 電話と PC を1ポートに接続する場合は、最大数を 2 以上(機種により 3)にする
- スティッキーで学習済みのポートで端末を交換するときは、`clear port-security sticky interface g0/5` などで古いアドレスを消す

> **【4.7 まとめ】**
>
> - DHCP スヌーピング: グローバル + VLAN 指定。サーバ方向に `ip dhcp snooping trust`。既定は非信頼
> - DAI: スヌーピングのバインディングテーブルで ARP を検査。`ip arp inspection vlan`。固定 IP は ARP ACL
> - ストーム制御: `storm-control broadcast level`。既定は超過分を破棄、`action shutdown` で err-disabled
> - RA ガード: 端末ポートで RA を破棄。`ipv6 nd raguard`。ルータ側は `device-role router`
> - ポートセキュリティ: アクセスモード必須、`switchport port-security` で有効化。既定は最大 1、shutdown
> - protect は黙って破棄、restrict は破棄 + ログ、shutdown は err-disabled
> - スティッキーは running-config に書かれる
