<?php

namespace App\Http\Controllers;

use App\Intelligence\NoteAccess;
use FourmixIntelligence\Laravel\Tools\ToolContext;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): View
    {
        return view('notes.index', ['notes' => $request->user()->notes()->latest('id')->paginate(10)]);
    }

    public function show(Request $request, int $note, NoteAccess $notes): View
    {
        return view('notes.show', ['note' => $notes->find(new ToolContext('user:'.$request->user()->getAuthIdentifier()), $note)]);
    }
}
