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

    private bodyAngle : number;


    constructor(x : number, y : number, moveTime : number, event : CoreEvent) {

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.moveTime = moveTime;
        this.moving = false;

        this.animator = new PlayerAnimator(event);

        this.bodyAngle = 0.0;
    }


    private animate(event : CoreEvent) {

        const BODY_ROTATION_SPEED = 0.15;

        this.bodyAngle = (this.bodyAngle += BODY_ROTATION_SPEED * event.step) % (Math.PI*2);
        this.animator.setBodyAngle(this.bodyAngle);

        let eyeTarget = event.input.getStick();
        this.animator.setEyeTarget(eyeTarget);

        this.animator.update(event);
    }


    public update(stage : Stage, event : CoreEvent) {

        this.animate(event);
    }


    public draw(canvas : Canvas) {

        canvas.transform
            .push()
            .translate(this.renderPos.x, this.renderPos.y)
            .use();

        this.animator.draw(canvas);

        canvas.transform.pop();
    }

}
