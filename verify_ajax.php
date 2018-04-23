<?php
namespace Stanford\BriteVerify;
/** @var \Stanford\BriteVerify\BriteVerify $module */

global $pid, $project_id;

$email      = @$_POST['email'];
$record     = @$_POST['record'];
$event_id   = @$_POST['event_id'];
$field_name = @$_POST['field'];

// $result = (int)

list($success, $message) = $module->verifyEmail($field_name, $email, $record, $event_id);

$module::log("Incoming: $email / result: " . ($success ? "true" : "false") . " / " . $message);

$data = array(
    "success" => $success,
    "message" => $message
);

header("application/json");
echo json_encode($data);
//$result;
exit();


sleep(3);
// echo 0;
echo random_int(0,1);
exit();



print "<pre>" . print_r($module->fields,true) . "</pre>";







?>
