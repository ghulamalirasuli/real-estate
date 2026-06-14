<?php

use App\Http\Controllers\API\AccountingController;
use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\FavoriteController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\PricingController;
use App\Http\Controllers\API\PropertyController;
use App\Http\Controllers\API\SubscriptionController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public property routes
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{property}', [PropertyController::class, 'show']);

// Public pricing
Route::get('/pricing-plans', [PricingController::class, 'index']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'updateProfile']);

    // Properties
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
    Route::get('/my-properties', [PropertyController::class, 'myProperties']);

    // Favorites
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{property}', [FavoriteController::class, 'destroy']);

    // Subscriptions & payments
    Route::get('/subscription', [SubscriptionController::class, 'show']);
    Route::post('/subscription', [SubscriptionController::class, 'subscribe']);
    Route::delete('/subscription', [SubscriptionController::class, 'cancel']);
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/properties/{property}/boost', [PaymentController::class, 'boostProperty']);
    Route::get('/properties/{property}/contact', [PaymentController::class, 'contactStatus']);
    Route::post('/properties/{property}/contact', [PaymentController::class, 'unlockContact']);

    // Admin routes
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);
        Route::put('/users/{user}/role', [AdminController::class, 'updateUserRole']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::get('/properties', [AdminController::class, 'properties']);
        Route::put('/properties/{property}/approve', [AdminController::class, 'approveProperty']);
        Route::put('/properties/{property}/reject', [AdminController::class, 'rejectProperty']);
        Route::delete('/properties/{property}', [AdminController::class, 'deleteProperty']);
        Route::get('/pricing-plans', [AdminController::class, 'pricingPlans']);
        Route::post('/pricing-plans', [AdminController::class, 'storePricingPlan']);
        Route::put('/pricing-plans/{pricingPlan}', [AdminController::class, 'updatePricingPlan']);
        Route::delete('/pricing-plans/{pricingPlan}', [AdminController::class, 'deletePricingPlan']);
        Route::get('/revenue', [AdminController::class, 'revenue']);
        Route::get('/payments', [AdminController::class, 'payments']);

        // Accounting
        Route::get('/accounting/overview', [AccountingController::class, 'overview']);
        Route::get('/accounting/currencies', [AccountingController::class, 'currencies']);
        Route::post('/accounting/currencies', [AccountingController::class, 'storeCurrency']);
        Route::put('/accounting/currencies/{currency}', [AccountingController::class, 'updateCurrency']);
        Route::delete('/accounting/currencies/{currency}', [AccountingController::class, 'deleteCurrency']);
        Route::get('/accounting/exchange-rates', [AccountingController::class, 'exchangeRates']);
        Route::post('/accounting/exchange-rates', [AccountingController::class, 'storeExchangeRate']);
        Route::get('/accounting/cashboxes', [AccountingController::class, 'cashboxes']);
        Route::get('/accounting/cashboxes/by-currency', [AccountingController::class, 'cashboxesByCurrency']);
        Route::get('/accounting/cashboxes/currency/{currency}/entries', [AccountingController::class, 'cashboxCurrencyEntries']);
        Route::post('/accounting/cashboxes', [AccountingController::class, 'storeCashbox']);
        Route::put('/accounting/cashboxes/{cashbox}', [AccountingController::class, 'updateCashbox']);
        Route::delete('/accounting/cashboxes/{cashbox}', [AccountingController::class, 'deleteCashbox']);
        Route::get('/accounting/ledger-accounts', [AccountingController::class, 'ledgerAccounts']);
        Route::get('/accounting/ledger/parties', [AccountingController::class, 'ledgerParties']);
        Route::get('/accounting/ledger/parties/{user}', [AccountingController::class, 'ledgerPartyDetail']);
        Route::get('/accounting/ledger-entries', [AccountingController::class, 'ledgerEntries']);
        Route::post('/accounting/ledger-entries', [AccountingController::class, 'storeLedgerEntry']);
        Route::put('/accounting/ledger-entries/{ledgerEntry}', [AccountingController::class, 'updateLedgerEntry']);
        Route::delete('/accounting/ledger-entries/{ledgerEntry}', [AccountingController::class, 'deleteLedgerEntry']);
        Route::get('/accounting/reports/profit-loss', [AccountingController::class, 'profitLoss']);
        Route::get('/accounting/reports/cashbox-summary', [AccountingController::class, 'cashboxSummary']);
    });
});
