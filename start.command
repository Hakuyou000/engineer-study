#!/bin/bash
# macOS 用の起動スクリプト。Finder でダブルクリックすると、ターミナルで実行される。
cd "$(dirname "$0")" || exit 1

fail() {
  echo
  echo "失敗しました。上の表示を確認してください。"
  read -r -p "Enter キーを押すと閉じます"
  exit 1
}

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js が見つかりません。https://nodejs.org/ から LTS 版を入れてから、もう一度実行してください。"
  fail
fi

# Vite などが Node.js 22.12 以降を必要とする
NODE_VERSION="$(node -v 2>/dev/null | sed 's/^v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"
NODE_MINOR="$(echo "$NODE_VERSION" | cut -d. -f2)"
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; }; then
  echo "Node.js のバージョンが古いです(今のバージョン: ${NODE_VERSION:-不明})。"
  echo "22.12 以降が必要です。https://nodejs.org/ から LTS 版を入れてから、もう一度実行してください。"
  fail
fi

echo "[1/2] 依存パッケージを確認します"
npm install --no-audit --no-fund || fail

echo
echo "[2/2] 起動します。ブラウザが自動で開きます"
echo "      終了するときは、画面右上の「終了」を押してください"
echo
npm run dev -- --open || fail

echo
echo "終了しました。このウィンドウは閉じてかまいません。"
