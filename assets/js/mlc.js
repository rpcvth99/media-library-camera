
wp.media.controller.MLCamera = wp.media.controller.State.extend({

  initialize: function(){
    this.props = new Backbone.Model({ pictures: {}, hasSelections: false });
    this.props.on( 'change:hasSelections', this.refresh, this );
  },

  // called each time the model changes
  refresh: function() {
    console.log('wp.media.controller.MLCamera::refresh');
    this.frame.toolbar.get().refresh();
	},

	upload: function(){
    if ( ! this.workflow ) {
      this.workflow = wp.media.editor.open( window.wpActiveEditor, {
        frame:    'post',
        state:    'insert',
        title:    wp.media.view.l10n.addMedia,
        multiple: true});
    };

    uploadView = this.workflow.uploader;

    if ( uploadView.uploader && uploadView.uploader.ready ) {
      this.workflow.state().reset();
      this.addFiles.apply( this );
      this.workflow.open();
    } else {
      this.workflow.on( 'uploader:ready', this.addFiles, this );
    }
    return false;
	},

	/**
	 * Add the files to the uploader.
	 */
	addFiles: function() {
	  var files = this.props.get('pictures');
		var pics = [];
		for (var i = 0; i <  files.length ; i++) {
		  files[i]._canvas.toBlob(_.bind(function(blob){
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
    console.log('Toolbar - MLCamera::refesh');
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

  initialize: function() {
    this.images = [];
  },

  render: function(){
    console.log('wp.media.view.MLCamera::render');
    this.$el.html(this.template());

    this.ui = {
      'eyepiece'  : this.$('#eyepiece'), 
		  'gallery'     : this.$('#gallery')
		}
		return this;
  },

  events: {
	  'click #eyepiece' : 'capturePicture',
		'click canvas'      : 'toggleSelection'
  },

  capturePicture: function() {
		//if not initialized, then do that first.
		if (!this.camera){
		  this.initCamera();
			return;
		};

    var snapshot = this.camera.capture();

    this.images.push(snapshot);
		snapshot.get_canvas(_.bind(this.updateGallery, this));
  },

	updateGallery : function (canvas) {
    if (this.images.length === 0) {
      this.ui.gallery.html('');
    } else {
      this.ui.gallery.append(canvas);
		}
  },

	initCamera: function () {
	  if (this.camera) {
			this.camera.discard_all();
			this.images = [];
			this.updateGallery(null);
		} else {
      if (!window.JpegCamera) {
  		  console.log('Camera access is not available in your browser');
      } else {
  			this.camera = new JpegCamera(
				  this.ui.eyepiece.selector,
					{shutter: false,
					 shutter_ogg_url: window.mlc.assets + 'js/vendor/jpeg_camera/shutter.ogg',
           shutter_mp3_url: window.mlc.assets + 'js/vendor/jpeg_camera/shutter.mp3'
					})
          .ready(_.bind(function (resoltution) {
            console.log('Camera Resolution: ' + resoltution.video_width + 'x' + 
						  resoltution.video_height);
          },this))
          .error(function () {
          console.log('Camera access was denied');
        });
      }
		}
  },

  refreshModel: function(){
		var selectedImages = this.$('#gallery canvas').toArray();
		var selectedSnaps = [];
		for (var i = 0; i <  selectedImages.length ; i++) {
		    if(this.$(selectedImages[i]).hasClass('selected')){
				  selectedSnaps.push(this.images[i]);}}
    this.model.set({'pictures' : selectedSnaps});
    if (this.$('#gallery canvas.selected').toArray().length > 0) {
    	 this.model.set({hasSelections:true});
    } else {
    	this.model.set({hasSelections:false});
    }
	},

  toggleSelection : function (e) {
    var canvasClicked = this.$(e.target);
    canvasClicked.toggleClass('selected');
		this.refreshModel();
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
		    console.log('MediaFrame.Post::createMediaLibraryCameraToolbar');
        toolbar.view = new wp.media.view.Toolbar.MLCamera({
		    controller: this
	    });
    },

    mediaLibraryCameraContent: function(){
        console.log('MediaFrame.Post::mediaCameraLibraryContent');

				this.$el.addClass('hide-router');

        // custom content view
        var view = new wp.media.view.MLCamera({
            controller: this,
            model: this.state().props
        });

        this.content.set( view );
    }

});