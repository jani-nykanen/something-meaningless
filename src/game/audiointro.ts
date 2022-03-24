import { Canvas, ShaderType, TextAlign } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { GameScene } from "./game.js";
import { Menu, MenuButton } from "./menu.js";


const QUESTION =
`Would you like to enable
audio? You can change this
later in the settings.

Press Enter to confirm.`;



export class AudioIntro implements Scene {


    private yesNoMenu : Menu;

    private readonly width : number;


    constructor(param : any, event : CoreEvent) {

        const START_SCENE = GameScene;
        const INITIAL_SAMPLE_VOLUME = 0.40;
        const INITIAL_MUSIC_VOLUME = 0.50;

        this.yesNoMenu = new Menu(
            [
                new MenuButton("Yes",
                    event => {

                        event.audio.toggle(true);
        
                        event.audio.setGlobalMusicVolume(INITIAL_MUSIC_VOLUME);
                        event.audio.setGlobalSampleVolume(INITIAL_SAMPLE_VOLUME);

                        // event.audio.playSample(event.assets.getSample("choose"), 0.60);

                        event.changeScene(START_SCENE);
                    }),

                new MenuButton("No",
                    event => {

                        event.audio.toggle(false);
                        event.changeScene(START_SCENE);
                    })
            ]
        );

        this.yesNoMenu.activate(0);

        this.width = Math.max(...QUESTION.split('\n').map(s => s.length));
    }


    public update(event : CoreEvent) {

        this.yesNoMenu.update(event);
    }


    public redraw(canvas : Canvas) {

        const XOFF = -56;
        const YOFF = 2;
        const TEXT_SCALE = 0.50;

        const Y_POS = 128;

        canvas.transform
            .loadIdentity()
            .setView(canvas.width, canvas.height)
            .use();

        canvas.clear(0.0, 0.33, 0.67);

        canvas.changeShader(ShaderType.Textured);
        canvas.setColor();

        canvas.drawText(canvas.assets.getBitmap("font"), 
            QUESTION, 
            canvas.width/2 - this.width*(128 + XOFF) * TEXT_SCALE / 2, Y_POS, 
            XOFF, YOFF, TextAlign.Left, TEXT_SCALE, TEXT_SCALE);

        this.yesNoMenu.draw(canvas, 0, 224, -56, 80, TEXT_SCALE, Math.PI*2/4, 12.0);
    }


    public dispose = () : any => <any>0;

}
