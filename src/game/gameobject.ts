import { Canvas } from "../core/canvas.js";
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


    public recreate(x : number, y : number) {}

    
    public depth() : number {

        return this.pos.y;
    }


    public draw(canvas : Canvas, tileWidth : number, tileHeight : number) {}
    public drawShadow(canvas : Canvas, tileWidth : number, tileHeight : number, offset = 0) {}

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
