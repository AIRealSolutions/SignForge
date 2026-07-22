use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{fs, path::{Path, PathBuf}};

#[derive(Parser)]
#[command(name = "signforge-engine", version, about = "SignForge Linux production engine")]
struct Cli {
    #[command(subcommand)]
    command: Command,

    /// Data directory used for imported jobs and queue state.
    #[arg(long, global = true, default_value = ".signforge")]
    data_dir: PathBuf,
}

#[derive(Subcommand)]
enum Command {
    /// Show appliance and virtual-driver status.
    Status,
    /// Import a production-job JSON document into the local queue.
    Import { file: PathBuf },
    /// Validate a production job by ID or JSON file path.
    Validate { job: String },
    /// List locally imported jobs.
    Queue,
    /// Generate a machine-independent virtual motion summary.
    Simulate { job: String },
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
struct Approval {
    status: String,
}

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
    fs::create_dir_all(cli.data_dir.join("jobs"))?;

    match cli.command {
        Command::Status => status(&cli.data_dir),
        Command::Import { file } => import_job(&cli.data_dir, &file),
        Command::Validate { job } => {
            let job = load_job(&cli.data_dir, &job)?;
            validate_job(&job)?;
            print_validation(&job);
            Ok(())
        }
        Command::Queue => list_queue(&cli.data_dir),
        Command::Simulate { job } => {
            let job = load_job(&cli.data_dir, &job)?;
            validate_job(&job)?;
            simulate(&job)
        }
    }
}

fn status(data_dir: &Path) -> Result<()> {
    let count = fs::read_dir(data_dir.join("jobs"))?.filter_map(Result::ok).count();
    println!("SignForge Production Engine v{}", env!("CARGO_PKG_VERSION"));
    println!("Platform: {} / {}", std::env::consts::OS, std::env::consts::ARCH);
    println!("Data directory: {}", data_dir.display());
    println!("Virtual cutter driver: READY");
    println!("Physical cutter output: DISABLED");
    println!("Queued jobs: {count}");
    Ok(())
}

fn import_job(data_dir: &Path, file: &Path) -> Result<()> {
    let raw = fs::read_to_string(file).with_context(|| format!("Unable to read {}", file.display()))?;
    let job: ProductionJob = serde_json::from_str(&raw).context("Invalid production-job JSON")?;
    validate_job(&job)?;

    let destination = data_dir.join("jobs").join(format!("{}.json", job.job_id));
    fs::write(&destination, serde_json::to_string_pretty(&job)?)?;

    println!("Imported {}", job.job_id);
    println!("Product: {}", job.product.name);
    println!("Material: {} {} {}", job.material.brand, job.material.series, job.material.color_name);
    println!("Status: READY FOR VIRTUAL SIMULATION");
    Ok(())
}

fn load_job(data_dir: &Path, identifier: &str) -> Result<ProductionJob> {
    let direct = PathBuf::from(identifier);
    let path = if direct.exists() {
        direct
    } else {
        data_dir.join("jobs").join(format!("{identifier}.json"))
    };
    let raw = fs::read_to_string(&path).with_context(|| format!("Job not found: {}", path.display()))?;
    serde_json::from_str(&raw).context("Invalid production-job JSON")
}

fn validate_job(job: &ProductionJob) -> Result<()> {
    if job.schema_version != "0.1" {
        bail!("Unsupported schemaVersion: {}", job.schema_version);
    }
    if job.approval.status != "approved" {
        bail!("Artwork is not approved");
    }
    if job.product.product_type != "vinyl_cut" {
        bail!("Only vinyl_cut jobs are supported in engine v0.1");
    }
    if job.artwork.format != "svg" {
        bail!("Only SVG artwork is supported");
    }
    if !job.artwork.text_outlined {
        bail!("Text must be converted to outlines before physical production");
    }
    if job.product.width_inches > job.material.roll_width_inches && job.product.height_inches > job.material.roll_width_inches {
        bail!("Artwork does not fit the loaded roll in either orientation");
    }
    if job.production.copies == 0 || job.product.quantity == 0 {
        bail!("Job quantity and copies must be greater than zero");
    }
    if job.machine.target_type != "virtual_cutter" {
        bail!("Physical machine targets are disabled in v0.1");
    }
    Ok(())
}

fn print_validation(job: &ProductionJob) {
    println!("Validation passed: {}", job.job_id);
    println!("Approved artwork: YES");
    println!("SVG format: YES");
    println!("Text outlined: YES");
    println!("Fits {:.2}-inch roll: YES", job.material.roll_width_inches);
    println!("Operator confirmation required: {}", job.production.operator_confirmation_required);
    println!("Physical output: BLOCKED");
}

fn list_queue(data_dir: &Path) -> Result<()> {
    let mut jobs = Vec::new();
    for entry in fs::read_dir(data_dir.join("jobs"))? {
        let path = entry?.path();
        if path.extension().and_then(|value| value.to_str()) != Some("json") { continue; }
        if let Ok(job) = load_job(data_dir, path.to_string_lossy().as_ref()) {
            jobs.push(job);
        }
    }
    jobs.sort_by(|a, b| a.job_id.cmp(&b.job_id));

    if jobs.is_empty() {
        println!("Queue is empty");
        return Ok(());
    }

    println!("LOCAL PRODUCTION QUEUE");
    for (index, job) in jobs.iter().enumerate() {
        println!("{}. {} | {} | {} copies | READY", index + 1, job.job_id, job.product.name, job.production.copies);
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
