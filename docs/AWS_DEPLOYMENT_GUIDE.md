# 🚀 AWS Free Tier Deployment Guide: Personal AI Agent

Is guide mein step-by-step bataya gaya hai ki kaise aap is **Personal AI Agent** ko **AWS Free Tier (EC2)** par bilkul free mein deploy kar sakte hain, aur kaise **kisi bhi system (Windows / Mac / Linux)** par baithe log is AI Agent se apne computer ko control karwa sakte hain.

---

## 🌟 Architecture Overview (Kaise Kaam Karta Hai?)

```
+-------------------------------------------------------------+
|                      AWS CLOUD (EC2 Free Tier)              |
|                                                             |
|  - Node.js Cloud Gateway (Port 4000)                        |
|  - Real-time Web Dashboard (http://<AWS_IP>:4000)           |
|  - AI Brain & Task Orchestrator                             |
|  - Secure WebSocket Hub (/agent & /ui)                      |
+-------------------------------------------------------------+
                            ▲
                            │ WebSocket (Encrypted HMAC-SHA256)
                            ▼
+-------------------------------------------------------------+
|             USER'S LOCAL SYSTEM (Any Laptop/PC)             |
|                                                             |
|  - Local Agent Runtime (run-agent.bat / run-agent.sh)       |
|  - Browser Control (Chrome / Edge via Playwright)           |
|  - Filesystem & Desktop Control                             |
|  - Local Credential Vault (Passwords safe on local PC)     |
+-------------------------------------------------------------+
```

> **Fayda:** Cloud dashboard ko duniya ke kisi bhi mobile ya laptop ke browser se khola ja sakta hai. Jaise hi aap wahan se instruction doge ("Play YouTube", "Update Naukri Profile", "Create file on Desktop"), connected local PC turant execute karega aur live stream dashboard pe bhejega!

---

## 📌 Prerequisites (Pehle Yeh Chahiye)

1. **AWS Account**: Agar nahi hai toh [aws.amazon.com](https://aws.amazon.com) par free account banayein. (12 Months ke liye EC2 `t2.micro` bilkul free milta hai — 750 ghante/mahina, yaani 24x7 non-stop).
2. **GitHub Repo**: Aapka repo ready hai: `https://github.com/aman748844/personal-ai-agent.git`

---

## 🛠️ PART 1: AWS EC2 Instance Setup (Free Tier)

### Step 1: EC2 Instance Launch Karein
1. AWS Console mein login karein aur search bar mein **EC2** type karke click karein.
2. **Launch Instance** button par click karein.
3. Details fill karein:
   - **Name**: `personal-ai-agent-cloud`
   - **OS (AMI)**: **Ubuntu 24.04 LTS** (Free tier eligible)
   - **Instance Type**: **t2.micro** (1 vCPU, 1 GB RAM - Free tier eligible) ya `t3.micro`.
   - **Key pair (login)**: **Create new key pair** par click karein:
     - Name: `agent-key`
     - Type: RSA
     - Format: `.pem`
     - File download ho jayegi, use sambhal kar rakhein.

### Step 2: Network / Security Group (Firewall) Rules
1. **Network Settings** section mein **Edit** par click karein.
2. Inbound Security Group Rules mein ye ports allow karein:
   - **SSH**: Port `22` | Source: `Anywhere (0.0.0.0/0)`
   - **Custom TCP**: Port `4000` | Source: `Anywhere (0.0.0.0/0)` *(AI Gateway & Dashboard)*
   - *(Optional)* **HTTP**: Port `80` | Source: `Anywhere (0.0.0.0/0)`
3. **Storage**: Default 8 GB ya 30 GB (Free tier allows up to 30 GB SSD).
4. Click **Launch Instance**.

---

## 💻 PART 2: Connect to EC2 & Deploy Code

### Step 3: EC2 Instance se Connect Karein
- **Option A (Sabse Aasan - Browser se)**:
  AWS EC2 Console mein apne instance ko select karein aur top right par **Connect** button dabayein -> **EC2 Instance Connect** tab -> Click **Connect**. Ek terminal window browser mein hi khul jayegi!
- **Option B (SSH Terminal se)**:
  ```bash
  ssh -i "agent-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
  ```

### Step 4: 1-Click Automated Setup Run Karein
EC2 terminal mein bas ye command run karein:

```bash
curl -fsSL https://raw.githubusercontent.com/aman748844/personal-ai-agent/main/infrastructure/aws-setup.sh | bash
```

*Ya manually run karein:*
```bash
# 1. System update & Node.js 22 install
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# 2. PM2 install (Process Manager 24/7 background running ke liye)
sudo npm install -g pm2

# 3. Code clone karein
git clone https://github.com/aman748844/personal-ai-agent.git
cd personal-ai-agent

# 4. Dependencies install karein
npm install --omit=dev

# 5. Background mein 24/7 launch karein PM2 ke sath
pm2 start apps/api/src/server.js --name "ai-agent-gateway"
pm2 save
pm2 startup
```

### Step 5: Verify Deployment
Browser mein open karein:
```
http://<YOUR_EC2_PUBLIC_IP>:4000
```
Aapke samne **Autonomous AI Agent Cybernetic HUD Dashboard** live chalte hue dikhega!

---

## 🖥️ PART 3: Kisi Bhi System (PC / Laptop) Par Agent Connect Karna

Yeh sabse important part hai: **AWS par Brain chal raha hai**, lekin **computer control user ke PC par hoga**.

### Windows Users Ke Liye:
1. Apne computer par project download/clone karein.
2. Project folder mein `run-agent.bat` par double click karein (ya command prompt mein run karein):
   ```cmd
   run-agent.bat
   ```
3. Script aapse poochegi:
   ```
   Gateway WS URL [default: ws://localhost:4000/agent]:
   ```
   Yahan apna AWS Server ka URL daalein:
   ```
   ws://<YOUR_EC2_PUBLIC_IP>:4000/agent
   ```
4. **Done!** Terminal mein message aayega:
   `✓ Connected to Cloud Gateway`
   Aur AWS Web Dashboard par aapke computer ka naam `ONLINE` show karne lagega!

### Mac / Linux Users Ke Liye:
1. Terminal kholiye aur run kijiye:
   ```bash
   chmod +x run-agent.sh
   ./run-agent.sh ws://<YOUR_EC2_PUBLIC_IP>:4000/agent
   ```
2. Agent connect ho jayega!

---

## 🎯 Test Run: Dekhein AI Agent Live Kaam Kaise Karta Hai!

1. Kisi bhi mobile ya laptop se browser mein open karein: `http://<YOUR_EC2_PUBLIC_IP>:4000`
2. Dekhein Top right pe aapka PC name: **Connected: Aman-PC [ONLINE]** dikhega.
3. Command box mein likhein ya Mic icon daba ke bole:
   - *"YouTube par Arijit Singh ke gaane chalao"*
   - *"Desktop par Portfolio naam ka folder banao"*
   - *"Naukri.com open karo aur resume update karo"*
4. **Result**: 
   - AWS Cloud AI instruction ko samjhega aur signed secure command banayega.
   - Connected PC automatically browser open karega, gaana bajayega ya folder banayega.
   - Live observation and screenshots dashboard pe real-time stream honge!

---

## 🛡️ PM2 Useful Commands (EC2 Par Server Manage Karne Ke Liye)

| Kaam | Command |
|---|---|
| Live Logs dekhna | `pm2 logs ai-agent-gateway` |
| Server Restart karna | `pm2 restart ai-agent-gateway` |
| Server Stop karna | `pm2 stop ai-agent-gateway` |
| Server Status dekhna | `pm2 status` |
