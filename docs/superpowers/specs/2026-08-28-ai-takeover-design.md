# AI Takeover Design

## Goal

Add a real, auditable AI takeover flow to the persisted human-conversation system. Platform administrators manage provider credentials and model availability, tenant administrators configure an approved model and customer-service rules, and an assigned agent can hand an active conversation to AI or reclaim it.

## Confirmed boundaries

- DeepSeek uses its hosted OpenAI-compatible Chat Completions endpoint.
- LongCat uses an administrator-supplied OpenAI-compatible endpoint for a private deployment.
- Provider credentials belong to the platform, are encrypted at rest, and are never returned in full.
- Tenant administrators select enabled models and configure prompt, knowledge rules, temperature, output limit, handoff keywords, and usage limits.
- AI answers questions only. It cannot mutate orders, refunds, accounts, tickets, or other business records.
- Only the assigned agent may hand a human conversation to AI. Any agent may reclaim an AI conversation.
- Ended and evaluated conversations cannot enter AI mode.
- Provider errors, timeouts, invalid output, missing knowledge, or sensitive-operation requests return the conversation to the human queue.

## Runtime flow

1. Takeover changes the conversation from `human` to `ai`, retains the original agent for audit, clears human timeout deadlines, writes a system message and publishes a realtime event.
2. A customer message in `ai` status is persisted together with one pending invocation keyed by that message.
3. A scheduled worker claims pending invocations one conversation at a time, builds a bounded prompt from tenant rules and recent messages, calls the configured provider, persists the AI reply and usage, and publishes it.
4. Final provider failure or a handoff decision writes a system message, changes the conversation to `queued`, clears its agent, and publishes the handoff.
5. Reclaim changes `ai` to `human`, assigns the requesting agent, cancels pending invocations, writes a system message, and publishes the transition.

## Administration and observability

- Platform model management supports create, update, disable, connection test, masked secrets, and aggregate usage.
- Tenant AI management supports policy update, allowed-model selection, usage summaries, and invocation history.
- Invocation records include provider/model, status, latency, prompt/completion/total tokens, attempts, and a safe error summary.
- Model configuration changes and conversation AI transitions are audit logged.

## Safety defaults

- Temperature `0.3`, maximum output `800` tokens, provider timeout `30` seconds, two retries.
- At most 30 recent customer/agent/AI messages are sent; internal system and note content is excluded.
- API responses and logs never expose decrypted credentials.
- Model deletion is implemented as disabling when historical or tenant references exist.

