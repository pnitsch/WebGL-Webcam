/* 
WebGL Webcam Experiment by Peter Nitsch - http://www.peternitsch.net
github - https://github.com/pnitsch/WebGL-Webcam

Dependancies: 
metalbot's Alchemy JPEG encoder - http://www.websector.de/blog/2009/06/21/speed-up-jpeg-encoding-using-alchemy/
Bloodhound's haXe crypto library - http://www.blooddy.by/en/crypto/

Copyright (c) 2010 Peter Nitsch

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE. */

package {
	import by.blooddy.crypto.Base64;
	import cmodule.as3_jpeg_wrapper.CLibInit;
	
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.display.StageQuality;
	import flash.display.StageScaleMode;
	import flash.events.ActivityEvent;
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.media.Camera;
	import flash.media.Video;
	import flash.net.SharedObject;
	import flash.system.Security;
	import flash.utils.ByteArray;

	[SWF(width="320", height="240", frameRate="30", backgroundColor="#000000")]
	final public class WebCamInferface extends Sprite
	{
		const WIDTH:int = 128;
		const HEIGHT:int = 128;
		
		var camera:Camera;
		var video:Video;
		var canvas:Bitmap;
		var data:ByteArray;
		
		var alcLib:Object;
		var alchemyMemory:ByteArray;
		var bitmapPointer : uint; 
		var stringPointer : uint; 
		
		var so:SharedObject;
		
		private var as3_jpeg_wrapper: Object;
		
		public function WebCamInferface()
		{
			Security.allowDomain("*");
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.align = StageAlign.TOP_LEFT;
			stage.quality = StageQuality.LOW;
			
			init();
			
			var loader:CLibInit = new CLibInit;
			as3_jpeg_wrapper = loader.init();
		}
		
		var errorDot:Sprite;
		
		function init():void {
			camera = Camera.getCamera();
			camera.addEventListener(ActivityEvent.ACTIVITY, handleCamera);
			video = new Video(WIDTH, HEIGHT); 
			video.attachCamera(camera);
			addChild(video);
			canvas = new Bitmap(new BitmapData(video.width, video.height, false, 0), "auto", true);
			addChild(canvas);
			 
			errorDot = new Sprite();
			errorDot.graphics.beginFill(0xff2200);
			errorDot.graphics.drawCircle(0, 0, 20);
			errorDot.x = this.stage.stageWidth/2;
			errorDot.y = this.stage.stageHeight/2;
		}
		
		function handleCamera(e:ActivityEvent):void {
			camera.removeEventListener(ActivityEvent.ACTIVITY, handleCamera);
			this.addEventListener(Event.ENTER_FRAME, handleFrame);
			//handleFrame();
		}
		 
		var s1:String
		var baSource: ByteArray = new ByteArray();								
		var baAlchmey: ByteArray = new ByteArray();	 
		 
		function handleFrame(e:Event=null):void {
			
			// draw the video frame
			canvas.bitmapData.lock(); canvas.bitmapData.draw(video); canvas.bitmapData.unlock();
			
			baSource.clear();
			baAlchmey.clear();
			
			// grab data
			baSource = canvas.bitmapData.clone().getPixels( canvas.bitmapData.rect );								
			
			// encode jpeg
			baAlchmey = as3_jpeg_wrapper.write_jpeg_file(baSource, WIDTH, HEIGHT, 3, 2, 100);	
			
			// encode base64
			s1 = by.blooddy.crypto.Base64.encode( baAlchmey, true );
			
			// send to js
			try{
 				ExternalInterface.call("fromFlash", "data: ", s1);
 			} catch(e:Error){
 				trace(e);
 				if(!this.contains(errorDot)) addChild(errorDot);
 			}
			
		}
		
	}
}
