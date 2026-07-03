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

/// Infers a provider from a host or alias (e.g. "gitlab.com",
/// "gitlab.archlinux.org", "acid.bitbucket.org") by substring, not just exact
/// match, so self-hosted instances and subdomains are still recognized.
/// Mirrors `Provider::from_host` in the reference git-session-tui.
pub fn detect_provider(host: &str) -> String {
    let lower = host.to_ascii_lowercase();
    if lower.contains("github") {
        "github".into()
    } else if lower.contains("gitlab") {
        "gitlab".into()
    } else if lower.contains("bitbucket") {
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
        // The default identity always resolves to the primary provider
        // (GitHub) — matches git-session-tui's `is_default` case.
        provider: "github".into(),
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

        let (email, signing_key, alias, insteadof_host) = match &identity {
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

        let host = insteadof_host.clone().unwrap_or_else(|| "host".into());
        // Matches the git-session-tui convention (`NewSessionSpec::host_alias`):
        // `<name>.<host>`, e.g. "work.github.com".
        let alias = alias.unwrap_or_else(|| format!("{}.{host}", inc.name));

        let mut host_block = host_blocks.iter().find(|b| b.alias == alias);
        if host_block.is_none() {
            // Fallback used by git-session-tui when there's no insteadOf
            // alias to match on: correlate by IdentityFile name instead —
            // "id_<name>" exactly, or "id_<name>_*" (e.g. session "arch"
            // with key "id_arch_gitlab").
            let expected_key = format!("id_{}", inc.name);
            let expected_prefix = format!("{expected_key}_");
            host_block = host_blocks.iter().find(|b| {
                b.identity_file
                    .as_deref()
                    .and_then(|p| paths::expand_tilde(p).file_name().map(|n| n.to_string_lossy().into_owned()))
                    .map(|n| n == expected_key || n.starts_with(&expected_prefix))
                    .unwrap_or(false)
            });
        }

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

        // Provider inference order: the insteadOf target host is the most
        // reliable; the correlated Host block's HostName also usually
        // carries the provider (e.g. self-hosted "gitlab.archlinux.org");
        // its alias/pattern is the next best signal. If none of that exists,
        // default to the primary provider (GitHub) rather than leaving it
        // blank — mirrors git-session-tui's inference chain in `model.rs`.
        let provider = insteadof_host
            .as_deref()
            .or_else(|| host_block.and_then(|b| b.host_name.as_deref()))
            .or_else(|| host_block.map(|b| b.alias.as_str()))
            .map(detect_provider)
            .unwrap_or_else(|| "github".into());

        sessions.push(Session {
            id: inc.name.clone(),
            name: inc.name.clone(),
            provider,
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
