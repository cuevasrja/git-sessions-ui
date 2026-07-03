use std::path::{Path, PathBuf};

pub fn home_dir() -> PathBuf {
    dirs::home_dir().expect("could not resolve home directory")
}

pub fn gitconfig_path() -> PathBuf {
    home_dir().join(".gitconfig")
}

pub fn ssh_config_path() -> PathBuf {
    home_dir().join(".ssh").join("config")
}

pub fn ssh_dir() -> PathBuf {
    home_dir().join(".ssh")
}

pub fn identity_config_path(name: &str) -> PathBuf {
    home_dir().join(format!(".gitconfig.{name}"))
}

/// Expand a leading `~` to the user's home directory.
pub fn expand_tilde(path: &str) -> PathBuf {
    let path = path.trim();
    if let Some(rest) = path.strip_prefix("~/") {
        home_dir().join(rest)
    } else if path == "~" {
        home_dir()
    } else {
        PathBuf::from(path)
    }
}

/// Collapse the home directory prefix back to `~` for display/storage.
pub fn collapse_home(path: &Path) -> String {
    let home = home_dir();
    if let Ok(rest) = path.strip_prefix(&home) {
        if rest.as_os_str().is_empty() {
            "~".to_string()
        } else {
            format!("~/{}", rest.to_string_lossy().replace('\\', "/"))
        }
    } else {
        path.to_string_lossy().to_string()
    }
}
