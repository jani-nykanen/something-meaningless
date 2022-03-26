import { TextAlign, ShaderType, Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";


const enum ErrorType {

    None = 0,
    Save = 1,
    Load = 2
};


const SAVE_NAME = "something_meaningless_savedata";
const ERROR_TIME = 180;


const ERROR_MESSAGES = [
    "Failed to save progress!",
    "Failed to find a game save!"
];


export class SaveManager {


    private loadErrorDrawn : boolean;
    private saveErrorDrawn : boolean;

    private errorTimer : number;
    private errorType : ErrorType;


    constructor() {

        this.loadErrorDrawn = false;
        this.saveErrorDrawn = false;

        this.errorType = ErrorType.None;
        this.errorTimer = 0.0;
    }


    public saveGame(stageIndex : number) {

        try {

            localStorage.setItem(SAVE_NAME, String(stageIndex));
        }
        catch (e) {

            console.log("Save error: " + e);

            if (!this.saveErrorDrawn) {

                this.errorType = ErrorType.Save;
                this.errorTimer = ERROR_TIME;
                this.saveErrorDrawn = true;
            }
        }
    }


    public loadGame(def = 1) : number {

        let res : string;

        try {

            res = localStorage.getItem(SAVE_NAME);
            if (res == null) {

                return def;
            }
            return Number(res);
        }
        catch (e) {

            console.log("Save error: " + e);

            if (!this.loadErrorDrawn) {

                this.errorType = ErrorType.Load;
                this.errorTimer = ERROR_TIME;
                this.loadErrorDrawn = true;
            }
        }
        return def;
    }


    public update(event : CoreEvent) {

        if (this.errorType == ErrorType.None)
            return;

        if ((this.errorTimer -= event.step) <= 0) {

            this.errorTimer = 0;
            this.errorType = ErrorType.None;
        }
    }


    public draw(canvas : Canvas) {

        const ENTER_TIME = 15;
        const Y_POS = 16;
        const START_Y = -64;
        const FONT_SCALE = 0.33;

        if (this.errorType == ErrorType.None)
            return;

        canvas.changeShader(ShaderType.Textured);

        let font = canvas.assets.getBitmap("font");

        canvas.transform
            .loadIdentity()
            .fitGivenDimension(1080.0, canvas.width/canvas.height)
            .use();

        let y = Y_POS;
        if (this.errorTimer >= ERROR_TIME - ENTER_TIME) {

            y = START_Y + (Y_POS - START_Y) * (1.0 - (this.errorTimer - (ERROR_TIME - ENTER_TIME)) / ENTER_TIME);
        }
        else if (this.errorTimer < ENTER_TIME) {

            y = START_Y + (Y_POS - START_Y) * (this.errorTimer / ENTER_TIME);
        }

        canvas.setColor(1.0, 0.80, 0.80);
        canvas.drawText(font, ERROR_MESSAGES[this.errorType-1],
            16, y, -60, 0, TextAlign.Left, FONT_SCALE, FONT_SCALE);
    }
}
