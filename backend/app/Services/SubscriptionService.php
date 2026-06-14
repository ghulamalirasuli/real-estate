<?php

namespace App\Services;

use App\Models\PricingPlan;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;

class SubscriptionService
{
    public function __construct(private PaymentService $paymentService) {}

    public function getActiveSubscription(User $user): ?Subscription
    {
        return $user->subscriptions()
            ->with('pricingPlan')
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>', now());
            })
            ->latest('starts_at')
            ->first();
    }

    public function getActivePlan(User $user): PricingPlan
    {
        if ($user->isAdmin()) {
            return $this->getEnterprisePlan();
        }

        $subscription = $this->getActiveSubscription($user);

        if ($subscription?->pricingPlan) {
            return $subscription->pricingPlan;
        }

        return $this->ensureFreePlan($user);
    }

    public function ensureFreePlan(User $user): PricingPlan
    {
        $basicPlan = PricingPlan::where('price', 0)->where('is_active', true)->orderBy('sort_order')->first()
            ?? PricingPlan::orderBy('sort_order')->first();

        if (! $basicPlan) {
            abort(500, 'No pricing plans configured');
        }

        $existing = $this->getActiveSubscription($user);

        if (! $existing) {
            Subscription::create([
                'user_id' => $user->id,
                'pricing_plan_id' => $basicPlan->id,
                'status' => 'active',
                'amount' => 0,
                'starts_at' => now(),
                'ends_at' => null,
            ]);
        }

        return $basicPlan;
    }

    public function canCreateProperty(User $user): array
    {
        if ($user->isAdmin()) {
            return ['allowed' => true];
        }

        $plan = $this->getActivePlan($user);
        $count = $user->properties()->count();

        if ($plan->max_properties !== null && $count >= $plan->max_properties) {
            return [
                'allowed' => false,
                'message' => "Your {$this->planName($plan)} plan allows up to {$plan->max_properties} listings. Upgrade to add more.",
                'current_count' => $count,
                'max_properties' => $plan->max_properties,
            ];
        }

        return ['allowed' => true, 'current_count' => $count, 'max_properties' => $plan->max_properties];
    }

    public function canFeatureProperty(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return (bool) $this->getActivePlan($user)->featured_listings;
    }

    public function subscribe(User $user, PricingPlan $plan): Subscription
    {
        $this->cancelActiveSubscriptions($user);

        $endsAt = $plan->billing_period === 'yearly'
            ? now()->addYear()
            : now()->addMonth();

        if ((float) $plan->price > 0) {
            $payment = $this->paymentService->process(
                $user,
                'subscription',
                (float) $plan->price,
                "Subscription: {$this->planName($plan)}",
                PricingPlan::class,
                $plan->id
            );

            if ($payment->status !== 'completed') {
                abort(402, 'Payment failed. Please try again.');
            }
        }

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'pricing_plan_id' => $plan->id,
            'status' => 'active',
            'amount' => $plan->price,
            'starts_at' => now(),
            'ends_at' => (float) $plan->price > 0 ? $endsAt : null,
        ]);

        if ($user->role === 'user' && (float) $plan->price > 0) {
            $user->update(['role' => 'agent']);
            $user->syncRoles(['agent']);
        }

        return $subscription->load('pricingPlan');
    }

    public function cancel(User $user): void
    {
        $this->cancelActiveSubscriptions($user);
        $this->ensureFreePlan($user);
    }

    private function cancelActiveSubscriptions(User $user): void
    {
        $user->subscriptions()
            ->where('status', 'active')
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'ends_at' => now(),
            ]);
    }

    private function getEnterprisePlan(): PricingPlan
    {
        return PricingPlan::orderByDesc('sort_order')->first()
            ?? PricingPlan::orderBy('sort_order')->first();
    }

    private function planName(PricingPlan $plan): string
    {
        $name = $plan->name;

        return is_array($name) ? ($name['en'] ?? 'Plan') : (string) $name;
    }

    public function subscriptionSummary(User $user): array
    {
        $subscription = $this->getActiveSubscription($user);
        $plan = $this->getActivePlan($user);
        $propertyCheck = $this->canCreateProperty($user);

        return [
            'subscription' => $subscription,
            'plan' => $plan,
            'properties_used' => $propertyCheck['current_count'] ?? $user->properties()->count(),
            'max_properties' => $plan->max_properties,
            'can_feature' => $this->canFeatureProperty($user),
            'boost_price' => config('payments.boost_price'),
            'lead_price' => config('payments.lead_price'),
        ];
    }
}
