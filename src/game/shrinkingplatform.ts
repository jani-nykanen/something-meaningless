import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";


export class ShrinkingPlatform extends GameObject {


    private readonly meshBottom : Mesh;
    private readonly meshTop : Mesh;
    private readonly meshShadow : Mesh;

    private shrinking : boolean;
    private shrinkTimer : number;
    private readyToShrink : boolean;
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
        this.readyToShrink = false;
        this.shrinkTime = shrinkTime;
    }


    public recreate(x : number, y : number) {

        this.pos.x = x;
        this.pos.y = y;

        this.shrinking = false;
        this.shrinkTimer = 0.0;
        this.readyToShrink = false;

        this.exist = true;
    }


    public update(stage : Stage, event : CoreEvent) {

        if (!this.exist) return;

        if (this.shrinking) {

            if ((this.shrinkTimer -= event.step) <= 0) {

                this.exist = false;
            }
            return;
        }

        let px = this.pos.x | 0;
        let py = this.pos.y | 0;

        if (!this.readyToShrink) {

            if (stage.getTile(1, px, py) == 3) {

                this.readyToShrink = true;
            }
        }
        else {

            if (stage.getTile(1, px, py) != 3) {

                this.shrinkTimer = this.shrinkTime;
                this.shrinking = true;
                this.readyToShrink = false;

                stage.setTile(0, px, py, 0);
            }
        }
    }


    private applyBaseTransform(canvas : Canvas, tileWidth : number, tileHeight : number) {

        let scale = 1.0;
        if (this.shrinking) {

            scale = this.shrinkTimer / this.shrinkTime;
        }

        canvas.transform
            .push()
            .translate(
                this.pos.x * tileWidth, 
                this.pos.y * tileHeight + (1.0 - tileHeight))
            .scale(scale, scale)
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
