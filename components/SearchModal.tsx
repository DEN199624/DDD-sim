import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card } from './Card';
import { formatLog } from '@/data/locales';

export function SearchModal() {
    const { searchState, resolveSearch, cancelSearch, deck, cards } = useGameStore();
    const { isOpen: isSearching, filter: searchFilter, prompt: searchPrompt, source: searchSource } = searchState;
    const [isMinimized, setIsMinimized] = useState(false);

    // Reset minimized state when modal is closed / reopened
    useEffect(() => {
        if (!isSearching) {
            setIsMinimized(false);
        }
    }, [isSearching]);

    if (!isSearching) return null;

    const sourceIds = searchSource || deck;

    const validTargets = sourceIds.filter((id) => {
        const card = cards[id];
        return card && (!searchFilter || searchFilter(card));
    });

    if (isMinimized) {
        // Floating Mini Bar/Badge on the bottom-right corner for mobile friendliness
        return (
            <div style={{
                position: 'fixed',
                bottom: '100px', // place above hand/controls
                right: '20px',
                zIndex: 2100,
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
            }}>
                <button 
                    onClick={() => setIsMinimized(false)}
                    style={{
                        padding: '12px 18px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '30px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span>🔍</span> {searchPrompt ? (searchPrompt.length > 12 ? searchPrompt.slice(0, 12) + '...' : searchPrompt) : formatLog('ui_select_card_add')} ({validTargets.length})
                </button>
                <button 
                    onClick={cancelSearch}
                    style={{
                        width: '40px',
                        height: '40px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Minimizer Toggle Button on top-right of screen */}
            <button 
                onClick={() => setIsMinimized(true)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    padding: '8px 16px',
                    background: '#4b5563',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                }}
            >
                🗕 盤面を確認 (縮小)
            </button>

            <div style={{ marginBottom: '20px', color: '#fff', fontSize: '20px', textAlign: 'center', padding: '0 10px' }}>
                {searchPrompt || formatLog('ui_select_card_add')}
            </div>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                maxWidth: '900px',
                justifyContent: 'center',
                overflowY: 'auto',
                maxHeight: '70vh',
                padding: '20px',
                border: '1px solid #444',
                borderRadius: '8px',
                background: 'rgba(20,20,20,0.9)'
            }}>
                {validTargets.length === 0 ? (
                    <div style={{ color: '#aaa' }}>{formatLog('ui_no_candidates')}</div>
                ) : (
                    validTargets.map((id) => {
                        // Determine Location
                        let loc = formatLog('ui_location_unknown');
                        let color = '#777';
                        const s = useGameStore.getState(); // Fresh state check
                        if (s.hand.includes(id)) { loc = formatLog('ui_location_hand'); color = '#2196F3'; }
                        else if (s.monsterZones.includes(id) || s.extraMonsterZones.includes(id)) { loc = formatLog('ui_location_field_m'); color = '#4CAF50'; }
                        else if (s.spellTrapZones.includes(id) || s.fieldZone === id) { loc = formatLog('ui_location_field_st'); color = '#8BC34A'; }
                        else if (s.graveyard.includes(id)) { loc = formatLog('ui_location_gy'); color = '#9E9E9E'; }
                        else if (s.banished.includes(id)) { loc = formatLog('ui_location_banished'); color = '#F44336'; }
                        else if (s.extraDeck.includes(id)) { loc = formatLog('ui_location_extra'); color = '#673AB7'; }
                        else if (s.deck.includes(id)) { loc = formatLog('ui_location_deck'); color = '#FFC107'; }

                        return (
                            <div key={id} onClick={() => resolveSearch(id)} style={{ cursor: 'pointer', transition: 'transform 0.2s', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    marginBottom: '4px',
                                    padding: '2px 6px',
                                    background: color,
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textShadow: '0 1px 2px black'
                                }}>
                                    {loc}
                                </div>
                                <Card card={cards[id]} isInteractive={false} disableDrag={true} dragId={`search_${id}`} />
                            </div>
                        );
                    })
                )}
            </div>

            <button onClick={cancelSearch} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px' }}>
                {formatLog('ui_cancel')}
            </button>
        </div>
    );
}
