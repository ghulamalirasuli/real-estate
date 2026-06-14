<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PricingPlan;
use Illuminate\Http\JsonResponse;

class PricingController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = PricingPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'plans' => $plans,
            'boost_price' => config('payments.boost_price'),
            'lead_price' => config('payments.lead_price'),
            'currency' => config('payments.currency'),
        ]);
    }
}
