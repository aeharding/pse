/*
    Author:   Alexander Harding
              Trace Center
              University of Wisconsin at Madison
            
    Desc:     Designed to reduce the chance of causing an epileptic fit due
							to flashing content on the web that users with Photosensitive 
							Epilepsy can experience.
              
    License:  Copyright 2012 Trace Center

                 Licensed under the Apache License, Version 2.0 (the "License");
                 you may not use this file except in compliance with the License.
                 You may obtain a copy of the License at

                     http://www.apache.org/licenses/LICENSE-2.0

                 Unless required by applicable law or agreed to in writing, software
                 distributed under the License is distributed on an "AS IS" BASIS,
                 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                 See the License for the specific language governing permissions and
                 limitations under the License.
                 
   Scripts:   No 3rd party scripts are used in this version.
*/
function isUrl(s) {
	var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
	return regexp.test(s);
}

// Converts image to canvas; returns new canvas element
function convertImageToCanvas(image) {
  var canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext("2d").drawImage(image, 0, 0);

  return canvas;
}

function resizeCanvas(canvas, width, height) {
	var newCanvas = document.createElement('canvas');
	newCanvas.width = canvas.width;
	newCanvas.height = canvas.height;

	// save your canvas into temp canvas
	newCanvas.getContext('2d').drawImage(canvas, 0, 0);

	// resize my canvas as needed, probably in response to mouse events
	canvas.width = width;
	canvas.height = height;

	// draw temp canvas back into myCanvas, scaled as needed
	canvas.getContext('2d').drawImage(newCanvas, 0, 0, newCanvas.width, newCanvas.height, 0, 0, canvas.width, canvas.height);
	return canvas;
}

var imgA = new Image();
var imgB = new Image();
var canvasA;
var canvasB;
var imageAData;
var imageBData;
var imageTmpData;
/*imgA.onload = function () {
	context.drawImage(this, 0, 0, canvas.width, canvas.height);
}
imgB.onload = function () {
	context.drawImage(this, 0, 0, canvas.width, canvas.height);
}*/
var FPS = 10;
var QUALITY = 50;
timer = setInterval(function() {
	chrome.tabs.getSelected(null,function(tab) {
			var tablink = tab.url;
			if(isUrl(tablink)) {
				chrome.tabs.captureVisibleTab(null, {quality: QUALITY},
				function(img) {
					imageTmpData = imageAData;
					
					imgA.src = img;
					canvasA = convertImageToCanvas(imgA);
					try {
						canvasA = resizeCanvas(canvasA,300,300);
						var context = canvasA.getContext('2d');
						imageAData = context.getImageData(0, 0, canvasA.width, canvasA.height);
						
						imageBData = imageTmpData;
					} catch(e) {
						// Problem generating screenshot. Use old.
						//console.log("Couldn't keep up.");
					}
					try {
						var diff = 0;
						var i;
						for(i = 0; i < imageAData.data.length; i++) {
							if(imageAData.data[i] != imageBData.data[i]) {
								diff++;
							}
						}
						if(Math.round((diff/imageAData.data.length)*100) > 10) {
							console.log("Warning! Flashing stuff!");
						}
					} catch(e) {
						// Couldn't work... Ignore
					}
					
				});
			}
	});
}, 1000 / FPS);