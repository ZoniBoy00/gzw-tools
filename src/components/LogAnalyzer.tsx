import { useRef, useState } from 'react';
import { useLogAnalysis } from '../hooks/useLogAnalysis';
import { safeReportFilename, serializeLogReport } from '../lib/logreport';

const LOG_FOLDER = '%LOCALAPPDATA%'+String.raw`\GZW\Saved\Logs`;

function friendlySize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export default function LogAnalyzer() {
  const [copyStatus, setCopyStatus] = useState('');
  const [logText, setLogText] = useState('');
  const { parsed, analyzing, progress, error: analysisError, analyze, cancel } = useLogAnalysis();
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [sourceName, setSourceName] = useState('gzw-log');
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const copyLogFolder = async () => {
    try {
      await navigator.clipboard.writeText(LOG_FOLDER);
      setCopyStatus('Copied. Paste into File Explorer or Win+R.');
    } catch {
      setCopyStatus('Copy unavailable. Select and copy the path above.');
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!/\.(log|txt)$/i.test(file.name)) {
      setFileError('Choose a .log or .txt file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setFileError('This file is over the 50 MB limit.');
      return;
    }
    setLogText('');
    setSourceName(file.name);
    setFileError(null);
    analyze(file);
  };

  const handleAnalyze = () => {
    if (!logText.trim()) return;
    setFileError(null);
    analyze(logText);
  };

  const downloadReport = () => {
    if (!parsed) return;
    const url = URL.createObjectURL(new Blob([serializeLogReport(parsed)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeReportFilename(sourceName);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-file-lines text-accent text-sm" />
        <h1 className="section-title">GZW Log Analyzer</h1>
      </div>

      <p className="text-[11px] font-mono text-text-muted mb-4 leading-relaxed">
        Paste your <code className="text-accent">GZW.log</code> contents or select the file to extract gameplay data.
        Log location:{' '}
        <code className="text-accent/70 select-all break-all">{LOG_FOLDER}</code>
      </p>

      <div className="mb-4 text-xs text-text-muted">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { void copyLogFolder(); }}>Copy log folder path</button>
        <p className="mt-2">Paste this path into the File Explorer address bar or press Win+R, then press Enter. Select GZW.log in that folder.</p>
        <p role="status" className="mt-1">{copyStatus}</p>
      </div>

      <input ref={fileInput} className="sr-only" type="file" accept=".log,.txt,text/plain" aria-label="Choose a GZW log file" onChange={event => { void handleFile(event.target.files?.[0]); event.target.value = ''; }} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInput.current?.click()}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.current?.click(); } }}
        onDragOver={event => { event.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={event => { event.preventDefault(); setDragActive(false); void handleFile(event.dataTransfer.files[0]); }}
        className={`mb-3 cursor-pointer border border-dashed p-4 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${dragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}`}
        aria-describedby="log-file-help"
      >
        <i className="fas fa-file-arrow-up text-accent" aria-hidden="true" />
        <span className="ml-2 text-xs text-text">Drop a .log/.txt file here or choose file</span>
        <span id="log-file-help" className="mt-1 block text-[9px] font-mono text-text-muted">Up to 50 MB · processed locally in this browser</span>
      </div>
      {fileError && <p className="mb-3 text-xs text-red" role="alert">{fileError}</p>}

      <div className="mb-3">
        <textarea
          value={logText}
          onChange={(e) => { cancel(); setLogText(e.target.value); setSourceName('pasted-log'); }}
          placeholder="Paste GZW.log contents here..."
          className="input resize-none font-mono text-[11px]"
          rows={8}
          aria-label="GZW log contents"
        />
      </div>

      <button onClick={handleAnalyze} className="btn btn-primary w-full btn-sm" disabled={analyzing || !logText.trim()}>
        <i className={`fas ${analyzing ? 'fa-spinner fa-spin' : 'fa-microchip'}`} /> {analyzing ? 'Analyzing log?' : 'Analyze Log'}
      </button>
      <p className="mt-2 text-[9px] font-mono text-text-muted/70">Privacy: log text is parsed in your browser and is not uploaded. The downloadable report is created locally.</p>

      {analysisError && <p role="alert" className="mt-3 text-xs text-red">{analysisError}</p>}
      {analyzing && <div className="card p-4 mt-4" aria-busy="true">
        <p role="status" className="mb-2 text-sm">{progress === null ? 'Reading log?' : progress === 100 ? 'Preparing results?' : `Analyzing log: ${progress}%`}</p>
        <progress className="w-full h-3 accent-accent" aria-label="Log analysis progress" max={100} value={progress ?? undefined} />
        <button type="button" className="btn btn-outline btn-sm mt-2" onClick={cancel}>Cancel analysis</button>
      </div>}

      {parsed && !analyzing && (
        <div className="mt-5 animate-stagger">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-border bg-surface-2/40 p-3">
            <span className="text-[10px] font-mono text-text-muted">Analysis ready · local report</span>
            <button type="button" onClick={downloadReport} className="btn btn-outline btn-sm"><i className="fas fa-download" aria-hidden="true" /> Download JSON report</button>
          </div>
          {/* ─── STAT CARDS ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            {[
              { label: 'Lines', value: String(parsed.totalLines), icon: 'fas fa-list', color: '' },
              { label: 'Session', value: parsed.sessionLabel, icon: 'fas fa-clock', color: parsed.sessionLabel !== 'N/A' ? 'text-accent' : '' },
              { label: 'Warnings', value: String(parsed.warnings), icon: 'fas fa-triangle-exclamation', color: parsed.warnings > 5000 ? 'text-amber-400' : '' },
              { label: 'Errors', value: String(parsed.errors), icon: 'fas fa-circle-exclamation', color: parsed.errors > 0 ? 'text-red' : '' },
              { label: 'RAM Peak', value: friendlySize(parsed.memory.peak), icon: 'fas fa-microchip', color: '' },
            ].map((s) => (
              <div key={s.label} className="card card-highlight p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <i className={`${s.icon} ${s.color || 'text-accent/60'} text-[10px]`} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">{s.label}</span>
                </div>
                <span className={`text-lg font-bold font-mono ${s.color || 'text-text'}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* ─── SESSION INFO ─── */}
          {(parsed.sessionStart || parsed.region || parsed.playerName || parsed.audioDevice || parsed.gameMap) && (
            <div className="card card-highlight p-3 mb-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                <i className="fas fa-gamepad text-accent/60" />
                Game Session
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                {parsed.sessionStart && <div><span className="text-text-muted">Start </span><span>{parsed.sessionStart}</span></div>}
                {parsed.sessionEnd && <div><span className="text-text-muted">End </span><span>{parsed.sessionEnd.replace('.', ' ').slice(0, 19)}</span></div>}
                {parsed.sessionLabel && parsed.sessionLabel !== 'N/A' && <div><span className="text-text-muted">Duration </span><span className="text-accent font-bold">{parsed.sessionLabel}</span></div>}
                {parsed.playerName && <div><span className="text-text-muted">Player </span><span>{parsed.playerName}</span></div>}
                {parsed.region && <div><span className="text-text-muted">Region </span><span className="tag tag-amber text-[9px]">{parsed.region}</span></div>}
                {parsed.gameMap && <div><span className="text-text-muted">Map </span><span>{parsed.gameMap}</span></div>}
                {parsed.audioDevice && <div className="col-span-2"><span className="text-text-muted">Audio </span><span className="text-text-muted">{parsed.audioDevice}</span></div>}
              </div>
            </div>
          )}

          {/* ─── PERFORMANCE ─── */}
          {parsed.performance.length > 0 && (
            <div className="card card-highlight p-3 mb-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                <i className="fas fa-gauge-high text-accent/60" />
                Performance ({parsed.performance.length} events)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-surface-2 border border-border p-2">
                  <div className="text-[8px] uppercase text-text-muted">Tick Delays</div>
                  <div className="text-sm font-bold font-mono text-accent">{parsed.performance.filter(p => p.type === 'tick_delay').length}</div>
                  <div className="text-[9px] text-text-muted">network stutters</div>
                </div>
                <div className="bg-surface-2 border border-border p-2">
                  <div className="text-[8px] uppercase text-text-muted">Frame Drops</div>
                  <div className="text-sm font-bold font-mono text-red">{parsed.performance.filter(p => p.type === 'frame_drop').length}</div>
                  <div className="text-[9px] text-text-muted">{'>100ms frames'}</div>
                </div>
                <div className="bg-surface-2 border border-border p-2">
                  <div className="text-[8px] uppercase text-text-muted">Max Delay</div>
                  <div className="text-sm font-bold font-mono text-accent">
                    {Math.max(...parsed.performance.filter(p => p.type === 'tick_delay').map(p => p.value), 0).toFixed(1)}s
                  </div>
                  <div className="text-[9px] text-text-muted">worst tick</div>
                </div>
                <div className="bg-surface-2 border border-border p-2">
                  <div className="text-[8px] uppercase text-text-muted">RAM Peak</div>
                  <div className="text-sm font-bold font-mono text-green">{friendlySize(parsed.memory.peak)}</div>
                  <div className="text-[9px] text-text-muted">{friendlySize(parsed.memory.total)} total</div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SQUAD QUESTS ─── */}
          {parsed.quests.length > 0 && (
            <div className="card card-highlight p-3 mb-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                <i className="fas fa-clipboard-list text-accent/60" />
                Squad Quests ({parsed.quests.length})
              </div>
              <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                {parsed.quests.map((q) => (
                  <span key={q} className="chip chip-sm active">{q}</span>
                ))}
              </div>
            </div>
          )}

          {/* ─── SERVERS + FRIENDS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {parsed.servers.length > 0 && (
              <div className="card card-highlight p-3">
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                  <i className="fas fa-server text-accent/60" />
                  Servers ({parsed.servers.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {parsed.servers.map((ip) => (
                    <span key={ip} className="chip chip-sm">{ip}</span>
                  ))}
                </div>
              </div>
            )}
            {parsed.friends.length > 0 && (
              <div className="card card-highlight p-3">
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                  <i className="fas fa-users text-accent/60" />
                  Friends Online
                </div>
                <div className="flex flex-wrap gap-1">
                  {parsed.friends.map((f) => (
                    <span key={f} className="chip chip-sm active">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── LOG BREAKDOWN ─── */}
          {Object.keys(parsed.categoryStats).length > 0 && (
            <div className="card card-highlight p-3 mb-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                <i className="fas fa-chart-pie text-accent/60" />
                Log Breakdown by Category
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {Object.entries(parsed.categoryStats)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 20)
                  .map(([cat, stats]) => {
                    const pct = ((stats.count / parsed.totalLines) * 100).toFixed(1);
                    return (
                      <div key={cat} className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="w-20 shrink-0 text-text-muted truncate">{cat}</span>
                        <div className="flex-1 h-3 bg-surface-2 border border-border overflow-hidden">
                          <div
                            className="h-full bg-accent/40"
                            style={{ width: `${Math.min(parseFloat(pct) * 3, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-text-muted">{pct}%</span>
                        <span className="w-10 text-right text-text-muted">{stats.count}</span>
                        {stats.warnings > 0 && <span className="w-6 text-right text-amber-400/70">⚠{stats.warnings}</span>}
                        {stats.errors > 0 && <span className="w-6 text-right text-red/70">✗{stats.errors}</span>}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ─── TIMELINE ─── */}
          {parsed.events.length > 0 && (
            <div className="card card-highlight p-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <i className="fas fa-timeline text-accent/60" />
                  Event Timeline
                  <span className="text-text-muted font-mono text-[9px]">{parsed.events.length} events</span>

                  {/* Category filter chips */}
                  <span className="ml-auto" />
                  {['all', ...new Set(parsed.events.map(e => e.category).slice(0, 12))].slice(0, 8).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTimelineFilter(cat)}
                      className={`text-[8px] px-1.5 py-0.5 border ${
                        timelineFilter === cat ? 'border-accent/50 text-accent bg-accent/10' : 'border-border text-text-muted'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat.slice(0, 12)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {parsed.events
                  .filter(e => timelineFilter === 'all' || e.category === timelineFilter)
                  .slice(-60)
                  .reverse()
                  .map((e, i) => (
                    <div key={i} className="text-[10px] font-mono flex gap-2 py-0.5 border-b border-border/10 hover:bg-surface-2/40">
                      <span className="text-text-muted shrink-0 w-14 truncate">{e.timestamp.slice(-8)}</span>
                      <span className={`shrink-0 w-16 truncate ${
                        e.level === 'error' ? 'text-red' : e.level === 'warning' ? 'text-amber-400/80' : 'text-drab'
                      }`}>
                        {e.category.slice(0, 12)}
                      </span>
                      <span className="text-text-muted truncate">{e.message.slice(0, 90)}{e.message.length > 90 ? '…' : ''}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
