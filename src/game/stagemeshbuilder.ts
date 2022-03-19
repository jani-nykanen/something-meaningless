import { CoreEvent } from "../core/core.js";
import { Matrix3 } from "../core/matrix.js";
import { Mesh } from "../core/mesh.js";
import { RGBA, Vector2 } from "../core/vector.js";
import { ShapeGenerator } from "./shapegenerator.js";


const BLACK = new RGBA(0);


export const enum StageMesh {

    PlatformBottom = 0,
    PlatformTop = 1,
    PlatformShadow = 2,

    OrbBody = 3,
    OrbShadow = 4,
    
    MovingPlatformBottom = 5,
    MovingPlatformTop = 6,
    MovingPlatformShadow = 7,
    MovingPlatformArrow = 8,

    TogglableTileBottom = 9,
    TogglableTileTop = 10,
    TogglableTileShadow = 11,

    ButtonUp = 12,
    ButtonDown = 13,
    ButtonShadow = 14,

    FloorStar = 15,
    FlooArrow = 16,

    BlueButtonUp = 17,
    BlueButtonDown = 18,
    BlueButtonShadow = 19,

    SwitchingPlatformBottom = 20,
    SwitchingPlatformTop = 21,
    SwitchingPlatformShadow = 22
};
const STAGE_MESH_COUNT = 23;


const PLATFORM_SCALE = 0.90;


export class StageMeshBuilder {


    private meshes : Array<Mesh>;


    constructor(tileWidth : number, tileHeight : number, event : CoreEvent) {

        this.meshes = new Array<Mesh> (STAGE_MESH_COUNT);

        this.generateMeshes(tileWidth, tileHeight, event);
    }


    private addPlatformCross(gen : ShapeGenerator, 
        tileWidth : number, tileHeight : number,
        baseScale : number, tx = 0.0, ty = 0.0) {

        const COLOR = new RGBA(0.40, 0.05, 0.0);

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

        const PLATFORM_QUALITY = 32;
        const PLATFORM_COLOR_1 = new RGBA(0.40, 0.167, 0.0);
        const PLATFORM_COLOR_2 = new RGBA(0.85, 0.50, 0.10);

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


    private generateMovingPlatformMeshes(tileWidth : number, tileHeight : number, event : CoreEvent) {

        const OUTLINE_WIDTH = 0.033;

        const MAGIC_OFFSET = OUTLINE_WIDTH/4; // Good grief

        const ARROW_WIDTH = 0.50;
        const ARROW_TOP = 0.25;
        const ARROW_BOTTOM = -0.125;
        
        const BOTTOM_COLOR_1 = new RGBA(0.33, 0.1, 0.67);
        const BOTTOM_COLOR_2 = new RGBA(0.50, 0.25, 0.80);
        const BOTTOM_COLOR_3 = new RGBA(0.1, 0.0, 0.33);
        const TOP_COLOR = new RGBA(0.90, 0.60, 1.0);
        const ARROW_COLOR = new RGBA(0.2, 0.0, 0.4);

        let dw = PLATFORM_SCALE * tileWidth;
        let dh = PLATFORM_SCALE * tileHeight;
        let dx = -dw/2;
        let dy = -(1.0 - tileHeight);

        let midh = 1.0 - tileHeight;
        let midw = 0.5 * PLATFORM_SCALE;
        let midx = dx + (PLATFORM_SCALE - midw)/2

        this.meshes[StageMesh.MovingPlatformBottom] = (new ShapeGenerator())
            .addEllipse(0, 0, dw, dh, 6, BLACK)
            .addEllipse(0, dy, dw, dh, 6, BLACK)
            .addRectangle(dx, dy, dw, midh, BLACK)
            .addRectangle(midx + OUTLINE_WIDTH/2, 0, midw - OUTLINE_WIDTH, midh + MAGIC_OFFSET, BOTTOM_COLOR_1)
            .addRectangle(dx + OUTLINE_WIDTH, dy, dw/2 - OUTLINE_WIDTH*2, midh, BOTTOM_COLOR_2)
            .addRectangle(dx + dw/2, dy, dw/2 - OUTLINE_WIDTH, midh, BOTTOM_COLOR_3)
            .addTriangle(
                new Vector2(dx + OUTLINE_WIDTH, dy + midh),
                new Vector2(midx + OUTLINE_WIDTH/2, dy + midh),
                new Vector2(midx + OUTLINE_WIDTH/2, midh + MAGIC_OFFSET),
                BOTTOM_COLOR_2)
            .addTriangle(
                new Vector2(dx + 0.75 * PLATFORM_SCALE - OUTLINE_WIDTH/2, dy + midh),
                new Vector2(dx + dw - OUTLINE_WIDTH, dy + midh),
                new Vector2(dx + 0.75 * PLATFORM_SCALE - OUTLINE_WIDTH/2, midh + MAGIC_OFFSET),
                BOTTOM_COLOR_3)
            .constructMesh(event);

        this.meshes[StageMesh.MovingPlatformTop] = (new ShapeGenerator())
            .addEllipse(0, dy, dw - OUTLINE_WIDTH*2, dh - OUTLINE_WIDTH*2, 6, TOP_COLOR)
            .constructMesh(event);

        this.meshes[StageMesh.MovingPlatformArrow] = (new ShapeGenerator())
            .addTriangle(
                new Vector2(-ARROW_WIDTH/2, ARROW_BOTTOM),
                new Vector2(0, ARROW_TOP),
                new Vector2(0, 0),
                ARROW_COLOR)
            .addTriangle(
                new Vector2(ARROW_WIDTH/2, ARROW_BOTTOM),
                new Vector2(0, ARROW_TOP),
                new Vector2(0, 0),
                ARROW_COLOR)
            .constructMesh(event);

        this.meshes[StageMesh.MovingPlatformShadow] = (new ShapeGenerator())
            .addEllipse(0.075, 0.1, dw, dh, 6, BLACK)
            .constructMesh(event);
    }


    private generateTogglableTileMeshes(tileWidth : number, tileHeight : number, event : CoreEvent) {

        const SHADOW_OFFSET_X = 0.15;
        const SHADOW_OFFSET_Y = 0.15;

        const BASE_SCALE = 0.70;
        const BASE_OUTLINE_WIDTH = 0.025;

        const DOT_DIAMETER = 0.15;

        const COLOR_1 = new RGBA(1.0, 0.55, 0.80);
        const COLOR_2 = new RGBA(0.67, 0.15, 0.40);
        const COLOR_3 = new RGBA(0.40, 0.0, 0.20);

        let ratio = tileHeight / tileWidth;

        let dx = -BASE_SCALE * tileWidth / 2.0;
        let dy = -(BASE_SCALE * tileHeight)/2.0 - (1.0 - tileHeight);
        let dw = BASE_SCALE * tileWidth;
        let dh = BASE_SCALE * tileHeight;

        let ow = BASE_OUTLINE_WIDTH;

        this.meshes[StageMesh.TogglableTileTop] = (new ShapeGenerator())
            .addRectangle(dx, dy, dw, dh, COLOR_1)
            .addRectangle(dx - ow, dy - ow, ow, dh + ow, BLACK)
            .addRectangle(dx + dw, dy - ow, ow, dh + ow, BLACK)
            .addRectangle(dx, dy - ow, dw, ow, BLACK)
            .addEllipse(0, dy + dh * 3 / 4, 
                DOT_DIAMETER, DOT_DIAMETER * ratio, 
                12, COLOR_3)
            // This is ugly but meh
            .addTriangle(
                new Vector2(dx + dw/2 - DOT_DIAMETER, dy + dh/8),
                new Vector2(dx + dw/2 + DOT_DIAMETER, dy + dh/8),
                new Vector2(dx + dw/2 - DOT_DIAMETER/3, dy + dh/1.75),
                COLOR_3)
            .addTriangle(
                new Vector2(dx + dw/2 - DOT_DIAMETER, dy + dh/8),
                new Vector2(dx + dw/2 + DOT_DIAMETER, dy + dh/8),
                new Vector2(dx + dw/2 + DOT_DIAMETER/3, dy + dh/1.75),
                COLOR_3)
            .addRectangle(
                dx + dw/2 - 
                DOT_DIAMETER/3, 
                dy + dh/8, 
                DOT_DIAMETER/3*2, 
                dh/1.7 - dh/8, 
                COLOR_3)
            .constructMesh(event);

        dy += BASE_SCALE * tileHeight;

        this.meshes[StageMesh.TogglableTileBottom] = (new ShapeGenerator())
            .addRectangle(dx, dy, dw, 1.0 - tileHeight - ow, COLOR_2)
            .addRectangle(dx, dy + (1.0 - tileHeight - ow), dw, ow, BLACK)
            .addRectangle(dx - ow, dy, ow, 1.0 - tileHeight, BLACK)
            .addRectangle(dx + dw, dy, ow, 1.0 - tileHeight, BLACK)
            .constructMesh(event);   

        let sx = SHADOW_OFFSET_X * PLATFORM_SCALE;
        let sy = SHADOW_OFFSET_Y * PLATFORM_SCALE;

        dh = BASE_SCALE * tileHeight;
        dy = -dh / 2;

        this.meshes[StageMesh.TogglableTileShadow] = (new ShapeGenerator())
            .addRectangle(
                dx - ow + sx, 
                dy - ow + sy, 
                dw + ow*2, 
                dh + ow*2, BLACK)
            .addTriangle(
                new Vector2(dx - ow, dy + dh),
                new Vector2(dx - ow + sx, dy + dh),
                new Vector2(dx - ow + sx, dy + dh + ow + sy),
                BLACK)
            .addTriangle(
                new Vector2(dx + dw + ow, dy - ow),
                new Vector2(dx + dw + ow + sx, dy - ow + sy),
                new Vector2(dx + dw + ow, dy - ow + sy),
                BLACK)
            .constructMesh(event);   
    }


    private generateButton(ratio : number, event : CoreEvent) {

        const BASE_OUTLINE_WIDTH = 0.025;
        const RADIUS = 0.25;
        const HEIGHT = 0.15;
        const QUALITY = 24;

        const SHADOW_OFFSET_X = 0.025;
        const SHADOW_OFFSET_Y = 0.05;

        const COLOR_1 = new RGBA(1.0, 0.55, 0.80);
        const COLOR_2 = new RGBA(0.67, 0.15, 0.40);

        let ow = BASE_OUTLINE_WIDTH;

        this.meshes[StageMesh.ButtonDown] = (new ShapeGenerator())
            .addEllipse(0, 0, RADIUS*2, 
                RADIUS*2 * ratio, QUALITY,
                BLACK)
            .addEllipse(0, 0, RADIUS*2 - ow*2, 
                RADIUS*2 * ratio - ow*2, QUALITY,
                COLOR_1)
            .constructMesh(event);

        this.meshes[StageMesh.ButtonUp] = (new ShapeGenerator())
            .addEllipse(0, 0, RADIUS*2, 
                RADIUS*2 * ratio, QUALITY,
                BLACK)
            .addEllipse(0, -HEIGHT, RADIUS*2, 
                RADIUS*2 * ratio, QUALITY,
                BLACK)
            .addRectangle(-RADIUS, -HEIGHT, RADIUS*2, HEIGHT, BLACK)
            .addEllipse(0, 0, 
                RADIUS*2 - ow*2, 
                RADIUS*2 * ratio - ow*2, 
                QUALITY, COLOR_2)
            .addRectangle(-RADIUS + ow, -HEIGHT, 
                RADIUS*2 - ow*2, HEIGHT, COLOR_2)
            .addEllipse(0, -HEIGHT, 
                RADIUS*2 - ow*2, 
                RADIUS*2 * ratio - ow*2, 
                QUALITY, COLOR_1)
            .constructMesh(event);

        this.meshes[StageMesh.ButtonShadow] = (new ShapeGenerator())
            .addEllipse(
                SHADOW_OFFSET_X, 
                SHADOW_OFFSET_Y, 
                (RADIUS + SHADOW_OFFSET_X)*2, RADIUS*2 * ratio, 
                QUALITY, BLACK)
            .constructMesh(event);
    }


    private generateFloorStar(tileWidth : number, tileHeight : number, event : CoreEvent) {

        const COLOR = new RGBA();

        this.meshes[StageMesh.FloorStar] = (new ShapeGenerator())
            .addStar(0, 0, 0.60, 1.0, 6, COLOR, -Math.PI*2 / 12,
                tileWidth, tileHeight)
            .constructMesh(event);
    }


    private generateFloorArrow(event : CoreEvent) {

        const WIDTH = 0.50;
        const HEIGHT = 0.25;
        const OUTLINE_WIDTH = 0.040;
        const BG_COLOR = new RGBA(0.33);

        this.meshes[StageMesh.FlooArrow] = (new ShapeGenerator())
            .addTriangle(
                new Vector2(-WIDTH/2 - OUTLINE_WIDTH, -HEIGHT/2),
                new Vector2(WIDTH/2 + OUTLINE_WIDTH, -HEIGHT/2),
                new Vector2(0, HEIGHT/2 + OUTLINE_WIDTH),
                BG_COLOR)
            .addRectangle(
                -WIDTH/2 - OUTLINE_WIDTH, -HEIGHT/2 - OUTLINE_WIDTH*0.67, 
                WIDTH + OUTLINE_WIDTH*2, OUTLINE_WIDTH*0.67, BG_COLOR)
            .addTriangle(
                new Vector2(-WIDTH/2, -HEIGHT/2),
                new Vector2(WIDTH/2, -HEIGHT/2),
                new Vector2(0, HEIGHT/2))
            .constructMesh(event);
    }


    private generateBlueButton(ratio : number, event : CoreEvent) {

        const BASE_OUTLINE_WIDTH = 0.033;

        const RADIUS = 0.45;
        const HEIGHT = 0.15;
 
        const COLOR_1 = new RGBA(0.075, 0.40, 0.70);
        const COLOR_2 = new RGBA(0.50, 0.80, 1.0);
        const COLOR_3 = new RGBA(0.0, 0.10, 0.33);

        const SHADOW_OFFSET_X = 0.05;
        const SHADOW_OFFSET_Y = 0.05;

        let rw = RADIUS;
        let rh = RADIUS * ratio;

        let ow = BASE_OUTLINE_WIDTH;
        let dy = -HEIGHT;

        this.meshes[StageMesh.BlueButtonUp] = (new ShapeGenerator())
            .addTriangle(
                new Vector2(0, dy - rh/2 - ow),
                new Vector2(-rw/2 - ow, dy),
                new Vector2(rw/2 + ow, dy),
                BLACK)
            .addRectangle(-rw/2 - ow, dy, rw + ow*2, -dy, BLACK)
            .addTriangle(
                new Vector2(0, rh/2 + ow),
                new Vector2(-rw/2 - ow, 0),
                new Vector2(rw/2 + ow, 0),
                BLACK)
            .addRectangle(-rw/2, dy, rw/2 + ow, -dy, COLOR_1)
            .addTriangle(
                new Vector2(0, rh/2),
                new Vector2(-rw/2, 0),
                new Vector2(0, 0),
                COLOR_1)
            .addRectangle(0, dy, rw/2, -dy, COLOR_3)
            .addTriangle(
                new Vector2(0, rh/2),
                new Vector2(rw/2, 0),
                new Vector2(0, 0),
                COLOR_3)
            .addTriangle(
                new Vector2(0, dy - rh/2),
                new Vector2(-rw/2, dy),
                new Vector2(rw/2, dy),
                COLOR_2)
            .addTriangle(
                new Vector2(0, dy + rh/2),
                new Vector2(-rw/2, dy),
                new Vector2(rw/2, dy),
                COLOR_2)  
            .constructMesh(event);

        this.meshes[StageMesh.BlueButtonDown] = (new ShapeGenerator())
            .addTriangle(
                new Vector2(0, -rh/2 - ow),
                new Vector2(-rw/2 - ow, 0),
                new Vector2(rw/2 + ow, 0),
                BLACK)
            .addTriangle(
                new Vector2(0, rh/2 + ow),
                new Vector2(-rw/2 - ow, 0),
                new Vector2(rw/2 + ow, 0),
                BLACK)
            .addTriangle(
                new Vector2(0, -rh/2),
                new Vector2(-rw/2, 0),
                new Vector2(rw/2, 0),
                COLOR_2)
            .addTriangle(
                new Vector2(0, rh/2),
                new Vector2(-rw/2, 0),
                new Vector2(rw/2, 0),
                COLOR_2)
            .constructMesh(event);

        let sx = SHADOW_OFFSET_X;
        let sy = SHADOW_OFFSET_Y * ratio;

        this.meshes[StageMesh.BlueButtonShadow] = (new ShapeGenerator())
            .addTriangle(
                new Vector2(sx, sy - rh/2 - ow),
                new Vector2(sx -rw/2 - ow, sy),
                new Vector2(sx + rw/2 + ow, sy),
                BLACK)
            .addTriangle(
                new Vector2(sx, sy + rh/2 + ow),
                new Vector2(sx - rw/2 - ow, sy),
                new Vector2(sx + rw/2 + ow, sy),
                BLACK)
            .constructMesh(event);
    }


    private generateSwitchingPlatform(tileWidth : number, tileHeight : number, event : CoreEvent) {

        const BASE_SCALE = 0.70;
        const BASE_OUTLINE_WIDTH = 0.025;

        const CIRCLE_OUTER_RADIUS = 0.70;
        const CIRCLE_INNER_RADIUS = 0.40;

        const COLOR_1 = new RGBA(0.80, 0.55, 1.0);
        const COLOR_2 = new RGBA(0.40, 0.15, 0.67);
        const COLOR_3 = new RGBA(0.20, 0.0, 0.40);

        let ow = BASE_OUTLINE_WIDTH;

        let dw = tileWidth * BASE_SCALE;
        let dh = tileHeight * BASE_SCALE;

        let th = 1.0 - tileHeight;
        let dy = -th;

        let ratio = tileHeight / tileWidth;
        let rw1 = CIRCLE_OUTER_RADIUS * BASE_SCALE;
        let rh1 = rw1 * ratio;
        let rw2 = CIRCLE_INNER_RADIUS * BASE_SCALE;
        let rh2 = rw2 * ratio;

        this.meshes[StageMesh.SwitchingPlatformBottom] = (new ShapeGenerator)
            .addRectangle(-dw/2 - ow, dy - dh/2 - ow, dw + ow*2, dh + th + ow*2, BLACK)
            .addRectangle(-dw/2, dy - dh/2, dw, dh + th, COLOR_2)
            .constructMesh(event);

        this.meshes[StageMesh.SwitchingPlatformTop] = (new ShapeGenerator)
            .addRectangle(-dw/2, dy - dh/2, dw, dh, COLOR_1)
            .addEllipse(0, dy, rw1, rh1, 32, COLOR_3)
            .addEllipse(0, dy, rw2, rh2, 32, COLOR_1)
            .constructMesh(event);

        this.meshes[StageMesh.SwitchingPlatformShadow] = this.meshes[StageMesh.TogglableTileShadow];
    }


    private generateMeshes(tileWidth : number, tileHeight : number, event : CoreEvent) {

        this.generatePlatformMeshes(tileWidth, tileHeight, event);
        this.generateOrbMeshes(event);
        this.generateMovingPlatformMeshes(tileWidth, tileHeight, event);
        this.generateTogglableTileMeshes(tileWidth, tileHeight, event);
        this.generateButton(tileHeight / tileWidth, event);
        this.generateFloorStar(tileWidth, tileHeight, event);
        this.generateFloorArrow(event);
        this.generateBlueButton(tileHeight / tileWidth, event);
        this.generateSwitchingPlatform(tileWidth, tileHeight, event);
    }


    public getMesh(type : StageMesh) : Mesh {

        return this.meshes[type];
    }


    public dispose(event : CoreEvent) {

        for (let i = 0; i < this.meshes.length; ++ i) {

            event.disposeMesh(this.meshes[i]);
        }
    }
}
