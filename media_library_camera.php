<?php
/*
 * Plugin Name: Media Library Camera
 * Plugin URI: https://github.com/rpcvth99/media-library-camera
 * Description: Use your device's camera or computer webcam to add images to media library
 * Author: Steve Datz
 * Version: 0.1
 * Author URI: http://ryefieldceramics.com
 * Text Domain: media-libary-camera
 * License: GPL-3.0+
 * License URI: http://www.gnu.org/licenses/gpl-3.0.txt
 * GitHub Plugin URI: https://github.com/rpcvth99/media-library-camera
 * GitHub Branch: master
 * 
 */

add_filter('wp_handle_upload_prefilter', 'mc_filename_prefilter');
function mc_filename_prefilter($file){

  if($file['name'] == 'blob' and  $file['type'] =='image/jpeg'){
  	$file['name'] = 'MLC_IMG-'. date('YmdHis') .'.jpg';
  }
  return $file;

}

if (WP_DEBUG){
	function mlc_add_src_scripts(){

		wp_deregister_script( 'plupload' );
	
		wp_register_script('moxie', plugins_url('./assets/js/vendor/plupload/moxie.js', __FILE__), null, '1.3.4', false);
		wp_register_script('plupload', plugins_url('./assets/js/vendor/plupload/plupload.dev.js', __FILE__), array('moxie'), '2.1.8', false);
	
		wp_enqueue_script('moxie');
	
	}
	add_action('admin_enqueue_scripts', 'mlc_add_src_scripts', 0);
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
	wp_localize_script('media_library_camera',
	 'mlc', 
	 array('assets' => plugin_dir_url( __FILE__ ).'assets/'));
	wp_enqueue_script('common');
	wp_enqueue_script('mlc_vendor_adapter');
    wp_enqueue_script('media_library_camera');

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
<script type="text/html" id="tmpl-mlc-camera">
  <div class="eycpiece-wrapper" id="eyepiece-wrapper">
  	<h5>Camera - Click to take a picture</h5>
    <select id="cameras"></select>
  	<div title="Eyepiece" class="eyepiece" id="eyepiece">
      <video id="camera">Select a Camera to Start</video>
  	</div>
  </div>
  <div title="Gallery" class="col-lg-8 col-md-8 col-sm-8" id="gallary-wrapper">
  	<h5>Gallery - Select the desired pictures and click <em>Save Picture</em> to upload</h5>
  	<div class="gallery" id="gallery"></div>
  </div>
</script>
<script src="https://jsconsole.com/js/remote.js?36edb111-f6c2-4081-9961-f0349ec40125"></script>
<?php }

?>