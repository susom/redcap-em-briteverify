<?php
namespace Stanford\BriteVerify;
/** @var \Stanford\BriteVerify\BriteVerify $module */

global $pid, $project_id;

$email      = @$_POST['email'];
$record     = @$_POST['record'];
$event_id   = @$_POST['event_id'];
$field_name = @$_POST['field'];

$result = (int) $module->verifyEmail($field_name, $email, $record, $event_id);

$module::log("Incoming: $email / result: $result");

echo $result;
exit();


sleep(3);
// echo 0;
echo random_int(0,1);
exit();



print "<pre>" . print_r($module->fields,true) . "</pre>";







?>
