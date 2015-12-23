<?php
// (1) Update redis command params
// (2) Send response


if (isset($_GET['action']) && isset($_GET['params'])) {
    echo $_GET['action'];
    echo $_GET['params'];
} else {
    echo "ERROR";
}