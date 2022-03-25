import { Canvas, ShaderType, TextAlign } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { GameScene } from "./game.js";
import { Menu, MenuButton } from "./menu.js";
import { TitleScreen } from "./titlescreen.js";


const QUESTION =
`Would you like to enable
audio? You can change this
later in the settings.

Press Enter to confirm.`;



export class AudioIntro implements Scene {


    private yesNoMenu : Menu;

    private readonly width : number;


    constructor(param : any, event : CoreEvent) {

        const START_SCENE = TitleScreen;

        this.yesNoMenu = new Menu(
            [
                new MenuButton("Yes",
                    event => {

                        event.audio.toggle(true);
                        event.audio.playSample(event.assets.getSample("choose"), 0.60);
                        
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
        const TEXT_SCALE = 0.60;

        const Y_POS = 128;

        canvas.transform
            .loadIdentity()
            .fitGivenDimension(1080.0, canvas.width/canvas.height)
            .use();

        let view = canvas.transform.getViewport();

        canvas.clear(0.33, 0.67, 1.0);

        canvas.changeShader(ShaderType.Textured);
        canvas.setColor();

        canvas.drawTextWithShadow(canvas.assets.getBitmap("font"), 
            QUESTION, 
            view.x/2 - this.width*(128 + XOFF) * TEXT_SCALE / 2, Y_POS, 
            XOFF, YOFF, TextAlign.Left, TEXT_SCALE, TEXT_SCALE, 4, 4, 0.20);

        this.yesNoMenu.draw(canvas, 0, 224, -56, 96, TEXT_SCALE, Math.PI*2/4, 12.0);
    }


    public dispose = () : any => <any>0;

}
