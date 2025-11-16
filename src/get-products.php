<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// read json
$jsonData = file_get_contents(__DIR__ . '/../data/products.json');
$products = json_decode($jsonData, true);

$filtered = $products;

// category filtering
if (isset($_GET['category'])) {
    $category = $_GET['category'];
    $filtered = array_filter($filtered, fn($p) => isset($p['category']) && $p['category'] === $category);
}

// featured filtering
if (isset($_GET['featured']) && $_GET['featured'] === 'true') {
    $filtered = array_filter($filtered, fn($p) => !empty($p['featured']));
}

echo json_encode(array_values($filtered));
?>
