# LinuC201 問題 2.06 コンテナ

対象: LinuC レベル2 201試験 / 全20問 / すべてオリジナル問題
対応テキスト: `LinuC201_2.06_コンテナ.md`
解答・解説は末尾。

## 問題

### 2.06.1 コンテナの仕組み

**問1** `LinuC201-2.06-001` Docker の標準のランタイム(runc)で動く Linux のコンテナと、仮想マシンの違いについて、正しいものはどれか。

- A. コンテナは、コンテナごとに専用のゲスト OS(カーネル)を起動する
- B. コンテナはホストのカーネルを共有し、仮想マシンは仮想マシンごとにゲスト OS のカーネルを持つ
- C. 仮想マシンはホストのカーネルを共有し、コンテナはコンテナごとにカーネルを持つ
- D. コンテナも仮想マシンも、ホストのカーネルを共有する

**問2** `LinuC201-2.06-002` プロセスごとに、見えるもの(プロセスの番号、ネットワーク、ホスト名など)を分けるカーネルの機能で、コンテナの分離の土台になるものはどれか。

- A. 名前空間(namespace)
- B. cgroups
- C. SELinux
- D. chroot

**問3** `LinuC201-2.06-003` プロセスが使える CPU の時間やメモリの量を制限する、Linux カーネルの機能の名前を答えよ。Docker の `--memory` や `--cpus` の指定は、この機能で実現される。

**問4** `LinuC201-2.06-004` コンテナのイメージとファイルシステムについて、正しいものを**2つ**選べ。

- A. イメージは、読み取り専用のレイヤーを重ねてできている
- B. コンテナでファイルを書き換えると、イメージのレイヤーが直接書き換わる
- C. 同じイメージから作ったコンテナは、読み取り専用のレイヤーを共有する
- D. コンテナを削除しても、コンテナの書き込める層に書いた内容は自動で残る

**問5** `LinuC201-2.06-005` コンテナごとに、別々の IP アドレスとポート番号の空間を持たせる名前空間はどれか。

- A. `pid`
- B. `mnt`
- C. `ipc`
- D. `net`

**問6** `LinuC201-2.06-006` cgroups の v2 が使われているホストで、`stat -fc %T /sys/fs/cgroup` を実行した。表示される文字列はどれか。

- A. `tmpfs`
- B. `overlay`
- C. `cgroup2fs`
- D. `ext4`

### 2.06.2 Docker コンテナとコンテナイメージの管理

**問7** `LinuC201-2.06-007` 動いているコンテナ `web` に、停止の猶予の時間を待たずに、すぐ SIGKILL を送って止めたい。使うコマンドはどれか。

- A. `docker stop web`
- B. `docker restart web`
- C. `docker kill web`
- D. `docker pause web`

**問8** `LinuC201-2.06-008` イメージや `docker run` で停止の信号と待ち時間を変えていない Linux のコンテナがある。このコンテナに対する `docker stop` について、正しいものを**2つ**選べ。

- A. 最初から SIGKILL を送って、すぐに止める
- B. 最初に SIGTERM を送って、プロセスに終了の準備をさせる
- C. コンテナも、一緒に削除する
- D. 既定の 10 秒待っても終了しなければ、SIGKILL を送る

**問9** `LinuC201-2.06-009` 動いているコンテナ `web` の中で、対話的にシェル(`sh`)を起動するコマンドを答えよ。

**問10** `LinuC201-2.06-010` 止まっているコンテナ `old` を削除するコマンドはどれか(イメージは削除しない)。

- A. `docker rmi old`
- B. `docker rm old`
- C. `docker stop old`
- D. `docker kill old`

**問11** `LinuC201-2.06-011` 動いているコンテナだけでなく、止まっているコンテナも含めて一覧を表示するコマンドを答えよ。

**問12** `LinuC201-2.06-012` ホストの 8080 番ポートに来た通信を、コンテナの 80 番ポートに転送して nginx を公開する。`docker run -d` に付けるポートの指定はどれか。

- A. `-p 80`
- B. `-p 80:8080`
- C. `-p 8080`
- D. `-p 8080:80`

**問13** `LinuC201-2.06-013` 動いているコンテナ `batch` のプロセスを、メモリの内容を残したまま一時停止するコマンドはどれか。

- A. `docker pause batch`
- B. `docker stop batch`
- C. `docker rm batch`
- D. `docker kill batch`

**問14** `LinuC201-2.06-014` 動いているコンテナ `web` の中で、新しいプロセスとして `ls /` を 1 回だけ実行して結果を見たい。正しいコマンドはどれか。

- A. `docker attach web`
- B. `docker exec web ls /`
- C. `docker run web ls /`
- D. `docker create web ls /`

**問15** `LinuC201-2.06-015` カレントディレクトリの `Dockerfile` から、`myapp:1.0` という名前とタグのイメージを作る。コマンドを、最後のカレントディレクトリの指定まで答えよ。

**問16** `LinuC201-2.06-016` コンテナ `web` の中で手作業で設定を変えた。その状態から、新しいイメージ `web:v2` を作るコマンドはどれか。

- A. `docker import web web:v2`
- B. `docker build web:v2`
- C. `docker commit web web:v2`
- D. `docker rmi web web:v2`

**問17** `LinuC201-2.06-017` `docker export` で作った、コンテナのファイルシステムだけを含む tar のファイル `app.tar` がある。ここから、新しいイメージ `myapp:1.0` を作るコマンドはどれか。

- A. `docker load -i app.tar`
- B. `docker pull app.tar`
- C. `docker commit app.tar myapp:1.0`
- D. `docker import app.tar myapp:1.0`

**問18** `LinuC201-2.06-018` コンテナは作らず、Docker Hub からイメージ `nginx:1.27` を取得するだけのコマンドはどれか。

- A. `docker run nginx:1.27`
- B. `docker create nginx:1.27`
- C. `docker pull nginx:1.27`
- D. `docker import nginx:1.27`

**問19** `LinuC201-2.06-019` `docker images` の一覧に出ている、もう使わないイメージ `nginx:1.27` を、ローカルから削除したい。コマンドはどれか。

- A. `docker rmi nginx:1.27`
- B. `docker rm nginx:1.27`
- C. `docker pull nginx:1.27`
- D. `docker stop nginx:1.27`

**問20** `LinuC201-2.06-020` 動いているコンテナごとの CPU、メモリ、ネットワークの使用量を、リアルタイムで表示するコマンドはどれか。

- A. `docker ps`
- B. `docker logs`
- C. `docker inspect`
- D. `docker stats`

## 解答・解説

### 問1 `LinuC201-2.06-001`

**正解**: B

コンテナは、ホストのカーネルの上で動く、分離されたプロセスです。仮想マシンは、ハイパーバイザーの上で、仮想マシンごとにゲスト OS(カーネル)を起動します。このため、コンテナのほうが軽くて速く起動します。なお、Kata Containers のように、コンテナごとに軽い VM を起動するランタイムもあります。この問題は、標準の runc の場合を問うています。

- A. コンテナは、ゲスト OS のカーネルを持ちません。
- C. 仮想マシンとコンテナの説明が逆です。
- D. 仮想マシンは、ゲスト OS 自身のカーネルを持ちます。ホストのカーネルは共有しません。

### 問2 `LinuC201-2.06-002`

**正解**: A

名前空間は、プロセスから見えるものを分けます。PID、ネットワーク、マウント、ホスト名などの種類があります。コンテナの中のプロセスは、自分だけの世界が見えます。

- B. cgroups は、使える資源の量を制限する機能です。見えるものは分けません。
- C. SELinux は、プロセスのアクセスを制限する仕組みです。見えるものを分ける機能ではありません。
- D. chroot は、ルートディレクトリを変えるだけです。プロセスの番号やネットワークは分けません。

### 問3 `LinuC201-2.06-003`

**正解**: `cgroups`、`cgroup`、`control groups`、`control group`、`コントロールグループ`

cgroups(コントロールグループ)は、プロセスをグループにまとめ、CPU、メモリ、プロセスの数、ディスクの I/O を制限したり、集計したりします。メモリの上限を超えると、カーネルが OOM killer でプロセスを強制終了することがあります。

### 問4 `LinuC201-2.06-004`

**正解**: A、C

イメージは、読み取り専用のレイヤーを重ねたものです。コンテナを起動すると、その上に書き込める層が 1 つ加わります。同じイメージから作ったコンテナは、読み取り専用のレイヤーを共有するので、ディスクを節約できます。

- B. 書き込みは、コンテナ専用の書き込める層に入ります。イメージのレイヤーは変わりません。
- D. コンテナの書き込める層は、コンテナを削除すると一緒に消えます。残したいデータは、ボリュームなど、コンテナの外に置きます。

### 問5 `LinuC201-2.06-005`

**正解**: D

`net` の名前空間は、ネットワークの機器、IP アドレス、ポート番号、経路の表を分けます。このため、別のコンテナで、同じポート番号を使えます。

- A. `pid` は、プロセスの番号を分けます。
- B. `mnt` は、マウントの一覧(ファイルシステムの見え方)を分けます。
- C. `ipc` は、共有メモリなど、プロセス間の通信の手段を分けます。

### 問6 `LinuC201-2.06-006`

**正解**: C

cgroups の v2 では、`/sys/fs/cgroup` に、`cgroup2` のファイルシステムがマウントされ、`cgroup2fs` と表示されます。AlmaLinux / RHEL 9 や Ubuntu 24.04 では、v2 が既定です。

- A. `tmpfs` は、v1 のときに表示される文字列です。
- B. `overlay` は、コンテナのレイヤーを重ねるときのファイルシステムです。cgroups とは関係ありません。
- D. `ext4` は、一般的なディスクのファイルシステムです。

### 問7 `LinuC201-2.06-007`

**正解**: C

`docker kill` は、既定で SIGKILL を、すぐ送ります。プロセスは、後始末をせずに終了させられます。

- A. `docker stop` は、先に停止の信号(既定は SIGTERM)を送り、10 秒(既定)待ってから SIGKILL を送ります。
- B. `docker restart` は、止めてから起動し直します。止めるときは、`stop` と同じ手順です。
- D. `docker pause` は、プロセスを一時停止するだけです。終了はしません。

### 問8 `LinuC201-2.06-008`

**正解**: B、D

`docker stop` は、プロセスに SIGTERM を送って、終了の準備(ファイルの書き出しなど)をする時間を与えます。既定の 10 秒(`-t` で変更)待っても終わらないときは、SIGKILL を送って強制的に止めます。最初に送る信号は、Dockerfile の `STOPSIGNAL` や、`docker run` の `--stop-signal` で変えられます。

- A. 最初から SIGKILL を送るのは、`docker kill` です。
- C. 止めるだけで、削除はしません。削除するのは `docker rm` です。

### 問9 `LinuC201-2.06-009`

**正解**: `docker exec -it web sh`、`docker exec -ti web sh`、`docker exec -i -t web sh`、`docker exec -t -i web sh`、`docker exec -it web /bin/sh`、`docker exec -ti web /bin/sh`、`docker exec -i -t web /bin/sh`、`docker exec --interactive --tty web sh`、`docker exec --tty --interactive web sh`、`docker exec --interactive --tty web /bin/sh`、`docker container exec -it web sh`

`docker exec` は、動いているコンテナの中で、新しいプロセスとしてコマンドを実行します。`-i` は標準入力を開けておくこと、`-t` は端末を割り当てることです。シェルを使うときは、`-it` を付けます。

### 問10 `LinuC201-2.06-010`

**正解**: B

`docker rm` は、止まっているコンテナを削除します。動いているものは、`-f` を付けると、止めてから削除します。

- A. `docker rmi` は、イメージを削除するコマンドです。コンテナは削除しません。
- C. `docker stop` は、動いているコンテナを止めます。すでに止まっているコンテナは削除できません。
- D. `docker kill` は、動いているコンテナに SIGKILL を送ります。削除はしません。

### 問11 `LinuC201-2.06-011`

**正解**: `docker ps -a`、`docker ps --all`、`docker container ls -a`、`docker container ls --all`、`docker container list -a`、`docker container list --all`、`docker container ps -a`、`docker container ps --all`

`docker ps` は、動いているコンテナだけを表示します。`-a`(`--all`)を付けると、止まっているものも表示します。

### 問12 `LinuC201-2.06-012`

**正解**: D

`-p ホストのポート:コンテナのポート` の順に書きます。`-p 8080:80` は、ホストの 8080 に来た通信を、コンテナの 80 に転送します。

- A. `-p 80` は、コンテナの 80 を、ホストの空いているポート(ランダム)に割り当てます。8080 に固定されません。
- B. `-p 80:8080` は、順番が逆です。ホストの 80 を、コンテナの 8080 に転送します。
- C. `-p 8080` は、コンテナの 8080 を、ホストの空いているポート(ランダム)に割り当てます。

### 問13 `LinuC201-2.06-013`

**正解**: A

`docker pause` は、cgroups の freezer の機能で、コンテナのプロセスを一時停止します。メモリの内容は残り、`docker unpause` で再開できます。

- B. `docker stop` は、プロセスを終了させます。メモリの内容は残りません。
- C. `docker rm` は、コンテナを削除します。
- D. `docker kill` は、プロセスに SIGKILL を送って終了させます。

### 問14 `LinuC201-2.06-014`

**正解**: B

`docker exec` は、動いているコンテナの中で、新しいプロセスとしてコマンドを実行します。

- A. `docker attach` は、コンテナの最初のプロセス(PID 1)の標準入出力につなぎます。新しいコマンドは実行できません。
- C. `docker run web ls /` は、`web` をイメージの名前として、新しいコンテナを作って実行します。動いているコンテナの中ではありません。
- D. `docker create` は、新しいコンテナを作るだけで、コマンドは実行しません。

### 問15 `LinuC201-2.06-015`

**正解**: `docker build -t myapp:1.0 .`、`docker build --tag myapp:1.0 .`、`docker build --tag=myapp:1.0 .`、`docker build . -t myapp:1.0`、`docker image build -t myapp:1.0 .`、`docker image build --tag myapp:1.0 .`、`docker buildx build -t myapp:1.0 .`、`docker builder build -t myapp:1.0 .`

`docker build` は、Dockerfile を読んで、命令ごとにレイヤーを作り、イメージにします。`-t` で名前とタグを付けます。最後の `.` は、ファイルを渡すディレクトリ(ビルドコンテキスト)で、ここでは、カレントディレクトリです。Docker 29 では、`docker build` は `docker buildx build` の別名で、`docker image build` や `docker builder build` でも同じ動きになります。

### 問16 `LinuC201-2.06-016`

**正解**: C

`docker commit コンテナ イメージ名` は、コンテナの今の状態を、新しいイメージにします。ただし、手作業の変更が記録に残らず、作り直せません。ふつうは、Dockerfile を書いて `docker build` します。

- A. `docker import` は、tar のファイルからイメージを作ります。コンテナの名前は渡せません。
- B. `docker build` は、Dockerfile からイメージを作ります。コンテナの状態は使いません。
- D. `docker rmi` は、イメージを削除するコマンドです。

### 問17 `LinuC201-2.06-017`

**正解**: D

`docker import` は、tar のファイル(ファイルシステムの中身)から、1 つのレイヤーのイメージを作ります。`docker export` の反対の操作です。

- A. `docker load` は、`docker save` で作った tar(レイヤーやタグの情報を持つ)を読み込みます。ファイルシステムだけの tar は読み込めません。
- B. `docker pull` は、レジストリからイメージを取ってきます。ローカルのファイルは扱いません。
- C. `docker commit` は、コンテナからイメージを作ります。tar のファイルは渡せません。

### 問18 `LinuC201-2.06-018`

**正解**: C

`docker pull` は、レジストリ(既定は Docker Hub)からイメージを取ってくるだけです。コンテナは作りません。

- A. `docker run` は、イメージがなければ取ってきて、コンテナを作って起動します。
- B. `docker create` は、イメージがなければ取ってきて、コンテナを作ります(起動はしません)。イメージだけを取得するコマンドではありません。
- D. `docker import` は、tar のファイルからイメージを作ります。レジストリからは取ってきません。

### 問19 `LinuC201-2.06-019`

**正解**: A

`docker rmi` は、ローカルのイメージを削除します。そのイメージから作ったコンテナが残っていると、消せません(先にコンテナを `docker rm` します)。

- B. `docker rm` は、コンテナを削除します。イメージは削除しません。
- C. `docker pull` は、イメージを取ってくるコマンドです。
- D. `docker stop` は、動いているコンテナを止めます。イメージには関係しません。

### 問20 `LinuC201-2.06-020`

**正解**: D

`docker stats` は、動いているコンテナごとの CPU、メモリ、ネットワーク、ディスクの使用量を、リアルタイムで表示します。`--no-stream` を付けると、1 回だけ表示します。

- A. `docker ps` は、コンテナの一覧です。使用量は表示しません。
- B. `docker logs` は、コンテナの出力(ログ)を表示します。
- C. `docker inspect` は、コンテナやイメージの詳しい設定を JSON で表示します。使用量を、リアルタイムでは表示しません。
