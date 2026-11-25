# LinuC 201 テキスト 2.06 コンテナ

コンテナがどんな仕組みで動くか(名前空間と cgroups)と、Docker の基本のコマンドを学びます。Docker を詳しく学ぶときは、Docker のテキストも読んでください。ここでは、LinuC 201 に出る範囲に絞ります。

## 2.06.1 コンテナの仕組み (重要度2)

### 1. 物理マシン、仮想マシン、コンテナ

| | 物理マシン | 仮想マシン(VM) | コンテナ |
|---|---|---|---|
| 分けるもの | なし | ハードウェア | OS の中のプロセス |
| OS(カーネル) | 1 つ | VM ごとにゲスト OS を持つ | ホストのカーネルを共有する |
| 起動の速さ | 遅い | 分単位 | 秒以下 |
| 大きさ | ― | GB 単位 | MB 単位 |
| 分離の強さ | 強い | 強い | VM より弱い |

コンテナは、ゲスト OS を持たないので、軽くて速いです。そのかわり、カーネルを共有するので、ホストと違う OS(Linux のホストで Windows)は動かせません。

```text
Virtual machine
  [App]   [App]
  [Guest OS]  [Guest OS]
  [Hypervisor]
  [Hardware]

Container
  [App]   [App]       <- ホストのカーネルの上で動く、分離されたプロセス
  [Container engine (Docker)]
  [Host OS (kernel)]
  [Hardware]
```

### 2. コンテナを支える Linux の機能

コンテナは、特別な仮想化ではなく、Linux カーネルの機能を組み合わせた、**分離されたプロセス**です。

| 機能 | 役割 |
|---|---|
| **名前空間**(namespace) | プロセスから**見えるもの**を分ける |
| **cgroups**(コントロールグループ) | プロセスが**使える資源の量**を制限する |

### 3. 名前空間(namespace)

名前空間ごとに、別々の世界が見えます。

| 種類 | 分けるもの | コンテナの中での見え方 |
|---|---|---|
| `pid` | プロセスの番号 | 最初のプロセスが PID 1 になる。ホストのプロセスは見えない |
| `net` | ネットワークの機器、IP アドレス、ポート | コンテナ専用の NIC と IP アドレスを持つ |
| `mnt` | マウントの一覧(ファイルシステム) | コンテナ専用のルートディレクトリ |
| `uts` | ホスト名 | コンテナごとのホスト名を持てる |
| `ipc` | プロセス間の通信(共有メモリなど) | コンテナの外とは共有しない |
| `user` | ユーザーとグループの ID | コンテナの中の root を、ホストの一般ユーザーに対応させられる |
| `cgroup` | cgroups の見え方 | コンテナ専用の見え方 |

```bash
ls -l /proc/$$/ns                         # いまのシェルが属する名前空間(inode の番号で区別される)
lsns                                      # 名前空間の一覧
sudo unshare --uts --fork bash            # 新しい uts 名前空間でシェルを起動する
hostname demo                             # この中でホスト名を変えても、ホストには影響しない
sudo nsenter --target 1234 --net ip addr  # PID 1234 のプロセスの net 名前空間に入って実行する
```

### 4. cgroups

**cgroups** は、プロセスをグループにまとめ、グループごとに資源を制限、集計する仕組みです。

| 制御するもの | 内容 |
|---|---|
| CPU | 使える CPU の時間の割合 |
| メモリ | 上限。超えると、カーネルが OOM killer でプロセスを強制終了することがある |
| プロセスの数 | 増えすぎるのを防ぐ |
| ディスクの I/O | 読み書きの速さ |

- cgroups には、v1(資源ごとに別の階層)と v2(1 つの階層にまとめたもの)があります。AlmaLinux / RHEL 9 と Ubuntu 24.04、Debian 12 は、v2 が既定です。
- v2 は、`/sys/fs/cgroup/` にあります。`stat -fc %T /sys/fs/cgroup` が `cgroup2fs` なら v2 です。
- Docker では、`docker run --memory 256m --cpus 0.5 --pids-limit 100 …` で指定します。

```text
docker run --memory 256m ...
  |
  v
[Docker] puts the container's processes into a cgroup, memory.max = 256 MiB
  |
  v
[kernel] kills the process when it tries to exceed the limit (OOM killer)
```

名前空間は「見えるものを分ける」、cgroups は「使える量を制限する」と覚えます。

### 5. イメージとコンテナのファイルシステム

- **イメージ**は、コンテナを作る元になる、読み取り専用のひな形です。アプリ、ライブラリ、設定を含みます。
- イメージは、複数の**レイヤー**(層)を重ねてできています。各レイヤーは、前のレイヤーとの差分です。
- コンテナを起動すると、イメージのレイヤーの上に、書き込める層が 1 つ作られます。コンテナの中の変更は、この層に入ります。
- 重ねて 1 つのファイルシステムに見せる仕組みを、**ユニオンファイルシステム**と呼びます。Docker の既定は **overlay2**(OverlayFS)です。
- 読み取り専用のレイヤーのファイルを変更すると、書き込める層にコピーされてから変わります(コピーオンライト)。

```text
Container
  [writable layer]        <- コンテナを消すと、この層の変更は消える
  [layer 3  COPY app]  --+
  [layer 2  RUN apt]     +-- read-only image layers (shared by containers of the same image)
  [layer 1  base OS]   --+
```

- 同じイメージから作ったコンテナは、読み取り専用のレイヤーを共有するので、ディスクを節約できます。
- 消えては困るデータは、ボリュームなど、コンテナの外に置きます。
- Docker は、レイヤーを `/var/lib/docker/overlay2/` に置きます(root で動かした場合)。

## 2.06.2 Docker コンテナとコンテナイメージの管理 (重要度3)

### 1. Docker を入れる

| ディストリビューション | 方法 |
|---|---|
| Ubuntu、Debian | ディストリビューションの `docker.io` パッケージ、または Docker 社のリポジトリの `docker-ce` |
| AlmaLinux、RHEL 9 | Docker 社のリポジトリの `docker-ce`(RHEL の標準は、Docker ではなく Podman) |

```bash
sudo apt install docker.io               # Ubuntu / Debian の例
sudo systemctl enable --now docker       # サービスを起動し、自動起動にする
sudo docker run hello-world              # 動作の確認
sudo usermod -aG docker ユーザー名        # sudo なしで使えるようにする(次のログインから有効)
```

- `docker` グループに入れると、そのユーザーは事実上 root と同じ力を持ちます。注意して使います。

### 2. コンテナのネットワークとポート

Docker は、インストールすると、ホストの中に仮想のブリッジ `docker0` を作ります(既定のアドレスは `172.17.0.0/16`)。コンテナは、このブリッジにつながり、ホストの外へは NAT で出ます。

外から、コンテナの中のサービスに届かせるには、**ポートの割り当て**(ポート転送)をします。`-p ホストのポート:コンテナのポート` の形です。

```bash
docker run -d --name web -p 8080:80 nginx      # ホストの 8080 に来た通信を、コンテナの 80 に転送する
docker run -d -p 127.0.0.1:8080:80 nginx       # ホストの自分自身(127.0.0.1)の 8080 だけに公開する
docker port web                                # 割り当ての一覧
```

```text
[client]
  |
  |  http://<host IP>:8080/
  v
[host:8080]
  |
  |  NAT (port forwarding)
  v
[docker0] --- [container 172.17.0.2:80]
```

- コンテナを、ホストと同じネットワーク(フラットな L2 のネットワーク)につなぐときは、**macvlan** のネットワークを使います。コンテナが、ホストの LAN の中の別の機器のように、専用のアドレスを持てます。

```bash
docker network create -d macvlan --subnet 192.168.1.0/24 --gateway 192.168.1.1 -o parent=eth0 lan
docker run -d --network lan --ip 192.168.1.50 nginx
```

- `--network host` は、コンテナがホストのネットワークをそのまま使います。ポートの割り当てはできません(いらなくなります)。

### 3. コンテナの状態と、動かすコマンド

```text
docker create       docker start
  (none) ---------> created ---------> running <-----> paused
                                         |    docker pause / docker unpause
                                         |
                                         |  docker stop (SIGTERM, then SIGKILL)
                                         |  docker kill (SIGKILL)
                                         v
                                       exited ---- docker rm ---> (gone)
```

| コマンド | 動き |
|---|---|
| `docker run イメージ` | イメージがなければ取ってきて、コンテナを作って起動する(`create` と `start` を続けて行う) |
| `docker create イメージ` | コンテナを作るだけで、起動しない |
| `docker start コンテナ` | 止まっているコンテナを起動する |
| `docker restart コンテナ` | 止めてから、起動し直す |
| `docker pause コンテナ` | コンテナのプロセスを一時停止する(cgroups の freezer を使う)。メモリは残る |
| `docker unpause コンテナ` | 一時停止を解く |
| `docker stop コンテナ` | プロセスに SIGTERM を送り、10 秒(`-t` で変えられる)待っても終わらなければ SIGKILL を送る |
| `docker kill コンテナ` | すぐに SIGKILL を送る。`-s` で別の信号も送れる |
| `docker rm コンテナ` | 止まっているコンテナを消す。動いているものは、`-f` を付けると消せる |

`docker run` の主なオプションです。

| オプション | 意味 |
|---|---|
| `-d` | バックグラウンドで動かす |
| `-it` | 端末をつなぐ(`-i` は標準入力を開けておく、`-t` は端末を割り当てる)。シェルを使うときに付ける |
| `--name` | コンテナの名前 |
| `--rm` | 終わったら、コンテナを自動で消す |
| `-p` | ポートの割り当て |
| `-e` | 環境変数 |
| `--memory`、`--cpus` | 資源の上限(cgroups) |

### 4. 状態を見る

| コマンド | 動き |
|---|---|
| `docker ps` | 動いているコンテナの一覧 |
| `docker ps -a` | 止まっているものも含めた一覧 |
| `docker stats` | コンテナごとの CPU、メモリ、ネットワーク、ディスクの使用量を、リアルタイムで表示する(`--no-stream` で 1 回だけ) |
| `docker logs コンテナ` | コンテナの出力(ログ)を表示する |

### 5. 動いているコンテナに入る

| コマンド | 動き |
|---|---|
| `docker attach コンテナ` | コンテナの**最初のプロセス**(PID 1)の標準入出力につなぐ。新しいプロセスは作らない |
| `docker exec コンテナ コマンド` | 動いているコンテナの中で、**新しいプロセス**としてコマンドを実行する |

```bash
docker exec -it web sh              # コンテナの中でシェルを開く
docker exec web cat /etc/os-release # 1 つだけ実行して戻る
docker attach web                   # PID 1 の画面につなぐ
```

- `docker exec -it コンテナ sh` で開いたシェルを `exit` で終えても、コンテナは止まりません。
- `docker attach` では、`Ctrl+C` を押すと PID 1 に信号が届いて、コンテナが止まることがあります。抜けるときは、`Ctrl+P`、`Ctrl+Q` の順に押します(コンテナは動いたまま)。

### 6. イメージを管理する

| コマンド | 動き |
|---|---|
| `docker images`(`docker image ls`) | ローカルにあるイメージの一覧 |
| `docker pull イメージ:タグ` | レジストリ(既定は Docker Hub)からイメージを取ってくる |
| `docker rmi イメージ` | ローカルのイメージを消す。使っているコンテナがあると消せない |
| `docker import ファイル.tar イメージ名` | tar のファイル(ファイルシステムの中身)から、新しいイメージを作る |
| `docker export コンテナ > ファイル.tar` | コンテナのファイルシステムを tar にする(`import` の反対) |
| `docker save イメージ -o ファイル.tar` | イメージを、レイヤーとタグごと tar にする |
| `docker load -i ファイル.tar` | `save` で作った tar からイメージを読み込む |
| `docker build -t 名前:タグ .` | Dockerfile からイメージを作る |
| `docker commit コンテナ イメージ名` | 動かしたコンテナの現在の状態を、新しいイメージにする |
| `docker push イメージ` | レジストリにイメージを送る(先に `docker login`) |

- **Dockerfile** は、イメージの作り方を書いたファイルです。`docker build` が読んで、命令ごとにレイヤーを作ります。
- `docker commit` は、手作業で変えた内容が記録に残らず、作り直せません。ふつうは、Dockerfile を書いて `docker build` します。
- `import` は、レイヤーの履歴を持たない 1 つのレイヤーのイメージを作ります。`save` と `load` は、履歴とタグを保ちます。

```dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y --no-install-recommends nginx
COPY index.html /var/www/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t mynginx:1.0 .           # 最後の . は、ファイルを渡すディレクトリ(ビルドコンテキスト)
docker run -d -p 8080:80 mynginx:1.0
```

```text
Dockerfile --docker build--> image --docker run--> container --docker commit--> image
                               ^
                               |
              registry --docker pull / docker push--+
```

- `docker rmi` が消すのはイメージで、`docker rm` が消すのはコンテナです。間違えやすいので、気をつけます。
