import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { GameObject, PlatformObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";


export class ShrinkingPlatform extends PlatformObject {

    
    private shrinking : boolean;
    private shrinkTimer : number;
    private readyToShrink : boolean;
    private readonly shrinkTime : number;


    constructor(x : number, y : number,
        meshBottom : Mesh, meshTop : Mesh, meshShadow : Mesh,
        shrinkTime : number) {

        super(x, y, meshBottom, meshTop, meshShadow);

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

        this.scale = 1.0;
        if (this.shrinking) {
                
            this.scale = this.shrinkTimer / this.shrinkTime;

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
}
