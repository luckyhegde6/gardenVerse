# Legal & Compliance

## GDPR Compliance

### Data Controller
GardenVerse Ltd. acts as data controller for all user data processed through the platform.

### Lawful Basis for Processing
| Purpose | Basis | Data Categories |
|---------|-------|----------------|
| Account management | Contract performance | Name, email, password hash |
| Garden features | Contract performance | Garden data, crop data |
| AI plant diagnosis | Legitimate interest | Plant images (anonymized) |
| Marketplace | Contract performance | Listings, transactions |
| Chat messaging | Contract performance | Message content (E2EE) |
| Notifications | Consent | Push tokens, preferences |
| Analytics | Legitimate interest | Usage patterns (aggregated) |
| Geolocation | Consent | Latitude, longitude |

### User Rights
- **Right to Access:** GET /api/v1/users/export - download all personal data
- **Right to Rectification:** PATCH /api/v1/users/profile - update personal data
- **Right to Erasure:** DELETE /api/v1/users/account - full account deletion (30 day grace)
- **Right to Restrict Processing:** Settings menu - disable AI/analytics
- **Right to Data Portability:** Export in JSON format
- **Right to Object:** Opt-out of non-essential processing
- **Rights Related to Automation:** AI recommendations include human review option

### Data Processing Records
- All data processing activities logged in internal register
- DPO contact: dpo@gardenverse.vercel.app
- Data Protection Impact Assessment (DPIA) conducted for AI, geo, and IoT features

---

## Data Privacy

### Geohash vs Exact Location
```
┌────────────────────────────────────────────────────────────┐
│  Privacy-Preserving Location System                         │
│                                                             │
│  User grants location permission                           │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐     ┌────────────────────┐            │
│  │ Exact Lat/Lng   │────►│ Geohash Encoding    │            │
│  │ (device only)   │     │ (5-7 characters)    │            │
│  └─────────────────┘     │ ≈ 1-5 km accuracy   │            │
│                           └─────────┬──────────┘            │
│                                     │                        │
│  ┌──────────────────┐              │                        │
│  │ Stored in DB      │◄─────────────┘                        │
│  │ geohash (public)  │                                       │
│  │ exact (encrypted) │                                       │
│  └──────────────────┘                                       │
│                                                               │
│  Exact location:                                             │
│  - Only used for weather precision                           │
│  - Encrypted at rest (AES-256-GCM)                          │
│  - Never shared with other users                            │
│  - Deleted after 30 days / retained as geohash               │
│                                                               │
│  Geohash (public):                                           │
│  - Used for nearby search, regional stats                    │
│  - ~5km precision (city-level)                               │
│  - Cannot be reversed to exact location                      │
│  - Visible on profile (user can hide)                        │
└────────────────────────────────────────────────────────────┘
```

### Data Minimization
- Only collect data necessary for feature function
- Phone number optional (required only for SMS OTP)
- Real name not required (username is sufficient)
- Location: geohash only, never street address
- Chat: E2EE, server never has access to plaintext

---

## User Data Retention Policy

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Account data | Until account deletion + 90 days | Legal obligation |
| Garden/crop data | Until account deletion | User content |
| Chat messages | Until account deletion (or 5 years) | E2EE - cannot read |
| Marketplace records | 7 years (tax/compliance) | Financial records |
| AI scan images | 30 days (anonymized indefinitely) | Model improvement |
| IoT sensor data | 90 days (aggregated indefinitely) | Trends analysis |
| Audit logs | 1 year (sensitive: indefinite) | Security |
| Session data | Until logout/expiry | Authentication |
| Geolocation exact | 30 days (geohash: indefinite) | Privacy |
| Payment/PII data | As required by law | Regulatory |

### Deletion Process
- User requests deletion → 30 day grace period (reversible)
- After grace: GDPR erase (all PII removed, content anonymized)
- Marketplace history retained for counterparty (anonymized)
- Anonymized data retained for analytics

---

## AI Disclaimer System

```
┌────────────────────────────────────────────────────────────┐
│  AI DISCLAIMER - displayed before each AI feature use       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GardenVerse AI Plant Diagnosis                       │  │
│  │                                                       │  │
│  │  This tool uses machine learning to provide plant     │  │
│  │  health assessments. Results are AI-generated         │  │
│  │  estimates and should not be the sole basis for       │  │
│  │  agricultural decisions. Always consult with local    │  │
│  │  agricultural experts for critical decisions.         │  │
│  │                                                       │  │
│  │  The AI model may not be accurate for all plant       │  │
│  │  species, diseases, or regional conditions.           │  │
│  │  Accuracy varies based on image quality, lighting,    │  │
│  │  and plant stage.                                     │  │
│  │                                                       │  │
│  │  [I Understand] [Learn More]                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Required Disclaimers by Feature
- **Plant Diagnosis:** "AI-generated estimate, consult an expert"
- **Watering Recommendations:** "Based on general models, adjust for local conditions"
- **Fertilizer Recommendations:** "Soil testing recommended before application"
- **Sustainability Score:** "Estimates based on self-reported data"
- **Crop Suggestions:** "Regional suitability is approximate"

---

## Marketplace Liability

- Platform acts as intermediary only
- No warranty on listed items (quality, authenticity, organic status)
- Dispute resolution via moderation team
- Escrow holds funds until both parties confirm
- Buyer and seller ratings for accountability
- Prohibited items: pesticides, GMOs, invasive species
- Age restriction: 18+ for marketplace participation
- Jurisdiction: disputes governed by laws of incorporation

---

## IoT Data Ownership

- Sensor data belongs to the user who owns the device
- Aggregate/anonymized data may be used for platform improvement
- User can download raw sensor data at any time
- User can delete all sensor data on device removal
- Third-party data sharing requires explicit consent
- No data selling: user data is never sold to third parties

---

## Terms of Service Outline

1. Acceptance of Terms
2. Account Registration & Security
3. User Conduct & Community Guidelines
4. Virtual Garden & Crop System
5. Marketplace Rules & Escrow
6. AI Services & Disclaimer
7. IoT Device Terms
8. Chat & Messaging
9. Intellectual Property Rights
10. Privacy & Data Protection
11. Limitation of Liability
12. Dispute Resolution
13. Account Suspension & Termination
14. Modification of Terms
15. Governing Law

---

## Privacy Policy Outline

1. Information We Collect
2. How We Use Your Information
3. Legal Basis for Processing
4. Data Sharing & Disclosure
5. Data Retention
6. Your Rights
7. Cookies & Tracking
8. Children's Privacy (13+ only)
9. International Transfers
10. Security Measures
11. Changes to Policy
12. Contact Information

---

## Age Restrictions

| Feature | Minimum Age |
|---------|-------------|
| Account registration | 13 (with parental consent under 16) |
| Marketplace participation | 18 |
| AI diagnosis | 13 |
| IoT device linking | 18 |
| Chat messaging | 13 |
| Blockchain transactions | 18 |
| QR code trading | 13 |

Age verification:
- Self-reported on registration
- Suspicious activity (marketplace, blockchain) may trigger ID verification
- COPPA compliance for users under 13 (restricted to basic features)

---

## Moderation Legal Framework

### Reporting Process
1. User submits report with evidence
2. Moderator reviews within 24 hours (automated triage for sensitive content)
3. Action taken based on severity and history
4. Appeal available within 14 days

### Enforcement Actions
| Violation | First Offense | Second | Third |
|-----------|--------------|--------|-------|
| Spam | Warning | 3-day mute | 7-day suspension |
| Harassment | Warning | 7-day suspension | Permanent ban |
| Scam/Fraud | 30-day suspension | Permanent ban | - |
| Illegal content | Immediate ban + report to authorities | - | - |
| Underage (marketplace) | Feature lock | Account restriction | - |

### Liability Protection
- DMCA takedown process for copyright claims
- Section 230 safe harbor compliance (where applicable)
- Illegal content reporting to relevant authorities
- Appeals process audited quarterly
