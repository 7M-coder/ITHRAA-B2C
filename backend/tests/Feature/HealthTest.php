<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_returns_healthy_json_when_database_is_available(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()->assertExactJson([
            'status' => 'ok',
            'database' => 'connected',
        ]);
    }

    public function test_returns_503_without_internal_details_when_database_fails(): void
    {
        DB::shouldReceive('select')->once()->with('SELECT 1')
            ->andThrow(new RuntimeException('Private connection details'));

        $response = $this->getJson('/api/health');

        $response->assertStatus(503)->assertExactJson([
            'status' => 'unavailable',
            'database' => 'unavailable',
        ]);
    }
}
