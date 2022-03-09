import { Canvas, StencilCondition } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { negMod } from "../core/math.js";
import { Matrix3 } from "../core/matrix.js";
import { Mesh } from "../core/mesh.js";
import { Tilemap } from "../core/tilemap.js";
import { RGBA, Vector2 } from "../core/vector.js";
import { GameObject, nextObject } from "./gameobject.js";
import { ObjectBuffer } from "./objectbuffer.js";
import { Orb } from "./orb.js";
import { ShrinkingPlatform } from "./platform.js";
import { Player } from "./player.js";
import { ShapeGenerator } from "./shapegenerator.js";
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

    private meshPlatformShadow : Mesh;
    private meshPlatformBottom : Mesh;
    private meshPlatformTop : Mesh;

    private meshOrb : Mesh;
    private meshOrbShadow : Mesh;

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

        this.terrain = new Terrain(map, TILE_WIDTH, TILE_HEIGHT, event);

        this.generateMeshes(event);
        this.parseObjects(map);

        this.stateBuffer = new Array<Array<Array<number>>> (STATE_BUFFER_SIZE);
        for (let i = 0; i < this.stateBuffer.length; ++ i) {

            this.stateBuffer[i] = new Array<Array<number>> (2);
        }
        this.stateBufferPointer = 0;
        this.stateBufferLength = 0;
    }


    private addPlatformCross(gen : ShapeGenerator, baseScale : number, tx = 0.0, ty = 0.0) {

        const COLOR = new RGBA(0.33, 0.0, 0.0);

        const RADIUS = 0.35;
        const WIDTH = 0.15;

        let r = RADIUS * baseScale;
        let w = WIDTH * baseScale;

        let M = Matrix3.multiply(
                Matrix3.multiply(
                    Matrix3.translate(tx, ty),
                    Matrix3.scale(TILE_WIDTH, TILE_HEIGHT)), 
                Matrix3.rotate(Math.PI/4));

        let A = new Vector2(-r, -w/2);
        let B = new Vector2(r, -w/2);
        let C = new Vector2(r, w/2);
        let D = new Vector2(-r, w/2);

        let tA = Matrix3.multiplyVector(M, A);
        let tB = Matrix3.multiplyVector(M, B);
        let tC = Matrix3.multiplyVector(M, C);
        let tD = Matrix3.multiplyVector(M, D);

        gen.addTriangle(tA, tB, tC, COLOR)
           .addTriangle(tC, tD, tA, COLOR); 

        A.swapComponents();
        B.swapComponents();
        C.swapComponents();
        D.swapComponents();

        tA = Matrix3.multiplyVector(M, A);
        tB = Matrix3.multiplyVector(M, B);
        tC = Matrix3.multiplyVector(M, C);
        tD = Matrix3.multiplyVector(M, D);

        gen.addTriangle(tA, tB, tC, COLOR)
           .addTriangle(tC, tD, tA, COLOR); 
    }


    private generatePlatformMeshes(event : CoreEvent) {

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

        let gen = new ShapeGenerator();
        gen.addEllipse(0, dy, 
                PLATFORM_SCALE * TILE_WIDTH - ow*2, 
                PLATFORM_SCALE * TILE_HEIGHT - ow*2, 
                PLATFORM_QUALITY, PLATFORM_COLOR_2);
        this.addPlatformCross(gen, PLATFORM_SCALE, 0, -0.25); // Why -0.25?
        this.meshPlatformTop = gen.constructMesh(event);
            
        this.meshPlatformShadow = (new ShapeGenerator())
            .addEllipse(SHADOW_OFFSET_X/2, SHADOW_OFFSET_Y, 
                PLATFORM_SCALE * (TILE_HEIGHT + SHADOW_OFFSET_X*2) - ow*2, 
                PLATFORM_SCALE * TILE_HEIGHT - ow*2, 
                PLATFORM_QUALITY, black)
            .constructMesh(event);
    }


    private generateOrbMeshes(event : CoreEvent) {

        const ORB_RADIUS = 0.25;
        const INNER_RADIUS = 0.15;
        const OUTLINE_WIDTH = 0.033;

        const BLACK = new RGBA(0);
        const ORB_COLOR_1 = new RGBA(0.25, 0.70, 0.20);
        const ORB_COLOR_2 = new RGBA(0.50, 1.0, 0.40);

        let r = ORB_RADIUS - OUTLINE_WIDTH;

        this.meshOrb = (new ShapeGenerator())
            .addEllipse(0, 0, ORB_RADIUS*2, ORB_RADIUS*2, 32, BLACK)
            .addEllipse(0, 0, r*2, r*2, 32, ORB_COLOR_1)
            .addEllipse(-0.033, -0.033, INNER_RADIUS*2, INNER_RADIUS*2, 32, ORB_COLOR_2)
            .constructMesh(event);

        this.meshOrbShadow = (new ShapeGenerator())
            .addEllipse(0, 0, ORB_RADIUS*2, ORB_RADIUS, 32, BLACK)
            .constructMesh(event);
    }


    private generateMeshes(event : CoreEvent) {

        this.generatePlatformMeshes(event);
        this.generateOrbMeshes(event);
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

                case 4:
                    
                    this.orbs.push(
                        new Orb(x, y,
                            this.meshOrb, 
                            this.meshOrbShadow));
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
        this.objectBuffer.drawShadows(canvas, TILE_WIDTH, TILE_HEIGHT);
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