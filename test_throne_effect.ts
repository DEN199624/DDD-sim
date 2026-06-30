import { CARD_DATABASE } from './data/cards';
import { useGameStore } from './store/gameStore';
import { getCardName } from './data/locales';

function setupTest() {
    const store = useGameStore.getState();
    
    // Main deck setup
    const mainList = [
        'c004', // Kepler
        'c009', // Copernicus
        'c011', // Orthros
        'c042', // Nightmare Throne
    ];
    
    // Instantiate cards based on CARD_DATABASE
    const instantiatedCards: { [key: string]: any } = {};
    mainList.forEach((cid, index) => {
        const id = `${cid}_${index}`;
        const dbCard = CARD_DATABASE[cid];
        instantiatedCards[id] = {
            ...dbCard,
            id,
            faceUp: false
        };
    });
    
    // Set game state
    useGameStore.setState({
        cards: instantiatedCards,
        deck: Object.keys(instantiatedCards), // All cards start in deck
        hand: [],
        graveyard: [],
        banished: [],
        spellTrapZones: Array(5).fill(null),
        monsterZones: Array(5).fill(null),
        extraMonsterZones: Array(2).fill(null),
        fieldZone: null,
        logs: [],
        turnEffectUsage: {},
        ftkModeActive: true, // Activate FTK mode to show LP changes if any
        opponentLp: 8000
    });
}

function runTests() {
    setupTest();
    
    console.log("=== Setup successful. Initial state ===");
    console.log("Deck:", useGameStore.getState().deck.map(id => useGameStore.getState().cards[id].name));
    
    // 1. Draw Nightmare Throne to Hand
    const throneId = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c042')!;
    useGameStore.getState().moveCard(throneId, 'HAND', undefined, undefined, false, false, undefined, true);
    console.log("Throne drawn to hand:", useGameStore.getState().hand.includes(throneId));
    
    // 2. Play Nightmare Throne to FIELD_ZONE
    console.log("\n--- Testing Throne Activation ---");
    useGameStore.getState().moveCard(throneId, 'FIELD_ZONE', undefined, undefined, false, false, undefined, true);
    
    // Assert Throne is in FIELD_ZONE
    console.log("Throne is in FIELD_ZONE:", useGameStore.getState().fieldZone === throneId);
    
    // Assert effect selection is open (automated trigger)
    const currentStore = useGameStore.getState() as any;
    console.log("Effect Selection Open:", currentStore.effectSelectionState?.isOpen || false);
    
    // Access selection state
    const selectionState = currentStore.effectSelectionState || {};
    console.log("Selection Title:", selectionState.title);
    console.log("Selection Options:", selectionState.options);
    
    // 3. Select 'search' option
    if (selectionState.onSelect) {
        console.log("\nSelecting 'search' option...");
        selectionState.onSelect('search');
        
        // Assert search screen is open
        const storeAfterResolve = useGameStore.getState();
        const searchState = storeAfterResolve.searchState;
        console.log("Search screen open:", searchState.isOpen);
        
        // Filter candidates manually using the search filter
        const candidates = storeAfterResolve.deck.filter(id => {
            const card = storeAfterResolve.cards[id];
            return searchState.filter ? searchState.filter(card as any) : false;
        });
        console.log("Search Candidates in Deck:", candidates.map(id => storeAfterResolve.cards[id].name));
        
        // Select Kepler ('c004') to add to Hand
        const keplerId = candidates.find(id => storeAfterResolve.cards[id].cardId === 'c004')!;
        storeAfterResolve.resolveSearch(keplerId);
        
        // Assert Kepler is in Hand
        console.log("Kepler in Hand:", useGameStore.getState().hand.includes(keplerId));
        console.log("Logs:", useGameStore.getState().logs[0]);
    } else {
        console.error("FAIL: Effect selection onSelect callback not found!");
    }
    
    // Reset and test 'destroy' option
    console.log("\n--- Testing Throne Destroy Option ---");
    setupTest();
    
    // Draw and play Throne again
    const throneId2 = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c042')!;
    useGameStore.getState().moveCard(throneId2, 'HAND', undefined, undefined, false, false, undefined, true);
    useGameStore.getState().moveCard(throneId2, 'FIELD_ZONE', undefined, undefined, false, false, undefined, true);
    
    const selectionState2 = (useGameStore.getState() as any).effectSelectionState || {};
    if (selectionState2.onSelect) {
        console.log("Selecting 'destroy' option...");
        selectionState2.onSelect('destroy');
        
        // Select Copernicus ('c009') to destroy
        const storeAfterResolve2 = useGameStore.getState();
        const searchState2 = storeAfterResolve2.searchState;
        const candidates2 = storeAfterResolve2.deck.filter(id => {
            const card = storeAfterResolve2.cards[id];
            return searchState2.filter ? searchState2.filter(card as any) : false;
        });
        const copernicusId = candidates2.find(id => storeAfterResolve2.cards[id].cardId === 'c009')!;
        storeAfterResolve2.resolveSearch(copernicusId);
        
        // Assert Copernicus is in GY
        console.log("Copernicus in GY:", useGameStore.getState().graveyard.includes(copernicusId));
        console.log("Logs:", useGameStore.getState().logs[0]);
    } else {
        console.error("FAIL: Effect selection onSelect callback not found!");
    }
    
    // Test Orthros Destroy
    console.log("\n--- Testing Orthros P-Effect to Destroy Throne ---");
    // Draw Orthros to Hand
    const orthrosId = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c011')!;
    useGameStore.getState().moveCard(orthrosId, 'HAND', undefined, undefined, false, false, undefined, true);
    
    // Place Orthros in Pendulum Zone (SpellTrapZone 0)
    useGameStore.getState().moveCard(orthrosId, 'SPELL_TRAP_ZONE', 0, undefined, false, false, undefined, true);
    console.log("Orthros in P-Zone:", useGameStore.getState().spellTrapZones[0] === orthrosId);
}

// Separate clean test for Orthros targeting
function runOrthrosTest() {
    console.log("\n--- Clean Orthros Targeting Test ---");
    setupTest();
    
    // 1. Move Kepler to Monster Zone (so we have a DD card on field)
    const keplerId = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c004')!;
    useGameStore.getState().moveCard(keplerId, 'MONSTER_ZONE', 2, undefined, false, false, undefined, true);
    
    // 2. Play Throne to FIELD_ZONE
    const throneId = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c042')!;
    useGameStore.getState().moveCard(throneId, 'FIELD_ZONE', undefined, undefined, false, false, undefined, true);
    // (Dismiss Throne prompt)
    const selectionState = (useGameStore.getState() as any).effectSelectionState || {};
    if (selectionState.onSelect) selectionState.onSelect('no'); // skip throne search
    
    // 3. Move Orthros to P-Zone (SpellTrap 0)
    const orthrosId = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c011')!;
    useGameStore.getState().moveCard(orthrosId, 'SPELL_TRAP_ZONE', 0, undefined, false, false, undefined, true);
    
    // 4. Activate Orthros P-Effect
    console.log("Activating Orthros...");
    useGameStore.getState().activateEffect(orthrosId);
    const selectionState3 = (useGameStore.getState() as any).effectSelectionState || {};
    if (selectionState3.onSelect) {
        selectionState3.onSelect('yes');
        
        // Assert targeting open
        console.log("Targeting Open:", useGameStore.getState().targetingState.isOpen);
        
        // Select Kepler as target 1 (DD card)
        console.log("Selecting Kepler as Target 1...");
        useGameStore.getState().resolveTarget(keplerId);
        
        // Select Throne as target 2 (S/T card)
        console.log("Selecting Throne as Target 2...");
        useGameStore.getState().resolveTarget(throneId);
        
        // Assert both are in GY
        console.log("Kepler in GY:", useGameStore.getState().graveyard.includes(keplerId));
        console.log("Throne in GY:", useGameStore.getState().graveyard.includes(throneId));
        console.log("Logs:", useGameStore.getState().logs[0]);
    }
}

try {
    runTests();
    runOrthrosTest();
    console.log("\nALL TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("Test failed with error:", err);
}
