# LinuC102 問題 1.09 重要なシステムサービス

対象: LinuC レベル1 102試験 / 全32問 / すべてオリジナル問題
対応テキスト: `LinuC102_1.09_重要なシステムサービス.md`
解答・解説は末尾。

## 問題

### 1.09.1 システム時刻の管理

**問1** `LinuC102-1.09-001` システムクロック(OS が管理する時刻)を、ハードウェアクロック(マザーボードの時計)に書き込むコマンドはどれか。

- A. `hwclock -s`
- B. `date -w`
- C. `hwclock -r`
- D. `hwclock -w`

**問2** `LinuC102-1.09-002` `date 111714302026` を実行して時刻を設定した。この引数の数字の並び方として正しいものはどれか。

- A. MMDDhhmmYYYY
- B. YYYYMMDDhhmm
- C. DDMMhhmmYYYY
- D. hhmmMMDDYYYY

**問3** `LinuC102-1.09-003` システム全体のタイムゾーンを決めているファイルはどれか。

- A. `/etc/timezone.conf`
- B. `/usr/share/zoneinfo/localtime`
- C. `/var/lib/timezone`
- D. `/etc/localtime`

**問4** `LinuC102-1.09-004` tzselect コマンドの説明として正しいものはどれか。

- A. システムのタイムゾーンを変更する
- B. NTP サーバーを選択する
- C. 対話形式でタイムゾーン名を調べる。システムの設定は変えない
- D. 環境変数 TZ を全ユーザーに恒久的に設定する

**問5** `LinuC102-1.09-005` NTP(時刻同期のプロトコル)が使うポートはどれか。

- A. UDP 123
- B. TCP 123
- C. UDP 53
- D. TCP 25

**問6** `LinuC102-1.09-006` NTP サーバーと時刻を1回だけ同期して終了するコマンドはどれか。

- A. `ntpd`
- B. `ntpq`
- C. `ntpdate`
- D. `chronyd`

**問7** `LinuC102-1.09-007` `ntpq -p` の出力で、行頭に `*` が付いたサーバーの意味はどれか。

- A. 現在同期しているサーバー
- B. 同期先の候補
- C. 到達できないサーバー
- D. 設定から除外されたサーバー

**問8** `LinuC102-1.09-008` chrony を使っているときに、時刻の同期先の一覧を表示するコマンドはどれか。

- A. `ntpq -p`
- B. `chronyd -l`
- C. `chronyc sources`
- D. `timedatectl sources`

**問27** `LinuC102-1.09-027` Red Hat 系のディストリビューションで、chronyd の設定ファイルのパスを答えよ。

**問28** `LinuC102-1.09-028` `pool.ntp.org` の説明として正しいものはどれか。

- A. 原子時計に直結した stratum 0 のサーバー
- B. 公開されている NTP サーバーの集まり。問い合わせるたびに別のサーバーが割り当てられる
- C. chrony の設定ファイル
- D. 時刻同期のプロトコルの名前

**問29** `LinuC102-1.09-029` ntpd の同期先を `server` 行で指定する設定ファイルのパスを答えよ。

### 1.09.2 システムのログ

**問9** `LinuC102-1.09-009` rsyslog の設定に `mail.err /var/log/mail-err` と書いた。このファイルに記録されるログのプライオリティ(重要度)はどれか。

- A. err だけ
- B. err、crit、alert、emerg
- C. err より低いもの
- D. すべて

**問10** `LinuC102-1.09-010` mail ファシリティのログのうち、プライオリティが err のものだけを記録するセレクタの書き方はどれか。

- A. `mail.!err`
- B. `mail.err`
- C. `mail.=err`
- D. `mail.none`

**問11** `LinuC102-1.09-011` ログのプライオリティを、重要度の高い順に並べたものはどれか。

- A. emerg、alert、crit、err
- B. crit、emerg、alert、err
- C. err、crit、alert、emerg
- D. alert、emerg、err、crit

**問12** `LinuC102-1.09-012` すべてのログを、192.168.1.100 のログサーバーへ TCP で送る rsyslog の設定はどれか。

- A. `*.* @192.168.1.100`
- B. `*.* >>192.168.1.100`
- C. `*.* tcp://192.168.1.100`
- D. `*.* @@192.168.1.100`

**問13** `LinuC102-1.09-013` rsyslog に次の設定がある。`/var/log/messages` に記録されるログはどれか。

```
*.info;mail.none;authpriv.none    /var/log/messages
```

- A. info 以上のすべて。ただし mail と authpriv は除く
- B. info だけ
- C. mail と authpriv の info 以上だけ
- D. info 未満のすべて

**問14** `LinuC102-1.09-014` ログを集めるサーバー側で、UDP でログを受信するために読み込む rsyslog のモジュールはどれか。

- A. `imtcp`
- B. `omudp`
- C. `imudp`
- D. `imjournal`

**問15** `LinuC102-1.09-015` ファシリティを local0、プライオリティを info にして、ログにメッセージを書き込むコマンドはどれか。

- A. `logger -p local0.info "test"`
- B. `logger -t local0.info "test"`
- C. `logger -f local0 info "test"`
- D. `systemd-cat local0.info "test"`

**問16** `LinuC102-1.09-016` sshd ユニットのログのうち、今回システムを起動してからの分だけを表示するコマンドはどれか。

- A. `journalctl -k sshd`
- B. `journalctl -f sshd`
- C. `journalctl -p sshd`
- D. `journalctl -u sshd -b`

**問17** `LinuC102-1.09-017` journald の設定ファイルで、ジャーナル(systemd のログ)を再起動後も残るようにディスクへ保存する `Storage=` の値はどれか。

- A. `volatile`
- B. `persistent`
- C. `none`
- D. `memory`

**問18** `LinuC102-1.09-018` 2 週間より古いジャーナルのログを削除するコマンドはどれか。

- A. `journalctl --vacuum-time=2weeks`
- B. `journalctl --vacuum-size=2weeks`
- C. `journalctl --since 2weeks --delete`
- D. `logrotate -f 2weeks`

**問19** `LinuC102-1.09-019` ログインに失敗した記録の一覧を表示するコマンドはどれか。

- A. `last`
- B. `lastlog`
- C. `lastb`
- D. `who`

**問20** `LinuC102-1.09-020` logrotate の設定に書いた `rotate 4` の意味はどれか。

- A. 4 日ごとに切り替える
- B. 4 回まで再試行する
- C. 4MB を超えたら切り替える
- D. 古いログを 4 世代残す

**問21** `LinuC102-1.09-021` logrotate で、ログファイルが空のときはローテーション(切り替え)をしない設定はどれか。

- A. `missingok`
- B. `nocreate`
- C. `delaycompress`
- D. `notifempty`

**問22** `LinuC102-1.09-022` logrotate の設定を確認するために、実際にはログを切り替えず、何をするかだけを表示するオプションはどれか。

- A. `-f`
- B. `-d`
- C. `-s`
- D. `-r`

**問30** `LinuC102-1.09-030` サービスごとの logrotate の設定ファイルを置くディレクトリのパスを答えよ。

### 1.09.3 メール配送エージェント(MTA)の基本

**問23** `LinuC102-1.09-023` MTA(メール転送エージェント)の役割として正しいものはどれか。

- A. メールを書いたり読んだりする
- B. 届いたメールを各ユーザーのメールボックスに配る
- C. メールの本文を暗号化する
- D. SMTP でメールを転送する

**問24** `LinuC102-1.09-024` メールの別名を設定する `/etc/aliases` を編集した。変更を反映するために実行するコマンドはどれか。

- A. `newaliases`
- B. `mailq`
- C. `source /etc/aliases`
- D. `mail -s reload root`

**問25** `LinuC102-1.09-025` ユーザー sato は、自分あてのメールを sato@example.com に転送しつつ、自分のメールボックスにも残したい。sato の `~/.forward` に書く内容はどれか。

- A. `sato@example.com`
- B. `"|sato@example.com"`
- C. `sato: sato@example.com`
- D. `\sato, sato@example.com`

**問26** `LinuC102-1.09-026` 送信待ちのメール(メールキュー)を表示するコマンドはどれか。

- A. `mailq`
- B. `mail -q`
- C. `newaliases`
- D. `sendmail -q`

**問31** `LinuC102-1.09-031` Debian 系のディストリビューションで、標準の MTA として使われてきたものはどれか。

- A. sendmail
- B. postfix
- C. exim
- D. qmail

**問32** `LinuC102-1.09-032` postfix の説明として正しいものはどれか。

- A. 最も古くからある MTA で、設定が複雑である
- B. メールを書いたり読んだりするための MUA である
- C. 届いたメールをメールボックスに配る MDA の機能だけを持つ
- D. sendmail と互換性があり、高速で安全性が高く、設定が分かりやすい

## 解答・解説

### 問1 `LinuC102-1.09-001`

**正解**: D

**テキスト**: 3. hwclock

`hwclock -w`(`--systohc`)は、システムクロックの時刻をハードウェアクロックに書き込みます。`-s`(`--hctosys`)は逆に、ハードウェアクロックからシステムクロックへ設定し、`-r` はハードウェアクロックの時刻を表示します。`date -w` というオプションはありません。

### 問2 `LinuC102-1.09-002`

**正解**: A

**テキスト**: 2. date

date で時刻を設定するときは「月 日 時 分 年」の順(MMDDhhmmYYYY)に書きます。この例は 11 月 17 日 14 時 30 分、2026 年です。年が最後に来る点に注意します。

- B. 年を先頭に書く並びは、`date -s "2026-11-17 14:30"` のように `-s` で文字列を渡すときの書き方です。
- C. 日と月の順が逆です。
- D. 時刻が先頭に来ることはありません。

### 問3 `LinuC102-1.09-003`

**正解**: D

**テキスト**: 4. タイムゾーン

`/etc/localtime` は、`/usr/share/zoneinfo/` にあるタイムゾーンのファイル(例: `Asia/Tokyo`)のコピーか、そこへのシンボリックリンクです。このファイルでシステム全体のタイムゾーンが決まります。

- A. `/etc/timezone.conf` というファイルはありません(Debian 系には `/etc/timezone` がありますが、名前を書いたテキストです)。
- B. `/usr/share/zoneinfo/` にあるのは各地のタイムゾーンのファイルで、その中に `localtime` はありません。
- C. `/var/lib/timezone` というファイルはありません。

### 問4 `LinuC102-1.09-004`

**正解**: C

**テキスト**: 4. タイムゾーン

tzselect は、質問に答えていくと、そのタイムゾーンの名前(TZ に設定する値)を表示してくれるコマンドです。システムの設定そのものは変更しません。変更するには `timedatectl set-timezone` などを使います。

### 問5 `LinuC102-1.09-005`

**正解**: A

**テキスト**: 5. NTP

NTP は UDP の 123 番ポートを使います。UDP の 53 番は DNS、TCP の 25 番は SMTP です。

### 問6 `LinuC102-1.09-006`

**正解**: C

**テキスト**: 6. ntpd / ntpdate / ntpq

ntpdate は、NTP サーバーと1回だけ時刻を合わせて終了します。ntpd と chronyd は、常に動き続けて時刻を合わせ続けるデーモンです。ntpq は ntpd の状態を確認するコマンドです。

### 問7 `LinuC102-1.09-007`

**正解**: A

**テキスト**: 6. ntpd / ntpdate / ntpq

`ntpq -p` の出力で、行頭の `*` は現在同期しているサーバー、`+` は同期先の候補を表します。

### 問8 `LinuC102-1.09-008`

**正解**: C

**テキスト**: 7. chrony

chrony の状態を確認するには chronyc を使い、`chronyc sources` で同期先の一覧を表示します。同期しているサーバーには `^*` が付きます。`ntpq -p` は ntpd 用です。

### 問9 `LinuC102-1.09-009`

**正解**: B

**テキスト**: 3. rsyslog の設定

セレクタでプライオリティを指定すると、そのプライオリティ「以上」のログがすべて対象になります。そのため err に加えて、より重要な crit、alert、emerg も記録されます。

### 問10 `LinuC102-1.09-010`

**正解**: C

**テキスト**: 3. rsyslog の設定

`mail.=err` のように `=` を付けると、そのプライオリティだけが対象になります。`mail.err` は err 以上すべて、`!` は指定したもの「未満」、`none` はそのファシリティを記録しない、という意味です。

### 問11 `LinuC102-1.09-011`

**正解**: A

**テキスト**: 3. rsyslog の設定

プライオリティは、重要度の高い順に emerg、alert、crit、err、warning、notice、info、debug です。emerg はシステムが使えない状態、debug はデバッグ用の情報です。

### 問12 `LinuC102-1.09-012`

**正解**: D

**テキスト**: 4. ログの集約(他のサーバーとの送受信)

ログの転送先の前に `@` を1つ付けると UDP、`@@` と2つ付けると TCP で送ります(ポートは標準で 514 番)。`>>` や `tcp://` という書き方はありません。

### 問13 `LinuC102-1.09-013`

**正解**: A

**テキスト**: 3. rsyslog の設定

設定の左側(セレクタ)を `;` で区切って、前から順に読みます。
① `*.info` … すべてのファシリティ(`*`)の、info 以上の重大度を対象にする。「以上」なので info、notice、warning、err、crit、alert、emerg が含まれます。debug は含まれません。
② `mail.none` … mail ファシリティは記録しない(除外)。
③ `authpriv.none` … authpriv ファシリティも記録しない。
④ 右側の `/var/log/messages` … 対象のログを書き込むファイル。

まとめると「info 以上のすべて。ただし mail と authpriv は除く」です。info だけを指定する書き方は `*.=info`、info 未満は `*.!info` です。mail と authpriv は除外されているので、それらだけが記録されることはありません。メールと認証のログは、`/var/log/maillog` や `/var/log/secure` に分けて記録するのが一般的です。

### 問14 `LinuC102-1.09-014`

**正解**: C

**テキスト**: 4. ログの集約(他のサーバーとの送受信)

ログを受信するモジュールは、input module の略で im で始まります。UDP で受信するのは imudp、TCP は imtcp です。omudp の om は output module で送信用、imjournal は journald からログを読むモジュールです。

### 問15 `LinuC102-1.09-015`

**正解**: A

**テキスト**: 5. logger と systemd-cat

logger は、`-p ファシリティ.プライオリティ` でログの種類を指定して書き込みます。`-t` はログに付けるタグ(名前)の指定です。systemd-cat はコマンドの出力をジャーナルに送るコマンドで、この書き方はできません。

### 問16 `LinuC102-1.09-016`

**正解**: D

**テキスト**: 6. journalctl

journalctl の `-u` でユニット、`-b` で今回の起動以降を指定します。`-k` はカーネルのメッセージ、`-f` は新しいログを追いかけて表示、`-p` はプライオリティで絞り込むオプションです。

### 問17 `LinuC102-1.09-017`

**正解**: B

**テキスト**: 7. journald の設定

`Storage=persistent` にすると、ジャーナルを `/var/log/journal/` に保存し、再起動しても残ります。`volatile` はメモリ上(`/run/log/journal/`)にだけ保存するので、再起動すると消えます。

### 問18 `LinuC102-1.09-018`

**正解**: A

**テキスト**: 6. journalctl

`--vacuum-time` は期間を指定して、それより古いジャーナルを削除します。`--vacuum-size` はサイズを指定して、合計がその大きさになるまで古いものから削除します。

### 問19 `LinuC102-1.09-019`

**正解**: C

**テキスト**: 2. /var/log の主なファイル

lastb は、ログインに失敗した記録(`/var/log/btmp`)を表示します。last はログインした履歴、lastlog は各ユーザーが最後にログインした日時、who は現在ログインしているユーザーを表示します。

### 問20 `LinuC102-1.09-020`

**正解**: D

**テキスト**: 8. logrotate

`rotate 4` は、古いログファイルを 4 世代まで残すという意味です。それより古いものは削除されます。切り替える間隔は daily や weekly、サイズは size で指定します。

4 回まで再試行するという設定はありません。logrotate は決めた条件のときに 1 回切り替えます。

### 問21 `LinuC102-1.09-021`

**正解**: D

**テキスト**: 8. logrotate

`notifempty` を書くと、ログファイルが空のときは切り替えません。missingok はログファイルがなくてもエラーにしない設定、nocreate は切り替え後に新しいファイルを作らない設定、delaycompress は圧縮を次の回まで遅らせる設定です。

### 問22 `LinuC102-1.09-022`

**正解**: B

**入力の別解**: `--debug`

**テキスト**: 8. logrotate

`-d`(デバッグモード)は、何をするかを表示するだけで、実際にはログを切り替えません。設定の確認に使います。`-f` は条件に関係なく強制的に切り替えます。

`-s` は状態のファイル(どのログをいつ切り替えたか)の場所を指定するオプションです。`-r` は logrotate にはありません。

### 問23 `LinuC102-1.09-023`

**正解**: D

**テキスト**: 1. メールが届く仕組み

MTA は、SMTP でメールを他のサーバーへ転送する役割を持ちます。メールを書いたり読んだりするのは MUA(メールソフト)、届いたメールを各ユーザーのメールボックスに配るのは MDA です。

### 問24 `LinuC102-1.09-024`

**正解**: A

**入力の別解**: `sendmail -bi`

**テキスト**: 3. /etc/aliases(メールの別名)

MTA は、`/etc/aliases` そのものではなく、変換したデータベース(`/etc/aliases.db`)を読みます。そのため、編集した後は `newaliases` でデータベースを作り直します。mailq は送信待ちのメールの表示です。

### 問25 `LinuC102-1.09-025`

**正解**: D

**テキスト**: 4. ~/.forward

`~/.forward` に `\sato` のように `\` を付けた自分のユーザー名を書くと、それ以上転送せずに自分のメールボックスに配送されます。カンマで区切って転送先も書くと、両方に届きます。転送先だけを書くと、自分のメールボックスには残りません。

### 問26 `LinuC102-1.09-026`

**正解**: A

**入力の別解**: `sendmail -bp`、`postqueue -p`

**テキスト**: 6. mailq

mailq は、送信を待っているメール(メールキュー)を表示します。`sendmail -q` はキューのメールを再送するコマンドで、newaliases は別名のデータベースを作り直すコマンドです。

### 問27 `LinuC102-1.09-027`

**正解**: `/etc/chrony.conf`

**テキスト**: 7. chrony

Red Hat 系では `/etc/chrony.conf` が chronyd の設定ファイルです(Debian 系では `/etc/chrony/chrony.conf`)。同期の状態は `chronyc sources` で確認します。

### 問28 `LinuC102-1.09-028`

**正解**: B

**テキスト**: 5. NTP

`pool.ntp.org` は、世界中のボランティアが公開している NTP サーバーの集まりで、問い合わせるたびに別のサーバーが割り当てられます。`0.pool.ntp.org` 〜 `3.pool.ntp.org` や、国別の `jp.pool.ntp.org` などがあります。

### 問29 `LinuC102-1.09-029`

**正解**: `/etc/ntp.conf`

**テキスト**: 6. ntpd / ntpdate / ntpq

ntpd の設定ファイルは `/etc/ntp.conf` で、`server` 行に同期先を書きます。同期の状態は `ntpq -p` で確認します。chrony を使う場合の設定ファイルは `chrony.conf` です。

### 問30 `LinuC102-1.09-030`

**正解**: `/etc/logrotate.d`

**テキスト**: 8. logrotate

サービスごとの logrotate の設定は、`/etc/logrotate.d/` の下にファイルとして置きます。全体の共通の設定は `/etc/logrotate.conf` に書きます。

### 問31 `LinuC102-1.09-031`

**正解**: C

**テキスト**: 2. 主な MTA

Debian では、柔軟な設定ができる exim が標準の MTA として使われてきました。現在、多くのディストリビューションで標準になっているのは postfix で、sendmail は最も古くからある MTA です。qmail は安全性を重視した MTA ですが、標準として採用されることは少なくなっています。

### 問32 `LinuC102-1.09-032`

**正解**: D

**テキスト**: 2. 主な MTA

postfix は sendmail と互換性のあるコマンド(sendmail、mailq、newaliases)を備え、高速で安全性が高く、設定も分かりやすい MTA です。多くのディストリビューションで標準になっています。最も古く設定が複雑なのは sendmail です。
