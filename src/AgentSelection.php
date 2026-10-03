<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Http\NativeApplicationClient;
use FourmixIntelligence\Laravel\Tools\ConnectionManager;
use FourmixIntelligence\Laravel\Tools\ToolConsent;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Local aliases select an existing FI grant; they never create or widen that grant. */
final class AgentSelection
{
    public function __construct(private ConnectionManager $connections, private NativeApplicationClient $client) {}

    /** @return list<array<string, mixed>> */
    public function available(ToolContext $context, string $connectionId): array
    {
        $bound = $this->bound($context, $connectionId);
        $response = $this->client->call('agents', ['binding_id' => $bound['binding_id']], $bound['connection_id'], $bound['revision']);
        $this->assertBound($context, $connectionId, $bound);
        $grants = $response['agents'] ?? [];
        abort_unless(is_array($grants) && array_is_list($grants), 502, 'AIの利用許可を確認できませんでした。');
        $result = [];
        foreach ($grants as $grant) {
            if (! is_array($grant) || ! Str::isUuid((string) ($grant['grant_id'] ?? ''))) {
                continue;
            }
            $result[] = array_intersect_key($grant, array_flip(['grant_id', 'identify', 'slug', 'name', 'audience', 'scope', 'workspace_id', 'capabilities', 'datasets', 'capability_ids', 'dataset_ids', 'capability_summary', 'dataset_summary']));
        }

        return $result;
    }

    public function select(ToolContext $context, string $alias, string $connectionId, string $grantId, ?string $requiredAudience = null): void
    {
        abort_unless(preg_match('/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/D', $alias) === 1, 422, 'AIの呼び出し名を確認してください。');
        $bound = $this->bound($context, $connectionId);
        $grant = $this->grant($context, $connectionId, $grantId);
        abort_if($requiredAudience !== null && ($grant['audience'] ?? 'internal') !== $requiredAudience, 422, 'このチャット画面では社内向けAIを設定してください。');
        $name = is_string($grant['name'] ?? null) && trim($grant['name']) !== '' ? mb_substr(trim($grant['name']), 0, 200) : 'AIアシスタント';
        DB::transaction(function () use ($context, $alias, $connectionId, $grantId, $name, $bound): void {
            app(ToolConsent::class)->lock($context->subject);
            $this->assertBound($context, $connectionId, $bound);
            DB::table('fourmix_intelligence_agent_bindings')->upsert([['subject' => $context->subject, 'alias' => $alias,
                'connection_id' => $connectionId, 'grant_id' => $grantId, 'display_name' => $name, 'created_at' => now(), 'updated_at' => now()]],
                ['subject', 'alias'], ['connection_id', 'grant_id', 'display_name', 'updated_at']);
        });
    }

    /** @return list<array<string, mixed>> */
    public function selections(ToolContext $context): array
    {
        return array_values(DB::table('fourmix_intelligence_agent_bindings as agents')
            ->join('fourmix_intelligence_connections as connections', 'connections.id', '=', 'agents.connection_id')
            ->where('agents.subject', $context->subject)->where('connections.subject', $context->subject)
            ->orderBy('agents.alias')->get(['agents.alias', 'agents.connection_id', 'agents.grant_id', 'agents.display_name', 'connections.revision as connection_revision'])->map(function (object $row): array {
                $item = (array) $row;
                $item['name'] = $row->display_name;
                $item['connection_revision'] = (int) $row->connection_revision;

                return $item;
            })->all());
    }

    public function remove(ToolContext $context, string $alias): void
    {
        DB::transaction(function () use ($context, $alias): void {
            app(ToolConsent::class)->lock($context->subject);
            DB::table('fourmix_intelligence_agent_bindings')->where('subject', $context->subject)->where('alias', $alias)->delete();
        });
    }

    /** @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function call(ToolContext $context, string $alias, string $action, array $payload, ?callable $onEvent = null): array
    {
        abort_unless(in_array($action, ['agent_chat', 'agent_history', 'agent_attachments', 'agent_attachment_upload', 'agent_attachment_content', 'agent_attachment_delete'], true), 422);
        $selection = DB::table('fourmix_intelligence_agent_bindings')->where('subject', $context->subject)->where('alias', $alias)->firstOrFail();

        if (isset($payload['expected_selection'])) {
            $bound = $this->bound($context, $selection->connection_id);
            $expected = $payload['expected_selection'];
            abort_unless(is_array($expected) && ($expected['connection_id'] ?? null) === $selection->connection_id
                && ($expected['grant_id'] ?? null) === $selection->grant_id && (int) ($expected['connection_revision'] ?? 0) === $bound['revision'], 409,
                'チャットのAI設定が変更されました。入力内容を確認して画面を再読み込みしてください。');
        }

        return $this->callResolved($context, $selection->connection_id, $selection->grant_id, $action, $payload, $selection, $onEvent);
    }

    /**
     * Call an AI visible to this connection, without creating a UI binding.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function callConnection(ToolContext $context, string $connection, string $agent, string $action, array $payload, ?callable $onEvent = null): array
    {
        return $this->callResolved($context, $this->connectionId($context, $connection), $agent, $action, $payload, null, $onEvent);
    }

    /** @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function callResolved(ToolContext $context, string $connectionId, string $agent, string $action, array $payload, ?\stdClass $selection = null, ?callable $onEvent = null): array
    {
        abort_unless(in_array($action, ['agent_chat', 'agent_history', 'agent_attachments', 'agent_attachment_upload', 'agent_attachment_content', 'agent_attachment_delete'], true), 422);
        $bound = $this->bound($context, $connectionId);
        $matches = array_values(array_filter($this->available($context, $connectionId), fn (array $grant): bool => in_array($agent, array_filter([$grant['grant_id'], $grant['slug'] ?? null, $grant['identify'] ?? null], 'is_string'), true)));
        abort_unless(count($matches) === 1, 403, 'この接続で利用できるAIを指定してください。');
        $grant = $matches[0];
        $visitor = $payload['visitor_id'] ?? null;
        abort_unless(($grant['audience'] ?? 'internal') === 'customer' ? is_string($visitor) && preg_match('/^[a-zA-Z0-9_.:-]{1,128}$/D', $visitor) === 1 : $visitor === null, 422, 'AIの利用対象に対応した利用者を指定してください。');
        $this->assertBound($context, $connectionId, $bound);
        if ($selection !== null) {
            $current = DB::table('fourmix_intelligence_agent_bindings')->where('subject', $context->subject)->where('alias', $selection->alias)->first();
            abort_unless($current !== null && $current->connection_id === $selection->connection_id && $current->grant_id === $selection->grant_id, 409,
                'チャットのAI設定が変更されました。入力内容を確認して画面を再読み込みしてください。');
        }

        $payload = ['binding_id' => $bound['binding_id'], 'grant_id' => $grant['grant_id']] +
            array_diff_key($payload, array_flip(['binding_id', 'grant_id', 'identity', 'remote_user', 'connection_id', 'allowed_operations', 'host_agent_alias', 'expected_selection', 'stream']));
        if ($onEvent !== null) {
            abort_unless($action === 'agent_chat', 422);

            return $this->client->stream($payload, $bound['connection_id'], $bound['revision'], $onEvent);
        }

        return $this->client->call($action, $payload, $bound['connection_id'], $bound['revision']);
    }

    private function connectionId(ToolContext $context, string $connection): string
    {
        if (Str::isUuid($connection)) {
            return $this->connections->owned($context, $connection)->id;
        }
        $matches = DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->where('name', $connection)->pluck('id');
        abort_unless($matches->count() === 1, 422, '接続名が重複しているか、接続が見つかりません。接続IDを指定してください。');

        return $matches->first();
    }

    /** @return array<string, mixed> */
    private function grant(ToolContext $context, string $connectionId, string $grantId): array
    {
        foreach ($this->available($context, $connectionId) as $grant) {
            if ($grant['grant_id'] === $grantId) {
                return $grant;
            }
        }
        abort(403, 'このAIの利用許可がありません。Fourmix Intelligenceで許可を確認してください。');
    }

    /** @param array{connection_id: string, binding_id: string, revision: int} $expected */
    private function assertBound(ToolContext $context, string $connectionId, array $expected): void
    {
        abort_unless($this->bound($context, $connectionId) === $expected, 409, '接続が更新されました。もう一度接続とAIを設定してください。');
    }

    /** @return array{connection_id: string, binding_id: string, revision: int} */
    private function bound(ToolContext $context, string $connectionId): array
    {
        $connection = $this->connections->owned($context, $connectionId);
        abort_unless($connection->state === 'ready' && is_string($connection->remote_connection), 403, '接続は利用できません。');
        $binding = DB::table('fourmix_intelligence_user_bindings')->where('subject', $context->subject)
            ->where('connection_id', $connection->remote_connection)->whereNull('revoked_at')->whereNotNull('remote_user')->firstOrFail();

        return ['connection_id' => $connection->remote_connection, 'binding_id' => $binding->id, 'revision' => (int) $connection->revision];
    }
}
