

export const VertexSource = {

Textured : 
    
`
attribute vec2 vertexPos;
attribute vec2 vertexUV;
attribute vec4 vertexColor;

uniform mat3 transform;

uniform vec2 pos;
uniform vec2 scale;

varying vec2 uv;
varying vec4 vcolor;


void main() {

    gl_Position = vec4(transform * vec3(vertexPos * scale + pos, 1), 1);
    uv = vertexUV;
    vcolor = vertexColor;
}`,

NoTexture : 
    
`
attribute vec2 vertexPos;
attribute vec2 vertexUV;
attribute vec4 vertexColor;

uniform mat3 transform;

uniform vec2 pos;
uniform vec2 scale;

varying vec4 vcolor;


void main() {

    gl_Position = vec4(transform * vec3(vertexPos * scale + pos, 1), 1);
    vcolor = vertexColor;
}`

};


export const FragmentSource = {

Textured : 

`
precision mediump float;
     
uniform sampler2D texSampler;

uniform vec4 color;

uniform vec2 texPos;
uniform vec2 texScale;

varying vec2 uv;
varying vec4 vcolor;


void main() {

    vec2 tex = uv * texScale + texPos;    
    vec4 res = texture2D(texSampler, tex) * vcolor * color;

    if(res.a <= 0.01) {
         discard;
    }
    gl_FragColor = color;
}`,


NoTexture : 

`
precision mediump float;

uniform vec4 color;
varying vec4 vcolor;


void main() {

    gl_FragColor = vcolor * color;
}`

};
