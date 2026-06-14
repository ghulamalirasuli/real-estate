<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favorites = Favorite::with('property.images', 'property.user')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json($favorites);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
        ]);

        $property = Property::findOrFail($validated['property_id']);

        if (! $property->is_approved) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        $existing = Favorite::where('user_id', $request->user()->id)
            ->where('property_id', $validated['property_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Property already in favorites'], 409);
        }

        $favorite = Favorite::create([
            'user_id' => $request->user()->id,
            'property_id' => $validated['property_id'],
        ]);

        return response()->json($favorite, 201);
    }

    public function destroy(Request $request, Property $property): JsonResponse
    {
        $favorite = Favorite::where('user_id', $request->user()->id)
            ->where('property_id', $property->id)
            ->first();

        if (! $favorite) {
            return response()->json(['message' => 'Favorite not found'], 404);
        }

        $favorite->delete();

        return response()->json(['message' => 'Removed from favorites']);
    }
}
