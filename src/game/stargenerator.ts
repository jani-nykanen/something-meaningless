import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { RGBA, Vector2 } from "../core/vector.js";
import { ExistingObject, nextObject } from "./gameobject.js";
import { ShapeGenerator } from "./shapegenerator.js";



class Star extends ExistingObject {


    private pos : Vector2;
    private speed : Vector2;
    private angle : number;
    private gravity : number;
    private scale : number;

    private timer : number;
    private time : number;

    private color : RGBA

    private readonly meshStar : Mesh;


    constructor(meshStar : Mesh) {

        super(false);

        this.pos = new Vector2();
        this.speed = new Vector2();
        this.angle = 0.0;
        this.gravity = 0.0;

        this.timer = 0;
        this.time = 1.0;

        this.color = new RGBA();

        this.meshStar = meshStar;
    }


    public spawn(x : number, y : number, 
        speedx : number, speedy : number, 
        gravity : number, scale : number,
        time : number, color = new RGBA()) {

        this.pos = new Vector2(x, y);
        this.speed = new Vector2(speedx, speedy);
        this.gravity = gravity;
        this.scale = scale;

        this.timer = time;
        this.time = time;

        this.color = color;

        this.exist = true;
    }


    public update(event : CoreEvent) {

        const BASE_ANGLE_SPEED = 3.0;

        if (!this.exist) return;

        this.speed.y += this.gravity * event.step;

        this.pos.x += this.speed.x * event.step;
        this.pos.y += this.speed.y * event.step;

        if ( (this.timer -= event.step) <= 0) {

            this.exist = false;
        }

        this.angle += BASE_ANGLE_SPEED * this.speed.x * event.step;
    }


    public draw(canvas : Canvas) {

        let alpha = this.timer / this.time;

        canvas.transform
            .push()
            .translate(this.pos.x, this.pos.y)
            .rotate(this.angle)
            .scale(this.scale, this.scale)
            .use();

        canvas.setColor(this.color.r, this.color.g, this.color.b, alpha);
        canvas.drawMesh(this.meshStar);
        canvas.setColor();

        canvas.transform
            .pop()
            .use();
    }

}


export class StarGenerator {


    private stars : Array<Star>;

    private meshStar : Mesh;


    constructor(event : CoreEvent) {

        this.stars = new Array<Star> ();

        this.generateStar(event);
    }


    private generateStar(event : CoreEvent) {

        const COLOR_1 = new RGBA(0.25, 0.70, 0.20);
        const COLOR_2 = new RGBA(0.50, 1.0, 0.40);

        this.meshStar = (new ShapeGenerator())
            .addStar(0, 0, 0.1, 0.2, 5, COLOR_1, -Math.PI*2 / 20)
            .addStar(0, 0, 0.075, 0.15, 5, COLOR_2, -Math.PI*2 / 20)
            .constructMesh(event);
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


    public createStars(count : number, x : number, y : number,
        speed : number, jumpSpeed : number, gravity : number,
        time : number, scale : number, color = new RGBA()) {

        let angle : number;
        let angleStep = Math.PI*2 / count;
        let o : Star;

        for (let i = 0; i < count; ++ i) {

            angle = angleStep * i;

            o = nextObject<Star>(this.stars);
            if (o == null) {

                o = new Star(this.meshStar);
                this.stars.push(o);
            }
            o.spawn(x, y, 
                Math.cos(angle) * speed,
                Math.sin(angle) * speed + jumpSpeed,
                gravity, scale, time, color);
        }
    }


    public dispose(event : CoreEvent) {

        event.disposeMesh(this.meshStar);
    }
}
