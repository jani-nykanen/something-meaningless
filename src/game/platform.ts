import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";


const BASE_SCALE = 0.90;


export class ShrinkingPlatform extends GameObject {


    private readonly meshBottom : Mesh;
    private readonly meshTop : Mesh;
    private readonly meshShadow : Mesh;

    private shrinking : boolean;
    private shrinkTimer : number;
    private readonly shrinkTime : number;


    constructor(x : number, y : number,
        meshBottom : Mesh, meshTop : Mesh, meshShadow : Mesh,
        shrinkTime : number) {

        super(x, y, true);

        this.meshBottom = meshBottom;
        this.meshTop = meshTop;
        this.meshShadow = meshShadow;
    
        this.shrinking = false;
        this.shrinkTimer = 0.0;
        this.shrinkTime = shrinkTime;
    }


    public update(player : Player, stage : Stage, event : CoreEvent) {

        if (!this.exist) return;
    }


    private applyBaseTransform(canvas : Canvas, tileWidth : number, tileHeight : number) {

        canvas.transform
            .push()
            .translate(
                this.pos.x * tileWidth, 
                (this.pos.y + 0.5) * tileHeight)
            .scale(
                BASE_SCALE * tileWidth, 
                BASE_SCALE * tileHeight)
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

        if (!this.exist) return;

        this.applyBaseTransform(canvas, tileWidth, tileHeight);

        canvas.drawMesh(this.meshTop);

        canvas.transform   
            .pop()
            .use();
    }
}
