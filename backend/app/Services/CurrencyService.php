<?php

namespace App\Services;

use App\Models\Currency;
use App\Models\ExchangeRate;
use Illuminate\Support\Carbon;

class CurrencyService
{
    public function defaultCurrency(): ?Currency
    {
        return Currency::where('is_default', true)->where('is_active', true)->first()
            ?? Currency::where('is_active', true)->first();
    }

    public function rateToBase(Currency $currency, ?Carbon $date = null): float
    {
        if ($currency->is_default) {
            return 1.0;
        }

        $date = $date ?? now();

        $rate = ExchangeRate::where('currency_id', $currency->id)
            ->where('effective_date', '<=', $date->toDateString())
            ->orderByDesc('effective_date')
            ->first();

        return $rate ? (float) $rate->rate_to_base : 1.0;
    }

    public function convertToBase(float $amount, Currency $currency, ?Carbon $date = null): float
    {
        return round($amount * $this->rateToBase($currency, $date), 2);
    }

    public function setDefault(Currency $currency): void
    {
        Currency::where('is_default', true)->update(['is_default' => false]);
        $currency->update(['is_default' => true, 'is_active' => true]);

        ExchangeRate::updateOrCreate(
            [
                'currency_id' => $currency->id,
                'effective_date' => now()->toDateString(),
            ],
            ['rate_to_base' => 1]
        );
    }
}
