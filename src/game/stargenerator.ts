import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Vector2 } from "../core/vector.js";
import { ExistingObject } from "./gameobject.js";



class Star extends ExistingObject {


    private pos : Vector2;
    private speed : Vector2;
    private angle : number;
    private gravity : number;
    private scale : number;

    private timer : number;
    private time : number;

    private readonly meshStar : Mesh;


    constructor(meshStar : Mesh) {

        super(false);

        this.pos = new Vector2();
        this.speed = new Vector2();
        this.angle = 0.0;
        this.gravity = 0.0;

        this.timer = 0;
        this.time = 1.0;

        this.meshStar = meshStar;
    }


    public spawn(x : number, y : number, 
        speedx : number, speedy : number, 
        gravity : number, scale : number,
        time : number) {

        this.pos = new Vector2(x, y);
        this.speed = new Vector2(speedx, speedy);
        this.gravity = gravity;
        this.scale = scale;

        this.timer = time;
        this.time = time;

        this.exist = true;
    }


    public update(event : CoreEvent) {

        if (!this.exist) return;

        this.speed.y += this.gravity * event.step;

        this.pos.x += this.speed.x * event.step;
        this.pos.y += this.speed.y * event.step;

        if ( (this.timer -= event.step) <= 0) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas) {

        let alpha = this.timer / this.time;

        canvas.transform
            .push()
            .translate(this.pos.x, this.pos.y)
            .rotate(this.angle)
            .scale(this.scale, this.scale)
            .use();

        canvas.setColor(1, 1, 1, alpha);
        canvas.drawMesh(this.meshStar);
        canvas.setColor();

        canvas.transform
            .pop()
            .use();
    }

}


export class StarGenerator {


    private stars : Array<Star>;

    private readonly meshStar : Mesh;


    constructor(meshStar : Mesh) {

        this.stars = new Array<Star> ();

        this.meshStar = meshStar;
    }


    public update(event : CoreEvent) {

        for (let o of this.stars) {

            o.update(event);
        }
    }


    public draw(canvas : Canvas) {

        for (let o of this.stars) {

            o.draw(canvas);
        }
    }


    public createStars(count : number) {

        // ...
    }
}
