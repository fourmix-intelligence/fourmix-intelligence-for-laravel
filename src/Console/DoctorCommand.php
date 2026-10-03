<?php

namespace FourmixIntelligence\Laravel\Console;

use FourmixIntelligence\Laravel\AgentSelection;
use FourmixIntelligence\Laravel\Exceptions\ApiException;
use FourmixIntelligence\Laravel\Http\FourmixIntelligenceClient;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

final class DoctorCommand extends Command
{
    protected $signature = 'fi:doctor {--connection= : 確認する接続ID} {--api : 明示設定した低レベルAPIクライアントを確認する}';

    protected $description = 'Fourmix Intelligence の接続設定を確認します';

    public function handle(FourmixIntelligenceClient $client): int
    {
        try {
            if (! $this->option('api')) {
                foreach (['fourmix_intelligence_connections', 'fourmix_intelligence_agent_bindings', 'fourmix_intelligence_ui_surfaces'] as $table) {
                    if (! Schema::hasTable($table)) {
                        $this->components->error('SDKのテーブルがありません。マイグレーションを実行してください。');

                        return self::FAILURE;
                    }
                }
                $id = $this->option('connection');
                if ($id !== null) {
                    abort_unless(is_string($id) && Str::isUuid($id), 422);
                    $record = DB::table('fourmix_intelligence_connections')->where('id', $id)->firstOrFail();
                    $agents = app(AgentSelection::class)->available(new ToolContext($record->subject), $id);
                    $this->components->info('接続を確認しました。利用できるAI: '.count($agents));
                } else {
                    $this->components->info('SDKの設定を確認しました。接続済み: '.DB::table('fourmix_intelligence_connections')->where('state', 'ready')->count());
                    $this->line('接続とAIは管理画面で設定できます。個別の通信確認は --connection=接続ID を指定してください。');
                }

                return self::SUCCESS;
            }
            $client->json('GET', '/api/v3/ai/plugins/metadata');
            $this->components->info('Fourmix Intelligence に接続できました。');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $type = $exception instanceof ApiException ? 'api' : ($exception instanceof ConnectionException ? 'connection' : 'unexpected');
            $status = $exception instanceof ApiException
                ? ', status='.($exception->status >= 100 && $exception->status <= 599 ? $exception->status : 'unknown') : '';
            $this->components->error('接続を確認できませんでした。 (type='.$type.$status.')');

            return self::FAILURE;
        }
    }
}
