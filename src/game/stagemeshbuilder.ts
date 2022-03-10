import { CoreEvent } from "../core/core.js";
import { Matrix3 } from "../core/matrix.js";
import { Mesh } from "../core/mesh.js";
import { RGBA, Vector2 } from "../core/vector.js";
import { ShapeGenerator } from "./shapegenerator.js";




export const enum StageMesh {

    PlatformBottom = 0,
    PlatformTop = 1,
    PlatformShadow = 2,

    OrbBody = 3,
    OrbShadow = 4,
};
const STAGE_MESH_COUNT = 6



export class StageMeshBuilder {


    private meshes : Array<Mesh>;


    constructor(tileWidth : number, tileHeight : number, event : CoreEvent) {

        this.meshes = new Array<Mesh> (STAGE_MESH_COUNT);

        this.generateMeshes(tileWidth, tileHeight, event);
    }


    private addPlatformCross(gen : ShapeGenerator, 
        tileWidth : number, tileHeight : number,
        baseScale : number, tx = 0.0, ty = 0.0) {

        const COLOR = new RGBA(0.33, 0.0, 0.0);

        const RADIUS = 0.35;
        const WIDTH = 0.15;

        let r = RADIUS * baseScale;
        let w = WIDTH * baseScale;

        let M = Matrix3.multiply(
                Matrix3.multiply(
                    Matrix3.translate(tx, ty),
                    Matrix3.scale(tileWidth, tileHeight)), 
                Matrix3.rotate(Math.PI/4));

        let A = new Vector2(-r, -w/2);
        let B = new Vector2(r, -w/2);
        let C = new Vector2(r, w/2);
        let D = new Vector2(-r, w/2);

        let tA = Matrix3.multiplyVector(M, A);
        let tB = Matrix3.multiplyVector(M, B);
        let tC = Matrix3.multiplyVector(M, C);
        let tD = Matrix3.multiplyVector(M, D);

        gen.addTriangle(tA, tB, tC, COLOR)
           .addTriangle(tC, tD, tA, COLOR); 

        A.swapComponents();
        B.swapComponents();
        C.swapComponents();
        D.swapComponents();

        tA = Matrix3.multiplyVector(M, A);
        tB = Matrix3.multiplyVector(M, B);
        tC = Matrix3.multiplyVector(M, C);
        tD = Matrix3.multiplyVector(M, D);

        gen.addTriangle(tA, tB, tC, COLOR)
           .addTriangle(tC, tD, tA, COLOR); 
    }


    private generatePlatformMeshes(tileWidth : number, tileHeight : number, event : CoreEvent) {

        const PLATFORM_SCALE = 0.90;
        const PLATFORM_QUALITY = 32;
        const PLATFORM_COLOR_1 = new RGBA(0.70, 0.33, 0);
        const PLATFORM_COLOR_2 = new RGBA(1.0, 0.67, 0.33);
        
        /*
        const CROSS_WIDTH = 0.20;
        const CROSS_HEIGHT = 0.80;
        const CROSS_COLOR = new RGBA(0.33, 0, 0);
        */

        const SHADOW_OFFSET_X = 0.15;
        const SHADOW_OFFSET_Y = 0.15;

        const OUTLINE_WIDTH = 0.033;

        // TODO: This should be constant, too
        let black = new RGBA(0);

        let dw = PLATFORM_SCALE * tileWidth;
        let dh = (1.0 - tileHeight);
        let dx = -dw/2;
        let dy = -dh;
        
        let ow = OUTLINE_WIDTH * PLATFORM_SCALE;

        this.meshes[StageMesh.PlatformBottom] = (new ShapeGenerator())
            .addRectangle(
                dx, dy, 
                dw,  dh, black)
            .addSector(0, Math.PI, PLATFORM_QUALITY, black,
                0, 0, 
                PLATFORM_SCALE * tileWidth / 2.0, 
                PLATFORM_SCALE * tileHeight / 2.0)
            .addSector(0, Math.PI, PLATFORM_QUALITY, black,
                0, dy, 
                PLATFORM_SCALE * tileWidth / 2.0, 
                -PLATFORM_SCALE * tileHeight / 2.0)
            .addRectangle(
                dx + ow, dy + ow, 
                dw - ow*2, dh, 
                PLATFORM_COLOR_1)
            .addSector(0, Math.PI, PLATFORM_QUALITY, PLATFORM_COLOR_1,
                0, 0, 
                PLATFORM_SCALE * tileWidth / 2.0 - ow, 
                PLATFORM_SCALE * tileHeight / 2.0 - ow)
            .constructMesh(event);

        let gen = new ShapeGenerator();
        gen.addEllipse(0, dy, 
                PLATFORM_SCALE * tileWidth - ow*2, 
                PLATFORM_SCALE * tileHeight - ow*2, 
                PLATFORM_QUALITY, PLATFORM_COLOR_2);
        this.addPlatformCross(gen, tileWidth, tileHeight, PLATFORM_SCALE, 0, -0.25); // Why -0.25?
        this.meshes[StageMesh.PlatformTop] = gen.constructMesh(event);
            
        this.meshes[StageMesh.PlatformShadow]  = (new ShapeGenerator())
            .addEllipse(SHADOW_OFFSET_X/2, SHADOW_OFFSET_Y, 
                PLATFORM_SCALE * (tileHeight + SHADOW_OFFSET_X*2) - ow*2, 
                PLATFORM_SCALE * tileHeight - ow*2, 
                PLATFORM_QUALITY, black)
            .constructMesh(event);
    }


    private generateOrbMeshes(event : CoreEvent) {

        const ORB_RADIUS = 0.25;
        const INNER_RADIUS = 0.15;
        const OUTLINE_WIDTH = 0.033;

        const BLACK = new RGBA(0);
        const ORB_COLOR_1 = new RGBA(0.25, 0.70, 0.20);
        const ORB_COLOR_2 = new RGBA(0.50, 1.0, 0.40);

        let r = ORB_RADIUS - OUTLINE_WIDTH;

        this.meshes[StageMesh.OrbBody] = (new ShapeGenerator())
            .addEllipse(0, 0, ORB_RADIUS*2, ORB_RADIUS*2, 32, BLACK)
            .addEllipse(0, 0, r*2, r*2, 32, ORB_COLOR_1)
            .addEllipse(-0.033, -0.033, INNER_RADIUS*2, INNER_RADIUS*2, 32, ORB_COLOR_2)
            .constructMesh(event);

        this.meshes[StageMesh.OrbShadow] = (new ShapeGenerator())
            .addEllipse(0, 0, ORB_RADIUS*2, ORB_RADIUS, 32, BLACK)
            .constructMesh(event);
    }


    private generateMeshes(tileWidth : number, tileHeight : number, event : CoreEvent) {

        this.generatePlatformMeshes(tileWidth, tileHeight, event);
        this.generateOrbMeshes(event);
    }


    public getMesh(type : StageMesh) : Mesh {

        return this.meshes[type];
    }
}
