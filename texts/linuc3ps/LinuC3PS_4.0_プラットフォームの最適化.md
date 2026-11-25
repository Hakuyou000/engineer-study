# LinuC 3PS テキスト 4.0 プラットフォームの最適化

Linux カーネルの設定値(カーネルパラメーター)を変えて、メモリ、プロセス数、ファイルの数、ネットワークの動きを、サーバーの用途に合わせる方法を学びます。レベル 3 では、「どの症状のとき、どの値を、なぜ変えるか」を問われます。

この章に出る値の既定値は、カーネルの版や配布(AlmaLinux 9 / RHEL 9 系、Ubuntu 24.04 など)で変わります。ここに書く既定値は、kernel.org の Documentation(`admin-guide/sysctl/`、`networking/ip-sysctl.rst`)で確かめたものです。確かめられなかったものには 【要確認】 を付けています。実機では、必ず `sysctl 名前` で今の値を確かめてから変えます。

## 4.1 カーネルパラメータによるリソース最適化 (重要度3)

### 1. sysctl の基本

**カーネルパラメーター**は、動いているカーネルの設定値です。`/proc/sys/` の下のファイルとして見え、**sysctl** コマンドで読み書きします。`/proc/sys/vm/swappiness` は、`vm.swappiness` と書きます(`/` を `.` に置き換えます)。

```bash
sysctl vm.swappiness                  # 今の値を見る
sysctl -w vm.swappiness=10            # 今すぐ変える(再起動で戻る)
sysctl -a | grep dirty                # 名前の一部で探す
cat /proc/sys/vm/swappiness           # ファイルとして読んでも同じ
```

`sysctl -w` の変更は、再起動で消えます。残すには、設定ファイルに書きます。

| | 内容 |
|---|---|
| `/etc/sysctl.d/*.conf` | 自分で足す設定を置く場所。`90-tuning.conf` のように、番号を付けた名前にする |
| `/etc/sysctl.conf` | 昔からの設定ファイル。読み込まれる。`sysctl --system` は最後に読む(RHEL 9 系でも Ubuntu 24.04 でも同じ) |
| `/usr/lib/sysctl.d/` | 配布物(パッケージ)が置く設定。RHEL 9 系でも Ubuntu 24.04 でも同じ |

```bash
# /etc/sysctl.d/90-tuning.conf
vm.swappiness = 10
vm.dirty_background_ratio = 5
```

```bash
sudo sysctl --system                  # 上の場所の設定ファイルをすべて読み直す
sudo sysctl -p                        # /etc/sysctl.conf だけを読み直す(別のファイルは -p ファイル名)
```

- 同じ名前の値が複数のファイルにあれば、ファイル名の順で後に読まれたものが勝ちます。自分の設定は、大きい番号(`90-`、`99-`)で始まる名前にします。
- `sysctl --system` は、`/etc/sysctl.d/` などの全部のファイルを読みます。`sysctl -p` は、引数なしだと `/etc/sysctl.conf` だけを読みます。
- カーネルモジュール(例: `nf_conntrack`)が作る名前は、モジュールが読み込まれるまで存在しません。起動のときに設定ファイルを読むのが早すぎると、「そのようなファイルはありません」と出ます。

### 2. メモリの割り当てと余裕

#### vm.overcommit_memory と vm.overcommit_ratio

プログラムは、使う量より多めにメモリを要求することがよくあります。要求をどこまで許すか(**オーバーコミット**)を決めるのが `vm.overcommit_memory` です。

| 値 | 動き |
|---|---|
| 0(既定) | 明らかに多すぎる要求だけ断る(ヒューリスティック) |
| 1 | 常に許す。実際に足りなくなってから、OOM killer が働く |
| 2 | 許す量に上限を決める。上限を超える要求は、その場で失敗する |

2 のときの上限は、次の式です。ヒュージページを使わない場合の計算です。

```text
コミットできる上限 = スワップの大きさ + 物理メモリ × overcommit_ratio ÷ 100
```

`vm.overcommit_ratio` の既定は 50 です。物理メモリ 8 GB、スワップ 2 GB、ratio 50 なら、2 + 8 × 0.5 = 6 GB が上限です。

- 大きなプロセスが `fork` するとき、0 の設定では `fork` が失敗することがあります。Redis のように、子プロセスを作ってスナップショットを取る製品は、1 を勧めています。
- 2 にすると、メモリ不足が OOM killer ではなく、アプリのメモリ確保の失敗(エラー)として表に出ます。止まる場所は予想しやすくなりますが、余裕を多めに見ないと、まだメモリが空いているのに失敗します。

#### vm.min_free_kbytes

カーネルが、**常に空けておく**メモリの量(KB)です。ネットワークの受信などで、カーネルが急にメモリを必要としたときに、確保できずに失敗する(`page allocation failure` がログに出る)のを防ぎます。

- 既定は、メモリの量から自動で決まります。一度書くと、カーネルは自動で調整しなくなります。
- 1024 KB より小さくすると、カーネルが不安定になります(ドキュメントの警告)。
- 大きくしすぎると、使えるメモリが減り、メモリ不足の状態に入りやすくなります。

#### vm.swappiness

メモリが足りなくなったとき、**スワップ**(メモリの内容をディスクに退避すること)と、ファイルのキャッシュを捨てることの、どちらを優先するかを決めます。0〜200 の値で、既定は 60 です。小さいほど、スワップを使いにくくなります。

- データベースのように、メモリ上のデータをディスクに追い出したくないサーバーでは、1〜10 を使うことが多いです。
- スワップを完全になくす(`swapoff -a`)のとは違います。スワップを残したまま、使う頻度を下げます。メモリが本当に足りなくなったとき、スワップがあれば OOM killer が働く前に耐えられます。

メモリの関係を図にします。

```text
アプリ: malloc() でメモリを要求する
   |
   v
[overcommit の判定] vm.overcommit_memory
   |   0: 明らかに多すぎたら断る
   |   1: 常に許す
   |   2: スワップ + RAM x ratio を超えたら断る
   v
実際に使われるとき: 物理メモリが足りなければ
   |
   +--> ファイルのキャッシュを捨てる / スワップに出す (割合は vm.swappiness)
   |
   +--> それでも足りない: OOM killer がプロセスを終了
```

### 3. ヒュージページ

通常、メモリは 4 KB の**ページ**に分けて管理します。大きなメモリを使うプログラムでは、ページの数が多くなり、管理の負担が増えます。x86_64 では、2 MB の大きなページ(**ヒュージページ**)を使うと、この負担が減ります。

| | Transparent Huge Pages(THP) | 明示的なヒュージページ |
|---|---|---|
| 設定 | `/sys/kernel/mm/transparent_hugepage/enabled` | `vm.nr_hugepages` |
| 動き | カーネルが自動で、通常のページをまとめて使う | あらかじめ数を決めて、予約する。アプリが明示的に使う |
| 状態 | `always` / `madvise` / `never` | 予約したぶんは、ほかの用途に使えない |

#### Transparent Huge Pages(THP)

- 設定値は、`always`(いつも使う)、`madvise`(アプリが頼んだ領域だけ)、`never`(使わない)です。
- 既定は、RHEL 9 系では `always`、Ubuntu 24.04 では `madvise` です 【要確認】。
- データベース(Redis、MongoDB など)では、THP のまとめ直し(メモリの整理)が、**応答の遅れ**の原因になることがあります。製品の手順に従って `never` にします。

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled        # [always] madvise never のように出る(角かっこが今の値)
echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled    # すぐ変える(再起動で戻る)
```

`transparent_hugepage` は sysctl の名前ではないので、`sysctl -w` では変えられません。残すには、カーネルの起動オプション(`transparent_hugepage=never`)か、起動時に書き込む systemd のユニット、RHEL 系なら tuned のプロファイルを使います。

#### vm.nr_hugepages

予約するヒュージページの数です。たとえば 1024 なら、2 MB × 1024 = 2 GB を予約します。

- 予約したメモリは、使われなくても、ほかの用途に使えません(`HugePages_Total` と `HugePages_Free` を `/proc/meminfo` で見ます)。
- PostgreSQL や Oracle Database のように、大きな共有メモリを持つ製品で使います。
- 起動してからだと、連続した空きメモリが見つからず、予約が足りないことがあります。確実にするには、起動の早い時点(sysctl の設定ファイル、またはカーネルの起動オプション)で予約します。

### 4. 書き込み(dirty ページ)の制御

ファイルへの書き込みは、まずメモリの中のキャッシュに入ります(この、まだディスクに書かれていないページを **dirty ページ**と呼びます)。あとで、カーネルがまとめてディスクに書きます。この流れを決めるのが、次の 4 つの値です。

| パラメーター | 意味 | 既定値 |
|---|---|---|
| `vm.dirty_background_ratio` | dirty ページがこの割合(%)に達すると、カーネルのスレッドが**裏で**書き出しを始める | 10 |
| `vm.dirty_ratio` | この割合(%)に達すると、書き込んでいる**プロセス自身**が書き出し、書き込みが止まる | 20 |
| `vm.dirty_expire_centisecs` | dirty になってからこの時間(1/100 秒単位)がたつと、書き出しの対象になる | 3000(30 秒) |
| `vm.dirty_writeback_centisecs` | 書き出し用のスレッドが起きる間隔(1/100 秒単位)。0 で定期的な書き出しをやめる | 500(5 秒) |

割合は、「空きと回収できるメモリ」の中での割合です(全メモリの割合ではありません)。既定値は、多くのカーネルでこの値です 【要確認】(ドキュメントには既定値が載っていません)。

```text
アプリ: write()
   |
   v
[ページキャッシュ] dirty ページが増える
   |
   +-- dirty_background_ratio に達する --> 裏のスレッドが書き出し始める
   |
   +-- dirty_ratio に達する --> アプリ自身が書き出す(write() が止まって見える)
   |
   +-- dirty_expire_centisecs より古い --> dirty_writeback_centisecs ごとに書き出される
   v
[ディスク]
```

- 書き込みが突然止まる(ストール)場合は、`dirty_background_ratio` を下げて、早めに少しずつ書き出すようにします。
- 同時に dirty のデータが多いと、停電やカーネルの異常のときに失われる量が増えます。大きくする場合は、データの重要さを考えます。

### 5. プロセスとファイルの数の上限

| パラメーター | 何の上限か | 既定値 |
|---|---|---|
| `kernel.threads-max` | システム全体で作れるスレッドの数 | 起動時にメモリの量から決まる |
| `kernel.pid_max` | プロセス ID(PID)の最大値。これを超えるとまた小さい番号に戻る | 32768。64 ビットで systemd を使う環境では、4194304 になっていることが多い 【要確認】 |
| `fs.file-max` | システム全体で開けるファイルハンドル(ファイルを開いた状態)の数 | カーネルはメモリの量から決める。systemd が起動時に最大値まで上げる配布もある 【要確認】 |
| `fs.nr_open` | **1 つのプロセス**が持てるファイルの数の、上げられる限界 | カーネルの既定は 1048576。systemd が起動時に上げる配布もある 【要確認】 |
| `fs.aio-max-nr` | システム全体の、非同期 I/O の要求の数 | 65536(多くの環境) 【要確認】 |

- **ファイルが開けない**エラーは、2 種類あります。`Too many open files`(EMFILE)は、プロセスごとの上限(`ulimit -n`、systemd の `LimitNOFILE`)に達したことです。`Too many open files in system`(ENFILE)は、システム全体の `fs.file-max` に達したことです。
- `ulimit -n` を上げても、`fs.nr_open` を超える値にはできません。まず `fs.nr_open` を上げます。
- `fork: retry: Resource temporarily unavailable` などで、新しいプロセスやスレッドを作れないときは、`kernel.pid_max`、`kernel.threads-max` のほか、ユーザーごとの `ulimit -u` や、コンテナの cgroup の `pids.max` も確かめます。
- `fs.aio-max-nr` は、データベースなどが非同期 I/O を使うときに関わります。足りないと、`io_setup` が `EAGAIN` で失敗します。現在の使用数は `fs.aio-nr` で見ます。

```bash
cat /proc/sys/fs/file-nr          # 使用中、使っていない、上限(file-max)の 3 つの数
ulimit -n                         # 今のシェルの、1 プロセスあたりの上限
```

### 6. 異常のときの動き

#### vm.panic_on_oom と kernel.panic

メモリが完全になくなったとき(OOM)、通常は OOM killer が、使いすぎているプロセスを 1 つ終了させます。

| `vm.panic_on_oom` | 動き |
|---|---|
| 0(既定) | OOM killer でプロセスを終了させる |
| 1 | カーネルパニックにする(メモリの制限が付いた特別な場合は除く) |
| 2 | 例外なく、必ずカーネルパニックにする |

`kernel.panic` は、パニックのあと、**何秒で自動的に再起動するか**です。

| `kernel.panic` | 動き |
|---|---|
| 0(既定) | 再起動しない。止まったまま |
| 正の数 | その秒数のあとで再起動する |
| 負の数 | すぐに再起動する |

高可用性クラスター(Pacemaker など)のノードでは、OOM になった中途半端なノードを動かし続けるより、すぐに落として再起動し、ほかのノードに切り替える設計があります。このときは、`vm.panic_on_oom=1` と `kernel.panic=10` のように、**両方**を設定します。`vm.panic_on_oom=1` だけで `kernel.panic=0` のままだと、パニックで止まったままになります。

#### kernel.core_pattern

プロセスが異常終了したとき、そのときのメモリの内容を保存したファイルを、**コアダンプ**と呼びます。`kernel.core_pattern` は、保存する場所と名前の決め方です。既定は `core`(カレントディレクトリに `core` というファイル)です。

| 書式 | 意味 |
|---|---|
| `%e` | 実行ファイルの名前 |
| `%p` | プロセス ID(PID) |
| `%t` | 時刻(UNIX 時間) |
| `%u` | ユーザー ID |
| `%h` | ホスト名 |

```bash
sudo sysctl -w kernel.core_pattern=/var/crash/core.%e.%p.%t     # nginx(PID 1234)なら core.nginx.1234.… になる
```

- 先頭が `|` なら、ファイルでなく、**プログラムの入力**に渡します。RHEL 9 系では `systemd-coredump`、Ubuntu 24.04 では `apport` に渡す設定が既定です 【要確認】。`coredumpctl list` で見られます(systemd-coredump の場合)。
- コアダンプの大きさは、`ulimit -c`(0 だと保存されません)でも制限されます。

## 4.2 カーネルパラメータによるネットワーク最適化 (重要度3)

### 1. 送受信のバッファ

通信のデータは、送る前と受け取った後に、**ソケットバッファ**(メモリの領域)に入ります。

| パラメーター | 意味 | 既定値 |
|---|---|---|
| `net.core.rmem_max` | 受信バッファの、アプリが `setsockopt(SO_RCVBUF)` で指定できる上限(バイト) | 212992 の環境が多い 【要確認】 |
| `net.core.wmem_max` | 送信バッファの、`SO_SNDBUF` の上限(バイト) | 212992 の環境が多い 【要確認】 |

- TCP のバッファの自動調整は、`net.ipv4.tcp_rmem`、`tcp_wmem`(最小、既定、最大の 3 つの値)の最大値まで広がります。長距離の通信で 1 つの接続を速くしたいときは、この最大値も上げます。
- バッファの大きさの目安は、**帯域遅延積**(BDP)です。帯域 × 往復の時間(RTT)で求めます。
  - 例: 1 Gbps、RTT 80 ms なら、125 MB/s × 0.08 秒 = 10 MB。受信バッファがこれより小さいと、帯域を使い切れません。
- バッファを大きくすると、メモリを使います。接続の数が多いサーバーでは、すべての接続が大きく取らないよう、気を付けます。

### 2. 接続を受けるキュー

サーバーが接続を受けるまでには、2 つの待ち行列があります。

```text
client                             サーバー(listen 中)
   |
   |--- SYN ------------------>   [SYN キュー] SYN_RECV の接続が待つ
   |                                  上限: min(アプリの backlog, somaxconn)
   |                                  syncookies=0 なら tcp_max_syn_backlog も効く
   |<-- SYN+ACK ---------------
   |--- ACK ------------------>   [accept キュー] 確立済みで、accept() を待つ
   |                                  上限: min(アプリの backlog, net.core.somaxconn)
   |                                       |
   |                                       v  アプリが accept() で取り出す
```

| パラメーター | 意味 | 既定値 |
|---|---|---|
| `net.core.somaxconn` | `listen()` の backlog の上限。アプリが大きな値を指定しても、これで切られる | 4096(カーネル 5.4 以降。それより前は 128) |
| `net.ipv4.tcp_max_syn_backlog` | SYN を受けて、まだ ACK が来ていない接続の上限(リスナーごと)。SYN cookie が無効なときに効く | メモリの量で変わる(最小 128) |
| `net.core.netdev_max_backlog` | NIC から受け取ったパケットを、カーネルの処理を待たせておくキューの上限(CPU ごと) | 1000 |

- accept キューがあふれる原因は、アプリが `accept()` を呼ぶのが遅いこと(アプリが忙しい、スレッドが足りない)です。大きくしても、遅さが解消するわけではなく、一時的な急増を吸収するだけです。
- nginx の `listen ... backlog=N` や、`net.core.somaxconn` の片方だけを上げても、小さいほうに切られます。**両方**を確かめます。
- SYN キューがあふれると、`dmesg` に `TCP: request_sock_TCP: Possible SYN flooding on port 0.0.0.0:80. Sending cookies.` と出ます(SYN cookie で防ぐ動作)。古いカーネルでは、アドレスが付きません。通常の混雑でも出ます。
- NIC から受け取るパケットが多すぎると、`/proc/net/softnet_stat` の 2 列目(dropped、16 進数)が増えます。このときに `netdev_max_backlog` を上げます。

### 3. クライアント側のポートと TIME_WAIT

#### net.ipv4.ip_local_port_range

こちらから接続するとき(クライアント側)に使う、**一時ポート**(自動で選ばれる送信元のポート)の範囲です。既定は `32768 60999` で、約 28000 個です。

- 同じ宛先の IP アドレスとポートに、大量に接続するプロキシやロードバランサーでは、この範囲が足りなくなります。`connect` が `Cannot assign requested address`(EADDRNOTAVAIL)で失敗します。
- 範囲は、`net.ipv4.ip_local_port_range = 10000 65000` のように、空白で区切った 2 つの数で書きます。
- ほかのサービスが待ち受けるポートが範囲に含まれると、取り合いになります。`net.ipv4.ip_local_reserved_ports` で、除外するポートを指定できます。

#### TIME_WAIT

TCP の接続を、**先に閉じた側**は、閉じたあとも `TIME_WAIT` という状態でしばらく残ります。遅れて届いた古いパケットが、同じアドレスとポートの新しい接続に紛れ込むのを防ぐためです。Linux では、この時間は **60 秒で固定**です。

```text
通常の閉じ方(先に閉じる側 = サーバーの例)

closer                          peer   (左: 先に閉じる側、右: 相手)
   |--- FIN ---------------->
   |<-- ACK ----------------      先に閉じた側は FIN_WAIT_2 へ(tcp_fin_timeout の対象)
   |<-- FIN ----------------
   |--- ACK ---------------->
   |
   TIME_WAIT  約 60 秒(固定)。このあいだ、同じ 4 つ組は使えない
   |
   CLOSED
```

- 短い接続を大量に作るクライアント(プロキシ、負荷試験)では、TIME_WAIT が増えて、一時ポートが足りなくなります。数は `ss -s` で見ます。

| パラメーター | 意味 | 既定値 |
|---|---|---|
| `net.ipv4.tcp_tw_reuse` | 新しく**外へ接続する**とき、TIME_WAIT のソケットを、安全なら再利用する。0 は無効、1 は全体で有効、2 は loopback だけ | 2(新しいカーネル)【要確認】。以前は 0 |
| `net.ipv4.tcp_max_tw_buckets` | システム全体で持てる TIME_WAIT の数。超えると、TIME_WAIT のソケットがすぐに破棄され、`nstat` の `TcpExtTCPTimeWaitOverflow` が増える(ip-sysctl.rst は「警告が出る」と書くが、2.6.38 以降はログに出ない) | メモリの量で変わる |
| `net.ipv4.tcp_fin_timeout` | アプリが閉じたあと、相手の FIN を待つ状態(FIN_WAIT_2)に居られる時間(秒) | 60 |

- `tcp_fin_timeout` は、**TIME_WAIT の時間を変えません**。短くしても、TIME_WAIT は 60 秒のままです。
- `tcp_tw_reuse=1` は、TCP のタイムスタンプ(`net.ipv4.tcp_timestamps`)が有効なときに効きます。受け取る側(サーバー)でなく、**接続を作る側**の設定です。
- 昔使われた `net.ipv4.tcp_tw_recycle` は、NAT の内側のクライアントが接続できなくなる問題があり、カーネル 4.12 で**削除**されました。今のカーネルでは存在しません。
- `tcp_max_tw_buckets` を下げて TIME_WAIT を減らすのは、勧められません(ドキュメントも、下げずに増やすよう書いています)。根本の対策は、接続を使い回す(HTTP の keep-alive、接続プール)ことです。

### 4. 接続の追跡(conntrack)

iptables / nftables で状態を見るファイアウォールや NAT は、すべての接続を、**conntrack** という表で追跡します。`net.netfilter.nf_conntrack_max` が、表に入れられる接続の数の上限です。

- 表がいっぱいになると、`dmesg` に `nf_conntrack: table full, dropping packet` と出て、新しい接続のパケットが**捨てられます**。NAT ゲートウェイ、Kubernetes のノード、接続の多いサーバーで起こります。
- 現在の数は `/proc/sys/net/netfilter/nf_conntrack_count` で見ます。上限を上げると、そのぶんカーネルのメモリを使います。
- `nf_conntrack_max` は、`nf_conntrack` のモジュールが読み込まれて、はじめて存在します。`/etc/sysctl.d/` に書いても、起動のときに読み込みが早すぎると失敗します。モジュールを先に読み込む設定(`/etc/modules-load.d/`)を足します。
- 既定の上限は、メモリの量とハッシュ表の大きさ(`nf_conntrack_buckets`)から決まります。

### 5. タイムアウトと再送

| パラメーター | 意味 | 既定値 |
|---|---|---|
| `net.ipv4.tcp_syn_retries` | こちらから接続するとき、SYN を再送する回数。小さくすると、接続先が落ちているときに、早く諦める | 6 |
| `net.ipv4.tcp_orphan_retries` | アプリがすでに閉じた(close した)接続で、相手が応答しないときの、再送の回数 | 0(表示は 0。中では 8 として扱う) |
| `net.ipv4.tcp_slow_start_after_idle` | 通信が止まっていたあと、通信の速度を最初の小さい値からやり直す(スロースタート)か | 1(有効) |

- 接続先が落ちているとき、`tcp_syn_retries` が大きいと、`connect` が失敗するまで、1〜2 分かかります。ヘルスチェックや、すぐに別のサーバーに切り替えたい場合は、小さくします。ただし、一時的なパケット損失にも弱くなります。
- `tcp_orphan_retries` は、サーバー側の、閉じ済みなのに残る接続を早く片付けるのに使います。
- `tcp_slow_start_after_idle=0` にすると、しばらく通信しなかった長い接続(HTTP/2、gRPC、データベースの接続プール)が、再開したときに、また遅い速度から始まるのを避けられます。

### 6. keepalive

**TCP keepalive**は、通信が止まっている接続に、小さな確認のパケットを送って、相手が生きているかを調べる仕組みです。アプリが `SO_KEEPALIVE` を有効にした接続だけが対象です。

| パラメーター | 意味 | 既定値 |
|---|---|---|
| `net.ipv4.tcp_keepalive_time` | 通信が止まってから、最初の確認を送るまでの秒数 | 7200(2 時間) |
| `net.ipv4.tcp_keepalive_intvl` | 確認を再送する間隔(秒) | 75 |
| `net.ipv4.tcp_keepalive_probes` | 返事がないとき、何回送って諦めるか | 9 |

接続が切れたと判断するまでの時間は、`time + intvl × probes` です。既定では、7200 + 75 × 9 = 7875 秒(約 2 時間 11 分)です。

```text
通信が止まる
   |
   |-- tcp_keepalive_time (7200 秒) 待つ
   |
   |-- 確認 1 --> 返事なし
   |-- tcp_keepalive_intvl (75 秒) 待つ
   |-- 確認 2 --> 返事なし
   |     ... 合計 tcp_keepalive_probes (9) 回
   |
   接続を切れたと判断して、アプリにエラーを返す
```

- ロードバランサーやファイアウォールは、通信がない接続を、一定の時間(アイドルタイムアウト)で切ります。`tcp_keepalive_time` を、それより**短く**します。ただし、アプリが `SO_KEEPALIVE` を有効にしていなければ、効きません。
- 値を変えても、すでに開いている接続には、反映されないことがあります。

### 7. パケットの転送

`net.ipv4.ip_forward` は、受け取った自分宛てでないパケットを、ほかのインターフェースに**転送**するかどうかです。既定は 0(転送しない)です。

- Linux をルーターや NAT ゲートウェイにする、VPN の中継にする、Docker や Kubernetes のノードにする場合は 1 にします。
- 設定ファイルに書かずに `sysctl -w net.ipv4.ip_forward=1` だけだと、再起動で 0 に戻ります。
- IPv6 の転送は、別の `net.ipv6.conf.all.forwarding` です。
- この値を変えると、ほかの設定が既定に戻ることがあります(ドキュメントの注意)。変えたあとで、関連する設定を確かめます。

```bash
sudo sysctl -w net.ipv4.ip_forward=1
echo 'net.ipv4.ip_forward = 1' | sudo tee /etc/sysctl.d/90-forward.conf
```
