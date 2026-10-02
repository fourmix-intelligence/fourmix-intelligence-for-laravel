<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/** One execution path for local UI, native clients and remote AI. */
final class ToolExecutor
{
    public function __construct(private ToolRegistry $tools, private ToolPolicy $policy, private ToolConsent $consent) {}

    /** @param array<string, mixed> $arguments
     * @return array<string, mixed>
     */
    public function execute(ToolContext $context, string $operation, array $arguments, ?string $requestId = null): array
    {
        $tool = $this->tool($operation);
        if (! $tool['read_only'] && isset($tool['input_schema']['properties']['idempotency_key'])) {
            $arguments['idempotency_key'] ??= $requestId;
            abort_unless($arguments['idempotency_key'] === $requestId, 409, '受付番号が一致しません。');
        }
        $arguments = $this->tools->validateArguments($tool['input_schema'], $arguments);
        $this->authorized($context, $operation, $arguments);
        if ($tool['read_only']) {
            return ['state' => 'succeeded', 'data' => $this->tools->execute($operation, $arguments, context: $context)];
        }
        abort_unless(is_string($requestId) && Str::isUuid($requestId), 422, '更新操作には一意の受付番号が必要です。');
        $hash = hash('sha256', json_encode($this->canonical([$operation, $arguments, $context->identity]), JSON_THROW_ON_ERROR));
        $id = DB::transaction(function () use ($context, $operation, $arguments, $requestId, $hash): string {
            $this->consent->lock($context->subject);
            $this->authorized($context, $operation, $arguments);
            $existing = DB::table('fourmix_intelligence_tool_actions')->where('subject', $context->subject)->where('request_id', $requestId)->first();
            if ($existing !== null) {
                abort_unless(hash_equals($existing->payload_hash, $hash), 409, '同じ受付番号で内容を変更できません。');

                return $existing->id;
            }
            $id = (string) Str::uuid();
            DB::table('fourmix_intelligence_tool_actions')->insert([
                'id' => $id, 'subject' => $context->subject, 'request_id' => $requestId, 'operation' => $operation,
                'payload_hash' => $hash, 'state' => 'confirmation_required', 'channel' => $context->channel,
                'payload' => Crypt::encryptString(json_encode(['arguments' => $arguments, 'identity' => $context->identity, 'definition_hash' => $this->tools->fingerprint($operation), 'preview' => $this->policy->preview($context, $operation, $arguments)], JSON_THROW_ON_ERROR)),
                'expires_at' => now()->addMinutes(15), 'created_at' => now(), 'updated_at' => now(),
            ]);

            return $id;
        });
        if ($this->consent->mode($context->subject, $operation) === 'automatic') {
            return $this->run($context, $id, false);
        }

        return $this->action($context, $id);
    }

    /** @return array<string, mixed> */
    public function action(ToolContext $context, string $id): array
    {
        $row = $this->row($context, $id);
        $payload = json_decode(Crypt::decryptString($row->payload), true, 512, JSON_THROW_ON_ERROR);
        $this->authorized($context, $row->operation, $payload['arguments']);
        $result = ['id' => $row->id, 'operation' => $row->operation, 'state' => $row->state, 'channel' => $row->channel];
        if ($row->state === 'succeeded') {
            $result['data'] = json_decode(Crypt::decryptString($row->result), true, 512, JSON_THROW_ON_ERROR);
        } elseif ($row->state === 'confirmation_required') {
            $result += ['preview' => $payload['preview'], 'url' => $this->policy->reviewUrl($id), 'expires_at' => $row->expires_at];
            if (now()->gte($row->expires_at)) {
                $result['state'] = 'expired';
            }
        } else {
            $result['message'] = '実行結果を確認してから、必要な操作を改めて依頼してください。同じ受付番号では再実行しません。';
        }

        return $result;
    }

    /** @return array<string, mixed> */
    public function receipt(ToolContext $context, string $requestId): array
    {
        abort_unless(Str::isUuid($requestId), 422);
        $row = DB::table('fourmix_intelligence_tool_actions')->where('subject', $context->subject)->where('request_id', $requestId)->firstOrFail();

        return $this->action($context, $row->id);
    }

    /** Only an authenticated human UI endpoint may call confirm, never an AI tool.
     * @return array<string, mixed>
     */
    public function confirm(ToolContext $context, string $id): array
    {
        return $this->run($context, $id, true);
    }

    /** @return array<string, mixed> */
    public function reject(ToolContext $context, string $id): array
    {
        DB::transaction(function () use ($context, $id): void {
            $this->consent->lock($context->subject);
            $this->row($context, $id);
            DB::table('fourmix_intelligence_tool_actions')->where('id', $id)->where('state', 'confirmation_required')->update(['state' => 'rejected', 'updated_at' => now()]);
        });

        return $this->action($context, $id);
    }

    /** @return array<string, mixed> */
    private function run(ToolContext $context, string $id, bool $human): array
    {
        $claimed = DB::transaction(function () use ($context, $id, $human): bool {
            $this->consent->lock($context->subject);
            $row = $this->row($context, $id);
            if ($row->state !== 'confirmation_required') {
                return false;
            }
            abort_if(now()->gte($row->expires_at), 410, '確認期限が切れました。');
            $payload = json_decode(Crypt::decryptString($row->payload), true, 512, JSON_THROW_ON_ERROR);
            $original = new ToolContext($context->subject, $row->channel, $payload['identity']);
            abort_unless(hash_equals($payload['definition_hash'], $this->tools->fingerprint($row->operation)), 409, '業務機能が更新されています。新しい内容で依頼してください。');
            $this->authorized($original, $row->operation, $payload['arguments']);
            abort_unless($human || $this->consent->mode($context->subject, $row->operation) === 'automatic', 403, 'この操作は確認が必要です。');
            abort_unless($this->canonical($payload['preview']) === $this->canonical($this->policy->preview($original, $row->operation, $payload['arguments'])), 409, '対象の内容が変更されています。最新の内容で依頼してください。');
            DB::table('fourmix_intelligence_tool_actions')->where('id', $id)->update(['state' => 'running', 'authorization' => $human ? 'human' : 'standing', 'updated_at' => now()]);

            return true;
        });
        if (! $claimed) {
            return $this->action($context, $id);
        }
        try {
            DB::transaction(function () use ($context, $id): void {
                $this->consent->lock($context->subject);
                $row = $this->row($context, $id);
                $payload = json_decode(Crypt::decryptString($row->payload), true, 512, JSON_THROW_ON_ERROR);
                $original = new ToolContext($context->subject, $row->channel, $payload['identity']);
                abort_unless(hash_equals($payload['definition_hash'], $this->tools->fingerprint($row->operation)), 409, '業務機能が更新されています。新しい内容で依頼してください。');
                $this->authorized($original, $row->operation, $payload['arguments']);
                abort_if($row->authorization === 'standing' && $this->consent->mode($context->subject, $row->operation) !== 'automatic', 403, '継続許可が撤回されました。');
                $result = $this->tools->execute($row->operation, $payload['arguments'], context: $original);
                $encoded = json_encode($result, JSON_THROW_ON_ERROR);
                abort_if(strlen($encoded) > 512000, 422, '処理結果が大きすぎます。');
                DB::table('fourmix_intelligence_tool_actions')->where('id', $id)->update(['state' => 'succeeded', 'result' => Crypt::encryptString($encoded), 'updated_at' => now()]);
            }, 1);
        } catch (Throwable $exception) {
            DB::table('fourmix_intelligence_tool_actions')->where('id', $id)->where('state', 'running')->update(['state' => 'unknown_effect', 'updated_at' => now()]);
            throw $exception;
        }

        return $this->action($context, $id);
    }

    /** @param array<string, mixed> $arguments */
    private function authorized(ToolContext $context, string $operation, array $arguments): void
    {
        $this->tool($operation);
        abort_unless($this->consent->mode($context->subject, $operation) !== 'disabled', 403, 'このAI操作は許可されていません。');
        $this->policy->authorize($context, $operation, $arguments);
    }

    private function row(ToolContext $context, string $id): \stdClass
    {
        return DB::table('fourmix_intelligence_tool_actions')->where('subject', $context->subject)->where('id', $id)->firstOrFail();
    }

    /** @return array<string, mixed> */
    private function tool(string $name): array
    {
        $tool = $this->tools->all()[$name] ?? abort(404, '業務機能が見つかりません。');
        $enabled = (array) config('fourmix-intelligence.bridge.enabled_operations', []);
        abort_unless(in_array('*', $enabled, true) || in_array($name, $enabled, true), 403, '業務機能は公開されていません。');

        return $tool;
    }

    /** @param array<array-key, mixed> $value
     * @return array<array-key, mixed>
     */
    private function canonical(array $value): array
    {
        foreach ($value as &$item) {
            if (is_array($item)) {
                $item = $this->canonical($item);
            }
        }
        unset($item);
        if (! array_is_list($value)) {
            ksort($value);
        }

        return $value;
    }
}
