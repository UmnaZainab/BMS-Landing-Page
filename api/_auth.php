<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();

// Docker Compose env_file / phpdotenv sometimes leave surrounding quotes or
// trailing whitespace on values. Strip them for keys that are compared
// character-exactly against user input.
foreach (['ADMIN_USER', 'ADMIN_PASSWORD'] as $k) {
    if (isset($_ENV[$k])) {
        $_ENV[$k] = trim($_ENV[$k], "\"' \t\n\r");
    }
}

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
}

function login_user(string $user): void {
    session_regenerate_id(true);
    $_SESSION['admin'] = ['user' => $user, 'at' => time()];
}

function logout_user(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}
