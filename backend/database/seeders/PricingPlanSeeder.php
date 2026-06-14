<?php

namespace Database\Seeders;

use App\Models\PricingPlan;
use Illuminate\Database\Seeder;

class PricingPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => [
                    'en' => 'Basic',
                    'fa' => 'پایه',
                    'ar' => 'أساسي',
                    'de' => 'Basis',
                ],
                'description' => [
                    'en' => 'For individual sellers getting started',
                    'fa' => 'برای فروشندگان تازه‌کار',
                    'ar' => 'للبائعين الأفراد المبتدئين',
                    'de' => 'Für einzelne Verkäufer',
                ],
                'price' => 0,
                'billing_period' => 'monthly',
                'max_properties' => 3,
                'featured_listings' => false,
                'is_active' => true,
                'sort_order' => 1,
                'features' => [
                    ['en' => 'Up to 3 listings', 'fa' => 'تا ۳ آگهی', 'ar' => 'حتى 3 قوائم', 'de' => 'Bis zu 3 Inserate'],
                    ['en' => 'Basic support', 'fa' => 'پشتیبانی پایه', 'ar' => 'دعم أساسي', 'de' => 'Basis-Support'],
                ],
            ],
            [
                'name' => [
                    'en' => 'Professional',
                    'fa' => 'حرفه‌ای',
                    'ar' => 'احترافي',
                    'de' => 'Professional',
                ],
                'description' => [
                    'en' => 'For active agents and small agencies',
                    'fa' => 'برای مشاوران فعال و آژانس‌های کوچک',
                    'ar' => 'للوكلاء النشطين والوكالات الصغيرة',
                    'de' => 'Für aktive Makler und kleine Agenturen',
                ],
                'price' => 49.99,
                'billing_period' => 'monthly',
                'max_properties' => 25,
                'featured_listings' => true,
                'is_active' => true,
                'sort_order' => 2,
                'features' => [
                    ['en' => 'Up to 25 listings', 'fa' => 'تا ۲۵ آگهی', 'ar' => 'حتى 25 قائمة', 'de' => 'Bis zu 25 Inserate'],
                    ['en' => 'Featured listings', 'fa' => 'آگهی‌های ویژه', 'ar' => 'قوائم مميزة', 'de' => 'Hervorgehobene Inserate'],
                    ['en' => 'Priority support', 'fa' => 'پشتیبانی اولویت‌دار', 'ar' => 'دعم ذو أولوية', 'de' => 'Prioritäts-Support'],
                ],
            ],
            [
                'name' => [
                    'en' => 'Enterprise',
                    'fa' => 'سازمانی',
                    'ar' => 'مؤسسي',
                    'de' => 'Enterprise',
                ],
                'description' => [
                    'en' => 'For large agencies with unlimited needs',
                    'fa' => 'برای آژانس‌های بزرگ',
                    'ar' => 'للوكالات الكبيرة',
                    'de' => 'Für große Agenturen',
                ],
                'price' => 149.99,
                'billing_period' => 'monthly',
                'max_properties' => null,
                'featured_listings' => true,
                'is_active' => true,
                'sort_order' => 3,
                'features' => [
                    ['en' => 'Unlimited listings', 'fa' => 'آگهی نامحدود', 'ar' => 'قوائم غير محدودة', 'de' => 'Unbegrenzte Inserate'],
                    ['en' => 'Featured listings', 'fa' => 'آگهی‌های ویژه', 'ar' => 'قوائم مميزة', 'de' => 'Hervorgehobene Inserate'],
                    ['en' => 'Dedicated account manager', 'fa' => 'مدیر حساب اختصاصی', 'ar' => 'مدير حساب مخصص', 'de' => 'Persönlicher Account Manager'],
                ],
            ],
        ];

        foreach ($plans as $plan) {
            PricingPlan::updateOrCreate(
                ['sort_order' => $plan['sort_order']],
                $plan
            );
        }
    }
}
