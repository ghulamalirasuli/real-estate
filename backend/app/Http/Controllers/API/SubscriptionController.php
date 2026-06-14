<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PricingPlan;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(private SubscriptionService $subscriptionService) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->subscriptionService->subscriptionSummary($request->user()));
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pricing_plan_id' => 'required|exists:pricing_plans,id',
        ]);

        $plan = PricingPlan::where('id', $validated['pricing_plan_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $subscription = $this->subscriptionService->subscribe($request->user(), $plan);

        return response()->json([
            'message' => 'Subscription activated successfully',
            'subscription' => $subscription,
            'summary' => $this->subscriptionService->subscriptionSummary($request->user()->fresh()),
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $this->subscriptionService->cancel($request->user());

        return response()->json([
            'message' => 'Subscription cancelled. You are now on the free plan.',
            'summary' => $this->subscriptionService->subscriptionSummary($request->user()->fresh()),
        ]);
    }
}
