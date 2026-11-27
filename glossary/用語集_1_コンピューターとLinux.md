# 用語集 コンピューターと Linux

## OS とカーネル

### OS
別名: オペレーティングシステム
要約: コンピューターの資源を管理し、アプリが動く土台になるソフトウェアです。
コンピューターの部品(CPU、メモリ、ディスク)を管理し、アプリが動く土台になるソフトウェアです。Linux、Windows、macOS などがあります。
例: Linux、Windows、macOS
注意: OS はカーネルと、それを使うための道具(シェル、ライブラリ、コマンド)を合わせた全体を指すことが多いです。
関連: カーネル、Linux

### カーネル
要約: ハードウェアとプロセスを直接管理する、OS の中心の部分です。
OS の中心の部分です。プロセス、メモリ、ファイル、ネットワークを管理し、アプリとハードウェアの間を取り持ちます。コンテナは、ホストのカーネルを共有して動きます。
例: `uname -r` で動いているカーネルの版を表示する
注意: カーネルを更新したら、再起動するまで新しい版は使われません。
関連: OS、プロセス、コンテナ

### Linux
試験: LinuC101、LinuC102、Docker、K8s
要約: Linus Torvalds が作ったカーネルと、それを使う OS の総称です。
Linus Torvalds が作ったカーネルと、その上に必要なソフトウェアをまとめた OS です。サーバーやクラウドで広く使われます。
例: `cat /etc/os-release` で配布版と版を確かめる
注意: 厳密には Linux はカーネルの名前で、OS の全体は配布版(ディストリビューション)として配られます。
関連: ディストリビューション、カーネル

### ディストリビューション
別名: ディストロ
要約: Linux のカーネルにコマンドやパッケージ管理を組み合わせて配る形です。
カーネルと、パッケージや設定の道具をまとめて配布する形の Linux です。Red Hat 系(RHEL、AlmaLinux)と Debian 系(Debian、Ubuntu)に大きく分かれ、設定ファイルの場所やコマンドが少し違います。
例: Red Hat 系: RHEL、AlmaLinux、Rocky Linux / Debian 系: Debian、Ubuntu
注意: 系統によって、パッケージ管理(dnf と apt)や設定ファイルの場所が違います。
関連: Linux、パッケージ

### カーネルモジュール
別名: modprobe、lsmod、insmod、rmmod、modinfo、depmod、modules.dep
試験: LinuC101、LinuC201
要約: 必要なときにカーネルに読み込める、ドライバーなどの部品です。
ドライバーなどの機能を、必要なときにカーネルに読み込めるようにした部品です。`modprobe` で依存するものも含めて読み込み、`lsmod` で一覧を見ます。
例: `lsmod`、`modprobe e1000`、`modprobe -r e1000`
注意: `insmod` は依存するモジュールを読み込まないので、普段は `modprobe` を使います。
関連: カーネル

### KVM
別名: kvm-intel、kvm-amd
試験: LinuC101、LinuC201
要約: Linux をハイパーバイザーにするカーネルの機能です。
Linux のカーネルの機能で、Linux をハイパーバイザーにして仮想マシンを動かします。CPU の仮想化支援機能(Intel VT-x、AMD-V)が必要です。
例: `grep -E -c 'vmx|svm' /proc/cpuinfo` が 1 以上なら使える
注意: CPU の仮想化支援機能(VT-x、AMD-V)と、BIOS や UEFI での有効化が必要です。
関連: ハイパーバイザー、仮想マシン

### 仮想マシン
別名: VM
要約: ソフトウェアで作った仮想のコンピューターです。
1 台の物理のコンピューターの上で、ハイパーバイザーを使って動かす、仮想のコンピューターです。それぞれが自分の OS(カーネル)を持ちます。
例: `virsh list --all`、VirtualBox、AWS の EC2
注意: ゲスト OS ごとにカーネルを持つので、コンテナより重い代わりに分離が強いです。
関連: ハイパーバイザー、コンテナ

### ハイパーバイザー
要約: 1 台の物理マシンで複数の仮想マシンを動かすソフトウェアです。
仮想マシンを作って動かすソフトウェアです。KVM、VMware ESXi、Hyper-V などがあります。
例: タイプ 1: KVM、ESXi、Hyper-V / タイプ 2: VirtualBox
注意: ハードウェアの上で直接動くのがタイプ 1、OS の上のアプリとして動くのがタイプ 2 です。
関連: 仮想マシン

### bzImage
別名: vmlinuz
試験: LinuC201
要約: x86 の Linux で標準の、大きなカーネルも入る圧縮されたカーネルのイメージです。
`/boot/vmlinuz-<版>` の実体は、多くの場合 `bzImage` です。圧縮していない本体は `vmlinux` です。
例: `file /boot/vmlinuz-$(uname -r)`
注意: `bz` は bzip2 の意味ではなく、big zImage の略です。
関連: カーネル、initramfs

### DKMS
別名: Dynamic Kernel Module Support
試験: LinuC201
要約: カーネルの外にあるモジュールを、カーネルの更新のたびに自動でビルドし直す仕組みです。
ソースを `/usr/src/<名前>-<版>/` に置き、`dkms.conf` に作り方を書きます。`dkms add`、`build`、`install` で使います。
例: `dkms status`
注意: ビルドに、`kernel-devel` や `linux-headers` のパッケージが必要です。
関連: カーネルモジュール、カーネル

### dracut
別名: mkinitramfs、mkinitrd
試験: LinuC201
要約: initramfs を作る道具です。Red Hat 系は dracut、Debian 系は mkinitramfs を使います。
カーネルの版ごとに、起動に必要なドライバーを入れた initramfs を作ります。
例: `sudo dracut -f`(Red Hat 系)、`sudo update-initramfs -u`(Debian 系)
注意: ストレージのドライバーの設定を変えたら、initramfs を作り直します。
関連: initramfs、カーネルモジュール

### /proc と /sys
別名: procfs、sysfs
試験: LinuC201
要約: カーネルの状態を、ファイルのように見せる仮想のファイルシステムです。
`/proc` はプロセスとカーネルの状態、`/sys`(sysfs)はデバイスとドライバーの情報を見せます。ディスクには保存されていません。
例: `cat /proc/cpuinfo`、`ls /sys/module/`
注意: `/proc/sys/` の値は、`sysctl` でも読み書きできます。
関連: カーネル、sysctl

### dmesg
別名: カーネルリングバッファ
試験: LinuC201
要約: カーネルが出したメッセージ(デバイスの認識やエラー)を表示するコマンドです。
起動のときと動作中のカーネルのメッセージを読みます。`-T` で時刻を読める形にします。
例: `sudo dmesg -T --level=err,warn`
注意: 再起動すると消えます。前回の起動の分は `journalctl -b -1` で見ます。
関連: journald、カーネル

### kdump
別名: kexec、カーネルダンプ
試験: LinuC201
要約: カーネルパニックのときに、メモリの内容を保存する仕組みです。
あらかじめ確保したメモリのダンプ用カーネルに kexec で切り替え、メモリの内容を `vmcore` に保存します。
例: `crashkernel=` のカーネルのオプションで、メモリを確保する
注意: 試験では設定ではなく、仕組みの考え方が問われます。
関連: カーネル

### QEMU
試験: LinuC201
要約: 仮想のハードウェアをまねて、仮想マシンを動かすソフトウェアです。
仮想のディスク、ネットワークカード、画面などをソフトウェアでまねます。KVM と組み合わせると、CPU の命令を物理 CPU の速さで実行できます。ふつうは、VM 1 台につき QEMU のプロセスが 1 つ動きます。
例: `ps aux | grep qemu`、`qemu-img create -f qcow2 disk.qcow2 20G`
注意: KVM は CPU の仮想化を、QEMU は周りのハードウェアを受け持ちます。
関連: KVM、仮想マシン、libvirt

### Xen
試験: LinuC201
要約: ハードウェアの上で直接動く、オープンソースのハイパーバイザーです。
最初に起動する管理用の VM(dom0)から、ほかの VM(domU)を作って管理します。準仮想化の考え方を、早くから取り入れました。
例: `xl list`、`xl create guest.cfg`
注意: Linux のカーネルに組み込まれる KVM とは別の仕組みです。
関連: ハイパーバイザー、準仮想化、KVM

### ハードウェア支援仮想化
別名: VT-x、AMD-V、vmx、svm
試験: LinuC201
要約: CPU に備わった、仮想マシンを速く動かすための機能です。
Intel の CPU では VT-x(フラグは vmx)、AMD の CPU では AMD-V(フラグは svm)と呼びます。KVM を使うには、この機能が必要です。
例: `grep -E -c '(vmx|svm)' /proc/cpuinfo`、`lscpu | grep -i virtualization`
注意: CPU が対応していても、BIOS や UEFI で無効になっていることがあります。
関連: KVM、仮想マシン

### 完全仮想化
試験: LinuC201
要約: ゲスト OS を変えずに、ハードウェアを全部まねて動かす方式です。
ゲスト OS は、仮想環境だと気づかずに動きます。どの OS でも動かせますが、ハードウェアをまねる分、ディスクやネットワークは遅くなりやすいです。
例: IDE のディスク、e1000 のネットワークカードをまねた VM
注意: 準仮想化と反対の考え方で、ゲスト OS を変えない代わりに遅くなりやすいです。
関連: 準仮想化、virtio、QEMU

### 準仮想化
試験: LinuC201
要約: ゲスト OS が仮想環境だと知った上で、ハイパーバイザーと直接やり取りして速くする方式です。
ハードウェアをまねる手間が減るので、速くなります。ゲスト OS に、専用のドライバーが必要です。
例: virtio、Xen の準仮想化ドライバー
注意: ゲスト OS を変える必要があります。Linux は、virtio のドライバーを最初から持っています。
関連: 完全仮想化、virtio、Xen

### virtio
別名: virtio-net、virtio-blk
試験: LinuC201
要約: 仮想マシン専用の、軽いディスクやネットワークカードのドライバーです。
準仮想化の仕組みで、ゲスト OS のドライバーとホスト側が直接やり取りします。ディスクは virtio-blk、ネットワークカードは virtio-net です。
例: `virt-install --disk size=20,bus=virtio --network model=virtio`
注意: Windows のゲストには、virtio-win のドライバーを別に入れます。
関連: 準仮想化、QEMU、KVM

### libvirt
別名: libvirtd
試験: LinuC201
要約: KVM などの仮想マシンを、共通の方法で管理する仕組みです。
管理用のサービス(libvirtd)と、`virsh`、`virt-install`、`virt-manager` などの道具をまとめたものです。VM の定義は XML で、`/etc/libvirt/qemu/` に置かれます。
例: `systemctl enable --now libvirtd`、`virsh -c qemu:///system list --all`
注意: RHEL 9 系では、機能ごとに分かれたデーモン(virtqemud など)が既定です【要確認】。
関連: virsh、virt-install、virt-manager、QEMU

### virsh
試験: LinuC201
要約: libvirt の仮想マシンを、コマンドで操作する道具です。
一覧、起動、停止、一時停止、定義の編集、情報の表示などを行います。VM は「ドメイン」と呼ばれます。
例: `virsh list --all`、`virsh start vm1`、`virsh shutdown vm1`、`virsh destroy vm1`
注意: `virsh destroy` は、VM の電源を強制的に切るだけで、VM は消えません(消すのは `undefine`)。
関連: libvirt、virt-install、仮想マシン

### virt-install
試験: LinuC201
要約: コマンドの引数で、仮想マシンを作る道具です。
名前、メモリ、仮想 CPU の数、ディスク、インストール用の ISO などを引数で指定して、VM を作ります。画面のないサーバーでも使えます。
例: `virt-install --name vm1 --memory 2048 --vcpus 2 --disk size=20 --cdrom ubuntu.iso --os-variant ubuntu24.04`
注意: `--memory` の単位は MiB です。Debian 系では、`virtinst` パッケージに入っています。
関連: virsh、libvirt、virt-manager

### virt-manager
試験: LinuC201
要約: 仮想マシンを、画面で作る、管理する道具です。
libvirt につないで、VM の作成、起動、停止、設定の変更、コンソールの表示を、ウィンドウの操作で行います。
例: `virt-manager`、`virt-manager --connect qemu:///system`
注意: RHEL 9 では、非推奨です(後継は Web 画面の Cockpit)【要確認】。
関連: libvirt、virt-install、virsh

### システムコール
別名: syscall
試験: LinuC3SS
要約: プログラムが、カーネルに仕事を頼むための入口です。
ファイルを開く(`open`)、読む(`read`)、プロセスを作る(`fork`)など、カーネルの機能を使うときに呼びます。種類は 300 以上あります。
例: `strace -c -f ls`、`systemd-analyze syscall-filter`
注意: プログラムが使うのは、ごく一部です。使わないものを seccomp で禁止すると、守りが固くなります。
関連: seccomp、カーネル

### ASLR
別名: アドレス空間配置のランダム化、kernel.randomize_va_space
試験: LinuC3SS
要約: プログラムを実行するたびに、メモリ上の配置をランダムにして、攻撃を難しくする仕組みです。
スタック、共有ライブラリ、ヒープなどの住所を毎回変えます。攻撃者が「この住所にある」と決め打ちしにくくなります。`kernel.randomize_va_space` で設定します。
例: `sysctl kernel.randomize_va_space`(2 が既定。ヒープも含めてランダムにする)
注意: 0 にするとランダム化が止まります。デバッグ以外では 0 にしません。
関連: sysctl

### SysRq
別名: マジック SysRq
試験: LinuC3SS
要約: システムが固まったときに、カーネルに直接命令を送る仕組みです。
`kernel.sysrq` で、許す機能を決めます。値は機能ごとの数を足し合わせたビットマスクです。`/proc/sysrq-trigger` に文字を書いても使えます。
例: `sysctl kernel.sysrq`、`echo s > /proc/sysrq-trigger`(ディスクへの書き出し)
注意: `echo b` は、その場で再起動します。試すときは注意します。
関連: sysctl

### D-Bus
別名: dbus
試験: LinuC101
要約: 同じ機械の中のプログラム同士が、メッセージをやり取りするための仕組みです。
デスクトップや systemd などが、状態の通知や、機能の呼び出しに使います。システム全体で 1 つのバスと、利用者ごとのバスがあります。
例: `busctl list`、`dbus-send`
注意: D-Bus は同じ機械の中だけで使い、ネットワーク越しの通信には使いません。
関連: systemd

### lspci
別名: lsusb
試験: LinuC101、LinuC201
要約: PCI や USB でつながっている機器を、一覧で表示するコマンドです。
`lspci` は、グラフィックスやネットワークのカードなどを表示します。`lsusb` は USB の機器を表示します。機器が認識されているかを確かめるのに使います。
例: `lspci -k`(使っているドライバーも表示)、`lsusb`
注意: 一覧に出ても、ドライバーが読み込まれていなければ、その機器は使えません。
関連: カーネルモジュール、udev

### カーネルのリリース系統
別名: mainline、longterm、longterm カーネル
試験: LinuC201
要約: Linux カーネルの版の種類です。新機能が入る版と、長く修正が続く版があります。
mainline は新しい機能が入る最新の版です。stable は mainline から出る、修正だけを入れる版です。longterm(LTS)は、さらに長い期間、修正が続く版です。
例: カーネルのソースは、公式の配布サイトから `.tar.xz` で配られる
注意: サーバーやディストリビューションは、安定して使い続けられる longterm 系を選ぶことが多いです。
関連: カーネル、ディストリビューション、カーネルのビルド

### カーネルのビルド
別名: .config、make menuconfig、make oldconfig、make mrproper、make modules_install
試験: LinuC201
要約: カーネルのソースから、自分でカーネルを作る手順です。
設定は `.config` に書かれ、`make menuconfig` などの画面で変えます。`make oldconfig` は、前の `.config` を引き継いで、新しい項目だけを聞きます。`make mrproper` は、生成物と `.config` まで消します。その後に `make` と `make modules_install`、`make install` を実行します。
例: `make menuconfig && make -j4 && sudo make modules_install && sudo make install`
注意: `make clean` は生成物を消しますが、`.config` は残します。`make mrproper` は `.config` も消します。
関連: カーネル、カーネルモジュール、カーネルのリリース系統

### make deb-pkg
別名: make rpm-pkg、make binrpm-pkg
試験: LinuC201
要約: カーネルをビルドして、インストール用のパッケージにする方法です。
`make deb-pkg` は `.deb`、`make rpm-pkg` と `make binrpm-pkg` は `.rpm` を作ります。できたパッケージは、パッケージ管理の道具で入れ、削除できます。
例: `make -j4 deb-pkg`
注意: `make install` で直接入れると、パッケージ管理に記録されず、後で削除しにくくなります。
関連: カーネルのビルド、パッケージ、apt

## 起動とサービス

### UEFI
別名: BIOS
試験: LinuC101、LinuC201
要約: 電源を入れて最初に動き、OS の起動を始めるファームウェアです。
電源を入れて最初に動き、ハードウェアを確かめて OS の起動を始めるファームウェアです。BIOS は古い方式です。UEFI では、ブートローダーを ESP(EFI システムパーティション)に置きます。
例: UEFI では ESP(FAT の `/boot/efi`)にブートローダーを置く
注意: UEFI はパーティションの方式に GPT を、古い BIOS は MBR を使うのが普通です。
関連: ブートローダー、パーティション

### ブートローダー
別名: GRUB、GRUB 2
試験: LinuC101、LinuC201
要約: カーネルと initramfs を読み込んで起動するプログラムです。
UEFI や BIOS の次に動き、カーネルと initramfs を読み込んで起動するプログラムです。Linux では GRUB 2 が広く使われます。
例: GRUB の画面で `e` を押すと、起動の引数を一時的に変えられる
注意: GRUB の設定は `/etc/default/grub` を編集し、`grub2-mkconfig` などで作り直します。
関連: UEFI、カーネル

### initramfs
試験: LinuC101
要約: カーネルがルートファイルシステムを開くまでに使う、小さな一時のファイルシステムです。
起動のときにメモリに読み込む小さなファイルシステムです。カーネルが本物のルートファイルシステムをマウントするまでに必要なドライバーや道具が入っています。
例: `/boot/initramfs-$(uname -r).img`
注意: ストレージのドライバーが入っていないと、ルートをマウントできず起動が止まります。
関連: ブートローダー、カーネル

### PID 1
試験: Docker、K8s
要約: カーネルが最初に起動するプロセスで、ほかのすべてのプロセスの祖先です。
最初に起動するプロセスで、ほかのプロセスの親になります。コンテナの中では、CMD や ENTRYPOINT のプロセスが PID 1 になり、これが終わるとコンテナも終わります。
例: `ps -p 1` で `systemd` と表示される
注意: コンテナの中では、アプリが PID 1 になり、シグナルの扱いや子プロセスの後片付けに注意が必要です。
関連: プロセス、シグナル

### systemd
試験: LinuC101、LinuC102、K8s、LinuC201
要約: 今の Linux で PID 1 として動き、サービスと起動を管理する仕組みです。
多くの Linux で使われる、サービス(デーモン)の起動と管理の仕組みです。`systemctl start|stop|status|enable` で操作し、ログは `journalctl` で見ます。kubelet も systemd のサービスとして動きます。
例: `systemctl enable --now sshd`、`systemctl status sshd`、`systemctl daemon-reload`
注意: `enable` は次の起動から自動で起動する設定、`start` は今すぐの起動で、別のものです。
関連: デーモン、journald

### デーモン
要約: 裏で動き続けて、要求を待つプログラムです。
裏で動き続けて、要求を待つプロセスです。名前の最後に d が付くことが多いです(sshd、chronyd、dockerd)。
例: `sshd`、`crond`、`chronyd`(名前の最後の d はデーモンの印)
注意: 今の Linux では、デーモンは systemd のサービスとして起動と停止を管理します。
関連: systemd、プロセス

### journald
別名: systemd-journald
試験: LinuC102、LinuC201
要約: systemd のログを集めて保存する仕組みです。
systemd のログを集めて保存する仕組みです。`journalctl -u サービス名` で、サービスごとのログを見られます。
例: `journalctl -u sshd`、`journalctl -b`、`journalctl -f`
注意: 既定では再起動で消える設定のこともあり、残すには `/var/log/journal` を作るか `Storage=persistent` にします。
関連: systemd、syslog

### syslog
別名: logging trap、logging host
試験: LinuC102、CCNA
要約: ログを種類(facility)と重要度(priority)で振り分けて記録する仕組みです。
ログを送ったり集めたりする、古くからの仕組みと形式です。Linux では rsyslog が使われ、ネットワーク機器のログもサーバーに送れます。ファシリティ(種類)とプライオリティ(重要度)で分けます。
例: `/etc/rsyslog.conf` の `authpriv.* /var/log/secure`
注意: 重要度を指定すると、それ以上の重要度のログがすべて対象になります。
関連: journald、ログローテーション

### ログローテーション
別名: logrotate、logrotate.conf
試験: LinuC102、Docker
要約: ログのファイルを決まった時期に切り替え、古いものを消す仕組みです。
ログのファイルが大きくなりすぎないように、一定の大きさや期間で切り替え、古いものを消す仕組みです。
例: `/etc/logrotate.d/nginx` の `daily`、`rotate 7`、`compress`
注意: `rotate 7` は 7 世代を残す意味で、7 日ごとではありません。
関連: syslog

### cron
別名: crontab、/etc/crontab、/etc/cron.d、/var/spool/cron
試験: LinuC102
要約: 決まった日時にコマンドを繰り返し実行する仕組みです。
決まった日時にコマンドを自動で実行する仕組みです。「分 時 日 月 曜日 コマンド」の形で書きます。
例: `*/10 * * * * /usr/local/bin/backup.sh`(10 分ごと)、`crontab -e`
注意: 日と曜日の両方を指定すると、どちらかに合えば実行されます(AND ではなく OR)。
関連: デーモン

### NTP
別名: Network Time Protocol
試験: LinuC102、CCNA
要約: ネットワークで時刻を合わせるプロトコルです。
ネットワークで時刻を合わせるプロトコルです(UDP 123 番)。時刻がずれると、ログの照合や証明書の確認がうまくいかなくなります。Linux では chronyd がよく使われます。
例: `chronyc sources`、`timedatectl`
注意: 今の配布版では ntpd ではなく chrony が使われます。UDP の 123 番です。
関連: UDP

### タイムゾーン
別名: UTC、JST、tzselect、/etc/localtime
試験: LinuC101、LinuC102
要約: 地域ごとの標準時の設定です。
地域ごとの時刻の決まりです。UTC が世界の基準で、日本(JST)は UTC より 9 時間進んでいます。サーバーのログは UTC で記録することが多いです。
例: `timedatectl set-timezone Asia/Tokyo`、`/etc/localtime`
注意: サーバーは UTC にそろえ、表示のときに変える運用もよくあります。
関連: NTP、ロケール

### ESP
別名: EFI システムパーティション
試験: LinuC201
要約: UEFI が起動のときに読む、ブートローダーを置く専用のパーティションです。
UEFI の PC で、ブートローダーの実行ファイル(`.efi`)を置くパーティションです。ふつう FAT32 で作り、`/boot/efi` にマウントします。
例: `/boot/efi/EFI/ubuntu/grubx64.efi`
注意: ext4 や XFS では作れません(UEFI が読めるのは FAT 系です)。
関連: UEFI、ブートローダー、パーティション

### efibootmgr
試験: LinuC201
要約: UEFI の起動の項目と順番を、Linux から見たり変えたりするコマンドです。
UEFI のブートエントリを、OS が動いたまま操作します。`-v` で一覧、`-o` で BootOrder を変えます。
例: `sudo efibootmgr -v`
注意: BIOS の PC では使えません。
関連: UEFI、ESP

### ターゲット(systemd)
別名: systemd ターゲット、default.target
試験: LinuC201
要約: systemd のユニットをまとめた、起動のゴールとなる状態です。
昔のランレベルにあたります。`multi-user.target`(画面なし)、`graphical.target`(画面あり)、`rescue.target`、`emergency.target` などがあります。
例: `systemctl set-default multi-user.target`
注意: `isolate` は今すぐ移るだけで、既定のターゲットは変えません。
関連: systemd、PID 1

### マスク(systemd)
別名: systemctl mask
試験: LinuC201
要約: ユニットを `/dev/null` へのリンクにして、手動でも依存からも起動できなくすることです。
`systemctl mask` で設定し、`unmask` で戻します。`disable` は自動の起動をやめるだけで、手動の起動はできます。
例: `sudo systemctl mask foo.service`
注意: マスクしたユニットは、`systemctl start` でも起動しません。
関連: systemd、ターゲット(systemd)

### PXE
別名: PXE ブート、ネットワークブート
試験: LinuC3PS
要約: ディスクがない機械を、ネットワークから起動する仕組みです。
NIC のファームウェアが、DHCP で IP アドレスと取ってくるファイルの名前を聞き、TFTP でブートローダーを取ります。そのあと、カーネルとインストーラーが起動します。
例: DHCP の `next-server` と `filename`、dnsmasq で DHCP と TFTP を動かす
注意: BIOS と UEFI で、渡すブートローダーが違います。同じネットワークに、ほかの DHCP サーバーがあると競合します。
関連: DHCP、kickstart、Preseed、Autoinstall

### kickstart
別名: ks.cfg
試験: LinuC3PS
要約: RHEL 系のインストーラーに、質問の答えをあらかじめ渡して、無人でインストールするファイルです。
`%packages`(入れるもの)、`%pre`、`%post`(前後のスクリプト)などを書きます。ブートのパラメーター `inst.ks=URL` で渡します。
例: `inst.ks=http://192.0.2.10/ks.cfg`、`ksvalidator ks.cfg`
注意: `clearpart --all` は、ディスクの中身をすべて消します。パスワードは、ハッシュにします。
関連: PXE、Preseed、Autoinstall

### Preseed
別名: preseed.cfg
試験: LinuC3PS
要約: Debian のインストーラーに、質問の答えをあらかじめ渡して、無人でインストールする仕組みです。
`d-i 質問の名前 型 値` の形で書きます。答えがない質問のところで、インストールは止まります。
例: `d-i partman-auto/method string lvm`、`d-i pkgsel/include string openssh-server`
注意: 質問の名前は、手でインストールしたあとに `debconf-get-selections --installer` で調べられます。
関連: PXE、kickstart、Autoinstall

### Autoinstall
別名: Ubuntu Autoinstall、subiquity
試験: LinuC3PS
要約: Ubuntu Server の、YAML で書く自動インストールの仕組みです。
`user-data` の `autoinstall:` の下に、ネットワーク、ディスク、ユーザー、パッケージなどを書きます。ブートのパラメーターに `autoinstall` を付けると、確認なしで進みます。
例: `autoinstall ds=nocloud-net;s=http://192.0.2.10/`
注意: ディスクを消すので、`autoinstall` のパラメーターがないと、確認で止まります。
関連: cloud-init、PXE、kickstart

### cloud-init
別名: cloud-config、cloud.cfg
試験: LinuC3PS
要約: クラウドや仮想マシンの最初の起動で、ホスト名、ユーザー、パッケージなどを自動で設定する仕組みです。
`user-data`(`#cloud-config` で始まる YAML)、`meta-data`、`network-config` を読みます。`runcmd` は初回の 1 回、`bootcmd` は起動のたびに実行します。
例: `cloud-init status --long`、`cloud-init schema --config-file user-data.yaml`、`cloud-init clean --logs`
注意: YAML の書き方を間違えると、静かに無視されることがあります。`cloud-init schema` で検査します。
関連: YAML、Autoinstall、IaC

### XDG_RUNTIME_DIR
試験: LinuC3SS、Docker
要約: ユーザー専用の実行時のディレクトリ(`/run/user/<UID>`)を指す環境変数です。
ユーザー用の systemd のソケットや、Rootless のコンテナのソケットは、この下にあります。ログイン時に設定されます。
例: `echo $XDG_RUNTIME_DIR`、`export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock`
注意: `su` や `sudo -u` で切り替えると設定されないことがあり、`systemctl --user` が `Failed to connect to bus` で失敗します。
関連: linger、systemd

### linger
別名: loginctl enable-linger
試験: LinuC3SS、Docker
要約: ユーザーがログアウトしても、ユーザー用の systemd を動かし続ける設定です。
`loginctl enable-linger <ユーザー>` で有効にします。ブート時にもユーザー用の systemd が始まり、`systemctl --user` のサービスが、ログインなしで動きます。
例: `sudo loginctl enable-linger alice`、`loginctl show-user alice | grep Linger`
注意: 設定がないと、ログアウトで Rootless のコンテナが止まります。
関連: systemd、XDG_RUNTIME_DIR、rootless モード

### poweroff
別名: halt、reboot
試験: LinuC101
要約: システムを停止したり、再起動したりするコマンドです。
`poweroff` は電源を切り、`reboot` は再起動し、`halt` は OS を停止します。systemd のシステムでは、`systemctl poweroff` などと同じ動作になります。
例: `systemctl poweroff`、`systemctl reboot`
注意: `halt` は機器によっては、OS を止めても電源は切れません。
関連: systemd、グレースフルシャットダウン

### SysV init
別名: SysVinit、chkconfig、/etc/init.d
試験: LinuC102
要約: systemd より前に使われていた、起動とサービスの管理の仕組みです。
`/etc/init.d/` にサービスごとの起動スクリプトを置きます。`chkconfig` は、RHEL 系で起動時に動かすサービスを設定するコマンドでした。
例: `/etc/init.d/sshd restart`、`chkconfig sshd on`
注意: 今の主な Linux は systemd を使いますが、古い教材や環境では SysV init が出てきます。
関連: systemd、デーモン

### xinetd
別名: inetd、スーパーサーバー
試験: LinuC102
要約: ネットワークの要求が来たときだけ、サービスを起動する、スーパーサーバーです。
`inetd` や `xinetd` が、複数のサービスの待ち受けをまとめて行います。要求が来たときに、対応するサービスを起動します。
例: telnet や ftp などを、`xinetd` の設定で必要なときだけ起動する
注意: 使わないサービスを動かさないのがセキュリティの基本なので、`xinetd` の中の不要なサービスは無効にします。
関連: デーモン

### anacron
別名: /etc/anacrontab
試験: LinuC102
要約: 電源が切れていて実行されなかった定期ジョブを、あとで実行するしくみです。
`cron` は、その時刻に電源が入っていないと実行されません。`anacron` は、日、週、月の単位で、実行されなかったジョブを、起動後に実行します。
例: `/etc/anacrontab`、ノート PC の日次ジョブ
注意: `anacron` は日以上の間隔のジョブ用で、分や時間の単位の指定はできません。
関連: cron

### at コマンド
別名: at、atq、atrm、at.allow、at.deny
試験: LinuC102
要約: 指定した時刻に、1 回だけコマンドを実行するコマンドです。
`at` で時刻を指定し、実行するコマンドを入力します。`atq` で待っているジョブを一覧し、`atrm` で取り消します。`at.allow` と `at.deny` で、使える利用者を制限します。
例: `at 23:00`、`atq`、`atrm 3`
注意: 繰り返し実行するには `cron` を使います。`at` は 1 回限りです。
関連: cron、anacron

### cron.allow
別名: cron.deny
試験: LinuC102
要約: `cron` を使える利用者を制限する、設定ファイルです。
`/etc/cron.allow` があれば、そこに書かれた利用者だけが使えます。なければ、`/etc/cron.deny` に書かれた利用者以外が使えます。
例: `/etc/cron.allow` に `alice` と書くと、alice だけが `crontab` を使える
注意: `cron.allow` がある場合は、`cron.deny` は見られません。
関連: cron、at コマンド

### chrony
別名: chronyd、chronyc、chrony.conf
試験: LinuC102
要約: 時刻を合わせる、NTP の実装の 1 つです。
`chronyd` が時刻を合わせ、`chronyc` で状態を確認します。設定は `chrony.conf` に書きます。多くの新しいディストリビューションで、標準で使われます。
例: `chronyc tracking`、`chronyc sources`
注意: `ntpd` と `chronyd` を、同時に動かしてはいけません。
関連: NTP、ntpd

### ntpd
別名: ntpdate、ntpq、ntp.conf
試験: LinuC102
要約: 時刻を合わせる、従来からある NTP の実装です。
`ntpd` が常駐して、時刻を合わせ続けます。設定は `ntp.conf` に書き、`ntpq -p` で、問い合わせ先との状態を確認します。`ntpdate` は、1 回だけ時刻を合わせる古いコマンドです。
例: `ntpq -p`
注意: ずれが小さいときは少しずつ合わせますが、ずれが大きすぎる(既定で 1000 秒を超える)と、`ntpd` は異常とみなして止まります。
関連: NTP、chrony

### pool.ntp.org
試験: LinuC102
要約: 世界中のボランティアの時刻サーバーを、まとめて指す名前です。
この名前に問い合わせると、DNS が、複数の時刻サーバーの中から、いくつかを返します。NTP の設定の `server` や `pool` に書いて使います。
例: `pool 2.pool.ntp.org iburst`
注意: 実在するサーバーを 1 台ずつ指定するのではなく、この名前を使うと負荷が分散されます。
関連: NTP、DNS

### timedatectl
試験: LinuC102
要約: 日時、タイムゾーン、時刻の同期を、systemd で確認や設定をするコマンドです。
現在の時刻とタイムゾーンを表示します。タイムゾーンの変更と、NTP による同期の有効化もできます。
例: `timedatectl`、`timedatectl set-timezone Asia/Tokyo`、`timedatectl set-ntp true`
注意: `timedatectl` が出す `System clock synchronized` が `yes` でも、ハードウェアクロックとは別です。
関連: タイムゾーン、hwclock

### hwclock
別名: ハードウェアクロック、RTC
試験: LinuC102
要約: 本体の電池で動く、ハードウェアの時計を読み書きするコマンドです。
OS が動いていなくても進む時計で、起動時に OS の時計へ写されます。`hwclock --systohc` は OS の時刻をハードウェアへ、`--hctosys` は逆に写します。
例: `hwclock --show`、`hwclock --systohc`
注意: ハードウェアクロックを UTC にするか、地域の時刻にするかで、表示される時刻がずれることがあります。
関連: タイムゾーン、NTP

### date コマンド
別名: date
試験: LinuC102
要約: システムの時刻を表示したり、設定したりするコマンドです。
書式を指定して、日時を文字にできます。時刻の設定には管理者の権限が必要です。
例: `date +%Y-%m-%d`、`date -u`(UTC で表示)
注意: `date` で設定した時刻は、システムの時計だけです。ハードウェアの時計は変わりません。
関連: hwclock、タイムゾーン

### journalctl
試験: LinuC102
要約: journald が集めたログを、読んだり、絞り込んだりするコマンドです。
サービスや時間で絞って、ログを見ます。`-u` でユニット、`-b` で今回の起動、`--since` で時刻、`-f` で追いかけて表示します。
例: `journalctl -u sshd -f`、`journalctl -b -p err`
注意: 既定の設定によっては、再起動するとログが消えます。残すには永続化の設定が必要です。
関連: journald、syslog

### rsyslog
別名: rsyslogd、rsyslog.conf
試験: LinuC102
要約: ログを受け取り、規則に従って、ファイルや別のサーバーに出力する、ログの仕組みです。
プログラムからのログを `/var/log/` のファイルに振り分けます。設定は `rsyslog.conf` に、「ファシリティ.プライオリティ　出力先」の形で書きます。ほかのサーバーに転送もできます。
例: `*.info /var/log/messages`、`auth,authpriv.* /var/log/secure`
注意: ルールの変更を反映するには、`rsyslogd` を再起動します。
関連: syslog、ファシリティ

### ファシリティ
別名: facility
試験: LinuC102
要約: syslog で、ログの出どころを表す分類です。
`auth`、`cron`、`daemon`、`kern`、`mail` などがあります。ログの重要度は、プライオリティ(`debug` から `emerg`)で表します。ルールでは、この 2 つを組み合わせて選びます。
例: `mail.err`(メールシステムの `err` 以上)、`*.info`
注意: 優先度を指定すると、その優先度と、それより重いものが対象になります。
関連: rsyslog、syslog

### logger コマンド
別名: logger、systemd-cat
試験: LinuC102
要約: シェルから、ログを書き込むコマンドです。
`logger` は、syslog にメッセージを送ります。`systemd-cat` は、journald にコマンドの出力を送ります。スクリプトの動きを、ログに残すときに使います。
例: `logger -p user.notice "backup done"`、`systemd-cat echo hello`
注意: `-p` を指定しないと、`user.notice` で記録されます。
関連: rsyslog、journalctl

### /var/log
別名: ログディレクトリ
試験: LinuC102
要約: システムやサービスのログが置かれる、標準のディレクトリです。
`messages` や `syslog`、認証の記録の `secure` や `auth.log` などがあります。中のファイルは、ログローテーションで世代が管理されます。
例: `/var/log/messages`、`/var/log/auth.log`
注意: ディストリビューションで、ファイル名が違います(`messages` は RHEL 系、`syslog` は Debian 系)。
関連: ログローテーション、FHS

### UEFI シェル
試験: LinuC201
要約: UEFI のファームウェアの中で動く、小さなコマンドの環境です。
OS が起動する前に、UEFI の中で使える簡単なシェルです。ESP の中の `.efi` ファイルを手で実行できます。OS が起動しないときの確認に使います。
例: UEFI シェルから ESP の中の `grubx64.efi` を直接実行する
注意: UEFI シェルと、GRUB のシェルは別のものです。
関連: UEFI、ESP、ブートローダー

### grub-mkconfig
別名: grub2-mkconfig、grub-install、grub2-install
試験: LinuC201
要約: GRUB の設定ファイルを作り直すコマンドと、GRUB を入れ直すコマンドです。
`grub-mkconfig` は、`/etc/default/grub` などをもとに、GRUB の設定ファイル(`grub.cfg`)を作ります。`grub-install` は、GRUB のプログラムをディスクや ESP に書き込みます。Red Hat 系では名前が `grub2-` で始まります。
例: `sudo grub-mkconfig -o /boot/grub/grub.cfg`、`sudo grub2-mkconfig -o /boot/grub2/grub.cfg`
注意: `grub.cfg` を直接編集しても、次の `grub-mkconfig` で上書きされます。
関連: ブートローダー、UEFI、ESP

### systemctl
試験: LinuC101、LinuC201
要約: systemd のサービスや状態を操作するコマンドです。
サービス(ユニット)の起動、停止、状態の確認、起動時の自動起動の設定をします。`status` は状態、`list-units` は読み込まれているユニットの一覧、`enable` と `disable` は自動起動の設定です。
例: `systemctl status sshd`、`systemctl list-units --type=service`、`systemctl enable --now chronyd`
注意: `enable` は次回の起動から有効になるだけで、今すぐは起動しません(`--now` を付けると両方します)。
関連: systemd、ターゲット(systemd)、マスク(systemd)

### レスキューモード
別名: rescue.target、emergency.target、emergency モード
試験: LinuC201
要約: 通常の起動ができないときに、管理者の作業用に起動する最小の状態です。
systemd では、`rescue.target` と `emergency.target` がこの役目を持ちます。`rescue.target` は基本的なサービスを起動し、ファイルシステムをマウントして root のシェルを出します。`emergency.target` はさらに少なく、ルートファイルシステムだけを読み取り専用で使います。
例: GRUB の画面で、カーネルの行の末尾に `systemd.unit=rescue.target` を足して起動する
注意: `emergency.target` では、書き込むときに `mount -o remount,rw /` が要ります。
関連: ターゲット(systemd)、systemd、ブートローダー

### user-data
別名: meta-data、network-config
試験: LinuC3PS
要約: cloud-init に渡す、設定の入力のファイルです。
`user-data` に、作るユーザーやパッケージ、実行するコマンドを書きます。`meta-data` にホスト名などのインスタンスの情報を、`network-config` にネットワークの設定を書きます。ローカルで試すときは、この 3 つを ISO にまとめて渡します。
例: ラベルを `cidata` にした ISO に `user-data` と `meta-data` を入れる
注意: `user-data` の先頭に `#cloud-config` を書かないと、設定として読まれません。
関連: cloud-init、kickstart

### runcmd
試験: LinuC3PS
要約: cloud-init が、最初の起動のときに 1 回だけ実行するコマンドを書く場所です。
user-data に、コマンドを並べて書きます。ほかの設定が済んだ後の最後の段階で、root で実行されます。
例: `runcmd:` の下に `- systemctl enable --now nginx` と書く
注意: 起動のたびに実行するのではありません。毎回なら、bootcmd を使います。
関連: cloud-init、bootcmd

### bootcmd
試験: LinuC3PS
要約: cloud-init が、起動のたびに、早い段階で実行するコマンドを書く場所です。
runcmd より前に実行されます。ネットワークや多くのサービスは、まだ使えません。
例: `bootcmd:` の下に `- echo started >> /var/log/boot.txt` と書く
注意: 毎回実行されるので、同じ操作を何度もして問題がないように書きます。
関連: cloud-init、runcmd

### write_files
試験: LinuC3PS
要約: cloud-init が、ファイルを作って内容を書き込む設定です。
パス、内容、権限、持ち主を指定できます。設定ファイルを VM に置くときに使います。
例: `write_files:` の下に `path: /etc/motd`、`content: |` と書く
注意: `write_files` はパッケージを入れるより前に動くので、パッケージが作るユーザーを持ち主にすると失敗することがあります。後で書くには `defer: true` を付けます。
関連: cloud-init、user-data

### cloud-init の設定モジュール
別名: package_update、package_upgrade、disk_setup、fs_setup
試験: LinuC3PS
要約: user-data に書く、ユーザー、パッケージ、ディスクなどの設定の項目です。
`users` と `groups` でユーザーとグループを作ります。`packages` でパッケージを入れ、`package_update` と `package_upgrade` で更新と更新の適用をします。`disk_setup`、`fs_setup`、`mounts` で、パーティション、ファイルシステム、マウントを設定します。
例: `package_update: true` と `packages: [nginx]`
注意: 項目の名前を間違えると、無視されることがあります。`cloud-init schema` で確かめます。
関連: cloud-init、user-data、cloud-init schema

### cloud-init schema
試験: LinuC3PS
要約: user-data の書き方が正しいかを、実行前に検査するコマンドです。
項目の名前や型の間違いを見つけます。VM を作り直す前に、書式の誤りを直せます。
例: `cloud-init schema --config-file user-data.yaml`
注意: 書式が正しくても、中身の意味(パッケージ名の誤りなど)までは検査しません。
関連: cloud-init、user-data

## シェルとコマンド

### シェル
試験: LinuC101、LinuC102
要約: コマンドを読み取って実行する、利用者とカーネルの間のプログラムです。
人が打ったコマンドを読み取って実行するプログラムです。Linux では bash がよく使われます。
例: `echo $SHELL`、bash、zsh
注意: ログインシェルと対話シェルで、読み込む設定ファイルが違います(`~/.bash_profile` と `~/.bashrc`)。
関連: シェルスクリプト、環境変数

### シェルスクリプト
試験: LinuC102
要約: シェルのコマンドを並べて、まとめて実行できるようにしたファイルです。
シェルのコマンドを並べて、ファイルにまとめたものです。決まった作業を自動で繰り返すのに使います。1 行目の `#!/bin/bash` で、使うシェルを指定します。
例: 先頭に `#!/bin/bash`、`chmod +x backup.sh`、`./backup.sh`
注意: 実行には実行の権限に加えて読み取りの権限も必要です。
関連: シェル、終了ステータス

### 環境変数
試験: LinuC101、LinuC102、Docker、K8s
要約: プロセスが子プロセスに引き継ぐ、名前と値の組です。
プログラムに渡される「名前=値」の設定です。`PATH` は、コマンドを探すディレクトリの一覧です。コンテナでは、設定を環境変数で渡すことが多いです。
例: `export PATH=$PATH:/opt/bin`、`env`、`printenv HOME`
注意: `export` しない変数はシェル変数で、子プロセスには引き継がれません。
関連: シェル

### 終了ステータス
別名: 終了コード、戻り値
試験: LinuC102、Docker、K8s
要約: コマンドが終わったときに返す数で、0 が成功です。
プログラムが終わるときに返す数値です。0 は成功、それ以外は失敗を表します。シェルでは `$?` で確かめます。128 を足した値はシグナルで止められたことを表し、137 は SIGKILL です。
例: `echo $?`、`command && echo ok || echo ng`
注意: 128 + シグナル番号(例: 137 は SIGKILL)は、シグナルで終わったことを表します。
関連: シグナル

### 標準出力
別名: stdout
要約: プログラムが結果を書き出す先で、番号は 1 です。
プログラムが結果を書き出す先です。エラーは標準エラー出力(stderr)に書きます。コンテナのログは、この 2 つを集めたものです。
例: 標準入力 0、標準出力 1、標準エラー出力 2
注意: エラーのメッセージは標準エラー出力(2)に出るので、`>` だけではファイルに入りません。
関連: リダイレクト、パイプ

### リダイレクト
試験: LinuC101、LinuC102
要約: 入力や出力の行き先を、ファイルなどに付け替えることです。
コマンドの出力をファイルに書いたり(`>`、`>>`)、ファイルを入力にしたり(`<`)する仕組みです。`2>` はエラー出力の行き先を変えます。
例: `cmd > out.log 2>&1`、`cmd >> out.log`、`cmd 2> /dev/null`、`cmd < in.txt`
注意: `2>&1` は書く順番が大切で、`> out.log 2>&1` の順にします。
関連: 標準出力、パイプ

### パイプ
試験: LinuC101、LinuC102
要約: 前のコマンドの標準出力を、次のコマンドの標準入力につなぐ仕組みです。
`|` で、前のコマンドの出力を、次のコマンドの入力につなぐ仕組みです。`ps aux | grep nginx` は、プロセスの一覧から nginx の行だけを取り出します。
例: `ps aux | grep nginx`、`sort | uniq -c | sort -rn`
注意: パイプで渡るのは標準出力だけです。エラーも渡すには `2>&1 |` と書きます。
関連: リダイレクト、標準出力

### 正規表現
別名: regex、メタ文字、基本正規表現、拡張正規表現
試験: LinuC101、LinuC102
要約: 文字列のパターンを記号で表す書き方です。
文字列のパターンを記号で表す書き方です。`^` は行の先頭、`$` は行の末尾、`.` は任意の 1 文字を表します。grep や sed で使います。
例: `grep -E '^(error|warn)'`、`sed 's/[0-9]\+/N/g'`
注意: 正規表現の `*` は「直前の文字の繰り返し」で、グロブの `*`(任意の文字列)とは違います。
関連: グロブ

### グロブ
別名: ワイルドカード
試験: LinuC101
要約: シェルがファイル名に展開するパターンです。
シェルがファイル名に展開するパターンです。`*` は任意の文字列、`?` は任意の 1 文字を表します。正規表現の記号とは意味が違います。
例: `ls *.log`、`ls file?.txt`、`ls [0-9]*`
注意: `*` は `.` で始まる隠しファイルには一致しません。
関連: 正規表現、シェル

### vi
別名: vim
試験: LinuC101
要約: ほとんどの Linux に入っている、モードを切り替えて使うテキストエディターです。
多くの Linux に最初から入っているテキストエディターです。コマンドモード、挿入モード、`:` で始める ex モードを切り替えて使います。
例: `i` で入力、`Esc` で戻る、`:wq` で保存して終わる、`:q!` で保存せずに終わる
注意: 起動した直後はコマンドモードなので、そのまま文字を打つとコマンドとして解釈されます。
関連: シェル

### ジョブ
試験: LinuC101
要約: シェルから起動したプログラムのまとまりです。
シェルから起動したプログラムのまとまりです。`&` でバックグラウンドで動かし、`jobs` で一覧を見て、`fg` と `bg` で前面と後ろを切り替えます。
例: `sleep 100 &`、`jobs`、`fg %1`、`bg %1`、`Ctrl+Z`
注意: ログアウトすると SIGHUP で終わることがあるので、続けるには `nohup` や `tmux` を使います。
関連: プロセス、シグナル

### bash
別名: Bourne Again Shell
試験: LinuC101、LinuC102
要約: 多くの Linux で標準になっている、シェルの 1 つです。
GNU プロジェクトが作ったシェルです。コマンド履歴、タブ補完、シェルスクリプトの機能がそろっています。ログインすると、まず bash が起動する環境が多いです。
例: `bash`、`bash script.sh`、`echo $BASH_VERSION`
注意: `sh` と `bash` は別物で、`[[ ]]` などの bash の機能は `sh` で動かないことがあります。
関連: シェル、シェルスクリプト

### bash の設定ファイル
別名: ~/.bashrc、~/.bash_profile、~/.bash_login、~/.profile、~/.bash_logout、/etc/profile、/etc/bash.bashrc
試験: LinuC102
要約: bash が起動やログアウトのときに読み込む、設定のファイルです。
ログインシェルは `/etc/profile` と、利用者の `~/.bash_profile`(なければ `~/.bash_login`、`~/.profile`)を読みます。ログインではない対話シェルは `~/.bashrc` を読みます。ログアウト時は `~/.bash_logout` を実行します。
例: `~/.bash_profile` の中に `source ~/.bashrc` と書いて、両方の設定をそろえる
注意: ログインシェルは `~/.bashrc` を自動では読まないので、`~/.bash_profile` から呼び出す必要があります。
関連: シェル、環境変数

### コマンドリスト
別名: &&、||、コマンドの連結
試験: LinuC102
要約: セミコロンや `&&`、`||` で、複数のコマンドを 1 行につなぐ書き方です。
`;` は前のコマンドの結果にかかわらず次を実行します。`&&` は前が成功したときだけ、`||` は前が失敗したときだけ次を実行します。成功か失敗かは、終了ステータスで決まります。
例: `mkdir work && cd work`、`ping -c1 host || echo down`
注意: `a && b || c` は、a が成功して b が失敗したときにも c が実行されます。
関連: 終了ステータス、シェルスクリプト

### コマンド置換
別名: $( )、バッククォート
試験: LinuC102
要約: コマンドの出力を、別のコマンドの引数などに埋め込む書き方です。
`$(コマンド)` と書くと、そのコマンドの標準出力に置き換わります。古い書き方では、バッククォート(`` ` ``)で囲みます。
例: `echo "今日は $(date +%F) です"`
注意: シングルクォートの中では置換されません。ダブルクォートの中では置換されます。
関連: クォート、標準出力

### クォート
別名: 引用符、シングルクォート、ダブルクォート
試験: LinuC101
要約: 特別な意味を持つ文字を、ただの文字として扱うための囲みです。
シングルクォート(`'`)の中では、すべての文字がそのままの文字です。ダブルクォート(`"`)の中では、`$` による変数の展開などは行われます。バックスラッシュ(`\`)は、直後の 1 文字だけを文字として扱います。
例: `echo '$HOME'` は `$HOME` と表示、`echo "$HOME"` はホームのパスを表示
注意: 空白を含むファイル名は、クォートで囲まないと 2 つの引数に分かれます。
関連: 環境変数、グロブ

### シバン
別名: #!、shebang
試験: LinuC102
要約: スクリプトの 1 行目に書き、そのスクリプトを実行するプログラムを指定する記号です。
`#!` に続けてインタプリタのパスを書きます。実行権限を付けたスクリプトを直接実行すると、カーネルがそのインタプリタを起動します。
例: `#!/bin/bash`、`#!/usr/bin/env python3`
注意: `#!` は 1 行目の先頭に書かないと、ただのコメントとして扱われます。
関連: シェルスクリプト

### 位置パラメータ
別名: $#、$@、$*、$0、$1
試験: LinuC102
要約: スクリプトに渡された引数を、番号や記号で取り出すための変数です。
`$1`、`$2` は 1 番目、2 番目の引数です。`$0` はスクリプト自身の名前、`$#` は引数の数、`$@` と `$*` は引数全体を表します。
例: `./backup.sh /home /tmp` の中で、`$1` は `/home`、`$#` は 2
注意: `"$@"` は引数を 1 つずつ分けたまま扱いますが、`"$*"` は 1 つの文字列にまとめます。
関連: シェルスクリプト

### set -x
別名: bash -x、bash -v
試験: LinuC102
要約: スクリプトの実行内容を 1 行ずつ表示して、動きを確かめるデバッグの方法です。
`bash -x script.sh` で、実行する各コマンドを、変数を展開した形で表示します。`bash -v` は、実行前の行をそのまま表示します。スクリプトの中で `set -x` と書いても同じです。
例: `bash -x ./backup.sh`
注意: `-x` は展開後の内容、`-v` は読み込んだままの内容を出す点が違います。
関連: シェルスクリプト

### コマンド履歴
別名: history、~/.bash_history
試験: LinuC101
要約: 過去に打ったコマンドを記録して、呼び出せる bash の機能です。
`history` で一覧を表示します。`!!` で直前のコマンド、`!番号` で番号を指定して再実行します。履歴は、シェルを終了するときに `~/.bash_history` に書き込まれます。
例: `history | grep ssh`、`!!`
注意: 履歴はシェルを終了するまでファイルに書かれないので、強制終了すると残らないことがあります。
関連: bash

### man ページ
別名: man、マニュアル
試験: LinuC101
要約: コマンドや設定ファイルの説明を読める、Linux のオンラインマニュアルです。
`man コマンド名` で開きます。セクション番号があり、1 はコマンド、5 は設定ファイルの書式、8 は管理コマンドです。キーワードで探すには `man -k` を使います。
例: `man 5 passwd`(`/etc/passwd` の書式)、`man -k partition`
注意: 同じ名前が複数のセクションにあるときは、セクション番号を付けないと最初に見つかったものが開きます。

### sed
別名: ストリームエディター
試験: LinuC101
要約: 入力の文字列を、規則に従って置換や削除するコマンドです。
ファイルや標準入力を 1 行ずつ読み、編集して標準出力に出します。置換の `s/元/先/g` がよく使われます。
例: `sed 's/foo/bar/g' file.txt`、`sed -n '3,5p' file.txt`
注意: 既定では元のファイルを書き換えません。書き換えるには `-i` を付けます。
関連: 正規表現、標準出力

### grep
別名: egrep、fgrep
試験: LinuC101
要約: ファイルや入力から、パターンに合う行を探して出すコマンドです。
基本正規表現でパターンを書きます。`egrep`(`grep -E`)は拡張正規表現、`fgrep`(`grep -F`)は正規表現を使わず、文字列をそのまま探します。
例: `grep -rn "error" /var/log/`、`grep -v "^#" file.conf`
注意: `-i` は大文字小文字を区別せず、`-v` は合わない行を出します。
関連: 正規表現、パイプ

### sort コマンド
別名: sort、uniq
試験: LinuC101
要約: 行を並べ替える `sort` と、重なった行をまとめる `uniq` のコマンドです。
`sort` は行を辞書順に並べます。数として並べるには `-n` を使います。`uniq` は、隣り合う同じ行を 1 つにします。`-c` で重なった回数も出ます。
例: `sort access.log | uniq -c | sort -rn`
注意: `uniq` は隣り合う行しか比べないので、先に `sort` で並べます。
関連: パイプ

### cut コマンド
別名: cut、paste
試験: LinuC101
要約: 行から列を取り出す `cut` と、ファイルを横に並べて結合する `paste` のコマンドです。
`cut` は、区切り文字(`-d`)と列の番号(`-f`)で、必要な項目だけを取り出します。`paste` は、複数のファイルの同じ行を、タブでつないで 1 行にします。
例: `cut -d: -f1 /etc/passwd`(ユーザー名の一覧)
注意: `cut` の区切り文字は 1 文字だけで、連続した空白を 1 つの区切りとしては扱えません。
関連: パイプ

### tail コマンド
別名: tail、head
試験: LinuC101
要約: ファイルの末尾を表示する `tail` と、先頭を表示する `head` のコマンドです。
どちらも、何も指定しないと 10 行を表示します。`tail -f` は、ファイルに追記される行を待ち続けて表示します。ログを見張るときに使います。
例: `tail -n 20 /var/log/syslog`、`tail -f /var/log/messages`、`head -n 5 file.txt`
注意: `tail -f` は、ファイルが入れ替わると追えなくなることがあります。そのときは `-F` を使います。
関連: ログ

### wc コマンド
別名: wc
試験: LinuC101
要約: 行数、単語数、バイト数を数えるコマンドです。
`-l` で行数、`-w` で単語数、`-c` でバイト数を表示します。ほかのコマンドの出力をパイプで渡して、件数を数えるのによく使います。
例: `ls | wc -l`、`wc -l /etc/passwd`
注意: `-c` はバイト数で、文字数ではありません(日本語の 1 文字は複数バイトです)。
関連: パイプ

### less
別名: ページャー、more
試験: LinuC101
要約: 長いファイルや出力を、1 画面ずつ見るためのコマンドです。
スペースキーで次のページに進み、`b` で前のページに戻ります。`/` で下向きに検索、`?` で上向きに検索し、`q` で終了します。`more` は古い同類のコマンドで、戻る操作が限られます。
例: `less /var/log/messages`、`ps aux | less`
注意: `less` は `more` より多機能で、前に戻れます。
関連: tail コマンド

### tee
試験: LinuC101
要約: 標準入力を、画面とファイルの両方に出すコマンドです。
パイプの途中に置きます。流れてきたデータを、そのまま次へ流しつつ、ファイルにも書きます。`-a` を付けると追記します。
例: `make 2>&1 | tee build.log`
注意: `-a` を付けないと、既存のファイルは上書きされます。
関連: パイプ、リダイレクト

### xargs
試験: LinuC101
要約: 標準入力から読んだ文字列を、別のコマンドの引数に渡すコマンドです。
パイプでつなげない、引数を取るコマンドに、前のコマンドの出力を渡せます。空白や改行を含む名前は、`find -print0` と `xargs -0` の組み合わせで扱います。
例: `find . -name "*.tmp" | xargs rm`
注意: 名前に空白があると、`-0` を使わない限り、引数が分かれてしまいます。
関連: パイプ、find コマンド

### nano
試験: LinuC101
要約: 初心者でも使いやすい、画面の下に操作が出るテキストエディターです。
画面の下に、`^O` が保存、`^X` が終了のように、操作のキーが表示されます。`^` は Ctrl キーを表します。
例: `nano /etc/hosts`、保存は `Ctrl+O`、終了は `Ctrl+X`
注意: 操作を覚えやすい反面、vi ほどどの環境にもあるとは限りません。
関連: vi、emacs

### emacs
別名: Emacs
試験: LinuC101
要約: 多機能で、拡張しやすいテキストエディターです。
Ctrl キーや Meta キー(Alt キー)を組み合わせて操作します。メールの読み書きなど、編集以外の機能も拡張で使えます。
例: `emacs file.txt`、保存は `Ctrl+X` のあと `Ctrl+S`、終了は `Ctrl+X` のあと `Ctrl+C`
注意: vi のようなモード切り替えはなく、常に文字を入力できる状態です。
関連: vi、nano

### find コマンド
別名: find
試験: LinuC101
要約: 条件に合うファイルを、ディレクトリを辿って探すコマンドです。
名前、種類、更新時刻、大きさ、所有者、権限などを条件にして、ファイルを探します。見つけたファイルに対して、`-exec` で別のコマンドを実行できます。
例: `find /var/log -name "*.log" -mtime +7`、`find / -perm -4000`(SUID が付いたファイル)
注意: `find` はその場でディレクトリを辿るので、`locate` より遅い一方で、最新の状態を探せます。
関連: locate、SUID

### locate
別名: updatedb
試験: LinuC101
要約: あらかじめ作った一覧から、ファイル名を速く探すコマンドです。
`updatedb` が作ったデータベースを検索するので、速く結果が出ます。データベースは、定期的な実行で更新されます。
例: `locate sshd_config`、`sudo updatedb`
注意: データベースを更新するまでは、作ったばかりのファイルが見つかりません。
関連: find コマンド

### which
別名: whereis
試験: LinuC101
要約: コマンドの実体がどこにあるかを調べるコマンドです。
`which` は、`PATH` の中から、実行されるコマンドのパスを表示します。`whereis` は、実行ファイルに加えて、man ページなどの場所も表示します。
例: `which python3`、`whereis ls`
注意: `which` は、シェルの組み込みコマンドやエイリアスを見つけられないことがあります。
関連: 環境変数

### dd コマンド
別名: dd
試験: LinuC101、LinuC201
要約: ブロックの単位で、データをそのまま複写するコマンドです。
`if=` で入力、`of=` で出力を指定します。ディスクの複製や、ファイルの切り出しに使います。
例: `dd if=/dev/zero of=swap.img bs=1M count=512`
注意: `of=` に指定した先を、確認なしで上書きするので、入力と出力を取り違えると、データが消えます。
関連: デバイスファイル

### gzip
別名: gunzip、bzip2、xz
試験: LinuC101、LinuC201
要約: ファイルを圧縮するコマンドの仲間です。
`gzip` は速く、`bzip2` と `xz` は一般に時間がかかる代わりに、小さくなります。圧縮したファイルは、`gunzip` などで元に戻します。複数のファイルは、`tar` でまとめてから圧縮します。
例: `gzip file`(`file.gz` ができる)、`tar czf a.tar.gz dir/`、`xz file`
注意: `gzip` は元のファイルを残さず、`.gz` のファイルに置き換えます。元のファイルも残すには `-k` を付けます。
関連: tar

## プロセスと資源

### プロセス
試験: LinuC101、LinuC102、Docker、K8s
要約: 実行中のプログラムで、それぞれ PID という番号を持ちます。
動いているプログラムのことです。1 つずつ番号(PID)が付きます。`ps` や `top` で一覧を見られます。
例: `ps aux`、`ps -ef`、`top`、`pstree -p`
注意: プロセスは親から生まれ、親の PID は PPID として表示されます。
関連: PID 1、シグナル、デーモン

### シグナル
試験: LinuC101、LinuC102、Docker、K8s
要約: プロセスに送る、短い通知です。
プロセスに送る短い通知です。SIGTERM(15)は「終了してほしい」、SIGKILL(9)は「強制終了」です。SIGKILL は受け取りを拒めません。
例: `kill 1234`(SIGTERM)、`kill -9 1234`(SIGKILL)、`kill -HUP 1234`
注意: SIGKILL と SIGSTOP は、プロセスが無視も後片付けもできません。
関連: プロセス、終了ステータス、グレースフルシャットダウン

### ロードアベレージ
別名: uptime
試験: LinuC101
要約: 実行中か実行を待っているプロセスの数の平均です。
実行中か実行を待っているプロセスの数の平均です。`uptime` や `top` で 1 分、5 分、15 分の値を見ます。CPU のコアの数より大きい状態が続くと、処理が追いついていません。
例: `uptime` の `load average: 0.52, 0.48, 0.40`(1、5、15 分)
注意: CPU の使用率ではありません。コアの数と比べて判断します。
関連: プロセス

### ulimit
別名: limits.conf
試験: LinuC102
要約: 1 つのプロセスやユーザーが使える資源の上限です。
ユーザーやプロセスが使える資源(開けるファイルの数、プロセスの数など)の上限です。実際に効くソフトリミットと、その上限のハードリミットがあります。
例: `ulimit -n`(開けるファイルの数)、`/etc/security/limits.conf`
注意: ソフトリミットは利用者が上げられますが、ハードリミットを超えては上げられません。
関連: プロセス

### sysctl
試験: LinuC102、K8s
要約: 動いているカーネルの設定を見たり変えたりする仕組みです。
動いているカーネルの設定(ネットワークの転送、メモリの扱いなど)を見たり変えたりするコマンドです。`/etc/sysctl.conf` に書くと、再起動の後も残ります。
例: `sysctl net.ipv4.ip_forward`、`/etc/sysctl.d/99-k8s.conf`、`sysctl --system`
注意: `sysctl -w` の変更は再起動で消えるので、残すには設定ファイルに書きます。
関連: カーネル

### スワップ
別名: swap、vm.swappiness、swapon、swapoff、mkswap
試験: LinuC101、LinuC102、K8s、FE、LinuC201
要約: メモリが足りないときに、使っていないメモリの中身をディスクに書き出す領域です。
メモリが足りないときに、ディスクの一部をメモリの代わりに使う仕組みです。とても遅いので、使いすぎると全体が遅くなります。Kubernetes のノードでは、昔は無効にするのが前提でした。
例: `free -h`、`swapon --show`、`mkswap /dev/sdb3`、`swapon /dev/sdb3`
注意: スワップが増えると処理が遅くなります。Kubernetes の kubelet は既定でスワップのあるノードでは起動しません。
関連: カーネル

### sar
別名: sysstat
試験: LinuC201
要約: CPU、メモリ、ディスク、ネットワークの使用状況を、時間を追って記録し、見るコマンドです。
sysstat パッケージに入っています。過去の記録を、あとから見られるのが特徴です。
例: `sar -u 1 3`、`sar -r`、`sar -d`、`sar -n DEV`、`sar -f /var/log/sa/sa24`
注意: 記録を取るには、sysstat の収集を有効にします。記録の場所は、Red Hat 系が `/var/log/sa/`、Debian 系が `/var/log/sysstat/` です。
関連: メトリクス、監視

### OOM Killer
別名: vm.panic_on_oom
試験: LinuC201
要約: メモリが足りなくなったとき、カーネルがプロセスを強制終了する仕組みです。
メモリを多く使っているプロセスを選んで、終了させます。ログに `Out of memory: Killed process` と残ります。
例: `dmesg -T | grep -i "out of memory"`、`journalctl -k | grep -i "killed process"`
注意: 終了させられるプロセスは、いちばん大事なものとは限りません。
関連: OOMKilled、スワップ

### オーバーコミット
別名: メモリのオーバーコミット、vm.overcommit_memory、vm.overcommit_ratio
試験: LinuC3PS
要約: 実際にあるメモリより多くの量の要求を、先に許す、カーネルの動きです。
プログラムは使う量より多めにメモリを要求することが多いので、カーネルは要求をすぐには断りません。許し方は `vm.overcommit_memory` で決めます。足りなくなったときは、OOM Killer が働きます。
例: `sysctl vm.overcommit_memory`、`grep Commit /proc/meminfo`
注意: `vm.overcommit_memory=2` にすると、要求の時点で失敗するようになり、メモリが空いていても失敗することがあります。
関連: sysctl、OOM Killer、スワップ

### ヒュージページ
別名: HugePages、Transparent Huge Pages、vm.nr_hugepages、vm.transparent_hugepage
試験: LinuC3PS
要約: 通常の 4 KB より大きい(x86_64 では 2 MB など)メモリのページです。
大きなメモリを使うプログラムで、ページの管理の負担を減らします。あらかじめ数を予約する方法(`vm.nr_hugepages`)と、カーネルが自動でまとめる方法(Transparent Huge Pages)があります。
例: `grep Huge /proc/meminfo`、`cat /sys/kernel/mm/transparent_hugepage/enabled`
注意: 予約したヒュージページは、使われなくても、ほかの用途に使えません。
関連: sysctl、スワップ

### dirty ページ
別名: ダーティページ、vm.dirty_ratio、vm.dirty_background_ratio、vm.dirty_expire_centisecs、vm.dirty_writeback_centisecs
試験: LinuC3PS
要約: メモリのキャッシュに書かれて、まだディスクに書き出されていないデータです。
ファイルへの書き込みは、いったんメモリに入り、あとでカーネルがまとめて書き出します。書き出しの条件は `vm.dirty_ratio` などで決めます。
例: `grep -E 'Dirty|Writeback' /proc/meminfo`、`sync`
注意: 書き出す前に電源が切れると、dirty ページのデータは失われます。
関連: sysctl

### コアダンプ
別名: core ファイル、kernel.core_pattern
試験: LinuC3PS
要約: プロセスが異常終了したときの、メモリの内容を保存したファイルです。
原因を調べるために、デバッガー(gdb など)で読みます。保存の有無は `ulimit -c`、保存先の名前は `kernel.core_pattern` で決まります。
例: `ulimit -c unlimited`、`coredumpctl list`、`sysctl kernel.core_pattern`
注意: `ulimit -c` が 0 だと、コアダンプは保存されません。
関連: sysctl、ulimit

### スラッシング
試験: FE
要約: ページフォールトが多発して、処理が進まなくなる状態です。
メモリが足りず、メモリとディスクの間でページの出し入れがくり返されます。そのため、本来の処理にほとんど CPU が使われません。
例: 同時に動かすプログラムを増やしすぎて、急に全体が遅くなる
注意: 実メモリを増やすか、同時に動かす数を減らすと、改善します。
関連: スワップ

### プリエンプティブ方式
別名: プリエンプティブ
試験: FE
要約: OS が、強制的に CPU の割り当てを切り替えるスケジューリングの方式です。
タスクの意思にかかわらず、OS が決めた時間や優先度で、CPU を切り替えます。1 つのタスクが CPU を独占しません。
例: 一定の時間が経つと、実行中のタスクを中断して、次のタスクに切り替える
注意: タスクが自分から CPU を手放すまで切り替えないのは、ノンプリエンプティブ方式です。
関連: プロセス

### nohup
試験: LinuC101
要約: ログアウトしても止まらないように、コマンドを実行するコマンドです。
端末を閉じたときに送られるハングアップのシグナル(SIGHUP)を無視して、コマンドを動かし続けます。出力の先を指定しないと、`nohup.out` に書かれます。
例: `nohup ./job.sh &`
注意: `nohup` だけではバックグラウンドで動かないので、`&` を付けて実行します。
関連: シグナル、ジョブ

### 端末多重化
別名: tmux、screen、ターミナルマルチプレクサ
試験: LinuC101
要約: 1 つの端末の中で、複数の画面を使い、接続が切れても作業を残せる道具です。
`tmux` と `screen` が代表です。セッションを作っておくと、SSH の接続が切れても、中のコマンドは動き続けます。あとで再接続して、続きを操作できます。
例: `tmux new -s work`、`tmux attach -t work`、`screen -r`
注意: 端末を閉じるだけではセッションは終わらないので、不要になったら終了します。
関連: ジョブ、SSH

### ps コマンド
別名: ps、pstree、pgrep
試験: LinuC101、LinuC201
要約: 動いているプロセスの一覧を表示するコマンドです。
`ps aux` や `ps -ef` で、全プロセスの所有者、PID、状態を見ます。`pstree` は親子関係を木の形で、`pgrep` は名前で探して PID を表示します。
例: `ps aux | grep nginx`、`pstree -p`、`pgrep sshd`
注意: `ps aux` と `ps -ef` は、同じ情報を出すものの、列の並びが違います。
関連: プロセス、pkill

### top コマンド
別名: top
試験: LinuC101、LinuC201
要約: プロセスの状態を、一定の間隔で更新しながら表示するコマンドです。
画面の上にロードアベレージ、CPU とメモリの使用率が出ます。下にプロセスの一覧があります。`k` でプロセスにシグナルを送り、`q` で `top` を抜けます。
例: `top`、`top -b -n 1`(1 回だけ出力)
注意: 上の `load average` の 3 つの値は、1 分、5 分、15 分の平均です。
関連: ロードアベレージ、ps コマンド

### pkill
別名: killall
試験: LinuC101
要約: プロセスを、名前を指定して終了させるコマンドです。
`kill` は PID を指定します。`pkill` は名前の一部で、`killall` は名前の全体で、一致したプロセスにシグナルを送ります。
例: `pkill -f "python app.py"`、`killall nginx`
注意: 既定のシグナルは SIGTERM です。止まらないときだけ `-9`(SIGKILL)を使います。
関連: シグナル、ps コマンド

### vmstat
試験: LinuC201
要約: メモリ、スワップ、I/O、CPU の状態を、まとめて表示するコマンドです。
一定の間隔で、プロセス、メモリ、スワップ、I/O、CPU の状態を 1 行ずつ表示します。1 つのコマンドで、どこが詰まっているかを大まかに調べられます。
例: `vmstat 1 5`(1 秒おきに 5 回)
注意: 最初の 1 行は、起動してからの平均です。今の状態は 2 行目以降を見ます。
関連: スワップ、I/O 待ち、sar

### free
試験: LinuC201
要約: メモリとスワップの使用量を表示するコマンドです。
合計、使用中、空き、キャッシュなどを表示します。`-h` を付けると、読みやすい単位で出ます。
例: `free -h`
注意: `free` の列だけを見て不足と考えず、`available` の列を見ます。キャッシュは必要なときに解放されるためです。
関連: スワップ、vmstat、OOM Killer

### iostat
試験: LinuC201
要約: ディスクごとの入出力の量と、混み具合を表示するコマンドです。
sysstat に入っています。`-x` を付けると、待ち時間や使用率(`%util`)も出ます。
例: `iostat -x 1`
注意: `iostat` のコマンドは、sysstat のパッケージを入れないと使えません。
関連: sar、vmstat、iotop

### iotop
試験: LinuC201
要約: どのプロセスがディスクの入出力をしているかを表示するコマンドです。
プロセスごとの読み書きの速さを、`top` のように表示します。ディスクが混んでいる原因のプロセスを探すときに使います。
例: `sudo iotop -o`(入出力をしているプロセスだけ)
注意: 実行には root の権限が要ります。
関連: iostat

### I/O 待ち
別名: iowait
試験: LinuC201
要約: CPU が、ディスクなどの入出力が終わるのを待っている時間の割合です。
`top` や `vmstat` の `wa` に出ます。`vmstat` の `bi` はディスクから読んだブロック数、`bo` はディスクへ書いたブロック数です。`wa` と `bi`、`bo` がともに高ければ、ディスクがボトルネックと考えられます。
例: `vmstat 1` で `wa` が高く、`bo` も多い
注意: I/O 待ちは CPU が暇な時間なので、CPU の使用率が低くても、処理が遅いことがあります。
関連: vmstat、iostat

### スケジューリングポリシー
別名: SCHED_OTHER、SCHED_NORMAL、SCHED_BATCH、SCHED_IDLE、SCHED_FIFO、SCHED_RR、SCHED_DEADLINE
試験: LinuC3PS
要約: プロセスに CPU を割り当てる順番と時間の決め方で、Linux には複数の種類があります。
SCHED_OTHER(別名 SCHED_NORMAL)は通常のプロセスの標準で、SCHED_BATCH は対話のないバッチ処理向け、SCHED_IDLE はほかに動かすものがないときだけ動かします。SCHED_FIFO と SCHED_RR はリアルタイム用で、優先度 1〜99 を持ちます。SCHED_DEADLINE は、周期と締め切りを宣言し、締め切りの近いものから動かします。
例: `chrt -p 1234` で、プロセスのポリシーを見る
注意: リアルタイムのポリシーは、止まらないプロセスがあると、ほかのプロセスが動けなくなります。
関連: chrt、プロセス、ケーパビリティ

### chrt
試験: LinuC3PS
要約: プロセスのスケジューリングポリシーと優先度を、見る、変えるコマンドです。
起動するときにポリシーを付けることも、動いているプロセスを変えることもできます。リアルタイムのポリシーにするには、通常は root の権限(CAP_SYS_NICE)が要ります。
例: `chrt -f 50 ./job`、`chrt -p 1234`、`chrt -r -p 10 1234`
注意: `-f` は SCHED_FIFO、`-r` は SCHED_RR、`-b` は SCHED_BATCH、`-i` は SCHED_IDLE です。
関連: スケジューリングポリシー、プロセス

### I/O スケジューラー
別名: mq-deadline、bfq、kyber
試験: LinuC3PS
要約: ディスクへの読み書きの要求を、どの順番で出すかを決めるカーネルの仕組みです。
mq-deadline は、要求に期限を付けて順番を整えます。bfq は、プロセスごとに公平に分けます。kyber は、遅延の目標に合わせて要求の量を調整します。`none` は、並べ替えをしません。速い NVMe 向きです。
例: `cat /sys/block/sda/queue/scheduler`、`echo bfq | sudo tee /sys/block/sda/queue/scheduler`
注意: `/sys` への書き込みは、再起動で元に戻ります。続けるには、udev ルールなどで設定します。
関連: udev、sysctl

### vm.min_free_kbytes
試験: LinuC3PS
要約: カーネルが、空きとして残しておくメモリの量(KB)を決めるパラメーターです。
カーネルは、この値をもとに、メモリの回収を始める目安を決めます。小さすぎると、急なメモリの要求に間に合わないことがあります。大きすぎると、使えるメモリが減ります。
例: `sysctl vm.min_free_kbytes`、`sudo sysctl -w vm.min_free_kbytes=131072`
注意: 大きくしすぎると、アプリケーションが使えるメモリが減り、早く OOM になることがあります。
関連: sysctl、OOM Killer、スワップ

### カーネルの資源の上限
別名: kernel.threads-max、kernel.pid_max、fs.file-max、fs.nr_open、fs.aio-max-nr
試験: LinuC3PS
要約: システム全体で作れるプロセスの数や、開けるファイルの数などの上限を決めるカーネルパラメーターです。
`kernel.pid_max` は PID の最大値、`kernel.threads-max` はスレッドの総数の上限です。`fs.file-max` はシステム全体で開けるファイルの数、`fs.nr_open` は 1 つのプロセスが開ける数の上限、`fs.aio-max-nr` は非同期 I/O の要求の上限です。
例: `sysctl fs.file-max`、`cat /proc/sys/kernel/pid_max`
注意: 1 つのプロセスの上限は、ulimit でも決まります。システム全体の上限だけを上げても足りないことがあります。
関連: sysctl、ulimit

### kernel.panic
試験: LinuC3PS
要約: カーネルパニックの後、何秒で自動的に再起動するかを決めるパラメーターです。
0 のときは、再起動せずに止まります。正の値なら、その秒数のあとに再起動します。無人のサーバーを、自動で復帰させたいときに設定します。
例: `sudo sysctl -w kernel.panic=10`
注意: 再起動を繰り返す場合は、原因を調べないと復旧しません。kdump で情報を残しておきます。
関連: kdump、sysctl、OOM Killer

### libcgroup のコマンド
別名: cgcreate、cgset、cgclassify、cgdelete
試験: LinuC3SS
要約: cgroups のグループを作り、資源の上限を設定し、プロセスを入れるコマンド群です。
`cgcreate` でグループを作り、`cgset` で上限を決めます。`cgclassify` で動いているプロセスをグループへ移し、`cgdelete` で消します。
例: `cgcreate -g memory:/web`、`cgset -r memory.max=512M web`
注意: 再起動すると、作ったグループは消えます。systemd のユニットで設定すれば残ります。
関連: cgroups、systemd

## ユーザーと権限

### root
別名: スーパーユーザー
試験: LinuC101、LinuC102、Docker
要約: すべての操作が許される管理者のユーザーで、UID は 0 です。
何でもできる管理者のユーザーです。UID は 0 です。危険なので、普段は一般ユーザーで作業し、必要なときだけ `sudo` を使います。
例: `sudo -i`、`id -u` が 0
注意: 普段は一般ユーザーで作業し、必要なときだけ sudo を使います。
関連: sudo、パーミッション

### UID
別名: GID、ユーザー ID
試験: LinuC101、LinuC102、Docker
要約: ユーザーを区別する番号です。
ユーザー(UID)とグループ(GID)を表す番号です。ファイルの持ち主は番号で記録されます。root の UID は 0 です。コンテナとホストで番号が合わないと、マウントしたファイルを書けないことがあります。
例: `id sato`、`/etc/passwd` の 3 番目の項目
注意: ファイルの所有者は名前ではなく UID で記録されるので、別のマシンやコンテナでは名前が違って見えることがあります。
関連: root、パーミッション

### sudo
試験: LinuC102
要約: 許可されたユーザーが、ほかのユーザー(普通は root)の権限でコマンドを実行する仕組みです。
一般ユーザーが、許可されたコマンドを root などの権限で実行する仕組みです。許可は `/etc/sudoers` に書き、入力するのは自分のパスワードです。
例: `sudo systemctl restart nginx`、設定は `visudo` で `/etc/sudoers` を編集する
注意: `/etc/sudoers` は直接編集せず、書式を確かめてくれる `visudo` を使います。
関連: root

### パーミッション
別名: アクセス権、chmod、chown、chgrp
試験: LinuC101、LinuC102、Docker
要約: ファイルを誰が読み書き、実行できるかの設定です。
ファイルを誰が読み(r)、書き(w)、実行(x)できるかの設定です。所有者、グループ、その他の 3 つに分けて決めます。`chmod 755` のように数字でも書きます。
例: `chmod 640 file`、`chmod u+x script.sh`、`ls -l` の `-rw-r-----`
注意: ディレクトリの w があると、中のファイルの権限に関係なく、そのファイルを消せます。
関連: root、SUID

### umask
試験: LinuC101、LinuC102
要約: 新しく作るファイルとディレクトリから外す権限の値です。
新しく作るファイルとディレクトリから、外す権限を決める値です。`022` なら、ファイルは 644、ディレクトリは 755 になります。
例: `umask 022` → ファイル 644、ディレクトリ 755
注意: ファイルは最初から実行の権限を付けないので、元の値は 666 です。
関連: パーミッション

### SUID
試験: LinuC101、LinuC102
要約: 実行したユーザーではなく、ファイルの所有者の権限で動くようにする特別な権限です。
実行したユーザーではなく、ファイルの所有者の権限で動く設定です。`passwd` などで使われますが、悪用されると危険なので、監査の対象になります。
例: `/usr/bin/passwd` の `-rwsr-xr-x`、`find / -perm -4000`
注意: SGID(2000)とスティッキービット(1000)もあり、`ls -l` では `s` や `t` で表示されます。
関連: パーミッション、root

### motd
別名: /etc/motd
試験: LinuC201
要約: ログインのときに利用者へ見せる、お知らせのメッセージです。
`/etc/motd` は、ログインに成功した後に表示されます。ログインの前に表示するのは、`/etc/issue`(コンソール)と `/etc/issue.net`(ネットワーク経由)です。
例: `/etc/motd`、`/etc/issue.net`、`Banner /etc/issue.net`(sshd_config)
注意: ssh でログインの前に表示するには、`sshd_config` に `Banner` の設定が要ります。
関連: SSH

### wall
試験: LinuC201
要約: ログインしているすべての利用者に、メッセージを送るコマンドです。
保守の予告などに使います。`shutdown` で時刻を予約すると、同じように全員に予告が出ます。
例: `wall "22:00 から保守のため再起動します"`、`sudo shutdown -h +10 "10 分後に停止します"`
注意: 1 人だけに送るなら `write` です。`wall` は全員に届きます。
関連: motd

### POSIX ACL
別名: ファイル ACL、getfacl、setfacl
試験: LinuC202
要約: ユーザーやグループごとに、ファイルの権限を細かく決める仕組みです。
所有者、グループ、その他の 3 つに加えて、ユーザーやグループごとに、ファイルの権限を決める仕組みです。`setfacl` で設定し、`getfacl` で見ます。
例: `setfacl -m u:bob:rwx /srv/share`、`getfacl /srv/share`、`setfacl -d -m g:staff:rwx dir`
注意: ネットワーク機器の ACL(パケットの許可、拒否)とは別のものです。
関連: Samba

### useradd
別名: userdel、usermod、/etc/default/useradd
試験: LinuC102
要約: ユーザーを追加、削除、変更するコマンドです。
`useradd` は追加、`userdel` は削除、`usermod` は変更です。ホームディレクトリは `-m`、シェルは `-s`、補助グループは `-G` で指定します。既定値は `/etc/default/useradd` にあります。
例: `useradd -m -s /bin/bash alice`、`userdel -r alice`
注意: `usermod -G` は補助グループを置き換えるので、追加するときは `-aG` と書きます。
関連: groupadd、補助グループ

### groupadd
別名: groupdel、groupmod
試験: LinuC102
要約: グループを追加、削除、変更するコマンドです。
`groupadd` は追加、`groupdel` は削除、`groupmod` は名前や GID の変更です。
例: `groupadd developers`、`groupmod -n devs developers`
注意: ユーザーの主グループになっているグループは、`groupdel` で削除できません。
関連: useradd、UID

### passwd コマンド
別名: passwd
試験: LinuC102
要約: パスワードを変更したり、アカウントをロックしたりするコマンドです。
一般の利用者は、自分のパスワードだけ変更できます。root は、他の利用者のパスワードも変更できます。`-l` でロック、`-u` で解除、`-S` で状態を表示します。
例: `passwd alice`、`passwd -l alice`、`passwd -S alice`
注意: `passwd` というコマンドと、`/etc/passwd` というファイルは別物です。
関連: /etc/shadow

### /etc/passwd
別名: /etc/group
試験: LinuC102
要約: ユーザーの情報とグループの情報を書いた、設定ファイルです。
`/etc/passwd` は、1 行に 1 ユーザーで、ユーザー名、UID、GID、ホーム、シェルなどをコロンで区切って書きます。`/etc/group` は、グループ名、GID、所属するユーザーを書きます。
例: `alice:x:1001:1001::/home/alice:/bin/bash`
注意: パスワードのハッシュは `/etc/passwd` には書かれず(`x` が入る)、`/etc/shadow` にあります。
関連: /etc/shadow、UID

### /etc/shadow
別名: シャドウパスワード
試験: LinuC102
要約: パスワードのハッシュと、有効期限を書いた、root だけが読めるファイルです。
パスワードを `/etc/passwd` に置くと、誰でも読めて危険です。そのため、ハッシュは `/etc/shadow` に分けて置き、権限を厳しくしています。
例: `ls -l /etc/shadow`(root だけが読める権限になっている)
注意: ハッシュの先頭が `!` や `*` のアカウントは、パスワードでログインできません。
関連: /etc/passwd、パーミッション

### スケルトンディレクトリ
別名: /etc/skel
試験: LinuC102
要約: 新しいユーザーのホームディレクトリに、複写する、ひな形のディレクトリです。
`useradd -m` で作るホームに、`/etc/skel` の中身が複写されます。全員に配りたい設定ファイルを置いておきます。
例: `/etc/skel/.bashrc`
注意: すでにあるユーザーのホームには、あとから `/etc/skel` を変えても反映されません。
関連: useradd

### 補助グループ
別名: 複数グループへの所属、セカンダリグループ
試験: LinuC102
要約: ユーザーが、主グループのほかに所属するグループです。
ユーザーには、新しく作るファイルのグループになる主グループ(プライマリグループ)が 1 つあります。補助グループはいくつでも持て、権限を広げるのに使います。`id` や `groups` で確かめます。
例: `usermod -aG docker alice`、`id alice`
注意: グループの追加は、ログインし直すまで、実行中のシェルには反映されません。
関連: useradd、パーミッション

### getent
試験: LinuC102
要約: システムが実際に使う設定から、ユーザーや名前の情報を引くコマンドです。
`/etc/passwd` だけでなく、LDAP などを含めた、NSS の設定に従って情報を探します。`getent hosts` で、`/etc/hosts` と DNS を、システムと同じ順で引きます。
例: `getent passwd alice`、`getent hosts www.example.com`
注意: `dig` と違い、`/etc/hosts` に書いた名前も解決できます。
関連: NSS、/etc/hosts

### su コマンド
別名: su
試験: LinuC102
要約: 別のユーザーに切り替えるコマンドです。
ユーザー名を省くと root になります。`su -` は、そのユーザーでログインし直した状態になり、環境変数や作業ディレクトリも引き継ぎません。
例: `su - alice`、`su -`
注意: `-` を付けない `su` は、元の環境変数を引き継ぎます。
関連: sudo、root

### chage
試験: LinuC102
要約: パスワードの有効期限などを、設定や表示するコマンドです。
パスワードの最長の日数、警告の日数、アカウントの失効日を設定します。`-l` で今の設定を見ます。
例: `chage -l alice`、`chage -M 90 alice`
注意: 一般の利用者は、自分の `-l` の確認しかできません。
関連: passwd コマンド、/etc/shadow

### who コマンド
別名: who、last
試験: LinuC102
要約: 今ログインしている利用者や、過去のログインを調べるコマンドです。
`who` と `w` は現在のログインを表示し、`w` は何を実行しているかも出ます。`last` は、過去のログインの履歴を表示します。
例: `who`、`w`、`last -n 10`
注意: `last` は `/var/log/wtmp` を読みます。ログインに失敗した記録は `lastb` で調べます。
関連: auditd

### lsof
別名: fuser
試験: LinuC102、LinuC201
要約: どのプロセスが、どのファイルやポートを開いているかを調べるコマンドです。
`lsof` は、開いているファイルの一覧を表示します。`fuser` は、指定したファイルを使っているプロセスの PID を表示します。アンマウントできない原因を探すときに使います。
例: `lsof -i :80`、`fuser -v /mnt/data`
注意: 他の利用者のプロセスは、root でないと見えません。
関連: プロセス、マウント

### TMOUT
試験: LinuC102
要約: 操作がない時間が続くと、シェルを自動で終了させる、変数です。
秒で指定します。この時間、入力がないと、シェルが終了します。つなぎっぱなしの端末を、防ぐのに使います。
例: `export TMOUT=600`(10 分で自動ログアウト)
注意: 利用者が自分で変更できないようにするには、`readonly TMOUT` と書きます。
関連: 環境変数

### nologin
別名: /etc/nologin、/sbin/nologin
試験: LinuC102
要約: 一般の利用者のログインを止める仕組みと、ログインさせないシェルです。
`/etc/nologin` というファイルがあると、root 以外はログインできず、ファイルの中身が表示されます。`/sbin/nologin` をシェルに指定したアカウントは、対話のログインができません。
例: `useradd -s /sbin/nologin svc`、`touch /etc/nologin`
注意: `/sbin/nologin` は、サービス用のアカウントに、よく設定されます。
関連: useradd、/etc/passwd

### issue ファイル
別名: /etc/issue、/etc/issue.net
試験: LinuC201
要約: ログインの前に表示される、メッセージのファイルです。
`/etc/issue` は、端末でのログインの前に表示されます。`/etc/issue.net` は、ネットワーク経由のログインの前に表示されます。SSH で表示するには、`sshd_config` で `Banner` に指定します。
例: `Banner /etc/issue.net`(sshd_config)
注意: ログイン後に表示される `/etc/motd` とは別のものです。
関連: motd、SSH

### デフォルト ACL
別名: default ACL
試験: LinuC3SS
要約: ディレクトリに設定して、その中に新しく作るファイルへ引き継がせる ACL です。
通常の ACL は、設定したファイルやディレクトリ自体に効きます。デフォルト ACL を付けると、その下に作られるファイルとディレクトリが、同じ ACL を受け継ぎます。
例: `setfacl -d -m u:alice:rwx /srv/shared`、`getfacl /srv/shared`
注意: すでにあるファイルには効きません。既存のファイルには、`-R` で通常の ACL を付けます。
関連: POSIX ACL、ACL マスク

### NFSv4 ACL
試験: LinuC3SS
要約: NFSv4 で使われる、POSIX ACL より細かく設定できるアクセス制御リストです。
許可と拒否の項目(ACE)を並べ、継承の指定などもできます。Windows の ACL に近い考え方です。`nfs4_getfacl` と `nfs4_setfacl` で扱います。
例: `nfs4_getfacl /mnt/nfs/data`
注意: POSIX ACL とは、書き方も機能も違います。ファイルシステムによっては、そのまま使えません。
関連: NFS、POSIX ACL

### ACL と拡張属性の保存
別名: cp -a、tar --acls、tar --xattrs
試験: LinuC3SS
要約: ファイルをコピーやバックアップするとき、ACL と拡張属性も一緒に残す指定です。
`cp -a` は、権限、時刻、拡張属性などをできるだけそのまま残します。`tar` では `--acls` と `--xattrs` を付けます。SELinux のラベルを残すには、`tar` に `--selinux` も付けます。
例: `cp -a /srv/data /backup/`、`tar --acls --xattrs -cpf data.tar /srv/data`
注意: 付けないと、コピーした後で ACL や SELinux のラベルが失われます。
関連: POSIX ACL、拡張属性、tar

## ファイルとディスク

### ファイルシステム
要約: ディスクの中にファイルとディレクトリを整理して保存する仕組みです。
ディスクの中に、ファイルとディレクトリを整理して保存する仕組みです。ext4、XFS などがあります。Linux では、すべてのファイルが `/`(ルートディレクトリ)から始まる 1 本の木の形に並びます。
例: `df -hT` で種類と使用量を見る
注意: 容量に空きがあっても、inode を使い切ると新しいファイルを作れません(`df -i`)。
関連: マウント

### FHS
別名: Filesystem Hierarchy Standard
試験: LinuC101
要約: Linux のディレクトリの役割を決めた標準です。
Linux のディレクトリの役割を決めた標準です。設定は `/etc`、変わるデータは `/var`、プログラムは `/usr` のように決まっています。
例: `/etc` 設定、`/var/log` ログ、`/usr/bin` コマンド、`/home` 利用者のデータ
注意: `/tmp` と `/run` は再起動で消えることがあるので、残したいものは置きません。
関連: ファイルシステム

### inode
試験: LinuC101
要約: ファイルの属性とデータの場所を記録した管理の情報です。
ファイルの所有者、パーミッション、時刻、データの場所を記録した管理の情報です。ファイル名は、ディレクトリの中で名前と inode の番号を結び付けているだけです。`ls -i` で番号を見られます。
例: `ls -i`、`stat file`、`df -i`
注意: ファイル名は inode に入っていません。名前はディレクトリが持っています。
関連: ファイルシステム、シンボリックリンク

### シンボリックリンク
別名: ハードリンク
試験: LinuC101、LinuC102
要約: 別のファイルのパスを指す、特別なファイルです。
ファイルへの別名です。シンボリックリンクはパスを指す小さなファイルで、元を消すと切れます。ハードリンクは同じ中身(inode)に付けたもう 1 つの名前です。
例: `ln -s /opt/app-2.1 /opt/app`、`ls -l` で `app -> /opt/app-2.1`
注意: ハードリンクは同じ inode を指すので元を消しても使えますが、シンボリックリンクはリンク切れになります。
関連: ファイルシステム

### マウント
別名: umount
要約: ファイルシステムを、ディレクトリの木のある場所につなぐことです。
ディスクや共有のストレージを、ディレクトリの木のある場所(マウントポイント)につないで使えるようにすることです。コンテナでは、ボリュームをコンテナの中のパスにマウントします。
例: `mount /dev/sdb1 /mnt/data`、`umount /mnt/data`、`findmnt`
注意: 使っているプロセスがあると外せません。`lsof` や `fuser -m` で探します。
関連: ファイルシステム、ボリューム

### fstab
別名: /etc/fstab
試験: LinuC101
要約: 起動のときに自動でマウントするものを書く設定ファイルです。
起動のときに自動でマウントするファイルシステムを書く設定ファイルです。デバイス、マウントポイント、種類、オプション、dump、fsck の順番の 6 つの欄を書きます。
例: `UUID=3f6e... /data xfs defaults 0 0`
注意: 書き間違えると起動できなくなるので、書いたら `mount -a` で確かめます。
関連: マウント、UUID

### UUID
試験: LinuC101
要約: ファイルシステムを作ったときに付く、変わらない識別子です。
ファイルシステムを作ったときに付く、変わらない識別子です。`/dev/sdb1` のような名前はディスクをつなぐ順番で変わることがあるので、`/etc/fstab` では UUID で指定するのが安全です。
例: `blkid`、`lsblk -f`
注意: `/dev/sdb1` のような名前はディスクをつなぐ順番で変わるので、fstab では UUID を使います。
関連: fstab

### パーティション
別名: MBR、GPT、fdisk、gdisk、parted
試験: LinuC101
要約: 1 台のディスクをいくつかの領域に分けたものです。
1 台のディスクをいくつかの領域に分けたものです。分け方の方式には、古い MBR と、大きなディスクに対応した GPT があります。
例: `fdisk -l`、`gdisk /dev/sdb`、`parted /dev/sdb print`
注意: MBR は基本パーティションが 4 つまでで、2 TiB を超えるディスクには GPT を使います。
関連: ファイルシステム、LVM

### LVM
別名: 論理ボリューム、物理ボリューム、ボリュームグループ、lvextend、lvresize、vgcreate、vgchange、lvchange、lvm.conf
試験: LinuC101、LinuC201
要約: ディスクをまとめて、好きな大きさの領域を切り出す仕組みです。
複数のディスクやパーティション(物理ボリューム)をまとめ(ボリュームグループ)、そこから好きな大きさの領域(論理ボリューム)を切り出す仕組みです。後から大きさを変えられます。
例: `pvcreate` → `vgcreate` → `lvcreate` → `mkfs`、`lvextend -L +5G -r`
注意: 論理ボリュームを広げただけでは、上のファイルシステムは広がりません(`-r` を付けるか後から広げる)。
関連: パーティション

### ジャーナル
試験: LinuC101
要約: ファイルシステムが、書き込みの前に変更の予定を記録しておく仕組みです。
ファイルシステムが、書き込みの前に変更の予定を記録しておく仕組みです。途中で電源が落ちても、短い時間で整合性を取り戻せます。ext4 や XFS が持っています。
例: ext4、XFS はジャーナルを持つ
注意: ジャーナルがあっても、書きかけのデータそのものが守られるとは限りません。バックアップは別に必要です。
関連: ファイルシステム

### ext4
別名: ext3、XFS、Btrfs、btrfs-convert
試験: LinuC101、LinuC201
要約: Linux で使われる主なファイルシステムの種類です。
Linux で使われる主なファイルシステムの名前です。ext4 は広く使われ、XFS は大きな容量に強く RHEL の既定、Btrfs はスナップショットなどの機能を持ちます。
例: `mkfs.ext4 /dev/sdb1`、`mkfs.xfs /dev/sdb2`
注意: XFS は広げられますが、縮められません。
関連: ファイルシステム、ジャーナル

### デバイスファイル
別名: /dev
試験: LinuC101
要約: ハードウェアを、ファイルとして読み書きできるようにしたものです。
ハードウェアを、ファイルとして読み書きできるようにしたものです。`/dev` の下にあり、`/dev/sda` は 1 台目のディスク、`/dev/null` は書いたものを捨てる特別なファイルです。
例: `/dev/sda`、`/dev/nvme0n1p1`、`/dev/null`、`/dev/zero`
注意: `dd` などで出力先のデバイスを間違えると、そのディスクの中身が消えます。
関連: udev

### udev
別名: udevadm
試験: LinuC101、LinuC201
要約: デバイスがつながったときに、デバイスファイルを自動で作る仕組みです。
デバイスがつながったり外れたりしたときに、`/dev` のデバイスファイルを自動で作ったり消したりする仕組みです。
例: `udevadm monitor`、規則は `/etc/udev/rules.d/`
注意: デバイスの名前を固定したいときは、udev の規則でシンボリックリンクを作ります。
関連: デバイスファイル

### mount ユニット
別名: .mount ユニット
試験: LinuC201
要約: fstab の 1 行ごとに systemd が作る、マウントを管理する単位です。
fstab に書いたマウントを、systemd は起動のときに `〜.mount` というユニットに変えて管理します。名前は、マウントポイントの `/` を `-` に変えたものです。
例: `systemctl status data.mount`、`systemd-escape -p --suffix=mount /var/lib/app`
注意: fstab を書き換えたら、`systemctl daemon-reload` で systemd に読み直させます。
関連: fstab、マウント、systemd

### スーパーブロック
別名: superblock
試験: LinuC201
要約: ファイルシステム全体の情報(ブロックの大きさ、空き、UUID など)を持つ場所です。
ファイルシステムの先頭近くにあり、ブロックの大きさ、空きの数、UUID、ラベル、機能の一覧を持ちます。壊れるとマウントできなくなるので、ext4 は予備の写しを持っています。
例: `tune2fs -l /dev/sdb1`、`dumpe2fs -h /dev/sdb1`
注意: 予備の写しがあっても、mkfs を実行すると中身ごと消えます。
関連: ext4、UUID

### Copy-on-Write
別名: CoW、コピーオンライト
試験: LinuC201
要約: 書き換えるとき、元のデータを上書きせずに、別の場所へ書く仕組みです。
Btrfs や LVM のスナップショットが使います。スナップショットを作る時点ではデータをコピーせず、書き換えが起きたときに必要な分だけを書き分けるので、作るのが一瞬で終わります。
例: `btrfs subvolume snapshot /mnt/pool/data /mnt/pool/snap`
注意: 変更が増えると、保存する領域の使用量も増えます。
関連: Btrfs サブボリューム、LVM スナップショット

### Btrfs サブボリューム
別名: subvolume
試験: LinuC201
要約: Btrfs の中にある、ディレクトリのように見える独立した領域です。
別々にマウントしたり、スナップショットを取ったりできます。スナップショットも、サブボリュームの一種です。
例: `btrfs subvolume create /mnt/pool/data`、`btrfs subvolume list /mnt/pool`、`mount -o subvol=data /dev/sdb3 /data`
注意: Btrfs のスナップショットは同じファイルシステムの中にあるので、ディスクが壊れたときの備えにはなりません。
関連: Copy-on-Write、ext4

### LVM スナップショット
別名: lvcreate -s
試験: LinuC201
要約: 論理ボリュームのある時点の姿を、別の論理ボリュームとして見られるようにしたものです。
元の論理ボリュームの変更前のブロックを、作るときに決めた大きさの領域に保存します。バックアップを取る間の固定や、作業前の保険に使います。
例: `lvcreate -s -n snap1 -L 2G /dev/vg01/lv_data`、`lvconvert --merge vg01/snap1`
注意: 保存する領域がいっぱいになると、スナップショットは使えなくなります。
関連: LVM、Copy-on-Write

### 物理エクステント
別名: PE、physical extent
試験: LinuC201
要約: LVM が、ボリュームグループの容量を区切る単位です。
既定は 4 MiB です。論理ボリュームの大きさは、この単位の整数倍になります。
例: `vgdisplay vg01`、`vgcreate -s 8M vg01 /dev/sdb1`
注意: 論理ボリュームの大きさに端数を指定すると、エクステントの単位に丸められます。
関連: LVM

### SMART
別名: S.M.A.R.T.、smartctl、smartd
試験: LinuC201
要約: HDD や SSD が自分の状態を記録する仕組みです。
壊れる前の兆候(悪くなった領域の数、温度、電源を入れていた時間など)を記録します。smartmontools の `smartctl` で手で調べ、`smartd` で常に見張ります。
例: `smartctl -H /dev/sda`、`smartctl -a /dev/sda`、`smartctl -t short /dev/sda`
注意: 「PASSED」でも安心できません。属性の増え方を見ます。SMART は故障を防ぐものではありません。
関連: ファイルシステム

### fsck
別名: e2fsck、xfs_repair
試験: LinuC201
要約: ファイルシステムを調べて、壊れていれば直す道具です。
`fsck` は、種類ごとの `fsck.ext4` などを呼び出します。ext 系は `e2fsck`、XFS は `xfs_repair` を使います。
例: `fsck -f /dev/sdb1`、`e2fsck -f /dev/sdb1`、`xfs_repair -n /dev/sdb2`
注意: マウントしている間は実行しません。XFS の `fsck.xfs` は何もしません。
関連: ファイルシステム、ジャーナル

### スワップファイル
別名: swapfile
試験: LinuC201
要約: ファイルを、スワップの領域として使うものです。
パーティションを作らずに、スワップを増やせます。`mkswap` と `swapon` で使い始め、権限は 600 にします。
例: `fallocate -l 2G /swapfile`、`chmod 600 /swapfile`、`mkswap /swapfile`、`swapon /swapfile`
注意: 穴(未割り当ての範囲)があるファイルはスワップにできません。Btrfs では特別な作り方が要ります。
関連: スワップ、fstab

### tar
別名: アーカイブ、tarball
試験: LinuC201
要約: 複数のファイルやディレクトリを、1 つのファイルにまとめるコマンドです。
まとめたファイルを「アーカイブ」と呼びます。`gzip` や `xz` と組み合わせて圧縮します(`.tar.gz`、`.tar.xz`)。バックアップや、ソースコードの配布に使われます。
例: `tar -czf etc.tar.gz /etc`、`tar -tf etc.tar.gz`、`tar -xf etc.tar.gz -C /tmp`
注意: `tar` 自体は圧縮をしません。圧縮は `-z`(gzip)、`-j`(bzip2)、`-J`(xz)で指定します。
関連: バックアップ、rsync

### rsync
試験: LinuC201
要約: 変わった部分だけを、コピー先と同期するコマンドです。
元とコピー先を比べて、違うところだけを送ります。ssh 越しにも使えます。バックアップや、ファイルの配布に使います。
例: `rsync -av /home/ /backup/home/`、`rsync -av --delete /src/ host:/dst/`、`rsync -avn /src/ /dst/`
注意: パスの末尾の `/` で意味が変わります。`/home/` は中身、`/home` はディレクトリそのものを渡します。
関連: バックアップ、tar、SSH

### 差分バックアップ
試験: LinuC201
要約: 最後のフルバックアップから変わったものを、取る方法です。
フルバックアップの後は、日がたつほど量が増えます。戻すときは、フルバックアップと、最新の差分の 2 つで足ります。
例: 日曜にフル、月曜から土曜は差分(水曜の差分は、日曜からの変更をすべて含む)
注意: 前回との違いだけを取るのは、差分ではなく増分です。
関連: 増分バックアップ、バックアップ

### 増分バックアップ
試験: LinuC201
要約: 前回のバックアップから変わったものだけを、取る方法です。
取る量が少なく、速く終わります。戻すときは、フルバックアップと、その後の増分をすべて、順に使います。
例: 日曜にフル、月曜から土曜は増分(戻すには、日曜のフルと、月曜からの増分を順に重ねる)
注意: 途中の増分が 1 つ欠けると、それ以降を戻せません。
関連: 差分バックアップ、バックアップ

### qcow2
試験: LinuC201
要約: 仮想マシンのディスクイメージの形式のひとつで、必要な分だけ大きくなります。
QEMU の形式で、スナップショットや圧縮が使えます。`raw` の形式は、単純で速い代わりに、最初から全体の大きさを使います。
例: `qemu-img create -f qcow2 disk.qcow2 20G`、`qemu-img info disk.qcow2`
注意: ファイルの大きさは、ゲストから見えるディスクの大きさより小さいことがあります。
関連: QEMU、仮想マシン

### DRBD
試験: LinuC3PS
要約: 2 台のサーバーのディスクを、ネットワーク越しにミラーする、ブロックデバイスの複製の仕組みです。
「ネットワークの RAID 1」とも呼ばれます。Primary が書いたデータを、Secondary に複製します。Primary が故障したら、Secondary を昇格して使い続けます。
例: `drbdadm status r0`、`drbdadm primary r0`
注意: 両方が Primary になる構成(dual-primary)は、OCFS2 や GFS2 などのクラスタファイルシステムと組み合わせるときだけ使います。
関連: レプリケーション、スプリットブレイン、OCFS2

### OCFS2
試験: LinuC3PS
要約: 複数のサーバーが、1 つの共有ディスクを同時にマウントできる、クラスタファイルシステムです。
同時の書き込みを守るため、サーバー間でロックを調整します(DLM)。共有のブロックデバイス(iSCSI など)の上に作ります。
例: `mkfs.ocfs2 -N 4 /dev/sdb1`、`mount -t ocfs2 /dev/sdb1 /mnt/shared`
注意: データを複製する機能はありません。共有ディスクが壊れると、全体が使えません。
関連: DRBD、クラスタ

### Ceph
試験: LinuC3PS
要約: 多数のサーバーのディスクを集めて作る、複製と自己修復を持つ分散ストレージです。
ブロック(RBD)、ファイル(CephFS)、オブジェクト(RGW。S3 互換)の 3 つの使い方を、同じクラスタで提供します。データは RADOS という土台に、オブジェクトとして入ります。
例: `ceph status` で全体の状態を見る
注意: MON は奇数台(3 か 5)にします。過半数が止まると、クラスタの操作が止まります。
関連: OSD、CRUSH、オブジェクトストレージ、レプリケーション

### OSD
別名: Object Storage Daemon
試験: LinuC3PS
要約: Ceph で、データを実際に保存するデーモンです。
ディスク 1 本に 1 つ動きます。データの複製、障害からの回復、再配置も行います。
例: `ceph osd tree` で、ホストごとの OSD と up / down を見る
注意: OSD が一定時間(既定で 10 分)戻らないと out になり、足りない複製が、ほかの OSD に作られます。
関連: Ceph、CRUSH

### CRUSH
試験: LinuC3PS
要約: Ceph で、データの置き場所を、計算で決める仕組みです。
配置グループ(PG)をどの OSD に置くかを、中央の台帳なしで計算します。同じ PG の複製を、別のホストや別のラックに置くなど、障害ドメインの規則も持ちます。
例: 既定の障害ドメインは host。同じ PG の 3 つの複製は、別々のホストの OSD に置かれる
注意: プールごとに、PG の数と複製の数(size)を決めます。複製がホストの数より多いと、置き場所が足りません。
関連: Ceph、OSD

### cephadm
試験: LinuC3PS
要約: コンテナで Ceph のデーモンを動かして、入れて管理するコマンドです。
現行の Ceph の標準の入れ方です。`cephadm bootstrap` で最初のクラスタを作り、`ceph orch` で、ホストやディスクを足します。
例: `cephadm bootstrap --mon-ip 192.0.2.11`
注意: 各ホストに、コンテナのエンジン(Podman か Docker)、LVM2、時刻の同期が要ります。
関連: Ceph、OSD

### Bacula
別名: bconsole
試験: LinuC3PS
要約: 複数のサーバーを、まとめて管理して取る、ネットワーク型のバックアップのシステムです。
Director(指揮者)、File Daemon(取られる側)、Storage Daemon(保存先)、Catalog(記録の DB)でできています。人は `bconsole` で操作します。
例: `bconsole` の `run`、`status client=web01-fd`、`restore`
注意: ポートは、Director が 9101、File Daemon が 9102、Storage Daemon が 9103 です。
関連: バックアップ、増分バックアップ、差分バックアップ

### rclone
別名: rclone sync
試験: LinuC3PS
要約: クラウドのストレージと手元のファイルの間で、コピーや同期をする道具です。
S3、Google Drive などに対応します。`copy` は先のファイルを残し、`sync` は元にないファイルを先から消します。`--bwlimit` で帯域を制限できます。
例: `rclone copy /srv/data s3backup:bucket/data --bwlimit 10M`、`rclone check`
注意: `sync` の前に、`--dry-run` で確かめます。設定ファイルには認証の情報が入るので、Git に入れません。
関連: rsync、バックアップ

### 拡張属性
別名: xattr、extended attributes、getfattr、setfattr
試験: LinuC3SS
要約: ファイルに付けられる、名前と値の組の追加情報です。
ファイルに、権限や時刻とは別の情報を、名前と値の組で付ける仕組みです。ACL、SELinux のラベル、ファイルの Capability も、拡張属性として保存されます。`setfattr` で付け、`getfattr` で見ます。
例: `setfattr -n user.team -v sre report.txt`、`getfattr -d report.txt`
注意: `cp -r` や、`-A` と `-X` のない `rsync` では、黙って落ちます。残すには `cp -a`、`rsync -aAX`、`tar --xattrs` を使います。
関連: POSIX ACL、セキュリティコンテキスト

### ACL マスク
別名: マスクエントリ
試験: LinuC3SS
要約: ACL で、名前付きのユーザーとグループが使える権限の上限です。
名前付きユーザー、名前付きグループ、所有グループの権限は、エントリで許した権限とマスクの両方で許されたものだけが効きます。`getfacl` は、削られた権限の横に `#effective:` と表示します。
例: `setfacl -m m::rw report.txt`、`getfacl report.txt`
注意: ACL があるファイルで `chmod g=r` を実行すると、グループではなくマスクが変わります。
関連: POSIX ACL、拡張属性

### mkfs
別名: mkfs.ext4、mkfs.xfs
試験: LinuC101、LinuC201
要約: パーティションなどに、ファイルシステムを作るコマンドです。
`mkfs -t ext4 /dev/sdb1` のように、種類を指定します。`mkfs.ext4` や `mkfs.xfs` のように、種類ごとのコマンドもあります。
例: `mkfs.ext4 /dev/sdb1`、`mkfs.xfs /dev/sdb1`
注意: 作ると、中のデータは消えます。デバイス名を、必ず確かめます。
関連: ファイルシステム、パーティション

### df コマンド
別名: df、du
試験: LinuC101
要約: ディスクの使用状況を調べる `df` と、ディレクトリの大きさを調べる `du` のコマンドです。
`df` は、ファイルシステムごとの、使用量と空きを表示します。`du` は、ディレクトリの下の、ファイルの合計の大きさを表示します。
例: `df -h`、`du -sh /var/log`
注意: `df` で空きがあっても、`df -i` で inode が足りないと、ファイルが作れません。
関連: inode、ファイルシステム

### VFAT
試験: LinuC101
要約: Windows と共有しやすい、長いファイル名に対応した FAT のファイルシステムです。
Linux では、FAT12、FAT16、FAT32 を、このドライバーで扱います。USB メモリや、UEFI の起動用の領域(ESP)で使われます。Linux のパーミッションや所有者を持たないのが特徴です。
例: `mount -t vfat /dev/sdb1 /mnt/usb`
注意: Linux の権限を扱えないので、マウントのオプションで、見える権限を決めます。
関連: ファイルシステム、ESP

### lsblk
別名: blkid
試験: LinuC201
要約: ブロックデバイスの一覧と、UUID やファイルシステムの種類を調べるコマンドです。
`lsblk` は、ディスクとパーティションの親子関係を、木の形で表示します。`blkid` は、UUID やファイルシステムの種類を表示します。
例: `lsblk -f`、`sudo blkid /dev/sdb1`
注意: `blkid` は、root でないと、最新の情報が出ないことがあります。
関連: UUID、パーティション、fstab

### tune2fs
別名: dumpe2fs
試験: LinuC201
要約: ext 系のファイルシステムの設定を、見たり変えたりするコマンドです。
`tune2fs -l` と `dumpe2fs -h` は、スーパーブロックの内容を表示します。`tune2fs` は、ラベルや UUID、定期チェックの設定などを変えられます。
例: `sudo tune2fs -l /dev/sdb1`、`sudo tune2fs -U random /dev/sdb1`
注意: どちらも ext 系用です。XFS には使えません。
関連: スーパーブロック、ext4、UUID

### dump と restore
試験: LinuC201
要約: ext 系のファイルシステム用の、バックアップと復元のコマンドです。
`dump` はファイルシステム全体を、レベル 0(全体)、レベル 1 以上(前のレベルからの差分)で保存します。`restore` は、保存したものを戻します。
例: `sudo dump -0uf /backup/sdb1.dump /dev/sdb1`、`sudo restore -rf /backup/sdb1.dump`
注意: XFS には使えません。XFS では `xfsdump` を使います。
関連: xfsdump、差分バックアップ、tar

### xfsdump
別名: xfsrestore
試験: LinuC201
要約: XFS 用の、バックアップと復元のコマンドです。
`xfsdump` は XFS を保存し、`xfsrestore` は戻します。`dump` と同じように、レベルを付けて、全体と差分を分けて保存できます。
例: `sudo xfsdump -l 0 -L full -M media0 -f /backup/data.xfsdump /data`
注意: ext 系には使えません。ext 系では `dump` を使います。
関連: dump と restore、ext4、増分バックアップ

### テープデバイス
別名: /dev/st0、/dev/nst0
試験: LinuC201
要約: テープ装置を表すデバイスファイルと、その操作のコマンドです。
`/dev/st0` は、使い終わると自動で巻き戻します。`/dev/nst0` は、巻き戻しません。`mt` コマンドで、巻き戻しや位置の移動、状態の確認をします。
例: `mt -f /dev/nst0 status`、`mt -f /dev/nst0 rewind`
注意: 1 本のテープに複数のバックアップを順に書くときは、巻き戻さない `/dev/nst0` を使います。
関連: デバイスファイル、tar

### Lustre
試験: LinuC3PS
要約: 大規模な計算(HPC)で使われる、並列の分散ファイルシステムです。
1 つのファイルを多数のサーバーに分けて(ストライプして)置きます。多数のクライアントが並行して読み書きでき、非常に高い速度が出ます。メタデータを扱うサーバー(MDS)と、データを持つサーバー(OSS)に分かれます。
例: `mount -t lustre mgs@tcp:/lustre /mnt/lustre`
注意: 小さいファイルを大量に扱う用途には向きません。
関連: Ceph、DRBD、OCFS2、MDS

### CephFS
別名: ceph-fuse、mount -t ceph
試験: LinuC3PS
要約: Ceph の上に作る、POSIX に沿ったファイルシステムです。
メタデータを MDS が扱い、データは Ceph のクラスタに置かれます。複数のクライアントが同じファイルシステムを共有できます。カーネルのクライアントでも、ユーザー空間の `ceph-fuse` でもマウントできます。
例: `mount -t ceph 192.0.2.11:6789:/ /mnt/cephfs -o name=admin`、`ceph-fuse /mnt/cephfs`
注意: MDS が 1 つも動いていないと、CephFS は使えません。
関連: Ceph、MDS、RBD

### RADOS Gateway
別名: RGW、radosgw-admin
試験: LinuC3PS
要約: Ceph の上に、S3 互換と Swift 互換のオブジェクトストレージの口を作るサービスです。
アプリケーションは、HTTP の API で、Ceph にオブジェクトを出し入れできます。`radosgw-admin` コマンドで、ユーザーやアクセスキーを管理します。
例: `radosgw-admin user create --uid=alice --display-name="Alice"`
注意: ブロックの RBD やファイルの CephFS とは別の入口です。同じクラスタを共有します。
関連: Ceph、オブジェクトストレージ、S3

### Ceph のプール
別名: Ceph pool
試験: LinuC3PS
要約: Ceph で、データを入れる論理的な区画です。
プールごとに、複製の数(または誤り訂正の方式)と、置き場所の規則(CRUSH ルール)を決めます。RBD のイメージや CephFS のデータは、プールの中に置かれます。
例: `ceph osd pool create mypool`、`ceph osd lspools`
注意: 複製の数を減らすと、容量は増えますが、OSD の故障に弱くなります。
関連: Ceph、OSD、CRUSH

### MDS
別名: Metadata Server、Ceph MDS
試験: LinuC3PS
要約: ファイルの名前や置き場所などの、メタデータを扱うサーバーです。
Ceph(CephFS)でも Lustre でも、メタデータの専用のサーバーがあります。データそのものは、別のサーバー(Ceph では OSD)が持ちます。
例: `ceph mds stat`、`ceph fs status`
注意: ブロックの RBD だけを使うなら、MDS は要りません。
関連: CephFS、Lustre、OSD

### ceph.conf
別名: /etc/ceph/ceph.conf
試験: LinuC3PS
要約: Ceph のクライアントやサービスが読む、クラスタへの接続情報などの設定ファイルです。
クラスタの識別子(fsid)と、モニターのアドレスなどが書かれています。クライアントのホストにも置きます。
例: `[global]` の `fsid` と `mon_host`
注意: ceph.conf だけではつながりません。認証のための鍵(keyring)も必要です。
関連: Ceph、Ceph の keyring

### Ceph の keyring
別名: keyring、ceph auth
試験: LinuC3PS
要約: Ceph のユーザーの名前と秘密の鍵を入れたファイルです。
クライアントがクラスタへ認証するときに使います。ユーザーの作成と権限の管理は `ceph auth` で行います。
例: `ceph auth get-or-create client.web mon 'allow r' osd 'allow rw pool=mypool'`、`/etc/ceph/ceph.client.admin.keyring`
注意: keyring は秘密の鍵です。権限を絞って置きます。
関連: ceph.conf、Ceph

### ceph コマンド
別名: ceph status、ceph health、ceph df、ceph osd、/var/log/ceph/ceph.log
試験: LinuC3PS
要約: Ceph のクラスタの状態を見たり、設定を変えたりする管理のコマンドです。
`ceph status` で全体の状態、`ceph health detail` で警告の詳細、`ceph df` で容量、`ceph osd tree` で OSD の並びを見ます。クラスタのログは `/var/log/ceph/ceph.log` にあります。
例: `ceph -s`、`ceph health detail`、`ceph df`、`ceph osd tree`
注意: 状態が `HEALTH_WARN` や `HEALTH_ERR` のときは、`ceph health detail` で原因を確かめます。
関連: Ceph、OSD、Ceph のプール

### RBD
別名: RADOS Block Device、rbd map、rbd showmapped
試験: LinuC3PS
要約: Ceph の上に作る、ブロックデバイス(仮想ディスク)です。
プールの中にイメージを作り、VM のディスクや、Linux のブロックデバイスとして使います。`rbd map` で、ホストのデバイス(`/dev/rbd0` など)につなぎます。
例: `rbd create mypool/disk1 --size 10G`、`rbd map mypool/disk1`、`rbd showmapped`
注意: ext4 や XFS のような、共有に対応しないファイルシステムを入れたイメージを、複数のホストで同時にマウントして書くと、壊れます。
関連: Ceph、Ceph のプール、libvirt

### 重複排除
別名: デデュープ
試験: LinuC3PS
要約: 同じ内容のデータを 1 つだけ保存して、容量を減らす方法です。
データを小さな単位に分け、ハッシュ値で同じものを見つけます。2 回目からは、保存済みのデータへの参照だけを記録します。バックアップで、毎回ほとんど同じデータを保存するときに効果があります。
例: restic や BorgBackup は、重複排除をしながらバックアップします。
注意: 元の 1 つのデータが壊れると、それを指す複数のバックアップがすべて使えなくなります。
関連: バックアップ、増分バックアップ

### リストアテスト
別名: 復元の検証
試験: LinuC3PS
要約: バックアップから実際に戻して、使えることを確かめる作業です。
バックアップのファイルがあるだけでは、戻せる保証になりません。別の環境に戻し、データが読めるか、アプリケーションが動くかを確かめます。
例: 別のホストへ復元し、データベースに接続して件数を確かめる
注意: バックアップが成功したという通知と、復元できることは、別の話です。
関連: バックアップ、RPO

## パッケージと配布

### パッケージ
要約: ソフトウェアを、入れやすい形にまとめたものです。
ソフトウェアを、インストールしやすい形にまとめたものです。Red Hat 系は `dnf`、Debian 系は `apt` で入れます。
例: `.rpm`(Red Hat 系)、`.deb`(Debian 系)
注意: パッケージには、必要なほかのパッケージ(依存関係)の情報も入っています。
関連: ディストリビューション

### リポジトリ(パッケージ)
別名: リポジトリ
試験: LinuC101
要約: パッケージを集めて配る場所です。
パッケージを集めて配る場所(サーバー)です。apt や dnf は、設定したリポジトリからパッケージを探して入れます。
例: `/etc/yum.repos.d/*.repo`、`/etc/apt/sources.list`
注意: 署名を確かめる設定(`gpgcheck=1`)を外すと、改ざんされたパッケージを入れる危険があります。
関連: パッケージ、apt

### 依存関係
試験: LinuC101
要約: パッケージが動くのに必要な、ほかのパッケージとの関係です。
あるパッケージが動くのに必要な、ほかのパッケージとの関係です。apt や dnf は依存関係を調べて、必要なものも一緒に入れます。dpkg や rpm は自動では解決しません。
例: `dnf deplist nginx`、`apt-cache depends nginx`
注意: `rpm -i` や `dpkg -i` は依存関係を自動で入れません。
関連: パッケージ

### apt
別名: apt-get、dpkg
試験: LinuC101
要約: Debian 系のパッケージを管理するコマンドです。
Debian 系(Debian、Ubuntu)のパッケージを管理するコマンドです。apt はリポジトリから依存関係も含めて入れ、dpkg は手元の .deb のファイルを 1 つずつ扱います。
例: `apt update`、`apt install nginx`、`apt purge nginx`、`dpkg -L nginx`
注意: `apt update` は一覧を新しくするだけで、パッケージは更新しません。更新は `apt upgrade` です。
関連: パッケージ、依存関係

### dnf
別名: yum、rpm
試験: LinuC101
要約: Red Hat 系のパッケージを管理するコマンドです(yum の後継)。
Red Hat 系(RHEL、AlmaLinux)のパッケージを管理するコマンドです。dnf は yum の後継で、リポジトリから依存関係も含めて入れます。rpm は手元の .rpm のファイルを 1 つずつ扱います。
例: `dnf install nginx`、`dnf provides */ifconfig`、`rpm -qf /usr/sbin/nginx`
注意: `yum` のコマンドは dnf の別名として残っていて、同じように使えます。
関連: パッケージ、依存関係

### オープンソース
別名: OSS
試験: LinuC102、FE
要約: ソースコードを公開し、利用、改変、再配布を認めるソフトウェアです。
ソースコードが公開され、決められたライセンスの条件で、誰でも使い、改変し、配布できるソフトウェアです。Linux、Kubernetes、Terraform の多くの部分などがあります。
例: Linux、Kubernetes、Terraform(BSL に変更された点に注意)
注意: 無料かどうかではなく、ライセンスの条件で決まります。
関連: ライセンス

### ライセンス
試験: LinuC102、Terraform、FE
要約: ソフトウェアを使う、変える、配るときの条件です。
ソフトウェアを使う条件を決めた約束です。GPL のように派生物にも同じ条件を求めるもの(コピーレフト)と、MIT や Apache のように制約が少ないもの(寛容型)があります。
例: GPL(改変したものも同じ条件で公開)、MIT、Apache 2.0(制限が少ない)
注意: GPL のコードを組み込んで配るときは、ソースコードの公開が必要になることがあります。
関連: オープンソース

### apt-cache
別名: apt-file
試験: LinuC101
要約: Debian 系で、パッケージの情報を、探したり確かめたりするコマンドです。
`apt-cache` は、取得済みの一覧から、パッケージを探して情報を出します。`apt-file` は、ファイルのパスから、それを含むパッケージを探します。
例: `apt-cache search nginx`、`apt-cache show nginx`、`apt-file search bin/dig`
注意: `apt-file` は、使う前に `apt-file update` で情報を取得する必要があります。
関連: apt、パッケージ

### sources.list
別名: /etc/apt/sources.list
試験: LinuC101
要約: Debian 系で、パッケージを取得する元のリポジトリを書く、設定ファイルです。
`deb` で始まる行に、リポジトリの URL、ディストリビューションの名前、コンポーネントを書きます。変えたあとは `apt update` で、パッケージの一覧を取り直します。
例: `/etc/apt/sources.list`、`/etc/apt/sources.list.d/`
注意: 書き換えただけでは反映されず、`apt update` が必要です。
関連: リポジトリ(パッケージ)、apt

### deb パッケージ
別名: .deb、dpkg-reconfigure
試験: LinuC101
要約: Debian 系で使われる、パッケージのファイル形式です。
`.deb` を、`dpkg -i` で入れます。`dpkg-reconfigure` は、入れたパッケージの設定の質問を、もう一度行います。
例: `dpkg -i pkg.deb`、`dpkg -l`、`dpkg-reconfigure tzdata`
注意: `dpkg` は依存関係を自動で解決しません。`apt` を使うと、依存するパッケージも取得します。
関連: apt、パッケージ

### rpm パッケージ
別名: .rpm、rpm2cpio
試験: LinuC101
要約: RHEL 系で使われる、パッケージのファイル形式です。
`rpm` コマンドで操作します。`-i` で入れ、`-U` で更新し、`-e` で削除します。問い合わせは `-q` で行い、`rpm2cpio` は、中身を取り出すための変換です。
例: `rpm -ivh pkg.rpm`、`rpm -qa`、`rpm -qf /usr/bin/ls`、`rpm2cpio pkg.rpm | cpio -idv`
注意: `rpm` は依存関係を解決しません。解決するには `dnf` を使います。
関連: dnf、パッケージ

### yum.repos.d
別名: /etc/yum.repos.d/、/etc/yum.conf、yumdownloader
試験: LinuC101
要約: RHEL 系で、パッケージのリポジトリを書く設定の置き場所です。
`/etc/yum.repos.d/` に、`.repo` ファイルを置きます。全体の設定は `/etc/yum.conf` です。`yumdownloader` は、入れずにパッケージのファイルだけを取得します。
例: `/etc/yum.repos.d/example.repo`、`yumdownloader nginx`
注意: `.repo` の `enabled=0` のリポジトリは、使われません。
関連: dnf、リポジトリ(パッケージ)

### patch
試験: LinuC201
要約: 差分のファイルを、ソースコードに当てるコマンドです。
`diff` で作った差分のファイルを読み、元のファイルを書き換えます。カーネルなどのソースに、修正を当てるときに使います。
例: `patch -p1 < fix.patch`
注意: `-p1` は、差分のファイルの中のパスの先頭 1 階層を取り除く指定で、場所を合わせるために要ります。
関連: Git、カーネルのビルド

### ソースからのインストール
別名: configure、make install
試験: LinuC201
要約: ソースコードをビルドして、手で入れる方法です。
`./configure` で環境を調べて設定し、`make` でビルドし、`make install` で入れます。`configure` の `--prefix` で、入れる場所を変えられます。
例: `./configure --prefix=/usr/local && make && sudo make install`
注意: パッケージ管理に記録されないので、削除や更新を自分で行う必要があります。
関連: パッケージ、依存関係、patch

## ネットワークの道具と暗号

### SSH
別名: Secure Shell
試験: LinuC101、LinuC102、CCNA、SAA、LinuC202
要約: 暗号化した通信で、別のコンピューターにログインする仕組みです。
ネットワーク越しに、暗号化してサーバーにログインし、操作するためのプロトコルです(TCP 22 番)。パスワードより、鍵の組(公開鍵と秘密鍵)での認証が安全です。
例: `ssh -i ~/.ssh/id_ed25519 sato@server1`、`ssh-copy-id sato@server1`
注意: 秘密鍵のパーミッションが広い(644 など)と、ssh はその鍵を使いません。
関連: 公開鍵暗号、TCP

### GnuPG
別名: GPG
試験: LinuC102
要約: ファイルの暗号化と電子署名をする道具です。
ファイルやメールを暗号化したり、電子署名を付けたりするためのツールです。公開鍵暗号を使います。
例: `gpg --gen-key`、`gpg --encrypt -r sato file`、`gpg --verify file.sig`
注意: パッケージの署名の確認にも使われます。
関連: 公開鍵暗号、電子署名

### MTA
別名: Postfix、メール転送エージェント、main.cf、master.cf、sendmail、exim
試験: LinuC102、LinuC202
要約: メールを配送するサーバーのプログラムです。
メールを受け取って、ほかのサーバーへ送り届けるソフトウェアです。Postfix、Exim、Sendmail があります。SMTP(TCP 25 番)を使います。
例: Postfix、`mailq`、`/etc/aliases` を変えたら `newaliases`
注意: `/etc/aliases` を編集しただけでは反映されません。
関連: ポート番号

### SSH の鍵ペア
別名: id_rsa、id_rsa.pub、~/.ssh
試験: LinuC101
要約: SSH の公開鍵認証で使う、秘密鍵と公開鍵の組です。
`id_rsa` が秘密鍵、`id_rsa.pub` が公開鍵です。公開鍵を、接続先の `authorized_keys` に登録します。秘密鍵は、他の人に渡しません。
例: `~/.ssh/id_rsa`、`~/.ssh/id_rsa.pub`
注意: 秘密鍵の権限が広いと、SSH は使用を拒否します(`600` にします)。
関連: authorized_keys、ssh-keygen

### ssh-keygen
試験: LinuC102、LinuC202
要約: SSH の鍵ペアを作るコマンドです。
`-t` で鍵の種類、`-b` で長さを指定します。作る場所は、既定で `~/.ssh/` です。パスフレーズを付けると、秘密鍵が守られます。
例: `ssh-keygen -t ed25519`、`ssh-keygen -t rsa -b 4096`
注意: パスフレーズなしの秘密鍵は、盗まれるとそのまま使われます。
関連: SSH の鍵ペア、ssh-agent

### ssh-agent
別名: ssh-add
試験: LinuC102
要約: 秘密鍵を、パスフレーズ入力済みの状態で預かる、プログラムです。
`ssh-add` で秘密鍵を登録すると、接続のたびにパスフレーズを入れなくて済みます。
例: `eval $(ssh-agent)`、`ssh-add ~/.ssh/id_ed25519`
注意: 鍵は、`ssh-agent` のプロセスが動いている間だけ、メモリに保持されます。
関連: ssh-keygen、SSH の鍵ペア

### Ed25519
別名: ed25519
試験: LinuC102
要約: SSH の鍵で使う、署名のアルゴリズムの 1 つです。
RSA は古くから使われます。ECDSA と Ed25519 は、楕円曲線を使い、鍵が短いのが特徴です。新しく作る鍵では、Ed25519 がよく選ばれます。
例: `ssh-keygen -t ed25519`
注意: 古い環境では、Ed25519 に対応していないことがあります。
関連: ssh-keygen、公開鍵暗号

### SSH ポート転送
別名: ssh -L、ssh -R、ローカルフォワード、リモートフォワード
試験: LinuC102
要約: SSH の接続を通して、別のポートへの通信を中継する機能です。
`-L` は、手元のポートに来た通信を、SSH の先へ転送します。`-R` は、接続先のポートに来た通信を、手元へ転送します。通信は暗号化されます。
例: `ssh -L 8080:localhost:80 user@host`
注意: `-L` は手元のポートを開き、`-R` は相手側のポートを開く点が違います。
関連: SSH

### sshd_config
別名: /etc/ssh/sshd_config
試験: LinuC102
要約: SSH のサーバー(`sshd`)の設定ファイルです。
ルートでのログインを許すか(`PermitRootLogin`)、パスワード認証を使うか(`PasswordAuthentication`)などを決めます。
例: `PermitRootLogin no`、`PasswordAuthentication no`
注意: 変更を反映するには、`sshd` を再読み込みします。設定を間違えると、接続できなくなることがあります。
関連: SSH、ssh-keygen

### gpg-agent
別名: ~/.gnupg
試験: LinuC102
要約: GnuPG の秘密鍵を、パスフレーズ入力済みの状態で預かる、プログラムです。
GnuPG の鍵や設定は、`~/.gnupg/` に置かれます。`gpg-agent` が動いていると、パスフレーズを何度も入れなくて済みます。
例: `gpg --list-keys`、`ls ~/.gnupg/`
注意: `~/.gnupg/` の権限は、本人だけが読める形にします。
関連: GnuPG、ssh-agent

## データの形式と開発

### YAML
試験: Docker、K8s、CCNA、LinuC201
要約: インデントで入れ子を表す、人が読み書きしやすいデータの書き方です。
インデント(字下げ)で構造を表す、設定ファイルの書き方です。Kubernetes のマニフェスト、Compose、Ansible で使います。字下げの空白の数を間違えると、意味が変わったりエラーになったりします。
例: Kubernetes のマニフェスト、Ansible の playbook、`docker compose` の設定
注意: インデントにタブは使えません。スペースでそろえます。
関連: JSON

### JSON
別名: JavaScript Object Notation
要約: `{}` と `[]` でデータを表す、プログラム同士のやり取りでよく使う書き方です。
`{ "名前": 値 }` の形でデータを書く形式です。API のやり取りや、設定、ポリシー(IAM)で使われます。
例: `{"name": "web", "ports": [80, 443]}`、`jq '.items[].name'`
注意: コメントを書けず、最後の要素の後ろにカンマを付けるとエラーになります。
関連: YAML、API

### API
別名: Application Programming Interface
要約: プログラムから機能を呼び出すための決まった窓口です。
プログラムから別のプログラムやサービスを操作するための窓口です。クラウドや Kubernetes は、すべての操作を API で受け付けます。Web では、HTTP で JSON をやり取りする REST API が多いです。
例: AWS の API、Kubernetes の API サーバー
注意: コンソールの操作も、裏では API を呼んでいます。
関連: REST、JSON

### REST
別名: REST API
試験: CCNA
要約: HTTP のメソッドと URL でリソースを操作する、API の作り方です。
HTTP のメソッド(GET、POST、PUT、DELETE)で、URL が表すリソースを操作する API の設計の考え方です。
例: `GET /users/1`、`POST /users`、`DELETE /users/1`
注意: GET は読むだけ、POST は作る、PUT と PATCH は変える、DELETE は消すのが基本です。
関連: API、HTTP

### Git
別名: git clone、git checkout、git tag
試験: Terraform、K8s、LinuC201
要約: ファイルの変更の履歴を記録し、共同で作業するための道具です。
ファイルの変更の履歴を管理する、分散型のバージョン管理システムです。GitHub や GitLab でリポジトリを共有し、プルリクエストでレビューします。IaC や GitOps の土台になります。
例: `git add`、`git commit -m "…"`、`git push`、`git log --oneline`
注意: パスワードや鍵を一度コミットすると履歴に残るので、消しても漏れたものとして扱います。
関連: プルリクエスト、GitOps

### プルリクエスト
別名: PR、マージリクエスト
試験: Terraform、K8s
要約: 変更を取り込んでもらう前に、レビューを頼む仕組みです。
変更を本流のブランチに取り込む前に、レビューを依頼する仕組みです。CI の結果や `terraform plan` の結果をここに表示することが多いです。
例: GitHub の Pull Request、GitLab の Merge Request
注意: IaC では、plan の結果をプルリクエストに載せてレビューするのが一般的です。
関連: Git、CI/CD

## 文字と地域

### ロケール
別名: LC_ALL
試験: LinuC102
要約: 言語、日付、数の書き方などの、地域ごとの設定です。
言語や地域に合わせた表示の設定です(日付の形、文字コード、言語)。`LANG` や `LC_ALL` の環境変数で決めます。
例: `localectl`、`LANG=ja_JP.UTF-8`、`LC_ALL=C`
注意: `LC_ALL` を設定すると、ほかの `LC_*` と `LANG` より優先されます。
関連: 文字コード、環境変数

### 文字コード
別名: エンコーディング
試験: LinuC102、FE
要約: 文字をバイトの並びとして表す決まりです。
文字をコンピューターで扱う数値にする決まりです。今は UTF-8 が標準です。古い日本語の文書では Shift_JIS や EUC-JP も使われます。
例: UTF-8、Shift_JIS、`iconv -f SJIS -t UTF-8 in.txt`
注意: 文字化けは、書いたときと読むときの文字コードが違うと起きます。
関連: Unicode、ロケール

### Unicode
試験: LinuC102、FE
要約: 世界の文字に 1 つずつ番号を付けた規格です。
世界中の文字に番号を割り当てた文字の集合です。UTF-8 は、Unicode の番号をバイトの並びにする方式の 1 つです。
例: UTF-8 は Unicode の符号化の方式の 1 つ
注意: Unicode は番号の決まりで、UTF-8 はそれをバイトにする方法です。
関連: 文字コード

### X Window System
別名: X11、X サーバー、X クライアント
試験: LinuC101
要約: Linux の GUI の基本の仕組みです。
Linux の GUI の基本の仕組みです。画面とキーボードを持つ手元の側が X サーバー、表示したいアプリが X クライアントです。
例: `startx`、`echo $DISPLAY`、`ssh -X server1`
注意: 画面を持つ手元の側が X サーバーで、アプリの側が X クライアントです。
関連: Linux

### 国際化と地域化
別名: i18n、l10n
試験: LinuC102
要約: ソフトウェアを、各国の言語や習慣に対応させる、取り組みです。
国際化(i18n)は、多言語に対応できる作りにすることです。地域化(l10n)は、特定の言語や地域向けに、表示を合わせることです。
例: 日本語の画面表示、日付の形式
注意: i18n と l10n の数字は、頭と終わりの間の文字数を表します(internationalization の 18 文字)。
関連: ロケール

### iconv
試験: LinuC102
要約: 文字コードを、別の文字コードに変換するコマンドです。
`-f` で元の、`-t` で変換後の文字コードを指定します。古いシステムの文字コードを扱うファイルを、UTF-8 に直すときに使います。
例: `iconv -f SJIS -t UTF-8 old.txt > new.txt`
注意: 変換できない文字があると、エラーになったり、欠けたりします。
関連: 文字コード、UTF-8

### ASCII
試験: LinuC102
要約: 英数字と記号を、7 ビットで表す、基本の文字コードです。
128 種類の文字を表します。日本語は表せません。UTF-8 の最初の 128 文字は、ASCII と同じです。
例: `A` は 16 進数で `41`、改行(LF)は `0A`
注意: 半角カナは ASCII に含まれません。
関連: UTF-8、文字コード

### ISO-8859
別名: ISO-8859-1、Latin-1
試験: LinuC102
要約: ASCII を拡張した、欧州の言語向けの文字コードの規格です。
1 バイトで 1 文字を表し、ISO-8859-1(Latin-1)は西欧の言語向けです。日本語は表せません。
例: `iconv -f ISO-8859-1 -t UTF-8`
注意: 日本語の文字を含むファイルを、ISO-8859 として扱うと、文字化けします。
関連: 文字コード、UTF-8

### ISO-2022-JP
試験: LinuC102
要約: 日本語を 7 ビットで表す、メールなどで使われた文字コードです。
エスケープシーケンスで、文字の種類を切り替えます。メールの本文で、使われてきました。
例: `iconv -f ISO-2022-JP -t UTF-8 mail.txt`
注意: Shift_JIS や EUC-JP とは別の方式なので、変換が必要です。
関連: 文字コード、iconv

### ディスプレイマネージャー
別名: GDM、LightDM
試験: LinuC101
要約: グラフィカルなログイン画面を出して、デスクトップを始めるプログラムです。
ログインの認証を行ったあと、X サーバーとデスクトップの環境を起動します。GDM や LightDM が代表です。
例: `systemctl status gdm`
注意: ディスプレイマネージャーを使わず、テキストのログインから `startx` で始めることもできます。
関連: X Window System、ウィンドウマネージャー

### ウィンドウマネージャー
試験: LinuC101
要約: X の画面で、ウィンドウの枠、移動、重なりを管理するプログラムです。
ウィンドウの枠を付け、移動や大きさの変更、重なりの順序を担当します。デスクトップ環境には、ウィンドウマネージャーが含まれます。
例: Mutter(GNOME)、KWin(KDE)
注意: ウィンドウマネージャーは画面の描画の仕組みそのものではなく、X サーバーの上で動く、管理役です。
関連: X Window System、ディスプレイマネージャー

### startx
試験: LinuC101
要約: コンソールから、X のセッションを手動で始めるコマンドです。
X サーバーと、`~/.xinitrc` に書いたクライアントを起動します。ディスプレイマネージャーを使わない環境で使います。
例: `startx`
注意: グラフィカルなログインがある環境では、通常は使いません。
関連: ディスプレイマネージャー、X Window System

### DISPLAY
別名: DISPLAY 変数、xauth
試験: LinuC101
要約: X のクライアントが、どの X サーバーの画面に表示するかを決める環境変数です。
`ホスト:ディスプレイ番号.スクリーン` の形で書きます。`:0` は、同じ機械の最初の画面です。接続を許可する認証の情報は、`xauth` が管理します。
例: `export DISPLAY=:0`、`xauth list`
注意: `ssh -X` でつなぐと、`DISPLAY` が自動で設定され、画面を手元に転送できます。
関連: X Window System、環境変数

## 仮想化

### NUMA
別名: Non-Uniform Memory Access
試験: LinuC3PS
要約: CPU のグループごとに自分のメモリを持ち、近いメモリほど速い構造です。
CPU とメモリを組にしたもの(ノード)が複数ある構造です。自分のノードのメモリは速く、別のノードのメモリは遅くなります。VM の CPU とメモリは、同じノードにそろえます。
例: `numactl --hardware`、`numastat -c qemu-kvm`
注意: VM の CPU を固定しても、メモリが別のノードにあると遅くなります。
関連: KVM、仮想マシン

### IOMMU
別名: VT-d、AMD-Vi
試験: LinuC3PS
要約: デバイスのメモリへの直接アクセスを、変換して制限する仕組みです。
Intel では VT-d、AMD では AMD-Vi と呼びます。物理の PCI デバイスを、安全に VM に渡す(パススルーする)ために使います。
例: `intel_iommu=on`(カーネルのパラメーター)、`find /sys/kernel/iommu_groups/ -type l`
注意: UEFI の設定とカーネルのパラメーターの両方が必要なことがあります。
関連: vfio-pci、KVM

### vfio-pci
別名: VFIO
試験: LinuC3PS
要約: PCI デバイスを VM に渡すためのカーネルのドライバーです。
デバイスを元のドライバーから外して vfio-pci につなぐと、VM が直接使えるようになります。同じ IOMMU グループのデバイスは、まとめて渡します。
例: `options vfio-pci ids=10de:2684`、`lspci -nnk -s 01:00.0`
注意: 渡したデバイスは、ホストとほかの VM が使えなくなります。
関連: IOMMU、KVM

### メモリバルーニング
別名: virtio-balloon
試験: LinuC3PS
要約: 動いている VM のメモリの量を、ホストから増減する仕組みです。
ゲストの virtio-balloon のドライバーが、ゲストのメモリを取り上げてホストに返します。最大の量の範囲で増減できます。
例: `virsh setmem web01 1G --live`
注意: 最大のメモリの量は、動いている間は増やせません。
関連: 仮想マシン、virsh

### ライブマイグレーション
別名: ライブマイグレート
試験: LinuC3PS
要約: VM を動かしたまま、別のホストに移すことです。
メモリの内容を送り、最後に一瞬だけ止めて切り替えます。止めて移す方法は、コールドマイグレーションです。
例: `virsh migrate --live --persistent --undefinesource web01 qemu+ssh://host2/system`
注意: 移し先に、ゲストに見せている CPU の機能が必要です。
関連: 仮想マシン、virsh、qcow2

### 外部スナップショット
別名: 差分スナップショット
試験: LinuC3PS
要約: 元のディスクを読み取り専用にし、変更を新しいファイルに書くスナップショットです。
RAW でも使えます。使い終わったら、`virsh blockcommit` でベースディスクに統合します。
例: `virsh snapshot-create-as web01 snap1 --disk-only --atomic`
注意: 差分が積み重なると遅くなります。バックアップの代わりにはなりません。
関連: qcow2、virsh

### OVF
別名: OVA、Open Virtualization Format
試験: LinuC3PS
要約: VM を、ソフトウェアの違いを越えて受け渡すための標準の形式です。
構成を書いた `.ovf`、ディスクの `.vmdk`、ハッシュの一覧の `.mf`、署名の `.cert` からなります。これを 1 つの tar にしたものが OVA です。
例: `tar -tvf web01.ova`、`qemu-img convert -f vmdk -O qcow2 a.vmdk a.qcow2`
注意: 取り込む前に、`.mf` のハッシュを確かめます。
関連: qcow2、仮想マシン

### Proxmox VE
別名: Proxmox Virtual Environment
試験: LinuC3PS
要約: KVM の VM と LXC のコンテナを、Web の画面で管理するプラットフォームです。
Debian をもとにしたオープンソースです。クラスタ、高可用性(HA)、バックアップを備えます。Web UI はポート 8006 です。
例: `qm list`、`pvecm status`、`vzdump 100 --mode snapshot`
注意: クラスタでは、過半数のノード(クォーラム)が必要です。
関連: KVM、クラスタ、仮想マシン

### ハイパーバイザー型仮想化
別名: ハイパーバイザー型、ベアメタル型
試験: LinuC201
要約: ハードウェアの上で、直接ハイパーバイザーが動く仮想化の方式です。
OS を介さず、ハイパーバイザーがハードウェアを直接制御します。ホスト型より、性能の損失が少なくなります。KVM や Xen が例です。
例: KVM、Xen
注意: KVM は Linux のカーネルの一部として動きますが、ハイパーバイザー型として扱われます。
関連: ホスト型仮想化、ハイパーバイザー、KVM

### ホスト型仮想化
試験: LinuC201、ITPassport
要約: ふつうの OS の上のアプリとして、仮想マシンを動かす方式です。
ホスト OS の上で、ソフトウェアとして仮想化を行います。パソコンで試すときに手軽です。VirtualBox が例です。
例: VirtualBox
注意: ホスト OS を通す分、ハイパーバイザー型より性能の損失が出やすくなります。
関連: ハイパーバイザー型仮想化、仮想マシン

### lscpu
別名: /proc/cpuinfo
試験: LinuC201
要約: CPU の情報を表示するコマンドです。
CPU の種類、コア数、対応する機能などを表示します。仮想化の機能があるかは、`vmx`(Intel)と `svm`(AMD)のフラグで確かめます。`/proc/cpuinfo` にも、同じ情報があります。
例: `lscpu`、`grep -E -c '(vmx|svm)' /proc/cpuinfo`
注意: フラグがあっても、BIOS や UEFI で無効になっていると使えません。
関連: ハードウェア支援仮想化、KVM

### virtio-scsi
試験: LinuC3PS
要約: VM に SCSI のコントローラーとして見せる、virtio の仮想ディスクの方式です。
1 つのコントローラーに多くのディスクをつなげます。TRIM(使っていない領域を伝える命令)にも対応します。virtio-blk より機能が多く、ディスクの数が多い VM に向きます。
例: libvirt の XML で `<controller type='scsi' model='virtio-scsi'/>` を書き、ディスクを `bus='scsi'` にする
注意: virtio-blk とは別の仕組みです。ディスクの名前が `vda` ではなく `sda` のようになります。
関連: virtio、qcow2

### RAW イメージ
別名: RAW 形式
試験: LinuC3PS
要約: 圧縮もスナップショットの管理情報も持たない、いちばん単純な仮想ディスクの形式です。
ディスクの中身をそのままファイルにします。管理情報がないぶん速く、ほかの形式へ変換する元にもなります。ファイルシステムが対応していれば、使っていない部分は容量を使いません。これをスパースファイルと呼びます。
例: `qemu-img create -f raw disk.raw 20G`
注意: 形式自体にはスナップショットの機能がありません。必要なら qcow2 を使います。
関連: qcow2、qemu-img

### VMDK
別名: Virtual Machine Disk
試験: LinuC3PS
要約: VMware の製品で使われる、仮想ディスクの形式です。
VMware から KVM などへ VM を移すときに、よく出てくる形式です。`qemu-img` で qcow2 や RAW に変換できます。
例: `qemu-img convert -f vmdk -O qcow2 web01.vmdk web01.qcow2`
注意: 変換しただけでは、VM の仮想ハードウェアの設定は移りません。ドライバーや起動の設定を確かめます。
関連: qemu-img、qcow2、OVF

### qemu-img
別名: qemu-img create、qemu-img convert、qemu-img resize、qemu-img info
試験: LinuC3PS
要約: 仮想ディスクのファイルを作る、調べる、変換する、大きさを変える QEMU のコマンドです。
`create` で作成、`info` で形式と使用量の確認、`convert` で形式の変換、`resize` で大きさの変更を行います。`convert -c` は、出力を圧縮します。圧縮は qcow2 の出力で使います。
例: `qemu-img info disk.qcow2`、`qemu-img resize disk.qcow2 +10G`、`qemu-img convert -c -O qcow2 in.raw out.qcow2`
注意: 大きくした後は、ゲストの中のパーティションとファイルシステムも広げます。小さくするときは先にゲスト側を縮め、`--shrink` を付けます。
関連: qcow2、RAW イメージ、VMDK

### CPU ホットプラグ
別名: vCPU のホットプラグ
試験: LinuC3PS
要約: VM を止めずに、VM の仮想 CPU の数を増やす機能です。
VM の定義に、あらかじめ最大数を決めておきます。その範囲で、動いている VM の仮想 CPU を増やせます。
例: `virsh setvcpus web01 4 --live`
注意: 最大数を超えては増やせません。最大数を変えるには、VM を止める必要があります。
関連: メモリバルーニング、virsh

### ライブスナップショット
試験: LinuC3PS
要約: VM を動かしたまま取る、ディスクの(必要ならメモリの)スナップショットです。
VM を止めずに、ある時点の状態を残します。libvirt では、元のディスクを固定し、以後の書き込みを別のファイルへ書く形(外部スナップショット)で取れます。
例: `virsh snapshot-create-as web01 snap1 --disk-only --atomic`
注意: ディスクだけのスナップショットは、メモリの中身を含みません。戻したときは、電源を急に切った後のような状態です。
関連: 外部スナップショット、blockcommit、ライブマイグレーション

### blockcommit
別名: ベースディスクへの統合、virsh blockcommit
試験: LinuC3PS
要約: 外部スナップショットで増えた差分のファイルを、元のディスクへ書き戻して 1 つにまとめる操作です。
スナップショットを残し続けると、層が増えて遅くなります。`blockcommit` で差分をベースへ戻せば、スナップショットを VM の動作中に整理できます。
例: `virsh blockcommit web01 vda --active --pivot`
注意: `--pivot` を付けないと、VM は差分のファイルを使い続けます。
関連: ライブスナップショット、外部スナップショット

### コールドマイグレーション
試験: LinuC3PS
要約: VM を停止してから、別のホストへ移す方法です。
停止した VM のディスクと定義(XML)を、別のホストへ写して登録します。メモリの状態を移さないので、仕組みは単純です。そのかわり、止まっている時間ができます。
例: `rsync -a /var/lib/libvirt/images/web01.qcow2 host2:/var/lib/libvirt/images/` の後に、移動先で `virsh define web01.xml`
注意: 動いたまま移すライブマイグレーションとは別です。移動先に、同じ名前のネットワークやストレージが必要です。
関連: ライブマイグレーション、ドメイン XML

### ドメイン XML
別名: 構成 XML、virsh dumpxml、virsh edit
試験: LinuC3PS
要約: libvirt が VM(ドメイン)の構成を書いて持つ、XML 形式の定義です。
CPU、メモリ、ディスク、ネットワークなどが書いてあります。`virsh dumpxml` で取り出し、`virsh edit` で直接編集し、`virsh define` で登録します。
例: `virsh dumpxml web01 > web01.xml`、`virsh edit web01`
注意: 実行中の VM を `virsh edit` で直しても、すぐには反映されません。次に起動したときから反映されます。
関連: libvirt、virsh

### 証明書ファイル(OVF)
別名: .cert ファイル
試験: LinuC3PS
要約: OVF のパッケージに入れる、署名した人の証明書のファイルです。
OVF のパッケージには、構成の記述(`.ovf`)、ファイルの一覧とハッシュ値(`.mf`)、そして任意で証明書(`.cert`)が入ります。署名と合わせて、誰が作ったかを確かめるために使います。
例: `web01.ovf`、`web01.mf`、`web01.cert`
注意: 証明書は必須ではありません。なくても VM は取り込めます。
関連: OVF、証明書

### ホストオンリーネットワーク
別名: ホストオンリー、isolated ネットワーク
試験: LinuC3PS
要約: VM 同士と、ホストとだけ通信できる仮想ネットワークです。
外部のネットワークへは出ません。同じ仮想スイッチ上の VM とホストだけが話せます。libvirt では、`<forward>` を書かないネットワークがこれになります。
例: テスト用の VM 同士をつなぎ、外へは出したくないとき
注意: NAT のネットワークとは違い、外のインターネットへは出られません。
関連: Linux ブリッジ、NAT、libvirt

### マルチキュー
別名: virtio-net のマルチキュー
試験: LinuC3PS
要約: 仮想 NIC の送受信の列を複数にして、複数の CPU で並行して処理する仕組みです。
列が 1 つだと、1 つの CPU に処理が集まります。列を増やすと、CPU 数の多い VM でネットワークの性能が上がります。
例: libvirt で `<driver name='vhost' queues='4'/>`、ゲストの中で `ethtool -L eth0 combined 4`
注意: ホストの設定だけでは足りません。ゲストの中でも、列の数を有効にします。
関連: virtio、ethtool、SR-IOV

### Proxmox VE クラスタ
別名: pvecm
試験: LinuC3PS
要約: 複数の Proxmox VE のノードをまとめて、1 つの管理単位にしたものです。
`pvecm` コマンドでクラスタを作り、ノードを加えます。管理は、どのノードの画面からも同じように行えます。ノード間の通信は Corosync を使います。
例: `pvecm create lab`、`pvecm add 192.0.2.10`、`pvecm status`
注意: 過半数のノードが見えなくなると、クォーラムを失って設定を変えられなくなります。
関連: Proxmox VE、Corosync、クォーラム

### vmbr
別名: vmbr0
試験: LinuC3PS
要約: Proxmox VE で、VM をネットワークにつなぐための Linux ブリッジの名前です。
`vmbr0` のように、`vmbr` に番号を付けます。物理 NIC をブリッジに入れ、VM の仮想 NIC を同じブリッジにつなぎます。
例: `/etc/network/interfaces` の `iface vmbr0 inet static` に `bridge-ports eno1` を書く
注意: ブリッジを変えると、管理画面への接続が切れることがあります。
関連: Linux ブリッジ、Proxmox VE

### qm
試験: LinuC3PS
要約: Proxmox VE で、VM(QEMU/KVM)を作る、起動する、削除するコマンドです。
VM は番号(VMID)で指定します。コンテナ(LXC)は、別のコマンド `pct` で扱います。
例: `qm create 100 --name web01 --memory 2048`、`qm start 100`、`qm destroy 100`
注意: `qm destroy` は、VM とそのディスクを消します。
関連: Proxmox VE、KVM

## オープンソースの文化

### GPL
別名: GNU General Public License
試験: LinuC102
要約: 改変したものを配るときに、同じ条件でソースコードも公開する義務がある、ライセンスです。
利用、改変、再配布が自由です。ただし、GPL のソフトウェアを元にしたものを配るときは、同じ GPL で、ソースコードを渡す必要があります。Linux カーネルが使っています。
例: Linux カーネル、GNU のコマンド群
注意: GPL のソフトウェアは無保証であると、ライセンスに明記されています。
関連: コピーレフト、LGPL

### LGPL
別名: GNU Lesser General Public License
試験: LinuC102
要約: ライブラリとして使うだけなら、自分のプログラムを公開しなくてよい、緩めた GPL です。
ライブラリとして呼び出す側のプログラムには、GPL の公開の義務を求めません。ライブラリ自体を改変したときは、その部分を公開します。
例: GNU C ライブラリ(glibc)
注意: LGPL のライブラリを改変して配る場合は、改変部分の公開が必要です。
関連: GPL、コピーレフト

### AGPL
別名: GNU Affero General Public License
試験: LinuC102
要約: ネットワーク越しにサービスとして使わせる場合にも、ソースの公開を求める GPL です。
GPL は、配布しなければ公開の義務が生じません。AGPL は、ネットワークで利用者に使わせるだけでも、改変したソースコードを公開する義務があります。
例: 改変した AGPL のソフトウェアを、Web サービスとして公開する場合
注意: Web サービスは「配布」にならないので、GPL では抜け道になっていた点を埋めたものです。
関連: GPL、コピーレフト

### BSD ライセンス
試験: LinuC102
要約: 著作権表示などを残せば、自由に使える、緩いライセンスです。
改変して配布するときも、ソースコードの公開を求められません。ライセンスの文と、著作権の表示を残す必要があります。
例: FreeBSD、OpenBSD
注意: 公開の義務がある GPL とは、考え方が違います。
関連: GPL、パブリックドメイン

### パブリックドメイン
試験: LinuC102
要約: 著作権が消えたか、放棄されて、誰でも自由に使える状態です。
権利者がいないか、権利を手放したものです。条件なしで使えます。
例: 著作権の保護期間が終わった作品
注意: オープンソースのライセンスは、権利を持ったうえで、利用を許す点が違います。
関連: コピーレフト、BSD ライセンス
