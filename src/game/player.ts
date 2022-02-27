import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Vector2, RGBA } from "../core/vector.js";
import { ShapeGenerator } from "./shapegenerator.js";
import { Stage } from "./stage.js";


export const updateSpeedAxis = (speed : number, target : number, step : number) : number => {
		
    if (speed < target) {
        
        return Math.min(target, speed+step);
    }
    return Math.max(target, speed-step);
}


export class Player {


    private pos : Vector2;
    private target : Vector2;
    private renderPos : Vector2;

    private moving : boolean;
    private moveTimer : number;
    private readonly moveTime : number;

    private meshBody : Mesh;
    private meshFaceStatic : Mesh;
    private meshEye : Mesh;
    private meshLeg : Mesh;
    private meshArm : Mesh;

    private eyePos : Vector2;
    private eyeTarget : Vector2;

    private bodyAngle : number;


    constructor(x : number, y : number, moveTime : number, event : CoreEvent) {

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.moveTime = moveTime;
        this.moving = false;

        this.generateMeshes(event);

        this.eyePos = new Vector2();
        this.eyeTarget = new Vector2();

        this.bodyAngle = 0.0;
    }


    private generateBody(event : CoreEvent) {

        const CORNER_QUALITY = 16;
        const OUTLINE_WIDTH = 0.025;

        const WIDTH = 1.0;
        const HEIGHT = 0.75;
        
        this.meshBody = (new ShapeGenerator())      
            // Hat, back
            .addSector(Math.PI, Math.PI*2, 16, new RGBA(0), 0.35, -0.25, 0.33, -0.10, Math.PI/5)
            // Box
            .addRoundedRectangle(
                -WIDTH/2, -HEIGHT/2, 
                WIDTH, HEIGHT, 
                0.1, CORNER_QUALITY, 
                new RGBA(0))
            .addRoundedRectangle(
                -WIDTH/2 + OUTLINE_WIDTH, 
                -HEIGHT/2 + OUTLINE_WIDTH, 
                WIDTH - OUTLINE_WIDTH*2, 
                HEIGHT - OUTLINE_WIDTH*2, 
                0.1, CORNER_QUALITY, 
                new RGBA(0.65))
            .addRoundedRectangle(
                -WIDTH/2 + OUTLINE_WIDTH + 0.025, 
                -HEIGHT/2 + OUTLINE_WIDTH + 0.025, 
                WIDTH - OUTLINE_WIDTH*2 - 0.1, 
                HEIGHT - OUTLINE_WIDTH*2 - 0.1, 
                0.1, CORNER_QUALITY, 
                new RGBA(0.85))
            // Hat, front
            .addSector(0, Math.PI, 16, new RGBA(0), 0.35, -0.25, 0.33, -0.10, Math.PI/5)
            .addSector(0, Math.PI, 16, new RGBA(0), 0.35, -0.25, 0.225, -0.30, Math.PI/5)
            .addEllipse(0.375, -0.425, 0.15, 0.10, 16, new RGBA(1.0))
            .constructMesh(event);
    }


    private generateFace(event : CoreEvent) {

        const NOSE_WIDTH = 0.40;
        const NOSE_HEIGHT = 0.25;
        const NOSE_QUALITY = 32;
        const NOSE_OUTLINE = 0.025;
        const NOSE_Y = 0.125;

        const EYE_Y = -0.05;
        const EYE_DIAMETER_OUTER = 0.440;
        const EYE_DIAMETER_INNER = 0.380;

        let ratio = NOSE_HEIGHT / NOSE_WIDTH;

        this.meshFaceStatic = (new ShapeGenerator())
            .addEllipse(-0.175, EYE_Y, 
                EYE_DIAMETER_OUTER, 
                EYE_DIAMETER_OUTER, 
                32, new RGBA(0, 0, 0))
            .addEllipse(0.175, EYE_Y, 
                EYE_DIAMETER_OUTER, 
                EYE_DIAMETER_OUTER, 
                32, new RGBA(0, 0, 0))
            .addEllipse(-0.175, EYE_Y, 
                EYE_DIAMETER_INNER, 
                EYE_DIAMETER_INNER, 
                32, new RGBA(0.75, 0.75, 0.75))
            .addEllipse(0.175, EYE_Y, 
                EYE_DIAMETER_INNER, 
                EYE_DIAMETER_INNER, 
                32, new RGBA(0.75, 0.75, 0.75))
            .addEllipse(-0.165, EYE_Y-0.01, 
                EYE_DIAMETER_INNER-0.033, 
                EYE_DIAMETER_INNER-0.033, 
                32, new RGBA())
            .addEllipse(0.165, EYE_Y-0.01, 
                EYE_DIAMETER_INNER-0.033, 
                EYE_DIAMETER_INNER-0.033, 
                32, new RGBA())
            .addEllipse(0, NOSE_Y, 
                NOSE_WIDTH, NOSE_HEIGHT, 
                NOSE_QUALITY, 
                new RGBA(0, 0, 0))
            .addEllipse(0, NOSE_Y, 
                NOSE_WIDTH - NOSE_OUTLINE*2, 
                NOSE_HEIGHT - NOSE_OUTLINE*2, 
                NOSE_QUALITY, 
                new RGBA(0.45))
            .addEllipse(0 - 0.025, NOSE_Y - 0.025*ratio, 
                NOSE_WIDTH - NOSE_OUTLINE*2 - 0.1, 
                NOSE_HEIGHT - NOSE_OUTLINE*2 - 0.1*ratio, 
                NOSE_QUALITY, 
                new RGBA(0.75))
            .constructMesh(event);

        // TODO: Get rid of most numeric constants?
        this.meshEye = (new ShapeGenerator())
            .addEllipse(0, 0, 0.125, 0.20, 16, new RGBA(0, 0, 0))
            .addEllipse(-0.010, -0.020, 0.125/2, 0.10, 16, new RGBA())
            .constructMesh(event);
    }


    private generateLimbs(event : CoreEvent) {

        this.meshLeg = (new ShapeGenerator())
            .addTriangle(
                new Vector2(-0.15, 0.0),
                new Vector2(0, 0.25),
                new Vector2(0.15, 0), new RGBA(0))
            .addSector(0, Math.PI, 16, new RGBA(0), 0, 0, 0.15, -0.15)
            .addTriangle(
                new Vector2(-0.125, 0.0),
                new Vector2(0, 0.20),
                new Vector2(0.125, 0), new RGBA(0.40))
            .addSector(0, Math.PI, 16, new RGBA(0.40), 0, 0, 0.125, -0.125)
            .addTriangle(
                new Vector2(-0.11, 0.0),
                new Vector2(-0.01, 0.15),
                new Vector2(0.09, 0), new RGBA(0.65))
            .addSector(0, Math.PI, 16, new RGBA(0.65), -0.01, 0, 0.10, -0.10)
            .constructMesh(event);
    }


    private generateMeshes(event : CoreEvent) {

        this.generateBody(event);
        this.generateFace(event);
        this.generateLimbs(event);
    }


    private animate(event : CoreEvent) {

        const EYE_MOVE_SPEED = 0.10;
        const BODY_ANGLE_SPEED = 0.15;
        const EPS = 0.01;

        this.bodyAngle = (this.bodyAngle += BODY_ANGLE_SPEED * event.step) % (Math.PI*2);

        this.eyeTarget = event.input.getStick();
        if (Vector2.distance(this.eyePos, this.eyeTarget) < EPS) {

            this.eyePos = this.eyeTarget.clone();
            return;
        }

        let dir = Vector2.direction(this.eyePos, this.eyeTarget);
        this.eyePos.x += dir.x * EYE_MOVE_SPEED * event.step;
        this.eyePos.y += dir.y * EYE_MOVE_SPEED * event.step;

        this.eyePos = Vector2.cap(this.eyePos, 1.0, EPS); 
    }


    public update(stage : Stage, event : CoreEvent) {

        this.animate(event);
    }


    public draw(canvas : Canvas) {

        const LEG_OFFSET_X = 0.25;
        const LEG_OFFSET_Y = 0.35;
        const LEG_MOVE_FACTOR = 0.1;

        const EYE_RADIUS_X = 0.075;
        const EYE_RADIUS_Y = 0.05;

        const BODY_ROTATION_FACTOR = Math.PI/12;

        let rotation = Math.sin(this.bodyAngle) * BODY_ROTATION_FACTOR;
        let legOff : number;
        let legAngle : number;

        // Legs
        for (let i = -1; i <= 1; i += 2) {

            legOff = 0.0;
            legAngle = 0.0;

            if (this.bodyAngle >= (i+1)/2.0 * Math.PI &&
                this.bodyAngle < (i+3)/2.0 * Math.PI) {

                legOff = -Math.abs(Math.sin(this.bodyAngle % Math.PI)) * LEG_MOVE_FACTOR;
                legAngle = -i * Math.sin(this.bodyAngle % Math.PI) * BODY_ROTATION_FACTOR;
            }

            canvas.transform
                .push()
                .translate(i * LEG_OFFSET_X, LEG_OFFSET_Y + legOff)
                .rotate(legAngle)
                .use();

            canvas.drawMesh(this.meshLeg);

            canvas.transform.pop();
        }

        canvas.transform.push()
            .translate(this.renderPos.x, this.renderPos.y)
            .rotate(rotation)
            .use();

        canvas.drawMesh(this.meshBody);
        canvas.drawMesh(this.meshFaceStatic);

        // Eyes
        for (let i = -1; i <= 1; i += 2) {

            canvas.transform
                .push()
                .translate(
                    this.eyePos.x*EYE_RADIUS_X + -i * 0.20, 
                    this.eyePos.y*EYE_RADIUS_Y + -0.05)
                .use();

            canvas.drawMesh(this.meshEye);

            canvas.transform.pop();
        }

        canvas.transform.pop();
    }

}
