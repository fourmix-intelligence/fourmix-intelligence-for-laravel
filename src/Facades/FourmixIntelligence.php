<?php

namespace FourmixIntelligence\Laravel\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static \FourmixIntelligence\Laravel\Agent agent(?string $name = null)
 * @method static \FourmixIntelligence\Laravel\Connection connection(string $name)
 */
final class FourmixIntelligence extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'fourmix-intelligence';
    }
}
