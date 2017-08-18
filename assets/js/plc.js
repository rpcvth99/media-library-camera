jQuery( document ).ready( function( $ ) {
	var file_frame, post_id, thumb_id, nonce;
	jQuery('a.mlc_set_thumb').on('click', function( event ){
    event.preventDefault();
    post_id = parseInt(this.id);
    thumb_id = $('#_thumbnail_id_' + post_id).val();
    thumb_id = (! thumb_id ? -1 : parseInt(thumb_id));

    wp.media.model.settings.post.id = post_id;
    wp.media.model.settings.post.featuredImageId = thumb_id;
    wp.media.model.settings.post.nonce = mlc.nonce;
    if (! file_frame ) {
  		wp.media.featuredImage.set = function(id){
        var settings = wp.media.view.settings;
        settings.post.featuredImageId = id;
        wp.media.post( 'mlc_set_thumbnail', {
          post_id:      settings.post.id,
          thumbnail_id: settings.post.featuredImageId,
          _wpnonce:     settings.post.nonce
          }).done( function( html ) {
            if ( html == '0' ) {
              window.alert( 'Error Saving Featured Image' );
              return;
            }
        });
			};
    	file_frame = wp.media.featuredImage.frame();
		}
    file_frame.open();
	});

	jQuery('a.mlc_remove_thumb').on('click', function( event ){
		event.preventDefault();
    post_id = parseInt(this.id);
    thumb_id = -1;
		console.log('remove featured image post-id=' + post_id);
		wp.media.post( 'mlc_remove_thumbnail', {
      post_id:post_id,
      _wpnonce:mlc.nonce
      }).done( function( html ) {
        if ( html == '0' ) {
          window.alert( 'Error Removing Featured Image' );
          return;
        }
        console.log('Featured Image Removed');
    });
	});
        $( 'tr#post-'+post_id+' td.mlc-thumb' ).html( img_src );
});