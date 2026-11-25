# LinuC 3SS テキスト 5.0 認証・認可

対象: LinuC レベル3 3SS試験 Version 1.0

ユーザーが「本人であること」(認証)と「してよいこと」(認可)を、どう確かめ、どう決めるかを学びます。1 台のサーバーでは PAM、会社全体のサーバーでは FreeIPA、Web のアプリケーションでは Keycloak が、それぞれ中心になります。Red Hat 系(AlmaLinux / RHEL 9 系)と Debian 系(Ubuntu 24.04 / Debian 12)で違うところは、両方書きます。PAM の基本と LDAP と SSSD の基本は、LinuC 202 のテキスト 2.07 と同じ内容です。ここでは、守る側の設定と、症状から原因を探すところに重点を置きます。

## 5.1 PAM による認証制御 (重要度2)

出題範囲: type、control、module-path、module-arguments。pam_access、pam_securetty、pam_localuser。pam_faillock、pam_deny、pam_permit、pam_faildelay、pam_succeed_if、pam_nologin、pam_pwquality。pam_tty_audit。pam_env、pam_systemd、pam_keyinit。

### 1. PAM の設定の読み方

**PAM**(Pluggable Authentication Modules)は、認証の部品(モジュール)を組み合わせて、プログラムごとに認証の方法を決める仕組みです。設定は `/etc/pam.d/` の下に、プログラムごとのファイルとして置きます(`sshd`、`sudo`、`login` など)。1 行は次の 4 つの部分でできています。

```
# type    control     module-path        module-arguments
auth      required    pam_faillock.so    authfail deny=5 unlock_time=900
```

| 部分 | 意味 |
|---|---|
| type | 何をする段階か。`auth`(本人の確認)、`account`(アカウントを使ってよいか)、`password`(パスワードの変更)、`session`(ログインの前後の準備と後片付け) |
| control | モジュールの結果の扱い方。`required`、`requisite`、`sufficient`、`optional`、`include`、`substack` |
| module-path | モジュールのファイル名。`pam_unix.so` のように名前だけ書くと、システムのモジュールの置き場所から探す |
| module-arguments | モジュールに渡す引数。空白で区切って並べる |

control の違いです。

| control | 成功したとき | 失敗したとき |
|---|---|---|
| `required` | 続きの行を実行する | 続きの行を最後まで実行してから、失敗を返す |
| `requisite` | 続きの行を実行する | すぐに失敗を返す |
| `sufficient` | それまでに失敗した required がなければ、すぐに成功を返す | 無視して続きの行へ進む |
| `optional` | 結果はほぼ無視される | 同じ |

`[success=1 default=ignore]` のように、`[値=動作]` で書く形もあります。`success=1` は「成功したら次の 1 行を飛ばす」という意味です。

type ごとに、行は上から順に評価されます。順番を間違えると、拒否したいのに通る、通したいのに拒否される、という事故になります。

```text
auth スタックの流れ(sshd の例。上から下へ評価する)

  1. auth required   pam_faillock.so preauth    ロック中なら失敗
  2. auth sufficient pam_sss.so                 成功なら、ここで認証は成功
  3. auth sufficient pam_unix.so                成功なら、ここで認証は成功
  4. auth required   pam_faillock.so authfail   失敗を記録する
  5. auth required   pam_deny.so                ここまで来たら必ず失敗
```

最後に `pam_deny` を置くのは、「どのモジュールにも許可されなかったら拒否する」という安全側の終わり方にするためです。

### 2. 設定を管理する道具(Red Hat 系と Debian 系)

| 項目 | Red Hat 系(RHEL 9 系) | Debian 系(Ubuntu 24.04) |
|---|---|---|
| 共通の設定 | `/etc/pam.d/system-auth`、`password-auth` | `/etc/pam.d/common-auth`、`common-account`、`common-password`、`common-session` |
| 管理の道具 | `authselect` | `pam-auth-update` |
| 直接編集 | しない(authselect が上書きする) | `/usr/share/pam-configs/` にプロファイルを置いて使う |

RHEL 9 系では、`/etc/pam.d/system-auth` などは `/etc/authselect/` の下のファイルへのシンボリックリンクです。直接編集すると、`authselect` を実行したときに元に戻ります。変えたいときは、プロファイルの機能(feature)を使います。

```
$ authselect current                                   # 今のプロファイルと有効な機能を見る
$ sudo authselect select sssd with-faillock            # sssd プロファイル + faillock を有効にする
$ sudo authselect enable-feature with-mkhomedir        # 機能を足す
$ sudo authselect check                                # 設定が authselect の管理のままか確かめる
$ sudo authselect apply-changes                        # 変更を反映する
```

`pam_tally2` は古い失敗回数の数え方で、いまの RHEL 9 系にはありません。同じ役割は **`pam_faillock`** が受け持ちます。

注意することがあります。PAM の設定を間違えると、自分もログインできなくなります。設定を変えるときは、**root のシェルを 1 つ開いたままにして**、別の端末でログインを試します。

### 3. アクセスを制限するモジュール

| モジュール | 役割 | 主な type |
|---|---|---|
| `pam_access` | `/etc/security/access.conf` に書いたルールで、ユーザーと接続元(端末、ホスト)の組み合わせを許可・拒否する | account |
| `pam_securetty` | root のログインを、`/etc/securetty` に書いた端末だけに限る | auth |
| `pam_localuser` | ユーザーが `/etc/passwd` にあるローカルのユーザーなら成功する | account |
| `pam_succeed_if` | ユーザー名、UID、所属グループなどの条件で成功か失敗を決める | どれでも |
| `pam_nologin` | `/etc/nologin` があるあいだ、root 以外のログインを断る | account(auth も可) |
| `pam_deny` | いつも失敗する | どれでも |
| `pam_permit` | いつも成功する | どれでも |

`pam_access` のルールは、`許可(+)か拒否(-) : ユーザー : 接続元` の形で、上から順に見て、最初に当たった行が使われます。

```
# /etc/security/access.conf
+ : root : LOCAL
+ : (admins) : ALL
- : ALL : ALL
```

この例は、root はローカルの端末から、admins グループは どこからでも許可し、それ以外はすべて拒否します。グループは `(名前)` と書きます。`@名前` は NIS のネットグループです。

使うには、`/etc/pam.d/sshd` に `account required pam_access.so` の行が必要です。`account include password-auth` より前に置きます。後ろに置くと、password-auth の中の `sufficient` の行で先に成功し、この行まで来ないことがあります。`pam_succeed_if` で wheel に限る例も、同じ位置に置きます。

`pam_succeed_if` は、条件を書いて使います。

```
# UID が 1000 未満のユーザーには、この行をとばす(システムユーザーは対象外にする)
auth  [success=1 default=ignore]  pam_succeed_if.so  uid < 1000 quiet
# wheel グループのユーザーだけ通す
account  required  pam_succeed_if.so  user ingroup wheel
```

`pam_securetty` は、`/etc/securetty` にない端末からの root のログインを断ります。ただし、RHEL 9 系ではこのモジュールが既定の設定に含まれません【要確認】。ssh の root のログインは、`sshd_config` の `PermitRootLogin` で決まり、`pam_securetty` では止まりません。

`pam_nologin` は、メンテナンスのときに使います。`/etc/nologin` というファイルを作ると、root 以外のログインを断り、ファイルの中身をメッセージとして見せます。メンテナンスが終わったらファイルを消します。ユーザーのシェルを `/sbin/nologin` にする設定とは別のものです。

`pam_deny` と `pam_permit` は、「いつも失敗」「いつも成功」です。`pam_permit` を `required` で置くと全員が通るので、設定の途中で消し忘れないようにします。

### 4. 失敗の回数を数えて、ロックする(pam_faillock)

**pam_faillock** は、ログインの失敗を数えて、一定回数を超えたアカウントを一時的にロックします。総当たり攻撃(パスワードを次々に試す攻撃)を遅くするための設定です。

```text
faillock の流れ(上から下へ)

  1. auth     required            pam_faillock.so preauth    ロック中なら、ここで失敗
  2. auth     sufficient          pam_unix.so                パスワードが合えば成功
  3. auth     [default=die]       pam_faillock.so authfail   失敗を 1 回数える。上限でロック
  4. account  required            pam_faillock.so            account でもロックを確認する
```

設定は `/etc/security/faillock.conf` に書くのが基本です(RHEL 9 系。モジュールの引数でも書ける)。

| 設定 | 意味 | 既定 |
|---|---|---|
| `deny` | ロックするまでの失敗の回数 | 3 |
| `fail_interval` | 失敗を数える期間(秒) | 900 |
| `unlock_time` | ロックが自動で解ける時間(秒)。0 なら手動で解くまで | 600 |
| `even_deny_root` | root もロックの対象にする | 無効 |
| `root_unlock_time` | root のロックの時間(秒) | `unlock_time` と同じ |
| `audit` | ログに記録する | 無効 |

```
$ sudo faillock --user taro            # 失敗の記録を見る
$ sudo faillock --user taro --reset    # ロックを手動で解く
```

失敗の記録は、既定で `/var/run/faillock/` の下にユーザーごとのファイルとして保存されます。RHEL 9 系では、`authselect select sssd with-faillock` のように機能を有効にして、PAM の行を作ります。Debian 系の Ubuntu 24.04 でも `pam_faillock` は使えますが、設定の方法は【要確認】です。

**ロックの落とし穴**です。

- `even_deny_root` を有効にすると、root もロックされます。コンソールからの作業ができなくなる危険があるので、`root_unlock_time` を短くして使います。
- 攻撃者が他人のユーザー名で失敗を重ねると、本人がロックされます(アカウントのロックを悪用した嫌がらせ)。ロックの時間と回数は、業務に合わせて決めます。
- `preauth` の行は、`pam_unix` より前に置きます。後ろに置くと、ロックされていても先にパスワードの確認が走ります。

### 5. 失敗を遅らせる、パスワードを検査する

**pam_faildelay** は、認証に失敗したあとに、次の応答を待たせる時間を決めます。待たせることで、攻撃の速さを下げます。`delay` は**マイクロ秒**で書きます。

```
auth  optional  pam_faildelay.so  delay=3000000     # 3 秒待たせる
```

`1000000` が 1 秒です。秒ではないので、`delay=3` と書くと 3 マイクロ秒で、ほとんど効きません。

**pam_pwquality** は、パスワードを変えるとき(`password` type)に、強さを検査します。設定は `/etc/security/pwquality.conf` か、モジュールの引数に書きます。

```
password  requisite  pam_pwquality.so  retry=3
```

```
# /etc/security/pwquality.conf
minlen = 12        # 最小の長さ
minclass = 3       # 使う文字の種類(大文字、小文字、数字、記号)の最小の数
dcredit = -1       # 数字を 1 文字以上、必ず含める(マイナスは「最低」)
maxrepeat = 3      # 同じ文字の連続を 3 文字まで
```

`credit` の値は、プラスなら「その種類の文字が 1 文字あたり、長さに何文字分を数えるか」の意味、マイナスなら「その種類が最低それだけ必要」という意味です。厳しくしたいときはマイナスを使います。`pam_pwquality` は、root がパスワードを変えるときは、警告を出すだけで通すことがあります(`enforce_for_root` を付けると、root にも強制できる)。

### 6. 操作を記録する、環境を整える(session のモジュール)

| モジュール | 役割 |
|---|---|
| `pam_tty_audit` | 端末に打ったキーを、監査のログ(auditd)に記録する |
| `pam_env` | `/etc/security/pam_env.conf` と `/etc/environment` から、環境変数を設定する |
| `pam_systemd` | ログインを systemd-logind に登録し、`/run/user/<UID>` を作る |
| `pam_keyinit` | ログインのセッションに、カーネルの鍵(keyring)の入れ物を作る |

**pam_tty_audit** は、ユーザーの端末のキー入力を監査ログに残す、**検知のための**モジュールです。root の操作を記録したいときなどに使います。

```
session  required  pam_tty_audit.so  enable=root open_only
```

`enable=root` で root を記録の対象にします。`open_only` はセッションを開くときだけ有効にして、閉じるときは何もしません。ふつうは `disable=*` で全員を止めてから、`enable=` で必要なユーザーだけを足します。`log_passwd` を付けない限り、パスワード入力中の文字は記録されません(端末のエコーがオフのとき)。記録は `aureport --tty` で読めます。キー入力には秘密が含まれることがあるので、監査ログへのアクセスを制限します。

**pam_env** は、`session`(`auth` でも可)で使います。`pam_env.conf` の形は `変数名 DEFAULT=値` や `変数名 OVERRIDE=値` です。

**pam_systemd** は、`session optional pam_systemd.so` の形で置かれています。これが無いと、ログインしても `XDG_RUNTIME_DIR` が設定されず、`systemctl --user` が使えなくなります。

**pam_keyinit** は、`session optional pam_keyinit.so revoke` と `session optional pam_keyinit.so force revoke` のように使い、ログインごとに別の keyring を作って、終わったら破棄します。ほかのユーザーの鍵を引き継がないようにするための設定です。

### 7. トラブルの調べ方

| 症状 | 原因の例 | 調べ方 |
|---|---|---|
| パスワードが合っているのに入れない | `faillock` でロックされている | `faillock --user <名前>`、ログ |
| root が ssh で入れない | `PermitRootLogin`、`pam_access` の拒否 | `sshd_config`、`access.conf` |
| 一般ユーザーが急に入れなくなった | `/etc/nologin` がある | `ls /etc/nologin /run/nologin` |
| パスワードを変えられない | `pam_pwquality` の条件に合わない | メッセージを読む、`pwquality.conf` |
| authselect を実行したら設定が消えた | `system-auth` を直接編集していた | `authselect check` |

ログは、Red Hat 系は `/var/log/secure`、Debian 系は `/var/log/auth.log` に出ます(Red Hat 系は `journalctl -u sshd`、Ubuntu は `journalctl -u ssh` でも見られます。どちらでも `journalctl -t sshd` で sshd のメッセージを絞れます)。

### ポイント

- PAM の 1 行は「type、control、module-path、module-arguments」。上から順に評価する。
- RHEL 9 系は `authselect` で管理し、`pam_tally2` ではなく `pam_faillock` を使う。
- `pam_faillock` の `deny`、`unlock_time` の既定は 3 回、600 秒。解除は `faillock --user <名前> --reset`。
- `pam_faildelay` の `delay` はマイクロ秒。`pam_pwquality` の `dcredit = -1` は「数字を最低 1 文字」。
- `pam_tty_audit` は端末のキー入力を監査ログに残す。

## 5.2 FreeIPA による統合認証 (重要度3)

出題範囲: LDAP、Kerberos、Dogtag、NTP、DNS、SSSD、certmonger。LDAPS、STARTTLS。ipa-server-install、ipa-client-install。ipa コマンド。AD 信頼関係、ID 範囲、グループマッピング。

### 1. FreeIPA とは

**FreeIPA** は、Linux のサーバーの認証、認可、証明書の管理を 1 か所にまとめる、オープンソースの統合認証の製品です。Red Hat の製品版は **IdM**(Identity Management)といい、RHEL 9 系の `ipa-server` のパッケージで入ります。中は、次の部品の組み合わせです。

| 部品 | 役割 |
|---|---|
| LDAP(389 Directory Server) | ユーザー、グループ、ホストなどの情報を持つディレクトリー |
| Kerberos(MIT Kerberos) | チケットで認証する。1 回パスワードを入れれば、あとはチケットで各サーバーに入れる(シングルサインオン) |
| Dogtag | 認証局(CA)。サーバーやユーザーの証明書を発行する |
| NTP(chrony) | 時刻を合わせる。Kerberos は時刻のずれに厳しい |
| DNS(BIND) | 名前の解決。FreeIPA が管理するゾーンを持てる(任意) |
| SSSD | クライアント側で、認証の情報を取りに行く |
| certmonger | クライアント側で、証明書の更新を自動で行う |
| Apache | Web の管理画面と API |

```text
FreeIPA のサーバーとクライアント

  IPA サーバー(ipa1.example.com)
    +-- LDAP(389 DS)       ユーザー、グループ、ルールを持つ
    +-- Kerberos(KDC)      チケットを発行する
    +-- Dogtag(CA)         証明書を発行する
    +-- DNS, NTP           任意の DNS と、時刻の同期
    +-- Apache             管理画面と API
          ^
          |  Kerberos、LDAP、HTTPS
          |
  IPA クライアント(web1.example.com)
    +-- SSSD               認証の情報の取得とキャッシュ
    +-- certmonger         証明書の更新を自動で行う
```

LDAP の基本(エントリー、DN、ldapsearch)は LinuC 202 のテキスト 2.07 と同じです。ここでの違いは、FreeIPA が LDAP を**自動で構成する**ので、`ldapadd` などを手で書かずに、`ipa` コマンドで操作することです。

### 2. Kerberos の基本

**Kerberos** は、パスワードをネットワークに流さずに認証する仕組みです。管理するサーバーを **KDC**(Key Distribution Center)と呼びます。

| 用語 | 意味 |
|---|---|
| レルム(realm) | Kerberos の管理の範囲。慣習として、ドメイン名を大文字にする(`EXAMPLE.COM`) |
| プリンシパル | Kerberos での名前。`taro@EXAMPLE.COM`、`host/web1.example.com@EXAMPLE.COM` |
| TGT | 最初に受け取るチケット。これを使って、各サービスのチケットをもらう |
| キータブ | サービス用の鍵のファイル。パスワードなしで認証するときに使う |

```
$ kinit taro               # パスワードを入れて、TGT をもらう
$ klist                    # 持っているチケットを見る
$ kdestroy                 # チケットを捨てる
$ ssh web1.example.com     # パスワードなしで入れる(GSSAPI)
```

Kerberos は、クライアントとサーバーの**時刻のずれが 5 分を超える**と、認証が失敗します(既定。`clockskew` で変えられる)。NTP を合わせるのは、このためです。また、Kerberos は DNS の**正引きと逆引き**がきちんと動いていることも前提にします。

### 3. サーバーを入れる(ipa-server-install)

用意するものです。

- **FQDN** のホスト名を設定する(`hostnamectl set-hostname ipa1.example.com`)。`/etc/hosts` にも、FQDN と IP アドレスを書く。
- 時刻を合わせる(chrony)。
- 次のポートを、ファイアウォールで開ける。

| ポート | 用途 |
|---|---|
| 80、443 / TCP | HTTP、HTTPS(管理画面、証明書の取得) |
| 389、636 / TCP | LDAP(StartTLS 付き)、LDAPS |
| 88、464 / TCP と UDP | Kerberos、パスワードの変更 |
| 53 / TCP と UDP | DNS(FreeIPA の DNS を使うとき) |
| 123 / UDP | NTP |

```
$ sudo dnf install ipa-server ipa-server-dns
$ sudo ipa-server-install \
    --realm=EXAMPLE.COM --domain=example.com \
    --ds-password='(Directory Manager のパスワード)' \
    --admin-password='(admin のパスワード)' \
    --setup-dns --auto-forwarders --no-reverse \
    --unattended
```

| オプション | 意味 |
|---|---|
| `--realm` | Kerberos のレルム(大文字) |
| `--domain` | DNS のドメイン名 |
| `--ds-password` | Directory Manager(LDAP の管理者)のパスワード |
| `--admin-password` | `admin`(FreeIPA の管理者)のパスワード |
| `--setup-dns` | FreeIPA の DNS を一緒に構成する |
| `--unattended` | 質問に答えず、オプションの値で進める |

インストールが終わると、`kinit admin` で管理者のチケットを取り、`ipa` コマンドが使えるようになります。上のパスワードは例です。実際には、予測できない長いパスワードを使い、コマンドの履歴やスクリプトに残さないようにします。

### 4. クライアントを参加させる(ipa-client-install)

```
$ sudo dnf install ipa-client
$ sudo ipa-client-install --domain=example.com --realm=EXAMPLE.COM \
    --server=ipa1.example.com --principal=admin --mkhomedir
```

| オプション | 意味 |
|---|---|
| `--domain`、`--realm`、`--server` | 参加先のドメイン、レルム、サーバー |
| `--principal` | 参加の権限を持つユーザー(`admin` など) |
| `--mkhomedir` | 初めてログインしたとき、ホームディレクトリーを作る |
| `--unattended` | 質問に答えず進める |

`ipa-client-install` は、次のことを自動で行います。

- Kerberos の設定(`/etc/krb5.conf`)を作る。
- SSSD の設定(`/etc/sssd/sssd.conf`)を作り、`nsswitch.conf` と PAM を、SSSD を使うように変える。
- ホストを FreeIPA に登録し、ホストのキータブ(`/etc/krb5.keytab`)を作る。
- certmonger で、ホストの証明書を扱えるようにする。

Ubuntu 24.04 では、universe の `freeipa-client`(4.11 系)を `sudo apt install freeipa-client` で入れると、同じ名前のコマンドが使えます。

### 5. ipa コマンドで管理する

`ipa` コマンドは、先に `kinit admin` で管理者のチケットを取ってから使います。名前は「対象-操作」の形です。

| 目的 | コマンドの例 |
|---|---|
| ユーザーを作る | `ipa user-add taro --first=Taro --last=Yamada --password` |
| ユーザーを見る | `ipa user-show taro`、`ipa user-find` |
| グループを作る | `ipa group-add web-admins` |
| グループに入れる | `ipa group-add-member web-admins --users=taro` |
| ホストを登録する | `ipa host-add web1.example.com` |
| ホストのアクセス規則(HBAC)を作る | `ipa hbacrule-add allow_web --hostcat=all` |
| sudo の規則を作る | `ipa sudorule-add admins_all` |

**HBAC**(Host-Based Access Control)は、「どのユーザーが、どのホストの、どのサービスに入ってよいか」を決める規則です。FreeIPA の既定には、全員を許可する `allow_all` の規則があります。実運用では、この規則を無効にして、必要な規則だけを足します。

```
$ ipa hbacrule-disable allow_all
$ ipa hbacrule-add web_admin_ssh
$ ipa hbacrule-add-user web_admin_ssh --groups=web-admins
$ ipa hbacrule-add-host web_admin_ssh --hosts=web1.example.com
$ ipa hbacrule-add-service web_admin_ssh --hbacsvcs=sshd
$ ipa hbactest --user=taro --host=web1.example.com --service=sshd
```

`ipa hbactest` は、規則を変えたあとに、本当に通る(通らない)かを試せます。`allow_all` を無効にする前に、必要な規則が入っていることを確かめないと、自分もログインできなくなります。

### 6. LDAPS と StartTLS

LDAP をそのまま使うと、パスワードを含む通信が暗号化されません。暗号化の方法は 2 つあります。

| 方式 | ポート | 仕組み |
|---|---|---|
| LDAPS | 636 | 最初から TLS で通信する |
| StartTLS | 389 | 平文で接続したあと、コマンドで TLS に切り替える |

```
$ ldapsearch -H ldaps://ipa1.example.com -x -b "dc=example,dc=com" "(uid=taro)"    # LDAPS
$ ldapsearch -H ldap://ipa1.example.com -ZZ -x -b "dc=example,dc=com" "(uid=taro)" # StartTLS
```

`-ZZ` は、StartTLS に**失敗したら、接続をやめる**ことを表します(`-Z` が 1 つだと、失敗しても平文で続ける場合があります)。SSSD で FreeIPA 以外の LDAP を使うときは、`ldap_uri = ldaps://…` と `ldap_tls_cacert` を指定します。サーバー証明書の確認を省くと(`ldap_tls_reqcert = never`)、なりすましのサーバーに接続しても気づきません。

### 7. AD との信頼関係

会社に Active Directory(AD)がある場合は、FreeIPA と AD の間に**信頼関係**(trust)を作れます。信頼関係を作ると、AD のユーザーが、FreeIPA のクライアントに、AD のパスワードでログインできます。AD のユーザーを FreeIPA に作り直す必要はありません。

```text
FreeIPA と AD の信頼関係(フォレスト間の信頼)

  AD domain (ad.example.com)  <-- trust -->  IPA domain (ipa.example.com)
  2 つのドメインの間に、信頼関係を結ぶ

  AD 側: AD のユーザーのパスワードは、AD が確認する
  IPA 側: AD のユーザーが、Linux のクライアントに ssh で入れる
```

準備と作り方の流れです。

```
$ sudo dnf install ipa-server-trust-ad
$ sudo ipa-adtrust-install                                  # AD との信頼のための準備(Samba など)
$ ipa trust-add --type=ad ad.example.com --admin Administrator --password
$ ipa trust-show ad.example.com
```

- DNS で、お互いのドメインが引けるようにしておく(条件付きフォワーダーなど)。
- 時刻を合わせる。
- 通信に必要なポート(Kerberos、LDAP、SMB など)を開ける。

**ID 範囲**(ID range)は、ドメインごとに割り当てる UID と GID の範囲です。範囲が重なると、別のユーザーに同じ UID がつくので、アクセス権の事故になります。

| 項目 | 意味 |
|---|---|
| `ipa-local` | FreeIPA 自身のユーザーとグループの範囲 |
| `ipa-ad-trust` | AD のユーザーの範囲。UID は、AD の SID から自動で計算する |
| `ipa-ad-trust-posix` | AD のユーザーの範囲。AD に書いてある `uidNumber`、`gidNumber` をそのまま使う |

```
$ ipa idrange-find                                          # 範囲の一覧を見る
$ ipa idrange-show EXAMPLE.COM_id_range
```

**グループマッピング**は、AD のグループを、FreeIPA のグループに結びつけることです。AD のグループは直接、FreeIPA のアクセスの規則(HBAC、sudo)に使えないので、「外部グループ」を間に入れます。

```text
グループマッピングの流れ(上から下へ)

  1. AD のグループ AD\Domain Users
  2. --external で追加する
  3. 外部グループ ad_users_external: FreeIPA 側の入れ物
  4. グループとして追加する
  5. POSIX グループ ad_users: HBAC や sudo の規則に使える
```

```
$ ipa group-add --external ad_users_external
$ ipa group-add-member ad_users_external --external 'AD\Domain Users'
$ ipa group-add ad_users
$ ipa group-add-member ad_users --groups=ad_users_external
```

### 8. トラブルの調べ方

| 症状 | 原因の例 | 調べ方 |
|---|---|---|
| `kinit` が失敗する(Clock skew) | 時刻のずれが大きい | `chronyc tracking`、`date` |
| `ipa-client-install` が失敗する | DNS が FreeIPA を引けない、ホスト名が FQDN でない | `dig`、`hostname -f` |
| ユーザーが見えない | SSSD のキャッシュが古い、`nsswitch.conf` に `sss` がない | `id taro`、`sss_cache -E`、`systemctl status sssd` |
| ユーザーが見えるのに入れない | HBAC の規則で拒否されている | `ipa hbactest`、`/var/log/secure` |
| AD のユーザーが入れない | ID 範囲の重なり、信頼関係の問題 | `ipa trust-show`、`ipa idrange-find` |
| 証明書の期限切れの警告 | certmonger の更新が失敗している | `getcert list` |

`getcert list` は、certmonger が見張っている証明書の状態と、期限を見るコマンドです。FreeIPA のサーバーの証明書も、certmonger が自動で更新します。

### ポイント

- FreeIPA は、LDAP(389 DS)、Kerberos、Dogtag(CA)、DNS、NTP、SSSD、certmonger の組み合わせ。
- 前提は、FQDN、DNS、時刻の同期(Kerberos は 5 分以上のずれで失敗)。
- サーバーは `ipa-server-install`、クライアントは `ipa-client-install`、管理は `kinit admin` のあと `ipa` コマンド。
- HBAC は、既定の `allow_all` を無効にして、必要な規則を足す。`ipa hbactest` で試す。
- LDAPS は 636、StartTLS は 389 から切り替える。
- AD との信頼は、`ipa-adtrust-install` のあと `ipa trust-add`。ID 範囲を重ねない。AD のグループは外部グループ経由でマッピングする。

## 5.3 Keycloak による認証認可 (重要度3)

出題範囲: MAC、RBAC、ABAC。OAuth、OpenID Connect、SAML。OTP、WebAuthn。LDAP/AD 連携、SAML/OIDC プロバイダー連携。

### 1. 認可のモデル

「だれに何を許すか」を決める考え方には、次の 3 つがあります。

| モデル | 決め方 | 例 |
|---|---|---|
| MAC(強制アクセス制御) | システムの管理者が決めたルールを、利用者は変えられない | SELinux。ファイルの所有者でも、ルールに反することはできない |
| RBAC(ロールベース) | ユーザーに「ロール」(役割)を与え、ロールに権限を結びつける | 「経理」のロールを持つ人だけが、請求のデータを見られる |
| ABAC(属性ベース) | ユーザー、リソース、環境の属性で、そのつど判断する | 「部署が人事で、社内のネットワークから、平日の昼間」だけ許す |

MAC は OS の層(SELinux、AppArmor)、RBAC と ABAC は、アプリケーションや認可サーバーの層で、よく使います。ユーザーが増えても、ロールを付け替えるだけで済むのが RBAC の強みです。条件が細かくなると、ロールの数が増えすぎる(ロール爆発)ので、そのときは ABAC を組み合わせます。

### 2. Keycloak とは

**Keycloak** は、ログインの画面、シングルサインオン(SSO)、ユーザーの管理、認可を提供する、オープンソースの認証認可のサーバーです。自分のアプリケーションにログインの仕組みを作らず、Keycloak に任せます。Keycloak 17 以降は Quarkus で動き、現行は 26 系です。起動のコマンドは `kc.sh` です。

| 用語 | 意味 |
|---|---|
| レルム(realm) | ユーザー、クライアント、ロールなどを入れる、独立した管理の単位。`master` は管理用 |
| クライアント | Keycloak に認証を頼むアプリケーション。クライアントごとに設定を持つ |
| ユーザー、グループ | ログインする人と、その集まり |
| ロール | 権限の単位。レルム全体の「レルムロール」と、クライアントごとの「クライアントロール」 |
| ID プロバイダー | ログインを外部のサービスに任せるときの、相手のサービス |
| ユーザーフェデレーション | LDAP や AD にあるユーザーを、Keycloak から使えるようにする |

ここでいう「クライアント」は、Keycloak にとってはアプリケーションのことで、「ブラウザ」や「ユーザー」ではありません。

起動の基本です。

```
$ bin/kc.sh start-dev          # 開発用。HTTP で動き、試すだけに使う

$ bin/kc.sh build --db=postgres                    # 本番用:最初に 1 回、ビルドの設定を固める
$ bin/kc.sh start --optimized \
    --hostname=https://sso.example.com \
    --https-certificate-file=/etc/keycloak/tls.crt \
    --https-certificate-key-file=/etc/keycloak/tls.key \
    --db-url=jdbc:postgresql://db1/keycloak --db-username=keycloak
```

| コマンドとオプション | 意味 |
|---|---|
| `kc.sh start-dev` | 開発モード。本番では使わない |
| `kc.sh build` | データベースの種類などの、ビルド時の設定を固める |
| `kc.sh start --optimized` | ビルド済みの設定で、早く起動する |
| `--hostname` | 外から見える URL かホスト名。`start` では、これか `--hostname-strict false` が必要 |
| `--https-certificate-file`、`--https-certificate-key-file` | TLS の証明書と秘密鍵 |
| `--proxy-headers xforwarded` | リバースプロキシの後ろで使うとき、`X-Forwarded-*` のヘッダーを信用する |
| `kc.sh export`、`kc.sh import` | レルムの設定を書き出す、読み込む |

本番では `start`(HTTPS が必要)を使い、`start-dev` は使いません。最初の管理者は、26 系では環境変数の `KC_BOOTSTRAP_ADMIN_USERNAME` と `KC_BOOTSTRAP_ADMIN_PASSWORD` で作ります(古い版は `KEYCLOAK_ADMIN` と `KEYCLOAK_ADMIN_PASSWORD`)。パスワードは、使い終わったら管理画面で別の管理者を作り、置き換えます。

### 3. OAuth 2.0、OpenID Connect、SAML

3 つとも、「ログインを別のサーバーに任せる」ための決まりです。

| 規格 | 目的 | 形式 | 主な用途 |
|---|---|---|---|
| OAuth 2.0 | **認可**(アプリケーションに、API を呼ぶ権限を渡す) | JSON、アクセストークン | API の保護 |
| OpenID Connect(OIDC) | **認証**(OAuth 2.0 の上に、ID の情報を足したもの) | JSON、JWT の ID トークン | 新しい Web、モバイルのアプリ |
| SAML 2.0 | **認証**と属性の受け渡し | XML のアサーション | 古い企業のシステム、SaaS との SSO |

OAuth 2.0 だけでは「だれがログインしたか」は決まりません。OIDC は、そこに **ID トークン**を足して、ユーザーの認証を表します。

| トークン | 内容 | 渡す先 |
|---|---|---|
| ID トークン | だれが、いつ、どう認証したか | クライアント(アプリ) |
| アクセストークン | API を呼んでよい権限 | API(リソースサーバー) |
| リフレッシュトークン | 新しいアクセストークンをもらうための、長持ちするトークン | Keycloak だけに見せる |

アクセストークンは、短い期限(数分)にします。漏れたときの被害を小さくするためです。ID トークンを API の認可に使うのは、よくない使い方です。

```text
認可コードフロー(OIDC)の流れ

  browser --(1)--> app          アプリにアクセスする
  browser <--(2)-- app          Keycloak のログイン画面へ転送される
  browser --(3)--> Keycloak     ログインする(パスワード、OTP など)
  browser <--(4)-- Keycloak     認可コードを持って、アプリに戻る
  browser --(4')-> app          認可コードをアプリに渡す
  app     --(5)--> Keycloak     コードを渡して、トークンを求める
  app     <--(6)-- Keycloak     ID トークンとアクセストークンを受け取る
```

このフローでは、トークンはブラウザではなく、アプリのサーバーと Keycloak の間で受け渡します。公開のクライアント(ブラウザだけで動く SPA など)では、認可コードの横取りを防ぐ **PKCE** を付けます。`implicit` フロー(トークンをブラウザに直接返す)は、いまは勧められません。

Keycloak がつなぎ方の情報を公開しています。

| 規格 | 情報の置き場所 |
|---|---|
| OIDC | `/realms/<レルム名>/.well-known/openid-configuration` |
| SAML | `/realms/<レルム名>/protocol/saml/descriptor` |

古い版(WildFly 版)の `/auth/realms/…` の `/auth` は、Quarkus 版にはありません(`--http-relative-path` で付けることはできます)。

クライアントを作るときの、大事な設定です。

| 設定 | 意味 |
|---|---|
| クライアント認証(Client authentication) | オンなら confidential(サーバーで秘密を守れる)、オフなら public(SPA など) |
| Valid redirect URIs | ログイン後に戻してよい URL。`*` で広く開けない |
| Web origins | ブラウザから呼んでよい元(CORS) |

Valid redirect URIs を広く(`*`)開けると、攻撃者の用意した URL に認可コードが送られる危険があります。必要な URL だけを、正確に書きます。

### 4. 認証を強くする(OTP と WebAuthn)

パスワードだけに頼らず、2 つ目の要素(多要素認証)を足します。

| 方式 | 仕組み | 特徴 |
|---|---|---|
| OTP | アプリ(FreeOTP、Google Authenticator など)が、30 秒ごとに 6 桁の数字を作る(TOTP) | 手軽。偽のログイン画面に、数字を入れさせられる危険は残る |
| WebAuthn | セキュリティキーや、端末の生体認証で、公開鍵の方式で認証する | フィッシングに強い(サイトの URL にひもづく)。パスワードなしにも使える |

Keycloak では、「認証フロー」と「必須アクション」で設定します。

- 全員に OTP を設定させる: ユーザーに必須アクション「Configure OTP」を付ける。または、ブラウザフローで OTP を必須(Required)にする。
- OTP の種類、桁数、期間は、「Authentication」の「Policies」の「OTP Policy」で決める。
- WebAuthn は、「WebAuthn Policy」を決めて、必須アクション「Webauthn Register」を使う。パスワードなしは、「WebAuthn Passwordless」のポリシーとフローを使う。
- 端末をなくした人のために、**復旧の手段**(リカバリーコードなど)を用意する。

```
OTP の設定の流れ

1. ユーザーが、次回のログインで QR コードを読み取る
2. アプリが 6 桁の数字を出す
3. ユーザーがパスワードと、その数字を入れる
4. 以降のログインは、パスワードと OTP の 2 つが必要
```

### 5. LDAP、AD との連携(ユーザーフェデレーション)

すでに LDAP や AD にユーザーがいる場合は、**ユーザーフェデレーション**で Keycloak から使えるようにします。パスワードの確認は LDAP や AD に任せ、Keycloak には、ユーザーのコピーをキャッシュとして持ちます。

| 設定 | 意味 |
|---|---|
| Connection URL | `ldaps://ldap.example.com:636`。LDAPS か StartTLS を使う |
| Bind DN と資格情報 | 検索に使う、読み取りだけの専用アカウント |
| Users DN | ユーザーを探す場所(`ou=people,dc=example,dc=com`) |
| Username LDAP attribute | ユーザー名に使う属性。OpenLDAP は `uid`、AD は `sAMAccountName` |
| Edit mode | `READ_ONLY`(Keycloak から変えない)、`WRITABLE`、`UNSYNCED` |
| 同期 | 定期的に、または手動で、ユーザーを取り込む |

LDAPS で、社内の CA の証明書を使うときは、Keycloak の信頼する証明書に、その CA を追加します(`--truststore-paths` で置き場所を渡す)。証明書の確認を止めると、なりすましを見抜けません。Bind 用のアカウントには、必要最小限の権限だけを与えます。Kerberos(SPNEGO)を使えば、会社の PC からのパスワードなしのログインにもできます。

### 6. 外部のサービスとの連携(ID プロバイダー)

Keycloak は、別のサービスのログインを受け取る**仲介役**にもなれます(ID プロバイダー連携。ブローカリング)。

| 連携先 | 設定の場所 |
|---|---|
| ほかの OIDC のプロバイダー | 「Identity providers」の「OpenID Connect v1.0」 |
| SAML の ID プロバイダー | 「Identity providers」の「SAML v2.0」 |
| Google、GitHub など | 「Identity providers」のソーシャルログイン |

アプリは Keycloak(レルム)とだけ話します。外部のサービスは、会社の AD FS、別の Keycloak、Google などで、SAML でも OIDC でもかまいません。

アプリケーションは Keycloak とだけ話せばよく、外部のサービスが SAML でも OIDC でも、アプリを作り直す必要がありません。ログインのたびに、Keycloak 側にユーザーが作られます(初回のログインのフローで、取り込みの方法を決める)。外部から受け取った属性やロールは、「マッパー」で Keycloak のロールに結びつけます。

### 7. トラブルの調べ方

| 症状 | 原因の例 | 調べ方 |
|---|---|---|
| ログイン後に「Invalid parameter: redirect_uri」 | クライアントの Valid redirect URIs に、戻り先がない | クライアントの設定 |
| HTTP で管理画面を開けない(本番) | `start` は HTTPS が必要 | `--https-*`、`--hostname`、プロキシの設定 |
| リバースプロキシの後ろで、URL が `http://` になる | `--proxy-headers` を付けていない | プロキシの `X-Forwarded-*` |
| LDAP のユーザーが見えない | Users DN の指定、同期をしていない | 「User federation」のテスト接続、同期 |
| トークンの期限が切れて、API が拒否する | アクセストークンの期限が短い | リフレッシュトークンで更新する |

### ポイント

- MAC は管理者が決める(SELinux)、RBAC はロール、ABAC は属性で決める。
- OAuth 2.0 は認可、OIDC は認証(ID トークン)、SAML は XML の認証。
- 本番は `kc.sh build` のあと `kc.sh start --optimized`。`start-dev` は試すだけ。
- redirect URI は正確に書く。`*` で開けない。
- OTP と WebAuthn で多要素にする。WebAuthn はフィッシングに強い。
- LDAP や AD は「User federation」、外部のログインは「Identity providers」で連携する。
