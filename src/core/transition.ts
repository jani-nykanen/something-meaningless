import { Canvas, ShaderType } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { RGBA } from "./vector.js";


export const enum TransitionEffectType {

    None = 0,
    Fade = 1,
}


export class TransitionEffectManager {


    private timer : number;
    private fadeOut : boolean;
    private effectType : TransitionEffectType;
    private color : RGBA;
    private active : boolean;
    private speed : number;
    
    private callback : ((event : CoreEvent) => void);


    constructor() {

        this.timer = 0;
        this.fadeOut = false;
        this.effectType = TransitionEffectType.None;
        this.color = new RGBA();
        this.active = false;
        this.speed = 1;

        this.callback = ev => {};
    }


    public activate(fadeOut : boolean, type : TransitionEffectType, speed : number, 
        callback : (event : CoreEvent) => any, color = new RGBA()) : TransitionEffectManager {

        this.fadeOut = fadeOut;
        this.speed = speed;
        this.timer = 1.0;
        this.callback = callback;
        this.effectType = type;
        this.color = color.clone();

        this.active = true;

        return this;
    }


    public update(ev : CoreEvent) {

        if (!this.active) return;

        if ((this.timer -= this.speed * ev.step) <= 0) {

            this.fadeOut = !this.fadeOut;
            if (!this.fadeOut) {

                this.timer += 1.0;
                this.callback(ev);
            }
            else {

                this.active = false;
                this.timer = 0;
            }
        }
    }


    public draw(canvas : Canvas) {

        if (!this.active || this.effectType == TransitionEffectType.None)
            return;
    
        canvas.changeShader(ShaderType.NoTexture);

        canvas.transform
            .loadIdentity()
            .setView(canvas.width, canvas.height)
            .use();

        let t = this.timer;
        if (this.fadeOut)
            t = 1.0 - t;

        switch (this.effectType) {

        case TransitionEffectType.Fade:

            canvas.changeShader(ShaderType.NoTexture);
            canvas.setColor(this.color.r, this.color.g, this.color.b, this.color.a * t);
            canvas.fillRect(0, 0, canvas.width, canvas.height);
            break;

        default:
            break;
        }

        canvas.resetVertexAndFragmentTransforms();
        canvas.setColor();
    }


    public isActive = () : boolean => this.active;
    public getSpeed = () : number => this.speed;
    public getTime = () : number => this.timer;
    public isFadingOut = () : boolean => this.fadeOut;


    public deactivate() {

        this.active = false;
    }
}
