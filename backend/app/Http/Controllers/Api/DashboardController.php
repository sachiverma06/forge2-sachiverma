<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $base = Ticket::query()->visibleTo($request->user());
        $status = (clone $base)->select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status');
        $priority = (clone $base)->select('priority', DB::raw('count(*) as total'))->groupBy('priority')->pluck('total', 'priority');
        $created = (clone $base)->select(DB::raw('date(created_at) as day'), DB::raw('count(*) as total'))->groupBy('day')->orderBy('day')->limit(14)->pluck('total', 'day');
        $breached = (clone $base)->where('status', '!=', 'closed')->where('resolution_due_at', '<', now())->count();
        $total = (clone $base)->count();

        return response()->json([
            'status' => $status,
            'priority' => $priority,
            'created_per_day' => $created,
            'open_total' => (clone $base)->whereIn('status', ['open', 'pending'])->count(),
            'sla_breach_rate' => $total > 0 ? round(($breached / $total) * 100, 1) : 0,
        ]);
    }
}
