use anyhow::{bail, Context, Result};
use chrono::Utc;
use clap::{Parser, Subcommand, ValueEnum};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{fs, path::{Path, PathBuf}};

#[derive(Parser)]
#[command(name = "signforge-engine", version, about = "SignForge Linux production engine")]
struct Cli {
    #[command(subcommand)]
    command: Command,

    /// Data directory used for the SQLite database and cached production files.
    #[arg(long, global = true, default_value = ".signforge")]
    data_dir: PathBuf,
}

#[derive(Subcommand)]
enum Command {
    /// Show appliance, database, queue, and virtual-driver status.
    Status,
    /// Import or replace a production-job JSON document in the local database.
    Import { file: PathBuf },
    /// Validate a production job by ID or JSON file path.
    Validate { job: String },
    /// List locally imported jobs and durable states.
    Queue,
    /// Generate a machine-independent virtual motion summary.
    Simulate { job: String },
    /// Change a job state and record the transition in job history.
    SetState { job_id: String, state: JobState },
    /// Display the state-transition history for one job.
    History { job_id: String },
}

#[derive(Clone, Copy, Debug, ValueEnum)]
enum JobState {
    Imported,
    Validated,
    Queued,
    Ready,
    Simulating,
    OperatorApproved,
    Running,
    Paused,
    Completed,
    Failed,
    Canceled,
}

impl JobState {
    fn as_str(self) -> &'static str {
        match self {
            Self::Imported => "imported",
            Self::Validated => "validated",
            Self::Queued => "queued",
            Self::Ready => "ready",
            Self::Simulating => "simulating",
            Self::OperatorApproved => "operator_approved",
            Self::Running => "running",
            Self::Paused => "paused",
            Self::Completed => "completed",
            Self::Failed => "failed",
            Self::Canceled => "canceled",
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProductionJob {
    schema_version: String,
    job_id: String,
    approval: Approval,
    product: Product,
    artwork: Artwork,
    material: Material,
    production: Production,
    machine: Machine,
}

#[derive(Debug, Deserialize, Serialize)]
struct Approval { status: String }

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Product {
    product_type: String,
    name: String,
    width_inches: f64,
    height_inches: f64,
    quantity: u32,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Artwork {
    format: String,
    source: ArtworkSource,
    sha256: String,
    physical_width_inches: f64,
    physical_height_inches: f64,
    text_outlined: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ArtworkSource {
    kind: String,
    inline_svg: Option<String>,
    local_path: Option<String>,
    url: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Material {
    category: String,
    brand: String,
    series: String,
    color_name: String,
    roll_width_inches: f64,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Production {
    copies: u32,
    mirror: bool,
    weed_border: bool,
    weed_border_margin_inches: f64,
    operator_confirmation_required: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Machine {
    target_type: String,
    profile_id: String,
    settings: MachineSettings,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct MachineSettings {
    speed_cm_per_second: f64,
    force_grams: f64,
    blade_offset_mm: f64,
    passes: u32,
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    fs::create_dir_all(&cli.data_dir)?;
    let database_path = cli.data_dir.join("signforge.db");
    let mut connection = Connection::open(&database_path)
        .with_context(|| format!("Unable to open {}", database_path.display()))?;
    initialize_database(&connection)?;

    match cli.command {
        Command::Status => status(&connection, &database_path),
        Command::Import { file } => import_job(&mut connection, &file),
        Command::Validate { job } => {
            let production_job = load_job(&connection, &job)?;
            validate_job(&production_job)?;
            update_state(&mut connection, &production_job.job_id, "validated", "validation passed")?;
            print_validation(&production_job);
            Ok(())
        }
        Command::Queue => list_queue(&connection),
        Command::Simulate { job } => {
            let production_job = load_job(&connection, &job)?;
            validate_job(&production_job)?;
            update_state(&mut connection, &production_job.job_id, "simulating", "virtual simulation started")?;
            let result = simulate(&production_job);
            let next_state = if result.is_ok() { "ready" } else { "failed" };
            update_state(&mut connection, &production_job.job_id, next_state, "virtual simulation finished")?;
            result
        }
        Command::SetState { job_id, state } => {
            ensure_job_exists(&connection, &job_id)?;
            update_state(&mut connection, &job_id, state.as_str(), "state changed by operator")?;
            println!("{} -> {}", job_id, state.as_str());
            Ok(())
        }
        Command::History { job_id } => show_history(&connection, &job_id),
    }
}

fn initialize_database(connection: &Connection) -> Result<()> {
    connection.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         CREATE TABLE IF NOT EXISTS jobs (
             job_id TEXT PRIMARY KEY,
             state TEXT NOT NULL,
             product_name TEXT NOT NULL,
             customer_name TEXT,
             material_name TEXT NOT NULL,
             copies INTEGER NOT NULL,
             machine_target TEXT NOT NULL,
             job_json TEXT NOT NULL,
             imported_at TEXT NOT NULL,
             updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS job_history (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             job_id TEXT NOT NULL,
             from_state TEXT,
             to_state TEXT NOT NULL,
             note TEXT,
             created_at TEXT NOT NULL,
             FOREIGN KEY(job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
         );
         CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
         CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON job_history(job_id);
         CREATE TABLE IF NOT EXISTS machines (
             machine_id TEXT PRIMARY KEY,
             display_name TEXT NOT NULL,
             driver_type TEXT NOT NULL,
             status TEXT NOT NULL,
             updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS materials (
             material_id TEXT PRIMARY KEY,
             display_name TEXT NOT NULL,
             width_inches REAL NOT NULL,
             remaining_inches REAL,
             updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS settings (
             setting_key TEXT PRIMARY KEY,
             setting_value TEXT NOT NULL
         );"
    )?;

    connection.execute(
        "INSERT OR IGNORE INTO machines (machine_id, display_name, driver_type, status, updated_at)
         VALUES ('virtual-cutter', 'Virtual Cutter', 'virtual_cutter', 'ready', ?1)",
        params![now()],
    )?;
    Ok(())
}

fn status(connection: &Connection, database_path: &Path) -> Result<()> {
    let total: i64 = connection.query_row("SELECT COUNT(*) FROM jobs", [], |row| row.get(0))?;
    let ready: i64 = connection.query_row(
        "SELECT COUNT(*) FROM jobs WHERE state IN ('validated','queued','ready','operator_approved')",
        [],
        |row| row.get(0),
    )?;
    let failed: i64 = connection.query_row("SELECT COUNT(*) FROM jobs WHERE state = 'failed'", [], |row| row.get(0))?;

    println!("SignForge Production Engine v{}", env!("CARGO_PKG_VERSION"));
    println!("Platform: {} / {}", std::env::consts::OS, std::env::consts::ARCH);
    println!("Database: {}", database_path.display());
    println!("SQLite journal mode: WAL");
    println!("Virtual cutter driver: READY");
    println!("Physical cutter output: DISABLED");
    println!("Jobs: {total} total | {ready} ready | {failed} failed");
    Ok(())
}

fn import_job(connection: &mut Connection, file: &Path) -> Result<()> {
    let raw = fs::read_to_string(file).with_context(|| format!("Unable to read {}", file.display()))?;
    let job: ProductionJob = serde_json::from_str(&raw).context("Invalid production-job JSON")?;
    validate_job(&job)?;
    let normalized = serde_json::to_string_pretty(&job)?;
    let timestamp = now();
    let material_name = format!("{} {} {}", job.material.brand, job.material.series, job.material.color_name);

    let transaction = connection.transaction()?;
    let previous_state: Option<String> = transaction.query_row(
        "SELECT state FROM jobs WHERE job_id = ?1",
        params![job.job_id],
        |row| row.get(0),
    ).optional()?;

    transaction.execute(
        "INSERT INTO jobs (job_id, state, product_name, customer_name, material_name, copies, machine_target, job_json, imported_at, updated_at)
         VALUES (?1, 'imported', ?2, NULL, ?3, ?4, ?5, ?6, ?7, ?7)
         ON CONFLICT(job_id) DO UPDATE SET
            state = 'imported', product_name = excluded.product_name, material_name = excluded.material_name,
            copies = excluded.copies, machine_target = excluded.machine_target, job_json = excluded.job_json,
            updated_at = excluded.updated_at",
        params![job.job_id, job.product.name, material_name, job.production.copies, job.machine.target_type, normalized, timestamp],
    )?;
    transaction.execute(
        "INSERT INTO job_history (job_id, from_state, to_state, note, created_at) VALUES (?1, ?2, 'imported', ?3, ?4)",
        params![job.job_id, previous_state, "production job imported", timestamp],
    )?;
    transaction.commit()?;

    println!("Imported {}", job.job_id);
    println!("Product: {}", job.product.name);
    println!("Material: {}", material_name);
    println!("State: imported");
    println!("Next: signforge-engine validate {}", job.job_id);
    Ok(())
}

fn load_job(connection: &Connection, identifier: &str) -> Result<ProductionJob> {
    let direct = PathBuf::from(identifier);
    let raw = if direct.exists() {
        fs::read_to_string(&direct).with_context(|| format!("Unable to read {}", direct.display()))?
    } else {
        connection.query_row(
            "SELECT job_json FROM jobs WHERE job_id = ?1",
            params![identifier],
            |row| row.get::<_, String>(0),
        ).optional()?.with_context(|| format!("Job not found: {identifier}"))?
    };
    serde_json::from_str(&raw).context("Invalid production-job JSON")
}

fn ensure_job_exists(connection: &Connection, job_id: &str) -> Result<()> {
    let exists: Option<i64> = connection.query_row(
        "SELECT 1 FROM jobs WHERE job_id = ?1",
        params![job_id],
        |row| row.get(0),
    ).optional()?;
    if exists.is_none() { bail!("Job not found: {job_id}"); }
    Ok(())
}

fn update_state(connection: &mut Connection, job_id: &str, state: &str, note: &str) -> Result<()> {
    ensure_job_exists(connection, job_id)?;
    let transaction = connection.transaction()?;
    let previous_state: String = transaction.query_row(
        "SELECT state FROM jobs WHERE job_id = ?1",
        params![job_id],
        |row| row.get(0),
    )?;
    let timestamp = now();
    transaction.execute(
        "UPDATE jobs SET state = ?2, updated_at = ?3 WHERE job_id = ?1",
        params![job_id, state, timestamp],
    )?;
    transaction.execute(
        "INSERT INTO job_history (job_id, from_state, to_state, note, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![job_id, previous_state, state, note, timestamp],
    )?;
    transaction.commit()?;
    Ok(())
}

fn validate_job(job: &ProductionJob) -> Result<()> {
    if job.schema_version != "0.1" { bail!("Unsupported schemaVersion: {}", job.schema_version); }
    if job.approval.status != "approved" { bail!("Artwork is not approved"); }
    if job.product.product_type != "vinyl_cut" { bail!("Only vinyl_cut jobs are supported"); }
    if job.artwork.format != "svg" { bail!("Only SVG artwork is supported"); }
    if !job.artwork.text_outlined { bail!("Text must be converted to outlines before production"); }
    if job.product.width_inches > job.material.roll_width_inches && job.product.height_inches > job.material.roll_width_inches {
        bail!("Artwork does not fit the loaded roll in either orientation");
    }
    if job.production.copies == 0 || job.product.quantity == 0 { bail!("Job quantity and copies must be greater than zero"); }
    if job.machine.target_type != "virtual_cutter" { bail!("Physical machine targets are disabled"); }
    Ok(())
}

fn print_validation(job: &ProductionJob) {
    println!("Validation passed: {}", job.job_id);
    println!("Approved artwork: YES");
    println!("SVG format: YES");
    println!("Text outlined: YES");
    println!("Fits {:.2}-inch roll: YES", job.material.roll_width_inches);
    println!("Operator confirmation required: {}", job.production.operator_confirmation_required);
    println!("State: validated");
    println!("Physical output: BLOCKED");
}

fn list_queue(connection: &Connection) -> Result<()> {
    let mut statement = connection.prepare(
        "SELECT job_id, product_name, copies, state, material_name, updated_at
         FROM jobs
         WHERE state NOT IN ('completed','canceled')
         ORDER BY CASE state
             WHEN 'running' THEN 1 WHEN 'operator_approved' THEN 2 WHEN 'ready' THEN 3
             WHEN 'queued' THEN 4 WHEN 'validated' THEN 5 WHEN 'imported' THEN 6 ELSE 7 END,
             updated_at ASC"
    )?;
    let rows = statement.query_map([], |row| Ok((
        row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, i64>(2)?,
        row.get::<_, String>(3)?, row.get::<_, String>(4)?, row.get::<_, String>(5)?,
    )))?;

    let jobs: Vec<_> = rows.collect::<rusqlite::Result<Vec<_>>>()?;
    if jobs.is_empty() {
        println!("Queue is empty");
        return Ok(());
    }

    println!("LOCAL PRODUCTION QUEUE");
    for (index, (id, product, copies, state, material, updated)) in jobs.iter().enumerate() {
        println!("{}. {} | {} | {} copies | {} | {} | {}", index + 1, id, product, copies, state, material, updated);
    }
    Ok(())
}

fn show_history(connection: &Connection, job_id: &str) -> Result<()> {
    ensure_job_exists(connection, job_id)?;
    let mut statement = connection.prepare(
        "SELECT from_state, to_state, note, created_at FROM job_history WHERE job_id = ?1 ORDER BY id ASC"
    )?;
    let rows = statement.query_map(params![job_id], |row| Ok((
        row.get::<_, Option<String>>(0)?, row.get::<_, String>(1)?,
        row.get::<_, Option<String>>(2)?, row.get::<_, String>(3)?,
    )))?;

    println!("JOB HISTORY: {job_id}");
    for row in rows {
        let (from, to, note, created) = row?;
        println!("{} | {} -> {} | {}", created, from.unwrap_or_else(|| "none".into()), to, note.unwrap_or_default());
    }
    Ok(())
}

fn simulate(job: &ProductionJob) -> Result<()> {
    let svg = match job.artwork.source.kind.as_str() {
        "inline" => job.artwork.source.inline_svg.as_deref().context("inlineSvg is missing")?.to_string(),
        "local" => {
            let path = job.artwork.source.local_path.as_deref().context("localPath is missing")?;
            fs::read_to_string(path).with_context(|| format!("Unable to read artwork: {path}"))?
        }
        other => bail!("Artwork source kind '{other}' is not available offline"),
    };

    let digest = format!("{:x}", Sha256::digest(svg.as_bytes()));
    let element_count = svg.matches("<path").count()
        + svg.matches("<rect").count()
        + svg.matches("<polygon").count()
        + svg.matches("<polyline").count()
        + svg.matches("<circle").count()
        + svg.matches("<ellipse").count();
    let copies = job.production.copies.max(job.product.quantity);
    let spacing = 0.25;
    let material_length = (job.product.height_inches + spacing) * copies as f64;
    let estimated_seconds = ((job.product.width_inches + job.product.height_inches) * element_count.max(1) as f64 * copies as f64)
        / (job.machine.settings.speed_cm_per_second * 0.393_700_8).max(0.1);

    println!("VIRTUAL CUTTER PLAN");
    println!("Job: {}", job.job_id);
    println!("SVG digest: {digest}");
    println!("Vector elements detected: {element_count}");
    println!("Copies: {copies}");
    println!("Mirror: {}", job.production.mirror);
    println!("Weed border: {} ({:.2} in)", job.production.weed_border, job.production.weed_border_margin_inches);
    println!("Estimated material length: {:.2} in", material_length);
    println!("Estimated run time: {:.1} sec", estimated_seconds);
    println!("Driver: virtual_cutter");
    println!("No USB or physical machine commands were generated.");
    Ok(())
}

fn now() -> String { Utc::now().to_rfc3339() }
