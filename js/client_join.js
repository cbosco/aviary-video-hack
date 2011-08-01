/* Author: 

*/

function Segment (source, start, finish) {
	this.source = source;
	this.start = start;
	this.finish = finish;
	this.active = false;
	return this;
}


var sources = {
	//'What is the internet?' : 'bb.avi',
	//'Iz eats cinnamon' : 'http://o-o.preferred.iad09g01.v22.lscache6.c.youtube.com/videoplayback?sparams=id%2Cexpire%2Cip%2Cipbits%2Citag%2Cratebypass%2Coc%3AU0hQRlhUTl9FSkNOMF9QTlJF&amp;fexp=904427%2C910211&amp;itag=43&amp;ip=0.0.0.0&amp;signature=63C1D4C048C32E6ED8E58FADC4F5C453F2CAC016.CB848C90369CF52C12897D415D22BE0A79F78B37&amp;sver=3&amp;ratebypass=yes&amp;expire=1311890400&amp;key=yt1&amp;ipbits=0&amp;id=fc08416018b52246',
	//'Iz eats cinnamon (chrome)' : 'http://o-o.preferred.iad09g01.v22.lscache6.c.youtube.com/videoplayback?sparams=id%2Cexpire%2Cip%2Cipbits%2Citag%2Cratebypass%2Coc%3AU0hQRlhUTl9FSkNOMF9QTlJF&amp;itag=43&amp;ip=0.0.0.0&amp;signature=05124C1D7192216503076E814A1FAB1B84F711A4.23B1DB0C393656E00215B252367AAD71EFC4C4C9&amp;sver=3&amp;ratebypass=yes&amp;expire=1311890400&amp;key=yt1&amp;ipbits=0&amp;id=fc08416018b52246',
	'bunny' : 'b5.webm',
	'resident evil' : 'b5.webm'
};
var segments;

var Video = (function() {
	var timer = null;
	
	var keyFrames = null;
	
	var UPDATE_RATE_MS = 100;
	var UPDATE_RATE_S = 0.1;
	
	var isPlaying = true;
	
	var update = function() {
		if (isPlaying) {
			currentTime += UPDATE_RATE_S;
		}
		if (!keyFrames) {
      Video.init(segments);
    }
		for (var i = 0; i < keyFrames.length; i++) {
			var curKeyFrame = keyFrames[i];
			if (!curKeyFrame.active && currentTime >= curKeyFrame.start) {
				// switch to this video
				console.log('switched to keyframe ' + i + ', src=' + curKeyFrame.segment.source);
				if (currentSource != curKeyFrame.segment.source) {
					isPlaying = false;
					console.log('new src');
					joinedVideo.pause();
					joinedVideo.onloadeddata = function() {
						console.log('callback');
						joinedVideo.currentTime = curKeyFrame.segment.start;
						console.log(joinedVideo.currentTime);
						joinedVideo.play();
						joinedVideo.onloadeddata = null;
						isPlaying = true;
					};
					joinedVideo.src = curKeyFrame.segment.source;
					joinedVideo.load();
				} else {
					console.log('same src');
					// same source, just seek
					joinedVideo.currentTime = curKeyFrame.segment.start;
					console.log(joinedVideo.currentTime);
				}
				curKeyFrame.active = true;
				currentSource = curKeyFrame.segment.source;
				break;
			} else {
				continue;
			}
		}
		// update UI
		timerEl.innerHTML = ~~currentTime;
		// stop at "end"
		if (currentTime >= duration) {
			joinedVideo.pause();
			Video.stop();
			currentTime = 0;
		}
	};
	
	return {
		start: function() {
			timer = window.setInterval(update, UPDATE_RATE_MS);
		},
		stop: function() {
			window.clearTimeout(timer);
		},
		init: function(segments) {
			keyFrames = [];
			// segments is an array of segments
			for (var i = 0; i < segments.length; i++) {
				keyFrames.push({
					start: duration,
					segment: segments[i]
				});
				duration += (segments[i].finish - segments[i].start);	// running total time
			}
		}
	};

})();


// useful because comparing src attribute directly will require regex
var currentSource = null;
var currentTime = 0;
var duration = 0;
var joinedVideo;
var timerEl;

function playOrPause() {
	if (this.paused) {
		Video.start();
		this.play();
	} else {
		this.pause();
		Video.stop();
	}
}

window.onload = function() {
  
  segments = [
    new Segment(sources['bunny'], 0, 4),
    new Segment(sources['resident evil'], 25, 27),
    new Segment(sources['resident evil'], 12, 16),
    new Segment(sources['bunny'], 0, 6),  // this is weird - bunny video does not load new content :(
    new Segment(sources['resident evil'], 40, 42)
  ];
  
	joinedVideo = document.getElementById('youtube_join');
  
	timerEl = document.getElementById('timer');
	
	joinedVideo.onloadeddata = function() {
	
		Video.init(segments);
		
	};
  
  joinedVideo.src = sources['bunny'];
	joinedVideo.load();
	joinedVideo.onclick = playOrPause;
	joinedVideo.poster = null;
	
};




