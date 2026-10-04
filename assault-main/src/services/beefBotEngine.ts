import { BeefBotLiveState, BeefBotTerminalLine } from '../types';

const KEYBOARD_LAYOUT: Record<string, string[]> = {
  q: ['w', 'a', '1', '2'],
  w: ['q', 'e', 's', 'a', '2', '3'],
  e: ['w', 'r', 'd', 's', '3', '4'],
  r: ['e', 't', 'f', 'd', '4', '5'],
  t: ['r', 'y', 'g', 'f', '5', '6'],
  y: ['t', 'u', 'h', 'g', '6', '7'],
  u: ['y', 'i', 'j', 'h', '7', '8'],
  i: ['u', 'o', 'k', 'j', '8', '9'],
  o: ['i', 'p', 'l', 'k', '9', '0'],
  p: ['o', '[', ';', 'l', '0', '-'],
  a: ['q', 'w', 's', 'z'],
  s: ['w', 'e', 'd', 'x', 'a', 'z'],
  d: ['e', 'r', 'f', 'c', 's', 'x'],
  f: ['r', 't', 'g', 'v', 'd', 'c'],
  g: ['t', 'y', 'h', 'b', 'f', 'v'],
  h: ['y', 'u', 'j', 'n', 'g', 'b'],
  j: ['u', 'i', 'k', 'm', 'h', 'n'],
  k: ['i', 'o', 'l', 'j', 'm'],
  l: ['o', 'p', ';', 'k'],
  z: ['a', 's', 'x'],
  x: ['z', 's', 'd', 'c'],
  c: ['x', 'd', 'f', 'v'],
  v: ['c', 'f', 'g', 'b'],
  b: ['v', 'g', 'h', 'n'],
  n: ['b', 'h', 'j', 'm'],
  m: ['n', 'j', 'k']
};

export class BeefBotEngine {
  private state: BeefBotLiveState = {
    active: false,
    targetUser: null,
    targetUserId: null,
    pingChance: 100,
    capsMode: false,
    triggerEnabled: true,
    afkEnabled: true,
    inAfkSequence: false,
    afkTriggered: false,
    rateLimited: false,
    currentWpm: 100,
    targetAfkCheckCount: 0,
    lastMsgTime: 0,
    prefix: '$',
    botReaction: null,
    reactTargets: {},
    gcWhitelist: ['981245781290', '1554236986515'],
    userWhitelist: [],
    gcTrapMessage: 'nice try trapping a god you fucking loser',
    normalWpmMin: 80,
    normalWpmMax: 120,
    slowWpm: 90,
    typoChance: 15,
    typoWordsMin: 1,
    typoWordsMax: 3,
    typoLettersPerWord: 1,
    jokeCount: 24,
    uptimeSeconds: 0
  };

  private terminalLogs: BeefBotTerminalLine[] = [
    {
      id: Date.now(),
      sender: 'SYSTEM',
      text: 'BeefBot AutoMod Daemon initialized. Prefix: $',
      isSystem: true,
      isCommand: false,
      timestamp: Date.now()
    }
  ];

  private jokesList: string[] = [
    'Why did the chicken cross the road? To get away from your terrible aim.',
    'Your rank is like a sinking ship, going down fast.',
    "I've seen bots with better game sense than you.",
    'Did you disconnect your monitor or are you always playing blind?',
    "You couldn't hit water if you fell out of a boat.",
    'Imagine talking trash while sitting at the bottom of the scoreboard.',
    'My ping is higher than your IQ.',
    'Are you using a trackball or just shaking?',
    'Even tutorial NPCs put up more of a fight.',
    'You run from every 1v1 like you left the stove on.',
    "I'd roast you harder but nature already did the work.",
    'Your mic is louder than your skill.',
    "You play like you're using a steering wheel.",
    "I've seen better rotations in a microwave.",
    'Uninstall is free and saves everyone the headache.',
    'Who boosted you into this lobby?',
    'You miss 100% of the shots you take anyway.',
    'Nice try, maybe next season.',
    "You're proof that practice doesn't always make perfect.",
    'Go back to bot matches and warm up for another year.',
    'Your movement looks like a slideshow.',
    'Is your keyboard missing the W key?',
    "Don't worry, someone has to be at the bottom.",
    "I'm surprised you found the launch button."
  ];

  private listeners: Array<() => void> = [];
  private onSendMessageCallback?: (text: string) => void;

  constructor(onSendMessage?: (text: string) => void) {
    this.onSendMessageCallback = onSendMessage;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getState(): BeefBotLiveState {
    return { ...this.state, jokeCount: this.jokesList.length };
  }

  getLogs(): BeefBotTerminalLine[] {
    return [...this.terminalLogs];
  }

  logTerminal(sender: string, text: string, isSystem = false, isCommand = false) {
    this.terminalLogs = [
      {
        id: Date.now() + Math.random(),
        sender,
        text,
        isSystem,
        isCommand,
        timestamp: Date.now()
      },
      ...this.terminalLogs
    ].slice(0, 150);
    this.notify();
  }

  addTypos(text: string): string {
    if (this.state.typoChance <= 0) return text;
    const words = text.split(' ');
    const numWordsToAffect = Math.min(
      words.length,
      Math.floor(Math.random() * (this.state.typoWordsMax - this.state.typoWordsMin + 1)) +
        this.state.typoWordsMin
    );

    const affectedIndices = new Set<number>();
    while (affectedIndices.size < numWordsToAffect) {
      affectedIndices.add(Math.floor(Math.random() * words.length));
    }

    const modifiedWords = words.map((w, idx) => {
      if (!affectedIndices.has(idx) || w.length < 3) return w;
      if (Math.random() * 100 >= this.state.typoChance) return w;

      const charIdx = Math.floor(Math.random() * w.length);
      const originalChar = w[charIdx].toLowerCase();
      const neighbors = KEYBOARD_LAYOUT[originalChar];
      if (!neighbors || neighbors.length === 0) return w;

      const replacement = neighbors[Math.floor(Math.random() * neighbors.length)];
      return w.substring(0, charIdx) + replacement + w.substring(charIdx + 1);
    });

    return modifiedWords.join(' ');
  }

  generateCountedAfkResponse(count: number, username: string): string {
    if (count === 1) {
      const first = [
        "I'M HERE BITCH",
        'WHAT U WANT',
        "I'M NOT AFK RETARD",
        'STILL HERE FAGGOT',
        "WHAT'S GOOD",
        "I'M ACTIVE",
        'NOT AFK DUMBASS',
        "I'M RIGHT HERE PUSSY"
      ];
      return first[Math.floor(Math.random() * first.length)];
    }

    const templates = [
      `${count} AFK CHECKS FAGGOT FOCUS THE FUCK UP`,
      `AFK CHECK #${count} AND UR STILL FAILING?`,
      `WHY THE FUCK ARE YOU AFK CHECKING ME ${count} TIMES?`,
      `${count} FUCKING TIMES? GET A LIFE RETARD`,
      `THIS IS CHECK NUMBER ${count} YOU DUMB FUCK IM HERE`,
      count > 3 ? 'HOLY SHIT STOP FUCKING CHECKING ME' : "AGAIN? I'M HERE DUMBASS",
      `${count > 2 ? 'BRO' : 'NIGGA'} I'M LITERALLY RESPONDING EVERY TIME`,
      `YOU'VE CHECKED ME ${count} TIMES AND I'M STILL NOT AFK RETARD`,
      count > 3
        ? `${username.toUpperCase()} YOU'RE ACTUALLY BRAINDEAD CHECKING ME ${count} TIMES`
        : `CHECKED ME ${count} TIMES ALREADY YOU PARANOID FUCK`,
      `DO YOU NOT SEE ME RESPONDING? THAT'S ${count} CHECKS NOW`,
      `${count} CHECKS AND YOU STILL DON'T GET IT? I'M ACTIVE BITCH`,
      `"aFk ChEcK" FOR THE ${count}${count === 2 ? 'ND' : count === 3 ? 'RD' : 'TH'} TIME HEADASS`,
      `${count} TIMES YOU'VE PINGED ME AND I'M STILL HERE DORK`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateRetort(username: string, content = ''): string {
    const joke = this.jokesList[Math.floor(Math.random() * this.jokesList.length)];
    return `${joke} @${username}`;
  }

  dispatchMessage(text: string): string {
    let output = this.state.capsMode ? text.toUpperCase() : text;
    output = this.addTypos(output);
    this.logTerminal('BeefBot', output);
    if (this.onSendMessageCallback) {
      this.onSendMessageCallback(output);
    }
    return output;
  }

  handleIncomingMessage(
    authorId: string,
    authorUsername: string,
    content: string,
    isSelf: boolean,
    myId: string
  ): string | null {
    const s = this.state;
    const msgLower = content.toLowerCase();

    // 1. Reactions
    if (isSelf && s.botReaction) {
      this.logTerminal('SYSTEM', `[REACT] Bot reacted with ${s.botReaction}`, true);
    } else if (s.reactTargets[authorId]) {
      const emoji = s.reactTargets[authorId];
      this.logTerminal('SYSTEM', `[REACT] Reacted ${emoji} to ${authorUsername}`, true);
    }

    if (!s.triggerEnabled && !isSelf) return null;

    // 2. AFK Check Detection
    const checkPatterns = ['afk check', 'afkcheck', 'client check', 'clientcheck'];
    const isAfkCheck =
      checkPatterns.some((pattern) => msgLower.includes(pattern)) &&
      (content.includes(`<@${myId}>`) ||
        content.includes('@me') ||
        content.toLowerCase().includes('beefbot')) &&
      !isSelf;

    if (isAfkCheck) {
      const newCount = s.active && authorId === s.targetUserId ? s.targetAfkCheckCount + 1 : 1;
      this.state.targetAfkCheckCount = newCount;

      const sayMatch = content.match(/say\s*["']([^"']+)["']|say\s+(.+)$/i);
      if (sayMatch) {
        const textToSay = sayMatch[1] || sayMatch[2];
        const isSelfInsultAttempt =
          textToSay.toLowerCase().includes('bitch') ||
          textToSay.toLowerCase().includes('my') ||
          textToSay.toLowerCase().includes("i'm") ||
          textToSay.toLowerCase().includes('im');

        if (isSelfInsultAttempt) {
          const insults = [
            `I'M HERE FAGGOT ${authorUsername.toUpperCase()} IS MY BITCH`,
            `NICE TRY RETARD YOU'RE THE ONE WHO'S MY BITCH`,
            `I'M ACTIVE DUMBASS AND YOU'RE MY LITTLE SLUT`,
            `WHAT KIND OF LOSER TRIES THAT SHIT? ${authorUsername.toUpperCase()} = MY BITCH`
          ];
          return this.dispatchMessage(insults[Math.floor(Math.random() * insults.length)]);
        }
        return this.dispatchMessage(textToSay);
      }

      const afkReply = this.generateCountedAfkResponse(newCount, authorUsername);
      this.logTerminal('SYSTEM', `[AFK CHECK] From ${authorUsername} (check #${newCount})`, true);
      return this.dispatchMessage(afkReply);
    }

    // 3. Activation on direct mention
    if (
      !s.active &&
      (content.includes(`<@${myId}>`) || content.includes('@me')) &&
      !isSelf &&
      !s.userWhitelist.includes(authorId)
    ) {
      this.state.active = true;
      this.state.targetUser = authorUsername;
      this.state.targetUserId = authorId;
      this.state.lastMsgTime = Date.now();
      this.state.targetAfkCheckCount = 0;
      this.state.currentWpm = Math.floor(
        Math.random() * (s.normalWpmMax - s.normalWpmMin + 1) + s.normalWpmMin
      );

      this.logTerminal('SYSTEM', `[ACTIVATION] Bot activated by target: ${authorUsername}`, true);
      const joke = this.jokesList[Math.floor(Math.random() * this.jokesList.length)];
      const msg = Math.random() * 100 < s.pingChance ? `${joke} <@${authorId}>` : joke;
      return this.dispatchMessage(msg);
    }

    // 4. Insult Counter-fire if already targeting
    if (s.active && !isSelf && (content.includes(`<@${myId}>`) || content.includes('@me'))) {
      const joke = this.jokesList[Math.floor(Math.random() * this.jokesList.length)];
      return this.dispatchMessage(joke);
    }

    return null;
  }

  executeCommand(rawCmd: string): string {
    const trimmed = rawCmd.trim();
    this.logTerminal('USER', trimmed, false, true);

    const prefix = this.state.prefix;
    const body = trimmed.startsWith(prefix) ? trimmed.substring(prefix.length).trim() : trimmed;
    const parts = body.split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    let response = '';

    switch (cmd) {
      case 'tc': {
        const mode = args[0]?.toLowerCase();
        if (mode === 'on' || mode === 'off') {
          this.state.triggerEnabled = mode === 'on';
          response = `trigger control ${this.state.triggerEnabled ? 'ENABLED' : 'DISABLED'}`;
        } else {
          response = `usage: ${prefix}tc <on/off>`;
        }
        break;
      }

      case 'typochance':
      case 'typo': {
        const val = parseInt(args[0], 10);
        if (isNaN(val)) {
          response = `current typo chance: ${this.state.typoChance}%\nusage: ${prefix}typochance <0-100>`;
        } else if (val >= 0 && val <= 100) {
          this.state.typoChance = val;
          response = `typo chance set to ${val}%`;
        } else {
          response = 'chance must be a number between 0 and 100';
        }
        break;
      }

      case 'r': {
        if (args.length === 0) {
          response = `usage: ${prefix}r <emoji> [@user] or ${prefix}r @user (to remove)`;
        } else if (args[0].startsWith('<@') && args[0].endsWith('>')) {
          const uid = args[0].replace(/[<@!>]/g, '');
          if (this.state.reactTargets[uid]) {
            delete this.state.reactTargets[uid];
            response = 'removed user from react list';
          } else {
            response = 'user not in react list';
          }
        } else {
          const emoji = args[0];
          if (args.length > 1 && args[1].startsWith('<@')) {
            const uid = args[1].replace(/[<@!>]/g, '');
            this.state.reactTargets[uid] = emoji;
            response = `reaction ${emoji} set for user <@${uid}>`;
          } else {
            this.state.botReaction = emoji;
            response = `reaction ${emoji} set for bot messages`;
          }
        }
        break;
      }

      case 'rlist': {
        const lines = ['ACTIVE REACTIONS:'];
        if (this.state.botReaction) lines.push(`• Bot messages: ${this.state.botReaction}`);
        for (const [uid, em] of Object.entries(this.state.reactTargets)) {
          lines.push(`• User ${uid}: ${em}`);
        }
        if (!this.state.botReaction && Object.keys(this.state.reactTargets).length === 0) {
          lines.push('• No active reactions configured');
        }
        response = lines.join('\n');
        break;
      }

      case 'rend': {
        this.state.botReaction = null;
        this.state.reactTargets = {};
        response = 'auto-reactions stopped';
        break;
      }

      case 'jw': {
        const word = args[0]?.toLowerCase();
        if (!word) {
          response = `usage: ${prefix}jw <word>`;
        } else {
          const before = this.jokesList.length;
          this.jokesList = this.jokesList.filter((j) => !j.toLowerCase().includes(word));
          const removed = before - this.jokesList.length;
          response =
            removed > 0
              ? `removed ${removed} jokes containing '${word}'`
              : `no jokes found containing '${word}'`;
        }
        break;
      }

      case 'jc': {
        response = `Total jokes loaded in memory: ${this.jokesList.length}`;
        break;
      }

      case 'shuffle': {
        this.jokesList = [...this.jokesList].sort(() => Math.random() - 0.5);
        response = 'joke cycle shuffled';
        break;
      }

      case 'agct': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'wl') {
          const action = args[1]?.toLowerCase();
          const target = args[2];
          if (action === 'add' && target) {
            const uid = target.replace(/[<@!>]/g, '');
            this.state.gcWhitelist = [...new Set([...this.state.gcWhitelist, uid])];
            response = `added user ${uid} to GC whitelist`;
          } else if (action === 'remove' && target) {
            const uid = target.replace(/[<@!>]/g, '');
            this.state.gcWhitelist = this.state.gcWhitelist.filter((u) => u !== uid);
            response = `removed user ${uid} from GC whitelist`;
          } else if (action === 'list') {
            response = `GC Whitelisted: ${this.state.gcWhitelist.join(', ') || 'None'}`;
          } else {
            response = `usage: ${prefix}agct wl <add/remove/list> [@user]`;
          }
        } else if (sub === 'msg') {
          const newMsg = args.slice(1).join(' ');
          if (newMsg) {
            this.state.gcTrapMessage = newMsg;
            response = `agct trap message updated to: "${newMsg}"`;
          } else {
            response = `usage: ${prefix}agct msg <text>`;
          }
        } else {
          response = `usage: ${prefix}agct <wl/msg> [args]`;
        }
        break;
      }

      case 'stop': {
        this.state.active = false;
        this.state.targetUser = null;
        this.state.targetUserId = null;
        this.state.targetAfkCheckCount = 0;
        response = 'bot stopped';
        break;
      }

      case 'status':
      case 's': {
        response = `BOT STATUS:
• Active: ${this.state.active ? 'YES' : 'NO'}
• Target: ${this.state.targetUser || 'None'}
• Ping Chance: ${this.state.pingChance}%
• Caps Mode: ${this.state.capsMode ? 'ON' : 'OFF'}
• AFK Monitor: ${this.state.afkEnabled ? 'ON' : 'OFF'}
• Triggers: ${this.state.triggerEnabled ? 'ENABLED' : 'DISABLED'}
• Reactions: ${Object.keys(this.state.reactTargets).length} targets
• Typo Chance: ${this.state.typoChance}%
• WPM: ${this.state.currentWpm} WPM`;
        break;
      }

      case 'caps': {
        const mode = args[0]?.toLowerCase();
        if (mode === 'on' || mode === 'off') {
          this.state.capsMode = mode === 'on';
          response = `caps mode ${this.state.capsMode ? 'ENABLED' : 'DISABLED'}`;
        } else {
          this.state.capsMode = !this.state.capsMode;
          response = `caps mode toggled ${this.state.capsMode ? 'ON' : 'OFF'}`;
        }
        break;
      }

      case 'pingchance': {
        const val = parseInt(args[0], 10);
        if (isNaN(val)) {
          response = `current ping chance: ${this.state.pingChance}%\nusage: ${prefix}pingchance <0-100>`;
        } else if (val >= 0 && val <= 100) {
          this.state.pingChance = val;
          response = `ping chance set to ${val}%`;
        } else {
          response = 'chance must be 0-100';
        }
        break;
      }

      case 'wpm': {
        const min = parseInt(args[0], 10);
        const max = parseInt(args[1], 10);
        if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
          this.state.normalWpmMin = min;
          this.state.normalWpmMax = max;
          response = `WPM range set to ${min}-${max} WPM`;
        } else {
          response = `usage: ${prefix}wpm <min> <max> (current: ${this.state.normalWpmMin}-${this.state.normalWpmMax})`;
        }
        break;
      }

      case 'prefix': {
        if (args[0]) {
          this.state.prefix = args[0];
          response = `prefix updated to '${args[0]}'`;
        } else {
          response = `current prefix: '${this.state.prefix}'`;
        }
        break;
      }

      case 'help':
      case 'h': {
        response = `BEEFBOT COMMANDS:
${prefix}s / ${prefix}status - Show bot active state
${prefix}stop - Deactivate target pursuit
${prefix}tc <on/off> - Toggle trigger responses
${prefix}caps <on/off> - Toggle all-caps screaming
${prefix}typo <0-100> - Set realistic typo percentage
${prefix}pingchance <0-100> - Set target mention probability
${prefix}wpm <min> <max> - Set simulated typing rate
${prefix}r <emoji> [@user] - Add auto reaction
${prefix}rlist / ${prefix}rend - View or clear reactions
${prefix}jc / ${prefix}shuffle - Joke database stats & shuffle
${prefix}jw <word> - Delete jokes matching word
${prefix}agct <wl/msg> - Anti-Group-Chat trap config`;
        break;
      }

      default:
        response = `unknown command '${cmd}'. Type ${prefix}help for command list.`;
        break;
    }

    this.logTerminal('BeefBot', response, false, false);
    this.notify();
    return response;
  }
}
