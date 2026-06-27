<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($ticket->organization_id !== $user->organization_id) {
            return false;
        }

        if ($user->isCustomer()) {
            return $ticket->requester_id === $user->id;
        }

        if ($user->isAgent()) {
            return is_null($ticket->assignee_id) || $ticket->assignee_id === $user->id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if ($ticket->organization_id !== $user->organization_id) {
            return false;
        }

        return !$user->isCustomer();
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        if ($ticket->organization_id !== $user->organization_id) {
            return false;
        }

        return $user->isAdmin();
    }
}
