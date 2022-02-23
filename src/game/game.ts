import { Canvas } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";



export class GameScene implements Scene {


    constructor(param : any, event : CoreEvent) {

    }


    public update(event: CoreEvent) : void {
        
    }


    public redraw(canvas: Canvas) : void {

        canvas.clear(0.67, 0.67, 0.67);
    }

    
    public dispose() : any {

        return <any> null;
    }
}
