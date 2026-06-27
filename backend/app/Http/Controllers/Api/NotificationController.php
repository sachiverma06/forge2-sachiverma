<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Notification::where('organization_id', $request->user()->organization_id)->where('user_id', $request->user()->id)->latest()->limit(30)->get();
        return response()->json(['notifications' => $items]);
    }

    public function read(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->organization_id !== $request->user()->organization_id || $notification->user_id !== $request->user()->id) {
            abort(404);
        }

        $notification->update(['read_at' => now()]);
        return response()->json(['notification' => $notification]);
    }
}
