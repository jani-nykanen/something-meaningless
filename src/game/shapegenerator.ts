import { CoreEvent } from "../core/core.js";
import { clamp } from "../core/math.js";
import { Mesh } from "../core/mesh.js";
import { RGBA, Vector2 } from "../core/vector.js";


export type Path2D = (t : number) => Vector2;


export class ShapeGenerator {


    private vertices : Array<number>;
    private colors : Array<number>;
    private indices : Array<number>;


    constructor() {

        this.vertices = new Array<number>();
        this.colors = new Array<number>();
        this.indices = new Array<number>();
    }


    public addTriangle(A : Vector2, B : Vector2, C : Vector2, color = new RGBA()) : ShapeGenerator {

        this.vertices.push(
            A.x, A.y, 
            B.x, B.y, 
            C.x, C.y
        );

        for (let i = 0; i < 3; ++ i) {

            this.colors.push(
                color.r, color.g, color.b, color.a
            );

            this.indices.push(this.indices.length-1);
        }
        return this;
    }


    public fillClosedPath(path : Path2D, steps : number, color = new RGBA()) : ShapeGenerator {

        let step = 1.0 / (steps-1);
        let t : number;

        for (let i = 0; i < steps; ++ i) {

            t = i * step;

            this.addTriangle(path(t), path(t+step), new Vector2(), color);
        }

        return this;
    }


    public addRoundedRectangle(diameter : number, roundRadius : number, quality : number,
        color = new RGBA(), tx = 0.0, ty = 0.0, scalex = 1.0, scaley = 1.0) : ShapeGenerator {

        let path = (t : number) : Vector2 => {

            let s = t * Math.PI * 2;

            let x = clamp(Math.cos(s) * roundRadius, -diameter/2, diameter/2);
            let y = clamp(Math.sin(s) * roundRadius, -diameter/2, diameter/2);

            return new Vector2(x * scalex + tx, y * scaley + ty);
        }
        return this.fillClosedPath(path, quality, color);
    }


    public constructMesh(event : CoreEvent) : Mesh {

        let out = event.constructMesh(
            new Float32Array(this.vertices),
            new Uint16Array(this.indices),
            null,
            new Float32Array(this.colors)
        );

        this.vertices.length = 0;
        this.indices.length = 0;
        this.colors.length = 0;

        return out;
    }
}
