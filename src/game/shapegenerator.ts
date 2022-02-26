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

            this.indices.push(this.indices.length);
        }
        return this;
    }


    public fillClosedPath(path : Path2D, steps : number, color = new RGBA(), cx = 0.0, cy = 0.0) : ShapeGenerator {

        let step = 1.0 / steps;
        let t : number;

        let center = new Vector2(cx, cy);

        for (let i = 0; i < steps; ++ i) {

            t = i * step;

            this.addTriangle(path(t), path(t+step), center, color);
        }

        return this;
    }


    public addRectangle(x : number, y : number, w : number, h : number, color = new RGBA()) : ShapeGenerator {

        let A = new Vector2(x, y);
        let B = new Vector2(x+w, y);
        let C = new Vector2(x+w, y+h);
        let D = new Vector2(x, y+h);

        return this
            .addTriangle(A, B, C, color)
            .addTriangle(C, D, A, color);
    }


    public addRoundedRectangle(x : number, y : number, 
        w : number, h : number, corner : number, quality : number,
        color = new RGBA()) : ShapeGenerator {

        return this
            .addRectangle(x, y + corner, w, h - corner*2, color)
            .addRectangle(x + corner, y, w - corner*2, h, color)
            .addSector(0, Math.PI/2, quality, color, x + w - corner, y + h - corner, corner, corner)
            .addSector(Math.PI/2, Math.PI, quality, color, x + corner, y + h - corner, corner, corner)
            .addSector(Math.PI, Math.PI * 3.0/2.0, quality, color, x + corner, y + corner, corner, corner)
            .addSector(Math.PI * 3.0/2.0, Math.PI*2.0, quality, color, x + w - corner, y + corner, corner, corner);
    }


    public addSector(startAngle : number, endAngle : number, quality : number,
            color = new RGBA(), tx = 0.0, ty = 0.0, scalex = 1.0, scaley = 1.0, rotation = 0.0) : ShapeGenerator {

        let path = (t : number) => {

            let angle = startAngle + t * (endAngle - startAngle);
            let x = Math.cos(angle) * scalex;
            let y = Math.sin(angle) * scaley;

            let c = Math.cos(rotation);
            let s = Math.sin(rotation);

            let rx = tx + x * c - y * s;
            let ry = ty + x * s + y * c;

            return new Vector2(rx, ry);
        }

        return this.fillClosedPath(path, quality, color, tx, ty);
    }


    public addEllipse(cx : number, cy : number, 
        w : number, h : number, 
        quality : number, color = new RGBA()) : ShapeGenerator {

        return this.addSector(0, Math.PI*2, quality, color,
            cx, cy, w/2, h/2);
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
