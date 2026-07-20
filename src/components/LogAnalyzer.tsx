import { useState, useRef, useCallback } from 'react';
import { parseLog, type ParsedLog } from '../lib/logparser';

function friendlySize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export default function LogAnalyzer() {
  const [logText, setLogText] = useState('');
  const [parsed, setParsed] = useState<ParsedLog | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback((text: string) => {
    if (!text.trim()) return;
    setParsed(parseLog(text));
  }, []);

  const readFile = useCallback((file: File) => {
    if (!file.name.endsWith('.log') && !file.name.endsWith('.txt')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setLogText(text);
      handleAnalyze(text);
    };
    reader.readAsText(file);
  }, [handleAnalyze]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [readFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only hide if leaving the drop zone, not entering a child
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = '';
  };

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-file-lines text-accent text-sm" />
        <span className="section-title">GZW Log Analyzer</span>
      </div>

      <p className="text-[11px] font-mono text-text-muted mb-4 leading-relaxed">
        Paste your <code className="text-accent">GZW.log</code> contents or drag & drop a log file to extract gameplay data.
        Log location:{' '}
        <code className="text-accent/70">%localappdata%\GrayZoneWarfare\Saved\Logs\</code>
      </p>

      {/* Drag-drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative"
      >
        {/* Drop overlay */}
        {dragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-accent/10 border-2 border-dashed border-accent/60 rounded"
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-center">
              <i className="fas fa-cloud-arrow-up text-2xl text-accent mb-2" />
              <div className="text-sm font-bold text-accent">Drop .log file here</div>
            </div>
          </div>
        )}

        <textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          placeholder="Paste GZW.log contents here, or drag & drop a .log file..."
          className="input resize-none font-mono text-[11px]"
          rows={8}
          aria-label="GZW log contents"
        />
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => handleAnalyze(logText)} className="btn btn-primary flex-1 btn-sm" disabled={!logText.trim()}>
          <i className="fas fa-microchip" /> Analyze Log
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline btn-sm">
          <i className="fas fa-folder-open" /> Browse…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".log,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        {logText && (
          <button onClick={() => { setLogText(''); setParsed(null); setFileName(''); }} className="btn btn-outline btn-sm">
            <i className="fas fa-xmark" />
          </button>
        )}
      </div>

      {fileName && (
        <div className="mt-2 text-[10px] font-mono text-text-muted/60 flex items-center gap-1">
          <i className="fas fa-file" /> {fileName}
        </div>
      )}

      {parsed && (
        <div className="mt-5 animate-stagger">
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
                {parsed.audioDevice && <div className="col-span-2"><span className="text-text-muted">Audio </span><span className="text-text-muted/80">{parsed.audioDevice}</span></div>}
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
                        <span className="w-10 text-right text-text-muted/60">{stats.count}</span>
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
                  <span className="text-text-muted/50 font-mono text-[9px]">{parsed.events.length} events</span>
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
                      <span className="text-text-muted/40 shrink-0 w-14 truncate">{e.timestamp.slice(-8)}</span>
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
