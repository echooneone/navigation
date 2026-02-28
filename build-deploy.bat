@echo off
setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   Navigation Build ^& Package Script
echo ==========================================
echo.

:: ── 路径变量
set "ROOT=%~dp0"
set "STAGE=%ROOT%_build_stage"

for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmm'"') do set "TIMESTAMP=%%i"
set "ZIPNAME=navigation-deploy-%TIMESTAMP%.zip"
set "ZIPPATH=%ROOT%%ZIPNAME%"

:: ── 检查依赖
echo [CHECK] Node.js / npm...
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found. Install Node.js first.
  pause & exit /b 1
)

where powershell >nul 2>&1
if errorlevel 1 (
  echo [ERROR] PowerShell not found.
  pause & exit /b 1
)

:: ── 步骤 1：构建 Admin 前台（Vue3 + Vite）
echo.
echo [1/4] Building admin panel (Vue3 + Vite)...
cd /d "%ROOT%admin"

call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause & exit /b 1
)

call npm run build
if errorlevel 1 (
  echo [ERROR] npm run build failed.
  pause & exit /b 1
)

if not exist "%ROOT%admin\dist\index.html" (
  echo [ERROR] Build output missing. Check vite.config.js.
  pause & exit /b 1
)
echo Done ^> admin\dist\

:: ── 步骤 2：创建暂存目录
echo.
echo [2/4] Preparing staging dir...
if exist "%STAGE%" rd /s /q "%STAGE%"
mkdir "%STAGE%"

:: ── 步骤 3：复制文件
echo.
echo [3/4] Copying files...

robocopy "%ROOT%server" "%STAGE%\server" /E ^
  /XD node_modules uploads ^
  /XF *.db ^
  /NFL /NDL /NJH /NJS
if %errorlevel% GEQ 8 (
  echo [ERROR] Failed to copy server/
  rd /s /q "%STAGE%" & pause & exit /b 1
)

robocopy "%ROOT%admin\dist" "%STAGE%\admin\dist" /E /NFL /NDL /NJH /NJS
if %errorlevel% GEQ 8 (
  echo [ERROR] Failed to copy admin/dist/
  rd /s /q "%STAGE%" & pause & exit /b 1
)

robocopy "%ROOT%frontend" "%STAGE%\frontend" /E /NFL /NDL /NJH /NJS
if %errorlevel% GEQ 8 (
  echo [ERROR] Failed to copy frontend/
  rd /s /q "%STAGE%" & pause & exit /b 1
)

copy "%ROOT%package.json" "%STAGE%\package.json" >nul
mkdir "%STAGE%\server\uploads\icons" 2>nul

:: ── 用 PowerShell 写 UTF-8 部署说明（避免 bat 中文乱码）
powershell -NoProfile -ExecutionPolicy Bypass -Command "$lines = '# Navigation 部署说明','','## 宝塔部署步骤','','1. 上传 zip，解压到 /www/wwwroot/navigation/','2. 文件管理器进入 /www/wwwroot/navigation/server/','   将 .env.example 复制为 .env，修改以下两项：','     JWT_SECRET            = 随机长字符串（必改，防止 Token 伪造）','     ADMIN_DEFAULT_PASSWORD = 初始登录密码（首次启动前改好，之后进后台改）','3. 终端执行：','     cd /www/wwwroot/navigation/server','     npm install --production','4. 宝塔 Node.js 项目管理器 -> 添加项目：','     项目目录：/www/wwwroot/navigation/server','     启动文件：index.js  端口：3721','     填写域名（宝塔自动创建反向代理）','','## 访问地址','  前台：  https://你的域名/','  后台：  https://你的域名/admin/','  健康：  https://你的域名/api/health'; [System.IO.File]::WriteAllLines('%STAGE%\DEPLOY.md', $lines, [System.Text.UTF8Encoding]::new($false))"

:: ── 步骤 4：打包 + 清理
echo.
echo [4/4] Compressing...
if exist "%ZIPPATH%" del "%ZIPPATH%"

powershell -NoProfile -Command ^
  "Compress-Archive -Path '%STAGE%\*' -DestinationPath '%ZIPPATH%' -Force"
if errorlevel 1 (
  echo [ERROR] Compress failed.
  rd /s /q "%STAGE%" & pause & exit /b 1
)

rd /s /q "%STAGE%"

for %%f in ("%ZIPPATH%") do set "ZIPSIZE=%%~zf"
set /a ZIPSIZE_KB=%ZIPSIZE% / 1024

echo.
echo ==========================================
echo   Done!  %ZIPNAME%  (%ZIPSIZE_KB% KB)
echo ==========================================
echo.
echo   Steps (see DEPLOY.md inside zip):
echo   1. Extract to /www/wwwroot/navigation/
echo   2. Copy server/.env.example to .env, set JWT_SECRET + password
echo   3. cd server ^&^& npm install --production
echo   4. BaoTa NodeJS manager: dir=server  entry=index.js  port=3721
echo.
pause
