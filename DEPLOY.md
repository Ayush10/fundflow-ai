# FundFlow AI — Server Deployment Instructions

Feed this entire document to Claude on your Hostinger server.

---

## Step 1: Clone and Install

```bash
cd /home
git clone https://github.com/Ayush10/fundflow-ai.git
cd fundflow-ai
npm install
```

## Step 2: Create .env.local

Create the file `/home/fundflow-ai/.env.local` with this exact content:

```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Solana Devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=<your-treasury-private-key-base58>
TREASURY_WALLET_ADDRESS=<your-treasury-public-key>
USDC_MINT_ADDRESS=<your-devnet-usdc-mint>

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4o

# ElevenLabs
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
ELEVENLABS_VOICE_ID=<your-elevenlabs-voice-id>

# Human.tech / Passport
HUMAN_TECH_API_KEY=<your-passport-api-key>
HUMAN_TECH_SCORER_ID=<your-scorer-id>

# Live integration toggles
ENABLE_REAL_ANTHROPIC=true
ENABLE_REAL_HUMAN_TECH=true
ENABLE_REAL_UNBROWSE=true
ENABLE_REAL_ELEVENLABS=true
ENABLE_REAL_SOLANA=true
ENABLE_REAL_METEORA=false
MIN_HUMANITY_SCORE=20
```

**Get the actual values from the project owner. Do NOT commit real keys to git.**

## Step 3: Install and Setup Unbrowse

Unbrowse is a CLI tool that runs a local browser-based API server. It needs to be installed and running on the server for real web research.

```bash
# Install globally
npm install -g unbrowse

# Run setup (accept terms when prompted with 'y')
unbrowse setup

# Verify it's running
curl http://localhost:6969/health
```

If setup succeeds, the Unbrowse local server runs on port 6969. Our app calls it automatically when `ENABLE_REAL_UNBROWSE=true`.

If Unbrowse setup fails (browser engine not available), set `ENABLE_REAL_UNBROWSE=false` in .env.local. The app will use simulated research data instead.

## Step 4: Build and Start

```bash
npm run build
npm run start -- --port 3000
```

Or to run on a different port:

```bash
PORT=3000 npm run start
```

## Step 5: Keep it Running (PM2)

```bash
npm install -g pm2
pm2 start npm --name "fundflow-ai" -- start
pm2 save
pm2 startup
```

## Step 6: Reverse Proxy (Nginx)

If you want to serve on a domain/subdomain, add an Nginx config:

```nginx
server {
    listen 80;
    server_name fundflow.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # SSE support (important for agent workflow streaming)
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```

Then:
```bash
sudo ln -s /etc/nginx/sites-available/fundflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Verify Everything Works

Test each integration:

```bash
# 1. Check the app is running
curl http://localhost:3000

# 2. Test proposal creation
curl -X POST http://localhost:3000/api/proposals \
  -H "Content-Type: application/json" \
  -d '{"title":"Server Test","description":"Testing deployment on Hostinger server with all live integrations enabled.","requestedAmount":1000,"applicantWallet":"Dn1SDTkoA5tmSLAsf5inTsGhY7twbcEcSdKZTDmbGxjZ"}'

# 3. Test treasury
curl http://localhost:3000/api/treasury

# 4. Test Unbrowse local server
curl http://localhost:6969/health

# 5. Trigger a full evaluation (replace PROP_ID with the id from step 2)
curl -X POST http://localhost:3000/api/proposals/PROP_ID/evaluate

# 6. Wait 20 seconds, then check the result
sleep 20
curl http://localhost:3000/api/proposals/PROP_ID
```

## What Each Integration Does

| Integration | What to Verify | Expected Result |
|-------------|---------------|-----------------|
| **GPT-4o** | Proposal gets a real AI rationale, not "builder-xxx shows N stars" | Detailed, context-aware evaluation text |
| **ElevenLabs** | Decision has `narrationAudioUrl` starting with `data:audio/mpeg` | Real MP3 audio, not `data:audio/wav` (silent) |
| **Human Passport** | Human check step shows real score from passport.xyz | Score based on wallet's actual stamps |
| **Unbrowse** | Research step shows real GitHub/Twitter data | Data from live websites, not deterministic |
| **Solana** | Audit records have tx hashes verifiable on Explorer | Links work at explorer.solana.com/?cluster=devnet |
| **USDC** | Approved proposals show real disbursement tx | SPL token transfer visible on-chain |

## Troubleshooting

**Build fails**: Make sure Node.js 18+ is installed. Run `node --version`.

**Unbrowse setup fails**: Set `ENABLE_REAL_UNBROWSE=false`. The app works without it using simulated data.

**Metaplex minting fails**: Check SOL balance with:
```bash
node -e "const{Connection,PublicKey}=require('@solana/web3.js');new Connection('https://api.devnet.solana.com').getBalance(new PublicKey('Dn1SDTkoA5tmSLAsf5inTsGhY7twbcEcSdKZTDmbGxjZ')).then(b=>console.log(b/1e9,'SOL'))"
```
If low, airdrop more at https://faucet.solana.com

**SSE streaming not working through Nginx**: Make sure the Nginx config has `proxy_buffering off` and `chunked_transfer_encoding on`.

**Port already in use**: `lsof -i :3000` then `kill -9 PID`.
