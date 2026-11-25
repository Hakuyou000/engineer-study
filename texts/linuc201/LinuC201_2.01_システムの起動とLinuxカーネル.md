# LinuC 201 テキスト 2.01 システムの起動とLinuxカーネル

電源を入れてから Linux が使える状態になるまでの流れ(ブートプロセス)、起動の動きを決める systemd、そしてカーネルそのもの(構成、コンパイル、実行中の管理)を学びます。Red Hat 系(AlmaLinux / RHEL 9 系)と Debian 系(Ubuntu 24.04 / Debian 12)で違うところは、両方書きます。

## 2.01.1 ブートプロセスとGRUB (重要度4)

### 1. 起動の全体の流れ

電源を入れてから、ログインできるまでの流れです。

```text
[firmware]     BIOS または UEFI。ハードウェアを調べ、起動するディスクを選ぶ
    |
    v
[GRUB]         ブートローダー。メニューを出し、カーネルを選んで読み込む
    |
    v
[kernel]       カーネルが動き出し、initramfs のドライバーで本物のルートを使えるようにする
    |
    v
[systemd]      PID 1。サービスを起動し、ターゲットに到達する
    |
    v
[login]        ログインの画面
```

- **ブートローダー**は、ディスクからカーネルを読み込んで実行を渡すプログラムです。Linux では GRUB(GRUB 2)がよく使われます。
- **initramfs**(**initrd**)は、起動の途中だけ使う小さなファイルシステムです。本物のルートファイルシステムを読むために必要なドライバー(ディスクやファイルシステムのカーネルモジュール)を、先にカーネルへ渡します。
- 起動の最後に、カーネルが最初のプロセスとして **systemd**(PID 1)を実行します。systemd がハードウェアの初期化の続き、ファイルシステムの検査とマウント、デーモン(裏で動くサービス)の起動を行います。

### 2. BIOS と UEFI

| | BIOS | UEFI |
|---|---|---|
| 呼び方 | 古い方式(レガシー BIOS) | 新しい方式。今の PC とサーバーの標準 |
| ブートローダーの探し方 | ディスクの先頭 512 バイト(MBR)を読む | ESP(EFI システムパーティション)の中の `.efi` ファイルを実行する |
| パーティション表 | MBR が中心 | GPT が中心 |
| ディスクの大きさ | MBR は約 2 TiB まで | GPT は 2 TiB を超えられる |
| 設定の道具 | なし(ファームウェアの画面で設定) | `efibootmgr`(Linux から起動の項目を操作) |

### 3. MBR

**MBR**(マスターブートレコード)は、ディスクの**先頭の 512 バイト**です。次の 3 つが入っています。

```text
先頭 512 バイト(MBR)
  0 - 445      ブートコード(446 バイト)。GRUB の最初の部分(boot.img)が入る
  446 - 509    パーティション表(64 バイト。16 バイト x 4 個 = 基本パーティションは 4 つまで)
  510 - 511    署名(0x55AA)
```

BIOS は、ここのブートコードを読んで実行します。ブートコードは入りきらないので、GRUB は後ろの部分(core.img)を MBR の後ろの空き(最初のパーティションの手前)に置いて読み込みます。これは MBR のパーティション表の場合です。BIOS で GPT のディスクを使うときは、core.img を **BIOS boot パーティション**(1 MiB ほどの専用のパーティション)に置きます。

### 4. ESP と UEFI シェル

- **ESP**(EFI システムパーティション)は、UEFI が読む専用のパーティションです。**FAT32** で作り、普通は `/boot/efi` にマウントします。
- 中に、ブートローダーの実行ファイル(`.efi`)が入ります。

```text
/boot/efi/
  +-- EFI/
        +-- ubuntu/    Ubuntu の場合。shimx64.efi、grubx64.efi、grub.cfg(小さな案内)
        +-- almalinux/ AlmaLinux の場合。同じような構成
        +-- BOOT/      BOOTX64.EFI。起動の項目がないときに使う既定の場所
```

- **efibootmgr** は、UEFI の起動の項目(ブートエントリ)を、Linux から見たり変えたりするコマンドです。

```bash
sudo efibootmgr -v                      # 起動の項目と、BootOrder(順番)を表示
sudo efibootmgr -o 0003,0001            # 起動の順番を変える
sudo efibootmgr -c -d /dev/sda -p 1 -L "Linux" -l '\EFI\linux\grubx64.efi'   # 項目を作る
```

- **UEFI シェル**は、UEFI のファームウェアの中で動く、小さなコマンドの環境です。ESP の中の `.efi` を手で実行できます。OS が起動しないときの確認に使います。
- UEFI シェルと、次に出てくる GRUB のシェルは別のものです。

### 5. GRUB のインストールと設定

| 作業 | Debian 系 | Red Hat 系 |
|---|---|---|
| ブートローダーを入れる | `grub-install` | `grub2-install` |
| 設定ファイルを作る | `grub-mkconfig -o /boot/grub/grub.cfg`(`update-grub` は、これを呼ぶ短い形) | `grub2-mkconfig -o /boot/grub2/grub.cfg` |
| 設定ファイルの場所 | `/boot/grub/grub.cfg` | `/boot/grub2/grub.cfg` |
| ユーザーが書く設定 | `/etc/default/grub` | `/etc/default/grub` |
| メニューの部品 | `/etc/grub.d/` の下のスクリプト | 同じ |

- RHEL 9 系の UEFI では、`grub2-install` を使いません(EFI では使えないようにされています。Secure Boot に対応しないためです)。ブートローダーは `dnf reinstall grub2-efi shim` で入れ直します。`grub2-install` は BIOS 用です。

- `grub.cfg` は **自動で作られるファイル** で、直接は編集しません。`/etc/default/grub` や `/etc/grub.d/` を変えて、`grub-mkconfig` で作り直します。
- RHEL 9 系では、UEFI でも本体は `/boot/grub2/grub.cfg` です。ESP の中の `/boot/efi/EFI/almalinux/grub.cfg` は、本体を読み込むだけの小さな案内です(RHEL 8 までは ESP の中の `grub.cfg` が本体でした)。
- RHEL 8 以降の Red Hat 系では、メニューの項目を BLS(Boot Loader Specification)の形で持ちます。`/boot/loader/entries/` に 1 項目 1 ファイルで置き、`grubby` で変えます。

```bash
sudo grub-install /dev/sda                                   # BIOS。ディスクを指定する(パーティションではない)
sudo grub-install --target=x86_64-efi --efi-directory=/boot/efi   # UEFI。ESP の場所を指定する
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

`/etc/default/grub` の主な項目です。

| 項目 | 意味 |
|---|---|
| `GRUB_DEFAULT` | 既定で起動する項目(`0` は 1 番目) |
| `GRUB_TIMEOUT` | メニューを出す秒数 |
| `GRUB_CMDLINE_LINUX` | 常にカーネルに渡すオプション |
| `GRUB_CMDLINE_LINUX_DEFAULT` | 通常の起動のときだけ渡すオプション(Debian 系) |

### 6. GRUB のメニューとシェル

起動のときにメニューが出たら、次のキーが使えます。

| キー | 動き |
|---|---|
| `e` | 選んだ項目を、その場で編集する(その 1 回だけ。保存はされない) |
| `c` | GRUB のコマンドライン(シェル)に入る |
| `Ctrl+x` または `F10` | 編集した内容で起動する |
| `Esc` | 編集をやめてメニューに戻る |

編集の画面では、`linux` で始まる行の最後にオプションを足します。たとえば `systemd.unit=rescue.target` を足すと、その 1 回だけレスキューモードで起動します。

GRUB のシェルでは、手でカーネルを読み込んで起動できます。

```text
grub> ls                                   パーティションの一覧(例 (hd0,gpt2))
grub> set root=(hd0,gpt2)                  ルートファイルシステム(/boot を含む)のパーティションを選ぶ
grub> linux /boot/vmlinuz-<version> root=/dev/sda2   カーネルと、ルートのデバイスを指定
grub> initrd /boot/initrd.img-<version>         initramfs を指定(Debian 系の名前)
grub> boot                                 起動する
```

### 7. /boot の中身

| | Debian 系 | Red Hat 系 |
|---|---|---|
| カーネル | `/boot/vmlinuz-6.8.0-xx-generic` | `/boot/vmlinuz-5.14.0-xxx.el9.x86_64` |
| initramfs | `/boot/initrd.img-6.8.0-xx-generic` | `/boot/initramfs-5.14.0-xxx.el9.x86_64.img` |
| カーネルの設定 | `/boot/config-<版>` | `/boot/config-<版>` |
| 記号の表 | `/boot/System.map-<版>` | `/boot/System.map-<版>` |
| GRUB | `/boot/grub/` | `/boot/grub2/` |
| ESP | `/boot/efi/` | `/boot/efi/` |

ポイントです。

- BIOS では GRUB を **ディスクの先頭(MBR)** に入れ、UEFI では **ESP の中** に入れます。
- `/boot` を別のパーティションに分ける構成もあります。GRUB は、そこからカーネルを読みます。

## 2.01.2 システム起動のカスタマイズ (重要度3)

### 1. ユニットとターゲット

systemd は、管理する対象を**ユニット**という単位で扱います。ユニットは設定ファイル(ユニットファイル)で定義します。

| 種類 | 拡張子 | 内容 |
|---|---|---|
| サービス | `.service` | デーモンなどのプログラム |
| ターゲット | `.target` | ユニットをまとめた「状態」(起動のゴール) |
| マウント | `.mount` | ファイルシステムのマウント |
| タイマー | `.timer` | 時刻や間隔で何かを起動する |
| ソケット | `.socket` | 通信が来たときにサービスを起動する |

**ターゲット**は、昔の「ランレベル」にあたります。

| ターゲット | 昔のランレベル | 意味 |
|---|---|---|
| `poweroff.target` | 0 | 電源を切る |
| `rescue.target` | 1 | レスキューモード(単一ユーザー) |
| `multi-user.target` | 3 | 複数ユーザーで、画面なし(サーバーの普通) |
| `graphical.target` | 5 | 複数ユーザーで、画面あり |
| `reboot.target` | 6 | 再起動 |
| `emergency.target` | - | 緊急モード(最小限) |

`default.target` は、起動で目指すターゲットへのリンクです。

```bash
systemctl get-default                       # 今の既定のターゲット
sudo systemctl set-default multi-user.target   # 既定を変える(次の起動から)
sudo systemctl isolate rescue.target        # 今すぐそのターゲットに移る
```

### 2. ユニットファイルの置き場所

```text
/etc/systemd/system/       管理者が置く。1 番目(いちばん優先)
/run/systemd/system/       実行中に作られる(再起動で消える)。2 番目
/usr/lib/systemd/system/   パッケージが入れる。3 番目
```

同じ名前のユニットが複数の場所にあると、上のほうが使われます。パッケージが入れたファイルを直接変えずに、`/etc/systemd/system/` に置いて上書きします。

- `/usr/lib/systemd/system/` を、パッケージの更新で上書きされないように、直接編集しないのが決まりです。
- Debian 系でも、実体は `/usr/lib/systemd/system/` です(`/lib` は `/usr/lib` へのリンク)。
- 一部だけ変えるときは `systemctl edit nginx.service` を使います。`/etc/systemd/system/nginx.service.d/override.conf` ができます。
- ユニットファイルを変えたら、`systemctl daemon-reload` で読み直します。

**systemd-delta** は、上書きや追加で「元から変えられているユニットファイル」を一覧にします。

```bash
systemd-delta                          # 上書き(OVERRIDDEN)、追加(EXTENDED)など
systemd-delta --type=overridden        # 上書きだけ
```

### 3. systemctl の基本

| コマンド | 動き |
|---|---|
| `systemctl status sshd` | 状態(動いているか、有効か、最近のログ) |
| `systemctl list-units` | 読み込まれているユニットの一覧(`--type=service`、`--all` で絞る、増やす) |
| `systemctl list-unit-files` | ユニットファイルの一覧と、有効か無効か |
| `systemctl start nginx` / `stop nginx` | 今すぐ起動 / 停止 |
| `systemctl restart nginx` / `reload nginx` | 再起動 / 設定の再読み込み |
| `systemctl enable nginx` | 起動時に自動で始まるようにする(今は起動しない) |
| `systemctl disable nginx` | 自動の起動をやめる(今の動きは止めない) |
| `systemctl enable --now nginx` | 有効にして、同時に今すぐ起動する |
| `systemctl mask nginx` | ユニットを `/dev/null` へのリンクにして、**手動でも起動できなくする** |
| `systemctl unmask nginx` | マスクを外す |
| `systemctl is-enabled nginx` / `is-active nginx` | 自動起動か / 動いているか |

`enable` と `start` は別です。`enable` は次の起動からの話、`start` は今の話です。


- `disable` したサービスは、手で `start` すれば動きます。`mask` したサービスは、手でも、ほかのユニットの依存からも起動しません。

### 4. レスキューモードと緊急モード

| | rescue.target(レスキュー) | emergency.target(緊急) |
|---|---|---|
| 起動するもの | 基本のサービスだけ | ほぼ何もない(シェルだけ) |
| ファイルシステム | ローカルのファイルシステムをマウントする | ルートを**読み取り専用**でマウントするだけ |
| 使う場面 | 設定の誤りで通常の起動ができない | `/etc/fstab` の誤りなど、レスキューでも起動しない |
| root のパスワード | 必要 | 必要 |

```bash
sudo systemctl rescue        # 動いているシステムをレスキューモードにする
sudo systemctl emergency     # 緊急モードにする
```

起動時に入る方法は、GRUB の編集画面で `linux` の行の最後に次を足します。

```text
systemd.unit=rescue.target         レスキューモードで起動
systemd.unit=emergency.target      緊急モードで起動
```

緊急モードで `/etc/fstab` を直すときは、まずルートを書き込みできる状態にします。

```bash
mount -o remount,rw /
```

## 2.01.3 Linux カーネルの構成要素 (重要度2)

### 1. カーネルイメージの種類

| 名前 | 内容 |
|---|---|
| `vmlinux` | 圧縮していない、ELF 形式のカーネルの本体。大きく、直接は起動に使わない |
| `vmlinuz` | `vmlinux` を圧縮したもの。名前の `z` は圧縮の意味。`/boot` にある実際のファイル名 |
| `zImage` | 圧縮したカーネルイメージの古い形式。大きさに制限がある |
| `bzImage` | big zImage。大きなカーネルも入る、**x86 の標準の形式** |

- `/boot/vmlinuz-<版>` の実体は、多くの場合 `bzImage` です。`file /boot/vmlinuz-*` で確かめられます。
- カーネルの圧縮には、gzip(既定)、bzip2、lzma、**xz**、lzo、lz4、zstd を、コンパイルの設定で選べます。xz は圧縮率が高く、展開は少し遅めです。

### 2. カーネルのバージョンと種類

[kernel.org](https://www.kernel.org/) では、次の種類が公開されます。

| 種類 | 内容 |
|---|---|
| mainline(開発版) | Linus Torvalds が管理する最新の版。新しい機能を入れる。`6.x-rc1` などの試験版もここ |
| stable(安定版) | mainline が出た後、不具合の修正だけを重ねる版(`6.8.1`、`6.8.2`…) |
| longterm(LTS) | 長い期間、修正を続ける版。サーバーやディストリビューションが好んで使う |
| linux-next | 次の版に入る予定の変更を集めたもの(開発者向け) |

- 版の番号は `6.8.12` のように、メジャー、マイナー、パッチの順です。昔(2.5 まで)は、2 番目の数が奇数の版が開発版でした(2.4 が安定版、2.5 が開発版)。2.6 からは、その決まりはありません。
- 差分の**パッチ**で、版を上げることができます。展開したソースの中で `xz -dc patch-6.8.12.xz | patch -p1` のように当てます。

### 3. ソースとドキュメント

- カーネルのソースコードは、普通 `/usr/src/` の下に置きます。`/usr/src/linux` は、使うソース(`/usr/src/linux-6.8.12` など)を指すシンボリックリンクにしておきます。
- ソースの中の **`Documentation/`**(`/usr/src/linux/Documentation/`)に、設定、ドライバー、カーネルのパラメーターの説明があります。
- ディストリビューションのパッケージ(Debian 系の `linux-doc`、Red Hat 系の `kernel-doc`)でも入れられます。

### 4. カーネルモジュール

- カーネルの機能は、本体に**組み込む**ものと、必要なときに読み込む**モジュール**に分けられます。
- モジュールの拡張子は `.ko`(圧縮して `.ko.xz` や `.ko.zst` になっていることもあります)。置き場所は `/lib/modules/<カーネルの版>/` です。
- 設定のとき、各機能に 3 つの選択があります。

| 選択 | 意味 |
|---|---|
| `y` | カーネル本体に組み込む(いつも使える) |
| `m` | モジュールにする(必要なときに読み込む) |
| `n` | 使わない |

起動に必要なドライバー(ルートのファイルシステムなど)を、モジュールにすると、initramfs がないと起動できません。

## 2.01.4 Linux カーネルのコンパイル (重要度2)

### 1. 全体の流れ

```text
[source]       /usr/src/linux にソースを用意する
    |
    v
[mrproper]     前の生成物と設定を消す(最初の 1 回)
    |
    v
[.config]      make menuconfig や make oldconfig で設定を作る
    |
    v
[make]         カーネル(bzImage)とモジュールを作る
    |
    v
[install]      make modules_install でモジュールを /lib/modules/<版>/ へ、カーネルを /boot へ
    |
    v
[initramfs]    dracut または mkinitramfs で作る
    |
    v
[grub.cfg]     grub-mkconfig または grub2-mkconfig で、メニューに出す
```

### 2. 設定(.config)

設定の内容は、ソースの最上位にある **`.config`**(`/usr/src/linux/.config`)に書かれます。`.` で始まるので、`ls` では `-a` が要ります。

| make のターゲット | 動き |
|---|---|
| `make config` | 質問に 1 つずつ答える(文字だけ。項目が多く大変) |
| `make menuconfig` | 文字の画面(ncurses)のメニュー。よく使う |
| `make xconfig` | Qt の画面。マウスで操作 |
| `make gconfig` | GTK の画面。マウスで操作 |
| `make oldconfig` | 今の `.config` を読み、**新しく増えた項目だけ**を質問する |
| `make defconfig` | その構成の標準の設定にする |
| `make mrproper` | 生成物と `.config` を含めて、すべて消す |
| `make clean` | 生成物は消すが、`.config` は残す |

- 今動いているカーネルの設定を引き継ぐには、`cp /boot/config-$(uname -r) .config` の後で、`make oldconfig` を使います。
- `make modules_install` は、モジュールを `/lib/modules/<版>/` に入れます。この版の名前は `make kernelrelease` の値で、ソースの版に `CONFIG_LOCALVERSION` を付けたものです。下の手順では `LOCALVERSION` に `-custom` を設定して、`6.8.12-custom` にしています。
- Ubuntu や RHEL の config は、`CONFIG_SYSTEM_TRUSTED_KEYS` に配布元の証明書のファイルを指定しています。素のソースにはそのファイルがないので、ビルドが止まります。`scripts/config` で空にしてからビルドします。
- ビルドには、`gcc`、`make`、`flex`、`bison`、`libelf` と `libssl` の開発用ファイル、(menuconfig なら)ncurses の開発用ファイルが要ります。

### 3. ビルドとインストール

| コマンド | 動き |
|---|---|
| `make` または `make all` | カーネル(`vmlinux`、`bzImage`)とモジュールを作る。`-j$(nproc)` で並列に |
| `make bzImage` | カーネルの圧縮イメージだけを作る(`arch/x86/boot/bzImage`) |
| `make modules` | モジュールだけを作る |
| `make modules_install` | モジュールを `/lib/modules/<版>/` に入れる(`depmod` も実行される) |
| `make install` | カーネルを `/boot` に入れ、initramfs を作り、ブートローダーの設定も更新する(ディストリビューションの仕組みによる) |

手でカーネルを入れる場合です。

```bash
cd /usr/src/linux
sudo make mrproper
cp /boot/config-$(uname -r) .config
make oldconfig
scripts/config --set-str LOCALVERSION "-custom"     # 版の名前に -custom を付ける
scripts/config --set-str SYSTEM_TRUSTED_KEYS ""     # 配布元の証明書を指す設定を外す
scripts/config --set-str SYSTEM_REVOCATION_KEYS ""
make olddefconfig
make kernelrelease                              # 版の名前を確かめる(6.8.12-custom)
make -j"$(nproc)"
sudo make modules_install
sudo cp arch/x86/boot/bzImage /boot/vmlinuz-6.8.12-custom
sudo cp System.map /boot/System.map-6.8.12-custom
sudo cp .config /boot/config-6.8.12-custom
sudo mkinitramfs -o /boot/initrd.img-6.8.12-custom 6.8.12-custom     # Debian 系
sudo dracut /boot/initramfs-6.8.12-custom.img 6.8.12-custom          # Red Hat 系
sudo grub-mkconfig -o /boot/grub/grub.cfg       # Red Hat 系は grub2-mkconfig -o /boot/grub2/grub.cfg
```

**パッケージを作る** make のターゲットもあります。作ったパッケージを、他のサーバーに配れます。

| ターゲット | 作るもの |
|---|---|
| `make rpm-pkg` | ソースと、バイナリの RPM |
| `make binrpm-pkg` | バイナリの RPM だけ(ソースの RPM は作らない) |
| `make deb-pkg` | `.deb` のパッケージ |

### 4. initramfs を作る道具

| 道具 | 使う場所 |
|---|---|
| `dracut` | Red Hat 系の標準。`dracut -f` で、今のカーネルの initramfs を作り直す |
| `mkinitramfs` | Debian 系。`update-initramfs -u` が、内部でこれを呼ぶ |
| `mkinitrd` | 古い道具。昔の Red Hat 系と SUSE で使った |

### 5. モジュールの設定と DKMS

- `make modules_install` は、最後に `depmod` も実行して、モジュールの依存関係の一覧(`modules.dep`)を作ります。手でモジュールを置いたときは、`depmod` を実行します。
- モジュールの動きの設定は、`/etc/modprobe.d/*.conf` に書きます(2.01.5 で詳しく扱います)。
- **DKMS**(Dynamic Kernel Module Support)は、カーネルの外にあるモジュール(ドライバーなど)を、**カーネルが更新されるたびに自動でビルドし直す**仕組みです。

```bash
sudo dkms add -m example -v 1.0          # /usr/src/example-1.0/ の dkms.conf を登録
sudo dkms build -m example -v 1.0        # 今のカーネルに対して、ビルドする
sudo dkms install -m example -v 1.0      # /lib/modules/<版>/ に入れる
dkms status                              # 登録とビルドの状態
```

- ソースは `/usr/src/<名前>-<版>/` に置き、`dkms.conf` に、どう作るかを書きます。
- DKMS を使うと、カーネルを更新するたびに手でビルドしなくてよくなります(ビルドに必要な `kernel-devel` や `linux-headers` が要ります)。

## 2.01.5 カーネル実行時における管理とトラブルシューティング (重要度3)

### 1. 動いているカーネルを調べる

| コマンド | 内容 |
|---|---|
| `uname -r` | カーネルの版(`6.8.0-31-generic`) |
| `uname -a` | すべての情報(カーネルの名前、ホスト名、版、アーキテクチャなど) |
| `uname -m` | ハードウェアのアーキテクチャ(`x86_64`) |
| `cat /proc/version` | カーネルの版とビルドの情報 |
| `cat /proc/cmdline` | 起動のときに渡されたカーネルのオプション |

### 2. モジュールの操作

```text
modprobe e1000e
    |
    v
[modules.dep]   /lib/modules/<版>/ の依存の一覧を見て、先に読むものを決める
    |
    v
[kernel]        依存するモジュール、続けて e1000e の順に読み込む
```

| コマンド | 動き |
|---|---|
| `lsmod` | 読み込まれているモジュールの一覧(名前、大きさ、使われている数 `Used by`)。`/proc/modules` の整形 |
| `modinfo e1000e` | モジュールの情報(ファイル、説明、依存、**パラメーター**(`parm`)) |
| `modprobe e1000e` | モジュールを、**依存するものも含めて**読み込む。名前だけ指定(パスは不要) |
| `modprobe -r e1000e` | 取り外す。e1000e が依存しているモジュールも、ほかに使われていなければ一緒に外す |
| `insmod /path/e1000e.ko` | **ファイルのパスを指定して**読み込む。依存関係は解決しない |
| `rmmod e1000e` | 取り外す。依存関係は考えない。使われていると外せない |
| `depmod -a` | `/lib/modules/<版>/modules.dep` を作り直す |

- `modprobe` を使うのが普通です。`insmod` と `rmmod` は、低いレベルの道具です。
- `lsmod` の `Used by` が 0 でないモジュールは、取り外せません(`rmmod: ERROR: Module e1000e is in use`)。使っているものを先に外します。
- パラメーターを付けて読み込むには `modprobe snd_hda_intel index=1` のようにします。今のパラメーターは `/sys/module/<名前>/parameters/` で見ます。

### 3. /etc/modprobe.d/

`/etc/modprobe.d/*.conf` に、モジュールの設定を書きます。

```text
# /etc/modprobe.d/example.conf
# 読み込むときのパラメーターを決める
options snd_hda_intel index=1
# 別名を付ける(modprobe eth-fast で読み込める)
alias eth-fast e1000e
# 自動では読み込まない(手動なら読める)
blacklist nouveau
# 読み込みの代わりにコマンドを実行する(実質的な禁止)
install usb-storage /bin/false
```

- コメントは、行の先頭の `#` だけです。行の途中に `#` を書くと、その後ろも設定の一部として読まれます。

- `blacklist` は、デバイスを見つけたときの**自動の読み込み**を止めるだけです。別のモジュールの依存や、手での `modprobe` で読み込まれることはあります。完全に止めるには `install モジュール /bin/false` を使います。
- 設定を変えた後、initramfs の中のモジュールにも関わるときは、initramfs を作り直します(`dracut -f`、`update-initramfs -u`)。

### 4. /proc、/sys と sysctl

| 場所 | 内容 |
|---|---|
| `/proc/` | プロセスとカーネルの今の状態を見せる仮想のファイルシステム |
| `/sys/`(**sysfs**) | デバイス、ドライバー、モジュールの情報を、木の形で見せる |
| `/proc/sys/kernel/` | カーネルの設定の値(書き換えると、すぐ反映) |

**sysctl** は、`/proc/sys/` の下のカーネルのパラメーターを、見たり変えたりするコマンドです。名前は、パスの `/` を `.` に変えたものです。

| パス | sysctl の名前 |
|---|---|
| `/proc/sys/net/ipv4/ip_forward` | `net.ipv4.ip_forward` |
| `/proc/sys/kernel/hostname` | `kernel.hostname` |

```bash
sysctl -a                                    # すべて表示
sysctl net.ipv4.ip_forward                   # 1 つを表示
sudo sysctl -w net.ipv4.ip_forward=1         # 今の動きを変える(再起動で戻る)
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward   # 同じ意味
sudo sysctl -p                               # /etc/sysctl.conf を読み込む
sudo sysctl --system                         # /etc/sysctl.d/*.conf などもすべて読み込む
```

再起動しても残すには、`/etc/sysctl.d/*.conf` に、`net.ipv4.ip_forward = 1` の形で書きます。`/etc/sysctl.conf` も Red Hat 系や Ubuntu では起動のときに読まれますが、Debian 13 では読まれません。

### 5. ハードウェアとログを調べる

| コマンド | 内容 |
|---|---|
| `lspci` | PCI のデバイス。`-k` で使っているドライバー(`Kernel driver in use`)も |
| `lsusb` | USB のデバイス。`-t` で木の形 |
| `lsdev` | 入出力のアドレスや割り込みの使用の一覧(`procinfo` のパッケージに入る。入っていないことも多い) |
| `dmesg` | カーネルのメッセージ(起動時のデバイスの認識、エラー)。`-T` で時刻を読める形に、`--level=err,warn` で絞る |
| `journalctl -k` | systemd のジャーナルのカーネルのメッセージ(`dmesg` と同じ内容) |
| `journalctl -b` | 今回の起動のログ(`-b -1` で前回) |
| `journalctl -u sshd` | ユニット(サービス)ごとのログ |
| `journalctl -p err` | エラー以上だけ |

- Ubuntu では、一般ユーザーが `dmesg` を使えないことがあります(`sudo` が要る)。
- 再起動すると `dmesg` の内容は消えます。前回の起動のログを見るには、ジャーナルを永続化して、`journalctl -b -1` を使います。`/var/log/journal/` がなければ作ります(ディストリビューションによっては最初からあります)。

### 6. udev

**udev** は、デバイスを見つけたとき(カーネルのイベント)に、デバイスのファイルの作成や、名前の付け方を決める仕組みです。

```text
[device]       デバイスを接続する
    |
    v
[kernel]       イベント(uevent)を送る
    |
    v
[udevd]        systemd-udevd が、ルールを調べる
    |
    v
[/dev]         デバイスファイルを作り、名前、リンク、権限、実行するコマンドを決める
```

| 場所 | 内容 |
|---|---|
| `/etc/udev/rules.d/` | 管理者が書くルール。優先される |
| `/usr/lib/udev/rules.d/` | ディストリビューションとパッケージのルール(Debian 系では `/lib/udev/rules.d/`) |
| `/etc/udev/udev.conf` | udev 全体の設定 |

ルールのファイル名は `数字-名前.rules`(例 `99-backupdisk.rules`)で、**ファイル名の順**に処理されます。

```text
# /etc/udev/rules.d/99-backupdisk.rules
SUBSYSTEM=="block", ENV{ID_SERIAL_SHORT}=="ABC123", SYMLINK+="backupdisk"
```

- `==` は条件の比較、`=` と `+=` は動作(代入と追加)です。

```bash
udevadm monitor                          # イベントを、リアルタイムで表示(接続や取り外しを確かめる)
udevadm info -a -n /dev/sdb              # デバイスの属性を、ルールに書ける形で表示
udevadm test /sys/class/block/sdb        # ルールを試して、結果を表示
sudo udevadm control --reload            # ルールを読み直す
sudo udevadm trigger                     # イベントをもう一度起こして、ルールを適用
```

### 7. カーネルダンプ(考え方だけ)

- カーネルが致命的な誤りで止まったとき(**カーネルパニック**)に、メモリの内容を保存する仕組みが **kdump** です。
- 起動のときに、あらかじめ小さな**ダンプ用のカーネル**のためのメモリを確保しておきます(`crashkernel=` のオプション)。
- パニックが起きると、**kexec** という仕組みが、BIOS / UEFI を通らずに、そのダンプ用のカーネルへ切り替えます。そのカーネルが、止まったカーネルのメモリを `vmcore` というファイルに保存します(`/var/crash/` など)。
- `vmcore` は、`crash` というコマンドなどで解析します。試験では、設定は問われず、考え方だけが問われます。

```text
[kernel] --panic--> [kexec] --> [dump kernel] --> vmcore を保存 --> 再起動
```
