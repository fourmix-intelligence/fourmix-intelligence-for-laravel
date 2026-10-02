<?php

namespace FourmixIntelligence\Laravel\Tools;

use Illuminate\Support\Facades\DB;

/** Persistent, revocable consent; approval never expands application authorization. */
final class ToolConsent
{
    public function __construct(private ToolRegistry $tools) {}

    public function mode(string $subject, string $operation): string
    {
        $permission = DB::table('fourmix_intelligence_tool_permissions')->where('subject', $subject)->where('operation', $operation)->first();

        return $this->effectiveMode($operation, $permission);
    }

    /** @return array<string, string> */
    public function modes(string $subject): array
    {
        $permissions = DB::table('fourmix_intelligence_tool_permissions')->where('subject', $subject)->get()->keyBy('operation');
        $modes = [];
        foreach ($this->tools->all() as $operation => $tool) {
            $modes[$operation] = $this->effectiveMode($operation, $permissions->get($operation));
        }

        return $modes;
    }

    private function effectiveMode(string $operation, ?\stdClass $permission): string
    {
        if ($permission === null || ! isset($this->tools->all()[$operation])) {
            return 'disabled';
        }
        if ($permission->mode === 'automatic' && ! hash_equals($permission->definition_hash, $this->tools->fingerprint($operation))) {
            return 'review';
        }

        return $permission->mode;
    }

    /** MySQL の重複キーで共有ロックを取らず、同時要求のロック昇格によるデッドロックを防ぎます。 */
    public function lock(string $subject): void
    {
        DB::table('fourmix_intelligence_tool_subjects')->upsert([['subject' => $subject, 'created_at' => now()]], ['subject'], ['subject']);
        DB::table('fourmix_intelligence_tool_subjects')->where('subject', $subject)->lockForUpdate()->firstOrFail();
    }

    /**
     * The caller must authenticate the owner and show the exact operations before saving.
     *
     * @param  array<string, string>  $modes
     */
    public function replace(string $subject, array $modes, ToolRegistry $tools): void
    {
        foreach ($modes as $operation => $mode) {
            abort_unless(isset($tools->all()[$operation]) && in_array($mode, ['disabled', 'review', 'automatic'], true), 422, '操作と許可方法を確認してください。');
        }
        DB::transaction(function () use ($subject, $modes): void {
            $this->lock($subject);
            DB::table('fourmix_intelligence_tool_permissions')->where('subject', $subject)->delete();
            foreach ($modes as $operation => $mode) {
                DB::table('fourmix_intelligence_tool_permissions')->insert(['subject' => $subject, 'operation' => $operation, 'mode' => $mode, 'definition_hash' => $this->tools->fingerprint($operation), 'updated_at' => now()]);
            }
        });
    }
}
