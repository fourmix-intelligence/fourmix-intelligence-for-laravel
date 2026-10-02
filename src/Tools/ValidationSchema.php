<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Validation\Rules\In;

/** Describes Laravel validation fields without running database or authorization rules. */
final class ValidationSchema
{
    /**
     * @param  array<string, mixed>  $rules
     * @param  list<string>  $hidden
     * @return array<string, mixed>
     */
    public static function fromRules(array $rules, array $hidden = []): array
    {
        $schema = ['type' => 'object', 'properties' => [], 'required' => [], 'additionalProperties' => false];
        $excluded = [];
        foreach ($rules as $field => $definition) {
            $parts = is_string($definition) ? explode('|', $definition) : (array) $definition;
            if (in_array('exclude', $parts, true)) {
                $excluded[] = $field;
            }
        }
        foreach ($rules as $field => $definition) {
            if (in_array(explode('.', $field)[0], $hidden, true)) {
                continue;
            }
            foreach ($excluded as $prefix) {
                if ($field === $prefix || str_starts_with($field, $prefix.'.')) {
                    continue 2;
                }
            }
            $parts = is_string($definition) ? explode('|', $definition) : (array) $definition;
            $parts = array_values(array_filter(array_map(static fn (mixed $rule): ?string => is_string($rule) ? $rule : ($rule instanceof In ? (string) $rule : null), $parts)));
            if (in_array('exclude', $parts, true)) {
                continue;
            }
            $type = in_array('integer', $parts, true) ? 'integer' : (in_array('boolean', $parts, true) ? 'boolean' : 'string');
            foreach ($parts as $part) {
                if ($part === 'array' || str_starts_with($part, 'array:')) {
                    $type = 'object';
                }
            }
            $entry = ['type' => $type];
            if ($type === 'object') {
                $entry += ['properties' => [], 'required' => [], 'additionalProperties' => false];
            }
            foreach ($parts as $part) {
                [$name, $value] = array_pad(explode(':', $part, 2), 2, '');
                if ($name === 'date_format') {
                    $entry['description'] = '日付の形式：'.$value;
                } elseif ($name === 'uuid') {
                    $entry['format'] = 'uuid';
                } elseif ($name === 'in') {
                    $entry['enum'] = array_map(static fn (?string $choice): int|string => $type === 'integer' ? (int) $choice : (string) $choice, str_getcsv($value, ',', '"', '\\'));
                } elseif (in_array($name, ['min', 'max', 'between', 'size'], true)) {
                    $limits = array_map('intval', explode(',', $value));
                    if ($type === 'integer') {
                        if (in_array($name, ['min', 'between'], true)) {
                            $entry['minimum'] = $limits[0];
                        }
                        if (in_array($name, ['max', 'between'], true)) {
                            $entry['maximum'] = end($limits);
                        }
                    } elseif ($type === 'string') {
                        if ($name === 'min') {
                            $entry['minLength'] = $limits[0];
                        }
                        if ($name === 'max') {
                            $entry['maxLength'] = $limits[0];
                        }
                    } elseif ($type === 'object') {
                        if (in_array($name, ['min', 'size'], true)) {
                            $entry['minItems'] = $limits[0];
                        }
                        if (in_array($name, ['max', 'size'], true)) {
                            $entry['maxItems'] = $limits[0];
                        }
                    }
                }
            }
            if (in_array('nullable', $parts, true)) {
                $entry['type'] = [$type, 'null'];
                if (isset($entry['enum'])) {
                    $entry['enum'][] = null;
                }
            }
            $segments = explode('.', $field);
            $leaf = end($segments);
            if ($type === 'integer' && ($leaf === 'id' || str_ends_with($leaf, '_id'))) {
                $entry['type'] = in_array('nullable', $parts, true) ? ['integer', 'string', 'null'] : ['integer', 'string'];
                $entry['description'] = '参照で取得したID。大きなIDは桁を丸めず数字文字列で指定します。';
            }
            self::insert($schema, explode('.', $field), $entry, in_array('required', $parts, true) || in_array('present', $parts, true));
        }

        return $schema;
    }

    /**
     * @param  array<string, mixed>  $node
     * @param  list<string>  $path
     * @param  array<string, mixed>  $entry
     */
    private static function insert(array &$node, array $path, array $entry, bool $required): void
    {
        $key = array_shift($path);
        if ($key === '*') {
            $nullable = is_array($node['type'] ?? null) && in_array('null', $node['type'], true);
            $node['type'] = $nullable ? ['array', 'null'] : 'array';
            unset($node['properties'], $node['required'], $node['additionalProperties']);
            $node['items'] ??= ['type' => 'object', 'properties' => [], 'required' => [], 'additionalProperties' => false];
            if ($path === []) {
                $node['items'] = [...$node['items'], ...$entry];
                if (! in_array('object', (array) $entry['type'], true)) {
                    unset($node['items']['properties'], $node['items']['required'], $node['items']['additionalProperties']);
                }
            } else {
                self::insert($node['items'], $path, $entry, $required);
            }

            return;
        }
        $node['properties'] ??= [];
        $node['properties'][$key] ??= ['type' => 'object', 'properties' => [], 'required' => [], 'additionalProperties' => false];
        if ($path === []) {
            $node['properties'][$key] = [...$node['properties'][$key], ...$entry];
            if (! in_array('object', (array) ($entry['type'] ?? null), true)) {
                unset($node['properties'][$key]['properties'], $node['properties'][$key]['required'], $node['properties'][$key]['additionalProperties']);
            }
            if ($required) {
                $node['required'] = array_values(array_unique([...(array) ($node['required'] ?? []), $key]));
            }
        } else {
            self::insert($node['properties'][$key], $path, $entry, $required);
        }
    }
}
