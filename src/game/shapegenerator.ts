import { CoreEvent } from "../core/core";
import { Mesh } from "../core/mesh";
import { RGBA, Vector2 } from "../core/vector";


export type Path2D = (t : Number) => Vector2;


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
        }
        return this;
    }


    public fillClosedPath(path : Path2D, steps : number, color = new RGBA()) : ShapeGenerator {

        let step = 1.0 / steps;
        let t : number;

        for (let i = 0; i < steps; ++ i) {

            t = i * step;

            this.addTriangle(path(t), path(t+step), new Vector2(), color);
        }

        return this;
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
