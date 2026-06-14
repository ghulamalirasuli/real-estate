<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cashbox extends Model
{
    protected $fillable = [
        'name',
        'description',
        'currency_id',
        'opening_debit',
        'opening_credit',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'opening_debit' => 'decimal:2',
            'opening_credit' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function ledgerLines(): HasMany
    {
        return $this->hasMany(LedgerLine::class);
    }
}
