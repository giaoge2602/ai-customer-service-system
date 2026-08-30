@echo off
chcp 65001 >nul
title AI 智能客服系统 - NGINX 端口修复（需管理员运行）
echo ============================================
echo  本脚本需要【以管理员身份运行】：
echo  清理 80 端口上残留的多个 NGINX 实例，
echo  再以正确配置（含 /api 与 WebSocket 代理）启动。
echo ============================================
echo.

echo [1/3] 结束所有 NGINX 进程...
taskkill /F /T /IM nginx.exe
timeout /t 2 /nobreak >nul
taskkill /F /T /IM nginx.exe 2>nul

echo [2/3] 以正确配置启动 NGINX（80 端口）...
cd /d D:\web\nginx\nginx-1.22.0-web
start nginx
timeout /t 2 /nobreak >nul

echo [3/3] 启动后端 NestJS（4000 端口，热重载模式）...
start "backend-4000" cmd /k "cd /d D:\ai-customer-service-system\.worktrees\backend-mvp\backend && npm run start:dev"

echo.
echo 完成！等待约 15 秒后浏览器访问 http://localhost 验证：
echo   - 首页正常打开
echo   - 登录后能看到会话 / 客户等真实数据（说明 /api 代理正常）
echo.
pause
