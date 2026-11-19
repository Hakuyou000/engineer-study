# 用語集 コンテナと Kubernetes

### コンテナ
試験: Docker、K8s
アプリと、その動作に必要なライブラリや設定をまとめ、ほかから分離して動かす仕組みです。ホストのカーネルを共有するので、仮想マシンより軽く、すぐに起動します。
関連: イメージ、namespace、cgroups、仮想マシン

### namespace
別名: 名前空間(Linux)
試験: Docker
Linux のカーネルの機能で、プロセスごとに見えるもの(プロセスの一覧、ネットワーク、ファイルシステム、ホスト名)を分けます。コンテナの分離の土台です。Kubernetes の Namespace とは別のものです。
関連: コンテナ、cgroups

### cgroups
別名: コントロールグループ
試験: Docker、K8s
Linux のカーネルの機能で、プロセスが使える CPU やメモリの量を制限します。コンテナの資源の上限は、これで実現されています。
関連: コンテナ、namespace、limits

### Docker
試験: Docker
コンテナのイメージを作り、配り、動かすための道具です。`docker` コマンド(クライアント)が、Docker デーモン(dockerd)に命令を送ります。
関連: コンテナ、イメージ、Docker デーモン

### Docker デーモン
別名: dockerd、Docker Engine
試験: Docker
イメージ、コンテナ、ネットワーク、ボリュームを管理する、Docker の本体のプロセスです。`/var/run/docker.sock` で命令を受けます。このソケットを触れると、ホストの root と同じことができます。
関連: Docker、containerd

### containerd
別名: runc
試験: Docker、K8s
コンテナを実際に動かすランタイムです。containerd がイメージとコンテナの管理をし、runc が namespace と cgroups を設定してプロセスを起動します。Kubernetes は CRI を通して containerd を使います。
関連: CRI、Docker デーモン

### OCI
別名: Open Container Initiative
試験: Docker
コンテナのイメージの形式と、ランタイムの標準を決めている団体と規格です。この規格のおかげで、Docker で作ったイメージを Kubernetes や Podman でも使えます。
関連: イメージ

### イメージ
別名: コンテナイメージ
試験: Docker、K8s
コンテナを作るための、読み取り専用のひな形です。複数のレイヤーが重なってできています。1 つのイメージから、いくつでもコンテナを作れます。
関連: レイヤー、Dockerfile、レジストリ、タグ

### レイヤー
別名: 層
試験: Docker
イメージを作る、変更の差分の層です。Dockerfile の命令ごとに作られ、同じ層は共有され、ビルドのキャッシュにも使われます。前の層に入ったファイルは、後の層で消しても大きさが減りません。
関連: イメージ、ビルドキャッシュ

### Dockerfile
試験: Docker
イメージの作り方を書いたファイルです。`FROM`(元のイメージ)、`RUN`(コマンドの実行)、`COPY`(ファイルの追加)、`CMD`(起動のコマンド)などの命令を並べます。
関連: イメージ、マルチステージビルド、ビルドキャッシュ

### ビルドキャッシュ
試験: Docker
前のビルドの層を再利用して、ビルドを速くする仕組みです。ある命令の内容や入力が変わると、それより後の命令はキャッシュが使えなくなるので、変わりにくいものを先に書きます。
関連: レイヤー、Dockerfile

### マルチステージビルド
試験: Docker
1 つの Dockerfile に複数の `FROM` を書き、ビルドに使う道具は最終のイメージに入れず、できたものだけをコピーする方法です。イメージが小さくなり、脆弱性も減ります。
関連: Dockerfile、distroless

### distroless
試験: Docker
シェルもパッケージマネージャーも入れず、アプリの実行に必要なものだけを入れた、とても小さいベースイメージです。攻撃に使えるものが少なく安全ですが、中に入って調べにくくなります。
関連: マルチステージビルド

### レジストリ
別名: コンテナレジストリ
試験: Docker、K8s
イメージを保存して配るサーバーです。Docker Hub、Amazon ECR、GitHub Container Registry などがあります。同じ名前のイメージの集まりをリポジトリと呼びます。
関連: イメージ、タグ、ECR

### タグ
別名: イメージタグ
試験: Docker、K8s
イメージの名前の `:` の後ろの部分です(`nginx:1.27` の `1.27`)。付け替えられるので、同じタグでも中身が変わることがあります。`latest` は最新の保証がない、省略したときの名前です。
関連: ダイジェスト(イメージ)、イメージ

### ダイジェスト(イメージ)
別名: イメージダイジェスト
試験: Docker、K8s
イメージの中身から計算したハッシュ値(`@sha256:…`)です。中身が変われば必ず変わるので、まったく同じイメージを指定できます。
関連: タグ、ハッシュ

### イメージの署名
別名: Cosign、Sigstore、Notation
試験: Docker、K8s
イメージに電子署名を付け、デプロイの前に、信頼できる人が作った改ざんのないイメージかを確かめることです。今は Sigstore(Cosign)や Notation を使います。
関連: 電子署名、イメージ

### SBOM
別名: ソフトウェア部品表
試験: Docker
ソフトウェアに含まれる部品(ライブラリとバージョン)の一覧です。新しい脆弱性が見つかったときに、影響を受けるものをすぐに探せます。
関連: 脆弱性スキャン

### ボリューム
別名: 名前付きボリューム
試験: Docker、K8s
コンテナを消しても残る、データの置き場所です。Docker では名前付きボリュームやバインドマウント、Kubernetes では emptyDir や PVC などを使います。
関連: バインドマウント、PVC

### バインドマウント
試験: Docker
ホストのディレクトリやファイルを、そのままコンテナの中に見せる仕組みです。開発でソースコードをすぐ反映するのに便利ですが、ファイルの持ち主(UID)の違いに注意します。
関連: ボリューム

### Docker Compose
別名: Compose、compose.yaml
試験: Docker
複数のコンテナ(Web、データベースなど)の構成を `compose.yaml` に書き、`docker compose up` でまとめて起動する道具です。サービスの名前で、互いに通信できます。
関連: Docker、YAML

### Kubernetes
別名: K8s
試験: K8s
多数のコンテナを、複数のサーバー(ノード)の上で自動で配置し、増やし、直す、コンテナのオーケストレーションの仕組みです。あるべき状態を宣言すると、今の状態をそれに近づけ続けます。
関連: クラスタ、Pod、宣言的

### クラスタ
別名: Kubernetes クラスタ
試験: K8s
Kubernetes の、コントロールプレーンと、アプリを動かすワーカーノードの集まりです。
関連: コントロールプレーン、ワーカーノード

### コントロールプレーン
試験: K8s
クラスタの頭脳にあたる部品の集まりです。API サーバー、etcd、スケジューラー、コントローラーマネージャーがあります。
関連: kube-apiserver、etcd、kube-scheduler

### ワーカーノード
別名: ノード(Kubernetes)
試験: K8s
Pod を実際に動かすサーバーです。kubelet、kube-proxy、コンテナランタイムが動いています。
関連: kubelet、kube-proxy

### kube-apiserver
別名: API サーバー
試験: K8s
Kubernetes のすべての操作の入口です。認証と認可をしてから、etcd に読み書きします。kubectl も、ほかの部品も、すべてここを通します。
関連: etcd、kubectl

### etcd
試験: K8s
Kubernetes のクラスタのすべての状態を保存する、キーバリューストア(キーと値の組でデータを保存するデータベース)です。失うとクラスタの定義を失うので、スナップショットでバックアップします。台数は奇数にします。
関連: kube-apiserver、バックアップ

### kube-scheduler
別名: スケジューラー
試験: K8s
まだノードが決まっていない Pod に、資源の空き(requests)や条件(taint、affinity)を見て、置くノードを決める部品です。
関連: requests、taint

### kubelet
試験: K8s
各ノードで動き、割り当てられた Pod をコンテナランタイムで起動し、状態を API サーバーに報告するエージェントです。systemd のサービスとして動きます。
関連: ワーカーノード、静的 Pod、CRI

### kube-proxy
試験: K8s
各ノードで、Service の仮想 IP への通信を Pod に振り分けるルール(iptables など)を作る部品です。
関連: Service、iptables

### CRI
別名: CNI、CSI
試験: K8s
Kubernetes と外の部品をつなぐ標準のインターフェースです。CRI はコンテナランタイム、CNI はネットワーク(Pod の IP と通信)、CSI はストレージをつなぎます。
関連: containerd、CNI プラグイン

### CNI プラグイン
試験: K8s
Pod に IP アドレスを付け、ノードをまたいだ Pod の通信を作る部品です。Calico、Cilium、Flannel などがあります。入れるまでノードは NotReady のままです。NetworkPolicy に対応しないものもあります。
関連: CRI、NetworkPolicy

### kubectl
試験: K8s
Kubernetes を操作するコマンドです。`kubectl get`、`describe`、`apply`、`logs` などを使います。どのクラスタを操作するかは kubeconfig のコンテキストで決まります。
関連: kubeconfig、kube-apiserver

### kubeconfig
別名: コンテキスト
試験: K8s
kubectl が使う、クラスタの場所、認証情報、既定の Namespace をまとめたファイルです(`~/.kube/config`)。その組み合わせをコンテキストと呼び、`kubectl config use-context` で切り替えます。
関連: kubectl

### kubeadm
試験: K8s
Kubernetes のクラスタを作り(`kubeadm init`、`kubeadm join`)、アップグレードするための道具です。コントロールプレーンの部品は静的 Pod として動かします。
関連: 静的 Pod、コントロールプレーン

### 静的 Pod
試験: K8s
API サーバーを通さず、kubelet がノードの `/etc/kubernetes/manifests/` の YAML を直接読んで動かす Pod です。kubeadm のクラスタのコントロールプレーンの部品はこれで動いています。kubectl で見えるものはミラー Pod と呼ばれる写しで、消しても作り直されます。
関連: kubelet、kubeadm

### マニフェスト
試験: K8s
Kubernetes のリソースを YAML で書いたファイルです。`apiVersion`、`kind`、`metadata`、`spec` を書き、`kubectl apply -f` で適用します。
関連: YAML、宣言的

### Namespace
別名: 名前空間(Kubernetes)
試験: K8s
クラスタの中を、チームや環境ごとに区切る単位です。名前の重複を避け、権限(RBAC)や資源の上限(ResourceQuota)を Namespace ごとに決めます。
関連: RBAC、ResourceQuota

### ラベル
別名: selector、セレクター
試験: K8s
リソースに付ける「キー=値」の印です(`app=web`)。Service や Deployment は、selector でラベルの合う Pod を選びます。ラベルが合わないと、Service のエンドポイントが空になります。
関連: Service、Deployment

### Pod
試験: K8s
Kubernetes でコンテナを動かす最小の単位です。1 つ以上のコンテナが、IP アドレスとボリュームを共有します。作り直されると IP アドレスが変わります。
関連: Deployment、Service

### Deployment
別名: ReplicaSet
試験: K8s
指定した数の Pod を動かし続け、イメージの更新をローリングアップデートで行うリソースです。実際の Pod の数は、Deployment が作る ReplicaSet が保ちます。
関連: Pod、ローリングアップデート

### StatefulSet
試験: K8s
データベースのように、Pod ごとに決まった名前(`db-0`、`db-1`)と専用のストレージが必要なアプリのためのリソースです。
関連: PVC、ヘッドレス Service

### DaemonSet
試験: K8s
すべての(または選んだ)ノードに、Pod を 1 つずつ動かすリソースです。ログの収集や監視のエージェント、CNI のプラグインに使います。
関連: ワーカーノード

### Job
別名: CronJob
試験: K8s
終わるまで実行する処理のためのリソースです。Job は 1 回、CronJob は決まった時刻ごとに Job を作ります。
関連: cron

### ConfigMap
試験: K8s
設定の値やファイルを、イメージの外に置くためのリソースです。環境変数やファイルとして Pod に渡します。
関連: Secret、環境変数

### Secret
試験: K8s
パスワードなどの秘密情報を Pod に渡すためのリソースです。値は Base64 で書かれているだけで暗号化ではないので、RBAC で読める人を絞り、etcd の暗号化を有効にします。
関連: ConfigMap、秘密情報

### ServiceAccount
試験: K8s
Pod が Kubernetes の API を使うときの ID です。RBAC で権限を与えます。クラウドの権限(IAM ロール)と結び付けることもできます。
関連: RBAC、IRSA

### RBAC
別名: ロールベースのアクセス制御、Role、ClusterRole、RoleBinding、ClusterRoleBinding
試験: K8s
Kubernetes の認可の仕組みです。Role(Namespace の中の権限)や ClusterRole(クラスタ全体の権限)を作り、RoleBinding や ClusterRoleBinding でユーザーや ServiceAccount に結び付けます。許可だけを書きます。
関連: 認可、ServiceAccount

### Service
試験: K8s
ラベルで選んだ Pod の集まりに、変わらない仮想の IP アドレスと DNS の名前を与え、通信を振り分けるリソースです。種類に ClusterIP(既定、クラスタの中だけ)、NodePort、LoadBalancer があります。
関連: kube-proxy、EndpointSlice、ラベル

### ヘッドレス Service
試験: K8s
仮想の IP アドレスを持たない(`clusterIP: None`)Service です。DNS で各 Pod の IP アドレスを直接返すので、StatefulSet で Pod ごとの名前を使うときに必要です。
関連: Service、StatefulSet

### EndpointSlice
別名: エンドポイント
試験: K8s
Service の振り分け先になる、Ready の Pod の IP アドレスとポートの一覧です。空なら、selector とラベルが合っていないか、Pod が Ready ではありません。
関連: Service、readinessProbe

### Ingress
別名: Ingress コントローラー
試験: K8s
クラスタの外からの HTTP と HTTPS の通信を、ホスト名やパスで Service に振り分けるリソースです。実際に通信を受けて動かすのは Ingress コントローラーで、これがないと何も起きません。
関連: Gateway API、Service

### Gateway API
別名: HTTPRoute
試験: K8s
Ingress の後継の、外からの通信を管理する API です。GatewayClass(実装)、Gateway(入口)、HTTPRoute(振り分けのルール)と、役割ごとにリソースが分かれています。重みで通信の割合も決められます。
関連: Ingress

### CoreDNS
別名: Corefile
試験: K8s
クラスタの中の DNS のサーバーです。`Service 名.Namespace.svc.cluster.local` の名前を解決します。設定(Corefile)は kube-system の ConfigMap `coredns` にあります。
関連: DNS、Service

### NetworkPolicy
試験: K8s
Pod の間の通信を、ラベルや Namespace で許可するルールです。ある Pod を選ぶポリシーができると、その Pod には許可した通信しか届かなくなります。守らせるのは CNI プラグインです。
関連: CNI プラグイン、ラベル

### PV
別名: PersistentVolume
試験: K8s
クラスタで使える、実際のストレージ(容量、アクセスモード、場所)を表すリソースです。管理者が作るか、StorageClass で自動で作られます。
関連: PVC、StorageClass

### PVC
別名: PersistentVolumeClaim
試験: K8s
「この容量とモードのストレージがほしい」という要求のリソースです。条件に合う PV と 1 対 1 で結び付き(Bound)、Pod は PVC を名前で指定して使います。
関連: PV、StorageClass、アクセスモード

### StorageClass
別名: 動的プロビジョニング
試験: K8s
PVC が作られたときに、どの CSI ドライバーで、どんなディスクを自動で作るかを決めるリソースです。
関連: PVC、PV

### アクセスモード
別名: ReadWriteOnce、ReadWriteMany
試験: K8s
ボリュームをどうマウントできるかです。ReadWriteOnce(RWO)は 1 つのノードから読み書き、ReadWriteMany(RWX)は多くのノードから読み書き、ReadWriteOncePod は 1 つの Pod だけです。
関連: PVC

### requests
別名: リソース要求
試験: K8s
コンテナが必要とする CPU とメモリの量の申告です。スケジューラーは、ノードの requests の合計で空きを判断します。HPA の使用率の計算の基準にもなります。
関連: limits、kube-scheduler、HPA

### limits
別名: リソース制限
試験: K8s、Docker
コンテナが使える CPU とメモリの上限です。メモリの上限を超えると OOMKilled で強制終了され、CPU の上限を超えると速度が抑えられます(スロットリング)。
関連: requests、OOMKilled、cgroups

### OOMKilled
別名: OOM
試験: K8s、Docker
メモリの上限を超えて、カーネルにプロセスを強制終了されたことです。終了ステータスは 137 になります。
関連: limits、終了ステータス

### QoS クラス
試験: K8s
requests と limits の決め方による、Pod の区分です。Guaranteed(全コンテナで requests と limits が同じ)、Burstable、BestEffort(何も決めていない)があり、資源が足りないときは BestEffort から追い出されます。
関連: requests、limits

### taint
別名: toleration
試験: K8s
ノードに付けて、合う toleration を持たない Pod を置かせないようにする印です。toleration は「置いてもよい」という許可で、そのノードに引き寄せはしません。
関連: kube-scheduler、nodeAffinity

### nodeAffinity
別名: nodeSelector、affinity
試験: K8s
Pod を、決まったラベルのノードに置くための条件です。簡単な条件は nodeSelector で書けます。
関連: taint、ラベル

### livenessProbe
試験: K8s
コンテナが生きているかを確かめる仕組みです。続けて失敗すると、kubelet がコンテナを再起動します。
関連: readinessProbe、startupProbe

### readinessProbe
試験: K8s
コンテナが通信を受けられる状態かを確かめる仕組みです。失敗すると、Service の振り分け先から外されます(再起動はしません)。
関連: livenessProbe、EndpointSlice

### startupProbe
試験: K8s
起動が終わったかを確かめる仕組みです。成功するまで、liveness と readiness の確認を止めるので、起動の遅いアプリが再起動され続けるのを防げます。
関連: livenessProbe

### 初期化コンテナ
別名: initContainers、サイドカー
試験: K8s
メインのコンテナの前に、順番に実行して終わるコンテナです。依存先を待つ、設定を用意するなどに使います。`restartPolicy: Always` を付けると、メインと一緒に動き続けるサイドカーになります。
関連: Pod

### ローリングアップデート
試験: K8s、SAA
古い Pod(サーバー)を少しずつ新しいものに入れ替える更新の方法です。止まる時間を作らずに更新できます。`maxSurge` と `maxUnavailable` で、入れ替えの速さを決めます。
関連: Deployment、ロールバック

### ロールバック
試験: K8s、Terraform
問題のあった変更を、前の正常な版に戻すことです。Deployment は `kubectl rollout undo`、Helm は `helm rollback` で戻します。
関連: ローリングアップデート

### HPA
別名: HorizontalPodAutoscaler
試験: K8s
CPU の使用率などに合わせて、Pod の数を自動で増やしたり減らしたりするリソースです。metrics-server と、Pod の requests が必要です。
関連: スケーリング、requests、metrics-server

### metrics-server
試験: K8s
各ノードの kubelet から、今の CPU とメモリの使用量を集める部品です。`kubectl top` と HPA で使います。長期間の履歴は持ちません。
関連: HPA、Prometheus

### Cluster Autoscaler
別名: Karpenter
試験: K8s
資源が足りずに Pending の Pod があるとノードを増やし、空いたノードを減らす仕組みです。Karpenter は、Pod に合うインスタンスの種類を選んでノードを直接作ります。
関連: HPA、スケーリング

### Helm
別名: チャート
試験: K8s
Kubernetes のマニフェストを、値で変えられるひな形(チャート)にまとめて配る道具です。`helm install` で入れ、`helm upgrade`、`helm rollback` で更新や戻しをします。
関連: Kustomize、マニフェスト

### Kustomize
試験: K8s
元のマニフェスト(base)に、環境ごとの差分(overlay)を重ねて組み立てる道具です。`kubectl apply -k` で使えます。
関連: Helm、マニフェスト

### CRD
別名: CustomResourceDefinition、カスタムリソース
試験: K8s
Kubernetes に、新しい種類のリソースを足す仕組みです。CRD を入れると、`kubectl get` などで普通のリソースと同じように扱えます。
関連: オペレーター

### オペレーター
別名: Operator
試験: K8s
CRD と、それを扱うコントローラーを組み合わせて、データベースなどの運用の手順(構築、バックアップ、復旧)を自動にする仕組みです。
関連: CRD

### PodDisruptionBudget
別名: PDB
試験: K8s
ノードの drain のような計画的な中断のときに、同時に止めてよい Pod の数を制限するリソースです。ノードの故障のような計画外の停止は防げません。
関連: drain

### drain
別名: cordon
試験: K8s
保守のために、ノードの Pod を退避させることです(`kubectl drain`)。cordon は新しい Pod を置かないようにするだけで、今の Pod は残ります。終わったら uncordon で戻します。
関連: PodDisruptionBudget

### Pod Security Admission
別名: Pod Security Standards、PSA
試験: K8s
Namespace のラベルで、Pod の安全の基準(privileged、baseline、restricted)を守らせる仕組みです。古い PodSecurityPolicy の代わりです。
関連: securityContext

### securityContext
試験: K8s
Pod やコンテナを動かすユーザー、権限の昇格の禁止、ケーパビリティ、読み取り専用のファイルシステムなどを決める設定です。
関連: Pod Security Admission、ケーパビリティ

### IRSA
別名: EKS Pod Identity
試験: K8s、SAA
EKS で、ServiceAccount に IAM ロールを結び付け、Pod に一時的な AWS の認証情報を渡す仕組みです。アクセスキーを Pod に置かずに済みます。
関連: ServiceAccount、IAM ロール

### GitOps
別名: Argo CD、Flux
試験: K8s
クラスタのあるべき状態を Git に置き、クラスタの中のツール(Argo CD、Flux)が Git と同じ状態に合わせ続ける運用です。変更はプルリクエストで行い、手作業の変更(ドリフト)は自動で戻せます。
関連: Git、ドリフト、CI/CD

### ENTRYPOINT
別名: CMD
試験: Docker
コンテナが起動したときに実行するコマンドを決める Dockerfile の命令です。両方書くと、ENTRYPOINT がコマンド、CMD が既定の引数になります。`docker run` の後ろに書いた引数は CMD を置き換えます。
関連: Dockerfile、PID 1

### ポートの公開
別名: -p、EXPOSE
試験: Docker
`docker run -p 8080:80` のように、ホストのポートをコンテナのポートにつなぐことです。Dockerfile の `EXPOSE` は説明の印だけで、公開はしません。
関連: ポート番号

### bridge ネットワーク
別名: ユーザー定義ネットワーク、docker0
試験: Docker
1 台のホストの中で、コンテナ同士をつなぐ Docker のネットワークです。自分で作ったネットワーク(ユーザー定義)では、コンテナの名前で相手を引けます。既定の bridge(docker0)では引けません。
関連: Docker Compose

### tmpfs
試験: Docker
メモリの上に置く、一時的なファイルの置き場所です。コンテナが止まると消えます。ディスクに書きたくないデータに使います。
関連: ボリューム

### ロギングドライバー
別名: json-file
試験: Docker
コンテナのログの保存先や形式を決める仕組みです。既定の json-file はホストのファイルに書きますが、そのままでは増え続けるので、`max-size` と `max-file` で上限を決めます。
関連: ログローテーション、標準出力

### 再起動ポリシー
別名: --restart、unless-stopped
試験: Docker
コンテナが止まったときに、自動で起動し直すかの設定です。`no`、`on-failure`、`always`、`unless-stopped`(手で止めたものは起動しない)があります。
関連: Docker デーモン

### ビルドコンテキスト
別名: .dockerignore
試験: Docker
`docker build` に渡すディレクトリで、`COPY` できるファイルの範囲です。`.dockerignore` に書いたものは送られないので、秘密のファイルを入れず、ビルドも速くできます。
関連: Dockerfile

### rootless モード
別名: rootless
試験: Docker
Docker デーモンを root 以外のユーザーで動かす方式です。コンテナから抜け出されても、ホストの root を取られません。
関連: root、Docker デーモン

### kube-controller-manager
別名: コントローラーマネージャー
試験: K8s
Deployment、ReplicaSet、Node などのコントローラーをまとめて動かす部品です。コントローラーは、あるべき状態と今の状態を比べ、差をなくす動きを繰り返します(調整ループ)。
関連: コントロールプレーン、Deployment

### NodePort
別名: ClusterIP、LoadBalancer
試験: K8s
Service の種類です。ClusterIP(既定)はクラスタの中だけで使えます。NodePort は全ノードの決まったポート(30000〜32767)で外から受けます。LoadBalancer はクラウドのロードバランサーを作ります。
関連: Service

### emptyDir
別名: hostPath
試験: K8s
emptyDir は、Pod と同じ寿命の空のボリュームで、Pod のコンテナ同士でファイルを共有するのに使います。hostPath はノードのディレクトリをそのまま見せるボリュームで、危険なので普通のアプリでは使いません。
関連: ボリューム

### reclaimPolicy
別名: Retain、回収の方針
試験: K8s
PVC を消したときに、PV と実際のディスクをどうするかの設定です。Delete は一緒に消し(動的プロビジョニングの既定)、Retain はデータを残します。
関連: PV、PVC

### ResourceQuota
別名: LimitRange
試験: K8s
ResourceQuota は、Namespace 全体で使える CPU、メモリ、Pod の数などの合計の上限です。LimitRange は、1 つのコンテナや Pod の既定値と、最小と最大を決めます。
関連: Namespace、requests

### PriorityClass
別名: プリエンプション
試験: K8s
Pod の優先度を決めるリソースです。資源が足りないとき、優先度の高い Pod のために、低い Pod を追い出すことがあります(プリエンプション)。
関連: kube-scheduler

### topologySpreadConstraints
試験: K8s
同じアプリの Pod を、ゾーンやノードに均等に散らして置くための設定です。1 つのゾーンが止まっても、全部が止まらないようにします。
関連: アベイラビリティーゾーン、冗長化

### VPA
別名: VerticalPodAutoscaler
試験: K8s
Pod の実際の使用量から、requests と limits の適切な値を推奨したり、自動で変えたりする仕組みです。
関連: requests、HPA

### CrashLoopBackOff
別名: ImagePullBackOff
試験: K8s
CrashLoopBackOff は、コンテナが起動してすぐ終わることを繰り返し、待ってから再起動している状態です。原因は `kubectl logs --previous` で見ます。ImagePullBackOff は、イメージの取得に失敗して待っている状態です。
関連: kubectl、イメージ

### Pending
別名: NotReady
試験: K8s
Pending は、Pod がまだノードに置かれていない(または準備中の)状態です。資源の不足、taint、PVC が多い原因で、`kubectl describe pod` の Events で理由が分かります。NotReady はノードが使えない状態で、kubelet や CNI を疑います。
関連: kube-scheduler、kubelet

### イベント
別名: Event、kubectl get events
試験: K8s
Kubernetes のリソースに起きた出来事の記録です(スケジュール、イメージの取得、probe の失敗など)。既定では 1 時間ほどしか残りません。
関連: Pending、kubectl

### エフェメラルコンテナ
別名: kubectl debug
試験: K8s
動いている Pod に、調べるために一時的に足すコンテナです。シェルのないイメージのコンテナを調べるのに使います。
関連: distroless

### crictl
試験: K8s
ノードで、CRI のコンテナランタイムを直接操作するコマンドです。API サーバーが止まって kubectl が使えないときに、`crictl ps -a` や `crictl logs` でコンテナを調べます。
関連: CRI、静的 Pod

### preStop
試験: K8s
コンテナを止める前に実行するフックです。数秒待って、Service の振り分けから外れるのを待つのによく使います。
関連: グレースフルシャットダウン

### CreateContainerConfigError
試験: K8s
コンテナを作る前の設定の段階で失敗した状態です。参照している ConfigMap や Secret、そのキーがないときによく起きます。`kubectl describe pod` のイベントで原因を見ます。
関連: ConfigMap、Secret、イベント

### Evicted
試験: K8s
ノードのメモリやディスクが足りなくなり、kubelet が Pod を追い出した状態です。追い出す順番は QoS クラスと使用量で決まります。
関連: kubelet、QoS クラス

### コントローラー
別名: 調整ループ、reconcile
試験: K8s
リソースのあるべき状態(spec)と今の状態(status)を見比べ、差を埋める操作を繰り返すプログラムです。Deployment や Job の動きも、それぞれのコントローラーが担います。
関連: kube-controller-manager、オペレーター

### Admission コントローラー
別名: アドミッションコントローラー、admission webhook
試験: K8s
API サーバーが、認証と認可の後、etcd に保存する前に、リクエストを確かめたり書き換えたりする仕組みです。Pod Security Admission や ResourceQuota の確認もこの段階で動きます。
関連: kube-apiserver、Pod Security Admission

### CSR(Kubernetes)
別名: CertificateSigningRequest、証明書署名要求
試験: K8s
ユーザーなどの証明書をクラスタの CA で署名してもらうための Kubernetes のリソースです。`kubectl certificate approve` で承認すると、署名された証明書を取り出せます。
関連: kubeconfig、RBAC

### jsonpath
試験: K8s
kubectl の出力から、決まった項目だけを取り出す書き方です。`kubectl get pod web -o jsonpath='{.status.podIP}'` のように使います。
関連: kubectl

### port-forward
試験: K8s
`kubectl port-forward` で、手元のポートを Pod や Service のポートにつなぐ機能です。外に公開していないアプリを、手元から確かめるのに使います。
関連: kubectl、Service

### ndots
試験: K8s
名前の中のドットがこの数より少ないと、検索用のドメインを順に付けて問い合わせる、という DNS のクライアントの設定です。Pod の既定は 5 なので、外の名前を引くと余計な問い合わせが増えることがあります。
関連: CoreDNS、DNS

### Pod のアフィニティ
別名: podAffinity、podAntiAffinity
試験: K8s
ほかの Pod がいるノード(またはゾーン)に、近づけたり(podAffinity)、離したり(podAntiAffinity)して Pod を置く設定です。レプリカを別々のノードに分けるのに使います。
関連: nodeAffinity、topologySpreadConstraints

### VolumeSnapshot
試験: K8s
PVC の中身のスナップショットを取るための Kubernetes のリソースです。CSI のドライバーが対応している必要があります。
関連: CRI、PVC

### Velero
試験: K8s
Kubernetes のリソースとボリュームを、まとめてバックアップし、別のクラスタにも復元できる道具です。
関連: etcd、VolumeSnapshot

### Sealed Secrets
別名: SOPS
試験: K8s
Secret を暗号化した形で Git に置けるようにする道具です。Sealed Secrets はクラスタの中のコントローラーが復号します。SOPS はファイルを KMS などの鍵で暗号化します。
関連: Secret、GitOps

### OpenCost
別名: Kubecost
試験: K8s
Kubernetes の費用を、Namespace や Deployment ごとに分けて見えるようにする道具です。requests と使用量から費用を割り振ります。
関連: requests、コストの最適化
