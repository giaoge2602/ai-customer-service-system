@echo off
chcp 65001 >nul
title AI 智能客服系统 - 一键启动
color 0A

echo ============================================
echo    AI 智能客服系统 · 一键启动脚本
echo ============================================
echo.

REM ---------- 1. 检查 MySQL 服务 ----------
echo [1/3] 检查 MySQL 服务...
sc query MySQL8 | findstr "RUNNING" >nul
if %errorlevel% neq 0 (
    echo       MySQL8 未运行，尝试启动...
    net start MySQL8 >nul 2>&1
    if %errorlevel% neq 0 (
        echo       [警告] MySQL 启动失败，请以管理员身份运行或手动执行: net start MySQL8
    ) else (
        echo       MySQL 已启动
    )
) else (
    echo       MySQL 正在运行 ✓
)
echo.

REM ---------- 2. 启动后端 ----------
echo [2/3] 启动后端 NestJS（端口 4000）...
start "后端 NestJS :4000" cmd /k "cd /d d:\ai-customer-service-system\.worktrees\backend-mvp\backend && npm run start:dev"
echo       后端窗口已打开 ✓
echo.

REM ---------- 3. 启动前端 ----------
echo [3/3] 启动前端 Vite（端口 5173）...
start "前端 Vite :5173" cmd /k "cd /d d:\ai-customer-service-system && npm run dev"
echo       前端窗口已打开 ✓
echo.

echo ============================================
echo  启动完成！请等待两个窗口编译完毕（约 10 秒）
echo.
echo  前端地址:  http://localhost:5173
echo  后端地址:  http://localhost:4000/api/v1
echo  API 文档:  http://localhost:4000/api/docs
echo.
echo  演示账号（密码均为 Demo@2026）:
echo    平台管理员:  admin@ai-service.demo
echo    机构管理员:  admin@xinghe.demo
echo    客服坐席:    lina@xinghe.demo
echo ============================================
timeout /t 8 >nul
