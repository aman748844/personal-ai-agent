@echo off
cd /d "%~dp0"
title Personal AI Agent - Client Runtime

echo ========================================================
echo    Personal AI Agent - Cross-Device Local Client
echo ========================================================
echo.

REM Check if Node is in PATH or Program Files
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
        echo Please install Node.js from https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

REM Default AWS Gateway URL
set GATEWAY=ws://54.81.199.45:4000/agent

if not "%~1"=="" (
    set GATEWAY=%~1
)

echo Target AWS Server: %GATEWAY%
echo Local Device Name: %COMPUTERNAME%
echo.
echo Press ENTER to connect directly to this AWS Server,
echo or paste a different URL:
set /p USER_GATEWAY="AWS Gateway URL [%GATEWAY%]: "

if not "%USER_GATEWAY%"=="" (
    set GATEWAY=%USER_GATEWAY%
)

echo.
echo ========================================================
echo  Connecting to: %GATEWAY%
echo  Device:        %COMPUTERNAME%
echo ========================================================
echo.

%NODE_EXE% apps/local-agent/src/agent.js --gateway "%GATEWAY%" --device "%COMPUTERNAME%"

echo.
echo [INFO] Agent stopped.
pause
