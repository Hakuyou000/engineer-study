# LinuC201 問題 2.02 ファイルシステムとストレージ管理

対象: LinuC レベル2 201試験 / 全24問 / すべてオリジナル問題
対応テキスト: `LinuC201_2.02_ファイルシステムとストレージ管理.md`
解答・解説は末尾。

## 問題

### 2.02.1 ファイルシステムの設定とマウント

**問1** `LinuC201-2.02-001` 新しく作った XFS のファイルシステム(UUID は説明用の架空の値 `3f6e9c0a-1d2b-4c7e-8a55-2b9d5e6a77c1`)を、起動のたびに `/data` にマウントしたい。ディスクをつなぐ順番が変わって `/dev/sdb1` の名前が変わっても、同じファイルシステムがマウントされるようにする。オプションは `defaults`、dump はしない、起動時の fsck の順番は 0 とする。`/etc/fstab` の正しい行はどれか。

- A. `/dev/sdb1 /data xfs defaults 0 0`
- B. `UUID=3f6e9c0a-1d2b-4c7e-8a55-2b9d5e6a77c1 /data xfs defaults 0 0`
- C. `UUID=3f6e9c0a-1d2b-4c7e-8a55-2b9d5e6a77c1 xfs /data defaults 0 0`
- D. `/data UUID=3f6e9c0a-1d2b-4c7e-8a55-2b9d5e6a77c1 xfs defaults 0 0`

**問2** `LinuC201-2.02-002` `/etc/fstab` に行を追加した。再起動する前に、まだマウントされていない行を実際にマウントして、書き間違いがないか確かめたい。正しいコマンドはどれか。

- A. `systemctl restart fstab`
- B. `mount /etc/fstab`
- C. `umount -a`
- D. `mount -a`

**問3** `LinuC201-2.02-003` ファイルシステムの UUID を表示できるコマンドを**2つ**選べ。

- A. `blkid`
- B. `df -h`
- C. `lsblk -f`
- D. `du -sh /data`

**問4** `LinuC201-2.02-004` `dd` で 2 GiB の `/swapfile` を作り、`chmod 600 /swapfile` も済ませた。このファイルをスワップとして使い始めるための、正しいコマンドの順番はどれか。

- A. `mkswap /swapfile` の後に `swapon /swapfile`
- B. `swapon /swapfile` の後に `mkswap /swapfile`
- C. `mkfs.swap /swapfile` の後に `mount /swapfile /mnt`
- D. `mkfs.ext4 /swapfile` の後に `swapon /swapfile`

**問5** `LinuC201-2.02-005` いま使っているスワップの一覧(デバイスまたはファイルの名前、種類、大きさ、使用量)を表示する swapon のコマンドを、オプションも含めて答えよ。

**問6** `LinuC201-2.02-006` `/etc/fstab` に、マウントポイントが `/var/lib/app` の行を書いた。systemd が、この行から自動で作る mount ユニットの名前はどれか。

- A. `app.mount`
- B. `var/lib/app.mount`
- C. `var-lib-app.mount`
- D. `var_lib_app.mount`

**問7** `LinuC201-2.02-007` カーネルが直接持っている、いまのマウントの一覧を読めるファイルはどれか。

- A. `/proc/mounts`
- B. `/etc/fstab`
- C. `/proc/partitions`
- D. `/etc/filesystems`

### 2.02.2 ファイルシステムの管理

**問8** `LinuC201-2.02-008` `/dev/sdb1` に、ラベルを `data` にして ext4 のファイルシステムを作りたい。正しいコマンドはどれか。

- A. `mkfs -L data ext4 /dev/sdb1`
- B. `mkfs.ext4 -l data /dev/sdb1`
- C. `mkfs.ext4 -L data /dev/sdb1`
- D. `mke2fs -t xfs -L data /dev/sdb1`

**問9** `LinuC201-2.02-009` ext4 の `/dev/sdb1` で、root のために予約されているブロックの割合を、全体の 1 % に変えたい。正しいコマンドはどれか。

- A. `tune2fs -l 1 /dev/sdb1`
- B. `tune2fs -m 1 /dev/sdb1`
- C. `tune2fs -L 1 /dev/sdb1`
- D. `dumpe2fs -m 1 /dev/sdb1`

**問10** `LinuC201-2.02-010` ext4 の `/dev/sdb1` の、スーパーブロック(ファイルシステムの設定)の内容を表示する tune2fs のコマンドを、オプションも含めて答えよ(デバイス名は不要)。

**問11** `LinuC201-2.02-011` マウントを外した XFS の `/dev/sdb2` を、何も直さずに、ファイルシステムの問題だけを調べたい。正しいコマンドはどれか。

- A. `fsck.xfs /dev/sdb2`
- B. `xfs_repair /dev/sdb2`
- C. `dumpe2fs /dev/sdb2`
- D. `xfs_repair -n /dev/sdb2`

**問12** `LinuC201-2.02-012` XFS について、正しい説明を**2つ**選べ。

- A. マウントしたまま、`xfs_growfs` で大きくできる
- B. `lvreduce` と `xfs_growfs` を使って、小さくできる
- C. ext4 用の `dump` と `restore` で、保存と復元ができる
- D. `xfsdump` と `xfsrestore` で、保存と復元ができる

**問13** `LinuC201-2.02-013` Btrfs のサブボリューム `/mnt/pool/data` の、読み取り専用のスナップショットを `/mnt/pool/snap` に作るコマンドはどれか。

- A. `btrfs filesystem snapshot -r /mnt/pool/data /mnt/pool/snap`
- B. `btrfs subvolume snapshot -r /mnt/pool/data /mnt/pool/snap`
- C. `btrfs subvolume create -r /mnt/pool/data /mnt/pool/snap`
- D. `btrfs send /mnt/pool/data /mnt/pool/snap`

**問14** `LinuC201-2.02-014` マウントを外して `e2fsck -f` で調べた ext4 のファイルシステムを、データを残したまま Btrfs に変換するコマンドを答えよ(デバイス名は不要)。

**問15** `LinuC201-2.02-015` ext4 から Btrfs に変換した `/dev/sdb1` を、元の ext4 に戻したい。変換のときにできた `ext2_saved` のサブボリュームは、まだ消していない。マウントは外してある。正しいコマンドはどれか。

- A. `btrfs-convert /dev/sdb1`
- B. `btrfs subvolume snapshot ext2_saved /dev/sdb1`
- C. `btrfs-convert -r /dev/sdb1`
- D. `mkfs.ext4 /dev/sdb1`

**問16** `LinuC201-2.02-016` ディスク `/dev/sda` の SMART の全体の判定(PASSED か FAILED か)だけを表示する smartctl のコマンドを、オプションも含めて答えよ(デバイス名は不要)。

**問17** `LinuC201-2.02-017` ディスクの SMART の情報を決まった間隔で調べ、異常があればメールなどで知らせる、常駐するプログラムはどれか。

- A. `smartd`
- B. `smartctl`
- C. `smartmon`
- D. `smartlog`

### 2.02.3 論理ボリュームマネージャの設定と管理

**問18** `LinuC201-2.02-018` 空のパーティション `/dev/sdb1` から、LVM の論理ボリュームを作るコマンドの正しい順番はどれか。

- A. `vgcreate` → `pvcreate` → `lvcreate`
- B. `lvcreate` → `vgcreate` → `pvcreate`
- C. `pvcreate` → `lvcreate` → `vgcreate`
- D. `pvcreate` → `vgcreate` → `lvcreate`

**問19** `LinuC201-2.02-019` ボリュームグループ `vg01` に空きがある。論理ボリューム `/dev/vg01/lv_data`(現在 10 GiB、ext4)を、マウントしたまま、ファイルシステムも含めて 15 GiB にしたい。1 つのコマンドで行う、正しいものはどれか。

- A. `lvextend -L +5G /dev/vg01/lv_data`
- B. `lvextend -r -L 5G /dev/vg01/lv_data`
- C. `lvextend -r -L +5G /dev/vg01/lv_data`
- D. `lvreduce -r -L +5G /dev/vg01/lv_data`

**問20** `LinuC201-2.02-020` 従来型(シンプロビジョニングでない)の LVM のスナップショットについて、正しい説明を**2つ**選べ。

- A. 元の論理ボリュームとは、別のボリュームグループに作れる
- B. 変更前のブロックを保存する領域がいっぱいになると、スナップショットは使えなくなる
- C. 元のディスクが壊れたときの備えとして、バックアップの代わりになる
- D. `lvconvert --merge` で、元の論理ボリュームをスナップショットの時点の状態に戻せる

**問21** `LinuC201-2.02-021` 論理ボリューム `/dev/vg01/lv_data` のスナップショットを、名前 `snap1`、変更を保存する領域 2 GiB で作るコマンドはどれか。

- A. `lvsnap -n snap1 -L 2G vg01/lv_data`
- B. `lvcreate -s -n snap1 -L 2G /dev/vg01/lv_data`
- C. `lvextend -s -n snap1 -L 2G /dev/vg01/lv_data`
- D. `vgcreate -s snap1 vg01 /dev/vg01/lv_data`

**問22** `LinuC201-2.02-022` ボリュームグループ `vg01` の中の、すべての論理ボリュームを有効にするコマンドを答えよ。

**問23** `LinuC201-2.02-023` ext4 の論理ボリューム `/dev/vg01/lv_data`(15 GiB、使用量は 6 GiB、`/data` にマウント中)を、10 GiB に縮めたい。データを失わずに行う、正しい手順はどれか。

- A. `lvreduce -L 10G` の後に `resize2fs` で 10 GiB にして、再びマウントする
- B. `umount /data` の後に `lvreduce -L 10G` を行い、その後 `resize2fs` を行う
- C. マウントしたまま `resize2fs` で 10 GiB にして、その後 `lvreduce -L 10G` を行う
- D. `umount /data`、`e2fsck -f`、`resize2fs` で 10 GiB、`lvreduce -L 10G` の順に行う

**問24** `LinuC201-2.02-024` LVM の設定ファイル `/etc/lvm/lvm.conf` の `activation` の節で、スナップショットの領域の使用率が決めた値を超えたときに、自動で広げる境目の値を決める項目はどれか。

- A. `snapshot_autoextend_threshold`
- B. `snapshot_max_size`
- C. `activation_autoextend`
- D. `devices_autoextend`

## 解答・解説

### 問1 `LinuC201-2.02-001`

**正解**: B

fstab の 1 行は「デバイス、マウントポイント、種類、オプション、dump、fsck」の順です。デバイスの欄に `UUID=…` と書くと、ディスクをつなぐ順番が変わっても同じファイルシステムをマウントできます。UUID は `blkid` や `lsblk -f` で調べます。

- A. `/dev/sdb1` はディスクをつなぐ順番で変わることがあり、問題文の条件を満たしません。
- C. 種類とマウントポイントの欄が逆です。
- D. マウントポイントがデバイスの欄に来ています。欄の順番が違います。

### 問2 `LinuC201-2.02-002`

**正解**: D

`mount -a` は、fstab に書いてあって、まだマウントされていないもの(`noauto` を除く)をすべてマウントします。書き間違いがあれば、再起動の前にエラーで分かります。

- A. `fstab` という名前のユニットはありません。fstab は systemd が起動のときに読んで、mount ユニットに変えます。
- B. `mount` に fstab のファイルは渡せません。
- C. `umount -a` は、マウントを外すコマンドです。確かめにはなりません。

### 問3 `LinuC201-2.02-003`

**正解**: A、C

`blkid` はデバイスごとの UUID、LABEL、種類を表示します。`lsblk -f` はツリーの形で、種類、LABEL、UUID、マウントポイントを表示します。

- A. `blkid` は UUID を表示します。
- B. `df -h` は、ファイルシステムごとの使用量を表示するもので、UUID は出ません。
- C. `lsblk -f` は UUID の列を表示します。
- D. `du -sh` は、ディレクトリの使用量を表示するもので、UUID は出ません。

### 問4 `LinuC201-2.02-004`

**正解**: A

スワップのファイルは、`mkswap` でスワップの領域にしてから、`swapon` で使い始めます。fstab には `/swapfile none swap defaults 0 0` と書くと、起動のときにも有効になります。

- B. 順番が逆です。スワップの領域にしていないファイルは、`swapon` で有効にできません。
- C. `mkfs.swap` というコマンドはなく、スワップはマウントして使うものでもありません。
- D. ext4 のファイルシステムを作ると、スワップの領域にはなりません。`swapon` が失敗します。

### 問5 `LinuC201-2.02-005`

**正解**: `swapon --show`、`swapon -s`、`swapon --summary`、`swapon --show=NAME,TYPE,SIZE,USED`、`swapon --show=NAME,TYPE,SIZE,USED,PRIO`

`swapon --show` は、使っているスワップの一覧を表示します。既定の列は NAME、TYPE、SIZE、USED、PRIO です。`--show=NAME,TYPE,SIZE,USED` のように、表示する列を選ぶこともできます。`swapon -s`(`--summary`)も同じ目的で使えますが、古い書き方です。`free -h` でもスワップの合計は分かります。

### 問6 `LinuC201-2.02-006`

**正解**: C

mount ユニットの名前は、マウントポイントの先頭の `/` を取り、残りの `/` を `-` に変えたものに、`.mount` を付けます。`/var/lib/app` は `var-lib-app.mount` です。`systemd-escape -p --suffix=mount /var/lib/app` でも作れます。

- A. 最後の部分だけではなく、パス全体が名前になります。
- B. ユニットの名前に `/` は使えません。
- D. 区切りは `_` ではなく `-` です。

### 問7 `LinuC201-2.02-007`

**正解**: A

`/proc/mounts` は、カーネルが持つ、いまのマウントの一覧です。`/etc/mtab` は、今は `/proc/self/mounts` へのシンボリックリンクになっているのが一般的で、中身は同じです。

- B. `/etc/fstab` は、起動のときにマウントするものを書く設定で、いまの状態ではありません。
- C. `/proc/partitions` は、カーネルが認識しているパーティションの一覧です。
- D. `/etc/filesystems` は、種類が分からないときに試す、ファイルシステムの種類の候補を書くファイルです。

### 問8 `LinuC201-2.02-008`

**正解**: C

`mkfs.ext4` の `-L` で、ラベルを付けて作れます。`mkfs -t ext4 -L data /dev/sdb1` でも同じです。作ると、デバイスの中身は消えます。

- A. `mkfs` の種類は `-t` で指定します。`-L` の使い方も違います。
- B. 小文字の `-l` は、不良ブロックの一覧のファイルを読むオプションです。ラベルは大文字の `-L` です。
- D. 種類に `xfs` を指定しています。ext4 にはなりません。

### 問9 `LinuC201-2.02-009`

**正解**: B

`tune2fs -m` は、root のために予約するブロックの割合(パーセント)を決めます。既定は 5 % で、大きなデータ用のディスクでは 1 % などに減らします。

- A. `-l` は、スーパーブロックの内容を表示するオプションです。
- C. `-L` は、ラベルを変えるオプションです。
- D. `dumpe2fs` は、情報を表示する道具で、設定は変えられません。

### 問10 `LinuC201-2.02-010`

**正解**: `tune2fs -l`、`dumpe2fs -h`

`tune2fs -l` は、スーパーブロックの内容(ブロックの大きさ、UUID、ラベル、機能など)を表示します。`dumpe2fs -h` も同じ情報を表示します。`-h` を付けないと、ブロックグループごとの詳しい情報も出ます。

### 問11 `LinuC201-2.02-011`

**正解**: D

`xfs_repair -n` は、何も変えずに調べるだけです。直すときは `-n` を付けずに実行します。XFS は、マウントを外した状態で調べます。

- A. `fsck.xfs` は、実際には何も調べません。XFS の確認と修復は `xfs_repair` を使います。
- B. `xfs_repair` は、問題があれば直してしまうので、直さない条件に合いません。
- C. `dumpe2fs` は、ext 系の情報を表示する道具で、XFS には使えません。

### 問12 `LinuC201-2.02-012`

**正解**: A、D

XFS は、マウントしたまま `xfs_growfs`(マウントポイントを指定)で広げられます。保存と復元の道具は `xfsdump` と `xfsrestore` です。

- A. XFS は広げることだけができ、マウントしたままで行えます。
- B. XFS は小さくできません。新しい `lvreduce`(LVM2 2.03.17 以降)は、XFS が使っている範囲を縮めようとすると、既定でエラーで止めます。古い版では、そのまま縮めてデータが壊れます。
- C. `dump` と `restore` は ext 系用です。XFS は `xfsdump` と `xfsrestore` を使います。
- D. XFS 用の保存と復元の道具です。なお、ファイルシステムの情報は `xfs_info` で見ます。

### 問13 `LinuC201-2.02-013`

**正解**: B

`btrfs subvolume snapshot` が、サブボリュームのスナップショットを作ります。`-r` を付けると、読み取り専用になります。

- A. `btrfs filesystem` には `snapshot` というサブコマンドはありません。
- C. `btrfs subvolume create` は、新しい空のサブボリュームを作ります。スナップショットではありません。
- D. `btrfs send` は、読み取り専用のスナップショットを、データの流れとして書き出すコマンドです。作るものではありません。

### 問14 `LinuC201-2.02-014`

**正解**: `btrfs-convert`

`btrfs-convert デバイス名` で、マウントを外した ext 系のファイルシステムを、データを残したまま Btrfs に変換します。元の ext4 は `ext2_saved` というサブボリュームに残ります。変換の前にバックアップを取ります。

### 問15 `LinuC201-2.02-015`

**正解**: C

`btrfs-convert -r`(rollback)で、`ext2_saved` が残っている間は、元の ext4 に戻せます。`ext2_saved` を消すと、戻せません。

- A. すでに Btrfs になっているデバイスに実行すると、エラーになります。
- B. `btrfs subvolume snapshot` は、サブボリュームの複製を作るもので、元に戻すものではありません。
- D. `mkfs.ext4` は、新しい ext4 を作って中身をすべて消します。元のデータには戻りません。

### 問16 `LinuC201-2.02-016`

**正解**: `smartctl -H`、`smartctl --health`

`smartctl -H` は、SMART の全体の判定を表示します。`-a` はすべての情報、`-A` は属性の一覧、`-t short` は短い自己診断を始めます。「PASSED」でも、属性が悪くなっていくことがあるので、属性の増え方も見ます。

### 問17 `LinuC201-2.02-017`

**正解**: A

`smartd` は、smartmontools の常駐するプログラムで、設定に従って SMART の情報を調べ、異常があれば知らせます。

- B. `smartctl` は、手で SMART の情報を調べたり自己診断を行ったりするコマンドで、常駐しません。
- C. `smartmon` という名前のプログラムは smartmontools にありません。
- D. `smartlog` という名前のプログラムは smartmontools にありません。

### 問18 `LinuC201-2.02-018`

**正解**: D

LVM は、`pvcreate`(物理ボリュームにする)、`vgcreate`(ボリュームグループにまとめる)、`lvcreate`(論理ボリュームを切り出す)の順に作ります。

- A. `vgcreate` は、物理ボリュームでないデバイスを渡すと、自動で物理ボリュームにもします。しかしその後の `pvcreate` は、デバイスがすでにボリュームグループに入っているので失敗します。基本の順番は `pvcreate` が先です。
- B. 論理ボリュームは、ボリュームグループの中から切り出すので、最後です。
- C. 論理ボリュームを作る前に、ボリュームグループが要ります。

### 問19 `LinuC201-2.02-019`

**正解**: C

`lvextend -r -L +5G` は、論理ボリュームを 5 GiB 足し、続けてファイルシステムも広げます(`-r` は `--resizefs`)。ext4 も XFS も、マウントしたまま広げられます。

- A. 論理ボリュームだけが広がります。ファイルシステムは 10 GiB のままなので、`resize2fs` などが別に要ります。
- B. `-L 5G` は、大きさを 5 GiB にする指定です。いまより小さいので、エラーになります。
- D. `lvreduce` は縮めるコマンドです。`+5G` と合いません。

### 問20 `LinuC201-2.02-020`

**正解**: B、D

スナップショットは、元の論理ボリュームの変更前のブロックを、別の領域に保存します。その領域がいっぱいになると、スナップショットは使えなくなります。`lvconvert --merge` で、元の論理ボリュームを、スナップショットの時点に戻せます。

- A. スナップショットは、元と同じボリュームグループの中に作ります。
- B. 保存する領域の大きさは、作るときに決めます。大きめにします。
- C. スナップショットは、変更されたブロックの元の中身しか持たず、残りは元の論理ボリュームから読みます。元が壊れると、スナップショットも使えません。バックアップの代わりにはなりません。
- D. 戻した後、スナップショットは消えます。その後に元に書いた変更も失われます。

### 問21 `LinuC201-2.02-021`

**正解**: B

`lvcreate -s`(`--snapshot`)で、元の論理ボリュームを指定してスナップショットを作ります。`-n` は名前、`-L` は変更を保存する領域の大きさです。

- A. `lvsnap` というコマンドはありません。
- C. `lvextend` は、論理ボリュームを広げるコマンドです。
- D. `vgcreate` は、ボリュームグループを作るコマンドです。`-s` はエクステントの大きさの指定です。

### 問22 `LinuC201-2.02-022`

**正解**: `vgchange -a y vg01`、`vgchange -ay vg01`、`vgchange --activate y vg01`、`vgchange --activate=y vg01`、`vgchange vg01 -a y`、`vgchange vg01 -ay`、`lvchange -a y vg01`、`lvchange -ay vg01`、`lvchange --activate y vg01`、`lvchange --activate=y vg01`

`vgchange -a y` は、ボリュームグループの中のすべての論理ボリュームを有効にします。無効にするときは `-a n` です。`lvchange -a y` は、論理ボリュームを有効にするコマンドです。ボリュームグループの名前を渡すと、その中のすべての論理ボリュームに働くので、`lvchange -a y vg01` でも同じ結果になります。

### 問23 `LinuC201-2.02-023`

**正解**: D

縮める順番は、ファイルシステムが先、論理ボリュームが後です。ext4 は、マウントを外して `e2fsck -f` で調べてから、`resize2fs` で縮めます。その後に `lvreduce` で、論理ボリュームを同じ大きさに縮めます(`lvreduce -r` なら、まとめてできます)。

- A. 論理ボリュームを先に縮めると、ファイルシステムの後ろの部分が切り捨てられて、データが壊れます(新しい LVM2(2.03.17 以降)は、これを見つけると既定でエラーで止めます)。
- B. 論理ボリュームを先に縮めているので、データが壊れます(新しい LVM2(2.03.17 以降)は、これを見つけると既定でエラーで止めます)。
- C. ext4 は、マウントしたままでは縮められません(広げることだけがオンラインでできます)。

### 問24 `LinuC201-2.02-024`

**正解**: A

`snapshot_autoextend_threshold` で使用率の境目(例: 70)を決め、`snapshot_autoextend_percent` で広げる割合を決めます。dmeventd が動いていることが前提です。

- B. `snapshot_max_size` という項目はありません。
- C. `activation_autoextend` という項目はありません。
- D. `devices_autoextend` という項目はありません。
