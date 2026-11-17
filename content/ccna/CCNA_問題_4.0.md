# CCNA 問題 4.0 ネットワークサービスとセキュリティ

対象: 200-301 CCNA v2.0 / 全34問 / すべてオリジナル問題
対応テキスト: `CCNA_4.0_ネットワークサービスとセキュリティ.md`
解答・解説は末尾。

## 問題

### 4.1 管理アクセスと AAA

**問1** `show running-config` に次の4行がある。パスワードの保護が最も強いものはどれか。

- A. `enable password Cisco123`
- B. `username a password 7 0822455D0A16`
- C. `username b secret 5 $1$mERr$…`
- D. `username c secret 9 $9$nhEmQVczB7dqsO$…`

**問2** ルータで SSH を有効にする。ホスト名とドメイン名は設定済みで、ローカルユーザも作成済みである。次に必要なコマンドはどれか。

- A. `ip ssh version 2` だけでよい
- B. `ip scp server enable`
- C. `crypto key generate rsa modulus 2048`
- D. `service password-encryption`

**問3** VTY 回線で Telnet を禁止し、SSH だけを許可し、ローカルのユーザデータベースで認証する。正しい組み合わせはどれか。

- A. `login` / `transport input all`
- B. `login local` / `transport output ssh`
- C. `no login` / `transport input ssh`
- D. `login local` / `transport input ssh`

**問4** TACACS+ の説明として正しいものはどれか。

- A. TCP 49 を使い、パケット本体全体を暗号化し、認証・認可・アカウンティングを分離する
- B. UDP 1812 を使い、パスワードだけを暗号化する
- C. 認証と認可を1つの処理にまとめる
- D. IEEE 802.1X の認証サーバとして最も一般的に使われる

**問5** 次の設定のルータに、ユーザ `ops` がログインを試みた。TACACS+ サーバは稼働しており、`ops` のパスワードが誤っているとして認証失敗を返した。ルータのローカルには `ops` が正しいパスワードで登録されている。結果はどれか。

```
aaa new-model
aaa authentication login default group tacacs+ local
```

- A. ローカルデータベースで再度認証され、ログインできる
- B. enable パスワードを求められる
- C. ログインは拒否される
- D. 認証なしでログインできる

**問6** 問5 と同じ設定で、TACACS+ サーバがダウンして応答しない場合はどうなるか。

- A. すべてのログインが拒否される
- B. RADIUS サーバに自動で切り替わる
- C. 認証なしでログインできる
- D. ローカルデータベースで認証される

**問7** AAA クライアントの設定をしたが、サーバのアカウントで常に認証に失敗する。ルータからサーバへの ping は成功し、ユーザ名とパスワードは正しい。最も考えられる原因はどれか。

- A. ルータとサーバの共有鍵(key)が一致していない、またはサーバにこのルータがクライアントとして登録されていない
- B. `aaa new-model` が設定されていない
- C. VTY に `transport input ssh` がない
- D. ルータのホスト名が既定のままである

### 4.2 ファイル転送

**問8** 認証と暗号化の両方を備えたファイル転送はどれか。**2つ**選べ。

- A. TFTP
- B. FTP
- C. SCP
- D. SFTP

**問9** running-config を、SCP サーバ 10.1.1.50 にユーザ `backup` で保存する。正しいコマンドはどれか。

- A. `copy running-config scp://backup@10.1.1.50/R1.cfg`
- B. `copy scp://backup@10.1.1.50/R1.cfg running-config`
- C. `copy running-config tftp://10.1.1.50/R1.cfg`
- D. `scp running-config backup@10.1.1.50`

**問10** 管理端末から `scp image.bin admin@10.1.1.1:flash:image.bin` を実行したが拒否された。ルータへの SSH ログインは `admin` で成功する。ルータ側で確認する設定はどれか。

- A. `ip scp server enable`、および `admin` の権限レベルと EXEC の認可
- B. `ip http server`
- C. `ip ftp username`
- D. `tftp-server flash:image.bin`

**問11** 新しい IOS イメージをフラッシュに転送した。再起動の前に、イメージが破損・改ざんされていないことを確かめるコマンドはどれか。

- A. `show version`
- B. `dir flash:`
- C. `verify /md5 flash:<ファイル名>`
- D. `show boot`

### 4.3 NAT

**問12** 内部ホスト 192.168.1.10 が PAT によって 203.0.113.1 に変換され、外部のサーバ 198.51.100.20 と通信する。「内部グローバルアドレス」はどれか。

- A. 192.168.1.10
- B. 203.0.113.1
- C. 198.51.100.20
- D. 192.168.1.1

**問13** 192.168.1.0/24 の内部ホストが、外部インターフェース G0/0/1 のアドレスを共有してインターネットに出られるようにする。ACL 1 は設定済みである。正しいコマンドはどれか。

- A. `ip nat inside source static 192.168.1.0 interface GigabitEthernet0/0/1`
- B. `ip nat pool 1 interface GigabitEthernet0/0/1 overload`
- C. `ip nat outside source list 1 interface GigabitEthernet0/0/1 overload`
- D. `ip nat inside source list 1 interface GigabitEthernet0/0/1 overload`

**問14** PAT を設定したが、内部ホストがインターネットに出られず、`show ip nat translations` にエントリがない。設定は次のとおり。原因はどれか。

```
interface GigabitEthernet0/0/0
 ip address 192.168.1.1 255.255.255.0
 ip nat inside
interface GigabitEthernet0/0/1
 ip address 203.0.113.1 255.255.255.248
 ip nat inside
access-list 1 permit 192.168.1.0 0.0.0.255
ip nat inside source list 1 interface GigabitEthernet0/0/1 overload
```

- A. 外部側のインターフェースに `ip nat outside` が設定されていない
- B. ACL のワイルドカードマスクが誤っている
- C. `overload` は interface 指定では使えない
- D. プールが定義されていない

**問15** グローバルアドレス 5 個のプールでダイナミック NAT を設定した。内部ホスト 5 台までは通信できるが、6 台目以降が出られない。最も適切な修正はどれか。

- A. ACL を拡張 ACL に変える
- B. `ip nat outside` を内部インターフェースにも設定する
- C. `ip nat inside source list … pool …` に `overload` を付ける
- D. プールの netmask を /32 にする

**問16** 外部から 203.0.113.1 の TCP 8080 あての通信を、内部の Web サーバ 192.168.1.10 の TCP 80 に転送する。正しいコマンドはどれか。

- A. `ip nat inside source static tcp 192.168.1.10 80 203.0.113.1 8080`
- B. `ip nat inside source static tcp 203.0.113.1 8080 192.168.1.10 80`
- C. `ip nat outside source static tcp 192.168.1.10 8080 203.0.113.1 80`
- D. `ip nat inside source list 80 interface GigabitEthernet0/0/1 overload`

### 4.4 DNS

**問17** `www.example.com` に IP アドレスを指定すればアクセスできるが、名前ではアクセスできない。`nslookup www.example.com` の結果は「Non-existent domain」だった。確認すべきレコードはどれか。

- A. MX
- B. A(または AAAA)
- C. PTR
- D. NS だけ

**問18** `example.com` あてのメールが届かない。Web サイト `www.example.com` には名前でアクセスできる。最初に確認するレコードはどれか。

- A. A
- B. CNAME
- C. MX
- D. PTR

**問19** `example.com` の MX レコードは次の2つである。送信側のメールサーバが最初に配送を試みるのはどれか。

```
example.com.  IN  MX  20 mail-b.example.com.
example.com.  IN  MX  10 mail-a.example.com.
```

- A. mail-a。数値が小さいほうが優先される
- B. mail-b。数値が大きいほうが優先される
- C. 先に書かれている mail-b
- D. ランダム

**問20** 自社のメールサーバから送ったメールが、相手のサーバに拒否されることがある。送信サーバの IP アドレスを逆引きしても名前が返らない。追加・修正すべきレコードはどれか。

- A. AAAA
- B. CNAME
- C. NS
- D. PTR

**問21** Web サーバを移設し、`www.example.com` の A レコードを新しいアドレスに変更した。権威サーバに直接問い合わせると新しいアドレスが返るが、一部の利用者は古いサーバに接続される。原因はどれか。

- A. PTR レコードを変更していない
- B. NS レコードが削除された
- C. MX レコードの優先度が誤っている
- D. キャッシュ DNS サーバや端末に、TTL が切れるまで古い応答が残っている

**問22** あるドメインのすべての名前について、問い合わせ結果が SERVFAIL になる。別のドメインは正常に引ける。最も考えられる原因はどれか。

- A. NS レコード・委任の不備、または権威サーバの停止
- B. そのドメインに AAAA レコードがない
- C. クライアントの hosts ファイルの誤り
- D. PTR レコードがない

### 4.5 IPsec VPN

**問23** IPsec でデータの暗号化(機密性)を提供するプロトコルと、その IP プロトコル番号はどれか。

- A. AH、51
- B. ESP、50
- C. IKE、500
- D. GRE、47

**問24** IPsec のトンネルモードの説明として正しいものはどれか。

- A. 元の IP ヘッダをそのまま使い、ペイロードだけを保護する
- B. 暗号化を行わない
- C. 元の IP パケット全体を保護し、新しい IP ヘッダを付ける。サイト間 VPN で使われる
- D. ホスト間の通信でのみ使える

**問25** サイト間 VPN とリモートアクセス VPN の違いとして正しいものはどれか。

- A. サイト間 VPN では、各端末に VPN クライアントソフトウェアが必要である
- B. リモートアクセス VPN は、拠点のゲートウェイ同士を常時接続する
- C. サイト間 VPN は拠点のゲートウェイ同士を接続し、端末は VPN を意識しない
- D. リモートアクセス VPN は IPsec を使えない

### 4.6 ACL

**問26** 標準 ACL を配置する場所の原則はどれか。

- A. 送信元にできるだけ近い場所
- B. あて先にできるだけ近い場所
- C. ネットワークの中央のルータ
- D. 必ず VTY 回線

**問27** 172.16.16.0/20 に一致するワイルドカードマスクはどれか。

- A. 0.0.0.255
- B. 0.0.15.255
- C. 0.0.16.255
- D. 255.255.240.0

**問28** 192.168.1.0/24 のホストから、サーバ 10.1.1.80 への HTTPS だけを許可する行はどれか。

- A. `access-list 10 permit tcp 192.168.1.0 0.0.0.255 host 10.1.1.80 eq 443`
- B. `access-list 110 permit tcp 192.168.1.0 0.0.0.255 eq 443 host 10.1.1.80`
- C. `access-list 110 permit tcp 192.168.1.0 0.0.0.255 host 10.1.1.80 eq 443`
- D. `access-list 110 permit ip 192.168.1.0 255.255.255.0 host 10.1.1.80 eq 443`

**問29** 次の ACL をインターフェースのインバウンドに適用した。ホスト 192.168.1.50 からの通信はどうなるか。

```
ip access-list extended FILTER
 10 permit ip 192.168.1.0 0.0.0.255 any
 20 deny ip host 192.168.1.50 any
```

- A. 拒否される。deny のほうが優先される
- B. ログに記録されてから拒否される
- C. 拒否される。暗黙の deny に一致する
- D. 許可される。行 10 に先に一致する

**問30** 問29 の ACL で、192.168.1.50 だけを拒否するように直す。最も適切な方法はどれか。

- A. 末尾に `30 deny ip host 192.168.1.50 any` を追加する
- B. `no 20` で行を削除し、`5 deny ip host 192.168.1.50 any` を追加する
- C. ACL をアウトバウンドに適用し直す
- D. 行 10 に `log` を付ける

**問31** 次の ACL をインターフェースに適用した。192.168.2.0/24 からの通信はどうなるか。

```
access-list 20 deny 192.168.1.0 0.0.0.255
```

- A. 許可される。deny に一致しないため
- B. 拒否される。末尾の暗黙の deny に一致するため
- C. ルーティングされずに折り返される
- D. ACL が無効になる

**問32** VTY 回線への SSH 接続元を、標準 ACL 10 で制限する。正しい適用方法はどれか。

- A. `line vty 0 4` → `ip access-group 10 in`
- B. `line vty 0 4` → `access-class 10 in`
- C. `interface vty 0 4` → `access-class 10 in`
- D. グローバルで `ip access-group 10 vty`

### 4.7 L2 セキュリティ

**問33** ポートセキュリティの違反モードのうち、違反フレームを破棄し、ログと違反カウンタで記録するが、ポートは up のままにするものはどれか。

- A. protect
- B. restrict
- C. shutdown
- D. sticky

**問34** 次の各状況と対策の組み合わせとして**誤っている**ものはどれか。

- A. アクセススイッチで DHCP スヌーピングを有効にしたら、誰もアドレスを取得できなくなった → DHCP サーバ方向のアップリンクに `ip dhcp snooping trust` を設定する
- B. ARP スプーフィングによる中間者攻撃を防ぎたい → DHCP スヌーピングを有効にしたうえで `ip arp inspection vlan` を設定する
- C. 端末ポートからの不正な RA を防ぎたい → 端末ポートに `ipv6 nd raguard` を適用する
- D. ブロードキャストストームの影響を抑えたい → `storm-control broadcast level` を設定する。既定の動作では、しきい値を超えるとポートが err-disabled になる

## 解答・解説

| 問 | 正解 | 解説 |
|---|---|---|
| 1 | D | タイプ 9(scrypt)が最も強い。5 は MD5、7 は容易に復号でき、enable password は平文。 |
| 2 | C | SSH には RSA 鍵が要る。鍵の生成にはホスト名とドメイン名が前提。 |
| 3 | D | `login local` でローカル認証、`transport input ssh` で SSH のみ受け付ける。 |
| 4 | A | B、C、D は RADIUS の特徴。 |
| 5 | C | 次の方式に進むのは、前の方式が応答しないときだけ。サーバが失敗を返したら拒否で確定する。 |
| 6 | D | サーバ無応答のときは、次の方式 `local` を使う。 |
| 7 | A | 到達性があり認証情報も正しいなら、共有鍵の不一致かクライアント未登録。 |
| 8 | C、D | SCP と SFTP は SSH 上で動く。TFTP は認証も暗号化もなく、FTP は平文。 |
| 9 | A | `copy <コピー元> <コピー先>`。B は復元(方向が逆)。 |
| 10 | A | 機器を SCP サーバにするには `ip scp server enable` と、権限 15・EXEC 認可が要る。 |
| 11 | C | ハッシュ値を計算し、公式の値と比較する。 |
| 12 | B | 内部ホストの、外部から見たアドレス(変換後)。192.168.1.10 は内部ローカル。 |
| 13 | D | `ip nat inside source list <ACL> interface <IF> overload`。 |
| 14 | A | G0/0/1 は外部側。`ip nat outside` にする。 |
| 15 | C | `overload` を付けて PAT にすれば、ポート番号で多数のホストを区別できる。 |
| 16 | A | `static tcp <内部ローカル> <ポート> <内部グローバル> <ポート>` の順。 |
| 17 | B | 名前 → アドレスは A / AAAA。Non-existent domain は NXDOMAIN。 |
| 18 | C | ドメインあてメールの配送先は MX。 |
| 19 | A | MX は優先度の数値が小さいほうが優先。記述順は関係しない。 |
| 20 | D | 逆引きは PTR。受信側は送信サーバの逆引きを確認することが多い。 |
| 21 | D | キャッシュは TTL が切れるまで残る。変更前に TTL を短くしておく。 |
| 22 | A | ドメイン全体の SERVFAIL は、委任や権威サーバの問題。レコードがないだけなら NOERROR(0 件)か NXDOMAIN。 |
| 23 | B | ESP はプロトコル 50 で暗号化する。AH(51)は暗号化しない。IKE は UDP 500。 |
| 24 | C | A はトランスポートモード。 |
| 25 | C | VPN クライアントが要るのはリモートアクセス(クライアント型)。 |
| 26 | B | 標準 ACL は送信元しか見ない。送信元の近くに置くと、関係のないあて先への通信まで止める。 |
| 27 | B | /20 のマスクは 255.255.240.0。255 − 240 = 15。 |
| 28 | C | ポートを指定するのは拡張 ACL(100〜199)。あて先ポートはあて先アドレスの後に書く。ワイルドカードマスクを使う。 |
| 29 | D | 上から評価し、最初に一致した行で決まる。 |
| 30 | B | 具体的な deny を、広い permit より上(小さいシーケンス番号)に置く。 |
| 31 | B | permit 行が1つもない ACL は、暗黙の deny によりすべてを拒否する。 |
| 32 | B | VTY には `access-class`。インターフェースには `ip access-group`。 |
| 33 | B | protect は記録しない。shutdown は err-disabled にする。sticky は学習方法。 |
| 34 | D | ストーム制御の既定の動作は超過分の破棄。err-disabled にするには `storm-control action shutdown` が要る。 |
