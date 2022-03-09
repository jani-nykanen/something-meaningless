import { AssetManager } from "./assets.js";
import { Bitmap, FilterType } from "./bitmap.js";
import { Mesh } from "./mesh.js"
import { Shader } from "./shader.js";
import { FragmentSource, VertexSource } from "./shadersource.js";
import { Transformations } from "./transformations.js";
import { RGBA } from "./vector.js";


export const enum ShaderType {

    Textured = 0,
    NoTexture = 1,
    
    Last = 2,
};


export const enum Flip {

    None = 0,
    Horizontal = 1,
    Vertical = 2,
    Both = 3,
};


export const enum TextAlign {

    Left = 0,
    Center = 1,
    Right = 2
};


export const enum StencilCondition {

    Always = 0, 
    NotEqual = 1,
    Equal = 2,
    GreaterOrEqual = 3,
    LessOrEqual = 4,
    Less = 5,
    Greater = 6
};


export const enum StencilOperation {

    Keep = 0,
    Zero = 1, // hah
};


const createCanvasDiv = () : HTMLDivElement => {
    
    let cdiv = document.createElement("div");
    cdiv.setAttribute("style", 
        "position: absolute; top: 0; left: 0; z-index: -1;");
    
    return cdiv;
}


const createCanvas = (width : number, height : number, div : HTMLDivElement) : HTMLCanvasElement => {

    let canvas = document.createElement("canvas");   
    canvas.width = width;
    canvas.height = height;

    canvas.setAttribute(
        "style", 
        "position: absolute; top: 0; left: 0; z-index: -1;");
    div.appendChild(canvas);
    document.body.appendChild(div);

    return canvas;
}



export class Canvas {

    private canvas : HTMLCanvasElement;
    private glCtx : WebGLRenderingContext;

    private shaders : Array<Shader>;
    private activeShader : Shader;

    private activeMesh : Mesh;
    private activeTexture : Bitmap;
    private activeColor : RGBA;

    private rectangle : Mesh;

    public readonly transform : Transformations;
    public readonly assets : AssetManager;


    public get width() : number {

        return this.canvas.width;
    }
    public get height() : number {

        return this.canvas.height;
    }


    constructor(assets : AssetManager) {

        this.canvas = createCanvas(window.innerWidth, window.innerHeight,
            createCanvasDiv());
        this.glCtx = this.canvas.getContext("webgl", {alpha: false, antialias: true, stencil: true});
        this.resize(window.innerWidth, window.innerHeight);

        this.initOpenGL();

        window.addEventListener("resize", () => this.resize(
            window.innerWidth, window.innerHeight));

        this.shaders = new Array<Shader> (ShaderType.Last);

        this.shaders[ShaderType.Textured] = new Shader(this.glCtx, 
            VertexSource.Textured, FragmentSource.Textured); 
        this.shaders[ShaderType.NoTexture] = new Shader(this.glCtx, 
            VertexSource.NoTexture, FragmentSource.NoTexture); 

        this.activeShader = this.shaders[0];
        this.activeShader.use();

        this.rectangle = this.createRectangleMesh();
        this.rectangle.bind(this.glCtx);

        this.transform = new Transformations(this.activeShader);
        this.assets = assets;

        this.activeTexture = null;
        this.activeMesh = null;
        this.activeColor = new RGBA(1, 1, 1, 1);
    }


    private resize(width : number, height : number) {

        this.canvas.width = width;
        this.canvas.height = height;

        this.glCtx.viewport(0, 0, width, height);
    }


    private createRectangleMesh() : Mesh {

        return new Mesh(
            this.glCtx,
            new Float32Array([
                0, 0,
                1, 0,
                1, 1,
                0, 1,
            ]),
            new Uint16Array([
                0, 1, 2, 
                2, 3, 0
            ]),
            new Float32Array([
                0, 0,
                1, 0,
                1, 1,
                0, 1
            ]),
            new Float32Array([
                1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, 1, 1,
            ]));
    }


    private initOpenGL() {

        let gl = this.glCtx;

        gl.activeTexture(gl.TEXTURE0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, 
            gl.ONE_MINUS_SRC_ALPHA, gl.ONE, 
            gl.ONE_MINUS_SRC_ALPHA);

        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);  
        gl.stencilMask(0xff);
        gl.disable(gl.STENCIL_TEST);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);

        // gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }


    public clear(r = 1, g = 1, b = 1) {

        let gl = this.glCtx;

        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.clearColor(r, g, b, 1.0);
    }


    public bindMesh(mesh : Mesh) {

        if (this.activeMesh === mesh) return;

        mesh.bind(this.glCtx);

        // Otherwise we might get weird bugs, because
        // the rectangle mesh is bounded in the loading screen,
        // but new meshes is loaded during that
        // TODO: buuuuut not in this project, remove?
        if (this.assets.hasLoaded())
            this.activeMesh = mesh;
    }


    public rebindMesh() {
        
        this.activeMesh.bind(this.glCtx);
    }


    public bindTexture(bmp : Bitmap) {

        // TODO: why this?
        if (this.activeTexture === bmp) return;

        bmp.bind(this.glCtx);
        this.activeTexture = bmp;
    }


    public rebindTexture() {
        
        if (this.activeTexture !== null)
            this.activeTexture.bind(this.glCtx);
    }


    public resetVertexAndFragmentTransforms() {

        this.activeShader.setVertexTransform(0, 0, 1, 1);
        this.activeShader.setFragTransform(0, 0, 1, 1);
    }


    public setVertexTransform(x : number, y : number,
        w : number, h : number) {

        this.activeShader.setVertexTransform(x, y, w, h);
    }


    public setFragmentTransform(x : number, y : number,
        w : number, h : number) {

        this.activeShader.setFragTransform(x, y, w, h);
    }
    

    private useShader(newShader : Shader) {

        if (newShader === null ||
            newShader === this.activeShader) return;

        this.activeShader = newShader;
        this.activeShader.use();

        this.transform.setActiveShader(this.activeShader);
        this.transform.use();    

        this.activeShader.setColor(
            this.activeColor.r, 
            this.activeColor.g, 
            this.activeColor.b, 
            this.activeColor.a);
    }


    public changeShader(type : ShaderType) {

        // Shouldn't even be possible
        if (type < 0 || type >= ShaderType.Last)
            return;

        this.useShader(this.shaders[type]);
    }


    public setColor(r = 1, g = r, b = g, a = 1) {

        this.activeShader.setColor(r, g, b, a);

        this.activeColor = new RGBA(r, g, b, a);
    }


    public fillRect(x = 0, y = 0, w = this.width, h = this.height) {

        this.activeShader.setVertexTransform(x, y, w, h);

        this.bindMesh(this.rectangle);
        this.rectangle.draw(this.glCtx);
    }



    public drawBitmap(bmp : Bitmap, 
        dx : number, dy : number, dw = bmp.width, dh = bmp.height) {

        this.drawBitmapRegion(bmp, 0, 0, bmp.width, bmp.height,
            dx, dy, dw, dh);
    }


    public drawBitmapRegion(bmp : Bitmap, 
        sx : number, sy : number, sw : number, sh : number,
        dx : number, dy : number, dw = sw, dh = sh) {

        this.activeShader.setVertexTransform(dx, dy, dw, dh);
        this.activeShader.setFragTransform(
            sx / bmp.width, sy / bmp.height, 
            sw / bmp.width, sh / bmp.height);

        this.bindMesh(this.rectangle);
        this.bindTexture(bmp);

        this.rectangle.draw(this.glCtx);
    }


    public drawText(font : Bitmap, str : string, 
        dx : number, dy : number, 
        xoff = 0.0, yoff = 0.0, align = TextAlign.Center, scalex = 1, scaley = 1,
        wave = 0.0, amplitude = 0.0, period = 0.0) {

        let cw = (font.width / 16) | 0;
        let ch = cw;

        let x = dx;
        let y = dy;
        let chr : number;

        let yoffset : number;
        
        if (align == TextAlign.Center) {

            dx -= ((str.length+1) * (cw + xoff) * scalex)/ 2.0 ;
            x = dx;
        }
        else if (align == TextAlign.Right) {
            
            dx -= ((str.length) * (cw + xoff) * scalex);
            x = dx;
        }

        for (let i = 0; i < str.length; ++ i) {

            chr = str.charCodeAt(i);
            if (chr == '\n'.charCodeAt(0)) {

                x = dx;
                y += (ch + yoff) * scaley;
                continue;
            }

            yoffset = Math.sin(wave + i * period) * amplitude;

            this.drawBitmapRegion(
                font, 
                (chr % 16) * cw, ((chr/16)|0) * ch,
                cw, ch, 
                x, y + yoffset, 
                cw * scalex, ch * scaley);

            x += (cw + xoff) * scalex;
        }
    }


    public drawMesh(mesh : Mesh) {

        this.bindMesh(mesh);
        mesh.draw(this.glCtx);
    }


    public createBitmap(image : HTMLImageElement, repeatFlag = 0) : Bitmap {

        return new Bitmap(this.glCtx, image, null, repeatFlag);
    }


    public constructMesh = (vertices : Float32Array, 
        indices : Uint16Array,
        textureCoordinates? : Float32Array,
        colors? : Float32Array) : Mesh => 
            (new Mesh(this.glCtx, vertices, indices, textureCoordinates, colors));

    
    public destroyMesh(mesh : Mesh) {

        mesh.dispose(this.glCtx);
    }


    public clearStencilBuffer() {

        let gl = this.glCtx;

        gl.clear(gl.STENCIL_BUFFER_BIT);
    }


    public toggleStencilTest(state : boolean) {

        let gl = this.glCtx;

        if (state) {

            gl.enable(gl.STENCIL_TEST);
        }
        else {

            gl.disable(gl.STENCIL_TEST);
        }
    }


    public setStencilCondition(cond : StencilCondition) {

        let gl = this.glCtx;

        const LOOKUP = [gl.ALWAYS, gl.NOTEQUAL, gl.EQUAL, gl.GEQUAL, gl.LEQUAL, gl.LESS, gl.GREATER];

        gl.stencilFunc(LOOKUP[cond], 1, 0xff);
    }


    public setStencilOperation(op : StencilOperation) {

        let gl = this.glCtx;

        const LOOKUP = [gl.KEEP, gl.ZERO];
        const TEST = [gl.REPLACE, gl.ZERO]

        gl.stencilOp(LOOKUP[op], LOOKUP[op], TEST[op]);
    }
}
