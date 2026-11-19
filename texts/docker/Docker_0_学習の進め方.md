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

## 5. 演習環境の作り方

### 1. Docker を入れる

| OS | おすすめ | メモ |
|---|---|---|
| Windows | Docker Desktop(WSL 2 を使う設定) | `winget install Docker.DockerDesktop`。WSL を先に有効にする(LinuC 102 0 の「演習環境の作り方」) |
| Windows(別の方法) | WSL の Ubuntu の中に Docker Engine を入れる | Linux と同じ手順で、Linux のサーバーに近い動きになる |
| Mac | Docker Desktop | Apple シリコンの Mac では、イメージは arm64 が既定になる |
| Linux | Docker Engine | Docker の公式の手順で、パッケージのリポジトリを追加して入れる |

Docker Desktop は、個人の学習や、従業員 250 人未満かつ年間売上 1,000 万ドル未満の会社では無料で使えます。それより大きい会社の仕事で使うときは、有料の契約が必要です。

### 2. 入ったかを確かめる

```bash
docker version               # Client と Server の両方が表示されれば、デーモンにつながっている
docker run --rm hello-world  # イメージを取得して動かせるか
docker compose version       # Compose v2 が入っているか
```

`Server` の欄がエラーになるときは、Docker Desktop が起動していないか、Linux なら Docker デーモンが動いていない(`sudo systemctl status docker`)か、ユーザーが `docker` グループに入っていません。

### 3. テキストの例で使うイメージ

テキストの例は、タグを固定したイメージを使っています(`nginx:1.27`、`postgres:17`、`python:3.13-slim`、`alpine:3.22`、`busybox:1.37` など)。同じタグを使えば、同じ結果になります。

### 4. 片付け

練習の後に残ったものは、次で確かめて消します。

```bash
docker ps -a                  # 止まったコンテナ
docker system df              # 全体の使用量
docker system prune           # 止まったコンテナ、使っていないネットワーク、dangling なイメージを消す
docker volume ls              # ボリュームは prune では消えない。不要なものは docker volume rm で消す
```
