# LinuC 3PS テキスト 1.0 仮想化基盤の構築

KVM と QEMU を使った仮想化の仕組み、仮想ディスクの扱い、セキュリティの設定、仮想マシンの管理と移行、Proxmox VE による統合管理を学びます。コマンドは AlmaLinux 9(RHEL 9 系)と Ubuntu 24.04 で試せるものを中心に書きます。版で変わるところは【要確認】を付けています。

## 1.1 仮想化技術の動作原理と最適化 (重要度3)

### 1. KVM と QEMU の役割

- **仮想マシン(VM)**は、ソフトウェアで作った仮想のコンピューターです。VM の中で動く OS を**ゲスト**、VM を動かす側の Linux を**ホスト**と呼びます。
- **KVM**(Kernel-based Virtual Machine)は、Linux のカーネルの機能です。CPU の仮想化支援機能(Intel VT-x、AMD-V)を使って、ゲストの命令をほぼ直接 CPU で動かします。`kvm.ko` と、CPU に合わせた `kvm_intel.ko` または `kvm_amd.ko` が働き、`/dev/kvm` が現れます。
- **QEMU**は、VM の部品(CPU、メモリ、ディスク、ネットワークカード)を作って見せるプログラムです。KVM が使えると、QEMU は CPU の処理を KVM に任せて速く動きます。KVM を使わない QEMU は、CPU の命令を 1 つずつソフトウェアで再現するので遅くなります。
- **libvirt** は、QEMU/KVM を共通の方法で管理する仕組みです。`virsh` コマンドで VM を操作します。

```text
virsh / virt-manager / Proxmox VE      操作する道具
    |
    v
libvirt (libvirtd)                     VM の定義と管理 (Proxmox VE は libvirt を使わず QEMU を直接起動)
    |
    v
QEMU (qemu-system-x86_64)              VM の部品を作る。1 つの VM が 1 つのプロセス
    |
    v
KVM (/dev/kvm)                         カーネルの中。CPU の仮想化支援機能を使う
    |
    v
物理の CPU、メモリ、ディスク、ネットワーク
```

使えるかどうかは、次のコマンドで確かめます。

```bash
grep -E -c 'vmx|svm' /proc/cpuinfo     # 1 以上なら CPU が仮想化支援機能を持つ
lsmod | grep kvm                       # kvm と kvm_intel (または kvm_amd) が読み込まれている
ls -l /dev/kvm
virt-host-validate qemu                # libvirt の検査の道具。IOMMU の状態も出る
```

### 2. CPU のスケジューリング

**スケジューラー**は、どのプロセスにどの CPU をどれだけ使わせるかを決める、カーネルの仕組みです。VM の 1 つの仮想 CPU は、ホストから見ると QEMU のスレッドです。そのため、VM の動きを良くするには、ホストのスケジューリングを知る必要があります。

| クラス | 方針(ポリシー) | 内容 |
|---|---|---|
| Fair | `SCHED_OTHER`(`SCHED_NORMAL` とも呼ぶ) | 既定。ほかのプロセスと公平に分け合う。優先度は nice 値で調整する |
| Fair | `SCHED_BATCH` | 対話しない重い処理向け。ほかのプロセスの邪魔をしにくい |
| Fair | `SCHED_IDLE` | nice +19 よりも低い、最も低い優先度。ほかのプロセスがいると、ほとんど CPU を使えない |
| RT(リアルタイム) | `SCHED_FIFO` | 優先度 1〜99。自分から譲るか、より高い優先度が来るまで動き続ける |
| RT(リアルタイム) | `SCHED_RR` | 優先度 1〜99。同じ優先度のものとは、時間を区切って交代する |
| DEADLINE | `SCHED_DEADLINE` | 「周期のうちに、これだけ実行する」と宣言する。EDF(締め切りが近いものを先に動かす)で動く |

- クラスの強さは DEADLINE、RT、Fair の順です。RT のプロセスが動けるときは、Fair のプロセスは動けません。
- Fair クラスの実装は、カーネル 6.5 までは **CFS**(Completely Fair Scheduler)、6.6 以降は **EEVDF** です。RHEL 9 系のカーネル(5.14 系)は CFS、Ubuntu 24.04 のカーネル(6.8 系)は EEVDF です。
- RT のプロセスが動き続けると、ほかのプロセスが止まります。それを防ぐため、既定では 1 秒(`sched_rt_period_us`)のうち 0.95 秒(`sched_rt_runtime_us`)までしか RT に使わせません。

`chrt` で、方針と優先度を調べたり変えたりします。

```bash
chrt -p 1234                       # PID 1234 の今の方針と優先度
chrt -m                            # 各方針の優先度の範囲
sudo chrt -f -p 50 1234            # 動いているプロセスを SCHED_FIFO、優先度 50 にする
sudo chrt -r 10 ./job              # SCHED_RR、優先度 10 でコマンドを起動する
chrt -b 0 ./batch-job              # SCHED_BATCH で起動する(優先度は 0 のみ)
chrt -i 0 ./low-job                # SCHED_IDLE で起動する
sudo chrt -d --sched-runtime 5000000 --sched-deadline 10000000 --sched-period 16666666 0 ./task
```

- `-f` が FIFO、`-r` が RR、`-b` が BATCH、`-i` が IDLE、`-d` が DEADLINE、`-o` が OTHER です。`-p` を付けると、実行中のプロセス(PID)が対象になります。
- DEADLINE の時間はナノ秒です。`runtime`(使う時間)≦ `deadline`(締め切り)≦ `period`(周期)にします。優先度は 0 を指定します。
- RT や DEADLINE にするには root(または `CAP_SYS_NICE`)が必要です。
- libvirt では、`<cputune>` の `<vcpupin>`(仮想 CPU を物理 CPU に固定する)と `<vcpusched>`(`scheduler='fifo'` と `priority`)で、VM のスレッドに設定します。

### 3. I/O スケジューラー

**I/O スケジューラー**は、ディスクへの読み書きの要求を並べ替えて、まとめて出すカーネルの仕組みです。ブロックデバイスごとに選びます。

| 名前 | 特徴 | 向く場面 |
|---|---|---|
| `none` | 並べ替えない。要求をそのまま出す | NVMe の SSD、速い SSD、ゲスト側(ホストが並べ替えるため) |
| `mq-deadline` | 要求に期限を付ける。読み込みを書き込みより先にする。単純で軽い | HDD、一般的なサーバー |
| `bfq` | プロセスごとに公平に分ける。応答の良さを重視する。処理は重い | デスクトップ、HDD で複数の利用者が使う場面 |
| `kyber` | 遅延の目標を決めて、要求の量を調整する。軽い | 速い SSD で、遅延を抑えたい場面 |

```bash
cat /sys/block/sda/queue/scheduler          # [mq-deadline] none bfq kyber のように、[ ] が今のもの
echo bfq | sudo tee /sys/block/sda/queue/scheduler     # すぐ変える(再起動で戻る)
```

再起動しても残すには、udev の規則を書きます。

```
# /etc/udev/rules.d/60-ioscheduler.rules
ACTION=="add|change", KERNEL=="sd[a-z]", ATTR{queue/scheduler}="mq-deadline"
```

- 既定の選ばれ方は、デバイスの種類と配布で違います【要確認】。必ず `cat` で今の値を見ます。
- `bfq` と `kyber` はモジュールで、読み込まれていないと一覧に出ないことがあります。

### 4. virtio

**virtio** は、VM のための準仮想化(ゲストが「自分は VM だ」と知っていて、ホストと直接やり取りする方式)のデバイスの規格です。本物のハードウェアを真似する(エミュレーション)より速く動きます。ゲストに virtio のドライバーが必要です。Linux のゲストには標準で入っています。

| デバイス | 役割 | libvirt の書き方 | ゲストでの名前 |
|---|---|---|---|
| virtio-net | ネットワーク | `<model type='virtio'/>` | `eth0`、`enp1s0` など |
| virtio-blk | ブロックデバイス(1 台のディスク) | `<target dev='vda' bus='virtio'/>` | `/dev/vda` |
| virtio-scsi | SCSI のコントローラー。1 つのコントローラーに多くのディスクを付けられ、SCSI のコマンドをそのまま通せる | `<controller type='scsi' model='virtio-scsi'/>` | `/dev/sda` |
| virtio-rng | ホストの乱数をゲストに渡す | `<rng model='virtio'>` | `/dev/hwrng` |
| virtio-balloon | ゲストのメモリを、ホストから増減する(1.2 で説明) | `<memballoon model='virtio'/>` | ― |

```xml
<disk type='file' device='disk'>
  <driver name='qemu' type='qcow2' cache='none' io='native'/>
  <source file='/var/lib/libvirt/images/web01.qcow2'/>
  <target dev='vda' bus='virtio'/>
</disk>
<interface type='bridge'>
  <source bridge='br0'/>
  <model type='virtio'/>
</interface>
```

- virtio-net は、さらにホストのカーネルで処理する `vhost-net` を使うと速くなります。
- 起動直後の VM は乱数が足りず、鍵の生成などが遅れることがあります。virtio-rng で改善します。

### 5. IOMMU とデバイスの割り当て(パススルー)

- **IOMMU**は、デバイスが行うメモリへの直接アクセス(DMA)に、アドレスの変換と制限をかける仕組みです。Intel では **VT-d**、AMD では **AMD-Vi** と呼びます。
- IOMMU を使うと、物理の PCI デバイス(GPU、NIC、NVMe など)を VM にそのまま渡せます。これを**パススルー**と呼びます。VM は、ほぼ本物の速さで使えます。代わりに、渡したデバイスはホストと、ほかの VM が使えなくなり、ライブマイグレーションも難しくなります。
- パススルーには **vfio-pci**(VFIO のドライバー)を使います。デバイスを元のドライバーから外し、vfio-pci につなぎ直します。

```text
BIOS / UEFI で VT-d / AMD-Vi を有効にする
    |
    v
カーネルのパラメーターで IOMMU を有効にする (intel_iommu=on など)
    |
    v
IOMMU グループを調べ、渡したいデバイスの ID を確かめる (lspci -nn)
    |
    v
デバイスを vfio-pci につなぐ (ids= の指定、initramfs の作り直し)
    |
    v
VM の XML に hostdev を書いて、VM を起動する
```

**手順の例**(Intel の CPU の場合)

1. UEFI の設定で VT-d を有効にします。
2. カーネルのパラメーターを足します。Intel は `intel_iommu=on`、AMD の CPU では、IOMMU は既定で有効です。AMD のためのパラメーターは不要です。`iommu=pt` を足すと、ホストが使うデバイスの性能が落ちにくくなります。

```bash
# AlmaLinux 9 (RHEL 9 系)
sudo grubby --update-kernel=ALL --args="intel_iommu=on iommu=pt"
# Ubuntu 24.04: /etc/default/grub の GRUB_CMDLINE_LINUX_DEFAULT に書く
sudo update-grub
sudo reboot
```

3. 有効になったか、IOMMU グループを確かめます。

```bash
sudo dmesg | grep -i -e DMAR -e IOMMU
find /sys/kernel/iommu_groups/ -type l | sort -V     # グループごとのデバイス
lspci -nn | grep -i nvidia                           # 例: 01:00.0 ... [10de:2684]
```

- 同じ **IOMMU グループ**のデバイスは、PCI のブリッジを除き、すべてホストのドライバーから外し、vfio-pci につなぐ必要があります(安全に分けられる最小の単位のため)。

4. 渡すデバイスを vfio-pci につなぎます。

```
# /etc/modprobe.d/vfio.conf
options vfio-pci ids=10de:2684,10de:22ba
```

```bash
sudo dracut -f                  # AlmaLinux: initramfs を作り直す
sudo update-initramfs -u        # Ubuntu
lspci -nnk -s 01:00.0           # Kernel driver in use: vfio-pci になっているか
```

5. VM の XML に、デバイスを書きます。

```xml
<hostdev mode='subsystem' type='pci' managed='yes'>
  <source>
    <address domain='0x0000' bus='0x01' slot='0x00' function='0x0'/>
  </source>
</hostdev>
```

- `managed='yes'` にすると、libvirt が VM の起動と停止に合わせて、デバイスのドライバーの付け替えをします。
- 手で付け替えるときは、`virsh nodedev-detach pci_0000_01_00_0` を使います。

### 6. QEMU と virsh の設定

| 設定 | 内容 |
|---|---|
| `<cpu mode='host-passthrough'/>` | ホストの CPU の機能をそのまま見せる。性能は最も良いが、違う CPU のホストへの移行が難しい |
| `<cpu mode='host-model'/>` | 近い CPU の型を選んで見せる。移行しやすい。libvirt の既定の選択肢 |
| `<vcpu>`、`<memory>` | 仮想 CPU の数、メモリの量 |
| `<cputune>` | 仮想 CPU の固定(`vcpupin`)、スケジューラー(`vcpusched`) |
| `<memoryBacking><hugepages/></memoryBacking>` | 大きなページ(Hugepages)を使い、メモリの管理の負担を減らす |
| `<driver cache='none' io='native'/>` | ディスクの書き方。`cache='none'` はホストのページキャッシュを使わない |

```bash
virsh edit web01                         # XML を直す(保存すると検査される)
virsh vcpupin web01 0 2                  # 仮想 CPU 0 を物理 CPU 2 に固定する
virsh vcpuinfo web01                     # 仮想 CPU がどの物理 CPU で動いているか
virsh emulatorpin web01 0-1              # QEMU 自身のスレッドを物理 CPU 0-1 に固定する
virsh schedinfo web01                    # CPU の割り当ての重み(shares)など
```

- `virsh vcpupin` に `--config` を付けると、次の起動から有効な設定として XML に書かれます。付けないと、動いている VM にだけ効きます。

## 1.2 仮想ディスクと QEMU の操作 (重要度2)

### 1. ディスクイメージの形式

| 形式 | 特徴 |
|---|---|
| **RAW** | 中身をそのまま入れた単純な形式。速い。ファイルシステムが対応していれば、使っていない部分は飛ばして保存される(スパースファイル) |
| **QCOW2** | QEMU の形式。必要な分だけ大きくなる。スナップショット、圧縮、暗号化、差分(バッキングファイル)が使える。RAW より少し遅い |

- 差分の機能は、元のイメージ(バッキングファイル、ベースディスク)を読み取り専用にして、変更だけを新しいイメージに書く仕組みです。多くの VM を、同じ元のイメージから作るときに使います。
- ゲストから見たディスクの大きさ(仮想サイズ)と、ホストでのファイルの大きさは違うことがあります。

### 2. qemu-img

**qemu-img** は、ディスクイメージを作る、調べる、変換する、大きさを変える道具です。

| 動き | コマンドの例 |
|---|---|
| 作る | `qemu-img create -f qcow2 disk.qcow2 20G` |
| 作る(RAW) | `qemu-img create -f raw disk.raw 20G` |
| 調べる | `qemu-img info disk.qcow2` |
| 変換する | `qemu-img convert -f raw -O qcow2 disk.raw disk.qcow2` |
| 圧縮して変換する | `qemu-img convert -c -O qcow2 disk.qcow2 small.qcow2` |
| 大きさを変える | `qemu-img resize disk.qcow2 +10G` |
| 小さくする | `qemu-img resize --shrink disk.qcow2 15G` |
| 差分を作る | `qemu-img create -f qcow2 -b base.qcow2 -F qcow2 overlay.qcow2` |
| 整合性の検査 | `qemu-img check disk.qcow2` |

- `-f` は入力(または作る)形式、`-O` は出力の形式です。`-f` を省くと自動で判別しますが、RAW を自動で判別するのは危険なので、`-f raw` と書くのが安全です。
- `-c`(圧縮)は、主に出力が QCOW2 のときに使えます(ほかに qcow、VMDK の streamOptimized)。元のイメージと別のファイルに書き出します。圧縮を効かせるため、使っていない領域がゼロの状態にしておくと小さくなります。
- 変換は、RAW、QCOW2、VMDK(VMware の形式)、VHDX(Hyper-V の形式)などの間でできます。
- `resize` で大きくするのは、イメージの大きさだけです。ゲストの中の、パーティションとファイルシステムは別に広げます。

```bash
# ホストで 10 GiB 増やす (VM は止めておく。動いているときは virsh blockresize)
qemu-img resize disk.qcow2 +10G
# ゲストの中で
sudo growpart /dev/vda 1          # パーティションを広げる (cloud-utils-growpart)
sudo resize2fs /dev/vda1          # ext4 の場合
sudo xfs_growfs /                 # XFS の場合 (マウントしたまま)
```

- 小さくするときは、先にゲストの中でファイルシステムとパーティションを小さくしてから、`--shrink` でイメージを小さくします。順番を間違えると、データが壊れます。
- 動いている VM のディスクは、`virsh blockresize web01 vda 30G` で大きくできます。
- `qemu-img` は、動いている VM が使っているイメージを書き換えると壊すことがあります。ロックがかかっていれば止まりますが、必ず VM を止めてから使います。

### 3. NUMA

**NUMA**(Non-Uniform Memory Access)は、CPU のグループ(ノード)ごとに自分のメモリを持つ構造です。自分のノードのメモリは速く、別のノードのメモリは遅くなります。ソケットが 2 つのサーバーで、よく見られます。

- 例えば、ソケットが 2 つのサーバーでは、ノード 0 に CPU 0-7 とメモリ 64 GiB、ノード 1 に CPU 8-15 とメモリ 64 GiB が付きます。
- CPU 0 がノード 0 のメモリを使うのが「近い」、ノード 1 のメモリを使うのが「遠い」です。


VM の CPU が、別のノードのメモリを使うと遅くなります。そこで、VM の CPU とメモリを同じノードにそろえます。

```bash
numactl --hardware                 # ノードの数、CPU、メモリ
lscpu | grep -i numa
numastat -c qemu-kvm               # QEMU のプロセスが、どのノードのメモリを使っているか
```

```xml
<numatune>
  <memory mode='strict' nodeset='0'/>      <!-- メモリはノード 0 から取る -->
</numatune>
<cputune>
  <vcpupin vcpu='0' cpuset='0'/>
  <vcpupin vcpu='1' cpuset='1'/>
</cputune>
<cpu mode='host-passthrough'>
  <numa>
    <cell id='0' cpus='0-1' memory='4194304' unit='KiB'/>   <!-- ゲストの NUMA の形 -->
  </numa>
</cpu>
```

- `mode` は、`strict`(そのノードから取れなければ失敗)、`preferred`(できればそのノード)、`interleave`(複数のノードに分散)です。
- VM がホストの 1 つのノードに入りきらない大きさなら、ゲストにも NUMA の形を見せ、ゲストの OS に最適化させます。
- カーネルの自動 NUMA バランシング(`kernel.numa_balancing`)や `numad` サービスが、プロセスを近いノードに寄せる助けをします。固定した設定を入れたときは、自動の動きと衝突しないか確かめます。

### 4. メモリバルーニング

**メモリバルーニング**は、動いている VM のメモリの量を、ホストから増減する仕組みです。ゲストの `virtio-balloon` のドライバーが、ゲストの中で「風船」をふくらませてメモリを取り上げ、ホストに返します。しぼませると、ゲストにメモリが戻ります。

| XML の項目 | 意味 |
|---|---|
| `<memory>` | 最大のメモリの量。動いている間は増やせない(`<maxMemory>` を使ったメモリのホットプラグを除く) |
| `<currentMemory>` | 今ゲストに割り当てている量。ここを動かす |

```bash
virsh setmem web01 1G --live              # 動いている VM のメモリを 1 GiB にする(バルーン)
virsh setmem web01 1G --config            # 次の起動からの設定
virsh setmaxmem web01 4G --config         # 最大の量を変える(VM を止めて、次の起動から有効)
virsh dommemstat web01                    # ゲストのメモリの使用の状態
```

- バルーンで減らせるのは、最大の量までの範囲です。ゲストが使っているメモリは減らせず、足りなくなると、ゲストが遅くなったり、プロセスが OOM Killer に止められたりします。
- 過剰に割り当て(オーバーコミット)した VM で、使っていないメモリをホストに戻す目的で使います。パススルーのデバイスを付けた VM は、メモリを固定するため、バルーンが使えません【要確認】。

### 5. CPU ホットプラグ

**CPU ホットプラグ**は、VM を止めずに、仮想 CPU の数を増やす(減らす)機能です。

```xml
<vcpu placement='static' current='2'>4</vcpu>
```

- 書き方は、`current` が今の数、`4` が最大の数です。最大の数は、動いている間は変えられません。
- 増やす前に、最大の数を決めて起動しておく必要があります。

```bash
virsh setvcpus web01 4 --live             # 動いている VM を 4 CPU にする
virsh setvcpus web01 4 --config           # 次の起動からの設定
virsh setvcpus web01 8 --maximum --config # 最大の数を変える(VM を止めて、次の起動から有効)
virsh vcpucount web01                     # 最大と現在の数
```

- ゲストの Linux では、増えた CPU が自動で有効になります。有効にならないときは、`/sys/devices/system/cpu/cpuN/online` に `1` を書きます。
- 減らす(アンプラグ)には、ゲストの OS と QEMU の対応が必要で、`virsh setvcpus` で減らせない環境もあります【要確認】。ゲストエージェント(qemu-guest-agent)を使い、`--guest` を付ける方法もあります。

## 1.3 仮想化環境のセキュリティ設定 (重要度2)

### 1. Secure Boot

**Secure Boot** は、起動の最初から、署名が正しいプログラムだけを動かす仕組みです。UEFI のファームウェアが、ブートローダー、カーネルなどの署名を確かめます。署名が正しくない、または禁止されたものは、動かしません。VM でも、UEFI のファームウェア(**OVMF**)を使えば、Secure Boot が使えます。

| 鍵・データベース | 役割 |
|---|---|
| **PK**(Platform Key) | プラットフォームの持ち主の鍵。KEK を入れ替える権限を持つ |
| **KEK**(Key Exchange Key) | db と dbx を更新する権限を持つ鍵 |
| **db** | 動かしてよい署名や証明書の一覧 |
| **dbx** | 動かしてはいけないものの一覧 |

- 署名の確かめは、PK から KEK、db へと、信頼の鎖になっています。
- ほとんどの Linux は、Microsoft が署名した小さなブートローダー(**shim**)から始まり、shim が配布元の署名を確かめます。Linux のカーネルモジュールを自分で作って読み込む(DKMS)には、**MOK**(Machine Owner Key)に自分の鍵を登録します。

OVMF には、Secure Boot の鍵が入った版と、入っていない版があります。

```bash
# AlmaLinux 9
sudo dnf install edk2-ovmf
# Ubuntu 24.04
sudo apt install ovmf
ls /usr/share/OVMF/                      # Ubuntu。OVMF_CODE_4M.secboot.fd など
```

- ファームウェアの実行の部分(`OVMF_CODE`)は、全部の VM で共有して読み取り専用です。鍵などの設定は、VM ごとの変数のファイル(NVRAM、`OVMF_VARS`)に保存されます。`/var/lib/libvirt/qemu/nvram/<VM 名>_VARS.fd` です。
- Secure Boot を使うには、マシンの型を `q35` にし、SMM(`<smm state='on'/>`)を有効にします。

```xml
<os firmware='efi'>
  <type arch='x86_64' machine='pc-q35-rhel9.0.0'>hvm</type>
  <firmware>
    <feature enabled='yes' name='enrolled-keys'/>
    <feature enabled='yes' name='secure-boot'/>
  </firmware>
</os>
<features>
  <acpi/>
  <smm state='on'/>
</features>
```

- `enrolled-keys` は、Microsoft の鍵などを最初から登録した状態にします。この項目の使える版は【要確認】です。
- virt-install では `--boot uefi` で UEFI にできます。Secure Boot の指定は版により書き方が違うので、`man virt-install` で確かめます【要確認】。

```bash
# ゲストの中で
mokutil --sb-state                       # SecureBoot enabled と出れば有効
mokutil --list-enrolled                  # 登録した MOK の一覧
sudo mokutil --import mykey.der          # 自分の鍵を登録する(次の再起動で確認の画面が出る)
```

- ゲストの OS が対応している必要があります。署名された shim を使う Ubuntu、AlmaLinux、RHEL などは対応しています。署名のない自作のカーネルや、古い OS は、起動できなくなります。
- Windows 11 を VM で動かすには、UEFI、Secure Boot、TPM 2.0 が必要です。

### 2. TPM 2.0 と仮想 TPM

**TPM**(Trusted Platform Module)は、鍵の保管と、起動の状態の記録(PCR)を行う、セキュリティ用の部品です。TPM 2.0 が現在の版です。ディスクの暗号化の鍵を、起動の状態が正しいときだけ取り出す、という使い方ができます。

VM には、本物の TPM を渡す方法(パススルー)もあります。多くの場合は、ソフトウェアで作る**仮想 TPM**を使います。QEMU/libvirt では **swtpm** というプログラムが仮想 TPM になります。

```bash
sudo dnf install swtpm swtpm-tools      # AlmaLinux 9
sudo apt install swtpm swtpm-tools      # Ubuntu 24.04
```

```xml
<tpm model='tpm-crb'>
  <backend type='emulator' version='2.0'/>
</tpm>
```

- `model` は、UEFI の VM では `tpm-crb` を使うのが一般的です。BIOS の VM では `tpm-tis` です。
- `backend type='emulator'` が swtpm です。ホストの TPM を渡すなら `type='passthrough'` と、`<device path='/dev/tpm0'/>` を書きます。
- 仮想 TPM の状態は、ホストの `/var/lib/libvirt/swtpm/<UUID>/` に保存されます。このファイルが消えると、TPM の中の鍵を失います。VM のバックアップでは、このファイルも一緒に保存します。
- virt-install では、`--tpm backend.type=emulator,backend.version=2.0,model=tpm-crb` と書きます。

```bash
# ゲストの中で
ls /dev/tpm0 /dev/tpmrm0                 # TPM のデバイス
sudo tpm2_pcrread sha256:0,7             # tpm2-tools。PCR の値(7 は Secure Boot の状態)
sudo systemd-cryptenroll --tpm2-device=auto /dev/vda3    # LUKS の鍵を TPM に登録する
```

### 3. キー管理

仮想化の環境で守る鍵は、次のようにいくつもあります。

| 鍵 | 守り方 |
|---|---|
| Secure Boot の PK、KEK の秘密鍵 | 持ち主だけが読める場所に置く(権限 600)。VM を動かすホストには置かない。ほかの人が署名できてしまうため |
| MOK の秘密鍵 | 同じ。ビルドする機械でだけ使う |
| 仮想 TPM の状態ファイル | バックアップに含める。ほかの人が読めないようにする |
| ディスクの暗号化の鍵(LUKS など) | 鍵は紙や金庫など、別の場所にも保管する。復旧の鍵がないと、データを取り戻せない |
| VM を管理する鍵(SSH、TLS の鍵) | 管理者ごとに分け、不要になったら失効させる |

- 秘密の値は、XML に直接書かず、libvirt の **secret**(`virsh secret-define`、`virsh secret-set-value`)に保存して、UUID で参照します。
- QCOW2 は、LUKS による暗号化に対応しています(`qemu-img create -f qcow2 -o encrypt.format=luks ...`)。ホストのディスクを盗まれたときの被害を減らせます【要確認】。

## 1.4 仮想マシンの管理と OVF の活用 (重要度3)

### 1. virsh の基本

**virsh** は、libvirt の VM(**ドメイン**と呼びます)を操作する、コマンドです。

| コマンド | 動き |
|---|---|
| `virsh list --all` | VM の一覧(止まっているものも) |
| `virsh start web01` | 起動 |
| `virsh shutdown web01` | ゲストの OS に停止を頼む(穏やかな停止) |
| `virsh destroy web01` | 電源を強制的に切る(VM の定義は消えない) |
| `virsh reboot web01` | 再起動 |
| `virsh suspend web01` / `virsh resume web01` | 一時停止と再開 |
| `virsh autostart web01` | ホストの起動時に VM も起動する |
| `virsh define web01.xml` | XML から、VM を登録する |
| `virsh undefine web01` | VM の登録を消す(ディスクのファイルは残る。`--remove-all-storage` で消す) |
| `virsh dominfo web01` | VM の情報 |
| `virsh domblklist web01` | ディスクの一覧 |
| `virsh domiflist web01` | ネットワークの一覧 |

- 接続先は `-c` で指定します。ローカルのシステム用は `qemu:///system`、遠くのホストは `qemu+ssh://root@host/system` です。root で使うと既定が `qemu:///system` です。一般のユーザーは既定が `qemu:///session` になるので、`-c qemu:///system` を付けます。
- `virsh destroy` は VM の定義を消さず、電源を切るだけです。名前に惑わされないでください。

### 2. 構成 XML

VM の構成(CPU、メモリ、ディスク、ネットワーク)は、XML で書かれています。保存の場所は `/etc/libvirt/qemu/<VM 名>.xml` です。

```bash
virsh dumpxml web01 > web01.xml           # 今の構成を取り出す(動いているときは実行中の状態)
virsh dumpxml --inactive web01            # 保存してある構成(次の起動で使うもの)
virsh edit web01                          # 保存されている XML を、エディターで直す
virsh define web01.xml                    # XML を登録する(同じ名前と UUID なら更新)
```

```xml
<domain type='kvm'>
  <name>web01</name>
  <uuid>(UUID)</uuid>
  <memory unit='KiB'>2097152</memory>
  <vcpu placement='static'>2</vcpu>
  <devices>
    <disk type='file' device='disk'> ... </disk>
    <interface type='bridge'> ... </interface>
  </devices>
</domain>
```

- `/etc/libvirt/qemu/*.xml` を直接直すと、libvirtd が気づかず、元に戻ることがあります。`virsh edit` を使います。
- 動いている VM の構成を変えても、保存された構成が変わるとは限りません。`--live`(今)、`--config`(次の起動から)を付けて、どちらに効くかを決めます。
- 別のホストに VM を移すときは、`dumpxml` で取り出し、ディスクと一緒に運び、移した先で `define` します。

### 3. スナップショット

**スナップショット**は、ある時点の VM の状態を保存して、あとで戻せるようにする機能です。

| 種類 | 仕組み | 特徴 |
|---|---|---|
| 内部スナップショット | 保存先は QCOW2 の中。1 つのファイルに入る | `virsh snapshot-create-as` の既定。QCOW2 のみ。動いている VM では、メモリの状態も保存する。UEFI の VM(NVRAM が RAW)では使えないことがある。その場合は外部スナップショットを使う【要確認】 |
| 外部スナップショット(差分) | 元のディスクを読み取り専用にし、新しいファイルに変更を書く | 元のイメージが変わらないので、バックアップに使える。RAW でも使える。ファイルが増える |

動いている VM に取るものを**ライブスナップショット**と呼びます。メモリの中身を含めると、戻したときに、スナップショットの瞬間の動いている状態に戻ります。

```bash
# 内部スナップショット
virsh snapshot-create-as web01 before-update --description "更新の前"
virsh snapshot-list web01
virsh snapshot-revert web01 before-update
virsh snapshot-delete web01 before-update

# 外部スナップショット(ディスクだけ。差分のファイルを作る)
virsh snapshot-create-as web01 snap1 --disk-only --atomic \
  --diskspec vda,file=/var/lib/libvirt/images/web01-snap1.qcow2
```

- 外部スナップショットを取ると、VM は新しいファイル(`web01-snap1.qcow2`)に書くようになり、元のファイルは**バッキングファイル**(ベースディスク)になります。
- `--quiesce` を付けると、ゲストの中のファイルシステムを静かな状態にしてから取れます。ゲストに qemu-guest-agent が必要です。
- スナップショットは、バックアップの代わりにはなりません。同じディスクの中にあり、ディスクが壊れると一緒に失われます。
- 差分が積み重なると、読み込みが遅くなります。使い終わったら、ベースディスクに統合します。

```text
外部スナップショットの前
    web01.qcow2                    VM が読み書きする

外部スナップショットの後
    web01.qcow2  <--  web01-snap1.qcow2
    左は読み取り専用。右に VM が書く。左が右のバッキングファイル

統合 (blockcommit --active --pivot) の後
    web01.qcow2                    変更が戻り、VM はここに書く。snap1 は要らなくなる
```

統合のコマンドです。

```bash
# 差分を、ベースディスクに書き戻して、VM の使うファイルを元に戻す
virsh blockcommit web01 vda --active --pivot
# 古い差分のファイルは自分で消す。スナップショットの記録も消す
rm /var/lib/libvirt/images/web01-snap1.qcow2
virsh snapshot-delete web01 snap1 --metadata
```

- `blockcommit` は、上の層(差分)をその下の層(ベース)に書き戻します。`--active` は動いている最上位の層を対象にし、`--pivot` は終わったあと、VM の使うファイルを下の層に切り替えます。
- `blockpull` は逆で、ベースディスクの内容を差分のファイルに取り込み、バッキングファイルへの依存を切ります。
- 外部スナップショットの `virsh snapshot-revert` は、libvirt 9.9.0 から使えます。それより古い版では、元のイメージを使うように XML を直します。
- 新しい libvirt では、`snapshot-delete` で外部スナップショットの差分を統合できる版もあります【要確認】。ただし、外部スナップショットでは `--children` を使えない版があります【要確認】。

### 4. マイグレーション

**マイグレーション**は、VM を別のホストに移すことです。

| 種類 | 内容 | 止まる時間 |
|---|---|---|
| **ライブマイグレーション** | VM を動かしたまま、メモリの内容を移す。最後に一瞬だけ止めて切り替える | ごく短い(数十〜数百ミリ秒の程度) |
| **コールドマイグレーション** | VM を止めて、ディスクと構成 XML を移す | 作業の間ずっと止まる |

```bash
# ライブマイグレーション(共有ストレージで、ディスクは同じ場所を見ている場合)
virsh migrate --live --persistent --undefinesource web01 qemu+ssh://host2/system
# 共有ストレージがない場合は、ディスクの中身も一緒に送る
virsh migrate --live --persistent --undefinesource --copy-storage-all web01 qemu+ssh://host2/system
```

- `--persistent` は移した先に定義を残す、`--undefinesource` は元のホストの定義を消すオプションです。
- ライブマイグレーションの条件は、次のとおりです。
  - 移し先のホストにも、同じ QEMU の機能と同じ種類の CPU の機能があること(CPU の型を `host-model` にすると移しやすい)
  - ディスクが共有ストレージ(NFS、Ceph など)にあるか、`--copy-storage-all` で送ること
  - 同じ名前のブリッジなど、ネットワークの設定がそろっていること
  - ホスト間で、libvirt の接続(SSH、TLS)と、QEMU のデータ用のポートの通信が通ること(既定は 49152〜49215。`/etc/libvirt/qemu.conf` の `migration_port_min` と `migration_port_max`。`--tunnelled` のときは使わない)
- パススルーのデバイスを付けた VM は、ライブマイグレーションが難しくなります。
- コールドマイグレーションの手順の例です。

```bash
virsh shutdown web01
virsh dumpxml web01 > web01.xml
scp /var/lib/libvirt/images/web01.qcow2 host2:/var/lib/libvirt/images/
scp web01.xml host2:/tmp/
ssh host2 virsh define /tmp/web01.xml
ssh host2 virsh start web01
```

### 5. OVF

**OVF**(Open Virtualization Format)は、VM を、ソフトウェアの違いを越えて受け渡すための標準の形式です。VMware、VirtualBox、Proxmox VE などで使えます。

| ファイル | 内容 |
|---|---|
| `.ovf` | **記述子**(ディスクリプタ)。VM の CPU、メモリ、ディスク、ネットワークの構成を書いた XML |
| `.vmdk` | VM のディスクのイメージ。VMware の形式(VMDK)が多い |
| `.mf` | **マニフェスト**。各ファイルのハッシュ値(SHA-256 など)の一覧。改ざんや壊れの確認に使う |
| `.cert` | **証明書ファイル**。マニフェストに付けた電子署名と、署名した人の証明書。持ち主の確認に使う |

- **OVA**(Open Virtual Appliance)は、上のファイルを 1 つの tar にまとめたファイルです。受け渡しが簡単です。OVF の記述子が、先頭に入ります。
- OVF のディスクは、`.vmdk` 以外の形式もあります。

```text
web01.ova  (tar のファイル)
  +-- web01.ovf         記述子
  +-- web01-disk1.vmdk  ディスク
  +-- web01.mf          マニフェスト (任意)
  +-- web01.cert        証明書 (任意)
```

マニフェストの中身の例です。

```
SHA256(web01.ovf)= 3c1f...(省略)
SHA256(web01-disk1.vmdk)= a9d2...(省略)
```

**OVF テンプレートの作成、エクスポート、インポート**

| 作業 | コマンドの例 |
|---|---|
| VirtualBox から書き出す | `VBoxManage export web01 -o web01.ova --manifest` |
| VirtualBox に取り込む | `VBoxManage import web01.ova` |
| VMware から書き出す | `ovftool vi://host/web01 web01.ova` |
| OVA の中身を見る | `tar -tvf web01.ova` |
| OVA を展開する | `tar -xvf web01.ova` |
| ハッシュを確かめる | `sha256sum web01-disk1.vmdk` |
| ディスクを KVM 用に変換する | `qemu-img convert -f vmdk -O qcow2 web01-disk1.vmdk web01.qcow2` |
| Proxmox VE に取り込む | `qm importovf 100 web01.ovf local-lvm` |

- 取り込み前に、`.mf` のハッシュと、`sha256sum` の結果を比べます。違っていれば、ダウンロードの失敗か、改ざんです。
- OVF は構成を記述するだけなので、取り込んだ先で、デバイスの種類(IDE を virtio に直すなど)やネットワークの名前の割り当てを直す必要があることがあります。
- KVM へ移すときは、`virt-v2v` が、ドライバーの入れ替えまで行います。

## 1.5 仮想化プラットフォームの利用 (重要度3)

### 1. Proxmox VE の全体

**Proxmox VE**(Proxmox Virtual Environment)は、KVM の VM と LXC のコンテナを、Web の画面で管理する仮想化のプラットフォームです。Debian をもとにした、オープンソースのソフトウェアです。この章は Proxmox VE 8 系(Debian 12 がもと)を前提にします【要確認】。9 系が出ていて、画面や機能に違いがあることがあります。

| 機能 | 内容 |
|---|---|
| 統合管理 | Web UI(`https://<ホスト>:8006`)で、VM、コンテナ、ストレージ、ネットワーク、クラスタをまとめて管理する |
| 仮想化 | KVM/QEMU の VM、LXC のコンテナ |
| クラスタ | 複数のホストを 1 つにまとめて管理する |
| 高可用性(HA) | ホストが故障したとき、VM を別のホストで自動で起動する |
| バックアップ | `vzdump` による VM、コンテナのバックアップ |
| ストレージ | ローカルの LVM、ZFS、NFS、Ceph など |

| コマンド | 対象 |
|---|---|
| `qm` | KVM の VM(Qemu Manager) |
| `pct` | LXC のコンテナ |
| `pvecm` | クラスタ |
| `pvesm` | ストレージ |
| `ha-manager` | 高可用性 |
| `vzdump`、`qmrestore` | バックアップ、リストア |
| `pvesh` | API を使った操作 |

- 最初のログインは、`root` のユーザーで、領域(レルム)は `Linux PAM` を選びます。
- 無料で使うときは、有料の購読が要るリポジトリ(enterprise)を、購読なしのリポジトリ(no-subscription)に切り替えます。

### 2. クラスタの構築

**クラスタ**は、複数の Proxmox VE のホスト(ノード)を、1 つの管理の単位にまとめたものです。どのノードの Web UI からでも、全体を操作できます。

```text
pve1 (192.0.2.11)      pve2 (192.0.2.12)      pve3 (192.0.2.13)
  |                      |                      |
  +----------------------+----------------------+   クラスタの通信 (corosync)
  |                      |                      |
  +-- 共有ストレージ (NFS、Ceph など) ----------+
```

- ノード間の状態の同期には、**corosync** を使います。設定は `/etc/pve/` に置かれ、全ノードで同じ内容になります(クラスタファイルシステム `pmxcfs`)。
- クラスタは**クォーラム**(過半数のノードが生きていること)で動きます。過半数を失うと、設定の変更や VM の起動ができなくなります。3 台以上にするか、2 台のときは QDevice(投票だけをする第三の機械)を足します。
- ノード間は、低い遅延の安定したネットワークでつなぎ、クラスタの通信用に独立した回線を用意するのが望ましいです。

```bash
# 1 台目で、クラスタを作る
pvecm create mycluster
# 2 台目、3 台目で、1 台目の IP アドレスを指定して参加する(参加するノードに、VM が無い状態で)
pvecm add 192.0.2.11
# 状態の確認
pvecm status
pvecm nodes
```

- 参加するノードの名前と IP アドレスは、あとから変えにくいので、先に決めておきます。
- ノードを外すときは、そのノードを止めて、残ったノードで `pvecm delnode <ノード名>` を実行します。

### 3. ネットワークの設定

Proxmox VE は、VM をネットワークにつなぐために、Linux ブリッジ(`vmbr0` など)を使います。ブリッジは、仮想のスイッチです。物理の NIC をブリッジにつなぎ、VM の仮想 NIC も同じブリッジにつなぎます。

- 物理の NIC(`eno1`)をブリッジ(`vmbr0`)につなぎ、VM 100 や VM 101 の仮想 NIC(`net0`)も同じブリッジにつなぎます。ホストの管理用の IP アドレスも、`vmbr0` に付けます。


設定は `/etc/network/interfaces` にあります。Web UI の「ノード → システム → ネットワーク」で直し、「設定を適用」で反映します。

```
auto vmbr0
iface vmbr0 inet static
        address 192.0.2.11/24
        gateway 192.0.2.1
        bridge-ports eno1
        bridge-stp off
        bridge-fd 0
```

- `192.0.2.0/24` は、説明のための架空の範囲です。
- IP アドレスは、物理の NIC(`eno1`)ではなく、ブリッジ(`vmbr0`)に付けます。
- 反映は、`ifreload -a`(ifupdown2)でできます。Web UI の設定は、いったん `interfaces.new` に書かれ、適用すると本物になります。
- VLAN を使うときは、ブリッジの `bridge-vlan-aware yes` を有効にし、VM の NIC に VLAN タグを指定します。
- クラスタでは、ブリッジの名前を全ノードで同じにします。同じ名前でないと、VM を別のノードに移したときに、ネットワークにつながらなくなります。

### 4. VM の構築と削除

```bash
# VM を作る(100 は VM の番号。ISO は、ストレージ local に置いてある)
qm create 100 --name web01 --memory 2048 --cores 2 \
  --net0 virtio,bridge=vmbr0 \
  --scsihw virtio-scsi-pci --scsi0 local-lvm:32 \
  --ide2 local:iso/almalinux-9-minimal.iso,media=cdrom \
  --boot order='scsi0;ide2' --ostype l26
qm start 100
qm list                       # VM の一覧
qm config 100                 # 設定
qm shutdown 100               # ゲストに停止を頼む
qm stop 100                   # 電源を強制的に切る
qm destroy 100 --purge        # VM とディスクを消す(バックアップのジョブや HA の設定からも外す)
```

- `--scsi0 local-lvm:32` は、`local-lvm` のストレージに 32 GiB のディスクを作ります。
- ISO や、コンテナのテンプレートは、ストレージの「ISO イメージ」「CT テンプレート」に置きます。
- よく使う設定の VM は、`qm template 100` で**テンプレート**にし、`qm clone 100 200 --name web02 --full` で複製します。
- `qm destroy` は、元に戻せません。バックアップを確かめてから実行します。

### 5. ホスト間のマイグレーション

```bash
qm migrate 100 pve2 --online                        # 動いたまま移す(ライブマイグレーション)
qm migrate 100 pve2 --online --with-local-disks     # ローカルのディスクも一緒に送る
qm migrate 100 pve2                                 # 止まっている VM を移す
pct migrate 200 pve2 --restart                      # コンテナは、止めて移す(再起動する)
```

- Web UI では、VM を右クリックして「マイグレート」を選びます。
- 共有ストレージにディスクがあれば、ディスクを送らないので、短時間で終わります。ローカルのディスクだと、ディスクの大きさの分、時間がかかります。
- 移し先に、同じ名前のブリッジとストレージがないと、失敗します。
- コンテナ(LXC)は、動いたままのライブマイグレーションができず、再起動を伴います。

### 6. バックアップとリストア

```bash
# VM 100 のバックアップを、ストレージ local に、zstd 圧縮で取る
vzdump 100 --mode snapshot --storage local --compress zstd
# 取ったファイルから、新しい VM 101 として戻す
qmrestore /var/lib/vz/dump/vzdump-qemu-100-<日時>.vma.zst 101 --storage local-lvm
```

| `--mode` | 内容 |
|---|---|
| `snapshot` | VM を動かしたまま取る。VM の停止は不要。ゲストの中のデータの整合性は、qemu-guest-agent があると良くなる |
| `suspend` | 一時停止して取る。短い停止がある |
| `stop` | 止めて取り、終わると起動する。最も確実で、停止の時間が長い |

- バックアップは、保存先(ストレージ)に `vzdump-qemu-<VM 番号>-<日時>.vma.zst` のようなファイルで残ります。標準の場所は `/var/lib/vz/dump/` です。
- 定期的に取るには、Web UI の「データセンター → バックアップ」でジョブを作り、保存する世代の数を決めます。
- 別のサーバーに取るなら、**Proxmox Backup Server**(重複を省いて保存する専用のサーバー)を使う方法もあります。
- バックアップは、実際に戻せるか、定期的に確かめます。

### 7. 高可用性(HA)

**高可用性**は、ホストが故障したとき、そのホストで動いていた VM を、別のホストで自動で起動して、止まっている時間を短くする仕組みです。

```text
pve1 が故障 (ネットワークから消える)
    |
    v
残りのノードが、クォーラム(過半数)を保っているか確かめる
    |
    v
故障したノードが完全に止まった (フェンシング) ことを確かめる
    |
    v
HA の対象の VM を、pve2 など別のノードで起動する
```

```bash
ha-manager add vm:100 --state started       # VM 100 を HA の対象にする
ha-manager status                           # HA の状態
ha-manager remove vm:100                    # 対象から外す
```

- HA には、3 台以上のクラスタ(または QDevice)と、全ノードから同じディスクが見える**共有ストレージ**(または、ストレージの複製)が要ります。
- 故障したノードが VM をまだ動かしているのに、別のノードも起動すると、同じディスクに 2 か所から書いて壊します。これを防ぐため、故障したノードを確実に止める**フェンシング**を、ウォッチドッグで行います。
- HA は、故障の後に、VM を起動し直す仕組みです。ライブマイグレーションのように、止まらずに移すものではありません。VM の中は再起動になります。
- 8 系では、ノードの優先を **HA グループ**で決めます。9.0 から HA グループは非推奨になり、HA の規則(Node Affinity rules)に自動で移されます。
