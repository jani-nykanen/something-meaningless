import { Canvas, StencilCondition, StencilOperation } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { negMod } from "../core/math.js";
import { Tilemap } from "../core/tilemap.js";
import { GameObject, nextObject } from "./gameobject.js";
import { ObjectBuffer } from "./objectbuffer.js";
import { Orb } from "./orb.js";
import { ShrinkingPlatform } from "./platform.js";
import { Player } from "./player.js";
import { StageMesh, StageMeshBuilder } from "./stagemeshbuilder.js";
import { Terrain } from "./terrain.js";


const TURN_TIME = 15;

const TILE_WIDTH = 1.0;
const TILE_HEIGHT = 0.75;

const SHADOW_ALPHA = 0.33;

const STATE_BUFFER_SIZE = 32;


export const enum TileType {

    Invalid = -1,
    Floor = 0,
    Platform = 1
};


export class Stage {


    private player : Player;
    private platforms : Array<ShrinkingPlatform>;
    private orbs : Array<Orb>;

    private objectBuffer : ObjectBuffer;

    private terrain : Terrain;

    private width : number;
    private height : number;

    private activeLayers : Array<Array<number>>;
    private stateBuffer : Array<Array<Array<number>>>;
    private stateBufferPointer : number;
    private stateBufferLength : number;

    private meshBuilder : StageMeshBuilder;

    private readonly baseMap : Tilemap;
    

    constructor(event : CoreEvent, index : number) {

        this.player = new Player(0, 0, TURN_TIME, event);
        this.platforms = new Array<ShrinkingPlatform> ();
        this.orbs = new Array<Orb> ();

        this.objectBuffer = new ObjectBuffer();

        let map = event.assets.getTilemap(String(index));

        this.baseMap = map;

        this.width = map.width;
        this.height = map.height;

        this.activeLayers = map.cloneLayers();

        this.stateBuffer = new Array<Array<Array<number>>> (STATE_BUFFER_SIZE);
        for (let i = 0; i < this.stateBuffer.length; ++ i) {

            this.stateBuffer[i] = new Array<Array<number>> (2);
        }
        this.stateBufferPointer = 0;
        this.stateBufferLength = 0;

        this.terrain = new Terrain(map, TILE_WIDTH, TILE_HEIGHT, event);
        this.meshBuilder = new StageMeshBuilder(TILE_WIDTH, TILE_HEIGHT, event);

        this.parseObjects(map);
    }


    private parseObjects(map : Tilemap) {

        for (let y = 0; y < map.height; ++ y) {

            for (let x = 0; x < map.width; ++ x) {

                // Bottom layer
                switch (map.getTile(0, x, y)) {
                    
                case 2:
    
                    this.platforms.push(
                        new ShrinkingPlatform(x, y,
                            this.meshBuilder.getMesh(StageMesh.PlatformBottom),
                            this.meshBuilder.getMesh(StageMesh.PlatformTop),
                            this.meshBuilder.getMesh(StageMesh.PlatformShadow),
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

                case 4:
                    
                    this.orbs.push(
                        new Orb(x, y,
                            this.meshBuilder.getMesh(StageMesh.OrbBody), 
                            this.meshBuilder.getMesh(StageMesh.OrbShadow)));
                    break;

                default:
                    break;
                }

            }
        }
    }
    


    public update(event : CoreEvent) {

        for (let o of this.platforms) {

            o.update(this, event);
        }

        for (let o of this.orbs) {

            o.update(this.player, this, event);
        }

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


    private drawObjectShadows(canvas : Canvas) {

        canvas.setColor(0, 0, 0, SHADOW_ALPHA);

        canvas.setStencilOperation(StencilOperation.Zero);
        for (let o of this.orbs) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
        }

        canvas.setStencilOperation(StencilOperation.Keep);
        this.player.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
    }


    public draw(canvas : Canvas) {

        this.objectBuffer.flush();
        this.objectBuffer.addObject(this.player);
        this.objectBuffer.addObjects(this.orbs);
        this.objectBuffer.sort();

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
        this.drawObjectShadows(canvas);
        canvas.setColor();

        canvas.toggleStencilTest(false);

        this.objectBuffer.draw(canvas, TILE_WIDTH, TILE_HEIGHT);
    
        canvas.transform.pop();
    }


    public getTile(layer : 0 | 1, x : number, y : number, def = 0) : number {

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


    public setTile(layer : 0 | 1, x : number, y : number, value : number) {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;

        this.activeLayers[layer][y * this.width + x] = value;
    }


    public storeState() {

        for (let j = 0; j < 2; ++ j) {

            this.stateBuffer[this.stateBufferPointer][j] = Array.from(this.activeLayers[j]);
        }

        this.stateBufferPointer = (this.stateBufferPointer + 1) % (this.stateBuffer.length);
        this.stateBufferLength = Math.min(this.stateBuffer.length, this.stateBufferLength + 1);
    }


    private resetObjects() {

        for (let o of this.platforms)
            o.kill();

        for (let o of this.orbs)
            o.kill();

        let o : GameObject;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                // Bottom layer
                switch (this.activeLayers[0][y * this.width + x]) {
                    
                case 2:
    
                    o = <GameObject> nextObject<ShrinkingPlatform> (this.platforms);
                    // Should not happen
                    if (o == null)
                        break;

                    (<ShrinkingPlatform> o).recreate(x, y);

                    break;
    
                default:
                    break;
                }

                // Top layer
                switch (this.activeLayers[1][y * this.width + x]) {

                case 3:
                    
                    this.player.recreate(x, y);
                    break;

                case 4:

                    o = <GameObject> nextObject<Orb> (this.orbs);
                    // Should not happen
                    if (o == null)
                        break;

                    (<Orb> o).recreate(x, y);
                    break;

                default:
                    break;
                }

            }
        }
    }


    public undo() {

        if (this.stateBufferLength == 0) return;

        -- this.stateBufferLength;
        this.stateBufferPointer = negMod(this.stateBufferPointer - 1, this.stateBuffer.length);

        for (let j = 0; j < 2; ++ j) {

            this.activeLayers[j] = Array.from(this.stateBuffer[this.stateBufferPointer][j]);
        }
        this.resetObjects();
    }


    public reset() {

        this.storeState();
        this.activeLayers = this.baseMap.cloneLayers();

        this.resetObjects();
    }
}