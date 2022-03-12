import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { GameObject, PlatformObject } from "./gameobject.js";
import { Stage } from "./stage.js";



export class TogglableTile extends PlatformObject {


    private enabled : boolean;


    constructor(x : number, y : number,
        meshBottom : Mesh, meshTop : Mesh, meshShadow : Mesh,
        enabled : boolean) {

        super(x, y, meshBottom, meshTop, meshShadow);

        this.enabled = enabled;
    }


    public recreate(x : number, y : number, enabled : boolean) {

        this.pos.x = x;
        this.pos.y = y;

        this.enabled = enabled;
    }


    public update(stage : Stage, event : CoreEvent) {

        const DISABLED_ALPHA = 0.33;
        const SHRINK_SCALE = 0.50;

        this.alpha = 1.0;
        this.scale = 1.0;
        if (!this.enabled) {

            // TODO: animate
            this.alpha = DISABLED_ALPHA;
            this.scale = SHRINK_SCALE;
        }
    }

}
