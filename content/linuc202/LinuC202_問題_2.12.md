# LinuC202 問題 2.12 システムのセキュリティ

対象: LinuC レベル2 202試験 / 全29問 / すべてオリジナル問題
対応テキスト: `LinuC202_2.12_システムのセキュリティ.md`
解答・解説は末尾。

## 問題

### 2.12.1 iptables や firewalld によるパケットフィルタリング

**問1** `LinuC202-2.12-001` あるサーバーの filter テーブルの INPUT チェインに、次の 2 つの規則が上から順に入っている。ほかの規則はなく、INPUT のポリシーは DROP である。送信元 203.0.113.5 からの、22/tcp への新しい接続はどうなるか。

```
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s 203.0.113.0/24 -j DROP
```

- A. 2 行目のほうが条件が具体的なので、捨てられる
- B. 1 行目に最初に一致するので、受け付けられる
- C. 2 つの規則が衝突するので、規則の追加時にエラーになる
- D. 両方の規則に一致するので、ポリシーに従って捨てられる

**問2** `LinuC202-2.12-002` リモートから SSH でつないでいるサーバーで、INPUT チェインに規則が 1 つも入っていない状態から、`iptables -P INPUT DROP` だけを実行した。ESTABLISHED の通信を通す規則はない。つないでいる SSH の接続はどうなるか。

- A. 既存の接続は、そのまま使い続けられる
- B. すぐに切断され、接続が終了したことが画面に表示される
- C. 送信が止まり、新しい接続だけが拒否される
- D. 戻りのパケットも捨てられ、応答がなくなって固まる

**問3** `LinuC202-2.12-003` INPUT のポリシーが DROP で、INPUT に許可の規則が数本入っているサーバーで、`iptables -F` を実行した。そのあとの INPUT チェインの状態として正しいものはどれか。

- A. 規則とポリシーが両方とも消え、すべての通信が通る
- B. ポリシーだけが ACCEPT に戻り、規則は残る
- C. 規則は消えるが、ポリシーは DROP のままで、すべての受信が捨てられる
- D. `-F` は filter テーブルには効かず、何も変わらない

**問4** `LinuC202-2.12-004` Linux ルーターで、内側の LAN 192.168.1.0/24 からのパケットを、外側のインターフェース eth0 のアドレスに送信元を書き換えて外へ出したい。eth0 のアドレスは動的に変わる。IP フォワーディングと FORWARD の許可は済んでいる。正しいコマンドはどれか。

- A. `iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE`
- B. `iptables -t nat -A PREROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE`
- C. `iptables -A FORWARD -s 192.168.1.0/24 -o eth0 -j MASQUERADE`
- D. `iptables -t nat -A INPUT -s 192.168.1.0/24 -i eth0 -j MASQUERADE`

**問5** `LinuC202-2.12-005` 現在の IPv4 の iptables の規則を、`iptables-restore` に渡せる形式で、標準出力に書き出すコマンドを答えよ(sudo とオプションは不要)。

**問6** `LinuC202-2.12-006` Linux を IPv4 のルーターにして、eth1 側の LAN から eth0 側のネットワークへ、パケットを転送したい。FORWARD チェインのポリシーは DROP である。必要なことを**2つ**選べ。

- A. `/etc/services` に、転送するポートを書く
- B. `/proc/sys/net/ipv4/ip_forward` の値を 1 にする(`sysctl -w net.ipv4.ip_forward=1`)
- C. INPUT チェインに、すべてを許可する規則を足す
- D. FORWARD チェインに、eth1 から eth0 へ通す規則を足す

**問7** `LinuC202-2.12-007` firewalld が動いている AlmaLinux で、`firewall-cmd --permanent --zone=public --add-service=http` を実行した。そのほかの操作はしていない。この直後の状態として正しいものはどれか。

- A. public ゾーンで http がすぐに許可され、再起動後も許可される
- B. public ゾーンで http がすぐに許可されるが、再起動すると消える
- C. 永続の設定には書かれたが、`firewall-cmd --reload` まで、実行中の設定は変わらない
- D. 実行中の設定にも永続の設定にも書かれず、コマンドは何もしない

**問8** `LinuC202-2.12-008` SSH で接続中の Ubuntu 24.04 サーバーで、受信は既定のとおり拒否のまま `ufw enable` を実行する。有効にしたあとも、新しい SSH(22/tcp)の接続ができるように、有効にする前に実行すべきコマンドはどれか。

- A. `ufw allow 22/tcp`
- B. `ufw deny 22/tcp`
- C. `ufw default allow outgoing`
- D. `ufw status verbose`

**問9** `LinuC202-2.12-009` 同じホストの 80/tcp 宛の通信を、そのホストで動いている 8080/tcp のアプリへ回したい。nat テーブルの PREROUTING に入れる規則のターゲットとして、正しいものはどれか。

- A. `-j DNAT --to-destination 192.168.1.10:80`(192.168.1.10 は別のホスト)
- B. `-j MASQUERADE`
- C. `-j LOG --log-prefix web`
- D. `-j REDIRECT --to-ports 8080`

### 2.12.2 OpenSSH サーバーの設定と管理

**問10** `LinuC202-2.12-010` sshd で、root は認証の方式にかかわらず、一切ログインさせたくない。ほかのユーザーのログインには影響させない。`/etc/ssh/sshd_config` に書く行として、正しいものはどれか。

- A. `PasswordAuthentication no`
- B. `PermitRootLogin prohibit-password`
- C. `PermitRootLogin no`
- D. `PermitRootLogin forced-commands-only`

**問11** `LinuC202-2.12-011` すべてのユーザーについて、パスワードでの SSH ログインを禁止し、公開鍵認証だけを許したい。`/etc/ssh/sshd_config` の設定として正しい組み合わせはどれか。

- A. `PasswordAuthentication no` と `PubkeyAuthentication yes`
- B. `PasswordAuthentication yes` と `PubkeyAuthentication no`
- C. `PasswordAuthentication no` と `PubkeyAuthentication no`
- D. `PermitRootLogin no` と `AllowUsers *`

**問12** `LinuC202-2.12-012` `/etc/ssh/sshd_config` に `AllowUsers alice bob` と書き、sshd を再読み込みした。`DenyUsers`、`AllowGroups`、`DenyGroups` と `Match` は書いていない。ユーザー carol が、正しいパスワードで SSH でログインしようとした(パスワード認証は許可されている)。結果はどうなるか。

- A. `AllowUsers` は alice と bob の追加の許可にすぎないので、ログインできる
- B. `AllowUsers` に載っていないので、ログインできない
- C. ログインできるが、root の権限には上がれない
- D. alice か bob の許可があるときだけ、ログインできる

**問13** `LinuC202-2.12-013` `/etc/ssh/sshd_config` を編集した。sshd を再起動する前に、設定ファイルの文法や値に誤りがないかだけを確かめるコマンドを、オプションまで答えよ(sudo は不要)。

**問14** `LinuC202-2.12-014` サーバーを作り直したあと、クライアントから ssh でつなぐと `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` と表示された。最も考えられる原因はどれか。

- A. `~/.ssh/authorized_keys` に、クライアントの公開鍵が登録されていない
- B. `PermitRootLogin` が `no` になっている
- C. パスワードの有効期限が切れている
- D. サーバーが示したホスト鍵が、クライアントの `~/.ssh/known_hosts` に記録されたものと違う

**問15** `LinuC202-2.12-015` `StrictModes yes`(既定)の sshd で、公開鍵認証に失敗する原因になるものを**2つ**選べ。

- A. ユーザーのホームディレクトリが、所有者以外の全員に書き込める状態(777)になっている
- B. `~/.ssh` のパーミッションが 700 になっている
- C. `~/.ssh/authorized_keys` が、グループとその他のユーザーにも書き込める状態(666)になっている
- D. `~/.ssh/authorized_keys` のパーミッションが 600 になっている

**問16** `LinuC202-2.12-016` サーバーを複製したあとで、複製先の `/etc/ssh/ssh_host_*_key` を消した。ホスト鍵のうち存在しない種類を、`/etc/ssh` にまとめて作り直すコマンドを、オプションまで答えよ(root で実行する)。

**問17** `LinuC202-2.12-017` クライアントで作った公開鍵を、サーバーのユーザーの `~/.ssh/authorized_keys` に追加する、標準的なコマンドはどれか。

- A. `ssh-keygen -A`
- B. `ssh-copy-id alice@server1`
- C. `ssh-add alice@server1`
- D. `scp ~/.ssh/id_ed25519 alice@server1:.ssh/authorized_keys`

### 2.12.3 OpenVPN の設定と管理

**問18** `LinuC202-2.12-018` OpenVPN のサーバーの設定ファイル(`.conf`)を置く、一般的な場所はどれか。

- A. `/etc/ssh/`
- B. `/etc/vpn/`
- C. `/etc/openvpn/`
- D. `/var/lib/openvpn/`

**問19** `LinuC202-2.12-019` 本社と支社の 2 つの拠点の LAN どうしを、OpenVPN で、イーサネットのフレームのまま、1 つの LAN のようにブリッジでつなぎたい。仮想のネットワークインターフェースの種類を指定する `dev` の値として、正しいものはどれか。

- A. `dev tap`
- B. `dev tun`
- C. `dev eth0`
- D. `dev lo`

**問20** `LinuC202-2.12-020` 証明書を使う OpenVPN のクライアントの設定に `ca ca.crt` と書いてある。この `ca.crt` の役割として、正しいものはどれか。

- A. クライアント自身の秘密鍵である
- B. VPN の通信そのものを暗号化する、共有の鍵である
- C. 鍵交換のパラメーター(Diffie-Hellman)である
- D. 証明書に署名した認証局の証明書で、相手の証明書が正しいかを確かめるのに使う

**問21** `LinuC202-2.12-021` 設定ファイル `client.conf` を指定して、OpenVPN のクライアントを前面で起動するコマンドを、オプションまで答えよ(sudo は不要)。

### 2.12.4 セキュリティ業務

**問22** `LinuC202-2.12-022` nmap で、接続を最後まで完了させずに SYN パケットを送るやり方(SYN スキャン)で、TCP ポートを調べるオプションはどれか。

- A. `-sU`
- B. `-sS`
- C. `-sn`
- D. `-O`

**問23** `LinuC202-2.12-023` 自分が管理しているホスト 192.168.1.10 の、1 番から 1024 番までの TCP ポートを、nmap で調べるコマンドを答えよ(スキャン方式の指定と sudo は不要)。

**問24** `LinuC202-2.12-024` netcat(`nc`)で、ホスト 192.168.1.10 の 22/tcp に、データを送らずに接続できるかだけを確かめたい。正しいコマンドはどれか。

- A. `nc -l 192.168.1.10 22`
- B. `nc -u 192.168.1.10 22`
- C. `nc -z 192.168.1.10 22`
- D. `nc -e 192.168.1.10 22`

**問25** `LinuC202-2.12-025` SSH のログインの失敗が、一定の期間に何回も続いた接続元を、ログから見つけて、ファイアウォールの規則で一定時間ブロックする、自動の仕組みはどれか。

- A. fail2ban
- B. nmap
- C. OpenSCAP
- D. snort

**問26** `LinuC202-2.12-026` ネットワークを流れるパケットの内容を、規則(シグネチャ)と照らして、攻撃の疑いを検知して知らせる、ネットワーク型の IDS はどれか。

- A. fail2ban
- B. OpenSCAP
- C. firewalld
- D. snort

**問27** `LinuC202-2.12-027` ホストの設定が、決まったセキュリティ基準のプロファイルに合っているかを、SCAP の仕組みで検査し、報告書を作る道具はどれか。

- A. OpenVAS
- B. OpenSCAP
- C. fail2ban
- D. netcat

**問28** `LinuC202-2.12-028` 日本の組織が運営している、脆弱性の情報や注意喚起の発信元を**2つ**選べ。

- A. CIAC
- B. JPCERT/CC
- C. JVN
- D. Bugtraq

**問29** `LinuC202-2.12-029` AlmaLinux 9 で、セキュリティのアドバイザリが付いたパッケージだけを更新する dnf のコマンドを、オプションまで答えよ(`-y` と sudo は不要)。

## 解答・解説

### 問1 `LinuC202-2.12-001`

**正解**: B

**テキスト**: 2. 規則は上から順に評価される

iptables の規則は、上から順に調べられ、**最初に一致した規則**で動作が決まります。この問題では、1 行目の `--dport 22` の ACCEPT が、送信元に関係なく一致します。2 行目まで進みません。

- A. 「条件が具体的な規則が優先される」という決まりはありません。順番だけで決まります。
- C. 同じような規則を足してもエラーにはなりません。
- D. 2 行目は評価されないので、ポリシーも使われません。

### 問2 `LinuC202-2.12-002`

**正解**: D

**テキスト**: 2. 規則は上から順に評価される

ポリシーは、どの規則にも一致しなかったパケットに適用されます。INPUT に規則がないので、すべての受信が DROP になります。SSH の戻りのパケットも INPUT を通るので、捨てられ、応答がなくなって画面が固まります。`ESTABLISHED,RELATED` を通す規則と、SSH を通す規則を先に入れてから、ポリシーを変えます。

- A. 既存の接続の戻りも INPUT で捨てられます。
- B. DROP は黙って捨てるので、切断の通知は出ません。
- C. 新しい接続だけでなく、既存の接続の受信も止まります。

### 問3 `LinuC202-2.12-003`

**正解**: C

**テキスト**: 2. 規則は上から順に評価される

`iptables -F` は、チェインの規則を消しますが、**ポリシーは変えません**。ポリシーが DROP のまま規則が消えるので、すべての受信が捨てられます。リモートで作業するときは、先に `iptables -P INPUT ACCEPT` に戻してから消します。

- A. ポリシーは消えません。
- B. ポリシーは自動で ACCEPT には戻りません。
- D. `-F` は指定したテーブル(省略時は filter)のすべての規則を消します。

### 問4 `LinuC202-2.12-004`

**正解**: A

**テキスト**: 4. NAT とポートのリダイレクト

`MASQUERADE` は、`nat` テーブルの `POSTROUTING` チェインで使い、送信元を、出ていくインターフェースのアドレスに書き換えます。アドレスが動的に変わっても、そのときのアドレスが使われます。出ていくインターフェースは `-o eth0`、書き換える送信元は `-s 192.168.1.0/24` で指定します。

- B. PREROUTING では MASQUERADE は使えません。また PREROUTING では出ていくインターフェース(`-o`)は決まっていません。
- C. MASQUERADE は nat テーブルのターゲットで、filter の FORWARD には書けません。
- D. MASQUERADE は、nat テーブルの POSTROUTING チェインでだけ使えます。nat テーブルにも INPUT チェインはありますが、MASQUERADE は書けません。

### 問5 `LinuC202-2.12-005`

**正解**: `iptables-save`、`iptables-nft-save`、`iptables-legacy-save`

**テキスト**: 5. 規則の保存と読み込み

`iptables-save` で、規則を `iptables-restore` で読み込める形式にして書き出します。`iptables-save > rules.v4` で保存し、`iptables-restore < rules.v4` で戻します。IPv6 は `ip6tables-save` と `ip6tables-restore` です。`iptables -S` は規則をコマンドの形で表示するもので、`iptables-restore` には渡せません。iptables には、nftables の仕組みで動く版(`iptables-nft-save`)と、昔からの版(`iptables-legacy-save`)があります。多くのディストリビューションでは、`iptables-save` がどちらかを指しています。

### 問6 `LinuC202-2.12-006`

**正解**: B、D

**テキスト**: 3. 転送と IP フォワーディング

IPv4 の転送には、2 つが要ります。IPv6 の転送は別の設定(`/proc/sys/net/ipv6/` の下)と `ip6tables` で行うので、この問題の IPv4 には関係しません。

① カーネルの IP フォワーディングを有効にします(`/proc/sys/net/ipv4/ip_forward` が 1。`sysctl -w net.ipv4.ip_forward=1`)。

② FORWARD チェインのポリシーが DROP なので、転送を通す規則を足します(eth1 から eth0 へ。戻りの通信は ESTABLISHED の規則でも通します)。

- A. `/etc/services` は、サービス名とポート番号の対応表です。転送の許可には関係しません。
- C. INPUT は、このホスト宛のパケットの規則です。転送されるパケットは FORWARD を通ります。

### 問7 `LinuC202-2.12-007`

**正解**: C

**テキスト**: 6. firewalld

`--permanent` を付けた変更は、永続の設定にだけ書かれます。実行中の設定には、`firewall-cmd --reload` で永続の設定を読み込むまで、反映されません。反対に、`--permanent` を付けない変更は、すぐ効きますが、`--reload` や再起動で消えます。

- A. すぐには許可されません。`--reload` が必要です。
- B. `--permanent` なので、すぐには効かず、再起動後に残ります。説明が逆です。
- D. 永続の設定には書かれます。

### 問8 `LinuC202-2.12-008`

**正解**: A

**テキスト**: 7. ufw

ufw は、既定で受信を拒否します。`ufw allow 22/tcp`(または `ufw allow ssh`)で SSH を許可してから有効にします。許可がないと、有効にしたあとの新しい SSH の接続ができなくなります。

- B. `deny` は拒否する規則で、接続ができなくなります。
- C. 送信の既定です。受信の SSH の接続には関係しません。
- D. 状態を表示するだけで、何も許可しません。

### 問9 `LinuC202-2.12-009`

**正解**: D

**テキスト**: 4. NAT とポートのリダイレクト

`REDIRECT` は、宛先のポートを、**同じホスト**の別のポートに書き換えます。`iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080` と書きます。

- A. `DNAT` は宛先を書き換えますが、この選択肢は別のホスト 192.168.1.10 の 80 番へ渡すもので、同じホストの 8080 番ではありません。
- B. `MASQUERADE` は送信元を書き換えるもので、POSTROUTING で使います。
- C. `LOG` は記録するだけで、宛先は変わりません。

### 問10 `LinuC202-2.12-010`

**正解**: C

**テキスト**: 2. 主な設定項目

`PermitRootLogin no` は、root のログインを、認証の方式を問わず許可しません。

- A. `PasswordAuthentication no` は、全ユーザーのパスワード認証を止めます。root だけの設定ではなく、root は鍵ではログインできます。
- B. `prohibit-password` は、パスワード以外(公開鍵など)での root のログインを許します。
- D. `forced-commands-only` は、鍵に決めたコマンドを実行する場合だけ許します。完全には禁止しません。

### 問11 `LinuC202-2.12-011`

**正解**: A

**テキスト**: 2. 主な設定項目

`PasswordAuthentication no` でパスワード認証を止め、`PubkeyAuthentication yes` で公開鍵認証を使います。反映する前に、鍵でログインできることを別の端末で確かめます。

PAM を使う環境(`UsePAM yes`)では、`KbdInteractiveAuthentication` が `yes` だと、キーボード対話の認証でパスワードを入れられることがあります。`KbdInteractiveAuthentication no` も確かめます。また、`/etc/ssh/sshd_config.d/` の中の設定が先に読まれると、そちらが使われます(同じ項目は最初に読んだ値が使われます)。実際に効いている値は `sshd -T` で確かめます。

- B. 逆で、パスワードだけを許します。
- C. どちらの方式も使えなくなり、誰もログインできません。
- D. `PermitRootLogin` は root のログインの設定、`AllowUsers *` は全員を許す書き方です。パスワード認証は止まりません。

### 問12 `LinuC202-2.12-012`

**正解**: B

**テキスト**: 2. 主な設定項目

`AllowUsers` を書くと、列挙したユーザーだけがログインできます。それ以外のユーザーは、パスワードが正しくても拒否されます。

- A. 「追加の許可」ではなく、列挙以外を拒否する設定です。
- C. ログインそのものが拒否されます。
- D. alice や bob の許可のようなものはありません。carol 自身が列挙されているかで決まります。

### 問13 `LinuC202-2.12-013`

**正解**: `sshd -t`、`/usr/sbin/sshd -t`、`sshd -T`、`/usr/sbin/sshd -T`、`sshd -t -f /etc/ssh/sshd_config`、`/usr/sbin/sshd -t -f /etc/ssh/sshd_config`

**テキスト**: 1. sshd と設定ファイル

`sshd -t`(test mode)は、設定ファイルの文法と値を確かめるだけで、サーバーを動かしません。何も表示されなければ問題ありません。`sshd -T` は、確かめたうえで、有効な設定をすべて表示します。`-f` で、確かめる設定ファイルを指定できます(省略すると `/etc/ssh/sshd_config`)。通常は root(`sudo`)で実行します。

### 問14 `LinuC202-2.12-014`

**正解**: D

**テキスト**: 3. ホスト鍵

クライアントは、初めての接続でホスト鍵を `~/.ssh/known_hosts` に記録し、次からは、サーバーが示す鍵と比べます。サーバーを作り直すとホスト鍵が変わり、記録と食い違うので、この警告が出ます。作り直した覚えがなければ、なりすましの疑いもあります。古い記録は `ssh-keygen -R ホスト名` で消します。

- A. 公開鍵が未登録の場合は、`Permission denied (publickey)` のような認証の失敗になります。
- B. `PermitRootLogin` は、認証の段階の拒否で、ホスト鍵の警告ではありません。
- C. パスワードの期限は、認証のあとの話です。ホスト鍵の警告とは関係しません。

### 問15 `LinuC202-2.12-015`

**正解**: A、C

**テキスト**: 4. ユーザーの公開鍵認証

`StrictModes yes` のとき、sshd は、ユーザーのホームディレクトリ、`~/.ssh`、`~/.ssh/authorized_keys` が、所有者以外に書き込める状態だと、公開鍵認証を拒否します。ホームが 777、`authorized_keys` が 666 だと、どちらも該当します。

- B. `~/.ssh` は 700 が目安で、問題ありません。
- D. `authorized_keys` は 600 が目安で、問題ありません。

### 問16 `LinuC202-2.12-016`

**正解**: `ssh-keygen -A`、`sudo ssh-keygen -A`、`/usr/bin/ssh-keygen -A`

**テキスト**: 3. ホスト鍵

`ssh-keygen -A` は、`/etc/ssh/ssh_host_rsa_key`、`ssh_host_ecdsa_key`、`ssh_host_ed25519_key` など、存在しない種類のホスト鍵を、まとめて作ります。サーバーを複製したときに、複製元と同じホスト鍵が残るのを避けるためにも使います。

### 問17 `LinuC202-2.12-017`

**正解**: B

**テキスト**: 4. ユーザーの公開鍵認証

`ssh-copy-id alice@server1` は、クライアントの公開鍵を、サーバーの `~/.ssh/authorized_keys` に追加します。

- A. `ssh-keygen -A` は、サーバーのホスト鍵を作ります。ユーザーの公開鍵の登録ではありません。
- C. `ssh-add` は、秘密鍵を ssh-agent に登録するコマンドです。
- D. `id_ed25519` は秘密鍵です。秘密鍵をサーバーに送ってはいけません。また、`authorized_keys` を上書きしてしまいます。

### 問18 `LinuC202-2.12-018`

**正解**: C

**テキスト**: 3. 設定ファイルと起動

OpenVPN の設定ファイルは `/etc/openvpn/` に置きます。パッケージによっては、その下の `server/` や `client/` に分けます。

- A. `/etc/ssh/` は OpenSSH の設定です。
- B. `/etc/vpn/` という標準の場所はありません。
- D. `/var/lib/` は、変わっていくデータの場所です。設定は置きません。

### 問19 `LinuC202-2.12-019`

**正解**: A

**テキスト**: 2. 仮想のインターフェースと認証

`dev tap` は、イーサネットのフレームを運ぶ仮想インターフェースで、ブリッジで LAN をつなぐときに使います。

- B. `dev tun` は IP のパケットを運び、ルーティングで拠点をつなぎます。イーサネットのフレームは運びません。
- C. `eth0` は物理のインターフェースの名前で、OpenVPN の `dev` の種類ではありません。
- D. `lo` はループバックで、`dev` の種類ではありません。

### 問20 `LinuC202-2.12-020`

**正解**: D

**テキスト**: 3. 設定ファイルと起動

`ca` は、CA(認証局)の証明書です。サーバーとクライアントの証明書は、同じ CA が署名しています。この証明書で、相手の証明書が、信頼する CA の署名したものかを確かめます。

- A. クライアントの秘密鍵は `key` で指定します。
- B. 証明書を使う方式では、通信を暗号化する鍵は、接続ごとに TLS でやりとりして決めます。共有の鍵の `ta.key`(`tls-auth`、`tls-crypt`)は制御のパケットを守るもので、`ca.crt` とは別です。
- C. Diffie-Hellman のパラメーターは `dh` で指定します。

### 問21 `LinuC202-2.12-021`

**正解**: `openvpn --config client.conf`、`openvpn client.conf`

**テキスト**: 3. 設定ファイルと起動

`openvpn --config 設定ファイル` で、前面で起動します。tun などの仮想のインターフェースを作るので、通常は root(`sudo`)で実行します。サービスとしては、パッケージによって `openvpn-client@client` や `openvpn@client` の形で起動します。

### 問22 `LinuC202-2.12-022`

**正解**: B

**テキスト**: 3. ポートスキャンの道具

`-sS` は SYN スキャンです。SYN を送り、SYN/ACK が返れば開いているとみなし、接続を完了させません(root が必要です)。

- A. `-sU` は UDP のスキャンです。
- C. `-sn` は、ホストが生きているかだけを調べ、ポートは調べません。
- D. `-O` は OS の推定です。

### 問23 `LinuC202-2.12-023`

**正解**: `nmap -p 1-1024 192.168.1.10`、`nmap -p1-1024 192.168.1.10`、`nmap 192.168.1.10 -p 1-1024`、`nmap 192.168.1.10 -p1-1024`、`nmap -p-1024 192.168.1.10`、`nmap -p -1024 192.168.1.10`

**テキスト**: 3. ポートスキャンの道具

`-p` で、調べるポートを指定します。範囲は `1-1024` のように書きます。範囲の始まりを省くと 1 になるので、`-p-1024` でも同じです。自分が管理しているホストだけを対象にします。

### 問24 `LinuC202-2.12-024`

**正解**: C

**テキスト**: 3. ポートスキャンの道具

`nc -z` は、データを送らず、接続できるかだけを調べます(zero-I/O mode)。接続できれば終了ステータスが 0 です。`-v` を付けると結果を表示します。

- A. `-l` は待ち受け(listen)です。接続を試すのではありません。
- B. `-u` は UDP です。22/tcp の確認にはなりません。
- D. `-e` は、接続したあとにコマンドを実行する、危険な使い方です。多くの版では無効です。

### 問25 `LinuC202-2.12-025`

**正解**: A

**テキスト**: 4. 侵入の検知と対策

fail2ban は、ログ(`/var/log/auth.log` や `/var/log/secure`)を監視し、`findtime` の間に `maxretry` 回を超えて失敗した接続元を、ファイアウォールの規則で `bantime` の間ブロックします。

- B. nmap は、ポートを調べる道具です。
- C. OpenSCAP は、設定が基準に合うかを検査する道具です。
- D. snort は、パケットを見て検知する IDS です。ログの失敗の回数で自動でブロックする道具ではありません。

### 問26 `LinuC202-2.12-026`

**正解**: D

**テキスト**: 4. 侵入の検知と対策

snort は、パケットの内容を規則と照らす、ネットワーク型の IDS です。

- A. fail2ban は、ログを見て接続元をブロックする仕組みです。
- B. OpenSCAP は、設定を検査する道具で、通信は見ません。
- C. firewalld は、パケットフィルタリングの管理の仕組みです。攻撃の疑いを検知する IDS ではありません。

### 問27 `LinuC202-2.12-027`

**正解**: B

**テキスト**: 5. 脆弱性と設定の検査

OpenSCAP は、SCAP の内容(プロファイル)に対して、ホストの設定が合っているかを検査し、報告書を作ります(`oscap`)。

- A. OpenVAS は、既知の脆弱性を調べる脆弱性スキャナーです。設定の基準への適合は、OpenSCAP の役割です。
- C. fail2ban は、失敗を繰り返す接続元をブロックします。
- D. netcat は、接続の試験に使う道具です。

### 問28 `LinuC202-2.12-028`

**正解**: B、C

**テキスト**: 1. セキュリティ情報を集める

JPCERT/CC は、日本のコンピューターセキュリティインシデントの調整センターで、注意喚起を発信します。JVN(Japan Vulnerability Notes)は、JPCERT/CC と IPA が運営する、日本の脆弱性情報のポータルです。

- A. CIAC は、米国の組織です。
- D. Bugtraq は、脆弱性を議論するメーリングリストで、日本の組織が運営するものではありません。

### 問29 `LinuC202-2.12-029`

**正解**: `dnf update --security`、`dnf upgrade --security`、`dnf --security update`、`dnf --security upgrade`、`dnf upgrade-minimal --security`、`yum update --security`、`yum upgrade --security`

**テキスト**: 2. パッチを当てる

`--security` を付けると、セキュリティのアドバイザリが付いたパッケージだけを更新します。そのパッケージは、最新の版まで上がります。修正に必要な最小の版にとどめるときは、`dnf upgrade-minimal --security` を使います。適用の前に、検証の環境で試し、戻す方法を決めておきます。
