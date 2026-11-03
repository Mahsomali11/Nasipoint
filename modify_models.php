<?php
$dir = __DIR__ . '/app/Models';
$files = glob($dir . '/*.php');

foreach ($files as $file) {
    if (basename($file) === 'User.php') continue; // Skip User model

    $content = file_get_contents($file);
    
    // Add HasUuids trait import
    if (strpos($content, 'HasUuids') === false) {
        $content = str_replace(
            "use Illuminate\Database\Eloquent\Model;",
            "use Illuminate\Database\Eloquent\Model;\nuse Illuminate\Database\Eloquent\Concerns\HasUuids;",
            $content
        );
        
        $content = str_replace(
            "use HasFactory;",
            "use HasFactory, HasUuids;\n\n    protected \$guarded = [];",
            $content
        );
        
        // For ReturnModel, set table name manually since it differs from default plural
        if (basename($file) === 'ReturnModel.php') {
             $content = str_replace(
                "protected \$guarded = [];",
                "protected \$guarded = [];\n    protected \$table = 'returns';",
                $content
             );
        }
    }

    file_put_contents($file, $content);
}
echo "Models updated successfully.\n";
