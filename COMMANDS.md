# CordX — Commands Guide

## 1. Initial Setup

```bash
# Clone / enter the folder
git clone https://github.com/youruser/cordx.git
cd cordx

# Install dependencies
npm install
```

---

## 2. Publish to npm (NO npm login needed)

### Set your token

You need an npm Automation token. Get it at:
https://www.npmjs.com/settings/YOUR_USERNAME/tokens

Set it as environment variable:

**Linux / macOS (temporary):**
```bash
export NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxx
```

**Linux / macOS (permanent, add to ~/.bashrc or ~/.zshrc):**
```bash
echo 'export NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxx' >> ~/.bashrc
source ~/.bashrc
```

**Windows CMD:**
```cmd
set NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxx
```

**Windows PowerShell:**
```powershell
$env:NPM_TOKEN="npm_xxxxxxxxxxxxxxxxxxxx"
```

The `.npmrc` file already has:
```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```
So it picks up the env variable automatically — no `npm login` needed.

### Publish

```bash
# First publish
npm publish

# Update version then publish again
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0
npm publish
```

---

## 3. Git — Commit & Push

```bash
# Init (first time only)
git init
git remote add origin https://github.com/youruser/cordx.git

# Stage all changes
git add .

# Commit
git commit -m "feat: initial release"

# Push
git push origin main

# Push with tags (after npm version)
git push origin main --tags
```

---

## 4. Install CordX in your bot project

```bash
# npm
npm install cordx discord.js

# yarn
yarn add cordx discord.js

# pnpm
pnpm add cordx discord.js
```

---

## 5. Full release workflow (version bump → git → npm)

```bash
npm version patch                      # bumps version in package.json + git tag
git push origin main --tags            # push code + tag to GitHub
npm publish                            # publish new version to npm
```

---

## 6. GitHub Actions (auto publish on push to main)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add your token in GitHub → Settings → Secrets → `NPM_TOKEN`.

Then just run:
```bash
npm version patch && git push origin main --tags
```
And it publishes automatically.
