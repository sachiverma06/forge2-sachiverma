<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Ticket;
use App\Models\User;

class TicketService
{
    protected $slaService;

    public function __construct(SLAService $slaService)
    {
        $this->slaService = $slaService;
    }

    public function createTicket(User $user, array $data): Ticket
    {
        $assigneeId = $this->validAssignee($data['assignee_id'] ?? null, $user);
        $deadlines = $this->slaService->calculateDeadlines($user->organization_id, $data['priority']);

        $ticket = Ticket::create([
            'organization_id' => $user->organization_id,
            'requester_id' => $user->id,
            'assignee_id' => $assigneeId,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'status' => 'open',
            'priority' => $data['priority'],
            'tags' => $data['tags'] ?? [],
            'first_response_due_at' => $deadlines['response'],
            'resolution_due_at' => $deadlines['resolution'],
        ]);

        $this->logActivity($ticket, $user->id, 'ticket.created');
        $this->notifyAssignee($ticket, 'A ticket was assigned to you');

        return $ticket;
    }

    public function updateTicket(User $user, Ticket $ticket, array $data): Ticket
    {
        if (array_key_exists('assignee_id', $data)) {
            $data['assignee_id'] = $this->validAssignee($data['assignee_id'], $user);
        }

        $before = $ticket->only(['status', 'priority', 'assignee_id']);
        $ticket->update($data);
        $after = $ticket->only(['status', 'priority', 'assignee_id']);

        if ($before !== $after) {
            $this->logActivity($ticket, $user->id, 'ticket.updated', ['before' => $before, 'after' => $after]);
        }

        $this->notifyAssignee($ticket, 'A ticket assigned to you was updated');

        return $ticket;
    }

    protected function validAssignee(?int $assigneeId, User $user): ?int
    {
        if (!$assigneeId) {
            return null;
        }

        return User::where('organization_id', $user->organization_id)
            ->where('role', 'agent')
            ->whereKey($assigneeId)
            ->value('id');
    }

    public function logActivity(Ticket $ticket, ?int $userId, string $event, array $meta = []): void
    {
        ActivityLog::create([
            'organization_id' => $ticket->organization_id,
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'event' => $event,
            'meta' => $meta,
        ]);
    }

    public function notifyAssignee(Ticket $ticket, string $message): void
    {
        if (!$ticket->assignee_id) {
            return;
        }

        Notification::create([
            'organization_id' => $ticket->organization_id,
            'user_id' => $ticket->assignee_id,
            'ticket_id' => $ticket->id,
            'type' => 'assignment',
            'message' => $message,
        ]);
    }
}
