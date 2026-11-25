# LinuC 3PS テキスト 3.0 コンテナ技術の利用

コンテナの内部の仕組みと、コンテナランタイムの種類(3.1)、Docker と Docker Compose を使った操作と運用(3.2)を学びます。コンテナを「動かせる」だけでなく、原因を調べて直せることが目標です。

Docker の基本は、Docker のテキスト(Docker_1.0 から Docker_8.0)にも書いてあります。ここでは、LinuC 3PS の出題範囲に合わせて、実務で必要な調べ方と設定に重ねて書きます。Docker Compose は Compose Specification(`compose.yml`、`docker compose` v2)を前提にします。

## 3.1 コンテナの基本原理と内部構造 (重要度3)

出題範囲: LXC、LXD / Incus。高レベルランタイム(containerd、CRI-O)。低レベルランタイム(runc、crun、gVisor、kata-containers)。

### 1. コンテナとは何か

- コンテナは、ホストの Linux のカーネルを共有したまま、プロセスを**隔離**して動かす仕組みです。仮想マシンのように、別のカーネルを動かすわけではありません。
- 隔離は、カーネルの 2 つの機能で作ります。

| 機能 | 役割 | 例 |
|---|---|---|
| namespace | プロセスから**見える範囲**を分ける | PID(プロセスの一覧)、NET(ネットワーク)、MNT(マウント)、UTS(ホスト名)、IPC、USER |
| cgroups | 使える**資源の量**を制限する | CPU、メモリ、プロセスの数、ディスク I/O |

- ホストから見ると、コンテナのプロセスは普通のプロセスです。`ps` に出て、`lsns` で、どの namespace に入っているかが分かります。
- カーネルを共有するので、コンテナは軽く速く起動します。その代わり、カーネルの脆弱性があると、ホストに影響が及ぶ可能性があります。この弱みを補うのが、3.1 の gVisor や Kata Containers です。

### 2. LXC と LXD / Incus

| 名前 | 何か | 主なコマンド |
|---|---|---|
| LXC | namespace と cgroups でコンテナを作る、ユーザー空間の道具とライブラリ | `lxc-create`、`lxc-start`、`lxc-attach`、`lxc-ls` |
| LXD | LXC の上の管理ツール。REST API で、コンテナと仮想マシンを管理する | `lxc launch`、`lxc list`、`lxc exec` |
| Incus | LXD から分かれた、コミュニティの管理ツール。使い方は LXD とよく似ている | `incus launch`、`incus list`、`incus exec` |

- LXC、LXD、Incus は、**システムコンテナ**(OS 1 台ぶんが入った、仮想マシンに近い使い方)が中心です。init(systemd)が動き、ssh でログインして、パッケージを入れて使えます。
- Docker は**アプリケーションコンテナ**(1 つのコンテナで 1 つのプロセスを動かす使い方)が中心です。
- LXD のクライアントのコマンド名は `lxc` です。LXC の `lxc-` で始まるコマンドとは別のものなので、取り違えないようにします。
- LXD は、コンテナのほかに仮想マシンも作れます(`lxc launch ubuntu:24.04 vm1 --vm`)。Incus も同じです(`incus launch images:debian/12 vm1 --vm`)。

```bash
# LXD の例
lxc launch ubuntu:24.04 c1        # イメージを取得して、コンテナ c1 を起動する
lxc list                          # コンテナの一覧
lxc exec c1 -- bash               # c1 の中でシェルを開く

# Incus の例(コマンド名が incus になるだけ)
incus launch images:debian/12 c1
incus list
incus exec c1 -- bash

# LXC の例(ユーザー空間の道具を直接使う)
lxc-create -n c2 -t download      # コンテナ c2 を作る(テンプレートからイメージを選ぶ)
lxc-start -n c2
lxc-attach -n c2
```

- LXC のコンテナの設定は、`/var/lib/lxc/<名前>/config` にあります【要確認: ディストリビューションとパッケージにより場所が違うことがあります】。

### 3. コンテナランタイムの階層

「コンテナランタイム」は、コンテナを動かすソフトウェアの総称です。仕事によって、2 つの階層に分かれます。

| 階層 | 仕事 | 例 |
|---|---|---|
| 高レベルランタイム | イメージの取得と保存、コンテナの管理(作る、止める、一覧)。実際の起動は低レベルに任せる | containerd、CRI-O |
| 低レベルランタイム | namespace と cgroups を設定して、コンテナのプロセスを起動する | runc、crun、gVisor(runsc)、Kata Containers |

Docker でコンテナを起動するときの、呼び出しの流れです。

```text
docker CLI
  |
  |  REST API (/var/run/docker.sock)
  v
dockerd              Docker デーモン
  |
  v
containerd           高レベルランタイム。イメージとコンテナを管理する
  |
  v
containerd-shim      コンテナごとに 1 つ。コンテナの親として残る
  |
  v
runc                 低レベルランタイム。コンテナを作って起動したら終わる
  |
  v
コンテナのプロセス
```

Kubernetes の場合は、`dockerd` の代わりに kubelet が CRI(Container Runtime Interface)で高レベルランタイムを呼び出します。

```text
kubelet
  |
  |  CRI (gRPC)
  v
containerd または CRI-O
  |
  |  OCI ランタイムとして呼び出す
  v
runc / crun / gVisor(runsc) / Kata Containers
```

- **OCI**(Open Container Initiative)は、コンテナの規格を決める団体です。主な規格は、イメージの形式(image-spec)、ランタイムの動かし方(runtime-spec)、配布の方法(distribution-spec)です。OCI の規格のおかげで、低レベルランタイムを入れ替えても、同じイメージが動きます。
- runtime-spec では、コンテナの設定を `config.json` と root ファイルシステム(rootfs)の組(バンドル)で表します。`runc spec` で、`config.json` のひな形ができます。

### 4. 高レベルランタイム

| | containerd | CRI-O |
|---|---|---|
| 用途 | Docker の内部。Kubernetes でも使われる。単体でも使える | **Kubernetes 専用** |
| CRI | プラグインとして内蔵 | CRI を実装することが目的 |
| 設定ファイル | `/etc/containerd/config.toml` | `/etc/crio/crio.conf`、`/etc/crio/crio.conf.d/` |
| ソケット | `/run/containerd/containerd.sock` | `/var/run/crio/crio.sock` |
| 操作の道具 | `ctr`(低レベルの道具)、`nerdctl`、`crictl` | `crictl` |
| 低レベルランタイム | runc が既定。ほかも選べる | crun が既定(1.31 から)。runc も選べる |

- どちらも CNCF(Cloud Native Computing Foundation)のプロジェクトです。
- `crictl` は、CRI のランタイムを直接操作する道具です。kubelet が使うランタイムに対して、`crictl ps` や `crictl logs` ができます。
- Kubernetes は v1.24 で dockershim を削除し、Docker を通さずに containerd や CRI-O を直接使います。
- containerd の設定で、Kata Containers や gVisor を追加のランタイムとして登録できます。Kubernetes では、RuntimeClass でどのランタイムを使うかを Pod ごとに選びます。

### 5. 低レベルランタイム

| ランタイム | 実装 | 隔離の方法 | 特徴 |
|---|---|---|---|
| runc | Go | 通常のコンテナ(namespace と cgroups) | OCI の参照実装。最も広く使われる |
| crun | C | 通常のコンテナ | 軽くて速い。メモリが少ない。CRI-O(1.31 から)で既定。Podman も RHEL 9 系などで既定【要確認】 |
| gVisor(runsc) | Go | ユーザー空間の専用カーネル(Sentry)がシステムコールを受け止める | ホストのカーネルに届く呼び出しが減る。システムコールの多い処理で遅くなる |
| Kata Containers | 主に Go と Rust | コンテナ(Pod)ごとに軽い仮想マシンを作り、その中のカーネルで動かす | 隔離が強い。仮想化支援のあるホストが要る。起動が遅い |

隔離の強さと、軽さの関係です。

```text
通常のコンテナ(runc、crun)
  コンテナ --> ホストのカーネル
  ・カーネルを共有する。軽くて速い

gVisor(runsc)
  コンテナ --> Sentry(ユーザー空間のカーネル) --> ホストのカーネル
  ・システムコールの大部分を Sentry が処理する

Kata Containers
  コンテナ --> ゲストのカーネル(軽い仮想マシンの中) --> ホストのカーネル
  ・コンテナごとに別のカーネルを持つ。隔離が最も強い
```

- 信頼できないコードを動かす(複数の利用者が使うサービスなど)ときに、gVisor や Kata Containers を選びます。社内の信頼できるアプリなら、runc で足ります。
- Docker で別のランタイムを使うには、`/etc/docker/daemon.json` の `runtimes` に登録して、`docker run --runtime=runsc` のように指定します。登録して、デーモンを再起動する必要があります。

```json
{
  "runtimes": {
    "runsc": { "path": "/usr/local/bin/runsc" }
  }
}
```

## 3.2 コンテナの操作と管理 (重要度4)

出題範囲: docker logs / inspect / info / network / volume / history。docker system / image / builder prune、docker cp。ログドライバー(json-file、syslog、journald)。Dockerfile の主な命令。docker login と config.json。daemon.json。compose.yml の主な項目。docker compose。

### 1. 状態を調べるコマンド

| コマンド | 分かること | よく使う形 |
|---|---|---|
| `docker logs` | コンテナの標準出力と標準エラー出力 | `docker logs -f --tail 100 web`、`--since 10m`、`-t`(時刻を付ける) |
| `docker inspect` | コンテナ、イメージ、ネットワーク、ボリュームの詳しい情報(JSON) | `docker inspect -f '{{.State.ExitCode}}' web` |
| `docker info` | Docker デーモン全体の情報 | Storage Driver、Logging Driver、Cgroup のバージョン、Docker Root Dir、Runtimes |
| `docker network` | ネットワークの管理 | `ls`、`inspect`、`create`、`connect`、`disconnect`、`rm`、`prune` |
| `docker volume` | ボリュームの管理 | `ls`、`inspect`、`create`、`rm`、`prune` |
| `docker history` | イメージの層(レイヤー)と、層を作った命令、サイズ | `docker history --no-trunc IMAGE` |

```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web   # IP アドレス(つながっているネットワークごと)
docker inspect -f '{{json .Mounts}}' web                      # マウントを JSON で
docker inspect -f '{{.State.OOMKilled}} {{.State.ExitCode}}' web   # メモリ不足で落ちたか
docker network inspect bridge                                 # どのコンテナがつながっているか
docker volume inspect pgdata                                  # Mountpoint(ホスト上の場所)が分かる
docker info --format '{{.LoggingDriver}}'                     # 既定のロギングドライバー
```

- `docker logs` が読めるのは、デーモンが手元に持つログ(`json-file`、`local`、`journald`)です。Docker 20.10 以降は、ログを外に送るドライバーでも、読むための手元のコピーを作ります(dual logging)【要確認: ドライバーによる】。
- `docker inspect` は、名前がコンテナとイメージで同じだと、どちらを出すか迷います。`--type container` のように種類を指定します。
- `docker history` は、イメージがどの命令で、どれだけ大きくなったかを調べるときに使います。`ARG` や `ENV` に入れた値も見えるので、秘密の値をイメージに入れてはいけません。
- ボリュームの実体は、Linux では `/var/lib/docker/volumes/<名前>/_data` にあります。

### 2. 掃除のコマンド(prune)

| コマンド | 消すもの | 注意 |
|---|---|---|
| `docker container prune` | 止まったコンテナ | |
| `docker image prune` | **名前のない**(dangling)イメージ | `-a` で、コンテナから使われていないイメージを全部 |
| `docker network prune` | 使われていないネットワーク | |
| `docker volume prune` | どのコンテナからも使われていない匿名ボリューム | `-a` で名前付きも。データが消える |
| `docker builder prune` | ビルドキャッシュ | `-a` で全部 |
| `docker system prune` | 止まったコンテナ、使われていないネットワーク、名前のないイメージ、ビルドキャッシュ | ボリュームは `--volumes` を付けたときだけ。`-a` で使われていないイメージも |

- 消す前に、`docker system df` で、何がどれだけ使っているかを見ます。
- 確認の質問は `-f`(`--force`)で省けます。`--filter "until=24h"` で、古いものだけに絞れます。
- `no space left on device` が出たときの、掃除の順番の例です。

```bash
docker system df                    # 使用量の内訳を見る
docker builder prune -f             # ビルドキャッシュ(消しても困らないことが多い)
docker image prune -f               # 名前のないイメージ
docker system prune -f              # まとめて(ボリュームは消えない)
```

### 3. ファイルのコピー: docker cp

```bash
docker cp web:/etc/nginx/nginx.conf ./nginx.conf     # コンテナからホストへ
docker cp ./nginx.conf web:/etc/nginx/nginx.conf     # ホストからコンテナへ
```

- コンテナの名前または ID に続けて、`:` とコンテナ内のパスを書きます。
- **止まっているコンテナ**でも使えます。落ちたコンテナの中のログや設定を取り出すときに便利です。
- コピーするだけで、アプリに設定を読み直させるわけではありません。コンテナを作り直すと、コピーしたファイルは消えます(イメージか、マウントに入れる)。

### 4. ロギングドライバー

コンテナの標準出力と標準エラー出力は、デーモンのロギングドライバーが受け取って、送り先に渡します。

| ドライバー | 送り先 | `docker logs` | 補足 |
|---|---|---|---|
| `json-file`(既定) | `/var/lib/docker/containers/<ID>/<ID>-json.log` | 読める | **ローテーションしない**。`max-size` と `max-file` を決める |
| `local` | ホストのファイル(圧縮、既定でローテーション) | 読める | |
| `syslog` | syslog(ホストの rsyslog など。ネットワーク先も可) | 読める【要確認: 版による】 | `--log-opt syslog-address=udp://loghost:514`、`--log-opt tag=web` |
| `journald` | systemd-journald | 読める | `journalctl CONTAINER_NAME=web` で探す |

```bash
# コンテナごとに指定する
docker run -d --name web --log-driver json-file \
  --log-opt max-size=10m --log-opt max-file=3 nginx

# journald に送ったログを、journalctl で読む
docker run -d --name web2 --log-driver journald nginx
journalctl CONTAINER_NAME=web2 -f
```

- デーモン全体の既定は、`/etc/docker/daemon.json` の `log-driver` と `log-opts` で決めます。
- ドライバーを変えても、**すでにあるコンテナ**には反映されません。コンテナを作り直します。

### 5. Dockerfile の主な命令

| 命令 | 役割 | 気をつけること |
|---|---|---|
| `FROM` | 元になるイメージを決める | 最初に書く(`ARG` だけは前に書ける)。タグを固定する |
| `RUN` | ビルド中にコマンドを実行する | 1 つの命令が 1 つの層になる。`&&` でつなげて層を減らす |
| `USER` | 以降の命令と、実行時のユーザーを決める | root のままにしない |
| `WORKDIR` | 作業ディレクトリを決める(なければ作る) | `RUN cd` は次の命令に引き継がれない |
| `COPY` | ホスト(ビルドコンテキスト)のファイルをイメージに入れる | `--chown` で所有者を決める。`--from` で別のステージから |
| `ADD` | `COPY` に加えて、URL の取得と tar の自動展開ができる | 動きが読みにくいので、普通は `COPY` を使う |
| `CMD` | 既定のコマンド(または `ENTRYPOINT` への既定の引数) | `docker run IMAGE 引数` の引数で**置き換わる** |
| `ENTRYPOINT` | 起動のたびに必ず実行するコマンド | `docker run` の引数は**後ろに追加**される。置き換えは `--entrypoint` |
| `HEALTHCHECK` | コンテナが正常かを調べるコマンド | 既定の間隔は 30 秒、タイムアウトは 30 秒、再試行は 3 回 |
| `LABEL` | イメージにメタデータを付ける | `LABEL org.opencontainers.image.source="…"` |
| `ENV` | 環境変数。ビルド中にも、実行時のコンテナにも残る | `docker run -e` で上書きできる |
| `ARG` | **ビルドのときだけ**使う変数 | `docker build --build-arg` で渡す。実行時のコンテナには残らない |

```dockerfile
ARG BASE_TAG=3.12-slim
FROM python:${BASE_TAG}
LABEL org.opencontainers.image.source="https://example.com/app"
ENV APP_ENV=production
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -r app
USER app
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8000/health')" || exit 1
ENTRYPOINT ["python", "-m", "app"]
CMD ["--port", "8000"]
```

- `ARG` は、`FROM` より前に書くと、`FROM` の行の中だけで使えます。`FROM` の後でも使いたいなら、ステージの中でもう一度 `ARG` を書きます。
- `ARG` と `ENV` に、パスワードなどの秘密の値を入れません。`docker history` や `docker inspect` で見えます。
- `ENTRYPOINT` と `CMD` は、exec 形式(`["…", "…"]`)で書きます。シェル形式だと、`docker stop` のシグナルがアプリに届かないことがあります。
- `HEALTHCHECK` の結果は `docker ps` の STATUS(`healthy`、`unhealthy`)に出ます。Docker 単体では、unhealthy でもコンテナを再起動しません。

`CMD` と `ENTRYPOINT` の組み合わせで、実行されるコマンドが決まります。

```text
ENTRYPOINT ["python", "-m", "app"]  と CMD ["--port", "8000"] のとき

docker run IMAGE                 -->  python -m app --port 8000
docker run IMAGE --port 9000     -->  python -m app --port 9000    CMD が置き換わる
docker run --entrypoint sh IMAGE -->  sh                           ENTRYPOINT を置き換える。CMD は捨てられる
```

### 6. docker login と config.json

```bash
docker login registry.example.com                       # ユーザー名とパスワードを聞かれる
echo "$TOKEN" | docker login -u ci-user --password-stdin registry.example.com   # 自動化ではこちら
docker logout registry.example.com
```

- 認証情報は、`~/.docker/config.json` に保存されます。ディレクトリは、環境変数 `DOCKER_CONFIG` で変えられます。
- **認証情報ヘルパー**(`credsStore`、`credHelpers`)を設定しないと、`auths` の中に `user:password` を Base64 にしただけの文字列で入ります。Base64 は暗号ではありません。ファイルの権限(`chmod 600`)と、ヘルパーで守ります。
- `docker login` は、`-p` でパスワードを引数に書くと、シェルの履歴とプロセス一覧に残ります。`--password-stdin` を使います。

ヘルパーを使わないとき(Base64 の文字列が入ります)。

```json
{
  "auths": {
    "registry.example.com": { "auth": "Y2ktdXNlcjpzZWNyZXQ=" }
  }
}
```

ヘルパーを使うとき(認証情報はヘルパーが持ち、`auths` は空になります)。

```json
{
  "auths": {
    "registry.example.com": {}
  },
  "credsStore": "pass"
}
```

### 7. daemon.json

- Docker デーモンの設定ファイルは、Linux では `/etc/docker/daemon.json` です。ファイルがなければ、作ります。
- Docker Desktop や rootless モードでは、場所が違います【要確認】。

| キー | 意味 | 例 |
|---|---|---|
| `log-driver`、`log-opts` | 既定のロギングドライバーとオプション | `"log-driver": "journald"` |
| `data-root` | イメージ、ボリュームなどの置き場(既定は `/var/lib/docker`) | `"data-root": "/data/docker"` |
| `registry-mirrors` | イメージ取得のミラー | `["https://mirror.example.com"]` |
| `insecure-registries` | HTTPS でないレジストリを許す | 本番では避ける |
| `runtimes`、`default-runtime` | 追加の低レベルランタイムと、既定の選択 | runsc を登録する |
| `live-restore` | デーモンを止めても、コンテナを動かし続ける | `true` |

```bash
sudo dockerd --validate --config-file /etc/docker/daemon.json   # 書き方の確認(起動はしない)
sudo systemctl restart docker                                   # 反映
docker info | grep -i "logging driver"                          # 反映の確認
```

- 反映には、多くの場合 `systemctl restart docker` が要ります(一部の項目は、`SIGHUP` による再読み込みで済みます)。
- JSON の書き方に誤りがあると、デーモンが**起動しません**。`journalctl -u docker` で原因を見ます。
- `daemon.json` の `hosts` と、systemd の起動オプション(`-H`)の両方で待ち受けを決めると、衝突して起動に失敗します。どちらか片方に決めます。

### 8. compose.yml と docker compose

```yaml
services:
  web:
    image: myapp:1.0
    ports:
      - "127.0.0.1:8080:8000"      # ホストの 8080 を、コンテナの 8000 へ(ホストの自分だけに公開)
    environment:
      APP_ENV: production
    env_file:
      - ./web.env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - backend
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    expose:
      - "5432"                     # 使うポートを書いておく(情報としての意味。ホストのポートには公開しない)
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - backend

networks:
  backend:

volumes:
  pgdata:

secrets:
  db_password:
    file: ./db_password.txt
```

| 項目 | 意味 | 気をつけること |
|---|---|---|
| `services` | 動かすコンテナの定義 | キーがサービス名。サービス名で互いに名前解決できる |
| `depends_on` | 起動の順番と条件 | 短い書き方は `service_started`。DB の準備を待つなら `service_healthy` と `healthcheck` |
| `restart` | 再起動の方針 | `no`(既定)、`always`、`on-failure`、`unless-stopped` |
| `networks` | 使うネットワーク | 書かなければ `<プロジェクト名>_default` に全サービスがつながる |
| `volumes` | マウント(サービスの中)と、名前付きボリュームの宣言(一番上) | `docker compose down` では消えない。`down -v` で消える |
| `logging` | サービスごとのロギングドライバーとオプション | `options` の値は文字列 |
| `ports` | ホストにポートを公開する | `"ホスト:コンテナ"` を引用符で囲む。`127.0.0.1:` を付けるとホストの自分だけ |
| `expose` | 使うポートを書いておく(情報としての意味)。ホストのポートには公開しない | 同じネットワークのサービスとホスト自身は、指定がなくても接続できる |
| `environment` | 環境変数 | `env_file` と同じ名前なら、`environment` が**優先**される |
| `env_file` | ファイルから環境変数を読む | 複数書くと、後ろのファイルが優先される |
| `healthcheck` | ヘルスチェック | `test`、`interval`、`timeout`、`retries`、`start_period`。Dockerfile の `HEALTHCHECK` を上書きする |

- ファイル名は `compose.yaml` が推奨で、`compose.yml`、`docker-compose.yml` も読めます。先頭の `version:` は不要です(書くと警告が出ます)。
- `ports` の数字は、引用符で囲みます。`22:22` のように書くと、YAML が時刻のような数として読むことがあります。
- `.env`(`compose.yml` の `${変数}` の展開に使う)と `env_file`(コンテナに渡す環境変数)は、役割が違います。
- `restart: unless-stopped` は、手で止めたコンテナは、デーモンの再起動後も動かしません。`always` は動かします。
- unhealthy になったコンテナを、Compose が自動で再起動することはありません(Docker 単体と同じ)。

`depends_on` の条件ごとに、web が起動する時点が変わります。

```text
time ------------------------------------------------------------>
db                      : [started] --- healthcheck ---- [healthy]
web (service_started)   : [started]                                  db の起動の直後
web (service_healthy)   :                                [started]   db が healthy になってから
```

| コマンド | 動き |
|---|---|
| `docker compose up -d` | イメージを用意し、ネットワークとボリュームを作り、全サービスを起動する |
| `docker compose down` | コンテナとネットワークを削除する。ボリュームは残る(`-v` で消える) |
| `docker compose ps` | プロジェクトのコンテナの一覧(`healthy` も見える) |
| `docker compose logs -f web` | サービスのログ |
| `docker compose exec web sh` | 動いているコンテナの中で実行する |
| `docker compose config` | 変数を展開し、複数のファイルを合わせた最終の設定を表示する。書き方の誤りも見つかる |
| `docker compose up -d --build` | イメージを作り直して起動する |

- `docker-compose`(ハイフンあり)は古い v1 のコマンドです。今は `docker compose` を使います。
- `up -d` は、設定が変わったサービスだけを作り直します。

### 9. 症状から調べる

| 症状 | 確かめること | よくある原因 |
|---|---|---|
| コンテナがすぐ終了する | `docker ps -a`、`docker logs`、`docker inspect -f '{{.State.ExitCode}}'` | 設定の誤り、環境変数の不足、PID 1 のコマンドがすぐ終わる |
| 終了コード 137 | `docker inspect -f '{{.State.OOMKilled}}'` | メモリの上限を超えた(または SIGKILL) |
| `no space left on device` | `docker system df`、`df -h /var/lib/docker` | 古いイメージ、ビルドキャッシュ、**json-file のログ** |
| デーモンが起動しない | `journalctl -u docker`、`dockerd --validate` | `daemon.json` の書き方の誤りと、`hosts` と `-H` の衝突 |
| Compose で web が DB に接続できない | `docker compose ps`、`docker compose logs db` | `depends_on` が起動の順番だけ。`service_healthy` にする |
| `docker logs` に何も出ない | `docker inspect -f '{{.HostConfig.LogConfig.Type}}' web` | アプリがファイルに書いている。または、読めないドライバーを使っている |
| `unauthorized`(pull 時) | `~/.docker/config.json` の `auths` | `docker login` をしていない。期限切れのトークン |
