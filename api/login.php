<?php
require __DIR__ . '/_auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    respond(200, ['ok' => true, 'authenticated' => !empty($_SESSION['admin'])]);
}

if ($method !== 'POST') {
    respond(405, ['ok' => false, 'detail' => 'Method not allowed.']);
}

$raw  = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, ['ok' => false, 'detail' => 'Invalid JSON payload.']);
}

$user = is_string($data['user'] ?? null) ? trim($data['user']) : '';
$pass = is_string($data['pass'] ?? null) ? $data['pass'] : '';

$expectedUser = $_ENV['ADMIN_USER']     ?? '';
$expectedPass = $_ENV['ADMIN_PASSWORD'] ?? '';

if ($expectedUser === '' || $expectedPass === '') {
    respond(500, ['ok' => false, 'detail' => 'Admin credentials not configured.']);
}

$userOk = hash_equals($expectedUser, $user);
$passOk = hash_equals($expectedPass, $pass);
if (!$userOk || !$passOk) {
    respond(401, ['ok' => false, 'detail' => 'Invalid credentials.']);
}

login_user($user);
respond(200, ['ok' => true, 'authenticated' => true]);
