import { Canvas, TextAlign } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { negMod } from "../core/math.js";
import { State } from "../core/types.js";



export class MenuButton {


    private scale : number;
    private scaleTarget : number;

    private text : string;
    private callback : (event : CoreEvent) => void;


    constructor(text : string, callback : (event : CoreEvent) => void) {

        this.text = text;
        this.callback = callback;

        this.scale = 1.0;
        this.scaleTarget = 1.0;
    }


    public getText = () : string => this.text;
    public evaluateCallback = (event : CoreEvent) => this.callback(event);


    public clone() : MenuButton {

        return new MenuButton(this.text, this.callback);
    }


    public changeText(newText : string) {

        this.text = newText;
    }


    public setScaleTarget(target = 1.0) {

        this.scaleTarget = target;
    }


    public setScale(scale = 1.0) {

        this.scale = scale;
    }


    public update(scaleSpeed : number, event : CoreEvent) {

        if (this.scale < this.scaleTarget) {

            this.scale = Math.min(this.scaleTarget, this.scale + scaleSpeed * event.step);
        }
        else if (this.scale > this.scaleTarget) {

            this.scale = Math.max(this.scaleTarget, this.scale - scaleSpeed * event.step);
        }
    }


    public getScale = () : number => this.scale;
}


export class Menu {


    private buttons : Array<MenuButton>;

    private cursorPos : number;
    private active : boolean;

    private textWave : number;


    constructor(buttons : Array<MenuButton>) {

        this.buttons = (new Array<MenuButton> (buttons.length))
            .fill(null)
            .map((_, i) => buttons[i].clone());

        // this.maxLength = Math.max(
        //    ...this.buttons.map(b => b.getText().length));

        this.cursorPos = 0;
        this.active = false;

        this.textWave = 0.0;
    }


    public activate(cursorPos = -1) {

        if (cursorPos >= 0)
            this.cursorPos = cursorPos % this.buttons.length;

        this.active = true;

        for (let i = 0; i < this.buttons.length; ++ i) {

            this.buttons[i].setScale(i == cursorPos ? 2.0 : 1.0);
        }
    }


    public update(event : CoreEvent) {

        const WAVE_SPEED = 0.067;
        const BUTTON_SCALE_SPEED = 1.0/10.0;
        
        if (!this.active) return;

        let oldPos = this.cursorPos;

        if (event.input.upPress()) {

            -- this.cursorPos;
        }
        else if (event.input.downPress()) {

            ++ this.cursorPos;
        }

        if (oldPos != this.cursorPos) {

            this.cursorPos = negMod(this.cursorPos, this.buttons.length);
            event.audio.playSample(event.assets.getSample("choose"), 0.60);
        }

        let activeButton = this.buttons[this.cursorPos];
        
        if (event.input.getAction("select") == State.Pressed ||
            event.input.getAction("start") == State.Pressed) {

            activeButton.evaluateCallback(event);
            event.audio.playSample(event.assets.getSample("select"), 0.50);   
        }

        this.textWave = (this.textWave + WAVE_SPEED*event.step) % (Math.PI*2);

        for (let i = 0; i < this.buttons.length; ++ i) {

            this.buttons[i].update(BUTTON_SCALE_SPEED, event);
            if (this.cursorPos == i) {

                this.buttons[i].setScaleTarget(2.0);
            }
            else {

                this.buttons[i].setScaleTarget();
            }
        }
    }


    public draw(canvas : Canvas, x : number, y : number,
        xoff = -56, yoff = 64, fontScale = 0.67, 
        wavePeriod = 0, waveAmplitude = 0, center = true) {

        const ACTIVE_SCALE = 1.25;

        if (!this.active) return;

        let font = canvas.assets.getBitmap("font");

        let view = canvas.transform.getViewport();
        if (!center)
            view.zeros();

        let h = (this.buttons.length * yoff);
        let dx = view.x/2 + x;
        let dy = view.y/2 - h / 2 + y;

        let scale : number;

        let waveFactor : number;

        for (let i = 0; i < this.buttons.length; ++ i) {

            if (i == this.cursorPos) {

                canvas.setColor(1, 1, 0.33);
            }
            else {

                canvas.setColor();
            }

            waveFactor = this.buttons[i].getScale() - 1.0;
            scale = fontScale * (1.0 + (ACTIVE_SCALE - 1.0) * waveFactor);

            canvas.drawTextWithShadow(font, this.buttons[i].getText(), 
                dx, dy + i * yoff, xoff, 0, TextAlign.Center,
                scale, scale,
                4, 4, 0.20, 
                this.textWave, 
                waveFactor * waveAmplitude, wavePeriod);
        } 
        canvas.setColor();
    }


    public isActive = () : boolean => this.active;


    public deactivate() {

        this.active = false;
    }


    public changeButtonText(index : number, text : string) {

        this.buttons[index].changeText(text);
    }
}
