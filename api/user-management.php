<?php
require __DIR__ . '/_auth.php';

use MongoDB\BSON\UTCDateTime;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['ok' => false, 'detail' => 'Method not allowed.']);
require_login();
$data = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($data)) respond(400, ['ok' => false, 'detail' => 'Invalid JSON payload.']);
$action = $data['action'] ?? '';
$users = admin_collection();
$username = $_SESSION['admin']['user'];

try {
    if ($action === 'change-password') {
        $current = $data['current_password'] ?? null;
        $next = $data['new_password'] ?? null;
        $user = $users->findOne(['username' => $username]);
        if (!is_string($current) || !$user || !password_verify($current, (string) $user['password_hash'])) {
            respond(403, ['ok' => false, 'detail' => 'Current password is incorrect.']);
        }
        if (!is_string($next) || strlen($next) < 12 || strlen($next) > 72) {
            respond(400, ['ok' => false, 'detail' => 'New password must be 12 to 72 bytes.']);
        }
        if ($current === $next) respond(400, ['ok' => false, 'detail' => 'Choose a different password.']);
        $version = bin2hex(random_bytes(16));
        $result = $users->updateOne([
            '_id' => $user['_id'],
            'password_hash' => $user['password_hash'],
            'session_version' => $user['session_version'],
        ], ['$set' => [
            'password_hash' => password_hash($next, PASSWORD_BCRYPT),
            'session_version' => $version,
            'password_changed_at' => new UTCDateTime(),
        ]]);
        if (!$result->getMatchedCount()) respond(409, ['ok' => false, 'detail' => 'Account changed. Please sign in again.']);
        login_user($username, $version);
        respond(200, ['ok' => true, 'detail' => 'Password changed.']);
    }
    if ($action === 'add-user') {
        $newUser = is_string($data['username'] ?? null) ? strtolower(trim($data['username'])) : '';
        $password = $data['password'] ?? null;
        if (!preg_match('/^[a-z0-9_.-]{3,64}$/', $newUser)) {
            respond(400, ['ok' => false, 'detail' => 'Username must be 3 to 64 letters, numbers, dots, dashes, or underscores.']);
        }
        if (!is_string($password) || strlen($password) < 12 || strlen($password) > 72) {
            respond(400, ['ok' => false, 'detail' => 'Password must be 12 to 72 characters.']);
        }
        $users->createIndex(['username' => 1], ['unique' => true]);
        if ($users->findOne(['username' => $newUser])) respond(409, ['ok' => false, 'detail' => 'Username already exists.']);
        $users->insertOne([
            'username' => $newUser,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'session_version' => bin2hex(random_bytes(16)),
            'role' => 'admin',
            'status' => 'active',
            'created_at' => new UTCDateTime(),
            'created_by' => $username,
        ]);
        respond(200, ['ok' => true, 'detail' => 'User added.']);
    }
    respond(400, ['ok' => false, 'detail' => 'Unknown action.']);
} catch (MongoDB\Driver\Exception\BulkWriteException $e) {
    if ($e->getCode() === 11000) respond(409, ['ok' => false, 'detail' => 'Username already exists.']);
    error_log('[user-management.php] ' . $e->getMessage());
    respond(500, ['ok' => false, 'detail' => 'Could not update users.']);
} catch (Throwable $e) {
    error_log('[user-management.php] ' . $e->getMessage());
    respond(500, ['ok' => false, 'detail' => 'Could not update users.']);
}
