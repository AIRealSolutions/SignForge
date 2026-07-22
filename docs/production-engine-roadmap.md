# SignForge Production Engine Roadmap

## Goal

Build a Linux-first production pipeline that can run on Raspberry Pi OS, Debian, Ubuntu, and standard x86 Linux. The first hardware target is the Roland CAMM-1 GS-24.

The production system is divided into three layers:

1. SignForge Cloud and Design Studio
2. Linux Production Engine
3. Machine adapters, beginning with a virtual cutter and later the Roland GS-24

## Ordered implementation plan

### Milestone 1 — Production contract

Status: **in progress**

Define a versioned JSON document that is the only supported handoff between the cloud application, virtual cutter, Linux engine, and physical machine adapters.

Files:

- `packages/production-contract/signforge-production-job.schema.json`
- `packages/production-contract/examples/SF-DEMO-1001.production-job.json`

Rules:

- Production jobs are immutable after customer approval.
- Every job declares a schema version.
- Physical dimensions are stored in inches.
- Artwork is SVG for v0.1.
- Artwork integrity is represented by SHA-256.
- Production settings are explicit rather than inferred by a machine driver.
- A local operator confirmation is required by default.
- The same production job must drive both the virtual cutter and the eventual physical cutter adapter.

Exit criteria:

- A valid sample vinyl job exists.
- Invalid or incomplete jobs can be rejected using JSON Schema validation.
- The Design Studio can export this job format.
- The Linux engine can import the same job without depending on the web application.

### Milestone 2 — Virtual cutter

The virtual cutter will consume a v0.1 production job and create a normalized motion plan.

Initial outputs:

- Material layout
- Artwork bounding box
- Cut paths
- Travel paths
- Start and end positions
- Cut distance
- Travel distance
- Blade lifts
- Estimated run time
- Fit and margin warnings

The motion plan—not the raw SVG—will later be handed to machine adapters.

### Milestone 3 — Linux command-line engine

Create a standalone CLI with no cloud dependency.

Planned commands:

```bash
signforge-engine validate job.json
signforge-engine import job.json
signforge-engine queue
signforge-engine inspect SF-DEMO-1001
signforge-engine simulate SF-DEMO-1001
signforge-engine machines
signforge-engine status
```

Supported targets:

- Raspberry Pi OS 64-bit
- Debian 12+
- Ubuntu 24.04+
- x86_64 Linux
- ARM64 Linux

### Milestone 4 — Local queue

Use SQLite for restart-safe job state.

States:

```text
downloaded
validated
ready
running
paused
completed
failed
canceled
```

The engine must not lose an imported job during a reboot or internet outage.

### Milestone 5 — Fake plotter adapter

Translate a normalized motion plan into a human-readable command log rather than sending data to hardware.

Example:

```text
MOVE 10.000 10.000
TOOL DOWN
CUT 50.000 10.000
TOOL UP
```

This proves queue execution, cancellation, logging, and adapter boundaries without risking material or equipment.

### Milestone 6 — Roland communication investigation

Test the actual GS-24 from Linux and document:

- USB vendor and product IDs
- Linux device class
- Required permissions or udev rules
- Whether CUPS is involved
- Whether the cutter exposes a serial-style or printer-style endpoint
- Supported status queries
- Native command language and framing

No production driver should be written until these facts are confirmed on the actual machine.

### Milestone 7 — Roland GS-24 adapter

First hardware capabilities:

- Discover the GS-24
- Open and close the connection
- Send a harmless status request where supported
- Perform a controlled test cut
- Set speed and force
- Send a small normalized motion plan
- Abort safely
- Capture errors and completion state

The first real cut should be a small square and triangle on scrap vinyl.

### Milestone 8 — Local web dashboard

Expose a local interface such as:

```text
http://signforge.local
```

Functions:

- Machine status
- Queue
- Job preview
- Operator confirmation
- Test cut
- Start, pause, abort, and retry
- Material loaded
- Logs and maintenance

The CLI remains the recovery and administration interface.

### Milestone 9 — Cloud connection

After local production is reliable, connect the Linux engine to SignForge Cloud.

The engine will:

1. Register as a production appliance.
2. Receive a revocable appliance credential.
3. Download approved jobs.
4. Verify schema, approval state, and checksum.
5. Cache jobs locally.
6. Require local operator confirmation.
7. Execute the job.
8. Report progress and completion.

Cloud approval alone must never begin physical cutting.

### Milestone 10 — Linux appliance packaging

- `systemd` service
- Installer and uninstaller
- Dedicated service user
- udev permissions
- Log rotation
- Health checks
- Safe update process
- Backup and restore
- Raspberry Pi image after the installer is stable

## Version targets

### Production Engine v0.1

Import a production job locally, validate it, preview it in the virtual cutter, queue it, and execute it through a fake adapter.

### Production Engine v0.2

Detect a Roland GS-24 and perform a controlled test cut.

### Production Engine v0.3

Securely receive approved jobs from SignForge Cloud and report production results.
