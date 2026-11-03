<?php

$modelsDir = __DIR__ . '/app/Models';
$files = scandir($modelsDir);

foreach ($files as $file) {
    if (str_ends_with($file, '.php')) {
        $path = $modelsDir . '/' . $file;
        $content = file_get_contents($path);
        
        if ($file === 'User.php') {
            // Replace $fillable with $guarded for User.php
            $content = preg_replace('/protected\s+\$fillable\s*=\s*\[.*?\];/s', 'protected $guarded = [];', $content);
            file_put_contents($path, $content);
            echo "Updated User.php\n";
            continue;
        }

        // For other models
        $modified = false;

        // Make sure HasUuids is imported
        if (!str_contains($content, 'use Illuminate\Database\Eloquent\Concerns\HasUuids;')) {
            $content = str_replace('use Illuminate\Database\Eloquent\Model;', "use Illuminate\Database\Eloquent\Model;\nuse Illuminate\Database\Eloquent\Concerns\HasUuids;", $content);
            $modified = true;
        }

        // Add `use HasUuids;` inside the class
        if (!str_contains($content, 'use HasUuids;')) {
            $content = preg_replace('/class\s+[a-zA-Z0-9_]+\s+extends\s+Model\s*\{/', "$0\n    use HasUuids;\n", $content);
            $modified = true;
        }

        // Add `$guarded = [];` inside the class
        if (!str_contains($content, 'protected $guarded')) {
            $content = preg_replace('/class\s+[a-zA-Z0-9_]+\s+extends\s+Model\s*\{(\s*use\s+HasUuids;)?/', "$0\n    protected \$guarded = [];\n", $content);
            $modified = true;
        }

        if ($modified) {
            file_put_contents($path, $content);
            echo "Updated $file\n";
        }
    }
}
