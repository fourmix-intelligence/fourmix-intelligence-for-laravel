<?php

namespace FourmixIntelligence\Laravel\Tests;

use FourmixIntelligence\Laravel\FourmixIntelligenceServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

abstract class TestCase extends Orchestra
{
    protected function getPackageProviders($app): array { return [FourmixIntelligenceServiceProvider::class]; }
}

