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


    constructor(x : number, y : number, moveTime : number, event : CoreEvent) {

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
    
        this.moveTimer = 0.0;
        this.moveTime = moveTime;
        this.moving = false;

        this.generateMeshes(event);
    }


    private generateMeshes(event : CoreEvent) {

        this.meshBody = (new ShapeGenerator())
            .addRoundedRectangle(1.0, 0.65, 64, new RGBA(0.90, 0.90, 0.90), 0, 0, 1.0, 0.75)
            .addRoundedRectangle(1.0, 0.65, 64, new RGBA(), -0.025, -0.025 * 0.75, 1.0*0.90, 0.75*0.90)
            .constructMesh(event);
    }


    public update(stage : Stage, event : CoreEvent) {

        // ...
    }


    public draw(canvas : Canvas) {

        canvas.drawMesh(this.meshBody);
    }

}
