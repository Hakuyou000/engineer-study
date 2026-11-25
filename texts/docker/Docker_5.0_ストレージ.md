# Docker テキスト 5.0 ストレージ

コンテナのデータを、コンテナを消しても残す方法を学びます。データベースのデータを失わないために必須の知識です。

## 5.1 コンテナの書き込み層

- コンテナは、イメージの読み取り専用の層の上に、**書き込みのできる層**を 1 つ持ちます。コンテナの中で作ったり変えたりしたファイルは、この層に入ります(コピーオンライト)。
- 書き込み層は**コンテナと一緒に消えます**。`docker rm` でデータもなくなります。
- `docker stop` と `docker start` では消えません(コンテナ自体は残っているため)。
- 書き込み層への読み書きは、ストレージドライバー(overlay2)を通るので、大量の書き込みには向きません。

そのため、残したいデータは、次の 3 つのどれかでコンテナの外に置きます。

## 5.2 ボリューム、バインドマウント、tmpfs

| 種類 | データの場所 | 特徴 | 主な用途 |
|---|---|---|---|
| **ボリューム** | Docker が管理する場所(Linux では `/var/lib/docker/volumes/`) | Docker のコマンドで管理できる。ホストのディレクトリ構成に依存しない | データベースなど、本番のデータ |
| **バインドマウント** | ホストの好きなパス | ホストのファイルをそのまま見せる。ホストの構成に依存する | 開発中のソースコード、設定ファイル |
| **tmpfs** | ホストのメモリ | ディスクに書かない。コンテナが止まると消える | 一時ファイル、ディスクに残したくないもの |

コンテナと、データの置き場所の関係です。書き込み層だけがコンテナと一緒に消えます。

```text
[container]
  |
  +-- writable layer                                      <- docker rm で消える
  |
  +-- /var/lib/postgresql/data  <==  [volume pgdata]      <- コンテナを消しても残る
  +-- /usr/share/nginx/html     <==  [host dir ./html]    <- ホストのディレクトリがそのまま見える
  `-- /tmp                      <==  [tmpfs]              <- ホストのメモリ。止まると消える
```

### 1. ボリューム

```bash
docker volume create pgdata
docker run -d --name db -v pgdata:/var/lib/postgresql/data postgres:17
docker rm -f db                   # コンテナを消しても
docker volume ls                  # pgdata は残る
docker run -d --name db2 -v pgdata:/var/lib/postgresql/data postgres:17   # データを引き継げる
```

- 名前を付けたもの(**名前付きボリューム**)と、名前のない**匿名ボリューム**(`-v /data` や Dockerfile の `VOLUME`)があります。
- コンテナを消してもボリュームは残ります。ボリュームを消すには `docker volume rm`、使われていないものをまとめて消すには `docker volume prune`(名前付きも含めるなら `-a`)です。`docker rm -v` は、そのコンテナの**匿名**ボリュームを一緒に消します。
- 空の新しいボリュームをマウントすると、イメージのそのディレクトリの中身がボリュームにコピーされます。
- 複数のコンテナで同じボリュームを共有できます。

### 2. バインドマウント

```bash
docker run -d -v "$(pwd)/html:/usr/share/nginx/html:ro" -p 8080:80 nginx:1.27
```

- ホストのディレクトリが、コンテナのそのパスに**かぶさります**。イメージのそのパスにあった中身は見えなくなります。
- ホストのパスが存在しないと、`-v` の書き方では空のディレクトリが作られます(`--mount` ではエラー)。
- ファイルの持ち主の UID/GID はホストのままなので、コンテナの中のユーザーに権限がないと読み書きできません。
- 開発では、ソースコードをバインドマウントすると、イメージを作り直さずに変更を反映できます。

### 3. -v と --mount

```bash
# 同じ意味
docker run -v pgdata:/var/lib/postgresql/data:ro …
docker run --mount type=volume,source=pgdata,target=/var/lib/postgresql/data,readonly …
```

- `-v` は短く書けます。`--mount` は項目名を書くので読みやすく、誤りが分かりやすい書き方です。
- `-v` の左側が `/` や `./` で始まるパスならバインドマウント、名前ならボリュームです。
- `:ro`(`readonly`)で読み取り専用にできます。

### 4. tmpfs

```bash
docker run --tmpfs /tmp:size=64m myapp
```

## 5.3 データのバックアップと調査

### 1. ボリュームのバックアップ

ボリュームを一時的なコンテナにマウントして、tar で固めます。

```bash
docker run --rm \
  -v pgdata:/data:ro \
  -v "$(pwd)":/backup \
  alpine tar czf /backup/pgdata.tgz -C /data .
```

バックアップ用の一時的なコンテナを通して、ボリュームの中身をホストに取り出す流れです。

```text
[volume pgdata]
  |
  |  -v pgdata:/data:ro
  v
[alpine container]  tar czf /backup/pgdata.tgz -C /data .
  |
  |  -v "$(pwd)":/backup
  v
[host: current directory]/pgdata.tgz
```

- データベースは、動いたままファイルをコピーすると、壊れたバックアップになることがあります。止めてからコピーするか、データベースの機能(`pg_dump` など)を使います。

### 2. 使っている容量の確認と掃除

| コマンド | 動き |
|---|---|
| `docker system df` | イメージ、コンテナ、ボリューム、ビルドキャッシュの使用量 |
| `docker volume prune` | どのコンテナからも使われていない**匿名**ボリュームを削除する。名前付きも消すには `-a`(**データも消える**) |
| `docker system prune` | 止まったコンテナ、使われていないネットワーク、名前のないイメージ、ビルドキャッシュを削除する。ボリュームは `--volumes` を付けたときだけ |

`prune` はまとめて消すので、本番では何が消えるかを確かめてから使います。

### まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| `docker rm` でコンテナの中のデータは | 消える(書き込み層ごと) |
| データベースのデータを残す | 名前付きボリューム |
| ホストのソースコードをコンテナに見せる | バインドマウント |
| ディスクに書きたくない一時データ | tmpfs |
| コンテナを消したらボリュームは | 残る(`docker volume rm` で消す) |
| バインドマウントしたパスにあったイメージの中身は | 見えなくなる |
