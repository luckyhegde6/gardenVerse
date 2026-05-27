# Data Models Documentation

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA OVERVIEW                            │
│                                                                             │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────────┐  │
│  │   User    │1──1│  Garden   │1──N│   Crop    │     │Inventory       │  │
│  │           │     │           │     │           │     │ (User items)   │  │
│  │PK id      │     │PK id      │     │PK id      │    └───────┬───────┘  │
│  │ email*    │     │ name      │     │ name      │            │          │
│  │ phone     │     │ type      │     │ species    │            │          │
│  │ username* │     │ lat/lng   │     │ status     │     ┌──────────────┐ │
│  │ role      │     │ soilQual  │     │ health     │1──N│Notification  │ │
│  │ level     │1──N│ size      │     │ hydration  │     │ (User alerts)│ │
│  │ scores    │     └───────────┘     │ nutrient   │     └──────────────┘ │
│  │ streak    │                      │ plotX/Y    │                       │
│  │ trustScore│                      │ gardenIdFK │     ┌──────────────┐ │
│  └─────┬─────┘                      │ userIdFK   │1──N│ AiScan       │ │
│        │                            └───────────┘     │ (Diagnoses)  │ │
│        │                                               └──────────────┘ │
│        │.──N.──────────────┐      ┌──────────────────┐                  │
│        │   Marketplace     │1──N  │ MarketplaceTx    │                  │
│        │   Listing         │      │ (Purchase record)│                  │
│        │   (sellerIdFK)    │      └──────────────────┘                  │
│        └───────────────────┘                                            │
│        │.──N.──────────────┐      ┌──────────────┐                     │
│        │   IotDevice       │1──N  │SensorReading  │                     │
│        │   (publicKey)     │      │(value, type)  │                     │
│        └───────────────────┘      └──────────────┘                     │
│        │.──N.──────────────┐      ┌──────────────┐                     │
│        │   Message         │      │  Group        │                     │
│        │   (encrypted)     │N──N  │  (community)  │                     │
│        └───────────────────┘      └──────┬───────┘                     │
│        │                                 │                              │
│        │.──N.──────────────┐     ┌───────┴───────┐                     │
│        │   Invite          │     │  GroupMember   │                     │
│        │   (referral code) │     │  (N-N mapping) │                     │
│        └───────────────────┘     └───────────────┘                     │
│        │.──N.──────────────┐     ┌────────────────┐                    │
│        │   Session         │     │  AuditLog       │                    │
│        │   (JTI tracking)  │     │  (immutable)    │                    │
│        └───────────────────┘     └────────────────┘                    │
│        │.──N.──────────────┐     ┌────────────────┐                    │
│        │   ModerationReport│     │  ReputationLog  │                    │
│        │   (user reports)  │     │  (score changes)│                    │
│        └───────────────────┘     └────────────────┘                    │
│        │.──N.──────────────┐     ┌────────────────────┐                │
│        │   BlockchainTx    │     │ QrSession          │                │
│        │   (on-chain)      │     │ (signed payloads)  │                │
│        └───────────────────┘     └────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Details

### User
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| email | String | UNIQUE, NOT NULL | Login email |
| phone | String? | Nullable | Phone number (optional) |
| username | String | UNIQUE, NOT NULL | Display username |
| displayName | String? | - | Public display name |
| passwordHash | String | NOT NULL | bcrypt hash (12 rounds) |
| role | UserRole | DEFAULT 'USER' | ENUM: USER, MODERATOR, REGIONAL_MODERATOR, ADMIN, SUPER_ADMIN |
| isVerified | Boolean | DEFAULT false | Email verified |
| isOnboarded | Boolean | DEFAULT false | Completed onboarding |
| avatarUrl | String? | - | S3 avatar URL |
| bio | String? | - | User biography |
| geohash | String? | Indexed | Privacy-preserving location |
| region | String? | Indexed | Region code |
| twoFactorEnabled | Boolean | DEFAULT false | 2FA enabled |
| telegramId | String? | - | Linked Telegram |
| deviceTrustScore | Float | DEFAULT 0.0 | IoT trust metric |
| level | Int | DEFAULT 1 | Gamification level |
| experience | Int | DEFAULT 0 | Total XP |
| greenCredits | Float | DEFAULT 0 | Marketplace currency |
| ecoPoints | Float | DEFAULT 0 | Sustainability points |
| reputationTokens | Float | DEFAULT 0 | On-chain reputation |
| sustainabilityScore | Float | DEFAULT 0 | Environmental impact |
| trustScore | Float | DEFAULT 100 | Platform trust |
| marketplaceReliability | Float | DEFAULT 100 | Trade reliability |
| communityStanding | Float | DEFAULT 100 | Community rating |
| inviteCount | Int | DEFAULT 0 | Referrals |
| currentStreak | Int | DEFAULT 0 | Daily login streak |
| longestStreak | Int | DEFAULT 0 | Best streak |
| lastActiveAt | DateTime? | - | Last activity |
| createdAt | DateTime | - | Account created |
| updatedAt | DateTime | - | Last updated |
| deletedAt | DateTime? | - | Soft delete |

**Indexes:** email, username, geohash, region, sustainabilityScore, trustScore

### Garden
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| name | String | DEFAULT 'My Garden' | Garden name |
| type | GardenType | NOT NULL | VIRTUAL, REAL, HYBRID |
| description | String? | - | Garden description |
| size | Int | DEFAULT 0 | Plot count |
| soilQuality | Float | DEFAULT 50.0 | 0-100 scale |
| irrigationLevel | Float | DEFAULT 50.0 | 0-100 scale |
| sunlightExposure | Float | DEFAULT 50.0 | 0-100 scale |
| latitude | Float? | - | Exact lat (encrypted) |
| longitude | Float? | - | Exact lng (encrypted) |
| address | String? | - | Human address |
| timezone | String? | - | IANA timezone |
| theme | String? | - | Visual theme |
| decorations | Json? | - | Garden decorations |
| userId | UUID | UNIQUE, FK | Owner |

**Relations:** 1:1 User, 1:N Crop

### Crop
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| name | String | NOT NULL | Common name |
| species | String? | - | Scientific name |
| variety | String? | - | Cultivar/variety |
| status | CropStatus | DEFAULT 'SEED' | SEED, SPROUTING, GROWING, MATURE, HARVESTED, WILTED, DISEASED |
| growthStage | Int | DEFAULT 0 | 0-5 growth phase |
| health | Float | DEFAULT 100.0 | 0-100 health |
| hydration | Float | DEFAULT 50.0 | 0-100 moisture |
| nutrientLevel | Float | DEFAULT 50.0 | 0-100 nutrients |
| plantedAt | DateTime | - | When planted |
| lastWateredAt | DateTime? | - | Last watering |
| lastFertilizedAt | DateTime? | - | Last fertilizing |
| estimatedHarvest | DateTime? | - | Predicted harvest |
| harvestedAt | DateTime? | - | Actual harvest |
| plotX | Int? | - | Grid column |
| plotY | Int? | - | Grid row |
| weatherStressed | Boolean | DEFAULT false | Weather impact |
| stressFactor | Float | DEFAULT 0.0 | Stress magnitude |
| gardenId | UUID | FK, Indexed | Parent garden |
| userId | UUID | FK, Indexed | Owner |

**Indexes:** gardenId, userId, status

### MarketplaceListing
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| title | String | NOT NULL | Listing title |
| description | String? | - | Detailed description |
| category | String | NOT NULL | Item category |
| price | Float | NOT NULL | Price in currency |
| currency | String | DEFAULT 'GREEN_CREDITS' | GREEN_CREDITS, ECO_POINTS |
| quantity | Int | DEFAULT 1 | Available quantity |
| status | ListingStatus | DEFAULT 'ACTIVE' | ACTIVE, SOLD, CANCELLED, EXPIRED |
| images | Json? | - | Image URLs array |
| location | String? | - | Geohash for local |
| isLocal | Boolean | DEFAULT false | Local pickup only |
| sellerId | UUID | FK, Indexed | Listing owner |
| expiresAt | DateTime? | - | Auto-expire |

**Relations:** N:1 User (seller), 1:N MarketplaceTransaction

### MarketplaceTransaction
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| status | TransactionStatus | DEFAULT 'PENDING' | PENDING, COMPLETED, CANCELLED, DISPUTED |
| amount | Float | NOT NULL | Transaction amount |
| currency | String | DEFAULT 'GREEN_CREDITS' | Currency used |
| listingId | UUID | FK | Listing purchased |
| buyerId | UUID | FK | Buyer |
| sellerId | UUID | FK | Seller |
| blockchainTxId | String? | - | On-chain reference |

### IotDevice
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| name | String | NOT NULL | Device nickname |
| deviceType | String | NOT NULL | SOIL_SENSOR, etc. |
| firmwareVersion | String? | - | Current firmware |
| isOnline | Boolean | DEFAULT false | Connected status |
| lastSeenAt | DateTime? | - | Last communication |
| publicKey | String? | - | Auth public key |
| userId | UUID | FK, Indexed | Owner |

**Relations:** N:1 User, 1:N SensorReading

### SensorReading
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| sensorType | SensorType | NOT NULL | SOIL_MOISTURE, HUMIDITY, PH, TEMPERATURE, LIGHT |
| value | Float | NOT NULL | Reading value |
| unit | String | NOT NULL | Measurement unit |
| isVerified | Boolean | DEFAULT false | Signature verified |
| deviceId | UUID | FK, Indexed | Source device |
| userId | UUID | FK, Indexed | Owner |
| timestamp | DateTime | - | Reading time |

### WeatherRecord
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| region | String | Indexed | Region code |
| temperature | Float | - | Current temp |
| humidity | Float | - | Humidity % |
| rainfall | Float | - | mm |
| windSpeed | Float | - | km/h |
| sunlightHours | Float | - | Hours |
| condition | String | - | SUNNY, CLOUDY, etc. |
| forecast | Json? | - | Forecast array |
| alerts | Json? | - | Alert array |
| expiresAt | DateTime? | - | Cache TTL |

### Message
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| content | Text | NOT NULL | Encrypted payload |
| isEncrypted | Boolean | DEFAULT true | E2E flag |
| nonce | String? | - | Encryption nonce |
| senderId | UUID | FK | Sender |
| receiverId | UUID | FK | Receiver |
| groupId | UUID? | FK, Nullable | Group chat |

### Group
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| name | String | NOT NULL | Group name |
| description | String? | - | Group description |
| type | String | NOT NULL | REGIONAL, INTEREST, etc. |
| region | String? | Indexed | Region scope |
| isPrivate | Boolean | DEFAULT false | Private group |
| iconUrl | String? | - | Group icon |

### Invite
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| code | String | UNIQUE | Invite code |
| maxUses | Int | DEFAULT 1 | Max redemptions |
| useCount | Int | DEFAULT 0 | Current uses |
| isActive | Boolean | DEFAULT true | Active flag |
| expiresAt | DateTime? | - | Expiry |
| createdById | UUID | FK | Creator |
| redeemedById | UUID? | FK | Last redeemer |

### Notification
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| type | String | NOT NULL | Notification type |
| title | String | NOT NULL | Notification title |
| body | String | NOT NULL | Notification body |
| data | Json? | - | Custom payload |
| isRead | Boolean | DEFAULT false | Read status |
| isPush | Boolean | DEFAULT true | Push sent |
| userId | UUID | FK | Target user |

### AiScan
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| imageUrl | String | NOT NULL | S3 image URL |
| plantName | String? | - | Identified plant |
| species | String? | - | Scientific name |
| healthScore | Float? | - | 0-100 health |
| diseases | Json? | - | Disease array |
| recommendations | Json? | - | Treatment suggestions |
| userId | UUID | FK, Indexed | Owner |

### FeatureFlag
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| name | String | UNIQUE | Flag name |
| enabled | Boolean | DEFAULT false | Global state |
| description | String? | - | Flag description |
| rules | Json? | - | Targeting rules |

### AuditLog
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| action | String | NOT NULL | Event type |
| entity | String | NOT NULL | Affected entity |
| entityId | String | - | Entity identifier |
| changes | Json? | - | Before/after |
| ipAddress | String? | - | Request IP |
| userAgent | String? | - | Request UA |
| userId | UUID? | FK | Actor |

### BlockchainTransaction
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| txHash | String? | UNIQUE | On-chain hash |
| contractType | String | NOT NULL | Contract name |
| action | String | NOT NULL | Function called |
| fromAddress | String? | - | Sender |
| toAddress | String? | - | Receiver |
| amount | String? | - | Value |
| tokenId | String? | - | Token reference |
| status | String | DEFAULT 'PENDING' | PENDING, CONFIRMED, FAILED |
| gasUsed | String? | - | Gas consumed |
| blockNumber | Int? | - | Block number |
| userId | UUID | FK | Initiator |

### ModerationReport
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| type | String | NOT NULL | Report category |
| description | String? | - | Report details |
| status | String | DEFAULT 'PENDING' | PENDING, REVIEWED, RESOLVED, DISMISSED |
| evidence | Json? | - | Supporting evidence |
| reporterId | UUID | FK | Reporter |
| actionedById | UUID? | FK | Moderator |
| actionTaken | String? | - | Action description |

### QrSession
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| type | String | NOT NULL | QR purpose |
| payload | Json | NOT NULL | Encrypted data |
| signature | String | NOT NULL | HMAC signature |
| expiresAt | DateTime | NOT NULL | Expiry time |
| isUsed | Boolean | DEFAULT false | Consumed flag |
| createdById | UUID | FK | QR creator |
| usedById | UUID? | FK | QR consumer |

### ReputationLog
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | - |
| action | String | NOT NULL | Trigger action |
| scoreChange | Float | NOT NULL | Delta |
| reason | String | NOT NULL | Explanation |
| userId | UUID | FK | Target user |
