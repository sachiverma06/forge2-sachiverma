<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_create_ticket(): void
    {
        $org = Organization::create(['name' => 'Acme', 'slug' => 'acme']);
        $user = User::create(['organization_id' => $org->id, 'name' => 'Admin', 'email' => 'admin@test.dev', 'password' => Hash::make('password'), 'role' => 'admin']);

        $login = $this->postJson('/api/login', ['email' => 'admin@test.dev', 'password' => 'password'])->assertOk();
        $token = $login->json('token');

        $this->withToken($token)->postJson('/api/tickets', ['subject' => 'Need help', 'description' => 'The app is not loading.', 'priority' => 'high'])->assertCreated()->assertJsonPath('organization_id', $org->id)->assertJsonPath('requester_id', $user->id);
    }

    public function test_tenant_isolation_blocks_other_org_ticket(): void
    {
        $orgA = Organization::create(['name' => 'A', 'slug' => 'a']);
        $orgB = Organization::create(['name' => 'B', 'slug' => 'b']);
        $userA = User::create(['organization_id' => $orgA->id, 'name' => 'A', 'email' => 'a@test.dev', 'password' => Hash::make('password'), 'role' => 'admin']);
        $userB = User::create(['organization_id' => $orgB->id, 'name' => 'B', 'email' => 'b@test.dev', 'password' => Hash::make('password'), 'role' => 'admin']);
        $ticket = Ticket::create(['organization_id' => $orgB->id, 'requester_id' => $userB->id, 'subject' => 'Private', 'description' => 'Hidden', 'status' => 'open', 'priority' => 'medium', 'tags' => []]);

        Sanctum::actingAs($userA);
        $this->getJson('/api/tickets/'.$ticket->id)->assertNotFound();
    }

    public function test_customer_cannot_see_internal_notes(): void
    {
        $org = Organization::create(['name' => 'Acme', 'slug' => 'acme']);
        $customer = User::create(['organization_id' => $org->id, 'name' => 'Customer', 'email' => 'c@test.dev', 'password' => Hash::make('password'), 'role' => 'customer']);
        $agent = User::create(['organization_id' => $org->id, 'name' => 'Agent', 'email' => 'agent@test.dev', 'password' => Hash::make('password'), 'role' => 'agent']);
        $ticket = Ticket::create(['organization_id' => $org->id, 'requester_id' => $customer->id, 'assignee_id' => $agent->id, 'subject' => 'Question', 'description' => 'Need answer', 'status' => 'open', 'priority' => 'medium', 'tags' => []]);

        Sanctum::actingAs($agent);
        $this->postJson('/api/tickets/'.$ticket->id.'/comments', ['body' => 'Private note', 'is_internal' => true])->assertCreated();

        Sanctum::actingAs($customer);
        $this->getJson('/api/tickets/'.$ticket->id)->assertOk()->assertJsonMissing(['body' => 'Private note']);
    }
}
