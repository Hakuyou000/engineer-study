# Docker 問題 6.0 Docker Compose

対象: 実務の Docker / 全20問 / すべてオリジナル問題
対応テキスト: `Docker_6.0_DockerCompose.md`
解答・解説は末尾。

## 問題

### 6.1 compose.yaml の書き方

**問1** `Docker-6.0-001` 次の `compose.yaml` で、`web` のアプリがデータベースに接続するときのホスト名として正しいものはどれか。

```yaml
services:
  web:
    build: .
    ports:
      - "8080:8000"
  db:
    image: postgres:17
```

- A. `localhost`
- B. ホストの IP アドレス
- C. `db`
- D. `postgres`

**問2** `Docker-6.0-002` 前の問題の `compose.yaml` で、`db` に `ports` を書いていない。`web` から `db` の 5432 番に接続できるか。

- A. できない。`ports: ["5432:5432"]` が必要である
- B. `links` を書けばできる
- C. できない。Compose ではコンテナ同士は通信できない
- D. できる。同じプロジェクトの既定のネットワークにいるので、コンテナのポートに直接つなげる

**問3** `Docker-6.0-003` `compose.yaml` の先頭に `version: "3.8"` を書いて `docker compose up` を実行した。どうなるか。

- A. エラーになり起動しない
- B. Compose v1 で実行される
- C. obsolete(古い)という警告が出て、`version` は無視される
- D. Compose のバージョン 3.8 の機能だけが使われる

**問4** `Docker-6.0-004` ディレクトリ `shop` で `docker compose up -d` を実行した。`name:` も `-p` も指定していない。作られる既定のネットワークの名前はどれか。

- A. `compose`
- B. `default`
- C. `bridge`
- D. `shop_default`

**問5** `Docker-6.0-005` `compose.yaml` の一番上の `volumes:` に `pgdata:` を書く目的はどれか。

- A. コンテナのログの保存場所を決める
- B. ホストのディレクトリ `pgdata` をバインドマウントする
- C. 名前付きボリューム `pgdata` を宣言し、サービスで使えるようにする
- D. イメージのビルドのキャッシュを置く

**問6** `Docker-6.0-006` Compose の推奨のファイル名はどれか。

- A. `stack.yml`
- B. `Composefile`
- C. `compose.yaml`
- D. `docker-compose.json`

### 6.2 主なコマンド

**問7** `Docker-6.0-007` `docker compose down` を実行したときの動作として正しいものはどれか。

- A. コンテナを止めるだけで、削除はしない
- B. コンテナとネットワークを削除する。名前付きボリュームは残る
- C. イメージも削除する
- D. コンテナ、ネットワーク、名前付きボリュームをすべて削除する

**問8** `Docker-6.0-008` 開発環境を作り直したい。データベースのデータも含めて、すべてを削除したい。正しいコマンドはどれか。

- A. `docker compose down -v`
- B. `docker compose restart`
- C. `docker compose down`
- D. `docker compose stop`

**問9** `Docker-6.0-009` Dockerfile を変更した。イメージを作り直してから起動したい。正しいコマンドはどれか。

- A. `docker compose up -d --no-build`
- B. `docker compose start`
- C. `docker compose up -d --build`
- D. `docker compose restart`

**問10** `Docker-6.0-010` データベースのマイグレーションを、`web` サービスと同じ設定の新しいコンテナで一回だけ実行し、終わったら消したい。正しいコマンドはどれか。

- A. `docker compose exec web python manage.py migrate`
- B. `docker compose run --rm web python manage.py migrate`
- C. `docker compose up web python manage.py migrate`
- D. `docker compose start web migrate`

**問11** `Docker-6.0-011` `.env` の値と、複数の Compose ファイルを合わせた、最終の設定を確かめたい。使うコマンドはどれか。

- A. `docker compose ps`
- B. `docker compose version`
- C. `docker compose config`
- D. `docker compose logs`

**問12** `Docker-6.0-012` `docker compose up -d --scale web=3` を実行したところ、`port is already allocated` のエラーになった。`web` は `ports: ["8080:8000"]` である。原因はどれか。

- A. `--scale` は Compose では使えないため
- B. イメージが 3 つ必要なため
- C. ネットワークが足りないため
- D. 3 つのコンテナが、ホストの同じ 8080 番を使おうとしたため

**問13** `Docker-6.0-013` 古い記事の手順にある `docker-compose up` について、正しいものはどれか。

- A. 今の推奨のコマンドである
- B. Kubernetes のコマンドである
- C. 古い Compose v1 のコマンドで、今は `docker compose up` を使う
- D. `docker compose` とまったく別の機能である

### 6.3 起動の順番: depends_on

**問14** `Docker-6.0-014` `web` に `depends_on: [db]`(短い書き方)を書いた。正しいものはどれか。

- A. `db` が接続を受け付けられる状態になるまで、`web` の起動を待つ
- B. `db` が正常に終了してから `web` を起動する
- C. `db` のコンテナを先に起動するが、データベースの準備ができたかは待たない
- D. `web` と `db` を同時に起動する

**問15** `Docker-6.0-015` Web アプリが起動直後にデータベースへの接続に失敗する。データベースが接続を受け付けられるようになってから Web アプリを起動したい。最も適切な設定はどれか。

- A. `db` の `ports` を公開する
- B. `web` に `restart: no` を書く
- C. `depends_on` を書かない
- D. `db` に healthcheck を書き、`web` の `depends_on` で `condition: service_healthy` を指定する

**問16** `Docker-6.0-016` マイグレーション用のサービス `migrate` が正常に終わってから、`web` を起動したい。`depends_on` の条件として正しいものはどれか。

- A. `service_completed_successfully`
- B. `service_started`
- C. `service_stopped`
- D. `service_healthy`

### 6.4 環境ごとの設定

**問17** `Docker-6.0-017` `compose.yaml` に `image: myapp:${TAG:-latest}` と書いた。環境変数 `TAG` も `.env` もないときに使われるイメージはどれか。

- A. `myapp:`
- B. `myapp:TAG`
- C. `myapp:latest`
- D. エラーになる

**問18** `Docker-6.0-018` 同じディレクトリの `.env` ファイルの主な役割として正しいものはどれか。

- A. イメージのビルドの引数を自動で渡す
- B. `compose.yaml` の中の `${…}` の変数を展開するための値を与える
- C. すべてのコンテナに自動で環境変数として渡される
- D. Docker デーモンの設定を変える

**問19** `Docker-6.0-019` 開発用の設定を `compose.override.yaml` に書いた。`-f` を指定せずに `docker compose up` を実行するとどうなるか。

- A. `compose.yaml` だけが読まれる
- B. `compose.override.yaml` だけが読まれる
- C. `compose.yaml` に `compose.override.yaml` が自動で重ねて読まれる
- D. エラーになる

**問20** `Docker-6.0-020` デバッグ用の管理画面 `adminer` を、普段は起動せず、必要なときだけ起動したい。最も適切な方法はどれか。

- A. `adminer` に `restart: no` を書く
- B. `adminer` を毎回手で `docker run` する
- C. `adminer` の `ports` を書かない
- D. `adminer` に `profiles: ["debug"]` を付け、必要なときに `docker compose --profile debug up` を実行する

## 解答・解説

### 問1 `Docker-6.0-001`

**正解**: C

Compose は、プロジェクトの既定のネットワークを作り、全サービスをつなぎます。サービスはサービス名で互いに名前解決できるので、ホスト名は `db` です。`localhost` は `web` 自身、`postgres` はイメージの名前で、ホスト名ではありません。

### 問2 `Docker-6.0-002`

**正解**: D

同じネットワークのコンテナ同士は、コンテナのポートに直接つなげます。`ports` はホストの外から入るための公開で、コンテナ同士の通信には不要です。`links` は古い機能で、今は必要ありません。

### 問3 `Docker-6.0-003`

**正解**: C

今の Compose(v2 以降)は、`version` の要素を使いません。書くと obsolete の警告が出て、無視されます。エラーにはならず、v1 で実行されることもありません。削除して構いません。

### 問4 `Docker-6.0-004`

**正解**: D

プロジェクト名は、指定がなければディレクトリ名になり、既定のネットワークは `プロジェクト名_default` という名前で作られます。そのため `shop_default` です。`bridge` は Docker の既定の bridge で、Compose はそれを使いません。

### 問5 `Docker-6.0-005`

**正解**: C

一番上の `volumes:` は、名前付きボリュームの宣言です。サービスの `volumes:` で `pgdata:/var/lib/postgresql/data` のように使えます。ボリュームの実際の名前には、プロジェクト名が付きます(例: `shop_pgdata`)。バインドマウントはパスで書くので、宣言は不要です。

### 問6 `Docker-6.0-006`

**正解**: C

推奨のファイル名は `compose.yaml`(または `compose.yml`)です。古い `docker-compose.yml` も、互換性のために読み込まれます。JSON の名前や `Composefile` は既定のファイル名ではありません。

### 問7 `Docker-6.0-007`

**正解**: B

`down` はコンテナと、Compose が作ったネットワークを削除します。名前付きボリュームは残るので、データは失われません。止めるだけなら `stop` です。ボリュームも消すには `-v`、イメージも消すには `--rmi` を付けます。

### 問8 `Docker-6.0-008`

**正解**: A

`docker compose down -v` は、コンテナとネットワークに加えて、名前付きボリュームも削除します。データベースのデータも消えます。`stop` と `restart` は削除せず、`-v` なしの `down` はボリュームを残します。

### 問9 `Docker-6.0-009`

**正解**: C

`up -d --build` は、イメージを作り直してから、変わったサービスのコンテナを作り直して起動します。`restart` と `start` は、既存のコンテナを古いイメージのまま動かします。`--no-build` はビルドをしません。

### 問10 `Docker-6.0-010`

**正解**: B

`docker compose run --rm サービス コマンド` は、そのサービスの設定で新しいコンテナを作ってコマンドを一回だけ実行し、`--rm` で終わったら消します。`exec` は動いているコンテナで実行するもので、新しいコンテナは作りません。

### 問11 `Docker-6.0-011`

**正解**: C

`docker compose config` は、`.env` や環境変数を展開し、複数の Compose ファイルを合わせた最終の設定を表示します。書き方の誤りがあればエラーになるので、確認に使えます。`ps` は一覧、`logs` はログ、`version` はバージョンです。

### 問12 `Docker-6.0-012`

**正解**: D

`--scale web=3` で、`web` のコンテナが 3 つ作られます。
① どのコンテナも `ports: ["8080:8000"]` で、ホストの 8080 番を使おうとします。
② ホストの 1 つのポートは 1 つのコンテナしか使えません。
③ 2 つ目以降が `port is already allocated` になります。

増やすなら、ホスト側のポートを固定しない(`"8000"` だけを書く)か、前にロードバランサーを置きます。

### 問13 `Docker-6.0-013`

**正解**: C

`docker-compose`(ハイフンあり)は、古い Compose v1 のコマンドです。今は Docker CLI のプラグインの `docker compose`(スペース)を使います。機能は同じ Compose です。

### 問14 `Docker-6.0-014`

**正解**: C

短い書き方の `depends_on` は、`db` のコンテナを先に起動する、という順番だけを決めます。データベースが接続を受け付けられる状態になったかは待ちません。待つには、`condition: service_healthy` と healthcheck を使います。

### 問15 `Docker-6.0-015`

**正解**: D

`db` に healthcheck(例: `pg_isready`)を書き、`web` の `depends_on` で `condition: service_healthy` を指定すると、`db` が healthy になってから `web` を起動します。ポートの公開は起動の順番とは関係ありません。それでも、アプリにも接続の再試行を入れておくと堅牢です。

### 問16 `Docker-6.0-016`

**正解**: A

`service_completed_successfully` は、依存先のサービスが終了コード 0 で終わってから起動します。マイグレーションなど、一回だけの処理の後に起動したいときに使います。`service_started` は起動しただけ、`service_healthy` は healthy になったら、です。`service_stopped` という条件はありません。

### 問17 `Docker-6.0-017`

**正解**: C

`${TAG:-latest}` は、`TAG` に値がない(または空の)ときに `latest` を使う書き方です。そのため `myapp:latest` になります。エラーにしたいときは `${TAG:?メッセージ}` と書きます。

### 問18 `Docker-6.0-018`

**正解**: B

同じディレクトリの `.env` は、`compose.yaml` の中の `${…}` を展開するための値です。そのままでは、コンテナに環境変数として渡されません。コンテナに渡すには、`environment` や `env_file` を使います。

### 問19 `Docker-6.0-019`

**正解**: C

`-f` を指定しないと、Compose は `compose.yaml` と、あれば `compose.override.yaml` を自動で重ねて読みます。後のファイルが前のファイルを上書きします。開発用の設定(ソースコードのバインドマウントなど)をここに書くのが一般的です。

### 問20 `Docker-6.0-020`

**正解**: D

`profiles` を付けたサービスは、普段の `up` では起動しません。`--profile` でそのプロファイルを指定したときだけ起動します。`restart: no` は終了したときに再起動しないだけで、`up` では起動します。
