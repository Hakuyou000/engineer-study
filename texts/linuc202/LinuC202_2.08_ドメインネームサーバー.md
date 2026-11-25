# LinuC 202 テキスト 2.08 ドメインネームサーバー

名前(`www.example.com`)から IP アドレスなどを調べる仕組み(DNS)のサーバーを、BIND 9 で作って守る方法を学びます。BIND の設定、ゾーンファイルの書き方、安全に運用するための設定(chroot、ゾーン転送の制限、TSIG、DNSSEC)の順に進みます。Red Hat 系(AlmaLinux / RHEL 9 系)と Debian 系(Ubuntu 24.04 / Debian 12)で違うところは、両方書きます。例のドメイン名は `example.com`、IP アドレスは `192.0.2.0/24` と `2001:db8::/32` を使います(どちらも文書用に予約された値です)。

## 2.08.1 BINDの設定と管理 (重要度3)

### 1. DNS サーバーの種類

DNS のサーバーは、役割で分けて考えます。1 台のサーバーが複数の役割を持つこともあります。

| 種類 | 役割 | 例 |
|---|---|---|
| 権威サーバー(authoritative server) | 自分が管理するゾーン(ドメインのデータのまとまり)について、正式な答えを返す | `example.com` のデータを持つ `ns1.example.com` |
| キャッシュサーバー(再帰リゾルバー、フルサービスリゾルバー) | クライアントの代わりに、答えを持つサーバーを順にたどって調べ、結果を一定時間覚える(キャッシュ) | 社内のクライアントが使う DNS サーバー |
| キャッシュ専用サーバー | 自分のゾーンを持たず、キャッシュだけを行う | 小さな拠点の DNS |

- クライアント側の小さな部品を**スタブリゾルバー**と呼びます。`/etc/resolv.conf` に書いたキャッシュサーバーへ、再帰の問い合わせを 1 回投げるだけです。
- **再帰**の問い合わせは「答えが出るまで調べて返して」という頼み方、**反復**の問い合わせは「知っている範囲で答えて(次に聞く先を教えて)」という頼み方です。

```text
[client]                 スタブリゾルバー。resolv.conf のサーバーへ聞く
    |
    |  1. www.example.com は?(再帰の問い合わせ)
    v
[cache server]           キャッシュサーバー。自分でたどって答えを探す
    |
    +--> [root server]        2. 反復の問い合わせ。「com はこちら」と教わる
    |
    +--> [com server]         3. 「example.com はこちら」と教わる
    |
    `--> [example.com server] 4. 権威サーバー。正式な答えを返す
```

キャッシュサーバーは、4 の答えを TTL(キャッシュしてよい秒数)の間だけ覚えます。同じ名前を次に聞かれたときは、権威サーバーへ行かずに答えます。

### 2. BIND のインストールと場所

**BIND**(Berkeley Internet Name Domain)は、最も広く使われる DNS サーバーのソフトウェアです。デーモンの名前は **named** です。1 つのソフトウェアで、権威サーバーにもキャッシュサーバーにもなります。

| | Red Hat 系(AlmaLinux / RHEL 9) | Debian 系(Ubuntu 24.04 / Debian 12) |
|---|---|---|
| パッケージ | `bind`(ユーティリティーは `bind-utils`) | `bind9`(ユーティリティーは `bind9-utils`、dig などは `bind9-dnsutils`) |
| サービス | `named.service` | `named.service`(別名 `bind9.service`) |
| 実行するユーザー | `named` | `bind` |
| 主な設定ファイル | `/etc/named.conf` | `/etc/bind/named.conf`(中で `named.conf.options`、`named.conf.local`、`named.conf.default-zones` を読む) |
| ゾーンファイルの置き場 | `/var/named/` | `/etc/bind/` や `/var/cache/bind/`(`options` の `directory` で決める) |
| rndc の鍵 | `/etc/rndc.key` | `/etc/bind/rndc.key` |

```bash
# Red Hat 系
sudo dnf install bind bind-utils
sudo systemctl enable --now named

# Debian 系
sudo apt install bind9 bind9-utils bind9-dnsutils
sudo systemctl enable --now named
```

BIND を入れたら、ファイアウォールで DNS の通信(UDP と TCP の 53 番)を許可します。

### 3. named.conf の構造

named.conf は、`文 { …; };` の形の文を並べたファイルです。**文の最後のセミコロン `;` を忘れる**と、読み込みに失敗します。コメントは `//`、`#`、`/* … */` が使えます。

| 文 | 役割 |
|---|---|
| `options { … };` | サーバー全体の動き(置き場、待ち受け、問い合わせの制限、再帰、転送) |
| `zone "名前" { … };` | ゾーンごとの設定(種類、ファイル、転送の相手) |
| `acl 名前 { … };` | アドレスの一覧に名前を付ける |
| `logging { … };` | ログの出し先と内容 |
| `key "名前" { … };` | TSIG などの鍵(2.08.3) |
| `view "名前" { … };` | 問い合わせ元ごとに答えを変える(2.08.3) |

```
// 例: キャッシュ専用サーバー(社内 192.0.2.0/24 のクライアント向け)
acl "internal" { 127.0.0.1; 192.0.2.0/24; };

options {
    directory "/var/named";                     // 相対パスの基準
    listen-on port 53 { 127.0.0.1; 192.0.2.53; };   // 待ち受ける自分のアドレス
    listen-on-v6 { none; };
    allow-query { internal; };                  // 問い合わせに答える相手
    recursion yes;                              // 再帰の問い合わせを受ける
    allow-recursion { internal; };              // 再帰を許す相手
    dnssec-validation auto;
};

zone "." IN {
    type hint;                                  // ルートヒント(ルートサーバーの一覧)
    file "named.ca";
};
```

| オプション | 役割 |
|---|---|
| `directory` | ゾーンファイルなど、相対パスの基準になる場所 |
| `listen-on` / `listen-on-v6` | 待ち受ける自分のアドレスとポート |
| `allow-query` | **問い合わせに答える**相手の制限 |
| `recursion` | 再帰の問い合わせを受けるか(`yes` / `no`) |
| `allow-recursion` | **再帰を許す**相手の制限 |
| `allow-transfer` | ゾーン転送を許す相手の制限(2.08.3) |
| `forwarders` | 自分で調べず、問い合わせを任せる先(2.08.3) |

- **権威サーバー**として公開するときは、`recursion no;` にします。外から再帰の問い合わせを受けると、攻撃の踏み台(DNS リフレクション)に使われるおそれがあるためです。
- `allow-recursion` を書かないときは、`allow-query-cache`、`allow-query` の順に、書いてある値を使います。どちらもないときの既定は、自分自身と自分のネットワーク(localhost と localnets)です。
- そのため、`allow-query { any; };` だけを書くと、再帰も誰にでも許してしまいます。キャッシュサーバーでは、`allow-recursion` を明示します。

### 4. zone 文の種類

| `type` | 意味 |
|---|---|
| `primary`(古い書き方は `master`) | ゾーンの元データを持つ。ゾーンファイルを自分で編集する |
| `secondary`(古い書き方は `slave`) | プライマリからゾーン転送で写しを取る |
| `hint` | ルートヒント(最初に聞くルートサーバーの一覧)。ゾーン名は `.` |
| `forward` | このゾーンだけ、転送先に任せる |

```
zone "example.com" IN {
    type primary;
    file "example.com.zone";            // directory からの相対
};
```

`primary` と `secondary` は、BIND 9.16 以降で使えます(AlmaLinux 9 と Ubuntu 24.04、Debian 12 の BIND は、どれも使える版です)。`master` と `slave` も、同じ意味で使い続けられます。

### 5. 設定の検査と反映

設定を変えたら、反映する前に **named-checkconf** で文法を検査します。

```bash
named-checkconf                        # 既定の named.conf を検査(何も出なければ正常)
named-checkconf -z                     # ゾーンファイルの読み込みも試す
named-checkconf /etc/named.conf        # ファイルを指定する
```

反映は **rndc**(remote name daemon control)で行います。named を止めずに、動いている named を操作する道具です。rndc は、named と同じ鍵(rndc.key)を持っていれば、既定では自分自身(127.0.0.1 の TCP 953 番)につながります。

| コマンド | 動き |
|---|---|
| `rndc reload` | 設定ファイルとすべてのゾーンを読み直す |
| `rndc reload example.com` | そのゾーンだけを読み直す |
| `rndc reconfig` | 設定ファイルと、**新しく足したゾーン**だけを読む(既存のゾーンファイルは読み直さない) |
| `rndc retransfer example.com` | セカンダリが、そのゾーンを転送し直す |
| `rndc flush` | キャッシュを消す |
| `rndc status` | 動作の状態を表示する |
| `rndc stop` | named を止める |

`systemctl reload named` でも、設定の再読み込みができます。

```text
[named.conf を編集]
    |
    v
[named-checkconf]        文法の誤りがないか確かめる
    |
    v
[rndc reload / reconfig] named を止めずに反映する
```

### 6. 問い合わせの道具(dig、host、nslookup)

| コマンド | 使い方の例 | 特徴 |
|---|---|---|
| `dig` | `dig @192.0.2.53 www.example.com A` | 詳しい結果を出す。DNS の調査の標準 |
| `host` | `host www.example.com` | 短く 1 行で答える |
| `nslookup` | `nslookup www.example.com 192.0.2.53` | 対話モードもある古くからの道具 |

```bash
dig www.example.com                    # A レコード(既定)
dig www.example.com +short             # 答えの値だけを表示する
dig @192.0.2.53 example.com MX         # 聞く相手のサーバーを指定する
dig @ns1.example.com example.com SOA +norec  # 権威サーバーに直接、再帰を求めずに聞く(flags に aa が付く)
dig @192.0.2.53 example.com AXFR       # ゾーン転送を要求する
dig -x 192.0.2.80                      # 逆引き(PTR)
dig example.com +trace                 # ルートから順にたどる

host www.example.com                   # 名前から IP アドレス
host -t MX example.com                 # MX レコード
host 192.0.2.80                        # IP アドレスから名前(逆引き)
nslookup -type=MX example.com          # nslookup で MX を調べる
```

`dig` の結果の `flags:` に `aa` があれば、答えが権威サーバーからのもの(authoritative answer)です。`ad` があれば、DNSSEC の検証に成功しています。

### 7. ログと、BIND 以外のサーバー

- ログは、既定では syslog(systemd のジャーナル)に出ます。`journalctl -u named` で読めます。出し先や内容を変えるには、named.conf の `logging` 文に `channel`(出し先)と `category`(種類)を書きます。
- BIND 以外にも、DNS のサーバーはあります。

| ソフトウェア | 特徴 |
|---|---|
| dnsmasq | 小さい。DNS の転送とキャッシュ、DHCP を 1 つのデーモンで行う。家庭用ルーターや小さな環境向け |
| Unbound | 検証付きのキャッシュサーバー(再帰リゾルバー)。DNSSEC の検証ができる |
| NSD | 権威サーバー専用。再帰の問い合わせには答えない。軽くて速い |
| PowerDNS | 権威サーバー(Authoritative Server)と、キャッシュサーバー(Recursor)が別のソフトウェア。ゾーンのデータを SQL データベースに置ける |

## 2.08.2 ゾーン情報の管理 (重要度2)

### 1. ゾーンファイルと資源レコード

**ゾーンファイル**は、ゾーンのデータを書いたテキストファイルです。1 行が 1 つの**資源レコード**(RR、リソースレコード)です。形は次のとおりです。

```
名前    [TTL]   IN   種類   値
www             IN   A      192.0.2.80
```

| 種類 | 意味 | 値の例 |
|---|---|---|
| SOA | ゾーンの管理情報(1 つのゾーンに 1 つ、最初に書く) | 次の表を参照 |
| NS | そのゾーンのネームサーバー。委任にも使う | `ns1.example.com.` |
| A | 名前に IPv4 アドレスを対応付ける | `192.0.2.80` |
| AAAA | 名前に IPv6 アドレスを対応付ける | `2001:db8::25` |
| MX | メールの配送先(優先度が小さいほど先に使う) | `10 mail.example.com.` |
| CNAME | 別名。本当の名前を指す | `www.example.com.` |
| PTR | IP アドレスから名前(逆引き) | `www.example.com.` |
| TXT | 自由な文字列(SPF、ドメインの所有確認など) | `"v=spf1 mx -all"` |
| SRV | サービスの場所(優先度、重み、ポート、ホスト) | `10 60 5060 sip.example.com.` |

- **名前の末尾のドット**に注意します。`ns1.example.com.`(ドットあり)は、完全な名前(FQDN)です。**ドットがない名前には、ゾーンの起点(`$ORIGIN`)が後ろに足されます**。`mail.example.com` と書くと `mail.example.com.example.com.` になってしまいます。
- `@` は、ゾーンの起点(ゾーン名)を表します。名前を省略した行は、1 つ上の行と同じ名前になります。
- **MX と NS の値には、CNAME の名前を使いません**。A または AAAA のある名前を書きます。
- **CNAME は、同じ名前に、ほかの種類のレコードと一緒に置けません**。ゾーンの頂点(`@`)には SOA と NS があるので、CNAME は置けません。

### 2. 順引きのゾーンファイルの例

```
$TTL 1h
$ORIGIN example.com.
@       IN SOA  ns1.example.com. hostmaster.example.com. (
                2026112501      ; シリアル番号
                1h              ; refresh
                15m             ; retry
                1w              ; expire
                1h )            ; minimum(否定の答えのキャッシュ時間)
        IN NS   ns1.example.com.
        IN NS   ns2.example.com.
        IN MX   10 mail.example.com.
        IN TXT  "v=spf1 mx -all"
ns1     IN A    192.0.2.53
ns2     IN A    192.0.2.54
www     IN A    192.0.2.80
mail    IN A    192.0.2.25
mail    IN AAAA 2001:db8::25
web     IN CNAME www
```

| 行 | 意味 |
|---|---|
| `$TTL 1h` | レコードの TTL の既定値(`1h`、`30m`、`1d`、`1w` のような単位が使える) |
| `$ORIGIN example.com.` | 名前の起点。省略した名前の後ろに足される(省略すると、named.conf の zone 名) |
| `@ IN SOA …` | SOA レコード |
| 名前を省いた `IN NS …` | 直前の `@` と同じ名前(`example.com.`)の NS レコード |
| `web IN CNAME www` | `web.example.com.` は `www.example.com.` の別名(`www` にドットがないので `$ORIGIN` が足される) |

SOA の値は、次の順に並べます。**この順番は変えられません**。

| 順番 | 名前 | 意味 |
|---|---|---|
| 1 | MNAME | 元データを持つプライマリのネームサーバー(`ns1.example.com.`) |
| 2 | RNAME | 管理者のメールアドレス。`@` をドットに替えて書く(`hostmaster@example.com` → `hostmaster.example.com.`) |
| 3 | シリアル番号 | ゾーンの版の番号。**編集のたびに増やす** |
| 4 | refresh | セカンダリが、プライマリのシリアル番号を確かめに来る間隔 |
| 5 | retry | refresh に失敗したとき、やり直す間隔 |
| 6 | expire | プライマリにつながらない状態が続いたとき、セカンダリが答えるのをやめるまでの時間 |
| 7 | minimum | 「その名前はない」という答えを、キャッシュしてよい時間 |

**シリアル番号**は、`2026112501`(日付 + その日の通し番号 2 桁)の形で付けるのが一般的です。セカンダリは、プライマリのシリアル番号が自分のものより**大きいとき**だけ、ゾーンを取り直します。ゾーンファイルを編集しても、シリアル番号を増やさないと、セカンダリは古いままです。

### 3. 逆引きのゾーンファイル

IP アドレスから名前を調べる**逆引き**は、`in-addr.arpa` という特別なドメインを使います。アドレスの数字を**逆の順**に並べて、`.in-addr.arpa.` を付けます。

```text
192.0.2.80 の逆引き

address   192 . 0 . 2 . 80
           |    |   |   |
reverse    80 . 2 . 0 . 192 . in-addr.arpa.
           |
           `-- 80.2.0.192.in-addr.arpa. の PTR を調べる

192.0.2.0/24 のゾーン名は 2.0.192.in-addr.arpa. になる(最後の 80 はゾーンの中の名前)
```

IPv6 は `ip6.arpa` を使い、アドレスを 4 ビット(16 進 1 桁)ごとに逆に並べます。

named.conf には、逆引きのゾーンを足します。

```
zone "2.0.192.in-addr.arpa" IN {
    type primary;
    file "192.0.2.rev";
};
```

```
$TTL 1h
@       IN SOA  ns1.example.com. hostmaster.example.com. (
                2026112501 1h 15m 1w 1h )
        IN NS   ns1.example.com.
        IN NS   ns2.example.com.
53      IN PTR  ns1.example.com.
54      IN PTR  ns2.example.com.
80      IN PTR  www.example.com.
```

- PTR の左側の `80` は、ドットがないので、`80.2.0.192.in-addr.arpa.` になります。
- PTR の右側は、**末尾のドットを付けた**完全な名前にします。ドットを忘れると、`www.example.com.2.0.192.in-addr.arpa.` になります。
- 1 つの IP アドレスに複数の名前があっても、PTR は 1 つにするのが普通です(メールサーバーが逆引きの結果を確かめるため)。

### 4. ルートヒント

自分が知らない名前を調べるとき、キャッシュサーバーは最初にルートサーバーへ聞きます。ルートサーバーの名前と IP アドレスの一覧が**ルートヒント**です。named.conf で、`type hint;` のゾーン `.` に書きます。

| | ルートヒントのファイル |
|---|---|
| Red Hat 系 | `/var/named/named.ca` |
| Debian 系 | `/usr/share/dns/root.hints`(`named.conf.default-zones` で指定される) |

ルートヒントは、パッケージの更新で新しくなります。

### 5. ゾーンの委任

`example.com` の中の `sub.example.com` を、別のネームサーバーに任せることを**委任**と呼びます。親のゾーンに、子のゾーンのネームサーバーを NS レコードで書きます。

```
; example.com のゾーンファイルに足す
sub         IN NS   ns1.sub.example.com.
ns1.sub     IN A    192.0.2.60
```

- 2 行目の A レコードは、**グルーレコード**です。子のネームサーバーの名前(`ns1.sub.example.com.`)が、委任された先のゾーンの中にあるので、親のゾーンに IP アドレスを書いて、名前を引く堂々巡りを防ぎます。
- 子のゾーン `sub.example.com` の SOA、NS、ホストの情報は、委任された先のサーバーで管理します。

```text
[root]            "." のネームサーバー
    |
    |  com の NS を書いて委任する
    v
[com]
    |
    |  example.com の NS を書いて委任する
    v
[example.com]     自分のゾーン
    |
    |  sub の NS とグルーを書いて委任する
    v
[sub.example.com] 別のサーバーが管理する
```

### 6. ゾーンの検査と変換

| コマンド | 動き |
|---|---|
| `named-checkzone example.com /var/named/example.com.zone` | ゾーンファイルを読み込んで、文法と内容を検査する。正常なら `zone example.com/IN: loaded serial 2026112501` のように出て、`OK` と表示される |
| `named-compilezone -o example.com.raw -f text -F raw example.com example.com.zone` | 検査をして、別の形式(raw など)のファイルに書き出す。`-f` が入力、`-F` が出力の形式 |

- **named-checkzone** は、検査だけが目的です。新しいゾーンファイルは、named に読ませる前に必ず検査します。
- **named-compilezone** は、検査に加えて、変換したファイルを作ります。raw 形式は、大きなゾーンを速く読み込ませたいときに使います。

### 7. ホストの追加と確認

ホストを足す手順です。

1. ゾーンファイルに A レコード(必要なら AAAA)を足す。
2. 逆引きのゾーンファイルに PTR レコードを足す。
3. **両方のファイルのシリアル番号を増やす**。
4. `named-checkzone` で、両方のファイルを検査する。
5. `rndc reload example.com` と `rndc reload 2.0.192.in-addr.arpa` で読み直す。
6. `dig` で、順引きと逆引きを確かめる。

```bash
named-checkzone example.com /var/named/example.com.zone
named-checkzone 2.0.192.in-addr.arpa /var/named/192.0.2.rev
sudo rndc reload example.com
sudo rndc reload 2.0.192.in-addr.arpa
dig @192.0.2.53 db.example.com +short        # A レコード
dig @192.0.2.53 -x 192.0.2.90 +short         # PTR レコード
```

新しいゾーンを足すときは、named.conf に `zone` 文を足して、`named-checkconf` で検査し、`rndc reconfig` で読み込ませます。

## 2.08.3 セキュアなDNSサーバーの実現 (重要度2)

### 1. 非 root と chroot

DNS サーバーは、外から来る問い合わせを受け付けるので、攻撃を受けやすいサービスです。もし named の脆弱性を突かれても、被害を小さくするために、次の 2 つを行います。

- **root 以外のユーザーで動かす**: 53 番ポートを開くときだけ root の権限を使い、その後は `named`(Debian 系では `bind`)のユーザーに替わります。named の起動オプション `-u ユーザー名` で指定します。
- **chroot で閉じ込める**: **chroot** は、プロセスから見えるルートディレクトリ(`/`)を、別のディレクトリに替える仕組みです。named を `/var/named/chroot` の中に閉じ込めると、もし乗っ取られても、その外のファイル(`/etc/shadow` など)は見えません。

```text
[通常]
  named から見える / = 本物の /
  乗っ取られると、/etc などが見える

[chroot]
  named から見える / = /var/named/chroot
  乗っ取られても、その外は見えない
  /var/named/chroot/etc/named.conf    named が見る /etc/named.conf
  /var/named/chroot/var/named/        named が見る /var/named/
```

| | Red Hat 系 | Debian 系 |
|---|---|---|
| 方法 | `bind-chroot` を入れる | 起動オプション `-t ディレクトリ` で自分で用意する |
| 起動 | `systemctl enable --now named-chroot` | `/etc/default/named` の `OPTIONS` に `-u bind -t /var/lib/named` のように書く |
| 閉じ込める場所 | `/var/named/chroot/` | 自分で決める(`/var/lib/named/` など) |

chroot の中に、named.conf、ゾーンファイル、ログの出し先、乱数のデバイスなどを、あらかじめ置く必要があります。Red Hat 系の `named-chroot` のサービスは、この準備を自動で行います【要確認】。最近の BIND は、systemd のサンドボックス機能で守られているので、chroot を使わない運用も増えています。

### 2. forwarders と split DNS

**forwarders**(フォワーダー)は、自分で調べずに、別のキャッシュサーバーに問い合わせを任せる設定です。社内のサーバーが、外へ直接出ずに、ISP などの決まったサーバーを通すときに使います。

```
options {
    forwarders { 192.0.2.1; };      // 任せる先
    forward only;                   // 任せる先が答えないときは、あきらめる
};
```

- `forward only;` は、任せる先だけを使います。
- `forward first;`(既定)は、任せる先が答えないとき、自分で調べにいきます。

**split DNS**(スプリット DNS)は、**同じ名前に、問い合わせ元によって別の答えを返す**設計です。社内のクライアントには社内の IP アドレスを、社外には公開用の IP アドレスを返します。BIND では、`view` で実現します。

```
view "internal" {
    match-clients { 192.0.2.0/24; };         // 社内からの問い合わせ
    recursion yes;
    zone "example.com" IN {
        type primary;
        file "example.com.internal.zone";    // 社内用のデータ
    };
};

view "external" {
    match-clients { any; };                  // それ以外
    recursion no;
    zone "example.com" IN {
        type primary;
        file "example.com.external.zone";    // 公開用のデータ
    };
};
```

- `view` は上から順に評価され、最初に `match-clients` が合った `view` が使われます。
- `view` を 1 つでも使うと、**すべての zone 文を、いずれかの `view` の中に書きます**(ルートヒントも)。

### 3. ゾーン転送の制限と TSIG

**ゾーン転送**(AXFR)は、セカンダリがプライマリからゾーンの全体を取る仕組みです。誰でも転送できると、ネットワーク内のホストの一覧が、そのまま漏れます。

```
zone "example.com" IN {
    type primary;
    file "example.com.zone";
    allow-transfer { 192.0.2.54; };          // セカンダリだけに許す
};
```

- 全体の既定は、`options` の `allow-transfer` に書きます。`{ none; };` にして、ゾーンごとに許す方法が安全です。
- プライマリは、ゾーンが変わると、NS にある相手へ**通知**(NOTIFY)を送ります。通知を受けたセカンダリは、シリアル番号を確かめ、増えていれば転送します。

```text
primary 192.0.2.53   --- NOTIFY ------->   secondary 192.0.2.54   1. ゾーンが変わった知らせ
primary 192.0.2.53   <-- SOA ----------    secondary 192.0.2.54   2. シリアル番号を比べる
primary 192.0.2.53   <-- AXFR / IXFR --    secondary 192.0.2.54   3. ゾーンを転送する
```

IP アドレスだけでの制限は、なりすましに弱いです。**TSIG**(Transaction SIGnature)は、プライマリとセカンダリが**共有する秘密の鍵**(HMAC)で、メッセージに署名をして、相手を確かめる仕組みです。ゾーン転送、動的更新、通知の保護に使います。

```bash
tsig-keygen -a hmac-sha256 transfer-key       # 鍵の文を作って表示する
```

```
// 両方のサーバーに、同じ鍵を書く(秘密の値は作り直す。次の値は架空)
key "transfer-key" {
    algorithm hmac-sha256;
    secret "c2FtcGxlLWRvLW5vdC11c2UtdGhpcy1rZXk=";
};

// プライマリ: この鍵で署名できる相手にだけ、転送を許す
zone "example.com" IN {
    type primary;
    file "example.com.zone";
    allow-transfer { key transfer-key; };
};

// セカンダリ: プライマリに対して、この鍵を使う
server 192.0.2.53 {
    keys { transfer-key; };
};
zone "example.com" IN {
    type secondary;
    primaries { 192.0.2.53; };
    file "slaves/example.com.zone";          // Red Hat 系は /var/named/slaves/ に置く【要確認】
};
```

鍵の入ったファイルは、named だけが読めるように(`chmod 640`、所有グループは named)します。秘密の値を、チャットなどで送りません。

### 4. DNSSEC

**DNSSEC**(DNS Security Extensions)は、DNS の答えが、**正しい権威サーバーのもので、途中で改ざんされていない**ことを、電子署名で確かめる仕組みです。答えの中身を暗号化するものではありません。

| レコード | 意味 |
|---|---|
| DNSKEY | ゾーンの署名を検証するための公開鍵 |
| RRSIG | レコードの組(RRset)に付けた署名 |
| DS | 子ゾーンの公開鍵(KSK)のハッシュ。**親のゾーン**に登録する |
| NSEC / NSEC3 | 「その名前は存在しない」ことの証明 |

鍵は 2 種類に分けて使います。

- **KSK**(鍵署名鍵): DNSKEY の組に署名する。親の DS に登録する鍵で、長く使う。
- **ZSK**(ゾーン署名鍵): ゾーンのほかのレコードに署名する。短い周期で替える。

```text
[root "."]            信頼の出発点(トラストアンカー)
    |
    |  DS(com の KSK のハッシュ)
    v
[com]
    |
    |  DS(example.com の KSK のハッシュ)
    v
[example.com]         DNSKEY(KSK、ZSK)で RRSIG を検証する
    |
    v
[www.example.com A]   RRSIG の署名つきの答え
```

ゾーンに署名する手順です。

```bash
# 1. 鍵を作る(-n ZONE: ゾーンの署名用、-f KSK: KSK)
dnssec-keygen -a ECDSAP256SHA256 -n ZONE example.com             # ZSK
dnssec-keygen -a ECDSAP256SHA256 -f KSK -n ZONE example.com      # KSK
#   → Kexample.com.+013+12345.key(公開鍵)と .private(秘密鍵)ができる

# 2. 公開鍵(DNSKEY)をゾーンファイルに取り込む
#    ゾーンファイルの末尾に  $INCLUDE Kexample.com.+013+12345.key  を書く

# 3. ゾーンに署名する(-S: 鍵を自動で選ぶ、-N: シリアル番号の扱い、-o: ゾーン名)
dnssec-signzone -S -N increment -o example.com example.com.zone
#   → example.com.zone.signed ができる
#   (シリアル番号は既定では変わらない。-N increment で 1 増やす)

# 4. named.conf の file を、署名したファイルに替える
#    file "example.com.zone.signed";

# 5. 親のゾーンに DS を登録する(KSK のハッシュを作る)
dnssec-dsfromkey Kexample.com.+013+67890.key
```

- 署名には期限があるので、期限が切れる前に署名し直します。ゾーンの内容を変えたときも、署名し直します。
- 秘密鍵(`.private`)は、漏れないように守ります。
- BIND 9.16 以降は、`dnssec-policy` を使って、鍵の作成と署名を named に任せることもできます。
- **検証する側**(キャッシュサーバー)は、`dnssec-validation auto;`(組み込みのトラストアンカーを使う)にします。検証に成功すると、`dig +dnssec` の結果に `ad` のフラグが付きます。

### 5. DANE と TLSA

**DANE**(DNS-based Authentication of Named Entities)は、サーバーの証明書(または公開鍵)の情報を、DNS に載せて、クライアントが証明書を確かめられるようにする仕組みです。載せるレコードが **TLSA** です。**DNSSEC で署名されていることが前提**です。署名がないと、TLSA の答えそのものが改ざんされるためです。

```
_443._tcp.www.example.com. IN TLSA 3 1 1 (
        b4c7e9a1d2f3...(SHA-256 のハッシュ。16 進数 64 桁、架空の値) )
```

| 名前 | 意味 |
|---|---|
| `_443._tcp.www.example.com.` | `www.example.com` の TCP 443 番(HTTPS)の証明書の情報 |
| 1 つ目の `3` | 使い方。3 はサーバーの証明書そのもの(DANE-EE) |
| 2 つ目の `1` | 何のハッシュか。1 は公開鍵の部分(SPKI)、0 は証明書全体 |
| 3 つ目の `1` | ハッシュの方式。1 は SHA-256 |

メールサーバー(SMTP)でも、MX の相手の証明書を確かめるために、DANE が使われます。

### 6. 設定のまとめ

| 守りたいこと | 設定 |
|---|---|
| 攻撃されても被害を小さくする | `-u` で非 root、chroot |
| 再帰の問い合わせの悪用を防ぐ | 権威サーバーは `recursion no;`、キャッシュサーバーは `allow-recursion` |
| ゾーンの一覧が漏れるのを防ぐ | `allow-transfer` で転送の相手を絞る |
| 転送の相手を確かめる | TSIG |
| 答えの改ざんを見つける | DNSSEC |
| 証明書を DNS で確かめる | DANE(TLSA。DNSSEC が前提) |
