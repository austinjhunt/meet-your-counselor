<?php
header('Content-Type: application/json; charset=utf-8');
echo file_get_contents(__DIR__ . '/sc-nc-city-county-map-data.json');
