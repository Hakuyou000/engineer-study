# Docker テキスト 2.0 イメージと Dockerfile

自分のアプリケーションのイメージを作るための Dockerfile の書き方と、イメージを速く・小さく作るための考え方を学びます。

## 2.1 Dockerfile の命令

### 1. Dockerfile の例

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
EXPOSE 8000
USER 1000
CMD ["python", "app.py"]
```

```bash
docker build -t myapp:1.0 .
```

最後の `.` は**ビルドコンテキスト**(Dockerfile から `COPY` できるファイルの範囲)です。

### 2. 主な命令

| 命令 | 役割 |
|---|---|
| `FROM` | 土台にするイメージ(ベースイメージ)。最初に書く |
| `RUN` | ビルドのときにコマンドを実行する(パッケージのインストールなど)。結果が層になる |
| `COPY` | ビルドコンテキストからファイルをコピーする |
| `ADD` | `COPY` に加えて、URL からの取得や tar の自動展開ができる。普通は `COPY` を使う |
| `WORKDIR` | 以降の命令とコンテナの作業ディレクトリ(なければ作る) |
| `ENV` | 環境変数。ビルド中とコンテナの実行中の両方で使える |
| `ARG` | ビルドのときだけの変数。`--build-arg` で渡す。実行中のコンテナには残らない |
| `EXPOSE` | コンテナが待ち受けるポートの**説明**。これだけではホストに公開されない |
| `USER` | 以降の命令とコンテナを実行するユーザー |
| `CMD` | コンテナを起動したときに実行する既定のコマンド |
| `ENTRYPOINT` | コンテナを起動したときに必ず実行するコマンド |
| `LABEL` | メタデータ(作成者、バージョンなど) |
| `HEALTHCHECK` | コンテナが正常かを定期的に確かめるコマンド(分野 3) |
| `VOLUME` | ボリュームを使う場所の宣言(分野 5) |

### 3. exec 形式と shell 形式

| 形式 | 書き方 | 動き |
|---|---|---|
| **exec 形式**(推奨) | `CMD ["python", "app.py"]` | シェルを通さず、そのプログラムを直接 PID 1 として起動する |
| shell 形式 | `CMD python app.py` | `/bin/sh -c "python app.py"` として起動する。PID 1 はシェルになる |

shell 形式だと、`docker stop` が送る SIGTERM をシェルが受け取り、アプリに届かないことがあります。その結果、10 秒待って SIGKILL で強制終了されます。`CMD` と `ENTRYPOINT` は exec 形式で書きます。

### 4. CMD と ENTRYPOINT

| | `CMD` | `ENTRYPOINT` |
|---|---|---|
| `docker run IMAGE 引数` の引数 | **CMD を置き換える** | ENTRYPOINT の**後ろに追加**される |
| 置き換えるには | `docker run IMAGE 新しいコマンド` | `docker run --entrypoint 新しいコマンド IMAGE` |

両方を書くと、`ENTRYPOINT` がコマンド、`CMD` が既定の引数になります。

```dockerfile
ENTRYPOINT ["ping"]
CMD ["localhost"]
```

| 実行 | 実際に動くもの |
|---|---|
| `docker run IMAGE` | `ping localhost` |
| `docker run IMAGE example.com` | `ping example.com`(CMD だけが置き換わる) |

1 つの Dockerfile に `CMD` を複数書くと、**最後の 1 つだけ**が有効です。

## 2.2 レイヤーとビルドキャッシュ

### 1. レイヤー

- イメージは、読み取り専用の**層(レイヤー)**を重ねたものです。ファイルシステムを変える命令(`RUN`、`COPY`、`ADD`)ごとに 1 つの層ができます。
- 層は、同じベースイメージを使うほかのイメージと共有され、ディスクと転送の量が減ります。
- **前の層で入れたファイルを、後の層で削除しても、イメージは小さくなりません**(前の層にファイルが残っているため)。一時ファイルは同じ `RUN` の中で消します。

```dockerfile
# 悪い例: キャッシュが別の層に残る
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# よい例: 1 つの層で入れて消す
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
```

`docker history IMAGE` で、各層を作った命令と大きさを確かめられます。

### 2. ビルドキャッシュ

- 前のビルドと命令(と、`COPY` するファイルの中身)が同じなら、その層を作り直さずにキャッシュを使います。
- ある層のキャッシュが使えなくなると、**それより後の層もすべて作り直し**になります。
- そのため、**変わりにくいものを先に、変わりやすいものを後に**書きます。

```dockerfile
COPY requirements.txt .          # 依存関係の一覧(あまり変わらない)
RUN pip install -r requirements.txt
COPY . .                          # ソースコード(よく変わる)
```

ソースコードを先に全部 `COPY` すると、1 行変えただけで毎回 `pip install` がやり直しになります。

キャッシュを使わずにビルドするには `docker build --no-cache` を使います。

### 3. キャッシュのマウントと CI のキャッシュ

依存関係の一覧が変わると、`pip install` や `npm ci` の層は作り直しになり、すべてのパッケージをまたダウンロードします。BuildKit の**キャッシュのマウント**を使うと、パッケージのダウンロードのキャッシュを、層とは別の場所にビルドをまたいで残せます。

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

- `target` のディレクトリは、その `RUN` の間だけマウントされ、**イメージの層には入りません**。イメージは大きくなりません。
- 同じホストでのビルドでしか効きません。

CI のように毎回まっさらなマシンでビルドすると、ホストにビルドキャッシュがありません。キャッシュをレジストリなどに置いて、次のビルドで使います。

```bash
docker buildx build \
  --cache-from type=registry,ref=registry.example.com/app:buildcache \
  --cache-to   type=registry,ref=registry.example.com/app:buildcache,mode=max \
  -t registry.example.com/app:1.4 --push .
```

| 置き場所 | 書き方 | 使う場面 |
|---|---|---|
| レジストリ | `type=registry,ref=…` | どの CI でも使える |
| GitHub Actions のキャッシュ | `type=gha` | GitHub Actions |
| ローカルのディレクトリ | `type=local,src=…` / `dest=…` | CI のキャッシュの仕組みでディレクトリを保存する |

`mode=max` にすると、マルチステージビルドの途中のステージの層もキャッシュに入れます(既定の `min` は最後のイメージの層だけ)。

### 4. .dockerignore

ビルドコンテキストから除くファイルを書きます(`.gitignore` と似た書き方)。

```
.git
node_modules
*.log
.env
```

- コンテキストが小さくなり、ビルドが速くなります。
- `.env` や秘密鍵などが、誤ってイメージに入るのを防ぎます。

## 2.3 マルチステージビルドと小さいイメージ

### 1. マルチステージビルド

ビルドに必要な道具(コンパイラなど)と、実行に必要なものを分けます。

```dockerfile
FROM golang:1.25 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app .

FROM gcr.io/distroless/static-debian12
COPY --from=build /out/app /app
USER nonroot
ENTRYPOINT ["/app"]
```

- `FROM … AS 名前` で段階に名前を付け、`COPY --from=名前` で前の段階からファイルだけをコピーします。
- **最後の段階だけ**が最終のイメージになります。コンパイラやソースコードは入りません。
- `docker build --target build .` で、途中の段階までをビルドできます(テスト用など)。

### 2. ベースイメージの選び方

| 種類 | 特徴 |
|---|---|
| 通常(例: `python:3.13`) | 道具がそろっていて大きい |
| `-slim` | 不要なものを減らした Debian ベース |
| `alpine` | とても小さい。C ライブラリが musl なので、互換性に注意 |
| distroless | シェルもパッケージマネージャーもない。実行に必要なものだけ |
| `scratch` | 空のイメージ。静的にリンクしたバイナリだけを置く |

小さいイメージは、転送と起動が速く、入っているソフトウェアが少ないので**脆弱性も少なく**なります。

## 2.4 ビルドとタグ

### 1. docker build の主なオプション

| オプション | 用途 |
|---|---|
| `-t 名前:タグ` | イメージに名前とタグを付ける(複数指定できる) |
| `-f パス` | `Dockerfile` 以外の名前・場所のファイルを使う |
| `--build-arg KEY=VALUE` | `ARG` に値を渡す |
| `--no-cache` | キャッシュを使わない |
| `--target 名前` | マルチステージの途中の段階まで |
| `--platform linux/arm64` | 別の CPU アーキテクチャ向けにビルドする |

複数のアーキテクチャ(amd64 と arm64)のイメージをまとめて作るには、`docker buildx build --platform linux/amd64,linux/arm64` を使います。ビルドには **BuildKit** が使われます(既定)。

### 2. イメージの名前

```
registry.example.com/team/myapp:1.0
└──── レジストリ ────┘└名前空間┘└リポジトリ┘└タグ┘
```

- レジストリを省略すると Docker Hub(`docker.io`)です。公式イメージは `library/` が省略されています(`nginx` = `docker.io/library/nginx`)。
- **タグを省略すると `latest`** です。`latest` は「最新」という意味ではなく、ただの既定の名前です。
- タグは後から別のイメージに付け替えられます。中身を確実に固定するには、**ダイジェスト**(`nginx@sha256:…`)で指定します。
- 別名を付けるには `docker tag 元 新しい名前` を使います(イメージは複製されず、同じイメージに名前が増えるだけ)。

### 3. まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| `EXPOSE` だけでホストからつながるか | つながらない。`-p` で公開する |
| `docker run IMAGE 引数` で置き換わるのは | `CMD`(`ENTRYPOINT` には追加される) |
| `docker stop` で止まるのに 10 秒かかる | shell 形式の CMD でシグナルが届いていないことが多い。exec 形式にする |
| ビルドを速くする | 変わりにくいものを先に COPY して、キャッシュを効かせる |
| イメージを小さくする | マルチステージ、小さいベースイメージ、同じ RUN で一時ファイルを消す |
| タグを省略すると | `latest` |
| 中身を確実に固定する | ダイジェストで指定する |
