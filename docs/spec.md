# VCare v0.1 spec

Agreed 2026-01-16. Prototype first; no pilot clinic yet.

## Goal

Patients spend less time sitting in the clinic. Every patient, whether booked online, booked by phone or walking in, sits in one live queue per doctor session. Patients see their estimated turn from a link and get a "leave now" alert based on their travel time.

## Decisions

| Topic | Decision |
| --- | --- |
| Market | India, one city. Clinic timezone defaults to Asia/Kolkata |
| Customer | Independent clinics with one or more doctors |
| Pilot | None yet. Build the prototype and check estimates with a simulator |
| Queue rule | Appointments keep their booked position if they check in within the grace period; walk-ins are first come, first served; late appointments join at their check-in time |
| Notifications | Simulated in v0.1 (written to an outbox and logged) behind a sender interface; WhatsApp next |
| Clinic UI | Responsive web dashboard for laptop or tablet |
| Patient UI | Mobile web page opened from a link. No app, no patient login |
| Travel time | Patient picks 10, 20, 30, 45 or 60 minutes |
| Payments | None |
| Stack | Next.js (App Router) and TypeScript run as a normal Node server, PostgreSQL, Drizzle ORM, a separate Node worker for alerts |
| Out of scope for v0.1 | Hospital integrations, payments, native apps, QR self check-in, offline action queue, languages other than English, learned prediction models |

## Queue model

A **session** is one doctor's sitting, e.g. Monday 10:00-13:00. A doctor can have several sessions a day. Sessions come from a weekly schedule.

Every patient is a **queue entry** in a session. Channels: `ONLINE`, `PHONE`, `WALK_IN`. Online and phone entries have a booked slot time; walk-ins do not.

States:

```
BOOKED -> CHECKED_IN -> IN_CONSULTATION -> COMPLETED
BOOKED -> NO_SHOW | CANCELLED
CHECKED_IN -> NO_SHOW | CANCELLED
NO_SHOW -> CHECKED_IN   (patient turned up after all)
```

There is no separate CALLED state. "Next patient" ends one consultation and starts the next in one tap; a CALLED step would add a tap per patient without improving the estimate.

### Order

Each entry has an order key:

- Walk-in: check-in time.
- Appointment: its booked slot time, unless it lost its slot (below), in which case its check-in time.
- Prioritized entries (emergencies) go ahead of everyone, in the order they were prioritized. The reason and the staff member are recorded.
- Ties go to the lower ticket number.

Only checked-in patients can be called, so the doctor never waits for someone who is not there.

**Grace runs from when the doctor reaches the patient, not from the clock.** When "Next" calls someone whose order key is later than a booked patient who has not arrived, that booked patient is marked *passed over*. They keep their position if they check in within the grace period (10 min) after being passed over; after that they join at their check-in time. A slot-time grace would break the product: when the doctor runs 45 minutes late, the leave-now alert tells people to arrive after their slot time, and they would lose their place for following it.

Marking someone `NO_SHOW` also counts as passing them over. Re-checking them in applies the same grace rule. Walk-ins have no slot, so a re-checked walk-in joins at the current time; staff can prioritize them if that is unfair.

### Staff actions

Next patient, finish current patient, check in, re-check in, mark no-show, cancel, prioritize (reason required), add walk-in (phone optional), add phone booking, doctor running late (expected start time), doctor arrived, start break (until a time), end break, set a public note, close session.

## Estimates

Consultation durations come from the doctor's last 50 completed consultations within 30 days, each clamped to 1-60 minutes. With fewer than 5 samples, use the doctor's default (8 min) as the median and 75% of it as the 25th percentile.

The projected line is every checked-in patient plus every booked patient who has not lost their slot, in queue order. Walking down the line:

- Start time: now; or, if the doctor has not arrived, the later of now and the announced expected start (else the session start); or, during a break, the break end. Once the doctor has arrived, the announced delay is ignored and actual progress drives the estimate.
- If someone is in consultation, add the time they likely have left.
- Each patient's estimate is the running time; a booked patient's estimate is never earlier than their slot time.

Two estimates per patient:

- **Expected** uses the median duration and counts everyone in the line. Patients see this one.
- **Early** uses the 25th percentile and skips booked patients ahead who have not arrived. Alerts use this one, because arriving late costs a patient their turn while arriving early costs a few minutes.

## Alerts

| Kind | When |
| --- | --- |
| `LINK` | Entry created with a phone number. Contains the status link |
| `LEAVE_NOW` | Entry is still `BOOKED`, has a phone and a travel time, and now >= early estimate - travel time - buffer (10 min). Sent once |
| `DELAY` | After `LEAVE_NOW`, patient still not checked in, early estimate is at least 20 min later than in the last alert. At most 2 |

Example: early estimate 11:00, travel 20 min, buffer 10 min: alert at 10:30.

Alerts are rows in an outbox with a unique dedupe key, so recalculating never sends the same alert twice. The worker writes them; a sender delivers them. In v0.1 the sender only logs.

## Live updates

Every queue change sends a Postgres `NOTIFY`. Open pages listen over server-sent events and refetch; they also poll every 60 s. Pages show "Updated N min ago" and mark data stale after 2 minutes. The dashboard shows an offline banner and disables actions while disconnected.

Every change locks the session row. "Next" carries the id of the patient the receptionist saw in consultation; if that changed, the server answers 409 and the page refreshes. A partial unique index allows only one patient in consultation per session.

## Privacy and security

- Patient data: name, phone (optional for walk-ins), booking, queue state, travel minutes. No clinical data.
- Patient links use a random 24-byte token. The status page shows the patient's own name only; other patients appear as ticket numbers.
- Staff log in with email and password (scrypt), with database sessions in an httpOnly cookie that lasts 14 days. Staff see only their own clinic.
- Before a real pilot: consent text, retention policy, a review against India's DPDP Act, login rate limiting.

## Data model

| Table | Holds |
| --- | --- |
| `clinics` | name, slug, timezone, grace and alert buffer minutes |
| `doctors`, `doctor_schedules` | doctor settings and weekly hours |
| `doctor_sessions` | one sitting: times, doctor late/arrived/break state, note, closed |
| `queue_entries` | every patient in a session (appointments are entries; no separate patients table in v0.1) |
| `queue_events` | append-only history of every change with actor and reason (also the audit log) |
| `notifications` | the alert outbox |
| `staff_users`, `staff_sessions` | logins |

## Checking the estimates

With no clinic yet, a simulator replays synthetic sessions (walk-ins, bookings, random consultation lengths, a late doctor) and reports estimate error, waiting time and lost slots, with and without alerts. In a real pilot, the estimates stored in each alert's payload are compared against the actual consultation start times.
