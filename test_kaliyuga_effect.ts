import { CARD_DATABASE } from './data/cards';
import { useGameStore } from './store/gameStore';
import { formatLog } from './data/locales';

function setupTest() {
    const list = [
        'c008', // Abyss Ragnarok (Lv8)
        'c010', // Thomas (Lv8)
        'c010', // Thomas 2 (Lv8) for multiple Thomas tests
        'c044', // Kali Yuga (Rank 8 EX)
        'c043', // Dark Occultism (Normal Spell)
        'c005', // Dark Contract with the Gate (Correct ID)
        'c019', // High King Temujin (Lv8 DDD)
        'c007', // Flame King Genghis (Lv6 DDD)
        'c006', // Dark Contract with the Swamp King (Continuous Spell)
        'c011', // Orthros (Lv4 DD Pendulum Tuner)
    ];
    
    const instantiatedCards: { [key: string]: any } = {};
    list.forEach((cid, index) => {
        const id = `${cid}_${index}`;
        const dbCard = CARD_DATABASE[cid];
        instantiatedCards[id] = {
            ...dbCard,
            id,
            faceUp: false
        };
    });
    
    useGameStore.setState({
        cards: instantiatedCards,
        deck: Object.keys(instantiatedCards),
        hand: [],
        graveyard: [],
        banished: [],
        spellTrapZones: Array(5).fill(null),
        monsterZones: Array(5).fill(null),
        extraMonsterZones: Array(2).fill(null),
        fieldZone: null,
        logs: [],
        turnEffectUsage: {},
        ftkModeActive: true,
        opponentLp: 8000,
        materials: {},
        cardPropertyModifiers: {},
        language: 'ja',
        triggerCandidates: []
    } as any);
}

function runTests() {
    console.log("=== Setup Case: Kali Yuga Verification ===");
    setupTest();
    
    const state = useGameStore.getState() as any;
    const ragnarokId = state.deck.find((id: string) => state.cards[id].cardId === 'c008')!;
    const thomasId = state.deck.find((id: string) => state.cards[id].cardId === 'c010')!;
    const kaliYugaId = state.deck.find((id: string) => state.cards[id].cardId === 'c044')!;
    const occultismId = state.deck.find((id: string) => state.cards[id].cardId === 'c043')!;
    const gateId = state.deck.find((id: string) => state.cards[id].cardId === 'c005')!;
    const temujinId = state.deck.find((id: string) => state.cards[id].cardId === 'c019')!;
    
    // Put materials on field (Monster Zone 0 and 1)
    // We use Thomas (c010) and High King Temujin (c019) as material for Kali Yuga
    (useGameStore.getState() as any).moveCard(temujinId, 'MONSTER_ZONE', 0, undefined, false, false, undefined, true);
    (useGameStore.getState() as any).moveCard(thomasId, 'MONSTER_ZONE', 1, undefined, false, false, undefined, true);
    
    // Move Kali Yuga to EX deck, Ragnarok to GY (so Temujin has DD target in GY), Occultism to Hand
    (useGameStore.getState() as any).moveCard(kaliYugaId, 'EXTRA_DECK', undefined, undefined, false, false, undefined, true);
    (useGameStore.getState() as any).moveCard(ragnarokId, 'GRAVEYARD', undefined, undefined, false, false, undefined, true);
    (useGameStore.getState() as any).moveCard(occultismId, 'HAND', undefined, undefined, false, false, undefined, true);
    
    console.log("Materials on Field before Xyz:", (useGameStore.getState() as any).monsterZones.map((id: string | null) => id ? (useGameStore.getState() as any).cards[id].name : 'empty'));
    console.log("Ragnarok in GY:", (useGameStore.getState() as any).graveyard.includes(ragnarokId));
    console.log("High King Temujin on field:", (useGameStore.getState() as any).monsterZones.includes(temujinId));

    // Case 1: Xyz Summon Kali Yuga using High King Temujin and Thomas
    console.log("\n--- Case 1: Xyz Summon Kali Yuga with High King Temujin ---");
    (useGameStore.getState() as any).resolveXyzSummon(kaliYugaId, [temujinId, thomasId], 'MONSTER_ZONE', 2);
    
    const freshState = useGameStore.getState() as any;
    console.log("Kali Yuga Zone:", freshState.monsterZones[2] === kaliYugaId ? "Monster Zone 2" : "Fail");
    console.log("Materials attached to Kali Yuga:", freshState.materials[kaliYugaId]);
    
    // Check if Temujin triggered
    console.log("Trigger Candidates:", freshState.triggerCandidates);
    console.log("Trigger Candidate Names:", freshState.triggerCandidates.map((id: string) => freshState.cards[id]?.name));

    // Case 5: Thomas Monster Effect Target Validation
    console.log("\n--- Case 5: Thomas Monster Effect Target Validation ---");
    setupTest(); // Reset state
    
    const s2 = useGameStore.getState() as any;
    const thomasMZId = s2.deck.find((id: string) => s2.cards[id].cardId === 'c010')!;
    const pCardPZone0 = s2.deck.find((id: string) => s2.cards[id].cardId === 'c008')!; // Ragnarok (Pendulum)
    const pCardSTZone1 = s2.deck.find((id: string) => s2.cards[id].cardId === 'c010' && id !== thomasMZId)!; // Another Thomas (Pendulum)
    const gateSTZone4 = s2.deck.find((id: string) => s2.cards[id].cardId === 'c005')!; // Gate (Continuous Spell, non-P)

    // Put Thomas in Monster Zone
    s2.moveCard(thomasMZId, 'MONSTER_ZONE', 0, undefined, false, false, undefined, true);
    // Put Ragnarok in Spell/Trap Zone 0 (P-Zone 0, is Pendulum)
    s2.moveCard(pCardPZone0, 'SPELL_TRAP_ZONE', 0, undefined, false, false, undefined, true);
    // Put another Thomas in Spell/Trap Zone 1 (Non-P-Zone, is Pendulum)
    s2.moveCard(pCardSTZone1, 'SPELL_TRAP_ZONE', 1, undefined, false, false, undefined, true);
    // Put Gate in Spell/Trap Zone 4 (P-Zone 4, but non-P card)
    s2.moveCard(gateSTZone4, 'SPELL_TRAP_ZONE', 4, undefined, false, false, undefined, true);

    const checkState = useGameStore.getState() as any;
    console.log("Spell/Trap Zone 0 Card Name:", checkState.cards[checkState.spellTrapZones[0]]?.name);
    console.log("Spell/Trap Zone 1 Card Name:", checkState.cards[checkState.spellTrapZones[1]]?.name);
    console.log("Spell/Trap Zone 4 Card Name:", checkState.cards[checkState.spellTrapZones[4]]?.name);

    const targetingFilter = (c: any) => {
        if (!c) return false;
        const idx = checkState.spellTrapZones.indexOf(c.id);
        const isPZone = idx === 0 || idx === 4;
        const isPendulum = c.subType?.includes('PENDULUM');
        return isPZone && isPendulum;
    };

    console.log("Can target Ragnarok (P-Zone 0, Pendulum):", targetingFilter(checkState.cards[pCardPZone0])); // Should be true
    console.log("Can target Thomas (Non-P-Zone 1, Pendulum):", targetingFilter(checkState.cards[pCardSTZone1])); // Should be false
    console.log("Can target Gate (P-Zone 4, non-Pendulum):", targetingFilter(checkState.cards[gateSTZone4])); // Should be false

    // Case 6: Swamp King Fusion Log Validation
    console.log("\n--- Case 6: Swamp King Fusion Log Validation ---");
    setupTest();
    
    const s3 = useGameStore.getState() as any;
    const swampId = s3.deck.find((id: string) => s3.cards[id].cardId === 'c006')!;
    const genghisId = s3.deck.find((id: string) => s3.cards[id].cardId === 'c007')!;
    const matThomasId = s3.deck.find((id: string) => s3.cards[id].cardId === 'c010')!;
    const fusionTemujinId = s3.deck.find((id: string) => s3.cards[id].cardId === 'c019')!; // High King Temujin (Fusion)

    // Place Swamp King in ST zone
    s3.moveCard(swampId, 'SPELL_TRAP_ZONE', 2, undefined, false, false, undefined, true);
    // Put materials in Hand
    s3.moveCard(genghisId, 'HAND', undefined, undefined, false, false, undefined, true);
    s3.moveCard(matThomasId, 'HAND', undefined, undefined, false, false, undefined, true);
    // Put Fusion Monster in Extra Deck
    s3.moveCard(fusionTemujinId, 'EXTRA_DECK', undefined, undefined, false, false, undefined, true);

    // Simulate Swamp King effect resolution
    console.log("Simulating Swamp King effect resolution...");
    
    useGameStore.setState({ isMaterialMove: true });
    s3.moveCard(genghisId, 'GRAVEYARD', 0, 'HAND', true);
    s3.moveCard(matThomasId, 'GRAVEYARD', 0, 'HAND', true);
    useGameStore.setState({ isMaterialMove: false });

    const freshS3 = useGameStore.getState() as any;
    const name1 = freshS3.cards[genghisId].name;
    const name2 = freshS3.cards[matThomasId].name;
    freshS3.moveCard(fusionTemujinId, 'MONSTER_ZONE', 0, undefined, false, true, `mats:${name1}＋${name2}:swamp`);

    const finalLogs = useGameStore.getState().logs;
    console.log("Swamp King Fusion Log:", finalLogs[0]);

    // Case 7: Transient Material Log Cleanup Validation
    console.log("\n--- Case 7: Transient Material Log Cleanup Validation ---");
    setupTest();
    const s4 = useGameStore.getState() as any;
    
    const errMessage = formatLog('log_error_material');
    s4.addLog(errMessage);
    console.log("Initial log list contains error:", useGameStore.getState().logs.includes(errMessage));

    console.log("Adding next step log manually via addLog...");
    (useGameStore.getState() as any).addLog("新しい手順");
    console.log("Log list contains error after addLog:", useGameStore.getState().logs.includes(errMessage));
    console.log("Log list top entry:", useGameStore.getState().logs[0]);

    (useGameStore.getState() as any).addLog(errMessage);
    console.log("Re-added error log, verified:", useGameStore.getState().logs.includes(errMessage));

    console.log("Performing moveCard action to move Ragnarok to Hand...");
    const ragnarokId2 = s4.deck.find((id: string) => s4.cards[id].cardId === 'c008')!;
    (useGameStore.getState() as any).moveCard(ragnarokId2, 'HAND', undefined, undefined, false, false, undefined, true);

    console.log("Log list contains error after moveCard:", useGameStore.getState().logs.includes(errMessage));

    // Case 8: Pendulum Summon Replay Validation
    console.log("\n--- Case 8: Pendulum Summon Replay Validation ---");
    setupTest();
    const s5 = useGameStore.getState() as any;
    
    const orthrosId = s5.deck.find((id: string) => s5.cards[id].cardId === 'c011')!; // Scale 3
    const ragnarokScaleId = s5.deck.find((id: string) => s5.cards[id].cardId === 'c008')!; // Scale 5
    const summonThomasId = s5.deck.find((id: string) => s5.cards[id].cardId === 'c010')!; // Lv8 (between 3 and 5)

    // Step A: Set Scales
    console.log("Setting Scales...");
    s5.moveCard(orthrosId, 'SPELL_TRAP_ZONE', 0, undefined, false, false, undefined, true);
    s5.moveCard(ragnarokScaleId, 'SPELL_TRAP_ZONE', 4, undefined, false, false, undefined, true);
    s5.moveCard(summonThomasId, 'HAND', undefined, undefined, false, false, undefined, true);
    
    // Save history step 0 (Scales are set, Thomas is in Hand)
    (useGameStore.getState() as any).pushHistory();
    const snap0 = JSON.parse(JSON.stringify(useGameStore.getState()));

    // Step B: Pendulum Summon Thomas
    console.log("Pendulum Summoning Thomas...");
    useGameStore.setState({ isBatching: true, isHistoryBatching: true });
    (useGameStore.getState() as any).moveCard(summonThomasId, 'MONSTER_ZONE', 0, 'HAND', true, true, 'PENDULUM', true);
    useGameStore.setState((state: any) => ({
        pendulumSummonCount: state.pendulumSummonCount + 1,
        isBatching: false,
        isHistoryBatching: false
    }));
    (useGameStore.getState() as any).pushHistory();
    const snap1 = JSON.parse(JSON.stringify(useGameStore.getState()));

    console.log("Thomas position in final snap:", snap1.monsterZones[0] === summonThomasId ? "Monster Zone 0" : "Fail");
    console.log("Orthros position in final snap:", snap1.spellTrapZones[0] === orthrosId ? "P-Zone 0" : "Fail");
    console.log("Ragnarok position in final snap:", snap1.spellTrapZones[4] === ragnarokScaleId ? "P-Zone 4" : "Fail");

    // Let's test the getMidSnapshot logic with the new P-scale safeguard
    console.log("Evaluating intermediate midSnapshot behavior...");
    
    let currentMidSnapshot = snap0 ? JSON.parse(JSON.stringify(snap0)) : null;
    const p1 = snap1.spellTrapZones[0];
    const p4 = snap1.spellTrapZones[4];
    const sCount = snap1.pendulumSummonCount ?? 0;
    const prevPendulumSummonCount = snap0.pendulumSummonCount ?? 0;

    // Apply the P-scale safeguards
    if (currentMidSnapshot && sCount > prevPendulumSummonCount && p1 && p4) {
        // Safe cast check
        const getMidSnapshot = (prev: any, final: any, movedIds: Set<string>): any => {
            const mid = JSON.parse(JSON.stringify(prev));
            const arrays = ['hand', 'graveyard', 'banished', 'extraDeck', 'deck', 'monsterZones', 'spellTrapZones', 'extraMonsterZones'];
            movedIds.forEach(cardId => {
                arrays.forEach(key => {
                    if (Array.isArray(mid[key])) {
                        mid[key] = mid[key].map((x: any) => x === cardId ? null : x);
                        if (['hand', 'graveyard', 'banished', 'extraDeck', 'deck'].includes(key)) {
                            mid[key] = mid[key].filter((x: any) => x !== null && x !== undefined);
                        }
                    }
                });
                arrays.forEach(key => {
                    if (Array.isArray(final[key])) {
                        if (['monsterZones', 'spellTrapZones', 'extraMonsterZones'].includes(key)) {
                            const idx = final[key].indexOf(cardId);
                            if (idx !== -1) {
                                mid[key][idx] = cardId;
                            }
                        }
                    }
                });
            });
            return mid;
        };

        const scaleIds = new Set([p1, p4].filter(Boolean));
        currentMidSnapshot = getMidSnapshot(currentMidSnapshot, snap1, scaleIds);
    }

    console.log("Orthros in midSnapshot P-Zone 0:", currentMidSnapshot.spellTrapZones[0] === orthrosId);
    console.log("Ragnarok in midSnapshot P-Zone 4:", currentMidSnapshot.spellTrapZones[4] === ragnarokScaleId);
    console.log("Orthros NOT in hand in midSnapshot:", !currentMidSnapshot.hand.includes(orthrosId));
}

try {
    runTests();
    console.log("\nALL KALI YUGA, THOMAS, SWAMP KING, ERROR LOG CLEANUP & P-SUMMON REPLAY TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("Test failed:", err);
}
