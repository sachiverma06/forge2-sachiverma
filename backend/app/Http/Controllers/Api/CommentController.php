<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Notification;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    protected $ticketService;

    public function __construct(TicketService $ticketService)
    {
        $this->ticketService = $ticketService;
    }

    public function index(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->organization_id !== $request->user()->organization_id) {
            abort(404);
        }

        $comments = $ticket->comments()->with('user:id,name,role');

        if ($request->user()->isCustomer()) {
            $comments->where('is_internal', false);
        }

        return response()->json($comments->get());
    }

    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $user = $request->user();
        if ($ticket->organization_id !== $user->organization_id) {
            abort(404);
        }

        $data = $request->validate([
            'body' => ['required', 'string'],
            'is_internal' => ['boolean'],
        ]);

        $isInternal = (bool) ($data['is_internal'] ?? false);

        if ($isInternal && $user->isCustomer()) {
            abort(403);
        }

        $comment = Comment::create([
            'organization_id' => $ticket->organization_id,
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'body' => $data['body'],
            'is_internal' => $isInternal,
        ]);

        $this->ticketService->logActivity($ticket, $user->id, $isInternal ? 'comment.internal' : 'comment.public');

        if (!$isInternal && $ticket->assignee_id && $ticket->assignee_id !== $user->id) {
            Notification::create([
                'organization_id' => $ticket->organization_id,
                'user_id' => $ticket->assignee_id,
                'ticket_id' => $ticket->id,
                'type' => 'reply',
                'message' => 'A ticket has a new reply',
            ]);
        }

        return response()->json(['comment' => $comment->load('user:id,name,role')], 201);
    }
}
