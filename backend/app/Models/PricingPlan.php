<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingPlan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'billing_period',
        'max_properties',
        'featured_listings',
        'is_active',
        'features',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'features' => 'array',
            'price' => 'decimal:2',
            'featured_listings' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
