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
var lumPrev;
var lumCurr;
var lumDiff;
var posfail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var negfail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var LRGH = 175 - (175/3);
var LRGW = 175 - (175/3);
var SMLH = 175 / 3;
var SMLW = 175 / 3;
var THRESH = (SMLH*SMLW) / 4;
//Rposfail[32] ={0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
//Rnegfail[32] ={0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}; //Failure history variables
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
					lumPrev = lumCurr;
					
					imgA.src = img;
					canvasA = convertImageToCanvas(imgA);
					try {
						canvasA = resizeCanvas(canvasA,175,175);
						var context = canvasA.getContext('2d');
						imageAData = context.getImageData(0, 0, canvasA.width, canvasA.height);
					} catch(e) {
						// Problem generating screenshot. Use old.
						//console.log("Couldn't keep up.");
					}
					//try {						
						var red;
						var green;
						var blue;
						lumCurr = new Array(imageAData.height);
						/* sRGB TO RELATIVE LUMINANCE */
						for (var j = 0; j < lumCurr.length; j++) {
							lumCurr[j] = new Array(imageAData.width);
							for (var i = 0; i < (175*4); ) {//lumCurr[j].length
								/*if (imageAData.data[(j*175)+i]/255 <= 0.03928) { // R
									red = (imageAData.data[(j*175)+i]/255)/12.92;
								} else {
									red = Math.pow((((imageAData.data[(j*175)+i])/255+0.055)/1.055),2.4);
								}*/
								red = imageAData.data[(j*175)+i]/255;
								i++;
								/*if (imageAData.data[(j*175)+i]/255 <= 0.03928) { // G
									green = (imageAData.data[(j*175)+i]/255)/12.92;
								} else {
									green = Math.pow((((imageAData.data[(j*175)+i])/255+0.055)/1.055),2.4);
								}*/
								green = imageAData.data[(j*175)+i]/255;
								i++;
								/*if (imageAData.data[(j*175)+i]/255 <= 0.03928) { // B
									blue = (imageAData.data[(j*175)+i]/255)/12.92;
								} else {
									blue = Math.pow((((imageAData.data[(j*175)+i])/255+0.055)/1.055),2.4);
								}*/
								blue = imageAData.data[(j*175)+i]/255;
								i += 2;
								lumCurr[j][(i/4)-1] = (0.2126*red)+(0.7152*green)+(0.0722*blue); //Luminance calc
								/*redCurr[j][i/3] = (red-green-blue)*320; //Red calcs ...
								if ((red)/(red+green+blue) >= 0.8)
								{
									satPrev[j][i/3] = 1;
								}
								if(redCurr[j][i/3] < 0.0)
								{
									redCurr[j][i/3] = 0.0;
								}*/
							}
						}
						
						/* THRESHOLD ADJUSTING before runthrough */
						lumDiff = new Array(175);
						for(var i = 0; i < 175; i++) {
							lumDiff[i] = new Array(175);
						}
            for (var j = 0; j < 175; j++) {
                for (var i = 0; i < 175; i++) {
                    lumDiff[j][i] = lumPrev[j][i] - lumCurr[j][i]; //Find difference frame
                    
                    /*if (lumPrev[j][i] <= lumCurr[j][i]) {
                        if(lumPrev[j][i] >= 0.8) {
                            lumDiff[j][i] = 0.0;
                        }
                    } else {
                        if(lumCurr[j][i] >= 0.8) {
                            lumDiff[j][i] = 0.0;
                        }
                    }*/
                    
                    //redDiff[j][i] = redCurr[j][i] - redPrev[j][i]; //Red flash
                    
                    //if(satPrev[j][i]==1 || satCurr[j][i]==1){
                    //    redDiff[j][i] = 0.0;
                    //}
                }
            }
						
						
					//} catch(e) {
						// Couldn't work... Ignore
						//console.log(e);
					//}
					var n;
					var m;
					var j;
					var i;
					/*for(n = 0; n < LRGH; n++) { //Loop moving box on height. 
						//if (posfail[0]!=0 && negfail[0]!=0) break;
						for(m = 0; m < LRGW; m++) { //Loop moving box on width.
							var poscount = 0;
							var negcount = 0;
							//int Rposcount=0, Rnegcount=0;
							for(j = n; j < n+SMLH; j++) { //Analyze pixels in box.
								for(i = m; i < m+SMLW; i++) {
									if(lumDiff[j][i] > 0.1) poscount++;
									if(lumDiff[j][i] < -0.1) negcount++;
									
									//if(redDiff[j][i] > 20) Rposcount++;
									//if(redDiff[j][i] < -20) Rnegcount++;
								}
							}
							if(poscount > THRESH) posfail[0]++;
							if(negcount > THRESH) negfail[0]++;
							//if(Rposcount > THRESH) Rposfail[0]++;
							//if(Rnegcount > THRESH) Rnegfail[0]++;
							////if (posfail[0]!=0 && negfail[0]!=0) break;
						}
					}*/
					var negcount = 0;
					var poscount = 0;
					for(var i = 0; i < 175; i++) {
						for(var j = 0; j < 175; j++) {
					if(lumDiff[j][i] > 0.1) poscount++;
									if(lumDiff[j][i] < -0.1) negcount++;
					}}
					if(poscount > SMLW*SMLH) {
						posfail[0]++;
					}
					if(negcount > SMLW*SMLH) {
						negfail[0]++;
					}
					console.log(posfail[0]);
					for(var i = 31;i > 0;i--) { //Shift Posfail values over. Youngest to oldest.
            posfail[i] = posfail[i-1];
            negfail[i] = negfail[i-1];
            
            //Rposfail[i] = Rposfail[i-1];
            //Rnegfail[i] = Rnegfail[i-1];
					}
					posfail[0] = 0;
					negfail[0] = 0;
				});
			}
	});
}, 1); //1000 / FPS