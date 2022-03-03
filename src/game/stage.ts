import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Player } from "./player.js";


const TURN_TIME = 15;


export class Stage {


    private player : Player;


    constructor(event : CoreEvent) {

        this.player = new Player(0, 0, TURN_TIME, event);
    }


    public update(event : CoreEvent) {

        this.player.update(this, event);
    }


    public draw(canvas : Canvas) {

        canvas.transform
            .fitGivenDimension(6.0, canvas.width/canvas.height)
            .use();

        let view = canvas.transform.getViewport();

        canvas.transform
            .push()
            .translate(view.x/2, view.y/2)
            .use();

        this.player.draw(canvas);
    
        canvas.transform.pop();
    }
}