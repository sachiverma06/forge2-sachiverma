<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    protected $ticketService;

    public function __construct(TicketService $ticketService)
    {
        $this->ticketService = $ticketService;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tickets = Ticket::query()
            ->visibleTo($user)
            ->with(['requester:id,name,email,role', 'assignee:id,name,email,role'])
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('priority'), fn (Builder $query) => $query->where('priority', $request->string('priority')->toString()))
            ->when($request->filled('assignee_id'), fn (Builder $query) => $request->integer('assignee_id') === 0 ? $query->whereNull('assignee_id') : $query->where('assignee_id', $request->integer('assignee_id')))
            ->when($request->filled('q'), function (Builder $query) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $query->where(fn (Builder $inner) => $inner->where('subject', 'like', $term)->orWhere('description', 'like', $term));
            })
            ->latest('updated_at')
            ->paginate(25);

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:190'],
            'description' => ['required', 'string'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'assignee_id' => ['nullable', 'integer'],
            'tags' => ['array'],
            'tags.*' => ['string', 'max:40'],
        ]);

        $ticket = $this->ticketService->createTicket($user, $data);

        return response()->json($ticket->load(['requester', 'assignee', 'comments.user', 'activities.user']), 201);
    }

    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $this->ensureVisible($ticket, $request->user());
        $ticket->load(['requester:id,name,email,role', 'assignee:id,name,email,role', 'comments.user:id,name,role', 'activities.user:id,name,role']);

        if ($request->user()->isCustomer()) {
            $ticket->setRelation('comments', $ticket->comments->where('is_internal', false)->values());
        }

        return response()->json(['ticket' => $ticket]);
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $user = $request->user();
        $this->ensureVisible($ticket, $user);

        if ($user->isCustomer()) {
            abort(403);
        }

        $data = $request->validate([
            'subject' => ['sometimes', 'string', 'max:190'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', Rule::in(['open', 'pending', 'resolved', 'closed'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'assignee_id' => ['nullable', 'integer'],
            'tags' => ['sometimes', 'array'],
            'tags.*' => ['string', 'max:40'],
        ]);

        $ticket = $this->ticketService->updateTicket($user, $ticket, $data);

        return response()->json(['ticket' => $ticket->fresh()->load(['requester', 'assignee', 'comments.user', 'activities.user'])]);
    }

    public function destroy(Request $request, Ticket $ticket): JsonResponse
    {
        $this->ensureVisible($ticket, $request->user());

        if (!$request->user()->isAdmin()) {
            abort(403);
        }

        $ticket->delete();
        return response()->json(['message' => 'Ticket deleted']);
    }

    public function claim(Request $request, Ticket $ticket): JsonResponse
    {
        $user = $request->user();
        $this->ensureVisible($ticket, $user);

        if (!$user->isAgent() && !$user->isAdmin()) {
            abort(403);
        }

        $ticket->update(['assignee_id' => $user->id]);
        $this->ticketService->logActivity($ticket, $user->id, 'ticket.claimed');

        return response()->json(['ticket' => $ticket->fresh()->load(['requester', 'assignee'])]);
    }

    private function ensureVisible(Ticket $ticket, $user): void
    {
        $visible = Ticket::query()->visibleTo($user)->whereKey($ticket->id)->exists();

        if (!$visible) {
            abort(404);
        }
    }
}
