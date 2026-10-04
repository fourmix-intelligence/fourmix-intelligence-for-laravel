<?php

namespace FourmixIntelligence\Laravel\Tools;

use Closure;
use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use Illuminate\Contracts\Container\Container;
use Illuminate\Support\Str;
use ReflectionClass;

final class ToolRegistry
{
    /** @var array<string, array<string, mixed>> */
    private array $tools = [];

    public function __construct(private readonly Container $container) {}

    /** @param object|class-string<object> $handler */
    public function register(object|string $handler): void
    {
        $reflection = new ReflectionClass($handler);
        foreach ($reflection->getMethods() as $method) {
            $attribute = $method->getAttributes(FourmixIntelligenceTool::class)[0] ?? null;
            if ($attribute === null || ! $method->isPublic()) {
                continue;
            }
            $tool = $attribute->newInstance();
            if (isset($this->tools[$tool->name])) {
                throw new \LogicException("ツール名が重複しています: {$tool->name}");
            }
            $readOnly = $tool->requiresApproval ? false : $tool->readOnly;
            $this->tools[$tool->name] = [
                'name' => $tool->name,
                'handler' => $handler,
                'method' => $method->getName(),
                'description' => $tool->description,
                'domain' => $tool->domain ?: explode('.', $tool->name, 2)[0],
                'keywords' => array_values(array_unique($tool->keywords)),
                'scopes' => array_values(array_unique($tool->scopes)),
                'audiences' => $this->audiences($tool->audiences),
                'requires_approval' => $tool->requiresApproval,
                'read_only' => $readOnly,
                'destructive' => $tool->requiresApproval || $tool->destructive,
                'input_schema' => $this->writeSchema($tool->inputSchema, $readOnly),
                'version' => $tool->version,
                'approval_authority' => 'application',
            ];
        }
    }

    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        return $this->tools;
    }

    public function fingerprint(string $name): string
    {
        $tool = $this->tools[$name] ?? throw new \LogicException('業務機能が見つかりません。');

        return hash('sha256', json_encode(array_diff_key($tool, ['handler' => true, 'method' => true, 'callback' => true]), JSON_THROW_ON_ERROR));
    }

    /**
     * Explicitly register a dynamic catalog without automatically exposing routes.
     *
     * @param  array<string, mixed>  $definition
     */
    public function registerCallback(string $name, array $definition, Closure $callback): void
    {
        if (isset($this->tools[$name]) || ! preg_match('/^[a-z][a-z0-9_.-]{2,127}$/D', $name)) {
            throw new \LogicException('業務機能の識別子を確認してください。');
        }
        if (! is_bool($definition['read_only'] ?? null) || ! is_array($definition['input_schema'] ?? null)) {
            throw new \LogicException('参照・更新の区分と入力項目を明示してください。');
        }
        if (array_key_exists('requires_approval', $definition) && ! is_bool($definition['requires_approval'])) {
            throw new \LogicException('確認対象の指定は true または false にしてください。');
        }
        if ($definition['requires_approval'] ?? false) {
            $definition['read_only'] = false;
            $definition['destructive'] = true;
        }
        $definition['input_schema'] = $this->writeSchema($definition['input_schema'], $definition['read_only']);
        $definition['audiences'] = $this->audiences(array_key_exists('audiences', $definition) ? $definition['audiences'] : ['internal']);
        $this->tools[$name] = [...$definition, 'name' => $name, 'callback' => $callback];
    }

    /**
     * @param  list<string>  $enabledOperations
     * @return list<array<string, mixed>>
     */
    public function manifest(array $enabledOperations = ['*']): array
    {
        $all = in_array('*', $enabledOperations, true);

        return array_values(array_map(
            fn (array $tool): array => array_diff_key($tool, ['handler' => true, 'method' => true, 'callback' => true]),
            array_filter($this->tools, fn (array $tool, string $name): bool => $all || in_array($name, $enabledOperations, true), ARRAY_FILTER_USE_BOTH)
        ));
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @param  list<string>  $enabledOperations
     */
    public function execute(string $name, array $arguments, array $enabledOperations = ['*'], ?ToolContext $context = null): mixed
    {
        abort_unless(isset($this->tools[$name]), 404, '指定された業務機能が見つかりません。');
        abort_unless(in_array('*', $enabledOperations, true) || in_array($name, $enabledOperations, true), 403, 'この業務機能は公開されていません。');
        $tool = $this->tools[$name];
        $audience = $context?->identity['audience'] ?? 'internal';
        abort_unless(in_array($audience, ['internal', 'customer'], true) && in_array($audience, $tool['audiences'], true), 403, 'この利用者区分には業務機能を公開していません。');
        $arguments = $this->validateArguments($tool['input_schema'], $arguments);
        if (isset($tool['callback'])) {
            return ($tool['callback'])($arguments, $context);
        }
        $handler = is_string($tool['handler']) ? $this->container->make($tool['handler']) : $tool['handler'];
        $parameters = array_map(fn (\ReflectionParameter $parameter): string => $parameter->getName(), (new \ReflectionMethod($handler, (string) $tool['method']))->getParameters());
        if (! in_array('idempotency_key', $parameters, true)) {
            unset($arguments['idempotency_key']);
        }
        /** @var callable $callable */
        $callable = [$handler, (string) $tool['method']];

        return $this->container->call($callable, $context === null ? $arguments : [...$arguments, ToolContext::class => $context]);
    }

    /**
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    public function validateArguments(array $schema, array $arguments): array
    {
        $properties = (array) ($schema['properties'] ?? []);
        abort_if(array_diff(array_keys($arguments), array_keys($properties)) !== [], 422, '定義されていない入力項目が含まれています。');
        foreach ($schema['required'] ?? [] as $key) {
            abort_unless(array_key_exists($key, $arguments), 422, $key.' は必須です。');
        }
        foreach ($arguments as $key => $value) {
            $rule = (array) $properties[$key];
            $this->validateValue($rule, $value, (string) $key);
        }

        return $arguments;
    }

    /** @param array<string, mixed> $rule */
    private function validateValue(array $rule, mixed $value, string $key): void
    {
        $types = (array) ($rule['type'] ?? 'string');
        $valid = false;
        foreach ($types as $type) {
            $valid = $valid || match ($type) {
                'string' => is_string($value), 'integer' => is_int($value), 'number' => is_int($value) || is_float($value),
                'boolean' => is_bool($value), 'null' => $value === null,
                'array' => is_array($value) && array_is_list($value),
                'object' => is_array($value) && ($value === [] || ! array_is_list($value)),
                default => false,
            };
        }
        abort_unless($valid, 422, $key.' の形式を確認してください。');
        abort_if(isset($rule['enum']) && ! in_array($value, $rule['enum'], true), 422, $key.' の選択値を確認してください。');
        abort_if(is_string($value) && isset($rule['maxLength']) && mb_strlen($value) > $rule['maxLength'], 422, $key.' が長すぎます。');
        abort_if(is_string($value) && ($rule['format'] ?? '') === 'uuid' && ! Str::isUuid($value), 422, $key.' の受付番号を確認してください。');
        abort_if(is_string($value) && isset($rule['minLength']) && mb_strlen($value) < $rule['minLength'], 422, $key.' が短すぎます。');
        abort_if((is_int($value) || is_float($value)) && isset($rule['minimum']) && $value < $rule['minimum'], 422, $key.' が範囲を超えています。');
        abort_if((is_int($value) || is_float($value)) && isset($rule['maximum']) && $value > $rule['maximum'], 422, $key.' が範囲を超えています。');
        abort_if(is_array($value) && isset($rule['maxItems']) && count($value) > $rule['maxItems'], 422, $key.' の件数が多すぎます。');
        abort_if(is_array($value) && isset($rule['minItems']) && count($value) < $rule['minItems'], 422, $key.' の件数が不足しています。');
        if (in_array('object', $types, true) && is_array($value) && isset($rule['properties'])) {
            $this->validateArguments($rule, $value);
        }
        if (in_array('array', $types, true) && is_array($value) && isset($rule['items'])) {
            foreach ($value as $index => $item) {
                $this->validateValue($rule['items'], $item, $key.'.'.$index);
            }
        }
    }

    /** @param array<string, mixed> $schema
     * @return array<string, mixed>
     */
    private function writeSchema(array $schema, bool $readOnly): array
    {
        if (! $readOnly) {
            $schema['properties']['idempotency_key'] = ['type' => 'string', 'format' => 'uuid', 'description' => '一つの操作に一つのUUID。同じ依頼の再送では変更しません。'];
            $schema['required'] = array_values(array_unique([...(array) ($schema['required'] ?? []), 'idempotency_key']));
        }

        return $schema;
    }

    /** @return list<string> */
    private function audiences(mixed $audiences): array
    {
        if (! is_array($audiences) || ! array_is_list($audiences) || $audiences === []) {
            throw new \InvalidArgumentException('業務機能の利用者区分をリストで指定してください。');
        }
        foreach ($audiences as $audience) {
            if (! is_string($audience) || ! in_array($audience, ['internal', 'customer'], true)) {
                throw new \InvalidArgumentException('業務機能の利用者区分は internal または customer を指定してください。');
            }
        }

        return array_values(array_unique($audiences));
    }
}
