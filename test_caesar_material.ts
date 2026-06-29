import { useGameStore } from './store/gameStore.js';
import { CARD_DATABASE } from './data/cards.js';

async function runTest() {
    console.log("Initializing Game for Caesar material GY trigger Test...");
    // テル(c021)、シーザー(c022)、素材用カード(c004)
    const deckList = ['c021', 'c022', 'c004', 'c004', 'c004'];

    const store = useGameStore.getState();
    store.initializeGame(CARD_DATABASE, deckList);

    const cards = Object.values(useGameStore.getState().cards);
    const tell = cards.find(c => c.cardId === 'c021')?.id;
    const caesar = cards.find(c => c.cardId === 'c022')?.id;

    if (!tell || !caesar) {
        console.error("Failed to find Tell or Caesar");
        return;
    }

    console.log(`Tell ID: ${tell}`);
    console.log(`Caesar ID: ${caesar}`);

    console.log("Setting up Tell 1...");
    useGameStore.getState().moveCard(tell, 'MONSTER_ZONE', 0);
    
    // シーザーをテルの素材に入れる
    useGameStore.setState(state => ({
        materials: {
            ...state.materials,
            [tell]: [caesar]
        }
    }));
    useGameStore.setState({ isTellBuffActive: true, ftkModeActive: true, opponentLp: 8000 });

    // モック：どのような選択肢が表示されたかログをとる
    let triggeredCaesarEffect = false;
    useGameStore.setState({
        startEffectSelection: (prompt, options, onSelect) => {
            console.log(`[UI Selection] Prompt: "${prompt}"`);
            if (prompt.includes("怒涛王シーザー") || prompt.includes("Caesar") || prompt.includes("契約書")) {
                triggeredCaesarEffect = true;
                console.log("-> TRIGGERED Caesar GY Effect (ERROR!)");
            }
            if (options.length === 2 && options[0].value === 'yes') {
                onSelect('yes');
            } else {
                onSelect(options[0].value);
            }
        }
    });

    console.log("Activating Tell effect (should detach Caesar)...");
    useGameStore.getState().activateEffect(tell);

    console.log(`Opponent LP: ${useGameStore.getState().opponentLp}`);
    console.log(`Triggered Caesar Effect? : ${triggeredCaesarEffect}`);

    if (triggeredCaesarEffect) {
        console.error("FAIL: Caesar effect was triggered from materials!");
    } else {
        console.log("SUCCESS: Caesar effect was NOT triggered from materials.");
    }
}

runTest().catch(console.error);
