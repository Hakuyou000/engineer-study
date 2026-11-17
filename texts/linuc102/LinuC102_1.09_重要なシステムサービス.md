# LinuC 102 テキスト 1.09 重要なシステムサービス

## 1.09.1 システム時刻の管理 （重要度2）

### 1. 2つの時計

**［図1　システムクロックとハードウェアクロック］**

| 時計                        | 特徴                                                          | 操作コマンド |
|-----------------------------|---------------------------------------------------------------|--------------|
| ハードウェアクロック（RTC） | マザーボード上の時計。電池で動き続ける                        | `hwclock`    |
| システムクロック            | カーネルが管理する時計。電源を切ると消える。NTPで同期する対象 | `date`       |

起動時にハードウェアクロックの値をシステムクロックに読み込み、停止時にシステムクロックの値をハードウェアクロックに書き戻す。

### 2. date

システムクロックの表示と設定。

``` bash
date
date "+%Y-%m-%d %H:%M:%S"
date -u
```

| 書式 | 意味              | 書式 | 意味              |
|------|-------------------|------|-------------------|
| `%Y` | 年（4桁）         | `%H` | 時（24時間）      |
| `%m` | 月                | `%M` | 分                |
| `%d` | 日                | `%S` | 秒                |
| `%F` | `%Y-%m-%d` と同じ | `%T` | `%H:%M:%S` と同じ |

設定はrootで行う。書式は「月日時分\[年\]」。

``` bash
# 2026年11月17日 14:30 に設定
date 111714302026
date -s "2026-11-17 14:30:00"
```

> **【ひっかけ】**
>
> `date 111714302026` の並びは **MMDDhhmmYYYY**。年が最後に来る。

### 3. hwclock

ハードウェアクロックの表示と、2つの時計の同期。

| オプション | 別名        | 動作                                |
|------------|-------------|-------------------------------------|
| `-r`       | `--show`    | ハードウェアクロックを表示          |
| `-w`       | `--systohc` | システム → ハードウェア（書き込む） |
| `-s`       | `--hctosys` | ハードウェア → システム（読み込む） |

> **【覚え方】**
>
> `-w` は write。ハードウェアクロックへ書き込む。`systohc` は「sys to hc」、`hctosys` は「hc to sys」。

### 4. タイムゾーン

| 名前                   | 内容                                                                    |
|------------------------|-------------------------------------------------------------------------|
| `/usr/share/zoneinfo/` | タイムゾーンのデータ。`Asia/Tokyo` などのファイルがある                 |
| `/etc/localtime`       | システムのタイムゾーン。zoneinfo のファイルのコピーかシンボリックリンク |
| `/etc/timezone`        | タイムゾーン名を文字で書いたファイル（Debian系）                        |
| `TZ`                   | 環境変数。ユーザーやプロセス単位でタイムゾーンを変える                  |
| `tzselect`             | 対話形式でタイムゾーン名を調べる。設定は変更しない                      |
| `timedatectl`          | 時刻・タイムゾーン・NTP同期をまとめて管理する（systemd）                |

``` bash
# システムのタイムゾーンを変更
ln -sf \
  /usr/share/zoneinfo/Asia/Tokyo \
  /etc/localtime
timedatectl set-timezone Asia/Tokyo
# 自分のシェルだけ変更
export TZ=America/New_York
# 1コマンドだけ変更
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
> `tzselect` は選んだ結果（TZに設定すべき値）を表示するだけ。システムの設定は変わらない。

### 5. NTP

ネットワーク経由で時刻を合わせるプロトコル。**UDPの123番**。

- 階層を **stratum** と呼ぶ。原子時計などが stratum 0、それに直結するサーバーが stratum 1。数字が小さいほど正確。
- `pool.ntp.org` は、公開NTPサーバーの集まり。問い合わせるたびに別のサーバーが割り当てられる。`0.pool.ntp.org` 〜 `3.pool.ntp.org`、`jp.pool.ntp.org` などがある。

### 6. ntpd / ntpdate / ntpq

| 名前            | 役割                                                    |
|-----------------|---------------------------------------------------------|
| `ntpd`          | 常駐して時刻を同期し続けるデーモン。NTPサーバーにもなる |
| `/etc/ntp.conf` | ntpd の設定ファイル                                     |
| `ntpdate`       | **1回だけ**同期するコマンド                             |
| `ntpq`          | ntpd の状態を問い合わせる                               |

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

| 記号・項目 | 意味                                       |
|------------|--------------------------------------------|
| `*`        | 現在同期しているサーバー                   |
| `+`        | 同期先の候補                               |
| `st`       | stratum                                    |
| `reach`    | 到達状況（8進数。377 は直近8回すべて成功） |
| `offset`   | 時刻のずれ（ミリ秒）                       |

- ntpd は時刻を少しずつ調整する（slew）。大きくずれている場合は、先に ntpdate で合わせる。
- ntpd の動作中は、ntpdate は使えない（同じポートを使うため）。

### 7. chrony

ntpd に代わる新しいNTP実装。多くのディストリビューションで標準。

| 名前               | 役割                     |
|--------------------|--------------------------|
| `chronyd`          | デーモン                 |
| `/etc/chrony.conf` | 設定ファイル             |
| `chronyc`          | 状態確認と操作のコマンド |

Debian系では、設定ファイルは `/etc/chrony/` の下の `chrony.conf`。

``` bash
# /etc/chrony.conf
pool pool.ntp.org iburst
driftfile /var/lib/chrony/drift
makestep 1.0 3
```

``` bash
chronyc sources     # 同期先の一覧
chronyc tracking    # 同期の状態
chronyc makestep    # 即座に合わせる
```

`chronyc sources` では、同期中のサーバーに `^*` が付く。

|                          | ntpd       | chrony            |
|--------------------------|------------|-------------------|
| 設定ファイル             | `ntp.conf` | `chrony.conf`     |
| 確認コマンド             | `ntpq -p`  | `chronyc sources` |
| 同期の速さ               | 遅い       | 速い              |
| 断続的な接続・仮想マシン | 不向き     | 向いている        |

> **【1.09.1 まとめ】**
>
> - システムクロックは date、ハードウェアクロックは hwclock
> - `hwclock -w` はシステム→ハードウェア、`-s` はその逆
> - タイムゾーンは /etc/localtime。データは /usr/share/zoneinfo/
> - 個別に変えるなら環境変数 TZ。`timedatectl set-timezone` で恒久設定
> - NTPはUDP 123番。公開サーバーは pool.ntp.org
> - ntpd は ntp.conf と `ntpq -p`、chrony は chrony.conf と `chronyc sources`
> - ntpdate は1回だけの同期

## 1.09.2 システムのログ （重要度5）

### 1. ログの全体像

**［図2　ログの流れ］**

1.  カーネル、各サービス、`logger` などがログを出す。
2.  `systemd-journald` が受け取り、ジャーナル（バイナリ形式）に保存する。`journalctl` で読む。
3.  `rsyslog` がジャーナルから受け取り、`/var/log/` にテキストファイルとして保存する。リモートへの転送も行う。
4.  `logrotate` が古いログファイルを切り替え、圧縮、削除する。

| 仕組み           | 形式                  | 読み方                |
|------------------|-----------------------|-----------------------|
| rsyslog          | テキスト（/var/log/） | cat、less、grep、tail |
| systemd-journald | バイナリ              | journalctl            |

### 2. /var/log の主なファイル

| Red Hat系  | Debian系   | 内容                 |
|------------|------------|----------------------|
| `messages` | `syslog`   | 一般的なシステムログ |
| `secure`   | `auth.log` | 認証関連             |
| `cron`     | `syslog`   | cron の実行記録      |
| `maillog`  | `mail.log` | メール               |
| `dmesg`    | `kern.log` | カーネル             |

| ファイル           | 形式     | 読むコマンド              |
|--------------------|----------|---------------------------|
| `/var/log/wtmp`    | バイナリ | `last`（ログイン履歴）    |
| `/var/log/btmp`    | バイナリ | `lastb`（ログイン失敗）   |
| `/var/log/lastlog` | バイナリ | `lastlog`（最終ログイン） |

`tail -f /var/log/messages` で、追記されるログを見続けられる。

### 3. rsyslog の設定

設定ファイルは `/etc/rsyslog.conf` と `/etc/rsyslog.d/*.conf`。デーモンは `rsyslogd`。

ルールの書式は「**ファシリティ.プライオリティ　アクション**」。

``` bash
authpriv.*       /var/log/secure
mail.*           -/var/log/maillog
cron.*           /var/log/cron
*.emerg          :omusrmsg:*
```

**ファシリティ**（ログの出どころ）

| 名前               | 対象             |
|--------------------|------------------|
| `auth` `authpriv`  | 認証             |
| `cron`             | cron             |
| `daemon`           | 各種デーモン     |
| `kern`             | カーネル         |
| `mail`             | メール           |
| `lpr`              | 印刷             |
| `syslog`           | syslog 自身      |
| `user`             | ユーザープロセス |
| `local0`〜`local7` | 独自に使える     |

**プライオリティ**（重要度。上ほど高い）

| 名前      | 意味                     |
|-----------|--------------------------|
| `emerg`   | 緊急。システムが使えない |
| `alert`   | 直ちに対処が必要         |
| `crit`    | 致命的                   |
| `err`     | エラー                   |
| `warning` | 警告                     |
| `notice`  | 通知                     |
| `info`    | 情報                     |
| `debug`   | デバッグ                 |

`none` は「記録しない」を表す。

> **【覚え方】**
>
> 高い順に emerg、alert、crit、err、warning、notice、info、debug。8段階。

**セレクタの書き方**

| 記述               | 意味                       |
|--------------------|----------------------------|
| `mail.err`         | mail の err **以上**       |
| `mail.=err`        | mail の err **だけ**       |
| `mail.!err`        | mail の err **未満**       |
| `mail.*`           | mail のすべて              |
| `*.info`           | 全ファシリティの info 以上 |
| `mail.none`        | mail は記録しない          |
| `auth,authpriv.*`  | `,` で複数のファシリティ   |
| `*.info;mail.none` | `;` で条件を並べる         |

``` bash
*.info;mail.none;authpriv.none \
    /var/log/messages
```

上の例は「info 以上のすべて。ただし mail と authpriv は除く」。

> **【ひっかけ】**
>
> `mail.err` は err だけではない。err、crit、alert、emerg の4つ。指定したプライオリティ**以上**が対象になる。

**アクション**

| 記述                | 出力先                                                             |
|---------------------|--------------------------------------------------------------------|
| `/var/log/messages` | ファイル                                                           |
| `-/var/log/maillog` | ファイル（書き込みごとの同期をしない。速いが、障害時に失う可能性） |
| `@192.168.1.100`    | リモートホストへ **UDP** で送信                                    |
| `@@192.168.1.100`   | リモートホストへ **TCP** で送信                                    |
| `kuro`              | そのユーザーの端末                                                 |
| `:omusrmsg:*`       | ログイン中の全ユーザーの端末                                       |
| `/dev/console`      | コンソール                                                         |

設定を変えたら `systemctl restart rsyslog` で反映する。

### 4. ログの集約（リモート送受信）

複数のサーバーのログを、1台のログサーバーに集める。ポートは **514**。

送信側（各サーバー）：

``` bash
# UDP
*.* @192.168.1.100:514
# TCP
*.* @@192.168.1.100:514
```

受信側（ログサーバー）：受信用のモジュールを有効にする。

``` bash
# UDPで受信
module(load="imudp")
input(type="imudp" port="514")
# TCPで受信
module(load="imtcp")
input(type="imtcp" port="514")
```

古い書式では次のように書く。

``` bash
$ModLoad imudp
$UDPServerRun 514
```

> **【覚え方】**
>
> `@` 1つはUDP、`@@` 2つはTCP。モジュールは im（input module）＋ udp または tcp。

### 5. logger と systemd-cat

コマンドやスクリプトからログを書き込む。

``` bash
logger "backup finished"
logger -p local0.info "test"
logger -t backup "finished"
```

| オプション                       | 意味                               |
|----------------------------------|------------------------------------|
| `-p ファシリティ.プライオリティ` | 指定する（省略時は `user.notice`） |
| `-t タグ`                        | タグを付ける                       |

`systemd-cat` は、コマンドの出力をジャーナルに送る。

``` bash
echo "hello" | systemd-cat
systemd-cat -t backup -p warning \
  /usr/local/bin/backup.sh
```

### 6. journalctl

ジャーナルを表示する。

| オプション          | 意味                               |
|---------------------|------------------------------------|
| （なし）            | すべて表示（古い順）               |
| `-f`                | 追記を表示し続ける（tail -f 相当） |
| `-n 数`             | 末尾から指定行数                   |
| `-r`                | 新しい順                           |
| `-e`                | 末尾から表示                       |
| `-u ユニット`       | 特定のユニットだけ                 |
| `-b`                | 今回の起動分だけ（`-b -1` は前回） |
| `-k`                | カーネルメッセージ（dmesg 相当）   |
| `-p プライオリティ` | 指定以上のプライオリティ           |
| `--since` `--until` | 期間を指定                         |
| `-o json`           | 出力形式を指定                     |
| `--no-pager`        | ページャを使わない                 |

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

| オプション       | 意味                                 |
|------------------|--------------------------------------|
| `--disk-usage`   | 使用量を表示                         |
| `--vacuum-size=` | 指定サイズ以下になるまで古い分を削除 |
| `--vacuum-time=` | 指定期間より古い分を削除             |

### 7. journald の設定

設定ファイルは `/etc/systemd/journald.conf`。

| 項目               | 意味                 |
|--------------------|----------------------|
| `Storage=`         | 保存先（下表）       |
| `SystemMaxUse=`    | ディスク使用量の上限 |
| `Compress=`        | 圧縮するか           |
| `ForwardToSyslog=` | syslog に転送するか  |
| `MaxRetentionSec=` | 保存期間の上限       |

| Storage の値 | 保存先                                                     |
|--------------|------------------------------------------------------------|
| `persistent` | `/var/log/journal/`（ディスク。再起動後も残る）            |
| `volatile`   | `/run/log/journal/`（メモリ。再起動で消える）              |
| `auto`       | `/var/log/journal/` があればそこへ、なければメモリ（既定） |
| `none`       | 保存しない                                                 |

変更後は `systemctl restart systemd-journald`。

### 8. logrotate

ログファイルが大きくなり続けないよう、定期的に切り替える（ローテーション）。通常は cron から毎日実行される。

**［図3　ログローテーション］**

切り替えのたびに、`messages` → `messages.1` → `messages.2.gz`（圧縮）と1世代ずつずれる。`rotate` で指定した世代数を超えた分は削除される。切り替え後は空の `messages` が新しく作られる。

| ファイル              | 役割                             |
|-----------------------|----------------------------------|
| `/etc/logrotate.conf` | 全体の設定                       |
| `/etc/logrotate.d/`   | サービスごとの設定ファイルを置く |

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

| 項目                            | 意味                                                           |
|---------------------------------|----------------------------------------------------------------|
| `daily` `weekly` `monthly`      | 切り替えの間隔                                                 |
| `rotate 4`                      | 残す世代数                                                     |
| `size 100M`                     | 指定サイズを超えたら切り替え                                   |
| `compress`                      | 古いログを gzip で圧縮                                         |
| `delaycompress`                 | 圧縮を1世代遅らせる                                            |
| `missingok`                     | ファイルがなくてもエラーにしない                               |
| `notifempty`                    | 空なら切り替えない                                             |
| `create モード 所有者 グループ` | 新しいログファイルを作る                                       |
| `dateext`                       | 連番の代わりに日付を付ける                                     |
| `postrotate` 〜 `endscript`     | 切り替え後に実行するコマンド                                   |
| `copytruncate`                  | コピーしてから元を空にする（ファイルを開き直せないアプリ向け） |

``` bash
# 動作を確認（実際には切り替えない）
logrotate -d /etc/logrotate.conf
# 強制的に切り替える
logrotate -f /etc/logrotate.conf
```

> **【1.09.2 まとめ】**
>
> - rsyslog はテキスト（/var/log/）、journald はバイナリ（journalctl）
> - ルールは「ファシリティ.プライオリティ　アクション」
> - プライオリティは emerg が最高、debug が最低。指定した値**以上**が対象
> - `@` はUDP、`@@` はTCPでリモート送信。ポートは514
> - `logger -p` でログを書く。`systemd-cat` はジャーナルへ
> - `journalctl -u` ユニット、`-f` 追従、`-b` 今回の起動、`-p` プライオリティ
> - 永続保存は /var/log/journal/。設定は journald.conf の Storage
> - logrotate の設定は /etc/logrotate.conf と /etc/logrotate.d/

## 1.09.3 メール配送エージェント（MTA）の基本 （重要度2）

### 1. メール配送のしくみ

**［図4　メールが届くまで］**

| 略語 | 名前                | 役割                                                       |
|------|---------------------|------------------------------------------------------------|
| MUA  | Mail User Agent     | メールソフト。メールを書く・読む                           |
| MTA  | Mail Transfer Agent | メールを転送する。MTAどうしは SMTP（25番ポート）で通信する |
| MDA  | Mail Delivery Agent | 届いたメールを各ユーザーのメールボックスに配る             |

### 2. 主なMTA

| MTA      | 特徴                                                                                        |
|----------|---------------------------------------------------------------------------------------------|
| sendmail | 最も古くからある。設定が複雑                                                                |
| postfix  | sendmail と互換性がある。高速で安全。設定が分かりやすい。多くのディストリビューションで標準 |
| exim     | 柔軟な設定が可能。Debian系で標準                                                            |
| qmail    | 安全性を重視した設計                                                                        |

試験範囲は概要まで。各MTAの設定ファイルの中身は対象外。

どのMTAも、sendmail 互換のコマンド（`sendmail`、`mailq`、`newaliases`）を備えている。

### 3. /etc/aliases（メールエイリアス）

あるアドレスあてのメールを、別の宛先に配送する設定。システム全体に効く。rootが管理する。

``` bash
# 別名: 配送先
root:       kuro
webmaster:  kuro, shiro
info:       kuro@example.com
```

| 配送先の書き方            | 意味                               |
|---------------------------|------------------------------------|
| `kuro`                    | ローカルユーザー                   |
| `kuro, shiro`             | 複数の宛先                         |
| `kuro@example.com`        | 外部のアドレス                     |
| `/var/log/mail-copy`      | ファイルに追記                     |
| `"|/usr/local/bin/prog"`  | プログラムに渡す                   |
| `:include:/etc/mail/list` | ファイルに書いた宛先一覧を読み込む |

編集したら、必ず `newaliases` を実行する。

``` bash
newaliases
```

MTAは `/etc/aliases` を直接読まず、変換後のデータベース（`/etc/aliases.db`）を使う。`newaliases` はこれを作り直す。

> **【ひっかけ】**
>
> `/etc/aliases` を編集しただけでは反映されない。`newaliases` が必要。`sendmail -bi` でも同じ。

### 4. ~/.forward

ユーザーが**自分あて**のメールの転送先を決めるファイル。ホームディレクトリに置く。

``` bash
kuro@example.com
```

手元にも残して転送する場合：

``` bash
\kuro, kuro@example.com
```

`\` を付けたユーザー名は、それ以上の転送をせず自分のメールボックスに配送する意味。

|            | /etc/aliases        | ~/.forward     |
|------------|---------------------|----------------|
| 設定する人 | root                | 各ユーザー     |
| 範囲       | システム全体        | 自分あてだけ   |
| 反映       | `newaliases` が必要 | 保存すればすぐ |

### 5. mail コマンド

コマンドラインのメールソフト（MUA）。

``` bash
# 受信メールを読む
mail
# 送る（本文入力後、Ctrl+D）
mail -s "件名" kuro@example.com
# パイプやリダイレクトで本文を渡す
echo "done" | mail -s "report" root
mail -s "log" root < /var/log/dmesg
```

受信メールは `/var/spool/mail/ユーザー名`（または `/var/mail/`）に保存される。

### 6. mailq

送信待ちのメール（メールキュー）を表示する。

``` bash
mailq
```

| 操作 | sendmail                      | postfix                       |
|------|-------------------------------|-------------------------------|
| 表示 | `mailq` または `sendmail -bp` | `mailq` または `postqueue -p` |
| 再送 | `sendmail -q`                 | `postqueue -f`                |

キューの場所は、sendmail が `/var/spool/mqueue/`、postfix が `/var/spool/postfix/`。

相手のサーバーに接続できないとき、メールはキューにたまり、一定間隔で再送される。

> **【1.09.3 まとめ】**
>
> - MTAはメールを転送するプログラム。SMTP、25番ポート
> - 主なMTAは sendmail、postfix、exim
> - `/etc/aliases` は「別名: 配送先」。編集後に `newaliases`
> - `~/.forward` はユーザー自身が設定する転送。newaliases は不要
> - `mail -s "件名" 宛先` で送信
> - `mailq` でキューを表示
