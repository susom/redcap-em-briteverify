<?php
namespace Stanford\BriteVerify;

include_once("Util.php");

use REDCap;

class BriteVerify extends \ExternalModules\AbstractExternalModule
{
    private $apiKey;
    private $emailFields = array();
    private $isSurvey = false;

    function __construct()
    {
        parent::__construct();

        global $project_id;
        if ($project_id) {
            // Get the api key
            $this->apiKey = $this->getProjectSetting("api-key");

            // Set the fields/config
            $fields = $this->getSubSettings("email-fields");
            foreach ($fields as $params) {
                $field_name = $params['email_field'];
                $this->emailFields[$field_name] = $params;
            }
        }
    }


    function redcap_survey_page_top($project_id, $record = NULL, $instrument, $event_id, $group_id = NULL, $survey_hash, $response_id = NULL, $repeat_instance = 1) {
        $this->isSurvey = true;
        $this->initializeFields($project_id, $instrument, $record, $event_id);
    }


    function redcap_data_entry_form_top($project_id, $record = NULL, $instrument, $event_id, $group_id = NULL, $repeat_instance = 1) {
        $this->initializeFields($project_id, $instrument, $record, $event_id);
    }


    // function getSessionToken() {
    //     // A session
    // }


    function verifyEmail($field_name, $email, $record = null, $event_id = null) {
        $email = strtolower($email);

        if(filter_var($email, FILTER_VALIDATE_EMAIL)) {

            // Valid email
            // https://support.briteverify.com/briteverify-verification-apis/real-time-email-api
            // Possible Status Values:  Invalid, Valid, Unknown, Accept All
            $url = "https://bpi.briteverify.com/emails.json?address=" . $email . "&apikey=" . $this->apiKey;

            $q = http_get($url);
            // self::log("RAW GET", $q);
            $q = json_decode($q,true);

            $status = isset($q['status']) ? strtolower($q['status']) : NULL;
            // self::log("Raw Status: " . $status);
            if (!empty($q['errors'])) $status = "errors";


            self::log("RESULT", $q);


            $result = false;
            $failUnknownError = $this->emailFields[$field_name]['fail-unknown-error'];
            $message = "";

            switch ($status) {
                case "errors":
                    self::log("Errors from BrightVerify Service", $q, "ERROR");
                    $result = true;
                    $message = "Error during verification";
                    if ($failUnknownError) $result = false;
                    break;
                case "unknown":
                    $message = "Unknown";
                    $result = true;
                    if ($failUnknownError) $result = false;
                    break;
                case "valid":
                    $message = "Valid Email";
                    $result = true;
                    break;
                case "accept_all":
                    $message = "Valid Email (all)";
                    $result = true;
                    break;
                case "invalid":
                    $message = "Invalid Email";
                    $result = false;
                    break;
                default:
                    $message = "Unknown Response";
                    self::log("Unknown status response: $email", $q, "ERROR");
                    $result = true;
            }

            self::log("[$field_name]=$email returned $status, result " . (int) $result);
        }

        // LOG EVENT
        REDCap::logEvent("Bright Verify: " . ($result ? "Pass" : "Fail"),str_replace("&",",\n", urldecode(http_build_query($q))), "", $record, $event_id);
        return array($result, $message);
    }


    function initializeFields($project_id, $instrument, $record, $event_id) {
        // See if the enabled fields are present on this instrument
        $all_fields = REDCap::getFieldNames($instrument);

        $instrument_fields = array();
        foreach ($this->emailFields as $field_name => $params) {
            // self::log($field_name, $params);
            if (in_array($field_name,$all_fields)) {
                unset($params['email_field']);
                $instrument_fields[$field_name] = $params;
            }
        }

        // self::log($instrument_fields);

        if (empty($instrument_fields)) {
            self::log("No fields enabled for $instrument");
            return false;
        }

        // Embed CSS
        echo "<link rel='stylesheet' type='text/css' href='" . $this->getUrl("css/brightverify.css", true, true) . "'>";

        // Embed the javascript
        echo "<script src='" . $this->getUrl("js/brightverify.js",true,true) . "'></script>";
        echo "<script>BrightVerify.fields = " . json_encode($instrument_fields) . ";</script>";
        echo "<script>BrightVerify.url = " . json_encode( $this->getUrl("verify_ajax",true,true) . "&NOAUTH&pid=" . $project_id) .  ";</script>";
        echo "<script>BrightVerify.record = " . json_encode($record) . ";</script>";
        echo "<script>BrightVerify.event_id = " . json_encode($event_id) . ";</script>";
        // echo "<script>BrightVerify.session_id = " . json_encode($_SESSION) . ";</script>";
        // self::log(__METHOD__, $this->emailFields, "Instrument: $instrument");
    }


    # defines criteria to judge someone is on a development box or not
    public static function isDev()
    {
        $is_localhost  = ( @$_SERVER['HTTP_HOST'] == 'localhost' );
        $is_dev_server = ( isset($GLOBALS['is_development_server']) && $GLOBALS['is_development_server'] == '1' );
        $is_dev = ( $is_localhost || $is_dev_server ) ? 1 : 0;
        return $is_dev;
    }


    // Log Wrapper
    public static function log() {
        if (self::isDev()) {
            if (class_exists(__NAMESPACE__ . "\Util")) {
                call_user_func_array(__NAMESPACE__ . "\Util::log", func_get_args());
            }
        } else {
            error_log("NA");
        }
    }

}