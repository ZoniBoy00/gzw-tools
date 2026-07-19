// GZW Log Parser v2 — Extracts meaningful gameplay data from Gray Zone Warfare UE4 logs
export interface LogEvent {
  timestamp: string;
  dateObj: Date | null;
  category: string;
  level: 'log' | 'warning' | 'error';
  message: string;
}

export interface PerformanceSample {
  timestamp: string;
  type: string;
  value: number;
}

export interface ParsedLog {
  events: LogEvent[];
  sessionStart: string;
  sessionEnd: string;
  sessionMinutes: number;
  sessionLabel: string;
  quests: string[];
  servers: string[];
  playerName: string;
  region: string;
  memory: { physical: number; virtual: number; peak: number; total: number };
  audioDevice: string;
  gameMap: string;
  warnings: number;
  errors: number;
  totalLines: number;
  categoryStats: Record<string, { count: number; warnings: number; errors: number }>;
  friends: string[];
  performance: PerformanceSample[];
}

function parseUTCTimestamp(s: string): Date | null {
  // Try: "2026.07.19-08.34.12:305" → split on millis
  const m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6]));
  // Try: "07/19/26 11:34:01"
  const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (m2) return new Date(2000+parseInt(m2[3]), parseInt(m2[1])-1, parseInt(m2[2]), parseInt(m2[4]), parseInt(m2[5]), parseInt(m2[6]));
  return null;
}

function formatDur(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes >= 60) return `${Math.floor(minutes/60)}h ${minutes%60}m`;
  return `${minutes}m`;
}

export function parseLog(text: string): ParsedLog {
  const lines = text.split('\n');
  const events: LogEvent[] = [];
  const quests = new Set<string>();
  const servers = new Set<string>();
  const friends = new Set<string>();
  const categoryStats: Record<string, { count: number; warnings: number; errors: number }> = {};

  let playerName = '';
  let region = '';
  let audioDevice = '';
  let gameMap = '';
  const memory = { physical: 0, virtual: 0, peak: 0, total: 0 };
  let warnings = 0;
  let errors = 0;
  let sessionStart = '';
  let sessionEnd = '';
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  const performance: PerformanceSample[] = [];
  let tickTrackerCount = 0;
  let maxTickDelay = 0;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // 1) Log file open
    const openMatch = trimmed.match(/^Log file open,\s*(.+)/);
    if (openMatch) {
      const ts = openMatch[1].trim();
      sessionStart = ts;
      startDate = parseUTCTimestamp(ts);
      events.push({ timestamp: ts, dateObj: startDate, category: 'System', level: 'log', message: 'Game started' });
      continue;
    }

    // 2) UE4 log: [2026.07.19-08.34.12:305][  0]LogCategory: Warning: message
    const ue4 = trimmed.match(/^\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}:\d{3})\]\[\s*(\d+)\](Log\w+):\s*(Warning|Error)?:?\s*(.*)$/);
    if (ue4) {
      const ts = ue4[1];
      const cat = ue4[3];
      const level = (ue4[4] || '').toLowerCase() as 'warning' | 'error' | '';
      const msg = ue4[5].trim();
      const dt = parseUTCTimestamp(ts);

      // Track last timestamp for session end
      if (dt && (!endDate || dt > endDate)) { endDate = dt; sessionEnd = ts; }

      // Category stats
      if (!categoryStats[cat]) categoryStats[cat] = { count: 0, warnings: 0, errors: 0 };
      categoryStats[cat].count++;
      if (level === 'warning') { warnings++; categoryStats[cat].warnings++; }
      else if (level === 'error') { errors++; categoryStats[cat].errors++; }

      // Only store meaningful events for timeline (skip high-frequency noise)
      const isNoise = ['LogTextFormatter', 'LogUIActionRouter', 'LogEOSRTC', 'LogStreamlineAPI'].includes(cat);
      if (!isNoise) {
        events.push({ timestamp: ts, dateObj: dt, category: cat, level: level || 'log', message: msg });
      }

      // === DATA EXTRACTIONS ===

      // Squad quests
      if (msg.includes('SquadQuests \t')) {
        const q = msg.replace('SquadQuests \t\t', '').trim();
        if (q && q !== 'List shared quests incoming from server') quests.add(q);
      }

      // Player name
      const pMatch = msg.match(/user:\s*(\S+)/);
      if (pMatch) playerName = pMatch[1];

      // Server pings
      if (cat === 'LogOnline' && msg.includes('Failed to ping')) {
        const sMatch = msg.match(/ping\s+([\d.]+)/);
        if (sMatch) servers.add(sMatch[1]);
      }

      // Region
      if (msg.includes('Region changed to code')) {
        const rMatch = msg.match(/code\s*=\s*"([^"]+)"/);
        if (rMatch) region = rMatch[1];
      }

      // Memory
      if (cat === 'LogMemory') {
        const memMatch = msg.match(/Process Physical Memory:\s*([\d.]+)\s*MB used,\s*([\d.]+)\s*MB peak/);
        if (memMatch) { memory.physical = Math.max(memory.physical, parseFloat(memMatch[1])); memory.peak = Math.max(memory.peak, parseFloat(memMatch[2])); }
        const totalMatch = msg.match(/Physical Memory:\s*[\d.]+\s*MB used,\s*[\d.]+\s*MB free,\s*([\d.]+)\s*MB total/);
        if (totalMatch) memory.total = parseFloat(totalMatch[1]);
        const virtMatch = msg.match(/Process Virtual Memory:\s*([\d.]+)\s*MB used/);
        if (virtMatch) memory.virtual = Math.max(memory.virtual, parseFloat(virtMatch[1]));
      }

      // Audio device
      if (msg.includes('Using Default Device') || msg.includes('Audio Output Device')) {
        const aMatch = msg.match(/name:\s*([^,]+)/);
        if (aMatch) audioDevice = aMatch[1].trim();
      }

      // Game map / world
      if (cat === 'LogNet' && msg.includes('/Game/Maps/')) {
        const mapMatch = msg.match(/\/Game\/Maps\/(\w+)/);
        if (mapMatch) gameMap = mapMatch[1];
      }

      // Performance: TickTracker delays
      if (cat === 'LogEOSSDK' && msg.includes('TickTracker Tick is delayed')) {
        const delayMatch = msg.match(/MaxTickInterval=\[([\d.]+)s\]/);
        if (delayMatch) {
          const delay = parseFloat(delayMatch[1]);
          performance.push({ timestamp: ts, type: 'tick_delay', value: delay });
          tickTrackerCount++;
          if (delay > maxTickDelay) maxTickDelay = delay;
        }
      }

      // Performance: Frame rate over 100ms
      if (cat.includes('Streamline') && msg.includes('Frame rate over 100.00ms')) {
        performance.push({ timestamp: ts, type: 'frame_drop', value: 100 });
      }

      // Friends
      if (cat === 'LogFriends') {
        const fMatch = msg.match(/User:\s*(\S+)/);
        if (fMatch) friends.add(fMatch[1]);
        if (msg.includes('Empty parameters')) {
          // just note it
        }
      }

      // Character actions (general activity tracking)
      // Already captured as events
      continue;
    }

    // 3) Pre-UE4 import/init lines
    const initMatch = trimmed.match(/^(Log\w+|Import\w+):\s*(.*)$/);
    if (initMatch) {
      if (initMatch[1] === 'LogEOSSDK') {
        events.push({ timestamp: '', dateObj: null, category: 'LogEOSSDK', level: 'log', message: initMatch[2].trim().slice(0, 120) });
      }
    }
  }

  // Calculate session
  let sessionMinutes = 0;
  if (startDate && endDate) {
    sessionMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  }

  return {
    events,
    sessionStart,
    sessionEnd,
    sessionMinutes,
    sessionLabel: formatDur(sessionMinutes) || 'N/A',
    quests: [...quests].sort(),
    servers: [...servers].sort(),
    playerName,
    region,
    memory,
    audioDevice,
    gameMap,
    warnings,
    errors,
    totalLines: lines.length,
    categoryStats,
    friends: [...friends],
    performance,
  };
}
