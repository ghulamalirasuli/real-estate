<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Property extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'price',
        'location',
        'latitude',
        'longitude',
        'type',
        'status',
        'bedrooms',
        'bathrooms',
        'area',
        'is_featured',
        'featured_until',
        'is_approved',
    ];

    protected function casts(): array
    {
        return [
            'title' => 'array',
            'description' => 'array',
            'price' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'area' => 'decimal:2',
            'is_featured' => 'boolean',
            'featured_until' => 'datetime',
            'is_approved' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)
            ->where(function ($q) {
                $q->whereNull('featured_until')->orWhere('featured_until', '>', now());
            });
    }

    public function leads(): HasMany
    {
        return $this->hasMany(PropertyLead::class);
    }

    public function isFeaturedActive(): bool
    {
        if (! $this->is_featured) {
            return false;
        }

        return ! $this->featured_until || $this->featured_until->isFuture();
    }
}
