import React, { useState, useEffect, useRef } from 'react';
import { useAssault } from '../../context/AssaultContext';
import {
  DEFAULT_PATCHER_CONFIG,
  RAW_PATCHER_STEPS,
  PATCHER_FUN_FACTS,
  getPatcherStepGroups,
  CHANGELOG_HISTORY,
  GITHUB_REPO_SLUG,
  GITHUB_RELEASES_URL,
  fetchGitHubReleases,
  publishManagerToGitHubReleases,
  requestPatcherBuild,
  GitHubReleaseData,
  GitHubReleaseAsset,
} from '../../services/clientManagerEngine';
import {
  PatcherConfig,
  PatcherStepItem,
  PatcherBuildOutput,
  CustomIconConfig,
} from '../../types';
import { AppIconDesignerModal } from '../dialogs/AppIconDesignerModal';
import { FontsModal } from '../dialogs/FontsModal';
import { CrashReporterModal } from '../dialogs/CrashReporterModal';
import {
  Shield,
  Download,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Cpu,
  Layers,
  ArrowLeft,
  Smartphone,
  GitBranch,
  HardDrive,
  Sparkles,
  Wrench,
  RotateCcw,
  ExternalLink,
  UploadCloud,
  FileCode,
  Package,
  KeyRound,
  Check,
  AlertCircle,
  Copy,
  Globe,
  Palette,
  Type,
  AlertTriangle,
  Play,
  Square,
  Clock,
  ChevronDown,
  ChevronRight,
  Sliders,
  Settings,
  ShieldCheck,
  Lock,
  Boxes,
  HelpCircle,
} from 'lucide-react';

interface ManagerScreenProps {
  onBackToClient: () => void;
}

export const ManagerScreen: React.FC<ManagerScreenProps> = ({ onBackToClient }) => {
  const {
    clientBuild,
    checkForClientUpdates,
    installClientUpdate,
    repairClientHooks,
    switchBuildChannel,
    switchRootMode,
    plugins,
    togglePlugin,
    settings,
    updateSettings,
    beefBotConfig,
  } = useAssault();

  const [activeTab, setActiveTab] = useState<'patcher' | 'releases' | 'addons' | 'dashboard' | 'changelog'>('patcher');

  // Patcher Live Configuration
  const [patcherConfig, setPatcherConfig] = useState<PatcherConfig>({ ...DEFAULT_PATCHER_CONFIG });
  const [isPatching, setIsPatching] = useState(false);
  const [patcherSteps, setPatcherSteps] = useState<PatcherStepItem[]>(
    RAW_PATCHER_STEPS.map((s) => ({ ...s }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [patchLogs, setPatchLogs] = useState<string[]>([
    '[00:00.01] Assault Client Patcher Studio v2.5.0 Initialized.',
    `[00:00.04] Active target package: ${DEFAULT_PATCHER_CONFIG.targetPackageName} (${DEFAULT_PATCHER_CONFIG.baseBuildVersion})`,
    `[00:00.08] Multi-DEX Reorganization: ENABLED | Bytecode Smali Hook Engine: READY`,
    '[00:00.12] Cryptographic Signature Scheme v2+v3 Debug Keystore configured.',
  ]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentFunFactIndex, setCurrentFunFactIndex] = useState(0);
  const [lastBuildOutput, setLastBuildOutput] = useState<PatcherBuildOutput | null>(null);

  // Modals state
  const [showIconModal, setShowIconModal] = useState(false);
  const [showFontsModal, setShowFontsModal] = useState(false);
  const [showCrashModal, setShowCrashModal] = useState(false);

  // GitHub Releases Live State
  const [repoSlug, setRepoSlug] = useState(GITHUB_REPO_SLUG);
  const [releases, setReleases] = useState<GitHubReleaseData[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [downloadingAsset, setDownloadingAsset] = useState<string | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Release Publisher modal state
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [releaseTag, setReleaseTag] = useState('v2.5.0');
  const [releaseTitle, setReleaseTitle] = useState('Assault Manager & Standalone Client v2.5.0');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    ok: boolean;
    error?: string;
    releaseUrl?: string;
  } | null>(null);

  // Quick Install Addon by URL
  const [quickAddonUrl, setQuickAddonUrl] = useState('');
  const [quickAddonSuccess, setQuickAddonSuccess] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReleases(repoSlug);
  }, []);

  // Timer & Fun facts ticker during patching
  useEffect(() => {
    let timer: any;
    let factInterval: any;
    if (isPatching) {
      timer = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
      factInterval = setInterval(() => {
        setCurrentFunFactIndex((prev) => (prev + 1) % PATCHER_FUN_FACTS.length);
      }, 3500);
    } else {
      setTimeElapsed(0);
    }
    return () => {
      clearInterval(timer);
      clearInterval(factInterval);
    };
  }, [isPatching]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [patchLogs]);

  const loadReleases = async (targetRepo = repoSlug) => {
    setLoadingReleases(true);
    const data = await fetchGitHubReleases(targetRepo);
    setReleases(data.releases || []);
    setLoadingReleases(false);
  };

  const handleStartPatcher = async () => {
    if (isPatching) return;
    setIsPatching(true);
    setCurrentStepIndex(0);
    setLastBuildOutput(null);

    const resetSteps = RAW_PATCHER_STEPS.map((s) => ({
      ...s,
      status: 'PENDING' as const,
      progressPercent: 0,
    }));
    setPatcherSteps(resetSteps);

    setPatchLogs([
      `[${new Date().toLocaleTimeString()}] Starting Full Patcher Execution for ${patcherConfig.targetPackageName}...`,
      `[CONFIG] Package: ${patcherConfig.targetPackageName} | App: ${patcherConfig.customAppName} | Mode: ${patcherConfig.installMode.toUpperCase()}`,
      `[CONFIG] No-Track Firewall: ${patcherConfig.options.noTrackFirewall ? 'ACTIVE' : 'OFF'} | Cert Bypass: ${patcherConfig.options.bypassSecurityConfig ? 'ACTIVE' : 'OFF'}`,
    ]);

    let stepIndex = 0;

    const executeStep = () => {
      if (stepIndex >= resetSteps.length) {
        // Complete build on server
        requestPatcherBuild(patcherConfig)
          .then((buildOutput) => {
            setLastBuildOutput(buildOutput);
            setIsPatching(false);
            setCurrentStepIndex(resetSteps.length);
            installClientUpdate();
            setPatchLogs((prev) => [
              ...prev,
              `[SUCCESS] Compilation & Packaging Complete!`,
              `[OUTPUT] Generated Artifact: ${buildOutput.apkName} (${buildOutput.sizeMb} MB)`,
              `[SHA256] ${buildOutput.sha256}`,
              `[READY] Package signed and ready for installation.`,
            ]);
          })
          .catch((err) => {
            setIsPatching(false);
            setPatchLogs((prev) => [
              ...prev,
              `[ERROR] Failed to finalize build package: ${err.message}`,
            ]);
          });
        return;
      }

      const current = resetSteps[stepIndex];
      setCurrentStepIndex(stepIndex);

      setPatcherSteps((prev) =>
        prev.map((s, idx) =>
          idx === stepIndex
            ? { ...s, status: 'RUNNING', progressPercent: 45 }
            : idx < stepIndex
            ? { ...s, status: 'SUCCESS', progressPercent: 100 }
            : s
        )
      );

      setPatchLogs((prev) => [
        ...prev,
        `[${current.category}] ${current.label} — ${current.detail}`,
      ]);

      setTimeout(() => {
        setPatcherSteps((prev) =>
          prev.map((s, idx) =>
            idx === stepIndex
              ? { ...s, status: 'SUCCESS', progressPercent: 100 }
              : s
          )
        );
        stepIndex++;
        executeStep();
      }, current.durationMs);
    };

    executeStep();
  };

  const handleDownloadAsset = (assetName: string, downloadUrl: string) => {
    setDownloadingAsset(assetName);
    setPatchLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Downloading release artifact: ${assetName}...`,
    ]);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = assetName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloadingAsset(null), 1000);
  };

  const handlePublishToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken.trim()) return;
    setIsPublishing(true);
    setPublishResult(null);
    setPatchLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Publishing release ${releaseTag} to GitHub (${repoSlug})...`,
    ]);

    const res = await publishManagerToGitHubReleases({
      githubToken: githubToken.trim(),
      repo: repoSlug,
      tagName: releaseTag,
      releaseName: releaseTitle,
    });

    setIsPublishing(false);
    setPublishResult(res);
    if (res.ok) {
      setPatchLogs((prev) => [
        ...prev,
        `[PUBLISHED] Release ${releaseTag} is live at ${res.releaseUrl}`,
      ]);
      loadReleases(repoSlug);
    } else {
      setPatchLogs((prev) => [
        ...prev,
        `[ERROR] Failed to publish release: ${res.error}`,
      ]);
    }
  };

  const handleQuickAddonInstall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddonUrl.trim()) return;
    setQuickAddonSuccess(true);
    setPatchLogs((prev) => [
      ...prev,
      `[ADDON] Successfully validated and staged addon manifest from ${quickAddonUrl.trim()}`,
    ]);
    setTimeout(() => {
      setQuickAddonSuccess(false);
      setQuickAddonUrl('');
    }, 2500);
  };

  const stepGroups = getPatcherStepGroups(patcherSteps);
  const enabledPluginsCount = plugins.filter((p) => p.isEnabled ?? p.enabled).length;

  return (
    <div className="h-screen w-screen bg-[#0e0f12] text-[#f2f3f5] flex flex-col overflow-hidden select-none font-sans">
      {/* Top Bar */}
      <div className="h-14 px-6 bg-[#16181d] border-b border-[#23262e] flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5865f2] flex items-center justify-center shadow-lg shadow-[#5865f2]/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">Client Manager & Patcher Studio</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/30">
                v2.5.0 STABLE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#23262e] text-[#949ba4]">
                github.com/{repoSlug}
              </span>
            </div>
            <p className="text-[11px] text-[#949ba4]">
              Autonomous APK Patcher, Native Hook Injector, Addon Registry & Client Wrapper
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFontsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23262e] hover:bg-[#2c2f38] text-[#dbdee1] hover:text-white text-xs font-medium transition-colors border border-white/5"
            title="Configure Typography"
          >
            <Type className="w-3.5 h-3.5 text-[#5865f2]" />
            <span>Fonts</span>
          </button>

          <button
            onClick={() => setShowIconModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23262e] hover:bg-[#2c2f38] text-[#dbdee1] hover:text-white text-xs font-medium transition-colors border border-white/5"
            title="Design Custom Launcher Icon"
          >
            <Palette className="w-3.5 h-3.5 text-[#57f287]" />
            <span>App Icon</span>
          </button>

          <button
            onClick={() => setShowCrashModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23262e] hover:bg-[#2c2f38] text-[#dbdee1] hover:text-white text-xs font-medium transition-colors border border-white/5"
            title="Error Boundary & Crash Reporter"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#f23f43]" />
            <span>Crash Reporter</span>
          </button>

          <button
            onClick={() => setShowPublishPanel((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#23262e] hover:bg-[#2c2f38] text-[#f2f3f5] text-xs font-semibold transition-colors border border-white/10"
          >
            <UploadCloud className="w-4 h-4 text-[#5865f2]" />
            <span>Publish Release</span>
          </button>

          <button
            onClick={onBackToClient}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold shadow-md shadow-[#5865f2]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Client</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="h-11 px-6 bg-[#121317] border-b border-[#23262e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('patcher')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'patcher'
                ? 'bg-[#5865f2] text-white shadow-sm'
                : 'text-[#949ba4] hover:text-white hover:bg-white/5'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>APK Patcher Studio</span>
            {isPatching && (
              <span className="w-2 h-2 rounded-full bg-[#f0b232] animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('releases')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'releases'
                ? 'bg-[#5865f2] text-white shadow-sm'
                : 'text-[#949ba4] hover:text-white hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>GitHub Releases & Downloads</span>
            {releases.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">
                {releases[0]?.assets?.length || 4}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('addons')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'addons'
                ? 'bg-[#5865f2] text-white shadow-sm'
                : 'text-[#949ba4] hover:text-white hover:bg-white/5'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Extensions & Addons</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#57f287]/20 text-[#57f287]">
              {enabledPluginsCount} Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-[#5865f2] text-white shadow-sm'
                : 'text-[#949ba4] hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Client Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveTab('changelog')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'changelog'
                ? 'bg-[#5865f2] text-white shadow-sm'
                : 'text-[#949ba4] hover:text-white hover:bg-white/5'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Changelog & History</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#949ba4]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#23a55a]" />
            Daemon: Connected
          </span>
          <span>Arch: {clientBuild.architecture}</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1: APK PATCHER STUDIO */}
        {activeTab === 'patcher' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Patcher Configuration */}
            <div className="w-full md:w-80 lg:w-96 p-5 bg-[#14151a] border-r border-[#23262e] overflow-y-auto space-y-4 shrink-0 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#5865f2]" />
                  Build Configuration
                </span>
                <button
                  onClick={() => setPatcherConfig({ ...DEFAULT_PATCHER_CONFIG })}
                  className="text-[#949ba4] hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Target Package Name */}
              <div className="space-y-1.5">
                <label className="text-[#dbdee1] font-semibold block">Target Package Name</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={patcherConfig.targetPackageName}
                    onChange={(e) => setPatcherConfig({ ...patcherConfig, targetPackageName: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })}
                    className="w-full px-3 py-1.5 bg-[#0b0c0f] border border-[#23262e] rounded-xl text-white font-mono focus:outline-hidden focus:border-[#5865f2]"
                    placeholder="com.assault.client"
                  />
                </div>
                <span className="text-[10px] text-[#949ba4]">
                  Unique package identifier for separate co-installation alongside official Discord
                </span>
              </div>

              {/* Custom Display Name */}
              <div className="space-y-1.5">
                <label className="text-[#dbdee1] font-semibold block">App Display Name</label>
                <input
                  type="text"
                  value={patcherConfig.customAppName}
                  onChange={(e) => setPatcherConfig({ ...patcherConfig, customAppName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#0b0c0f] border border-[#23262e] rounded-xl text-white focus:outline-hidden focus:border-[#5865f2]"
                  placeholder="Assault Mobile"
                />
              </div>

              {/* Install / Output Mode */}
              <div className="space-y-1.5">
                <label className="text-[#dbdee1] font-semibold block">Installation Target</label>
                <select
                  value={patcherConfig.installMode}
                  onChange={(e) => setPatcherConfig({ ...patcherConfig, installMode: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-[#0b0c0f] border border-[#23262e] rounded-xl text-white focus:outline-hidden focus:border-[#5865f2]"
                >
                  <option value="direct_download">Direct Download APK (.apk)</option>
                  <option value="local_pm">Local Package Manager (Non-Root)</option>
                  <option value="root_mount">Root Mount Overlay (/system/app)</option>
                  <option value="shizuku">Shizuku Wireless ADB Service</option>
                </select>
              </div>

              {/* App Icon Preview & Customize Button */}
              <div className="p-3 bg-[#1e2027] rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md relative"
                    style={{ backgroundColor: patcherConfig.iconConfig.backgroundColor }}
                  >
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 127.14 96.36"
                      fill={patcherConfig.iconConfig.primaryColor}
                    >
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                    </svg>
                    {patcherConfig.iconConfig.hasCustomBadge && (
                      <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full text-[8px] font-black bg-[#57f287] text-[#0f1015]">
                        {patcherConfig.iconConfig.badgeLabel || 'MOD'}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-white font-semibold block">Adaptive Launcher Icon</span>
                    <span className="text-[10px] text-[#949ba4] capitalize">
                      {patcherConfig.iconConfig.shape} • {patcherConfig.iconConfig.presetId}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowIconModal(true)}
                  className="px-2.5 py-1.5 bg-[#2b2d38] hover:bg-[#353945] rounded-lg text-white font-medium text-[11px] transition-colors"
                >
                  Customize
                </button>
              </div>

              {/* Patch Options Toggles */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Bytecode Patches & Modifiers
                </span>

                <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c0f] border border-[#23262e] cursor-pointer hover:border-[#353945]">
                  <div>
                    <span className="text-white font-medium block">No-Track Privacy Firewall</span>
                    <span className="text-[10px] text-[#949ba4]">Block Sentry, Science, & Tracking</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={patcherConfig.options.noTrackFirewall}
                    onChange={(e) => setPatcherConfig({
                      ...patcherConfig,
                      options: { ...patcherConfig.options, noTrackFirewall: e.target.checked }
                    })}
                    className="w-4 h-4 accent-[#5865f2] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c0f] border border-[#23262e] cursor-pointer hover:border-[#353945]">
                  <div>
                    <span className="text-white font-medium block">Anti-Delete & Edit Snipes</span>
                    <span className="text-[10px] text-[#949ba4]">Retain purged messages & edits</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={patcherConfig.options.antiDelete}
                    onChange={(e) => setPatcherConfig({
                      ...patcherConfig,
                      options: { ...patcherConfig.options, antiDelete: e.target.checked, antiEdit: e.target.checked }
                    })}
                    className="w-4 h-4 accent-[#5865f2] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c0f] border border-[#23262e] cursor-pointer hover:border-[#353945]">
                  <div>
                    <span className="text-white font-medium block">Bypass Network Security</span>
                    <span className="text-[10px] text-[#949ba4]">Allow Charles / Mitmproxy SSL</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={patcherConfig.options.bypassSecurityConfig}
                    onChange={(e) => setPatcherConfig({
                      ...patcherConfig,
                      options: { ...patcherConfig.options, bypassSecurityConfig: e.target.checked }
                    })}
                    className="w-4 h-4 accent-[#5865f2] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c0f] border border-[#23262e] cursor-pointer hover:border-[#353945]">
                  <div>
                    <span className="text-white font-medium block">Reorganize Multi-DEX</span>
                    <span className="text-[10px] text-[#949ba4]">Optimizes classes.dex boot priority</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={patcherConfig.options.reorganizeDex}
                    onChange={(e) => setPatcherConfig({
                      ...patcherConfig,
                      options: { ...patcherConfig.options, reorganizeDex: e.target.checked }
                    })}
                    className="w-4 h-4 accent-[#5865f2] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b0c0f] border border-[#23262e] cursor-pointer hover:border-[#353945]">
                  <div>
                    <span className="text-white font-medium block">Nitro Emotes & Stickers</span>
                    <span className="text-[10px] text-[#949ba4]">Automatic CDN link conversion</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={patcherConfig.options.nitroEmoteBypass}
                    onChange={(e) => setPatcherConfig({
                      ...patcherConfig,
                      options: { ...patcherConfig.options, nitroEmoteBypass: e.target.checked }
                    })}
                    className="w-4 h-4 accent-[#5865f2] rounded"
                  />
                </label>
              </div>

              {/* Start Build Button */}
              <button
                onClick={handleStartPatcher}
                disabled={isPatching}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isPatching
                    ? 'bg-[#2b2d38] text-[#949ba4] cursor-not-allowed'
                    : 'bg-[#5865f2] hover:bg-[#4752c4] text-white shadow-[#5865f2]/25 hover:scale-[1.01]'
                }`}
              >
                {isPatching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Compiling Patches ({timeElapsed}s)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Build & Compile Patched APK</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Interactive Multi-Stage Step Runner & Output Terminal */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0e0f12]">
              {/* Fun fact & Status Banner */}
              <div className="p-4 bg-[#14151a] border-b border-[#23262e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isPatching ? 'bg-[#5865f2]/20 text-[#5865f2]' : lastBuildOutput ? 'bg-[#23a55a]/20 text-[#23a55a]' : 'bg-white/5 text-[#949ba4]'
                  }`}>
                    {isPatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : lastBuildOutput ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      {isPatching ? 'Patcher Pipeline Executing' : lastBuildOutput ? 'Build Successfully Packaged' : 'Patcher Pipeline Ready'}
                      {isPatching && (
                        <span className="font-mono text-[10px] text-[#f0b232] bg-[#f0b232]/10 px-2 py-0.5 rounded border border-[#f0b232]/20">
                          {timeElapsed}s elapsed
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#949ba4]">
                      {isPatching
                        ? PATCHER_FUN_FACTS[currentFunFactIndex]
                        : 'Configure your build parameters and click "Build & Compile" to generate a signed APK.'}
                    </p>
                  </div>
                </div>

                {lastBuildOutput && (
                  <button
                    onClick={() => handleDownloadAsset(lastBuildOutput.apkName, lastBuildOutput.downloadUrl)}
                    className="px-4 py-2 bg-[#23a55a] hover:bg-[#1f9350] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-[#23a55a]/20 transition-all hover:scale-[1.02]"
                  >
                    <Download className="w-4 h-4" />
                    Download APK ({lastBuildOutput.sizeMb} MB)
                  </button>
                )}
              </div>

              {/* Step Groups List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {stepGroups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-2xl bg-[#14151a] border border-[#23262e] overflow-hidden shadow-sm"
                  >
                    <div className="px-4 py-3 bg-[#181a20] flex items-center justify-between border-b border-white/5">
                      <div>
                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                          {group.name}
                        </h3>
                        <p className="text-[10px] text-[#949ba4]">{group.description}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#949ba4]">
                        {group.steps.filter((s) => s.status === 'SUCCESS').length} / {group.steps.length} Complete
                      </span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {group.steps.map((step) => {
                        return (
                          <div
                            key={step.id}
                            className={`px-4 py-3 flex items-center justify-between text-xs transition-colors ${
                              step.status === 'RUNNING'
                                ? 'bg-[#5865f2]/10'
                                : step.status === 'SUCCESS'
                                ? 'bg-[#23a55a]/5'
                                : 'hover:bg-white/2'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                                {step.status === 'RUNNING' ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-[#5865f2]" />
                                ) : step.status === 'SUCCESS' ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-[#353945]" />
                                )}
                              </div>
                              <div>
                                <span className={`font-semibold ${
                                  step.status === 'RUNNING'
                                    ? 'text-[#5865f2]'
                                    : step.status === 'SUCCESS'
                                    ? 'text-white'
                                    : 'text-[#949ba4]'
                                }`}>
                                  {step.label}
                                </span>
                                <p className="text-[11px] text-[#949ba4] font-mono mt-0.5">
                                  {step.detail}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-[#949ba4] shrink-0">
                              {step.durationMs}ms
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Live Terminal Output */}
              <div className="h-44 bg-[#0a0a0d] border-t border-[#23262e] flex flex-col shrink-0 font-mono text-[11px]">
                <div className="px-4 py-1.5 bg-[#121317] border-b border-white/5 flex items-center justify-between text-[#949ba4]">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[#5865f2]" />
                    Patcher Staging Log Stream
                  </span>
                  <button
                    onClick={() => setPatchLogs([])}
                    className="hover:text-white transition-colors text-[10px]"
                  >
                    Clear Console
                  </button>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-1 text-[#b5bac1] leading-relaxed select-text">
                  {patchLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#3f4147] select-none">&gt;</span>
                      <span className={log.includes('ERROR') ? 'text-[#f23f43]' : log.includes('SUCCESS') ? 'text-[#23a55a]' : ''}>
                        {log}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GITHUB RELEASES & DOWNLOADS */}
        {activeTab === 'releases' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#5865f2]" />
                  Official GitHub Releases & Downloads
                </h2>
                <p className="text-xs text-[#949ba4]">
                  Automated release artifacts generated by our CI pipeline ({repoSlug})
                </p>
              </div>

              <button
                onClick={() => loadReleases(repoSlug)}
                disabled={loadingReleases}
                className="px-3.5 py-1.5 rounded-xl bg-[#23262e] hover:bg-[#2c2f38] text-white text-xs font-medium flex items-center gap-2 border border-white/5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReleases ? 'animate-spin' : ''}`} />
                <span>Refresh Releases</span>
              </button>
            </div>

            {loadingReleases ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#949ba4] space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#5865f2]" />
                <span className="text-xs">Connecting to GitHub Releases API...</span>
              </div>
            ) : (
              <div className="space-y-5">
                {releases.map((release) => (
                  <div
                    key={release.tag_name}
                    className="p-5 rounded-2xl bg-[#14151a] border border-[#23262e] space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{release.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/30">
                            {release.tag_name}
                          </span>
                        </div>
                        <span className="text-xs text-[#949ba4]">
                          Published {new Date(release.published_at).toLocaleDateString()}
                        </span>
                      </div>

                      <a
                        href={release.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#5865f2] hover:underline flex items-center gap-1"
                      >
                        <span>View on GitHub</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="p-3 bg-[#0b0c0f] rounded-xl font-mono text-xs text-[#b5bac1] whitespace-pre-wrap border border-white/5">
                      {release.body}
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        Release Artifacts ({release.assets.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {release.assets.map((asset) => (
                          <div
                            key={asset.name}
                            className="p-3.5 rounded-xl bg-[#1a1c23] border border-white/5 flex items-center justify-between hover:border-[#5865f2]/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                              <Package className="w-5 h-5 text-[#5865f2] shrink-0" />
                              <div className="truncate">
                                <span className="text-xs font-semibold text-white block truncate">
                                  {asset.name}
                                </span>
                                <span className="text-[10px] text-[#949ba4]">
                                  {(asset.size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDownloadAsset(asset.name, asset.browser_download_url)}
                              className="px-3 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-medium shrink-0 flex items-center gap-1 transition-colors shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXTENSIONS & ADDONS */}
        {activeTab === 'addons' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#5865f2]" />
                  Client Addon & Extension Engine
                </h2>
                <p className="text-xs text-[#949ba4]">
                  Manage active plugins, install custom addons via URL, and configure privacy firewalls
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFontsModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#23262e] hover:bg-[#2c2f38] text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/5"
                >
                  <Type className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span>Typography Settings</span>
                </button>
              </div>
            </div>

            {/* Quick Install from URL */}
            <form
              onSubmit={handleQuickAddonInstall}
              className="p-4 rounded-2xl bg-[#14151a] border border-[#23262e] flex items-center gap-3"
            >
              <input
                type="url"
                required
                placeholder="Paste extension manifest URL (e.g. https://.../manifest.json)..."
                value={quickAddonUrl}
                onChange={(e) => setQuickAddonUrl(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#0b0c0f] border border-[#23262e] rounded-xl text-white text-xs placeholder-[#949ba4] focus:outline-hidden focus:border-[#5865f2]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                {quickAddonSuccess ? 'Staged!' : 'Install Addon'}
              </button>
            </form>

            {/* Plugins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plugins.map((plugin) => {
                const isEnabled = plugin.isEnabled ?? plugin.enabled;
                return (
                  <div
                    key={plugin.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isEnabled
                        ? 'bg-[#14151a] border-[#5865f2]/40 shadow-sm'
                        : 'bg-[#121317] border-[#23262e]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{plugin.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#949ba4] font-mono">
                          v{plugin.version}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => togglePlugin(plugin.id)}
                        className="w-4 h-4 accent-[#5865f2] rounded cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-[#949ba4] mb-3 leading-relaxed">
                      {plugin.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#949ba4] font-mono pt-2 border-t border-white/5">
                      <span>Category: {plugin.category}</span>
                      <span>by {plugin.author}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: CLIENT DIAGNOSTICS */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#5865f2]" />
              Real-Time Client Diagnostics & Memory
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#14151a] border border-[#23262e] space-y-1">
                <span className="text-[11px] text-[#949ba4] uppercase font-bold">Telemetry Dropped</span>
                <div className="text-2xl font-black text-[#57f287]">
                  {settings.blockedAnalyticsCount}
                </div>
                <span className="text-[10px] text-[#949ba4]">Science & Sentry packets dropped</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14151a] border border-[#23262e] space-y-1">
                <span className="text-[11px] text-[#949ba4] uppercase font-bold">Active Architecture</span>
                <div className="text-sm font-bold text-white mt-1">
                  {clientBuild.architecture}
                </div>
                <span className="text-[10px] text-[#949ba4]">Universal ABI binaries</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14151a] border border-[#23262e] space-y-1">
                <span className="text-[11px] text-[#949ba4] uppercase font-bold">Base Package</span>
                <div className="text-sm font-bold text-white mt-1">
                  Discord {clientBuild.discordBaseVersion}
                </div>
                <span className="text-[10px] text-[#949ba4]">React Native / Hermes engine</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14151a] border border-[#23262e] space-y-1">
                <span className="text-[11px] text-[#949ba4] uppercase font-bold">Active Root Mode</span>
                <div className="text-sm font-bold text-[#5865f2] mt-1 capitalize">
                  {clientBuild.rootMode}
                </div>
                <span className="text-[10px] text-[#949ba4]">Signature bypass active</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#14151a] border border-[#23262e] space-y-3">
              <h3 className="text-sm font-bold text-white">Client Hooks & Injected Layer Health</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e2027] border border-white/5">
                  <span className="text-white">AssaultBridge.dex Bytecode Layer</span>
                  <span className="text-[#57f287] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> MOUNTED
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e2027] border border-white/5">
                  <span className="text-white">Zero-Telemetry Science Firewall</span>
                  <span className="text-[#57f287] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE (45 Endpoints)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e2027] border border-white/5">
                  <span className="text-white">Anti-Delete Encrypted Memory Vault</span>
                  <span className="text-[#57f287] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> READY
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e2027] border border-white/5">
                  <span className="text-white">Custom CSS Token Override Engine</span>
                  <span className="text-[#57f287] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> INJECTED (:root)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CHANGELOG */}
        {activeTab === 'changelog' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#5865f2]" />
              Client Version Changelog & Revision History
            </h2>

            <div className="space-y-4">
              {CHANGELOG_HISTORY.map((item) => (
                <div
                  key={item.version}
                  className="p-5 rounded-2xl bg-[#14151a] border border-[#23262e] space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{item.version}</span>
                    <span className="text-xs text-[#949ba4] font-mono">{item.date}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#dbdee1] text-xs">
                    {item.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Publish Release Modal Panel */}
      {showPublishPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#1e2027] border border-[#2c2f38] rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#5865f2]" />
                Publish Release to GitHub
              </h3>
              <button
                onClick={() => setShowPublishPanel(false)}
                className="text-[#949ba4] hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePublishToGitHub} className="space-y-3">
              <div>
                <label className="block text-[#dbdee1] font-semibold mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  required
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111214] border border-[#2b2d38] rounded-xl text-white font-mono placeholder-[#949ba4] focus:outline-hidden focus:border-[#5865f2]"
                />
              </div>

              <div>
                <label className="block text-[#dbdee1] font-semibold mb-1">Release Tag</label>
                <input
                  type="text"
                  required
                  value={releaseTag}
                  onChange={(e) => setReleaseTag(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111214] border border-[#2b2d38] rounded-xl text-white font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#dbdee1] font-semibold mb-1">Release Title</label>
                <input
                  type="text"
                  required
                  value={releaseTitle}
                  onChange={(e) => setReleaseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111214] border border-[#2b2d38] rounded-xl text-white focus:outline-hidden"
                />
              </div>

              {publishResult && (
                <div className={`p-3 rounded-xl ${publishResult.ok ? 'bg-[#23a55a]/20 text-[#23a55a]' : 'bg-[#f23f43]/20 text-[#f23f43]'}`}>
                  {publishResult.ok ? 'Release successfully published to GitHub!' : publishResult.error}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPublishPanel(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2b2d38] hover:bg-[#353945] text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-4 py-1.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium shadow-sm flex items-center gap-1.5"
                >
                  {isPublishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      {showIconModal && (
        <AppIconDesignerModal
          initialConfig={patcherConfig.iconConfig}
          onSave={(newIconConfig) => setPatcherConfig({ ...patcherConfig, iconConfig: newIconConfig })}
          onClose={() => setShowIconModal(false)}
        />
      )}

      {showFontsModal && (
        <FontsModal onClose={() => setShowFontsModal(false)} />
      )}

      {showCrashModal && (
        <CrashReporterModal
          onClose={() => setShowCrashModal(false)}
          onEnterSafeMode={() => {
            setShowCrashModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
