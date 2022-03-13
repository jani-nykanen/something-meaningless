import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { GameObject, PlatformObject } from "./gameobject.js";
import { Stage } from "./stage.js";



export class TogglableTile extends PlatformObject {


    private enabled : boolean;

    private growing : boolean;
    private growTimer : number;
    private readonly growTime : number;


    constructor(x : number, y : number,
        meshBottom : Mesh, meshTop : Mesh, meshShadow : Mesh,
        enabled : boolean, growTime : number) {

        super(x, y, meshBottom, meshTop, meshShadow);

        this.enabled = enabled;

        this.growTime = growTime;
        this.growing = false;
        this.growTimer = 0.0;
    }


    public recreate(x : number, y : number, enabled : boolean) {

        this.pos.x = x;
        this.pos.y = y;

        this.growing = false;
        this.growTimer = 0.0;

        this.exist = true;

        this.enabled = enabled;
    }


    public update(stage : Stage, event : CoreEvent) {

        const DISABLED_ALPHA = 1.0; // 0.33;
        const SHRINK_SCALE = 0.50;

        let t : number;

        if (this.growing) {

            if ((this.growTimer -= event.step) <= 0) {

                this.growing = false;
            }
            else {

                t = this.growTimer / this.growTime;

                if (!this.enabled) {

                    this.scale = SHRINK_SCALE * (1.0 - t) + t;
                }
                else {

                    this.scale = (1.0 - t) + SHRINK_SCALE * t;
                }
                return;
            }
        }

        this.alpha = 1.0;
        this.scale = 1.0;
        if (!this.enabled) {

            this.alpha = DISABLED_ALPHA;
            this.scale = SHRINK_SCALE;
        }
    }


    public toggle() {

        this.enabled = !this.enabled;

        this.growTimer = this.growTime;
        this.growing = true;
    }

}
