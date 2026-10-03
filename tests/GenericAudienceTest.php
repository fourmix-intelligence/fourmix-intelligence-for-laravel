<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\Tools\ToolRegistry;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class GenericAudienceTest extends TestCase
{
    public function test_existing_tools_remain_internal_and_customers_cannot_invoke_them(): void
    {
        $registry = app(ToolRegistry::class);
        $registry->register(new GenericAudienceFixture);
        $registry->registerCallback('catalog.legacy', ['read_only' => true, 'input_schema' => ['type' => 'object', 'properties' => []]], fn (): array => ['fixture' => true]);
        $tools = array_column($registry->manifest(), null, 'name');
        self::assertSame(['internal'], $tools['catalog.internal']['audiences']);
        self::assertSame(['internal'], $tools['catalog.legacy']['audiences']);
        self::assertSame(['customer'], $tools['catalog.customer']['audiences']);
        self::assertSame(['fixture' => true], $registry->execute('catalog.internal', []));
        foreach (['catalog.internal', 'catalog.legacy'] as $name) {
            try {
                $registry->execute($name, [], context: new ToolContext('customer:fixture', identity: ['audience' => 'customer']));
                self::fail('外部利用者へ内部ツールを自動公開してはいけません。');
            } catch (HttpException $exception) {
                self::assertSame(403, $exception->getStatusCode());
            }
        }
    }

    public function test_explicit_customer_tools_accept_only_the_declared_audience(): void
    {
        $registry = app(ToolRegistry::class);
        $registry->register(new GenericAudienceFixture);
        self::assertSame(['fixture' => true], $registry->execute('catalog.customer', [], context: new ToolContext('customer:fixture', identity: ['audience' => 'customer'])));
        $this->expectException(HttpException::class);
        $registry->execute('catalog.customer', [], context: new ToolContext('user:fixture', identity: ['audience' => 'internal']));
    }

    /** @return array<string, array{mixed}> */
    public static function invalidAudiences(): array
    {
        return ['empty' => [[]], 'unknown' => [['external']], 'wildcard' => [['*']], 'null' => [null],
            'scalar' => ['customer'], 'number' => [[1]], 'associative' => [['scope' => 'customer']]];
    }

    #[DataProvider('invalidAudiences')]
    public function test_callbacks_reject_malformed_or_unknown_audiences(mixed $audiences): void
    {
        $registry = app(ToolRegistry::class);
        $this->expectException(\InvalidArgumentException::class);
        $registry->registerCallback('catalog.invalid', ['read_only' => true, 'input_schema' => ['type' => 'object', 'properties' => []], 'audiences' => $audiences], fn (): array => []);
    }

    public function test_attributes_are_validated_when_registered(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        app(ToolRegistry::class)->register(new InvalidAudienceFixture);
    }

    public function test_customer_exposure_changes_the_definition_fingerprint_and_preserves_write_confirmation(): void
    {
        $internal = new ToolRegistry($this->app);
        $customer = new ToolRegistry($this->app);
        $definition = ['read_only' => false, 'requires_approval' => true, 'input_schema' => ['type' => 'object', 'properties' => []]];
        $internal->registerCallback('catalog.change', $definition, fn (): array => []);
        $customer->registerCallback('catalog.change', [...$definition, 'audiences' => ['customer']], fn (): array => []);
        self::assertNotSame($internal->fingerprint('catalog.change'), $customer->fingerprint('catalog.change'));
        $manifest = $customer->manifest()[0];
        self::assertFalse($manifest['read_only']);
        self::assertTrue($manifest['requires_approval']);
        self::assertContains('idempotency_key', $manifest['input_schema']['required']);
        self::assertSame('uuid', $manifest['input_schema']['properties']['idempotency_key']['format']);
    }
}

final class GenericAudienceFixture
{
    #[FourmixIntelligenceTool(name: 'catalog.internal', description: '内部情報を確認します')]
    public function internal(): array
    {
        return ['fixture' => true];
    }

    #[FourmixIntelligenceTool(name: 'catalog.customer', description: '本人向けの情報を確認します', audiences: ['customer'])]
    public function customer(): array
    {
        return ['fixture' => true];
    }
}

final class InvalidAudienceFixture
{
    #[FourmixIntelligenceTool(name: 'catalog.invalid', description: '無効な定義', audiences: ['*'])]
    public function invalid(): array
    {
        return [];
    }
}
