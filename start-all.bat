@echo off
cd /d "%~dp0"
title Jarvis AI Agent - 1-Click Platform Launcher

echo ========================================================
echo    Jarvis Autonomous AI Agent - Launcher
echo    (Continuous Siri-Mode & Google Chrome Automation)
echo ========================================================
echo.

REM Locate Node
set NODE_EXE=node
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
        set NODE_EXE="C:\Program Files\nodejs\node.exe"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
        set NODE_EXE="C:\Program Files (x86)\nodejs\node.exe"
    ) else (
        echo [ERROR] Node.js is not found on your system!
        pause
        exit /b 1
    )
)

echo [1/3] Starting AI Agent API Gateway Server (Port 4000)...
start "Jarvis API Gateway Server" cmd /k "%NODE_EXE% apps/api/src/server.js"

echo [2/3] Waiting for API Server to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Opening Google Chrome to Jarvis Mission Control...
start chrome "http://localhost:4000"

echo.
echo ========================================================
echo Starting Local Agent Client Runtime...
echo Connecting to: ws://localhost:4000/agent
echo ========================================================
echo.

%NODE_EXE% apps/local-agent/src/agent.js --gateway "ws://localhost:4000/agent" --device "%COMPUTERNAME%"

echo.
pause
