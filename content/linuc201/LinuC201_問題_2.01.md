# LinuC201 問題 2.01 システムの起動とLinuxカーネル

対象: LinuC レベル2 201試験 / 全34問 / すべてオリジナル問題
対応テキスト: `LinuC201_2.01_システムの起動とLinuxカーネル.md`
解答・解説は末尾。

## 問題

### 2.01.1 ブートプロセスとGRUB

**問1** `LinuC201-2.01-001` BIOS で起動する PC で、ディスクの先頭の 512 バイトである MBR に入っているものの組み合わせはどれか。

- A. カーネルのイメージと、initramfs
- B. GRUB の設定ファイル `grub.cfg` と、`/etc/fstab`
- C. ブートコードと、パーティション表と、署名
- D. FAT32 のファイルシステムと、`.efi` の実行ファイル

**問2** `LinuC201-2.01-002` UEFI で起動する Linux の ESP(EFI システムパーティション)について、正しい説明はどれか。

- A. FAT32 で作り、ふつう `/boot/efi` にマウントして、`.efi` のブートローダーを置く
- B. ext4 で作り、ふつう `/boot/grub` にマウントして、`grub.cfg` を置く
- C. XFS で作り、ふつう `/efi` にマウントして、カーネルの設定を置く
- D. スワップ用のパーティションで、起動のときにメモリの内容を保存する

**問3** `LinuC201-2.01-003` UEFI の起動の項目(ブートエントリ)と、起動の順番(BootOrder)を、Linux のコマンドラインから確認するコマンドはどれか。

- A. `grub-mkconfig -o /boot/grub/grub.cfg`
- B. `lsblk -f`
- C. `systemctl list-units`
- D. `efibootmgr -v`

**問4** `LinuC201-2.01-004` AlmaLinux 9 で、BIOS 構成のサーバーの `/etc/default/grub` を変えた。GRUB の設定ファイルを作り直すコマンドはどれか。

- A. `update-grub`
- B. `grub2-mkconfig -o /boot/grub2/grub.cfg`
- C. `grub2-install /boot/grub2/grub.cfg`
- D. `dracut -f`

**問5** `LinuC201-2.01-005` GRUB(GRUB 2)を、ディスクや ESP に書き込む(インストールする)コマンドを答えよ(オプションと引数は不要)。

**問6** `LinuC201-2.01-006` GRUB のメニューで、選んだ項目の内容をその場で編集し、今回の 1 回だけカーネルのオプションを変えて起動したい。編集の画面を開くキーはどれか。

- A. `c`
- B. `Esc`
- C. `Enter`
- D. `e`

**問7** `LinuC201-2.01-007` 起動のときに使う initramfs(initrd)の役割として、正しいものはどれか。

- A. 本物のルートファイルシステムを読むために必要なドライバーを、起動の途中でカーネルに渡す
- B. GRUB のメニューの項目を保存する
- C. UEFI の起動の順番を決める
- D. サービスを起動する順番を決める

**問8** `LinuC201-2.01-008` UEFI で起動する Linux について、正しいものを**2つ**選べ。

- A. GRUB は、ディスクの先頭 512 バイトの MBR に入れる
- B. ブートローダーの `.efi` のファイルは、ESP に置く
- C. UEFI シェルは GRUB の一部で、GRUB のシェルと同じものである
- D. `efibootmgr` で、起動の項目の順番を変えられる

### 2.01.2 システム起動のカスタマイズ

**問9** `LinuC201-2.01-009` 同じ名前のユニットファイルが `/etc/systemd/system/`、`/run/systemd/system/`、`/usr/lib/systemd/system/` の 3 か所にある。systemd が使うのは、どの場所のファイルか。

- A. `/usr/lib/systemd/system/`
- B. `/etc/systemd/system/`
- C. `/run/systemd/system/`
- D. 3 つの内容を、順番にすべて合成する

**問10** `LinuC201-2.01-010` 停止している nginx のサービスに、`systemctl enable nginx` を実行した。直後の状態として正しいものはどれか。

- A. すぐに起動し、次の再起動からは起動しない
- B. すぐに起動し、次の再起動からも起動する
- C. 今は停止したままで、次の再起動から自動で起動する
- D. 手動でも起動できなくなる

**問11** `LinuC201-2.01-011` サービス `foo.service` を、手動の `systemctl start foo` でも、ほかのユニットの依存からの起動でも、起動できないようにしたい。使うコマンドはどれか。

- A. `systemctl mask foo`
- B. `systemctl disable foo`
- C. `systemctl stop foo`
- D. `systemctl reload foo`

**問12** `LinuC201-2.01-012` systemd のユニットファイルのうち、別の場所のファイルで上書きされたり、追加で変えられたりしているものを一覧にするコマンドを答えよ(オプションは不要)。

**問13** `LinuC201-2.01-013` `/etc/fstab` の誤りで、レスキューのモードでも起動しなくなった。ほとんど何も起動せず、ルートを読み取り専用でマウントしたシェルだけを使うターゲットはどれか。

- A. `rescue.target`
- B. `multi-user.target`
- C. `graphical.target`
- D. `emergency.target`

**問14** `LinuC201-2.01-014` サーバーが起動するときの既定のターゲットを、画面のない `multi-user.target` に変えたい。次の再起動からも有効にするコマンドはどれか。

- A. `systemctl isolate multi-user.target`
- B. `systemctl set-default multi-user.target`
- C. `systemctl enable multi-user.target`
- D. `systemctl get-default multi-user.target`

### 2.01.3 Linux カーネルの構成要素

**問15** `LinuC201-2.01-015` x86 の Linux で、`/boot/vmlinuz-*` の形式として標準的な、大きなカーネルも入る圧縮されたイメージの名前はどれか。

- A. `vmlinux`
- B. `bzImage`
- C. `System.map`
- D. `initrd`

**問16** `LinuC201-2.01-016` kernel.org が公開するカーネルのうち、ディストリビューションが数年にわたって使い続けるために選ぶ、長い期間の修正が続く区分はどれか。

- A. mainline(新しい機能を入れる開発版)
- B. linux-next(次に入る変更を集めたもの)
- C. longterm
- D. `6.x-rc1` のような試験版

**問17** `LinuC201-2.01-017` カーネルのソースを `/usr/src/linux` に置いた。カーネルのパラメーターやドライバーの説明の文書があるディレクトリはどれか。

- A. `/usr/src/linux/Documentation/`
- B. `/usr/src/linux/.config/`
- C. `/boot/grub/`
- D. `/lib/modules/`

**問18** `LinuC201-2.01-018` カーネルモジュール(`.ko` のファイル)は、インストールされた後、ふつうどこに置かれるか。

- A. `/boot/modules/`
- B. `/usr/src/linux/modules/`
- C. `/etc/modules/`
- D. `/lib/modules/<カーネルの版>/`

### 2.01.4 Linuxカーネルのコンパイル

**問19** `LinuC201-2.01-019` 今使っている `.config` を新しいカーネルのソースに持ち込み、新しく増えた設定項目だけを質問してほしい。使う make のターゲットはどれか。

- A. `make config`
- B. `make menuconfig`
- C. `make defconfig`
- D. `make oldconfig`

**問20** `LinuC201-2.01-020` ビルドで作ったファイルに加えて `.config` も消して、ソースを最初の状態に戻す make のターゲットはどれか。

- A. `make mrproper`
- B. `make clean`
- C. `make modules`
- D. `make install`

**問21** `LinuC201-2.01-021` コンパイルしたカーネルモジュールを、`/lib/modules/<版>/` に入れる make のターゲットを答えよ(`make` は不要)。

**問22** `LinuC201-2.01-022` カーネルの外にあるモジュールのソースを、カーネルが更新されるたびに自動でビルドし直す仕組みはどれか。

- A. `depmod`
- B. `dracut`
- C. DKMS
- D. `mkinitrd`

**問23** `LinuC201-2.01-023` カーネルをビルドして、ソースの RPM は作らずに、バイナリの RPM だけを作る make のターゲットはどれか。

- A. `make rpm-pkg`
- B. `make binrpm-pkg`
- C. `make deb-pkg`
- D. `make modules_install`

**問24** `LinuC201-2.01-024` initramfs を作る道具を**2つ**選べ。

- A. `dracut`
- B. `depmod`
- C. `mkinitramfs`
- D. `modprobe`

### 2.01.5 カーネル実行時における管理とトラブルシューティング

**問25** `LinuC201-2.01-025` `rmmod e1000e` を実行したら、`Module e1000e is in use` と出て外せなかった。最初に確認することはどれか。

- A. `depmod -a` を実行して、依存関係の一覧を作り直す
- B. `modinfo` で、パラメーターの一覧を見る
- C. `lsmod` で、e1000e を使っているモジュールがないか、`Used by` の列を見る
- D. `insmod` で、もう一度読み込む

**問26** `LinuC201-2.01-026` モジュールを、依存するモジュールも一緒に読み込むコマンドはどれか。

- A. `insmod /lib/modules/foo.ko`
- B. `modprobe foo`
- C. `rmmod foo`
- D. `depmod foo`

**問27** `LinuC201-2.01-027` モジュール `e1000e` の説明、依存するモジュール、パラメーターを表示するコマンドを答えよ(モジュール名は不要)。

**問28** `LinuC201-2.01-028` `net.ipv4.ip_forward` を、再起動した後も 1 にしておきたい。正しい方法はどれか。

- A. `/etc/sysctl.d/` の `.conf` のファイルに、`net.ipv4.ip_forward = 1` を書く
- B. `sysctl -w net.ipv4.ip_forward=1` を、1 回実行する
- C. `echo 1 > /proc/sys/net/ipv4/ip_forward` を、1 回実行する
- D. `sysctl -a` を実行する

**問29** `LinuC201-2.01-029` `/proc/sys/kernel/hostname` に対応する、sysctl で使うパラメーターの名前はどれか。

- A. `kernel_hostname`
- B. `proc.sys.kernel.hostname`
- C. `sys.kernel.hostname`
- D. `kernel.hostname`

**問30** `LinuC201-2.01-030` USB メモリを抜き差ししたとき、カーネルと udev のイベントを、リアルタイムに表示するコマンドを、サブコマンドまで答えよ。

**問31** `LinuC201-2.01-031` `/etc/modprobe.d/` の設定ファイルに `blacklist nouveau` と書いたときの動きとして、正しいものはどれか。

- A. どんな場合でも、そのモジュールは読み込まれない
- B. そのモジュールのファイルが、`/lib/modules/` から消える
- C. デバイスを見つけたときの自動の読み込みを防ぐが、手動の `modprobe` などでは読み込める
- D. そのモジュールは、`lsmod` に表示されなくなる

**問32** `LinuC201-2.01-032` カーネルが出したメッセージ(デバイスの認識や、エラーなど)を見るコマンドを**2つ**選べ。

- A. `lsmod`
- B. `lspci -k`
- C. `dmesg`
- D. `journalctl -k`

**問33** `LinuC201-2.01-033` 動いているカーネルの版(リリース)だけを表示するコマンドを、オプションまで答えよ。

**問34** `LinuC201-2.01-034` kdump(カーネルダンプ)の考え方として、正しいものはどれか。

- A. カーネルパニックのとき、あらかじめ確保したメモリのダンプ用カーネルに kexec で切り替え、メモリの内容を `vmcore` に保存する
- B. 起動のときに、ディスクのファイルシステムを検査する
- C. カーネルのオプションを、GRUB の設定に書き込む
- D. カーネルのソースをコンパイルして、モジュールを作る

## 解答・解説

### 問1 `LinuC201-2.01-001`

**正解**: C

**テキスト**: 3. MBR

MBR は先頭の 512 バイトで、ブートコード(446 バイト)、パーティション表(64 バイト)、署名(2 バイト、`0x55AA`)でできています。BIOS はこのブートコードを読んで実行します。

- A. カーネルと initramfs は `/boot` のファイルで、MBR には入りません。
- B. `grub.cfg` と `/etc/fstab` は、ファイルシステムの中のファイルです。
- D. FAT32 のファイルシステムと `.efi` は、UEFI が使う ESP の中身です。

### 問2 `LinuC201-2.01-002`

**正解**: A

**テキスト**: 4. ESP と UEFI シェル

ESP は、UEFI が読むための専用のパーティションです。ふつう FAT32 で作り、`/boot/efi` にマウントします。中の `EFI/` の下に、ブートローダーの `.efi` を置きます。

- B. UEFI のファームウェアは ext4 を読めません。`/boot/grub` は GRUB の設定の場所です。
- C. XFS ではなく FAT 系で、マウント先も `/boot/efi` です。
- D. スワップとは関係がありません。

### 問3 `LinuC201-2.01-003`

**正解**: D

**テキスト**: 4. ESP と UEFI シェル

`efibootmgr -v` は、UEFI の起動の項目と、BootOrder を表示します。`-o` で順番を変えることもできます。

- A. `grub-mkconfig` は GRUB のメニューの設定ファイルを作るコマンドで、UEFI の起動の項目は扱いません。
- B. `lsblk -f` は、ブロックデバイスとファイルシステムの一覧です。
- C. `systemctl list-units` は、systemd のユニットの一覧です。

### 問4 `LinuC201-2.01-004`

**正解**: B

**テキスト**: 5. GRUB のインストールと設定

Red Hat 系では、コマンド名に `2` が付き、`grub2-mkconfig -o /boot/grub2/grub.cfg` で設定ファイルを作ります。`/etc/default/grub` を変えた後に実行します。

- A. `update-grub` は Debian 系のコマンドです(`grub-mkconfig` を呼ぶ短い形)。
- C. `grub2-install` は、ブートローダーをディスクに書き込むコマンドです。引数に設定ファイルは渡せません。
- D. `dracut -f` は、initramfs を作り直すコマンドで、GRUB の設定は変わりません。

### 問5 `LinuC201-2.01-005`

**正解**: `grub-install`、`grub2-install`

**テキスト**: 5. GRUB のインストールと設定

GRUB をディスク(BIOS では MBR とその後ろの空き)や、ESP(UEFI)に書き込むコマンドです。Debian 系は `grub-install`、Red Hat 系は `grub2-install` です。ただし RHEL 9 系の UEFI では `grub2-install` は使わず、`dnf reinstall grub2-efi shim` でブートローダーを入れ直します。BIOS で GPT のディスクでは、MBR の後ろの空きではなく BIOS boot パーティションに書き込みます。設定ファイルを作る `grub-mkconfig` とは別のコマンドです。

### 問6 `LinuC201-2.01-006`

**正解**: D

**テキスト**: 6. GRUB のメニューとシェル

メニューで項目を選んで `e` を押すと、その項目の内容を編集できます。`linux` の行の最後にオプションを足して、`Ctrl+x` か `F10` で起動します。保存はされず、今回の起動だけに効きます。

- A. `c` は、GRUB のコマンドライン(シェル)に入るキーです。
- B. `Esc` は、編集をやめてメニューに戻るキーです。
- C. `Enter` は、編集せずにその項目をそのまま起動するキーです。

### 問7 `LinuC201-2.01-007`

**正解**: A

**テキスト**: 1. 起動の全体の流れ

initramfs(古い名前は initrd)は、起動の途中だけ使う小さなファイルシステムです。ディスクやファイルシステムのドライバー(カーネルモジュール)を、カーネルに先に渡して、本物のルートファイルシステムを使えるようにします。

- B. GRUB のメニューの項目は、`grub.cfg` に書かれます。
- C. UEFI の起動の順番は、ファームウェアの中にあり、`efibootmgr` で変えます。
- D. サービスの起動の順番は、systemd のユニットの依存関係で決まります。

### 問8 `LinuC201-2.01-008`

**正解**: B、D

**テキスト**: 4. ESP と UEFI シェル

UEFI では、ブートローダーの `.efi` を ESP に置きます。`efibootmgr` で、起動の項目の順番を変えられます。

- A. MBR に GRUB を入れるのは BIOS の構成です。UEFI では ESP に入れます。
- B. ESP に `.efi` を置くので、正しい説明です。
- C. UEFI シェルは、ファームウェアの中で動く環境です。GRUB のシェルとは別のものです。
- D. `efibootmgr -o` で、BootOrder を変えられます。

### 問9 `LinuC201-2.01-009`

**正解**: B

**テキスト**: 2. ユニットファイルの置き場所

優先順位は、`/etc/systemd/system/`(管理者)、`/run/systemd/system/`(実行中に作られる)、`/usr/lib/systemd/system/`(パッケージ)の順です。パッケージのファイルを直接変えずに、`/etc/systemd/system/` に置いて上書きします。

- A. パッケージが入れる場所で、優先順位は 3 番目です。
- C. 優先順位は 2 番目です。再起動で消えます。
- D. 同じ名前のユニットファイルは、合成されず、いちばん優先される 1 つだけが使われます。

### 問10 `LinuC201-2.01-010`

**正解**: C

**テキスト**: 3. systemctl の基本

`systemctl enable` は、起動のときに自動で始まるようにする設定です。今すぐ起動はしません。今すぐ起動もするなら、`systemctl enable --now nginx` を使います。状態は `systemctl status nginx` で確かめ、読み込まれているユニットは `systemctl list-units` で見られます。

- A. 動きが逆です。`enable` では今は起動せず、次の再起動から起動します。
- B. すぐには起動しません。起動は `start` か `--now` で行います。
- D. 手動でも起動できなくなるのは `mask` です。

### 問11 `LinuC201-2.01-011`

**正解**: A

**テキスト**: 3. systemctl の基本

`systemctl mask` は、ユニットを `/dev/null` へのリンクにして、手動でも、依存からも、起動できなくします。戻すには `unmask` を使います。

- B. `disable` は、起動のときの自動の起動をやめるだけです。手で `start` すれば起動します。
- C. `stop` は、今動いているものを止めるだけで、次に起動することは防げません。
- D. `reload` は、設定の再読み込みです。

### 問12 `LinuC201-2.01-012`

**正解**: `systemd-delta`

**テキスト**: 2. ユニットファイルの置き場所

`systemd-delta` は、上書き(OVERRIDDEN)や追加(EXTENDED)など、元のユニットファイルから変えられているものを一覧にします。`--type=overridden` で、上書きだけに絞れます。

### 問13 `LinuC201-2.01-013`

**正解**: D

**テキスト**: 4. レスキューモードと緊急モード

`emergency.target` は、最小限の緊急モードで、ルートを読み取り専用でマウントしたシェルだけを使えます。`/etc/fstab` を直すときは、`mount -o remount,rw /` で書き込みできる状態にします。

- A. `rescue.target` は、基本のサービスを起動し、ローカルのファイルシステムもマウントします。今回はこれでも起動しない状況です。
- B. `multi-user.target` は、通常のサーバーのターゲットです。
- C. `graphical.target` は、画面のある通常のターゲットです。

### 問14 `LinuC201-2.01-014`

**正解**: B

**テキスト**: 1. ユニットとターゲット

`systemctl set-default` で、既定のターゲットを変えます。`default.target` のリンク先が変わり、次の起動からも有効です。今の既定は `systemctl get-default` で見ます。

- A. `isolate` は、今すぐそのターゲットに移るだけで、次の起動の既定は変えません。
- C. `enable` は、ユニットを起動の依存に加える設定で、既定のターゲットは変わりません。
- D. `get-default` は、今の既定を表示するだけです。引数は渡せません。

### 問15 `LinuC201-2.01-015`

**正解**: B

**テキスト**: 1. カーネルイメージの種類

`bzImage`(big zImage)は、大きなカーネルも入る圧縮イメージで、x86 の標準の形式です。`/boot/vmlinuz-<版>` の実体は、多くの場合 `bzImage` です。圧縮には gzip が標準ですが、設定で bzip2、xz、zstd などを選べます。

- A. `vmlinux` は、圧縮していない ELF 形式のカーネルの本体で、起動には直接使いません。
- C. `System.map` は、カーネルの記号とアドレスの表です。
- D. `initrd` は、起動の途中だけ使うファイルシステムです。

### 問16 `LinuC201-2.01-016`

**正解**: C

**テキスト**: 2. カーネルのバージョンと種類

longterm は、長い期間(数年)、修正を続ける区分です。サーバー向けのディストリビューションが、基にする版として選ぶことが多いです。

- A. mainline は最新の機能を入れる開発版で、1 つの版の修正は長く続きません。
- B. linux-next は、次の版に入れる変更を集めた、開発者向けのものです。
- D. `-rc` は、新しい版が出る前の試験版です。

### 問17 `LinuC201-2.01-017`

**正解**: A

**テキスト**: 3. ソースとドキュメント

ソースの `Documentation/` に、設定の項目、ドライバー、カーネルのパラメーターなどの説明の文書があります。

- B. `.config` は、ディレクトリではなく、設定を書いたファイルです。
- C. `/boot/grub/` は、GRUB のファイルの場所です。
- D. `/lib/modules/` は、インストールされたモジュールの場所です。

### 問18 `LinuC201-2.01-018`

**正解**: D

**テキスト**: 4. カーネルモジュール

モジュールは、`/lib/modules/<カーネルの版>/` の下に、`kernel/` などの階層で置かれます(`make modules_install` で入ります)。この下に、`modules.dep` も作られます。

- A. `/boot/modules/` という標準の場所はありません。
- B. ビルドの途中の生成物は、ソースの中にありますが、インストールされた後の場所ではありません。
- C. `/etc/modules/` という標準の場所はありません。

### 問19 `LinuC201-2.01-019`

**正解**: D

**テキスト**: 2. 設定(.config)

`make oldconfig` は、今の `.config` を読み込み、新しく増えた項目だけを質問します。

- A. `make config` は、すべての項目に 1 つずつ質問します。
- B. `make menuconfig` は、文字の画面ですべての項目を編集します。新しい項目だけを質問するのではありません。
- C. `make defconfig` は、標準の設定にして、今の `.config` を引き継ぎません。

### 問20 `LinuC201-2.01-020`

**正解**: A

**テキスト**: 2. 設定(.config)

`make mrproper` は、生成物と `.config` を含めて、すべて消します。ソースを最初の状態に戻したいときに使います。

- B. `make clean` は、生成物は消しますが、`.config` は残します。
- C. `make modules` は、モジュールをビルドします。
- D. `make install` は、カーネルを入れます。

### 問21 `LinuC201-2.01-021`

**正解**: `modules_install`、`make modules_install`

**テキスト**: 3. ビルドとインストール

`make modules_install` で、ビルドしたモジュールを `/lib/modules/<版>/` に入れます。ビルドは `make modules`(`make` だけでも作られます)です。

### 問22 `LinuC201-2.01-022`

**正解**: C

**テキスト**: 5. モジュールの設定と DKMS

DKMS は、カーネルの外にあるモジュールのソース(`/usr/src/<名前>-<版>/`)を、カーネルが更新されるたびに自動でビルドし直す仕組みです。

- A. `depmod` は、モジュールの依存関係の一覧(`modules.dep`)を作ります。ビルドはしません。
- B. `dracut` は、initramfs を作ります。
- D. `mkinitrd` は、古い initramfs を作る道具です。

### 問23 `LinuC201-2.01-023`

**正解**: B

**テキスト**: 3. ビルドとインストール

`make binrpm-pkg` は、バイナリの RPM だけを作ります。

- A. `make rpm-pkg` は、ソースの RPM とバイナリの RPM の両方を作ります。
- C. `make deb-pkg` は、Debian 系の `.deb` のパッケージを作ります。
- D. `make modules_install` は、パッケージを作らず、モジュールをその場に入れます。

### 問24 `LinuC201-2.01-024`

**正解**: A、C

**テキスト**: 4. initramfs を作る道具

`dracut` は Red Hat 系の標準で、`mkinitramfs` は Debian 系の道具です。古い `mkinitrd` もあります。

- A. `dracut` で作ります(`dracut -f` で作り直せます)。
- B. `depmod` は、モジュールの依存関係の一覧を作ります。
- C. `mkinitramfs` で作ります(`update-initramfs` が呼びます)。
- D. `modprobe` は、モジュールを読み込みます。

### 問25 `LinuC201-2.01-025`

**正解**: C

**テキスト**: 2. モジュールの操作

`lsmod` の `Used by` の列には、そのモジュールを使っているものが表示されます。使われている間は外せないので、使っているものを先に外します。

- A. `depmod -a` は依存関係の一覧を作り直すだけで、使用中の状態は変わりません。
- B. `modinfo` は、モジュールの情報を表示します。`/sys/module/<名前>/parameters/` でも今のパラメーターを見られますが、外せない理由は分かりません。
- D. `insmod` は読み込みのコマンドで、外せない理由とは関係がありません。

### 問26 `LinuC201-2.01-026`

**正解**: B

**テキスト**: 2. モジュールの操作

`modprobe` は、`modules.dep` を見て、依存するモジュールを先に読み込みます。名前だけを渡します。

- A. `insmod` は、ファイルのパスを指定して読み込むだけで、依存関係は解決しません。
- C. `rmmod` は、モジュールを外します。
- D. `depmod` は、`modules.dep` を作り直します。読み込みはしません。

### 問27 `LinuC201-2.01-027`

**正解**: `modinfo`

**テキスト**: 2. モジュールの操作

`modinfo e1000e` で、ファイル、説明、依存(`depends`)、パラメーター(`parm`)が表示されます。

### 問28 `LinuC201-2.01-028`

**正解**: A

**テキスト**: 4. /proc、/sys と sysctl

再起動の後も残すには、`/etc/sysctl.d/*.conf` に書きます(`/etc/sysctl.conf` は、Debian 13 では起動のときに読まれません)。起動のときに読み込まれます。すぐに反映するには、`sysctl --system`(`sysctl -p` は `/etc/sysctl.conf`)を使います。

- B. `sysctl -w` は、今の動きを変えるだけで、再起動すると元に戻ります。
- C. `/proc/sys` に書く方法も、今の動きだけを変え、再起動で戻ります。
- D. `sysctl -a` は、すべてのパラメーターを表示するだけです。

### 問29 `LinuC201-2.01-029`

**正解**: D

**テキスト**: 4. /proc、/sys と sysctl

`/proc/sys/` の下のパスの `/` を `.` に変え、`/proc/sys/` の部分を除いたものが名前です。`/proc/sys/kernel/hostname` は `kernel.hostname` になります。

- A. 名前は区切りに `.` を使います。`_` でつなぐ書き方はありません。
- B. `proc.sys` は、名前に含めません。
- C. `sys` も、名前に含めません。

### 問30 `LinuC201-2.01-030`

**正解**: `udevadm monitor`

**テキスト**: 6. udev

`udevadm monitor` は、カーネルのイベント(KERNEL)と、udev が処理したイベント(UDEV)を、リアルタイムに表示します。ルールを書くときは、`udevadm info -a -n /dev/sdb` で属性を調べます。

### 問31 `LinuC201-2.01-031`

**正解**: C

**テキスト**: 3. /etc/modprobe.d/

`blacklist` は、デバイスを見つけたときの自動の読み込みを止めます。手動の `modprobe` や、ほかのモジュールからの依存では、読み込まれることがあります。完全に止めるには、`install nouveau /bin/false` を使います。

- A. どんな場合でも、ということはありません。
- B. モジュールのファイルは消えません。
- D. 読み込まれていれば、`lsmod` に表示されます。

### 問32 `LinuC201-2.01-032`

**正解**: C、D

**テキスト**: 5. ハードウェアとログを調べる

`dmesg` は、カーネルのメッセージを表示します。`journalctl -k` は、systemd のジャーナルから、カーネルのメッセージだけを表示します。

- A. `lsmod` は、読み込まれているモジュールの一覧で、メッセージではありません。
- B. `lspci -k` は、PCI のデバイスと、使っているドライバーを表示します。メッセージではありません(USB なら `lsusb`)。
- C. `dmesg` で見られます(`-T` で時刻を読める形にできます)。
- D. `journalctl -k` で見られます(ジャーナルを永続化していれば、`-b -1` で前回の起動のログも見られます)。

### 問33 `LinuC201-2.01-033`

**正解**: `uname -r`、`uname --kernel-release`、`uname --release`、`cat /proc/sys/kernel/osrelease`、`sysctl -n kernel.osrelease`

**テキスト**: 1. 動いているカーネルを調べる

`uname -r` は、カーネルのリリース(版)だけを表示します。`uname -a` は、すべての情報を表示します。`/proc/sys/kernel/osrelease` にも、同じ文字列が入っています。

### 問34 `LinuC201-2.01-034`

**正解**: A

**テキスト**: 7. カーネルダンプ(考え方だけ)

kdump は、カーネルパニックのときに、メモリの内容を保存する仕組みです。起動のときに(`crashkernel=` で)ダンプ用のカーネルのメモリを確保しておき、パニックが起きると kexec で、そのカーネルへ切り替えます。保存した `vmcore` は、あとで解析します。試験では、設定ではなく、考え方が問われます。

- B. 起動のときのファイルシステムの検査は、fsck の役割です。
- C. カーネルのオプションを GRUB に書くのは、`/etc/default/grub` の役割です。
- D. コンパイルは、`make` の役割です。
