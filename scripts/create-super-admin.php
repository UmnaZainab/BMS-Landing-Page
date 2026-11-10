<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../vendor/autoload.php';
Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();

$username = isset($argv[1]) ? strtolower(trim($argv[1])) : '';
if (!preg_match('/^[a-z0-9_.-]{3,64}$/', $username)) {
    fwrite(STDERR, "Usage: php scripts/create-super-admin.php USERNAME\n");
    exit(1);
}
$uri = $_ENV['MONGODB_URI'] ?? '';
if ($uri === '') {
    fwrite(STDERR, "MONGODB_URI is not configured.\n");
    exit(1);
}

try {
    $client = new MongoDB\Client($uri);
    $dbName = $_ENV['MONGODB_DB'] ?? 'nexum_bms';
    $users = $client->selectDatabase($dbName)->selectCollection('admin_users');
    $users->createIndex(['username' => 1], ['unique' => true]);
    $users->createIndex(['role' => 1], [
        'unique' => true,
        'partialFilterExpression' => ['role' => 'super_admin'],
    ]);
    if ($users->findOne(['role' => 'super_admin'])) {
        throw new RuntimeException('A Super Admin already exists; setup has already been completed.');
    }
    $password = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
    $users->insertOne([
        'username' => $username,
        'role' => 'super_admin',
        'status' => 'active',
        'password_hash' => password_hash($password, PASSWORD_BCRYPT),
        'session_version' => bin2hex(random_bytes(16)),
        'created_at' => new MongoDB\BSON\UTCDateTime(),
    ]);
    fwrite(STDOUT, "Super Admin {$username} created in {$dbName}. Initial password: {$password}\n");
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}
