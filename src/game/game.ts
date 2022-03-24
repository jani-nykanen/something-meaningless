import { Canvas, ShaderType, TextAlign } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { TransitionEffectType } from "../core/transition.js";
import { State } from "../core/types.js";
import { RGBA } from "../core/vector.js";
import { Menu, MenuButton } from "./menu.js";
import { Stage } from "./stage.js";


const HINTS = [
    "HINT: Use arrow keys to move.",
    "HINT: You can jump over small gaps.",
    "HINT: Press Backspace or Z\nto undo a move.",
    "HINT: You can restart the\nstage by pressing R."
];


export class GameScene implements Scene {


    private stage : Stage;

    private scaleOutFactor : number;
    private fadingOut : boolean;

    private pauseMenu : Menu;


    constructor(param : any, event : CoreEvent) {

        this.stage = new Stage(event, 1);

        this.pauseMenu = new Menu(
        [
            new MenuButton("Resume", event => {

                this.pauseMenu.deactivate();
            }),

            new MenuButton("Restart", event => {

                this.pauseMenu.deactivate();
                this.stage.reset();
            }),

            new MenuButton("Undo", event => {

                this.pauseMenu.deactivate();
                this.stage.undo();
            }),

            new MenuButton("Settings", event => {

                // ...
            }),

            new MenuButton("Main menu", event => {

                // ...
            })
        ]);
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

        if (this.pauseMenu.isActive()) {
            
            this.pauseMenu.update(event);
            return;
        }
        else if (event.input.getAction("start") == State.Pressed) {

            this.pauseMenu.activate(0);
        }


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

        const HINT_OFFSET = [0, 0, -52, -52];

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

        let index = this.stage.getIndex() - 1;
        if (index < HINTS.length) {

            canvas.drawText(canvas.assets.getBitmap("font"), 
                HINTS[index], 16, view.y-64 + HINT_OFFSET[index], 
                -56, -4, TextAlign.Left, 0.40, 0.40);
        }
    }


    private drawPauseMenu(canvas : Canvas) {

        let view = canvas.transform.getViewport();

        canvas.changeShader(ShaderType.NoTexture);
        canvas.setColor(0, 0, 0, 0.67);
        canvas.fillRect(0, 0, view.x, view.y);

        canvas.changeShader(ShaderType.Textured);
        this.pauseMenu.draw(canvas, 0, 0, -56, 72, 0.50, Math.PI*2 / 6, 8.0);
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

        if (this.pauseMenu.isActive()) {

            this.drawPauseMenu(canvas);
        }
    }

    
    public dispose() : any {

        return <any> null;
    }
}
