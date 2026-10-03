<?php

namespace FourmixIntelligence\Laravel\View\Components;

use FourmixIntelligence\Laravel\Tools\IntegrationAccess;
use FourmixIntelligence\Laravel\UiSurfaces;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

final class Surface extends Component
{
    public function __construct(private UiSurfaces $surfaces, private IntegrationAccess $access, public string $name = 'floating', public string $initialPrompt = '') {}

    /**
     * Get the view / contents that represent the component.
     */
    public function shouldRender(): bool
    {
        return request()->user() !== null && $this->surfaces->enabled($this->access->context(request()), $this->name);
    }

    public function render(): View
    {
        $definition = $this->surfaces->definition($this->name);
        /** @var view-string $view */
        $view = $definition['view'] ?? 'fourmix-intelligence::components.surface';

        return view($view, ['surface' => $this->name, 'alias' => $definition['alias'], 'surfaceType' => $definition['type'], 'title' => $definition['title']]);
    }
}
