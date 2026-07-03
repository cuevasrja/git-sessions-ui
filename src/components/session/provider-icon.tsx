import * as React from "react";
import { siBitbucket, siGithub, siGitlab } from "simple-icons";
import { Server } from "lucide-react";
import type { Provider } from "@/lib/types";

const BRAND_ICONS: Partial<Record<Provider, { path: string; color: string }>> = {
  github: { path: siGithub.path, color: "var(--provider-github)" },
  gitlab: { path: siGitlab.path, color: "var(--provider-gitlab)" },
  bitbucket: { path: siBitbucket.path, color: "var(--provider-bitbucket)" },
};

interface ProviderIconProps {
  provider?: Provider;
  size?: number;
  style?: React.CSSProperties;
}

export function ProviderIcon({ provider = "custom", size = 16, style = {} }: ProviderIconProps) {
  const meta = BRAND_ICONS[provider];
  const wrap: React.CSSProperties = { width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, ...style };

  if (meta) {
    return (
      <span style={wrap}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill={meta.color} role="img" aria-label={provider}>
          <path d={meta.path} />
        </svg>
      </span>
    );
  }

  return (
    <span style={wrap} aria-label="custom host">
      <Server style={{ width: size, height: size, color: "var(--provider-custom)" }} strokeWidth={2} />
    </span>
  );
}
