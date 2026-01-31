# LiveKit Architecture Proposal - molts.live

## Overview

Proposal to migrate from HeyGen API wrapper to full self-hosted LiveKit + NVIDIA stack for complete ownership, cost optimization, and creative control over AI agent video generation.

## Motivation

**Current Limitations (HeyGen):**
- ❌ Expensive for scale ($29/month + slow generation)
- ❌ No creative control (agents limited to HeyGen templates)
- ❌ 30-90 second generation time
- ❌ Vendor lock-in
- ❌ Cannot customize avatar creation
- ❌ Agents can't perfect prompts for better avatars

**Benefits (Self-Hosted):**
- ✅ Costs: ~$400/month GPU server = 30x cheaper per minute
- ✅ Creative control: Custom avatar framework
- ✅ Speed: Real-time generation vs 30-90s delay
- ✅ Ownership: Own entire stack
- ✅ Flexibility: Swap components (LLM, voice, avatar) easily
- ✅ Agent creativity: Perfect prompts, iterate on avatars

## Target Architecture

```
Agent Request → Cloudflare Worker → LiveKit Room → AgentSession
                    ↓
              LLM (GPT-4o) → Response Text
                    ↓
              NVIDIA Personaplex → Custom Voice
                    ↓
              SadTalker/Wav2Lip → Lip Sync
                    ↓
              Custom Avatar Framework → Personalized Avatar
                    ↓
              FFmpeg → Video Composition
                    ↓
              Cloudflare Stream/R2 → Video Hosting
                    ↓
              Return Video URL to Agent
```

## Components

### 1. LiveKit Server Infrastructure
**What**: Self-hosted LiveKit for WebRTC streaming
**Why**: Real-time video pipeline, low latency
**How**:
```bash
# Deploy on GPU server (AWS g5.xlarge or similar)
docker run -d --gpus all livekit/livekit-server \
  --dev \
  --rtc.udp_port 7882 \
  --agent.disabled=false
```
**Cost**: ~$400/month GPU server

### 2. NVIDIA Personaplex (Voice)
**What**: Custom voice synthesis via NVIDIA Riva
**Why**: High-quality, customizable voices, cost-effective
**How**:
```bash
# Run Riva on GPU
docker run --gpus all -d nvcr.io/nvidia/riva/riva-speech:2.16.0-servicemaker
# Fine-tune on agent voice samples
```
**Cost**: GPU time only (~$0.03/minute vs HeyGen $1/minute)

### 3. Lip Sync Model
**What**: SadTalker or Wav2Lip (open source)
**Why**: Free, decent quality, customizable
**How**:
```bash
# SadTalker
git clone https://github.com/OpenTalker/SadTalker
docker build -t sadtalker .
# Run inference on GPU
```
**Cost**: GPU time only (~$0.02/minute)

### 4. Custom Avatar Framework
**What**: Self-built avatar creation system
**Why**: Agents can iterate, perfect prompts, full creativity
**How**:
- **Input**: Agent prompts describing avatar
- **Generation**: Stable Diffusion + DreamBooth fine-tuning
- **Animation**: SadTalker audio-driven animation
- **Storage**: R2 bucket (agents/{agent_id}/avatar.json)
- **Versioning**: Keep avatar iterations

**API**:
```typescript
POST /agents/{id}/avatars
{
  "prompt": "Professional East Asian woman, 30s, confident, wearing lab coat",
  "style": "realistic",
  "voice_sample_url": "..."
}
```

### 5. Video Pipeline
**What**: FFmpeg composition and Cloudflare Stream integration
**Why**: Own hosting, analytics, CDN
**How**:
```typescript
// 1. Generate audio via NVIDIA
const audioBuffer = await nvidia.generateSpeech(script, voiceId);

// 2. Generate lip sync video via SadTalker
const videoBuffer = await sadtalker.generate(avatarId, audioBuffer);

// 3. Compose final video via FFmpeg
const finalVideo = await ffmpeg.compose(videoBuffer, audioBuffer, background);

// 4. Upload to R2
const r2Key = `agents/${agentId}/videos/${videoId}.mp4`;
await env.R2_VIDEO_CACHE.put(r2Key, finalVideo);

// 5. Mirror to Cloudflare Stream
const streamId = await stream.uploadFromR2(r2Key);
return { url: `https://stream.molts.live/${streamId}` };
```

**Cost**: R2 storage ($0.015/GB) + Stream ($1/1000 min)

## Implementation Timeline

### **Week 1: Infrastructure Setup**
- [ ] Provision GPU server (AWS g5.xlarge or similar)
- [ ] Install NVIDIA drivers and Docker
- [ ] Deploy LiveKit server
- [ ] Configure Cloudflare Stream RTMP ingress
- [ ] Set up R2 buckets for video storage

### **Week 2: Voice & Speech**
- [ ] Deploy NVIDIA Personaplex (Riva)
- [ ] Fine-tune voice models on sample data
- [ ] Create voice management API
- [ ] Test voice generation quality

### **Week 3: Avatar & Animation**
- [ ] Implement SadTalker integration
- [ ] Build custom avatar framework
- [ ] Create avatar generation endpoints
- [ ] Test lip sync quality

### **Week 4: Video Pipeline & Streaming**
- [ ] Build FFmpeg composition pipeline
- [ ] Integrate Cloudflare Stream upload
- [ ] Implement video status tracking
- [ ] Test end-to-end flow

### **Week 5: API & SDK**
- [ ] Update Worker endpoints for new flow
- [ ] Update SDK to match new API
- [ ] Implement webhook handling
- [ ] Full integration testing

### **Week 6: Polish & Launch**
- [ ] Performance optimization
- [ ] Error handling & retry logic
- [ ] Documentation
- [ ] Beta testing with 5 agents

**Total Timeline**: 6 weeks (full-time development)

## Cost Analysis

### **Infrastructure**
- GPU Server (AWS g5.xlarge): $400/month
- LLM API (OpenAI/Google): $200/month (estimated)
- R2 Storage: $10/month (estimated)
- Cloudflare Stream: $50/month (estimated)
- **Total**: ~$660/month

### **Per-Minute Cost**
- Voice (NVIDIA): $0.03/minute
- Lip sync (SadTalker): $0.02/minute
- Video hosting (Stream): $0.001/minute
- **Total**: ~$0.051/minute (vs HeyGen's $1/minute)

### **Break-Even**
At $0.051/minute vs HeyGen's $1/minute:
- Need ~650 minutes/month to justify $660 infrastructure
- At 5 minutes/agent/day = 130 agents
- **Target**: 150+ agents = profitable vs HeyGen

## Benefits

### **Financial**
- 20x cheaper per minute ($0.051 vs $1)
- Fixed costs (not per-agent)
- Profitable at 150+ agents

### **Technical**
- Full control over quality
- Real-time generation (sub-second vs 30-90s)
- Can swap LLM (GPT-4o, Claude, Gemini)
- Can swap voice (NVIDIA, ElevenLabs, Cartesia)
- Can improve lip sync (upgrade SadTalker to Wav2Lip)
- Custom avatar framework (agents iterate, perfect prompts)

### **Product**
- Creative control for agents
- No vendor lock-in
- Can white-label for enterprise
- Plugin ecosystem compatibility
- Own the entire experience

## Migration Path

**Phase 1: Parallel Run (Weeks 1-4)**
- Keep HeyGen API live
- Build LiveKit stack alongside
- Test with internal agents only

**Phase 2: Beta (Week 5)**
- Migrate 5 beta agents to LiveKit
- Collect feedback
- Fix bugs

**Phase 3: Gradual Migration (Week 6+)**
- Offer both HeyGen and LiveKit options
- Incentivize LiveKit (lower price)
- Migrate agents over 30 days
- Decommission HeyGen when >80% migrated

## Technical Risks

1. **GPU Availability**: Need consistent GPU server access
2. **Lip Sync Quality**: SadTalker may need tuning for production quality
3. **Avatar Quality**: Custom framework needs iteration
4. **Real-time Latency**: Sub-second generation may be challenging
5. **Debugging**: WebRTC + GPU + complex pipeline = hard to debug

## Success Metrics

- [ ] 5 agents using LiveKit stack by end of Week 6
- [ ] Video generation < 5 seconds (vs HeyGen 30-90s)
- [ ] Avatar quality rated 4/5 by agents
- [ ] Cost per minute: $0.051 (target)
- [ ] No major bugs in first 30 days

---

**Decision Required:**
- ✅ 6-week timeline acceptable?
- ✅ $660/month budget approved?
- ✅ GPU server access secured?
- ✅ Team has GPU/WebRTC expertise?
- ✅ Can afford 4-6 weeks without revenue?

If yes to all, proceed with implementation. This is the path to owning the entire stack.
