import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Vector2 } from "../core/vector.js";


export class ExistingObject {

    protected exist : boolean;


    constructor(exist = false) {

        this.exist = exist;
    }


    public doesExist = () : boolean => this.exist;


    public kill() {

        this.exist = false;
    }
}


export class GameObject extends ExistingObject {


    protected pos : Vector2;

    protected exist : boolean;


    constructor(x = 0, y = 0, exist = false) {

        super(exist);

        this.pos = new Vector2(x, y);
        this.exist = exist;
    }


    public getPosition = () : Vector2 => this.pos.clone();


    // public recreate(x : number, y : number) {}

    
    public depth() : number {

        return this.pos.y;
    }


    public draw(canvas : Canvas, tileWidth : number, tileHeight : number) {}
    public drawShadow(canvas : Canvas, tileWidth : number, tileHeight : number, offset = 0) {}

}


export class MovingObject extends GameObject {


    protected target : Vector2;
    protected renderPos : Vector2;

    protected moving : boolean;
    protected moveTimer : number;
    protected moveTime : number;
    

    constructor(x = 0, y = 0, exist = false) {

        super(x, y, exist);

        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();

        this.moving = false;
        this.moveTimer = 0;
        this.moveTime = 1;
    }



    protected stopMovementEvent(event : CoreEvent) {}


    protected move(event : CoreEvent) {

        if (!this.moving) return;

        if ((this.moveTimer -= event.step) <= 0) {

            this.moving = false;
            this.pos = this.target.clone();
            this.renderPos = this.pos.clone();

            this.stopMovementEvent(event);

            return;
        }

        let t = 1.0 - this.moveTimer / this.moveTime;
        this.renderPos = Vector2.interpolate(this.pos, this.target, t);
    }
}


export function nextObject<T extends ExistingObject> (arr : Array<T>) {

    let o : T;

    o = null;
    for (let a of arr) {

        if (!a.doesExist()) {

            o = a;
            break;
        }
    }
    return o;
}
