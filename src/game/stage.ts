import { Canvas, StencilCondition } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Tilemap } from "../core/tilemap.js";
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

    private activeLayers : Array<Array<number>>;


    constructor(event : CoreEvent, index : number) {

        this.player = new Player(0, 0, TURN_TIME, event);

        let map = event.assets.getTilemap(String(index));

        this.width = map.width;
        this.height = map.height;

        this.activeLayers = map.cloneLayers();

        this.terrain = new Terrain(map, TILE_WIDTH, TILE_HEIGHT, event);

        this.parseObjects(map);
    }


    private parseObjects(map : Tilemap) {

        for (let y = 0; y < map.height; ++ y) {

            for (let x = 0; x < map.width; ++ x) {

                // Top layer
                switch (map.getTile(1, x, y)) {
                    
                case 3:
                    
                    this.player.setPosition(x, y);
                    break;

                default:
                    break;
                }

            }
        }
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
            .translate(
                -(this.width-1) * TILE_WIDTH/2, 
                -(this.height-1) * TILE_HEIGHT/2)
            .use();

        this.player.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT, 1.0 - TILE_HEIGHT);

        this.terrain.drawBottom(canvas);

        canvas.toggleStencilTest(true);
        canvas.clearStencilBuffer();
        canvas.setStencilCondition(StencilCondition.Always);

        this.terrain.drawTop(canvas);

        canvas.setStencilCondition(StencilCondition.Equal);
        this.player.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);

        canvas.toggleStencilTest(false);


        this.player.draw(canvas, TILE_WIDTH, TILE_HEIGHT);
    
        canvas.transform.pop();
    }


    public getTile(layer : 0 | 1, x : number, y : number, def = 0) {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;

        return this.activeLayers[layer][y * this.width + x];
    }
}