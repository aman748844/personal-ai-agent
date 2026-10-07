#!/usr/bin/env bash
# ========================================================
#    Personal AI Agent - Cross-Device Local Client (Unix)
# ========================================================

set -e

echo "========================================================"
echo "   Personal AI Agent - Cross-Device Local Client"
echo "========================================================"
echo ""

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
fi

# Read GATEWAY_WS_URL from args, env, or .env
GATEWAY="${GATEWAY_WS_URL}"
if [ -z "$GATEWAY" ] && [ -f ".env" ]; then
    GATEWAY=$(grep -E '^GATEWAY_WS_URL=' .env | cut -d '=' -f2- | tr -d '\r')
fi

if [ -n "$1" ]; then
    GATEWAY="$1"
fi

if [ -z "$GATEWAY" ]; then
    echo "Enter your AWS Cloud Server Gateway URL:"
    echo "(Default: ws://54.81.199.45:4000/agent)"
    read -p "Gateway WS URL [default: ws://54.81.199.45:4000/agent]: " user_input
    GATEWAY="${user_input:-ws://54.81.199.45:4000/agent}"
fi

HOSTNAME=$(hostname)
echo ""
echo "[INFO] Connecting to Cloud Gateway: $GATEWAY"
echo "[INFO] Device Name: $HOSTNAME"
echo "[INFO] Starting Agent Runtime... Press Ctrl+C to stop."
echo ""

node apps/local-agent/src/agent.js --gateway "$GATEWAY" --device "$HOSTNAME"
