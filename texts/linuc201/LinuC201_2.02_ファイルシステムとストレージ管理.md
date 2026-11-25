# LinuC 201 テキスト 2.02 ファイルシステムとストレージ管理

ファイルシステムを起動のたびに正しくマウントする設定(`/etc/fstab`、UUID、スワップ)、ファイルシステムの種類ごとの道具(ext4、XFS、Btrfs)、ディスクの健康状態の監視(SMART)、そして LVM(論理ボリュームマネージャ)の運用を学びます。LinuC 101 の 1.05 で学んだ基本を、運用で使う一段深い形で学び直します。

## 2.02.1 ファイルシステムの設定とマウント (重要度3)

### 1. 起動時のマウントの流れ

- **マウント**は、ファイルシステムをディレクトリの木の中の場所(**マウントポイント**)につなぐことです。
- 起動のときのマウントは `/etc/fstab` に書きます。systemd は、起動の早い段階で fstab を読み、1 行ごとに **mount ユニット**(`〜.mount`)を自動で作ります。

```text
/etc/fstab                       1 行 1 つのマウント
  |
  |  systemd-fstab-generator が起動のときに読む
  v
mount ユニット: /data は data.mount、/var/lib/app は var-lib-app.mount
  |
  |  local-fs.target(ローカルのディスク)の前にそろえる
  v
マウントされる: 失敗すると、nofail がない限り緊急モードになる
```

- mount ユニットの名前は、マウントポイントの `/` を `-` に変えたものです。`systemd-escape -p --suffix=mount /var/lib/app` で作れます。
- fstab を書き換えたら、`systemctl daemon-reload` で systemd に読み直させます。
- `mount` コマンドで手でマウントしても、mount ユニットに状態が現れます(`systemctl status data.mount`)。

### 2. ディスクを UUID で見分ける

`/dev/sdb1` のような名前は、ディスクをつなぐ順番や、台数の増減で変わることがあります。ファイルシステムを作ったときに付く **UUID** は変わらないので、fstab では UUID で書くのが安全です。

| コマンド | 内容 |
|---|---|
| `blkid` | デバイスごとの UUID、LABEL、種類を表示する(root が必要) |
| `blkid /dev/sdb1` | 1 つのデバイスだけ |
| `lsblk -f` | ツリーの形で、種類、LABEL、UUID、マウントポイントを表示する |
| `lsblk -o NAME,SIZE,TYPE,UUID,MOUNTPOINT` | 見たい列を選ぶ |
| `ls -l /dev/disk/by-uuid/` | udev が作る、UUID から `/dev/sdX` への別名 |
| `findmnt` | マウントの一覧を木の形で表示する |

```bash
$ sudo blkid /dev/sdb1
/dev/sdb1: UUID="3f6e9c0a-1d2b-4c7e-8a55-2b9d5e6a77c1" TYPE="xfs" PARTUUID="a1b2c3d4-01"
$ lsblk -f /dev/sdb
NAME   FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sdb
`-sdb1 xfs          data  3f6e9c0a-1d2b-4c7e-8a55-2b9d5e6a77c1   18.2G     3% /data
```

- **LABEL**(ファイルシステムに付ける名前)や **PARTUUID**(パーティションの識別子)でも指定できます。`LABEL=data`、`PARTUUID=…` と書きます。
- ディスクを丸ごとコピーすると、UUID が同じファイルシステムが 2 つできます。ext 系は `tune2fs -U random /dev/sdc1` で、XFS は `xfs_admin -U generate /dev/sdc1` で付け直します。XFS は UUID が同じものを同時にマウントできず、`mount -o nouuid` で逃げる方法もあります。

### 3. /etc/fstab を書く

```
# <デバイス>                              <マウントポイント> <種類> <オプション>        <dump> <fsck>
UUID=3f6e9c0a-1d2b-4c7e-8a55-2b9d5e6a77c1 /data              xfs    defaults,noatime    0      0
UUID=9a1d5b30-7c44-4e0f-b3a2-6d1e0c9f4477 /data/backup       ext4   defaults,nofail     0      2
//nas01/share                             /mnt/nas           cifs   _netdev,noauto      0      0
/swapfile                                 none               swap   defaults            0      0
```

| 欄 | 内容 |
|---|---|
| 1 | デバイス(`UUID=…`、`LABEL=…`、`/dev/…`、ネットワークの共有) |
| 2 | マウントポイント(スワップは `none`) |
| 3 | 種類(`ext4`、`xfs`、`btrfs`、`nfs`、`swap` など) |
| 4 | オプション(`defaults` は rw、suid、dev、exec、auto、nouser、async) |
| 5 | dump の対象にするか(0 は対象にしない) |
| 6 | 起動のときの fsck の順番(0 は調べない、1 は `/`、2 はそのほか)。XFS と Btrfs は fsck を使わないので 0 |

| オプション | 意味 |
|---|---|
| `noauto` | 起動のとき、`mount -a` のときにマウントしない(手でマウントする) |
| `nofail` | ディスクがなくても、起動を止めない(外付けのディスクなど) |
| `_netdev` | ネットワークが使えるようになってからマウントする(NFS、iSCSI など) |
| `noatime` | 読むたびにアクセス時刻を書かない(書き込みが減る) |
| `ro`、`noexec`、`nosuid` | 読み取りだけ、実行不可、SUID を無効にする |
| `x-systemd.automount` | 最初にアクセスされたときにマウントする(systemd の拡張) |

- 書いたら、再起動の前に必ず確かめます。`sudo mount -a`(まだマウントされていないものをすべてマウントする)がエラーなしで終わり、`findmnt --verify` が問題を出さなければ大丈夫です。
- **マウントの順番**は、fstab の上から下の順です。ただし systemd は、マウントポイントの親子の関係を見て並べます。`/data` の下の `/data/backup` は、`/data` の後にマウントされます。
- 親より先に子をマウントすると、子のマウントが親に隠れてしまいます。手で `mount -a` を使うときや、古い init では、親を上に書きます。

```text
/                  1. 最初にマウント(ルートファイルシステム)
  `-- data         2. 次にマウント
        `-- backup 3. その下にマウント(親の後でないと、親に隠れて見えなくなる)
```

### 4. mount と umount、マウントの状態

```bash
mount /dev/sdb1 /data                         # 種類は自動で判定
mount -t xfs -o ro UUID=3f6e9c0a-... /data    # 種類とオプションを指定。UUID でもよい
mount -o remount,rw /data                     # マウントしたまま、オプションを変える
mount --bind /data/www /srv/www               # 同じディレクトリを別の場所にも見せる
mount -a                                      # fstab のもの(noauto 以外)をマウントする
umount /data                                  # 外す(umount /dev/sdb1 でもよい)
umount -l /data                               # lazy。使い終わった後で外す
```

- 使用中の `umount` は `target is busy` で失敗します。`lsof /data` や `fuser -vm /data` で使っているプロセスを探して止めます。
- マウントの状態を見る場所は次のとおりです。

| 場所 | 内容 |
|---|---|
| `/proc/mounts` | カーネルが持つ、今のマウントの一覧(本物) |
| `/etc/mtab` | 昔は mount が書く一覧。今は `/proc/self/mounts` への**シンボリックリンク**になっているのが一般的で、中身は `/proc/mounts` と同じ |
| `findmnt` | どちらも木の形に見やすくしたもの |
| `systemctl list-units -t mount` | systemd が持つ mount ユニットの一覧 |

### 5. スワップ

**スワップ**は、メモリが足りないときに、使っていないメモリの中身を書き出すディスク上の領域です。パーティションでも、ファイルでも作れます。

```bash
# パーティションをスワップにする
sudo mkswap /dev/sdb2                      # スワップ領域にする(UUID が表示される)
sudo swapon /dev/sdb2                      # 使い始める
# ファイルをスワップにする
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048   # 2 GiB。fallocate -l 2G /swapfile でもよい
sudo chmod 600 /swapfile                   # 他の人に読まれないようにする(必須に近い)
sudo mkswap /swapfile
sudo swapon /swapfile
swapon --show                              # 使っているスワップの一覧(swapon -s、free -h でも)
sudo swapoff /swapfile                     # 使うのをやめる
sudo swapon -a                             # fstab の swap をすべて有効にする
```

- fstab には `UUID=… none swap defaults 0 0`(パーティション)や `/swapfile none swap defaults 0 0`(ファイル)と書きます。
- 優先度は `pri=` のオプションで決めます(`defaults,pri=10`)。大きいほうが先に使われます。
- `swapoff` は、スワップの中身をメモリに戻すので、メモリが足りないと失敗したり、とても時間がかかったりします。
- ファイルのスワップは、穴(未割り当ての範囲)があってはいけません。XFS と ext4 では `fallocate` で作れます。Btrfs では特別な作り方が要ります(`btrfs filesystem mkswapfile`。使えるバージョンは【要確認】)。

## 2.02.2 ファイルシステムの管理 (重要度4)

### 1. ファイルシステムの種類と道具

| 種類 | 作る | 調べる、直す | 設定を見る、変える | 大きさを変える | バックアップ |
|---|---|---|---|---|---|
| ext4 | `mkfs.ext4` | `fsck.ext4`(`e2fsck`) | `tune2fs`、`dumpe2fs` | `resize2fs` | `dump`、`restore` |
| XFS | `mkfs.xfs` | `xfs_repair` | `xfs_info`、`xfs_admin` | `xfs_growfs`(**広げるだけ**) | `xfsdump`、`xfsrestore` |
| Btrfs | `mkfs.btrfs` | `btrfs check`、`btrfs scrub` | `btrfs filesystem` | `btrfs filesystem resize` | サブボリュームのスナップショット |

- `mkfs`(make file system)は、デバイスにファイルシステムを作る道具です。`mkfs -t ext4 /dev/sdb1` と `mkfs.ext4 /dev/sdb1` は同じ結果になります。**作ると中身は消えます**。
- `fsck`(file system check)は、ファイルシステムを調べて直す道具です。`fsck.ext4`、`fsck.xfs` などの種類ごとの道具を呼び出します。**マウントしていない状態で**実行します。
- 既定の種類は、Red Hat 系(AlmaLinux / RHEL 9 系)では **XFS**、Debian 系(Ubuntu 24.04、Debian 12)では **ext4** です。RHEL 系の 9 では、Btrfs は標準で使えません(Ubuntu と Debian では使えます)。

### 2. ext4 の道具

```bash
sudo mkfs.ext4 -L data /dev/sdb1          # LABEL を付けて作る
sudo tune2fs -l /dev/sdb1                 # スーパーブロック(ファイルシステムの設定)を見る
sudo dumpe2fs -h /dev/sdb1                # 同じ内容を、見出しだけ詳しく(-h)
sudo tune2fs -L backup /dev/sdb1          # LABEL を変える
sudo tune2fs -U random /dev/sdb1          # UUID を付け直す
sudo tune2fs -m 1 /dev/sdb1               # root 用の予約ブロックを 1 % にする(既定は 5 %)
sudo tune2fs -O ^has_journal /dev/sdb1    # ジャーナルを外す(^ は機能を外す)
sudo e2fsck -f /dev/sdb1                  # 強制的に調べる(-n は直さず調べるだけ、-p は自動で直す)
sudo resize2fs /dev/sdb1                  # デバイスの大きさに合わせて広げる
```

- **スーパーブロック**は、ブロックの大きさ、空きの数、UUID、最後にマウントした時刻など、ファイルシステム全体の情報を持つ場所です。`tune2fs -l` と `dumpe2fs -h` で、その内容を見られます。
- `dumpe2fs`(`-h` なし)は、ブロックグループごとの詳しい情報も出すので、長くなります。
- **広げる**のは、マウントしたまま(オンライン)でできます。**縮める**のは、マウントを外して `e2fsck -f` で調べてからです。
- ext 系のバックアップ用の `dump` と `restore` は、ファイルシステム単位で保存します。

```bash
sudo dump -0uf /backup/sdb1.dump /dev/sdb1     # レベル 0(全体)で保存する。-u で記録を残す
sudo dump -1uf /backup/sdb1.d1 /dev/sdb1       # レベル 1(レベル 0 の後の変更だけ)
cd /mnt/restore && sudo restore -rf /backup/sdb1.dump   # 今のディレクトリに全体を戻す(-r)
sudo restore -if /backup/sdb1.dump             # 対話の形で、必要なファイルだけを選んで戻す(-i)
```

### 3. XFS の道具

```bash
sudo mkfs.xfs -L data /dev/sdb2           # 作る
sudo xfs_info /data                       # マウントポイントを指定して、大きさやブロックの情報を見る
sudo xfs_growfs /data                     # 広げる(マウントしたまま。縮めることはできない)
sudo xfs_admin -L backup /dev/sdb2        # LABEL を変える(マウントを外して)
sudo xfs_admin -U generate /dev/sdb2      # UUID を付け直す(マウントを外して)
sudo umount /data
sudo xfs_repair -n /dev/sdb2              # 直さず調べるだけ(-n)
sudo xfs_repair /dev/sdb2                 # 直す
```

- `xfs_info` と `xfs_growfs` は、**マウントポイント**を指定します。`xfs_repair` と `xfs_admin` は、**デバイス**を指定し、マウントを外してから実行します。
- 古い `xfs_check` は、`xfs_repair -n` に置き換えられて、今のバージョンでは使われません。
- XFS は、`fsck.xfs` を実行しても何もしません(起動のときに fsck を実行しない設計です)。壊れたら `xfs_repair` を使います。
- XFS のバックアップの道具は **xfsdump**(保存)と **xfsrestore**(戻す)です。

```bash
sudo xfsdump -l 0 -L full -M media0 -f /backup/data.xfsdump /data   # レベル 0 で保存
sudo xfsrestore -f /backup/data.xfsdump /mnt/restore                # 別の場所に戻す
```

### 4. Btrfs の基本

**Btrfs** は、Linux のファイルシステムで、**サブボリューム**と**スナップショット**、複数のディスクをまとめる機能、チェックサムを持ちます。

- **サブボリューム**は、1 つの Btrfs の中にある、ディレクトリのように見える独立した領域です。別々にマウントしたり、スナップショットを取ったりできます。
- **スナップショット**は、サブボリュームのある時点の状態を保存したものです。**Copy-on-Write**(書き換えるときは、元のデータを上書きせず、別の場所に書く仕組み)なので、作るのは一瞬で、変更があるまで容量をほとんど使いません。

```text
サブボリューム @data: 変更を続ける
  |  btrfs subvolume snapshot
  v
スナップショット @snap1: この時点のデータを指す(最初はデータを共有している)
  |
  v
@data を書き換える: 書き換えた部分だけ、新しい場所に書く。@snap1 は元のデータを指し続ける
```

```bash
sudo mkfs.btrfs -L pool /dev/sdb3
sudo mount /dev/sdb3 /mnt/pool
sudo btrfs subvolume create /mnt/pool/data                       # サブボリュームを作る
sudo btrfs subvolume list /mnt/pool                              # 一覧
sudo btrfs subvolume snapshot /mnt/pool/data /mnt/pool/data_snap1       # スナップショット(書き込み可)
sudo btrfs subvolume snapshot -r /mnt/pool/data /mnt/pool/data_ro       # 読み取り専用(-r)
sudo btrfs subvolume delete /mnt/pool/data_snap1                 # 消す
sudo mount -o subvol=data /dev/sdb3 /data                        # サブボリュームだけをマウントする
sudo btrfs filesystem show                                       # ディスクの構成
sudo btrfs filesystem df /mnt/pool                               # 使用量(種類ごと)
sudo btrfs scrub start /mnt/pool                                 # チェックサムで全体を調べる
```

- Btrfs の通常のスナップショットは、**同じ Btrfs の中**にあります。ディスクが壊れたときの備えには、別のディスクにコピーしてください(`btrfs send` と `btrfs receive`)。
- Btrfs には、通常の `fsck` に当たるものはありません。`btrfs check`(マウントを外して実行)は、**最後の手段**です。

### 5. ext4 から Btrfs に変換する

**btrfs-convert** は、データを残したまま、ext 系のファイルシステムを Btrfs に変換します。

```bash
sudo umount /dev/sdb1                       # マウントを外す(ルートは変換できない。レスキューの環境で)
sudo e2fsck -f /dev/sdb1                    # 先に調べる(変換の条件)
sudo btrfs-convert /dev/sdb1                # 変換する
sudo mount /dev/sdb1 /data
sudo btrfs subvolume list /data             # 元の ext4 を保存した ext2_saved が見える
sudo umount /data
sudo btrfs-convert -r /dev/sdb1             # 元の ext4 に戻す(-r、rollback)
```

- 元の ext4 のデータは、`ext2_saved` というサブボリュームに残ります。これが残っている間は、`btrfs-convert -r` で戻せます。
- 問題がなければ、`btrfs subvolume delete /data/ext2_saved` で消して容量を空けます。消すと、元には戻せません。
- 変換の前にバックアップを取ります。

### 6. ディスクの健康状態の監視(SMART)

**SMART** は、HDD や SSD が自分の状態を記録する仕組みです。壊れる前の兆候を見つけるために使います。道具は **smartmontools** パッケージの `smartctl`(手で調べる)と `smartd`(常駐して見張る)です。

```bash
sudo smartctl -i /dev/sda                 # 機種、容量、SMART が使えるか
sudo smartctl -H /dev/sda                 # 全体の判定(PASSED か FAILED)
sudo smartctl -A /dev/sda                 # 属性の一覧(再割り当て、電源の時間など)
sudo smartctl -a /dev/sda                 # すべての情報
sudo smartctl -t short /dev/sda           # 短い自己診断(数分)を始める。long は数時間
sudo smartctl -l selftest /dev/sda        # 自己診断の結果
sudo smartctl -a /dev/nvme0               # NVMe の SSD
```

| 属性 | 見方 |
|---|---|
| `Reallocated_Sector_Ct` | 悪くなって、予備に移した領域の数。増えていくと危ない |
| `Current_Pending_Sector` | 移すか迷っている、読めない領域の数。0 以外は注意 |
| `Power_On_Hours` | 電源を入れていた時間 |
| `Temperature_Celsius` | 温度 |

- `smartd` は、設定ファイルに従って(Debian 系は `/etc/smartd.conf`、Red Hat 系は `/etc/smartmontools/smartd.conf` 【要確認】)、決まった間隔でディスクを調べ、問題があればメールなどで知らせます。

```
# smartd.conf の例
DEVICESCAN -a -m root                              # 見つけたすべてのディスクを監視し、異常を root に知らせる
/dev/sda -a -s (S/../.././02|L/../../6/03) -m root # 毎日 2 時に短い診断、毎週土曜 3 時に長い診断
```

- 起動は `sudo systemctl enable --now smartd` です。Debian 系ではサービスの名前が `smartmontools` のことがあります【要確認】。
- 「PASSED」でも安心できません。属性の増え方を見ます。**SMART は壊れる前の兆候を見つける手段で、故障を防ぐものではない**ので、バックアップが前提です。

## 2.02.3 論理ボリュームマネージャの設定と管理 (重要度3)

### 1. LVM の部品と流れ

**LVM** は、複数のディスクをまとめて、必要な大きさに切り分け、後から大きさを変えられる仕組みです。

| 部品 | 略 | 内容 | 主なコマンド |
|---|---|---|---|
| 物理ボリューム | PV | LVM に使うディスクやパーティション | `pvcreate`、`pvs`、`pvdisplay`、`pvremove`、`pvmove` |
| ボリュームグループ | VG | PV をまとめた容量の入れ物 | `vgcreate`、`vgs`、`vgextend`、`vgreduce`、`vgrename`、`vgchange`、`vgremove` |
| 論理ボリューム | LV | VG から切り出した、ファイルシステムを作る領域 | `lvcreate`、`lvs`、`lvextend`、`lvreduce`、`lvresize`、`lvrename`、`lvchange`、`lvremove` |

- コマンドは、PV は `pv`、VG は `vg`、LV は `lv` で始まります。表示は `〜s`(1 行ずつ)と `〜display`(詳しく)の 2 種類があります。
- VG の容量は **PE**(物理エクステント。既定は 4 MiB)という単位に分けられ、LV はその整数倍の大きさになります。

```text
/dev/sdb1   /dev/sdc1          パーティション(またはディスク)
    |           |
 pvcreate    pvcreate          PV にする
    |           |
    +-----+-----+
          |  vgcreate vg01 /dev/sdb1 /dev/sdc1
          v
        [vg01]                 VG(容量をまとめた入れ物)
          |
    +-----+-----+
    |           |
 lvcreate    lvcreate          必要な分だけ切り出す
    |           |
[lv_data]   [lv_log]           LV(/dev/vg01/lv_data、/dev/mapper/vg01-lv_data)
    |
 mkfs.xfs + mount              ファイルシステムを作ってマウントする
```

### 2. 作る

```bash
sudo pvcreate /dev/sdb1 /dev/sdc1                  # PV にする
sudo vgcreate vg01 /dev/sdb1 /dev/sdc1             # VG を作る
sudo lvcreate -L 10G -n lv_data vg01               # 10 GiB の LV
sudo lvcreate -l 100%FREE -n lv_log vg01           # VG の空きをすべて使う
sudo mkfs.xfs /dev/vg01/lv_data                    # ファイルシステムを作る
sudo mount /dev/vg01/lv_data /data
sudo pvs; sudo vgs; sudo lvs                       # それぞれの一覧
```

- fstab には `/dev/vg01/lv_data /data xfs defaults 0 0` と書きます。LV の名前は変わらないので、UUID にしなくてもかまいません(UUID でも書けます)。

### 3. VG と LV を変える

| 操作 | コマンド |
|---|---|
| VG に PV を足す | `vgextend vg01 /dev/sdd1` |
| VG から PV を外す | `pvmove /dev/sdd1`(中身を他の PV に移す)→ `vgreduce vg01 /dev/sdd1` → `pvremove /dev/sdd1` |
| VG の名前を変える | `vgrename vg01 vg_main` |
| LV の名前を変える | `lvrename vg01 lv_data lv_app` |
| VG を有効、無効にする | `vgchange -a y vg01`、`vgchange -a n vg01` |
| LV を有効、無効にする | `lvchange -a y vg01/lv_data`、`lvchange -a n vg01/lv_data` |
| LV を消す | `umount` してから `lvremove vg01/lv_data` |
| VG を消す | `vgremove vg01`(LV を先に消す) |
| PV を消す | `pvremove /dev/sdb1` |

- **無効**にした LV は、`/dev/vg01/…` から消えて、マウントできません。データは残っています。

### 4. LV を広げる、縮める

LV の大きさを変えたら、中の**ファイルシステムの大きさも変える**必要があります。両方をまとめてやるのが、`lvextend` の `-r`(`--resizefs`)です。

```text
空きが足りないときは、[vgextend] で VG に PV を足す
        |
        v
[lvextend -L +5G /dev/vg01/lv_data]: LV を 5 GiB 広げる
        |
        v
ファイルシステムも広げる: ext4 は resize2fs、XFS は xfs_growfs(マウントしたままできる)
  lvextend -r なら、ここまで自動
```

```bash
sudo lvextend -L +5G /dev/vg01/lv_data             # 5 GiB 足す(-L 15G なら、15 GiB にする)
sudo resize2fs /dev/vg01/lv_data                   # ext4 のファイルシステムを広げる
sudo xfs_growfs /data                              # XFS なら、マウントポイントを指定
sudo lvextend -r -l +100%FREE /dev/vg01/lv_data    # VG の空きをすべて足し、ファイルシステムも自動で広げる
sudo lvresize -L +5G -r /dev/vg01/lv_data          # lvresize でも同じ(縮めるときも使える)
```

- **縮める**のは、危険です。順番は、ファイルシステムを先に縮め、その後に LV を縮めます。逆にすると、データが壊れます。**XFS は縮められません**。ext4 は、マウントを外して縮めます。

```bash
sudo umount /data
sudo e2fsck -f /dev/vg01/lv_data
sudo resize2fs /dev/vg01/lv_data 8G                # 先にファイルシステムを 8 GiB に
sudo lvreduce -L 8G /dev/vg01/lv_data              # 次に LV を 8 GiB に(lvreduce -r なら一度に)
```

### 5. スナップショット

**LVM のスナップショット**は、LV のある時点の状態を、別の LV として見られるようにしたものです。バックアップを取る間の固定した状態や、作業の前の保険に使います。

- スナップショットは、**元の LV の変更されるブロックの元の中身を保存する領域**(Copy-on-Write の領域)を持ちます。作るときに、その大きさ(`-L`)を決めます。
- その領域が**いっぱいになると、スナップショットは使えなくなります**。大きさは、作っている間に変わる量の見込みより、大きめにします。

```text
元の LV (lv_data): ふだんの読み書きを続ける
  |
  |  lvcreate -s -n snap1 -L 2G /dev/vg01/lv_data
  v
スナップショット (snap1): 作った時点の姿が見える。変更前の元のブロックを 2 GiB の領域に保存する
  |
  +-- 読んで、バックアップを取る: mount -o ro で
  +-- 作業が失敗したら、戻す: lvconvert --merge で元の LV に書き戻す
  +-- 不要なら消す: lvremove
```

```bash
sudo lvcreate -s -n snap1 -L 2G /dev/vg01/lv_data      # スナップショットを作る(-s)
sudo lvs                                               # Data% が、COW の領域の使用率
sudo mount -o ro,nouuid /dev/vg01/snap1 /mnt/snap      # XFS は nouuid が要る(UUID が元と同じため)
sudo umount /mnt/snap
sudo lvremove vg01/snap1                               # 消す
# 戻す(元の LV とスナップショットの両方を使っていない状態で)
sudo lvconvert --merge vg01/snap1                      # 元の LV を、スナップショットの時点に書き戻す
```

- `lvconvert --merge` を実行した後、スナップショットは消えます。**元の LV に、その後に書いた変更は失われます**。
- スナップショットは、元の LV と**同じ VG の中**にあり、**バックアップの代わりではありません**。ディスクが壊れたら、元もスナップショットも失われます。

### 6. LVM の設定ファイル

設定は `/etc/lvm/lvm.conf` にあります(`lvm` コマンドと、`pvs` などすべてのコマンドが読みます)。

| 節 | 主な項目の例 |
|---|---|
| `devices` | `filter`、`global_filter`(どのデバイスを PV の候補にするか) |
| `activation` | `snapshot_autoextend_threshold`、`snapshot_autoextend_percent`(スナップショットの領域を自動で広げる) |
| `backup` | `backup`、`archive`(メタデータを `/etc/lvm/backup/` に保存する) |

```bash
sudo lvmconfig --typeconfig diff     # 既定から変えた項目だけを表示する
sudo lvm                              # lvm のシェル(help、pvs、vgs などを実行できる)
sudo vgcfgbackup vg01                 # VG のメタデータを保存する(/etc/lvm/backup/vg01)
```

- `snapshot_autoextend_threshold = 70`、`snapshot_autoextend_percent = 20` と書くと、スナップショットの領域が 70 % を超えたときに、20 % ずつ自動で広げます(dmeventd が動いていることが前提です)。
- 設定のファイル名は、Red Hat 系と Debian 系で同じ `/etc/lvm/lvm.conf` です。
