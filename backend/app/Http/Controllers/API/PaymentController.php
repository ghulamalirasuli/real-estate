<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Property;
use App\Models\PropertyLead;
use App\Services\PaymentService;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private SubscriptionService $subscriptionService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $payments = Payment::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($payments);
    }

    public function boostProperty(Request $request, Property $property): JsonResponse
    {
        if ($request->user()->id !== $property->user_id && ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! $this->subscriptionService->canFeatureProperty($request->user()) && ! $request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Your plan does not include featured listings. Upgrade or purchase a boost.',
            ], 403);
        }

        $amount = config('payments.boost_price');
        $payment = $this->paymentService->process(
            $request->user(),
            'boost',
            $amount,
            "Featured boost for property #{$property->id}",
            Property::class,
            $property->id
        );

        if ($payment->status !== 'completed') {
            return response()->json(['message' => 'Payment failed'], 402);
        }

        $days = config('payments.boost_days');
        $featuredUntil = now()->addDays($days);

        if ($property->featured_until && $property->featured_until->isFuture()) {
            $featuredUntil = $property->featured_until->addDays($days);
        }

        $property->update([
            'is_featured' => true,
            'featured_until' => $featuredUntil,
        ]);

        return response()->json([
            'message' => "Property boosted for {$days} days",
            'property' => $property->fresh(),
            'payment' => $payment,
        ]);
    }

    public function unlockContact(Request $request, Property $property): JsonResponse
    {
        if (! $property->is_approved) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        $user = $request->user();

        if ($user->id === $property->user_id || $user->isAdmin()) {
            return response()->json([
                'message' => 'Contact already available',
                'contact_unlocked' => true,
                'agent' => $this->agentContact($property),
            ]);
        }

        $existingLead = PropertyLead::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->first();

        if ($existingLead) {
            return response()->json([
                'message' => 'Contact already unlocked',
                'contact_unlocked' => true,
                'agent' => $this->agentContact($property),
                'lead' => $existingLead,
            ]);
        }

        $validated = $request->validate([
            'message' => 'nullable|string|max:1000',
        ]);

        $amount = config('payments.lead_price');
        $payment = $this->paymentService->process(
            $user,
            'lead',
            $amount,
            "Lead unlock for property #{$property->id}",
            Property::class,
            $property->id
        );

        if ($payment->status !== 'completed') {
            return response()->json(['message' => 'Payment failed'], 402);
        }

        $lead = PropertyLead::create([
            'user_id' => $user->id,
            'property_id' => $property->id,
            'payment_id' => $payment->id,
            'message' => $validated['message'] ?? null,
            'unlocked_at' => now(),
        ]);

        return response()->json([
            'message' => 'Contact unlocked successfully',
            'contact_unlocked' => true,
            'agent' => $this->agentContact($property),
            'lead' => $lead,
            'payment' => $payment,
        ]);
    }

    public function contactStatus(Request $request, Property $property): JsonResponse
    {
        if (! $property->is_approved) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        $user = $request->user();
        $unlocked = $user->id === $property->user_id
            || $user->isAdmin()
            || PropertyLead::where('user_id', $user->id)->where('property_id', $property->id)->exists();

        return response()->json([
            'contact_unlocked' => $unlocked,
            'lead_price' => config('payments.lead_price'),
            'agent' => $unlocked ? $this->agentContact($property) : ['name' => $property->user?->name],
        ]);
    }

    private function agentContact(Property $property): array
    {
        $agent = $property->user;

        return [
            'name' => $agent?->name,
            'email' => $agent?->email,
            'phone' => $agent?->phone,
        ];
    }
}
