import { Canvas } from "../core/canvas";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { Tilemap } from "../core/tilemap.js";
import { RGBA, Vector2 } from "../core/vector.js";
import { ShapeGenerator } from "./shapegenerator.js";


const JUMP_FLOOR_COLOR = new RGBA(0.75, 0.30, 0.0);
const TELEPORT_FLOOR_COLOR = new RGBA(0.67, 0.80, 0.20);


const COLORS = [
    new RGBA(0.95, 0.70, 0.40),
    new RGBA(1.0, 0.95, 0.67),

    JUMP_FLOOR_COLOR,
    JUMP_FLOOR_COLOR,

    TELEPORT_FLOOR_COLOR,
    TELEPORT_FLOOR_COLOR
];


const OUTLINE_WIDTH = 0.025;


const isFloorTile = (id : number) => [1, 11, 13, 14, 16, 17, 18, 19, 20, 23, 29].includes(id);


const generateFloorMesh = (map : Tilemap, 
    tileWidth : number, tileHeight : number, 
    outlineFactor : number,
    event : CoreEvent) : Mesh => {

    let gen = new ShapeGenerator();

    let colorIndex : number;
    let tid : number;

    // Base tiles
    for (let y = 0; y < map.height; ++ y) {

        for (let x = 0; x < map.width; ++ x) {

            tid = map.getTile(0, x, y);
            if (!isFloorTile(tid)) continue;

            colorIndex = x % 2 == y % 2 ? 1 : 0;
            if (tid == 13)
                colorIndex += 2;
            else if (tid == 16)
                colorIndex += 4;

            gen.addRectangle(
                x * tileWidth - tileWidth/2, 
                y * tileHeight - tileHeight/2,
                tileWidth, tileHeight,
                COLORS[colorIndex]);
        }
    }

    // Outlines
    let dx : number;
    let dy : number;

    let black = new RGBA(0);

    let offset : number;
    let width : number;

    let outlineWidth = OUTLINE_WIDTH * outlineFactor;

    for (let y = 0; y < map.height; ++ y) {

        for (let x = 0; x < map.width; ++ x) {

            if (!isFloorTile(map.getTile(0, x, y))) continue;

            dx = x * tileWidth - tileWidth/2 - outlineWidth/2; 
            dy = y * tileHeight - tileHeight/2 - outlineWidth/2;

            offset = 0;
            width = tileWidth + outlineWidth;

            // Top
            if (!isFloorTile(map.getTile(0, x, y-1))) {

                gen.addRectangle(dx + offset, dy, 
                    width, outlineWidth, black);
            }

            // Left
            if (!isFloorTile(map.getTile(0, x-1, y))) {

                gen.addRectangle(
                    dx, dy,
                    outlineWidth, 
                    tileHeight + outlineWidth, 
                    black);
            }
            // Right
            if (!isFloorTile(map.getTile(0, x+1, y))) {

                gen.addRectangle(
                    dx + tileWidth, dy, 
                    outlineWidth, 
                    tileHeight + outlineWidth, 
                    black);
            }
        }
    }

    return gen.constructMesh(event);
}


const generateWallMesh = (map : Tilemap, 
    tileWidth : number, tileHeight : number, 
    outlineFactor : number,
    event : CoreEvent) : Mesh => {

    let gen = new ShapeGenerator();

    let tid : number;
    let colorIndex : number;

    // Wall tiles
    for (let y = 0; y < map.height; ++ y) {

        for (let x = 0; x < map.width; ++ x) {

            tid = map.getTile(0, x, y);

            if (!isFloorTile(tid) ||
                isFloorTile(map.getTile(0, x, y+1)))
                continue;

            colorIndex = x % 2 == y % 2 ? 1 : 0;
            if (tid == 13)
                colorIndex += 2;
            else if (tid == 16)
                colorIndex += 4;

            gen.addRectangle(
                x * tileWidth - tileWidth/2, 
                (y+1) * tileHeight - tileHeight/2,
                tileWidth, (1.0 - tileHeight),
                RGBA.scalarMultiply(COLORS[colorIndex], 0.67));
        }
    }

    // Outlines
    let dx : number;
    let dy : number;

    let black = new RGBA(0);

    let outlineWidth = OUTLINE_WIDTH * outlineFactor;

    for (let y = 0; y < map.height; ++ y) {

        for (let x = 0; x < map.width; ++ x) {

            if (!isFloorTile(map.getTile(0, x, y))) continue;

            dx = x * tileWidth - tileWidth/2 - outlineWidth/2; 
            dy = y * tileHeight - tileHeight/2;

            if (!isFloorTile(map.getTile(0, x, y+1))) {

                // Top
                gen.addRectangle(dx, dy + 1.0, 
                    tileWidth + outlineWidth, 
                    outlineWidth, black);
                    
                // Left
                if (!isFloorTile(map.getTile(0, x-1, y))) {

                    gen.addRectangle(
                        dx, dy + tileHeight, 
                        outlineWidth, 1.0 - tileHeight, black);
                }

                if (!isFloorTile(map.getTile(0, x+1, y)) &&
                    !isFloorTile(map.getTile(0, x+1, y+1))) {

                    gen.addRectangle(
                        dx + tileWidth, 
                        dy + tileHeight, 
                        outlineWidth, 1.0 - tileHeight, black);
                }
            }
        }
    }

    return gen.constructMesh(event);
}



const generateShadowMesh = (map : Tilemap, 
    tileWidth : number, tileHeight : number, 
    outlineFactor : number,
    event : CoreEvent) : Mesh => {

    const SHADOW_OFFSET_X = 0.15;
    const SHADOW_OFFSET_Y = 0.15;

    let gen = new ShapeGenerator();

    let dx : number;
    let dy : number;

    let black = new RGBA(0);

    let tx : number;
    let ty : number;

    let outlineWidth = OUTLINE_WIDTH * outlineFactor;

    for (let y = 0; y < map.height; ++ y) {

        for (let x = 0; x < map.width; ++ x) {

            if (!isFloorTile(map.getTile(0, x, y)))
                continue;

            dx = x * tileWidth - tileWidth/2 - outlineWidth/2; 
            dy = y * tileHeight - tileHeight/2 - outlineWidth/2;

            ty = dy + 1.0 + outlineWidth;
            gen.addTriangle(
                new Vector2(dx, ty),
                new Vector2(dx + SHADOW_OFFSET_X, ty),
                new Vector2(dx + SHADOW_OFFSET_X, ty + SHADOW_OFFSET_Y),
                black);

            tx = dx + 1.0 + outlineWidth;
            ty = dy + (1.0 - tileHeight);
            gen.addTriangle(
                new Vector2(tx, ty),
                new Vector2(tx, ty + SHADOW_OFFSET_Y),
                new Vector2(tx + SHADOW_OFFSET_X, ty + SHADOW_OFFSET_Y),
                black);

            gen.addRectangle(
                dx + SHADOW_OFFSET_X, 
                dy + SHADOW_OFFSET_Y + (1.0 - tileHeight),
                tileWidth + outlineWidth, 
                tileHeight + outlineWidth,
                black);
        }
    }

    return gen.constructMesh(event);
}


export class Terrain {


    private meshFloor : Mesh;
    private meshWalls : Mesh;
    private meshShadows : Mesh;


    constructor(map : Tilemap, 
        tileWidth : number, tileHeight : number, 
        outlineFactor : number,
        event : CoreEvent) {

        this.meshFloor = generateFloorMesh(map, tileWidth, tileHeight, outlineFactor, event);
        this.meshWalls = generateWallMesh(map, tileWidth, tileHeight, outlineFactor, event);
        this.meshShadows = generateShadowMesh(map, tileWidth, tileHeight, outlineFactor, event);
    }


    public drawShadows(canvas : Canvas) {

        canvas.drawMesh(this.meshShadows);
    }
        

    public drawBottom(canvas : Canvas) {

        canvas.drawMesh(this.meshWalls);
    }


    public drawTop(canvas : Canvas) {

        canvas.drawMesh(this.meshFloor);
    }


    public dispose(event : CoreEvent) {

        event.disposeMesh(this.meshFloor);
        event.disposeMesh(this.meshShadows);
        event.disposeMesh(this.meshWalls);
    }
}
