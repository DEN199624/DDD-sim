import { useGameStore } from './store/gameStore.js';
import { CARD_DATABASE } from './data/cards.js';

async function runTest() {
    console.log("Initializing Game for Machinex (c030) Caesar (c022) Test...");
    const deckList = ['c030', 'c022', 'c004', 'c004'];

    const store = useGameStore.getState();
    store.initializeGame(CARD_DATABASE, deckList);

    const cards = Object.values(useGameStore.getState().cards);
    const machinex = cards.find(c => c.cardId === 'c030')?.id;
    const caesar = cards.find(c => c.cardId === 'c022')?.id;

    if (!machinex || !caesar) {
        console.error("Failed to find Machinex or Caesar");
        return;
    }

    console.log(`Machinex ID: ${machinex}`);
    console.log(`Caesar ID: ${caesar}`);

    console.log("Setting up Machinex on field...");
    useGameStore.getState().moveCard(machinex, 'MONSTER_ZONE', 0);
    
    // シーザーをデスマキナの素材に入れる
    useGameStore.setState(state => ({
        materials: {
            ...state.materials,
            [machinex]: [caesar]
        }
    }));
    useGameStore.setState({ ftkModeActive: true, opponentLp: 8000 });

    // モック：どのような選択肢が表示されたかログをとる
    let triggeredCaesarEffect = false;
    useGameStore.setState({
        startEffectSelection: (prompt, options, onSelect) => {
            console.log(`[UI Selection] Prompt: "${prompt}"`);
            if (prompt.includes("怒涛王シーザー") || prompt.includes("Caesar") || prompt.includes("契約書")) {
                triggeredCaesarEffect = true;
                console.log("-> TRIGGERED Caesar GY Effect (ERROR!)");
            }
            if (prompt.includes("Pゾーンに置きますか") || prompt.includes("place in P-Zone")) {
                console.log("-> Choosing 'no' for Machinex P-Zone placement");
                onSelect('no');
                return;
            }
            if (options.length === 2 && options[0].value === 'yes') {
                onSelect('yes');
            } else {
                onSelect(options[0].value);
            }
        }
    });

    console.log("Moving Machinex to MATERIAL (Leaves field)...");
    useGameStore.getState().moveCard(machinex, 'MATERIAL');

    const finalState = useGameStore.getState();
    console.log("--- State After Move ---");
    console.log("Graveyard:", finalState.graveyard);
    console.log("Materials Map:", finalState.materials);
    console.log("Trigger Candidates:", finalState.triggerCandidates);
    console.log("Card Flags for Caesar:", finalState.cardFlags[caesar]);
    console.log("------------------------");

    const hasCaesarInTriggers = finalState.triggerCandidates.includes(caesar);
    console.log(`Is Caesar in Trigger Candidates? : ${hasCaesarInTriggers}`);
    console.log(`Triggered Caesar Effect directly? : ${triggeredCaesarEffect}`);

    console.log("Simulating manual trigger of Caesar in GY...");
    let manuallyTriggered = false;
    
    // Get the actual EFFECT_LOGIC mapping from gameStore.ts
    // We import gameStore where EFFECT_LOGIC is defined
    const gameStoreModule = await import('./store/gameStore.js');
    const effectLogic = (gameStoreModule as any).EFFECT_LOGIC;

    if (effectLogic && effectLogic['c022']) {
        useGameStore.setState({
            startEffectSelection: (prompt, options, onSelect) => {
                console.log(`[UI Selection] Prompt: "${prompt}"`);
                if (prompt.includes("怒涛王") || prompt.includes("Caesar") || prompt.includes("契約書")) {
                    manuallyTriggered = true;
                    console.log("-> TRIGGERED Caesar GY Effect via manual trigger!");
                }
            }
        });
        effectLogic['c022'](useGameStore.getState(), caesar, 'GRAVEYARD');
    } else {
        console.error("EFFECT_LOGIC or c022 handler not found in gameStore module!");
    }

    console.log(`Manually Triggered Caesar Effect? : ${manuallyTriggered}`);

    if (triggeredCaesarEffect || hasCaesarInTriggers || manuallyTriggered) {
        console.error("FAIL: Caesar effect was triggered, added to triggerCandidates, or manually triggered!");
    } else {
        console.log("SUCCESS: Caesar effect was fully blocked and guarded from trigger.");
    }
}

runTest().catch(console.error);
