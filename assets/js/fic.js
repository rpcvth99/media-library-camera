wp.media.controller.FICamera = wp.media.controller.MLCamera.extend({

  upload: function(){
    //console.log('wp.media.controller.FICamera::upload');
    if ( ! this.workflow ) {
      this.workflow = wp.media.featuredImage.frame();
    };

    this.addFiles.apply( this );
    this.workflow.state().reset();
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
      new wp.media.controller.FICamera({
        id:            'featured-image-camera',
        frame:      'select',
        content:    'fic-content',
        router:      'camera',
        title:      		'Featured Image',
        priority:     80,
        toolbar:     'fic-toolbar', 
        type:         'link'
      })
    ]);

    this.on( 'router:render:browse', this.renderFICRouter, this );
    this.on( 'toolbar:create:fic-toolbar', this.createFICToolbar, this );
    this.on( 'content:render:fic-content', this.renderFICContent, this );
    this.on( 'content:deactivate:fic-content', this.deactivateFICContent, this );
  },

  createRouter: function(router){
    //console.log('wp.media.view.MediaFrame.Select::createRouter');
    router.view = new wp.media.view.Router.MLCamera({
      controller: this,
    });
    return this;
  },

  renderFICRouter: function(routerView){  
    //console.log('wp.media.view.MediaFrame.Select::renderFICRouter');
		routerView.set({
      camera: {
        click: function(){
          this.controller.setState('featured-image-camera');
          this.$el.addClass('active').siblings().removeClass('active');
        },
        content: 'fic-camera',
        text:     'Camera',
        priority: 30,
      },
    });
    
    return this;
  },

  createFICToolbar: function(toolbar){
    //console.log('wp.media.view.MediaFrame.Select::createFICToolbar');
    toolbar.view = new wp.media.view.Toolbar.MLCamera({
      controller: this
    });
    return this;
  },

  renderFICContent: function(){
    //console.log('wp.media.view.MediaFrame.Select::renderFICContent');
    var view = new wp.media.view.MLCamera({
      //content:     'fic-camera',
      controller: this,
      model: this.states.get('featured-image-camera').props
    });
    this.content.set( view );
    return this;
  },

  deactivateFICContent: function(){
    //console.log('wp.media.view.MediaFrame.Select::deactivateFICContent');
    if (wp.media.frame.state().id === 'featured-image-camera') {
      wp.media.frame.setState(this._lastState);
    }
  }

});