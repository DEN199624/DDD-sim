const { useGameStore } = require('./store/gameStore');
const { CARD_DATABASE } = require('./data/cards');

// Mock helpers
global.formatLog = (key, params) => key;
global.getCardName = (card) => card?.name || 'Unknown';

async function runMockedSurveyorTest() {
    console.log("\n==============================================");
    console.log("TEST: Scale Surveyor P-Effect Arc Crisis Logic");
    console.log("==============================================");

    // c032 = Arc Crisis, c014 = Scale Surveyor, c004 = Kepler
    const deckList = ['c032', 'c014', 'c004']; 
    const store = useGameStore.getState();
    store.initializeGame(CARD_DATABASE, deckList);

    let s = useGameStore.getState();
    
    // Find card instances in any possible starting zones (deck, extraDeck, or hand)
    const findInstanceId = (cardId, state) => {
        const sources = [state.deck, state.extraDeck, state.hand];
        for (const list of sources) {
            const found = list.find(id => state.cards[id].cardId === cardId);
            if (found) return found;
        }
        return null;
    };

    const arcCrisisId = findInstanceId('c032', s);
    const surveyorId = findInstanceId('c014', s);
    const keplerId = findInstanceId('c004', s);

    console.log(`Arc Crisis ID: ${arcCrisisId}`);
    console.log(`Surveyor ID: ${surveyorId}`);
    console.log(`Kepler ID: ${keplerId}`);

    if (!arcCrisisId || !surveyorId) {
        console.log("FAIL: Could not find card instances in initial state!");
        process.exit(1);
    }

    // Place Arc Crisis on field (Monster Zone 0)
    // First remove from deck/extraDeck if necessary and move to MONSTER_ZONE
    console.log("--- Moving Arc Crisis to Monster Zone ---");
    store.moveCard(arcCrisisId, 'MONSTER_ZONE', 0, s.cards[arcCrisisId].zone || 'DECK', true, true);

    s = useGameStore.getState();
    console.log(`Arc Crisis on field? ${s.monsterZones[0] === arcCrisisId}`);
    console.log(`Arc Crisis faceUp: ${s.cards[arcCrisisId].faceUp}`);

    // Simulate scale surveyor P-effect action on Arc Crisis
    console.log("--- Simulating Scale Surveyor returning Arc Crisis to EX Deck ---");
    
    // 1. Move to EX Deck
    store.moveCard(arcCrisisId, 'EXTRA_DECK', 0, 'MONSTER_ZONE', true, true);
    
    // 2. Apply face-down and restriction state modification (same as in our gameStore.ts implementation)
    useGameStore.setState((state) => ({
        cards: {
            ...state.cards,
            [arcCrisisId]: {
                ...state.cards[arcCrisisId],
                faceUp: false
            }
        },
        turnEffectUsage: {
            ...state.turnEffectUsage,
            c032_cannot_summon: 1
        }
    }));

    s = useGameStore.getState();
    console.log(`Arc Crisis in Extra Deck? ${s.extraDeck.includes(arcCrisisId)}`);
    console.log(`Arc Crisis faceUp now: ${s.cards[arcCrisisId].faceUp}`);
    console.log(`Is Arc Crisis restricted from summon? ${s.turnEffectUsage['c032_cannot_summon'] > 0}`);

    if (s.cards[arcCrisisId].faceUp === false && s.turnEffectUsage['c032_cannot_summon'] === 1) {
        console.log("PASS: Arc Crisis is face-down and restricted in EX Deck!");
    } else {
        console.log("FAIL: Arc Crisis is NOT face-down or NOT restricted!");
        process.exit(1);
    }

    // Try to summon Arc Crisis back to Monster Zone 0
    console.log("--- Attempting to Special Summon Arc Crisis back to MZ0 ---");
    store.moveCard(arcCrisisId, 'MONSTER_ZONE', 0, 'EXTRA_DECK', false, false); // isSpecialSummon=true, suppressTrigger=false

    s = useGameStore.getState();
    console.log(`Arc Crisis back on field? ${s.monsterZones[0] === arcCrisisId}`);
    
    if (s.monsterZones[0] !== arcCrisisId) {
        console.log("PASS: Special Summon of restricted Arc Crisis was blocked!");
    } else {
        console.log("FAIL: Special Summon of restricted Arc Crisis was NOT blocked!");
        process.exit(1);
    }

    // Test startPendulumSummon candidate filtering
    console.log("--- Checking P-Summon Candidates (should NOT include Arc Crisis) ---");
    // Place surveyor in P-zone 0, Kepler in P-zone 4 to allow P-summon test
    useGameStore.setState((state) => ({
        cards: {
            ...state.cards,
            [surveyorId]: { ...state.cards[surveyorId], zone: 'SPELL_TRAP_ZONE', scale: 8 },
            [keplerId]: { ...state.cards[keplerId], zone: 'SPELL_TRAP_ZONE', scale: 1, type: 'MONSTER', subType: 'PENDULUM', level: 1 }
        },
        spellTrapZones: [surveyorId, null, null, null, keplerId]
    }));
    
    // Temporarily make Arc Crisis faceUp: true to test if candidate filter works on it even if it was faceUp
    // (P-Summon candidates normally only include faceUp P-monsters)
    useGameStore.setState((state) => ({
        cards: {
            ...state.cards,
            [arcCrisisId]: { ...state.cards[arcCrisisId], faceUp: true }
        }
    }));

    store.startPendulumSummon();
    s = useGameStore.getState();
    console.log(`P-Summon candidates: ${JSON.stringify(s.pendulumCandidates)}`);
    console.log(`Does candidates include Arc Crisis? ${s.pendulumCandidates.includes(arcCrisisId)}`);

    if (!s.pendulumCandidates.includes(arcCrisisId)) {
        console.log("PASS: Arc Crisis was excluded from P-Summon candidates!");
    } else {
        console.log("FAIL: Arc Crisis was NOT excluded from P-Summon candidates!");
        process.exit(1);
    }

    // Test Reset Turn
    console.log("--- Resetting Turn ---");
    store.resetTurn();

    s = useGameStore.getState();
    console.log(`Is Arc Crisis restricted after turn reset? ${s.turnEffectUsage['c032_cannot_summon'] > 0}`);

    if (!s.turnEffectUsage['c032_cannot_summon']) {
        console.log("PASS: Summon restriction was cleared after turn reset!");
    } else {
        console.log("FAIL: Summon restriction was NOT cleared after turn reset!");
        process.exit(1);
    }
}

runMockedSurveyorTest();
