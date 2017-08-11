wp.media.controller.FICamera = wp.media.controller.MLCamera.extend({

  upload: function(){
    //console.log('wp.media.controller.FICamera::upload');
    if ( ! this.workflow ) {
      this.workflow = wp.media.featuredImage.frame();
    };

    this.workflow.state().reset();
    this.addFiles.apply( this );
    this.workflow.open().setState('featured-image');
    return false;
  }

});

oldSelectFrame = wp.media.view.MediaFrame.Select
wp.media.view.MediaFrame.Select = oldSelectFrame.extend({

  initialize: function() {
    //console.log('wp.media.view.MediaFrame.Select::initialize');
    oldSelectFrame.prototype.initialize.apply( this, arguments );

    this.states.add([
      new wp.media.controller.MLCamera({
      id:            'media-library-camera',
      content:    'mlc-content',
			router:      'camera',
      title:      		'Featured Image',
      priority:     200,
      toolbar:     'mlc-toolbar', 
      type:         'link'
      })
    ]);

    this.on( 'router:render:browse', this.renderMLCRouter, this );
    this.on( 'toolbar:create:mlc-toolbar', this.createMLCToolbar, this );
		this.on( 'content:render:mlc-content', this.renderMLCContent, this );
    this.on( 'content:deactivate:mlc-content', this.deactivateMLCContent, this );
  },

  createRouter: function(router){
    //console.log('wp.media.view.MediaFrame.Select::createRouter');
    router.view = new wp.media.view.Router.MLCamera({
      controller: this,
    });
    return this;
  },
  
  renderMLCRouter: function(routerView){
    routerView.set({
    //console.log('wp.media.view.MediaFrame.Select::renderFICRouter');
      camera: {
        click: function(){
          this.controller.setState('media-library-camera');
          this.$el.addClass('active');
        },
        content: 'mlc-camera',
        text:     'Camera',
        priority: 30,
      },
    });
    
    return this;
  },
  
  createMLCToolbar: function(toolbar){
    //console.log('wp.media.view.MediaFrame.Select::createFICToolbar');
    toolbar.view = new wp.media.view.Toolbar.MLCamera({
      controller: this
    });
    return this;
  },

  renderMLCContent: function(){
    //console.log('wp.media.view.MediaFrame.Select::renderFICContent');
    var view = new wp.media.view.MLCamera({
      content:     'mlc-camera',
      controller: this,
      model: this.states.get('media-library-camera').props
    });
    this.content.set( view );
    return this;
  },

  deactivateMLCContent: function(){
    if (wp.media.frame.state().id === 'media-library-camera') {
    //console.log('wp.media.view.MediaFrame.Select::deactivateFICContent');
      wp.media.frame.setState(this._lastState);
    }
  }

});