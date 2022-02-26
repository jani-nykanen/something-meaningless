import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Vector2, RGBA } from "../core/vector.js";
import { ShapeGenerator } from "./shapegenerator.js";
import { Stage } from "./stage.js";



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


    constructor(x : number, y : number, moveTime : number, event : CoreEvent) {

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.moveTime = moveTime;
        this.moving = false;

        this.generateMeshes(event);
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
                new RGBA(0.85, 0.85, 0.85))
            .addRoundedRectangle(
                -WIDTH/2 + OUTLINE_WIDTH + 0.025, 
                -HEIGHT/2 + OUTLINE_WIDTH + 0.025, 
                WIDTH - OUTLINE_WIDTH*2 - 0.1, 
                HEIGHT - OUTLINE_WIDTH*2 - 0.1, 
                0.1, CORNER_QUALITY, 
                new RGBA())
            .constructMesh(event);
    }


    private generateFace(event : CoreEvent) {

        const NOSE_WIDTH = 0.40;
        const NOSE_HEIGHT = 0.25;
        const NOSE_QUALITY = 32;
        const NOSE_OUTLINE = 0.025;

        let ratio = NOSE_HEIGHT / NOSE_WIDTH;

        this.meshFaceStatic = (new ShapeGenerator())
            .addEllipse(0, 0.1, 
                NOSE_WIDTH, NOSE_HEIGHT, 
                NOSE_QUALITY, 
                new RGBA(0, 0, 0))
            .addEllipse(0, 0.1, 
                NOSE_WIDTH - NOSE_OUTLINE*2, 
                NOSE_HEIGHT - NOSE_OUTLINE*2, 
                NOSE_QUALITY, 
                new RGBA(0.67, 0.10, 0))
            .addEllipse(0 - 0.025, 0.1 - 0.025*ratio, 
                NOSE_WIDTH - NOSE_OUTLINE*2 - 0.1, 
                NOSE_HEIGHT - NOSE_OUTLINE*2 - 0.1*ratio, 
                NOSE_QUALITY, 
                new RGBA(1.0, 0.33, 0))
            .constructMesh(event);

        // TODO: Get rid of most numeric constants?
        this.meshEye = (new ShapeGenerator())
            .addEllipse(0, 0, 0.15, 0.25, 16, new RGBA(0, 0, 0))
            .addEllipse(-0.015, -0.025, 0.075, 0.125, 16, new RGBA())
            .constructMesh(event);
    }


    private generateMeshes(event : CoreEvent) {

        this.generateBody(event);
        this.generateFace(event);
    }


    public update(stage : Stage, event : CoreEvent) {

        // ...
    }


    public draw(canvas : Canvas) {

        canvas.drawMesh(this.meshBody);
        canvas.drawMesh(this.meshFaceStatic);

        for (let i = -1; i <= 1; i += 2) {

            canvas.transform
                .push()
                .translate(-i * 0.225, -0.10)
                .use();

            canvas.drawMesh(this.meshEye);

            canvas.transform.pop();

        }
    }

}
