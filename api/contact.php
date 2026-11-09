<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use MongoDB\Client;
use MongoDB\BSON\UTCDateTime;
use Dotenv\Dotenv;

Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();

$corsOrigin = $_ENV['CORS_ORIGIN'] ?? '*';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $corsOrigin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Vary: Origin');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'detail' => 'Method not allowed.']);
    exit;
}

$raw  = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'detail' => 'Invalid JSON payload.']);
    exit;
}

$trim = static fn($v) => is_string($v) ? trim($v) : '';
$fullName = $trim($data['full_name'] ?? '');
$email    = $trim($data['email']     ?? '');
$phone    = $trim($data['phone']     ?? '');
$subject  = $trim($data['subject']   ?? '');
$message  = $trim($data['message']   ?? '');

$errors = [];
if ($fullName === '')                                                  $errors[] = 'full_name is required.';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL))       $errors[] = 'A valid email is required.';
if ($phone === '' || preg_match_all('/\d/', $phone) < 6)               $errors[] = 'A valid phone is required.';
if ($message === '' || mb_strlen($message) < 10)                       $errors[] = 'A message of at least 10 characters is required.';

if ($errors) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'detail' => implode(' ', $errors)]);
    exit;
}

$uri = $_ENV['MONGODB_URI'] ?? '';
if ($uri === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'detail' => 'Server misconfigured: MONGODB_URI missing.']);
    exit;
}
$dbName = $_ENV['MONGODB_DB'] ?? 'nexbms';

try {
    $client     = new Client($uri);
    $collection = $client->selectDatabase($dbName)->selectCollection('inquiries');

    $result = $collection->insertOne([
        'full_name'  => $fullName,
        'email'      => $email,
        'phone'      => $phone,
        'subject'    => $subject !== '' ? $subject : 'General Inquiry',
        'message'    => $message,
        'created_at' => new UTCDateTime(),
    ]);
} catch (Throwable $e) {
    error_log('[contact.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'detail' => 'Could not save your message. Please try again shortly.']);
    exit;
}

http_response_code(200);
echo json_encode([
    'ok' => true,
    'id' => (string) $result->getInsertedId(),
]);
