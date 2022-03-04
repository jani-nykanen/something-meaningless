import { Canvas } from "../core/canvas";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Tilemap } from "../core/tilemap.js";
import { RGBA } from "../core/vector.js";
import { ShapeGenerator } from "./shapegenerator.js";



const COLORS = [
    new RGBA(0.67, 0.67, 0.33),
    new RGBA(1.0, 1.0, 0.67)
];


const generateFloorMesh = (map : Tilemap, 
    tileWidth : number, tileHeight : number, 
    event : CoreEvent) : Mesh => {

    let gen = new ShapeGenerator();

    for (let y = 0; y < map.height; ++ y) {

        for (let x = 0; x < map.width; ++ x) {

            if (map.getTile(0, x, y) != 1) continue;

            gen.addRectangle(
                x * tileWidth - tileWidth/2, 
                y * tileHeight - tileHeight/2,
                tileWidth, tileHeight,
                COLORS[x % 2 == y % 2 ? 1 : 0]);
        }
    }

    return gen.constructMesh(event);
}


const generateWallMesh = (map : Tilemap, 
    tileWidth : number, tileHeight : number, 
    event : CoreEvent) : Mesh => {

    let gen = new ShapeGenerator();

    for (let y = 0; y < map.height; ++ y) {

        for (let x = 0; x < map.width; ++ x) {

            if (map.getTile(0, x, y) != 1 ||
                map.getTile(0, x, y+1, 0) != 0)
                continue;

            gen.addRectangle(
                x * tileWidth - tileWidth/2, 
                (y+1) * tileHeight - tileHeight/2,
                tileWidth, (1.0 - tileHeight),
                RGBA.scalarMultiply(COLORS[x % 2 == y % 2 ? 1 : 0], 0.67));
        }
    }

    return gen.constructMesh(event);
}



export class Terrain {


    private meshFloor : Mesh;
    private meshWalls : Mesh;


    constructor(map : Tilemap, 
        tileWidth : number, tileHeight : number, 
        event : CoreEvent) {

        this.meshFloor = generateFloorMesh(map, tileWidth, tileHeight, event);
        this.meshWalls = generateWallMesh(map, tileWidth, tileHeight, event);
    }
        

    public drawBottom(canvas : Canvas) {

        canvas.drawMesh(this.meshWalls);
    }


    public drawTop(canvas : Canvas) {

        canvas.drawMesh(this.meshFloor);
    }
}
