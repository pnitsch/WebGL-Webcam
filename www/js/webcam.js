var shaders = {};
var gl;
var canvas;
var sp, va, na, va, ta, t;
var mvUniform, tex0Uniform, rotUniform, pUniform;

var rotMatrix = $M([[1, 0, 0], [0, 0, -1], [0, 1, 0]]);
const rotUnitToAngle = Math.PI / 180;

var pMatrix;
var texid;

function perspective(fovy, aspect, znear, zfar) {
	pMatrix = makePerspective(fovy, aspect, znear, zfar)
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript)
        return null;

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function multMatrix(m) {
	mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
	var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
	multMatrix(m);
}

function setMatrixParam(param, matrix) {
	gl.uniformMatrix4fv(param, false, new Float32Array(matrix.make4x4().flatten()));
}

function doRotate(units, v) {
	var angle = units * rotUnitToAngle;
	v = rotMatrix.inv().x($V(v));
	rotMatrix = rotMatrix.x(Matrix.Rotation(angle, v));
	setMatrixParam(rotUniform, rotMatrix);
}

function init() {
	canvas = document.getElementById("canvas");
	
	gl = canvas.getContext("experimental-webgl");
	
	if (!("sp" in shaders)) {
		shaders.fs = getShader(gl, "shader-fs");
		shaders.vs = getShader(gl, "shader-vs");

		shaders.sp = gl.createProgram();
		gl.attachShader(shaders.sp, shaders.vs);
		gl.attachShader(shaders.sp, shaders.fs);
		gl.linkProgram(shaders.sp);

		if (!gl.getProgramParameter(shaders.sp, gl.LINK_STATUS)) {
			alert(gl.getProgramInfoLog(shader.sp));
		}

		gl.useProgram(shaders.sp);
	}

	sp = shaders.sp;
	va = gl.getAttribLocation(sp, "aVertex");
	ta = gl.getAttribLocation(sp, "aTexCoord0");

	pUniform = gl.getUniformLocation(sp, "uPMatrix");
	mvUniform = gl.getUniformLocation(sp, "uMVMatrix");
	tex0Uniform = gl.getUniformLocation(sp, "uTexture0");
	rotUniform = gl.getUniformLocation(sp, "uRotMatrix");
	
	t = gl.getUniformLocation(sp, "time");		
}

function initMouse() {
	var mouseDown = false;
	var lastMousePos;

	canvas.addEventListener("mousedown", function(ev) {
		mouseDown = true;
		lastMousePos = [ev.screenX, ev.screenY];
		return true;
	}, false);

	canvas.addEventListener("mousemove", function(ev) {
		if (!mouseDown)
		  return false;

		if (ev.screenX - lastMousePos[0])
		  doRotate(ev.screenX - lastMousePos[0], [0,1,0]);
		if (ev.screenY - lastMousePos[1])
		  doRotate(ev.screenY - lastMousePos[1], [1,0,0]);

		lastMousePos = [ev.screenX, ev.screenY];

		draw();
		return true;
	}, false);

	canvas.addEventListener("mouseup", function(ev) {
		mouseDown = false;
	}, false);

	canvas.addEventListener("mouseout", function(ev) {
		mouseDown = false;
	}, false);
}

function initKeyboard() {
	window.addEventListener("keyup", function(e) {
		
		if(e.keyCode-48 < 8){
			iterations = e.keyCode-48;
			gl.deleteBuffer(vBuffer);
			//gl.disableVertexAttribArray(va);
			gl.deleteBuffer(tBuffer);
			//gl.disableVertexAttribArray(ta);
			gl.deleteBuffer(ind);
			generate();
		}
		
		if(e.keyCode == 81) tValue = 1;
		else if(e.keyCode == 87) tValue = 0;
		
	}, false);
}

var i=0, mesh=[];
var a=0, b=0;
var tValue = 0;

function draw() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	perspective(45, 1.0, 0.1, 100.0);
	
	setMatrixParam(pUniform, pMatrix);
	setMatrixParam(mvUniform, mvMatrix);
	
	doRotate(0.3, [1,0,0]);
	doRotate(0.3, [0,1,0]);
	doRotate(0.3, [0,0,1]);
	
	gl.uniform1f(t, tValue);

	gl.drawElements(gl.TRIANGLES, l, gl.UNSIGNED_SHORT, 0);
}

var k=0, l=0, m=0;
var indices=[];
var textures=[];
var ind;

function gen(itr, s, x, y, z){
	if (itr) {
		itr--;
		s /= 2;
		gen(itr, s, x+s, y+s, z+s);
		gen(itr, s, x+s, y-s, z-s);
		gen(itr, s, x-s, y-s, z+s);
		gen(itr, s, x-s, y+s, z-s);
		return;
	}
	
	mesh[i]=x+s;
	mesh[i+1]=y+s;
	mesh[i+2]=z+s;
	textures[m]=0;
	textures[m+1]=0.2;
	
	mesh[i+3]=x-s;
	mesh[i+4]=y-s;
	mesh[i+5]=z+s;
	textures[m+2]=0.5;
	textures[m+3]=1.0;
	
	mesh[i+6]=x-s;
	mesh[i+7]=y+s;
	mesh[i+8]=z-s;
	textures[m+4]=1.0;
	textures[m+5]=0.5;
	
	mesh[i+9]=x+s;
	mesh[i+10]=y-s;
	mesh[i+11]=z-s;
	textures[m+6]=1;
	textures[m+7]=1;
	
	indices[l] = k;
	indices[l+1] = k+1;
	indices[l+2] = k+2;
	
	indices[l+3] = k+3;
	indices[l+4] = k;
	indices[l+5] = k+1;
	
	indices[l+6] = k+3;
	indices[l+7] = k;
	indices[l+8] = k+2;
	
	indices[l+9] = k+3;
	indices[l+10] = k+1;
	indices[l+11] = k+2;
	
	i+=12;
	k+=4;
	l+=12;
	m+=8;
}

function updateTexture() {  
  	gl.bindTexture(gl.TEXTURE_2D, texid);  
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.generateMipmap(gl.TEXTURE_2D);
}

var iterations = 0;
var vBuffer, tBuffer;

function generate() {
	i=0; k=0, l=0, m=0;
	mesh=[];
	indices=[];
	textures=[];

	gen(iterations, 2.0, 0, 0, 0);
	
	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
	gl.vertexAttribPointer(va, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(va);
	
	tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STATIC_DRAW);
	gl.vertexAttribPointer(ta, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(ta);
	
	ind=gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ind);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);	
}

function renderStart() {
	init();
	initMouse();
	initKeyboard();

  	generate();

	setMatrixParam(rotUniform, rotMatrix);
	m = makeLookAt(0, 0, -0.5, 0,0,0, 0,1,0);
  	mvMult(m);
	mvScale([1,1,-1]);
	mvTranslate([0.0, 0.0, -10.1]);
	
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
		
	img.onload = function(){  

		if(firstTime){
			texid = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0);
			gl.uniform1i(tex0Uniform, 0);
			gl.enable(gl.TEXTURING);
			gl.enable(gl.TEXTURE_2D);

			updateTexture();
			draw();

			setInterval(function() { 
				updateTexture();
				draw();
			}, 10);

			firstTime = false;
		}

	}
	
	
}

var img = new Image;
var firstTime = true;
var firstTimeFlash = true;

function fromFlash(event, value) {
	if(firstTimeFlash){
		$("#flashContent").css("margin-top","-3000px");
		$("#webgl").css("margin-top","-150px");
		$("#webgl").css("visibility","visible");
		renderStart();
		
		firstTimeFlash = false;
	} else {
		img.src = "data:image/jpg;base64,"+value;
	}
}

swfobject.embedSWF("swf/WebCamInferface.swf", "flashContent", "320", "240", "10.1", "js/expressInstall.swf", {}, {menu:"false", allowScriptAccess:"sameDomain"}, {} );
