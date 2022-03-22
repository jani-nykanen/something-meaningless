import { Canvas, ShaderType, TextAlign } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { TransitionEffectType } from "../core/transition.js";
import { State } from "../core/types.js";
import { RGBA } from "../core/vector.js";
import { Stage } from "./stage.js";



export class GameScene implements Scene {


    private stage : Stage;

    private scaleOutFactor : number;
    private fadingOut : boolean;


    constructor(param : any, event : CoreEvent) {

        this.stage = new Stage(event, 1);
    }


    public update(event: CoreEvent) : void {

        if (event.transition.isActive()) {

            this.scaleOutFactor = event.transition.getTime();
            this.fadingOut = event.transition.isFadingOut();

            if (this.fadingOut) {

                this.scaleOutFactor = 1.0 - this.scaleOutFactor;
            }

            this.stage.update(event, false);
            return;
        }
        this.scaleOutFactor = 0.0;

        this.stage.update(event);

        if (event.input.getAction("undo") == State.Pressed) {

            this.stage.undo();
        }

        if (event.input.getAction("restart") == State.Pressed) {

            this.stage.reset();
        }

        if (this.stage.isCleared()) {

            this.stage.stopPlayerAnimation();
            event.transition.activate(true, TransitionEffectType.Fade,
                1.0/20.0,
                event => {

                    this.stage.nextStage(event);

                }, new RGBA(0.33, 0.67, 1.0));
        }
    }


    private drawHUD(canvas : Canvas) {

        canvas.changeShader(ShaderType.Textured);

        canvas.transform
            .loadIdentity()
            .fitGivenDimension(1080.0, canvas.width/canvas.height)
            .use();
        
        let str = "STAGE " + String(this.stage.getIndex());
        let view = canvas.transform.getViewport();

        canvas.setColor();
        canvas.drawText(canvas.assets.getBitmap("font"), 
            str, view.x/2, 16, -56, 0, TextAlign.Center, 0.67, 0.67);
    }


    public redraw(canvas: Canvas) : void {

        const SCALE_OUT = 0.33;
        const TRANSLATION = 0.25;

        let scaleOut = 1.0 + this.scaleOutFactor * SCALE_OUT;

        let yoff = TRANSLATION * Math.pow(this.scaleOutFactor, 2);
        if (!this.fadingOut) {

            yoff *= -1;
        }

        canvas.changeShader(ShaderType.NoTexture);
        canvas.resetVertexAndFragmentTransforms();
        canvas.setColor();

        canvas.transform
            .loadIdentity()
            .use();
        canvas.clear(0.33, 0.67, 1.0);

        this.stage.draw(canvas, scaleOut, yoff);

        this.drawHUD(canvas);
    }

    
    public dispose() : any {

        return <any> null;
    }
}
