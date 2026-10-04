import { DiscordServer, DiscordChannel, DiscordMessage, DiscordUser } from '../types';

export interface GatewayStatus {
  connected: boolean;
  connecting: boolean;
  sessionId: string | null;
  ping: number;
  lastEvent: string | null;
  error: string | null;
  mode: 'GATEWAY_LIVE' | 'LOCAL_WRAPPER';
}

type GatewayEventCallback = (event: string, data: any) => void;

export class DiscordGatewayEngine {
  private ws: WebSocket | null = null;
  private heartbeatInterval: number | null = null;
  private sequence: number | null = null;
  private sessionId: string | null = null;
  private token: string | null = null;
  private listeners: Set<GatewayEventCallback> = new Set();
  private statusListeners: Set<(status: GatewayStatus) => void> = new Set();
  private lastPingSent: number = 0;

  public status: GatewayStatus = {
    connected: false,
    connecting: false,
    sessionId: null,
    ping: 24,
    lastEvent: null,
    mode: 'LOCAL_WRAPPER',
    error: null,
  };

  public onEvent(cb: GatewayEventCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onStatusChange(cb: (status: GatewayStatus) => void): () => void {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  private updateStatus(partial: Partial<GatewayStatus>) {
    this.status = { ...this.status, ...partial };
    this.statusListeners.forEach((cb) => cb(this.status));
  }

  private emit(event: string, data: any) {
    this.updateStatus({ lastEvent: event });
    this.listeners.forEach((cb) => cb(event, data));
  }

  /**
   * Fetch from Discord v10 REST API via our local server proxy (/api/discord/*)
   */
  public async restRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('No active Discord token configured for REST call.');
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await fetch(`/api/discord${cleanEndpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Discord-Token': this.token,
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errBody.message || `Discord API HTTP ${res.status}`);
    }
    if (res.status === 204) return null as unknown as T;
    return res.json();
  }

  /**
   * Connect to real Discord Gateway v10 WebSocket
   */
  public async connect(token: string): Promise<boolean> {
    this.disconnect();
    const cleanToken = token.trim();
    if (!cleanToken) return false;

    this.token = cleanToken;
    this.updateStatus({
      connecting: true,
      error: null,
      mode: 'GATEWAY_LIVE',
    });

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
        this.ws = ws;

        const timeout = window.setTimeout(() => {
          if (!this.status.connected) {
            this.updateStatus({
              connecting: false,
              error: 'Gateway connection timed out',
            });
            resolve(false);
          }
        }, 12000);

        ws.onopen = () => {
          this.lastPingSent = Date.now();
        };

        ws.onmessage = (msgEvent) => {
          try {
            const payload = JSON.parse(msgEvent.data);
            const { op, d, s, t } = payload;

            if (s !== null && s !== undefined) {
              this.sequence = s;
            }

            switch (op) {
              case 10: {
                // HELLO: start heartbeating and send IDENTIFY
                const interval = d.heartbeat_interval || 41250;
                this.startHeartbeat(interval);
                this.identify(cleanToken);
                break;
              }
              case 11: {
                // HEARTBEAT ACK
                const rtt = Math.max(8, Date.now() - this.lastPingSent);
                this.updateStatus({ ping: rtt });
                break;
              }
              case 0: {
                // DISPATCH
                if (t === 'READY') {
                  window.clearTimeout(timeout);
                  this.sessionId = d.session_id;
                  this.updateStatus({
                    connected: true,
                    connecting: false,
                    sessionId: d.session_id,
                    error: null,
                  });
                  this.emit('READY', d);
                  resolve(true);
                } else {
                  this.emit(t, d);
                }
                break;
              }
              case 9: {
                // INVALID SESSION
                window.clearTimeout(timeout);
                this.updateStatus({
                  connected: false,
                  connecting: false,
                  error: 'Invalid Discord token or session expired (OP 9)',
                  mode: 'LOCAL_WRAPPER',
                });
                this.disconnect();
                resolve(false);
                break;
              }
            }
          } catch (err) {
            console.error('[Assault Gateway] Failed to parse frame:', err);
          }
        };

        ws.onerror = () => {
          window.clearTimeout(timeout);
          this.updateStatus({
            connected: false,
            connecting: false,
            error: 'WebSocket error connecting to gateway.discord.gg',
          });
          resolve(false);
        };

        ws.onclose = (ev) => {
          window.clearTimeout(timeout);
          if (this.heartbeatInterval) {
            window.clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
          }
          const closeErr =
            ev.code === 4004
              ? 'Authentication failed (4004): Invalid Discord token'
              : ev.code !== 1000
              ? `Gateway closed (${ev.code}: ${ev.reason || 'Disconnected'})`
              : null;

          this.updateStatus({
            connected: false,
            connecting: false,
            error: closeErr,
            mode: 'LOCAL_WRAPPER',
          });
          resolve(false);
        };
      } catch (e: any) {
        this.updateStatus({
          connected: false,
          connecting: false,
          error: e?.message || 'Failed to initialize WebSocket',
          mode: 'LOCAL_WRAPPER',
        });
        resolve(false);
      }
    });
  }

  private startHeartbeat(intervalMs: number) {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingSent = Date.now();
        this.ws.send(JSON.stringify({ op: 1, d: this.sequence }));
      }
    }, intervalMs);
  }

  private identify(token: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const identifyPayload = {
      op: 2,
      d: {
        token,
        capabilities: 16381,
        properties: {
          os: 'Linux',
          browser: 'Discord Client',
          device: 'Assault Wrapper',
          system_locale: 'en-US',
          browser_user_agent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) discord/0.0.72 Chrome/128.0.6613.186 Electron/32.2.2 Safari/537.36',
          browser_version: '32.2.2',
          os_version: '6.8.0',
          client_build_number: 349182,
        },
        presence: {
          status: 'online',
          since: 0,
          activities: [
            {
              name: 'Assault Wrapper v2.5.0',
              type: 0,
            },
          ],
          afk: false,
        },
        compress: false,
      },
    };
    this.ws.send(JSON.stringify(identifyPayload));
  }

  public disconnect() {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000);
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.sequence = null;
    this.sessionId = null;
    this.updateStatus({
      connected: false,
      connecting: false,
      sessionId: null,
      mode: 'LOCAL_WRAPPER',
    });
  }

  /**
   * Transform Discord Gateway READY payload into Assault's unified Discord data structures
   */
  public static mapReadyPayload(d: any): {
    user: DiscordUser;
    servers: DiscordServer[];
    dmChannels: DiscordChannel[];
  } {
    const rawUser = d.user || {};
    const avatarUrl = rawUser.avatar
      ? `https://cdn.discordapp.com/avatars/${rawUser.id}/${rawUser.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${Number(rawUser.discriminator || 0) % 5}.png`;

    const user: DiscordUser = {
      id: rawUser.id || 'live_user',
      username: rawUser.username || 'discord_user',
      globalName: rawUser.global_name || rawUser.username || 'Discord User',
      discriminator: rawUser.discriminator || '0000',
      avatarUrl,
      avatar: avatarUrl,
      status: 'ONLINE',
      customStatus: 'Connected via Assault Live Gateway v10',
      bio: rawUser.bio || 'Assault Discord Wrapper — Live Gateway Session',
      pronouns: rawUser.pronouns || '',
      bannerColor: rawUser.banner_color || '#5865f2',
      badges: ['NITRO', 'EARLY_SUPPORTER', 'ACTIVE_DEVELOPER'],
      createdAt: 'Discord Account',
    };

    const rawGuilds = Array.isArray(d.guilds) ? d.guilds : [];
    const servers: DiscordServer[] = rawGuilds.slice(0, 50).map((g: any) => {
      const props = g.properties || g;
      const guildId = g.id || props.id;
      const guildName = props.name || g.name || 'Discord Server';
      const iconHash = props.icon || g.icon;
      const iconUrl = iconHash
        ? `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png?size=128`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(guildName)}&background=313338&color=dbdee1&bold=true`;

      const rawChannels = Array.isArray(g.channels) ? g.channels : [];
      const categoriesMap = new Map<string, string>();
      rawChannels.forEach((c: any) => {
        if (c.type === 4) {
          categoriesMap.set(c.id, (c.name || 'CHANNELS').toUpperCase());
        }
      });

      const mappedChannels: DiscordChannel[] = rawChannels
        .filter((c: any) => c.type === 0 || c.type === 2 || c.type === 5 || c.type === 15)
        .map((c: any) => ({
          id: c.id,
          name: c.name || 'general',
          type: c.type === 2 ? 'voice' : c.type === 5 ? 'announcement' : c.type === 15 ? 'forum' : 'text',
          category: (c.parent_id && categoriesMap.get(c.parent_id)) || 'TEXT CHANNELS',
          topic: c.topic || '',
          unreadCount: 0,
        }));

      if (mappedChannels.length === 0) {
        mappedChannels.push({
          id: `${guildId}_general`,
          name: 'general',
          type: 'text',
          category: 'TEXT CHANNELS',
          topic: 'Live Discord Server',
        });
      }

      return {
        id: guildId,
        name: guildName,
        icon: iconUrl,
        unread: false,
        mentions: 0,
        memberCount: g.member_count || 100,
        onlineCount: Math.max(1, Math.floor((g.member_count || 20) * 0.25)),
        boostLevel: props.premium_tier || 0,
        boostCount: props.premium_subscription_count || 0,
        channels: mappedChannels,
      };
    });

    const rawPrivate = Array.isArray(d.private_channels) ? d.private_channels : [];
    const dmChannels: DiscordChannel[] = rawPrivate.slice(0, 30).map((dm: any) => {
      const recipient = (dm.recipients && dm.recipients[0]) || {};
      const rName = recipient.global_name || recipient.username || dm.name || 'Direct Message';
      const rAvatar = recipient.avatar
        ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;

      return {
        id: dm.id,
        name: rName,
        type: 'dm',
        recipient: {
          id: recipient.id || dm.id,
          username: recipient.username || rName.toLowerCase().replace(/\s+/g, '_'),
          globalName: rName,
          discriminator: recipient.discriminator || '0',
          avatar: rAvatar,
          status: 'online',
        },
      };
    });

    return { user, servers, dmChannels };
  }

  /**
   * Transform a Discord API Message object into Assault's DiscordMessage
   */
  public static mapApiMessage(m: any): DiscordMessage {
    const author = m.author || {};
    const avatarUrl = author.avatar
      ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    const d = m.timestamp ? new Date(m.timestamp) : new Date();

    return {
      id: m.id || `msg_${Date.now()}`,
      channelId: m.channel_id,
      author: {
        id: author.id || 'unknown',
        username: author.username || 'user',
        globalName: author.global_name || author.username || 'User',
        discriminator: author.discriminator || '0',
        avatarUrl,
        avatar: avatarUrl,
        status: 'ONLINE',
        isBot: Boolean(author.bot),
        badges: [],
      },
      content: m.content || '',
      timestamp: d.getTime(),
      isEdited: Boolean(m.edited_timestamp),
      editHistory: [],
      isDeleted: false,
      reactions: Array.isArray(m.reactions)
        ? m.reactions.map((r: any) => ({
            emoji: r.emoji?.name || '👍',
            count: r.count || 1,
            me: Boolean(r.me),
          }))
        : [],
      attachments: Array.isArray(m.attachments)
        ? m.attachments.map((a: any) => ({
            id: a.id || `att_${Date.now()}`,
            name: a.filename || 'attachment',
            size: `${Math.round((a.size || 1024) / 1024)} KB`,
            url: a.url || a.proxy_url || '',
            type: (a.content_type || '').startsWith('image/') ? 'image' : 'file',
          }))
        : [],
    };
  }
}

export const discordGateway = new DiscordGatewayEngine();
