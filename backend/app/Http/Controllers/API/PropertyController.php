<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\PropertyLead;
use App\Services\SubscriptionService;
use App\Support\TranslatableRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PropertyController extends Controller
{
    public function __construct(private SubscriptionService $subscriptionService) {}
    public function index(Request $request): JsonResponse
    {
        $query = Property::with(['images', 'user'])->approved();

        // Search by keyword
        if ($request->filled('search')) {
            $search = $request->search;
            $languages = config('content_languages.supported', ['en']);
            $query->where(function ($q) use ($search, $languages) {
                $q->where('location', 'like', "%{$search}%");
                foreach ($languages as $lang) {
                    $q->orWhere("title->{$lang}", 'like', "%{$search}%");
                }
            });
        }

        // Filter by price range
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Filter by location
        if ($request->filled('location')) {
            $query->where('location', 'like', "%{$request->location}%");
        }

        // Filter by property type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by bedrooms
        if ($request->filled('bedrooms')) {
            $query->where('bedrooms', '>=', $request->bedrooms);
        }

        // Filter by status (sale/rent)
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by featured
        if ($request->filled('is_featured')) {
            $query->where('is_featured', $request->boolean('is_featured'));
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');

        $allowedSorts = ['created_at', 'price', 'area', 'bedrooms'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $properties = $query->paginate(12);

        return response()->json($properties);
    }

    public function show(Request $request, Property $property): JsonResponse
    {
        if (! $property->is_approved) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        $property->load(['images', 'user', 'favorites']);

        $payload = $property->toArray();
        $payload['contact_unlocked'] = $this->contactUnlocked($request->user(), $property);
        $payload['lead_price'] = config('payments.lead_price');
        $payload['boost_price'] = config('payments.boost_price');

        if (! $payload['contact_unlocked'] && isset($payload['user'])) {
            $payload['user'] = [
                'id' => $property->user->id,
                'name' => $property->user->name,
            ];
        }

        return response()->json($payload);
    }

    public function store(Request $request): JsonResponse
    {
        $limitCheck = $this->subscriptionService->canCreateProperty($request->user());
        if (! $limitCheck['allowed']) {
            return response()->json([
                'message' => $limitCheck['message'],
                'upgrade_required' => true,
                'current_count' => $limitCheck['current_count'],
                'max_properties' => $limitCheck['max_properties'],
            ], 403);
        }

        $validated = $request->validate(array_merge(
            TranslatableRules::for('title', true, 255),
            TranslatableRules::for('description', true),
            [
                'price' => 'required|numeric|min:0',
                'location' => 'required|string|max:255',
                'latitude' => 'nullable|numeric',
                'longitude' => 'nullable|numeric',
                'type' => 'required|in:apartment,villa,land',
                'status' => 'required|in:sale,rent',
                'bedrooms' => 'nullable|integer|min:0',
                'bathrooms' => 'nullable|integer|min:0',
                'area' => 'nullable|numeric|min:0',
                'is_featured' => 'boolean',
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            ]
        ));

        $validated['user_id'] = $request->user()->id;
        $validated['is_approved'] = $request->user()->isAdmin();

        if (! empty($validated['is_featured']) && ! $this->subscriptionService->canFeatureProperty($request->user())) {
            return response()->json([
                'message' => 'Your plan does not include featured listings. Upgrade your plan or purchase a boost.',
                'upgrade_required' => true,
            ], 403);
        }

        if (empty($validated['is_featured']) || ! $this->subscriptionService->canFeatureProperty($request->user())) {
            $validated['is_featured'] = false;
        }

        $property = Property::create($validated);

        // Handle image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('properties', 'public');
                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $path,
                    'is_primary' => $index === 0,
                ]);
            }
        }

        $property->load('images');

        return response()->json($property, 201);
    }

    public function update(Request $request, Property $property): JsonResponse
    {
        if ($request->user()->id !== $property->user_id && ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate(array_merge(
            TranslatableRules::for('title', false, 255),
            TranslatableRules::for('description', false),
            [
                'price' => 'sometimes|numeric|min:0',
                'location' => 'sometimes|string|max:255',
                'latitude' => 'nullable|numeric',
                'longitude' => 'nullable|numeric',
                'type' => 'sometimes|in:apartment,villa,land',
                'status' => 'sometimes|in:sale,rent',
                'bedrooms' => 'nullable|integer|min:0',
                'bathrooms' => 'nullable|integer|min:0',
                'area' => 'nullable|numeric|min:0',
                'is_featured' => 'boolean',
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            ]
        ));

        if (isset($validated['is_featured']) && $validated['is_featured'] && ! $this->subscriptionService->canFeatureProperty($request->user())) {
            return response()->json([
                'message' => 'Your plan does not include featured listings. Upgrade your plan or purchase a boost.',
                'upgrade_required' => true,
            ], 403);
        }

        if (isset($validated['is_featured']) && ! $this->subscriptionService->canFeatureProperty($request->user())) {
            unset($validated['is_featured']);
        }

        $property->update($validated);

        // Handle new image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $path,
                ]);
            }
        }

        $property->load('images');

        return response()->json($property);
    }

    public function destroy(Request $request, Property $property): JsonResponse
    {
        if ($request->user()->id !== $property->user_id && ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete images from storage
        foreach ($property->images as $image) {
            Storage::disk('public')->delete($image->image_path);
        }

        $property->delete();

        return response()->json(['message' => 'Property deleted successfully']);
    }

    public function myProperties(Request $request): JsonResponse
    {
        $properties = Property::with('images')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json($properties);
    }

    private function contactUnlocked(?\App\Models\User $user, Property $property): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->id === $property->user_id || $user->isAdmin()) {
            return true;
        }

        return PropertyLead::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->exists();
    }
}
