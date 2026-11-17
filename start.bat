@echo off
chcp 65001 >nul
title sre-drill
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 goto nonode

echo [1/2] 依存パッケージを確認する
call npm install --no-audit --no-fund
if errorlevel 1 goto failed

echo.
echo [2/2] 起動する。ブラウザが自動で開く
echo       終了するときは、このウィンドウを閉じる
echo.
call npm run dev -- --open
goto end

:nonode
echo Node.js が見つからない。https://nodejs.org/ から LTS 版を入れてからやり直す
goto failed

:failed
echo.
echo 失敗した。上の表示を確認する
pause
exit /b 1

:end
pause
