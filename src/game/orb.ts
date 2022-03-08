import { Mesh } from "../core/mesh.js";
import { GameObject } from "./gameobject.js";



export class Orb extends GameObject {


    private readonly meshOrb : Mesh;
    private readonly meshShadow : Mesh;


    constructor(x : number, y : number,
        meshOrb : Mesh,
        meshShadow : Mesh) {
        
        super(x, y);

        this.meshOrb = meshOrb;
        this.meshShadow = meshShadow;
    }
}
