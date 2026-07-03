use std::fs;
use std::path::{Path, PathBuf};

/// Write a timestamped backup of `path` next to itself before it is modified.
/// No-op (returns `Ok(None)`) if the file does not exist yet.
pub fn backup_file(path: &Path) -> Result<Option<PathBuf>, String> {
    if !path.exists() {
        return Ok(None);
    }
    let timestamp = chrono::Local::now().format("%Y%m%dT%H%M%S");
    let file_name = path
        .file_name()
        .ok_or_else(|| format!("cannot back up path without a file name: {}", path.display()))?
        .to_string_lossy();
    let backup_path = path.with_file_name(format!("{file_name}.bak.{timestamp}"));
    fs::copy(path, &backup_path).map_err(|e| format!("failed to back up {}: {e}", path.display()))?;
    Ok(Some(backup_path))
}
