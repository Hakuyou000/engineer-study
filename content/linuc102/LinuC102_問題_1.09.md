# LinuC102 問題 1.09 重要なシステムサービス

対象: LinuC レベル1 102試験 / 全26問 / すべてオリジナル問題
対応テキスト: `LinuC102_1.09_重要なシステムサービス.md`
解答・解説は末尾。

## 問題

### 1.09.1 システム時刻の管理

**問1** システムクロックの時刻をハードウェアクロックに書き込むコマンドはどれか。

- A. `hwclock -s`
- B. `date -w`
- C. `hwclock -r`
- D. `hwclock -w`

**問2** `date 111714302026` を実行した。引数の並びとして正しいものはどれか。

- A. MMDDhhmmYYYY
- B. YYYYMMDDhhmm
- C. DDMMhhmmYYYY
- D. hhmmMMDDYYYY

**問3** システム全体のタイムゾーンを表すファイルはどれか。

- A. `/etc/timezone.conf`
- B. `/usr/share/zoneinfo/localtime`
- C. `/var/lib/timezone`
- D. `/etc/localtime`

**問4** tzselect の説明として正しいものはどれか。

- A. システムのタイムゾーンを変更する
- B. NTP サーバーを選択する
- C. 対話形式でタイムゾーン名を調べる。システムの設定は変えない
- D. 環境変数 TZ を全ユーザーに恒久的に設定する

**問5** NTP が使うポートはどれか。

- A. UDP 123
- B. TCP 123
- C. UDP 53
- D. TCP 25

**問6** 時刻を1回だけ同期するコマンドはどれか。

- A. `ntpd`
- B. `ntpq`
- C. `ntpdate`
- D. `chronyd`

**問7** `ntpq -p` の出力で、行頭に `*` が付いたサーバーの意味はどれか。

- A. 現在同期しているサーバー
- B. 同期先の候補
- C. 到達できないサーバー
- D. 設定から除外されたサーバー

**問8** chrony で同期先の一覧を表示するコマンドはどれか。

- A. `ntpq -p`
- B. `chronyd -l`
- C. `chronyc sources`
- D. `timedatectl sources`

### 1.09.2 システムのログ

**問9** rsyslog に `mail.err /var/log/mail-err` と書いた。記録されるプライオリティはどれか。

- A. err だけ
- B. err、crit、alert、emerg
- C. err より低いもの
- D. すべて

**問10** mail ファシリティの err だけを記録するセレクタはどれか。

- A. `mail.!err`
- B. `mail.err`
- C. `mail.=err`
- D. `mail.none`

**問11** プライオリティを高い順に並べたものはどれか。

- A. emerg、alert、crit、err
- B. crit、emerg、alert、err
- C. err、crit、alert、emerg
- D. alert、emerg、err、crit

**問12** すべてのログを 192.168.1.100 のログサーバーへ TCP で送る rsyslog の設定はどれか。

- A. `*.* @192.168.1.100`
- B. `*.* >>192.168.1.100`
- C. `*.* tcp://192.168.1.100`
- D. `*.* @@192.168.1.100`

**問13** 次の rsyslog の設定で、`/var/log/messages` に記録されるものはどれか。

```
*.info;mail.none;authpriv.none    /var/log/messages
```

- A. info 以上のすべて。ただし mail と authpriv は除く
- B. info だけ
- C. mail と authpriv の info 以上だけ
- D. info 未満のすべて

**問14** ログサーバー側で、UDP でログを受信するために読み込む rsyslog のモジュールはどれか。

- A. `imtcp`
- B. `omudp`
- C. `imudp`
- D. `imjournal`

**問15** ファシリティ local0、プライオリティ info でログを書き込むコマンドはどれか。

- A. `logger -p local0.info "test"`
- B. `logger -t local0.info "test"`
- C. `logger -f local0 info "test"`
- D. `systemd-cat local0.info "test"`

**問16** sshd ユニットのログを、今回の起動以降の分だけ表示するコマンドはどれか。

- A. `journalctl -k sshd`
- B. `journalctl -f sshd`
- C. `journalctl -p sshd`
- D. `journalctl -u sshd -b`

**問17** journald の設定で、ジャーナルを再起動後も残るようにディスクへ保存する `Storage=` の値はどれか。

- A. `volatile`
- B. `persistent`
- C. `none`
- D. `memory`

**問18** 2 週間より古いジャーナルを削除するコマンドはどれか。

- A. `journalctl --vacuum-time=2weeks`
- B. `journalctl --vacuum-size=2weeks`
- C. `journalctl --since 2weeks --delete`
- D. `logrotate -f 2weeks`

**問19** ログインに失敗した履歴を表示するコマンドはどれか。

- A. `last`
- B. `lastlog`
- C. `lastb`
- D. `who`

**問20** logrotate の設定 `rotate 4` の意味はどれか。

- A. 4 日ごとに切り替える
- B. 4 回まで再試行する
- C. 4MB を超えたら切り替える
- D. 古いログを 4 世代残す

**問21** logrotate で、ログファイルが空なら切り替えない設定はどれか。

- A. `missingok`
- B. `nocreate`
- C. `delaycompress`
- D. `notifempty`

**問22** logrotate の設定を確認するため、実際には切り替えずに動作を表示するオプションはどれか。

- A. `-f`
- B. `-d`
- C. `-s`
- D. `-r`

### 1.09.3 メール配送エージェント(MTA)の基本

**問23** MTA の役割として正しいものはどれか。

- A. メールを書いたり読んだりする
- B. 届いたメールを各ユーザーのメールボックスに配る
- C. メールの本文を暗号化する
- D. SMTP でメールを転送する

**問24** `/etc/aliases` を編集した。変更を反映するために実行するコマンドはどれか。

- A. `newaliases`
- B. `mailq`
- C. `source /etc/aliases`
- D. `mail -s reload root`

**問25** 自分あてのメールを kuro@example.com に転送しつつ、自分のメールボックスにも残したい。ユーザー kuro の `~/.forward` に書く内容はどれか。

- A. `kuro@example.com`
- B. `"|kuro@example.com"`
- C. `kuro: kuro@example.com`
- D. `\kuro, kuro@example.com`

**問26** 送信待ちのメール(メールキュー)を表示するコマンドはどれか。

- A. `mailq`
- B. `mail -q`
- C. `newaliases`
- D. `sendmail -q`

## 解答・解説

| 問 | 正解 | 解説 |
|---|---|---|
| 1 | D | `-w`(`--systohc`)はシステムからハードウェアへ書き込む。`-s` は逆、`-r` は表示。 |
| 2 | A | 月日時分の後に年を書く。年が最後に来る。 |
| 3 | D | `/etc/localtime` は zoneinfo のファイルのコピーかシンボリックリンク。 |
| 4 | C | tzselect は TZ に設定すべき値を表示するだけで、システムの設定は変えない。 |
| 5 | A | NTP は UDP 123。 |
| 6 | C | ntpdate は1回だけ同期する。ntpd と chronyd は常駐するデーモン、ntpq は ntpd の状態確認。 |
| 7 | A | `*` は同期中、`+` は候補。 |
| 8 | C | chrony の確認は chronyc。同期中のサーバーには `^*` が付く。 |
| 9 | B | プライオリティを指定すると、その値以上が対象になる。 |
| 10 | C | `=` はそのプライオリティだけ、`!` はそれ未満、`none` は記録しない。 |
| 11 | A | 高い順に emerg、alert、crit、err、warning、notice、info、debug。 |
| 12 | D | `@` 1つは UDP、`@@` 2つは TCP。ポートは 514。 |
| 13 | A | `;` で条件を並べる。`mail.none` と `authpriv.none` で、その2つを除外する。 |
| 14 | C | 受信は im(input module)。UDP は imudp、TCP は imtcp。 |
| 15 | A | `-p ファシリティ.プライオリティ` で指定する。`-t` はタグ。 |
| 16 | D | `-u` でユニット、`-b` で今回の起動分。`-k` はカーネル、`-f` は追従、`-p` はプライオリティ。 |
| 17 | B | persistent は `/var/log/journal/` に保存する。volatile は `/run/log/journal/`(メモリ)。 |
| 18 | A | `--vacuum-time` は期間、`--vacuum-size` はサイズで古い分を削除する。 |
| 19 | C | lastb は `/var/log/btmp` を読む。last はログイン履歴、lastlog は最終ログイン、who は現在のログイン。 |
| 20 | D | rotate は残す世代数。間隔は daily や weekly、サイズは size で指定する。 |
| 21 | D | notifempty は空なら切り替えない。missingok はファイルがなくてもエラーにしない。 |
| 22 | B | `-d` はデバッグモードで、実際には切り替えない。`-f` は強制的に切り替える。 |
| 23 | D | MTA はメールを転送する。A は MUA、B は MDA。 |
| 24 | A | MTA は変換後のデータベース(`/etc/aliases.db`)を使う。newaliases で作り直す。 |
| 25 | D | `\` を付けたユーザー名は、それ以上転送せず自分のメールボックスに配送する。 |
| 26 | A | mailq でキューを表示する。`sendmail -q` はキューの再送。 |
