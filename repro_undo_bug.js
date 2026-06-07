const { useGameStore } = require('./store/gameStore');
const { CARD_DATABASE } = require('./data/cards');

// Mock helpers needed by store
global.formatLog = (key, params) => key;
global.getCardName = (card) => card?.name || 'Unknown';

async function runTest() {
    console.log("Initializing Game...");
    const deckList = ['c004', 'c014']; // Kepler, Scale Surveyor
    
    // Call initializeGame
    useGameStore.getState().initializeGame(CARD_DATABASE, deckList);

    // Always fetch fresh state after store updates!
    let store = useGameStore.getState();
    const cards = Object.values(store.cards);
    
    console.log("Total cards generated:", cards.length);
    console.log("Cards IDs generated:", cards.map(c => c.cardId));

    const keplerId = cards.find(c => c.cardId === 'c004')?.id;
    const surveyorId = cards.find(c => c.cardId === 'c014')?.id;

    if (!keplerId || !surveyorId) {
        console.error("Failed to generate card instances.");
        process.exit(1);
    }

    console.log(`Kepler instance ID: ${keplerId}`);
    console.log(`Surveyor instance ID: ${surveyorId}`);
    console.log(`Initial Hand: ${JSON.stringify(store.hand)}`);

    // Draw cards to hand
    store.drawCard(true);
    store.drawCard(true);

    store = useGameStore.getState();
    console.log(`Hand after draw: ${JSON.stringify(store.hand)}`);

    // Step 1: Normal Summon Kepler
    console.log("--- Normal Summoning Kepler ---");
    store.moveCard(keplerId, 'MONSTER_ZONE', 0, 'HAND', false, false);
    
    store = useGameStore.getState();
    if (store.effectSelectionState.isOpen) {
        console.log(`Kepler effect prompt: ${store.effectSelectionState.title}`);
        // Choose 'cancel'
        store.resolveEffectSelection('cancel');
    }

    store = useGameStore.getState();
    console.log(`Hand after Kepler summon: ${JSON.stringify(store.hand)}`);
    console.log(`MZ: ${JSON.stringify(store.monsterZones)}`);

    // Step 2: Special Summon Surveyor from hand
    console.log("--- Activating Surveyor Hand Effect ---");
    
    // Trigger Surveyor effect manually by calling activateEffect on it (since it's in Hand)
    store.activateEffect(surveyorId);

    store = useGameStore.getState();
    console.log(`Surveyor SS Choice open: ${store.effectSelectionState.isOpen}`);
    if (store.effectSelectionState.isOpen) {
        // Resolve Choice: 'yes'
        store.resolveEffectSelection('yes');
        
        // Zone Selection should be open
        store = useGameStore.getState();
        console.log(`Zone Selection open: ${store.zoneSelectionState.isOpen}`);
        if (store.zoneSelectionState.isOpen) {
            // Resolve Zone: MONSTER_ZONE index 1
            store.resolveZoneSelection('MONSTER_ZONE', 1);
        }
    }

    store = useGameStore.getState();
    console.log("--- Surveyor SS Completed ---");
    console.log(`MZ: ${JSON.stringify(store.monsterZones)}`);
    console.log(`Hand: ${JSON.stringify(store.hand)}`);
    console.log(`turnEffectUsage: ${JSON.stringify(store.turnEffectUsage)}`);
    console.log(`c014_hand_ss used? ${store.turnEffectUsage['c014_hand_ss'] === 1}`);
    console.log(`History length: ${store.history.length}`);
    console.log(`Current Logs: ${JSON.stringify(store.logs)}`);

    // Step 3: Perform Undo
    console.log("--- Performing Undo ---");
    store.undo();

    store = useGameStore.getState();
    console.log("--- Undo Completed ---");
    console.log(`MZ: ${JSON.stringify(store.monsterZones)}`);
    console.log(`Hand: ${JSON.stringify(store.hand)}`);
    console.log(`turnEffectUsage: ${JSON.stringify(store.turnEffectUsage)}`);
    console.log(`c014_hand_ss used? ${store.turnEffectUsage['c014_hand_ss'] === 1}`);
    console.log(`Current Logs: ${JSON.stringify(store.logs)}`);

    const success = !store.monsterZones.includes(surveyorId) && 
                    store.hand.includes(surveyorId) && 
                    !store.turnEffectUsage['c014_hand_ss'];
    
    if (success) {
        console.log("TEST PASSED: Undo successfully reverted surveyor to hand and reset effect usage!");
        process.exit(0);
    } else {
        console.log("TEST FAILED!");
        process.exit(1);
    }
}

runTest();
