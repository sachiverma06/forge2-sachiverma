<?php

namespace App\Services;

use App\Models\SlaPolicy;

class SLAService
{
    public function calculateDeadlines(int $orgId, string $priority): array
    {
        $policy = SlaPolicy::where('organization_id', $orgId)
            ->where('priority', $priority)
            ->first();

        $responseMinutes = $policy?->response_minutes ?? 240;
        $resolutionMinutes = $policy?->resolution_minutes ?? 1440;

        return [
            'response' => now()->addMinutes($responseMinutes),
            'resolution' => now()->addMinutes($resolutionMinutes),
        ];
    }
}
