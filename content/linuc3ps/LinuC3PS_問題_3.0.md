# LinuC3PS 問題 3.0 コンテナ技術の利用

対象: LinuC レベル3 3PS試験 Version 1.0 / 全34問 / すべてオリジナル問題
対応テキスト: `LinuC3PS_3.0_コンテナ技術の利用.md`
解答・解説は末尾。

## 問題

### 3.1 コンテナの基本原理と内部構造

**問1** `LinuC3PS-3.0-001` コンテナランタイムを「高レベルランタイム」と「低レベルランタイム」に分けたとき、低レベルランタイムだけの組み合わせはどれか。

- A. runc と crun
- B. containerd と CRI-O
- C. containerd と runc
- D. CRI-O と gVisor

**問2** `LinuC3PS-3.0-002` Kubernetes のワーカーノードで、kubelet が CRI-O を使っている。API サーバーに頼らず、ノード上でコンテナの一覧をランタイムに直接問い合わせたい。使うコマンドはどれか。

- A. `docker ps`
- B. `ctr containers ls`
- C. `kubectl get pods`
- D. `crictl ps`

**問3** `LinuC3PS-3.0-003` 複数の顧客のコードを同じホストで動かすサービスを作る。Pod ごとに専用のゲストカーネルを持つ軽い仮想マシンの中でコンテナを動かし、ホストのカーネルを共有しないようにしたい。ホストは CPU の仮想化支援が使える。選ぶ低レベルランタイムはどれか。

- A. runc
- B. Kata Containers
- C. gVisor
- D. crun

**問4** `LinuC3PS-3.0-004` Docker で gVisor を使うため、runsc を `/usr/local/bin/runsc` に入れた。`docker run --runtime=runsc nginx` を実行すると、`unknown or invalid runtime name: runsc` と表示された。原因として最も適切なものはどれか。

- A. イメージが OCI の形式ではない
- B. containerd が停止している
- C. `/etc/docker/daemon.json` の `runtimes` に runsc を登録していない
- D. ホストが cgroups v2 を使っている

**問5** `LinuC3PS-3.0-005` LXD の説明として正しいものを**2つ**選べ。

- A. LXC の上で動き、REST API でコンテナと仮想マシンを管理する
- B. Incus は、LXD と同じ開発元が出している、LXD の次の版である
- C. `--vm` を付けると、コンテナではなく仮想マシンを作れる
- D. クライアントのコマンド名は `lxc-create` である

**問6** `LinuC3PS-3.0-006` OCI のランタイム仕様では、コンテナの設定を rootfs と、あるファイルの組で表す。`runc spec` を実行すると、ひな形ができるこのファイルの名前を答えよ。

**問7** `LinuC3PS-3.0-007` LXC の `lxc-` で始まる道具で、起動している c2 のコンテナの中で、ログインせずにシェル(コマンド)を直接実行するコマンドの名前を答えよ(オプションと引数は不要)。

**問8** `LinuC3PS-3.0-008` Docker で `docker run` を実行したとき、namespace と cgroups を設定して最初にコンテナのプロセスを起動するのは、呼び出しの流れのどの部品か。

- A. runc
- B. dockerd
- C. containerd
- D. docker CLI

**問9** `LinuC3PS-3.0-009` 信頼できないコードを動かすため、ホストのカーネルとコンテナの間に、ユーザー空間で動くカーネルを置いて、ホストのカーネルに届くシステムコールを減らしたい。ただし、使うクラウドの VM では、仮想化支援(ネストした仮想化)が使えない。選べるものはどれか。

- A. runc
- B. Kata Containers
- C. crun
- D. gVisor

**問10** `LinuC3PS-3.0-010` Kubernetes のノードで containerd を使っている。containerd に、追加の低レベルランタイムを登録するときに編集する設定ファイルはどれか。

- A. `/etc/docker/daemon.json`
- B. `/etc/crio/crio.conf`
- C. `/etc/containerd/config.toml`
- D. `/etc/kubernetes/kubelet.conf`

**問11** `LinuC3PS-3.0-011` runc と crun の説明として正しいものはどれか。

- A. crun は Go 言語で書かれていて、runc は C 言語で書かれている
- B. どちらも OCI のランタイム仕様に沿っているので、同じイメージを動かせる
- C. crun は Docker でしか使えない
- D. runc はイメージを取得して保存する

### 3.2 コンテナの操作と管理

**問12** `LinuC3PS-3.0-012` コンテナ web のログを、新しい出力が出るたびに追い続けて表示したい。`docker logs` に付けるオプションを答えよ。

**問13** `LinuC3PS-3.0-013` コンテナ web が終了した。終了コードだけを取り出して表示するコマンドはどれか。

- A. `docker info -f '{{.State.ExitCode}}' web`
- B. `docker history web`
- C. `docker inspect -f '{{.State.ExitCode}}' web`
- D. `docker logs --exit-code web`

**問14** `LinuC3PS-3.0-014` ビルド用のホストでディスクが足りなくなった。コンテナとイメージは残し、ビルドキャッシュだけを消したい。適切なコマンドはどれか。

- A. `docker system prune`
- B. `docker image prune -a`
- C. `docker container prune`
- D. `docker builder prune`

**問15** `LinuC3PS-3.0-015` `docker image prune`(オプションなし)を実行した。消えるものはどれか。

- A. コンテナから使われていないイメージ、すべて
- B. 止まったコンテナ
- C. 名前(タグ)のない dangling イメージ
- D. ビルドキャッシュ

**問16** `LinuC3PS-3.0-016` 終了して止まっているコンテナ web の `/var/log/app/error.log` を、ホストのカレントディレクトリに取り出したい。適切なコマンドはどれか。

- A. `docker exec web cat /var/log/app/error.log`
- B. `docker cp web:/var/log/app/error.log .`
- C. `docker logs web > error.log`
- D. `docker cp ./error.log web:/var/log/app/`

**問17** `LinuC3PS-3.0-017` コンテナ web2 を `docker run -d --name web2 --log-driver journald nginx` で起動した。web2 のログを journalctl で絞り込むコマンドはどれか。

- A. `journalctl -u web2`
- B. `journalctl -t json-file`
- C. `journalctl /var/lib/docker/containers/web2`
- D. `journalctl CONTAINER_NAME=web2`

**問18** `LinuC3PS-3.0-018` あるホストで `/var/lib/docker/containers/` 以下の `-json.log` が数十 GB になり、ディスクが一杯になった。ロギングドライバーは既定の json-file である。再発を防ぐ設定として適切なものはどれか。

- A. `docker system prune` を毎日実行する
- B. `daemon.json` の `log-opts` に `max-size` と `max-file` を書き、デーモンを再起動して、コンテナを作り直す
- C. コンテナを再起動する
- D. `docker logs --since 1h` を使う

**問19** `LinuC3PS-3.0-019` `/etc/docker/daemon.json` を次のように書いて `systemctl restart docker` を実行したら、Docker が起動しなくなった。原因として最も適切なものはどれか。

```json
{
  "log-driver": "journald",
  "log-opts": { "tag": "{{.Name}}" },
}
```

- A. `log-driver` に `journald` は指定できない
- B. `log-opts` はコンテナごとにしか書けない
- C. ファイルは `/etc/docker/config.json` に置く必要がある
- D. 最後の項目の後ろのカンマのため、JSON として不正である

**問20** `LinuC3PS-3.0-020` Dockerfile で、バージョンを渡すための値 `APP_VERSION` を、ビルドのときだけ使い、実行されるコンテナの環境変数には残したくない。使う命令はどれか。

- A. `ENV`
- B. `LABEL`
- C. `ADD`
- D. `ARG`

**問21** `LinuC3PS-3.0-021` 次の Dockerfile でイメージ `app` を作った。`docker run app --port 9000` で実行されるコマンドはどれか。

```dockerfile
ENTRYPOINT ["python", "-m", "server"]
CMD ["--port", "8000"]
```

- A. `python -m server --port 8000 --port 9000`
- B. `--port 9000`
- C. `python -m server`
- D. `python -m server --port 9000`

**問22** `LinuC3PS-3.0-022` ホストの `app.tar.gz` を、展開せずに、アーカイブのままイメージの `/opt/` に入れたい。Dockerfile の書き方として適切なものはどれか。

- A. `ADD app.tar.gz /opt/`
- B. `COPY app.tar.gz /opt/`
- C. `ARG app.tar.gz /opt/`
- D. `LABEL app.tar.gz /opt/`

**問23** `LinuC3PS-3.0-023` Dockerfile に `HEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1` を書いたコンテナを、Docker 単体(`docker run`)で動かした。アプリが応答しなくなり、`docker ps` の STATUS が `unhealthy` になった。Docker は何をするか。

- A. コンテナを自動で再起動する
- B. コンテナを停止して削除する
- C. 状態を `unhealthy` と表示するだけで、コンテナは動かし続ける
- D. ホストのネットワークからコンテナを切り離す

**問24** `LinuC3PS-3.0-024` 自動のジョブから、レジストリ registry.example.com に `docker login` をする。パスワードを、シェルの履歴やプロセス一覧に残さずに渡すためのオプションを答えよ。

**問25** `LinuC3PS-3.0-025` CI のサーバーで `docker login` をしたところ、`~/.docker/config.json` の `auths` に、認証情報が Base64 の文字列で入っていた。これをより安全にする方法として適切なものはどれか。

- A. Base64 は暗号なので、何もしなくてよい
- B. `config.json` に認証情報ヘルパー(`credsStore`)を設定する
- C. `docker login -p` でパスワードを引数に書く
- D. `config.json` を誰でも読める権限にする

**問26** `LinuC3PS-3.0-026` 次の compose.yml で、`docker compose up -d` の直後に web が db に接続できず、エラーで終了する。db が接続を受け付けられる状態になる前に web が起動するためである。直す方法として適切なものはどれか。

```yaml
services:
  web:
    image: myapp:1.0
    depends_on:
      - db
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: example-only   # 架空の値
```

- A. db に `healthcheck` を書き、web の `depends_on` に `condition: service_healthy` を付ける
- B. web の `depends_on` を削除する
- C. db に `restart: always` を付ける
- D. web に `ports` を書く

**問27** `LinuC3PS-3.0-027` compose.yml で、db サービスを、同じネットワークの web からは `db:5432` で接続でき、ホストのポートには公開しないようにしたい。適切な書き方はどれか。

- A. `ports: ["5432:5432"]`
- B. `ports: ["0.0.0.0:5432:5432"]`
- C. `network_mode: host`
- D. `ports` は書かず、必要なら `expose: ["5432"]` だけを書く

**問28** `LinuC3PS-3.0-028` compose.yml のサービス app に、次の 2 つを書いた。`web.env` には `LOG_LEVEL=debug` が入っている。コンテナの中の `LOG_LEVEL` の値はどれか。

```yaml
env_file:
  - ./web.env
environment:
  LOG_LEVEL: info
```

- A. `debug`
- B. `info`
- C. `debug,info`
- D. 定義されず、エラーになる

**問29** `LinuC3PS-3.0-029` `docker compose down`(オプションなし)で削除されるものを**2つ**選べ。ただし、プロジェクトは名前付きボリュームを 1 つ使っている。

- A. プロジェクトのコンテナ
- B. 名前付きボリューム
- C. プロジェクトのネットワーク
- D. ビルドしたイメージ

**問30** `LinuC3PS-3.0-030` コンテナ web と db を、ユーザー定義の bridge ネットワーク `app-net` につなぎたい。web は、`app-net` につなぐ設定なしで、すでに動いている。動いたままの web を、`app-net` につなぐコマンドを答えよ。

**問31** `LinuC3PS-3.0-031` 名前付きボリューム pgdata のホスト上の場所(Mountpoint)を確認するコマンドを答えよ。

**問32** `LinuC3PS-3.0-032` compose.yml で web に `restart: unless-stopped` を書いた。`docker compose stop web` で手動で止めた後に、ホストを再起動した。Docker デーモンが起動したとき、web はどうなるか。

- A. 再び起動する
- B. 起動せず、止まったままになる
- C. 5 回まで再起動を試みる
- D. コンテナが削除される

**問33** `LinuC3PS-3.0-033` ベースイメージの作業ディレクトリは `/` である。次の Dockerfile のビルドのログで、`RUN pwd` の出力として正しいものはどれか。

```dockerfile
FROM alpine:3.23
RUN mkdir /app && cd /app
RUN pwd
```

- A. `/app`
- B. `/root`
- C. `/home`
- D. `/`

**問34** `LinuC3PS-3.0-034` イメージ `myapp:1.0` が 1.2 GB ある。どの命令の層が大きいかを調べたい。各層を作った命令とサイズを一覧するコマンドはどれか。

- A. `docker history myapp:1.0`
- B. `docker info`
- C. `docker logs myapp:1.0`
- D. `docker network ls`

## 解答・解説

### 問1 `LinuC3PS-3.0-001`

**正解**: A

**テキスト**: 3. コンテナランタイムの階層

どちらも OCI のランタイム仕様に沿って、namespace と cgroups を設定しコンテナのプロセスを起動する低レベルランタイムです。高レベルランタイム(containerd、CRI-O)は、イメージの取得と保存、コンテナの管理を担当し、実際の起動を低レベルランタイムに任せます。低レベルランタイム(runc、crun、gVisor、Kata Containers)は、OCI の規格に沿ってプロセスを起動します。

- B. どちらも、イメージの管理とコンテナの管理を行う高レベルランタイムです。
- C. containerd は高レベル、runc は低レベルなので、組み合わせとして混ざっています。
- D. CRI-O は高レベル、gVisor(runsc)は低レベルなので、混ざっています。

### 問2 `LinuC3PS-3.0-002`

**正解**: D

**テキスト**: 4. 高レベルランタイム

`crictl` は、CRI を実装したランタイム(CRI-O、containerd)に直接つなぐ道具です。`crictl` は CRI の道具なので、ランタイムが CRI-O でも containerd でも使えます。ソケットの場所は `--runtime-endpoint` か `/etc/crictl.yaml` で指定します。

- A. このノードに Docker デーモンはなく、CRI-O のコンテナは `docker ps` に出ません。
- B. `ctr` は containerd を操作する道具です。CRI-O のコンテナは見えません。
- C. API サーバー経由の操作です。API サーバーに頼らない、という条件に合いません。

### 問3 `LinuC3PS-3.0-003`

**正解**: B

**テキスト**: 5. 低レベルランタイム

コンテナや Pod ごとに軽い仮想マシンを起動し、その中のカーネルで動かします。隔離の強さは、runc と crun(カーネルを共有)、gVisor(システムコールをユーザー空間で処理)、Kata Containers(別のカーネルを持つ仮想マシン)の順に強くなります。Kata Containers は、起動が遅くなり、仮想化支援のあるホストが要ります。

- A. ホストのカーネルを共有する通常のコンテナです。ゲストカーネルは持ちません。
- C. ユーザー空間の専用カーネル(Sentry)でシステムコールを処理します。仮想マシンではなく、ゲストカーネルも持ちません。
- D. runc と同じ、通常のコンテナです。ホストのカーネルを共有します。

### 問4 `LinuC3PS-3.0-004`

**正解**: C

**テキスト**: 5. 低レベルランタイム

Docker は、`daemon.json` の `runtimes` に登録された名前だけを `--runtime` で選べます。登録して、デーモンを再起動します。低レベルランタイムを追加するときは、バイナリを入れるだけでは足りず、デーモンに名前と場所を教えます。

- A. OCI のイメージは、runc でも runsc でも動かせます。イメージの形式は関係しません。
- B. 停止していると、別のエラー(デーモンへの接続や起動の失敗)になります。ランタイム名が分からない、というエラーにはなりません。
- D. gVisor は cgroups v2 でも動きます。このエラーとは関係ありません。

### 問5 `LinuC3PS-3.0-005`

**正解**: A、C

**テキスト**: 2. LXC と LXD / Incus

LXC の `lxc-` で始まるコマンドと、LXD の `lxc` コマンドは別のものです。Incus を使うなら、コマンド名は `incus` になります。LXC、LXD、Incus は、OS 1 台ぶんが入ったシステムコンテナが中心です。

- A. LXD の中心的な役割です。イメージ、ストレージ、ネットワークも管理します。
- C. `lxc launch ubuntu:24.04 vm1 --vm` のように使います。Incus の `incus launch` も同じです。
- B. Incus は、LXD から分かれて、コミュニティが開発しているプロジェクトです。LXD の次の版ではありません。
- D. `lxc-create` は LXC の道具です。LXD のクライアントのコマンド名は `lxc` で、`lxc launch` や `lxc list` のように使います。

### 問6 `LinuC3PS-3.0-006`

**正解**: `config.json`

**テキスト**: 3. コンテナランタイムの階層

`runc spec` で、カレントディレクトリに `config.json` のひな形ができます。`runc run` は、この `config.json` と `rootfs/` のバンドルからコンテナを起動します。Docker の `~/.docker/config.json`(認証情報のファイル)とは別のものです。

### 問7 `LinuC3PS-3.0-007`

**正解**: `lxc-attach`、`lxc-attach -n c2`

**テキスト**: 2. LXC と LXD / Incus

`lxc-attach -n c2` で、c2 の中にシェルを開きます。`lxc-console` は、コンテナの tty につなぐ道具なので、ログインが要ります。LXD の `lxc exec c1 -- bash` とは別の道具です。

### 問8 `LinuC3PS-3.0-008`

**正解**: A

**テキスト**: 3. コンテナランタイムの階層

低レベルランタイムです。コンテナを作って起動すると、自分は終了します。流れは `docker` CLI から `dockerd`、`containerd`、`containerd-shim`、`runc`、コンテナのプロセスです。shim はコンテナの親として残り、runc は起動したら終了します。

- B. REST API を受けて、イメージやネットワークを管理します。プロセスを起動するのは、その下の部品です。
- C. 高レベルランタイムです。コンテナの管理をしますが、namespace の設定は runc に任せます。
- D. ユーザーの入力をデーモンに送るだけのクライアントです。

### 問9 `LinuC3PS-3.0-009`

**正解**: D

**テキスト**: 5. 低レベルランタイム

ユーザー空間の Sentry がシステムコールを処理します。gVisor の既定のプラットフォーム(systrap)は仮想化支援を使いません。KVM のプラットフォームを選ぶと必要になります。gVisor は性能が下がる場面があります(システムコールが多い処理など)。隔離と性能の釣り合いで選びます。

- A. ホストのカーネルを共有する通常のコンテナです。システムコールはそのまま届きます。
- B. 軽い仮想マシンを作るので、仮想化支援が必要です。この条件では動かせません。
- C. runc と同じ通常のコンテナです。隔離の強さは変わりません。

### 問10 `LinuC3PS-3.0-010`

**正解**: C

**テキスト**: 4. 高レベルランタイム

containerd の設定ファイルです。ランタイムの登録もここに書きます。設定を変えたら、`systemctl restart containerd` で反映します。Kubernetes では、RuntimeClass で、どのランタイムを使うかを Pod ごとに選べます。

- A. Docker デーモンの設定です。Kubernetes が containerd を直接使うときは読まれません。
- B. CRI-O の設定ファイルです。
- D. kubelet が API サーバーにつなぐための kubeconfig です。ランタイムの登録は書きません。

### 問11 `LinuC3PS-3.0-011`

**正解**: B

**テキスト**: 5. 低レベルランタイム

OCI の規格のおかげで、低レベルランタイムを入れ替えても、同じイメージが動きます。crun は C で書かれていて、起動が速く、メモリが少なく済みます。runc は OCI の参照実装で、最も広く使われています。

- A. 逆です。runc が Go、crun が C です。
- C. crun は、Podman や CRI-O など、OCI のランタイムを呼べる道具から使えます。
- D. それは高レベルランタイム(containerd、CRI-O)の仕事です。

### 問12 `LinuC3PS-3.0-012`

**正解**: `-f`、`--follow`

**テキスト**: 1. 状態を調べるコマンド

`docker logs -f web` は、末尾のログを追い続けます(`tail -f` と同じ)。`--tail 100` で最後の 100 行から始め、`--since 10m` で 10 分前から、`-t` で時刻を付けます。止めるのは `Ctrl+C` です。

### 問13 `LinuC3PS-3.0-013`

**正解**: C

**テキスト**: 1. 状態を調べるコマンド

`docker inspect` の `-f`(`--format`)に Go のテンプレートを渡すと、JSON の中の項目だけを取り出せます。`docker inspect` は、コンテナ、イメージ、ネットワーク、ボリュームの詳しい情報を JSON で表示します。メモリ不足で終了したかは `{{.State.OOMKilled}}` で分かります。コンテナとイメージに同じ名前があるときは、`--type container` で種類を指定します。

- A. `docker info` はデーモン全体の情報で、コンテナの名前は渡せません。
- B. イメージの層と、層を作った命令を表示します。コンテナの終了コードは出ません。
- D. そのようなオプションはありません。

### 問14 `LinuC3PS-3.0-014`

**正解**: D

**テキスト**: 2. 掃除のコマンド(prune)

ビルドキャッシュだけを消します。`-a` で、使われていないものを全部消します。消す前に `docker system df` で、何がどれだけ使っているかを確かめます。確認の質問は `-f` で省けます。

- A. 止まったコンテナ、使われていないネットワーク、名前のないイメージも消します。コンテナを残す条件に合いません。
- B. 使われていないイメージを全部消します。イメージを残す条件に合いません。
- C. 止まったコンテナを消します。ビルドキャッシュは消えません。

### 問15 `LinuC3PS-3.0-015`

**正解**: C

**テキスト**: 2. 掃除のコマンド(prune)

オプションなしの `docker image prune` が消すのは、タグのない(`<none>`)イメージだけです。同じ名前のタグを付け直すと、古いイメージはタグを失って dangling になります。`docker image prune` は、そのようなものを掃除します。

- A. それは `-a` を付けたときです。オプションなしでは、そこまで消えません。
- B. それは `docker container prune` です。
- D. それは `docker builder prune` です。

### 問16 `LinuC3PS-3.0-016`

**正解**: B

**テキスト**: 3. ファイルのコピー: docker cp

`docker cp` は、止まっているコンテナでも使えます。コンテナの名前に続けて `:` とパスを書きます。`docker cp` は、コンテナ名を書いた側がコンテナの中です。コンテナを作り直すと、コピーしたファイルは消えるので、残したい設定はイメージかマウントに入れます。

- A. `docker exec` は、動いているコンテナにしか使えません。止まっているコンテナではエラーになります。
- C. 標準出力と標準エラー出力のログです。コンテナの中のファイルの内容ではありません。
- D. 向きが逆です。ホストからコンテナへのコピーになります。

### 問17 `LinuC3PS-3.0-017`

**正解**: D

**テキスト**: 4. ロギングドライバー

journald ドライバーは、`CONTAINER_NAME` などのフィールドを付けてログを送ります。`docker logs web2` でも読めます。デーモン全体の既定は `docker info --format '{{.LoggingDriver}}'` で確かめられます。

- A. `-u` は systemd のユニットを指定します。web2 というユニットはありません。
- B. json-file は別のロギングドライバーの名前で、journald のタグではありません。
- C. journald のログはファイルのパスでは絞れません。また、json-file のログのディレクトリはコンテナの ID の名前で、`web2` ではありません。

### 問18 `LinuC3PS-3.0-018`

**正解**: B

**テキスト**: 4. ロギングドライバー

json-file はローテーションしないのが既定です。上限を決めます。既存のコンテナは作ったときの設定のままなので、作り直します。コンテナごとに `--log-opt max-size=10m --log-opt max-file=3` で指定することもできます。

- A. 動いているコンテナのログは、prune では消えません。
- C. コンテナを再起動しても、ロギングの設定は変わりません。ログのファイルも残ります。
- D. 読む範囲を絞るだけで、ログのファイルは小さくなりません。

### 問19 `LinuC3PS-3.0-019`

**正解**: D

**テキスト**: 7. daemon.json

JSON では、最後の項目の後ろにカンマを付けられません。書き方を間違えると、デーモンは起動しません。`dockerd --validate --config-file /etc/docker/daemon.json` で、起動せずに書き方を確かめられます。原因は `journalctl -u docker` に出ます。

- A. `journald` は指定できるロギングドライバーです。
- B. デーモン全体の既定として `daemon.json` にも書けます。
- C. デーモンの設定は `/etc/docker/daemon.json` です。`config.json` は `docker login` などの CLI 側のファイルです。

### 問20 `LinuC3PS-3.0-020`

**正解**: D

**テキスト**: 5. Dockerfile の主な命令

ビルドのときだけ使う変数です。`docker build --build-arg APP_VERSION=1.2 .` で渡します。`ARG` の値も、`docker history` で見えることがあります。パスワードなどの秘密の値は、`ARG` にも `ENV` にも入れません。

- A. ビルド中にも、実行時のコンテナにも残ります。
- B. イメージにメタデータを付ける命令です。ビルドの変数としては使えません。
- C. ファイルや URL をイメージに入れる命令です。

### 問21 `LinuC3PS-3.0-021`

**正解**: D

**テキスト**: 5. Dockerfile の主な命令

`ENTRYPOINT` がコマンドで、`CMD` の既定の引数が `docker run` の引数に置き換わります。ENTRYPOINT を置き換えるのは `--entrypoint` です。このとき、`CMD` の既定の引数も使われません。

- A. `CMD` は、`docker run` に引数を書くと置き換わります。両方が付くことはありません。
- B. `ENTRYPOINT` は、置き換わらず、必ず実行されます。
- C. `docker run` に引数を書いたので、`CMD` の既定の引数は使われず、書いた引数が付きます。

### 問22 `LinuC3PS-3.0-022`

**正解**: B

**テキスト**: 5. Dockerfile の主な命令

`COPY` はファイルをそのまま入れます。展開はしません。動きが読みやすいので、URL の取得や自動展開が要らないときは `COPY` を使います。

- A. `ADD` は、ホストの tar のアーカイブを自動で展開して入れます。アーカイブのままにはなりません。
- C. `ARG` はビルドの変数を宣言する命令です。ファイルは入りません。
- D. `LABEL` はメタデータを付ける命令です。ファイルは入りません。

### 問23 `LinuC3PS-3.0-023`

**正解**: C

**テキスト**: 5. Dockerfile の主な命令

Docker 単体では、状態の表示と、`docker inspect` の履歴に残すだけです。HEALTHCHECK のオプションの既定は、間隔 30 秒、タイムアウト 30 秒、再試行 3 回です。unhealthy を使って動くのは、Compose の `depends_on` の `service_healthy` や、Kubernetes などです。

- A. Docker 単体では、unhealthy でも再起動しません。再起動の方針は、コンテナが終了したときだけ働きます。
- B. 状態が変わるだけで、停止も削除もしません。
- D. ネットワークの接続は変わりません。

### 問24 `LinuC3PS-3.0-024`

**正解**: `--password-stdin`

**テキスト**: 6. docker login と config.json

`echo "$TOKEN" | docker login -u ci-user --password-stdin registry.example.com` のように、標準入力から渡します。`-p` で引数に書くと、履歴とプロセス一覧に残ります。

### 問25 `LinuC3PS-3.0-025`

**正解**: B

**テキスト**: 6. docker login と config.json

OS のキーチェーンなどに認証情報を保存し、`config.json` には書かれなくなります。認証情報ヘルパーを使えない環境では、ファイルの権限を `600` にし、短い期間で切れるトークンを使います。保存先のディレクトリは `DOCKER_CONFIG` で変えられます。

- A. Base64 は、元に戻せる単なる符号化です。暗号ではありません。
- C. 履歴とプロセス一覧に残るので、むしろ危険です。
- D. 認証情報が漏れる原因になります。`chmod 600` にするのが正しい方向です。

### 問26 `LinuC3PS-3.0-026`

**正解**: A

**テキスト**: 8. compose.yml と docker compose

db が healthy になるまで、web の起動を待たせます。短い書き方の `depends_on` は、起動の順番だけを決めます(`service_started`)。アプリ側にも、接続の再試行を入れておくと、より堅牢です。

- B. 起動の順番の指定もなくなるので、状況は良くなりません。
- C. db の再起動の方針で、web が待つ条件にはなりません。
- D. ホストへの公開です。コンテナ同士の接続の待ち合わせとは関係ありません。

### 問27 `LinuC3PS-3.0-027`

**正解**: D

**テキスト**: 8. compose.yml と docker compose

`expose` は、使うポートを書いておく指定で、情報としての意味が強いものです。ホストのポートには公開されません。同じネットワークなら、`ports` や `expose` がなくても `db:5432` で接続できます。なお、Linux のホスト自身は、コンテナの IP アドレスを使えば接続できます。ほかのホストからは接続できません。ホストの自分だけに公開したいときは、`ports: ["127.0.0.1:5432:5432"]` と書きます。

- A. ホストの 5432 に公開されるので、ホストから接続できてしまいます。
- B. ホストのすべてのアドレスに公開されるので、条件に合いません。
- C. コンテナがホストのネットワークをそのまま使うので、隔離されません。

### 問28 `LinuC3PS-3.0-028`

**正解**: B

**テキスト**: 8. compose.yml と docker compose

同じ名前のとき、`environment` が `env_file` より優先されます。`env_file` を複数書いたときは、後ろに書いたファイルが優先されます。`compose.yml` の `${変数}` の展開に使う `.env` とは別のものです。

- A. `env_file` の値は、`environment` で上書きされます。
- C. 値が連結されることはありません。
- D. 同じ名前を両方に書いても、エラーにはなりません。

### 問29 `LinuC3PS-3.0-029`

**正解**: A、C

**テキスト**: 8. compose.yml と docker compose

データを残したいときは、`docker compose down` を使い、`-v` を付けません。止めるだけなら `docker compose stop` で、コンテナもネットワークも残ります。

- A. `down` は、コンテナを止めて削除します。
- C. `down` は、`up` で作った既定のネットワークも削除します。
- B. `down` では消えません。`-v` を付けたときだけ消えます。
- D. `down` では消えません。`--rmi` を付けたときだけ消えます。

### 問30 `LinuC3PS-3.0-030`

**正解**: `docker network connect app-net web`

**テキスト**: 1. 状態を調べるコマンド

`docker network connect ネットワーク コンテナ` で、動いているコンテナを後からネットワークにつなげます。外すのは `docker network disconnect` です。ネットワークは ID でも、コンテナはコンテナ ID でも指定できます。引数の順番(ネットワーク、コンテナ)を逆にすると失敗します。ユーザー定義の bridge では、コンテナ名で名前解決できます。

### 問31 `LinuC3PS-3.0-031`

**正解**: `docker volume inspect pgdata`、`docker inspect --type volume pgdata`、`docker inspect pgdata`、`docker volume inspect -f '{{.Mountpoint}}' pgdata`、`docker volume inspect --format '{{.Mountpoint}}' pgdata`、`docker volume inspect --format '{{ .Mountpoint }}' pgdata`

**テキスト**: 1. 状態を調べるコマンド

`docker volume inspect pgdata` の `Mountpoint` に、Linux では `/var/lib/docker/volumes/pgdata/_data` と出ます。ボリュームの一覧は `docker volume ls` です。

### 問32 `LinuC3PS-3.0-032`

**正解**: B

**テキスト**: 8. compose.yml と docker compose

`unless-stopped` は、手動で止めたコンテナを、デーモンの再起動後も起動しません。`always` は、手動で止めても、デーモンの再起動後に起動します。`on-failure` は、異常終了したときだけ再起動します。`no`(既定)は、再起動しません。

- A. `always` ならそうなります。`unless-stopped` は、手動で止めたものは起動しません。
- C. 回数の上限があるのは `on-failure:5` のような指定です。
- D. 再起動の方針は、コンテナを削除しません。

### 問33 `LinuC3PS-3.0-033`

**正解**: D

**テキスト**: 5. Dockerfile の主な命令

`RUN` ごとに新しいシェルが、作業ディレクトリから始まります。作業ディレクトリを変えるには `WORKDIR /app` を使います。なければ作られ、以降の命令に引き継がれます。

- A. `cd` の効果は、その `RUN` の中だけです。次の `RUN` には引き継がれません。
- B. 作業ディレクトリは `/` です。ホームディレクトリではありません。
- C. そのようなディレクトリには移動していません。

### 問34 `LinuC3PS-3.0-034`

**正解**: A

**テキスト**: 1. 状態を調べるコマンド

層ごとに、作った命令(CREATED BY)とサイズを表示します。`--no-trunc` で命令を省略せずに表示します。RUN で入れたパッケージのキャッシュが大きいときは、同じ `RUN` の中で消す、またはマルチステージビルドを使います。

- B. デーモン全体の情報で、イメージの層は出ません。
- C. コンテナの出力を読むコマンドで、イメージには使えません。
- D. ネットワークの一覧で、イメージとは関係がありません。
