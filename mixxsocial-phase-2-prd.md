# MixxSocial — Phase 2 PRD
## Theme Packs, Host Platform & Commercialization

**Version:** 2.0
**Owner:** Brock
**Status:** Draft for development
**Supersedes:** nothing — extends the Phase 1 / Pilot MVP PRD (v0.1)
**Last updated:** August 31, 2026

---

## 0. How to read this document

Section 2 is a **verification checklist of Phase 1 scope**, not new work. Confirm each item is actually shipped and behaving before Phase 2 begins. Anything unchecked becomes a Phase 2 prerequisite and should be scheduled ahead of new feature work.

Section 3 flags **decisions that should wait on pilot data**. If the pilot event has not yet run with real guests in a real venue, those decisions are not ready to make, and building past them risks committing to the wrong design.

Everything from Section 4 onward is new Phase 2 scope.

---

## 1. Brand

### 1.1 Name
**MixxSocial** — double "x", one word, capital M and S in the wordmark.

Selected over "MixSocial" and "SocialMix" because both of those collide with existing businesses, including a general social network, a social casino site, marketing agencies, and — most problematically for "SocialMix" — a funded hospitality startup serving venues and mixologists. The double-x makes the string near-unique, which materially strengthens trademark position and makes search results winnable.

### 1.2 Naming and usage rules
- Written as **MixxSocial** in all product copy, marketing, and legal documents. Not "Mixx Social", not "MIXXSOCIAL", not "mixxsocial" outside of URLs and handles.
- Lowercase `mixxsocial` is correct in domains, handles, and email addresses.
- The product is an **icebreaker game** or **event icebreaker platform**. Avoid leading with "bingo" in the product UI — it reads dated and skews the brand toward church hall and corporate team-building. "Bingo" is fine in marketing copy where it does fast explanatory work.
- Users are **guests** (people playing) and **hosts** (people buying and running events). "Promoter" is a subtype of host, not the general term — this matters now that the addressable market extends well beyond nightlife.

### 1.3 Digital properties
| Property | Value | Status |
|---|---|---|
| Primary domain | mixxsocial.com | Available — register |
| Defensive domain | mixsocial.app | Available — register, redirect to primary |
| Instagram | @mixxsocial | Claim immediately |
| TikTok / X | @mixxsocial | Claim defensively |

All product URLs, emails, and QR destinations resolve to **mixxsocial.com**. The defensive domain 301-redirects and is never used in printed materials.

### 1.4 Visual direction
The brand must work in two very different rooms: a dark, loud nightclub and a hotel ballroom at a professional networking mixer. That is a real constraint on the design system, not a stylistic preference.

- **Clean and modern, not club-flyer.** The double-x carries a faint edgy connotation that plays fine in nightlife but is off-key for corporate, alumni, and faith-based events. The visual identity should neutralize it rather than lean into it.
- **Dark theme is the product default** (venue conditions), but the marketing site and host-facing dashboard should support a light presentation for credibility with corporate buyers.
- **Host-configurable accent color** so the game can visually match an event without requiring custom design work. See §6.
- High contrast and large type throughout the guest experience — the Phase 1 environmental constraints still govern.

### 1.5 Voice
Warm, direct, low-hype. The product's promise is that strangers end up talking to each other; the copy should sound like a good host, not a hype man. Avoid dating-app phrasing entirely — no "matches," no "connections you'll love," no heart iconography. Guests **meet** people and **complete** challenges.

---

## 2. Phase 1 Baseline — Verify Before Starting

Confirm each of these is shipped and working. Unchecked items are Phase 2 prerequisites.

**Guest flow**
- [ ] Event QR code at the door opens the mobile web app; no download required
- [ ] Display-name entry and survey completion (8–12 tap-only questions, <60s)
- [ ] Marketing consent captured as a separate, explicit, non-required opt-in
- [ ] Player identity issued: unique QR code **plus** 4-character human-readable short code
- [ ] Card generated per player, non-identical between players
- [ ] Scanner works in low light; short-code manual entry available as a first-class fallback

**Connection handshake**
- [ ] Player A scans (or types) Player B's code
- [ ] Player B receives a prompt and must confirm within a 60-second window
- [ ] Expired attempts record no connection
- [ ] On confirmation, both players' cards evaluate against the other's survey answers
- [ ] Matching squares complete; both players see what filled and why

**Scoring**
- [ ] Both scoring models implemented: *most connections by last call* (default) and *first to complete*
- [ ] Tiebreakers in order: time to reach score → trait diversity → earliest check-in
- [ ] Scoring is server-authoritative; client never computes final score
- [ ] Game clock start/stop with server-side time authority

**Anti-fraud**
- [ ] Unique player pair counts once per event (uniqueness constraint on the unordered pair)
- [ ] Self-scanning blocked
- [ ] Participation gated by the event door QR
- [ ] Scan cooldown enforced (20–30s)
- [ ] Traits verified from survey data, never self-reported at claim time
- [ ] All connection events timestamped and logged for audit
- [ ] Anomaly flags surfaced for manual review before prize award

**Safety**
- [ ] No directed matching — challenges are trait-based, never "go find [named person]"
- [ ] No location display, proximity, or "who's near me"
- [ ] No roster browsing or profile browsing
- [ ] Only display name visible to other players
- [ ] Block (blocked pairs cannot connect) and report-to-staff available
- [ ] Dismiss is one tap and penalizes neither party
- [ ] Age gating consistent with venue requirements

**Host**
- [ ] Event setup: name, venue, date, game clock, card size, scoring model, completion mode
- [ ] Print-ready event QR asset generation
- [ ] Live console: check-ins, survey completions, active players, total connections, live leaderboard
- [ ] Manual controls: pause, extend clock, end game and lock scoring
- [ ] Broadcast message to all players
- [ ] Post-event report with funnel metrics and CSV export of opt-in contacts

**Legal**
- [ ] Winner determined by achievement only — never by random drawing
- [ ] Published in-app rules stating the winner selection method plainly
- [ ] Privacy policy and terms presented at check-in
- [ ] Attorney review of promotion mechanics completed before first paid event

---

## 3. Decisions Gated on Pilot Data

Do not finalize these until at least one real event has run with real guests.

| Decision | What the pilot must tell us |
|---|---|
| Default square completion mode | Whether auto-fill or prompt-to-reveal produced more actual conversation, and what each cost in completion rate |
| Handshake window length | Whether 60 seconds survives pockets, bathrooms, and dead phones, or needs extending |
| Survey length | Whether 8–12 questions is too long at a door with a line behind it |
| Card size default | Whether 5×5 is achievable at typical attendance, or 4×4 should be default |
| Scan cooldown | Whether 20–30s is friction or protection in practice |
| Catch-up mechanic | Whether late arrivals disengage badly enough to need one |

**If the pilot has not yet run, run it before building Section 5.** Theme packs are a large investment that assumes the core loop works; validating that assumption first is cheaper than reworking packs later.

---

## 4. Phase 2 Goals

1. **Make the product serve multiple event verticals** without custom work per event — the theme pack system is the mechanism.
2. **Move hosts to self-serve** so growth is not gated on founder involvement in every event.
3. **Turn the pilot into revenue** with per-event billing.
4. **Deepen host-perceived value** through branding, reporting, and repeat-event tooling.

### 4.1 Phase 2 success metrics
| Metric | Target |
|---|---|
| Host self-serve setup completion (no founder assistance) | ≥ 70% of new hosts |
| Median host setup time | < 10 minutes |
| Events using a non-nightlife theme pack | ≥ 40% of events |
| Host repeat rate (books a 2nd event within 90 days) | ≥ 40% |
| Paid conversion after free pilot event | ≥ 50% |

### 4.2 Non-goals for Phase 2
- Native iOS/Android apps
- Guest-to-guest messaging or persistent guest profiles across events
- Public theme pack marketplace with third-party authors (Phase 3)
- Multi-day and multi-venue events (Phase 3)
- Any random-draw prize mechanic (see §9)

---

## 5. Theme Packs — Core Phase 2 Feature

### 5.1 Purpose
A theme pack is the unit that adapts MixxSocial to an audience. It is now the primary mechanism for entering every market beyond nightlife, and should be treated as core architecture rather than a host convenience.

### 5.2 What a pack contains
- **Pack metadata** — name, description, target audience, recommended event types, recommended card size
- **Survey questions** — the tap-only questions guests answer at check-in
- **Trait definitions** — the derived attributes that questions produce
- **Square challenges** — the "find someone who…" copy shown on cards, mapped to traits
- **Conversation prompts** — the prompt-to-reveal text for each trait (required if that completion mode is used)
- **Tone settings** — copy register (playful / professional / warm)
- **Optional visual theme** — accent color and background treatment

### 5.3 Data model additions
- **ThemePack** — id, name, description, audience tags, tone, visual theme, ownership (system / host-owned), status (draft / published / archived), version
- **Question** — pack id, prompt text, answer options, question type, display order, required flag
- **Trait** — pack id, label, derivation rule (which question + which answer values produce it)
- **SquareChallenge** — trait id, card display copy, conversation prompt copy, difficulty weight
- **EventPackSelection** — event id, pack id(s), enabled/disabled question overrides

An event may combine **one primary pack plus optional add-on packs**. Trait namespacing must prevent collisions when packs are combined.

### 5.4 Launch pack library (system-provided)
Ship these at minimum:

1. **Nightlife** — the pilot pack; music taste, going-out habits, travel, hometown
2. **Professional Networking** — industry, role function, career stage, professional interests, what they're looking for at the event
3. **Conference / Trade Show** — session interests, first-time vs. returning attendee, company size, discipline
4. **Corporate Team Building** — department, tenure, work style, non-work interests
5. **Alumni / Reunion** — graduation era, major, current city, campus memories
6. **Community / Faith Group** — service interests, family stage, how long they've attended, hobbies
7. **Wedding / Private Party** — how they know the couple/host, hometown, travel distance, fun facts
8. **General Mixer** — safe, universal default when nothing else fits

### 5.5 Question design requirements
- **Tap-only.** No free text in the guest survey. Free text breaks trait matching and slows check-in.
- **Every question must produce at least one matchable trait.** A question that cannot fill a square does not belong in a pack.
- **Traits must be reasonably common.** A trait held by one guest in three hundred creates an unfillable square. See §5.7.
- **Answer sets sized 3–6 options.** Larger sets fragment the trait pool and make matching rare.
- **No sensitive attributes.** Packs must not ask about health, disability, religion (as belief rather than community membership), political affiliation, sexual orientation, immigration status, income, or any protected characteristic. This is non-negotiable and applies to host-authored packs as well — see §5.6.
- **Tone must match the pack's audience.** A question that lands in a nightclub can be inappropriate at a corporate mixer.

### 5.6 Host-authored packs and custom questions
Hosts may create custom packs or add questions to a system pack.

- Custom questions follow the same structural rules (tap-only, 3–6 options, trait-producing).
- **All custom content passes a content policy check before going live**, covering the prohibited attribute list in §5.5 plus harassment, sexual content, and anything that could single out an individual guest.
- Automated screening plus a manual review queue for flagged content. Do not ship host-authored packs without a review path — a host asking an inappropriate question inside your product is your reputational problem, not theirs.
- Host-authored packs are private to that host's account by default.

### 5.7 Card generation from packs
Card generation must become pack-aware and pool-aware.

- Generate squares from the traits available in the selected pack(s).
- **Feasibility check:** as guests check in, the system knows the live trait distribution. A square whose trait is held by fewer than *N* checked-in guests (suggested N=3, configurable) should be avoided for new cards.
- **Late-generation option:** consider generating or refreshing cards shortly after check-in rather than at the moment of survey completion, so the card reflects a fuller picture of who is actually in the room. This is a meaningful improvement over Phase 1 behavior and should be evaluated against added complexity.
- Difficulty weighting: mix easy (common trait) and hard (rare trait) squares so cards are neither trivial nor impossible.
- **Unfillable-square handling:** if the room composition makes a square impossible, the system should swap it rather than leave a guest stuck. Define and implement a swap rule.

### 5.8 Host pack selection UX
- Browse packs by event type with a preview of sample questions and sample squares
- One-click apply, then optionally toggle individual questions off
- "Preview as guest" mode showing the actual survey and a sample card before publishing
- Recommended pack surfaced based on the event type chosen during setup

---

## 6. Host Platform

### 6.1 Self-serve accounts
- Email signup, verification, password reset
- Host profile: organization name, contact, event types they run
- Multiple events per host account, with list, status, and history views
- **Team access:** invite additional users to a host account with roles (owner / manager / door staff). Door staff need live console access without billing or data export permissions.

### 6.2 Event setup wizard
Target under 10 minutes for a first event, under 3 minutes for a repeat.

1. Event basics — name, type, venue, date, start/end, expected attendance
2. Theme pack selection (recommended pack pre-selected from event type)
3. Game configuration — card size, scoring model, completion mode, game clock
4. Prize description (display text; fulfillment remains offline)
5. Branding — accent color, logo upload
6. Preview as guest
7. Publish → QR asset generation

### 6.3 Event templates and duplication
Duplicate a past event with all settings, pack selections, and branding intact. This is the single highest-leverage feature for hosts running recurring events, and directly drives the repeat-rate metric.

### 6.4 QR asset generation
Expand beyond the Phase 1 print asset:
- Poster (multiple sizes), table tent, wristband/badge card, digital screen asset
- Host branding applied automatically
- PDF and PNG export

### 6.5 Live console improvements
- **Big-screen mode** — a projectable leaderboard for venue screens, with host branding, large type, and a live-updating top 10. Must be legible from across a room and safe to leave running unattended.
- Real-time trait heat: which squares are proving hard to fill (helps hosts nudge the room)
- Broadcast message templates ("30 minutes left", "leaderboard is tight")
- Guest support view: look up a guest by short code to resolve check-in problems at the door

### 6.6 Post-event reporting
- Everything from Phase 1, plus:
- Comparison against the host's previous events (engagement trend over time)
- Per-question response breakdown, useful for hosts choosing packs next time
- Shareable summary export (PDF) hosts can forward to a venue owner or sponsor — this is a sales tool for the host, and indirectly for you
- Winner audit trail available for dispute resolution

---

## 7. Branding & Sponsorship

- **Host branding:** logo and accent color applied to guest experience, leaderboard, and QR assets
- **Sponsor slot:** a sponsor logo and short message displayed on the card screen and big-screen leaderboard. This lets hosts monetize the game themselves, which is a strong argument for the per-event fee.
- Sponsor content is display-only in Phase 2 — no click tracking, no lead capture, no sponsor-specific data access. Keep the data boundary clean.

---

## 8. Billing

- Per-event pricing charged to the host, card on file
- First event free, applied automatically to new host accounts
- Pricing tiers by expected attendance (define bands during implementation)
- Invoice and receipt generation; downloadable billing history
- Payment provider integration (Stripe or equivalent) — never store raw card data
- Failed-payment handling that does not disable an event already in progress

---

## 9. Legal & Compliance — Phase 2 Additions

**The Phase 1 constraints remain in full force.** Winners are determined by achievement, never by chance. Any guest-side fee must not be tied to a chance-based prize. Do not let the expansion into new verticals dilute this.

New considerations introduced by Phase 2:

- **Guest-side access fee** (if implemented): permitted only where the prize remains achievement-based. If a host ever wants a random draw, it must be structured as a free-entry sweepstakes with a genuine, visible, equal no-purchase-necessary path — and reviewed by counsel first.
- **Minors.** Expansion into alumni, community, faith-group, school, and family events means guests under 18 become plausible for the first time. This is a materially different compliance posture than a 21+ nightclub. Required: an event-level age policy set by the host, age gating enforced at check-in, and — where under-18 participation is permitted — a review of parental consent obligations and children's privacy law before those events go live. **Do not ship under-18 support without counsel review.**
- **Corporate and enterprise buyers** will ask for a data processing agreement, security documentation, and a data retention policy. Prepare these before pursuing that segment rather than during a deal.
- **Host-authored content liability.** Terms must make clear that hosts are responsible for custom questions they author, that MixxSocial reviews and may reject content, and that MixxSocial may remove content at its discretion.
- **Data ownership across verticals.** The Phase 1 rule stands: contractually define what the host receives, what the platform retains, and permitted uses, and tell guests plainly who they are consenting to hear from.
- **Multi-state operation.** Promotion rules vary by state. Because winners are achievement-based, the gambling exposure is low, but confirm with counsel before marketing outside Texas.

---

## 10. Technical Requirements

- Existing Phase 1 platform decisions stand: mobile web, no download, server-authoritative scoring, real-time handshake and leaderboard, graceful degradation to polling.
- **Theme pack content must be data, not code.** Adding a pack must not require a deploy.
- **Pack versioning:** an event in progress must be pinned to the pack version it launched with. Editing a pack must never alter a running or completed event's cards or results.
- **Scale target:** raise to multiple concurrent events across different hosts, up to ~1,000 concurrent players platform-wide. Event data must be fully isolated per event.
- **Content moderation pipeline** for host-authored questions, with a review queue and audit log.
- **Role-based access control** for host team accounts.
- **Backfill:** existing pilot event data should map onto the new pack model as the "Nightlife" pack, so historical reporting survives the migration.

---

## 11. Phase 3 (Out of Scope, Recorded)

- Public theme pack marketplace with third-party authors
- Multi-day and multi-venue events; conference-wide games across sessions
- Returning-guest recognition across events (requires a much heavier privacy review)
- Native apps, if data ever justifies them
- Venue and sponsor-facing packages sold directly
- API or integrations with event registration platforms (Eventbrite, Cvent) for pre-event check-in

---

## 12. Open Questions

1. Does an event use exactly one pack, or is combining packs genuinely useful? Combining adds real complexity to trait namespacing and card balance.
2. Should hosts see aggregate cross-event benchmarks ("your engagement vs. similar events")? Valuable, but requires a clear policy on using one host's data to inform another's view.
3. What is the pricing band structure, and does the free first event apply per host account or per venue?
4. Do corporate buyers need SSO? If enterprise is a real target, this arrives sooner than expected.
5. Should the guest-side fee be built in Phase 2 at all, or deferred until per-event host pricing has proven itself?
6. Who reviews the moderation queue day to day, and what is the turnaround commitment to hosts?

---

## 13. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Building Phase 2 before the pilot has run | Large investment on unvalidated core loop | Run the pilot first; honor the §3 gates |
| Theme packs balloon in scope | Phase 2 never ships | Ship the 8 system packs first; host-authored packs can follow |
| Inappropriate host-authored questions | Reputational damage, lost accounts | Mandatory content review pipeline before go-live |
| Broadening to corporate puts you against entrenched incumbents | Losing the fight on their turf | Lead with nightlife and adjacent social events where you have distribution; treat corporate as expansion, not the beachhead |
| Under-18 guests at new event types | Serious compliance exposure | Event-level age policy, enforced gating, counsel review before enabling |
| Rare traits make squares unfillable at smaller events | Guest frustration, low completion | Pool-aware generation and swap rules (§5.7) |
| Pack edits corrupt historical event results | Data integrity, disputed winners | Strict pack versioning with event pinning |
