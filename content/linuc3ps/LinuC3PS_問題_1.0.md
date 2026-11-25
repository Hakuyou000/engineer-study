# LinuC3PS 問題 1.0 仮想化基盤の構築

対象: LinuC レベル3 3PS試験 Version 1.0 / 全51問 / すべてオリジナル問題
対応テキスト: `LinuC3PS_1.0_仮想化基盤の構築.md`
解答・解説は末尾。

## 問題

### 1.1 仮想化技術の動作原理と最適化

**問1** `LinuC3PS-1.0-001` Linux のカーネルの機能で、CPU の仮想化支援機能(Intel VT-x、AMD-V)を使ってゲストの命令をほぼそのまま CPU で動かし、`/dev/kvm` を提供するものはどれか。

- A. QEMU
- B. libvirt
- C. KVM
- D. virtio

**問2** `LinuC3PS-1.0-002` Linux のゲストに、ディスクを virtio-blk(`bus='virtio'`)で付けた。ゲストの中で、そのディスクに一般に見える名前はどれか。

- A. `/dev/sda`
- B. `/dev/vda`
- C. `/dev/hda`
- D. `/dev/nvme0n1`

**問3** `LinuC3PS-1.0-003` ホスト上で、優先度が同じ SCHED_FIFO のプロセスが 2 つ、同じ CPU で計算を続けている。どちらも自分からは CPU を譲らない。先に動いたほうが終わるまで、もう一方が動けない。この動きを、RT の方針のまま、優先度も変えずに、時間を区切って交代する動きに変えるために、使う方針はどれか。

- A. nice 値を上げる
- B. SCHED_BATCH にする
- C. SCHED_RR にする
- D. SCHED_IDLE にする

**問4** `LinuC3PS-1.0-004` PID が 1234 のプロセスの、今のスケジューリングの方針と優先度を表示する chrt のコマンドを答えよ。

**問5** `LinuC3PS-1.0-005` 周期 10 ミリ秒ごとに、3 ミリ秒の CPU 時間を、10 ミリ秒以内に使い終えたい処理がある。実行時間、締め切り、周期をカーネルに宣言し、カーネルが受け入れできるかを検査する方式で動かすコマンドはどれか。

- A. `chrt -f 99 ./task`
- B. `chrt -d --sched-runtime 3000000 --sched-deadline 10000000 --sched-period 10000000 0 ./task`
- C. `chrt -b 0 ./task`
- D. `chrt -i 0 ./task`

**問6** `LinuC3PS-1.0-006` Ubuntu 24.04 の標準のカーネル(6.8 系)で、SCHED_OTHER のプロセスを動かす Fair クラスの実装はどれか。

- A. CFS
- B. EEVDF
- C. O(1) スケジューラー
- D. DEADLINE スケジューラー

**問7** `LinuC3PS-1.0-007` NVMe の SSD(`/dev/nvme0n1`)で、I/O スケジューラーによる並べ替えをしない設定にする。`/sys/block/nvme0n1/queue/scheduler` に書く値を答えよ。

**問8** `LinuC3PS-1.0-008` Linux の I/O スケジューラーの説明として、正しいものはどれか。

- A. bfq は、プロセスごとに帯域を公平に分け、応答の良さを重視する。処理は重めである。
- B. mq-deadline は、プロセスごとの公平さを重視し、処理は重い。
- C. kyber は、要求に期限を付けて、読み込みを書き込みより先に処理する。
- D. none は、要求を期限で並べ替えるため、HDD に最も向く。

**問9** `LinuC3PS-1.0-009` Intel の CPU のサーバーで、GPU を VM に渡したい。UEFI の設定で VT-d は有効にしたが、`/sys/kernel/iommu_groups/` の下が空である。カーネルのコマンドラインには IOMMU に関する指定がない。まず行うべき対処はどれか。

- A. `kvm_intel` モジュールを取り外す
- B. `vfio-pci` を blacklist に入れる
- C. VM の XML に virtio-rng を追加する
- D. カーネルのコマンドラインに `intel_iommu=on` を足して、再起動する

**問10** `LinuC3PS-1.0-010` vfio-pci による PCI デバイスのパススルーについて、正しいものを**2つ**選べ。

- A. 同じ IOMMU グループのデバイスは、PCI のブリッジを除き、すべてホストのドライバーから外し、vfio-pci につなぐ必要がある。
- B. 渡したデバイスは、ホストと、ほかの VM が同時に使える。
- C. `lspci -nnk` で、渡すデバイスの `Kernel driver in use` が `vfio-pci` になっているか確かめられる。
- D. パススルーのデバイスを付けると、ライブマイグレーションが簡単になる。

**問11** `LinuC3PS-1.0-011` ゲストの Linux から `/dev/sda`、`/dev/sdb` のように見え、1 つの仮想のコントローラーに多くのディスクをつなげられる、virtio の仮想デバイスはどれか。

- A. virtio-blk
- B. virtio-net
- C. virtio-rng
- D. virtio-scsi

**問12** `LinuC3PS-1.0-012` `chrt -i 0 ./job` で起動したプロセスの動きとして、正しいものはどれか。

- A. 優先度 1〜99 の RT で動き、通常のプロセスを押しのける。
- B. 非常に低い優先度で動き、主にほかのプロセスが CPU を使わない時間に動く。
- C. 周期と締め切りを宣言し、カーネルが期限を守るように動かす。
- D. SCHED_OTHER と同じように、ほかのプロセスと公平に分け合う。

### 1.2 仮想ディスクと QEMU の操作

**問13** `LinuC3PS-1.0-013` RAW 形式の `disk.raw` を、QCOW2 形式の `disk.qcow2` に変換するコマンドはどれか。

- A. `qemu-img convert -f raw -O qcow2 disk.raw disk.qcow2`
- B. `qemu-img convert -f qcow2 -O raw disk.raw disk.qcow2`
- C. `qemu-img create -f qcow2 disk.raw disk.qcow2`
- D. `qemu-img info -f raw -O qcow2 disk.raw disk.qcow2`

**問14** `LinuC3PS-1.0-014` QCOW2 の `big.qcow2` を、圧縮して、小さな別のファイル `small.qcow2` に書き出したい。正しいコマンドはどれか。

- A. `qemu-img resize -c big.qcow2 small.qcow2`
- B. `qemu-img create -c big.qcow2 small.qcow2`
- C. `qemu-img check -c big.qcow2 small.qcow2`
- D. `qemu-img convert -c -O qcow2 big.qcow2 small.qcow2`

**問15** `LinuC3PS-1.0-015` 止めた VM の QCOW2 のディスク `disk.qcow2` を、10 GiB 大きくしたい。正しいコマンドはどれか。

- A. `qemu-img create -f qcow2 disk.qcow2 +10G`
- B. `qemu-img convert -O qcow2 disk.qcow2 +10G`
- C. `qemu-img info disk.qcow2 +10G`
- D. `qemu-img resize disk.qcow2 +10G`

**問16** `LinuC3PS-1.0-016` ホストで `qemu-img resize` を使い、ゲストの `/dev/vda` を大きくした。ゲストは `/dev/vda1`(ext4)を 1 つだけ使っている。ゲストは cloud-init などの自動の拡張を使っていない。ゲストの中で、領域を使えるようにするために必要な作業はどれか。

- A. `resize2fs /dev/vda1` だけで足りる。
- B. ゲストのカーネルを入れ替える。
- C. パーティションを広げてから(例: `growpart /dev/vda 1`)、`resize2fs /dev/vda1` を実行する。
- D. 何もしなくても、ゲストが自動で広げる。

**問17** `LinuC3PS-1.0-017` QCOW2 のイメージ `disk.qcow2` を、今より小さい 15G にするとき、`qemu-img resize` に付けなければならないオプションを答えよ(ゲストの中の縮小は済んでいるものとする)。

**問18** `LinuC3PS-1.0-018` 同じ元のイメージ `base.qcow2` から、多くの VM のディスクを、ディスクの量を節約して作りたい。元のイメージは変更せず、各 VM の変更だけを別のファイルに書く。正しいコマンドはどれか。

- A. `qemu-img create -f qcow2 -b base.qcow2 -F qcow2 vm01.qcow2`
- B. `qemu-img create -f raw -b base.qcow2 vm01.raw`
- C. `qemu-img convert -O raw base.qcow2 vm01.raw`
- D. `qemu-img resize base.qcow2 vm01.qcow2`

**問19** `LinuC3PS-1.0-019` NUMA のホストで、VM の仮想 CPU はノード 0 の物理 CPU に固定している。ところが、`numastat -c qemu-kvm` を見ると、VM のメモリの大半がノード 1 にあり、VM が遅い。対処として適切なものはどれか。

- A. 仮想 CPU の固定をやめて、すべての物理 CPU に動かす
- B. VM のメモリもノード 0 から取るように、`<numatune>` で `nodeset='0'` を指定する
- C. VM に virtio-balloon を追加する
- D. VM のディスクを RAW に変換する

**問20** `LinuC3PS-1.0-020` VM の XML は `<memory>` が 2 GiB、`<currentMemory>` が 1 GiB である。XML に `<maxMemory>` はない。この VM は動いている。ゲストに割り当てるメモリを、動いたまま 3 GiB にしようとしたが、失敗した。原因はどれか。

- A. virtio-net のドライバーが入っていない。
- B. ゲストのカーネルが NUMA に対応していない。
- C. `qemu-img resize` を先に実行していない。
- D. 最大のメモリ(`<memory>`)の 2 GiB を超えており、バルーンでは最大を超えて増やせない。

**問21** `LinuC3PS-1.0-021` `<vcpu placement='static' current='2'>4</vcpu>` と定義された、動いている VM がある。止めずに、今すぐ仮想 CPU を 4 つにし、次の起動からも 4 つにしたい。正しいコマンドはどれか。

- A. `virsh setvcpus web01 4 --live --config`
- B. `virsh setvcpus web01 4 --maximum --config`
- C. `virsh setmem web01 4 --live`
- D. `virsh vcpupin web01 4 0`

### 1.3 仮想化環境のセキュリティ設定

**問22** `LinuC3PS-1.0-022` UEFI の Secure Boot で、PK とは別に、OS の配布元や Microsoft などが持ち、db と dbx の更新への署名に使う鍵はどれか。

- A. PK
- B. KEK
- C. MOK
- D. shim

**問23** `LinuC3PS-1.0-023` libvirt の VM で、Secure Boot を動かすために必要なものを**2つ**選べ。

- A. BIOS のファームウェア(SeaBIOS)
- B. Secure Boot に対応した UEFI のファームウェア(OVMF)
- C. virtio-balloon の無効化
- D. マシンの型 `q35` と、SMM(`<smm state='on'/>`)の有効化

**問24** `LinuC3PS-1.0-024` ゲストの Linux の中で、Secure Boot が有効かどうかを表示する mokutil のコマンドを答えよ。

**問25** `LinuC3PS-1.0-025` Secure Boot が有効なゲストの Linux で、自分で作った署名のないカーネルモジュールを読み込めない。Secure Boot は有効のままにしたい。適切な対処はどれか。

- A. 自分の鍵を dbx に登録する
- B. TPM をゲストから外す
- C. モジュールに自分の鍵で署名し、公開鍵を MOK に登録する(`mokutil --import`)
- D. virtio-rng を追加する

**問26** `LinuC3PS-1.0-026` ホストに物理の TPM がない。Windows 11 のゲストに TPM 2.0 を見せたい。適切な方法はどれか。

- A. swtpm を使う仮想 TPM(`<backend type='emulator' version='2.0'/>`)を VM に付ける
- B. virtio-balloon を TPM の代わりに使う
- C. `qemu-img` で TPM のイメージを作る
- D. vfio-pci で、存在しない TPM のデバイスを渡す

**問27** `LinuC3PS-1.0-027` 仮想 TPM を付けた VM を、コールドマイグレーションで別のホストに移す。ディスクと構成 XML だけを移して起動したところ、ディスクの暗号化の鍵を、TPM から自動で取り出せなくなった。原因として最も適切なものはどれか。

- A. 構成 XML の UUID が大文字になっていた。
- B. 移し先の CPU が、移し元と同じ会社の製品だった。
- C. ディスクイメージが QCOW2 だった。
- D. 仮想 TPM の状態ファイル(`/var/lib/libvirt/swtpm/<UUID>/`)を移していなかった。

**問28** `LinuC3PS-1.0-028` Secure Boot の PK の秘密鍵の保管として、最も適切なものはどれか。

- A. VM を動かすホストの `/etc/` に、全員が読める権限で置く
- B. 持ち主だけが読める場所に置き、VM を動かすホストには置かない
- C. VM の構成 XML に、そのまま書く
- D. チームの公開リポジトリに入れる

### 1.4 仮想マシンの管理と OVF の活用

**問29** `LinuC3PS-1.0-029` `virsh destroy web01` を実行したときの結果として、正しいものはどれか。

- A. VM の定義とディスクのファイルが消える。
- B. ゲストの OS に、穏やかな停止を頼む。
- C. VM の電源を強制的に切る。VM の定義とディスクは残る。
- D. VM をほかのホストに移す。

**問30** `LinuC3PS-1.0-030` 動いている libvirtd のホストで、VM web01 の構成 XML を直したい。適切な手順はどれか。

- A. `/etc/libvirt/qemu/web01.xml` を vi で直して、何もしない
- B. `virsh edit web01` で直す
- C. `virsh destroy web01` で VM の定義を消してから、直す
- D. `/var/lib/libvirt/images/` の下の XML を直す

**問31** `LinuC3PS-1.0-031` VM web01 の今の構成 XML を、標準出力に表示する virsh のコマンドを答えよ(sudo は不要)。

**問32** `LinuC3PS-1.0-032` ディスクが RAW 形式の VM を、動かしたまま、ディスクのスナップショットを取りたい。方法として適切なものはどれか。

- A. 外部スナップショット(`virsh snapshot-create-as ... --disk-only`)で、差分のファイルを作る
- B. 内部スナップショットを取る。RAW でも使える
- C. `qemu-img resize` を実行する
- D. `virsh undefine` を実行する

**問33** `LinuC3PS-1.0-033` 動いている VM web01 の外部スナップショットの差分(オーバーレイ)を、元のベースディスクに統合し、VM の使うファイルを元に戻したい。virsh の block 系のコマンドで行う。ディスクの名前は `vda` である。正しいコマンドはどれか。

- A. `virsh snapshot-revert web01 snap1`
- B. `virsh blockpull web01 vda`
- C. `virsh blockcommit web01 vda --active --pivot`
- D. `virsh snapshot-delete web01 snap1 --children`

**問34** `LinuC3PS-1.0-034` ホスト A から、ホスト B へ、VM をライブマイグレーションする。ディスクは共有ストレージにあり、ネットワークのブリッジの名前もそろっている。VM は CPU を `host-passthrough` で見せている。失敗する可能性が最も高い条件はどれか。

- A. ホスト B の QEMU の版が、ホスト A と同じである。
- B. ホスト A と B が、同じ共有ストレージを見ている。
- C. ホスト B の CPU に、ゲストに見せている CPU の機能の一部がない。
- D. ホスト A と B のブリッジの名前が同じである。

**問35** `LinuC3PS-1.0-035` ホスト A の VM を止めて、ホスト B に移す(コールドマイグレーション)。移し先で必要な作業はどれか。

- A. ディスクのイメージと構成 XML を移し、移し先で `virsh define` で登録して起動する。
- B. メモリの内容を、ネットワークで送り続ける。
- C. VM を止めずに、ディスクだけ移す。
- D. `virsh blockcommit` を実行する。

**問36** `LinuC3PS-1.0-036` 共有ストレージがない 2 台のホストで、ディスクの中身も一緒に送りながら、VM を動かしたまま移すコマンドはどれか。

- A. `virsh migrate web01 qemu+ssh://host2/system`
- B. `virsh migrate --offline web01 qemu+ssh://host2/system`
- C. `virsh dumpxml web01 > web01.xml`
- D. `virsh migrate --live --copy-storage-all web01 qemu+ssh://host2/system`

**問37** `LinuC3PS-1.0-037` OVF のパッケージの `.mf` のファイルの役割として、正しいものはどれか。

- A. VM の CPU やメモリの構成を書いた XML である。
- B. 各ファイルのハッシュ値の一覧(マニフェスト)で、壊れや改ざんの確認に使う。
- C. VM のディスクのイメージである。
- D. マニフェストの電子署名と、署名した人の証明書である。

**問38** `LinuC3PS-1.0-038` OVF と OVA について、正しいものを**2つ**選べ。

- A. `.ovf` は、VM の構成を書いた XML の記述子である。
- B. OVA は、OVF のファイル一式を 1 つの tar にまとめたものである。
- C. `.cert` は、VM のディスクのイメージである。
- D. `.mf` は、ディスクの暗号化の鍵を入れるファイルである。

**問39** `LinuC3PS-1.0-039` VMware から書き出した OVA を展開したところ、ディスクが `web01-disk1.vmdk` だった。これを KVM で QCOW2 として使いたい。正しいコマンドはどれか。

- A. `qemu-img convert -f qcow2 -O vmdk web01-disk1.vmdk web01.qcow2`
- B. `qemu-img resize web01-disk1.vmdk web01.qcow2`
- C. `qemu-img convert -f vmdk -O qcow2 web01-disk1.vmdk web01.qcow2`
- D. `qemu-img create -f vmdk web01-disk1.vmdk web01.qcow2`

**問40** `LinuC3PS-1.0-040` `web01.ova` を展開せずに、中のファイルの一覧を表示するコマンドを答えよ。

### 1.5 仮想化プラットフォームの利用

**問41** `LinuC3PS-1.0-041` Proxmox VE のホスト pve1(IP アドレス 192.0.2.11)の Web UI に、ブラウザーで接続するときの、標準の URL はどれか。

- A. `https://192.0.2.11:8006`
- B. `http://192.0.2.11:8080`
- C. `https://192.0.2.11:9090`
- D. `http://192.0.2.11:3000`

**問42** `LinuC3PS-1.0-042` Proxmox VE で、1 台目のノード(IP アドレス 192.0.2.11)のクラスタに、2 台目のノードを参加させる。2 台目のノードで実行する pvecm のコマンドを答えよ。

**問43** `LinuC3PS-1.0-043` 2 台の Proxmox VE のノードだけでクラスタを作っている。1 台が停止すると、残った 1 台で、VM の起動などの操作ができなくなった。原因として最も適切なものはどれか。

- A. Web UI の証明書が切れた。
- B. 残ったノードの NIC が壊れた。
- C. VM のディスクが QCOW2 だった。
- D. クラスタの過半数(クォーラム)を保てなくなった。

**問44** `LinuC3PS-1.0-044` Proxmox VE のホストで、物理の NIC `eno1` を `vmbr0` にブリッジしている。ホスト自身の管理用の IP アドレスを `/etc/network/interfaces` に書くとき、付ける先として適切なものはどれか。

- A. `eno1` に付け、`vmbr0` には付けない
- B. VM の仮想 NIC(`net0`)に付ける
- C. `vmbr0` に付け、`eno1` には付けない
- D. `lo` に付ける

**問45** `LinuC3PS-1.0-045` pve1 の VM は、仮想 NIC がブリッジ `vmbr1` につながっている。この VM を pve2 にマイグレーションしようとしたが失敗した。pve2 には `vmbr0` だけがある。原因はどれか。

- A. VM のメモリが 2 GiB より大きい。
- B. pve2 に、VM がつなぐブリッジ `vmbr1` がない。
- C. pve1 が Debian をもとにしている。
- D. VM のディスクが SCSI で付いている。

**問46** `LinuC3PS-1.0-046` pve1 で動いている VM 100 を、止めずに pve2 へ移す。ディスクは、全ノードから見える共有ストレージにある。正しいコマンドはどれか。

- A. `qm migrate 100 pve2 --online`
- B. `qm stop 100` と `qm destroy 100`
- C. `qm clone 100 pve2`
- D. `pvecm add 100 pve2`

**問47** `LinuC3PS-1.0-047` VM 100 のディスクは、各ノードに別々にある `local-lvm` にある。止めずに pve2 へ移したい。正しいコマンドはどれか。

- A. `qm migrate 100 pve2`
- B. `qm migrate 100 pve2 --online --offline`
- C. `qm shutdown 100 --online`
- D. `qm migrate 100 pve2 --online --with-local-disks`

**問48** `LinuC3PS-1.0-048` Proxmox VE で、VM を止めずにバックアップを取りたい。`vzdump` に指定する `--mode` はどれか。

- A. `stop`
- B. `suspend`
- C. `snapshot`
- D. `restore`

**問49** `LinuC3PS-1.0-049` `vzdump` で取ったバックアップのファイルから、新しい VM として戻すコマンド名を答えよ。

**問50** `LinuC3PS-1.0-050` Proxmox VE の 3 ノードのクラスタで、VM 100 を高可用性(HA)の対象にしている。ディスクは共有ストレージにある。VM 100 が動いているノードが、電源の故障で突然止まった。このときの動きとして、正しいものはどれか。

- A. 無停止のライブマイグレーションで、別のノードに移る。
- B. ノードの停止が確認されたあと、別のノードで VM 100 が起動し直される。
- C. VM 100 は、そのノードが戻るまで、ずっと止まったままになる。
- D. VM 100 のバックアップから、自動で新しい VM 番号で作られる。

**問51** `LinuC3PS-1.0-051` Proxmox VE で高可用性(HA)を使うために必要なものを**2つ**選べ。

- A. すべてのノードに、GPU を付けること
- B. VM のディスクを、必ず RAW 形式にすること
- C. 3 台以上のノードのクラスタ(または 2 台と QDevice)
- D. 全ノードから同じディスクが見える共有ストレージ(またはストレージの複製)

## 解答・解説

### 問1 `LinuC3PS-1.0-001`

**正解**: C

KVM は、Linux のカーネルの機能です。CPU の仮想化支援機能を使い、ゲストの命令をほぼ直接 CPU で動かします。`/dev/kvm` を通して QEMU が使います。

- A. QEMU は、VM の部品(CPU、メモリ、ディスクなど)を作るプログラムです。KVM を使うと速くなりますが、カーネルの機能ではありません。
- B. libvirt は、QEMU/KVM を共通の方法で管理する仕組みです。
- D. virtio は、VM とホストの間の、速いデバイスの規格です。

### 問2 `LinuC3PS-1.0-002`

**正解**: B

virtio-blk で付けたディスクは、Linux のゲストでは `/dev/vda`、`/dev/vdb` のように見えます。

- A. `/dev/sda` は、SATA や SCSI(virtio-scsi を含む)のディスクの名前です。
- C. `/dev/hda` は、古い IDE のディスクの名前です。
- D. `/dev/nvme0n1` は、NVMe のディスクの名前です。

### 問3 `LinuC3PS-1.0-003`

**正解**: C

SCHED_RR は、SCHED_FIFO と同じ RT の方針です。違いは、同じ優先度のプロセスの間で、時間を区切って交代することです。

- A. nice 値は、SCHED_OTHER(Fair クラス)の優先度です。RT の方針の交代の動きは変わりません。
- B. SCHED_BATCH は、Fair クラスの方針で、RT ではなくなります。RT のままという条件を満たしません。
- D. SCHED_IDLE も、Fair クラスの最も弱い方針で、RT ではなくなります。RT のままという条件を満たしません。

### 問4 `LinuC3PS-1.0-004`

**正解**: `chrt -p 1234`、`chrt --pid 1234`、`chrt -a -p 1234`、`chrt -v -p 1234`

`chrt -p PID` は、動いているプロセスの、スケジューリングの方針と優先度を表示します。変更するときは、方針のオプション(`-f`、`-r` など)と優先度を足します(例: `chrt -f -p 50 1234`)。

### 問5 `LinuC3PS-1.0-005`

**正解**: B

SCHED_DEADLINE は、runtime(使う時間)、deadline(締め切り)、period(周期)を宣言します。カーネルは、すべての宣言を満たせるかを検査してから受け入れます。時間の単位はナノ秒、優先度は 0 を指定します。runtime ≦ deadline ≦ period にします。

- A. `-f 99` は SCHED_FIFO です。最高の優先度で動きますが、時間の宣言も受け入れの検査もありません。
- C. `-b` は SCHED_BATCH です。対話しない処理向けの Fair クラスの方針です。
- D. `-i` は SCHED_IDLE です。空き時間だけ動くので、期限は守れません。

### 問6 `LinuC3PS-1.0-006`

**正解**: B

Fair クラスの実装は、カーネル 6.5 までが CFS(Completely Fair Scheduler)で、6.6 以降が EEVDF です。Ubuntu 24.04 の 6.8 系は EEVDF です。RHEL 9 系の 5.14 系のカーネルは、CFS です。

- A. CFS は、6.5 までの実装です。RHEL 9 系のカーネルでは今も CFS です。
- C. O(1) スケジューラーは、2.6 系の古い時代の実装で、今は使われていません。
- D. DEADLINE は、別のクラスです。SCHED_OTHER のプロセスは、Fair クラスで動きます。

### 問7 `LinuC3PS-1.0-007`

**正解**: `none`

`none` は、I/O スケジューラーによる並べ替えをしない設定です。NVMe の SSD のように、デバイスの側で十分に速く処理できるものでは、並べ替えの手間を省くために使います。`echo none | sudo tee /sys/block/nvme0n1/queue/scheduler` で変えます(再起動で戻ります)。

### 問8 `LinuC3PS-1.0-008`

**正解**: A

bfq は、プロセスごとに帯域を公平に分けて、応答の良さを重視します。そのぶん処理は重めです。

- B. 説明が bfq のものです。mq-deadline は、単純で軽いスケジューラーです。
- C. 説明が mq-deadline のものです。kyber は、遅延の目標を決めて、要求の量を調整する軽いスケジューラーです。
- D. none は並べ替えをしません。HDD は、並べ替えがあるほうが向きます。

### 問9 `LinuC3PS-1.0-009`

**正解**: D

UEFI の設定の VT-d に加えて、カーネルでも IOMMU を有効にする必要があります。Intel では、`intel_iommu=on`(必要なら `iommu=pt` も)をコマンドラインに足して、再起動します。AMD の CPU では、IOMMU は既定で有効になります(`amd_iommu=on` という値はありません)。無効にするときだけ `amd_iommu=off` を使います。

- A. `kvm_intel` は、KVM の仮想化支援のモジュールです。IOMMU とは別で、外すと VM が動かなくなります。
- B. vfio-pci を blacklist に入れると、パススルーに使えなくなります。
- C. virtio-rng は、乱数を渡す仮想デバイスです。IOMMU とは関係がありません。

### 問10 `LinuC3PS-1.0-010`

**正解**: A、C

- A. 同じ IOMMU グループのデバイスは、安全に分けられる最小の単位です。ブリッジを除くすべてを、ホストのドライバーから外し、vfio-pci につなぐ必要があります。
- B. 渡したデバイスは、その VM が専有します。ホストやほかの VM は同時に使えません。
- C. `lspci -nnk` の `Kernel driver in use` が `vfio-pci` なら、vfio-pci につながっています。
- D. パススルーのデバイスがあると、状態の移動が難しくなり、ライブマイグレーションは難しくなります。

### 問11 `LinuC3PS-1.0-011`

**正解**: D

virtio-scsi は、virtio の SCSI のコントローラーです。ゲストからは `sd` の名前で見え、1 つのコントローラーに多くのディスクをつなげられます。

- A. virtio-blk は、1 つのディスクを 1 つのデバイスとして見せます。ゲストでは `vda` の名前になります。
- B. virtio-net は、ネットワークの仮想 NIC です。
- C. virtio-rng は、ホストの乱数をゲストに渡す仮想デバイスです。メモリの量を増減する virtio-balloon も、virtio の仮想デバイスのひとつですが、ディスクのコントローラーではありません。

### 問12 `LinuC3PS-1.0-012`

**正解**: B

SCHED_IDLE は、Fair クラスの中で最も弱い方針です。nice +19 よりも低い、最も低い優先度で、ほかのプロセスがいると、ほとんど CPU を使えません。

- A. 優先度 1〜99 で押しのけるのは、RT の SCHED_FIFO や SCHED_RR です。
- C. 周期と締め切りを宣言するのは、SCHED_DEADLINE です。
- D. 公平に分け合うのは、既定の SCHED_OTHER(SCHED_NORMAL)です。SCHED_BATCH も Fair クラスですが、対話しない重い処理に向く別の方針です。

### 問13 `LinuC3PS-1.0-013`

**正解**: A

`qemu-img convert -f 入力の形式 -O 出力の形式 入力のファイル 出力のファイル` の形です。RAW を QCOW2 にするので、`-f raw -O qcow2` です。

- B. 形式の指定が逆で、RAW への変換になっています。
- C. `create` は、新しい空のイメージを作るサブコマンドです。変換はしません。
- D. `info` は、イメージの情報を表示するサブコマンドです。変換しません。

### 問14 `LinuC3PS-1.0-014`

**正解**: D

`convert -c` で、QCOW2 を圧縮して書き出します。`-c` で圧縮できるのは、主に出力が QCOW2(ほかに qcow、VMDK の streamOptimized)のときです。

- A. `resize` は、イメージの大きさを変えるサブコマンドで、圧縮はしません。
- B. `create` は、空のイメージを作ります。
- C. `check` は、イメージの整合性を検査します。

### 問15 `LinuC3PS-1.0-015`

**正解**: D

`qemu-img resize ファイル +10G` で、仮想の大きさを 10 GiB 増やします。ゲストの中のパーティションとファイルシステムは、別に広げます。

- A. `create` は、新しいイメージを作る操作で、`+10G` のような増分は指定できません。
- B. `convert` は、形式の変換です。`+10G` を出力のファイル名として扱ってしまいます。
- C. `info` は、情報の表示です。大きさは変わりません。

### 問16 `LinuC3PS-1.0-016`

**正解**: C

`qemu-img resize` で大きくなるのは、ディスクの大きさだけです。ゲストの中で、先にパーティションを広げ、その後に、ファイルシステムを広げます(XFS なら `xfs_growfs`)。

- A. パーティション(`/dev/vda1`)は、広がっていません。ファイルシステムだけを広げようとしても、増えた領域は使えません。
- B. カーネルの入れ替えは、ディスクの大きさとは関係がありません。
- D. ゲストは、パーティションとファイルシステムを自動では広げません。cloud-init などで自動化している環境のみです。

### 問17 `LinuC3PS-1.0-017`

**正解**: `--shrink`

`qemu-img resize --shrink disk.qcow2 15G` と書きます。小さくするときは、データを失う危険があるため、`--shrink` を付けないと拒否されます。先に、ゲストの中でファイルシステムとパーティションを小さくしておきます。

### 問18 `LinuC3PS-1.0-018`

**正解**: A

`-b base.qcow2` で、バッキングファイル(元のイメージ)を指定し、`-F qcow2` でその形式を指定します。作った `vm01.qcow2` には、変更だけが書かれます。

- B. RAW には、バッキングファイルの機能がありません。
- C. `convert` は、元のイメージの全体をコピーして書き出します。量は減りません。
- D. `resize` は、大きさを変える操作です。新しいファイルは作りません。

### 問19 `LinuC3PS-1.0-019`

**正解**: B

NUMA では、CPU と別のノードにあるメモリは、アクセスが遅くなります。CPU を固定したノードと同じノードから、メモリを取るように、`<numatune><memory mode='strict' nodeset='0'/></numatune>` を指定します。

- A. 固定をやめると、CPU が複数のノードに散らばり、ますます遠いメモリを使う可能性があります。
- C. virtio-balloon は、メモリの量を増減するもので、ノードの位置は選べません。
- D. ディスクの形式は、メモリの位置とは関係がありません。

### 問20 `LinuC3PS-1.0-020`

**正解**: D

`<memory>` は最大の量で、動いている間は増やせません。`<currentMemory>` が今の量です。バルーンで増減できるのは、最大の範囲の中だけです。最大を増やすには、`virsh setmaxmem web01 4G --config` を実行して、VM を止めて起動し直します。

- A. virtio-net は、ネットワークのドライバーです。メモリの増減とは関係がありません。
- B. NUMA への対応は、メモリの量の増減の可否とは関係がありません。
- C. `qemu-img resize` は、ディスクの大きさを変えるコマンドです。

### 問21 `LinuC3PS-1.0-021`

**正解**: A

`--live` は今動いている VM に、`--config` は保存された構成(次の起動から)に効きます。両方を付けると、どちらも 4 つになります。CPU ホットプラグは、最大の数(ここでは 4)までの範囲で使えます。

- B. `--maximum --config` は、最大の数を変える指定です。今の数(2)は変わらず、動いている VM にも効きません。
- C. `setmem` は、メモリの量を変えるコマンドです。
- D. `vcpupin` は、仮想 CPU を物理 CPU に固定するコマンドです。数は変わりません。

### 問22 `LinuC3PS-1.0-022`

**正解**: B

KEK(Key Exchange Key)は、db(動かしてよいもの)と dbx(動かしてはいけないもの)を更新する権限を持つ鍵です。

- A. PK は、プラットフォームの持ち主の鍵です。KEK を入れ替える権限を持ちます。この問題は、PK とは別の鍵を聞いています。
- C. MOK は、shim が見る、持ち主が登録する鍵です。UEFI の db とは別です。
- D. shim は、署名された小さなブートローダーで、鍵ではありません。

### 問23 `LinuC3PS-1.0-023`

**正解**: B、D

- A. SeaBIOS は、従来の BIOS のファームウェアです。Secure Boot の仕組みがありません。
- B. Secure Boot には、対応した UEFI のファームウェア(OVMF の secboot 版)が必要です。
- C. virtio-balloon は、メモリの増減の仕組みです。Secure Boot とは関係がありません。
- D. Secure Boot の OVMF は SMM を使うので、マシンの型を `q35` にし、SMM を有効にします。

### 問24 `LinuC3PS-1.0-024`

**正解**: `mokutil --sb-state`

`mokutil --sb-state` は、`SecureBoot enabled` または `SecureBoot disabled` を表示します。

### 問25 `LinuC3PS-1.0-025`

**正解**: C

Secure Boot が有効だと、署名のないモジュールは読み込めません。自分の鍵でモジュールに署名し、その公開鍵を MOK に登録(`mokutil --import`、次の再起動の確認の画面で承認)します。

- A. dbx は、動かしてはいけないものの一覧です。登録すると、さらに読み込めなくなります。
- B. TPM は、鍵の保管と起動の状態の記録の部品です。モジュールの署名の確認とは別です。
- D. virtio-rng は、乱数を渡す仮想デバイスです。署名とは関係がありません。

### 問26 `LinuC3PS-1.0-026`

**正解**: A

QEMU/libvirt では、swtpm が仮想 TPM になります。`<tpm model='tpm-crb'>` に `<backend type='emulator' version='2.0'/>` を書きます。ホストに物理の TPM がなくても使えます。

- B. virtio-balloon は、メモリの増減の仕組みです。TPM の機能はありません。
- C. TPM は、ディスクイメージの形では作りません。
- D. vfio-pci は、実在する PCI デバイスを渡す仕組みです。存在しないデバイスは渡せません。

### 問27 `LinuC3PS-1.0-027`

**正解**: D

仮想 TPM の状態(鍵など)は、ホストの `/var/lib/libvirt/swtpm/<UUID>/` に保存されています。コールドマイグレーションでは、ディスクと構成 XML に加えて、この状態ファイルも移します。移さないと、新しい空の TPM になり、以前の鍵を取り出せません。

- A. UUID の大文字と小文字は、動作に影響しません。
- B. CPU の製造元は、TPM の状態とは関係がありません。
- C. QCOW2 でも、TPM の鍵の取り出しには影響しません。

### 問28 `LinuC3PS-1.0-028`

**正解**: B

PK の秘密鍵を持つ人は、Secure Boot の信頼の元を変えられます。持ち主だけが読める場所(権限 600 など)に置き、VM を動かすホストには置きません。

- A. 全員が読めると、だれでも署名できてしまいます。
- C. 構成 XML は、ホストの管理者や、バックアップに広がります。秘密の値は libvirt の secret に保存します。
- D. 公開されると、鍵が漏れます。リポジトリに秘密鍵を入れてはいけません。

### 問29 `LinuC3PS-1.0-029`

**正解**: C

`virsh destroy` は、VM の電源を強制的に切ります。名前に反して、VM の定義(構成)も、ディスクも消えません。

- A. 定義を消すのは `virsh undefine` です。ディスクは `--remove-all-storage` で消します。
- B. 穏やかな停止を頼むのは `virsh shutdown` です。
- D. 別のホストに移すのは `virsh migrate` です。

### 問30 `LinuC3PS-1.0-030`

**正解**: B

`virsh edit` は、保存されている XML を直し、保存するときに内容を検査して、libvirt に反映します。

- A. `/etc/libvirt/qemu/` の XML を直接直すと、libvirtd が気づかず、元に戻ることがあります。
- C. `virsh destroy` は、電源を切るだけで、定義は消えません。また、直す手順ではありません。
- D. `/var/lib/libvirt/images/` は、ディスクイメージを置く場所です。構成 XML は置きません。

### 問31 `LinuC3PS-1.0-031`

**正解**: `virsh dumpxml web01`、`virsh dumpxml --domain web01`、`virsh -c qemu:///system dumpxml web01`

`virsh dumpxml` は、VM の構成 XML を標準出力に出します。`> web01.xml` で保存し、別のホストで `virsh define web01.xml` すれば、同じ構成の VM を登録できます。`--inactive` を付けると、保存してある構成を表示します。

### 問32 `LinuC3PS-1.0-032`

**正解**: A

内部スナップショットは、QCOW2 の中に保存するので、RAW では使えません。外部スナップショットは、元のディスクを読み取り専用にして、新しい差分のファイルに変更を書くので、RAW でも使えます。`--disk-only` で、ディスクだけのスナップショットを取ります。

- B. 内部スナップショットは、QCOW2 のみです。
- C. `qemu-img resize` は、大きさを変えるコマンドで、スナップショットではありません。
- D. `virsh undefine` は、VM の定義を消します。

### 問33 `LinuC3PS-1.0-033`

**正解**: C

`virsh blockcommit web01 vda --active --pivot` は、動いている最上位の層(差分)を、下の層(ベースディスク)に書き戻し、VM の使うファイルをベースディスクに切り替えます。

- A. `snapshot-revert` は、スナップショットの時点に戻すコマンドです。統合ではありません。
- B. `blockpull` は、反対に、ベースディスクの内容を差分のファイルに取り込み、バッキングファイルへの依存を切ります。
- D. `snapshot-delete` は、block 系のコマンドではなく、スナップショットを消すコマンドです。新しい libvirt では、外部スナップショットの差分を統合できる版もありますが【要確認】、問題は block 系のコマンドを求めています。

### 問34 `LinuC3PS-1.0-034`

**正解**: C

`host-passthrough` は、ホストの CPU の機能をそのままゲストに見せます。ホスト B にその機能がないと、ゲストが動けず、マイグレーションが失敗します。

- A. QEMU の版が同じことは、むしろ望ましい条件です。
- B. 同じ共有ストレージを見ていることは、ライブマイグレーションの条件です。
- D. ブリッジの名前が同じことも、条件です。

### 問35 `LinuC3PS-1.0-035`

**正解**: A

コールドマイグレーションは、VM を止めて、ディスクと構成 XML を移し、移し先で `virsh define` して起動します。

- B. メモリの内容を送り続けるのは、ライブマイグレーションです。
- C. 止めずにディスクだけ移すと、データが壊れます。コールドマイグレーションは、止めてから行います。
- D. `blockcommit` は、スナップショットの差分の統合です。移し先の作業ではありません。

### 問36 `LinuC3PS-1.0-036`

**正解**: D

`--live` で動かしたまま移します。`--copy-storage-all` で、共有ストレージがなくても、ディスクの中身を一緒に送ります。

- A. `--live` がないと、VM を一時停止して移します。また、ディスクは送られません。
- B. `--offline` は、定義だけを移すオプションで、動いている VM は移せません。
- C. `dumpxml` は、構成 XML を表示するだけで、移しません。

### 問37 `LinuC3PS-1.0-037`

**正解**: B

`.mf` は、マニフェストです。各ファイルの SHA-256 などのハッシュ値の一覧で、ダウンロードの失敗や、改ざんを確かめるために使います。

- A. 構成を書いた XML は、`.ovf` です。
- C. ディスクのイメージは、`.vmdk` などです。
- D. 電子署名と署名した人の証明書は、`.cert` です。

### 問38 `LinuC3PS-1.0-038`

**正解**: A、B

- A. `.ovf` は、CPU、メモリ、ディスク、ネットワークなどの構成を書いた XML です。
- B. OVA(Open Virtual Appliance)は、OVF のファイル一式を 1 つの tar にまとめたものです。
- C. `.cert` は、マニフェストの署名と証明書です。ディスクは `.vmdk` などです。
- D. `.mf` は、ハッシュの一覧です。鍵は入っていません。

### 問39 `LinuC3PS-1.0-039`

**正解**: C

`-f vmdk` で入力の形式、`-O qcow2` で出力の形式を指定します。VMDK は、VMware のディスクの形式です。

- A. 入力と出力の形式が逆です。
- B. `resize` は、大きさを変えるサブコマンドです。変換はしません。
- D. `create` は、空のイメージを作ります。変換はしません。

### 問40 `LinuC3PS-1.0-040`

**正解**: `tar -tf web01.ova`、`tar -tvf web01.ova`、`tar tf web01.ova`、`tar tvf web01.ova`、`tar -t -f web01.ova`、`tar --list -f web01.ova`、`tar --list --file=web01.ova`

OVA は tar のファイルなので、`tar -t` で、展開せずに一覧を見られます。`.ovf`、`.vmdk`、`.mf`、`.cert` が入っています。

### 問41 `LinuC3PS-1.0-041`

**正解**: A

Proxmox VE の Web UI は、HTTPS のポート 8006 で、`https://<ホスト>:8006` です。

- B. 8080 は、標準ではありません。
- C. 9090 は、Cockpit などが使うポートです。
- D. 3000 は、Grafana などが使うポートです。

### 問42 `LinuC3PS-1.0-042`

**正解**: `pvecm add 192.0.2.11`

2 台目のノードで、`pvecm add` に、クラスタに入っているノード(1 台目)の IP アドレスを指定します。1 台目では、先に `pvecm create クラスタ名` でクラスタを作ります。参加するノードには、VM がない状態にします。

### 問43 `LinuC3PS-1.0-043`

**正解**: D

クラスタは、過半数のノードが生きている(クォーラム)ときだけ、操作を許します。2 台のうち 1 台が止まると、過半数を保てません。3 台以上にするか、QDevice を足します。

- A. 証明書が切れても、クラスタの操作が止まるわけではありません。
- B. 問題文に、NIC の故障の記述はありません。症状の原因は、クォーラムです。
- C. ディスクの形式は、クラスタの操作とは関係がありません。

### 問44 `LinuC3PS-1.0-044`

**正解**: C

ブリッジを使うときは、IP アドレスを、物理の NIC ではなく、ブリッジ(`vmbr0`)に付けます。物理の NIC は、ブリッジの `bridge-ports` に指定するだけです。

- A. 物理の NIC に付けると、ブリッジの通信と衝突します。
- B. `net0` は、VM の側の NIC です。ホストの IP アドレスは付けません。
- D. `lo` は、ホスト内だけの通信用です。

### 問45 `LinuC3PS-1.0-045`

**正解**: B

VM の仮想 NIC は、ブリッジの名前でつなぎます。移し先に同じ名前のブリッジがないと、失敗します。クラスタでは、ブリッジの名前を全ノードでそろえます。

- A. メモリの大きさは、失敗の原因として挙がっていません。
- C. ホストの OS が Debian をもとにしていることは、マイグレーションの失敗とは関係がありません。
- D. SCSI のディスクでも、マイグレーションはできます。

### 問46 `LinuC3PS-1.0-046`

**正解**: A

`qm migrate VM番号 移し先 --online` で、動かしたまま移します。共有ストレージにディスクがあるので、ディスクは送りません。

- B. 止めて消す操作です。移しません。
- C. `qm clone` は、複製です。移動ではなく、書式も違います。
- D. `pvecm add` は、クラスタにノードを足すコマンドです。

### 問47 `LinuC3PS-1.0-047`

**正解**: D

ディスクが、ノードごとに別々の `local-lvm` にあるときは、`--with-local-disks` を付けて、ディスクも一緒に送ります。

- A. `--online` がないと、止まっている VM を移す指定になります。動いている VM は、止める必要があります。
- B. `qm migrate` に `--offline` というオプションはありません。止まっている VM は、`--online` を付けずに移します。
- C. `qm shutdown` は、ゲストに停止を頼むコマンドで、VM を移しません。`--online` というオプションもありません。

### 問48 `LinuC3PS-1.0-048`

**正解**: C

`--mode snapshot` は、VM を動かしたまま取ります。

- A. `stop` は、VM を止めて取るので、止めずに取る要件を満たしません。
- B. `suspend` は、一時停止して取るので、短い停止があります。
- D. `restore` は、`--mode` の値ではありません。戻すときは `qmrestore` を使います。

### 問49 `LinuC3PS-1.0-049`

**正解**: `qmrestore`

`qmrestore バックアップのファイル 新しい VM 番号` で、`vzdump` のバックアップから VM を戻します。例: `qmrestore /var/lib/vz/dump/vzdump-qemu-100-....vma.zst 101 --storage local-lvm`。Web UI の「バックアップ」の「リストア」でも戻せます。

### 問50 `LinuC3PS-1.0-050`

**正解**: B

HA は、ノードの故障を検知し、故障したノードが完全に止まったこと(フェンシング)を確かめてから、ほかのノードで VM を起動し直します。VM の中は再起動になります。

- A. 故障したノードからは、メモリを取り出せません。ライブマイグレーションはできません。
- C. HA の対象なら、ノードが戻るのを待たずに、ほかのノードで起動します。
- D. バックアップからの自動の作成は、HA の動きではありません。共有ストレージにある同じディスクを使います。

### 問51 `LinuC3PS-1.0-051`

**正解**: C、D

- A. GPU は、HA の条件ではありません。
- B. ディスクの形式は、HA の条件ではありません。
- C. クォーラムを保つために、3 台以上(または 2 台と QDevice)が要ります。
- D. 別のノードで起動するために、全ノードから同じディスクが見える必要があります。
