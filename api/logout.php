<?php
require __DIR__ . '/_auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'detail' => 'Method not allowed.']);
}

logout_user();
respond(200, ['ok' => true]);
