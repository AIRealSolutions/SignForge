# SignForge Engine

SignForge Engine is the Linux and Raspberry Pi production component for SignForge. Version 0.1 accepts the shared production-job JSON format, validates approved vinyl-cut jobs, maintains a simple local file queue, and runs a virtual simulation summary.

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
```

By default, imported jobs are stored in:

```text
engine/.signforge/jobs/
```

A different location can be selected with:

```bash
signforge-engine --data-dir /var/lib/signforge status
```

## Version 0.1 safety boundaries

- Only schema version `0.1` is accepted.
- Only approved `vinyl_cut` jobs are accepted.
- Only SVG artwork is accepted.
- Text must already be converted to outlines.
- The job must fit the stated material roll width.
- The machine target must be `virtual_cutter`.
- No USB output or Roland commands exist in this version.
- A future physical-cut command will still require local operator confirmation.

## Next milestone

The next milestone replaces the file-folder queue with SQLite and adds durable job states:

```text
downloaded → validated → ready → running → paused → completed / failed
```

After that, a fake driver will write the exact planned movements to a log file before any real Roland GS-24 communication is attempted.
