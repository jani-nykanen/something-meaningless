import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Vector2, RGBA } from "../core/vector.js";
import { PlayerAnimator } from "./animator.js";
import { ShapeGenerator } from "./shapegenerator.js";
import { Stage } from "./stage.js";


export class Player {


    private pos : Vector2;
    private target : Vector2;
    private renderPos : Vector2;

    private moving : boolean;
    private moveTimer : number;
    private readonly moveTime : number;

    private animator : PlayerAnimator;
    private shadow : Mesh; 

    private bodyAngle : number;
    private rotationPhase : 0 | 1;


    constructor(x : number, y : number, moveTime : number, event : CoreEvent) {

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.moveTime = moveTime;
        this.moving = false;

        this.animator = new PlayerAnimator(event);
        this.shadow = (new ShapeGenerator())
            .addEllipse(0, 0, 1.0, 1.0, 32, new RGBA(0))
            .constructMesh(event);

        this.bodyAngle = 0.0;
        this.rotationPhase = 0;
    }


    private control(event : CoreEvent) {

        const MOVE_EPS = 0.5;

        if (this.moving) return;

        let stick = event.input.getStick();
        if (stick.length() < MOVE_EPS)
            return;

        let dirx = 0;
        let diry = 0;

        if (Math.abs(stick.x) > Math.abs(stick.y)) {

            dirx = Math.sign(stick.x) | 0;           
        }
        else {

            diry = Math.sign(stick.y) | 0;
        }

        if (dirx != 0 || diry != 0) {

            this.target = Vector2.add(this.pos, new Vector2(dirx, diry));

            this.target.x |= 0;
            this.target.y |= 0;

            this.moving = true;
            this.moveTimer = this.moveTime;
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
            this.animator.setBodyAngle(0);

            this.animator.update(event);

            return;
        }

        let angleStart = this.rotationPhase * Math.PI;

        this.bodyAngle = (this.bodyAngle += bodyRotationSpeed * event.step) % Math.PI;

        this.animator.setBodyAngle(angleStart + this.bodyAngle);
        this.animator.setEyeTarget(Vector2.direction(this.pos, this.target));
        this.animator.update(event);
    }


    public update(stage : Stage, event : CoreEvent) {

        this.control(event);
        this.move(event);
        this.animate(event);
    }


    private computeScale(tileWidth : number, tileHeight : number) : number {

        return Math.max(tileWidth, tileHeight);
    }


    public drawShadow(canvas : Canvas, tileWidth : number, tileHeight : number, offset = 0) {

        const SHADOW_SCALE_FACTOR = 0.80;
        const BASE_OFFSET_Y = 0.0;
        const ALPHA = 0.33;
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

        canvas.setColor(0, 0, 0, ALPHA);
        canvas.drawMesh(this.shadow);
        canvas.setColor();

        canvas.transform
            .pop()
            .use();
    }


    public draw(canvas : Canvas, tileWidth : number, tileHeight : number) {

        const OFFSET_Y = -0.50;
        const FIGURE_SCALE_FACTOR = 0.90;

        let scale = this.computeScale(tileWidth, tileHeight) * FIGURE_SCALE_FACTOR;

        canvas.transform
            .push()
            .translate(this.renderPos.x * tileWidth, 
                this.renderPos.y * tileHeight + OFFSET_Y)
            .scale(scale, scale)
            .use();

        this.animator.draw(canvas);

        canvas.transform.pop();
    }

}
