# LinuC 101 テキスト 1.01 Linux のインストールと仮想マシン・コンテナの利用

Linux を入れて起動し、ssh で接続して止めるまでの流れ、仮想マシンとコンテナの違い、起動の仕組み(systemd)、プロセスの扱い、デスクトップ環境の仕組みを学びます。

## 1.01.1 Linux のインストール、起動、接続、切断と停止 (重要度4)

### 1. インストールで決めること

| 項目 | 内容 |
|---|---|
| ファームウェア | パソコンの電源を入れて最初に動くプログラム。新しい機械は **UEFI**、古い機械は **BIOS**。UEFI では ESP(EFI システムパーティション)が必要 |
| パッケージグループ | 「サーバー」「GUI のあるサーバー」「最小のインストール」などの、まとめて入れるソフトウェアの組 |
| タイムゾーン | 日本なら Asia/Tokyo。ハードウェアの時計を UTC にするかも選ぶ |
| root のパスワードと一般ユーザー | 普段は一般ユーザーで作業し、必要なときだけ sudo を使う |
| GUI / CUI | GUI はマウスで操作する画面、CUI(CLI)は文字で操作する画面。サーバーは CUI が普通 |

### 2. ログアウトと停止、再起動

| コマンド | 動き |
|---|---|
| `exit`、`logout`、`Ctrl+D` | シェルを終えてログアウトする(`Ctrl+D` は「入力の終わり」を送る) |
| `shutdown -h now` | すぐに停止する(`-h` は halt または電源を切る) |
| `shutdown -r now` | すぐに再起動する |
| `shutdown -h +10 "メンテナンスします"` | 10 分後に停止し、ログインしているユーザーにメッセージを送る |
| `shutdown -h 23:00` | 23 時に停止する |
| `shutdown -c` | 予約した shutdown を取り消す |
| `reboot` | 再起動する |
| `poweroff` | 停止して電源を切る |
| `halt` | システムを止める(電源を切るかは環境による) |

systemd のシステムでは、これらは `systemctl poweroff`、`systemctl reboot`、`systemctl halt` と同じ動きになります。

### 3. ssh で接続する

```bash
ssh sato@192.168.1.10          # ユーザー sato でログイン
ssh -p 2222 sato@server1       # ポートを変えているとき
ssh -i ~/.ssh/id_ed25519 sato@server1   # 使う秘密鍵を指定する
```

初めて接続するサーバーでは、サーバーの公開鍵の指紋(フィンガープリント)が表示されます。`yes` と答えると、`~/.ssh/known_hosts` に記録されます。次からは記録と比べ、違えば警告して接続を止めます(なりすましの防止)。

### 4. 鍵の認証

パスワードの代わりに、鍵の組で認証できます。

```bash
ssh-keygen -t ed25519          # 鍵の組を作る(RSA なら -t rsa)
ssh-copy-id sato@server1       # 公開鍵をサーバーに登録する
```

| ファイル | 置き場所 | 内容 |
|---|---|---|
| `~/.ssh/id_rsa`、`~/.ssh/id_ed25519` | 手元 | 秘密鍵。パーミッションは 600。人に渡さない |
| `~/.ssh/id_rsa.pub`、`~/.ssh/id_ed25519.pub` | 手元 | 公開鍵。サーバーに登録する |
| `~/.ssh/authorized_keys` | サーバー | ログインを許す公開鍵の一覧(1 行に 1 つ) |
| `~/.ssh/known_hosts` | 手元 | 接続したことのあるサーバーの公開鍵 |

`ssh-copy-id` は、手元の公開鍵をサーバーの `~/.ssh/authorized_keys` に追記します。

鍵の認証で、公開鍵を登録してからログインするまでの流れを図にします。

```text
client                         server
  |                              |
  |  ssh-copy-id                 |
  |-- id_ed25519.pub ----------->|  公開鍵を authorized_keys に追記する
  |                              |
  |  ssh sato@server1            |
  |----------------------------->|  公開鍵に合う秘密鍵を持っているか確かめる
  |<-----------------------------|  確かめられたらログインできる
  |                              |
```

秘密鍵は手元から出ません。サーバーには公開鍵だけを置きます。


## 1.01.2 仮想マシン・コンテナの概念と利用 (重要度4)

### 1. 仮想マシンとハイパーバイザー

**ハイパーバイザー**は、1 台の物理のコンピューターの上で、複数の**仮想マシン**(VM)を動かすソフトウェアです。それぞれの VM は、自分の OS(ゲスト OS)を持ちます。

| 種類 | 動き方 | 例 |
|---|---|---|
| ハイパーバイザー型(タイプ 1) | ハードウェアの上で直接動く | KVM、Xen、VMware ESXi、Hyper-V |
| ホスト型(タイプ 2) | 普通の OS(ホスト OS)の上のアプリとして動く | VirtualBox、VMware Workstation |

2 つの型を、下から重ねて描いた図です。

```text
Type 1 (KVM, Xen, VMware ESXi, Hyper-V)
  [VM]   [VM]
  [Hypervisor]
  [Hardware]

Type 2 (VirtualBox, VMware Workstation)
  [VM]   [VM]
  [Hypervisor]
  [Host OS]
  [Hardware]
```

違いは、間にホスト OS があるかどうかです。


- **仮想化支援機能**: CPU の機能で、仮想化を速くします。Intel は **VT-x**、AMD は **AMD-V** です。Linux では `/proc/cpuinfo` の flags に `vmx`(Intel)か `svm`(AMD)があるかで確かめます。
- **KVM** は Linux のカーネルの機能で、Linux をハイパーバイザーにします。仮想化支援機能が必要です。

```bash
grep -E -c 'vmx|svm' /proc/cpuinfo    # 1 以上なら仮想化支援機能がある
```

### 2. virsh で仮想マシンを操作する

`virsh` は、libvirt(KVM などをまとめて扱う仕組み)のコマンドです。

| コマンド | 動き |
|---|---|
| `virsh list --all` | 止まっているものも含めて VM の一覧 |
| `virsh start vm1` | 起動する |
| `virsh shutdown vm1` | ゲスト OS に停止を頼む(正常な停止) |
| `virsh destroy vm1` | 強制的に止める(電源を抜くのに近い。VM は消えない) |
| `virsh reboot vm1` | 再起動する |
| `virsh dominfo vm1` | VM の情報 |
| `virsh undefine vm1` | VM の定義を消す |

`destroy` という名前ですが、VM そのものは消えません。強制的に停止するだけです。

### 3. コンテナ

**コンテナ**は、OS の上で、ほかと分けられた環境でアプリを動かす仕組みです。VM と違い、ホストの**カーネルを共有**し、ゲスト OS を持ちません。

| | 仮想マシン | コンテナ |
|---|---|---|
| OS | VM ごとにゲスト OS | ホストのカーネルを共有 |
| 起動の速さ | 分単位 | 秒単位 |
| 大きさ | GB 単位 | MB 単位 |
| 分離の強さ | 強い | VM より弱い |
| 別の OS | Windows も動かせる | ホストと同じカーネル(Linux の上なら Linux のコンテナ) |

仮想マシンとコンテナの構成の違いを、下から重ねて描いた図です。

```text
VM
  [App A]      [App B]
  [Guest OS]   [Guest OS]      VM ごとにゲスト OS(カーネル)を持つ
  [Hypervisor]
  [Hardware]

Container
  [App A]      [App B]
  [Runtime]                    docker などの、コンテナを動かす部品
  [Host OS (Linux kernel)]     カーネルを、すべてのコンテナで共有する
  [Hardware]
```

コンテナにはゲスト OS がないので、小さく、速く起動します。


Linux のコンテナは、カーネルの **namespace**(見えるものを分ける)と **cgroups**(使える資源を制限する)で作られています。

### 4. docker の基本の操作

```bash
docker pull nginx:1.27                     # イメージを取得する
docker images                              # 手元のイメージの一覧
docker run -d --name web -p 8080:80 nginx:1.27   # コンテナを起動する
docker ps                                  # 動いているコンテナ(-a で止まったものも)
docker exec -it web bash                   # 動いているコンテナでシェルを使う
docker logs web                            # ログ
docker stop web                            # 止める
docker rm web                              # 消す
docker rmi nginx:1.27                      # イメージを消す
```

- **イメージ**はコンテナの元になるひな形、**コンテナ**はイメージから作った動いている環境です。
- 詳しくは Docker のテキストで学びます。

## 1.01.3 ブートプロセスと systemd (重要度4)

### 1. 起動の流れ

1. **UEFI / BIOS** がハードウェアを確かめ、起動するディスクを選ぶ
2. **ブートローダー**(GRUB 2)が動き、カーネルと initramfs を読み込む
3. **カーネル**が動き、ハードウェアを使えるようにし、initramfs の中の道具でルートファイルシステムをマウントする
4. カーネルが最初のプロセス(PID 1)として **systemd** を起動する
5. systemd が、決められた目標(ターゲット)に必要なサービスを起動する

この流れを図にします。

```text
[UEFI / BIOS]    ハードウェアを確かめ、起動するディスクを選ぶ
    |
    v
[GRUB 2]         カーネルと initramfs を読み込む
    |
    v
[kernel]         ルートファイルシステムをマウントする
    |
    v
[systemd]        PID 1 として起動する
    |
    v
[target]         multi-user.target などに必要なサービスを起動する
```


起動のときのカーネルのメッセージは `dmesg` で、systemd のログを含めた全体は `journalctl -b` で見ます。

### 2. ユニットとターゲット

systemd は、管理する対象を**ユニット**として扱います。

| 種類 | 拡張子 | 内容 |
|---|---|---|
| サービス | `.service` | デーモンなどのプログラム |
| ターゲット | `.target` | ユニットのまとまり(起動の目標) |
| マウント | `.mount` | ファイルシステムのマウント |
| タイマー | `.timer` | 決まった時刻に動かす |
| ソケット | `.socket` | 接続が来たときに起動する |

主なターゲットと、昔のランレベルとの対応です。

| ターゲット | ランレベル | 状態 |
|---|---|---|
| `poweroff.target` | 0 | 停止 |
| `rescue.target` | 1 | シングルユーザーモード(保守用。root だけ) |
| `multi-user.target` | 3 | 複数のユーザー、CUI、ネットワークあり |
| `graphical.target` | 5 | multi-user に GUI を加えたもの |
| `reboot.target` | 6 | 再起動 |
| `emergency.target` | ― | 最小の緊急用(ルートは読み取りだけ) |

### 3. systemctl

| コマンド | 動き |
|---|---|
| `systemctl start sshd` | 今すぐ起動する |
| `systemctl stop sshd` | 今すぐ止める |
| `systemctl restart sshd` | 止めて起動する |
| `systemctl reload sshd` | 止めずに設定を読み込み直す(対応するサービスだけ) |
| `systemctl status sshd` | 状態と最近のログ |
| `systemctl enable sshd` | 起動のときに自動で起動するようにする(今は起動しない) |
| `systemctl enable --now sshd` | 自動の起動を有効にし、今も起動する |
| `systemctl disable sshd` | 自動の起動をやめる |
| `systemctl is-active sshd` / `is-enabled sshd` | 動いているか / 自動で起動するか |
| `systemctl list-units --type=service` | 読み込まれているサービスの一覧 |
| `systemctl list-unit-files` | ユニットのファイルと enable の状態 |
| `systemctl get-default` | 既定のターゲット |
| `systemctl set-default multi-user.target` | 既定のターゲットを変える |
| `systemctl isolate rescue.target` | 今すぐそのターゲットに切り替える |
| `systemctl daemon-reload` | ユニットのファイルを書き換えた後に読み込み直す |

- `start` と `enable` は別のものです。`enable` だけでは今は起動せず、`start` だけでは再起動の後に起動しません。
- ユニットのファイルは `/usr/lib/systemd/system/`(パッケージが置く)と `/etc/systemd/system/`(管理者が置く。こちらが優先)にあります。

### 4. シングルユーザーモードで起動する

root のパスワードを忘れたときや、ファイルシステムを直すときに使います。GRUB の画面で `e` を押して起動の設定を開き、`linux` で始まる行の最後に `systemd.unit=rescue.target`(または `single`、`1`)を付けて起動します。

## 1.01.4 プロセスの生成、監視、終了 (重要度3)

### 1. ジョブの制御

シェルから起動したプログラムを**ジョブ**と呼びます。

| 操作 | 動き |
|---|---|
| `command &` | バックグラウンドで実行する |
| `Ctrl+Z` | 前面(フォアグラウンド)のジョブを一時停止する |
| `jobs` | ジョブの一覧(`[1]` などのジョブ番号) |
| `bg %1` | 止まったジョブ 1 をバックグラウンドで再開する |
| `fg %1` | ジョブ 1 をフォアグラウンドに戻す |
| `Ctrl+C` | 前面のジョブに SIGINT を送って終わらせる |

ジョブの状態の移り変わりを図にします。

```text
command &     ---> [background]
command       ---> [foreground]

[foreground] --- Ctrl+Z ---> [stopped]
[stopped]    --- bg %1  ---> [background]
[background] --- fg %1  ---> [foreground]
[stopped]    --- fg %1  ---> [foreground]
[foreground] --- Ctrl+C ---> 終了
```


### 2. ログアウトしても動かし続ける

ログアウトすると、シェルから起動したジョブには SIGHUP が送られ、普通は終わります。

| 方法 | 内容 |
|---|---|
| `nohup command &` | SIGHUP を無視して動かし続ける。出力は `nohup.out` に書かれる |
| `screen`、`tmux` | 端末を仮想的に作り、切り離し(デタッチ)と再接続(アタッチ)ができる |

| 操作 | screen | tmux |
|---|---|---|
| 新しく始める | `screen` | `tmux` |
| 切り離す | `Ctrl+A` の後に `d` | `Ctrl+B` の後に `d` |
| 一覧 | `screen -ls` | `tmux ls` |
| 再接続 | `screen -r` | `tmux attach` |

### 3. プロセスを見る

| コマンド | 内容 |
|---|---|
| `ps aux` | すべてのプロセス(BSD の書き方)。USER、PID、%CPU、%MEM、STAT、COMMAND |
| `ps -ef` | すべてのプロセス(UNIX の書き方)。PPID(親の PID)も出る |
| `pstree` | 親子の関係を木の形で表示する(`-p` で PID も) |
| `top` | 使用量を一定の間隔で表示し続ける。`P` で CPU、`M` でメモリの順、`k` で kill、`q` で終了 |
| `uptime` | 起動してからの時間、ログインしているユーザーの数、ロードアベレージ(1、5、15 分の平均) |
| `pgrep sshd` | 名前に合うプロセスの PID を表示する(`-l` で名前も) |

**ロードアベレージ**は、実行を待っているプロセスの数の平均です。CPU のコアの数より大きい状態が続くなら、処理が追いついていません。

### 4. シグナルを送る

| シグナル | 番号 | 意味 |
|---|---|---|
| SIGHUP | 1 | 端末が切れた。デーモンでは設定の読み込み直しに使うことが多い |
| SIGINT | 2 | 割り込み(`Ctrl+C`) |
| SIGKILL | 9 | 強制終了。プロセスは無視できない |
| SIGTERM | 15 | 終了の要求。`kill` の既定。プロセスは後片付けをして終われる |
| SIGCONT | 18 | 止まったプロセスを再開する |
| SIGSTOP | 19 | 一時停止。無視できない |
| SIGTSTP | 20 | 端末からの一時停止(`Ctrl+Z`) |

```bash
kill 1234              # PID 1234 に SIGTERM
kill -9 1234           # SIGKILL(kill -KILL 1234、kill -s KILL 1234 も同じ)
kill -l                # シグナルの一覧
pkill nginx            # 名前に合うプロセスにシグナルを送る(-u でユーザーで絞る)
killall nginx          # 名前が完全に一致するプロセスすべてに送る
```

まず SIGTERM で終わらせ、終わらないときだけ SIGKILL を使います。SIGKILL では後片付けができず、データが壊れることがあります。

## 1.01.5 デスクトップ環境の利用 (重要度1)

### 1. X Window System の仕組み

X Window System(X11)は、Linux の GUI の基本の仕組みです。

| 部品 | 役割 |
|---|---|
| **X サーバー** | 画面、キーボード、マウスを持ち、描画する。利用者の手元で動く |
| **X クライアント** | 画面に表示したいアプリ(端末、ブラウザなど)。別のコンピューターで動いてもよい |
| **ウィンドウマネージャー** | ウィンドウの枠、移動、大きさの変更を受け持つ |
| **ディスプレイマネージャー** | GUI のログインの画面(GDM、LightDM、SDDM など) |
| **統合デスクトップ環境** | ウィンドウマネージャー、パネル、ファイル管理などをまとめたもの(GNOME、KDE Plasma、Xfce) |
| **ターミナルプログラム** | GUI の中で CUI を使うためのアプリ(GNOME Terminal、xterm、Konsole) |

「サーバー」と「クライアント」が、普通の感覚と逆になっている点に注意します。画面を持つ手元の側が X サーバーです。

X クライアントが、画面を持つ X サーバーに表示を頼む様子を図にします。

```text
[X client]  -------- DISPLAY=host1:0 -------->  [X server]
  xterm, browser                                   display, keyboard, mouse
  別のコンピューターで動いてもよい
```

DISPLAY は、表示先の X サーバーを指します。


### 2. 表示先とアクセスの制御

- 環境変数 **DISPLAY** で、X クライアントの表示先の X サーバーを指定します。`DISPLAY=:0` は手元の 1 番目の画面、`DISPLAY=host1:0` は host1 の画面です。
- **xauth** は、X サーバーに接続してよいかを確かめるための鍵(MIT-MAGIC-COOKIE)を管理するコマンドです。鍵は `~/.Xauthority` に保存されます。
- `ssh -X server1` で接続すると、server1 で起動した X クライアントの画面を手元に表示できます(X11 の転送)。DISPLAY と xauth の設定は ssh が自動で行います。
- CUI でログインした後に GUI を始めるには `startx` を使います。

最近のディストリビューションでは、X の代わりに **Wayland** が既定になっていることがあります。
