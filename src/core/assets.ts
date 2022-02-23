import { AudioPlayer } from "./audioplayer.js";
import { Bitmap } from "./bitmap.js";
import { Canvas } from "./canvas.js";
import { AudioSample } from "./sample.js";
import { Tilemap } from "./tilemap.js";
import { KeyValuePair } from "./types.js";


class AssetContainer<T> {


    private assets : Array<KeyValuePair<T>>;


    constructor() {

        this.assets = new Array<KeyValuePair<T>> ();
    }


    public getAsset(name : string) : T {

        for (let a of this.assets) {

            if (a.key == name)
                return a.value;
        }

        return null;
    }


    public addAsset(name : string, data : T) {

        this.assets.push(new KeyValuePair<T>(name, data));
    }

}


export class AssetManager {


    private bitmaps : AssetContainer<Bitmap>;
    private samples : AssetContainer<AudioSample>;
    private tilemaps : AssetContainer<Tilemap>;
    private documents : AssetContainer<string>;

    private loaded : number;
    private total : number;
    
    private readonly audio : AudioPlayer;
    private canvas : Canvas;


    constructor(audio : AudioPlayer) {

        this.bitmaps = new AssetContainer<Bitmap> ();
        this.samples = new AssetContainer<AudioSample> ();
        this.tilemaps = new AssetContainer<Tilemap> ();
        this.documents = new AssetContainer<string> ();

        this.total = 0;
        this.loaded = 0;

        this.audio = audio;
    }


    public setCanvas(canvas : Canvas) {

        this.canvas = canvas;
    }


    private loadTextFile(path : string, type : string, cb : (s : string) => void) {
        
        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("text/" + type);
        xobj.open("GET", path, true);

        ++ this.total;

        xobj.onreadystatechange = () => {

            if (xobj.readyState == 4 ) {

                if(String(xobj.status) == "200") {
                    
                    if (cb != undefined)
                        cb(xobj.responseText);
                }
                ++ this.loaded;
            }
                
        };
        xobj.send(null);  
    }


    public loadBitmap(name : string, url : string) {

        ++ this.total;

        let image = new Image();
        image.onload = () => {

            ++ this.loaded;
            this.bitmaps.addAsset(name, this.canvas.createBitmap(image));
            this.canvas.rebindTexture();
        }
        image.src = url;
    }


    public loadSample(name : string, path : string) {

        ++ this.total;

        let xobj = new XMLHttpRequest();
        xobj.open("GET", path, true);
        xobj.responseType = "arraybuffer";

        xobj.onload = () => {

            this.audio.getContext().decodeAudioData(xobj.response, (data) => {
                
                ++ this.loaded;
                this.samples.addAsset(name, new AudioSample(this.audio.getContext(), data));

            });
        }
        xobj.send(null);
    }


    public loadTilemap(name : string, url : string) {

        ++ this.total;
        
        this.loadTextFile(url, "xml", (str : string) => {

            this.tilemaps.addAsset(name, new Tilemap(str));
            ++ this.loaded;
        });
    }


    public loadDocument(name : string, url : string) {

        ++ this.total;
        
        this.loadTextFile(url, "xml", (str : string) => {

            this.documents.addAsset(name, str);
            ++ this.loaded;
        });
    }


    private loadItems(jsonData : any,
        cb : (name : string, url : string) => void, 
        basePath : string, arrayName : string) {
        
        let path : string;

        if (jsonData[basePath] != undefined &&
            jsonData[arrayName] != undefined) {
                    
            path = jsonData[basePath];
            for (let o of jsonData[arrayName]) {

                cb(o["name"], path + o["path"]);
            }
        }
    }


    public parseAssetIndexFile(url : string) {

        this.loadTextFile(url, "json", (s : string) => {

            let data = JSON.parse(s);

            this.loadItems(data, 
                (name, url) => this.loadBitmap(name, url), 
                "bitmapPath", "bitmaps");

            this.loadItems(data, 
                (name, url) => this.loadSample(name, url), 
                "samplePath", "samples");

            this.loadItems(data, 
                (name, url) => this.loadTilemap(name, url), 
                "tilemapPath", "tilemaps");

            this.loadItems(data, 
                (name, url) => this.loadDocument(name, url), 
                "documentPath", "documents");
        });
    }


    public hasLoaded() : boolean {

        return this.total == 0 || this.loaded >= this.total;
    }
    

    public getBitmap = (name : string) : Bitmap => this.bitmaps.getAsset(name);
    public getSample = (name : string) : AudioSample => this.samples.getAsset(name);
    public getTilemap = (name : string) : Tilemap => this.tilemaps.getAsset(name);
    public getDocument = (name : string) : string =>  this.documents.getAsset(name);
    

    public dataLoadedUnit() : number {

        return this.total == 0 ? 1.0 : this.loaded / this.total;
    }
}
