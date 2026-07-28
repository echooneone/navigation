@echo off
echo === 停止服务 ===
taskkill /F /IM node.exe >/dev/null 2>&1
ping 127.0.0.1 -n 2 >/dev/null

echo === 构建后台 ===
cd /d "%~dp0admin"
call npm run build
if %ERRORLEVEL% NEQ 0 (echo 构建失败 && pause && exit /b 1)

echo === 启动服务 ===
cd /d "%~dp0server"
start "Navigation" /B node index.js

echo === 完成: http://localhost:3721 ===
