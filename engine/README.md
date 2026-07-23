# SignForge Engine

SignForge Engine is the Linux and Raspberry Pi production component for SignForge. Version 0.2 accepts the shared production-job JSON format, validates approved vinyl-cut jobs, stores them in SQLite, records durable job-state history, and runs a virtual simulation summary.

It deliberately does **not** send USB commands to a physical cutter.

## Supported systems

- Raspberry Pi OS 64-bit on Raspberry Pi 3, 4, or 5
- Debian 64-bit
- Ubuntu 64-bit
- Standard x86_64 or ARM64 Linux development machines

## Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

## Build

From the repository root:

```bash
cd engine
cargo build --release
```

The executable will be located at:

```text
target/release/signforge-engine
```

## Test with the included production job

From the `engine` directory:

```bash
./target/release/signforge-engine status

./target/release/signforge-engine import \
  ../packages/production-contract/examples/SF-DEMO-1001.production-job.json

./target/release/signforge-engine queue
./target/release/signforge-engine validate SF-DEMO-1001
./target/release/signforge-engine simulate SF-DEMO-1001
./target/release/signforge-engine history SF-DEMO-1001
```

Change a durable queue state manually during testing:

```bash
./target/release/signforge-engine set-state SF-DEMO-1001 queued
./target/release/signforge-engine set-state SF-DEMO-1001 operator-approved
./target/release/signforge-engine set-state SF-DEMO-1001 completed
```

## Local database

By default, the engine creates:

```text
engine/.signforge/signforge.db
```

The SQLite database uses WAL journaling for resilience and currently contains:

- `jobs`
- `job_history`
- `machines`
- `materials`
- `settings`

A different appliance data location can be selected with:

```bash
signforge-engine --data-dir /var/lib/signforge status
```

For a production Raspberry Pi, `/var/lib/signforge` is the recommended eventual location.

## Durable job states

The engine supports:

```text
imported
validated
queued
ready
simulating
operator_approved
running
paused
completed
failed
canceled
```

Every state change is timestamped in `job_history`. This gives the future local dashboard, cloud synchronization service, and machine drivers one dependable source of truth.

## Version 0.2 safety boundaries

- Only schema version `0.1` is accepted.
- Only approved `vinyl_cut` jobs are accepted.
- Only SVG artwork is accepted.
- Text must already be converted to outlines.
- The job must fit the stated material roll width.
- The machine target must be `virtual_cutter`.
- No USB output or Roland commands exist in this version.
- A future physical-cut command will still require local operator confirmation.

## Next milestone

The next milestone adds a fake plotter driver. It will consume a normalized motion plan and write commands such as these to a log file:

```text
MOVE 10.000 10.000
BLADE_DOWN
CUT 50.000 10.000
BLADE_UP
```

The same machine-independent plan will later feed both the virtual simulator and the Roland GS-24 adapter.
