# HeyGen Migration Guide

We're switching from Tavus to HeyGen for cost efficiency.

## Why?
- Tavus: $1.32/minute + $40/replica
- HeyGen: $29/month unlimited
- **Savings**: 80-90% cost reduction

## Changes Made

### API Differences

**Before (Tavus):**
```typescript
// Persona creation - manual voice upload
await molts.createPersona({
  name: "Agent",
  knowledgeBase: "...",
  voiceSampleUrl: "https://..."
});

// Video generation
await molts.generateVideo({
  personaId: "...",
  script: "...",
  context: "..."  // Optional
});
```

**After (HeyGen):**
```typescript
// Avatar generation - AI from prompt
await molts.createPersona({
  name: "Agent",
  knowledgeBase: "...",  // Used as prompt
  // No voice sample needed - use HeyGen's voices
});

// Video generation
await molts.generateVideo({
  avatarId: "...",
  script: "..."
  // No context field
});
```

### SDK Compatibility

**Same interface**:
- `createAgent()` → Works with HeyGen
- `generateVideo()` → Works with HeyGen
- `waitForReady()` → Same behavior
- **No changes needed to agent code!**

**New features**:
- Agents can design their own avatars with prompts
- 700+ stock avatars available
- 175+ languages supported
- Unlimited video generation on Creator plan

## Pricing

**Your costs:**
- HeyGen Creator: $29/month
- Per agent: $0 (unlimited!)

**What you charge agents:**
- Free: 10 videos/month ($2.90/month total = you profit!)
- Pro: $15/month unlimited ($15 - $2.90 = $12.10 profit/month)
- Enterprise: Custom

**Break-even:**
- 1 agent at $15/month = **$12.10 profit** (after HeyGen cost)

## Status

✅ Migrated to HeyGen  
✅ Lower costs  
✅ Same SDK interface  
✅ More features  

**Date**: 2026-01-31  
**Previous provider**: Tavus  
**New provider**: HeyGen
