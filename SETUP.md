# Local Development Setup

## Initial Configuration

1. This repository uses a .gitignore file to protect API keys
2. Copy `refs.example.md` to `refs.md` and add your API keys
3. `refs.md` will NOT be tracked by git (for security)

## Steps

```bash
# 1. Create your local refs.md
cp refs.example.md refs.md

# 2. Edit refs.md and add your API keys:
#    - Tavus API Key (from https://app.tavus.io/settings/api-keys)
#    - Any other secrets you need locally

# 3. Keep refs.md private - do NOT commit it
#    (it's already in .gitignore)

# 4. Follow deployment instructions in DEPLOY.md
```

## Security

Never commit API keys to git! The `.gitignore` file protects:
- `refs.md` - Contains sensitive API keys
- `.env*` - Environment files
- `*.secret` - Secret files
- `*.key` - Key files

If you accidentally commit secrets:
1. Immediately rotate the exposed API key
2. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
3. Check GitHub's secret scanning alerts

## Sharing with Team

When collaborating:
1. Share API keys securely (e.g., encrypted vault, 1Password)
2. Each developer creates their own `refs.md`
3. Use environment variables in production
