# LinuC3SS 問題 3.0 堅牢なコンテナ設計

対象: LinuC レベル3 3SS試験 Version 1.0 / 全16問 / すべてオリジナル問題
対応テキスト: `LinuC3SS_3.0_堅牢なコンテナ設計.md`
解答・解説は末尾。

## 問題

### 3.1 コンテナのアクセス制御と権限制御

**問1** `LinuC3SS-3.0-001` root で動く Docker コンテナを `--cap-drop ALL` で起動した。コンテナの中で、root が持つファイル `/data/report.txt`(権限 644)の所有者を `chown 1000 /data/report.txt` で変えようとすると、`Operation not permitted` になった。このコマンドを使えるようにするために、足す最小限のオプションはどれか。

- A. `--cap-add NET_BIND_SERVICE`
- B. `--cap-add CHOWN`
- C. `--cap-add SYS_ADMIN`
- D. `--cap-add NET_ADMIN`

**問2** `LinuC3SS-3.0-002` `--security-opt` に渡して、setuid のプログラムなどを使っても、プロセスが起動時より多い権限を得られないようにする値を答えよ(`--security-opt` 自体は不要)。

**問3** `LinuC3SS-3.0-003` nginx のコンテナを `--read-only` で起動したところ、`/var/cache/nginx` に書けずに起動に失敗した。ルートファイルシステムは読み取り専用のままにして、起動させたい。正しい対処はどれか。

- A. `--privileged` を付ける
- B. `--cap-add DAC_OVERRIDE` を付ける
- C. `--security-opt seccomp=unconfined` を付ける
- D. `/var/cache/nginx` に `--tmpfs` かボリュームを付ける

**問4** `LinuC3SS-3.0-004` AlmaLinux 9(SELinux は `Enforcing`)で、Podman のコンテナに `-v /srv/data:/data` でホストのディレクトリをマウントした。コンテナの中で `ls /data` が `Permission denied` になる。`/srv/data` の UNIX の権限は 755 で問題なく、`ausearch -m avc` には `container_t` からのアクセスの拒否が出ている。SELinux を `Enforcing` のままにして直すには、どうするか。

- A. `-v /srv/data:/data:Z` に変える
- B. `-v /srv/data:/data:ro` に変える
- C. `--security-opt seccomp=unconfined` を付ける
- D. `--cap-add ALL` を付ける

**問5** `LinuC3SS-3.0-005` SELinux が `Enforcing` のホストで、Podman のコンテナにホストのディレクトリをマウントするときの `:z` と `:Z` について、正しいものを**2つ**選べ。

- A. `:z` は、複数のコンテナで共有できるラベルを付ける
- B. `:z` は、マウントしたディレクトリを読み取り専用にする
- C. `:Z` は、そのコンテナだけが使えるラベルを付ける
- D. `:Z` は、そのコンテナの seccomp のプロファイルを有効にする

**問6** `LinuC3SS-3.0-006` 既定の seccomp プロファイルのせいで動かないのかを確かめるため、一時的に seccomp を無効にして起動したい。`--security-opt` に渡す値を答えよ(`--security-opt` を含めて書いてもよい)。

**問7** `LinuC3SS-3.0-007` Ubuntu 24.04 の Docker ホストで、追加のパッケージを入れずに使える仕組みで、コンテナのプロセスが書き込める**ファイルのパス**を、プロファイルにパスで書いて制限したい。使う仕組みはどれか。

- A. SELinux の `container_t`
- B. seccomp
- C. AppArmor
- D. `--cap-drop`

**問8** `LinuC3SS-3.0-008` Docker で、ほぼすべてのケーパビリティとホストのデバイスへのアクセスをコンテナに与え、seccomp と AppArmor の制限も外してしまう、本番では避ける `docker run` のオプションを答えよ。

### 3.2 Rootless モード

**問9** `LinuC3SS-3.0-009` Ubuntu 24.04 で、一般ユーザー alice が `dockerd-rootless-setuptool.sh install` を実行すると、準備が足りずに失敗した。`newuidmap` は入っているが、`grep '^alice:' /etc/subuid /etc/subgid` は何も表示しない。正しい対処はどれか。

- A. `chmod u+s /usr/bin/dockerd` を実行する
- B. `setenforce 0` を実行する
- C. `usermod --add-subuids 100000-165535 --add-subgids 100000-165535 alice` を実行する
- D. `loginctl enable-linger alice` を実行する

**問10** `LinuC3SS-3.0-010` `/etc/subuid` に `alice:100000:65536` という行がある。この行の意味として正しいものはどれか。

- A. alice は、ホストの UID 100000 から 65536 個の範囲を、コンテナの UID に対応づけて使える
- B. alice の UID は 100000 で、GID は 65536 である
- C. alice は、UID が 100000 から 65536 までの範囲のファイルを読める
- D. alice は、最大で 65536 個のコンテナを作れる

**問11** `LinuC3SS-3.0-011` ユーザー alice(UID 1001)が、既定の設定の Rootless Podman で、コンテナにホストの `/home/alice/data` をバインドマウントした。コンテナの中の root(UID 0)がそこにファイルを作った。ホストで `ls -ln` すると、そのファイルの所有者はどれに見えるか。

- A. UID 0(root)
- B. UID 1001(alice)
- C. UID 100000
- D. UID 65534(nobody)

**問12** `LinuC3SS-3.0-012` ユーザー alice(UID 1001)の `/etc/subuid` は `alice:100000:65536` である。Rootless Podman のコンテナの中で `cat /proc/self/uid_map` を実行すると、次の 2 行が出る。

```text
         0       1001          1
         1     100000      65536
```

コンテナの中の UID 1000 のプロセスが、バインドマウントしたホストのディレクトリにファイルを作った。ホストで見えるそのファイルの所有者の UID はどれか。

- A. 1000
- B. 1001
- C. 101000
- D. 100999

**問13** `LinuC3SS-3.0-013` ユーザー alice が Rootless のコンテナを `systemctl --user` で動かしている。ログアウトしても、サーバーの再起動後も、コンテナを動かし続けたい。root が実行するコマンドを、サブコマンドまで答えよ(ユーザー名は不要。sudo は不要)。

**問14** `LinuC3SS-3.0-014` root でログインして `sudo -u alice systemctl --user status docker` を実行すると、`Failed to connect to bus` と出て失敗した。alice で ssh ログインして同じコマンドを実行すると成功する。最も可能性が高い原因はどれか。

- A. alice の `/etc/subuid` の範囲が足りない
- B. alice が `docker` グループに入っていない
- C. 切り替えた先のシェルに `XDG_RUNTIME_DIR` が設定されていない
- D. seccomp のプロファイルが `systemctl` を拒否している

**問15** `LinuC3SS-3.0-015` Rootless モードの制限として、正しいものを**2つ**選べ。

- A. ホストの 1024 未満のポートにコンテナを公開する(`-p 80:80` など)ことは、既定ではできない
- B. `--privileged` を付けると、ホストの root と同じ権限を得る
- C. コンテナの中の root は、ホストでも UID 0 である
- D. `--memory` などの資源の制限は、cgroup v2 が使えるホストでだけ使える

**問16** `LinuC3SS-3.0-016` Rootless Podman で、バインドマウントしたホストのディレクトリの所有者を、コンテナの中の UID 1000 に変えたい。コンテナと同じユーザー名前空間の中に入って `chown` を実行するための、`podman` のサブコマンドまでを答えよ(`chown` 以降は不要)。

## 解答・解説

### 問1 `LinuC3SS-3.0-001`

**正解**: B

**テキスト**: 2. 権限を絞るオプション

ファイルの所有者を変える特権は `CHOWN` です。`--cap-drop ALL` で外したので、`--cap-add CHOWN` だけを足せば `chown` が使えます。必要な分だけを足すのが、最小権限の考え方です。

- A. `NET_BIND_SERVICE` は、1024 未満のポートで待ち受けるための特権です。`chown` には関係しません。
- C. `SYS_ADMIN` は、マウントなど、ほぼ何でもできる強い特権です。足すと、外した意味が薄れます。最小限ではありません。
- D. `NET_ADMIN` は、ネットワークの設定を変える特権です。`chown` には関係しません。

### 問2 `LinuC3SS-3.0-002`

**正解**: `no-new-privileges`、`no-new-privileges=true`、`no-new-privileges:true`、`--security-opt no-new-privileges`、`--security-opt=no-new-privileges`、`--security-opt no-new-privileges=true`、`--security-opt=no-new-privileges=true`、`--security-opt no-new-privileges:true`、`--security-opt=no-new-privileges:true`

**テキスト**: 2. 権限を絞るオプション

`no-new-privileges` を付けると、setuid のプログラムなどを実行しても、起動時より多い権限を得られなくなります。コンテナの中で権限を上げる攻撃を防ぎます。Docker でも Podman でも使えます。

### 問3 `LinuC3SS-3.0-003`

**正解**: D

**テキスト**: 2. 権限を絞るオプション

`--read-only` では、ルートファイルシステムに書けません。nginx のキャッシュのように、書く場所が決まっているものは、その場所だけに `--tmpfs`(メモリ上の書ける領域)かボリュームを付けます。

- A. `--privileged` は、読み取り専用の設定を直しません。権限を広げるだけで、危険です。
- B. `DAC_OVERRIDE` は、ファイルの権限の検査を無視する特権です。読み取り専用のファイルシステムには効きません。
- C. seccomp を無効にしても、書けるようにはなりません。守りを弱めるだけです。

### 問4 `LinuC3SS-3.0-004`

**正解**: A

**テキスト**: 5. SELinux

SELinux では、コンテナのプロセス(`container_t`)が使えるファイルのタイプは `container_file_t` です。ホストの普通のディレクトリには別のタイプが付いているので、拒否されます。`:Z` を付けると、Podman がそのディレクトリのラベルを、このコンテナ専用のものに付け替えます。`Enforcing` のまま直せます。

- B. `:ro` は読み取り専用にするだけで、ラベルは変わりません。読むことも拒否されたままです。
- C. seccomp はシステムコールの制限です。SELinux の拒否には関係しません。
- D. ケーパビリティを足しても、SELinux のラベルによる拒否は変わりません。

### 問5 `LinuC3SS-3.0-005`

**正解**: A、C

**テキスト**: 5. SELinux

`:z`(小文字)は、複数のコンテナで共有できるラベルを付けます。同じディレクトリを複数のコンテナで使うときに使います。`:Z`(大文字)は、そのコンテナだけが使えるラベル(コンテナごとに別のカテゴリ)を付けます。どちらもホストのディレクトリのラベルを書き換えるので、`/home` や `/etc` のような広い場所には付けないようにします。

- B. 読み取り専用にするのは `:ro` です。`:z` はラベルの付け替えです。
- D. `:Z` は SELinux のラベルの話で、seccomp とは別の仕組みです。

### 問6 `LinuC3SS-3.0-006`

**正解**: `seccomp=unconfined`、`seccomp:unconfined`、`--security-opt seccomp=unconfined`、`--security-opt=seccomp=unconfined`、`--security-opt seccomp:unconfined`

**テキスト**: 3. seccomp

`seccomp=unconfined` は、seccomp の制限をなくします。これで動くなら、原因は seccomp です。調べた後は必ず外し、必要なシステムコールだけを足した独自のプロファイル(`seccomp=<ファイル>`)にします。

### 問7 `LinuC3SS-3.0-007`

**正解**: C

**テキスト**: 4. AppArmor

AppArmor は、プロファイルに、触れてよいファイルのパスやネットワークを書く仕組みです。Ubuntu では、既定で有効です。Docker は `docker-default` を付け、独自のものは `--security-opt apparmor=<名前>` で指定します。

- A. SELinux はラベルで制限します。パスで書く仕組みではありません。Ubuntu の標準の構成では使いません。
- B. seccomp は、呼べるシステムコールを絞ります。ファイルのパスでは制限できません。
- D. `--cap-drop` は、ケーパビリティを外します。ファイルのパスは指定できません。

### 問8 `LinuC3SS-3.0-008`

**正解**: `--privileged`、`--privileged=true`

**テキスト**: 2. 権限を絞るオプション

`--privileged` は、ほぼすべてのケーパビリティとデバイスを与え、seccomp と AppArmor の制限も外します。コンテナを抜け出さなくても、ホストを操作できるので、本番では使いません。

### 問9 `LinuC3SS-3.0-009`

**正解**: C

**テキスト**: 3. subuid、subgid と newuidmap、newgidmap

Rootless には、`/etc/subuid` と `/etc/subgid` に、そのユーザーの行(使ってよい UID と GID の範囲)が必要です。行がないので、`usermod --add-subuids` と `--add-subgids` で足します。範囲は、ほかのユーザーと重ならないようにします。

- A. `dockerd` に setuid を付けると、一般ユーザーがデーモンを root として動かせてしまい、とても危険です。範囲の不足も直りません。
- B. SELinux を止めても、subuid の行は増えません。Ubuntu では SELinux は標準で使いません。
- D. `enable-linger` は、ログアウト後も動かし続けるための設定です。範囲の不足とは別です。

### 問10 `LinuC3SS-3.0-010`

**正解**: A

**テキスト**: 3. subuid、subgid と newuidmap、newgidmap

`/etc/subuid` の書式は `ユーザー名:開始:個数` です。alice は、ホストの 100000 から 65536 個(100000 〜 165535)を、コンテナの中の UID に対応づけて使えます。

- B. alice 自身の UID は `/etc/passwd` で決まります。subuid は、追加で使える範囲です。
- C. これはファイルを読める範囲ではなく、UID の対応づけに使える範囲です。
- D. 個数はコンテナの数ではなく、使える UID の数です。

### 問11 `LinuC3SS-3.0-011`

**正解**: B

**テキスト**: 2. User namespace と UID の対応

Rootless では、コンテナの中の root(UID 0)は、ホストでは実行したユーザー本人(alice、UID 1001)に対応します。ホストで見ると、alice のファイルです。

- A. ホストの root ではありません。Rootless の目的は、コンテナの root をホストの root にしないことです。
- C. 100000 は、コンテナの UID 1 以降の対応の先頭です。UID 0 は本人に対応します。
- D. nobody は、対応づけられていない UID の表示です。ここでは使いません。

### 問12 `LinuC3SS-3.0-012`

**正解**: D

**テキスト**: 2. User namespace と UID の対応

`/proc/self/uid_map` の 2 行目は、「コンテナの UID 1 から 65536 個が、ホストの 100000 から対応する」という意味です。コンテナの UID 1 がホストの 100000 なので、UID 1000 は `100000 + 1000 - 1 = 100999` です。

- A. 1000 は、コンテナの中の番号です。ホストでは対応した別の番号になります。
- B. 1001 に対応するのは、コンテナの UID 0 だけです。
- C. 101000 は、1 を引き忘れた値です。UID 1 が 100000 から始まります。

### 問13 `LinuC3SS-3.0-013`

**正解**: `loginctl enable-linger`、`loginctl enable-linger alice`

**テキスト**: 4. systemctl --user、enable-linger、XDG_RUNTIME_DIR

`loginctl enable-linger <ユーザー>` を実行すると、そのユーザーがログアウトしても、ユーザー用の systemd が動き続けます。ブート時にも自動で始まります。これで、`systemctl --user` のサービスが、ログインなしで動きます。確認は `loginctl show-user alice` の `Linger=yes` です。ユーザー名を付けた `loginctl enable-linger alice` も正解です。

### 問14 `LinuC3SS-3.0-014`

**正解**: C

**テキスト**: 4. systemctl --user、enable-linger、XDG_RUNTIME_DIR

`systemctl --user` は、ユーザー用の systemd と、`XDG_RUNTIME_DIR`(`/run/user/<UID>`)の中のソケットで通信します。`sudo -u` で切り替えたシェルには、この環境変数が設定されないことが多く、つながりません。ssh で alice として直接ログインすると、設定されます。

- A. subuid の範囲の問題は、コンテナを作るときに出ます。`systemctl --user` の接続では出ません。
- B. `docker` グループは、rootful の Docker のソケットを使うための設定です。ここの失敗とは別です。
- D. seccomp は、コンテナの中のプロセスを制限します。ホスト上の `systemctl` は対象ではありません。

### 問15 `LinuC3SS-3.0-015`

**正解**: A、D

**テキスト**: 5. Rootless の制限と Podman

Rootless では、ホストの 1024 未満のポートへの公開は、既定ではできません(コンテナの中で 80 番で待ち受けることは、できます)。対処は、`net.ipv4.ip_unprivileged_port_start` を下げる、Docker では `rootlesskit` に `CAP_NET_BIND_SERVICE` を付ける、または 1024 以上のポートで公開する、のどれかです。`--memory` などの資源の制限は、cgroup v2 のホストでだけ使えます(Docker は systemd も必要です)。既定で委譲されるのは、ふつう memory と pids だけです。`--cpus` を使うには、`user@.service` に `Delegate=` を設定します。

- B. Rootless の `--privileged` は、ユーザー名前空間の中だけの特権です。ホストの root の権限は得られません。
- C. Rootless では、コンテナの root は、ホストでは実行したユーザー本人です。UID 0 ではありません。

### 問16 `LinuC3SS-3.0-016`

**正解**: `podman unshare`

**テキスト**: 2. User namespace と UID の対応

`podman unshare` は、Rootless のユーザー名前空間の中でコマンドを実行します。例: `podman unshare chown 1000:1000 ~/data`。コンテナの UID 1000 に対応するホストの UID(subuid の範囲の中の番号)を、自分で計算せずに指定できます。
