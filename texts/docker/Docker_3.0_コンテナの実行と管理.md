# Docker テキスト 3.0 コンテナの実行と管理

`docker run` の使い方、コンテナの状態の移り変わり、ログと中の調べ方、資源の制限とヘルスチェックを学びます。運用で毎日使う分野です。

## 3.1 docker run の主なオプション

```bash
docker run -d --name web -p 8080:80 -e TZ=Asia/Tokyo --restart unless-stopped nginx:1.27
```

| オプション | 意味 |
|---|---|
| `-d` | バックグラウンドで動かす(detached) |
| `-it` | 対話の端末をつなぐ(`-i` 入力を開いたまま、`-t` 端末を割り当てる)。シェルを使うとき |
| `--name` | コンテナの名前。省略すると自動で付く |
| `-p ホスト:コンテナ` | ポートを公開する(分野 4) |
| `-e KEY=VALUE`、`--env-file` | 環境変数を渡す |
| `-v`、`--mount` | ボリュームやディレクトリをマウントする(分野 5) |
| `--network` | つなぐネットワーク(分野 4) |
| `--rm` | 終了したら自動で削除する(使い捨ての作業に) |
| `--restart` | 再起動の方針(3.2) |
| `-u` | 実行するユーザー |
| `-w` | 作業ディレクトリ |
| `--entrypoint` | イメージの ENTRYPOINT を置き換える |

`docker run` は `docker create`(作る)と `docker start`(起動する)を続けて行うのと同じです。

## 3.2 コンテナのライフサイクル

### 1. 状態

```text
created --start--> running --stop/kill/終了--> exited --rm--> (削除)
                    |  ^
             pause  |  |  unpause
                    v  |
                   paused
```

- **コンテナは、PID 1 のプロセスが終了すると止まります**。`CMD` がすぐ終わるコマンド(例: `echo`)なら、コンテナもすぐに exited になります。
- サーバーのプロセスは、フォアグラウンドで動かし続ける必要があります(デーモンとして裏に回ると、PID 1 が終わってコンテナが止まる)。

### 2. 止め方

| コマンド | 動き |
|---|---|
| `docker stop` | **SIGTERM** を送り、既定で **10 秒**待っても終わらなければ **SIGKILL** で強制終了する(`-t` で秒数を変える) |
| `docker kill` | すぐに SIGKILL を送る(`-s` で別のシグナル) |
| `docker restart` | stop して start する |
| `docker pause` | プロセスを一時停止する(cgroups の freezer) |

アプリが SIGTERM を受けて後片付けをしてから終わるようにすると、安全に止められます(graceful shutdown)。

### 3. 終了コード

`docker ps -a` の STATUS に `Exited (137)` のように表示されます。

| コード | よくある意味 |
|---|---|
| 0 | 正常に終了した |
| 1 | アプリのエラー |
| 125 | `docker run` 自体の失敗(オプションの誤りなど) |
| 126 | コマンドを実行できない(実行の権限がない) |
| 127 | コマンドが見つからない |
| 137 | 128 + 9。**SIGKILL** で終了した。`docker kill`、stop のタイムアウト、**メモリ不足(OOM)** |
| 143 | 128 + 15。**SIGTERM** で正常に終了した |

137 のとき、`docker inspect --format '{{.State.OOMKilled}}' 名前` が `true` なら、メモリの制限を超えて強制終了されています。

### 4. 再起動の方針(--restart)

| 方針 | 動き |
|---|---|
| `no`(既定) | 再起動しない |
| `on-failure[:回数]` | 終了コードが 0 以外のときだけ再起動する |
| `always` | 常に再起動する。手で stop しても、デーモンの再起動のときに起動する |
| `unless-stopped` | 常に再起動する。ただし**手で stop したものは**、デーモンの再起動のときにも起動しない |

## 3.3 ログと中身を調べる

| コマンド | 用途 |
|---|---|
| `docker logs 名前` | 標準出力と標準エラー出力。`-f` で追いかける、`--tail 100`、`--since 10m` |
| `docker exec -it 名前 sh` | 動いているコンテナの中で、別のプロセスを実行する(調査) |
| `docker inspect 名前` | 設定と状態の詳細(JSON)。`--format` で一部を取り出す |
| `docker top 名前` | 中のプロセス |
| `docker stats` | CPU、メモリ、ネットワークの使用量(リアルタイム) |
| `docker port 名前` | 公開しているポートの対応 |
| `docker cp 名前:/path ./` | コンテナとホストの間でファイルをコピーする |
| `docker events` | デーモンで起きたこと(起動、終了、OOM など)の流れ |

- `docker logs` が見るのは、アプリが**標準出力と標準エラー出力**に出したものです。アプリがファイルにだけログを書くと、`docker logs` には出ません。コンテナではログを標準出力に出すのが基本です。
- `docker exec` は**動いているコンテナ**にしか使えません。止まったコンテナは `docker logs` と `docker inspect` で調べます。
- `docker attach` は PID 1 の入出力につなぐもので、抜けるときに Ctrl+C でコンテナを止めてしまうことがあります。調査には `exec` を使います。

## 3.4 資源の制限とヘルスチェック

### 1. 資源の制限

| オプション | 意味 |
|---|---|
| `--memory 512m` | メモリの上限。超えると **OOM で強制終了**(終了コード 137) |
| `--cpus 1.5` | 使える CPU の量(1.5 コア分) |
| `--pids-limit 200` | プロセスの数の上限 |

制限を書かないと、コンテナはホストの資源を上限なしに使えます。1 つのコンテナの暴走でホスト全体が遅くなるのを防ぐため、本番では制限を決めます。

### 2. ヘルスチェック

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

- 状態は `starting` → `healthy` / `unhealthy` で、`docker ps` に表示されます。
- コマンドが 0 で終われば正常、1 なら異常です。`--retries` 回続けて失敗すると unhealthy になります。
- **Docker 単体では、unhealthy になってもコンテナは再起動されません**(再起動の方針は終了したときだけ働く)。Compose の `depends_on` の条件(分野 6)や、オーケストレーター(Kubernetes など)が使います。

### 3. PID 1 の問題と --init

PID 1 のプロセスには、シグナルの既定の動きがなく、終わった子プロセス(ゾンビ)を回収する役目もあります。アプリがそれを想定していないと、シグナルで止まらなかったり、ゾンビが溜まったりします。`docker run --init` を付けると、小さな init プロセス(tini)が PID 1 になり、シグナルの転送とゾンビの回収をします。

### 4. まとめ: よく出る判断

| 問われ方 | 答え |
|---|---|
| コンテナがすぐ exited になる | PID 1 のコマンドがすぐ終わっている。フォアグラウンドで動かす |
| `docker stop` の動き | SIGTERM → 10 秒後に SIGKILL |
| 終了コード 137 | SIGKILL。OOM の可能性を `OOMKilled` で確かめる |
| 手で止めたら再起動しない方針 | `unless-stopped` |
| 動いているコンテナの中を調べる | `docker exec -it 名前 sh` |
| `docker logs` に何も出ない | アプリが標準出力に出していない(ファイルに書いている) |
| unhealthy で自動で再起動されるか | Docker 単体ではされない |
