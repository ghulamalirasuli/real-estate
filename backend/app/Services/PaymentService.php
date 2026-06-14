<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(
        private CurrencyService $currencyService,
        private LedgerService $ledgerService,
    ) {}

    public function process(User $user, string $type, float $amount, ?string $description = null, ?string $referenceType = null, ?int $referenceId = null): Payment
    {
        $currency = $this->currencyService->defaultCurrency();
        $rate = $currency ? $this->currencyService->rateToBase($currency) : 1.0;
        $baseAmount = $currency ? $this->currencyService->convertToBase($amount, $currency) : $amount;

        $payment = Payment::create([
            'user_id' => $user->id,
            'type' => $type,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'amount' => $amount,
            'currency_id' => $currency?->id,
            'exchange_rate' => $rate,
            'base_amount' => $baseAmount,
            'status' => 'pending',
            'gateway' => config('payments.mode'),
            'description' => $description,
        ]);

        if (config('payments.mode') === 'demo') {
            $payment->update([
                'status' => 'completed',
                'transaction_id' => 'demo_'.Str::uuid(),
                'paid_at' => now(),
            ]);
            $payment = $payment->fresh();
            $this->ledgerService->postPaymentEntry($payment);
        }

        return $payment->fresh();
    }
}
