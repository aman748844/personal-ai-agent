#!/usr/bin/env bash
# ==============================================================================
# AWS EC2 Free Tier Automated Setup Script for Personal AI Agent Gateway
# Compatible with: Ubuntu 22.04 LTS / 24.04 LTS (t2.micro / t3.micro)
# ==============================================================================

set -e

echo "=========================================================="
echo "   Setting up Personal AI Agent Cloud Gateway on AWS EC2   "
echo "=========================================================="

# 1. Update system packages
echo "[1/6] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# 2. Install essential tools and Node.js 22 LTS
echo "[2/6] Installing Node.js 22 LTS and build essentials..."
sudo apt-get install -y curl git ufw build-essential

if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Install PM2 globally
echo "[3/6] Installing PM2 process supervisor..."
sudo npm install -g pm2

# 4. Clone or pull repository
PROJECT_DIR="$HOME/personal-ai-agent"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "[4/6] Cloning repository into $PROJECT_DIR..."
    git clone https://github.com/aman748844/personal-ai-agent.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
else
    echo "[4/6] Pulling latest code in $PROJECT_DIR..."
    cd "$PROJECT_DIR"
    git pull origin main || true
fi

# 5. Install Node dependencies
echo "[5/6] Installing production dependencies..."
npm install --omit=dev

# Check or create .env if not exists
if [ ! -f ".env" ]; then
    echo "PORT=4000" > .env
    echo "NODE_ENV=production" >> .env
    echo "AGENT_SECRET=ai-agent-platform-secure-key-2026" >> .env
    echo "VAULT_SECRET=local-pc-master-passphrase-2026" >> .env
    echo "Created default .env file."
fi

# 6. Start service with PM2 and enable auto-restart on boot
echo "[6/6] Launching Cloud Gateway with PM2..."
pm2 delete ai-agent-gateway 2>/dev/null || true
pm2 start apps/api/src/server.js --name "ai-agent-gateway"
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

# 7. Firewall configuration (Allow SSH and Port 4000)
sudo ufw allow 22/tcp || true
sudo ufw allow 4000/tcp || true
sudo ufw --force enable || true

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s https://ifconfig.me || echo "<YOUR_EC2_PUBLIC_IP>")

echo ""
echo "=========================================================="
echo "   DEPLOYMENT SUCCESSFUL!                                 "
echo "=========================================================="
echo "Web Dashboard URL: http://${PUBLIC_IP}:4000"
echo "WebSocket UI URL:  ws://${PUBLIC_IP}:4000/ui"
echo "WebSocket Agent:   ws://${PUBLIC_IP}:4000/agent"
echo ""
echo "Manage application with PM2:"
echo "  - View logs:    pm2 logs ai-agent-gateway"
echo "  - Restart:      pm2 restart ai-agent-gateway"
echo "  - Status:       pm2 status"
echo "=========================================================="
