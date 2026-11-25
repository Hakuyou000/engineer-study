# LinuC 3SS テキスト 2.0 システム保護と監査

サーバーそのものを守る方法を学びます。カーネルの設定とリソースの制限、nftables によるパケットフィルタリング、ディスクの暗号化、auditd による監査の 4 つです。攻撃のやり方ではなく、守る設定と、効いているかを確かめる方法を中心に書きます。

## 2.1 カーネルセキュリティとシステムリソース保護 (重要度3)

出題範囲: ASLR、sysctl の設定、sysrq、limits.conf、名前空間(unshare、nsenter)、cgroup(cgcreate など)、chroot と pivot_root。

### 1. カーネルのパラメーター(sysctl)

**sysctl** は、動いているカーネルの設定を読み書きする仕組みです。値は `/proc/sys/` の下のファイルとして見えます。`kernel.randomize_va_space` は `/proc/sys/kernel/randomize_va_space` に対応します。

```bash
sysctl kernel.randomize_va_space             # 値を読む
sudo sysctl -w kernel.randomize_va_space=2   # 今だけ変える(再起動で戻る)
cat /proc/sys/kernel/randomize_va_space      # 同じ値を直接読む
```

再起動後も残すには、`/etc/sysctl.d/*.conf` に書きます。

```bash
echo 'kernel.kptr_restrict = 2' | sudo tee /etc/sysctl.d/90-hardening.conf
sudo sysctl --system      # /etc/sysctl.d/ などをすべて読み直す
```

- 設定ファイルは、`/etc/sysctl.d/`、`/run/sysctl.d/`、`/usr/lib/sysctl.d/` などから、ファイル名の順に読まれます。同じ項目は、後に読んだほうが勝ちます。
- 配布版が初めから入れている設定ファイルがあるので、自分の設定が上書きされていないかを `sysctl --system` の出力で確かめます。

### 2. ASLR と kernel.randomize_va_space

**ASLR**(Address Space Layout Randomization)は、プログラムを実行するたびに、メモリ上の配置(スタック、共有ライブラリ、ヒープなど)の住所をランダムにする仕組みです。攻撃者が「この住所にある」と決め打ちしにくくなります。

| `kernel.randomize_va_space` | 意味 |
|---|---|
| 0 | ランダム化しない |
| 1 | スタック、共有ライブラリの配置、VDSO をランダム化する |
| 2 | 1 に加えて、ヒープ(brk で確保する領域)もランダム化する。**既定の値** |

- 値は 0、1、2 の 3 つだけです。ふつうは 2 のまま使います。
- デバッグで一時的に 0 にすることはあっても、本番のサーバーで 0 のままにしません。

### 3. 情報を隠す設定

| 項目 | 値と意味 |
|---|---|
| `kernel.kptr_restrict` | カーネル内のアドレス(`/proc/kallsyms` など)の見せ方。0 は、`%pK` で表示するアドレスをハッシュした値で表示する(`/proc/kallsyms` は、`kernel.perf_event_paranoid` が 1 以下なら全員に、2 以上なら CAP_SYSLOG を持つユーザーにだけ実アドレスを見せる)。1 は、`%pK` のアドレスを CAP_SYSLOG を持たないユーザーには 0 で表示する(root には見せる)。2 は root にも隠す |
| `kernel.yama.ptrace_scope` | ptrace(別のプロセスにアタッチしてのぞく、デバッガーや strace の仕組み)の制限。0 は同じユーザーなら可。1 は子孫のプロセスだけ可(対象が `prctl(PR_SET_PTRACER, …)` で許したプロセスも可)。2 は管理者(CAP_SYS_PTRACE)だけ。3 は全面禁止(再起動まで戻せない) |

- アドレスが分かると、攻撃者はカーネルの弱点を狙いやすくなります。そのため、一般ユーザーに見せないようにします。
- `ptrace_scope=1` では、自分が起動した子プロセスにはアタッチできますが、別にログインして動かしている同じユーザーのプロセスにはできません。`gdb -p` や `strace -p` が「Operation not permitted」で失敗したら、まずこの値を疑います。
- 既定の値は配布版で違います。Ubuntu 24.04 は `kptr_restrict` が 1、`ptrace_scope` が 1 です。RHEL 9 系は `ptrace_scope` が 0 です【要確認: 配布版と版で変わる。`sysctl` で今の値を見て判断する】。

### 4. sysrq

**SysRq**(マジック SysRq キー)は、システムが固まったときに、カーネルに直接命令を送る仕組みです。`kernel.sysrq` はキーボードからの操作の許可の範囲を決める**ビットマスク**(機能ごとの数を足し合わせた値)です。

| 値 | 意味 |
|---|---|
| 0 | すべて無効 |
| 1 | すべて有効 |
| 2 以上 | 機能ごとの値の和。16 は sync(ディスクへの書き出し)、32 は読み取り専用で再マウント、128 は再起動と電源断、など |

- 例えば Ubuntu の既定の `176` は、128 + 32 + 16 で、再起動、読み取り専用での再マウント、sync だけを許す値です【要確認: 版で変わる】。
- `/proc/sysrq-trigger` に文字を書くと、キーボードがなくても使えます(root のみ)。`kernel.sysrq` の値は、キーボードからの操作だけを制限します。`/proc/sysrq-trigger` は、値が 0 でも root なら使えます。`echo b > /proc/sysrq-trigger` は、**その場で再起動します**。試すときは注意します。
- 物理的に触れる端末やコンソールから、第三者に再起動させたくない場合は、0 か必要最小限の値にします。

### 5. ICMP に関する設定

| 項目 | 意味と使いどころ |
|---|---|
| `net.ipv4.conf.all.accept_redirects` | ICMP リダイレクト(「この宛先ならあちらのルーターが近い」という通知)を受け入れるか。偽の通知で経路を書き換えられる恐れがあるので、ルーターでないホストでは 0 にする |
| `net.ipv4.conf.all.send_redirects` | 自分がリダイレクトを送るか。ルーターでないホストは 0 にする |
| `net.ipv4.icmp_echo_ignore_all` | 1 にすると、ping(エコー要求)にいっさい答えない |

- リダイレクトの項目は、`all` のほかに `default` と、インターフェースごとの値があります。`accept_redirects` も `send_redirects` も、ルーターでないホストでは、`all` とインターフェースのどちらかが 1 なら有効です。止めるには、`all`、`default`、使っているインターフェースのすべてを 0 にします。`sysctl net.ipv4.conf.eth0.accept_redirects` のように、実際のインターフェースの値も確かめます。IPv6 は `net.ipv6.conf.all.accept_redirects` です。
- `icmp_echo_ignore_all=1` は、ping に応えないだけで、サーバーを隠すことにはなりません。一方で、監視の疎通確認(ping)が失敗するようになります。「ping だけ急に通らない」という症状では、ファイアウォールのほかに、この値も確かめます。

### 6. リソースの制限(limits.conf)

`/etc/security/limits.conf` と `/etc/security/limits.d/*.conf` に、ユーザーやグループごとの上限を書きます。ログインのときに PAM の **pam_limits** が読み込んで適用します。

```text
# <domain>  <type>  <item>   <value>
alice       soft    nofile   1024
alice       hard    nofile   4096
@devs       hard    nproc    200
*           hard    core     0
```

| 列 | 意味 |
|---|---|
| domain | ユーザー名、`@グループ名`、`*`(全員) |
| type | `soft`(今の上限。本人が `hard` まで引き上げられる)、`hard`(本人が超えられない上限)、`-`(両方に同じ値) |
| item | `nofile`(開けるファイル数)、`nproc`(プロセス数)、`core`(コアダンプの大きさ)、`maxlogins`(同時ログイン数)、`memlock` など |

- 確かめるには、そのユーザーでログインし直して `ulimit -n`(soft)、`ulimit -Hn`(hard)を実行します。設定を変えても、**すでにログインしているセッションには反映されません**。
- **systemd が起動するサービスには、`limits.conf` は効きません**。PAM を通らないためです。サービスの上限は、ユニットファイルの `LimitNOFILE=` や `TasksMax=` で決めます。

```text
# /etc/systemd/system/app.service.d/limits.conf の例
[Service]
LimitNOFILE=65535
TasksMax=512
```

### 7. 名前空間(unshare、nsenter)

**名前空間**(namespace)は、プロセスから「見える範囲」を分ける、カーネルの仕組みです。コンテナの土台になっています。

| 種類 | 分けるもの |
|---|---|
| pid | プロセス番号 |
| net | ネットワークインターフェース、経路、ポート |
| mnt | マウントの一覧 |
| uts | ホスト名 |
| ipc | プロセス間通信 |
| user | ユーザー ID の対応 |
| cgroup | cgroup の見え方 |

- **unshare** は、新しい名前空間を作って、その中でコマンドを実行します。
- **nsenter** は、すでにある名前空間(別のプロセスのもの)に入って、コマンドを実行します。
- 名前空間の一覧は `lsns` で見ます。

```bash
# 新しい PID 名前空間とマウント名前空間で bash を起動する(root で)
sudo unshare --pid --fork --mount-proc bash
echo $$          # 1 と表示される(この名前空間の最初のプロセス)
ps aux           # 数個のプロセスしか見えない
exit

# 新しいネットワーク名前空間(lo だけがある、何もつながっていない状態)
sudo unshare --net bash -c 'ip addr'

# 動いているプロセス(PID 4321)のネットワーク名前空間に入って確認する
sudo nsenter -t 4321 -n ip addr
sudo nsenter -t 4321 -m -p ps aux      # マウントと PID の名前空間に入る
```

- `--pid` を使うときは `--fork` を付けます。付けないと、起動したコマンドが新しい名前空間の最初のプロセス(PID 1)になれず、うまく動きません。
- `--mount-proc` は、新しい PID 名前空間に合わせて `/proc` を付け直します。付けないと、`ps` はホスト側のプロセスを表示します。
- コンテナの調査では、コンテナの中に入れるシェルがなくても、`nsenter` でホスト側の道具を使って、コンテナのネットワークを確かめられます。

### 8. cgroup による資源の制限

**cgroup**(control group)は、プロセスの集まりに、使える CPU、メモリ、I/O、プロセス数の上限を決めるカーネルの仕組みです。名前空間が「見える範囲」を分けるのに対して、cgroup は「使える量」を決めます。

```text
プロセス
  |
  +-- namespace   見える範囲を分ける(pid、net、mnt など)
  |
  +-- cgroup      使える量を決める(cpu、memory、io、pids)
```

cgroup には 2 つの版があります。

| | cgroup v1 | cgroup v2 |
|---|---|---|
| 階層 | 資源の種類(コントローラー)ごとに別の木 | 1 つの木にまとまっている(統合階層) |
| 確認 | `stat -fc %T /sys/fs/cgroup` が `tmpfs` | 同じコマンドが `cgroup2fs` |
| メモリの上限 | `memory.limit_in_bytes` | `memory.max` |
| CPU の上限 | `cpu.cfs_quota_us` と `cpu.cfs_period_us` | `cpu.max`(例: `50000 100000` で 50%) |
| CPU の重み | `cpu.shares` | `cpu.weight` |
| プロセス数 | `pids.max` | `pids.max` |

- AlmaLinux / RHEL 9 系と Ubuntu 24.04 は、どちらも**cgroup v2 が既定**です。
- v2 では、親の `cgroup.subtree_control` に書いたコントローラーだけが、子で使えます。

```text
/sys/fs/cgroup                   ルート
  |-- cgroup.controllers         使えるコントローラーの一覧
  |-- cgroup.subtree_control     子に渡すコントローラー
  `-- demo/                      cgcreate などで作った cgroup
        |-- cgroup.procs         入っているプロセスの PID
        |-- memory.max           メモリの上限
        `-- cpu.max              CPU の上限
```

#### libcgroup の道具

**libcgroup** の道具(Debian 系の Ubuntu 24.04 は `cgroup-tools` パッケージで入れます)で、cgroup を作って操作できます。RHEL 9 系では、`libcgroup-tools` が 9.0 で削除されたので、`systemd-run` や `systemctl set-property` を使います【要確認: Red Hat の公式の文書で確かめる】。

| コマンド | 動き |
|---|---|
| `cgcreate -g cpu,memory:/demo` | cgroup を作る |
| `cgset -r memory.max=100M demo` | 上限などの値を書く |
| `cgclassify -g cpu,memory:demo 2000` | **動いている**プロセス(PID 2000)を cgroup に移す |
| `cgexec -g cpu,memory:demo コマンド` | cgroup に入れて**新しく**コマンドを実行する |
| `cgdelete -g cpu,memory:demo` | cgroup を消す(中にプロセスが残っていないこと) |

```bash
sudo cgcreate -g cpu,memory:/demo
sudo cgset -r memory.max=100M demo       # v2 の名前。v1 の memory.limit_in_bytes は v2 では使えない
sudo cgset -r cpu.max='50000 100000' demo
sudo cgclassify -g cpu,memory:demo 2000
cat /sys/fs/cgroup/demo/memory.max
sudo cgdelete -g cpu,memory:demo
```

v2 の環境で使うときの注意です。

- **設定する値の名前は v2 のもの**を使います。v1 の名前(`memory.limit_in_bytes`、`cpu.shares` など)は、v2 の環境ではファイルがなく、エラーになります。
- v2 では、使いたいコントローラーが親で有効になっている必要があります。`cat /sys/fs/cgroup/cgroup.controllers` と `cgroup.subtree_control` で確かめます【要確認: libcgroup の版によって、コントローラーを自動で有効にするかどうかが違う】。
- libcgroup は v2 に対応しています(libcgroup 2.0 以降)。ただし、systemd の環境では、systemd が cgroup を管理するので、**手で cgroup を作る代わりに systemd の機能を使う**のが標準の方法です。
- 設定ファイル(`cgconfig.conf`)とサービス(`cgconfig`、`cgred`)での永続化も、v2 では制限があります【要確認】。`cgcreate` で作ったものは、再起動で消えます。

systemd を使う場合は、次のようにします。

```bash
# 一時的な実行(メモリ 100 MB、CPU 50% まで)
sudo systemd-run --scope -p MemoryMax=100M -p CPUQuota=50% コマンド

# 動いているサービスの上限を変える(--runtime を付けないと永続する)
sudo systemctl set-property app.service MemoryMax=200M TasksMax=256

# 確かめる
systemd-cgls            # cgroup の木
systemd-cgtop           # cgroup ごとの資源の使用量
```

- メモリの上限(`memory.max`)を超えると、カーネルはその cgroup の中のプロセスを OOM Killer で止めることがあります。上限を決めるときは、実際の使用量を測ってからにします。

### 9. chroot と pivot_root

| コマンド | 動き |
|---|---|
| `chroot` | プロセスから見たルートディレクトリ(`/`)を別のディレクトリに変える |
| `pivot_root` | マウント名前空間の中で、ルートファイルシステムそのものを入れ替える(古いルートは別の場所に移す) |

```bash
# 最小の chroot の例(必要なコマンドとライブラリをコピーしておく)
sudo mkdir -p /srv/jail/bin /srv/jail/lib64
sudo cp /bin/bash /srv/jail/bin/
ldd /bin/bash                       # 必要なライブラリの一覧。これも /srv/jail にコピーする
sudo chroot /srv/jail /bin/bash
```

- chroot の中のプロセスは、`/srv/jail` の外のファイルが見えなくなります。ただし、**セキュリティの境界としては弱い**です。root 権限を持つプロセスは抜け出せる場合があります。プロセスの一覧、ネットワーク、資源の制限も分かれません。
- 実際の分離には、名前空間、cgroup、権限の制限(ケーパビリティ、SELinux)を組み合わせます。コンテナのランタイムは、新しいマウント名前空間の中で `pivot_root` を使い、ルートを入れ替えます。`pivot_root` には、新しいルートがマウントポイントであることなどの条件があります。

## 2.2 パケットフィルタリングの実装 (重要度3)

出題範囲: nftables の table、chain、rule、ファミリー(inet、ip、ip6、arp、bridge)、チェーンの型(filter、nat、route)、/etc/nftables.conf、nft コマンド。

### 1. nftables とは

**nftables** は、Linux のパケットフィルタリングの新しい仕組みで、iptables の後継です。`nft` コマンドで操作します。iptables と違い、IPv4 と IPv6 を 1 つの書き方でまとめて扱えます。

- 202 試験で学ぶ iptables や firewalld は、最近の配布版(RHEL 9 系、Ubuntu 24.04)では、裏で nftables が動く場合があります。`nft list ruleset` で、いま設定されている規則の全体を見られます。
- Red Hat 系の firewalld は、nftables を使って自分のテーブルを作ります。手で `nft` を使うときは、firewalld が作ったものを壊さないように、別のテーブルを作ります【要確認: 併用の方針は環境の運用ルールに従う】。

### 2. table、chain、rule

nftables の規則は、3 つの入れ物でできています。

```text
table(テーブル): ファミリーを持つ入れ物
  |
  +-- chain(チェーン): 規則を並べる列
        |
        +-- rule(ルール): 1 つの条件と動作
```

- **table**: ファミリー(`ip`、`ip6`、`inet`、`arp`、`bridge`、`netdev`)と名前を持ちます。名前は自由につけられます。
- **chain**: ルールの列です。パケットの通り道に引っかける**ベースチェーン**(`type`、`hook`、`priority` を持つ)と、それ以外の**通常のチェーン**(別のチェーンから `jump` で呼ぶ)があります。
- **rule**: 条件(例: `tcp dport 22`)と動作(例: `accept`)です。上から順に調べ、最初に合った動作で決まります。

#### テーブルのファミリー

| ファミリー | 扱うもの |
|---|---|
| `ip` | IPv4 だけ(省略したときの既定) |
| `ip6` | IPv6 だけ |
| `inet` | IPv4 と IPv6 の両方(1 つの規則で両方に効く) |
| `arp` | ARP のパケット |
| `bridge` | ブリッジを通るイーサネットのフレーム(L2) |
| `netdev` | 受信の最初の段階(インターフェースごと)。出題範囲の外ですが、あることは知っておきます |

### 3. チェーンの型、hook、priority、policy

ベースチェーンを作るときは、`type`、`hook`、`priority`、(必要なら)`policy` を書きます。

```bash
sudo nft add table inet filter
sudo nft add chain inet filter input '{ type filter hook input priority 0 ; policy drop ; }'
```

- シェルが `{ }` や `;` を解釈しないように、全体を引用符で囲みます。

| チェーンの型 | 使いどころ | 使える hook |
|---|---|---|
| `filter` | 通す、止める(いちばん多い) | すべて |
| `nat` | アドレスの変換(送信元 NAT、宛先 NAT) | prerouting、input、output、postrouting |
| `route` | パケットの印(マーク)などを変えたあとで、経路を決め直す | output |

| hook | パケットが通る場所 |
|---|---|
| `prerouting` | 受信した直後。宛先の変換(dstnat)をここで行う |
| `input` | 自分宛ての通信が、プロセスに渡される前 |
| `forward` | 自分宛てではなく、転送する通信 |
| `output` | 自分のプロセスが送り出す通信 |
| `postrouting` | 送り出す直前。送信元の変換(srcnat、マスカレード)をここで行う |

```text
                 +--> [input] ----> local process
packet in        |                        |
   |             |                        v
[prerouting] ----+                    [output]
                 |                        |
                 +--> [forward] -------+  |
                                       v  v
                                  [postrouting] --> packet out
```

- **priority** は、同じ hook に複数のチェーンがあるときの順番です。**小さい数字が先**に評価されます。名前もあり、`raw` は -300、`mangle` は -150、`dstnat` は -100、`filter` は 0、`security` は 50、`srcnat` は 100 です。
- **policy** は、そのチェーンのどの規則にも合わなかったときの動作です。`accept`(既定)か `drop` です。`policy drop` にすると、許可する規則を書いたものだけが通ります。

### 4. 基本のコマンド

| コマンド | 動き |
|---|---|
| `nft list ruleset` | すべての規則を表示する |
| `nft -a list ruleset` | `handle`(規則の番号)も表示する |
| `nft add rule inet filter input tcp dport 22 accept` | 規則を末尾に足す |
| `nft insert rule inet filter input tcp dport 22 accept` | 規則を先頭に足す |
| `nft delete rule inet filter input handle 5` | handle で指定して規則を消す |
| `nft flush chain inet filter input` | チェーンの規則を全部消す |
| `nft delete table inet filter` | テーブルごと消す |
| `nft flush ruleset` | すべて消す |
| `nft -f /etc/nftables.conf` | ファイルから読み込む |
| `nft -c -f /etc/nftables.conf` | 反映せずに、文法だけ確かめる(`--check`) |

### 5. 規則の書き方

```text
# 受信の基本の許可(input チェーンの中)
iifname "lo" accept
ct state established,related accept
ct state invalid drop
tcp dport 22 accept
tcp dport { 80, 443 } accept
icmp type echo-request accept
icmpv6 type { echo-request, nd-neighbor-solicit, nd-neighbor-advert, nd-router-advert } accept
```

- **ct state** は、コネクション追跡(conntrack)の状態です。`established`(確立済み)、`related`(関連する通信)、`new`(新しい)、`invalid`(不正)があります。`ct state established,related accept` を入れないと、`policy drop` の input チェーンでは、**自分が始めた通信の返事も落ちます**。
- `{ 80, 443 }` のような波かっこの並びを、**セット**(集合)といいます。上のように規則の中に直接書くものと、名前を付けて使い回すもの(`set`)があります。`tcp dport 80-443` は範囲で、81 から 442 も含むので、「80 と 443」とは違います。
- IPv6 では、ルーターやほかの端末を見つけるための **ICMPv6**(近隣探索)を通さないと、通信ができなくなります。`inet` で `policy drop` にするときは、必ず許可します。
- `lo`(ループバック)を許可しないと、同じホストの中のアプリ同士の通信が止まります。

名前を付けたセットの例です。

```text
table inet filter {
    set ssh_allowed {
        type ipv4_addr
        flags interval
        elements = { 192.0.2.0/24, 198.51.100.10 }
    }
    chain input {
        type filter hook input priority 0; policy drop;
        ct state established,related accept
        iifname "lo" accept
        ip saddr @ssh_allowed tcp dport 22 accept
    }
}
```

(`192.0.2.0/24` と `198.51.100.10` は、文書用に確保された例のアドレスです。)

NAT の例(内側のネットワークから外へ出る通信の送信元を、出口の IP にする)です。

```text
table ip nat {
    chain postrouting {
        type nat hook postrouting priority srcnat; policy accept;
        oifname "eth0" masquerade
    }
}
```

- 転送(ルーターとして使う)には、別に `net.ipv4.ip_forward=1` が必要です。

### 6. 永続化と起動

- **Debian 系(Ubuntu 24.04 / Debian 12)**: 規則は `/etc/nftables.conf` に書きます。`nftables.service` が起動時に読み込みます。サービスが無効のままだと、再起動で消えます。
- **Red Hat 系(AlmaLinux / RHEL 9 系)**: `nftables.service` が読むファイルは、`/etc/sysconfig/nftables.conf` で、その中から `/etc/nftables/` の下のファイルを `include` します【要確認: 配布版ごとに読み込むファイルが違う】。既定の `/etc/sysconfig/nftables.conf` の `include` の行はコメントになっているので、外して使います【要確認: RHEL 9 の既定のファイル】。下の保存の例は Ubuntu の場合で、RHEL 9 系は `/etc/sysconfig/nftables.conf` から `include` するファイルに保存します。`flush ruleset` を先頭に書かないと、再読み込みのときに同じ規則が重複して足されます。

```bash
{ echo '#!/usr/sbin/nft -f'; echo 'flush ruleset'; sudo nft list ruleset; } | sudo tee /etc/nftables.conf   # 今の規則をファイルに保存する(Ubuntu の場合)
sudo nft -c -f /etc/nftables.conf                       # 文法の確認
sudo systemctl enable --now nftables                    # 起動時に読む。今すぐ読む
```

`/etc/nftables.conf` の形です。

```text
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        ct state established,related accept
        iifname "lo" accept
        tcp dport 22 accept
    }
}
```

- 先頭の `flush ruleset` で、それまでの規則を全部消してから読み込みます。ほかのツール(firewalld、Docker など)が作った規則も消えるので、注意します。
- **リモートで作業するときの安全策**: `policy drop` を入れる前に、SSH の許可と `ct state established,related accept` を先に書きます。いきなり反映せず、`nft -c -f` で確認します。別のターミナルを開いたままにして、失敗に備えます。

## 2.3 暗号化ファイルシステム (重要度3)

出題範囲: LUKS1 と LUKS2、cryptsetup、/etc/crypttab と /etc/fstab、fscrypt。

### 1. 何を守るか

ディスクの暗号化は、**ディスクが盗まれたり、捨てられたり、持ち出されたりしたとき**に、中のデータを読ませないための対策です。起動してパスフレーズ(長い合言葉)を入れて開いた後は、ふつうにファイルが読めるので、動いているサーバーへの侵入は防げません。

| 方式 | 暗号化の単位 | 道具 |
|---|---|---|
| **dm-crypt / LUKS** | ブロックデバイス(パーティションやディスク全体) | `cryptsetup` |
| **fscrypt** | ディレクトリ(ext4 などのファイルシステムの機能) | `fscrypt` |

- **dm-crypt** は、ブロックデバイスを暗号化する、カーネルの仕組み(device-mapper の 1 つ)です。
- **LUKS**(Linux Unified Key Setup)は、dm-crypt で使う鍵の管理の形式です。デバイスの先頭の**ヘッダー**に、複数のパスフレーズを持てるように記録します。

```text
アプリ、ファイルの読み書き
    |
[ext4 / xfs]        /dev/mapper/secure を使う
    |
[dm-crypt]          復号と暗号化をカーネルがする
    |
[LUKS header + encrypted data]   /dev/vdb1(LUKS ヘッダーと暗号化されたデータ。ディスク上の実体)
```

### 2. LUKS1 と LUKS2

| | LUKS1 | LUKS2 |
|---|---|---|
| キースロット(鍵を入れる枠) | 8 個 | 最大 32 個 |
| 鍵導出(パスフレーズから鍵を作る方法) | PBKDF2 | PBKDF2 のほか、argon2 系(メモリを多く使うので総当たりに強い) |
| ヘッダー | 固定の形式 | JSON 形式のメタデータで、ヘッダーを冗長に保存する |
| 新しい機能 | ― | ラベルの設定、トークン、オンラインでの再暗号化など |

- 最近の cryptsetup(2.1 以降)では、`luksFormat` の既定は **LUKS2** です。RHEL 9 系と Ubuntu 24.04 も LUKS2 が既定です。
- GRUB は LUKS2 に対応していますが、鍵導出は PBKDF2 だけで、Argon2 には対応していません(GRUB 2.12 時点)。`/boot` を LUKS2 で暗号化して GRUB から開くときは、`--pbkdf pbkdf2` を付けて作ります【要確認: 新しい GRUB の版で変わっている可能性】。
- 形式を指定するときは、`--type luks1` か `--type luks2` を付けます。

### 3. cryptsetup の基本の流れ

```bash
# 1. 初期化する(中のデータは使えなくなる。YES と入力して確認する)
sudo cryptsetup luksFormat /dev/vdb1

# 2. 開く(/dev/mapper/secure ができる)
sudo cryptsetup open /dev/vdb1 secure

# 3. 開いたデバイスにファイルシステムを作ってマウントする
sudo mkfs.ext4 /dev/mapper/secure
sudo mount /dev/mapper/secure /mnt

# 4. 使い終わったら、アンマウントして閉じる
sudo umount /mnt
sudo cryptsetup close secure
```

| サブコマンド | 動き |
|---|---|
| `luksFormat` | LUKS のヘッダーを書いて初期化する。**元のデータは読めなくなる**が、ディスクの上から消えるわけではない。消すには、開いた後の `/dev/mapper/名前` を全体にゼロで書くなどする |
| `open`(古い名前 `luksOpen`) | パスフレーズで開いて、`/dev/mapper/名前` を作る |
| `close`(`luksClose`) | 閉じる |
| `luksAddKey` | パスフレーズ(キー)を追加する |
| `luksRemoveKey` | 指定したパスフレーズのキースロットを消す |
| `luksKillSlot` | 番号を指定して、キースロットを消す |
| `luksDump` | ヘッダーの内容(版、キースロットの使用状況、暗号の方式)を表示する |
| `luksUUID` | LUKS の UUID を表示する |
| `luksHeaderBackup` | ヘッダーをファイルに保存する |
| `status 名前` | 開いているデバイスの状態 |

- ファイルシステムは、**開いた後の `/dev/mapper/secure` に作ります**。`/dev/vdb1` に直接 `mkfs` すると、LUKS のヘッダーを壊して、データが読めなくなります。
- **キースロット**は、パスフレーズを入れる枠です。どのパスフレーズでも、開けば同じデータの鍵が取り出せます。管理者の交代や、紛失に備えて、2 つ目のパスフレーズを `luksAddKey` で足しておきます。最後の 1 つを消すと、二度と開けません。
- **ヘッダーを上書きして壊すと、パスフレーズが分かっていても復号できません**。`cryptsetup luksHeaderBackup /dev/vdb1 --header-backup-file /safe/vdb1.img` で保存し、暗号化していない別の場所に置かないようにします。

```bash
sudo cryptsetup luksDump /dev/vdb1          # 版とキースロットを確認する
sudo cryptsetup luksAddKey /dev/vdb1        # 予備のパスフレーズを追加する
sudo cryptsetup luksHeaderBackup /dev/vdb1 --header-backup-file /root/vdb1-header.img
```

### 4. /etc/crypttab と /etc/fstab

起動時に自動で開くには、**`/etc/crypttab`** に書きます。マウントは、開いた後のデバイスを **`/etc/fstab`** に書きます。

```text
# /etc/crypttab の列: 名前、デバイス、鍵ファイル、オプション
secure   UUID=0a1b2c3d-1111-2222-3333-444455556666   none   luks,discard

# /etc/fstab
/dev/mapper/secure   /data   ext4   defaults,nofail   0   2
```

| 列(crypttab) | 意味 |
|---|---|
| 1 列目 | `/dev/mapper/` の下の名前 |
| 2 列目 | 暗号化したデバイス。`/dev/vdb1` より、`UUID=`(`luksUUID` で出す値)のほうが、名前が変わっても安全 |
| 3 列目 | 鍵ファイルのパス。`none` は、鍵ファイルのパスを指定せず、起動時にパスフレーズを入力させる(systemd では、`/etc/cryptsetup-keys.d/<名前>.key` があれば、それを自動で使う) |
| 4 列目 | オプション。`luks`(LUKS の形式の指定。暗号化の有無を決めるものではない)、`discard`、`noauto`、`nofail`、`_netdev` など |

- fstab の 1 列目は、**`/dev/mapper/secure`** のように、開いた後の名前で書きます。LUKS の UUID(`/dev/vdb1` の UUID)を書いても、中のファイルシステムはマウントできません。
- 鍵ファイルを使うと自動で開けますが、鍵ファイルを盗まれると意味がありません。`root` だけが読める権限(`chmod 0400`)にして、別の暗号化されたディスクか、安全な場所に置きます。
- パスフレーズを入力する設定では、リモートで再起動すると、入力待ちで止まります。止まっても困らないように、データ用のディスクには `nofail` を付けるか、鍵ファイルや外部の鍵の仕組みを使います。
- 起動時のルートを暗号化する場合は、initramfs の更新が必要です(Debian 系は `update-initramfs -u`、Red Hat 系は `dracut -f`)。

### 5. fscrypt

**fscrypt** は、Linux カーネルの、ディレクトリ単位の暗号化の機能です。ext4 や F2FS などが対応しています。`fscrypt` コマンド(ユーザー空間の道具)で操作します。

| | LUKS(dm-crypt) | fscrypt |
|---|---|---|
| 暗号化の範囲 | デバイス全体 | ディレクトリ(中のファイル名と内容) |
| 鍵の持ち主 | 1 つのデバイスに 1 つの管理 | ユーザーごと、ディレクトリごとに別の鍵 |
| 見えるもの(暗号化されないもの) | ほぼなし | ファイルの大きさ、数、ディレクトリの構造、権限などのメタデータ |
| 道具 | `cryptsetup` | `fscrypt` |

```bash
sudo tune2fs -O encrypt /dev/vdb1      # ext4 の encrypt 機能を有効にする(アンマウントして行う)
sudo fscrypt setup                     # 全体の設定(/etc/fscrypt.conf)を作る
sudo fscrypt setup /data               # そのファイルシステムで fscrypt を使えるようにする
mkdir /data/private                    # 空のディレクトリを用意する
fscrypt encrypt /data/private          # パスフレーズなどの保護の方法を選んで暗号化する
fscrypt lock /data/private             # 鍵を外して、読めない状態にする
fscrypt unlock /data/private           # パスフレーズで読めるようにする
fscrypt status /data/private
```

- 暗号化するディレクトリは、**空**でなければなりません。すでにあるデータは、新しい暗号化したディレクトリにコピーして移します。
- 暗号化されるのはファイル名と内容です。サイズや更新日時など、メタデータは見えます。
- 使えるファイルシステムは限られます。RHEL 9 系の既定の XFS は対応していません。`fscrypt` のパッケージの提供も、配布版で違います【要確認】。

## 2.4 Linux システムのセキュリティ監査 (重要度3)

出題範囲: auditd.conf(log_file、max_log_file、max_log_file_action)、augenrules と rules.d、auditctl、aureport、ausearch。

### 1. Linux の監査の仕組み

**Linux Audit** は、「誰が、いつ、何をしたか」を、カーネルが記録する仕組みです。カーネルが事象(システムコールの実行、ファイルへのアクセスなど)を捕まえ、**auditd**(監査デーモン)が `/var/log/audit/audit.log` に書きます。

```text
プロセスの動き(システムコール、ファイルの操作)
    |
[カーネルの監査機能]: ルールに合う事象だけを記録する
    |
[auditd]                  /etc/audit/auditd.conf の設定で動く
    |
/var/log/audit/audit.log
    |
    +--> ausearch    条件で探す
    +--> aureport    集計して報告する
```

- 道具は `audit`(Red Hat 系)、`auditd`(Debian 系のパッケージ名)で入れます。
- ルールの設定は `auditctl`、保存したルールの読み込みは `augenrules`、探すのは `ausearch`、まとめるのは `aureport` です。

### 2. /etc/audit/auditd.conf

auditd 本体の設定です。主な項目と、既定の値です【要確認: 版と配布版で既定の値が少し違う】。

| 項目 | 意味 | 配布版の auditd.conf の値 |
|---|---|---|
| `log_file` | 監査ログのファイル | `/var/log/audit/audit.log` |
| `max_log_file` | ログ 1 つの最大の大きさ(MB) | `8` |
| `max_log_file_action` | `max_log_file` に達したときの動作 | `ROTATE` |
| `num_logs` | ローテーションで残す世代の数(`ROTATE` のとき) | `5`(項目がないときは 0 で、ローテーションしない) |
| `space_left`、`space_left_action` | ディスクの空きが少なくなったときの警告 | 配布版で違う |
| `disk_full_action` | ディスクが満杯になったときの動作 | 配布版で違う |

`max_log_file_action` の値です。

| 値 | 動き |
|---|---|
| `ROTATE` | `audit.log` を `audit.log.1` にずらし、古いものは `num_logs` までで消す |
| `KEEP_LOGS` | ローテーションするが、古いものを消さない |
| `SYSLOG` | syslog に警告を送る |
| `EXEC /パス` | スクリプトを実行する(その間は書き込みを止める) |
| `SUSPEND` | 監査ログの書き込みをやめる(auditd は動いたまま) |
| `IGNORE` | 何もしない(ログは大きくなり続ける) |

- ログがディスクを埋めると、システムが止まる場合があります。保存の期間と、ディスクの量から、`max_log_file` と `num_logs` を決めます。
- 監査ログは、別のディスクやログの集約サーバーにも送ると、侵入されたときに消されても残せます。

### 3. 規則を作る(auditctl)

規則には 2 種類あります。

| 種類 | 書き方 | 例 |
|---|---|---|
| ファイルの監視 | `-w パス -p 権限 -k キー` | `-w /etc/passwd -p wa -k identity` |
| システムコールの監視 | `-a always,exit -F ... -S システムコール -k キー` | `-a always,exit -F arch=b64 -S unlink,unlinkat -F auid>=1000 -F auid!=unset -k delete` |

- `-w` は監視するファイルやディレクトリです。`-p` の `r`(読み取り)、`w`(書き込み)、`x`(実行)、`a`(属性の変更)で、何を記録するかを決めます。
- `-w` の書き方は、man では非推奨です。同じ内容は `-a always,exit -F arch=b64 -F path=/etc/shadow -F perm=wa -k shadow_change` と書けます。
- `-k` は、**キー**(目印の名前)を付けます。後で `ausearch -k` で、その規則の記録だけを探せます。
- `-a always,exit` は、システムコールの終わりに、必ず記録する、という意味です。`-F` で条件を絞ります。`auid>=1000` は、一般ユーザーのログインに絞る条件です。auid が未設定のプロセス(起動時のデーモンなど)は 4294967295 なので、`auid!=unset` で除きます。

```bash
sudo auditctl -l                                  # 今読み込まれている規則の一覧
sudo auditctl -s                                  # 監査の状態
sudo auditctl -w /etc/shadow -p wa -k shadow_change    # 規則を足す(再起動で消える)
sudo auditctl -W /etc/shadow -p wa -k shadow_change    # 同じ規則を消す
sudo auditctl -D                                  # すべての規則を消す
```

- `auditctl` で足した規則は、**再起動すると消えます**。残すには、次の `rules.d` に書きます。
- 規則の最後に `-e 2` を書くと、規則を**変更できない状態**(immutable)で固定します。侵入者が規則を消すのを防げますが、変更するには再起動が必要です。試すときは、最後に書きます。

### 4. 規則を残す(augenrules と rules.d)

`/etc/audit/rules.d/` の下の `*.rules` ファイルに、`auditctl` の引数と同じ形で規則を書きます。

```text
# /etc/audit/rules.d/50-identity.rules
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /etc/ssh/sshd_config -p wa -k sshd_config
```

```bash
sudo augenrules --check      # ファイルが変わっているかを確認する
sudo augenrules --load       # rules.d の *.rules をファイル名の順につなげ、
                             # /etc/audit/audit.rules を作って読み込む
sudo auditctl -l             # 読み込まれたことを確かめる
```

- `augenrules` は、**ファイル名の順**(`10-`、`50-` のような番号の順)に結合します。`-D`(全消し)や `-b`(バッファ)のような共通の設定は、小さい番号のファイルに、`-e 2` は最も大きい番号のファイルに置きます。
- `/etc/audit/audit.rules` は、`augenrules` が作る生成物です。直接編集しても、次の `augenrules --load` で上書きされます。
- auditd.service には `RefuseManualStop=yes` があり、`systemctl stop` と `systemctl restart` は拒否されます。再起動には `service auditd restart` を、設定の読み直しには `service auditd reload` を使います【要確認: Ubuntu の unit が上流と同じか】。

### 5. 記録を読む(ausearch と aureport)

監査ログの 1 行の例(読みやすいように改行しています)です。

```text
type=SYSCALL msg=audit(1767225600.123:456): arch=c000003e syscall=257 success=yes
  auid=1001 uid=0 euid=0 comm="vi" exe="/usr/bin/vim.basic" key="identity"
type=PATH ... name="/etc/passwd" ...
```

- **auid** は、最初にログインしたときのユーザー ID です。`sudo` や `su` で root になった後も、変わりません。「元の人」は auid で分かります。`uid` や `euid` は、そのときの実効の ID で、root になります。

**ausearch** は、条件で探します。

| オプション | 意味 |
|---|---|
| `-k キー` | 規則に付けたキーで探す |
| `-m 種類` | 記録の種類(`USER_LOGIN`、`USER_AUTH`、`AVC` など) |
| `-ui ユーザーID` / `-ua` | ユーザー ID で探す(`-ua` は auid などすべての ID) |
| `-f パス` | ファイル名で探す |
| `-ts 時刻` / `-te` | 開始、終了の時刻(`today`、`yesterday`、`recent`、`this-week` など) |
| `-i` | 数字を名前に直して読みやすくする |
| `--success no` | 失敗した事象だけ |

**aureport** は、集計して報告します。

| オプション | 報告する内容 |
|---|---|
| `--summary` | 件数のまとめ(ほかの報告と組み合わせる) |
| `-l` | ログイン |
| `--auth`(`-au`) | 認証 |
| `-f` | ファイル |
| `-x` | 実行したプログラム |
| `-k` | キー |
| `--failed` | 失敗したものだけ |
| `-ts`、`-te` | 期間 |

```bash
sudo ausearch -k identity -i -ts today               # identity キーの今日の記録を読みやすく
sudo ausearch -m USER_LOGIN --success no -ts yesterday
sudo ausearch -m avc -ts recent                      # SELinux の拒否
sudo aureport -l --failed -ts this-week              # 今週のログイン失敗の一覧
sudo aureport --auth --summary                       # 認証のまとめ
sudo aureport -x --summary                           # よく実行されたプログラム
```

### 6. 使い方の考え方

1. まず守りたいものを決めます(`/etc/passwd`、`/etc/shadow`、`/etc/sudoers`、sshd の設定、重要なデータなど)。
2. 規則を `rules.d` に書き、キーを付けて、`augenrules --load` で読み込みます。
3. 実際に変更して、`ausearch -k キー` で記録されることを確かめます。
4. 規則を増やし過ぎると、記録が増えてディスクと性能を圧迫します。必要なものに絞ります。
5. 定期的に `aureport` で見て、異常があれば `ausearch` で詳しく調べます。
