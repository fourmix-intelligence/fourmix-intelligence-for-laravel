<?php

namespace FourmixIntelligence\Laravel;

use FourmixIntelligence\Laravel\Attachments\AttachmentPolicy;
use FourmixIntelligence\Laravel\Data\AgentResult;
use FourmixIntelligence\Laravel\Tools\IntegrationAccess;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

final class Agent
{
    /** @var array<string, mixed> */
    private array $businessContext = [];

    private ?Conversation $conversation = null;

    private ?ToolContext $userContext = null;

    private ?string $connectionName = null;

    private ?string $visitorId = null;

    /** @var array{connection_id:string, grant_id:string, connection_revision:int}|null */
    private ?array $expectedSelection = null;

    /** @var list<string> */
    private array $attachmentIds = [];

    public function __construct(private readonly string $name) {}

    public function onConnection(string $connection): self
    {
        $clone = clone $this;
        $clone->connectionName = $connection;

        return $clone;
    }

    /** @param array{connection_id:string, grant_id:string, connection_revision:int}|null $selection */
    public function expectSelection(?array $selection): self
    {
        $clone = clone $this;
        $clone->expectedSelection = $selection;

        return $clone;
    }

    /** The host generates this opaque customer identity; it is not the FI account owner. */
    public function forVisitor(string $id): self
    {
        if (preg_match('/^[a-zA-Z0-9_.:-]{1,128}$/D', $id) !== 1) {
            throw new \InvalidArgumentException('利用者の識別子を確認してください。');
        }
        $clone = clone $this;
        $clone->visitorId = $id;

        return $clone;
    }

    /** For trusted host code and jobs; never accept a subject supplied by the browser. */
    public function forUser(ToolContext $context): self
    {
        $clone = clone $this;
        $clone->userContext = $context;

        return $clone;
    }

    public function conversation(string $id): self
    {
        $clone = clone $this;
        $clone->conversation = new Conversation($id);

        return $clone;
    }

    /** @param array<string, mixed> $context */
    public function context(array $context): self
    {
        $clone = clone $this;
        $clone->businessContext = $context;

        return $clone;
    }

    /**
     * Attach existing private conversation files; ownership is checked by FI at execution.
     *
     * @param  list<string>  $ids
     */
    public function attachments(array $ids): self
    {
        $clone = clone $this;
        $clone->attachmentIds = $ids;

        return $clone;
    }

    public function ask(string $message): AgentResult
    {
        return $this->execute($message);
    }

    /** @param callable(array<string, mixed>): void $onEvent */
    public function stream(string $message, callable $onEvent): AgentResult
    {
        return $this->execute($message, $onEvent);
    }

    /** @param callable(array<string, mixed>): void|null $onEvent */
    private function execute(string $message, ?callable $onEvent = null): AgentResult
    {
        $context = $this->nativeContext();
        if ($context !== null) {
            $payload = ['message' => $message, 'context' => $this->businessContext, 'locale' => (string) config('app.locale', 'en')];
            if ($this->conversation !== null) {
                $payload['conversation_id'] = $this->conversation->id;
            }
            if ($this->attachmentIds !== []) {
                $payload['attachment_ids'] = $this->attachmentIds;
            }

            return AgentResult::fromArray($this->call($context, 'agent_chat', $payload, $onEvent));
        }

        throw new \LogicException('接続を利用するアプリケーションのアカウントを forUser() で指定してください。');
    }

    /** @return array<string, mixed> */
    public function conversations(): array
    {
        $context = $this->nativeContext();
        if ($context === null) {
            throw new \LogicException('会話一覧には関連付け済みのアプリケーション利用者が必要です。');
        }

        return $this->call($context, 'agent_history', []);
    }

    /** @return array<string, mixed> */
    public function history(?int $beforeId = null): array
    {
        if ($this->conversation === null) {
            throw new \LogicException('会話履歴を取得するには conversation() を指定してください。');
        }
        $context = $this->nativeContext();
        if ($context !== null) {
            return $this->call($context, 'agent_history', ['conversation_id' => $this->conversation->id, 'before_id' => $beforeId]);
        }

        throw new \LogicException('接続を利用するアプリケーションのアカウントを forUser() で指定してください。');
    }

    /** @return array<string, mixed> */
    public function files(): array
    {
        return $this->fileCall('agent_attachments', []);
    }

    /** @return array<string, mixed> */
    public function upload(UploadedFile $file, string $requestId): array
    {
        if (! Str::isUuid($requestId)) {
            throw new \InvalidArgumentException('添付の送信IDにはUUIDを指定してください。');
        }

        return $this->fileCall('agent_attachment_upload', ['request_id' => $requestId, 'file' => app(AttachmentPolicy::class)->encode($file)]);
    }

    /** @return array<string, mixed> */
    public function file(string $id): array
    {
        return $this->fileCall('agent_attachment_content', ['attachment_id' => $id]);
    }

    /** @return array<string, mixed> */
    public function deleteFile(string $id): array
    {
        return $this->fileCall('agent_attachment_delete', ['attachment_id' => $id]);
    }

    /** @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function fileCall(string $action, array $payload): array
    {
        $context = $this->nativeContext();
        if ($context === null) {
            throw new \LogicException('添付を利用するアプリケーションのアカウントを forUser() で指定してください。');
        }
        if (isset($payload['attachment_id']) && (! Str::isUuid($payload['attachment_id']) || $this->conversation === null)) {
            throw new \InvalidArgumentException('添付IDと会話を指定してください。');
        }

        return $this->call($context, $action, ['conversation_id' => $this->conversation?->id] + $payload);
    }

    /** @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function call(ToolContext $context, string $action, array $payload, ?callable $onEvent = null): array
    {
        if ($this->expectedSelection !== null) {
            $payload['expected_selection'] = $this->expectedSelection;
        }
        if ($this->visitorId !== null) {
            $payload['visitor_id'] = $this->visitorId;
        }
        $selection = app(AgentSelection::class);

        return $this->connectionName === null
            ? $selection->call($context, $this->name, $action, $payload, $onEvent)
            : $selection->callConnection($context, $this->connectionName, $this->name, $action, $payload, $onEvent);
    }

    private function nativeContext(): ?ToolContext
    {
        if ($this->userContext !== null) {
            return $this->userContext;
        }
        /** @var Request $request */
        $request = app('request');
        if ($request->user() !== null) {
            return app(IntegrationAccess::class)->context($request);
        }

        return null;
    }
}
