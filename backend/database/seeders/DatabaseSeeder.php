<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Organization;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $organization = Organization::create(['name' => 'Acme Support', 'slug' => 'acme-support']);

        $admin = User::create(['organization_id' => $organization->id, 'name' => 'Admin User', 'email' => 'admin@acme.test', 'password' => Hash::make('password'), 'role' => 'admin']);
        $agent1 = User::create(['organization_id' => $organization->id, 'name' => 'Priya Agent', 'email' => 'agent1@acme.test', 'password' => Hash::make('password'), 'role' => 'agent']);
        $agent2 = User::create(['organization_id' => $organization->id, 'name' => 'Rohan Agent', 'email' => 'agent2@acme.test', 'password' => Hash::make('password'), 'role' => 'agent']);
        $customer1 = User::create(['organization_id' => $organization->id, 'name' => 'Asha Customer', 'email' => 'customer1@acme.test', 'password' => Hash::make('password'), 'role' => 'customer']);
        $customer2 = User::create(['organization_id' => $organization->id, 'name' => 'Dev Customer', 'email' => 'customer2@acme.test', 'password' => Hash::make('password'), 'role' => 'customer']);

        foreach ([['low', 480, 4320], ['medium', 240, 1440], ['high', 60, 480], ['urgent', 15, 120]] as [$priority, $response, $resolution]) {
            SlaPolicy::create(['organization_id' => $organization->id, 'priority' => $priority, 'response_minutes' => $response, 'resolution_minutes' => $resolution]);
        }

        $subjects = ['Cannot reset password', 'Invoice download failed', 'Webhook retries needed', 'Login link expired', 'Wrong priority on request', 'Need user export', 'Billing address update', 'API token missing scopes', 'Email notification delay', 'Attachment upload issue', 'Dashboard count mismatch', 'Customer portal access'];
        $priorities = ['low', 'medium', 'high', 'urgent'];
        $statuses = ['open', 'pending', 'resolved', 'closed'];
        $agents = [null, $agent1->id, $agent2->id];
        $customers = [$customer1, $customer2];

        foreach ($subjects as $index => $subject) {
            $priority = $priorities[$index % count($priorities)];
            $policy = SlaPolicy::where('organization_id', $organization->id)->where('priority', $priority)->first();
            $ticket = Ticket::create([
                'organization_id' => $organization->id,
                'requester_id' => $customers[$index % 2]->id,
                'assignee_id' => $agents[$index % count($agents)],
                'subject' => $subject,
                'description' => 'Customer reported: '.$subject.'. Please investigate and respond with the next step.',
                'status' => $statuses[$index % count($statuses)],
                'priority' => $priority,
                'tags' => [$priority, $index % 2 === 0 ? 'product' : 'billing'],
                'first_response_due_at' => now()->addMinutes($policy->response_minutes - ($index * 5)),
                'resolution_due_at' => now()->addMinutes($policy->resolution_minutes - ($index * 30)),
                'created_at' => now()->subDays(12 - $index),
                'updated_at' => now()->subHours($index + 1),
            ]);

            Comment::create(['organization_id' => $organization->id, 'ticket_id' => $ticket->id, 'user_id' => $ticket->requester_id, 'body' => 'Adding more context from the customer side.', 'is_internal' => false]);
            Comment::create(['organization_id' => $organization->id, 'ticket_id' => $ticket->id, 'user_id' => $admin->id, 'body' => 'Check account history before replying.', 'is_internal' => true]);
            ActivityLog::create(['organization_id' => $organization->id, 'ticket_id' => $ticket->id, 'user_id' => $admin->id, 'event' => 'ticket.seeded', 'meta' => []]);
        }
    }
}
