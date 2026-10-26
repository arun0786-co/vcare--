# Simulator results

Run on 2026-10-26 with `npm run simulate` (commit `bafc318`). There is no pilot clinic yet, so these numbers come from synthetic mornings, not real patients.

## Setup

- One doctor, session 10:00-13:00 IST, 15-minute slots.
- 6 booked patients per morning, on every second slot from 10:00 to 12:30. Each picks a travel time from 10/20/30/45/60 minutes; the real journey is that plus -3 to +5 minutes.
- Walk-ins arrive at random between 09:45 and 12:30 (6 or 10 per hour).
- Consultation lengths are lognormal around a median of 8 minutes (sigma 0.4), clamped to 2-40 minutes, so the mean is about 8.7 minutes.
- Grace 10 minutes, alert buffer 10 minutes, the app's own queue, estimate and alert code (`planNext`, `projectEtas`, `planAlerts`).
- Each scenario is run over 50 seeds. Both worlds see exactly the same patients:
  - **alerts**: booked patients leave home when the leave-now alert fires.
  - **baseline**: booked patients arrive 5 minutes before their slot.
- "Wait" is minutes in the clinic from arrival to being called, for booked patients only.

## Results

| Scenario | Avg wait, alerts | Avg wait, baseline | Max wait, alerts | Max wait, baseline | Lost slots, alerts | Lost slots, baseline | Estimate error at alert |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Doctor on time | 28.7 | 31.9 | 125 | 123 | 0 of 300 | 0 of 300 | 20.9 |
| Doctor 45 min late, announced | 47.2 | 73.2 | 170 | 168 | 0 of 300 | 0 of 300 | 31.5 |
| Doctor 45 min late, not announced | 55.7 | 73.2 | 170 | 168 | 0 of 300 | 0 of 300 | 42.8 |
| Busy: 10 walk-ins per hour | 49.0 | 79.5 | 230 | 246 | 0 of 300 | 0 of 300 | 36.2 |
| Busy and 30 min late, announced | 54.2 | 109.2 | 207 | 276 | 0 of 300 | 0 of 300 | 37.8 |

"Estimate error at alert" is the mean absolute difference between the expected time shown when the alert fired and the time the patient was actually called.

## What this says

1. **Alerts help most when the day goes wrong.** With the doctor on time the saving is small (32 to 29 minutes). With a late doctor or a busy day, the average wait drops by 26 to 55 minutes. That is the case the product is for.
2. **Announcing a late start matters.** Same 45-minute delay: 47 minutes of waiting when reception records it, 56 when they don't. The "running late" button is worth making prominent.
3. **No alerted patient lost their slot** in 1,500 simulated bookings. The grace period starting when the doctor reaches the patient does its job.
4. **The estimate at alert time is too optimistic, by 21 to 43 minutes on average.** That is partly by design: the alert uses the fast (25th percentile) estimate and ignores absent bookings, so people come early rather than late. Most of the error comes from walk-ins who arrive after the alert but before the patient's slot time. Under the queue rule they go ahead of the booking, and the estimate cannot see them coming.
5. **The worst waits are barely better than baseline** (max 230 vs 246 on a busy day). Those are late-morning bookings that are told to leave before a run of walk-ins arrives.
6. **The default morning is overloaded**: about 22 patients at about 8.7 minutes each is roughly 196 minutes of work in a 180-minute session. Real clinics look like this, which is why waits are long in every row.

## Problem found and fixed while running this

The first run showed 3 of 300 lost slots in "Busy and 30 min late, announced". All three were the 12:30 booking on very overloaded mornings. They had been correctly told their turn was around 16:27-16:49, but the simulation stopped at 16:00, so they "never arrived". That was a bug in the simulator's time limit, not in the alert rules. Simulated mornings now run until everyone is seen, with a 12-hour cap (`45794e7`, with a test). The table above is from after the fix.

## Next things to try

- Add the expected walk-in arrival rate (learned from past sessions) to the projection, so estimates allow for walk-ins who have not arrived yet. This should cut finding 4 and the worst waits in finding 5.
- Try letting a booked patient who has checked in keep priority over walk-ins who arrive after their alert, and compare walk-in waits.
- Re-run with real timestamps once a pilot clinic exists. Each alert stores its estimate in the notification payload, so this comparison can come straight from the database.
