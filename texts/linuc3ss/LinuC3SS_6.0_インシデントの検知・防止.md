# LinuC 3SS テキスト 6.0 インシデントの検知・防止

対象: LinuC レベル3 3SS試験 Version 1.0

攻撃や不正を、早く見つけて、広がる前に止めるための道具を学びます。ネットワークを見る道具(Wireshark、tcpdump、Suricata、Snort、ModSecurity)、サーバーの中を見る道具(AIDE、YARA、ClamAV)、弱点を調べる道具(OpenSCAP、GVM、Trivy、ZAP)の 3 つに分けて考えます。

ここでは、守る側の設定と、検知した結果の読み方を書きます。攻撃の手順は書きません。

次の約束を、この章のすべての道具で守ります。

- 調べる道具(スキャナー、パケットの取り込み)は、**自分が管理する対象か、持ち主の許可を得た対象**にだけ使います。許可のない相手に使うと、法律に触れることがあります。
- 通信の取り込みには、パスワードなどの中身が入ることがあります。取り込む範囲と期間を絞り、保存したファイルの権限を制限します。
- 検知の結果は、必ず人が見て判断します。誤検知(正常なものを不正と判断すること)も、見逃しも、起こります。

## 6.1 ネットワークセキュリティ (重要度4)

出題範囲: Wireshark、tcpdump、Suricata、Snort、NIDS / NIPS、ModSecurity、Apache / Nginx のモジュール、DoS / DDoS・マルウェアの通信・Web アプリへの攻撃の検出と防止。

### 1. 見る道具と、見つける道具

| 道具 | 役割 | ひとこと |
|---|---|---|
| tcpdump | パケットを取り込む(コマンド) | 画面に出すか、ファイルに保存する。サーバーの上で使う |
| Wireshark | パケットを取り込んで、読みやすく解析する(画面) | 保存した pcap ファイルを開いて詳しく見る。コマンド版は `tshark` |
| Suricata | 通信を見張り、規則に合うものを検知する(NIDS)。止めることもできる(NIPS) | 規則(ルール)で判断する。マルチスレッド |
| Snort | Suricata と同じ種類の道具 | 古くからある。規則の書き方は Suricata とよく似ている |
| ModSecurity | Web サーバーの中で、HTTP の要求を調べる WAF(Web アプリ向けのファイアウォール) | SQL インジェクションや XSS を、HTTP の中身を見て止める |

- **pcap** は、取り込んだパケットを保存するファイルの形式です。tcpdump で作り、Wireshark で開くのが定番の流れです。
- **NIDS** は、ネットワーク型の侵入検知システムです。見つけて知らせるだけで、通信は止めません。
- **NIPS** は、ネットワーク型の侵入防止システムです。見つけた通信を止めます。
- 検知(IDS)と防止(IPS)をまとめて呼ぶときは、IDS / IPS と書きます。Suricata や Snort は、置き方と設定で、どちらにもなります。

### 2. tcpdump

root の権限で実行します。まず、何も絞らずに取り込むと量が多いので、条件を付けます。

```bash
# eth0 で、ホスト 192.0.2.10 の 80 番ポートの通信を、名前解決せずに 10 個だけ表示する
sudo tcpdump -i eth0 -nn -c 10 host 192.0.2.10 and port 80

# 条件に合う通信を、ファイルに保存する(あとで Wireshark で開く)
sudo tcpdump -i eth0 -nn -w /var/tmp/web.pcap port 80

# 保存したファイルを読む
tcpdump -nn -r /var/tmp/web.pcap
```

| オプション | 意味 |
|---|---|
| `-i eth0` | 見張る NIC。`-i any` で全部 |
| `-nn` | ホスト名とポート名に直さず、数字のまま出す(名前解決で DNS の通信が増えるのを防ぐ) |
| `-c 10` | 10 個で止める |
| `-w ファイル` | パケットをそのまま保存する(画面には出ない) |
| `-r ファイル` | 保存したファイルを読む |
| `-s 0` | パケット全体を取り込む(新しい版の既定は全体) |

- 後ろに書く `host`、`port`、`net`、`tcp`、`and`、`or`、`not` は、**取り込みフィルター**(BPF という書き方)です。取り込む前に絞ります。
- DoS の中でも、**SYN フラッド**(接続の最初の SYN だけを大量に送る)を見るときは、SYN だけで ACK のないパケットを数えます。

```bash
sudo tcpdump -nn -i eth0 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn' -c 20
```

### 3. Wireshark

- Wireshark の**表示フィルター**は、取り込んだあとに表示を絞る書き方です。tcpdump の取り込みフィルターとは書き方が違います。

| 目的 | 取り込みフィルター(tcpdump、Wireshark の取り込み) | 表示フィルター(Wireshark) |
|---|---|---|
| 80 番ポート | `port 80` | `tcp.port == 80` |
| あるホスト | `host 192.0.2.10` | `ip.addr == 192.0.2.10` |
| HTTP の POST | (項目の名前では書けない。バイトの比較なら書けるが複雑) | `http.request.method == "POST"` |
| DNS だけ | `port 53` | `dns` |

- Wireshark の画面の「統計」にある会話(Conversations)や、プロトコルの階層を見ると、どこに通信が集中しているかが分かります。
- サーバーには画面がないことが多いので、サーバーで tcpdump を使って保存し、手元の PC で Wireshark で開く方法がよく使われます。
- 暗号化された通信(TLS)は、中身が読めません。見えるのは、宛先、量、時間などです。

### 4. NIDS と NIPS の置き方

```text
NIDS (monitor only)

  [Internet] --> [FW] --> [Switch] --> [Server]
                             |
                             +--> [NIDS]    ミラーポートかタップで、通信のコピーを受け取る。通信は止められない

NIPS (inline)

  [Internet] --> [FW] --> [NIPS] --> [Switch] --> [Server]
                             ^
                             +-- 通信が必ず通る。規則に合うものを捨てる(drop)。NIPS が止まると通信も止まる
```

| | NIDS | NIPS |
|---|---|---|
| 置き方 | ミラーポートやタップで、コピーを受け取る | 通信の経路の途中に置く(インライン) |
| 見つけたとき | 警告を出す | 警告を出して、通信を捨てる |
| 誤検知のとき | 警告が増えるだけ | 正常な通信を止めてしまう |
| 障害のとき | 通信には影響しない | 通信が止まることがある |

- 最初は NIDS として動かして、誤検知を減らしてから、NIPS に切り替えます。

### 5. Suricata

Suricata は、パケットを規則と照らし合わせます。

| 項目 | 場所と内容 |
|---|---|
| 設定ファイル | `/etc/suricata/suricata.yaml` |
| 規則 | `/var/lib/suricata/rules/suricata.rules`(`suricata-update` で取ってくる) |
| 自分の規則 | たとえば `/var/lib/suricata/rules/local.rules` を作り、`suricata.yaml` の `rule-files` に足す |
| ログ | `/var/log/suricata/fast.log`(1 行の警告)、`/var/log/suricata/eve.json`(JSON で詳しい情報) |

- Ubuntu 24.04 には `suricata` パッケージがあり、AlmaLinux 9 でも EPEL の `suricata`(7 系)を入れられます。
- 規則の置き場所と、既定の設定は、パッケージと版で違うことがあります。【要確認】(この 2 つの環境での違い)
- 自分の環境では、`grep default-rule-path /etc/suricata/suricata.yaml` で、規則の置き場所を確かめます。
- `suricata-update` は、公開されている規則(Emerging Threats Open など)を取ってきて、まとめます。規則は更新されるので、定期的に実行します。

```bash
sudo suricata-update                              # 規則を取ってくる
sudo suricata -T -c /etc/suricata/suricata.yaml   # 設定と規則の検査だけ(-T)
sudo suricata -c /etc/suricata/suricata.yaml -i eth0   # eth0 を見張る
```

規則は、**アクション、ヘッダー、オプション**でできています。

```
alert http any any -> $HOME_NET any (msg:"suspicious UA"; content:"BadBot"; sid:1000001; rev:1;)
```

| 部分 | 意味 |
|---|---|
| `alert`(最初の語) | アクション |
| `http` | プロトコル |
| `any any` | 送信元のアドレスとポート |
| `->` | 向き(送信元から宛先へ) |
| `$HOME_NET any` | 宛先。自分のネットワークの全ポート |
| `msg` | 警告に出る文 |
| `content` | 通信の中から探す文字列 |
| `sid`、`rev` | 規則の番号、規則の版 |


| アクション | 意味 |
|---|---|
| `alert` | 警告を出す(通信は通す) |
| `drop` | 捨てて、警告を出す(インラインのときだけ意味がある) |
| `reject` | 送り手に RST や ICMP のエラーを送る。IPS(インライン)のときは、パケットも捨てる |
| `pass` | そのパケットの以降の検査をやめる(例外の指定に使う) |

- `sid`(規則の番号)は、規則ごとに重ならないようにします。自分で作る規則は、1000000 以上を使うのが慣例です。
- `drop` は、**インライン**(IPS として通信の途中に置く)のときだけ通信を止めます。ミラーポートのコピーを見ているだけなら、`drop` でも元の通信は止まりません。

### 6. Snort

- Snort も、規則で通信を調べます。規則の形(アクション、ヘッダー、オプション)は、Suricata とほぼ同じです。
- 設定ファイルは、Snort 2 では `snort.conf`、Snort 3 では `snort.lua`(Lua 言語)です。
- 動かし方は 3 つあります。

| モード | 動き |
|---|---|
| スニファー | パケットを画面に出すだけ(tcpdump に近い) |
| パケットロガー | パケットを保存する |
| NIDS / NIPS | 規則と照らし合わせて、警告を出す(NIPS はインラインで捨てる) |

```bash
# Snort 2 の例(Ubuntu 24.04 の snort パッケージ)
# 設定を検査だけする(-T)
snort -T -c /etc/snort/snort.conf
# eth0 を見張り、警告を画面に出す
sudo snort -c /etc/snort/snort.conf -i eth0 -A console
```

- Ubuntu 24.04 の `snort` パッケージ(universe)は Snort 2.9 系です。設定は `/etc/snort/snort.conf` で、上の例はこの版の書き方です。Snort 3 は、ソースから入れます。Snort 3 では、`snort.lua` を使い、書き方が変わります。
- AlmaLinux 9 で、Snort がパッケージで入るかどうかは、版で変わります。【要確認】

### 7. ModSecurity

**ModSecurity** は、Web サーバーに組み込む WAF です。HTTP の要求(URL、ヘッダー、本文)を調べ、攻撃のような要求を止めます。

```text
  [Client] --> [Web server + ModSecurity] --> [Web app]
                      |
                      +-- 1. 要求のヘッダーと本文を読む
                      +-- 2. ルール(OWASP CRS など)と照らす
                      +-- 3. 合えば、拒否(403)するか、記録だけにする
                      +-- 4. 監査ログに残す
```

| Web サーバー | 組み込み方 |
|---|---|
| Apache | モジュール `mod_security2`。Ubuntu / Debian は `libapache2-mod-security2` を入れ、`a2enmod security2` で有効にする。AlmaLinux / RHEL 9 は AppStream の `mod_security` と `mod_security_crs` を入れる |
| Nginx | ModSecurity v3(`libmodsecurity`)と、コネクタのモジュール(ModSecurity-nginx)を使う。Nginx の設定で `modsecurity on;` と `modsecurity_rules_file ...;` を書く |

最も大事な設定が **`SecRuleEngine`** です。

| 値 | 動き |
|---|---|
| `On` | ルールに合う要求を、実際に止める |
| `DetectionOnly` | ルールで調べて記録するが、止めない |
| `Off` | ルールの処理をしない |

- 推奨の設定ファイル(`modsecurity.conf-recommended`)は、`SecRuleEngine DetectionOnly` で始まります。最初は記録だけにして、誤検知を確かめてから `On` にします。
- 誤検知が出たら、そのルールの ID を指定して、特定の場所だけ例外にします(`SecRuleRemoveById` など)。WAF 全体を `Off` にしません。

```apache
# /etc/modsecurity/modsecurity.conf の一部(Debian 系)
SecRuleEngine On
SecRequestBodyAccess On
SecAuditEngine RelevantOnly
SecAuditLog /var/log/apache2/modsec_audit.log
```

```apache
# 自分のルールの例: 引数に <script が入った要求を 403 で拒否する
SecRule ARGS "@rx (?i)<script" \
    "id:100001,phase:2,deny,status:403,log,msg:'XSS らしい入力を拒否'"
```

- ルールの書き方は `SecRule 見る場所 "条件" "動き"` です。`id` は必ず付けます。
- **OWASP CRS(Core Rule Set)**は、ModSecurity で使う、公開されたルールの集まりです。SQL インジェクション、XSS、パス・トラバーサルなどを広く見ます。Debian 系は `modsecurity-crs`、RHEL 系は `mod_security_crs` パッケージで入ります。ただし、どちらも CRS 3.3 系です。CRS 4 を使うときは、公式(coreruleset.org や GitHub のリリース)から取ってきます。
- CRS は、要求ごとに点数(異常スコア)を足して、合計がしきい値に達したら拒否する方式が基本です。点数は、検知のルールが足し、拒否の判定は 949110 のルールが行います。CRITICAL のルール 1 つが 5 点で、既定のしきい値は、要求が 5、応答が 4 です。【要確認】(CRS 4 の既定値)

### 8. 攻撃の種類と、見つけ方、防ぎ方

| 攻撃 | 起きること | 見つける手がかり | 防ぐ方法 |
|---|---|---|---|
| DoS / DDoS | 大量の通信で、サービスを使えなくする。DDoS は、多数の機器から送る | 接続数やパケット数の急増、SYN だけが大量にある | 接続数と要求数の制限(`limit_req`、`limit_conn`)、SYN クッキー(`net.ipv4.tcp_syncookies = 1`)、CDN や ISP の防御サービス |
| マルウェアの通信(C2 通信) | 感染した機器が、攻撃者の指令サーバー(C2)と通信する | 一定の間隔で同じ宛先へ通信する、見慣れない宛先、不審な DNS の問い合わせ | NIDS の規則(既知の C2 の宛先や通信の特徴)、出ていく通信の制限、DNS のログの確認 |
| SQL インジェクション | 入力に SQL を混ぜて、DB を不正に操作する | 引数に `' OR 1=1` のような文字列、DB のエラーの文言を返す応答 | WAF(ModSecurity + CRS)、アプリ側でプレースホルダ(バインド変数)を使う |
| XSS(クロスサイトスクリプティング) | 入力に混ぜたスクリプトが、ほかの人のブラウザーで動く | 引数に `<script>` のようなタグ | WAF、アプリ側で出力のエスケープ |

- **WAF は補助です。** アプリの欠陥は、アプリで直します。WAF で時間を稼いでいる間に、アプリを直します。
- 大規模な DDoS は、自分のサーバーだけでは受けきれません。手前の CDN や、事業者の防御サービスで吸収します。
- 出ていく通信を見るのは、C2 通信の検知に有効です。入ってくる通信だけを見ていると、感染後の動きに気づけません。
- ログが多いと、人が見落とします。警告の重要度で分け、通知に回すものを絞ります。

## 6.2 ホストセキュリティ (重要度3)

出題範囲: AIDE、YARA、ClamAV、シグネチャ、ファイルのスキャンと隔離。

ここからは、サーバーの中を見る道具です。ネットワークを見る道具をすり抜けたものや、すでに入り込んだものを見つけます。

### 1. 3 つの道具の役割

| 道具 | 見つけるもの | 方法 |
|---|---|---|
| AIDE | ファイルの**改ざん**(変更、追加、削除) | 正常なときのファイルの状態(ハッシュ値、権限、所有者、更新時刻など)を記録しておき、あとで比べる |
| ClamAV | 既知のマルウェア(ウイルス) | シグネチャ(特徴の定義)と照らし合わせる |
| YARA | 自分で書いた特徴に合うファイル | 文字列やバイトの並びの規則を自分で書く |

- **シグネチャ**は、既知のマルウェアや攻撃に共通する特徴を書いた定義です。新しいものは載っていないので、定義を更新し続けることが大事です。
- AIDE は「変わったこと」を見つけ、ClamAV は「既知の悪いもの」を見つけます。見つけ方が違うので、どちらか 1 つでは足りません。

### 2. AIDE

**AIDE**(Advanced Intrusion Detection Environment)は、ファイルの整合性を調べる道具です。ファイルが書き換えられたら気づけます。

```text
  aide --init       今の(正常なはずの)状態を、データベースに記録する
     |
     v
  cp                新しい記録を、正式な名前にして、安全な場所に置く
     |
     v
  aide --check      今の状態を、記録と比べる(定期的に実行する。aide だけでも同じ)
     |
     +-- 差がない: 終了コード 0
     +-- 差がある: 追加、削除、変更の一覧を出す。終了コードは 0 以外(1 が追加、2 が削除、4 が変更の足し算。例: 追加と削除で 3)
     |
     v
  aide --update     変更が正当なら、新しい記録を作り、正式な名前にする
```

| | Red Hat 系(AlmaLinux 9) | Debian 系(Ubuntu 24.04) |
|---|---|---|
| パッケージ | `aide` | `aide`(`aide-common` も入る) |
| 設定ファイル | `/etc/aide.conf` | `/etc/aide/aide.conf`(と `/etc/aide/aide.conf.d/`) |
| 記録の作り方 | `aide --init`(`/var/lib/aide/aide.db.new.gz` ができる) | `aideinit`(`/var/lib/aide/aide.db.new` を作る) |
| 正式な名前 | `/var/lib/aide/aide.db.gz` にコピーする | `/var/lib/aide/aide.db`(`aideinit` が置き換えるかを確認する。`aideinit -y -f` で確認なし) |

```bash
# Red Hat 系の例
sudo dnf install aide
sudo aide --init
sudo cp /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
sudo aide --check
```

設定ファイル `aide.conf` では、どのファイルの、どの項目を比べるかを書きます。

```
# 比べる項目の組み合わせに、名前を付ける
MYRULE = p+i+n+u+g+s+m+c+sha512

# どのディレクトリに、どの組み合わせを使うか
/etc            MYRULE
/usr/sbin       MYRULE

# 比べないもの(! を付ける)。ログのように、いつも変わるものは外す
!/var/log
```

| 記号 | 比べる項目 |
|---|---|
| `p` | 権限 |
| `u` / `g` | 所有者 / グループ |
| `s` | サイズ |
| `m` | 更新時刻(mtime) |
| `sha512` | ハッシュ値 |

- 設定ファイルの項目の名前は、版で追加されます。そのまま写さず、自分の環境の既定の設定を見て、書き換えます。【要確認】
- **記録(データベース)も、改ざんの対象です。** 攻撃者に記録を書き換えられたら、変更に気づけません。記録は、読み取り専用の媒体や、別のサーバーに置き、更新時は人が確かめます。
- 最初に記録を作るのは、サーバーを作った直後の、まだ安全だと分かっているときです。感染したあとで記録を作ると、感染した状態が「正常」になります。
- 比べるのは `cron` や systemd タイマーで定期的に実行し、結果をメールやログで受け取ります。
- パッケージの更新で、たくさんのファイルが正当に変わります。更新のあとに `aide --update` で記録を作り直します。

### 3. ClamAV

**ClamAV** は、オープンソースのウイルス対策ソフトです。ファイルを調べて、シグネチャに合うものを見つけます。

| 部品 | 役割 |
|---|---|
| `freshclam` | シグネチャのデータベースを更新する |
| `clamscan` | 起動のたびに、データベースを読み込んで、ファイルを調べる(単体で動く) |
| `clamd` | 常駐して、データベースを読み込んだまま待つデーモン |
| `clamdscan` | `clamd` に調べさせるクライアント。速い。`clamd` が動いている必要がある |

```text
  [mirror] --(freshclam)--> [signature DB]    公式のミラーから、シグネチャを取る(/var/lib/clamav)
                                 |
                                 v
  [files] --(clamscan / clamdscan)--> 照らし合わせる
                                 |
                                 +-- 合わない: OK
                                 +-- 合う: FOUND と表示する。--move で隔離、--remove で削除
```

| | Red Hat 系(AlmaLinux 9) | Debian 系(Ubuntu 24.04) |
|---|---|---|
| パッケージ | EPEL の `clamav`、`clamd`、`clamav-freshclam` | `clamav`、`clamav-daemon`、`clamav-freshclam` |
| 更新の自動化 | `clamav-freshclam` サービスが自動で更新する(`systemctl enable --now clamav-freshclam`) | `clamav-freshclam` サービスが自動で更新する |

```bash
sudo freshclam                                   # データベースを更新する
clamscan -r --infected /home                     # /home を再帰的に調べ、見つかったものだけ表示する
sudo clamscan -r --infected --move=/var/quarantine /srv/uploads   # 見つけたものを隔離ディレクトリへ移す
sudo clamscan -r --infected --remove /srv/uploads                 # 見つけたものを削除する(戻せない)
clamdscan --fdpass /srv/uploads                  # clamd に調べさせる
```

| オプション | 意味 |
|---|---|
| `-r` | ディレクトリの中を再帰的に調べる |
| `-i`(`--infected`) | 見つかったものだけ表示する |
| `--move=DIR` | 見つけたファイルを DIR へ移す(**隔離**) |
| `--copy=DIR` | 見つけたファイルを DIR へコピーする |
| `--remove` | 見つけたファイルを削除する |
| `-l ファイル` | 結果をログファイルに書く |

- 終了コードは、0 が「何も見つからなかった」、1 が「見つかった」、2 が「エラー」です。スクリプトや cron で判断に使えます。
- **隔離**は、見つけたファイルを、実行できない安全な場所に移すことです。消さずに残すので、あとで調べたり、誤検知なら戻したりできます。隔離ディレクトリの権限は、root だけが読めるようにします。
- `--remove` は戻せません。正常なファイルを誤検知で消すことがあるので、最初は `--move` を使います。
- 隔離ディレクトリを、調べる対象の中に作ると、同じファイルを何度も見つけます。対象の外に作ります。
- 動作の試験には、**EICAR テストファイル**を使います。害のない、アンチウイルスの動作確認のための決まった文字列です。本物のマルウェアは使いません。
- ClamAV で見つけられるのは、シグネチャにあるものだけです。シグネチャのない新しいものは見つかりません。`freshclam` で更新し続けます。

### 4. YARA

**YARA** は、ファイルやメモリの中の、文字列やバイトの並びを手がかりに、ファイルを分類する道具です。マルウェアの研究者が、特徴を規則に書いて使います。

```
rule SuspiciousTool
{
    meta:
        description = "社内の調査用: 不審なツールの目印"
        author = "security-team"

    strings:
        $a = "BadBot-Agent" ascii
        $b = { 4D 5A 90 00 }

    condition:
        $a and $b
}
```

| 部分 | 意味 |
|---|---|
| `rule 名前` | ルールの名前 |
| `meta:` | 説明、作者などの情報(判定には使わない) |
| `strings:` | 探す文字列(`ascii`、`wide`、`nocase` などの修飾)、16 進のバイト列、正規表現 |
| `condition:` | 合致の条件。`$a and $b`、`any of them`、`2 of ($*)` など |

```bash
yara rules.yar /srv/uploads          # ファイル 1 つ、またはディレクトリを調べる
yara -r rules.yar /srv/uploads       # ディレクトリの中を再帰的に調べる
yara -s rules.yar suspicious.bin     # 合った文字列の位置も表示する
```

- 出力は、合ったルールの名前と、ファイル名です。
- **ClamAV とのちがい**: ClamAV は用意されたシグネチャで調べます。YARA は、自分が見たい特徴を、自分で書きます。ClamAV は YARA 形式のルールも読めます。
- 条件が広すぎると、正常なファイルまで合います(誤検知)。条件を狭くして、正常なファイルの集まりに当てて、試します。
- 取得元の分からない公開ルールは、そのまま本番で使わず、中身を読んで試してから使います。

### 5. 検知したあとの動き

| 見つけたもの | 最初にすること |
|---|---|
| AIDE の差分 | 変更が、自分たちの作業(更新、設定変更)かを確かめる。心当たりがなければ、そのサーバーを隔離して調べる |
| ClamAV / YARA の検知 | ファイルを隔離する(消す前に、調べるために残す)。いつ、どこから入ったかを、ログで確かめる |
| 誤検知と分かった | 例外に登録する。そのとき、理由を記録する |

- 調べる前に、サーバーを再起動したり、ファイルを消したりすると、痕跡が消えます。まず、手順どおりに記録を残します。

## 6.3 セキュリティ診断 (重要度3)

出題範囲: OVAL、XCCDF、CVE、CPE、CVSS、OpenSCAP(ComplianceAsCode)、GVM、Trivy、ZAP、アクティブスキャンとパッシブスキャン。

### 1. 診断の 2 つの目的

| 目的 | 問い | 道具 |
|---|---|---|
| 脆弱性の診断 | 既知の弱点が残っていないか | GVM、Trivy、ZAP |
| 設定の適合の診断 | 決まった基準(ベンチマーク)に設定が合っているか | OpenSCAP |

- **脆弱性**は、攻撃に使われうる、ソフトウェアや設定の弱点です。
- 診断は、**自分が管理する対象か、持ち主の許可を得た対象**にだけ行います。許可のない対象にスキャナーを使うことは、攻撃と同じに見えます。また、本番のサービスに負荷をかけることがあるので、日時と範囲を決めてから行います。

### 2. 脆弱性と設定の共通の言葉(SCAP の仲間)

| 略語 | 意味 | ひとこと |
|---|---|---|
| **CVE** | 公開された脆弱性につく番号。`CVE-年-連番` の形 | 「どの弱点か」を呼ぶ名前 |
| **CPE** | 製品や版を表す名前。`cpe:2.3:a:ベンダー:製品:版:...` の形 | 「どの製品か」を呼ぶ名前 |
| **CVSS** | 脆弱性の深刻さを 0.0〜10.0 の点数にする仕組み | 「どれだけ危ないか」の目安 |
| **OVAL** | システムの状態を、検査の手順として機械で読める形で書く言語(XML) | 「パッケージの版が X 未満か」などを検査する |
| **XCCDF** | 設定の基準(チェックリスト)を機械で読める形で書く形式(XML) | ルールとプロファイルをまとめる |
| **SCAP** | 上の仕様を組み合わせて、脆弱性と設定を自動で調べる仕組み | OpenSCAP が実装している |

CVSS の深刻さの区分は、次のとおりです(CVSS v3.x と v4.0 で共通)。

| 点数 | 深刻度 |
|---|---|
| 0.0 | なし(None) |
| 0.1〜3.9 | 低(Low) |
| 4.0〜6.9 | 中(Medium) |
| 7.0〜8.9 | 高(High) |
| 9.0〜10.0 | 緊急(Critical) |

- CVSS の**基本評価**(Base)は、脆弱性そのものの性質で決まる点数です。攻撃元区分(ネットワークから攻撃できるか)、攻撃条件の複雑さ、必要な権限、利用者の関与、機密性・完全性・可用性への影響などから計算します。
- CVSS には、基本のほかに、時間で変わる点(現状評価)と、自分の環境に合わせた点(環境評価)があります。点数だけでなく、**自分の環境でその弱点に届くか**を見て、優先順位を決めます。
- CVSS の点数が高くても、使っていない機能や、外から届かないところなら、実際の危険は小さくなります。逆に、点数が中でも、すでに悪用されているものは、先に直します。
- CVSS には版があります(v3.1、v4.0 など)。版が違うと同じ脆弱性でも点数が違うことがあるので、どの版の点数かを確かめます。

### 3. OpenSCAP と ComplianceAsCode

```text
  ComplianceAsCode        基準の元になるプロジェクト
     |
     v  build
  SCAP Security Guide     パッケージ scap-security-guide など
     |
     v
  data stream (ssg-*-ds.xml)
     |   XCCDF   基準とプロファイル
     |   OVAL    検査の手順
     |   CPE     対象の製品の判定
     v
  oscap xccdf eval --profile ... ds.xml
     |
     v
  pass / fail / notapplicable の一覧と、HTML の報告書、XML の結果
```

- **ComplianceAsCode**は、セキュリティの基準を、コードとして管理するプロジェクトです。ここから、SCAP の内容(SCAP Security Guide)が作られます。
- **OpenSCAP** は、SCAP の仕様を実行する道具です。コマンドは `oscap` です。
- **プロファイル**は、ルールの集まりです。「CIS」「STIG」などの基準ごとにあります。

| | Red Hat 系(AlmaLinux 9) | Debian 系(Ubuntu 24.04) |
|---|---|---|
| コマンド | `openscap-scanner` | `openscap-scanner` |
| 基準の内容 | `scap-security-guide`(`/usr/share/xml/scap/ssg/content/` の下に、`ssg-almalinux9-ds.xml` などが入る) | Ubuntu 向けの内容は、パッケージの名前や入手先が違う。Canonical の仕組みもある【要確認】 |

```bash
# どのプロファイルが使えるか調べる
oscap info /usr/share/xml/scap/ssg/content/ssg-almalinux9-ds.xml

# プロファイルを指定して検査し(`content_profile_cis` が、この内容にあるかは、上の `oscap info` の出力で確かめる)、結果の XML と HTML の報告書を作る
sudo oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_cis \
  --results /var/tmp/results.xml \
  --report /var/tmp/report.html \
  /usr/share/xml/scap/ssg/content/ssg-almalinux9-ds.xml

# OVAL の検査だけを行う(脆弱性の検査用の OVAL のファイルを使う)
oscap oval eval --report /var/tmp/oval-report.html oval-definitions.xml
```

- 結果は、ルールごとに `pass`(合格)、`fail`(不合格)、`notapplicable`(その環境に当てはまらない)などで出ます。
- `oscap xccdf eval` に `--remediate` を付けると、直せるものを自動で直します。サービスの設定が変わるので、まず検査だけ行い、報告書を読んでから、検証環境で試します。本番にいきなり使いません。
- 基準のすべてを満たす必要は、必ずしもありません。サービスに必要な設定とぶつかるものは、理由を決めて例外にします。
- `oscap-podman` で、コンテナのイメージを検査できます。RHEL 9 系では、`openscap-utils` パッケージに入っています。

### 4. GVM(Greenbone Community Edition)

**GVM**(Greenbone Vulnerability Management)は、ネットワーク越しにホストを調べて、既知の脆弱性を見つける脆弱性スキャナーです。旧名は **OpenVAS** で、検査を行う部品の名前として今も残っています。オープンソース版は **Greenbone Community Edition** です。

| 部品 | 役割 |
|---|---|
| `openvas-scanner`(旧 OpenVAS) | 検査を行う本体 |
| `gvmd` | スキャンの設定、タスク、結果を管理する |
| `gsad` / GSA | Web の画面(Greenbone Security Assistant) |
| 脆弱性テストのデータ(フィード) | 検査の内容。毎日更新される。同期しないと新しい脆弱性を見つけられない |
| `gvm-tools` | コマンドで操作する道具 |

GVM の使い方は、次の順です。

1. **ターゲット**: 調べる相手のアドレスとポートの範囲を決める(許可を得たものだけ)。
2. **タスク**: ターゲットと、スキャンの設定(Full and fast など)を組み合わせる。
3. **スキャン**: 各ホストのポートとサービスを調べ、脆弱性を検査する。
4. **レポート**: 見つかった脆弱性を、深刻度(CVSS)の順に並べて確かめる。

- スキャンには、2 種類あります。
  - 認証なしのスキャン: ネットワークから見える範囲だけを調べる。
  - **認証ありのスキャン**: ログインの情報を渡して、ホストの中のパッケージの版なども調べる。見つかる数も、正確さも上がる。
- Greenbone は、公式に Docker Compose での構築を案内しています。パッケージの入れ方は、ディストリビューションごとに違います。【要確認】
- 検査の通信が、対象のサービスを遅くしたり、まれに止めたりすることがあります。本番に対しては、日時を決めて行います。
- 見つかった結果は、点数だけで決めず、本当にその弱点に到達できるかを確かめて、優先順位を付けます。誤検知もあります。

### 5. Trivy

**Trivy** は、コンテナのイメージ、ファイル、リポジトリ、設定ファイルなどを調べる、オープンソースのスキャナーです。コマンド 1 つで、手元でも CI でも使えます。

| 対象 | コマンド |
|---|---|
| コンテナのイメージ | `trivy image イメージ名:タグ`(別名 `trivy i`) |
| ローカルのディレクトリ | `trivy fs ディレクトリ` |
| Git リポジトリ | `trivy repo URL` |
| IaC の設定(Dockerfile、Terraform、Kubernetes のマニフェスト) | `trivy config ディレクトリ` |

調べる内容(スキャナー)は、`--scanners` で選べます。

| スキャナー | 見つけるもの |
|---|---|
| `vuln` | OS のパッケージと、アプリの依存ライブラリの既知の脆弱性(CVE) |
| `misconfig` | 設定の不備(root で動かす、など) |
| `secret` | 埋め込まれた秘密(鍵、トークン) |
| `license` | ライセンスの情報 |

```bash
# 深刻度が HIGH と CRITICAL のものだけ表示する
trivy image --severity HIGH,CRITICAL myapp:1.0

# 修正版がまだないものは除く
trivy image --ignore-unfixed myapp:1.0

# CI で使う: HIGH 以上が 1 つでもあれば、終了コード 1 で失敗させる
trivy image --severity HIGH,CRITICAL --exit-code 1 myapp:1.0

# 結果を JSON で保存する
trivy image --format json --output result.json myapp:1.0
```

- 脆弱性のデータベースは、Trivy が自動でダウンロードします。毎日更新されるので、古いデータベースで調べると、新しい脆弱性を見逃します。閉じた環境では、事前にダウンロードしておく方法があります(`--skip-db-update` など)。
- `--exit-code 1` は、見つかったときの終了コードです。付けないと、見つかっても終了コードは 0 で、CI が成功のままになります。
- 結果は、ビルドのたびに調べるだけでなく、動かしているイメージも定期的に調べ直します。公開後に、新しい脆弱性が見つかるからです。
- 修正版のない脆弱性は、直せません。除いて見やすくするか、影響を評価して、判断を記録します。

### 6. ZAP

**ZAP**(現在は「ZAP by Checkmarx」。旧 OWASP ZAP)は、Web アプリの脆弱性を調べる、オープンソースの診断ツールです。2023 年 8 月に OWASP を離れて、Linux Foundation の Software Security Project に移りました。2024 年 9 月からは Checkmarx の支援を受け、「ZAP by Checkmarx」と呼ばれます。オープンソース(Apache 2.0)のままです。名前から「OWASP」が外れています。

- ブラウザーと Web サーバーの間に**プロキシ**として入り、通る HTTP の要求と応答を見ます。
- 調べ方は、**パッシブスキャン**と**アクティブスキャン**の 2 つです。

| | パッシブスキャン | アクティブスキャン |
|---|---|---|
| 何をするか | プロキシを通る通信を**見るだけ**。要求は変えない | 脆弱性を確かめるための、調べる要求を**自分で送る** |
| 見つけるもの | セキュリティのヘッダーの不足、Cookie の属性の不備、情報が漏れる応答 など | SQL インジェクション、XSS など、入力に反応する弱点 |
| 対象への影響 | ほぼない | データを書き換えたり、負荷をかけたりすることがある |
| 使える場面 | 本番に近い環境でも、慎重にできる | **許可を得た、検証用の環境**にだけ使う |

ZAP の使い方は、次の順です。

1. ブラウザーの通信を、ZAP のプロキシ経由にする。通る通信を見て、**パッシブスキャン**が自動で指摘する。
2. **スパイダー**で、リンクをたどってページを集める。
3. 許可を得た検証環境だけに、**アクティブスキャン**を行う。

CI などで、コマンドで使うために、ZAP は Docker イメージと、診断用のスクリプトを用意しています。

| スクリプト | 動き |
|---|---|
| `zap-baseline.py` | スパイダーとパッシブスキャンだけ。短時間で、アクティブスキャンはしない |
| `zap-full-scan.py` | スパイダーのあとに、アクティブスキャンも行う |
| `zap-api-scan.py` | OpenAPI などの API の定義から、API を調べる |

```bash
# 検証用の環境(自分が管理するもの)に、baseline のスキャンを行い、HTML の報告書を作る
docker run --rm -v "$(pwd)":/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t https://staging.example.test -r report.html
```

- 対象の URL の `example.test` は、例のために使う架空の名前です。実際は、自分が管理するか、許可を得た URL にします。
- アクティブスキャンを、許可なく他人のサイトに行ってはいけません。
- ログインが必要なページは、認証の設定をしないと調べられません。
- 結果の深刻度は、指摘ごとに違います。誤検知もあるので、1 件ずつ内容を確かめます。

### 7. 道具の使い分け

| 知りたいこと | 使う道具 |
|---|---|
| ネットワークで、不審な通信がないか | Suricata / Snort(NIDS) |
| Web アプリへの攻撃を止めたい | ModSecurity + OWASP CRS |
| 重要なファイルが書き換えられていないか | AIDE |
| ファイルにマルウェアが入っていないか | ClamAV、YARA |
| ホストの設定が、基準に合っているか | OpenSCAP |
| ホストやネットワーク機器に、既知の脆弱性が残っていないか | GVM |
| コンテナのイメージやリポジトリに、既知の脆弱性や秘密がないか | Trivy |
| 作った Web アプリに、入力の弱点がないか | ZAP |
