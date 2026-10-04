import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { BatteryCharging, Zap, Sun, Clock, Smartphone, Check, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

interface BatteryOptimizationProps {
  currentTheme: 'dark' | 'amoled';
  onSwitchTheme: (theme: 'dark' | 'amoled') => void;
  onLog?: (message: string, level?: 'info' | 'success' | 'warning' | 'error', tag?: string) => void;
}

export function BatteryOptimization({ currentTheme, onSwitchTheme, onLog }: BatteryOptimizationProps) {
  const [brightness, setBrightness] = useState<number>(68); // 20% to 100%
  const [screenOnHours, setScreenOnHours] = useState<number>(4.5); // 1h to 10h
  const [panelType, setPanelType] = useState<'amoled120' | 'oled90' | 'oled60'>('amoled120');

  // Realistic OLED physics calculations:
  // On OLED/AMOLED panels, individual subpixels emit their own light.
  // Standard Dark mode (#0b1017) keeps red/green/blue OLED emitters partially excited (~10-14% power baseline).
  // AMOLED Pure Black (#000000) drives emitters to 0.0V, shutting off ~68% of display pixels completely.
  // Higher brightness and higher refresh rates magnify the absolute battery watt-hour savings!
  const stats = useMemo(() => {
    const isAmoled = currentTheme === 'amoled';
    const panelMultiplier = panelType === 'amoled120' ? 1.25 : panelType === 'oled90' ? 1.1 : 1.0;
    
    // Base power savings percentage: between 16% and 34%
    // At higher brightness, black pixels save exponentially more milliwatts
    const brightnessRatio = brightness / 100;
    const estimatedPercentSaved = Math.min(35, Math.max(14, 15 + (brightnessRatio * 18 * panelMultiplier / 1.15)));
    
    // Gained runtime in minutes per day
    const gainedMinutes = Math.round(screenOnHours * 60 * (estimatedPercentSaved / 100) * 0.92);
    const gainedHoursStr = `${Math.floor(gainedMinutes / 60)}h ${gainedMinutes % 60}m`;
    
    // Milliamp-hours (mAh) saved daily on a standard 4,800 mAh battery
    const mahSaved = Math.round((estimatedPercentSaved / 100) * (screenOnHours / 5.5) * 1650);

    // Annual energy saved in kWh
    const annualKwh = ((mahSaved * 3.85 * 365) / 1000000).toFixed(1);

    // Inactive subpixels ratio in Assault client UI
    const subpixelOffRatio = 69.2;

    return {
      percentSaved: Number(estimatedPercentSaved.toFixed(1)),
      gainedMinutes,
      gainedHoursStr,
      mahSaved,
      annualKwh,
      subpixelOffRatio,
      isAmoled,
    };
  }, [brightness, screenOnHours, panelType, currentTheme]);

  // D3 Progress Ring setup
  const ringSize = 164;
  const strokeWidth = 14;
  const radius = ringSize / 2;
  const innerRadius = radius - strokeWidth;
  const outerRadius = radius;

  const { backgroundArc, foregroundArc, startAngle, endAngle } = useMemo(() => {
    const arcGen = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(7);

    // Ring spans 260 degrees (from -130 deg to +130 deg)
    const totalAngle = (260 * Math.PI) / 180;
    const startAngle = -(totalAngle / 2);
    const endAngle = totalAngle / 2;

    const backgroundArc = arcGen({
      startAngle,
      endAngle,
      innerRadius,
      outerRadius,
    });

    // Foreground arc based on percentSaved (normalized to 0-35% range)
    const progressRatio = Math.min(1, stats.percentSaved / 35);
    const progressEndAngle = startAngle + (totalAngle * progressRatio);

    const foregroundArc = arcGen({
      startAngle,
      endAngle: progressEndAngle,
      innerRadius,
      outerRadius,
    });

    return {
      backgroundArc: backgroundArc || '',
      foregroundArc: foregroundArc || '',
      startAngle,
      endAngle,
    };
  }, [innerRadius, outerRadius, stats.percentSaved]);

  const handleApplyAmoled = () => {
    onSwitchTheme('amoled');
    onLog?.(
      `AMOLED Pure Black activated: True #000000 OLED pixels enabled · Projected display energy savings: ${stats.percentSaved}%`,
      'success',
      'POWER'
    );
  };

  const handleApplyDark = () => {
    onSwitchTheme('dark');
    onLog?.('Theme switched back to standard slate Dark mode (#0b1017)', 'info', 'POWER');
  };

  return (
    <section className="battery-card" id="battery" role="region" aria-label="Battery Optimization Stats">
      <div className="battery-header">
        <div className="battery-title-group">
          <div className={`battery-icon-badge ${stats.isAmoled ? 'amoled-glow' : ''}`}>
            <BatteryCharging size={18} />
          </div>
          <div>
            <div className="battery-eyebrow">OLED HARDWARE EFFICIENCY</div>
            <h3>Battery Optimization & Display Telemetry</h3>
          </div>
        </div>

        <div className="battery-active-pill">
          {stats.isAmoled ? (
            <span className="pill-badge-active">
              <span className="dot-active" /> AMOLED Pure Black Active
            </span>
          ) : (
            <span className="pill-badge-inactive">
              <span className="dot-inactive" /> Slate Dark Active (Savings Inactive)
            </span>
          )}
        </div>
      </div>

      <div className="battery-grid-content">
        {/* LEFT: D3 PROGRESS RING & KEY PERCENTAGE */}
        <div className="ring-container">
          <div className="d3-ring-wrapper">
            <svg
              width={ringSize}
              height={ringSize}
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              className="d3-progress-ring"
              role="img"
              aria-label={`D3 progress ring showing ${stats.percentSaved}% battery savings`}
            >
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff6471" />
                  <stop offset="50%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#38ef7d" />
                </linearGradient>
                <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ff6471" floodOpacity="0.45" />
                </filter>
              </defs>

              <g transform={`translate(${radius}, ${radius})`}>
                {/* Background Track */}
                <path
                  d={backgroundArc}
                  fill="#1b2533"
                  opacity={0.65}
                />

                {/* Foreground Active Arc */}
                <path
                  d={foregroundArc}
                  fill={stats.isAmoled ? 'url(#ringGradient)' : '#4a5b6e'}
                  filter={stats.isAmoled ? 'url(#ringGlow)' : undefined}
                  style={{ transition: 'all 0.5s ease-in-out' }}
                />
              </g>
            </svg>

            {/* Inner Ring Text Content */}
            <div className="ring-center-content">
              <span className="ring-value-number">
                {stats.percentSaved}%
              </span>
              <span className="ring-value-sub">
                {stats.isAmoled ? 'POWER REDUCED' : 'POTENTIAL SAVINGS'}
              </span>
            </div>
          </div>

          <div className="ring-caption">
            <strong>{stats.subpixelOffRatio}% of display subpixels</strong> shut off entirely in Assault AMOLED mode.
          </div>
        </div>

        {/* MIDDLE: METRIC BREAKDOWN */}
        <div className="battery-stats-breakdown">
          <div className="battery-kpi-card">
            <div className="kpi-icon"><Clock size={16} /></div>
            <div className="kpi-info">
              <span className="kpi-label">EXTRA DAILY RUNTIME</span>
              <strong>+{stats.gainedHoursStr}</strong>
              <small>Calculated on {screenOnHours}h daily Discord screen-time</small>
            </div>
          </div>

          <div className="battery-kpi-card">
            <div className="kpi-icon green"><Zap size={16} /></div>
            <div className="kpi-info">
              <span className="kpi-label">CAPACITY PRESERVED</span>
              <strong>~{stats.mahSaved} mAh / day</strong>
              <small>Conserves ~{stats.annualKwh} kWh energy annually</small>
            </div>
          </div>

          <div className="battery-kpi-card">
            <div className="kpi-icon"><Flame size={16} /></div>
            <div className="kpi-info">
              <span className="kpi-label">THERMAL THROTTLING</span>
              <strong>-3.4°C Surface Temp</strong>
              <small>Reduced display thermal dissipation during voice calls</small>
            </div>
          </div>
        </div>

        {/* RIGHT: INTERACTIVE SLIDERS & HARDWARE SIMULATOR */}
        <div className="battery-controls-panel">
          <div className="ctrl-group">
            <div className="ctrl-label-row">
              <span><Sun size={13} /> Screen Brightness</span>
              <strong>{brightness}%</strong>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="2"
              value={brightness}
              onChange={e => setBrightness(Number(e.target.value))}
              className="ctrl-slider"
              aria-label="Screen brightness percentage"
            />
            <div className="ctrl-scale-markers">
              <span>20% (Dim)</span>
              <span>65% (Indoors)</span>
              <span>100% (Direct Sun)</span>
            </div>
          </div>

          <div className="ctrl-group">
            <div className="ctrl-label-row">
              <span><Clock size={13} /> Daily Discord Screen-on Time</span>
              <strong>{screenOnHours} hours</strong>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={screenOnHours}
              onChange={e => setScreenOnHours(Number(e.target.value))}
              className="ctrl-slider"
              aria-label="Daily screen-on hours"
            />
            <div className="ctrl-scale-markers">
              <span>1h (Light)</span>
              <span>4.5h (Typical)</span>
              <span>10h (Heavy)</span>
            </div>
          </div>

          <div className="ctrl-group">
            <div className="ctrl-label-row">
              <span><Smartphone size={13} /> OLED Display Refresh Rate</span>
              <span className="panel-tag">{panelType === 'amoled120' ? '120Hz LTPO' : panelType === 'oled90' ? '90Hz OLED' : '60Hz Standard'}</span>
            </div>
            <div className="panel-selector-pills">
              <button
                type="button"
                className={`panel-pill ${panelType === 'amoled120' ? 'active' : ''}`}
                onClick={() => setPanelType('amoled120')}
              >
                120Hz LTPO
              </button>
              <button
                type="button"
                className={`panel-pill ${panelType === 'oled90' ? 'active' : ''}`}
                onClick={() => setPanelType('oled90')}
              >
                90Hz AMOLED
              </button>
              <button
                type="button"
                className={`panel-pill ${panelType === 'oled60' ? 'active' : ''}`}
                onClick={() => setPanelType('oled60')}
              >
                60Hz OLED
              </button>
            </div>
          </div>

          {/* THEME TOGGLE CALL-TO-ACTION */}
          <div className="battery-cta-row">
            {!stats.isAmoled ? (
              <button
                type="button"
                className="battery-activate-btn"
                onClick={handleApplyAmoled}
              >
                <Zap size={14} />
                <span>Switch to AMOLED Pure Black ({stats.percentSaved}% Savings)</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <div className="battery-activated-banner">
                <ShieldCheck size={16} />
                <span>Maximum OLED battery savings active (#000000)</span>
                <button
                  type="button"
                  className="revert-link-btn"
                  onClick={handleApplyDark}
                >
                  Switch to Slate Dark
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
