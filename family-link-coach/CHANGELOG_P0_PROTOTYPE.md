# CHANGELOG_P0_PROTOTYPE

## P1 improvement coding pass

Updated file: `index.html`

### Added

- Added an interactive `종료 갈등 대화 코치` inside the request flow.
  - Scenarios: `5분만 더`, `친구들이랑 하는 중`, `나만 못 하게 해`, `숙제 다 했어`, `부모가 마음대로 바꿨어`.
  - Each scenario shows trigger, parent wording, words to avoid, and next repair action.
- Added a computed pilot-readiness score to the home and weekly review screens.
  - Score is based on settings checklist completion, parent response to request, review save, and self-regulation activity logs.
- Preserved the no-surveillance/no-OS-control stance while making the product feel more like a repeat-use coaching app.

### Safety notes

- The conflict coach avoids shame, character judgment, secret monitoring, or bypass guidance.
- Sleep, food, safety contact, and basic affection remain outside reward/punishment trading.
- The feature remains a local P0 sample; it does not collect device usage, location, messages, or screen content.

## P0 mobile interactive prototype upgrade

Updated file: `index.html`

### Scope

- Rebuilt the previous static tab demo as a P0 clickable mobile web prototype.
- Reflected the T12~T15 deliverables:
  - `P0_SAFETY_PRIVACY_COPY_KO.md`
  - `P0_PARENT_EDUCATION_AND_SCRIPTS_KO.md`
  - `P0_ALTERNATIVE_ACTIVITY_CARDS_KO.md`
  - `P0_MOBILE_FLOW_SPEC_KO.md`

### Implemented clickable flow

1. Start / service scope screen
2. Guardian confirmation checkboxes
3. Child explanation and assent-style confirmation
4. Parent onboarding inputs
5. Lifestyle pattern summary
6. Child goal selection
7. First-week rule draft
8. Family contract generation
9. Official protection-tool settings checklist
10. Home dashboard
11. Additional-time request and parent response
12. Alternative activity selection and completion logging
13. Weekly review and next-week rule adjustment

### Interaction details

- Added stateful screen routing with primary CTAs and bottom tabs.
- Added local sample state persistence with `localStorage`.
- Added explicit in-app copy that localStorage is only browser-local sample state and not server transmission, account sync, or automatic usage collection.
- Added checklist toggles, goal selection, request/response state, activity completion logging, weekly review selection, and contract Markdown copy action.
- Added meaningful sheet interaction for the parent conversation prompt instead of toast-only response.

### Safety and product-language changes

- Reframed the product as a parent-education, family-contract, and weekly-review tool.
- Avoided value propositions around device takeover, hidden observation, medical determination, and technical workaround guidance.
- Replaced earlier classification-like labels such as “analysis,” “normal,” or severity-like wording with “lifestyle pattern summary” and “adjustment needed.”
- Kept crisis/safety escalation copy: acute self-harm, violence, abuse, severe despair, confusion, or basic functioning problems should go to guardian, professional, or emergency help before app-rule changes.
- Kept child data-sharing boundaries: raw child self-management notes are not directly exposed on the home screen; parent view receives summary/shared items only.

### Mobile layout checks added by design

- Fixed bottom tab height is reserved in the scroll container with extra bottom padding.
- Primary tap targets are at least 44px high.
- Mobile media query renders the prototype as a full-screen app frame.
- Inactive route content is replaced in the DOM rather than hidden behind transparent layers, avoiding inactive screen pollution.

### Verification performed

- File existence and line/size checks.
- Static scan planned for required flow labels and prohibited product-language terms.
- Browser smoke check planned for console errors, primary onboarding click path, bottom tab navigation, localStorage state update, and bottom-scroll overlap.
