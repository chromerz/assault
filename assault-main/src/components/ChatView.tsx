import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Menu,
  ChevronLeft,
  Search,
  Users,
  Download,
  Trash2,
  Smile,
  Plus,
  Send,
  Mic,
  CornerUpLeft,
  Pencil,
  X,
  History,
  CheckSquare,
  Square,
  ShieldCheck,
  MoreVertical,
  Activity,
  Layers,
  Palette,
  Sparkles,
  Shield,
  KeyRound,
  Settings,
  Package,
  FileText,
  Volume2,
  Pin,
  Bookmark,
  Flame,
  Radio,
  Terminal,
  Paperclip,
  Check
} from 'lucide-react';
import { DiscordMessage, DiscordUser } from '../types';
import { useAssault } from '../context/AssaultContext';
import { ChatExportUtility } from '../services/chatExportUtility';
import { IconPackEngine } from '../services/iconPackEngine';
import { DiscordMarkdown } from './DiscordMarkdown';
import { AttachmentSelectionModal, StagedAttachmentItem } from './chat/AttachmentSelectionModal';

interface ChatViewProps {
  onOpenDrawer: () => void;
  onBackToServers?: () => void;
  onToggleMembers: () => void;
  onOpenUserProfile: (user: DiscordUser) => void;
  onOpenEditHistory: (msg: DiscordMessage) => void;
  onOpenEmotePicker: () => void;
  onOpenExportDialog: () => void;
  onOpenMonitor: () => void;
  onOpenBeefBot: () => void;
  onOpenPlugins: () => void;
  onOpenCss: () => void;
  onOpenIconPacks: () => void;
  onOpenPrivacy: () => void;
  onOpenTokens: () => void;
  onOpenSettings: () => void;
  onOpenSoundboard?: () => void;
  onOpenPinnedMessages?: () => void;
  onOpenQuickSwitcher?: () => void;
}

interface SlashCommandDef {
  command: string;
  syntax: string;
  description: string;
  icon: string;
}

const SLASH_COMMANDS: SlashCommandDef[] = [
  { command: '/beef', syntax: '/beef [@user]', description: 'Unleash BeefBot autonomous counter-roast defense', icon: '🥩' },
  { command: '/snipe', syntax: '/snipe', description: 'Recover and reveal last deleted message in channel', icon: '🎯' },
  { command: '/soundboard', syntax: '/soundboard [effect]', description: 'Open soundboard & trigger live synthesized audio FX', icon: '🔊' },
  { command: '/spoof', syntax: '/spoof [VR|iOS|PS5|PC]', description: 'Instantly spoof client platform presence', icon: '🥽' },
  { command: '/clear', syntax: '/clear [amount]', description: 'Batch purge and scrub recent channel messages', icon: '🧹' },
  { command: '/shrug', syntax: '/shrug [text]', description: 'Appends ¯\\_(ツ)_/¯ to your message', icon: '🤷' },
  { command: '/tableflip', syntax: '/tableflip', description: 'Appends (╯°□°)╯︵ ┻━┻', icon: '┻━┻' },
  { command: '/theme', syntax: '/theme [amoled|cyber|midnight]', description: 'Quickly switch Assault visual CSS theme', icon: '🎨' },
  { command: '/help', syntax: '/help', description: 'List all client features, hooks, and beefbot commands', icon: '💡' }
];

export const ChatView: React.FC<ChatViewProps> = ({
  onOpenDrawer,
  onBackToServers,
  onToggleMembers,
  onOpenUserProfile,
  onOpenEditHistory,
  onOpenEmotePicker,
  onOpenExportDialog,
  onOpenMonitor,
  onOpenBeefBot,
  onOpenPlugins,
  onOpenCss,
  onOpenIconPacks,
  onOpenPrivacy,
  onOpenTokens,
  onOpenSettings,
  onOpenSoundboard,
  onOpenPinnedMessages,
  onOpenQuickSwitcher
}) => {
  const {
    activeChannel,
    activeGuild,
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
    currentUser,
    iconPack,
    beefBotEngine,
    pinnedMessages,
    togglePinMessage,
    playAudio,
    deletedSnipes
  } = useAssault();

  const pack = IconPackEngine.getPack(iconPack);
  const beefState = beefBotEngine.getState();

  const [inputVal, setInputVal] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showChannelActionSheet, setShowChannelActionSheet] = useState(false);
  const [showPlusAttachmentMenu, setShowPlusAttachmentMenu] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachmentItem[]>([]);
  const [lightboxMediaUrl, setLightboxMediaUrl] = useState<string | null>(null);
  const [showTopicTooltip, setShowTopicTooltip] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length]);

  // Handle slash command filter
  const matchingSlashCommands = SLASH_COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().startsWith(inputVal.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    if (val.startsWith('/') && !val.includes(' ')) {
      setShowSlashMenu(true);
      setSelectedSlashIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSelectSlashCommand = (cmd: SlashCommandDef) => {
    if (cmd.command === '/soundboard') {
      setInputVal('');
      setShowSlashMenu(false);
      onOpenSoundboard?.();
      return;
    }
    if (cmd.command === '/snipe') {
      setShowSlashMenu(false);
      setInputVal('');
      const lastSnipe = deletedSnipes[0];
      if (lastSnipe) {
        sendMessage(`🎯 [SNIPED] **${lastSnipe.authorName}**: "${lastSnipe.content}"`);
      } else {
        sendMessage('🎯 [SNIPED] No recently deleted messages in cache.');
      }
      return;
    }
    if (cmd.command === '/shrug') {
      setInputVal('¯\\_(ツ)_/¯');
      setShowSlashMenu(false);
      return;
    }
    if (cmd.command === '/tableflip') {
      setInputVal('(╯°□°)╯︵ ┻━┻');
      setShowSlashMenu(false);
      return;
    }

    setInputVal(`${cmd.command} `);
    setShowSlashMenu(false);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    const hasText = inputVal.trim().length > 0;
    const hasAttachments = stagedAttachments.length > 0;
    if (!hasText && !hasAttachments) return;

    // Check slash commands on submit
    if (inputVal.startsWith('/shrug')) {
      const rest = inputVal.replace('/shrug', '').trim();
      sendMessage(`${rest ? rest + ' ' : ''}¯\\_(ツ)_/¯`, replyingTo);
      setInputVal('');
      setStagedAttachments([]);
      return;
    }
    if (inputVal.startsWith('/tableflip')) {
      const rest = inputVal.replace('/tableflip', '').trim();
      sendMessage(`${rest ? rest + ' ' : ''}(╯°□°)╯︵ ┻━┻`, replyingTo);
      setInputVal('');
      setStagedAttachments([]);
      return;
    }
    if (inputVal.startsWith('/soundboard')) {
      onOpenSoundboard?.();
      setInputVal('');
      return;
    }

    const attachmentUrls = stagedAttachments.map((a) => a.url);
    sendMessage(inputVal, replyingTo, attachmentUrls);
    setInputVal('');
    setStagedAttachments([]);
    setShowSlashMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSlashMenu && matchingSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % matchingSlashCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev - 1 + matchingSlashCommands.length) % matchingSlashCommands.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !inputVal.includes(' '))) {
        e.preventDefault();
        handleSelectSlashCommand(matchingSlashCommands[selectedSlashIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startEditing = (msg: DiscordMessage) => {
    setEditingMessageId(msg.id);
    setEditInputVal(msg.content);
  };

  const saveEdit = (msgId: string) => {
    if (!editInputVal.trim()) return;
    editMessage(msgId, editInputVal);
    setEditingMessageId(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditInputVal('');
  };

  const toggleSelectMessage = (id: string) => {
    setSelectedForBatch((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    if (selectedForBatch.length === 0) return;
    if (confirm(`Purge ${selectedForBatch.length} selected messages?`)) {
      batchDeleteMessages(selectedForBatch);
      setSelectedForBatch([]);
      setIsBatchMode(false);
    }
  };

  const QUICK_REACTIONS = ['❤️', '🔥', '💀', '🥩', '🚀', '👍', '😂'];

  const isDM = activeChannel?.type === 'DM' || activeGuild === null;

  return (
    <main className="flex-1 flex flex-col bg-[#000000] h-full overflow-hidden relative select-none">
      {/* 1. Authentic Modern Discord Header */}
      <header className="h-13 border-b border-[#141517] bg-[#000000] px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-10 shadow-xs">
        {/* Left: Drawer toggle / Back button, Avatar/Hash, Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => {
              if (onBackToServers) {
                onBackToServers();
              } else {
                onOpenDrawer();
              }
            }}
            className="p-1.5 text-[#dbdee1] hover:text-white hover:bg-[#1a1b20] rounded-full transition cursor-pointer"
            title="Back to Servers & Channels"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {isDM ? (
            <div
              className="flex items-center gap-2 truncate cursor-pointer"
              onClick={() => onOpenUserProfile({
                id: `u_${activeChannel?.name || 'user'}`,
                username: activeChannel?.name || 'user',
                globalName: activeChannel?.name || 'user',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
                status: 'OFFLINE',
                badges: [],
                bio: 'hypercharacterization • discord beta user'
              })}
            >
              <div className="relative shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop"
                  alt={activeChannel?.name || 'user'}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#000000] border-2 border-[#000000] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full border-2 border-[#80848e] bg-[#000000]" />
                </span>
              </div>
              <h2 className="font-extrabold text-base text-white truncate flex items-center gap-1">
                <span>{activeChannel ? activeChannel.name : 'rep'}</span>
                <span className="text-xs text-[#80848e] font-normal">›</span>
              </h2>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[#80848e] font-bold text-base shrink-0">
                {activeChannel?.type === 'GUILD_VOICE' ? (
                  <Volume2 className="w-5 h-5 text-[#23a55a]" />
                ) : (
                  pack.hashIcon || <Hash className="w-5 h-5" />
                )}
              </span>
              <h2 className="font-bold text-sm text-[#f2f3f5] truncate">
                {activeChannel ? activeChannel.name : 'general'}
              </h2>
            </div>
          )}

          {/* Topic snippet on desktop */}
          {!isDM && activeChannel?.topic && (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#202225] text-xs text-[#949ba4] truncate max-w-md">
              <span className="truncate">{activeChannel.topic}</span>
            </div>
          )}
        </div>

        {/* Right: DM or Guild Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isDM ? (
            <>
              {/* Phone call */}
              <button
                onClick={() => playAudio('discord_join')}
                className="w-9 h-9 rounded-full hover:bg-[#1a1b20] text-[#b5bac1] hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Voice Call"
              >
                <Mic className="w-4 h-4" />
              </button>
              {/* Video call */}
              <button
                onClick={() => playAudio('victory')}
                className="w-9 h-9 rounded-full hover:bg-[#1a1b20] text-[#b5bac1] hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Video Call"
              >
                <Activity className="w-4 h-4" />
              </button>
              {/* Search */}
              <button
                onClick={() => setShowSearchInput(!showSearchInput)}
                className="w-9 h-9 rounded-full hover:bg-[#1a1b20] text-[#b5bac1] hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Soundboard Launcher */}
              <button
                onClick={onOpenSoundboard}
                className="p-1.5 rounded-md text-[#b5bac1] hover:text-white hover:bg-[#1a1b20] transition cursor-pointer"
                title="Open Soundboard"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {/* Pinned Messages Button */}
              <button
                onClick={onOpenPinnedMessages}
                className="relative p-1.5 rounded-md text-[#b5bac1] hover:text-white hover:bg-[#1a1b20] transition cursor-pointer"
                title="Pinned Messages"
              >
                <Pin className="w-4 h-4" />
                {pinnedMessages.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#5865f2] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {pinnedMessages.length}
                  </span>
                )}
              </button>

              {/* Members Drawer Toggle */}
              <button
                onClick={onToggleMembers}
                className="p-1.5 rounded-md text-[#b5bac1] hover:text-white hover:bg-[#1a1b20] transition cursor-pointer"
                title="Member List"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* Quick Switcher trigger */}
              <button
                onClick={onOpenQuickSwitcher}
                className="flex items-center gap-1.5 bg-[#141517] text-[#949ba4] hover:text-[#f2f3f5] px-2.5 py-1 rounded-md text-xs border border-[#232428] transition cursor-pointer ml-1"
                title="Quick Switcher (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </>
          )}

          {/* Action sheet trigger (•••) */}
          <button
            onClick={() => setShowChannelActionSheet(true)}
            className="p-1.5 rounded-md text-[#b5bac1] hover:text-white hover:bg-[#1a1b20] transition cursor-pointer"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Expandable in-channel Search Input */}
      {showSearchInput && (
        <div className="px-3 py-2 bg-[#2b2d31] border-b border-[#232428] flex items-center gap-2 animate-in fade-in">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Filter messages in #${activeChannel?.name || 'chat'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1f22] text-xs text-[#dbdee1] rounded-lg px-3 py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-[#5865f2]"
              autoFocus
            />
            <Search className="w-4 h-4 text-[#949ba4] absolute left-2.5 top-2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#949ba4] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setShowSearchInput(false);
              setSearchQuery('');
            }}
            className="text-xs text-[#949ba4] hover:text-white px-2 py-1 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 2. Message Feed Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#949ba4] text-center p-6">
            <div className="w-14 h-14 rounded-full bg-[#2b2d31] flex items-center justify-center text-2xl mb-3 text-[#5865f2]">
              {pack.hashIcon || <Hash className="w-7 h-7" />}
            </div>
            <p className="text-lg font-bold text-[#f2f3f5]">
              Welcome to #{activeChannel?.name || 'chat'}!
            </p>
            <p className="text-xs text-[#949ba4] max-w-sm mt-1 leading-relaxed">
              This is the beginning of the #{activeChannel?.name || 'chat'} channel.
              Anti-Delete & Anti-Edit protections are running silently.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isEditing = editingMessageId === msg.id;
            const isSelected = selectedForBatch.includes(msg.id);

            // Grouping: check if previous message was same author within 5 mins
            const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
            const isConsecutive =
              prevMsg &&
              prevMsg.author.id === msg.author.id &&
              Number(msg.timestamp) - Number(prevMsg.timestamp) < 300000 &&
              !msg.isDeleted &&
              !prevMsg.isDeleted;

            return (
              <div
                key={msg.id}
                className={`group relative flex gap-3 p-1.5 sm:p-2 rounded-lg transition-colors ${
                  msg.isDeleted
                    ? 'bg-[#ed4245]/10 border-l-4 border-[#ed4245]'
                    : msg.isPinned
                    ? 'bg-[#5865f2]/10 border-l-2 border-[#5865f2]'
                    : 'hover:bg-[#2e3035]'
                } ${isSelected ? 'bg-[#5865f2]/20 ring-1 ring-[#5865f2]' : ''}`}
              >
                {/* Batch selection checkbox */}
                {isBatchMode && (
                  <button
                    onClick={() => toggleSelectMessage(msg.id)}
                    className="self-center p-1 text-[#b5bac1] hover:text-white cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#5865f2]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Author Avatar or Timestamp if consecutive */}
                <div className="shrink-0 mt-0.5">
                  {isConsecutive ? (
                    <div className="w-10 flex items-center justify-center">
                      <span className="text-[10px] text-[#949ba4] opacity-0 group-hover:opacity-100 transition font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => onOpenUserProfile(msg.author)}
                    >
                      <img
                        src={msg.author.avatarUrl}
                        alt={msg.author.username}
                        className="w-10 h-10 rounded-full object-cover hover:opacity-85 transition"
                      />
                    </div>
                  )}
                </div>

                {/* Message Body Content */}
                <div className="flex-1 min-w-0">
                  {!isConsecutive && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => onOpenUserProfile(msg.author)}
                        className="font-semibold text-sm cursor-pointer hover:underline"
                        style={{ color: msg.author.roleColor || '#f2f3f5' }}
                      >
                        {msg.author.globalName || msg.author.username}
                      </span>

                      {/* Bot / App Badge */}
                      {msg.author.isBot && (
                        <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1 py-0.5 rounded leading-none">
                          APP
                        </span>
                      )}

                      {/* Timestamp */}
                      <span className="text-[11px] text-[#949ba4]">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      {/* Edited Badge */}
                      {msg.isEdited && (
                        <button
                          onClick={() => onOpenEditHistory(msg)}
                          className="text-[11px] text-[#949ba4] hover:text-[#dbdee1] hover:underline flex items-center gap-0.5 cursor-pointer"
                          title="View edit history"
                        >
                          (edited)
                        </button>
                      )}

                      {/* Pinned Badge */}
                      {msg.isPinned && (
                        <span className="text-[10px] bg-[#5865f2]/20 text-[#5865f2] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" />
                          pinned
                        </span>
                      )}

                      {/* Anti-Delete Sniped Badge */}
                      {msg.isDeleted && (
                        <span className="bg-[#ed4245]/20 text-[#ed4245] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ed4245]/40">
                          Anti-Delete Saved
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reply Reference Preview */}
                  {msg.replyAuthorName && (
                    <div className="flex items-center gap-1 text-[11px] text-[#949ba4] mb-1">
                      <CornerUpLeft className="w-3 h-3 text-[#5865f2]" />
                      <span className="font-semibold text-[#c9cdfb]">@{msg.replyAuthorName}</span>
                      <span className="truncate max-w-md italic">{msg.replySnippet}</span>
                    </div>
                  )}

                  {/* Message Content or In-place Editor */}
                  {isEditing ? (
                    <div className="mt-1 space-y-1">
                      <input
                        type="text"
                        value={editInputVal}
                        onChange={(e) => setEditInputVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(msg.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-full bg-[#1e1f22] text-[#f2f3f5] text-sm p-2 rounded-lg border border-[#5865f2] focus:outline-none"
                        autoFocus
                      />
                      <div className="text-[11px] text-[#949ba4] flex gap-2">
                        <span>
                          escape to{' '}
                          <button onClick={cancelEdit} className="text-[#5865f2] underline cursor-pointer">
                            cancel
                          </button>
                        </span>
                        <span>•</span>
                        <span>
                          enter to{' '}
                          <button onClick={() => saveEdit(msg.id)} className="text-[#5865f2] underline cursor-pointer">
                            save
                          </button>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`text-sm text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap mt-0.5 ${
                        msg.isDeleted ? 'line-through text-[#949ba4]' : ''
                      }`}
                    >
                      <DiscordMarkdown content={msg.content} />
                    </div>
                  )}

                  {/* Rendered Attachments (Images, GIFs, Files) */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((attUrl, aIdx) => {
                        const isImgOrGif =
                          attUrl.startsWith('data:image/') ||
                          attUrl.startsWith('http') ||
                          attUrl.includes('.gif') ||
                          attUrl.includes('.png') ||
                          attUrl.includes('.jpg');

                        if (isImgOrGif) {
                          return (
                            <div
                              key={aIdx}
                              onClick={() => setLightboxMediaUrl(attUrl)}
                              className="relative group max-w-sm sm:max-w-md max-h-80 rounded-xl overflow-hidden border border-[#2b2d31] bg-[#111214] cursor-pointer shadow-md hover:border-[#5865f2] transition"
                            >
                              <img
                                src={attUrl}
                                alt="Attachment"
                                className="w-full h-auto max-h-80 object-cover group-hover:scale-[1.01] transition duration-150"
                                loading="lazy"
                              />
                              <div className="absolute top-2 right-2 bg-black/70 text-[10px] text-white font-mono px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                                Click to Expand
                              </div>
                            </div>
                          );
                        }

                        // Document / Generic File card
                        return (
                          <div
                            key={aIdx}
                            className="p-3 bg-[#2b2d31] rounded-xl border border-[#35373c] flex items-center justify-between max-w-sm"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#1e1f22] flex items-center justify-center text-[#f0b232] shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-white truncate font-mono">
                                  {attUrl.replace('[Attached File: ', '').replace(']', '')}
                                </p>
                                <p className="text-[10px] text-[#949ba4]">Discord Document</p>
                              </div>
                            </div>
                            <span className="text-xs text-[#5865f2] font-bold hover:underline cursor-pointer ml-3 shrink-0">
                              Download
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reactions List */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {msg.reactions.map((react, i) => (
                        <button
                          key={i}
                          onClick={() => toggleReaction(msg.id, react.emoji)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition cursor-pointer border ${
                            react.userReacted
                              ? 'bg-[#5865f2]/20 border-[#5865f2] text-[#5865f2]'
                              : 'bg-[#2b2d31] border-transparent text-[#b5bac1] hover:bg-[#35373c]'
                          }`}
                        >
                          <span>{react.emoji}</span>
                          <span className="text-[11px] font-bold">{react.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtle Discord Action Bar (Hover on Desktop, Clean) */}
                <div className="absolute right-2 -top-3.5 hidden group-hover:flex items-center bg-[#2b2d31] border border-[#202225] rounded-md shadow-lg p-0.5 z-10 text-[#b5bac1]">
                  {/* Quick Reactions */}
                  {QUICK_REACTIONS.slice(0, 3).map((em) => (
                    <button
                      key={em}
                      onClick={() => toggleReaction(msg.id, em)}
                      className="p-1 hover:bg-[#35373c] rounded text-sm transition cursor-pointer"
                      title={`React ${em}`}
                    >
                      {em}
                    </button>
                  ))}

                  <div className="w-[1px] h-3.5 bg-[#35373c] mx-0.5" />

                  {/* Reply Button */}
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white transition cursor-pointer"
                    title="Reply"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Pin Button */}
                  <button
                    onClick={() => togglePinMessage(msg.id)}
                    className={`p-1 hover:bg-[#35373c] rounded transition cursor-pointer ${
                      msg.isPinned ? 'text-[#5865f2]' : 'text-[#b5bac1] hover:text-white'
                    }`}
                    title={msg.isPinned ? 'Unpin Message' : 'Pin Message'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  {/* Bookmark Button matching Screenshot 1 & 2 */}
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText?.(msg.content);
                      playAudio('discord_join');
                    }}
                    className="p-1 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white transition cursor-pointer"
                    title="Bookmark Message (Find in Notifications)"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  {/* BeefBot Roast / Retort */}
                  <button
                    onClick={() => {
                      const roast = beefBotEngine.generateRetort(msg.author.username, msg.content);
                      sendMessage(`🥩 [BEEFBOT RETORT] ${roast}`, msg);
                    }}
                    className="p-1 hover:bg-[#35373c] rounded text-[#fee75c] transition cursor-pointer"
                    title="Trigger BeefBot Roast"
                  >
                    <Flame className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Button (if self) */}
                  {msg.author.id === currentUser.id && (
                    <button
                      onClick={() => startEditing(msg)}
                      className="p-1 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white transition cursor-pointer"
                      title="Edit Message"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-1 hover:bg-[#35373c] rounded text-[#ed4245] transition cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="bg-[#2b2d31] px-4 py-1.5 border-t border-[#202225] flex items-center justify-between text-xs text-[#dbdee1] shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <CornerUpLeft className="w-3.5 h-3.5 text-[#5865f2]" />
            <span>Replying to</span>
            <span className="font-bold text-[#5865f2]">
              @{replyingTo.author.globalName || replyingTo.author.username}
            </span>
            <span className="truncate text-[#949ba4] max-w-sm">
              "{replyingTo.content}"
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[#949ba4] hover:text-white p-1 cursor-pointer"
            title="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Bottom Batch Selection Toolbar */}
      {isBatchMode && selectedForBatch.length > 0 && (
        <div className="absolute bottom-18 left-1/2 -translate-x-1/2 bg-[#111218] border border-[#5865f2] px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 z-30">
          <span className="text-xs font-bold text-white">
            {selectedForBatch.length} selected
          </span>
          <button
            onClick={handleBatchDelete}
            className="bg-[#ed4245] hover:bg-[#da373a] text-white text-xs font-bold px-3 py-1 rounded-full transition cursor-pointer"
          >
            Purge Selected
          </button>
          <button
            onClick={() => {
              setSelectedForBatch([]);
              setIsBatchMode(false);
            }}
            className="text-xs text-[#949ba4] hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 3. Slash Commands Autocomplete Popover */}
      {showSlashMenu && matchingSlashCommands.length > 0 && (
        <div className="mx-3 mb-1 bg-[#1e1f22] border border-[#313338] rounded-xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-1.5 bg-[#111214] border-b border-[#2b2d31] flex items-center justify-between text-[11px] text-[#949ba4]">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-[#5865f2]" />
              COMMANDS MATCHING "{inputVal}"
            </span>
            <span>TAB or ENTER to choose</span>
          </div>
          <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
            {matchingSlashCommands.map((cmd, idx) => {
              const isSelected = idx === selectedSlashIndex;
              return (
                <button
                  key={cmd.command}
                  onClick={() => handleSelectSlashCommand(cmd)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                    isSelected ? 'bg-[#5865f2]/20 border border-[#5865f2]/30' : 'hover:bg-[#2b2d31]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{cmd.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-white font-mono">
                        {cmd.syntax}
                      </span>
                      <p className="text-[11px] text-[#949ba4] truncate">
                        {cmd.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#80848e] bg-[#111214] px-1.5 py-0.5 rounded font-mono">
                    COMMAND
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Modern Discord Chat Input Bar */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#313338] shrink-0 select-none">
        {/* Stealth Typing Dot Indicator */}
        {settings.silentTyping && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#23a55a] font-medium mb-1 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a] animate-pulse"></span>
            <span>Silent Typing Active (Read & Typing receipts blocked)</span>
          </div>
        )}

        <div className="bg-[#383a40] rounded-xl flex items-center px-3 py-1.5 gap-2 shadow-inner border border-[#313338]">
          {/* Plus Action Button */}
          <button
            onClick={() => setShowPlusAttachmentMenu(!showPlusAttachmentMenu)}
            className="w-7 h-7 rounded-full bg-[#4e5058]/40 hover:bg-[#4e5058] flex items-center justify-center text-[#dbdee1] hover:text-white transition cursor-pointer shrink-0"
            title="Upload Files & Tools"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder={`Message #${activeChannel?.name || 'chat'} (type / for commands)`}
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[#f2f3f5] focus:outline-none placeholder-[#80848e] py-1"
          />

          {/* Soundboard Quick Trigger inside input */}
          <button
            onClick={onOpenSoundboard}
            className="text-[#b5bac1] hover:text-[#5865f2] p-1 transition cursor-pointer shrink-0"
            title="Open Soundboard"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* Emote Picker Icon */}
          <button
            onClick={onOpenEmotePicker}
            className="text-[#b5bac1] hover:text-[#fee75c] p-1 transition cursor-pointer shrink-0"
            title="Nitro Emote Picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Send or Mic Button */}
          {inputVal.trim() ? (
            <button
              onClick={handleSend}
              className="w-7 h-7 rounded-full bg-[#5865f2] hover:bg-[#4752c4] flex items-center justify-center text-white transition cursor-pointer shrink-0 shadow-md"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                sendMessage('🎙️ [Voice note simulated]');
              }}
              className="text-[#b5bac1] hover:text-white p-1 transition cursor-pointer shrink-0"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Attachment & Plus Menu Popover */}
      {showPlusAttachmentMenu && (
        <div className="absolute bottom-16 left-4 bg-[#1e1f22] border border-[#313338] rounded-xl shadow-2xl p-2 w-56 z-30 animate-in fade-in">
          <div className="space-y-1 text-xs">
            <button
              onClick={() => {
                sendMessage('📎 [Attached: assault_dump.log]');
                setShowPlusAttachmentMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#35373c] text-left text-white cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-[#5865f2]" />
              <span>Upload a File</span>
            </button>
            <button
              onClick={() => {
                onOpenSoundboard?.();
                setShowPlusAttachmentMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#35373c] text-left text-white cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#fee75c]" />
              <span>Play Soundboard FX</span>
            </button>
            <button
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                setShowPlusAttachmentMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#35373c] text-left text-white cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-[#ed4245]" />
              <span>{isBatchMode ? 'Exit Purge Mode' : 'Batch Purge Mode'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Channel Action Sheet (When clicking •••) */}
      {showChannelActionSheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setShowChannelActionSheet(false)}
          />
          <div className="bg-[#2b2d31] rounded-t-2xl border-t border-[#35373c] p-4 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Pull Bar */}
            <div className="w-10 h-1 bg-[#4e5058] rounded-full mx-auto -mt-1 mb-2" />

            {/* Channel Info Header */}
            <div className="flex items-center justify-between border-b border-[#35373c] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#5865f2]">{pack.hashIcon || <Hash className="w-5 h-5" />}</span>
                <div>
                  <h3 className="font-bold text-white text-base">
                    #{activeChannel ? activeChannel.name : 'general'}
                  </h3>
                  <p className="text-xs text-[#949ba4] truncate max-w-xs">
                    {activeGuild?.name || 'Direct Messages'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChannelActionSheet(false)}
                className="p-1 rounded-md text-[#949ba4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setShowChannelActionSheet(false);
                  onOpenSoundboard?.();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1e1f22] hover:bg-[#35373c] text-white transition text-left cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-[#5865f2]" />
                <span className="font-semibold">Soundboard</span>
              </button>

              <button
                onClick={() => {
                  setShowChannelActionSheet(false);
                  onOpenPinnedMessages?.();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1e1f22] hover:bg-[#35373c] text-white transition text-left cursor-pointer"
              >
                <Pin className="w-4 h-4 text-[#fee75c]" />
                <span className="font-semibold">Pinned ({pinnedMessages.length})</span>
              </button>

              <button
                onClick={() => {
                  setShowChannelActionSheet(false);
                  onOpenBeefBot();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1e1f22] hover:bg-[#35373c] text-white transition text-left cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#23a55a]" />
                <span className="font-semibold">BeefBot Shield</span>
              </button>

              <button
                onClick={() => {
                  setShowChannelActionSheet(false);
                  onOpenPlugins();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1e1f22] hover:bg-[#35373c] text-white transition text-left cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#5865f2]" />
                <span className="font-semibold">Plugin Registry</span>
              </button>

              <button
                onClick={() => {
                  setShowChannelActionSheet(false);
                  onOpenCss();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1e1f22] hover:bg-[#35373c] text-white transition text-left cursor-pointer"
              >
                <Palette className="w-4 h-4 text-[#f0b232]" />
                <span className="font-semibold">Custom CSS Theme</span>
              </button>

              <button
                onClick={() => {
                  setShowChannelActionSheet(false);
                  onOpenExportDialog();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1e1f22] hover:bg-[#35373c] text-white transition text-left cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#00a8fc]" />
                <span className="font-semibold">Export Transcript</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
