<?php
/*
 * Plugin Name: Media Library Camera
 * Plugin URI: https://github.com/rpcvth99/media-library-camera
 * Description: Use your device's camera or computer webcam to add images to media library
 * Author: Steve Datz
 * Version: 0.3
 * Author URI: https://github.com/rpcvth99/
 * Text Domain: media-libary-camera
 * License: GPL-3.0+
 * License URI: http://www.gnu.org/licenses/gpl-3.0.txt
 * GitHub Plugin URI: https://github.com/rpcvth99/media-library-camera
 * GitHub Branch: master
 */

add_filter('post_row_actions', 'mlc_post_row_actions', 10, 2);

function mlc_post_row_actions($actions, $post){
	wp_enqueue_media();
	$post_id = $post->ID;
	$thumb_id = get_post_thumbnail_id($post_id);
	
	$actions['mlc_link'] = '<a href="' . 
		esc_url( get_upload_iframe_src( 'image', $post_id ) ) .
		'&height=618&width=504" class="mlc_set_fi"' . 
		' id="' . $post_id . '">' .
		__('Featured Image') . '</a>' .
		' <input type="hidden"' .
		' id="_thumbnail_id_'. $post_id .
		'" name="_thumbnail_id_'. $post_id .
		'" value="'. $thumb_id .'">';
	return $actions;
}

add_filter('wp_handle_upload_prefilter', 'mc_filename_prefilter');
function mc_filename_prefilter($file){

  if($file['name'] == 'blob' and  $file['type'] =='image/jpeg'){
  	$file['name'] = 'MLC_IMG-'. date('YmdHis') .'.jpg';
  }
  return $file;

}

add_action('admin_enqueue_scripts', 'mlc_add_src_scripts', 0);
function mlc_add_src_scripts(){

	wp_deregister_script( 'plupload' );

	wp_register_script('moxie', plugins_url('./assets/js/vendor/plupload/moxie.js', __FILE__), null, '1.3.4', false);
	wp_register_script('plupload', plugins_url('./assets/js/vendor/plupload/plupload.dev.js', __FILE__), array('moxie'), '2.1.8', false);

	wp_enqueue_script('moxie');

}

add_action('admin_enqueue_scripts', 'mlc_add_script');
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
// 	wp_localize_script('media_library_camera',
// 	 'mlc', 
// 	 array('assets' => plugin_dir_url( __FILE__ ).'assets/'));
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

add_filter('media_view_strings', 'mlc_media_string', 10, 2);
function mlc_media_string($strings,  $post){
    $strings['mediaLibraryCameraMenuTitle'] = __('Insert From Snapshot', 'media_library_camera');
    $strings['mediaLibraryCameraButton'] = __('Add to Library', 'media_library_camera');
    return $strings;
}

add_action('print_media_templates', 'mlc_templates');
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