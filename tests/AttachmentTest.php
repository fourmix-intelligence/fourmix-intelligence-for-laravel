<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\Attachments\AttachmentPolicy;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Auth\GenericUser;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;

final class AttachmentTest extends TestCase
{
    private string $local;

    private string $remote;

    private string $grant;

    private string $binding;

    private string $conversation;

    private string $attachment;

    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('a', 32)));
        $app['config']->set('cache.default', 'array');
        $app['config']->set('cache.limiter', 'array');
        $app['config']->set('fourmix-intelligence.ui.surfaces.page.alias', 'assistant');
        $app['config']->set('fourmix-intelligence.native.trusted_platform_urls', ['https://platform.example.test']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        (require __DIR__.'/../database/migrations/0001_01_01_000000_create_fourmix_intelligence_tables.php')->up();
        app(UiSurfaces::class)->save(new ToolContext('user:1'), 'page', true);
        $this->local = (string) Str::uuid();
        $this->remote = (string) Str::uuid();
        $this->grant = (string) Str::uuid();
        $this->binding = (string) Str::uuid();
        $this->conversation = (string) Str::uuid();
        $this->attachment = (string) Str::uuid();
        DB::table('fourmix_intelligence_connections')->insert(['id' => $this->local, 'subject' => 'user:1', 'name' => '合成接続',
            'platform_url' => 'https://platform.example.test', 'ui_url' => 'https://app.example.test', 'tenant' => 'synthetic', 'scope' => 'personal',
            'host_mode' => 'user', 'remote_connection' => $this->remote, 'workspace_id' => '', 'secret' => Crypt::encryptString(str_repeat('a', 64)),
            'state' => 'ready', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('fourmix_intelligence_user_bindings')->insert(['id' => $this->binding, 'subject' => 'user:1', 'display_name' => '合成利用者',
            'workspace_id' => '', 'connection_id' => $this->remote, 'remote_user' => (string) Str::uuid(), 'created_at' => now(), 'updated_at' => now()]);
        DB::table('fourmix_intelligence_agent_bindings')->insert(['subject' => 'user:1', 'alias' => 'assistant', 'connection_id' => $this->local,
            'grant_id' => $this->grant, 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs(new GenericUser(['id' => 1]));
    }

    /** @param array<string, mixed> $response */
    private function fake(string $action, array $response, int $status = 200): void
    {
        Http::preventStrayRequests();
        Http::fake(['https://platform.example.test/api/v3/native/laravel/synthetic/'.$this->remote.'/agents' => Http::response(['agents' => [['grant_id' => $this->grant]]]),
            'https://platform.example.test/api/v3/native/laravel/synthetic/'.$this->remote.'/'.$action => Http::response($response, $status)]);
    }

    /** @return array<string, mixed> */
    private function metadata(string $name = '資料.txt', string $mime = 'text/plain', int $size = 6): array
    {
        return ['id' => $this->attachment, 'name' => $name, 'mime' => $mime, 'size' => $size, 'expires_at' => 2000000000];
    }

    private function contentUrl(): string
    {
        return '/fourmix-intelligence/attachments/'.$this->conversation.'/'.$this->attachment.'/content?surface=page&alias=assistant';
    }

    public function test_upload_sends_owned_signed_agent_scope_and_file_content_without_returning_credentials(): void
    {
        $this->fake('agent_attachment_upload', ['conversation_id' => $this->conversation, 'attachment' => $this->metadata() + ['private_token' => 'secret']]);
        $requestId = (string) Str::uuid();
        $this->post('/fourmix-intelligence/attachments', ['surface' => 'page', 'alias' => 'assistant', 'request_id' => $requestId,
            'file' => UploadedFile::fake()->createWithContent('資料.txt', 'sample'), 'binding_id' => 'forged'], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('conversation_id', $this->conversation)->assertJsonPath('attachment.name', '資料.txt')->assertJsonMissing(['private_token' => 'secret']);
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachment_upload') && $request['binding_id'] === $this->binding
            && $request['grant_id'] === $this->grant && ! isset($request['host_agent_alias'], $request['allowed_operations'])
            && $request['request_id'] === $requestId && base64_decode($request['file']['content_base64'], true) === 'sample'
            && count($request->header('X-Fourmix-Signature')) === 1);
    }

    public function test_listing_intersects_remote_policy_and_strips_private_fields(): void
    {
        config()->set('fourmix-intelligence.attachments.extensions', ['txt', 'svg']);
        $this->fake('agent_attachments', ['data' => [$this->metadata() + ['object_key' => 'private']], 'policy' => [
            'extensions' => ['.txt', '.png', '.svg'], 'max_bytes' => 20 * 1024 * 1024, 'max_files' => 8, 'context_bytes' => 40 * 1024 * 1024, 'retention_days' => 7]]);
        $this->getJson('/fourmix-intelligence/attachments?surface=page&alias=assistant')->assertOk()->assertJsonPath('policy.extensions', ['txt'])
            ->assertJsonPath('policy.max_bytes', app(AttachmentPolicy::class)->local()['max_bytes'])->assertJsonPath('policy.max_files', 5)->assertJsonMissing(['object_key' => 'private']);
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachments') && $request['binding_id'] === $this->binding);
    }

    public function test_another_host_user_cannot_read_upload_or_delete_an_existing_users_attachments(): void
    {
        $this->fake('agent_attachment_content', ['attachment' => $this->metadata(), 'content_base64' => base64_encode('sample')]);
        $this->actingAs(new GenericUser(['id' => 2]));
        $this->getJson($this->contentUrl())->assertNotFound();
        $this->post('/fourmix-intelligence/attachments', ['surface' => 'page', 'alias' => 'assistant', 'request_id' => (string) Str::uuid(),
            'file' => UploadedFile::fake()->createWithContent('test.txt', 'sample')], ['Accept' => 'application/json'])->assertNotFound();
        $this->deleteJson('/fourmix-intelligence/attachments/'.$this->conversation.'/'.$this->attachment.'?surface=page&alias=assistant')->assertNotFound();
        Http::assertNothingSent();
    }

    public function test_revoked_connection_prevents_attachment_download(): void
    {
        $this->fake('agent_attachment_content', []);
        DB::table('fourmix_intelligence_connections')->where('id', $this->local)->update(['state' => 'revoked']);
        $this->getJson($this->contentUrl())->assertForbidden();
        Http::assertNothingSent();
    }

    #[DataProvider('invalidUploads')]
    public function test_invalid_or_active_file_types_are_rejected_before_upload(string $name, string $body): void
    {
        $this->fake('agent_attachment_upload', []);
        $this->post('/fourmix-intelligence/attachments', ['surface' => 'page', 'alias' => 'assistant', 'request_id' => (string) Str::uuid(),
            'file' => UploadedFile::fake()->createWithContent($name, $body)], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('file');
        Http::assertNothingSent();
    }

    /** @return array<string, array{string, string}> */
    public static function invalidUploads(): array
    {
        return ['svg' => ['script.svg', '<svg onload="alert(1)"></svg>'], 'html' => ['page.html', '<script>alert(1)</script>'],
            'fake-image' => ['image.png', 'not an image'], 'fake-pdf' => ['file.pdf', 'not a PDF'], 'binary-text' => ['binary.txt', "bad\0body"],
            'office-mismatch' => ['book.xlsx', 'not an Office archive']];
    }

    public function test_upload_policy_never_advertises_more_than_php_and_remote_can_accept(): void
    {
        $this->fake('agent_attachments', ['data' => [], 'policy' => ['extensions' => ['txt'], 'max_bytes' => 1024, 'max_files' => 8]]);
        $this->getJson('/fourmix-intelligence/attachments?surface=page&alias=assistant')->assertOk()->assertJsonPath('policy.max_bytes', 1024);
        $phpUpload = ini_get('upload_max_filesize');
        if (str_ends_with(strtoupper($phpUpload), 'M')) {
            $local = app(AttachmentPolicy::class)->local();
            self::assertLessThanOrEqual((int) $phpUpload * 1024 * 1024, $local['max_bytes']);
        }
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachments'));
    }

    public function test_local_size_limit_is_enforced_without_forwarding_content(): void
    {
        config()->set('fourmix-intelligence.attachments.max_bytes', 4);
        $this->fake('agent_attachment_upload', []);
        $this->post('/fourmix-intelligence/attachments', ['surface' => 'page', 'alias' => 'assistant', 'request_id' => (string) Str::uuid(),
            'file' => UploadedFile::fake()->createWithContent('test.txt', 'sample')], ['Accept' => 'application/json'])->assertStatus(413);
        Http::assertNothingSent();
    }

    public function test_downloads_use_authenticated_proxy_with_safe_attachment_headers(): void
    {
        $this->fake('agent_attachment_content', ['attachment' => $this->metadata(), 'content_base64' => base64_encode('sample')]);
        $response = $this->get($this->contentUrl())->assertOk()->assertContent('sample')->assertHeader('Content-Type', 'text/plain; charset=utf-8')
            ->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('Content-Security-Policy', "sandbox; default-src 'none'");
        self::assertStringStartsWith('attachment;', $response->headers->get('Content-Disposition'));
        self::assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachment_content') && $request['conversation_id'] === $this->conversation && $request['attachment_id'] === $this->attachment);
    }

    public function test_real_image_content_can_be_previewed_inline_without_public_storage(): void
    {
        $body = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR9kAAAAASUVORK5CYII=', true);
        $this->fake('agent_attachment_content', ['attachment' => $this->metadata('image.png', 'image/png', strlen($body)), 'content_base64' => base64_encode($body)]);
        $response = $this->get($this->contentUrl())->assertOk()->assertHeader('Content-Type', 'image/png');
        self::assertStringStartsWith('inline;', $response->headers->get('Content-Disposition'));
    }

    public function test_malicious_remote_metadata_cannot_be_turned_into_an_active_browser_document(): void
    {
        $this->fake('agent_attachment_content', ['attachment' => $this->metadata('script.html', 'text/html'), 'content_base64' => base64_encode('sample')]);
        $this->getJson($this->contentUrl())->assertStatus(502);
    }

    public function test_foreign_remote_attachment_id_or_truncated_body_is_rejected(): void
    {
        $this->fake('agent_attachment_content', ['attachment' => array_replace($this->metadata(), ['id' => (string) Str::uuid()]), 'content_base64' => base64_encode('sample')]);
        $this->getJson($this->contentUrl())->assertStatus(502);
        $this->fake('agent_attachment_content', ['attachment' => $this->metadata(), 'content_base64' => base64_encode('cut')]);
        $this->getJson($this->contentUrl())->assertStatus(502);
    }

    public function test_deleting_referenced_file_returns_safe_conflict_without_leaking_remote_body(): void
    {
        $this->fake('agent_attachment_delete', ['message' => 'private secret'], 409);
        $this->deleteJson('/fourmix-intelligence/attachments/'.$this->conversation.'/'.$this->attachment.'?surface=page&alias=assistant')
            ->assertConflict()->assertJsonPath('message', '添付は処理中または会話で使用済みのため、変更できません。')->assertDontSee('private secret');
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachment_delete') && $request['attachment_id'] === $this->attachment);
    }

    public function test_unknown_first_upload_returns_only_safe_recovery_conversation_and_no_remote_secrets(): void
    {
        $this->fake('agent_attachment_upload', ['conversation_id' => $this->conversation, 'state' => 'unknown', 'message' => 'private message', 'secret' => 'private secret'], 409);
        $this->post('/fourmix-intelligence/attachments', ['surface' => 'page', 'alias' => 'assistant', 'request_id' => (string) Str::uuid(),
            'file' => UploadedFile::fake()->createWithContent('test.txt', 'sample')], ['Accept' => 'application/json'])
            ->assertConflict()->assertJsonPath('conversation_id', $this->conversation)->assertJsonPath('state', 'unknown')
            ->assertJsonPath('message', '保存結果を確認できません。添付一覧を確認し、同じファイルを自動で再送しないでください。')->assertDontSee('private');
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachment_upload'));
    }

    public function test_upload_rejects_missing_idempotency_key_and_unauthenticated_user(): void
    {
        $this->fake('agent_attachment_upload', []);
        $this->post('/fourmix-intelligence/attachments', ['surface' => 'page', 'alias' => 'assistant', 'file' => UploadedFile::fake()->createWithContent('test.txt', 'sample')], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('request_id');
        auth()->guard()->forgetUser();
        $this->getJson('/fourmix-intelligence/attachments?surface=page&alias=assistant')->assertUnauthorized();
        Http::assertNothingSent();
    }

    public function test_office_documents_are_validated_by_archive_structure_and_macros_are_rejected(): void
    {
        $this->fake('agent_attachment_upload', ['conversation_id' => $this->conversation, 'attachment' => $this->metadata('book.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 300)]);
        $path = tempnam(sys_get_temp_dir(), 'fi-office-');
        $archive = new \ZipArchive;
        $archive->open($path, \ZipArchive::OVERWRITE);
        $archive->addFromString('[Content_Types].xml', '<Types/>');
        $archive->addFromString('xl/workbook.xml', '<workbook/>');
        $archive->close();
        try {
            $this->post('/fourmix-intelligence/attachments', ['surface' => 'page', 'alias' => 'assistant', 'request_id' => (string) Str::uuid(),
                'file' => UploadedFile::fake()->createWithContent('book.xlsx', file_get_contents($path))], ['Accept' => 'application/json'])->assertCreated();
            $archive->open($path);
            $archive->addFromString('xl/vbaProject.bin', 'macro');
            $archive->close();
            $this->post('/fourmix-intelligence/attachments', ['surface' => 'page', 'alias' => 'assistant', 'request_id' => (string) Str::uuid(),
                'file' => UploadedFile::fake()->createWithContent('macro.xlsx', file_get_contents($path))], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('file');
        } finally {
            unlink($path);
        }
        Http::assertSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachment_upload') && $request['file']['name'] === 'book.xlsx');
        Http::assertNotSent(fn ($request): bool => str_ends_with($request->url(), '/agent_attachment_upload') && $request['file']['name'] === 'macro.xlsx');
    }
}
