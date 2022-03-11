import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { GameObject } from "./gameobject.js";
import { Stage } from "./stage.js";


export const enum Direction {

    Left = 0,
    Right = 1,
    Up = 3,
    Down = 4
};


export class MovingPlatform extends GameObject {


    private readonly meshBottom : Mesh;
    private readonly meshTop : Mesh;
    private readonly meshShadow : Mesh;
    private readonly meshArrow : Mesh;

    private direction : Direction;

    private moveTimer : number;
    private readonly moveTime : number;


    constructor(x : number, y : number,
        meshBottom : Mesh, meshTop : Mesh, 
        meshShadow : Mesh, meshArrow : Mesh,
        moveTime : number, direction : Direction) {

        super(x, y, true);

        this.meshBottom = meshBottom;
        this.meshTop = meshTop;
        this.meshShadow = meshShadow;
        this.meshArrow = meshArrow;

        this.moveTimer = 0.0;
        this.moveTime = moveTime;

        this.direction = direction;
    }


    public recreate(x : number, y : number) {

        this.pos.x = x;
        this.pos.y = y;

        this.moveTimer = 0.0;

        this.exist = true;
    }


    public update(stage : Stage, event : CoreEvent) {

        if (!this.exist) return;
    }


    private applyBaseTransform(canvas : Canvas, tileWidth : number, tileHeight : number) {

        canvas.transform
            .push()
            .translate(
                this.pos.x * tileWidth, 
                this.pos.y * tileHeight + (1.0 - tileHeight))
            .use();
    }


    public drawShadow(canvas : Canvas, tileWidth : number, tileHeight : number) {

        if (!this.exist) return;

        this.applyBaseTransform(canvas, tileWidth, tileHeight);

        canvas.drawMesh(this.meshShadow);

        canvas.transform   
            .pop()
            .use();
    }


    public drawBottom(canvas : Canvas, tileWidth : number, tileHeight : number) {

        if (!this.exist) return;

        this.applyBaseTransform(canvas, tileWidth, tileHeight);

        canvas.drawMesh(this.meshBottom);

        canvas.transform   
            .pop()
            .use();
    }


    public drawTop(canvas : Canvas, tileWidth : number, tileHeight : number) {

        const ANGLE = [1, -1, 0, 2];

        if (!this.exist) return;

        this.applyBaseTransform(canvas, tileWidth, tileHeight);

        canvas.drawMesh(this.meshTop);

        canvas.transform    
            .translate(0, -(1.0 - tileHeight))
            .scale(tileWidth, tileHeight)
            .rotate(Math.PI/2 * ANGLE[this.direction])
            .use();

        canvas.drawMesh(this.meshArrow);

        canvas.transform   
            .pop()
            .use();
    }
}
