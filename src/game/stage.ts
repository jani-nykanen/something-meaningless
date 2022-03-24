import { Canvas, StencilCondition, StencilOperation } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { negMod } from "../core/math.js";
import { Tilemap } from "../core/tilemap.js";
import { ExistingObject, GameObject, nextObject } from "./gameobject.js";
import { ObjectBuffer } from "./objectbuffer.js";
import { Orb } from "./orb.js";
import { ShrinkingPlatform } from "./shrinkingplatform.js";
import { Player } from "./player.js";
import { StageMesh, StageMeshBuilder } from "./stagemeshbuilder.js";
import { StarGenerator } from "./stargenerator.js";
import { Terrain } from "./terrain.js";
import { MovingPlatform } from "./movingplatform.js";
import { TogglableTile } from "./togglabletile.js";
import { RGBA, Vector2, Vector3 } from "../core/vector.js";
import { Direction } from "./types.js";
import { SwitchingPlatform } from "./switchingplatform.js";
import { Ghost } from "./ghost.js";


const TURN_TIME = 15;

const TILE_WIDTH = 1.0;
const TILE_HEIGHT = 0.75;

const SHADOW_ALPHA = 0.33;

const STATE_BUFFER_SIZE = 32;


export const enum TileType {

    Invalid = -1,
    Floor = 0,
    Platform = 1,
    JumpTile = 2,
};


export const enum UnderlyingEffectType {

    None = 0,
    Button = 1,
    JumpTile = 2,
    AutomaticArrow = 3,
    Teleport = 4,
};


const replaceInArray = (arr : Array<number>, replacedItem : number, newValue : number) : void => {

    for (let i = 0; i < arr.length; ++ i) {

        if (arr[i] == replacedItem) {

            arr[i] = newValue;
        }
    }
}


const swapItemsInArray = (arr : Array<number>, a : number, b : number) : void => {

    for (let i = 0; i < arr.length; ++ i) {

        if (arr[i] == a) {

            arr[i] = b;
        }
        else if (arr[i] == b) {

            arr[i] = a;
        }
    }
}


export class Stage {


    private player : Player;
    private shrinkingPlatforms : Array<ShrinkingPlatform>;
    private movingPlatforms : Array<MovingPlatform>;
    private togglablePlatforms : Array<TogglableTile>;
    private switchingPlatforms : Array<SwitchingPlatform>;
    private orbs : Array<Orb>;
    private ghosts : Array<Ghost>;

    private objectBuffer : ObjectBuffer;

    private terrain : Terrain;
    private starGen : StarGenerator;

    private width : number;
    private height : number;

    private activeLayers : Array<Array<number>>;
    private stateBuffer : Array<Array<Array<number>>>;
    private stateBufferPointer : number;
    private stateBufferLength : number;

    private meshBuilder : StageMeshBuilder;

    private waiting : boolean;
    private waitTimer : number;

    private starAnimationTimer : number;
    private specialStarScale : number;
    private arrowAnimationTimer : number;
    private arrowRotationTimer : number;

    private orbsLeft : number;

    private baseMap : Tilemap;
    private stageIndex : number;
    

    constructor(event : CoreEvent, index : number) {

        this.player = new Player(0, 0, TURN_TIME, event);
        this.shrinkingPlatforms = new Array<ShrinkingPlatform> ();
        this.movingPlatforms = new Array<MovingPlatform> ();
        this.togglablePlatforms = new Array<TogglableTile> ();
        this.switchingPlatforms = new Array<SwitchingPlatform> ();
        this.orbs = new Array<Orb> ();
        this.ghosts = new Array<Ghost> ();

        this.objectBuffer = new ObjectBuffer();

        let map = event.assets.getTilemap(String(index));

        this.stageIndex = index;
        this.baseMap = map;

        this.width = map.width;
        this.height = map.height;

        this.waitTimer = 0.0;
        this.waiting = false;

        this.starAnimationTimer = 0.0;
        this.specialStarScale = 0.0;
        this.arrowAnimationTimer = 0.0;
        this.arrowRotationTimer = 0.0;

        this.activeLayers = map.cloneLayers();

        this.stateBuffer = new Array<Array<Array<number>>> (STATE_BUFFER_SIZE);
        for (let i = 0; i < this.stateBuffer.length; ++ i) {

            this.stateBuffer[i] = new Array<Array<number>> (2);
        }
        this.stateBufferPointer = 0;
        this.stateBufferLength = 0;

        let outlineScale = 1.0 + (this.height-4) * 0.1; // TODO: Compute elsewhere

        this.terrain = new Terrain(map, TILE_WIDTH, TILE_HEIGHT, outlineScale, event);
        this.meshBuilder = new StageMeshBuilder(TILE_WIDTH, TILE_HEIGHT, event);
        this.starGen = new StarGenerator(event);

        this.parseObjects(map);
        this.recomputeOrbs();
    }


    public nextStage(event : CoreEvent) {

        this.shrinkingPlatforms.length = 0;
        this.movingPlatforms.length = 0;
        this.togglablePlatforms.length = 0;
        this.switchingPlatforms.length = 0;
        this.orbs.length = 0;
        this.ghosts.length = 0;

        this.objectBuffer.flush();

        ++ this.stageIndex;
        this.baseMap = event.assets.getTilemap(String(this.stageIndex));

        this.width = this.baseMap.width;
        this.height = this.baseMap.height;

        this.waitTimer = 0.0;
        this.waiting = false;

        this.starAnimationTimer = 0.0;
        this.specialStarScale = 0.0;
        this.arrowAnimationTimer = 0.0;
        this.arrowRotationTimer = 0.0;

        this.activeLayers = null;
        this.activeLayers = this.baseMap.cloneLayers();

        this.stateBuffer = null;
        this.stateBuffer = new Array<Array<Array<number>>> (STATE_BUFFER_SIZE);
        for (let i = 0; i < this.stateBuffer.length; ++ i) {

            this.stateBuffer[i] = new Array<Array<number>> (2);
        }
        this.stateBufferPointer = 0;
        this.stateBufferLength = 0;

        let outlineScale = 1.0 + (this.height-4) * 0.1; // TODO: Compute elsewhere

        this.terrain.dispose(event);
        this.terrain = new Terrain(this.baseMap, TILE_WIDTH, TILE_HEIGHT, outlineScale, event);

        this.parseObjects(this.baseMap);
        this.recomputeOrbs();
    }


    private parseObjects(map : Tilemap) {

        let tid : number;

        for (let y = 0; y < map.height; ++ y) {

            for (let x = 0; x < map.width; ++ x) {

                tid = map.getTile(0, x, y);

                // Bottom layer
                switch (tid) {

                // Shrinking platforms
                case 2:
    
                    this.shrinkingPlatforms.push(
                        new ShrinkingPlatform(x, y,
                            this.meshBuilder.getMesh(StageMesh.PlatformBottom),
                            this.meshBuilder.getMesh(StageMesh.PlatformTop),
                            this.meshBuilder.getMesh(StageMesh.PlatformShadow),
                            TURN_TIME));
                    break;

                // Moving platforms
                case 5:
                case 6:
                case 7:
                case 8:

                    this.movingPlatforms.push(
                        new MovingPlatform(x, y,
                            this.meshBuilder.getMesh(StageMesh.MovingPlatformBottom),
                            this.meshBuilder.getMesh(StageMesh.MovingPlatformTop),
                            this.meshBuilder.getMesh(StageMesh.MovingPlatformShadow),
                            this.meshBuilder.getMesh(StageMesh.MovingPlatformArrow),
                            TURN_TIME, tid - 5));
                    break;
    
                // Togglable platforms
                case 9:
                case 10:

                    this.togglablePlatforms.push(
                        new TogglableTile(x, y,
                            this.meshBuilder.getMesh(StageMesh.TogglableTileBottom),
                            this.meshBuilder.getMesh(StageMesh.TogglableTileTop),
                            this.meshBuilder.getMesh(StageMesh.TogglableTileShadow),
                            tid == 9, TURN_TIME));        
                    break;

                // Switching platform
                case 21:
                case 22:

                    this.switchingPlatforms.push(
                        new SwitchingPlatform(x, y,
                            this.meshBuilder.getMesh(StageMesh.SwitchingPlatformBottom),
                            this.meshBuilder.getMesh(StageMesh.SwitchingPlatformTop),
                            this.meshBuilder.getMesh(StageMesh.SwitchingPlatformShadow),
                            tid == 21, TURN_TIME));   
                    break;

                default:
                    break;
                }

                tid = map.getTile(1, x, y);

                // Top layer
                switch (tid) {

                // Player
                case 3:
                    
                    this.player.setPosition(x, y);
                    break;

                // Orbs
                case 4:
                    
                    this.orbs.push(
                        new Orb(x, y,
                            this.meshBuilder.getMesh(StageMesh.OrbBody), 
                            this.meshBuilder.getMesh(StageMesh.OrbShadow)));
                    break;

                // Ghosts
                case 25:
                case 26:
                case 27:
                case 28:

                    this.ghosts.push(
                        new Ghost(x, y,
                            this.meshBuilder.getMesh(StageMesh.GhostBody),
                            this.meshBuilder.getMesh(StageMesh.GhostShadow),
                            this.meshBuilder.getMesh(StageMesh.GhostFaceFront),
                            this.meshBuilder.getMesh(StageMesh.GhostFaceSide),
                            TURN_TIME, tid - 25));
                    break;

                default:
                    break;
                }

            }
        }
    }


    private animate(event : CoreEvent) {

        const STAR_ANIMATION_SPEED = 1.0 / 30.0;
        const STAR_SPECIAL_SCALE_SPEED = 1.0 / TURN_TIME;
        const ARROW_ANIM_SPEED = 0.025;
        const ARROW_ROTATION_SPEED = 1.0 / TURN_TIME;

        this.starGen.update(event);

        this.starAnimationTimer = (this.starAnimationTimer + STAR_ANIMATION_SPEED * event.step) % 1.0;
        if (this.specialStarScale) {

            this.specialStarScale = Math.max(0.0,
                this.specialStarScale - STAR_SPECIAL_SCALE_SPEED*event.step);
        }

        this.arrowAnimationTimer = (this.arrowAnimationTimer + ARROW_ANIM_SPEED * event.step) % 1.0;

        if (this.arrowRotationTimer > 0) {

            this.arrowRotationTimer = Math.max(0.0,
                this.arrowRotationTimer - ARROW_ROTATION_SPEED*event.step);
        }
    }


    public update(event : CoreEvent, updatePlayer = true) {

        this.animate(event);

        for (let o of this.shrinkingPlatforms) {

            o.update(this, event);
        }

        for (let o of this.movingPlatforms) {

            o.update(this.player, this, event);
        }

        for (let o of this.togglablePlatforms) {

            o.update(this, event);
        }

        for (let o of this.switchingPlatforms) {

            o.update(this.player, this, event);
        }

        for (let o of this.orbs) {

            o.update(this.player, this, event);
        }

        for (let o of this.ghosts) {

            o.update(this.player, this, event);
        }

        if (this.waiting) {

            if ((this.waitTimer -= event.step) <= 0) {

                this.waiting = false;
            }
        }

        if (updatePlayer && !this.waiting) {

            this.player.update(this, event);
        }
        else {

            this.player.animate(event);
        }
    }


    private drawButton(canvas : Canvas, x : number, y : number, meshType : StageMesh) {

        canvas.transform
            .push()
            .translate(x * TILE_WIDTH, y * TILE_HEIGHT)
            .use();

        canvas.drawMesh(this.meshBuilder.getMesh(meshType));

        canvas.transform
            .pop()
            .use();
    }


    private iterateStaticObjects(operation : (tid : number, x : number, y : number) => void) {

        let tid : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.getTile(0, x, y, -1);

                operation(tid, x, y);
            }
        }
    }


    private drawAnimatedFloor(canvas : Canvas, 
        x : number, y : number, timer : number,
        meshName : StageMesh, count : number, scale : number,
        color = new RGBA(), specialScale = 0.0) {

        let t : number;
        let baseScale = 1.0;

        let p = this.player.getPosition();
        if ((x | 0) == (p.x | 0) && (y | 0) == (p.y | 0)) {

            baseScale += specialScale;
        }

        for (let i = 0; i < count; ++ i) {

            t = ((timer + i * 1.0) / count) % 1.0;

            canvas.transform
                .push()
                .translate(x * TILE_WIDTH, y * TILE_HEIGHT)
                .scale(
                    TILE_WIDTH * baseScale * scale * t, 
                    TILE_HEIGHT * baseScale * scale * t)
                .use();

            canvas.setColor(color.r, color.g, color.b, color.a * Math.sin((1.0 - t) * Math.PI/2));

            canvas.drawMesh(this.meshBuilder.getMesh(meshName));

            canvas.transform
                .pop()
                .use();
        }
        canvas.setColor();
    }



    private drawFloorStar(canvas : Canvas, x : number, y : number) {

        const COUNT = 3;

        this.drawAnimatedFloor(canvas, x, y, 
            this.starAnimationTimer, StageMesh.FloorStar,
            COUNT, 0.49, new RGBA(1, 1, 0.33), this.specialStarScale);
    }


    private drawGiantFloorStar(canvas : Canvas, x : number, y : number) {

        const COUNT = 4;

        this.drawAnimatedFloor(canvas, x, y, 
            this.starAnimationTimer, StageMesh.FloorStar,
            COUNT, 1.99, new RGBA(0.0, 0.33, 0.67), this.specialStarScale);
    }


    private drawFloorArrow(canvas : Canvas, dir : Direction,  x : number, y : number) {

        const OFFSET = 0.20;
        const BASE_ANGLE = [3, 2, 1, 0];

        const COLOR_1 = new Vector3(0.0, 0.33, 0.67);
        const COLOR_2 = new Vector3(0.10, 0.60, 0.90);

        let angle = BASE_ANGLE[dir] * Math.PI/2 + this.arrowRotationTimer * Math.PI;

        canvas.transform
            .push()
            .translate(x * TILE_WIDTH, y * TILE_HEIGHT)
            .scale(TILE_WIDTH, TILE_HEIGHT)
            .rotate(angle)
            .use();

        let t : number;
        let col : Vector3;

        for (let i = -1; i <= 1; i += 2) {

            t = (this.arrowAnimationTimer + (i + 1.0)/2.0 * 0.5) % 1.0;            

            col = Vector3.interpolate(COLOR_1, COLOR_2, Math.sin(t * Math.PI));

            canvas.transform
                .push()
                .translate(0, i * OFFSET)
                .use();

            canvas.setColor(col.x, col.y, col.z);
            canvas.drawMesh(this.meshBuilder.getMesh(StageMesh.FlooArrow));

            canvas.transform.pop();
        }
        
        canvas.transform   
            .pop()
            .use();

        canvas.setColor();
    }


    private drawTeleportTile(canvas : Canvas, x : number, y : number) {

        const COUNT = 4;

        this.drawAnimatedFloor(canvas, x, y, 
            1.0 - this.starAnimationTimer, StageMesh.Rectangle,
            COUNT, 0.95, new RGBA(0.10, 0.15, 0.0));
    }


    private drawStaticObjectsBottom(canvas : Canvas) {

        canvas.setColor();

        this.iterateStaticObjects((tid, x, y) => {

            switch (tid) {
   
            // Button, purple
            case 12:

                this.drawButton(canvas, x, y, StageMesh.ButtonDown);
                break;

            // Floor star
            case 13:

                this.drawFloorStar(canvas, x, y);
                break;

            // Button, blue
            case 15:
                
                this.drawButton(canvas, x, y, StageMesh.BlueButtonDown);
                break;

            // Teleport
            case 16:

                this.drawTeleportTile(canvas, x, y);
                break;

            // Floor arrow
            case 17:
            case 18:
            case 19:
            case 20:

                this.drawFloorArrow(canvas, tid-17, x, y);
                break;

            // Button something
            case 24:
                
                this.drawButton(canvas, x, y, StageMesh.RotationButtonDown);
                break;

            // Giant floor star
            case 29:

                this.drawGiantFloorStar(canvas, x, y);
                break;

            default:
                break;
            }
        });
    }


    private drawStaticObjectsTop(canvas : Canvas) {

        canvas.setColor();

        this.iterateStaticObjects((tid, x, y) => {

            switch (tid) {

            // Button, purple
            case 11:

                this.drawButton(canvas, x, y, StageMesh.ButtonUp);
                break;

            // Button, blue
            case 14:

                this.drawButton(canvas, x, y, StageMesh.BlueButtonUp);
                break;

            // Button... something
            case 23:

                this.drawButton(canvas, x, y, StageMesh.RotationButtonUp);
                break;    

            default:
                break;
            }
        });
    }


    private drawStaticObjectsShadows(canvas : Canvas) {

        this.iterateStaticObjects((tid, x, y) => {

            switch (tid) {

            // Button, purple
            case 11:

                this.drawButton(canvas, x, y, StageMesh.ButtonShadow);
                break;

            // Button, blue
            case 14:

                this.drawButton(canvas, x, y, StageMesh.BlueButtonShadow);
                break;

            // Button something
            case 23:

                this.drawButton(canvas, x, y, StageMesh.RotationButtonShadow);
                break;

            default:
                break;
            }
        });
    }


    private drawShadowLayer(canvas : Canvas) {

        canvas.toggleStencilTest(true);
        canvas.clearStencilBuffer();

        canvas.setColor(0, 0, 0, 0.33);
        canvas.setStencilCondition(StencilCondition.NotEqual);

        this.terrain.drawShadows(canvas);
        for (let o of this.ghosts) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT, 1.0 - TILE_HEIGHT);
        }
        this.player.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT, 1.0 - TILE_HEIGHT);

        canvas.setColor(0, 0, 0, SHADOW_ALPHA);
        for (let o of this.togglablePlatforms) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.shrinkingPlatforms) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.movingPlatforms) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.switchingPlatforms) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
        }

        canvas.toggleStencilTest(false);
        canvas.setColor();
    }


    private drawBottomLayerObjectsBottom(canvas : Canvas) {
        
        canvas.setColor();

        for (let o of this.togglablePlatforms) {

            o.drawBottom(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.shrinkingPlatforms) {

            o.drawBottom(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.movingPlatforms) {

            o.drawBottom(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.switchingPlatforms) {

            o.drawBottom(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
    }


    private drawBottomLayerObjectsTop(canvas : Canvas) {

        canvas.setColor();

        for (let o of this.togglablePlatforms) {

            o.drawTop(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.shrinkingPlatforms) {

            o.drawTop(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.movingPlatforms) {

            o.drawTop(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.switchingPlatforms) {

            o.drawTop(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
    }


    private drawObjectShadows(canvas : Canvas) {

        canvas.setColor(0, 0, 0, SHADOW_ALPHA);

        canvas.setStencilOperation(StencilOperation.Zero);
        for (let o of this.orbs) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
        }
        for (let o of this.ghosts) {

            o.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
        }

        this.drawStaticObjectsShadows(canvas);

        canvas.setStencilOperation(StencilOperation.Keep);
        this.player.drawShadow(canvas, TILE_WIDTH, TILE_HEIGHT);
    }


    public draw(canvas : Canvas, scaleOut = 1.0, yoff = 0.0) {

        this.objectBuffer.flush();
        this.objectBuffer.addObject(this.player);
        this.objectBuffer.addObjects(this.orbs);
        this.objectBuffer.addObjects(this.ghosts);
        this.objectBuffer.sort();

        let scaleFactor = (this.height + 2.5) * TILE_HEIGHT;

        canvas.transform
            .fitGivenDimension(scaleFactor * scaleOut, canvas.width/canvas.height)
            .use();

        let view = canvas.transform.getViewport();

        canvas.transform
            .push()
            .translate(view.x/2, view.y/2 + scaleFactor * yoff)
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
        this.drawStaticObjectsBottom(canvas);

        canvas.setStencilCondition(StencilCondition.Equal);
        this.drawObjectShadows(canvas);
        canvas.setColor();

        canvas.toggleStencilTest(false);

        this.drawStaticObjectsTop(canvas);
        this.objectBuffer.draw(canvas, TILE_WIDTH, TILE_HEIGHT);

        this.starGen.draw(canvas);
    
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
        case 12:
        case 17:
        case 18:
        case 19:
        case 20:
        case 24:
            return TileType.Floor;

        case 2:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
        case 11:
        case 14:
        case 15:
        case 21:
        case 23:
            return TileType.Platform;

        case 13:
        case 16:    
        case 29:
            return TileType.JumpTile;

        default:
            return TileType.Invalid;
        }
    }


    public isBottomTileEmpty(x : number, y : number) : boolean {

        let tile = this.getTile(0, x, y, -1);

        return tile == 0; // || tile == 8;
    }


    public isUpperTileEmpty(x : number, y : number) : boolean {

        let tile = this.getTile(1, x, y, -1);

        return tile == 0; // || tile == 8;
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


    private killObjects(arr : Array<ExistingObject>) {

        for (let o of arr) {

            o.kill();
        }
    }


    private resetObjects() {

        this.killObjects(this.shrinkingPlatforms);
        this.killObjects(this.movingPlatforms);
        this.killObjects(this.orbs);
        this.killObjects(this.togglablePlatforms);
        this.killObjects(this.switchingPlatforms);
        this.killObjects(this.ghosts);

        let o : GameObject;
        let tid : number;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                // Bottom layer
                tid = this.activeLayers[0][y * this.width + x];
                switch (tid) {
                    
                case 2:
    
                    o = <GameObject> nextObject<ShrinkingPlatform> (this.shrinkingPlatforms);
                    // Should not happen
                    if (o == null)
                        break;
                    (<ShrinkingPlatform> o).recreate(x, y);

                    break;

                case 5:
                case 6:
                case 7:
                case 8:

                    o = <GameObject> nextObject<MovingPlatform> (this.movingPlatforms);
                    // Should not happen
                    if (o == null)
                        break;
                    (<MovingPlatform> o).recreate(x, y, tid - 5);
                    
                    break;

                case 9:
                case 10:

                    o = <GameObject> nextObject<TogglableTile> (this.togglablePlatforms);
                    // Should not happen
                    if (o == null)
                        break;
                    (<TogglableTile> o).recreate(x, y, tid == 9);
                    break;

                case 21:
                case 22:

                    o = <GameObject> nextObject<SwitchingPlatform> (this.switchingPlatforms);
                    // Should not happen
                    if (o == null)
                        break;
                    (<TogglableTile> o).recreate(x, y, tid == 21);
                    break;
    
                default:
                    break;
                }

                // Top layer
                tid = this.activeLayers[1][y * this.width + x];
                switch (tid) {

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

                // Ghosts
                case 25:
                case 26:
                case 27:
                case 28:

                    o = <GameObject> nextObject<Ghost> (this.ghosts);
                    // Should not happen
                    if (o == null)
                        break;
                    (<Ghost> o).recreate(x, y, tid - 25);
                    
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


    public recomputeOrbs() {

        this.orbsLeft = 0;
        for (let a of this.activeLayers[1]) {

            if (a == 4) {

                ++ this.orbsLeft;
            }
        }
    }


    public spawnStars(x : number, y : number, count : number) {

        const GRAVITY = 0.005;
        const BASE_SPEED = 0.075;
        const JUMP_SPEED = -0.060;
        const TIME = 30;
        const SCALE = 1.0;

        x *= TILE_WIDTH;
        y *= TILE_HEIGHT;

        this.starGen.createStars(count, 
            x, y, BASE_SPEED, JUMP_SPEED,
            GRAVITY, TIME, SCALE);
    }


    public checkUnderlyingTiles(x : number, y : number, event : CoreEvent) : UnderlyingEffectType {

        const BUTTON_VOL = 0.65;

        switch (this.getTile(0, x, y)) {
            
        // Button pressed, purple
        case 11:

            replaceInArray(this.activeLayers[0], 12, 11);
            this.setTile(0, x, y, 12);
            swapItemsInArray(this.activeLayers[0], 9, 10);

            for (let o of this.togglablePlatforms) {

                o.toggle();
            }

            this.waiting = true;
            this.waitTimer = TURN_TIME;

            event.audio.playSample(event.assets.getSample("button"), BUTTON_VOL);   

            return UnderlyingEffectType.Button;

        case 13:
            
            // To avoid certain bugs
            this.player.stopMoving();
            for (let o of this.orbs) {

                o.update(this.player, this, event);
            }

            this.specialStarScale = 1.0;

            return UnderlyingEffectType.JumpTile;

        // Button pressed, purple
        case 14:

            replaceInArray(this.activeLayers[0], 15, 14);
            this.setTile(0, x, y, 15);

            swapItemsInArray(this.activeLayers[0], 17, 19);
            swapItemsInArray(this.activeLayers[0], 18, 20);

            this.waiting = true;
            this.waitTimer = TURN_TIME;
            this.arrowRotationTimer = 1.0;

            event.audio.playSample(event.assets.getSample("button"), BUTTON_VOL);   

            return UnderlyingEffectType.Button;

        // Teleport
        case 16:

            return UnderlyingEffectType.Teleport;

        case 17:
        case 18:
        case 19:
        case 20:

            // For the same reason as above
            this.player.stopMoving();
            for (let o of this.orbs) {

                o.update(this.player, this, event);
            }
            break;

        // Button pressed, the third color
        case 23:

            replaceInArray(this.activeLayers[0], 24, 23);
            this.setTile(0, x, y, 24);

            this.waiting = true;
            this.waitTimer = TURN_TIME;

            for (let o of this.movingPlatforms) {

                o.rotate(this, 5);
            }

            event.audio.playSample(event.assets.getSample("button"), BUTTON_VOL);   

            return UnderlyingEffectType.Button;

        default:
            break;
        }

        return UnderlyingEffectType.None;
    }


    public popState() {

        if (this.stateBufferLength == 0) return;

        -- this.stateBufferLength;
        this.stateBufferPointer = negMod(
            this.stateBufferPointer - 1, 
            this.stateBuffer.length);
    }


    public isCleared() : boolean {

        return this.orbs.length > 0 && this.orbsLeft == 0;
    }


    public stopPlayerAnimation() {

        this.player.stopAnimation();
    }


    public checkAutomaticMovement(x : number, y : number) : Direction {

        let tid = this.getTile(0, x, y);
        if (tid >= 17 && tid <= 21) {

            return tid - 17;
        }
        return Direction.None;
    }


    public findCorrespondingTeleportTile(sx : number, sy :  number) : Vector2 {

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                if (sx == x && sy == y) continue;

                if (this.getTile(0, x, y) == 16)
                    return new Vector2(x, y);
            }
        }
        return null;
    }


    public canMoveToUpperTile(x : number, y : number) : boolean {
        
        return (this.getTile(1, x, y) < 25 || this.getTile(1, x, y) > 28);
    }


    public getIndex = () : number => this.stageIndex;
}
