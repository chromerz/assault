import { useEffect, useState } from 'react';
import { ArrowDownToLine, Check, Copy, Layers, RefreshCw, ShieldCheck, Smartphone, Upload, Shield, Users } from 'lucide-react';
import { PhoneEmulator } from './components/PhoneEmulator';
import { ReleaseUpdaterModal } from './components/ReleaseUpdaterModal';
import { SelfDefenseAutomationHub } from './components/SelfDefenseAutomationHub';
import { FleetOrchestrationHub } from './components/FleetOrchestrationHub';
import './portal.css';
import './manager.css';

type Artifact = { url: string; size: number; sha256: string };
type Release = { version: string; manager: Artifact; loader: Artifact };
const size = (bytes: number) => `${(bytes / 1048576).toFixed(2)} MiB`;

export default function App() {
  const [release, setRelease] = useState<Release | null>(null);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('Checking release availability…');
  const [verification, setVerification] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [copyFailedSha, setCopyFailedSha] = useState<string | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  async function copyChecksum(sha: string) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(sha);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = sha;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!success) throw new Error('Copy failed');
      }
      setCopyFailedSha(null);
      setCopiedSha(sha);
      setTimeout(() => setCopiedSha(prev => (prev === sha ? null : prev)), 2000);
    } catch {
      setCopiedSha(null);
      setCopyFailedSha(sha);
      setTimeout(() => setCopyFailedSha(prev => (prev === sha ? null : prev)), 2000);
    }
  }
  async function check() {
    setChecking(true);
    setVerification('');
    try {
      const response = await fetch('/api/releases', { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.version || !data?.manager || !data?.loader) throw new Error(typeof data?.error === 'string' ? data.error : 'Release unavailable');
      setRelease(data);
      setMessage('Manager and embedded loader are ready to download.');
    } catch (error) {
      setRelease(null);
      setMessage(error instanceof Error ? error.message : 'Unable to check the release.');
    } finally { setChecking(false); }
  }
  useEffect(() => { void check(); }, []);
  async function verify(file: File) {
    if (!release) return;
    setVerifying(true);
    setVerification('Checking your APK…');
    try {
      if (file.size !== release.manager.size && file.size !== release.loader.size) {
        throw new Error('This file does not match either release APK size.');
      }
      if (!globalThis.crypto?.subtle) throw new Error('APK verification requires HTTPS or localhost. Open this page using a secure connection.');
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), b => b.toString(16).padStart(2, '0')).join('');
      const match = hash === release.manager.sha256 ? 'Manager' : hash === release.loader.sha256 ? 'Loader' : null;
      setVerification(match ? `${match} APK matches this release’s SHA-256. Android verifies its signing certificate during installation.` : 'Checksum mismatch. Do not install this file as this release.');
    } catch (error) { setVerification(error instanceof Error ? error.message : 'Verification unavailable in this browser.'); }
    finally { setVerifying(false); }
  }
  return <div className="portal">
    <header><a className="brand" href="#"><img src="/assault.svg" alt=""/> ASSAULT <span>ANDROID</span></a><a href="https://github.com/hypercharacterization/assault">Source ↗</a></header>
    <main>
      <section className="hero">
        <div className="eyebrow"><span/> ONE MANAGER. EVERYTHING INCLUDED.</div>
        <h1>Your client.<br/><em>Your control.</em></h1>
        <p className="intro">Prepare, update and install your native Assault client. The loader comes inside Manager, ready to merge into the client on your phone.</p>
        <div className="actions">{release && !checking ? <a className="primary" href={release.manager.url} download><ArrowDownToLine size={20}/> Download Manager <span>{size(release.manager.size)}</span></a> : <button className="primary" disabled>{checking ? 'Checking release…' : 'Build unavailable'}</button>}<a href="#install">Installation guide ↓</a><a href="#simulator">Client simulator ↓</a><a href="#automation-hub">Automation Hub ↓</a><a href="#fleet-hub">Fleet & Quests ↓</a></div>
        <p className="requirements">Android 9 or later · Native Android app · No separate loader install</p>
        <div className="release-status"><ShieldCheck size={19}/><div><strong style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>{release ? `Release ${release.version}` : 'Release status'}{release ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: '#4ade80' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>Healthy <span style={{ color: '#ff7784', display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '4px' }}><ArrowDownToLine size={13}/> Download Available</span></span> : checking ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: '#facc15' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', display: 'inline-block' }}/>Checking…</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: '#f87171' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}/>Unavailable</span>}</strong><p role="status">{message}</p></div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><button type="button" onClick={() => setShowReleaseModal(true)} style={{ background: '#29242e', border: '1px solid #ff7784', color: '#ff7784', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Upload size={14}/> Push/Sync APKs</button><button aria-label="Refresh release" onClick={check} disabled={checking || verifying}><RefreshCw size={18}/></button></div></div>
      </section>
      <section className="features" aria-label="Included in Manager">
        <article><Layers/><h2>Loader included</h2><p>Manager embeds the matching loader, runtime, plugins and theme support. It verifies the module before preparing your client.</p></article>
        <article><ShieldCheck/><h2>Verified preparation</h2><p>Official client splits are checked before patching. Prepared files are checked again before Android installation.</p></article>
        <article><Smartphone/><h2>You confirm installs</h2><p>Prepare updates in Manager and confirm through Android. Scheduled checks can use Wi-Fi and charging constraints.</p></article>
      </section>

      {/* COMBAT AUTOMATION & SELF-DEFENSE HUB */}
      <SelfDefenseAutomationHub onLog={(msg, lvl, tag) => console.log(`[${tag || 'AUTO'}] ${msg}`)} />

      {/* MULTI-ACCOUNT FLEET ORCHESTRATION & QUEST ENGINE */}
      <FleetOrchestrationHub onLog={(msg, lvl, tag) => console.log(`[${tag || 'FLEET'}] ${msg}`)} />

      <section id="install" className="installation"><div><div className="eyebrow">FROM DOWNLOAD TO CLIENT</div><h2>Three steps.<br/>One native app.</h2><p>This page distributes the Android app. Preparation and client controls run on your phone.</p></div><ol>
        <li><strong>Install Assault Manager</strong><p>Download the Manager APK above and open it on your Android device.</p></li>
        <li><strong>Download & prepare client</strong><p>Manager fetches the official splits and merges its embedded loader. Wait for “Ready to install.”</p></li>
        <li><strong>Install and open Assault</strong><p>Allow installs from Manager, confirm Android’s prompt, then sign in through the native client.</p></li>
      </ol></section>
      <aside className="notice"><strong>Keep your signing identity</strong><p>An official Discord install has a different signer. Prepare Assault before manually removing Discord; uninstalling deletes its local data. Keep Manager installed and preserve its app data to retain your client signing key for future updates.</p></aside>
      <section id="simulator" className="installation" style={{ display: 'block', borderTop: '1px solid #29242e', paddingTop: '40px', paddingBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div className="eyebrow">INTERACTIVE DISCORD CLIENT & SETTINGS</div>
          <h2>Client Simulator & Automod Shield</h2>
          <p>Test the client simulator, explore in-app Discord settings (tap the AS badge), and configure Automod rules for this browser preview. Browser settings are separate from the Android app.</p>
        </div>
        <PhoneEmulator currentSystemTheme="dark" onLog={(msg, lvl, tag) => console.log(`[${tag || 'ASSAULT'}] ${msg}`)} />
      </section>
      {release && <section className="downloads"><div className="eyebrow">RELEASE INTEGRITY</div><h2>Check your download.</h2><p>Select an APK to compare its SHA-256 locally. The file stays in your browser.</p><label className="file-label">Select downloaded APK<input type="file" accept=".apk" disabled={verifying || checking} onChange={e => { const file = e.target.files?.[0]; if (file) void verify(file); e.target.value = ''; }}/></label><p role="status">{verification}</p>
        <div className="artifact"><Check size={18}/><div><strong>Manager {release.version} · {size(release.manager.size)}</strong><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}><code style={{ margin: 0 }}>{release.manager.sha256}</code><button type="button" aria-label="Copy Manager SHA-256 to clipboard" onClick={() => copyChecksum(release.manager.sha256)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#29242e', border: '1px solid #3d3644', borderRadius: '6px', color: '#eee', padding: '4px 10px', fontSize: '12px' }}>{copiedSha === release.manager.sha256 ? <><Check size={12}/> Copied</> : copyFailedSha === release.manager.sha256 ? 'Copy failed' : <><Copy size={12}/> Copy to Clipboard</>}</button></div></div></div>
        <details><summary>Standalone loader for advanced use</summary><p>The loader is already inside Manager. This APK has no launcher and is not a standalone client.</p><a href={release.loader.url} download>Download Loader · {size(release.loader.size)}</a><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}><code style={{ margin: 0 }}>{release.loader.sha256}</code><button type="button" aria-label="Copy Loader SHA-256 to clipboard" onClick={() => copyChecksum(release.loader.sha256)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#29242e', border: '1px solid #3d3644', borderRadius: '6px', color: '#eee', padding: '4px 10px', fontSize: '12px' }}>{copiedSha === release.loader.sha256 ? <><Check size={12}/> Copied</> : copyFailedSha === release.loader.sha256 ? 'Copy failed' : <><Copy size={12}/> Copy to Clipboard</>}</button></div></details>
      </section>}
    </main><footer><span>ASSAULT / INDEPENDENT BY DESIGN</span><a href="https://github.com/hypercharacterization/assault/blob/main/android/THIRD_PARTY.md">Licenses & source ↗</a></footer>
    <ReleaseUpdaterModal isOpen={showReleaseModal} onClose={() => setShowReleaseModal(false)} onSuccess={check} />
  </div>;
}
