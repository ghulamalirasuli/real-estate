<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cashboxes', function (Blueprint $table) {
            $table->decimal('opening_debit', 15, 2)->default(0)->after('currency_id');
            $table->decimal('opening_credit', 15, 2)->default(0)->after('opening_debit');
        });

        DB::table('cashboxes')->where('opening_balance', '>', 0)->update([
            'opening_debit' => DB::raw('opening_balance'),
        ]);

        Schema::table('cashboxes', function (Blueprint $table) {
            $table->dropColumn('opening_balance');
        });
    }

    public function down(): void
    {
        Schema::table('cashboxes', function (Blueprint $table) {
            $table->decimal('opening_balance', 15, 2)->default(0)->after('currency_id');
        });

        DB::table('cashboxes')->update([
            'opening_balance' => DB::raw('GREATEST(opening_debit - opening_credit, 0)'),
        ]);

        Schema::table('cashboxes', function (Blueprint $table) {
            $table->dropColumn(['opening_debit', 'opening_credit']);
        });
    }
};
