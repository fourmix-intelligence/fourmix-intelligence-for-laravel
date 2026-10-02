<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Tools\ToolConsent;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolExecutor;
use FourmixIntelligence\Laravel\Tools\ToolPolicy;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use FourmixIntelligence\Laravel\Tools\ValidationSchema;
use Illuminate\Database\RecordNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class BusinessToolsTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('s', 32)));
    }

    protected function setUp(): void
    {
        parent::setUp();
        (require __DIR__.'/../database/migrations/2026_10_02_000000_create_fourmix_intelligence_business_tables.php')->up();
        $this->app->instance(ToolPolicy::class, new BusinessToolsPolicy);
        $this->register('1');
    }

    private function register(string $version, ?\Closure $callback = null): ToolRegistry
    {
        $registry = new ToolRegistry($this->app);
        $registry->registerCallback('records.save', ['description' => '合成情報を保存', 'version' => $version, 'read_only' => false,
            'input_schema' => ['type' => 'object', 'properties' => ['name' => ['type' => 'string', 'maxLength' => 100]], 'required' => ['name']]],
            $callback ?? fn (array $arguments): array => ['saved' => $arguments['name']]);
        $this->app->instance(ToolRegistry::class, $registry);

        return $registry;
    }

    public function test_review_then_replay_has_one_durable_execution(): void
    {
        $calls = 0;
        $this->register('1', function (array $arguments) use (&$calls): array {
            $calls++;

            return ['saved' => $arguments['name']];
        });
        $context = new ToolContext('user:synthetic');
        app(ToolConsent::class)->replace($context->subject, ['records.save' => 'review'], app(ToolRegistry::class));
        $id = (string) Str::uuid();
        $executor = app(ToolExecutor::class);
        $proposal = $executor->execute($context, 'records.save', ['name' => '合成'], $id);
        self::assertSame(0, $calls);
        self::assertSame('confirmation_required', $proposal['state']);
        self::assertSame('succeeded', $executor->confirm($context, $proposal['id'])['state']);
        self::assertSame('succeeded', app(ToolExecutor::class)->execute($context, 'records.save', ['name' => '合成'], $id)['state']);
        self::assertSame(1, $calls);
    }

    public function test_operation_upgrade_downgrades_standing_consent_and_invalidates_old_review(): void
    {
        $context = new ToolContext('user:synthetic');
        app(ToolConsent::class)->replace($context->subject, ['records.save' => 'review'], app(ToolRegistry::class));
        $proposal = app(ToolExecutor::class)->execute($context, 'records.save', ['name' => '合成'], (string) Str::uuid());
        app(ToolConsent::class)->replace($context->subject, ['records.save' => 'automatic'], app(ToolRegistry::class));
        $this->register('2');
        self::assertSame('review', app(ToolConsent::class)->mode($context->subject, 'records.save'));
        $this->expectException(HttpException::class);
        app(ToolExecutor::class)->confirm($context, $proposal['id']);
    }

    public function test_unknown_effect_is_persisted_and_never_automatically_reexecuted(): void
    {
        $calls = 0;
        $this->register('1', function () use (&$calls): array {
            $calls++;
            throw new \RuntimeException('synthetic failure');
        });
        $context = new ToolContext('user:synthetic');
        app(ToolConsent::class)->replace($context->subject, ['records.save' => 'automatic'], app(ToolRegistry::class));
        $id = (string) Str::uuid();
        try {
            app(ToolExecutor::class)->execute($context, 'records.save', ['name' => '合成'], $id);
            self::fail('失敗した実行を成功として扱ってはいけません。');
        } catch (\RuntimeException) {
            self::assertSame('unknown_effect', DB::table('fourmix_intelligence_tool_actions')->value('state'));
        }
        self::assertSame('unknown_effect', app(ToolExecutor::class)->execute($context, 'records.save', ['name' => '合成'], $id)['state']);
        self::assertSame(1, $calls);
    }

    public function test_revoked_consent_blocks_human_confirmation(): void
    {
        $context = new ToolContext('user:synthetic');
        app(ToolConsent::class)->replace($context->subject, ['records.save' => 'review'], app(ToolRegistry::class));
        $proposal = app(ToolExecutor::class)->execute($context, 'records.save', ['name' => '合成'], (string) Str::uuid());
        app(ToolConsent::class)->replace($context->subject, [], app(ToolRegistry::class));
        $this->expectException(HttpException::class);
        app(ToolExecutor::class)->confirm($context, $proposal['id']);
    }

    public function test_nested_contract_rejects_missing_fields_and_bad_request_ids(): void
    {
        $this->expectException(HttpException::class);
        app(ToolRegistry::class)->validateArguments(['properties' => ['input' => ['type' => 'object', 'properties' => ['request' => ['type' => 'string', 'format' => 'uuid']], 'required' => ['request']]]], ['input' => ['request' => 'invalid']]);
    }

    public function test_receipt_reads_current_status_without_reexecuting_or_crossing_subjects(): void
    {
        $calls = 0;
        $this->register('1', function () use (&$calls): array {
            $calls++;

            return ['saved' => true];
        });
        $context = new ToolContext('user:synthetic');
        app(ToolConsent::class)->replace($context->subject, ['records.save' => 'review'], app(ToolRegistry::class));
        $requestId = (string) Str::uuid();
        $executor = app(ToolExecutor::class);
        $proposal = $executor->execute($context, 'records.save', ['name' => '合成'], $requestId);
        self::assertSame('confirmation_required', $executor->receipt($context, $requestId)['state']);
        $executor->confirm($context, $proposal['id']);
        self::assertSame('succeeded', $executor->receipt($context, $requestId)['state']);
        self::assertSame(1, $calls);
        $this->expectException(RecordNotFoundException::class);
        $executor->receipt(new ToolContext('user:another'), $requestId);
    }

    public function test_removed_public_operation_cannot_execute_a_pending_review(): void
    {
        $context = new ToolContext('user:synthetic');
        app(ToolConsent::class)->replace($context->subject, ['records.save' => 'review'], app(ToolRegistry::class));
        $executor = app(ToolExecutor::class);
        $proposal = $executor->execute($context, 'records.save', ['name' => '合成'], (string) Str::uuid());
        config(['fourmix-intelligence.bridge.enabled_operations' => []]);
        $this->expectException(HttpException::class);
        $executor->confirm($context, $proposal['id']);
    }

    public function test_rule_metadata_keeps_nested_integer_amounts_nullable_fields_and_hides_credentials(): void
    {
        $schema = ValidationSchema::fromRules([
            'password' => ['required', 'string'], 'version' => ['required', 'integer', 'min:0'],
            'rows' => ['present', 'array', 'max:10'], 'rows.*' => ['array:id,amount,note'],
            'rows.*.id' => ['required', 'integer'], 'rows.*.amount' => ['required', 'integer', 'between:-2000000000,2000000000'],
            'rows.*.note' => ['nullable', 'string', 'max:100'],
            'member_ids' => ['sometimes', 'array', 'max:100'], 'member_ids.*' => ['integer'],
            'excluded' => ['exclude', 'integer'],
            'private' => ['exclude', 'array'], 'private.*' => ['array:amount'], 'private.*.amount' => ['required', 'integer'],
        ], ['password']);
        self::assertArrayNotHasKey('password', $schema['properties']);
        self::assertArrayNotHasKey('excluded', $schema['properties']);
        self::assertArrayNotHasKey('private', $schema['properties']);
        self::assertSame('array', $schema['properties']['rows']['type']);
        self::assertSame(['id', 'amount'], $schema['properties']['rows']['items']['required']);
        $arguments = ['version' => 0, 'rows' => [['id' => '9007199254740993', 'amount' => -1, 'note' => null]], 'member_ids' => [1, 2]];
        self::assertSame($arguments, app(ToolRegistry::class)->validateArguments($schema, $arguments));
        $arguments['rows'][0]['amount'] = 1.5;
        $this->expectException(HttpException::class);
        app(ToolRegistry::class)->validateArguments($schema, $arguments);
    }
}

final class BusinessToolsPolicy implements ToolPolicy
{
    public function resolve(array $identity): ToolContext
    {
        return new ToolContext('user:synthetic');
    }

    public function authorize(ToolContext $context, string $operation, array $arguments): void {}

    public function preview(ToolContext $context, string $operation, array $arguments): array
    {
        return $arguments;
    }

    public function reviewUrl(string $actionId): string
    {
        return '/reviews/'.$actionId;
    }
}
