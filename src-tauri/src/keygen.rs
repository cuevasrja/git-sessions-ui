use std::process::Command;

use crate::paths;

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedKey {
    pub private_path: String,
    pub public_path: String,
    pub public_key: String,
}

/// Shells out to the system `ssh-keygen` to generate a fresh ed25519 keypair
/// at `~/.ssh/id_ed25519_<name>`. Requires an OpenSSH client on PATH — bundled
/// by default on macOS, Linux, and Windows 10 1803+.
pub fn generate_ed25519_key(name: &str, passphrase: &str, comment: &str) -> Result<GeneratedKey, String> {
    let dir = paths::ssh_dir();
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let private = dir.join(format!("id_ed25519_{name}"));
    let public = dir.join(format!("id_ed25519_{name}.pub"));

    if private.exists() {
        return Err(format!("{} already exists", paths::collapse_home(&private)));
    }

    let status = Command::new("ssh-keygen")
        .arg("-t")
        .arg("ed25519")
        .arg("-f")
        .arg(&private)
        .arg("-N")
        .arg(passphrase)
        .arg("-C")
        .arg(comment)
        .arg("-q")
        .status()
        .map_err(|e| format!("failed to run ssh-keygen: {e}. Is OpenSSH installed and on PATH?"))?;

    if !status.success() {
        return Err("ssh-keygen exited with a non-zero status".into());
    }

    let public_key = std::fs::read_to_string(&public).map_err(|e| e.to_string())?.trim().to_string();

    Ok(GeneratedKey {
        private_path: paths::collapse_home(&private),
        public_path: paths::collapse_home(&public),
        public_key,
    })
}

/// Lists `id_*` private key files already present in `~/.ssh`.
pub fn list_existing_keys() -> Vec<String> {
    let dir = paths::ssh_dir();
    let mut keys = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with("id_") && !name.ends_with(".pub") {
                    keys.push(paths::collapse_home(&path));
                }
            }
        }
    }
    keys.sort();
    keys
}
