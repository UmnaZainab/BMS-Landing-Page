<?php
require __DIR__ . '/_auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (empty($_SESSION['admin'])) respond(200, ['ok' => true, 'authenticated' => false]);
    require_login();
    respond(200, ['ok' => true, 'authenticated' => true]);
}

if ($method !== 'POST') {
    respond(405, ['ok' => false, 'detail' => 'Method not allowed.']);
}

$raw  = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, ['ok' => false, 'detail' => 'Invalid JSON payload.']);
}

$username = is_string($data['user'] ?? null) ? strtolower(trim($data['user'])) : '';
$password = is_string($data['pass'] ?? null) ? $data['pass'] : '';
try {
    $user = admin_collection()->findOne(['username' => $username]);
    if (!$user || ($user['status'] ?? '') !== 'active' ||
        !in_array((string) ($user['role'] ?? ''), ['admin', 'super_admin'], true) ||
        !password_verify($password, (string) ($user['password_hash'] ?? ''))) {
        respond(401, ['ok' => false, 'detail' => 'Invalid credentials.']);
    }
    login_user($username, (string) $user['session_version']);
} catch (Throwable $e) {
    error_log('[login.php] ' . $e->getMessage());
    respond(500, ['ok' => false, 'detail' => 'Could not sign in.']);
}
respond(200, ['ok' => true, 'authenticated' => true]);
