# Fundshore

AI-powered Financial X-Ray tool.

## Setup (one time, ~15 minutes)

### 1. Get Claude API key
- Go to https://console.anthropic.com
- Sign up (free)
- Go to API Keys → Create Key
- Copy the key (starts with `sk-ant-...`)

### 2. Upload to GitHub
- Go to https://github.com/new
- Repository name: `fundshore`
- Click "Create repository"
- Click "uploading an existing file"
- Drag all files from this folder (keep the folder structure!)
- Click "Commit changes"

### 3. Connect Netlify to GitHub
- Go to https://app.netlify.com
- Click "Add new site" → "Import an existing project"
- Choose "GitHub"
- Select the `fundshore` repository
- Click "Deploy site"

### 4. Add API key to Netlify
- In Netlify: Site configuration → Environment variables
- Click "Add a variable"
- Key: `ANTHROPIC_API_KEY`
- Value: paste your Claude API key
- Click "Save"
- Go to Deploys → Trigger deploy → Deploy site

### 5. Set custom domain (optional)
- Site configuration → Domain management → Add custom domain
- Enter: `fundshore` (to get fundshore.netlify.app)

## Files

```
fundshore/
  index.html              ← Main website + Financial X-Ray
  netlify/
    functions/
      analyze.js           ← AI analysis (calls Claude API)
  README.md               ← This file
```

## Cost

Claude API: ~$0.003 per analysis. 1,000 users ≈ $3.
