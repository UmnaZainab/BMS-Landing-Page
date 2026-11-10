<?php
require __DIR__ . '/_auth.php';

use MongoDB\Client;
use MongoDB\BSON\UTCDateTime;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, ['ok' => false, 'detail' => 'Method not allowed.']);
}

require_login();

$uri = $_ENV['MONGODB_URI'] ?? '';
if ($uri === '') {
    respond(500, ['ok' => false, 'detail' => 'Server misconfigured: MONGODB_URI missing.']);
}
$dbName = $_ENV['MONGODB_DB'] ?? 'nexum_bms';

try {
    $client     = new Client($uri);
    $collection = $client->selectDatabase($dbName)->selectCollection('inquiries');
    $cursor     = $collection->find([], [
        'sort'  => ['created_at' => -1],
        'limit' => 500,
    ]);

    $items = [];
    foreach ($cursor as $doc) {
        $createdAt = $doc['created_at'] ?? null;
        $items[] = [
            'id'         => (string) ($doc['_id'] ?? ''),
            'full_name'  => (string) ($doc['full_name'] ?? ''),
            'email'      => (string) ($doc['email']     ?? ''),
            'phone'      => (string) ($doc['phone']     ?? ''),
            'subject'    => (string) ($doc['subject']   ?? ''),
            'message'    => (string) ($doc['message']   ?? ''),
            'created_at' => $createdAt instanceof UTCDateTime
                ? $createdAt->toDateTime()->format(DateTimeInterface::ATOM)
                : null,
        ];
    }
} catch (Throwable $e) {
    error_log('[inquiries.php] ' . $e->getMessage());
    respond(500, ['ok' => false, 'detail' => 'Could not load inquiries.']);
}

respond(200, ['ok' => true, 'items' => $items]);
