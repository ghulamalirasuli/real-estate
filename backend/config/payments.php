<?php

return [
    'mode' => env('PAYMENT_MODE', 'demo'),

    'currency' => env('PAYMENT_CURRENCY', 'USD'),

    'boost_price' => (float) env('BOOST_PRICE', 9.99),

    'boost_days' => (int) env('BOOST_DAYS', 30),

    'lead_price' => (float) env('LEAD_PRICE', 4.99),

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
];
