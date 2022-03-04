import { Canvas } from "../core/canvas";
import { CoreEvent } from "../core/core";
import { Mesh } from "../core/mesh.js";
import { RGBA, Vector2 } from "../core/vector.js";
import { ShapeGenerator } from "./shapegenerator.js";


const BODY_ROTATION_FACTOR = Math.PI/12;


export class PlayerAnimator {


    private meshBody : Mesh;
    private meshFaceStatic : Mesh;
    private meshEye : Mesh;
    private meshLeg : Mesh;
    private meshArm : Mesh;

    private eyePos : Vector2;
    private eyeTarget : Vector2;
    private bodyAngle : number;


    constructor(event : CoreEvent) {

        this.generateMeshes(event);

        this.eyePos = new Vector2();
        this.eyeTarget = new Vector2();
        this.bodyAngle = 0.0;
    }


    private generateBody(event : CoreEvent) {

        const CORNER_QUALITY = 16;
        const OUTLINE_WIDTH = 0.030;

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
                new RGBA(0.80, 0.60, 0.1))
            .addRoundedRectangle(
                -WIDTH/2 + OUTLINE_WIDTH + 0.025, 
                -HEIGHT/2 + OUTLINE_WIDTH + 0.025, 
                WIDTH - OUTLINE_WIDTH*2 - 0.1, 
                HEIGHT - OUTLINE_WIDTH*2 - 0.1, 
                0.1, CORNER_QUALITY, 
                new RGBA(1.0, 0.90, 0.50))
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
        const NOSE_OUTLINE = 0.033;
        const NOSE_Y = 0.125;

        const EYE_Y = -0.05;
        const EYE_DIAMETER_OUTER = 0.450;
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
                new RGBA(0.75, 0.25, 0))
            .addEllipse(0 - 0.025, NOSE_Y - 0.025*ratio, 
                NOSE_WIDTH - NOSE_OUTLINE*2 - 0.1, 
                NOSE_HEIGHT - NOSE_OUTLINE*2 - 0.1*ratio, 
                NOSE_QUALITY, 
                new RGBA(1.0, 0.50, 0.2))
            .constructMesh(event);

        // TODO: Get rid of most numeric constants?
        this.meshEye = (new ShapeGenerator())
            .addEllipse(0, 0, 0.125, 0.20, 16, new RGBA(0, 0, 0))
            .addEllipse(-0.010, -0.020, 0.125/2, 0.10, 16, new RGBA())
            .constructMesh(event);
    }


    private generateLimbs(event : CoreEvent) {

        const ARM_COLOR_1 = new RGBA(1.0, 0.90, 0.50);
        const ARM_COLOR_2 = new RGBA(0.80, 0.60, 0.10)

        const ARM_RADIUS_1 = 0.090;
        const ARM_RADIUS_2 = 0.120;
        const ARM_RADIUS_3 = 0.160;


        this.meshLeg = (new ShapeGenerator())
            .addTriangle(
                new Vector2(-0.175, 0.0),
                new Vector2(0, 0.25),
                new Vector2(0.175, 0), new RGBA(0))
            .addSector(0, Math.PI, 16, new RGBA(0), 0, 0, 0.15, -0.15)
            .addTriangle(
                new Vector2(-0.133, 0.0),
                new Vector2(0, 0.20),
                new Vector2(0.133, 0), new RGBA(0.67, 0.33, 0.0))
            .addSector(0, Math.PI, 16, new RGBA(0.67, 0.33, 0.0), 0, 0, 0.125, -0.125)
            .addTriangle(
                new Vector2(-0.11, 0.0),
                new Vector2(-0.01, 0.15),
                new Vector2(0.09, 0), new RGBA(0.90, 0.55, 0))
            .addSector(0, Math.PI, 16, new RGBA(0.90, 0.55, 0), -0.01, 0, 0.10, -0.10)
            .constructMesh(event);

        this.meshArm =(new ShapeGenerator())
            .addSector(-Math.PI/2, Math.PI/2, 16, new RGBA(0), 0, 0, ARM_RADIUS_3, ARM_RADIUS_3)
            .addTriangle(
                new Vector2(0, -ARM_RADIUS_3),
                new Vector2(-0.30, 0.0),
                new Vector2(0, ARM_RADIUS_3),
                new RGBA(0))
            .addSector(-Math.PI/2, Math.PI/2, 16, ARM_COLOR_2, 0, 0, ARM_RADIUS_2, ARM_RADIUS_2)
            .addTriangle(
                new Vector2(0, -ARM_RADIUS_2),
                new Vector2(-0.25, 0.0),
                new Vector2(0, ARM_RADIUS_2),
                ARM_COLOR_2)
            .addSector(-Math.PI/2, Math.PI/2, 16, ARM_COLOR_1, 0, 0.0, 0.10, ARM_RADIUS_1)
            .addTriangle(
                new Vector2(0, -ARM_RADIUS_1),
                new Vector2(-0.20, 0.0),
                new Vector2(0, ARM_RADIUS_1),
                ARM_COLOR_1)
            .constructMesh(event);
    }


    private generateMeshes(event : CoreEvent) {

        this.generateBody(event);
        this.generateFace(event);
        this.generateLimbs(event);
    }


    public setBodyAngle(angle : number) {
        
        this.bodyAngle = angle;
    }


    public setEyeTarget(target : Vector2) {

        this.eyeTarget = target.clone();
    }


    private animateEyes(event : CoreEvent) {

        const EYE_MOVE_SPEED = 0.10;
        const EPS = 0.01;
 
        if (Vector2.distance(this.eyePos, this.eyeTarget) < EPS) {

            this.eyePos = this.eyeTarget.clone();
            return;
        }

        let dir = Vector2.direction(this.eyePos, this.eyeTarget);
        this.eyePos.x += dir.x * EYE_MOVE_SPEED * event.step;
        this.eyePos.y += dir.y * EYE_MOVE_SPEED * event.step;

        this.eyePos = Vector2.cap(this.eyePos, 1.0, EPS); 
    }


    public update(event : CoreEvent) {

        this.animateEyes(event);
    }


    private drawLegs(canvas : Canvas, rotation : number) {

        const LEG_OFFSET_X = 0.225;
        const LEG_OFFSET_Y = 0.35;
        const LEG_MOVE_FACTOR = 0.15;

        let legOff : number;
        let legAngle : number;

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
    }


    private drawArms(canvas : Canvas) {

        const ARM_ROTATION_FACTOR = Math.PI/5;
        const ARM_ROTATION_START = Math.PI/4;

        const ARM_OFFSET_X = 0.425;
        const ARM_OFFSET_Y = 0.075;

        for (let i = -1; i <= 1; i += 2) {

            canvas.transform.push()
                .translate(ARM_OFFSET_X*i, ARM_OFFSET_Y)
                .rotate(i * Math.sin(ARM_ROTATION_START + this.bodyAngle*2) * ARM_ROTATION_FACTOR)
                .scale(-i, 1)
                .use();

            canvas.drawMesh(this.meshArm);

            canvas.transform.pop();
        }
        canvas.transform.use();
    }


    private drawBody(canvas : Canvas) {

        const EYE_RADIUS_X = 0.075;
        const EYE_RADIUS_Y = 0.05;

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
    }


    public draw(canvas : Canvas) {

        let rotation = Math.sin(this.bodyAngle) * BODY_ROTATION_FACTOR;

        this.drawLegs(canvas, rotation);

        canvas.transform.push()
            .rotate(rotation)
            .use();

        this.drawArms(canvas);
        this.drawBody(canvas);

        canvas.transform.pop();
    }
}
