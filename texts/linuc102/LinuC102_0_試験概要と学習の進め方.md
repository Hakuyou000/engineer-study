# LinuC 102 0 試験概要と学習の進め方

作成: 2026-11-19
対象: LinuC レベル1 102 試験(Version 10.0)

LinuC は、LPI-Japan が実施する Linux 技術者の資格です。レベル1は、101 試験と 102 試験の両方に合格すると認定されます。102 試験は、シェルとスクリプト、ネットワーク、ユーザーと時刻とログの管理、セキュリティ、オープンソースの文化を扱います。

## 1. 試験の概要

| 項目 | 内容 |
|---|---|
| 試験 | LinuC レベル1 102 試験(Version 10.0。2020-04 から) |
| 試験時間 | 90 分 |
| 問題の数 | 60 問前後 |
| 形式 | 選択式(1 つを選ぶ、複数を選ぶ)と、コマンド名などを入力する問題 |
| 受験料 | 16,500 円(税込、1 試験あたり)。レベル1 の認定には 2 試験で 33,000 円 |
| 会場 | ピアソン VUE のテストセンター、またはオンライン |
| 認定の条件 | 101 試験と 102 試験の両方に合格する(順番は問わない) |
| 再受験 | 不合格のとき、受験日の翌日から数えて 7 日目以降 |

> **【要確認】** 合格点は公式には公開されていません(65〜75% 程度とする情報が多いです)。受験料と受験の規則は変わることがあります。申し込む前に、LinuC 公式のページで確認してください。

## 2. 出題の分野と重要度

| 主題 | 重要度の合計 |
|---|---|
| 1.06 シェルおよびスクリプト | 10 |
| 1.07 ネットワークの基礎 | 14 |
| 1.08 システム管理 | 12 |
| 1.09 重要なシステムサービス | 9 |
| 1.10 セキュリティ | 12 |
| 1.11 オープンソースの文化 | 3 |

重要度は、小項目ごとに 1〜10 で示された値の合計です。重要度が大きいほど、多く出題されます。

## 3. 前提の知識

- Linux にログインし、`ls`、`cd`、`cat`、`less`、`vi` などで、ファイルを見たり編集したりできること(101 試験の範囲)
- ファイルとディレクトリ、パーミッション、パッケージの入れ方の基本

まだ自信がなければ、101 試験の範囲から始めましょう。

## 4. 学習の進め方

1. **演習環境を作る**(次の章)。コマンドは、読むだけでなく打って確かめます。
2. **テキストを主題の順に読む**。表の中のコマンドと設定ファイルは、実際に開いて中身を見ます。
3. **問題を解く**。間違えた問題は、テキストの該当の節に戻ります。入力で解くモードで、コマンド名を思い出す練習もします。
4. **計算ドリル**でパーミッション、cron、サブネットを毎日少しずつ解きます。
5. 最後に模擬試験で、60 問を 90 分で解く速さに慣れます。

## 5. 演習環境の作り方

### 1. 何を用意するか

Red Hat 系と Debian 系の両方を触れるようにします。試験には、どちらかにしかない設定ファイルやコマンドが出ます。

| 用途 | おすすめ | 理由 |
|---|---|---|
| Red Hat 系 | AlmaLinux 9 | RHEL と互換。`/etc/sysconfig/`、`dnf`、`firewalld` を試せる |
| Debian 系 | Ubuntu 24.04 LTS | `/etc/network/interfaces` の流れ、`apt` を試せる |

### 2. Windows: WSL で手早く始める

WSL(Windows Subsystem for Linux)を使うと、数分で Linux が使えます。PowerShell を管理者として開き、次を実行します。

```bash
wsl --install --no-distribution     # WSL を有効にする(初回だけ。終わったら再起動)
wsl --list --online                 # 入れられる配布版の一覧
wsl --install Ubuntu-24.04
wsl --install AlmaLinux-9
wsl -d AlmaLinux-9                  # AlmaLinux を起動する
```

WSL では、ネットワークの設定(nmcli、ifup)と時刻の同期の設定は、Windows 側が管理しているので試せません。1.07 と 1.09 の一部は、次の仮想マシンで試します。

### 3. 仮想マシンで本物に近い環境を作る

ネットワークの設定まで試すなら、仮想マシンを使います。

| 道具 | 対象 | メモ |
|---|---|---|
| VirtualBox | Windows、Intel の Mac | 無料。AlmaLinux と Ubuntu の ISO から入れる |
| Hyper-V | Windows の Pro 以上 | Windows に付属 |
| UTM | Apple シリコンの Mac | 無料。ARM 版の ISO を使う |
| Multipass | Windows、Mac、Linux | Ubuntu を `multipass launch 24.04` の 1 行で作れる |

仮想マシンには、メモリを 2 GB、ディスクを 20 GB ほど割り当てれば十分です。

### 4. 最初から入っていないコマンドを入れる

最近の配布版では、古いコマンドや一部の道具が最初から入っていません。試験には出るので、入れて試します。

| コマンド | AlmaLinux 9 | Ubuntu 24.04 |
|---|---|---|
| `ifconfig`、`netstat`、`route` | `sudo dnf install net-tools` | `sudo apt install net-tools` |
| `traceroute` | `sudo dnf install traceroute` | `sudo apt install traceroute` |
| `dig`、`host` | `sudo dnf install bind-utils` | `sudo apt install dnsutils` |
| `nc` | `sudo dnf install nmap-ncat` | `sudo apt install netcat-openbsd` |
| `nmap` | `sudo dnf install nmap` | `sudo apt install nmap` |
| `at` | `sudo dnf install at` | `sudo apt install at` |
| `mail`、MTA | `sudo dnf install s-nail postfix` | `sudo apt install mailutils postfix` |

- **ifup / ifdown**: AlmaLinux 9 では、古い network-scripts が外され、NetworkManager の仕組みで動きます。Ubuntu では `ifupdown` を入れると使えますが、普段は netplan と NetworkManager で設定します。試験では、両方の考え方を問われます。
- **ntpd / ntpdate**: AlmaLinux 9 と Ubuntu 24.04 では、時刻の同期には chrony(または systemd-timesyncd)を使います。ntpd は入っていません。ntpd と ntpdate は、試験の範囲として設定ファイルとコマンドの役割を覚えます。

### 5. 壊してもよいようにする(スナップショット)

**スナップショット**は、仮想マシンのある時点のディスク(と、取り方によってはメモリ)の状態を保存したものです。設定を壊しても、取った時点にすぐ戻せます。次の時点で取っておくと便利です。

- OS を入れ終わり、足りないコマンドを入れた直後(まっさらな状態)
- ネットワークやディスクの設定を変える練習の前

戻すと、その時点より後の変更はすべて消えます。残したいファイルは、戻す前に外へコピーしておきます。

#### VirtualBox

画面では、左の一覧で仮想マシンを選び、その名前の横のメニュー(≡)から「スナップショット」(Snapshots)を開いて「作成」を押します。戻すときは、一覧でスナップショットを選んで「復元」を押します。コマンドでも同じことができます(Windows では `C:\Program Files\Oracle\VirtualBox` にある `VBoxManage.exe`)。

```bash
VBoxManage snapshot "alma9" take "clean" --description "OS を入れた直後"
VBoxManage snapshot "alma9" list
VBoxManage controlvm "alma9" poweroff     # 戻す前に止める
VBoxManage snapshot "alma9" restore "clean"
VBoxManage snapshot "alma9" delete "clean" # 要らなくなったら消す
```

動いている仮想マシンでも取れますが、戻すときは仮想マシンを止めておきます。

#### Hyper-V

Hyper-V では、スナップショットを**チェックポイント**と呼びます。Hyper-V マネージャーで仮想マシンを右クリックし、「チェックポイント」を選びます。戻すときは、チェックポイントを右クリックして「適用」を選びます。PowerShell(管理者)では次のとおりです。

```powershell
Checkpoint-VM -Name alma9 -SnapshotName clean
Get-VMSnapshot -VMName alma9
Restore-VMSnapshot -VMName alma9 -Name clean -Confirm:$false
Remove-VMSnapshot -VMName alma9 -Name clean
```

既定の「運用チェックポイント」は、ゲストの OS に頼んでディスクを整った状態にしてから取ります(メモリは保存しない)。

#### Multipass

止めてから取ります。

```bash
multipass stop alma9
multipass snapshot alma9 --name clean
multipass list --snapshots
multipass restore alma9.clean
```

#### UTM(Mac)

UTM は 5.0 からスナップショットに対応しました。それより古い版では、仮想マシンを止めて「複製」(Clone)を作り、それを控えにします。

> **【要確認】** UTM のスナップショットの画面の場所は、版によって違うことがあります。

#### WSL

WSL にはスナップショットがないので、配布版を丸ごとファイルに書き出して控えにします。

```powershell
wsl --shutdown
wsl --export AlmaLinux-9 C:\WSL\backup\alma-clean.tar          # 書き出す
wsl --unregister AlmaLinux-9                                    # 消す(中のファイルもすべて消える)
wsl --import AlmaLinux-9 C:\WSL\AlmaLinux-9 C:\WSL\backup\alma-clean.tar   # 控えから戻す
```

`wsl --import` で戻すと、ログインするユーザーが root になります。元のユーザーでログインするには、配布版の中の `/etc/wsl.conf` に次を書き、`wsl --terminate AlmaLinux-9` で一度止めます。

```ini
[user]
default=sato
```

練習が終わった配布版は `wsl --unregister AlmaLinux-9` で消せます。

## 6. 情報源

- https://linuc.org/linuc1/range/102.html (公式の出題範囲)
- https://almalinux.org/blog/2025-04-23-almalinux-os-available-via-wsl-cli/ (AlmaLinux を WSL の CLI で入れる)
