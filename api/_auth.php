<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure'   => (($_SERVER['HTTPS'] ?? '') === 'on'),
]);
session_name('NEXBMS_ADMIN');
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function respond(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function require_login(): void {
    if (empty($_SESSION['admin'])) {
        respond(401, ['ok' => false, 'detail' => 'Authentication required.']);
    }
    try {
        $user = admin_collection()->findOne(['username' => $_SESSION['admin']['user'] ?? '']);
        if (!$user || ($user['status'] ?? '') !== 'active' ||
            !in_array((string) ($user['role'] ?? ''), ['admin', 'super_admin'], true) ||
            !hash_equals((string) ($user['session_version'] ?? ''), (string) ($_SESSION['admin']['version'] ?? ''))) {
            respond(401, ['ok' => false, 'detail' => 'Authentication required.']);
        }
    } catch (Throwable $e) {
        error_log('[auth.php] ' . $e->getMessage());
        respond(500, ['ok' => false, 'detail' => 'Could not check authentication.']);
    }
}

function admin_collection(): MongoDB\Collection {
    $uri = $_ENV['MONGODB_URI'] ?? '';
    if ($uri === '') respond(500, ['ok' => false, 'detail' => 'Database connection is not configured.']);
    $client = new MongoDB\Client($uri);
    return $client->selectDatabase($_ENV['MONGODB_DB'] ?? 'nexum_bms')->selectCollection('admin_users');
}

function login_user(string $user, string $version): void {
    session_regenerate_id(true);
    $_SESSION['admin'] = ['user' => $user, 'version' => $version, 'at' => time()];
}

function logout_user(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}
