# LinuC 201 テキスト 2.04 システムの保守と運用管理

ソースコードからソフトウェアを作る、バックアップを取って戻す、利用者に知らせる、資源の使い方を調べる、監視する、構成管理で自動化する、までを学びます。

## 2.04.1 makeによるソースコードからのビルドとインストール (重要度3)

### 1. ソースからソフトウェアを入れるまでの流れ

パッケージ(apt や dnf で入れるもの)がない、または最新版を試したいときは、**ソースコード**(人が書いたプログラム)から自分で作ります。作ることを**ビルド**と呼びます。

```text
[source]     git clone、または tar のアーカイブを展開
    |
    |  必要なら patch で修正を当てる
    v
[configure]  ./configure --prefix=/opt/app
    |        環境を調べて Makefile を作る
    v
[make]       make
    |        コンパイルして実行ファイルを作る
    v
[install]    sudo make install
             prefix の下にコピーする
```

- ビルドには、コンパイラ(gcc)と make が要ります。Debian 系は `sudo apt install build-essential`、Red Hat 系は `sudo dnf groupinstall "Development Tools"` で、まとめて入ります。
- ソフトウェアごとに、必要な開発用のパッケージ(`-dev` や `-devel`)も要ります。足りないと `configure` が止まります。

### 2. ソースを手に入れる(git)

**git** は、ソースコードの履歴を管理する道具です。公開されているソースは、`git clone` で手元に写します。

```bash
git clone https://example.com/project/tool.git   # リポジトリを丸ごと写す(tool ディレクトリができる)
cd tool
git tag -l                                       # 版の目印(タグ)の一覧
git checkout v1.4.2                              # その版のソースに切り替える
```

| コマンド | 動き |
|---|---|
| `git clone URL` | リポジトリを手元に写す |
| `git tag -l` | タグの一覧。リリースの版は、たいていタグになっている |
| `git checkout タグ名` | 作業ディレクトリを、そのタグの時点のソースにする |

- `git clone` した直後は最新の開発中のソースです。安定した版を使うなら、タグに `git checkout` します。

### 3. アーカイブの展開と圧縮

配布されるソースは、`.tar.gz` のような**アーカイブ**(複数のファイルを 1 つにまとめたもの)であることが多いです。

| 道具 | 拡張子 | 圧縮 | 展開 |
|---|---|---|---|
| gzip | `.gz` | `gzip file` | `gunzip file.gz`(`gzip -d`) |
| bzip2 | `.bz2` | `bzip2 file` | `bunzip2 file.bz2` |
| xz | `.xz` | `xz file` | `unxz file.xz` |
| zip | `.zip` | `zip -r a.zip dir` | `unzip a.zip` |

- gzip、bzip2、xz は 1 つのファイルを圧縮します。ディレクトリは、先に tar でまとめます。
- 圧縮の強さは、一般に gzip < bzip2 < xz の順に高く、時間もこの順にかかります。
- `zip` と `unzip` は、まとめることと圧縮を 1 つでします。Windows とのやり取りに使います。

```bash
tar -czf src.tar.gz  dir/      # c=作る z=gzip f=ファイル名
tar -cjf src.tar.bz2 dir/      # j=bzip2
tar -cJf src.tar.xz  dir/      # J=xz(大文字)
tar -xzf src.tar.gz            # x=展開する
tar -xf  src.tar.xz            # GNU tar は展開時に圧縮の形式を自動で見分ける
tar -tf  src.tar.gz            # t=中身の一覧(展開しない)
tar -xf src.tar.gz -C /tmp/work   # -C 展開先のディレクトリ
```

### 4. パッチを当てる

**パッチ**は、「このファイルのここを、こう変える」という差分を書いたファイルです。`patch` コマンドで当てます。

```bash
cd tool-1.4.2
patch -p1 < ../fix.patch              # パッチを当てる
patch -p1 --dry-run < ../fix.patch    # 当てずに、うまくいくかだけ試す
patch -R -p1 < ../fix.patch           # 当てたパッチを取り消す(reverse)
```

- `-p1` は、パッチの中のファイル名から、先頭のディレクトリを 1 つ取り除くという意味です。パッチの作り方によって、`-p0`、`-p1` を使い分けます。
- 当てるときは、ソースのトップのディレクトリで実行します。

### 5. configure、make、make install

```bash
./configure --prefix=/opt/tool --enable-ssl   # 環境を調べ、Makefile を作る
make                                          # ビルド(-j4 で 4 並列)
sudo make install                             # 入れる(root の権限が要る)
```

- `configure` は、ソースに付いているスクリプトです。コンパイラや必要なライブラリがあるか調べ、**Makefile**(make の作り方の指示書)を作ります。
- `--prefix` で、入れる場所を決めます。指定しないと、多くのソフトウェアでは `/usr/local` になります。パッケージで入れたものとぶつからないように、`/usr/local` や `/opt` を使います。
- `make` は、Makefile に従って、変わったところだけをコンパイルします。何もつけずに実行すると、最初の目標(ターゲット)を作ります。
- `make install` は「install」というターゲットで、ファイルを prefix の下にコピーします。`make clean` は、作ったファイルを消します。
- ソースによっては、`configure` がなく、`make` だけ、または `cmake` を使うものもあります。README や INSTALL を読みます。
- `make install` で入れたものは、パッケージ管理(apt、dnf)に登録されません。消すときは、`make uninstall`(用意されていれば)か、手で消します。

## 2.04.2 バックアップとリストア (重要度3)

### 1. 何を取るか

バックアップは、壊れた、消した、間違えたときに、**リストア**(元に戻すこと)できるようにするための仕組みです。

| 取る | 理由 | 取らない |
|---|---|---|
| `/etc` | 設定ファイル | `/proc`、`/sys`(カーネルが見せる仮想のファイル) |
| `/home` | 利用者のデータ | `/dev`(デバイスのファイル) |
| `/var/lib`、`/srv` | データベース、サービスのデータ | `/run`、`/tmp`(再起動で消えて良いもの) |
| `/root`、`/usr/local`、`/opt` | 管理者の作業、後から入れたもの | |

- データベースを動かしたまま、ファイルをコピーしても、途中の壊れた状態を写すことがあります。`mysqldump` などで書き出して取るか、止めて取るか、スナップショットを使います。
- バックアップを取っただけでは足りません。**リストアの試験**までして、初めて使えると分かります。

### 2. 3 つの取り方(量の違い)

| 方式 | 何を取るか | 取る量 | リストアに要るもの |
|---|---|---|---|
| フルバックアップ | すべて | 多い | フル 1 つ |
| 差分バックアップ | 最後のフルから変わったもの | だんだん増える | フル + 最新の差分 |
| 増分バックアップ | 前回の(どの方式でも)バックアップから変わったもの | 少ない | フル + 増分をすべて、順に |

```text
Sun   Mon   Tue   Wed
FULL  d1    d2    d3     差分: どれも日曜のフルとの違い
FULL  i1    i2    i3     増分: 直前のバックアップとの違い
```

水曜の夜に壊れたとき、戻すものは次のとおりです。

```text
差分: FULL と d3 の 2 つで済む
増分: FULL、i1、i2、i3 を順番に全部使う
```

- 増分は取る量が少なく早い代わりに、戻すときに時間がかかり、途中の 1 つが壊れると戻せなくなります。
- ファイルの単位で取る方法(tar、rsync)、ディスクのブロックの単位で取る方法(dd)、システム全体のイメージで取る方法があります。ファイルの単位は一部だけ戻すのが楽で、ブロックやイメージは丸ごと戻すのに向いています。

### 3. tar、dd、rsync

```bash
# tar: ファイルの単位
tar -czf /backup/etc.tar.gz /etc                 # 取る
tar -tzf /backup/etc.tar.gz                      # 中身を確認する
tar -xzf /backup/etc.tar.gz -C /restore etc/hosts   # 一部だけ戻す
tar -czf /backup/inc.tar.gz -g /backup/snap /home   # 増分(snap に前回の状態を記録する)

# dd: ブロックの単位(ディスクやパーティションを丸ごと)
sudo dd if=/dev/sdb of=/backup/sdb.img bs=1M status=progress
sudo dd if=/dev/sda of=/backup/mbr.bin bs=512 count=1   # 先頭の 512 バイト(MBR)だけ

# rsync: 変わった部分だけを同期する
rsync -av /home/ /backup/home/                   # -a アーカイブ(権限や時刻を保つ) -v 詳しく
rsync -av --delete /home/ backup@host:/backup/home/   # 元で消えたものを先でも消す。ssh 経由
rsync -avn /home/ /backup/home/                  # -n 実行せず、何が起きるかだけ表示
```

- `dd` の `if` が入力、`of` が出力、`bs` が 1 回に読み書く大きさです。`of` を間違えると、ディスクを上書きして壊します。
- `rsync` は、パスの末尾の `/` で意味が変わります。`/home/` は「中身」、`/home` は「ディレクトリそのもの」を渡します。
- `rsync --link-dest` を使うと、変わらないファイルをハードリンクにして、日ごとのスナップショットのように残せます。

### 4. テープ装置

| デバイス | 動き |
|---|---|
| `/dev/st0` | 使い終わると、**巻き戻す**テープ |
| `/dev/nst0` | 使い終わっても、**巻き戻さない**テープ(non-rewind)。1 本に続けて複数を書くときに使う |

`mt` は、テープを操作するコマンドです。

```bash
mt -f /dev/nst0 status      # 状態
mt -f /dev/nst0 rewind      # 巻き戻す
mt -f /dev/nst0 fsf 1       # 1 つ先のファイルの位置へ進める
mt -f /dev/nst0 eject       # 取り出す
tar -cf /dev/nst0 /etc      # テープに書く
```

### 5. バックアップのツール

| ツール | 特徴 |
|---|---|
| Amanda | ネットワーク越しに、多くのクライアントをまとめて取る。古くからある |
| Bacula | サーバー、クライアントの構成で、複数のホストを取る |
| Bareos | Bacula から分かれた(フォークした)もの |
| BackupPC | Web で管理する。ディスクにためる。クライアントに常駐のソフトが要らない |

### 6. 取れたかを確かめる

- `tar -tf` で中身を読めるか確かめる。
- `tar -d`(`--compare`)で、元のファイルと比べる。
- 取る前後で、`sha256sum` の値を比べる。
- 別の場所で実際に戻してみる。
- 保存先を、元とは別の機械、別の場所にする。

## 2.04.3 ユーザへの通知 (重要度3)

### 1. ログインの前後に出るメッセージ

| ファイル | いつ、どこで出るか |
|---|---|
| `/etc/issue` | ローカルの端末(コンソール)で、ログインのプロンプトの前 |
| `/etc/issue.net` | ネットワーク経由(telnet など)のログインの前 |
| `/etc/motd` | ログインに成功した後(motd は message of the day) |

```text
[login prompt]
    |
    |  /etc/issue       コンソール
    |  /etc/issue.net   ネットワーク
    v
[authentication]
    |
    |  成功
    v
[shell]                 /etc/motd を表示
```

- `/etc/issue` の中では、`\n`(ホスト名)、`\l`(端末)、`\r`(カーネルの版)のような**エスケープ**(特別な意味を持つ文字の並び)が使えます。
- ssh では、`/etc/issue.net` を自動では表示しません。`/etc/ssh/sshd_config` に `Banner /etc/issue.net` と書いて、`sshd` を再読み込みします。
- Ubuntu は、`/etc/update-motd.d/` のスクリプトで、ログインのたびに motd を組み立てます。Red Hat 系(RHEL 9 系)の `/etc/motd` は、最初は空のファイルで、書いた内容がそのまま出ます。

### 2. すでにログインしている人に知らせる

```bash
wall "22:00 から保守のため再起動します"       # ログイン中の全員の端末に出す
echo "保守のお知らせ" | wall                   # 標準入力からも書ける
sudo shutdown -h +10 "10 分後に停止します"     # 10 分後に停止し、全員に知らせる
sudo shutdown -r 22:00 "22:00 に再起動します"  # 時刻を指定して再起動
sudo shutdown -c                               # 予約を取り消す(cancel)
sudo shutdown -h now                           # すぐ停止する
```

| 道具 | 動き |
|---|---|
| `wall` | ログインしている全員の端末にメッセージを出す(write all) |
| `shutdown` | 時刻の予約と、全員への予告をして、止める |
| `shutdown -h` / `-r` / `-H` | 停止(systemd では電源も切る)/ 再起動 / 電源を切らずに止める |
| `shutdown --no-wall` | 予告のメッセージを出さない |
| `systemctl poweroff` | すぐ電源を切る(systemd) |
| `systemctl reboot` | すぐ再起動する(systemd) |

- systemd の `shutdown` では、`-h` は `-P`(`--poweroff`)と同じで、電源まで切ります。電源を切らずに止める(halt)のは `-H` です。
- systemd の環境でも `shutdown` は使えます。何分後、何時に、と時刻を予約して止めるのは `shutdown` です。`systemctl poweroff` と `systemctl reboot` は、予約せずに、すぐ実行します。
- 止める前には、`wall` や `shutdown` の予告で、作業を保存する時間を渡します。

## 2.04.4 リソース使用状況の把握 (重要度3)

### 1. 何を見るか、どの道具か

遅い、重いときは、まず「CPU、メモリ、ディスク、ネットワークのどれが足りないか」を調べます。

```text
CPU       top  htop  vmstat  sar -u  ps
memory    free  vmstat  top  sar -r
disk I/O  iostat  iotop  vmstat  sar -d
network   iftop  iptraf-ng  ss  sar -n DEV
files     lsof  ss
```

### 2. プロセスと CPU: top、htop、ps

```bash
top              # 実行中のプロセスを数秒ごとに更新して表示する
htop             # top を見やすくしたもの(別にインストールする)
ps aux           # すべてのプロセスの一覧(BSD の書き方)
ps -ef           # 同じ(UNIX の書き方。親の PID も出る)
ps aux --sort=-%mem | head    # メモリを多く使う順
```

| top の見方 | 意味 |
|---|---|
| `load average` | 実行待ち、I/O 待ちを含む、プロセスの数の平均(1 分、5 分、15 分)。CPU の数より大きい状態が続くと、混んでいる |
| `%Cpu(s)` の `us` / `sy` | 利用者のプログラム / カーネルが使った割合 |
| `wa` | I/O の完了を待っている割合(I/O 待ち) |
| `id` | 空いている割合 |
| `st` | 仮想マシンで、ほかの仮想マシンに取られた割合 |

- `top` の中では、`M` でメモリの多い順、`P` で CPU の多い順、`1` で CPU ごとの表示、`k` でプロセスに終了を送り、`q` で終了します。

### 3. メモリ: free、vmstat

```bash
free -h
#               total   used   free  shared  buff/cache  available
# Mem:          7.7Gi   2.1Gi  900Mi  120Mi      4.7Gi      5.3Gi
# Swap:         2.0Gi      0B  2.0Gi
```

- `buff/cache` は、ディスクの読み書きを速くするために、カーネルが使っているメモリです。足りなくなれば解放されます。
- 実際に新しく使えるメモリの目安は、`free` ではなく **`available`** です。

```bash
vmstat 1 5      # 1 秒おきに 5 回
# procs ---memory--- --swap-- --io-- -system- ------cpu------
#  r  b  swpd  free  si  so   bi  bo   in  cs us sy id wa st
```

| 列 | 意味 |
|---|---|
| `r` | 実行待ちのプロセスの数 |
| `b` | 割り込みできない待ち(多くは I/O 待ち)のプロセスの数 |
| `si` / `so` | スワップから読む / スワップへ書く量 |
| `bi` | ブロックデバイスから受け取ったブロック数(blocks in。ディスクから読んだ量) |
| `bo` | ブロックデバイスへ送ったブロック数(blocks out。ディスクへ書いた量) |
| `wa` | I/O 待ちの CPU の割合 |

- `si`、`so` が続けて 0 より大きいと、メモリが足りず、スワップ(ディスクをメモリの代わりに使うこと)が起きています。
- `wa` が高く、`bi`、`bo` も多いなら、ディスクが詰まっています。

### 4. 過去の記録: sar

`sar` は sysstat パッケージの道具で、CPU、メモリ、ディスク、ネットワークの使用状況を、時間を追って見ます。**過去の記録**も見られます。

```bash
sar -u 1 3          # CPU を 1 秒おきに 3 回
sar -r              # メモリ
sar -d              # ディスク
sar -n DEV          # ネットワークの機器ごとの送受信
sar -f /var/log/sa/sa24    # 保存された記録のファイルを読む(Red Hat 系)
```

- sysstat は、定期的に数値を記録します。記録の置き場所は、Red Hat 系が `/var/log/sa/`、Debian 系が `/var/log/sysstat/` です。Debian 系では、`/etc/default/sysstat` で収集を有効にします。

### 5. ディスクの I/O: iostat、iotop

```bash
iostat -x 1          # ディスクごとの詳しい値(1 秒おき)
sudo iotop -o        # I/O をしているプロセスだけを表示(root が要る)
```

| iostat -x の列 | 意味 |
|---|---|
| `r/s`、`w/s` | 1 秒あたりの読み、書きの回数 |
| `await` | 1 回の処理にかかった平均の時間(待ちを含む)。sysstat の版によって、`r_await` と `w_await`(読みと書き)に分かれる |
| `%util` | その装置が処理で忙しかった割合。100% に近いと、飽和している(1 台の HDD の場合。SSD や RAID は要求を並列にさばくので、100% でも余裕があることがある) |

- `iostat` は、どのディスクが忙しいかを見ます。`iotop` は、**どのプロセス**が I/O を多く使っているかを見ます。

### 6. ネットワークとファイル: ss、netstat、iftop、iptraf-ng、lsof

```bash
ss -tlnp              # 待ち受けている TCP のポートと、そのプロセス
ss -tan               # つながっているものを含む、TCP の接続
netstat -tlnp         # 同じ(古い道具。net-tools パッケージ)
sudo iftop -i eth0    # 相手ごとの通信の量(どこが帯域を使っているか)
sudo iptraf-ng        # 対話の画面で、接続ごと、機器ごとの通信を見る
lsof -i :80           # ポート 80 を使っているプロセス
lsof -p 1234          # PID 1234 が開いているファイル
lsof /var/log/syslog  # そのファイルを開いているプロセス
```

- `ss` の `-t` は TCP、`-l` は待ち受け、`-n` は名前にせず数字、`-p` はプロセス、`-u` は UDP です。
- `netstat` は古く、いまは `ss` が使われます。
- `lsof`(list open files)は、Linux では、通信の接続もファイルとして扱うため、ファイルも通信も調べられます。`umount` できないとき、使っているプロセスを探すのにも使います。
- ファイアウォールやルーターの役をするサーバーの通信量は、`iftop`、`iptraf-ng`、`sar -n DEV` で調べます。

### 7. 限界を見つける考え方

1. 全体を見る(`top`、`vmstat`)。CPU、I/O 待ち、スワップのどれが目立つか。
2. 疑わしい資源を詳しく見る(`iostat`、`free`、`ss`)。
3. 原因のプロセスを探す(`ps`、`iotop`、`lsof`)。
4. 記録(`sar`)と比べる。いつもと違うか。

## 2.04.5 死活監視、リソース監視、運用監視ツール (重要度2)

### 1. 死活監視とリソース監視

| | 死活監視 | リソース監視 |
|---|---|---|
| 見るもの | 動いているか(生きているか) | どれくらい使っているか |
| 例 | `ping` が返る、ポートにつながる、HTTP が 200 を返す、プロセスがいる | CPU、メモリ、ディスクの空き、ネットワークの量 |
| 目的 | 止まったらすぐ気づく | 足りなくなる前に気づく |

### 2. 障害の種類と前触れ

| 種類 | 例 | 前触れ |
|---|---|---|
| 資源の枯渇 | ディスクが満杯、メモリ不足、ファイルの数の上限 | 使用率がじわじわ上がる |
| 過負荷 | アクセスの急増で、応答が遅い | `load average` の上昇、応答時間の悪化 |
| 異常停止 | プロセスが落ちる、機器が止まる | ログ(`journalctl`)、再起動の回数の増加 |
| 異常な結果 | 200 は返すが、中身が違う、計算が合わない | 中身を確かめる監視で見つかる |

**OOM Killer** は、メモリが足りなくなったとき、カーネルがメモリを多く使っているプロセスを選んで強制終了する仕組みです。ログに `Out of memory: Killed process` と残ります。

```bash
sudo dmesg -T | grep -i "out of memory"
journalctl -k | grep -i "killed process"
```

### 3. 監視ツールの全体の形

```text
[monitored hosts]  --- poll / agent --->  [monitoring server]  --->  [alert]  メール、チャット
 web1  web2  db1                               |
                                               +--> graph  グラフで傾向を見る
```

- 決めた**項目**を、決めた**間隔**で集め、**しきい値**(これを超えたら異常)と比べて、**アラート**(通知)を出します。しきい値は、注意(warning)と重大(critical)の 2 段階にすることが多いです。
- 数が多いとき、人が手で見るのは無理です。ツールで同じ方法に統一して、自動で集めます。

### 4. SNMP

**SNMP**(Simple Network Management Protocol)は、ネットワーク機器やサーバーの状態を、集めるためのプロトコルです。

- 管理される側の**エージェント**(snmpd)が、UDP の 161 番で待ちます。異常を自分から知らせる**トラップ**は、UDP の 162 番に送られます。
- 取れる値は、**OID**(番号で表した値の名前)で指定し、一覧は **MIB** にあります。
- 古い v1、v2c は、**コミュニティ名**(合言葉)だけで、暗号化がありません。v3 は、認証と暗号化があります。
- `snmpwalk -v2c -c public host` や `snmpget` で試せます(net-snmp の道具)。

### 5. 主な監視ツール

| ツール | 特徴 |
|---|---|
| Nagios | 古くからある死活監視の定番。プラグインで確かめ、しきい値で通知する |
| Icinga2 | Nagios から分かれた Icinga を、作り直した版。設定、Web の画面、分散構成が新しい |
| Zabbix | エージェントや SNMP で集め、データベースに溜める。Web の画面で、グラフ、アラートまで 1 つで扱う |
| collectd | 数値を集める常駐のプログラム。プラグインで多くの項目を取り、ほかのツールに渡す |
| MRTG | SNMP でネットワーク機器の通信量を集め、グラフにする。5 分おきが標準 |
| Cacti | SNMP などで集め、RRDtool でグラフにする。Web の画面で管理する |

## 2.04.6 システム構成ツール (重要度4)

### 1. 構成管理ツールを使う理由

サーバーの設定を、手で 1 台ずつ変えると、手順の間違いや、台ごとの違いが出ます。**構成管理ツール**は、あるべき設定をコードに書き、それを多数のサーバーに自動で適用します。

| 利点 | 内容 |
|---|---|
| 標準化と自動化 | 同じコードで、同じ設定になる |
| 効率 | 何十台でも、ほぼ同じ手間 |
| 拡張性 | 台数が増えても、対象に足すだけ |
| 冪等性(べきとうせい) | 何回実行しても、結果が同じになる。すでにその状態なら、何も変えない |

### 2. Ansible の部品

**Ansible** は、操作する側(コントロールノード)から、対象のサーバーに SSH でつないで設定する道具です。対象にエージェント(常駐のソフト)を入れません。

```text
control node
 |-- inventory.ini           対象の一覧
 |-- site.yml                playbook(やることの一覧)
 `-- ansible-playbook        実行する
        |
        | SSH
        v
 web1  web2  db1             managed nodes(対象のサーバー)
```

| 部品 | 内容 |
|---|---|
| **インベントリ** | 対象のホストの一覧と、グループ。既定は `/etc/ansible/hosts` |
| **モジュール** | 1 つの仕事をする部品(`apt`、`dnf`、`copy`、`service`、`user`、`template` など) |
| **Playbook** | 「どのホストに、どの順番で、どのモジュールを使うか」を、YAML で書いたもの |
| タスク | playbook の中の、モジュール 1 回の呼び出し |

インベントリの例(INI の形)。

```ini
[web]
web1.example.com
web2.example.com

[db]
db1.example.com ansible_user=ops
```

### 3. YAML の書き方

**YAML** は、インデント(字下げ)で構造を表す書き方です。

- 字下げは**スペース**でそろえます。タブは使えません。
- `キー: 値` で、値を書きます。`:` の後ろに空白を入れます。
- `- ` で始まる行が、リストの要素です。

### 4. playbook の例

```yaml
- name: Web サーバーを整える
  hosts: web
  become: true
  tasks:
    - name: nginx を入れる
      ansible.builtin.apt:
        name: nginx
        state: present
    - name: nginx を起動し、自動起動にする
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true
```

| キー | 意味 |
|---|---|
| `hosts` | 対象のグループ(インベントリの名前) |
| `become: true` | root などに権限を上げて実行する(sudo のようなもの) |
| `tasks` | 実行するタスクの並び |
| `state: present` | 入っている状態にする(なければ入れ、あれば何もしない) |
| `state: started` | 動いている状態にする |

- Red Hat 系では、`ansible.builtin.dnf` を使います。`ansible.builtin.package` は、どちらの系統でも使えます。
- 結果は、`ok`(すでにその状態)、`changed`(変えた)、`failed` で出ます。2 回目の実行で `changed=0` なら、冪等です。

### 5. コマンド

```bash
ansible all -i inventory.ini -m ping             # 接続の確認(ad-hoc: 1 回きりの実行)
ansible web -i inventory.ini -a "uptime"         # コマンドを実行する(-a は引数)
ansible-playbook -i inventory.ini site.yml       # playbook を実行する
ansible-playbook -i inventory.ini site.yml --check   # 変えずに、何が変わるかだけ確認する
ansible-playbook site.yml --syntax-check         # 書き方の検査
```

| コマンド | 内容 |
|---|---|
| `ansible` | モジュールを 1 回だけ実行する |
| `ansible-playbook` | playbook を実行する |

### 6. 何に使うか

- 仮想マシン、コンテナを作り、設定する(プロビジョニング)
- アプリケーションのリリース(ファイルを置き、サービスを再起動する)
- ルーターやスイッチなど、ネットワーク機器の設定
