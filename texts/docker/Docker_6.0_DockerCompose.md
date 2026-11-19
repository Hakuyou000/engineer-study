# Docker テキスト 6.0 Docker Compose

複数のコンテナからなるアプリケーションを、1 つの YAML ファイルで定義してまとめて動かす **Docker Compose** を学びます。

## 6.1 compose.yaml の書き方

### 1. 例

```yaml
services:
  web:
    build: .
    ports:
      - "8080:8000"
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:17
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 5

volumes:
  pgdata:
```

| 項目 | 意味 |
|---|---|
| `services` | 動かすコンテナの定義。キー(`web`、`db`)が**サービス名** |
| `image` / `build` | 使うイメージ、またはビルドする Dockerfile の場所 |
| `ports` | ポートの公開(`"ホスト:コンテナ"`)。文字列で書くのが安全 |
| `environment` / `env_file` | 環境変数 |
| `volumes`(サービスの中) | マウント。名前ならボリューム、`./` で始まればバインドマウント |
| `volumes`(一番上) | 名前付きボリュームの宣言 |
| `networks` | ネットワーク。書かなければ既定のネットワークを使う |
| `depends_on` | 起動の順番と条件(6.3) |
| `healthcheck` | ヘルスチェック |
| `restart` | 再起動の方針 |

- ファイル名は **`compose.yaml`** が推奨です(`docker-compose.yml` も読めます)。
- 先頭の `version:` は**不要**です。書くと obsolete(古い)の警告が出て、無視されます。

### 2. プロジェクトと既定のネットワーク

- Compose は、ディレクトリ名(または `name:`、`-p`)を**プロジェクト名**にします。コンテナ、ネットワーク、ボリュームの名前の先頭に付きます(例: `myapp-web-1`、`myapp_pgdata`)。
- プロジェクトごとに**既定のネットワーク**(`myapp_default`)を自動で作り、全サービスをつなぎます。サービスは**サービス名で**互いに通信できます(上の例では `db:5432`)。
- コンテナ同士の通信に `ports` は不要です。`ports` はホストの外から入るときだけ使います。

## 6.2 主なコマンド

| コマンド | 動き |
|---|---|
| `docker compose up -d` | 必要ならイメージを取得・ビルドし、ネットワークとボリュームを作り、全サービスを起動する |
| `docker compose up -d --build` | イメージを作り直してから起動する |
| `docker compose down` | コンテナとネットワークを**削除**する。ボリュームは残る |
| `docker compose down -v` | 名前付きボリュームも削除する(**データが消える**) |
| `docker compose stop` / `start` | 削除せずに止める / 動かす |
| `docker compose ps` | プロジェクトのコンテナの一覧 |
| `docker compose logs -f web` | ログ |
| `docker compose exec web sh` | 動いているサービスのコンテナで実行する |
| `docker compose run --rm web python manage.py migrate` | 一回だけのコマンドを新しいコンテナで実行する |
| `docker compose build` / `pull` | ビルドする / イメージを取得する |
| `docker compose config` | 変数を展開し、複数のファイルを合わせた最終の設定を表示する(書き方の確認にも使う) |
| `docker compose up -d --scale web=3` | サービスのコンテナの数を変える(ホストのポートを固定していると重複する) |

- `up` は、設定やイメージが変わったサービスだけを作り直します。変わっていないものはそのまま動き続けます。
- `docker-compose`(ハイフンあり)は古い Compose v1 のコマンドです。今は `docker compose` を使います。

## 6.3 起動の順番: depends_on

```yaml
depends_on:
  db:
    condition: service_healthy
```

| 条件 | 意味 |
|---|---|
| `service_started`(短い書き方の既定) | 依存先のコンテナが**起動した**ら始める |
| `service_healthy` | 依存先が **healthy** になったら始める(依存先に healthcheck が必要) |
| `service_completed_successfully` | 依存先が**正常に終了した**ら始める(マイグレーションなどの一回だけの処理) |

- `depends_on: [db]` の短い書き方は「起動の順番」を決めるだけで、データベースが**接続を受け付けられる状態か**は待ちません。そのため、Web アプリが先に接続して失敗することがあります。`service_healthy` と healthcheck を組み合わせます。
- それでも、アプリ側にも接続の再試行を入れておくのが堅牢です。
- 停止は逆の順番で行われます。

## 6.4 環境ごとの設定

### 1. 変数の展開と .env

- `compose.yaml` の中の `${DB_PASSWORD}` は、シェルの環境変数、または**同じディレクトリの `.env` ファイル**から値を入れます。
- `${TAG:-latest}` は、値がなければ `latest` を使う書き方です。
- `.env` は `compose.yaml` の**変数の展開**のためのファイルです。コンテナに環境変数として渡すのは `environment` や `env_file` です(役割が違います)。
- 秘密の値を書いた `.env` は Git にコミットしません。

### 2. 複数のファイル

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

- 後のファイルが前のファイルを上書き(リストは追加)します。
- `compose.override.yaml` があると、`-f` を書かないときに自動で重ねて読まれます(開発用の設定によく使う)。

### 3. profiles

```yaml
services:
  adminer:
    image: adminer
    profiles: ["debug"]
```

`profiles` を付けたサービスは、普段の `up` では起動せず、`docker compose --profile debug up` のときだけ起動します。

## 6.5 開発中の自動反映: develop と watch

ソースコードを変えるたびに `up --build` をやり直すのは手間です。サービスに `develop.watch` を書き、`docker compose watch`(または `docker compose up --watch`)で起動すると、ファイルの変更を見張って自動で反映します。

```yaml
services:
  web:
    build: .
    develop:
      watch:
        - action: sync           # ファイルをコンテナにコピーする(再起動はしない)
          path: ./src
          target: /app/src
        - action: rebuild        # イメージを作り直してコンテナを入れ替える
          path: requirements.txt
        - action: sync+restart   # コピーしてからコンテナを再起動する
          path: ./config
          target: /app/config
```

| action | 使う場面 |
|---|---|
| `sync` | 自動で読み込み直す仕組みがあるアプリのソースコード |
| `rebuild` | 依存関係の一覧や Dockerfile のように、イメージを作り直す必要があるもの |
| `sync+restart` | 起動のときだけ読む設定ファイル |

バインドマウント(`./src:/app/src`)でも似たことができますが、watch はホストと OS が違っても速く、`.dockerignore` に従って不要なファイルを除けます。

## 6.6 secrets と資源の上限

### 1. secrets

パスワードを `environment` に書くと、`docker inspect` で見えます。Compose の `secrets` を使うと、値をファイルとしてコンテナの `/run/secrets/<名前>` に見せられます。

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password   # 公式のイメージは _FILE の変数に対応している
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt      # environment: DB_PASSWORD ならホストの環境変数から
```

- サービスの `secrets` に書いたものだけが、そのコンテナに見えます。
- `./secrets/` は `.gitignore` と `.dockerignore` に入れ、Git やイメージに入らないようにします。

### 2. 資源の上限

1 つのサービスがホストのメモリを使い切らないように、上限を付けます。

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          memory: 256M
```

`docker compose up` は `deploy.resources` の limits を、`docker run --cpus` と `--memory` と同じようにコンテナに設定します。上限を超えてメモリを使うと、コンテナは OOM で強制終了されます(3.0 の終了コード 137)。

### まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| サービス同士の接続先 | サービス名(例: `db:5432`) |
| `down` でボリュームは | 残る。`down -v` で消える |
| DB が準備できてから Web を起動する | `depends_on` の `condition: service_healthy` と DB の healthcheck |
| `version:` は必要か | 不要(obsolete) |
| `.env` の役割 | `compose.yaml` の変数の展開 |
| 最終の設定を確かめる | `docker compose config` |
| 一回だけのコマンドを実行する | `docker compose run --rm` |
