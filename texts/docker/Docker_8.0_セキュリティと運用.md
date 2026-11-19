# Docker テキスト 8.0 セキュリティと運用、トラブルシュート

コンテナを安全に動かすための設定と、本番で必要なログの扱い、ディスクの管理、よくある障害の調べ方を学びます。

## 8.1 コンテナのセキュリティ

### 1. 最小の権限で動かす

| 対策 | 方法 | 理由 |
|---|---|---|
| root で動かさない | Dockerfile の `USER 1000`、`docker run -u` | コンテナの中の root は、ホストの root と同じ UID 0。抜け出されたときの被害が大きい |
| ケーパビリティを減らす | `--cap-drop ALL --cap-add NET_BIND_SERVICE` | root でも使える特権を、必要なものだけに絞る |
| 特権を増やせないようにする | `--security-opt no-new-privileges` | setuid のプログラムなどで権限を上げられないようにする |
| ファイルシステムを読み取り専用にする | `--read-only`(書く場所だけ `--tmpfs` やボリューム) | 改ざんやマルウェアの書き込みを防ぐ |
| 資源を制限する | `--memory`、`--cpus`、`--pids-limit` | 1 つのコンテナの暴走でホスト全体が止まるのを防ぐ |

Docker は既定で、seccomp(使えるシステムコールの制限)と AppArmor / SELinux のプロファイルを適用しています。無効にしないようにします。

### 2. 危険な設定

| 設定 | 危険な理由 |
|---|---|
| `--privileged` | ほぼすべての特権とホストのデバイスへのアクセスを与える。ホストを乗っ取れる |
| `-v /var/run/docker.sock:/var/run/docker.sock` | コンテナから Docker デーモンを操作できる。**ホストの root と同じ**(どんなコンテナでも作れるため) |
| ユーザーを `docker` グループに入れる | `docker` コマンドを sudo なしで使えるが、実質的に root の権限を与えることになる |
| `--network host`、`--pid host` | ホストとの分離がなくなる |

デーモンを root 以外で動かす **rootless モード**を使うと、抜け出されたときの被害を小さくできます。

### 3. 秘密情報をイメージに入れない

| やってはいけない | 理由 |
|---|---|
| Dockerfile の `ENV` や `ARG` にパスワードを書く | `docker history` や `docker inspect` で見える。イメージを配ると漏れる |
| `COPY` で秘密鍵を入れて、後の `RUN` で消す | 前の層に残っている |

| 代わりの方法 | 内容 |
|---|---|
| ビルドのときの秘密 | BuildKit の `RUN --mount=type=secret,id=npmrc …` と `docker build --secret id=npmrc,src=.npmrc`。層に残らない |
| 実行のときの秘密 | 実行時に環境変数やファイルで渡す。Compose の `secrets`(コンテナの `/run/secrets/` にファイルとして見せる)、クラウドのシークレット管理(AWS Secrets Manager など) |
| ビルドコンテキストから外す | `.dockerignore` に `.env`、鍵のファイルを書く |

## 8.2 ログの運用

### 1. ロギングドライバー

コンテナの標準出力と標準エラー出力をどこに送るかを、**ロギングドライバー**で決めます。

| ドライバー | 送り先 |
|---|---|
| `json-file`(既定) | ホストのファイル(`/var/lib/docker/containers/<ID>/…-json.log`) |
| `local` | ホストのファイル(圧縮され、既定でローテーションされる) |
| `journald` / `syslog` | ホストの journald / syslog |
| `awslogs` / `gcplogs` | CloudWatch Logs / Cloud Logging |
| `fluentd` | Fluentd に送る |

### 2. ログのローテーション

既定の `json-file` は、**ローテーションしないので、ログがディスクを埋め尽くす**ことがあります。`/etc/docker/daemon.json` で上限を決めます。

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

- デーモンの設定を変えたら、デーモンの再起動が必要です。変更は**新しく作ったコンテナ**から適用されます(既存のコンテナは作り直す)。
- コンテナごとに `docker run --log-opt max-size=10m` でも指定できます。

## 8.3 ディスクの管理

| 溜まるもの | 確認と掃除 |
|---|---|
| 使われていないイメージ | `docker image prune`(名前のないものだけ)、`-a` で使われていないもの全部 |
| 止まったコンテナ | `docker container prune` |
| ビルドキャッシュ | `docker builder prune` |
| 使われていないボリューム | `docker volume prune`(匿名のもの。名前付きも含めるなら `-a`。**データも消える**) |
| まとめて | `docker system prune`(ボリュームは `--volumes` のときだけ) |

全体の使用量は `docker system df` で確かめます。CI のサーバーやビルドのホストでは、定期的な掃除を自動化します。

## 8.4 よくある障害の調べ方

| 症状 | 確かめること | よくある原因と対処 |
|---|---|---|
| コンテナがすぐ終わる | `docker ps -a` の終了コード、`docker logs` | 設定の誤り、環境変数の不足。PID 1 がすぐ終わるコマンド |
| 終了コード 137 | `docker inspect` の `State.OOMKilled` | メモリの上限を超えた。上限を上げるか、メモリの使い方を直す |
| 外からつながらない | `docker port`、アプリの待ち受けのアドレス | `-p` がない、アプリが 127.0.0.1 で待ち受けている、ファイアウォール |
| バインドマウントで `Permission denied` | ホストのファイルの UID/GID、コンテナのユーザー | 持ち主を合わせる、`-u` で UID を合わせる |
| `exec format error` | イメージのアーキテクチャ(`docker image inspect` の Architecture) | arm64 の Mac で作った arm64 のイメージを、amd64 のサーバーで動かしている。`--platform` でビルドする |
| pull で `unauthorized` / `denied` | `docker login`、名前の綴り、権限 | ログインしていない、トークンの期限切れ、リポジトリの権限がない |
| pull で `toomanyrequests` | Docker Hub の利用状況 | pull の回数の制限。ログインする、ミラーや自社のレジストリを使う |
| `no space left on device` | `docker system df`、`df -h` | イメージ、ビルドキャッシュ、ログが溜まった。prune、ログのローテーション |
| `docker` コマンドが `permission denied ... docker.sock` | ユーザーのグループ | `docker` グループに入っていない(入れることの危険性に注意) |

### まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| docker.sock をマウントする危険 | ホストの root と同じ権限を渡す |
| `--privileged` を使うべきか | 原則使わない |
| ビルドで使う秘密をイメージに残さない | BuildKit の `--secret` |
| 既定のロギングドライバー | `json-file`(ローテーションの設定が必要) |
| `exec format error` | CPU アーキテクチャの不一致 |
| ディスクが一杯 | `docker system df` で確認し、prune とログの上限 |
