# 用語集 コンテナと Kubernetes

## コンテナの仕組み

### コンテナ
試験: Docker、K8s
要約: アプリと必要なものをまとめ、ほかと分けた環境で動かす仕組みです。
アプリと、その動作に必要なライブラリや設定をまとめ、ほかから分離して動かす仕組みです。ホストのカーネルを共有するので、仮想マシンより軽く、すぐに起動します。
例: `docker run -d -p 8080:80 nginx:1.27`
注意: ホストのカーネルを共有するので、VM より軽い代わりに分離は弱いです。
関連: イメージ、namespace、cgroups、仮想マシン

### namespace
別名: 名前空間(Linux)
試験: Docker
要約: プロセスから見える範囲(PID、ネットワーク、マウントなど)を分けるカーネルの機能です。
Linux のカーネルの機能で、プロセスごとに見えるもの(プロセスの一覧、ネットワーク、ファイルシステム、ホスト名)を分けます。コンテナの分離の土台です。Kubernetes の Namespace とは別のものです。
例: PID、NET、MNT、UTS、IPC、USER の namespace、`lsns`
注意: Kubernetes の Namespace(リソースの区切り)とは別のものです。
関連: コンテナ、cgroups

### cgroups
別名: コントロールグループ
試験: Docker、K8s
要約: プロセスが使える CPU やメモリの量を制限するカーネルの機能です。
Linux のカーネルの機能で、プロセスが使える CPU やメモリの量を制限します。コンテナの資源の上限は、これで実現されています。
例: `docker run --memory 512m --cpus 1`、Kubernetes の limits
注意: メモリの上限を超えると、カーネルの OOM killer がプロセスを強制終了します。
関連: コンテナ、namespace、limits

### OCI
別名: Open Container Initiative
試験: Docker
要約: コンテナのイメージと実行の形式を決めた、業界の標準です。
コンテナのイメージの形式と、ランタイムの標準を決めている団体と規格です。この規格のおかげで、Docker で作ったイメージを Kubernetes や Podman でも使えます。
例: OCI イメージ、OCI ランタイム(runc)
注意: 標準があるので、Docker で作ったイメージを containerd や Podman でも動かせます。
関連: イメージ

### containerd
別名: runc
試験: Docker、K8s
要約: コンテナを動かす、業界標準のランタイムです。
コンテナを実際に動かすランタイムです。containerd がイメージとコンテナの管理をし、runc が namespace と cgroups を設定してプロセスを起動します。Kubernetes は CRI を通して containerd を使います。
例: Docker の裏側、Kubernetes の CRI のランタイム、`crictl ps`
注意: Kubernetes は Docker を通さず、containerd を直接使います(dockershim は v1.24 で削除)。
関連: CRI、Docker デーモン

### rootless モード
別名: rootless
試験: Docker
要約: root ではないユーザーで、Docker のデーモンとコンテナを動かす形です。
Docker デーモンを root 以外のユーザーで動かす方式です。コンテナから抜け出されても、ホストの root を取られません。
例: `dockerd-rootless-setuptool.sh install`、Podman は既定で rootless
注意: 1024 未満のポートでの待ち受けなど、一部の機能に制限があります。
関連: root、Docker デーモン

### OverlayFS
別名: overlay2、ユニオンファイルシステム
試験: LinuC201、Docker
要約: 複数の層を重ねて、1 つのファイルシステムに見せる仕組みです。
読み取り専用の下の層(イメージのレイヤー)と、書き込める上の層を重ねます。Docker の既定の保存の方式(ストレージドライバー)は overlay2 です。下の層のファイルを変えると、上の層にコピーされてから変わります(コピーオンライト)。
例: `docker info | grep -i 'storage driver'`、`/var/lib/docker/overlay2/`
注意: コンテナを消すと、上の書き込める層の変更も消えます。
関連: レイヤー、イメージ、コンテナ

### nsenter
別名: unshare、lsns
試験: LinuC201
要約: 名前空間を調べたり、入ったり、新しく作ったりするコマンドです。
`lsns` は名前空間の一覧、`nsenter` は動いているプロセスの名前空間に入って実行、`unshare` は新しい名前空間でプログラムを起動します。
例: `lsns`、`sudo nsenter --target 1234 --net ip addr`、`sudo unshare --uts --fork bash`
注意: コンテナの中に入れる道具がないときも、`nsenter` ならホスト側から、コンテナの名前空間に入れます。
関連: namespace、コンテナ

## Docker

### Docker
試験: Docker
要約: コンテナのイメージを作り、配り、動かすための道具です。
コンテナのイメージを作り、配り、動かすための道具です。`docker` コマンド(クライアント)が、Docker デーモン(dockerd)に命令を送ります。
例: `docker build`、`docker run`、`docker push`
注意: Docker Desktop は、大きな会社(250 人以上か年間売上 1,000 万ドル以上)の仕事では有料です。
関連: コンテナ、イメージ、Docker デーモン

### Docker デーモン
別名: dockerd、Docker Engine
試験: Docker
要約: コンテナの作成と実行を受け持つ、裏で動くプログラムです(dockerd)。
イメージ、コンテナ、ネットワーク、ボリュームを管理する、Docker の本体のプロセスです。`/var/run/docker.sock` で命令を受けます。このソケットを触れると、ホストの root と同じことができます。
例: `docker version` の Server の欄、`/var/run/docker.sock`
注意: docker のソケットに触れる人は root と同じ権限を持つので、`docker` グループに入れる人を絞ります。
関連: Docker、containerd

### イメージ
別名: コンテナイメージ
試験: Docker、K8s
要約: コンテナの元になる、読み取り専用のひな形です。
コンテナを作るための、読み取り専用のひな形です。複数のレイヤーが重なってできています。1 つのイメージから、いくつでもコンテナを作れます。
例: `nginx:1.27`、`docker images`、`docker pull`
注意: イメージを変えても、動いているコンテナには反映されません。作り直します。
関連: レイヤー、Dockerfile、レジストリ、タグ

### レイヤー
別名: 層
試験: Docker
要約: イメージを作る、重ねられた差分の層です。
イメージを作る、変更の差分の層です。Dockerfile の命令ごとに作られ、同じ層は共有され、ビルドのキャッシュにも使われます。前の層に入ったファイルは、後の層で消しても大きさが減りません。
例: Dockerfile の `RUN`、`COPY`、`ADD` がそれぞれ層になる、`docker history`
注意: 後の層でファイルを消しても、前の層には残るので、秘密情報は入れません。
関連: イメージ、ビルドキャッシュ

### Dockerfile
試験: Docker
要約: イメージの作り方を書いたファイルです。
イメージの作り方を書いたファイルです。`FROM`(元のイメージ)、`RUN`(コマンドの実行)、`COPY`(ファイルの追加)、`CMD`(起動のコマンド)などの命令を並べます。
例: `FROM python:3.13-slim`、`COPY`、`RUN pip install …`、`CMD ["python", "app.py"]`
注意: 変わりにくいもの(依存関係)を先に、変わりやすいもの(ソースコード)を後に書くとキャッシュが効きます。
関連: イメージ、マルチステージビルド、ビルドキャッシュ

### ENTRYPOINT
別名: CMD
試験: Docker
要約: コンテナが起動するときに必ず実行するコマンドです。
コンテナが起動したときに実行するコマンドを決める Dockerfile の命令です。両方書くと、ENTRYPOINT がコマンド、CMD が既定の引数になります。`docker run` の後ろに書いた引数は CMD を置き換えます。
例: `ENTRYPOINT ["/app/server"]` と `CMD ["--port", "8080"]`
注意: CMD は既定の引数で、`docker run イメージ 引数` で上書きされます。ENTRYPOINT は `--entrypoint` でしか変わりません。
関連: Dockerfile、PID 1

### ビルドコンテキスト
別名: .dockerignore
試験: Docker
要約: `docker build` のときにデーモンに送るファイルの集まりです。
`docker build` に渡すディレクトリで、`COPY` できるファイルの範囲です。`.dockerignore` に書いたものは送られないので、秘密のファイルを入れず、ビルドも速くできます。
例: `docker build -t app .`(最後の `.` がコンテキスト)、`.dockerignore`
注意: `.dockerignore` を書かないと、`.git` や `.env` まで送られ、イメージに入ることがあります。
関連: Dockerfile

### ビルドキャッシュ
試験: Docker
要約: 前のビルドの層を再利用して、ビルドを速くする仕組みです。
前のビルドの層を再利用して、ビルドを速くする仕組みです。ある命令の内容や入力が変わると、それより後の命令はキャッシュが使えなくなるので、変わりにくいものを先に書きます。
例: `RUN --mount=type=cache,target=/root/.cache/pip`、`--cache-from`、`--cache-to`
注意: ある層が変わると、それより後の層はすべて作り直しになります。
関連: レイヤー、Dockerfile

### マルチステージビルド
試験: Docker
要約: ビルド用と実行用の段階を分けて、小さなイメージを作る方法です。
1 つの Dockerfile に複数の `FROM` を書き、ビルドに使う道具は最終のイメージに入れず、できたものだけをコピーする方法です。イメージが小さくなり、脆弱性も減ります。
例: `FROM golang:1.23 AS build` → `FROM gcr.io/distroless/static` に `COPY --from=build`
注意: コンパイラーやソースコードを実行用のイメージに入れないので、小さく安全になります。
関連: Dockerfile、distroless

### distroless
試験: Docker
要約: シェルやパッケージ管理を入れない、最小の実行用のイメージです。
シェルもパッケージマネージャーも入れず、アプリの実行に必要なものだけを入れた、とても小さいベースイメージです。攻撃に使えるものが少なく安全ですが、中に入って調べにくくなります。
例: `gcr.io/distroless/static`、`gcr.io/distroless/python3`
注意: シェルがないので `docker exec … sh` はできません。調べるときはデバッグ用のコンテナを使います。
関連: マルチステージビルド

### ポートの公開
別名: -p、EXPOSE
試験: Docker
要約: コンテナのポートを、ホストのポートにつないで外から届くようにすることです。
`docker run -p 8080:80` のように、ホストのポートをコンテナのポートにつなぐことです。Dockerfile の `EXPOSE` は説明の印だけで、公開はしません。
例: `-p 8080:80`(ホスト:コンテナ)、`-p 127.0.0.1:8080:80`
注意: `EXPOSE` は記録だけで、公開はしません。
関連: ポート番号

### bridge ネットワーク
別名: ユーザー定義ネットワーク、docker0
試験: Docker
要約: Docker の既定の、ホストの中の仮想のネットワークです。
1 台のホストの中で、コンテナ同士をつなぐ Docker のネットワークです。自分で作ったネットワーク(ユーザー定義)では、コンテナの名前で相手を引けます。既定の bridge(docker0)では引けません。
例: `docker network create app-net`、`--network app-net`
注意: 既定の bridge では名前で互いを引けません。ユーザー定義のネットワークを作ると、コンテナ名で通信できます。
関連: Docker Compose

### ボリューム
別名: 名前付きボリューム
試験: Docker、K8s
要約: コンテナが消えても残る、データの保存場所です。
コンテナを消しても残る、データの置き場所です。Docker では名前付きボリュームやバインドマウント、Kubernetes では emptyDir や PVC などを使います。
例: `docker volume create pgdata`、`-v pgdata:/var/lib/postgresql/data`
注意: `docker system prune` ではボリュームは消えません。`docker compose down -v` は消します。
関連: バインドマウント、PVC

### バインドマウント
試験: Docker
要約: ホストのディレクトリを、コンテナの中に見せる方法です。
ホストのディレクトリやファイルを、そのままコンテナの中に見せる仕組みです。開発でソースコードをすぐ反映するのに便利ですが、ファイルの持ち主(UID)の違いに注意します。
例: `-v ./src:/app/src`、`--mount type=bind,source=…,target=…`
注意: ファイルの所有者はホストの UID のままなので、権限の不一致で書けないことがあります。
関連: ボリューム

### tmpfs
試験: Docker
要約: メモリの上に作る、一時的な保存場所です。
メモリの上に置く、一時的なファイルの置き場所です。コンテナが止まると消えます。ディスクに書きたくないデータに使います。
例: `docker run --tmpfs /tmp`、`--read-only` と組み合わせる
注意: コンテナが止まると中身は消えます。
関連: ボリューム

### ロギングドライバー
別名: json-file
試験: Docker
要約: コンテナの標準出力のログを、どこに送るかを決める設定です。
コンテナのログの保存先や形式を決める仕組みです。既定の json-file はホストのファイルに書きますが、そのままでは増え続けるので、`max-size` と `max-file` で上限を決めます。
例: `json-file`(既定)、`local`、`awslogs`、`--log-opt max-size=10m`
注意: json-file は既定でローテーションしないので、`max-size` を決めないとディスクを使い切ります。
関連: ログローテーション、標準出力

### 再起動ポリシー
別名: --restart、unless-stopped
試験: Docker
要約: コンテナが止まったときに、自動で起動し直すかの設定です。
コンテナが止まったときに、自動で起動し直すかの設定です。`no`、`on-failure`、`always`、`unless-stopped`(手で止めたものは起動しない)があります。
例: `--restart unless-stopped`、`always`、`on-failure:3`
注意: `docker stop` で止めたものは、`unless-stopped` ならデーモンの再起動の後も止まったままです。
関連: Docker デーモン

### Docker Compose
別名: Compose、compose.yaml
試験: Docker
要約: 複数のコンテナを、1 つの YAML で定義してまとめて動かす道具です。
複数のコンテナ(Web、データベースなど)の構成を `compose.yaml` に書き、`docker compose up` でまとめて起動する道具です。サービスの名前で、互いに通信できます。
例: `docker compose up -d`、`docker compose down`、`depends_on`、`develop.watch`
注意: 先頭の `version:` は不要です。サービス同士はサービス名で通信します。
関連: Docker、YAML

### docker exec
別名: docker attach
試験: LinuC201、Docker
要約: 動いているコンテナの中で、新しいコマンドを実行します。
`docker exec -it コンテナ sh` で、コンテナの中のシェルに入れます。`docker attach` は、新しいプロセスを作らず、コンテナの最初のプロセス(PID 1)の入出力につなぎます。
例: `docker exec -it web sh`、`docker attach web`
注意: `docker attach` で `Ctrl+C` を押すと、コンテナが止まることがあります。抜けるときは `Ctrl+P`、`Ctrl+Q` です。
関連: コンテナ、PID 1

### docker stop
別名: docker kill
試験: LinuC201、Docker
要約: 動いているコンテナを止めます。
`docker stop` は、先に SIGTERM を送り、既定の 10 秒待っても終わらないときに SIGKILL を送ります。`docker kill` は、すぐに SIGKILL を送ります。
例: `docker stop web`、`docker stop -t 30 web`、`docker kill web`
注意: SIGKILL は後片付けができないので、ふだんは `docker stop` を使います。
関連: シグナル、コンテナ

### docker pause
別名: docker unpause
試験: LinuC201
要約: コンテナのプロセスを、メモリを残したまま一時停止します。
cgroups の freezer の機能で、コンテナ内のすべてのプロセスを止めます。`docker unpause` で再開します。
例: `docker pause batch`、`docker unpause batch`
注意: プロセスは終了しないので、`docker stop` とは違います。
関連: cgroups、コンテナ

### docker stats
試験: LinuC201、Docker
要約: コンテナごとの CPU、メモリなどの使用量を、リアルタイムで表示します。
動いているコンテナごとに、CPU の使用率、メモリの使用量と上限、ネットワークとディスクの入出力を表示します。
例: `docker stats`、`docker stats --no-stream`
注意: 止まっているコンテナは表示されません。1 回だけ表示するときは `--no-stream` を付けます。
関連: cgroups、コンテナ

### docker commit
試験: LinuC201、Docker
要約: 動かしたコンテナの今の状態を、新しいイメージにします。
手作業で変えた内容も含めて、イメージにできます。ただし、何を変えたかが記録に残らず、作り直せません。
例: `docker commit -m "add config" web web:v2`
注意: ふつうは、Dockerfile を書いて `docker build` で作ります。
関連: イメージ、Dockerfile、コンテナ

### docker import
別名: docker export
試験: LinuC201、Docker
要約: tar のファイルから、新しいイメージを作ります。
`docker export` は、コンテナのファイルシステムを tar にします。`docker import` は、その tar から、1 つのレイヤーのイメージを作ります。
例: `docker export web > web.tar`、`docker import web.tar myapp:1.0`
注意: レイヤーの履歴とタグは引き継がれません。引き継ぐには、`docker save` と `docker load` を使います。
関連: イメージ、レイヤー

### docker save
別名: docker load
試験: LinuC201、Docker
要約: イメージを、レイヤーとタグごと tar のファイルにして、持ち運びます。
`docker save` は、イメージを tar にします。`docker load` は、その tar からイメージを読み込みます。レジストリを使えない環境に、イメージを渡すときに使います。
例: `docker save -o app.tar myapp:1.0`、`docker load -i app.tar`
注意: `docker export` と `docker import` は、コンテナのファイルシステムだけを扱う、別のコマンドです。
関連: イメージ、レジストリ、レイヤー

### macvlan
試験: LinuC201、Docker
要約: コンテナを、ホストと同じ LAN に、専用のアドレスで参加させるネットワークです。
コンテナごとに、専用の MAC アドレスと IP アドレスを持たせ、ホストの NIC の先の LAN につなぎます。ポートの割り当て(`-p`)は要りません。
例: `docker network create -d macvlan --subnet 192.168.1.0/24 --gateway 192.168.1.1 -o parent=eth0 lan`
注意: 既定では、ホスト自身とコンテナは、直接通信できません。
関連: bridge ネットワーク、ポートの公開、コンテナ

## イメージの配布と信頼

### レジストリ
別名: コンテナレジストリ
試験: Docker、K8s
要約: コンテナのイメージを保存して配る場所です。
イメージを保存して配るサーバーです。Docker Hub、Amazon ECR、GitHub Container Registry などがあります。同じ名前のイメージの集まりをリポジトリと呼びます。
例: Docker Hub、Amazon ECR、GitHub Container Registry
注意: 非公開のレジストリから pull するには、`docker login` や `imagePullSecrets` で認証します。
関連: イメージ、タグ、ECR

### タグ
別名: イメージタグ
試験: Docker、K8s
要約: イメージの版を表す名前です。
イメージの名前の `:` の後ろの部分です(`nginx:1.27` の `1.27`)。付け替えられるので、同じタグでも中身が変わることがあります。`latest` は最新の保証がない、省略したときの名前です。
例: `nginx:1.27`、`app:2026-11-19`、`app:latest`
注意: タグは後から別のイメージに付け替えられるので、本番では版を固定するかダイジェストを使います。
関連: ダイジェスト(イメージ)、イメージ

### ダイジェスト(イメージ)
別名: イメージダイジェスト
試験: Docker、K8s
要約: イメージの中身から計算したハッシュで、中身が同じなら同じ値です。
イメージの中身から計算したハッシュ値(`@sha256:…`)です。中身が変われば必ず変わるので、まったく同じイメージを指定できます。
例: `nginx@sha256:…`、`docker images --digests`
注意: ダイジェストで指定すれば、必ず同じ中身のイメージが使われます。
関連: タグ、ハッシュ

### イメージの署名
別名: Cosign、Sigstore、Notation
試験: Docker、K8s
要約: イメージを作った人と、改ざんのないことを示す署名です。
イメージに電子署名を付け、デプロイの前に、信頼できる人が作った改ざんのないイメージかを確かめることです。今は Sigstore(Cosign)や Notation を使います。
例: `cosign sign`、`cosign verify`、Notation
注意: Docker Content Trust は廃止されました。今は Cosign や Notation を使います。
関連: 電子署名、イメージ

### SBOM
別名: ソフトウェア部品表
試験: Docker
要約: ソフトウェアに含まれる部品の一覧です。
ソフトウェアに含まれる部品(ライブラリとバージョン)の一覧です。新しい脆弱性が見つかったときに、影響を受けるものをすぐに探せます。
例: `docker buildx build --sbom=true`、`syft app:1.0`
注意: 新しい脆弱性が見つかったときに、影響を受けるイメージをすぐに探せます。
関連: 脆弱性スキャン

## Kubernetes の構成

### Kubernetes
別名: K8s
試験: K8s
要約: 多くのコンテナを、宣言した状態に保ちながら動かす仕組みです(オーケストレーション)。
多数のコンテナを、複数のサーバー(ノード)の上で自動で配置し、増やし、直す、コンテナのオーケストレーションの仕組みです。あるべき状態を宣言すると、今の状態をそれに近づけ続けます。
例: `kubectl apply -f deploy.yaml`
注意: 「あるべき状態」を書き、コントローラーが差を埋め続ける、という考え方が基本です。
関連: クラスタ、Pod、宣言的

### クラスタ
別名: Kubernetes クラスタ
試験: K8s
要約: コントロールプレーンとワーカーノードを合わせた、Kubernetes の全体です。
Kubernetes の、コントロールプレーンと、アプリを動かすワーカーノードの集まりです。
例: `kubectl cluster-info`、`kubectl get nodes`
注意: 本番では、コントロールプレーンを 3 台以上の奇数にして冗長化します。
関連: コントロールプレーン、ワーカーノード

### コントロールプレーン
試験: K8s
要約: クラスタ全体を管理する部品の集まりです。
クラスタの頭脳にあたる部品の集まりです。API サーバー、etcd、スケジューラー、コントローラーマネージャーがあります。
例: kube-apiserver、etcd、kube-scheduler、kube-controller-manager
注意: kubeadm のクラスタでは、これらは `/etc/kubernetes/manifests/` の静的 Pod として動きます。
関連: kube-apiserver、etcd、kube-scheduler

### ワーカーノード
別名: ノード(Kubernetes)
試験: K8s
要約: アプリの Pod が実際に動くマシンです。
Pod を実際に動かすサーバーです。kubelet、kube-proxy、コンテナランタイムが動いています。
例: kubelet、kube-proxy、コンテナランタイム
注意: ノードが NotReady になったら、まず kubelet とコンテナランタイムを確かめます。
関連: kubelet、kube-proxy

### kube-apiserver
別名: API サーバー
試験: K8s
要約: Kubernetes のすべての操作を受け付ける窓口です。
Kubernetes のすべての操作の入口です。認証と認可をしてから、etcd に読み書きします。kubectl も、ほかの部品も、すべてここを通します。
例: 6443 番、`kubectl` の接続先
注意: ほかの部品同士も直接は話さず、すべて API サーバーを通します。
関連: etcd、kubectl

### etcd
試験: K8s
要約: クラスタのすべての状態を保存するデータベースです。
Kubernetes のクラスタのすべての状態を保存する、キーバリューストア(キーと値の組でデータを保存するデータベース)です。失うとクラスタの定義を失うので、スナップショットでバックアップします。台数は奇数にします。
例: `etcdctl snapshot save`、`etcdutl snapshot restore`
注意: 過半数が動いていないと書き込めないので、台数は 3 や 5 の奇数にします。
関連: kube-apiserver、バックアップ

### kube-scheduler
別名: スケジューラー
試験: K8s
要約: 新しい Pod をどのノードに置くかを決める部品です。
まだノードが決まっていない Pod に、資源の空き(requests)や条件(taint、affinity)を見て、置くノードを決める部品です。
例: requests、taint、affinity を見て選ぶ
注意: 止まると新しい Pod が Pending のままになり、イベントも付きません。
関連: requests、taint

### kube-controller-manager
別名: コントローラーマネージャー
試験: K8s
要約: Deployment などの組み込みのコントローラーをまとめて動かす部品です。
Deployment、ReplicaSet、Node などのコントローラーをまとめて動かす部品です。コントローラーは、あるべき状態と今の状態を比べ、差をなくす動きを繰り返します(調整ループ)。
例: Deployment → ReplicaSet → Pod を作る
注意: 止まると、Deployment を作っても ReplicaSet や Pod が作られません。
関連: コントロールプレーン、Deployment

### コントローラー
別名: 調整ループ、reconcile
試験: K8s
要約: あるべき状態と今の状態を見比べ、差を埋め続けるプログラムです。
リソースのあるべき状態(spec)と今の状態(status)を見比べ、差を埋める操作を繰り返すプログラムです。Deployment や Job の動きも、それぞれのコントローラーが担います。
例: Deployment のコントローラー、Ingress コントローラー、オペレーター
注意: 手で Pod を消しても作り直されるのは、コントローラーが差を埋めるからです。
関連: kube-controller-manager、オペレーター

### Admission コントローラー
別名: アドミッションコントローラー、admission webhook
試験: K8s
要約: API サーバーが保存する前に、リクエストを確かめたり書き換えたりする仕組みです。
API サーバーが、認証と認可の後、etcd に保存する前に、リクエストを確かめたり書き換えたりする仕組みです。Pod Security Admission や ResourceQuota の確認もこの段階で動きます。
例: Pod Security Admission、ResourceQuota、ValidatingAdmissionPolicy、webhook
注意: 認証と認可の後に動きます。拒否されたら作成のときにエラーになります。
関連: kube-apiserver、Pod Security Admission

### kubelet
試験: K8s
要約: 各ノードで動き、Pod のコンテナを起動して状態を報告する部品です。
各ノードで動き、割り当てられた Pod をコンテナランタイムで起動し、状態を API サーバーに報告するエージェントです。systemd のサービスとして動きます。
例: `systemctl status kubelet`、`journalctl -u kubelet`
注意: kubelet は Pod ではなく systemd のサービスなので、kubectl ではログを見られません。
関連: ワーカーノード、静的 Pod、CRI

### kube-proxy
試験: K8s
要約: 各ノードで、Service への通信を Pod に振り分ける規則を作る部品です。
各ノードで、Service の仮想 IP への通信を Pod に振り分けるルール(iptables など)を作る部品です。
例: iptables、IPVS、nftables のモード
注意: Cilium のように、kube-proxy の代わりをする CNI もあります。
関連: Service、iptables

### CRI
別名: CNI、CSI
試験: K8s
要約: kubelet とコンテナランタイムをつなぐ標準のインターフェースです。
Kubernetes と外の部品をつなぐ標準のインターフェースです。CRI はコンテナランタイム、CNI はネットワーク(Pod の IP と通信)、CSI はストレージをつなぎます。
例: CRI: containerd / CNI: Calico / CSI: EBS CSI ドライバー
注意: 名前の真ん中の語(Runtime、Network、Storage)で覚えます。
関連: containerd、CNI プラグイン

### CNI プラグイン
試験: K8s
要約: Pod に IP アドレスを付け、Pod 同士の通信を作る部品です。
Pod に IP アドレスを付け、ノードをまたいだ Pod の通信を作る部品です。Calico、Cilium、Flannel などがあります。入れるまでノードは NotReady のままです。NetworkPolicy に対応しないものもあります。
例: Calico、Cilium、Flannel、AWS VPC CNI
注意: 入れるまでノードは NotReady で、CoreDNS は Pending のままです。
関連: CRI、NetworkPolicy

### 静的 Pod
試験: K8s
要約: API サーバーではなく、kubelet がファイルから直接起動する Pod です。
API サーバーを通さず、kubelet がノードの `/etc/kubernetes/manifests/` の YAML を直接読んで動かす Pod です。kubeadm のクラスタのコントロールプレーンの部品はこれで動いています。kubectl で見えるものはミラー Pod と呼ばれる写しで、消しても作り直されます。
例: `/etc/kubernetes/manifests/kube-apiserver.yaml`
注意: kubectl で消しても kubelet がすぐに作り直します。止めるにはファイルを移します。
関連: kubelet、kubeadm

## kubectl と設定

### kubectl
試験: K8s
要約: Kubernetes を操作するコマンドです。
Kubernetes を操作するコマンドです。`kubectl get`、`describe`、`apply`、`logs` などを使います。どのクラスタを操作するかは kubeconfig のコンテキストで決まります。
例: `kubectl get pods -A`、`kubectl describe pod web`、`kubectl logs web --previous`
注意: 試験では、作業の前に指定のコンテキストに切り替えます(`kubectl config use-context`)。
関連: kubeconfig、kube-apiserver

### kubeconfig
別名: コンテキスト
試験: K8s
要約: kubectl の接続先、ユーザー、コンテキストを書いた設定ファイルです。
kubectl が使う、クラスタの場所、認証情報、既定の Namespace をまとめたファイルです(`~/.kube/config`)。その組み合わせをコンテキストと呼び、`kubectl config use-context` で切り替えます。
例: `~/.kube/config`、`kubectl config get-contexts`、`KUBECONFIG`
注意: admin の kubeconfig はクラスタの全権限を持つので、扱いに注意します。
関連: kubectl

### kubeadm
試験: K8s
要約: Kubernetes のクラスタを作り、アップグレードするコマンドです。
Kubernetes のクラスタを作り(`kubeadm init`、`kubeadm join`)、アップグレードするための道具です。コントロールプレーンの部品は静的 Pod として動かします。
例: `kubeadm init`、`kubeadm join`、`kubeadm upgrade apply v1.37.x`、`kubeadm certs renew all`
注意: マイナーバージョンは 1 つずつ上げ、コントロールプレーンを先に上げます。
関連: 静的 Pod、コントロールプレーン

### マニフェスト
試験: K8s
要約: Kubernetes のリソースのあるべき状態を書いた YAML です。
Kubernetes のリソースを YAML で書いたファイルです。`apiVersion`、`kind`、`metadata`、`spec` を書き、`kubectl apply -f` で適用します。
例: `apiVersion`、`kind`、`metadata`、`spec`
注意: 下書きは `kubectl create … --dry-run=client -o yaml` で作ると速いです。
関連: YAML、宣言的

### jsonpath
試験: K8s
要約: kubectl の出力から、決まった項目だけを取り出す書き方です。
kubectl の出力から、決まった項目だけを取り出す書き方です。`kubectl get pod web -o jsonpath='{.status.podIP}'` のように使います。
例: `kubectl get nodes -o jsonpath='{.items[*].metadata.name}'`
注意: 一覧(List)は `.items[*]` から、1 つのリソースは `.metadata` から書きます。
関連: kubectl

### port-forward
試験: K8s
要約: 手元のポートを、Pod や Service のポートにつなぐ機能です。
`kubectl port-forward` で、手元のポートを Pod や Service のポートにつなぐ機能です。外に公開していないアプリを、手元から確かめるのに使います。
例: `kubectl port-forward svc/web 8080:80`
注意: 一時的な確認用で、外に公開する方法ではありません。
関連: kubectl、Service

### CSR(Kubernetes)
別名: CertificateSigningRequest、証明書署名要求
試験: K8s
要約: ユーザーなどの証明書を、クラスタの CA で署名してもらうリソースです。
ユーザーなどの証明書をクラスタの CA で署名してもらうための Kubernetes のリソースです。`kubectl certificate approve` で承認すると、署名された証明書を取り出せます。
例: `kubectl certificate approve alice`、`.status.certificate` を base64 で戻す
注意: 証明書ができても、権限は RBAC で別に与えます。
関連: kubeconfig、RBAC

## ワークロード

### Namespace
別名: 名前空間(Kubernetes)
試験: K8s
要約: クラスタの中のリソースを区切る単位です。
クラスタの中を、チームや環境ごとに区切る単位です。名前の重複を避け、権限(RBAC)や資源の上限(ResourceQuota)を Namespace ごとに決めます。
例: `kubectl get pods -n kube-system`、`kubectl create namespace dev`
注意: ノードや PV のように、Namespace に属さないリソースもあります(`kubectl api-resources --namespaced=false`)。
関連: RBAC、ResourceQuota

### ラベル
別名: selector、セレクター
試験: K8s
要約: リソースに付ける、キーと値の印です。
リソースに付ける「キー=値」の印です(`app=web`)。Service や Deployment は、selector でラベルの合う Pod を選びます。ラベルが合わないと、Service のエンドポイントが空になります。
例: `app: web`、`kubectl get pods -l app=web`
注意: Service や Deployment は、ラベルの selector で Pod を選びます。綴りが違うとつながりません。
関連: Service、Deployment

### Pod
試験: K8s
要約: Kubernetes で動かす最小の単位で、1 つ以上のコンテナの組です。
Kubernetes でコンテナを動かす最小の単位です。1 つ以上のコンテナが、IP アドレスとボリュームを共有します。作り直されると IP アドレスが変わります。
例: `kubectl run tmp --rm -it --image=busybox:1.37 -- sh`
注意: Pod の IP は作り直すと変わるので、通信は Service を通します。
関連: Deployment、Service

### Deployment
別名: ReplicaSet
試験: K8s
要約: Pod の数と版を管理し、ローリングアップデートをする仕組みです。
指定した数の Pod を動かし続け、イメージの更新をローリングアップデートで行うリソースです。実際の Pod の数は、Deployment が作る ReplicaSet が保ちます。
例: `kubectl create deployment web --image=nginx:1.27 --replicas=3`、`kubectl rollout undo`
注意: Deployment は ReplicaSet を作り、ReplicaSet が Pod を作ります。
関連: Pod、ローリングアップデート

### StatefulSet
試験: K8s
要約: 名前と保存場所が固定された Pod を、順番に動かす仕組みです。
データベースのように、Pod ごとに決まった名前(`db-0`、`db-1`)と専用のストレージが必要なアプリのためのリソースです。
例: `db-0`、`db-1`、`volumeClaimTemplates`、ヘッドレス Service
注意: Pod を消しても PVC は残ります(`persistentVolumeClaimRetentionPolicy` で変えられる)。
関連: PVC、ヘッドレス Service

### DaemonSet
試験: K8s
要約: すべての(または選んだ)ノードに、Pod を 1 つずつ動かす仕組みです。
すべての(または選んだ)ノードに、Pod を 1 つずつ動かすリソースです。ログの収集や監視のエージェント、CNI のプラグインに使います。
例: ログの収集、監視のエージェント、CNI、kube-proxy
注意: drain のときは `--ignore-daemonsets` を付けます。
関連: ワーカーノード

### Job
別名: CronJob
試験: K8s
要約: 終わるまで実行する処理を、Pod で動かす仕組みです。
終わるまで実行する処理のためのリソースです。Job は 1 回、CronJob は決まった時刻ごとに Job を作ります。
例: `completions`、`parallelism`、`backoffLimit`、CronJob の `schedule: "0 2 * * *"`
注意: Job の Pod の `restartPolicy` は `Never` か `OnFailure` です(`Always` は使えない)。
関連: cron

### 初期化コンテナ
別名: initContainers、サイドカー
試験: K8s
要約: メインのコンテナより先に、順番に実行して終わるコンテナです。
メインのコンテナの前に、順番に実行して終わるコンテナです。依存先を待つ、設定を用意するなどに使います。`restartPolicy: Always` を付けると、メインと一緒に動き続けるサイドカーになります。
例: データベースの準備を待つ、設定ファイルを作る
注意: `restartPolicy: Always` を付けた初期化コンテナは、サイドカーとして動き続けます。
関連: Pod

### ローリングアップデート
試験: K8s、SAA
要約: Pod を少しずつ新しい版に入れ替える更新の方法です。
古い Pod(サーバー)を少しずつ新しいものに入れ替える更新の方法です。止まる時間を作らずに更新できます。`maxSurge` と `maxUnavailable` で、入れ替えの速さを決めます。
例: `maxSurge: 1`、`maxUnavailable: 0`、`kubectl rollout status`
注意: readinessProbe がないと、準備ができる前に通信が届き、エラーになることがあります。
関連: Deployment、ロールバック

### ロールバック
試験: K8s、Terraform
要約: 前の版に戻すことです。
問題のあった変更を、前の正常な版に戻すことです。Deployment は `kubectl rollout undo`、Helm は `helm rollback` で戻します。
例: `kubectl rollout history deployment/web`、`kubectl rollout undo deployment/web --to-revision=2`
注意: データベースのスキーマの変更は、アプリを戻しても戻らないので、別に計画します。
関連: ローリングアップデート

### ConfigMap
試験: K8s
要約: 設定を、イメージから分けて Pod に渡すリソースです。
設定の値やファイルを、イメージの外に置くためのリソースです。環境変数やファイルとして Pod に渡します。
例: `envFrom: - configMapRef: name: app-config`、ファイルとしてマウント
注意: 環境変数として渡した値は、ConfigMap を変えても Pod を作り直すまで変わりません。
関連: Secret、環境変数

### Secret
試験: K8s
要約: パスワードなどの秘密情報を Pod に渡すリソースです。
パスワードなどの秘密情報を Pod に渡すためのリソースです。値は Base64 で書かれているだけで暗号化ではないので、RBAC で読める人を絞り、etcd の暗号化を有効にします。
例: `kubectl create secret generic db --from-literal=password=…`
注意: base64 で書かれているだけで、暗号化ではありません。etcd の暗号化や外部の管理と組み合わせます。
関連: ConfigMap、秘密情報

### Sealed Secrets
別名: SOPS
試験: K8s
要約: Secret を暗号化した形で Git に置けるようにする道具です。
Secret を暗号化した形で Git に置けるようにする道具です。Sealed Secrets はクラスタの中のコントローラーが復号します。SOPS はファイルを KMS などの鍵で暗号化します。
例: `kubeseal < secret.yaml > sealed.yaml`、SOPS + KMS
注意: 暗号化した Secret を Git に置き、平文の Secret は置きません。
関連: Secret、GitOps

### ServiceAccount
試験: K8s
要約: Pod の中のプログラムが、API サーバーを使うときの ID です。
Pod が Kubernetes の API を使うときの ID です。RBAC で権限を与えます。クラウドの権限(IAM ロール)と結び付けることもできます。
例: `serviceAccountName: ci`、`automountServiceAccountToken: false`
注意: 権限は Role と RoleBinding で、ServiceAccount に必要なものだけを与えます。
関連: RBAC、IRSA

## スケジューリングと資源

### requests
別名: リソース要求
試験: K8s
要約: スケジューリングのときに、ノードに確保を求める CPU とメモリの量です。
コンテナが必要とする CPU とメモリの量の申告です。スケジューラーは、ノードの requests の合計で空きを判断します。HPA の使用率の計算の基準にもなります。
例: `resources.requests.cpu: 250m`、`memory: 256Mi`
注意: スケジューラーは実際の使用量ではなく、requests の合計で空きを判断します。
関連: limits、kube-scheduler、HPA

### limits
別名: リソース制限
試験: K8s、Docker
要約: コンテナが使える CPU とメモリの上限です。
コンテナが使える CPU とメモリの上限です。メモリの上限を超えると OOMKilled で強制終了され、CPU の上限を超えると速度が抑えられます(スロットリング)。
例: `resources.limits.memory: 512Mi`
注意: メモリの上限を超えると OOMKilled、CPU は上限で抑えられる(スロットリング)だけです。
関連: requests、OOMKilled、cgroups

### OOMKilled
別名: OOM
試験: K8s、Docker
要約: メモリの上限を超えて、コンテナが強制終了された状態です。
メモリの上限を超えて、カーネルにプロセスを強制終了されたことです。終了ステータスは 137 になります。
例: `kubectl describe pod` の `Reason: OOMKilled`、`Exit Code: 137`
注意: 上限を上げるか、アプリのメモリの使い方を直します。
関連: limits、終了ステータス

### QoS クラス
試験: K8s
要約: requests と limits の書き方で決まる、Pod の優先度の区分です。
requests と limits の決め方による、Pod の区分です。Guaranteed(全コンテナで requests と limits が同じ)、Burstable、BestEffort(何も決めていない)があり、資源が足りないときは BestEffort から追い出されます。
例: Guaranteed(requests = limits)、Burstable、BestEffort(どちらもなし)
注意: ノードのメモリが足りないとき、BestEffort から先に追い出されます。
関連: requests、limits

### Evicted
試験: K8s
要約: ノードの資源が足りず、kubelet が Pod を追い出した状態です。
ノードのメモリやディスクが足りなくなり、kubelet が Pod を追い出した状態です。追い出す順番は QoS クラスと使用量で決まります。
例: `kubectl get pods` の `Evicted`、`DiskPressure`、`MemoryPressure`
注意: 追い出された Pod は自動では消えないので、原因を直した後に片付けます。
関連: kubelet、QoS クラス

### taint
別名: toleration
試験: K8s
要約: ノードに付けて、合う toleration のない Pod を置かせない印です。
ノードに付けて、合う toleration を持たない Pod を置かせないようにする印です。toleration は「置いてもよい」という許可で、そのノードに引き寄せはしません。
例: `kubectl taint nodes node1 dedicated=gpu:NoSchedule`
注意: toleration は置いてもよいという許可で、そのノードに引き寄せはしません。
関連: kube-scheduler、nodeAffinity

### nodeAffinity
別名: nodeSelector、affinity
試験: K8s
要約: ノードのラベルで、Pod を置くノードを選ぶ設定です。
Pod を、決まったラベルのノードに置くための条件です。簡単な条件は nodeSelector で書けます。
例: `requiredDuringSchedulingIgnoredDuringExecution`、`nodeSelector: {disktype: ssd}`
注意: required は条件に合わなければ Pending、preferred は合わなくても置きます。
関連: taint、ラベル

### Pod のアフィニティ
別名: podAffinity、podAntiAffinity
試験: K8s
要約: ほかの Pod の近く(または離れた所)に Pod を置く設定です。
ほかの Pod がいるノード(またはゾーン)に、近づけたり(podAffinity)、離したり(podAntiAffinity)して Pod を置く設定です。レプリカを別々のノードに分けるのに使います。
例: `podAntiAffinity` でレプリカを別のノードに分ける
注意: `topologyKey` で、ノード単位かゾーン単位かを決めます。
関連: nodeAffinity、topologySpreadConstraints

### topologySpreadConstraints
試験: K8s
要約: Pod をゾーンやノードに均等に散らす設定です。
同じアプリの Pod を、ゾーンやノードに均等に散らして置くための設定です。1 つのゾーンが止まっても、全部が止まらないようにします。
例: `maxSkew: 1`、`topologyKey: topology.kubernetes.io/zone`
注意: `whenUnsatisfiable: DoNotSchedule` だと、均等にできないときに Pending になります。
関連: アベイラビリティーゾーン、冗長化

### PriorityClass
別名: プリエンプション
試験: K8s
要約: Pod の優先度を決めるリソースです。
Pod の優先度を決めるリソースです。資源が足りないとき、優先度の高い Pod のために、低い Pod を追い出すことがあります(プリエンプション)。
例: `value: 1000000`、`priorityClassName: critical`
注意: 優先度の高い Pod は、置けないときに低い Pod を追い出すことがあります(プリエンプション)。
関連: kube-scheduler

### ResourceQuota
別名: LimitRange
試験: K8s
要約: Namespace の中で使える資源の合計に上限を付けるリソースです。
ResourceQuota は、Namespace 全体で使える CPU、メモリ、Pod の数などの合計の上限です。LimitRange は、1 つのコンテナや Pod の既定値と、最小と最大を決めます。
例: `requests.cpu: "10"`、`pods: "50"`、LimitRange で既定値を付ける
注意: CPU やメモリの ResourceQuota があると、requests を書かない Pod は作れません。
関連: Namespace、requests

### drain
別名: cordon
試験: K8s
要約: ノードの Pod を退避させ、新しい Pod も置かれないようにする操作です。
保守のために、ノードの Pod を退避させることです(`kubectl drain`)。cordon は新しい Pod を置かないようにするだけで、今の Pod は残ります。終わったら uncordon で戻します。
例: `kubectl drain node2 --ignore-daemonsets --delete-emptydir-data`、`kubectl uncordon node2`
注意: cordon は新しい Pod を止めるだけで、今の Pod は動いたままです。
関連: PodDisruptionBudget

### PodDisruptionBudget
別名: PDB
試験: K8s
要約: drain などで、同時に止めてよい Pod の数を制限するリソースです。
ノードの drain のような計画的な中断のときに、同時に止めてよい Pod の数を制限するリソースです。ノードの故障のような計画外の停止は防げません。
例: `minAvailable: 2` または `maxUnavailable: 1`
注意: replicas と同じ数を minAvailable にすると、drain が永遠に進みません。
関連: drain

## 健全性と障害

### livenessProbe
試験: K8s
要約: コンテナが生きているかを調べ、失敗したら再起動するプローブです。
コンテナが生きているかを確かめる仕組みです。続けて失敗すると、kubelet がコンテナを再起動します。
例: `httpGet: {path: /healthz, port: 8080}`、`periodSeconds: 10`
注意: 依存先まで調べると、依存先の障害で全部のコンテナが再起動を繰り返します。
関連: readinessProbe、startupProbe

### readinessProbe
試験: K8s
要約: コンテナが通信を受けられるかを調べ、失敗の間は Service から外すプローブです。
コンテナが通信を受けられる状態かを確かめる仕組みです。失敗すると、Service の振り分け先から外されます(再起動はしません)。
例: READY が `0/1` で、エンドポイントに入らない
注意: 失敗しても再起動はしません。再起動するのは livenessProbe です。
関連: livenessProbe、EndpointSlice

### startupProbe
試験: K8s
要約: 起動に時間のかかるアプリが立ち上がるまで、ほかのプローブを待たせるプローブです。
起動が終わったかを確かめる仕組みです。成功するまで、liveness と readiness の確認を止めるので、起動の遅いアプリが再起動され続けるのを防げます。
例: `failureThreshold: 30`、`periodSeconds: 10`(最大 300 秒待つ)
注意: 起動が遅いのを livenessProbe の待ち時間だけで調整すると、障害の発見も遅れます。
関連: livenessProbe

### preStop
試験: K8s
要約: コンテナを止める前に実行するフックです。
コンテナを止める前に実行するフックです。数秒待って、Service の振り分けから外れるのを待つのによく使います。
例: `lifecycle.preStop.exec.command: ["sleep", "5"]`
注意: preStop の時間も `terminationGracePeriodSeconds`(既定 30 秒)に含まれます。
関連: グレースフルシャットダウン

### CrashLoopBackOff
別名: ImagePullBackOff
試験: K8s
要約: コンテナが起動してすぐ終わることを繰り返し、待ってから再起動している状態です。
CrashLoopBackOff は、コンテナが起動してすぐ終わることを繰り返し、待ってから再起動している状態です。原因は `kubectl logs --previous` で見ます。ImagePullBackOff は、イメージの取得に失敗して待っている状態です。
例: `kubectl logs web --previous`、`kubectl describe pod web`
注意: ImagePullBackOff は、イメージを取得できない状態で、原因が違います。
関連: kubectl、イメージ

### CreateContainerConfigError
試験: K8s
要約: 参照している ConfigMap や Secret がなく、コンテナを作れない状態です。
コンテナを作る前の設定の段階で失敗した状態です。参照している ConfigMap や Secret、そのキーがないときによく起きます。`kubectl describe pod` のイベントで原因を見ます。
例: `Error: secret "db-pass" not found`
注意: ConfigMap と Secret は、Pod と同じ Namespace に作ります。
関連: ConfigMap、Secret、イベント

### Pending
別名: NotReady
試験: K8s
要約: Pod がまだノードに置かれていない状態です。
Pending は、Pod がまだノードに置かれていない(または準備中の)状態です。資源の不足、taint、PVC が多い原因で、`kubectl describe pod` の Events で理由が分かります。NotReady はノードが使えない状態で、kubelet や CNI を疑います。
例: `0/3 nodes are available: 2 Insufficient memory`、PVC が Bound でない
注意: `kubectl describe pod` のイベントに、置けない理由がノードの数ごとに出ます。
関連: kube-scheduler、kubelet

### イベント
別名: Event、kubectl get events
試験: K8s
要約: Kubernetes の中で起きた出来事の記録です。
Kubernetes のリソースに起きた出来事の記録です(スケジュール、イメージの取得、probe の失敗など)。既定では 1 時間ほどしか残りません。
例: `kubectl get events -n prod --sort-by=.metadata.creationTimestamp`
注意: 既定で 1 時間しか残らないので、障害の後の調査には外部に集めておきます。
関連: Pending、kubectl

### エフェメラルコンテナ
別名: kubectl debug
試験: K8s
要約: 動いている Pod に、調べるために一時的に足すコンテナです。
動いている Pod に、調べるために一時的に足すコンテナです。シェルのないイメージのコンテナを調べるのに使います。
例: `kubectl debug -it web --image=busybox:1.37 --target=app`
注意: シェルのない distroless のイメージを調べるときに使います。
関連: distroless

### crictl
試験: K8s
要約: ノードで、CRI のコンテナランタイムを直接操作するコマンドです。
ノードで、CRI のコンテナランタイムを直接操作するコマンドです。API サーバーが止まって kubectl が使えないときに、`crictl ps -a` や `crictl logs` でコンテナを調べます。
例: `crictl ps -a`、`crictl logs <ID>`、`crictl images`
注意: API サーバーが止まっていても使えるので、コントロールプレーンの障害の調査に使います。
関連: CRI、静的 Pod

## ネットワーク

### Service
試験: K8s
要約: Pod の集まりに、変わらない IP アドレスと DNS の名前を付けるリソースです。
ラベルで選んだ Pod の集まりに、変わらない仮想の IP アドレスと DNS の名前を与え、通信を振り分けるリソースです。種類に ClusterIP(既定、クラスタの中だけ)、NodePort、LoadBalancer があります。
例: `port: 80`、`targetPort: 8080`、`selector: {app: web}`
注意: つながらないときは、まずエンドポイントがあるか(selector と Ready)を確かめます。
関連: kube-proxy、EndpointSlice、ラベル

### NodePort
別名: ClusterIP、LoadBalancer
試験: K8s
要約: 各ノードの決まったポートで受けて、Service に届ける種類です。
Service の種類です。ClusterIP(既定)はクラスタの中だけで使えます。NodePort は全ノードの決まったポート(30000〜32767)で外から受けます。LoadBalancer はクラウドのロードバランサーを作ります。
例: `type: NodePort`、`nodePort: 30080`(30000〜32767)
注意: ClusterIP はクラスタの中だけ、LoadBalancer はクラウドのロードバランサーを作ります。
関連: Service

### ヘッドレス Service
試験: K8s
要約: 仮想の IP を持たず、DNS で Pod の IP を直接返す Service です。
仮想の IP アドレスを持たない(`clusterIP: None`)Service です。DNS で各 Pod の IP アドレスを直接返すので、StatefulSet で Pod ごとの名前を使うときに必要です。
例: `clusterIP: None`、`db-0.db.prod.svc.cluster.local`
注意: StatefulSet の Pod に、名前で 1 つずつ届くようにするのに使います。
関連: Service、StatefulSet

### EndpointSlice
別名: エンドポイント
試験: K8s
要約: Service の届け先の Pod の IP とポートの一覧です。
Service の振り分け先になる、Ready の Pod の IP アドレスとポートの一覧です。空なら、selector とラベルが合っていないか、Pod が Ready ではありません。
例: `kubectl get endpointslices -l kubernetes.io/service-name=web`
注意: 空なら、selector が合っていないか、Pod が Ready ではありません。
関連: Service、readinessProbe

### Ingress
別名: Ingress コントローラー
試験: K8s
要約: HTTP の通信を、ホスト名やパスで Service に振り分けるリソースです。
クラスタの外からの HTTP と HTTPS の通信を、ホスト名やパスで Service に振り分けるリソースです。実際に通信を受けて動かすのは Ingress コントローラーで、これがないと何も起きません。
例: `pathType: Prefix`、`ingressClassName: nginx`、TLS の Secret
注意: Ingress コントローラーを入れないと動きません。Ingress NGINX は 2026 年 3 月に保守が終わりました。
関連: Gateway API、Service

### Gateway API
別名: HTTPRoute
試験: K8s
要約: Ingress の後継の、役割ごとに分けたリソースで通信を振り分ける仕組みです。
Ingress の後継の、外からの通信を管理する API です。GatewayClass(実装)、Gateway(入口)、HTTPRoute(振り分けのルール)と、役割ごとにリソースが分かれています。重みで通信の割合も決められます。
例: GatewayClass、Gateway、HTTPRoute
注意: インフラの担当が Gateway を、アプリの担当が HTTPRoute を管理する、という分担ができます。
関連: Ingress

### CoreDNS
別名: Corefile
試験: K8s
要約: クラスタの中の DNS のサーバーです。
クラスタの中の DNS のサーバーです。`Service 名.Namespace.svc.cluster.local` の名前を解決します。設定(Corefile)は kube-system の ConfigMap `coredns` にあります。
例: `web.prod.svc.cluster.local`、ConfigMap `coredns` の Corefile
注意: NetworkPolicy で送信を止めると、DNS(53 番)も止まり、名前で接続できなくなります。
関連: DNS、Service

### ndots
試験: K8s
要約: 名前の中のドットが少ないと、検索用のドメインを付けて探す、DNS のクライアントの設定です。
名前の中のドットがこの数より少ないと、検索用のドメインを順に付けて問い合わせる、という DNS のクライアントの設定です。Pod の既定は 5 なので、外の名前を引くと余計な問い合わせが増えることがあります。
例: Pod の `/etc/resolv.conf` の `options ndots:5`
注意: 外の名前の最後に `.` を付けるか、`dnsConfig` で ndots を小さくすると、余計な問い合わせが減ります。
関連: CoreDNS、DNS

### NetworkPolicy
試験: K8s
要約: Pod の間の通信を、ラベルやアドレスで制限するリソースです。
Pod の間の通信を、ラベルや Namespace で許可するルールです。ある Pod を選ぶポリシーができると、その Pod には許可した通信しか届かなくなります。守らせるのは CNI プラグインです。
例: `podSelector: {}` と `policyTypes: [Ingress]` で全部の受信を拒否
注意: 対応した CNI が必要です。kind の既定の CNI は NetworkPolicy に対応していません。
関連: CNI プラグイン、ラベル

## ストレージ

### emptyDir
別名: hostPath
試験: K8s
要約: Pod が動いている間だけ使える、一時的なボリュームです。
emptyDir は、Pod と同じ寿命の空のボリュームで、Pod のコンテナ同士でファイルを共有するのに使います。hostPath はノードのディレクトリをそのまま見せるボリュームで、危険なので普通のアプリでは使いません。
例: 同じ Pod のコンテナの間でファイルを共有する、`medium: Memory`
注意: Pod が消えると中身も消えます。
関連: ボリューム

### PV
別名: PersistentVolume
試験: K8s
要約: クラスタで使える、実際のストレージを表すリソースです。
クラスタで使える、実際のストレージ(容量、アクセスモード、場所)を表すリソースです。管理者が作るか、StorageClass で自動で作られます。
例: `capacity: 10Gi`、`accessModes`、`persistentVolumeReclaimPolicy`
注意: PV はクラスタのリソースで、Namespace に属しません。
関連: PVC、StorageClass

### PVC
別名: PersistentVolumeClaim
試験: K8s
要約: Pod が使うストレージを、大きさとアクセスモードで要求するリソースです。
「この容量とモードのストレージがほしい」という要求のリソースです。条件に合う PV と 1 対 1 で結び付き(Bound)、Pod は PVC を名前で指定して使います。
例: `resources.requests.storage: 10Gi`、Pod の `persistentVolumeClaim.claimName`
注意: Pending のままなら、StorageClass の名前や、合う PV があるかを確かめます。
関連: PV、StorageClass、アクセスモード

### StorageClass
別名: 動的プロビジョニング
試験: K8s
要約: PVC に合わせて、PV を自動で作るための設定です。
PVC が作られたときに、どの CSI ドライバーで、どんなディスクを自動で作るかを決めるリソースです。
例: `provisioner: ebs.csi.aws.com`、`volumeBindingMode: WaitForFirstConsumer`
注意: 既定の StorageClass がないと、`storageClassName` を書かない PVC は Pending のままです。
関連: PVC、PV

### アクセスモード
別名: ReadWriteOnce、ReadWriteMany
試験: K8s
要約: ボリュームを、どのノードから読み書きできるかの決まりです。
ボリュームをどうマウントできるかです。ReadWriteOnce(RWO)は 1 つのノードから読み書き、ReadWriteMany(RWX)は多くのノードから読み書き、ReadWriteOncePod は 1 つの Pod だけです。
例: ReadWriteOnce(RWO)、ReadOnlyMany(ROX)、ReadWriteMany(RWX)、ReadWriteOncePod
注意: EBS のようなブロックのストレージは、普通 RWO だけです。複数のノードから書くなら EFS などを使います。
関連: PVC

### reclaimPolicy
別名: Retain、回収の方針
試験: K8s
要約: PVC を消したときに、PV と中のデータをどうするかの決まりです。
PVC を消したときに、PV と実際のディスクをどうするかの設定です。Delete は一緒に消し(動的プロビジョニングの既定)、Retain はデータを残します。
例: Delete(動的プロビジョニングの既定)、Retain(残す)
注意: 大事なデータの StorageClass は Retain にし、誤って消してもデータを残します。
関連: PV、PVC

### VolumeSnapshot
試験: K8s
要約: PVC の中身のスナップショットを取るリソースです。
PVC の中身のスナップショットを取るための Kubernetes のリソースです。CSI のドライバーが対応している必要があります。
例: VolumeSnapshotClass、`dataSource` でスナップショットから PVC を作る
注意: CSI のドライバーと snapshot-controller が対応している必要があります。
関連: CRI、PVC

### Velero
試験: K8s
要約: Kubernetes のリソースとボリュームをまとめてバックアップし、復元する道具です。
Kubernetes のリソースとボリュームを、まとめてバックアップし、別のクラスタにも復元できる道具です。
例: `velero backup create prod-daily --include-namespaces prod`
注意: etcd のバックアップはクラスタ全体、Velero は Namespace やアプリの単位で戻せます。
関連: etcd、VolumeSnapshot

## セキュリティと権限

### RBAC
別名: ロールベースのアクセス制御、Role、ClusterRole、RoleBinding、ClusterRoleBinding
試験: K8s
要約: 誰が何をしてよいかを、Role と RoleBinding で決める仕組みです。
Kubernetes の認可の仕組みです。Role(Namespace の中の権限)や ClusterRole(クラスタ全体の権限)を作り、RoleBinding や ClusterRoleBinding でユーザーや ServiceAccount に結び付けます。許可だけを書きます。
例: `kubectl create role pod-reader --verb=get,list --resource=pods`、`kubectl auth can-i`
注意: 許可だけを書きます。拒否の規則はありません。
関連: 認可、ServiceAccount

### Pod Security Admission
別名: Pod Security Standards、PSA
試験: K8s
要約: Namespace のラベルで、Pod の安全の基準を強制する仕組みです。
Namespace のラベルで、Pod の安全の基準(privileged、baseline、restricted)を守らせる仕組みです。古い PodSecurityPolicy の代わりです。
例: `pod-security.kubernetes.io/enforce: restricted`
注意: 基準は privileged、baseline、restricted の 3 つです。PSP は v1.25 で削除されました。
関連: securityContext

### securityContext
試験: K8s
要約: Pod やコンテナの、実行するユーザーや権限の設定です。
Pod やコンテナを動かすユーザー、権限の昇格の禁止、ケーパビリティ、読み取り専用のファイルシステムなどを決める設定です。
例: `runAsNonRoot: true`、`readOnlyRootFilesystem: true`、`allowPrivilegeEscalation: false`
注意: restricted の基準を満たすには、ケーパビリティを `drop: ["ALL"]` にします。
関連: Pod Security Admission、ケーパビリティ

### IRSA
別名: EKS Pod Identity
試験: K8s、SAA
要約: EKS で、Pod ごとに IAM ロールを使えるようにする仕組みです。
EKS で、ServiceAccount に IAM ロールを結び付け、Pod に一時的な AWS の認証情報を渡す仕組みです。アクセスキーを Pod に置かずに済みます。
例: ServiceAccount の注釈 `eks.amazonaws.com/role-arn`、EKS Pod Identity
注意: ノードの IAM ロールに広い権限を付けると、ノードのすべての Pod がその権限を持ってしまいます。
関連: ServiceAccount、IAM ロール

## スケールと運用

### HPA
別名: HorizontalPodAutoscaler
試験: K8s
要約: 負荷に合わせて、Pod の数を自動で増やしたり減らしたりする仕組みです。
CPU の使用率などに合わせて、Pod の数を自動で増やしたり減らしたりするリソースです。metrics-server と、Pod の requests が必要です。
例: `kubectl autoscale deployment web --cpu-percent=60 --min=2 --max=10`
注意: 使用率は requests に対する割合なので、requests を書かないと計算できません。
関連: スケーリング、requests、metrics-server

### VPA
別名: VerticalPodAutoscaler
試験: K8s
要約: 使用量に合わせて、Pod の requests と limits を自動で変える仕組みです。
Pod の実際の使用量から、requests と limits の適切な値を推奨したり、自動で変えたりする仕組みです。
例: `updateMode: "Off"` で推奨の値だけを見る
注意: 同じ指標(CPU)で HPA と一緒に使うと、互いに打ち消し合います。
関連: requests、HPA

### metrics-server
試験: K8s
要約: ノードと Pod の CPU とメモリの使用量を集める部品です。
各ノードの kubelet から、今の CPU とメモリの使用量を集める部品です。`kubectl top` と HPA で使います。長期間の履歴は持ちません。
例: `kubectl top nodes`、`kubectl top pods --sort-by=memory`
注意: 入っていないと `kubectl top` と HPA が使えません。
関連: HPA、Prometheus

### Cluster Autoscaler
別名: Karpenter
試験: K8s
要約: Pending の Pod があると、ノードを自動で足す仕組みです。
資源が足りずに Pending の Pod があるとノードを増やし、空いたノードを減らす仕組みです。Karpenter は、Pod に合うインスタンスの種類を選んでノードを直接作ります。
例: Cluster Autoscaler、Karpenter
注意: HPA は Pod の数、Cluster Autoscaler はノードの数を変えます。
関連: HPA、スケーリング

### Helm
別名: チャート
試験: K8s
要約: Kubernetes のマニフェストを、チャートとしてまとめて配り、入れる道具です。
Kubernetes のマニフェストを、値で変えられるひな形(チャート)にまとめて配る道具です。`helm install` で入れ、`helm upgrade`、`helm rollback` で更新や戻しをします。
例: `helm install web bitnami/nginx -f values.yaml`、`helm upgrade`、`helm rollback web 2`
注意: `helm template` で、入れずに作られるマニフェストを確かめられます。
関連: Kustomize、マニフェスト

### Kustomize
試験: K8s
要約: マニフェストに、環境ごとの差分を重ねて組み立てる道具です。
元のマニフェスト(base)に、環境ごとの差分(overlay)を重ねて組み立てる道具です。`kubectl apply -k` で使えます。
例: `kubectl apply -k overlays/prod`、`kustomization.yaml`
注意: テンプレートの変数を使わず、元の YAML に上書きを重ねる考え方です。
関連: Helm、マニフェスト

### CRD
別名: CustomResourceDefinition、カスタムリソース
試験: K8s
要約: Kubernetes に新しい種類のリソースを追加する仕組みです。
Kubernetes に、新しい種類のリソースを足す仕組みです。CRD を入れると、`kubectl get` などで普通のリソースと同じように扱えます。
例: `kubectl get crd`、`kubectl get certificates -A`
注意: CRD だけでは保存するだけで、処理するのはコントローラーです。
関連: オペレーター

### オペレーター
別名: Operator
試験: K8s
要約: CRD とコントローラーで、運用の手順を自動にする仕組みです。
CRD と、それを扱うコントローラーを組み合わせて、データベースなどの運用の手順(構築、バックアップ、復旧)を自動にする仕組みです。
例: データベースのオペレーター(構築、バックアップ、フェイルオーバー)、cert-manager
注意: オペレーターの不具合はクラスタ全体に影響するので、版と権限を管理します。
関連: CRD

### GitOps
別名: Argo CD、Flux
試験: K8s
要約: Git に書いた状態を正として、クラスタを自動で合わせる運用の方法です。
クラスタのあるべき状態を Git に置き、クラスタの中のツール(Argo CD、Flux)が Git と同じ状態に合わせ続ける運用です。変更はプルリクエストで行い、手作業の変更(ドリフト)は自動で戻せます。
例: Argo CD、Flux
注意: クラスタを手で変えても、Git の状態に戻されます。変更は Git から行います。
関連: Git、ドリフト、CI/CD

### OpenCost
別名: Kubecost
試験: K8s
要約: Kubernetes の費用を、Namespace やチームごとに見えるようにする道具です。
Kubernetes の費用を、Namespace や Deployment ごとに分けて見えるようにする道具です。requests と使用量から費用を割り振ります。
例: OpenCost、Kubecost
注意: 費用は requests から割り振るので、requests が大きすぎると無駄が見えます。
関連: requests、コストの最適化
