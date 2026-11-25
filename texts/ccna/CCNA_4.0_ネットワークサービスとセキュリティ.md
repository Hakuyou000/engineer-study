# CCNA テキスト 4.0 ネットワークサービスとセキュリティ(20%)

対象: 200-301 CCNA v2.0

機器への安全なログイン(AAA)、安全なファイルの転送、NAT、DNS、VPN、ACL、L2 のセキュリティ機能を学びます。

## 4.1 ローカルのユーザー名と AAA クライアント(TACACS+ / RADIUS)による管理アクセスを設定する

### 1. 管理のための接続の経路

| 回線 | 用途 | 設定のモード |
|---|---|---|
| コンソール | 直接の接続(ロールオーバーケーブル、USB) | `line console 0` |
| VTY | Telnet / SSH によるリモートの接続 | `line vty 0 4`(スイッチは 0 15) |
| AUX | モデムを通した接続(古い方式) | `line aux 0` |

| モード | プロンプト | 権限レベル |
|---|---|---|
| ユーザー EXEC | `>` | 1 |
| 特権 EXEC | `#` | 15 |
| グローバルコンフィグ | `(config)#` | 15 |

権限レベルは 0〜15 です。

### 2. パスワードの種類

```
enable secret Cisco123!                 ! 特権モードのパスワード。ハッシュにして保存する
enable password Cisco123                ! 平文で保存される。使わない。secret があれば secret が優先される
service password-encryption             ! 平文のパスワードを、タイプ 7 で読みにくくする
```

| タイプ | 方式 | 評価 |
|---|---|---|
| 0 | 平文 | 使ってはいけない |
| 7 | Vigenère 暗号(`service password-encryption`) | 簡単に元に戻せる。のぞき見を防ぐ程度 |
| 5 | MD5 のハッシュ | 弱い |
| 8 | PBKDF2-SHA-256 | 推奨 |
| 9 | scrypt | 推奨 |

```
enable algorithm-type scrypt secret Cisco123!
username admin privilege 15 algorithm-type scrypt secret Adm1n-Pass
```

`show running-config` では `username admin privilege 15 secret 9 $9$…` のように表示されます。

### 3. ローカルのユーザー名による認証

```
username admin privilege 15 secret Adm1n-Pass
username oper privilege 1 secret Oper-Pass
!
line console 0
 login local                  ! ローカルのユーザー名 / パスワードで認証する
 exec-timeout 5 0             ! 5 分操作がなければ切断する(分 秒)。0 0 は無制限
 logging synchronous
!
line vty 0 4
 login local
 transport input ssh          ! SSH だけを許可する。Telnet を止める
 exec-timeout 5 0
 access-class 10 in           ! 接続元を ACL で制限する
```

| line の設定 | 動作 |
|---|---|
| `login` | その line に設定した `password` で認証する |
| `login local` | ローカルの `username` のデータベースで認証する |
| `no login` | 認証しない |
| `login authentication <リスト>` | AAA のメソッドリストで認証する(`aaa new-model` の後) |

`privilege 15` のユーザーは、ログインした直後から特権 EXEC になります。

### 4. SSH の設定

```
hostname R1                              ! 既定の "Router" のままでは鍵を作れない
ip domain name example.com
crypto key generate rsa modulus 2048     ! 鍵の名前は「ホスト名.ドメイン名」になる
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

- SSH v2 には、768 ビット以上の RSA の鍵が必要です。2048 ビット以上を使いましょう。
- `show ip ssh`(バージョン、タイムアウト)、`show ssh`(接続中のセッション)で確認します。
- `ip ssh time-out 60`、`ip ssh authentication-retries 3` で、待ち時間と再試行の回数を決められます。
- `login block-for 120 attempts 3 within 60`: 60 秒の間に 3 回失敗したら、120 秒間ログインを拒否します。

### 5. AAA

| 要素 | 問い | 例 |
|---|---|---|
| Authentication(認証) | 誰か | ユーザー名とパスワードを確かめる |
| Authorization(認可) | 何をしてよいか | 権限レベル、実行できるコマンド |
| Accounting(アカウンティング) | 何をしたか | ログインの時刻、実行したコマンドの記録 |

機器ごとにローカルのユーザーを作ると、台数が増えたときに管理しきれません。AAA サーバー(Cisco ISE など)でアカウントをまとめて管理し、ネットワーク機器は **AAA クライアント**(NAS)としてサーバーに問い合わせます。

| | RADIUS | TACACS+ |
|---|---|---|
| 規格 | 標準(RFC 2865) | Cisco が開発(現在は RFC 8907) |
| 運び方 | **UDP** 1812(認証・認可)、1813(アカウンティング)。古くは 1645 / 1646 | **TCP 49** |
| 暗号化 | **パスワードだけ** | **パケットの本体すべて** |
| 認証と認可 | まとめて扱う | **分けて扱う** |
| コマンドごとの認可 | できない | **できる** |
| 主な用途 | ネットワークへの接続(802.1X、無線、VPN) | 機器の管理のためのログイン |

### 6. AAA クライアントの設定

```
aaa new-model                                    ! AAA を有効にする
!
! サーバーを定義する
tacacs server TAC1
 address ipv4 10.1.1.10
 key T@cKey
!
radius server RAD1
 address ipv4 10.1.1.11 auth-port 1812 acct-port 1813
 key R@dKey
!
! サーバーのグループ(任意)
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
! 適用する
line vty 0 4
 login authentication default       ! default は自動で適用されるので、省略してもよい
 transport input ssh
line console 0
 login authentication CONSOLE
!
ip tacacs source-interface Loopback0
```

**メソッドリストの要点**

- `aaa authentication login <リスト名> <方式1> <方式2> …` の形で書きます。
- 左から順に試します。**次の方式に進むのは、前の方式が応答しなかった(エラーやタイムアウト)ときだけ** です。
- サーバーが「認証失敗」を返したら、そこで拒否が決まります。`local` には進みません。
- `default` のリストは、別のリストを指定していないすべての line に適用されます。
- 最後に `local` を書いておきます。サーバーに届かないときでもログインできるようにするためです。ローカルのユーザーを必ず1つ作っておきます。
- 方式には `group tacacs+`、`group radius`、`group <グループ名>`、`local`、`enable`、`line`、`none` があります。

> **【注意】** `aaa new-model` を入力した直後から、VTY には既定でローカルの認証が適用されます。ローカルのユーザーを作る前に実行すると、リモートからログインできなくなります。

- サーバーの `key`(共有鍵)は、サーバー側の設定と一致させます。一致しないと認証できません。
- サーバー側には、この機器を AAA クライアントとして登録します(送信元の IP アドレスと共有鍵)。

```
show aaa servers                              ! サーバーの状態、要求と応答の数
test aaa group TAC-GRP admin Adm1n-Pass legacy
show running-config | section aaa
debug aaa authentication
debug tacacs
debug radius
```

| 症状 | 原因 |
|---|---|
| いつもローカルのユーザーで認証される | サーバーに届いていない。経路、ACL、ファイアウォール(TCP 49 / UDP 1812) |
| サーバーのアカウントで拒否される | 共有鍵の不一致、サーバー側にクライアントが登録されていない(送信元の IP アドレスが違う)、パスワードの誤り |
| サーバーが止まると誰もログインできない | メソッドリストに `local` がない。ローカルのユーザーがいない |
| ログインはできるが、特権がない | 認可が設定されていない、サーバー側の権限の設定 |

> **【4.1 まとめ】**
>
> - `enable secret` を使う。ユーザーは `username … secret`。タイプ 8 / 9 が強く、7 は弱い
> - VTY は `login local` + `transport input ssh`
> - SSH: ホスト名 → ドメイン名 → RSA の鍵 → `ip ssh version 2`
> - RADIUS: UDP 1812 / 1813、パスワードだけを暗号化、認証と認可をまとめて扱う
> - TACACS+: TCP 49、全体を暗号化、AAA を分けて扱う、コマンドごとの認可ができる
> - `aaa new-model` → サーバーの定義 → メソッドリスト → line に適用
> - 次の方式に進むのは、応答がないときだけ。最後に `local`

## 4.2 SFTP / SCP による安全なファイルの転送で、機器の設定とソフトウェアを管理する

### 1. IOS のファイルシステム

| ファイルシステム | 内容 |
|---|---|
| `flash:`(`bootflash:`) | IOS のイメージ、vlan.dat など。電源を切っても消えない |
| `nvram:` | startup-config。電源を切っても消えない |
| `system:` | running-config。RAM にある(電源を切ると消える) |
| `usbflash0:` | USB メモリ |

| 設定ファイル | 場所 | 内容 |
|---|---|---|
| running-config | RAM | 今動いている設定。再起動すると消える |
| startup-config | NVRAM | 起動するときに読み込む設定 |

```
show file systems
dir flash:
show flash:
copy running-config startup-config       ! 保存する(write memory と同じ)
copy startup-config running-config       ! 今の設定に足し合わされる。置き換えではない
erase startup-config                     ! 初期化する(次に起動したときに効く)
delete flash:old-image.bin
more flash:backup.cfg
```

### 2. 転送のプロトコルの比較

| プロトコル | ポート | 認証 | 暗号化 | 備考 |
|---|---|---|---|---|
| TFTP | UDP 69 | なし | なし | 単純。信頼できる閉じたネットワークだけで使う |
| FTP | TCP 20 / 21 | あり(平文) | なし | |
| **SCP** | TCP 22(SSH) | あり | あり | SSH の上でファイルをコピーする |
| **SFTP** | TCP 22(SSH) | あり | あり | SSH の上のファイル転送のプロトコル。FTP とは別のもの |
| HTTPS | TCP 443 | あり | あり | |

設定ファイルには、パスワードのハッシュ、SNMP のコミュニティ、共有鍵が含まれています。IOS のイメージは、改ざんされると機器を乗っ取られます。管理のための転送には SCP / SFTP を使います。

### 3. SCP

**機器が SCP クライアントになる(機器からコマンドを実行する)**

```
! 設定のバックアップ(機器 → サーバー)
copy running-config scp://backup@10.1.1.50/R1-config.cfg
copy startup-config scp:

! IOS のイメージを取得する(サーバー → 機器)
copy scp://admin@10.1.1.50/isr4300-universalk9.17.09.04a.SPA.bin flash:

! 設定を元に戻す
copy scp://backup@10.1.1.50/R1-config.cfg running-config
```

URL を省いて `copy flash: scp:` と入力すると、アドレス、ユーザー名、ファイル名を順に質問されます。

**機器を SCP サーバーにする(管理用の端末から機器へ送る)**

```
! 前提: SSH が動いていること、AAA の認証と認可
aaa new-model
aaa authentication login default local
aaa authorization exec default local
username admin privilege 15 secret Adm1n-Pass
ip scp server enable
```

```
# 管理用の端末(Linux / macOS / Windows の OpenSSH)から
scp new-image.bin admin@10.1.1.1:flash:new-image.bin
scp admin@10.1.1.1:nvram:startup-config ./R1-startup.cfg
```

SCP サーバーにするための条件: SSH が有効、ユーザーの権限レベルが 15、EXEC の認可が設定されている。

### 4. SFTP

IOS は SFTP のクライアントとして動きます。

```
copy running-config sftp://backup@10.1.1.50/R1-config.cfg
copy sftp://admin@10.1.1.50/isr4300-universalk9.17.09.04a.SPA.bin flash:
!
ip ssh source-interface Loopback0        ! 送信元のインターフェースを固定する
```

### 5. IOS のイメージを更新する手順

| 順番 | 作業 | コマンド |
|---|---|---|
| 1 | 今のバージョン、空き容量、メモリを確認する | `show version`、`dir flash:` |
| 2 | 設定をバックアップする | `copy running-config scp:` |
| 3 | サーバーに届くかを確かめる | `ping` |
| 4 | イメージを転送する | `copy scp: flash:` |
| 5 | **壊れていないかを確かめる** | `verify /md5 flash:<ファイル>`(または `/sha512`)。公式のハッシュ値と比べる |
| 6 | 起動するイメージを指定する | `boot system flash:<ファイル>` |
| 7 | 設定を保存する | `copy running-config startup-config` |
| 8 | 再起動する | `reload` |
| 9 | 確認する | `show version` |

- `boot system` を複数書くと、上から順に試します。指定がなければ、フラッシュの中の最初のイメージで起動します。
- IOS XE のインストールモードでは、`install add file flash:<ファイル> activate commit` を使います。
- コンフィグレーションレジスタ: 既定は `0x2102`(startup-config を読み込んで起動する)です。`0x2142` は startup-config を読まずに起動します(パスワードを忘れたときの復旧用)。`show version` の最後の行で確認できます。

### 6. トラブルシュート

| 症状 | 原因 |
|---|---|
| `%Error opening scp://… (Permission denied)` | ユーザー名やパスワードの誤り、サーバー側に書き込みの権限がない |
| タイムアウト | サーバーへの経路がない、TCP 22 が ACL やファイアウォールで遮断されている、サーバーで SSH が止まっている |
| 機器への scp が拒否される | `ip scp server enable` が設定されていない、ユーザーの権限が 15 ではない、`aaa authorization exec` が設定されていない |
| `%Error copying … (No space left on device)` | フラッシュの空きが足りない。不要なイメージを削除する |
| 転送した後に起動しない | イメージが壊れている(ハッシュを確かめていない)、機種が違う、`boot system` の誤り |
| ハッシュが一致しない | 転送中に壊れた、改ざんされた。取得し直す |

> **【4.2 まとめ】**
>
> - running-config は RAM、startup-config は NVRAM、IOS はフラッシュにある
> - SCP / SFTP は SSH(TCP 22)の上で動き、認証と暗号化がある。TFTP(UDP 69)にはどちらもない
> - `copy running-config scp://ユーザー@ホスト/ファイル`、`copy scp://… flash:`
> - 機器を SCP サーバーにするには `ip scp server enable` + SSH + 権限 15 + EXEC の認可
> - 転送した後は `verify /md5` で確かめ、`boot system` → 保存 → `reload`
> - コンフィグレーションレジスタの既定は 0x2102

## 4.3 IOS XE のルーターで NAT / PAT を設定する

### 1. 用語

NAT は、IP アドレスを別のアドレスに変換する仕組みです。社内のプライベートアドレスを、インターネットで使えるグローバルアドレスに変えるときによく使います。

| 用語 | 意味 | 例 |
|---|---|---|
| 内部ローカル(inside local) | 社内のホストの、社内から見たアドレス。変換する前 | 192.168.1.10 |
| 内部グローバル(inside global) | 社内のホストの、外から見たアドレス。変換した後 | 203.0.113.5 |
| 外部グローバル(outside global) | 外部のホストの、外部でのアドレス | 198.51.100.20 |
| 外部ローカル(outside local) | 外部のホストの、社内から見たアドレス。普通は外部グローバルと同じ | 198.51.100.20 |

「内部 / 外部」は機器がどこにあるか、「ローカル / グローバル」はどこから見たアドレスかを表します。

### 2. 種類

| 種類 | 対応の仕方 | 用途 |
|---|---|---|
| スタティック NAT | 1対1で固定 | 社内のサーバーを外部に公開する。外部から通信を始めることもできる |
| ダイナミック NAT | 1対1で、プールから動的に割り当てる | プールのアドレスの数までしか、同時に外に出られない |
| **PAT**(NAPT、オーバーロード) | 多対1。ポート番号で区別する | 多数の社内のホストが、1つのグローバルアドレスを共有する。最も一般的 |

PAT では、ポート番号で内部のホストを区別します。次の数字は説明のための例です。

```text
192.168.1.10:49152  -->  203.0.113.5:49152
192.168.1.11:49152  -->  203.0.113.5:49153
```

どちらのホストも、外に出るときは 203.0.113.5 になります。戻ってきた通信は、ポート番号で元のホストに振り分けられます。

### 3. 設定

**共通: インターフェースの内側と外側を指定する**

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

外部から 203.0.113.1 の 8080 番に来た通信を、192.168.1.10 の 80 番に転送します。

**ダイナミック NAT**

```
access-list 1 permit 192.168.1.0 0.0.0.255                              ! 変換する社内のアドレス
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

- ACL の `permit` は「変換する」、`deny` は「変換しない(そのまま転送する)」という意味です。通信を止めるためのものではありません。
- `overload` を付けると、ポート番号も変換します。付け忘れるとダイナミック NAT になり、プールのアドレスの数しか同時に外に出られません。

### 4. 処理の順番

| 方向 | 順番 |
|---|---|
| 社内 → 外部 | ルーティング → NAT(送信元を変換する) |
| 外部 → 社内 | NAT(あて先を元に戻す) → ルーティング |

PC が外部の Web サーバーと通信するときの、R1 でのアドレスの変わり方です。

```text
社内から外部へ(R1 が送信元を変換する)
PC  --> R1  : src 192.168.1.10    dst 198.51.100.20   <- 内部ローカル
R1  --> Web : src 203.0.113.5     dst 198.51.100.20   <- 内部グローバル

外部から社内へ(R1 があて先を元に戻す)
Web --> R1  : src 198.51.100.20   dst 203.0.113.5     <- 内部グローバル
R1  --> PC  : src 198.51.100.20   dst 192.168.1.10    <- 内部ローカル
```

### 5. 確認

```
R1# show ip nat translations
Pro  Inside global        Inside local        Outside local       Outside global
tcp  203.0.113.1:1024     192.168.1.10:51000  198.51.100.20:443   198.51.100.20:443
tcp  203.0.113.1:1025     192.168.1.11:51000  198.51.100.20:443   198.51.100.20:443
---  203.0.113.5          192.168.1.10        ---                 ---
```

- `Pro` が `---` でポートのない行は、スタティック NAT です(いつも表示されます)。
- ポート付きの行は、PAT が動的に作った変換の記録です。通信が起きて初めて作られます。
- 同じ Inside global のアドレスを、ポート番号で社内のホストごとに区別しています。

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
clear ip nat translation *       ! 動的な変換の記録を消す
debug ip nat
show access-lists                ! NAT 用の ACL に当てはまった数
```

ダイナミック NAT の記録が消えるまでの既定の時間は 24 時間です。PAT の TCP は 24 時間、UDP は 5 分です。

### 6. トラブルシュート

| 症状 | 原因 |
|---|---|
| 変換の記録が作られない | `ip nat inside` / `outside` の指定が抜けているか、逆になっている。ACL が対象のアドレスに当てはまらない |
| 一部のホストだけ外に出られない | ACL のワイルドカードマスクの誤り。ダイナミック NAT のプールの枯渇(`overload` の付け忘れ) |
| 変換はされるが、応答が戻らない | ISP 側に、内部グローバルアドレスへの経路がない。プールのアドレスが外側のインターフェースのサブネットの外にある |
| 外部からサーバーに入れない | スタティック NAT やポートフォワーディングがない。ポート番号の誤り。ACL で拒否されている |
| `%Dynamic mapping in use, cannot remove` | 使用中の設定を変えようとした。`clear ip nat translation *` をしてから変える |
| 社内同士の通信まで変換される | ACL の範囲が広すぎる |
| ルーター自身はインターネットに出られるが、社内のホストは出られない | NAT が設定されていないか誤っている。デフォルトルートはある |

> **【4.3 まとめ】**
>
> - 内部ローカルは変換する前の社内のアドレス、内部グローバルは変換した後のアドレス
> - インターフェースに `ip nat inside` / `ip nat outside` を設定する
> - スタティック: `ip nat inside source static <ローカル> <グローバル>`
> - PAT: `ip nat inside source list <ACL> interface <IF> overload`
> - ACL の permit は、変換する対象の指定
> - `show ip nat translations`、`show ip nat statistics` で確認する
> - `overload` の付け忘れ、inside / outside の逆、ACL の誤りがよくある原因

## 4.4 DNS のレコードの問題を診断する

出題範囲: A、AAAA、CNAME、MX、NS、PTR。ホスト、Web アプリケーション、メールサーバーに名前でアクセスするための仕組みです。

### 1. DNS の仕組み

- 名前と IP アドレスを対応させる、分散したデータベースです。**UDP の 53 番** を使います(応答が大きい場合やゾーンの転送は TCP の 53 番)。
- 階層の構造: ルート(`.`)→ TLD(`com`、`jp`)→ 第2レベル(`example.com`)→ ホスト(`www.example.com`)。
- FQDN は、ホスト名からルートまでを省略せずに書いた名前です。

| 役割 | 内容 |
|---|---|
| スタブリゾルバー | クライアントの OS にある、問い合わせの機能 |
| キャッシュ DNS サーバー(フルリゾルバー) | クライアントの代わりに、ルートから順にたどって答えを得る(再帰の問い合わせを受け、反復の問い合わせを行う)。結果を TTL の間、保存(キャッシュ)する |
| 権威 DNS サーバー | ゾーン(ドメイン)の正式な情報を持ち、応答する |

**名前解決の流れ**(`www.example.com` の場合)

1. クライアントが、自分のキャッシュと hosts ファイルを確認します。
2. キャッシュ DNS サーバーに問い合わせます。
3. キャッシュ DNS サーバーがルートサーバーに問い合わせ、`com` の NS(担当のサーバー)を知ります。
4. `com` のサーバーに問い合わせ、`example.com` の NS を知ります。
5. `example.com` の権威サーバーに問い合わせ、A レコードを得ます。
6. クライアントに答えを返し、TTL の間キャッシュします。

名前解決の流れを描きます。矢印の query は問い合わせ、NS は担当のサーバーの知らせ、A は答えです。

```text
Client       Cache       Root        com         example.com
   |           |           |          |               |
   |- query -->|           |          |               |   www.example.com は?
   |           |- query -->|          |               |
   |           |<- NS -----|          |               |   com の担当を知らせる
   |           |- query ------------->|               |
   |           |<- NS ----------------|               |   example.com の担当を知らせる
   |           |- query ----------------------------->|
   |           |<- A ---------------------------------|   A レコードを答える
   |<- A ------|           |          |               |   TTL の間キャッシュする
```

### 2. レコードの種類

| レコード | 内容 | 例 |
|---|---|---|
| **A** | 名前 → IPv4 アドレス | `www.example.com. IN A 192.0.2.10` |
| **AAAA** | 名前 → IPv6 アドレス | `www.example.com. IN AAAA 2001:db8::10` |
| **CNAME** | 別名 → 正式な名前 | `shop.example.com. IN CNAME www.example.com.` |
| **MX** | ドメインあてのメールの配送先。優先度付き | `example.com. IN MX 10 mail1.example.com.` |
| **NS** | ゾーンの権威サーバー | `example.com. IN NS ns1.example.com.` |
| **PTR** | IP アドレス → 名前(逆引き) | `10.2.0.192.in-addr.arpa. IN PTR www.example.com.` |
| SOA | ゾーンの管理の情報(シリアル番号、更新の間隔など) | |
| TXT | 自由な文字列。SPF、DKIM などに使う | |

**レコードごとの決まり**

| レコード | 決まり |
|---|---|
| CNAME | 同じ名前に、他のレコード(A、MX など)を一緒に置けない。ゾーンの頂点(`example.com` そのもの)には置けない。CNAME をつなげすぎない |
| MX | 優先度の **数値が小さいほうが優先**。値は **ホスト名**(A / AAAA を持つ名前)。IP アドレスや CNAME を指してはいけない |
| NS | 親のゾーンの委任と、子のゾーンの NS が一致している必要がある。NS が指す名前には A / AAAA(グルーレコード)が必要 |
| PTR | IPv4 は `in-addr.arpa`(オクテットを逆の順に)、IPv6 は `ip6.arpa`。逆引きのゾーンは、正引きとは別に管理される |

### 3. 診断のコマンド

```
# Windows / macOS / Linux
nslookup www.example.com
nslookup -type=MX example.com
nslookup www.example.com 8.8.8.8        # 問い合わせ先を指定する
nslookup 192.0.2.10                     # 逆引き

# macOS / Linux
dig www.example.com A
dig example.com MX +short
dig example.com NS
dig -x 192.0.2.10
dig @ns1.example.com www.example.com    # 権威サーバーに直接問い合わせる
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
| **SERVFAIL** | サーバー側の処理の失敗。権威サーバーに届かない、委任の不備、DNSSEC の検証の失敗 |
| REFUSED | 問い合わせを拒否された |

| nslookup の表示 | 意味 |
|---|---|
| `Non-authoritative answer` | キャッシュからの応答。異常ではない |
| `Non-existent domain` | NXDOMAIN |
| `DNS request timed out` | サーバーから応答がない |

### 4. 症状から原因を絞り込む

| 症状 | 疑うレコード・原因 |
|---|---|
| IP アドレスでは開けるが、名前では開けない | A / AAAA がない、名前の誤り、クライアントの DNS サーバーの設定 |
| IPv4 では開けるが IPv6 では開けない(またはその逆) | AAAA(または A)がない、アドレスの誤り |
| 名前は引けるが、違うサーバーにつながる | A レコードの値が古いか誤り。キャッシュ(TTL が切れるのを待つ)。hosts ファイルによる上書き |
| 別名(`shop.`)だけ開けない | CNAME がない、CNAME の先の名前に A がない |
| 設定を変えた後、一部の利用者だけ古いサーバーにつながる | キャッシュ。TTL が切れるまで残る。前もって TTL を短くしておく |
| ドメインあてのメールが届かない | MX がない、MX の値が IP アドレスや CNAME になっている、MX が指すホストに A がない |
| 予備のメールサーバーに先に配送される | MX の優先度が逆(数値の小さいほうが優先) |
| 送ったメールが相手に拒否される、迷惑メールになる | 送信サーバーの PTR がない、正引きと逆引きが一致しない |
| `traceroute` やログに名前が出ない | PTR がない |
| ドメイン全体が引けない(SERVFAIL) | NS の誤り、委任先のサーバーの停止、親のゾーンの NS と一致しない、グルーレコードがない |
| 特定のキャッシュ DNS サーバーからだけ引けない | そのサーバーのキャッシュ(「ない」という答えのキャッシュも含む)、フォワーダーの障害 |
| 社内からは引けるが、社外からは引けない | 社内用と社外用のゾーンが別(スプリット DNS)。社外用のゾーンにレコードがない |

**絞り込みの手順**

1. `nslookup <名前>` で応答を確認します(status、ANSWER)。
2. 問い合わせ先を変えてみます(`nslookup <名前> 8.8.8.8`)。結果が違えば、キャッシュか、使っているサーバーの問題です。
3. 権威サーバーに直接問い合わせます(`dig @<NS> <名前>`)。ここで正しければ、レコードは正しく、途中のキャッシュが原因です。
4. `dig +trace` で、どの階層で止まるかを見ます(委任の問題)。
5. レコードの種類を指定して確認します(A、AAAA、MX、CNAME、PTR)。

### 5. IOS の DNS に関係するコマンド

```
ip name-server 8.8.8.8 8.8.4.4        ! 機器が使う DNS サーバー
ip domain lookup                      ! 名前解決を有効にする(既定で有効)
no ip domain lookup                   ! 無効にする。打ち間違えたコマンドを名前として引きに行くのを止める
ip domain name example.com
ip host SW1 192.168.99.2              ! 固定の対応(hosts ファイルにあたる)
show hosts
```

> **【4.4 まとめ】**
>
> - A は IPv4、AAAA は IPv6、CNAME は別名、MX はメール、NS は権威サーバー、PTR は逆引き
> - MX は数値が小さいほうが優先。値はホスト名(A を持つ名前)。CNAME や IP アドレスは使えない
> - CNAME は他のレコードと一緒に置けない。ゾーンの頂点に置けない
> - NXDOMAIN は名前がない、SERVFAIL はサーバー側の失敗や委任の不備
> - 変更が反映されないのは TTL(キャッシュ)のため
> - メールが拒否されるときは PTR を疑う
> - 権威サーバーに直接問い合わせて、レコードの誤りかキャッシュかを見分ける

## 4.5 IPsec のリモートアクセス VPN とサイト間 VPN(プロトコルと転送のモード)

### 1. VPN の種類

VPN は、インターネットなどの共有のネットワークの上に、暗号化した専用の通り道を作る技術です。

| 種類 | 接続 | 端末側 | 例 |
|---|---|---|---|
| **サイト間 VPN** | 拠点のゲートウェイ同士(ルーター、ファイアウォール) | VPN のソフトは不要。端末は VPN を意識しない | 本社と支社の常時の接続 |
| **リモートアクセス VPN** | 個々の端末と拠点のゲートウェイ | VPN クライアントが必要(クライアントレスならブラウザだけ) | 在宅勤務、出張先 |

2 種類の VPN の構成を比べます。

```text
Site-to-site
[LAN-A] --- [GW-A] ====== Internet (IPsec tunnel) ====== [GW-B] --- [LAN-B]

Remote access
[PC + VPN client] ========= Internet (tunnel) ========= [GW] --- [LAN]
```

サイト間 VPN は、ゲートウェイ同士がトンネルを作ります。リモートアクセス VPN は、端末の VPN クライアントとゲートウェイの間にトンネルを作ります。

| リモートアクセスの方式 | 内容 |
|---|---|
| クライアント型 | 端末に VPN クライアント(Cisco Secure Client、旧 AnyConnect)を入れる。IPsec(IKEv2)か TLS(SSL VPN)を使う。すべてのアプリケーションが使える |
| クライアントレス | ブラウザから HTTPS で接続する。Web アプリケーションなど一部に限られる |

| トンネルの使い方 | 内容 |
|---|---|
| フルトンネル | 端末のすべての通信を VPN に通す。社内のセキュリティ機器で検査できる |
| スプリットトンネル | 社内あての通信だけを VPN に通し、インターネットあては直接出す。帯域を節約できる |

### 2. IPsec が提供するもの

| 機能 | 内容 | 使う技術 |
|---|---|---|
| 機密性 | 盗み見られても読めない | 暗号化: AES(DES、3DES は古い) |
| 完全性 | 改ざんを見つける | ハッシュ(HMAC): SHA-2(MD5、SHA-1 は古い) |
| 認証 | 相手が本物かを確かめる | 事前共有鍵(PSK)、デジタル証明書(RSA、ECDSA) |
| リプレイ防止 | 同じパケットの再送による攻撃を防ぐ | シーケンス番号 |

鍵の交換には Diffie-Hellman(DH)を使います。盗み見られる経路の上でも、共通の鍵を安全に作れます。

### 3. プロトコル

| プロトコル | 番号 | 機能 |
|---|---|---|
| **IKE**(Internet Key Exchange) | UDP **500**(NAT を越えるときは UDP **4500**) | 相手の認証、設定の交渉、鍵の生成、SA の確立 |
| **ESP**(Encapsulating Security Payload) | IP プロトコル **50** | **暗号化** + 完全性 + 認証 + リプレイ防止 |
| **AH**(Authentication Header) | IP プロトコル **51** | 完全性 + 認証 + リプレイ防止。**暗号化はしない** |

- AH は IP ヘッダも含めて改ざんを確かめるので、アドレスを書き換える NAT を通せません。実際には ESP を使います。
- **SA**(Security Association): 暗号や認証の方式と鍵についての取り決めです。IPsec の SA は片方向なので、双方向の通信には2つ必要です。

| IKEv1 のフェーズ | 内容 |
|---|---|
| フェーズ 1 | 相手を認証し、IKE SA(ISAKMP SA)を作る。その後の交渉を守る。メインモード / アグレッシブモード |
| フェーズ 2 | IPsec SA を作る。実際のデータを守るのに使う。クイックモード |

IKEv2 は IKEv1 よりやり取りが少なく、NAT を越える機能と EAP の認証を標準で備えています。今の推奨です。

### 4. 転送のモード

| | トンネルモード | トランスポートモード |
|---|---|---|
| 守る範囲 | **元の IP パケット全体**(IP ヘッダを含む) | **中身(ペイロード)だけ**(元の IP ヘッダはそのまま) |
| IP ヘッダ | 新しい IP ヘッダを付ける(あて先は VPN のゲートウェイ) | 元の IP ヘッダを使う |
| 元の送信元・あて先のアドレス | 隠れる | 見える |
| 余分なデータ | 多い | 少ない |
| 用途 | **サイト間 VPN**、リモートアクセス VPN | ホスト同士、**GRE over IPsec** |

```text
元のパケット
[IP][TCP][DATA]

トランスポートモード(ESP)
[IP][ESP-HDR][TCP][DATA][ESP-TRL][ESP-AUTH]
             |<---------------->|  暗号化される範囲

トンネルモード(ESP)
[NEW-IP][ESP-HDR][IP][TCP][DATA][ESP-TRL][ESP-AUTH]
                 |<-------------------->|  暗号化される範囲

IP: 元の IP ヘッダ
NEW-IP: 新しく付ける IP ヘッダ
ESP-HDR: ESP ヘッダ
ESP-TRL: ESP トレーラ
ESP-AUTH: ESP の認証データ
```

### 5. 関係する技術

| 技術 | 内容 |
|---|---|
| GRE | 汎用のトンネル(IP プロトコル 47)。マルチキャストやルーティングプロトコルを通せる。**暗号化はしない** |
| GRE over IPsec | GRE で包み、IPsec で暗号化する。IPsec だけではマルチキャストを運べない弱点を補う |
| DMVPN | ハブ&スポークの構成で、スポーク同士のトンネルを必要なときに作る |
| SSL / TLS VPN | TCP 443 を使う。ファイアウォールを通りやすい。リモートアクセス向け |
| MPLS VPN | 通信事業者の閉じたネットワーク。暗号化はしない |

| インターネット VPN | 専用線・閉域網 |
|---|---|
| 安い。回線を選ばない。暗号化で守る | 高い。帯域や遅延が保証される |

> **【4.5 まとめ】**
>
> - サイト間はゲートウェイ同士、リモートアクセスは端末とゲートウェイをつなぐ
> - IKE: UDP 500(NAT を越えるときは 4500)。SA の確立と鍵の交換
> - ESP: プロトコル 50。暗号化する。AH: プロトコル 51。暗号化せず、NAT を通せない
> - トンネルモードはパケット全体を守り、新しい IP ヘッダを付ける。サイト間で使う
> - トランスポートモードは中身だけを守る。GRE over IPsec、ホスト同士で使う
> - 機密性は AES、完全性は SHA、認証は PSK / 証明書、鍵の交換は DH

## 4.6 IPv4 のアクセスコントロールリストを設定する

出題範囲: 標準、拡張、番号付き、名前付き。

### 1. ACL の基本

ACL は、条件(ACE)を並べたリストです。パケットを上から順に照らし合わせ、**最初に当てはまった行** の動作(permit / deny)を適用して終わります。

| 決まり | 内容 |
|---|---|
| 上から順に評価する | 最初に当てはまった行で決まる。それより下は見ない |
| **暗黙の deny** | 最後に、見えない `deny any`(拡張は `deny ip any any`)がある。どの行にも当てはまらないパケットは捨てられる |
| 適用できる数 | インターフェースごと、方向(in / out)ごと、プロトコル(IPv4 / IPv6)ごとに1つ |
| ルーター自身が出すパケット | ルーター自身が作ったパケットは、アウトバウンドの ACL の対象にならない |
| 空の ACL | 存在しない ACL を適用すると、すべて許可になる |

| | 標準 ACL | 拡張 ACL |
|---|---|---|
| 条件 | **送信元の IP アドレスだけ** | 送信元 / あて先の IP、プロトコル、送信元 / あて先のポートなど |
| 番号 | **1〜99**、1300〜1999 | **100〜199**、2000〜2699 |
| 置く場所の原則 | **あて先の近く** | **送信元の近く** |

- 標準 ACL は送信元しか見ないので、送信元の近くに置くと、他のあて先への通信まで止めてしまいます。
- 拡張 ACL は細かく指定できるので、不要な通信を早いうちに捨てるために送信元の近くに置きます。

| 方向 | 評価される時点 |
|---|---|
| インバウンド(in) | インターフェースで受け取った直後。ルーティングの前 |
| アウトバウンド(out) | ルーティングの後、インターフェースから送り出す直前 |

ルーターを通るパケットが、2 種類の ACL に出会う順番です。

```text
packet --> [Gi0/0] --> in ACL --> routing --> out ACL --> [Gi0/1] --> packet
```

in の ACL はルーティングの前に、out の ACL はルーティングの後に評価されます。

### 2. ワイルドカードマスク

0 のビットは「一致するかを確かめる」、1 のビットは「無視する」という意味です。サブネットマスクを反転したものです。

| 対象 | 書き方 |
|---|---|
| 192.168.1.0/24 | `192.168.1.0 0.0.0.255` |
| 192.168.1.64/26 | `192.168.1.64 0.0.0.63` |
| 172.16.0.0/20 | `172.16.0.0 0.0.15.255` |
| 10.1.1.4/30 | `10.1.1.4 0.0.0.3` |
| 1台のホスト | `host 192.168.1.10`(= `192.168.1.10 0.0.0.0`) |
| すべて | `any`(= `0.0.0.0 255.255.255.255`) |

計算: 255.255.255.255 − サブネットマスク。/26 なら 255 − 192 = 63 です。

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
 access-class ADMIN-ONLY in        ! VTY に接続できる送信元を制限する
```

> **【ひっかけ】** インターフェースには `ip access-group`、VTY には `access-class` を使います。入れ替えた選択肢が出ます。

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
| `icmp` | メッセージの種類を指定できる(`echo`、`echo-reply`) |
| `ospf`、`eigrp`、`gre`、`esp` | それぞれのプロトコル |

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

- **ポートを書く位置に注意します**。送信元のアドレスのすぐ後に書けば送信元のポート、あて先のアドレスのすぐ後に書けばあて先のポートです。クライアントからサーバーへの通信では、あて先のポートがサービスのポートです。
- `established`: ACK か RST の付いた TCP のセグメント(すでに確立した接続の戻り)だけに当てはまります。
- `log`: 当てはまったパケットをログに記録します。

### 5. 編集

古い番号付きの書き方(`access-list 10 …`)では、最後に追加することしかできず、1行を消すと ACL 全体が消えてしまいます。名前付き ACL のモード(番号付きの ACL にも使える)で **シーケンス番号** を指定すると、1行ずつ挿入や削除ができます。

```
R1# show access-lists
Extended IP access list WEB-FILTER
    10 permit tcp any host 10.1.1.80 eq www (152 matches)
    20 permit tcp any host 10.1.1.80 eq 443 (2048 matches)
    30 deny tcp any any eq telnet (3 matches)
    40 deny ip any any log (17 matches)

R1(config)# ip access-list extended WEB-FILTER
R1(config-ext-nacl)# 25 permit tcp any host 10.1.1.80 eq 8080     ! 20 と 30 の間に挿入する
R1(config-ext-nacl)# no 30                                        ! 行を削除する
R1(config)# ip access-list resequence WEB-FILTER 10 10            ! 番号を振り直す
R1(config)# ip access-list standard 10                            ! 番号付きの ACL を名前付きのモードで編集する
```

### 6. 確認

```
show access-lists                  ! すべての ACL と、当てはまった数
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
| 具体的な条件を上に書く | ホスト単位の deny は、ネットワーク単位の permit より上に書く |
| よく当てはまる行を上に書く | 処理が速くなる |
| 最後の扱いをはっきりさせる | 許可するものを並べる方式なら何も書かない(暗黙の deny)。拒否するものを並べる方式なら、最後に `permit ip any any` |
| 戻りの通信を考える | 片方向だけを許可しても、通信は成り立たない |
| 必要なプロトコルを止めない | ルーティングプロトコル(OSPF)、DHCP、DNS、ICMP |

| 症状 | 原因 |
|---|---|
| ACL を適用したら、すべての通信が止まった | permit の行がない(deny だけの ACL)。暗黙の deny |
| 意図した deny が効かない | 上の行で先に permit されている(順番)。当てはまった数で確認する |
| 一部のホストだけ効く / 効かない | ワイルドカードマスクの誤り。サブネットマスクを書いてしまっている |
| まったく効かない | インターフェースや方向の誤り。ACL の名前や番号の不一致。適用し忘れ |
| HTTP を許可したのに通らない | ポートを送信元側に書いている。戻りの通信が止まっている。DNS(UDP 53)を許可していない |
| OSPF のネイバーが切れた | ACL が OSPF(プロトコル 89)を止めている |
| ルーター自身からの ping は通る | アウトバウンドの ACL は、ルーター自身が出すパケットを対象にしない |
| リモートで ACL を適用したら切断された | 自分の管理の通信(SSH)を止めてしまった。先に `reload in 10` を入れておく |

> **【4.6 まとめ】**
>
> - 上から順に、最初に当てはまった行で決まり、最後に暗黙の deny がある
> - 標準は送信元だけを見る・1〜99・あて先の近く。拡張は 100〜199・送信元の近く
> - ワイルドカード = 255.255.255.255 − マスク
> - `ip access-group <ACL> {in|out}`(インターフェース)、`access-class <ACL> in`(VTY)
> - 拡張: `permit tcp <送信元> <あて先> eq <ポート>`。ポートを書く位置に注意
> - 名前付きのモードで、シーケンス番号を使って挿入・削除する
> - `show access-lists` の当てはまった数、`show ip interface` で適用を確認する

## 4.7 L2 のセキュリティ機能を設定する

| 攻撃 | 内容 | 対策 |
|---|---|---|
| MAC フラッディング | 偽の送信元 MAC を大量に送って MAC アドレステーブルをあふれさせ、すべてのフレームをフラッディングさせる | **ポートセキュリティ** |
| DHCP スプーフィング | 不正な DHCP サーバーが、偽のゲートウェイや DNS を配る(中間者攻撃) | **DHCP スヌーピング** |
| DHCP スタベーション | 偽の MAC で大量に要求し、プールを使い切らせる | DHCP スヌーピング(量の制限)、ポートセキュリティ |
| ARP スプーフィング(ポイズニング) | 偽の ARP 応答で、他のホストの ARP テーブルを書き換える(中間者攻撃) | **ダイナミック ARP インスペクション** |
| 不正な RA | 偽の RA で、IPv6 のゲートウェイやプレフィックスを配る | **RA ガード** |
| ブロードキャストストーム | ループや故障した NIC による大量のフラッディング | **ストーム制御**、STP |
| VLAN ホッピング(スイッチスプーフィング) | DTP でトランクを交渉し、すべての VLAN に入り込む | アクセスモードに固定する、`switchport nonegotiate` |
| VLAN ホッピング(ダブルタギング) | ネイティブ VLAN のタグを二重に付けて、別の VLAN に送り込む | ネイティブ VLAN を使っていない VLAN にする |
| 不正なスイッチの接続 | STP のトポロジを乱す | BPDU ガード、ルートガード(→ 2.5) |

### 4.7.a DHCP スヌーピング

ポートを **信頼する(trusted)** ポートと **信頼しない(untrusted)** ポートに分け、信頼しないポートから届く DHCP サーバーのメッセージを捨てます。

| ポート | つながる先 | 既定 |
|---|---|---|
| 信頼する | DHCP サーバー、サーバーのある方向のアップリンク | — |
| 信頼しない | 端末 | **既定**(すべてのポート) |

スイッチのポートの信頼の分け方です。サーバーの方向を信頼し、端末のポートは信頼しません。

```text
[DHCP-Server]
     |
     | Gi0/24 (trusted)
   [SW1]
     +-- Gi0/1 (untrusted) ---- [PC]            <- DISCOVER や REQUEST は通す
     +-- Gi0/2 (untrusted) ---- [Rogue-DHCP]    <- OFFER や ACK は捨てる
```

不正な DHCP サーバーがつながったポートは信頼しないので、その OFFER や ACK は捨てられます。

```
ip dhcp snooping                         ! 全体で有効にする
ip dhcp snooping vlan 10,20              ! 対象の VLAN を指定する(両方が必要)
no ip dhcp snooping information option   ! オプション 82 の挿入を止める(必要な場合)
!
interface GigabitEthernet0/24            ! アップリンク(サーバーの方向)
 ip dhcp snooping trust
!
interface range GigabitEthernet0/1 - 20  ! 端末のポート
 ip dhcp snooping limit rate 10          ! 1 秒あたりの DHCP パケットの数。超えると err-disabled
```

**信頼しないポートでの検査**

| 検査 | 内容 |
|---|---|
| サーバーのメッセージを捨てる | OFFER、ACK、NAK を受け取ったら捨てる |
| MAC アドレスの照合 | フレームの送信元 MAC と、DHCP の中身の chaddr(クライアントの MAC)が違えば捨てる |
| RELEASE / DECLINE の照合 | バインディングテーブルと受け取ったポートが合わなければ捨てる |

**バインディングテーブル**: 信頼しないポートのクライアントについて、MAC アドレス、IP アドレス、リースの時間、VLAN、インターフェースを記録します。DAI がこれを使います。

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
| 有効にした後、誰もアドレスを取得できない | サーバーの方向のポートに `trust` がない |
| 同上 | `ip dhcp snooping vlan` の指定が抜けている(全体だけ有効にした) |
| リレーを通すと取得できない | スイッチが入れたオプション 82(giaddr が 0)を、サーバーやリレーが捨てている。`no ip dhcp snooping information option` にするか、上流で信頼の設定をする |
| 端末のポートが err-disabled になった | 量の制限を超えた |

### 4.7.b ダイナミック ARP インスペクション(DAI)

信頼しないポートで受け取った ARP パケットの「送信元の IP と送信元の MAC の組」を、**DHCP スヌーピングのバインディングテーブル** と照らし合わせます。一致しなければ捨てます。

```
ip dhcp snooping
ip dhcp snooping vlan 10
ip arp inspection vlan 10
!
interface GigabitEthernet0/24
 ip dhcp snooping trust
 ip arp inspection trust                  ! スイッチ同士、ルーターの方向
!
ip arp inspection validate src-mac dst-mac ip   ! 追加の検査(任意)
```

- 前提として、DHCP スヌーピングが必要です。
- 固定の IP アドレスを使う機器は、バインディングテーブルに載りません。ARP ACL で許可するか、そのポートを信頼にします。

```
arp access-list STATIC-HOSTS
 permit ip host 192.168.10.5 mac host 0c1a.2b3c.4d99
ip arp inspection filter STATIC-HOSTS vlan 10
```

- 信頼しないポートには、既定で **15 pps** の量の制限があります。超えると err-disabled になります(`ip arp inspection limit rate 30` で変更できます)。

```
show ip arp inspection
show ip arp inspection interfaces
show ip arp inspection statistics vlan 10
```

ログの例: `%SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Req) on Gi0/3, vlan 10.`

### 4.7.c ストーム制御

ポートで受け取るブロードキャスト、マルチキャスト、あて先の分からないユニキャストの量を見張り、しきい値を超えたら抑えます。

```
interface GigabitEthernet0/5
 storm-control broadcast level 10.00 5.00     ! 上のしきい値 10%、下のしきい値 5%(帯域に対する割合)
 storm-control multicast level pps 2000
 storm-control unicast level bps 50m
 storm-control action shutdown                ! err-disabled にする
 storm-control action trap                    ! SNMP のトラップを送る
```

| 項目 | 内容 |
|---|---|
| 単位 | `level <%>`(帯域に対する割合)、`level bps`、`level pps` |
| 上のしきい値 | これを超えると抑え始める |
| 下のしきい値 | これを下回ると普通に戻る。省略すると上のしきい値と同じ |
| 既定の動作 | しきい値を超えた分の **通信を捨てる**(ポートは up のまま) |
| `action shutdown` | ポートを err-disabled にする |
| `action trap` | SNMP のトラップを送る |

```
SW1# show storm-control broadcast
Interface  Filter State   Upper        Lower        Current
---------  -------------  -----------  -----------  ----------
Gi0/5      Forwarding     10.00%       5.00%        0.12%
Gi0/6      Blocking       10.00%       5.00%        23.40%
```

ログの例: `%STORM_CONTROL-3-FILTERED: A Broadcast storm detected on Gi0/6. A packet filter action has been applied on the interface.`

err-disabled からの復旧: `shutdown` → `no shutdown`、または `errdisable recovery cause storm-control`。

### 4.7.d RA ガード

IPv6 では、ホストは RA を受け取って、デフォルトゲートウェイとプレフィックスを決めます。攻撃者や設定を誤った機器が RA を送ると、通信を横取りされます。RA ガードは、ホスト用のポートで受け取った RA を捨てます。IPv6 のファーストホップセキュリティ(FHS)の1つです。

```
! ポリシーを定義する
ipv6 nd raguard policy HOSTS
 device-role host                     ! 既定。RA を捨てる
!
ipv6 nd raguard policy ROUTERS
 device-role router                   ! RA を許可する
!
! ポートに適用する
interface range GigabitEthernet0/1 - 20
 ipv6 nd raguard attach-policy HOSTS
!
interface GigabitEthernet0/24         ! 正規のルーターに向いたポート
 ipv6 nd raguard attach-policy ROUTERS
!
! 簡単な設定(既定のポリシー = host)
interface GigabitEthernet0/5
 ipv6 nd raguard
```

| device-role | 動作 |
|---|---|
| `host`(既定) | そのポートで受け取った RA とリダイレクトを捨てる |
| `router` | RA を許可する(ポリシーで条件を付けられる) |

```
show ipv6 nd raguard policy
show ipv6 nd raguard policy HOSTS
show ipv6 snooping policies
```

| 症状 | 原因 |
|---|---|
| ホストが SLAAC でアドレスを得られない、IPv6 のゲートウェイがない | 正規のルーター側のポートにも host のポリシーを適用している |
| 不正な RA が通ってしまう | ポリシーが適用されていない。ルーター用のポリシーを端末のポートに適用している |

IPv4 の DHCP スヌーピングに対応する IPv6 の機能として、DHCPv6 ガード、IPv6 スヌーピング(ND インスペクション)、ソースガードがあります。

### 4.7.e ポートセキュリティ

ポートで許可する送信元 MAC アドレスの数と、アドレスそのものを制限します。

```
interface GigabitEthernet0/5
 switchport mode access                         ! 必須。dynamic のままでは有効にできない
 switchport port-security                       ! 有効にする(これがないと他の設定は効かない)
 switchport port-security maximum 2             ! 最大の数。既定は 1
 switchport port-security mac-address sticky    ! 動的に覚え、running-config に書く
 switchport port-security mac-address 0c1a.2b3c.4d01   ! 固定で指定する
 switchport port-security violation restrict    ! 違反したときの動作。既定は shutdown
 switchport port-security aging time 60
```

| セキュア MAC の種類 | 覚え方 | 保存される場所 |
|---|---|---|
| 静的 | 手動で設定する | running-config |
| 動的 | 自動で覚える | MAC アドレステーブルだけ。リンクのダウンや再起動で消える |
| スティッキー | 自動で覚える | **running-config に書き加えられる**。`copy run start` で保存すれば、再起動後も残る |

| 違反モード | 違反したフレーム | ログ・SNMP | 違反のカウンタ | ポート |
|---|---|---|---|---|
| `protect` | 捨てる | **出さない** | 増えない | up のまま |
| `restrict` | 捨てる | **出す** | 増える | up のまま |
| `shutdown`(既定) | 捨てる | 出す | 増える | **err-disabled** |

違反になる条件: 最大の数を超える MAC アドレスからのフレームを受け取った。または、あるポートのセキュア MAC が、同じ VLAN の別のセキュアなポートで見つかった。

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
| Secure-shutdown | 違反して err-disabled になった |
| Secure-down | リンクがダウンしている |

```
show port-security                      ! すべてのポートの概要(最大の数、今の数、違反の数、動作)
show port-security address              ! セキュア MAC の一覧
show interfaces status err-disabled
```

ログの例: `%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 0c1a.2b3c.4dff on port GigabitEthernet0/5.`

**復旧**

```
interface GigabitEthernet0/5
 shutdown
 no shutdown
!
errdisable recovery cause psecure-violation
errdisable recovery interval 300
```

違反の原因(不正な機器)を取り除いてから復旧させます。

- IP 電話と PC を1つのポートにつなぐ場合は、最大の数を 2 以上(機種によっては 3)にします。
- スティッキーで覚えたポートで端末を交換するときは、`clear port-security sticky interface g0/5` などで古いアドレスを消します。

> **【4.7 まとめ】**
>
> - DHCP スヌーピング: 全体の有効化と VLAN の指定。サーバーの方向に `ip dhcp snooping trust`。既定は信頼しない
> - DAI: スヌーピングのバインディングテーブルで ARP を確かめる。`ip arp inspection vlan`。固定の IP は ARP ACL で許可する
> - ストーム制御: `storm-control broadcast level`。既定は超えた分を捨てる。`action shutdown` で err-disabled
> - RA ガード: 端末のポートで RA を捨てる。`ipv6 nd raguard`。ルーター側は `device-role router`
> - ポートセキュリティ: アクセスモードが必須で、`switchport port-security` で有効にする。既定は最大 1、shutdown
> - protect は黙って捨てる、restrict は捨ててログを出す、shutdown は err-disabled にする
> - スティッキーは running-config に書かれる
