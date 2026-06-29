import { useGameStore } from './store/gameStore.js';
import { CARD_DATABASE } from './data/cards.js';

async function runTest() {
    console.log("Initializing Game for Tell (c021) Test...");
    const deckList = ['c021', 'c021', 'c004', 'c004', 'c004', 'c004'];

    const store = useGameStore.getState();
    store.initializeGame(CARD_DATABASE, deckList);

    const cards = Object.values(useGameStore.getState().cards);
    const tellInstances = cards.filter(c => c.cardId === 'c021');
    if (tellInstances.length < 2) {
        console.error("Failed to find 2 Tell instances");
        return;
    }
    const tell1 = tellInstances[0].id;
    const tell2 = tellInstances[1].id;
    const matCard = cards.find(c => c.cardId === 'c004')?.id;

    if (!tell1 || !tell2 || !matCard) {
        console.error("Failed to setup IDs");
        return;
    }

    console.log(`Tell 1 ID: ${tell1}`);
    console.log(`Tell 2 ID: ${tell2}`);
    console.log(`Material Card ID: ${matCard}`);

    console.log("Setting up Tell 1...");
    useGameStore.getState().moveCard(tell1, 'MONSTER_ZONE', 0);
    useGameStore.setState(state => ({
        materials: {
            ...state.materials,
            [tell1]: [matCard]
        }
    }));
    useGameStore.setState({ isTellBuffActive: true, ftkModeActive: true, opponentLp: 8000 });

    console.log(`Initial Opponent LP: ${useGameStore.getState().opponentLp}`);

    useGameStore.setState({
        startEffectSelection: (prompt, options, onSelect) => {
            if (options.length === 2 && options[0].value === 'yes') {
                console.log(`[UI Choice] Resolving prompt: "${prompt}" -> yes`);
                onSelect('yes');
            } else {
                console.log(`[UI Choice] Resolving prompt: "${prompt}" -> ${options[0].value}`);
                onSelect(options[0].value);
            }
        }
    });

    // 1回目の発動
    console.log("Activating Tell 1 effect (1st time)...");
    useGameStore.getState().activateEffect(tell1);

    console.log(`Opponent LP after 1st activation: ${useGameStore.getState().opponentLp}`);
    console.log(`Tell 1 materials:`, useGameStore.getState().materials[tell1]);
    console.log(`turnEffectUsage for c021_detach_${tell1}:`, useGameStore.getState().turnEffectUsage[`c021_detach_${tell1}`]);

    // 素材を再度補充して、2回目の発動を試みる（発動制限のため発動しないかエラーになるはず）
    useGameStore.setState(state => ({
        materials: {
            ...state.materials,
            [tell1]: [matCard]
        }
    }));
    console.log("Activating Tell 1 effect (2nd time)...");
    useGameStore.getState().activateEffect(tell1);
    console.log(`Opponent LP after 2nd activation: ${useGameStore.getState().opponentLp} (Should be unchanged, i.e. 7000)`);

    console.log("Setting up Tell 2...");
    useGameStore.getState().moveCard(tell2, 'MONSTER_ZONE', 1);
    useGameStore.setState(state => ({
        materials: {
            ...state.materials,
            [tell2]: [matCard]
        }
    }));

    // 2体目の効果は発動できるはず
    console.log("Activating Tell 2 effect...");
    useGameStore.getState().activateEffect(tell2);
    console.log(`Opponent LP after Tell 2 activation: ${useGameStore.getState().opponentLp} (Should be 6000)`);

    // Tell 1 を場から離す（EXデッキに移動する）
    console.log("Moving Tell 1 to Extra Deck...");
    useGameStore.getState().moveCard(tell1, 'EXTRA_DECK');

    console.log(`turnEffectUsage for c021_detach_${tell1} (Should be deleted):`, useGameStore.getState().turnEffectUsage[`c021_detach_${tell1}`]);

    // Tell 1 を再度召喚して素材を入れる
    console.log("Re-summoning Tell 1 and setting materials...");
    useGameStore.getState().moveCard(tell1, 'MONSTER_ZONE', 0);
    useGameStore.setState(state => ({
        materials: {
            ...state.materials,
            [tell1]: [matCard]
        }
    }));

    // 再召喚されたので発動できるはず
    console.log("Activating Tell 1 effect after re-summoning...");
    useGameStore.getState().activateEffect(tell1);
    console.log(`Opponent LP after re-summoned Tell 1 activation: ${useGameStore.getState().opponentLp} (Should be 5000)`);
}

runTest().catch(console.error);
