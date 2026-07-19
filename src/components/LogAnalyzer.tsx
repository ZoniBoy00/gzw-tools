import { useState } from 'react';
import { parseLog, type ParsedLog } from '../lib/logparser';

export default function LogAnalyzer() {
  const [logText, setLogText] = useState('');
  const [parsed, setParsed] = useState<ParsedLog | null>(null);

  const handleAnalyze = () => {
    if (!logText.trim()) return;
    const result = parseLog(logText);
    setParsed(result);
  };

  return (
    <div className="tab-content">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-file-lines text-accent text-sm" />
        <span className="section-title">GZW Log Analyzer</span>
      </div>

      <p className="text-[11px] font-mono text-text-muted mb-4 leading-relaxed">
        Paste your <code className="text-accent">GZW.log</code> contents to extract gameplay data:
        session info, squad quests, server connections, and system stats.
        Log file location:{' '}
        <code className="text-accent/70">%localappdata%\GrayZoneWarfare\Saved\Logs\</code>
      </p>

      {/* Input */}
      <div className="mb-3">
        <textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          placeholder="Paste GZW.log contents here..."
          className="input resize-none font-mono text-[11px]"
          rows={8}
          aria-label="GZW log contents"
        />
      </div>

      <button
        onClick={handleAnalyze}
        className="btn btn-primary w-full btn-sm"
        disabled={!logText.trim()}
      >
        <i className="fas fa-microchip" /> Analyze Log
      </button>

      {/* Results */}
      {parsed && (
        <div className="mt-5 animate-stagger">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Lines', value: String(parsed.stats.totalLines), icon: 'fas fa-list' },
              { label: 'Session', value: parsed.sessions.length > 0 ? parsed.sessions[0].duration : 'N/A', icon: 'fas fa-clock' },
              { label: 'Warnings', value: String(parsed.stats.warnings), icon: 'fas fa-triangle-exclamation' },
              { label: 'Errors', value: String(parsed.stats.errors), icon: 'fas fa-circle-exclamation', color: parsed.stats.errors > 0 ? 'text-red' : 'text-text-muted' },
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

          {/* Session info */}
          {parsed.sessions.length > 0 && (
            <div className="card card-highlight p-3 mb-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                <i className="fas fa-gamepad text-accent/60" />
                Game Session
              </div>
              <div className="text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Started</span>
                  <span>{parsed.stats.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Ended</span>
                  <span>{parsed.stats.endTime?.replace('.', ' ').slice(0, 19)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Duration</span>
                  <span className="text-accent font-bold">{parsed.sessions[0].duration}</span>
                </div>
                {parsed.region && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Region</span>
                    <span className="tag tag-amber text-[9px]">{parsed.region}</span>
                  </div>
                )}
                {parsed.playerName && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Player</span>
                    <span>{parsed.playerName}</span>
                  </div>
                )}
                {parsed.memory.physical && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">RAM Usage</span>
                    <span>{parsed.memory.physical} MB</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Squad Quests */}
          {parsed.quests.length > 0 && (
            <div className="card card-highlight p-3 mb-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                <i className="fas fa-clipboard-list text-accent/60" />
                Squad Quests Found ({parsed.quests.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {parsed.quests.map((q) => (
                  <span key={q} className="chip chip-sm active">{q}</span>
                ))}
              </div>
            </div>
          )}

          {/* Server connections */}
          {parsed.servers.length > 0 && (
            <div className="card card-highlight p-3 mb-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                <i className="fas fa-server text-accent/60" />
                Servers Contacted ({parsed.servers.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {parsed.servers.map((ip) => (
                  <span key={ip} className="chip chip-sm">{ip}</span>
                ))}
              </div>
            </div>
          )}

          {/* Event timeline (last 20) */}
          {parsed.events.length > 0 && (
            <div className="card card-highlight p-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-2 flex items-center gap-2">
                <i className="fas fa-timeline text-accent/60" />
                Event Timeline
                <span className="text-text-muted/50 font-mono text-[9px] ml-auto">{parsed.events.length} events total</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {parsed.events.slice(-40).reverse().map((e, i) => (
                  <div key={i} className="text-[10px] font-mono flex gap-2 py-0.5 border-b border-border/20">
                    <span className="text-text-muted/50 shrink-0 w-16 truncate">{e.timestamp.slice(-8)}</span>
                    <span className="text-drab shrink-0 w-16 truncate">{e.category.slice(0, 12)}</span>
                    <span className="text-text-muted truncate">{e.message.slice(0, 80)}{e.message.length > 80 ? '…' : ''}</span>
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
