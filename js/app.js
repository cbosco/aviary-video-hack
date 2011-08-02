(function(w) {
  
  w['AV'] = w['AV'] || {};  // global namespace

  AV.segmentBuilder = (function() {
    var videoSegmentStart,
        videoSegmentFinish,
        slider,
        confirmBtn,
        curSource,
        curStart,
        curStop;
        
    function updateVideoPositions(ev, ui) {
      videoSegmentStart.currentTime = curStart = ui.values[0];
      videoSegmentFinish.currentTime = curStop = ui.values[1];
      
    }
    
    function updateUI() {
      $(slider).slider({
          range: true,
          min: 0,
          max: videoSegmentStart.duration,
          values: [0, videoSegmentStart.duration],
          slide: updateVideoPositions
      });
      $('#video-segment-builder').show();

    }
    
    return {
      init: function() {
        videoSegmentStart = document.getElementById('video-segment-start');
        videoSegmentFinish = document.getElementById('video-segment-finish');
        slider = document.getElementById('segment-slider');
        confirmBtn = document.getElementById('segment-confirm');
        confirmBtn.onclick = this.confirm;
      },
      update: function(source){
        curSource = source;
        curStart = curStop = 0;
                
        // wait for video previews to load src
        videoSegmentFinish.onloadeddata = function() {
          updateUI();

          this.onloadeddata = undefined;
        };
        
        console.log(curSource.getAttribute('data-src'));
        videoSegmentStart.src = curSource.getAttribute('data-src');
        videoSegmentFinish.src = curSource.getAttribute('data-src');
        

      },
      confirm: function() {
        $(tray).slideUp();
        // create element
        var segment = $(
          '<span class="segment">' + 
            curSource.innerHTML + ' [' + curStart + 's - ' + curStop + 's]' +
          '</span>'
        );
        // set data for json
        segment.data({
          id: curSource.getAttribute('data-id'),
          src: curSource.getAttribute('data-src'),
          start: curStart,
          stop: curStop
        });
        // add it to sortable collection
        $( "#video-segments" ).append(segment);
        $( "#video-segments" ).refresh();
      }
    }
  })();
  
  var MAX_FILE_SIZE = 52428800;  // 50MB in bytes

  var form = null;
  var inputImage = null;
  
  var generateNewSource = function(data) {
    for (var i = 0; i < data.length; i++) {
      var sourceFile = $(
        '<span class="segment" data-id="' + data[i].id + '" data-src="' + data[i].url + '">' + data[i].originalName + '</span>'
      );
      sourceFile.draggable({
        helper: 'clone'
      });
      $('#video-sources').append(sourceFile);
    }

  };
  
  var getFile = function(element) {
    var file;
    try {
      file = element.files[0];
      if (!file) {
        alert('Please choose a video file');
      }
    } catch(e) {
      //  TODO - better legacy support?
      alert('FileReader API unsupported.  Please try this with a mobile device with a Webkit browser, or if on the desktop, Google Chrome or Mozilla Firefox 4 or newer');
      file = false;
    }
    return file;
  };
  
  var validateFile = function(file) {
    var fileSize = file.size || file.fileSize;
  
    var isVideo = (file.type.indexOf('video') > -1);
    
    if (!isVideo || fileSize > MAX_FILE_SIZE) {
      var msg;
      if (isVideo) {
        msg = 'Please choose a file smaller than 2MB in size';
      } else {
        msg = 'Please choose an image file';
      }
      alert(msg);     
      return false;
    }
    return true;
  };

  /*
   * This will automatically multipart/form-data encode the file and send it to the server. The contents of the file is read in small chunks
   * and thus doesn't use any significant amounts of memory.
   *
   * http://hacks.mozilla.org/2010/07/firefox-4-formdata-and-the-new-file-url-object/
   * http://igstan.ro/posts/2009-01-11-ajax-file-upload-with-pure-javascript.html
   */
  var sendFile = function(url, file) {
    var xhr = new XMLHttpRequest(); // or require's createXhr() if I care about IE
    // TODO: use XMLHttpRequest2
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.responseText.indexOf('{') > -1) {
            var result = JSON.parse(xhr.responseText);
            if (result && result.videos) {
              
              generateNewSource(result.videos);

            } else { // FAKE IT
              generateNewSource([
                {
                  id: Math.random(0,100000) + 'b5.webm',
                  originalName: 'b5.avi',
                  url: 'b5.webm'
                }
              ]);
            }
        } else {
          //alert(xhr.responseText);  // server error
        }

      }
    };

    xhr.open('POST', url, true);      
    try { // FormData \o/
      var fd = new FormData();
      fd.append("file", file);
      fd.append('action', 'uploadFile');
      //console.log(fd);
      xhr.send(fd);
      return;
      // fake...
              generateNewSource([
                {
                  id: new Date() + 'b5.avi',
                  originalName: 'b5.avi',
                  url: 'b5.avi'
                }
              ]);
    } catch (e) {       // FormData unsupported :(
      var boundary = 'AJAX-----------------------' + (new Date()).getTime();
      var contentType = 'multipart/form-data; boundary=' + boundary;
      xhr.setRequestHeader("Content-Type", contentType);
 

      var CRLF = "\r\n";
      var type = inputImage.getAttribute("type").toUpperCase();
      var fieldName = inputImage.name;
      var fileName = file.fileName;

      var part = "--" + boundary + CRLF;

      /*
       * Content-Disposition header contains name of the field
       * used to upload the file and also the name of the file as
       * it was on the user's computer.
       */
      part += 'Content-Disposition: form-data; ';
      part += 'name="' + 'file' + '"; ';
      part += 'filename="'+ fileName + '"' + CRLF;

      /*
       * Content-Type header contains the mime-type of the file
       * to send. Although we could build a map of mime-types
       * that match certain file extensions, we'll take the easy
       * approach and send a general binary header:
       * application/octet-stream
       */
      part += "Content-Type: application/octet-stream";
      part += CRLF + CRLF; // marks end of the headers part

      /*
       * File contents read as binary data, obviously
       */
      part += file.getAsBinary() + CRLF;
      
      part += "--" + boundary + "--" + CRLF;
      // finally send the request as binary data
      xhr.sendAsBinary(part);
      
    }

  };

  window.onload = function() {
    form = document.getElementById('uploadForm');
    inputImage = document.getElementById('image');
  
    var existing = null;
    
    form.onsubmit = function(e) {
      
      var file = getFile(inputImage);
      if (file && validateFile(file)) {

        sendFile(this.action, file);

      }
      return false;
    };
    
    AV.segmentBuilder.init();
    
    
    $( "#video-segments" )
      .sortable()
      .disableSelection();
  
    
    $('#video-builder').droppable({ // this = droppable
      drop: function(ev, ui) {
        AV.segmentBuilder.update(ui.draggable[0]);
        
        console.log(ui);
        console.log('drop');
        
        
      }
    });
  };
  
})(window);
