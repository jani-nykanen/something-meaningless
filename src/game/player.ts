import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Vector2, RGBA } from "../core/vector.js";
import { PlayerAnimator } from "./animator.js";
import { MovingObject } from "./gameobject.js";
import { ShapeGenerator } from "./shapegenerator.js";
import { Stage, TileType, UnderlyingEffectType } from "./stage.js";
import { Direction } from "./types.js";


export class Player extends MovingObject {


    private readonly baseMoveTime : number;

    private animator : PlayerAnimator;
    private shadow : Mesh; 

    private bodyAngle : number;
    private rotationPhase : 0 | 1;

    private jumping : boolean;
    private jumpHeight : number;

    private moveDir : Vector2;
    private automaticMovement : boolean;


    constructor(x : number, y : number, moveTime : number, event : CoreEvent) {

        super(x, y, true);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.baseMoveTime = moveTime;
        this.moveTime = this.baseMoveTime;
        this.moving = false;

        this.animator = new PlayerAnimator(event);
        this.shadow = (new ShapeGenerator())
            .addEllipse(0, 0, 1.0, 1.0, 32, new RGBA(0))
            .constructMesh(event);

        this.bodyAngle = 0.0;
        this.rotationPhase = 0;
    
        this.jumping = false;
        this.jumpHeight = 1.0;

        this.moveDir = new Vector2();
        this.automaticMovement = false;
    }

    
    public recreate(x: number, y: number) {
        
        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.moveTime = this.baseMoveTime;
        this.moving = false;

        this.bodyAngle = 0.0;
        this.rotationPhase = 0;
    
        this.jumping = false;
        this.jumpHeight = 1.0;
    }


    private jump() {

        this.jumping = true;
        this.jumpHeight = 2.0;

        if (this.rotationPhase == 0) {

            this.rotationPhase = 1;
        }
    }


    private moveTo(dirx : number, diry : number, 
        stage : Stage, event : CoreEvent, 
        forceJump = false, doNotStoreState = false) {

        let px = this.pos.x | 0;
        let py = this.pos.y | 0;

        this.jumping = false;
        this.jumpHeight = 1.0;

        let moveTimeFactor = 1.0;

        // Check if free
        let tileType = stage.getBottomTileType(px + dirx, py + diry);
        if (tileType == TileType.Invalid) {

            // Check if can jump
            dirx *= 2;
            diry *= 2;

            if (stage.getBottomTileType(px + dirx, py + diry) == TileType.Invalid) {

                return;
            }

            this.jump();
            moveTimeFactor = 2;
        }
        else if (forceJump) {

            dirx *= 2;
            diry *= 2;

            if (stage.getBottomTileType(px + dirx, py + diry) != TileType.Invalid) {

                this.jump();
                moveTimeFactor = 2;
            }
            else {

                dirx /= 2;
                diry /= 2;

                dirx |= 0;
                diry |= 0;
            }
        }

        this.jumping = forceJump ||
            this.jumping || 
            tileType == TileType.Platform ||
            tileType == TileType.JumpTile ||
            stage.getBottomTileType(px, py) == TileType.Platform;

        this.target = Vector2.add(this.pos, new Vector2(dirx, diry));

        this.target.x |= 0;
        this.target.y |= 0;

        this.moving = true;
        this.moveTime = this.baseMoveTime * moveTimeFactor;

        this.moveTimer = this.moveTime;

        // To avoid cases where the player is standing on a "jump tile"
        if (!doNotStoreState) {

            // Store state before updating tiles
            stage.storeState();
        }

        stage.setTile(1, px, py, 0);
        // TODO: Check if needs to update after movement animation stops?
        stage.setTile(1, px + dirx, py + diry, 3);

        this.moveDir = (new Vector2(dirx, diry)).normalize();
    }


    private control(stage : Stage, event : CoreEvent) {

        const MOVE_EPS = 0.5;

        if (this.moving) return;

        let stick = event.input.getStick();

        let dirx = 0;
        let diry = 0;

        if (stick.length() < MOVE_EPS)
            return;

        if (Math.abs(stick.x) > Math.abs(stick.y)) {

            dirx = Math.sign(stick.x) | 0;           
        }
        else {

            diry = Math.sign(stick.y) | 0;
        }
        
        if (dirx != 0 || diry != 0) {

            this.automaticMovement = false;
            this.moveTo(dirx, diry, stage, event);
        }
    }


    private checkAutomaticMovement(stage : Stage, event : CoreEvent) {

        const DIR_X = [1, 0, -1, 0];
        const DIR_Y = [0, -1, 0, 1];

        let dirx = 0;
        let diry = 0;

        let automaticDir = stage.checkAutomaticMovement(this.pos.x | 0, this.pos.y | 0);
        if (automaticDir != Direction.None) {

            dirx = DIR_X[automaticDir];
            diry = DIR_Y[automaticDir];

            if (dirx != 0 || diry != 0) {

                this.moveTo(dirx, diry, stage, event, false, true);
                if (this.moving)
                    this.automaticMovement = true;
            }
        }
    }


    protected stopMovementEvent(stage : Stage, event : CoreEvent) {
        
        let effect = stage.checkUnderlyingTiles(this.pos.x | 0, this.pos.y | 0, event);
        
        switch (effect) {

        case UnderlyingEffectType.JumpTile:

            this.automaticMovement = false;
            this.moveTo(this.moveDir.x, this.moveDir.y, stage, event, true, true);
            break;

        default:
            break;
        }

        this.rotationPhase = this.rotationPhase == 1 ? 0 : 1;

        if (!this.moving) {

            this.checkAutomaticMovement(stage, event);
        }
    }


    public animate(event : CoreEvent) {

        let bodyRotationSpeed = Math.PI / this.moveTime;

        if (!this.moving || (this.automaticMovement && !this.jumping)) {

            this.animator.setEyeTarget(new Vector2());
            this.bodyAngle = 0;
            this.animator.animateWalkingCycle(0);

            this.animator.update(event);

            return;
        }

        let angleStart = this.rotationPhase * Math.PI;

        if (this.jumping) {

            this.animator.animateJumping(1.0 - this.moveTimer/this.moveTime);
        }   
        else {

            this.bodyAngle = (this.bodyAngle += bodyRotationSpeed * event.step) % Math.PI;
            this.animator.animateWalkingCycle(angleStart + this.bodyAngle);
        }
        this.animator.setEyeTarget(Vector2.direction(this.pos, this.target));
        this.animator.update(event);
    }


    public update(stage : Stage, event : CoreEvent) {

        this.control(stage, event);
        this.move(stage, event);
        this.animate(event);
    }


    private computeScale(tileWidth : number, tileHeight : number) : number {

        return Math.max(tileWidth, tileHeight);
    }


    public drawShadow(canvas : Canvas, tileWidth : number, tileHeight : number, offset = 0 ) {

        const SHADOW_SCALE_FACTOR = 0.80;
        const BASE_OFFSET_Y = 0.0;
        const SCALE_Y_FACTOR = 0.50;
        
        let ratio = tileHeight / tileWidth;
        let scale = this.computeScale(tileWidth, tileHeight) * SHADOW_SCALE_FACTOR;

        canvas.transform
            .push()
            .translate(
                this.renderPos.x * tileWidth, 
                this.renderPos.y * tileHeight + BASE_OFFSET_Y + offset)
            .scale(scale, scale * SCALE_Y_FACTOR * ratio)
            .use();

        canvas.drawMesh(this.shadow);
        canvas.transform
            .pop()
            .use();
    }


    private computeJumpHeight() {

        const BASE_HEIGHT = 0.20;

        if (!this.jumping)
            return 0.0;

        let t = -0.5 + (1.0 - this.moveTimer / this.moveTime);

        return -Math.cos(t * Math.PI) * BASE_HEIGHT * this.jumpHeight;
    }


    public draw(canvas : Canvas, tileWidth : number, tileHeight : number) {

        const OFFSET_Y = -0.50;
        const FIGURE_SCALE_FACTOR = 0.90;

        let scale = this.computeScale(tileWidth, tileHeight) * FIGURE_SCALE_FACTOR;

        canvas.transform
            .push()
            .translate(
                this.renderPos.x * tileWidth, 
                this.renderPos.y * tileHeight + OFFSET_Y + this.computeJumpHeight())
            .scale(scale, scale)
            .use();

        this.animator.draw(canvas);

        canvas.transform.pop();
    }


    public setPosition(x : number, y : number, reset = true) {

        if (reset) {

            this.recreate(x, y);
            return;
        }

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.moving = false;

        this.bodyAngle = 0.0;
        this.rotationPhase = 0;
    }


    public depth() : number {
        
        return this.renderPos.y;
    } 


    public isMoving = () : boolean => this.moving;


    public stopAnimation() {

        this.moving = false;
    }


    public stopMoving() {

        this.moving = false;
    }
}
