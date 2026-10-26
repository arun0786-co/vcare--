# VCare

A live clinic queue. Patients book a slot (or are added by reception when they phone or walk in), follow their place in the queue from a link, and get a "leave now" message timed to their travel time, so they spend less time in the waiting room.

v0.1 is a prototype: messages are simulated, and there is no pilot clinic yet. See `docs/spec.md` for what it does and why, and `docs/sim-results.md` for how the estimates hold up in simulation.

## Run it locally

Needs Node 20.19+ and Docker (Docker Desktop or Colima).

```bash
npm install
cp .env.example .env            # then set SEED_STAFF_PASSWORD
npm run db:up                   # Postgres 17 on localhost:5433
npm run db:migrate
npm run seed                    # Demo Clinic with two doctors and two staff logins
npm run dev                     # http://localhost:3000
npm run worker                  # in a second terminal: plans and "sends" alerts every 15 s
```

| Page | What it is |
| --- | --- |
| `/c/demo` | Patient booking for the demo clinic |
| `/q/<token>` | A patient's live status page (the link they get) |
| `/login`, `/dashboard` | Reception and doctor screens (`reception@demo.test` or `meera@demo.test`, password from `.env`) |
| `/dev/outbox` | Messages the app would have sent (development only) |

The demo doctors work Monday to Saturday, 10:00-13:00, and Dr. Meera Nair also 17:00-20:00. Running the queue (Next patient, check in, walk-ins) only works on the session's own day.

## Tests

```bash
npm test            # everything (needs the database running)
npm run test:unit   # domain logic, simulator and browser helpers, no database
npm run test:int    # database, queue actions and API routes against vcare_test
npm run simulate    # alerts vs no alerts over 50 synthetic mornings
```

## Layout

```
src/domain/     queue rules, estimates, alert planning, validation; pure functions, no I/O
src/server/     Postgres access, queue actions (one handler per action), booking, auth, live updates, outbox
src/app/        Next.js pages and API routes
src/sim/        the simulator
scripts/        migrate, seed, worker, simulate
drizzle/        SQL migrations
docs/           spec, build plan, simulator results
```

Every queue change goes through `applyAction` (staff) or the booking functions (patients). Both lock the session row, record an event and publish a change that open pages pick up over server-sent events.
