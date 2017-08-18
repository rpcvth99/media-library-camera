jQuery( document ).ready( function( $ ) {
  jQuery(document).on('click', 'a.mlc_set_thumb', function( event ){
    var file_frame, post_id, thumb_id;
    event.preventDefault();
    post_id = parseInt(this.id);
    thumb_id = $('#_thumbnail_id_' + post_id).val();
    thumb_id = (! thumb_id ? -1 : parseInt(thumb_id));
    
    wp.media.model.settings.post.id = post_id;
    wp.media.model.settings.post.featuredImageId = thumb_id;
    wp.media.model.settings.post.nonce = mlc.nonce;
    if (! file_frame ) {
      wp.media.featuredImage.set = function(id){
  			$('#mlc-action-spinner-'+post_id).show();
				$('#mlc-img-spinner-'+post_id).show();
        var settings = wp.media.view.settings;
        settings.post.featuredImageId = id;
        wp.media.post( 'mlc_set_thumbnail', {
          post_id:      settings.post.id,
          thumbnail_id: settings.post.featuredImageId,
          _wpnonce:     settings.post.nonce
        }).done( function( html ) {
          if ( html == '0' ) {
            console.log( 'Error Saving Featured Image' );
            return;};
          console.log('Featured Image Set');
          $( '.mlc-actions-' + post_id ).html( html );
          wp.media.post('mlc_get_thumb_html', {
            post_id: post_id,
            _wpnonce: mlc.nonce
          }).done(function(img_src) {
          if ( img_src == '0' ) {
            console.log( 'Error getting Featured Image html' );
            return;};
          $( 'tr#post-'+post_id+' td.mlc-thumb' ).html( img_src );
					$('#mlc-action-spinner-'+post_id).hide();
  				$('#mlc-img-spinner-'+post_id).hide();
          });
  	    });
      };
      file_frame = wp.media.featuredImage.frame();
    };
    file_frame.open();
  });

  jQuery(document).on('click', 'a.mlc_remove_thumb', function( event ){
  	var post_id, nonce;
    event.preventDefault();
		post_id = parseInt(this.id);
		$('#mlc-action-spinner-'+post_id).show();
		$('#mlc-img-spinner-'+post_id).show();
 
  	console.log('remove featured image post-id=' + post_id);
  	wp.media.post( 'mlc_remove_thumbnail', {
      post_id:post_id,
      _wpnonce:mlc.nonce
    }).done( function( html ) {
      if ( html == '0' ) {
        console.log( 'Error Removing Featured Image' );
        return;};
      console.log('Featured Image Removed');
  	  $( '.mlc-actions-' + post_id ).html( html );
      wp.media.post('mlc_get_thumb_html', {
        post_id: post_id,
        _wpnonce: mlc.nonce
      }).done(function(img_src) {
        if ( img_src == '0' ) {
          console.log( 'Error getting Featured Image html' );
          return;};
        $( 'tr#post-'+post_id+' td.mlc-thumb' ).html( img_src );
				$('#mlc-action-spinner-'+post_id).hide();
				$('#mlc-img-spinner-'+post_id).hide();
      });
  	});
  });
});