/** SRE を目指す学習の道のり。画面の「ロードマップ」に表示する。 */

export interface RoadmapItem {
  /** チェック状態の保存キー。公開後は変えない */
  id: string
  label: string
  detail?: string
}

export interface RoadmapCert {
  /** certs.ts の資格の ID。表紙へのリンクに使う */
  cert: string
  note: string
}

export interface RoadmapStage {
  id: string
  title: string
  summary: string
  items: RoadmapItem[]
  certs: RoadmapCert[]
  books: string[]
  /** この段階の終わりに手元に残したいもの */
  output: string
}

export const INTRO = [
  'SRE(Site Reliability Engineering)は、サービスの信頼性を数値(SLI / SLO)で決め、ソフトウェアの力で運用する仕事です。インフラの運用に加えて、アプリケーションに近い部分まで扱い、手作業をコードで自動化します。',
  '未経験からいきなり SRE の求人に応募するのは難しいことが多いです。まずインフラの運用や開発の仕事で経験を積み、そこから SRE に移るのが現実的な道のりです。',
  '下の段階を上から順に進めます。チェックはこのブラウザに保存されます。資格は知識の証明にはなりますが、実務の経験の代わりにはなりません。段階 2 以降は、手を動かして作ったもの(GitHub に置いたコードなど)が評価されます。',
]

export const STAGES: RoadmapStage[] = [
  {
    id: 's1',
    title: '段階 1 Linux の基礎',
    summary: 'サーバーの多くは Linux で動いています。コマンド、ファイル、権限、プロセス、ログ、シェルスクリプトを身につけます。',
    items: [
      { id: 's1-cli', label: 'コマンドでファイルとディレクトリを操作できる', detail: 'ls、cd、cp、mv、rm、find、grep、パイプとリダイレクト' },
      { id: 's1-perm', label: 'パーミッションと所有者を読み書きできる', detail: 'chmod、chown、umask。計算ドリルで練習できます' },
      { id: 's1-proc', label: 'プロセスとサービスを管理できる', detail: 'ps、top、kill、systemctl' },
      { id: 's1-log', label: 'ログを探して読める', detail: 'journalctl、/var/log、tail -f' },
      { id: 's1-sh', label: '簡単なシェルスクリプトを書ける', detail: '変数、if、for、引数、終了ステータス' },
      { id: 's1-user', label: 'ユーザー、cron、時刻同期を設定できる' },
    ],
    certs: [{ cert: 'linuc1', note: 'Linux の基礎。このアプリでは 102 の範囲を学べます' }],
    books: ['[試して理解]Linuxのしくみ 増補改訂版'],
    output: '自分で Linux の環境(仮想マシンや WSL)を作り、毎日触る',
  },
  {
    id: 's2',
    title: '段階 2 ネットワークの基礎',
    summary: 'サーバー同士やユーザーとの通信の仕組みを学びます。障害の調査では、ほとんどの場合ネットワークの知識が必要になります。',
    items: [
      { id: 's2-ip', label: 'IPv4 のサブネットを計算できる', detail: 'ネットワークアドレス、ブロードキャスト、ホスト数。計算ドリルで練習できます' },
      { id: 's2-tcp', label: 'TCP と UDP、主なポート番号を説明できる' },
      { id: 's2-dns', label: 'DNS の名前解決の流れとレコードの種類を説明できる' },
      { id: 's2-route', label: 'ルーティングテーブルを読み、パケットの行き先を答えられる' },
      { id: 's2-sw', label: 'VLAN、STP、ACL、NAT の役割を説明できる' },
      { id: 's2-trouble', label: 'ping、traceroute、ss などで通信の問題を切り分けられる' },
    ],
    certs: [{ cert: 'ccna', note: 'ネットワークの基礎。スイッチ、ルーティング、セキュリティ' }],
    books: ['マスタリングTCP/IP 入門編 第6版', 'Webを支える技術'],
    output: 'Packet Tracer などで小さなネットワークを組み、設定と確認のコマンドを試す',
  },
  {
    id: 's3',
    title: '段階 3 クラウドと Git、スクリプト',
    summary: '多くの会社がクラウドでサービスを動かしています。国内の求人で最も多い AWS の基本と、コードを管理する Git、自動化に使う Python を学びます。',
    items: [
      { id: 's3-aws', label: 'AWS の主なサービスの役割を説明できる', detail: 'VPC、EC2、IAM、S3、RDS、ELB、Auto Scaling' },
      { id: 's3-vpc', label: 'VPC とサブネットを設計できる', detail: 'パブリック / プライベート、ルートテーブル、セキュリティグループ' },
      { id: 's3-git', label: 'Git でコミット、ブランチ、プルリクエストを使える' },
      { id: 's3-py', label: 'Python で簡単な自動化のスクリプトを書ける' },
      { id: 's3-github', label: '書いたスクリプトを GitHub に公開する' },
    ],
    certs: [
      { cert: 'saa', note: 'クラウドの設計の基礎' },
      { cert: 'clf', note: '任意。SAA が難しく感じるときの前段' },
    ],
    books: ['入門 Python 3 第2版'],
    output: 'AWS の無料枠で、Web サーバーを1台動かしてみる。スクリプトを GitHub に置く',
  },
  {
    id: 's4',
    title: '段階 4 コンテナ、IaC、CI/CD',
    summary: 'アプリケーションをコンテナにまとめ、インフラをコードで作り、変更を自動でテスト・反映する仕組みを学びます。',
    items: [
      { id: 's4-docker', label: 'Docker でイメージを作り、コンテナを動かせる' },
      { id: 's4-tf', label: 'Terraform で AWS の環境を作り、変更・削除できる', detail: 'state、module、plan と apply' },
      { id: 's4-ansible', label: 'Ansible でサーバーの設定を自動化できる' },
      { id: 's4-ci', label: 'GitHub Actions でテストとデプロイを自動化できる' },
      { id: 's4-deploy', label: 'Blue/Green、Canary などのデプロイの方法を説明できる' },
    ],
    certs: [{ cert: 'terraform', note: 'IaC の基礎' }],
    books: ['仕組みと使い方がわかる Docker&Kubernetesのきほんのきほん', '詳解 Terraform 第3版'],
    output: 'Terraform で AWS 上に環境を作り、GitHub Actions から反映するリポジトリ',
  },
  {
    id: 's5',
    title: '段階 5 Kubernetes と監視',
    summary: 'たくさんのコンテナを動かす Kubernetes と、サービスの状態を見えるようにする監視(オブザーバビリティ)を学びます。',
    items: [
      { id: 's5-k8s', label: 'Kubernetes の Pod、Deployment、Service、Ingress を使える' },
      { id: 's5-rbac', label: 'Kubernetes の権限(RBAC)とシークレットを扱える' },
      { id: 's5-metrics', label: 'Prometheus でメトリクスを集め、Grafana で表示できる' },
      { id: 's5-o11y', label: 'メトリクス、ログ、トレースの違いを説明できる' },
      { id: 's5-alert', label: '意味のあるアラートを設計できる', detail: '鳴りすぎるアラートは無視されるようになります' },
    ],
    certs: [{ cert: 'cka', note: 'Kubernetes の運用。実技の試験で、SRE の求人で評価されやすい' }],
    books: ['入門 監視', 'Kubernetes完全ガイド 第2版', 'オブザーバビリティ・エンジニアリング'],
    output: '監視の付いた Kubernetes クラスタを作り、構成をリポジトリに置く',
  },
  {
    id: 's6',
    title: '段階 6 SRE の実践',
    summary: '信頼性を数値で決め、障害に備え、手作業を減らす、SRE ならではの考え方と方法を学びます。',
    items: [
      { id: 's6-slo', label: 'SLI、SLO、エラーバジェットを説明し、設計できる' },
      { id: 's6-incident', label: 'インシデント対応の流れと役割を説明できる', detail: 'オンコール、インシデントコマンダー、連絡と記録' },
      { id: 's6-postmortem', label: '非難しないポストモーテムを書ける' },
      { id: 's6-toil', label: 'トイル(繰り返しの手作業)を見つけて自動化できる' },
      { id: 's6-capacity', label: '負荷試験とキャパシティの計画ができる' },
      { id: 's6-go', label: 'Go で簡単なツールを書ける' },
    ],
    certs: [{ cert: 'devops-pro', note: '自動化、CI/CD、運用。実務の経験がある人向け' }],
    books: ['SREをはじめよう', 'サイトリライアビリティワークブック', 'システム障害対応の教科書', 'SLO サービスレベル目標'],
    output: '自分で作ったサービスに SLO を決め、ダッシュボードとポストモーテムの例を作る',
  },
]

export const OPTIONAL_CERTS: RoadmapCert[] = [
  { cert: 'cloudops', note: '旧 SysOps Administrator。AWS の運用に寄った資格' },
  { cert: 'linuc2', note: 'Linux をさらに深く学ぶとき' },
  { cert: 'linuc3', note: 'LinuC レベル2 の後に。仮想化と高可用性(3PS)か、セキュリティ(3SS)を深く学ぶとき' },
  { cert: 'itpassport', note: 'IT とビジネスの基礎を、技術の前に広く学ぶとき' },
  { cert: 'ipa', note: 'コンピューターサイエンスの基礎をまとめて学ぶとき' },
  { cert: 'gcp-devops', note: 'SRE の考え方が出題範囲。Google Cloud を使う職場向け' },
  { cert: 'ckad-cks', note: 'CKA の後に。CKS は CKA を持っていることが受験の条件' },
]

export const NON_TECH = [
  '障害のときに、状況を整理して分かりやすく報告する',
  '手順書やポストモーテムなどの文書を書く',
  '開発のチームと話し合い、信頼性と開発の速さのバランスを決める',
]

export const NOTE = '試験の内容や受験料は改定されることがあります。申し込む前に、それぞれの公式サイトで確認してください。'

/** その資格が載っている段階。必要に応じて取る資格なら null */
export const stageOfCert = (cert: string) => STAGES.find((s) => s.certs.some((c) => c.cert === cert)) ?? null

const KEY = 'sre-drill:roadmap'

export function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    const v: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

export function saveChecked(ids: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]))
  } catch {
    // 保存できなくても動作に支障はない
  }
}
