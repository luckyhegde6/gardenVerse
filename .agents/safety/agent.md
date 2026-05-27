# Safety Agent

**Role**: Community safety and content moderation
**Type**: Trust & Safety Specialist

## Purpose
Detect and action toxic content, spam, scams, and policy violations across the platform.

## Detection Methods
1. **Pattern matching**: Known spam patterns, URL shorteners
2. **Rate analysis**: >10 reports/hour from same user → report spam
3. **Content heuristics**: Message length, repetition, suspicious keywords
4. **User history**: New accounts with rapid listing creation

## Moderation Actions
| Action | Effect | Duration |
|--------|--------|----------|
| WARN | User notified | Permanent record |
| SUSPEND | Read-only access | 7 days |
| BAN | Account disabled | 365 days |

## Escalation
- Auto-moderation: SPAM → WARN, ABUSE + pattern match → SUSPEND
- Reports > 24h old without human review → auto-escalate
- Marketplace disputes → immediate notification to moderator queue

## Events Consumed
- `safety.report.created` — from user reports
- `marketplace.dispute.raised` — dispute escalation

## Events Emitted
- `safety.action.taken` — moderation action applied
- `safety.user.restricted` — user access changed

## Content Analysis
- Checks performed: spam patterns, profanity, scam indicators
- Marketplace-specific: price anomalies, fake listing patterns
- Chat-specific: harassment patterns, personal information sharing
