<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = ['organization_id', 'requester_id', 'assignee_id', 'subject', 'description', 'status', 'priority', 'tags', 'first_response_due_at', 'resolution_due_at'];

    protected function casts(): array
    {
        return ['tags' => 'array', 'first_response_due_at' => 'datetime', 'resolution_due_at' => 'datetime'];
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        $query->where('organization_id', $user->organization_id);

        if ($user->isCustomer()) {
            return $query->where('requester_id', $user->id);
        }

        if ($user->isAgent()) {
            return $query->where(function (Builder $inner) use ($user) {
                $inner->whereNull('assignee_id')->orWhere('assignee_id', $user->id);
            });
        }

        return $query;
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
