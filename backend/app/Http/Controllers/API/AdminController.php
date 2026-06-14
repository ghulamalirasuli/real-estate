<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Property;
use App\Models\PropertyLead;
use App\Models\Subscription;
use App\Models\User;
use App\Support\TranslatableRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'total_users' => User::count(),
            'total_properties' => Property::count(),
            'approved_properties' => Property::where('is_approved', true)->count(),
            'pending_properties' => Property::where('is_approved', false)->count(),
            'users_by_role' => [
                'admin' => User::where('role', 'admin')->count(),
                'agent' => User::where('role', 'agent')->count(),
                'user' => User::where('role', 'user')->count(),
            ],
            'total_revenue' => (float) Payment::where('status', 'completed')->sum('amount'),
            'active_subscriptions' => Subscription::where('status', 'active')->count(),
            'total_leads' => PropertyLead::count(),
        ]);
    }

    public function revenue(): JsonResponse
    {
        $completed = Payment::where('status', 'completed');

        return response()->json([
            'total_revenue' => (float) $completed->sum('amount'),
            'revenue_by_type' => [
                'subscription' => (float) Payment::where('status', 'completed')->where('type', 'subscription')->sum('amount'),
                'boost' => (float) Payment::where('status', 'completed')->where('type', 'boost')->sum('amount'),
                'lead' => (float) Payment::where('status', 'completed')->where('type', 'lead')->sum('amount'),
            ],
            'active_subscriptions' => Subscription::where('status', 'active')->count(),
            'total_leads' => PropertyLead::count(),
            'recent_payments' => Payment::with('user:id,name,email')
                ->where('status', 'completed')
                ->orderByDesc('paid_at')
                ->limit(20)
                ->get(),
            'monthly_revenue' => Payment::where('status', 'completed')
                ->where('paid_at', '>=', now()->subMonths(6))
                ->get()
                ->groupBy(fn ($payment) => $payment->paid_at->format('Y-m'))
                ->map(fn ($group, $month) => ['month' => $month, 'total' => (float) $group->sum('amount')])
                ->sortKeys()
                ->values(),
        ]);
    }

    public function payments(): JsonResponse
    {
        $payments = Payment::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->paginate(30);

        return response()->json($payments);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::withCount('properties')->orderBy('created_at', 'desc');

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        return response()->json($query->paginate(20));
    }

    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,agent,user',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
        ]);

        $user->syncRoles([$validated['role']]);

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|in:admin,agent,user',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }

    public function updateUserRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,agent,user',
        ]);

        $user->update(['role' => $validated['role']]);
        $user->syncRoles([$validated['role']]);

        return response()->json($user);
    }

    public function deleteUser(User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot delete admin users'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function properties(): JsonResponse
    {
        $properties = Property::with(['user', 'images'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($properties);
    }

    public function approveProperty(Property $property): JsonResponse
    {
        $property->update(['is_approved' => true]);

        return response()->json($property);
    }

    public function rejectProperty(Property $property): JsonResponse
    {
        $property->update(['is_approved' => false]);

        return response()->json($property);
    }

    public function deleteProperty(Property $property): JsonResponse
    {
        $property->delete();

        return response()->json(['message' => 'Property deleted successfully']);
    }

    public function pricingPlans(): JsonResponse
    {
        $plans = PricingPlan::orderBy('sort_order')->get();

        return response()->json($plans);
    }

    public function storePricingPlan(Request $request): JsonResponse
    {
        $rules = array_merge(
            TranslatableRules::for('name', true, 255),
            TranslatableRules::for('description', false),
            [
                'price' => 'required|numeric|min:0',
                'billing_period' => 'required|in:monthly,yearly',
                'max_properties' => 'nullable|integer|min:0',
                'featured_listings' => 'boolean',
                'is_active' => 'boolean',
                'sort_order' => 'nullable|integer|min:0',
                'features' => 'nullable|array',
            ]
        );

        $validated = $request->validate($rules);
        $plan = PricingPlan::create($validated);

        return response()->json($plan, 201);
    }

    public function updatePricingPlan(Request $request, PricingPlan $pricingPlan): JsonResponse
    {
        $rules = array_merge(
            TranslatableRules::for('name', false, 255),
            TranslatableRules::for('description', false),
            [
                'price' => 'sometimes|numeric|min:0',
                'billing_period' => 'sometimes|in:monthly,yearly',
                'max_properties' => 'nullable|integer|min:0',
                'featured_listings' => 'boolean',
                'is_active' => 'boolean',
                'sort_order' => 'nullable|integer|min:0',
                'features' => 'nullable|array',
            ]
        );

        $validated = $request->validate($rules);
        $pricingPlan->update($validated);

        return response()->json($pricingPlan);
    }

    public function deletePricingPlan(PricingPlan $pricingPlan): JsonResponse
    {
        $pricingPlan->delete();

        return response()->json(['message' => 'Pricing plan deleted successfully']);
    }
}
