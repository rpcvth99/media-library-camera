jQuery( document ).ready( function( $ ) {
	var file_frame, post_id, thumb_id;
	jQuery('a.mlc_set_fi').on('click', function( event ){
    event.preventDefault();
    post_id = parseInt(this.id);
    thumb_id = $('#_thumbnail_id_' + post_id).val();
    thumb_id = (! thumb_id ? -1 : parseInt(thumb_id));
    wp.media.model.settings.post.id = post_id;
    wp.media.model.settings.post.featuredImageId = thumb_id;
		wp.media.model.settings.post.nonce = wp.media.view.settings.nonce.wpRestApi
		if ( file_frame ) {
			// Set the post ID to what we want
			
			//file_frame.uploader.uploader.param( 'post_id', set_to_post_id );
			//file_frame.open();
			//return;
		} else {
			// Set the wp.media post id so the uploader grabs the ID we want when initialised
			//wp.media.model.settings.post.id = set_to_post_id;
			//wp.media.model.settings.post.featuredImageId = set_to_post_id;
			file_frame = wp.media.featuredImage.frame();
			//file_frame.on( 'select', function() {
      //  wp.media.featuredImage.set(wp.media.view.settings.post.featuredImageId);
      //});
		}
  	file_frame.open();
	});
});