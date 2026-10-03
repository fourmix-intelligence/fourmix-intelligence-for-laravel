<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Tools\ToolContext;
use Illuminate\Support\Facades\DB;
use LogicException;

final class UiSurfaces
{
    /** @return array<string, array{type:string, alias:string, enabled:bool, title:string, view:?string}> */
    public function definitions(): array
    {
        $definitions = array_replace((array) config('fourmix-intelligence.ui.surfaces', []), (array) config('fi-ui', []));
        $result = [];
        $aliases = [];
        foreach ($definitions as $name => $definition) {
            if (! is_string($name) || ! preg_match('/^[a-z][a-z0-9-]{0,63}$/D', $name) || ! is_array($definition)) {
                throw new LogicException('チャット画面の設定名を確認してください。');
            }
            $alias = $definition['alias'] ?? 'ui-'.$name;
            if (! in_array($definition['type'] ?? null, ['page', 'floating'], true) || ! is_string($alias)
                || ! preg_match('/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/D', $alias) || isset($aliases[$alias])) {
                throw new LogicException('チャット画面の種類と固有のAI設定名を確認してください。');
            }
            $aliases[$alias] = true;
            $result[$name] = ['type' => $definition['type'], 'alias' => $alias, 'enabled' => (bool) ($definition['enabled'] ?? true),
                'title' => (string) ($definition['title'] ?? 'AIアシスタント'), 'view' => isset($definition['view']) ? (string) $definition['view'] : null];
        }

        return $result;
    }

    /** @return array{type:string, alias:string, enabled:bool, title:string, view:?string} */
    public function definition(string $name): array
    {
        $definitions = $this->definitions();
        abort_unless(isset($definitions[$name]), 404, 'このチャット画面は設定されていません。');

        return $definitions[$name];
    }

    /** @param list<array<string, mixed>> $selections
     * @return list<array<string, mixed>>
     */
    public function for(ToolContext $context, array $selections = []): array
    {
        $preferences = DB::table('fourmix_intelligence_ui_surfaces')->where('subject', $context->subject)->pluck('enabled', 'name');
        $agents = array_column($selections, null, 'alias');
        $result = [];
        foreach ($this->definitions() as $name => $definition) {
            $agent = $agents[$definition['alias']] ?? null;
            $result[] = ['name' => $name, 'type' => $definition['type'], 'alias' => $definition['alias'], 'title' => $definition['title'],
                'enabled' => $definition['enabled'] && (bool) ($preferences[$name] ?? true), 'configured' => $agent !== null,
                'agent_name' => $agent['name'] ?? $definition['title'], 'connection_id' => $agent['connection_id'] ?? null, 'grant_id' => $agent['grant_id'] ?? null,
                'connection_revision' => $agent['connection_revision'] ?? null];
        }

        return $result;
    }

    public function enabled(ToolContext $context, string $name): bool
    {
        $definition = $this->definition($name);

        return $definition['enabled'] && (bool) (DB::table('fourmix_intelligence_ui_surfaces')->where('subject', $context->subject)->where('name', $name)->value('enabled') ?? true);
    }

    public function resolve(ToolContext $context, string $name): string
    {
        abort_unless($this->enabled($context, $name), 404, 'このチャット画面は利用できません。');

        return $this->definition($name)['alias'];
    }

    public function save(ToolContext $context, string $name, bool $enabled): void
    {
        $definition = $this->definition($name);
        abort_if($enabled && ! $definition['enabled'], 403, 'このチャット画面はアプリケーションの設定で無効になっています。');
        DB::table('fourmix_intelligence_ui_surfaces')->upsert([['subject' => $context->subject, 'name' => $name, 'enabled' => $enabled,
            'created_at' => now(), 'updated_at' => now()]], ['subject', 'name'], ['enabled', 'updated_at']);
    }
}
