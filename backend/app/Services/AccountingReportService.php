<?php

namespace App\Services;

use App\Models\Cashbox;
use App\Models\Currency;
use App\Models\LedgerEntry;
use App\Models\LedgerLine;
use App\Models\User;
use Illuminate\Support\Carbon;

class AccountingReportService
{
    public function __construct(
        private CashboxService $cashboxService,
        private CurrencyService $currencyService,
    ) {}

    public function profitAndLoss(?string $from = null, ?string $to = null): array
    {
        $from = $from ?? now()->startOfYear()->toDateString();
        $to = $to ?? now()->toDateString();

        $query = LedgerLine::query()
            ->join('ledger_entries', 'ledger_lines.ledger_entry_id', '=', 'ledger_entries.id')
            ->join('ledger_accounts', 'ledger_lines.account_id', '=', 'ledger_accounts.id')
            ->whereBetween('ledger_entries.entry_date', [$from, $to]);

        $income = (clone $query)
            ->where('ledger_accounts.type', 'income')
            ->where('ledger_lines.credit', '>', 0)
            ->sum('ledger_lines.base_amount');

        $expenses = (clone $query)
            ->where('ledger_accounts.type', 'expense')
            ->where('ledger_lines.debit', '>', 0)
            ->sum('ledger_lines.base_amount');

        $income = (float) $income;
        $expenses = (float) $expenses;

        $incomeByAccount = LedgerLine::query()
            ->join('ledger_entries', 'ledger_lines.ledger_entry_id', '=', 'ledger_entries.id')
            ->join('ledger_accounts', 'ledger_lines.account_id', '=', 'ledger_accounts.id')
            ->where('ledger_accounts.type', 'income')
            ->where('ledger_lines.credit', '>', 0)
            ->whereBetween('ledger_entries.entry_date', [$from, $to])
            ->groupBy('ledger_accounts.id', 'ledger_accounts.code', 'ledger_accounts.name')
            ->selectRaw('ledger_accounts.id, ledger_accounts.code, ledger_accounts.name, SUM(ledger_lines.base_amount) as total')
            ->get();

        $expensesByAccount = LedgerLine::query()
            ->join('ledger_entries', 'ledger_lines.ledger_entry_id', '=', 'ledger_entries.id')
            ->join('ledger_accounts', 'ledger_lines.account_id', '=', 'ledger_accounts.id')
            ->where('ledger_accounts.type', 'expense')
            ->where('ledger_lines.debit', '>', 0)
            ->whereBetween('ledger_entries.entry_date', [$from, $to])
            ->groupBy('ledger_accounts.id', 'ledger_accounts.code', 'ledger_accounts.name')
            ->selectRaw('ledger_accounts.id, ledger_accounts.code, ledger_accounts.name, SUM(ledger_lines.base_amount) as total')
            ->get();

        $defaultCurrency = $this->currencyService->defaultCurrency();

        return [
            'period' => ['from' => $from, 'to' => $to],
            'currency' => $defaultCurrency,
            'total_income' => round($income, 2),
            'total_expenses' => round($expenses, 2),
            'net_profit' => round($income - $expenses, 2),
            'income_by_account' => $incomeByAccount,
            'expenses_by_account' => $expensesByAccount,
        ];
    }

    public function cashboxSummary(): array
    {
        $defaultCurrency = $this->currencyService->defaultCurrency();

        return Cashbox::with('currency')
            ->orderBy('id')
            ->get()
            ->map(fn (Cashbox $cashbox) => [
                'id' => $cashbox->id,
                'name' => $cashbox->name,
                'currency' => $cashbox->currency,
                'opening_debit' => (float) $cashbox->opening_debit,
                'opening_credit' => (float) $cashbox->opening_credit,
                'opening_net' => (float) $cashbox->opening_debit - (float) $cashbox->opening_credit,
                'current_balance' => $this->cashboxService->balance($cashbox),
                'balance_in_base' => $this->cashboxService->balanceInBase($cashbox),
                'is_active' => $cashbox->is_active,
            ])
            ->all();
    }

    public function monthlyProfit(int $months = 6): array
    {
        $start = now()->subMonths($months - 1)->startOfMonth();

        $rows = LedgerLine::query()
            ->join('ledger_entries', 'ledger_lines.ledger_entry_id', '=', 'ledger_entries.id')
            ->join('ledger_accounts', 'ledger_lines.account_id', '=', 'ledger_accounts.id')
            ->where('ledger_entries.entry_date', '>=', $start)
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->where('ledger_accounts.type', 'income')->where('ledger_lines.credit', '>', 0);
                })->orWhere(function ($q2) {
                    $q2->where('ledger_accounts.type', 'expense')->where('ledger_lines.debit', '>', 0);
                });
            })
            ->get(['ledger_entries.entry_date', 'ledger_accounts.type', 'ledger_lines.base_amount']);

        $byMonth = [];

        foreach ($rows as $row) {
            $month = Carbon::parse($row->entry_date)->format('Y-m');
            if (! isset($byMonth[$month])) {
                $byMonth[$month] = ['month' => $month, 'income' => 0.0, 'expenses' => 0.0, 'profit' => 0.0];
            }
            if ($row->type === 'income') {
                $byMonth[$month]['income'] += (float) $row->base_amount;
            } elseif ($row->type === 'expense') {
                $byMonth[$month]['expenses'] += (float) $row->base_amount;
            }
        }

        foreach ($byMonth as &$item) {
            $item['income'] = round($item['income'], 2);
            $item['expenses'] = round($item['expenses'], 2);
            $item['profit'] = round($item['income'] - $item['expenses'], 2);
        }

        ksort($byMonth);

        return array_values($byMonth);
    }

    public function partyLedgerSummary(): array
    {
        $defaultCurrency = $this->currencyService->defaultCurrency();

        $userIds = LedgerLine::query()
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id');

        $users = User::whereIn('id', $userIds)->get(['id', 'name', 'role'])->keyBy('id');

        $partiesList = $userIds->map(function (int $userId) use ($users) {
            $user = $users->get($userId);
            $balancesByCurrency = $this->partyBalancesByCurrency($userId);

            return [
                'user' => $user,
                'party_type' => $user?->role === 'agent' ? 'agent' : 'customer',
                'balances_by_currency' => $balancesByCurrency,
                'balance_in_base' => round(array_sum(array_column($balancesByCurrency, 'balance_in_base')), 2),
                'record_count' => LedgerEntry::query()
                    ->whereHas('lines', fn ($q) => $q->where('user_id', $userId))
                    ->count(),
            ];
        })->sortBy(fn (array $party) => $party['user']['name'] ?? '')->values()->all();

        $totalBalance = round(array_sum(array_column($partiesList, 'balance_in_base')), 2);

        $currencyIdsInUse = LedgerLine::query()
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('currency_id');

        $currencies = Currency::whereIn('id', $currencyIdsInUse)
            ->orderByDesc('is_default')
            ->orderBy('code')
            ->get(['id', 'code', 'symbol', 'decimal_places', 'is_default']);

        $totalsByCurrency = array_fill_keys($currencies->pluck('id')->all(), 0.0);
        foreach ($partiesList as $party) {
            foreach ($party['balances_by_currency'] as $row) {
                $currencyId = $row['currency']?->id;
                if ($currencyId) {
                    $totalsByCurrency[$currencyId] += $row['balance'];
                }
            }
        }

        foreach ($totalsByCurrency as $currencyId => $total) {
            $currency = $currencies->firstWhere('id', $currencyId);
            $decimals = $currency?->decimal_places ?? 2;
            $totalsByCurrency[$currencyId] = round($total, $decimals);
        }

        return [
            'default_currency' => $defaultCurrency,
            'currencies' => $currencies,
            'total_balance' => $totalBalance,
            'totals_by_currency' => $totalsByCurrency,
            'party_count' => count($partiesList),
            'parties' => $partiesList,
        ];
    }

    /** @return array<int, array{currency: \App\Models\Currency|null, balance: float, balance_in_base: float}> */
    public function partyBalancesByCurrency(int $userId): array
    {
        $lines = LedgerLine::query()
            ->where('user_id', $userId)
            ->with('currency:id,code,symbol,decimal_places')
            ->get(['currency_id', 'debit', 'credit', 'amount', 'base_amount']);

        $byCurrency = [];

        foreach ($lines as $line) {
            $currencyId = $line->currency_id;
            if (! isset($byCurrency[$currencyId])) {
                $byCurrency[$currencyId] = [
                    'currency' => $line->currency,
                    'balance' => 0.0,
                    'balance_in_base' => 0.0,
                ];
            }

            if ((float) $line->debit > 0) {
                $byCurrency[$currencyId]['balance'] += (float) $line->amount;
                $byCurrency[$currencyId]['balance_in_base'] += (float) $line->base_amount;
            } else {
                $byCurrency[$currencyId]['balance'] -= (float) $line->amount;
                $byCurrency[$currencyId]['balance_in_base'] -= (float) $line->base_amount;
            }
        }

        return array_values(array_map(function (array $row) {
            $decimals = $row['currency']?->decimal_places ?? 2;

            return [
                'currency' => $row['currency'],
                'balance' => round($row['balance'], $decimals),
                'balance_in_base' => round($row['balance_in_base'], 2),
            ];
        }, $byCurrency));
    }

    public function partyBalance(int $userId): float
    {
        $balances = $this->partyBalancesByCurrency($userId);

        return round(array_sum(array_column($balances, 'balance_in_base')), 2);
    }

    public function partyTypeFor(User $user): string
    {
        return $user->role === 'agent' ? 'agent' : 'customer';
    }
}
