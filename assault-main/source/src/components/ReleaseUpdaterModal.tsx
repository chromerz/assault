import React, { useState, useEffect } from 'react';
import { Upload, RefreshCw, CheckCircle, AlertTriangle, X, GitBranch, FileCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReleaseUpdaterModal({ isOpen, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<'upload' | 'github'>('upload');
  const [managerFile, setManagerFile] = useState<File | null>(null);
  const [loaderFile, setLoaderFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  // GitHub Sync form state
  const [repoName, setRepoName] = useState('hypercharacterization/assault');
  const [tag, setTag] = useState('v2.11.2');
  const [token, setToken] = useState('');

  const [adminKey, setAdminKey] = useState('');
  useEffect(() => { if (!isOpen) { setToken(''); setAdminKey(''); } }, [isOpen]);
  if (!isOpen) return null;

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadFiles(e: React.FormEvent) {
    e.preventDefault();
    if (!managerFile && !loaderFile) {
      setStatusMsg({ text: 'Please select at least one APK file (Manager or Loader).', type: 'error' });
      return;
    }

    setUploading(true);
    setStatusMsg({ text: 'Encoding and publishing APK packages...', type: 'info' });

    try {
      if ([managerFile, loaderFile].some(file => file && file.size > 32 * 1024 * 1024)) throw new Error('Each APK must be at most 32 MiB.');
      const payload: Record<string, string> = {};
      if (managerFile) {
        payload.managerBase64 = await fileToBase64(managerFile);
      }
      if (loaderFile) {
        payload.loaderBase64 = await fileToBase64(loaderFile);
      }

      const res = await fetch('/api/releases/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminKey}` },
        signal: AbortSignal.timeout(240000),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({ error: `Release request failed (HTTP ${res.status})` }));
      if (!res.ok) throw new Error(data.error || 'Failed to publish release');

      setStatusMsg({ text: 'Release APKs successfully updated and published!', type: 'success' });
      onSuccess();
    } catch (err) {
      setStatusMsg({ text: (err as Error).message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSyncGithub(e: React.FormEvent) {
    e.preventDefault();
    if (!repoName.trim()) {
      setStatusMsg({ text: 'Repository name is required.', type: 'error' });
      return;
    }

    setUploading(true);
    setStatusMsg({ text: `Connecting to GitHub release ${tag} on ${repoName}...`, type: 'info' });

    try {
      const res = await fetch('/api/releases/sync-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminKey}` },
        signal: AbortSignal.timeout(240000),
        body: JSON.stringify({
          repo: repoName.trim(),
          tag: tag.trim(),
          token: token.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({ error: `Release request failed (HTTP ${res.status})` }));
      if (!res.ok) throw new Error(data.error || 'Failed to sync GitHub release');

      setStatusMsg({ text: 'Successfully pulled and published release assets from GitHub!', type: 'success' });
      onSuccess();
    } catch (err) {
      setStatusMsg({ text: (err as Error).message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
      backdropFilter: 'blur(4px)',
    }} onClick={() => { if (!uploading) onClose(); }}>
      <div style={{
        background: '#1a1622',
        border: '1px solid #3d3644',
        borderRadius: 12,
        maxWidth: 520,
        width: '100%',
        padding: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        color: '#eee',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={20} color="#ff7784" /> Update Release APKs
          </h3>
          <button
            type="button"
            onClick={() => { if (!uploading) onClose(); }}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 20 }}
          >
            <X size={20} />
          </button>
        </div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          Portal administrator key
          <input aria-label="Portal administrator key" type="password" autoComplete="off" value={adminKey} onChange={e => setAdminKey(e.target.value)} disabled={uploading} style={{ width: '100%' }} />
        </label>
        <p style={{ fontSize: 12 }}>Publication verifies APK signatures, matching versions and the embedded loader. Administrator access is required.</p>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #29242e', paddingBottom: 10 }}>
          <button
            type="button"
            style={{
              flex: 1,
              background: tab === 'upload' ? '#29242e' : 'transparent',
              border: tab === 'upload' ? '1px solid #ff7784' : '1px solid transparent',
              color: tab === 'upload' ? '#ff7784' : '#aaa',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            disabled={uploading}
            onClick={() => { setTab('upload'); setStatusMsg(null); }}
          >
            <FileCode size={16} /> Upload Local APK Files
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              background: tab === 'github' ? '#29242e' : 'transparent',
              border: tab === 'github' ? '1px solid #ff7784' : '1px solid transparent',
              color: tab === 'github' ? '#ff7784' : '#aaa',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            disabled={uploading}
            onClick={() => { setTab('github'); setStatusMsg(null); }}
          >
            <GitBranch size={16} /> Sync from GitHub Release
          </button>
        </div>

        {/* Tab 1: Upload */}
        {tab === 'upload' && (
          <form onSubmit={handleUploadFiles} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>
              Select the exact <strong>Assault-Manager.apk</strong> (e.g. 5.98 MB) and/or <strong>Assault-Loader.apk</strong> (204 KB) from your device to publish them directly to this portal.
            </p>

            <div style={{ background: '#231e2b', padding: 12, borderRadius: 8, border: '1px solid #332b3b' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#ddd' }}>
                Assault-Manager.apk
              </label>
              <input
                type="file"
                accept=".apk"
                onChange={e => setManagerFile(e.target.files?.[0] || null)}
                style={{ fontSize: 12, color: '#aaa' }}
                disabled={uploading}
              />
              {managerFile && (
                <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>
                  ✓ {managerFile.name} ({(managerFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div style={{ background: '#231e2b', padding: 12, borderRadius: 8, border: '1px solid #332b3b' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#ddd' }}>
                Assault-Loader.apk (Optional if unchanged)
              </label>
              <input
                type="file"
                accept=".apk"
                onChange={e => setLoaderFile(e.target.files?.[0] || null)}
                style={{ fontSize: 12, color: '#aaa' }}
                disabled={uploading}
              />
              {loaderFile && (
                <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>
                  ✓ {loaderFile.name} ({(loaderFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !adminKey || (!managerFile && !loaderFile)}
              style={{
                background: '#ff7784',
                color: '#1a0d11',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: uploading || (!managerFile && !loaderFile) ? 0.6 : 1,
              }}
            >
              {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'Publishing...' : 'Push to Releases'}
            </button>
          </form>
        )}

        {/* Tab 2: GitHub Sync */}
        {tab === 'github' && (
          <form onSubmit={handleSyncGithub} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>
              Pull official release binaries directly from your GitHub repository release.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#ddd' }}>
                GitHub Repository (owner/repo)
              </label>
              <input
                type="text"
                value={repoName}
                onChange={e => setRepoName(e.target.value)}
                placeholder="e.g. derekgrondinheon/assault"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#231e2b',
                  border: '1px solid #3d3644',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: 13,
                }}
                disabled={uploading}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#ddd' }}>
                  Release Tag
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={e => setTag(e.target.value)}
                  placeholder="v2.11.1"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#231e2b',
                    border: '1px solid #3d3644',
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: 13,
                  }}
                  disabled={uploading}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#ddd' }}>
                  GitHub Token (for private repo)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="ghp_... (optional)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#231e2b',
                    border: '1px solid #3d3644',
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: 13,
                  }}
                  disabled={uploading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !adminKey}
              style={{
                background: '#ff7784',
                color: '#1a0d11',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? <RefreshCw size={16} className="animate-spin" /> : <GitBranch size={16} />}
              {uploading ? 'Fetching...' : 'Sync and Pull Assets'}
            </button>
          </form>
        )}

        {/* Status Message */}
        {statusMsg && (
          <div style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 6,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : statusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            border: `1px solid ${statusMsg.type === 'error' ? '#ef4444' : statusMsg.type === 'success' ? '#22c55e' : '#3b82f6'}`,
            color: statusMsg.type === 'error' ? '#fca5a5' : statusMsg.type === 'success' ? '#86efac' : '#93c5fd',
          }}>
            {statusMsg.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
