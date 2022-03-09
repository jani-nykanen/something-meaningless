import { Canvas } from "../core/canvas.js";
import { GameObject } from "./gameobject.js";


export class ObjectBuffer {

    
    private objects : Array<GameObject>;


    constructor() {

        this.objects = new Array<GameObject> ();
    }


    public addObject(o : GameObject) {

        if (!o.doesExist()) return;

        this.objects.push(o);
    }


    public addObjects(arr : Array<GameObject>) {

        for (let o of arr) {

            this.addObject(o);
        }
    }


    public sort() {

        this.objects.sort(
            (a : GameObject, b : GameObject) => a.depth() - b.depth()
        );
    }


    public draw(canvas : Canvas, tileWidth : number, tileHeight : number) {

        for (let o of this.objects) {

            o.draw(canvas, tileWidth, tileHeight);
        }
    }


    public drawShadows(canvas : Canvas, tileWidth : number, tileHeight : number) {

        for (let o of this.objects) {

            o.drawShadow(canvas, tileWidth, tileHeight);
        }
    }


    public flush() {

        this.objects.length = 0;
    }
}
