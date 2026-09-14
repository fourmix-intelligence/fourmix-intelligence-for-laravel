<?php

namespace FourmixIntelligence\Laravel\Exceptions;

final class ApiException extends FourmixIntelligenceException
{
    public function __construct(string $message, public readonly int $status = 0, public readonly ?string $requestId = null)
    {
        parent::__construct($message, $status);
    }
}

