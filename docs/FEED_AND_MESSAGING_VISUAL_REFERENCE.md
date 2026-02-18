# Feed and Messaging Redesign — Visual Reference

This document describes the **exact visual design** to implement, based on the reference images provided. **The implementing AI must open and study these images** when building. Use these specs when building the Feed and Messaging features.

> **Images to reference:** Open `docs/reference-images/messaging-widget-compressed.png` and `docs/reference-images/messaging-full-page.png` in the project to see the target design.

---

## Reference Image 1: Compressed Messaging Widget (Bottom Right)

**Location:** `docs/reference-images/messaging-widget-compressed.png`

**Purpose:** The floating messenger bubble when **closed/minimized** at the bottom-right of the screen.

### Visual Specs

| Element | Description |
|---------|-------------|
| **Container** | Light gray rectangular box with softly rounded corners. White or light background. Appears floating. |
| **Profile Picture** | Circular image on the **far left**. Shows the user's profile or org logo. Overlaid on bottom-right edge: small solid **green circle** = online/active status. |
| **"Messaging" Label** | Bold, dark gray sans-serif text immediately right of the profile picture. |
| **Action Icons** (left to right) | 1) **Ellipsis** (three horizontal dots) = More options / settings. 2) **Compose** = Square with upward arrow + pen tip = New message. 3) **Chevron Up** = Expand/collapse; clicking opens full messages page. |

### Behavior

- **Click on widget (main area):** Open the 380px messaging panel (thread list or chat).
- **Click chevron up:** Navigate to full-page `/messages` view.
- **Click compose:** Open new message flow.
- **Click ellipsis:** Open more options menu.

---

## Reference Image 2: Full-Page Messaging (LinkedIn-Style)

**Location:** `docs/reference-images/messaging-full-page.png`

**Purpose:** The `/messages` page when user clicks the Messenger icon in the top nav or expands the bottom-right widget.

### Layout: Two Columns

```
+------------------------------------------+------------------------------------------+
|  Messaging    [Search messages]     ...  |  Lisa Williams                            |
|  Focused | Jobs | Unread | Connections  |  Marketing Director · Sponsored · Feb 13 |
+------------------------------------------+------------------------------------------+
|  [Avatar] Lisa Williams            Feb 13|                                          |
|  Sponsored Board Positions          [1]  |  [Board Positions] [Schedule]              |
|------------------------------------------|                                          |
|  [Avatar] LinkedIn Talent Sol...   Feb 9 |  [Avatar] Lisa Williams                   |
|  LinkedIn Offer Meet the new...    [1]  |  Your background matches some of our...   |
|------------------------------------------|  https://calendly.com/...                  |
|  [Avatar] Mike King               Feb 6  |  [Schedule →]                             |
|  You: 'My email is christopher@...'     |                                          |
|------------------------------------------|                                          |
|  [Avatar] Dr. Joseph Drolshage    Jan 26 |                                          |
|  Dr. Joseph Drolshagen: Hey...  [green] |                                          |
+------------------------------------------+------------------------------------------+
```

### Left Panel (Conversation List)

| Element | Spec |
|---------|------|
| **Header** | "Messaging" title, search bar ("Search messages"), ellipsis, pencil/compose icon. |
| **Filter Tabs** | Horizontal tabs: Focused, Jobs, Unread, Connections, InMail, Starred. One highlighted (e.g. green). |
| **Conversation Rows** | Each row: circular profile image, name, message snippet, date (right-aligned). |
| **Profile Images** | Circular, with optional **green dot** (bottom-right) for online status. |
| **Unread Badge** | Blue circle with number (e.g. "1") when unread. |
| **New Message Banner** | Optional banner at top: "New message in Other: [Name]" with small avatar and X to dismiss. |

### Right Panel (Selected Conversation)

| Element | Spec |
|---------|------|
| **Header** | Sender name, role/title, tags (e.g. "Sponsored"), date. Ellipsis and star icons. |
| **Message Content** | Full thread. Sender avatar embedded in message body. Links in blue. |
| **Call-to-Action** | Cards with buttons (e.g. "Schedule", "Schedule →"). |

### Feed Card Reference (from same design language)

For **donation cards** in the Feed, apply the same pattern as conversation rows:

- **Left:** Circular org profile image (or logo).
- **Center:** Donation amount + "donated to [Org Name]".
- **Right:** Timestamp.
- Card: Rounded corners, subtle border, hover state.

---

## Implementation Checklist (from reference images)

1. **Compressed widget:** Profile image + "Messaging" + ellipsis + compose + chevron up.
2. **Full page:** Two-column layout; left = conversation list with avatars, snippets, dates, unread badges; right = full conversation.
3. **Feed cards:** Profile image left, amount + org name, timestamp. Rounded card, hover effect.
4. **Peers:** Exclude user's own org. Show only connected orgs/people.
5. **Nav:** Handshake, Messenger (link to `/messages`), Notifications only. No Connections (UserPlus) icon.
