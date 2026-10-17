<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['application' => 'Ithraa B2C API']));
