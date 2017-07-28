
wp.media.controller.MLCamera = wp.media.controller.State.extend({

  initialize: function(){
    this.props = new Backbone.Model({ pictures: {}, hasSelections: false });
    this.props.on( 'change:hasSelections', this.refresh, this );
  },

  refresh: function() {
    //console.log('wp.media.controller.MLCamera::refresh');
    this.frame.toolbar.get().refresh();
	},

	upload: function(){
	  console.log('upload');
    if ( ! this.workflow ) {
		  ///console.log('opening workflow');
      this.workflow = wp.media.editor.open( window.wpActiveEditor, {
        frame:    'post',
        state:    'insert',
        title:    wp.media.view.l10n.addMedia,
        multiple: true});
    };
    uploadView = this.workflow.uploader;
    console.log('uploader set...about to open');
    //console.log('uploadView.uploader = ' + JSON.stringify(uploadView.uploader));
	  this.workflow.state().reset();
    this.addFiles.apply( this );
    this.workflow.open();
    return false;
	},

	/**
	 * Add the files to the uploader.
	 */
	addFiles: function() {
	  //console.log('addingFiles');
	  var files = this.props.get('pictures');
		for (var i = 0; i <  files.length ; i++) {
			files[i].toBlob(_.bind(function(blob){
			  console.log('blob created...adding');
        this.workflow.uploader.uploader.uploader.addFile(blob, 'MCL_IMG-' + Date.now() + '.jpg');
			},this), 'image/jpeg', 0.95);
		}
		return this;
  }

});

wp.media.view.Toolbar.MLCamera = wp.media.view.Toolbar.extend({
	initialize: function() {
    _.defaults( this.options, {
      event: 'upload',
      close: false,
      items: {
        upload: {
          text: wp.media.view.l10n.mediaLibraryCameraButton, // added via 'media_view_strings' filter,
          style: 'primary',
          priority: 80,
          requires: false,
          click: this.uploadSnapshot
        }
			}
		});

		wp.media.view.Toolbar.prototype.initialize.apply( this, arguments );
	},

    // called each time the model changes
	refresh: function() {
    console.log('wp.media.view.Toolbar.MLCamera::refesh');
	  // modify the toolbar behaviour in response to user actions here
	  // disable the button if there is no custom data
		//this.get('media_camera_event').model.set( 'disabled', ! media_camera_data );
		
	  // call the parent refresh
    wp.media.view.Toolbar.prototype.refresh.apply( this, arguments );
  },

  // triggered when the button is clicked
  uploadSnapshot: function(){
	  this.controller.state().upload(this.controller);
		this.controller.setState( 'insert' );
  }
});

//  contains the main panel UI
wp.media.view.MLCamera = wp.media.View.extend({
  className: 'media-libary-camera',
  template: wp.template('mlc-camera'),
  events: {
	  'click video'        : 'takePicture',
	  'change #cameras' : 'selectCamera',
		'click canvas'      : 'toggleSelection'
  },

  initialize: function() {
    this.images = [];
  },

  render: function(){
    console.log('wp.media.view.MLCamera::render');
    this.$el.html(this.template());

    this.ui = {
		  'camera'    : this.$('video'),
		  'cameras'   : this.$('select'),
      'eyepiece'   : this.$('#eyepiece'), 
		  'gallery'      : this.$('#gallery')
		};

    navigator.mediaDevices.getUserMedia({
			audio: false, 
		  video: {
  		  //facingMode: { ideal: "environment" },
  			width: 600, 
  			height: 480}
	  })
  	.then(_.bind(this.initVideo, this))
  	.catch(function(err) { console.log(err.name + ": " + err.message); });

		navigator.mediaDevices.enumerateDevices().then(_.bind(this.gotDevices,this));
		return this;
  },

	initVideo: function(stream){
	  //console.log('initVideo');
	  this.ui.camera[0].srcObject = stream;
    this.ui.camera[0].play();
	},

	selectCamera: function(){
	  console.log('selectCamera');
	  this.ui.camera[0].srcObject.getTracks().forEach(function(track) {
      track.stop();
    });
    navigator.mediaDevices.getUserMedia({
		  video: {
			  deviceId: {exact: this.ui.cameras[0].value}}
    })
		.then(_.bind(this.initVideo, this))
		.catch(function(err) { console.log(err.name + ": " + err.message); });
	},

	takePicture: function() {
	  var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    context.drawImage(this.ui.camera[0], 0, 0, canvas.width, canvas.height);
		this.images.push(canvas);
		this.updateGallery(canvas);
	},

	gotDevices(deviceInfos) {
    for (var i = 0; i !== deviceInfos.length; ++i) {
		  if (deviceInfos[i].kind === 'videoinput') {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        option.text = deviceInfo.label || 'camera ' + (this.ui.cameras[0].length + 1);
        this.ui.cameras.append(option);
			}
    }
  },

	updateGallery : function (canvas) {
    if (this.images.length === 0) {
      this.ui.gallery.html('');
    } else {
      this.ui.gallery.append(canvas);
		}
  },

  refreshModel: function(){
		var selectedImages = this.$('#gallery canvas.selected').toArray();
    this.model.set({'pictures' : selectedImages});
    if (selectedImages.length > 0) {
    	 this.model.set({hasSelections:true});
    } else {
    	this.model.set({hasSelections:false});
    }
	},

  toggleSelection : function (e) {
    var canvasClicked = this.$(e.target);
    canvasClicked.toggleClass('selected');
		this.refreshModel();
  },
	
	logError: function(e){
	  console.log(e);
	}

});


// supersede the default MediaFrame.Post view
var oldMediaFrame = wp.media.view.MediaFrame.Post;
wp.media.view.MediaFrame.Post = oldMediaFrame.extend({

    initialize: function() {
		    console.log('MediaFrame.Post::initialize');
        oldMediaFrame.prototype.initialize.apply( this, arguments );
        
        this.states.add([
            new wp.media.controller.MLCamera({
                id:            'media-library-camera-action',
                menu:       'default', // menu event = menu:render:default
                content:    'media-library-camera',
        				title:      		wp.media.view.l10n.mediaLibraryCameraMenuTitle, // added via 'media_view_strings' filter
        				priority:     200,
        				toolbar:     'main-media-library-camera-action', // toolbar event = toolbar:create:main-my-action
        				type:         'link'
            })
        ]);

        this.on( 'content:render:media-library-camera', this.mediaLibraryCameraContent, this );
        this.on( 'toolbar:create:main-media-library-camera-action', this.createMediaLibraryCameraToolbar, this );
        this.on( 'toolbar:render:main-media-library-camera-action', this.renderMediaLibraryCameraToolbar, this );
    },

    createMediaLibraryCameraToolbar: function(toolbar){
		    //console.log('MediaFrame.Post::createMediaLibraryCameraToolbar');
        toolbar.view = new wp.media.view.Toolbar.MLCamera({
		    controller: this
	    });
    },

    mediaLibraryCameraContent: function(){
        //console.log('MediaFrame.Post::mediaCameraLibraryContent');

				this.$el.addClass('hide-router');

        // custom content view
        var view = new wp.media.view.MLCamera({
            controller: this,
            model: this.state().props
        });

        this.content.set( view );
    }

});
