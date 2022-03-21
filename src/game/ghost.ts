import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Vector2 } from "../core/vector.js";
import { MovingObject} from "./gameobject.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";
import { Direction, oppositeDirection } from "./types.js";


export class Ghost extends MovingObject {


    private direction : Direction;

    private movementChecked : boolean;

    private wave : number;

    private readonly meshBody : Mesh;
    private readonly meshShadow : Mesh;
    private readonly meshFaceFront : Mesh;
    private readonly meshFaceSide : Mesh;


    constructor(x : number, y : number,
        meshBody : Mesh, meshShadow : Mesh, 
        meshFaceFront : Mesh, meshFaceSide : Mesh,
        moveTime : number, direction : Direction) {

        super(x, y, true);

        this.moveTimer = 0.0;
        this.moveTime = moveTime;

        this.direction = direction;

        this.movementChecked = false;

        this.wave = Math.random() * Math.PI * 2;

        this.meshBody = meshBody;
        this.meshShadow = meshShadow;
        this.meshFaceFront = meshFaceFront;
        this.meshFaceSide = meshFaceSide;
    }


    public recreate(x : number, y : number, direction : Direction) {

        this.pos.x = x;
        this.pos.y = y;

        this.moveTimer = 0.0;
        this.moving = false;

        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();
        this.movementChecked = false;

        this.direction = direction;

        this.exist = true;
    }


    private checkMovement(stage : Stage, event : CoreEvent) {

        const DIRX = [1, 0, -1, 0];
        const DIRY = [0, -1, 0, 1];

        let dirx = DIRX[this.direction];
        let diry = DIRY[this.direction];

        let px = this.pos.x | 0;
        let py = this.pos.y | 0;

        this.movementChecked = true;

        if (stage.getTile(1, px, py) == 3)
            return;

        if (!stage.isUpperTileEmpty(px + dirx, py + diry)) {

            this.direction = oppositeDirection(this.direction);
            dirx = DIRX[this.direction];
            diry = DIRY[this.direction];

            if (!stage.isUpperTileEmpty(px + dirx, py + diry)) {

                return;
            }
        }

        this.target = Vector2.add(this.pos, new Vector2(dirx, diry));
        this.moveTimer = this.moveTime;
        this.moving = true;

        stage.setTile(1, px, py, 0);
        stage.setTile(1, px + dirx, py + diry, this.direction + 25); 
    }


    public update(player : Player, stage : Stage, event : CoreEvent) {

        const WAVE_SPEED = 0.05;

        if (!this.exist) return;

        this.wave = (this.wave + WAVE_SPEED * event.step) % (Math.PI*2);

        if (!player.isMoving()) {

            this.movementChecked = false;
            if (this.moving) {

                this.pos = this.target.clone();
                this.renderPos = this.pos.clone();
                this.moving = false;
            }
        }

        if (!this.moving && player.isMoving() && !this.movementChecked) {

            this.checkMovement(stage, event);
        }
        this.move(stage, event);
    }


    private setTransform(canvas : Canvas, tileWidth: number, tileHeight: number, yoff = 0, scale = 1.0) {

        canvas.transform
            .push()
            .translate(
                this.renderPos.x * tileWidth, 
                this.renderPos.y * tileHeight + yoff)
            .scale(scale, scale)
            .use();
    }


    public drawShadow(canvas: Canvas, tileWidth: number, tileHeight: number, offset = 0.0) {
        
        const BASE_SCALE = 0.85;
        const SCALE_AMPLITUDE = 0.05;

        if (!this.exist) return;

        let scale = BASE_SCALE + Math.sin(this.wave) * SCALE_AMPLITUDE;

        this.setTransform(canvas, tileWidth, tileHeight, offset, scale);

        canvas.drawMesh(this.meshShadow);

        canvas.transform
            .pop()
            .use();
    }


    public draw(canvas: Canvas, tileWidth: number, tileHeight: number) {
        
        const BASE_OFFSET = -0.40;
        const AMPLITUDE = 0.05;

        if (!this.exist) return;

        let offset = BASE_OFFSET + Math.sin(this.wave) * AMPLITUDE;

        this.setTransform(canvas, tileWidth, tileHeight, offset);

        canvas.drawMesh(this.meshBody);

        canvas.transform
            .pop()
            .use();
    }


    public getDirection = () : Direction => this.direction;
}
