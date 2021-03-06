
wp.media.controller.MLCamera = wp.media.controller.State.extend({

  initialize: function(){
    //console.log('wp.media.controller.MLCamera::initialize');
		var propsModel = Backbone.Model.extend({
  		defaults:{
    		pictures: {}, 
    		hasSelections: false },
		});
    this.props = new propsModel;
    this.props.on( 'change:hasSelections', this.refresh, this );
    this.on('uploadSnapshots', this.upload, this);
  },

  reset: function(){
    //console.log('wp.media.controller.MLCamera::reset');
    this.props.clear().set(this.props.defaults);
		this.refresh;
  },

  refresh: function() {
    //console.log('wp.media.controller.MLCamera::refresh');
    this.frame.toolbar.get().refresh();
  },

  upload: function(){
    //console.log('wp.media.controller.MLCamera::upload');
    if ( ! this.workflow ) {
      this.workflow = wp.media.editor.open( window.wpActiveEditor, {
        frame:'post',
        state:'insert',
        title:wp.media.view.l10n.addMedia,
        multiple: true
			});
    };

    this.addFiles.apply(this);
		this.workflow.state().reset();
    this.workflow.open().setState( 'insert' );
    return false;
  },

  addFiles: function() {
    //console.log('wp.media.controller.MLCamera::addingFiles');
    var files = this.props.get('pictures');
    for (var i = 0; i <  files.length ; i++) {
      files[i].toBlob(_.bind(function(blob){
        this.workflow.uploader.uploader.uploader.addFile(
    			blob, 'MCL_IMG-' + Date.now() + '.jpg'
      	);
      },this), 'image/jpeg', 0.95);
    }
    return this;
  }
});

wp.media.view.Router.MLCamera = wp.media.view.Router.extend({
  initialize: function() {
    //console.log('wp.media.view.Router.MLCamera::initalize');
    wp.media.view.Router.prototype.initialize.apply( this, arguments );	
  },

  refresh: function() {
    //console.log('wp.media.view.Toolbar.MLCamera::refesh');
    wp.media.view.Router.prototype.refresh.apply( this, arguments );
  }
}),

wp.media.view.Toolbar.MLCamera = wp.media.view.Toolbar.extend({
	initialize: function() {
	  //console.log('wp.media.view.Toolbar.MLCamera::initalize');
    _.defaults( this.options, {
      event: 'uploadSnapshots',
      close: false,
      items: {
        uploadSnapshots: {
          text: wp.media.view.l10n.mediaLibraryCameraButton,
          style: 'primary',
          priority: 80,
          requires: {'selection':true},
          click : _.bind(function(){
            //console.log('wp.media.view.Toolbar.MLCamera::click');
            this.controller.state().trigger( this.options.event );
          }, this)
        }
      }
    });
    wp.media.view.Toolbar.prototype.initialize.apply( this, arguments );
  },

	refresh: function() {
    //console.log('wp.media.view.Toolbar.MLCamera::refesh');
    var disabled = this.controller.state().props.get('hasSelections') < 1;
    this.get('uploadSnapshots').model.set('disabled', disabled);
  }
});

/*
* Camera view
*/
wp.media.view.MLCamera = wp.media.View.extend({
  className: 'media-libary-camera',
  template: wp.template('media-libary-camera'),
  events: {
    'click video': 'takePicture',
    'change #cameras': 'selectCamera',
    'click canvas': 'toggleSelection'
  },

  render: function(){
    //console.log('wp.media.view.MLCamera::render');
    this.$el.html(this.template());

    this.ui = {
      'camera' : this.$('video'),
      'cameras': this.$('select'),
      'gallery': this.$('#gallery')
    };

    this.getDevice({
  		audio: false, 
  		video: {
    		width: {min:300, ideal:800, max:1200}, 
    		height: {min: 225, ideal:600 , max:600},
				aspectRatio: { ideal: 1.33336 }
			}
		});
		navigator.mediaDevices.enumerateDevices().then(_.bind(this.gotDevices,this));
		return this;
  },

  getDevice: function(contraints){
    //console.log('wp.media.view.MLCamera::getDevice');
    navigator.mediaDevices.getUserMedia(contraints)
      .then(_.bind(function(stream){
        this.ui.camera[0].srcObject = stream;
        this.ui.camera[0].play();}, this))
      .catch(function(err) { console.log(err.name + ": " + err.message); });
  },

  selectCamera: function(){
    //console.log('wp.media.view.MLCamera::selectCamera');
    this.ui.camera[0].srcObject.getTracks().forEach(function(track) {track.stop();});
    this.getDevice({video: {deviceId: {exact: this.ui.cameras[0].value}}});
  },

  takePicture: function() {
    //console.log('wp.media.view.MLCamera::takePicture');
    var canvas = document.createElement("canvas");
		canvas.height = this.ui.camera[0].videoHeight;
		canvas.width = this.ui.camera[0].videoWidth;
    var context = canvas.getContext("2d");
    context.drawImage(this.ui.camera[0], 0, 0, canvas.width, canvas.height);
    this.ui.gallery.append(canvas);
  },

  gotDevices(deviceInfos) {
    //console.log('wp.media.view.MLCamera::gotDevices'); 
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

  toggleSelection : function (e) {
    //console.log('wp.media.view.MLCamera::toggleSelection');
    var canvasClicked = this.$(e.target);
    canvasClicked.toggleClass('selected');
    var selectedImages = this.$('#gallery canvas.selected').toArray();
    this.model.set({'pictures' : selectedImages});
    this.model.set({hasSelections:(selectedImages.length)});
  }

});

// supersede the default MediaFrame.Post view
var oldMediaFrame = wp.media.view.MediaFrame.Post;
wp.media.view.MediaFrame.Post = oldMediaFrame.extend({

  initialize: function() {
    //console.log('wp.media.view.MediaFrame.Post::initialize');
    oldMediaFrame.prototype.initialize.apply( this, arguments );

    this.states.add([
      new wp.media.controller.MLCamera({
        id:            'media-library-camera',
        menu:       'default',
        router:      'camera',
        content:    'mlc-content',
        title:      		wp.media.view.l10n.mediaLibraryCameraMenuTitle,
        priority:     200,
        toolbar:     'mlc-toolbar',
        type:         'link'
      })
    ]);
  
    this.on( 'content:create:mlc-content', this.createMLCContent, this);
    this.on( 'content:render:mlc-content', this.renderMLCContent, this );
    this.on( 'content:deactivate:mlc-content', this.deactivateMLCContent, this );

    this.on( 'toolbar:create:mlc-toolbar', this.createMLCToolbar, this );

    this.on( 'router:render:browse', this.renderMLCRouter, this );
  },
  
  createRouter: function(router){
    //console.log('wp.media.view.MediaFrame.Post::createRouter');
    router.view = new wp.media.view.Router.MLCamera({
      controller: this,
    });
    return this;
  },
  
  renderMLCRouter: function(routerView){
    //console.log('wp.media.view.MediaFrame.Post::renderMLCRouter');
    routerView.set({
      camera: {
        click: function(){
          this.controller.setState('media-library-camera');
    			this.$el.addClass('active').siblings().removeClass('active');
      	},
      content: 'mlc-camera',
      text:     'Camera',
      priority: 30,
      },
    });

    return this;
  },
  
  createMLCToolbar: function(toolbar){
    //console.log('wp.media.view.MediaFrame.Post::createMCLToolbar');
    toolbar.view = new wp.media.view.Toolbar.MLCamera({
      controller: this
     });
    return this;
  },

  renderMLCContent: function(){
    //console.log('wp.media.view.MediaFrame.Post::renderMLCContent');
    var view = new wp.media.view.MLCamera({
      content:     'mlc-camera',
      controller: this,
      model: this.states.get('media-library-camera').props
    });
    this.content.set( view );
    return this;
  },

  deactivateMLCContent: function(){
    //console.log('wp.media.view.MediaFrame.Post::deactivateMLCContent');
    if (wp.media.frame.state().id === 'media-library-camera') {
  		wp.media.frame.setState(this._lastState);
		}
  }
});
