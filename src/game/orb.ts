import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";



export class Orb extends GameObject {


    private readonly meshOrb : Mesh;
    private readonly meshShadow : Mesh;


    constructor(x : number, y : number,
        meshOrb : Mesh,
        meshShadow : Mesh) {
        
        super(x, y, true);

        this.meshOrb = meshOrb;
        this.meshShadow = meshShadow;
    }


    public recreate(x : number, y : number) {

        this.pos.x = x;
        this.pos.y = y;

        this.exist = true;
    }


    public update(player : Player, stage : Stage, event : CoreEvent) {

        if (!this.exist) return;

        let px = this.pos.x | 0;
        let py = this.pos.y | 0;

        if (!player.isMoving() &&
            stage.getTile(1, px, py) != 4) {

            this.exist = false;
        }
    }


    private setTransform(canvas : Canvas, tileWidth: number, tileHeight: number, yoff = 0) {

        canvas.transform
            .push()
            .translate(
                this.pos.x * tileWidth, 
                this.pos.y * tileHeight + yoff)
            .use();
    }


    public drawShadow(canvas: Canvas, tileWidth: number, tileHeight: number, offset = 0.0) {
        
        if (!this.exist) return;

        this.setTransform(canvas, tileWidth, tileHeight);

        canvas.drawMesh(this.meshShadow);

        canvas.transform
            .pop()
            .use();
    }


    public draw(canvas: Canvas, tileWidth: number, tileHeight: number) {
        
        const BASE_OFFSET = -0.45;

        if (!this.exist) return;

        this.setTransform(canvas, tileWidth, tileHeight, BASE_OFFSET);

        canvas.drawMesh(this.meshOrb);

        canvas.transform
            .pop()
            .use();
    }


    public depth = () : number => {
        
        const EPS = 0.00001;
        return this.pos.y - EPS;
    }
}
