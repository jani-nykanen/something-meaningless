import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { PlatformObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";



export class SwitchingPlatform extends PlatformObject {


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


    public update(player : Player, stage : Stage, event : CoreEvent) {

        const SHRINK_SCALE = 0.50;

        let t : number;

        
        if (!this.growing && player.isMoving()) {

            if (stage.getTile(1, this.pos.x | 0, this.pos.y | 0) != 3) {

                this.growing = true;
                this.enabled = !this.enabled;
                this.growTimer = this.growTime;

                stage.setTile(0, this.pos.x | 0, this.pos.y | 0,
                    this.enabled ? 22 : 21)
            }
        }
        
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

            this.scale = SHRINK_SCALE;
        }
    }

}
