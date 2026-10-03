<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** 接続先と署名鍵は、利用者が承認して握手を完了した記録だけを正本にします。 */
final class BridgeConnections
{
    /** @return array{id: string, scope: string, workspace_id: string, secret: string, name: string, host_mode: string, subject: string, revision: int} */
    public function get(?string $id = null): array
    {
        abort_unless(is_string($id) && $id !== '' && Schema::hasTable('fourmix_intelligence_connections'), 403, '接続を指定してください。');
        $record = DB::table('fourmix_intelligence_connections')->where('remote_connection', $id)->first();
        abort_unless($record !== null && $record->state === 'ready' && $record->secret !== null, 403, '接続は利用できません。');

        return ['id' => $id, 'scope' => $record->scope, 'workspace_id' => $record->workspace_id,
            'secret' => Crypt::decryptString($record->secret), 'name' => $record->name,
            'host_mode' => $record->host_mode, 'subject' => $record->subject, 'revision' => (int) $record->revision];
    }

    /** @return list<array{id: string, scope: string, workspace_id: string, name: string}> */
    public function choices(ToolContext $context): array
    {
        return array_values(DB::table('fourmix_intelligence_connections')->where('subject', $context->subject)->where('state', 'ready')
            ->get(['remote_connection', 'scope', 'workspace_id', 'name'])->map(fn (object $row): array => ['id' => (string) $row->remote_connection, 'scope' => (string) $row->scope, 'workspace_id' => (string) $row->workspace_id, 'name' => (string) $row->name])->all());
    }

    /** @return array{url: string, tenant: string} */
    public function platform(string $id): array
    {
        $this->get($id);
        $record = DB::table('fourmix_intelligence_connections')->where('remote_connection', $id)->where('state', 'ready')->firstOrFail();

        return ['url' => $record->platform_url, 'tenant' => $record->tenant];
    }
}
