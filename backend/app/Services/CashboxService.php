<?php

namespace App\Services;

use App\Models\Cashbox;
use App\Models\LedgerLine;

class CashboxService
{
    public function balance(Cashbox $cashbox): float
    {
        $movement = LedgerLine::where('cashbox_id', $cashbox->id)
            ->selectRaw('COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0) as net')
            ->value('net');

        $opening = (float) $cashbox->opening_debit - (float) $cashbox->opening_credit;

        return round($opening + (float) $movement, 2);
    }

    public function balanceInBase(Cashbox $cashbox): float
    {
        $movement = LedgerLine::where('cashbox_id', $cashbox->id)
            ->selectRaw('COALESCE(SUM(CASE WHEN debit > 0 THEN base_amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN credit > 0 THEN base_amount ELSE 0 END), 0) as net')
            ->value('net');

        $default = app(CurrencyService::class)->defaultCurrency();
        $openingNet = (float) $cashbox->opening_debit - (float) $cashbox->opening_credit;
        $openingBase = $default && $cashbox->currency_id === $default->id
            ? $openingNet
            : app(CurrencyService::class)->convertToBase($openingNet, $cashbox->currency);

        return round($openingBase + (float) $movement, 2);
    }
}
