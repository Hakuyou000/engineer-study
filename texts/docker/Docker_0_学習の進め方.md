# Docker 0 学習の進め方

作成: 2026-11-19
対象: Docker Engine 29 系、Docker Compose(`docker compose`)

このテキストは、資格試験ではなく、**SRE やインフラの実務で使う Docker** を身につけるためのものです。Kubernetes(CKA)に進む前の土台にもなります。

## 1. この教材の位置づけ

| 項目 | 内容 |
|---|---|
| 目的 | コンテナのイメージを作り、動かし、つなぎ、運用できるようになる |
| 対象のバージョン | Docker Engine 29 系。Compose は `docker compose`(Compose v2 以降のプラグイン) |
| ロードマップでの位置 | 段階 2(Terraform、GitHub Actions と同じ時期)。CKA の前に学ぶ |
| 前提 | Linux の基本操作(LinuC レベル1 の範囲)、TCP/IP の基本 |

Docker の資格には Mirantis の Docker Certified Associate(DCA)がありますが、Swarm や旧 Docker Enterprise の範囲が多く、今の実務とずれがあります。そのため、この教材は試験ではなく実務の範囲に合わせています。

## 2. 分野

| 分野 | 内容 | テキスト |
|---|---|---|
| 1 | コンテナと Docker の基礎(仕組み、構成要素) | `Docker_1.0_…` |
| 2 | イメージと Dockerfile | `Docker_2.0_…` |
| 3 | コンテナの実行と管理 | `Docker_3.0_…` |
| 4 | ネットワーク | `Docker_4.0_…` |
| 5 | ストレージ(ボリューム、バインドマウント) | `Docker_5.0_…` |
| 6 | Docker Compose | `Docker_6.0_…` |
| 7 | レジストリとイメージの配布 | `Docker_7.0_…` |
| 8 | セキュリティと運用、トラブルシュート | `Docker_8.0_…` |

## 3. 学習の進め方

1. **Docker を入れる**: Linux なら Docker Engine、Windows と Mac なら Docker Desktop を入れます。`docker run hello-world` が動けば準備完了です。
2. **分野 1〜3 を読みながら手を動かす**: `docker run`、`docker ps`、`docker logs`、`docker exec` を何度も使います。
3. **自分で Dockerfile を書く**: 小さな Web アプリ(Python や Node.js)をイメージにし、マルチステージビルドで小さくしてみます。
4. **Compose で複数のコンテナを動かす**: Web アプリとデータベースを `compose.yaml` で一緒に起動します。
5. **問題を解く**: 間違えた問題はテキストの該当の節に戻ります。
6. **壊して直す**: ポートがつながらない、コンテナがすぐ終了する、などをわざと起こし、分野 8 の手順で原因を調べます。

## 4. 古い情報に注意

Docker はよく変わります。古い記事の書き方は、今は次のように変わっています。

| 古い書き方 | 今の書き方 |
|---|---|
| `docker-compose`(ハイフンあり。Compose v1) | `docker compose`(スペース。Compose v2 以降) |
| `docker-compose.yml` の先頭の `version: "3.8"` | 不要(書くと「obsolete」の警告) |
| ファイル名 `docker-compose.yml` | `compose.yaml` が推奨(古い名前も読める) |
| `--link` でコンテナをつなぐ | ユーザー定義のブリッジネットワーク(名前で通信できる) |
| `DOCKER_CONTENT_TRUST=1` でイメージの署名を確かめる | Docker Content Trust は廃止された。Sigstore(Cosign)や Notation を使う |
| 旧来のビルダー | BuildKit(既定) |
