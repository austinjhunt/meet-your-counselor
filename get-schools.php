
<?php
// Replace parse_ini_file with actual app id and api key when deployed to Cascade CMS. 
// do not publish config.ini to CMS or GitHub. 
// Using config.ini for local development so we can avoid hardcoding values in version control. 
$SCHOOLDIGGER_APP_ID = parse_ini_file("config.ini")["SCHOOLDIGGER_APP_ID"];
$SCHOOLDIGGER_API_KEY = parse_ini_file("config.ini")["SCHOOLDIGGER_API_KEY"];
$BASE_SCHOOLDIGGER_URL = "https://api.schooldigger.com";
if (isset($_GET['q'])) {
    $query_array = array(
        'q' => $_GET['q'],
        'appID' => $SCHOOLDIGGER_APP_ID,
        'appKey' => $SCHOOLDIGGER_API_KEY,
        'returnCount' => 20,
        'qSearchCityStateName' => TRUE
    );
    $query = http_build_query($query_array);
    header('Content-Type: application/json; charset=utf-8');
    $url = $BASE_SCHOOLDIGGER_URL . "/v2.0/autocomplete/schools?" . $query;
    echo file_get_contents($url);
}
?>