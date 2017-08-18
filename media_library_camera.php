<?php
/*
 * Plugin Name: Media Library Camera
 * Plugin URI: https://github.com/rpcvth99/media-library-camera
 * Description: Use your device's camera or computer webcam to add images to media library
 * Author: Steve Datz
 * Version: 0.5
 * Author URI: https://github.com/rpcvth99/
 * Text Domain: media-libary-camera
 * License: GPL-3.0+
 * License URI: http://www.gnu.org/licenses/gpl-3.0.txt
 * GitHub Plugin URI: https://github.com/rpcvth99/media-library-camera
 * GitHub Branch: master
 */

add_action('wp_ajax_mlc_remove_thumbnail', 'mlc_remove_thumbnail');
add_action('wp_ajax_mlc_set_thumbnail', 'mlc_set_thumbnail');
add_action('wp_ajax_mlc_get_thumb_html', 'mlc_get_thumb_html');
add_action('admin_enqueue_scripts', 'mlc_add_src_scripts', 0);
add_action('admin_enqueue_scripts', 'mlc_add_script');
add_action('print_media_templates', 'mlc_templates');

add_filter('media_view_strings', 'mlc_media_string', 10, 2);
add_filter('post_row_actions', 'mlc_post_row_actions', 20, 2);
add_filter('wp_handle_upload_prefilter', 'mc_filename_prefilter');

add_filter('manage_edit-product_columns', 'mc_product_posts_columns', 10, 1);
add_action('manage_product_posts_custom_column', 'mc_product_posts_custom_column', 10, 2);

function mlc_remove_thumbnail(){
	$post_id = intval( $_POST['post_id'] );	
	check_ajax_referer( 'mlc_nonce' );
	if ( ! current_user_can( 'edit_post', $post_id ) ) {wp_die( -1 );}

	$return = delete_post_thumbnail($post_id);
	wp_send_json_success( mlc_get_mlc_action_string($post_id) );
}

function mlc_set_thumbnail(){
	$post_id = intval( $_POST['post_id'] );
	check_ajax_referer( 'mlc_nonce' );
	if ( ! current_user_can( 'edit_post', $post_id ) ) {wp_die( -1 );}

	$thumbnail_id = intval( $_POST['thumbnail_id'] );
	if ( -1 === $thumbnail_id ) {$thumbnail_id = null;}

	$return = set_post_thumbnail( $post_id, $thumbnail_id );
	wp_send_json_success( mlc_get_mlc_action_string($post_id) );

}

function mlc_get_thumb_html(){
	$post_id = intval( $_POST['post_id'] );
	check_ajax_referer( 'mlc_nonce' );

	$src = get_the_post_thumbnail($post_id, 'thumbnail');
	if (!$src){$src='No Image';};
	$src = '<div class="mlc-img-spinner" id="mlc-img-spinner-'.$post_id.'"></div>'.$src;

	wp_send_json_success( $src );
}

function mlc_get_mlc_action_string($post_id){

	$return = '';
	$thumb_id = get_post_thumbnail_id($post_id);
	$img_alias .= '<div class="mlc-action-spinner" id="mlc-action-spinner-'. $post_id .'"></div>';

	if (get_post_type($post_id) == 'product'){
		$img_alias .= '<a class="mlc-action-text">Product Image</a>';
	}else {
		$img_alias .= '<a class="mlc-action-text">Featured Image</a>';
	};
	$return = $img_alias . ' - '.'<a href="' .
		esc_url( get_upload_iframe_src( 'image', $post_id ) ) .
		'&height=618&width=504" class="mlc_set_thumb"' . ' id="' . 
		$post_id . '">' . __('Set') . '</a>' .
		' <input type="hidden"' . ' id="_thumbnail_id_'. $post_id .
		'" name="_thumbnail_id_'. $post_id . '" value="'. $thumb_id .'">';
	if($thumb_id<>'') {
		$return = $return . '&nbsp;-&nbsp;<a href="#"' .
			' class="mlc_remove_thumb"' . ' id="' . $post_id . '">' . 
			'' . __('Remove') . '</a>';
	}

	return $return;

}

function mlc_post_row_actions($actions, $post){
	if (did_action('wp_enqueue_media')==0){wp_enqueue_media();}
	$post_id = $post->ID;
	$actions['mlc-actions-'.$post_id] = mlc_get_mlc_action_string($post_id);
	return $actions;
}

function mc_product_posts_custom_column($column, $post_id){
	if ($column == 'mlc-thumb') {
		$src = get_the_post_thumbnail($post_id, 'thumbnail');
		if (!$src){$src = 'No Image';};
		$src .= '<div class="mlc-img-spinner" id="mlc-img-spinner-'.$post_id.'"></div>';
		echo $src;
	}
}

function mc_product_posts_columns($columns){

	if (key_exists('thumb', $columns)){
		$col_name = $columns['thumb'];
		unset( $columns['thumb'] ) ;
		$first_col = array_slice($columns, 0, 1 );
		$columns = $first_col + array('mlc-thumb'=>$col_name) + $columns;
	}
	return $columns;
}
 
function mc_filename_prefilter($file){

  if($file['name'] == 'blob' and  $file['type'] =='image/jpeg'){
  	$file['name'] = 'MLC_IMG-'. date('YmdHis') .'.jpg';
  }
  return $file;

}

function mlc_add_src_scripts(){

	wp_deregister_script( 'plupload' );

	wp_register_script('moxie', plugins_url('./assets/js/vendor/plupload/moxie.js', __FILE__), null, '1.3.4', false);
	wp_register_script('plupload', plugins_url('./assets/js/vendor/plupload/plupload.dev.js', __FILE__), array('moxie'), '2.1.8', false);

	wp_enqueue_script('moxie');

}

function mlc_add_script(){

	//Scripts
	wp_register_script('mlc_vendor_adapter',
	  'https://webrtc.github.io/adapter/adapter-latest.js',
	  array(),
	  false,
	  true);
	wp_register_script('media_library_camera', 
	  plugins_url('./assets/js/mlc.js', __FILE__), 
	  array('media-views', 'mlc_vendor_adapter'), 
	  false, 
	  true);
	wp_register_script('featured_image_camera', 
	  plugins_url('./assets/js/fic.js', __FILE__), 
	  array('media-views', 'mlc_vendor_adapter'), 
	  false, 
	  true);
  wp_register_script('post_list_camera', 
	  plugins_url('./assets/js/plc.js', __FILE__), 
	  array('featured_image_camera', 'mlc_vendor_adapter'), 
	  false, 
	  true);
 	wp_localize_script('post_list_camera',
 	 'mlc', 
 	 array('nonce' =>  wp_create_nonce( 'mlc_nonce' )));
    wp_enqueue_script('common');
    wp_enqueue_script('mlc_vendor_adapter');
    wp_enqueue_script('media_library_camera');
    wp_enqueue_script('featured_image_camera');
    wp_enqueue_script('post_list_camera');

    //Styles
    wp_register_style('media_library_camera_css', 
      plugins_url('/assets/css/styles.css', __FILE__), 
      array(), 
      '0.0.1');
    wp_enqueue_style( 'media_library_camera_css');
}

function mlc_media_string($strings,  $post){
    $strings['mediaLibraryCameraMenuTitle'] = __('Insert From Snapshot', 'media_library_camera');
    $strings['mediaLibraryCameraButton'] = __('Add to Library', 'media_library_camera');
    return $strings;
}

function mlc_templates(){
?>
<script type="text/html" id="tmpl-media-libary-camera">
  <div class="eyepiece-wrapper" id="eyepiece-wrapper">
  	<h5>Camera - Click to take a picture</h5>
    <select id="cameras"></select>
  	<div title="Eyepiece" class="eyepiece" id="eyepiece">
      <video id="camera">Select a Camera to Start</video>
  	</div>
  </div>
  <div title="Gallery" class="gallary-wrapper" id="gallary-wrapper">
  	<h5>Gallery - Select the desired pictures and click <em>Save Picture</em> to upload</h5>
  	<div class="gallery" id="gallery"></div>
  </div>
</script>
<?php }

?>