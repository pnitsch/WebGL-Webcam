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
