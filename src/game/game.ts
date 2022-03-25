import { Canvas, ShaderType, TextAlign } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { TransitionEffectType } from "../core/transition.js";
import { State } from "../core/types.js";
import { RGBA } from "../core/vector.js";
import { Ending } from "./ending.js";
import { Menu, MenuButton } from "./menu.js";
import { Stage } from "./stage.js";
import { TitleScreen } from "./titlescreen.js";


// TODO: Put this elsewhere
export const THEME_VOLUME = 1.0;

const BACKGROUND_COLOR = new RGBA(0.33, 0.67, 1.0);


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
                this.resumeMusic(event);
            }),

            new MenuButton("Restart", event => {

                this.pauseMenu.deactivate();
                this.stage.reset();
                this.resumeMusic(event);
            }),

            new MenuButton("Undo", event => {

                this.pauseMenu.deactivate();
                this.stage.undo();
                this.resumeMusic(event);
            }),

            new MenuButton(event.audio.getAudioStateString(), event => {

                event.audio.toggle(!event.audio.isEnabled());
                this.pauseMenu.changeButtonText(3, event.audio.getAudioStateString());
            }),

            new MenuButton("Main menu", event => {

                event.transition.activate(true, TransitionEffectType.Fade,
                    1.0/30.0, event => {

                        event.changeScene(TitleScreen);

                    }, BACKGROUND_COLOR);
            })
        ]);
    }


    private resumeMusic(event : CoreEvent) {

        if (!event.audio.resumeMusic()) {

            event.audio.fadeInMusic(event.assets.getSample("theme"), THEME_VOLUME, 1000.0);
        }
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
            event.audio.pauseMusic();

            event.audio.playSample(event.assets.getSample("pause"), 0.70);   
        }

        this.stage.update(event);
        if (this.stage.isPlayerDead()) {

            event.audio.stopMusic();
            event.transition.activate(true, TransitionEffectType.Fade,
                1.0 / 120.0, event => {

                    event.changeScene(Ending);

                }, BACKGROUND_COLOR);
            return;
        }

        if (event.input.getAction("undo") == State.Pressed) {

            this.stage.undo();
            event.audio.playSample(event.assets.getSample("undo"), 0.65);   
        }

        if (event.input.getAction("restart") == State.Pressed) {

            this.stage.reset();
            event.audio.playSample(event.assets.getSample("restart"), 0.60);   
        }

        if (this.stage.isCleared()) {

            this.stage.stopPlayerAnimation();
            event.transition.activate(true, TransitionEffectType.Fade,
                1.0/20.0,
                event => {

                    this.stage.nextStage(event);

                }, BACKGROUND_COLOR);
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
        canvas.drawTextWithShadow(canvas.assets.getBitmap("font"), 
            str, view.x/2, 16, -56, 0, TextAlign.Center, 0.67, 0.67,
            4, 4, 0.20);

        let index = this.stage.getIndex() - 1;
        if (index < HINTS.length) {

            canvas.drawTextWithShadow(canvas.assets.getBitmap("font"), 
                HINTS[index], 16, view.y-64 + HINT_OFFSET[index], 
                -56, -4, TextAlign.Left, 0.40, 0.40,
                4, 4, 0.20);
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
        const FINAL_SCALE_OUT = 2.0;
        const TRANSLATION = 0.25;

        let scaleOut = 1.0 + this.scaleOutFactor * SCALE_OUT;

        let yoff = TRANSLATION * Math.pow(this.scaleOutFactor, 2);
        if (!this.fadingOut) {

            yoff *= -1;
        }
        if (this.stage.isPlayerDead()) {

            yoff = 0.0;
            scaleOut = 1.0 + this.scaleOutFactor * FINAL_SCALE_OUT;
        }

        canvas.changeShader(ShaderType.NoTexture);
        canvas.resetVertexAndFragmentTransforms();
        canvas.setColor();

        canvas.transform
            .loadIdentity()
            .use();
        canvas.clear(0.33, 0.67, 1.0);

        this.stage.draw(canvas, scaleOut, yoff);

        if (this.stage.isPlayerDead()) 
            return;

        this.drawHUD(canvas);

        if (this.pauseMenu.isActive()) {

            this.drawPauseMenu(canvas);
        }
    }

    
    public dispose(event : CoreEvent) : any {

        this.stage.dispose(event);

        return <any> null;
    }
}
