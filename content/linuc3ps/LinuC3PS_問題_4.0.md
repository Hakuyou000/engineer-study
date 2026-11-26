# LinuC3PS 問題 4.0 プラットフォームの最適化

対象: LinuC レベル3 3PS試験 Version 1.0 / 全33問 / すべてオリジナル問題
対応テキスト: `LinuC3PS_4.0_プラットフォームの最適化.md`
解答・解説は末尾。

## 問題

### 4.1 カーネルパラメータによるリソース最適化

**問1** `LinuC3PS-4.0-001` 物理メモリ 8 GB、スワップ 2 GB のサーバーで、`vm.overcommit_memory=2`、`vm.overcommit_ratio=50` を設定した。ヒュージページは使っていない。コミットできるメモリの上限はどれか。

- A. 4 GB
- B. 8 GB
- C. 6 GB
- D. 10 GB

**問2** `LinuC3PS-4.0-002` Redis のように、大きなプロセスが `fork` して子プロセスを作るサーバーで、メモリに余裕はあるのに、`fork` が `Cannot allocate memory` で失敗することがある。現在は `vm.overcommit_memory=0` である。メモリの要求を常に許すようにするには、どうするか。

- A. `vm.overcommit_memory=2` にする
- B. `vm.overcommit_memory=1` にする
- C. `vm.overcommit_ratio=0` にする
- D. `vm.swappiness=200` にする

**問3** `LinuC3PS-4.0-003` データベースサーバーで、時々、応答が数百ミリ秒止まる。調べると、Transparent Huge Pages(THP)が `always` になっていて、メモリの整理が原因と分かった。THP を、再起動するまでのあいだ無効にするコマンドはどれか。

- A. `sysctl -w vm.transparent_hugepage=0`
- B. `sysctl -w vm.nr_hugepages=0`
- C. `echo 0 > /proc/sys/vm/swappiness`
- D. `echo never > /sys/kernel/mm/transparent_hugepage/enabled`

**問4** `LinuC3PS-4.0-004` `vm.nr_hugepages=1024` を設定した。ヒュージページの大きさは 2 MB である。予約されるメモリの量はどれか。

- A. 2 GB
- B. 1 GB
- C. 4 GB
- D. 2 MB

**問5** `LinuC3PS-4.0-005` データベース専用のサーバーで、メモリ上のデータがスワップに追い出されるのを減らしたい。ただし、メモリが本当に足りなくなったときの余裕のため、スワップ領域は残したい。適切な設定はどれか。

- A. `vm.swappiness=200` にする
- B. `vm.swappiness=1` にする
- C. `vm.min_free_kbytes=0` にする
- D. `swapoff -a` を実行する

**問6** `LinuC3PS-4.0-006` ネットワークの受信が多いサーバーで、`dmesg` に `page allocation failure: order:0` が出ることがある。メモリの空きは十分にある。まず試す対策はどれか。

- A. `kernel.pid_max` を大きくする
- B. `vm.dirty_ratio` を 0 にする
- C. `vm.min_free_kbytes` を大きくする
- D. `fs.file-max` を小さくする

**問7** `LinuC3PS-4.0-007` ログを大量に書き込むサーバーで、dirty ページが溜まってから一気に書き出され、アプリの `write()` が数秒止まる。dirty ページがある割合を超えたとき、カーネルのスレッドが裏で書き出しを始める設定と、書き込んでいるプロセス自身が書き出す設定の組み合わせとして、正しいものはどれか。

- A. 裏で書き出しを始めるのが `vm.dirty_ratio`、プロセス自身が書き出すのが `vm.dirty_background_ratio`
- B. 裏で書き出しを始めるのが `vm.dirty_expire_centisecs`、プロセス自身が書き出すのが `vm.dirty_writeback_centisecs`
- C. 裏で書き出しを始めるのが `vm.min_free_kbytes`、プロセス自身が書き出すのが `vm.swappiness`
- D. 裏で書き出しを始めるのが `vm.dirty_background_ratio`、プロセス自身が書き出すのが `vm.dirty_ratio`

**問8** `LinuC3PS-4.0-008` `vm.dirty_expire_centisecs=1500`、`vm.dirty_writeback_centisecs=200` を設定した。動きの説明として正しいものはどれか。

- A. 書き出し用のスレッドが 2 秒ごとに起き、dirty になってから 15 秒以上たったデータを書き出す
- B. 書き出し用のスレッドが 15 秒ごとに起き、dirty になってから 2 秒以上たったデータを書き出す
- C. 書き出し用のスレッドが 200 秒ごとに起き、dirty になってから 1500 秒以上たったデータを書き出す
- D. dirty ページが全体の 15 パーセントに達すると裏で書き出し、200 ページ以上で書き込みが止まる

**問9** `LinuC3PS-4.0-009` root で、サービスの起動前に `ulimit -n 2000000` を実行したところ、失敗した。システムの `fs.nr_open` は 1048576 である。値を大きくできるようにするために、先に変えるべきものはどれか。

- A. `fs.aio-max-nr` を 2000000 以上にする
- B. `kernel.threads-max` を 2000000 以上にする
- C. `fs.nr_open` を 2000000 以上にする
- D. `vm.overcommit_memory` を 1 にする

**問10** `LinuC3PS-4.0-010` アプリが `fork: retry: Resource temporarily unavailable` を出して、新しいスレッドとプロセスを作れなくなった。コンテナと `ulimit -u` の制限は関係ないと確かめてある。システム全体の設定として確かめるべきものを**2つ**選べ。

- A. `kernel.pid_max`
- B. `fs.aio-max-nr`
- C. `kernel.threads-max`
- D. `vm.swappiness`

**問11** `LinuC3PS-4.0-011` データベースが非同期 I/O を使おうとして、`io_setup` が `EAGAIN` で失敗する。システム全体の非同期 I/O の要求の数の上限を決める、sysctl のパラメーター名を答えよ。


**問12** `LinuC3PS-4.0-012` 高可用性クラスターのノードで、メモリ不足(OOM)になったら、中途半端な状態で動き続けずに、すぐ落ちて 10 秒後に自動で再起動し、別のノードに切り替わるようにしたい。適切な設定の組み合わせはどれか。

- A. `vm.panic_on_oom=0` と `kernel.panic=0`
- B. `vm.panic_on_oom=1` と `kernel.panic=10`
- C. `vm.panic_on_oom=1` と `kernel.panic=0`
- D. `vm.panic_on_oom=0` と `kernel.panic=10`

**問13** `LinuC3PS-4.0-013` `kernel.core_pattern` に `/var/crash/core.%e.%p.%t` を設定した。この書式の中で、コアダンプを出したプロセスの PID(プロセス ID)に置き換えられる部分を答えよ(`%` から始まる 2 文字)。


**問14** `LinuC3PS-4.0-014` `/etc/sysctl.d/90-tuning.conf` を作った。再起動せずに、`/etc/sysctl.d/` などの、すべての設定ファイルを読み込み直すコマンドを答えよ(sudo は不要)。


**問15** `LinuC3PS-4.0-015` 多数のクライアントを受けるサーバーで、アプリのログに `Too many open files in system` が出た。システム全体のファイルハンドルの上限を決める sysctl のパラメーターはどれか。

- A. `fs.nr_open`
- B. `kernel.pid_max`
- C. `kernel.core_pattern`
- D. `fs.file-max`

### 4.2 カーネルパラメータによるネットワーク最適化

**問16** `LinuC3PS-4.0-016` 帯域 1 Gbps、往復の時間(RTT)80 ミリ秒の回線で、1 つの TCP 接続の速度を帯域いっぱいまで出したい。必要な受信バッファの大きさの目安(帯域遅延積)に最も近いものはどれか。

- A. 125 KB
- B. 1 MB
- C. 100 MB
- D. 10 MB

**問17** `LinuC3PS-4.0-017` アプリが `setsockopt(SO_RCVBUF)` で 16 MB の受信バッファを要求したが、要求どおりの大きさにならず、`getsockopt` で確かめると 416 KB 程度(425984 バイト)になっている。`net.core.rmem_max` は 212992 である。原因はどれか。

- A. 要求したバッファの大きさが `net.core.rmem_max` で切られている
- B. `net.core.somaxconn` が小さい
- C. `net.ipv4.ip_local_port_range` が狭い
- D. `net.ipv4.ip_forward` が 0 である

**問18** `LinuC3PS-4.0-018` nginx に `listen 80 backlog=8192;` を設定している。カーネルは 5.4 より新しく、`net.core.somaxconn=1024` に設定してある。接続を待たせる accept キューの、実際の上限はどれか。

- A. 8192
- B. 1024
- C. 4096
- D. 128

**問19** `LinuC3PS-4.0-019` 10 Gbps の NIC で、パケットを大量に受け取るサーバーで、`/proc/net/softnet_stat` の 2 列目(dropped)の値が増え続けている。カーネルが NIC からのパケットを処理待ちにするキューがあふれていると考えられる。上げるべきパラメーターはどれか。

- A. `net.ipv4.tcp_max_syn_backlog`
- B. `net.ipv4.tcp_fin_timeout`
- C. `net.core.netdev_max_backlog`
- D. `net.ipv4.tcp_keepalive_time`

**問20** `LinuC3PS-4.0-020` Web サーバーの `dmesg` に `TCP: request_sock_TCP: Possible SYN flooding on port 0.0.0.0:443. Sending cookies.` が出た。SYN を受けて ACK を待つ接続のキューや、接続を待たせるキューの大きさに関わるパラメーターを**2つ**選べ。

- A. `net.ipv4.tcp_fin_timeout`
- B. `net.ipv4.tcp_max_syn_backlog`
- C. `net.ipv4.ip_forward`
- D. `net.core.somaxconn`

**問21** `LinuC3PS-4.0-021` Linux 上のリバースプロキシが、同じバックエンドの IP アドレスとポートに、短い接続を毎秒数千回作っている。ある時間から、`connect` が `Cannot assign requested address` で失敗し始めた。原因として最も可能性が高いものはどれか。

- A. 一時ポートの範囲(`net.ipv4.ip_local_port_range`)を、TIME_WAIT の接続が使い切った
- B. accept キューが小さい(`net.core.somaxconn`)
- C. ファイルを開ける数の上限(`fs.file-max`)に達した
- D. `net.ipv4.ip_forward` が 1 になっている

**問22** `LinuC3PS-4.0-022` 負荷試験用のクライアントで、TIME_WAIT が大量に残るのを減らそうとして、`net.ipv4.tcp_fin_timeout` を 60 から 10 に変えた。その結果として、正しいものはどれか。

- A. TIME_WAIT の時間が 60 秒から 10 秒に短くなる
- B. TIME_WAIT のソケットが、新しい接続に再利用されるようになる
- C. TIME_WAIT のソケットの数の上限が 10 に下がる
- D. FIN_WAIT_2 に居られる時間は短くなるが、TIME_WAIT の時間は変わらない

**問23** `LinuC3PS-4.0-023` TCP の TIME_WAIT について、正しい説明を**2つ**選べ。

- A. 接続を先に閉じた側に残る
- B. 相手の FIN を待っている状態で、`tcp_fin_timeout` で時間を決める
- C. 通信がない接続の確認のために送るパケットのことで、`tcp_keepalive_time` で決める
- D. 遅れて届いた古いパケットが、同じアドレスとポートの新しい接続に紛れ込むのを防ぐ

**問24** `LinuC3PS-4.0-024` Linux のリバースプロキシからバックエンドへの短い接続で、TIME_WAIT が増えて、一時ポートが足りなくなる。カーネルの設定で、安全に TIME_WAIT のソケットを、新しく外へ接続するときに再利用できるようにするものはどれか(TCP のタイムスタンプは有効である)。

- A. `net.ipv4.tcp_max_tw_buckets=1`
- B. `net.ipv4.tcp_orphan_retries=0`
- C. `net.ipv4.tcp_tw_reuse=1`
- D. `net.ipv4.tcp_slow_start_after_idle=0`

**問25** `LinuC3PS-4.0-025` 古い手順書に従って、`sysctl -w net.ipv4.tcp_tw_recycle=1` を実行したところ、Linux 6 系のカーネルで「そのようなファイルやディレクトリはありません」というエラーになった。理由はどれか。

- A. `tcp_tw_recycle` は、root 以外のユーザーが実行したので拒否された
- B. `tcp_tw_recycle` は、NAT の内側のクライアントが接続できなくなる問題があり、カーネル 4.12 で削除された
- C. `tcp_tw_recycle` は、`nf_conntrack` のモジュールを読み込まないと現れない
- D. `tcp_tw_recycle` は、IPv6 専用で、名前が `net.ipv6.` から始まる

**問26** `LinuC3PS-4.0-026` プロキシのサーバーで、`nstat -az TcpExtTCPTimeWaitOverflow` の値が増え続けている。この意味として正しいものはどれか。

- A. TIME_WAIT のソケットの数が `net.ipv4.tcp_max_tw_buckets` を超え、超えたぶんがすぐに破棄された
- B. accept キューがあふれて、新しい接続が断られた
- C. conntrack の表がいっぱいになって、パケットが捨てられた
- D. 一時ポートが足りなくなって、`connect` が失敗した

**問27** `LinuC3PS-4.0-027` NAT ゲートウェイの `dmesg` に `nf_conntrack: table full, dropping packet` が出て、新しい接続が捨てられている。conntrack の表に入れられる接続の数の上限を決める sysctl のパラメーター名を答えよ。


**問28** `LinuC3PS-4.0-028` Kubernetes のノードで、`/etc/sysctl.d/90-ct.conf` に `net.netfilter.nf_conntrack_max = 524288` を書いたが、起動時に systemd-sysctl が「そのようなファイルがありません」と警告を出し、値が反映されていない。起動が終わってから `sysctl --system` を実行すると反映される。原因はどれか。

- A. 設定ファイルの名前が `90-` で始まっているので無視された
- B. `nf_conntrack_max` は、`sysctl -w` でしか変えられない
- C. `nf_conntrack_max` の値は、再起動で必ず 65536 に戻る
- D. 設定を読む時点で、`nf_conntrack` のモジュールがまだ読み込まれていなかった

**問29** `LinuC3PS-4.0-029` アプリが、落ちているバックエンドに `connect` したとき、失敗が分かるまで 1 分以上かかる。これをできるだけ短くしたい。変更するパラメーターとして、最も適切なものはどれか。

- A. `net.ipv4.tcp_synack_retries` を大きくする
- B. `net.ipv4.tcp_fin_timeout` を大きくする
- C. `net.ipv4.tcp_syn_retries` を小さくする
- D. `net.ipv4.tcp_keepalive_probes` を大きくする

**問30** `LinuC3PS-4.0-030` `net.ipv4.tcp_orphan_retries` の説明として、正しいものはどれか。

- A. こちらから接続するとき、SYN を再送する回数を決める
- B. アプリがすでに閉じた(close した)接続で、相手が応答しないとき、再送を続ける回数を決める
- C. `listen()` で待っている接続のうち、まだ ACK が来ていないものの数を決める
- D. 通信が止まった接続に、確認のパケットを送る回数を決める

**問31** `LinuC3PS-4.0-031` HTTP/2 や gRPC のように、長く開いたままの接続で、しばらく通信しなかったあとに再開すると、速度が最初の遅い状態からやり直しになる。この動きを無効にする sysctl のパラメーター名を答えよ。


**問32** `LinuC3PS-4.0-032` `net.ipv4.tcp_keepalive_time=600`、`net.ipv4.tcp_keepalive_intvl=30`、`net.ipv4.tcp_keepalive_probes=5` を設定した。アプリは `SO_KEEPALIVE` を有効にしている。通信が止まってから、接続が切れたとカーネルが判断するまでの時間はどれか。

- A. 750 秒
- B. 630 秒
- C. 3000 秒
- D. 7875 秒

**問33** `LinuC3PS-4.0-033` Linux のサーバーに NIC を 2 枚つけ、2 つのネットワークの間のルーターにした。それぞれのネットワークのホストから、このサーバー自身には通信できるが、反対側のネットワークには届かない。サーバー側の設定として、足りないものはどれか。

- A. `net.ipv4.ip_local_port_range` の広げ直し
- B. `net.core.rmem_max` の引き上げ
- C. `net.ipv4.tcp_syn_retries=0`
- D. `net.ipv4.ip_forward=1`

## 解答・解説

### 問1 `LinuC3PS-4.0-001`

**正解**: C

**テキスト**: 2. メモリの割り当てと余裕

2 のときの上限は「スワップ + 物理メモリ × ratio ÷ 100」です。2 GB + 8 GB × 0.5 = 6 GB になります。これを超える要求は、その場で失敗します。

- A. ratio 分(4 GB)だけを数えていて、スワップが足りません。
- B. 物理メモリの全部です。ratio が 100 のときの値で、スワップも足されません。
- D. 物理メモリとスワップの合計です。ratio が 100 のときの値です。

### 問2 `LinuC3PS-4.0-002`

**正解**: B

**テキスト**: 2. メモリの割り当てと余裕

1 は、メモリの要求を常に許します。実際に足りなくなったときだけ、OOM killer が働きます。子プロセスは親とメモリを共有して始まるので、1 にすると `fork` が失敗しにくくなります。

- A. 2 は、上限を超える要求を断る設定です。`fork` は、さらに失敗しやすくなります。
- C. `vm.overcommit_ratio` は、2 のときだけ使われます。0 にしても、今の設定は変わりません。
- D. `vm.swappiness` は、スワップを使う頻度の設定で、要求を許すかどうかとは関係がありません。

### 問3 `LinuC3PS-4.0-003`

**正解**: D

**テキスト**: 3. ヒュージページ

THP の設定は `/sys/kernel/mm/transparent_hugepage/enabled` で、`never` を書くと無効になります。再起動で元に戻るので、残すにはカーネルの起動オプション `transparent_hugepage=never` などを使います。

- A. `vm.transparent_hugepage` という sysctl の名前はありません。
- B. `vm.nr_hugepages` は、明示的なヒュージページの予約数です。0 にしても THP は無効になりません。
- C. `vm.swappiness` はスワップを使う頻度で、THP とは関係がありません。

### 問4 `LinuC3PS-4.0-004`

**正解**: A

**テキスト**: 3. ヒュージページ

2 MB × 1024 = 2048 MB で、2 GB です。予約したメモリは、使われなくても、ほかの用途に使えません。

- B. 1 GB にするには、512 ページが必要です。
- C. 4 GB にするには、2048 ページが必要です。
- D. 2 MB は、ヒュージページ 1 つぶんの大きさです。

### 問5 `LinuC3PS-4.0-005`

**正解**: B

**テキスト**: 2. メモリの割り当てと余裕

`vm.swappiness` を小さくすると、スワップを使いにくくなります。スワップ領域は残るので、メモリが足りなくなったときの余裕になります。

- A. 値を大きくすると、スワップを積極的に使います。逆の効果です。
- C. `vm.min_free_kbytes` は、空けておくメモリの量です。0 にしても、スワップの使い方は変わらず、1024 KB より小さくするとカーネルが不安定になります。
- D. スワップ領域そのものを無効にします。「スワップ領域は残したい」という条件に合いません。

### 問6 `LinuC3PS-4.0-006`

**正解**: C

**テキスト**: 2. メモリの割り当てと余裕

`vm.min_free_kbytes` は、カーネルが常に空けておくメモリの量です。受信のとき、カーネルが急にメモリを必要としても、確保できるようになります。

- A. `kernel.pid_max` は、プロセス ID の最大値で、メモリの確保とは関係がありません。
- B. `vm.dirty_ratio` は、書き込みが止まるしきい値です。0 にすると、書き込みのたびにプロセスが書き出すことになり、むしろ遅くなります。
- D. `fs.file-max` は、開けるファイルの数の上限です。メモリの確保の失敗とは関係がありません。

### 問7 `LinuC3PS-4.0-007`

**正解**: D

**テキスト**: 4. 書き込み(dirty ページ)の制御

`vm.dirty_background_ratio`(既定は多くの環境で 10)に達すると、カーネルのスレッドが裏で書き出し始めます。`vm.dirty_ratio`(既定は 20)に達すると、書き込んでいるプロセス自身が書き出すので、`write()` が止まって見えます。止まりを減らすには、`vm.dirty_background_ratio` を下げて、早めに少しずつ書き出させます。

- A. 2 つが逆です。裏の書き出しのほうが、小さい割合で始まります。
- B. この 2 つは割合でなく、時間の設定です。`vm.dirty_expire_centisecs` は書き出し対象になるまでの古さ、`vm.dirty_writeback_centisecs` は書き出しのスレッドが起きる間隔です。
- C. この 2 つは、書き出しのしきい値ではありません。`vm.min_free_kbytes` は空けておく量、`vm.swappiness` はスワップの使いやすさです。

### 問8 `LinuC3PS-4.0-008`

**正解**: A

**テキスト**: 4. 書き込み(dirty ページ)の制御

単位は 1/100 秒(センチ秒)です。`dirty_writeback_centisecs=200` は 2 秒ごとに起きること、`dirty_expire_centisecs=1500` は 15 秒以上たったデータが対象になることを表します。

- B. 2 つの値が入れ替わっています。起きる間隔が writeback、古さが expire です。
- C. 単位を秒と間違えています。センチ秒は 1/100 秒です。
- D. この 2 つは割合でも、ページ数でもなく、時間の設定です。割合の設定は `vm.dirty_background_ratio` と `vm.dirty_ratio` です。

### 問9 `LinuC3PS-4.0-009`

**正解**: C

**テキスト**: 5. プロセスとファイルの数の上限

`fs.nr_open` は、1 つのプロセスが持てるファイルの数の限界で、`ulimit -n` はこれを超えられません。先に `fs.nr_open` を上げます。systemd のサービスなら、`LimitNOFILE` も合わせて設定します。

- A. `fs.aio-max-nr` は、非同期 I/O の要求の数の上限で、開けるファイルの数とは別です。
- B. `kernel.threads-max` は、スレッドの数の上限です。
- D. `vm.overcommit_memory` はメモリの要求の許し方で、ファイルの数とは関係がありません。

### 問10 `LinuC3PS-4.0-010`

**正解**: A、C

**テキスト**: 5. プロセスとファイルの数の上限

プロセスとスレッドには、それぞれ PID を割り当てるので、PID の最大値(`kernel.pid_max`)と、システム全体のスレッドの数の上限(`kernel.threads-max`)が、どちらも足りなくなる原因になります。

- B. `fs.aio-max-nr` は、非同期 I/O の要求の数の上限です。足りなくなると、`io_setup` が失敗します。
- D. `vm.swappiness` は、スワップを使う頻度で、プロセスの数を制限しません。

### 問11 `LinuC3PS-4.0-011`

**正解**: `fs.aio-max-nr`、`aio-max-nr`、`/proc/sys/fs/aio-max-nr`

**テキスト**: 5. プロセスとファイルの数の上限

`fs.aio-max-nr` が、システム全体の非同期 I/O の要求の数の上限です。現在の使用数は `fs.aio-nr` で見ます。上げても、メモリがすぐに確保されるわけではありません。

### 問12 `LinuC3PS-4.0-012`

**正解**: B

**テキスト**: 6. 異常のときの動き

`vm.panic_on_oom=1` で、OOM のときに OOM killer でなくカーネルパニックにします。`kernel.panic=10` で、パニックの 10 秒後に自動で再起動します。両方が必要です。

- A. どちらも既定の値です。OOM killer がプロセスを終了させるだけで、ノードは落ちません。
- C. パニックにはなりますが、`kernel.panic=0` は再起動しない設定です。止まったままになります。
- D. `vm.panic_on_oom=0` では OOM でパニックにならないので、再起動の設定が使われません。

### 問13 `LinuC3PS-4.0-013`

**正解**: `%p`

**テキスト**: 6. 異常のときの動き

`%p` は PID、`%e` は実行ファイルの名前、`%t` は UNIX 時間に置き換えられます。たとえば PID 1234 の nginx なら、`core.nginx.1234.…` のようなファイル名になります。

### 問14 `LinuC3PS-4.0-014`

**正解**: `sysctl --system`、`systemctl restart systemd-sysctl`、`systemctl restart systemd-sysctl.service`

**テキスト**: 1. sysctl の基本

`sysctl --system` は、`/etc/sysctl.d/`、`/usr/lib/sysctl.d/`、`/etc/sysctl.conf` などをすべて読み込みます。`sysctl -p` は、引数がなければ `/etc/sysctl.conf` だけを読み込むので、この条件を満たしません。`systemctl restart systemd-sysctl` は、起動時と同じ処理をやり直すので、同じ結果になります(root の権限が要ります)。

### 問15 `LinuC3PS-4.0-015`

**正解**: D

**テキスト**: 5. プロセスとファイルの数の上限

`Too many open files in system`(ENFILE)は、システム全体の上限に達したことを表します。上限は `fs.file-max` で、現在の使用数は `/proc/sys/fs/file-nr` で見ます。1 つのプロセスの上限に達したときは、`Too many open files`(EMFILE)で、`ulimit -n` を確かめます。

- A. `fs.nr_open` は、1 つのプロセスの上限の限界で、システム全体の上限ではありません。
- B. `kernel.pid_max` は、プロセス ID の最大値です。
- C. `kernel.core_pattern` は、コアダンプの保存先の設定です。

### 問16 `LinuC3PS-4.0-016`

**正解**: D

**テキスト**: 1. 送受信のバッファ

帯域遅延積は、帯域 × RTT です。1 Gbps は 125 MB/s なので、125 MB/s × 0.08 秒 = 10 MB です。受信バッファがこれより小さいと、帯域を使い切れません。

- A. 1 Gbps ÷ 8 = 125 MB/s の、1 秒ぶんですらありません。単位を間違えています。
- B. RTT を 8 ミリ秒と取ったときの値です。
- C. RTT を 800 ミリ秒と取ったときの値です。

### 問17 `LinuC3PS-4.0-017`

**正解**: A

**テキスト**: 1. 送受信のバッファ

`net.core.rmem_max` は、アプリが `SO_RCVBUF` で指定できる受信バッファの上限です。要求がこれを超えても、この上限に切られます。カーネルは、切った値を 2 倍にして持ちます(管理用の領域のため)。`getsockopt` が返すのも 2 倍の値で、212992 なら 425984 バイトです。送信側は `net.core.wmem_max` です。

- B. `somaxconn` は、`listen()` の待ち行列の上限で、バッファの大きさとは関係がありません。
- C. `ip_local_port_range` は、使える送信元ポートの範囲です。
- D. `ip_forward` は、パケットの転送の設定です。

### 問18 `LinuC3PS-4.0-018`

**正解**: B

**テキスト**: 2. 接続を受けるキュー

accept キューの上限は、アプリが指定した backlog と `net.core.somaxconn` の小さいほうです。8192 と 1024 の小さいほうの、1024 になります。8192 にしたければ、`net.core.somaxconn` も上げます。

- A. アプリの指定した値は、`net.core.somaxconn` を超えられません。
- C. 4096 は、カーネル 5.4 以降の `somaxconn` の既定値です。今回は 1024 に設定してあります。
- D. 128 は、カーネル 5.4 より前の `somaxconn` の既定値です。

### 問19 `LinuC3PS-4.0-019`

**正解**: C

**テキスト**: 2. 接続を受けるキュー

`net.core.netdev_max_backlog` は、NIC から受け取ったパケットを、CPU ごとのキューに入れて処理を待たせる、その上限です。`softnet_stat` の dropped は、このキューがあふれて捨てたパケットの数です。

- A. `tcp_max_syn_backlog` は、SYN を受けて ACK を待つ接続の上限で、NIC から受けるキューではありません。
- B. `tcp_fin_timeout` は、FIN_WAIT_2 に居られる時間です。
- D. `tcp_keepalive_time` は、keepalive の確認を始めるまでの時間です。

### 問20 `LinuC3PS-4.0-020`

**正解**: B、D

**テキスト**: 2. 接続を受けるキュー

このメッセージは、SYN を受けて ACK を待つ接続が、待ち受けの backlog(アプリの指定と `net.core.somaxconn` の小さいほう)に達したときに出ます。`net.ipv4.tcp_max_syn_backlog` は、SYN cookie を無効にしているときに、SYN を受け付ける量を決めます。ip-sysctl.rst も、上げるときは `somaxconn` もあわせて確かめるよう書いています。

- A. `tcp_fin_timeout` は、接続を閉じるときの FIN_WAIT_2 の時間で、接続を受けるキューとは関係がありません。
- C. `ip_forward` は、パケットの転送の設定です。

### 問21 `LinuC3PS-4.0-021`

**正解**: A

**テキスト**: 3. クライアント側のポートと TIME_WAIT

同じ宛先に接続するには、送信元のポートが 1 つずつ必要です。既定の範囲は約 28000 個で、閉じた接続が TIME_WAIT で 60 秒残ると、短い接続を毎秒数千回作る場合は足りなくなります。範囲を広げる、接続を使い回す、が対策です。

- B. accept キューは、サーバー側で接続を受けるときの話です。このプロキシは接続を作る側で、エラーも違います。
- C. `fs.file-max` に達したときのエラーは、`Too many open files in system`(ENFILE)です。
- D. `ip_forward` は、パケットを転送する設定で、`connect` のエラーとは関係がありません。

### 問22 `LinuC3PS-4.0-022`

**正解**: D

**テキスト**: 3. クライアント側のポートと TIME_WAIT

`tcp_fin_timeout` は、アプリが閉じたあと、相手の FIN を待つ状態(FIN_WAIT_2)の時間です。Linux では TIME_WAIT の時間は 60 秒で固定されていて、この設定では変わりません。

- A. よくある誤解です。TIME_WAIT の時間は、この設定とは別に固定されています。
- B. 再利用は `net.ipv4.tcp_tw_reuse` の設定です。
- C. TIME_WAIT の数の上限は `net.ipv4.tcp_max_tw_buckets` です。

### 問23 `LinuC3PS-4.0-023`

**正解**: A、D

**テキスト**: 3. クライアント側のポートと TIME_WAIT

TIME_WAIT は、接続を先に閉じた側が、閉じたあとにしばらく残す状態です。遅れて届いた古いパケットが、新しい接続に紛れ込むのを防ぎます。Linux では約 60 秒で固定です。

- B. これは FIN_WAIT_2 の説明です。TIME_WAIT の時間は `tcp_fin_timeout` では変わりません。
- C. これは keepalive の説明で、TIME_WAIT とは別のものです。

### 問24 `LinuC3PS-4.0-024`

**正解**: C

**テキスト**: 3. クライアント側のポートと TIME_WAIT

`tcp_tw_reuse=1` は、新しく外へ接続するとき、TIME_WAIT のソケットを、安全なら再利用します。接続を作る側(クライアント側)の設定で、タイムスタンプが有効であることが前提です。

- A. `tcp_max_tw_buckets` は TIME_WAIT の数の上限です。1 にすると、ほとんどの TIME_WAIT がすぐに破棄されます(`nstat` の `TcpExtTCPTimeWaitOverflow` が増えます)。ドキュメントも下げることを勧めていません。
- B. `tcp_orphan_retries` は、閉じ済みの接続の再送の回数です。
- D. `tcp_slow_start_after_idle` は、通信が止まったあとの速度の設定です。

### 問25 `LinuC3PS-4.0-025`

**正解**: B

**テキスト**: 3. クライアント側のポートと TIME_WAIT

`tcp_tw_recycle` は、NAT の内側から来る複数のクライアントで接続が失敗する問題があり、カーネル 4.12 で削除されました。今は `tcp_tw_reuse` を使います。

- A. 権限の問題なら、エラーは「許可がありません」になります。名前そのものがありません。
- C. モジュールの読み込みで現れる名前は、`nf_conntrack` のものなどです。`tcp_tw_recycle` は関係がありません。
- D. `tcp_tw_recycle` は IPv4 の設定でした。IPv6 専用ではありません。

### 問26 `LinuC3PS-4.0-026`

**正解**: A

**テキスト**: 3. クライアント側のポートと TIME_WAIT

TIME_WAIT のソケットの数が、`net.ipv4.tcp_max_tw_buckets` の上限を超えると、超えたぶんは TIME_WAIT を待たずに破棄され、この計数が増えます。ログには出ません(カーネル 2.6.38 以降)。この上限は DoS 攻撃を防ぐためのもので、ドキュメントは「下げずに、必要なら増やす」よう書いています。

- B. accept キューのあふれは、別の指標(`netstat -s` の `listen queue` など)に出ます。
- C. conntrack の表がいっぱいのときは、`nf_conntrack: table full, dropping packet` と出ます。
- D. 一時ポートが足りないときは、`connect` のエラーとして出ます。この計数ではありません。

### 問27 `LinuC3PS-4.0-027`

**正解**: `net.netfilter.nf_conntrack_max`、`nf_conntrack_max`、`net.nf_conntrack_max`、`/proc/sys/net/netfilter/nf_conntrack_max`

**テキスト**: 4. 接続の追跡(conntrack)

`net.netfilter.nf_conntrack_max` が、conntrack の表の上限です。現在の数は `/proc/sys/net/netfilter/nf_conntrack_count` で見ます。上げると、そのぶんカーネルのメモリを使います。

### 問28 `LinuC3PS-4.0-028`

**正解**: D

**テキスト**: 4. 接続の追跡(conntrack)

`net.netfilter.nf_conntrack_max` は、`nf_conntrack` のモジュールが読み込まれてはじめて存在します。起動の早い段階で設定を読むと、まだ存在しません。`/etc/modules-load.d/` で、モジュールを先に読み込むようにします。

- A. `90-` のような番号は、読み込む順番を決めるだけで、無視されることはありません。
- B. 設定ファイルでも変えられます。起動時に存在するかが問題です。
- C. そのような決まりはありません。

### 問29 `LinuC3PS-4.0-029`

**正解**: C

**テキスト**: 5. タイムアウトと再送

`net.ipv4.tcp_syn_retries` は、こちらから接続するときの、SYN の再送の回数です。小さくすると、接続先が落ちているときに早く諦められます。ただし、一時的なパケット損失にも弱くなります。

- A. `tcp_synack_retries` は、サーバー側が SYN+ACK を再送する回数です。接続する側の待ち時間とは関係がありません。
- B. `tcp_fin_timeout` は、接続を閉じるときの FIN_WAIT_2 の時間です。大きくしても短くなりません。
- D. `tcp_keepalive_probes` は、確立済みの接続の keepalive の確認の回数です。接続が確立する前の待ち時間とは関係がありません。

### 問30 `LinuC3PS-4.0-030`

**正解**: B

**テキスト**: 5. タイムアウトと再送

「orphan(孤児)」は、アプリが `close()` したのに、カーネルにまだ残っている接続のことです。相手が応答しないとき、再送の回数を決めます。負荷の高い Web サーバーでは、こういう接続が資源を使うので、小さくすることがあります。

- A. これは `tcp_syn_retries` です。
- C. これは `tcp_max_syn_backlog` の説明です。
- D. これは `tcp_keepalive_probes` です。

### 問31 `LinuC3PS-4.0-031`

**正解**: `net.ipv4.tcp_slow_start_after_idle`、`tcp_slow_start_after_idle`、`/proc/sys/net/ipv4/tcp_slow_start_after_idle`

**テキスト**: 5. タイムアウトと再送

`net.ipv4.tcp_slow_start_after_idle` を 0 にすると、通信が止まったあとでも、輻輳ウィンドウ(送れる量)を縮めず、速度を維持します。既定は 1(有効)です。

### 問32 `LinuC3PS-4.0-032`

**正解**: A

**テキスト**: 6. keepalive

判断までの時間は、`time + intvl × probes` です。600 + 30 × 5 = 750 秒です。

- B. 600 + 30 = 630 秒は、probes の回数を掛けていません。
- C. 600 × 5 = 3000 秒は、`time` に回数を掛けています。掛けるのは `intvl` です。
- D. 7875 秒は、既定値(7200 + 75 × 9)の場合です。

### 問33 `LinuC3PS-4.0-033`

**正解**: D

**テキスト**: 7. パケットの転送

`net.ipv4.ip_forward` が 0(既定)だと、自分宛てでないパケットを転送しません。ルーターや NAT ゲートウェイにするには、1 にします。`sysctl -w` だけでは再起動で戻るので、`/etc/sysctl.d/` にも書きます。

- A. 一時ポートの範囲は、このサーバー自身が接続を作るときの設定です。転送とは関係がありません。
- B. 受信バッファの上限で、転送とは関係がありません。
- C. SYN の再送の回数で、転送とは関係がありません。
