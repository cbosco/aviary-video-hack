/* Author: 

	Device Detector

*/
if (typeof dd === undefined) {
  var dd = {};  
}


(function(dd) {
	var baseDir = 'js/',
		jsSuffixRegExp = /\.js$/,
    cacheBuster = '',
		
		// constants
		IS_HANDHELD = (screen.width <= 480) || !screen.width,	// mobile first!
		IS_DESKTOP = screen.width >= 1000;

	dd.include = function(filename) {
		if (!filename.match(jsSuffixRegExp)) {
			filename = filename + '.js';
		}
    
		var src =	'<script src="' + 
					(filename.match('/') ? filename : baseDir + filename) + (cacheBuster? ('?bust=' + cacheBuster) : '') +
					'">\x3C/script>'
		
		//console.log(src);
		document.write(src);
	};
	
	dd.setBaseDir = function(dir) {
		baseDir = dir;
	};
  
  dd.utils = (function() {

    // create XHR and get functions from require.js - https://github.com/jrburke/requirejs/blob/master/text.js  
    function createXhr() {
      var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
      var xhr, i, progId;
      if (typeof XMLHttpRequest !== "undefined") {
          return new XMLHttpRequest();
      } else {
          for (i = 0; i < 3; i++) {
              progId = progIds[i];
              try {
                  xhr = new ActiveXObject(progId);
              } catch (e) {}
  
              if (xhr) {
                  progIds = [progId]; // so faster next time
                  break;
              }
          }
      }
  
      if (!xhr) {
          throw new Error("XMLHttpRequest not available");
      }
  
      return xhr;       
      
    }
   
    function ajax(url, callback, protocol) {
        protocol = protocol || 'GET';
        var xhr = createXhr();
        xhr.open(protocol, url, true);
        xhr.onreadystatechange = function (evt) {
            //Do not explicitly handle errors, those should be
            //visible via console output in the browser.
            if (xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        };
        xhr.send(null);
    };
    
    return {
      createXhr: createXhr,
      ajax: ajax
    }
  })();

  
  dd.replaceMainHtml = function(url, container) {
    container = container || 'dd-replace';
    dd.utils.ajax(url, function(html) {
      var el = document.getElementById(container);
      if (el) {
        el.innerHTML = html;
      }
    });
  };
  
  dd.setBuster = function(bust) {
      cacheBuster = bust;
  };
	
	// getters
	dd.isHandheld = function() {return IS_HANDHELD};
	dd.isDesktop = function() {return IS_DESKTOP};
	
})(dd = dd || {});
