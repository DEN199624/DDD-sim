import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export function EffectSelectionModal() {
    const { effectSelectionState, resolveEffectSelection } = useGameStore();
    const { isOpen: isChoosingEffect, title: effectPrompt, options: effectOptions } = effectSelectionState;
    const [isMinimized, setIsMinimized] = useState(false);

    // Reset minimized state when modal is closed / reopened
    useEffect(() => {
        if (!isChoosingEffect) {
            setIsMinimized(false);
        }
    }, [isChoosingEffect]);

    if (!isChoosingEffect) return null;

    const hasImages = effectOptions.some(opt => opt.imageUrl);

    if (isMinimized) {
        // Floating Mini Bar/Badge on the bottom-right corner (placed higher than search bar)
        return (
            <div style={{
                position: 'fixed',
                bottom: '160px', // place above search bar (100px)
                right: '20px',
                zIndex: 2100,
            }}>
                <button 
                    onClick={() => setIsMinimized(false)}
                    style={{
                        padding: '12px 18px',
                        background: '#10b981',
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
                    <span>⚡</span> {effectPrompt ? (effectPrompt.length > 12 ? effectPrompt.slice(0, 12) + '...' : effectPrompt) : '効果を選択'}
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
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
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

            <div style={{
                background: 'linear-gradient(135deg, #1e1e2e 0%, #11111b 100%)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                maxWidth: hasImages ? '600px' : '350px',
                width: '90%',
                maxHeight: '70vh',
                overflowY: 'auto'
            }}>
                <h3 style={{
                    marginBottom: '15px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>{effectPrompt}</h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: hasImages ? 'repeat(auto-fit, minmax(100px, 1fr))' : '1fr',
                    gap: '10px',
                    justifyContent: 'center'
                }}>
                    {effectOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => resolveEffectSelection(opt.value)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '10px',
                                padding: opt.imageUrl ? '10px' : '10px 15px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: opt.imageUrl ? 'center' : 'left',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {opt.imageUrl && (
                                <img
                                    src={opt.imageUrl}
                                    alt={opt.label}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '0.7',
                                        objectFit: 'cover',
                                        borderRadius: '6px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                    }}
                                />
                            )}
                            <span style={{ fontWeight: '500', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{opt.label}</span>
                            <div className="shiny-overlay" style={{
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '50%',
                                height: '100%',
                                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
                                transition: 'all 0.5s',
                                transform: 'skewX(-25deg)',
                                pointerEvents: 'none'
                            }} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
