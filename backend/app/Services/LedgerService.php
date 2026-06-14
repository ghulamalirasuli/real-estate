<?php

namespace App\Services;

use App\Models\Currency;
use App\Models\LedgerAccount;
use App\Models\LedgerEntry;
use App\Models\LedgerLine;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class LedgerService
{
    public function __construct(private CurrencyService $currencyService) {}

    /**
     * @param  array<int, array{account_id: int, cashbox_id?: int|null, currency_id: int, debit?: float, credit?: float, amount: float}>  $lines
     */
    public function postEntry(
        string $description,
        array $lines,
        ?string $entryDate = null,
        ?User $creator = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        string $status = 'confirmed',
    ): LedgerEntry {
        if (count($lines) === 1) {
            $lines = $this->expandSingleLine($lines[0]);
        }

        if (count($lines) < 2) {
            throw new InvalidArgumentException('A ledger entry requires at least two lines.');
        }

        $defaultCurrency = $this->currencyService->defaultCurrency();
        if (! $defaultCurrency) {
            throw new InvalidArgumentException('No default currency configured.');
        }

        $entryDateCarbon = $entryDate ? Carbon::parse($entryDate) : now();
        $totalDebit = 0.0;
        $totalCredit = 0.0;
        $preparedLines = [];

        foreach ($lines as $line) {
            $debit = round((float) ($line['debit'] ?? 0), 2);
            $credit = round((float) ($line['credit'] ?? 0), 2);
            $amount = round((float) $line['amount'], 2);

            if (($debit > 0 && $credit > 0) || ($debit <= 0 && $credit <= 0)) {
                throw new InvalidArgumentException('Each line must have either a debit or a credit.');
            }

            $currency = Currency::findOrFail($line['currency_id']);
            $baseAmount = $this->currencyService->convertToBase($amount, $currency, $entryDateCarbon);

            $totalDebit += $debit > 0 ? $baseAmount : 0;
            $totalCredit += $credit > 0 ? $baseAmount : 0;

            $side = $debit > 0 ? 'debit' : 'credit';
            $accountId = $line['account_id'] ?? $this->resolveAccountId($side, $line['party_type'] ?? null);

            $preparedLines[] = [
                'account_id' => $accountId,
                'cashbox_id' => $line['cashbox_id'] ?? null,
                'user_id' => $line['user_id'] ?? null,
                'currency_id' => $currency->id,
                'debit' => $debit,
                'credit' => $credit,
                'amount' => $amount,
                'base_amount' => $baseAmount,
            ];
        }

        if (abs($totalDebit - $totalCredit) > 0.01) {
            throw new InvalidArgumentException('Debits and credits must balance in base currency.');
        }

        $normalizedDescription = trim($description) !== '' ? trim($description) : '';

        $normalizedStatus = in_array($status, ['confirmed', 'pending', 'cancelled'], true) ? $status : 'confirmed';

        return DB::transaction(function () use ($normalizedDescription, $normalizedStatus, $preparedLines, $entryDate, $creator, $referenceType, $referenceId) {
            $entry = LedgerEntry::create([
                'entry_date' => $entryDate ?? now()->toDateString(),
                'description' => $normalizedDescription,
                'status' => $normalizedStatus,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_by' => $creator?->id,
            ]);

            foreach ($preparedLines as $line) {
                LedgerLine::create(array_merge($line, ['ledger_entry_id' => $entry->id]));
            }

            return $entry->load(['lines.account', 'lines.cashbox', 'lines.currency', 'lines.user:id,name,role', 'creator']);
        });
    }

    /**
     * @param  array{party_type?: string|null, user_id?: int|null, cashbox_id?: int|null, currency_id: int, debit?: float, credit?: float, amount: float}  $line
     * @return array<int, array<string, mixed>>
     */
    private function expandSingleLine(array $line): array
    {
        $amount = round((float) $line['amount'], 2);
        $isDebit = (float) ($line['debit'] ?? 0) > 0;

        $shared = [
            'currency_id' => $line['currency_id'],
            'party_type' => $line['party_type'] ?? null,
            'user_id' => $line['user_id'] ?? null,
            'amount' => $amount,
        ];

        $cashLine = array_merge($shared, [
            'cashbox_id' => $line['cashbox_id'] ?? null,
            'user_id' => null,
            'party_type' => null,
        ]);

        $partyLine = array_merge($shared, [
            'cashbox_id' => null,
        ]);

        if ($isDebit) {
            return [
                array_merge($cashLine, ['debit' => $amount, 'credit' => 0]),
                array_merge($partyLine, ['debit' => 0, 'credit' => $amount]),
            ];
        }

        return [
            array_merge($partyLine, ['debit' => $amount, 'credit' => 0]),
            array_merge($cashLine, ['debit' => 0, 'credit' => $amount]),
        ];
    }

    private function resolveAccountId(string $side, ?string $partyType): int
    {
        if ($side === 'debit') {
            $code = match ($partyType) {
                'agent' => '5020',
                'customer' => '4090',
                default => '1000',
            };

            return LedgerAccount::where('code', $code)->firstOrFail()->id;
        }

        $code = match ($partyType) {
            'agent' => '5020',
            'customer' => '4020',
            default => '1000',
        };

        return LedgerAccount::where('code', $code)->firstOrFail()->id;
    }

    public function postPaymentEntry(Payment $payment): ?LedgerEntry
    {
        if ($payment->status !== 'completed') {
            return null;
        }

        if (LedgerEntry::where('reference_type', Payment::class)
            ->where('reference_id', $payment->id)
            ->exists()) {
            return null;
        }

        $defaultCurrency = $this->currencyService->defaultCurrency();
        $currency = $payment->currency_id
            ? Currency::find($payment->currency_id)
            : $defaultCurrency;

        if (! $currency) {
            return null;
        }

        $amount = (float) $payment->amount;
        $cashAccount = LedgerAccount::where('code', '1000')->first();
        $revenueAccount = match ($payment->type) {
            'subscription' => LedgerAccount::where('code', '4000')->first(),
            'boost' => LedgerAccount::where('code', '4010')->first(),
            'lead' => LedgerAccount::where('code', '4020')->first(),
            default => LedgerAccount::where('code', '4090')->first(),
        };

        if (! $cashAccount || ! $revenueAccount) {
            return null;
        }

        return $this->postEntry(
            "Payment: {$payment->type} #{$payment->id}",
            [
                [
                    'account_id' => $cashAccount->id,
                    'currency_id' => $currency->id,
                    'debit' => $amount,
                    'credit' => 0,
                    'amount' => $amount,
                ],
                [
                    'account_id' => $revenueAccount->id,
                    'currency_id' => $currency->id,
                    'debit' => 0,
                    'credit' => $amount,
                    'amount' => $amount,
                ],
            ],
            $payment->paid_at?->toDateString(),
            null,
            Payment::class,
            $payment->id,
        );
    }
}
