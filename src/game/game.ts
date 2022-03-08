import { Canvas, ShaderType } from "../core/canvas.js";
import { CoreEvent, Scene } from "../core/core.js";
import { State } from "../core/types.js";
import { Stage } from "./stage.js";



export class GameScene implements Scene {


    private stage : Stage;


    constructor(param : any, event : CoreEvent) {

        this.stage = new Stage(event, 1);
    }


    public update(event: CoreEvent) : void {

        this.stage.update(event);

        if (event.input.getAction("undo") == State.Pressed) {

            this.stage.undo();
        }

        if (event.input.getAction("restart") == State.Pressed) {

            this.stage.reset();
        }
    }


    public redraw(canvas: Canvas) : void {

        canvas.changeShader(ShaderType.NoTexture);
        canvas.resetVertexAndFragmentTransforms();
        canvas.setColor();

        canvas.transform
            .loadIdentity()
            .use();

        canvas.clear(0.33, 0.67, 1.0);

        this.stage.draw(canvas);
    }

    
    public dispose() : any {

        return <any> null;
    }
}
