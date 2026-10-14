import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMatchMessage, leaveBlindDate, reportAndLeaveStranger, shareMatchTrack, type MatchInfo } from '@/actions/blind-date';
import MatchTimer from '@/components/features/MatchTimer';
import ReportModal from '@/components/features/ReportModal';
import BlindDateMusicPlayer from '@/components/features/BlindDateMusicPlayer';
import SharedMusicPlayer from '@/components/features/SharedMusicPlayer';
import { getRandomIcebreaker } from '@/lib/icebreakers';
import { getRandomGossipWhisper } from '@/lib/campus-stories';
import { useToast } from '@/context/ToastContext';
import { useAnon } from '@/context/AnonContext';
import type { SharedTrack } from '@/types';

interface MessageItem {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface BlindDateChatProps {
  matchInfo: MatchInfo;
  onEnd: (reason: 'timeout' | 'left' | 'reported') => void;
}

export default function BlindDateChat({ matchInfo, onEnd }: BlindDateChatProps) {
  const { profile } = useAnon();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [icebreaker, setIcebreaker] = useState<string>(() => getRandomIcebreaker(matchInfo.mode));
  const [showReport, setShowReport] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [sharedTrack, setSharedTrack] = useState<SharedTrack | null>(null);
  const [isSending, startSendTransition] = useTransition();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasBotChimedRef = useRef(false);

  // 1. Initial message fetch & realtime subscription
  useEffect(() => {
    const supabase = createClient();

    // Fetch initial messages
    async function loadMessages() {
      const { data } = await supabase
        .from('match_messages')
        .select('id, sender_id, body, created_at')
        .eq('match_id', matchInfo.matchId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data as MessageItem[]);
    }
    loadMessages();

    // Subscribe to new messages for this match
    const messageChannel = supabase
      .channel(`chat-${matchInfo.matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_messages',
          filter: `match_id=eq.${matchInfo.matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    // Subscribe to match updates (e.g. partner left)
    const matchChannel = supabase
      .channel(`match-status-${matchInfo.matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchInfo.matchId}`,
        },
        (payload: any) => {
          if (payload.new?.left_at && payload.new?.left_by !== profile?.id) {
            onEnd('left');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(matchChannel);
    };
  }, [matchInfo.matchId, onEnd, profile?.id]);

  // 2. Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scan messages for the most recent [Now Playing] track
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.body.startsWith('[Now Playing]:')) {
        const payload = msg.body.replace(/^\[Now Playing\]:\s*/, '');
        const parts = payload.split('|');
        if (parts[0]) {
          setSharedTrack({
            youtubeId: parts[0].trim(),
            title: parts[1]?.trim() || 'Shared Song',
            sharedBy: msg.sender_id === profile?.id ? 'You' : matchInfo.partnerHandle,
          });
          break;
        }
      }
    }
  }, [messages, profile?.id, matchInfo.partnerHandle]);

  const handleShareTrack = async (urlOrId: string, title?: string): Promise<boolean> => {
    const res = await shareMatchTrack(matchInfo.matchId, urlOrId, title);
    if (res.success && res.data) {
      showToast(`Shared "${res.data.title}" 🎶`, 'success');
      return true;
    } else {
      showToast(res.error || 'Failed to share track', 'error');
      return false;
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || isSending) return;

    startSendTransition(async () => {
      const res = await sendMatchMessage(matchInfo.matchId, inputText);
      if (res.success) {
        setInputText('');
      } else {
        showToast(res.error || 'Failed to send message', 'error');
      }
    });
  };

  const handleUseIcebreaker = () => {
    setInputText(icebreaker);
  };

  const handleShuffleIcebreaker = () => {
    setIcebreaker(getRandomIcebreaker(matchInfo.mode));
  };

  const handleSendBotTea = useCallback(() => {
    const whisper = getRandomGossipWhisper();
    startSendTransition(async () => {
      const res = await sendMatchMessage(matchInfo.matchId, `[Campus Bot]: ${whisper}`);
      if (!res.success) {
        showToast(res.error || 'Failed to send campus tea', 'error');
      }
    });
  }, [matchInfo.matchId, showToast]);

  // If chat is quiet after 45s (fewer than 3 messages), bot chimes in with a campus whisper
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasBotChimedRef.current && messages.length <= 2) {
        hasBotChimedRef.current = true;
        handleSendBotTea();
      }
    }, 45000);

    return () => clearTimeout(timer);
  }, [messages.length, handleSendBotTea]);

  const handleLeaveConfirm = async () => {
    await leaveBlindDate(matchInfo.matchId);
    onEnd('left');
  };

  const handleReportStranger = async (reason: string) => {
    await reportAndLeaveStranger(matchInfo.matchId, matchInfo.partnerId, reason);
    showToast('Stranger reported and chat ended 🛡️', 'info');
    onEnd('reported');
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] bg-card rounded-2xl border border-ink/5 shadow-sm overflow-hidden animate-fade-in">
      {/* Top Bar: Stranger Handle, Timer, Leave & Report */}
      <div className="px-4 py-3 bg-paper border-b border-ink/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
            matchInfo.mode === 'garba'
              ? 'bg-amber-100 text-amber-700'
              : matchInfo.mode === 'music'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
              : 'bg-coral-soft text-coral'
          }`}>
            {matchInfo.mode === 'garba' ? '🪩' : matchInfo.mode === 'music' ? '🎧' : '🎭'}
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-xs text-ink truncate">
              {matchInfo.partnerHandle}
            </h2>
            <span className="font-mono text-[9px] text-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              {matchInfo.mode === 'garba'
                ? 'Garba Partner Match'
                : matchInfo.mode === 'music'
                ? `Music Match ${matchInfo.vibe ? `(${matchInfo.vibe})` : ''}`
                : 'Connected'}
            </span>
          </div>
        </div>

        {/* Server Authoritative Timer */}
        <div className="flex items-center gap-2">
          <MatchTimer
            endsAt={matchInfo.endsAt}
            serverTime={matchInfo.serverTime}
            onExpire={() => onEnd('timeout')}
          />

          <button
            onClick={() => setShowReport(true)}
            className="p-1.5 rounded-lg hover:bg-coral-soft text-ink-soft hover:text-coral transition-colors"
            title="Report stranger"
            aria-label="Report stranger"
          >
            🛡️
          </button>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="px-2.5 py-1 rounded-lg bg-ink/5 hover:bg-coral-soft text-ink-soft hover:text-coral font-mono text-[11px] font-medium transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="px-3 py-1.5 bg-coral-soft/50 border-b border-coral/10 text-center">
        <p className="font-body text-[10px] text-coral leading-tight">
          ⚠️ Don&apos;t share real names, phones, or socials. Report anyone who makes you uncomfortable.
        </p>
      </div>

      {/* Synchronized Background Music & Ambient Vibe */}
      <BlindDateMusicPlayer initialVibe={matchInfo.mode === 'garba' ? 'garba' : 'lofi'} />

      {/* Synchronized YouTube Co-Listening Player */}
      <SharedMusicPlayer currentTrack={sharedTrack} onShareTrack={handleShareTrack} />

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-display text-xs text-ink-soft">
              Connected with <span className="font-semibold text-ink">{matchInfo.partnerHandle}</span>!
            </p>
            <p className="font-body text-[11px] text-ink-soft/70 mt-1">
              Say hi or drop an icebreaker below to break the silence 👇
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.body.startsWith('[Now Playing]:')) {
              const parts = msg.body.replace(/^\[Now Playing\]:\s*/, '').split('|');
              const songTitle = parts[1] || 'A song';
              return (
                <div key={msg.id} className="flex justify-center my-1.5 animate-fade-in">
                  <div className="px-3 py-1 rounded-full bg-green-soft border border-green/20 text-center font-mono text-[10px] text-green flex items-center gap-1.5 shadow-2xs">
                    <span>🎶</span>
                    <span>
                      {msg.sender_id === profile?.id ? 'You' : matchInfo.partnerHandle} shared: <strong>{songTitle}</strong>
                    </span>
                  </div>
                </div>
              );
            }
            const isBot = msg.body.startsWith('[Campus Bot]') || msg.body.startsWith('👀');
            if (isBot) {
              const cleanBody = msg.body.replace(/^\[Campus Bot\]:\s*/, '');
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="max-w-[92%] px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center shadow-xs animate-fade-in">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="text-xs">🤖</span>
                      <span className="font-mono text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                        Campus Gossip Bot
                      </span>
                    </div>
                    <p className="font-body text-xs text-ink leading-relaxed font-medium">
                      {cleanBody}
                    </p>
                  </div>
                </div>
              );
            }

            const isMe = msg.sender_id === profile?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="font-mono text-[9px] text-ink-soft/60 px-1 mb-0.5">
                  {isMe ? 'You' : matchInfo.partnerHandle}
                </span>
                <div
                  className={`
                    max-w-[80%] px-3.5 py-2 rounded-2xl text-xs font-body leading-relaxed
                    ${isMe
                      ? 'bg-green text-white rounded-br-xs'
                      : 'bg-paper text-ink border border-ink/5 rounded-bl-xs shadow-xs'
                    }
                  `}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Icebreaker & Gossip Bot Suggestions */}
      <div className="px-3 py-2 bg-paper/60 border-t border-ink/5 flex items-center justify-between gap-2">
        <button
          onClick={handleUseIcebreaker}
          className="flex-1 text-left px-2.5 py-1 rounded-xl bg-ink/5 hover:bg-green-soft text-ink hover:text-green font-body text-[11px] truncate transition-colors"
          title="Click to use this icebreaker"
        >
          💡 <span className="italic">{icebreaker}</span>
        </button>
        <button
          onClick={handleShuffleIcebreaker}
          className="p-1 rounded-lg hover:bg-ink/5 text-xs text-ink-soft hover:text-ink transition-colors"
          title="Shuffle question"
          aria-label="Shuffle icebreaker"
        >
          🔄
        </button>
        <button
          onClick={handleSendBotTea}
          className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[11px] font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
          title="Drop a campus gossip or rumor into the chat"
        >
          ☕ <span>Spill Tea</span>
        </button>
      </div>

      {/* Message Input Box */}
      <div className="p-3 bg-paper border-t border-ink/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type anonymous message..."
            maxLength={300}
            className="
              flex-1 px-3.5 py-2.5 rounded-xl
              bg-card border border-ink/10
              font-body text-xs text-ink
              focus:outline-none focus:ring-2 focus:ring-green/30
              placeholder:text-ink-soft/40
              transition-all
            "
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isSending}
            className="
              px-4 py-2.5 rounded-xl
              bg-green text-white font-body text-xs font-semibold
              hover:bg-green/90 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed
            "
          >
            {isSending ? '...' : 'Send'}
          </button>
        </div>
        <div className="flex justify-between items-center px-1 mt-1">
          <span className="font-mono text-[9px] text-ink-soft/50">
            No contacts or handles
          </span>
          <span className="font-mono text-[9px] text-ink-soft/50">
            {inputText.length}/300
          </span>
        </div>
      </div>

      {/* Confirm Leave Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-card rounded-2xl p-5 max-w-xs w-full shadow-xl border border-ink/10 text-center animate-scale-up">
            <h3 className="font-display font-bold text-base text-ink mb-1.5">Leave chat early?</h3>
            <p className="font-body text-xs text-ink-soft mb-5">
              The 5-minute session will end for both you and your partner.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-ink/5 font-body text-xs text-ink hover:bg-ink/10"
              >
                Stay
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="flex-1 py-2 rounded-xl bg-coral text-white font-body text-xs font-semibold hover:bg-coral/90"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          targetType="user"
          targetId={matchInfo.partnerId}
        />
      )}
    </div>
  );
}
