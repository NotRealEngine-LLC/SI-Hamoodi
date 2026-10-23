# HAMOODI SI — Phase 05 Baseline Audit

**Date:** 2026  
**Phase:** 05 / 12 — SI Core Intelligence  
**Auditor:** Qwen Coder

---

## 1. Existing Provider Architecture

### Current Implementation
- **Location:** `src/lib/puter/ai.ts`
- **Status:** Basic Puter.js integration
- **Capabilities:**
  - ✅ Puter availability detection
  - ✅ Authentication check
  - ✅ Basic chat request (non-streaming)
  - ✅ Basic streaming support
  - ❌ No model discovery
  - ❌ No model capability registry
  - ❌ No error normalization
  - ❌ No request cancellation
  - ❌ No retry logic
  - ❌ No context assembly
  - ❌ No Hub/Project instruction integration

### Current AI Flow
```
User Input → sendAIRequest() → Puter.chat() → Response
```

### Missing Components
1. **Model Registry** — No dynamic model discovery
2. **Provider Abstraction** — Direct Puter calls scattered in UI
3. **Context Assembly** — Hub/Project instructions not used
4. **Streaming Infrastructure** — Basic but incomplete
5. **Error Handling** — Generic error messages
6. **Cancellation** — No AbortController usage
7. **Conversation Engine** — Basic CRUD only
8. **Message Versioning** — No branching/editing/regeneration

---

## 2. Working AI Features

### Functional
- ✅ Basic AI chat (simulated when Puter unavailable)
- ✅ Model selection (hardcoded list)
- ✅ Streaming responses (basic)
- ✅ Conversation persistence (Supabase)
- ✅ Message history

### Limitations
- ⚠️ Model list is static (not from Puter API)
- ⚠️ No model capability validation
- ⚠️ No Hub instruction integration
- ⚠️ No Project instruction integration
- ⚠️ No conversation branching
- ⚠️ No message editing
- ⚠️ No response regeneration
- ⚠️ No request cancellation
- ⚠️ No retry logic

---

## 3. Conversation Data Structure

### Current Schema
```typescript
interface Conversation {
  id: string;
  project_id: string | null;
  title: string;
  selected_model_id: string | null;
  is_pinned: boolean;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';
  model_id: string | null;
  created_at: string;
}
```

### Missing Fields
- `workspace_id` — For workspace-scoped conversations
- `parent_message_id` — For branching
- `generation_id` — For tracking generations
- `metadata` — For model/provider info
- `provider_adapter` — To track which provider was used
- `token_usage` — For cost tracking
- `parent_conversation_id` — For branch tracking

---

## 4. Streaming Limitations

### Current Implementation
```typescript
const response = await window.puter!.ai.chat(messages, {
  model: options.model || 'gpt-4o-mini',
  stream: !!options.onStream,
});

if (response instanceof ReadableStream && options.onStream) {
  const reader = response.getReader();
  let fullText = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = new TextDecoder().decode(value);
    fullText += chunk;
    options.onStream(chunk);
  }
}
```

### Issues
1. **No AbortController** — Cannot cancel requests
2. **No error handling** — Stream errors not caught
3. **No partial save** — If stream fails, partial content lost
4. **No metadata** — No token usage or model info returned
5. **No normalization** — Direct Puter response format

---

## 5. Provider-Specific Assumptions

### Current Assumptions
- Puter.js is always available (fallback to simulated)
- Model IDs are static strings
- All models support same features
- No capability differences between models
- No provider-specific error formats

### Reality
- Puter may not be signed in
- Models have different capabilities
- Some models don't support streaming
- Some models have context limits
- Error formats vary by provider

---

## 6. Security Concerns

### Current State
- ✅ Supabase RLS enforced
- ✅ Workspace membership checked
- ✅ No cross-tenant access
- ⚠️ Hub instructions not validated before use
- ⚠️ No prompt injection protection
- ⚠️ No file content sanitization

### Required Improvements
1. Validate Hub instructions before injection
2. Sanitize file content before sending to AI
3. Implement prompt injection detection
4. Add content filtering for sensitive data

---

## 7. Required Migrations

### Database Changes Needed

#### Extend `messages` table
```sql
ALTER TABLE messages ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE messages ADD COLUMN parent_message_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN generation_id TEXT;
ALTER TABLE messages ADD COLUMN provider_adapter TEXT;
ALTER TABLE messages ADD COLUMN metadata JSONB;
ALTER TABLE messages ADD COLUMN token_usage JSONB;
```

#### Extend `conversations` table
```sql
ALTER TABLE conversations ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE conversations ADD COLUMN parent_conversation_id UUID REFERENCES conversations(id);
ALTER TABLE conversations ADD COLUMN forked_from_message_id UUID REFERENCES messages(id);
ALTER TABLE conversations ADD COLUMN branch_label TEXT;
```

#### Create `generation_traces` table
```sql
CREATE TABLE generation_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  provider_adapter TEXT NOT NULL,
  model_id TEXT NOT NULL,
  request_metadata JSONB,
  response_metadata JSONB,
  token_usage JSONB,
  duration_ms INTEGER,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Create `ai_model_preferences` table
```sql
CREATE TABLE ai_model_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  model_id TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, model_id)
);
```

---

## 8. Technical Debt

### High Priority
1. **Scattered AI calls** — AI logic in UI components
2. **No provider abstraction** — Direct Puter dependency
3. **No error recovery** — Failures not handled gracefully
4. **No context limits** — Can exceed model context
5. **No cancellation** — Cannot stop long requests

### Medium Priority
1. **Static model list** — Not from Puter API
2. **No capability checks** — Assume all models same
3. **No usage tracking** — No cost/usage visibility
4. **No retry logic** — Transient errors fail permanently

### Low Priority
1. **No model favorites** — Cannot save preferences
2. **No recent models** — No usage history
3. **No advanced routing** — No smart model selection

---

## 9. Architecture Recommendations

### Target Architecture
```
UI Components
    ↓
SI Intelligence Service (orchestration)
    ↓
├── Context Assembler (Hub/Project instructions)
├── Model Registry (discovery + capabilities)
├── Model Router (selection policies)
├── Provider Gateway (Puter adapter)
├── Stream Normalizer (event protocol)
├── Conversation Engine (branching/editing)
├── Usage Recorder (traces + metrics)
└── Error Handler (recovery + retries)
```

### Key Principles
1. **Single entry point** — All AI calls through SI Intelligence Service
2. **Provider agnostic** — UI doesn't know about Puter
3. **Typed contracts** — Clear interfaces for all components
4. **Error boundaries** — Graceful degradation
5. **Observable** — Traces, metrics, usage tracking

---

## 10. Implementation Priority

### Phase 05A — Core Infrastructure
1. SI Intelligence Service skeleton
2. Puter provider adapter with proper error handling
3. Model registry with dynamic discovery
4. Basic streaming with cancellation
5. Context assembler (Hub instructions)

### Phase 05B — Conversation Engine
1. Message versioning
2. Conversation branching
3. Message editing
4. Response regeneration
5. Generation traces

### Phase 05C — Advanced Features
1. Model router with policies
2. Usage tracking
3. Error recovery
4. Advanced chat UI
5. Model selector with capabilities

---

## 11. Success Criteria

### Minimum Viable
- ✅ Real Puter integration (not simulated)
- ✅ Dynamic model discovery
- ✅ Streaming with cancellation
- ✅ Hub instruction integration
- ✅ Basic error handling
- ✅ Conversation persistence

### Full Implementation
- ✅ Conversation branching
- ✅ Message editing
- ✅ Response regeneration
- ✅ Model capability validation
- ✅ Usage tracking
- ✅ Advanced error recovery
- ✅ Generation traces

---

## 12. Risks & Mitigations

### Risk: Puter API Changes
**Mitigation:** Abstract behind provider interface

### Risk: Model Availability
**Mitigation:** Dynamic discovery with fallback

### Risk: Context Overflow
**Mitigation:** Token estimation with truncation

### Risk: Streaming Failures
**Mitigation:** Partial save + retry logic

### Risk: Cost Overruns
**Mitigation:** Usage tracking + user awareness

---

## 13. Next Steps

1. Create database migrations
2. Build SI Intelligence Service
3. Implement Puter provider adapter
4. Build model registry
5. Implement context assembler
6. Build conversation engine
7. Create advanced chat UI
8. Add error handling
9. Write tests
10. Document architecture

---

**Audit Complete:** 2026  
**Status:** Ready for Phase 05 implementation  
**Priority:** High — Core intelligence layer
