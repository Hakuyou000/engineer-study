@echo off
chcp 65001 >nul
title sre-drill
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 goto nonode

rem Vite などが Node.js 22.12 以降を必要とする
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)"
if errorlevel 1 goto oldnode

echo [1/2] 依存パッケージを確認する
call npm install --no-audit --no-fund
if errorlevel 1 goto failed

echo.
echo [2/2] 起動する。ブラウザが自動で開く
echo       終了するときは、画面右上の「終了」を押す
echo.
call npm run dev -- --open
if errorlevel 1 goto failed
exit /b 0

:oldnode
for /f %%v in ('node -v') do echo Node.js のバージョンが古い。今のバージョンは %%v。22.12 以降が必要。https://nodejs.org/ から LTS 版を入れてからやり直す
goto failed

:nonode
echo Node.js が見つからない。https://nodejs.org/ から LTS 版を入れてからやり直す
goto failed

:failed
echo.
echo 失敗した。上の表示を確認する
pause
exit /b 1
