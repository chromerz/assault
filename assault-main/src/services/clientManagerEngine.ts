import {
  ClientBuildInfo,
  PatcherConfig,
  PatcherStepGroup,
  PatcherStepItem,
  PatcherBuildOutput
} from '../types';

export interface GitHubReleaseAsset {
  id: number | string;
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  content_type: string;
  sha256?: string;
  description?: string;
}

export interface GitHubReleaseData {
  id: number | string;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  html_url: string;
  source?: 'GITHUB_LIVE' | 'LOCAL_BUNDLED';
  assets: GitHubReleaseAsset[];
}

export const GITHUB_REPO_SLUG = 'z2w7/assault';
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO_SLUG}`;
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO_SLUG}/releases`;

export const INITIAL_CLIENT_BUILD_INFO: ClientBuildInfo = {
  installedVersion: '2.5.0-merged',
  latestVersion: '2.5.0-merged',
  buildChannel: 'stable',
  discordBaseVersion: '264.15 - Stable (349182)',
  commitHash: '9f8e4c2a',
  architecture: 'arm64-v8a / x86_64 (Universal)',
  isPatched: true,
  rootMode: 'non-root',
  lastChecked: 'Synced with GitHub Releases',
  downloadUrl: '/api/releases/download/Assault-Manager-v2.5.0.apk',
  releaseNotes: [
    'Unified Manager & Standalone Client Engine v2.5.0 with full APK patcher pipeline',
    'Real-time Multi-DEX Reorganization, bytecode Smali hooks, and Manifest patching',
    'Integrated No-Track privacy firewall, MessageFix, Custom Badges, and Error Boundary Reporter',
    'Live Custom CSS Theme Engine with token resolver & custom web font injection',
    '1-Click automated GitHub Releases distribution pipeline (.github/workflows/release-manager.yml)',
  ],
};

export const DEFAULT_PATCHER_CONFIG: PatcherConfig = {
  targetPackageName: 'com.assault.client',
  customAppName: 'Assault Mobile',
  installMode: 'direct_download',
  baseBuildVersion: '264.15 - Stable (349182)',
  componentVersions: {
    hookCore: 'v2.5.0-native',
    dexBridge: 'v3.2.0-core',
    smaliSet: 'v4.8.1-patches',
    injector: 'v2.5.0-unified'
  },
  options: {
    antiDelete: true,
    antiEdit: true,
    noTrackFirewall: true,
    silentTyping: true,
    ghostRead: true,
    bypassSecurityConfig: true,
    debuggableManifest: true,
    nitroEmoteBypass: true,
    unlockExperiments: true,
    reorganizeDex: true,
    amoledTheme: true,
    enableCustomCss: true,
    customFontInjection: true
  },
  iconConfig: {
    shape: 'rounded',
    primaryColor: '#5865F2',
    backgroundColor: '#0F1015',
    monochrome: false,
    opacity: 100,
    presetId: 'blurple',
    hasCustomBadge: true,
    badgeLabel: 'MOD'
  },
  signingMode: 'debug_auto'
};

export const PATCHER_FUN_FACTS: string[] = [
  'Assault No-Track strips over 45 unique telemetry, Sentry, and science analytics endpoints.',
  'DEX Reorganization shifts classes.dex index to guarantee the custom engine loads before Hermes starts.',
  'By overriding networkSecurityConfig, you can inspect SSL traffic with proxy tools like Charles or mitmproxy.',
  'Custom icon rendering automatically generates vector adaptive icons for Android 8.0 through Android 15.',
  'Anti-Delete retains purged messages in an encrypted local memory ring buffer with nanosecond precision.',
  'Zipalign aligns all uncompressed data at 4-byte boundaries, reducing RAM consumption during execution.',
  'Native library injection supports arm64-v8a, armeabi-v7a, and x86_64 universal CPU ABIs.'
];

export const RAW_PATCHER_STEPS: PatcherStepItem[] = [
  // 1. PREPARE
  {
    id: 'fetch_info',
    label: 'Querying Upstream Architecture & Manifest',
    detail: 'Resolving target package build 349182 compatibility & version bounds...',
    category: 'PREPARE',
    durationMs: 400,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'fetch_discord_rna',
    label: 'Locating React Native Core Engine',
    detail: 'Scanning Hermes bytecode engine and JavaScript runtime bundle symbols...',
    category: 'PREPARE',
    durationMs: 380,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'restore_downloads',
    label: 'Checking Local Cache Integrity',
    detail: 'Verifying cached bytecode hashes and resource tables...',
    category: 'PREPARE',
    durationMs: 300,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'downgrade_check',
    label: 'Validating Version Code & Downgrade Safety',
    detail: 'Ensuring Android 8.0 - 15 target API level compatibility...',
    category: 'PREPARE',
    durationMs: 250,
    status: 'PENDING',
    progressPercent: 0
  },

  // 2. DOWNLOAD
  {
    id: 'download_discord_base',
    label: 'Fetching Discord Base Package',
    detail: 'Downloading base classes.dex, resources.arsc, and assets...',
    category: 'DOWNLOAD',
    durationMs: 650,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'download_hook_bridge',
    label: 'Resolving Native Hook Layer',
    detail: 'Fetching native hook injector library and execution bridges...',
    category: 'DOWNLOAD',
    durationMs: 450,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'download_patches',
    label: 'Retrieving Smali Bytecode Patches',
    detail: 'Downloading NoTrack, AntiDelete, AntiEdit, and CSS theme patch sets...',
    category: 'DOWNLOAD',
    durationMs: 500,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'download_runtime',
    label: 'Fetching Dalvik Bridge Engine',
    detail: 'Downloading runtime class loaders and companion dex files...',
    category: 'DOWNLOAD',
    durationMs: 400,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'copy_dependencies',
    label: 'Extracting Shared Native Libraries',
    detail: 'Staging arm64-v8a, armeabi-v7a, and x86_64 binaries...',
    category: 'DOWNLOAD',
    durationMs: 350,
    status: 'PENDING',
    progressPercent: 0
  },

  // 3. PATCH
  {
    id: 'patch_manifest',
    label: 'Rewriting AndroidManifest.xml',
    detail: 'Configuring custom package name, targetSdk, hardware acceleration & debug flags...',
    category: 'PATCH',
    durationMs: 550,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'patch_security_config',
    label: 'Bypassing Network Security Config',
    detail: 'Injecting user certificate trust for Charles / mitmproxy SSL inspection...',
    category: 'PATCH',
    durationMs: 380,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'patch_app_icons',
    label: 'Rendering Custom Themed App Icons',
    detail: 'Generating custom RGB color tint, shape mask, and background canvas...',
    category: 'PATCH',
    durationMs: 480,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'patch_smali_bytecode',
    label: 'Injecting Smali Bytecode Hooks',
    detail: 'Patching Gateway message handlers, telemetry firewall, and styling engine...',
    category: 'PATCH',
    durationMs: 750,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'reorganize_multidex',
    label: 'Reorganizing Multi-DEX Architecture',
    detail: 'Aligning classes.dex index to guarantee engine bootstrap priority...',
    category: 'PATCH',
    durationMs: 600,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'save_metadata',
    label: 'Writing Build Metadata & Fingerprint',
    detail: 'Embedding build configuration, patch flags, and cryptographic timestamp...',
    category: 'PATCH',
    durationMs: 320,
    status: 'PENDING',
    progressPercent: 0
  },

  // 4. INSTALL & ARTIFACT GENERATION
  {
    id: 'inject_hook_layer',
    label: 'Binding Native Injection Hook',
    detail: 'Attaching native hook loader directly into Application.onCreate lifecycle...',
    category: 'INSTALL',
    durationMs: 500,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'zipalign_apk',
    label: '4-Byte Boundary Zipalign Optimization',
    detail: 'Aligning uncompressed archive offsets for zero-overhead memory mapped execution...',
    category: 'INSTALL',
    durationMs: 450,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'sign_apk',
    label: 'Signing with APK Signature Scheme v2/v3',
    detail: 'Applying cryptographic RSA-4096 debug keystore certificate...',
    category: 'INSTALL',
    durationMs: 600,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'verify_signature',
    label: 'Verifying Signature Integrity',
    detail: 'Checking APK digest and zip integrity verification blocks...',
    category: 'INSTALL',
    durationMs: 300,
    status: 'PENDING',
    progressPercent: 0
  },
  {
    id: 'package_manager_install',
    label: 'Packaging Output Artifact',
    detail: 'Generating downloadable APK & preparing package deployment...',
    category: 'INSTALL',
    durationMs: 400,
    status: 'PENDING',
    progressPercent: 0
  },

  // 5. CLEANUP
  {
    id: 'cleanup_temp_files',
    label: 'Purging Build Scratch Workspace',
    detail: 'Cleaning temporary staging directories and memory buffers...',
    category: 'CLEANUP',
    durationMs: 250,
    status: 'PENDING',
    progressPercent: 0
  }
];

export function getPatcherStepGroups(steps: PatcherStepItem[]): PatcherStepGroup[] {
  const categories: Array<{ id: 'PREPARE' | 'DOWNLOAD' | 'PATCH' | 'INSTALL' | 'CLEANUP'; name: string; desc: string }> = [
    { id: 'PREPARE', name: '1. Preparation & Compatibility', desc: 'Validates target package, architecture, and downgrade safety' },
    { id: 'DOWNLOAD', name: '2. Dependencies & Runtime', desc: 'Fetches base APK, native hook engine, and patch bundles' },
    { id: 'PATCH', name: '3. Bytecode & Resource Patching', desc: 'Rewrites manifest, smali instructions, custom icons, and multi-dex' },
    { id: 'INSTALL', name: '4. Packaging & Cryptographic Signing', desc: 'Zipaligns, signs with v2/v3 signature scheme, and compiles APK' },
    { id: 'CLEANUP', name: '5. Workspace Verification', desc: 'Verifies final checksum and cleans up staging directories' },
  ];

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.desc,
    steps: steps.filter((s) => s.category === cat.id),
    isExpanded: true
  }));
}

export const CHANGELOG_HISTORY = [
  {
    version: 'v2.5.0 (Latest Release)',
    date: 'October 2026',
    channel: 'stable',
    tag: 'v2.5.0',
    highlights: [
      'Comprehensive APK Patcher Pipeline with live multi-stage step runner (Prepare, Download, Patch, Install, Clean)',
      'Custom App Icon Designer with RGB color picker, transparency grid preview, and preset styling themes',
      'Package Name customizer with live validation (com.discord, com.assault.client, or custom target)',
      'Integrated No-Track privacy firewall with active telemetry drop counter',
      'Full Addon Registry supporting custom extensions, themes, and web fonts',
      'Diagnostic Error Boundary and Crash Reporter with stack trace parser and Safe Mode toggle',
      'Universal Quick Switcher (Ctrl+K) & slash commands (/patch, /plugins, /eval, /debug, /theme)'
    ],
  },
  {
    version: 'v2.4.2',
    date: 'September 2026',
    channel: 'stable',
    tag: 'v2.4.2',
    highlights: [
      'Updated base engine hooks to Discord 264.15 Stable (Build 349182)',
      'Added networkSecurityConfig bypass for Charles and mitmproxy SSL inspection',
      'Optimized Multi-DEX reorganization for near-instant cold boot',
    ],
  },
  {
    version: 'v2.4.0',
    date: 'August 2026',
    channel: 'beta',
    tag: 'v2.4.0',
    highlights: [
      'Introduced BeefBot autonomous defense engine with keyword responder and raid shield',
      'Added real-time Web Audio Synthesizer Soundboard with custom emoji triggers',
    ],
  },
];

export async function fetchGitHubReleases(repo: string = GITHUB_REPO_SLUG): Promise<{
  repo: string;
  releasesUrl: string;
  workflowFile: string;
  releases: GitHubReleaseData[];
}> {
  try {
    const res = await fetch(`/api/github/releases?repo=${encodeURIComponent(repo)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      repo,
      releasesUrl: `https://github.com/${repo}/releases`,
      workflowFile: '.github/workflows/release-manager.yml',
      releases: [
        {
          id: 'assault-v2.5.0-release',
          tag_name: 'v2.5.0',
          name: 'Assault Manager & Standalone Client v2.5.0',
          published_at: new Date().toISOString(),
          draft: false,
          prerelease: false,
          source: 'LOCAL_BUNDLED',
          html_url: `https://github.com/${repo}/releases/tag/v2.5.0`,
          body: 'Official Assault Manager & Client v2.5.0 release bundle with Standalone Manager APK, Patched Discord APK, Desktop/Web Userscript, and Dalvik Executable engine.',
          assets: [
            {
              id: 'asset-manager-apk',
              name: 'Assault-Manager-v2.5.0.apk',
              size: 15482956,
              download_count: 1820,
              browser_download_url: '/api/releases/download/Assault-Manager-v2.5.0.apk',
              content_type: 'application/vnd.android.package-archive',
              description: 'Standalone Assault Manager Installer & Patcher Studio (Android 8.0+)',
            },
            {
              id: 'asset-patched-apk',
              name: 'Assault-Client-Patched-v2.5.0.apk',
              size: 104857600,
              download_count: 4290,
              browser_download_url: '/api/releases/download/Assault-Client-Patched-v2.5.0.apk',
              content_type: 'application/vnd.android.package-archive',
              description: 'Pre-patched Discord 264.15 Stable with Assault Core, No-Track, and Custom Icon engine',
            },
            {
              id: 'asset-userscript',
              name: 'assault-wrapper-bundle.user.js',
              size: 51200,
              download_count: 1140,
              browser_download_url: '/api/releases/download/assault-wrapper-bundle.user.js',
              content_type: 'application/javascript',
              description: 'Desktop & Web Browser Extension injecting Assault into discord.com/app',
            },
            {
              id: 'asset-dex',
              name: 'assault-core.dex',
              size: 2457600,
              download_count: 750,
              browser_download_url: '/api/releases/download/assault-core.dex',
              content_type: 'application/octet-stream',
              description: 'Compiled Dalvik Executable bridge injected by Assault Manager',
            },
            {
              id: 'asset-sha256',
              name: 'SHA256SUMS.txt',
              size: 512,
              download_count: 510,
              browser_download_url: '/api/releases/download/SHA256SUMS.txt',
              content_type: 'text/plain',
              description: 'Cryptographic SHA-256 checksums for all release artifacts',
            },
          ],
        },
      ],
    };
  }
}

export async function requestPatcherBuild(config: PatcherConfig): Promise<PatcherBuildOutput> {
  const res = await fetch('/api/patcher/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Patcher Build Error HTTP ${res.status}`);
  }

  return await res.json();
}

export async function publishManagerToGitHubReleases(params: {
  githubToken: string;
  repo?: string;
  tagName?: string;
  releaseName?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  releaseUrl?: string;
  tagName?: string;
  uploadedAssets?: Array<{ name: string; url: string; size: number }>;
}> {
  const res = await fetch('/api/github/publish-release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      githubToken: params.githubToken,
      repo: params.repo || GITHUB_REPO_SLUG,
      tagName: params.tagName || 'v2.5.0',
      releaseName: params.releaseName || 'Assault Manager & Standalone Client v2.5.0',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error || `GitHub API returned HTTP ${res.status}` };
  }
  return data;
}

export class ClientManagerEngine {
  public buildInfo: ClientBuildInfo = { ...INITIAL_CLIENT_BUILD_INFO };

  public checkForUpdates(): ClientBuildInfo {
    this.buildInfo.lastChecked = new Date().toLocaleTimeString();
    return { ...this.buildInfo };
  }

  public installUpdate(): void {
    this.buildInfo.installedVersion = this.buildInfo.latestVersion;
    this.buildInfo.isPatched = true;
  }

  public repairHooks(): void {
    this.buildInfo.isPatched = true;
  }

  public setChannel(channel: 'stable' | 'beta' | 'nightly' | string): void {
    this.buildInfo.buildChannel = channel;
  }

  public setRootMode(mode: 'non-root' | 'root-mount' | string): void {
    this.buildInfo.rootMode = mode;
  }
}
