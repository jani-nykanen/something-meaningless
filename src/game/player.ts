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

    private eyePos : Vector2;
    private eyeTarget : Vector2;


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
    }


    private generateBody(event : CoreEvent) {

        const CORNER_QUALITY = 16;
        const OUTLINE_WIDTH = 0.025;

        const WIDTH = 1.0;
        const HEIGHT = 0.75;
        
        this.meshBody = (new ShapeGenerator())  
            .addRoundedRectangle(
                -WIDTH/2, -HEIGHT/2, 
                WIDTH, HEIGHT, 
                0.1, CORNER_QUALITY, 
                new RGBA(0, 0, 0))
            .addRoundedRectangle(
                -WIDTH/2 + OUTLINE_WIDTH, 
                -HEIGHT/2 + OUTLINE_WIDTH, 
                WIDTH - OUTLINE_WIDTH*2, 
                HEIGHT - OUTLINE_WIDTH*2, 
                0.1, CORNER_QUALITY, 
                new RGBA(0.90, 0.75, 0.40))
            .addRoundedRectangle(
                -WIDTH/2 + OUTLINE_WIDTH + 0.025, 
                -HEIGHT/2 + OUTLINE_WIDTH + 0.025, 
                WIDTH - OUTLINE_WIDTH*2 - 0.1, 
                HEIGHT - OUTLINE_WIDTH*2 - 0.1, 
                0.1, CORNER_QUALITY, 
                new RGBA(1, 1, 0.67))
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
                new RGBA(0.70, 0.25, 0))
            .addEllipse(0 - 0.025, NOSE_Y - 0.025*ratio, 
                NOSE_WIDTH - NOSE_OUTLINE*2 - 0.1, 
                NOSE_HEIGHT - NOSE_OUTLINE*2 - 0.1*ratio, 
                NOSE_QUALITY, 
                new RGBA(1.0, 0.50, 0))
            .constructMesh(event);

        // TODO: Get rid of most numeric constants?
        this.meshEye = (new ShapeGenerator())
            .addEllipse(0, 0, 0.125, 0.20, 16, new RGBA(0, 0, 0))
            .addEllipse(-0.010, -0.020, 0.125/2, 0.10, 16, new RGBA())
            .constructMesh(event);
    }


    private generateMeshes(event : CoreEvent) {

        this.generateBody(event);
        this.generateFace(event);
    }


    public update(stage : Stage, event : CoreEvent) {

        const EYE_MOVE_SPEED = 0.10;

        this.eyeTarget = event.input.getStick();

        this.eyePos.x = updateSpeedAxis(this.eyePos.x, this.eyeTarget.x, EYE_MOVE_SPEED*event.step);
        this.eyePos.y = updateSpeedAxis(this.eyePos.y, this.eyeTarget.y, EYE_MOVE_SPEED*event.step);
    }


    public draw(canvas : Canvas) {

        const EYE_RADIUS_X = 0.075;
        const EYE_RADIUS_Y = 0.05;

        canvas.drawMesh(this.meshBody);
        canvas.drawMesh(this.meshFaceStatic);

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

}
