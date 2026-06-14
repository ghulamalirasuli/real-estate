<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 3)->unique();
            $table->string('symbol', 10);
            $table->json('name');
            $table->unsignedTinyInteger('decimal_places')->default(2);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('currency_id')->constrained()->cascadeOnDelete();
            $table->decimal('rate_to_base', 18, 8);
            $table->date('effective_date');
            $table->timestamps();

            $table->unique(['currency_id', 'effective_date']);
        });

        Schema::create('cashboxes', function (Blueprint $table) {
            $table->id();
            $table->json('name');
            $table->text('description')->nullable();
            $table->foreignId('currency_id')->constrained();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ledger_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->json('name');
            $table->enum('type', ['asset', 'liability', 'equity', 'income', 'expense']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->date('entry_date');
            $table->string('description');
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
        });

        Schema::create('ledger_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ledger_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('ledger_accounts');
            $table->foreignId('cashbox_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('currency_id')->constrained();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->decimal('amount', 15, 2);
            $table->decimal('base_amount', 15, 2);
            $table->timestamps();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('currency_id')->nullable()->after('amount')->constrained()->nullOnDelete();
            $table->decimal('exchange_rate', 18, 8)->nullable()->after('currency_id');
            $table->decimal('base_amount', 15, 2)->nullable()->after('exchange_rate');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('currency_id');
            $table->dropColumn(['exchange_rate', 'base_amount']);
        });

        Schema::dropIfExists('ledger_lines');
        Schema::dropIfExists('ledger_entries');
        Schema::dropIfExists('ledger_accounts');
        Schema::dropIfExists('cashboxes');
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('currencies');
    }
};
