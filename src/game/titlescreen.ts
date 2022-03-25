import { Canvas, ShaderType, TextAlign } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { TransitionEffectType } from "../core/transition.js";
import { State } from "../core/types.js";
import { RGBA, Vector2 } from "../core/vector.js";
import { PlayerAnimator } from "./animator.js";
import { GameScene, THEME_VOLUME } from "./game.js";
import { Menu, MenuButton } from "./menu.js";
import { ShapeGenerator } from "./shapegenerator.js";


const BACKGROUND_COLOR = new RGBA(0.33, 0.67, 1.0);


export class TitleScreen implements Scene {


    private menu : Menu;

    private animator : PlayerAnimator;
    private animationTimer : number;
    private scaleTime : number;
    private fadingOut : boolean;
    
    private pressEnterTimer : number;
    private enterAlpha : number;
    private phase : number;

    private meshCircle : Mesh;


    constructor(param : any, event : CoreEvent) {

        this.animator = new PlayerAnimator(event);
        this.animationTimer = 0.0;

        this.menu = new Menu(
        [
            new MenuButton("New Game", event => {

                this.goToGame(event);
            }),

            new MenuButton("Continue", event => {

                this.goToGame(event, true);
            }),

            new MenuButton(event.audio.getAudioStateString(), event => {

                if (event.audio.isEnabled()) {

                    event.audio.pauseMusic();
                }

                event.audio.toggle(!event.audio.isEnabled());
                this.menu.changeButtonText(2, event.audio.getAudioStateString());

                if (event.audio.isEnabled() && !event.audio.resumeMusic()) {

                    event.audio.fadeInMusic(event.assets.getSample("theme"), THEME_VOLUME, 1000.0);
                }
            }),
        ]
        );

        this.menu.activate(0);

        if (!event.audio.resumeMusic()) {

            event.audio.fadeInMusic(event.assets.getSample("theme"), THEME_VOLUME, 1000.0);
        }

        this.scaleTime = 0.0;
        event.transition.activate(false, TransitionEffectType.Fade, 1.0/30.0, null, BACKGROUND_COLOR);

        this.fadingOut = false;

        this.pressEnterTimer = 0.0;
        this.phase = 0.0;
        this.enterAlpha = 0.0;

        this.meshCircle = (new ShapeGenerator())
            .addEllipse(0, 0, 2.0, 2.0, 128, new RGBA())
            .constructMesh(event);
    }


    private goToGame(event : CoreEvent, loadGame = false) {

        ++ this.phase;

        event.transition.activate(true, TransitionEffectType.Fade,
            1.0/30.0, event => {

                event.changeScene(GameScene);
            },
            BACKGROUND_COLOR);
    }


    private animate(event : CoreEvent) {

        const ANIMATION_SPEED = (Math.PI*2)/60.0;

        this.animationTimer = (this.animationTimer + ANIMATION_SPEED*event.step) % (Math.PI*2);

        let eyePos = new Vector2(
            Math.cos(this.animationTimer),
            Math.sin(this.animationTimer)
        );
            
        this.animator.setEyeTarget(eyePos);
        this.animator.animateWalkingCycle(this.animationTimer);
        this.animator.update(event);    
    }


    public update(event : CoreEvent) {

        const ENTER_TIMER_SPEED = Math.PI*2 / 60.0;
        const ENTER_ALPHA_SPEED = 1.0/15.0;

        this.animate(event);
        
        if (event.transition.isActive()) {

            this.fadingOut = event.transition.isFadingOut();

            this.scaleTime = 1.0 - event.transition.getTime();
            if (!event.transition.isFadingOut())
                this.scaleTime = 1.0 - this.scaleTime;

            return;
        }
        this.fadingOut = false;

        if (this.phase == 0) {

            this.pressEnterTimer = (this.pressEnterTimer + ENTER_TIMER_SPEED * event.step) % (Math.PI*2);
            
            if (this.enterAlpha < 1.0) {

                this.enterAlpha = Math.min(1.0, this.enterAlpha + ENTER_ALPHA_SPEED*event.step);
            }

            if (event.input.getAction("start") == State.Pressed ||
                event.input.getAction("select") == State.Pressed) {

                ++ this.phase;

                event.audio.playSample(event.assets.getSample("start"), 0.60);
            }
            return;
        }

        this.menu.update(event);
    }


    private drawBackground(canvas : Canvas) {

        const COUNT = 5;
        const BASE_SCALE = 0.75;
        const BASE_COLOR = new RGBA(0, 0.33, 0.67);

        canvas.clear(0.33, 0.67, 1.0);

        canvas.changeShader(ShaderType.NoTexture);

        let view = canvas.transform.getViewport();

        let scale = BASE_SCALE * Math.min(view.x, view.y);

        let t : number;
        let timer = this.animationTimer / (Math.PI*2);
        for (let i = 0; i < COUNT; ++ i) {

            t = ((timer + i * 1.0) / COUNT) % 1.0;

            canvas.transform
                .push()
                .scale(scale * t, scale * t)
                .use();

            canvas.setColor(BASE_COLOR.r, BASE_COLOR.g, BASE_COLOR.b, Math.sin((1.0 - t) * Math.PI/2));
            canvas.drawMesh(this.meshCircle);

            canvas.transform
                .pop()
                .use();
        }
        canvas.setColor();
    }


    public redraw(canvas : Canvas) {

        const LOGO_YOFF = -16.0;
        const FIGURE_SCALE = 272.0;
        const FIGURE_YOFF = -336.0;
        const SCALE_AMPLITUDE = 0.05;
        const MENU_YOFF = 304.0;
        const CAMERA_SCALE_OUT = 0.50;
        const CAMERA_SCALE_IN = 1.0;

        canvas.transform
            .loadIdentity()
            .fitGivenDimension(1080.0, canvas.width/canvas.height)
            .use();

        let cameraScale = 1.0;
        if (this.fadingOut) {

            cameraScale += CAMERA_SCALE_IN * this.scaleTime;
        }
        else {

            cameraScale -= CAMERA_SCALE_OUT * this.scaleTime
        }

        let cameraAngle = this.scaleTime * Math.PI/4;
        if (this.fadingOut)
            cameraAngle *= -1;

        let view = canvas.transform.getViewport();
        canvas.transform
            .translate(view.x/2, view.y/2)
            .rotate(cameraAngle)
            .scale(cameraScale, cameraScale)
            .use();

        this.drawBackground(canvas);
        canvas.changeShader(ShaderType.Textured);

        canvas.setColor();

        let bmp = canvas.assets.getBitmap("logo");

        let scale = 1.0 + Math.sin(this.animationTimer) * SCALE_AMPLITUDE;
        let w = bmp.width * scale;
        let h = bmp.height * scale;

        canvas.drawBitmap(bmp, -w/2, -h/2 + LOGO_YOFF, w, h);

        let font = canvas.assets.getBitmap("font");

        if (this.phase == 0) {

            canvas.setColor(1, 1, 0.33, Math.sin(this.enterAlpha))
            canvas.drawText(font, "Press Enter to Start",
                0, MENU_YOFF, -64, 0, TextAlign.Center, 0.67, 0.67, 
                this.pressEnterTimer, 12, Math.PI*2/8);
        }
        else if (this.phase == 1) {

            this.menu.draw(canvas, 0, MENU_YOFF, -56, 76, 0.50, Math.PI*2 / 12, 16, false);
        }
        
        if (this.phase != 2) {

            canvas.setColor(1, 1, 0.67, Math.sin(this.enterAlpha));
            canvas.drawText(font, "(c)2022 Jani Nyk@nen", 0, view.y/2-64, -56, 0, TextAlign.Center, 0.40, 0.40);
        }

        canvas.changeShader(ShaderType.NoTexture);

        canvas.resetVertexAndFragmentTransforms();
        canvas.setColor();
        canvas.transform
            .push()
            .translate(0.0, FIGURE_YOFF)
            .scale(FIGURE_SCALE, FIGURE_SCALE)
            .use();

        this.animator.draw(canvas);

        canvas.transform
            .pop()
            .use();
    }


    public dispose(event : CoreEvent) : any {

        this.animator.dispose(event);
        event.disposeMesh(this.meshCircle);

        return <any> 0;
    }

}
