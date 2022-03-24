
import { Core } from "./core/core.js";
import { AudioIntro } from "./game/audiointro.js";


const INITIAL_SAMPLE_VOLUME = 0.50;
const INITIAL_MUSIC_VOLUME = 0.80;


window.onload = () => (new Core())
    .run(AudioIntro, "assets/index.json",
    event => {

        event.input
            .addAction("select", "Space", null, 0)
            .addAction("start", "Enter", null, 9, 7)
            .addAction("undo", "Backspace", "KeyZ", 1)
            .addAction("restart", "KeyR", null, 3);
    },
    event => {

        event.audio.setGlobalMusicVolume(INITIAL_MUSIC_VOLUME);
        event.audio.setGlobalSampleVolume(INITIAL_SAMPLE_VOLUME);
    });
