# Docker 問題 8.0 セキュリティと運用、トラブルシュート

対象: 実務の Docker / 全24問 / すべてオリジナル問題
対応テキスト: `Docker_8.0_セキュリティと運用.md`
解答・解説は末尾。

## 問題

### 8.1 コンテナのセキュリティ

**問1** `Docker-8.0-001` コンテナを root ユーザーで動かすことの危険として、最も適切なものはどれか。

- A. ログが出なくなる
- B. コンテナの起動が遅くなる
- C. コンテナの中の root はホストの UID 0 と同じなので、コンテナから抜け出されたときの被害が大きい
- D. ネットワークが使えなくなる

**問2** `Docker-8.0-002` Dockerfile で、アプリを root 以外のユーザーで動かすための命令はどれか。

- A. `ENV`
- B. `USER`
- C. `LABEL`
- D. `WORKDIR`

**問3** `Docker-8.0-003` 監視のツールのコンテナに `-v /var/run/docker.sock:/var/run/docker.sock` を付けるよう求められた。この設定の危険として正しいものはどれか。

- A. コンテナから Docker デーモンを操作でき、ホストの root と同じ権限を渡すことになる
- B. ログの量が増える
- C. 危険はない
- D. コンテナのメモリが不足する

**問4** `Docker-8.0-004` `--privileged` について、正しいものはどれか。

- A. ほぼすべての特権とホストのデバイスへのアクセスを与え、ホストを乗っ取られる危険がある
- B. 読み取り専用で起動するオプションである
- C. ログを詳しく出すオプションである
- D. 安全性を高めるオプションで、本番で推奨される

**問5** `Docker-8.0-005` Web アプリのコンテナで、改ざんやマルウェアの書き込みを防ぐため、ファイルシステムを書き込めなくしたい。一時ファイルを書く場所だけは必要である。正しい組み合わせはどれか。

- A. `--network none` と `-P`
- B. `--privileged` と `-v /tmp`
- C. `--rm` と `--init`
- D. `--read-only` と `--tmpfs /tmp`

**問6** `Docker-8.0-006` root で動くコンテナで、使える特権(ケーパビリティ)を、80 番のポートで待ち受けるためのものだけにしたい。正しい書き方はどれか。

- A. `--privileged`
- B. `--cap-drop ALL --cap-add NET_BIND_SERVICE`
- C. `--security-opt seccomp=unconfined`
- D. `--cap-add ALL`

**問7** `Docker-8.0-007` 開発者を `docker` グループに入れて、sudo なしで `docker` コマンドを使えるようにした。このときの注意として正しいものはどれか。

- A. 権限は変わらないので問題ない
- B. `docker` グループに入るとコンテナが自動で root 以外になる
- C. `docker` グループのユーザーはイメージを pull できない
- D. `docker` グループは実質的に root と同じ権限を持つので、信頼できるユーザーだけに限る

**問8** `Docker-8.0-008` npm のプライベートレジストリの認証トークンを、ビルドのときだけ使いたい。トークンをイメージのどの層にも残さない方法はどれか。

- A. `ARG NPM_TOKEN` で渡す
- B. `ENV NPM_TOKEN=…` を書く
- C. BuildKit の `RUN --mount=type=secret` と `docker build --secret` を使う
- D. `COPY .npmrc` で入れて、次の `RUN` で削除する

**問9** `Docker-8.0-009` Dockerfile の `ENV DB_PASSWORD=secret` にパスワードを書いた。起こる問題として正しいものはどれか。

- A. コンテナが起動しない
- B. ビルドがエラーになる
- C. パスワードがイメージに残り、`docker inspect` や `docker history` で誰でも見られる
- D. パスワードは自動で暗号化されるので問題ない

**問10** `Docker-8.0-010` Docker デーモンを root 以外のユーザーで動かし、コンテナから抜け出されたときの被害を小さくする仕組みはどれか。

- A. `--privileged`
- B. `--restart always`
- C. rootless モード
- D. host ネットワーク

### 8.2 ログの運用

**問11** `Docker-8.0-011` Docker の既定のロギングドライバーはどれか。

- A. `journald`
- B. `json-file`
- C. `syslog`
- D. `awslogs`

**問12** `Docker-8.0-012` 長期間動いているコンテナのログで、ホストのディスクが一杯になった。ロギングドライバーは既定のままである。再発を防ぐ設定として正しいものはどれか。

- A. `docker logs --tail 100` を毎日実行する
- B. `/etc/docker/daemon.json` の `log-opts` で `max-size` と `max-file` を決める
- C. `--restart always` を付ける
- D. コンテナの `--memory` を増やす

**問13** `Docker-8.0-013` `daemon.json` でログのローテーションを設定し、デーモンを再起動した。すでに動いているコンテナへの適用として正しいものはどれか。

- A. イメージを作り直す必要がある
- B. 新しく作ったコンテナから適用される。既存のコンテナは作り直す必要がある
- C. 適用されない。コンテナごとにしか設定できない
- D. すぐにすべてのコンテナに適用される

**問14** `Docker-8.0-014` コンテナのログを、Amazon CloudWatch Logs に直接送りたい。使うロギングドライバーはどれか。

- A. `local`
- B. `json-file`
- C. `awslogs`
- D. `none`

### 8.3 ディスクの管理

**問15** `Docker-8.0-015` ビルドのサーバーで、ディスクの大部分をビルドキャッシュが使っていた。ビルドキャッシュだけを削除するコマンドはどれか。

- A. `docker container prune`
- B. `docker network prune`
- C. `docker builder prune`
- D. `docker volume prune`

**問16** `Docker-8.0-016` `docker image prune` を、オプションなしで実行した。削除されるものはどれか。

- A. 名前もタグもない(dangling な)イメージ
- B. 動いているコンテナが使っているイメージ
- C. すべてのイメージ
- D. ボリューム

### 8.4 よくある障害の調べ方

**問17** `Docker-8.0-017` arm64 の Mac でビルドしたイメージを、amd64 の本番サーバーで起動したところ、`exec format error` で終了した。原因と対処として正しいものはどれか。

- A. メモリが足りない。`--memory` を増やす
- B. ログのローテーションが必要である
- C. CPU のアーキテクチャが合っていない。`--platform linux/amd64` でビルドし直す
- D. ポートが重なっている。別のポートで公開する

**問18** `Docker-8.0-018` `docker pull` で `toomanyrequests` のエラーが出た。Docker Hub から匿名で pull している。最も適切な対処はどれか。

- A. イメージの名前を変える
- B. Docker Hub にログインして pull する、または自社のレジストリやミラーを使う
- C. `docker system prune` を実行する
- D. `--privileged` を付ける

**問19** `Docker-8.0-019` `docker ps` を実行すると、`permission denied while trying to connect to the Docker daemon socket` と表示された。最も考えられる原因はどれか。

- A. 実行したユーザーに、Docker のソケットを使う権限がない(`docker` グループに入っていない、または sudo を使っていない)
- B. コンテナがすべて止まっている
- C. イメージが壊れている
- D. ネットワークが none である

**問20** `Docker-8.0-020` 次の調査の結果から、最も考えられる原因はどれか。

```
$ docker ps -a --format '{{.Names}} {{.Status}}'
api Exited (137) 2 minutes ago
$ docker inspect --format '{{.State.OOMKilled}}' api
true
```

- A. コマンドが見つからなかった
- B. メモリの上限を超えて、OOM で強制終了された
- C. 誰かが `docker stop` で止めた
- D. 正常に終了した

**問21** `Docker-8.0-021` `no space left on device` のエラーでビルドが失敗した。最初に確かめるべきものとして、最も適切なものはどれか。

- A. `docker network ls`
- B. `docker version`
- C. `docker port`
- D. `docker system df` で、イメージ、ビルドキャッシュ、ボリュームなどの使用量

**問22** `Docker-8.0-022` コンテナがすぐ終了する。原因を調べる最初の手順として、最も適切なものはどれか。

- A. `docker exec` でコンテナの中に入る
- B. イメージを削除して pull し直す
- C. ホストを再起動する
- D. `docker ps -a` で終了コードを見て、`docker logs` でアプリの出力を確かめる

### 8.5 別のホストの Docker を操作する: docker context

**問23** `Docker-8.0-023` 手元の端末の docker コマンドで、ssh でつながるビルド用のサーバー `build01` の Docker を操作したい。正しい手順はどれか。

- A. `docker context create build01 --docker "host=ssh://ops@build01"` で接続先を作り、`docker context use build01` で切り替える
- B. `docker login build01` を実行する
- C. `docker network connect build01` を実行する
- D. build01 の Docker の API を TCP の 2375 番で TLS なしに公開し、誰でも接続できるようにする

**問24** `Docker-8.0-024` `docker context use default` を実行したのに、`docker ps` が手元ではなく別のホストのコンテナを表示する。原因として最も適切なものはどれか。

- A. Docker Desktop の再起動が必要である
- B. `docker context ls` の結果が古い
- C. 手元のイメージが古い
- D. 環境変数 `DOCKER_HOST` が設定されていて、context の設定より優先されている


## 解答・解説

### 問1 `Docker-8.0-001`

**正解**: C

コンテナの中の root は、ホストのカーネルから見ても UID 0 です。脆弱性を突かれてコンテナから抜け出されると、ホストの root として操作される危険があります。起動の速さ、ログ、ネットワークには影響しません。

### 問2 `Docker-8.0-002`

**正解**: B

`USER` 命令で、以降の命令とコンテナを実行するユーザーを決めます(例: `USER 1000`)。`docker run -u` でも指定できます。`WORKDIR` は作業ディレクトリ、`ENV` は環境変数、`LABEL` はメタデータです。

### 問3 `Docker-8.0-003`

**正解**: A

`docker.sock` をマウントすると、コンテナから Docker デーモンに何でも命令できます。`--privileged` のコンテナや、ホストの `/` をマウントしたコンテナを作れるので、実質的にホストの root の権限を渡すことになります。本当に必要か、読み取りだけのプロキシで済まないかを検討します。

### 問4 `Docker-8.0-004`

**正解**: A

`--privileged` は、ほぼすべてのケーパビリティとホストのデバイスへのアクセスを与え、多くの分離を無効にします。ホストを乗っ取られる危険があるので、原則として使いません。

読み取り専用で起動するのは `--read-only`、ログを詳しくするのはデーモンの `--log-level debug` です。`--privileged` は安全性を下げるので、本番では避けます。

### 問5 `Docker-8.0-005`

**正解**: D

`--read-only` で、コンテナのファイルシステムを読み取り専用にします。一時ファイルを書く場所だけ、`--tmpfs /tmp` やボリュームで用意します。`--privileged` は危険な特権、`--rm` と `--init` は書き込みの制限ではありません。

### 問6 `Docker-8.0-006`

**正解**: B

`--cap-drop ALL` で全部のケーパビリティを外し、`--cap-add NET_BIND_SERVICE`(1024 番より小さいポートで待ち受ける)だけを足します。必要な特権だけを持たせる最小の権限の考え方です。`--cap-add ALL` と `--privileged` は逆に特権を増やし、seccomp を無効にするのも危険です。

### 問7 `Docker-8.0-007`

**正解**: D

`docker` グループのユーザーは、Docker のソケットを使えるので、ホストの `/` をマウントしたコンテナを作るなどして、実質的に root の操作ができます。信頼できるユーザーだけに限ります。より安全にするには rootless モードを検討します。

### 問8 `Docker-8.0-008`

**正解**: C

BuildKit の `RUN --mount=type=secret,id=npmrc …` と `docker build --secret id=npmrc,src=.npmrc` を使うと、秘密の値はその `RUN` の間だけ見え、層には残りません。`ARG` と `ENV` は `docker history` などに残り、`COPY` したファイルは後で削除しても前の層に残ります。

### 問9 `Docker-8.0-009`

**正解**: C

`ENV` に書いた値はイメージの設定に残り、イメージを持っている人なら `docker inspect` や `docker history` で見られます。イメージをレジストリに push すると、そのまま広がります。自動で暗号化されることはなく、起動やビルドのエラーにもならないので気づきにくい問題です。パスワードは実行のときに、環境変数やシークレットで渡します。

### 問10 `Docker-8.0-010`

**正解**: C

rootless モードは、Docker デーモンとコンテナを root 以外のユーザーで動かします。コンテナから抜け出されても、ホストの root の権限は得られません。`--privileged` と host ネットワークは逆に分離を弱め、再起動の方針はセキュリティとは関係ありません。

### 問11 `Docker-8.0-011`

**正解**: B

既定のロギングドライバーは `json-file` で、コンテナの標準出力と標準エラー出力を、ホストの JSON のファイルに書きます。`syslog`、`journald`、`awslogs` は設定したときだけ使われます。

### 問12 `Docker-8.0-012`

**正解**: B

既定の `json-file` はローテーションしないので、ログが増え続けます。`/etc/docker/daemon.json` の `log-opts` で `max-size`(1 ファイルの上限)と `max-file`(残すファイルの数)を決めると、古いログが自動で消されます。`docker logs --tail` は表示するだけで、ファイルは減りません。

### 問13 `Docker-8.0-013`

**正解**: B

`daemon.json` のログの設定は、デーモンの再起動の後に**新しく作ったコンテナ**から適用されます。既存のコンテナは、作られたときの設定のままなので、作り直す必要があります。コンテナごとの `--log-opt` でも設定でき、イメージは関係ありません。

### 問14 `Docker-8.0-014`

**正解**: C

`awslogs` ドライバーは、コンテナのログを Amazon CloudWatch Logs に送ります。`json-file` と `local` はホストのファイル、`none` はログを残しません。

### 問15 `Docker-8.0-015`

**正解**: C

`docker builder prune` は、ビルドキャッシュを削除します。`volume prune` はボリューム、`container prune` は止まったコンテナ、`network prune` は使われていないネットワークを削除するもので、ビルドキャッシュは消しません。

### 問16 `Docker-8.0-016`

**正解**: A

`docker image prune` は、既定では名前もタグもない(dangling な)イメージだけを削除します。使われていないイメージを全部消すには `-a` を付けます。動いているコンテナのイメージは削除されず、ボリュームは対象外です。

### 問17 `Docker-8.0-017`

**正解**: C

`exec format error` は、実行ファイルの CPU のアーキテクチャがホストと合わないときに出ます。arm64 の Mac でビルドしたイメージは arm64 用なので、amd64 のサーバーでは動きません。`docker build --platform linux/amd64` でビルドし直すか、`buildx` で両方のアーキテクチャのイメージを作ります。

メモリが足りないときは OOM で終了し、終了コードは 137 になります。ログのローテーションやポートの重なりでは、起動したプログラムの形式のエラーは出ません。

### 問18 `Docker-8.0-018`

**正解**: B

`toomanyrequests` は、Docker Hub の pull の回数の制限を超えたことを表します。ログインすると制限が緩くなり、自社のレジストリやミラー(プルスルーキャッシュ)を使うと Docker Hub への pull を減らせます。特権や prune、名前の変更は関係ありません。

### 問19 `Docker-8.0-019`

**正解**: A

`docker` コマンドは、Docker のソケット(`/var/run/docker.sock`)を通してデーモンにつなぎます。このソケットは root と `docker` グループだけが使えるので、それ以外のユーザーでは `permission denied` になります。sudo を使うか、`docker` グループに入れます(危険性に注意)。

コンテナが止まっていても、`docker ps` は空の一覧を表示するだけです。イメージやネットワークの問題は、デーモンにつながった後の別のエラーになります。

### 問20 `Docker-8.0-020`

**正解**: B

出力を順に読みます。
① `Exited (137)` は、SIGKILL(128 + 9)で終わったことを表します。
② `OOMKilled` が `true` なので、メモリの上限を超えてカーネルの OOM で強制終了されたと分かります。

`docker stop` で正常に止まれば 143(SIGTERM)、タイムアウトしても OOMKilled は false です。コマンドが見つからなければ 127、正常な終了なら 0 です。

### 問21 `Docker-8.0-021`

**正解**: D

`no space left on device` は、ディスクが一杯であることを表します。`docker system df` で、イメージ、コンテナ、ボリューム、ビルドキャッシュのどれが容量を使っているかを確かめ、不要なものを prune します。ログが原因なら、ログのローテーションも設定します。

### 問22 `Docker-8.0-022`

**正解**: D

すぐ終了するコンテナは、まず `docker ps -a` で終了コードを見て、`docker logs` でアプリがエラーを出していないかを確かめます。止まったコンテナには `docker exec` は使えません。原因が分からないままイメージを入れ直したり、ホストを再起動したりしても解決しません。

### 問23 `Docker-8.0-023`

**正解**: A

docker コマンドは、接続先の Docker デーモンに API で命令を送るだけです。`docker context` で接続先を登録して切り替えると、以降のコマンドはそのホストで実行されます。ssh で接続するので、build01 のユーザーが Docker を使える必要があります。一回だけなら `docker --context build01 ps` とも書けます。

- B. `docker login` はレジストリへのログインで、別のホストの Docker の操作とは関係ありません。
- C. `docker network connect` は、コンテナをネットワークにつなぐコマンドです。
- D. TLS なしで Docker の API を公開すると、接続できる人は誰でもホストの root の権限を持てるので、絶対に避けます。

### 問24 `Docker-8.0-024`

**正解**: D

環境変数 `DOCKER_HOST`(と `DOCKER_CONTEXT`)が設定されていると、`docker context use` で選んだ接続先より優先されます。シェルの設定ファイルや CI の設定に残っていないかを確かめ、`unset DOCKER_HOST` で外します。`docker context ls` を実行すると、環境変数で上書きされていることを知らせる警告が出ます。

- A. 接続先の選び方の問題で、Docker Desktop の再起動では直りません。
- B. `docker context ls` は毎回その時点の設定を表示します。
- C. イメージは、どのホストに接続するかとは関係ありません。
