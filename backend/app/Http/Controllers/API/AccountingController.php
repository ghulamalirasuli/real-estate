<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Cashbox;
use App\Models\Currency;
use App\Models\ExchangeRate;
use App\Models\LedgerAccount;
use App\Models\LedgerEntry;
use App\Models\LedgerLine;
use App\Models\User;
use App\Services\AccountingReportService;
use App\Services\CashboxService;
use App\Services\CurrencyService;
use App\Services\LedgerService;
use App\Support\TranslatableRules;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AccountingController extends Controller
{
    public function __construct(
        private CurrencyService $currencyService,
        private CashboxService $cashboxService,
        private LedgerService $ledgerService,
        private AccountingReportService $reportService,
    ) {}

    public function overview(): JsonResponse
    {
        $defaultCurrency = $this->currencyService->defaultCurrency();
        $profit = $this->reportService->profitAndLoss();
        $cashboxes = $this->reportService->cashboxSummary();

        return response()->json([
            'default_currency' => $defaultCurrency,
            'total_cashboxes' => count($cashboxes),
            'total_cash_balance' => round(array_sum(array_column($cashboxes, 'balance_in_base')), 2),
            'net_profit' => $profit['net_profit'],
            'total_income' => $profit['total_income'],
            'total_expenses' => $profit['total_expenses'],
            'monthly_profit' => $this->reportService->monthlyProfit(),
        ]);
    }

    // --- Currencies ---

    public function currencies(): JsonResponse
    {
        $currencies = Currency::with(['exchangeRates' => fn ($q) => $q->orderByDesc('effective_date')->limit(1)])
            ->orderByDesc('is_default')
            ->orderBy('code')
            ->get();

        return response()->json($currencies);
    }

    public function storeCurrency(Request $request): JsonResponse
    {
        $validated = $request->validate(array_merge([
            'code' => 'required|string|size:3|unique:currencies,code',
            'symbol' => 'required|string|max:10',
            'decimal_places' => 'nullable|integer|min:0|max:4',
            'is_default' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
            'rate_to_base' => 'nullable|numeric|min:0',
        ], TranslatableRules::for('name')));

        $currency = Currency::create([
            'code' => strtoupper($validated['code']),
            'symbol' => $validated['symbol'],
            'name' => $validated['name'],
            'decimal_places' => $validated['decimal_places'] ?? 2,
            'is_default' => false,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $rate = $validated['rate_to_base'] ?? ($currency->is_default ? 1 : null);
        if ($rate !== null) {
            ExchangeRate::create([
                'currency_id' => $currency->id,
                'rate_to_base' => $rate,
                'effective_date' => now()->toDateString(),
            ]);
        }

        if ($request->boolean('is_default')) {
            $this->currencyService->setDefault($currency);
        }

        return response()->json($currency->load('exchangeRates'), 201);
    }

    public function updateCurrency(Request $request, Currency $currency): JsonResponse
    {
        $validated = $request->validate(array_merge([
            'code' => 'sometimes|string|size:3|unique:currencies,code,'.$currency->id,
            'symbol' => 'sometimes|string|max:10',
            'decimal_places' => 'sometimes|integer|min:0|max:4',
            'is_active' => 'sometimes|boolean',
        ], TranslatableRules::for('name', false)));

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $currency->update($validated);

        if ($request->boolean('is_default')) {
            $this->currencyService->setDefault($currency);
        }

        return response()->json($currency->fresh()->load('exchangeRates'));
    }

    public function deleteCurrency(Currency $currency): JsonResponse
    {
        if ($currency->is_default) {
            return response()->json(['message' => 'Cannot delete the default currency.'], 422);
        }

        $currency->delete();

        return response()->json(['message' => 'Currency deleted.']);
    }

    // --- Exchange rates ---

    public function exchangeRates(Request $request): JsonResponse
    {
        $query = ExchangeRate::with('currency')->orderByDesc('effective_date');

        if ($request->filled('currency_id')) {
            $query->where('currency_id', $request->currency_id);
        }

        return response()->json($query->paginate(30));
    }

    public function storeExchangeRate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'currency_id' => 'required|exists:currencies,id',
            'rate_to_base' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
        ]);

        $currency = Currency::findOrFail($validated['currency_id']);
        if ($currency->is_default) {
            $validated['rate_to_base'] = 1;
        }

        $rate = ExchangeRate::updateOrCreate(
            [
                'currency_id' => $validated['currency_id'],
                'effective_date' => $validated['effective_date'],
            ],
            ['rate_to_base' => $validated['rate_to_base']]
        );

        return response()->json($rate->load('currency'), 201);
    }

    // --- Cashboxes ---

    public function cashboxes(Request $request): JsonResponse
    {
        $query = Cashbox::with('currency')->orderBy('id');

        if ($request->filled('currency_id')) {
            $query->where('currency_id', $request->currency_id);
        }

        $cashboxes = $query->get()
            ->map(fn (Cashbox $cashbox) => array_merge($cashbox->toArray(), [
                'current_balance' => $this->cashboxService->balance($cashbox),
                'balance_in_base' => $this->cashboxService->balanceInBase($cashbox),
            ]));

        return response()->json($cashboxes);
    }

    public function cashboxesByCurrency(): JsonResponse
    {
        $defaultCurrency = $this->currencyService->defaultCurrency();

        $currencies = Currency::where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('code')
            ->get()
            ->map(function (Currency $currency) {
                $cashboxes = Cashbox::where('currency_id', $currency->id)->get();
                $totalBalance = 0.0;
                $totalBase = 0.0;

                foreach ($cashboxes as $cashbox) {
                    $totalBalance += $this->cashboxService->balance($cashbox);
                    $totalBase += $this->cashboxService->balanceInBase($cashbox);
                }

                return [
                    'currency' => $currency,
                    'cashbox_count' => $cashboxes->count(),
                    'total_balance' => round($totalBalance, 2),
                    'total_balance_in_base' => round($totalBase, 2),
                ];
            })
            ->filter(fn (array $row) => $row['cashbox_count'] > 0)
            ->values();

        return response()->json([
            'default_currency' => $defaultCurrency,
            'currencies' => $currencies,
        ]);
    }

    public function storeCashbox(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'nullable|string|max:500',
            'currency_id' => 'required|exists:currencies,id',
            'opening_debit' => 'nullable|numeric|min:0',
            'opening_credit' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $currency = Currency::findOrFail($validated['currency_id']);

        $cashbox = Cashbox::create([
            'name' => $this->cashboxName($currency, $validated['description'] ?? null),
            'description' => $validated['description'] ?? null,
            'currency_id' => $validated['currency_id'],
            'opening_debit' => $validated['opening_debit'] ?? 0,
            'opening_credit' => $validated['opening_credit'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(array_merge($cashbox->load('currency')->toArray(), [
            'current_balance' => $this->cashboxService->balance($cashbox),
            'balance_in_base' => $this->cashboxService->balanceInBase($cashbox),
        ]), 201);
    }

    public function updateCashbox(Request $request, Cashbox $cashbox): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'nullable|string|max:500',
            'currency_id' => 'sometimes|exists:currencies,id',
            'opening_debit' => 'sometimes|numeric|min:0',
            'opening_credit' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['currency_id']) || array_key_exists('description', $validated)) {
            $currency = Currency::findOrFail($validated['currency_id'] ?? $cashbox->currency_id);
            $validated['name'] = $this->cashboxName($currency, $validated['description'] ?? $cashbox->description);
        }

        $cashbox->update($validated);

        return response()->json(array_merge($cashbox->fresh()->load('currency')->toArray(), [
            'current_balance' => $this->cashboxService->balance($cashbox),
            'balance_in_base' => $this->cashboxService->balanceInBase($cashbox),
        ]));
    }

    public function deleteCashbox(Cashbox $cashbox): JsonResponse
    {
        if ($cashbox->ledgerLines()->exists()) {
            return response()->json(['message' => 'Cannot delete a cashbox with ledger transactions.'], 422);
        }

        $cashbox->delete();

        return response()->json(['message' => 'Cashbox deleted.']);
    }

    // --- Ledger accounts ---

    public function ledgerAccounts(): JsonResponse
    {
        return response()->json(
            LedgerAccount::where('is_active', true)->orderBy('code')->get()
        );
    }

    // --- Ledger entries ---

    public function ledgerEntries(Request $request): JsonResponse
    {
        $query = LedgerEntry::with(['lines.account', 'lines.cashbox', 'lines.currency', 'lines.user:id,name,role', 'creator:id,name'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id');

        if ($request->filled('user_id')) {
            $userId = (int) $request->user_id;
            $query->whereHas('lines', fn ($q) => $q->where('user_id', $userId));
        }

        return response()->json($query->paginate(20));
    }

    public function ledgerParties(): JsonResponse
    {
        return response()->json($this->reportService->partyLedgerSummary());
    }

    public function ledgerPartyDetail(Request $request, User $user): JsonResponse
    {
        $currencyIdsInUse = LedgerLine::query()
            ->where('user_id', $user->id)
            ->distinct()
            ->pluck('currency_id');

        $currencies = Currency::whereIn('id', $currencyIdsInUse)
            ->orderByDesc('is_default')
            ->orderBy('code')
            ->get(['id', 'code', 'symbol', 'decimal_places', 'is_default']);

        $payload = [
            'user' => $user->only(['id', 'name', 'role', 'email']),
            'party_type' => $this->reportService->partyTypeFor($user),
            'currencies' => $currencies,
            'balances_by_currency' => $this->reportService->partyBalancesByCurrency($user->id),
            'balance_in_base' => $this->reportService->partyBalance($user->id),
            'default_currency' => $this->currencyService->defaultCurrency(),
        ];

        if ($request->boolean('filtered')) {
            $payload['entries'] = $this->filteredLedgerEntriesQuery($request, function (Builder $query) use ($user, $request) {
                $query->whereHas('lines', function (Builder $lineQuery) use ($user, $request) {
                    $lineQuery->where('user_id', $user->id);
                    if ($request->filled('currency_id')) {
                        $lineQuery->where('currency_id', (int) $request->currency_id);
                    }
                });
            })->paginate(50);
        }

        return response()->json($payload);
    }

    public function cashboxCurrencyEntries(Request $request, Currency $currency): JsonResponse
    {
        if (! $request->boolean('filtered')) {
            return response()->json(['data' => []]);
        }

        $entries = $this->filteredLedgerEntriesQuery($request, function (Builder $query) use ($currency, $request) {
            $query->whereHas('lines', function (Builder $lineQuery) use ($currency, $request) {
                $lineQuery->whereHas('cashbox', fn (Builder $cashboxQuery) => $cashboxQuery->where('currency_id', $currency->id));
                if ($request->filled('cashbox_id')) {
                    $lineQuery->where('cashbox_id', (int) $request->cashbox_id);
                }
                if ($request->filled('currency_id')) {
                    $lineQuery->where('currency_id', (int) $request->currency_id);
                }
            });
        })->paginate(50);

        return response()->json($entries);
    }

    public function storeLedgerEntry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entry_date' => 'required|date',
            'description' => 'nullable|string|max:500',
            'status' => 'nullable|in:confirmed,pending,cancelled',
            'lines' => 'required|array|size:1',
            'lines.*.account_id' => 'nullable|exists:ledger_accounts,id',
            'lines.*.party_type' => 'nullable|in:agent,customer',
            'lines.*.user_id' => 'nullable|exists:users,id',
            'lines.*.cashbox_id' => 'nullable|exists:cashboxes,id',
            'lines.*.currency_id' => 'required|exists:currencies,id',
            'lines.*.debit' => 'nullable|numeric|min:0',
            'lines.*.credit' => 'nullable|numeric|min:0',
            'lines.*.amount' => 'required|numeric|min:0.01',
        ]);

        try {
            $entry = $this->ledgerService->postEntry(
                $validated['description'] ?? '',
                $validated['lines'],
                $validated['entry_date'],
                $request->user(),
                null,
                null,
                $validated['status'] ?? 'confirmed',
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($entry, 201);
    }

    public function updateLedgerEntry(Request $request, LedgerEntry $ledgerEntry): JsonResponse
    {
        $validated = $request->validate([
            'entry_date' => 'sometimes|date',
            'description' => 'nullable|string|max:500',
            'status' => 'sometimes|in:confirmed,pending,cancelled',
        ]);

        $ledgerEntry->update($validated);

        return response()->json(
            $ledgerEntry->fresh()->load(['lines.account', 'lines.cashbox', 'lines.currency', 'lines.user:id,name,role', 'creator:id,name'])
        );
    }

    public function deleteLedgerEntry(LedgerEntry $ledgerEntry): JsonResponse
    {
        if ($ledgerEntry->reference_type) {
            return response()->json(['message' => 'Cannot delete a system-linked ledger entry.'], 422);
        }

        $ledgerEntry->delete();

        return response()->json(['message' => 'Ledger entry deleted.']);
    }

    // --- Reports ---

    public function profitLoss(Request $request): JsonResponse
    {
        return response()->json(
            $this->reportService->profitAndLoss(
                $request->query('from'),
                $request->query('to'),
            )
        );
    }

    public function cashboxSummary(): JsonResponse
    {
        return response()->json([
            'cashboxes' => $this->reportService->cashboxSummary(),
            'default_currency' => $this->currencyService->defaultCurrency(),
        ]);
    }

    private function filteredLedgerEntriesQuery(Request $request, callable $scope): Builder
    {
        $query = LedgerEntry::with(['lines.account', 'lines.cashbox', 'lines.currency', 'lines.user:id,name,role', 'creator:id,name'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id');

        $scope($query);

        if ($request->filled('from')) {
            $query->whereDate('entry_date', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('entry_date', '<=', $request->to);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return $query;
    }

    /** @return array<string, string> */
    private function cashboxName(Currency $currency, ?string $description): array
    {
        $label = $description && trim($description) !== ''
            ? trim($description)
            : "{$currency->code} Cashbox";

        return ['en' => $label, 'fa' => $label, 'ar' => $label, 'de' => $label];
    }
}
