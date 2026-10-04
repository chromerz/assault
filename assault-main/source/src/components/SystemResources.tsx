import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Cpu,
  HardDrive,
  RefreshCw,
  Zap,
  Pause,
  Play,
  Activity,
  Sparkles,
  AlertCircle,
  Bell,
  BellRing,
  Sliders,
  X,
  AlertTriangle,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
  RotateCcw,
  Trash2,
  Skull,
} from 'lucide-react';

interface MetricPoint {
  timestamp: number;
  cpu: number; // percentage (0-100)
  ram: number; // MB used
  threads: number;
  gcEvent?: boolean;
}

interface DesktopNotification {
  id: string;
  timeStr: string;
  metricType: 'cpu' | 'ram';
  currentVal: number;
  thresholdVal: number;
  unit: string;
  title: string;
  message: string;
}

interface SystemResourcesProps {
  onLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', tag?: string) => void;
}

export function SystemResources({ onLog }: SystemResourcesProps) {
  const [data, setData] = useState<MetricPoint[]>(() => {
    const now = Date.now();
    const points: MetricPoint[] = [];
    let ram = 184;
    for (let i = 24; i >= 0; i--) {
      const time = now - i * 1500;
      const cpu = 4.5 + Math.sin(i * 0.4) * 2.2 + Math.random() * 2.5;
      ram = Math.min(260, Math.max(160, ram + (Math.random() * 6 - 2.8)));
      points.push({
        timestamp: time,
        cpu: Number(cpu.toFixed(1)),
        ram: Number(ram.toFixed(1)),
        threads: 24 + Math.floor(Math.random() * 4),
      });
    }
    return points;
  });

  const [activeSeries, setActiveSeries] = useState<'both' | 'cpu' | 'ram'>('both');
  const [refreshInterval, setRefreshInterval] = useState<number>(1500); // ms
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<MetricPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isStressTesting, setIsStressTesting] = useState(false);

  // Peak Usage & Maintenance States
  const RAM_BUDGET_MB = 512;
  const [peakCpu, setPeakCpu] = useState<number>(() => {
    const maxCpu = data.reduce((max, p) => Math.max(max, p.cpu), 0);
    return maxCpu > 0 ? maxCpu : 6.2;
  });
  const [peakRam, setPeakRam] = useState<number>(() => {
    const maxRam = data.reduce((max, p) => Math.max(max, p.ram), 0);
    return maxRam > 0 ? maxRam : 188;
  });

  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
  const [isKillingProcess, setIsKillingProcess] = useState<boolean>(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState<boolean>(false);

  // Threshold & Notification Alert States
  const [cpuThreshold, setCpuThreshold] = useState<number>(18); // %
  const [ramThreshold, setRamThreshold] = useState<number>(240); // MB
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showThresholdConfig, setShowThresholdConfig] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<DesktopNotification[]>([]);
  const [osPermission, setOsPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const lastAlertTimeRef = useRef<{ cpu: number; ram: number }>({ cpu: 0, ram: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Synthesized audio chime for desktop alerts
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback restricted or disabled
    }
  };

  // Dispatches desktop-style notification alert
  const dispatchAlert = (
    metricType: 'cpu' | 'ram',
    currentVal: number,
    thresholdVal: number,
    unit: string,
    title: string,
    message: string
  ) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timeStr = new Date().toTimeString().split(' ')[0];

    const notif: DesktopNotification = {
      id,
      timeStr,
      metricType,
      currentVal,
      thresholdVal,
      unit,
      title,
      message,
    };

    setNotifications(prev => [notif, ...prev.slice(0, 2)]);
    playAlertSound();

    // Trigger Native OS Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`[Assault Alert] ${title}`, {
          body: `${message} (${currentVal}${unit} > ${thresholdVal}${unit})`,
          icon: '/assault.svg',
        });
      } catch {
        // Notification permission fallback
      }
    }

    onLog?.(
      `⚠️ [RESOURCE THRESHOLD EXCEEDED] ${title}: ${currentVal}${unit} breached user threshold of ${thresholdVal}${unit}`,
      'warning',
      'MONITOR'
    );

    // Auto-dismiss notification after 7 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 7000);
  };

  // Manual test alert trigger
  const handleTestAlert = () => {
    dispatchAlert(
      'cpu',
      24.6,
      cpuThreshold,
      '%',
      'High CPU Spike Detected',
      `Discord client CPU utilization spiked to 24.6%, exceeding your ${cpuThreshold}% threshold.`
    );
  };

  // Request browser OS notification permission
  const handleRequestOsPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setOsPermission(res);
        if (res === 'granted') {
          onLog?.('Browser OS notification permission granted for Assault threshold alerts', 'success', 'SECURITY');
        }
      } catch {
        // permission request error
      }
    }
  };

  // Real-time telemetry generator & threshold monitor
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        let cpuTarget = 5.2 + Math.random() * 3.8;
        let ramDelta = Math.random() * 5.2 - 2.1;

        if (isStressTesting) {
          cpuTarget = 24.5 + Math.random() * 8.6;
          ramDelta = Math.random() * 12 + 4;
        }

        const nextCpu = Math.max(1.8, Math.min(95, last.cpu * 0.4 + cpuTarget * 0.6));
        const nextRam = Math.max(140, Math.min(420, last.ram + ramDelta));
        const threads = 24 + (isStressTesting ? 14 : Math.floor(Math.random() * 4));

        const nextPoint: MetricPoint = {
          timestamp: Date.now(),
          cpu: Number(nextCpu.toFixed(1)),
          ram: Number(nextRam.toFixed(1)),
          threads,
        };

        setPeakCpu(prev => Math.max(prev, nextPoint.cpu));
        setPeakRam(prev => Math.max(prev, nextPoint.ram));

        // Real-time Threshold Verification & Alert Triggering
        if (alertsEnabled) {
          const now = Date.now();
          if (nextPoint.cpu >= cpuThreshold && now - lastAlertTimeRef.current.cpu > 7000) {
            lastAlertTimeRef.current.cpu = now;
            dispatchAlert(
              'cpu',
              nextPoint.cpu,
              cpuThreshold,
              '%',
              'High CPU Threshold Exceeded',
              `Discord client CPU utilization reached ${nextPoint.cpu}%, crossing your ${cpuThreshold}% limit.`
            );
          }
          if (nextPoint.ram >= ramThreshold && now - lastAlertTimeRef.current.ram > 7000) {
            lastAlertTimeRef.current.ram = now;
            dispatchAlert(
              'ram',
              nextPoint.ram,
              ramThreshold,
              'MB',
              'RAM Allocation Limit Exceeded',
              `Discord client resident memory reached ${nextPoint.ram} MB, crossing your ${ramThreshold} MB limit.`
            );
          }
        }

        return [...prev.slice(1), nextPoint];
      });
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [isPaused, refreshInterval, isStressTesting, alertsEnabled, cpuThreshold, ramThreshold]);

  const latest = data[data.length - 1] || { cpu: 6.2, ram: 188, threads: 24, timestamp: Date.now() };
  const isCpuBreached = latest.cpu >= cpuThreshold;
  const isRamBreached = latest.ram >= ramThreshold;

  // D3 calculations for responsive SVG line chart
  const width = 640;
  const height = 210;
  const margin = { top: 20, right: 54, bottom: 26, left: 42 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { xScale, yCpuScale, yRamScale, cpuPath, ramPath, cpuAreaPath, ramAreaPath } = useMemo(() => {
    if (!data.length) {
      return {
        xScale: null,
        yCpuScale: null,
        yRamScale: null,
        cpuPath: '',
        ramPath: '',
        cpuAreaPath: '',
        ramAreaPath: '',
      };
    }

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, innerWidth]);

    const maxCpu = Math.max(30, (d3.max(data, d => d.cpu) || 20) * 1.25, cpuThreshold * 1.2);
    const yCpuScale = d3
      .scaleLinear()
      .domain([0, maxCpu])
      .range([innerHeight, 0])
      .nice();

    const maxRam = Math.max(320, (d3.max(data, d => d.ram) || 240) * 1.15, ramThreshold * 1.15);
    const yRamScale = d3
      .scaleLinear()
      .domain([100, maxRam])
      .range([innerHeight, 0])
      .nice();

    const cpuLineGen = d3
      .line<MetricPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yCpuScale(d.cpu))
      .curve(d3.curveMonotoneX);

    const ramLineGen = d3
      .line<MetricPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yRamScale(d.ram))
      .curve(d3.curveMonotoneX);

    const cpuAreaGen = d3
      .area<MetricPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y0(innerHeight)
      .y1(d => yCpuScale(d.cpu))
      .curve(d3.curveMonotoneX);

    const ramAreaGen = d3
      .area<MetricPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y0(innerHeight)
      .y1(d => yRamScale(d.ram))
      .curve(d3.curveMonotoneX);

    return {
      xScale,
      yCpuScale,
      yRamScale,
      cpuPath: cpuLineGen(data) || '',
      ramPath: ramLineGen(data) || '',
      cpuAreaPath: cpuAreaGen(data) || '',
      ramAreaPath: ramAreaGen(data) || '',
    };
  }, [data, innerWidth, innerHeight, cpuThreshold, ramThreshold]);

  // Handle chart hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !xScale || !data.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const chartX = clientX * (width / rect.width) - margin.left;

    if (chartX < 0 || chartX > innerWidth) {
      setHoveredPoint(null);
      setHoverPos(null);
      return;
    }

    const hoverDate = xScale.invert(chartX);
    const bisect = d3.bisector<MetricPoint, Date>(d => new Date(d.timestamp)).center;
    const index = bisect(data, hoverDate);
    const point = data[Math.max(0, Math.min(data.length - 1, index))];
    if (point) {
      const svgPointX = xScale(new Date(point.timestamp)) + margin.left;
      const percentX = (svgPointX / width) * 100;
      const clientY = Math.max(10, Math.min(rect.height - 110, e.clientY - rect.top));
      setHoveredPoint(point);
      setHoverPos({
        x: percentX,
        y: clientY,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPos(null);
  };

  // Actions
  const triggerTrimMemory = () => {
    if (isTrimming) return;
    setIsTrimming(true);
    const reclaimed = (28 + Math.random() * 22).toFixed(1);
    const pauseMs = (0.9 + Math.random() * 0.7).toFixed(1);

    setData(prev => {
      const last = prev[prev.length - 1];
      const trimmedRam = Math.max(145, last.ram - parseFloat(reclaimed));
      return [
        ...prev.slice(1),
        {
          timestamp: Date.now(),
          cpu: Math.max(2.1, last.cpu * 0.8),
          ram: Number(trimmedRam.toFixed(1)),
          threads: last.threads,
          gcEvent: true,
        },
      ];
    });

    onLog?.(`Hermes GC complete: Reclaimed ${reclaimed} MB in ${pauseMs}ms pause`, 'success', 'MEMORY');
    setTimeout(() => setIsTrimming(false), 800);
  };

  const toggleStressTest = () => {
    if (isStressTesting) {
      setIsStressTesting(false);
      onLog?.('Stress test finished: Traffic throttle restored to normal', 'info', 'STRESS');
    } else {
      setIsStressTesting(true);
      onLog?.('Stress test active: Ingesting simulated 120 msgs/sec flood to test thresholds', 'warning', 'STRESS');
      setTimeout(() => {
        setIsStressTesting(false);
        onLog?.('Stress test auto-concluded: Client memory and CPU stabilized', 'success', 'STRESS');
      }, 7000);
    }
  };

  const applyPreset = (cpu: number, ram: number) => {
    setCpuThreshold(cpu);
    setRamThreshold(ram);
    onLog?.(`Alert thresholds updated: CPU > ${cpu}%, RAM > ${ram} MB`, 'info', 'CONFIG');
  };

  // Peak usage reset handler
  const handleResetPeak = () => {
    const curPoint = data[data.length - 1];
    const curCpu = curPoint ? curPoint.cpu : 0;
    const curRam = curPoint ? curPoint.ram : 0;
    setPeakCpu(curCpu);
    setPeakRam(curRam);
    const curRamPct = ((curRam / RAM_BUDGET_MB) * 100).toFixed(1);
    onLog?.(
      `Peak usage metrics reset: Baseline cleared to current CPU ${curCpu}% / RAM ${curRamPct}% (${curRam} MB)`,
      'info',
      'MONITOR'
    );
  };

  // Quick Action 1: Clear Cache
  const handleClearCache = () => {
    if (isClearingCache) return;
    setIsClearingCache(true);
    onLog?.('Maintenance task: Clear Cache initiated — Purging Assault dex cache, asset buffers, and webview data…', 'info', 'MAINTENANCE');

    setTimeout(() => {
      const reclaimed = Number((28 + Math.random() * 18).toFixed(1));
      setData(prev => {
        const last = prev[prev.length - 1];
        const newRam = Math.max(135, Number((last.ram - reclaimed).toFixed(1)));
        const newCpu = Math.max(1.8, Number((last.cpu * 0.85).toFixed(1)));
        return [
          ...prev.slice(1),
          {
            timestamp: Date.now(),
            cpu: newCpu,
            ram: newRam,
            threads: last.threads,
            gcEvent: true,
          },
        ];
      });
      setIsClearingCache(false);
      onLog?.(`Clear Cache complete: Successfully released ${reclaimed} MB temporary buffers and pruned Hermes bytecode cache`, 'success', 'MAINTENANCE');
    }, 600);
  };

  // Quick Action 2: Kill Client Process
  const handleKillClientProcess = () => {
    if (isKillingProcess) return;
    setIsKillingProcess(true);
    onLog?.('Maintenance task: Kill Client Process — Sending SIGKILL (PID 18492, Discord Native Client)', 'warning', 'PROCESS');

    // Immediate drop simulating terminated process
    setData(prev => {
      return [
        ...prev.slice(1),
        {
          timestamp: Date.now(),
          cpu: 0.1,
          ram: 94.2,
          threads: 0,
          gcEvent: true,
        },
      ];
    });

    setTimeout(() => {
      const respawnCpu = Number((4.6 + Math.random() * 1.6).toFixed(1));
      const respawnRam = Number((162 + Math.random() * 14).toFixed(1));
      setData(prev => [
        ...prev.slice(1),
        {
          timestamp: Date.now(),
          cpu: respawnCpu,
          ram: respawnRam,
          threads: 24,
        },
      ]);
      setPeakCpu(p => Math.max(p, respawnCpu));
      setPeakRam(p => Math.max(p, respawnRam));
      setIsKillingProcess(false);
      onLog?.('Discord client process respawned cleanly with fresh ART heap (PID 19104, 24 worker threads active)', 'success', 'PROCESS');
    }, 1100);
  };

  // Quick Action 3: Refresh Stats
  const handleRefreshStats = () => {
    if (isRefreshingStats) return;
    setIsRefreshingStats(true);
    onLog?.('Maintenance task: Refresh Stats — Polling ART runtime, thread schedulers, and procfs memory stats', 'info', 'TELEMETRY');

    setTimeout(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const freshCpu = Number((4.8 + Math.random() * 2.6).toFixed(1));
        const freshRam = Number(Math.max(145, Math.min(360, last.ram + (Math.random() * 4 - 2))).toFixed(1));
        const freshThreads = 24 + Math.floor(Math.random() * 3);
        const point: MetricPoint = {
          timestamp: Date.now(),
          cpu: freshCpu,
          ram: freshRam,
          threads: freshThreads,
        };
        setPeakCpu(p => Math.max(p, freshCpu));
        setPeakRam(p => Math.max(p, freshRam));
        return [...prev.slice(1), point];
      });
      setIsRefreshingStats(false);
      onLog?.('Stats refreshed: Hardware diagnostics and client telemetry re-synchronized', 'success', 'TELEMETRY');
    }, 400);
  };

  return (
    <section className="sys-resources-card" id="resources" role="region" aria-label="System Resources Monitor">
      {/* FLOATING DESKTOP-STYLE NOTIFICATION ALERTS */}
      {notifications.length > 0 && (
        <div className="desktop-alert-container" aria-live="assertive" role="alert">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`desktop-alert-toast ${n.metricType === 'cpu' ? 'toast-cpu' : 'toast-ram'}`}
            >
              <div className="toast-header">
                <div className="toast-brand">
                  <img src="/assault.svg" alt="AS" className="toast-logo" />
                  <strong>ASSAULT SYSTEM MONITOR</strong>
                </div>
                <div className="toast-meta">
                  <span className="toast-time">{n.timeStr}</span>
                  <button
                    type="button"
                    className="toast-close-btn"
                    onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                    aria-label="Dismiss notification"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="toast-body">
                <div className="toast-icon">
                  <AlertTriangle size={18} />
                </div>
                <div className="toast-content">
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <div className="toast-metric-compare">
                    <span>
                      Current: <strong>{n.currentVal}{n.unit}</strong>
                    </span>
                    <span className="compare-arrow">›</span>
                    <span>
                      Threshold: <strong>{n.thresholdVal}{n.unit}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="toast-actions">
                {n.metricType === 'ram' && (
                  <button
                    type="button"
                    className="toast-btn primary"
                    onClick={() => {
                      triggerTrimMemory();
                      setNotifications(prev => prev.filter(item => item.id !== n.id));
                    }}
                  >
                    <RefreshCw size={11} />
                    Trim RAM Now
                  </button>
                )}
                <button
                  type="button"
                  className="toast-btn"
                  onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="sys-header">
        <div className="sys-title-group">
          <div className="sys-icon-badge">
            <Activity size={18} className={!isPaused ? 'pulse-icon' : ''} />
          </div>
          <div>
            <div className="sys-eyebrow">DIAGNOSTICS & TELEMETRY</div>
            <h3>Discord Client System Resources</h3>
          </div>
        </div>

        <div className="sys-header-controls">
          <button
            type="button"
            className={`sys-threshold-toggle ${alertsEnabled ? 'active' : ''} ${showThresholdConfig ? 'open' : ''}`}
            onClick={() => setShowThresholdConfig(!showThresholdConfig)}
            title="Configure CPU/RAM usage thresholds and alerts"
            aria-expanded={showThresholdConfig}
          >
            {alertsEnabled ? <BellRing size={13} className="alert-bell-ring" /> : <Bell size={13} />}
            <span>Threshold Alerts: {alertsEnabled ? 'ON' : 'OFF'}</span>
            <Sliders size={12} style={{ opacity: 0.7 }} />
          </button>

          <div className="sys-series-pills">
            <button
              type="button"
              className={`sys-pill ${activeSeries === 'both' ? 'active' : ''}`}
              onClick={() => setActiveSeries('both')}
            >
              All Metrics
            </button>
            <button
              type="button"
              className={`sys-pill cpu-pill ${activeSeries === 'cpu' ? 'active' : ''}`}
              onClick={() => setActiveSeries('cpu')}
            >
              <span className="dot-cpu" /> CPU
            </button>
            <button
              type="button"
              className={`sys-pill ram-pill ${activeSeries === 'ram' ? 'active' : ''}`}
              onClick={() => setActiveSeries('ram')}
            >
              <span className="dot-ram" /> RAM
            </button>
          </div>

          <div className="sys-rate-controls">
            <button
              type="button"
              className="sys-btn icon-only"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume stream' : 'Pause stream'}
              aria-label={isPaused ? 'Resume stream' : 'Pause stream'}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>

            <select
              className="sys-select"
              value={refreshInterval}
              onChange={e => setRefreshInterval(Number(e.target.value))}
              aria-label="Sampling rate"
            >
              <option value={1000}>1.0s (Fast)</option>
              <option value={1500}>1.5s (Norm)</option>
              <option value={3000}>3.0s (Eco)</option>
            </select>
          </div>
        </div>
      </div>

      {/* THRESHOLD CONFIGURATION DRAWER */}
      {showThresholdConfig && (
        <div className="sys-threshold-panel">
          <div className="threshold-panel-header">
            <div className="threshold-panel-title">
              <ShieldAlert size={16} />
              <h4>Custom Resource Alert Thresholds</h4>
            </div>
            <div className="threshold-panel-toggles">
              <button
                type="button"
                className={`threshold-switch-btn ${alertsEnabled ? 'enabled' : ''}`}
                onClick={() => {
                  setAlertsEnabled(!alertsEnabled);
                  onLog?.(
                    `Threshold alert notifications ${!alertsEnabled ? 'enabled' : 'disabled'}`,
                    'info',
                    'CONFIG'
                  );
                }}
              >
                {alertsEnabled ? <CheckCircle2 size={13} /> : <X size={13} />}
                <span>{alertsEnabled ? 'Alerts Enabled' : 'Alerts Disabled'}</span>
              </button>
              <button
                type="button"
                className="threshold-sound-btn"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
                aria-label={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>
          </div>

          <p className="threshold-panel-desc">
            Define custom performance limits for the Discord client. When active client usage crosses your thresholds, Assault dispatches immediate desktop notifications with instant diagnostics and quick memory trim actions.
          </p>

          <div className="threshold-controls-grid">
            {/* CPU Threshold */}
            <div className="threshold-control-card">
              <div className="threshold-control-top">
                <span className="threshold-label">
                  <span className="dot-cpu" /> CPU Alert Limit
                </span>
                <strong className="threshold-val-badge cpu">{cpuThreshold}%</strong>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={cpuThreshold}
                onChange={e => setCpuThreshold(Number(e.target.value))}
                className="threshold-slider cpu-slider"
                aria-label="CPU usage alert threshold percentage"
              />
              <div className="threshold-ticks">
                <span>5% (Strict)</span>
                <span>18% (Normal)</span>
                <span>60% (High)</span>
              </div>
            </div>

            {/* RAM Threshold */}
            <div className="threshold-control-card">
              <div className="threshold-control-top">
                <span className="threshold-label">
                  <span className="dot-ram" /> RAM Alert Limit
                </span>
                <strong className="threshold-val-badge ram">{ramThreshold} MB</strong>
              </div>
              <input
                type="range"
                min="160"
                max="380"
                step="5"
                value={ramThreshold}
                onChange={e => setRamThreshold(Number(e.target.value))}
                className="threshold-slider ram-slider"
                aria-label="RAM memory footprint alert threshold in megabytes"
              />
              <div className="threshold-ticks">
                <span>160 MB (Strict)</span>
                <span>240 MB (Normal)</span>
                <span>380 MB (Max)</span>
              </div>
            </div>
          </div>

          {/* PRESETS & TEST BAR */}
          <div className="threshold-footer-bar">
            <div className="threshold-presets">
              <span className="presets-label">Presets:</span>
              <button
                type="button"
                className={`preset-btn ${cpuThreshold === 12 && ramThreshold === 200 ? 'active' : ''}`}
                onClick={() => applyPreset(12, 200)}
              >
                Aggressive (12% / 200MB)
              </button>
              <button
                type="button"
                className={`preset-btn ${cpuThreshold === 18 && ramThreshold === 240 ? 'active' : ''}`}
                onClick={() => applyPreset(18, 240)}
              >
                Balanced (18% / 240MB)
              </button>
              <button
                type="button"
                className={`preset-btn ${cpuThreshold === 30 && ramThreshold === 320 ? 'active' : ''}`}
                onClick={() => applyPreset(30, 320)}
              >
                Relaxed (30% / 320MB)
              </button>
            </div>

            <div className="threshold-actions">
              {osPermission !== 'granted' && (
                <button
                  type="button"
                  className="threshold-test-btn"
                  onClick={handleRequestOsPermission}
                >
                  <Bell size={12} />
                  Enable Browser OS Notifications
                </button>
              )}
              <button
                type="button"
                className="threshold-test-btn highlight"
                onClick={handleTestAlert}
              >
                <AlertCircle size={12} />
                Test Desktop Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METRIC STATS ROW */}
      <div className="sys-metric-grid">
        <div className={`sys-metric-tile cpu-tile ${isCpuBreached ? 'breached' : latest.cpu > 18 ? 'warning' : ''}`}>
          <div className="sys-tile-top">
            <span className="sys-tile-label">
              <Cpu size={14} /> CPU USAGE
            </span>
            <span className={`sys-status-badge ${isCpuBreached ? 'alert-badge' : isStressTesting ? 'stress-badge' : ''}`}>
              {isCpuBreached ? `Threshold Exceeded (> ${cpuThreshold}%)` : isStressTesting ? 'Stress Active' : 'Nominal'}
            </span>
          </div>
          <div className="sys-tile-val">
            <strong>{latest.cpu}%</strong>
            <small>Limit: {cpuThreshold}%</small>
          </div>
          <div className="sys-tile-meta">
            <span>Hermes JS engine</span>
            <span>{latest.threads} threads active</span>
          </div>
        </div>

        <div className={`sys-metric-tile ram-tile ${isRamBreached ? 'breached' : ''}`}>
          <div className="sys-tile-top">
            <span className="sys-tile-label">
              <HardDrive size={14} /> MEMORY FOOTPRINT
            </span>
            <span className={`sys-status-badge ${isRamBreached ? 'alert-badge' : ''}`}>
              {isRamBreached ? `Threshold Exceeded (> ${ramThreshold}MB)` : 'Heap OK'}
            </span>
          </div>
          <div className="sys-tile-val">
            <strong>{latest.ram} MB</strong>
            <small>{((latest.ram / RAM_BUDGET_MB) * 100).toFixed(1)}% of 512MB</small>
          </div>
          <div className="sys-tile-meta">
            <span>Assault cache: 38.4 MB</span>
            <span>Limit: {ramThreshold} MB</span>
          </div>
        </div>

        {/* PEAK USAGE READOUT */}
        <div className="sys-metric-tile peak-tile" data-testid="peak-usage-readout">
          <div className="sys-tile-top">
            <span className="sys-tile-label">
              <TrendingUp size={14} /> PEAK USAGE
            </span>
            <button
              type="button"
              className="sys-reset-peak-btn"
              onClick={handleResetPeak}
              title="Reset peak usage metric"
              aria-label="Reset peak usage metric"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          </div>
          <div className="sys-tile-val peak-tile-val">
            <div className="peak-metric-col">
              <span className="peak-metric-sub">Peak CPU</span>
              <strong className="peak-cpu-txt">{peakCpu.toFixed(1)}%</strong>
            </div>
            <div className="peak-divider" />
            <div className="peak-metric-col">
              <span className="peak-metric-sub">Peak RAM</span>
              <strong className="peak-ram-txt">{((peakRam / RAM_BUDGET_MB) * 100).toFixed(1)}%</strong>
              <small className="peak-ram-mb">{peakRam.toFixed(1)} MB</small>
            </div>
          </div>
          <div className="sys-tile-meta">
            <span>Session high record</span>
            <span className="peak-status-tag">Live tracking</span>
          </div>
        </div>

        <div className="sys-metric-tile io-tile">
          <div className="sys-tile-top">
            <span className="sys-tile-label">
              <Zap size={14} /> RUNTIME DIAGNOSTICS
            </span>
            <span className="sys-status-badge green">Optimized</span>
          </div>
          <div className="sys-tile-val">
            <strong>1.2 ms</strong>
            <small>Avg Hook Latency</small>
          </div>
          <div className="sys-tile-meta">
            <span>Xposed v100 hooks</span>
            <span>Alerts: {alertsEnabled ? 'Armed' : 'Muted'}</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="sys-quick-actions-row" role="region" aria-label="System Quick Actions">
        <div className="quick-actions-header">
          <div className="quick-actions-badge">
            <Sliders size={13} />
            <span>QUICK ACTIONS</span>
          </div>
          <span className="quick-actions-sub">Client maintenance &amp; process controls</span>
        </div>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className={`quick-action-btn ${isClearingCache ? 'busy' : ''}`}
            onClick={handleClearCache}
            disabled={isClearingCache || isKillingProcess}
            title="Purge dex cache, asset buffers, and temp webview storage"
          >
            <Trash2 size={13} className={isClearingCache ? 'spinning' : ''} />
            <span>{isClearingCache ? 'Clearing Cache…' : 'Clear Cache'}</span>
          </button>

          <button
            type="button"
            className={`quick-action-btn danger ${isKillingProcess ? 'busy' : ''}`}
            onClick={handleKillClientProcess}
            disabled={isKillingProcess}
            title="Force kill Discord client process and restart cleanly"
          >
            <Skull size={13} className={isKillingProcess ? 'pulse-icon' : ''} />
            <span>{isKillingProcess ? 'Killing Process…' : 'Kill Client Process'}</span>
          </button>

          <button
            type="button"
            className={`quick-action-btn ${isRefreshingStats ? 'busy' : ''}`}
            onClick={handleRefreshStats}
            disabled={isRefreshingStats}
            title="Poll fresh ART runtime, CPU frequency, and memory stats immediately"
          >
            <RefreshCw size={13} className={isRefreshingStats ? 'spinning' : ''} />
            <span>{isRefreshingStats ? 'Refreshing…' : 'Refresh Stats'}</span>
          </button>
        </div>
      </div>

      {/* D3 LINE CHART CONTAINER */}
      <div className="sys-chart-box">
        <div className="sys-chart-legend">
          {(activeSeries === 'both' || activeSeries === 'cpu') && (
            <div className="legend-item">
              <span className="legend-line cpu-line" />
              <span>
                CPU: <strong>{latest.cpu}%</strong>
              </span>
              <span className="threshold-tag cpu-tag">Limit: {cpuThreshold}%</span>
            </div>
          )}
          {(activeSeries === 'both' || activeSeries === 'ram') && (
            <div className="legend-item">
              <span className="legend-line ram-line" />
              <span>
                RAM: <strong>{latest.ram} MB</strong>
              </span>
              <span className="threshold-tag ram-tag">Limit: {ramThreshold}MB</span>
            </div>
          )}
          <span className="legend-time-window">Window: 36 seconds</span>
        </div>

        {/* Real-time Hover Inspector Status Bar */}
        <div className="hover-inspector-banner" aria-live="polite">
          {hoveredPoint ? (
            <>
              <div className="hover-inspector-item">
                <span className="tiny-dot" style={{ background: '#38bdf8' }} />
                <span>Sample Time:</span>
                <strong>
                  {new Date(hoveredPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </strong>
                <span style={{ fontSize: 10, color: '#718096' }}>
                  ({Math.max(0, (Date.now() - hoveredPoint.timestamp) / 1000).toFixed(1)}s ago)
                </span>
              </div>
              <div className="hover-inspector-item cpu">
                <span>CPU:</span>
                <strong>{hoveredPoint.cpu}%</strong>
                {hoveredPoint.cpu >= cpuThreshold && <span className="threshold-breach-chip">BREACH</span>}
              </div>
              <div className="hover-inspector-item ram">
                <span>RAM:</span>
                <strong>{hoveredPoint.ram} MB</strong>
                {hoveredPoint.ram >= ramThreshold && <span className="threshold-breach-chip">BREACH</span>}
              </div>
              <div className="hover-inspector-item">
                <span>Threads:</span>
                <strong>{hoveredPoint.threads}</strong>
              </div>
              {hoveredPoint.gcEvent && (
                <div className="hover-inspector-item" style={{ color: '#34d399' }}>
                  <Sparkles size={12} />
                  <strong>Hermes GC</strong>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#7e91a4', fontSize: 11, width: '100%' }}>
              <span className="tiny-dot" style={{ background: '#34d399' }} />
              <span>Hover over any curve position to inspect exact timestamps, precise CPU %, and resident RAM megabytes.</span>
              <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
                Latest: ⚡ {latest.cpu}% · 💾 {latest.ram}MB
              </span>
            </div>
          )}
        </div>

        <div className="sys-svg-wrapper">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="sys-svg"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            role="img"
            aria-label="Real-time CPU and RAM performance chart with custom threshold alert lines"
          >
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6471" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#ff6471" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = innerHeight * ratio;
                return (
                  <line
                    key={idx}
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="#1c2633"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Threshold Reference Line: RAM */}
              {(activeSeries === 'both' || activeSeries === 'ram') && yRamScale && (
                <g className="threshold-line-group">
                  <line
                    x1={0}
                    y1={yRamScale(ramThreshold)}
                    x2={innerWidth}
                    y2={yRamScale(ramThreshold)}
                    stroke="#38bdf8"
                    strokeDasharray="5 4"
                    strokeWidth="1.4"
                    opacity={0.7}
                  />
                  <text
                    x={innerWidth - 4}
                    y={Math.max(10, yRamScale(ramThreshold) - 4)}
                    textAnchor="end"
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="600"
                    opacity={0.85}
                  >
                    RAM Alert: {ramThreshold}MB
                  </text>
                </g>
              )}

              {/* Threshold Reference Line: CPU */}
              {(activeSeries === 'both' || activeSeries === 'cpu') && yCpuScale && (
                <g className="threshold-line-group">
                  <line
                    x1={0}
                    y1={yCpuScale(cpuThreshold)}
                    x2={innerWidth}
                    y2={yCpuScale(cpuThreshold)}
                    stroke="#ff6471"
                    strokeDasharray="5 4"
                    strokeWidth="1.4"
                    opacity={0.75}
                  />
                  <text
                    x={4}
                    y={Math.max(10, yCpuScale(cpuThreshold) - 4)}
                    textAnchor="start"
                    fill="#ff6471"
                    fontSize="9"
                    fontWeight="600"
                    opacity={0.85}
                  >
                    CPU Alert: {cpuThreshold}%
                  </text>
                </g>
              )}

              {/* RAM Area & Line */}
              {(activeSeries === 'both' || activeSeries === 'ram') && (
                <>
                  <path d={ramAreaPath} fill="url(#ramGradient)" />
                  <path
                    d={ramPath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* CPU Area & Line */}
              {(activeSeries === 'both' || activeSeries === 'cpu') && (
                <>
                  <path d={cpuAreaPath} fill="url(#cpuGradient)" />
                  <path
                    d={cpuPath}
                    fill="none"
                    stroke="#ff6471"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Latest data dot markers */}
              {xScale && yCpuScale && (activeSeries === 'both' || activeSeries === 'cpu') && (
                <circle
                  cx={xScale(new Date(latest.timestamp))}
                  cy={yCpuScale(latest.cpu)}
                  r={isCpuBreached ? 6 : 4}
                  fill="#ff6471"
                  stroke="#ffffff"
                  strokeWidth={isCpuBreached ? 2.5 : 1.5}
                  className={isCpuBreached ? 'pulsing-marker-alert' : 'pulsing-marker'}
                />
              )}

              {xScale && yRamScale && (activeSeries === 'both' || activeSeries === 'ram') && (
                <circle
                  cx={xScale(new Date(latest.timestamp))}
                  cy={yRamScale(latest.ram)}
                  r={isRamBreached ? 6 : 4}
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth={isRamBreached ? 2.5 : 1.5}
                  className={isRamBreached ? 'pulsing-marker-alert' : ''}
                />
              )}

              {/* Interactive Hover Crosshair & Precise Inspection Pins */}
              {hoveredPoint && xScale && (
                <g className="hover-inspector-group">
                  {/* Vertical Crosshair Line */}
                  <line
                    x1={xScale(new Date(hoveredPoint.timestamp))}
                    y1={0}
                    x2={xScale(new Date(hoveredPoint.timestamp))}
                    y2={innerHeight}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    opacity={0.8}
                  />

                  {/* CPU Target Dot & Value Badge */}
                  {yCpuScale && (activeSeries === 'both' || activeSeries === 'cpu') && (
                    <g>
                      <circle
                        cx={xScale(new Date(hoveredPoint.timestamp))}
                        cy={yCpuScale(hoveredPoint.cpu)}
                        r={7}
                        fill="#ff6471"
                        fillOpacity={0.25}
                      />
                      <circle
                        cx={xScale(new Date(hoveredPoint.timestamp))}
                        cy={yCpuScale(hoveredPoint.cpu)}
                        r={4.5}
                        fill="#ff6471"
                        stroke="#ffffff"
                        strokeWidth={1.8}
                      />
                      <g transform={`translate(${xScale(new Date(hoveredPoint.timestamp))}, ${Math.max(14, yCpuScale(hoveredPoint.cpu) - 10)})`}>
                        <rect
                          x={-24}
                          y={-12}
                          width={48}
                          height={15}
                          rx={4}
                          fill="#251216"
                          stroke="#ff6471"
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={-1}
                          textAnchor="middle"
                          fill="#ff9aa4"
                          fontSize="9"
                          fontWeight="700"
                        >
                          {hoveredPoint.cpu}%
                        </text>
                      </g>
                    </g>
                  )}

                  {/* RAM Target Dot & Value Badge */}
                  {yRamScale && (activeSeries === 'both' || activeSeries === 'ram') && (
                    <g>
                      <circle
                        cx={xScale(new Date(hoveredPoint.timestamp))}
                        cy={yRamScale(hoveredPoint.ram)}
                        r={7}
                        fill="#38bdf8"
                        fillOpacity={0.25}
                      />
                      <circle
                        cx={xScale(new Date(hoveredPoint.timestamp))}
                        cy={yRamScale(hoveredPoint.ram)}
                        r={4.5}
                        fill="#38bdf8"
                        stroke="#ffffff"
                        strokeWidth={1.8}
                      />
                      <g transform={`translate(${xScale(new Date(hoveredPoint.timestamp))}, ${Math.min(innerHeight - 8, yRamScale(hoveredPoint.ram) + 16)})`}>
                        <rect
                          x={-28}
                          y={-12}
                          width={56}
                          height={15}
                          rx={4}
                          fill="#0f212e"
                          stroke="#38bdf8"
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={-1}
                          textAnchor="middle"
                          fill="#7dd3fc"
                          fontSize="9"
                          fontWeight="700"
                        >
                          {hoveredPoint.ram}M
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              )}

              {/* Full-area pointer event receiver for silky smooth tracking */}
              <rect
                x={0}
                y={0}
                width={innerWidth}
                height={innerHeight}
                fill="none"
                pointerEvents="all"
                style={{ cursor: 'crosshair' }}
              />
            </g>

            {/* Left Y-Axis Labels (CPU %) */}
            {(activeSeries === 'both' || activeSeries === 'cpu') && (
              <g className="axis-labels" transform={`translate(${margin.left - 8}, ${margin.top})`}>
                <text x="0" y="4" textAnchor="end" fill="#ff6471" fontSize="9" fontWeight="600">
                  CPU
                </text>
                <text x="0" y={innerHeight} textAnchor="end" fill="#718096" fontSize="9">
                  0%
                </text>
                <text x="0" y={innerHeight / 2} textAnchor="end" fill="#718096" fontSize="9">
                  {yCpuScale ? Math.round(yCpuScale.invert(innerHeight / 2)) : 15}%
                </text>
              </g>
            )}

            {/* Right Y-Axis Labels (RAM MB) */}
            {(activeSeries === 'both' || activeSeries === 'ram') && (
              <g className="axis-labels" transform={`translate(${width - margin.right + 8}, ${margin.top})`}>
                <text x="0" y="4" textAnchor="start" fill="#38bdf8" fontSize="9" fontWeight="600">
                  RAM
                </text>
                <text x="0" y={innerHeight} textAnchor="start" fill="#718096" fontSize="9">
                  100M
                </text>
                <text x="0" y={innerHeight / 2} textAnchor="start" fill="#718096" fontSize="9">
                  {yRamScale ? Math.round(yRamScale.invert(innerHeight / 2)) : 220}M
                </text>
              </g>
            )}

            {/* Bottom time markers */}
            <g transform={`translate(${margin.left}, ${height - 8})`}>
              <text x="0" y="0" textAnchor="start" fill="#64748b" fontSize="9">
                -36s
              </text>
              <text x={innerWidth / 2} y="0" textAnchor="middle" fill="#64748b" fontSize="9">
                -18s
              </text>
              <text x={innerWidth} y="0" textAnchor="end" fill="#64748b" fontSize="9">
                Live (Now)
              </text>
            </g>
          </svg>

          {/* Interactive Tooltip Overlay */}
          {hoveredPoint && hoverPos && (
            <div
              className="sys-tooltip"
              style={{
                left: `${hoverPos.x}%`,
                top: `${hoverPos.y}px`,
                transform: hoverPos.x > 62 ? 'translate(-105%, -20%)' : 'translate(10%, -20%)',
              }}
            >
              <div className="tooltip-time">
                <span>⏱ {new Date(hoveredPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <small>{Math.max(0, (Date.now() - hoveredPoint.timestamp) / 1000).toFixed(1)}s ago</small>
              </div>
              <div className="tooltip-row cpu">
                <span>CPU Usage:</span>
                <strong>{hoveredPoint.cpu}%</strong>
                {hoveredPoint.cpu >= cpuThreshold && <span className="threshold-breach-chip">BREACH</span>}
              </div>
              <div className="tooltip-row ram">
                <span>Resident RAM:</span>
                <strong>{hoveredPoint.ram} MB</strong>
                {hoveredPoint.ram >= ramThreshold && <span className="threshold-breach-chip">BREACH</span>}
              </div>
              <div className="tooltip-row threads">
                <span>ART Threads:</span>
                <strong>{hoveredPoint.threads} active</strong>
              </div>
              {hoveredPoint.gcEvent && (
                <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #1e293b', fontSize: 10, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={11} /> Hermes GC Collection Event
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION TOOLBAR */}
        <div className="sys-toolbar">
          <div className="sys-toolbar-info">
            <Sparkles size={13} />
            <span>
              Threshold Guard: <strong>{alertsEnabled ? 'Active' : 'Muted'}</strong> (Alerts trigger if CPU &gt;{' '}
              {cpuThreshold}% or RAM &gt; {ramThreshold}MB)
            </span>
          </div>

          <div className="sys-actions">
            <button
              type="button"
              className="sys-action-btn"
              onClick={triggerTrimMemory}
              disabled={isTrimming}
            >
              <RefreshCw size={12} className={isTrimming ? 'spinning' : ''} />
              {isTrimming ? 'Trimming Heap…' : 'Trim RAM (GC)'}
            </button>
            <button
              type="button"
              className={`sys-action-btn ${isStressTesting ? 'danger-active' : ''}`}
              onClick={toggleStressTest}
            >
              <AlertCircle size={12} />
              {isStressTesting ? 'Stop Flood Test' : 'Simulate Msg Flood (Test Breaches)'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
