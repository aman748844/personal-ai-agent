@echo off
setlocal enabledelayedexpansion
title Personal AI Agent - Client Runtime

echo ========================================================
echo    Personal AI Agent - Cross-Device Local Client
echo ========================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ (LTS recommended)
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
)

REM Ask for Gateway URL if not provided via environment or args
set GATEWAY=%GATEWAY_WS_URL%
if "%GATEWAY%"=="" (
    if exist ".env" (
        for /f "tokens=1,* delims==" %%A in (.env) do (
            if "%%A"=="GATEWAY_WS_URL" set GATEWAY=%%B
        )
    )
)

if "%~1" neq "" (
    set GATEWAY=%~1
)

if "%GATEWAY%"=="" (
    echo Enter your AWS Cloud Server Gateway URL:
    echo (Example: ws://13.233.120.45:4000/agent or ws://localhost:4000/agent)
    set /p GATEWAY="Gateway WS URL [default: ws://localhost:4000/agent]: "
    if "!GATEWAY!"=="" set GATEWAY=ws://localhost:4000/agent
)

echo.
echo [INFO] Connecting to Cloud Gateway: !GATEWAY!
echo [INFO] Device Name: %COMPUTERNAME%
echo [INFO] Starting Agent Runtime... Press Ctrl+C to stop.
echo.

node apps/local-agent/src/agent.js --gateway "!GATEWAY!" --device "%COMPUTERNAME%"

pause
