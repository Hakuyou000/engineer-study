/** 資格の表紙(概要ページ)の内容。ロードマップから開く。 */

export interface CertDomain {
  name: string
  /** 出題の割合(%)。公表されていなければ省く */
  weight?: number
}

export interface Cert {
  /** URL やリンクに使う ID。公開後は変えない */
  id: string
  name: string
  issuer: string
  /** どんな資格かを 1〜2 文で */
  summary: string
  /** 試験の概要。[項目, 内容] */
  facts: [string, string][]
  domains?: CertDomain[]
  domainsNote?: string
  /** 勉強の進め方のヒント */
  tips: string[]
  /** このアプリで学べる試験なら、その試験名(questions.json の exam) */
  exam?: string
  official: { label: string; url: string }
}

export const CERTS: Cert[] = [
  {
    id: 'linuc1',
    name: 'LinuC レベル1',
    issuer: 'LPI-Japan',
    summary: 'Linux の基本の操作とシステムの管理ができることを証明する資格です。101 試験と 102 試験の両方に合格すると認定されます。',
    facts: [
      ['試験', '101 試験と 102 試験(両方の合格が必要)'],
      ['問題数', '各試験 60 問'],
      ['試験時間', '各試験 90 分(アンケートを含む)'],
      ['形式', 'コンピューターで受ける選択式と入力式(CBT)'],
      ['前提', 'なし'],
      ['バージョン', 'Version 10.0'],
    ],
    domains: [
      { name: '101: Linux のインストールと仮想マシン・コンテナの利用' },
      { name: '101: ファイル・ディレクトリの操作と管理' },
      { name: '101: GNU と Unix のコマンド' },
      { name: '101: リポジトリとパッケージ管理' },
      { name: '101: ハードウェア、ディスク、パーティション、ファイルシステム' },
      { name: '102: シェルおよびスクリプト' },
      { name: '102: ネットワークの基礎' },
      { name: '102: システム管理' },
      { name: '102: 重要なシステムサービス' },
      { name: '102: セキュリティ' },
      { name: '102: オープンソースの文化' },
    ],
    domainsNote: 'このアプリで学べるのは 102 試験の範囲です。',
    tips: [
      'Linux を自分で動かせる環境(仮想マシンや WSL)を用意し、コマンドを実際に打ちながら覚えます。',
      'パーミッションや cron は計算ドリルで繰り返し練習できます。',
      '102 試験の「重要度」の高い項目から先に固めます。',
    ],
    exam: 'LinuC102',
    official: { label: 'LinuC レベル1(LPI-Japan)', url: 'https://linuc.org/linuc1/' },
  },
  {
    id: 'ccna',
    name: 'CCNA',
    issuer: 'Cisco',
    summary: 'ネットワークの基礎(スイッチ、ルーティング、IP アドレス、セキュリティ、自動化)を証明する、ネットワークの入門の資格です。',
    facts: [
      ['試験', '200-301 CCNA(1 試験)'],
      ['試験時間', '120 分'],
      ['形式', '選択式、ドラッグ&ドロップ、シミュレーション'],
      ['前提', 'なし'],
      ['有効期間', '3 年'],
      ['バージョン', 'v2.0(2027 年 2 月 3 日から。それまでは v1.1)'],
    ],
    domains: [
      { name: 'ネットワークインフラストラクチャと接続', weight: 25 },
      { name: 'スイッチングとネットワークアクセス', weight: 25 },
      { name: 'IP ルーティング', weight: 20 },
      { name: 'ネットワークサービスとセキュリティ', weight: 20 },
      { name: 'AI、ネットワーク運用と管理', weight: 10 },
    ],
    domainsNote: '問題数と合格点は公表されていません。このアプリは v2.0 の出題範囲に合わせています。',
    tips: [
      'サブネットの計算は毎日少しずつ解き、1 問 30 秒を目安にします。',
      '設定のコマンドは Packet Tracer などで実際に打って確かめます。',
      'show コマンドの出力を読んで原因を答える問題が多いので、出力の読み方に慣れます。',
    ],
    exam: 'CCNA',
    official: {
      label: 'CCNA v2.0 出題範囲(Cisco)',
      url: 'https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf',
    },
  },
  {
    id: 'saa',
    name: 'AWS Certified Solutions Architect – Associate',
    issuer: 'Amazon Web Services',
    summary: 'AWS で、安全で、止まりにくく、速く、費用を抑えたシステムを設計できることを証明する資格です。',
    facts: [
      ['試験', 'SAA-C03'],
      ['問題数', '65 問(うち 15 問は採点されない)'],
      ['試験時間', '130 分'],
      ['合格ライン', '1,000 点満点中 720 点'],
      ['形式', '選択式(1 つ選ぶ、複数選ぶ)'],
      ['有効期間', '3 年'],
    ],
    domains: [
      { name: 'セキュアなアーキテクチャの設計', weight: 30 },
      { name: '弾力性に優れたアーキテクチャの設計', weight: 26 },
      { name: '高パフォーマンスなアーキテクチャの設計', weight: 24 },
      { name: 'コストを最適化したアーキテクチャの設計', weight: 20 },
    ],
    tips: [
      'AWS の無料枠で、VPC、EC2、S3 を実際に作って触ります。',
      '問題文の「最もコストが低い」「運用の手間が最も少ない」などの条件で答えが変わるので、条件に線を引くつもりで読みます。',
      'VPC のサブネットで使える IP の数は計算ドリルで練習できます。',
    ],
    exam: 'SAA',
    official: { label: 'AWS SAA(公式)', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  },
  {
    id: 'clf',
    name: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    summary: 'クラウドと AWS の全体像を理解していることを証明する、AWS の入門の資格です。',
    facts: [
      ['試験', 'CLF-C02'],
      ['問題数', '65 問(うち 15 問は採点されない)'],
      ['試験時間', '90 分'],
      ['合格ライン', '1,000 点満点中 700 点'],
      ['形式', '選択式(1 つ選ぶ、複数選ぶ)'],
      ['有効期間', '3 年'],
    ],
    domains: [
      { name: 'クラウドの概念', weight: 24 },
      { name: 'セキュリティとコンプライアンス', weight: 30 },
      { name: 'クラウドテクノロジーとサービス', weight: 34 },
      { name: '請求、料金、サポート', weight: 12 },
    ],
    tips: ['SAA が難しく感じるときの前段として受けます。SAA を直接目指す場合は飛ばしてもかまいません。'],
    official: { label: 'AWS Cloud Practitioner(公式)', url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/' },
  },
  {
    id: 'terraform',
    name: 'HashiCorp Certified: Terraform Associate',
    issuer: 'HashiCorp',
    summary: 'Terraform を使って、インフラをコードで作り、変更し、管理できることを証明する資格です。',
    facts: [
      ['試験', 'Terraform Associate(004)'],
      ['試験時間', '1 時間'],
      ['形式', '選択式。オンラインで受験'],
      ['対象のバージョン', 'Terraform 1.12'],
      ['前提', 'なし'],
      ['有効期間', '2 年'],
    ],
    domains: [
      { name: 'Infrastructure as Code の考え方' },
      { name: 'Terraform の基本' },
      { name: 'Terraform の基本の流れ(init、plan、apply、destroy)' },
      { name: 'Terraform の設定の書き方' },
      { name: 'モジュール' },
      { name: 'state の管理' },
      { name: 'インフラの保守' },
      { name: 'HCP Terraform' },
    ],
    domainsNote: '出題の割合は公表されていません。',
    tips: [
      'AWS の無料枠で、VPC と EC2 を Terraform で作り、変更し、消す流れを何度も繰り返します。',
      'state がどこに置かれ、何のためにあるのかを説明できるようにします。',
    ],
    official: { label: 'Terraform Associate(HashiCorp)', url: 'https://developer.hashicorp.com/certifications/terraform-associate' },
  },
  {
    id: 'cka',
    name: 'CKA(Certified Kubernetes Administrator)',
    issuer: 'CNCF / The Linux Foundation',
    summary: 'Kubernetes のクラスタを作り、運用し、障害を直せることを証明する資格です。実際のクラスタで作業する実技の試験です。',
    facts: [
      ['形式', '実技(ブラウザのターミナルでクラスタを操作する)。オンラインで受験'],
      ['問題数', '15〜20 問ほどの作業'],
      ['試験時間', '2 時間'],
      ['合格ライン', '66%'],
      ['前提', 'なし'],
      ['有効期間', '2 年'],
    ],
    domains: [
      { name: 'トラブルシューティング', weight: 30 },
      { name: 'クラスタのアーキテクチャ、インストール、設定', weight: 25 },
      { name: 'サービスとネットワーク', weight: 20 },
      { name: 'ワークロードとスケジューリング', weight: 15 },
      { name: 'ストレージ', weight: 10 },
    ],
    domainsNote: '試験中は Kubernetes の公式ドキュメントを見られます。',
    tips: [
      '自分のパソコンや無料の環境でクラスタを作り、kubectl を手で打って慣れます。',
      '時間との勝負なので、よく使うコマンドとドキュメントの場所を覚えておきます。',
    ],
    official: {
      label: 'CKA(The Linux Foundation)',
      url: 'https://training.linuxfoundation.org/ja/certification/certified-kubernetes-administrator-cka/',
    },
  },
  {
    id: 'devops-pro',
    name: 'AWS Certified DevOps Engineer – Professional',
    issuer: 'Amazon Web Services',
    summary: 'AWS での自動化、CI/CD、監視、障害対応を設計・運用できることを証明する上級の資格です。実務の経験がある人向けです。',
    facts: [
      ['試験', 'DOP-C02'],
      ['問題数', '75 問(うち 10 問は採点されない)'],
      ['試験時間', '180 分'],
      ['合格ライン', '1,000 点満点中 750 点'],
      ['形式', '選択式(1 つ選ぶ、複数選ぶ)'],
      ['有効期間', '3 年'],
    ],
    domains: [
      { name: 'SDLC の自動化', weight: 22 },
      { name: '構成管理と IaC', weight: 17 },
      { name: '耐障害性の高いクラウドソリューション', weight: 15 },
      { name: '監視とログ', weight: 15 },
      { name: 'インシデントとイベントへの対応', weight: 14 },
      { name: 'セキュリティとコンプライアンス', weight: 17 },
    ],
    tips: ['AWS での実務の経験が 2 年ほどある人向けです。段階 4・5 で作ったものを AWS のサービスで組み直しながら学びます。'],
    official: { label: 'AWS DevOps Engineer – Professional(公式)', url: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/' },
  },
  {
    id: 'cloudops',
    name: 'AWS Certified CloudOps Engineer – Associate',
    issuer: 'Amazon Web Services',
    summary: 'AWS のシステムの監視、復旧、自動化、セキュリティなど、運用の力を証明する資格です。2025 年 9 月に SysOps Administrator – Associate から名前が変わりました。',
    facts: [
      ['試験', 'SOA-C03'],
      ['問題数', '65 問(うち 15 問は採点されない)'],
      ['試験時間', '130 分'],
      ['形式', '選択式(1 つ選ぶ、複数選ぶ)'],
      ['有効期間', '3 年'],
    ],
    domains: [
      { name: '監視、ログ、分析、修復、性能の最適化', weight: 22 },
      { name: '信頼性と事業継続', weight: 22 },
      { name: 'デプロイ、プロビジョニング、自動化', weight: 22 },
      { name: 'セキュリティとコンプライアンス', weight: 16 },
      { name: 'ネットワークとコンテンツ配信', weight: 18 },
    ],
    tips: ['SAA の次に、運用の仕事に寄せて学びたいときに向いています。'],
    official: { label: 'AWS CloudOps Engineer – Associate(公式)', url: 'https://aws.amazon.com/certification/certified-cloudops-engineer-associate' },
  },
  {
    id: 'linuc2',
    name: 'LinuC レベル2',
    issuer: 'LPI-Japan',
    summary: '仮想マシンやコンテナを含む Linux のシステムとネットワークを設計・構築できることを証明する資格です。',
    facts: [
      ['試験', '201 試験と 202 試験(両方の合格が必要)'],
      ['問題数', '各試験 60 問'],
      ['試験時間', '各試験 90 分(アンケートを含む)'],
      ['前提', '有効な LinuC レベル1 の認定'],
    ],
    tips: ['レベル1 の範囲を実際のサーバーで使いこなせるようになってから挑戦します。'],
    official: { label: 'LinuC レベル2(LPI-Japan)', url: 'https://linuc.org/linuc2/' },
  },
  {
    id: 'ipa',
    name: '基本情報技術者',
    issuer: 'IPA(情報処理推進機構)',
    summary: 'IT の基礎(コンピューターの仕組み、アルゴリズム、データベース、ネットワーク、セキュリティ、マネジメント)を広く証明する国家試験です。',
    facts: [
      ['試験', '科目 A(90 分・60 問)と科目 B(100 分・20 問)'],
      ['形式', 'コンピューターで受験(CBT)'],
      ['有効期間', 'なし'],
    ],
    tips: ['インフラだけでなく、プログラミングやデータベースの基礎もまとめて学びたいときに向いています。'],
    official: { label: '情報処理技術者試験(IPA)', url: 'https://www.ipa.go.jp/shiken/' },
  },
  {
    id: 'gcp-devops',
    name: 'Google Cloud Professional Cloud DevOps Engineer',
    issuer: 'Google Cloud',
    summary: 'Google Cloud で CI/CD、監視、SRE の考え方を使って、サービスを運用できることを証明する上級の資格です。',
    facts: [
      ['問題数', '50〜60 問'],
      ['試験時間', '2 時間'],
      ['形式', '選択式(1 つ選ぶ、複数選ぶ)'],
      ['言語', '英語、日本語'],
      ['有効期間', '2 年'],
    ],
    tips: ['Google Cloud を使う職場で働くときに向いています。SRE の考え方(SLO、エラーバジェット、トイル)が出題されます。'],
    official: { label: 'Professional Cloud DevOps Engineer(Google Cloud)', url: 'https://cloud.google.com/certification/cloud-devops-engineer' },
  },
  {
    id: 'ckad-cks',
    name: 'CKAD / CKS',
    issuer: 'CNCF / The Linux Foundation',
    summary: 'CKAD は Kubernetes でアプリケーションを動かす開発者向け、CKS は Kubernetes のセキュリティの資格です。どちらも実技の試験です。',
    facts: [
      ['形式', '実技(ブラウザのターミナルでクラスタを操作する)。オンラインで受験'],
      ['試験時間', '各 2 時間'],
      ['前提', 'CKAD はなし。CKS は有効な CKA を持っていること'],
      ['有効期間', '2 年'],
    ],
    tips: ['CKA に合格してから、仕事の内容に合わせて選びます。'],
    official: {
      label: 'The Linux Foundation のトレーニングと資格',
      url: 'https://training.linuxfoundation.org/',
    },
  },
]

export const certById = (id: string) => CERTS.find((c) => c.id === id)
