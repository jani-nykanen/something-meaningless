import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Player } from "./player.js";
import { Terrain } from "./terrain.js";


const TURN_TIME = 15;


const TILE_WIDTH = 1.0;
const TILE_HEIGHT = 0.75;


export class Stage {


    private player : Player;
    private terrain : Terrain;

    private width : number;
    private height : number;


    constructor(event : CoreEvent, index : number) {

        this.player = new Player(0, 0, TURN_TIME, event);

        let map = event.assets.getTilemap(String(index));

        this.width = map.width;
        this.height = map.height;

        this.terrain = new Terrain(map, TILE_WIDTH, TILE_HEIGHT, event);
    }


    public update(event : CoreEvent) {

        this.player.update(this, event);
    }


    public draw(canvas : Canvas) {

        let scaleFactor = (this.height + 2.0) * TILE_HEIGHT;

        canvas.transform
            .fitGivenDimension(scaleFactor, canvas.width/canvas.height)
            .use();

        let view = canvas.transform.getViewport();

        canvas.transform
            .push()
            .translate(view.x/2, view.y/2)
            .translate(-(this.width-1) * TILE_WIDTH/2, -(this.height-1) * TILE_HEIGHT/2)
            .use();

        this.terrain.drawBottom(canvas);
        this.terrain.drawTop(canvas);
        this.player.draw(canvas, TILE_WIDTH, TILE_HEIGHT);
    
        canvas.transform.pop();
    }
}