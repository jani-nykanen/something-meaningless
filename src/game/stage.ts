import { Canvas, StencilCondition } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Tilemap } from "../core/tilemap.js";
import { RGBA } from "../core/vector.js";
import { ShrinkingPlatform } from "./platform.js";
import { Player } from "./player.js";
import { ShapeGenerator } from "./shapegenerator.js";
import { Terrain } from "./terrain.js";


const TURN_TIME = 15;

const TILE_WIDTH = 1.0;
const TILE_HEIGHT = 0.75;

const SHADOW_ALPHA = 0.33;


export const enum TileType {

    Invalid = -1,
    Floor = 0,
    Platform = 1
};


export class Stage {


    private player : Player;
    private platforms : Array<ShrinkingPlatform>;

    private terrain : Terrain;

    private width : number;
    private height : number;

    private activeLayers : Array<Array<number>>;

    private meshPlatformShadow : Mesh;
    private meshPlatformBottom : Mesh;
    private meshPlatformTop : Mesh;


    constructor(event : CoreEvent, index : number) {

        this.player = new Player(0, 0, TURN_TIME, event);
        this.platforms = new Array<ShrinkingPlatform> ();

        let map = event.assets.getTilemap(String(index));

        this.width = map.width;
        this.height = map.height;

        this.activeLayers = map.cloneLayers();

        this.terrain = new Terrain(map, TILE_WIDTH, TILE_HEIGHT, event);

        this.generateMeshes(event);
        this.parseObjects(map);
    }


    private generateMeshes(event : CoreEvent) {

        const PLATFORM_SCALE = 0.90;
        const PLATFORM_QUALITY = 32;
        const PLATFORM_COLOR_1 = new RGBA(0.70, 0.33, 0);
        const PLATFORM_COLOR_2 = new RGBA(1.0, 0.67, 0.33);
        
        /*
        const CROSS_WIDTH = 0.20;
        const CROSS_HEIGHT = 0.80;
        const CROSS_COLOR = new RGBA(0.33, 0, 0);
        */

        const SHADOW_OFFSET_X = 0.15;
        const SHADOW_OFFSET_Y = 0.15;

        const OUTLINE_WIDTH = 0.033;

        // TODO: This should be constant, too
        let black = new RGBA(0);

        let dw = PLATFORM_SCALE * TILE_WIDTH;
        let dh = (1.0 - TILE_HEIGHT);
        let dx = -dw/2;
        let dy = -dh;
        
        let ow = OUTLINE_WIDTH * PLATFORM_SCALE;

        this.meshPlatformBottom = (new ShapeGenerator())
            .addRectangle(
                dx, dy, 
                dw,  dh, black)
            .addSector(0, Math.PI, PLATFORM_QUALITY, black,
                0, 0, 
                PLATFORM_SCALE * TILE_WIDTH / 2.0, 
                PLATFORM_SCALE * TILE_HEIGHT / 2.0)
            .addSector(0, Math.PI, PLATFORM_QUALITY, black,
                0, dy, 
                PLATFORM_SCALE * TILE_WIDTH / 2.0, 
                -PLATFORM_SCALE * TILE_HEIGHT / 2.0)
            .addRectangle(
                dx + ow, dy + ow, 
                dw - ow*2, dh, 
                PLATFORM_COLOR_1)
            .addSector(0, Math.PI, PLATFORM_QUALITY, PLATFORM_COLOR_1,
                0, 0, 
                PLATFORM_SCALE * TILE_WIDTH / 2.0 - ow, 
                PLATFORM_SCALE * TILE_HEIGHT / 2.0 - ow)
            .constructMesh(event);

        this.meshPlatformTop = (new ShapeGenerator())
            .addEllipse(0, dy, 
                PLATFORM_SCALE * TILE_WIDTH - ow*2, 
                PLATFORM_SCALE * TILE_HEIGHT - ow*2, 
                PLATFORM_QUALITY, PLATFORM_COLOR_2)
            .constructMesh(event);
            
        this.meshPlatformShadow = (new ShapeGenerator())
            .addEllipse(SHADOW_OFFSET_X/2, SHADOW_OFFSET_Y, 
                PLATFORM_SCALE * (TILE_HEIGHT + SHADOW_OFFSET_X*2) - ow*2, 
                PLATFORM_SCALE * TILE_HEIGHT - ow*2, 
                PLATFORM_QUALITY, black)
            .constructMesh(event);
    }


    private parseObjects(map : Tilemap) {

        for (let y = 0; y < map.height; ++ y) {

            for (let x = 0; x < map.width; ++ x) {

                // Bottom layer
                switch (map.getTile(0, x, y)) {
                    
                case 2:
    
                    this.platforms.push(
                        new ShrinkingPlatform(x, y,
                            this.meshPlatformBottom,
                            this.meshPlatformTop,
                            this.meshPlatformShadow,
                            TURN_TIME));
                    break;
    
                default:
                    break;
                }

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


    private drawShadowLayer(canvas : Canvas) {

        canvas.toggleStencilTest(true);
        canvas.clearStencilBuffer();

        canvas.setColor(0, 0, 0, 0.33);
        canvas.setStencilCondition(StencilCondition.NotEqual);

        this.terrain.drawShadows(canvas);
        this.player.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT, 1.0 - TILE_HEIGHT);

        canvas.setColor(0, 0, 0, SHADOW_ALPHA);
        for (let o of this.platforms) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
        }

        canvas.toggleStencilTest(false);
        canvas.setColor();
    }


    private drawBottomLayerObjectsBottom(canvas : Canvas) {
        
        canvas.setColor();

        for (let o of this.platforms) {

            o.drawBottom(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
    }


    private drawBottomLayerObjectsTop(canvas : Canvas) {

        canvas.setColor();

        for (let o of this.platforms) {

            o.drawTop(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
    }


    public draw(canvas : Canvas) {

        let scaleFactor = (this.height + 2.5) * TILE_HEIGHT;

        canvas.transform
            .fitGivenDimension(scaleFactor, canvas.width/canvas.height)
            .use();

        let view = canvas.transform.getViewport();

        canvas.transform
            .push()
            .translate(view.x/2, view.y/2)
            .translate(
                -(this.width-1) * TILE_WIDTH/2, 
                -(this.height-1) * TILE_HEIGHT/2 + TILE_HEIGHT/4)
            .use();

        this.drawShadowLayer(canvas);

        this.terrain.drawBottom(canvas);
        this.drawBottomLayerObjectsBottom(canvas);

        canvas.toggleStencilTest(true);
        canvas.clearStencilBuffer();
        canvas.setStencilCondition(StencilCondition.Always);

        this.drawBottomLayerObjectsTop(canvas);
        this.terrain.drawTop(canvas);

        canvas.setStencilCondition(StencilCondition.Equal);

        // Player shadow
        canvas.setColor(0, 0, 0, SHADOW_ALPHA);
        this.player.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT, 0);
        canvas.setColor();

        canvas.toggleStencilTest(false);

        this.player.draw(canvas, TILE_WIDTH, TILE_HEIGHT);
    
        canvas.transform.pop();
    }


    public getTile(layer : 0 | 1, x : number, y : number, def = 0) {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;

        return this.activeLayers[layer][y * this.width + x];
    }


    public getBottomTileType(x : number, y : number) : TileType {

        let tile = this.getTile(0, x, y, 0);

        switch (tile) {

        case 1:
            return TileType.Floor;

        case 2:
            return TileType.Platform;

        default:
            return TileType.Invalid;
        }
    }
}