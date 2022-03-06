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

        // ...
    }


    public drawShadow(canvas : Canvas) {

        // ...
    }
}
