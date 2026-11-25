# LinuC3SS 問題 5.0 認証・認可

対象: LinuC レベル3 3SS試験 Version 1.0 / 全32問 / すべてオリジナル問題
対応テキスト: `LinuC3SS_5.0_認証・認可.md`
解答・解説は末尾。

## 問題

### 5.1 PAM による認証制御

**問1** `LinuC3SS-5.0-001` RHEL 9 系のサーバーで、ユーザー taro が続けて 3 回ログインに失敗した。`pam_faillock` が使われていて、いまは正しいパスワードでも入れない。ロックを今すぐ手動で解くコマンドはどれか。

- A. `sudo faillock --user taro --reset`
- B. `sudo pam_tally2 --user taro --reset`
- C. `sudo passwd -u taro`
- D. `sudo usermod -L taro`

**問2** `LinuC3SS-5.0-002` 次のとおり設定した。`/etc/pam.d/sshd` の `account` の先頭(`account include password-auth` の行より前)に、`account required pam_access.so` がある。

```
# /etc/security/access.conf
+ : root : LOCAL
+ : (admins) : ALL
- : ALL : ALL
```

admins グループに入っていないユーザー hanako が、別のホストから ssh でログインしたときの結果として正しいものはどれか。

- A. 2 行目の `ALL` に当たり、許可される。
- B. 3 行目に当たり、拒否される。
- C. どの行にも当たらないので、pam_access は何もせず、許可される。
- D. 1 行目の root の行に当たり、許可される。

**問3** `LinuC3SS-5.0-003` `/etc/security/pwquality.conf` に `minlen = 12`、`dcredit = -1`、`maxrepeat = 3` と書いてある。ユーザーがパスワードを変えようとして、「数字が足りない」という趣旨のメッセージで断られた。この断りの原因になった設定はどれか。

- A. `minlen = 12`
- B. `maxrepeat = 3`
- C. `dcredit = -1`
- D. `retry` を指定していないこと

**問4** `LinuC3SS-5.0-004` `pam_nologin` について、正しいものを**2つ**選べ。

- A. `/etc/nologin` があるあいだ、root 以外のユーザーのログインを断る。
- B. `/etc/nologin` を作ると、root を含むすべてのユーザーのログインを断る。
- C. `/etc/nologin` の中身が、ログインを断るときのメッセージとして表示される。
- D. ユーザーのシェルを `/sbin/nologin` にしたときと同じ働きで、ログインした後にだけ効く。

**問5** `LinuC3SS-5.0-005` ssh のログインを、wheel グループのユーザーだけに限りたい。パスワードの確認には影響させない。`/etc/pam.d/sshd` の `account include password-auth` の行より前に足す行として正しいものはどれか。

- A. `auth sufficient pam_succeed_if.so user ingroup wheel`
- B. `account required pam_succeed_if.so user notin wheel`
- C. `account required pam_localuser.so`
- D. `account required pam_succeed_if.so user ingroup wheel`

**問6** `LinuC3SS-5.0-006` ssh でログインしたユーザーが `systemctl --user status` を実行すると、ユーザーのバスに接続できないと言われる。`/run/user/<UID>` も作られていない。`/etc/pam.d/sshd` の `session` に足りない可能性が最も高いモジュールはどれか。

- A. `pam_env.so`
- B. `pam_systemd.so`
- C. `pam_keyinit.so`
- D. `pam_tty_audit.so`

**問7** `LinuC3SS-5.0-007` 認証に失敗したあと、次の応答を一定の時間待たせて、総当たりの速さを下げたい。`delay=3000000` のような引数を取る PAM のモジュールを答えよ(`.so` は不要)。

**問8** `LinuC3SS-5.0-008` root の端末での操作(キー入力)を、監査のログに記録したい。`session` で `enable=root` のような引数を取る PAM のモジュールを答えよ(`.so` は不要)。

**問9** `LinuC3SS-5.0-009` root の直接のログインを、`/etc/securetty` に書いた端末だけに限るモジュールはどれか。ssh は考えないものとする。

- A. `pam_access`
- B. `pam_localuser`
- C. `pam_nologin`
- D. `pam_securetty`

**問10** `LinuC3SS-5.0-010` `/etc/pam.d/sshd` の `auth` の最後に、`auth required pam_deny.so` を置く目的として、正しいものはどれか。前の行には `sufficient` のモジュールが並んでいる。

- A. どの `sufficient` のモジュールも成功しなかったときに、必ず失敗にするため。
- B. すべてのユーザーのログインを許可するため。
- C. パスワードの強さを検査するため。
- D. 失敗の回数を数えて、アカウントをロックするため。

### 5.2 FreeIPA による統合認証

**問11** `LinuC3SS-5.0-011` FreeIPA で、サーバーやユーザーの証明書を発行する認証局(CA)の役割を受け持つ部品はどれか。

- A. MIT Kerberos
- B. 389 Directory Server
- C. Dogtag
- D. certmonger

**問12** `LinuC3SS-5.0-012` `ipa-server-install` を実行する前に、整えておくこととして適切なものを**2つ**選べ。

- A. ホスト名を `localhost` にしておく。
- B. ホスト名を FQDN にし、その名前と IP アドレスを引けるようにしておく。
- C. Kerberos のポート(88)を、ファイアウォールで閉じておく。
- D. chrony などで、時刻を合わせておく。

**問13** `LinuC3SS-5.0-013` FreeIPA のクライアントのパッケージに入っている、Linux のクライアントを FreeIPA に参加させるコマンドを答えよ(オプションは不要)。

**問14** `LinuC3SS-5.0-014` FreeIPA で、ユーザーを追加する `ipa` コマンドのサブコマンドを答えよ(`ipa` の後ろの 1 語。ユーザー名とオプションは不要)。

**問15** `LinuC3SS-5.0-015` FreeIPA で、`ipa hbacrule-disable allow_all` を実行した。ほかの HBAC の規則は作っていない。ユーザー taro は `kinit taro` でチケットを取れる。taro が、FreeIPA に登録済みのホスト web1 に ssh でログインしたときの結果はどれか。

- A. 許可する規則がないので、ログインを拒否される。
- B. Kerberos の認証に成功しているので、ログインできる。
- C. root 以外のユーザーなら、ログインできる。
- D. ホストの登録があれば、パスワードの確認なしでログインできる。

**問16** `LinuC3SS-5.0-016` `389` 番ポートで LDAP に接続し、StartTLS で暗号化して検索したい。StartTLS に失敗したときは、平文で続けず、接続をやめたい。`ldapsearch` に付けるオプションとして正しいものはどれか。

- A. `-x`
- B. `-ZZ`
- C. `-H ldaps://ipa1.example.com`
- D. `-W`

**問17** `LinuC3SS-5.0-017` FreeIPA のサーバーで AD との信頼関係を作る。手順として正しいものはどれか。

- A. `ipa trust-add` を実行してから、`ipa-adtrust-install` を実行する。
- B. AD のドメインコントローラーで `ipa-client-install` を実行してから、`ipa trust-add` を実行する。
- C. AD のドメイン名で、`ipa-server-install` をもう一度実行する。
- D. `ipa-adtrust-install` を実行してから、`ipa trust-add --type=ad` を実行する。

**問18** `LinuC3SS-5.0-018` FreeIPA と AD の信頼関係を作ったあと、AD のユーザーと FreeIPA のユーザーに、同じ UID が付いている疑いがある。ファイルの所有者が混ざる前に、まず確かめるものはどれか。

- A. `/etc/krb5.conf` の `[realms]`
- B. `chronyc tracking` の出力
- C. `ipa idrange-find` の出力
- D. `getcert list` の出力

**問19** `LinuC3SS-5.0-019` AD のグループ `AD\Domain Users` のメンバーを、FreeIPA の HBAC の規則で使いたい。FreeIPA 側の準備として正しいものはどれか。

- A. 外部グループを作って AD のグループを入れ、その外部グループを POSIX グループのメンバーにする。
- B. `ipa hbacrule-add-user` で、AD のグループを直接指定する。
- C. ID 範囲に、AD のグループの名前を書く。
- D. `sssd.conf` に、AD のグループの名前を書く。

**問20** `LinuC3SS-5.0-020` FreeIPA のクライアントで、ホストの証明書の期限を見張り、期限が近づくと FreeIPA の CA に更新を頼む常駐のプログラムはどれか。

- A. SSSD
- B. certmonger
- C. chronyd
- D. Dogtag

**問21** `LinuC3SS-5.0-021` `kinit taro` が `Clock skew too great` で失敗した。原因と対処として正しいものはどれか。

- A. レルムを小文字で書いたことが原因なので、小文字に直す。
- B. LDAP のポート 389 が閉じていることが原因なので、開ける。
- C. SSSD のキャッシュが古いことが原因なので、`sss_cache -E` を実行する。
- D. クライアントと KDC の時刻のずれが大きいことが原因なので、時刻を合わせる。

### 5.3 Keycloak による認証認可

**問22** `LinuC3SS-5.0-022` 1 つの Keycloak で、会社 A と会社 B のユーザーやクライアントを、互いに見えないように分けて管理したい。そのための管理の単位はどれか。

- A. クライアント
- B. ロール
- C. レルム
- D. ユーザーフェデレーション

**問23** `LinuC3SS-5.0-023` 請求のデータを、「部署が経理で、社内のネットワークから接続していて、平日の 9 時から 18 時」のときだけ見せたい。このように、ユーザーや環境の属性で、そのつど許可を決めるモデルはどれか。

- A. ABAC
- B. RBAC
- C. MAC
- D. 管理者がロールを 1 つずつ割り当てるモデル

**問24** `LinuC3SS-5.0-024` OAuth 2.0 だけでは決まらない、「だれがログインしたか」を表すために、OpenID Connect が足したものはどれか。

- A. リフレッシュトークン
- B. SAML のアサーション
- C. クライアントシークレット
- D. ID トークン

**問25** `LinuC3SS-5.0-025` Keycloak 26 系を、本番のサーバーとして動かす。起動のやり方として適切なものはどれか。

- A. `kc.sh start-dev` で起動する。
- B. `kc.sh build` でビルド時の設定を固め、HTTPS の証明書とホスト名を指定して `kc.sh start --optimized` で起動する。
- C. `kc.sh export` で起動する。
- D. `kc.sh start-dev` の後ろに、`--http-enabled=true` を足して起動する。

**問26** `LinuC3SS-5.0-026` Keycloak のクライアントでログインを試すと、「Invalid parameter: redirect_uri」と表示された。原因として最も可能性が高いものはどれか。

- A. アクセストークンの期限が切れている。
- B. OTP のポリシーの桁数が合っていない。
- C. Valid redirect URIs に、戻り先の URL が登録されていない。
- D. LDAP の Bind DN のパスワードが間違っている。

**問27** `LinuC3SS-5.0-027` 偽のログイン画面に 6 桁の数字を入れてしまう被害を、減らしたい。ログインするサイトの URL にひもづいて動き、フィッシングに強い方式はどれか。

- A. WebAuthn
- B. アプリが作る 6 桁の OTP(TOTP)
- C. メールで送る確認コード
- D. 「母親の旧姓は」のような秘密の質問

**問28** `LinuC3SS-5.0-028` 認可コードフローでユーザーがログインしたアプリが受け取るアクセストークンについて、正しいものを**2つ**選べ。

- A. API(リソースサーバー)を呼んでよい権限を表し、API に渡して使う。
- B. ユーザーの認証の結果を、アプリに伝えるのが主な役割である。
- C. 漏れたときの被害を小さくするため期限を短くし、切れたらリフレッシュトークンで新しいものをもらう。
- D. API の認可には、アクセストークンではなく ID トークンを使うのが勧められる。

**問29** `LinuC3SS-5.0-029` Keycloak のユーザーフェデレーションで LDAP のユーザーを取り込む。Keycloak 上でユーザーがメールアドレスなどを変更しようとしても、変更を受け付けない読み取り専用にしたい。Edit mode の設定はどれか。

- A. `WRITABLE`
- B. `READ_ONLY`
- C. `UNSYNCED`
- D. ユーザーフェデレーションを使わず、ユーザーを手作業で作る。

**問30** `LinuC3SS-5.0-030` 社内の別の SAML の ID プロバイダーで認証済みのユーザーを、Keycloak を通して、OIDC のアプリにログインさせたい。Keycloak での設定はどれか。

- A. ユーザーフェデレーションで LDAP を追加する。
- B. アプリのクライアントを、SAML に作り直す。
- C. Authentication の OTP のポリシーを変える。
- D. Identity providers に、SAML v2.0 の ID プロバイダーを追加する。

**問31** `LinuC3SS-5.0-031` Keycloak で、データベースの種類などビルド時の設定を固める `kc.sh` のサブコマンドを答えよ(`kc.sh` は不要)。

**問32** `LinuC3SS-5.0-032` Keycloak がレルム `corp` の OpenID Connect の設定情報(エンドポイントの一覧)を返す URL は `https://sso.example.com/realms/corp/` で始まる。続くパスを答えよ。

## 解答・解説

### 問1 `LinuC3SS-5.0-001`

**正解**: A

`faillock --user taro --reset` で、taro の失敗の記録を消し、ロックを解きます。何もしなくても、`unlock_time`(既定は 600 秒)がたてば自動で解けます。

- B. `pam_tally2` は古い仕組みで、RHEL 9 系にはありません。同じ役割は `pam_faillock` が受け持ちます。
- C. `passwd -u` は、`passwd -l` でかけたパスワードのロックを解きます。faillock のロックとは別です。
- D. `usermod -L` は、アカウントのパスワードをロックします。解くのではなく、かける側のコマンドです。

### 問2 `LinuC3SS-5.0-002`

**正解**: B

`pam_access` は、`access.conf` を上から順に見て、**最初に当たった行**を使います。hanako は root ではなく、admins にも入っていないので、1 行目と 2 行目は当たりません。3 行目の `- : ALL : ALL` に当たって、拒否されます。

- A. 2 行目は `(admins)` の行で、admins グループのメンバーにだけ当たります。`@admins` と書くと、NIS のネットグループの意味になります。
- C. 3 行目の `ALL : ALL` が、ほかのすべてに当たります。当たる行がないのは、この行を書かなかったときです。
- D. 1 行目は `root` だけの行で、`LOCAL`(ローカルの端末)の接続に当たります。hanako には当たりません。

### 問3 `LinuC3SS-5.0-003`

**正解**: C

`dcredit` は数字の扱いで、マイナスの値は「その種類の文字を、最低それだけ含める」という意味です。`-1` は、数字を 1 文字以上含めないと拒否されます。

- A. `minlen` は最小の長さで、数字の有無とは関係がありません。短いときは、長さが足りないというメッセージになります。
- B. `maxrepeat` は、同じ文字が続く数の上限です。数字が足りないというメッセージにはなりません。
- D. `retry` は、断られたときに、パスワードを聞き直す回数です。指定しなくても、既定の値で動きます。

### 問4 `LinuC3SS-5.0-004`

**正解**: A、C

`pam_nologin` は、`/etc/nologin` があるあいだ、root 以外のログインを断ります。ファイルの中身を、断るときのメッセージとして見せます。メンテナンスのときに使い、終わったらファイルを消します。

- B. root は断られません。root が入れるので、メンテナンスの作業ができます。
- D. シェルを `/sbin/nologin` にするのは、ユーザーごとの設定です。ログインしたあとにシェルが終わります。`pam_nologin` は、ファイルがあるときに、ログインの段階で、root 以外を全員断ります。

### 問5 `LinuC3SS-5.0-005`

**正解**: D

`account` の段階で、`pam_succeed_if` が「ユーザーが wheel グループに入っている」を確かめ、`required` で、入っていなければ失敗にします。`auth` のパスワードの確認には影響しません。`account include password-auth` の後ろに置くと、password-auth の中の `sufficient` の行で先に成功して、この行まで来ないことがあります。

- A. `auth` で `sufficient` を使うと、wheel のユーザーは、成功した時点で認証が終わり、**パスワードの確認を飛ばせてしまいます**。`requisite` や `sufficient` は、成功と失敗の意味をよく考えて使います。
- B. `notin` は条件が逆です。wheel のユーザーが拒否され、それ以外が通ります。
- C. `pam_localuser` は、ユーザーが `/etc/passwd` にあるかだけを見ます。グループは見ないので、制限になりません。

### 問6 `LinuC3SS-5.0-006`

**正解**: B

`pam_systemd` は、ログインを systemd-logind に登録し、`/run/user/<UID>` と `XDG_RUNTIME_DIR` を用意します。`session` にないと、ユーザーのバスに接続できません。

- A. `pam_env` は、`pam_env.conf` や `/etc/environment` から環境変数を設定するもので、`/run/user` は作りません。
- C. `pam_keyinit` は、カーネルの鍵の入れ物(keyring)をセッションごとに作ります。
- D. `pam_tty_audit` は、端末のキー入力を監査ログに記録します。

### 問7 `LinuC3SS-5.0-007`

**正解**: `pam_faildelay`、`pam_faildelay.so`

`pam_faildelay` は、認証に失敗したあとの待ち時間を決めます。`delay` はマイクロ秒で、`3000000` は 3 秒です。

### 問8 `LinuC3SS-5.0-008`

**正解**: `pam_tty_audit`、`pam_tty_audit.so`

`pam_tty_audit` は、端末に打ったキーを、auditd の監査ログに記録します。`aureport --tty` で読めます。キー入力には秘密が混ざるので、監査ログのアクセスを制限します。

### 問9 `LinuC3SS-5.0-009`

**正解**: D

`pam_securetty` は、`/etc/securetty` に書いていない端末からの root のログインを断ります。ssh のログインは、`sshd_config` の `PermitRootLogin` で決まります。RHEL 9 系では、`pam_securetty` は既定の設定に入っていません【要確認】。

- A. `pam_access` は、`access.conf` のルールで、ユーザーと接続元の組み合わせを許可・拒否します。`/etc/securetty` は読みません。
- B. `pam_localuser` は、ユーザーが `/etc/passwd` にあるかだけを見ます。
- C. `pam_nologin` は、`/etc/nologin` があるあいだ、root 以外のログインを断ります。

### 問10 `LinuC3SS-5.0-010`

**正解**: A

`sufficient` の行は、成功するとすぐ認証が終わります。どれも成功しなかったときは、最後の `pam_deny` に来て、必ず失敗になります。「許可されなかったら拒否する」という、安全側の終わり方です。

- B. 全員を許可するのは `pam_permit` です。逆の働きです。
- C. パスワードの強さの検査は、`password` の段階の `pam_pwquality` です。
- D. 失敗の回数を数えるのは `pam_faillock` です。

### 問11 `LinuC3SS-5.0-011`

**正解**: C

Dogtag は、FreeIPA に含まれる認証局です。ホストやサービスの証明書を発行します。

- A. Kerberos は、チケットで認証する部品です。証明書は発行しません。
- B. 389 Directory Server は、ユーザーやホストの情報を持つ LDAP のサーバーです。
- D. certmonger は、クライアントで証明書の期限を見張り、更新を頼む部品です。発行するのは CA です。

### 問12 `LinuC3SS-5.0-012`

**正解**: B、D

Kerberos と証明書は、FQDN のホスト名と、DNS の正引き・逆引きに頼っています。また、Kerberos は時刻のずれに厳しいので、時刻を合わせておきます。

- A. `localhost` ではサーバーの名前になりません。FQDN にします。
- C. Kerberos(88)は、クライアントが使うので、開けておきます。

### 問13 `LinuC3SS-5.0-013`

**正解**: `ipa-client-install`

クライアントでこのコマンドを実行すると、Kerberos、SSSD、ホストの登録、certmonger の設定がまとめて行われます。

### 問14 `LinuC3SS-5.0-014`

**正解**: `user-add`、`ipa user-add`

`ipa` コマンドの名前は「対象-操作」の形です。ユーザーの追加は `ipa user-add taro --first=Taro --last=Yamada` のように使います。

### 問15 `LinuC3SS-5.0-015`

**正解**: A

HBAC は、Kerberos などの認証とは別に、「だれがどのホストのどのサービスに入ってよいか」を決めます。`allow_all` を無効にして、ほかの規則がなければ、許可する規則がないので拒否されます。規則を足したら、`ipa hbactest` で確かめます。

- B. 認証に成功することと、アクセスが許可されることは別です。HBAC は `account` の段階で効きます。
- C. HBAC に、root 以外を通す決まりはありません。規則で許可されたものだけが通ります。
- D. ホストの登録は、アクセスの許可ではありません。

### 問16 `LinuC3SS-5.0-016`

**正解**: B

`-ZZ` は、StartTLS を使い、**失敗したら接続をやめます**。`-Z` が 1 つだと、失敗しても平文で続けることがあります。

- A. `-x` は、簡易認証(SASL を使わない)にするオプションです。暗号化とは関係ありません。
- C. `ldaps://` は、最初から TLS で接続する LDAPS です。StartTLS(389 から切り替える)とは別の方式で、ポートも 636 です。
- D. `-W` は、パスワードを対話で聞くオプションです。

### 問17 `LinuC3SS-5.0-017`

**正解**: D

先に `ipa-adtrust-install` で、AD との信頼に必要な準備(Samba など)をします。そのあとで、`ipa trust-add --type=ad` で信頼関係を作ります。

- A. 順番が逆です。準備のないまま `trust-add` を実行すると失敗します。
- B. `ipa-client-install` は、FreeIPA のクライアントを参加させるコマンドです。AD のドメインコントローラーには使いません。
- C. `ipa-server-install` は、新しい FreeIPA のドメインを作るコマンドです。信頼関係は作りません。

### 問18 `LinuC3SS-5.0-018`

**正解**: C

`ipa idrange-find` で、FreeIPA と信頼している AD の ID 範囲を見られます。範囲が重なると、別のユーザーに同じ UID が付きます。

- A. `/etc/krb5.conf` は、Kerberos のレルムの設定です。UID の割り当てとは関係がありません。
- B. `chronyc tracking` は、時刻の同期の状態です。UID には関係がありません。
- D. `getcert list` は、certmonger が見張っている証明書の一覧です。

### 問19 `LinuC3SS-5.0-019`

**正解**: A

AD のグループは、そのままでは FreeIPA の HBAC や sudo の規則に使えません。外部グループ(`ipa group-add --external`)に AD のグループを入れ、その外部グループを、POSIX グループのメンバーにします。規則には、その POSIX グループを使います。

- B. 規則に、AD のグループを直接は指定できません。
- C. ID 範囲は、UID と GID の割り当ての範囲です。グループの名前は書きません。
- D. `sssd.conf` に書いても、FreeIPA のグループの結びつけにはなりません。

### 問20 `LinuC3SS-5.0-020`

**正解**: B

certmonger は、証明書の期限を見張り、近づくと更新を頼みます。状態は `getcert list` で見られます。

- A. SSSD は、認証の情報を取りに行き、キャッシュします。証明書の期限を見張って、更新を頼む働きはありません。
- C. chronyd は、時刻を合わせるデーモンです。
- D. Dogtag は、証明書を発行する CA です。クライアントでは動きません。

### 問21 `LinuC3SS-5.0-021`

**正解**: D

Kerberos は、時刻のずれが 5 分を超えると失敗します(既定)。chrony などで時刻を合わせてから、`kinit` をやり直します。`klist` で、チケットの時刻を確かめられます。

- A. レルムを大文字にするのは慣習です。この症状とは関係がありません。
- B. LDAP のポートは、Kerberos の認証には関係がありません。
- C. SSSD のキャッシュは、ユーザーの情報の見え方に関係します。`kinit` の失敗とは別です。

### 問22 `LinuC3SS-5.0-022`

**正解**: C

レルムは、ユーザー、クライアント、ロールなどを入れる、独立した管理の単位です。レルムが違えば、設定もユーザーも見えません。

- A. クライアントは、Keycloak に認証を頼むアプリケーションです。
- B. ロールは、権限の単位です。ユーザーを分ける単位ではありません。
- D. ユーザーフェデレーションは、LDAP などから、ユーザーを取り込む機能です。

### 問23 `LinuC3SS-5.0-023`

**正解**: A

ABAC(属性ベース)は、ユーザーの部署、接続元、時刻などの属性で、そのつど許可を決めます。

- B. RBAC は、ユーザーにロールを与え、ロールに権限を結びつけます。時刻や接続元のような状況では決めません。
- C. MAC は、管理者が決めたルールを、利用者が変えられない方式です(SELinux など)。
- D. これは、RBAC の考え方です。「管理者がロールを割り当てる」だけでは、時刻や接続元を条件にできません。

### 問24 `LinuC3SS-5.0-024`

**正解**: D

OAuth 2.0 は、API を呼ぶ権限(認可)の仕組みです。OpenID Connect は、その上に ID トークンを足して、だれがいつ認証したかを表します。

- A. リフレッシュトークンは、新しいアクセストークンをもらうためのものです。OAuth 2.0 にもあります。
- B. SAML のアサーションは、SAML の仕組みです。OpenID Connect ではありません。
- C. クライアントシークレットは、クライアントが自分を証明する秘密です。ユーザーの認証ではありません。

### 問25 `LinuC3SS-5.0-025`

**正解**: B

本番では、`kc.sh build` で設定を固めたあと、`kc.sh start --optimized` で起動します。`start` は HTTPS とホスト名の設定が要ります。`start-dev` は試すだけのモードです。

- A. `start-dev` は開発用です。本番では使いません。
- C. `export` は、レルムの設定を書き出すサブコマンドです。サーバーは起動しません。
- D. `start-dev` に HTTP を足しても、開発用のままです。

### 問26 `LinuC3SS-5.0-026`

**正解**: C

ログインの後に戻してよい URL は、クライアントの Valid redirect URIs に、あらかじめ登録しておきます。ないと、このエラーになります。広く開ける(`*`)と、攻撃者の URL に認可コードが送られる危険があるので、必要な URL だけを正確に書きます。

- A. アクセストークンの期限切れは、API を呼んだときのエラーです。ログインの戻り先には関係しません。
- B. OTP の桁数は、ログインの画面で問題になります。戻り先の URL とは関係がありません。
- D. LDAP の Bind DN の問題は、LDAP のユーザーを探すときのエラーです。

### 問27 `LinuC3SS-5.0-027`

**正解**: A

WebAuthn は、セキュリティキーや端末の生体認証を使い、公開鍵の方式で認証します。サイトの URL にひもづくので、偽のサイトでは動きません。

- B. OTP(TOTP)は、手軽ですが、偽の画面に数字を入れさせられる危険が残ります。
- C. メールで送るコードも、偽の画面に入れさせられます。
- D. 秘密の質問は、答えが推測されやすく、偽の画面にも入れさせられます。

### 問28 `LinuC3SS-5.0-028`

**正解**: A、C

アクセストークンは、API を呼ぶ権限を表すもので、API に渡して使います。漏れたときの被害を小さくするため、期限を短くし、切れたらリフレッシュトークンで新しいものをもらいます。

- B. これは ID トークンの役割です。
- D. 逆です。API の認可には、アクセストークンを使います。ID トークンはクライアントのためのものです。

### 問29 `LinuC3SS-5.0-029`

**正解**: B

`READ_ONLY` は、LDAP のユーザーを Keycloak から読むだけで、Keycloak 上の変更を受け付けません。

- A. `WRITABLE` は、Keycloak での変更を LDAP に書き戻します。
- C. `UNSYNCED` は、変更を受け付けて、Keycloak のデータベースにだけ保存します。LDAP には書きません。変更を拒否するわけではありません。
- D. 手作業で作ると、LDAP との連携になりません。

### 問30 `LinuC3SS-5.0-030`

**正解**: D

Identity providers に、SAML v2.0 の ID プロバイダーを追加すると、Keycloak が仲介役になります。アプリは Keycloak と OIDC で話し、外部とは Keycloak が SAML で話します。

- A. ユーザーフェデレーションは、LDAP や AD のユーザーを取り込む機能です。外部のログインを受け取る機能ではありません。
- B. アプリを作り直す必要はありません。Keycloak が仲介します。
- C. OTP のポリシーは、2 つ目の要素の設定です。

### 問31 `LinuC3SS-5.0-031`

**正解**: `build`、`kc.sh build`、`bin/kc.sh build`

`kc.sh build` で、データベースの種類などを固めます。そのあと `kc.sh start --optimized` で、早く起動できます。

### 問32 `LinuC3SS-5.0-032`

**正解**: `.well-known/openid-configuration`、`/.well-known/openid-configuration`

`/realms/<レルム名>/.well-known/openid-configuration` から、認可のエンドポイント、トークンのエンドポイント、公開鍵の場所などが分かります。SAML の場合は、`/realms/<レルム名>/protocol/saml/descriptor` です。
