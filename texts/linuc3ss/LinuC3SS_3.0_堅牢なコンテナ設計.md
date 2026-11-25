# LinuC 3SS テキスト 3.0 堅牢なコンテナ設計

コンテナは、ホストのカーネルをほかのコンテナと共有します。そのため、コンテナを安全に動かすには、カーネルの機能で権限を絞ること、そして root で動かさない工夫が大切です。この章は、コンテナの権限を絞る設定(seccomp、AppArmor、SELinux、ケーパビリティ)と、root を使わずに動かす Rootless モードを学びます。Docker と Podman(Red Hat 系の標準のコンテナの道具)の両方を扱います。Docker の基本の対策は `texts/docker/` の 8.1 にもあります。ここでは、より細かい設定と、つまずいたときの調べ方を中心に書きます。

## 3.1 コンテナのアクセス制御と権限制御 (重要度2)

出題範囲: seccomp、AppArmor、SELinux。

### 1. 守りの層

コンテナの守りは、1 枚の壁ではなく、何枚もの層です。1 つが破られても、次の層で止めます。

```text
[process in container]    コンテナの中のプロセス
  |
  +-- 1. user             root で動かさない(USER、--user、Rootless)
  +-- 2. capabilities     root の特権を細かく外す(--cap-drop)
  +-- 3. seccomp          呼べるシステムコールを絞る
  +-- 4. AppArmor/SELinux 触れるファイルや操作を絞る
  +-- 5. read-only        ファイルシステムを読み取り専用にする(--read-only)
  |
  v
[host kernel]             ここまで来られると、ホスト全体が危ない
```

層ごとの役割を表にします。

| 層 | 何を絞るか | 主に使うディストリビューション |
|---|---|---|
| ケーパビリティ | root の特権を細かく分けた単位(ネットワーク設定、所有者の変更など) | すべて |
| seccomp | プロセスが呼べるシステムコール(カーネルへの依頼) | すべて |
| AppArmor | ファイルのパス、ネットワーク、ケーパビリティ。パスで書く | Debian 系(Ubuntu) |
| SELinux | ラベル(ファイルとプロセスに付ける印)の組み合わせ | Red Hat 系(RHEL、AlmaLinux) |

AppArmor と SELinux は、どちらも**強制アクセス制御**(MAC)です。root で動くプロセスでも、ルールで禁止されたことはできません。1 つのホストでは、ふつうどちらか一方を使います。

### 2. 権限を絞るオプション

| オプション | 効果 | 注意 |
|---|---|---|
| `--cap-drop ALL` | すべてのケーパビリティを外す | 外しすぎて動かなくなったら、必要なものだけ `--cap-add` で足す |
| `--cap-add CHOWN` | 指定したケーパビリティを足す | 足すのは最小限に。`ALL` を足すと意味がなくなる |
| `--security-opt no-new-privileges` | setuid のプログラムなどで、起動時より多い権限を得られなくする | `=true` を付けて書いてもよい |
| `--read-only` | ルートファイルシステムを読み取り専用にする | 書く場所は `--tmpfs /tmp` やボリュームで足す |
| `--user 1000:1000` | root 以外で動かす | ファイルの所有者に注意 |
| `--privileged` | ほぼすべてのケーパビリティとデバイスを与え、seccomp と AppArmor の制限も外す | 本番では使わない。ホストを乗っ取られる |

**ケーパビリティ**は、root の特権を細かく分けたものです。コンテナの root も、既定でいくつかのケーパビリティを持っています。何を外すと何ができなくなるかは、次のように考えます。

| ケーパビリティ | できること | 外したときの症状の例 |
|---|---|---|
| `CHOWN` | ファイルの所有者を変える | `chown` が `Operation not permitted` になる |
| `NET_BIND_SERVICE` | 1024 未満のポートで待ち受ける | 低いポートの bind が失敗する。ただし Docker 20.10 以降は、コンテナの中で `net.ipv4.ip_unprivileged_port_start=0` を既定で設定するので、`--network host` 以外では失敗しません。 |
| `NET_RAW` | RAW ソケット(ping など) | `ping` が動かない |
| `SYS_ADMIN` | マウントなど、ほぼ何でもできる強い権限 | 足してはいけない(`--privileged` に近い) |

実際の運用では、まず `--cap-drop ALL` で動かして、エラーを見ながら、必要なものだけ足します。

```bash
# 例: 読み取り専用で、ケーパビリティを外し、権限の上昇も防ぐ
docker run -d --name web \
  --read-only --tmpfs /var/cache/nginx --tmpfs /var/run \
  --cap-drop ALL --cap-add CHOWN --cap-add SETUID --cap-add SETGID \
  --security-opt no-new-privileges \
  nginx:1.27
```

`--read-only` を付けると、アプリが書き込む場所(PID ファイルやキャッシュ)でエラーになります。エラーの出た場所に `--tmpfs` かボリュームを足して直します。`--privileged` を付けても、読み取り専用の設定は直りません。

Podman でも、同じオプション(`--cap-drop`、`--security-opt no-new-privileges`、`--read-only`)が使えます。

### 3. seccomp

**seccomp** は、プロセスが呼べる**システムコール**(プログラムがカーネルに仕事を頼る入口)を、許可リストで絞る仕組みです。危険なシステムコールを呼べなくすれば、カーネルの弱点を突かれにくくなります。

- Docker は、既定のプロファイルを自動で適用します。危険なシステムコールの一部を拒否する内容です。
- Podman は、パッケージ(containers-common)の既定のプロファイル(`/usr/share/containers/seccomp.json`)を使います。
- 独自のプロファイルは JSON のファイルで書き、`--security-opt seccomp=<ファイル>` で渡します。
- `--security-opt seccomp=unconfined` は、seccomp を無効にします。**原因調べのときだけ**一時的に使います。

```bash
# 独自のプロファイルで起動する
docker run --rm --security-opt seccomp=/etc/docker/myprofile.json alpine id
# 症状が seccomp のせいか確かめる(調べたら、必ず外す)
docker run --rm --security-opt seccomp=unconfined myimage
```

「`Operation not permitted`(`EPERM`)が出る」「`strace` で見ると、あるシステムコールだけが失敗する」ときは、seccomp を疑います。`--security-opt seccomp=unconfined` で動くなら、seccomp が原因です。そのときは、プロファイルに必要なシステムコールだけを足します。

### 4. AppArmor

**AppArmor** は、プログラムごとの**プロファイル**に、触れてよいファイルのパス、ネットワーク、ケーパビリティを書きます。パスで書くので、読みやすいのが特徴です。Ubuntu と Debian で使えます(Ubuntu は既定で有効です)。

- Docker は、AppArmor が有効なホストで `docker-default` プロファイルをコンテナに付けます。
- 独自のプロファイルは、`apparmor_parser -r -W <ファイル>` で読み込み、`--security-opt apparmor=<名前>` で指定します。
- `aa-status` で、読み込まれているプロファイルと、enforce(強制)か complain(記録だけ)かが分かります。
- `--security-opt apparmor=unconfined` は、制限を外します。

```bash
sudo aa-status                            # 読み込まれているプロファイル
sudo apparmor_parser -r -W /etc/apparmor.d/my-container
docker run --rm --security-opt apparmor=my-container alpine sh
sudo dmesg | grep -i 'apparmor="DENIED"'  # 拒否のログ
```

Podman も Ubuntu では AppArmor を使えます。既定のプロファイルの名前は `container-default` です(`containers.conf` の `apparmor_profile` で変えられます)。

### 5. SELinux

**SELinux** は、ファイルとプロセスに**ラベル**を付け、ラベルの組み合わせでアクセスを許可します。Red Hat 系(RHEL 9、AlmaLinux 9)で既定で有効です(`getenforce` が `Enforcing`)。

- コンテナのプロセスのラベル(タイプ)は `container_t` です。
- コンテナが使ってよいファイルのタイプは `container_file_t` です。
- ホストの普通のディレクトリ(例: `/srv/data`)のタイプは `var_t` などで、`container_t` からは触れません。

```text
[container_t process] --> /srv/data (var_t)             DENIED    ホストの普通のラベル。拒否される
[container_t process] --> /srv/data (container_file_t)  ALLOWED   コンテナ用のラベル。許可される

-v /srv/data:/data:Z   で、/srv/data を後者のラベルに付け替える
```

ホストのディレクトリをコンテナにマウントするときは、ラベルの付け替えを `-v` のオプションで頼みます。

| オプション | 動き | 使いどころ |
|---|---|---|
| `:z`(小文字) | 複数のコンテナで共有できるラベルを付ける | 同じディレクトリを複数のコンテナで使う |
| `:Z`(大文字) | そのコンテナだけが使えるラベルを付ける(コンテナごとに別のカテゴリ) | 1 つのコンテナ専用のディレクトリ |

注意: `:Z` や `:z` は、ホストのディレクトリのラベルを実際に書き換えます。`/home`、`/etc`、`/usr` のような広い場所に付けると、ホストの動作が壊れることがあります。専用のディレクトリにだけ付けます。

症状別の調べ方です。

```bash
getenforce                                  # Enforcing / Permissive / Disabled
ls -Zd /srv/data                            # ラベルを見る
sudo ausearch -m avc -ts recent             # SELinux が拒否したログ(AVC)
sudo setenforce 0                           # 一時的に Permissive(原因の切り分けのみ)
```

マウントしたディレクトリで `Permission denied` になり、UNIX の権限(`ls -l`)は正しいときは、SELinux を疑います。`setenforce 0` で動くなら、SELinux が原因です。そのときは、無効のままにせず、`:Z` を付けるか、`semanage fcontext` と `restorecon` で、ラベルを正しくします。

`--security-opt label=disable` は、そのコンテナだけ SELinux の分離を外します。ほかに手がないときの最後の手段です。

**Docker と Podman の違い**です。

| | Docker | Podman |
|---|---|---|
| RHEL 系での位置づけ | RHEL の標準のリポジトリにはない(Docker CE を別に入れる) | 標準 |
| SELinux の分離 | デーモンの `selinux-enabled` を有効にしたときに働く(`/etc/docker/daemon.json` に `"selinux-enabled": true` を書く。既定は無効) | 既定で働く |
| ラベルの付け替え | `:z`、`:Z` | `:z`、`:Z` |
| 既定の動かし方 | root のデーモン | デーモンなし。一般ユーザーで動く(次の 3.2) |

## 3.2 Rootless モード (重要度2)

出題範囲: User namespace、newuidmap と newgidmap、/etc/subuid と /etc/subgid、XDG_RUNTIME_DIR、systemctl --user と loginctl enable-linger。

### 1. Rootless モードとは

**Rootless モード**は、root 以外のユーザーが、コンテナの道具(Docker のデーモンも含む)を動かす形です。コンテナから抜け出されても、攻撃者は一般ユーザーの権限しか手に入りません。ホストの root は取られません。

| | 通常(rootful) | Rootless |
|---|---|---|
| デーモンやコンテナを動かすユーザー | root | 一般ユーザー |
| コンテナの中の root(UID 0)は、ホストでは | root(UID 0) | そのユーザー本人 |
| 抜け出されたときの被害 | ホスト全体 | そのユーザーの権限の範囲 |
| ホストの 1024 未満のポートへの公開 | できる | 既定ではできない |

Podman は、一般ユーザーで実行すると、そのまま Rootless です。Docker は、専用の準備(`dockerd-rootless-setuptool.sh install`)をします。

### 2. User namespace と UID の対応

Rootless の土台は、**User namespace**(ユーザー名前空間)です。コンテナの中の UID と、ホストの UID を、別の番号に対応づけるカーネルの機能です。

ユーザー alice(UID 1001)が Rootless のコンテナを動かしたときの対応です。

```text
container UID     host UID
0        ->       1001      alice 本人(コンテナの root)
1        ->       100000    /etc/subuid に書かれた範囲の先頭
2        ->       100001
...
1000     ->       100999    100000 + 1000 - 1
65536    ->       165535    範囲の最後(alice:100000:65536)
```

コンテナの中で `cat /proc/self/uid_map` を実行すると、この対応が見えます。

```text
         0       1001          1
         1     100000      65536
```

読み方は、「コンテナ内の開始 UID」「ホストの開始 UID」「個数」です。1 行目は、コンテナの 0 番が、ホストの 1001 番(alice)に 1 個対応します。2 行目は、コンテナの 1 番から 65536 個が、ホストの 100000 番から対応します。コンテナの UID `N`(1 以上)は、ホストでは `100000 + N - 1` です。

これが、バインドマウントで困りやすい理由です。

- コンテナの root が作ったファイルは、ホストでは alice のものに見えます。
- コンテナの UID 1000 が作ったファイルは、ホストでは UID 100999 のものに見えます。alice 自身は、そのファイルを読み書きできないことがあります。

Podman では、`podman unshare` で、コンテナと同じ User namespace の中に入って、ファイルの所有者を直せます(`podman unshare chown 1000:1000 ~/data`)。`--userns=keep-id` を付けると、ホストの自分の UID を、コンテナの中でも同じ番号にできます。

### 3. subuid、subgid と newuidmap、newgidmap

一般ユーザーが使える UID と GID の範囲は、次のファイルで決めます。

| ファイル | 内容 |
|---|---|
| `/etc/subuid` | ユーザーごとの、使ってよい下位 UID の範囲 |
| `/etc/subgid` | ユーザーごとの、使ってよい下位 GID の範囲 |

書式は `ユーザー名:開始:個数` です。

```text
alice:100000:65536
bob:165536:65536
```

alice は、100000 から 65536 個(100000 〜 165535)を使えます。人ごとに範囲が重ならないようにします。Rootless には、65536 個以上の範囲が要ります。

**newuidmap** と **newgidmap** は、setuid のプログラムです。一般ユーザーに代わって、`/etc/subuid` と `/etc/subgid` の範囲で、UID と GID の対応を作ります。

| | Debian 系(Ubuntu 24.04、Debian 12) | Red Hat 系(RHEL 9、AlmaLinux 9) |
|---|---|---|
| newuidmap、newgidmap が入るパッケージ | `uidmap` | `shadow-utils` 【要確認】 |

準備と確認です。

```bash
sudo apt install uidmap                      # Debian 系
ls -l /usr/bin/newuidmap /usr/bin/newgidmap  # setuid(-rwsr-xr-x)になっているか
grep '^alice:' /etc/subuid /etc/subgid       # alice の行があるか
# 行がないとき(範囲は他のユーザーと重ならないようにする)
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 alice
```

Ubuntu 24.04 は、非特権のユーザー名前空間を AppArmor で制限しています。`docker-ce-rootless-extras` を deb パッケージで入れれば、`rootlesskit` 用のプロファイルが同梱されています。インストールスクリプトで入れたときは、`/etc/apparmor.d/` にプロファイルを作り、`sudo systemctl restart apparmor.service` を実行します。

新しく作ったユーザーには、`useradd` や `adduser` が範囲を自動で足すのが普通です。ただし、古いユーザーや、ほかの方法で作ったユーザーには、行がないことがあります。行がないと、Rootless の準備で、範囲が見つからないという趣旨のエラーになります。Podman は、範囲を変えた後に `podman system migrate` を実行します。

### 4. systemctl --user、enable-linger、XDG_RUNTIME_DIR

Rootless Docker のデーモンは、そのユーザーの systemd(ユーザー用の systemd)の下で動かします。Podman も、サービスにするときは、同じ仕組みを使います。

| 道具 | 内容 |
|---|---|
| `systemctl --user` | ユーザー用の systemd を操作する(例: `systemctl --user enable --now docker`) |
| `loginctl enable-linger` | ログアウトしても、ユーザー用の systemd を動かし続ける。ブート時にも自動で始まる |
| `XDG_RUNTIME_DIR` | そのユーザー専用の実行時のディレクトリ(`/run/user/<UID>`)の場所を示す環境変数 |

Rootless Docker のソケットや、ユーザー用の systemd との通信の場所は、`XDG_RUNTIME_DIR` の下です。

```text
[login]                        ssh やローカルのログイン
  |
  v
[systemd --user]               ユーザー用の systemd が始まる
  |
  +--> /run/user/1001/         XDG_RUNTIME_DIR が指す場所
  |      +-- docker.sock       DOCKER_HOST がここを指す
  |
  +--> [dockerd / podman service]   systemctl --user で操作する
  |
  v
[logout]                       ふつうは、ここで全部止まる
                               loginctl enable-linger があれば、止まらない。ブート時にも始まる
```

```bash
# ログインしたユーザーで
systemctl --user enable --now docker          # Rootless Docker のデーモンを始め、自動起動にする
sudo loginctl enable-linger alice             # ログアウトしても動かし続ける(root が実行)
loginctl show-user alice | grep Linger        # Linger=yes を確かめる
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
docker info | grep -i rootless
```

つまずきやすい点です。

| 症状 | 原因と対応 |
|---|---|
| `su` や `sudo -u` で切り替えると、`systemctl --user` が `Failed to connect to bus` で失敗する | 切り替えたシェルに `XDG_RUNTIME_DIR` が設定されていない。ssh で直接そのユーザーでログインするか、`machinectl shell alice@` を使う(`systemd-container` パッケージが必要)。`export XDG_RUNTIME_DIR=/run/user/$(id -u)` で補う方法もあるが、ユーザー用の systemd が動いていることが前提 |
| ログアウトするとコンテナが止まる | `loginctl enable-linger` を実行していない |
| 再起動後に、ログインするまでコンテナが始まらない | 同じく linger がない |

### 5. Rootless の制限と Podman

Rootless では、権限が足りないために、できないことがあります。

| 制限 | 内容と対応 |
|---|---|
| ホストの 1024 未満のポート | 既定では公開できない(コンテナの中では待ち受けられる)。`sysctl net.ipv4.ip_unprivileged_port_start` を下げるか、Docker では `sudo setcap cap_net_bind_service=ep $(which rootlesskit)` を実行してデーモンを再起動する。または 1024 以上のポートで公開して前段で振り分ける |
| 資源の制限(`--memory`、`--cpus`) | cgroup v2 が使えるホストでだけ使える(Docker は systemd も必要)。既定で委譲されるのは、ふつう memory と pids。`--cpus` などには、`/etc/systemd/system/user@.service.d/delegate.conf` に `[Service]` と `Delegate=cpu cpuset io memory pids` を書き、`systemctl daemon-reload` を実行する |
| `--privileged` | ユーザー名前空間の中だけの特権になる。ホストの root の特権は得られない |
| ネットワーク | 通常より遅い(ユーザー空間で転送するため)。ping は、`net.ipv4.ping_group_range` で許可が要ることがある |

Podman の Rootless の基本です。

```bash
podman run --rm -it -p 8080:80 docker.io/library/nginx:1.27   # 一般ユーザーのまま実行
podman info | grep -i rootless                                  # rootless: true
podman unshare cat /proc/self/uid_map                           # ユーザー名前空間の対応
systemctl --user enable --now podman.socket                     # Docker 互換の API のソケット
ls $XDG_RUNTIME_DIR/podman/podman.sock
```

- Podman には常駐のデーモンがなく、コンテナは、コマンドを実行したユーザーの子プロセスです。
- サービスとして自動起動するときは、Quadlet(`~/.config/containers/systemd/` に `.container` ファイルを置く。Podman 4.4 以降。RHEL 9 系の Podman でもそのまま使えます)を使い、`systemctl --user` で操作します。ブート時から動かすには、`loginctl enable-linger` が要ります。
- Docker の Rootless と Podman の Rootless は、別のものです。ソケットの場所も、設定のファイルも別です。混ぜないようにします。
