import { Canvas, ShaderType, TextAlign } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { TransitionEffectType } from "../core/transition.js";
import { RGBA } from "../core/vector.js";
import { TitleScreen } from "./titlescreen.js";


const WAIT_TIME = 60;
const BACKGROUND_COLOR = new RGBA(0.33, 0.67, 1.0);


export class Intro implements Scene {


    private timer : number;
    private phase : number;


    constructor(param : any, event : CoreEvent) {

        this.timer = 0;
        this.phase = 0;

        event.transition.activate(false, TransitionEffectType.Fade,
            1.0/30.0, null, BACKGROUND_COLOR);
    }


    public update(event : CoreEvent) {

        if (event.transition.isActive())
            return;

  
        if ((this.timer += event.step) >= WAIT_TIME ||
            event.input.anyPressed()) {

            event.transition.activate(true, TransitionEffectType.Fade, 1.0/30.0,
            event => {

                if (this.phase == 1) {

                    event.changeScene(TitleScreen);
                    return;
                }

                 ++ this.phase;
                this.timer = 0;

            }, BACKGROUND_COLOR);
        }
    }


    public redraw(canvas : Canvas) {

        canvas.changeShader(ShaderType.Textured);

        canvas.transform
            .loadIdentity()
            .fitGivenDimension(1080.0, canvas.width/canvas.height)
            .use();
        let view = canvas.transform.getViewport();

        canvas.clear(0.33, 0.67, 1.0);
        canvas.setColor();

        let bmp = canvas.assets.getBitmap("intro");

        canvas.drawBitmapRegion(bmp, 0, this.phase*128, 512, 128,
            view.x/2 - bmp.width/2, view.y/2 - bmp.height/4);
    }


    public dispose = () : any => <any>0;

}
