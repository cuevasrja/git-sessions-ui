use std::fs;

use crate::{gitconfig, paths, sshconfig};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Problem {
    pub tone: String,
    pub title: String,
    pub detail: String,
    pub suggestion: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub read_only: bool,
    pub health: String,
    pub email: String,
    pub signing_key: String,
    pub gitdir: String,
    pub host: String,
    pub alias: String,
    pub ssh_user: String,
    pub key_path: String,
    pub problems: Vec<Problem>,
}

pub fn detect_provider(host: &str) -> String {
    if host.contains("github.com") {
        "github".into()
    } else if host.contains("gitlab.com") {
        "gitlab".into()
    } else if host.contains("bitbucket.org") {
        "bitbucket".into()
    } else {
        "custom".into()
    }
}

pub fn provider_host(provider: &str, custom_host: &str) -> String {
    match provider {
        "github" => "github.com".into(),
        "gitlab" => "gitlab.com".into(),
        "bitbucket" => "bitbucket.org".into(),
        _ => custom_host.to_string(),
    }
}

fn find_default_ssh_key() -> String {
    let dir = paths::ssh_dir();
    for candidate in ["id_ed25519", "id_ecdsa", "id_rsa"] {
        let p = dir.join(candidate);
        if p.exists() {
            return paths::collapse_home(&p);
        }
    }
    paths::collapse_home(&dir.join("id_ed25519"))
}

/// Discovers every session by cross-referencing `~/.gitconfig`,
/// `~/.gitconfig.<name>` identity files, and `~/.ssh/config` Host blocks,
/// surfacing correlation problems along the way.
pub fn list_sessions() -> Result<Vec<Session>, String> {
    let mut sessions = Vec::new();

    let default_identity = gitconfig::read_default_identity()?;
    sessions.push(Session {
        id: "default".into(),
        name: "(default)".into(),
        provider: "custom".into(),
        read_only: true,
        health: "ok".into(),
        email: default_identity.email,
        signing_key: default_identity.signing_key,
        gitdir: default_identity.include_path.unwrap_or_else(|| "~".into()),
        host: "github.com".into(),
        alias: String::new(),
        ssh_user: "git".into(),
        key_path: find_default_ssh_key(),
        problems: vec![],
    });

    let includes = gitconfig::read_include_ifs()?;
    let ssh_content = fs::read_to_string(paths::ssh_config_path()).unwrap_or_default();
    let host_blocks = sshconfig::parse_host_blocks(&ssh_content);

    for inc in includes {
        let mut problems = Vec::new();
        let identity = gitconfig::read_identity_file(&inc.name);

        let (email, signing_key, alias, host) = match &identity {
            Some(idf) => (idf.email.clone(), idf.signing_key.clone(), idf.alias.clone(), idf.host.clone()),
            None => {
                problems.push(Problem {
                    tone: "warn".into(),
                    title: "Orphan includeIf — no matching identity file".into(),
                    detail: format!("includeIf gitdir:{} → {} (not found)", inc.gitdir, inc.config_path),
                    suggestion: format!("Recreate {} or repoint the includeIf path.", inc.config_path),
                });
                (String::new(), String::new(), None, None)
            }
        };

        let host = host.unwrap_or_else(|| "host".into());
        let alias = alias.unwrap_or_else(|| format!("{host}-{}", inc.name));

        let host_block = host_blocks.iter().find(|b| b.alias == alias);
        let (ssh_user, key_path) = match host_block {
            Some(b) => (b.user.clone().unwrap_or_else(|| "git".into()), b.identity_file.clone().unwrap_or_default()),
            None => {
                problems.push(Problem {
                    tone: "warn".into(),
                    title: "Host block not correlated to any identity".into(),
                    detail: format!("Host {alias} in ~/.ssh/config"),
                    suggestion: "Add a matching [url] insteadOf, or delete the stale Host block.".into(),
                });
                ("git".into(), String::new())
            }
        };

        if !key_path.is_empty() {
            let expanded = paths::expand_tilde(&key_path);
            if !expanded.exists() {
                problems.push(Problem {
                    tone: "error".into(),
                    title: "IdentityFile missing on disk".into(),
                    detail: key_path.clone(),
                    suggestion: "Generate a new key or point IdentityFile at an existing id_*.".into(),
                });
            }
        }

        let health = if problems.iter().any(|p| p.tone == "error") {
            "error"
        } else if !problems.is_empty() {
            "warn"
        } else {
            "ok"
        };

        sessions.push(Session {
            id: inc.name.clone(),
            name: inc.name.clone(),
            provider: detect_provider(&host),
            read_only: false,
            health: health.into(),
            email,
            signing_key,
            gitdir: inc.gitdir,
            host,
            alias,
            ssh_user,
            key_path,
            problems,
        });
    }

    Ok(sessions)
}
