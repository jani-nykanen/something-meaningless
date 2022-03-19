import { Canvas } from "../core/canvas.js";
import { CoreEvent } from "../core/core.js";
import { Mesh } from "../core/mesh.js";
import { GameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";



export class Orb extends GameObject {


    private readonly meshOrb : Mesh;
    private readonly meshShadow : Mesh;


    private wave : number;


    constructor(x : number, y : number,
        meshOrb : Mesh,
        meshShadow : Mesh) {
        
        super(x, y, true);

        const WAVE_BONUS_RANGE = Math.PI/2;

        this.meshOrb = meshOrb;
        this.meshShadow = meshShadow;

        this.wave = (x % 2 == y % 2) ? Math.PI : 0.0;
        this.wave += (Math.random() * 2 - 1.0) * WAVE_BONUS_RANGE; 
    }


    public recreate(x : number, y : number) {

        this.pos.x = x;
        this.pos.y = y;

        // this.wave = (x % 2 == y % 2) ? Math.PI : 0.0;

        this.exist = true;
    }


    public update(player : Player, stage : Stage, event : CoreEvent) {

        const WAVE_SPEED = 0.05;

        if (!this.exist) return;

        let px = this.pos.x | 0;
        let py = this.pos.y | 0;

        let p = player.getPosition();

        p.x |= 0;
        p.y |= 0;

        if (!player.isMoving() &&
            stage.getTile(1, px, py) != 4) {

            this.exist = false;

            stage.spawnStars(this.pos.x, this.pos.y - 0.20, 6);
            stage.recomputeOrbs();
        }

        this.wave = (this.wave + WAVE_SPEED * event.step) % (Math.PI*2);
    }


    private setTransform(canvas : Canvas, tileWidth: number, tileHeight: number, yoff = 0, scale = 1.0) {

        canvas.transform
            .push()
            .translate(
                this.pos.x * tileWidth, 
                this.pos.y * tileHeight + yoff)
            .scale(scale, scale)
            .use();
    }


    public drawShadow(canvas: Canvas, tileWidth: number, tileHeight: number, offset = 0.0) {
        
        const BASE_SCALE = 0.85;
        const SCALE_AMPLITUDE = 0.05;

        if (!this.exist) return;

        let scale = BASE_SCALE + Math.sin(this.wave) * SCALE_AMPLITUDE;

        this.setTransform(canvas, tileWidth, tileHeight, 0.0, scale);

        canvas.drawMesh(this.meshShadow);

        canvas.transform
            .pop()
            .use();
    }


    public draw(canvas: Canvas, tileWidth: number, tileHeight: number) {
        
        const BASE_OFFSET = -0.40;
        const AMPLITUDE = 0.05;

        if (!this.exist) return;

        let offset = BASE_OFFSET + Math.sin(this.wave) * AMPLITUDE;

        this.setTransform(canvas, tileWidth, tileHeight, offset);

        canvas.drawMesh(this.meshOrb);

        canvas.transform
            .pop()
            .use();
    }


    public depth = () : number => {
        
        const EPS = 0.00001;
        return this.pos.y - EPS;
    }
}
