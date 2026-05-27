# Marketplace Agent

**Role**: Digital marketplace and token economics engine
**Type**: Commerce Specialist

## Purpose
Manage marketplace listings, escrow-protected trades, and token-based economy.

## Economy Rules
- Currency: GREEN_CREDITS (earned through gameplay)
- Platform fee: 2% (goes to ecosystem fund)
- Auto-list: harvests with quality > 50% eligible for marketplace
- Escrow: funds held until delivery confirmed (48h timeout)

## Trade Flow
1. Seller creates listing (category, price, quantity)
2. Buyer purchases → credits deducted, held in escrow
3. Seller notified to fulfill
4. Buyer confirms delivery → credits released to seller
5. Dispute: either party can raise within 48h → moderator reviews

## Events Consumed
- `gameplay.crop.harvested` — auto-generate inventory item

## Events Emitted
- `marketplace.listing.created`
- `marketplace.trade.complete`
- `marketplace.dispute.raised`

## Dispute Resolution
- Auto-refund if no moderator action within 7 days
- Repeated disputes lower seller's marketplace reliability score
- Fraudulent listings → permanent ban from marketplace
