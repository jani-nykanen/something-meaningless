import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Vector2, RGBA } from "../core/vector.js";
import { PlayerAnimator } from "./animator.js";
import { GameObject } from "./gameobject.js";
import { ShapeGenerator } from "./shapegenerator.js";
import { Stage, TileType } from "./stage.js";


export class Player extends GameObject {


    private target : Vector2;
    private renderPos : Vector2;

    private moving : boolean;
    private moveTimer : number;
    private moveTime :number;
    private readonly baseMoveTime : number;

    private animator : PlayerAnimator;
    private shadow : Mesh; 

    private bodyAngle : number;
    private rotationPhase : 0 | 1;

    private jumping : boolean;
    private jumpHeight : number;


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


    private control(stage : Stage, event : CoreEvent) {

        const MOVE_EPS = 0.5;

        if (this.moving) return;

        let stick = event.input.getStick();
        if (stick.length() < MOVE_EPS)
            return;

        let px = this.pos.x | 0;
        let py = this.pos.y | 0;

        let dirx = 0;
        let diry = 0;

        if (Math.abs(stick.x) > Math.abs(stick.y)) {

            dirx = Math.sign(stick.x) | 0;           
        }
        else {

            diry = Math.sign(stick.y) | 0;
        }

        let tileType : number;
        let moveTimeFactor = 1;
        if (dirx != 0 || diry != 0) {

            this.jumping = false;
            this.jumpHeight = 1.0;

            // Check if free
            tileType = stage.getBottomTileType(px + dirx, py + diry);
            if (tileType == TileType.Invalid) {

                // Check if can jump
                dirx *= 2;
                diry *= 2;

                if (stage.getBottomTileType(px + dirx, py + diry) == TileType.Invalid) {

                    return;
                }

                this.jumping = true;
                this.jumpHeight = 2.0;
                moveTimeFactor = 2;

                if (this.rotationPhase == 0) {

                    this.rotationPhase = 1;
                }
            }

            this.jumping = this.jumping || tileType == TileType.Platform ||
                stage.getBottomTileType(px, py) == TileType.Platform;

            this.target = Vector2.add(this.pos, new Vector2(dirx, diry));

            this.target.x |= 0;
            this.target.y |= 0;

            this.moving = true;
            this.moveTime = this.baseMoveTime * moveTimeFactor;

            this.moveTimer = this.moveTime;

            // Store state before updating tiles
            stage.storeState();

            stage.setTile(1, px, py, 0);
            // TODO: Check if needs to update after movement animation stops?
            stage.setTile(1, px + dirx, py + diry, 3);
        }
    }


    private move(event : CoreEvent) {

        if (!this.moving) return;

        if ((this.moveTimer -= event.step) <= 0) {

            this.moving = false;
            this.pos = this.target.clone();
            this.renderPos = this.pos.clone();

            this.rotationPhase = this.rotationPhase == 1 ? 0 : 1;

            return;
        }

        let t = 1.0 - this.moveTimer / this.moveTime;
        this.renderPos = Vector2.interpolate(this.pos, this.target, t);
    }


    private animate(event : CoreEvent) {

        let bodyRotationSpeed = Math.PI / this.moveTime;

        if (!this.moving) {

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
        this.move(event);
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
        canvas.setColor();

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

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.moving = false;

        this.bodyAngle = 0.0;
        this.rotationPhase = 0;
    }

}
