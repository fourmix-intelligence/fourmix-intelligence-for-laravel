<?php

namespace FourmixIntelligence\Laravel\Tools;

use FourmixIntelligence\Laravel\Attributes\FourmixIntelligenceTool;
use Illuminate\Contracts\Container\Container;
use ReflectionClass;

final class ToolRegistry
{
    /** @var array<string, array<string, mixed>> */ private array $tools = [];

    public function __construct(private readonly Container $container) {}

    /** @param object|class-string<object> $handler */
    public function register(object|string $handler): void
    {
        $reflection = new ReflectionClass($handler);
        foreach ($reflection->getMethods() as $method) {
            $attribute = $method->getAttributes(FourmixIntelligenceTool::class)[0] ?? null;
            if ($attribute === null || !$method->isPublic()) continue;
            $tool = $attribute->newInstance();
            if (isset($this->tools[$tool->name])) throw new \LogicException("ツール名が重複しています: {$tool->name}");
            $readOnly = $tool->requiresApproval ? false : $tool->readOnly;
            $this->tools[$tool->name] = [
                'handler' => $handler,
                'method' => $method->getName(),
                'description' => $tool->description,
                'domain' => $tool->domain ?: explode('.', $tool->name, 2)[0],
                'keywords' => array_values(array_unique($tool->keywords)),
                'scopes' => array_values(array_unique($tool->scopes)),
                'requires_approval' => $tool->requiresApproval,
                'read_only' => $readOnly,
                'destructive' => $tool->requiresApproval || $tool->destructive,
                'input_schema' => $tool->inputSchema,
            ];
        }
    }

    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        return $this->tools;
    }

    /**
     * @param  list<string>  $enabledOperations
     * @return list<array<string, mixed>>
     */
    public function manifest(array $enabledOperations = ['*']): array
    {
        $all = in_array('*', $enabledOperations, true);

        return array_values(array_map(
            fn (array $tool): array => array_diff_key($tool, ['handler' => true, 'method' => true]),
            array_filter($this->tools, fn (array $tool, string $name): bool => $all || in_array($name, $enabledOperations, true), ARRAY_FILTER_USE_BOTH)
        ));
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @param  list<string>  $enabledOperations
     */
    public function execute(string $name, array $arguments, array $enabledOperations = ['*']): mixed
    {
        abort_unless(isset($this->tools[$name]), 404, '指定された業務機能が見つかりません。');
        abort_unless(in_array('*', $enabledOperations, true) || in_array($name, $enabledOperations, true), 403, 'この業務機能は公開されていません。');
        $tool = $this->tools[$name];
        $arguments = $this->validateArguments($tool['input_schema'], $arguments);
        $handler = is_string($tool['handler']) ? $this->container->make($tool['handler']) : $tool['handler'];
        /** @var callable $callable */
        $callable = [$handler, (string) $tool['method']];

        return $this->container->call($callable, $arguments);
    }

    /**
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function validateArguments(array $schema, array $arguments): array
    {
        $properties = (array) ($schema['properties'] ?? []);
        abort_if(array_diff(array_keys($arguments), array_keys($properties)) !== [], 422, '定義されていない入力項目が含まれています。');
        foreach ($schema['required'] ?? [] as $key) {
            abort_unless(array_key_exists($key, $arguments), 422, $key.' は必須です。');
        }
        foreach ($arguments as $key => $value) {
            $rule = (array) $properties[$key];
            $type = $rule['type'] ?? 'string';
            abort_if($type === 'string' && ! is_string($value), 422, $key.' の形式を確認してください。');
            abort_if($type === 'integer' && ! is_int($value), 422, $key.' の形式を確認してください。');
            abort_if($type === 'number' && ! is_numeric($value), 422, $key.' の形式を確認してください。');
            abort_if($type === 'boolean' && ! is_bool($value), 422, $key.' の形式を確認してください。');
            abort_if($type === 'array' && ! is_array($value), 422, $key.' の形式を確認してください。');
            abort_if($type === 'object' && ! is_array($value), 422, $key.' の形式を確認してください。');
            abort_if(isset($rule['enum']) && ! in_array($value, $rule['enum'], true), 422, $key.' の選択値を確認してください。');
            abort_if(is_string($value) && isset($rule['maxLength']) && mb_strlen($value) > $rule['maxLength'], 422, $key.' が長すぎます。');
            abort_if(is_array($value) && isset($rule['maxItems']) && count($value) > $rule['maxItems'], 422, $key.' の件数が多すぎます。');
        }

        return $arguments;
    }
}
