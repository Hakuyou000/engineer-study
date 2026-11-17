# LinuC102 問題 1.08 システム管理

対象: LinuC レベル1 102試験 / 全28問 / すべてオリジナル問題
対応テキスト: `LinuC102_1.08_システム管理.md`
解答・解説は末尾。

## 問題

### 1.08.1 アカウント管理

**問1** `/etc/passwd` に次の行がある。kuro のプライマリグループの GID はどれか。

```
kuro:x:1000:1001:Kuro:/home/kuro:/bin/bash
```

- A. 1000
- B. 1001
- C. x
- D. Kuro

**問2** `/etc/passwd` の第2フィールドが `x` になっている。意味として正しいものはどれか。

- A. パスワードが設定されていない
- B. アカウントがロックされている
- C. 暗号化されたパスワードは `/etc/shadow` に格納されている
- D. root 権限を持つ

**問3** 一般ユーザーが読めないファイルはどれか。

- A. `/etc/passwd`
- B. `/etc/group`
- C. `/etc/shadow`
- D. `/etc/hosts`

**問4** `useradd` で新しいユーザーを作るとき、ホームディレクトリを確実に作成するオプションはどれか。

- A. `-d`
- B. `-s`
- C. `-k`
- D. `-m`

**問5** kuro はすでに sales グループに所属している。sales から外さずに wheel グループにも所属させるコマンドはどれか。

- A. `useradd -G wheel kuro`
- B. `usermod -G wheel kuro`
- C. `usermod -g wheel kuro`
- D. `usermod -aG wheel kuro`

**問6** `/etc/skel` の説明として正しいものはどれか。

- A. 新しいユーザーのホームディレクトリにコピーされるひな形を置く
- B. 中身を変更すると、既存ユーザーのホームディレクトリにも反映される
- C. useradd の既定値を書くファイルである
- D. 削除されたユーザーのホームディレクトリを保管する

**問7** useradd の既定値(既定のシェルやスケルトンディレクトリ)を表示するコマンドはどれか。

- A. `useradd -D`
- B. `useradd -l`
- C. `ls /etc/skel`
- D. `id -D`

**問8** ユーザー kuro を削除し、ホームディレクトリも削除するコマンドはどれか。

- A. `userdel -h kuro`
- B. `usermod -r kuro`
- C. `userdel -a kuro`
- D. `userdel -r kuro`

**問9** アカウントを一時的にログインできない状態にするコマンドを**2つ**選べ。

- A. `passwd -l kuro`
- B. `usermod -L kuro`
- C. `passwd -d kuro`
- D. `usermod -U kuro`

**問10** `groupdel` でグループを削除できない場合はどれか。

- A. そのグループをセカンダリグループとするユーザーがいる
- B. そのグループを、いずれかのユーザーがプライマリグループにしている
- C. GID が 1000 以上である
- D. 所属するユーザーが1人もいない

**問11** `getent passwd kuro` と `grep kuro /etc/passwd` の違いとして正しいものはどれか。

- A. getent は nsswitch.conf に従うため、LDAP などで管理されるユーザーも表示できる
- B. 結果は常に同じになる
- C. grep のほうが参照する範囲が広い
- D. getent は root しか実行できない

**問12** `id -G` が表示するものはどれか。

- A. UID
- B. プライマリグループの GID だけ
- C. 所属するすべてのグループの GID
- D. ユーザー名

### 1.08.2 ジョブスケジューリング

**問13** crontab の `0 9 * * 1-5 /usr/local/bin/report.sh` が実行される日時はどれか。

- A. 毎日 9:00
- B. 毎日 1 時から 5 時の 9 分
- C. 毎月 1 日から 5 日の 9:00
- D. 月曜から金曜の 9:00

**問14** 10 分ごとに実行する crontab の書き方はどれか。

- A. `*/10 * * * *`
- B. `10 * * * *`
- C. `* */10 * * *`
- D. `0 10 * * *`

**問15** crontab の `0 0 13 * 5` が実行される日はどれか。

- A. 13 日が金曜日のときだけ
- B. 毎月 13 日と、毎週金曜日
- C. 毎月 5 日の 13 時
- D. 毎週金曜の 13 時

**問16** `crontab -r` の動作はどれか。

- A. 登録内容を表示する
- B. エディタで編集する
- C. 登録内容をすべて削除する
- D. 削除した内容を復元する

**問17** 実行ユーザーの欄が必要な書式はどれか。

- A. `crontab -e` で編集するユーザーの crontab
- B. `/etc/crontab`
- C. `/etc/cron.daily/` に置くファイル
- D. `/etc/anacrontab`

**問18** `/etc/cron.allow` には kuro だけが、`/etc/cron.deny` には shiro と kuro が書かれている。root 以外で crontab を使えるユーザーはどれか。

- A. kuro だけ
- B. shiro だけ
- C. kuro も shiro も使えない
- D. cron.allow と cron.deny のどちらにも書かれていない全員

**問19** 夜は電源を切る PC で、停止中に実行できなかった日次のジョブを、起動後に実行させたい。使う仕組みはどれか。

- A. cron
- B. at
- C. anacron
- D. systemd-cat

**問20** anacron で指定できる実行間隔の最小単位はどれか。

- A. 1日
- B. 1分
- C. 1時間
- D. 1週間

**問21** at で予約したジョブの一覧表示と取り消しのコマンドの組み合わせはどれか。

- A. `crontab -l` と `crontab -r`
- B. `atq` と `atrm`
- C. `jobs` と `kill`
- D. `atls` と `atdel`

**問22** システムの負荷が低くなったときにジョブを実行するコマンドはどれか。

- A. `nice`
- B. `at now`
- C. `anacron`
- D. `batch`

### 1.08.3 ローカライゼーションと国際化

**問23** ロケールの環境変数の優先順位として正しいものはどれか。

- A. LANG ＞ LC_ALL ＞ LC_*
- B. LC_ALL ＞ LC_* ＞ LANG
- C. LC_* ＞ LC_ALL ＞ LANG
- D. LANG ＞ LC_* ＞ LC_ALL

**問24** 次の環境変数が設定されている。date コマンドの表示に使われるロケールはどれか。

```
LANG=ja_JP.UTF-8
LC_TIME=en_US.UTF-8
LC_ALL=C
```

- A. ja_JP.UTF-8
- B. en_US.UTF-8
- C. C
- D. ja_JP.UTF-8 と en_US.UTF-8 を組み合わせたもの

**問25** l10n の説明として正しいものはどれか。

- A. ソフトウェアを複数の言語や地域に対応できる作りにすること
- B. 特定の言語や地域に合わせること
- C. 文字コードを変換すること
- D. 国際標準の文字集合のこと

**問26** Shift_JIS のファイル in.txt を UTF-8 に変換し、out.txt に保存するコマンドはどれか。

- A. `iconv -f SHIFT_JIS -t UTF-8 in.txt > out.txt`
- B. `iconv -f UTF-8 -t SHIFT_JIS in.txt > out.txt`
- C. `iconv -t SHIFT_JIS in.txt > out.txt`
- D. `locale -f SHIFT_JIS -t UTF-8 in.txt`

**問27** 使えるロケールの一覧を表示するコマンドはどれか。

- A. `locale -a`
- B. `locale -m`
- C. `iconv -l`
- D. `echo $LANG`

**問28** UTF-8 の説明として正しいものはどれか。

- A. 世界中の文字に番号を割り当てた文字集合である
- B. Unicode の符号化方式で、可変長であり ASCII と互換性がある
- C. 7 ビットの日本語の符号である
- D. Windows で使われてきた日本語の符号である

## 解答・解説

| 問 | 正解 | 解説 |
|---|---|---|
| 1 | B | 第3フィールドが UID、第4フィールドがプライマリグループの GID。 |
| 2 | C | `x` は、パスワードの実体が `/etc/shadow` にあることを示す。 |
| 3 | C | `/etc/shadow` は root しか読めない。passwd と group は全員が読める。 |
| 4 | D | `-m` でホームディレクトリを作る。`-d` はパスの指定だけ。 |
| 5 | D | `-G` はセカンダリグループを置き換える。追加するときは `-aG`。`-g` はプライマリグループの変更。 |
| 6 | A | `/etc/skel` の中身は、ホームディレクトリを作るときにコピーされる。既存ユーザーには反映されない。 |
| 7 | A | `useradd -D` で `/etc/default/useradd` の既定値を表示する。 |
| 8 | D | `-r` でホームディレクトリとメールスプールも削除する。 |
| 9 | A、B | どちらも `/etc/shadow` のパスワード欄の先頭に `!` を付ける。`passwd -d` はパスワードを空にし、`usermod -U` はロックを解除する。 |
| 10 | B | プライマリグループになっているグループは削除できない。 |
| 11 | A | getent は `/etc/nsswitch.conf` の設定に従って情報を引く。grep はローカルのファイルしか見ない。 |
| 12 | C | `-u` は UID、`-g` はプライマリ GID、`-G` は全グループの GID。 |
| 13 | D | 書式は「分 時 日 月 曜日」。曜日の 1-5 は月曜から金曜。 |
| 14 | A | `/` は間隔。分の欄に `*/10` で 10 分ごと。`10 * * * *` は毎時 10 分。 |
| 15 | B | 日と曜日の両方を指定すると、どちらかに一致した日(OR)に実行される。 |
| 16 | C | `-r` は確認なしで全ジョブを削除する。`-l` が表示、`-e` が編集。 |
| 17 | B | ユーザー欄があるのは `/etc/crontab` と `/etc/cron.d/`。cron.daily などに置くのは実行権のあるスクリプト。 |
| 18 | A | cron.allow があれば、そこに書かれたユーザーだけが使える。cron.deny は見ない。 |
| 19 | C | anacron は前回の実行からの日数で判断し、未実行のジョブを起動後に実行する。 |
| 20 | A | anacron の最小単位は 1 日。時や分の単位は指定できない。 |
| 21 | B | `atq`(`at -l`)で一覧、`atrm`(`at -d`)で取り消し。 |
| 22 | D | batch は負荷が下がったときに実行する。 |
| 23 | B | LC_ALL が最優先。LC_* が未設定のカテゴリは LANG を使う。 |
| 24 | C | LC_ALL が設定されていると、LANG と LC_* はすべて無視される。 |
| 25 | B | l10n(localization)は特定の地域に合わせること。複数の言語や地域に対応できる作りにするのは i18n(internationalization)。 |
| 26 | A | `-f` が変換元、`-t` が変換先。結果は標準出力に出るのでリダイレクトする。 |
| 27 | A | `locale -a` で使えるロケール、`locale -m` で使える文字コード、`iconv -l` は iconv が対応する文字コード。 |
| 28 | B | UTF-8 は Unicode の符号化方式で 1〜4 バイトの可変長。文字集合は Unicode、7 ビットの日本語の符号は ISO-2022-JP、Windows の日本語の符号は Shift_JIS。 |
