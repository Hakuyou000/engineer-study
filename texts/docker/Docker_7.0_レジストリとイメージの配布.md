# Docker テキスト 7.0 レジストリとイメージの配布

作ったイメージをレジストリに置き、本番の環境に確実に同じものを配る方法を学びます。

## 7.1 レジストリの種類

**レジストリ**は、イメージを保存して配るサーバーです。その中の、同じ名前のイメージの集まり(タグの違うもの)を**リポジトリ**と呼びます。

| レジストリ | 特徴 |
|---|---|
| Docker Hub(`docker.io`) | 既定のレジストリ。公式イメージ(Docker Official Images)、認証済みの発行者のイメージがある。匿名や無料の利用には pull の回数の制限がある |
| Amazon ECR | AWS のプライベートレジストリ。IAM で権限を管理する |
| GitHub Container Registry(`ghcr.io`) | GitHub のリポジトリと一緒に管理できる |
| Google Artifact Registry、Azure Container Registry | 各クラウドのレジストリ |
| 自前のレジストリ(`registry` イメージ、Harbor など) | 社内に置く |

- 公開のイメージを使うときは、Docker Official Images や認証済みの発行者のものを選び、知らない人のイメージは中身を確かめてから使います。
- 本番では、外部のレジストリの障害や回数の制限に左右されないよう、使うイメージを自社のプライベートレジストリに置くことが多いです。

## 7.2 push と pull

### 1. 手順

```bash
docker login registry.example.com             # 認証(Docker Hub なら docker login だけ)
docker tag myapp:1.0 registry.example.com/team/myapp:1.0   # レジストリの名前を含むタグを付ける
docker push registry.example.com/team/myapp:1.0
docker pull registry.example.com/team/myapp:1.0
```

イメージに `docker tag` で名前を付けて、レジストリを通して別のホストに渡す流れです。

```text
[local: myapp:1.0]
  |
  |  docker tag myapp:1.0 registry.example.com/team/myapp:1.0
  v
[local: registry.example.com/team/myapp:1.0]    <- 名前にレジストリのホスト名が入った
  |
  |  docker push      <- 名前のホスト名のレジストリに送られる
  v
[registry.example.com : team/myapp : 1.0]
  |
  |  docker pull
  v
[another host]
```

- push する先は、**イメージの名前で決まります**。レジストリのホスト名を含む名前を `docker tag` で付けてから push します。名前にホスト名がなければ Docker Hub に送られます。
- push と pull は、層ごとに行われます。すでに相手にある層は送りません。

### 2. Amazon ECR の例

```bash
aws ecr get-login-password --region ap-northeast-1 \
  | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com
docker tag myapp:1.0 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/myapp:1.0
docker push 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/myapp:1.0
```

- `--password-stdin` で、パスワードをコマンドの履歴に残さずに渡します。
- ECR の認証のトークンには有効期限(12 時間)があります。

### 3. 認証情報の保存

- `docker login` の認証情報は `~/.docker/config.json` に保存されます。**認証情報ヘルパー**(OS のキーチェーン、`docker-credential-ecr-login` など)を設定しないと、Base64 で書かれるだけで暗号化されません。
- CI では、長期のパスワードより、有効期限の短いトークンや OIDC を使います。

## 7.3 タグとダイジェストの運用

### 1. タグの付け方

| 方法 | 例 | 特徴 |
|---|---|---|
| `latest` | `myapp:latest` | どの版か分からない。本番では使わない |
| セマンティックバージョン | `myapp:1.4.2` | 人が分かりやすい |
| Git のコミットの ID | `myapp:3f9c2a1` | どのコードから作ったかが確実に分かる |

- タグは**付け替えられる**ので、同じ `myapp:1.4.2` でも、後で中身が変わる可能性があります。
- ECR などには、同じタグを上書きできないようにする設定(**タグのイミュータビリティ**)があります。

### 2. ダイジェスト

```
myapp@sha256:4c3f…e91a
```

- イメージの中身(マニフェスト)のハッシュ値です。**中身が 1 バイトでも違えば変わる**ので、ダイジェストで指定すれば、必ず同じイメージを使えます。
- `docker images --digests` や `docker image inspect --format '{{.RepoDigests}}' 名前` で確かめます。
- 本番のデプロイや、Dockerfile の `FROM` でダイジェストを使うと、再現性が高まります(更新は自分で行う必要があります)。

### 3. マルチアーキテクチャのイメージ

1 つのタグに、amd64 用と arm64 用など複数のイメージをまとめられます(マニフェストリスト / イメージインデックス)。pull すると、Docker がホストに合うものを自動で選びます。

1 つのタグに、CPU のアーキテクチャごとのイメージが入っている様子です。

```text
myapp:1.4.2    (tag)
  +-- [image for linux/amd64]
  `-- [image for linux/arm64]      <- pull すると、Docker がホストに合うものを選ぶ
```

## 7.4 イメージの信頼性

| 対策 | 内容 |
|---|---|
| 脆弱性のスキャン | Docker Scout、Trivy、ECR のスキャンなどで、イメージの中のパッケージの既知の脆弱性を調べる。CI と定期的な実行の両方で行う |
| 署名 | Sigstore(Cosign)や Notation でイメージに署名し、デプロイの前に検証する |
| SBOM と来歴 | イメージに含まれるソフトウェアの一覧(SBOM)と、どこでどうビルドしたか(provenance)を記録する。`docker buildx build --sbom=true --provenance=true` |
| ベースイメージの更新 | ベースイメージの脆弱性を直すため、定期的にビルドし直す |

古い **Docker Content Trust(`DOCKER_CONTENT_TRUST=1`)は廃止されました**。署名には Cosign や Notation を使います。

### まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| push 先のレジストリを決めるもの | イメージの名前(ホスト名の部分)。`docker tag` で付ける |
| 名前にホスト名がないとき | Docker Hub |
| 確実に同じ中身のイメージを使う | ダイジェスト(`@sha256:…`)で指定する |
| 本番で `latest` を使うべきか | 使わない |
| `docker login` の認証情報の保存先 | `~/.docker/config.json`(認証情報ヘルパーで保護する) |
| イメージの署名 | Cosign / Notation(Docker Content Trust は廃止) |
