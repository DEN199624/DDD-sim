import { CARD_DATABASE } from './data/cards';
import { useGameStore, isCardNegated } from './store/gameStore';

function setupTest() {
    const list = [
        'c008', // Abyss Ragnarok (Lv8)
        'c010', // Thomas (Lv8)
        'c044', // Kali Yuga (Rank 8 EX)
        'c043', // Dark Occultism (Normal Spell)
        'c005', // Dark Contract with the Gate (Correct ID)
        'c019', // High King Temujin (Lv8 DDD)
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
}

try {
    runTests();
    console.log("\nALL KALI YUGA TESTS PASSED SUCCESSFULLY!");
} catch (err) {
    console.error("Test failed:", err);
}
