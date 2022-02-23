
import { Core } from "./core/core.js";
import { GameScene } from "./game/game.js";


window.onload = () => (new Core())
    .run(GameScene, "assets/index.json",
    event => {

        event.input
            .addAction("select", "Space", null, 0)
            .addAction("start", "Enter", null, 9, 7)
            .addAction("undo", "Backspace", "KeyZ", 1)
            .addAction("restart", "KeyR", null, 3);
    },
    event => {

        // ...
    });