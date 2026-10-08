# ZDrop - Product Requirements Document (PRD)

> **Document Version:** 1.0.0 (MVP Specification)  
> **Project Name:** ZDrop ("Drop it. Print it. Done.")  
> **Team:** Team Cook (Web Development)  
> **Members:** Sanadi Rehan Najir (Team Leader), Belwadkar Soham Shankar, Nimbalkar Harsh Abasaheb, Patil Chetan Gajanan  
> **Status:** Approved for Implementation  

---

## 1. Executive Summary & Vision

In educational campuses, offices, and neighborhood Xerox/copy centers, printing documents is a daily necessity. Currently, students and office workers transmit confidential files (academic assignments, lab journals, resumes with personal identifying information, identity cards, government forms) via unencrypted or persistent consumer channels:
- WhatsApp Web (leaves downloaded files indefinitely in the operator's `Downloads` folder, exposes personal phone numbers to strangers).
- Personal Email attachments (exposes personal email addresses, leaves unmanaged inbox clutter).
- USB Flash Drives (spreads malware/viruses, requires physical dongles or OTG adapters rarely carried by smartphone-first students).
- Bluetooth / Quick Share (slow pairing, inconsistent discovery, device clutter).

**ZDrop** solves this with a zero-friction, privacy-first web application. A user drops their files on mobile, configures print preferences, and receives a temporary 6-digit access code (OTP). The Xerox operator opens the ZDrop web kiosk on their desktop browser, enters the 6-digit code, reviews print options, triggers printing, and the file is permanently purged from storage.

---

## 2. Problem Statement & Opportunities

| Existing Pain Point | Traditional Method (WhatsApp/USB) | ZDrop Solution |
| :--- | :--- | :--- |
| **Data Privacy & Retention** | Files sit indefinitely on shop PC hard drives; operator has unrestricted offline access. | Strict Ephemeral Storage: dual-trigger destruction (instant purge on print + 15-minute hard TTL). |
| **Personal Info Exposure** | Customer phone number or email is exposed to shopkeeper and anyone looking at the screen. | 100% Anonymous: zero personal identifying info requested or stored. |
| **Communication Errors** | "Print pages 3 to 12, double sided, 2 copies, in B&W" verbally miscommunicated amidst noise. | Structured Print Preferences configured directly on customer's phone and displayed on operator screen. |
| **Queue Latency** | Operators spend minutes searching WhatsApp chats, downloading, and hunting for files. | Instant OTP access: typing 6 digits immediately loads the exact print job with pre-configured settings. |
| **Device Friction** | Mobile students lack USB cables or desktop connectivity. | 100% Web-based: runs directly in any modern mobile and desktop browser without app install. |

---

## 3. User Personas & Use Cases

### 3.1 Persona 1: The College Student / Customer (Mobile POV)
- **Profile:** Rohan, 20, Engineering student with a smartphone.
- **Context:** Needs to print a 15-page lab report 10 minutes before assignment submission. The campus Xerox shop has a queue of 15 students.
- **Goals:** Upload files quickly from phone storage, set double-sided B&W print, get an OTP code, hand it over, print immediately, and be 100% assured his file is destroyed afterward.
- **Frustrations:** Dislikes scanning WhatsApp QR codes on random cyber café machines; worried about personal resume data lingering on public computers.

### 3.2 Persona 2: The Xerox / Print Shop Operator (Desktop Kiosk POV)
- **Profile:** Ramesh, 42, operates a high-volume copy shop next to campus with 2 PCs and 3 high-speed network printers.
- **Context:** Processes 200+ print jobs daily. Manages multiple queues with students yelling print instructions over counter noise.
- **Goals:** A clean, fast, distraction-free desktop interface to enter a code, see exactly what needs to be printed, hit `Ctrl+P` (or one-click print), and clear the queue without disk clutter.
- **Frustrations:** Hard drive constantly fills up with gigabytes of abandoned student PDFs; frequent reprints caused by misunderstandings of verbal instructions.

---

## 4. MVP Scope & Boundaries

### 4.1 In Scope (Phase 1 MVP)
1. **Frictionless Anonymous Student Upload**:
   - Zero login / zero registration required.
   - Batch upload of up to 3 files per session (PDF, DOCX, JPG/PNG), max 25MB per file.
   - Interactive Print Preferences configuration (copies, B&W vs. Color, Single vs. Double-sided, page range).
2. **Access Code Engine**:
   - Unique, collision-resistant 6-digit numeric access OTP (e.g., `482913`).
   - Counter QR code alternative (operator can scan if kiosk camera is present).
3. **Session Lifecycle & Privacy Destruction (Dual-Trigger)**:
   - **Trigger A (Instant Purge):** Operator clicks "Print & Complete" OR student clicks "Revoke Session" -> Immediate hard deletion of files and metadata.
   - **Trigger B (Automated 15-Minute TTL):** Server-side TTL expiration cron / Cloud Function wipes all unprinted files after 15 minutes.
   - Real-time live status updates on student's mobile screen (`Uploaded` -> `Accessed by Operator` -> `Printed & Destroyed`).
4. **Operator Kiosk Web Portal**:
   - Simple desktop web view (`/operator` or `/kiosk`).
   - Large numeric code entry pad.
   - Instant document inspection, preference review card, PDF viewer/preview, and native Print trigger (`window.print()`).
5. **Responsive Modern UI**:
   - "Campus Print Flow" design system (Slate-50 background, Electric Blue `#2563EB` accents, Geist/Inter typography).

### 4.2 Out of Scope (Post-MVP Roadmap)
- Integrated online payments (UPI / Razorpay) — deferred to v2.
- Shopkeeper user authentication / multi-tenant dashboard — MVP uses instant kiosk lookup.
- Native mobile application (PWA/web first).
- Complex cloud print driver hardware integrations (MVP uses browser-native print pipeline).

---

## 5. Functional Requirements (FR)

### FR-1: File Intake & Validation
- **FR-1.1:** System shall accept files of types `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx), `image/jpeg`, and `image/png`.
- **FR-1.2:** System shall reject files larger than 25MB individually, or sessions exceeding 3 files.
- **FR-1.3:** System shall sanitize file names and generate cryptographically secure UUID storage keys to prevent path traversal or overwrites.

### FR-2: Print Preferences Specification
- **FR-2.1:** User can specify number of copies (integer between 1 and 99, default 1).
- **FR-2.2:** User can toggle Color Mode: `Black & White` (default) vs. `Color`.
- **FR-2.3:** User can toggle Print Sides: `Double-Sided (Duplex)` (default) vs. `Single-Sided`.
- **FR-2.4:** User can define Page Selection: `All Pages` (default) or custom page range string (e.g., `1-5, 8, 11-14`).

### FR-3: Session & Access Code Generation
- **FR-3.1:** Upon upload confirmation, the system creates an ephemeral session document with a unique 6-digit code.
- **FR-3.2:** The 6-digit code shall not collide with any active, unexpired session.
- **FR-3.3:** The system generates a QR code representing the direct operator URL (`https://zdrop.app/kiosk?code=482913`).

### FR-4: Real-Time Synchronization & Telemetry
- **FR-4.1:** The student mobile client establishes a real-time listener on the session document.
- **FR-4.2:** Session states: `ACTIVE` -> `ACCESSED` -> `PRINTED` / `EXPIRED` / `REVOKED`.
- **FR-4.3:** Live countdown timer accurately ticks down from 900 seconds (15 minutes).

### FR-5: Operator Kiosk Operations
- **FR-5.1:** Operator inputs 6-digit code via keyboard or on-screen keypad.
- **FR-5.2:** If code is invalid or expired, clear error message displays ("Code invalid or expired").
- **FR-5.3:** Valid code transitions session to `ACCESSED`, rendering the document viewer and print configuration panel.
- **FR-5.4:** Operator clicks "Print Document": triggers browser print dialog.
- **FR-5.5:** Operator clicks "Mark Printed & Delete Now": immediately invokes deletion endpoint.

### FR-6: Privacy & Auto-Purge Engine
- **FR-6.1:** Deletion API irrevocably removes all uploaded blobs from cloud object storage.
- **FR-6.2:** Deletion API marks Firestore session as `DELETED` and scrubs document metadata, leaving only anonymous telemetry (time to print, file count).
- **FR-6.3:** Scheduled background worker (cron / Firebase Function) executes every 2 minutes to query and purge sessions where `expiresAt <= now` and `status != DELETED`.

---

## 6. Non-Functional Requirements (NFR)

- **Performance**:
  - Code generation within ≤ 1.5 seconds of file upload completion.
  - Operator code resolution and document display within ≤ 1.0 second.
- **Reliability & Availability**:
  - Target 99.9% uptime during peak campus hours (8:00 AM – 8:00 PM IST).
- **Security & Privacy**:
  - Transport Layer Security (TLS 1.3) enforced on all traffic.
  - Zero-retention policy: strictly prohibited from archiving or logging document contents.
  - Storage bucket permissions restricted: public read disabled; access gated by time-limited signed URLs or server proxy.
- **Usability & Accessibility**:
  - WCAG 2.1 AA compliant contrast ratios across all buttons and inputs.
  - Zero-step onboarding: first interaction to code generation requires less than 4 taps on mobile.

---

## 7. Success Metrics & KPIs for MVP

1. **Session Completion Time**: Average time from student arrival to print dispatch < 60 seconds (down from 3-5 minutes via WhatsApp).
2. **Privacy Enforcement Rate**: 100% of files deleted within 15 minutes or immediately upon print completion.
3. **Misprint Reduction**: Zero misprints due to verbal misunderstanding of print preferences.
4. **Customer Satisfaction Score (CSAT)**: ≥ 90% positive ratings from campus pilot surveys.
