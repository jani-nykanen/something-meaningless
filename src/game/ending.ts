import { Canvas, ShaderType, TextAlign } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { TransitionEffectType } from "../core/transition.js";
import { RGBA } from "../core/vector.js";
import { Menu, MenuButton } from "./menu.js";
import { TitleScreen } from "./titlescreen.js";


const PHASE_TIME = 60;


export class Ending implements Scene {


    private timer : number;
    private phase : number;


    constructor(param : any, event : CoreEvent) {

        this.timer = 0;
        this.phase = 0;

        event.transition.activate(false, TransitionEffectType.Fade,
            1.0/60.0, null, new RGBA(0.33, 0.67, 1.0));
    }


    public update(event : CoreEvent) {

        if (event.transition.isActive())
            return;

        if (this.phase == 0) {

            if ((this.timer += event.step) >= PHASE_TIME) {

                ++ this.phase;
                this.timer = 0;
            }
        }
        else {

            if (event.input.anyPressed()) {

                event.audio.playSample(event.assets.getSample("select"), 0.50);

                event.transition.activate(true, TransitionEffectType.Fade,
                    1.0/60.0, event => {

                        event.changeScene(TitleScreen);
                    }, new RGBA(0.33, 0.67, 1.0));
            }
        }
    }


    public redraw(canvas : Canvas) {

        canvas.transform
            .loadIdentity()
            .fitGivenDimension(1080.0, canvas.width/canvas.height)
            .use();
        let view = canvas.transform.getViewport();

        canvas.clear(0.33, 0.67, 1.0);

        canvas.changeShader(ShaderType.Textured);
        canvas.setColor();

        let font = canvas.assets.getBitmap("font");
        canvas.drawText(font, "THE END", view.x/2, view.y/2 - 96, -60, 0, TextAlign.Center);
        
        let alpha = this.phase == 1 ? 1.0 : this.timer / PHASE_TIME;
        canvas.setColor(1, 1, 1, alpha);

        canvas.drawText(font, "Thank you for playing!", 
            view.x/2, view.y/2 + 16, -60, 0, TextAlign.Center, 0.50, 0.50);

        canvas.setColor();
    }


    public dispose = () : any => <any>0;

}
