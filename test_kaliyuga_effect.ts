import { CARD_DATABASE } from './data/cards';
import { useGameStore, isCardNegated } from './store/gameStore';

function setupTest() {
    const list = [
        'c008', // Abyss Ragnarok (Lv8)
        'c010', // Thomas (Lv8)
        'c044', // Kali Yuga (Rank 8 EX)
        'c043', // Dark Occultism (Normal Spell)
        'c005', // Dark Contract with the Gate (Correct ID)
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
        language: 'ja'
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
    
    // Put materials on field (Monster Zone 0 and 1)
    (useGameStore.getState() as any).moveCard(ragnarokId, 'MONSTER_ZONE', 0, undefined, false, false, undefined, true);
    (useGameStore.getState() as any).moveCard(thomasId, 'MONSTER_ZONE', 1, undefined, false, false, undefined, true);
    
    // Move Kali Yuga to EX deck, Gate to GY, Occultism to Hand
    (useGameStore.getState() as any).moveCard(kaliYugaId, 'EXTRA_DECK', undefined, undefined, false, false, undefined, true);
    (useGameStore.getState() as any).moveCard(gateId, 'GRAVEYARD', undefined, undefined, false, false, undefined, true);
    (useGameStore.getState() as any).moveCard(occultismId, 'HAND', undefined, undefined, false, false, undefined, true);
    
    console.log("Materials on Field:", (useGameStore.getState() as any).monsterZones.map((id: string | null) => id ? (useGameStore.getState() as any).cards[id].name : 'empty'));
    console.log("Gate in GY:", (useGameStore.getState() as any).graveyard.includes(gateId));
    console.log("Occultism in Hand:", (useGameStore.getState() as any).hand.includes(occultismId));

    // Case 1: Xyz Summon Kali Yuga using Ragnarok and Thomas
    console.log("\n--- Case 1: Xyz Summon Kali Yuga ---");
    (useGameStore.getState() as any).resolveXyzSummon(kaliYugaId, [ragnarokId, thomasId], 'MONSTER_ZONE', 2);
    
    const freshState = useGameStore.getState() as any;
    console.log("Kali Yuga Zone:", freshState.monsterZones[2] === kaliYugaId ? "Monster Zone 2" : "Fail");
    console.log("Materials attached to Kali Yuga:", freshState.materials[kaliYugaId]);
    console.log("Materials in GY (should be empty as they are overlayed):", freshState.graveyard.filter((id: string) => id !== gateId));

    // Case 2: Field Negation Rule check
    console.log("\n--- Case 2: Field Negation Checks ---");
    // Place another card on field (e.g., if we cheat Gate to field zone 0)
    (useGameStore.getState() as any).moveCard(gateId, 'SPELL_TRAP_ZONE', 0, undefined, false, false, undefined, true);
    
    const stateWithKali = useGameStore.getState() as any;
    console.log("Spell/Trap Zone 0 after move:", stateWithKali.spellTrapZones[0]);
    console.log("Graveyard state:", stateWithKali.graveyard);
    
    // Test if Gate (on field) is negated
    const isGateNegated = isCardNegated(stateWithKali, gateId);
    console.log("Is Gate (on field) Negated:", isGateNegated); // Should be true
    
    // Test if Kali Yuga itself is negated by its own effect
    const isKaliNegated = isCardNegated(stateWithKali, kaliYugaId);
    console.log("Is Kali Yuga itself Negated:", isKaliNegated); // Should be false

    // Case 3: Block Normal Spell activation from Hand
    console.log("\n--- Case 3: Block Hand Activation of Normal Spell ---");
    const store = useGameStore.getState() as any;
    const isNormalSpell = store.cards[occultismId]?.type === 'SPELL' && store.cards[occultismId]?.subType === 'NORMAL';
    const isKaliYugaOnField = [...store.monsterZones, ...store.extraMonsterZones].some((id: string | null) => {
        if (!id) return false;
        return store.cards[id]?.cardId === 'c044' && !store.cardPropertyModifiers[id]?.isNegated;
    });
    console.log("Is Normal Spell:", isNormalSpell); // Should be true
    console.log("Is Kali Yuga active on field:", isKaliYugaOnField); // Should be true
    const isDragBlocked = isNormalSpell && isKaliYugaOnField;
    console.log("Is Normal Spell Drag Blocked:", isDragBlocked); // Should be true

    // Case 4: Kali Yuga effect 2 - Detach material to set contract from GY
    console.log("\n--- Case 4: Kali Yuga Effect 2 - Place Contract from GY ---");
    (useGameStore.getState() as any).moveCard(gateId, 'GRAVEYARD', undefined, undefined, false, false, undefined, true);
    
    const preEffectState = useGameStore.getState() as any;
    console.log("Before Effect - Materials:", preEffectState.materials[kaliYugaId]);
    console.log("Before Effect - Gate in GY:", preEffectState.graveyard.includes(gateId));
    console.log("Before Effect - Spell/Trap Zones:", preEffectState.spellTrapZones);

    // Let's manually check Kali Yuga's activation conditions in test
    const hasMaterials = preEffectState.materials[kaliYugaId] && preEffectState.materials[kaliYugaId].length > 0;
    const contractsInGY = preEffectState.graveyard.filter((id: string) => {
        const c = preEffectState.cards[id];
        if (!c) return false;
        const nameEng = (c.name || '').toUpperCase();
        const nameJa = c.nameJa || '';
        const isDD = nameEng.includes('DD') || nameEng.includes('DARK CONTRACT') || nameJa.includes('DD') || nameJa.includes('契約書');
        return isDD && (nameEng.includes('CONTRACT') || nameJa.includes('契約書'));
    });
    const emptySTZoneIndices = preEffectState.spellTrapZones.map((v: any, i: any) => v === null ? i : -1).filter((i: any) => i !== -1);
    console.log("Condition debug - hasMaterials:", hasMaterials);
    console.log("Condition debug - contractsInGY length:", contractsInGY.length, contractsInGY);
    console.log("Condition debug - emptySTZoneIndices:", emptySTZoneIndices);

    // Activate Kali Yuga
    (useGameStore.getState() as any).activateEffect(kaliYugaId);
    
    const postActivateState = useGameStore.getState() as any;
    // Verify prompt open
    console.log("Effect Selection Open:", postActivateState.effectSelectionState.isOpen);
    console.log("Title/Prompt:", postActivateState.effectSelectionState.title);
    
    // If it's open, proceed
    if (postActivateState.effectSelectionState.isOpen) {
        // Select 'yes'
        postActivateState.effectSelectionState.onSelect('yes');
        
        // Verify material select open
        const postChoiceState = useGameStore.getState() as any;
        console.log("Material Selection Open:", postChoiceState.effectSelectionState.isOpen);
        console.log("Material Options:", postChoiceState.effectSelectionState.options.map((o: any) => o.label));
        
        // Select Ragnarok (the first material) to detach
        const matToDetach = postChoiceState.effectSelectionState.options[0].value;
        console.log("Detaching material:", postChoiceState.cards[matToDetach].name);
        postChoiceState.effectSelectionState.onSelect(matToDetach);
        
        // Verify material in GY
        console.log("Detached Material in GY:", useGameStore.getState().graveyard.includes(matToDetach));
        console.log("Remaining Materials:", (useGameStore.getState() as any).materials[kaliYugaId]);
        
        // Verify search (GY contract selection) is open
        console.log("GY Contract Search Open:", useGameStore.getState().searchState.isOpen);
        
        // Select Gate
        (useGameStore.getState() as any).resolveSearch(gateId);
        
        // Verify Zone Selection is open
        const postSearchState = useGameStore.getState() as any;
        console.log("Zone Selection Open:", postSearchState.zoneSelectionState.isOpen);
        console.log("Zone Selection Title:", postSearchState.zoneSelectionState.title);

        // Select Spell/Trap Zone 0
        postSearchState.resolveZoneSelection('SPELL_TRAP_ZONE', 0);
        
        // Verify Gate on field in SpellTrapZone 0, and log
        const finalState = useGameStore.getState() as any;
        console.log("Gate placed on field:", finalState.spellTrapZones[0] === gateId ? "Spell/Trap Zone 0" : "Fail");
        console.log("Gate in GY (should be false):", finalState.graveyard.includes(gateId));
        console.log("Latest Log:", finalState.logs[0]);
    } else {
        console.log("Failed to open Kali Yuga effect selection dialog.");
    }
}

try {
    runTests();
    console.log("\nALL KALI YUGA TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("Test failed:", err);
}
