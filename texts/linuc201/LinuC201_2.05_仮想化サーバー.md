# LinuC 201 テキスト 2.05 仮想化サーバー

1 台の物理サーバーの上で、複数の仮想マシンを動かす仕組みを学びます。Linux 標準の仮想化の KVM と、仮想マシンを作る、動かす、止める道具(virt-install、virsh、virt-manager)が中心です。

## 2.05.1 仮想マシンの仕組みと KVM (重要度3)

### 1. 仮想化とハイパーバイザー

**仮想マシン**(VM)は、ソフトウェアで作った仮想のコンピューターです。VM を作って動かすソフトウェアを**ハイパーバイザー**と呼びます。VM の中で動く OS を**ゲスト OS**、VM を動かす側のコンピューターを**ホスト**と呼びます。

ハイパーバイザーは、VM に次の 4 つを仮想の部品として見せます。

| 仮想にするもの | 内容 |
|---|---|
| CPU | 物理 CPU の時間を VM に割り当てる。仮想 CPU(vCPU)の数を決める |
| メモリ | 物理メモリの一部を VM に割り当てる |
| ストレージ | ディスクのイメージのファイルや LVM の論理ボリュームを、VM のディスクに見せる |
| ネットワーク | 仮想のネットワークカードと、ブリッジや NAT などの仮想のネットワークでつなぐ |

ハイパーバイザーは、動く場所で 2 つに分けます。

| 種類 | 動く場所 | 例 |
|---|---|---|
| ホスト型 | ふつうの OS の上のアプリとして動く | VirtualBox、VMware Workstation |
| ハイパーバイザー型 | ハードウェアの上で直接動く(OS の役割も兼ねる) | Xen、VMware ESXi、Hyper-V、KVM |

KVM は Linux のカーネルの機能なので、Linux 自体がハイパーバイザーになります。このため、ハイパーバイザー型として扱われることが多いです。ホスト型のほうが手軽で、ハイパーバイザー型のほうが性能が出やすいです。

```text
Host type (VirtualBox)
  [VM A]  [VM B]
  [Hypervisor]
  [Host OS]
  [Hardware]

Hypervisor type (Xen, ESXi)
  [VM A]  [VM B]
  [Hypervisor]
  [Hardware]

KVM
  [VM A]  [VM B]            <- VM ごとに QEMU のプロセスが動く
  [Linux kernel + kvm module]
  [Hardware]
```

**Xen** は、ハイパーバイザー型の 1 つです。最初に起動する管理用の VM(dom0)から、ほかの VM(domU)を管理します。

### 2. KVM と QEMU

**KVM**(Kernel-based Virtual Machine)は、Linux のカーネルに組み込まれる仮想化の機能です。CPU の仮想化支援機能を使い、VM の命令をほぼ物理 CPU の速さで実行します。

**QEMU** は、仮想のハードウェア(ディスク、ネットワークカード、画面など)を作るソフトウェアです。KVM が CPU を速く動かし、QEMU が周りの部品を用意します。ふつうは、VM 1 台につき QEMU のプロセスが 1 つ動きます。

- **ハードウェア支援仮想化**は、CPU に備わった仮想化のための機能です。Intel の CPU では **VT-x**(CPU のフラグは `vmx`)、AMD の CPU では **AMD-V**(フラグは `svm`)です。
- BIOS や UEFI で、この機能が無効になっていることがあります。その場合は有効にします。

| カーネルモジュール | 役割 |
|---|---|
| `kvm` | KVM の本体 |
| `kvm_intel` | Intel の CPU 用(`kvm-intel` と書くこともある) |
| `kvm_amd` | AMD の CPU 用(`kvm-amd` と書くこともある) |

### 3. KVM が使えるかを調べる

```bash
grep -E -c '(vmx|svm)' /proc/cpuinfo     # 1 以上なら CPU が対応している(数は論理 CPU の数)
lscpu | grep -i virtualization           # VT-x や AMD-V と表示される
lsmod | grep kvm                         # kvm と kvm_intel(または kvm_amd)が読み込まれている
ls -l /dev/kvm                           # KVM の入り口のデバイスファイルがある
```

- `/proc/cpuinfo` は CPU の情報を持つ仮想のファイルで、`flags` の行に `vmx` や `svm` が並びます。
- `lscpu` は、CPU の情報を見やすく表示するコマンドです。
- モジュールが読み込まれていないときは、`sudo modprobe kvm_intel`(AMD は `kvm_amd`)で読み込みます。
- Debian 系の Ubuntu では、`kvm-ok`(`cpu-checker` パッケージ)でも調べられます。libvirt の `virt-host-validate` も使えます。

### 4. KVM の道具を入れる

| 部品 | 役割 |
|---|---|
| `qemu-kvm`(Debian 系は `qemu-system-x86`) | QEMU(KVM を使う版) |
| `libvirtd` | VM を管理するサービス。`virsh` などの道具から呼ばれる |
| `virt-install` | コマンドで VM を作る |
| `virt-manager` | 画面(GUI)で VM を作る、管理する |
| `bridge-utils` | ネットワークのブリッジを作る道具(`brctl` コマンド) |

```bash
# Ubuntu 24.04 / Debian 12
sudo apt install qemu-system-x86 libvirt-daemon-system libvirt-clients bridge-utils virtinst virt-manager
sudo systemctl enable --now libvirtd     # 自動で起動し、いま起動する

# AlmaLinux / RHEL 9
sudo dnf install qemu-kvm libvirt virt-install virt-manager
sudo systemctl enable --now virtqemud.socket     # VM を管理するデーモン(virtqemud)を、つながれたら起動するようにする
```

- Debian 系では、`virt-install` は `virtinst` パッケージに入っています。
- Ubuntu 24.04 の `qemu-kvm` は、`qemu-system-x86` が提供する仮想のパッケージです。`apt install qemu-kvm` と書いても、`qemu-system-x86` が入ります。
- RHEL 9 を新しく入れたホストの libvirt は、機能ごとに分かれたデーモン(VM は `virtqemud`、仮想のネットワークは `virtnetworkd` など)が既定です。1 つにまとまった `libvirtd` は非推奨で、RHEL 8 から上げたホストでは引き続き使われます。機能ごとのデーモンを有効にする手順の全体は、Red Hat の文書「libvirt デーモンの最適化」にあります。
- RHEL 9 では、virt-manager は非推奨です(後継は Web 画面の Cockpit)。【要確認】
- root 以外のユーザーが `virsh` で VM を管理するには、`libvirt` グループに入れます。

### 5. 仮想のネットワークとブリッジ

libvirt を入れると、**default** という仮想のネットワークが用意されます。VM は、ホストの中の仮想のスイッチ(`virbr0`)につながり、NAT でホストの外へ出ます。ホストの外から VM へは、そのままでは届きません。

外から VM に直接つなぎたいときは、ホストの NIC に**ブリッジ**(仮想の L2 スイッチ)を作り、VM をそれにつなぎます。VM は、ホストと同じネットワークのアドレスを持てます。

```text
default(NAT)
  [VM] --- virbr0 (192.168.122.1) --NAT--> [eth0] --> 外のネットワーク

ブリッジ
  [VM] --- br0 --- [eth0] --> 外のネットワーク。VM がホストと同じネットワークに入る
```

`bridge-utils` の `brctl` コマンドで、ブリッジを操作します。

```bash
brctl show                 # ブリッジの一覧と、つながっているデバイス
sudo brctl addbr br0       # ブリッジ br0 を作る
sudo brctl addif br0 eth0  # br0 に eth0 をつなぐ
```

- `brctl` は古い道具で、新しい環境では `ip link` や NetworkManager の設定(`nmcli`)でブリッジを作ります。
- ブリッジの設定は、ホストの再起動後も残るよう、ネットワークの設定ファイルに書きます。

### 6. 保存の場所

| 場所 | 内容 |
|---|---|
| `/var/lib/libvirt/images/` | VM のディスクイメージの既定の置き場所 |
| `/etc/libvirt/qemu/` | VM の定義(XML のファイル) |

ディスクイメージの形式は、`qcow2`(必要な分だけ大きくなる、スナップショットが使える)と `raw`(そのままの形、単純で速い)がよく使われます。`qemu-img create -f qcow2 disk.qcow2 20G` で作ります。

## 2.05.2 仮想マシンの作成と管理 (重要度3)

### 1. 仮想化の方式

| 方式 | 内容 |
|---|---|
| **完全仮想化** | ゲスト OS を変更せずに動かす。ハードウェアを全部まねるので、ディスクやネットワークの速度は落ちやすい |
| **準仮想化** | ゲスト OS が、仮想環境だと分かった上で、ハイパーバイザーと直接やり取りする。速い |

KVM では、**virtio** という準仮想化のドライバーを使います。ディスク(virtio-blk)やネットワークカード(virtio-net)を、まねたものではなく、仮想環境専用の軽い部品として見せます。

- Linux のゲストは、virtio のドライバーを最初から持っています。
- Windows のゲストには、virtio のドライバー(virtio-win)を別に入れます。
- 古い形のディスクやネットワークカード(IDE、e1000 など)は、どのゲストでも動きますが、virtio より遅いです。

```text
Full virtualization
  [guest NIC driver] --> [QEMU emulates a NIC] --> [host network]

virtio (paravirtualization)
  [guest virtio-net driver] --> [host side endpoint] --> [host network]   <- まねる手間が少なく、速い
```

### 2. virt-install で作る

```bash
sudo virt-install \
  --name vm1 \
  --memory 2048 \
  --vcpus 2 \
  --disk size=20 \
  --os-variant ubuntu24.04 \
  --cdrom /var/lib/libvirt/images/ubuntu-24.04.iso \
  --network network=default
```

| オプション | 意味 |
|---|---|
| `--name` | VM の名前 |
| `--memory` | メモリの量(MiB) |
| `--vcpus` | 仮想 CPU の数 |
| `--disk size=20` | 新しいディスクを作る(GiB)。`--disk path=…` で既存のファイルも指定できる |
| `--cdrom` / `--location` | インストール用の ISO。`--location` は URL やディレクトリを指定でき、`--extra-args` でカーネルの引数を渡せる |
| `--os-variant` | ゲスト OS の種類。性能の良い設定が選ばれる。`--osinfo` は `--os-variant` の新しい名前(どちらも使える)。`virt-install --osinfo list` で一覧が見られる(古い版では `osinfo-query os`) |
| `--network` | つなぐネットワーク。`network=default`(NAT)や `bridge=br0` |
| `--import` | インストールをせず、既存のディスクイメージから作る |
| `--graphics none --console pty,target_type=serial` | 画面なしで、シリアルコンソールで操作する |

- 画面のあるサーバーなら、`virt-manager` で「新しい仮想マシン」から、同じ内容を選べます。`virt-manager` は、自分のウィンドウの中に VM の画面を表示します。画面だけを開きたいときは、別の道具の `virt-viewer` を使います。
- ふつうは、作った VM はそのまま起動し、インストールが始まります。

### 3. virsh で管理する

**virsh** は、libvirt の操作用のコマンドです。VM は「ドメイン」と呼ばれます。

| コマンド | 動き |
|---|---|
| `virsh list` | 動いている VM の一覧。`--all` で止まっているものも表示 |
| `virsh start vm1` | 起動する |
| `virsh shutdown vm1` | ゲスト OS に終了を頼み、順番に止める |
| `virsh reboot vm1` | ゲスト OS に再起動を頼む |
| `virsh destroy vm1` | 電源を強制的に切る(VM の定義やディスクは消えない) |
| `virsh suspend vm1` / `virsh resume vm1` | 一時停止 / 再開(メモリは残る) |
| `virsh autostart vm1` | ホストの起動に合わせて、VM も起動する |
| `virsh console vm1` | シリアルコンソールにつなぐ(抜けるのは `Ctrl+]`) |
| `virsh dominfo vm1` | VM の情報(メモリ、vCPU、状態) |
| `virsh edit vm1` | 定義の XML を編集する |
| `virsh dumpxml vm1` | 定義の XML を表示する |
| `virsh undefine vm1` | VM の定義を消す(ディスクは、`--remove-all-storage` を付けたときだけ消える) |
| `virsh net-list` | 仮想のネットワークの一覧 |

- `virsh destroy` は、名前に反して VM を消しません。電源ボタンを長押しして切るのと同じです。
- `virsh shutdown` は、ゲスト OS が応答しないと止まりません。そのときに `destroy` を使います。
- root 以外で使うときは、`virsh -c qemu:///system list --all` のように、接続先を指定します。指定しないと、そのユーザー専用の VM(`qemu:///session`)を見ることがあります。

VM の状態の移り変わりを図にします。

```text
(defined)
  |  virsh start
  v
running ---- virsh suspend ----> paused
  |  <------- virsh resume -----
  |
  +-- virsh shutdown --> shut off     <- ゲスト OS に頼んで、順番に止める
  +-- virsh destroy ---> shut off     <- 電源を強制的に切る
```

### 4. 性能を見る

```bash
virsh dominfo vm1          # メモリ、vCPU の数と状態
virsh domstats vm1         # CPU の時間、メモリ、ディスク、ネットワークの数値
virsh domblklist vm1       # つながっているディスク
virsh domiflist vm1        # つながっているネットワークカード
virt-top                   # top のように、VM ごとの CPU とメモリを見る
```

- ホストから見ると、VM は QEMU のプロセスです。`top` や `ps` でも、VM ごとの CPU の使用量が分かります。
- `virsh setmem` や `virsh setvcpus` で、動かしたまま(上限の範囲内で)メモリや vCPU を変えられます。
