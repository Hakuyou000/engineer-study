# LinuC 102 テキスト 1.09 重要なシステムサービス

サーバーの運用に欠かせない、時刻の管理、ログの管理、メールの配送の仕組みを学びます。

## 1.09.1 システム時刻の管理 (重要度2)

### 1. 2つの時計

**［図1　システムクロックとハードウェアクロック］**

| 時計 | 特徴 | 操作するコマンド |
|---|---|---|
| ハードウェアクロック(RTC) | マザーボードにある時計。電池で動き続ける | `hwclock` |
| システムクロック | OS(カーネル)が管理する時計。電源を切ると消える。NTP で合わせるのはこちら | `date` |

起動するときにハードウェアクロックの時刻をシステムクロックに読み込み、停止するときにシステムクロックの時刻をハードウェアクロックに書き戻します。

```text
RTC            ハードウェアクロック。hwclock で操作する
  |
  |  起動時に読み込む
  v
System clock   システムクロック。date で操作する。NTP で合わせるのはこちら
  |
  |  停止時に書き戻す
  v
RTC
```

### 2. date

システムクロックを表示・設定します。

``` bash
date
date "+%Y-%m-%d %H:%M:%S"
date -u
```

| 書式 | 意味 | 書式 | 意味 |
|---|---|---|---|
| `%Y` | 年(4 桁) | `%H` | 時(24 時間制) |
| `%m` | 月 | `%M` | 分 |
| `%d` | 日 | `%S` | 秒 |
| `%F` | `%Y-%m-%d` と同じ | `%T` | `%H:%M:%S` と同じ |

`-u` を付けると、協定世界時(UTC)で表示します。時刻の設定は root で行い、「月日時分[年]」の順に書きます。

``` bash
# 2026年11月17日 14:30 に設定する
date 111714302026
date -s "2026-11-17 14:30:00"
```

> **【ひっかけ】**
>
> `date 111714302026` の並びは **MMDDhhmmYYYY**(月日時分年)です。年が最後に来ます。

### 3. hwclock

ハードウェアクロックの表示と、2つの時計の同期を行います。

| オプション | 別名 | 動作 |
|---|---|---|
| `-r` | `--show` | ハードウェアクロックの時刻を表示する |
| `-w` | `--systohc` | システムクロック → ハードウェアクロック(書き込む) |
| `-s` | `--hctosys` | ハードウェアクロック → システムクロック(読み込む) |

> **【覚え方】**
>
> `-w` は write(書き込む)で、ハードウェアクロックへ書き込みます。`systohc` は「sys to hc(システムからハードウェアへ)」、`hctosys` は「hc to sys(ハードウェアからシステムへ)」です。

### 4. タイムゾーン

| 名前 | 内容 |
|---|---|
| `/usr/share/zoneinfo/` | タイムゾーンのデータ。`Asia/Tokyo` などのファイルがある |
| `/etc/localtime` | システムのタイムゾーン。zoneinfo のファイルのコピーか、そこへのシンボリックリンク |
| `/etc/timezone` | タイムゾーンの名前を文字で書いたファイル(Debian 系) |
| `TZ` | 環境変数。ユーザーやプロセスごとにタイムゾーンを変えられる |
| `tzselect` | 質問に答えてタイムゾーンの名前を調べる。設定は変更しない |
| `timedatectl` | 時刻、タイムゾーン、NTP による同期をまとめて管理する(systemd のコマンド) |

``` bash
# システムのタイムゾーンを変更する
ln -sf \
  /usr/share/zoneinfo/Asia/Tokyo \
  /etc/localtime
timedatectl set-timezone Asia/Tokyo
# 自分のシェルだけ変更する
export TZ=America/New_York
# 1つのコマンドだけ変更する
TZ=UTC date
```

``` bash
timedatectl
timedatectl list-timezones
timedatectl set-time \
  "2026-11-17 14:30:00"
timedatectl set-ntp true
```

> **【ひっかけ】**
>
> `tzselect` は、選んだ結果(TZ に設定すべき値)を表示するだけです。システムの設定は変わりません。

### 5. NTP

NTP は、ネットワークを通して時刻を合わせるプロトコルです。**UDP の 123 番** を使います。

- NTP サーバーは階層になっていて、その段を **stratum** と呼びます。原子時計などが stratum 0、それに直接つながるサーバーが stratum 1 です。数字が小さいほど正確です。
- `pool.ntp.org` は、世界中に公開されている NTP サーバーの集まりです。問い合わせるたびに別のサーバーが割り当てられます。`0.pool.ntp.org` 〜 `3.pool.ntp.org`、`jp.pool.ntp.org` などがあります。

### 6. ntpd / ntpdate / ntpq

| 名前 | 役割 |
|---|---|
| `ntpd` | 動き続けて時刻を合わせ続けるデーモン。NTP サーバーにもなれる |
| `/etc/ntp.conf` | ntpd の設定ファイル |
| `ntpdate` | **1回だけ** 時刻を合わせるコマンド |
| `ntpq` | ntpd の状態を問い合わせるコマンド |

``` bash
# /etc/ntp.conf
server 0.pool.ntp.org iburst
server 1.pool.ntp.org iburst
driftfile /var/lib/ntp/drift
```

``` bash
ntpdate pool.ntp.org
ntpq -p
```

``` bash
     remote      st when poll reach offset
*ntp1.example.jp  2   35   64  377  0.512
+ntp2.example.jp  2   40   64  377 -1.204
```

| 記号・項目 | 意味 |
|---|---|
| `*` | 現在同期しているサーバー |
| `+` | 同期先の候補 |
| `st` | stratum |
| `reach` | 到達の状況(8 進数。377 は直近の8回がすべて成功) |
| `offset` | 時刻のずれ(ミリ秒) |

- ntpd は、時刻を急に変えず、少しずつ調整します(slew)。大きくずれている場合は、先に ntpdate で合わせます。
- ntpd が動いている間は、ntpdate は使えません(同じポートを使うため)。

### 7. chrony

chrony は、ntpd に代わる新しい NTP のソフトウェアです。多くのディストリビューションで標準になっています。

| 名前 | 役割 |
|---|---|
| `chronyd` | デーモン |
| `/etc/chrony.conf` | 設定ファイル |
| `chronyc` | 状態の確認と操作のコマンド |

Debian 系では、設定ファイルは `/etc/chrony/` の下の `chrony.conf` です。

``` bash
# /etc/chrony.conf
pool pool.ntp.org iburst
driftfile /var/lib/chrony/drift
makestep 1.0 3
```

``` bash
chronyc sources     # 同期先の一覧
chronyc tracking    # 同期の状態
chronyc makestep    # すぐに時刻を合わせる
```

`chronyc sources` では、同期しているサーバーに `^*` が付きます。

| | ntpd | chrony |
|---|---|---|
| 設定ファイル | `ntp.conf` | `chrony.conf` |
| 確認のコマンド | `ntpq -p` | `chronyc sources` |
| 同期の速さ | 遅い | 速い |
| ときどきしかつながらない環境・仮想マシン | 向いていない | 向いている |

> **【1.09.1 まとめ】**
>
> - システムクロックは date、ハードウェアクロックは hwclock で扱う
> - `hwclock -w` はシステムからハードウェアへ、`-s` はその逆
> - タイムゾーンは /etc/localtime。データは /usr/share/zoneinfo/
> - 個別に変えるなら環境変数 TZ。`timedatectl set-timezone` で恒久的に設定する
> - NTP は UDP の 123 番。公開サーバーは pool.ntp.org
> - ntpd は ntp.conf と `ntpq -p`、chrony は chrony.conf と `chronyc sources`
> - ntpdate は1回だけの同期

## 1.09.2 システムのログ (重要度5)

### 1. ログの全体像

ログは、システムやサービスが「何が起きたか」を記録したものです。障害の調査に欠かせません。

**［図2　ログの流れ］**

1. カーネル、各サービス、`logger` コマンドなどがログを出します。
2. `systemd-journald` がそれを受け取り、ジャーナル(バイナリ形式)に保存します。`journalctl` で読みます。
3. `rsyslog` がジャーナルからログを受け取り、`/var/log/` にテキストのファイルとして保存します。他のサーバーへの転送も行います。
4. `logrotate` が、古いログファイルを切り替え、圧縮し、削除します。

```text
kernel, services, logger   ログを出す
  |
  v
systemd-journald           ジャーナル(バイナリ形式)に保存する。journalctl で読む
  |
  v
rsyslog                    /var/log/ にテキストで保存する。他のサーバーへ転送もする
  |
  v
/var/log/messages など
  |
  v
logrotate                  古いログを切り替え、圧縮し、削除する
```

| 仕組み | 形式 | 読み方 |
|---|---|---|
| rsyslog | テキスト(/var/log/) | cat、less、grep、tail |
| systemd-journald | バイナリ | journalctl |

### 2. /var/log の主なファイル

| Red Hat 系 | Debian 系 | 内容 |
|---|---|---|
| `messages` | `syslog` | 一般的なシステムのログ |
| `secure` | `auth.log` | 認証に関するログ |
| `cron` | `syslog` | cron の実行の記録 |
| `maillog` | `mail.log` | メール |
| `dmesg` | `kern.log` | カーネル |

| ファイル | 形式 | 読むコマンド |
|---|---|---|
| `/var/log/wtmp` | バイナリ | `last`(ログインの履歴) |
| `/var/log/btmp` | バイナリ | `lastb`(ログインの失敗) |
| `/var/log/lastlog` | バイナリ | `lastlog`(最後のログイン) |

`tail -f /var/log/messages` で、追加されていくログを表示し続けられます。

### 3. rsyslog の設定

設定ファイルは `/etc/rsyslog.conf` と `/etc/rsyslog.d/*.conf` で、デーモンは `rsyslogd` です。

ルールは「**ファシリティ.プライオリティ　アクション**」の形で書きます。「どこから出た、どのくらい重要なログを、どこに出力するか」という意味です。

``` bash
authpriv.*       /var/log/secure
mail.*           -/var/log/maillog
cron.*           /var/log/cron
*.emerg          :omusrmsg:*
```

**ファシリティ**(ログの出どころ)

| 名前 | 対象 |
|---|---|
| `auth` `authpriv` | 認証 |
| `cron` | cron |
| `daemon` | いろいろなデーモン |
| `kern` | カーネル |
| `mail` | メール |
| `lpr` | 印刷 |
| `syslog` | syslog 自身 |
| `user` | ユーザーのプロセス |
| `local0`〜`local7` | 自由に使える |

**プライオリティ**(重要度。上ほど高い)

| 名前 | 意味 |
|---|---|
| `emerg` | 緊急。システムが使えない |
| `alert` | すぐに対処が必要 |
| `crit` | 致命的 |
| `err` | エラー |
| `warning` | 警告 |
| `notice` | 通知 |
| `info` | 情報 |
| `debug` | デバッグ用 |

`none` は「記録しない」という意味です。

> **【覚え方】**
>
> 高い順に emerg、alert、crit、err、warning、notice、info、debug の8段階です。

**セレクタ(ファシリティ.プライオリティ)の書き方**

| 書き方 | 意味 |
|---|---|
| `mail.err` | mail の err **以上** |
| `mail.=err` | mail の err **だけ** |
| `mail.!err` | mail の err **未満** |
| `mail.*` | mail のすべて |
| `*.info` | すべてのファシリティの info 以上 |
| `mail.none` | mail は記録しない |
| `auth,authpriv.*` | `,` で複数のファシリティを指定する |
| `*.info;mail.none` | `;` で条件を並べる |

``` bash
*.info;mail.none;authpriv.none \
    /var/log/messages
```

この例は「info 以上のすべて。ただし mail と authpriv は除く」という意味です。

> **【ひっかけ】**
>
> `mail.err` は err だけではありません。err、crit、alert、emerg の4つが対象です。指定したプライオリティ **以上** が対象になります。

**アクション(出力先)**

| 書き方 | 出力先 |
|---|---|
| `/var/log/messages` | ファイル |
| `-/var/log/maillog` | ファイル(書き込みのたびにディスクへの同期をしない。速いが、障害のときに失う可能性がある) |
| `@192.168.1.100` | 他のホストへ **UDP** で送る |
| `@@192.168.1.100` | 他のホストへ **TCP** で送る |
| `sato` | そのユーザーの端末 |
| `:omusrmsg:*` | ログインしているすべてのユーザーの端末 |
| `/dev/console` | コンソール |

設定を変えたら、`systemctl restart rsyslog` で反映します。

### 4. ログの集約(他のサーバーとの送受信)

複数のサーバーのログを、1台のログサーバーに集められます。ポートは **514** 番です。

送る側(各サーバー):

``` bash
# UDP
*.* @192.168.1.100:514
# TCP
*.* @@192.168.1.100:514
```

受け取る側(ログサーバー): 受信用のモジュールを有効にします。

``` bash
# UDP で受信する
module(load="imudp")
input(type="imudp" port="514")
# TCP で受信する
module(load="imtcp")
input(type="imtcp" port="514")
```

古い書き方では次のようにします。

``` bash
$ModLoad imudp
$UDPServerRun 514
```

> **【覚え方】**
>
> `@` が1つなら UDP、`@@` と2つなら TCP です。受信のモジュールは im(input module)に udp か tcp を付けた名前です。

### 5. logger と systemd-cat

コマンドやスクリプトから、ログを書き込みます。

``` bash
logger "backup finished"
logger -p local0.info "test"
logger -t backup "finished"
```

| オプション | 意味 |
|---|---|
| `-p ファシリティ.プライオリティ` | ログの種類を指定する(省略すると `user.notice`) |
| `-t タグ` | ログにタグ(名前)を付ける |

`systemd-cat` は、コマンドの出力をジャーナルに送ります。

``` bash
echo "hello" | systemd-cat
systemd-cat -t backup -p warning \
  /usr/local/bin/backup.sh
```

### 6. journalctl

ジャーナルを表示します。

| オプション | 意味 |
|---|---|
| (なし) | すべて表示する(古い順) |
| `-f` | 追加されるログを表示し続ける(tail -f と同じ) |
| `-n 数` | 最後から指定した行数だけ |
| `-r` | 新しい順に表示する |
| `-e` | 最後のほうから表示する |
| `-u ユニット` | 特定のユニット(サービス)だけ |
| `-b` | 今回の起動以降だけ(`-b -1` は前回の起動) |
| `-k` | カーネルのメッセージ(dmesg と同じ) |
| `-p プライオリティ` | 指定したプライオリティ以上 |
| `--since` `--until` | 期間を指定する |
| `-o json` | 出力の形式を指定する |
| `--no-pager` | ページャ(less など)を使わない |

``` bash
journalctl -u sshd
journalctl -p err -b
journalctl --since "2026-11-17 09:00"
journalctl --since yesterday
journalctl _PID=1234
```

**ジャーナルの削除**

``` bash
journalctl --disk-usage
journalctl --vacuum-size=500M
journalctl --vacuum-time=2weeks
```

| オプション | 意味 |
|---|---|
| `--disk-usage` | ディスクの使用量を表示する |
| `--vacuum-size=` | 指定した大きさ以下になるまで、古いものから削除する |
| `--vacuum-time=` | 指定した期間より古いものを削除する |

### 7. journald の設定

設定ファイルは `/etc/systemd/journald.conf` です。

| 項目 | 意味 |
|---|---|
| `Storage=` | 保存先(下の表) |
| `SystemMaxUse=` | ディスクの使用量の上限 |
| `Compress=` | 圧縮するかどうか |
| `ForwardToSyslog=` | syslog に転送するかどうか |
| `MaxRetentionSec=` | 保存する期間の上限 |

| Storage の値 | 保存先 |
|---|---|
| `persistent` | `/var/log/journal/`(ディスク。再起動後も残る) |
| `volatile` | `/run/log/journal/`(メモリ。再起動で消える) |
| `auto` | `/var/log/journal/` があればそこへ、なければメモリへ(既定) |
| `none` | 保存しない |

変更した後は `systemctl restart systemd-journald` で反映します。

### 8. logrotate

ログファイルが大きくなり続けないように、定期的に切り替えます(ローテーション)。普通は cron から毎日実行されます。

**［図3　ログのローテーション］**

切り替えのたびに、`messages` → `messages.1` → `messages.2.gz`(圧縮)と、1世代ずつずれていきます。`rotate` で指定した世代の数を超えた古いものは削除されます。切り替えた後は、空の `messages` が新しく作られます。

```text
messages          現在のログ
  |  切り替え
  v
messages.1        1 世代前
  |  切り替え
  v
messages.2.gz     2 世代前(圧縮)
  |  rotate の数を超えたら
  v
(削除)
```

| ファイル | 役割 |
|---|---|
| `/etc/logrotate.conf` | 全体の設定 |
| `/etc/logrotate.d/` | サービスごとの設定ファイルを置く |

``` bash
/var/log/myapp/*.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root adm
    postrotate
        systemctl reload myapp
    endscript
}
```

| 項目 | 意味 |
|---|---|
| `daily` `weekly` `monthly` | 切り替えの間隔 |
| `rotate 4` | 残す世代の数 |
| `size 100M` | 指定した大きさを超えたら切り替える |
| `compress` | 古いログを gzip で圧縮する |
| `delaycompress` | 圧縮を1世代遅らせる |
| `missingok` | ログファイルがなくてもエラーにしない |
| `notifempty` | ログファイルが空なら切り替えない |
| `create モード 所有者 グループ` | 新しいログファイルを作る |
| `dateext` | 連番の代わりに日付を付ける |
| `postrotate` 〜 `endscript` | 切り替えた後に実行するコマンド |
| `copytruncate` | コピーしてから元のファイルを空にする(ファイルを開き直せないアプリ向け) |

``` bash
# 動作を確認する(実際には切り替えない)
logrotate -d /etc/logrotate.conf
# 強制的に切り替える
logrotate -f /etc/logrotate.conf
```

> **【1.09.2 まとめ】**
>
> - rsyslog はテキスト(/var/log/)、journald はバイナリ(journalctl で読む)
> - ルールは「ファシリティ.プライオリティ　アクション」
> - プライオリティは emerg が最も高く、debug が最も低い。指定した値 **以上** が対象
> - `@` は UDP、`@@` は TCP で他のホストに送る。ポートは 514
> - `logger -p` でログを書く。`systemd-cat` はジャーナルへ送る
> - `journalctl -u` でユニット、`-f` で追いかけ、`-b` で今回の起動、`-p` でプライオリティ
> - 再起動後も残すには /var/log/journal/。設定は journald.conf の Storage
> - logrotate の設定は /etc/logrotate.conf と /etc/logrotate.d/

## 1.09.3 メール配送エージェント(MTA)の基本 (重要度2)

### 1. メールが届く仕組み

**［図4　メールが届くまで］**

| 略語 | 名前 | 役割 |
|---|---|---|
| MUA | Mail User Agent | メールソフト。メールを書いたり読んだりする |
| MTA | Mail Transfer Agent | メールを転送する。MTA 同士は SMTP(25 番ポート)で通信する |
| MDA | Mail Delivery Agent | 届いたメールを、各ユーザーのメールボックスに配る |

メールが送り手から受け手に届くまでの流れを図にします。

```text
MUA        送り手のメールソフト。メールを書く
  |
  v
MTA 1      送る側の MTA。メールを転送する
  |
  |  SMTP(25 番ポート)
  v
MTA 2      受ける側の MTA
  |
  v
MDA        ユーザーのメールボックスに配る
  |
  v
mailbox    メールボックス。受け手が MUA で読む
```

### 2. 主な MTA

| MTA | 特徴 |
|---|---|
| sendmail | 最も古くからある。設定が複雑 |
| postfix | sendmail と互換性がある。速く、安全性が高く、設定が分かりやすい。多くのディストリビューションで標準 |
| exim | 柔軟な設定ができる。Debian 系で標準 |
| qmail | 安全性を重視した設計 |

試験の範囲は概要までです。それぞれの MTA の設定ファイルの中身は対象外です。

どの MTA も、sendmail と同じ名前のコマンド(`sendmail`、`mailq`、`newaliases`)を備えています。

### 3. /etc/aliases(メールの別名)

あるアドレスあてのメールを、別のあて先に配送する設定です。システム全体に効き、root が管理します。

``` bash
# 別名: 配送先
root:       sato
webmaster:  sato, suzuki
info:       sato@example.com
```

| 配送先の書き方 | 意味 |
|---|---|
| `sato` | このサーバーのユーザー |
| `sato, suzuki` | 複数のあて先 |
| `sato@example.com` | 外部のアドレス |
| `/var/log/mail-copy` | ファイルに追記する |
| `"|/usr/local/bin/prog"` | プログラムに渡す |
| `:include:/etc/mail/list` | ファイルに書いたあて先の一覧を読み込む |

編集したら、必ず `newaliases` を実行します。

``` bash
newaliases
```

MTA は `/etc/aliases` を直接読まず、変換したデータベース(`/etc/aliases.db`)を使います。`newaliases` はこのデータベースを作り直すコマンドです。

> **【ひっかけ】**
>
> `/etc/aliases` を編集しただけでは反映されません。`newaliases` が必要です。`sendmail -bi` でも同じことができます。

### 4. ~/.forward

ユーザーが、**自分あて** のメールの転送先を決めるファイルです。自分のホームディレクトリに置きます。

``` bash
sato@example.com
```

自分のメールボックスにも残しつつ転送する場合:

``` bash
\sato, sato@example.com
```

`\` を付けたユーザー名は、「それ以上は転送せず、自分のメールボックスに配送する」という意味です。

| | /etc/aliases | ~/.forward |
|---|---|---|
| 設定する人 | root | 各ユーザー |
| 範囲 | システム全体 | 自分あてのメールだけ |
| 反映 | `newaliases` が必要 | 保存すればすぐ |

### 5. mail コマンド

コマンドで使うメールソフト(MUA)です。

``` bash
# 届いたメールを読む
mail
# メールを送る(本文を入力した後、Ctrl+D)
mail -s "件名" sato@example.com
# パイプやリダイレクトで本文を渡す
echo "done" | mail -s "report" root
mail -s "log" root < /var/log/dmesg
```

届いたメールは、`/var/spool/mail/ユーザー名`(または `/var/mail/`)に保存されます。

### 6. mailq

送信を待っているメール(メールキュー)を表示します。

``` bash
mailq
```

| 操作 | sendmail | postfix |
|---|---|---|
| 表示 | `mailq` または `sendmail -bp` | `mailq` または `postqueue -p` |
| 再送 | `sendmail -q` | `postqueue -f` |

キューの場所は、sendmail が `/var/spool/mqueue/`、postfix が `/var/spool/postfix/` です。

相手のサーバーに接続できないとき、メールはキューにたまり、一定の間隔で再送されます。

> **【1.09.3 まとめ】**
>
> - MTA はメールを転送するプログラム。SMTP の 25 番ポートを使う
> - 主な MTA は sendmail、postfix、exim
> - `/etc/aliases` は「別名: 配送先」の形。編集した後に `newaliases`
> - `~/.forward` はユーザー自身が設定する転送。newaliases は不要
> - `mail -s "件名" あて先` で送る
> - `mailq` でキューを表示する
