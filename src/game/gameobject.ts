import { Vector2 } from "../core/vector.js";


export class GameObject {


    protected pos : Vector2;

    protected exist : boolean;


    constructor(x = 0, y = 0, exist = false) {

        this.pos = new Vector2(x, y);
        this.exist = exist;
    }


    public doesExist = () : boolean => this.exist;
    public getPosition = () : Vector2 => this.pos.clone();


    public kill() {

        this.exist = false;
    }


    public recreate(x : number, y : number) {}
}


export function nextObject<T extends GameObject> (arr : Array<T>) {

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
