import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export function LogWindow() {
    const { logs, startReplay, stopReplay, isReplaying, replaySpeed, setReplaySpeed, nextReplayStep } = useGameStore();
    const [isAscending, setIsAscending] = useState(false);

    // Automatic playback loop
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isReplaying) {
            const duration = 1500 / replaySpeed; // 1.5s, 0.75s, 0.5s
            interval = setInterval(() => {
                nextReplayStep();
            }, duration);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isReplaying, replaySpeed, nextReplayStep]);

    const displayedLogs = isAscending ? [...logs].reverse() : logs;

    return (
        <div style={{
            width: '300px',
            minWidth: '250px',
            height: '100%',
            maxHeight: '80vh',
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '10px',
            overflowY: 'auto',
            color: '#eee',
            fontSize: '12px',
            fontFamily: 'monospace',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #555', paddingBottom: '5px', marginBottom: '5px' }}>
                <h3 style={{ margin: 0 }}>Duel Log</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                    {isReplaying ? (
                        <button
                            onClick={() => stopReplay()}
                            style={{
                                padding: '2px 8px',
                                fontSize: '10px',
                                backgroundColor: '#f44336',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            ■ Stop
                        </button>
                    ) : (
                        <button
                            onClick={() => startReplay()}
                            disabled={logs.length === 0}
                            style={{
                                padding: '2px 8px',
                                fontSize: '10px',
                                backgroundColor: '#4caf50',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: logs.length === 0 ? 0.5 : 1
                            }}
                        >
                            ▶ Replay
                        </button>
                    )}

                    <button
                        onClick={() => {
                            const speeds = [1, 2, 3];
                            const next = speeds[(speeds.indexOf(replaySpeed) + 1) % speeds.length];
                            setReplaySpeed(next);
                        }}
                        style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            backgroundColor: '#ff9800',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            minWidth: '30px'
                        }}
                    >
                        {replaySpeed}x
                    </button>

                    <button
                        onClick={() => setIsAscending(!isAscending)}
                        style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            backgroundColor: isAscending ? '#4a90d9' : '#555',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        {isAscending ? '↓New' : '↑Old'}
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {displayedLogs.map((log, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #333', paddingBottom: '2px' }}>
                        <span style={{ color: '#888' }}>[{isAscending ? i + 1 : logs.length - i}]</span> {log}
                    </div>
                ))}
            </div>
        </div>
    );
}
