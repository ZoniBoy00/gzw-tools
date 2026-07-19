// GZW Log Parser — Extracts meaningful data from Gray Zone Warfare UE4 logs
// Parses key events: sessions, squad quests, connections, system info

export interface LogEvent {
  timestamp: string;
  category: string;
  message: string;
  raw: string;
}

export interface ParsedLog {
  events: LogEvent[];
  sessions: { start: string; end: string; duration: string }[];
  quests: string[];
  servers: string[];
  playerName: string;
  region: string;
  memory: { physical: string; virtual: string; total: string };
  stats: {
    totalLines: number;
    warnings: number;
    errors: number;
    startTime: string;
    endTime: string;
    sessionMinutes: number;
  };
}

export function parseLog(text: string): ParsedLog {
  const lines = text.split('\n');
  const events: LogEvent[] = [];
  const quests = new Set<string>();
  const servers = new Set<string>();
  let playerName = '';
  let region = '';
  const memory = { physical: '', virtual: '', total: '' };
  let warnings = 0;
  let errors = 0;
  let startTime = '';
  let endTime = '';

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Extract timestamp
    let timestamp = '';
    let category = '';

    // Log file open
    const logOpen = trimmed.match(/^Log file open,\s*(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})/);
    if (logOpen) {
      timestamp = logOpen[1];
      category = 'System';
      events.push({ timestamp, category, message: 'Game started', raw: trimmed });
      if (!startTime) startTime = timestamp;
      continue;
    }

    // UE4 log format: [2026.07.19-08.34.12:305][  0]LogCategory: ...
    const ue4Match = trimmed.match(/^\[(\d{4}\.\d{2}\.\d{2})-(\d{2}\.\d{2}\.\d{2}:\d{3})\]\[\s*(\d+)\](Log\w+):\s*(Warning|Error)?:?\s*(.*)$/);
    if (ue4Match) {
      const [, datePart, timePart, _frame, cat, level, rest] = ue4Match;
      timestamp = `${datePart} ${timePart}`;
      category = cat;
      endTime = timestamp;
      const message = rest.trim();

      if (level === 'Warning') warnings++;
      if (level === 'Error') errors++;

      // Track events by category
      const event: LogEvent = { timestamp, category, message, raw: trimmed };

      // Squad quests
      if (message.includes('SquadQuests')) {
        const qMatch = message.match(/SquadQuests\s+(.+)/);
        if (qMatch && qMatch[1] !== 'List shared quests incoming from server') {
          quests.add(qMatch[1].trim());
        }
      }

      // Player name
      if (message.includes('steam user stats') || message.includes('user:')) {
        const pMatch = message.match(/user:\s*(\S+)/);
        if (pMatch) playerName = pMatch[1];
      }

      // Server pings
      if (cat === 'LogOnline' && message.includes('Failed to ping')) {
        const sMatch = message.match(/ping\s+([\d.]+)/);
        if (sMatch) servers.add(sMatch[1]);
      }

      // Region
      if (message.includes('Region changed to code')) {
        const rMatch = message.match(/code\s*=\s*"([^"]+)"/);
        if (rMatch) region = rMatch[1];
      }

      // Memory
      if (cat === 'LogMemory' && message.includes('Process Physical Memory')) {
        const m = message.match(/Process Physical Memory:\s*([\d.]+)\s*MB/);
        if (m) memory.physical = m[1];
      }

      events.push(event);
      continue;
    }

    // Other log formats (EOS SDK, ImportText, etc.)
    const genericMatch = trimmed.match(/^(Log\w+):\s*(Warning|Error)?:?\s*(.*)$/);
    if (genericMatch) {
      category = genericMatch[1];
      events.push({ timestamp, category, message: genericMatch[3].trim(), raw: trimmed });
    }
  }

  // Calculate session duration
  let sessionMinutes = 0;
  const sessions: { start: string; end: string; duration: string }[] = [];
  if (startTime && endTime) {
    // Parse approximate duration from timestamps
    const startParts = startTime.match(/(\d{2})\/(\d{2})\/\d{2}\s+(\d{2}:\d{2}:\d{2})/);
    const endParts = endTime.replace('.', ' ').match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2})\.(\d{2})\.(\d{2})/);
    if (startParts && endParts) {
      const startDate = new Date(2000 + parseInt(startParts[1]), parseInt(startParts[2]) - 1, 1, ...startParts[3].split(':').map(Number));
      const endDate = new Date(parseInt(endParts[1]), parseInt(endParts[2]) - 1, parseInt(endParts[3]), parseInt(endParts[4]), parseInt(endParts[5]), parseInt(endParts[6]));
      sessionMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      if (sessionMinutes > 0) {
        sessions.push({
          start: startTime,
          end: endTime,
          duration: sessionMinutes >= 60
            ? `${Math.floor(sessionMinutes / 60)}h ${sessionMinutes % 60}m`
            : `${sessionMinutes}m`,
        });
      }
    }
  }

  return {
    events,
    sessions,
    quests: [...quests].sort(),
    servers: [...servers].sort(),
    playerName,
    region,
    memory,
    stats: {
      totalLines: lines.length,
      warnings,
      errors,
      startTime,
      endTime,
      sessionMinutes,
    },
  };
}
