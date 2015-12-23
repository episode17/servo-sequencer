<?php
header('Content-disposition: attachment; filename=sequence-' . time() . '.json');
header('Content-Type: application/json');
if (isset($_GET['json'])) {
    echo urldecode($_GET['json']);
} else {
    echo 'No JSON provided.';
}