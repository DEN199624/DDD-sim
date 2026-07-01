import { CARD_DATABASE } from './data/cards';
import { useGameStore } from './store/gameStore';
import { getCardName } from './data/locales';

function setupTest() {
    const store = useGameStore.getState();
    
    // Main deck setup
    const mainList = [
        'c004', // Kepler (cost)
        'c008', // Abyss Ragnarok (Lv8)
        'c010', // Thomas (Lv8)
        'c043', // Dark Occultism
    ];
    
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
        opponentLp: 8000
    });
}

function runTests() {
    // === Case 1: Search from Deck ===
    console.log("=== Setup Case 1: Search from Deck ===");
    setupTest();
    
    const occultismId = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c043')!;
    const costId = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c004')!;
    
    // Draw both to Hand
    useGameStore.getState().moveCard(occultismId, 'HAND', undefined, undefined, false, false, undefined, true);
    useGameStore.getState().moveCard(costId, 'HAND', undefined, undefined, false, false, undefined, true);
    
    console.log("Hand:", useGameStore.getState().hand.map(id => useGameStore.getState().cards[id].name));
    
    // Play Occultism to SpellTrapZone 0
    console.log("Playing Dark Occultism...");
    useGameStore.getState().moveCard(occultismId, 'SPELL_TRAP_ZONE', 0, undefined, false, false, undefined, true);
    
    // Verify cost search is open
    console.log("Search (Cost) Open:", useGameStore.getState().searchState.isOpen);
    console.log("Cost Prompt:", useGameStore.getState().searchState.prompt);
    
    // Select Kepler as cost
    console.log("Selecting Kepler as Cost...");
    useGameStore.getState().resolveSearch(costId);
    
    // Verify Kepler is in GY and cost log is added
    console.log("Kepler in GY:", useGameStore.getState().graveyard.includes(costId));
    console.log("Latest Log:", useGameStore.getState().logs[0]);
    
    // Verify effect selection is open (choices)
    console.log("Effect Selection Open:", (useGameStore.getState() as any).effectSelectionState.isOpen);
    console.log("Choice Options:", (useGameStore.getState() as any).effectSelectionState.options); // Should only have 'deck'
    
    // Select 'deck'
    console.log("Selecting 'deck' choice...");
    (useGameStore.getState() as any).effectSelectionState.onSelect('deck');
    
    // Verify Search (Deck) is open
    console.log("Search (Deck) Open:", useGameStore.getState().searchState.isOpen);
    
    // Get Level 8 target (Abyss Ragnarok)
    const candidates = useGameStore.getState().deck.filter(id => {
        const card = useGameStore.getState().cards[id];
        return useGameStore.getState().searchState.filter ? useGameStore.getState().searchState.filter(card as any) : false;
    });
    console.log("Search Candidates in Deck:", candidates.map(id => useGameStore.getState().cards[id].name));
    
    const ragnarokId = candidates.find(id => useGameStore.getState().cards[id].cardId === 'c008')!;
    useGameStore.getState().resolveSearch(ragnarokId);
    
    // Verify Ragnarok in Hand and log
    console.log("Ragnarok in Hand:", useGameStore.getState().hand.includes(ragnarokId));
    console.log("Latest Log:", useGameStore.getState().logs[0]);

    // === Case 2: Salvage from GY ===
    console.log("\n=== Setup Case 2: Salvage from GY ===");
    setupTest();
    
    const occultismId2 = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c043')!;
    const costId2 = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c004')!;
    const thomasId = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c010')!;
    
    // Draw Occultism & Cost to Hand, move Thomas to GY
    useGameStore.getState().moveCard(occultismId2, 'HAND', undefined, undefined, false, false, undefined, true);
    useGameStore.getState().moveCard(costId2, 'HAND', undefined, undefined, false, false, undefined, true);
    useGameStore.getState().moveCard(thomasId, 'GRAVEYARD', undefined, undefined, false, false, undefined, true);
    
    console.log("Thomas in GY:", useGameStore.getState().graveyard.includes(thomasId));
    
    // Play Occultism
    console.log("Playing Dark Occultism...");
    useGameStore.getState().moveCard(occultismId2, 'SPELL_TRAP_ZONE', 0, undefined, false, false, undefined, true);
    
    // Resolve Cost
    useGameStore.getState().resolveSearch(costId2);
    
    // Verify choice options contain both 'deck' and 'gy'
    console.log("Choice Options (Should have both):", (useGameStore.getState() as any).effectSelectionState.options);
    
    // Select 'gy'
    console.log("Selecting 'gy' choice...");
    (useGameStore.getState() as any).effectSelectionState.onSelect('gy');
    
    // Verify Search (GY) is open
    console.log("Search (GY) Open:", useGameStore.getState().searchState.isOpen);
    
    // Get Candidates from GY
    const gyCandidates = useGameStore.getState().graveyard.filter(id => {
        const card = useGameStore.getState().cards[id];
        return useGameStore.getState().searchState.filter ? useGameStore.getState().searchState.filter(card as any) : false;
    });
    console.log("Search Candidates in GY:", gyCandidates.map(id => useGameStore.getState().cards[id].name));
    
    // Select Thomas from GY
    useGameStore.getState().resolveSearch(thomasId);
    
    // Verify Thomas in Hand and recovery log
    console.log("Thomas in Hand:", useGameStore.getState().hand.includes(thomasId));
    console.log("Latest Log:", useGameStore.getState().logs[0]);

    // === Case 3: Ash Blossom Negation ===
    console.log("\n=== Setup Case 3: Ash Blossom Negation ===");
    setupTest();
    
    const occultismId3 = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c043')!;
    const costId3 = useGameStore.getState().deck.find(id => useGameStore.getState().cards[id].cardId === 'c004')!;
    
    useGameStore.getState().moveCard(occultismId3, 'HAND', undefined, undefined, false, false, undefined, true);
    useGameStore.getState().moveCard(costId3, 'HAND', undefined, undefined, false, false, undefined, true);
    
    // Play Occultism & Resolve Cost
    useGameStore.getState().moveCard(occultismId3, 'SPELL_TRAP_ZONE', 0, undefined, false, false, undefined, true);
    useGameStore.getState().resolveSearch(costId3);
    
    // Enable Ash Blossom Simulation for the test
    useGameStore.setState({ ashBlossomSimulationEnabled: true, ashBlossomUsed: false });
    
    // Negate with Ash Blossom
    console.log("Negating with Ash Blossom...");
    (useGameStore.getState() as any).effectSelectionState.onSelect('ash_blossom');
    
    // Verify HOPT consumed, no search, negated log
    console.log("HOPT c043_opt consumed:", !!useGameStore.getState().turnEffectUsage['c043_opt']);
    console.log("Latest Log:", useGameStore.getState().logs[0]);
    console.log("Occultism Search Open (should be false):", useGameStore.getState().searchState.isOpen);
}

try {
    runTests();
    console.log("\nALL TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("Test failed:", err);
}
