(function(w) {
  
  w['AV'] = w['AV'] || {};  // global namespace
  
  
  var MAX_FILE_SIZE = 52428800;  // 50MB in bytes

  var form = null;
  var inputImage = null;
  
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
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.responseText.indexOf('{') > -1) {
            var result = JSON.parse(xhr.responseText);
            if (result && result.url) {
              // cache-bust the filename because of problem with image onload event and cached images for webkit browsers
              outputImage.src = result.url + '?bust=' + new Date().getMilliseconds();
              outputImage.onload = stopSpin;
              
              // window.location.replace()
              // save this as the last
              lastPaper.imgsrc = result.url;
              enableReplay();
              setUrl(lastPaper);
            }
        } else {
          alert(xhr.responseText);  // server error
        }

      }
    };

    xhr.open('POST', url, true);      
    try { // FormData \o/
      var fd = new FormData();
      fd.append("file", file);
      fd.append('action', 'uploadFile');
      //console.log(file);
      xhr.send(fd);
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
  };
  
})(window);
