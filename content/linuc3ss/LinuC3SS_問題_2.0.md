# LinuC3SS 問題 2.0 システム保護と監査

対象: LinuC レベル3 3SS試験 Version 1.0 / 全45問 / すべてオリジナル問題
対応テキスト: `LinuC3SS_2.0_システム保護と監査.md`
解答・解説は末尾。

## 問題

### 2.1 カーネルセキュリティとシステムリソース保護

**問1** `LinuC3SS-2.0-001` Linux で、スタックと共有ライブラリの配置に加えて、ヒープ(brk で確保する領域)の配置もランダムにする ASLR の設定値は、`kernel.randomize_va_space` のどれか。

- A. 0
- B. 1
- C. 2
- D. 3

**問2** `LinuC3SS-2.0-002` `kernel.perf_event_paranoid` は 1 に設定してある。この環境で、一般ユーザーには `/proc/kallsyms` のカーネルのアドレスを隠し、CAP_SYSLOG を持つ root には見せたい。`kernel.kptr_restrict` の設定として適切なものはどれか。

- A. `kernel.kptr_restrict = 0`
- B. `kernel.kptr_restrict = 1`
- C. `kernel.kptr_restrict = 2`
- D. `kernel.randomize_va_space = 1`

**問3** `LinuC3SS-2.0-003` `kernel.yama.ptrace_scope = 1` の環境で、CAP_SYS_PTRACE を持たない一般ユーザー alice が、別のログインで動かしている自分のプロセス(自分の子孫ではない)に、`gdb -p` でアタッチした。対象のプロセスは `prctl(PR_SET_PTRACER, …)` で ptrace を許可していない。結果はどれか。

- A. 同じユーザーのプロセスなので、成功する
- B. 値が 1 のときは root 以外すべて成功し、制限は 2 以上で始まる
- C. 値 1 は何も制限せず、0 と同じ動きになる
- D. 子孫のプロセスではないので、「Operation not permitted」で失敗する

**問4** `LinuC3SS-2.0-004` `kernel.sysrq` の説明として正しいものはどれか。

- A. 値はビットマスクで、機能ごとの数を足した値で、許可する機能を選べる
- B. 0 を指定すると、すべての機能が有効になる
- C. 1 を指定すると、すべての機能が無効になる
- D. 値は 0 か 1 のどちらかで、中間の値はない

**問5** `LinuC3SS-2.0-005` `/etc/security/limits.conf` に次の 2 行だけを書いた。alice でログインし直した直後の `ulimit -n` の値と、alice が自分で引き上げられる上限の組み合わせはどれか。

```
alice  soft  nofile  1024
alice  hard  nofile  4096
```

- A. 初期値は 4096 で、自分で引き上げることはできない
- B. 初期値は 1024 で、自分で 4096 まで引き上げられる
- C. 初期値は 1024 で、自分でいくらでも引き上げられる
- D. 初期値は 4096 で、自分で 1024 まで引き上げられる

**問6** `LinuC3SS-2.0-006` `/etc/security/limits.conf` に `nginx - nofile 65535` と書いたが、`systemctl start nginx` で起動した nginx の開けるファイル数は増えなかった。ユニットに `PAMName=` の設定はない。原因と対処として正しいものはどれか。

- A. nofile には soft しか指定できず、`-` は使えない
- B. limits.conf は、サーバー全体を再起動しないと一度も読まれない
- C. デーモンのユーザーは limits.conf に書けない
- D. systemd が起動するサービスには pam_limits が働かないので、ユニットの `LimitNOFILE=` で設定する

**問7** `LinuC3SS-2.0-007` 動いているコンテナのプロセス(PID 4321)と同じネットワーク名前空間に入り、そのインターフェースを `ip addr` で確認したい。正しいコマンドはどれか。

- A. `nsenter -t 4321 -n ip addr`
- B. `unshare -t 4321 -n ip addr`
- C. `chroot /proc/4321/root ip addr`
- D. `cgexec -g net:4321 ip addr`

**問8** `LinuC3SS-2.0-008` Ubuntu 24.04(cgroup v2 だけを使う。`cgroup-tools` パッケージを入れた)で、root が `cgcreate -g memory:/demo` で cgroup を作った。続けて `cgset -r memory.limit_in_bytes=100M demo` を実行するとエラーになった。原因として正しいものはどれか。

- A. cgset は、cgcreate の後に再起動しないと使えない
- B. Ubuntu では、memory コントローラーは使えない
- C. `memory.limit_in_bytes` は v1 の名前で、v2 ではメモリの上限を `memory.max` に書く
- D. メモリの上限は、`100M` のような単位を付けず、バイトの数字だけで書く

**問9** `LinuC3SS-2.0-009` cgroup v2 で、cgroup の中のプロセスが使えるメモリの上限を書くファイルの名前を答えよ(ディレクトリは不要)。

**問10** `LinuC3SS-2.0-010` すでに動いている PID 2000 のプロセスを、既存の cgroup `demo`(cpu と memory のコントローラー)に移したい。正しいコマンドはどれか。

- A. `cgexec -g cpu,memory:demo 2000`
- B. `cgclassify -g cpu,memory:demo 2000`
- C. `cgcreate -g cpu,memory:demo 2000`
- D. `cgdelete -g cpu,memory:demo 2000`

**問11** `LinuC3SS-2.0-011` `chroot /srv/jail /bin/bash` で起動したシェルについて、正しい説明はどれか。

- A. ルートの見え方を変えるだけで、root 権限のプロセスは抜け出せる場合があり、セキュリティの境界としては弱い
- B. ネットワークも `/srv/jail` の中に分離される
- C. プロセスの一覧も分離され、`/srv/jail` の中のものだけが見える
- D. メモリの使用量の上限も、自動で掛かる

**問12** `LinuC3SS-2.0-012` ルーターではない(転送をしない)サーバーで、ICMP リダイレクトまわりの対策として適切な設定を**2つ**選べ。

- A. `net.ipv4.icmp_echo_ignore_all = 1`
- B. `net.ipv4.conf.all.accept_redirects = 0`
- C. `kernel.randomize_va_space = 0`
- D. `net.ipv4.conf.all.send_redirects = 0`

**問13** `LinuC3SS-2.0-013` ファイアウォールの規則は変えていないのに、サーバーが IPv4 の ping にだけ応答しなくなった。sysctl の項目で、最初に確かめるものはどれか。

- A. `kernel.kptr_restrict`
- B. `kernel.sysrq`
- C. `net.ipv4.icmp_echo_ignore_all`
- D. `net.ipv4.ip_forward`

### 2.2 パケットフィルタリングの実装

**問14** `LinuC3SS-2.0-014` 何も設定していない nftables のホストで、次のコマンドを実行すると「No such file or directory」で失敗した。原因として最も適切なものはどれか。

```
nft add rule inet filter input tcp dport 22 accept
```

- A. inet ファミリーの filter テーブルと、その中の input チェーンを、先に作っていない
- B. `tcp dport` は、nft では書けない
- C. 規則は、ip ファミリーのテーブルにしか書けない
- D. 規則は、`nft -f` でしか足せない

**問15** `LinuC3SS-2.0-015` IPv4 と IPv6 の両方に、1 つのテーブルの 1 つの規則で効かせたい。テーブルのファミリーはどれか。

- A. ip
- B. ip6
- C. inet
- D. arp

**問16** `LinuC3SS-2.0-016` ブリッジを通るイーサネットのフレームを、IP 以外のものも含めて L2 の視点で扱いたい。テーブルのファミリーはどれか。

- A. ip
- B. inet
- C. arp
- D. bridge

**問17** `LinuC3SS-2.0-017` SSH でログイン中のサーバーで、次の 2 つのコマンドだけを実行した。ほかの規則はない。直後に SSH の画面が反応しなくなった。理由はどれか。

```
nft add table inet filter
nft add chain inet filter input '{ type filter hook input priority 0 ; policy drop ; }'
```

- A. nft が、sshd を停止するため
- B. policy drop の input チェーンに許可する規則がなく、続いている SSH の通信も落ちるため
- C. inet ファミリーは、SSH の通信を扱えないため
- D. priority 0 は最も遅い値で、規則が評価されないため

**問18** `LinuC3SS-2.0-018` input チェーンに足す、`ct state` で始まる 1 行の規則を答えよ。確立済み(established)と関連(related)の接続に属するパケットを許可するものとする(`nft add rule` などの前置きは不要)。

**問19** `LinuC3SS-2.0-019` 内側のネットワークから外へ出る通信の送信元を、出口のインターフェースの IP に変換(マスカレード)する規則を置くチェーンの定義として、適切なものはどれか。

- A. `type nat hook postrouting`
- B. `type nat hook input`
- C. `type filter hook forward`
- D. `type route hook prerouting`

**問20** `LinuC3SS-2.0-020` `type route` のチェーンについて、正しい説明はどれか。

- A. 宛先アドレスを変換する(dstnat)
- B. 規則に合ったパケットを、別のホストへ転送する
- C. 送信元アドレスを変換する(srcnat)
- D. output フックで、パケットのマークなどを変えた後に、経路を決め直す

**問21** `LinuC3SS-2.0-021` 同じ hook(input)に、priority が -150 のチェーンと、priority が 0 のチェーンがある。評価の順番として正しいものはどれか。

- A. priority が 0 のチェーンが先に評価される
- B. priority が -150 のチェーンが先に評価される
- C. チェーンを作った順に評価される
- D. 2 つは同時に、並行して評価される

**問22** `LinuC3SS-2.0-022` TCP の 80 番と 443 番だけを許可する規則として、正しいものはどれか。

- A. `tcp dport 80 443 accept`
- B. `tcp dport 80-443 accept`
- C. `tcp dport { 80, 443 } accept`
- D. `tcp dport (80|443) accept`

**問23** `LinuC3SS-2.0-023` Ubuntu 24.04 で、`/etc/nftables.conf` に規則を書いて保存し、`nft -f /etc/nftables.conf` で反映した。nftables.service は無効のままである。再起動した後も、自動で規則を読み込ませるために必要な操作はどれか。

- A. `systemctl enable nftables`
- B. `nft save`
- C. `iptables-save`
- D. `nft flush ruleset`

**問24** `LinuC3SS-2.0-024` `/etc/nftables.conf` の規則を、カーネルに反映せずに、文法だけ確かめる nft のコマンドを答えよ(sudo は不要)。

### 2.3 暗号化ファイルシステム

**問25** `LinuC3SS-2.0-025` LUKS1 と LUKS2 の違いとして、正しいものはどれか。

- A. LUKS2 のキースロットは 8 個で、LUKS1 のほうが多い
- B. LUKS2 は、dm-crypt を使わずに暗号化する
- C. LUKS2 は、鍵導出に PBKDF2 しか使えない
- D. LUKS2 は argon2 系の鍵導出を使え、JSON 形式のメタデータを冗長なヘッダーで持つ

**問26** `LinuC3SS-2.0-026` `/dev/vdb1` を、LUKS で初期化する cryptsetup のコマンドを答えよ(オプションは付けない。sudo は不要)。

**問27** `LinuC3SS-2.0-027` データの入った `/dev/vdb1` に、確認で YES と入力して `cryptsetup luksFormat /dev/vdb1` を実行した。何が起きるか。

- A. 既存のデータが暗号化され、そのまま使える
- B. LUKS のヘッダーが書かれ、既存のデータは読めなくなる
- C. 既存のデータはそのまま読めて、新しく書くデータだけが暗号化される
- D. 何も起きず、`open` した後に暗号化が始まる

**問28** `LinuC3SS-2.0-028` `luksFormat` 済みの `/dev/vdb1` を、`/dev/mapper/secure` として使えるようにしたい。正しいコマンドはどれか。

- A. `cryptsetup luksFormat /dev/vdb1 secure`
- B. `mount /dev/vdb1 /dev/mapper/secure`
- C. `cryptsetup open /dev/vdb1 secure`
- D. `cryptsetup close /dev/vdb1 secure`

**問29** `LinuC3SS-2.0-029` `cryptsetup open /dev/vdb1 secure` で開いた後、ext4 のファイルシステムを作る対象として正しいものはどれか。

- A. `/dev/vdb1`
- B. `/dev/mapper/secure`
- C. `/dev/vdb`
- D. `/etc/crypttab`

**問30** `LinuC3SS-2.0-030` `/etc/crypttab` に次の行がある。3 列目の `none` が表すものはどれか。

```
secure  UUID=0a1b2c3d-1111-2222-3333-444455556666  none  luks
```

- A. 鍵ファイルのパスを指定せず、起動時にパスフレーズを入力させる
- B. 暗号化をしない
- C. ファイルシステムを作らない
- D. 使うキースロットの番号が 0 である

**問31** `LinuC3SS-2.0-031` `/etc/crypttab` の 1 列目が `secure` である。起動時に `/data` へマウントしたい。`/etc/fstab` の 1 列目(デバイス)に書くものとして、正しいものはどれか。

- A. `/dev/vdb1`
- B. `luksUUID` で表示した、LUKS の UUID
- C. `/etc/crypttab`
- D. `/dev/mapper/secure`

**問32** `LinuC3SS-2.0-032` パスフレーズが 1 つだけの LUKS デバイス `/dev/vdb1` に、予備のパスフレーズを足したい。正しいコマンドはどれか。

- A. `cryptsetup luksFormat /dev/vdb1`
- B. `cryptsetup luksDump /dev/vdb1`
- C. `cryptsetup luksAddKey /dev/vdb1`
- D. `cryptsetup luksUUID /dev/vdb1`

**問33** `LinuC3SS-2.0-033` `/dev/vdb1` の LUKS のヘッダーを読んで、LUKS の版とキースロットの使用状況を表示する cryptsetup のコマンドを答えよ(sudo は不要)。

**問34** `LinuC3SS-2.0-034` LUKS のヘッダーが上書きされて壊れると、すべてのパスフレーズを知っていても、データを復号できなくなる。この事態に備える対策として、適切なものはどれか。

- A. `luksHeaderBackup` でヘッダーをファイルに保存し、盗まれない安全な別の場所に保管する
- B. `luksAddKey` を繰り返して、キースロットをすべて使い切る
- C. 同じ `/dev/vdb1` に、`mkfs` で 2 つ目のファイルシステムを作る
- D. `discard` のオプションを crypttab に付ける

**問35** `LinuC3SS-2.0-035` fscrypt について、正しい説明を**2つ**選べ。

- A. ディレクトリ単位で暗号化でき、ユーザーごと、ディレクトリごとに別の鍵を使える
- B. ブロックデバイス全体を `cryptsetup` で暗号化し、ファイルシステムの種類を問わない
- C. ファイル名と内容は暗号化されるが、ファイルのサイズなどのメタデータは暗号化されない
- D. すでにファイルが入っているディレクトリを、そのまま暗号化できる

### 2.4 Linux システムのセキュリティ監査

**問36** `LinuC3SS-2.0-036` `/etc/audit/auditd.conf` に `max_log_file = 8`、`max_log_file_action = ROTATE`、`num_logs = 5` がある。audit.log が 8 MB に達したとき、auditd の動きとして正しいものはどれか。

- A. auditd が停止し、監査ログの書き込みをやめる
- B. audit.log を audit.log.1 にずらして新しい audit.log を作り、古いものは num_logs の数までに保つ
- C. 何もせず、audit.log に書き続ける
- D. 古い行を消して、audit.log の先頭から上書きする

**問37** `LinuC3SS-2.0-037` auditd.conf の `log_file` の既定の値である、監査ログのファイルの絶対パスを答えよ。

**問38** `LinuC3SS-2.0-038` `auditctl -w /etc/hosts -p wa -k hosts_change` を実行したが、再起動すると規則が消えていた。再起動後も残すための、最も適切な方法はどれか。

- A. auditd.conf に同じ内容を書く
- B. `/etc/audit/audit.rules` を直接編集し、rules.d は変えない
- C. `auditctl -e 2` を実行する
- D. `/etc/audit/rules.d/` の `.rules` ファイルに同じ行を書き、`augenrules --load` を実行する

**問39** `LinuC3SS-2.0-039` `/etc/audit/rules.d/` の `*.rules` を結合して `/etc/audit/audit.rules` を作り、そのままカーネルに読み込むコマンドを答えよ(sudo は不要)。

**問40** `LinuC3SS-2.0-040` 監査の規則 `-w /etc/shadow -p wa -k shadow_change` の `-p wa` は、何を記録する指定か。

- A. 読み取り(r)と実行(x)
- B. 書き込み(w)と追記(append)
- C. 書き込み(w)と属性の変更(a)
- D. 警告(warn)と許可(allow)

**問41** `LinuC3SS-2.0-041` 次の規則 `-w /etc/shadow -p wa -k shadow_change` が読み込まれている。この規則が付けたキーで、記録されたイベントだけを探すコマンドはどれか。

- A. `ausearch -k shadow_change`
- B. `ausearch -f shadow_change`
- C. `auditctl -k shadow_change`
- D. `aureport --summary shadow_change`

**問42** `LinuC3SS-2.0-042` 昨日から今日までの、ログインの失敗の一覧を出したい。適切なコマンドはどれか。

- A. `aureport -f --failed -ts yesterday`
- B. `aureport -l --failed -ts yesterday`
- C. `auditctl -s -ts yesterday`
- D. `auditctl -l -ts yesterday`

**問43** `LinuC3SS-2.0-043` alice が `sudo vi /etc/passwd` で root として編集した。監査ログで、最初にログインした人(alice)を示すフィールドはどれか。

- A. `uid`
- B. `euid`
- C. `comm`
- D. `auid`

**問44** `LinuC3SS-2.0-044` 規則ファイルの最後に `-e 2` を書いた。この効果として正しいものはどれか。

- A. 監査のイベントを 2 倍の詳しさで記録する
- B. auditd を 2 つ起動する
- C. 規則が変更できない状態になり、変えるには再起動が必要になる
- D. 規則が 2 回に 1 回だけ記録される

**問45** `LinuC3SS-2.0-045` 監査の規則と設定について、正しい説明を**2つ**選べ。

- A. `-S` は、監視するファイルのパスを指定する
- B. `-w` は、ファイルやディレクトリへのアクセスを監視する
- C. augenrules は、rules.d の `*.rules` をファイル名の順に結合する
- D. auditctl で追加した規則は、再起動後も残る

## 解答・解説

### 問1 `LinuC3SS-2.0-001`

**正解**: C

ASLR は、実行のたびにメモリ上の配置をランダムにして、攻撃者が住所を決め打ちしにくくする仕組みです。`kernel.randomize_va_space` が 2 のとき、スタックと共有ライブラリに加えて、ヒープもランダムになります。多くの配布版の既定の値です。

- A. 0 はランダム化をしません。
- B. 1 はスタック、共有ライブラリの配置、VDSO をランダム化しますが、ヒープは含みません。
- D. 値は 0、1、2 だけで、3 はありません。

### 問2 `LinuC3SS-2.0-002`

**正解**: B

`kernel.kptr_restrict` が 1 のとき、CAP_SYSLOG を持たないユーザーにはカーネルのアドレスが 0 で表示され、root には見えます。

- A. 0 は、`perf_event_paranoid` が 1 以下だと、一般ユーザーにもアドレスを見せます(2 以上なら CAP_SYSLOG の判定になります)。この環境では隠せません。
- C. 2 は root にも隠します。root に見せたい条件に合いません。
- D. `kernel.randomize_va_space` は ASLR の設定で、`/proc/kallsyms` の見え方とは別です。

### 問3 `LinuC3SS-2.0-003`

**正解**: D

`kernel.yama.ptrace_scope = 1` は、自分の子孫のプロセスにだけ ptrace(アタッチ)を許します。別にログインして動かしているプロセスは、同じユーザーのものでも子孫ではないので、失敗します。

- A. 値が 0 なら成功しますが、1 は同じユーザーでも子孫以外を許しません。
- B. 値が 1 は制限のある設定です。制限は 1 から始まります。
- C. 1 は 0 と違い、子孫以外へのアタッチを止めます。

### 問4 `LinuC3SS-2.0-004`

**正解**: A

`kernel.sysrq` は、機能ごとの値を足し合わせたビットマスクです。たとえば 16(sync)、32(読み取り専用で再マウント)、128(再起動)を足した 176 は、その 3 つだけを許す値です。

- B. 0 はすべて無効です。
- C. 1 はすべて有効です。
- D. 0 と 1 のほかに、2 以上のビットマスクを指定できます。

### 問5 `LinuC3SS-2.0-005`

**正解**: B

`soft` は今の上限で、ログイン直後の値になります。`hard` は、本人が引き上げられる最大の値です。そのため、初期値は 1024 で、本人は 4096 まで引き上げられます。確かめるときは、ログインし直して `ulimit -n` と `ulimit -Hn` を実行します。

- A. 初期値になるのは soft の 1024 です。hard の 4096 までは自分で引き上げられます。
- C. hard を超えては引き上げられません。
- D. 初期値と、引き上げられる方向が逆です。

### 問6 `LinuC3SS-2.0-006`

**正解**: D

limits.conf は、ログインのときに PAM の pam_limits が読んで適用します。systemd が `systemctl start` で起動するサービスは、この PAM の流れを通りません。サービスの上限は、ユニットの `LimitNOFILE=` で決めます。

- A. `-` は、soft と hard の両方に同じ値を入れる指定で、nofile にも使えます。
- B. limits.conf は、ログインのたびに読まれます。サーバー全体の再起動は要りません。
- C. デーモンのユーザー名も、domain に書けます。ただし、systemd のサービスには効きません。

### 問7 `LinuC3SS-2.0-007`

**正解**: A

`nsenter -t 4321 -n` は、PID 4321 のネットワーク名前空間に入って、続くコマンドを実行します。

- B. `unshare` は、新しい名前空間を作るコマンドです。`-t` で既存のプロセスを指定する使い方はありません。
- C. `chroot` は、ファイルシステムのルートを変えるだけで、ネットワーク名前空間には入りません。`ip` はホストのインターフェースを表示します。
- D. `cgexec` は、cgroup に入れてコマンドを実行するもので、資源の制限の仕組みです。ネットワーク名前空間には入れません。

### 問8 `LinuC3SS-2.0-008`

**正解**: C

cgroup v2 の環境では、v1 のパラメーターのファイルがありません。メモリの上限は `memory.max` に書きます。`cgset -r memory.max=100M demo` が、v2 での書き方です。

- A. cgcreate の後に、再起動は要りません。
- B. Ubuntu でも、cgroup v2 の memory コントローラーは使えます。
- D. `memory.max` には、`100M` のような単位を付けて書けます。エラーの原因は、v1 のファイルの名前です。

### 問9 `LinuC3SS-2.0-009`

**正解**: `memory.max`

cgroup v2 では、cgroup のディレクトリの中の `memory.max` に、メモリの上限(バイトか、`100M` のような単位付きの値)を書きます。v1 の `memory.limit_in_bytes` は、v2 では使えません。

### 問10 `LinuC3SS-2.0-010`

**正解**: B

`cgclassify` は、動いているプロセスを、指定した cgroup に移します。

- A. `cgexec` は、cgroup に入れて新しくコマンドを実行します。`2000` は、実行するコマンドの名前として扱われます。
- C. `cgcreate` は、cgroup を作るコマンドです。
- D. `cgdelete` は、cgroup を消すコマンドです。

### 問11 `LinuC3SS-2.0-011`

**正解**: A

`chroot` は、プロセスが見るルートディレクトリを変えるだけです。root 権限のプロセスは抜け出せる場合があるので、セキュリティの境界としては弱いです。コンテナのランタイムは、名前空間と cgroup を組み合わせ、新しいマウント名前空間の中で `pivot_root` を使ってルートを入れ替えます。

- B. ネットワークは分かれません。ネットワークの分離には、ネットワーク名前空間を使います。
- C. プロセスの一覧は分かれません。分けるには PID 名前空間が必要です。
- D. 資源の上限は掛かりません。cgroup を使います。

### 問12 `LinuC3SS-2.0-012`

**正解**: B、D

ICMP リダイレクトは、「その宛先なら別のルーターが近い」という通知です。偽の通知で経路を書き換えられないように、ルーターではないサーバーでは `accept_redirects = 0` にします。同じく、リダイレクトを送る必要もないので、`send_redirects = 0` にします。

- A. `icmp_echo_ignore_all = 1` は、ping にいっさい応答しない設定です。リダイレクトの対策ではありません。
- C. `kernel.randomize_va_space = 0` は、ASLR を切る設定で、守りを弱めます。

なお、転送をしないホストでは、`all` とインターフェースの値の**どちらか**が 1 なら、その機能は有効になります。そのため、`net.ipv4.conf.default.accept_redirects = 0` も設定し、動いているインターフェース(`net.ipv4.conf.eth0.accept_redirects` など)が 0 になっていることを確かめます。`send_redirects` も同じです。`send_redirects` は、転送するときだけ働く設定なので、転送しないサーバーでは念のための設定です。

### 問13 `LinuC3SS-2.0-013`

**正解**: C

`net.ipv4.icmp_echo_ignore_all` が 1 だと、ping(エコー要求)にいっさい答えません。`sysctl net.ipv4.icmp_echo_ignore_all` で確かめます。

- A. `kernel.kptr_restrict` は、カーネルのアドレスの見え方の設定です。
- B. `kernel.sysrq` は、SysRq の許可の設定です。
- D. `net.ipv4.ip_forward` は、パケットを転送するかどうかの設定です。自分宛ての ping の応答には関係しません。

### 問14 `LinuC3SS-2.0-014`

**正解**: A

nftables の規則は、table、chain、rule の入れ子です。規則を足す前に、テーブルとチェーンが要ります。何も設定していないと、`inet filter` というテーブルがないので、「No such file or directory」になります。

- B. `tcp dport` は、nft の標準の書き方です。
- C. 規則は、ip、ip6、inet などのどのファミリーのテーブルにも書けます。
- D. `nft add rule` のように、コマンドで 1 つずつ足せます。

### 問15 `LinuC3SS-2.0-015`

**正解**: C

`inet` ファミリーは、IPv4 と IPv6 の両方を 1 つのテーブルで扱います。

- A. `ip` は、IPv4 だけです。
- B. `ip6` は、IPv6 だけです。
- D. `arp` は、ARP のパケットだけを扱います。

### 問16 `LinuC3SS-2.0-016`

**正解**: D

`bridge` ファミリーは、ブリッジを通るイーサネットのフレームを扱います。

- A. `ip` は、IPv4 のパケットだけです。
- B. `inet` は、IPv4 と IPv6 だけで、IP 以外のフレームは扱えません。
- C. `arp` は、ARP のパケットだけを扱い、ほかのフレームは扱いません。

### 問17 `LinuC3SS-2.0-017`

**正解**: B

`policy drop` は、どの規則にも合わなかったパケットを捨てます。許可する規則が 1 つもないと、続いている SSH の通信のパケットも捨てられます。`ct state established,related accept` と、SSH を許す規則を、先に書く必要があります。

- A. nft は、sshd のプロセスを止めません。
- C. `inet` ファミリーは、IPv4 と IPv6 の TCP も扱えます。
- D. priority は、同じ hook のチェーンの順番を決める値で、0 は filter の標準の値です。規則の評価がされないわけではありません。

### 問18 `LinuC3SS-2.0-018`

**正解**: `ct state established,related accept`、`ct state related,established accept`、`ct state { established, related } accept`、`ct state { related, established } accept`、`ct state {established,related} accept`、`ct state {related,established} accept`、`ct state { established,related } accept`、`ct state { related,established } accept`、`ct state {established, related} accept`、`ct state {related, established} accept`

`ct state` は、コネクション追跡の状態です。確立済みと関連の接続を許可する規則を、`policy drop` のチェーンの先頭近くに置くと、自分が始めた通信の返事が通ります。

### 問19 `LinuC3SS-2.0-019`

**正解**: A

送信元を書き換える(srcnat、マスカレード)のは、送り出す直前の postrouting フックで、型は nat です。

- B. nat 型は input フックにも置けますが、自分宛ての通信が対象です。外へ出る通信の送信元を変える場所ではありません。
- C. filter 型は、通す、止めるの判断をする型で、アドレスの変換はできません。
- D. route 型は、output フックに置く型で、prerouting には置けません。また、アドレスの変換もしません。

### 問20 `LinuC3SS-2.0-020`

**正解**: D

`type route` は、output フックで、パケットのマークなどを変えた後に、経路(ルーティング)を決め直すための型です。

- A. 宛先アドレスの変換は、`type nat` の prerouting で行います。
- B. 別のホストへ転送するのは、ルーティングと forward の仕組みです。route 型の役目ではありません。
- C. 送信元アドレスの変換は、`type nat` の postrouting で行います。

### 問21 `LinuC3SS-2.0-021`

**正解**: B

priority は、小さい数字が先に評価されます。-150 は 0 より先です。

- A. 大きい数字が先ではありません。
- C. チェーンを作った順は、評価の順番を決めません。
- D. 同じ hook のチェーンは、priority の順に 1 つずつ評価されます。

### 問22 `LinuC3SS-2.0-022`

**正解**: C

`{ 80, 443 }` は、複数の値を並べたセット(集合)の書き方です。

- A. 空白で並べる書き方は、文法として正しくありません。
- B. `80-443` は範囲で、81 から 442 のポートも含みます。
- D. `(80|443)` のような正規表現の書き方は、nft にありません。

### 問23 `LinuC3SS-2.0-023`

**正解**: A

Ubuntu 24.04 では、`nftables.service` が起動時に `/etc/nftables.conf` を読み込みます。サービスが無効のままだと、再起動で規則が消えます。`systemctl enable nftables` で有効にします。

- B. `nft save` というサブコマンドは、ありません。
- C. `iptables-save` は、iptables の規則を出力するコマンドで、nftables のファイルを自動で読み込ませる設定ではありません。
- D. `nft flush ruleset` は、すべての規則を消します。

### 問24 `LinuC3SS-2.0-024`

**正解**: `nft -c -f /etc/nftables.conf`、`nft --check -f /etc/nftables.conf`、`nft -cf /etc/nftables.conf`、`nft --check --file /etc/nftables.conf`、`nft -c --file /etc/nftables.conf`、`nft -f /etc/nftables.conf -c`、`nft -f /etc/nftables.conf --check`、`nft --file /etc/nftables.conf --check`、`nft --file /etc/nftables.conf -c`

`-c`(`--check`)は、反映せずに、文法と内容を確かめます。`policy drop` を入れる設定を反映する前に、確かめておきます。

### 問25 `LinuC3SS-2.0-025`

**正解**: D

LUKS2 は、鍵導出に argon2 系を使えます。メモリを多く使うので、総当たりに強くなります。ヘッダーは JSON 形式のメタデータで、冗長に保存されます。

- A. キースロットは、LUKS1 が 8 個、LUKS2 が最大 32 個です。逆になっています。
- B. LUKS2 も、dm-crypt を使います。
- C. LUKS1 が PBKDF2 だけで、LUKS2 は argon2 系も使えます。

### 問26 `LinuC3SS-2.0-026`

**正解**: `cryptsetup luksFormat /dev/vdb1`

`luksFormat` は、LUKS のヘッダーを書いて初期化します。中のデータは使えなくなります。

### 問27 `LinuC3SS-2.0-027`

**正解**: B

`luksFormat` は、デバイスの先頭に LUKS のヘッダーを書いて、初期化します。元のデータは、読めなくなります。ただし、ヘッダーのほかのデータの領域は書き換えないので、元のデータがディスクの上から消えるわけではありません。データの入ったデバイスで実行する前に、必ず別の場所にバックアップします。

- A. 既存のデータを暗号化して残す機能は、`luksFormat` にありません。
- C. 既存のデータは、そのままでは読めなくなります。
- D. `luksFormat` の時点で、ヘッダーは書かれます。

### 問28 `LinuC3SS-2.0-028`

**正解**: C

`cryptsetup open デバイス 名前` で、パスフレーズを入れて開くと、`/dev/mapper/名前` ができます。dm-crypt が、その後ろで復号と暗号化をします。

- A. `luksFormat` は初期化するコマンドで、データを失います。2 つ目の引数は鍵ファイルとして扱われ、`/dev/mapper/secure` は作られません。
- B. `/dev/vdb1` は暗号化されたままのデバイスで、そのままではマウントできません。
- D. `close` は、開いているデバイスを閉じるコマンドで、引数も名前だけです。

### 問29 `LinuC3SS-2.0-029`

**正解**: B

ファイルシステムは、開いた後の `/dev/mapper/secure` に作ります。暗号化と復号は、dm-crypt が受け持ちます。

- A. `/dev/vdb1` に直接 `mkfs` を実行すると、LUKS のヘッダーを上書きして、データが読めなくなります。
- C. `/dev/vdb` は、ディスク全体です。パーティションの暗号化を壊します。
- D. `/etc/crypttab` は、設定ファイルです。

### 問30 `LinuC3SS-2.0-030`

**正解**: A

crypttab の 3 列目は、鍵ファイルのパスです。`none` は、鍵ファイルのパスを指定せず、起動時にパスフレーズを入力させる指定です。systemd では、`/etc/cryptsetup-keys.d/<名前>.key` があれば、それを自動で使います。

- B. crypttab に書いた行は、すべて暗号化したデバイスです。4 列目の `luks` は、LUKS の形式であることを指定するオプションです。
- C. ファイルシステムは、crypttab ではなく、`mkfs` と fstab の範囲です。
- D. キースロットの番号を指定する列ではありません。

### 問31 `LinuC3SS-2.0-031`

**正解**: D

crypttab の `secure` が開かれると、`/dev/mapper/secure` ができます。fstab には、この開いた後の名前を書きます。

- A. `/dev/vdb1` は暗号化されたままのデバイスで、ファイルシステムとしてマウントできません。
- B. LUKS の UUID は、暗号化されたデバイスの UUID です。中のファイルシステムの UUID とは違います。
- C. `/etc/crypttab` は設定ファイルで、デバイスではありません。

### 問32 `LinuC3SS-2.0-032`

**正解**: C

`luksAddKey` は、新しいキースロットに、パスフレーズ(キー)を追加します。管理者が交代したときや、紛失に備えるときに使います。

- A. `luksFormat` は、初期化してデータを失います。
- B. `luksDump` は、ヘッダーの情報を表示するだけです。
- D. `luksUUID` は、LUKS の UUID を表示します。

### 問33 `LinuC3SS-2.0-033`

**正解**: `cryptsetup luksDump /dev/vdb1`

`luksDump` は、ヘッダーの内容を表示します。LUKS の版、暗号の方式、どのキースロットが使われているかが分かります。

### 問34 `LinuC3SS-2.0-034`

**正解**: A

`cryptsetup luksHeaderBackup /dev/vdb1 --header-backup-file ファイル` で、ヘッダーを保存します。ヘッダーが壊れたときは `luksHeaderRestore` で戻せます。バックアップには、鍵の素になる情報が入っているので、盗まれないように保管します。

- B. キースロットを使い切っても、ヘッダーが壊れれば復号できません。
- C. ファイルシステムを作ると、データを壊します。
- D. `discard` は、SSD に不要な領域を知らせるオプションで、ヘッダーとは関係がありません。

### 問35 `LinuC3SS-2.0-035`

**正解**: A、C

fscrypt は、ファイルシステムの機能で、ディレクトリ単位で暗号化します。ユーザーごと、ディレクトリごとに別の鍵を使えます。ファイル名と内容は暗号化されますが、ファイルのサイズやディレクトリの構造などは見えます。

- B. これは LUKS(dm-crypt)の説明です。fscrypt は、ファイルシステムが対応している必要があります。
- D. 暗号化するディレクトリは、空でなければなりません。すでにあるデータは、暗号化したディレクトリにコピーして移します。

### 問36 `LinuC3SS-2.0-036`

**正解**: B

`max_log_file_action = ROTATE` のとき、`max_log_file`(MB)に達すると、`audit.log` を `audit.log.1` にずらして新しいログを作ります。古いものは `num_logs` の数までです。

- A. ログの書き込みをやめるのは、`SUSPEND` などの動作です。
- C. 何もしないのは、`IGNORE` の動作です。
- D. ログの先頭から上書きする動作は、ありません。

### 問37 `LinuC3SS-2.0-037`

**正解**: `/var/log/audit/audit.log`

`log_file` の既定の値です。`ausearch` と `aureport` も、既定ではこのファイルを読みます。

### 問38 `LinuC3SS-2.0-038`

**正解**: D

`auditctl` で足した規則は、再起動で消えます。`/etc/audit/rules.d/` の `.rules` に書いて、`augenrules --load` で読み込むと、保存されます。起動時にも、同じ規則が読み込まれます。

- A. auditd.conf は、auditd 自身の設定です。規則は書きません。
- B. `audit.rules` は、augenrules が rules.d から作るファイルです。直接編集しても、次に作り直されたときに上書きされます。
- C. `-e 2` は、規則を変更できない状態にするものです。規則を保存する機能は、ありません。

### 問39 `LinuC3SS-2.0-039`

**正解**: `augenrules --load`、`/usr/sbin/augenrules --load`、`/sbin/augenrules --load`

`augenrules` だけでは、ファイルを作るだけで読み込みません。`--load` を付けると、作ったあとにカーネルに読み込みます。

### 問40 `LinuC3SS-2.0-040`

**正解**: C

`-p` の `w` は書き込み、`a` は属性(権限や所有者)の変更です。`r` は読み取り、`x` は実行です。

- A. 読み取りと実行は、`-p rx` です。
- B. 追記は、書き込み(w)に含まれます。`-p` の文字に追記を表すものはありません。
- D. `-p` に、警告や許可を表す文字はありません。

### 問41 `LinuC3SS-2.0-041`

**正解**: A

`-k` で付けたキーで、`ausearch -k キー` と探すと、その規則の記録だけが出ます。

- B. `-f` は、ファイル名で探すオプションです。`shadow_change` というファイルはありません。
- C. `auditctl` は、規則を操作するコマンドで、記録を探しません。
- D. `aureport` は集計のコマンドで、検索の語は受け取りません。

### 問42 `LinuC3SS-2.0-042`

**正解**: B

`aureport -l` はログインの報告で、`--failed` で失敗だけに絞れます。`-ts yesterday` で、昨日からに絞ります。

- A. `-f` は、ファイルの報告です。
- C. `auditctl -s` は、監査の状態を表示します。ログの報告ではありません。
- D. `auditctl -l` は、読み込まれている規則の一覧です。

### 問43 `LinuC3SS-2.0-043`

**正解**: D

`auid` は、最初にログインしたときのユーザー ID で、`sudo` や `su` の後も変わりません。「元の人」は、`auid` で分かります。

- A. `uid` は、その時点のユーザー ID で、`sudo` の後は root(0)です。
- B. `euid` は、実効のユーザー ID で、同じく root です。
- C. `comm` は、コマンドの名前で、ユーザーではありません。

### 問44 `LinuC3SS-2.0-044`

**正解**: C

`-e 2` は、規則を変更できない状態(immutable)にします。侵入した人が規則を消すのを防げます。規則を変えるには、再起動が必要です。そのため、規則ファイルの最後に書きます。

- A. `-e` は、記録の詳しさではありません。
- B. `-e` は、auditd の数を決めません。
- D. 記録の間引きではありません。

### 問45 `LinuC3SS-2.0-045`

**正解**: B、C

`-w` は、ファイルやディレクトリへのアクセスを監視します。`augenrules` は、`rules.d` の `*.rules` をファイル名の順に結合します。

- A. `-S` は、システムコールを指定します。ファイルのパスを指定するのは、`-w` です。
- D. `auditctl` で足した規則は、再起動で消えます。残すには、`rules.d` に書きます。
