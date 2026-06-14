<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Currency extends Model
{
    protected $fillable = [
        'code',
        'symbol',
        'name',
        'decimal_places',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'decimal_places' => 'integer',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function exchangeRates(): HasMany
    {
        return $this->hasMany(ExchangeRate::class);
    }

    public function cashboxes(): HasMany
    {
        return $this->hasMany(Cashbox::class);
    }
}
