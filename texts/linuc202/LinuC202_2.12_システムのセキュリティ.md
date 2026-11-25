# LinuC 202 テキスト 2.12 システムのセキュリティ

サーバーを外からの攻撃から守るために、パケットフィルタリング、OpenSSH サーバー、OpenVPN、日々のセキュリティ業務を学びます。LinuC 102 の 1.10 で学んだ基本(SUID の監査、ポートの確認、ホストの設定)の続きとして、サーバー側の設定を一段深く扱います。

## 2.12.1 iptables や firewalld によるパケットフィルタリング (重要度3)

### 1. パケットフィルタリングと netfilter

- **パケットフィルタリング**は、通信(パケット)の送信元、宛先、プロトコル、ポートを見て、通すか止めるかを決める仕組みです。
- Linux のカーネルには **netfilter** というパケットを処理する仕組みがあり、そこに規則を書くコマンドが **iptables** です。
- 規則を並べる場所を**チェイン**、チェインをまとめたものを**テーブル**と呼びます。

| テーブル | 役割 | 主なチェイン |
|---|---|---|
| `filter`(既定) | 通す、止める | INPUT、FORWARD、OUTPUT |
| `nat` | アドレスやポートの書き換え | PREROUTING、INPUT、OUTPUT、POSTROUTING |
| `mangle` | パケットの中身の加工(TOS、マークなど) | PREROUTING、INPUT、FORWARD、OUTPUT、POSTROUTING |

| filter のチェイン | 対象になるパケット |
|---|---|
| `INPUT` | このホスト宛に届いたもの |
| `OUTPUT` | このホストから出ていくもの |
| `FORWARD` | このホストを通り抜けて、ほかのホストへ転送されるもの |

パケットがホストの中をどう通るかを図にします。

```text
packet in
  |
  v
PREROUTING       DNAT REDIRECT      宛先を書き換える(nat)
  |
  v
routing          このホスト宛か、転送かを決める
  |
  +-- local ---> INPUT ---> local process      このホスト宛
  |                               |
  |                               v
  |                            OUTPUT          プロセスから出る通信
  |                               |
  +-- forward -> FORWARD          |            転送される通信
                    |             |
                    v             v
               POSTROUTING   SNAT MASQUERADE   送信元を書き換える(nat)
                    |
                    v
                packet out
```

- IPv4 は `iptables`、IPv6 は **ip6tables** で別々に設定します。`iptables` で書いた規則は IPv6 の通信には効きません。
- Red Hat 系(AlmaLinux / RHEL 9 系)と Debian 系(Ubuntu 24.04 / Debian 12)の最近の版では、`iptables` の裏で nftables が動く場合があります。コマンドの使い方は同じです【要確認: 配布版ごとに既定の実装が違う】。

### 2. 規則は上から順に評価される

- チェインの規則は、**上から順に**調べられます。
- 条件に**最初に一致した規則**の動作(ターゲット)で決まり、それより下の規則は見られません。
- どの規則にも一致しなかったパケットは、そのチェインの**ポリシー**(既定の動作)に従います。ポリシーは `-P` で決め、`ACCEPT`(通す)か `DROP`(捨てる)です。

```text
packet reaches INPUT
  |
  v
rule 1: match? --yes--> run its target and stop      最初に一致した規則で決まる
  | no
  v
rule 2: match? --yes--> run its target and stop
  | no
  v
(the same for the rest)
  | no rule matches
  v
policy (-P)      どの規則にも一致しなければ、ポリシーに従う
```

| 動作 | 意味 |
|---|---|
| `ACCEPT` | 通す |
| `DROP` | 黙って捨てる(相手には何も返らず、待たされる) |
| `REJECT` | 捨てて、拒否したことを相手に知らせる |
| `LOG` | ログに記録して、次の規則へ進む(ここでは終わらない) |

| コマンド | 意味 |
|---|---|
| `iptables -L -n -v --line-numbers` | 規則の一覧(`-n` は名前を引かず数字で表示、`--line-numbers` で行の番号) |
| `iptables -S` | 規則をコマンドの形で表示 |
| `iptables -A INPUT …` | チェインの**末尾**に追加する |
| `iptables -I INPUT 1 …` | 指定した位置に挿入する(位置を省略すると先頭) |
| `iptables -D INPUT 3` | 3 番目の規則を消す |
| `iptables -F` | 規則をすべて消す(**ポリシーは変わらない**) |
| `iptables -P INPUT DROP` | INPUT のポリシーを DROP にする |

基本の組み立て方の例です(SSH だけを受け付けるサーバー)。

```bash
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -P INPUT DROP
```

- 1 行目は、自分自身(`lo`)との通信を通します。
- 2 行目は、すでに始まっている通信の戻りのパケットを通します。これがないと、ポリシーを DROP にしたときに、いま使っている SSH も固まります。
- 3 行目は、新しい SSH(22/tcp)を通します。
- 最後にポリシーを DROP にします。**先に許可の規則を入れてから**ポリシーを変えます。

> **【ひっかけ】**
>
> `iptables -F` は規則だけを消します。ポリシーが DROP のまま `-F` すると、すべての通信が止まります。リモートで作業するときは、先に `iptables -P INPUT ACCEPT` に戻してから消します。

- 規則の条件の `--dport` には、ポート番号のほかに、`/etc/services` にあるサービス名(`ssh`、`https` など)を書けます。`/etc/services` は、サービス名とポート番号とプロトコルの対応表です。

### 3. 転送と IP フォワーディング

Linux をルーターとして使う(別のホスト宛のパケットを通す)には、**IP フォワーディング**を有効にします。

| 項目 | 内容 |
|---|---|
| 確認 | `cat /proc/sys/net/ipv4/ip_forward`(1 なら有効) |
| 一時的に有効にする | `sysctl -w net.ipv4.ip_forward=1` または `echo 1 > /proc/sys/net/ipv4/ip_forward` |
| 永続にする | `/etc/sysctl.d/99-forward.conf` に `net.ipv4.ip_forward = 1` を書き、`sysctl --system` で読み込む |
| IPv6 | `net.ipv6.conf.all.forwarding`(`/proc/sys/net/ipv6/conf/all/forwarding`) |

- `/proc/sys/net/ipv4/` と `/proc/sys/net/ipv6/` は、カーネルのネットワークの設定を、動いている状態で見たり変えたりする場所です。再起動すると元に戻ります。
- 転送が許されても、FORWARD チェインのポリシーが DROP なら、通すための規則が別に要ります。

```bash
iptables -A FORWARD -i eth1 -o eth0 -j ACCEPT
iptables -A FORWARD -i eth0 -o eth1 -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```

### 4. NAT とポートのリダイレクト

**NAT**(アドレス変換)は、パケットのアドレスやポートを書き換えます。`nat` テーブルで行います。

| ターゲット | チェイン | 動き | 使いどころ |
|---|---|---|---|
| `MASQUERADE` | POSTROUTING | 送信元を、出ていくインターフェースのアドレスにする | 内側の LAN から外へ出す。外のアドレスが変わる(動的)ときに便利 |
| `SNAT` | POSTROUTING、INPUT | 送信元を、指定したアドレスにする | 外のアドレスが固定のとき |
| `DNAT` | PREROUTING、OUTPUT | 宛先を、指定したアドレスやポートにする | 外から来た通信を、内側のサーバーへ渡す |
| `REDIRECT` | PREROUTING、OUTPUT | 宛先ポートを、**同じホスト**の別のポートにする | 80 番を、同じホストの 8080 番のアプリへ回す |

```bash
# 内側 192.168.1.0/24 を、外側 eth0 のアドレスで外へ出す
iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE

# 外から eth0 の 8080/tcp に来た通信を、内側のサーバーの 80 番へ渡す
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 8080 -j DNAT --to-destination 192.168.1.10:80

# このホストの 80/tcp を、このホストの 8080 番のアプリへ回す
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080
```

- `-t nat` で、nat テーブルを指定します。省略すると filter テーブルです。
- MASQUERADE は POSTROUTING でだけ使えます。
- SNAT は主に POSTROUTING で使います(INPUT でも使えます)。
- DNAT は主に PREROUTING で使います。このホストから出る通信の宛先を変えるときは、OUTPUT で使います。
- DNAT で内側へ渡す通信は、FORWARD チェインも通ります。filter 側でも許可が要ります。
- 同じホストの中のアプリへ、自分で出した通信(OUTPUT)も回したいときは、nat の OUTPUT チェインにも規則を足します。

### 5. 規則の保存と読み込み

`iptables` で入れた規則は、**再起動すると消えます**。

| コマンド | 動き |
|---|---|
| `iptables-save > /etc/iptables/rules.v4` | 現在の規則を、読み込み用の形式で書き出す |
| `iptables-restore < /etc/iptables/rules.v4` | 書き出した規則を読み込む(いまの規則は置き換わる) |
| `ip6tables-save`、`ip6tables-restore` | IPv6 用 |

- Debian 系は、`iptables-persistent`(`netfilter-persistent`)を入れると、`/etc/iptables/rules.v4` と `rules.v6` を起動時に読み込みます。
- Red Hat 系で iptables を使い続けるときは、`iptables-services` を入れると、`/etc/sysconfig/iptables` を起動時に読み込みます【要確認: 版ごとの提供状況】。
- 新しい規則を試すときは、保存してから変更し、おかしければ `iptables-restore` で戻せるようにします。

### 6. firewalld

**firewalld** は、Red Hat 系の標準のファイアウォール管理の仕組みです。裏でカーネルのパケットフィルターを使い、操作は `firewall-cmd` で行います。

- **ゾーン**を使います。ゾーンは、「どれだけ信頼するか」のまとまりで、ゾーンごとに許可するサービスやポートを決めます。インターフェースや送信元のアドレスを、ゾーンに割り当てます。
- 割り当てがなければ、**既定のゾーン**(Red Hat 系の既定は `public`)になります。

| コマンド | 動き |
|---|---|
| `firewall-cmd --state` | 動いているか |
| `firewall-cmd --get-default-zone` | 既定のゾーン |
| `firewall-cmd --get-active-zones` | 使われているゾーンと、割り当て |
| `firewall-cmd --zone=public --list-all` | ゾーンの設定の一覧 |
| `firewall-cmd --zone=public --add-service=http` | http を許可する |
| `firewall-cmd --zone=public --add-port=8080/tcp` | ポートを許可する |
| `firewall-cmd --zone=public --remove-service=http` | 許可をやめる |
| `firewall-cmd --zone=internal --change-interface=eth1` | インターフェースのゾーンを変える |
| `firewall-cmd --zone=public --add-masquerade` | マスカレードを有効にする |
| `firewall-cmd --zone=public --add-forward-port=port=80:proto=tcp:toport=8080` | 80 番を 8080 番へ回す |
| `firewall-cmd --reload` | 永続の設定を読み直して、実行中の設定にする |
| `firewall-cmd --runtime-to-permanent` | 実行中の設定を、永続の設定に書き込む |

#### 実行中の設定と永続の設定

firewalld には、**実行中**(runtime)の設定と、**永続**(permanent)の設定があります。

```text
firewall-cmd --add-service=http
  |
  v
[runtime]      すぐ効く。--reload か再起動で消える

firewall-cmd --permanent --add-service=http
  |
  v
[permanent]    ファイルに残る。いまの動作は変わらない
  |
  |  firewall-cmd --reload
  v
[runtime]      永続の設定を読み込んで、いまの動作になる
```

- `--permanent` を付けた変更は、永続の設定にだけ書かれます。**いまの動作には、`--reload` まで反映されません**。
- `--permanent` を付けない変更は、すぐ効きますが、`--reload` や再起動で消えます。
- 両方に反映したいときは、`--permanent` を付けて実行してから `--reload` します。または、付けずに実行して動作を確かめてから `--runtime-to-permanent` で保存します。

### 7. ufw

**ufw** は、Ubuntu 標準の簡単なファイアウォール管理の道具です(Uncomplicated Firewall)。裏で iptables / nftables を使います。

| コマンド | 動き |
|---|---|
| `ufw status verbose` | 状態と既定の動作を表示する |
| `ufw allow 22/tcp`、`ufw allow ssh` | 22/tcp を許可する |
| `ufw allow from 192.168.1.0/24 to any port 22` | 送信元を限って許可する |
| `ufw deny 23/tcp` | 拒否する |
| `ufw status numbered`、`ufw delete 2` | 番号で規則を表示、削除 |
| `ufw default deny incoming` | 受信の既定を拒否にする |
| `ufw enable`、`ufw disable` | 有効、無効にする |

- 既定は、受信を拒否、送信を許可です。有効にする**前に** SSH(`ufw allow 22/tcp`)を許可します。そうしないと、新しい SSH の接続ができなくなります。
- ufw の規則は、`ufw enable` のあと、再起動しても残ります。

| 道具 | 主なディストリビューション | 特徴 |
|---|---|---|
| iptables | どこでも | チェインとテーブルを自分で組み立てる |
| firewalld | Red Hat 系 | ゾーンとサービス単位。動かしながら変更できる |
| ufw | Ubuntu | 短いコマンドで書ける |

- 同じホストで firewalld と ufw と iptables の保存の仕組みを、**同時に**使いません。規則が重なって、どれが効いているか分からなくなります。

## 2.12.2 OpenSSH サーバーの設定と管理 (重要度4)

### 1. sshd と設定ファイル

| 項目 | 内容 |
|---|---|
| サーバーのプログラム | `sshd`(OpenSSH サーバー) |
| サービスの名前 | Red Hat 系は `sshd`、Debian 系(Ubuntu、Debian)は `ssh` |
| サーバーの設定 | `/etc/ssh/sshd_config` |
| クライアントの設定 | `/etc/ssh/ssh_config`、`~/.ssh/config` |
| 追加の設定 | `/etc/ssh/sshd_config.d/*.conf`(`Include` で読み込む) |

- サーバーの設定は `sshd_config`、クライアントの設定は `ssh_config` です。**d の有無**で見分けます。
- 同じ項目を複数回書くと、**最初に読んだ値**が使われます(後ろの行が勝つ設定ではありません)。`Include` の行より下に書いても、上で読まれた値が先です。
- 変更は、サービスを `reload`(または `restart`)すると反映されます。**すでにつながっている接続は切れません**。

```bash
sudo sshd -t                        # 設定の文法を確かめる(何も出なければ問題なし)
sudo systemctl reload sshd          # Red Hat 系
sudo systemctl reload ssh           # Debian 系
```

- `sshd -t` は、設定ファイルの文法と値を確かめるだけで、サーバーを動かしません。`sshd -T` は、確かめたうえで、実際に有効な設定を全部表示します。
- 設定を間違えて閉め出されないように、**変更する前に別の端末でもう 1 本つないだまま**にし、`sshd -t` を通してから反映します。
- Ubuntu 24.04 では、ssh が `ssh.socket`(ソケット起動)で待ち受ける設定になっています。ポート(`Port`)を変えるときは、ソケットの設定も確かめます【要確認】。

### 2. 主な設定項目

| 項目 | 主な値 | 意味 |
|---|---|---|
| `Port` | 22 | 待ち受けるポート |
| `ListenAddress` | アドレス | 待ち受けるアドレス |
| `PermitRootLogin` | `yes`、`prohibit-password`、`forced-commands-only`、`no` | root のログインの許可 |
| `PubkeyAuthentication` | `yes`(既定)、`no` | 公開鍵認証を使うか |
| `PasswordAuthentication` | `yes`(既定)、`no` | パスワード認証を使うか |
| `PermitEmptyPasswords` | `no`(既定) | 空のパスワードを許すか |
| `AllowUsers` | ユーザー名(空白で並べる) | **列挙したユーザーだけ**ログインできる |
| `DenyUsers` | ユーザー名 | 列挙したユーザーのログインを拒否する |
| `AllowGroups`、`DenyGroups` | グループ名 | グループで同じことをする |
| `MaxAuthTries` | 数 | 1 回の接続で認証を試せる回数 |
| `X11Forwarding` | `yes`、`no` | X11 の転送 |

| `PermitRootLogin` の値 | root のログイン |
|---|---|
| `yes` | パスワードでも鍵でも許す |
| `prohibit-password` | 鍵などパスワード以外だけ許す(OpenSSH の既定) |
| `forced-commands-only` | 鍵で、鍵に決めたコマンドを実行するときだけ許す |
| `no` | 認証の方式を問わず許さない |

- `AllowUsers` を 1 つでも書くと、**列挙していないユーザーはすべて拒否**されます。`alice@192.168.1.*` のように、接続元を付けて限れます。
- 評価の順は、`DenyUsers`、`AllowUsers`、`DenyGroups`、`AllowGroups` です。
- 鍵だけにする基本の設定の例です。

```
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
AllowUsers alice bob
```

- PAM を使う環境(`UsePAM yes`)では、`KbdInteractiveAuthentication` が `yes` だと、キーボード対話の認証でパスワードを入れられることがあります。鍵だけにするときは、これも `no` にします。
- `/etc/ssh/sshd_config.d/` の中の設定が先に読まれると、同じ項目はそちらの値が使われます(最初に読んだ値が使われます)。実際に効いている値は `sshd -T` で確かめます。

> **【ひっかけ】**
>
> `PasswordAuthentication no` にしたあとで、公開鍵がまだ登録されていないと、誰もログインできなくなります。別の端末で、鍵でログインできることを確かめてから反映します。

### 3. ホスト鍵

**ホスト鍵**は、サーバーが「自分が本物のサーバーだ」と示すための鍵の組です。ユーザーのログインに使う鍵とは別のものです。

| ファイル | 内容 | パーミッション |
|---|---|---|
| `/etc/ssh/ssh_host_ed25519_key` | 秘密鍵(種類ごとに `rsa`、`ecdsa`、`ed25519`) | 600、root だけが読める(Red Hat 系では、グループ ssh_keys の 640 のこともあります【要確認】) |
| `/etc/ssh/ssh_host_ed25519_key.pub` | 公開鍵 | 644 |

```bash
sudo ssh-keygen -A                                  # 無い種類のホスト鍵を、まとめて作る
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub    # フィンガープリントを表示する
```

- クライアントは、初めて接続したとき、ホスト鍵を `~/.ssh/known_hosts` に記録します。次からは、サーバーが示した鍵と記録を比べます。
- 違うと、`WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` という警告が出ます。サーバーを作り直してホスト鍵が変わった場合のほか、**なりすましの疑い**もあるので、理由を確かめます。
- 記録を消すのは `ssh-keygen -R ホスト名` です。
- サーバーを複製(クローン)したときは、ホスト鍵も複製されます。複製先のホスト鍵を消して、`ssh-keygen -A` で作り直します。

### 4. ユーザーの公開鍵認証

```text
client                                       server
  |                                            |
  |-- 1. login request (user, key type) ------>|      ログインの要求
  |<-- 2. challenge (made with public key) ----|      公開鍵で作った問題
  |-- 3. answer (made with private key) ------>|      秘密鍵で作った答え
  |                                            |
  |                                            v
  |                                  check with authorized_keys      登録した公開鍵で確かめる
  |
  v
login allowed or denied
```

```bash
ssh-keygen -t ed25519                # 鍵の組を作る(~/.ssh/id_ed25519 と .pub)
ssh-copy-id alice@server1            # 公開鍵を、サーバーの authorized_keys に追加する
ssh alice@server1                    # 鍵でログインする
```

- 公開鍵を、サーバー側のユーザーの `~/.ssh/authorized_keys` に 1 行ずつ書きます。**秘密鍵を渡してはいけません**。
- `StrictModes yes`(既定)のとき、パーミッションが広いと、sshd は公開鍵認証を拒否します。

| 対象 | 目安のパーミッション |
|---|---|
| ホームディレクトリ | グループとその他が書き込めない(755 以下) |
| `~/.ssh` | 700 |
| `~/.ssh/authorized_keys` | 600(または 644 まで。グループとその他が書き込めない) |

- 鍵の行の前に、条件を付けられます。例: `from="192.168.1.0/24" ssh-ed25519 AAAA… alice`(接続元の制限)、`command="/usr/bin/backup"`(実行するコマンドの固定)。

### 5. 守りを固める手順

1. `PermitRootLogin no`(または `prohibit-password`)にし、通常のユーザーでログインして `sudo` を使う。
2. 鍵でのログインを確かめてから、`PasswordAuthentication no` にする。
3. `AllowUsers` や `AllowGroups` で、ログインできるユーザーを限る。
4. 必要なら `Port` を変え、ファイアウォールで接続元を限る(2.12.1)。
5. `fail2ban` で、失敗を繰り返す接続元を自動で止める(2.12.4)。
6. `sshd -t` で確かめてから、`reload` する。

## 2.12.3 OpenVPN の設定と管理 (重要度2)

### 1. VPN と OpenVPN

- **VPN**(Virtual Private Network)は、インターネットのような公衆のネットワークの上に、暗号化した専用の通り道(トンネル)を作る仕組みです。
- **OpenVPN** は、TLS で暗号化し、証明書や鍵で認証する、オープンソースの VPN です。UDP の 1194 番を既定で使います(TCP も選べます)。
- 使い方は 2 つあります。

| 形 | つなぐもの | 例 |
|---|---|---|
| リモートアクセス | 個人の端末と、拠点の LAN | 自宅の PC から社内につなぐ |
| サイト間(拠点間) | 拠点の LAN どうし | 本社と支社を、常時つなぐ |

```text
remote access
  [home PC] ==== tunnel ==== [OpenVPN server] ---- [office LAN]

site-to-site
  [HQ LAN] --- [OpenVPN server] ==== tunnel ==== [OpenVPN client] --- [branch LAN]
```

- 1 対 1 だけをつなぐ点と点(point-to-point)の方式で、事前に共有した鍵(`secret`)を使うやり方もあります。ただし OpenVPN 2.6 で非推奨になりました。新しく作るときは、証明書を使います(2.6 からは、証明書のフィンガープリントを書く `peer-fingerprint` も使えます)。

### 2. 仮想のインターフェースと認証

| `dev` | 運ぶもの | 使いどころ |
|---|---|---|
| `tun` | IP のパケット(ルーティング) | 拠点間のルーティング、リモートアクセス(よく使う) |
| `tap` | イーサネットのフレーム(ブリッジ) | 両側を 1 つの LAN のようにつなぐ |

- 証明書を使う方式では、**CA**(認証局)が、サーバーとクライアントの証明書に署名します。証明書の作成には、**easy-rsa** という道具をよく使います。

| ファイル | 内容 | どちらに置くか |
|---|---|---|
| `ca.crt` | CA の証明書。相手の証明書が正しいかを確かめる | 両方 |
| `server.crt`、`server.key` | サーバーの証明書と秘密鍵 | サーバー |
| `client1.crt`、`client1.key` | クライアントの証明書と秘密鍵 | クライアント |
| `dh.pem` | 鍵交換のパラメーター(Diffie-Hellman) | サーバー |
| `ta.key`(`tls-auth`、`tls-crypt`) | 制御のパケットを守る共有の鍵 | 両方 |

CA の秘密鍵は、サーバーに置かず、別の安全な場所に保管します。

### 3. 設定ファイルと起動

設定ファイルは `/etc/openvpn/` に置きます(拡張子は `.conf`)。Red Hat 系(EPEL のパッケージ)と最近の Debian 系のパッケージでは、`/etc/openvpn/server/` と `/etc/openvpn/client/` に分けます【要確認: パッケージの版ごとに違う】。

サーバーの設定の例です。

```
port 1194
proto udp
dev tun
ca ca.crt
cert server.crt
key server.key
dh dh.pem
server 10.8.0.0 255.255.255.0
push "route 192.168.1.0 255.255.255.0"
keepalive 10 120
persist-key
persist-tun
```

クライアントの設定の例です。

```
client
dev tun
proto udp
remote vpn.example.com 1194
ca ca.crt
cert client1.crt
key client1.key
remote-cert-tls server
```

| 設定 | 意味 |
|---|---|
| `server 10.8.0.0 255.255.255.0` | サーバーになり、クライアントに配る VPN 内のアドレスの範囲 |
| `push "route …"` | クライアントに、この宛先は VPN へ送るという経路を配る |
| `client` | クライアントとして動く |
| `remote ホスト 1194` | つなぐ先のサーバー |
| `keepalive 10 120` | 10 秒ごとに生存を確かめ、120 秒返事がなければ切れたとみなす |

| コマンド | 意味 |
|---|---|
| `openvpn --config client.conf`(または `openvpn client.conf`) | 設定ファイルを指定して、前面で起動する |
| `systemctl start openvpn-server@server` | `/etc/openvpn/server/server.conf` を読むサービス【要確認】 |
| `systemctl start openvpn-client@client` | `/etc/openvpn/client/client.conf` を読むサービス【要確認】 |
| `systemctl start openvpn@server` | 古い形のサービス。`/etc/openvpn/server.conf` を読む【要確認】 |
| `ip addr show tun0` | トンネルのインターフェースを確かめる |

- サーバーを経由して LAN にも届かせるときは、IP フォワーディングを有効にし(2.12.1)、ファイアウォールで UDP 1194 を許可します。
- サイト間では、サーバー側の設定に、クライアントの背後の LAN の経路を教える `route` と `client-config-dir` の `iroute` を書きます。

## 2.12.4 セキュリティ業務 (重要度3)

### 1. セキュリティ情報を集める

脆弱性(攻撃に使われうる弱点)の情報は、**公的な機関**、**ソフトウェアの提供元**、**ディストリビューション**から集めます。

| 発信元 | 種類 | 内容 |
|---|---|---|
| CERT/CC | 米国の調整センター | 脆弱性や事故の情報 |
| CIAC | 米国エネルギー省の組織が出していた情報。今は活動していません【要確認: 後継の組織】 | 注意喚起(過去) |
| Bugtraq | メーリングリスト。今は配信が止まっています【要確認】 | 脆弱性の議論と報告(過去) |
| JPCERT/CC | 日本のコンピューターセキュリティインシデントの調整センター | 注意喚起、事故の対応の調整 |
| JVN(Japan Vulnerability Notes) | JPCERT/CC と IPA が運営する、日本の脆弱性情報のポータル | 国内外の製品の脆弱性と対策 |
| ディストリビューション | Red Hat の RHSA、Ubuntu の USN、Debian の DSA | 自分が使う版の修正 |

- 脆弱性には **CVE** の番号が付きます。ディストリビューションの情報から、自分が使う版への影響と、修正済みの版を確かめます。
- 通知を受け取る手段を決めておきます(メーリングリスト、RSS)。

### 2. パッチを当てる

| | Debian 系 | Red Hat 系 |
|---|---|---|
| 一覧を取り直す | `apt update` | (`dnf` が自動で取る) |
| 更新する | `apt upgrade` | `dnf update` |
| セキュリティ修正だけ | `unattended-upgrades`(自動) | `dnf update --security`(修正に必要な最小の版にとどめるなら `dnf upgrade-minimal --security`) |
| 自動の更新 | `unattended-upgrades` | `dnf-automatic` |

- 当てる前に、検証の環境で試し、戻す方法を決めておきます。
- カーネルや共有ライブラリの更新は、再起動(またはサービスの再起動)してから効きます。

### 3. ポートスキャンの道具

| 道具 | 用途 |
|---|---|
| `nmap` | ホストのポートとサービスを調べる |
| `nc`(netcat、`ncat`) | 1 つのポートへの接続の確認、簡単な通信の試験 |

```bash
nmap -sS 192.168.1.10          # SYN スキャン(接続を完了させない。root が必要)
nmap -sT 192.168.1.10          # 接続を完了させる TCP スキャン
nmap -sU 192.168.1.10          # UDP スキャン
nmap -p 1-1024 192.168.1.10    # ポートの範囲
nmap -sV 192.168.1.10          # サービスの版
nmap -O 192.168.1.10           # OS の推定
nmap -sn 192.168.1.0/24        # 生きているホストを調べるだけ(ポートは調べない)
```

```bash
nc -z -v 192.168.1.10 22       # 22 番に接続できるか(データは送らない)
nc -l 9999                     # 9999 番で待ち受ける
nc 192.168.1.10 9999           # 9999 番につなぐ
nc -u -z 192.168.1.10 53       # UDP
```

- `nc -z` はデータを送らずに接続だけを試します。接続できれば終了ステータスが 0 です。
- `ncat` は nmap の仲間で、`--ssl` で TLS も使えます。
- 自分が管理していないホストのスキャンは、攻撃とみなされることがあります。許可を得たホストだけを調べます。

### 4. 侵入の検知と対策

**IDS**(Intrusion Detection System、侵入検知システム)は、不正なアクセスの兆候を見つけて知らせる仕組みです。IDS は**検知して知らせる**もので、自分では止めません(止めるものは IPS です)。

| 種類 | 見るもの | 道具の例 |
|---|---|---|
| ネットワーク型 | ネットワークを流れるパケット | `snort` |
| ホスト型 | ホストのログやファイルの変化 | OSSEC、AIDE など |

- **snort** は、ネットワーク型の IDS です。パケットの内容を、規則(シグネチャ)と照らして、攻撃の疑いを知らせます。
- **fail2ban** は、ログ(例: `/var/log/auth.log`、`/var/log/secure`)を監視し、認証の失敗が続いた接続元を、ファイアウォールで一定時間ブロックします。

```text
[log]            認証の失敗が続く
  |
  |  fail2ban reads the log
  v
[fail2ban]       findtime の間に maxretry 回を超えたかを数える
  |
  |  over the limit
  v
[firewall rule]  接続元を bantime の間ブロックする
```

| 設定 | 意味 |
|---|---|
| `bantime` | ブロックする時間 |
| `findtime` | 失敗を数える期間 |
| `maxretry` | ブロックするまでの失敗の回数 |

- 設定は `/etc/fail2ban/jail.local` や `jail.d/` に書きます。`jail.conf` は直接変えません(更新で上書きされるため)。
- `fail2ban-client status sshd` で、ブロックしている接続元を確かめます。

### 5. 脆弱性と設定の検査

| 道具 | 見るもの |
|---|---|
| **OpenVAS** | ネットワークの上から、ホストやサービスの**既知の脆弱性**を検査する脆弱性スキャナー(いまは Greenbone の GVM の一部) |
| **OpenSCAP** | ホストの**設定が、決まった基準に合っているか**を検査する(SCAP の仕組み) |

- OpenSCAP は、`oscap` コマンドで、基準(プロファイル)に対する設定を検査し、報告書を作ります。基準の中身は、`scap-security-guide` のパッケージで入ります。

```bash
oscap info /usr/share/xml/scap/ssg/content/ssg-almalinux9-ds.xml    # 内容の確認【要確認: ファイル名はディストリビューションごと】
oscap xccdf eval --profile <プロファイルの ID> --results result.xml --report report.html <データストリームのファイル>
```

- どの道具も、**自分が管理するホストだけ**を対象にします。検査の結果は、優先順位を付けて対策し、再度検査して確かめます。
