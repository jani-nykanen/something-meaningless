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
}
