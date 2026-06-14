<?php

namespace Database\Seeders;

use App\Models\Cashbox;
use App\Models\Currency;
use App\Models\ExchangeRate;
use App\Models\LedgerAccount;
use Illuminate\Database\Seeder;

class AccountingSeeder extends Seeder
{
    public function run(): void
    {
        $usd = Currency::updateOrCreate(
            ['code' => 'USD'],
            [
                'symbol' => '$',
                'name' => [
                    'en' => 'US Dollar',
                    'fa' => 'دلار آمریکا',
                    'ar' => 'دولار أمريكي',
                    'de' => 'US-Dollar',
                ],
                'decimal_places' => 2,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        $eur = Currency::updateOrCreate(
            ['code' => 'EUR'],
            [
                'symbol' => '€',
                'name' => [
                    'en' => 'Euro',
                    'fa' => 'یورو',
                    'ar' => 'يورو',
                    'de' => 'Euro',
                ],
                'decimal_places' => 2,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $irr = Currency::updateOrCreate(
            ['code' => 'IRR'],
            [
                'symbol' => '﷼',
                'name' => [
                    'en' => 'Iranian Rial',
                    'fa' => 'ریال ایران',
                    'ar' => 'ريال إيراني',
                    'de' => 'Iranischer Rial',
                ],
                'decimal_places' => 0,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $aed = Currency::updateOrCreate(
            ['code' => 'AED'],
            [
                'symbol' => 'د.إ',
                'name' => [
                    'en' => 'UAE Dirham',
                    'fa' => 'درهم امارات',
                    'ar' => 'درهم إماراتي',
                    'de' => 'VAE-Dirham',
                ],
                'decimal_places' => 2,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        ExchangeRate::updateOrCreate(
            ['currency_id' => $usd->id, 'effective_date' => now()->toDateString()],
            ['rate_to_base' => 1]
        );
        ExchangeRate::updateOrCreate(
            ['currency_id' => $eur->id, 'effective_date' => now()->toDateString()],
            ['rate_to_base' => 1.08]
        );
        ExchangeRate::updateOrCreate(
            ['currency_id' => $irr->id, 'effective_date' => now()->toDateString()],
            ['rate_to_base' => 0.000024]
        );
        ExchangeRate::updateOrCreate(
            ['currency_id' => $aed->id, 'effective_date' => now()->toDateString()],
            ['rate_to_base' => 0.27]
        );

        $accounts = [
            ['code' => '1000', 'type' => 'asset', 'name' => ['en' => 'Cash', 'fa' => 'صندوق', 'ar' => 'نقد', 'de' => 'Kasse']],
            ['code' => '1100', 'type' => 'asset', 'name' => ['en' => 'Bank Account', 'fa' => 'حساب بانکی', 'ar' => 'حساب بنكي', 'de' => 'Bankkonto']],
            ['code' => '2000', 'type' => 'liability', 'name' => ['en' => 'Accounts Payable', 'fa' => 'بدهی‌ها', 'ar' => 'الذمم الدائنة', 'de' => 'Verbindlichkeiten']],
            ['code' => '3000', 'type' => 'equity', 'name' => ['en' => 'Owner Equity', 'fa' => 'سرمایه', 'ar' => 'حقوق الملكية', 'de' => 'Eigenkapital']],
            ['code' => '4000', 'type' => 'income', 'name' => ['en' => 'Subscription Revenue', 'fa' => 'درآمد اشتراک', 'ar' => 'إيرادات الاشتراك', 'de' => 'Abonnementeinnahmen']],
            ['code' => '4010', 'type' => 'income', 'name' => ['en' => 'Boost Revenue', 'fa' => 'درآمد تقویت آگهی', 'ar' => 'إيرادات التعزيز', 'de' => 'Boost-Einnahmen']],
            ['code' => '4020', 'type' => 'income', 'name' => ['en' => 'Lead Fee Revenue', 'fa' => 'درآمد تماس', 'ar' => 'إيرادات رسوم العملاء', 'de' => 'Lead-Gebühren']],
            ['code' => '4090', 'type' => 'income', 'name' => ['en' => 'Other Income', 'fa' => 'سایر درآمدها', 'ar' => 'إيرادات أخرى', 'de' => 'Sonstige Einnahmen']],
            ['code' => '5000', 'type' => 'expense', 'name' => ['en' => 'Operating Expenses', 'fa' => 'هزینه‌های عملیاتی', 'ar' => 'مصاريف تشغيلية', 'de' => 'Betriebskosten']],
            ['code' => '5010', 'type' => 'expense', 'name' => ['en' => 'Marketing Expenses', 'fa' => 'هزینه بازاریابی', 'ar' => 'مصاريف تسويق', 'de' => 'Marketingkosten']],
            ['code' => '5020', 'type' => 'expense', 'name' => ['en' => 'Commission Expenses', 'fa' => 'هزینه کمیسیون', 'ar' => 'مصاريف العمولة', 'de' => 'Provisionskosten']],
        ];

        foreach ($accounts as $account) {
            LedgerAccount::updateOrCreate(
                ['code' => $account['code']],
                ['name' => $account['name'], 'type' => $account['type'], 'is_active' => true]
            );
        }

        if (! Cashbox::where('currency_id', $usd->id)->exists()) {
            Cashbox::create([
                'name' => [
                    'en' => 'Main Cash Register',
                    'fa' => 'صندوق اصلی',
                    'ar' => 'الصندوق الرئيسي',
                    'de' => 'Hauptkasse',
                ],
                'description' => 'Primary cashbox for daily operations',
                'currency_id' => $usd->id,
                'opening_debit' => 0,
                'opening_credit' => 0,
                'is_active' => true,
            ]);

            Cashbox::create([
                'name' => [
                    'en' => 'Bank Account',
                    'fa' => 'حساب بانکی',
                    'ar' => 'الحساب البنكي',
                    'de' => 'Bankkonto',
                ],
                'description' => 'Main business bank account',
                'currency_id' => $usd->id,
                'opening_debit' => 0,
                'opening_credit' => 0,
                'is_active' => true,
            ]);
        }
    }
}
