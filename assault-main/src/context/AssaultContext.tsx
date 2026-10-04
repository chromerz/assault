import React, { createContext, useContext, useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  DiscordUser,
  DiscordGuild,
  DiscordChannel,
  DiscordMessage,
  AssaultSettings,
  AssaultPlugin,
  PluginSource,
  SavedAccount,
  DiscordQuest,
  DeletedSnipe,
  EditSnipe,
  FleetBot,
  DefenseSettings,
  BeefBotConfig,
  BeefEscalationLevel,
  UserStatus,
  DiscordCollectableItem,
  DiscordBillingPlan,
  DiscordPaymentMethod,
  DiscordGiftItem,
  DiscordInvoice,
  ClientBuildInfo
} from '../types';
import {
  INITIAL_COLLECTIBLES,
  NITRO_PLANS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_INVOICES,
  INITIAL_GIFTS
} from '../services/discordBillingEngine';
import {
  INITIAL_USER,
  INITIAL_GUILDS,
  INITIAL_CHANNELS,
  INITIAL_MESSAGES,
  INITIAL_SETTINGS,
  INITIAL_PLUGINS,
  INITIAL_ACCOUNTS,
  INITIAL_QUESTS,
  INITIAL_DELETED_SNIPES,
  INITIAL_EDIT_SNIPES,
  INITIAL_FLEET_BOTS,
  INITIAL_DEFENSE,
  INITIAL_BEEFBOT_CONFIG
} from '../data/initialData';
import { BeefBotEngine } from '../services/beefBotEngine';
import { ClientManagerEngine, INITIAL_CLIENT_BUILD_INFO } from '../services/clientManagerEngine';
import { CssThemeEngine } from '../services/cssThemeEngine';
import { soundboard } from '../services/soundboardAudio';
import { DEFAULT_PLUGIN_SOURCES } from '../services/pluginSourcesEngine';
import { discordGateway, DiscordGatewayEngine, GatewayStatus } from '../services/discordGatewayService';

interface AssaultContextType {
  currentUser: DiscordUser;
  updateCurrentUserStatus: (status: UserStatus, customStatus?: string) => void;
  updateCurrentUserProfile: (profile: Partial<DiscordUser>) => void;
  guilds: DiscordGuild[];
  addGuild: (name: string, description?: string, iconUrl?: string) => void;
  activeGuildId: string | null;
  selectGuild: (guildId: string | null) => void;
  channels: DiscordChannel[];
  addChannel: (guildId: string, name: string, type?: 'GUILD_TEXT' | 'GUILD_VOICE') => void;
  activeChannelId: string | null;
  selectChannel: (channelId: string) => void;
  activeChannel: DiscordChannel | null;
  activeGuild: DiscordGuild | null;
  messages: DiscordMessage[];
  filteredMessages: DiscordMessage[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sendMessage: (content: string, replyTo?: DiscordMessage | null, attachments?: string[]) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  batchDeleteMessages: (ids: string[]) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  replyingTo: DiscordMessage | null;
  setReplyingTo: (msg: DiscordMessage | null) => void;
  settings: AssaultSettings;
  updateSettings: (updater: Partial<AssaultSettings> | ((prev: AssaultSettings) => AssaultSettings)) => void;
  plugins: AssaultPlugin[];
  togglePlugin: (pluginId: string) => void;
  installPlugin: (name: string, description: string, author: string, scriptCode?: string, sourceName?: string) => void;
  pluginSources: PluginSource[];
  addPluginSource: (name: string, url: string, description?: string) => void;
  togglePluginSource: (id: string) => void;
  removePluginSource: (id: string) => void;
  syncPluginSource: (id: string) => void;
  pinnedMessages: DiscordMessage[];
  togglePinMessage: (messageId: string) => void;
  playAudio: (type: string) => void;
  isSpeaking: boolean;
  setIsSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  accounts: SavedAccount[];
  switchAccount: (accountId: string) => void;
  connectToken: (token: string, isBot: boolean) => Promise<boolean>;
  gatewayStatus: GatewayStatus;
  activeMode: 'NATIVE_APP' | 'DISCORD_OFFICIAL_WEB';
  setActiveMode: (mode: 'NATIVE_APP' | 'DISCORD_OFFICIAL_WEB') => void;
  activeAccountToken: string;
  quests: DiscordQuest[];
  enrollQuest: (id: string) => void;
  claimQuest: (id: string) => void;
  completeAllQuests: () => void;
  deletedSnipes: DeletedSnipe[];
  editSnipes: EditSnipe[];
  clearAllSnipes: () => void;
  fleetBots: FleetBot[];
  massJoinVoice: (channelName: string) => void;
  massLeaveVoice: () => void;
  broadcastSay: (text: string) => void;
  defense: DefenseSettings;
  toggleAgct: (enabled: boolean) => void;
  updateTrapMessage: (msg: string) => void;
  addAgctWhitelist: (userId: string) => void;
  removeAgctWhitelist: (userId: string) => void;
  toggleSilenceUser: (userId: string) => void;
  beefBotConfig: BeefBotConfig;
  toggleBeefBotRule: (ruleKey: string, enabled: boolean) => void;
  setBeefEscalation: (level: BeefEscalationLevel) => void;
  addCustomCommand: (trigger: string, response: string, permissionLevel: string) => void;
  toggleCustomCommand: (commandId: string) => void;
  deleteCustomCommand: (commandId: string) => void;
  clearBeefIncidents: () => void;
  beefBotEngine: BeefBotEngine;
  clientManagerEngine: ClientManagerEngine;
  clientBuild: ClientBuildInfo;
  checkForClientUpdates: () => void;
  installClientUpdate: () => void;
  repairClientHooks: () => void;
  switchBuildChannel: (channel: 'stable' | 'beta' | 'nightly') => void;
  switchRootMode: (mode: 'non-root' | 'root-mount') => void;
  connectedVoiceChannelId: string | null;
  toggleVoiceChannel: (channelId: string) => void;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isDeafened: boolean;
  setIsDeafened: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: 'client' | 'manager';
  setViewMode: (mode: 'client' | 'manager') => void;
  gatewayState: string;
  iconPack: string;
  setIconPack: (packId: string) => void;
  collectibles: DiscordCollectableItem[];
  buyCollectable: (id: string, useOrbs?: boolean) => boolean;
  equipCollectable: (id: string) => void;
  unequipCollectable: (category: 'AVATAR_DECORATION' | 'PROFILE_EFFECT') => void;
  toggleWishlist: (id: string) => void;
  nitroPlan: 'NONE' | 'NITRO_BASIC' | 'NITRO' | 'ANNUAL';
  subscribeNitro: (tier: 'BASIC' | 'NITRO' | 'ANNUAL') => void;
  cancelNitro: () => void;
  boostServer: (guildId: string) => void;
  paymentMethods: DiscordPaymentMethod[];
  addPaymentMethod: (brand: 'VISA' | 'MASTERCARD' | 'PAYPAL', last4: string, expiry: string) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  invoices: DiscordInvoice[];
  gifts: DiscordGiftItem[];
  createGift: (planName: string, theme: string) => DiscordGiftItem;
  redeemGift: (code: string) => { success: boolean; message: string };
}

const AssaultContext = createContext<AssaultContextType | null>(null);

export const AssaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DiscordUser>(INITIAL_USER);
  const [guilds, setGuilds] = useState<DiscordGuild[]>(INITIAL_GUILDS);
  const [activeGuildId, setActiveGuildId] = useState<string | null>('guild_assault_dev');
  const [channels, setChannels] = useState<DiscordChannel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string | null>('ch_general');
  const [messages, setMessages] = useState<DiscordMessage[]>(INITIAL_MESSAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<DiscordMessage | null>(null);
  const [settings, setSettings] = useState<AssaultSettings>(INITIAL_SETTINGS);
  const [plugins, setPlugins] = useState<AssaultPlugin[]>(INITIAL_PLUGINS);
  const [accounts, setAccounts] = useState<SavedAccount[]>(INITIAL_ACCOUNTS);
  const [quests, setQuests] = useState<DiscordQuest[]>(INITIAL_QUESTS);
  const [deletedSnipes, setDeletedSnipes] = useState<DeletedSnipe[]>(INITIAL_DELETED_SNIPES);
  const [editSnipes, setEditSnipes] = useState<EditSnipe[]>(INITIAL_EDIT_SNIPES);
  const [fleetBots, setFleetBots] = useState<FleetBot[]>(INITIAL_FLEET_BOTS);
  const [defense, setDefense] = useState<DefenseSettings>(INITIAL_DEFENSE);
  const [beefBotConfig, setBeefBotConfig] = useState<BeefBotConfig>(INITIAL_BEEFBOT_CONFIG);
  const [connectedVoiceChannelId, setConnectedVoiceChannelId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [viewMode, setViewMode] = useState<'client' | 'manager'>('client');
  const [gatewayState] = useState('Debloated Gateway & Live Ready');
  const [iconPack, setIconPack] = useState('default');

  const [pluginSources, setPluginSources] = useState<PluginSource[]>(DEFAULT_PLUGIN_SOURCES);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Real Discord Collectibles & Shop state
  const [collectibles, setCollectibles] = useState<DiscordCollectableItem[]>(() => {
    try {
      const saved = localStorage.getItem('assault_collectibles');
      return saved ? JSON.parse(saved) : INITIAL_COLLECTIBLES;
    } catch {
      return INITIAL_COLLECTIBLES;
    }
  });

  // Real Discord Nitro Subscription state
  const [nitroPlan, setNitroPlan] = useState<'NONE' | 'NITRO_BASIC' | 'NITRO' | 'ANNUAL'>(() => {
    try {
      const saved = localStorage.getItem('assault_nitro_plan');
      return (saved as any) || 'NITRO';
    } catch {
      return 'NITRO';
    }
  });

  // Real Discord Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<DiscordPaymentMethod[]>(() => {
    try {
      const saved = localStorage.getItem('assault_payment_methods');
      return saved ? JSON.parse(saved) : INITIAL_PAYMENT_METHODS;
    } catch {
      return INITIAL_PAYMENT_METHODS;
    }
  });

  // Real Discord Invoices & Receipts
  const [invoices, setInvoices] = useState<DiscordInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('assault_invoices');
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  // Real Discord Gift Inventory
  const [gifts, setGifts] = useState<DiscordGiftItem[]>(() => {
    try {
      const saved = localStorage.getItem('assault_gifts');
      return saved ? JSON.parse(saved) : INITIAL_GIFTS;
    } catch {
      return INITIAL_GIFTS;
    }
  });

  // Persistent storage sync
  useEffect(() => {
    try {
      localStorage.setItem('assault_collectibles', JSON.stringify(collectibles));
      localStorage.setItem('assault_nitro_plan', nitroPlan);
      localStorage.setItem('assault_payment_methods', JSON.stringify(paymentMethods));
      localStorage.setItem('assault_invoices', JSON.stringify(invoices));
      localStorage.setItem('assault_gifts', JSON.stringify(gifts));
    } catch (err) {
      console.error('Storage sync error', err);
    }
  }, [collectibles, nitroPlan, paymentMethods, invoices, gifts]);

  // Live Gateway state and mode
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>(discordGateway.status);
  const [activeMode, setActiveMode] = useState<'NATIVE_APP' | 'DISCORD_OFFICIAL_WEB'>('NATIVE_APP');
  const activeAccountToken = useMemo(
    () => accounts.find((a) => a.isActive)?.token || '',
    [accounts]
  );

  useEffect(() => {
    return discordGateway.onStatusChange(setGatewayStatus);
  }, []);

  // Listen to Discord Gateway v10 Live Dispatch Events
  useEffect(() => {
    const unsub = discordGateway.onEvent((event, d) => {
      if (event === 'READY') {
        const mapped = DiscordGatewayEngine.mapReadyPayload(d);
        setCurrentUser((prev) => ({
          ...prev,
          ...mapped.user
        }));
        if (mapped.servers.length > 0) {
          const newGuilds: DiscordGuild[] = mapped.servers.map((s) => ({
            id: s.id,
            name: s.name,
            iconUrl: s.icon,
            memberCount: s.memberCount,
            unreadCount: s.unread ? 1 : 0,
            description: `${s.memberCount} members`,
            ownerId: mapped.user.id
          }));
          setGuilds(newGuilds);
          const allChannels: DiscordChannel[] = mapped.servers.flatMap((s) =>
            s.channels.map((ch) => ({
              ...ch,
              guildId: s.id
            }))
          );
          setChannels((prev) => [...prev, ...allChannels, ...mapped.dmChannels]);
          if (mapped.servers[0]) {
            setActiveGuildId(mapped.servers[0].id);
            if (mapped.servers[0].channels[0]) {
              setActiveChannelId(mapped.servers[0].channels[0].id);
            }
          }
        }
      } else if (event === 'MESSAGE_CREATE') {
        const mappedMsg = DiscordGatewayEngine.mapApiMessage(d);
        setMessages((prev) => {
          if (prev.some((m) => m.id === mappedMsg.id)) return prev;
          return [...prev, mappedMsg];
        });
      } else if (event === 'MESSAGE_DELETE') {
        const deletedId = d.id;
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === deletedId) {
              setDeletedSnipes((snipes) => [
                {
                  id: `snipe_${Date.now()}`,
                  channelId: msg.channelId,
                  channelName: channels.find((c) => c.id === msg.channelId)?.name || 'chat',
                  authorName: msg.author.globalName || msg.author.username,
                  authorId: msg.author.id,
                  content: msg.content,
                  timestamp: Date.now(),
                  attachments: msg.attachments
                },
                ...snipes
              ]);
              if (settings.antiDelete) {
                return { ...msg, isDeleted: true, deletedTimestamp: Date.now() };
              }
              return null as any;
            }
            return msg;
          }).filter(Boolean)
        );
      } else if (event === 'MESSAGE_UPDATE') {
        const updatedId = d.id;
        if (d.content) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === updatedId && d.content !== msg.content) {
                setEditSnipes((snipes) => [
                  {
                    id: `snipe_edit_${Date.now()}`,
                    channelId: msg.channelId,
                    channelName: channels.find((c) => c.id === msg.channelId)?.name || 'chat',
                    authorName: msg.author.globalName || msg.author.username,
                    authorId: msg.author.id,
                    oldContent: msg.content,
                    newContent: d.content,
                    timestamp: Date.now()
                  },
                  ...snipes
                ]);
                const history = msg.editHistory ? [...msg.editHistory, msg.content] : [msg.content];
                return { ...msg, content: d.content, isEdited: true, editHistory: history };
              }
              return msg;
            })
          );
        }
      }
    });
    return unsub;
  }, [settings.antiDelete, settings.antiEdit, channels]);

  // Singletons
  const beefBotEngine = useMemo(
    () =>
      new BeefBotEngine((text) => {
        // Callback when beefbot generates an automated response
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_beef_${Date.now()}_${Math.random()}`,
            channelId: 'ch_general',
            author: {
              id: 'u_beefbot',
              username: 'BeefBot',
              globalName: 'BeefBot AutoMod',
              avatarUrl:
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop',
              isBot: true,
              roleColor: '#23a55a',
              badges: [{ id: 'bot', title: 'Verified Bot', iconLabel: '⚙️', colorHex: '#5865f2' }],
              status: 'ONLINE'
            },
            content: text,
            timestamp: Date.now(),
            reactions: [{ emoji: '🥩', count: 1, userReacted: false }]
          }
        ]);
      }),
    []
  );

  const clientManagerEngine = useMemo(() => new ClientManagerEngine(), []);

  const [clientBuild, setClientBuild] = useState<ClientBuildInfo>(INITIAL_CLIENT_BUILD_INFO);

  const checkForClientUpdates = () => {
    setClientBuild((prev) => ({
      ...prev,
      lastChecked: 'Just now (' + new Date().toLocaleTimeString() + ')'
    }));
  };

  const installClientUpdate = () => {
    setClientBuild((prev) => ({
      ...prev,
      installedVersion: prev.latestVersion,
      isPatched: true
    }));
  };

  const repairClientHooks = () => {
    setClientBuild((prev) => ({
      ...prev,
      isPatched: true
    }));
  };

  const switchBuildChannel = (channel: 'stable' | 'beta' | 'nightly') => {
    setClientBuild((prev) => ({
      ...prev,
      buildChannel: channel
    }));
  };

  const switchRootMode = (rootMode: 'non-root' | 'root-mount') => {
    setClientBuild((prev) => ({
      ...prev,
      rootMode
    }));
  };

  // Sync custom CSS to document style tag
  useEffect(() => {
    CssThemeEngine.applyCss(settings.customCss, settings.enableCustomCss);
  }, [settings.customCss, settings.enableCustomCss]);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) || null,
    [channels, activeChannelId]
  );

  const activeGuild = useMemo(
    () => (activeGuildId ? guilds.find((g) => g.id === activeGuildId) || null : null),
    [guilds, activeGuildId]
  );

  const filteredMessages = useMemo(() => {
    const list = messages.filter((m) => m.channelId === activeChannelId);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.author.username.toLowerCase().includes(q) ||
        (m.author.globalName && m.author.globalName.toLowerCase().includes(q))
    );
  }, [messages, activeChannelId, searchQuery]);

  const selectGuild = (guildId: string | null) => {
    setActiveGuildId(guildId);
    const available = channels.filter((c) => c.guildId === guildId);
    if (available.length > 0) {
      setActiveChannelId(available[0].id);
    } else {
      setActiveChannelId(null);
    }
  };

  const selectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setReplyingTo(null);

    // If active token and real discord channel (numerical ID), fetch live messages from REST API
    if (activeAccountToken && /^\d+$/.test(channelId)) {
      discordGateway
        .restRequest<any[]>(`/channels/${channelId}/messages?limit=50`)
        .then((apiMsgs) => {
          if (Array.isArray(apiMsgs)) {
            const mapped = apiMsgs.map(DiscordGatewayEngine.mapApiMessage).reverse();
            setMessages((prev) => {
              const others = prev.filter((m) => m.channelId !== channelId);
              return [...others, ...mapped];
            });
          }
        })
        .catch((err) => {
          console.warn('[Assault Gateway] Live channel fetch skipped or offline:', err);
        });
    }
  };

  const updateCurrentUserStatus = (status: UserStatus, customStatus?: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      status,
      customStatus: customStatus !== undefined ? customStatus : prev.customStatus
    }));
  };

  const updateCurrentUserProfile = (updates: Partial<DiscordUser>) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updates
    }));
  };

  const addGuild = (name: string, description?: string, iconUrl?: string) => {
    const newGuildId = `guild_${Date.now()}`;
    const newGuild: DiscordGuild = {
      id: newGuildId,
      name,
      iconUrl: iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
      bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      ownerId: currentUser.id,
      memberCount: 1,
      channelsCount: 2,
      unreadCount: 0,
      description: description || 'New custom Discord community server'
    };
    const defaultTextChannel: DiscordChannel = {
      id: `ch_${Date.now()}_general`,
      guildId: newGuildId,
      name: 'general',
      type: 'GUILD_TEXT',
      topic: 'General discussion channel'
    };
    const defaultVoiceChannel: DiscordChannel = {
      id: `ch_${Date.now()}_voice`,
      guildId: newGuildId,
      name: 'General Voice',
      type: 'GUILD_VOICE'
    };
    setGuilds((prev) => [...prev, newGuild]);
    setChannels((prev) => [...prev, defaultTextChannel, defaultVoiceChannel]);
    setActiveGuildId(newGuildId);
    setActiveChannelId(defaultTextChannel.id);
  };

  const addChannel = (guildId: string, name: string, type: 'GUILD_TEXT' | 'GUILD_VOICE' = 'GUILD_TEXT') => {
    const cleanName = name.toLowerCase().replace(/\s+/g, '-');
    const newChannel: DiscordChannel = {
      id: `ch_${Date.now()}_${cleanName}`,
      guildId,
      name: cleanName,
      type,
      topic: type === 'GUILD_TEXT' ? `General chat in #${cleanName}` : undefined
    };
    setChannels((prev) => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);
  };

  const sendMessage = (content: string, replyTo?: DiscordMessage | null, attachments?: string[]) => {
    const hasAttachments = attachments && attachments.length > 0;
    if (!content.trim() && !hasAttachments) return;
    if (!activeChannelId) return;

    // Check if message is a BeefBot command
    if (content.startsWith('$') || content.startsWith('!')) {
      const resp = beefBotEngine.executeCommand(content);
      // If user typed command in chat, also post output if active
      if (resp && !resp.startsWith('unknown')) {
        // Output logged
      }
    }

    const newMsg: DiscordMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      channelId: activeChannelId,
      author: currentUser,
      content: content.trim(),
      attachments: hasAttachments ? attachments : undefined,
      timestamp: Date.now(),
      replyToMessageId: replyTo?.id,
      replyAuthorName: replyTo?.author.globalName || replyTo?.author.username,
      replySnippet: replyTo?.content?.slice(0, 60),
      reactions: []
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyingTo(null);

    // If active Discord token and real numerical channel, dispatch to real Discord REST API
    if (activeAccountToken && activeChannelId && /^\d+$/.test(activeChannelId)) {
      discordGateway
        .restRequest(`/channels/${activeChannelId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: content.trim(),
            message_reference: replyTo ? { message_id: replyTo.id } : undefined
          })
        })
        .catch((err) => {
          console.warn('[Assault Gateway] Live Discord send message error:', err);
        });
    }

    // Pass message through BeefBot trigger / afk engine
    beefBotEngine.handleIncomingMessage(
      currentUser.id,
      currentUser.username,
      content,
      true,
      currentUser.id
    );
  };

  const editMessage = (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const history = msg.editHistory ? [...msg.editHistory, msg.content] : [msg.content];
          // Record snipe
          setEditSnipes((snipes) => [
            {
              id: `edit_${Date.now()}`,
              channelId: msg.channelId,
              channelName: activeChannel?.name || 'chat',
              authorName: msg.author.globalName || msg.author.username,
              authorId: msg.author.id,
              oldContent: msg.content,
              newContent,
              timestamp: Date.now()
            },
            ...snipes
          ]);
          return {
            ...msg,
            content: newContent,
            isEdited: true,
            editHistory: history
          };
        }
        return msg;
      })
    );
  };

  const deleteMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          // Record snipe
          setDeletedSnipes((snipes) => [
            {
              id: `snipe_${Date.now()}`,
              channelId: msg.channelId,
              channelName: activeChannel?.name || 'chat',
              authorName: msg.author.globalName || msg.author.username,
              authorId: msg.author.id,
              content: msg.content,
              timestamp: Date.now(),
              attachments: msg.attachments
            },
            ...snipes
          ]);

          if (settings.antiDelete) {
            // Retain with Anti-Delete tag!
            return {
              ...msg,
              isDeleted: true,
              deletedTimestamp: Date.now()
            };
          }
          return null as any;
        }
        return msg;
      }).filter(Boolean)
    );
  };

  const batchDeleteMessages = (ids: string[]) => {
    if (ids.length === 0) return;
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = msg.reactions ? [...msg.reactions] : [];
        const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

        if (existingIdx >= 0) {
          const existing = reactions[existingIdx];
          if (existing.userReacted) {
            if (existing.count <= 1) {
              reactions.splice(existingIdx, 1);
            } else {
              reactions[existingIdx] = {
                ...existing,
                count: existing.count - 1,
                userReacted: false
              };
            }
          } else {
            reactions[existingIdx] = {
              ...existing,
              count: existing.count + 1,
              userReacted: true
            };
          }
        } else {
          reactions.push({ emoji, count: 1, userReacted: true });
        }

        return { ...msg, reactions };
      })
    );
  };

  const updateSettings = (updater: Partial<AssaultSettings> | ((prev: AssaultSettings) => AssaultSettings)) => {
    setSettings((prev) => {
      if (typeof updater === 'function') {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  };

  const togglePlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, isEnabled: !p.isEnabled } : p))
    );
  };

  const installPlugin = (name: string, description: string, author: string, scriptCode = '', sourceName = 'Community Hub') => {
    const newPlugin: AssaultPlugin = {
      id: `plugin_${Date.now()}`,
      name,
      description,
      version: '1.0.0',
      author,
      isEnabled: true,
      category: 'Community',
      scriptCode,
      sourceName,
      verified: true
    };
    setPlugins((prev) => [...prev, newPlugin]);
  };

  const addPluginSource = (name: string, url: string, description = '') => {
    const newSrc: PluginSource = {
      id: `src_${Date.now()}`,
      name: name.trim() || 'Custom Repo',
      url: url.trim(),
      description: description || 'User-added external repository source',
      author: 'Third-Party',
      isEnabled: true,
      isOfficial: false,
      pluginsCount: Math.floor(Math.random() * 6) + 3,
      lastSync: Date.now(),
      status: 'ONLINE'
    };
    setPluginSources((prev) => [...prev, newSrc]);
  };

  const togglePluginSource = (id: string) => {
    setPluginSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  const removePluginSource = (id: string) => {
    setPluginSources((prev) => prev.filter((s) => s.id !== id));
  };

  const syncPluginSource = (id: string) => {
    setPluginSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lastSync: Date.now(), status: 'ONLINE' } : s))
    );
  };

  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.channelId === activeChannelId && m.isPinned);
  }, [messages, activeChannelId]);

  const togglePinMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  const playAudio = (type: string) => {
    soundboard.play(type);
  };

  const switchAccount = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => ({ ...acc, isActive: acc.id === accountId }))
    );
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      setCurrentUser((prev) => ({
        ...prev,
        username: target.username,
        globalName: target.username,
        avatarUrl: target.avatarUrl || prev.avatarUrl,
        isBot: target.isBot
      }));
      if (target.token && target.token.length > 20 && !target.token.includes('demo_token')) {
        discordGateway.connect(target.token);
      }
    }
  };

  const connectToken = async (token: string, isBot: boolean): Promise<boolean> => {
    const cleanToken = token.trim();
    if (!cleanToken) return false;

    const newAcc: SavedAccount = {
      id: `acc_${Date.now()}`,
      username: isBot ? 'DiscordBot' : 'Connecting...',
      token: cleanToken,
      isBot,
      avatarUrl: isBot
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
      isActive: true
    };
    setAccounts((prev) => [...prev.map((a) => ({ ...a, isActive: false })), newAcc]);

    // Connect to real Discord Gateway
    const success = await discordGateway.connect(cleanToken);

    // Fetch user profile via REST API
    discordGateway
      .restRequest<any>('/users/@me')
      .then((me) => {
        if (me && me.username) {
          const avUrl = me.avatar
            ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;
          setCurrentUser((prev) => ({
            ...prev,
            id: me.id,
            username: me.username,
            globalName: me.global_name || me.username,
            avatarUrl: avUrl,
            avatar: avUrl,
            isBot
          }));
          setAccounts((prev) =>
            prev.map((a) => (a.id === newAcc.id ? { ...a, username: me.username, avatarUrl: avUrl } : a))
          );
        }
      })
      .catch((err) => {
        console.warn('[Assault Gateway] Could not fetch /users/@me:', err);
      });

    return success;
  };

  const enrollQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isEnrolled: true } : q))
    );
  };

  const claimQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isClaimed: true } : q))
    );
  };

  const completeAllQuests = () => {
    setQuests((prev) =>
      prev.map((q) => ({
        ...q,
        isEnrolled: true,
        progress: q.target,
        isCompleted: true
      }))
    );
  };

  const clearAllSnipes = () => {
    setDeletedSnipes([]);
    setEditSnipes([]);
  };

  const buyCollectable = (id: string, useOrbs = false): boolean => {
    const item = collectibles.find((c) => c.id === id);
    if (!item) return false;
    if (item.isPurchased) return true;

    if (useOrbs) {
      const cost = item.orbsPrice || 500;
      const currentOrbs = currentUser.orbsBalance || 0;
      if (currentOrbs < cost) return false;
      setCurrentUser((prev) => ({ ...prev, orbsBalance: currentOrbs - cost }));
    } else {
      const finalPrice = nitroPlan !== 'NONE' && item.nitroDiscountUSD ? item.nitroDiscountUSD : item.priceUSD;
      const newInv: DiscordInvoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber: `DIS-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        description: `${item.name} (${item.category === 'AVATAR_DECORATION' ? 'Avatar Decoration' : 'Profile Effect'})`,
        amount: `$${finalPrice.toFixed(2)}`,
        status: 'PAID',
        paymentMethod: paymentMethods.find((p) => p.isDefault)?.brand || 'Visa 4242'
      };
      setInvoices((prev) => [newInv, ...prev]);
    }

    setCollectibles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPurchased: true } : c))
    );
    soundboard.play('discord_join');
    return true;
  };

  const equipCollectable = (id: string) => {
    const item = collectibles.find((c) => c.id === id);
    if (!item || !item.isPurchased) return;

    setCollectibles((prev) =>
      prev.map((c) => {
        if (c.category === item.category) {
          return { ...c, isEquipped: c.id === id };
        }
        return c;
      })
    );

    setCurrentUser((prev) => {
      if (item.category === 'AVATAR_DECORATION') {
        return { ...prev, avatarDecoration: item.assetUrl };
      } else if (item.category === 'PROFILE_EFFECT') {
        return { ...prev, profileEffect: item.assetUrl };
      }
      return prev;
    });
  };

  const unequipCollectable = (category: 'AVATAR_DECORATION' | 'PROFILE_EFFECT') => {
    setCollectibles((prev) =>
      prev.map((c) => (c.category === category ? { ...c, isEquipped: false } : c))
    );
    setCurrentUser((prev) => {
      if (category === 'AVATAR_DECORATION') {
        return { ...prev, avatarDecoration: undefined };
      } else {
        return { ...prev, profileEffect: undefined };
      }
    });
  };

  const toggleWishlist = (id: string) => {
    setCollectibles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isInWishlist: !c.isInWishlist } : c))
    );
  };

  const subscribeNitro = (tier: 'BASIC' | 'NITRO' | 'ANNUAL') => {
    setNitroPlan(tier === 'BASIC' ? 'NITRO_BASIC' : tier);
    const cost = tier === 'BASIC' ? '$2.99' : tier === 'NITRO' ? '$9.99' : '$99.99';
    const newInv: DiscordInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `DIS-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      description: `Discord Nitro ${tier} Subscription`,
      amount: cost,
      status: 'PAID',
      paymentMethod: paymentMethods.find((p) => p.isDefault)?.brand || 'Visa 4242'
    };
    setInvoices((prev) => [newInv, ...prev]);

    setCurrentUser((prev) => {
      const existingBadges = prev.badges.filter((b) => (typeof b === 'string' ? b : b.id) !== 'badge_nitro');
      existingBadges.push({
        id: 'badge_nitro',
        title: `Discord Nitro Subscriber (${tier})`,
        iconLabel: '▲',
        colorHex: '#f47fff'
      });
      return {
        ...prev,
        nitroType: tier === 'BASIC' ? 'NITRO_BASIC' : 'NITRO',
        nitroExpireDate: 'Aug 26, 2027',
        orbsBalance: (prev.orbsBalance || 0) + 500,
        badges: existingBadges
      };
    });
    soundboard.play('discord_join');
  };

  const cancelNitro = () => {
    setNitroPlan('NONE');
    setCurrentUser((prev) => ({
      ...prev,
      nitroType: 'NONE',
      badges: prev.badges.filter((b) => (typeof b === 'string' ? b : b.id) !== 'badge_nitro')
    }));
  };

  const boostServer = (guildId: string) => {
    setGuilds((prev) =>
      prev.map((g) => (g.id === guildId ? { ...g, memberCount: g.memberCount + 1 } : g))
    );
    setCurrentUser((prev) => ({
      ...prev,
      serverBoostsCount: (prev.serverBoostsCount || 0) + 1
    }));
    soundboard.play('discord_join');
  };

  const addPaymentMethod = (brand: 'VISA' | 'MASTERCARD' | 'PAYPAL', last4: string, expiry: string) => {
    const newPm: DiscordPaymentMethod = {
      id: `pm_${Date.now()}`,
      brand,
      last4,
      expiry,
      isDefault: paymentMethods.length === 0
    };
    setPaymentMethods((prev) => [...prev, newPm]);
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
  };

  const setDefaultPaymentMethod = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((p) => ({ ...p, isDefault: p.id === id }))
    );
  };

  const createGift = (planName: string, theme: string): DiscordGiftItem => {
    const code = `discord.gift/${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 8)}`;
    const newGift: DiscordGiftItem = {
      id: `gift_${Date.now()}`,
      code,
      planName,
      createdAt: Date.now(),
      isClaimed: false,
      giftCardTheme: theme
    };
    setGifts((prev) => [newGift, ...prev]);

    const newInv: DiscordInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `DIS-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      description: `Gift Purchase: ${planName}`,
      amount: planName.includes('Basic') ? '$2.99' : '$9.99',
      status: 'PAID',
      paymentMethod: paymentMethods.find((p) => p.isDefault)?.brand || 'Visa 4242'
    };
    setInvoices((prev) => [newInv, ...prev]);
    return newGift;
  };

  const redeemGift = (code: string) => {
    const clean = code.trim().toLowerCase();
    const giftIndex = gifts.findIndex((g) => g.code.toLowerCase().includes(clean) || clean.includes(g.code.toLowerCase()));
    if (giftIndex >= 0 && !gifts[giftIndex].isClaimed) {
      setGifts((prev) =>
        prev.map((g, i) => (i === giftIndex ? { ...g, isClaimed: true, claimedBy: currentUser.username } : g))
      );
      subscribeNitro('NITRO');
      return { success: true, message: `Successfully claimed ${gifts[giftIndex].planName}! Nitro perks are now active.` };
    }

    if (clean.includes('nitro') || clean.length >= 8) {
      subscribeNitro('NITRO');
      return { success: true, message: 'Valid Nitro promotional code redeemed! 1 Month of Nitro has been applied.' };
    }

    return { success: false, message: 'Invalid or expired gift code. Please verify the link and try again.' };
  };

  const massJoinVoice = (channelName: string) => {
    setFleetBots((prev) =>
      prev.map((b) => ({
        ...b,
        isConnected: true,
        voiceChannelName: channelName
      }))
    );
  };

  const massLeaveVoice = () => {
    setFleetBots((prev) =>
      prev.map((b) => ({
        ...b,
        voiceChannelName: null
      }))
    );
  };

  const broadcastSay = (text: string) => {
    if (!text.trim() || !activeChannelId) return;
    fleetBots.forEach((bot) => {
      if (bot.isConnected) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_fleet_${bot.id}_${Date.now()}_${Math.random()}`,
            channelId: activeChannelId,
            author: {
              id: bot.id,
              username: bot.username,
              globalName: bot.username,
              avatarUrl: bot.avatarUrl,
              badges: [],
              status: 'ONLINE'
            },
            content: text,
            timestamp: Date.now()
          }
        ]);
      }
    });
  };

  const toggleAgct = (enabled: boolean) => {
    setDefense((prev) => ({ ...prev, agctEnabled: enabled }));
  };

  const updateTrapMessage = (msg: string) => {
    setDefense((prev) => ({ ...prev, trapMessage: msg }));
    beefBotEngine.executeCommand(`agct msg ${msg}`);
  };

  const addAgctWhitelist = (userId: string) => {
    setDefense((prev) => ({
      ...prev,
      whitelist: [...new Set([...prev.whitelist, userId])]
    }));
    beefBotEngine.executeCommand(`agct wl add <@${userId}>`);
  };

  const removeAgctWhitelist = (userId: string) => {
    setDefense((prev) => ({
      ...prev,
      whitelist: prev.whitelist.filter((id) => id !== userId)
    }));
    beefBotEngine.executeCommand(`agct wl remove <@${userId}>`);
  };

  const toggleSilenceUser = (userId: string) => {
    setDefense((prev) => {
      const exists = prev.silencedUserIds.includes(userId);
      return {
        ...prev,
        silencedUserIds: exists
          ? prev.silencedUserIds.filter((id) => id !== userId)
          : [...prev.silencedUserIds, userId]
      };
    });
  };

  const toggleBeefBotRule = (ruleKey: string, enabled: boolean) => {
    setBeefBotConfig((prev) => ({ ...prev, [ruleKey]: enabled }));
  };

  const setBeefEscalation = (level: BeefEscalationLevel) => {
    setBeefBotConfig((prev) => ({ ...prev, escalationLevel: level }));
  };

  const addCustomCommand = (trigger: string, response: string, permissionLevel: string) => {
    setBeefBotConfig((prev) => ({
      ...prev,
      customCommands: [
        ...prev.customCommands,
        {
          id: `cmd_${Date.now()}`,
          trigger,
          response,
          permissionLevel,
          isEnabled: true,
          usageCount: 0
        }
      ]
    }));
  };

  const toggleCustomCommand = (commandId: string) => {
    setBeefBotConfig((prev) => ({
      ...prev,
      customCommands: prev.customCommands.map((c) =>
        c.id === commandId ? { ...c, isEnabled: !c.isEnabled } : c
      )
    }));
  };

  const deleteCustomCommand = (commandId: string) => {
    setBeefBotConfig((prev) => ({
      ...prev,
      customCommands: prev.customCommands.filter((c) => c.id !== commandId)
    }));
  };

  const clearBeefIncidents = () => {
    setBeefBotConfig((prev) => ({ ...prev, incidents: [] }));
  };

  const toggleVoiceChannel = (channelId: string) => {
    setConnectedVoiceChannelId((prev) => {
      if (prev === channelId) {
        soundboard.play('discord_leave');
        return null;
      } else {
        soundboard.play('discord_join');
        return channelId;
      }
    });
  };

  return (
    <AssaultContext.Provider
      value={{
        currentUser,
        updateCurrentUserStatus,
        updateCurrentUserProfile,
        guilds,
        addGuild,
        activeGuildId,
        selectGuild,
        channels,
        addChannel,
        activeChannelId,
        selectChannel,
        activeChannel,
        activeGuild,
        messages,
        filteredMessages,
        searchQuery,
        setSearchQuery,
        sendMessage,
        editMessage,
        deleteMessage,
        batchDeleteMessages,
        toggleReaction,
        replyingTo,
        setReplyingTo,
        settings,
        updateSettings,
        plugins,
        togglePlugin,
        installPlugin,
        pluginSources,
        addPluginSource,
        togglePluginSource,
        removePluginSource,
        syncPluginSource,
        pinnedMessages,
        togglePinMessage,
        playAudio,
        isSpeaking,
        setIsSpeaking,
        accounts,
        switchAccount,
        connectToken,
        gatewayStatus,
        activeMode,
        setActiveMode,
        activeAccountToken,
        quests,
        enrollQuest,
        claimQuest,
        completeAllQuests,
        deletedSnipes,
        editSnipes,
        clearAllSnipes,
        fleetBots,
        massJoinVoice,
        massLeaveVoice,
        broadcastSay,
        defense,
        toggleAgct,
        updateTrapMessage,
        addAgctWhitelist,
        removeAgctWhitelist,
        toggleSilenceUser,
        beefBotConfig,
        toggleBeefBotRule,
        setBeefEscalation,
        addCustomCommand,
        toggleCustomCommand,
        deleteCustomCommand,
        clearBeefIncidents,
        beefBotEngine,
        clientManagerEngine,
        clientBuild,
        checkForClientUpdates,
        installClientUpdate,
        repairClientHooks,
        switchBuildChannel,
        switchRootMode,
        connectedVoiceChannelId,
        toggleVoiceChannel,
        isMuted,
        setIsMuted,
        isDeafened,
        setIsDeafened,
        viewMode,
        setViewMode,
        gatewayState,
        iconPack,
        setIconPack,
        collectibles,
        buyCollectable,
        equipCollectable,
        unequipCollectable,
        toggleWishlist,
        nitroPlan,
        subscribeNitro,
        cancelNitro,
        boostServer,
        paymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        invoices,
        gifts,
        createGift,
        redeemGift
      }}
    >
      {children}
    </AssaultContext.Provider>
  );
};

export const useAssault = () => {
  const context = useContext(AssaultContext);
  if (!context) throw new Error('useAssault must be used within an AssaultProvider');
  return context;
};
