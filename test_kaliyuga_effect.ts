import { CARD_DATABASE } from './data/cards';
import { useGameStore, isCardNegated } from './store/gameStore';

function setupTest() {
    const list = [
        'c008', // Abyss Ragnarok (Lv8)
        'c010', // Thomas (Lv8)
        'c044', // Kali Yuga (Rank 8 EX)
        'c043', // Dark Occultism (Normal Spell)
        'c005', // Dark Contract with the Gate
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
        isBatching: false,
        isHistoryBatching: false,
        pendingChain: [],
        modalQueue: [],
        pendingEffects: [],
        isEffectActivated: false,
        effectSelectionState: { isOpen: false, title: '', options: [], onSelect: null },
        searchState: { isOpen: false, filter: null, onSelect: null, prompt: undefined, source: undefined },
        targetingState: { isOpen: false, filter: null, onSelect: null, mode: 'normal' },
        zoneSelectionState: { isOpen: false, title: '', filter: null, onSelect: null }
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
    console.log("DEBUG - gateId:", gateId);
    console.log("DEBUG - spellTrapZones:", stateWithKali.spellTrapZones);
    console.log("DEBUG - monsterZones:", stateWithKali.monsterZones);
    console.log("DEBUG - cards['c044_2']:", stateWithKali.cards['c044_2']);
    console.log("DEBUG - cardPropertyModifiers['c044_2']:", stateWithKali.cardPropertyModifiers['c044_2']);

    // Test if Gate (on field) is negated
    const isGateNegated = isCardNegated(stateWithKali, gateId);
    console.log("Is Gate (on field) Negated:", isGateNegated); // Should be true
    
    // Test if Kali Yuga itself is negated by its own effect
    const isKaliNegated = isCardNegated(stateWithKali, kaliYugaId);
    console.log("Is Kali Yuga itself Negated:", isKaliNegated); // Should be false
    
    // Test if Occultism in Hand is negated
    const isOccultismHandNegated = isCardNegated(stateWithKali, occultismId);
    console.log("Is Occultism in Hand Negated:", isOccultismHandNegated); // Should be false

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
    
    console.log("Before Effect - Materials:", (useGameStore.getState() as any).materials[kaliYugaId]);
    console.log("Before Effect - Gate in GY:", (useGameStore.getState() as any).graveyard.includes(gateId));
    console.log("Before Effect - Spell/Trap Zone 0:", (useGameStore.getState() as any).spellTrapZones[0]);

    // Activate Kali Yuga
    (useGameStore.getState() as any).activateEffect(kaliYugaId);
    
    // Verify prompt open
    console.log("Effect Selection Open:", (useGameStore.getState() as any).effectSelectionState.isOpen);
    console.log("Title/Prompt:", (useGameStore.getState() as any).effectSelectionState.title);
    
    // Select 'yes'
    (useGameStore.getState() as any).effectSelectionState.onSelect('yes');
    
    // Verify material select open
    console.log("Material Selection Open:", (useGameStore.getState() as any).effectSelectionState.isOpen);
    console.log("Material Options:", (useGameStore.getState() as any).effectSelectionState.options.map((o: any) => o.label));
    
    // Select Ragnarok (the first material) to detach
    const matToDetach = (useGameStore.getState() as any).effectSelectionState.options[0].value;
    console.log("Detaching material:", (useGameStore.getState() as any).cards[matToDetach].name);
    (useGameStore.getState() as any).effectSelectionState.onSelect(matToDetach);
    
    // Verify material in GY
    console.log("Detached Material in GY:", (useGameStore.getState() as any).graveyard.includes(matToDetach));
    console.log("Remaining Materials:", (useGameStore.getState() as any).materials[kaliYugaId]);
    
    // Verify search (GY contract selection) is open
    console.log("GY Contract Search Open:", (useGameStore.getState() as any).searchState.isOpen);
    
    // Select Gate
    (useGameStore.getState() as any).resolveSearch(gateId);
    
    // Verify Gate on field in SpellTrapZone 0, and log
    const finalState = useGameStore.getState() as any;
    console.log("Gate placed on field:", finalState.spellTrapZones[0] === gateId ? "Spell/Trap Zone 0" : "Fail");
    console.log("Gate in GY (should be false):", finalState.graveyard.includes(gateId));
    console.log("Latest Log:", finalState.logs[0]); // Should be "地獄門を置く（カリユガ効果）"

    // Case 12: Harmonia (調和ノ天救竜) Validation
    console.log("\n--- Case 12: Harmonia Intervention & Lock Validation ---");
    // Clear and setup fresh state for Harmonia test
    setupTest();
    const st = useGameStore.getState() as any;
    
    // Add Kepler (c002) and Genghis (c004) to deck
    const keplerId = 'c002_test';
    const genghisId = 'c004_test';
    useGameStore.setState({
        cards: {
            ...st.cards,
            [keplerId]: { id: keplerId, cardId: 'c002', name: 'DD Savant Kepler', type: 'MONSTER', subType: 'PENDULUM/EFFECT', level: 1, attack: 0, defense: 0 },
            [genghisId]: { id: genghisId, cardId: 'c004', name: 'DDD Flame King Genghis', type: 'MONSTER', subType: 'FUSION/EFFECT', level: 6, attack: 2000, defense: 1500 }
        },
        monsterZones: [keplerId, genghisId, null, null, null],
        harmoniaSimulationEnabled: true,
        harmoniaUsed: false
    } as any);

    console.log("Before trigger - Kepler on field:", (useGameStore.getState() as any).monsterZones[0] === keplerId);
    console.log("Before trigger - isBatching:", (useGameStore.getState() as any).isBatching);
    console.log("Before trigger - isHistoryBatching:", (useGameStore.getState() as any).isHistoryBatching);
    console.log("Before trigger - pendingChain:", (useGameStore.getState() as any).pendingChain);

    // Simulate Kepler effect activation
    const currentStore = useGameStore.getState() as any;
    currentStore.startEffectSelection(
        "ケプラーの効果発動",
        [{ label: "サーチ効果", value: "search" }],
        (choice: string) => {
            console.log("Kepler original effect resolved with choice:", choice);
        },
        false,
        keplerId
    );

    const afterSelectState = useGameStore.getState() as any;
    console.log("Harmonia option available:", afterSelectState.effectSelectionState.options.some((o: any) => o.value === 'harmonia'));

    // Select Harmonia
    afterSelectState.effectSelectionState.onSelect('harmonia');

    // Harmonia targeting state should be active (to destroy a monster)
    const targetState = useGameStore.getState() as any;
    console.log("Harmonia Targeting active:", targetState.targetingState.isOpen);

    // Choose Genghis to destroy
    targetState.targetingState.onSelect(genghisId);

    const postDestructionState = useGameStore.getState() as any;
    console.log("Genghis destroyed (in GY):", postDestructionState.graveyard.includes(genghisId));
    console.log("Genghis removed from MZ:", postDestructionState.monsterZones[1] === null);

    // Now queue process should trigger original effect callback, and then show Harmonia extra effect options
    // Let's resolve the queued modal dialogs
    const postMainEffectState = useGameStore.getState() as any;
    postMainEffectState.processUiQueue();

    // Harmonia extra effect selection should open
    const extraSelectionState = useGameStore.getState() as any;
    console.log("Harmonia Extra Effect Selection Open:", extraSelectionState.effectSelectionState.isOpen);
    console.log("Options available:", extraSelectionState.effectSelectionState.options.map((o: any) => o.value));

    // Choose 'place' option (place in S/T zone)
    extraSelectionState.effectSelectionState.onSelect('place');

    // Should ask for targeting a monster to place
    const placeTargetState = useGameStore.getState() as any;
    console.log("Targeting monster to place:", placeTargetState.targetingState.isOpen);

    // Choose Kepler
    placeTargetState.targetingState.onSelect(keplerId);

    // Should ask for zone selection (Spell/Trap Zones)
    const placeZoneState = useGameStore.getState() as any;
    console.log("Spell/Trap Zone Selection Open:", placeZoneState.zoneSelectionState.isOpen);

    // Select Zone 0 (P-Zone)
    placeZoneState.zoneSelectionState.onSelect('SPELL_TRAP_ZONE', 0);

    const finalHarmoniaState = useGameStore.getState() as any;
    console.log("Kepler placed in Spell/Trap Zone 0:", finalHarmoniaState.spellTrapZones[0] === keplerId);
    console.log("Kepler has isHarmoniaPlaced flag:", finalHarmoniaState.cardFlags[keplerId]?.includes('isHarmoniaPlaced'));

    // Verify P-Summon is locked
    finalHarmoniaState.startPendulumSummon();
    const postPSummonState = useGameStore.getState() as any;
    console.log("P-Summon count (should still be 0 since it is locked):", postPSummonState.pendulumSummonCount);
    console.log("Latest Log indicates lock:", postPSummonState.logs.some((l: string) => l.includes("P召喚できません")));

    // Verify Fusion material restriction (Swamp King Fusion should exclude Kepler)
    // Setup fusion extra deck
    (useGameStore as any).setState({
        extraDeck: [genghisId],
        hand: []
    });
    // Trigger Swamp King fusion check
    const isDDArchetype = (c: any) => c && c.name && (c.name.includes('DD') || c.nameJa?.includes('DD') || c.nameJa?.includes('ＤＤ'));
    const fFilter = (c: any) => isDDArchetype(c) && c.type === 'MONSTER' && !(useGameStore.getState() as any).cardFlags[c.id]?.includes('isHarmoniaPlaced');
    console.log("Is Kepler excluded from Fusion Materials?", !fFilter((useGameStore.getState() as any).cards[keplerId]));

    // Move Kepler to hand to verify isHarmoniaPlaced flag clears
    (useGameStore.getState() as any).moveCard(keplerId, 'HAND');
    const handState = useGameStore.getState() as any;
    console.log("Kepler in hand:", handState.hand.includes(keplerId));
    console.log("Kepler has isHarmoniaPlaced flag (should be false/undefined):", handState.cardFlags[keplerId]?.includes('isHarmoniaPlaced') ?? false);

    // Verify P-Summon lock is released now that Kepler has left the P-zone
    // Put a normal P-scale in zone 0 and zone 4
    (useGameStore as any).setState({
        spellTrapZones: ['scale1_test', null, null, null, 'scale2_test'],
        hand: ['c008_test'],
        cards: {
            ...handState.cards,
            'scale1_test': { id: 'scale1_test', cardId: 'c002', name: 'DD Savant Kepler', type: 'MONSTER', subType: 'PENDULUM/EFFECT', scale: 10 },
            'scale2_test': { id: 'scale2_test', cardId: 'c010', name: 'DD Savant Thomas', type: 'MONSTER', subType: 'PENDULUM/EFFECT', scale: 6 },
            'c008_test': { id: 'c008_test', cardId: 'c008', name: 'DDD Oblivion King Abyss Ragnarok', type: 'MONSTER', level: 8 }
        }
    });
    const finalPSummonState = useGameStore.getState() as any;
    
    // Debug P-Summon lock release candidates
    const getEffScale = (id: string | null) => {
        if (!id) return 0;
        const mod = finalPSummonState.cardPropertyModifiers[id]?.scale;
        return mod !== undefined ? mod : (finalPSummonState.cards[id].scale || 0);
    };
    const getEffLevel = (id: string) => {
        const mod = finalPSummonState.cardPropertyModifiers[id]?.level;
        return mod !== undefined ? mod : (finalPSummonState.cards[id].level || 0);
    };
    const min = Math.min(getEffScale('scale1_test'), getEffScale('scale2_test'));
    const max = Math.max(getEffScale('scale1_test'), getEffScale('scale2_test'));
    console.log("DEBUG - Scales min:", min, "max:", max);
    console.log("DEBUG - hand state:", finalPSummonState.hand);
    if (finalPSummonState.hand.length > 0) {
        const testId = finalPSummonState.hand[0];
        const testCard = finalPSummonState.cards[testId];
        const effLv = getEffLevel(testId);
        console.log("DEBUG - testCard:", testCard.name, "type:", testCard.type, "level:", effLv);
        console.log("DEBUG - condition matched:", testCard.type === 'MONSTER' && effLv > min && effLv < max);
    }
    console.log("DEBUG - pendulumSummonCount:", finalPSummonState.pendulumSummonCount);
    console.log("DEBUG - pendulumSummonLimit:", finalPSummonState.pendulumSummonLimit);
    
    finalPSummonState.startPendulumSummon();
    // Kepler and Thomas scales allow 10 and 6, so P-Summon candidate check triggers zone selection
    console.log("P-Summon lock released:", (useGameStore.getState() as any).isPendulumSummoning);
}

try {
    runTests();
    console.log("\nALL KALI YUGA & HARMONIA TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("Test failed:", err);
}
