import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { negMod } from "../core/math.js";
import { Mesh } from "../core/mesh.js";
import { Vector2 } from "../core/vector.js";
import { MovingObject, PlatformObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";
import { Direction } from "./types.js";


const oppositeDirection = (dir : Direction) => 
    [Direction.Left, Direction.Down, Direction.Right, Direction.Up] [dir];


export class MovingPlatform extends PlatformObject {


    private readonly meshArrow : Mesh;

    private direction : Direction;

    private movementChecked : boolean;

    private rotating : boolean;
    private rotateTimer : number;


    constructor(x : number, y : number,
        meshBottom : Mesh, meshTop : Mesh, 
        meshShadow : Mesh, meshArrow : Mesh,
        moveTime : number, direction : Direction) {

        super(x, y, meshBottom, meshTop, meshShadow);

        this.meshArrow = meshArrow;

        this.moveTimer = 0.0;
        this.moveTime = moveTime;

        this.direction = direction;

        this.movementChecked = false;

        this.rotating = false;
        this.rotateTimer = 0.0;
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

        this.rotating = false;
        this.rotateTimer = 0.0;
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

        if (!stage.isBottomTileEmpty(px + dirx, py + diry)) {

            this.direction = oppositeDirection(this.direction);
            dirx = DIRX[this.direction];
            diry = DIRY[this.direction];

            if (!stage.isBottomTileEmpty(px + dirx, py + diry)) {

                return;
            }
        }

        this.target = Vector2.add(this.pos, new Vector2(dirx, diry));
        this.moveTimer = this.moveTime;
        this.moving = true;

        stage.setTile(0, px, py, 0);
        stage.setTile(0, px + dirx, py + diry, this.direction + 5);
    }


    public update(player : Player, stage : Stage, event : CoreEvent) {

        if (!this.exist) return;

        if (this.rotating) {

            if ((this.rotateTimer -= event.step) <= 0) {

                this.rotating = false;
            }
        }

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


    protected applyBaseTransform(canvas : Canvas, tileWidth : number, tileHeight : number) {

        canvas.transform
            .push()
            .translate(
                this.renderPos.x * tileWidth, 
                this.renderPos.y * tileHeight + (1.0 - tileHeight))
            .use();
    }


    public drawTop(canvas : Canvas, tileWidth : number, tileHeight : number) {

        const ANGLE = [-1, 2, 1, 0];

        if (!this.exist) return;

        this.applyBaseTransform(canvas, tileWidth, tileHeight);

        canvas.drawMesh(this.meshTop);

        let baseAngle = Math.PI/2 * ANGLE[this.direction];
        if (this.rotating) {

            baseAngle -= Math.PI/2 * (this.rotateTimer / this.moveTime);
        }

        canvas.transform    
            .translate(0, -(1.0 - tileHeight))
            .scale(tileWidth, tileHeight)
            .rotate(baseAngle)
            .use();

        canvas.drawMesh(this.meshArrow);

        canvas.transform   
            .pop()
            .use();
    }


    public rotate(stage : Stage, startIndex : number) {

        this.movementChecked = false;
        if (this.moving) {

            this.pos = this.target.clone();
            this.renderPos = this.pos.clone();
            this.moving = false;
        }

        this.rotating = true;
        this.rotateTimer = this.moveTime;

        this.direction = negMod(this.direction - 1, 4);

        stage.setTile(0, this.pos.x | 0, this.pos.y | 0, startIndex + this.direction);
    }


    public getDirection = () : Direction => this.direction;
}
