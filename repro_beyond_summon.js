const { useGameStore } = require('./store/gameStore');
const { CARD_DATABASE } = require('./data/cards');

// Mock helpers
global.formatLog = (key, params) => key;
global.getCardName = (card) => card?.name || 'Unknown';

async function testGilgameshRestriction() {
    console.log("\n==============================================");
    console.log("TEST 1: Gilgamesh Effect Restricts Beyond Summon");
    console.log("==============================================");
    
    // c004 = Kepler, c014 = Scale Surveyor, c017 = Gilgamesh (EX), c038 = Beyond the Pendulum (EX)
    const deckList = ['c004', 'c014', 'c017', 'c038']; 
    const store = useGameStore.getState();
    store.initializeGame(CARD_DATABASE, deckList);

    let s = useGameStore.getState();
    const gilgameshId = s.extraDeck.find(id => s.cards[id].cardId === 'c017');
    const beyondId = s.extraDeck.find(id => s.cards[id].cardId === 'c038');

    console.log("--- Moving Gilgamesh to Monster Zone ---");
    store.moveCard(gilgameshId, 'MONSTER_ZONE', 0, 'EXTRA_DECK', true, true);
    
    console.log("--- Activating Gilgamesh Effect ---");
    store.activateEffect(gilgameshId);

    s = useGameStore.getState();
    if (s.effectSelectionState.isOpen) {
        s.resolveEffectSelection('yes');
        s = useGameStore.getState();
        if (s.searchState.isOpen) {
            const p1 = s.deck.find(id => s.cards[id].cardId === 'c004');
            s.resolveSearch(p1);
            s = useGameStore.getState();
            if (s.searchState.isOpen) {
                const p2 = s.deck.find(id => s.cards[id].cardId === 'c014');
                s.resolveSearch(p2);
            }
        }
    }

    s = useGameStore.getState();
    console.log(`turnEffectUsage after Gilgamesh: ${JSON.stringify(s.turnEffectUsage)}`);
    console.log(`Is Gilgamesh used? ${s.turnEffectUsage['c017'] > 0}`);

    // Try to link summon Beyond
    // Let's place Kepler and Surveyor in MZ1 and MZ2 to act as materials
    const keplerId = s.spellTrapZones[0];
    const surveyorId = s.spellTrapZones[4];
    store.moveCard(keplerId, 'MONSTER_ZONE', 1, 'SPELL_TRAP_ZONE', true, true);
    store.moveCard(surveyorId, 'MONSTER_ZONE', 2, 'SPELL_TRAP_ZONE', true, true);

    s = useGameStore.getState();
    store.moveCard(beyondId, 'EXTRA_MONSTER_ZONE', 0, 'EXTRA_DECK', false, false);

    s = useGameStore.getState();
    if (s.extraMonsterZones[0] !== beyondId) {
        console.log("PASS: Beyond Summon was blocked successfully after Gilgamesh effect!");
    } else {
        console.log("FAIL: Beyond Summon was NOT blocked after Gilgamesh effect!");
        process.exit(1);
    }
}

async function testPatentLicenseRestriction() {
    console.log("\n==============================================");
    console.log("TEST 2: Patent License Effect Restricts Beyond Summon");
    console.log("==============================================");

    // c004 = Kepler, c034 = Patent License, c038 = Beyond (EX)
    const deckList = ['c004', 'c034', 'c038']; 
    const store = useGameStore.getState();
    store.initializeGame(CARD_DATABASE, deckList);

    let s = useGameStore.getState();
    const patentLicenseId = s.deck.find(id => s.cards[id].cardId === 'c034');
    const beyondId = s.extraDeck.find(id => s.cards[id].cardId === 'c038');
    const keplerId = s.deck.find(id => s.cards[id].cardId === 'c004');

    console.log(`Patent License ID: ${patentLicenseId}`);
    console.log(`Kepler ID: ${keplerId}`);

    // Move Patent License to Spell/Trap Zone and activate it
    console.log("--- Moving Patent License to Spell/Trap Zone ---");
    store.moveCard(patentLicenseId, 'SPELL_TRAP_ZONE', 0, 'DECK', true, true);

    console.log("--- Activating Patent License Effect ---");
    store.activateEffect(patentLicenseId);

    s = useGameStore.getState();
    console.log(`Search state open: ${s.searchState.isOpen}`);
    if (s.searchState.isOpen) {
        // Search Kepler (DD monster) from deck to SS
        console.log("--- Resolving Patent License Search (select Kepler) ---");
        s.resolveSearch(keplerId);
        
        s = useGameStore.getState();
        console.log(`Zone selection state active: ${s.zoneSelectionState.isActive}`);
        if (s.zoneSelectionState.isActive) {
            console.log("--- Resolving zone selection to MZ1 ---");
            s.resolveZoneSelection('MONSTER_ZONE', 1);
        }
    }

    s = useGameStore.getState();
    console.log(`turnEffectUsage after Patent License: ${JSON.stringify(s.turnEffectUsage)}`);
    console.log(`Is Patent License used? ${s.turnEffectUsage['c034'] > 0}`);

    // Try to link summon Beyond
    // Place another P-monster on field as link material so we have materials if it were allowed
    // Since we need 2 monsters, we put Patent License card itself as material (just to mock MZ state, doesn't matter)
    console.log("--- Placing mock second material on MZ2 ---");
    store.moveCard(patentLicenseId, 'MONSTER_ZONE', 2, 'SPELL_TRAP_ZONE', true, true);

    s = useGameStore.getState();
    console.log(`MZ before Beyond Link: ${JSON.stringify(s.monsterZones)}`);

    console.log("--- Attempting to Link Summon Beyond the Pendulum ---");
    store.moveCard(beyondId, 'EXTRA_MONSTER_ZONE', 0, 'EXTRA_DECK', false, false);

    s = useGameStore.getState();
    if (s.extraMonsterZones[0] !== beyondId) {
        console.log("PASS: Beyond Summon was blocked successfully after Patent License!");
    } else {
        console.log("FAIL: Beyond Summon was NOT blocked after Patent License!");
        process.exit(1);
    }
}

async function runAll() {
    await testGilgameshRestriction();
    await testPatentLicenseRestriction();
    console.log("\nALL TESTS PASSED!");
}

runAll();
