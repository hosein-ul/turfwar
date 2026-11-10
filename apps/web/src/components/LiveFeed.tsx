import React from 'react';

interface LiveEvent {
  id: string;
  timestamp: number;
  eventType: string;
  summary: string;
  txHash?: string;
}

interface LiveFeedProps {
  events: LiveEvent[];
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ events }) => {
  const getEventClass = (type: string) => {
    switch (type) {
      case 'MARKET_TRADE': return 'trade';
      case 'BOUNTY_POSTED':
      case 'BOUNTY_ACCEPTED':
      case 'BOUNTY_SETTLED': return 'bounty';
      case 'NFT_TRANSFER': return 'nft';
      default: return '';
    }
  };

  return (
    <div className="live-feed interactive">
      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--gold-mid)', fontFamily: 'var(--font-title)', letterSpacing: '1px', marginBottom: '2px' }}>
        📜 Frontier Ledger & Events
      </div>
      {events.length === 0 ? (
        <div className="feed-item" style={{ opacity: 0.6 }}>Waiting for frontier activity...</div>
      ) : (
        events.map((evt) => (
          <div key={evt.id} className={`feed-item ${getEventClass(evt.eventType)}`}>
            <div>{evt.summary}</div>
            {evt.txHash && (
              <div style={{ fontSize: '9px', color: 'var(--gold-light)', marginTop: '2px', fontFamily: 'var(--font-pixel)' }}>
                TX: {evt.txHash.slice(0, 10)}... (Verified)
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
